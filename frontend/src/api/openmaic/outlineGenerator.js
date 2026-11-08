/**
 * OpenMAIC 大纲阶段移植（outline-generator.ts → 本项目适配）。
 *
 * 完全接入的部分：
 * - requirements-to-outlines 提示词资产（原样，386 行系统模板：语言推断 6 条
 *   决策规则、courseTitle ≤30 字符、四场景类型约束、widget 选型表、PBL 约束）
 * - JSON 三键契约 {languageDirective, courseTitle, outlines[]}
 * - applyOutlineFallbacks 降级链（interactive 缺 config→slide、pbl 缺 config→slide、
 *   procedural-skill 未开启→diagram 净化）
 *
 * 适配部分（上游 → 本项目）：
 * - aiCall 依赖注入（上游签名 (system, user, visionImages) => string）
 * - 无 PDF 图片 / 无媒体生成：availableImages 恒为 'No images available'，
 *   媒体条件块恒关闭
 * - 场景数与要点数约束经 requirement / teacherContext 注入（上游模板 1-2 场/分钟
 *   面向 30-60 分钟长课，本项目默认 30 分钟短课、封顶 10 场）
 * - id 生成用确定性 scene_{n}（不引 nanoid）
 * - 产出经 normalizeSceneOutlines 适配为我们的蓝图形状，可直接喂
 *   utils/courseStudio.js 的 normalizeCourseBlueprint
 *
 * 硬规则：只用相对导入，node 测试脚本可直接 import。
 */

import { buildPrompt, PROMPT_IDS } from './promptEngine.js'
import { parseJsonResponse } from './jsonRepair.js'

export const DEFAULT_LANGUAGE_DIRECTIVE =
  'Teach in the language that matches the user requirement.'

/** OpenMAIC 场景四类型。 */
export const OPENMAIC_SCENE_TYPES = ['slide', 'quiz', 'interactive', 'pbl']

/** OpenMAIC 交互 widget 六型。 */
export const OPENMAIC_WIDGET_TYPES = [
  'simulation',
  'diagram',
  'code',
  'game',
  'visualization3d',
  'procedural-skill',
]

const MAX_SCENES = 10

