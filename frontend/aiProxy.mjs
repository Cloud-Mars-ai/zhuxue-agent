const MAX_BODY_BYTES = 1_500_000
const MAX_MESSAGES = 30
const MAX_MESSAGE_CHARS = 80_000

/** 简易 per-IP 限流（滑动窗口，防刷量烧密钥） */
const RATE_LIMITS = {
  '/api/ai/chat': { windowMs: 60_000, max: 30 },
  '/api/ai/tts': { windowMs: 60_000, max: 20 },
}
const rateBuckets = new Map()

function rateLimited(urlPath, req) {
  const limit = RATE_LIMITS[urlPath]
  if (!limit) return false
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown'
  const now = Date.now()
  const hits = (rateBuckets.get(ip) || []).filter((t) => now - t < limit.windowMs)
  hits.push(now)
  rateBuckets.set(ip, hits)
  // 顺手清理过期桶，防内存无限增长
  if (rateBuckets.size > 5000) {
    for (const [key, list] of rateBuckets) {
      if (!list.some((t) => now - t < limit.windowMs)) rateBuckets.delete(key)
    }
  }
  return hits.length > limit.max
}

const BLOCKED_PATTERNS = [
  /(自杀(方法|步骤|教程)|怎么自杀|如何自残)/i,
  /(炸弹|爆炸物|枪支).*(制作|配方|组装|教程|步骤)/i,
  /(毒品|违禁药物).*(制作|提纯|贩运|购买渠道)/i,
  /(?:\b\d{17}[\dXx]\b|\b1[3-9]\d{9}\b)/,
]

function sendJson(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  res.end(body)
}

/** 可向用户展示的校验类错误（区别于未预期的内部错误） */
function clientError(message, status = 400) {
  const error = new Error(message)
  error.status = status
  error.exposeToClient = true
  return error
}

async function readJson(req) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      throw clientError('请求体过大', 413)
    }
    chunks.push(chunk)
  }
  if (!chunks.length) throw clientError('请求体为空')
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw clientError('请求体不是合法 JSON')
  }
}

function cleanMessages(messages) {
  if (!Array.isArray(messages) || !messages.length) {
    throw clientError('messages 不能为空')
  }
  const cleaned = messages.slice(-MAX_MESSAGES).map((message) => {
    const role = ['system', 'user', 'assistant'].includes(message?.role)
      ? message.role
      : 'user'
    const content = String(message?.content || '').slice(0, MAX_MESSAGE_CHARS)
    if (!content.trim()) throw clientError('消息内容不能为空')
    return { role, content }
  })
  const joined = cleaned.map((message) => message.content).join('\n')
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(joined))) {
    throw clientError('请求未通过教育内容安全检查')
  }
  return cleaned
}

function upstreamError(status, detail) {
  const error = new Error(detail || `上游模型返回 HTTP ${status}`)
  error.status = status
  return error
}

async function handleChat(req, res) {
  const apiKey = process.env.DEEPSEEK_API_KEY || ''
  if (!apiKey) {
    sendJson(res, 503, {
      error: {
        message: '服务端尚未配置 DEEPSEEK_API_KEY，前端将使用演示缓存。',
      },
    })
    return
  }
  const body = await readJson(req)
  const baseUrl = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1').replace(
    /\/+$/,
    '',
  )
  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || body.model || 'deepseek-chat',
      messages: cleanMessages(body.messages),
      temperature: Math.max(0, Math.min(2, Number(body.temperature) || 0.3)),
      max_tokens: Math.max(64, Math.min(16_000, Number(body.max_tokens) || 2048)),
      ...(body.response_format?.type === 'json_object'
        ? { response_format: { type: 'json_object' } }
        : {}),
    }),
    signal: AbortSignal.timeout(90_000),
  })
  const text = await upstream.text()
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(text))) {
    sendJson(res, 422, {
      error: {
        message: '模型返回内容未通过教育内容安全检查，请调整提示或人工复核。',
      },
    })
    return
  }
  res.writeHead(upstream.status, {
    'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
  })
  res.end(text)
}

async function handleTts(req, res) {
  const apiKey = process.env.STEPFUN_API_KEY || ''
  if (!apiKey) {
    sendJson(res, 503, {
      error: {
        message: '服务端尚未配置 STEPFUN_API_KEY，语音教学将保持关闭。',
      },
    })
    return
  }
  const body = await readJson(req)
  const input = String(body.input || '').trim().slice(0, 1200)
  if (!input) {
    sendJson(res, 400, { error: { message: 'input 不能为空' } })
    return
  }
  const baseUrl = (process.env.STEPFUN_BASE_URL || 'https://api.stepfun.com/v1').replace(
    /\/+$/,
    '',
  )
  const upstream = await fetch(`${baseUrl}/audio/speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.STEPFUN_TTS_MODEL || body.model || 'stepaudio-3-tts',
      input,
      voice: body.voice || 'qinhenvsheng',
      response_format: 'mp3',
      speed: Math.max(0.5, Math.min(2, Number(body.speed) || 1)),
      volume: Math.max(0, Math.min(2, Number(body.volume) || 1)),
      instruction:
        String(body.instruction || '').slice(0, 500) ||
        '用清晰、温和、有节奏的课堂讲解语气朗读。',
    }),
    signal: AbortSignal.timeout(90_000),
  })
  if (!upstream.ok) {
    // 上游错误细节只进服务端日志，不回显给前端（避免泄漏内部信息）
    const detail = await upstream.text()
    console.error('[ai-proxy] tts upstream error:', upstream.status, detail.slice(0, 500))
    throw upstreamError(upstream.status)
  }
  const arrayBuffer = await upstream.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  res.writeHead(200, {
    'Content-Type': upstream.headers.get('content-type') || 'audio/mpeg',
    'Content-Length': buffer.length,
    'Cache-Control': 'no-store',
  })
  res.end(buffer)
}

export function isAiProxyPath(urlPath) {
  return (
    urlPath === '/api/ai/chat' ||
    urlPath === '/api/ai/tts' ||
    urlPath === '/api/health'
  )
}

export async function handleAiProxy(req, res, urlPath) {
  if (req.method !== 'POST' && urlPath !== '/api/health') {
    sendJson(res, 405, { error: { message: 'Method Not Allowed' } })
    return
  }
  if (rateLimited(urlPath, req)) {
    sendJson(res, 429, { error: { message: '请求过于频繁，请稍后再试' } })
    return
  }
  try {
    if (urlPath === '/api/health') {
      sendJson(res, 200, {
        ok: true,
        textModelConfigured: !!process.env.DEEPSEEK_API_KEY,
        ttsConfigured: !!process.env.STEPFUN_API_KEY,
        textModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        ttsModel: process.env.STEPFUN_TTS_MODEL || 'stepaudio-3-tts',
      })
      return
    }
    if (urlPath === '/api/ai/chat') {
      await handleChat(req, res)
      return
    }
    await handleTts(req, res)
  } catch (error) {
    const status = Number(error.status) || (error.name === 'TimeoutError' ? 504 : 500)
    // 自身校验类错误（带 status）可展示；未预期错误只给通用文案，细节进日志
    const safeMessage = error.exposeToClient
      ? error.message
      : error.name === 'TimeoutError'
        ? '上游模型响应超时'
        : 'AI 代理请求失败，请稍后重试'
    if (!error.exposeToClient) {
      console.error('[ai-proxy] unexpected error:', error)
    }
    sendJson(res, status, { error: { message: safeMessage } })
  }
}
