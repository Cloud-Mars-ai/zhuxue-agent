/**
 * mathExpr —— 七年级数学表达式与一元一次方程的最小确定性引擎。
 *
 * 为什么不用 eval：课程编译器必须能在 node/浏览器里无依赖地判定
 * "方程是否等价、答案是否正确、步骤是否算错"，且绝不执行任意代码。
 *
 * 能力范围（v1，覆盖七年级）：
 * - 四则运算、括号、乘方（整数次）、小数、分数写法 3/4；
 * - 单变量一次式（a·x + b）的解析与运算；
 * - 一元一次方程求解：唯一解 / 无解 / 恒等；
 * - 算术式求值。
 * 超出范围（多元、高次、函数）返回 { ok:false, reason:'unsupported' }，
 * 由检查器降级为 warning，不误报 error。
 *
 * 本文件零依赖、零导入，保证 node 测试与浏览器 bundle 都可用。
 */

const EPS = 1e-9

export function normalizeExpr(input) {
  return String(input ?? '')
    .replace(/[−–—－]/g, '-')
    .replace(/[×✕✖∗]/g, '*')
    .replace(/[÷]/g, '/')
    .replace(/[＋]/g, '+')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/[【】[\]]/g, (m) => (m === '【' || m === '[' ? '(' : ')'))
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/\s+/g, '')
    .replace(/(\d),(\d)/g, '$1$2')
}

const CONST = (b) => ({ a: 0, b, var: null })
const LINEAR = (a, varName) => ({ a, b: 0, var: varName })

function polyAdd(p, q) {
  return { a: p.a + q.a, b: p.b + q.b, var: p.var || q.var }
}
function polySub(p, q) {
  return { a: p.a - q.a, b: p.b - q.b, var: p.var || q.var }
}
function polyMul(p, q) {
  if (p.a === 0) return { a: q.a * p.b, b: p.b * q.b, var: q.var }
  if (q.a === 0) return { a: p.a * q.b, b: p.b * q.b, var: p.var }
  return null // 二次式，不支持
}
function polyDiv(p, q) {
  if (q.a !== 0) return null // 除式含变量
  if (Math.abs(q.b) < EPS) return null // 除零
  return { a: p.a / q.b, b: p.b / q.b, var: p.var }
}

