import { expect, test } from '@playwright/test'

/**
 * 访问日志功能专项测试
 * 覆盖：真实登录产生登录记录、页面访问自动记录、日志页展示/筛选/详情/导出/清空
 */

async function login(page, { username = 'student', password = '123456' } = {}) {
  await page.goto('/login')
  await page.getByPlaceholder('学号 / 工号').fill(username)
  await page.getByPlaceholder('密码').fill(password)
  await page.getByRole('button', { name: '登录', exact: true }).click()
}

test('Web 端：登录与页面访问被记录，日志页可筛选可清空', async ({ page }) => {
  await login(page)
  await expect(page).toHaveURL(/\/app\/course$/)

  // 浏览两个页面，产生页面访问记录
  await page.goto('/app/board')
  await expect(page.getByTestId('board-canvas')).toBeVisible()

  // 进入访问日志页
  await page.goto('/app/logs')
  await expect(page.getByRole('heading', { name: '访问日志' })).toBeVisible()

  // 统计卡：登录次数 ≥ 1
  const loginStat = page.locator('.stat-box', { hasText: '登录次数' }).locator('.stat-num')
  await expect(loginStat).toHaveText(/[1-9]/)

  // 表格里应同时存在「登录」与「页面访问」两类记录
  await expect(
    page.locator('.el-table .el-tag').filter({ hasText: /^登录$/ }),
  ).toHaveCount(1)
  await expect(
    page.locator('.el-table .el-tag').filter({ hasText: /^页面访问$/ }),
  ).not.toHaveCount(0)

  // 登录记录详情应包含账号（不包含密码）
  const loginRow = page.locator('.el-table__row', { hasText: '登录' }).first()
  await expect(loginRow.locator('.detail-text')).toContainText('账号 student')
  await expect(loginRow.locator('.detail-text')).not.toContainText('123456')

  // 按类型筛选：只看登录
  await page.locator('.toolbar .el-select').click()
  await page.locator('.el-select-dropdown__item').filter({ hasText: /^登录$/ }).click()
  const rows = page.locator('.el-table__row')
  await expect(rows).toHaveCount(1)
  await expect(rows.first()).toContainText('登录')

  // 清空日志（确认对话框）
  await page.getByRole('button', { name: '清空日志' }).click()
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.locator('.el-empty')).toBeVisible()
})

test('Web 端：日志可导出为本地 JSON 文件', async ({ page }) => {
  await login(page)
  await expect(page).toHaveURL(/\/app\/course$/)
  await page.goto('/app/logs')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出 JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^access-log-\d{4}-\d{2}-\d{2}\.json$/)
})

test('H5 端：日志列表与详情弹窗正常', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page)
  await expect(page).toHaveURL(/\/m\/course$/)

  await page.goto('/m/logs')
  await expect(page.locator('.m-logs-stats')).toBeVisible()

  // 列表应有登录记录（.van-cell-group 作用域，避免命中搜索框单元格）
  const loginCell = page.locator('.van-cell-group .van-cell', { hasText: '登录' }).first()
  await expect(loginCell).toBeVisible()
  await expect(loginCell).toContainText('张同学')

  // 点击单元格弹出详情（JSON 结构，不含密码）
  await loginCell.click()
  const sheet = page.locator('.detail-sheet')
  await expect(sheet).toBeVisible()
  await expect(sheet.locator('.detail-json')).toContainText('"事件": "登录"')
  await expect(sheet.locator('.detail-json')).toContainText('student')
  await expect(sheet.locator('.detail-json')).not.toContainText('123456')
  await sheet.getByRole('button', { name: '关闭' }).click()

  // 类型 Tab 筛选：切到「页面访问」后不应再出现登录标签
  await page.getByRole('tab', { name: '页面访问' }).click()
  await expect(page.locator('.van-cell-group .van-cell .van-tag', { hasText: '登录' })).toHaveCount(0)
  await expect(page.locator('.van-cell-group .van-cell').first()).toContainText('页面访问')

  // 清空（Vant 确认框）
  await page.getByRole('button', { name: '清空日志' }).click()
  await page.getByRole('button', { name: '确认' }).click()
  await expect(page.locator('.van-empty')).toBeVisible()
})
