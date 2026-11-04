import { COURSE_OUTLINE, getOutlineByTitle } from '@/mock/courseOutline'
import { normalizeBoardLesson } from '@/utils/board'
import { normalizeQuestions } from '@/utils/json'
import { buildLocalQuestions } from '@/utils/localQuiz'

export const COURSE_SCENE_TYPES = ['lecture', 'quiz', 'practice', 'review']

export const COURSE_SCENE_LABELS = {
  lecture: '板书讲解',
  quiz: '检索练习',
  practice: '案例应用',
  review: '收束复盘',
  lab: '案例应用',
  exercise: '案例应用',
  assessment: '检索练习',
}

const TYPE_ALIASES = {
  slide: 'lecture',
  board: 'lecture',
  concept: 'lecture',
  interactive: 'practice',
  pbl: 'practice',
  case: 'practice',
  summary: 'review',
  recap: 'review',
  讲解: 'lecture',
  板书: 'lecture',
  练习题: 'quiz',
  练习: 'quiz',
  测验: 'quiz',
  案例: 'practice',
  应用: 'practice',
  复盘: 'review',
  总结: 'review',
}

const MAX_SCENES = 10

function text(value, max = 240) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function strings(value, maxItems = 8, maxLength = 140) {
  let list = []
  if (Array.isArray(value)) list = value
  else if (typeof value === 'string') {
    list = /[\n；;]/.test(value)
      ? value.split(/[\n；;]+/)
      : [value]
  } else if (value && typeof value === 'object') {
    list = Array.isArray(value.items) ? value.items : [value]
  }
  return list
    .map((item) => {
      if (item && typeof item === 'object') {
        return text(
          item.text ?? item.point ?? item.title ?? item.term ?? item.label ?? item.value,
          maxLength,
        )
      }
      return text(item, maxLength)
    })
    .filter(Boolean)
    .slice(0, maxItems)
}

function normalizeType(value) {
  const raw = text(value, 24).toLowerCase()
  return COURSE_SCENE_TYPES.includes(raw) ? raw : TYPE_ALIASES[raw] || 'lecture'
}

function normalizeMinutes(value, fallback = 8) {
  const number = Number(value)
  if (Number.isFinite(number)) return Math.min(45, Math.max(3, Math.round(number)))
  const matched = String(value ?? '').match(/\d+(?:\.\d+)?/)
  const parsed = matched ? Number(matched[0]) : Number.NaN
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(45, Math.max(3, Math.round(parsed)))
}

function normalizeSourceIds(value, allowedIds) {
  const allowed = new Set(allowedIds)
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[\s,，;；]+/)
      : []
  const ids = list
    .map((id) => text(id, 120))
    .filter((id) => id && (!allowed.size || allowed.has(id)))
  return Array.from(new Set(ids)).slice(0, 8)
}

function normalizeOutline(raw, index, context) {
  const title = text(raw?.title ?? raw?.heading ?? raw?.name, 80)
  if (!title) return null
  const keyPoints = strings(
    raw?.keyPoints ?? raw?.points ?? raw?.key_points ?? raw?.objectives,
    5,
    160,
  )
  if (!keyPoints.length) keyPoints.push(title)
  return {
    id: text(raw?.id, 80) || `scene_${index + 1}`,
    type: normalizeType(raw?.type),
    title,
    description:
      text(raw?.description ?? raw?.summary ?? raw?.purpose, 280) ||
      `理解「${title}」的核心内容。`,
    teachingObjective:
      text(
        raw?.teachingObjective ?? raw?.learningObjective ?? raw?.objective,
        220,
      ) ||
      context.objective ||
      `能解释「${title}」。`,
    keyPoints,
    estimatedMinutes: normalizeMinutes(raw?.estimatedMinutes ?? raw?.durationMinutes),
    sourceChunkIds: normalizeSourceIds(
      raw?.sourceChunkIds ?? raw?.sourceIds,
      context.sourceChunkIds,
    ),
    order: index + 1,
  }
}

function ensureTeachingSequence(outlines, context) {
  const result = [...outlines]
  if (!result.some((scene) => scene.type === 'quiz')) {
    const points = result.flatMap((scene) => scene.keyPoints).slice(0, 3)
    result.splice(Math.min(2, result.length), 0, {
      id: `scene_${result.length + 1}`,
      type: 'quiz',
      title: '检索练习：先回忆，再解释',
      description: '用 2–3 道题检查概念边界与常见误判。',
      teachingObjective: '不看材料也能解释核心概念，并识别常见错误。',
      keyPoints: points.length ? points : [context.objective],
      estimatedMinutes: Math.min(8, Math.max(5, Math.round(context.durationMinutes / 5))),
      sourceChunkIds: context.sourceChunkIds.slice(0, 3),
      order: 0,
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
      keyPoints: points.length ? points : [context.objective],
      estimatedMinutes: 4,
      sourceChunkIds: context.sourceChunkIds.slice(0, 3),
      order: 0,
    })
  }
  return result
}

