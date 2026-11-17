/**
 * elements.js — 有理数「视频复刻」课程的 SVG 元素构建库
 *
 * 纯函数：每个 builder 接收元素对象，返回 SVG 片段字符串。
 * 舞台（ReplicaStage）把片段包进 <g> 里统一做进入/退出动画。
 *
 * 视觉契约（对照乐乐课堂原视频逐帧还原）：
 * - 手绘感：圆角笔触 + 基于元素 id 的确定性抖动（同一 id 抖动稳定）
 * - 配色：正数/正能量 = 红粉系，负数/负能量 = 蓝系，强调 = 红，肯定 = 绿
 * - 舞台背景由 CSS 提供（白底点阵），元素全部透明底
 */

export const C = {
  ink: '#2a2721',
  sub: '#6b6558',
  red: '#c0483c',
  redSoft: '#f0b7bc',
  blue: '#2f5edb',
  blueSoft: '#b3c9e4',
  green: '#2f8f5b',
  greenSoft: '#bfe3cd',
  orange: '#d97706',
  gray: '#8a8378',
  line: '#3a352d',
  paper: '#ffffff',
  skin: '#f6d9b8',
  dog: '#f2c94c',
  dogDark: '#b8892a',
  energy: '#9ad6b4',
  road: '#c9cfd6',
}

/* ---------- 基础工具 ---------- */

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 确定性伪随机（同一 id 永远得到同一抖动，重渲染不跳变） */
function hashOf(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

/** 手绘抖动：返回 [-1, 1] */
function jit(id, salt = '') {
  return hashOf(`${id}:${salt}`) * 2 - 1
}

/** 在直线两端加 ±0.7px 抖动，模拟手绘线条 */
function handLine(x1, y1, x2, y2, id, salt = '') {
  const j = 0.7
  return `M ${(x1 + jit(id, salt + 'a') * j).toFixed(1)} ${(y1 + jit(id, salt + 'b') * j).toFixed(1)} L ${(x2 + jit(id, salt + 'c') * j).toFixed(1)} ${(y2 + jit(id, salt + 'd') * j).toFixed(1)}`
}

/** 文本宽度估算（CJK≈1em，ASCII≈0.56em，空格 0.32em） */
export function textWidth(t, s) {
  let w = 0
  for (const ch of String(t)) {
    if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch)) w += 1
    else if (ch === ' ') w += 0.32
    else w += 0.56
  }
  return w * s
}

/** 通用文本（可选底色框 / 下划线） */
function text(el) {
  const s = el.s || 20
  const c = el.c || C.ink
  const anchor = el.align === 'middle' ? 'middle' : el.align === 'end' ? 'end' : 'start'
  const weight = el.b ? '700' : '400'
  const deco = el.u ? ' text-decoration="underline"' : ''
  const family = el.font === 'brush' ? "'Kaiti SC','KaiTi','STKaiti',serif" : 'inherit'
  let out = `<text x="${el.x}" y="${el.y}" font-size="${s}" fill="${c}" font-weight="${weight}" text-anchor="${anchor}" font-family="${family}"${deco} dominant-baseline="${el.baseline || 'auto'}">${esc(el.t)}</text>`
  if (el.box) {
    const w = textWidth(el.t, s) + 18
    const h = s + 14
    const x = anchor === 'middle' ? el.x - w / 2 : anchor === 'end' ? el.x - w : el.x - 9
    const bc = el.box === 'red' ? C.red : el.box === 'green' ? C.green : C.ink
    out =
      `<rect x="${x.toFixed(1)}" y="${(el.y - s - 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h}" rx="6" fill="none" stroke="${bc}" stroke-width="2.2" opacity="0.9"/>` +
      out
  }
  return out
}

/** 叠分数：sign + num/den */
function frac(el) {
  const s = el.s || 20
  const c = el.c || C.ink
  const sign = el.sign || ''
  const w = Math.max(textWidth(el.num, s * 0.82), textWidth(el.den, s * 0.82))
  const signW = sign ? textWidth(sign, s) + 2 : 0
  const x = el.x
  const y = el.y
  const numW = textWidth(el.num, s * 0.82)
  const denW = textWidth(el.den, s * 0.82)
  const barW = w + 8
  return (
    (sign ? `<text x="${x}" y="${y - s * 0.18}" font-size="${s}" fill="${c}" text-anchor="start">${esc(sign)}</text>` : '') +
    `<text x="${x + signW + (barW - numW) / 2}" y="${y - s * 0.28}" font-size="${(s * 0.82).toFixed(1)}" fill="${c}" text-anchor="middle">${esc(el.num)}</text>` +
    `<line x1="${x + signW}" y1="${y + 2}" x2="${x + signW + barW}" y2="${y + 2}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>` +
    `<text x="${x + signW + (barW - denW) / 2}" y="${y + s * 0.95}" font-size="${(s * 0.82).toFixed(1)}" fill="${c}" text-anchor="middle">${esc(el.den)}</text>`
  )
}

/** 等式行：parts=[{t,c,b,u}]，c 为颜色；box 支持整行框选 */
function eqline(el) {
  const s = el.s || 22
  let x = el.x
  let spans = ''
  let totalW = 0
  const widths = []
  for (const p of el.parts) {
    const w = textWidth(p.t, p.b ? s * 1.06 : s)
    widths.push(w)
    totalW += w
  }
  el.parts.forEach((p, i) => {
    const c = p.c || C.ink
    const weight = p.b ? '700' : '400'
    const deco = p.u ? ' text-decoration="underline"' : ''
    spans += `<tspan x="${x.toFixed(1)}" fill="${c}" font-weight="${weight}"${deco}>${esc(p.t)}</tspan>`
    x += widths[i]
  })
  let out = `<text x="${el.x}" y="${el.y}" font-size="${s}" fill="${C.ink}">${spans}</text>`
  if (el.box) {
    const bc = el.box === 'red' ? C.red : el.box === 'green' ? C.green : C.ink
    out =
      `<rect x="${(el.x - 10).toFixed(1)}" y="${(el.y - s - 4).toFixed(1)}" width="${(totalW + 20).toFixed(1)}" height="${s + 16}" rx="7" fill="none" stroke="${bc}" stroke-width="2.4" opacity="0.92"/>` +
      out
  }
  return out
}

