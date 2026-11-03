/**
 * 模型 JSON 输出的稳健解析
 *
 * 模型经常出现：代码块包裹、前后加解释、尾逗号、中文引号、"answerIndex" 写成字符串。
 * 这里做四层兜底：去围栏 → 找第一个完整 JSON 片段 → 修尾逗号 → 逐项规范化。
 */

/** 去掉 ```json ... ``` 围栏 */
export function stripCodeFence(text) {
  if (!text) return ''
  const s = String(text).trim()
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fence ? fence[1].trim() : s
}

/** 从任意文本中截出第一个括号平衡的 JSON 片段（正确处理字符串内的括号与转义） */
export function extractJsonSlice(text) {
  const s = stripCodeFence(text)
  const start = s.search(/[[{]/)
  if (start < 0) return ''
  const open = s[start]
  const close = open === '{' ? '}' : ']'
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < s.length; i += 1) {
    const ch = s[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
    } else if (ch === open) {
      depth += 1
    } else if (ch === close) {
      depth -= 1
      if (depth === 0) return s.slice(start, i + 1)
    }
  }
  return ''
}

/** 宽松解析：返回对象/数组；失败返回 null */
export function parseJsonLoose(text) {
  const slice = extractJsonSlice(text)
  if (!slice) return null
  const attempts = [slice, slice.replace(/,\s*([}\]])/g, '$1')]
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate)
    } catch {
      // 继续下一种修复
    }
  }
  return null
}

/** 规范化自测题：过滤残缺项，answerIndex 统一为数字，选项补齐为字符串 */
export function normalizeQuestions(raw, fallbackChapter = '') {
  const list = Array.isArray(raw) ? raw : raw?.questions
  if (!Array.isArray(list)) return []
  return list
    .map((q, i) => {
      const options = Array.isArray(q?.options)
        ? q.options.map((o) => String(o ?? '').trim()).filter(Boolean)
        : []
      let answerIndex = Number(q?.answerIndex)
      // 兼容模型输出 "A" / "B" 或直接给答案文本
      if (!Number.isInteger(answerIndex) && typeof q?.answerIndex === 'string') {
        const letter = q.answerIndex.trim().toUpperCase()
        if (/^[A-D]$/.test(letter)) answerIndex = letter.charCodeAt(0) - 65
        else {
          const byText = options.findIndex((o) => o === q.answerIndex.trim())
          if (byText >= 0) answerIndex = byText
        }
      }
      if (!q?.stem || options.length < 2 || !Number.isInteger(answerIndex)) return null
      if (answerIndex < 0 || answerIndex >= options.length) return null
      return {
        id: q.id || `q-${i + 1}`,
        stem: String(q.stem).trim(),
        options,
        answerIndex,
        explanation: String(q.explanation || '').trim(),
        concept: String(q.concept || '').trim() || '未标注概念',
        chapter: String(q.chapter || fallbackChapter).trim(),
      }
    })
    .filter(Boolean)
}

/** 规范化速查表 */
export function normalizeCheatsheet(raw) {
  const topics = Array.isArray(raw) ? raw : raw?.topics
  if (!Array.isArray(topics)) return null
  const cleaned = topics
    .map((t) => ({
      name: String(t?.name || '').trim(),
      points: (Array.isArray(t?.points) ? t.points : [])
        .map((p) => ({
          term: String(p?.term || '').trim(),
          definition: String(p?.definition || '').trim(),
          examTip: String(p?.examTip || '').trim(),
          priority: !!p?.priority,
          source: String(p?.source || '').trim(),
        }))
        .filter((p) => p.term && p.definition),
    }))
    .filter((t) => t.name && t.points.length)
  return cleaned.length ? cleaned : null
}