function normalizeOrder(outlines) {
  return outlines.map((scene, index) => ({ ...scene, order: index + 1 }))
}

/**
 * 和 OpenMAIC 的 outline-schema 一样，模型输出不能直接进入业务层。
 * 这里对数量、类型、时长、来源 ID 和教学顺序做一次幂等归一化。
 */
export function normalizeCourseBlueprint(raw, context) {
  const source = Array.isArray(raw) ? { outlines: raw } : raw
  const course = source?.course && typeof source.course === 'object' ? source.course : null
  const candidates = [
    source?.outlines,
    source?.scenes,
    source?.sections,
    source?.items,
    source?.outline,
    course?.outlines,
    course?.scenes,
    course?.items,
  ]
  const foundOutlines =
    candidates.find((candidate) => Array.isArray(candidate)) ||
    (source?.data && typeof source.data === 'object' ? source.data.outlines : null) ||
    []
  const rawOutlines = Array.isArray(foundOutlines) ? foundOutlines : []
  let outlines = rawOutlines
    .slice(0, MAX_SCENES)
    .map((scene, index) => normalizeOutline(scene, index, context))
    .filter(Boolean)

  if (outlines.length < 3) return null
  outlines = ensureTeachingSequence(outlines, context).slice(0, MAX_SCENES)
  outlines = normalizeOrder(outlines)

  return {
    courseTitle:
      text(source?.courseTitle ?? source?.title ?? source?.name ?? course?.title, 30) ||
      `${context.chapter} · 主题学习`,
    courseSummary:
      text(source?.courseSummary ?? source?.summary, 360) ||
      `围绕“${context.objective}”组织一次 ${context.durationMinutes} 分钟的短课。`,
    languageDirective:
      text(source?.languageDirective, 260) ||
      '使用中文授课；管理学专业术语首次出现时保留英文原词并给出中文解释。',
    outlines,
  }
}

function durationPlan(total, count) {
  const special = { quiz: 6, practice: Math.max(8, Math.round(total * 0.22)), review: 4 }
  const fixed = []
  let rest = total
  for (let index = 0; index < count; index += 1) {
    if (index === count - 1) fixed.push(Math.max(4, rest))
    else {
      const value = Math.max(6, Math.round((rest / (count - index)) * 0.92))
      fixed.push(value)
      rest -= value
    }
  }
  return fixed.map((fallback, index) => {
    const type = ['lecture', 'lecture', 'quiz', 'practice', 'review'][index]
    return special[type] ?? fallback
  })
}

/** 未配置模型或调用失败时，用教师确认稿生成完整且可编辑的大纲。 */
export function buildLocalCourseBlueprint(context) {
  const chapter =
    getOutlineByTitle(context.chapter) ||
    COURSE_OUTLINE.find((item) => item.title.includes(context.chapter || '')) ||
    COURSE_OUTLINE[2]
  const points = chapter.keyPoints
  const count = context.durationMinutes <= 20 ? 5 : 6
  const durations = durationPlan(context.durationMinutes, count)
  const sources = context.sourceChunkIds.slice(0, 4)

  const scenes = [
    {
      type: 'lecture',
      title: `先看全貌：${chapter.theme}`,
      description: `从本章要解决的管理问题切入，建立「${chapter.theme}」的知识地图。`,
      teachingObjective: `能说出「${chapter.theme}」包含的核心问题与判断顺序。`,
      keyPoints: points.slice(0, 2).map((point) => point.term),
    },
    {
      type: 'lecture',
      title: `核心概念：${points[0].term}`,
      description: `讲清「${points[0].term}」的定义、边界和一个管理情境。`,
      teachingObjective: `能用「${points[0].term}」解释一个现象，并说明适用条件。`,
      keyPoints: [points[0].term, points[1]?.term || chapter.theme, '适用条件与常见误判'],
    },
    ...(count > 5
      ? [
          {
            type: 'lecture',
            title: `概念辨析：${points[2]?.term || points[1]?.term || chapter.theme}`,
            description: '把相近概念放进同一张对照表，避免只背定义不会判断。',
            teachingObjective: '能根据案例线索区分相近概念，并说明判断依据。',
            keyPoints: points.slice(1, 4).map((point) => point.term),
          },
        ]
      : []),
    {
      type: 'quiz',
      title: '停一下：检索练习',
      description: '先不看答案，用 2–3 道题检查概念边界和常见误判。',
      teachingObjective: '能独立回忆定义、识别错误表述并解释原因。',
      keyPoints: points.slice(0, 3).map((point) => point.term),
    },
    {
      type: 'practice',
      title: '把概念用进一个管理情境',
      description: '用案例题走完“识别现象 → 匹配概念 → 给出行动”的判断链。',
      teachingObjective: '能把本章概念转化为有依据的管理建议。',
      keyPoints: points.slice(0, 3).map((point) => point.term),
    },
    {
      type: 'review',
      title: '一页收束：下一步怎么学',
      description: '用一张对照卡收束本课，并给出下一次复习的最短路径。',
      teachingObjective: '能复述本课判断链，并说出一个仍需回材料核对的问题。',
      keyPoints: points.slice(0, 4).map((point) => point.term),
    },
  ]

  const outlines = scenes.slice(0, count).map((scene, index) => ({
    id: `scene_${index + 1}`,
    ...scene,
    estimatedMinutes: durations[index],
    sourceChunkIds: sources,
    order: index + 1,
  }))

  return {
    courseTitle: `${chapter.theme} · ${context.mode === 'sprint' ? '冲刺课' : '短课'}`,
    courseSummary: `围绕「${chapter.summary}」组织 ${context.durationMinutes} 分钟学习，先建立框架，再用测验和案例检查掌握情况。`,
    languageDirective: '使用中文授课；管理学专业术语首次出现时保留英文原词并给出中文解释。',
    outlines,
  }
}

