/**
 * test-course-compiler.mjs —— 课程编译器（IR / 验证器 / 证据账本 /
 * 学科一致性 / 修复循环 / 实验工具）回归测试。
 * 运行：npm run test:course-compiler
 *
 * 对应 docs/research/course-compiler-design.md 的六层管线。
 */
import assert from 'node:assert/strict'
import {
  normalizeCoursePlan,
  planFromBlueprint,
  coursePlanToBlueprint,
  planFingerprint,
  coverageTable,
} from '../src/utils/courseIR.js'
import { validateCoursePlan, violationsByCode, validateQuizContent } from '../src/utils/courseValidator.js'
import {
  createLedger,
  addClaim,
  addEvidence,
  auditLedger,
  extractSceneClaims,
  attachRuleEvidence,
} from '../src/utils/evidenceLedger.js'
import {
  parseLinear,
  evaluateArithmetic,
  solveEquation,
  parseEquationText,
  numericValueOf,
  detectMoveWithoutSignChange,
  formatNumber,
} from '../src/utils/subjectCheck/mathExpr.js'
import {
  checkEquationSteps,
  checkChoiceQuestion,
  checkMath7Scene,
} from '../src/utils/subjectCheck/math7.js'
import { checkSubjectConsistency } from '../src/utils/subjectCheck/index.js'
import {
  repairCoursePlan,
  repairSceneContent,
  topologicalSceneOrder,
  buildSceneRepairPrompt,
  summarizeRepairs,
} from '../src/utils/courseRepair.js'
import {
  EXPERIMENT_GROUPS,
  runExperiment,
  summarizeExperiment,
  createExperimentRun,
  exportExperimentCsv,
  exportHumanScoreSheet,
  importHumanScores,
  formatExperimentMarkdown,
} from '../src/utils/courseExperiment.js'

let passed = 0
let failed = 0
const failures = []

function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`  ✓ ${name}`)
  } catch (error) {
    failed += 1
    failures.push({ name, error })
    console.log(`  ✗ ${name}\n    ${error.message}`)
  }
}

async function testAsync(name, fn) {
  try {
    await fn()
    passed += 1
    console.log(`  ✓ ${name}`)
  } catch (error) {
    failed += 1
    failures.push({ name, error })
    console.log(`  ✗ ${name}\n    ${error.message}`)
  }
}

// ---------------------------------------------------------------- 公共夹具
const context = {
  chapter: '第二章 一元一次方程',
  objective: '掌握移项解一元一次方程',
  audience: '七年级学生',
  durationMinutes: 24,
  domain: 'math7',
  allowedChunkIds: ['c1', 'c2', 'c3'],
  requirements: [{ id: 'rq_1', text: '会解一元一次方程并回带检验' }],
}

function rawBlueprint(overrides = {}) {
  return {
    courseTitle: '移项解方程',
    courseSummary: '围绕移项与回带组织 24 分钟学习。',
    outlines: [
      {
        id: 'scene_1',
        type: 'lecture',
        title: '认识一元一次方程',
        keyPoints: ['一元一次方程的标准形式', '移项要变号'],
        teachingObjective: '能判断一个方程是否为一元一次方程',
        estimatedMinutes: 8,
        difficultyTier: 1,
        sourceChunkIds: ['c1'],
      },
      {
        id: 'scene_2',
        type: 'lecture',
        title: '移项解法演练',
        keyPoints: ['移项要变号', '回带检验'],
        teachingObjective: '能用移项解出方程并回带检验',
        estimatedMinutes: 10,
        difficultyTier: 2,
        sourceChunkIds: ['c2'],
      },
      {
        id: 'scene_3',
        type: 'practice',
        title: '变式应用',
        keyPoints: ['含括号的方程', '回带检验'],
        teachingObjective: '能解含括号的一元一次方程',
        estimatedMinutes: 6,
        difficultyTier: 2,
        sourceChunkIds: ['c3'],
      },
      ...(overrides.extraScenes || []),
    ],
  }
}

