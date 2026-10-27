import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'ai-tutor-model-config'

/**
 * 默认模型配置：阶跃星辰（StepFun）OpenAI 兼容接口
 * 密钥由项目负责人提供，仅用于竞赛演示；可在「模型接入」页随时修改
 */
export const DEFAULT_MODEL_CONFIG = {
  provider: 'stepfun',
  baseUrl: 'https://api.stepfun.com/v1',
  apiKey: '3E1uzgEugYnhZ6ptBQpNX73kNjYSh9eCa2ykFYbqXqrpswBbefVAX9AXVaAp0BlK7',
  model: 'step-3.5-flash',
  temperature: 0.3,
  systemPrompt:
    '你是《管理学》课程的 AI 助教，服务对象是经管专业学生与授课教师。\n' +
    '回答要求：\n' +
    '1. 紧扣《管理学》教材与课件内容，涉及其他领域时先说明再简要展开；\n' +
    '2. 解释概念时搭配一个学习或工作中的例子，帮助理解；\n' +
    '3. 学生请教作业时采用引导式提问（苏格拉底式），提示思路而非直接给答案；\n' +
    '4. 回答控制在 300 字以内，条理清晰，必要时分点列出；\n' +
    '5. 引用教材内容时注明所在章节。',
}

/** 阶跃星辰常用对话模型，供配置页下拉选择 */
export const STEPFUN_MODELS = [
  'step-3.5-flash',
  'step-3.7-flash',
  'step-3.5-flash-2603',
  'step-router-v1',
  'step-5-preview',
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
    return { ...DEFAULT_MODEL_CONFIG, ...JSON.parse(raw) }
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

  const isConfigured = computed(
    () => !!(config.value.apiKey && config.value.baseUrl && config.value.model),
  )

  /** 保存（合并式更新，立即持久化） */
  function updateConfig(patch) {
    config.value = { ...config.value, ...patch }
    safeSetItem(STORAGE_KEY, JSON.stringify(config.value))
  }

  /** 恢复默认配置（阶跃星辰）并持久化 */
  function resetConfig() {
    config.value = { ...DEFAULT_MODEL_CONFIG }
    safeSetItem(STORAGE_KEY, JSON.stringify(config.value))
  }

  return {
    config,
    isConfigured,
    updateConfig,
    resetConfig,
  }
})
