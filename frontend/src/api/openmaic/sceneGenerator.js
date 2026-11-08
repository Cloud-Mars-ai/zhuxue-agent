/**
 * OpenMAIC 场景阶段移植（scene-generator.ts → 本项目适配）。
 *
 * 完全接入的部分：
 * - slide 场景：slide-content 提示词（939 行系统模板：画布契约、元素契约、
 *   Height 查找表、LaTeX 禁令、教师身份禁令）→ PPTElement[] 契约 →
 *   slideAdapter 结构化板书
 * - quiz 场景：quiz-content 提示词（题型矩阵 single/multiple/short_answer、
 *   value=枚举字母 / label=选项正文 / answer=字母数组的字段契约）→ 题目适配
 * - interactive 场景：simulation-content 提示词 → 提取模板约定的
 *   widget-config JSON（变量/预设/scientificModel）→ 受控块；自由 HTML 不渲染
 * - pbl 场景：大纲级字段（projectTopic/targetSkills/issueCount）经 slide
 *   提示词生成场景内容（上游 planner-single-call 不移植，见设计文档 §6）
 * - withGenerationRetry：可重试错误退避；空结果重试
 *
 * 适配部分：
 * - aiCall 依赖注入 (system, user) => Promise<string>
 * - 产出全部过 utils/board.js 的 normalizeBoardLesson / quiz 适配器，
 *   再交给 API 层的编译器（subjectCheck/evidenceLedger/repair）
 *
 * 硬规则：只用相对导入，node 测试脚本可直接 import。
 */

import { normalizeBoardLesson } from '../../utils/board.js'
import {
  buildPrompt,
  buildSlideContentPrompt,
  PROMPT_IDS,
} from './promptEngine.js'
import { parseJsonResponse } from './jsonRepair.js'
import { withGenerationRetry } from './generationRetry.js'
import { slideElementsToLesson } from './slideAdapter.js'
import { extractScientificModel } from './scientificModel.js'

const QUIZ_TYPES = ['single', 'multiple', 'short_answer']

function text(value, max = 240) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function keyPointsText(keyPoints, max = 5) {
  const list = Array.isArray(keyPoints) ? keyPoints : []
  return list
    .map((point) => text(point, 160))
    .filter(Boolean)
    .slice(0, max)
    .map((point) => `- ${point}`)
    .join('\n  ')
}

/** OpenMAIC quiz 题目 → 本项目题目契约（value/label/answer 字母结构）。 */
export function adaptOpenmaicQuestions(raw, chapter = '') {
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.questions) ? raw.questions : []
  return list
    .map((question, index) => {
      const type = QUIZ_TYPES.includes(question?.type) ? question.type : 'single'
      const options = (Array.isArray(question?.options) ? question.options : [])
        .map((option) =>
          typeof option === 'string'
            ? option.trim()
            : text(option?.label ?? option?.text ?? option?.content, 200),
        )
        .filter(Boolean)
      const stem = text(question?.question ?? question?.stem, 400)
      if (!stem) return null
      if (type === 'short_answer') {
        return {
          id: text(question?.id, 40) || `course-q-${index + 1}`,
          stem,
          options: [],
          answerIndex: -1,
          explanation: text(question?.analysis ?? question?.commentPrompt, 400),
          concept: text(question?.concept, 60) || '未标注概念',
          chapter: text(question?.chapter, 60) || chapter,
          kind: 'short_answer',
        }
      }
      const letters = (Array.isArray(question?.answer) ? question.answer : [question?.answer])
        .map((letter) => text(letter, 4).toUpperCase())
        .filter((letter) => /^[A-Z]$/.test(letter))
      const first = letters[0]
      const answerIndex = first ? first.charCodeAt(0) - 65 : -1
      if (options.length < 2 || answerIndex < 0 || answerIndex >= options.length) return null
      return {
        id: text(question?.id, 40) || `course-q-${index + 1}`,
        stem,
        options,
        answerIndex,
        explanation: text(question?.analysis ?? question?.explanation, 400),
        concept: text(question?.concept, 60) || '未标注概念',
        chapter: text(question?.chapter, 60) || chapter,
        kind: type === 'multiple' ? 'multiple' : 'single',
      }
    })
    .filter(Boolean)
}

function slideUserVariables(outline, context) {
  return {
    title: outline.title,
    description: outline.description || '',
    keyPoints: keyPointsText(outline.keyPoints),
    languageDirective: context.languageDirective || '使用用户需求所使用的语言授课。',
    teacherContext: context.teacherContext || '',
    assignedImages: 'None',
  }
}

