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
import { buildCompetitionSceneContent } from '@/competition/analysis'

export const COURSE_STUDIO_VERSION = 'openmaic-10a92d6-adapt-v1'
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

function chapterFallback(chapter) {
  const outline = getOutlineByTitle(chapter)
  return outline ? outlineToText([outline]) : ''
}

async function collectSources({ chapter, query, maxContextChars = 6000, topK = 6 }) {
  try {
    const knowledge = useKnowledgeStore()
    return await knowledge.buildGenerationContext({
      chapter,
      query,
      maxContextChars,
      topK,
    })
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
  audience = '管理学本科生',
  mode = 'course',
  durationMinutes = 30,
}) {
  const sources = await collectSources({
    chapter,
    query: objective,
    maxContextChars: 7000,
    topK: 7,
  })
  const materialText = sources.text || chapterFallback(chapter)
  const sourceChunkIds = sources.chunks.map((chunk) => chunk.id)
  const context = {
    chapter,
    objective,
    audience,
    mode,
    durationMinutes,
    sourceChunkIds,
  }

  if (!modelReady()) {
    return {
      blueprint: buildLocalCourseBlueprint(context),
      sources: sourceSummary(sources.chunks),
      fallback: true,
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
      traceRefs: { chapter, mode, durationMinutes },
    })
    return {
      blueprint: result.value,
      sources: sourceSummary(sources.chunks),
      fallback: false,
      repaired: result.repaired,
      error: null,
    }
  } catch (error) {
    if (!isEnabled('offlineFallback')) throw error
    console.warn('[course-studio] outline generation fell back:', error)
    return {
      blueprint: buildLocalCourseBlueprint(context),
      sources: sourceSummary(sources.chunks),
      fallback: true,
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
        text: materials
          .map(
            (material) =>
              `[${material.id}｜${material.title}｜${material.locator}]\n${material.content}`,
          )
          .join('\n\n'),
        chunks: materials.map((material) => ({
          id: material.id,
          title: material.title,
          chapter: material.locator,
          text: material.content,
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
        text: selected
          .map(
            (chunk, index) =>
              `[${chunk.id}｜材料${index + 1}｜${chunk.title}｜${chunk.chapter}]\n${chunk.text}`,
          )
          .join('\n\n'),
        chunks: selected,
      }
    }
  } catch {
    // 继续走按章节重建
  }
  return collectSources({
    chapter: project.chapter,
    query: [project.objective, outline.title, ...(outline.keyPoints || [])].join(' '),
    maxContextChars: 4200,
    topK: 5,
  })
}

/** 第二阶段：只生成一个已确认场景，调用方可逐场景更新进度和恢复。 */
export async function generateCourseScene({ project, outline, previousScene = null, signal }) {
  const sources = await sceneSources(project, outline)
  const materialText = sources.text || chapterFallback(project.chapter)
  const allowedSourceIds = sources.chunks.map((chunk) => chunk.id)
  const context = { project, outline, allowedSourceIds }

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
      content: localCompetitionContent || buildLocalCourseSceneContent(project, outline),
      sources: sourceSummary(sources.chunks),
      fallback: true,
      error: null,
    }
  }

  const prompt = courseScenePrompt({
    project,
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
      content: localCompetitionContent || buildLocalCourseSceneContent(project, outline),
      sources: sourceSummary(sources.chunks),
      fallback: true,
      error,
    }
  }
}