/** 温度计（竖式）：零度分界，上红下蓝 */
function thermo(el) {
  const x = el.x
  const y = el.y
  const sc = el.s || 1
  const tubeW = 26 * sc
  const top = y
  const bottom = y + 240 * sc
  const zeroY = y + 150 * sc
  const unit = 6 * sc // 每度像素
  const marks = [30, 20, 10, 0, -10, -20, -30]
  const id = el.id || 'thermo'
  let out = ''
  // 玻璃管
  out += `<rect x="${x}" y="${top}" width="${tubeW}" height="${240 * sc}" rx="${tubeW / 2}" fill="#fdfcf8" stroke="${C.line}" stroke-width="2.4"/>`
  // 液柱（零上红、零下蓝）
  out += `<rect x="${x + 4 * sc}" y="${zeroY}" width="${tubeW - 8 * sc}" height="${(bottom - zeroY - 4 * sc).toFixed(1)}" fill="${C.blue}" opacity="0.85"/>`
  out += `<rect x="${x + 4 * sc}" y="${top + 6 * sc}" width="${tubeW - 8 * sc}" height="${(zeroY - top - 6 * sc).toFixed(1)}" fill="${C.red}" opacity="0.85"/>`
  // 球泡
  out += `<circle cx="${x + tubeW / 2}" cy="${bottom}" r="${17 * sc}" fill="${C.red}" stroke="${C.line}" stroke-width="2.4"/>`
  // 刻度
  for (const m of marks) {
    const my = zeroY - m * unit
    const isZero = m === 0
    const tw = isZero ? 16 * sc : 10 * sc
    const lc = isZero ? C.ink : m > 0 ? C.red : C.blue
    out += `<line x1="${x + tubeW + 3}" y1="${my}" x2="${x + tubeW + 3 + tw}" y2="${my}" stroke="${lc}" stroke-width="${isZero ? 2.6 : 1.8}" stroke-linecap="round"/>`
    const label = isZero ? '0' : m > 0 ? String(m) : `-${-m}`
    out += `<text x="${x + tubeW + 8 + tw}" y="${my + 5 * sc}" font-size="${15 * sc}" fill="${lc}" font-weight="${isZero ? 700 : 400}">${label}</text>`
    if (jit(id, `m${m}`) > 0.4) {
      out += `<line x1="${x + 3}" y1="${my}" x2="${x + 9}" y2="${my}" stroke="${lc}" stroke-width="1.4"/>`
    }
  }
  // °C
  out += `<text x="${x + tubeW / 2}" y="${top - 12 * sc}" font-size="${17 * sc}" fill="${C.ink}" text-anchor="middle" font-style="italic">℃</text>`
  // 高亮刻度（hi: [10,20] 画红圈）
  for (const h of el.hi || []) {
    const hy = zeroY - h * unit
    out += `<circle cx="${x + tubeW / 2}" cy="${hy}" r="${13 * sc}" fill="none" stroke="${C.red}" stroke-width="2.6" opacity="0.95"/>`
  }
  return out
}

