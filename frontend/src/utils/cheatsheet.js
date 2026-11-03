import { COURSE_OUTLINE, getOutlineChapters } from '@/mock/courseOutline'

/**
 * 本地速查表生成（模型失败或离线演示时使用）
 * 规则：按教学主题重组，不按章节顺序；每条带来源章节。
 */

const THEME_MAP = [
  {
    name: '管理基础与理论演进',
    chapters: [1, 2],
    note: '先建立"管理是什么"，再看理论如何一步步演进。',
  },
  { name: '决策与计划', chapters: [3], note: '决策是计划的前提，计划是决策的落地。' },
  { name: '组织设计与变革', chapters: [4], note: '结构跟着战略走，变革跟着环境走。' },
  { name: '领导与激励', chapters: [5], note: '领导靠影响力，激励靠满足需要。' },
  { name: '控制与控制过程', chapters: [6], note: '控制不是监视，是保证计划落地。' },
]

/** 生成结构化速查表 */
export function buildLocalCheatsheet(chapterTitles = []) {
  const selected = getOutlineChapters(chapterTitles)
  const ids = new Set(selected.map((c) => c.id))
  return THEME_MAP.filter((t) => t.chapters.some((id) => ids.has(id))).map((theme) => ({
    name: theme.name,
    points: theme.chapters
      .filter((id) => ids.has(id))
      .flatMap((id) => COURSE_OUTLINE.find((c) => c.id === id)?.keyPoints || [])
      .map((p) => ({
        term: p.term,
        definition: p.definition,
        examTip: p.examTip,
        priority: !!p.priority,
        source: COURSE_OUTLINE.find((c) => c.keyPoints.includes(p))?.title || '',
      })),
  }))
}

/** 转成可复制的纯文本（打印/导出用） */
export function cheatsheetToText(topics = []) {
  return topics
    .map(
      (t) =>
        `【${t.name}】\n` +
        t.points
          .map((p) => `· ${p.term}：${p.definition}${p.examTip ? `（考点：${p.examTip}）` : ''}`)
          .join('\n'),
    )
    .join('\n\n')
}
