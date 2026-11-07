/**
 * 蓝图层（大纲）的教学设计归一化函数。
 *
 * 从 utils/courseStudio.js 拆出，原因：该文件使用 '@/...' 路径别名，
 * node 测试脚本无法直接 import；本文件只用相对/无导入，保证可单测。
 *
 * 对应报告条目：
 * - A1 微切片：rebalanceMinutes（场景时长相加贴近目标时长）
 * - A4 三点式总结：normalizeTakeaways（lecture/review 恰好 3 条）
 * - A6 难度阶梯：enforceDifficultyTiers（lecture 场景非降序）
 */

function text(value, max = 240) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function strings(value, maxItems = 5, maxLength = 160) {
  return (Array.isArray(value) ? value : [])
    .map((item) => text(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

/** 三点式总结（A4）：lecture/review 必须恰好 3 条，不足时从要点补齐。 */
export function normalizeTakeaways(value, keyPoints, required) {
  const list = strings(value, 4, 120)
  if (!required) return list.slice(0, 3)
  const padded = [...list]
  for (const point of keyPoints) {
    if (padded.length >= 3) break
    if (!padded.includes(point)) padded.push(point)
  }
  while (padded.length < 3) padded.push('能用自己的话复述本场景的核心结论')
  return padded.slice(0, 3)
}

/** 难度阶梯（A6）：lecture 场景按 order 非降序，模型给出逆序时确定性抬平。 */
export function enforceDifficultyTiers(outlines) {
  let ceiling = 1
  return outlines.map((scene) => {
    if (scene.type !== 'lecture') return scene
    const tier = Math.max(scene.difficultyTier, ceiling)
    ceiling = tier
    return { ...scene, difficultyTier: tier }
  })
}

/**
 * 微切片时长再平衡（A1）：场景时长相加必须接近目标时长。
 * 偏差超过 max(3, 25%) 时按类型钳制范围等比缩放，余数补到最大的场景。
 */
export function rebalanceMinutes(outlines, totalMinutes) {
  const ranges = {
    lecture: [2, 6],
    quiz: [4, 6],
    practice: [5, 8],
    review: [3, 5],
  }
  const clampType = (scene, value) => {
    const [min, max] = ranges[scene.type] || [3, 8]
    return Math.min(max, Math.max(min, Math.round(value)))
  }
  const sum = outlines.reduce((total, scene) => total + scene.estimatedMinutes, 0)
  if (!sum || Math.abs(sum - totalMinutes) <= Math.max(3, totalMinutes * 0.25)) {
    return outlines
  }
  const scale = totalMinutes / sum
  const scaled = outlines.map((scene) => ({
    ...scene,
    estimatedMinutes: clampType(scene, scene.estimatedMinutes * scale),
  }))
  const drift = totalMinutes - scaled.reduce((total, scene) => total + scene.estimatedMinutes, 0)
  if (drift !== 0) {
    let target = 0
    scaled.forEach((scene, index) => {
      if (scene.estimatedMinutes > scaled[target].estimatedMinutes) target = index
    })
    const [min, max] = ranges[scaled[target].type] || [3, 8]
    scaled[target] = {
      ...scaled[target],
      estimatedMinutes: Math.min(max, Math.max(min, scaled[target].estimatedMinutes + drift)),
    }
  }
  return scaled
}
