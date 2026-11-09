/**
 * 知识点可视化决策模块（课程生成"通俗化"链路的核心）。
 *
 * 回答三个问题：
 * 1. 这个知识点需不需要交互组件？——多信号加权评分（概念特征 / 参数可调性 / 学段适配）；
 * 2. 该配哪种可视化形式？——学科 × 概念 → 参数化模型注册表匹配；
 * 3. 怎么和课程内容衔接？——模型块携带 linkConcept（回指本页概念）与 observe（观察任务），
 *    由调用方插入到 definition 之后，并把观察任务同步给板书追问。
 *
 * 硬约束（与 board.js 白名单一致）：
 * - 模型只能是 SIMULATION_MODELS 中注册的 id，参数只能是该模型声明的数值参数；
 * - 不允许自由 HTML / 坐标 / 脚本，渲染层由确定性 Vue 组件完成。
 */

import { filterByPedagogy } from './pedagogyProfiles.js'

/** 概念特征信号：命中即说明"可被看见"。权重越高越值得交互。 */
const CONCEPT_SIGNALS = [
  {
    id: 'motion',
    label: '运动与受力',
    weight: 24,
    pattern: /圆周运动|向心力|离心|线速度|角速度|匀速|加速|减速|受力|摩擦力|重力|弹力|杠杆|浮力|振动|单摆|平抛|碰撞|位移|路程/gi,
  },
  {
    id: 'geometry',
    label: '几何关系',
    weight: 24,
    pattern: /三角形|四边形|多边形|圆[周]?|圆心|半径|直径|圆周角|内角和|外角和|对称|旋转|平移|相似|全等|勾股|角度|垂线|平行|三视图|展开图/gi,
  },
  {
    id: 'function',
    label: '函数与依赖',
    weight: 22,
    pattern: /一次函数|二次函数|正比例|反比例|斜率|截距|增减性|单调|函数图像|变量之(间|的)?关系/gi,
  },
  {
    id: 'quantity',
    label: '数量结构',
    weight: 16,
    pattern: /有理数|数轴|相反数|绝对值|分数|通分|约分|百分数|比例|比值|倒数/gi,
  },
  {
    id: 'process',
    label: '过程与变换',
    weight: 14,
    pattern: /运算过程|移项|合并同类项|去括号|化简|推导|变换|逐步|流程|循环/gi,
  },
  {
    id: 'comparison',
    label: '对照与分类',
    weight: 10,
    pattern: /对照|比较|辨析|分类|区别|联系|易错/gi,
  },
]

/** 参数可调性：文本里有"改变一个条件看结果"的结构，说明值得做成可操作模型。 */
const PARAM_SIGNAL =
  /当.{0,12}(变|改|增|减|翻倍|减半|不同)|如果.{0,12}(改|换|增|减)|增大|减小|变快|变慢|翻倍|减半|改变.{0,6}条件|决定|影响|随.{0,12}(变化|改变|不同)|取决于|\d+(\.\d+)?\s*(m|kg|s|n|N|m\/s|rad|°|℃|倍|：|:)|参数|变量/gi

/**
 * 学段不缩放分数，只浮动阈值：
 * 低学段"弱信号也配交互"，高学段"强信号才配交互"。
 * 分数保持原始信号分（0–100），判定结果可解释、可回归。
 */
const STAGE_THRESHOLDS = {
  preschool: { recommend: 30, optional: 16 },
  primary: { recommend: 32, optional: 18 },
  junior: { recommend: 34, optional: 20 },
  senior: { recommend: 48, optional: 30 },
  university: { recommend: 52, optional: 32 },
  adult: { recommend: 52, optional: 32 },
  adaptive: { recommend: 40, optional: 22 },
}

/**
 * 参数化交互模型注册表。
 * params 是渲染层滑块/拖拽的权威声明；readouts 是实时读数公式（展示用）；
 * observe 是默认观察任务，生成时可按场景要点裁剪。
 */
