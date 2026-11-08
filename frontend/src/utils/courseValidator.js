/**
 * 硬约束验证器 —— 课程编译器第二层。
 *
 * 对应研究设计（docs/research/course-compiler-design.md）RQ1：
 * 把"教学上是否成立"拆成可判定的硬约束，逐条给出违规定位与修复提示。
 *
 * 约束清单（code → 说明 → 严重级）：
 * - PREREQ_ORDER    先修顺序：场景使用的知识点，其先修必须已在更早场景引入（error）
 * - PREREQ_MISSING  先修引用不存在（error）
 * - COVERAGE        课程要求覆盖：每条要求至少与一个知识点/场景要点有词面重叠（warning，度量走 metrics）
 * - DURATION_BUDGET 时长预算：场景时长总和贴近目标（error）；单场景类型区间（warning）
 * - DIFFICULTY_ORDER 难度递增：lecture 场景 difficultyTier 按 order 非降序（error）
 * - EXERCISE_TYPES  题型完整性：quiz 场景题型规格 ≥2 类且题量 ≥2（error）；课程至少 1 个 quiz（error）
 * - MATERIAL_EXISTENCE 材料存在：sourceChunkIds 必须来自 allowedChunkIds（error）
 * - COMPLETION_CRITERIA 完成标准：每个场景至少 1 条（warning）
 * - KP_RANGE        知识点难度取值 1–3（warning）
 * - STRUCT_MIN_SCENES 结构下限：导入/讲解/示例/小测/收束各类齐备且合计 ≥8（warning）
 *
 * 内容层（validateQuizContent，不在本计划级入口）：
 * - QUIZ_DUP_OPTION  题目选项重复：渲染后会出现多个「正确」答案（error，可确定性修复）
 * - QUIZ_SINGLE_ANSWER 答案缺失或越界：没有恰一个正确选项（error，多数交模型）
 * - QUIZ_OPTION_COUNT 选项数量不足：去重后少于 3 个（warning，交模型补全）
 *
 * 本文件不导入 '@/...'，保证 node 测试可直接运行。
 */

import { KNOWLEDGE_POINT_DIFFICULTY } from './courseIR.js'

export const CONSTRAINT_CODES = [
  'PREREQ_ORDER',
  'PREREQ_MISSING',
  'COVERAGE',
  'DURATION_BUDGET',
  'DIFFICULTY_ORDER',
  'EXERCISE_TYPES',
  'MATERIAL_EXISTENCE',
  'COMPLETION_CRITERIA',
  'KP_RANGE',
  'STRUCT_MIN_SCENES',
  'QUIZ_DUP_OPTION',
  'QUIZ_SINGLE_ANSWER',
  'QUIZ_OPTION_COUNT',
]

export const QUIZ_QUALITY_CODES = ['QUIZ_DUP_OPTION', 'QUIZ_SINGLE_ANSWER', 'QUIZ_OPTION_COUNT']

/** 系统性课程的结构下限（报告④ P1-3）：各类场景至少数量。 */
const SCENE_TYPE_MINIMUMS = {
  lecture: 2, // 讲解（第一节兼导入）
  quiz: 1, // 小测
  practice: 1, // 示例/应用
  review: 1, // 收束
}
const SCENE_TOTAL_MINIMUM = 8
const QUIZ_OPTION_MINIMUM = 3

/** 判断题的合法二选项集合（大小写不敏感）：这类题目按设计就只有两个选项。 */
const JUDGE_OPTION_PAIRS = new Set([
  '对', '错', '正确', '错误', '是', '否', 'true', 'false', 't', 'f', 'yes', 'no',
])

function isJudgePair(options) {
  if (options.length !== 2) return false
  return options.every((option) => JUDGE_OPTION_PAIRS.has(String(option).trim().toLowerCase()))
}

const MINUTE_RANGES = {
  lecture: [2, 6],
  quiz: [4, 6],
  practice: [5, 8],
  review: [3, 5],
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'of', 'and', 'to', 'in', 'for', '会解', '掌握',
])