class Parser {
  constructor(source) {
    this.src = source
    this.pos = 0
  }
  peek() {
    return this.src[this.pos] || ''
  }
  next() {
    return this.src[this.pos++]
  }
  fail(reason) {
    return { ok: false, reason }
  }
  parse() {
    const value = this.parseExpr()
    if (!value.ok) return value
    if (this.pos < this.src.length) return this.fail(`无法解析的位置 ${this.pos}: ${this.src.slice(this.pos)}`)
    return value
  }
  parseExpr() {
    const first = this.parseTerm()
    if (!first.ok) return first
    let poly = first.poly
    while (this.peek() === '+' || this.peek() === '-') {
      const op = this.next()
      const right = this.parseTerm()
      if (!right.ok) return right
      poly = op === '+' ? polyAdd(poly, right.poly) : polySub(poly, right.poly)
      if (!poly) return this.fail('不支持的运算（二次式）')
    }
    return { ok: true, poly }
  }
  parseTerm() {
    const first = this.parseFactor()
    if (!first.ok) return first
    let poly = first.poly
    for (;;) {
      const ch = this.peek()
      if (ch === '*' || ch === '/') {
        this.next()
        const right = this.parseFactor()
        if (!right.ok) return right
        poly = ch === '*' ? polyMul(poly, right.poly) : polyDiv(poly, right.poly)
        if (!poly) return this.fail('不支持的运算（变量相乘或除零）')
        continue
      }
      // 隐式乘法：3x、2(x+1)（变量相乘会失败并降级为 unsupported）
      if (/[0-9.a-zA-Z(]/.test(ch)) {
        const right = this.parseFactor()
        if (!right.ok) return right
        poly = polyMul(poly, right.poly)
        if (!poly) return this.fail('不支持的运算（变量相乘）')
        continue
      }
      break
    }
    return { ok: true, poly }
  }
  parseFactor() {
    const base = this.parseUnary()
    if (!base.ok) return base
    if (this.peek() === '^') {
      this.next()
      const exp = this.parseUnary()
      if (!exp.ok) return exp
      if (exp.poly.a !== 0 || !Number.isInteger(exp.poly.b) || exp.poly.b < 0) {
        return this.fail('仅支持非负整数次乘方')
      }
      const power = exp.poly.b
      if (power === 0) return { ok: true, poly: CONST(1) }
      if (power === 1) return base
      if (base.poly.a !== 0) return this.fail('不支持一次的高次幂')
      let result = CONST(1)
      for (let i = 0; i < power; i += 1) {
        result = polyMul(result, base.poly)
        if (!result) return this.fail('不支持的幂运算')
      }
      return { ok: true, poly: result }
    }
    return base
  }
  parseUnary() {
    if (this.peek() === '-') {
      this.next()
      const value = this.parseUnary()
      if (!value.ok) return value
      return { ok: true, poly: { a: -value.poly.a, b: -value.poly.b, var: value.poly.var } }
    }
    if (this.peek() === '+') {
      this.next()
      return this.parseUnary()
    }
    return this.parsePrimary()
  }
  parsePrimary() {
    const ch = this.peek()
    if (ch === '(') {
      this.next()
      const value = this.parseExpr()
      if (!value.ok) return value
      if (this.peek() !== ')') return this.fail('括号不闭合')
      this.next()
      return value
    }
    if (/[0-9.]/.test(ch)) {
      const match = /^\d*\.?\d*/.exec(this.src.slice(this.pos))
      if (!match || !match[0] || match[0] === '.') return this.fail('数字格式错误')
      this.pos += match[0].length
      const value = Number(match[0])
      if (!Number.isFinite(value)) return this.fail('数字格式错误')
      return { ok: true, poly: CONST(value) }
    }
    if (/[a-zA-Z]/.test(ch)) {
      const name = this.next()
      return { ok: true, poly: LINEAR(1, name) }
    }
    return this.fail(`无法识别的字符 "${ch}"`)
  }
}

/** 解析为一次多项式；失败返回 { ok:false, reason }。 */
export function parseLinear(input) {
  const source = normalizeExpr(input)
  if (!source) return { ok: false, reason: '空表达式' }
  const parser = new Parser(source)
  const result = parser.parse()
  if (!result.ok) return result
  const poly = result.poly
  if (poly.var && Math.abs(poly.a) < EPS) return { ok: true, poly: CONST(poly.b) }
  return { ok: true, poly }
}

/** 算术求值；含变量返回 null。 */
export function evaluateArithmetic(input) {
  const result = parseLinear(input)
  if (!result.ok || result.poly.var) return null
  return result.poly.b
}

/**
 * 解方程 lhs = rhs。
 * 返回：{ kind:'unique', value, var } | { kind:'none' } | { kind:'identity' }
 *      | { kind:'unsupported', reason }
 */
export function solveEquation(lhs, rhs) {
  const left = typeof lhs === 'string' ? parseLinear(lhs) : lhs
  const right = typeof rhs === 'string' ? parseLinear(rhs) : rhs
  if (!left.ok || !right.ok) return { kind: 'unsupported', reason: left.reason || right.reason }
  const a = left.poly.a - right.poly.a
  const b = left.poly.b - right.poly.b
  const varName = left.poly.var || right.poly.var
  if (Math.abs(a) < EPS) {
    if (Math.abs(b) < EPS) return { kind: 'identity' }
    return { kind: 'none' }
  }
  return { kind: 'unique', value: -b / a, var: varName || 'x' }
}

/** 解析 "LHS = RHS" 文本；无等号时按算术式处理。 */
export function parseEquationText(input) {
  const source = normalizeExpr(input)
  const index = source.indexOf('=')
  if (index < 0) {
    const value = evaluateArithmetic(source)
    return value === null
      ? { kind: 'unsupported', reason: '没有等号且不是可求值算式' }
      : { kind: 'unique', value, var: null }
  }
  const lhs = source.slice(0, index)
  const rhs = source.slice(index + 1)
  return solveEquation(lhs, rhs)
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) return String(value)
  if (Number.isInteger(value)) return String(value)
  const rounded = Number(value.toFixed(6))
  return String(rounded)
}

/** 数字相等比较（容忍分数写法的浮点误差）。 */
export function numbersEqual(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false
  return Math.abs(a - b) <= Math.max(1e-6, Math.abs(b) * 1e-6)
}

/** 从选项/答案文本中提取可比较的数值；失败返回 null。 */
export function numericValueOf(input) {
  const source = normalizeExpr(input)
    .replace(/^[a-zA-Z]=/, '')
    .replace(/[。．.，,；;]$/, '')
  if (!source) return null
  const value = evaluateArithmetic(source)
  return value === null ? null : value
}

/**
 * 检测"移项不变号"（易错点 ep-03）：
 * 连续两步之间，某一侧的项原样搬到另一侧且符号没改。
 * 判定（多项式层面）：常数项与一次项各自满足
 *   L2 = L1 - t 且 R2 = R1 + t（t≠0）
 * 即两边同减变成了"一边减一边加"。
 */
export function detectMoveWithoutSignChange(step1, step2) {
  const eq1 = parseEquationText(step1)
  const eq2 = parseEquationText(step2)
  if (eq1.kind !== 'unique' || eq2.kind !== 'unique') return false
  const p1 = parseLinear(normalizeExpr(step1).split('=')[0])
  const q1 = parseLinear(normalizeExpr(step1).split('=')[1])
  const p2 = parseLinear(normalizeExpr(step2).split('=')[0])
  const q2 = parseLinear(normalizeExpr(step2).split('=')[1])
  if (!p1.ok || !q1.ok || !p2.ok || !q2.ok) return false
  const tA = p1.poly.b - p2.poly.b // 常数项从左搬右的量
  const tB = p1.poly.a - p2.poly.a // 一次项系数搬右的量
  const okA = Math.abs(tA) > EPS && Math.abs(q2.poly.b - (q1.poly.b + tA)) < EPS
  const okB = Math.abs(tB) > EPS && Math.abs(q2.poly.a - (q1.poly.a + tB)) < EPS
  return okA || okB
}