/** 数轴：刻度/点/折叠弧/距离括号/移动动画 */
function numberline(el) {
  const id = el.id || 'nl'
  const x = el.x
  const y = el.y
  const from = el.from ?? -5
  const to = el.to ?? 5
  const w = el.w || 520
  const u = w / (to - from) // 每单位像素
  const X = (v) => x + (v - from) * u
  let out = ''
  // 主轴 + 右箭头
  out += `<path d="${handLine(x - 6, y, x + w + 14, y, id, 'ax')}" stroke="${C.line}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
  out += `<path d="M ${x + w + 6} ${y - 7} L ${x + w + 18} ${y} L ${x + w + 6} ${y + 7} Z" fill="${C.line}"/>`
  // 刻度与数字
  for (let v = from; v <= to; v += 1) {
    const tx = X(v)
    const isZero = v === 0
    out += `<line x1="${tx.toFixed(1)}" y1="${y - 5}" x2="${tx.toFixed(1)}" y2="${y + 5}" stroke="${isZero ? C.ink : C.line}" stroke-width="${isZero ? 2.8 : 1.8}" stroke-linecap="round"/>`
    out += `<text x="${tx.toFixed(1)}" y="${y + 26}" font-size="${el.labelSize || 16}" fill="${isZero ? C.ink : C.sub}" text-anchor="middle" font-weight="${isZero ? 700 : 400}">${v}</text>`
  }
  // 分数刻度（fracTicks: [{v, lab}]，lab 支持 '3/5' 形式）
  for (const f of el.fracTicks || []) {
    const fx = X(f.v)
    out += `<line x1="${fx.toFixed(1)}" y1="${y - 4}" x2="${fx.toFixed(1)}" y2="${y + 4}" stroke="${f.c || C.sub}" stroke-width="1.8" stroke-linecap="round"/>`
    if (f.lab) {
      const lw = textWidth(f.lab, 13)
      out += `<text x="${fx.toFixed(1)}" y="${y + 26}" font-size="13" fill="${f.c || C.sub}" text-anchor="middle">${esc(f.lab)}</text>`
      if (lw > u * 0.9) {
        // 标签太挤时上移
        out = out.replace(
          new RegExp(`<text x="${fx.toFixed(1)}" y="${y + 26}" font-size="13"[^>]*>${esc(f.lab)}</text>`),
          `<text x="${fx.toFixed(1)}" y="${y - 12}" font-size="13" fill="${f.c || C.sub}" text-anchor="middle">${esc(f.lab)}</text>`,
        )
      }
    }
  }
  // 距离括号 arcs kind='bracket'
  for (const a of el.arcs || []) {
    if (a.kind === 'bracket') {
      const x1 = X(a.a)
      const x2 = X(a.b)
      const by = y + (a.dy || 44)
      out += `<path d="M ${x1.toFixed(1)} ${y + 6} L ${x1.toFixed(1)} ${by - 6} Q ${x1.toFixed(1)} ${by} ${x1 + 6} ${by} L ${x2 - 6} ${by} Q ${x2.toFixed(1)} ${by} ${x2.toFixed(1)} ${by - 6} L ${x2.toFixed(1)} ${y + 6}" fill="none" stroke="${a.c || C.red}" stroke-width="2.2" stroke-linecap="round"/>`
      if (a.lab) {
        out += `<text x="${((x1 + x2) / 2).toFixed(1)}" y="${by + 20}" font-size="16" fill="${a.c || C.red}" text-anchor="middle" font-weight="700">${esc(a.lab)}</text>`
      }
    } else if (a.kind === 'fold') {
      // 对折弧：a、b 关于原点对称，画一个拱 + 原点环
      const x1 = X(a.a)
      const x2 = X(a.b)
      const r = Math.abs(x2 - x1) / 2
      const cx = (x1 + x2) / 2
      const ay = y - (a.h || r + 14)
      out += `<path d="M ${x1.toFixed(1)} ${y - 4} A ${r.toFixed(1)} ${(a.h || r + 14).toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y - 4}" fill="none" stroke="${a.c || C.orange}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="${a.dash || 'none'}"/>`
      if (a.label !== false) {
        out += `<text x="${cx.toFixed(1)}" y="${(ay - 8).toFixed(1)}" font-size="15" fill="${a.c || C.orange}" text-anchor="middle">${esc(a.lab || '对折重合')}</text>`
      }
    } else if (a.kind === 'walk') {
      // 移动路径：小弧线 + 步数标注
      const x1 = X(a.a)
      const x2 = X(a.b)
      const my = y - (a.h || 34)
      out += `<path d="M ${x1.toFixed(1)} ${y - 6} Q ${((x1 + x2) / 2).toFixed(1)} ${my - 26} ${x2.toFixed(1)} ${y - 6}" fill="none" stroke="${a.c || C.orange}" stroke-width="2.2" stroke-dasharray="6 5" stroke-linecap="round"/>`
      out += `<path d="M ${x2 - 7} ${y - 12} L ${x2} ${y - 5} L ${x2 - 12} ${y - 5} Z" fill="${a.c || C.orange}"/>`
      if (a.lab) {
        out += `<text x="${((x1 + x2) / 2).toFixed(1)}" y="${my - 12}" font-size="15" fill="${a.c || C.orange}" text-anchor="middle">${esc(a.lab)}</text>`
      }
    }
  }
  // 原点强调环
  if (el.originRing) {
    out += `<circle cx="${X(0).toFixed(1)}" cy="${y}" r="11" fill="none" stroke="${C.red}" stroke-width="2.6"/>`
  }
  // 点
  for (const p of el.pts || []) {
    const px = X(p.v)
    const c = p.c || C.red
    const r = p.r || 7
    if (p.ring) {
      out += `<circle cx="${px.toFixed(1)}" cy="${y}" r="${r + 4}" fill="none" stroke="${c}" stroke-width="2.2" opacity="0.7"/>`
    }
    out += `<circle cx="${px.toFixed(1)}" cy="${y}" r="${r}" fill="${c}" stroke="#ffffff" stroke-width="1.6"/>`
    if (p.lab) {
      out += `<text x="${px.toFixed(1)}" y="${y - 14}" font-size="${p.labSize || 17}" fill="${c}" text-anchor="middle" font-weight="700">${esc(p.lab)}</text>`
    }
  }
  // 移动中的点（SMIL：进入舞台时自动走）
  if (el.move) {
    const mx = X(el.move.from)
    const dx = (el.move.to - el.move.from) * u
    const c = el.move.c || C.red
    out += `<circle cx="${mx.toFixed(1)}" cy="${y}" r="8" fill="${c}" stroke="#ffffff" stroke-width="1.6">` +
      `<animateTransform attributeName="transform" type="translate" from="0 0" to="${dx.toFixed(1)} 0" dur="${(el.move.ms || 1400) / 1000}s" begin="0.25s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.6 1" keyTimes="0;1" values="0 0;${dx.toFixed(1)} 0"/>` +
      `</circle>`
    if (el.move.lab) {
      out += `<text x="${mx.toFixed(1)}" y="${y - 16}" font-size="17" fill="${c}" text-anchor="middle" font-weight="700">${esc(el.move.lab)}` +
        `<animateTransform attributeName="transform" type="translate" from="0 0" to="${dx.toFixed(1)} 0" dur="${(el.move.ms || 1400) / 1000}s" begin="0.25s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.6 1" keyTimes="0;1" values="0 0;${dx.toFixed(1)} 0"/></text>`
    }
  }
  return out
}

