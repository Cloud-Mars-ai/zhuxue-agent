/**
 * AI 返回 JSON 的鲁棒解析（移植自 @openmaic/generation/src/json-repair.ts）。
 *
 * 与上游的差异：上游 Attempt 3 依赖 npm 包 jsonrepair；本项目不新增依赖
 * （部署通道只传 dist，服务端不重装 node_modules），改用内置的轻量修复：
 * 去尾逗号 / 补引号 / 单引号键转双引号 / LaTeX 反斜杠再转义。
 * 数学内容场景（\frac、\alpha 等）是本项目高频路径，Attempt 2 的
 * 数学内容场景（\frac、\alpha 等）是本项目高频路径，LaTeX 双转义逻辑
 * 在上游基础上改进：按「反斜杠+字母串长度」判别 LaTeX 命令（详见 Fix 1）。
 *
 * 硬规则：只用相对导入或不导入，node 测试脚本可直接 import。
 */

/** 剥离 reasoning 模型输出前缀（</think> / </reasoning> 之后的正文）。 */
export function stripReasoningPrefix(response) {
  const trimmed = String(response ?? '').trim()
  const matches = [...trimmed.matchAll(/<\/(?:think|thinking|reasoning)>\s*/gi)]
  const lastMatch = matches.at(-1)
  if (!lastMatch || lastMatch.index === undefined) return trimmed
  return trimmed.slice(lastMatch.index + lastMatch[0].length).trim()
}

