import { repairText } from '@/utils/textRepair'

const MAX_EXTRACTED_CHARS = 60_000

function extensionOf(name) {
  return String(name || '').toLowerCase().split('.').pop() || ''
}

/**
 * 提取文本的统一收口：先修复 PDF 文本层损坏导致的乱码
 * （详见 utils/textRepair.js 的背景说明），再归一化空白。
 * 不修复的话，乱码会随材料正文直达知识库与课程生成提示词。
 * @returns {{text:string, fixed:number, stripped:number}}
 */
function normalizeText(value) {
  const repaired = repairText(value)
  const text = String(repaired.text || '')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_EXTRACTED_CHARS)
  return { text, fixed: repaired.fixed, stripped: repaired.stripped }
}

async function extractText(file) {
  return normalizeText(await file.text())
}

async function extractPdf(file) {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default

  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const pages = []
  for (let pageNo = 1; pageNo <= document.numPages; pageNo += 1) {
    const page = await document.getPage(pageNo)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (text) pages.push(`[第 ${pageNo} 页]\n${text}`)
  }
  return normalizeText(pages.join('\n\n'))
}

async function extractDocx(file) {
  const module = await import('mammoth/mammoth.browser.js')
  const mammoth = module.default || module
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return normalizeText(result.value)
}

async function extractPptx(file) {
  const module = await import('jszip')
  const JSZip = module.default || module
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml$/)?.[1] || 0)
      const nb = Number(b.match(/slide(\d+)\.xml$/)?.[1] || 0)
      return na - nb
    })

  const parser = new DOMParser()
  const slides = []
  for (const [index, name] of slideNames.entries()) {
    const xml = await zip.file(name).async('string')
    const doc = parser.parseFromString(xml, 'application/xml')
    const text = [...doc.getElementsByTagName('a:t')]
      .map((node) => node.textContent || '')
      .join('\n')
      .trim()
    if (text) slides.push(`[幻灯片 ${index + 1}]\n${text}`)
  }
  return normalizeText(slides.join('\n\n'))
}

/**
 * 浏览器内提取课程材料正文。解析失败会抛出明确错误，不把空占位内容写进知识库。
 * @returns {Promise<{text:string, repairedChars:number}>}
 *   repairedChars = 自动修复/清理的乱码字符数（PDF 复制文本常见，供 UI 提示）
 */
export async function importMaterialFile(file) {
  const ext = extensionOf(file?.name)
  let extracted = { text: '', fixed: 0, stripped: 0 }

  if (['txt', 'md', 'markdown', 'csv', 'json', 'html', 'htm'].includes(ext)) {
    extracted = await extractText(file)
  } else if (ext === 'pdf') {
    extracted = await extractPdf(file)
  } else if (ext === 'docx') {
    extracted = await extractDocx(file)
  } else if (ext === 'pptx') {
    extracted = await extractPptx(file)
  } else if (ext === 'doc' || ext === 'ppt') {
    throw new Error('旧版 .doc/.ppt 暂不支持，请另存为 .docx/.pptx 后上传')
  } else {
    throw new Error('暂不支持该文件类型')
  }

  const text = extracted.text
  if (!text || text.length < 20) {
    throw new Error('没有提取到足够的文字内容')
  }
  return { text, repairedChars: extracted.fixed + extracted.stripped }
}
