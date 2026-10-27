import { defineStore } from 'pinia'
import { ref } from 'vue'
import { MOCK_CASES } from '@/mock/data'

const STORAGE_KEY = 'ai-tutor-cases'

// file:// 协议下部分浏览器会禁用 localStorage，包一层静默降级
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
  if (!raw) return MOCK_CASES.map((c) => ({ ...c }))
  try {
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : MOCK_CASES.map((c) => ({ ...c }))
  } catch {
    return MOCK_CASES.map((c) => ({ ...c }))
  }
}

function persist(list) {
  safeSetItem(STORAGE_KEY, JSON.stringify(list))
}

let seq = 0
function nextId() {
  seq += 1
  return `c-${Date.now().toString(36)}-${seq}`
}

/**
 * 课前案例征集与课堂选用（M3）
 * status: pending 待选用 / selected 已选为本节课案例 / rejected 已驳回
 */
export const useCasesStore = defineStore('cases', () => {
  const cases = ref(load())

  function submit(payload) {
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const record = {
      id: nextId(),
      title: '',
      chapter: '',
      link: '',
      summary: '',
      reason: '',
      tags: [],
      submitter: '',
      discipline: '',
      status: 'pending',
      createdAt: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
      ...payload,
    }
    cases.value.unshift(record)
    persist(cases.value)
    return record
  }

  /** 选为本节课案例（同时把其它已选案例取消，保证课堂案例唯一） */
  function select(id) {
    cases.value = cases.value.map((c) => ({
      ...c,
      status: c.id === id ? 'selected' : c.status === 'selected' ? 'pending' : c.status,
    }))
    persist(cases.value)
  }

  function reject(id) {
    cases.value = cases.value.map((c) =>
      c.id === id ? { ...c, status: 'rejected' } : c,
    )
    persist(cases.value)
  }

  /** 当前选用的课堂案例 */
  function currentCase() {
    return cases.value.find((c) => c.status === 'selected') || null
  }

  function myCases(studentId) {
    return cases.value.filter((c) => c.submitterId === studentId)
  }

  function resetAll() {
    cases.value = MOCK_CASES.map((c) => ({ ...c }))
    persist(cases.value)
  }

  return { cases, submit, select, reject, currentCase, myCases, resetAll }
})
