/**
 * extract-textbook-excerpts.mjs — 主题相关教材切片摘录提取（构建前离线运行一次）
 *
 * 背景：赛题教材切片 B01–B08 由方正书版类排版系统产出，PDF 视觉层正常，但
 * 文本层 ToUnicode CMap 损坏（拉丁字母/数学符号被替换为形态相近的稀有汉字，
 * 如 狓→x、犿→m、狀→n、狆→p）。直接提取会产生乱码，必须先经
 * src/utils/textRepair.js 的确定性规则修复。
 *
 * 方案（详见 docs/competition/DATA-AVAILABILITY-2026-11-07.md 第 4 节）：
 *   1. pdfjs-dist 逐页 getTextContent，按坐标重建阅读行（Y 容差 4pt，
 *      行内按 x 排序拼接，间距过大处补空格）；
 *   2. 组合字符（循环点 U+E5F9）先附着到前一字符，避免被坐标切成独立行；
 *   3. 方正私有区符号映射（E010=.、E011=1、E012=*、E054=℃、E5C6=图示部件删除）；
 *   4. 分数排版（分子在上、分母在下）按“纯数字行 + 单字母行 + 运算符行”合并；
 *   5. textRepair.repairText 修复乱码，清除修复后产生的空行；
 *   6. 按左边距判断续行：顶格行并入上一段，首行缩进行另起段落；
 *   7. 全角数字/字母/数学符号归一为半角；全角句号在数字间是小点、其余是句号；
 *   8. 识别“第X章”与“X.Y / X.Y.Z”小节标题切分，限额保留段落；
 *   9. 生成 src/competition/textbookExcerpts.js 随前端构建打包。
 *
 * 只提取与赛题三个主题直接相关的 B02（不等式）/B05（代数式、整式）/B06（方程），
 * 其余五本保持章级索引，控制公网包体积。
 *
 * 已知局限：PDF 中以矢量线条绘制的符号（如电子表格公式 "=A1^2" 的插入符 ^）
 * 不在文本层，提取后会缺失；摘录仅用于出处核对与阅读参考。
 *
 * 用法：
 *   node scripts/extract-textbook-excerpts.mjs            # 提取并写生成物
 *   node scripts/extract-textbook-excerpts.mjs --check    # 只试运行，不写文件
 *   node scripts/extract-textbook-excerpts.mjs --stdout   # 结果打印到标准输出
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
const { repairText, detectGarbled } = await import('../src/utils/textRepair.js')

const here = path.dirname(fileURLToPath(import.meta.url))
const PDF_DIR =
  process.env.TEXTBOOK_PDF_DIR ||
  path.resolve(
    here,
    '../../【赛题材料】智慧学伴/赛题数据/赛题资料包/5_课程标准及相关教学资源',
  )
const OUTPUT = path.resolve(here, '../src/competition/textbookExcerpts.js')

/** 主题相关教材：编号 → 册别章节（与题目与材料.csv 的教材索引一致） */
const TARGET_BOOKS = [
  { id: 'B02', title: '七年级下册 第十一章 不等式与不等式组', topics: ['T03', 'T02'] },
  { id: 'B05', title: '七年级上册 第三章 代数式；第四章 整式的加减', topics: ['T01'] },
  {
    id: 'B06',
    title: '七年级上册 第五章 一元一次方程；七年级下册 第十章 二元一次方程组',
    topics: ['T02', 'T01'],
  },
]

const MAX_SECTIONS_PER_BOOK = 10
const MAX_PARAGRAPHS_PER_SECTION = 4
const MAX_PARAGRAPH_CHARS = 400
const MAX_TOTAL_PARAGRAPHS = 90

const CHAPTER_RE = /^第[一二三四五六七八九十百]+章\s*(.*)$/
const SECTION_RE = /^(\d{1,2}(?:\.\d{1,2}){1,2})\s+(\S.*)$/
const RUNNING_HEAD_RE = /^第[一二三四五六七八九十百]+章/
const PURE_NUMBER_RE = /^\d{1,4}$/
const LINE_Y_TOLERANCE = 4
/** 行内分栏边界：间距超过 12pt 且下一片段起点在 x>300 的右侧区域时断开
 * （正文与右边注同处一个 y 带，pdfjs 会把它们排进行内，必须分离） */