/** 城堡（正数国/负数国） */
function castle(el) {
  const pos = el.side !== 'neg'
  const fill = pos ? C.redSoft : C.blueSoft
  const edge = pos ? C.red : C.blue
  const ch = pos ? '正' : '负'
  const x = el.x
  const y = el.y
  const sc = el.s || 1
  const w = 120 * sc
  const h = 96 * sc
  let out = `<g opacity="0.98">`
  // 主体
  out += `<path d="M ${x} ${y} L ${x} ${y - h + 26 * sc} L ${x + w * 0.2} ${y - h + 26 * sc} L ${x + w * 0.2} ${y - h} L ${x + w * 0.38} ${y - h} L ${x + w * 0.38} ${y - h + 26 * sc} L ${x + w * 0.62} ${y - h + 26 * sc} L ${x + w * 0.62} ${y - h} L ${x + w * 0.8} ${y - h} L ${x + w * 0.8} ${y - h + 26 * sc} L ${x + w} ${y - h + 26 * sc} L ${x + w} ${y} Z" fill="${fill}" stroke="${edge}" stroke-width="2.6" stroke-linejoin="round"/>`
  // 城门
  out += `<path d="M ${x + w * 0.4} ${y} L ${x + w * 0.4} ${y - 34 * sc} A ${w * 0.1} ${w * 0.1} 0 0 1 ${x + w * 0.6} ${y - 34 * sc} L ${x + w * 0.6} ${y} Z" fill="#8a6f5c" stroke="${edge}" stroke-width="2.2"/>`
  // 旗帜
  out += `<line x1="${x + w * 0.2}" y1="${y - h}" x2="${x + w * 0.2}" y2="${y - h - 26 * sc}" stroke="${C.line}" stroke-width="2.4" stroke-linecap="round"/>`
  out += `<path d="M ${x + w * 0.2} ${y - h - 26 * sc} L ${x + w * 0.2 + 30 * sc} ${y - h - 20 * sc} L ${x + w * 0.2} ${y - h - 12 * sc} Z" fill="${edge}"/>`
  out += `<line x1="${x + w * 0.8}" y1="${y - h}" x2="${x + w * 0.8}" y2="${y - h - 26 * sc}" stroke="${C.line}" stroke-width="2.4" stroke-linecap="round"/>`
  out += `<path d="M ${x + w * 0.8} ${y - h - 26 * sc} L ${x + w * 0.8 + 30 * sc} ${y - h - 20 * sc} L ${x + w * 0.8} ${y - h - 12 * sc} Z" fill="${edge}"/>`
  // 匾额
  out += `<rect x="${x + w * 0.36}" y="${y - h + 34 * sc}" width="${w * 0.28}" height="${26 * sc}" rx="5" fill="#fffdf6" stroke="${edge}" stroke-width="2.2"/>`
  out += `<text x="${x + w * 0.5}" y="${y - h + 34 * sc + 19 * sc}" font-size="${20 * sc}" fill="${edge}" text-anchor="middle" font-weight="700">${ch}</text>`
  out += `</g>`
  return out
}

/** 卡通人物：为师/徒儿/小四…… */
function person(el) {
  const x = el.x
  const y = el.y // 脚底
  const sc = el.s || 1
  const shirt = el.shirt || C.orange
  const pose = el.pose || 'stand'
  const id = el.id || 'person'
  let out = `<g>`
  if (pose === 'down') {
    // 倒地（火拼败将）
    out += `<ellipse cx="${x}" cy="${y}" rx="${30 * sc}" ry="${9 * sc}" fill="${shirt}" stroke="${C.line}" stroke-width="2.4"/>`
    out += `<circle cx="${x - 34 * sc}" cy="${y - 4 * sc}" r="${12 * sc}" fill="${C.skin}" stroke="${C.line}" stroke-width="2.2"/>`
    out += `<path d="M ${x - 44 * sc} ${y - 8 * sc} Q ${x - 34 * sc} ${y - 20 * sc} ${x - 24 * sc} ${y - 8 * sc}" fill="${C.ink}"/>`
    out += `<line x1="${x - 38 * sc}" y1="${y - 4 * sc}" x2="${x - 41 * sc}" y2="${y - 4 * sc}" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`
    out += `<path d="M ${x - 36 * sc} ${y + 1 * sc} q 4 4 8 0" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`
    out += `</g>`
    return out
  }
  // 腿
  const legSpread = pose === 'walk' ? 10 * sc : 5 * sc
  out += `<line x1="${x - 3 * sc}" y1="${y - 30 * sc}" x2="${x - 3 * sc - legSpread}" y2="${y}" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`
  out += `<line x1="${x + 3 * sc}" y1="${y - 30 * sc}" x2="${x + 3 * sc + legSpread}" y2="${y}" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`
  // 身体（长袍）
  out += `<path d="M ${x - 15 * sc} ${y - 28 * sc} L ${x - 12 * sc} ${y - 62 * sc} Q ${x} ${y - 70 * sc} ${x + 12 * sc} ${y - 62 * sc} L ${x + 15 * sc} ${y - 28 * sc} Z" fill="${shirt}" stroke="${C.line}" stroke-width="2.4" stroke-linejoin="round"/>`
  // 手臂
  if (pose === 'cheer') {
    out += `<line x1="${x - 12 * sc}" y1="${y - 58 * sc}" x2="${x - 26 * sc}" y2="${y - 84 * sc}" stroke="${shirt}" stroke-width="6" stroke-linecap="round"/>`
    out += `<line x1="${x + 12 * sc}" y1="${y - 58 * sc}" x2="${x + 26 * sc}" y2="${y - 84 * sc}" stroke="${shirt}" stroke-width="6" stroke-linecap="round"/>`
  } else if (pose === 'hold') {
    out += `<line x1="${x - 12 * sc}" y1="${y - 56 * sc}" x2="${x - 22 * sc}" y2="${y - 44 * sc}" stroke="${shirt}" stroke-width="6" stroke-linecap="round"/>`
    out += `<line x1="${x + 12 * sc}" y1="${y - 56 * sc}" x2="${x + 24 * sc}" y2="${y - 66 * sc}" stroke="${shirt}" stroke-width="6" stroke-linecap="round"/>`
  } else {
    out += `<line x1="${x - 13 * sc}" y1="${y - 56 * sc}" x2="${x - 19 * sc}" y2="${y - 34 * sc}" stroke="${shirt}" stroke-width="6" stroke-linecap="round"/>`
    out += `<line x1="${x + 13 * sc}" y1="${y - 56 * sc}" x2="${x + 19 * sc}" y2="${y - 34 * sc}" stroke="${shirt}" stroke-width="6" stroke-linecap="round"/>`
  }
  // 头
  out += `<circle cx="${x}" cy="${y - 80 * sc}" r="${15 * sc}" fill="${C.skin}" stroke="${C.line}" stroke-width="2.4"/>`
  // 头发
  out += `<path d="M ${x - 15 * sc} ${y - 84 * sc} Q ${x - 10 * sc} ${y - 100 * sc} ${x} ${y - 99 * sc} Q ${x + 10 * sc} ${y - 100 * sc} ${x + 15 * sc} ${y - 84 * sc} Q ${x} ${y - 90 * sc} ${x - 15 * sc} ${y - 84 * sc} Z" fill="${C.ink}"/>`
  // 眼睛（笑眼 ^^）
  if (el.mood === 'sad') {
    out += `<line x1="${x - 7 * sc}" y1="${y - 82 * sc}" x2="${x - 2 * sc}" y2="${y - 82 * sc}" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`
    out += `<line x1="${x + 2 * sc}" y1="${y - 82 * sc}" x2="${x + 7 * sc}" y2="${y - 82 * sc}" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`
    out += `<path d="M ${x - 5 * sc} ${y - 71 * sc} q 5 -5 10 0" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`
  } else {
    out += `<path d="M ${x - 8 * sc} ${y - 82 * sc} q 3 -4 6 0" fill="none" stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round"/>`
    out += `<path d="M ${x + 2 * sc} ${y - 82 * sc} q 3 -4 6 0" fill="none" stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round"/>`
    out += `<path d="M ${x - 5 * sc} ${y - 74 * sc} q 5 6 10 0" fill="none" stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round"/>`
  }
  // 腮红
  out += `<circle cx="${x - 10 * sc}" cy="${y - 76 * sc}" r="${2.6 * sc}" fill="#f2a49c" opacity="0.8"/>`
  out += `<circle cx="${x + 10 * sc}" cy="${y - 76 * sc}" r="${2.6 * sc}" fill="#f2a49c" opacity="0.8"/>`
  out += `</g>`
  // 举牌
  if (el.sign) {
    const sx = x + (el.signX || 26) * sc
    const sy = y - 100 * sc
    const sw = Math.max(34 * sc, textWidth(el.sign, 18 * sc) + 16)
    out += `<g>`
    out += `<line x1="${x + 14 * sc}" y1="${y - 66 * sc}" x2="${sx}" y2="${sy + 10 * sc}" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>`
    out += `<rect x="${sx - sw / 2}" y="${sy - 14 * sc}" width="${sw}" height="${30 * sc}" rx="6" fill="#fffdf6" stroke="${C.line}" stroke-width="2.2"/>`
    out += `<text x="${sx}" y="${sy + 7 * sc}" font-size="${18 * sc}" fill="${el.signC || C.red}" text-anchor="middle" font-weight="700">${esc(el.sign)}</text>`
    out += `</g>`
  }
  // 行走位移（SMIL）
  if (el.walk) {
    const dx = el.walk.dx || 0
    const ms = el.walk.ms || 1200
    out = `<g><animateTransform attributeName="transform" type="translate" from="0 0" to="${dx} 0" dur="${ms / 1000}s" begin="0.2s" fill="freeze"/>${out}</g>`
  }
  return out
}

