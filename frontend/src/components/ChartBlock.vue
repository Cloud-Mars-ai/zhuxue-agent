<script setup>
/**
 * ChartBlock — 数据图表渲染（诊断一：OpenMAIC chart 画布元素不再降级为表格）。
 *
 * 契约：block = { kind: 'bar'|'line'|'pie', labels[], series[{name, values[]}] }
 * （board.js 归一化保证 labels ≥2、每序列 ≥2 个有限数值）。
 * 纯 SVG 确定性渲染，无第三方图表库（package.json 零新增依赖）。
 */
import { computed } from 'vue'

const props = defineProps({
  block: { type: Object, required: true },
})

const W = 640
const H = 250
const M = { left: 54, right: 20, top: 24, bottom: 44 }
const X0 = M.left
const X1 = W - M.right
const Y0 = H - M.bottom // 基线
const Y1 = M.top // 顶
const SERIES_COLORS = ['var(--board-accent)', 'var(--board-current)', 'var(--board-warn)']

const labels = computed(() => (Array.isArray(props.block.labels) ? props.block.labels : []))
const series = computed(() => (Array.isArray(props.block.series) ? props.block.series : []))
const kind = computed(() => props.block.kind || 'bar')

const maxValue = computed(() => {
  const values = series.value.flatMap((item) => item.values || [])
  const max = Math.max(0, ...values)
  return max > 0 ? max : 1
})

function y(value) {
  const ratio = Math.max(0, Math.min(1, value / maxValue.value))
  return Y0 - ratio * (Y0 - Y1)
}

function color(index) {
  return SERIES_COLORS[index % SERIES_COLORS.length]
}

function shorten(value, max = 8) {
  const text = String(value ?? '')
  return text.length > max ? `${text.slice(0, max)}…` : text
}

/** 柱状：每个 label 一个分组，组内按 series 并排。 */
const band = computed(() => (labels.value.length ? (X1 - X0) / labels.value.length : 0))
const barWidth = computed(() => Math.max(6, (band.value * 0.72) / Math.max(1, series.value.length)))

function barX(labelIndex, seriesIndex) {
  const groupStart = X0 + band.value * labelIndex + band.value * 0.14
  return groupStart + barWidth.value * seriesIndex
}

/** 折线：每序列一条多段线 + 端点。 */
function linePoints(item) {
  return (item.values || [])
    .map((value, index) => {
      const x = labels.value.length > 1
        ? X0 + ((X1 - X0) * index) / (labels.value.length - 1)
        : (X0 + X1) / 2
      return `${x.toFixed(1)},${y(value).toFixed(1)}`
    })
    .join(' ')
}

/** 饼图：单序列占比，负值按 0 计；总和为 0 时均分避免退化。 */
const pieTotal = computed(() => {
  const values = (series.value[0]?.values || []).map((value) => Math.max(0, value))
  const total = values.reduce((sum, value) => sum + value, 0)
  return total > 0 ? total : values.length || 1
})

const CX = W / 2
const CY = H / 2 - 4
const R = 84

function pieSlices() {
  const values = (series.value[0]?.values || []).map((value) => Math.max(0, value))
  const equal = values.reduce((sum, value) => sum + value, 0) <= 0
  let angle = -Math.PI / 2
  return values.map((value, index) => {
    const share = equal ? 1 / values.length : value / pieTotal.value
    const a0 = angle
    const a1 = angle + share * Math.PI * 2
    angle = a1
    const large = a1 - a0 > Math.PI ? 1 : 0
    const x0 = CX + R * Math.cos(a0)
    const y0 = CY + R * Math.sin(a0)
    const x1 = CX + R * Math.cos(a1)
    const y1 = CY + R * Math.sin(a1)
    const path = equal && values.length === 1
      ? `M ${CX} ${CY - R} A ${R} ${R} 0 1 1 ${CX - 0.01} ${CY - R} Z`
      : `M ${CX} ${CY} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`
    const percent = Math.round(share * 100)
    return { index, path, percent, label: labels.value[index] || `第${index + 1}项`, value }
  })
}

const gridValues = computed(() => {
  const steps = 4
  return Array.from({ length: steps + 1 }, (_, index) => (maxValue.value * index) / steps)
})
</script>