// ---------------------------------------------------------------- [1] 数学引擎
console.log('\n[1] mathExpr：表达式与方程引擎')
test('算术求值（含乘方/括号/小数/分数写法）', () => {
  assert.equal(evaluateArithmetic('3+2×4'), 11)
  assert.equal(evaluateArithmetic('(3+2)×4'), 20)
  assert.equal(evaluateArithmetic('2^10'), 1024)
  assert.equal(evaluateArithmetic('1.5×4'), 6)
  assert.equal(evaluateArithmetic('3/4+1/4'), 1)
  assert.equal(evaluateArithmetic('－5＋3'), -2)
})
test('一元一次方程求解：唯一解 / 无解 / 恒等', () => {
  assert.deepEqual(solveEquation('3x+2', '5'), { kind: 'unique', value: 1, var: 'x' })
  assert.equal(solveEquation('x+1', 'x+2').kind, 'none')
  assert.equal(solveEquation('2(x+1)', '2x+2').kind, 'identity')
})
test('二次式与除零返回 unsupported', () => {
  assert.equal(parseLinear('x×x+1').ok, false)
  assert.equal(solveEquation('x×x', '4').kind, 'unsupported')
  assert.equal(evaluateArithmetic('1/0'), null)
  assert.equal(evaluateArithmetic('x+1'), null)
})
test('parseEquationText 支持最终答案行', () => {
  const eq = parseEquationText('x = 2')
  assert.equal(eq.kind, 'unique')
  assert.equal(eq.value, 2)
})
test('numericValueOf 容忍 x= 前缀与句读', () => {
  assert.equal(numericValueOf('x=1'), 1)
  assert.equal(numericValueOf('1/3'), 1 / 3)
  assert.equal(numericValueOf('选项A'), null)
})
test('移项不变号检测：错误步命中、正确步不命中', () => {
  assert.equal(detectMoveWithoutSignChange('3x+2=5', '3x=5+2'), true)
  assert.equal(detectMoveWithoutSignChange('3x+2=5', '3x=5-2'), false)
})
test('formatNumber 省略浮点尾巴', () => {
  assert.equal(formatNumber(2), '2')
  assert.equal(formatNumber(1 / 3), '0.333333')
})

// ---------------------------------------------------------------- [2] IR
console.log('\n[2] courseIR：结构化课程计划')
const plan = planFromBlueprint(rawBlueprint(), context)
test('IR 结构完整（版本/要求/知识点/场景/预算）', () => {
  assert.equal(plan.version, 'course-ir-v1')
  assert.ok(plan.requirements.some((item) => item.id === 'rq_1'))
  assert.ok(plan.knowledgePoints.length >= 4)
  assert.equal(plan.durationBudget, 24)
  assert.equal(plan.scenes.length, 5, '缺 quiz/review 时应补齐')
  assert.equal(plan.scenes.at(-1).type, 'review')
})
test('知识点去重与先修链', () => {
  const move = plan.knowledgePoints.find((point) => point.name === '移项要变号')
  assert.ok(move, '同名知识点跨场景应合并')
  assert.ok(move.prerequisites.length >= 1, '后续引入的知识点应有先修')
  const table = coverageTable(plan)
  assert.ok(table.every((row) => row.coveredBy.length === 1))
})
test('完成标准兜底与题型规格', () => {
  plan.scenes.forEach((scene) => {
    assert.ok(scene.completionCriteria.length >= 1, `${scene.id} 缺完成标准`)
  })
  const quiz = plan.scenes.find((scene) => scene.type === 'quiz')
  assert.ok(quiz.exerciseSpec.types.length >= 2 && quiz.exerciseSpec.count >= 2)
})
test('时长再平衡贴近预算', () => {
  const total = plan.scenes.reduce((sum, scene) => sum + scene.estimatedMinutes, 0)
  assert.ok(Math.abs(total - 24) <= Math.max(3, 24 * 0.25), `合计 ${total}`)
})
test('coursePlanToBlueprint 回旧形状且幂等', () => {
  const blueprint = coursePlanToBlueprint(plan)
  assert.equal(blueprint.outlines.length, plan.scenes.length)
  const again = planFromBlueprint(blueprint, context)
  assert.deepEqual(
    again.scenes.map((scene) => scene.title),
    plan.scenes.map((scene) => scene.title),
  )
  assert.equal(planFingerprint(again), planFingerprint(plan))
})
test('normalizeCoursePlan 拒绝不足 3 场景的输入', () => {
  assert.equal(normalizeCoursePlan({ outlines: [{ title: '只有一个' }] }, context), null)
})

