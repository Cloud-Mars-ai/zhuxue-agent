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
    if (!localStorage.getItem('ai-tutor-model-config')) {
      localStorage.setItem(
        'ai-tutor-model-config',
        JSON.stringify({
          configVersion: '2026-11-04-server-proxy-v1',
          provider: 'deepseek',
          baseUrl: '',
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
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'yun')
})

test('教师首次登录默认使用澄蓝皮肤', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('学号 / 工号').fill('teacher')
  await page.getByPlaceholder('密码').fill('123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()

  await expect(page).toHaveURL(/\/app\/course$/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'blue')
})

test('落地页欢迎视频播放后循环招手并在点击后进入主页', async ({ page }) => {
  await page.goto('/')
  const gate = page.locator('.welcome-gate')
  const video = gate.locator('video')

  await expect(gate).toBeVisible()
  await expect(video).toBeVisible()
  await expect(page.locator('.welcome-prompt')).toBeVisible({ timeout: 12_000 })

  const firstWaveTime = await video.evaluate((element) => element.currentTime)
  expect(firstWaveTime).toBeGreaterThanOrEqual(5)
  expect(firstWaveTime).toBeLessThan(8)

  await page.waitForTimeout(900)
  const nextWaveTime = await video.evaluate((element) => element.currentTime)
  expect(nextWaveTime).toBeGreaterThanOrEqual(5)
  expect(nextWaveTime).toBeLessThan(8)

  await gate.click({ position: { x: 18, y: 80 } })
  await expect(gate).toHaveCount(0)
  await expect(page.locator('#main')).toBeVisible()
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
  await page
    .locator('.assistant-tool-menu button')
    .filter({ hasText: '板书讲解' })
    .click()

  await expect(page).toHaveURL(/\/app\/board/)
  await expect(page.getByTestId('board-canvas')).toBeVisible()
})

test('首页采用一体化材料区与双学习模式', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/course')

  await expect(page.locator('.learning-composer')).toBeVisible()
  await expect(page.locator('.aside')).not.toContainText('AI答疑')
  await expect(page.locator('.aside')).not.toContainText('智能课程编排')
  await expect(page.locator('.aside')).toContainText('知识库')
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

test('课程生成优先使用用户上传材料而不是固定管理学大纲', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/course')

  const chooserPromise = page.waitForEvent('filechooser')
  await page.locator('.material-card').first().click()
  const chooser = await chooserPromise
  await chooser.setFiles({
    name: 'Python装饰器讲义.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(
      'Python 装饰器\n装饰器接收函数并返回新的函数，用于在不修改原函数的情况下增加日志、权限检查或缓存。\n@decorator 是语法糖，执行时等同于 wrapped = decorator(wrapped)。\n常见误区是忘记 functools.wraps，导致函数名和文档字符串丢失。',
    ),
  })
  await expect(page.locator('.material-card').first()).toContainText('Python装饰器讲义.txt')

  await page.getByRole('button', { name: /正常上课/ }).click()
  await page.locator('.ask-box textarea').fill('请根据我上传的资料生成一节复习课')
  await page.getByRole('button', { name: '从材料生成课程大纲' }).click()

  await expect(page).toHaveURL(/\/app\/studio\?project=/)
  await expect(page.locator('.outline-row').first()).toContainText('装饰器')
  await expect(page.locator('.outline-row').first()).not.toContainText('管理学')
})

test('知识库支持上传资料并展示个人资料', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/library')

  await expect(page.getByTestId('knowledge-library')).toBeVisible()
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: '上传资料' }).click()
  const chooser = await chooserPromise
  await chooser.setFiles({
    name: '线性代数复习.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('# 矩阵与线性变换\n矩阵乘法不满足交换律。特征值用于分析线性变换的伸缩方向。'),
  })

  await expect(page.getByText('线性代数复习.md')).toBeVisible()
})

test('板书可收藏到知识库并再次打开', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/board?chapter=' + encodeURIComponent('第3章 决策与计划'))
  await expect(page.getByTestId('board-canvas')).toBeVisible()

  await page.getByRole('button', { name: '保存到知识库' }).click()
  await expect(page.getByText('板书已保存到知识库')).toBeVisible()
  await page.goto('/app/library')
  await expect(page.getByText('保存的板书')).toBeVisible()
  await expect(page.locator('.board-list article').first()).toContainText(/第3章|决策/)
})

