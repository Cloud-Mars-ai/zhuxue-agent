<script setup>
/**
 * GeometryTriangleSim — 三角形内角和动态演示。
 *
 * 交互：拖动任一顶点改变形状；三个角实时读数；内角和恒为 180°。
 * 教学点：形状可变、和不变——从"拖动中"看到定理。
 */
import { computed, ref } from 'vue'

const props = defineProps({
  params: { type: Object, required: true },
  interactive: { type: Boolean, default: true },
  model: { type: Object, default: null },
})

const W = 320
const H = 230

const vertices = ref([
  { x: 160, y: 36 },
  { x: 66, y: 196 },
  { x: 254, y: 196 },
])
const activeVertex = ref(-1)
const svgRef = ref(null)

const labels = ['A', 'B', 'C']

const angles = computed(() => {
  const [a, b, c] = vertices.value
  return [
    angleAt(a, b, c),
    angleAt(b, c, a),
    angleAt(c, a, b),
  ]
})

function angleAt(vertex, p1, p2) {
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y }
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y }
  const dot = v1.x * v2.x + v1.y * v2.y
  const cross = v1.x * v2.y - v1.y * v2.x
  const deg = (Math.atan2(cross, dot) * 180) / Math.PI
  return Math.abs(deg)
}

const angleSum = computed(() =>
  Math.round(angles.value.reduce((total, deg) => total + deg, 0)),
)

const readouts = computed(() => [
  { label: '∠A', value: `${angles.value[0].toFixed(0)}°` },
  { label: '∠B', value: `${angles.value[1].toFixed(0)}°` },
  { label: '∠C', value: `${angles.value[2].toFixed(0)}°` },
])

function svgPoint(event) {
  const svg = svgRef.value
  if (!svg) return { x: 0, y: 0 }
  const rect = svg.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * W,
    y: ((event.clientY - rect.top) / rect.height) * H,
  }
}

function onVertexDown(index, event) {
  if (!props.interactive) return
  event.preventDefault()
  activeVertex.value = index
  window.addEventListener('pointermove', onVertexMove)
  window.addEventListener('pointerup', onVertexUp)
}

function onVertexMove(event) {
  if (activeVertex.value < 0) return
  const point = svgPoint(event)
  const x = Math.min(W - 14, Math.max(14, point.x))
  const y = Math.min(H - 14, Math.max(14, point.y))
  vertices.value = vertices.value.map((vertex, index) =>
    index === activeVertex.value ? { x, y } : vertex,
  )
}

function onVertexUp() {
  activeVertex.value = -1
  window.removeEventListener('pointermove', onVertexMove)
  window.removeEventListener('pointerup', onVertexUp)
}

/** 角标签位置：顶点沿角平分线方向外移 */
function angleLabelPos(index) {
  const vertex = vertices.value[index]
  const others = [0, 1, 2].filter((i) => i !== index)
  const p1 = vertices.value[others[0]]
  const p2 = vertices.value[others[1]]
  const bx = (p1.x + p2.x) / 2 - vertex.x
  const by = (p1.y + p2.y) / 2 - vertex.y
  const norm = Math.hypot(bx, by) || 1
  const dist = Math.min(46, Math.max(28, norm * 0.42))
  return {
    x: vertex.x + (bx / norm) * dist,
    y: vertex.y + (by / norm) * dist + 4,
  }
}

/** 角弧线（顶点附近的小圆弧路径） */
function arcPath(index) {
  const vertex = vertices.value[index]
  const others = [0, 1, 2].filter((i) => i !== index)
  const p1 = vertices.value[others[0]]
  const p2 = vertices.value[others[1]]
  const r = 22
  const a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x)
  const a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x)
  const start = { x: vertex.x + Math.cos(a1) * r, y: vertex.y + Math.sin(a1) * r }
  const end = { x: vertex.x + Math.cos(a2) * r, y: vertex.y + Math.sin(a2) * r }
  const large = Math.abs(a2 - a1) > Math.PI ? 1 : 0
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`
}
</script>

<template>
  <div class="sim-triangle">
    <svg ref="svgRef" viewBox="0 0 320 230" role="img" aria-label="三角形内角和交互模型">
      <polygon
        :points="vertices.map((v) => `${v.x},${v.y}`).join(' ')"
        fill="color-mix(in srgb, var(--board-accent-soft) 60%, transparent)"
        stroke="var(--board-accent)"
        stroke-width="2"
      />
      <path
        v-for="(_, index) in vertices"
        :key="`arc-${index}`"
        :d="arcPath(index)"
        fill="none"
        stroke="var(--board-heading-alt)"
        stroke-width="1.2"
        opacity="0.75"
      />
      <text
        v-for="(angle, index) in angles"
        :key="`deg-${index}`"
        :x="angleLabelPos(index).x"
        :y="angleLabelPos(index).y"
        class="sim-angle-label"
        text-anchor="middle"
      >
        {{ angle.toFixed(0) }}°
      </text>
      <g v-for="(vertex, index) in vertices" :key="`v-${index}`">
        <circle
          :cx="vertex.x"
          :cy="vertex.y"
          r="9"
          fill="var(--board-accent)"
          stroke="var(--board-paper)"
          stroke-width="2"
          :class="{ draggable: interactive }"
          @pointerdown="onVertexDown(index, $event)"
        />
        <text
          :x="vertex.x"
          :y="vertex.y - 14"
          class="sim-vertex-label"
          text-anchor="middle"
        >
          {{ labels[index] }}
        </text>
      </g>
    </svg>

    <div class="sim-triangle-side">
      <div class="sim-readout is-sum">
        <span>内角和 ∠A + ∠B + ∠C</span>
        <strong>{{ angleSum }}°</strong>
      </div>
      <div v-for="item in readouts" :key="item.label" class="sim-readout">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
      <p class="sim-hint">拖动任意顶点改变形状——三个角一直在变，和却不变。</p>
    </div>
  </div>
</template>

<style scoped>
.sim-triangle {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.sim-triangle svg {
  width: 100%;
  height: auto;
  background: color-mix(in srgb, var(--board-paper) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--board-line) 60%, transparent);
  border-radius: 3px;
  touch-action: none;
}

.sim-triangle circle.draggable {
  cursor: grab;
}

.sim-triangle circle.draggable:active {
  cursor: grabbing;
}

.sim-triangle svg circle:focus,
.sim-triangle svg circle:focus-visible {
  outline: none;
}

.sim-angle-label {
  fill: var(--board-heading-alt);
  font-family: var(--font-mono);
  font-size: 11px;
  pointer-events: none;
}

.sim-vertex-label {
  fill: var(--board-faint);
  font-size: 10.5px;
  pointer-events: none;
}

.sim-triangle-side {
  display: grid;
  gap: 8px;
}

.sim-readout {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  background: color-mix(in srgb, var(--board-paper) 86%, transparent);
  border: 1px solid color-mix(in srgb, var(--board-line) 60%, transparent);
  border-radius: 3px;
}

.sim-readout span {
  color: var(--board-faint);
  font-size: 10.5px;
}

.sim-readout strong {
  color: var(--board-heading-alt);
  font-family: var(--font-mono);
  font-size: 13px;
}

.sim-readout.is-sum strong {
  color: var(--board-accent);
}

.sim-hint {
  margin: 0;
  color: var(--board-faint);
  font-size: 10.5px;
  line-height: 1.6;
}

@media (max-width: 880px) {
  .sim-triangle {
    grid-template-columns: 1fr;
  }
}
</style>
