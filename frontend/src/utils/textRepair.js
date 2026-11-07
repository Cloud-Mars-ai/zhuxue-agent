/**
 * textRepair.js — 课程材料与生成内容的乱码修复
 *
 * 背景（2026-11-07 定位）：
 * 赛题材料 `5_课程标准及相关教学资源/B01–B08_相关资料切片.pdf` 由方正书版类
 * 排版系统产出，其文本层（ToUnicode CMap）损坏：PDF 的**视觉层完全正常**
 * （屏幕显示、打印都是正确的斜体字母与符号），但复制粘贴和 pdf.js 文本提取
 * 会把拉丁字母与数学符号替换成形态相近的稀有汉字，例如：
 *
 *   狓→x  犿→m  狀→n  狆→p  狇→q  犪→a  犫→b  犵→g  犺→h  犚→R
 *   槡→√  烅/烄/烆→分类图花括号（纯图示部件）
 *
 * 这些乱码经两条路径进入产品：
 * 1. 用户从 PDF 复制题干/主题粘贴进输入框（截图复现：主题含“荞状 × 狆株”）；
 * 2. 应用自带 PDF 导入（pdf.js getTextContent）把同样的乱码写进知识库。
 * 模型见到稀有字后还会**放大乱码**（把 狆狇 输出成“荞株”、混用简繁体 状/狀），
 * 用户再把模型输出粘贴回来，形成二次污染。
 *
 * 本模块的修复分四层，全部是确定性规则，离线可用：
 * 1. 已知映射表：覆盖 B01–B08 全部语料（237,460 字符逐类扫描 + 逐字渲染核对）；
 * 2. 同字体家族可疑区块：U+7280–U+72FF（犭/牜部）、U+70C0–U+70D5（火部）中
 *    未观测到的损坏字（如 e/i/j/o 等字母若出现）按乱码清除并计数；
 * 3. 图示部件删除：分类图花括号、下花括号等纯排版字形，不进文本；
 * 4. 模型放大字形（荞←狆、株←狇）：这些字本身是正常汉字（荞麦/植株），
 *    不能无条件替换，只在“数学字母上下文”中修复（见 AMPLIFIED_MAP）。
 *
 * 映射表验证方式：PyMuPDF 渲染乱码字所在区域为图片，逐字目视核对
 * （例：“存在两个互质的正整数 p，q，使得 p/q=√2” ⇒ 狆=p、狇=q）。
 * 课标 PDF（课程标准_2022.pdf）与全部 docx/csv 经验证无此问题。
 */

/** 字母映射表（大写） */
const UPPER_MAP = {
  犃: 'A', 犅: 'B', 犆: 'C', 犇: 'D', 犈: 'E', 犉: 'F', 犌: 'G', 犎: 'H',
  犔: 'L', 犕: 'M', 犖: 'N', 犗: 'O', 犘: 'P', 犙: 'Q', 犚: 'R', 犛: 'S',
  犞: 'V',
}

/** 字母映射表（小写） */
const LOWER_MAP = {
  犪: 'a', 犫: 'b', 犮: 'c', 犱: 'd', 犳: 'f', 犵: 'g', 犺: 'h', 犽: 'k',
  犾: 'l', 犿: 'm', 狀: 'n', 狆: 'p', 狇: 'q', 狉: 'r', 狊: 's', 狋: 't',
  狌: 'u', 狏: 'v', 狓: 'x', 狔: 'y', 狕: 'z',
}

/** 符号映射表 */
const SYMBOL_MAP = {
  槡: '√', // 根号（教材原文“√a 读作根号 a”）
  鳰: '拃', // 一拃（尺、寸的出处）
  烐: '（', // 下花括号左部件（“a·a·…·a（n 个）”）
  烑: '）', // 下花括号右部件
}

/** 纯图示部件：实数分类图的花括号分段、下花括号中段，直接删除 */
const ARTIFACT_CHARS = '烅烄烆烍烌烎烏'

/** 同一字体家族的其他损坏字所在的 Unicode 区块 */
const SUSPICIOUS_RANGES = [
  [0x7280, 0x72ff], // 犲…猀：牜/犭部
  [0x70c0, 0x70d5], // 烀…烕：火部
]

