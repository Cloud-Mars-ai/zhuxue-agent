#!/usr/bin/env node
/**
 * generate-demo-course.mjs —— 用真实模型跑完整两阶段管线，生成一份
 * 「系统性课程」演示数据（≥8 场景、过课程编译器全门禁），落库为
 * src/mock/demoCourse.js，供首次进入工作室时注入（开箱即有完整体验）。
 *
 * 运行：node --import ./scripts/lib/register-alias.mjs scripts/generate-demo-course.mjs
 *   —— 或 npm run gen:demo-course
 *
 * 管线（与生产 api/courseStudio.js 同构，但不依赖 pinia/store）：
 *   阶段 1  蓝图：courseBlueprintPrompt → DeepSeek → normalizeCourseBlueprint
 *           → planFromBlueprint(IR) → validateCoursePlan → repairCoursePlan → 复检；
 *           归一化失败或复检残留违规（如 STRUCT_MIN_SCENES）时带修复提示重试一次，
 *           仅接受严格更干净的结果（validate-and-accept），否则保留首轮
 *   阶段 2  场景：courseScenePrompt → DeepSeek → normalizeCourseSceneContent
 *           → 编译门禁（学科一致性 + QUIZ-* 题目质量 + 证据账本 + 确定性修复；
 *             残留 error 交模型做一次定向修复）
 *   阶段 3  讲稿：courseScriptPrompt → DeepSeek → normalizeCourseScript
 *           （失败回退 buildLocalCourseScript 确定性兜底）
 *
 * 密钥从 frontend/.env 读取（DEEPSEEK_API_KEY / DEEPSEEK_BASE_URL / DEEPSEEK_MODEL），
 * 与生产通道同一密钥；本脚本不写 .env、不碰浏览器存储。
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  courseBlueprintPrompt,
  courseScenePrompt,
  courseSceneRepairPrompt,
  courseScriptPrompt,
} from '../src/api/prompts/courseStudio.js'
import {
  normalizeCourseBlueprint,
  normalizeCourseSceneContent,
  buildLocalCourseSceneContent,
} from '../src/utils/courseStudio.js'
import { normalizeLearnerProfile } from '../src/utils/learnerProfile.js'
import { planFromBlueprint } from '../src/utils/courseIR.js'
import { validateCoursePlan, validateQuizContent } from '../src/utils/courseValidator.js'
import { repairCoursePlan, repairSceneContent } from '../src/utils/courseRepair.js'
import { createLedger, extractSceneClaims, auditLedger } from '../src/utils/evidenceLedger.js'
import { checkSubjectConsistency } from '../src/utils/subjectCheck/index.js'
import { normalizeCourseScript, buildLocalCourseScript } from '../src/utils/courseScript.js'
import { parseJsonLoose } from '../src/utils/json.js'
import { courseSceneFingerprint } from '../src/utils/courseStudio.js'
import { COURSE_OUTLINE, outlineToText } from '../src/mock/courseOutline.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ENV_PATH = join(HERE, '../.env')
const DEFAULT_OUT = join(HERE, '../src/mock/demoCourse.js')

// ---------------------------------------------------------------- 参数
const args = process.argv.slice(2)
function argOf(name, fallback) {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback
}
const OUT_PATH = argOf('out', DEFAULT_OUT)
const DURATION_MINUTES = Number(argOf('minutes', '36'))
const CONCURRENCY = Number(argOf('concurrency', '3'))

// ---------------------------------------------------------------- 环境
function loadEnv() {
  if (!existsSync(ENV_PATH)) return {}
  const env = {}
  for (const line of readFileSync(ENV_PATH, 'utf-8').split('\n')) {
    const matched = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (matched) env[matched[1]] = matched[2]
  }
  return env
}

const env = loadEnv()
const API_KEY = env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || ''
const BASE_URL = (env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/+$/, '')
const MODEL = env.DEEPSEEK_MODEL || 'deepseek-chat'
const TIMEOUT_MS = 150000

if (!API_KEY) {
  console.error('未找到 DEEPSEEK_API_KEY（frontend/.env 或环境变量），无法生成演示课程')
  process.exit(2)
}
console.log(`模型：${MODEL}  接口：${BASE_URL}  密钥：****${API_KEY.slice(-4)}`)

/** DeepSeek OpenAI 兼容直连（json_object 模式），与生产 sendChatJSON 同协议。 */
async function deepseekJson(system, user, maxTokens = 3000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const resp = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.4,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })
    if (!resp.ok) {
      const detail = await resp.text()
      throw new Error(`HTTP ${resp.status}: ${detail.slice(0, 300)}`)
    }
    const data = await resp.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content || !content.trim()) throw new Error('模型未返回有效内容')
    return content
  } finally {
    clearTimeout(timer)
  }
}