// ---------------------------------------------------------------- [3] 验证器
console.log('\n[3] courseValidator：硬约束')
test('合规计划通过全部硬约束', () => {
  const validation = validateCoursePlan(plan)
  assert.equal(validation.passed, true, JSON.stringify(validation.violations, null, 1))
})
test('先修顺序违规可被检出', () => {
  const broken = JSON.parse(JSON.stringify(plan))
  const target = broken.scenes.find((scene) => scene.type === 'quiz')
  target.knowledgePointIds = ['kp_99']
  target.prerequisites = ['kp_99']
  broken.knowledgePoints.push({
    id: 'kp_99',
    name: '越界知识点',
    difficulty: 1,
    prerequisites: [],
    introducedBy: broken.scenes.at(-1).id, // 最后一节才引入
    estMinutes: 3,
  })
  const validation = validateCoursePlan(broken)
  assert.equal(validation.passed, false)
  assert.ok(violationsByCode(validation, 'PREREQ_ORDER').length >= 1)
})
test('时长超预算违规可被检出', () => {
  const broken = JSON.parse(JSON.stringify(plan))
  broken.scenes.forEach((scene) => {
    scene.estimatedMinutes = 40
  })
  const validation = validateCoursePlan(broken)
  assert.equal(validation.passed, false)
  assert.ok(violationsByCode(validation, 'DURATION_BUDGET').length >= 1)
  assert.ok(validation.metrics.durationDrift > 3)
})
test('难度逆序违规可被检出', () => {
  const broken = JSON.parse(JSON.stringify(plan))
  const lectures = broken.scenes.filter((scene) => scene.type === 'lecture')
  lectures[0].difficultyTier = 3
  lectures[1].difficultyTier = 1
  const validation = validateCoursePlan(broken)
  assert.equal(validation.passed, false)
  assert.ok(violationsByCode(validation, 'DIFFICULTY_ORDER').length >= 1)
})
test('题型规格不足与假材料 ID 违规', () => {
  const broken = JSON.parse(JSON.stringify(plan))
  const quiz = broken.scenes.find((scene) => scene.type === 'quiz')
  quiz.exerciseSpec = { types: ['choice'], count: 1 }
  broken.scenes[0].sourceChunkIds = ['c1', 'fake-chunk']
  const validation = validateCoursePlan(broken)
  assert.equal(validation.passed, false)
  assert.ok(violationsByCode(validation, 'EXERCISE_TYPES').length >= 1)
  assert.ok(violationsByCode(validation, 'MATERIAL_EXISTENCE').length >= 1)
})
test('空计划直接判不通过', () => {
  assert.equal(validateCoursePlan(null).passed, false)
})

