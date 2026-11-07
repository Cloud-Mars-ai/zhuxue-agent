import { useModelStore } from '@/stores/model'
import { useUserStore } from '@/stores/user'
import { useTraceStore, hashText } from '@/stores/trace'
import { useKnowledgeStore } from '@/stores/knowledge'
import { isEnabled } from '@/config/flags'
import { parseJsonLoose } from '@/utils/json'
import { assertContentSafe } from '@/utils/contentSafety'
import { repairDeep, repairText } from '@/utils/textRepair'
import { TEXT_INTEGRITY_RULE } from './prompts/shared'
import {
  inferLearnerProfile,
  learnerProfileGuide,
  normalizeLearnerProfile,
} from '@/utils/learnerProfile'

const TIMEOUT_MS = 60000
// 模型无记忆，每次请求携带最近若干条历史作为上下文
const MAX_HISTORY = 20
const DEFAULT_MAX_TOKENS = 2048

/**
 * 输入侧净化：用户从损坏 PDF 复制来的乱码（狓→x、狀→n…）在进入模型前修复，
 * 既避免模型复述乱码，也避免它把稀有字当合法上下文继续放大。
 * 详见 utils/textRepair.js 背景说明；修复是确定性的，可重复执行。
 */
function repairMessages(messages) {
  if (!Array.isArray(messages)) return messages
  return messages.map((message) =>
    message && typeof message.content === 'string'
      ? { ...message, content: repairText(message.content).text }
      : message,
  )
}

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

export function buildStudyModeSuffix(mode) {
  if (mode === 'sprint') {
    return (
      '\n\n【学习模式：考前冲刺】只围绕当前章节的高频考点、易错辨析和可考表达组织答案；' +
      '压缩背景铺陈，明确“先记什么、怎么答”，不要主动扩展整门课。'
    )
  }
  if (mode === 'course') {
    return (
      '\n\n【学习模式：正常上课】跟随学校课程进度，讲清概念、例子、练习与后续衔接；' +
      '不要为了应试而跳过理解过程。'
    )
  }
  return ''
}

function buildLearnerSuffix(messages, chapter = '', materialText = '') {
  const recentUserText = (Array.isArray(messages) ? messages : [])
    .filter((message) => message.role === 'user')
    .slice(-3)
    .map((message) => message.content)
    .join('\n')
  const profile = normalizeLearnerProfile(
    inferLearnerProfile({
      objective: recentUserText,
      chapter,
      materialText,
    }),
  )
  return (
    '\n\n【本轮学习者自适应规则】\n' +
    learnerProfileGuide(profile) +
    '\n上述画像只是依据当前线索的临时判断；一旦对话出现新信息，必须更新语言和难度。'
  )
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shouldRetry(status) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504
}

/** 写轨迹：任何异常都不能影响主流程 */
function recordTrace(record) {
  try {
    const trace = useTraceStore()
    let studentId = ''
    try {
      studentId = useUserStore().user?.id || ''
    } catch {
      // 未登录场景忽略
    }
    trace.add({ studentId, ...record })
  } catch {
    // Pinia 未就绪或存储不可用时静默跳过
  }
}

/**
 * 调用 OpenAI 兼容接口，返回文本 + 运行元数据（用于轨迹与延迟统计）
 * @param {Array<{role:string, content:string}>} messages
 * @param {Object} [options]
 * @param {Object} [options.config] 覆盖 store 中的配置（用于保存前测试）
 * @param {string} [options.systemPrompt] 任务型系统提示词（提供时原样使用，不再注入学科背景）
 * @param {number} [options.temperature]
 * @param {number} [options.maxTokens] 输出上限，默认 2048；长任务请显式调大
 * @param {'json_object'|undefined} [options.responseFormat] 结构化输出模式
 * @param {AbortSignal} [options.signal]
 * @param {number} [options.timeout]
 * @param {number} [options.retry] 可重试错误的最大重试次数，默认 1
 * @param {string} [options.task] 任务名（写入轨迹）
 * @param {string} [options.kind] 轨迹类型
 * @param {Object} [options.traceRefs] 轨迹关联信息
 * @param {string} [options.promptVersion] 提示词版本
 * @param {boolean} [options.skipTrace] 测试连接等场景不写轨迹
 * @returns {Promise<{text:string, model:string, latencyMs:number, usage:Object|null}>}
 */
