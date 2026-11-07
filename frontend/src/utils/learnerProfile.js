const STAGE_PROFILES = {
  preschool: {
    stage: 'preschool',
    stageLabel: '学前',
    gradeLabel: '学龄前',
    language: '使用短句、生活词汇和具体动作描述，一次只引入一个新概念。',
    teaching:
      '先用玩具、图像、故事或身体动作建立直观感受，再让学生复述或动手做一次；避免抽象定义和长段文字。',
    board:
      '板书用大图、少量关键词、对照和可点击的分步演示，每个步骤只表现一个变化。',
  },
  primary: {
    stage: 'primary',
    stageLabel: '小学',
    gradeLabel: '小学阶段',
    language: '使用短句、具体名词和生活化提问，先讲“它像什么”，再给正式名称。',
    teaching:
      '用实物、故事、简单模型和分步示范；优先设计可点击的分步演示、口头预测和即时反馈，必要时重复关键步骤。',
    board:
      '板书以一条清晰路线、一个形象比喻和 2—4 帧分步演示为主，避免同时堆放多个抽象概念。',
  },
  junior: {
    stage: 'junior',
    stageLabel: '初中',
    gradeLabel: '初中阶段',
    language: '使用形象但准确的表达，先给直觉模型，再补定义、条件和符号表达。',
    teaching:
      '用可操作的模型、生活现象和“改变一个条件看结果”的分步交互演示建立理解；再做变式练习，避免只背结论。',
    board:
      '板书先呈现问题，再用形象比喻、模型图和可点击的分步演示解释变化，最后用一道判断题收束。',
  },
  senior: {
    stage: 'senior',
    stageLabel: '高中',
    gradeLabel: '高中阶段',
    language: '语言简洁、逻辑完整；先说明适用条件，再展开推导、证据或论证链。',
    teaching:
      '用条件辨析、公式或论证链、典型例题和变式训练推进；交互演示用于展示关系变化，避免把高中内容讲成低龄化故事。',
    board:
      '板书突出条件、关系或论证步骤，用对照表辨析易错点，再用追问检查学生能否迁移。',
  },
  university: {
    stage: 'university',
    stageLabel: '大学',
    gradeLabel: '本科及以上',
    language: '使用规范学科术语和清晰的概念边界，例子要具备真实情境、决策对象与证据链。',
    teaching:
      '以问题驱动、概念框架、材料证据、案例判断和批判性追问为主；交互演示用于验证模型或推演决策，而不是装饰。',
    board:
      '板书按“问题—框架—概念—证据/案例—判断—追问”组织，明确材料边界，不把通用知识冒充教材结论。',
  },
  adult: {
    stage: 'adult',
    stageLabel: '成人 / 职业学习',
    gradeLabel: '职业或继续教育',
    language: '直接说明学习收益、适用场景和行动步骤，减少童年化比喻，保留必要的概念解释。',
    teaching:
      '用工作任务、真实决策和可迁移步骤组织内容；交互演示聚焦流程、风险与结果变化，并允许根据经验快速跳过基础。',
    board:
      '板书强调任务目标、判断依据、操作步骤和风险边界，用对比与情境推演帮助迁移到工作。',
  },
  adaptive: {
    stage: 'adaptive',
    stageLabel: '按内容自适应',
    gradeLabel: '未明确',
    language:
      '先跟随用户使用的术语和句子难度组织回答；若仍无法判断，先用中性、清晰的表达，并说明当前假设。',
    teaching:
      '从用户需求与材料中的概念难度选择讲法：低门槛内容多用具体例子与分步演示，高阶内容多用框架、证据和案例推演。',
    board:
      '板书同时保留直观抓手和概念边界，复杂过程用分步演示，结论处说明依据。',
  },
}

