/**
 * 讲稿层（course script）——板书的“时间轴”。
 *
 * 依据报告 B5（设问—停顿—确认链）、§7.3 结论 3（讲稿 beats 与视觉事件
 * 1:1 对齐）、E4（思考停顿）、E1（字数预算）：
 * - beats 是口播的最小单位，每拍一个 kind + 一段话 + 停顿毫秒；
 * - question 拍 pauseMs ≥ 1500（学生需要思考时间）；
 * - question/answer 拍最多挂 1 个 blockId——视觉事件跟着讲解走；
 * - 兜底讲稿由板书 block 确定性生成，断网也能完整演示（硬规则 6）。
 *
 * 本文件只用相对导入，保证 node 测试脚本可直接 import。
 */

export const SCRIPT_BEAT_KINDS = ['question', 'answer', 'confirm', 'recall', 'cta']

export const SCRIPT_BEAT_LABELS = {
  question: '设问',
  answer: '讲解',
  confirm: '确认',
  recall: '回顾',
  cta: '行动',
}

/** 各拍的最短停顿（ms）：question 拍留给学生思考（E4），其余拍换气。 */
const MIN_PAUSE = { question: 1500, answer: 600, confirm: 600, recall: 1000, cta: 600 }
const MAX_PAUSE = 6000