export const SIMULATION_MODELS = [
  {
    id: 'circular-motion',
    label: '圆周运动与向心力',
    subjects: ['物理', '数学', '综合主题'],
    keywords: /圆周运动|向心力|离心|线速度|角速度|匀速圆周|转台|绳拉|过山车|汽车转弯/gi,
    concepts: ['motion'],
    stages: ['primary', 'junior', 'senior', 'adaptive'],
    domains: ['math-science'],
    params: [
      { key: 'radius', label: '半径 r', min: 40, max: 160, step: 5, value: 90, unit: 'px' },
      { key: 'speed', label: '速度 v', min: 0.5, max: 10, step: 0.5, value: 4, unit: 'm/s' },
      { key: 'mass', label: '质量 m', min: 0.5, max: 5, step: 0.5, value: 2, unit: 'kg' },
    ],
    readouts: [
      { key: 'force', label: '向心力 F = m·v²/r', unit: 'N' },
      { key: 'period', label: '周期 T = 2πr/v', unit: 's' },
    ],
    observe: [
      '保持半径不变，把速度调到最大：小球受到的向心力箭头怎么变？',
      '保持速度不变，把半径拉到最大：向心力又怎么变？',
      '点"松手"，小球沿哪个方向飞出？这说明了向心力在指向谁？',
    ],
  },
  {
    id: 'geometry-triangle',
    label: '三角形内角和',
    subjects: ['数学', '综合主题'],
    keywords: /三角形|内角和|外角|三角|多边形内角|几何图形|稳定性/gi,
    concepts: ['geometry'],
    stages: ['primary', 'junior', 'senior', 'adaptive'],
    domains: ['math-science'],
    params: [],
    readouts: [{ key: 'angleSum', label: '内角和', unit: '°' }],
    observe: [
      '拖动任意一个顶点，三个角的读数怎么变？和会变吗？',
      '把三角形拉成直角三角形，三个角各是多少？',
      '如果撕下三个角拼到一点，会得到什么图形？',
    ],
  },
  {
    id: 'linear-function',
    label: '一次函数图像',
    subjects: ['数学', '综合主题'],
    keywords: /一次函数|正比例|斜率|截距|直线|y\s*=\s*kx|k\s*[,，]\s*b/gi,
    concepts: ['function'],
    stages: ['junior', 'senior', 'adaptive'],
    domains: ['math-science'],
    params: [
      { key: 'k', label: '斜率 k', min: -4, max: 4, step: 0.5, value: 1 },
      { key: 'b', label: '截距 b', min: -5, max: 5, step: 0.5, value: 0 },
    ],
    readouts: [
      { key: 'k', label: 'k（倾斜程度）' },
      { key: 'b', label: 'b（与 y 轴交点）' },
    ],
    observe: [
      '只调 k：直线的倾斜程度怎么变？k 为负时直线往哪边倒？',
      '只调 b：直线在平移吗？和 y 轴的交点在哪？',
      'k = 0 时图像是什么？还是函数吗？',
    ],
  },
  {
    id: 'number-line',
    label: '有理数数轴',
    subjects: ['数学', '综合主题'],
    keywords: /有理数|数轴|相反数|绝对值|正数|负数|零/gi,
    concepts: ['quantity'],
    stages: ['primary', 'junior', 'adaptive'],
    domains: ['math-science'],
    params: [
      { key: 'a', label: '点 A', min: -8, max: 8, step: 1, value: 3 },
      { key: 'b', label: '点 B', min: -8, max: 8, step: 1, value: -2 },
    ],
    readouts: [
      { key: 'distance', label: '两点距离 |A−B|' },
      { key: 'opposite', label: 'A 的相反数' },
    ],
    observe: [
      '把 A 拖到 0 的左边：它是正数还是负数？相反数在哪？',
      'A 和 B 谁在左谁在右？数轴上怎么比较大小？',
      '拖动两点重合，距离变成多少？这和你算的一致吗？',
    ],
  },
  {
    id: 'fraction-parts',
    label: '分数与比例',
    subjects: ['数学', '综合主题'],
    keywords: /分数|几分之几|通分|约分|比例|百分比|占比/gi,
    concepts: ['quantity'],
    stages: ['primary', 'junior', 'adaptive'],
    domains: ['math-science'],
    params: [
      { key: 'numerator', label: '分子', min: 1, max: 8, step: 1, value: 1 },
      { key: 'denominator', label: '分母', min: 2, max: 8, step: 1, value: 4 },
    ],
    readouts: [
      { key: 'value', label: '分数值' },
      { key: 'percent', label: '百分数' },
    ],
    observe: [
      '保持分母 4，把分子调到 3：涂色部分占多少？',
      '分子分母同时乘 2，分数值变了吗？这叫什么？',
      '1/2 和 2/4 涂色面积一样多，怎么说它们相等？',
    ],
  },
  {
    // 2026-11-08 诊断一新增：对齐 OpenMAIC 视频 s_098「平方根探索」交互页
    // （滑块 a → a×a 面积方格 → 数轴标记），把上游交互场景映射到注册表模型
    id: 'square-root',
    label: '平方根面积模型',
    subjects: ['数学', '综合主题'],
    keywords: /平方根|开平方|开方|算术平方根|正方形面积|边长|面积等于|完全平方数/gi,
    concepts: ['quantity'],
    stages: ['primary', 'junior', 'adaptive'],
    domains: ['math-science'],
    params: [{ key: 'a', label: '边长 a', min: 1, max: 12, step: 1, value: 5 }],
    readouts: [
      { key: 'area', label: '面积 a²' },
      { key: 'root', label: '√(面积)' },
    ],
    observe: [
      '把边长调到 5：方格总数是多少？√25 等于几？',
      '边长调到 9：数轴上 9 和面积 81 相差多大？',
      '哪些边长能开出整数根？把它们圈出来，规律是什么？',
    ],
  },
  {
    // 2026-11-09 学科画像新增：人文历史的时序推理交互（对齐报告③时间轴母题）。
    // 交互形态是「点选事件按时间排序」而非数值参数，故 params 为空数组，
    // 事件数据放注册表 data 字段（block 契约不变，组件从注册表读取）。
    id: 'timeline-order',
    label: '历史事件时序推理',
    subjects: ['历史', '人文', '综合主题'],
    keywords: /时间轴|先后|顺序|时序|朝代|世纪|事件|大事记|因果|沿革|排序/gi,
    concepts: [],
    stages: ['primary', 'junior', 'senior', 'adaptive'],
    domains: ['humanities', 'language-arts'],
    params: [],
    data: {
      events: [
        { label: '鸦片战争', year: 1840 },
        { label: '洋务运动', year: 1861 },
        { label: '甲午战争', year: 1894 },
        { label: '辛亥革命', year: 1911 },
      ],
    },
    readouts: [{ key: 'progress', label: '已排对' }],
    observe: [
      '四个事件里最早发生的是哪一个？先点它。',
      '排完后回头看：因果链和年份顺序一致吗？',
      '如果两个事件只差几年，哪个更可能是另一个的原因？',
    ],
  },
  {
    // 2026-11-09 学科画像新增：工程技术的流程控制交互（对齐报告③ pipeline 母题）。
    id: 'pipeline-flow',
    label: '流水线流程控制',
    subjects: ['工程', '管理', '综合主题'],
    keywords: /流程|工序|流水线|产能|吞吐|瓶颈|缓冲区|节拍|生产线|流转/gi,
    concepts: [],
    stages: ['junior', 'senior', 'adaptive'],
    domains: ['engineering', 'social-science'],
    params: [
      { key: 'rate', label: '来料速率', min: 0, max: 100, step: 5, value: 60, unit: '件/分' },
      { key: 'buffer', label: '缓冲容量', min: 0, max: 50, step: 5, value: 20, unit: '件' },
    ],
    data: {
      stages: [
        { key: 'receive', label: '接收', capacity: 80 },
        { key: 'process', label: '加工', capacity: 60 },
        { key: 'inspect', label: '检验', capacity: 70 },
      ],
    },
    readouts: [
      { key: 'throughput', label: '实际产能', unit: '件/分' },
      { key: 'bottleneck', label: '瓶颈工序' },
    ],
    observe: [
      '把来料速率拉到 100：哪个工序先堆积？缓冲区怎么变？',
      '来料降到 40：产能跟着降吗？为什么？',
      '想提高产能，加缓冲和提速瓶颈工序，哪个更根本？',
    ],
  },
]