/** 结构化请求 + 一次「只修复结构」重试（对齐生产 requestStructured 策略）。 */
async function requestJson(prompt, normalize) {
  const first = parseJsonLoose(await deepseekJson(prompt.system, prompt.user, prompt.maxTokens))
  const firstValue = first ? normalize(first) : null
  if (firstValue) return { value: firstValue, repaired: false }
  const second = parseJsonLoose(
    await deepseekJson(
      prompt.system,
      `${prompt.user}\n\n【修复要求】你上一次的返回没有通过结构校验（字段缺失或内容不完整）。请只修复结构，保持原有教学设计，重新返回完整 JSON。`,
      Math.max(2400, prompt.maxTokens || 2400),
    ),
  )
  const secondValue = second ? normalize(second) : null
  if (secondValue) return { value: secondValue, repaired: true }
  throw new Error('连续两次未通过结构校验')
}

// ---------------------------------------------------------------- 课程选题
const chapter = COURSE_OUTLINE.find((item) => item.title.includes('决策与计划')) || COURSE_OUTLINE[2]
const materialText = outlineToText([chapter])
const objective =
  '理解计划职能的含义、计划的主要类型与制定过程，能用一个企业案例说明计划如何衔接组织与控制'
const audience = '高校管理类专业二年级学生'

const blueprintContext = {
  chapter: chapter.title,
  objective,
  audience,
  durationMinutes: DURATION_MINUTES,
  domain: 'management',
  allowedChunkIds: [],
  materialText,
  requirements: [{ id: 'rq_1', text: objective }],
}

const project = {
  id: `course-demo-${Date.now().toString(36)}`,
  ownerId: '',
  status: 'ready',
  title: '',
  chapter: chapter.title,
  domain: 'management',
  objective,
  audience,
  mode: 'course',
  durationMinutes: DURATION_MINUTES,
  summary: '',
  languageDirective: '',
  learnerProfile: null,
  outlines: [],
  sourceChunkIds: [],
  sources: [],
  scenes: [],
  plan: null,
  validation: null,
  repairs: [],
  ledger: null,
  fallback: false,
  demo: true,
  generatorVersion: 'demo-generator-v1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const stats = {
  blueprintCalls: 0,
  sceneCalls: 0,
  sceneRepairCalls: 0,
  scriptCalls: 0,
  sceneFallbacks: 0,
  scriptFallbacks: 0,
  deterministicRepairs: 0,
  modelRepairs: 0,
}

// ---------------------------------------------------------------- 阶段 1：蓝图 + IR
console.log(`\n══════════ 阶段 1：课程蓝图（${chapter.title} · ${DURATION_MINUTES} 分钟） ══════════`)
const blueprintArgs = {
  chapter: chapter.title,
  objective,
  audience,
  mode: 'course',
  durationMinutes: DURATION_MINUTES,
  materialText,
  sourceChunkIds: [],
  domain: 'management',
  learnerProfile: null,
}

/** 请求一次蓝图；hint 非空时附在 user 消息末尾（对齐 requestJson 的结构修复策略）。 */
async function requestBlueprint(hint) {
  const prompt = courseBlueprintPrompt(blueprintArgs)
  stats.blueprintCalls += 1
  const raw = parseJsonLoose(
    await deepseekJson(
      prompt.system,
      hint ? `${prompt.user}\n\n${hint}` : prompt.user,
      prompt.maxTokens || 4000,
    ),
  )
  return normalizeCourseBlueprint(raw || {}, blueprintContext)
}

