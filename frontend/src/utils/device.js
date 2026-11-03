/**
 * 设备类型检测（手机 / 平板 / 桌面端）
 *
 * 判定采用「双信号合成」：
 *   1. 视口宽度（CSS px）——主依据。响应式布局本质由视口决定，
 *      桌面浏览器拖窄窗口、手机横屏等情况都以视口为准。
 *   2. User-Agent 关键字——辅助修正。用于区分视口宽度无法区分
 *      的场景，典型如 iPad 桌面模式（UA 含 iPad，视口宽达 1194px，
 *      应判平板而非桌面）。
 *
 * 断点（与 responsive.css 中的媒体查询保持一致）：
 *   < 768px                手机
 *   768px ~ 1199px         平板
 *   >= 1200px              桌面
 *
 * 触摸能力（pointer: coarse / hover: none）不参与路由判定，
 * 仅由 CSS 用于禁用 hover 悬浮、加大点击热区。
 */

/** 断点定义：小于 phoneMax 判手机，小于 tabletMax 判平板 */
export const BREAKPOINTS = { phoneMax: 768, tabletMax: 1200 }

export const DEVICE_TYPES = ['phone', 'tablet', 'desktop']

/** 手动端口选择：'mobile' 走 /m 路由树，'web' 走 / 路由树 */
export const DEVICE_TREES = ['mobile', 'web']

/** UA 中的手机关键字（命中即判手机，优先级最高） */
const PHONE_UA_RE = /iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|BlackBerry|Opera Mini|KAIOS/i

/** UA 中的平板关键字（iPad 各模式 / Android 平板均不含 "Mobile" 后缀） */
const TABLET_UA_RE = /iPad|Android(?!.*Mobile)|Tablet|PlayBook|Silk/i

/**
 * 纯函数：由 UA 与视口宽度合成设备类型。
 * 单独导出以便在 Node 环境做判定表单测（不依赖 window / document）。
 *
 * @param {string} ua              navigator.userAgent
 * @param {number} width           视口宽度（CSS px）
 * @param {number} maxTouchPoints  navigator.maxTouchPoints（iPad 桌面模式修正用）
 * @returns {'phone'|'tablet'|'desktop'}
 */
export function matchDeviceType(ua = '', width = 1200, maxTouchPoints = 0) {
  const uaIsPhone = PHONE_UA_RE.test(ua)
  const uaIsTablet = !uaIsPhone && TABLET_UA_RE.test(ua)

  // 手机 UA 一票通过（横屏手机视口可能超过 768，仍应按手机适配）
  if (uaIsPhone) return 'phone'

  // 其余以视口宽度为主
  if (width < BREAKPOINTS.phoneMax) return 'phone'

  // iPad 各模式 / Android 平板（UA 不含 Mobile 后缀）
  if (uaIsTablet) return 'tablet'

  // iPad 桌面模式：UA 伪装成 Macintosh，但支持多点触摸
  if (/Macintosh/i.test(ua) && maxTouchPoints > 1) return 'tablet'

  if (width < BREAKPOINTS.tabletMax) return 'tablet'
  return 'desktop'
}

/** 当前视口宽度（无 window 环境兜底 1200，按桌面处理） */
export function getViewportWidth() {
  if (typeof window === 'undefined') return 1200
  return window.innerWidth || document.documentElement.clientWidth || 1200
}

/** 当前 UA（无 navigator 环境兜底空串） */
export function getUserAgent() {
  if (typeof navigator === 'undefined') return ''
  return navigator.userAgent || ''
}

/** 检测当前设备类型 */
export function detectDeviceType() {
  const touch =
    typeof navigator !== 'undefined' && typeof navigator.maxTouchPoints === 'number'
      ? navigator.maxTouchPoints
      : 0
  return matchDeviceType(getUserAgent(), getViewportWidth(), touch)
}

/** 设备类型 → 路由树：手机走 /m（Vant H5），平板与桌面走 /（Element Plus） */
export function treeOf(type) {
  return type === 'phone' ? 'mobile' : 'web'
}