const MODELS_BY_ID = new Map(SIMULATION_MODELS.map((model) => [model.id, model]))

export function simulationModel(id) {
  return MODELS_BY_ID.get(id) || null
}

function matchCount(text, pattern) {
  pattern.lastIndex = 0
  return text.match(pattern)?.length || 0
}

function matchedTerms(text, pattern, limit = 6) {
  pattern.lastIndex = 0
  const found = new Set()
  let match
  while ((match = pattern.exec(text)) && found.size < limit) {
    found.add(match[0])
  }
  return [...found]
}

/**
 * 信号一：这个知识点需不需要交互组件。
 * 评分 = 概念特征信号加权和 + 参数可调性加分，再按学段适配权重缩放。
 */
export function assessVisualizationNeed({
  text = '',
  subject = '',
  stage = 'adaptive',
  keyPoints = [],
} = {}) {
  const corpus = [
    String(text || ''),
    ...(Array.isArray(keyPoints) ? keyPoints : [keyPoints]).map((point) => String(point || '')),
  ]
    .join(' ')
    .slice(0, 4000)

  const signals = []
  let base = 0
  for (const signal of CONCEPT_SIGNALS) {
    const count = matchCount(corpus, signal.pattern)
    if (!count) continue
    // 同一信号多次命中只计一次权重，命中数仅作证据展示，防止堆词刷分
    base += signal.weight
    signals.push({
      id: signal.id,
      label: signal.label,
      weight: signal.weight,
      hits: count,
      terms: matchedTerms(corpus, signal.pattern, 3),
    })
  }

  const paramHits = matchCount(corpus, PARAM_SIGNAL)
  if (paramHits) base += 12
  const score = Math.round(Math.min(100, base))
  const threshold = STAGE_THRESHOLDS[stage] || STAGE_THRESHOLDS.adaptive

  const level =
    score >= threshold.recommend ? 'recommend' : score >= threshold.optional ? 'optional' : 'skip'
  const reasons = signals.map((signal) => `${signal.label}（${signal.terms.join('、')}）`)
  if (paramHits) reasons.push('存在"改变条件看结果"的数量结构')
  if (level !== 'skip') {
    const stageNote =
      stage === 'senior' || stage === 'university' || stage === 'adult'
        ? '学段偏高等教育，仅保留关系展示型交互'
        : '学段偏低，交互优先于文字推导'
    reasons.push(stageNote)
  }

  return {
    level,
    score,
    needsInteraction: level === 'recommend',
    subject: subject || '综合主题',
    stage,
    signals,
    reasons,
  }
}

