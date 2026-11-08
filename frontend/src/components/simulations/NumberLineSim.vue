<script setup>
/**
 * NumberLineSim — 有理数数轴交互模型。
 *
 * 交互：拖动 A / B 两点；实时读数：位置、相反数、两点距离。
 * 教学点：左边的数更小；相反数关于 0 对称；距离用绝对值。
 *
 * 诊断三 F3.2（2026-11-08）：此前 Math.round + 直接赋 ref——拖动跳变、
 * 控制条滑块与模拟器状态完全脱节（拖滑块没反应）。现在：
 * - 拖动连续取值（不再取整跳变），松手补间吸附到整数刻度；
 * - watch props.params：控制条/讲稿驱动的参数变化用 tween 补间滑入；
 * - 松手时 emit('param') 回传，控制条与图形双向同步。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { tween } from '@/utils/tween.js'

const props = defineProps({
  params: { type: Object, required: true },
  interactive: { type: Boolean, default: true },
  model: { type: Object, default: null },
})

const emit = defineEmits(['param'])

const W = 320
const H = 150
const MIN = -8
const MAX = 8

const a = ref(Number(props.params.a) || 0)
const b = ref(Number(props.params.b) || 0)
const dragging = ref('')
const svgRef = ref(null)

const toX = (value) => ((value - MIN) / (MAX - MIN)) * (W - 60) + 30

const ticks = []
for (let value = MIN; value <= MAX; value += 1) ticks.push(value)

const distance = computed(() => Math.abs(a.value - b.value))
const oppositeA = computed(() => -a.value)

/** 读数格式：整数原样，小数保留一位（连续拖拽的中间态）。 */
function fmt(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

const readouts = computed(() => [
  { label: '点 A', value: `${fmt(a.value)}（相反数 ${fmt(oppositeA.value)}）` },
  { label: '点 B', value: fmt(b.value) },
  { label: '距离 |A − B|', value: fmt(distance.value) },
  {
    label: '大小关系',
    value: a.value < b.value ? 'A < B' : a.value > b.value ? 'A > B' : 'A = B',
  },
])

// ── 补间滑入（诊断三 F3.2）：参数变化不再瞬移 ──
const glides = { a: null, b: null }
const glideTargets = { a: null, b: null }

function valueOf(key) {
  return key === 'a' ? a.value : b.value
}

function glideTo(key, target, duration = 280) {
  if (!Number.isFinite(target)) return
  const clamped = Math.min(MAX, Math.max(MIN, target))
  const current = valueOf(key)
  if (clamped === current) return
  glides[key]?.cancel()
  glideTargets[key] = clamped
  glides[key] = tween({
    from: current,
    to: clamped,
    duration,
    easing: 'easeOutCubic',
    onUpdate: (value) => {
      if (key === 'a') a.value = value
      else b.value = value
    },
    onComplete: () => {
      glideTargets[key] = null
    },
  })
}

watch(
  () => [props.params.a, props.params.b],
  (next) => {
    const keys = ['a', 'b']
    keys.forEach((key, index) => {
      const target = Number(next[index])
      if (!Number.isFinite(target)) return
      if (glideTargets[key] === target) return // 已在滑向该目标，避免双补间
      glideTo(key, target, 280)
    })
  },
)

onBeforeUnmount(() => {
  glides.a?.cancel()
  glides.b?.cancel()
})

function svgX(event) {
  const svg = svgRef.value
  if (!svg) return 0
  const rect = svg.getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  const raw = MIN + ratio * (MAX - MIN)
  // 连续取值：拖动过程不取整，跟手不跳变
  return Math.min(MAX, Math.max(MIN, raw))
}

function onPointDown(which, event) {
  if (!props.interactive) return
  event.preventDefault()
  dragging.value = which
  window.addEventListener('pointermove', onPointMove)
  window.addEventListener('pointerup', onPointUp)
}

function onPointMove(event) {
  if (!dragging.value) return
  const value = svgX(event)
  if (dragging.value === 'a') a.value = value
  else b.value = value
}

function onPointUp() {
  const released = dragging.value
  dragging.value = ''
  window.removeEventListener('pointermove', onPointMove)
  window.removeEventListener('pointerup', onPointUp)
  if (!released) return
  // 松手吸附到整数刻度（与控制条 step=1 一致）：补间滑入，不是瞬移
  const snapped = {
    a: Math.round(a.value),
    b: Math.round(b.value),
  }
  glideTo('a', snapped.a, 180)
  glideTo('b', snapped.b, 180)
  // 回传控制条（此时 glideTargets 已占位，watch 不会重复起补间）
  emit('param', 'a', snapped.a)
  emit('param', 'b', snapped.b)
}
</script>

<template>
  <div class="sim-numberline">
    <svg ref="svgRef" viewBox="0 0 320 150" role="img" aria-label="有理数数轴交互模型">
      <!-- 正负区域底色 -->
      <rect :x="toX(0)" y="52" :width="toX(MAX) - toX(0)" height="16"
        fill="color-mix(in srgb, var(--board-accent-soft) 45%, transparent)" />
      <rect :x="toX(MIN)" y="52" :width="toX(0) - toX(MIN)" height="16"
        fill="color-mix(in srgb, var(--board-note) 70%, transparent)" />

      <!-- 主轴 -->
      <line x1="20" y1="60" x2="300" y2="60" stroke="var(--board-heading-alt)" stroke-width="1.4" />
      <polygon points="300,60 292,56 292,64" fill="var(--board-heading-alt)" />

      <!-- 刻度 -->
      <g v-for="tick in ticks" :key="`t-${tick}`">
        <line
          :x1="toX(tick)" :y1="54" :x2="toX(tick)" :y2="66"
          :stroke="tick === 0 ? 'var(--board-accent)' : 'var(--board-line)'"
          stroke-width="1.2"
        />
        <text
          :x="toX(tick)" :y="84"
          class="sim-tick-label"
          :class="{ zero: tick === 0 }"
          text-anchor="middle"
        >
          {{ tick }}
        </text>
      </g>
      <text :x="toX(0) + 5" :y="40" class="sim-tick-label zero">0</text>

      <!-- A / B 点 -->
      <g v-for="(point, key) in { a, b }" :key="key">
        <circle
          :cx="toX(point.value)"
          cy="60"
          r="8"
          :fill="key === 'a' ? 'var(--board-accent)' : '#d9534f'"
          stroke="var(--board-paper)"
          stroke-width="2"
          :class="{ draggable: interactive }"
          @pointerdown="onPointDown(key, $event)"
        />
        <text
          :x="toX(point.value)"
          :y="key === 'a' ? 34 : 108"
          class="sim-point-label"
          :class="key === 'a' ? 'is-a' : 'is-b'"
          text-anchor="middle"
        >
          {{ key.toUpperCase() }}
        </text>
      </g>

      <!-- 距离标注 -->
      <line
        :x1="toX(Math.min(a, b))" :y1="126"
        :x2="toX(Math.max(a, b))" :y2="126"
        stroke="var(--board-heading-alt)"
        stroke-width="1.2"
      />
      <text
        :x="(toX(a) + toX(b)) / 2" :y="122"
        class="sim-distance-label"
        text-anchor="middle"
      >
        |{{ fmt(a) }} − {{ fmt(b) }}| = {{ fmt(distance) }}
      </text>
    </svg>

    <div class="sim-numberline-side">
      <div v-for="item in readouts" :key="item.label" class="sim-readout">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
      <p class="sim-hint">拖动 A、B：越往右数越大；到 0 距离相等的两点互为相反数。</p>
    </div>
  </div>
</template>

<style scoped>
.sim-numberline {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.sim-numberline svg {
  width: 100%;
  height: auto;
  background: color-mix(in srgb, var(--board-paper) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--board-line) 60%, transparent);
  border-radius: 3px;
  touch-action: none;
}

.sim-numberline circle.draggable {
  cursor: grab;
}

.sim-numberline circle.draggable:active {
  cursor: grabbing;
}

.sim-numberline svg circle:focus {
  outline: none;
}

.sim-tick-label {
  fill: var(--board-faint);
  font-family: var(--font-mono);
  font-size: 10px;
}

.sim-tick-label.zero {
  fill: var(--board-accent);
  font-weight: 700;
}

.sim-point-label {
  font-size: 12px;
  font-weight: 700;
}

.sim-point-label.is-a {
  fill: var(--board-accent);
}

.sim-point-label.is-b {
  fill: #d9534f;
}

.sim-distance-label {
  fill: var(--board-heading-alt);
  font-family: var(--font-mono);
  font-size: 10.5px;
}

.sim-numberline-side {
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
  font-size: 12px;
}

.sim-hint {
  margin: 0;
  color: var(--board-faint);
  font-size: 10.5px;
  line-height: 1.6;
}

@media (max-width: 880px) {
  .sim-numberline {
    grid-template-columns: 1fr;
  }
}
</style>