// ---------------------------------------------------------------- [4] 证据账本
console.log('\n[4] evidenceLedger：证据账本')
test('无证据声明计入无依据比例', () => {
  const ledger = createLedger(plan.courseId)
  addClaim(ledger, { sceneId: 'scene_1', target: 'b1', kind: 'conclusion', text: '移项要变号' })
  addClaim(ledger, {
    sceneId: 'scene_1',
    target: 'b2',
    kind: 'conclusion',
    text: '材料指出移项等于两边同减',
    evidence: [{ kind: 'chunk', ref: 'c1', quote: '移项等于在等式两边做同减' }],
  })
  const audit = auditLedger(ledger, ['c1', 'c2', 'c3'])
  assert.equal(audit.total, 2)
  assert.equal(audit.unsupported.length, 1)
  assert.equal(audit.unsupportedRate, 0.5)
})
test('伪造 chunk 被标记', () => {
  const ledger = createLedger('p1')
  addClaim(ledger, { text: 'x', evidence: [{ kind: 'chunk', ref: 'ghost' }] })
  const audit = auditLedger(ledger, ['c1'])
  assert.equal(audit.fabricated.length, 1)
  assert.equal(audit.fabricated[0].ref, 'ghost')
  assert.equal(audit.supportRate, 0)
})
test('证据去重与规则挂靠', () => {
  const ledger = createLedger('p1')
  const a = addEvidence(ledger, { kind: 'chunk', ref: 'c1', quote: '同一句' })
  const b = addEvidence(ledger, { kind: 'chunk', ref: 'c1', quote: '同一句' })
  assert.equal(a.id, b.id)
  const claim = addClaim(ledger, { text: '易错点', evidence: [{ kind: 'rule', ref: 'ep-03' }] })
  attachRuleEvidence(ledger, claim.id, 'ep-05', '补充规则')
  assert.ok(claim.evidenceIds.length >= 2)
})
test('场景内容抽取声明（board/quiz/practice）', () => {
  const ledger = createLedger(plan.courseId)
  const scene = plan.scenes[0]
  extractSceneClaims(ledger, {
    plan,
    scene,
    content: {
      kind: 'board',
      lesson: {
        blocks: [
          { id: 'b1', type: 'definition', term: '方程', definition: '含未知数的等式', evidenceRefs: ['c1'] },
          { id: 'b2', type: 'callout', tone: 'warn', text: '移项必须变号' },
        ],
      },
    },
  })
  extractSceneClaims(ledger, {
    plan,
    scene,
    content: { kind: 'quiz', questions: [{ id: 'q1', stem: '解方程 3x+2=5', explanation: 'x=1', evidenceRefs: [] }] },
  })
  const audit = auditLedger(ledger, ['c1', 'c2', 'c3'])
  assert.ok(audit.total >= 5)
  assert.equal(audit.fabricated.length, 0, '场景级引用全部来自 allowedChunkIds')
})

// ---------------------------------------------------------------- [5] 学科一致性
console.log('\n[5] subjectCheck/math7：学科一致性')
test('解题步骤等价性：正确步骤零 error', () => {
  const issues = checkEquationSteps({
    steps: ['3x+2=5', '3x=5-2', '3x=3', 'x=1'],
    finalAnswer: 'x=1',
  })
  assert.equal(issues.filter((item) => item.severity === 'error').length, 0)
})
test('步骤跳变被检出并给出定位', () => {
  const issues = checkEquationSteps({ steps: ['3x+2=5', '3x=8', 'x=8/3'] })
  const divergence = issues.find((item) => item.code === 'MATH_STEP_DIVERGENCE')
  assert.ok(divergence)
  assert.match(divergence.message, /第 2 步/)
})
test('答案错误被检出且带修复建议', () => {
  const issues = checkEquationSteps({ steps: ['3x+2=5', '3x=3', 'x=1'], finalAnswer: 'x=2' })
  const mismatch = issues.find((item) => item.code === 'MATH_ANSWER_MISMATCH')
  assert.ok(mismatch)
  assert.equal(mismatch.fix.answer, '1')
})
test('移项不变号步骤被判跳变', () => {
  const issues = checkEquationSteps({ steps: ['3x+2=5', '3x=5+2'] })
  assert.ok(issues.some((item) => item.code === 'MATH_STEP_DIVERGENCE'))
})
test('选项重复与答案错指', () => {
  const dup = checkChoiceQuestion({
    question: { id: 'q1', stem: '下列说法正确的是', options: ['都对', '都不对', '都对'], answerIndex: 0 },
  })
  assert.ok(dup.some((item) => item.code === 'MATH_OPTION_DUPLICATE'))
  const wrong = checkChoiceQuestion({
    question: { id: 'q2', stem: '解方程 2x=6，x=？', options: ['2', '3', '4'], answerIndex: 0 },
  })
  assert.ok(wrong.some((item) => item.code === 'MATH_ANSWER_MISMATCH'))
})
test('题干方程无匹配选项', () => {
  const issues = checkChoiceQuestion({
    question: { id: 'q3', stem: '解方程 2x=7', options: ['2', '3', '4'], answerIndex: 1 },
  })
  assert.ok(issues.some((item) => item.code === 'MATH_OPTION_UNIQUE'))
})
test('wrong-first：错解必须在 errorIndex 处首次偏离', () => {
  const ok = checkMath7Scene(
    { id: 's1' },
    {
      kind: 'board',
      lesson: {
        blocks: [
          {
            id: 'b1',
            type: 'wrong-first',
            wrongSteps: ['3x+2=5', '3x=5+2', 'x=7/3'],
            errorIndex: 1,
            correctSteps: ['3x+2=5', '3x=3', 'x=1'],
          },
        ],
      },
    },
  )
  assert.ok(ok.some((item) => item.code === 'MATH_ERROR_PATTERN'), '移项不变号应归类到 ep-03')
  assert.ok(!ok.some((item) => item.severity === 'error'))

  const noError = checkMath7Scene(
    { id: 's2' },
    {
      kind: 'board',
      lesson: {
        blocks: [
          { id: 'b1', type: 'wrong-first', wrongSteps: ['3x+2=5', '3x=3', 'x=1'], errorIndex: 1, correctSteps: ['3x=3'] },
        ],
      },
    },
  )
  assert.ok(noError.some((item) => item.code === 'WRONG_FIRST_NO_ERROR'))
})
test('无法解析的内容降级 warning 不误报', () => {
  const issues = checkEquationSteps({ steps: ['先观察结构', '再分类讨论'] })
  assert.ok(issues.every((item) => item.severity === 'warning'))
})
test('学科分发：math7 全检 / 管理域轻检 / 其他域跳过', () => {
  const scene = { id: 's1' }
  const quiz = { kind: 'quiz', questions: [{ id: 'q1', stem: '解方程 2x=6', options: ['2', '3'], answerIndex: 0 }] }
  const math = checkSubjectConsistency({ domain: 'math7', scene, content: quiz })
  assert.equal(math.checked, true)
  assert.ok(math.issues.length >= 1)
  const mgmt = checkSubjectConsistency({
    domain: 'management',
    scene,
    content: { kind: 'practice', prompt: '某公司营收增长 20%，2023 年营收 500 万', referencePoints: [] },
    materialText: '某公司 2023 年营收 500 万元',
  })
  assert.equal(mgmt.checked, true)
  assert.equal(mgmt.issues.filter((item) => item.code === 'MGMT_NUMBER_UNSOURCED').length, 1, '20% 未在材料中应提示')
  const other = checkSubjectConsistency({ domain: 'general', scene, content: quiz })
  assert.equal(other.checked, false)
})