function text(value, max = 240) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function strings(value, maxItems = 4, maxLength = 24) {
  return (Array.isArray(value) ? value : [])
    .map((item) => text(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

function clampPause(kind, value) {
  const parsed = Number(value)
  const fallback = MIN_PAUSE[kind] ?? 800
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(MAX_PAUSE, Math.max(MIN_PAUSE[kind] ?? 600, Math.round(parsed)))
}

/**
 * 讲稿归一化：白名单校验 + 停顿约束 + blockId 必须指向真实 block。
 * 不满足“至少 1 个 question、1 个 cta、总拍数 ≥3”时返回 null，交给重试/兜底。
 */
export function normalizeCourseScript(raw, { outline, lesson } = {}) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const rawBeats = Array.isArray(source.beats)
    ? source.beats
    : Array.isArray(source.script?.beats)
      ? source.script.beats
      : []
  if (rawBeats.length < 3) return null

  const blockIds = new Set((lesson?.blocks || []).map((block) => block.id))
  const beats = rawBeats
    .map((beat) => {
      const kind = SCRIPT_BEAT_KINDS.includes(beat?.kind) ? beat.kind : 'answer'
      const body = text(beat?.text ?? beat?.line ?? beat?.say, 200)
      if (!body) return null
      const blockId = text(beat?.blockId, 24)
      const attachesVisual = kind === 'question' || kind === 'answer'
      return {
        kind,
        text: body,
        pauseMs: clampPause(kind, beat?.pauseMs),
        blockId:
          attachesVisual && blockId && blockIds.has(blockId) ? blockId : null,
        emphasis: strings(beat?.emphasis, 4, 20),
      }
    })
    .filter(Boolean)
    .slice(0, 24)

  if (beats.length < 3) return null
  if (!beats.some((beat) => beat.kind === 'question')) return null
  if (!beats.some((beat) => beat.kind === 'cta')) return null

  return {
    persona: text(source.persona, 80) || '课程主讲老师',
    beats,
    sceneTitle: text(outline?.title, 80),
    sourceChunkIds: strings(outline?.sourceChunkIds, 8, 120),
  }
}

/** 板书 block → 讲稿拍型映射（兜底与 UI 共用）。 */
function beatKindForBlock(block) {
  if (block.type === 'question') return 'question'
  if (block.type === 'callout' && block.tone === 'warn') return 'confirm'
  if (block.type === 'wrong-first' || block.type === 'judge' || block.type === 'fill-blank') {
    return 'question'
  }
  return 'answer'
}

function beatTextForBlock(block) {
  if (block.type === 'definition') {
    return `先看这个例子：${block.concreteAnchor}。这就是${block.term}——${block.definition}`
  }
  if (block.type === 'question') return block.prompt
  if (block.type === 'callout') return block.text
  if (block.type === 'outline') return `这一页我们走三步：${block.items.join('；')}`
  if (block.type === 'table') {
    return `对照着看：${block.columns.join('、')}。${block.rows[0]?.join('，') || ''}`
  }
  if (block.type === 'classification-tree') {
    return `${block.root.label}可以怎么分？先看第一层：${block.branches
      .map((branch) => branch.label)
      .join('、')}。`
  }
  if (block.type === 'number-line') {
    return `在数轴上找到${block.points.map((point) => `${point.label}（${point.value}）`).join('、')}，注意原点把正负分开。`
  }
  if (block.type === 'fill-blank') return block.prompt.replace(/___/g, '哪里')
  if (block.type === 'wrong-first') {
    return `先看一份常见错解。第${block.errorIndex + 1}步，${block.errorHint || '错在哪里'}`
  }
  if (block.type === 'judge') return block.statement
  if (block.type === 'case-table') {
    return `按${block.dimension}分情形看：${block.cases[0].condition}的时候，${block.cases[0].conclusion}。`
  }
  if (block.type === 'induction') return `看这几个例子：${block.examples.join('；')}。规律是什么？`
  if (block.type === 'multi-solution') return `${block.problem}——你能想到几种方法？`
  if (block.type === 'simulation') return `动手试一试：${block.title}。${(block.observe || [])[0] || ''}`
  if (block.type === 'animation') return block.caption || block.title
  if (block.type === 'diagram') return `顺着这条链看：${block.nodes.map((node) => node.label).join('到')}。`
  return block.title || ''
}

/**
 * 确定性兜底讲稿：从板书 block / 题目确定性推导 beats。
 * 模型不可用或结构校验失败时使用，保证“先问后讲 + 停顿 + cta”结构不丢。
 */
export function buildLocalCourseScript(project, outline, scene) {
  const persona =
    project?.domain === 'math7' ? '沉稳的数学老师，多用提问推进' : '课程主讲老师，先问后讲'
  const beats = []

  if (scene?.kind === 'quiz') {
    const questions = scene.questions || []
    questions.slice(0, 4).forEach((question, index) => {
      beats.push({
        kind: 'question',
        text: `第${index + 1}题：${text(question.stem, 120)}`,
        pauseMs: 2000,
        blockId: null,
        emphasis: [],
      })
      beats.push({
        kind: 'answer',
        text: text(question.explanation, 160) || '先说出你的判断，再对照解释。',
        pauseMs: 900,
        blockId: null,
        emphasis: [],
      })
    })
    if (!beats.length) {
      beats.push({
        kind: 'question',
        text: `关于「${text(outline?.title, 40)}」，哪一条说明你真的理解了？`,
        pauseMs: 1800,
        blockId: null,
        emphasis: [],
      })
    }
  } else if (scene?.kind === 'practice') {
    beats.push({
      kind: 'question',
      text: text(scene.prompt, 160) || '这个情境，你会先判断什么？',
      pauseMs: 2000,
      blockId: null,
      emphasis: [],
    })
    ;(scene.referencePoints || []).slice(0, 3).forEach((point) => {
      beats.push({
        kind: 'answer',
        text: text(point, 140),
        pauseMs: 800,
        blockId: null,
        emphasis: [],
      })
    })
  } else {
    const blocks = scene?.lesson?.blocks || []
    const keyPoint = text((outline?.keyPoints || [])[0] || outline?.title, 40)
    beats.push({
      kind: 'question',
      text: `先想一想：关于「${keyPoint}」，你已经知道什么？`,
      pauseMs: 1800,
      blockId: null,
      emphasis: [keyPoint],
    })
    blocks.slice(0, 8).forEach((block) => {
      const body = text(beatTextForBlock(block), 160)
      if (!body) return
      beats.push({
        kind: beatKindForBlock(block),
        text: body,
        pauseMs: block.type === 'question' ? 1800 : 800,
        blockId: block.id || null,
        emphasis: [],
      })
    })
    if (beats.length >= 4) {
      beats.push({
        kind: 'recall',
        text: `回到开头的问题：现在你能用「${keyPoint}」说清判断依据了吗？`,
        pauseMs: 1200,
        blockId: null,
        emphasis: [keyPoint],
      })
    }
  }

  beats.push({
    kind: 'cta',
    text: '用自己的话把这个结论讲一遍，再点“继续”进入下一场景。',
    pauseMs: 800,
    blockId: null,
    emphasis: [],
  })

  return {
    persona,
    beats: beats.slice(0, 24),
    sceneTitle: text(outline?.title, 80),
    sourceChunkIds: strings(outline?.sourceChunkIds, 8, 120),
    local: true,
  }
}
