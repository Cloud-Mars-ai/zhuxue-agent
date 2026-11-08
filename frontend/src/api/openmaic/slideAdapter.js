/**
 * OpenMAIC 画布元素 → 结构化板书 blocks（确定性适配器）。
 *
 * 上游 slide 场景产出 PPTElement[]（1000×562.5 自由画布）；本项目渲染器只接受
 * 受控 block（见 utils/board.js BOARD_BLOCK_TYPES，禁 HTML/坐标/脚本）。
 * 本适配器做确定性映射，不做任何创造性发挥：
 *
 * - text 元素按 (top,left) 排序；最大字号（≥24px）或 textType=title → 课程标题
 * - 冒号分割行「术语：解释」→ definition 块（concreteAnchor 用最近要点补齐）
 * - bullet 行/短行（≤40 字）→ outline items
 * - 长行（>40 字非 bullet）→ callout(note)
 * - latex 元素 → outline items（本项目板书以纯文本呈现公式，无 KaTeX 通道）
 * - table 元素 → table 块（首行 columns，其余 rows）
 * - chart 元素 → chart 块（2026-11-08 诊断一：保留图表形态，不再降级为表格；
 *   chartType column/bar→bar、line/area→line、pie/ring→pie、radar/scatter→line）
 * - 多栏版面（诊断一）：正文文本按 left 分桶，≥2 个宽文本桶 → columns 块，
 *   保留 OpenMAIC 画布的横向分栏结构，不再按 top 混排成一行
 * - image 元素 → 关键词对齐内置 SVG 场景库（诊断二：mediaGenerations prompt
 *   优先，其次本页标题/要点）→ illustration 块；对齐不了才丢弃计数
 * - video/audio → 丢弃并计数（本项目无音视频通道）
 * - shape/line 按垂直聚类 → diagram 块（nodes 取聚类框内文本标签）
 *
 * 保证至少 1 个 outline/columns + 1 个 definition/table/diagram/chart/illustration，
 * 否则返回 null，由调用方走本地兜底。所有丢弃计入 result.dropped，进自行检查报告。
 *
 * 硬规则：只用相对导入或不导入，node 测试脚本可直接 import。
 */

import { matchIllustrationScene, ILLUSTRATION_SCENE_IDS, illustrationScene } from '../../utils/illustrationScenes.js'

const CANVAS = { width: 1000, height: 562.5 }
const BULLET = /^\s*(?:[•·●○◆■▶→*-]|\d+[.、)]|\[?\d+\]?)\s*/
// 注意：量词必须写成 {2,30}?（懒标记在括号外）；写成 {2,30?} 会被 V8 解析为
// {2,3} + 字面量 0?，导致「术语：解释」行匹配失败（测试 E1 捕获）。
const DEFINITION = /^(.{2,30}?)[：:]\s*(.{8,})$/

function text(value, max = 240) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