/** 汪星人 */
function dog(el) {
  const x = el.x
  const y = el.y
  const sc = el.s || 1
  const id = el.id || 'dog'
  let out = `<g>`
  // 身子
  out += `<ellipse cx="${x}" cy="${y}" rx="${22 * sc}" ry="${14 * sc}" fill="${C.dog}" stroke="${C.dogDark}" stroke-width="2.4"/>`
  // 头
  out += `<circle cx="${x + 20 * sc}" cy="${y - 12 * sc}" r="${12 * sc}" fill="${C.dog}" stroke="${C.dogDark}" stroke-width="2.4"/>`
  // 耳朵
  out += `<path d="M ${x + 12 * sc} ${y - 21 * sc} Q ${x + 9 * sc} ${y - 32 * sc} ${x + 16 * sc} ${y - 26 * sc} Z" fill="${C.dog}" stroke="${C.dogDark}" stroke-width="2.2" stroke-linejoin="round"/>`
  // 脸
  out += `<circle cx="${x + 24 * sc}" cy="${y - 14 * sc}" r="${2.2 * sc}" fill="${C.ink}"/>`
  out += `<circle cx="${x + 30 * sc}" cy="${y - 13 * sc}" r="${2.2 * sc}" fill="${C.ink}"/>`
  out += `<ellipse cx="${x + 28 * sc}" cy="${y - 8 * sc}" rx="${3.4 * sc}" ry="${2.6 * sc}" fill="${C.ink}"/>`
  out += `<path d="M ${x + 24 * sc} ${y - 6 * sc} q 4 4 8 0" fill="none" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/>`
  // 尾巴（摇）
  out += `<path d="M ${x - 20 * sc} ${y - 6 * sc} q -10 -4 -12 -14" fill="none" stroke="${C.dogDark}" stroke-width="2.6" stroke-linecap="round">` +
    `<animate attributeName="d" dur="0.9s" repeatCount="indefinite" values="M ${x - 20 * sc} ${y - 6 * sc} q -10 -4 -12 -14; M ${x - 20 * sc} ${y - 6 * sc} q -12 -8 -8 -18; M ${x - 20 * sc} ${y - 6 * sc} q -10 -4 -12 -14"/>` +
    `</path>`
  // 腿
  out += `<line x1="${x - 12 * sc}" y1="${y + 10 * sc}" x2="${x - 12 * sc}" y2="${y + 22 * sc}" stroke="${C.dogDark}" stroke-width="3.4" stroke-linecap="round"/>`
  out += `<line x1="${x + 10 * sc}" y1="${y + 10 * sc}" x2="${x + 10 * sc}" y2="${y + 22 * sc}" stroke="${C.dogDark}" stroke-width="3.4" stroke-linecap="round"/>`
  out += `</g>`
  if (el.walk) {
    const dx = el.walk.dx
    const ms = el.walk.ms || 1500
    out = `<g><animateTransform attributeName="transform" type="translate" from="0 0" to="${dx} 0" dur="${ms / 1000}s" begin="0.2s" fill="freeze"/>${out}</g>`
  }
  return out
}

