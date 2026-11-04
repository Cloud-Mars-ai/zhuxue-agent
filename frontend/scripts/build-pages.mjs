import { writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const viteBin = resolve(root, 'node_modules/vite/bin/vite.js')
const result = spawnSync(
  process.execPath,
  [viteBin, 'build', '--outDir', 'dist-pages'],
  {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_BASE_PATH: '/zhuxue-agent/',
      VITE_ROUTER_MODE: 'hash',
    },
  },
)

if (result.status !== 0) {
  process.exit(result.status || 1)
}

await writeFile(
  resolve(root, 'dist-pages/404.html'),
  `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>正在进入智慧学伴</title>
  </head>
  <body>
    <script>
      const base = '/zhuxue-agent/'
      const path = location.pathname.startsWith(base)
        ? location.pathname.slice(base.length)
        : ''
      location.replace(base + '#/' + path + location.search + location.hash)
    </script>
  </body>
</html>
`,
  'utf8',
)
console.log('[pages] dist-pages ready with SPA 404 fallback')