/**
 * 关键词集合：拉丁/数字按词，中文按字符二元组（无分词器下的确定性近似）。
 * 这样"回带检验"与"会解…并回带检验"能算出有效重叠。
 */
function keywords(value) {
  const source = String(value || '').toLowerCase()
  const words = source.match(/[a-z0-9]+/g) || []
  const han = source.match(/[\u4e00-\u9fa5]+/g) || []
  const bigrams = []
  for (const run of han) {
    if (run.length === 1) bigrams.push(run)
    for (let i = 0; i < run.length - 1; i += 1) bigrams.push(run.slice(i, i + 2))
  }
  return new Set([...words, ...bigrams].filter((word) => !STOP_WORDS.has(word)))
}

function overlapRatio(a, b) {
  if (!a.size || !b.size) return 0
  let hit = 0
  for (const word of a) if (b.has(word)) hit += 1
  return hit / Math.min(a.size, b.size)
}

function violation(code, severity, target, message, hint) {
  return { code, severity, target, message, hint }
}

function checkPrerequisites(plan) {
  const issues = []
  const points = new Map(plan.knowledgePoints.map((point) => [point.id, point]))
  const introducedAt = new Map(plan.knowledgePoints.map((point) => [point.id, point.introducedBy]))
  const sceneOrder = new Map(plan.scenes.map((scene) => [scene.id, scene.order]))

  for (const scene of plan.scenes) {
    for (const id of scene.knowledgePointIds || []) {
      if (!points.has(id)) {
        issues.push(
          violation(
            'PREREQ_MISSING',
            'error',
            { type: 'scene', id: scene.id },
            `场景「${scene.title}」引用了不存在的知识点 ${id}`,
            '删除该引用或改为已有知识点',
          ),
        )
        continue
      }
      // 引入顺序：知识点的引入场景不得晚于使用场景（同场景内引入即允许）
      const introOrder = sceneOrder.get(introducedAt.get(id))
      if (introOrder != null && introOrder > scene.order) {
        issues.push(
          violation(
            'PREREQ_ORDER',
            'error',
            { type: 'scene', id: scene.id },
            `场景「${scene.title}」（第 ${scene.order} 节）使用知识点 ${id}，但它要到第 ${introOrder} 节才引入`,
            '把引入场景移到前面，或把该知识点从本场景摘除',
          ),
        )
      }
      for (const preId of points.get(id)?.prerequisites || []) {
        if (!points.has(preId)) {
          issues.push(
            violation(
              'PREREQ_MISSING',
              'error',
              { type: 'scene', id: scene.id },
              `场景「${scene.title}」的知识点 ${id} 引用了不存在的先修 ${preId}`,
              '删除该先修引用或改为已存在的知识点',
            ),
          )
          continue
        }
        const preScene = introducedAt.get(preId)
        const preOrder = sceneOrder.get(preScene)
        // 同一场景内引入即允许；只有先修出现在更晚场景才算违规
        if (preOrder != null && preOrder > scene.order) {
          issues.push(
            violation(
              'PREREQ_ORDER',
              'error',
              { type: 'scene', id: scene.id },
              `场景「${scene.title}」（第 ${scene.order} 节）使用 ${id}，但其先修 ${preId} 在第 ${preOrder} 节才引入`,
              '把先修所在场景移到前面，或把该知识点移到后面的场景',
            ),
          )
        }
      }
    }
    for (const preId of scene.prerequisites || []) {
      if (!points.has(preId)) {
        issues.push(
          violation(
            'PREREQ_MISSING',
            'error',
            { type: 'scene', id: scene.id },
            `场景「${scene.title}」声明了不存在的先修知识点 ${preId}`,
            '删除该声明或指向已有知识点',
          ),
        )
      }
    }
  }
  return issues
}

