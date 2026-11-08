#!/usr/bin/env node
/**
 * test-openmaic-live.mjs —— OpenMAIC 管线真实模型端到端实测。
 * 运行：node scripts/test-openmaic-live.mjs
 *
 * 直连 DeepSeek（key 从 frontend/.env 读取，与生产通道同一密钥），
 * 跑完整两阶段链路：
 *   阶段 1  大纲：需求 → requirements-to-outlines 提示词 → 三键 JSON 契约
 *   阶段 2  场景：slide → PPTElement → 结构化板书；quiz → 题目适配
 * 每阶段打印原始响应（截断）、解析结果、适配结果与校验结论。
 *
 * 本脚本不写任何文件、不碰 store/pinia；失败以非零码退出。
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  generateSceneOutlines,
  normalizeSceneOutlines,
} from '../src/api/openmaic/outlineGenerator.js'
import { generateOpenmaicScene } from '../src/api/openmaic/sceneGenerator.js'
import { checkScientificModel } from '../src/api/openmaic/scientificModel.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ENV_PATH = join(HERE, '../.env')

function loadEnv() {
  if (!existsSync(ENV_PATH)) return {}
  const env = {}
  for (const line of readFileSync(ENV_PATH, 'utf-8').split('\n')) {
    const matched = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (matched) env[matched[1]] = matched[2]
  }
  return env
}

const env = loadEnv()
const API_KEY = env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || ''
const BASE_URL = (env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/+$/, '')
const MODEL = env.DEEPSEEK_MODEL || 'deepseek-chat'
const TIMEOUT_MS = 120000

if (!API_KEY) {
  console.error('未找到 DEEPSEEK_API_KEY（frontend/.env 或环境变量）')
  process.exit(2)
}

console.log(`模型：${MODEL}  接口：${BASE_URL}  密钥：****${API_KEY.slice(-4)}`)

/** DeepSeek OpenAI 兼容直连适配器（OpenAI 协议：system + user）。
 *  maxTokens 可按场景调整：interactive 的 simulation HTML 体积大，
 *  默认 3000 会被截断导致 widget-config 不完整（实测捕获）。 */
