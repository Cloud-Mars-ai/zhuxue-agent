function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderBlock(block) {
  if (block.type === 'outline') {
    return `<section><h2>${escapeHtml(block.title)}</h2><ul>${(block.items || [])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('')}</ul></section>`
  }
  if (block.type === 'definition') {
    return `<section><h2>${escapeHtml(block.title)}：${escapeHtml(block.term)}</h2>${
      block.concreteAnchor
        ? `<p><strong>具体例子：</strong>${escapeHtml(block.concreteAnchor)}</p>`
        : ''
    }<p><strong>定义：</strong>${escapeHtml(block.definition)}</p>${
      block.analogy
        ? `<p><strong>形象比喻：</strong>${escapeHtml(block.analogy)}</p>`
        : ''
    }${
      block.method?.length
        ? `<p><strong>方法：</strong>${block.method.map((step) => escapeHtml(step)).join('；')}</p>`
        : ''
    }${block.verify ? `<p><strong>验证：</strong>${escapeHtml(block.verify)}</p>` : ''}</section>`
  }
  if (block.type === 'table') {
    return `<section><h2>${escapeHtml(block.title)}</h2><table><thead><tr>${(block.columns || [])
      .map((column) => `<th>${escapeHtml(column)}</th>`)
      .join('')}</tr></thead><tbody>${(block.rows || [])
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
      )
      .join('')}</tbody></table></section>`
  }
  if (block.type === 'diagram') {
    return `<section><h2>${escapeHtml(block.title)}</h2><div class="chain">${(block.nodes || [])
      .map(
        (node) =>
          `<div class="node"><strong>${escapeHtml(node.label)}</strong><span>${escapeHtml(
            node.note,
          )}</span></div>`,
      )
      .join('<i>→</i>')}</div>${block.caption ? `<p>${escapeHtml(block.caption)}</p>` : ''}</section>`
  }
  if (block.type === 'callout') {
    return `<aside><strong>${escapeHtml(block.title)}</strong><p>${escapeHtml(block.text)}</p>${
      block.mnemonic ? `<p>口诀：${escapeHtml(block.mnemonic)}</p>` : ''
    }</aside>`
  }
  if (block.type === 'question') {
    return `<section class="question"><h2>${escapeHtml(block.title)}</h2><p>${escapeHtml(
      block.prompt,
    )}</p>${
      block.options?.length
        ? `<ul>${block.options.map((option) => `<li>${escapeHtml(option)}</li>`).join('')}</ul>`
        : ''
    }</section>`
  }
  if (block.type === 'classification-tree') {
    return `<section><h2>${escapeHtml(block.title)}</h2><p><strong>${escapeHtml(
      block.root?.label,
    )}</strong>${block.root?.note ? `（${escapeHtml(block.root.note)}）` : ''}</p><ul>${(block.branches || [])
      .map(
        (branch) =>
          `<li><strong>${escapeHtml(branch.label)}</strong>${
            branch.note ? `：${escapeHtml(branch.note)}` : ''
          }${
            branch.children?.length
              ? `<ul>${branch.children
                  .map((child) => `<li>${escapeHtml(child.label)}</li>`)
                  .join('')}</ul>`
              : ''
          }</li>`,
      )
      .join('')}</ul>${block.caption ? `<p>${escapeHtml(block.caption)}</p>` : ''}</section>`
  }
  if (block.type === 'number-line') {
    return `<section><h2>${escapeHtml(block.title)}</h2><p>数轴范围 ${block.min} ～ ${block.max}</p><ul>${(block.ticks || [])
      .map((tick) => `<li>${escapeHtml(tick.label)}（${tick.value}）</li>`)
      .join('')}</ul><p>定位：${(block.points || [])
      .map((point) => `${escapeHtml(point.label)}（${point.value}）`)
      .join('、')}</p>${block.caption ? `<p>${escapeHtml(block.caption)}</p>` : ''}</section>`
  }
  if (block.type === 'fill-blank') {
    return `<section><h2>${escapeHtml(block.title)}</h2><p>${escapeHtml(
      block.prompt,
    )}</p><p>答案：${(block.answers || []).map((answer) => escapeHtml(answer)).join('、')}</p>${
      block.hint ? `<p>提示：${escapeHtml(block.hint)}</p>` : ''
    }</section>`
  }
  if (block.type === 'wrong-first') {
    return `<section><h2>${escapeHtml(block.title)}</h2><p>常见错解：</p><ol>${(block.wrongSteps || [])
      .map(
        (step, index) =>
          `<li${index === block.errorIndex ? ' style="color:#c04b55"' : ''}>${escapeHtml(step)}</li>`,
      )
      .join('')}</ol><p>第 ${block.errorIndex + 1} 步错了：${escapeHtml(block.errorHint || '')}</p><p>正确做法：</p><ol>${(
      block.correctSteps || []
    )
      .map((step) => `<li>${escapeHtml(step)}</li>`)
      .join('')}</ol>${
      block.takeaway ? `<p><strong>带走：</strong>${escapeHtml(block.takeaway)}</p>` : ''
    }</section>`
  }
  if (block.type === 'judge') {
    return `<section><h2>${escapeHtml(block.title)}</h2><p>${escapeHtml(
      block.statement,
    )}</p><p>答案：${block.answer ? '对' : '错'}。${escapeHtml(block.explanation || '')}</p></section>`
  }
  if (block.type === 'case-table') {
    return `<section><h2>${escapeHtml(block.title)}</h2><table><thead><tr><th>${escapeHtml(
      block.dimension,
    )}</th><th>结论</th></tr></thead><tbody>${(block.cases || [])
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.condition)}</td><td>${escapeHtml(item.conclusion)}</td></tr>`,
      )
      .join('')}</tbody></table>${block.caption ? `<p>${escapeHtml(block.caption)}</p>` : ''}</section>`
  }
  if (block.type === 'induction') {
    return `<section><h2>${escapeHtml(block.title)}</h2><ul>${(block.examples || [])
      .map((example) => `<li>${escapeHtml(example)}</li>`)
      .join('')}</ul><p><strong>规律：</strong>${escapeHtml(block.rule)}</p>${
      block.hint ? `<p>提示：${escapeHtml(block.hint)}</p>` : ''
    }</section>`
  }
  if (block.type === 'multi-solution') {
    return `<section><h2>${escapeHtml(block.title)}</h2><p>${escapeHtml(block.problem)}</p>${(
      block.methods || []
    )
      .map(
        (method) =>
          `<h3>${escapeHtml(method.name)}${method.tag ? `（${escapeHtml(method.tag)}）` : ''}</h3><ol>${method.steps
            .map((step) => `<li>${escapeHtml(step)}</li>`)
            .join('')}</ol>`,
      )
      .join('')}${block.comparison ? `<p>${escapeHtml(block.comparison)}</p>` : ''}</section>`
  }
  return ''
}

export function boardLessonToHtml(lesson) {
  const blocks = (lesson?.blocks || []).map(renderBlock).join('\n')
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(lesson?.title || '课程板书')}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 42px 22px;
    color: #292943;
    background: #f5f2ea;
    font-family: "Segoe Print", "KaiTi", "STKaiti", "Noto Serif SC", serif;
    line-height: 1.8;
  }
  main {
    max-width: 1080px;
    margin: auto;
    padding: 42px 48px 56px;
    background-color: #fffefa;
    background-image: radial-gradient(rgba(111,118,154,.15) 1px, transparent 1px);
    background-size: 18px 18px;
    border: 1px solid #e3dfd3;
    border-radius: 12px;
  }
  header { padding-bottom: 20px; margin-bottom: 28px; border-bottom: 1px solid #d9d6cd; }
  small { color: #9295a8; font-size: 12px; letter-spacing: .06em; }
  h1 { width: fit-content; margin: 8px 0 6px; padding-right: 6px; color: #5647bd; font-size: 34px;
    background: linear-gradient(to top, rgba(218,208,255,.68) 38%, transparent 38%); }
  header p { margin: 0; color: #5f6279; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px 48px; align-items: start; }
  section, aside { break-inside: avoid; }
  h2 { width: fit-content; margin: 0 0 14px; padding-right: 5px; color: #5647bd; font-size: 20px;
    background: linear-gradient(to top, rgba(218,208,255,.68) 42%, transparent 42%); }
  ul { margin: 0; padding-left: 22px; }
  li { margin: 7px 0; }
  p { margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { padding: 9px 11px; border: 1px solid #4d5067; text-align: left; vertical-align: top; }
  th { color: #4459c6; background: #f0f1ff; }
  .chain { display: flex; gap: 8px; align-items: stretch; overflow-x: auto; }
  .node { flex: 1 0 120px; padding: 12px; border: 1px solid #4d5067; border-radius: 3px; }
  .node strong, .node span { display: block; }
  .node strong { color: #4459c6; }
  .node span { color: #5f6279; font-size: 13px; }
  .chain i { align-self: center; color: #4e5ec8; font-style: normal; }
  aside { padding: 12px 14px; background: #f6f3ff; border-left: 3px solid #4e5ec8; }
  .question { grid-column: 1 / -1; padding: 18px 20px; background: #f5f0ff; border: 1px solid #d9d1ee; }
  @media (max-width: 760px) {
    body { padding: 12px; }
    main { padding: 26px 18px 36px; }
    .grid { grid-template-columns: 1fr; gap: 24px; }
    .question { grid-column: auto; }
  }
  @media print {
    body { padding: 0; background: white; }
    main { max-width: none; border: 0; }
  }
</style>
</head>
<body>
<main>
  <header>
    <small>${escapeHtml(lesson?.chapter || '课程板书')}</small>
    <h1>${escapeHtml(lesson?.title || '课程板书')}</h1>
    <p>${escapeHtml(lesson?.subtitle || '')}</p>
  </header>
  <div class="grid">${blocks}</div>
</main>
</body>
</html>`
}

export function downloadBoardLesson(lesson) {
  const blob = new Blob([boardLessonToHtml(lesson)], {
    type: 'text/html;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${String(lesson?.title || '课程板书').replace(/[\\/:*?"<>|]/g, '-')}.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
