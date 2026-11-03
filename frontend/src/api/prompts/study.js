import { TUTOR_IDENTITY, jsonOnly, disciplineHint } from './shared'

/**
 * 学习支持类任务：速查表 / 盲区诊断叙述 / 学习路径（后续）
 */

export function cheatsheetPrompt({ chapters, outlineText, layout, focus }) {
  const layoutLine =
    layout === 'print'
      ? '这份是打印版，学生要带到考场外候考时看，信息密度优先。'
      : '这份是屏幕阅读版，学生会在手机上快速过一遍。'
  const focusLine = focus
    ? `学生特别担心的是：${focus}。在不偏离材料的前提下，相关知识点可以多给一句提示。`
    : ''
  const system = `${TUTOR_IDENTITY}

你要为学生做一份「${chapters.join('、')}」的备考速查表。${layoutLine}${focusLine}

工作方式：
- 考试按主题考，不按章节顺序考。先决定这份速查表应该分成哪几个主题（例如"计划与决策""组织与结构"），再把知识点挂进去。
- 每个知识点一行：概念名 + 一句话定义 + 一句考点提示。定义要能独立读懂，不要写"如上所述"。
- 重点内容标 priority: true，总数不超过 12 条；全表不超过 40 条。
- 只使用给定课程材料；材料没有的概念不要补。
- source 填章节标题（如"第4章 组织设计与组织变革"），不要编页码。

${jsonOnly(`{
  "topics": [
    {
      "name": "主题名",
      "points": [
        {
          "term": "概念名",
          "definition": "一句话定义",
          "examTip": "考点提示",
          "priority": true,
          "source": "第X章 章节名"
        }
      ]
    }
  ]
}`)}

不要输出 JSON 之外的内容。`
  const user = `课程材料：\n${outlineText}\n\n请生成速查表。`
  return { system, user, temperature: 0.4, maxTokens: 4200 }
}

export function diagnosisNarrativePrompt({ studentName, gaps, stats }) {
  const system = `${TUTOR_IDENTITY}

你读到的是这名学生最近的学习数据。请写一段 100 字以内的诊断叙述，帮他理解"劲该往哪使"。

要求：
- 先承认他已经做了什么，再指出最值得优先处理的一处；
- 必须引用具体数据（章节、次数、正确率），不要空泛；
- 语气客观，不评判人，不用"你应该"；
- 只输出正文，不要标题、不要 JSON。`
  const user =
    `学生：${studentName}\n` +
    `学习统计：${stats}\n` +
    `已识别盲区：\n${gaps.map((g) => `- ${g.chapter}｜${g.type}｜${g.evidence}`).join('\n')}`
  return { system, user, temperature: 0.4, maxTokens: 400 }
}

export function learnPathPrompt({ chapter, goal, personaSummary, outlineText }) {
  const system = `${TUTOR_IDENTITY}

你要带这名学生走完「${chapter}」的一次短学习路径。
学生情况：${personaSummary}
本次目标：${goal}
${disciplineHint('')}

工作方式：
- 先判断他缺的是"没建立框架"还是"概念混淆"还是"不会用"，再决定路径怎么排。
- 只排 3–5 站；每站能在 3 分钟内完成。
- 站点类型只能是：concept（讲解）/ quiz（自测）/ case（案例）/ recap（小结）。
- 如果上一站是 quiz，下一站 concept 要针对可能出错的概念重讲。

${jsonOnly(`{
  "stations": [
    { "type": "concept", "focus": "本站在解决什么", "outline": "讲解要点，2-3 句" }
  ]
}`)}

不要输出 JSON 之外的内容。`
  const user = `章节材料：\n${outlineText}\n请生成学习路径。`
  return { system, user, temperature: 0.6, maxTokens: 1200 }
}