function checkCoverage(plan) {
  const issues = []
  let covered = 0
  const sceneTexts = plan.scenes.map((scene) =>
    keywords([scene.title, scene.description, ...(scene.keyPoints || []), ...(scene.takeaways || [])].join(' ')),
  )
  for (const requirement of plan.requirements) {
    const words = keywords(requirement.text)
    const hit = plan.knowledgePoints.some((point) => overlapRatio(words, keywords(point.name)) >= 0.5)
    const sceneHit = sceneTexts.some((text) => overlapRatio(words, text) >= 0.34)
    if (hit || sceneHit) covered += 1
    else {
      issues.push(
        violation(
          'COVERAGE',
          'warning',
          { type: 'plan', id: plan.courseId },
          `课程要求「${requirement.text.slice(0, 40)}」没有对应知识点或场景覆盖`,
          '补充一个覆盖该要求的场景，或在要求描述中改用材料原话',
        ),
      )
    }
  }
  return {
    issues,
    coverage: plan.requirements.length ? covered / plan.requirements.length : 1,
  }
}

function checkDuration(plan) {
  const issues = []
  const total = plan.scenes.reduce((sum, scene) => sum + (scene.estimatedMinutes || 0), 0)
  const budget = plan.durationBudget || 0
  const tolerance = Math.max(3, Math.round(budget * 0.15))
  const drift = Math.abs(total - budget)
  if (drift > tolerance) {
    issues.push(
      violation(
        'DURATION_BUDGET',
        'error',
        { type: 'plan', id: plan.courseId },
        `场景时长合计 ${total} 分钟，偏离目标 ${budget} 分钟 ${drift} 分钟（容忍 ±${tolerance}）`,
        '按类型区间再平衡各场景时长',
      ),
    )
  }
  for (const scene of plan.scenes) {
    const range = MINUTE_RANGES[scene.type]
    if (range && (scene.estimatedMinutes < range[0] || scene.estimatedMinutes > range[1])) {
      issues.push(
        violation(
          'DURATION_BUDGET',
          'warning',
          { type: 'scene', id: scene.id },
          `场景「${scene.title}」时长 ${scene.estimatedMinutes} 分钟超出 ${scene.type} 建议区间 ${range[0]}–${range[1]}`,
          '调整该场景时长或拆分场景',
        ),
      )
    }
  }
  return { issues, total, drift }
}

function checkDifficulty(plan) {
  const issues = []
  let ceiling = 0
  for (const scene of plan.scenes) {
    if (scene.type !== 'lecture') continue
    if (scene.difficultyTier < ceiling) {
      issues.push(
        violation(
          'DIFFICULTY_ORDER',
          'error',
          { type: 'scene', id: scene.id },
          `场景「${scene.title}」难度 ${scene.difficultyTier} 低于前一 lecture 的 ${ceiling}`,
          '抬平该场景难度或调整场景顺序',
        ),
      )
    }
    ceiling = Math.max(ceiling, scene.difficultyTier)
  }
  return issues
}

function checkExercises(plan) {
  const issues = []
  const quizzes = plan.scenes.filter((scene) => scene.type === 'quiz')
  if (!quizzes.length) {
    issues.push(
      violation(
        'EXERCISE_TYPES',
        'error',
        { type: 'plan', id: plan.courseId },
        '课程没有任何 quiz 场景，缺少检索练习环节',
        '插入一个 quiz 场景（选择题 + 判断题各至少 1 题）',
      ),
    )
  }
  for (const scene of quizzes) {
    const spec = scene.exerciseSpec || { types: [], count: 0 }
    if (spec.types.length < 2 || spec.count < 2) {
      issues.push(
        violation(
          'EXERCISE_TYPES',
          'error',
          { type: 'scene', id: scene.id },
          `quiz 场景「${scene.title}」题型规格不足（${spec.types.length} 类 / ${spec.count} 题）`,
          '至少安排 2 类题型、共 2 题以上',
        ),
      )
    }
  }
  return issues
}

