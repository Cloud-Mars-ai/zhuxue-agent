/**
 * 学科一致性检查器入口 —— 按学科分发。
 *
 * v1：math7（七年级数学）走完整检查；
 *      management（经管）走数字溯源 + 算术断言（轻量版）；
 *      其他学科只做算术断言，返回空表示不阻断。
 */

import { checkMath7Scene } from './math7.js'
import { parseEquationText } from './mathExpr.js'

function isMath({ domain, subject }) {
  if (domain === 'math7') return true
  return /数学|有理数|方程|代数|几何/.test(`${subject || ''}`)
}

function isManagement({ domain, subject }) {
  if (domain === 'management') return true
  return /管理|经管|会计|财务|营销|运营/.test(`${subject || ''}`)
}

/** 经管轻量检查：案例中的数字要能在材料中找到，算术断言要成立。 */
function checkManagementScene(scene, content, materialText = '') {
  const issues = []
  // 材料中的数字按 token 精确匹配，避免"20"误中"2023"
  const materialNumbers = new Set(String(materialText || '').match(/\d+(?:\.\d+)?/g) || [])
  const claims = []
  if (content?.kind === 'practice') {
    claims.push(`${content.prompt || ''}`, ...(content.referencePoints || []))
  }
  if (content?.kind === 'board') {
    for (const block of content.lesson?.blocks || []) {
      if (block.type === 'callout') claims.push(block.text || '')
      if (block.type === 'definition') claims.push(`${block.term || ''} ${block.definition || ''}`)
    }
  }
  for (const claim of claims) {
    const numbers = String(claim).match(/\d+(?:\.\d+)?%?/g) || []
    for (const value of numbers.slice(0, 6)) {
      const bare = value.replace('%', '')
      if (bare.length < 2) continue // 单位数不做溯源要求
      if (materialNumbers.size && !materialNumbers.has(bare)) {
        issues.push({
          code: 'MGMT_NUMBER_UNSOURCED',
          severity: 'warning',
          target: scene?.id,
          message: `数字 ${value} 未在材料中出现，需标注推算依据`,
          fix: null,
        })
      }
    }
    const statements = String(claim).match(/\d[\d+\-*/×÷\-.()\s]{2,}=[\d.\s]+/g) || []
    for (const statement of statements) {
      const eq = parseEquationText(statement)
      if (eq.kind === 'none') {
        issues.push({
          code: 'MATH_STEP_ARITH',
          severity: 'error',
          target: scene?.id,
          message: `算术断言不成立：${statement.trim()}`,
          fix: null,
        })
      }
    }
  }
  return issues
}

/**
 * 统一入口。
 * @returns {{ issues: Array, checked: boolean }}
 */
export function checkSubjectConsistency({ domain, subject = '', scene, content, materialText = '' }) {
  const context = { domain, subject }
  if (isMath(context)) return { issues: checkMath7Scene(scene, content), checked: true, checker: 'math7' }
  if (isManagement(context)) {
    return { issues: checkManagementScene(scene, content, materialText), checked: true, checker: 'management' }
  }
  return { issues: [], checked: false, checker: 'none' }
}
