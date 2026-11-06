/**
 * 七年级数学赛事数据。
 *
 * 默认加载赛方公开模拟学情数据；固定种子开发样例仅作为离线开发兜底。
 */
import { buildOfficialCompetitionDataset } from './officialDataset.js'

export const COMPETITION_DATASET_VERSION = 'math7-official-v1'
export const COMPETITION_DATASET_SEED = 20261104

export const TOPICS = [
  {
    id: 'NUM',
    title: '有理数',
    summary: '建立数轴、相反数、绝对值和有理数四则运算之间的联系。',
    requirementIds: ['REQ-NUM-01', 'REQ-NUM-02', 'REQ-NUM-03'],
  },
  {
    id: 'EXP',
    title: '整式',
    summary: '用字母表示数量关系，理解整式、同类项与整式加减。',
    requirementIds: ['REQ-EXP-01', 'REQ-EXP-02', 'REQ-EXP-03'],
  },
  {
    id: 'EQA',
    title: '一元一次方程',
    summary: '从等式性质到方程求解，再到用方程解决实际问题。',
    requirementIds: ['REQ-EQA-01', 'REQ-EQA-02', 'REQ-EQA-03'],
  },
]

export const REQUIREMENTS = [
  {
    id: 'REQ-NUM-01',
    topicId: 'NUM',
    code: 'NUM-01',
    title: '理解有理数的意义',
    content: '认识正数、负数和零，理解有理数在数轴上的表示。',
    expectation: '能根据数轴比较有理数大小，并解释相反数、绝对值的意义。',
    sourceRef: '开发样例·课程标准模块：数与代数',
    prerequisiteIds: [],
    nextRequirementIds: ['REQ-NUM-02', 'REQ-NUM-03'],
    materialIds: ['MAT-NUM-01', 'MAT-NUM-02'],
    questionIds: ['Q-NUM-01', 'Q-NUM-02', 'Q-NUM-03', 'Q-NUM-04'],
  },
  {
    id: 'REQ-NUM-02',
    topicId: 'NUM',
    code: 'NUM-02',
    title: '数轴、相反数与绝对值',
    content: '用数轴、相反数和绝对值描述有理数的位置与距离。',
    expectation: '能在数轴上表示有理数，正确求相反数与绝对值，并进行大小比较。',
    sourceRef: '开发样例·课程标准模块：数与代数',
    prerequisiteIds: ['REQ-NUM-01'],
    nextRequirementIds: ['REQ-NUM-03'],
    materialIds: ['MAT-NUM-03', 'MAT-NUM-04'],
    questionIds: ['Q-NUM-05', 'Q-NUM-06', 'Q-NUM-07', 'Q-NUM-08'],
  },
  {
    id: 'REQ-NUM-03',
    topicId: 'NUM',
    code: 'NUM-03',
    title: '有理数的四则运算',
    content: '掌握有理数加减乘除与混合运算的法则和运算顺序。',
    expectation: '能说明符号如何确定，按顺序完成混合运算，并检查结果的合理性。',
    sourceRef: '开发样例·课程标准模块：数与代数',
    prerequisiteIds: ['REQ-NUM-02'],
    nextRequirementIds: [],
    materialIds: ['MAT-NUM-05', 'MAT-NUM-06'],
    questionIds: [
      'Q-NUM-09',
      'Q-NUM-10',
      'Q-NUM-11',
      'Q-NUM-12',
      'Q-NUM-13',
      'Q-NUM-14',
      'Q-NUM-15',
      'Q-NUM-16',
      'Q-NUM-17',
      'Q-NUM-18',
      'Q-NUM-19',
      'Q-NUM-20',
    ],
  },
  {
    id: 'REQ-EXP-01',
    topicId: 'EXP',
    code: 'EXP-01',
    title: '用字母表示数量关系',
    content: '理解字母表示数，能根据文字关系列出代数式。',
    expectation: '能把实际情境中的数量关系准确转化为代数式，并说明每个字母的含义。',
    sourceRef: '开发样例·课程标准模块：代数式',
    prerequisiteIds: ['REQ-NUM-03'],
    nextRequirementIds: ['REQ-EXP-02', 'REQ-EXP-03'],
    materialIds: ['MAT-EXP-01', 'MAT-EXP-02'],
    questionIds: ['Q-EXP-01', 'Q-EXP-02', 'Q-EXP-03', 'Q-EXP-04'],
  },
  {
    id: 'REQ-EXP-02',
    topicId: 'EXP',
    code: 'EXP-02',
    title: '整式、单项式与多项式',
    content: '辨析单项式、多项式和整式，理解系数、次数与项。',
    expectation: '能指出单项式的系数和次数，识别多项式的项与次数。',
    sourceRef: '开发样例·课程标准模块：整式',
    prerequisiteIds: ['REQ-EXP-01'],
    nextRequirementIds: ['REQ-EXP-03'],
    materialIds: ['MAT-EXP-03', 'MAT-EXP-04'],
    questionIds: ['Q-EXP-05', 'Q-EXP-06', 'Q-EXP-07', 'Q-EXP-08'],
  },
  {
    id: 'REQ-EXP-03',
    topicId: 'EXP',
    code: 'EXP-03',
    title: '同类项与整式加减',
    content: '识别同类项，掌握合并同类项和去括号后的整式加减。',
    expectation: '能依据同类项定义正确合并，处理括号符号，并完成整式加减。',
    sourceRef: '开发样例·课程标准模块：整式',
    prerequisiteIds: ['REQ-EXP-02'],
    nextRequirementIds: [],
    materialIds: ['MAT-EXP-05', 'MAT-EXP-06'],
    questionIds: [
      'Q-EXP-09',
      'Q-EXP-10',
      'Q-EXP-11',
      'Q-EXP-12',
      'Q-EXP-13',
      'Q-EXP-14',
      'Q-EXP-15',
      'Q-EXP-16',
      'Q-EXP-17',
      'Q-EXP-18',
      'Q-EXP-19',
      'Q-EXP-20',
    ],
  },
  {
    id: 'REQ-EQA-01',
    topicId: 'EQA',
    code: 'EQA-01',
    title: '等式与方程',
    content: '理解等式性质，区分代数式、等式和方程。',
    expectation: '能判断一个式子是否为方程，并依据等式性质进行等价变形。',
    sourceRef: '开发样例·课程标准模块：方程与不等式',
    prerequisiteIds: ['REQ-EXP-03'],
    nextRequirementIds: ['REQ-EQA-02', 'REQ-EQA-03'],
    materialIds: ['MAT-EQA-01', 'MAT-EQA-02'],
    questionIds: ['Q-EQA-01', 'Q-EQA-02', 'Q-EQA-03', 'Q-EQA-04'],
  },
  {
    id: 'REQ-EQA-02',
    topicId: 'EQA',
    code: 'EQA-02',
    title: '解一元一次方程',
    content: '掌握移项、合并同类项、去括号和系数化为 1。',
    expectation: '能按等价变形步骤求解一元一次方程，并代回检验。',
    sourceRef: '开发样例·课程标准模块：方程与不等式',
    prerequisiteIds: ['REQ-EQA-01'],
    nextRequirementIds: ['REQ-EQA-03'],
    materialIds: ['MAT-EQA-03', 'MAT-EQA-04'],
    questionIds: ['Q-EQA-05', 'Q-EQA-06', 'Q-EQA-07', 'Q-EQA-08'],
  },
  {
    id: 'REQ-EQA-03',
    topicId: 'EQA',
    code: 'EQA-03',
    title: '一元一次方程的应用',
    content: '从实际问题中提炼未知量和等量关系，建立并解释方程。',
    expectation: '能说明未知量、等量关系和求解结果的实际意义。',
    sourceRef: '开发样例·课程标准模块：方程与不等式',
    prerequisiteIds: ['REQ-EQA-02'],
    nextRequirementIds: [],
    materialIds: ['MAT-EQA-05', 'MAT-EQA-06'],
    questionIds: [
      'Q-EQA-09',
      'Q-EQA-10',
      'Q-EQA-11',
      'Q-EQA-12',
      'Q-EQA-13',
      'Q-EQA-14',
      'Q-EQA-15',
      'Q-EQA-16',
      'Q-EQA-17',
      'Q-EQA-18',
      'Q-EQA-19',
      'Q-EQA-20',
    ],
  },
]