const COLUMN_GAP = 12
const COLUMN_RIGHT_X = 300
/** 无实义段落（仅符号/标记，如孤立的“①”或破折号行） */
const NO_CONTENT_RE = /^[^\u4e00-\u9fa5a-zA-Z0-9]*$/

/**
 * 方正私有区（PUA）符号映射。依据：PyMuPDF 渲染逐字目视核对（2026-11-07）。
 *   E010 → 小数点（小节编号 11.1.1 中的 "."）
 *   E011 → 数字 1（图题/编号字体，如“图 11.1-1”的首位 1）
 *   E012 → 乘号 *（电子表格公式 "=A1^2*2+B1*3" 中的星号）
 *   E054 → 摄氏度 ℃（"（℃）"单位标注）
 *   E5C6 → 流程图片括号部件（"→┐→消元"），纯图示，删除
 *   E5F9 → 循环点（无限循环小数 0.7 数字上方的点），转为组合符 U+0307
 * 其余私有区字符按乱码清除。
 */
const PUA_MAP = {
  '\uE010': '.',
  '\uE011': '1',
  '\uE012': '*',
  '\uE054': '℃',
  '\uE5C6': '',
  '\uE5F9': '\u0307',
}
const COMBINING_ONLY_RE = /^[\u0300-\u036F]+$/

/** 字符视觉宽度（em）：CJK/全角 1.0，其余 0.5 */
function charEm(ch) {
  const code = ch.codePointAt(0)
  if (code > 0x2e7f) return 1
  return 0.5
}

function itemEmWidth(item) {
  const size = Math.abs(item.transform[3]) || 10
  const em = [...item.str].reduce((sum, ch) => sum + charEm(ch), 0)
  return em * size
}

function mapPua(text) {
  let out = ''
  for (const ch of text) {
    const code = ch.codePointAt(0)
    if (code >= 0xe000 && code <= 0xf8ff) {
      out += PUA_MAP[ch] ?? ''
    } else {
      out += ch
    }
  }
  return out
}

/** 组合字符（循环点）先附着到前一 item，避免因 y 偏高被切成独立行 */
function attachCombining(items) {
  const merged = []
  for (const item of items) {
    if (!('str' in item)) continue
    const mapped = mapPua(item.str)
    if (COMBINING_ONLY_RE.test(mapped) && merged.length) {
      merged[merged.length - 1].str += mapped
      continue
    }
    merged.push({ ...item, str: mapped })
  }
  return merged
}

/** 行重建：同一视觉行内的 item 按 x 排序拼接；间距过大处补一个空格。
 * 同一 y 带内若出现“大间距 + 右侧起点”的分栏边界（右边注与正文同带），
 * 切分为多个独立行，避免边注文字混入正文行。 */
function linesFromItems(items, pageNo, pageHeight) {
  const groups = []
  let current = null
  for (const item of items) {
    const y = item.transform[5]
    const x = item.transform[4]
    if (!current || Math.abs(current.y - y) > LINE_Y_TOLERANCE) {
      current = { y, parts: [] }
      groups.push(current)
    }
    current.parts.push({ x, str: item.str, item })
  }
  const lines = []
  for (const group of groups) {
    const parts = group.parts.slice().sort((a, b) => a.x - b.x)
    // 先按分栏边界切段
    const segments = []
    let segment = []
    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index]
      if (index > 0 && segment.length) {
        const prev = parts[index - 1]
        const prevEnd = prev.x + itemEmWidth(prev.item)
        const gap = part.x - prevEnd
        if (gap > COLUMN_GAP && part.x > COLUMN_RIGHT_X) {
          segments.push(segment)
          segment = []
        }
      }
      segment.push(part)
    }
    if (segment.length) segments.push(segment)
    // 每段独立成行；段内间距超过 0.4 倍字号补一个空格
    for (const seg of segments) {
      let text = ''
      for (let index = 0; index < seg.length; index += 1) {
        const part = seg[index]
        if (index > 0) {
          const prev = seg[index - 1]
          const prevEnd = prev.x + itemEmWidth(prev.item)
          const gap = part.x - prevEnd
          const size = Math.abs(part.item.transform[3]) || 10
          if (gap > size * 0.4) text += ' '
        }
        text += part.str
      }
      const trimmed = text.replace(/\s+$/, '')
      if (trimmed) lines.push({ page: pageNo, x: seg[0].x, y: group.y, text: trimmed })
    }
  }
  return lines.filter((line) => {
    if (!line.text.trim()) return false
    const trimmed = line.text.trim()
    // 页眉（running head）与页码剔除
    if (
      line.y < 60 &&
      (RUNNING_HEAD_RE.test(trimmed) || PURE_NUMBER_RE.test(trimmed))
    )
      return false
    if (line.y > pageHeight - 90 && PURE_NUMBER_RE.test(trimmed)) return false
    return true
  })
}

