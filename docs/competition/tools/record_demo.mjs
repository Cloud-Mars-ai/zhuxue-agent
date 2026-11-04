import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(
  pathToFileURL(
    'D:/黑客松/经管Agent/frontend/node_modules/@playwright/test/index.mjs',
  ).href
)

const root = 'D:/黑客松/经管Agent'
const durations = JSON.parse(
  await fs.readFile(path.join(root, 'tmp/video/durations.json'), 'utf8'),
)
const introDelay = 3
const starts = []
let cursor = introDelay
for (const item of durations) {
  starts.push(cursor)
  cursor += item.duration
}
const finishAt = cursor + 0.8

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: path.join(root, 'tmp/video/recording'),
    size: { width: 1280, height: 720 },
  },
})
const page = await context.newPage()
const clock = { start: Date.now() }

function waitUntil(seconds) {
  const remaining = seconds * 1000 - (Date.now() - clock.start)
  return remaining > 0 ? page.waitForTimeout(remaining) : Promise.resolve()
}

async function addOverlay(label, detail) {
  await page.evaluate(
    ({ label, detail }) => {
      let root = document.querySelector('[data-demo-caption]')
      if (!root) {
        root = document.createElement('div')
        root.dataset.demoCaption = '1'
        root.style.cssText = [
          'position:fixed',
          'z-index:2147483647',
          'right:24px',
          'bottom:22px',
          'max-width:560px',
          'padding:12px 16px',
          'border:1px solid rgba(61,91,217,.22)',
          'border-radius:14px',
          'background:rgba(250,248,242,.94)',
          'box-shadow:0 10px 34px rgba(35,33,30,.16)',
          'backdrop-filter:blur(12px)',
          'pointer-events:none',
          'font-family:"Microsoft YaHei",sans-serif',
          'color:#23211e',
        ].join(';')
        root.innerHTML =
          '<div data-label style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:#3d5bd9"></div>' +
          '<div data-detail style="font-size:15px;line-height:1.55;margin-top:5px"></div>'
        document.body.appendChild(root)
      }
      root.querySelector('[data-label]').textContent = label
      root.querySelector('[data-detail]').textContent = detail
    },
    { label, detail },
  )
}

async function seed(user) {
  await page.evaluate((value) => {
    localStorage.setItem('ai-tutor-user', JSON.stringify(value))
    localStorage.setItem('ai-tutor-theme', 'yun')
    localStorage.setItem('ai-tutor-flags', JSON.stringify({ offlineFallback: true }))
    localStorage.setItem('ai-tutor-model-config', JSON.stringify({
      configVersion: '2026-11-04-server-proxy-v1',
      provider: 'deepseek',
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: '',
      ttsApiKey: '',
      model: 'deepseek-chat',
    }))
  }, user)
}

try {
  await page.goto('http://127.0.0.1:4173/login', { waitUntil: 'domcontentloaded' })
  await seed({ id: 'T001', name: '王教授', role: 'teacher' })
  await page.goto('http://127.0.0.1:4173/app/competition', {
    waitUntil: 'networkidle',
  })
  await addOverlay('01 / 智慧学伴', '一个工作台完成内容、学情与建议')
  await waitUntil(starts[0])

  await page.locator('.cw-quality-grid').scrollIntoViewIfNeeded()
  await addOverlay('02 / 数据质量', '原始记录保留，重复与异常单独报告')
  await waitUntil(starts[1])
  await waitUntil(starts[2])
  await page.getByRole('button', { name: /学情分析/ }).click()
  await addOverlay('03 / 学情分析', '个体看证据，群体看样本门槛')
  await waitUntil(starts[2] + 4)
  await page.locator('.cw-card').filter({ hasText: '个体分析' }).scrollIntoViewIfNeeded()
  await waitUntil(starts[2] + 9)
  await page.locator('.cw-evidence-list button').first().click()
  await waitUntil(starts[2] + 18)
  await page.locator('.el-dialog__headerbtn').click()

  await waitUntil(starts[3])
  await page.getByRole('button', { name: /建议与核验/ }).click()
  await addOverlay('04 / 建议与核验', '材料、练习、理由、顺序与教师调整')
  await waitUntil(starts[3] + 8)
  await page.getByRole('button', { name: '通过', exact: true }).first().click()
  await waitUntil(starts[3] + 13)
  await page.getByRole('button', { name: '调整', exact: true }).first().click()
  await page.getByPlaceholder('例如：该生本周尚未学习前置内容，需延后变式题。').fill(
    '该生本周尚未完成前置观察，先保留重讲任务。',
  )
  await page.getByRole('button', { name: '保存并纳入审计' }).click()

  await waitUntil(starts[4] - 3)
  await seed({ id: '2024010001', name: '张同学', role: 'student', discipline: '管理类' })
  await page.goto('http://127.0.0.1:4173/app/competition', {
    waitUntil: 'networkidle',
  })
  await addOverlay('05 / 学生体验', '从建议生成正常上课或考前冲刺课程')
  await waitUntil(starts[4])
  await page.getByRole('button', { name: /学习路径/ }).click()
  await waitUntil(starts[4] + 4)
  await page.getByRole('button', { name: '生成个性化课程' }).click()
  await page.waitForURL(/\/app\/studio\?project=/)
  await page.getByTestId('studio-generate-course').click()
  await page.waitForURL(/\/learn\/course-/)
  await page.getByTestId('board-canvas').waitFor({ state: 'visible', timeout: 20000 })
  await addOverlay('05 / 个性化课程', '首场景可学，后续场景在后台继续生成')

  await waitUntil(starts[5] - 2)
  await seed({ id: 'T001', name: '王教授', role: 'teacher' })
  await page.goto('http://127.0.0.1:4173/app/competition', {
    waitUntil: 'networkidle',
  })
  await page.getByRole('button', { name: /建议与核验/ }).click()
  await page.locator('.cw-plan-side').scrollIntoViewIfNeeded()
  await addOverlay('06 / 任务成果包', 'JSON、CSV、字段说明、典型案例与审计记录')
  await waitUntil(starts[5] + 5)
  await page.getByRole('button', { name: '导出任务成果包' }).click()

  await waitUntil(finishAt)
  const video = page.video()
  const targetPath = path.join(root, 'tmp/video/demo-recording.webm')
  await context.close()
  const recordedPath = await video.path()
  await fs.copyFile(recordedPath, targetPath)
  await fs.writeFile(
    path.join(root, 'tmp/video/recording-manifest.json'),
    JSON.stringify(
      {
        path: targetPath,
        starts,
        finishAt,
        durations,
      },
      null,
      2,
    ),
    'utf8',
  )
  console.log(JSON.stringify({ targetPath, starts, finishAt }, null, 2))
} finally {
  await browser.close().catch(() => {})
}