let blueprint = await requestBlueprint('')
if (!blueprint) {
  // 首轮归一化失败（场景不足/结构不完整）：带修复提示重试一次再判死刑
  console.warn('首轮蓝图未通过归一化，带结构修复提示重试一次…')
  blueprint = await requestBlueprint(
    '【修复要求】你上一次的返回没有通过结构校验（场景不足、类型缺失或字段不完整）。请只修复结构，保持原有教学设计，重新返回完整 JSON。',
  )
}
if (!blueprint) {
  console.error('阶段 1 失败：模型大纲未通过归一化（场景不足或结构不完整）')
  process.exit(1)
}
/** 蓝图 → IR → 校验 → 确定性修复 → 复检；返回 null 表示无法构建 IR。 */
function buildValidatedPlan(bp) {
  const plan = planFromBlueprint(bp, blueprintContext)
  if (!plan) return null
  const validation1 = validateCoursePlan(plan)
  const { plan: repaired, repairs, unresolved } = repairCoursePlan(plan, validation1)
  return { plan: repaired, repairs, unresolved, validation: validateCoursePlan(repaired) }
}

let built = buildValidatedPlan(blueprint)
if (!built) {
  console.error('阶段 1 失败：无法构建课程 IR')
  process.exit(1)
}
// 结构 warning（如 STRUCT_MIN_SCENES 场景数/类型不足）由模型重规划消解：带违规明细
// 重试一次蓝图；验收按 (error 数, 违规总数) 字典序严格更优才接受（validate-and-accept
// 铁律——绝不用 error 换 warning），否则保留首轮
if (built.validation.violations.length) {
  const codes = [...new Set(built.validation.violations.map((item) => item.code))].join(', ')
  console.warn(
    `IR 复检仍有 ${built.validation.violations.length} 处问题（${codes}），带违规明细重试一次蓝图…`,
  )
  const score = (v) => [v.metrics.errorCount, v.violations.length]
  const retryBlueprint = await requestBlueprint(
    `【修复要求】你上一次的课程大纲未通过结构校验（${codes}）。请按约束调整场景数量与类型配比（讲解 / 小测 / 案例应用 / 复盘均需覆盖，总数不少于 8 个），保持原有教学设计，重新返回完整 JSON。`,
  )
  const retryBuilt = retryBlueprint ? buildValidatedPlan(retryBlueprint) : null
  const better =
    retryBuilt &&
    (score(retryBuilt.validation)[0] < score(built.validation)[0] ||
      (score(retryBuilt.validation)[0] === score(built.validation)[0] &&
        score(retryBuilt.validation)[1] < score(built.validation)[1]))
  if (better) {
    console.log('重试蓝图校验结果更优，采用重试结果')
    blueprint = retryBlueprint
    built = retryBuilt
  } else {
    console.warn('重试蓝图未更优，保留首轮结果')
  }
}

console.log(`课程标题：${blueprint.courseTitle}`)
console.log(`场景数：${blueprint.outlines.length}`)
for (const outline of blueprint.outlines) {
  console.log(`  ${outline.order}. [${outline.type}] ${outline.title}（${outline.estimatedMinutes} 分钟）`)
}

const { plan: repairedPlan, repairs: planRepairs, unresolved, validation } = built
console.log(
  `IR 校验：error=${validation.metrics.errorCount} warning=${
    validation.violations.length - validation.metrics.errorCount
  } 覆盖率=${validation.metrics.coverage} 时长漂移=${validation.metrics.durationDrift} 分钟`,
)
if (planRepairs.length) {
  console.log(`计划层确定性修复 ${planRepairs.length} 处：${[...new Set(planRepairs.map((r) => r.code))].join(', ')}`)
  stats.deterministicRepairs += planRepairs.length
}
if (unresolved.length) {
  console.log(`交模型的问题 ${unresolved.length} 处：${unresolved.map((u) => u.code).join(', ')}`)
}

project.title = blueprint.courseTitle
project.summary = blueprint.courseSummary
project.languageDirective = blueprint.languageDirective
project.learnerProfile = normalizeLearnerProfile(blueprint.learnerProfile, {
  objective,
  chapter: chapter.title,
  audience,
  materialText,
})
project.outlines = blueprint.outlines
project.plan = repairedPlan
project.validation = validation
project.repairs = planRepairs
project.ledger = createLedger(repairedPlan.courseId)
project.updatedAt = new Date().toISOString()

// ---------------------------------------------------------------- 阶段 2/3：场景 + 讲稿
const outlines = [...blueprint.outlines].sort((a, b) => a.order - b.order)
const ledger = project.ledger

