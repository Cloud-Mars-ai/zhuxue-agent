import { sendChat, sendChatJSON } from './chat'
import { isEnabled } from '@/config/flags'
import { PROMPT_VERSION } from './prompts/shared'
import {
  practiceQuestionPrompt,
  practiceReviewPrompt,
  selfTestPrompt,
} from './prompts/practice'
import {
  assessmentQuestionPrompt,
  assessmentReviewPrompt,
} from './prompts/assessment'
import { caseSummaryPrompt } from './prompts/case'
import { cheatsheetPrompt, diagnosisNarrativePrompt } from './prompts/study'
import { normalizeQuestions, normalizeCheatsheet } from '@/utils/json'
import { buildLocalCheatsheet } from '@/utils/cheatsheet'
import { buildLocalQuestions } from '@/utils/localQuiz'
import { getOutlineByTitle, getOutlineChapters, outlineToText } from '@/mock/courseOutline'

/**
 * AI 任务层
 *
 * 统一约定：
 * - 提示词放在 api/prompts/，本文件只负责组装、解析、降级；
 * - 每个任务都带 kind / task / promptVersion，自动写入学习轨迹；
 * - 模型失败时，若 offlineFallback 开启，返回带「演示缓存」标记的本地结果，
 *   保证课堂演示不中断；同时轨迹里会记录 ok:false，便于排查。
 */

/** 题型选项（M2） */
export const PRACTICE_TYPES = ['案例分析', '情景模拟', '即兴演讲']

/** 出题范围题型（M4） */
export const ASSESSMENT_TYPES = ['情景案例题', '模拟面试题']

/** 难度选项（M4） */
export const DIFFICULTY_OPTIONS = ['基础', '中等', '提高']

const FALLBACK_TAG = '【演示缓存】'

function allowFallback() {
  return isEnabled('offlineFallback')
}

function asFallback(text) {
  return `${FALLBACK_TAG}${text}`
}

/** 取单章课程材料（知识库未接入时的教师确认稿） */
function materialOf(chapter) {
  const c = getOutlineByTitle(chapter)
  return c ? outlineToText([c]) : ''
}

/** 取多章课程材料 */
function materialOfMany(chapters = []) {
  return outlineToText(getOutlineChapters(chapters))
}

/* ============================================================
 * M2 一人一题
 * ============================================================ */

/**
 * 生成一人一题练习题目
 * @returns {Promise<string>} 题目文本
 */
export async function generatePracticeQuestion({ chapter, type, discipline }) {
  const p = practiceQuestionPrompt({
    chapter,
    type,
    discipline,
    materialText: materialOf(chapter),
  })
  try {
    return await sendChat([{ role: 'user', content: p.user }], {
      systemPrompt: p.system,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
      kind: 'practice',
      task: 'practice.question',
      promptVersion: PROMPT_VERSION,
      traceRefs: { chapter, type },
    })
  } catch (err) {
    if (!allowFallback()) throw err
    return asFallback(
      `${chapter} · ${type}\n\n` +
        '某连锁餐饮企业两年内从 12 家门店扩张到 60 家，总部仍由创始人一人拍板选址、采购与店长任免，区域经理只有执行权。最近三个月，三家新店因选址失误连续亏损，店长离职率上升。\n\n' +
        '请分析：该企业当前的组织结构最可能出现什么问题？如果你来做组织调整，会先动哪一处？\n\n' +
        '（考查章节：第4章 组织设计与组织变革）',
    )
  }
}

/**
 * 练习作答反馈（三维度：观点结构 / 理论运用 / 表达逻辑）
 * @returns {Promise<string>} 反馈文本
 */
