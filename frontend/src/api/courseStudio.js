import { sendChatJSON, sendChatDetailed } from './chat'
import {
  courseBlueprintPrompt,
  courseScenePrompt,
  courseSceneRepairPrompt,
  courseScriptPrompt,
} from './prompts/courseStudio'
import { PROMPT_VERSION, TEXT_INTEGRITY_RULE } from './prompts/shared'
import { isEnabled } from '@/config/flags'
import {
  checkScientificModel,
  generateOpenmaicScene,
  generateSceneOutlines,
  normalizeSceneOutlines,
  withReferenceMaterial,
} from '@/api/openmaic'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useModelStore } from '@/stores/model'
import { useCompetitionStore } from '@/stores/competition'
import { getOutlineByTitle, outlineToText } from '@/mock/courseOutline'
import {
  buildLocalCourseBlueprint,
  buildLocalCourseSceneContent,
  normalizeCourseBlueprint,
  normalizeCourseSceneContent,
} from '@/utils/courseStudio'
import {
  normalizeCoursePlan,
  planFromBlueprint,
} from '@/utils/courseIR'
import { validateCoursePlan, validateQuizContent } from '@/utils/courseValidator'
import { repairCoursePlan, repairSceneContent } from '@/utils/courseRepair'
import {
  auditLedger,
  extractSceneClaims,
} from '@/utils/evidenceLedger'
import { checkSubjectConsistency } from '@/utils/subjectCheck/index'
import {
  buildLocalCourseScript,
  normalizeCourseScript,
} from '@/utils/courseScript'
import {
  inferLearnerProfile,
  normalizeLearnerProfile,
} from '@/utils/learnerProfile'
import { repairText, sanitizeUserInput } from '@/utils/textRepair'
import { buildCompetitionSceneContent } from '@/competition/analysis'

export const COURSE_STUDIO_VERSION = 'openmaic-0.3.29-full-v1'
export const COURSE_PROMPT_VERSION = `${PROMPT_VERSION}-course-studio-v1`

function modelReady() {
  try {
    return !!useModelStore().isConfigured
  } catch {
    return false
  }
}

function sourceSummary(sources) {
  return sources.map((source) => ({
    id: source.id,
    title: source.title,
    chapter: source.chapter,
  }))
}

function chapterFallback(chapter, domain = 'general') {
  if (!['management', 'math7'].includes(domain)) return ''
  const outline = getOutlineByTitle(chapter)
  return outline ? outlineToText([outline]) : ''
}

async function collectSources({
  chapter,
  query,
  materialIds = [],
  preferUploaded = false,
  excludeSeeded = false,
  maxContextChars = 6000,
  topK = 6,
}) {
  try {
    const knowledge = useKnowledgeStore()
    const context = await knowledge.buildGenerationContext({
      chapter,
      query,
      materialIds,
      preferUploaded,
      excludeSeeded,
      maxContextChars,
      topK,
    })
    // 材料正文再过一遍修复：覆盖早期导入、种子数据等未经导入侧净化的路径
    return { text: repairText(context.text).text, chunks: context.chunks }
  } catch {
    return { text: '', chunks: [] }
  }
}

function repairUserPrompt({ rawText, reason }) {
  return `上一次输出没有通过课程结构校验：${reason}

请保持原有教学意图和材料边界，只把结果修复成完全符合指定 JSON 契约的对象。
不要解释，不要使用 Markdown，不要省略必填字段。

上一次输出：
${String(rawText || '').slice(0, 14_000)}`
}

// ============================================================
// OpenMAIC 管线接入（THU-MAIC/OpenMAIC @openmaic/generation@0.3.29）
// 大纲/场景提示词与契约走上游资产；产出适配回本项目受控渲染契约。
// 设计文档：docs/research/openmaic-integration-design.md
// ============================================================

/**
 * 把 OpenMAIC 管线的 aiCall(system, user) 接到本项目的模型通道。
 * 与上游一致：不用 response_format，纯提示词工程 + 4 策略 JSON 修复。
 */
