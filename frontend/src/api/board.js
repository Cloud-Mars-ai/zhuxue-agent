import { sendChat, sendChatJSON } from './chat'
import { boardLessonPrompt, boardQuestionPrompt } from './prompts/board'
import { PROMPT_VERSION } from './prompts/shared'
import { getOutlineByTitle, outlineToText } from '@/mock/courseOutline'
import {
  boardToContext,
  buildLocalBoardLesson,
  normalizeBoardLesson,
} from '@/utils/board'
import { isEnabled } from '@/config/flags'
import { useUserStore } from '@/stores/user'

const FALLBACK_TAG = '【演示缓存】'

function chapterOf(title) {
  return getOutlineByTitle(title)
}

function disciplineOf() {
  try {
    return useUserStore().discipline || ''
  } catch {
    return ''
  }
}

/**
 * 生成结构化板书。模型只返回 block JSON，任何坐标、HTML 或自由画布指令
 * 都会被 normalizeBoardLesson 丢弃；失败时使用教师确认稿生成确定性板书。
 */
export async function generateBoardLesson({ chapter, focus = '', studyMode = 'course' }) {
  const outline = chapterOf(chapter)
  const normalizedChapter = outline?.title || chapter
  const materialText = outline
    ? outlineToText([outline])
    : '当前没有匹配到教师确认材料，请只给出概念框架并明确标注待核对。'
  const prompt = boardLessonPrompt({
    chapter: normalizedChapter,
    materialText,
    discipline: disciplineOf(),
    focus,
    studyMode,
  })

  try {
    const { data } = await sendChatJSON([{ role: 'user', content: prompt.user }], {
      systemPrompt: prompt.system,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
      reasoningEffort: prompt.reasoningEffort,
      responseFormat: 'json_object',
      kind: 'board',
      task: 'board.generate',
      promptVersion: PROMPT_VERSION,
      traceRefs: { chapter: normalizedChapter, focus, studyMode },
    })
    const lesson = normalizeBoardLesson(data, normalizedChapter)
    if (!lesson) throw new Error('板书结构解析失败')
    return { lesson, fallback: false }
  } catch (err) {
    if (!isEnabled('offlineFallback')) throw err
    return {
      lesson: buildLocalBoardLesson(normalizedChapter),
      fallback: true,
      error: err,
    }
  }
}

function localBoardAnswer({ chapter, lesson, question }) {
  const outline = chapterOf(chapter)
  const concept = outline?.keyPoints?.[0]
  const questionBlock = lesson?.blocks?.find((block) => block.type === 'question')

  if (/答案|怎么做|直接|写完|标准/.test(question)) {
    return (
      `${FALLBACK_TAG}先不急着要整段答案。你可以按这条判断链走：` +
      `先指出案例里的现象，再判断它是否满足「${concept?.term || '核心概念'}」的适用条件，最后给出一个可执行动作。` +
      `你愿意先写出第一步判断吗？`
    )
  }

  if (/为什么|区别|是什么|怎么理解/.test(question)) {
    return (
      `${FALLBACK_TAG}回到板书里的定义：${concept?.definition || '先确认概念定义。'}` +
      `你可以用一个反例来检验自己是否真的理解：如果去掉其中一个条件，结论还成立吗？`
    )
  }

  return (
    `${FALLBACK_TAG}这个问题可以接在“${questionBlock?.prompt || '当前追问'}”后面继续想。` +
    `先把你的直觉写成一句话，再补上你依据的课程概念；我会根据你的理由继续追问。`
  )
}

/** 白板内的追问只写入右侧讨论，不打断板书进度。 */
export async function answerBoardQuestion({ chapter, lesson, question }) {
  const prompt = boardQuestionPrompt({
    chapter,
    lessonText: boardToContext(lesson),
    question,
    discipline: disciplineOf(),
  })

  try {
    const text = await sendChat([{ role: 'user', content: prompt.user }], {
      systemPrompt: prompt.system,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
      reasoningEffort: prompt.reasoningEffort,
      kind: 'board',
      task: 'board.question',
      promptVersion: PROMPT_VERSION,
      traceRefs: { chapter },
    })
    return { text, fallback: false }
  } catch (err) {
    if (!isEnabled('offlineFallback')) throw err
    return {
      text: localBoardAnswer({ chapter, lesson, question }),
      fallback: true,
      error: err,
    }
  }
}
