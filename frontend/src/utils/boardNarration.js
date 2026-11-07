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
      `先看一个例子：${block.concreteAnchor || ''}`,
      `定义：${block.definition}`,
      block.analogy ? `形象比喻：${block.analogy}` : '',
      block.method?.length ? `方法：${block.method.join('，')}` : '',
      block.verify ? `验证：${block.verify}` : '',
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
    return `${block.title}。${block.text}${block.mnemonic ? `口诀：${block.mnemonic}` : ''}`
  }
  if (block.type === 'question') {
    return `停下来想一想。${block.prompt}`
  }
  if (block.type === 'classification-tree') {
    const branches = (block.branches || [])
      .map((branch) =>
        branch.children?.length
          ? `${branch.label}，包括${branch.children.map((child) => child.label).join('、')}`
          : branch.label,
      )
      .join('；')
    return `${block.title}。${block.root.label}分成：${branches}。`
  }
  if (block.type === 'number-line') {
    const points = (block.points || [])
      .map((point) => `${point.label}在${point.value}`)
      .join('；')
    return `${block.title}。从${block.min}到${block.max}：${points}。`
  }
  if (block.type === 'fill-blank') {
    return `${block.title}。${block.prompt.replace(/___/g, '哪里')}`
  }
  if (block.type === 'wrong-first') {
    return `${block.title}。先看一份常见错解，第${block.errorIndex + 1}步有问题。${
      block.errorHint || '想一想错在哪里'
    }。正确做法是：${(block.correctSteps || []).join('，')}。`
  }
  if (block.type === 'judge') {
    return `${block.title}。${block.statement}`
  }
  if (block.type === 'case-table') {
    return `${block.title}。按${block.dimension}分情形：${(block.cases || [])
      .map((item) => `${item.condition}时，${item.conclusion}`)
      .join('；')}。`
  }
  if (block.type === 'induction') {
    return `${block.title}。先看这几个例子：${(block.examples || []).join('；')}。规律是什么？`
  }
  if (block.type === 'multi-solution') {
    return `${block.title}。${block.problem} 可以用${(block.methods || [])
      .map((method) => method.name)
      .join('、')}等方法分别解决。`
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
