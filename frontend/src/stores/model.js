import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'ai-tutor-model-config'

/**
 * 默认模型配置：DeepSeek 通用对话 + 阶跃星辰语音合成
 * 生产构建优先使用同源 /api/ai/* 代理，密钥只存在于 Node 服务端环境变量。
 * 开发模式可在模型设置页临时填写本机密钥；不要把密钥写回源码。
 */
export const DEFAULT_MODEL_CONFIG = {
  configVersion: '2026-11-06-adaptive-learner-v2',
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-chat',
  temperature: 0.3,
  ttsBaseUrl: 'https://api.stepfun.com/v1',
  ttsApiKey: '',
  ttsModel: 'stepaudio-3-tts',
  ttsVoice: 'qinhenvsheng',
  ttsSpeed: 0.98,
  ttsInstruction: '用清晰、温和、有节奏的课堂讲解语气朗读，专业但自然。',
  systemPrompt:
    '你是一名跨学科 AI 助教，服务对象可能是中小学生、大学生、教师、职业学习者或自学者。\n' +
    '核心原则：\n' +
    '1. 不预设课程、学科、专业或年级。每轮先根据用户需求、问题中的术语、学生自述以及上传资料，判断真正要学的主题、知识范围和可能年级；用户明确提供的信息优先。\n' +
    '2. 相关内容以本轮上传资料或教师确认材料为第一依据；材料不足时明确说明，不编造教材、页码、作者观点或材料外事实。\n' +
    '3. 根据推断学段调整语言和方式：小学多用实物、故事和分步示范；初中多用形象类比、模型和“改变一个条件看结果”的交互演示；高中强调条件、推导和变式；大学及职业学习使用规范术语、材料证据、案例判断和批判性追问。\n' +
    '4. 低年级回答宜短、具体、一次只推进一个知识点；高年级可展开框架与论证。若年级线索不足，先采用中性清晰表达并说明当前假设，不要强行贴标签。\n' +
    '5. 引导学生自己思考，但不机械套用固定追问；学生要作业答案时给判断框架和下一步，不直接代做。\n' +
    '6. 回答长度随任务变化；引用材料时说明来源标题或章节，不自行补写页码。',
}

function isLegacyDefaultPrompt(value) {
  const prompt = String(value || '')
  return (
    prompt.includes('你是《管理学》课程的 AI 助教') ||
    (prompt.includes('紧扣《管理学》教材与课件内容') &&
      prompt.includes('回答控制在 300 字以内'))
  )
}

/** DeepSeek 常用对话模型，供配置页下拉选择 */
export const DEEPSEEK_MODELS = ['deepseek-chat', 'deepseek-reasoner']

/** 历史 StepFun 模型保留，方便手动切回 */
export const STEPFUN_MODELS = ['step-5-preview', 'step-3.5-flash', 'step-3.7-flash']

export const STEPFUN_TTS_MODELS = [
  'stepaudio-3-tts',
  'stepaudio-2.5-tts',
  'step-tts-mini',
  'step-tts-2',
]

// file:// 协议下部分浏览器会禁用 localStorage，包一层静默降级
function safeGetItem(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key, value) {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function loadFromStorage() {
  const raw = safeGetItem(STORAGE_KEY)
  if (!raw) return { ...DEFAULT_MODEL_CONFIG }
  try {
    // 与默认配置合并，旧版本缺少的字段自动补齐
    const stored = JSON.parse(raw)
    const merged = { ...DEFAULT_MODEL_CONFIG, ...stored }
    if (stored.configVersion !== DEFAULT_MODEL_CONFIG.configVersion) {
      merged.configVersion = DEFAULT_MODEL_CONFIG.configVersion
      merged.provider = DEFAULT_MODEL_CONFIG.provider
      merged.baseUrl = DEFAULT_MODEL_CONFIG.baseUrl
      merged.apiKey = DEFAULT_MODEL_CONFIG.apiKey
      merged.model = DEFAULT_MODEL_CONFIG.model
      merged.temperature = DEFAULT_MODEL_CONFIG.temperature
      // 只迁移旧版内置人设，保留用户自己改过的 System Prompt。
      if (!stored.systemPrompt || isLegacyDefaultPrompt(stored.systemPrompt)) {
        merged.systemPrompt = DEFAULT_MODEL_CONFIG.systemPrompt
      }
      merged.ttsApiKey = DEFAULT_MODEL_CONFIG.ttsApiKey
      if (!stored.ttsBaseUrl) merged.ttsBaseUrl = DEFAULT_MODEL_CONFIG.ttsBaseUrl
      if (!stored.ttsModel) merged.ttsModel = DEFAULT_MODEL_CONFIG.ttsModel
      if (!stored.ttsVoice) merged.ttsVoice = DEFAULT_MODEL_CONFIG.ttsVoice
      if (!stored.ttsSpeed) merged.ttsSpeed = DEFAULT_MODEL_CONFIG.ttsSpeed
      if (!stored.ttsInstruction) merged.ttsInstruction = DEFAULT_MODEL_CONFIG.ttsInstruction
      safeSetItem(STORAGE_KEY, JSON.stringify(merged))
    }
    return merged
  } catch {
    return { ...DEFAULT_MODEL_CONFIG }
  }
}

/**
 * 模型接入配置：AI 助教 / AI 答疑等功能共用
 * 配置持久化在浏览器 localStorage，换设备或清缓存后需重新填写
 */
export const useModelStore = defineStore('model', () => {
  const config = ref(loadFromStorage())

  const serverProxyActive = computed(
    () =>
      import.meta.env.PROD &&
      typeof window !== 'undefined' &&
      window.location.protocol.startsWith('http') &&
      (import.meta.env.BASE_URL === './' || import.meta.env.BASE_URL === '/'),
  )

  const isConfigured = computed(
    () =>
      !!(config.value.baseUrl && config.value.model) &&
      (!!config.value.apiKey || serverProxyActive.value),
  )
  const isTtsConfigured = computed(
    () =>
      !!(config.value.ttsBaseUrl && config.value.ttsModel) &&
      (!!config.value.ttsApiKey || serverProxyActive.value),
  )

  /** 保存（合并式更新，立即持久化） */
  function updateConfig(patch) {
    config.value = { ...config.value, ...patch }
    safeSetItem(STORAGE_KEY, JSON.stringify(config.value))
  }

  /** 恢复默认配置（DeepSeek 文本 + StepAudio 语音）并持久化 */
  function resetConfig() {
    config.value = { ...DEFAULT_MODEL_CONFIG }
    safeSetItem(STORAGE_KEY, JSON.stringify(config.value))
  }

  return {
    config,
    serverProxyActive,
    isConfigured,
    isTtsConfigured,
    updateConfig,
    resetConfig,
  }
})