/** 正能量/负能量块 */
function energy(el) {
  const pos = el.sign !== '-'
  const x = el.x
  const y = el.y
  const sc = el.s || 1
  const w = 40 * sc
  const h = 34 * sc
  const fill = pos ? '#f3b1b8' : '#a9c6e8'
  const edge = pos ? C.red : C.blue
  let out = `<g>`
  out += `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${8 * sc}" fill="${fill}" stroke="${edge}" stroke-width="2.4"/>`
  out += `<text x="${x}" y="${y + 7 * sc}" font-size="${20 * sc}" fill="${edge}" text-anchor="middle" font-weight="700">${pos ? '+' : '-'}${esc(el.val)}</text>`
  // 小闪电/光芒
  out += `<path d="M ${x - w / 2 - 6} ${y - h / 2 - 4} l 4 -6 l 4 6" fill="none" stroke="${edge}" stroke-width="2" stroke-linecap="round"/>`
  out += `<path d="M ${x + w / 2 + 2} ${y - h / 2 - 4} l 4 -6 l 4 6" fill="none" stroke="${edge}" stroke-width="2" stroke-linecap="round"/>`
  out += `</g>`
  if (el.fly) {
    const dx = el.fly.dx
    const dy = el.fly.dy || 0
    const ms = el.fly.ms || 900
    const delay = el.fly.delay || 0
    out = `<g><animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy}" dur="${ms / 1000}s" begin="${delay / 1000}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.6 1" keyTimes="0;1"/>${out}</g>`
  }
  return out
}

/** 火拼爆炸云 */
function boom(el) {
  const x = el.x
  const y = el.y
  const sc = el.s || 1
  let out = `<g opacity="0.95">`
  const puffs = [
    [0, 0, 34],
    [-26, -8, 20],
    [26, -8, 20],
    [-14, 16, 18],
    [16, 16, 18],
    [0, -22, 18],
  ]
  for (const [dx, dy, r] of puffs) {
    out += `<circle cx="${x + dx * sc}" cy="${y + dy * sc}" r="${r * sc}" fill="#f6e7c8" stroke="#c9a86a" stroke-width="2.2"/>`
  }
  out += `<text x="${x}" y="${y + 7 * sc}" font-size="${22 * sc}" text-anchor="middle" font-weight="700" fill="#a5673f">嘭!</text>`
  out += `</g>`
  out = `<g><animate attributeName="opacity" from="0" to="1" dur="0.28s" begin="0s" fill="freeze"/><animateTransform attributeName="transform" type="scale" values="0.4;1.12;1" dur="0.45s" begin="0s" fill="freeze" additive="sum"/>${out}</g>`
  return out
}

/** 箭头（可弯曲） */
function arrow(el) {
  const c = el.c || C.ink
  const x1 = el.x
  const y1 = el.y
  const x2 = el.x2
  const y2 = el.y2
  const mx = (x1 + x2) / 2 + (el.curve || 0)
  const my = (y1 + y2) / 2 + (el.curve ? -Math.abs(el.curve) * 0.4 : 0)
  const ang = Math.atan2(y2 - my, x2 - mx)
  const hx = x2 - 9 * Math.cos(ang - 0.42)
  const hy = y2 - 9 * Math.sin(ang - 0.42)
  const hx2 = x2 - 9 * Math.cos(ang + 0.42)
  const hy2 = y2 - 9 * Math.sin(ang + 0.42)
  return (
    `<path d="M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" ${el.dash ? `stroke-dasharray="${el.dash}"` : ''}/>` +
    `<path d="M ${hx.toFixed(1)} ${hy.toFixed(1)} L ${x2} ${y2} L ${hx2.toFixed(1)} ${hy2.toFixed(1)} Z" fill="${c}"/>`
  )
}

/** 立方体/正方形（乘方引入） */
function cube(el) {
  const x = el.x
  const y = el.y
  const sc = el.s || 1
  let out = `<g>`
  if (el.kind === 'sq') {
    out += `<rect x="${x}" y="${y}" width="${64 * sc}" height="${64 * sc}" fill="#f3e2c2" stroke="${C.line}" stroke-width="2.6"/>`
    out += `<text x="${x + 32 * sc}" y="${y + 82 * sc}" font-size="18" fill="${C.ink}" text-anchor="middle">a</text>`
    out += `<text x="${x - 18 * sc}" y="${y + 36 * sc}" font-size="18" fill="${C.ink}" text-anchor="middle">a</text>`
  } else if (el.kind === 'block') {
    // 彩色魔方（a² 的图示）
    const w = 58 * sc
    const d = 20 * sc
    out += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#e88f8f" stroke="${C.line}" stroke-width="2.4"/>`
    out += `<path d="M ${x} ${y} L ${x + d} ${y - d} L ${x + w + d} ${y - d} L ${x + w} ${y} Z" fill="#f2b8b8" stroke="${C.line}" stroke-width="2.4" stroke-linejoin="round"/>`
    out += `<path d="M ${x + w} ${y} L ${x + w + d} ${y - d} L ${x + w + d} ${y + w - d} L ${x + w} ${y + w} Z" fill="#d97b7b" stroke="${C.line}" stroke-width="2.4" stroke-linejoin="round"/>`
  } else {
    // 正方体
    const w = 56 * sc
    const d = 20 * sc
    out += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#e8dcc2" stroke="${C.line}" stroke-width="2.4"/>`
    out += `<path d="M ${x} ${y} L ${x + d} ${y - d} L ${x + w + d} ${y - d} L ${x + w} ${y} Z" fill="#f4ecd9" stroke="${C.line}" stroke-width="2.4" stroke-linejoin="round"/>`
    out += `<path d="M ${x + w} ${y} L ${x + w + d} ${y - d} L ${x + w + d} ${y + w - d} L ${x + w} ${y + w} Z" fill="#d8cbae" stroke="${C.line}" stroke-width="2.4" stroke-linejoin="round"/>`
    out += `<text x="${x + w / 2}" y="${y + w + 24 * sc}" font-size="17" fill="${C.ink}" text-anchor="middle">a</text>`
    out += `<text x="${x - 16 * sc}" y="${y + w / 2}" font-size="17" fill="${C.ink}" text-anchor="middle">a</text>`
    out += `<text x="${x + w + d + 12 * sc}" y="${y + w / 2}" font-size="17" fill="${C.ink}" text-anchor="middle">a</text>`
  }
  out += `</g>`
  return out
}