/** interactive：simulation 模板 + 追加 scientificModel 契约（经 teacherContext 注入）。 */
function simulationUserVariables(outline, context) {
  const widget = outline.widget || {}
  const variables = Array.isArray(widget.widgetOutline?.keyVariables)
    ? widget.widgetOutline.keyVariables.map((item) => text(item, 40)).filter(Boolean)
    : []
  return {
    title: outline.title,
    description: outline.description || '',
    keyPoints: keyPointsText(outline.keyPoints),
    concept: widget.widgetOutline?.concept || outline.title,
    keyVariables: variables.length ? variables.join('、') : '由概念自行推断 2-4 个',
    languageDirective: context.languageDirective || '使用用户需求所使用的语言授课。',
    teacherContext: [
      context.teacherContext || '',
      '## Additional contract (host project)\nBesides the HTML document, the embedded `widget-config` JSON MUST also include a `scientificModel` object with four string arrays: `core_formulas`, `mechanism`, `constraints`, `forbidden_errors`. `forbidden_errors` lists the classic mistakes learners make with this concept; the host project uses it to audit the rendered scene.',
    ]
      .filter(Boolean)
      .join('\n\n'),
  }
}

/** 从 simulation HTML 响应中提取模板约定的 widget-config JSON。
 *  正则容许响应被 maxTokens 截断（无闭合 </script>）——此时贪婪退化到
 *  字符串末尾，交给 jsonRepair 的括号栈补全修复（live 实测捕获：完整
 *  HTML 超预算被截断，严格匹配直接返回 null 导致 interactive 场景失败）。 */