// ---------------------------------------------------------------- [6] 修复循环
console.log('\n[6] courseRepair：验证—修复循环')
test('先修违规经拓扑重排后通过', () => {
  const broken = JSON.parse(JSON.stringify(plan))
  const target = broken.scenes.find((scene) => scene.type === 'quiz')
  target.knowledgePointIds = ['kp_99']
  broken.knowledgePoints.push({
    id: 'kp_99',
    name: '越界知识点',
    difficulty: 1,
    prerequisites: [],
    introducedBy: broken.scenes.at(-1).id,
    estMinutes: 3,
  })
  const validation = validateCoursePlan(broken)
  assert.equal(validation.passed, false)
  const { plan: repaired, repairs } = repairCoursePlan(broken, validation)
  const revalidated = validateCoursePlan(repaired)
  assert.equal(revalidated.passed, true, JSON.stringify(revalidated.violations, null, 1))
  assert.ok(repairs.some((item) => item.code === 'PREREQ_ORDER'))
})
test('时长/难度/题型/假 chunk 一并确定性修复', () => {
  const broken = JSON.parse(JSON.stringify(plan))
  broken.scenes.forEach((scene) => {
    scene.estimatedMinutes = 40
  })
  const lectures = broken.scenes.filter((scene) => scene.type === 'lecture')
  lectures[0].difficultyTier = 3
  lectures[1].difficultyTier = 1
  const quiz = broken.scenes.find((scene) => scene.type === 'quiz')
  quiz.exerciseSpec = { types: ['choice'], count: 1 }
  broken.scenes[0].sourceChunkIds = ['c1', 'ghost']
  const validation = validateCoursePlan(broken)
  const { plan: repaired, repairs } = repairCoursePlan(broken, validation)
  const revalidated = validateCoursePlan(repaired)
  assert.equal(revalidated.passed, true)
  assert.equal(repaired.scenes[0].sourceChunkIds.includes('ghost'), false)
  const summary = summarizeRepairs(repairs)
  assert.ok(summary.byCode.DURATION_BUDGET >= 1)
  assert.ok(summary.byCode.DIFFICULTY_ORDER >= 1)
  assert.ok(summary.byCode.EXERCISE_TYPES >= 1)
  assert.ok(summary.byCode.MATERIAL_EXISTENCE >= 1)
})
test('覆盖不足留给模型（unresolved）', () => {
  const broken = JSON.parse(JSON.stringify(plan))
  broken.requirements.push({ id: 'rq_2', text: '掌握三角函数图像变换' })
  const validation = validateCoursePlan(broken)
  const { unresolved } = repairCoursePlan(broken, validation)
  assert.equal(unresolved.length, 1)
  assert.equal(unresolved[0].code, 'COVERAGE')
})
test('内容层修复：答案错指与 errorIndex 纠正', () => {
  const scene = { id: 'scene_quiz', title: '检索练习' }
  const content = {
    kind: 'quiz',
    questions: [{ id: 'q1', stem: '解方程 2x=6，x=？', options: ['2', '3', '4'], answerIndex: 0, explanation: 'x=2' }],
  }
  const issues = checkMath7Scene(scene, content)
  const { content: fixed, repairs } = repairSceneContent(scene, content, issues)
  assert.equal(fixed.questions[0].answerIndex, 1)
  assert.ok(repairs.some((item) => item.code === 'MATH_ANSWER_MISMATCH'))
  const recheck = checkMath7Scene(scene, fixed)
  assert.equal(recheck.filter((item) => item.severity === 'error').length, 0)

  const wrongFirst = {
    kind: 'board',
    lesson: {
      blocks: [
        { id: 'b1', type: 'wrong-first', wrongSteps: ['3x+2=5', '3x=5+2'], errorIndex: 0, correctSteps: ['3x=3'] },
      ],
    },
  }
  const wrongIssues = checkMath7Scene(scene, wrongFirst)
  const wrongFixed = repairSceneContent(scene, wrongFirst, wrongIssues)
  assert.equal(wrongFixed.content.lesson.blocks[0].errorIndex, 1)
})
test('修复提示词只针对问题场景且带材料边界', () => {
  const prompt = buildSceneRepairPrompt({
    plan,
    scene: plan.scenes[0],
    issues: [{ code: 'MATH_ANSWER_MISMATCH', severity: 'error', target: 'q1', message: '答案不一致', fix: { answer: '1' } }],
    allowedChunkIds: ['c1'],
    materialText: '移项等于两边同减',
  })
  assert.match(prompt, /问题场景：认识一元一次方程/)
  assert.match(prompt, /MATH_ANSWER_MISMATCH/)
  assert.match(prompt, /"c1"/)
  assert.match(prompt, /移项等于两边同减/)
})
test('topologicalSceneOrder 保持稳定顺序', () => {
  const ordered = topologicalSceneOrder(plan)
  assert.deepEqual(ordered.map((scene) => scene.title), plan.scenes.map((scene) => scene.title))
})