/** 全角数字/字母/数学符号归一为半角；中文标点保留全角 */
function normalizeMathTypography(text) {
  return (
    text
      .replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      .replace(/[\uFF21-\uFF3A]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      .replace(/[\uFF41-\uFF5A]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      // 全角句号：数字之间是小点（2.5），其余是中文句号
      .replace(/(?<=\d)\uFF0E(?=\d)/g, '.')
      .replace(/\uFF0E/g, '。')
      .replace(/\uFF0F/g, '/')
      .replace(/(?<=\d)\uFF1A(?=\d)/g, ':')
      .replace(/[\uFF1C\u003C]/g, '<')
      .replace(/[\uFF1E\u003E]/g, '>')
      .replace(/[\uFF1D\u003D]/g, '=')
      .replace(/[\uFF0B\u002B]/g, '+')
      .replace(/[\uFF0D\u2212]/g, '-')
      .replace(/[ \t]{2,}/g, ' ')
      .trim()
  )
}

/**
 * 英文术语分词：方正 PDF 把英文按字母切成多个 item，词间空格仅体现在
 * 字符步进上且常落在 item 内部，坐标层面无法恢复，提取后呈
 * "systemoflinearinequalities" 状。用最小数学术语词典做贪心最长匹配还原。
 * 仅处理长度 ≥ 8 的连续小写串，避免误动短词。
 */
const ENGLISH_WORD_LIST = [
  'systems', 'system', 'linear', 'nonlinear',
  'equations', 'equation', 'equalities', 'equality',
  'inequalities', 'inequality', 'expressions', 'expression',
  'unknowns', 'unknown', 'variables', 'variable',
  'solutions', 'solution', 'values', 'value',
  'constants', 'constant', 'numbers', 'number',
  'without', 'with', 'between', 'among',
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'the', 'and', 'for', 'from', 'into', 'over', 'under',
  'of', 'in', 'on', 'to', 'by', 'at', 'as', 'or', 'is', 'are', 'be', 'it', 'its', 'an', 'a',
]
const ENGLISH_WORDS = new Set(ENGLISH_WORD_LIST)
const MAX_ENGLISH_WORD_LEN = Math.max(...ENGLISH_WORD_LIST.map((w) => w.length))

function splitEnglishRun(run) {
  if (run.length < 8) return run
  const words = []
  let index = 0
  while (index < run.length) {
    let matched = ''
    for (let len = Math.min(MAX_ENGLISH_WORD_LEN, run.length - index); len >= 2; len -= 1) {
      const candidate = run.slice(index, index + len)
      if (ENGLISH_WORDS.has(candidate)) {
        matched = candidate
        break
      }
    }
    if (!matched) {
      // 词典未覆盖：原样保留当前字符，避免丢字
      words.push(run[index])
      index += 1
      continue
    }
    words.push(matched)
    index += matched.length
  }
  return words.join(' ')
}

/** 对文本中所有长小写串应用英文术语分词 */
function splitEnglishWords(text) {
  return text.replace(/[a-z]{8,}/g, (run) => splitEnglishRun(run))
}

/** 分数排版合并：分子行（纯数字/代数式）+ 分母行（单token）+ 续行（运算符/标点开头）
 *
 * 方正排版把分数排成三行：分子在上（y 大）、分母在下（y 小约 15pt）、
 * 续行与分子等高（y 差 < 14pt）。三行特征 + y 邻接关系共同判定，避免误合并。
 * 注意：调用前必须已完成 normalizeMathTypography（正则以半角数字为前提）。
 */
const FRACTION_NUMERATOR_RE = /^[\dA-Za-z][\dA-Za-z\s+\-.·×]{0,11}$/
const FRACTION_DENOMINATOR_RE = /^[A-Za-z0-9]{1,3}$/
const FRACTION_CONTINUATION_RE = /^[<>=+\-，,、；;]/

function mergeFractionLines(lines) {
  const merged = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const next = lines[index + 1]
    const after = lines[index + 2]
    const numeratorText = line.text.trim()
    const numerator =
      FRACTION_NUMERATOR_RE.test(numeratorText) &&
      /\d/.test(numeratorText) &&
      numeratorText.length <= 12
    // 分母紧贴分子下方（正常行距约 21pt，分数分母间距约 15pt）
    const denominatorGap = next ? next.y - line.y : 0
    const denominator =
      next &&
      FRACTION_DENOMINATOR_RE.test(next.text.trim()) &&
      denominatorGap <= -8 &&
      denominatorGap >= -20
    // 续行与分子等高（落在同一视觉行上）
    const continuation =
      after &&
      FRACTION_CONTINUATION_RE.test(after.text.trim()) &&
      Math.abs(after.y - line.y) < 14
    if (numerator && denominator && continuation) {
      merged.push({
        ...line,
        text: `${numeratorText}/${next.text.trim()}${after.text.trim()}`.replace(
          /\s*([<>=])\s*/g,
          '$1',
        ),
      })
      index += 2
      continue
    }
    merged.push(line)
  }
  return merged
}

/** 正文左边距：出现频率最高的行首 x（取众数） */
function detectMargin(lines) {
  const counts = new Map()
  for (const line of lines) {
    const text = line.text.trim()
    if (text.length < 4) continue
    if (line.x > 150) continue
    const key = Math.round(line.x / 4) * 4
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  let best = 54
  let bestCount = 0
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key
      bestCount = count
    }
  }
  return best
}

