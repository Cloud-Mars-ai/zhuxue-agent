/**
 * 学科教学画像（Pedagogy Profile）—— 跨学科通用课程生成的地基。
 *
 * 设计动机（docs/research/pedagogy-profile-design.md）：
 * 课程生成系统要服务文科、理科、工科等全部学科门类，但每一门的
 * 「教授方式」根本不同：数学靠演绎推导、历史靠叙事论辩、工科靠
 * 设计迭代、经管靠案例决策、语言靠积累运用。此前系统只有数学向
 * 的视觉/交互资源与理科话术，文科课程会被硬套成"板书+公式"。
 *
 * 核心思路（不改动 IR/场景类型/block 白名单的渐进方案）：
 * - 场景四类型（lecture/quiz/practice/review）与 19 种 block 不变，
 *   学科自适应体现在**搭建图纸**（场景流程模板 + 讲授策略）、
 *   **资源池**（视觉场景/交互模型的域标签过滤）、**话术**三层；
 * - AI 仍然只填 JSON；本文件只提供确定性数据与纯函数；
 * - 域推断失败时回落 'general'（通用）：不过滤任何资源，
 *   提示词不注入学科策略——保证未知学科永远能出课，不会更差。
 *
 * 硬规则：本文件只允许纯数据与纯函数（node 测试脚本直接 import）。
 */