/**
 * 可疑区块内的正常汉语用字（不是被替换的字母，必须保留）。
 * 选取标准：两个区块中全部“常见现代汉语用字（含常用繁体/异体）”，
 * 按 Unicode 区块全表逐一过目后列入；未列入的（如尚未观测到的
 * e/i/j/o/w 字母替代字 犲/犻/犼/狅/犠）才按乱码清除。
 * 注意：狀(U+72C0) 是乱码（→n），状(U+72B6) 是正常字（形状），二者不同。
 */
const BLOCK_COMMON_WORDS =
  '犯状狗犀犁犄犊犒犧犸犰犹狂狄狈狽狍狐狒狙狞狠狡狩独狭狹狮狰狱狳狸狼犬' +
  '烁烂烃烈烊'

const REPAIR_MAP = { ...UPPER_MAP, ...LOWER_MAP, ...SYMBOL_MAP }
const REPAIR_KEYS = Object.keys(REPAIR_MAP)
const ARTIFACT_SET = new Set(ARTIFACT_CHARS)
const BLOCK_COMMON_SET = new Set(BLOCK_COMMON_WORDS)

/**
 * 模型放大字形映射（第四层修复）。
 *
 * 背景：模型见到 PDF 乱码 狆/狇 后，会输出成形态相近的**新字形**——
 * 2026-11-07 日志实证“把 狆狇 输出成‘荞株’”（用户粘贴回来的主题即
 * “（2 ）荞 状 × 狆 株”）。这两个字本身是正常汉字（荞麦、植株、50株番茄），
 * 在 B01–B08 语料中 荞 出现 0 次、株 仅 2 次且均为合法用法，
 * 因此**不能无条件映射**，只在数学字母上下文中修复。
 */
const AMPLIFIED_MAP = { 荞: 'p', 株: 'q' }

/**
 * 数学字母上下文触发集：拉丁字母、常用数学符号、全角括号、另一个放大字形。
 * 故意不含数字（ASCII 与全角都不含）——“５０株番茄”“50 株”是正常表述；
 * 故意不含句首/句尾边界——“荞麦粥的做法”“植株高度”是正常词。
 */
const CONTEXT_TRIGGER = /[a-zA-Z+\-*/=^<>×÷±√²³≤≥≠＋－＊／＾＝＜＞（）]/

/** 单字符判定：是否触发数学字母上下文 */
function triggersMathContext(ch) {
  return !!ch && (CONTEXT_TRIGGER.test(ch) || !!AMPLIFIED_MAP[ch])
}

/**
 * 放大字形的上下文感知修复：找到左右最近的非空白邻居，任一侧命中
 * 触发集才替换。空格不隔断（PDF 提取与模型输出都常在变量间加空格），
 * 其余字符（含数字、标点、普通汉字）都隔断。
 */
function repairAmplified(text) {
  if (!/[荞株]/.test(text)) return { text, fixed: 0 }
  let fixed = 0
  const out = text.replace(/[荞株]/g, (ch, offset) => {
    let left = ''
    for (let i = offset - 1; i >= 0; i--) {
      const c = text[i]
      if (c === ' ' || c === '\u3000' || c === '\t' || c === '\n' || c === '\r') continue
      left = c
      break
    }
    let right = ''
    for (let i = offset + 1; i < text.length; i++) {
      const c = text[i]
      if (c === ' ' || c === '\u3000' || c === '\t' || c === '\n' || c === '\r') continue
      right = c
      break
    }
    if (triggersMathContext(left) || triggersMathContext(right)) {
      fixed += 1
      return AMPLIFIED_MAP[ch]
    }
    return ch
  })
  return { text: out, fixed }
}

/** 单字符判定：是否属于可疑区块 */
function inSuspiciousRange(code) {
  return SUSPICIOUS_RANGES.some(([lo, hi]) => code >= lo && code <= hi)
}