<template>
  <svg class="chart-block" :class="`is-${kind}`" viewBox="0 0 640 250" role="img" :aria-label="block.title || '数据图表'">
    <!-- 网格与刻度（bar / line 共用） -->
    <template v-if="kind !== 'pie'">
      <g v-for="value in gridValues" :key="`grid-${value}`">
        <line :x1="X0" :y1="y(value)" :x2="X1" :y2="y(value)" stroke="var(--board-line)" stroke-width="0.6" opacity="0.28" />
        <text :x="X0 - 8" :y="y(value) + 4" class="chart-axis" text-anchor="end">{{ Math.round(value * 100) / 100 }}</text>
      </g>
      <line :x1="X0" :y1="Y0" :x2="X1" :y2="Y0" stroke="var(--board-line)" stroke-width="1.4" />
      <line :x1="X0" :y1="Y1" :x2="X0" :y2="Y0" stroke="var(--board-line)" stroke-width="1.4" />
    </template>

    <!-- 柱状 -->
    <template v-if="kind === 'bar'">
      <g v-for="(label, labelIndex) in labels" :key="`bar-${labelIndex}`">
        <rect
          v-for="(item, seriesIndex) in series"
          :key="`${item.name}-${seriesIndex}`"
          :x="barX(labelIndex, seriesIndex)"
          :y="y(item.values?.[labelIndex] ?? 0)"
          :width="barWidth"
          :height="Math.max(0, Y0 - y(item.values?.[labelIndex] ?? 0))"
          :fill="color(seriesIndex)"
          rx="2"
        />
        <text :x="X0 + band * labelIndex + band / 2" :y="Y0 + 18" class="chart-axis" text-anchor="middle">
          {{ shorten(label) }}
        </text>
      </g>
    </template>

    <!-- 折线 -->
    <template v-else-if="kind === 'line'">
      <polyline
        v-for="(item, seriesIndex) in series"
        :key="`line-${item.name}`"
        :points="linePoints(item)"
        fill="none"
        :stroke="color(seriesIndex)"
        stroke-width="2.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle
        v-for="(item, seriesIndex) in series"
        :key="`dot-${item.name}`"
        :cx="X1"
        :cy="y(item.values?.[item.values.length - 1] ?? 0)"
        r="4"
        :fill="color(seriesIndex)"
        stroke="var(--board-paper)"
        stroke-width="1.4"
      />
      <text
        v-for="(label, labelIndex) in labels"
        :key="`lx-${labelIndex}`"
        :x="labels.length > 1 ? X0 + ((X1 - X0) * labelIndex) / (labels.length - 1) : (X0 + X1) / 2"
        :y="Y0 + 18"
        class="chart-axis"
        text-anchor="middle"
      >
        {{ shorten(label) }}
      </text>
    </template>

    <!-- 饼图 -->
    <template v-else>
      <path
        v-for="slice in pieSlices()"
        :key="`pie-${slice.index}`"
        :d="slice.path"
        :fill="color(slice.index)"
        stroke="var(--board-paper)"
        stroke-width="2"
      />
      <g v-for="slice in pieSlices()" :key="`pl-${slice.index}`">
        <rect :x="470" :y="34 + slice.index * 26" width="12" height="12" rx="2" :fill="color(slice.index)" />
        <text :x="490" :y="44 + slice.index * 26" class="chart-legend">
          {{ shorten(slice.label, 10) }} {{ slice.percent }}%
        </text>
      </g>
    </template>

    <!-- 图例（bar / line） -->
    <g v-if="kind !== 'pie'">
      <g v-for="(item, seriesIndex) in series" :key="`lg-${item.name}`">
        <rect :x="X0 + seriesIndex * 150" :y="6" width="12" height="12" rx="2" :fill="color(seriesIndex)" />
        <text :x="X0 + 20 + seriesIndex * 150" :y="16" class="chart-legend">{{ shorten(item.name, 12) }}</text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.chart-block {
  display: block;
  width: 100%;
  height: auto;
  background: var(--board-paper);
  border: 1px solid color-mix(in srgb, var(--board-line) 55%, transparent);
  border-radius: 4px;
}

.chart-axis {
  fill: var(--board-faint);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
}

.chart-legend {
  fill: var(--board-heading-alt);
  font-size: 11.5px;
}
</style>