const CJK_CHAR_RE = /[\u4e00-\u9fa5]/
const SENTENCE_END_RE = /[。！？；：]$/
/** 正常行距约 21pt；超过 1.5 倍行距判定为不同块（如跨图形），不做续行合并 */
const MAX_CONTINUATION_PITCH = 32

/**
 * 按左边距合并续行：顶格行并入上一段，缩进行另起段落。
 * 另处理“居中排版”段落（如章首语）：段首 x 大于左边距，但上一段
 * 不以句读收尾、以汉字结尾，当前行以汉字开头且行距正常时，判定为同段续行。
 * 分栏感知：右边注（x≥300）与正文同处一页且 y 交错，续行只并入
 * **本栏**的最后一段，避免边注楔入正文段；正文行跨过边注后仍能
 * 与前面的正文段续接（如“……路程是未知”＋“的。如果设……”）。
 * 返回 [{ x, y, page, pageEnd, text }]，保留首行坐标与页码范围。
 */
function joinParagraphLines(lines, margin) {
  const paragraphs = []
  const lastByColumn = new Map()
  for (const line of lines) {
    const text = line.text.trim()
    if (!text || NO_CONTENT_RE.test(text)) continue
    const column = line.x < COLUMN_RIGHT_X ? 0 : 1
    const last = lastByColumn.get(column)
    const isContinuation = line.x < margin + 6 && last !== undefined
    let continuesSentence = false
    if (last) {
      const prev = last.text
      const pitch = last.y - line.y
      continuesSentence =
        pitch > 0 &&
        pitch < MAX_CONTINUATION_PITCH &&
        !SENTENCE_END_RE.test(prev) &&
        CJK_CHAR_RE.test(prev[prev.length - 1] || '') &&
        CJK_CHAR_RE.test(text[0])
    }
    if ((isContinuation || continuesSentence) && last) {
      last.text += text
      last.pageEnd = line.page
      last.y = line.y
    } else {
      const paragraph = {
        x: line.x,
        y: line.y,
        page: line.page,
        pageEnd: line.page,
        text,
      }
      paragraphs.push(paragraph)
      lastByColumn.set(column, paragraph)
    }
  }
  return paragraphs
}

/** 超长段落在句读边界截断，保留语义完整；找不到句读则硬截并加省略号 */
function truncateParagraph(text) {
  if (text.length <= MAX_PARAGRAPH_CHARS) return text
  const slice = text.slice(0, MAX_PARAGRAPH_CHARS)
  let best = -1
  for (const stop of ['。', '；', '！', '？']) {
    const at = slice.lastIndexOf(stop)
    if (at > best) best = at
  }
  if (best > MAX_PARAGRAPH_CHARS * 0.5) return slice.slice(0, best + 1)
  return slice + '…'
}

