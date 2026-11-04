const MAX_BODY_BYTES = 1_500_000
const MAX_MESSAGES = 30
const MAX_MESSAGE_CHARS = 80_000
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
  })
  res.end(body)
}

async function readJson(req) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      const error = new Error('请求体过大')
      error.status = 413
      throw error
    }
    chunks.push(chunk)
  }
  if (!chunks.length) throw new Error('请求体为空')
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    const error = new Error('请求体不是合法 JSON')
    error.status = 400
    throw error
  }
}

function cleanMessages(messages) {
  if (!Array.isArray(messages) || !messages.length) {
    throw new Error('messages 不能为空')
  }
  const cleaned = messages.slice(-MAX_MESSAGES).map((message) => {
    const role = ['system', 'user', 'assistant'].includes(message?.role)
      ? message.role
      : 'user'
    const content = String(message?.content || '').slice(0, MAX_MESSAGE_CHARS)
    if (!content.trim()) throw new Error('消息内容不能为空')
    return { role, content }
  })
  const joined = cleaned.map((message) => message.content).join('\n')
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(joined))) {
    const error = new Error('请求未通过教育内容安全检查')
    error.status = 400
    throw error
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
    const detail = await upstream.text()
    throw upstreamError(upstream.status, detail.slice(0, 1200))
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
    sendJson(res, status, {
      error: {
        message:
          error.name === 'TimeoutError'
            ? '上游模型响应超时'
            : error.message || 'AI 代理请求失败',
      },
    })
  }
}