test('作业支持学生上传文件、教师批阅并在学生端查看回复', async ({ page }) => {
  await seedUser(page, 'teacher')
  await page.goto('/app/homework')
  await page.getByRole('button', { name: '布置作业' }).click()
  await page.getByPlaceholder('例如：第 4 章组织结构案例分析').fill('Python 循环作业')
  await page.getByPlaceholder('选择截止时间').fill('2026-12-30 23:59')
  await page.getByRole('button', { name: '发布作业' }).click()
  await expect(page.getByText('已发布「Python 循环作业」')).toBeVisible()

  await page.getByRole('button', { name: /Python 循环作业/ }).click()
  await expect(page).toHaveURL(/\/app\/homework\/hw-/)
  const detailUrl = page.url()

  await page.evaluate((student) => {
    localStorage.setItem('ai-tutor-user', JSON.stringify(student))
  }, USERS.student)
  await page.goto(detailUrl)
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: '选择文件' }).click()
  const chooser = await chooserPromise
  await chooser.setFiles({
    name: '循环作业.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('for 循环用于遍历序列，while 循环根据条件重复执行。'),
  })
  await page.getByRole('button', { name: '提交作业' }).click()
  await expect(page.getByText('循环作业.txt')).toBeVisible()

  await page.evaluate((teacher) => {
    localStorage.setItem('ai-tutor-user', JSON.stringify(teacher))
  }, USERS.teacher)
  await page.reload()
  await page.getByPlaceholder('说明完成情况、问题和下一步建议…').fill('循环结构解释正确，请补充一个避免死循环的检查方法。')
  await page.getByRole('button', { name: '保存批阅并发送回复' }).click()
  await expect(page.getByText('批阅已保存')).toBeVisible()

  await page.evaluate((student) => {
    localStorage.setItem('ai-tutor-user', JSON.stringify(student))
  }, USERS.student)
  await page.reload()
  await expect(page.getByTestId('teacher-reply')).toContainText('避免死循环')
})

test('讨论主题可进入详情并发表评论', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/forum')
  await page.getByText('决策的有限理性到底怎么理解？').click()

  await expect(page.getByRole('heading', { name: '决策的有限理性到底怎么理解？' })).toBeVisible()
  await page.getByPlaceholder('写下你的理解、依据或追问…').fill('有限理性强调信息与计算能力约束，因此更关注满意解。')
  await page.getByRole('button', { name: '发表评论' }).click()
  await expect(page.getByText('有限理性强调信息与计算能力约束，因此更关注满意解。')).toBeVisible()
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
  await page.getByRole('button', { name: '班级知识点分析' }).click()
  await expect(page).toHaveURL(/\/app\/console\?activity=assessment(?::|%3A)/)
  await expect(page.getByTestId('class-knowledge-analysis')).toBeVisible()
})

test('皮肤切换刷新后仍持久化', async ({ page }) => {
  await seedUser(page)
  await page.goto('/app/course')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'yun')
  await expect(page.locator('body')).not.toContainText('夜读')

  await page.getByTestId('web-theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'blue')
  await page.reload({ waitUntil: 'domcontentloaded' })

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'blue')
})