/**
 * 章节切分：章标题 / 小节标题 → sections[{chapter, code, title, paragraphs, pages}]
 * 小节内按“段落缓冲”模式收集视觉行，节末统一做续行合并并限额，
 * 避免把同一段的多个视觉行误切成独立段落。
 */
function splitSections(lines, margin) {
  const sections = []
  let chapter = ''
  let current = null
  let buffer = []

  const flush = () => {
    if (!current) return
    const paragraphs = joinParagraphLines(buffer, margin)
      .slice(0, MAX_PARAGRAPHS_PER_SECTION)
      .map((paragraph) => truncateParagraph(paragraph.text))
    current.paragraphs.push(...paragraphs)
    if (buffer.length) current.pages[1] = buffer[buffer.length - 1].page
    if (current.paragraphs.length) sections.push(current)
    buffer = []
  }

  for (const line of lines) {
    const text = line.text.trim()
    const chapterMatch = CHAPTER_RE.exec(text)
    const sectionMatch = SECTION_RE.exec(text)
    // 真小节标题形如“不等式及其解集”“代入消元法”：含汉字、≤24 字、不含数字。
    // 表格数据行（如“1.5 3级 2600 800”）会匹配小节编号模式，按含数字排除。
    const validSection =
      sectionMatch &&
      /[\u4e00-\u9fa5]/.test(sectionMatch[2]) &&
      sectionMatch[2].length <= 24 &&
      !/\d/.test(sectionMatch[2])
    if (chapterMatch && !sectionMatch) {
      flush()
      current = null
      chapter = text
      continue
    }
    if (validSection) {
      flush()
      current = {
        chapter,
        code: sectionMatch[1],
        title: sectionMatch[2],
        paragraphs: [],
        pages: [line.page, line.page],
      }
      continue
    }
    if (!current) {
      current = {
        chapter,
        code: '',
        title: '章首',
        paragraphs: [],
        pages: [line.page, line.page],
      }
    }
    buffer.push(line)
  }
  flush()
  return sections
}

/** 超量时优先舍弃“章首”伪小节（章引言），保留真正的小节 */
function trimSections(sections) {
  if (sections.length <= MAX_SECTIONS_PER_BOOK) return sections
  const real = sections.filter((item) => item.code)
  const intro = sections.filter((item) => !item.code)
  const keepReal = real.slice(0, MAX_SECTIONS_PER_BOOK)
  const slots = Math.max(0, MAX_SECTIONS_PER_BOOK - keepReal.length)
  const kept = new Set([...keepReal, ...intro.slice(0, slots)])
  return sections.filter((item) => kept.has(item))
}

async function extractBook(book) {
  const pdfPath = path.join(PDF_DIR, `${book.id}_相关资料切片.pdf`)
  const data = new Uint8Array(readFileSync(pdfPath))
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise
  const numPages = doc.numPages
  const pageHeight = (await doc.getPage(1)).view[3]

  const rawLines = []
  for (let pageNo = 1; pageNo <= numPages; pageNo += 1) {
    const page = await doc.getPage(pageNo)
    const content = await page.getTextContent()
    rawLines.push(
      ...linesFromItems(attachCombining(content.items), pageNo, pageHeight),
    )
  }
  doc.destroy?.()

  // 先修复乱码（逐行保持结构），再归一化排版；修复后可能产生空行，需再过滤
  let fixed = 0
  let stripped = 0
  const lines = []
  for (const line of rawLines) {
    const result = repairText(line.text)
    fixed += result.fixed
    stripped += result.stripped
    const text = result.text.trim()
    if (!text) continue
    lines.push({ ...line, text })
  }

  const margin = detectMargin(lines)
  // 顺序固定：先归一化数学排版（全角→半角）并做英文术语分词，
  // 再做分数合并（其数字/字母正则以半角为前提），最后清除图形刻度标签行。
  // 若把归一化放到分数合并之后，全角数字行（如"２１０"）将匹配不上分子正则。
  const normalized = lines.map((line) => ({
    ...line,
    text: splitEnglishWords(normalizeMathTypography(line.text)),
  }))
  const merged = mergeFractionLines(normalized).filter((line) => {
    // 残留的纯数字/空格行多为图形刻度标签（如数轴 "0 105"），非正文
    return !/^[\d\s.\-]{1,12}$/.test(line.text)
  })

  const sections = trimSections(splitSections(merged, margin))
  const paragraphCount = sections.reduce(
    (sum, section) => sum + section.paragraphs.length,
    0,
  )
  const excerptText = sections.flatMap((section) => section.paragraphs).join('\n')
  const residualReport = detectGarbled(excerptText)
  const residual = residualReport.fixed + residualReport.stripped

  return {
    id: book.id,
    title: book.title,
    topics: book.topics,
    sourceRef: `5_课程标准及相关教学资源/${book.id}_相关资料切片.pdf`,
    pageCount: numPages,
    margin,
    repairedChars: fixed + stripped,
    sections,
    quality: { paragraphs: paragraphCount, residualGarbled: residual },
  }
}

