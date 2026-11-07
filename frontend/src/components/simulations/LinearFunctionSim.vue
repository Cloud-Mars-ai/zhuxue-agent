<script setup>
/**
 * LinearFunctionSim — 一次函数 y = kx + b 图像动态演示。
 *
 * 交互：k / b 滑块（由容器渲染）实时改线；显示与 y 轴交点、斜率三角、
 * k = 0 时的常函数提示。
 */
import { computed } from 'vue'

const props = defineProps({
  params: { type: Object, required: true },
  interactive: { type: Boolean, default: true },
  model: { type: Object, default: null },
})

const W = 320
const H = 240
const CX = W / 2
const CY = H / 2
const SCALE = 22 // 每单位 22px

const k = computed(() => Number(props.params.k) || 0)
const b = computed(() => Number(props.params.b) || 0)

const toX = (x) => CX + x * SCALE
const toY = (y) => CY - y * SCALE

const line = computed(() => {
  const x1 = -CX / SCALE
  const x2 = CX / SCALE
  return {
    x1: toX(x1),
    y1: toY(k.value * x1 + b.value),
    x2: toX(x2),
    y2: toY(k.value * x2 + b.value),
  }
})

const yIntercept = computed(() => ({ x: toX(0), y: toY(b.value) }))

/** 斜率三角：从 (0, b) 沿 x 正方向 1 单位、沿 y 方向 k 单位的直角边 */
const slopeTriangle = computed(() => {
  const start = { x: toX(0), y: toY(b.value) }
  const corner = { x: toX(1), y: toY(b.value) }
  const end = { x: toX(1), y: toY(b.value + k.value) }
  return { start, corner, end }
})

const isFlat = computed(() => Math.abs(k.value) < 0.001)

const readouts = computed(() => [
  {
    label: '函数式',
    value: `y = ${k.value}x${b.value >= 0 ? ' + ' : ' - '}${Math.abs(b.value)}`,
  },
  { label: 'k（倾斜程度）', value: isFlat.value ? '0（水平线）' : `${k.value}` },
  { label: 'b（与 y 轴交点）', value: `(0, ${b.value})` },
])
</script>

<template>
  <div class="sim-linear">
    <svg viewBox="0 0 320 240" role="img" aria-label="一次函数图像交互模型">
      <!-- 网格 -->
      <g stroke="var(--board-line)" stroke-width="0.5" opacity="0.5">
        <line v-for="gx in [-4, -3, -2, -1, 1, 2, 3, 4]" :key="`gx-${gx}`"
          :x1="toX(gx)" :y1="8" :x2="toX(gx)" :y2="H - 8" />
        <line v-for="gy in [-4, -3, -2, -1, 1, 2, 3, 4]" :key="`gy-${gy}`"
          :x1="8" :y1="toY(gy)" :x2="W - 8" :y2="toY(gy)" />
      </g>
      <!-- 坐标轴 -->
      <line :x1="8" :y1="CY" :x2="W - 8" :y2="CY" stroke="var(--board-heading-alt)" stroke-width="1.2" />
      <line :x1="CX" :y1="8" :x2="CX" :y2="H - 8" stroke="var(--board-heading-alt)" stroke-width="1.2" />
      <text :x="W - 16" :y="CY - 6" class="sim-axis-label">x</text>
      <text :x="CX + 6" :y="18" class="sim-axis-label">y</text>

      <!-- 斜率三角 -->
      <polygon
        v-if="!isFlat"
        :points="`${slopeTriangle.start.x},${slopeTriangle.start.y} ${slopeTriangle.corner.x},${slopeTriangle.corner.y} ${slopeTriangle.end.x},${slopeTriangle.end.y}`"
        fill="color-mix(in srgb, var(--board-accent-soft) 55%, transparent)"
        stroke="var(--board-accent)"
        stroke-width="1"
        stroke-dasharray="3 3"
      />

      <!-- 函数线 -->
      <line
        :x1="line.x1"
        :y1="line.y1"
        :x2="line.x2"
        :y2="line.y2"
        :stroke="isFlat ? 'var(--board-heading-alt)' : 'var(--board-accent)'"
        stroke-width="2.6"
      />

      <!-- y 轴交点 -->
      <circle :cx="yIntercept.x" :cy="yIntercept.y" r="4.5" fill="var(--board-accent)" />
      <text :x="yIntercept.x + 8" :y="yIntercept.y + (b.value >= 0 ? -6 : 14)" class="sim-axis-label">
        b={{ b.value }}
      </text>

      <text v-if="isFlat" :x="14" :y="H - 14" class="sim-flat-note">k = 0：y 恒为 {{ b.value }}（常函数）</text>
    </svg>

    <div class="sim-linear-side">
      <div v-for="item in readouts" :key="item.label" class="sim-readout">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
      <p class="sim-hint">只调 k 看倾斜，只调 b 看平移；dashed 三角的竖边长度就是 |k|。</p>
    </div>
  </div>
</template>

<style scoped>
.sim-linear {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.sim-linear svg {
  width: 100%;
  height: auto;
  background: color-mix(in srgb, var(--board-paper) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--board-line) 60%, transparent);
  border-radius: 3px;
}

.sim-axis-label {
  fill: var(--board-faint);
  font-family: var(--font-mono);
  font-size: 10px;
}

.sim-flat-note {
  fill: var(--board-heading-alt);
  font-size: 11px;
}

.sim-linear-side {
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
  font-size: 12.5px;
}

.sim-hint {
  margin: 0;
  color: var(--board-faint);
  font-size: 10.5px;
  line-height: 1.6;
}

@media (max-width: 880px) {
  .sim-linear {
    grid-template-columns: 1fr;
  }
}
</style>