/** 翔（视频原画的名场面，忠实复刻） */
function poop(el) {
  const x = el.x
  const y = el.y
  const sc = el.s || 1
  return `<g>
    <ellipse cx="${x}" cy="${y - 6 * sc}" rx="${26 * sc}" ry="${12 * sc}" fill="#8a5a33" stroke="#5f3d22" stroke-width="2.4"/>
    <ellipse cx="${x}" cy="${y - 20 * sc}" rx="${18 * sc}" ry="${10 * sc}" fill="#9c6a3d" stroke="#5f3d22" stroke-width="2.4"/>
    <ellipse cx="${x + 2 * sc}" cy="${y - 32 * sc}" rx="${11 * sc}" ry="${8 * sc}" fill="#ad7a4a" stroke="#5f3d22" stroke-width="2.4"/>
    <path d="M ${x + 6 * sc} ${y - 38 * sc} q 4 -8 8 -2" fill="none" stroke="#5f3d22" stroke-width="2.2" stroke-linecap="round"/>
  </g>`
}

/** 肉（八斤的肉） */
function meat(el) {
  const x = el.x
  const y = el.y
  const sc = el.s || 1
  return `<g>
    <ellipse cx="${x}" cy="${y}" rx="${30 * sc}" ry="${20 * sc}" fill="#e09a9a" stroke="#a35b5b" stroke-width="2.6"/>
    <path d="M ${x - 8 * sc} ${y - 14 * sc} q 10 -8 18 2" fill="none" stroke="#a35b5b" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="${x + 26 * sc}" y1="${y - 8 * sc}" x2="${x + 44 * sc}" y2="${y - 12 * sc}" stroke="#f2e3c8" stroke-width="${9 * sc}" stroke-linecap="round"/>
    <circle cx="${x + 46 * sc}" cy="${y - 13 * sc}" r="${5 * sc}" fill="#f2e3c8" stroke="#a35b5b" stroke-width="2"/>
    <circle cx="${x + 47 * sc}" cy="${y - 6 * sc}" r="${5 * sc}" fill="#f2e3c8" stroke="#a35b5b" stroke-width="2"/>
  </g>`
}

/** 警用摩托（南北大道巡逻） */
function bike(el) {
  const x = el.x
  const y = el.y
  const sc = el.s || 1
  const flip = el.flip ? -1 : 1
  return `<g>
    <circle cx="${x - 22 * sc}" cy="${y}" r="${11 * sc}" fill="#3d4b5c" stroke="#22303d" stroke-width="2.6"/>
    <circle cx="${x - 22 * sc}" cy="${y}" r="${4 * sc}" fill="#8a97a5"/>
    <circle cx="${x + 22 * sc}" cy="${y}" r="${11 * sc}" fill="#3d4b5c" stroke="#22303d" stroke-width="2.6"/>
    <circle cx="${x + 22 * sc}" cy="${y}" r="${4 * sc}" fill="#8a97a5"/>
    <path d="M ${x - 22 * sc} ${y} L ${x - 8 * sc} ${y - 14 * sc} L ${x + 14 * sc} ${y - 14 * sc} L ${x + 22 * sc} ${y}" fill="none" stroke="#c0483c" stroke-width="${5 * sc}" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="${x - 14 * sc}" y="${y - 26 * sc}" width="${22 * sc}" height="${12 * sc}" rx="4" fill="#3d4b5c"/>
    <circle cx="${x - 3 * sc}" cy="${y - 34 * sc}" r="${8 * sc}" fill="${C.skin}" stroke="${C.ink}" stroke-width="2.2"/>
    <path d="M ${x - 11 * sc} ${y - 37 * sc} q 8 -9 16 0 z" fill="#2f4a7a"/>
    <rect x="${x - 12 * sc}" y="${y - 44 * sc}" width="${18 * sc}" height="${5 * sc}" rx="2" fill="#2f4a7a"/>
    <line x1="${x + 6 * sc}" y1="${y - 30 * sc}" x2="${x + 6 * sc}" y2="${y - 40 * sc}" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="${x + 6 * sc}" cy="${y - 43 * sc}" r="${3 * sc}" fill="#f2c94c" stroke="${C.ink}" stroke-width="1.6"/>
  </g>`
}

/** 南北大道（竖式道路 + 岗亭 + 位置标记） */
function road(el) {
  const x = el.x
  const y = el.y
  const h = el.h || 400
  const w = el.w || 96
  let out = `<g>`
  out += `<rect x="${x - w / 2}" y="${y}" width="${w}" height="${h}" rx="8" fill="${C.road}" stroke="#9aa3ad" stroke-width="2.4"/>`
  // 中线虚线
  let dash = ''
  for (let d = y + 14; d < y + h - 10; d += 26) {
    dash += `<line x1="${x}" y1="${d}" x2="${x}" y2="${d + 13}" stroke="#ffffff" stroke-width="3.4" opacity="0.85"/>`
  }
  out += dash
  // 北向箭头
  out += `<line x1="${x}" y1="${y + 4}" x2="${x}" y2="${y - 26}" stroke="${C.red}" stroke-width="3" stroke-linecap="round"/>`
  out += `<path d="M ${x - 7} ${y - 22} L ${x} ${y - 34} L ${x + 7} ${y - 22} Z" fill="${C.red}"/>`
  out += `<text x="${x + 16}" y="${y - 22}" font-size="19" fill="${C.red}" font-weight="700">北</text>`
  // 岗亭
  out += `<rect x="${x - w / 2 - 26}" y="${y + 6}" width="${22}" height="${26}" rx="3" fill="#f0e2c8" stroke="#a08c6a" stroke-width="2.2"/>`
  out += `<rect x="${x - w / 2 - 22}" y="${y + 12}" width="${14}" height="${12}" rx="2" fill="#cfe0f2" stroke="#a08c6a" stroke-width="1.8"/>`
  // 位置标记（marker: {t: 0..1 路程比例, label, c}）
  for (const m of el.markers || []) {
    const my = y + m.t * h
    out += `<circle cx="${x}" cy="${my.toFixed(1)}" r="${m.r || 7}" fill="${m.c || C.red}" stroke="#ffffff" stroke-width="2"/>`
    if (m.lab) {
      out += `<text x="${x + (m.labSide === 'left' ? -14 : 14)}" y="${(my + 6).toFixed(1)}" font-size="16" fill="${m.c || C.red}" text-anchor="${m.labSide === 'left' ? 'end' : 'start'}" font-weight="700">${esc(m.lab)}</text>`
    }
  }
  // 摩托车位置
  if (el.bikeAt != null) {
    const by = y + el.bikeAt * h
    out += `<g transform="translate(${x - 26} ${by}) scale(0.72)">${bike({ x: 0, y: 0, s: 1 })}</g>`
  }
  out += `</g>`
  return out
}

