/**
 * 内置演示课程的幂等注入计划。
 *
 * 背景：两份演示课程（有理数 / 管理）在课程 store 首次加载时注入。
 * 早期逻辑只在「本地没有任何课程」时注入，导致老用户（IndexedDB 已有数据，
 * 例如管理课程已有学习进度）永远看不到后来新增的有理数样例。
 * 现改为按 ID 补插：每次加载都把缺失的样例补齐；
 * 用户主动删过的样例记入 dismissed 名单，不再复活。
 *
 * 计划逻辑（planDemoSeed）为纯函数，可在 node 下单测；
 * dismissed 名单走 localStorage 薄封装，读写都容错。
 */

/** 演示课程 ID，按期望注入顺序排列（有理数在前）。 */
export const DEMO_SEED_IDS = ['course-demo-youshushu', 'course-demo-mw815lqq']

const DISMISSED_KEY = 'course-studio-demo-dismissed-v1'

/**
 * 计算本次需要注入的样例 ID。
 * @param {Object} options
 * @param {string[]} [options.existingIds] 当前课程列表已有的 ID
 * @param {string[]} [options.dismissedIds] 用户删过、不再复活的样例 ID
 * @param {number} [options.room] 还能插入几条（受 store 容量上限约束）
 * @returns {string[]} 待注入 ID，保持 DEMO_SEED_IDS 相对顺序
 */
export function planDemoSeed({ existingIds = [], dismissedIds = [], room = Infinity } = {}) {
  const existing = new Set(Array.isArray(existingIds) ? existingIds : [])
  const dismissed = new Set(Array.isArray(dismissedIds) ? dismissedIds : [])
  const planned = []
  for (const id of DEMO_SEED_IDS) {
    if (existing.has(id) || dismissed.has(id)) continue
    if (planned.length >= room) break
    planned.push(id)
  }
  return planned
}

function readDismissedRaw() {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

/** 读取 dismissed 名单（只保留仍是演示课程的 ID，过滤历史脏数据）。 */
export function readDismissedDemoIds() {
  return readDismissedRaw().filter((id) => DEMO_SEED_IDS.includes(id))
}

/** 记录一个被用户删除的演示课程 ID（非演示 ID 忽略）。 */
export function rememberDismissedDemoId(id) {
  if (!DEMO_SEED_IDS.includes(id)) return
  const next = [...new Set([...readDismissedRaw(), id])]
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(next))
  } catch {
    /* 隐私模式 / 存储被禁用时静默失败：最坏情况是样例下次加载又出现 */
  }
}