test('教师端可按作业生成班级知识点分析并导出', async ({ page }) => {
  await seedUser(page, 'teacher')
  await page.goto('/app/console')

  await expect(page.getByTestId('class-knowledge-analysis')).toBeVisible()
  await expect(page.getByRole('heading', { name: '班级知识点掌握分析' })).toBeVisible()
  await expect(page.locator('.knowledge-row').first()).toBeVisible()
  await expect(page.getByText('教学建议', { exact: true })).toBeVisible()

  await page.getByText(/查看全部学生明细/).click()
  await expect(page.locator('.student-detail-collapse .el-table__row').first()).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出 CSV' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^班级知识点分析-.*\.csv$/)
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

test('板书沉浸播放可跟随当前板块', async ({ page }) => {
  await seedUser(page)
  await page.setViewportSize({ width: 1280, height: 650 })
  await page.goto('/app/board?chapter=' + encodeURIComponent('第3章 决策与计划'))

  await expect(page.getByTestId('board-canvas')).toBeVisible()
  await expect(page.locator('.aside')).toHaveCount(0)
  await expect(page.locator('.header')).toHaveCount(0)
  const boardStage = page.getByTestId('board-stage')
  await expect(boardStage).toBeVisible()

  const follow = page.getByTestId('follow-toggle')
  await expect(follow).toHaveText('跟随中')
  await expect
    .poll(() => boardStage.evaluate((element) => element.scrollTop), {
      timeout: 10_000,
    })
    .toBeGreaterThan(0)
  await follow.click()
  await expect(follow).toHaveText('跟随已关')
  await follow.click()
  await expect(follow).toHaveText('跟随中')
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
  await page.locator('.field-wide textarea').fill('生成一节关于管理决策与有限理性的课程')
  await page.getByTestId('studio-generate-outline').click()

  await expect(page.getByText('本地生成大纲')).toBeVisible()
  await expect(page.locator('.outline-row').first()).toBeVisible()
  await expect(page.locator('.outline-row')).toHaveCount(6)

  await page.getByTestId('studio-generate-course').click()
  await expect(page).toHaveURL(/\/learn\/course-/)
  await expect(page.locator('.board-canvas')).toBeVisible()
  await expect(page.locator('.scene-rail button')).toHaveCount(6)
  await expect(page.locator('.lesson-frame')).toBeVisible()
  const boardOverflow = await page.locator('.landscape-board').evaluate(
    (element) => element.scrollWidth - element.clientWidth,
  )
  expect(boardOverflow).toBeLessThanOrEqual(1)

  await page.locator('.question-options button').first().click()
  await expect(page.locator('.question-options button').first()).toHaveClass(/selected/)
  await expect(page.locator('.question-selection')).toBeVisible()

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/learn\/course-/)
  await expect(page.locator('.board-canvas')).toBeVisible()

  await page.getByRole('button', { name: '编辑课程' }).click()
  await expect(page).toHaveURL(/\/app\/studio\?project=/)
  await expect(page.locator('.outline-row')).toHaveCount(6)
})

test('课程生成会按内容推断年级并提供分步交互演示', async ({ page }) => {
  await seedUser(page, 'teacher')
  await page.goto('/app/studio')

  await page
    .locator('.field-wide textarea')
    .fill('给七年级学生讲一元一次方程，用具体情境理解等式两边同时变化')
  await page.getByTestId('studio-generate-outline').click()

  await expect(page.getByText('数学 · 初中 · 七年级', { exact: true })).toBeVisible()
  await expect(page.getByText('本地生成大纲')).toBeVisible()

  await page.getByTestId('studio-generate-course').click()
  await expect(page).toHaveURL(/\/learn\/course-/)
  await expect(page.locator('.animation-demo')).toBeVisible()
  await expect(page.locator('.animation-count')).toContainText('1 / 3')

  await page.locator('.animation-controls').getByRole('button', { name: '下一步' }).click()
  await expect(page.locator('.animation-count')).toContainText('2 / 3')
  await expect(page.locator('.animation-frame')).toContainText('只改一处')
  const overflow = await page.locator('.landscape-board').evaluate(
    (element) => element.scrollWidth - element.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

test('理科概念课程自动配备可交互模型并可在板书中操作', async ({ page }) => {
  await seedUser(page, 'teacher')
  await page.goto('/app/studio')

  await page
    .locator('.field-wide textarea')
    .fill('给八年级学生讲圆周运动与向心力，拖动参数看向心力怎么变')
  await page.getByTestId('studio-generate-outline').click()

  await expect(page.getByText('本地生成大纲')).toBeVisible()
  await expect(page.locator('.outline-row').first()).toBeVisible()

  await page.getByTestId('studio-generate-course').click()
  await expect(page).toHaveURL(/\/learn\/course-/)

  // 无模型降级路径也应配备受控交互模型（判定算法兜底）
  const sim = page.locator('.sim-stage').first()
  await expect(sim).toBeVisible()
  await expect(sim).toHaveAttribute('data-model', 'circular-motion')
  await expect(sim.locator('.sim-stage-link')).toContainText('对照概念')

  // 参数滑块可操作：调大速度，向心力读数必须变大（F = m·v²/r）
  const readout = sim.locator('.sim-readout').first().locator('strong')
  const before = await readout.innerText()
  const speed = sim.locator('input[type="range"]').nth(1)
  await speed.fill('10')
  await expect(readout).not.toHaveText(before)
  const after = await readout.innerText()
  expect(parseFloat(after)).toBeGreaterThan(parseFloat(before))

  // 观察任务可勾选
  const task = sim.locator('.sim-observe button').first()
  await task.click()
  await expect(task).toHaveClass(/done/)

  // 松手演示按钮存在且可点
  const releaseButton = page.locator('.sim-circular-side button').first()
  await expect(releaseButton).toBeVisible()
  await releaseButton.click()
  await expect(releaseButton).toBeDisabled()

  // 板书不产生横向溢出
  const overflow = await page.locator('.landscape-board').evaluate(
    (element) => element.scrollWidth - element.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

test('移动端课程板书中的交互模型可操作', async ({ page }) => {
  await seedUser(page, 'teacher')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/m/studio')

  await page
    .locator('.field-wide textarea')
    .fill('给八年级学生讲圆周运动与向心力，拖动参数看向心力怎么变')
  await page.getByTestId('studio-generate-outline').click()
  await expect(page.getByText('本地生成大纲')).toBeVisible()

  await page.getByTestId('studio-generate-course').click()
  await expect(page).toHaveURL(/\/learn\/course-/)

  const sim = page.locator('.sim-stage').first()
  await expect(sim).toBeVisible()
  const task = sim.locator('.sim-observe button').first()
  await task.click()
  await expect(task).toHaveClass(/done/)
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
  await expect(page.getByText('本地生成大纲')).toBeVisible()
})

test('学生可从 H5 首页直接生成课程大纲', async ({ page }) => {
  await seedUser(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/m/course')

  await page.getByRole('button', { name: /考前冲刺/ }).click()
  await page.locator('.m-ask-box textarea').fill('帮我生成一节决策与计划冲刺课')
  await page.locator('.m-send').click()

  await expect(page).toHaveURL(/\/m\/studio\?project=/)
  await expect(page.locator('.outline-row').first()).toBeVisible()
  await expect(page.getByText('本地生成大纲')).toBeVisible()

  await page.getByTestId('studio-generate-course').click()
  await expect(page).toHaveURL(/\/learn\/course-/)
  await expect(page.getByTestId('board-canvas')).toBeVisible()
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

test('赛事工作台合并展示数据质量、个体分析与可审计建议', async ({ page }) => {
  await seedUser(page, 'teacher')
  await page.goto('/app/competition')

  await expect(page.getByTestId('competition-workbench')).toBeVisible()
  await expect(page.getByRole('heading', { name: '智慧学伴工作台' })).toBeVisible()
  await expect(page.getByText('已接入赛方正式模拟学情数据')).toBeVisible()
  await expect(
    page.locator('.cw-stat-grid').first().getByText('9', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText('40 / 806', { exact: true })).toBeVisible()
  await expect(page.getByText('数据质量', { exact: true })).toBeVisible()
  await expect(page.getByText('重复记录', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: /学习体检/ }).click()
  await expect(page.getByRole('heading', { name: '学习体检与行动优先级' })).toBeVisible()

  await page.getByRole('button', { name: /学情分析/ }).click()
  await expect(page.getByText('群体与小组', { exact: true })).toBeVisible()
  await expect(page.getByText('确认的共同薄弱点')).toBeVisible()
  await expect(page.getByText('个体分析', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: /建议与核验/ }).click()
  await expect(page.getByText('学习路径', { exact: false }).first()).toBeVisible()
  await expect(page.getByText('为什么是它').first()).toBeVisible()

  await page.getByRole('button', { name: '调整', exact: true }).first().click()
  await page
    .getByPlaceholder('例如：该生本周尚未学习前置内容，需延后变式题。')
    .fill('该生本周尚未完成前置观察，先保留重讲任务。')
  await page.getByRole('button', { name: '保存并纳入审计' }).click()
  await expect(page.getByText('已调整').first()).toBeVisible()

  await expect(page.getByRole('button', { name: '导出任务成果包' })).toBeVisible()
})

test('学生从赛事建议生成个性化课程并使用数学内容', async ({ page }) => {
  await seedUser(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/m/competition')

  await expect(page.getByTestId('competition-workbench')).toBeVisible()
  await expect(page.getByText('先看已有表现，再看信息不足', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: /学习路径/ }).click()
  await expect(page.getByRole('button', { name: '生成个性化课程' })).toBeVisible()

  await page.getByRole('button', { name: '生成个性化课程' }).click()
  await expect(page).toHaveURL(/\/m\/studio\?project=/)
  await expect(page.locator('.outline-row').first()).toBeVisible()
  await page.getByTestId('studio-generate-course').click()

  await expect(page).toHaveURL(/\/learn\/course-/)
  await expect(page.getByTestId('board-canvas')).toBeVisible()
  await expect(page.locator('.scene-rail button')).toHaveCount(6)
  await expect(page.locator('body')).toContainText(
    /代数式与整式运算|方程与方程组|不等式与不等式组/,
  )
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

test('课程编译器可在无项目时运行离线实验并给出组间指标', async ({ page }) => {
  await seedUser(page, 'teacher')
  await page.goto('/app/compiler')

  await expect(page.getByRole('heading', { name: /把课程生成过程变成可验证的对象/ })).toBeVisible()
  // 没有已编译课程时给出提示，但实验与评测仍可用
  await expect(page.getByText(/还没有已编译的课程/)).toBeVisible()

  await page.getByRole('tab', { name: '实验与评测' }).click()
  await expect(page.getByTestId('compiler-run-experiment')).toBeVisible()

  // 每组重复 1 次，缩短运行时间（12 任务 × 4 组 × 1 = 48 次生成）
  await page.getByTestId('compiler-repeats').click()
  await page.getByRole('option', { name: '1 次' }).click()

  await page.getByTestId('compiler-run-experiment').click()
  await expect(page.getByText(/实验完成：\d+ 次运行/)).toBeVisible({ timeout: 60_000 })

  // 组间指标表：Full Compiler 应 100% 通过硬约束（模拟数据下）
  const compilerRow = page.locator('.el-table__row', { hasText: 'Full Compiler' }).first()
  await expect(compilerRow).toContainText('100%')

  // 导出按钮可用
  await expect(page.getByRole('button', { name: '导出 Markdown 报告' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '导出教师评分表' })).toBeEnabled()
})
