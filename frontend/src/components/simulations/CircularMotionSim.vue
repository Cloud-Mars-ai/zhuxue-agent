<script setup>
/**
 * CircularMotionSim — 圆周运动与向心力可拖拽交互模型。
 *
 * 物理映射：F = m·v²/r（向心力），T = 2πr/v（周期）。
 * 交互：拖动小球改变相位（松手继续转）；"松手飞出"演示惯性（沿切线匀速直线）；
 * 参数 r / v / m 由容器滑块控制，模型内只改角度与播放态。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  params: { type: Object, required: true },
  interactive: { type: Boolean, default: true },
  model: { type: Object, default: null },
})

const CX = 160
const CY = 120
/** 模型半径单位 40–160 映射为画布半径 24–92px */
function renderRadius(radius) {
  const t = (Number(radius) - 40) / (160 - 40)
  return 24 + Math.min(1, Math.max(0, t)) * 68
}

/** 箭头头部三角 */
function arrowHead(from, to) {
  const angle = Math.atan2(to.y2 - from.y, to.x2 - from.x)
  const size = 7
  const a1 = angle + Math.PI - 0.42
  const a2 = angle + Math.PI + 0.42
  return [
    `${to.x2},${to.y2}`,
    `${to.x2 + Math.cos(a1) * size},${to.y2 + Math.sin(a1) * size}`,
    `${to.x2 + Math.cos(a2) * size},${to.y2 + Math.sin(a2) * size}`,
  ].join(' ')
}

const angle = ref(0)
const released = ref(false)
const releasePos = ref({ x: 0, y: 0 })
const releaseVel = ref({ x: 0, y: 0 })
const releaseTravel = ref(0)
const dragging = ref(false)
const svgRef = ref(null)
let raf = 0
let lastTime = 0

const r = computed(() => renderRadius(props.params.radius))
const v = computed(() => Number(props.params.speed) || 1)
const m = computed(() => Number(props.params.mass) || 1)

const force = computed(() => (m.value * v.value * v.value) / Math.max(0.5, r.value / 50))
const period = computed(() => (2 * Math.PI * r.value) / (v.value * 20))

const ball = computed(() => {
  if (released.value) {
    return {
      x: releasePos.value.x + releaseVel.value.x * releaseTravel.value,
      y: releasePos.value.y + releaseVel.value.y * releaseTravel.value,
    }
  }
  return {
    x: CX + r.value * Math.cos(angle.value),
    y: CY + r.value * Math.sin(angle.value),
  }
})

/** 速度箭头：切线方向；向心力箭头：指向圆心，长度按 F 归一化 */
const velocityArrow = computed(() => {
  const dir = released.value
    ? { x: releaseVel.value.x, y: releaseVel.value.y }
    : { x: -Math.sin(angle.value), y: Math.cos(angle.value) }
  const len = 26 + Math.min(1, v.value / 10) * 30
  const norm = Math.hypot(dir.x, dir.y) || 1
  return {
    x2: ball.value.x + (dir.x / norm) * len,
    y2: ball.value.y + (dir.y / norm) * len,
  }
})

const forceArrow = computed(() => {
  const dx = CX - ball.value.x
  const dy = CY - ball.value.y
  const dist = Math.hypot(dx, dy) || 1
  const len = 14 + Math.min(1, force.value / 12) * 34
  return {
    x2: ball.value.x + (dx / dist) * len,
    y2: ball.value.y + (dy / dist) * len,
  }
})

const readouts = computed(() => [
  { label: '向心力 F = m·v²/r', value: `${force.value.toFixed(1)} N` },
  { label: '周期 T = 2πr/v', value: `${period.value.toFixed(1)} s` },
])

function tick(time) {
  if (!lastTime) lastTime = time
  const dt = Math.min(0.05, (time - lastTime) / 1000)
  lastTime = time
  if (!dragging.value && !released.value) {
    // 角速度 ∝ v / r（开尔文-亥姆霍兹式直觉：小半径转得快）
    angle.value += (v.value / Math.max(0.5, r.value / 50)) * dt * 1.6
  }
  if (released.value) {
    releaseTravel.value += dt * (60 + v.value * 26)
    if (releaseTravel.value > 460) resetRelease()
  }
  raf = requestAnimationFrame(tick)
}

function resetRelease() {
  released.value = false
  releaseTravel.value = 0
}

function releaseBall() {
  if (!props.interactive || released.value) return
  released.value = true
  releaseTravel.value = 0
  releasePos.value = { ...ball.value }
  const speed = 60 + v.value * 26
  releaseVel.value = {
    x: -Math.sin(angle.value) * speed,
    y: Math.cos(angle.value) * speed,
  }
}

function svgPoint(event) {
  const svg = svgRef.value
  if (!svg) return { x: CX, y: CY }
  const rect = svg.getBoundingClientRect()
  const vb = svg.viewBox.baseVal
  return {
    x: ((event.clientX - rect.left) / rect.width) * vb.width,
    y: ((event.clientY - rect.top) / rect.height) * vb.height,
  }
}

function onBallDown(event) {
  if (!props.interactive) return
  event.preventDefault()
  dragging.value = true
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', onDragUp)
}