/** 与生产 compileSceneContent 同构：学科一致性 + QUIZ-* + 证据账本 + 确定性修复。 */
function compileScene(outline, content) {
  const scene =
    repairedPlan.scenes.find((item) => item.id === outline.id) ||
    repairedPlan.scenes[repairedPlan.scenes.length - 1] ||
    outline
  const subject = checkSubjectConsistency({
    domain: project.domain,
    subject: project.learnerProfile?.subject || '',
    scene,
    content,
  })
  const quizIssues = validateQuizContent([{ outlineId: outline.id, title: outline.title, content }])
  const issues = [...subject.issues, ...quizIssues]
  const evidence = extractSceneClaims(ledger, { plan: repairedPlan, scene, content })
  const { content: fixed, repairs, unresolved: sceneUnresolved } = repairSceneContent(scene, content, issues)
  if (fixed !== content) {
    for (const claim of evidence) {
      const index = ledger.claims.findIndex((item) => item.id === claim.id)
      if (index >= 0) ledger.claims.splice(index, 1)
    }
    evidence.length = 0
    evidence.push(...extractSceneClaims(ledger, { plan: repairedPlan, scene, content: fixed }))
  }
  const recheck = [
    ...checkSubjectConsistency({
      domain: project.domain,
      subject: project.learnerProfile?.subject || '',
      scene,
      content: fixed,
    }).issues,
    ...validateQuizContent([{ outlineId: outline.id, title: outline.title, content: fixed }]),
  ]
  return {
    content: fixed,
    evidence: evidence.map((claim) => ({
      id: claim.id,
      target: claim.target,
      kind: claim.kind,
      text: claim.text,
      evidenceIds: claim.evidenceIds,
    })),
    subjectIssues: recheck,
    repairs,
    unresolved: sceneUnresolved,
  }
}

async function generateOne(outline, index) {
  const previous = outlines[index - 1] || null
  const prompt = courseScenePrompt({
    project,
    outline,
    materialText,
    sourceChunkIds: [],
    previousScene: previous,
  })
  let content = null
  let fallback = false
  try {
    stats.sceneCalls += 1
    const result = await requestJson(prompt, (data) =>
      normalizeCourseSceneContent(data, { project, outline, allowedSourceIds: [] }),
    )
    content = result.value
  } catch (error) {
    console.warn(`  ⚠ 场景「${outline.title}」模型生成失败（${error.message}），回退本地兜底`)
    content = buildLocalCourseSceneContent(project, outline)
    fallback = true
    stats.sceneFallbacks += 1
  }

  let compiled = compileScene(outline, content)
  content = compiled.content
  const blocking = (compiled.unresolved || []).filter((item) => item.severity === 'error')
  if (blocking.length) {
    try {
      stats.sceneRepairCalls += 1
      const repairPrompt = courseSceneRepairPrompt({
        project,
        outline,
        materialText,
        sourceChunkIds: [],
      })
      const repaired = await requestJson(repairPrompt, (data) =>
        normalizeCourseSceneContent(data, { project, outline, allowedSourceIds: [] }),
      )
      compiled = compileScene(outline, repaired.value)
      content = compiled.content
      stats.modelRepairs += 1
    } catch (error) {
      console.warn(`  ⚠ 场景「${outline.title}」定向修复失败：${error.message}`)
    }
  }

  // 第三层：讲稿 beats
  let script = null
  try {
    stats.scriptCalls += 1
    const scriptPrompt = courseScriptPrompt({ project, outline, scene: content, sourceChunkIds: [] })
    const scriptResult = await requestJson(scriptPrompt, (data) =>
      normalizeCourseScript(data, { outline, lesson: content.lesson }),
    )
    script = scriptResult.value
  } catch (error) {
    console.warn(`  ⚠ 场景「${outline.title}」讲稿模型生成失败，回退本地兜底`)
    script = buildLocalCourseScript(project, outline, content)
    stats.scriptFallbacks += 1
  }

  return {
    outlineId: outline.id,
    status: fallback ? 'fallback' : 'ready',
    content,
    script,
    sources: [],
    repaired: false,
    fingerprint: courseSceneFingerprint(outline),
    evidence: compiled.evidence,
    subjectIssues: compiled.subjectIssues,
    repairs: compiled.repairs,
    error: '',
  }
}

