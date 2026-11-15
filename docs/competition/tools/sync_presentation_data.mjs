import fs from 'node:fs/promises'
import path from 'node:path'
import JSZip from '../../../frontend/node_modules/jszip/lib/index.js'

const root = path.resolve(import.meta.dirname, '../../..')
const source = path.join(root, 'output/presentations/zhuxue-defense-candidate.pptx')
const output = path.join(root, 'docs/competition/deliverables/智慧学伴答辩PPT.pptx')
const screenshot = path.join(root, 'frontend/test-results/competition-ppt-slide5.png')
const replacements = new Map([
  ['slide1.xml', [
    ['当前内置固定种子开发样例，正式提交前须替换为赛方数据', '赛方公开模拟数据，仅供比赛开发展示，不是独立评测集'],
  ]],
  ['slide5.xml', [
    ['417', '806'],
    ['411', '793'],
    ['14', '5'],
    ['6', '13'],
    ['重复 recordId', '旧修订版本 7'],
    ['保留首条并报告', '留存追溯，不重复计入'],
    ['未知学生/题目/材料', '待复核记录 4'],
    ['原文保留，不进入统计', '暂缓分析，等待教师核验'],
    ['负分、超满分、非法状态', '分值异常 2'],
    ['原文保留，不进入统计', '隔离异常分值并报告'],
    ['status=missing', '缺失观察 5'],
  ]],
  ['slide6.xml', [
    ['开发样例判断', '公开模拟数据'],
    ['有效观察 397 条；确认 1 个群体共性薄弱点：EXP-03 同类项与整式加减，得分率 56%。', '793 条记录进入分析，含 788 条有效观察、5 条缺失观察；7 条旧修订、4 条待复核、2 条分值异常单独标记。'],
  ]],
  ['slide9.xml', [
    ['3 个主题', '3 个主题'],
    ['60 道题 / 30 名学生 / 417 条原始记录', '54 道题 / 40 名学生 / 806 条原始记录'],
    ['30 份建议均有理由、标准与证据', '40 份建议均含理由、标准与证据'],
    ['正式数据、最终典型 case 与赛方模板到位后，替换数据而不改统计和建议引擎。', '公开模拟数据用于开发展示，非独立评测集；结论不代表真实教学成效。'],
  ]],
  ['slide10.xml', [
    ['比赛演示只使用开发样例，不与《管理学》历史内容混用。', '比赛演示使用赛方公开模拟数据，与《管理学》课程数据隔离。'],
    ['导入赛方正式数据与字段字典', '确认独立评测数据与字段字典'],
    ['替换最终典型 case 与主题范围', '按赛方最终说明核对典型案例'],
  ]],
])

const xmlText = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const deck = await JSZip.loadAsync(await fs.readFile(source))
for (const [slideName, pairs] of replacements) {
  const slidePath = `ppt/slides/${slideName}`
  const entry = deck.file(slidePath)
  if (!entry) throw new Error(`Missing slide ${slidePath}`)
  let xml = await entry.async('string')
  for (const [before, after] of pairs) {
    const sourceRun = `<a:t>${xmlText(before)}</a:t>`
    const targetRun = `<a:t>${xmlText(after)}</a:t>`
    if (!xml.includes(sourceRun))
      throw new Error(`Missing expected text run in ${slideName}: ${before}`)
    xml = xml.replace(sourceRun, targetRun)
  }
  deck.file(slidePath, xml)
}

const screenshotBuffer = await fs.readFile(screenshot)
deck.file('ppt/media/image.png', screenshotBuffer)

const buffer = await deck.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
await fs.writeFile(output, buffer)
console.log(`Updated ${output}`)