function checkMaterials(plan) {
  const issues = []
  if (!plan.allowedChunkIds?.length) return issues
  const allowed = new Set(plan.allowedChunkIds)
  for (const scene of plan.scenes) {
    for (const id of scene.sourceChunkIds || []) {
      if (!allowed.has(id)) {
        issues.push(
          violation(
            'MATERIAL_EXISTENCE',
            'error',
            { type: 'scene', id: scene.id },
            `场景「${scene.title}」引用了不存在的材料片段 ${id}`,
            '删除该引用或改为可用片段 ID',
          ),
        )
      }
    }
  }
  return issues
}

function checkCriteria(plan) {
  const issues = []
  for (const scene of plan.scenes) {
    if (!(scene.completionCriteria || []).length) {
      issues.push(
        violation(
          'COMPLETION_CRITERIA',
          'warning',
          { type: 'scene', id: scene.id },
          `场景「${scene.title}」没有完成标准`,
          '补 1–2 条可观察的完成标准',
        ),
      )
    }
  }
  return issues
}

function checkKnowledgePointRange(plan) {
  return plan.knowledgePoints
    .filter((point) => point.difficulty < KNOWLEDGE_POINT_DIFFICULTY.min || point.difficulty > KNOWLEDGE_POINT_DIFFICULTY.max)
    .map((point) =>
      violation(
        'KP_RANGE',
        'warning',
        { type: 'knowledgePoint', id: point.id },
        `知识点「${point.name}」难度 ${point.difficulty} 超出 1–3`,
        '钳制到 1–3',
      ),
    )
}

/**
 * 结构下限（STRUCT_MIN_SCENES，warning）：系统性课程应各类齐备。
 * 只报告不阻断——场景创造属于模型侧职责，确定性修复不造内容。
 */
function checkSceneStructure(plan) {
  const issues = []
  const counts = {}
  for (const scene of plan.scenes) counts[scene.type] = (counts[scene.type] || 0) + 1
  for (const [type, minimum] of Object.entries(SCENE_TYPE_MINIMUMS)) {
    if ((counts[type] || 0) < minimum) {
      issues.push(
        violation(
          'STRUCT_MIN_SCENES',
          'warning',
          { type: 'plan', id: plan.courseId },
          `课程缺少 ${type} 类场景（至少 ${minimum} 个，现有 ${counts[type] || 0} 个）`,
          `补充 ${type} 场景，保证课程结构完整`,
        ),
      )
    }
  }
  if (plan.scenes.length < SCENE_TOTAL_MINIMUM) {
    issues.push(
      violation(
        'STRUCT_MIN_SCENES',
        'warning',
        { type: 'plan', id: plan.courseId },
        `课程共 ${plan.scenes.length} 个场景，低于系统性课程建议下限 ${SCENE_TOTAL_MINIMUM} 个`,
        '按导入—讲解—示例—小测—收束补足场景',
      ),
    )
  }
  return issues
}

/**
 * 全量验证。返回 { passed, violations, metrics }。
 * passed = 没有任何 error 级违规（warning 不阻断编译）。
 */
export function validateCoursePlan(plan) {
  if (!plan || !Array.isArray(plan.scenes)) {
    return {
      passed: false,
      violations: [violation('COVERAGE', 'error', { type: 'plan', id: '' }, '课程计划为空或结构不完整', '重新生成大纲')],
      metrics: { coverage: 0, durationDrift: 0, totalMinutes: 0, violationCount: 1, errorCount: 1 },
    }
  }
  const coverage = checkCoverage(plan)
  const duration = checkDuration(plan)
  const violations = [
    ...checkPrerequisites(plan),
    ...coverage.issues,
    ...duration.issues,
    ...checkDifficulty(plan),
    ...checkExercises(plan),
    ...checkMaterials(plan),
    ...checkCriteria(plan),
    ...checkKnowledgePointRange(plan),
    ...checkSceneStructure(plan),
  ]
  const errorCount = violations.filter((item) => item.severity === 'error').length
  return {
    passed: errorCount === 0,
    violations,
    metrics: {
      coverage: Number(coverage.coverage.toFixed(3)),
      durationDrift: duration.drift,
      totalMinutes: duration.total,
      violationCount: violations.length,
      errorCount,
    },
  }
}

