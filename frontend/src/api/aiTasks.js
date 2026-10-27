import { sendChat } from './chat'

/**
 * AI 任务层：一人一题练习（M2）、AI 智能出题考核（M4）、案例摘要整理（M3）
 * 所有任务通过统一的模型配置调用，任务提示词内自行处理学科背景（M5）
 */

/** 题型选项（M2） */
export const PRACTICE_TYPES = ['案例分析', '情景模拟', '即兴演讲']

/** 出题范围题型（M4） */
export const ASSESSMENT_TYPES = ['情景案例题', '模拟面试题']

/** 难度选项（M4） */
export const DIFFICULTY_OPTIONS = ['基础', '中等', '提高']

function disciplineHint(discipline) {
  if (discipline === '工科类') {
    return '；该学生为工科背景，情境优先取材工程管理、生产运营、项目协作场景'
  }
  if (discipline === '管理类') {
    return '；该学生为管理类背景，情境可用典型企业管理场景'
  }
  return discipline ? `；该学生学科背景：${discipline}` : ''
}

/**
 * M2：生成一人一题练习题目
 * @returns {Promise<string>} 题目文本
 */
export async function generatePracticeQuestion({ chapter, type, discipline }) {
  const system =
    '你是《管理学》课程的"一人一题"练习出题助手。\n' +
    '要求：\n' +
    '1. 只给出情境描述与任务要求，不给出任何提示、要点或答案；\n' +
    '2. 情境贴近真实管理场景，具体可感；\n' +
    '3. 题目最后一行注明考查章节；\n' +
    '4. 总长度控制在 200 字以内。'
  const user =
    `章节：${chapter}\n题型：${type}${disciplineHint(discipline)}\n请出一道练习题。`
  return sendChat([{ role: 'user', content: user }], {
    systemPrompt: system,
    temperature: 0.8,
  })
}

/**
 * M2：练习作答反馈（三维度：观点结构 / 理论运用 / 表达逻辑）
 * @returns {Promise<string>} 反馈文本
 */
export async function reviewPracticeAnswer({ chapter, question, answer, discipline }) {
  const system =
    '你是《管理学》课程的口语表达教练，为学生的一人一题练习作答提供反馈。\n' +
    '要求：\n' +
    '1. 从"观点结构、理论运用、表达逻辑"三个维度分别点评；\n' +
    '2. 先肯定亮点，再给一条具体可操作的改进建议；\n' +
    '3. 采用引导式语气，不代替学生思考，不直接给标准答案；\n' +
    '4. 控制在 200 字以内。'
  const user =
    `章节：${chapter}\n题目：${question}\n学生作答：${answer}${disciplineHint(discipline)}\n请给出反馈。`
  return sendChat([{ role: 'user', content: user }], {
    systemPrompt: system,
    temperature: 0.4,
  })
}

/**
 * M4：考核出题（结合学生过程性评价与教师划定范围，附参考要点）
 * @returns {Promise<{question:string, referencePoints:string}>}
 */
export async function generateAssessmentQuestion({ student, scope, evaluation }) {
  const system =
    '你是《管理学》课程的考核出题助手，为教师生成个性化模拟面试题。\n' +
    '要求：\n' +
    '1. 依据出题范围（章节、题型、难度）与学生过程性评价生成一道题，评价薄弱的章节加大考查权重；\n' +
    '2. 题目只描述任务与要求，不写答案；\n' +
    '3. 题目之后另起一行，以"【参考要点】"开头给出 3 条参考要点（供教师复核，学生端不展示）；\n' +
    '4. 出题内容不得超出《管理学》教材范围，避免引入未经证实的结论。'
  const user =
    `学生：${student.name}（学号 ${student.id}${disciplineHint(student.discipline)}）\n` +
    `过程性评价：${evaluation}\n` +
    `出题范围：章节 ${scope.chapters.join('、')}；题型 ${scope.questionType}；难度 ${scope.difficulty}\n` +
    '请生成一道模拟面试题。'
  const text = await sendChat([{ role: 'user', content: user }], {
    systemPrompt: system,
    temperature: 0.7,
  })
  const idx = text.indexOf('【参考要点】')
  if (idx >= 0) {
    return {
      question: text.slice(0, idx).trim(),
      referencePoints: text.slice(idx + '【参考要点】'.length).trim(),
    }
  }
  return { question: text.trim(), referencePoints: '' }
}

/**
 * M4：学生作答后的 AI 反馈（参考要点 + 改进建议）
 * @returns {Promise<string>} 反馈文本
 */
export async function reviewAssessmentAnswer({ question, answer, referencePoints }) {
  const system =
    '你是《管理学》课程的模拟面试官，对学生的考核作答给出反馈。\n' +
    '要求：\n' +
    '1. 先给出 2-3 条参考要点（结合题目考查意图）；\n' +
    '2. 再针对学生作答给出一条具体改进建议；\n' +
    '3. 语气鼓励、专业，不直接给完整标准答案；\n' +
    '4. 控制在 200 字以内。'
  const user =
    `题目：${question}\n学生作答：${answer}\n` +
    (referencePoints ? `教师复核参考要点：${referencePoints}\n` : '') +
    '请给出反馈。'
  return sendChat([{ role: 'user', content: user }], {
    systemPrompt: system,
    temperature: 0.4,
  })
}

/**
 * M3：学生提交案例的 AI 辅助整理（一句话摘要 + 知识标签）
 * @returns {Promise<{summary:string, tags:string[]}>}
 */
export async function summarizeCase({ title, chapter, content }) {
  const system =
    '你是《管理学》课程的助教，负责整理学生提交的预习案例。\n' +
    '请输出两行：\n' +
    '第一行以"【摘要】"开头，给出 50 字以内的一句话摘要；\n' +
    '第二行以"【标签】"开头，给出 3 个知识标签，用顿号分隔。'
  const user = `案例标题：${title}\n相关章节：${chapter}\n案例内容：${content}`
  const text = await sendChat([{ role: 'user', content: user }], {
    systemPrompt: system,
    temperature: 0.3,
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
}
