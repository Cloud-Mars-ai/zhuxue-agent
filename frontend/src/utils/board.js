import { COURSE_OUTLINE, getOutlineByTitle } from '../mock/courseOutline.js'
import { simulationModel, clampParams } from './knowledgeVisualization.js'

/**
 * 板书 block 白名单（2026-11-07 依据 41 个教学视频分析扩容）。
 *
 * 原有 8 种覆盖路线/概念/对照/图示/分步/交互/提示/追问；
 * 新增 8 种来自视频证据的图表族与互动形态（报告 C4/B4/D2/D3/B6/B7）：
 * - classification-tree：分类树，支持 grow:"staged" 阶段生长（T4/T5）
 * - number-line：数轴，ticks/points/segments 结构化描述
 * - fill-blank：留白填空，点击空位揭示答案（D2）
 * - wrong-first：错解先行，先看错解再定位错误（B4）
 * - judge：判断对错，双按钮 + 揭示（D3）
 * - case-table：情形讨论表，按 tone 着色（C4）
 * - induction：观察归纳，例题→结论填空→揭晓规则（B6）
 * - multi-solution：一题多解并列（B7）
 *
 * 所有 block 共用可选字段（C2/C5/C6/T1-T12）：
 * - transition: { enter, exit, durationMs, delayMs } 受控枚举 + 毫秒值域
 * - grow: "staged" 阶段生长（classification-tree）
 * - persistent: true 常驻面板，不随揭示进度消失（C5）
 * - marks: [{ target, style }] 文本高亮标记（C6）
 * - reveal: "tap" 需点击后展开（默认 auto 随播放揭示）
 *
 * 硬规则 8：AI 只填 JSON，前端渲染；禁止 HTML/坐标/脚本。
 */
export const BOARD_BLOCK_TYPES = [
  'outline',
  'definition',
  'table',
  'diagram',
  'animation',
  'simulation',
  'callout',
  'question',
  'classification-tree',
  'number-line',
  'fill-blank',
  'wrong-first',
  'judge',
  'case-table',
  'induction',
  'multi-solution',
]

/** transition.enter 受控枚举（对应 T1 逐条弹入 / T2 渐隐 / T3 定向滑入）。 */
export const TRANSITION_ENTER = ['pop', 'fade', 'slide-left', 'slide-right']
export const TRANSITION_EXIT = ['fade', 'none']
/** marks.style 受控枚举（对应 T8 高亮 / T11 红笔圈字 / T12 即时标记）。 */
export const MARK_STYLES = [
  'box',
  'underline',
  'circle',
  'circle-char',
  'cross',
  'check',
  'stop',
]
/** block 内容 tone 枚举（C3：AI 只选 tone，不选色值）。 */
export const BLOCK_TONES = ['neutral', 'negative', 'positive', 'warn']

function text(value, max = 240) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function strings(value, maxItems = 8) {
  return (Array.isArray(value) ? value : [])
    .map((item) => text(item, 120))
    .filter(Boolean)
    .slice(0, maxItems)
}

