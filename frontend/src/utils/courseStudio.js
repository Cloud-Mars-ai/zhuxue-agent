import { normalizeBoardLesson } from '@/utils/board'
import { normalizeQuestions } from '@/utils/json'
import { normalizeLearnerProfile } from '@/utils/learnerProfile'
import {
  assessVisualizationNeed,
  ensureSimulationBlock,
} from '@/utils/knowledgeVisualization'
import {
  enforceDifficultyTiers,
  normalizeTakeaways,
  rebalanceMinutes,
} from './courseBlueprint'

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

/**
 * 大纲阶段的可视化预判：给每个场景算一个可解释的交互需求信号，
 * 供场景提示词引用与工作台展示；normalizeOutline 幂等重算。
 */
function visualHintFor(raw, context) {
  const assessment = assessVisualizationNeed({
    text: `${raw?.title ?? ''} ${raw?.description ?? ''} ${raw?.teachingObjective ?? ''}`,
    subject: context.subject,
    stage: context.stage,
    keyPoints: Array.isArray(raw?.keyPoints)
      ? raw.keyPoints
      : raw?.points ?? raw?.key_points ?? [],
  })
  return {
    level: assessment.level,
    score: assessment.score,
    reasons: assessment.reasons.slice(0, 3),
  }
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
  const type = normalizeType(raw?.type)
  return {
    id: text(raw?.id, 80) || `scene_${index + 1}`,
    type,
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
    takeaways: normalizeTakeaways(
      raw?.takeaways ?? raw?.keyTakeaways,
      keyPoints,
      type === 'lecture' || type === 'review',
    ),
    difficultyTier: Math.min(3, Math.max(1, Math.round(Number(raw?.difficultyTier) || 1))),
    estimatedMinutes: normalizeMinutes(raw?.estimatedMinutes ?? raw?.durationMinutes),
    sourceChunkIds: normalizeSourceIds(
      raw?.sourceChunkIds ?? raw?.sourceIds,
      context.sourceChunkIds,
    ),
    visualHint: visualHintFor({ ...raw, keyPoints }, context),
    order: index + 1,
    // OpenMAIC 管线元数据透传（quizConfig/widget/pbl）：大纲契约的题型矩阵、
    // 交互 widget 选型与 PBL 项目信息需要到达场景生成阶段，不能被归一化丢弃
    ...(raw?.quizConfig && typeof raw.quizConfig === 'object' ? { quizConfig: raw.quizConfig } : {}),
    ...(raw?.widget && typeof raw.widget === 'object' ? { widget: raw.widget } : {}),
    ...(raw?.pbl && typeof raw.pbl === 'object' ? { pbl: raw.pbl } : {}),
  }
}

/** 难度阶梯与时长再平衡已移至 ./courseBlueprint（A6/A1，node 可单测）。 */

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
      visualHint: visualHintFor(
        { title: '检索练习', keyPoints: points.length ? points : [context.objective] },
        context,
      ),
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
      visualHint: visualHintFor(
        { title: '一页收束', keyPoints: points.length ? points : [context.objective] },
        context,
      ),
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
  // 先定学习者画像：大纲级可视化预判需要学科与学段
  const learnerProfile = normalizeLearnerProfile(
    source?.learnerProfile ?? course?.learnerProfile,
    {
      objective: context.objective,
      chapter: context.chapter,
      audience: context.audience,
      materialText: context.materialText,
    },
  )
  const visualContext = {
    ...context,
    subject: learnerProfile.subject,
    stage: learnerProfile.stage,
  }
  let outlines = rawOutlines
    .slice(0, MAX_SCENES)
    .map((scene, index) => normalizeOutline(scene, index, visualContext))
    .filter(Boolean)

  if (outlines.length < 3) return null
  outlines = ensureTeachingSequence(outlines, visualContext).slice(0, MAX_SCENES)
  outlines = enforceDifficultyTiers(outlines)
  outlines = rebalanceMinutes(outlines, context.durationMinutes)
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
      '使用用户需求所使用的语言授课；专业术语首次出现时给出清晰解释。',
    learnerProfile,
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

