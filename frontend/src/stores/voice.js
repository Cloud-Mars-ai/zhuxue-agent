import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'ai-tutor-voice-preference'

export const VOICE_PRESETS = [
  {
    id: 'qinhenvsheng',
    name: '清和 · 亲和女声',
    desc: '温和清晰，适合概念讲解',
    instruction: '用清晰、温和、有节奏的课堂讲解语气朗读，专业、自然，关键概念稍作停顿。',
  },
  {
    id: 'linjiajiejie',
    name: '知夏 · 邻家姐姐',
    desc: '舒缓亲切，适合案例讲述',
    instruction: '用亲切、舒缓、有交流感的语气讲解，像面对面辅导学生，句子之间留出自然停顿。',
  },
  {
    id: 'yuanqishaonv',
    name: '小满 · 元气少女',
    desc: '明快有活力，适合轻量课程',
    instruction: '用明快、有活力但仍然清晰专业的课堂语气朗读，避免过度夸张。',
  },
  {
    id: 'cixingnansheng',
    name: '远山 · 磁性男声',
    desc: '沉稳有力，适合理论推演',
    instruction: '用沉稳、清晰、有逻辑重音的男声讲解，概念定义和判断链要读得明确。',
  },
  {
    id: 'huolinvsheng',
    name: '活力女声',
    desc: '节奏鲜明，适合冲刺复习',
    instruction: '用清晰、利落、有节奏的女声讲解，突出考点、辨析和下一步动作。',
  },
]

export const DEFAULT_VOICE_ID = VOICE_PRESETS[0].id

function loadPreference() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function presetById(id) {
  return VOICE_PRESETS.find((voice) => voice.id === id) || VOICE_PRESETS[0]
}

export const useVoiceStore = defineStore('voice', () => {
  const saved = loadPreference()
  const enabled = ref(!!saved?.enabled)
  const voiceId = ref(presetById(saved?.voiceId).id)
  const speed = ref(Math.min(1.15, Math.max(0.8, Number(saved?.speed) || 0.98)))

  const preset = computed(() => presetById(voiceId.value))
  const ttsConfig = computed(() => ({
    ttsVoice: preset.value.id,
    ttsInstruction: preset.value.instruction,
    ttsSpeed: speed.value,
  }))

  function persist() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          enabled: enabled.value,
          voiceId: voiceId.value,
          speed: speed.value,
        }),
      )
    } catch {
      // 无法持久化时仅保留当前会话
    }
  }

  function setEnabled(value) {
    enabled.value = !!value
    persist()
  }

  function toggle() {
    setEnabled(!enabled.value)
  }

  function setVoice(id) {
    voiceId.value = presetById(id).id
    persist()
  }

  function setSpeed(value) {
    speed.value = Math.min(1.15, Math.max(0.8, Number(value) || 0.98))
    persist()
  }

  return {
    enabled,
    voiceId,
    speed,
    preset,
    ttsConfig,
    setEnabled,
    toggle,
    setVoice,
    setSpeed,
  }
})