function onDragMove(event) {
  if (!dragging.value) return
  const point = svgPoint(event)
  angle.value = Math.atan2(point.y - CY, point.x - CX)
}

function onDragUp() {
  dragging.value = false
  window.removeEventListener('pointermove', onDragMove)
  window.removeEventListener('pointerup', onDragUp)
}

onMounted(() => {
  raf = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  onDragUp()
})
</script>

<template>
  <div class="sim-circular">
    <svg ref="svgRef" viewBox="0 0 320 240" role="img" aria-label="圆周运动与向心力交互模型">
      <!-- 轨迹圆 -->
      <circle
        :cx="CX"
        :cy="CY"
        :r="r"
        fill="none"
        stroke="var(--board-line)"
        stroke-dasharray="4 5"
      />
      <!-- 圆心 -->
      <circle :cx="CX" :cy="CY" r="3" fill="var(--board-faint)" />
      <text :x="CX + 6" :y="CY + 14" class="sim-axis-label">圆心</text>

      <!-- 半径线 -->
      <line
        :x1="CX"
        :y1="CY"
        :x2="ball.x"
        :y2="ball.y"
        stroke="var(--board-accent)"
        stroke-width="1"
        opacity="0.55"
      />
      <text :x="(CX + ball.x) / 2 + 4" :y="(CY + ball.y) / 2 - 4" class="sim-axis-label">
        r={{ params.radius }}
      </text>

      <!-- 速度箭头（切线） -->
      <line
        :x1="ball.x"
        :y1="ball.y"
        :x2="velocityArrow.x2"
        :y2="velocityArrow.y2"
        stroke="#2f9e6e"
        stroke-width="2.4"
      />
      <circle
        :cx="velocityArrow.x2"
        :cy="velocityArrow.y2"
        r="2.6"
        fill="#2f9e6e"
      />
      <text
        :x="velocityArrow.x2 + (velocityArrow.x2 >= ball.x ? 4 : -30)"
        :y="velocityArrow.y2 + (velocityArrow.y2 >= ball.y ? 14 : -6)"
        class="sim-arrow-label is-velocity"
      >
        v={{ params.speed }}
      </text>

      <!-- 向心力箭头（指向圆心） -->
      <line
        :x1="ball.x"
        :y1="ball.y"
        :x2="forceArrow.x2"
        :y2="forceArrow.y2"
        stroke="#d9534f"
        stroke-width="2.8"
      />
      <polygon
        :points="arrowHead(ball, forceArrow)"
        fill="#d9534f"
      />
      <text
        :x="forceArrow.x2 + (forceArrow.x2 >= ball.x ? 6 : -46)"
        :y="forceArrow.y2 + 16"
        class="sim-arrow-label is-force"
      >
        F={{ force.toFixed(1) }}N
      </text>

      <!-- 小球（可拖拽） -->
      <circle
        :cx="ball.x"
        :cy="ball.y"
        r="11"
        fill="var(--board-accent)"
        stroke="var(--board-paper)"
        stroke-width="2"
        :class="{ draggable: interactive }"
        @pointerdown="onBallDown"
      />
      <text :x="ball.x" :y="ball.y + 4" class="sim-ball-label">m{{ params.mass }}</text>
    </svg>

    <div class="sim-circular-side">
      <div v-for="item in readouts" :key="item.label" class="sim-readout">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
      <button type="button" :disabled="!interactive || released" @click="releaseBall">
        {{ released ? '小球已飞出…' : '松手，看小球沿切线飞出' }}
      </button>
      <p class="sim-hint">拖动小球可改变它的位置；松手前它被绳子拉着做圆周运动。</p>
    </div>
  </div>
</template>

<style scoped>
.sim-circular {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.sim-circular svg {
  width: 100%;
  height: auto;
  background: color-mix(in srgb, var(--board-paper) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--board-line) 60%, transparent);
  border-radius: 3px;
  touch-action: none;
}

.sim-circular circle.draggable {
  cursor: grab;
}

.sim-circular circle.draggable:active {
  cursor: grabbing;
}

.sim-circular svg circle:focus {
  outline: none;
}

.sim-axis-label {
  fill: var(--board-faint);
  font-size: 9.5px;
}

.sim-arrow-label {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
}

.sim-arrow-label.is-velocity {
  fill: #2f9e6e;
}

.sim-arrow-label.is-force {
  fill: #d9534f;
}

.sim-ball-label {
  fill: var(--board-paper);
  font-family: var(--font-mono);
  font-size: 9px;
  text-anchor: middle;
  pointer-events: none;
}

.sim-circular-side {
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

.sim-circular-side button {
  padding: 8px 12px;
  color: var(--board-heading-alt);
  background: var(--board-paper);
  border: 1px solid var(--board-accent);
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
}

.sim-circular-side button:hover:not(:disabled) {
  background: var(--board-accent-soft);
}

.sim-circular-side button:disabled {
  cursor: default;
  opacity: 0.55;
}

.sim-hint {
  margin: 0;
  color: var(--board-faint);
  font-size: 10.5px;
  line-height: 1.6;
}

@media (max-width: 880px) {
  .sim-circular {
    grid-template-columns: 1fr;
  }
}
</style>