/**
 * 信号二：学科 × 概念 → 可视化形式。
 * 优先级：关键词直接命中 > 概念信号命中 > 学科命中；再按学段过滤。
 *
 * requireKeywords: true 时只接受关键词直接命中的模型（2026-11-08 诊断一：
 * widget-config → simulation 映射要求"widget 自己的词汇命中模型关键词"，
 * 概念信号+学科命中不足以证明模型与概念对应——例如"抛体运动"含"速度"
 * 会点亮 motion 信号，但圆周运动模型并不能讲解抛体运动）。
 */
export function matchSimulation({
  text = '',
  subject = '',
  stage = 'adaptive',
  keyPoints = [],
  requireKeywords = false,
  domainId = '',
} = {}) {
  const corpus = [
    String(text || ''),
    ...(Array.isArray(keyPoints) ? keyPoints : [keyPoints]).map((point) => String(point || '')),
  ]
    .join(' ')
    .slice(0, 4000)
  const normalizedSubject = String(subject || '综合主题')

  // 学科域过滤（2026-11-09 学科画像）：域为空/general 时不过滤；
  // 有域时只保留该域可用模型——防止文科课配数学向交互模型
  const candidates = filterByPedagogy(SIMULATION_MODELS, domainId)
    .map((model) => {
      const keywordHits = matchCount(corpus, model.keywords)
      const conceptIds = new Set(model.concepts)
      const signalScore = CONCEPT_SIGNALS.filter(
        (signal) => conceptIds.has(signal.id) && matchCount(corpus, signal.pattern),
      ).reduce((total, signal) => total + signal.weight, 0)
      // 阶段是硬约束：不适配该学段的模型直接排除，不用负分软惩罚
      if (!model.stages.includes(stage)) return null
      const subjectHit = model.subjects.includes(normalizedSubject) ? 10 : 0
      return { model, keywordHits, score: keywordHits * 30 + signalScore + subjectHit }
    })
    .filter((item) => {
      if (!item || item.score <= 0) return false
      // 严格模式：必须关键词直接命中（widget-config 映射用）
      if (requireKeywords && item.keywordHits <= 0) return false
      return item.keywordHits > 0 || item.score - 10 > 0
    })
    .sort((a, b) => b.score - a.score)

  const best = candidates[0]
  if (!best) return null
  return {
    model: best.model,
    score: best.score,
    keywordHits: best.keywordHits,
    terms: matchedTerms(corpus, best.model.keywords, 3),
    params: defaultParams(best.model),
    observe: [...best.model.observe],
  }
}

export function defaultParams(model) {
  const params = {}
  for (const param of model.params) params[param.key] = param.value
  return params
}

