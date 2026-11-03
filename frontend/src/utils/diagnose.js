import { COURSE } from '@/mock/data'
import { getOutlineByTitle } from '@/mock/courseOutline'

/**
 * 盲区诊断（本地规则，零模型依赖）
 *
 * 输出三类问题：
 * - 零覆盖：从未练习、未自测
 * - 低表现：自测正确率低于 60%
 * - 概念盲点：同一概念反复出错
 *
 * 每条都必须带 evidence（具体数据），否则不出现在报告里。
 */

const TYPE_LABEL = {
  zero: '零覆盖',
  low: '低表现',
  concept: '概念盲点',
}

function chapterProgress(title) {
  return COURSE.chapters.find((c) => c.title === title)?.progress ?? 0
}

export function diagnoseGaps({ persona, studentName = '同学' }) {
  if (!persona?.masteryList) return { gaps: [], stats: {}, summary: '' }

  const gaps = []

  persona.masteryList.forEach((m) => {
    const progress = chapterProgress(m.chapter)
    if (m.practiceCount === 0 && m.total === 0) {
      // 尚未开讲的章节不算"盲区"，避免把正常进度当成问题
      if (progress === 0) return
      gaps.push({
        chapter: m.chapter,
        type: 'zero',
        typeLabel: TYPE_LABEL.zero,
        evidence: `本章已讲到 ${progress}%，但练习 0 次、自测 0 题`,
        risk: 78,
        suggestion: '先用 5 题摸底，再决定补哪一节',
      })
    } else if (m.total >= 3 && m.accuracy < 60) {
      gaps.push({
        chapter: m.chapter,
        type: 'low',
        typeLabel: TYPE_LABEL.low,
        evidence: `自测 ${m.total} 题，正确 ${m.correct} 题（${m.accuracy}%）`,
        risk: 60 + (60 - m.accuracy),
        suggestion: '重做错题所在小节，再做一组同章自测',
      })
    }

    ;(m.weakPoints || []).forEach((w) => {
      if (w.wrong >= 2) {
        gaps.push({
          chapter: m.chapter,
          type: 'concept',
          typeLabel: TYPE_LABEL.concept,
          evidence: `「${w.term}」累计答错 ${w.wrong} 次`,
          risk: 55 + w.wrong * 8,
          suggestion: `回到「${w.term}」的定义与考点，用自己的话复述一遍`,
        })
      }
    })
  })

  gaps.sort((a, b) => b.risk - a.risk)

  const stats = {
    attempts: persona.behavior?.practiceCount || 0,
    selfTestQuestions: persona.behavior?.totalQuestions || 0,
    accuracy: persona.behavior?.accuracy || 0,
    activeDays: persona.behavior?.activeDays || 0,
    gapCount: gaps.length,
    zeroCount: gaps.filter((g) => g.type === 'zero').length,
    lowCount: gaps.filter((g) => g.type === 'low').length,
    conceptCount: gaps.filter((g) => g.type === 'concept').length,
  }

  const summary = gaps.length
    ? `${studentName}，当前有 ${gaps.length} 处值得优先处理：${gaps
        .slice(0, 2)
        .map((g) => `${g.chapter.replace(/^第\d+章\s*/, '')}（${g.typeLabel}）`)
        .join('、')}。先把最靠前的一处补上，比平均用力更划算。`
    : '目前没有明显盲区。可以继续做跨章节自测，保持检索练习的节奏。'

  return { gaps, stats, summary }
}

/** 按章节取盲区（学习体检与路径入口用） */
export function gapsOfChapter(gaps, chapter) {
  return gaps.filter((g) => g.chapter === chapter)
}

/** 该章节的概念清单（诊断报告展开用） */
export function conceptsOfChapter(chapter) {
  return getOutlineByTitle(chapter)?.keyPoints.map((p) => p.term) || []
}

export { TYPE_LABEL }
