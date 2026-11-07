import { sendChatJSON } from './chat'
import { courseBlueprintPrompt, courseScenePrompt } from './prompts/courseStudio'
import { PROMPT_VERSION } from './prompts/shared'
import { isEnabled } from '@/config/flags'
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
  inferLearnerProfile,
  normalizeLearnerProfile,
} from '@/utils/learnerProfile'
import { repairText, sanitizeUserInput } from '@/utils/textRepair'
import { buildCompetitionSceneContent } from '@/competition/analysis'

export const COURSE_STUDIO_VERSION = 'openmaic-10a92d6-adapt-v2'
export const COURSE_PROMPT_VERSION = `${PROMPT_VERSION}-course-studio-v2`

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
export async function generateCourseScene({ project, outline, previousScene = null, signal }) {
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
    return {
      content: localCompetitionContent || buildLocalCourseSceneContent(profiledProject, outline),
      sources: sourceSummary(sources.chunks),
      fallback: true,
      error: null,
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
    return {
      content: result.value,
      sources: sourceSummary(sources.chunks),
      fallback: false,
      repaired: result.repaired,
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