async function deepseekCall(system, user, maxTokens = 3000) {
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
        temperature: 0.3,
        max_tokens: maxTokens,
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

function preview(value, max = 400) {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return text.length > max ? `${text.slice(0, max)}…（共 ${text.length} 字符）` : text
}

const report = []
function stage(name, ok, detail) {
  report.push({ name, ok, detail })
  console.log(`\n${ok ? '✅' : '❌'} ${name}`)
  if (detail) console.log(detail)
}

// ── 阶段 1：大纲 ──────────────────────────────────────────────

console.log('\n══════════ 阶段 1：OpenMAIC 大纲生成 ══════════')
const requirement = [
  '学习目标：理解计划职能的含义、类型与制定过程，能用一个企业案例说明计划如何衔接组织与控制。',
  '章节：管理学的计划职能',
  '受众：高校管理类专业二年级学生',
  '时长：约 30 分钟',
].join('\n')

const outlineResult = await generateSceneOutlines(
  { requirement, userNickname: '管理类专业学生', userBio: '侧重概念理解与案例应用' },
  deepseekCall,
  {
    teacherContext:
      '## Host project rules\n- 所有内容使用简体中文。\n- 场景总数 4-6 个，其中至少 1 个 quiz；如概念适合动手模拟，可用 1 个 interactive（widgetType 选 simulation）。\n- 数学与公式用纯文本。',
    maxScenes: 6,
  },
)

if (!outlineResult.success) {
  stage('阶段 1 大纲生成', false, `失败：${outlineResult.error}`)
  console.error('\n实测中止：大纲阶段失败')
  process.exit(1)
}
stage('阶段 1 大纲生成', true, `languageDirective：${outlineResult.data.languageDirective}\ncourseTitle：${outlineResult.data.courseTitle}`)
console.log('\n场景清单：')
for (const outline of outlineResult.data.outlines) {
  console.log(`  ${outline.order}. [${outline.type}] ${outline.title} — ${preview(outline.description, 80)}`)
}

const adapted = normalizeSceneOutlines(outlineResult.data)
if (!adapted?.outlines?.length) {
  stage('阶段 1 大纲适配', false, 'normalizeSceneOutlines 返回空')
  process.exit(1)
}
stage(
  '阶段 1 大纲适配（OpenMAIC 契约 → 本项目蓝图形状）',
  true,
  adapted.outlines
    .map(
      (outline) =>
        `  ${outline.order}. [${outline.type}] ${outline.title}` +
        (outline.quizConfig ? ` quizConfig=${JSON.stringify(outline.quizConfig)}` : '') +
        (outline.widget ? ` widget=${outline.widget.widgetType}` : '') +
        (outline.pbl ? ` pbl=${outline.pbl.projectTopic}` : ''),
    )
    .join('\n') + (adapted.fallbacks.length ? `\n降级记录：${adapted.fallbacks.join('；')}` : ''),
)

// ── 阶段 2：场景 ──────────────────────────────────────────────

const slideOutline = adapted.outlines.find((outline) => outline.type === 'lecture') || adapted.outlines[0]
const quizOutline = adapted.outlines.find((outline) => outline.type === 'quiz')

console.log(`\n══════════ 阶段 2a：slide 场景「${slideOutline.title}」 ══════════`)
const slideScene = await generateOpenmaicScene(
  slideOutline,
  deepseekCall,
  {
    languageDirective: adapted.languageDirective,
    chapter: '管理学的计划职能',
    teacherContext: '## Host project rules\n- 所有内容使用简体中文；公式用纯文本。\n- 板书即视觉辅助：短句、关键词、 bullet，不写口播长段。',
  },
)
if (slideScene.fallbackReason) {
  stage('阶段 2a slide 场景', false, `回退原因：${slideScene.fallbackReason}`)
} else {
  const blocks = (slideScene.lesson?.blocks || []).map((block) => block.type)
  stage(
    '阶段 2a slide 场景（PPTElement → 结构化板书）',
    true,
    `标题：${slideScene.lesson?.title}\n块序列：${blocks.join(' → ')}\n丢弃计数：${JSON.stringify(slideScene.dropped)}\n路线要点：${JSON.stringify((slideScene.lesson?.blocks || []).find((b) => b.type === 'outline')?.items || [])}`,
  )
}

if (quizOutline) {
  console.log(`\n══════════ 阶段 2b：quiz 场景「${quizOutline.title}」 ══════════`)
  const quizScene = await generateOpenmaicScene(
    quizOutline,
    deepseekCall,
    {
      languageDirective: adapted.languageDirective,
      chapter: '管理学的计划职能',
      teacherContext: '## Host project rules\n- 所有内容使用简体中文。',
    },
  )
  if (quizScene.fallbackReason) {
    stage('阶段 2b quiz 场景', false, `回退原因：${quizScene.fallbackReason}`)
  } else {
    stage(
      '阶段 2b quiz 场景（value/label/answer → 本项目题目）',
      true,
      quizScene.questions
        .map(
          (question) =>
            `  Q: ${question.stem}\n     选项: ${question.options.join(' / ')}\n     答案: ${question.options[question.answerIndex]}  解析: ${preview(question.explanation, 100)}`,
        )
        .join('\n'),
    )
  }
} else {
  console.log('\n（大纲未产出 quiz 场景，跳过阶段 2b）')
}

// ── 交互场景（若大纲选了 interactive） ─────────────────────────

const interactiveOutline = adapted.outlines.find((outline) => outline.widget)
if (interactiveOutline) {
  console.log(`\n══════════ 阶段 2c：interactive 场景「${interactiveOutline.title}」 ══════════`)
  const interactiveScene = await generateOpenmaicScene(
    interactiveOutline,
    (system, user) => deepseekCall(system, user, 8000),
    {
      languageDirective: adapted.languageDirective,
      chapter: '管理学的计划职能',
      teacherContext: '## Host project rules\n- 所有内容使用简体中文。',
    },
  )
  if (interactiveScene.fallbackReason) {
    stage('阶段 2c interactive 场景', false, `回退原因：${interactiveScene.fallbackReason}`)
  } else {
    const sci = checkScientificModel({ model: interactiveScene.scientificModel, content: interactiveScene.lesson })
    stage(
      '阶段 2c interactive 场景（widget-config → 受控块 + ScientificModel）',
      true,
      `块序列：${(interactiveScene.lesson?.blocks || []).map((block) => block.type).join(' → ')}\nScientificModel：${JSON.stringify(interactiveScene.scientificModel)}\n检查码：${sci.issues.map((issue) => `${issue.code}(${issue.severity})`).join(', ') || '无'}`,
    )
  }
}

// ── 汇总 ──────────────────────────────────────────────

console.log('\n══════════ 实测汇总 ══════════')
const failed = report.filter((item) => !item.ok)
for (const item of report) console.log(`  ${item.ok ? '✅' : '❌'} ${item.name}`)
console.log(`\n结果：${report.length - failed.length}/${report.length} 阶段通过`)
if (failed.length) process.exit(1)
