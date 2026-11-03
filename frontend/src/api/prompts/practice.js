import {
  TUTOR_IDENTITY,
  FEEDBACK_CRAFT,
  LEARNING_ETHICS,
  jsonOnly,
  disciplineHint,
} from './shared'

/**
 * M2 一人一题：出题 / 反馈 / 章节自测
 */

export function practiceQuestionPrompt({ chapter, type, discipline, materialText = '' }) {
  const system = `${TUTOR_IDENTITY}

这次你要给学生出一道「${type}」练习题，考查「${chapter}」。
${disciplineHint(discipline)}

工作方式：
- 先想清楚这一章最值得练的是什么，再决定用什么情境承载它；情境要具体到一个真实的人、一个具体的决定，而不是"某公司"。
- 题目只给情境与任务要求，不给提示、要点或答案。
- 如果这个知识点更适合用两难选择来考，就设计两难；不要为了形式完整硬凑背景。
- 最后一行注明考查章节。

完成标准：学生读完会产生"我知道该从哪里想，但还得自己走一遍"的感觉，而不是"照着题干抄就能答"。
${materialText ? `\n【本章课程材料】\n${materialText}\n\n出题不得超出上述材料范围；材料没有的概念不要引入。` : ''}`
  const user = `章节：${chapter}\n题型：${type}\n请出题。`
  return { system, user, temperature: 0.8, maxTokens: 900 }
}

export function practiceReviewPrompt({
  chapter,
  question,
  answer,
  discipline,
  selfTest,
  materialText = '',
}) {
  const modeLine = selfTest
    ? '这是一次"先测后学"的自测：学生在没有参考资料的情况下凭记忆作答。回想时的吃力是正常的学习信号，不要把它说成失败。'
    : '这是一次日常练习，学生已经尽力作答。'
  const system = `${TUTOR_IDENTITY}

${modeLine}
${disciplineHint(discipline)}

${FEEDBACK_CRAFT}

反馈要落在三个地方：观点结构（他有没有把话说成一个整体）、理论运用（有没有用对本章概念）、表达逻辑（别人能不能跟上）。不必三个都平均用力，哪一处最值得说就多说一点。
${LEARNING_ETHICS}
${materialText ? `\n【本章课程材料】\n${materialText}\n\n判断"理论运用"时以上述材料的口径为准。` : ''}`
  const user = `章节：${chapter}\n题目：${question}\n学生作答：${answer}\n请给出反馈。`
  return { system, user, temperature: 0.4, maxTokens: 900 }
}

export function selfTestPrompt({
  chapter,
  count = 5,
  difficulty = '中等',
  discipline,
  materialText = '',
}) {
  const system = `${TUTOR_IDENTITY}

你要为「${chapter}」出一组单项选择题，用于检索练习（先测后学）。${disciplineHint(discipline)}

出题原则：
- 考"能不能从记忆里取出并区分"，不考死记硬背的数字和年份；
- 每题只有一个正确答案，三个干扰项要像"学生真的会犯的错"，而不是明显荒谬；
- 题干给一个具体情境或一个易混点，不要直接问定义；
- 解析只讲"为什么对、为什么错"，不超过 80 字；
- 难度：${difficulty}。
${materialText ? `\n【本章课程材料】\n${materialText}\n\n题目与解析不得超出上述材料；干扰项也不要编造材料里没有的理论。` : ''}

${jsonOnly(`{
  "questions": [
    {
      "stem": "题干",
      "options": ["A 选项", "B 选项", "C 选项", "D 选项"],
      "answerIndex": 0,
      "explanation": "解析",
      "concept": "本题考查的概念名",
      "chapter": "${chapter}"
    }
  ]
}`)}

一共 ${count} 题。不要输出任何 JSON 之外的内容。`
  return {
    system,
    user: `请为「${chapter}」生成 ${count} 道自测题。`,
    temperature: 0.6,
    maxTokens: 2600,
  }
}