async function main() {
  const checkOnly = process.argv.includes('--check')
  const stdoutOnly = process.argv.includes('--stdout')
  const books = []
  for (const book of TARGET_BOOKS) {
    const result = await extractBook(book)
    books.push(result)
    console.log(
      `${result.id}: ${result.pageCount} 页 小节 ${result.sections.length} 段落 ${result.quality.paragraphs} 修复字符 ${result.repairedChars} 残留可疑 ${result.quality.residualGarbled}`,
    )
  }
  const totalParagraphs = books.reduce(
    (sum, book) => sum + book.quality.paragraphs,
    0,
  )
  console.log(`合计段落 ${totalParagraphs}（预算 ${MAX_TOTAL_PARAGRAPHS}）`)

  const payload = [
    '/**',
    ' * textbookExcerpts.js — 主题相关教材切片摘录（构建前离线生成，请勿手改）',
    ' *',
    ' * 来源：赛题资料包 5_课程标准及相关教学资源/B02、B05、B06_相关资料切片.pdf。',
    ' * 原 PDF 文本层 ToUnicode 损坏（狓→x 等），本文件已经 src/utils/textRepair.js',
    ' * 确定性修复并归一化数学符号排版；矢量线条绘制的符号（如电子表格公式中的 ^）',
    ' * 不在文本层会缺失，与纸质教材可能存在排版差异，核对以原书为准。',
    ' * 相关资料切片不涉及版权问题，仅供个人学习使用（资料说明.txt）。',
    ' *',
    ' * 生成方式：node scripts/extract-textbook-excerpts.mjs',
    ' */',
    '',
    `export const TEXTBOOK_EXCERPTS_VERSION = 'b02-b05-b06-2026-11-07'`,
    '',
    'export const TEXTBOOK_EXCERPTS = ' + JSON.stringify(books, null, 2),
    '',
    "const EXCERPT_BY_ID = new Map(TEXTBOOK_EXCERPTS.map((item) => [item.id, item]))",
    '',
    '/** 按教材编号取摘录；未提取正文的教材返回 null（调用方回退为纯索引展示） */',
    'export function textbookExcerptById(id) {',
    "  return EXCERPT_BY_ID.get(String(id || '')) || null",
    '}',
    '',
  ].join('\n')

  if (stdoutOnly) {
    console.log(payload)
    return
  }
  if (checkOnly) {
    console.log('--check：仅试运行，未写入文件')
    return
  }
  if (totalParagraphs > MAX_TOTAL_PARAGRAPHS) {
    throw new Error(`摘录段落总数 ${totalParagraphs} 超出预算 ${MAX_TOTAL_PARAGRAPHS}`)
  }
  const residualTotal = books.reduce(
    (sum, book) => sum + book.quality.residualGarbled,
    0,
  )
  if (residualTotal > 0) {
    throw new Error(`摘录仍残留 ${residualTotal} 个可疑乱码字符，拒绝写出`)
  }
  writeFileSync(OUTPUT, payload, 'utf8')
  const sizeKb = (Buffer.byteLength(payload, 'utf8') / 1024).toFixed(1)
  console.log(`已写入 ${OUTPUT}（${sizeKb} KB）`)
}

main().catch((error) => {
  console.error('提取失败：', error.message)
  process.exitCode = 1
})
