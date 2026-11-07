import { COURSE_OUTLINE, getOutlineByTitle } from '../mock/courseOutline.js'
import { simulationModel, clampParams } from './knowledgeVisualization.js'

export const BOARD_BLOCK_TYPES = [
  'outline',
  'definition',
  'table',
  'diagram',
  'animation',
  'simulation',
  'callout',
  'question',
]

function text(value, max = 240) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function strings(value, maxItems = 8) {
  return (Array.isArray(value) ? value : [])
    .map((item) => text(item, 120))
    .filter(Boolean)
    .slice(0, maxItems)
}

function normalizeBlock(raw) {
  const type = text(raw?.type, 24).toLowerCase()
  if (!BOARD_BLOCK_TYPES.includes(type)) return null

  if (type === 'outline') {
    const items = strings(raw.items, 8)
    if (!items.length) return null
    return { type, title: text(raw.title, 60) || '本节路线图', items }
  }

  if (type === 'definition') {
    const term = text(raw.term, 60)
    const definition = text(raw.definition, 320)
    if (!term || !definition) return null
    return {
      type,
      title: text(raw.title, 60) || '核心概念',
      term,
      definition,
      analogy: text(raw.analogy, 180),
    }
  }

  if (type === 'table') {
    const columns = strings(raw.columns, 4)
    const rows = (Array.isArray(raw.rows) ? raw.rows : [])
      .map((row) => (Array.isArray(row) ? strings(row, columns.length) : []))
      .filter((row) => row.length === columns.length)
      .slice(0, 8)
    if (columns.length < 2 || !rows.length) return null
    return { type, title: text(raw.title, 60) || '对照表', columns, rows }
  }

  if (type === 'diagram') {
    const nodes = (Array.isArray(raw.nodes) ? raw.nodes : [])
      .map((node) => {
        if (typeof node === 'string') return { label: text(node, 36), note: '' }
        return {
          label: text(node?.label, 36),
          note: text(node?.note, 90),
        }
      })
      .filter((node) => node.label)
      .slice(0, 5)
    if (nodes.length < 2) return null
    return {
      type,
      title: text(raw.title, 60) || '关系图',
      nodes,
      caption: text(raw.caption, 180),
    }
  }

  if (type === 'animation') {
    const steps = (Array.isArray(raw.steps) ? raw.steps : [])
      .map((step, index) => {
        if (typeof step === 'string') {
          return { label: `第 ${index + 1} 步`, detail: text(step, 180) }
        }
        return {
          label: text(step?.label, 48) || `第 ${index + 1} 步`,
          detail: text(step?.detail ?? step?.text, 220),
        }
      })
      .filter((step) => step.detail)
      .slice(0, 5)
    if (steps.length < 2) return null
    return {
      type,
      title: text(raw.title, 60) || '分步演示',
      caption: text(raw.caption, 180),
      steps,
    }
  }

  if (type === 'simulation') {
    // 受控交互模型：只接受注册表内的 model id，参数收敛回模型声明范围
    const registered = simulationModel(raw?.model)
    if (!registered) return null
    const params = clampParams(registered, raw?.params)
    const observe = (Array.isArray(raw?.observe) ? raw.observe : [])
      .map((task) => text(task, 180))
      .filter(Boolean)
      .slice(0, 4)
    return {
      type,
      model: registered.id,
      title: text(raw.title, 60) || `动手看：${registered.label}`,
      params,
      observe: observe.length ? observe : registered.observe.slice(0, 3),
      linkConcept: text(raw.linkConcept, 60),
      caption: text(raw.caption, 180),
    }
  }

  if (type === 'callout') {
    const body = text(raw.text, 320)
    if (!body) return null
    const tone = ['note', 'warn', 'idea'].includes(raw.tone) ? raw.tone : 'note'
    return { type, title: text(raw.title, 60) || '学习提示', tone, text: body }
  }

  const prompt = text(raw.prompt, 260)
  const options = strings(raw.options, 4)
  if (!prompt) return null
  return {
    type: 'question',
    title: text(raw.title, 60) || '停下来想一想',
    prompt,
    options,
  }
}

/**
 * 只接受结构化 block，拒绝 HTML 与自由画布指令。
 * 模型或缓存数据都必须经过这里后才能进入渲染器。
 */
