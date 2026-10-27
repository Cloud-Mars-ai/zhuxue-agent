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

function load() {
  const raw = safeGetItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/**
 * 一人一题·人人互动练习（M2）
 * 练习记录同时作为 M4 考核出题的过程性评价输入
 */
export const usePracticeStore = defineStore('practice', () => {
  const records = ref(load())

  function persist() {
    safeSetItem(STORAGE_KEY, JSON.stringify(records.value))
  }

  /** 新增一条练习记录（AI 反馈到位后写入） */
  function add(record) {
    const item = {
      id: `p-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      studentId: '',
      studentName: '',
      chapter: '',
      type: '',
      question: '',
      answer: '',
      feedback: '',
      ...record,
    }
    records.value.unshift(item)
    persist()
    return item
  }

  function myRecords(studentId) {
    return records.value.filter((r) => r.studentId === studentId)
  }

  /** 过程性评价摘要：供考核出题提示词使用 */
  function evaluationSummary(studentId) {
    const mine = myRecords(studentId)
    if (!mine.length) return '暂无练习记录'
    const byChapter = {}
    mine.forEach((r) => {
      byChapter[r.chapter] = (byChapter[r.chapter] || 0) + 1
    })
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

  return { records, add, myRecords, evaluationSummary, resetAll }
})
