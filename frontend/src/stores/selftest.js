import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'ai-tutor-selftest'

function safeGet(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function load() {
  const raw = safeGet(STORAGE_KEY)
  if (!raw) return []
  try {
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/**
 * 章节自测（S1-2 先测后学）
 *
 * 一次 session = 一组题 + 作答 + 判分结果。
 * 判分在本地完成（单选题），不依赖模型；模型只负责出题与解析。
 */
export const useSelfTestStore = defineStore('selftest', () => {
  const sessions = ref(load())

  function persist() {
    safeSet(STORAGE_KEY, JSON.stringify(sessions.value))
  }

  /**
   * @param {Object} payload
   * @param {string} payload.studentId
   * @param {string} payload.studentName
   * @param {Array<string>} payload.chapters
   * @param {Array} payload.questions
   * @param {Object} payload.answers  { [questionId]: optionIndex }
   * @param {number} payload.durationMs
   * @param {boolean} payload.fallback
   */
  function addSession(payload) {
    const questions = Array.isArray(payload.questions) ? payload.questions : []
    const answers = payload.answers || {}
    let correct = 0
    const wrongConcepts = []
    const conceptStats = {}

    questions.forEach((q) => {
      const picked = answers[q.id]
      const isCorrect = Number(picked) === Number(q.answerIndex)
      if (isCorrect) correct += 1
      const key = q.concept || '未标注概念'
      if (!conceptStats[key]) conceptStats[key] = { total: 0, correct: 0 }
      conceptStats[key].total += 1
      if (isCorrect) conceptStats[key].correct += 1
      else if (!wrongConcepts.includes(key)) wrongConcepts.push(key)
    })

    const session = {
      id: `st-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      studentId: payload.studentId || '',
      studentName: payload.studentName || '',
      chapters: payload.chapters || [],
      questions,
      answers,
      total: questions.length,
      correct,
      accuracy: questions.length ? Math.round((correct / questions.length) * 100) : 0,
      wrongConcepts,
      conceptStats,
      durationMs: payload.durationMs || 0,
      fallback: !!payload.fallback,
    }
    sessions.value.unshift(session)
    persist()
    return session
  }

  function mySessions(studentId) {
    return sessions.value.filter((s) => s.studentId === studentId)
  }

  function latest(studentId) {
    return mySessions(studentId)[0] || null
  }

  /** 按章节汇总：{ 章节: { total, correct, accuracy } } */
  function chapterStats(studentId) {
    const map = {}
    mySessions(studentId).forEach((s) => {
      s.questions.forEach((q) => {
        const ch = q.chapter || s.chapters[0] || '未标注章节'
        if (!map[ch]) map[ch] = { total: 0, correct: 0, accuracy: 0 }
        map[ch].total += 1
        if (Number(s.answers[q.id]) === Number(q.answerIndex)) map[ch].correct += 1
      })
    })
    Object.values(map).forEach((v) => {
      v.accuracy = v.total ? Math.round((v.correct / v.total) * 100) : 0
    })
    return map
  }

  /** 概念错误统计：{ 概念: 错误次数 } */
  function conceptErrors(studentId) {
    const map = {}
    mySessions(studentId).forEach((s) => {
      s.questions.forEach((q) => {
        if (Number(s.answers[q.id]) !== Number(q.answerIndex)) {
          const key = q.concept || '未标注概念'
          map[key] = (map[key] || 0) + 1
        }
      })
    })
    return map
  }

  function resetAll() {
    sessions.value = []
    persist()
  }

  return {
    sessions,
    addSession,
    mySessions,
    latest,
    chapterStats,
    conceptErrors,
    resetAll,
  }
})
