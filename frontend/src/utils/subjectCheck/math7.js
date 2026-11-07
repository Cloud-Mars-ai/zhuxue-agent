/**
 * math7 学科一致性检查器 —— 课程编译器第四层（七年级数学版）。
 *
 * 对应研究设计 RQ2 的"数学内容错误率"指标。检查项：
 * 1. 方程等价性：解题步骤序列中每一步与原方程同解（MATH_STEP_DIVERGENCE）；
 * 2. 算术正确性：纯算术步骤两边相等（MATH_STEP_ARITH）；
 * 3. 答案核对：声明答案与方程解一致（MATH_ANSWER_MISMATCH）；
 * 4. 选项唯一性：选项互不重复且恰有一个正确（MATH_OPTION_UNIQUE / MATH_OPTION_DUPLICATE）；
 * 5. 易错点匹配：错解步骤命中已知易错点库（ep-xx）时给出归类（MATH_ERROR_PATTERN）；
 * 6. wrong-first 结构：错解步必须在 errorIndex 处首次偏离正解（WRONG_FIRST_*）。
 *
 * 每个 issue 尽量带 fix 字段（确定性修复建议），供修复循环消费；
 * 解析不了的内容降级 warning，不冤枉模型。
 *
 * 本文件只用相对导入，保证 node 测试可直接运行。
 */

import {
  detectMoveWithoutSignChange,
  formatNumber,
  numbersEqual,
  numericValueOf,
  parseEquationText,
} from './mathExpr.js'
import { ERROR_PATTERNS } from '../../data/errorPatterns.js'

const EQUATION_HINT = /[=＝]/

/**
 * 从题干中抽出可判定的算式片段：
 * "解方程 2x=6，x=？" → "2x=6"；"3x+2=5 得 x=？" → "3x+2=5"。
 * 取第一个含等号且不以问号结尾的片段。
 */
