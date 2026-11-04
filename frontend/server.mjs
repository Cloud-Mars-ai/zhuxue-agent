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
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join, normalize, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const distDir = join(fileURLToPath(new URL('.', import.meta.url)), 'dist')
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

    // 相对 base 深链接修正：/<任意一段或两段>/assets/... → /assets/...，
    // 对应 /m/course 与 /app/course 两級深链接；favicon.svg 同理
    const fixed = urlPath.match(/^\/(?:[^/]+\/){1,2}(assets\/.+|favicon\.svg)$/)
    let filePath = normalize(join(distDir, fixed ? `/${fixed[1]}` : urlPath))

    // 防目录穿越
    if (!filePath.startsWith(distDir)) {
      res.writeHead(403).end('Forbidden')
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
        res.writeHead(416, { 'Content-Range': `bytes */${fileInfo.size}` })
        res.end()
        return
      }
      const safeEnd = Math.min(end, fileInfo.size - 1)
      res.writeHead(206, {
        'Content-Type': mime,
        'Content-Length': safeEnd - start + 1,
        'Content-Range': `bytes ${start}-${safeEnd}/${fileInfo.size}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      })
      createReadStream(filePath, { start, end: safeEnd }).pipe(res)
      return
    }

    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': fileInfo.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    })
    createReadStream(filePath).pipe(res)
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Server Error: ' + err.message)
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`[zhuxue-agent] serving ${distDir} on http://0.0.0.0:${port}`)
})