/** 把参数收敛回模型声明范围内，防越界值进入渲染层。 */
export function clampParams(model, params) {
  const safe = {}
  for (const param of model.params) {
    const raw = Number(params?.[param.key])
    safe[param.key] = Number.isFinite(raw)
      ? Math.min(param.max, Math.max(param.min, raw))
      : param.value
  }
  return safe
}

/**
 * 信号三：构造受控 simulation block（与 board.js 白名单契约一致）。
 * linkConcept 让模型回指本页 definition；observe 承接场景要点里的观察任务。
 */
export function buildSimulationBlock({
  model,
  title,
  params,
  observe,
  linkConcept = '',
  caption = '',
}) {
  const registered = typeof model === 'string' ? simulationModel(model) : model
  if (!registered) return null
  const safeParams = clampParams(registered, params || defaultParams(registered))
  const tasks = (Array.isArray(observe) ? observe : [observe])
    .map((task) => String(task || '').trim())
    .filter(Boolean)
    .slice(0, 4)
  return {
    type: 'simulation',
    model: registered.id,
    title: String(title || registered.label).slice(0, 60),
    params: safeParams,
    observe: tasks.length ? tasks : [...registered.observe].slice(0, 3),
    linkConcept: String(linkConcept || '').slice(0, 60),
    caption: String(caption || '').slice(0, 180),
  }
}

/**
 * 衔接兜底：模型没有输出 simulation，但本地判定"推荐"时，
 * 在 definition 之后插入一个匹配到的模型块，保证降级路径也有交互。
 * T-23 学科画像：context.pedagogyDomain 过滤模型候选（general/空=不过滤）。
 */
export function ensureSimulationBlock(lesson, context = {}) {
  if (!lesson?.blocks?.length) return lesson
  const hasSimulation = lesson.blocks.some((block) => block.type === 'simulation')
  if (hasSimulation) return lesson

  const assessment = assessVisualizationNeed({
    text: [
      lesson.title,
      lesson.subtitle,
      ...(context.keyPoints || []),
      ...(lesson.blocks || []).flatMap((block) => [
        block.term || '',
        block.definition || '',
        block.prompt || '',
        (block.items || []).join(' '),
      ]),
    ].join(' '),
    subject: context.subject,
    stage: context.stage,
    keyPoints: context.keyPoints,
  })
  if (assessment.level !== 'recommend') return lesson

  const matched = matchSimulation({
    text: [
      lesson.title,
      ...(context.keyPoints || []),
      ...(lesson.blocks || [])
        .filter((block) => block.type === 'definition')
        .map((block) => `${block.term} ${block.definition}`),
    ].join(' '),
    subject: context.subject,
    stage: context.stage,
    keyPoints: context.keyPoints,
    domainId: context.pedagogyDomain || '',
  })
  if (!matched) return lesson

  const definition = lesson.blocks.find((block) => block.type === 'definition')
  // linkConcept 优先用本页 definition 概念名；本地兜底场景 term 可能是整句，
  // 此时回落到模型命中的短关键词（如"圆周运动"）
  const conceptFromMatch = matched.terms?.[0] || ''
  const definitionTerm = definition?.term || ''
  const linkConcept =
    definitionTerm.length <= 12 && definitionTerm
      ? definitionTerm
      : conceptFromMatch.length <= 12 && conceptFromMatch
        ? conceptFromMatch
        : conceptFromMatch || definitionTerm.slice(0, 12)
  const block = buildSimulationBlock({
    model: matched.model,
    title: `动手看：${matched.model.label}`,
    params: matched.params,
    observe: matched.observe.slice(0, 3),
    linkConcept,
    caption: '先读左边的概念，再拖动参数验证它；每个观察任务只改一个条件。',
  })
  if (!block) return lesson

  const blocks = [...lesson.blocks]
  const insertAt = definition ? blocks.indexOf(definition) + 1 : 0
  blocks.splice(insertAt, 0, block)
  // 遵守"每页 ≤ 8 block"契约：超限时从尾部弹出最低价值的 callout
  while (blocks.length > 8) {
    const calloutIndex = blocks.findIndex((item) => item.type === 'callout')
    blocks.splice(calloutIndex >= 0 ? calloutIndex : blocks.length - 1, 1)
  }
  return { ...lesson, blocks }
}

export { CONCEPT_SIGNALS, STAGE_THRESHOLDS }