function extractEquationFromStem(stem) {
  const segments = String(stem || '')
    .split(/[，。；,;?？:：\s]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
  for (const segment of segments) {
    if (EQUATION_HINT.test(segment) && !/[?？]/.test(segment)) return segment
  }
  for (const segment of segments) {
    if (EQUATION_HINT.test(segment)) return segment.replace(/[?？]+/g, '')
  }
  return null
}

function issue(code, severity, target, message, fix = null) {
  return { code, severity, target, message, fix }
}

/** 步骤序列检查：equivalence + arithmetic + final answer。 */
export function checkEquationSteps({ steps = [], finalAnswer = '', target = 'steps', expectWrong = false, errorIndex = -1 }) {
  const issues = []
  const parsed = steps.map((step) => ({ step, eq: parseEquationText(step) }))
  const solvable = parsed.filter((item) => item.eq.kind === 'unique')
  if (!solvable.length) {
    if (steps.length) {
      issues.push(
        issue('MATH_PARSE_UNSUPPORTED', 'warning', target, '步骤无法解析为可判定算式，跳过数学检查', null),
      )
    }
    return issues
  }
  const base = solvable[0].eq
  let firstDivergence = -1
  parsed.forEach((item, index) => {
    if (item.eq.kind !== 'unique') return
    if (!numbersEqual(item.eq.value, base.value)) {
      if (firstDivergence < 0) firstDivergence = index
      if (expectWrong) {
        if (index < errorIndex) {
          issues.push(
            issue(
              'WRONG_FIRST_EARLY_DIVERGENCE',
              'warning',
              target,
              `错解第 ${index + 1} 步就偏离正解，errorIndex(${errorIndex}) 指向的步骤不是第一处错误`,
              { errorIndex: index },
            ),
          )
        }
      } else if (index === 0) {
        issues.push(
          issue('MATH_STEP_DIVERGENCE', 'error', target, `第 ${index + 1} 步方程与原式不同解`, null),
        )
      } else {
        issues.push(
          issue(
            'MATH_STEP_DIVERGENCE',
            'error',
            target,
            `第 ${index + 1} 步方程解变为 ${formatNumber(item.eq.value)}，与第 1 步的 ${formatNumber(base.value)} 不同`,
            null,
          ),
        )
      }
    }
  })

  if (expectWrong) {
    if (firstDivergence < 0) {
      issues.push(
        issue(
          'WRONG_FIRST_NO_ERROR',
          'error',
          target,
          'wrong-first 的错解序列实际上全部正确，没有可展示的错误',
          null,
        ),
      )
    } else if (errorIndex >= 0 && firstDivergence !== errorIndex) {
      // 偏离点与标注不一致：修复循环会把 errorIndex 对准真实偏离步
      issues.push(
        issue(
          'WRONG_FIRST_INDEX',
          'warning',
          target,
          `errorIndex=${errorIndex} 与首次偏离步 ${firstDivergence} 不一致`,
          { errorIndex: firstDivergence },
        ),
      )
    }
    // 易错点归类：检查偏离处是否"移项不变号"
    if (firstDivergence >= 1 && detectMoveWithoutSignChange(steps[firstDivergence - 1], steps[firstDivergence])) {
      const pattern = ERROR_PATTERNS.find((item) => item.id === 'ep-03')
      issues.push(
        issue(
          'MATH_ERROR_PATTERN',
          'warning',
          target,
          `错解与已知易错点 ${pattern?.id || 'ep-03'} 一致：${pattern?.wrong || '移项不变号'}`,
          { errorPatternId: pattern?.id || 'ep-03' },
        ),
      )
    }
  }

  if (finalAnswer && base.kind === 'unique') {
    const claimed = numericValueOf(finalAnswer)
    if (claimed !== null && !numbersEqual(claimed, base.value)) {
      issues.push(
        issue(
          'MATH_ANSWER_MISMATCH',
          'error',
          target,
          `声明答案 ${formatNumber(claimed)} 与方程解 ${formatNumber(base.value)} 不一致`,
          { answer: formatNumber(base.value) },
        ),
      )
    }
  }
  return issues
}

/** 选择题检查：选项唯一 + 恰一个正确 + 答案索引有效。 */
export function checkChoiceQuestion({ question, target = 'question' }) {
  const issues = []
  const options = Array.isArray(question?.options) ? question.options.map((item) => String(item).trim()) : []
  if (options.length < 2) {
    issues.push(issue('MATH_OPTION_COUNT', 'error', target, `选项不足（${options.length} 个）`, null))
    return issues
  }
  const seen = new Map()
  options.forEach((option, index) => {
    if (seen.has(option)) {
      issues.push(
        issue(
          'MATH_OPTION_DUPLICATE',
          'error',
          target,
          `选项 ${index + 1} 与选项 ${seen.get(option) + 1} 重复：「${option}」`,
          null,
        ),
      )
    } else {
      seen.set(option, index)
    }
  })

  // 题干是可解方程时核对答案
  const stem = String(question?.stem || '')
  if (EQUATION_HINT.test(stem)) {
    const eq = parseEquationText(extractEquationFromStem(stem) || '')
    if (eq.kind === 'unique') {
      const matches = options
        .map((option, index) => ({ option, index, value: numericValueOf(option) }))
        .filter((item) => item.value !== null && numbersEqual(item.value, eq.value))
      if (matches.length === 0) {
        issues.push(
          issue(
            'MATH_OPTION_UNIQUE',
            'error',
            target,
            `题干方程解为 ${formatNumber(eq.value)}，但没有选项与之匹配`,
            { answer: formatNumber(eq.value), options },
          ),
        )
      } else if (matches.length > 1) {
        issues.push(
          issue(
            'MATH_OPTION_UNIQUE',
            'error',
            target,
            `多个选项（${matches.map((item) => item.index + 1).join('、')}）都等于方程解`,
            null,
          ),
        )
      } else if (Number.isInteger(question.answerIndex) && question.answerIndex !== matches[0].index) {
        issues.push(
          issue(
            'MATH_ANSWER_MISMATCH',
            'error',
            target,
            `答案指向选项 ${question.answerIndex + 1}，但正确选项是 ${matches[0].index + 1}`,
            { answerIndex: matches[0].index },
          ),
        )
      }
    }
  }
  return issues
}

/** 单场景内容检查：board / quiz / practice。 */
export function checkMath7Scene(scene, content) {
  const issues = []
  if (!content) return issues

  if (content.kind === 'quiz') {
    for (const question of content.questions || []) {
      issues.push(...checkChoiceQuestion({ question, target: question.id || 'question' }))
    }
  }

  if (content.kind === 'board') {
    for (const block of content.lesson?.blocks || []) {
      if (block.type === 'wrong-first') {
        issues.push(
          ...checkEquationSteps({
            steps: block.wrongSteps || [],
            finalAnswer: '',
            target: block.id,
            expectWrong: true,
            errorIndex: Number.isInteger(block.errorIndex) ? block.errorIndex : -1,
          }),
        )
        issues.push(
          ...checkEquationSteps({
            steps: block.correctSteps || [],
            finalAnswer: '',
            target: block.id,
          }),
        )
      }
      if (block.type === 'multi-solution') {
        for (const method of block.methods || []) {
          issues.push(
            ...checkEquationSteps({
              steps: method.steps || [],
              finalAnswer: '',
              target: block.id,
            }),
          )
        }
      }
      if (block.type === 'fill-blank') {
        // 题干含算式等号时核对填空答案
        if (EQUATION_HINT.test(block.prompt || '')) {
          const eq = parseEquationText(String(block.prompt).replace(/_+/g, 'x'))
          const answers = Array.isArray(block.answers) ? block.answers : []
          if (eq.kind === 'unique' && answers.length) {
            const claimed = numericValueOf(answers[0])
            if (claimed !== null && !numbersEqual(claimed, eq.value)) {
              issues.push(
                issue(
                  'MATH_ANSWER_MISMATCH',
                  'error',
                  block.id,
                  `填空答案 ${formatNumber(claimed)} 与算式结果 ${formatNumber(eq.value)} 不一致`,
                  { answer: formatNumber(eq.value) },
                ),
              )
            }
          }
        }
      }
    }
  }

  if (content.kind === 'practice') {
    // 案例任务中的算术断言："a op b = c" 形式
    const text = `${content.prompt || ''} ${(content.referencePoints || []).join(' ')}`
    const matches = text.match(/[0-9][0-9+\-*/×÷\-.()\s]{2,}=[0-9.\s]+/g) || []
    for (const statement of matches.slice(0, 3)) {
      const eq = parseEquationText(statement)
      if (eq.kind === 'none') {
        issues.push(
          issue('MATH_STEP_ARITH', 'error', 'practice', `算术断言不成立：${statement.trim()}`, null),
        )
      }
    }
  }

  return issues
}
