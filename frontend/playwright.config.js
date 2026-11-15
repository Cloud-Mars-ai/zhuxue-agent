import { defineConfig } from '@playwright/test'

const e2ePort = Number(process.env.PLAYWRIGHT_PORT || 4174)
const edgeExecutable =
  process.env.PLAYWRIGHT_EDGE_PATH ||
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  grepInvert: /@live/,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  reporter: [['line']],
  use: {
    baseURL: `http://127.0.0.1:${e2ePort}`,
    headless: true,
    viewport: { width: 1280, height: 800 },
    launchOptions: { executablePath: edgeExecutable },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: `http://127.0.0.1:${e2ePort}`,
    reuseExistingServer: false,
    timeout: 45_000,
    // E2E 断言的是离线确定性契约（演示缓存 / 本地生成大纲 / 固定题号），
    // 显式置空所有模型 key：避免本机 .env 里的 AI_API_KEY 绕过旧版 DeepSeek 设置，
    // 让离线确定性用例意外调用真实模型并导致结果漂移。
    // （.env 解析器不覆盖已定义的变量，空串即走 offline-fallback。）
    env: {
      PORT: String(e2ePort),
      AI_API_KEY: '',
      DEEPSEEK_API_KEY: '',
      STEPFUN_API_KEY: '',
    },
  },
})
