import { expect, test } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const USERS = {
  student: {
    id: '2024010001',
    name: '张同学',
    role: 'student',
    discipline: '管理类',
  },
  teacher: {
    id: 'T001',
    name: '王教授',
    role: 'teacher',
  },
}

async function seedUser(page, role = 'student') {
  await page.addInitScript((user) => {
    if (!localStorage.getItem('ai-tutor-user')) {
      localStorage.setItem('ai-tutor-user', JSON.stringify(user))
    }
    if (!localStorage.getItem('ai-tutor-theme')) {
      localStorage.setItem('ai-tutor-theme', 'yun')
    }
    if (!localStorage.getItem('ai-tutor-model-config')) {
      localStorage.setItem(
        'ai-tutor-model-config',
        JSON.stringify({
          configVersion: '2026-11-04-deepseek',
          provider: 'deepseek',
          baseUrl: 'https://api.deepseek.com/v1',
          apiKey: '',
          ttsApiKey: '',
          model: 'deepseek-chat',
        }),
      )
    }
    localStorage.setItem('ai-tutor-flags', JSON.stringify({ offlineFallback: true }))
  }, USERS[role])
}

test('登录后进入课程主页', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('学号 / 工号').fill('student')
  await page.getByPlaceholder('密码').fill('123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()

  await expect(page).toHaveURL(/\/app\/course$/)
  await expect(page.getByTestId('yun-greeting')).toBeVisible()
})

test('本地意图规则直接跳转作业页', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/ask')

  await page
    .getByPlaceholder('输入你的问题或指令，Enter 发送，Shift+Enter 换行')
    .fill('我想交作业')
  await page.getByRole('button', { name: '发送', exact: true }).click()
  await expect(page.getByRole('button', { name: '前往作业页面' })).toBeVisible()
  await page.getByRole('button', { name: '前往作业页面' }).click()

  await expect(page).toHaveURL(/\/app\/homework$/)
})

test('首页工具菜单一步进入板书讲解', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/course')

  await page.getByRole('button', { name: '打开学习工具' }).click()
  await expect(page.getByText('从路线图讲到追问')).toBeVisible()
  await page.locator('.assistant-tool-menu button').first().click()

  await expect(page).toHaveURL(/\/app\/board/)
  await expect(page.getByTestId('board-canvas')).toBeVisible()
})

test('首页采用一体化材料区与双学习模式', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/course')

  await expect(page.locator('.learning-composer')).toBeVisible()
  await expect(page.locator('.aside')).not.toContainText('AI答疑')
  await expect(page.getByRole('button', { name: 'AI协助', exact: true })).toBeVisible()

  await expect(page.locator('.mode-prompt')).toBeVisible()
  await page.getByRole('button', { name: /考前冲刺/ }).click()
  await expect(page.locator('.mode-prompt')).toHaveCount(0)
  await expect(page.locator('.mode-dock')).toBeVisible()
  await page.getByRole('button', { name: '板书讲解', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/board\?chapter=.*mode=sprint/)
})

test('教学大纲卡可选择文件并导入知识库', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/course')

  const chooserPromise = page.waitForEvent('filechooser')
  await page.locator('.material-card').first().click()
  const chooser = await chooserPromise
  await chooser.setFiles({
    name: '管理学教学大纲.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(
      '第一章 管理与管理者\n管理是在特定环境中对组织资源进行计划、组织、领导和控制的过程。',
    ),
  })

  await expect(page.locator('.material-card').first()).toContainText('管理学教学大纲.txt')
  await expect(page.locator('.material-card').first()).toContainText('✓')
})

test('PDF 课程课件可在浏览器内提取并导入', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/course')

  const pdfPath = fileURLToPath(new URL('../fixtures/syllabus.pdf', import.meta.url))
  const chooserPromise = page.waitForEvent('filechooser')
  await page.locator('.material-card').nth(1).click()
  const chooser = await chooserPromise
  await chooser.setFiles(pdfPath)

  await expect(page.locator('.material-card').nth(1)).toContainText('syllabus.pdf', {
    timeout: 20_000,
  })
  await expect(page.locator('.material-card').nth(1)).toContainText('✓')
})

test('无模型时一人一题仍可生成并获取确定性反馈', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/practice')

  await page.getByRole('button', { name: 'AI 生成练习题' }).click()
  await expect(page.getByText('本题情境')).toBeVisible()
  await expect(page.locator('.question-text')).toContainText('演示缓存')

  await page
    .getByPlaceholder('请用口头表达的方式写下你的作答（就像在课堂上回答老师一样）')
    .fill('我会先判断组织结构与授权是否匹配，再提出调整建议。')
  await page.getByRole('button', { name: '提交并获取反馈' }).click()

  await expect(page.getByText('AI 三维反馈')).toBeVisible()
  await expect(page.locator('.feedback-text')).toContainText('演示缓存')
})

test('无模型时章节自测仍可进入答题态', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/selftest')

  await page.getByRole('button', { name: '开始自测' }).click()

  await expect(page.locator('.test-counter')).toContainText('第 1 /')
  await expect(page.locator('.q-option')).not.toHaveCount(0)
})

test('无模型时速查表仍可从教师确认稿生成', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/cheatsheet')

  await page.getByRole('button', { name: '生成速查表' }).click()
  const dialog = page.locator('.el-dialog').filter({ hasText: '先确认用途' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '生成速查表' }).click()

  await expect(page.locator('.sheet')).toBeVisible()
  await expect(page.getByText('AI 生成，仅供复习参考；以教师课件与课堂讲授为准。')).toBeVisible()
})