console.log(`\n══════════ 阶段 2/3：逐场景生成（并发 ${CONCURRENCY}） ══════════`)
const scenes = new Array(outlines.length)
let cursor = 0
async function worker() {
  while (cursor < outlines.length) {
    const index = cursor
    cursor += 1
    const outline = outlines[index]
    const scene = await generateOne(outline, index)
    scenes[index] = scene
    const issueCount = scene.subjectIssues.length
    console.log(
      `  ✓ ${String(index + 1).padStart(2, '0')} [${outline.type}] ${outline.title}` +
        ` — ${scene.content.kind}` +
        `，问题残留 ${issueCount}` +
        `，修复 ${scene.repairs.length}` +
        `，讲稿 ${scene.script?.beats?.length || 0} 拍` +
        (scene.status === 'fallback' ? '（本地兜底）' : ''),
    )
    stats.deterministicRepairs += scene.repairs.length
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, outlines.length) }, worker))

project.scenes = scenes
project.fallback = scenes.some((scene) => scene.status === 'fallback')
project.updatedAt = new Date().toISOString()

// ---------------------------------------------------------------- 汇总落库
const audit = auditLedger(project.ledger, [])
const quizScenes = scenes.filter((scene) => scene.content?.kind === 'quiz')
const boardScenes = scenes.filter((scene) => scene.content?.kind === 'board')
const practiceScenes = scenes.filter((scene) => scene.content?.kind === 'practice')
const remainingErrors = scenes.flatMap((scene) =>
  scene.subjectIssues.filter((item) => item.severity === 'error').map((item) => `${scene.outlineId}:${item.code}`),
)
const meta = {
  generatedAt: project.createdAt,
  model: MODEL,
  durationMinutes: DURATION_MINUTES,
  sceneCount: scenes.length,
  lectureCount: outlines.filter((o) => o.type === 'lecture').length,
  quizCount: quizScenes.length,
  practiceCount: practiceScenes.length,
  reviewCount: outlines.filter((o) => o.type === 'review').length,
  boardSceneCount: boardScenes.length,
  questionCount: quizScenes.reduce((sum, scene) => sum + (scene.content.questions?.length || 0), 0),
  scriptBeatCount: scenes.reduce((sum, scene) => sum + (scene.script?.beats?.length || 0), 0),
  validation: {
    passed: validation.passed,
    errorCount: validation.metrics.errorCount,
    warningCount: validation.violations.length - validation.metrics.errorCount,
    coverage: validation.metrics.coverage,
    durationDrift: validation.metrics.durationDrift,
    codes: [...new Set(validation.violations.map((item) => item.code))],
  },
  ledger: { total: audit.total, supportRate: audit.supportRate, unsupportedRate: audit.unsupportedRate },
  remainingErrorIssues: remainingErrors,
  stats,
}

console.log('\n══════════ 生成汇总 ══════════')
console.log(`场景：${scenes.length}（讲解 ${meta.lectureCount} / 小测 ${meta.quizCount} / 应用 ${meta.practiceCount} / 收束 ${meta.reviewCount}）`)
console.log(`题目：${meta.questionCount} 道；讲稿：${meta.scriptBeatCount} 拍`)
console.log(`IR 门禁：${validation.passed ? '通过' : '未通过'}（error ${validation.metrics.errorCount} / warning ${validation.violations.length - validation.metrics.errorCount}）`)
console.log(`证据账本：${audit.total} 条声明，有据率 ${(audit.supportRate * 100).toFixed(0)}%`)
console.log(`残留 error 级学科问题：${remainingErrors.length ? remainingErrors.join(', ') : '无'}`)
console.log(`调用统计：蓝图 ${stats.blueprintCalls} / 场景 ${stats.sceneCalls} / 定向修复 ${stats.sceneRepairCalls} / 讲稿 ${stats.scriptCalls}`)

if (!scenes.length || remainingErrors.length) {
  console.error('\n演示课程未达标（场景为空或残留 error 级问题），不写入文件')
  process.exit(1)
}

const banner = `/** 自动生成的系统性演示课程 —— scripts/generate-demo-course.mjs 产出，请勿手改。
 * 重新生成：npm run gen:demo-course（需 frontend/.env 配置 DEEPSEEK_API_KEY）
 * 生成时间：${project.createdAt}｜模型：${MODEL}
 */
`
mkdirSync(dirname(OUT_PATH), { recursive: true })
writeFileSync(
  OUT_PATH,
  `${banner}\nexport const DEMO_COURSE_META = ${JSON.stringify(meta, null, 2)}\n\nexport const DEMO_COURSE_PROJECT = ${JSON.stringify(project, null, 2)}\n\nexport default DEMO_COURSE_PROJECT\n`,
  'utf-8',
)
console.log(`\n已写入：${OUT_PATH}`)
