function sentence(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 将结构化板书 block 转成适合语音教学的短段落。 */
export function boardBlockNarration(block) {
  if (!block) return ''
  if (block.type === 'outline') {
    return `${block.title}。${(block.items || []).join('；')}。`
  }
  if (block.type === 'definition') {
    return [
      `${block.title}：${block.term}。`,
      `定义：${block.definition}`,
      block.analogy ? `形象比喻：${block.analogy}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }
  if (block.type === 'table') {
    const rows = (block.rows || [])
      .map((row) => row.join('，'))
      .join('；')
    return `${block.title}。表头是：${(block.columns || []).join('、')}。${rows}。`
  }
  if (block.type === 'diagram') {
    const nodes = (block.nodes || [])
      .map((node) => (node.note ? `${node.label}，${node.note}` : node.label))
      .join('；')
    return `${block.title}。判断链是：${nodes}。${block.caption || ''}`
  }
  if (block.type === 'callout') {
    return `${block.title}。${block.text}`
  }
  if (block.type === 'question') {
    return `停下来想一想。${block.prompt}`
  }
  return ''
}

export function boardNarrationTexts(lesson) {
  return (lesson?.blocks || []).map(boardBlockNarration).filter(Boolean)
}

export function shortSpeechText(text, maxChars = 900) {
  const normalized = sentence(text)
  if (normalized.length <= maxChars) return normalized
  const sliced = normalized.slice(0, maxChars)
  const sentenceEnd = Math.max(
    sliced.lastIndexOf('。'),
    sliced.lastIndexOf('；'),
    sliced.lastIndexOf('！'),
    sliced.lastIndexOf('？'),
  )
  return sentenceEnd > maxChars * 0.55 ? sliced.slice(0, sentenceEnd + 1) : `${sliced}…`
}