export async function reviewPracticeAnswer({ chapter, question, answer, discipline, selfTest = false }) {
  const p = practiceReviewPrompt({
    chapter,
    question,
    answer,
    discipline,
    selfTest,
    materialText: materialOf(chapter),
  })
  try {
    return await sendChat([{ role: 'user', content: p.user }], {
      systemPrompt: p.system,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
      kind: 'practice',
      task: 'practice.review',
      promptVersion: PROMPT_VERSION,
      traceRefs: { chapter, selfTest },
    })
  } catch (err) {
    if (!allowFallback()) throw err
    return asFallback(
      '先说做得好的地方：你注意到了总部与区域之间的权责关系，这是这道题的核心。\n\n' +
        '观点结构：你的回答有判断也有理由，但结论出现得偏晚，听的人前两句还不知道你要说什么。下次可以先用一句话给结论，再展开。\n\n' +
        '理论运用：你用了"集权"这个词，方向是对的；如果再点到"管理幅度"和"授权原则"，分析会更完整。\n\n' +
        '表达逻辑：第二段从选址跳到离职率，中间缺一句因果连接。补上"因为……所以……"，逻辑就顺了。\n\n' +
        '你在这道题上的卡点，恰好是记忆正在加固的位置——再答一次，会比这次清楚。',
    )
  }
}

/**
 * 章节自测题（检索练习）
 * @returns {Promise<{questions:Array, fallback:boolean}>}
 */
export async function generateSelfTest({ chapter, count = 5, difficulty = '中等', discipline }) {
  const p = selfTestPrompt({
    chapter,
    count,
    difficulty,
    discipline,
    materialText: materialOf(chapter),
  })
  try {
    const { data } = await sendChatJSON([{ role: 'user', content: p.user }], {
      systemPrompt: p.system,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
      kind: 'selftest',
      task: 'selftest.generate',
      promptVersion: PROMPT_VERSION,
      traceRefs: { chapter, count, difficulty },
    })
    const questions = normalizeQuestions(data, chapter)
    if (questions.length >= Math.min(3, count)) {
      return { questions: questions.slice(0, count), fallback: false }
    }
    throw new Error('自测题结构解析失败')
  } catch (err) {
    if (!allowFallback()) throw err
    return {
      questions: buildLocalQuestions({ chapters: [chapter], count }),
      fallback: true,
    }
  }
}

/* ============================================================
 * M4 课程考核
 * ============================================================ */

/**
 * 考核出题（结合学生过程性评价与教师划定范围，附参考要点）
 * @returns {Promise<{question:string, referencePoints:string}>}
 */
export async function generateAssessmentQuestion({ student, scope, evaluation }) {
  const p = assessmentQuestionPrompt({
    student,
    scope,
    evaluation,
    materialText: materialOfMany(scope.chapters),
  })
  try {
    const text = await sendChat([{ role: 'user', content: p.user }], {
      systemPrompt: p.system,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
      kind: 'assessment',
      task: 'assessment.question',
      promptVersion: PROMPT_VERSION,
      traceRefs: { studentId: student.id, chapters: scope.chapters },
    })
    const idx = text.indexOf('【参考要点】')
    if (idx >= 0) {
      return {
        question: text.slice(0, idx).trim(),
        referencePoints: text.slice(idx + '【参考要点】'.length).trim(),
      }
    }
    return { question: text.trim(), referencePoints: '' }
  } catch (err) {
    if (!allowFallback()) throw err
    return {
      question: asFallback(
        `${student.name} 同学，请结合「${scope.chapters[0] || '本章'}」的内容回答：\n\n` +
          '一家快速扩张的企业发现，新开门店的决策质量明显下降，区域经理认为自己"只有执行权、没有判断权"。\n\n' +
          '请分析：这是哪一类管理问题？你会用本章的哪些概念向创始人解释，并给出第一步调整建议？',
      ),
      referencePoints:
        '1. 能识别集权过度与管理幅度问题；\n2. 能引用授权原则（权责对等、适度授权）；\n3. 能给出可执行的第一步（如区域选址权下放与复盘机制）。',
    }
  }
}

/**
 * 考核作答反馈（参考要点 + 改进建议）
 * @returns {Promise<string>} 反馈文本
 */
