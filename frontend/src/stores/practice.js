import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'ai-tutor-practice'

function safeGetItem(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key, value) {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/** 兼容旧记录：补齐 S1 新增字段 */
function normalizeRecord(r) {
  return {
    id: r.id || `p-${Date.now().toString(36)}`,
    createdAt: r.createdAt || new Date().toISOString(),
    studentId: r.studentId || '',
    studentName: r.studentName || '',
    chapter: r.chapter || '',
    type: r.type || '',
    question: r.question || '',
    answer: r.answer || '',
    feedback: r.feedback || '',
    mode: r.mode || 'practice',
    questionId: r.questionId || '',
    score: Number.isFinite(Number(r.score)) ? Number(r.score) : null,
    durationMs: Number.isFinite(Number(r.durationMs)) ? Number(r.durationMs) : 0,
    concepts: Array.isArray(r.concepts) ? r.concepts : [],
    traceId: r.traceId || '',
  }
}

function load() {
  const raw = safeGetItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list.map(normalizeRecord) : []
  } catch {
    return []
  }
}

/**
 * 一人一题·人人互动练习（M2）
 * 练习记录同时作为 M4 考核出题与 S2 学习画像的过程性输入
 */
export const usePracticeStore = defineStore('practice', () => {
  const records = ref(load())

  function persist() {
    safeSetItem(STORAGE_KEY, JSON.stringify(records.value))
  }

  /** 新增一条练习记录（AI 反馈到位后写入） */
  function add(record) {
    const item = normalizeRecord({
      id: `p-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      ...record,
    })
    records.value.unshift(item)
    persist()
    return item
  }

  function myRecords(studentId) {
    return records.value.filter((r) => r.studentId === studentId)
  }

  /** 章节练习覆盖：{ 章节: 次数 } */
  function chapterCounts(studentId) {
    const map = {}
    myRecords(studentId).forEach((r) => {
      if (!r.chapter) return
      map[r.chapter] = (map[r.chapter] || 0) + 1
    })
    return map
  }

  /** 最近一次练习距今天数（无记录返回 null） */
  function daysSinceLast(studentId) {
    const mine = myRecords(studentId)
    if (!mine.length) return null
    const last = new Date(mine[0].createdAt).getTime()
    if (Number.isNaN(last)) return null
    return Math.floor((Date.now() - last) / 86400000)
  }

  /** 过程性评价摘要：供考核出题提示词使用 */
  function evaluationSummary(studentId) {
    const mine = myRecords(studentId)
    if (!mine.length) return '暂无练习记录'
    const byChapter = chapterCounts(studentId)
    const total = mine.length
    const recent = mine.slice(0, 3).map((r) => r.chapter)
    return `已完成 ${total} 次一人一题练习；练习分布：${Object.entries(byChapter)
      .map(([ch, n]) => `${ch} ${n} 次`)
      .join('、')}；最近练习章节：${recent.join('、')}`
  }

  function resetAll() {
    records.value = []
    persist()
  }

  return {
    records,
    add,
    myRecords,
    chapterCounts,
    daysSinceLast,
    evaluationSummary,
    resetAll,
  }
})