/** HTML 正文 → 纯文本行（保留 <p>/<br> 分段）。 */
export function htmlToLines(html) {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h[1-6]|li|div|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function fontSizeOf(content) {
  const matched = String(content ?? '').match(/font-size:\s*(\d+(?:\.\d+)?)px/i)
  return matched ? Number(matched[1]) : null
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function elementBox(element) {
  const left = isFiniteNumber(element.left) ? element.left : 0
  const top = isFiniteNumber(element.top) ? element.top : 0
  const width = isFiniteNumber(element.width) ? element.width : 0
  const height = isFiniteNumber(element.height) ? element.height : 0
  return { left, top, right: left + width, bottom: top + height, centerY: top + height / 2 }
}

/**
 * 画布边界校验：只对图形元素（shape/line）生效，且按完整画布边界
 * （0..1000 × 0..562.5）而非系统提示的 50px 边距。
 * 原因：边距是模型的输出质量责任，不是我们的输入门槛——实测中模型
 * 经常把文本放到边距外，而文本块映射只按 top 排序、不使用坐标，
 * 因边距丢弃文本会凭空损失内容（live 实测捕获）。
 */
function graphicsWithinCanvas(element) {
  const box = elementBox(element)
  return (
    box.left >= 0 &&
    box.top >= 0 &&
    box.right <= CANVAS.width &&
    box.bottom <= CANVAS.height
  )
}

function clusterShapesAndLines(elements) {
  const graphics = elements
    .filter((element) => (element.type === 'shape' || element.type === 'line') && graphicsWithinCanvas(element))
    .map(elementBox)
    .sort((a, b) => a.top - b.top)
  const clusters = []
  for (const box of graphics) {
    const last = clusters[clusters.length - 1]
    if (last && box.top <= last.bottom + 140) {
      last.bottom = Math.max(last.bottom, box.bottom)
      last.right = Math.max(last.right, box.right)
      last.left = Math.min(last.left, box.left)
      last.count += 1
    } else {
      clusters.push({ ...box, count: 1 })
    }
  }
  return clusters.filter((cluster) => cluster.count >= 2)
}

/**
 * 多栏版面识别（诊断一 F1.3，对应 OpenMAIC 三栏卡片幻灯片）。
 *
 * 按 left 把正文文本分三桶（画布 1000px：<340 / 340–680 / ≥680）；
 * 一桶要算"一栏"须同时满足：
 * - 桶内有宽度 200–560px 的文本元素（通栏文本 >560px 是正文不是栏，
 *   窄条 <200px 是标签/注释）；
 * - 桶内合计 ≥2 行（单行文本更可能是定义句/注释，留给 definition 通道）。
 * ≥2 桶达标才产出 columns 块；桶内首行 ≤12 字升为 heading。
 * 返回 { columns, consumed }——consumed 是被栏目消费的文本签名，
 * 主循环据此跳过，避免同一行文本同时进路线/定义。
 */
function detectColumns(bodyTexts) {
  const buckets = [[], [], []]
  for (const item of bodyTexts) {
    const index = item.box.left < 340 ? 0 : item.box.left < 680 ? 1 : 2
    buckets[index].push(item)
  }
  const isWide = (item) => {
    const width = item.box.right - item.box.left
    return width >= 200 && width <= 560
  }
  const usable = buckets
    .map((items) => ({ items, wide: items.filter(isWide) }))
    .filter((bucket) => bucket.wide.length > 0)
    .map((bucket) => ({
      items: bucket.items,
      lines: bucket.items
        .slice()
        .sort((a, b) => a.box.top - b.box.top)
        .flatMap((item) => item.lines)
        .map((line) => text(line.replace(BULLET, ''), 120))
        .filter((line) => line && !/^公式：/.test(line)),
    }))
    .filter((bucket) => bucket.lines.length >= 2)
  if (usable.length < 2) return null

  const columns = usable.map((bucket) => {
    const heading = bucket.lines[0].length <= 12 ? bucket.lines[0] : ''
    return { heading, items: (heading ? bucket.lines.slice(1) : bucket.lines).slice(0, 6) }
  })
  if (columns.filter((column) => column.items.length).length < 2) return null

  // 只消费达标栏内的宽文本签名；未达标桶的文本仍走 definition/outline 通道
  const consumed = new Set()
  for (const bucket of usable) {
    for (const item of bucket.items) {
      if (isWide(item)) consumed.add(item.lines.join('|'))
    }
  }
  return { columns, consumed }
}

function cellText(cell) {
  if (cell == null) return ''
  if (typeof cell === 'string') return text(cell, 60)
  return text(cell.text ?? cell.content ?? cell.value, 60)
}

/**
 * PPTElement[] → { title, subtitle, blocks, dropped }
 * 失败（块不足）返回 null。
 */
export function slideElementsToLesson(elements, context = {}) {
  if (!Array.isArray(elements) || !elements.length) return null
  const dropped = { media: 0, chart: 0, outOfCanvas: 0, shapeWithoutLabel: 0, outlineFallback: null }
  const keyPoints = Array.isArray(context.keyPoints) ? context.keyPoints.filter(Boolean) : []

  const texts = []
  const latexLines = []
  const tables = []
  const codes = []
  const charts = []
  const illustrations = []
  for (const element of elements) {
    if (!element || typeof element !== 'object') continue
    switch (element.type) {
      case 'text': {
        const lines = htmlToLines(element.content)
        if (!lines.length) break
        texts.push({
          box: elementBox(element),
          lines,
          fontSize: fontSizeOf(element.content),
          textType: element.textType || '',
        })
        break
      }
      case 'latex': {
        const latex = text(element.latex, 160)
        if (latex) latexLines.push(latex)
        break
      }
      case 'table': {
        const rows = Array.isArray(element.data)
          ? element.data.map((row) => (Array.isArray(row) ? row.map(cellText) : []))
          : []
        const usable = rows.filter((row) => row.length >= 2)
        if (usable.length >= 2) tables.push(usable)
        break
      }
      case 'chart': {
        // 诊断一：chart 元素保留为 chart 块（bar/line/pie），不再降级为 table。
        // chartType 映射：column/bar→bar、line/area→line、pie/ring→pie、
        // radar/scatter→line（渲染层只实现三种基本类型）。
        const data = element.data || {}
        const labels = Array.isArray(data.labels) ? data.labels.map(cellText) : []
        const rawSeries = Array.isArray(data.series) ? data.series : []
        const legends = Array.isArray(data.legends) ? data.legends.map(cellText) : []
        const series = rawSeries
          .map((values, index) => ({
            name: legends[index] || `系列${index + 1}`,
            values: (Array.isArray(values) ? values : [])
              .map((value) => Number(value))
              .filter((value) => Number.isFinite(value))
              .slice(0, 8),
          }))
          .filter((item) => item.values.length >= 2)
          .slice(0, 3)
        if (labels.length >= 2 && series.length) {
          const chartType = String(element.chartType || '').toLowerCase()
          const kind = chartType === 'pie' || chartType === 'ring'
            ? 'pie'
            : chartType === 'line' || chartType === 'area' || chartType === 'radar' || chartType === 'scatter'
              ? 'line'
              : 'bar'
          charts.push({
            type: 'chart',
            kind,
            title: '数据图表',
            labels: labels.slice(0, 8),
            series,
            caption: '按图中数据整理，先读趋势再读极值。',
          })
        } else {
          dropped.chart += 1
        }
        break
      }
      case 'code': {
        const lines = Array.isArray(element.lines)
          ? element.lines.map((line) => text(line?.content ?? line?.text ?? line, 120))
          : []
        const code = lines.filter(Boolean).join('\n')
        if (code) codes.push({ language: text(element.language, 20), code })
        break
      }
      case 'shape':
      case 'line': {
        // 图形元素才过画布边界（越界通常是模型坐标幻觉，丢弃并计数）
        if (!graphicsWithinCanvas(element)) dropped.outOfCanvas += 1
        break
      }
      case 'image': {
        // 诊断二：上游 image 走"LLM 写 prompt → 文生图 provider → 资产池回填"，
        // 本项目无文生图后端且禁外链图片；修复 = 对齐内置 SVG 场景库，
        // 产出受控 illustration 块（scene id 白名单，见 utils/illustrationScenes.js）。
        // 匹配信号优先级：
        // 1. src 本身就是场景 id（轻量媒体契约下模型直接引用目录，确定性最强）
        // 2. mediaGenerations prompt（按 elementId 找，未来开启大纲媒体契约时生效）
        // 3. 元素自带 prompt/alt
        // 4. 本页标题与要点（图片通常在图解本页主题）
        const src = text(element.src, 60)
        const sceneFromSrc = ILLUSTRATION_SCENE_IDS.includes(src) ? src : ''
        const mediaRequest = (Array.isArray(context.mediaGenerations) ? context.mediaGenerations : [])
          .find((item) => item && item.elementId === element.id)
        const prompt = text(
          mediaRequest?.prompt ?? element.prompt ?? element.alt ?? element.description ?? '',
          240,
        )
        const matched = sceneFromSrc
          ? { id: sceneFromSrc, label: illustrationScene(sceneFromSrc)?.label || sceneFromSrc }
          : matchIllustrationScene(prompt, context.title, keyPoints)
        if (matched) {
          illustrations.push({
            type: 'illustration',
            scene: matched.id,
            title: text(element.caption, 60) || matched.label,
            caption: prompt ? `图示：${prompt.slice(0, 120)}` : '',
          })
        } else {
          dropped.media += 1
        }
        break
      }
      case 'video':
      case 'audio':
        dropped.media += 1
        break
      default:
        break
    }
  }

  texts.sort((a, b) => a.box.top - b.box.top || a.box.left - b.box.left)
  if (!texts.length && !tables.length) return null

  // ── 先算图形聚类：聚类框内的文本只作 diagram 标签，不进路线/定义 ──
  const clusters = clusterShapesAndLines(elements)
  const clusterLabels = clusters.map((cluster) => ({
    cluster,
    labels: texts
      .filter((item) => item.box.centerY >= cluster.top - 40 && item.box.centerY <= cluster.bottom + 40)
      .flatMap((item) => item.lines)
      .map((line) => text(line.replace(BULLET, ''), 24))
      .filter((label) => label && !/^公式：/.test(label))
      .slice(0, 6),
  }))
  const inCluster = new Set(
    clusterLabels
      .filter((entry) => entry.labels.length >= 2)
      .flatMap((entry) =>
        texts
          .filter((item) => item.box.centerY >= entry.cluster.top - 40 && item.box.centerY <= entry.cluster.bottom + 40)
          .map((item) => item.lines.join('|')),
      ),
  )

  // ── 标题：最大字号优先，textType=title 次之，最后取第一个文本 ──
  let titleIndex = texts.findIndex((item) => item.textType === 'title')
  const biggest = texts.reduce(
    (best, item, index) => (item.fontSize != null && (best.fontSize == null || item.fontSize > best.fontSize) ? { ...item, index } : best),
    { fontSize: null, index: -1 },
  )
  if (biggest.fontSize != null && biggest.fontSize >= 24) titleIndex = biggest.index
  if (titleIndex < 0) titleIndex = 0
  const titleText = texts[titleIndex]?.lines?.[0] || context.title || '本节内容'
  const body = texts.filter((_item, index) => index !== titleIndex)

  const blocks = []
  const outlineItems = []
  let definition = null
  const callouts = []

  // ── 多栏版面（诊断一）：达标分栏的文本由 columns 块消费，不进路线/定义 ──
  const layout = detectColumns(body.filter((item) => !inCluster.has(item.lines.join('|'))))
  const consumedByColumns = layout?.consumed || new Set()

  for (const item of body) {
    if (inCluster.has(item.lines.join('|'))) continue
    if (consumedByColumns.has(item.lines.join('|'))) continue
    for (const line of item.lines) {
      const bullet = line.replace(BULLET, '')
      if (BULLET.test(line) && bullet.length >= 2) {
        // bullet 行优先（"• 术语：解释" 是要点，不是定义块）
        outlineItems.push(text(bullet, 120))
        continue
      }
      const definitionMatch = line.match(DEFINITION)
      if (!definition && definitionMatch && line.length <= 120) {
        definition = {
          type: 'definition',
          title: '核心概念',
          term: text(definitionMatch[1], 60),
          definition: text(definitionMatch[2], 320),
          concreteAnchor:
            text(keyPoints[0], 180) || `先看「${text(definitionMatch[1], 24)}」的一个具体情形，再回到概念边界。`,
        }
        continue
      }
      if (line.length <= 40) {
        outlineItems.push(text(line, 120))
      } else {
        callouts.push({ type: 'callout', title: '学习提示', tone: 'note', text: text(line, 320) })
      }
    }
  }

  for (const latex of latexLines) {
    outlineItems.push(`公式：${latex}`)
  }

  if (outlineItems.length) {
    blocks.push({
      type: 'outline',
      title: '本节路线图',
      items: Array.from(new Set(outlineItems)).slice(0, 8),
    })
  } else if (keyPoints.length && !layout) {
    // 模型未产出可用路线文本时（live 实测捕获：图形密集场景文本稀薄），
    // 用大纲要点兜底——keyPoints 来自同一管线的大纲契约，属确定性数据，
    // 不构成编造；计数进 dropped.outlineFallback 供自行检查观测。
    // 有 columns 块时不再兜底：分栏已经承载本页结构，补路线图反而冗余。
    dropped.outlineFallback = keyPoints.slice(0, 8).map((point) => text(point, 120))
    blocks.push({ type: 'outline', title: '本节路线图', items: dropped.outlineFallback })
  }

  // 分栏版面块（保留 OpenMAIC 横向卡片结构）
  if (layout) {
    blocks.push({ type: 'columns', title: '要点速览', columns: layout.columns })
  }

  // 场景图示（诊断二）：放在定义前，保证 8 块上限时视觉锚点不被裁掉
  for (const illustration of illustrations.slice(0, 2)) {
    blocks.push(illustration)
  }

  if (definition) blocks.push(definition)

  for (const rows of tables.slice(0, 2)) {
    const columns = rows[0].slice(0, 4)
    const bodyRows = rows.slice(1, 7).map((row) => row.slice(0, columns.length))
    if (columns.length >= 2 && bodyRows.length) {
      blocks.push({ type: 'table', title: '内容结构', columns, rows: bodyRows })
    }
  }

  // 数据图表（诊断一：保留图表形态）
  for (const chart of charts.slice(0, 2)) {
    blocks.push(chart)
  }

  // ── 图形聚类 → diagram 块（用预计算的标签；无标签聚类丢弃并计数）──
  for (const entry of clusterLabels.slice(0, 2)) {
    if (entry.labels.length >= 2) {
      blocks.push({
        type: 'diagram',
        title: '关系图',
        nodes: entry.labels.map((label) => ({ label, note: '' })),
        caption: '按图中关系组织理解。',
      })
    } else {
      dropped.shapeWithoutLabel += 1
    }
  }

  for (const item of codes.slice(0, 1)) {
    callouts.push({
      type: 'callout',
      title: item.language ? `代码（${item.language}）` : '代码',
      tone: 'note',
      text: text(item.code, 320),
    })
  }
  blocks.push(...callouts.slice(0, 2))

  // 结构保障：至少 1 个可用块（normalizeBoardLesson 是权威校验，
  // 会自动补 question 块）；空结果判失败，由调用方走本地兜底
  if (!blocks.length) return null

  return {
    title: text(titleText, 60),
    subtitle: text(context.subtitle, 120),
    blocks,
    dropped,
  }
}
