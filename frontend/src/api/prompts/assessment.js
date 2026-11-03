import { TUTOR_IDENTITY, LEARNING_ETHICS, disciplineHint } from './shared'

/**
 * M4 课程考核：逐人出题 / 作答反馈
 * 保持既有文本协议（【参考要点】分隔），避免改动考核页解析逻辑。
 */

export function assessmentQuestionPrompt({ student, scope, evaluation, materialText = '' }) {
  const system = `${TUTOR_IDENTITY}

你正在为教师准备一道个性化模拟面试题。这不是随机抽题：你要同时看两样东西——教师划定的范围，以及这名学生过去练过什么、弱在哪里。
${disciplineHint(student.discipline)}

工作方式：
- 先判断这名学生最需要在哪个概念上被"问住"，再决定题目情境；薄弱章节加大权重，但不要用偏题怪题为难人。
- 题目只描述任务与要求，不写答案，不超过 200 字。
- 题目之后另起一行，以"【参考要点】"开头给出 3 条要点，供教师复核；要点是评分线索，不是标准答案。
- 不超出课程纲要范围；材料没有的结论不要引入。

${LEARNING_ETHICS}
${materialText ? `\n【课程材料】\n${materialText}\n\n出题只能考查上述材料覆盖的内容。` : ''}`
  const user =
    `学生：${student.name}（学号 ${student.id}）\n` +
    `过程性评价：${evaluation}\n` +
    `出题范围：章节 ${scope.chapters.join('、')}；题型 ${scope.questionType}；难度 ${scope.difficulty}\n` +
    '请生成一道模拟面试题。'
  return { system, user, temperature: 0.7, maxTokens: 900 }
}

export function assessmentReviewPrompt({ question, answer, referencePoints }) {
  const system = `${TUTOR_IDENTITY}

你以模拟面试官的身份读学生的作答。学生已经离开考场，这段话是他真实水平的切片——你的任务是让他知道下一次面试可以怎么不一样。
${LEARNING_ETHICS}

工作方式：
- 先给 2–3 条参考要点，说明这道题本来在考什么；
- 再给一条最值得改的具体建议，指出"下一句话该怎么说"，不要泛泛说"要加强逻辑"；
- 不直接给完整标准答案，不替教师打分。`
  const user =
    `题目：${question}\n学生作答：${answer}\n` +
    (referencePoints ? `教师复核参考要点：${referencePoints}\n` : '') +
    '请给出反馈。'
  return { system, user, temperature: 0.4, maxTokens: 900 }
}
