/**
 * experiments.js —— 浏览器侧实验运行器（研究工具第六层的入口）。
 *
 * 两种模式：
 * 1. 离线模拟（默认，无需模型）：用固定种子复现四类典型生成缺陷
 *    （先修逆序 / 时长失控 / 题型缺失 / 假材料引用），跑通指标口径，
 *    用于演示与方法论说明；结论标注"模拟数据"。
 * 2. 真实模型（需配置模型）：compiler 组走完整编译管线，
 *    vanilla 组只生成蓝图不做验证修复，其余组按同样输入降级。
 *
 * 指标计算全部来自 utils/courseExperiment.js（node 可单测）。
 */

import { compileCourseBlueprint, generateCourseBlueprint } from './courseStudio'
import { runExperiment, summarizeExperiment } from '@/utils/courseExperiment'
import { validateCoursePlan } from '@/utils/courseValidator'
import { normalizeCoursePlan } from '@/utils/courseIR'
import { createLedger, extractSceneClaims, auditLedger } from '@/utils/evidenceLedger'
import { repairCoursePlan } from '@/utils/courseRepair'

/** 内置实验任务集（数学 8 + 通用 4），覆盖不同知识点/时长/学段。 */
export const BUILTIN_TASKS = [
  { id: 'm7-eq-1', chapter: '一元一次方程', objective: '掌握移项解一元一次方程并回带检验', audience: '七年级学生', durationMinutes: 24, domain: 'math7' },
  { id: 'm7-eq-2', chapter: '一元一次方程', objective: '理解等式性质并解含括号的方程', audience: '七年级学生', durationMinutes: 30, domain: 'math7' },
  { id: 'm7-num-1', chapter: '有理数', objective: '掌握有理数混合运算的符号规则', audience: '七年级学生', durationMinutes: 20, domain: 'math7' },
  { id: 'm7-num-2', chapter: '有理数', objective: '辨析相反数、绝对值与倒数的特殊值', audience: '七年级学生', durationMinutes: 18, domain: 'math7' },
  { id: 'm7-poly-1', chapter: '整式运算', objective: '掌握合并同类项与去括号', audience: '七年级学生', durationMinutes: 26, domain: 'math7' },
  { id: 'm7-ineq-1', chapter: '不等式', objective: '理解不等式性质并解一元一次不等式', audience: '七年级学生', durationMinutes: 28, domain: 'math7' },
  { id: 'm7-eq-3', chapter: '一元一次方程', objective: '考前冲刺：方程易错点与答题表达', audience: '七年级学生', durationMinutes: 16, domain: 'math7', mode: 'sprint' },
  { id: 'm7-review', chapter: '阶段复习', objective: '汇总有理数到方程的特殊值与方法清单', audience: '七年级学生', durationMinutes: 32, domain: 'math7' },
  { id: 'gen-mkt-1', chapter: '市场营销', objective: '理解 4P 理论并分析一个真实产品案例', audience: '经管专业本科生', durationMinutes: 30, domain: 'management' },
  { id: 'gen-mkt-2', chapter: '市场营销', objective: '掌握市场细分与目标市场选择方法', audience: '经管专业本科生', durationMinutes: 24, domain: 'management' },
  { id: 'gen-phys-1', chapter: '牛顿运动定律', objective: '理解惯性并会用牛顿第二定律做受力分析', audience: '高中一年级学生', durationMinutes: 30, domain: 'general' },
  { id: 'gen-phys-2', chapter: '牛顿运动定律', objective: '辨析作用力与反作用力的常见误解', audience: '高中一年级学生', durationMinutes: 20, domain: 'general' },
]

/** 确定性伪随机（同一 task+group+repeat 得到同一序列，保证实验可复现）。 */
function seededRandom(seed) {
  let state = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    state ^= seed.charCodeAt(i)
    state = Math.imul(state, 16777619)
  }
  return () => {
    state = Math.imul(state ^ (state >>> 15), 2246822507)
    state = Math.imul(state ^ (state >>> 13), 3266489909)
    return ((state ^= state >>> 16) >>> 0) / 4294967296
  }
}