export async function reviewAssessmentAnswer({ question, answer, referencePoints }) {
  const p = assessmentReviewPrompt({ question, answer, referencePoints })
  try {
    return await sendChat([{ role: 'user', content: p.user }], {
      systemPrompt: p.system,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
      kind: 'assessment',
      task: 'assessment.review',
      promptVersion: PROMPT_VERSION,
    })
  } catch (err) {
    if (!allowFallback()) throw err
    return asFallback(
      '参考要点：这道题在考"组织结构与决策权配置"的关系，而不是单纯背集权的缺点。\n\n' +
        '你的回答抓住了"总部管得太多"这一现象，方向是对的。下一步可以把现象翻译成课程语言：这是管理幅度过宽与授权不足的叠加，导致了决策质量下降。\n\n' +
        '一条具体建议：下次回答时，先用一句话给出判断（"这是集权过度"），再用两个概念支撑，最后给一个可执行动作。这样面试官能在前 20 秒抓住你的思路。',
    )
  }
}

/* ============================================================
 * M3 课前案例
 * ============================================================ */

/**
 * 学生案例的 AI 辅助整理（一句话摘要 + 知识标签）
 * @returns {Promise<{summary:string, tags:string[]}>}
 */
export async function summarizeCase({ title, chapter, content }) {
  const p = caseSummaryPrompt({ title, chapter, content })
  try {
    const text = await sendChat([{ role: 'user', content: p.user }], {
      systemPrompt: p.system,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
      kind: 'case',
      task: 'case.summarize',
      promptVersion: PROMPT_VERSION,
      traceRefs: { chapter },
    })
    let summary = ''
    let tags = []
    const summaryMatch = text.match(/【摘要】\s*([^\n【]+)/)
    const tagMatch = text.match(/【标签】\s*([^\n]+)/)
    if (summaryMatch) summary = summaryMatch[1].trim()
    if (tagMatch) {
      tags = tagMatch[1]
        .split(/[、,，]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 3)
    }
    if (!summary) summary = text.trim().slice(0, 60)
    return { summary, tags }
  } catch (err) {
    if (!allowFallback()) throw err
    const clean = String(content || '').replace(/\s+/g, ' ').trim()
    return {
      summary: clean.slice(0, 48) || `${title}（演示缓存摘要）`,
      tags: [chapter.replace(/^第\d+章\s*/, ''), '案例分析', '课堂研讨'].slice(0, 3),
    }
  }
}

/* ============================================================
 * 学习支持：速查表 / 诊断叙述
 * ============================================================ */

/**
 * 章节速查表
 * @returns {Promise<{topics:Array, fallback:boolean}>}
 */
export async function generateCheatsheet({ chapters = [], outlineText, layout = 'screen', focus = '' }) {
  const p = cheatsheetPrompt({ chapters, outlineText, layout, focus })
  try {
    const { data } = await sendChatJSON([{ role: 'user', content: p.user }], {
      systemPrompt: p.system,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
      kind: 'cheatsheet',
      task: 'cheatsheet.generate',
      promptVersion: PROMPT_VERSION,
      traceRefs: { chapters, layout, focus },
    })
    const topics = normalizeCheatsheet(data)
    if (topics) return { topics, fallback: false }
    throw new Error('速查表结构解析失败')
  } catch (err) {
    if (!allowFallback()) throw err
    return { topics: buildLocalCheatsheet(chapters), fallback: true }
  }
}

/**
 * 盲区诊断叙述（结构化盲区由前端本地计算，模型只负责写成一段人话）
 * @returns {Promise<string>}
 */
export async function generateDiagnosisNarrative({ studentName, gaps, stats }) {
  if (!gaps?.length) return ''
  const p = diagnosisNarrativePrompt({ studentName, gaps, stats })
  try {
    return await sendChat([{ role: 'user', content: p.user }], {
      systemPrompt: p.system,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
      kind: 'diagnosis',
      task: 'diagnosis.narrative',
      promptVersion: PROMPT_VERSION,
      traceRefs: { gapCount: gaps.length },
    })
  } catch {
    const first = gaps[0]
    return `${studentName}，你最近已经完成了 ${stats.attempts || 0} 次练习。当前最值得先处理的是「${first.chapter}」：${first.evidence}。先把这一处补上，比平均用力更划算。`
  }
}
