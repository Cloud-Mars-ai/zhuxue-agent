/**
 * 课程计划 IR（Intermediate Representation）—— 课程编译器的中间表示。
 *
 * 设计动机（docs/research/course-compiler-design.md）：
 * 大模型直接生成课程时，"看起来很完整"不等于"教学上成立"。
 * 把生成过程拆成 规划 IR → 内容生成 → 约束验证 → 自动修复 → 渲染，
 * 每一层都有可验证的确定性结构。本文件定义 IR 的形状与归一化规则。
 *
 * 硬规则（与 courseBlueprint.js 相同的拆分理由）：
 * 本文件只用相对导入或不导入，保证 node 测试脚本可直接 import。
 *
 * IR 相比旧 blueprint 的新增字段：
 * - requirements：课程要求（用户需求 / 数据集要求），覆盖率验证的基准；
 * - knowledgePoints：知识点表，带 id / 先修关系 / 难度 / 覆盖场景；
 * - scenes[].knowledgePointIds / prerequisites：先修关系的显式声明；
 * - scenes[].exerciseSpec：题型矩阵与数量（题型完整性验证的基准）；
 * - scenes[].completionCriteria：可观察的完成标准（题目-目标一致性验证的基准）。
 */

import {
  enforceDifficultyTiers,
  normalizeTakeaways,
  rebalanceMinutes,
} from './courseBlueprint.js'

export const IR_VERSION = 'course-ir-v1'

export const KNOWLEDGE_POINT_DIFFICULTY = { min: 1, max: 3 }
export const EXERCISE_TYPES = ['choice', 'fill', 'judge']
export const SCENE_TYPES = ['lecture', 'quiz', 'practice', 'review']

const MAX_SCENES = 10

