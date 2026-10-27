/**
 * 轻量 Markdown 渲染（AI 反馈/答疑文本）
 * 模型输出常含 `### 小标题`、`**加粗**`、`- 列表` 等标记，
 * 直接原样显示会破坏「红批」等排版。这里做最小集合转换：
 *   1. 先整体 HTML 转义（防注入）
 *   2. `#` ~ `######` 行 → 加粗标题行
 *   3. `**加粗**` → <b>
 *   4. 行首 `- ` / `* ` → 列表点
 *   5. 保留换行
 */

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderMd(text) {
  if (!text) return ''
  const lines = escapeHtml(String(text)).split(/\r?\n/)
  const html = lines
    .map((line) => {
      let l = line
      // 行内加粗
      l = l.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      // 标题行 → 加粗（保留文字）
      const h = l.match(/^\s*#{1,6}\s*(.+)$/)
      if (h) return `<b>${h[1]}</b>`
      // 无序列表
      const ul = l.match(/^\s*[-*]\s+(.+)$/)
      if (ul) return `· ${ul[1]}`
      return l
    })
    .join('<br>')
  return html
}

export default renderMd
