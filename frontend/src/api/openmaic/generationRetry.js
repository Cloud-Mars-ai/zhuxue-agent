/**
 * 生成重试（移植自 @openmaic/generation/src/generation-retry.ts）。
 *
 * 指数退避 + 20% 抖动；可重试判定与上游一致：
 * - AbortError 永不重试
 * - 显式 isRetryable 字段优先
 * - 状态码 408/409/425/429 与 5xx 可重试；400/401/403/404/422 不可
 * - 嵌套 error/cause/errors 递归判定
 * - 消息含 rate limit/timeout/network 等模式可重试
 * - shouldRetryResult 支持「空结果」重试
 *
 * 硬规则：只用相对导入或不导入，node 测试脚本可直接 import。
 */

const DEFAULT_MAX_RETRIES = 5
const DEFAULT_BASE_DELAY_MS = 1000
export const DEFAULT_MAX_DELAY_MS = 16000
const RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429])
const NON_RETRYABLE_STATUS_CODES = new Set([400, 401, 403, 404, 422])

function isRecord(value) {
  return typeof value === 'object' && value !== null
}

/** 跨运行时识别取消（DOMException / Error / 普通对象三种形态）。 */
export function isAbortError(error) {
  if (error instanceof Error && error.name === 'AbortError') return true
  if (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') {
    return true
  }
  return isRecord(error) && error.name === 'AbortError'
}

function statusCodeFrom(value) {
  if (!isRecord(value)) return undefined
  for (const key of ['statusCode', 'status', 'status_code']) {
    const raw = value[key]
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw
    if (typeof raw === 'string') {
      const parsed = Number.parseInt(raw, 10)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

function messageFrom(value) {
  if (value instanceof Error) return value.message
  if (!isRecord(value)) return String(value)
  return value.message ?? value.statusText ?? ''
}

function retryableByMessage(value) {
  return /rate limit|too many requests|timeout|timed out|fetch failed|network|ECONNRESET|ECONNREFUSED|ECONNABORTED|ETIMEDOUT|ENOTFOUND|EPIPE|socket hang up/i.test(
    messageFrom(value),
  )
}

function unwrapErrors(value) {
  if (!isRecord(value)) return []
  const nested = []
  if ('lastError' in value) nested.push(value.lastError)
  if ('cause' in value) nested.push(value.cause)
  if (Array.isArray(value.errors)) nested.push(...value.errors)
  return nested
}

export function isRetryableGenerationError(error, seen = new Set()) {
  if (!error || seen.has(error)) return false
  seen.add(error)

  if (isAbortError(error)) return false

  if (isRecord(error) && typeof error.isRetryable === 'boolean') {
    return error.isRetryable
  }

  const statusCode = statusCodeFrom(error)
  if (statusCode !== undefined) {
    if (RETRYABLE_STATUS_CODES.has(statusCode) || statusCode >= 500) return true
    if (NON_RETRYABLE_STATUS_CODES.has(statusCode) || (statusCode >= 400 && statusCode < 500)) {
      return false
    }
  }

  const nested = unwrapErrors(error)
  if (nested.length > 0) {
    return nested.some((nestedError) => isRetryableGenerationError(nestedError, seen))
  }

  if (isRecord(error) && error.name === 'TimeoutError') return true
  if (error instanceof Error && error.name === 'TimeoutError') return true

  return retryableByMessage(error)
}

function retryReason(error) {
  const statusCode = statusCodeFrom(error)
  if (statusCode !== undefined) return `HTTP ${statusCode}`
  return messageFrom(error).trim() || 'retryable error'
}

function retryDelayMs(attempt, baseDelayMs, maxDelayMs, random) {
  const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** Math.max(0, attempt - 1))
  const jitter = Math.floor(exponentialDelay * Math.max(0, Math.min(random(), 1)) * 0.2)
  return Math.min(maxDelayMs, exponentialDelay + jitter)
}

function defaultSleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const onAbort = () => {
      clearTimeout(timeoutId)
      signal?.removeEventListener('abort', onAbort)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }
}

/**
 * 带退避重试地执行 operation(attempt)。
 * shouldRetryResult 命中（如解析结果为空）时按同样退避策略重试。
 */
export async function withGenerationRetry(operation, options) {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES
  const maxAttempts = maxRetries + 1
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS
  const sleep = options.sleep ?? defaultSleep
  const random = options.random ?? Math.random

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    throwIfAborted(options.signal)
    try {
      const result = await operation(attempt)
      throwIfAborted(options.signal)
      if (!options.shouldRetryResult?.(result) || attempt >= maxAttempts) {
        return result
      }
      const nextDelayMs = retryDelayMs(attempt, baseDelayMs, maxDelayMs, random)
      await options.onRetry?.({
        label: options.label,
        attempt,
        maxAttempts,
        nextDelayMs,
        reason: 'empty result',
      })
      throwIfAborted(options.signal)
      await sleep(nextDelayMs, options.signal)
    } catch (error) {
      if (isAbortError(error)) throw error
      throwIfAborted(options.signal)
      if (attempt >= maxAttempts || !isRetryableGenerationError(error)) throw error
      const nextDelayMs = retryDelayMs(attempt, baseDelayMs, maxDelayMs, random)
      await options.onRetry?.({
        label: options.label,
        attempt,
        maxAttempts,
        nextDelayMs,
        reason: retryReason(error),
      })
      throwIfAborted(options.signal)
      await sleep(nextDelayMs, options.signal)
    }
  }
  throw new Error(`Generation retry loop exhausted for ${options.label}`)
}
