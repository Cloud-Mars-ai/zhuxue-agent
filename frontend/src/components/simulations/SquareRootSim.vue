<script setup>
/**
 * SquareRootSim — 平方根面积模型（2026-11-08 诊断一新增，对齐 OpenMAIC
 * 视频 s_098「平方根探索」交互页：滑块 a → a×a 面积方格 → 数轴标记）。
 *
 * 交互：拖动控制条边长 a；方格阵列与读数实时重算。
 * 教学点：a×a = a²；√(a²) = a（a≥0）；完全平方数才能开出整数根。
 */
import { computed } from 'vue'

const props = defineProps({
  params: { type: Object, required: true },
  interactive: { type: Boolean, default: true },
  model: { type: Object, default: null },
})

const GRID = { x: 16, y: 16, size: 118 }
const LINE = { x0: 16, x1: 300, y: 172, max: 150 }

const a = computed(() => {
  const value = Math.round(Number(props.params.a) || 5)
  return Math.min(12, Math.max(1, value))
})
const area = computed(() => a.value * a.value)
const cell = computed(() => GRID.size / a.value)

const cells = computed(() =>
  Array.from({ length: area.value }, (_, index) => {
    const row = Math.floor(index / a.value)
    const col = index % a.value
    return {
      key: index,
      x: GRID.x + col * cell.value,
      y: GRID.y + row * cell.value,
    }
  }),
)

const readouts = computed(() => [
  { label: '边长 a', value: `${a.value}` },
  { label: '面积 a²', value: `${area.value}` },
  { label: '√(面积)', value: `${a.value}` },
])

const lineTicks = [0, 50, 100, 150]
function lineX(value) {
  const ratio = Math.min(1, Math.max(0, value / LINE.max))
  return LINE.x0 + ratio * (LINE.x1 - LINE.x0)
}
</script>

<template>
  <div class="sim-square-root">
    <svg viewBox="0 0 320 190" role="img" aria-label="平方根面积模型交互">
      <!-- a×a 方格阵列 -->
      <g>
        <rect
          v-for="item in cells"
          :key="item.key"
          :x="item.x"
          :y="item.y"
          :width="cell"
          :height="cell"
          fill="color-mix(in srgb, var(--board-accent-soft) 70%, transparent)"
          stroke="var(--board-accent)"
          stroke-width="0.6"
        />
      </g>
      <rect
        :x="GRID.x"
        :y="GRID.y"
        :width="GRID.size"
        :height="GRID.size"
        fill="none"
        stroke="var(--board-accent)"
        stroke-width="1.8"
      />
      <!-- 边长与面积标注 -->
      <text :x="GRID.x + GRID.size / 2" :y="GRID.y - 5" class="sim-side-label" text-anchor="middle">
        a = {{ a }}
      </text>
      <text
        :x="GRID.x + GRID.size / 2"
        :y="GRID.y + GRID.size / 2 + 5"
        class="sim-area-label"
        text-anchor="middle"
      >
        {{ area }}
      </text>

      <!-- 读数 -->
      <g class="sim-root-readouts">
        <g v-for="(item, index) in readouts" :key="item.label">
          <text :x="152" :y="30 + index * 34" class="sim-readout-label">{{ item.label }}</text>
          <text :x="304" :y="30 + index * 34" class="sim-readout-value" text-anchor="end">
            {{ item.value }}
          </text>
          <line x1="152" :y1="38 + index * 34" x2="304" :y2="38 + index * 34" class="sim-readout-rule" />
        </g>
      </g>

      <!-- 数轴：标记 a 与 a² -->
      <line :x1="LINE.x0" :y1="LINE.y" :x2="LINE.x1" :y2="LINE.y" stroke="var(--board-line)" stroke-width="1.3" />
      <g v-for="tick in lineTicks" :key="`t-${tick}`">
        <line
          :x1="lineX(tick)"
          :y1="LINE.y - 4"
          :x2="lineX(tick)"
          :y2="LINE.y + 4"
          stroke="var(--board-line)"
          stroke-width="1.1"
        />
        <text :x="lineX(tick)" :y="LINE.y + 16" class="sim-tick-label" text-anchor="middle">{{ tick }}</text>
      </g>
      <circle :cx="lineX(a)" :cy="LINE.y" r="4" fill="var(--board-accent)" stroke="var(--board-paper)" stroke-width="1.4" />
      <text :x="lineX(a)" :y="LINE.y - 8" class="sim-marker-label is-a" text-anchor="middle">a={{ a }}</text>
      <circle :cx="lineX(area)" :cy="LINE.y" r="4" fill="var(--board-current)" stroke="var(--board-paper)" stroke-width="1.4" />
      <text :x="lineX(area)" :y="LINE.y - 8" class="sim-marker-label is-area" text-anchor="middle">a²={{ area }}</text>
    </svg>

    <div class="sim-square-root-side">
      <div v-for="item in readouts" :key="item.label" class="sim-readout">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
      <p class="sim-hint">拖动边长 a：方格总数就是 a²；把 a² 移回数轴，找它的平方根。</p>
    </div>
  </div>
</template>

<style scoped>
.sim-square-root {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.sim-square-root svg {
  width: 100%;
  height: auto;
  background: color-mix(in srgb, var(--board-paper) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--board-line) 60%, transparent);
  border-radius: 3px;
  touch-action: none;
}

.sim-side-label,
.sim-area-label {
  font-family: var(--font-mono);
  font-weight: 700;
}

.sim-side-label {
  fill: var(--board-accent);
  font-size: 11px;
}

.sim-area-label {
  fill: var(--board-heading-alt);
  font-size: 16px;
}

.sim-readout-label {
  fill: var(--board-faint);
  font-size: 10.5px;
}

.sim-readout-value {
  fill: var(--board-heading-alt);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
}

.sim-readout-rule {
  stroke: color-mix(in srgb, var(--board-line) 40%, transparent);
  stroke-width: 0.6;
}

.sim-tick-label {
  fill: var(--board-faint);
  font-family: var(--font-mono);
  font-size: 9.5px;
}

.sim-marker-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
}

.sim-marker-label.is-a {
  fill: var(--board-accent);
}

.sim-marker-label.is-area {
  fill: var(--board-current);
}

.sim-square-root-side {
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
  .sim-square-root {
    grid-template-columns: 1fr;
  }
}
</style>
