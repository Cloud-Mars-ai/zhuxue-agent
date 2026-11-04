import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const THEME_KEY = 'ai-tutor-theme'

/** 双皮肤定义：澄蓝工作台 + 纸感学习台 */
export const THEMES = [
  { value: 'blue', label: '澄蓝', desc: '冷白蓝雾 · 默认皮肤 · 轻盈学习工作台' },
  { value: 'yun', label: '纸感', desc: '浅卡其纸面 · 靛蓝强调 · 日常学习工作台' },
]

export const DEFAULT_THEME = 'yun'
export const TEACHER_DEFAULT_THEME = 'blue'
export const THEME_EXPLICIT_KEY = 'ai-tutor-theme-explicit'

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

function storedUserRole() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem('ai-tutor-user') || 'null')
    return parsed?.role || ''
  } catch {
    return ''
  }
}

function preferredThemeForRole(role = '') {
  return ['teacher', 'admin', 'ta'].includes(role)
    ? TEACHER_DEFAULT_THEME
    : DEFAULT_THEME
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
  const explicitTheme = safeGetItem(THEME_EXPLICIT_KEY) === '1'
  const initialTheme = explicitTheme
    ? normalize(safeGetItem(THEME_KEY))
    : preferredThemeForRole(storedUserRole())
  const theme = ref(initialTheme)
  const isMo = computed(() => false)
  const isBlue = computed(() => theme.value === 'blue')
  const isYun = computed(() => theme.value === 'yun')
  const label = computed(() => THEMES.find((t) => t.value === theme.value)?.label || '')
  const desc = computed(() => THEMES.find((t) => t.value === theme.value)?.desc || '')

  function setTheme(value, { explicit = true } = {}) {
    const next = normalize(value)
    theme.value = next
    apply(next)
    if (explicit) {
      safeSetItem(THEME_KEY, next)
      safeSetItem(THEME_EXPLICIT_KEY, '1')
    }
  }

  /** 一键切换两套皮肤 */
  function toggle() {
    setTheme(theme.value === 'blue' ? 'yun' : 'blue')
  }

  function applyRoleDefault(role) {
    if (safeGetItem(THEME_EXPLICIT_KEY) === '1') return
    setTheme(preferredThemeForRole(role), { explicit: false })
  }

  return {
    theme,
    isMo,
    isBlue,
    isYun,
    label,
    desc,
    setTheme,
    toggle,
    applyRoleDefault,
  }
})