// ---------------------------------------------------------------- [6.5] 结构下限与题目质量
console.log('\n[6.5] 结构下限 / 题目质量校验')
test('场景结构不足时报 STRUCT_MIN_SCENES（warning 不阻断）', () => {
  const validation = validateCoursePlan(plan)
  assert.equal(validation.passed, true, 'warning 不影响 passed')
  const struct = violationsByCode(validation, 'STRUCT_MIN_SCENES')
  assert.ok(struct.length >= 1, '夹具仅 5 场景应触发下限提示')
  assert.ok(struct.every((item) => item.severity === 'warning'))
  assert.ok(struct.some((item) => /8 个/.test(item.message)))
  const noReview = JSON.parse(JSON.stringify(plan))
  noReview.scenes = noReview.scenes.filter((scene) => scene.type !== 'review')
  const noReviewValidation = validateCoursePlan(noReview)
  assert.ok(
    violationsByCode(noReviewValidation, 'STRUCT_MIN_SCENES').some((item) =>
      /review 类场景/.test(item.message),
    ),
  )
})
test('validateQuizContent：重复选项 / 答案越界 / 选项不足', () => {
  const dup = validateQuizContent([
    {
      outlineId: 's_quiz',
      content: {
        kind: 'quiz',
        questions: [
          { id: 'q1', stem: '解方程 3x+2=5', options: ['x=1', 'x=2', 'x=1'], answerIndex: 0 },
        ],
      },
    },
  ])
  const dupIssue = dup.find((item) => item.code === 'QUIZ_DUP_OPTION')
  assert.ok(dupIssue, 'A=D 型重复选项必须报 error')
  assert.equal(dupIssue.severity, 'error')
  assert.deepEqual(dupIssue.fix.options, ['x=1', 'x=2'])
  assert.equal(dupIssue.fix.answerIndex, 0)
  assert.equal(
    dup.filter((item) => item.code === 'QUIZ_SINGLE_ANSWER').length,
    0,
    '去重修复已解决答案唯一性，不应重复报',
  )

  const noAnswer = validateQuizContent([
    {
      outlineId: 's_quiz',
      content: {
        kind: 'quiz',
        questions: [{ id: 'q2', stem: '下列说法正确的是', options: ['都对', '都不对'], answerIndex: 5 }],
      },
    },
  ])
  assert.ok(noAnswer.some((item) => item.code === 'QUIZ_SINGLE_ANSWER' && item.severity === 'error'))
  assert.ok(noAnswer.some((item) => item.code === 'QUIZ_OPTION_COUNT' && item.severity === 'warning'))

  const ok = validateQuizContent([
    {
      outlineId: 's_quiz',
      content: {
        kind: 'quiz',
        questions: [{ id: 'q3', stem: '解方程 2x=6', options: ['x=2', 'x=3', 'x=4'], answerIndex: 1 }],
      },
    },
  ])
  assert.equal(ok.length, 0, '合规题目零问题')

  const judge = validateQuizContent([
    {
      outlineId: 's_quiz',
      content: {
        kind: 'quiz',
        questions: [{ id: 'q4', stem: '指导性计划适用于高不确定环境', options: ['对', '错'], answerIndex: 0 }],
      },
    },
  ])
  assert.equal(judge.length, 0, '判断题二选项合法，不报选项不足')
})
test('内容层修复：QUIZ_DUP_OPTION 去重并重指答案', () => {
  const scene = { id: 'scene_quiz', title: '检索练习' }
  const content = {
    kind: 'quiz',
    questions: [
      { id: 'q1', stem: '解方程 3x+2=5', options: ['x=1', 'x=2', 'x=1'], answerIndex: 2, explanation: 'x=1' },
    ],
  }
  const issues = validateQuizContent([{ outlineId: scene.id, content }])
  const { content: fixed, repairs, unresolved } = repairSceneContent(scene, content, issues)
  assert.deepEqual(fixed.questions[0].options, ['x=1', 'x=2'])
  assert.equal(fixed.questions[0].answerIndex, 0, '答案随去重重指到保留项')
  assert.ok(repairs.some((item) => item.code === 'QUIZ_DUP_OPTION'))
  assert.equal(unresolved.length, 0, '去重后可确定性解决，不留给模型')
  const recheck = validateQuizContent([{ outlineId: scene.id, content: fixed }])
  assert.equal(
    recheck.filter((item) => item.severity === 'error').length,
    0,
    '去重后无 error 级问题',
  )
  assert.ok(
    recheck.some((item) => item.code === 'QUIZ_OPTION_COUNT'),
    '去重后仅剩选项数量 warning，交模型补全',
  )
})

