import { useModelStore } from '@/stores/model'
import { useUserStore } from '@/stores/user'

const TIMEOUT_MS = 60000
// 模型无记忆，每次请求携带最近若干条历史作为上下文
const MAX_HISTORY = 20

function buildMessages(messages, systemPrompt) {
  const list = Array.isArray(messages) ? messages.slice(-MAX_HISTORY) : []
  return systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...list]
    : list
}

/**
 * 学科背景注入（M5 差异化引擎）
 * 让 AI 讲解、练习、出题的案例取材贴合学生学科语境；
 * 任务型提示词（options.systemPrompt）内部已自行处理背景，不再重复注入
 */
export function buildDisciplineSuffix() {
  const userStore = useUserStore()
  const d = userStore.discipline
  if (!d) return ''
  if (d === '工科类') {
    return (
      '\n\n【学生背景】当前学生为工科背景（选修本课，侧重实际运用）：' +
      '解释概念时优先搭配工程管理、生产现场、项目协作等工程语境实例' +
      '（例如用生产线调度解释计划职能，用项目里程碑解释控制过程）。'
    )
  }
  if (d === '管理类') {
    return '\n\n【学生背景】当前学生为管理类背景：可用典型企业管理案例辅助解释概念。'
  }
  return '\n\n【学生背景】当前学生学科背景为"其他"：请使用通用、跨领域的例子解释概念。'
}

function friendlyError(status, detail, model) {
  const suffix = detail ? `：${String(detail).slice(0, 150)}` : ''
  switch (status) {
    case 401:
      return `模型密钥无效或已过期，请到「模型接入」页面检查${suffix}`
    case 403:
      return `该密钥没有访问权限，请到「模型接入」页面检查${suffix}`
    case 404:
      return `接口或模型不存在（${model}），请到「模型接入」页面检查${suffix}`
    case 429:
      return `请求过于频繁或额度不足，请稍后再试${suffix}`
    default:
      return `模型服务返回错误（HTTP ${status}）${suffix}`
  }
}

/**
 * 调用 OpenAI 兼容的 chat completions 接口
 * @param {Array<{role:string, content:string}>} messages 对话历史（不含 system）
 * @param {Object} [options]
 * @param {Object} [options.config] 覆盖 store 中的配置（用于保存前测试）
 * @param {string} [options.systemPrompt] 任务型系统提示词（提供时原样使用，不再注入学科背景）
 * @param {number} [options.temperature] 覆盖温度
 * @param {AbortSignal} [options.signal] 外部中断信号
 * @param {number} [options.timeout] 超时毫秒数，默认 60s
 * @returns {Promise<string>} 助手回复文本
 */
export async function sendChat(messages, options = {}) {
  const store = useModelStore()
  const cfg = { ...store.config, ...(options.config || {}) }

  if (!cfg.apiKey) {
    throw new Error('尚未配置模型密钥，请先到「模型接入」页面完成配置')
  }
  if (!cfg.baseUrl) {
    throw new Error('尚未配置接口地址，请先到「模型接入」页面完成配置')
  }
  if (!cfg.model) {
    throw new Error('尚未配置模型名称，请先到「模型接入」页面完成配置')
  }

  const url = `${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`
  const temperature = Number.isFinite(Number(options.temperature))
    ? Number(options.temperature)
    : Number.isFinite(Number(cfg.temperature))
      ? Number(cfg.temperature)
      : 0.3

  // 答疑场景：store 系统提示词 + 学科背景注入；任务场景：使用任务提示词原文
  const systemPrompt =
    options.systemPrompt != null
      ? options.systemPrompt
      : `${cfg.systemPrompt || ''}${buildDisciplineSuffix()}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeout ?? TIMEOUT_MS)

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: buildMessages(messages, systemPrompt),
        temperature,
        max_tokens: 2048,
      }),
      signal: options.signal ?? controller.signal,
    })

    if (!resp.ok) {
      let detail = ''
      try {
        const data = await resp.json()
        detail = data?.error?.message || data?.message || ''
      } catch {
        // 非 JSON 响应体，忽略
      }
      throw new Error(friendlyError(resp.status, detail, cfg.model))
    }

    const data = await resp.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content || !content.trim()) {
      throw new Error('模型未返回有效内容，请重试或更换模型')
    }
    return content.trim()
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('模型响应超时，请稍后重试')
    }
    if (err.name === 'TypeError') {
      throw new Error('无法连接模型服务，请检查接口地址与网络（或该服务不允许浏览器跨域访问）')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
