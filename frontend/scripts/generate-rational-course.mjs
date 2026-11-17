#!/usr/bin/env node
/**
 * generate-rational-course.mjs —— 用真实模型跑完整三阶段管线，把「有理数」
 * （七年级上册第一章，22 个乐乐课堂风格原视频精炼）生成一份系统性课程，
 * 落库为 src/mock/demoCourseRational.js，作为平台第二个内置样例
 * （与管理学科演示课程并存，首次进入工作室时一并注入）。
 *
 * 运行：node --import ./scripts/lib/register-alias.mjs scripts/generate-rational-course.mjs
 *   —— 或 npm run gen:rational-course
 *
 * 管线与 scripts/generate-demo-course.mjs 同构（蓝图 → IR 校验/修复 → 场景编译 →
 * 讲稿 beats），差异点：
 *   1. 模型走阶跃星辰 Step 5 Preview（api.stepfun.com/v1，密钥读 ~/.workbuddy/models.json，
 *      可用 STEPFUN_KEY 环境变量覆盖）；
 *   2. 学科域 math7（七年级数学），材料来自 scripts/data/rational-materials.md
 *      （22 个原视频的精炼内容 + 语言风格契约）；
 *   3. 语言风格契约（为师/徒儿人设、设问链、隐喻系统、口诀）注入每次调用的 user 消息；
 *   4. 课程 id 固定为 course-demo-youshushu（深链 /learn/course-demo-youshushu 稳定）。
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

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

const HERE = dirname(fileURLToPath(import.meta.url))
const MATERIAL_PATH = join(HERE, 'data/rational-materials.md')
const DEFAULT_OUT = join(HERE, '../src/mock/demoCourseRational.js')
const COURSE_ID = 'course-demo-youshushu'

// ---------------------------------------------------------------- 参数
const args = process.argv.slice(2)
function argOf(name, fallback) {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback
}
const OUT_PATH = argOf('out', DEFAULT_OUT)
const DURATION_MINUTES = Number(argOf('minutes', '40'))
const CONCURRENCY = Number(argOf('concurrency', '3'))

// ---------------------------------------------------------------- 模型（阶跃星辰 Step 5 Preview）
function stepKey() {
  if (process.env.STEPFUN_KEY) return process.env.STEPFUN_KEY
  const cfg = JSON.parse(readFileSync(join(os.homedir(), '.workbuddy/models.json'), 'utf8'))
  const found = cfg.find((m) => m.id === 'step-5-preview')
  if (!found) throw new Error('models.json 中未找到 step-5-preview 条目')
  return found.apiKey
}
const API_KEY = stepKey()
const BASE_URL = 'https://api.stepfun.com/v1'
const MODEL = 'step-5-preview'
const TIMEOUT_MS = 300000

console.log(`模型：${MODEL}  接口：${BASE_URL}  密钥：****${API_KEY.slice(-4)}`)

/** Step OpenAI 兼容直连（json_object 模式）。 */
async function stepJson(system, user, maxTokens = 8000) {
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
        temperature: 0.5,
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
async function requestJson(prompt, normalize, maxTokens = 32000) {
  const first = parseJsonLoose(await stepJson(prompt.system, prompt.user, maxTokens))
  const firstValue = first ? normalize(first) : null
  if (firstValue) return { value: firstValue, repaired: false }
  const second = parseJsonLoose(
    await stepJson(
      prompt.system,
      `${prompt.user}\n\n【修复要求】你上一次的返回没有通过结构校验（字段缺失或内容不完整）。请只修复结构，保持原有教学设计，重新返回完整 JSON。`,
      maxTokens,
    ),
  )
  const secondValue = second ? normalize(second) : null
  if (secondValue) return { value: secondValue, repaired: true }
  throw new Error('连续两次未通过结构校验')
}

// ---------------------------------------------------------------- 材料与风格契约
const materialText = readFileSync(MATERIAL_PATH, 'utf8')
const styleContract = `【语言风格契约 · 必须逐条遵守，优先级高于你的默认文风】
1. 讲师人设：自称「为师」，称学生「徒儿」；语气亦师亦友，像大哥哥给弟弟妹妹讲题，绝不居高临下。
2. 全程第二人称「你」，对话式行文：「你肯定见过」「咱先算」「对喽」「不难发现」。禁用书面语腔与课堂播音腔。
3. 每个知识点至少一处设问三连：「那么问题来了」「等等，难道…吗」「有小伙伴说…」，先让学生猜，再确认（「对喽」）或纠错。
4. 口头禅：刷题、秒杀、搞定、欧了、妥妥好用。畏难时自嘲「臣妾做不到呀」，纠正自己「哎呀我二了」。
5. 结构：开场钩子（「这段课，为师要和你聊聊 X」）→ 已学知识搭桥 → 设问 → 讲解 → 带数字的例题 → 「总结时间到」三点总结 → CTA「徒儿们速速刷题去吧」。
6. 强调句式：「你牢记一点」「我再强调一遍」「特别提醒你注意」「千万别忘了」。
7. 复用材料中的隐喻系统：正数国/负数国火拼、向后转=负负得正、汪星人散步=绝对值、警察巡逻=位置与路程、温度计=正负分界。理科规则配一句大白话口诀（奇负偶正、除变乘、小数化分数、负数不能裸奔、指数管辖范围）。
8. 短句为主，一句一个意思；重要规则出现后紧跟一个最小例子。`

const chapter = '有理数'
const objective =
  '掌握有理数的核心概念与全章运算：正负数的意义、有理数概念与分类、数轴、相反数、绝对值及其非负性、大小比较、加减乘除乘方与混合运算、科学记数法，能用「奇负偶正」等口诀定符号、按步骤规范运算'
const audience = '七年级学生（刚学完小学正数，第一次系统接触负数）'

const blueprintContext = {
  chapter,
  objective,
  audience,
  durationMinutes: DURATION_MINUTES,
  domain: 'math7',
  allowedChunkIds: [],
  materialText,
  requirements: [{ id: 'rq_1', text: objective }],
}

const project = {
  id: COURSE_ID,
  ownerId: '',
  status: 'ready',
  title: '',
  chapter,
  domain: 'math7',
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
  generatorVersion: 'rational-generator-v1',
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
console.log(`\n══════════ 阶段 1：课程蓝图（有理数 · ${DURATION_MINUTES} 分钟） ══════════`)
const blueprintArgs = {
  chapter,
  objective,
  audience,
  mode: 'course',
  durationMinutes: DURATION_MINUTES,
  materialText,
  sourceChunkIds: [],
  domain: 'math7',
  learnerProfile: null,
}

async function requestBlueprint(hint) {
  const prompt = courseBlueprintPrompt(blueprintArgs)
  stats.blueprintCalls += 1
  const raw = parseJsonLoose(
    await stepJson(
      prompt.system,
      `${prompt.user}\n\n${styleContract}${hint ? `\n\n${hint}` : ''}`,
      32000,
    ),
  )
  return normalizeCourseBlueprint(raw || {}, blueprintContext)
}

let blueprint = await requestBlueprint('')
if (!blueprint) {
  console.warn('首轮蓝图未通过归一化，带结构修复提示重试一次…')
  blueprint = await requestBlueprint(
    '【修复要求】你上一次的返回没有通过结构校验（场景不足、类型缺失或字段不完整）。请只修复结构，保持原有教学设计，重新返回完整 JSON。',
  )
}
if (!blueprint) {
  console.error('阶段 1 失败：模型大纲未通过归一化（场景不足或结构不完整）')
  process.exit(1)
}

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
if (built.validation.violations.length) {
  const codes = [...new Set(built.validation.violations.map((item) => item.code))].join(', ')
  console.warn(`IR 复检仍有 ${built.validation.violations.length} 处问题（${codes}），带违规明细重试一次蓝图…`)
  const score = (v) => [v.metrics.errorCount, v.violations.length]
  const retryBlueprint = await requestBlueprint(
    `【修复要求】你上一次的课程大纲未通过结构校验（${codes}）。请按约束调整场景数量与类型配比（讲解 / 小测 / 复盘均需覆盖，总数 9 个左右），保持原有教学设计，重新返回完整 JSON。`,
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
  chapter,
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
    const result = await requestJson(
      { ...prompt, user: `${prompt.user}\n\n${styleContract}` },
      (data) => normalizeCourseSceneContent(data, { project, outline, allowedSourceIds: [] }),
      32000,
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
      const repaired = await requestJson(
        { ...repairPrompt, user: `${repairPrompt.user}\n\n${styleContract}` },
        (data) => normalizeCourseSceneContent(data, { project, outline, allowedSourceIds: [] }),
        12000,
      )
      compiled = compileScene(outline, repaired.value)
      content = compiled.content
      stats.modelRepairs += 1
    } catch (error) {
      console.warn(`  ⚠ 场景「${outline.title}」定向修复失败：${error.message}`)
    }
  }

  let script = null
  try {
    stats.scriptCalls += 1
    const scriptPrompt = courseScriptPrompt({ project, outline, scene: content, sourceChunkIds: [] })
    const scriptResult = await requestJson(
      { ...scriptPrompt, user: `${scriptPrompt.user}\n\n${styleContract}` },
      (data) => normalizeCourseScript(data, { outline, lesson: content.lesson }),
      24000,
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
  source: 'D:/临时/七年级/01有理数（22 个原视频精炼，见 scripts/data/rational-materials.md）',
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

const banner = `/** 自动生成的有理数演示课程 —— scripts/generate-rational-course.mjs 产出，请勿手改。
 * 重新生成：npm run gen:rational-course（密钥读 ~/.workbuddy/models.json 的 step-5-preview）
 * 生成时间：${project.createdAt}｜模型：${MODEL}
 */
`
mkdirSync(dirname(OUT_PATH), { recursive: true })
writeFileSync(
  OUT_PATH,
  `${banner}\nexport const DEMO_COURSE_RATIONAL_META = ${JSON.stringify(meta, null, 2)}\n\nexport const DEMO_COURSE_RATIONAL_PROJECT = ${JSON.stringify(project, null, 2)}\n\nexport default DEMO_COURSE_RATIONAL_PROJECT\n`,
  'utf-8',
)
console.log(`\n已写入：${OUT_PATH}`)