function courseTopic(context) {
  const raw = text(
    context.topicHint ||
      context.objective ||
      context.chapter ||
      '我的专题课程',
    80,
  )
  const compact = raw
    .replace(/^(请|麻烦|帮我|我想|我要|需要|生成|制作|设计|创建|安排)/, '')
    .replace(/^(一节|一节关于|关于|一门|一门关于|一个|一次)/, '')
    .replace(
      /^给[^，。,.;；]{0,16}?(学生|同学|孩子|学员|人|者)(讲|解释|介绍|说明|梳理|讲讲)/,
      '',
    )
    .replace(/(课程|短课|微课|学习|讲解|复习|备考)[。！？!?]?$/g, '')
    .replace(/[。！？!?]+$/g, '')
    .trim()
  return text(compact || raw, 28)
}

function materialKnowledgePoints(context) {
  const sourceText = String(context.materialText || '')
    .replace(/^\[[^\n]+\]\s*$/gm, '')
    .replace(/第\s*\d+\s*页/g, '')
  const candidates = sourceText
    .split(/\n+|[。！？!?；;]+/)
    .map((line) => text(line.replace(/^[-*•\d.\s]+/, ''), 90))
    .filter((line) => line.length >= 5 && line.length <= 90)
  const terms = new Set(
    String(context.objective || '')
      .toLowerCase()
      .match(/[a-z0-9]{2,}|[\u4e00-\u9fa5]{2,}/g) || [],
  )
  const ranked = candidates
    .map((line, index) => {
      const lower = line.toLowerCase()
      const score = [...terms].reduce(
        (total, term) => total + (lower.includes(term) ? 1 : 0),
        0,
      )
      return { line, index, score }
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.line)
  return [...new Set(ranked)].slice(0, 8)
}

function localLearnerCopy(profile) {
  if (profile.stage === 'primary' || profile.stage === 'preschool') {
    return {
      frameworkTitle: '先建立图景',
      coreTitle: '用看得见的例子理解',
      materialTitle: '从图片和短材料找线索',
      practiceTitle: '动手试一试',
      language:
        '用短句、具体名词和生活化问题讲解；先给直观例子，再引入正式名称。',
    }
  }
  if (profile.stage === 'junior') {
    return {
      frameworkTitle: '先看懂问题',
      coreTitle: '用模型讲清关键变化',
      materialTitle: '跟着材料找条件',
      practiceTitle: '换个条件再试一次',
      language:
        '用形象但准确的表达，先给直觉模型，再补定义、条件和符号；复杂变化用分步演示。',
    }
  }
  if (profile.stage === 'senior') {
    return {
      frameworkTitle: '建立条件框架',
      coreTitle: '推导核心关系',
      materialTitle: '材料证据研读',
      practiceTitle: '变式迁移',
      language:
        '语言简洁、逻辑完整；先说明适用条件，再展开推导、证据或论证链。',
    }
  }
  if (profile.stage === 'adult') {
    return {
      frameworkTitle: '明确任务目标',
      coreTitle: '掌握可迁移的方法',
      materialTitle: '核验工作材料',
      practiceTitle: '工作情境推演',
      language:
        '直接说明适用场景、判断依据和行动步骤，减少基础铺陈，允许按经验加速。',
    }
  }
  return {
    frameworkTitle: '课程全景',
    coreTitle: '核心内容',
    materialTitle: '材料研读',
    practiceTitle: '迁移任务',
    language: '使用规范术语、清晰的概念边界、材料证据和案例判断推进。',
  }
}

/**
 * 模型不可用时的确定性兜底也必须遵守用户需求。
 * 规划顺序参考 OpenMAIC：需求定主题，材料提供内容证据，最后才套教学场景结构。
 */
export function buildLocalCourseBlueprint(context) {
  const learnerProfile = normalizeLearnerProfile(context.learnerProfile, {
    objective: context.objective,
    chapter: context.chapter,
    audience: context.audience,
    materialText: context.materialText,
  })
  const learnerCopy = localLearnerCopy(learnerProfile)
  const materialPoints = materialKnowledgePoints(context)
  let topic = courseTopic(context)
  if (/上传|这份|这些|资料|材料/.test(topic) && materialPoints.length) {
    topic = text(materialPoints[0], 28)
  }
  const points = materialPoints.length
    ? materialPoints
    : [
        `明确「${topic}」要解决的问题与学习边界`,
        `梳理「${topic}」的核心概念和关键词`,
        `用例子说明关键步骤、条件与因果关系`,
        `辨析常见误区，并建立检查方法`,
        `通过练习把理解转化为可观察的学习成果`,
      ]
  const count = context.durationMinutes <= 20 ? 5 : 6
  const durations = durationPlan(context.durationMinutes, count)
  const sources = context.sourceChunkIds.slice(0, 6)
  const modeLabel = context.mode === 'sprint' ? '冲刺课' : '主题学习'
  const scenes = [
    {
      type: 'lecture',
      title: `${learnerCopy.frameworkTitle}：${topic}`,
      description: `围绕用户需求建立「${topic}」的问题地图，明确本课要解决什么。`,
      teachingObjective: `能说清「${topic}」的学习目标、内容边界和评价方式。`,
      keyPoints: points.slice(0, 3),
    },
    {
      type: 'lecture',
      title: `${learnerCopy.coreTitle}：${text(points[0], 22)}`,
      description: `从材料或需求中最关键的内容切入，解释概念之间的关系。`,
      teachingObjective: `能用自己的话解释「${text(points[0], 24)}」并给出一个例子。`,
      keyPoints: points.slice(0, 4),
    },
    ...(count > 5
      ? [
          {
            type: 'lecture',
            title: `${learnerCopy.materialTitle}：${text(points[1] || topic, 20)}`,
            description: '把材料中的证据、步骤或例子组织成可复述的知识结构。',
            teachingObjective: '能引用材料中的具体信息支持自己的理解。',
            keyPoints: points.slice(1, 5),
          },
        ]
      : []),
    {
      type: 'quiz',
      title: '检索练习：先回忆，再解释',
      description: `用 2–3 道题检查对「${topic}」核心内容的掌握。`,
      teachingObjective: '能独立回忆关键内容并识别错误表述。',
      keyPoints: points.slice(0, 3),
    },
    {
      type: 'practice',
      title: `${learnerCopy.practiceTitle}：把「${text(topic, 18)}」用出来`,
      description: '把本课内容应用到一个新情境，完成“判断—依据—行动”的作答链。',
      teachingObjective: '能把本课知识迁移到新的问题和情境中。',
      keyPoints: points.slice(0, 3),
    },
    {
      type: 'review',
      title: '收束与下一步',
      description: '用一张结构卡复盘本课，并标记仍需回材料核对的问题。',
      teachingObjective: '能复述本课结构，并制定下一步复习行动。',
      keyPoints: points.slice(0, 4),
    },
  ]

  const outlines = scenes.slice(0, count).map((scene, index) => ({
    id: `scene_${index + 1}`,
    ...scene,
    takeaways: normalizeTakeaways(
      scene.keyPoints?.slice(0, 3),
      scene.keyPoints || [],
      scene.type === 'lecture' || scene.type === 'review',
    ),
    difficultyTier: scene.type === 'lecture' ? Math.min(3, index + 1) : 1,
    estimatedMinutes: durations[index],
    sourceChunkIds: sources,
    visualHint: visualHintFor(scene, {
      subject: learnerProfile.subject,
      stage: learnerProfile.stage,
      objective: context.objective,
    }),
    order: index + 1,
  }))

  return {
    courseTitle: `${topic} · ${modeLabel}`,
    courseSummary: `围绕“${context.objective}”组织 ${context.durationMinutes} 分钟学习。${
      sources.length ? '内容优先依据已上传材料。' : '当前未上传匹配材料，具体事实需在学习中核对。'
    }讲解方式：${learnerProfile.teaching}`,
    languageDirective: `${learnerCopy.language} ${learnerProfile.board}`,
    learnerProfile,
    outlines,
  }
}

function shorten(value, max = 52) {
  const normalized = text(value, max + 1)
  return normalized.length > max ? `${normalized.slice(0, max)}…` : normalized
}

function localBoardContent(project, outline) {
  const points = (outline.keyPoints || []).filter(Boolean)
  const primary = points[0] || outline.title || courseTopic(project)
  const comparison = points.slice(0, 3)
  const learnerProfile = normalizeLearnerProfile(project.learnerProfile, {
    objective: project.objective,
    chapter: project.chapter,
    audience: project.audience,
  })
  const youngerLearner = ['preschool', 'primary', 'junior'].includes(
    learnerProfile.stage,
  )
  const processTopic =
    /过程|变化|步骤|流程|因果|机制|循环|方程|函数|实验|决策|计划|判断|推理/.test(
      `${project.title || ''} ${project.objective || ''} ${outline.title || ''} ${points.join(' ')}`,
    )
  const blocks = [
    {
      type: 'outline',
      title: '本节路线图',
      items: outline.keyPoints.slice(0, 4),
    },
    {
      type: 'definition',
      title: '本节核心',
      term: text(primary, 30),
      definition: text(primary, 160),
      concreteAnchor:
        youngerLearner && processTopic
          ? `先看“${text(outline.title, 18)}”里的一个具体情形，再对照这句话。`
          : `先用“${text(primary, 24)}”解释一个具体情形，再回到概念边界。`,
      analogy:
        learnerProfile.stage === 'university' || learnerProfile.stage === 'adult'
          ? '先确认概念边界与适用条件，再连接材料中的证据。'
          : `可以先把它想成“${text(outline.title, 18)}”里的一个关键零件，再看它如何影响结果。`,
    },
    {
      type: 'table',
      title: '内容结构',
      columns: ['要点', '一句话理解', '学习动作'],
      rows: comparison.map((point) => [
        shorten(point, 28),
        shorten(point, 52),
        youngerLearner ? '看例子 → 说变化 → 做一题' : '解释 → 举例 → 自测',
      ]),
    },
    {
      type: 'diagram',
      title: '理解与应用链',
      nodes: [
        { label: '定位问题', note: outline.title },
        { label: '解释内容', note: primary },
        { label: '回看材料', note: '找到术语、例子或步骤' },
        { label: '完成任务', note: '用新情境检验理解' },
      ],
      caption: '板书只呈现理解链，不替学生跳过推理。',
    },
  ]
  if (youngerLearner && processTopic) {
    blocks.push({
      type: 'animation',
      title: '跟着变化看',
      caption: '每次只改变一个条件，先猜结果，再点下一步核对。',
      steps: [
        {
          label: '先看起点',
          detail: `找出「${text(primary, 24)}」中已经知道的条件。`,
        },
        {
          label: '只改一处',
          detail: '选择最关键的一个条件，把它换掉或放大。',
        },
        {
          label: '看结果',
          detail: '比较前后变化，用本节概念说出为什么会这样。',
        },
      ],
    })
  }
  blocks.push(
    {
      type: 'callout',
      title: '材料边界',
      tone: 'note',
      text: outline.sourceChunkIds?.length
        ? '本页优先依据已上传材料生成；材料未覆盖的事实需要继续核对。'
        : '当前没有匹配材料；本页提供学习框架，具体事实需要核对。',
    },
    {
      type: 'question',
      title: '停下来想一想',
      prompt: youngerLearner
        ? `如果换掉一个条件，「${text(primary, 24)}」的结果可能怎样变化？先猜，再说理由。`
        : `如果要用自己的话讲清「${text(primary, 28)}」，你会先说明什么？`,
      options: youngerLearner
        ? ['先猜变化，再说理由', '先看答案，不用解释']
        : ['先解释含义并连接材料', '只重复标题'],
    },
  )
  const lesson = normalizeBoardLesson(
    {
      chapter: project.chapter || courseTopic(project),
      title: outline.title,
      subtitle: outline.description,
      blocks,
    },
    project.chapter || courseTopic(project),
  )
  // 衔接兜底：本地判定"推荐交互"且模型/模板未产出 simulation 时补一个受控模型块
  const withSimulation = ensureSimulationBlock(lesson, {
    subject: learnerProfile.subject,
    stage: learnerProfile.stage,
    keyPoints: outline.keyPoints,
  })
  return {
    kind: 'board',
    lesson: withSimulation,
    sourceChunkIds: outline.sourceChunkIds,
  }
}

function localPracticeContent(project, outline) {
  const topic = courseTopic(project)
  const points = (outline.keyPoints || []).filter(Boolean)
  const [first, second] = points
  const learnerProfile = normalizeLearnerProfile(project.learnerProfile, {
    objective: project.objective,
    chapter: project.chapter,
    audience: project.audience,
  })
  const youngerLearner = ['preschool', 'primary', 'junior'].includes(
    learnerProfile.stage,
  )
  return {
    kind: 'practice',
    prompt: youngerLearner
      ? `请自己想一个生活中的新例子，看看「${topic}」还能不能解释。` +
        `先说发生了什么，再用「${text(first || topic, 32)}」说明原因；` +
        `如果能改变一个条件，猜猜结果会怎样。`
      : `请设计一个能检验「${topic}」理解的新情境。` +
        `先用「${text(first || topic, 32)}」说明你会如何判断，` +
        `再用${second ? `「${text(second, 32)}」` : '另一个课程要点'}补充依据，最后给出一个可执行的结论或方案。`,
    referencePoints: [
      '能准确使用本课关键术语，而不是只复述标题。',
      youngerLearner
        ? '能举出一个具体例子，并说清条件和结果。'
        : '能引用材料中的信息或明确说明当前依据不足。',
      youngerLearner
        ? '能解释“为什么”，而不是只说“就是这样”。'
        : '结论包含条件、步骤或可验证的行动。',
    ],
    rubric: [
      { criterion: '概念判断', weight: 40 },
      { criterion: '理论依据', weight: 35 },
      { criterion: '行动建议', weight: 25 },
    ],
    followUp: youngerLearner
      ? '只换掉一个条件，你的解释还成立吗？先猜，再说理由。'
      : '换一个条件后，你的结论还成立吗？请指出最关键的边界。',
    sourceChunkIds: outline.sourceChunkIds,
  }
}

function localQuestionsFromOutline(outline, learnerProfile) {
  const youngerLearner = ['preschool', 'primary', 'junior'].includes(
    learnerProfile.stage,
  )
  return (outline.keyPoints || []).slice(0, 3).map((point, index) => ({
    id: `course-q-${index + 1}`,
    stem: youngerLearner
      ? `学完「${text(point, 42)}」后，下面哪种做法说明你真的理解了？`
      : `关于「${text(point, 48)}」，哪项最符合本课的学习要求？`,
    options: youngerLearner
      ? [
          '能用自己的话解释，并举一个例子',
          '只把这句话背下来',
          '遇到新问题就凭感觉猜',
          '不看条件，直接套结论',
        ]
      : [
          '能够解释含义，并说明它与课程材料或具体情境的关系',
          '只记住标题，不需要理解适用条件',
          '把它和任意相近概念混用',
          '跳过材料证据，直接给出结论',
        ],
    answerIndex: 0,
    explanation: youngerLearner
      ? `要点「${text(point, 54)}」不能只背，要能解释、举例，并在新问题里用出来。`
      : `要点「${text(point, 54)}」需要被解释、联系材料并通过练习检验。`,
    concept: text(point, 30),
  }))
}

export function buildLocalCourseSceneContent(project, outline) {
  if (outline.type === 'practice') return localPracticeContent(project, outline)
  if (outline.type === 'quiz') {
    const learnerProfile = normalizeLearnerProfile(project.learnerProfile, {
      objective: project.objective,
      chapter: project.chapter,
      audience: project.audience,
    })
    const questions = localQuestionsFromOutline(outline, learnerProfile)
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
  // 模型未产出 simulation 但本地判定推荐时，补一个受控交互模型块，
  // 保证"理科概念 → 可操作模型"不依赖模型自觉
  const profile = normalizeLearnerProfile(project.learnerProfile, {
    objective: project.objective,
    chapter: project.chapter,
    audience: project.audience,
  })
  const withSimulation = ensureSimulationBlock(lesson, {
    subject: profile.subject,
    stage: profile.stage,
    keyPoints: outline.keyPoints,
  })
  return { kind: 'board', lesson: withSimulation, sourceChunkIds }
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
