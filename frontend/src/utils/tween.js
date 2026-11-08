/**
 * tween.js — rAF 连续插值工具（诊断三 F3.1：全项目统一补间基元）。
 *
 * 背景：交互动画三大瓶颈之一是"无连续插值"——NumberLineSim 用 Math.round
 * 直接赋 ref（跳变）、讲稿推进只切 class（瞬移）、参数滑块与模拟器状态
 * 不同步（拖了没反应）。本工具把这些场景统一到"from → to 的逐帧插值"：
 *
 * - 默认走 requestAnimationFrame；node 环境（测试脚本）自动降级 setTimeout
 * - 测试可注入 scheduler + now，实现确定性逐帧驱动（无真实时钟依赖）
 * - 支持取消；duration<=0 或 from===to 时同步落值（不排帧）
 *
 * 硬规则：纯函数模块，零依赖，node 可直接 import。
 */

const EASINGS = {
  linear: (t) => t,
  easeOutCubic: (t) => 1 - (1 - t) ** 3,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  easeOutBack: (t) => {
    const c = 1.70158
    return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2
  },
  easeOutQuint: (t) => 1 - (1 - t) ** 5,
}

function defaultScheduler() {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame
  return (callback) => setTimeout(() => callback(Date.now()), 16)
}

function defaultNow() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

/**
 * 从 from 补间到 to。
 * @returns {{ cancel: () => void }} 句柄；cancel 后不再回调
 */
export function tween(options = {}) {
  const {
    from = 0,
    to = 1,
    duration = 400,
    easing = 'easeOutCubic',
    onUpdate,
    onComplete,
    scheduler = defaultScheduler(),
    now = defaultNow,
  } = options

  const ease = typeof easing === 'function' ? easing : EASINGS[easing] || EASINGS.easeOutCubic

  if (!(duration > 0) || from === to) {
    onUpdate?.(to, 1)
    onComplete?.(to)
    return { cancel() {} }
  }

  let frame = 0
  let cancelled = false
  const start = now()

  const step = () => {
    if (cancelled) return
    const elapsed = now() - start
    const t = Math.min(1, Math.max(0, elapsed / duration))
    const value = from + (to - from) * ease(t)
    onUpdate?.(value, t)
    if (t >= 1) {
      onComplete?.(value)
      return
    }
    frame = scheduler(step)
  }
  frame = scheduler(step)

  return {
    cancel() {
      cancelled = true
      // rAF id 与 timeout id 互相当 clear 是无害操作（无效 id 被忽略）
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
      clearTimeout(frame)
    },
  }
}

export { EASINGS }