// ---------------------------------------------------------------- [7] 实验工具
console.log('\n[7] courseExperiment：实验与评测')
function fakeGenerator(mode) {
  return async ({ task, group, repeat }) => {
    const localPlan = planFromBlueprint(rawBlueprint(), { ...context, objective: task.objective })
    if (group === 'compiler') {
      const validation = validateCoursePlan(localPlan)
      const { plan: repaired, repairs } = repairCoursePlan(localPlan, validation)
      const ledger = createLedger(repaired.courseId)
      addClaim(ledger, { text: '移项要变号', evidence: [{ kind: 'chunk', ref: 'c1' }] })
      return {
        plan: repaired,
        ledger,
        validation: validateCoursePlan(repaired),
        subjectIssues: [],
        repairs: repairs.length,
        latencyMs: 1200 + repeat,
        tokens: 800,
      }
    }
    if (group === 'schema') {
      return {
        plan: localPlan,
        ledger: createLedger(localPlan.courseId),
        validation: validateCoursePlan(localPlan),
        subjectIssues: [],
        repairs: 0,
        latencyMs: 900,
        tokens: 700,
      }
    }
    // vanilla / rag：不做验证修复，故意保留违规
    const broken = JSON.parse(JSON.stringify(localPlan))
    broken.scenes.forEach((scene) => {
      scene.estimatedMinutes = 40
    })
    const ledger = createLedger(broken.courseId)
    addClaim(ledger, { text: '无依据结论' })
    return {
      plan: broken,
      ledger,
      validation: validateCoursePlan(broken),
      subjectIssues: group === 'rag' ? [] : [{ code: 'MATH_ANSWER_MISMATCH', severity: 'error' }],
      repairs: 0,
      latencyMs: 600,
      tokens: 500,
    }
  }
}