const SUBJECT_RULES = [
  ['数学', /数学|方程|函数|几何|概率|统计|代数|微积分|线性代数|算术|有理数|整式/gi],
  ['物理', /物理|力学|电磁|光学|热学|运动学|牛顿/gi],
  ['化学', /化学|元素|分子|原子|化学反应|酸碱|有机/gi],
  ['生物', /生物|细胞|遗传|生态|人体|基因/gi],
  ['语文', /语文|阅读|作文|古诗|文言文|修辞|写作/gi],
  ['英语', /英语|english|grammar|reading|writing|vocabulary/gi],
  ['历史', /历史|朝代|革命|战争|史料|文明/gi],
  ['地理', /地理|气候|地形|人口|区域|经纬/gi],
  ['信息技术', /编程|代码|python|javascript|java|算法|数据结构|计算机|人工智能|信息科技/gi],
  ['经济管理', /管理|经济|营销|财务|会计|组织|决策|市场|战略|人力资源/gi],
  ['法律', /法律|法治|民法|刑法|合同|权利|义务/gi],
  ['医学', /医学|临床|诊断|护理|药理|解剖|疾病/gi],
  ['艺术', /美术|音乐|绘画|设计|色彩|节奏|艺术/gi],
]

const STAGE_RULES = [
  {
    stage: 'preschool',
    pattern: /幼儿园|学前|学龄前|preschool|kindergarten/gi,
  },
  {
    stage: 'primary',
    pattern:
      /小学(?:[一二三四五六]年级)?|[一二三四五六]年级|小学阶段|primary school|grade [1-6]\b/gi,
  },
  {
    stage: 'junior',
    pattern:
      /初[一二三]|[七八九]年级|初中|初级中学|junior high|middle school|grade [7-9]\b/gi,
  },
  {
    stage: 'senior',
    pattern:
      /高[一二三]|高中|高级中学|senior high|high school|grade (?:1[0-2]|10|11|12)\b/gi,
  },
  {
    stage: 'university',
    pattern:
      /大[一二三四]|大学|本科|高校|研究生|硕士|博士|university|college|undergraduate|graduate school/gi,
  },
  {
    stage: 'adult',
    pattern: /成人|职场|职业培训|继续教育|企业培训|adult learner|professional learning/gi,
  },
]

const GRADE_PATTERNS = [
  /小学[一二三四五六]年级/g,
  /[一二三四五六]年级/g,
  /初[一二三]/g,
  /[七八九]年级/g,
  /高[一二三]/g,
  /大[一二三四]/g,
]

const DIFFICULTY_HINTS = [
  { stage: 'primary', pattern: /拼音|乘法口诀|认字|绘本|小学/gi },
  {
    stage: 'junior',
    pattern: /一元一次方程|有理数|整式|平行线|三角形|初中/gi,
  },
  {
    stage: 'senior',
    pattern: /高考|导数|圆锥曲线|立体几何|电磁感应|化学反应原理|高中/gi,
  },
  {
    stage: 'university',
    pattern:
      /微积分|线性代数|概率论|数据结构|学术论文|管理学原理|微观经济|宏观经济|大学|本科/gi,
  },
  {
    stage: 'adult',
    pattern: /职场|岗位|工作流程|企业管理培训|职业发展|继续教育/gi,
  },
]

function compact(value, max = 80) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function firstMatch(text, rules) {
  for (const rule of rules) {
    rule.pattern.lastIndex = 0
    const match = rule.pattern.exec(text)
    if (match) return { ...rule, evidence: compact(match[0], 40) }
  }
  return null
}

function exactGrade(text) {
  for (const pattern of GRADE_PATTERNS) {
    pattern.lastIndex = 0
    const match = pattern.exec(text)
    if (match) return compact(match[0], 20)
  }
  return ''
}

function inferSubject(text) {
  let best = null
  for (const [subject, pattern] of SUBJECT_RULES) {
    pattern.lastIndex = 0
    const matches = text.match(pattern)
    const count = matches?.length || 0
    if (count && (!best || count > best.count)) {
      best = { subject, count, evidence: compact(matches[0], 40) }
    }
  }
  return best || { subject: '综合主题', evidence: '' }
}

function profileFor(stage) {
  return { ...(STAGE_PROFILES[stage] || STAGE_PROFILES.adaptive) }
}