export async function sendChatDetailed(messages, options = {}) {
  const store = useModelStore()
  const cfg = { ...store.config, ...(options.config || {}) }
  const useProxy = !!store.serverProxyActive && !options.forceDirect
  const safeMessages = repairMessages(messages)

  assertContentSafe(
    (Array.isArray(safeMessages) ? safeMessages : [])
      .map((message) => `${message.role || ''}:${message.content || ''}`)
      .join('\n'),
    '模型请求',
  )

  if (!cfg.apiKey && !useProxy) {
    throw new Error('尚未配置模型密钥，请先到「模型接入」页面完成配置')
  }
  if (!cfg.baseUrl) {
    throw new Error('尚未配置接口地址，请先到「模型接入」页面完成配置')
  }
  if (!cfg.model) {
    throw new Error('尚未配置模型名称，请先到「模型接入」页面完成配置')
  }

  const url = useProxy
    ? '/api/ai/chat'
    : `${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`
  const temperature = Number.isFinite(Number(options.temperature))
    ? Number(options.temperature)
    : Number.isFinite(Number(cfg.temperature))
      ? Number(cfg.temperature)
      : 0.3
  const maxTokens = Number.isFinite(Number(options.maxTokens))
    ? Math.max(64, Number(options.maxTokens))
    : DEFAULT_MAX_TOKENS

  // 答疑场景：store 系统提示词 + 学科背景注入；任务场景：使用任务提示词原文
  const systemPrompt =
    options.systemPrompt != null
      ? options.systemPrompt
      : `${cfg.systemPrompt || ''}${buildDisciplineSuffix()}`

  // 资料第一：命中知识库时把材料片段注入系统提示词（带来源标签）
  // 抗乱码规则对所有路径生效：材料 PDF 文本层损坏时，模型容易复述/放大稀有字
  let finalSystemPrompt = `${systemPrompt}${buildStudyModeSuffix(
    options.studyMode,
  )}\n\n${TEXT_INTEGRITY_RULE}`
  let knowledgeChunks = []
  let knowledgeText = ''
  if (options.useKnowledge && isEnabled('knowledgeBase')) {
    try {
      const lastUser = [...(Array.isArray(safeMessages) ? safeMessages : [])]
        .reverse()
        .find((m) => m.role === 'user')?.content
      const ctx = await useKnowledgeStore().buildContext({
        chapter: options.chapter || '',
        query: lastUser || '',
      })
      if (ctx.text) {
        knowledgeText = ctx.text
        finalSystemPrompt = `${systemPrompt}${buildStudyModeSuffix(
          options.studyMode,
        )}\n\n${ctx.text}`
        knowledgeChunks = ctx.chunks.map((c) => c.id)
      }
    } catch {
      // 知识库不可用时退回通用回答，不阻塞主流程
    }
  }
  if (options.systemPrompt == null) {
    finalSystemPrompt += buildLearnerSuffix(
      safeMessages,
      options.chapter || '',
      knowledgeText,
    )
  }

  const maxAttempts = Number.isFinite(Number(options.retry)) ? Number(options.retry) : 1
  let attempt = 0
  let lastError = null

  while (attempt <= maxAttempts) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), options.timeout ?? TIMEOUT_MS)
    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: useProxy
          ? { 'Content-Type': 'application/json' }
          : {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cfg.apiKey}`,
            },
        body: JSON.stringify({
          model: cfg.model,
          messages: buildMessages(safeMessages, finalSystemPrompt),
          temperature,
          max_tokens: maxTokens,
          ...(options.reasoningEffort &&
          (cfg.provider === 'stepfun' || String(cfg.model || '').startsWith('step-'))
            ? { reasoning_effort: options.reasoningEffort }
            : {}),
          ...(options.responseFormat
            ? { response_format: { type: options.responseFormat } }
            : {}),
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
        const err = new Error(friendlyError(resp.status, detail, cfg.model))
        err.status = resp.status
        throw err
      }

      const data = await resp.json()
      const content = data?.choices?.[0]?.message?.content
      if (!content || !content.trim()) {
        throw new Error('模型未返回有效内容，请重试或更换模型')
      }

      // 输出侧修复：模型复述或放大乱码时在这里拦截（详见 utils/textRepair.js）
      const repaired = repairText(content)
      const text = (repaired.changed ? repaired.text : content).trim()
      assertContentSafe(text, '模型返回内容')
      const latencyMs = Math.round(
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt,
      )
      const usage = data?.usage || null

      if (!options.skipTrace) {
        recordTrace({
          kind: options.kind || 'chat',
          task: options.task || '',
          refs: { ...(options.traceRefs || {}), knowledgeChunks },
          promptVersion: options.promptVersion || '',
          model: cfg.model,
          latencyMs,
          ok: true,
          inputHash: hashText(JSON.stringify(safeMessages)),
          outputHash: hashText(text),
        })
      }

      return { text, model: cfg.model, latencyMs, usage }
    } catch (err) {
      lastError = err
      const retryable =
        (err.status && shouldRetry(err.status)) ||
        err.name === 'TypeError' ||
        (err.name === 'AbortError' && attempt === 0 && options.retryOnTimeout)
      if (retryable && attempt < maxAttempts) {
        attempt += 1
        await sleep(700)
        continue
      }

      let message = err.message
      if (err.name === 'AbortError') {
        message = '模型响应超时，请稍后重试'
      } else if (err.name === 'TypeError') {
        message = '无法连接模型服务，请检查接口地址与网络（或该服务不允许浏览器跨域访问）'
      }

      const latencyMs = Math.round(
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt,
      )
      if (!options.skipTrace) {
        recordTrace({
          kind: options.kind || 'chat',
          task: options.task || '',
          refs: { ...(options.traceRefs || {}), knowledgeChunks },
          promptVersion: options.promptVersion || '',
          model: cfg.model,
          latencyMs,
          ok: false,
          error: message,
          inputHash: hashText(JSON.stringify(safeMessages)),
        })
      }
      throw new Error(message)
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError || new Error('模型调用失败')
}

/**
 * 只返回文本的兼容接口（原有调用方无需改动）
 * @returns {Promise<string>}
 */
export async function sendChat(messages, options = {}) {
  const result = await sendChatDetailed(messages, options)
  return result.text
}

/**
 * 需要结构化结果的任务：返回解析后的 JSON 与原始文本
 * 解析失败时 data 为 null，由调用方决定是否降级。
 * JSON 内所有字符串（含对象键）会再过一遍深修复，双保险且幂等。
 */
export async function sendChatJSON(messages, options = {}) {
  const result = await sendChatDetailed(messages, options)
  const data = parseJsonLoose(result.text)
  return { data: data == null ? data : repairDeep(data), text: result.text, meta: result }
}
