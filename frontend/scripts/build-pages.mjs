import { copyFile } from 'node:fs/promises'
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
    },
  },
)

if (result.status !== 0) {
  process.exit(result.status || 1)
}

await copyFile(resolve(root, 'dist-pages/index.html'), resolve(root, 'dist-pages/404.html'))
console.log('[pages] dist-pages ready with SPA 404 fallback')