test('教师可生成、复核并发布考核任务', async ({ page }) => {
  await seedUser(page, 'teacher')
  await page.goto('/app/assessment')

  await page.locator('.el-select').first().click()
  await page.getByText('第3章 决策与计划', { exact: true }).last().click()
  await page.getByText('圈人选范围 · AI 出题', { exact: true }).click()
  await expect(page.locator('.el-select-dropdown:visible')).toHaveCount(0)
  await page.getByText('张同学', { exact: true }).click()

  const generate = page.getByRole('button', { name: 'AI 智能生成模拟面试题' })
  await expect(generate).toBeEnabled()
  await generate.click()
  await page.getByRole('button', { name: '开始生成' }).click()

  await expect(page.getByText('任务复核：')).toBeVisible()
  await page.getByRole('button', { name: '批量通过' }).click()
  await page
    .locator('.el-message-box')
    .getByRole('button', { name: '通过', exact: true })
    .click()
  await page.getByRole('button', { name: '发布任务' }).click()

  await expect(page.getByRole('button', { name: '已发布' })).toBeVisible()
})

test('皮肤切换刷新后仍持久化', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/course')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'yun')

  await page.getByTestId('web-theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'mo')
  await page.reload({ waitUntil: 'domcontentloaded' })

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'mo')
})

test('生产服务器支持板书深链接刷新', async ({ page }) => {
  await seedUser(page)
  const path =
    '/app/board?chapter=' + encodeURIComponent('第3章 决策与计划')
  await page.goto(path)
  await expect(page.getByTestId('board-canvas')).toBeVisible()

  await page.reload()
  await expect(page).toHaveURL(/\/app\/board\?chapter=/)
  await expect(page.getByTestId('board-canvas')).toBeVisible()
})

test('H5 板书可打开讨论面板', async ({ page }) => {
  await seedUser(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/m/board?chapter=' + encodeURIComponent('第3章 决策与计划'))

  await expect(page.getByTestId('board-canvas')).toBeVisible()
  await page.getByRole('button', { name: /边听边问/ }).click()
  await expect(page.locator('.van-popup')).toBeVisible()
  await expect(page.getByText('边听边问', { exact: true }).last()).toBeVisible()
})

test('教师可用两阶段编排生成课程并进入板书场景', async ({ page }) => {
  await seedUser(page, 'teacher')
  await page.goto('/app/studio')

  await expect(page.getByRole('heading', { name: '先生成大纲，确认后再逐场景生成。' })).toBeVisible()
  await page.getByTestId('studio-generate-outline').click()

  await expect(page.getByText('演示缓存大纲')).toBeVisible()
  await expect(page.locator('.outline-row').first()).toBeVisible()
  await expect(page.locator('.outline-row')).toHaveCount(6)

  await page.getByTestId('studio-generate-course').click()
  await expect(page).toHaveURL(/\/learn\/course-/)
  await expect(page.locator('.board-canvas')).toBeVisible()
  await expect(page.locator('.scene-rail button')).toHaveCount(6)
  await expect(page.locator('.lesson-frame')).toBeVisible()

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/learn\/course-/)
  await expect(page.locator('.board-canvas')).toBeVisible()

  await page.getByRole('button', { name: '编辑课程' }).click()
  await expect(page).toHaveURL(/\/app\/studio\?project=/)
  await expect(page.locator('.outline-row')).toHaveCount(6)
})

test('H5 课程编排映射保留查询参数', async ({ page }) => {
  await seedUser(page, 'teacher')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/app/studio?project=course-demo')

  await expect(page).toHaveURL(/\/m\/studio\?project=course-demo$/)
  await expect(page.getByRole('heading', { name: '先生成大纲，确认后再逐场景生成。' })).toBeVisible()
})

test('教师可从首页材料输入直接生成课程大纲', async ({ page }) => {
  await seedUser(page, 'teacher')
  await page.goto('/app/course')

  await page.getByRole('button', { name: /正常上课/ }).click()
  await page.locator('.ask-box textarea').fill('用本周课件生成一节案例应用课')
  await page.getByRole('button', { name: '从材料生成课程大纲' }).click()

  await expect(page).toHaveURL(/\/app\/studio\?project=/)
  await expect(page.locator('.outline-row').first()).toBeVisible()
  await expect(page.getByText('演示缓存大纲')).toBeVisible()
})

test('学生可下载生成板书', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/board?chapter=' + encodeURIComponent('第3章 决策与计划'))
  await expect(page.getByTestId('board-canvas')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '下载板书' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.html$/)
})

test('板书语音教学支持开关和音色切换', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/board?chapter=' + encodeURIComponent('第3章 决策与计划'))
  await expect(page.getByTestId('board-canvas')).toBeVisible()

  await page.getByRole('button', { name: '语音关', exact: true }).click()
  await expect(page.getByRole('button', { name: /语音开|讲解中/ })).toBeVisible()

  await page.locator('button[title="显示设置"]').click()
  const voiceSelect = page.locator('.voice-select-row select')
  await expect(voiceSelect).toBeEnabled()
  await expect(voiceSelect.locator('option')).toHaveCount(5)
  await voiceSelect.selectOption('linjiajiejie')
  await expect(voiceSelect).toHaveValue('linjiajiejie')
})