export function violationsByCode(validation, code) {
  return (validation?.violations || []).filter((item) => item.code === code)
}

export function countBySeverity(validation) {
  const list = validation?.violations || []
  return {
    error: list.filter((item) => item.severity === 'error').length,
    warning: list.filter((item) => item.severity === 'warning').length,
  }
}

/**
 * 内容层题目质量校验（QUIZ-*，报告④ P1-4）。
 *
 * scenes：项目 scenes（含生成后的 content），形如 [{ outlineId, title, content }]。
 * 返回 issue 数组，形状与 subjectCheck 一致：{ code, severity, target, message, fix }。
 *
 * - QUIZ_DUP_OPTION（error）：选项重复。修复载荷 fix 携带去重后的 options 与
 *   重算的 answerIndex，repairSceneContent 可确定性应用；
 * - QUIZ_SINGLE_ANSWER（error）：答案缺失/越界，没有恰一个正确选项，交模型；
 * - QUIZ_OPTION_COUNT（warning）：去重后选项少于 3 个，交模型补全。
 */
export function validateQuizContent(scenes = []) {
  const issues = []
  for (const scene of Array.isArray(scenes) ? scenes : []) {
    const questions = scene?.content?.kind === 'quiz' ? scene.content.questions || [] : []
    for (const question of questions) {
      const options = (Array.isArray(question?.options) ? question.options : [])
        .map((option) => String(option ?? '').trim())
        .filter(Boolean)
      if (options.length < 2 || !question?.stem) continue
      const stem = String(question.stem).trim().slice(0, 24)

      // 1. 重复选项（保留首次出现；答案若指向被删项则重指到保留项）
      const seen = new Set()
      const deduped = []
      const removed = []
      options.forEach((option) => {
        if (seen.has(option)) {
          removed.push(option)
          return
        }
        seen.add(option)
        deduped.push(option)
      })
      let resolvedAnswer = null
      if (removed.length) {
        const rawAnswer = Number(question.answerIndex)
        const answerOption = Number.isInteger(rawAnswer) ? options[rawAnswer] : undefined
        const remapped = answerOption != null ? deduped.indexOf(answerOption) : -1
        resolvedAnswer = remapped >= 0 ? remapped : null
        issues.push({
          code: 'QUIZ_DUP_OPTION',
          severity: 'error',
          target: question.id,
          message: `题目「${stem}」存在重复选项（${[...new Set(removed)].join('、')}），会出现多个「正确」答案`,
          fix: { options: deduped, answerIndex: resolvedAnswer },
          hint: '删除重复选项并把答案重指到保留项',
        })
      }

      // 2. 答案缺失/越界（去重修复已解决的不再重复报）
      const answerIndex = Number(question.answerIndex)
      const answerValid =
        Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex < options.length
      if (resolvedAnswer == null && !answerValid) {
        issues.push({
          code: 'QUIZ_SINGLE_ANSWER',
          severity: 'error',
          target: question.id,
          message: `题目「${stem}」的答案缺失或越界（answerIndex=${question.answerIndex}），没有恰一个正确选项`,
          fix: null,
          hint: '重新指定正确选项，保证恰有一个正确答案',
        })
      }

      // 3. 选项数量不足（去重后 < 3 个即失去选择题意义；判断题二选项合法）
      if (deduped.length < QUIZ_OPTION_MINIMUM && !isJudgePair(deduped)) {
        issues.push({
          code: 'QUIZ_OPTION_COUNT',
          severity: 'warning',
          target: question.id,
          message: `题目「${stem}」去重后仅 ${deduped.length} 个选项，少于 ${QUIZ_OPTION_MINIMUM} 个`,
          fix: null,
          hint: '补足干扰项，保证选择题有足够区分度',
        })
      }
    }
  }
  return issues
}
