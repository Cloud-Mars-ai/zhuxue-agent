import { defineConfig } from '@playwright/test'

const edgeExecutable =
  process.env.PLAYWRIGHT_EDGE_PATH ||
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /live-stepfun\.spec\.js/,
  grep: /@live/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 60_000 },
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
  },
})