export function normalizeBoardLesson(raw, fallbackChapter = '') {
  const source = raw?.lesson && typeof raw.lesson === 'object' ? raw.lesson : raw
  const blocks = (Array.isArray(source?.blocks) ? source.blocks : [])
    .map(normalizeBlock)
    .filter(Boolean)
    .slice(0, 8)
  if (!blocks.length) return null

  const hasQuestion = blocks.some((block) => block.type === 'question')
  if (!hasQuestion) {
    blocks.push({
      type: 'question',
      title: '停下来想一想',
      prompt: '如果把这个概念放进一个真实案例，你认为最先需要判断的适用条件是什么？',
      options: [],
    })
  }

  return {
    chapter: text(source?.chapter, 80) || fallbackChapter,
    title: text(source?.title, 80) || '本节板书讲解',
    subtitle: text(source?.subtitle, 140) || '按“框架 → 概念 → 对照 → 追问”的顺序展开',
    blocks,
  }
}

function shorten(value, max = 64) {
  const normalized = text(value, max + 1)
  return normalized.length > max ? `${normalized.slice(0, max)}…` : normalized
}

/** 教师确认稿驱动的确定性板书，断网或未配置模型时仍可完整演示。 */
export function buildLocalBoardLesson(chapterTitle) {
  const chapter =
    getOutlineByTitle(chapterTitle) ||
    COURSE_OUTLINE.find((item) => item.title.includes(chapterTitle || '')) ||
    COURSE_OUTLINE[2]
  const points = chapter.keyPoints
  const primary = points[0]
  const comparison = points.slice(0, 3)
  const raw = {
    chapter: chapter.title,
    title: chapter.theme,
    subtitle: `从“${primary.term}”出发，先把概念边界和适用条件讲清楚`,
    blocks: [
      {
        type: 'outline',
        title: '本节路线图',
        items: [
          `先看问题：${chapter.summary.split('、')[0]}`,
          `再抓概念：${primary.term}`,
          `放进案例：判断条件与行动`,
        ],
      },
      {
        type: 'definition',
        title: '核心概念',
        term: primary.term,
        definition: primary.definition,
        analogy: primary.examTip || '先抓住概念要解决的问题，再记它的构成要素。',
      },
      {
        type: 'table',
        title: '概念对照',
        columns: ['概念', '一句话解释', '案例里的用法'],
        rows: comparison.map((point) => [
          point.term,
          shorten(point.definition, 52),
          shorten(point.examTip || '用它解释现象并说明判断依据', 42),
        ]),
      },
      {
        type: 'diagram',
        title: '从情境到判断',
        nodes: [
          { label: '识别现象', note: '案例里发生了什么' },
          { label: '匹配概念', note: primary.term },
          { label: '说明依据', note: '定义与适用条件' },
          { label: '给出行动', note: '下一步做什么' },
        ],
        caption: '板书只展示判断链，不替学生跳过推理。',
      },
      {
        type: 'callout',
        title: '材料依据',
        tone: 'note',
        text: `本页来自教师确认稿「${chapter.title}」。页码级引用尚未接入，当前只标注章级来源。`,
      },
      {
        type: 'question',
        title: '停下来想一想',
        prompt: `如果案例只告诉你“效率下降”，你会先用“${primary.term}”检查哪一件事？`,
        options: ['先检查概念是否适用', '先直接提出解决方案'],
      },
    ],
  }
  return normalizeBoardLesson(raw, chapter.title)
}

/** 把结构化板书压成问答上下文，避免把整个 UI 状态塞给模型。 */
export function boardToContext(lesson) {
  if (!lesson?.blocks?.length) return ''
  return lesson.blocks
    .map((block) => {
      if (block.type === 'outline') return `路线：${block.items.join('；')}`
      if (block.type === 'definition') {
        return `概念：${block.term}。定义：${block.definition}。`
      }
      if (block.type === 'table') {
        return `对照：${block.columns.join(' / ')}；${block.rows
          .map((row) => row.join(' / '))
          .join('；')}`
      }
      if (block.type === 'diagram') {
        return `判断链：${block.nodes.map((node) => node.label).join(' → ')}`
      }
      if (block.type === 'animation') {
        return `分步演示：${block.steps
          .map((step) => `${step.label}（${step.detail}）`)
          .join(' → ')}`
      }
      if (block.type === 'simulation') {
        const paramText = Object.entries(block.params || {})
          .map(([key, value]) => `${key}=${value}`)
          .join('，')
        const observe = (block.observe || []).join('；')
        return `交互模型（${block.title}${block.linkConcept ? `，回指概念：${block.linkConcept}` : ''}）：当前参数 ${paramText}。观察任务：${observe}`
      }
      if (block.type === 'callout') return `提示：${block.text}`
      if (block.type === 'question') return `追问：${block.prompt}`
      return ''
    })
    .filter(Boolean)
    .join('\n')
}
