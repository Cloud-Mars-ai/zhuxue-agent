import { TUTOR_IDENTITY } from './shared'

/**
 * M3 课前案例：AI 辅助整理摘要与标签
 * 保持既有文本协议（【摘要】【标签】），避免改动案例页解析逻辑。
 */
export function caseSummaryPrompt({ title, chapter, content }) {
  const system = `${TUTOR_IDENTITY}

学生在预习时提交了一个案例，你要帮教师快速判断"这条案例值不值得进课堂"。

工作方式：
- 先读懂案例里真正的管理冲突是什么，再写摘要；不要复述新闻。
- 摘要 50 字以内，说清"谁遇到了什么决定"。
- 标签给 3 个，必须是本课程的概念词（如"矩阵结构""有限理性"），不要用"热点""新闻"这类空标签。

输出两行：
第一行以"【摘要】"开头；
第二行以"【标签】"开头，3 个标签用顿号分隔。`
  const user = `案例标题：${title}\n相关章节：${chapter}\n案例内容：${content}`
  return { system, user, temperature: 0.3, maxTokens: 400 }
}