/**
 * 从本轮需求和材料中推断学科与学段。显式填写的学习者信息优先，
 * 其次是用户目标，最后才使用材料术语；无法判断时保持中性并自适应。
 */
export function inferLearnerProfile({
  objective = '',
  chapter = '',
  audience = '',
  materialText = '',
} = {}) {
  const audienceText = compact(audience, 500)
  const goalText = `${compact(chapter, 500)} ${compact(objective, 1000)}`.trim()
  const materialSample = compact(materialText, 24_000)
  const explicit =
    firstMatch(audienceText, STAGE_RULES) ||
    firstMatch(goalText, STAGE_RULES) ||
    firstMatch(materialSample, STAGE_RULES)
  const difficulty =
    (!explicit && firstMatch(goalText, DIFFICULTY_HINTS)) ||
    (!explicit && firstMatch(materialSample, DIFFICULTY_HINTS))
  const detected = explicit || difficulty
  const profile = profileFor(detected?.stage)
  const subject = inferSubject(`${goalText} ${materialSample}`)
  const grade = exactGrade(
    `${audienceText} ${goalText} ${materialSample.slice(0, 1200)}`,
  )

  return {
    ...profile,
    subject: subject.subject,
    gradeLabel: grade || profile.gradeLabel,
    confidence: explicit ? 'high' : difficulty ? 'medium' : 'low',
    evidence:
      explicit?.evidence ||
      difficulty?.evidence ||
      (subject.evidence ? `材料关键词：${subject.evidence}` : '未发现明确的年级或难度线索'),
    source: explicit ? 'explicit' : difficulty ? 'difficulty' : 'adaptive',
  }
}

function stageFromValue(value) {
  const text = compact(value, 80)
  const matched = firstMatch(text, STAGE_RULES)
  if (matched) return matched.stage
  if (/preschool|学前|幼儿园/i.test(text)) return 'preschool'
  if (/primary|小学/i.test(text)) return 'primary'
  if (/junior|初中/i.test(text)) return 'junior'
  if (/senior|高中/i.test(text)) return 'senior'
  if (/university|college|大学|本科/i.test(text)) return 'university'
  if (/adult|职业|成人/i.test(text)) return 'adult'
  return 'adaptive'
}

/** 校验模型回填的学习者画像，并补齐本地策略，避免模型漏字段导致提示词断档。 */
export function normalizeLearnerProfile(raw, fallbackInput = {}) {
  const inferred = inferLearnerProfile(fallbackInput)
  if (!raw || typeof raw !== 'object') return inferred
  const stage = stageFromValue(raw.stage || raw.grade || raw.gradeLabel)
  const profile = profileFor(stage === 'adaptive' ? inferred.stage : stage)
  return {
    ...profile,
    subject: compact(raw.subject, 60) || inferred.subject,
    gradeLabel: compact(raw.gradeLabel || raw.grade, 40) || inferred.gradeLabel,
    confidence: compact(raw.confidence, 20) || inferred.confidence,
    evidence: compact(raw.evidence, 120) || inferred.evidence,
    source: compact(raw.source, 20) || inferred.source,
    language: compact(raw.language, 220) || profile.language,
    teaching: compact(raw.teaching || raw.styleDirective, 320) || profile.teaching,
    board: compact(raw.board, 220) || profile.board,
  }
}

export function learnerProfileGuide(profile) {
  const safe = normalizeLearnerProfile(profile)
  return `学科：${safe.subject}
推测学段：${safe.stageLabel}（${safe.gradeLabel}，置信度：${safe.confidence}）
判断依据：${safe.evidence}
语言方式：${safe.language}
教学方式：${safe.teaching}
板书方式：${safe.board}
如用户明确写出年级、学科或学习目标，以用户信息为准，并立即修正上述推断。`
}

export function learnerProfileLabel(profile) {
  const safe = normalizeLearnerProfile(profile)
  const stage =
    safe.gradeLabel && !['未明确', safe.stageLabel].includes(safe.gradeLabel)
      ? `${safe.stageLabel} · ${safe.gradeLabel}`
      : safe.stageLabel
  return `${safe.subject} · ${stage}`
}

