import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'ai-tutor-model-config'

/**
 * 默认模型配置：DeepSeek 通用对话 + 阶跃星辰语音合成
 * 生产构建优先使用同源 /api/ai/* 代理，密钥只存在于 Node 服务端环境变量。
 * 开发模式可在模型设置页临时填写本机密钥；不要把密钥写回源码。
 */
export const DEFAULT_MODEL_CONFIG = {
  configVersion: '2026-11-04-server-proxy-v1',
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
    '你是《管理学》课程的 AI 助教，服务对象是经管专业学生与授课教师。\n' +
    '回答要求：\n' +
    '1. 紧扣《管理学》教材与课件内容，涉及其他领域时先说明再简要展开；\n' +
    '2. 解释概念时搭配一个学习或工作中的例子，帮助理解；\n' +
    '3. 学生请教作业时采用引导式提问（苏格拉底式），提示思路而非直接给答案；\n' +
    '4. 回答控制在 300 字以内，条理清晰，必要时分点列出；\n' +
    '5. 引用教材内容时注明所在章节。',
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
