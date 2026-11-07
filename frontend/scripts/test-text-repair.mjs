/**
 * test-text-repair.mjs — textRepair 模块的确定性回归测试
 * 运行：npm run test:text-repair
 *
 * 覆盖三类断言：
 * 1. 已知映射表逐条正确（字母/符号/图示部件）；
 * 2. 正常汉字零误伤（犯犹狂狗狐独狭狮狼狞状…均原样保留）；
 * 3. 真实语料（B01–B08 提取文本）修复后无可疑字符残留，且关键句式还原正确。
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import {
  repairText,
  repairDeep,
  repairDeepWithReport,
  sanitizeUserInput,
  detectGarbled,
} from '../src/utils/textRepair.js'

const here = path.dirname(fileURLToPath(import.meta.url))
let passed = 0
let failed = 0

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) {
    passed += 1
    console.log(`  ✓ ${name}`)
  } else {
    failed += 1
    console.log(`  ✗ ${name}\n      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`)
  }
}

console.log('\n[1] 字母映射表（大写）')
check('犃犅犆 → ABC', repairText('犃犅犆').text, 'ABC')
check('犌犎 → GH', repairText('四边形犃犅犆犇，记其四边的中点分别为犈，犉，犌，犎').text,
  '四边形ABCD，记其四边的中点分别为E，F，G，H')
check('犔 → L', repairText('零件长度犔的合格尺寸').text, '零件长度L的合格尺寸')
check('犕犖犘犗 → MNOP', repairText('点犕，犖，犘在同一条直线上').text, '点M，N，P在同一条直线上')
check('犙犚犛犞 → QRSV', repairText('相交于点犙；狏２＝２犵犚；面积犛；用犞表示').text,
  '相交于点Q；v２＝２gR；面积S；用V表示')

console.log('\n[2] 字母映射表（小写）')
check('狓狔狕 → xyz', repairText('长、宽、高分别为狓ｃｍ，狔ｃｍ，狕ｃｍ').text,
  '长、宽、高分别为xｃｍ，yｃｍ，zｃｍ')
check('犪犫犮 → abc', repairText('如果犪＞犫，犫＞犮，那么犪＞犮').text, '如果a＞b，b＞c，那么a＞c')
check('犱 → d', repairText('经过犱天完成').text, '经过d天完成')
check('犳犵 → fg', repairText('４犳＋犵＝１５，３犵－４犳＝－３').text, '４f＋g＝１５，３g－４f＝－３')
check('犺 → h', repairText('高犺 等于底面半径狉').text, '高h 等于底面半径r')
check('犽 → k', repairText('用犽表示它们的积（犽≠０）').text, '用k表示它们的积（k≠０）')
check('犾犿狀 → lmn', repairText('长度犾；－４与犿的积；狀倍').text, '长度l；－４与m的积；n倍')
check('狆狇狉狊狋狌狏 → pqrstuv', repairText('狆狇狉狊狋狌狏').text, 'pqrstuv')
check('狆狇 → pq（√2 证明句式）',
  repairText('假设槡２是有理数，那么存在两个互质的正整数狆，狇，使得 狆狇＝槡２').text,
  // 全角数字２是教材正常排版，不在修复范围内，原样保留
  '假设√２是有理数，那么存在两个互质的正整数p，q，使得 pq＝√２')

console.log('\n[3] 符号映射')
check('槡 → √', repairText('±槡９＝±３；槡 犪 的算术平方根').text, '±√９＝±３；√ a 的算术平方根')
check('烐烏烑 → （n 个）', repairText('即 犪 · 犪 ·…· 犪 烐 烏 烑 狀 个').text, '即 a · a ·…· a （ ） n 个')
check('鳰 → 拃', repairText('即一鳰').text, '即一拃')

console.log('\n[4] 图示部件删除')
check('烅烄烆 → 空（残留空格折叠）', repairText('负有理数 烅 烄 烆 烍 烌 烎 有限小数').text, '负有理数 有限小数')

console.log('\n[5] 正常汉字零误伤（犭/牜/火部常用字）')
check('常用词保留',
  repairText('犯罪 犹如 疯狂 狐狸 独立 狭窄 狮子 狼狈 形状 警犬 小狗 犰狳 狍子 狒狒 狠心 狰狞 狙击 监狱 狸猫 狄拉克 猛犸 热烈 闪烁 破烂 烃').text,
  '犯罪 犹如 疯狂 狐狸 独立 狭窄 狮子 狼狈 形状 警犬 小狗 犰狳 狍子 狒狒 狠心 狰狞 狙击 监狱 狸猫 狄拉克 猛犸 热烈 闪烁 破烂 烃')
check('普通中文保留', repairText('第二章 有理数的运算：有理数的加法与减法、乘法与除法各有什么关系').text,
  '第二章 有理数的运算：有理数的加法与减法、乘法与除法各有什么关系')
check('空值与边界', repairText('').text, '')
check('幂等性', repairText(repairText('狆狇 槡 烅').text).text, 'pq √ ')

console.log('\n[6] 深修复（模型输出 JSON）')
const dirty = {
  lesson: {
    title: '（3）荞状 ÷ 狆株',
    blocks: [
      { type: 'definition', term: '狆狇', definition: '狆，狇 是整数，狇 ≠ ０', concreteAnchor: '２ 可以写成 ２╱１' },
      { type: 'table', rows: [['槡 犪', '狓２＝犪']] },
    ],
  },
  questions: [{ stem: '４犳＋犵＝？', options: ['１５', '１６'] }],
}
const { value, fixed } = repairDeepWithReport(dirty)
check('JSON 字符串深修复', value.lesson.title, '（3）荞状 ÷ p株')
check('JSON term 修复', value.lesson.blocks[0].term, 'pq')
check('JSON definition 修复', value.lesson.blocks[0].definition, 'p，q 是整数，q ≠ ０')
check('JSON table 修复', value.lesson.blocks[1].rows, [['√ a', 'x２＝a']])
check('JSON questions 修复', value.questions[0].stem, '４f＋g＝？')
check('修复计数 > 0', fixed > 0, true)

console.log('\n[7] 用户输入净化')
check('净化返回说明', sanitizeUserInput('第二章 有理数的运算 （2 ）荞 状 × 狆 株 =').notice.length > 0, true)
check('净化保留原文结构', sanitizeUserInput('第二章 有理数的运算').notice, '')

console.log('\n[8] 真实语料回归（B01–B08 提取文本，如存在）')
const corpusPath = path.resolve(here, '../../tmp/all-pdfs-text.txt')
if (existsSync(corpusPath)) {
  const corpus = readFileSync(corpusPath, 'utf8')
  const before = detectGarbled(corpus)
  const after = repairText(corpus)
  const leftover = /[\u7280-\u72ff\u70c0-\u70d5]/.test(after.text)
    ? [...new Set((after.text.match(/[\u7280-\u72ff\u70c0-\u70d5]/g) || []))].join('')
    : ''
  check('语料修复计数（fixed 应 > 4000）', before.fixed > 4000, true)
  check('语料修复后无可疑字符残留（除常用字）',
    leftover.replace(/[犯状狗犀犁犄犊犒犧犸犰犹狂狄狈狽狍狐狒狙狞狠狡狩独狭狹狮狰狱狳狸狼犬烁烂烃烈烊]/g, ''), '')
  // PDF 提取结果词元间带空格，用宽松匹配
  check('语料关键句式还原', /互质的正整\s*数\s*p\s*，\s*q\s*，\s*使得\s*p\s*q\s*＝\s*√\s*２/.test(after.text), true)
  check('语料含“x＜a”不等式句式', /狓/.test(after.text), false)
  console.log(`    语料规模 ${corpus.length} 字符；fixed=${before.fixed} stripped=${before.stripped}`)
} else {
  console.log('  （跳过：tmp/all-pdfs-text.txt 不存在，属本地中间产物）')
}

console.log(`\n结果：${passed} 通过，${failed} 失败\n`)
process.exit(failed > 0 ? 1 : 0)
