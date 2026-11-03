import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'ai-tutor-cheatsheets'
const MAX_RECORDS = 20

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

/** 章节速查表（备考专栏） */
export const useCheatsheetStore = defineStore('cheatsheets', () => {
  const sheets = ref(load())

  function persist() {
    safeSet(STORAGE_KEY, JSON.stringify(sheets.value))
  }

  function save({ studentId, chapters, topics, layout, fallback }) {
    const item = {
      id: `cs-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      studentId: studentId || '',
      chapters: chapters || [],
      topics: topics || [],
      layout: layout || 'screen',
      fallback: !!fallback,
    }
    sheets.value.unshift(item)
    if (sheets.value.length > MAX_RECORDS) sheets.value = sheets.value.slice(0, MAX_RECORDS)
    persist()
    return item
  }

  function latest(studentId) {
    return sheets.value.find((s) => !studentId || s.studentId === studentId) || null
  }

  function byChapters(chapters = []) {
    const key = [...chapters].sort().join('|')
    return (
      sheets.value.find((s) => [...(s.chapters || [])].sort().join('|') === key) || null
    )
  }

  function remove(id) {
    sheets.value = sheets.value.filter((s) => s.id !== id)
    persist()
  }

  function resetAll() {
    sheets.value = []
    persist()
  }

  return { sheets, save, latest, byChapters, remove, resetAll }
})