export function extractWidgetConfig(response) {
  const raw = String(response ?? '')
  const matched = raw.match(
    /<script[^>]*id=["']widget-config["'][^>]*>([\s\S]*?)(?:<\/script>|$)/i,
  )
  const candidate = matched ? matched[1] : raw
  const parsed = parseJsonResponse(candidate)
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
  return null
}

/** widget-config → 受控板书块（definition + table + diagram/callout）。 */
export function widgetConfigToLesson(config, outline, context = {}) {
  if (!config || typeof config !== 'object') return null
  const concept = text(config.concept || outline.title, 60)
  const description = text(config.description || outline.description, 320)
  if (!concept || !description) return null
  const blocks = [
    {
      type: 'definition',
      title: '核心概念',
      term: concept,
      definition: description,
      concreteAnchor:
        text(outline.keyPoints?.[0], 180) || `先操作「${concept}」的模型，再读这段定义。`,
    },
  ]
  const variables = Array.isArray(config.variables) ? config.variables : []
  if (variables.length >= 2) {
    blocks.push({
      type: 'table',
      title: '可调参数',
      columns: ['参数', '含义', '取值范围', '默认值'],
      rows: variables.slice(0, 6).map((variable) => [
        text(variable?.label ?? variable?.name, 24),
        text(variable?.name, 24),
        [variable?.min, variable?.max].every((value) => Number.isFinite(Number(value)))
          ? `${variable.min}–${variable.max}${variable.unit ? ` ${variable.unit}` : ''}`
          : '—',
        text(variable?.default, 20) || '—',
      ]),
    })
  }
  const presets = Array.isArray(config.presets) ? config.presets : []
  const presetNodes = presets
    .map((preset) => ({
      label: text(preset?.name, 24),
      note: Object.entries(preset?.variables || {})
        .map(([key, value]) => `${key}=${text(value, 20)}`)
        .join('，'),
    }))
    .filter((node) => node.label)
  if (presetNodes.length >= 2) {
    blocks.push({
      type: 'diagram',
      title: '预设对照',
      nodes: presetNodes.slice(0, 6),
      caption: '对比预设参数，观察结果差异。',
    })
  } else if (presetNodes.length === 1) {
    blocks.push({
      type: 'callout',
      title: '推荐预设',
      tone: 'idea',
      text: `${presetNodes[0].label}${presetNodes[0].note ? `：${presetNodes[0].note}` : ''}`,
    })
  }
  const scientificModel = extractScientificModel(config)
  return {
    lesson: { title: concept, subtitle: '', blocks },
    scientificModel,
    dropped: { html: 1, media: 0, chart: 0, outOfCanvas: 0, shapeWithoutLabel: 0 },
  }
}

/** pbl：大纲级项目信息 → 受控板书块（上游 planner 不移植）。 */
export function pblToLesson(outline) {
  const pbl = outline.pbl || {}
  const topic = text(pbl.projectTopic, 80) || outline.title
  const blocks = [
    {
      type: 'outline',
      title: '项目任务',
      items: [
        text(pbl.projectDescription, 160) || `围绕「${topic}」展开一次项目式学习。`,
        ...(Array.isArray(pbl.targetSkills) ? pbl.targetSkills.slice(0, 3).map((skill) => `目标能力：${text(skill, 60)}`) : []),
      ].filter(Boolean),
    },
  ]
  if (pbl.scenarioBrief) {
    blocks.push({ type: 'callout', title: '情境简报', tone: 'note', text: text(pbl.scenarioBrief, 320) })
  }
  return {
    lesson: { title: topic, subtitle: '', blocks },
    scientificModel: null,
    dropped: { html: 0, media: 0, chart: 0, outOfCanvas: 0, shapeWithoutLabel: 0 },
  }
}

/**
 * 生成单个场景内容（OpenMAIC 契约层）。
 *
 * @param {Object} outline 本项目大纲场景（type: lecture/quiz/practice/review，
 *   practice 场景带 widget / pbl 元数据）
 * @param {(system:string, user:string) => Promise<string>} aiCall
 * @param {Object} [context] { languageDirective, teacherContext, chapter, subject, stage }
 * @returns {Promise<{kind, lesson?, questions?, scientificModel?, dropped?, fallbackReason?}>}
 *   失败返回 { kind, fallbackReason }，由调用方走本地兜底。
 */
export async function generateOpenmaicScene(outline, aiCall, context = {}) {
  const type = outline?.type
  const logger = context.logger || { warn() {}, error() {}, info() {}, debug() {} }

  try {
    if (type === 'quiz') {
      const quizConfig = outline.quizConfig || {}
      const prompt = buildPrompt(PROMPT_IDS.QUIZ_CONTENT, {
        title: outline.title,
        description: outline.description || '',
        keyPoints: keyPointsText(outline.keyPoints),
        questionCount: quizConfig.questionCount || 2,
        difficulty: quizConfig.difficulty || 'medium',
        // 渲染器只支持单选：题型矩阵收敛为 single（本项目受控渲染约束）
        questionTypes: 'single',
        languageDirective: context.languageDirective || '使用用户需求所使用的语言授课。',
        teacherContext: context.teacherContext || '',
      })
      if (!prompt) return { kind: 'quiz', fallbackReason: 'prompt-unavailable' }
      const response = await withGenerationRetry(
        () => aiCall(prompt.system, prompt.user),
        {
          label: 'openmaic.quiz',
          signal: context.signal,
          shouldRetryResult: (value) => !String(value ?? '').trim(),
          onRetry: (event) => logger.warn?.(`[openmaic] quiz retry: ${event.reason}`),
        },
      )
      const parsed = parseJsonResponse(response)
      // 渲染器约束：只支持单选（optionIndex === answerIndex），多选/简答
      // 由提示词侧收敛（questionTypes 恒传 single），此处再做一层确定性过滤
      const questions = adaptOpenmaicQuestions(parsed, context.chapter || '').filter(
        (question) => question.kind === 'single',
      )
      if (!questions.length) return { kind: 'quiz', fallbackReason: 'invalid-model-output' }
      return { kind: 'quiz', questions: questions.slice(0, 4) }
    }

    if (type === 'practice' && outline.widget) {
      const prompt = buildPrompt(PROMPT_IDS.SIMULATION_CONTENT, simulationUserVariables(outline, context))
      if (!prompt) return { kind: 'board', fallbackReason: 'prompt-unavailable' }
      const response = await withGenerationRetry(
        () => aiCall(prompt.system, prompt.user),
        {
          label: 'openmaic.interactive',
          signal: context.signal,
          shouldRetryResult: (value) => !String(value ?? '').trim(),
          onRetry: (event) => logger.warn?.(`[openmaic] interactive retry: ${event.reason}`),
        },
      )
      const config = extractWidgetConfig(response)
      const built = widgetConfigToLesson(config, outline, context)
      if (!built) return { kind: 'board', fallbackReason: 'invalid-model-output' }
      const lesson = normalizeBoardLesson(built.lesson, context.chapter || '')
      if (!lesson) return { kind: 'board', fallbackReason: 'invalid-model-output' }
      return { kind: 'board', lesson, scientificModel: built.scientificModel, dropped: built.dropped }
    }

    if (type === 'practice' && outline.pbl) {
      const built = pblToLesson(outline)
      const lesson = normalizeBoardLesson(built.lesson, context.chapter || '')
      if (!lesson) return { kind: 'board', fallbackReason: 'invalid-model-output' }
      return { kind: 'board', lesson, scientificModel: null, dropped: built.dropped }
    }

    // lecture / review / 无元数据的 practice：slide-content 提示词
    const prompt = buildSlideContentPrompt({}, slideUserVariables(outline, context))
    if (!prompt) return { kind: 'board', fallbackReason: 'prompt-unavailable' }
    const response = await withGenerationRetry(
      () => aiCall(prompt.system, prompt.user),
      {
        label: 'openmaic.slide',
        signal: context.signal,
        shouldRetryResult: (value) => !String(value ?? '').trim(),
        onRetry: (event) => logger.warn?.(`[openmaic] slide retry: ${event.reason}`),
      },
    )
    const parsed = parseJsonResponse(response)
    const elements = Array.isArray(parsed?.elements) ? parsed.elements : []
    const adapted = slideElementsToLesson(elements, {
      keyPoints: outline.keyPoints,
      title: outline.title,
      subtitle: outline.description,
    })
    if (!adapted) return { kind: 'board', fallbackReason: 'invalid-model-output' }
    const lesson = normalizeBoardLesson(
      { title: adapted.title, subtitle: adapted.subtitle, blocks: adapted.blocks },
      context.chapter || '',
    )
    if (!lesson) return { kind: 'board', fallbackReason: 'invalid-model-output' }
    return { kind: 'board', lesson, scientificModel: null, dropped: adapted.dropped }
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    logger.error?.('[openmaic] scene generation failed:', error)
    return { kind: type === 'quiz' ? 'quiz' : 'board', fallbackReason: String(error?.message || error) }
  }
}