/** 全部可能被修复的字符（映射表 + 图示部件 + 可疑区块 + 放大字形），用于快速预检 */
const REPAIR_CLASS = `[${REPAIR_KEYS.join('')}${ARTIFACT_CHARS}荞株\\u7280-\\u72ff\\u70c0-\\u70d5\\u69e1\\u9cf0]`
/** 预检用：不带 g，避免 test() 的 lastIndex 副作用 */
const REPAIR_TEST = new RegExp(REPAIR_CLASS)
/** 替换用：全局匹配 */
const REPAIR_REPLACE = new RegExp(REPAIR_CLASS, 'g')

/**
 * 修复一段文本。
 * @param {string} input 原始文本（PDF 提取结果、用户输入或模型输出）
 * @returns {{text:string, fixed:number, stripped:number, changed:boolean}}
 *   fixed=按映射表与放大字形还原的字符数；stripped=清除的图示部件/未知损坏字数
 */
export function repairText(input) {
  const raw = String(input ?? '')
  if (!raw || !REPAIR_TEST.test(raw)) {
    return { text: raw, fixed: 0, stripped: 0, changed: false }
  }
  let fixed = 0
  let stripped = 0
  let text = raw.replace(REPAIR_REPLACE, (ch) => {
    const mapped = REPAIR_MAP[ch]
    if (mapped) {
      fixed += 1
      return mapped
    }
    if (ARTIFACT_SET.has(ch)) {
      stripped += 1
      return ''
    }
    if (BLOCK_COMMON_SET.has(ch)) return ch
    // 放大字形（荞/株）本身是正常汉字，交由第二轮上下文判定，不在此清除
    if (AMPLIFIED_MAP[ch]) return ch
    // 同字体家族但未观测到的损坏字（如尚未出现过的 e/i/j/o 字母映射）
    stripped += 1
    return ''
  })
  // 第二轮：模型放大字形的上下文感知修复（狆狇→“荞株” 的逆向还原）。
  // 必须在映射表之后跑——“狆株”先变“p株”，株 才能凭左邻拉丁字母命中触发集。
  const amplified = repairAmplified(text)
  fixed += amplified.fixed
  text = amplified.text
  // 删除图示部件/损坏字后可能残留连续空格（如“（ ）”变“（  ）”），折叠回单空格
  if (stripped > 0 && text !== raw) {
    text = text.replace(/ {2,}/g, ' ')
  }
  return { text, fixed, stripped, changed: fixed + stripped > 0 }
}

/** 只检测不修改，供 UI 提示“发现 N 处乱码” */
export function detectGarbled(input) {
  const result = repairText(input)
  return { fixed: result.fixed, stripped: result.stripped, changed: result.changed }
}

/**
 * 深修复：递归处理 JSON / 对象 / 数组中的所有字符串。
 * 模型输出（板书、题目、大纲）在进入归一化之前统一过一遍。
 */
export function repairDeepWithReport(value) {
  let fixed = 0
  let stripped = 0
  const walk = (node) => {
    if (typeof node === 'string') {
      const result = repairText(node)
      fixed += result.fixed
      stripped += result.stripped
      return result.text
    }
    if (Array.isArray(node)) return node.map(walk)
    if (node && typeof node === 'object') {
      const out = {}
      for (const [key, item] of Object.entries(node)) {
        out[typeof key === 'string' ? repairText(key).text : key] = walk(item)
      }
      return out
    }
    return node
  }
  const repaired = walk(value)
  return { value: repaired, fixed, stripped, changed: fixed + stripped > 0 }
}

/** 深修复（不关心统计信息时使用） */
export function repairDeep(value) {
  return repairDeepWithReport(value).value
}

/**
 * 用户输入净化：修复已知乱码，并给出可展示给用户的说明。
 * @returns {{text:string, notice:string}}
 */
export function sanitizeUserInput(input, { maxLength = 2000 } = {}) {
  const result = repairText(String(input ?? '').slice(0, maxLength))
  const notice =
    result.fixed + result.stripped > 0
      ? `检测到 ${result.fixed + result.stripped} 个乱码字符（多因从 PDF 复制文本所致），已自动清理。`
      : ''
  return { text: result.text, notice }
}

export const TEXT_REPAIR_VERSION = 'pdf-tounicode-repair-2026-11-07'