/**
 * 模拟"典型模型输出"：结构大体完整，但带四类常见缺陷。
 * 这是对照组（vanilla/rag/schema）的输入，也是 compiler 组的修复对象。
 */
function simulateRawPlan(task, seed) {
  const rand = seededRandom(seed)
  const minutes = task.durationMinutes
  const scenes = [
    {
      id: 'scene_1',
      type: 'lecture',
      title: `认识${task.chapter}`,
      description: `围绕「${task.objective}」建立问题地图。`,
      teachingObjective: `能说清「${task.chapter}」的学习目标与边界。`,
      keyPoints: ['核心概念与适用条件', '常见误解'],
      estimatedMinutes: Math.round(minutes * 0.45),
      difficultyTier: 1,
      sourceChunkIds: [],
    },
    {
      id: 'scene_2',
      type: 'lecture',
      title: '深入辨析',
      description: '从材料中最关键的内容切入，解释概念之间的关系。',
      teachingObjective: '能用自己的话解释核心关系并给出一个例子。',
      keyPoints: ['核心概念与适用条件', '关键步骤与判断依据'],
      estimatedMinutes: Math.round(minutes * 0.4),
      difficultyTier: 2,
      sourceChunkIds: [],
    },
    {
      id: 'scene_3',
      type: 'practice',
      title: '变式应用',
      description: '把本课内容应用到一个新情境。',
      teachingObjective: '能把本课知识迁移到新的问题情境中。',
      keyPoints: ['关键步骤与判断依据'],
      estimatedMinutes: 6,
      difficultyTier: 2,
      sourceChunkIds: [],
    },
  ]
  // 缺陷 1：难度逆序（常见：模型把综合场景放前面）
  if (rand() > 0.5) {
    scenes[0].difficultyTier = 3
    scenes[1].difficultyTier = 1
  }
  // 缺陷 2：时长失控（各场景时长相加远超预算）
  scenes.forEach((scene) => {
    scene.estimatedMinutes = Math.round(scene.estimatedMinutes * (1.4 + rand()))
  })
  // 缺陷 3：quiz 场景题型规格不足（只给 1 类 1 题）
  const quizIndex = rand() > 0.5 ? 2 : 1
  scenes.splice(quizIndex, 0, {
    id: `scene_q${quizIndex}`,
    type: 'quiz',
    title: '检索练习',
    description: '检查概念边界。',
    teachingObjective: '能独立回忆关键内容。',
    keyPoints: ['核心概念与适用条件'],
    estimatedMinutes: 8,
    difficultyTier: 1,
    sourceChunkIds: [],
    exerciseSpec: { types: ['choice'], count: 1 },
  })
  // 缺陷 4：引用不存在的材料片段（模型编造来源）
  if (rand() > 0.35) {
    scenes[scenes.length - 1].sourceChunkIds = ['chunk-ghost-01']
  }
  return {
    courseTitle: `${task.chapter} · 主题学习`,
    courseSummary: `围绕“${task.objective}”组织的课程。`,
    outlines: scenes,
  }
}