function matchingPoints(outline, chapter) {
  const wanted = outline.keyPoints.map((point) =>
    point.replace(/^[^：:]*[：:]/, '').trim().toLowerCase(),
  )
  const exact = chapter.keyPoints.filter((point) =>
    wanted.some((item) => item.includes(point.term.toLowerCase())),
  )
  return (exact.length ? exact : chapter.keyPoints).slice(0, 4)
}

function shorten(value, max = 52) {
  const normalized = text(value, max + 1)
  return normalized.length > max ? `${normalized.slice(0, max)}…` : normalized
}

function localBoardContent(project, outline) {
  const chapter = getOutlineByTitle(project.chapter) || COURSE_OUTLINE[2]
  const points = matchingPoints(outline, chapter)
  const primary = points[0] || chapter.keyPoints[0]
  const comparison = points.slice(0, 3)
  const lesson = normalizeBoardLesson(
    {
      chapter: project.chapter,
      title: outline.title,
      subtitle: outline.description,
      blocks: [
        {
          type: 'outline',
          title: '本节路线图',
          items: outline.keyPoints.slice(0, 4),
        },
        {
          type: 'definition',
          title: '核心概念',
          term: primary.term,
          definition: primary.definition,
          analogy: primary.examTip || '先判断它解决什么问题，再记定义。',
        },
        {
          type: 'table',
          title: '概念对照',
          columns: ['概念', '一句话解释', '案例里的用法'],
          rows: comparison.map((point) => [
            point.term,
            shorten(point.definition),
            shorten(point.examTip || '用它解释现象并说明依据', 44),
          ]),
        },
        {
          type: 'diagram',
          title: '管理判断链',
          nodes: [
            { label: '看现象', note: '案例发生了什么' },
            { label: '找概念', note: primary.term },
            { label: '讲依据', note: '定义与适用条件' },
            { label: '给行动', note: '下一步做什么' },
          ],
          caption: '板书只呈现判断链，不替学生跳过推理。',
        },
        {
          type: 'callout',
          title: '材料边界',
          tone: 'note',
          text: `本页由教师确认稿「${project.chapter}」确定性生成；材料未覆盖的内容不补。`,
        },
        {
          type: 'question',
          title: '停下来想一想',
          prompt: `如果案例只告诉你“结果不理想”，你会先用「${primary.term}」检查什么？`,
          options: ['先检查概念是否适用', '先直接给解决方案'],
        },
      ],
    },
    project.chapter,
  )
  return { kind: 'board', lesson, sourceChunkIds: outline.sourceChunkIds }
}

function localPracticeContent(project, outline) {
  const chapter = getOutlineByTitle(project.chapter) || COURSE_OUTLINE[2]
  const points = matchingPoints(outline, chapter)
  const [first, second] = points
  return {
    kind: 'practice',
    prompt:
      `某部门最近出现“会议很多、决策很慢、结果无人负责”的现象。` +
      `请先用「${first?.term || chapter.theme}」判断问题的性质，` +
      `再用${second ? `「${second.term}」` : '课程材料中的另一概念'}说明依据，最后给出一个可在两周内执行的改进行动。`,
    referencePoints: [
      `能识别现象并用「${first?.term || chapter.theme}」下判断。`,
      `能引用定义中的适用条件，而不是只背结论。`,
      '行动建议明确责任、时间与验证方式。',
    ],
    rubric: [
      { criterion: '概念判断', weight: 40 },
      { criterion: '理论依据', weight: 35 },
      { criterion: '行动建议', weight: 25 },
    ],
    followUp: '如果去掉这个概念的其中一个适用条件，你的结论还成立吗？',
    sourceChunkIds: outline.sourceChunkIds,
  }
}

