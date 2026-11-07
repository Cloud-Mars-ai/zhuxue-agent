/**
 * 静态托管服务器（替代 vite preview 用于 start / 公网部署）
 *
 * 背景：dist 采用相对 base（base: './'）以兼容 file:// 离线演示，
 * 直接访问深链接（如 /m/course、/practice）时，浏览器会把
 * ./assets/x.js 解析为 /m/assets/x.js 而 404（或被 SPA 回退成
 * HTML 导致白屏）。本服务器把这类路径改写回 /assets/*，
 * 其余未命中路径回退 index.html，兼顾离线包与线上深链接。
 *
 * 监听 0.0.0.0:$PORT，仅使用 Node 内置模块。
 */
import { createServer } from 'node:http'
import { createReadStream, readFileSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join, normalize, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleAiProxy, isAiProxyPath } from './aiProxy.mjs'

const serverDir = fileURLToPath(new URL('.', import.meta.url))

/**
 * 全站安全响应头：
 * - nosniff：禁止浏览器猜测 MIME，防脚本伪装；
 * - DENY：禁被 iframe 嵌入，防点击劫持；
 * - referrer 策略：跨站不泄漏完整 URL（课程分享码等在 query 里）；
 * - permissions-policy：关掉本用不到的硬件能力。
 */
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

function writeHead(res, status, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers })
}

function loadLocalEnv() {
  try {
    const raw = readFileSync(join(serverDir, '.env'), 'utf8')
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const index = trimmed.indexOf('=')
      if (index < 1) return
      const key = trimmed.slice(0, index).trim()
      const value = trimmed.slice(index + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
      if (key && process.env[key] === undefined) process.env[key] = value
    })
  } catch {
    // .env 可选；生产环境直接注入系统环境变量
  }
}

loadLocalEnv()

const distDir = join(serverDir, 'dist')
const port = Number(process.env.PORT) || 4173

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
}

async function isFile(p) {
  try {
    const s = await stat(p)
    return s.isFile()
  } catch {
    return false
  }
}

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)

    if (isAiProxyPath(urlPath)) {
      await handleAiProxy(req, res, urlPath)
      return
    }

    // 相对 base 深链接修正：/<任意一段或两段>/assets/... → /assets/...，
    // 对应 /m/course 与 /app/course 两級深链接；favicon.svg 同理
    const fixed = urlPath.match(/^\/(?:[^/]+\/){1,2}(assets\/.+|favicon\.svg)$/)
    let filePath = normalize(join(distDir, fixed ? `/${fixed[1]}` : urlPath))

    // 防目录穿越（含 ..%2f 解码后穿越与同级目录前缀误判）
    if (filePath !== distDir && !filePath.startsWith(distDir + sep)) {
      writeHead(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Forbidden')
      return
    }

    if (!(await isFile(filePath))) {
      filePath = join(distDir, 'index.html')
    }

    const fileInfo = await stat(filePath)
    const mime = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream'
    const range = req.headers.range

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/i.exec(range)
      if (!match) {
        res.writeHead(416, { 'Content-Range': `bytes */${fileInfo.size}` })
        res.end()
        return
      }
      const start = match[1] ? Number(match[1]) : 0
      const end = match[2] ? Number(match[2]) : fileInfo.size - 1
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 0 ||
        end < start ||
        start >= fileInfo.size
      ) {
        writeHead(res, 416, { 'Content-Range': `bytes */${fileInfo.size}` })
        res.end()
        return
      }
      const safeEnd = Math.min(end, fileInfo.size - 1)
      writeHead(res, 206, {
        'Content-Type': mime,
        'Content-Length': safeEnd - start + 1,
        'Content-Range': `bytes ${start}-${safeEnd}/${fileInfo.size}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      })
      createReadStream(filePath, { start, end: safeEnd }).pipe(res)
      return
    }

    writeHead(res, 200, {
      'Content-Type': mime,
      'Content-Length': fileInfo.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    })
    createReadStream(filePath).pipe(res)
  } catch (err) {
    // 不向前端暴露内部错误细节（可能含路径/堆栈），仅服务端日志记录
    console.error('[zhuxue-agent] static serve error:', err)
    writeHead(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Server Error')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`[zhuxue-agent] serving ${distDir} on http://0.0.0.0:${port}`)
  console.log(
    `[zhuxue-agent] AI proxy: text=${process.env.DEEPSEEK_API_KEY ? 'configured' : 'offline-fallback'}, tts=${process.env.STEPFUN_API_KEY ? 'configured' : 'off'}`,
  )
})
