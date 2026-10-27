import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { MOCK_USERS, MOCK_STUDENTS, DISCIPLINE_OPTIONS } from '@/mock/data'

const STORAGE_KEY = 'ai-tutor-user'

/**
 * file:// 协议下部分浏览器会禁用 localStorage，直接访问会抛异常导致登录失败。
 * 这里统一包一层，失败时静默降级为仅内存保存（当前会话内有效）。
 */
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

function loadFromStorage() {
  const raw = safeGetItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const ROLE_LABEL = {
  admin: '超级管理员',
  teacher: '教师',
  ta: '助教',
  student: '学生',
}

export { DISCIPLINE_OPTIONS }

export const useUserStore = defineStore('user', () => {
  const cached = loadFromStorage()

  const user = ref(cached)
  // 竞赛阶段后端未就绪时，用本地假数据登录，便于前端并行开发
  const useMock = ref(true)

  const isLogin = computed(() => !!user.value)
  const role = computed(() => user.value?.role || '')
  const roleLabel = computed(() => ROLE_LABEL[role.value] || '未登录')
  const name = computed(() => user.value?.name || '')

  /**
   * 学科背景（M5 差异化引擎的输入）
   * 旧登录态可能没有该字段，回退到名单数据里查
   */
  const discipline = computed(() => {
    const own = user.value?.discipline
    if (own) return own
    const id = user.value?.id
    const found =
      MOCK_USERS.find((u) => u.id === id) || MOCK_STUDENTS.find((s) => s.id === id)
    return found?.discipline || ''
  })

  const isStudent = computed(() => role.value === 'student')

  function login(payload) {
    user.value = payload
    safeSetItem(STORAGE_KEY, JSON.stringify(payload))
  }

  /** 更新当前登录用户的学科背景（学生自助设置，立即持久化） */
  function setDiscipline(value) {
    if (!user.value) return
    user.value = { ...user.value, discipline: value }
    safeSetItem(STORAGE_KEY, JSON.stringify(user.value))
  }

  /**
   * 登录入口：useMock 为真时查本地假用户，否则调后端接口
   * @param {string} username 学号或工号
   * @param {string} password 密码
   */
  async function loginByUsername(username, password) {
    if (useMock.value) {
      const found = MOCK_USERS.find(
        (u) => u.username === username && u.password === password,
      )
      if (!found) throw new Error('账号或密码错误（当前为仿真数据模式）')
      const { password: _ignored, ...profile } = found
      login(profile)
      return profile
    }

    const { post } = await import('@/api/request')
    const data = await post('/auth/login', { username, password })
    if (data.token) safeSetItem('ai-tutor-token', data.token)
    login(data.user)
    return data.user
  }

  function logout() {
    user.value = null
    safeRemoveItem(STORAGE_KEY)
    safeRemoveItem('ai-tutor-token')
  }

  function setMockMode(enabled) {
    useMock.value = enabled
  }

  return {
    user,
    useMock,
    isLogin,
    role,
    roleLabel,
    name,
    discipline,
    isStudent,
    login,
    setDiscipline,
    loginByUsername,
    logout,
    setMockMode,
  }
})
