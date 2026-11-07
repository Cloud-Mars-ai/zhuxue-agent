/**
 * 易错点库（error patterns）
 *
 * 来源：docs/research/teaching-video-advantages-and-ai-reuse.md §4
 * ——从 41 个七年级教学视频直接抽取的 12 条错因种子。
 *
 * 用途（报告 D4 / B4 / E3）：
 * - wrong-first block 的错因只能从这里选，不允许模型无来源编造；
 * - emphasisCount ≥ 2 的条目在提示词中被标记为"本课需重复强调 ≥2 次"；
 * - quiz 题目与 review 特殊值汇总引用同一库，保证跨场景一致。
 *
 * 字段：id / domain / topics / wrong（错因）/ correct（正确做法）/
 *       sources（出现视频）/ emphasisCount / tags（检索标签）。
 */

export const ERROR_PATTERNS = [
  {
    id: 'ep-01',
    domain: 'math7',
    topics: ['有理数运算', '代入求值'],
    wrong: '负数“裸奔”：负数参与后续运算（乘方、代入、作分母）时忘记加括号',
    correct: '凡是负数要参与下一步运算，先加括号再算，避免符号管辖区扩大或缩小',
    sources: ['v12', 'v18', 'v20'],
    emphasisCount: 2,
    tags: ['负数', '括号', '代入', '符号'],
  },
  {
    id: 'ep-02',
    domain: 'math7',
    topics: ['有理数乘方'],
    wrong: '指数管辖范围不清：把 -5² 与 (-5)² 当成一样，或分不清分子、分母、负号谁参与乘方',
    correct: '先确认底数是谁：-5² 的底数是 5、符号在管辖外；(-5)² 的底数是 -5',
    sources: ['v19', 'v20'],
    emphasisCount: 3,
    tags: ['乘方', '底数', '符号', '优先级'],
  },
  {
    id: 'ep-03',
    domain: 'math7',
    topics: ['一元一次方程', '等式性质'],
    wrong: '移项不变号：把方程一边的项移到另一边时忘记变号',
    correct: '移项等于在等式两边做同减或同除，符号必须跟着改变；写完回带检查',
    sources: ['v26'],
    emphasisCount: 1,
    tags: ['移项', '变号', '方程'],
  },
  {
    id: 'ep-04',
    domain: 'math7',
    topics: '一元一次方程',
    wrong: '去分母漏项：只给含分母的项乘公分母，漏掉整数项；或分子是一整个式子时忘记加括号',
    correct: '每一项都要乘公分母；分子是多项式时去分母后加括号；整数项也不例外',
    sources: ['v28'],
    emphasisCount: 3,
    tags: ['去分母', '漏项', '括号', '方程'],
  },
  {
    id: 'ep-05',
    domain: 'math7',
    topics: ['解方程', '分数运算'],
    wrong: '把“分母化整”和“去分母”混为一谈：前者只动这一个分数，后者动方程的每一项',
    correct: '先判断目的：只是让这一个分数好看就分子分母同乘；要消去所有分母才对每项操作',
    sources: ['v29'],
    emphasisCount: 2,
    tags: ['分母化整', '去分母', '方程'],
  },
  {
    id: 'ep-06',
    domain: 'math7',
    topics: ['有理数乘除'],
    wrong: '乘除混合运算挑好算的先算，不按从左到右；除法没有先变乘法',
    correct: '同级运算从左到右；除以一个数先变成乘它的倒数，再定符号最后算绝对值',
    sources: ['v16', 'v17'],
    emphasisCount: 2,
    tags: ['乘除', '顺序', '倒数'],
  },
  {
    id: 'ep-07',
    domain: 'math7',
    topics: ['一元一次方程'],
    wrong: '忽略一元一次方程系数不能为 0：含参方程不讨论就下结论',
    correct: '先看二次项系数：m-1=0 或 m-2=0 时要单独讨论，不能直接两边同除',
    sources: ['v24', 'v35'],
    emphasisCount: 2,
    tags: ['含参方程', '系数', '讨论'],
  },
  {
    id: 'ep-08',
    domain: 'math7',
    topics: ['等式性质', '代数式'],
    wrong: '等式两边同除时除数可能为 0；看不出 c²+1、|c|+1 型式子必然非零',
    correct: '同除前先确认除数不为 0；平方加 1、绝对值加 1 的式子可以直接判定非零',
    sources: ['v25'],
    emphasisCount: 1,
    tags: ['除数', '非负', '平方', '绝对值'],
  },
  {
    id: 'ep-09',
    domain: 'math7',
    topics: ['有理数', '相反数', '倒数'],
    wrong: '把 0 当正数或负数；认为 0 有倒数；忽略 0 是正负数的分界',
    correct: '0 非正非负，是分界；0 没有倒数；0 的相反数是 0 本身',
    sources: ['v01', 'v16', 'v03'],
    emphasisCount: 3,
    tags: ['0', '分界', '倒数', '相反数'],
  },
  {
    id: 'ep-10',
    domain: 'math7',
    topics: ['整数', '因数'],
    wrong: '列举整数或因数时“忘了负数”：负整数、负因数被漏掉',
    correct: '整数含正整数、0、负整数；找因数、找整数解时先把负数补全再计数',
    sources: ['v41', 'v22'],
    emphasisCount: 2,
    tags: ['负整数', '因数', '遗漏'],
  },
  {
    id: 'ep-11',
    domain: 'math7',
    topics: ['数轴', '路程与位移'],
    wrong: '把总路程和位移混为一谈：求路程时忽略符号直接相加或相减',
    correct: '位移讲方向可正可负；路程是实际走过的高度，分段取绝对值再相加',
    sources: ['v11'],
    emphasisCount: 1,
    tags: ['路程', '位移', '数轴', '绝对值'],
  },
  {
    id: 'ep-12',
    domain: 'math7',
    topics: ['特殊值', '相反数', '绝对值', '倒数'],
    wrong: '特殊值记混：相反数、绝对值、倒数、平方、立方“等于本身的数”张冠李戴',
    correct: '汇总记忆：相反数是本身的只有 0；绝对值是本身的是非负数；倒数、平方是本身的只有 1；立方是本身的是 0 和 ±1',
    sources: ['v22'],
    emphasisCount: 2,
    tags: ['特殊值', '0', '1', '-1', '汇总'],
  },
]

/**
 * 按学科/主题检索易错点。math7 返回全部；其他学科只返回空，
 * 由提示词退化为“错因必须来自材料”的通用约束。
 */
export function errorPatternsFor({ domain, subject = '', text = '', limit = 12 } = {}) {
  const haystack = `${subject} ${text}`
  const scored = ERROR_PATTERNS.filter((pattern) => {
    if (domain === 'math7') return true
    if (domain && domain !== 'general' && pattern.domain !== domain) return false
    return false
  }).map((pattern) => {
    const score = pattern.tags.reduce(
      (total, tag) => total + (haystack.includes(tag) ? 2 : 0),
      0,
    )
    return { pattern, score }
  })
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.pattern)
}

/** 跨章节高频易错点（emphasisCount ≥ 2），用于 review 场景双次强调。 */
export function highEmphasisPatterns(domain = 'math7') {
  return ERROR_PATTERNS.filter(
    (pattern) => pattern.emphasisCount >= 2 && pattern.domain === domain,
  )
}