export const MATERIALS = [
  {
    id: 'MAT-NUM-01',
    topicId: 'NUM',
    requirementIds: ['REQ-NUM-01'],
    type: 'course_requirement',
    title: '有理数与数轴：课程要求',
    sourceRef: '开发样例·课程标准模块',
    locator: '数与代数·有理数·要求 1',
    content: '能在具体情境中认识负数，理解有理数及其大小关系；会用数轴表示有理数。',
  },
  {
    id: 'MAT-NUM-02',
    topicId: 'NUM',
    requirementIds: ['REQ-NUM-01'],
    type: 'explainer',
    title: '为什么要从数轴理解有理数',
    sourceRef: '开发样例·配套学习材料',
    locator: '第 1 章 1.1 节，P2-4',
    content: '数轴把数的大小、方向和距离放在同一幅图中。原点、正方向和单位长度是数轴的三要素。',
  },
  {
    id: 'MAT-NUM-03',
    topicId: 'NUM',
    requirementIds: ['REQ-NUM-02'],
    type: 'worked_example',
    title: '相反数与绝对值例析',
    sourceRef: '开发样例·例题材料',
    locator: '第 1 章 1.2 节，例 3-例 5',
    content: '相反数关注符号相反、距离相同；绝对值只关注到原点的距离。比较负数时，绝对值大的反而小。',
  },
  {
    id: 'MAT-NUM-04',
    topicId: 'NUM',
    requirementIds: ['REQ-NUM-02'],
    type: 'exercise_set',
    title: '数轴与绝对值基础练习',
    sourceRef: '开发样例·配套练习',
    locator: '练习 1.2，题 1-8',
    content: '覆盖数轴读数、相反数、绝对值和有理数大小比较。',
  },
  {
    id: 'MAT-NUM-05',
    topicId: 'NUM',
    requirementIds: ['REQ-NUM-03'],
    type: 'explainer',
    title: '有理数四则运算的符号规则',
    sourceRef: '开发样例·配套学习材料',
    locator: '第 1 章 1.3-1.4 节',
    content: '先确定符号，再处理绝对值。混合运算遵循先乘除后加减，有括号先算括号。',
  },
  {
    id: 'MAT-NUM-06',
    topicId: 'NUM',
    requirementIds: ['REQ-NUM-03'],
    type: 'worked_example',
    title: '有理数混合运算错例',
    sourceRef: '开发样例·错例材料',
    locator: '第 1 章复习，P24',
    content: '常见错误包括漏看负号、把减负数当作减法、先加减后乘除以及括号前负号处理错误。',
  },
  {
    id: 'MAT-EXP-01',
    topicId: 'EXP',
    requirementIds: ['REQ-EXP-01'],
    type: 'course_requirement',
    title: '用字母表示数：课程要求',
    sourceRef: '开发样例·课程标准模块',
    locator: '代数式·要求 1',
    content: '理解用字母表示数的意义，能根据数量关系列出代数式并解释字母的实际含义。',
  },
  {
    id: 'MAT-EXP-02',
    topicId: 'EXP',
    requirementIds: ['REQ-EXP-01'],
    type: 'worked_example',
    title: '从文字关系到代数式',
    sourceRef: '开发样例·例题材料',
    locator: '第 2 章 2.1 节，例 1-例 4',
    content: '先找数量、再找关系、最后检查单位和运算顺序。例如“比 x 的 2 倍少 3”写作 2x-3。',
  },
  {
    id: 'MAT-EXP-03',
    topicId: 'EXP',
    requirementIds: ['REQ-EXP-02'],
    type: 'explainer',
    title: '单项式、多项式与整式',
    sourceRef: '开发样例·配套学习材料',
    locator: '第 2 章 2.2 节',
    content: '单项式的数字因数是系数，所有字母指数之和是次数；几个单项式的和是多项式；两者统称整式。',
  },
  {
    id: 'MAT-EXP-04',
    topicId: 'EXP',
    requirementIds: ['REQ-EXP-02'],
    type: 'exercise_set',
    title: '整式概念辨析练习',
    sourceRef: '开发样例·配套练习',
    locator: '练习 2.2，题 1-10',
    content: '区分整式与非整式，识别系数、次数、项和常数项。',
  },
  {
    id: 'MAT-EXP-05',
    topicId: 'EXP',
    requirementIds: ['REQ-EXP-03'],
    type: 'explainer',
    title: '同类项与去括号',
    sourceRef: '开发样例·配套学习材料',
    locator: '第 2 章 2.3 节',
    content: '所含字母相同且相同字母指数也相同的是同类项。括号前是负号时，括号内各项都要变号。',
  },
  {
    id: 'MAT-EXP-06',
    topicId: 'EXP',
    requirementIds: ['REQ-EXP-03'],
    type: 'worked_example',
    title: '整式加减的分步示范',
    sourceRef: '开发样例·例题材料',
    locator: '第 2 章 2.4 节，例 6-例 9',
    content: '先标出同类项，再决定是否去括号，最后合并系数。每一步都保留原式，便于检查符号。',
  },
  {
    id: 'MAT-EQA-01',
    topicId: 'EQA',
    requirementIds: ['REQ-EQA-01'],
    type: 'course_requirement',
    title: '等式与方程：课程要求',
    sourceRef: '开发样例·课程标准模块',
    locator: '方程与不等式·要求 1',
    content: '理解等式的基本性质，能判断方程，体会方程是刻画数量关系的模型。',
  },
  {
    id: 'MAT-EQA-02',
    topicId: 'EQA',
    requirementIds: ['REQ-EQA-01'],
    type: 'explainer',
    title: '等式性质与等价变形',
    sourceRef: '开发样例·配套学习材料',
    locator: '第 3 章 3.1 节',
    content: '等式两边同时加、减、乘同一个数，或除以同一个非零数，等式仍成立。',
  },
  {
    id: 'MAT-EQA-03',
    topicId: 'EQA',
    requirementIds: ['REQ-EQA-02'],
    type: 'worked_example',
    title: '解一元一次方程的标准步骤',
    sourceRef: '开发样例·例题材料',
    locator: '第 3 章 3.2 节，例 1-例 7',
    content: '去分母、去括号、移项、合并同类项、系数化为 1；最后把解代回原方程检验。',
  },
  {
    id: 'MAT-EQA-04',
    topicId: 'EQA',
    requirementIds: ['REQ-EQA-02'],
    type: 'exercise_set',
    title: '一元一次方程阶梯练习',
    sourceRef: '开发样例·配套练习',
    locator: '练习 3.2，题 1-15',
    content: '从移项到去括号，再到含分母方程，按难度递进。',
  },
  {
    id: 'MAT-EQA-05',
    topicId: 'EQA',
    requirementIds: ['REQ-EQA-03'],
    type: 'explainer',
    title: '列方程找等量关系',
    sourceRef: '开发样例·配套学习材料',
    locator: '第 3 章 3.3 节',
    content: '先设未知数，再用同一件事的两种表达建立等式。关键是让等号两边单位一致、含义相同。',
  },
  {
    id: 'MAT-EQA-06',
    topicId: 'EQA',
    requirementIds: ['REQ-EQA-03'],
    type: 'worked_example',
    title: '行程与分配问题建模',
    sourceRef: '开发样例·例题材料',
    locator: '第 3 章 3.4 节，例 8-例 12',
    content: '行程问题围绕路程、速度和时间建立关系；分配问题围绕总量守恒建立关系。',
  },
]