/** 离线模拟生成器：四组差异全部来自编译器开关，不依赖模型。 */
export function createSimulationGenerator() {
  return async ({ task, group, repeat }) => {
    const seed = `${task.id}|${group}|${repeat}`
    const rand = seededRandom(seed)
    const context = {
      chapter: task.chapter,
      objective: task.objective,
      audience: task.audience,
      durationMinutes: task.durationMinutes,
      domain: task.domain,
      allowedChunkIds: ['c1', 'c2', 'c3'],
      requirements: [{ id: 'rq_1', text: task.objective }],
    }
    const started = Date.now()
    if (group === 'compiler') {
      const plan = normalizeCoursePlan(simulateRawPlan(task, `${task.id}|raw`), context)
      const validation = validateCoursePlan(plan)
      const { plan: repaired, repairs } = repairCoursePlan(plan, validation)
      const ledger = createLedger(repaired.courseId)
      const scene = repaired.scenes[0]
      extractSceneClaims(ledger, {
        plan: repaired,
        scene,
        content: {
          kind: 'board',
          lesson: {
            blocks: [
              { id: 'b1', type: 'definition', term: task.chapter, definition: '模拟定义', evidenceRefs: ['c1'] },
            ],
          },
        },
      })
      return {
        plan: repaired,
        ledger,
        validation: validateCoursePlan(repaired),
        subjectIssues: [],
        repairs: repairs.length,
        latencyMs: 900 + Math.round(rand() * 400),
        tokens: 1200 + Math.round(rand() * 300),
        notes: 'simulation',
      }
    }
    // vanilla / rag / schema：不跑验证与修复
    const plan = normalizeCoursePlan(simulateRawPlan(task, `${task.id}|raw`), context)
    const ledger = createLedger(plan.courseId)
    // 无依据结论：模拟模型直接下结论不挂证据
    extractSceneClaims(ledger, {
      plan,
      scene: plan.scenes[0],
      content: { kind: 'board', lesson: { blocks: [{ id: 'b1', type: 'callout', tone: 'warn', text: '这是一个没有材料依据的结论' }] } },
    })
    // schema 组：结构归一化但保留违规；rag 组额外挂材料但不修复；vanilla 最原样
    const broken = JSON.parse(JSON.stringify(plan))
    if (group === 'schema') {
      broken.scenes.forEach((scene) => {
        scene.estimatedMinutes = Math.round(scene.estimatedMinutes * 1.6)
      })
    }
    return {
      plan: broken,
      ledger,
      validation: validateCoursePlan(broken),
      subjectIssues: group === 'vanilla' && rand() > 0.6 ? [{ code: 'MATH_ANSWER_MISMATCH', severity: 'error' }] : [],
      repairs: 0,
      latencyMs: 500 + Math.round(rand() * 300),
      tokens: 800 + Math.round(rand() * 200),
      notes: 'simulation',
    }
  }
}

/** 真实模型生成器：compiler 组走编译管线，vanilla 组只生成蓝图。 */
export function createModelGenerator() {
  return async ({ task, group }) => {
    const input = {
      chapter: task.chapter,
      objective: task.objective,
      audience: task.audience,
      mode: task.mode || 'course',
      durationMinutes: task.durationMinutes,
      domain: task.domain,
      materialIds: [],
    }
    const started = Date.now()
    if (group === 'compiler') {
      const result = await compileCourseBlueprint(input)
      return {
        plan: result.plan,
        ledger: null,
        validation: result.validation,
        subjectIssues: [],
        repairs: (result.repairs || []).length,
        latencyMs: Date.now() - started,
        tokens: 0,
        notes: result.fallback ? 'fallback' : '',
      }
    }
    const base = await generateCourseBlueprint(input)
    const plan = base.plan || null
    return {
      plan,
      ledger: null,
      validation: plan ? validateCoursePlan(plan) : null,
      subjectIssues: [],
      repairs: 0,
      latencyMs: Date.now() - started,
      tokens: 0,
      notes: base.fallback ? 'fallback' : '',
    }
  }
}

/** 跑一轮完整实验并返回 runs + summary。 */
export async function runBrowserExperiment({
  tasks = BUILTIN_TASKS,
  groups = ['vanilla', 'rag', 'schema', 'compiler'],
  repeats = 3,
  mode = 'simulation',
  onProgress,
}) {
  const generate = mode === 'model' ? createModelGenerator() : createSimulationGenerator()
  const runs = await runExperiment({ tasks, groups, repeats, generate, onProgress })
  const summary = summarizeExperiment(runs)
  return { runs, summary }
}

/** 证据账本审计（编译器面板用）。 */
export function auditProjectLedger(project) {
  if (!project?.ledger) return null
  const audit = auditLedger(project.ledger, project.sourceChunkIds || [])
  const entryMap = new Map((project.ledger.entries || []).map((entry) => [entry.id, entry]))
  return {
    ...audit,
    claims: (project.ledger.claims || []).map((claim) => ({
      id: claim.id,
      sceneId: claim.sceneId,
      target: claim.target,
      kind: claim.kind,
      text: claim.text,
      evidence: (claim.evidenceIds || [])
        .map((id) => entryMap.get(id))
        .filter(Boolean)
        .map((entry) => ({ kind: entry.kind, ref: entry.ref, locator: entry.locator, quote: entry.quote })),
    })),
  }
}