await testAsync('runExperiment 四组 × 任务 × 重复', async () => {
  const tasks = [
    { id: 't1', objective: '掌握移项解一元一次方程' },
    { id: 't2', objective: '理解等式性质' },
  ]
  const runs = await runExperiment({
    tasks,
    groups: ['vanilla', 'rag', 'schema', 'compiler'],
    repeats: 2,
    generate: fakeGenerator(),
  })
  assert.equal(runs.length, 2 * 4 * 2)
  const summary = summarizeExperiment(runs)
  assert.equal(summary.groups.compiler.runs, 4)
  assert.equal(summary.groups.compiler.constraintPassRate, 1)
  assert.equal(summary.groups.vanilla.constraintPassRate, 0)
  assert.ok(summary.comparison.vanilla.deltaConstraintPassRate > 0)
  assert.ok(summary.comparison.vanilla.deltaUnsupportedRate > 0)
  assert.ok(summary.groups.compiler.stability > 0)
  const csv = exportExperimentCsv(runs)
  assert.ok(csv.includes('taskId,group,repeat'))
  const md = formatExperimentMarkdown(summary)
  assert.match(md, /Full Compiler/)
  assert.match(md, /结构稳定性/)
})
test('人工评分表与回收统计', () => {
  const sheet = exportHumanScoreSheet([{ id: 't1' }], ['vanilla', 'compiler'])
  assert.ok(sheet.includes('teacherScore(1-5)'))
  const stats = importHumanScores([
    { teacherScore: 5, willingness: '直接使用' },
    { teacherScore: 3, willingness: '需修改' },
    { teacherScore: 2, willingness: '拒绝' },
  ])
  assert.equal(stats.scored, 3)
  assert.equal(stats.meanScore, 3.33)
  assert.equal(stats.willingnessRate.直接使用, 0.333)
})
test('createExperimentRun 指标口径', () => {
  const ledger = createLedger('p')
  addClaim(ledger, { text: 'a' })
  addClaim(ledger, { text: 'b', evidence: [{ kind: 'chunk', ref: 'c1' }] })
  const run = createExperimentRun({
    task: { id: 't1' },
    group: 'compiler',
    repeat: 1,
    plan,
    ledger,
    validation: { passed: true, violations: [], metrics: { coverage: 0.8, durationDrift: 1 } },
    subjectIssues: [{ code: 'MATH_ANSWER_MISMATCH', severity: 'error' }],
    repairs: [1, 2],
    latencyMs: 100,
    tokens: 50,
  })
  assert.equal(run.unsupportedRate, 0.5)
  assert.equal(run.mathErrors, 1)
  assert.equal(run.repairs, 2)
  assert.equal(run.constraintPassed, true)
})

console.log(`\n结果：${passed} 通过，${failed} 失败`)
if (failed > 0) {
  failures.forEach(({ name, error }) => console.error(`✗ ${name}\n  ${error.stack}`))
  process.exit(1)
}