/** 五大学科域：id / 名称 / 典型学科 / 教学范式 / 推断关键词。 */
export const PEDAGOGY_DOMAINS = [
  {
    id: 'math-science',
    label: '数理科学',
    paradigm: '演绎探究',
    blurb: '数学、物理、化学、生物等以定义-定理-推导为主线的学科',
    subjects: ['数学', '物理', '化学', '生物', '科学', '地理'],
    keywords: /数学|几何|代数|方程|函数|概率|统计|三角|向量|导数|积分|物理|力学|电磁|光学|热学|化学|反应|元素|分子|原子|生物|细胞|基因|遗传|生态|公式|定理|证明|推导/gi,
    // 大纲阶段注入的学科策略（课程编排师视角）
    sceneFlow:
      '动机问题 → 概念定义 → 性质推导或规律归纳 → 变式应用（优先配可交互模型）→ 测验 → 收束。推导场景必须写清"从哪条已知出发、经过几步、得到什么"；每个核心概念尽量配一个"改变一个条件看结果"的交互模型或图表。',
    pedagogy:
      '先具体后抽象，每个抽象概念配一个具体实例；错解先行（先让学生犯典型错误再纠正）；易错点（符号、单位、条件遗漏、公式适用前提）必须进测验题。',
    visualHint:
      '理科概念只要有"改变一个条件看结果"的结构，visualHint 一律标 recommend 并在 description 说明配什么交互模型；静态图示优先图表族（chart）与关系图（diagram）。',
    blockBias: ['chart', 'diagram', 'simulation', 'definition'],
  },
  {
    id: 'engineering',
    label: '工程技术',
    paradigm: '设计迭代',
    blurb: '计算机、机械、电子、土木等以问题-设计-调试为主线的工科',
    subjects: ['计算机', '编程', '机械', '电子', '土木', '工程', '自动化', '人工智能', '软件'],
    keywords: /工程|机械|电子|电路|编程|代码|程序|算法|数据结构|计算机|软件|硬件|自动化|机器人|建筑|土木|设计|调试|编译|系统架构|网络|数据库/gi,
    sceneFlow:
      '工程问题或故障情境 → 核心原理 → 构造与流程设计（配流程模拟）→ 调试与优化 → 测验 → 收束。先给需求/故障再给工具，让原理出现在"非用不可"的位置；设计场景必须写出约束条件与取舍理由。',
    pedagogy:
      '问题驱动：每个知识点从一个真实工程困境引入；强调"为什么这样设计"的权衡（性能/成本/可维护性）；调试场景按"现象 → 假设 → 定位 → 修复"组织。',
    visualHint:
      '流程、步骤、生命周期类内容 visualHint 标 recommend，配流程/结构图示；有输入输出参数可调的（如控制流、参数调节）优先配可交互模型。',
    blockBias: ['steps', 'diagram', 'illustration', 'callout'],
  },
  {
    id: 'humanities',
    label: '人文历史',
    paradigm: '叙事论辩',
    blurb: '历史、政治、地理、哲学等以情境-史料-观点为主线的学科',
    subjects: ['历史', '政治', '地理', '哲学', '人文', '语文'],
    keywords: /历史|朝代|世纪|战争|革命|政治|制度|哲学|思想|地理|文明|古文|文学|作家|作品|史料|文献|朝代|政策|国际关系/gi,
    sceneFlow:
      '时空情境叙事 → 关键事实与史料研读 → 多方观点呈现 → 辨析与应用 → 测验 → 收束。第一幕必须给出时间、地点、人物三要素；观点对比用多栏并置，不写成一锅粥。',
    pedagogy:
      '故事线牵引：用人物与事件的因果链组织知识，不按名词表罗列；史料/原文优先（标注出处，无出处标"待核对"）；观点必须呈现争议双方再给判断框架。',
    visualHint:
      '有时间顺序的内容 visualHint 标 recommend 配时间轴图示；多观点对比用多栏（columns）；地理/空间内容配区域图示；谨慎使用交互模型（仅时序推理类可用）。',
    blockBias: ['illustration', 'columns', 'callout', 'definition'],
  },
  {
    id: 'social-science',
    label: '经管社科',
    paradigm: '案例决策',
    blurb: '经济、管理、法律、社会学等以案例-工具-决策为主线的学科',
    subjects: ['经济', '管理', '金融', '会计', '法律', '社会', '营销', '战略', '人力', '运营'],
    keywords: /经济|管理|金融|市场|企业|战略|营销|会计|财务|法律|组织|领导|决策|成本|收益|供需|博弈|人力资源|供应链|商业模式/gi,
    sceneFlow:
      '真实案例困境 → 概念工具 → 分析框架 → 决策练习 → 测验 → 收束。案例必须先于工具出现（让工具成为"解题钥匙"）；决策练习必须含两个以上方案的权衡，不只问"是什么"。',
    pedagogy:
      '案例先行：每个工具配一个可讨论的真实场景；强调适用条件与边界（什么情况下这个工具失效）；测验以案例分析题与概念辨析题为主。',
    visualHint:
      '市场、增长、组织、流程类内容 visualHint 标 recommend（供需曲线/增长曲线/组织结构/PDCA 等母题）；案例对比用多栏；有参数联动的经济模型优先配可交互模型。',
    blockBias: ['illustration', 'columns', 'chart', 'definition'],
  },
  {
    id: 'language-arts',
    label: '语言艺术',
    paradigm: '积累运用',
    blurb: '语文、英语、艺术等以范例-规则-运用为主线的学科',
    subjects: ['英语', '语文', '写作', '艺术', '音乐', '美术', '语言'],
    keywords: /英语|语文|写作|阅读|词汇|语法|作文|古诗|翻译|听力|口语|艺术|音乐|美术|鉴赏|修辞|句式/gi,
    sceneFlow:
      '范例赏析 → 规则归纳 → 情境运用 → 创作或鉴赏 → 测验 → 收束。范例必须先于规则（从例子中归纳，不从定义出发）；情境运用设计成真实任务（写一段、译一句、改一篇）。',
    pedagogy:
      '积累导向：规则从范例归纳得出，给学生"自己发现"的空间；创作场景留白（给框架不给范文）；测验以语境判断题与改错题为主。',
    visualHint:
      '范例用引用卡片呈现；结构分析可用关系图；一般不配交互模型（语言类交互以输入任务为主，板书侧保持文本结构图）。',
    blockBias: ['callout', 'columns', 'definition', 'illustration'],
  },
]

export const PEDAGOGY_DOMAIN_IDS = PEDAGOGY_DOMAINS.map((domain) => domain.id)

/** 通用域：域推断失败时的安全回落——资源不过滤、策略不注入。 */
export const GENERAL_PEDAGOGY = {
  id: 'general',
  label: '通用',
  paradigm: '通递进',
  blurb: '域未能识别时的通用教学流程',
  subjects: [],
  keywords: /(?!)/g,
  sceneFlow: '',
  pedagogy: '',
  visualHint: '',
  blockBias: [],
}

const DOMAINS_BY_ID = new Map(PEDAGOGY_DOMAINS.map((domain) => [domain.id, domain]))

/** 旧 domain 参数 → 学科域 的已知映射（courseStudio 的 domain 入参）。 */
const DOMAIN_ALIAS = {
  math7: 'math-science',
  math: 'math-science',
  physics: 'math-science',
  chemistry: 'math-science',
  management: 'social-science',
  economics: 'social-science',
  history: 'humanities',
  politics: 'humanities',
  engineering: 'engineering',
  cs: 'engineering',
  language: 'language-arts',
}

export function pedagogyDomain(id) {
  if (!id || id === 'general') return null
  return DOMAINS_BY_ID.get(id) || null
}

