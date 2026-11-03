import { getOutlineByTitle, getOutlineChapters } from '@/mock/courseOutline'

/**
 * 本地自测题生成（模型失败或离线演示时使用）
 *
 * 做法：用"概念—定义匹配"生成单选题，干扰项取其他章节的定义。
 * 不是完美题目，但能保证离线也有题可做、可判分、可诊断。
 */

function rotate(list, offset) {
  if (!list.length) return []
  const i = ((offset % list.length) + list.length) % list.length
  return list.slice(i).concat(list.slice(0, i))
}

export function buildLocalQuestions({ chapters = [], count = 5 } = {}) {
  const selected = getOutlineChapters(chapters)
  const pool = selected.flatMap((c) =>
    c.keyPoints.map((p) => ({ ...p, chapter: c.title })),
  )
  // 干扰项从全课程取，避免"同章三项都像对"
  const globalPool = getOutlineChapters([]).flatMap((c) =>
    c.keyPoints.map((p) => ({ ...p, chapter: c.title })),
  )
  const questions = []
  const total = Math.min(count, pool.length)

  for (let i = 0; i < total; i += 1) {
    const point = pool[i]
    const poolOthers = (globalPool.length ? globalPool : pool).filter(
      (p) => p.term !== point.term,
    )
    const rotated = rotate(poolOthers, i * 3 + 1)
    const distractors = rotated.slice(0, 3)
    if (distractors.length < 3) continue

    const options = [point.definition, ...distractors.map((d) => d.definition)]
    const answerIndex = i % 4
    // 把正确答案放到 answerIndex 位置
    const [correct] = options.splice(0, 1)
    options.splice(answerIndex, 0, correct)

    questions.push({
      id: `local-${i + 1}`,
      stem: `关于「${point.term}」，下列哪一项最符合课程材料的表述？`,
      options,
      answerIndex,
      explanation: `${point.term}：${point.definition}${point.examTip ? ` 考点：${point.examTip}` : ''}`,
      concept: point.term,
      chapter: point.chapter,
    })
  }
  return questions
}

/** 取某章节的概念清单（诊断用） */
export function conceptsOf(chapterTitle) {
  const c = getOutlineByTitle(chapterTitle)
  return c ? c.keyPoints.map((p) => p.term) : []
}
