/**
 * 管理学内容临时隐藏开关（2026-11-17，需求：竞赛演示阶段）
 *
 * 背景：AI协助与个人课程区域暂不展示管理学相关内容。
 * 本模块是唯一开关源——恢复显示只需把 HIDE_MANAGEMENT 置回 false，
 * 或把对应 ID 从 HIDDEN_DEMO_IDS 移除；种子数据、深链均不受影响
 * （课程仍注入 store，只是在列表层不露出）。
 */

/** 总开关：true = 隐藏管理学相关内容 */
export const HIDE_MANAGEMENT = true

/** 需要从课程列表隐藏的演示课程 ID（管理学演示课；有理数课不受影响） */
export const HIDDEN_DEMO_IDS = ['course-demo-mw815lqq']

/** 判断某课程是否应被隐藏（按 ID 精确命中，避免误伤有理数课） */
export function isHiddenDemoCourse(id) {
  return HIDE_MANAGEMENT && HIDDEN_DEMO_IDS.includes(id)
}

/** 过滤课程列表：剔除被隐藏的管理学演示课 */
export function withoutHiddenDemoCourses(list) {
  if (!HIDE_MANAGEMENT || !Array.isArray(list)) return list
  return list.filter((item) => !isHiddenDemoCourse(item?.id))
}