export function isGeneralPedagogy(id) {
  return !id || id === 'general'
}

function matchCount(text, pattern) {
  pattern.lastIndex = 0
  return text.match(pattern)?.length || 0
}

function matchedTerms(text, pattern, limit = 4) {
  pattern.lastIndex = 0
  const found = new Set()
  let match
  while ((match = pattern.exec(text)) && found.size < limit) {
    found.add(match[0])
  }
  return [...found]
}

/**
 * 学科域推断（确定性，无模型调用）。
 *
 * 输入优先级：已知 domain 别名 > learnerProfile.subject 关键词 >
 * 用户原始需求 + 材料文本关键词。全部落空返回 'general'。
 *
 * 为什么必须宽容：域推断只影响"资源过滤与策略注入"的增益，
 * 误判的代价是提示词策略不合适，但课仍然能出（通用铁律兜底）；
 * 因此置信度低时优先 general，不做激进猜测。
 */
export function inferPedagogyDomain({
  subject = '',
  domain = '',
  objective = '',
  materialText = '',
} = {}) {
  // 1. 已知 domain 别名（最强信号，来自系统既有学科分类）
  const alias = DOMAIN_ALIAS[String(domain || '').toLowerCase()]
  if (alias) return { id: alias, confidence: 'high', evidence: `domain=${domain}` }

  const subjectText = String(subject || '').trim()
  const corpus = [subjectText, String(objective || ''), String(materialText || '')]
    .join(' ')
    .slice(0, 4000)

  if (!corpus.trim()) return { id: 'general', confidence: 'low', evidence: '无输入' }

  // 2. subject 精确命中域内学科名（如「数学」「历史」）
  for (const item of PEDAGOGY_DOMAINS) {
    if (subjectText && item.subjects.some((name) => subjectText.includes(name))) {
      return { id: item.id, confidence: 'high', evidence: `subject=${subjectText}` }
    }
  }

  // 3. 关键词打分：subject 权重 ×3（领域声明比正文出现更可信）
  let best = null
  for (const item of PEDAGOGY_DOMAINS) {
    const subjectHits = matchCount(subjectText, item.keywords)
    const bodyHits = matchCount(String(objective || '') + ' ' + String(materialText || ''), item.keywords)
    const score = subjectHits * 3 + bodyHits
    if (!score) continue
    if (!best || score > best.score) {
      best = {
        id: item.id,
        score,
        terms: matchedTerms(corpus, item.keywords),
      }
    }
  }
  if (best && best.score >= 2) {
    return {
      id: best.id,
      confidence: best.score >= 6 ? 'medium' : 'low',
      evidence: `关键词：${best.terms.join('、')}`,
    }
  }
  return { id: 'general', confidence: 'low', evidence: '未命中学科关键词' }
}

/**
 * 资源域过滤（视觉场景 / 交互模型共用）。
 * - domain 为 general/空：不过滤（全部可用）；
 * - 资源无 domains 字段或空数组：视为通用资源，任何域可用；
 * - 否则只保留声明了该域的资源。
 */
export function resourceAllowedForDomain(resource, domainId) {
  if (!resource || isGeneralPedagogy(domainId)) return true
  const domains = Array.isArray(resource.domains) ? resource.domains : []
  if (!domains.length) return true
  return domains.includes(domainId)
}

export function filterByPedagogy(items, domainId) {
  if (!Array.isArray(items)) return []
  return items.filter((item) => resourceAllowedForDomain(item, domainId))
}

/**
 * 大纲提示词的学科策略块（课程编排师注入）。
 * general 域返回空串——调用方直接拼接，无分支判断。
 */
export function pedagogyGuide(domainId) {
  const domain = pedagogyDomain(domainId)
  if (!domain) return ''
  return `【学科教学策略 · ${domain.label}（${domain.paradigm}）】
本课属于${domain.label}领域（${domain.blurb}），请按以下方式编排：
1. 场景流程：${domain.sceneFlow}
2. 讲授策略：${domain.pedagogy}
3. 视觉与交互：${domain.visualHint}
4. 板书积木偏好：优先使用 ${domain.blockBias.join('、')} 类 block 组织内容（其余通用铁律不变）。`
}

/** 学科域 → identity 文案（大纲/场景提示词的身份段）。 */
export function pedagogyIdentity(domainId) {
  const domain = pedagogyDomain(domainId)
  if (!domain) return ''
  return `你是${domain.label}课程设计助手，熟悉${domain.subjects.slice(0, 4).join('、')}等学科的知识结构与${domain.paradigm}式教学流程。`
}
