import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const THEME_KEY = 'ai-tutor-theme'

/** 双皮肤定义（《学生端 UI 双风格设计方案》第 5 节推荐路径） */
export const THEMES = [
  { value: 'yun', label: '云课笺', desc: '暖纸卡片 · 默认皮肤 · 日常高频' },
  { value: 'mo', label: '墨读', desc: '学报排版 · 阅读模式 · 重阅读页面' },
]

export const DEFAULT_THEME = 'yun'

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
  } catch {
    // 无法持久化时仅当前会话生效
  }
}

/** 将主题写到 <html data-theme>，驱动 tokens.css / skins.css 换肤 */
function apply(theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

function normalize(value) {
  return THEMES.some((t) => t.value === value) ? value : DEFAULT_THEME
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(normalize(safeGetItem(THEME_KEY)))
  const isMo = computed(() => theme.value === 'mo')
  const isYun = computed(() => theme.value === 'yun')
  const label = computed(() => THEMES.find((t) => t.value === theme.value)?.label || '')
  const desc = computed(() => THEMES.find((t) => t.value === theme.value)?.desc || '')

  function setTheme(value) {
    const next = normalize(value)
    theme.value = next
    apply(next)
    safeSetItem(THEME_KEY, next)
  }

  /** 一键切换两套皮肤 */
  function toggle() {
    setTheme(theme.value === 'mo' ? 'yun' : 'mo')
  }

  return { theme, isMo, isYun, label, desc, setTheme, toggle }
})
