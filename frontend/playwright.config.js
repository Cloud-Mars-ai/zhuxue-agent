import { defineConfig } from '@playwright/test'

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
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    viewport: { width: 1280, height: 800 },
    launchOptions: { executablePath: edgeExecutable },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 45_000,
    // E2E 断言的是离线确定性契约（演示缓存 / 本地生成大纲 / 固定题号），
    // 显式置空模型 key：避免本机 .env 里的 DeepSeek key 让模型真答题导致断言漂移。
    // （.env 解析器不覆盖已定义的变量，空串即走 offline-fallback。）
    env: { DEEPSEEK_API_KEY: '', STEPFUN_API_KEY: '' },
  },
})