function openmaicAiCall({ task, kind = 'course', traceRefs, signal, maxTokens, temperature }) {
  return async (system, user) => {
    const result = await sendChatDetailed([{ role: 'user', content: user }], {
      systemPrompt: system,
      temperature,
      maxTokens,
      kind,
      task,
      promptVersion: COURSE_PROMPT_VERSION,
      traceRefs,
      signal,
      retry: 1,
    })
    return result.text
  }
}

/** OpenMAIC 模板的 teacherContext 注入位：放本项目规则（抗乱码 + 中文 + 结构约束）。 */
function openmaicTeacherContext(context = {}) {
  const rules = [
    '## Host project rules',
    '- 所有内容使用简体中文；术语首次出现时给一句白话解释。',
    '- 不得输出乱码字形（例如把 p/q 写成"荞/株"）；数学表达式用纯文本（如 a/b、x^2），不要用 LaTeX 命令。',
    '- 面向管理类学习者时，优先用企业管理、生产调度、项目协作等情境举例。',
  ]
  if (context.materialText) {
    // 场景消息末尾由 withReferenceMaterial 附上材料正文，此处只锚定规则
    rules.push('- 优先依据本消息末尾【参考材料 · 必须依据】中的事实；材料未覆盖的内容不要编造具体数据。')
  }
  return `${TEXT_INTEGRITY_RULE}\n\n${rules.join('\n')}`
}

/**
 * OpenMAIC 大纲阶段：需求 → 上游 requirements-to-outlines 提示词 →
 * 三键 JSON 契约 → normalizeSceneOutlines 适配 → normalizeCourseBlueprint
 * （沿用本项目的教学序列保障、难度阶梯、时长再平衡）。
 * 任何一步失败返回 null，由调用方回退自研管线。
 */
