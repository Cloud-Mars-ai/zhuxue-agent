import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 访问日志（本地留存）
 *
 * 设计原则（隐私优先）：
 * - 只记录「谁、在什么时间、做了什么动作、落在哪个页面」这类元信息；
 * - 每条记录的 detail 具体内容仅写入本机 localStorage，不上传任何服务器；
 * - 容量有上限（MAX_EVENTS），超出后丢弃最旧记录，避免占满浏览器存储；
 * - file:// 协议下 localStorage 可能不可用，统一降级为仅内存（本次会话有效）。
 */

const STORAGE_KEY = 'ai-tutor-access-log'
export const MAX_EVENTS = 500

export const EVENT_LABELS = {
  login: '登录',
  logout: '登出',
  page_view: '页面访问',
}

export const EVENT_TYPES = Object.keys(EVENT_LABELS)

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

function safeRemoveItem(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // 忽略：无法持久化不影响本次使用
  }
}

function loadEvents() {
  const raw = safeGetItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_EVENTS) : []
  } catch {
    return []
  }
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const useAccessLogStore = defineStore('accessLog', () => {
  const events = ref(loadEvents())

  /**
   * 记录一条日志
   * @param {string} type 事件类型（EVENT_LABELS 的键）
   * @param {object} payload
   *   - user   当前用户快照 { id, name, role }；未登录传 null
   *   - path   页面路径
   *   - title  页面标题
   *   - detail 具体内容（仅本地留存，自由结构）
   */
  function record(type, payload = {}) {
    const entry = {
      id: makeId(),
      type,
      at: new Date().toISOString(),
      userId: payload.user?.id || 'anonymous',
      userName: payload.user?.name || '游客',
      userRole: payload.user?.role || '',
      path: payload.path || '',
      title: payload.title || '',
      detail: payload.detail || null,
    }
    events.value = [entry, ...events.value].slice(0, MAX_EVENTS)
    persist()
    return entry
  }

  function persist() {
    safeSetItem(STORAGE_KEY, JSON.stringify(events.value))
  }

  function clear() {
    events.value = []
    safeRemoveItem(STORAGE_KEY)
  }

  /** 导出为 JSON 文件下载（内容同样只去用户本地） */
  function exportJson(filename) {
    const blob = new Blob([JSON.stringify(events.value, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `access-log-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const total = computed(() => events.value.length)
  const loginCount = computed(() => events.value.filter((e) => e.type === 'login').length)

  const todayCount = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return events.value.filter((e) => e.at.slice(0, 10) === today).length
  })

  const lastLoginAt = computed(
    () => events.value.find((e) => e.type === 'login')?.at || '',
  )

  return {
    events,
    record,
    clear,
    exportJson,
    total,
    loginCount,
    todayCount,
    lastLoginAt,
  }
})
