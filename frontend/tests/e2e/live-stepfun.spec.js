import { expect, test } from '@playwright/test'

async function seedUser(page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'ai-tutor-user',
      JSON.stringify({
        id: '2024010001',
        name: '张同学',
        role: 'student',
        discipline: '管理类',
      }),
    )
    localStorage.setItem('ai-tutor-theme', 'yun')
  })
}

test('@live DeepSeek 可在页面内完成真实回答', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/ask')

  await page
    .getByPlaceholder('输入你的问题或指令，Enter 发送，Shift+Enter 换行')
    .fill('请用一句话解释管理的定义。')
  await page.getByRole('button', { name: '发送', exact: true }).click()
  await page.waitForFunction(
    () =>
      document.querySelectorAll('.msg.assistant').length >= 2 &&
      !document.body.innerText.includes('正在思考…'),
    null,
    { timeout: 60_000 },
  )

  const replies = await page.locator('.msg.assistant .bubble-text').allTextContents()
  expect(replies.at(-1)?.length).toBeGreaterThan(20)
})

test('@live StepAudio 3 TTS 可在页面内合成朗读', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/ask')

  const initialSpeak = page.locator('.msg.assistant .speak-button').first()
  await expect(initialSpeak).toBeVisible()
  await initialSpeak.click()
  await expect(initialSpeak).toContainText(/生成语音|停止朗读/)
  await expect(initialSpeak).toContainText('停止朗读', { timeout: 60_000 })
})

test('@live 板书语音会跟随字幕自动播报', async ({ page }) => {
  await seedUser(page)
  await page.goto(
    '/app/board?chapter=' +
      encodeURIComponent('第3章 决策与计划') +
      '&mode=course',
  )
  await expect(page.getByTestId('board-canvas')).toBeVisible({ timeout: 90_000 })

  await page.getByRole('button', { name: '语音关', exact: true }).click()
  await expect(page.getByRole('button', { name: /讲解中|语音开/ })).toBeVisible({
    timeout: 60_000,
  })
  await page.waitForFunction(
    () => {
      const match =
        document.querySelector('.playback-bar')?.textContent?.match(/(\d+)\s*\/\s*(\d+)/)
      return match && Number(match[1]) >= 2
    },
    null,
    { timeout: 90_000 },
  )
})

test('@live DeepSeek 可生成结构化板书', async ({ page }) => {
  await seedUser(page)
  const path =
    '/app/board?chapter=' +
    encodeURIComponent('第3章 决策与计划') +
    '&mode=course'
  await page.goto(path)

  await expect(page.getByTestId('board-canvas')).toBeVisible({ timeout: 90_000 })
  await expect(page.locator('.fallback-banner')).toHaveCount(0)
  await expect(page.locator('.board-block')).not.toHaveCount(0)
})

test('@live DeepSeek 可从首页生成课程并进入首个板书场景', async ({ page }) => {
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') {
      console.log(`[browser:${message.type()}] ${message.text()}`)
    }
  })
  await page.addInitScript(() => {
    localStorage.setItem(
      'ai-tutor-user',
      JSON.stringify({
        id: 'T001',
        name: '王教授',
        role: 'teacher',
      }),
    )
    localStorage.setItem('ai-tutor-theme', 'yun')
  })
  await page.goto('/app/course')

  await page.getByRole('button', { name: /正常上课/ }).click()
  await page
    .locator('.ask-box textarea')
    .fill('围绕第3章决策与计划设计一节案例应用课')
  await page.getByRole('button', { name: '从材料生成课程大纲' }).click()
  await expect(page.locator('.outline-row').first()).toBeVisible({ timeout: 90_000 })
  await expect(page.getByText('演示缓存大纲')).toHaveCount(0)

  await page.getByTestId('studio-generate-course').click()
  await page.getByRole('button', { name: '当前场景后停止' }).click()
  await expect(page.locator('.board-canvas')).toBeVisible({ timeout: 90_000 })
  await expect(page.locator('.experience-page')).toBeVisible()
  const sceneCount = await page.locator('.scene-rail button').count()
  expect(sceneCount).toBeGreaterThanOrEqual(6)
  expect(sceneCount).toBeLessThanOrEqual(9)
})