async function openmaicBlueprint(context) {
  const requirement = [
    context.objective ? `学习目标：${context.objective}` : '',
    context.chapter ? `章节：${context.chapter}` : '',
    context.audience ? `受众：${context.audience}` : '',
    `时长：约 ${context.durationMinutes} 分钟`,
    context.materialText ? `参考材料：\n${String(context.materialText).slice(0, 6000)}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const result = await generateSceneOutlines(
    {
      requirement,
      userNickname: context.audience || '',
      userBio: context.learnerProfile?.teaching || '',
    },
    openmaicAiCall({
      task: 'course.outline.openmaic',
      traceRefs: { chapter: context.chapter, mode: context.mode, durationMinutes: context.durationMinutes },
      maxTokens: 3000,
    }),
    {
      pdfText: context.materialText,
      teacherContext: openmaicTeacherContext(context),
      maxScenes: Math.min(8, Math.max(4, Math.round(context.durationMinutes / 6))),
    },
  )
  if (!result.success) return null
  const adapted = normalizeSceneOutlines(result.data)
  if (!adapted?.outlines?.length) return null
  const blueprint = normalizeCourseBlueprint(
    {
      courseTitle: adapted.courseTitle,
      languageDirective: adapted.languageDirective,
      learnerProfile: context.learnerProfile,
      outlines: adapted.outlines,
    },
    context,
  )
  return blueprint ? { blueprint, fallbacks: adapted.fallbacks } : null
}

/**
 * 先正常生成，再由本地 schema 校验；失败时给模型一次“只修复结构”的机会。
 * 这段策略参考 OpenMAIC 的 parse → validate → retry 分层，但本项目的
 * schema 更窄，并且不会允许自由 HTML / 画布进入渲染层。
 */
async function requestStructured({
  prompt,
  normalize,
  task,
  kind,
  traceRefs,
  signal,
  maxTokens,
}) {
  const requestOptions = {
    systemPrompt: prompt.system,
    temperature: prompt.temperature,
    maxTokens: maxTokens || prompt.maxTokens,
    reasoningEffort: prompt.reasoningEffort,
    responseFormat: 'json_object',
    kind,
    task,
    promptVersion: COURSE_PROMPT_VERSION,
    traceRefs,
    signal,
    retry: 1,
  }

  const first = await sendChatJSON([{ role: 'user', content: prompt.user }], requestOptions)
  const firstValue = normalize(first.data)
  if (firstValue) return { value: firstValue, repaired: false }

  const second = await sendChatJSON(
    [{ role: 'user', content: repairUserPrompt({ rawText: first.text, reason: '字段或内容不完整' }) }],
    { ...requestOptions, maxTokens: Math.max(1800, requestOptions.maxTokens) },
  )
  const secondValue = normalize(second.data)
  if (secondValue) return { value: secondValue, repaired: true }
  throw new Error('模型返回了课程内容，但连续两次都未通过结构校验')
}

/** 第一阶段：只生成可编辑大纲，不生成完整课程内容。 */
export async function generateCourseBlueprint({
  chapter,
  objective,
  audience = '本课程学习者',
  mode = 'course',
  durationMinutes = 30,
  domain = 'general',
  materialIds = [],
}) {
  // 输入侧净化：用户从损坏 PDF 复制的主题/章节名常带乱码
  // （复现用例：“第二章 有理数的运算 （2 ）荞 状 × 狆 株”），
  // 先修复再进入检索、学习者画像推断与提示词。
  const cleanObjective = sanitizeUserInput(objective, { maxLength: 8000 })
  const cleanChapter = sanitizeUserInput(chapter, { maxLength: 2000 })
  const cleanAudience = sanitizeUserInput(audience, { maxLength: 2000 })
  const inputNotice =
    cleanObjective.notice || cleanChapter.notice || cleanAudience.notice || ''

  const sources = await collectSources({
    chapter: cleanChapter.text,
    query: cleanObjective.text,
    materialIds,
    preferUploaded: true,
    excludeSeeded: domain === 'general',
    maxContextChars: 7000,
    topK: 7,
  })
  const materialText = sources.text || chapterFallback(cleanChapter.text, domain)
  const sourceChunkIds = sources.chunks.map((chunk) => chunk.id)
  const learnerProfile = inferLearnerProfile({
    objective: cleanObjective.text,
    chapter: cleanChapter.text,
    audience: cleanAudience.text,
    materialText,
  })
  const context = {
    chapter: cleanChapter.text,
    objective: cleanObjective.text,
    audience: cleanAudience.text,
    mode,
    durationMinutes,
    domain,
    materialText,
    sourceChunkIds,
    learnerProfile,
  }

  if (!modelReady()) {
    return {
      blueprint: buildLocalCourseBlueprint(context),
      sources: sourceSummary(sources.chunks),
      fallback: true,
      inputNotice,
      error: null,
    }
  }

  // OpenMAIC 大纲管线（flags.openmaicPipeline）：失败静默回退下方自研管线
  if (isEnabled('openmaicPipeline')) {
    try {
      const openmaic = await openmaicBlueprint(context)
      if (openmaic?.blueprint) {
        return {
          blueprint: openmaic.blueprint,
          sources: sourceSummary(sources.chunks),
          fallback: false,
          pipeline: 'openmaic',
          outlineFallbacks: openmaic.fallbacks || [],
          inputNotice,
          error: null,
        }
      }
      console.warn('[course-studio] openmaic outline 未产出可用蓝图，回退自研管线')
    } catch (error) {
      console.warn('[course-studio] openmaic outline 管线异常，回退自研管线:', error)
    }
  }

  const prompt = courseBlueprintPrompt({
    ...context,
    materialText,
  })

  try {
    const result = await requestStructured({
      prompt,
      normalize: (data) => normalizeCourseBlueprint(data, context),
      task: 'course.outline',
      kind: 'course',
      traceRefs: { chapter: cleanChapter.text, mode, durationMinutes },
    })
    return {
      blueprint: result.value,
      sources: sourceSummary(sources.chunks),
      fallback: false,
      repaired: result.repaired,
      inputNotice,
      error: null,
    }
  } catch (error) {
    if (!isEnabled('offlineFallback')) throw error
    console.warn('[course-studio] outline generation fell back:', error)
    return {
      blueprint: buildLocalCourseBlueprint(context),
      sources: sourceSummary(sources.chunks),
      fallback: true,
      inputNotice,
      error,
    }
  }
}

async function sceneSources(project, outline) {
  if (project.domain === 'math7') {
    try {
      const competition = useCompetitionStore()
      await competition.load()
      const wanted = new Set(outline.sourceChunkIds || [])
      const materials = competition.dataset.materials.filter((item) => wanted.has(item.id))
      return {
        text: repairText(
          materials
            .map(
              (material) =>
                `[${material.id}｜${material.title}｜${material.locator}]\n${material.content}`,
            )
            .join('\n\n'),
        ).text,
        chunks: materials.map((material) => ({
          id: material.id,
          title: material.title,
          chapter: material.locator,
          text: repairText(material.content).text,
        })),
      }
    } catch {
      // 继续尝试普通知识库
    }
  }
  try {
    const knowledge = useKnowledgeStore()
    const ids = outline.sourceChunkIds?.length ? outline.sourceChunkIds : project.sourceChunkIds
    const selected = await knowledge.chunksByIds(ids)
    if (selected.length) {
      return {
        text: repairText(
          selected
            .map(
              (chunk, index) =>
                `[${chunk.id}｜材料${index + 1}｜${chunk.title}｜${chunk.chapter}]\n${chunk.text}`,
            )
            .join('\n\n'),
        ).text,
        chunks: selected,
      }
    }
  } catch {
    // 继续走按章节重建
  }
  return collectSources({
    chapter: project.chapter,
    query: [project.objective, outline.title, ...(outline.keyPoints || [])].join(' '),
    preferUploaded: project.domain === 'general',
    excludeSeeded: project.domain === 'general',
    maxContextChars: 4200,
    topK: 5,
  })
}

/** 第二阶段：只生成一个已确认场景，调用方可逐场景更新进度和恢复。 */
export async function generateCourseScene({
  project,
  outline,
  previousScene = null,
  signal,
  plan = null,
  ledger = null,
}) {
  const sources = await sceneSources(project, outline)
  const materialText = sources.text || chapterFallback(project.chapter, project.domain)
  const allowedSourceIds = sources.chunks.map((chunk) => chunk.id)
  const learnerProfile = normalizeLearnerProfile(project.learnerProfile, {
    objective: project.objective,
    chapter: project.chapter,
    audience: project.audience,
    materialText,
  })
  const profiledProject = { ...project, learnerProfile }
  const context = { project: profiledProject, outline, allowedSourceIds }

  const localCompetitionContent =
    project.domain === 'math7'
      ? buildCompetitionSceneContent(
          useCompetitionStore().dataset,
          outline,
          project.mode,
        )
      : null

  if (!modelReady()) {
    const compiled = isEnabled('courseCompiler')
      ? compileSceneContent({
          project: profiledProject,
          outline,
          content: localCompetitionContent || buildLocalCourseSceneContent(profiledProject, outline),
          plan,
          ledger,
        })
      : null
    return {
      content: compiled?.content || localCompetitionContent || buildLocalCourseSceneContent(profiledProject, outline),
      sources: sourceSummary(sources.chunks),
      fallback: true,
      evidence: compiled?.evidence || [],
      subjectIssues: compiled?.subjectIssues || [],
      repairs: compiled?.repairs || [],
      error: null,
    }
  }

  // OpenMAIC 场景管线（flags.openmaicPipeline）：上游场景提示词 + 契约适配，
  // 产出仍过编译器（学科检查/证据账本/修复）；失败静默回退下方自研管线
  if (isEnabled('openmaicPipeline')) {
    try {
      const scene = await generateOpenmaicScene(
        outline,
        // 场景级材料注入：上游模板无材料正文插值位，包一层 aiCall 把
        // materialText 附到 user 消息末尾——否则场景阶段模型看不到资料
        // （2026-11-08 修复：slide/quiz/interactive 三路统一注入）
        withReferenceMaterial(
          openmaicAiCall({
            task: `course.scene.openmaic.${outline.type}`,
            traceRefs: { projectId: project.id, outlineId: outline.id, type: outline.type },
            signal,
            // interactive 场景要求完整 HTML（含 widget-config <script>），
            // 3000 token 实测被截断 → widget-config 解析失败整场景回退；
            // 8000 为实测安全线（live 实测捕获后上调）
            maxTokens: outline.type === 'practice' && outline.widget ? 8000 : 3000,
          }),
          materialText,
        ),
        {
          languageDirective: project.languageDirective,
          teacherContext: openmaicTeacherContext({ materialText }),
          chapter: project.chapter,
          signal,
        },
      )
      if (!scene.fallbackReason) {
        let content =
          scene.kind === 'quiz'
            ? { kind: 'quiz', questions: scene.questions, sourceChunkIds: allowedSourceIds }
            : { kind: 'board', lesson: scene.lesson, sourceChunkIds: allowedSourceIds }
        let compiled = null
        if (isEnabled('courseCompiler')) {
          compiled = compileSceneContent({
            project: profiledProject,
            outline,
            content,
            plan,
            ledger,
            scientificModel: scene.scientificModel,
          })
          content = compiled.content
          const blocking = (compiled.unresolved || []).filter((item) => item.severity === 'error')
          if (blocking.length) {
            const repaired = await repairCourseSceneWithModel({
              project: profiledProject,
              outline,
              content,
              issues: blocking,
              signal,
            })
            if (repaired?.content) {
              compiled = compileSceneContent({
                project: profiledProject,
                outline,
                content: repaired.content,
                plan,
                ledger,
                scientificModel: scene.scientificModel,
              })
              content = compiled.content
            }
          }
        }
        return {
          content,
          sources: sourceSummary(sources.chunks),
          fallback: false,
          pipeline: 'openmaic',
          dropped: scene.dropped || null,
          evidence: compiled?.evidence || [],
          subjectIssues: compiled?.subjectIssues || [],
          repairs: compiled?.repairs || [],
          error: null,
        }
      }
      console.warn(`[course-studio] openmaic ${outline.type} 场景不可用（${scene.fallbackReason}），回退自研管线`)
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      console.warn(`[course-studio] openmaic ${outline.type} 场景管线异常，回退自研管线:`, error)
    }
  }

  const prompt = courseScenePrompt({
    project: profiledProject,
    outline,
    materialText,
    sourceChunkIds: allowedSourceIds,
    previousScene,
  })

  try {
    const result = await requestStructured({
      prompt,
      normalize: (data) => normalizeCourseSceneContent(data, context),
      task: `course.scene.${outline.type}`,
      kind: 'course',
      traceRefs: {
        projectId: project.id,
        outlineId: outline.id,
        type: outline.type,
      },
      signal,
    })
    let content = result.value
    let compiled = null
    if (isEnabled('courseCompiler')) {
      compiled = compileSceneContent({
        project: profiledProject,
        outline,
        content,
        plan,
        ledger,
      })
      content = compiled.content
      // 仍有 error 级学科问题且模型可用时，做一次定向修复（不重生成整门课）
      const blocking = (compiled.unresolved || []).filter((item) => item.severity === 'error')
      if (blocking.length) {
        const repaired = await repairCourseSceneWithModel({
          project: profiledProject,
          outline,
          content,
          issues: blocking,
          signal,
        })
        if (repaired?.content) {
          compiled = compileSceneContent({
            project: profiledProject,
            outline,
            content: repaired.content,
            plan,
            ledger,
          })
          content = compiled.content
        }
      }
    }
    return {
      content,
      sources: sourceSummary(sources.chunks),
      fallback: false,
      repaired: result.repaired,
      evidence: compiled?.evidence || [],
      subjectIssues: compiled?.subjectIssues || [],
      repairs: compiled?.repairs || [],
      error: null,
    }
  } catch (error) {
    if (!isEnabled('offlineFallback')) throw error
    console.warn(`[course-studio] ${outline.type} scene fell back:`, error)
    return {
      content: localCompetitionContent || buildLocalCourseSceneContent(profiledProject, outline),
      sources: sourceSummary(sources.chunks),
      fallback: true,
      error,
    }
  }
}

/**
 * 第三阶段：讲稿层。输入是已生成的场景内容（板书/题目），
 * 输出与视觉事件 1:1 对齐的 beats；模型失败时用板书确定性推导兜底。
 */
export async function generateCourseScript({ project, outline, scene, signal }) {
  const context = { project, outline, scene }
  const local = buildLocalCourseScript(project, outline, scene)

  if (!modelReady()) {
    return { script: local, fallback: true, error: null }
  }

  const prompt = courseScriptPrompt({
    project,
    outline,
    scene,
    sourceChunkIds: outline.sourceChunkIds || project.sourceChunkIds || [],
  })

  try {
    const result = await requestStructured({
      prompt,
      normalize: (data) => normalizeCourseScript(data, context),
      task: 'course.script',
      kind: 'course',
      traceRefs: {
        projectId: project.id,
        outlineId: outline.id,
        type: outline.type,
      },
      signal,
    })
    return {
      script: { ...result.value, local: false },
      fallback: false,
      repaired: result.repaired,
      error: null,
    }
  } catch (error) {
    if (!isEnabled('offlineFallback')) throw error
    console.warn(`[course-studio] ${outline.type} script fell back:`, error)
    return { script: local, fallback: true, error }
  }
}

// ============================================================
// 课程编译器（Course Compiler）—— 研究型管线
// 规划 IR → 内容生成 → 约束验证 → 自动修复 → 板书/讲稿渲染
// ============================================================

/**
 * 蓝图编译：在第一阶段（大纲）之后插入 IR 化与硬约束验证/修复。
 * 返回原 blueprint 结果 + plan / validation / repairs / unresolved。
 */
export async function compileCourseBlueprint(input = {}) {
  const base = await generateCourseBlueprint(input)
  if (!isEnabled('courseCompiler')) {
    return { ...base, plan: null, validation: null, repairs: [], unresolved: [] }
  }
  const context = {
    chapter: input.chapter || '',
    objective: input.objective || '',
    audience: input.audience || '',
    durationMinutes: input.durationMinutes || 30,
    domain: input.domain || base.blueprint?.domain || 'general',
    allowedChunkIds: (base.sources || []).map((source) => source.id),
    requirements: input.requirements || [],
  }
  const plan = planFromBlueprint(base.blueprint, context)
  if (!plan) {
    return { ...base, plan: null, validation: null, repairs: [], unresolved: [] }
  }
  const validation = validateCoursePlan(plan)
  const { plan: repaired, repairs, unresolved } = repairCoursePlan(plan, validation)
  return {
    ...base,
    plan: repaired,
    validation: validateCoursePlan(repaired),
    repairs,
    unresolved,
  }
}

/**
 * 场景内容编译：学科一致性检查 → 证据账本抽取 → 确定性修复。
 * 不替换生成结果，只在其后挂审计信息。
 * scientificModel：OpenMAIC 交互场景的科学模型契约（四字段），
 * 经 checkScientificModel 产出 SCI-* 检查码并入学科问题。
 */
function compileSceneContent({ project, outline, content, plan, ledger, scientificModel = null }) {
  const scene =
    plan?.scenes?.find((item) => item.id === outline.id) ||
    plan?.scenes?.[plan.scenes.length - 1] ||
    outline
  const subject = checkSubjectConsistency({
    domain: project.domain,
    subject: project.learnerProfile?.subject || '',
    scene,
    content,
  })
  // 题目质量（QUIZ-*）：选项重复/答案唯一性/选项数量，全学科生效
  const quizIssues = validateQuizContent([{ outlineId: outline.id, title: outline.title, content }])
  const sci = checkScientificModel({ model: scientificModel, content })
  const issues = [...subject.issues, ...quizIssues, ...sci.issues]
  const evidence = ledger ? extractSceneClaims(ledger, { plan, scene, content }) : []
  const { content: fixed, repairs, unresolved } = repairSceneContent(scene, content, issues)
  // 修复后重新抽取证据，保证账本与最终内容一致
  if (ledger && fixed !== content) {
    for (const claim of evidence) {
      const index = ledger.claims.findIndex((item) => item.id === claim.id)
      if (index >= 0) ledger.claims.splice(index, 1)
    }
    evidence.length = 0
    evidence.push(...extractSceneClaims(ledger, { plan, scene, content: fixed }))
  }
  const recheckSubject = checkSubjectConsistency({
    domain: project.domain,
    subject: project.learnerProfile?.subject || '',
    scene,
    content: fixed,
  })
  const recheckQuiz = validateQuizContent([{ outlineId: outline.id, title: outline.title, content: fixed }])
  const recheckSci = checkScientificModel({ model: scientificModel, content: fixed })
  return {
    content: fixed,
    evidence,
    subjectIssues: [...recheckSubject.issues, ...recheckQuiz, ...recheckSci.issues],
    subjectChecker: subject.checker,
    repairs,
    unresolved,
  }
}

/**
 * 定向模型修复：只重生成未通过校验的场景（验证—修复循环的模型侧）。
 * 失败返回 null，由调用方保留确定性修复后的内容。
 */
export async function repairCourseSceneWithModel({
  project,
  outline,
  content,
  issues = [],
  signal,
}) {
  if (!modelReady() || !issues.length) return null
  const prompt = courseSceneRepairPrompt({
    plan: null,
    scene: outline,
    issues,
    materialText: '',
    allowedChunkIds: outline.sourceChunkIds || project.sourceChunkIds || [],
  })
  try {
    const result = await requestStructured({
      prompt,
      normalize: (data) =>
        normalizeCourseSceneContent(data, {
          project,
          outline,
          allowedSourceIds: outline.sourceChunkIds || [],
        }),
      task: 'course.scene.repair',
      kind: 'course',
      traceRefs: { projectId: project.id, outlineId: outline.id, type: outline.type },
      signal,
    })
    return { content: result.value, repaired: true }
  } catch (error) {
    console.warn('[course-studio] scene repair fell back:', error)
    return null
  }
}

/** 从项目大纲重建 IR（教师编辑大纲后调用）。 */
export function recompilePlan(project) {
  if (!isEnabled('courseCompiler')) return { plan: null, validation: null, repairs: [] }
  const plan = normalizeCoursePlan(
    {
      courseId: project.id,
      courseTitle: project.title,
      courseSummary: project.summary,
      languageDirective: project.languageDirective,
      learnerProfile: project.learnerProfile,
      domain: project.domain,
      outlines: project.outlines || [],
    },
    {
      chapter: project.chapter,
      objective: project.objective,
      audience: project.audience,
      durationMinutes: project.durationMinutes,
      domain: project.domain,
      allowedChunkIds: project.sourceChunkIds || [],
      requirements: [],
    },
  )
  if (!plan) return { plan: null, validation: null, repairs: [] }
  const validation = validateCoursePlan(plan)
  const { plan: repaired, repairs } = repairCoursePlan(plan, validation)
  return { plan: repaired, validation: validateCoursePlan(repaired), repairs }
}