function number(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/** 转场参数归一：受控枚举 + duration 300–1500ms / delay 0–800ms（报告 §7.3）。 */
function normalizeTransition(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const transition = {}
  if (TRANSITION_ENTER.includes(source.enter)) transition.enter = source.enter
  if (TRANSITION_EXIT.includes(source.exit)) transition.exit = source.exit
  const duration = number(source.durationMs)
  if (duration !== null) {
    transition.durationMs = Math.round(clamp(duration, 300, 1500))
  }
  const delay = number(source.delayMs)
  if (delay !== null) transition.delayMs = Math.round(clamp(delay, 0, 800))
  return Object.keys(transition).length ? transition : null
}

/** 文本高亮标记归一：target 必须在正文中能找到才由渲染层消费。 */
function normalizeMarks(raw) {
  return (Array.isArray(raw) ? raw : [])
    .map((mark) => {
      const target = text(mark?.target ?? mark, 40)
      const style = MARK_STYLES.includes(mark?.style) ? mark.style : 'box'
      return target ? { target, style } : null
    })
    .filter(Boolean)
    .slice(0, 6)
}

/** 通用可选字段：transition / grow / persistent / marks / reveal。 */
function applyCommon(raw, block) {
  const transition = normalizeTransition(raw?.transition)
  if (transition) block.transition = transition
  if (raw?.grow === 'staged') block.grow = 'staged'
  if (raw?.persistent === true) block.persistent = true
  const marks = normalizeMarks(raw?.marks)
  if (marks.length) block.marks = marks
  if (raw?.reveal === 'tap') block.reveal = 'tap'
  return block
}

function normalizeTreeNodes(value, maxItems) {
  return (Array.isArray(value) ? value : [])
    .map((node) => ({
      label: text(node?.label ?? node, 24),
      note: text(node?.note, 90),
    }))
    .filter((node) => node.label)
    .slice(0, maxItems)
}

function normalizeStages(raw, branchCount) {
  const stages = (Array.isArray(raw) ? raw : [])
    .map((stage) => {
      const label = text(stage?.label, 60)
      const indexes = (key) =>
        (Array.isArray(stage?.[key]) ? stage[key] : [])
          .map((index) => Math.round(Number(index)))
          .filter((index) => Number.isInteger(index) && index >= 0 && index < branchCount)
      const branches = [...new Set(indexes('branches'))]
      const expand = [...new Set(indexes('expand'))].filter((index) =>
        branches.includes(index),
      )
      if (!branches.length) return null
      return { label, branches, expand }
    })
    .filter(Boolean)
    .slice(0, 6)
  // 至少一个覆盖全部分支的阶段，否则退化为静态渲染
  if (!stages.length && branchCount) {
    return [
      {
        label: '全貌',
        branches: Array.from({ length: branchCount }, (_, index) => index),
        expand: Array.from({ length: branchCount }, (_, index) => index),
      },
    ]
  }
  return stages
}

function normalizeBlock(raw) {
  const type = text(raw?.type, 24).toLowerCase()
  if (!BOARD_BLOCK_TYPES.includes(type)) return null

  if (type === 'outline') {
    const items = strings(raw.items, 8)
    if (!items.length) return null
    return applyCommon(raw, { type, title: text(raw.title, 60) || '本节路线图', items })
  }

  if (type === 'definition') {
    const term = text(raw.term, 60)
    const definition = text(raw.definition, 320)
    // B2 具体→抽象：concreteAnchor 必填，先给能指认的具体例子再进抽象定义
    const concreteAnchor = text(raw.concreteAnchor, 180)
    if (!term || !definition || !concreteAnchor) return null
    const block = {
      type,
      title: text(raw.title, 60) || '核心概念',
      term,
      definition,
      concreteAnchor,
      analogy: text(raw.analogy, 180),
    }
    const method = strings(raw.method, 3)
    if (method.length) block.method = method
    const verify = text(raw.verify, 140)
    if (verify) block.verify = verify
    return applyCommon(raw, block)
  }

  if (type === 'table') {
    const columns = strings(raw.columns, 4)
    const rows = (Array.isArray(raw.rows) ? raw.rows : [])
      .map((row) => (Array.isArray(row) ? strings(row, columns.length) : []))
      .filter((row) => row.length === columns.length)
      .slice(0, 8)
    if (columns.length < 2 || !rows.length) return null
    return applyCommon(raw, { type, title: text(raw.title, 60) || '对照表', columns, rows })
  }

  if (type === 'diagram') {
    const nodes = normalizeTreeNodes(raw.nodes, 5)
    if (nodes.length < 2) return null
    return applyCommon(raw, {
      type,
      title: text(raw.title, 60) || '关系图',
      nodes,
      caption: text(raw.caption, 180),
    })
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
    return applyCommon(raw, {
      type,
      title: text(raw.title, 60) || '分步演示',
      caption: text(raw.caption, 180),
      steps,
    })
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
    return applyCommon(raw, {
      type,
      model: registered.id,
      title: text(raw.title, 60) || `动手看：${registered.label}`,
      params,
      observe: observe.length ? observe : registered.observe.slice(0, 3),
      linkConcept: text(raw.linkConcept, 60),
      caption: text(raw.caption, 180),
    })
  }

  if (type === 'callout') {
    const body = text(raw.text, 320)
    if (!body) return null
    const tone = ['note', 'warn', 'idea', 'success'].includes(raw.tone) ? raw.tone : 'note'
    const block = { type, title: text(raw.title, 60) || '学习提示', tone, text: body }
    const mnemonic = text(raw.mnemonic, 60)
    if (mnemonic) block.mnemonic = mnemonic
    return applyCommon(raw, block)
  }

  if (type === 'question') {
    const prompt = text(raw.prompt, 260)
    if (!prompt) return null
    const block = {
      type,
      title: text(raw.title, 60) || '停下来想一想',
      prompt,
      options: strings(raw.options, 4),
    }
    if (raw?.by === 'mascot') block.by = 'mascot'
    return applyCommon(raw, block)
  }

  if (type === 'classification-tree') {
    const root = { label: text(raw?.root?.label ?? raw?.root, 24), note: text(raw?.root?.note, 90) }
    const branches = (Array.isArray(raw?.branches) ? raw.branches : [])
      .map((branch) => ({
        label: text(branch?.label, 24),
        note: text(branch?.note, 90),
        children: normalizeTreeNodes(branch?.children, 4),
      }))
      .filter((branch) => branch.label)
      .slice(0, 5)
    if (!root.label || branches.length < 2) return null
    const block = {
      type,
      title: text(raw.title, 60) || '分类树',
      root,
      branches,
      caption: text(raw.caption, 180),
      stages: normalizeStages(raw.stages, branches.length),
    }
    return applyCommon(raw, block)
  }

  if (type === 'number-line') {
    const min = number(raw?.min)
    const max = number(raw?.max)
    if (min === null || max === null || max <= min) return null
    const span = max - min
    const inRange = (value) => value >= min && value <= max
    const ticks = (Array.isArray(raw?.ticks) ? raw.ticks : [])
      .map((tick) => ({ value: number(tick?.value ?? tick), label: text(tick?.label, 12) }))
      .filter((tick) => tick.value !== null && inRange(tick.value))
      .slice(0, 13)
    const points = (Array.isArray(raw?.points) ? raw.points : [])
      .map((point) => ({
        value: number(point?.value),
        label: text(point?.label, 16),
        tone: BLOCK_TONES.includes(point?.tone) ? point.tone : 'neutral',
      }))
      .filter((point) => point.value !== null && inRange(point.value) && point.label)
      .slice(0, 6)
    const segments = (Array.isArray(raw?.segments) ? raw.segments : [])
      .map((segment) => {
        const from = number(segment?.from)
        const to = number(segment?.to)
        if (from === null || to === null) return null
        return {
          from: clamp(Math.min(from, to), min, max),
          to: clamp(Math.max(from, to), min, max),
          label: text(segment?.label, 16),
          tone: BLOCK_TONES.includes(segment?.tone) ? segment.tone : 'neutral',
        }
      })
      .filter(Boolean)
      .slice(0, 3)
    if (!ticks.length && !points.length) return null
    return applyCommon(raw, {
      type,
      title: text(raw.title, 60) || '数轴',
      min,
      max,
      span,
      ticks,
      points,
      segments,
      caption: text(raw.caption, 180),
    })
  }

  if (type === 'fill-blank') {
    const prompt = text(raw.prompt, 320)
    if (!prompt || !prompt.includes('___')) return null
    const blanks = prompt.split('___').length - 1
    const answers = (Array.isArray(raw.answers) ? raw.answers : [])
      .map((answer) => text(answer, 40))
      .filter(Boolean)
    const padded = [...answers]
    while (padded.length < blanks) padded.push('？')
    return applyCommon(raw, {
      type,
      title: text(raw.title, 60) || '留白填空',
      prompt,
      answers: padded.slice(0, Math.max(1, blanks)),
      hint: text(raw.hint, 120),
    })
  }

  if (type === 'wrong-first') {
    const wrongSteps = (Array.isArray(raw?.wrongSteps) ? raw.wrongSteps : [])
      .map((step) => text(step, 200))
      .filter(Boolean)
      .slice(0, 5)
    const correctSteps = (Array.isArray(raw?.correctSteps) ? raw.correctSteps : [])
      .map((step) => text(step, 200))
      .filter(Boolean)
      .slice(0, 5)
    if (wrongSteps.length < 2 || !correctSteps.length) return null
    const errorIndex = Math.round(clamp(Number(raw?.errorIndex) || 0, 0, wrongSteps.length - 1))
    return applyCommon(raw, {
      type,
      title: text(raw.title, 60) || '错解先行',
      wrongSteps,
      errorIndex,
      errorHint: text(raw.errorHint, 140),
      correctSteps,
      takeaway: text(raw.takeaway, 140),
    })
  }

  if (type === 'judge') {
    const statement = text(raw.statement, 260)
    if (!statement) return null
    return applyCommon(raw, {
      type,
      title: text(raw.title, 60) || '判断对错',
      statement,
      answer: raw?.answer === true,
      explanation: text(raw.explanation, 220),
    })
  }

  if (type === 'case-table') {
    const dimension = text(raw.dimension, 40)
    const cases = (Array.isArray(raw?.cases) ? raw.cases : [])
      .map((item) => ({
        condition: text(item?.condition, 60),
        conclusion: text(item?.conclusion, 160),
        tone: BLOCK_TONES.includes(item?.tone) ? item.tone : 'neutral',
      }))
      .filter((item) => item.condition && item.conclusion)
      .slice(0, 5)
    if (!dimension || cases.length < 2) return null
    return applyCommon(raw, {
      type,
      title: text(raw.title, 60) || '情形讨论',
      dimension,
      cases,
      caption: text(raw.caption, 160),
    })
  }

  if (type === 'induction') {
    const examples = strings(raw.examples, 6)
    const rule = text(raw.rule, 200)
    if (examples.length < 2 || !rule) return null
    return applyCommon(raw, {
      type,
      title: text(raw.title, 60) || '观察与归纳',
      examples,
      rule,
      hint: text(raw.hint, 140),
    })
  }

  // multi-solution
  const problem = text(raw.problem, 200)
  const methods = (Array.isArray(raw?.methods) ? raw.methods : [])
    .map((method) => ({
      name: text(method?.name, 24),
      tag: text(method?.tag, 16),
      steps: strings(method?.steps, 4),
    }))
    .filter((method) => method.name && method.steps.length)
    .slice(0, 3)
  if (!problem || methods.length < 2) return null
  return applyCommon(raw, {
    type,
    title: text(raw.title, 60) || '一题多解',
    problem,
    methods,
    comparison: text(raw.comparison, 180),
  })
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
    // 位置 id：讲稿 beats 用 blockId 引用视觉事件（报告 §7.3 结论 3）
    .map((block, index) => ({ ...block, id: block.id || `b${index + 1}` }))
  if (!blocks.length) return null

  const hasQuestion = blocks.some((block) => block.type === 'question')
  if (!hasQuestion) {
    blocks.push({
      id: `b${blocks.length + 1}`,
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
        persistent: true,
      },
      {
        type: 'definition',
        title: '核心概念',
        term: primary.term,
        definition: primary.definition,
        concreteAnchor: primary.examTip || '先抓住概念要解决的问题，再记它的构成要素。',
        analogy: '先看一个能指认的具体例子，再回到定义本身。',
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
        const method = block.method?.length ? `方法：${block.method.join('；')}。` : ''
        return `概念：${block.term}。具体例子：${block.concreteAnchor}。定义：${block.definition}。${method}`
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
      if (block.type === 'classification-tree') {
        return `分类树：${block.root.label} → ${block.branches
          .map((branch) => `${branch.label}${branch.children.length ? `（${branch.children.map((child) => child.label).join('、')}）` : ''}`)
          .join('；')}`
      }
      if (block.type === 'number-line') {
        const points = block.points
          .map((point) => `${point.label}(${point.value})`)
          .join('、')
        return `数轴[${block.min}, ${block.max}]：${points}`
      }
      if (block.type === 'fill-blank') return `填空：${block.prompt}（答案：${block.answers.join('、')}）`
      if (block.type === 'wrong-first') {
        return `错解先行：常见错解第 ${block.errorIndex + 1} 步有误（${block.errorHint || '定位错误'}）；正确做法：${block.correctSteps.join('；')}`
      }
      if (block.type === 'judge') return `判断：${block.statement}（答案：${block.answer ? '对' : '错'}）`
      if (block.type === 'case-table') {
        return `情形讨论（${block.dimension}）：${block.cases
          .map((item) => `${item.condition}→${item.conclusion}`)
          .join('；')}`
      }
      if (block.type === 'induction') {
        return `观察归纳：${block.examples.join('；')} → 结论「${block.rule}」`
      }
      if (block.type === 'multi-solution') {
        return `一题多解：${block.problem}；${block.methods
          .map((method) => `${method.name}：${method.steps.join('，')}`)
          .join('；')}`
      }
      return ''
    })
    .filter(Boolean)
    .join('\n')
}