function text(value, max = 240) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function strings(value, maxItems = 8, maxLength = 160) {
  let list = []
  if (Array.isArray(value)) list = value
  else if (typeof value === 'string') {
    list = /[\n；;]/.test(value) ? value.split(/[\n；;]+/) : [value]
  }
  return list
    .map((item) => (item && typeof item === 'object' ? item.text ?? item.name ?? item.title : item))
    .map((item) => text(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

function normalizeType(value) {
  const raw = text(value, 24).toLowerCase()
  if (SCENE_TYPES.includes(raw)) return raw
  const alias = {
    slide: 'lecture',
    board: 'lecture',
    concept: 'lecture',
    interactive: 'practice',
    pbl: 'practice',
    case: 'practice',
    lab: 'practice',
    exercise: 'quiz',
    assessment: 'quiz',
    summary: 'review',
    recap: 'review',
  }
  return alias[raw] || 'lecture'
}

function normalizeMinutes(value, fallback = 8) {
  const number = Number(value)
  if (Number.isFinite(number)) return Math.min(45, Math.max(3, Math.round(number)))
  const matched = String(value ?? '').match(/\d+(?:\.\d+)?/)
  const parsed = matched ? Number(matched[0]) : Number.NaN
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(45, Math.max(3, Math.round(parsed)))
}

function normalizeDifficulty(value, fallback = 1) {
  const tier = Math.round(Number(value))
  if (!Number.isFinite(tier)) return fallback
  return Math.min(KNOWLEDGE_POINT_DIFFICULTY.max, Math.max(KNOWLEDGE_POINT_DIFFICULTY.min, tier))
}

function normalizeIds(value, max = 12) {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[\s,，;；]+/)
      : []
  return Array.from(new Set(list.map((id) => text(id, 80)).filter(Boolean))).slice(0, max)
}

/** 知识点主键：同名知识点在不同场景复用同一 id，先修关系才能跨场景生效。 */
function knowledgePointKey(name) {
  return text(name, 80)
    .toLowerCase()
    .replace(/[\s,，。.、；;：:！!？?（）()【】[\]"'“”‘’]/g, '')
}

function normalizeExerciseSpec(raw, sceneType) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const types = Array.from(
    new Set(
      (Array.isArray(source.types) ? source.types : [])
        .map((type) => text(type, 20).toLowerCase())
        .filter((type) => EXERCISE_TYPES.includes(type)),
    ),
  )
  const count = Math.min(6, Math.max(0, Math.round(Number(source.count) || 0)))
  if (sceneType !== 'quiz') {
    // 非练习场景允许声明题型期望，但不强制
    return { types, count }
  }
  return {
    types: types.length ? types : ['choice', 'judge'],
    count: count >= 2 ? count : 2,
  }
}

/**
 * 从蓝图场景列表派生知识点表与先修关系。
 * 规则（确定性、可解释）：
 * 1. 每个场景的 keyPoints 成为知识点候选，按首次出现顺序编号 kp_1…；
 * 2. 模型在课程级 knowledgePoints 中声明的 difficulty/prerequisites（按名称）
 *    优先采用；未声明时先修 = 之前场景已引入的知识点（最多取最近 2 个）；
 * 3. 声明的先修若指向更晚才引入的知识点，保留原样——由验证器检出、
 *    修复循环重排，这正是编译器的研究价值所在。
 */
function deriveKnowledgePoints(scenes, declared = new Map()) {
  const points = []
  const index = new Map()
  const introducedByScene = []
  scenes.forEach((scene) => {
    const scenePoints = []
    for (const name of scene.keyPoints || []) {
      const key = knowledgePointKey(name)
      if (!key || index.has(key)) continue
      const id = `kp_${points.length + 1}`
      index.set(key, id)
      const info = declared.get(key)
      const declaredPrereqs = (info?.prerequisites || [])
        .map((preName) => index.get(knowledgePointKey(preName)))
        .filter(Boolean)
        .slice(0, 3)
      const point = {
        id,
        name: text(name, 80),
        difficulty: info?.difficulty || scene.difficultyTier,
        prerequisites: declaredPrereqs.length
          ? declaredPrereqs
          : points.slice(-2).map((point_) => point_.id),
        introducedBy: scene.id,
        estMinutes: scene.estimatedMinutes,
      }
      points.push(point)
      scenePoints.push(id)
    }
    introducedByScene.push(scenePoints)
  })
  return { points, index, introducedByScene }
}

function attachKnowledgePoints(scenes, knowledgePoints, nameIndex) {
  const index = new Map(knowledgePoints.map((point) => [point.id, point]))
  const resolveNames = (names) =>
    (names || [])
      .map((name) => nameIndex.get(knowledgePointKey(name)))
      .filter((id) => id && index.has(id))
  return scenes.map((scene) => {
    const explicit = normalizeIds(scene.knowledgePointIds).filter((id) => index.has(id))
    const fromTitle = knowledgePoints
      .filter((point) => point.introducedBy === scene.id)
      .map((point) => point.id)
    const ids = Array.from(
      new Set([...explicit, ...resolveNames(scene.knowledgePointNames), ...fromTitle]),
    )
    const prerequisites = Array.from(
      new Set([
        ...normalizeIds(scene.prerequisites).filter((id) => index.has(id)),
        ...resolveNames(scene.prerequisiteNames),
        ...ids.flatMap((id) => index.get(id)?.prerequisites || []),
      ]),
    ).filter((id) => !ids.includes(id))
    return { ...scene, knowledgePointIds: ids, prerequisites }
  })
}

function normalizeScene(raw, index, context, fallbackMinutes) {
  const title = text(raw?.title ?? raw?.heading ?? raw?.name, 80)
  if (!title) return null
  const type = normalizeType(raw?.type)
  const keyPoints = strings(raw?.keyPoints ?? raw?.points ?? raw?.key_points, 5, 160)
  if (!keyPoints.length) keyPoints.push(title)
  const teachingObjective =
    text(raw?.teachingObjective ?? raw?.learningObjective ?? raw?.objective, 220) ||
    context.objective ||
    `能解释「${title}」。`
  const completionCriteria = strings(
    raw?.completionCriteria ?? raw?.completionStandard ?? raw?.successCriteria,
    3,
    160,
  )
  if (!completionCriteria.length) {
    completionCriteria.push(`能达成学习目标：${text(teachingObjective, 60)}`)
    completionCriteria.push('能指出本场景中一个仍待核对的疑问或边界')
  }
  return {
    id: text(raw?.id, 80) || `scene_${index + 1}`,
    order: index + 1,
    type,
    title,
    description: text(raw?.description ?? raw?.summary ?? raw?.purpose, 280) || `理解「${title}」的核心内容。`,
    teachingObjective,
    completionCriteria,
    keyPoints,
    takeaways: normalizeTakeaways(raw?.takeaways ?? raw?.keyTakeaways, keyPoints, type === 'lecture' || type === 'review'),
    difficultyTier: normalizeDifficulty(raw?.difficultyTier, type === 'lecture' ? 1 : 1),
    estimatedMinutes: normalizeMinutes(raw?.estimatedMinutes ?? raw?.durationMinutes, fallbackMinutes),
    sourceChunkIds: normalizeIds(raw?.sourceChunkIds ?? raw?.sourceIds),
    exerciseSpec: normalizeExerciseSpec(raw?.exerciseSpec, type),
    prerequisites: normalizeIds(raw?.prerequisites),
    knowledgePointIds: normalizeIds(raw?.knowledgePointIds),
    // 名称式声明（提示词契约）：归一化后解析为 id
    knowledgePointNames: strings(raw?.knowledgePoints, 6, 80),
    prerequisiteNames: strings(raw?.prerequisites, 6, 80),
    visualHint:
      raw?.visualHint && typeof raw.visualHint === 'object'
        ? {
            level: ['none', 'low', 'recommend'].includes(raw.visualHint.level)
              ? raw.visualHint.level
              : 'none',
            score: Number(raw.visualHint.score) || 0,
            reasons: strings(raw.visualHint.reasons, 3, 120),
          }
        : { level: 'none', score: 0, reasons: [] },
  }
}

/**
 * 归一化课程计划 IR。输入可以是：
 * - 模型蓝图输出（outlines 数组）；
 * - 已有的 IR 对象（幂等重算）；
 * - 本地兜底蓝图（buildLocalCourseBlueprint 的产物）。
 */
export function normalizeCoursePlan(raw, context = {}) {
  const source = Array.isArray(raw) ? { outlines: raw } : raw || {}
  const course = source?.course && typeof source.course === 'object' ? source.course : null
  const candidates = [
    source?.scenes,
    source?.outlines,
    source?.sections,
    course?.scenes,
    course?.outlines,
  ]
  const found = candidates.find((candidate) => Array.isArray(candidate)) || []
  const totalMinutes = Math.min(120, Math.max(10, Math.round(Number(context.durationMinutes) || 30)))
  const scenes = found
    .slice(0, MAX_SCENES)
    .map((scene, index) =>
      normalizeScene(scene, index, context, Math.max(4, Math.round(totalMinutes / 6))),
    )
    .filter(Boolean)
  if (scenes.length < 3) return null

  let normalized = scenes
  normalized = ensureTeachingSequence(normalized, context, totalMinutes)
  normalized = enforceDifficultyTiers(normalized)
  normalized = rebalanceMinutes(normalized, totalMinutes)
  normalized = normalized.map((scene, index) => ({ ...scene, order: index + 1 }))

  // 课程级知识点声明（提示词 IR 契约）：按名称取 difficulty/prerequisites
  const declared = new Map()
  for (const item of Array.isArray(source?.knowledgePoints) ? source.knowledgePoints : []) {
    const name = text(item?.name ?? item?.title, 80)
    if (!name) continue
    const difficulty = normalizeDifficulty(item?.difficulty, 0)
    declared.set(knowledgePointKey(name), {
      difficulty: difficulty >= 1 && difficulty <= 3 ? difficulty : null,
      prerequisites: strings(item?.prerequisites, 6, 80),
    })
  }

  const { points, index } = deriveKnowledgePoints(normalized, declared)
  normalized = attachKnowledgePoints(normalized, points, index)

  const requirements = [
    ...(Array.isArray(context.requirements) ? context.requirements : []).map((item, index) => ({
      id: text(item?.id, 60) || `rq_${index + 1}`,
      text: text(item?.text ?? item?.title, 200),
      source: 'requirement',
    })),
    {
      id: 'rq_objective',
      text: text(context.objective, 200) || '完成本课学习目标',
      source: 'requirement',
    },
  ].filter((item) => item.text)

  return {
    version: IR_VERSION,
    courseId: text(source?.courseId ?? context.courseId, 80) || `plan-${Date.now().toString(36)}`,
    title: text(source?.courseTitle ?? source?.title ?? course?.title, 30) || `${context.chapter || '主题'} · 学习计划`,
    summary: text(source?.courseSummary ?? source?.summary, 360) || `围绕"${context.objective || '本课主题'}"组织 ${totalMinutes} 分钟学习。`,
    languageDirective:
      text(source?.languageDirective, 260) ||
      '使用用户需求所使用的语言授课；专业术语首次出现时给出清晰解释。',
    learnerProfile: source?.learnerProfile && typeof source.learnerProfile === 'object' ? source.learnerProfile : null,
    domain: text(source?.domain ?? context.domain, 24) || 'general',
    durationBudget: totalMinutes,
    requirements,
    knowledgePoints: points,
    scenes: normalized,
    allowedChunkIds: Array.isArray(context.allowedChunkIds)
      ? context.allowedChunkIds.map((id) => text(id, 80)).filter(Boolean)
      : [],
    repairs: [],
    createdAt: new Date().toISOString(),
  }
}

/** 教学顺序兜底：至少 1 个 quiz、最后 1 个是 review（与旧蓝图一致）。 */
function ensureTeachingSequence(scenes, context, totalMinutes) {
  const result = [...scenes]
  if (!result.some((scene) => scene.type === 'quiz')) {
    const points = result.flatMap((scene) => scene.keyPoints).slice(0, 3)
    result.splice(Math.min(2, result.length), 0, {
      id: `scene_${result.length + 1}`,
      type: 'quiz',
      title: '检索练习：先回忆，再解释',
      description: '用 2–3 道题检查概念边界与常见误判。',
      teachingObjective: '不看材料也能解释核心概念，并识别常见错误。',
      completionCriteria: ['能独立回忆并解释核心概念', '能识别一个常见错误表述'],
      keyPoints: points.length ? points : [context.objective || '本课核心'],
      takeaways: normalizeTakeaways([], points, false),
      difficultyTier: 1,
      estimatedMinutes: Math.min(8, Math.max(5, Math.round(totalMinutes / 5))),
      sourceChunkIds: [],
      exerciseSpec: { types: ['choice', 'judge'], count: 2 },
      prerequisites: [],
      knowledgePointIds: [],
      visualHint: { level: 'none', score: 0, reasons: [] },
    })
  }
  if (!result.some((scene) => scene.type === 'review')) {
    const points = result.flatMap((scene) => scene.keyPoints).slice(-3)
    result.push({
      id: `scene_${result.length + 1}`,
      type: 'review',
      title: '一页收束：把知识变成判断链',
      description: '收束概念、适用条件与下一步练习。',
      teachingObjective: '能用自己的话复述判断链，并说出一个仍待核对的问题。',
      completionCriteria: ['能复述本课结构', '能说出一个仍待核对的问题'],
      keyPoints: points.length ? points : [context.objective || '本课核心'],
      takeaways: normalizeTakeaways([], points, true),
      difficultyTier: 1,
      estimatedMinutes: 4,
      sourceChunkIds: [],
      exerciseSpec: { types: [], count: 0 },
      prerequisites: [],
      knowledgePointIds: [],
      visualHint: { level: 'none', score: 0, reasons: [] },
    })
  }
  return result.slice(0, MAX_SCENES)
}

/** 从任意蓝图（模型/本地兜底）提升为 IR；不重复造蓝图，只补先修与规格。 */
export function planFromBlueprint(blueprint, context = {}) {
  return normalizeCoursePlan(
    {
      courseId: context.courseId,
      courseTitle: blueprint?.courseTitle,
      courseSummary: blueprint?.courseSummary,
      languageDirective: blueprint?.languageDirective,
      learnerProfile: blueprint?.learnerProfile,
      domain: context.domain,
      outlines: blueprint?.outlines || [],
    },
    context,
  )
}

/** IR → 旧蓝图形状：现有场景生成/讲稿管线继续可用，不需要推翻产品。 */
export function coursePlanToBlueprint(plan) {
  if (!plan) return null
  return {
    courseTitle: plan.title,
    courseSummary: plan.summary,
    languageDirective: plan.languageDirective,
    learnerProfile: plan.learnerProfile,
    outlines: plan.scenes.map((scene) => ({
      id: scene.id,
      type: scene.type,
      title: scene.title,
      description: scene.description,
      teachingObjective: scene.teachingObjective,
      keyPoints: scene.keyPoints,
      takeaways: scene.takeaways,
      difficultyTier: scene.difficultyTier,
      estimatedMinutes: scene.estimatedMinutes,
      sourceChunkIds: scene.sourceChunkIds,
      visualHint: scene.visualHint,
      order: scene.order,
    })),
  }
}

export function findKnowledgePoint(plan, kpId) {
  return plan?.knowledgePoints?.find((point) => point.id === kpId) || null
}

export function sceneKnowledgePoints(plan, scene) {
  const ids = new Set(scene?.knowledgePointIds || [])
  return (plan?.knowledgePoints || []).filter((point) => ids.has(point.id))
}

/** 结构指纹：重复生成稳定性指标用（场景序列 + 类型 + 标题 + 知识点）。 */
export function planFingerprint(plan) {
  return JSON.stringify({
    sceneCount: plan?.scenes?.length || 0,
    scenes: (plan?.scenes || []).map((scene) => ({
      type: scene.type,
      title: scene.title,
      minutes: scene.estimatedMinutes,
      kp: scene.knowledgePointIds || [],
    })),
  })
}

/** 知识点覆盖表：要求 → 覆盖它的知识点 → 场景。 */
export function coverageTable(plan) {
  const sceneOf = new Map((plan?.scenes || []).map((scene) => [scene.id, scene]))
  return (plan?.knowledgePoints || []).map((point) => ({
    id: point.id,
    name: point.name,
    difficulty: point.difficulty,
    prerequisites: point.prerequisites,
    coveredBy: sceneOf.has(point.introducedBy) ? [point.introducedBy] : [],
    estMinutes: point.estMinutes,
  }))
}
