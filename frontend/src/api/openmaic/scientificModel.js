/**
 * ScientificModel 契约（OpenMAIC 交互场景输出契约）与学科检查增强。
 *
 * 上游 @openmaic/generation scene-types.ts：
 *   ScientificModel { core_formulas[], mechanism[], constraints[], forbidden_errors[] }
 * 上游只在类型层声明该契约（模型可在交互输出中填充）；本项目把它落到
 * utils/subjectCheck 的检查码上，让「科学模型自洽」成为可验证信号。
 *
 * 检查码（与 subjectCheck 现有码位段区分，加 SCI- 前缀）：
 * - SCI-FORMULA-EMPTY    core_formulas 为空            → warn
 * - SCI-MECHANISM-EMPTY  mechanism 为空                → warn
 * - SCI-CONSTRAINT-MISSING 约束关键词未在内容中出现      → warn（至多 3 条）
 * - SCI-FORBIDDEN-HIT    内容命中 forbidden_errors 条目 → error（进修复循环）
 *
 * 硬规则：只用相对导入或不导入，node 测试脚本可直接 import。
 */

const MAX_ITEMS = 6
const MAX_LENGTH = 200

function text(value, max = MAX_LENGTH) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function stringList(value) {
  const list = Array.isArray(value) ? value : []
  return Array.from(new Set(list.map((item) => text(item, MAX_LENGTH)).filter(Boolean))).slice(
    0,
    MAX_ITEMS,
  )
}

/** 归一化模型输出中的 scientificModel；四字段缺失时补空数组（不谎称有模型）。 */
export function normalizeScientificModel(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const model = {
    core_formulas: stringList(raw.core_formulas ?? raw.coreFormulas),
    mechanism: stringList(raw.mechanism),
    constraints: stringList(raw.constraints),
    forbidden_errors: stringList(raw.forbidden_errors ?? raw.forbiddenErrors),
  }
  const hasAny =
    model.core_formulas.length ||
    model.mechanism.length ||
    model.constraints.length ||
    model.forbidden_errors.length
  return hasAny ? model : null
}

/** 从交互场景的 widget-config（上游模板约定的内嵌 JSON）中取 scientificModel。 */
export function extractScientificModel(widgetConfig) {
  if (!widgetConfig || typeof widgetConfig !== 'object') return null
  return normalizeScientificModel(
    widgetConfig.scientificModel ?? widgetConfig.scientific_model ?? null,
  )
}

/** 约束关键词提取：取中文词/英文词中长度 ≥4 的片段做包含匹配（确定性、可解释）。 */
function constraintKeywords(constraint) {
  const words = String(constraint)
    .split(/[\s,，。、；;：:（）()【】[\]"'“”‘’/]+/)
    .filter(Boolean)
  return words.filter((word) => word.length >= 4).slice(0, 3)
}

function contentHaystack(content) {
  try {
    return JSON.stringify(content).toLowerCase()
  } catch {
    return String(content ?? '').toLowerCase()
  }
}

/**
 * 学科一致性检查（ScientificModel 部分）。
 * 返回 { checker, issues[] }，issue 形状与 subjectCheck 现有产出一致：
 * { code, severity: 'error'|'warn', message, target }。
 */
export function checkScientificModel({ model, content }) {
  const issues = []
  const normalized = normalizeScientificModel(model)
  if (!normalized) {
    return { checker: 'scientific-model', issues, model: null }
  }

  if (!normalized.core_formulas.length) {
    issues.push({
      code: 'SCI-FORMULA-EMPTY',
      severity: 'warn',
      message: '交互场景未给出核心公式，科学模型不完整',
      target: 'scientificModel.core_formulas',
    })
  }
  if (!normalized.mechanism.length) {
    issues.push({
      code: 'SCI-MECHANISM-EMPTY',
      severity: 'warn',
      message: '交互场景未给出机制说明，科学模型不完整',
      target: 'scientificModel.mechanism',
    })
  }

  const haystack = contentHaystack(content)
  const missing = normalized.constraints
    .filter((constraint) => {
      const keywords = constraintKeywords(constraint)
      if (!keywords.length) return false
      return !keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))
    })
    .slice(0, 3)
  for (const constraint of missing) {
    issues.push({
      code: 'SCI-CONSTRAINT-MISSING',
      severity: 'warn',
      message: `约束「${text(constraint, 60)}」未在场景内容中得到体现`,
      target: 'scientificModel.constraints',
    })
  }

  for (const forbidden of normalized.forbidden_errors) {
    const probe = text(forbidden, 24)
    if (probe.length >= 4 && haystack.includes(probe.toLowerCase())) {
      issues.push({
        code: 'SCI-FORBIDDEN-HIT',
        severity: 'error',
        message: `场景内容命中模型自列错误示范「${text(forbidden, 60)}」`,
        target: 'scientificModel.forbidden_errors',
      })
    }
  }

  return { checker: 'scientific-model', issues, model: normalized }
}