function text(value, max = 240) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function strings(value, maxItems = 5, maxLength = 160) {
  let list = []
  if (Array.isArray(value)) list = value
  else if (typeof value === 'string') {
    list = /[\n；;]/.test(value) ? value.split(/[\n；;]+/) : [value]
  }
  return list
    .map((item) => (item && typeof item === 'object' ? item.text ?? item.point ?? item.title : item))
    .map((item) => text(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

/**
 * 构建大纲提示词（移植自上游 buildOutlinePrompt，裁剪图片/媒体通道）。
 *
 * @param {Object} requirements { requirement, userNickname?, userBio? }
 * @param {Object} [context] { pdfText?, researchContext?, teacherContext?, maxScenes? }
 */
export function buildOutlinePrompt(requirements, context = {}) {
  const requirementText = text(requirements.requirement, 8000) || 'Generate a short course.'
  const maxScenes = Math.min(MAX_SCENES, Math.max(3, Number(context.maxScenes) || 8))
  // 上游模板按「1-2 场/分钟」指导（面向 30-60 分钟长课）；本项目是 15-45 分钟短课，
  // 在需求文本里显式收窄场景数，避免模型输出 20+ 场超出渲染与课时。
  const requirementWithBounds = `${requirementText}\n\n[Course length constraint] Produce ${maxScenes} scenes or fewer; 4-6 scenes is ideal for a short lesson. Each scene needs at most 3 key points.`

  const userProfileText =
    requirements.userNickname || requirements.userBio
      ? `## Student Profile\n\nStudent: ${requirements.userNickname || 'Unknown'}${requirements.userBio ? ` — ${requirements.userBio}` : ''}\n\nConsider this student's background when designing the course. Adapt difficulty, examples, and teaching approach accordingly.\n\n---`
      : ''

  const prompts = buildPrompt(PROMPT_IDS.REQUIREMENTS_TO_OUTLINES, {
    requirement: requirementWithBounds,
    pdfContent: context.pdfText ? String(context.pdfText).slice(0, 20000) : 'None',
    availableImages: 'No images available',
    userProfile: userProfileText,
    hasSourceImages: false,
    imageEnabled: false,
    videoEnabled: false,
    mediaEnabled: false,
    researchContext: context.researchContext || 'None',
    teacherContext: context.teacherContext || '',
  })

  if (!prompts) {
    throw new Error('Prompt template not found')
  }
  return prompts
}

/**
 * 调模型生成大纲（移植自上游 generateSceneOutlinesFromRequirements）。
 * aiCall: (system, user) => Promise<string>，由 API 层接 sendChatJSON、
 * node 实测接直连 DeepSeek 的 fetch 适配器。
 */
export async function generateSceneOutlines(requirements, aiCall, options = {}) {
  const logger = options.logger ?? { warn() {}, info() {}, error() {}, debug() {} }
  let prompts
  try {
    prompts = buildOutlinePrompt(requirements, options)
  } catch (error) {
    if (error instanceof Error && error.message === 'Prompt template not found') {
      return { success: false, error: 'Prompt template not found' }
    }
    throw error
  }

  try {
    const response = await aiCall(prompts.system, prompts.user)
    const parsed = parseJsonResponse(response)

    let languageDirective
    let courseTitle
    let rawOutlines

    if (Array.isArray(parsed)) {
      languageDirective = DEFAULT_LANGUAGE_DIRECTIVE
      rawOutlines = parsed
    } else if (parsed && Array.isArray(parsed.outlines)) {
      languageDirective = text(parsed.languageDirective, 400) || DEFAULT_LANGUAGE_DIRECTIVE
      courseTitle = text(parsed.courseTitle, 120) || undefined
      rawOutlines = parsed.outlines
    } else {
      return { success: false, error: 'Failed to parse scene outlines response' }
    }

    if (!rawOutlines.length) {
      return { success: false, error: 'Model returned zero outlines' }
    }

    const enriched = rawOutlines
      .slice(0, MAX_SCENES)
      .map((outline, index) => ({
        ...outline,
        id: text(outline.id, 80) || `scene_${index + 1}`,
        order: index + 1,
      }))
      .filter((outline) => text(outline.title, 120))

    if (!enriched.length) {
      return { success: false, error: 'All outlines missing title' }
    }

    return {
      success: true,
      data: { languageDirective, courseTitle, outlines: enriched },
    }
  } catch (error) {
    logger.error?.('[openmaic] outline generation failed:', error)
    return { success: false, error: String(error?.message || error) }
  }
}

/** procedural-skill 未开启时净化为 diagram（移植自上游 sanitizeProceduralSkillOutline）。 */
export function sanitizeProceduralSkillOutline(outline) {
  const widgetOutline = { ...(outline.widgetOutline ?? {}) }
  delete widgetOutline.procedureType
  delete widgetOutline.task
  delete widgetOutline.tools
  delete widgetOutline.steps
  delete widgetOutline.successCriteria
  delete widgetOutline.errorConsequences
  return {
    ...outline,
    type: 'interactive',
    widgetType: 'diagram',
    description: outline.description
      ? `${outline.description} Present this as a process or structure diagram.`
      : 'Present this topic as a process or structure diagram.',
    widgetOutline,
  }
}

/** 降级链（移植自上游 applyOutlineFallbacks，日志替换为回调）。 */
export function applyOutlineFallbacks(outline, hasLanguageModel = true, options = {}) {
  const onFallback = options.onFallback
  const hasWidgetConfig = outline.widgetType && outline.widgetOutline

  if (outline.widgetType === 'procedural-skill' && !options.allowProceduralSkill) {
    onFallback?.(`procedural-skill 未开启，「${outline.title}」降级为 diagram`)
    return sanitizeProceduralSkillOutline(outline)
  }
  if (outline.type === 'interactive' && !outline.interactiveConfig && !hasWidgetConfig) {
    onFallback?.(`interactive 场景「${outline.title}」缺 widget 配置，降级为 slide`)
    return { ...outline, type: 'slide' }
  }
  if (outline.type === 'pbl' && (!outline.pblConfig || !hasLanguageModel)) {
    onFallback?.(`pbl 场景「${outline.title}」缺项目配置，降级为 slide`)
    return { ...outline, type: 'slide' }
  }
  return outline
}

/** OpenMAIC 四类型 → 本项目四类型（与 utils/courseStudio.js 别名表一致）。 */
export function mapSceneType(openmaicType) {
  const raw = text(openmaicType, 24).toLowerCase()
  const alias = {
    slide: 'lecture',
    board: 'lecture',
    concept: 'lecture',
    quiz: 'quiz',
    exercise: 'quiz',
    assessment: 'quiz',
    interactive: 'practice',
    pbl: 'practice',
    case: 'practice',
    lab: 'practice',
    summary: 'review',
    recap: 'review',
    review: 'review',
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

function normalizeQuizConfig(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const types = Array.from(
    new Set(
      (Array.isArray(source.questionTypes) ? source.questionTypes : [])
        .map((type) => text(type, 20).toLowerCase())
        .filter((type) => ['single', 'multiple', 'short_answer'].includes(type)),
    ),
  )
  return {
    questionCount: Math.min(4, Math.max(2, Math.round(Number(source.questionCount) || 2))),
    difficulty: ['easy', 'medium', 'hard'].includes(source.difficulty) ? source.difficulty : 'medium',
    questionTypes: types.length ? types : ['single'],
  }
}

/**
 * OpenMAIC 大纲契约 → 本项目蓝图形状。
 * 保留 widget / pbl / scientificModel 元数据（interactive 场景的可视化选型证据），
 * 供场景阶段与编译器使用；形状与 utils/courseStudio.js 的 normalizeOutline 产出一致。
 */
export function normalizeSceneOutlines(openmaicResult, context = {}) {
  const { languageDirective, courseTitle, outlines } = openmaicResult || {}
  if (!Array.isArray(outlines) || !outlines.length) return null
  const fallbacks = []
  const normalized = outlines
    .map((raw, index) => {
      let outline = { ...raw, id: text(raw.id, 80) || `scene_${index + 1}` }
      outline = applyOutlineFallbacks(outline, true, {
        onFallback: (message) => fallbacks.push(message),
      })
      const type = mapSceneType(outline.type)
      const keyPoints = strings(outline.keyPoints, 5, 160)
      if (!keyPoints.length) keyPoints.push(text(outline.title, 80))
      const base = {
        id: outline.id,
        type,
        title: text(outline.title, 80),
        description: text(outline.description, 280) || `理解「${text(outline.title, 80)}」的核心内容。`,
        teachingObjective:
          text(outline.teachingObjective, 220) || context.objective || `能解释「${text(outline.title, 80)}」。`,
        keyPoints,
        difficultyTier: 1,
        estimatedMinutes: normalizeMinutes(outline.estimatedDuration ?? outline.estimatedMinutes, 8),
        sourceChunkIds: [],
        order: index + 1,
      }
      if (type === 'quiz') {
        base.quizConfig = normalizeQuizConfig(outline.quizConfig)
      }
      if (type === 'practice' && outline.type === 'interactive') {
        base.widget = {
          widgetType: OPENMAIC_WIDGET_TYPES.includes(outline.widgetType) ? outline.widgetType : 'simulation',
          widgetOutline: outline.widgetOutline && typeof outline.widgetOutline === 'object' ? outline.widgetOutline : {},
        }
      }
      if (type === 'practice' && outline.type === 'pbl') {
        const pbl = outline.pblConfig && typeof outline.pblConfig === 'object' ? outline.pblConfig : {}
        base.pbl = {
          projectTopic: text(pbl.projectTopic, 120),
          projectDescription: text(pbl.projectDescription, 400),
          targetSkills: strings(pbl.targetSkills, 6, 80),
          issueCount: Math.min(6, Math.max(1, Math.round(Number(pbl.issueCount) || 3))),
          scenarioRoleplay: !!pbl.scenarioRoleplay,
          scenarioBrief: text(pbl.scenarioBrief, 400),
        }
      }
      return base
    })
    .filter(Boolean)

  if (!normalized.length) return null
  return {
    courseTitle: courseTitle || '',
    languageDirective: languageDirective || DEFAULT_LANGUAGE_DIRECTIVE,
    outlines: normalized,
    fallbacks,
  }
}