/** 分类树（大括号两级） */
function tree(el) {
  const x = el.x
  const y = el.y
  const rowH = el.rowH || 74
  const id = el.id || 'tree'
  let out = ''
  // 根
  out += `<text x="${x}" y="${y + rowH / 2 + 6}" font-size="19" fill="${C.ink}" font-weight="700">${esc(el.root || '有理数')}</text>`
  const bx = x + 66
  const branches = el.branches || []
  const totalH = branches.length * rowH
  // 根大括号
  out += `<path d="M ${bx} ${y + 2} Q ${bx + 12} ${y + totalH / 2} ${bx} ${y + totalH - 2}" fill="none" stroke="${C.line}" stroke-width="2.4"/>`
  branches.forEach((br, bi) => {
    const by = y + bi * rowH + rowH / 2
    out += `<text x="${bx + 20}" y="${by + 6}" font-size="18" fill="${br.c || C.ink}" font-weight="700">${esc(br.label)}</text>`
    const kids = br.children || []
    const kx = bx + 20 + textWidth(br.label, 18) + 16
    // 分支大括号
    out += `<path d="M ${kx} ${by - rowH / 2 + 8} Q ${kx + 10} ${by} ${kx} ${by + rowH / 2 - 8}" fill="none" stroke="${br.c || C.line}" stroke-width="2.2"/>`
    kids.forEach((kid, ki) => {
      const ky = by - rowH / 2 + 8 + (ki + 0.5) * ((rowH - 16) / kids.length)
      out += `<text x="${kx + 16}" y="${ky + 5}" font-size="16.5" fill="${kid.c || C.ink}">${esc(kid.label)}</text>`
      // 数字列表（支持 "250"、"-2015"、"4/2" 分数）
      let nx = kx + 16 + textWidth(kid.label, 16.5) + 12
      for (const n of kid.nums || []) {
        if (typeof n === 'string' && n.includes('/')) {
          const [nu, de] = n.split('/')
          out += `<g transform="translate(${nx} ${ky})">${frac({ x: 0, y: 0, num: nu, den: de, s: 15, c: kid.c || C.ink })}</g>`
          const fw = Math.max(textWidth(nu, 12), textWidth(de, 12)) + 14
          nx += fw + 10
        } else {
          out += `<text x="${nx}" y="${ky + 5}" font-size="16.5" fill="${kid.c || C.ink}">${esc(n)}</text>`
          nx += textWidth(n, 16.5) + 10
        }
      }
    })
  })
  return out
}

/** 软面板（带标题签） */
function panel(el) {
  const x = el.x
  const y = el.y
  const w = el.w
  const h = el.h
  const tc = el.tc || C.red
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#fffdf6" stroke="${C.line}" stroke-width="2.2" opacity="0.96"/>`
  if (el.title) {
    const tw = textWidth(el.title, 17) + 20
    out += `<rect x="${x + 14}" y="${y - 13}" width="${tw}" height="26" rx="13" fill="${tc}"/>`
    out += `<text x="${x + 14 + tw / 2}" y="${y + 5}" font-size="17" fill="#ffffff" text-anchor="middle" font-weight="700">${esc(el.title)}</text>`
  }
  return out
}

/** 对勾 / 叉 */
function mark(el) {
  const c = el.c || C.green
  if (el.kind === 'cross') {
    return `<path d="M ${el.x - 9} ${el.y - 9} L ${el.x + 9} ${el.y + 9} M ${el.x + 9} ${el.y - 9} L ${el.x - 9} ${el.y + 9}" stroke="${c}" stroke-width="3.4" stroke-linecap="round" fill="none"/>`
  }
  return `<path d="M ${el.x - 10} ${el.y + 1} L ${el.x - 2} ${el.y + 9} L ${el.x + 11} ${el.y - 9}" fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`
}

/** 对话气泡 */
function bubble(el) {
  const s = el.s || 17
  const w = el.w || textWidth(el.t, s) + 28
  const h = el.h || s + 26
  return `<g>
    <rect x="${el.x}" y="${el.y}" width="${w}" height="${h}" rx="12" fill="#ffffff" stroke="${C.line}" stroke-width="2.2"/>
    <path d="M ${el.x + 26} ${el.y + h} l 0 12 l 14 -12 z" fill="#ffffff" stroke="${C.line}" stroke-width="2.2" stroke-linejoin="round"/>
    <text x="${el.x + 14}" y="${el.y + h / 2 + s / 2 - 4}" font-size="${s}" fill="${C.ink}">${esc(el.t)}</text>
  </g>`
}

/** 大问号 */
function qmark(el) {
  const s = el.s || 44
  return `<text x="${el.x}" y="${el.y}" font-size="${s}" fill="${el.c || C.red}" font-weight="700" font-style="italic" font-family="Georgia, serif">?</text>`
}

/** 环（强调某个数） */
function ring(el) {
  return `<ellipse cx="${el.x}" cy="${el.y}" rx="${el.rx || 16}" ry="${el.ry || 20}" fill="none" stroke="${el.c || C.red}" stroke-width="${el.sw || 2.8}" opacity="0.95"/>`
}

/* ---------- 注册表 ---------- */

export const BUILDERS = {
  text,
  frac,
  eqline,
  thermo,
  numberline,
  castle,
  person,
  dog,
  energy,
  boom,
  arrow,
  cube,
  poop,
  meat,
  bike,
  road,
  tree,
  panel,
  mark,
  bubble,
  qmark,
  ring,
}

/** 构建单个元素（未注册类型抛错，便于数据校验） */
export function buildElement(el) {
  const fn = BUILDERS[el.type]
  if (!fn) throw new Error(`unknown replica element type: ${el.type}`)
  return fn(el)
}
