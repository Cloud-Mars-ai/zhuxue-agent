import axios from 'axios'
import { ElMessage } from 'element-plus'

const TOKEN_KEY = 'ai-tutor-token'

// file:// 协议下 localStorage 可能被禁用，读写失败时静默降级
function readToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // 忽略
  }
}

const service = axios.create({
  // 走 Vite 代理，生产部署时由 Nginx 转发同一前缀
  baseURL: '/api',
  timeout: 30000,
})

service.interceptors.request.use((config) => {
  const token = readToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

service.interceptors.response.use(
  (response) => {
    const body = response.data
    // 约定后端统一返回 { code, message, data }；code 为 0 视为成功
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) return body.data
      ElMessage.error(body.message || '请求失败')
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    return body
  },
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      clearToken()
    } else if (status === 403) {
      ElMessage.error('没有该操作的权限')
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络或后端服务')
    } else {
      ElMessage.error(error.response?.data?.message || '网络异常，请稍后重试')
    }
    return Promise.reject(error)
  },
)

export const get = (url, params, config) => service.get(url, { params, ...config })
export const post = (url, data, config) => service.post(url, data, config)
export const put = (url, data, config) => service.put(url, data, config)
export const del = (url, config) => service.delete(url, config)

export default service
