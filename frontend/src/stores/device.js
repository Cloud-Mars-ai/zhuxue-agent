import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  BREAKPOINTS,
  DEVICE_TREES,
  detectDeviceType,
  getViewportWidth,
  matchDeviceType,
  treeOf,
} from '@/utils/device'

/** 手动端口选择的持久化键：'mobile' | 'web'，为空表示自动识别 */
export const DEVICE_KEY = 'ai-tutor-device'

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
    // 隐私模式等无法持久化时，仅当前会话生效
  }
}

function safeRemoveItem(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // 忽略
  }
}

/** 将设备类型写到 <html data-device>，供 CSS 钩子使用 */
function applyAttr(type) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-device', type)
  }
}

function normalizeOverride(value) {
  return DEVICE_TREES.includes(value) ? value : null
}

let listenersBound = false

export const useDeviceStore = defineStore('device', () => {
  // 自动识别结果（随视口变化实时更新）
  const type = ref(detectDeviceType())
  // 手动端口选择（null = 跟随自动识别）
  const override = ref(normalizeOverride(safeGetItem(DEVICE_KEY)))

  const isPhone = computed(() => type.value === 'phone')
  const isTablet = computed(() => type.value === 'tablet')
  const isDesktop = computed(() => type.value === 'desktop')

  /** 生效的路由树：手动选择优先，否则按设备类型推导 */
  const tree = computed(() => override.value || treeOf(type.value))

  const label = computed(
    () => ({ phone: '手机', tablet: '平板', desktop: '桌面端' })[type.value] || '桌面端',
  )

  /** 首次使用即同步 <html data-device> 并监听断点穿越 */
  function init() {
    applyAttr(type.value)
    if (listenersBound || typeof window === 'undefined' || !window.matchMedia) return
    listenersBound = true

    const queries = [
      { mq: window.matchMedia(`(max-width: ${BREAKPOINTS.phoneMax - 1}px)`), types: ['phone'] },
      {
        mq: window.matchMedia(
          `(min-width: ${BREAKPOINTS.phoneMax}px) and (max-width: ${BREAKPOINTS.tabletMax - 1}px)`,
        ),
        types: ['tablet'],
      },
      { mq: window.matchMedia(`(min-width: ${BREAKPOINTS.tabletMax}px)`), types: ['desktop'] },
    ]

    const onChange = () => {
      // 视口变化后仍以 matchDeviceType 合成（保留 UA 对 iPad 桌面模式的修正）
      const touch = navigator.maxTouchPoints || 0
      const next = matchDeviceType(navigator.userAgent || '', getViewportWidth(), touch)
      if (next !== type.value) {
        type.value = next
        applyAttr(next)
      }
    }

    for (const q of queries) {
      // 老版 Safari  only 支持 addListener，优先标准 API
      if (q.mq.addEventListener) q.mq.addEventListener('change', onChange)
      else if (q.mq.addListener) q.mq.addListener(onChange)
    }
  }

  /** 手动切换端口（布局里的「切换 H5 移动端 / 切换电脑端」） */
  function setOverride(treeName) {
    const next = normalizeOverride(treeName)
    override.value = next
    if (next) safeSetItem(DEVICE_KEY, next)
    else safeRemoveItem(DEVICE_KEY)
  }

  /** 清除手动选择，恢复自动识别 */
  function clearOverride() {
    setOverride(null)
  }

  return {
    type,
    override,
    tree,
    label,
    isPhone,
    isTablet,
    isDesktop,
    init,
    setOverride,
    clearOverride,
  }
})