export function buildLocalCourseSceneContent(project, outline) {
  if (outline.type === 'practice') return localPracticeContent(project, outline)
  if (outline.type === 'quiz') {
    const chapter = getOutlineByTitle(project.chapter) || COURSE_OUTLINE[2]
    const questions = buildLocalQuestions({
      chapters: [chapter.title],
      count: Math.min(3, Math.max(2, outline.keyPoints.length)),
    })
    return { kind: 'quiz', questions, sourceChunkIds: outline.sourceChunkIds }
  }
  return localBoardContent(project, outline)
}

function normalizeRubric(value) {
  return (Array.isArray(value) ? value : [])
    .map((item) => ({
      criterion: text(item?.criterion, 60),
      weight: Math.min(100, Math.max(0, Math.round(Number(item?.weight) || 0))),
    }))
    .filter((item) => item.criterion && item.weight > 0)
    .slice(0, 5)
}

function answerIndexFromQuestion(question, options) {
  const direct = Number(question?.answerIndex)
  if (Number.isInteger(direct)) return direct
  const letter = Array.isArray(question?.answer)
    ? question.answer[0]
    : question?.correctAnswer || question?.answer
  const normalized = String(letter || '')
    .trim()
    .toUpperCase()
  if (/^[A-Z]$/.test(normalized)) return normalized.charCodeAt(0) - 65
  return options.findIndex((option) => option === String(letter || '').trim())
}

/** 兼容本项目题目结构，也兼容 OpenMAIC 的 value/label + answer 字母结构。 */
function normalizeCourseQuestions(raw, chapter) {
  const list = Array.isArray(raw) ? raw : raw?.questions
  if (!Array.isArray(list)) return []
  const adapted = list.map((question, index) => {
    const options = (Array.isArray(question?.options) ? question.options : [])
      .map((option) =>
        typeof option === 'string'
          ? option
          : String(option?.label ?? option?.text ?? option?.value ?? ''),
      )
      .map((option) => option.trim())
      .filter(Boolean)
    return {
      id: question?.id || `course-q-${index + 1}`,
      stem: question?.stem ?? question?.question,
      options,
      answerIndex: answerIndexFromQuestion(question, options),
      explanation: question?.explanation ?? question?.analysis,
      concept: question?.concept,
    }
  })
  return normalizeQuestions(adapted, chapter)
}

/**
 * 归一化第二阶段输出。不同 scene type 使用不同内容契约，但都只能进入
 * 前端受控渲染器，不能携带 HTML 或任意脚本。
 */
export function normalizeCourseSceneContent(raw, { project, outline, allowedSourceIds = [] }) {
  const source = Array.isArray(raw) ? { questions: raw } : raw
  const sourceChunkIds = normalizeSourceIds(
    source?.sourceChunkIds ?? outline.sourceChunkIds,
    allowedSourceIds,
  )

  if (outline.type === 'quiz') {
    const questions = normalizeCourseQuestions(source?.questions ?? source, project.chapter)
    if (!questions.length) return null
    return { kind: 'quiz', questions: questions.slice(0, 4), sourceChunkIds }
  }

  if (outline.type === 'practice') {
    const prompt = text(source?.prompt ?? source?.question, 600)
    const referencePoints = strings(source?.referencePoints, 6, 220)
    if (!prompt || referencePoints.length < 2) return null
    return {
      kind: 'practice',
      prompt,
      referencePoints,
      rubric: normalizeRubric(source?.rubric),
      followUp: text(source?.followUp, 220),
      sourceChunkIds,
    }
  }

  const lesson = normalizeBoardLesson(source?.lesson ?? source, project.chapter)
  if (!lesson) return null
  lesson.title = lesson.title || outline.title
  return { kind: 'board', lesson, sourceChunkIds }
}

export function reorderCourseOutline(outlines, fromIndex, toIndex) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= outlines.length ||
    toIndex >= outlines.length
  ) {
    return outlines
  }
  const next = [...outlines]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return normalizeOrder(next)
}

export function summarizeCourseProject(project) {
  const scenes = project?.outlines || []
  return {
    sceneCount: scenes.length,
    totalMinutes: scenes.reduce((sum, scene) => sum + (scene.estimatedMinutes || 0), 0),
    quizCount: scenes.filter((scene) => scene.type === 'quiz').length,
    practiceCount: scenes.filter((scene) => scene.type === 'practice').length,
  }
}

export function courseSceneFingerprint(outline) {
  return JSON.stringify({
    type: outline?.type,
    title: outline?.title,
    description: outline?.description,
    objective: outline?.teachingObjective,
    keyPoints: outline?.keyPoints || [],
  })
}
