import { defineStore } from 'pinia'
import { computed } from 'vue'
import { COURSE } from '@/mock/data'
import { COURSE_OUTLINE } from '@/mock/courseOutline'
import { useUserStore } from '@/stores/user'
import { usePracticeStore } from '@/stores/practice'
import { useSelfTestStore } from '@/stores/selftest'
import { useCasesStore } from '@/stores/cases'
import { useAssessmentStore } from '@/stores/assessment'
import { hashText } from '@/stores/trace'

/**
 * 学习者画像（Learner's Persona）
 *
 * 只读派生，不反向写入源 store，避免循环依赖。
 * 数据源：练习记录（M2）、章节自测（S1-2）、案例（M3）、考核（M4）、学科背景（M5）。
 */

const LEVELS = ['未开始', '已尝试', '熟悉', '熟练', '已掌握']

function levelOf({ practiceCount, total, accuracy }) {
  if (!practiceCount && !total) return '未开始'
  if (total < 3) return '已尝试'
  if (accuracy >= 90 && total >= 10) return '已掌握'
  if (accuracy >= 78 && total >= 5) return '熟练'
  if (accuracy >= 60) return '熟悉'
  return '已尝试'
}

export const usePersonaStore = defineStore('persona', () => {
  const userStore = useUserStore()
  const practiceStore = usePracticeStore()
  const selfTestStore = useSelfTestStore()
  const casesStore = useCasesStore()
  const assessmentStore = useAssessmentStore()

  const studentId = computed(() => userStore.user?.id || '')

  const data = computed(() => {
    const sid = studentId.value
    const practiceCounts = practiceStore.chapterCounts(sid)
    const chapterStats = selfTestStore.chapterStats(sid)
    const conceptErrors = selfTestStore.conceptErrors(sid)
    const mySessions = selfTestStore.mySessions(sid)
    const myPractices = practiceStore.myRecords(sid)

    const mastery = {}
    COURSE_OUTLINE.forEach((c) => {
      const practiceCount = practiceCounts[c.title] || 0
      const st = chapterStats[c.title] || { total: 0, correct: 0, accuracy: 0 }
      const weakPoints = Object.entries(conceptErrors)
        .filter(([term]) => c.keyPoints.some((p) => p.term === term))
        .sort((a, b) => b[1] - a[1])
        .map(([term, n]) => ({ term, wrong: n }))
      mastery[c.title] = {
        chapter: c.title,
        short: c.title.replace(/^第\d+章\s*/, ''),
        practiceCount,
        total: st.total,
        correct: st.correct,
        accuracy: st.accuracy,
        level: levelOf({ practiceCount, total: st.total, accuracy: st.accuracy }),
        levelIndex: LEVELS.indexOf(
          levelOf({ practiceCount, total: st.total, accuracy: st.accuracy }),
        ),
        weakPoints,
      }
    })

    // 兴趣：案例标签 + 提交章节
    const interests = {}
    casesStore.cases
      .filter((c) => c.submitterId === sid || c.submitter === userStore.name)
      .forEach((c) => {
        ;(c.tags || []).forEach((t) => {
          interests[t] = (interests[t] || 0) + 1
        })
      })

    // 考核记录
    const visible = assessmentStore.visibleItemsFor(sid)
    const answered = visible.filter((v) => v.item.answer)
    const scored = visible.filter((v) => Number.isFinite(Number(v.item.teacherScore)))

    const totalQuestions = mySessions.reduce((n, s) => n + (s.total || 0), 0)
    const totalCorrect = mySessions.reduce((n, s) => n + (s.correct || 0), 0)
    const activeDates = new Set(
      [...myPractices, ...mySessions].map((r) => String(r.createdAt).slice(0, 10)),
    )

    const behavior = {
      practiceCount: myPractices.length,
      selfTestCount: mySessions.length,
      totalQuestions,
      totalCorrect,
      accuracy: totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      activeDays: activeDates.size,
      lastActiveAt:
        [...myPractices, ...mySessions]
          .map((r) => r.createdAt)
          .sort()
          .reverse()[0] || '',
      assessmentAnswered: answered.length,
      assessmentScored: scored.length,
    }

    const weakChapters = Object.values(mastery)
      .filter((m) => m.total > 0 && m.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .map((m) => m.chapter)

    return {
      profile: {
        studentId: sid,
        name: userStore.name,
        discipline: userStore.discipline,
        course: COURSE.name,
      },
      mastery,
      masteryList: COURSE_OUTLINE.map((c) => mastery[c.title]),
      interests,
      behavior,
      weakChapters,
      conceptErrors,
      levels: LEVELS,
      updatedAt: new Date().toISOString(),
    }
  })

  const version = computed(() =>
    hashText(
      JSON.stringify({
        m: Object.values(data.value.mastery).map((m) => [m.chapter, m.practiceCount, m.total, m.accuracy]),
        b: data.value.behavior,
      }),
    ),
  )

  /** 给提示词用的摘要（不超过 300 字） */
  const summary = computed(() => {
    const p = data.value
    const mastered = p.masteryList.filter((m) => m.levelIndex >= 3).map((m) => m.short)
    const weak = p.masteryList.filter((m) => m.total > 0 && m.accuracy < 60).map((m) => m.short)
    const untouched = p.masteryList.filter((m) => m.level === '未开始').map((m) => m.short)
    const topErrors = Object.entries(p.conceptErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t, n]) => `${t}（错 ${n} 次）`)
    return [
      p.profile.discipline ? `学科背景：${p.profile.discipline}` : '',
      mastered.length ? `已较熟：${mastered.join('、')}` : '',
      weak.length ? `薄弱章节：${weak.join('、')}` : '',
      untouched.length ? `尚未开始：${untouched.join('、')}` : '',
      topErrors.length ? `易错概念：${topErrors.join('、')}` : '',
      `练习 ${p.behavior.practiceCount} 次，自测 ${p.behavior.totalQuestions} 题（正确率 ${p.behavior.accuracy}%）`,
    ]
      .filter(Boolean)
      .join('；')
  })

  function weakPointsOf(chapter) {
    return data.value.mastery[chapter]?.weakPoints || []
  }

  function reset() {
    practiceStore.resetAll()
    selfTestStore.resetAll()
  }

  return {
    data,
    version,
    summary,
    levels: LEVELS,
    weakPointsOf,
    reset,
  }
})