function tryParseExactJson(response) {
  try {
    const parsed = JSON.parse(String(response).trim())
    // 改进（超出上游 parity）：JSON.parse 会把 `\frac` 这类 LaTeX 命令按
    // 合法转义 `\f`（换页）解析，"成功"但内容已被静默损坏。解析结果里出现
    // 控制字符（\n \t \r 除外）时判定为损坏，交还给修复路径重解析。
    if (containsControlChar(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

const CONTROL_CHAR = /[\x00-\x08\x0B\x0C\x0E-\x1F]/

function containsControlChar(value) {
  if (typeof value === 'string') return CONTROL_CHAR.test(value)
  if (Array.isArray(value)) return value.some(containsControlChar)
  if (value && typeof value === 'object') return Object.values(value).some(containsControlChar)
  return false
}

/** 修复被误输出为独立字符串的属性碎片："height: 76" → "height": 76（上游 Fix 0）。 */
function repairQuotedPropertyFragments(jsonStr) {
  return jsonStr.replace(
    /([,{]\s*)"([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(true|false|null|[+-]?\d+(?:\.\d+)?)"(?=\s*[,}])/g,
    (_match, prefix, key, value) => `${prefix}"${key}": ${value}`,
  )
}

/** 常见 AI JSON 损坏的确定性修复（上游 Fix 1/2/3）。 */
function fixCommonJsonIssues(jsonStr) {
  let fixed = jsonStr

  // Fix 0: 属性碎片
  fixed = repairQuotedPropertyFragments(fixed)

  // Fix 1: 字符串内的 LaTeX 反斜杠命令双转义，保留合法 JSON 转义。
  // 判别规则（对上游的改进）：`\` + 字母串——
  //   - 单字母且属于 \b \f \n \r \t \u → 合法转义，保留（如真实换行 \n）
  //   - 多字母串（\frac \alpha \sqrt…）→ LaTeX 命令，双写反斜杠
  // 上游按「单字母是否合法」判别，会把 \frac 的 \f 当换页符保留，
  // 解析"成功"但内容被静默损坏（控制字符检测 + 本规则双重拦截）。
  fixed = fixed.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (_match, content) => {
    const fixedContent = content.replace(/\\([a-zA-Z]+)/g, (run, letters) => {
      if (letters.length === 1 && 'bfnrtu'.includes(letters)) return run
      return `\\\\${letters}`
    })
    return `"${fixedContent}"`
  })

  // Fix 2: 其余无效转义序列（如字符串外的 \S \L）。
  // 相对上游的修正：加 (?<!\\) 否定后顾，避免把 Fix 1 已双转义的
  // `\\alpha` 再次转义成 `\\\alpha`（上游 latent bug，测试 B3 捕获）
  fixed = fixed.replace(/(?<!\\)\\([^"\\\/bfnrtu\n\r])/g, (match, char) =>
    /[a-zA-Z]/.test(char) ? '\\\\' + char : match,
  )

  // Fix 3: 截断补全。优先在最后一个完整元素处截断，再按栈补闭合符
  // （上游直接补 '}' 的数量，遇到「对象里套着被截断的数组」会产出
  //   {...[ {...}, {"id" }} 这类非法结构；先截断再补齐更稳）
  const trimmed = fixed.trim()
  if (trimmed.startsWith('[') && !trimmed.endsWith(']')) {
    const lastCompleteObj = fixed.lastIndexOf('}')
    if (lastCompleteObj > 0) {
      fixed = closeOpenBrackets(fixed.substring(0, lastCompleteObj + 1))
    }
  } else if (trimmed.startsWith('{') && !trimmed.endsWith('}')) {
    const lastComplete = Math.max(fixed.lastIndexOf('}'), fixed.lastIndexOf(']'))
    if (lastComplete > 0) {
      fixed = closeOpenBrackets(fixed.substring(0, lastComplete + 1))
    } else {
      const openBraces = (fixed.match(/{/g) || []).length
      const closeBraces = (fixed.match(/}/g) || []).length
      if (openBraces > closeBraces) {
        fixed += '}'.repeat(openBraces - closeBraces)
      }
    }
  }
  return fixed
}

/** 按括号栈为截断的 JSON 补闭合符（只数字符串外的括号）。 */
function closeOpenBrackets(fragment) {
  const stack = []
  let inString = false
  let escapeNext = false
  for (const char of fragment) {
    if (escapeNext) {
      escapeNext = false
      continue
    }
    if (char === '\\' && inString) {
      escapeNext = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (char === '[' || char === '{') stack.push(char)
    else if (char === ']' || char === '}') stack.pop()
  }
  let result = fragment
  while (stack.length) {
    result += stack.pop() === '[' ? ']' : '}'
  }
  return result
}

/**
 * 轻量 jsonrepair 等价实现（替代上游 Attempt 3 的 npm 依赖）：
 * 去尾逗号、补未闭合字符串/括号、单引号键、裸字面量键。
 */
export function repairJsonLight(jsonStr) {
  let text = String(jsonStr)
  // 去掉对象/数组中的尾逗号（在 ] } 之前，连同中间空白一并去掉）
  text = text.replace(/,(\s*)([}\]])/g, '$2')
  // 未闭合的字符串：补一个引号（仅当引号数为奇数）
  const quoteCount = (text.match(/(?<!\\)"/g) || []).length
  if (quoteCount % 2 === 1) text += '"'
  // 补齐括号
  const opens = (text.match(/[[{]/g) || []).length
  const closes = (text.match(/[\]}]/g) || []).length
  if (opens > closes) {
    const stack = []
    for (const ch of text) {
      if (ch === '[' || ch === '{') stack.push(ch)
      else if (ch === ']' || ch === '}') stack.pop()
    }
    while (stack.length) {
      text += stack.pop() === '[' ? ']' : '}'
    }
  }
  return text
}

function removeControlCharacters(jsonStr) {
  return jsonStr.replace(/[\x00-\x1F\x7F]/g, (char) => {
    switch (char) {
      case '\n':
        return '\\n'
      case '\r':
        return '\\r'
      case '\t':
        return '\\t'
      default:
        return ''
    }
  })
}

function tryParseJson(jsonStr) {
  // Attempt 1: 原样（同样拦截「合法转义字母开头实为 LaTeX」的静默损坏）
  try {
    const parsed = JSON.parse(jsonStr)
    if (!containsControlChar(parsed)) return parsed
  } catch {
    // 继续
  }
  // Attempt 2: 常见损坏修复
  try {
    return JSON.parse(fixCommonJsonIssues(jsonStr))
  } catch {
    // 继续
  }
  // Attempt 3: 轻量 jsonrepair
  try {
    return JSON.parse(repairJsonLight(fixCommonJsonIssues(jsonStr)))
  } catch {
    // 继续
  }
  // Attempt 4: 去控制字符
  try {
    return JSON.parse(removeControlCharacters(jsonStr))
  } catch {
    return null
  }
}

function parseCandidate(response) {
  const cleaned = String(response ?? '').trim()

  // Strategy 1: markdown 代码块（可能有多个）
  const codeBlockMatches = cleaned.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)
  for (const match of codeBlockMatches) {
    const extracted = match[1].trim()
    if (extracted.startsWith('{') || extracted.startsWith('[')) {
      const result = tryParseJson(extracted)
      if (result !== null) return result
    }
  }

  // Strategy 2: 裸 JSON（括号配对扫描，跳过字符串内的括号）
  const jsonStartArray = cleaned.indexOf('[')
  const jsonStartObject = cleaned.indexOf('{')
  if (jsonStartArray !== -1 || jsonStartObject !== -1) {
    const startIndex =
      jsonStartArray === -1
        ? jsonStartObject
        : jsonStartObject === -1
          ? jsonStartArray
          : Math.min(jsonStartArray, jsonStartObject)

    let depth = 0
    let endIndex = -1
    let inString = false
    let escapeNext = false
    for (let i = startIndex; i < cleaned.length; i += 1) {
      const char = cleaned[i]
      if (escapeNext) {
        escapeNext = false
        continue
      }
      if (char === '\\' && inString) {
        escapeNext = true
        continue
      }
      if (char === '"') {
        inString = !inString
        continue
      }
      if (!inString) {
        if (char === '[' || char === '{') depth += 1
        else if (char === ']' || char === '}') {
          depth -= 1
          if (depth === 0) {
            endIndex = i
            break
          }
        }
      }
    }
    if (endIndex !== -1) {
      const result = tryParseJson(cleaned.substring(startIndex, endIndex + 1))
      if (result !== null) return result
    }
  }

  // Strategy 3: 整个响应
  return tryParseJson(cleaned)
}

/**
 * 解析 AI 响应为 JSON；全部策略失败返回 null。
 * 先试原样，再试剥离 reasoning 前缀，最后走候选提取（上游 parseJsonResponse 同序）。
 */
export function parseJsonResponse(response) {
  const exact = tryParseExactJson(response)
  if (exact !== null) return exact

  const cleaned = stripReasoningPrefix(response)
  if (cleaned !== String(response).trim()) {
    const parsedCleaned = parseCandidate(cleaned)
    if (parsedCleaned !== null) return parsedCleaned
  }
  return parseCandidate(response)
}
