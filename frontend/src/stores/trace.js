import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 学习轨迹（AI-Human Trace）
 *
 * 只追加、不修改。记录"这条 AI 输出依据什么"：
 * 题目 / 章节 / 提示词版本 / 模型 / 耗时 / 引用的材料 ID。
 * 不存全文，避免 localStorage 膨胀；正文仍由各自的业务 store 保存。
 */

const STORAGE_KEY = 'ai-tutor-trace'
const MAX_RECORDS = 500

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

/** 轻量哈希：只用于比对输入/输出是否变化，不做安全用途 */
export function hashText(text) {
  const s = String(text || '')
  let h = 5381
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 33) ^ s.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

export const useTraceStore = defineStore('trace', () => {
  const records = ref(load())

  function persist() {
    safeSet(STORAGE_KEY, JSON.stringify(records.value))
  }

  /**
   * 追加一条轨迹
   * @param {Object} record
   * @param {string} record.kind  practice / assessment / case / selftest / cheatsheet / diagnosis / chat
   * @param {string} [record.task] 具体任务名
   * @param {Object} [record.refs] 关联的题目、章节、材料、画像版本
   */
  function add(record) {
    const item = {
      id: `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      studentId: '',
      kind: 'chat',
      task: '',
      refs: {},
      promptVersion: '',
      model: '',
      latencyMs: 0,
      ok: true,
      error: '',
      inputHash: '',
      outputHash: '',
      ...record,
    }
    records.value.unshift(item)
    if (records.value.length > MAX_RECORDS) {
      records.value = records.value.slice(0, MAX_RECORDS)
    }
    persist()
    return item
  }

  function recent(limit = 20) {
    return records.value.slice(0, limit)
  }

  function byKind(kind) {
    return records.value.filter((r) => r.kind === kind)
  }

  function findById(id) {
    return records.value.find((r) => r.id === id) || null
  }

  function clear() {
    records.value = []
    persist()
  }

  return { records, add, recent, byKind, findById, clear }
})