function mulberry32(seed) {
  let value = seed >>> 0
  return function random() {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function integer(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min
}

function signed(random, min = 1, max = 9) {
  const value = integer(random, min, max)
  return random() < 0.5 ? -value : value
}

function question(id, topicId, requirementId, materialId, type, difficulty, stem, answer, concepts) {
  return {
    id,
    topicId,
    requirementId,
    materialId,
    type,
    difficulty,
    stem,
    answer: String(answer),
    concepts,
  }
}

function buildQuestions(random) {
  const list = [
    question('Q-NUM-01', 'NUM', 'REQ-NUM-01', 'MAT-NUM-01', 'choice', 1, '下列各数中，属于负数的是（ ）', '-3', ['负数']),
    question('Q-NUM-02', 'NUM', 'REQ-NUM-01', 'MAT-NUM-02', 'choice', 1, '数轴上原点表示的数是（ ）', '0', ['数轴']),
    question('Q-NUM-03', 'NUM', 'REQ-NUM-01', 'MAT-NUM-02', 'choice', 2, '在数轴上，位于原点右侧且距离原点 4 个单位的数是（ ）', '4', ['数轴', '正数']),
    question('Q-NUM-04', 'NUM', 'REQ-NUM-01', 'MAT-NUM-01', 'judgment', 2, '“所有整数都是有理数”是否正确？', '正确', ['有理数']),
    question('Q-NUM-05', 'NUM', 'REQ-NUM-02', 'MAT-NUM-04', 'calculation', 1, '-7 的相反数是____。', '7', ['相反数']),
    question('Q-NUM-06', 'NUM', 'REQ-NUM-02', 'MAT-NUM-03', 'calculation', 1, '|-12|=____。', '12', ['绝对值']),
    question('Q-NUM-07', 'NUM', 'REQ-NUM-02', 'MAT-NUM-03', 'choice', 2, '比较 -5 与 -2 的大小，正确的是（ ）', '-5 < -2', ['有理数比较', '绝对值']),
    question('Q-NUM-08', 'NUM', 'REQ-NUM-02', 'MAT-NUM-04', 'calculation', 2, '若 |x|=6，则 x=____。', '6 或 -6', ['绝对值']),
  ]

  for (let index = 9; index <= 20; index += 1) {
    const a = signed(random)
    const b = signed(random)
    const c = signed(random, 2, 6)
    const d = signed(random, 2, 9)
    const specs = [
      [`(${a})+(${b})=____。`, a + b, ['有理数加法']],
      [`(${a})-(${b})=____。`, a - b, ['有理数减法']],
      [`(${a})×(${b})=____。`, a * b, ['有理数乘法']],
      [`(${a * b})÷${b}=____。`, a, ['有理数除法']],
      [`${Math.abs(a)}+(${b})×2=____。`, Math.abs(a) + b * 2, ['混合运算', '运算顺序']],
      [`(${a}+${b})×(${c})=____。`, (a + b) * c, ['混合运算', '括号']],
      [`-${Math.abs(a)}+|${b}|=____。`, -Math.abs(a) + Math.abs(b), ['绝对值', '加法']],
      [`(${a})×(${b})+${Math.abs(c)}=____。`, a * b + Math.abs(c), ['混合运算']],
      [`${Math.abs(a)}-${d}=____。`, Math.abs(a) - d, ['减法']],
      [`(${a})÷${c}=____（结果用分数表示）。`, `${a}/${c}`, ['除法', '分数']],
      [`-(${a})+(${b})-(${c})=____。`, -a + b - c, ['加减混合']],
      [`(${a})×(${b})÷(${c})=____（结果用分数表示）。`, `${a * b}/${c}`, ['乘除混合']],
    ]
    const [stem, answer, concepts] = specs[index - 9]
    list.push(
      question(
        `Q-NUM-${String(index).padStart(2, '0')}`,
        'NUM',
        index <= 8 ? 'REQ-NUM-02' : 'REQ-NUM-03',
        index <= 8 ? 'MAT-NUM-04' : 'MAT-NUM-05',
        'calculation',
        Math.min(3, Math.ceil((index - 8) / 4)),
        stem,
        answer,
        concepts,
      ),
    )
  }

  list.push(
    question('Q-EXP-01', 'EXP', 'REQ-EXP-01', 'MAT-EXP-01', 'choice', 1, '“a 的 3 倍与 2 的差”可表示为（ ）', '3a-2', ['列代数式']),
    question('Q-EXP-02', 'EXP', 'REQ-EXP-01', 'MAT-EXP-02', 'calculation', 1, '苹果每千克 p 元，买 4 千克需要____元。', '4p', ['字母表示数']),
    question('Q-EXP-03', 'EXP', 'REQ-EXP-01', 'MAT-EXP-02', 'choice', 2, '若每支笔 x 元，买 3 支后付 20 元，应找回（ ）元。', '20-3x', ['列代数式']),
    question('Q-EXP-04', 'EXP', 'REQ-EXP-01', 'MAT-EXP-01', 'judgment', 2, '在代数式中，同一字母表示同一个数。', '正确', ['字母表示数']),
    question('Q-EXP-05', 'EXP', 'REQ-EXP-02', 'MAT-EXP-04', 'choice', 1, '单项式 -5x²y 的系数是（ ）', '-5', ['单项式', '系数']),
    question('Q-EXP-06', 'EXP', 'REQ-EXP-02', 'MAT-EXP-03', 'calculation', 2, '单项式 -5x²y 的次数是____。', '3', ['单项式', '次数']),
    question('Q-EXP-07', 'EXP', 'REQ-EXP-02', 'MAT-EXP-04', 'choice', 2, '下列式子中，是多项式的是（ ）', 'x²-2x+1', ['多项式']),
    question('Q-EXP-08', 'EXP', 'REQ-EXP-02', 'MAT-EXP-03', 'judgment', 2, '2x+1 的常数项是 1。', '正确', ['多项式', '项']),
  )

  for (let index = 9; index <= 20; index += 1) {
    const a = integer(random, 2, 8)
    const b = integer(random, 1, 7)
    const specs = [
      [`${a}x 与 ${b}x 合并同类项得____。`, `${a + b}x`, ['同类项']],
      [`${a}x² 与 ${b}x 是同类项吗？`, '不是', ['同类项']],
      [`${a}a+${b}a=____。`, `${a + b}a`, ['合并同类项']],
      [`-(${a}x-${b})=____。`, `-${a}x+${b}`, ['去括号']],
      [`${a}x+(2x-${b})=____。`, `${a + 2}x-${b}`, ['整式加减']],
      [`${a}x-(${b}x-3)=____。`, `${a - b}x+3`, ['整式加减', '去括号']],
      [`2(${a}x+1)-${b}x=____。`, `${2 * a - b}x+2`, ['整式加减']],
      [`若 ${a}x+${b}x=(${a + b})x，依据是____。`, '合并同类项', ['合并同类项']],
      [`3a² 与 ${a}a² 的和是____。`, `${3 + a}a²`, ['同类项']],
      [`(x+${a})-(x-${b})=____。`, `${a + b}`, ['整式减法']],
      [`2a-3a+${b}a=____。`, `${b - 1}a`, ['合并同类项']],
      [`当 x=${a} 时，2x-${b}=____。`, `2*${a}-${b}`, ['代数式求值']],
    ]
    const [stem, answer, concepts] = specs[index - 9]
    list.push(
      question(
        `Q-EXP-${String(index).padStart(2, '0')}`,
        'EXP',
        index <= 8 ? 'REQ-EXP-02' : 'REQ-EXP-03',
        index <= 8 ? 'MAT-EXP-04' : 'MAT-EXP-05',
        'calculation',
        Math.min(3, Math.ceil((index - 8) / 4)),
        stem,
        answer,
        concepts,
      ),
    )
  }

  list.push(
    question('Q-EQA-01', 'EQA', 'REQ-EQA-01', 'MAT-EQA-01', 'choice', 1, '下列式子中是方程的是（ ）', 'x+3=8', ['方程']),
    question('Q-EQA-02', 'EQA', 'REQ-EQA-01', 'MAT-EQA-02', 'judgment', 1, '等式两边同时加同一个数，等式仍成立。', '正确', ['等式性质']),
    question('Q-EQA-03', 'EQA', 'REQ-EQA-01', 'MAT-EQA-02', 'calculation', 2, '若 x-4=3，则 x=____。', '7', ['等式性质']),
    question('Q-EQA-04', 'EQA', 'REQ-EQA-01', 'MAT-EQA-01', 'choice', 2, '方程与等式的区别是（ ）', '方程必须含未知数', ['方程', '等式']),
    question('Q-EQA-05', 'EQA', 'REQ-EQA-02', 'MAT-EQA-03', 'calculation', 1, '解方程：x+5=12，x=____。', '7', ['移项']),
    question('Q-EQA-06', 'EQA', 'REQ-EQA-02', 'MAT-EQA-04', 'calculation', 2, '解方程：2x-3=9，x=____。', '6', ['移项', '系数化为1']),
    question('Q-EQA-07', 'EQA', 'REQ-EQA-02', 'MAT-EQA-03', 'calculation', 2, '解方程：3(x-1)=12，x=____。', '5', ['去括号']),
    question('Q-EQA-08', 'EQA', 'REQ-EQA-02', 'MAT-EQA-04', 'calculation', 3, '解方程：x/2+1=4，x=____。', '6', ['去分母']),
  )

  for (let index = 9; index <= 20; index += 1) {
    const a = integer(random, 2, 6)
    const b = integer(random, 3, 12)
    const ans = b + 3
    const specs = [
      [`某数的 ${a} 倍加 3 等于 ${a * ans + 3}，这个数是____。`, ans, ['列方程']],
      [`小明有 x 元，买书花去 ${b} 元后还剩 5 元，列方程为____。`, `x-${b}=5`, ['等量关系']],
      [`一根绳子剪去 ${b} 米后还剩 8 米，原长 x=____。`, b + 8, ['方程应用']],
      [`甲速 ${a} 千米/时，2 小时行____千米。`, 2 * a, ['行程问题']],
      [`路程 30 千米，速度 x 千米/时，3 小时到达，列方程为____。`, '3x=30', ['行程问题']],
      [`某数的 2 倍少 ${b} 等于 8，这个数是____。`, (8 + b) / 2, ['方程应用']],
      [`x 的 ${a} 倍与 ${b} 的差为 0，则 x=____。`, b / a, ['方程应用']],
      [`3 件同样商品共 ${a * b} 元，每件 x 元，列方程为____。`, `3x=${a * b}`, ['等量关系']],
      [`一个长方形长 ${a + 2}，宽 x，周长 20，列方程为____。`, `2(${a + 2}+x)=20`, ['几何建模']],
      [`某数加上 ${b} 再乘 2 得 ${2 * (b + 4)}，这个数是____。`, 4, ['列方程']],
      [`x 的 3 倍等于 ${3 * b}，x=____。`, b, ['解方程']],
      [`若 5x+${b}=${5 * a + b}，则 x=____。`, a, ['解方程']],
    ]
    const [stem, answer, concepts] = specs[index - 9]
    list.push(
      question(
        `Q-EQA-${String(index).padStart(2, '0')}`,
        'EQA',
        index <= 8 ? 'REQ-EQA-02' : 'REQ-EQA-03',
        index <= 8 ? 'MAT-EQA-04' : 'MAT-EQA-05',
        'application',
        Math.min(3, Math.ceil((index - 8) / 4)),
        stem,
        answer,
        concepts,
      ),
    )
  }

  return list
}

const NAMES = [
  '林晓禾', '周予安', '陈知夏', '赵清川', '许星遥', '沈嘉树',
  '顾明澈', '苏念一', '唐乐言', '韩若宁', '叶书宁', '程亦舟',
  '陆知远', '江可欣', '何予辰', '方雨桐', '高云舒', '罗一诺',
  '魏思齐', '谢知微', '梁景行', '蒋言溪', '宋南乔', '杜清和',
  '夏予宁', '钟书言', '白知遥', '邵安澜', '秦乐知', '孟星河',
]

const STUDENTS = NAMES.map((displayName, index) => ({
  id: `S${String(index + 1).padStart(3, '0')}`,
  displayName,
  group: ['A组', 'B组', 'C组'][index % 3],
  grade: '七年级',
}))

const QUESTION_BY_ID = new Map()
const REQUIREMENT_BY_ID = new Map(REQUIREMENTS.map((item) => [item.id, item]))

function buildLearningRecords(random, questions) {
  questions.forEach((item) => QUESTION_BY_ID.set(item.id, item))
  const records = []
  const statuses = ['correct', 'partial', 'incorrect', 'missing']
  const baseDate = Date.UTC(2026, 9, 8, 8, 0, 0)

  STUDENTS.forEach((student, studentIndex) => {
    const proficiency = {}
    REQUIREMENTS.forEach((requirement, requirementIndex) => {
      const offset = requirementIndex < 3 ? 0.08 : requirementIndex < 6 ? -0.02 : -0.1
      proficiency[requirement.id] =
        0.38 + random() * 0.5 + offset + (studentIndex % 7 === 0 ? -0.18 : 0)
    })

    const attemptCount = studentIndex >= 28 ? 2 + (studentIndex % 2) : 13 + (studentIndex % 4)
    for (let attempt = 0; attempt < attemptCount; attempt += 1) {
      const requirement =
        REQUIREMENTS[integer(random, 0, REQUIREMENTS.length - 1)]
      const candidates = requirement.questionIds
        .map((id) => QUESTION_BY_ID.get(id))
        .filter(Boolean)
      const item = candidates[integer(random, 0, candidates.length - 1)]
      const skill = Math.max(0.08, Math.min(0.96, proficiency[requirement.id]))
      const difficultyPenalty = (item.difficulty - 1) * 0.16
      const roll = random()
      let status = 'correct'
      if (roll > skill + 0.08 - difficultyPenalty) status = 'partial'
      if (roll > skill + 0.3 - difficultyPenalty) status = 'incorrect'
      if (studentIndex >= 28 && attempt % 2 === 1) status = 'missing'
      if (random() < 0.035) status = 'missing'

      const maxScore = 10
      const score =
        status === 'correct'
          ? 10
          : status === 'partial'
            ? 5
            : status === 'incorrect'
              ? 0
              : null
      const day = 8 + Math.floor((studentIndex * 13 + attempt) / 28)
      const hour = 8 + ((studentIndex + attempt * 3) % 10)
      const minute = (studentIndex * 7 + attempt * 11) % 60

      records.push({
        id: `R${String(records.length + 1).padStart(5, '0')}`,
        studentId: student.id,
        questionId: item.id,
        materialId: item.materialId,
        requirementId: item.requirementId,
        status,
        score,
        maxScore,
        attemptedAt: new Date(
          baseDate + day * 86400000 + hour * 3600000 + minute * 60000,
        ).toISOString(),
        source: 'development-sample-generator',
      })
    }
  })

  // 刻意加入质量缺陷，用于验证“保留原文、报告问题、有效数据隔离”。
  records.push({ ...records[4] })
  records.push({
    id: 'R-Q-UNKNOWN-STUDENT',
    studentId: 'S-UNKNOWN',
    questionId: 'Q-NUM-01',
    materialId: 'MAT-NUM-01',
    requirementId: 'REQ-NUM-01',
    status: 'correct',
    score: 10,
    maxScore: 10,
    attemptedAt: '2026-10-15T09:20:00.000Z',
    source: 'quality-fixture',
  })
  records.push({
    id: 'R-Q-UNKNOWN-QUESTION',
    studentId: 'S001',
    questionId: 'Q-NOT-FOUND',
    materialId: 'MAT-NOT-FOUND',
    requirementId: 'REQ-NUM-01',
    status: 'incorrect',
    score: 0,
    maxScore: 10,
    attemptedAt: '2026-10-15T09:25:00.000Z',
    source: 'quality-fixture',
  })
  records.push({
    id: 'R-Q-NEGATIVE-SCORE',
    studentId: 'S002',
    questionId: 'Q-NUM-01',
    materialId: 'MAT-NUM-01',
    requirementId: 'REQ-NUM-01',
    status: 'partial',
    score: -2,
    maxScore: 10,
    attemptedAt: '2026-10-15T09:30:00.000Z',
    source: 'quality-fixture',
  })
  records.push({
    id: 'R-Q-MISSING-STUDENT-FIELD',
    studentId: '',
    questionId: 'Q-EXP-01',
    materialId: 'MAT-EXP-01',
    requirementId: 'REQ-EXP-01',
    status: 'correct',
    score: 10,
    maxScore: 10,
    attemptedAt: '2026-10-15T09:35:00.000Z',
    source: 'quality-fixture',
  })
  records.push({
    id: 'R-Q-BAD-STATUS',
    studentId: 'S003',
    questionId: 'Q-EQA-01',
    materialId: 'MAT-EQA-01',
    requirementId: 'REQ-EQA-01',
    status: 'unreadable',
    score: 6,
    maxScore: 10,
    attemptedAt: 'not-a-date',
    source: 'quality-fixture',
  })

  return records
}

export const DATA_DICTIONARY = [
  { field: 'recordId', aliases: ['id', 'record_id'], type: 'string', required: true },
  { field: 'studentId', aliases: ['student_id', '学生编号'], type: 'string', required: true },
  { field: 'questionId', aliases: ['question_id', '题目编号', '材料编号'], type: 'string', required: true },
  { field: 'materialId', aliases: ['material_id', '材料编号'], type: 'string', required: false },
  { field: 'attemptEventId', aliases: ['attempt_event_id', '作答事件编号'], type: 'string', required: false },
  { field: 'revision', aliases: ['修订版本'], type: 'number', required: false },
  { field: 'gradingStatus', aliases: ['评分状态'], type: 'enum', required: false },
  { field: 'nodeId', aliases: ['节点编号'], type: 'string', required: false },
  { field: 'status', aliases: ['result', '作答结果'], type: 'enum', required: true },
  { field: 'score', aliases: ['得分'], type: 'number', required: false },
  { field: 'maxScore', aliases: ['满分', 'max_score'], type: 'number', required: false },
  { field: 'attemptedAt', aliases: ['timestamp', '作答时间', '模拟提交时间'], type: 'datetime', required: false },
  { field: 'finalAnswer', aliases: ['学生最终作答'], type: 'string', required: false },
  { field: 'solution', aliases: ['解答过程'], type: 'string', required: false },
  { field: 'scoringPointScores', aliases: ['评分点得分'], type: 'string', required: false },
]

export function buildDevelopmentCompetitionDataset(seed = COMPETITION_DATASET_SEED) {
  const random = mulberry32(seed)
  const questions = buildQuestions(random)
  const learningRecords = buildLearningRecords(random, questions)
  return {
    meta: {
      id: 'math7-development-sample',
      version: COMPETITION_DATASET_VERSION,
      seed,
      title: '七年级数学 · 智慧学伴开发样例',
      grade: '七年级',
      subject: '数学',
      sourceType: 'development-sample',
      official: false,
      disclaimer:
        '当前数据由固定种子生成，仅用于开发和演示。正式评测须以赛方发布的数据包及字段说明为准。',
      generatedAt: '2026-11-04T12:00:00.000Z',
    },
    topics: JSON.parse(JSON.stringify(TOPICS)),
    requirements: JSON.parse(JSON.stringify(REQUIREMENTS)),
    materials: JSON.parse(JSON.stringify(MATERIALS)),
    questions,
    students: JSON.parse(JSON.stringify(STUDENTS)),
    taskConditions: [
      {
        id: 'TASK-01',
        title: '学习内容与要求梳理',
        audience: ['teacher', 'student'],
        scope: ['NUM', 'EXP', 'EQA'],
        constraints: ['保留材料出处', '说明要求之间的必要联系'],
      },
      {
        id: 'TASK-02',
        title: '个体与群体学情分析',
        audience: ['teacher', 'student'],
        scope: ['NUM', 'EXP', 'EQA'],
        constraints: ['缺失记录不等于未掌握', '结论必须附统计依据'],
      },
      {
        id: 'TASK-03',
        title: '个性化学习建议',
        audience: ['teacher', 'student'],
        scope: ['NUM', 'EXP', 'EQA'],
        constraints: ['对应具体材料与练习', '说明理由和先后顺序', '教师可调整'],
      },
    ],
    learningRecords,
  }
}

export function buildCompetitionDataset() {
  return buildOfficialCompetitionDataset()
}

export function getRequirement(dataset, requirementId) {
  return dataset?.requirements?.find((item) => item.id === requirementId) || null
}

export function getQuestion(dataset, questionId) {
  return dataset?.questions?.find((item) => item.id === questionId) || null
}

export function getMaterial(dataset, materialId) {
  return dataset?.materials?.find((item) => item.id === materialId) || null
}

export function getTopic(dataset, topicId) {
  return dataset?.topics?.find((item) => item.id === topicId) || null
}

export { REQUIREMENT_BY_ID }
