<script setup>
/**
 * FractionPartsSim — 分数与比例交互模型。
 *
 * 交互：分子 / 分母滑块（容器渲染）实时改涂色；读数：小数与百分数。
 * 教学点：分母是"总份数"，分子是"取几份"；等值分数涂色面积相同。
 */
import { computed } from 'vue'

const props = defineProps({
  params: { type: Object, required: true },
  interactive: { type: Boolean, default: true },
  model: { type: Object, default: null },
})

const W = 320
const H = 150
const BAR_X = 16
const BAR_Y = 40
const BAR_W = W - 32
const BAR_H = 56

const numerator = computed(() => Math.round(Number(props.params.numerator) || 1))
const denominator = computed(() => Math.round(Number(props.params.denominator) || 2))

const cellWidth = computed(() => BAR_W / denominator.value)
const value = computed(() => numerator.value / denominator.value)

const readouts = computed(() => [
  { label: '分数', value: `${numerator.value}/${denominator.value}` },
  { label: '小数', value: value.value.toFixed(3) },
  { label: '百分数', value: `${(value.value * 100).toFixed(1)}%` },
])

const cells = computed(() =>
  Array.from({ length: denominator.value }, (_, index) => ({
    index,
    filled: index < numerator.value,
  })),
)
</script>

<template>
  <div class="sim-fraction">
    <svg viewBox="0 0 320 150" role="img" aria-label="分数与比例交互模型">
      <!-- 分数条 -->
      <g>
        <rect
          v-for="cell in cells"
          :key="cell.index"
          :x="BAR_X + cell.index * cellWidth"
          :y="BAR_Y"
          :width="cellWidth"
          :height="BAR_H"
          :fill="cell.filled ? 'var(--board-accent)' : 'transparent'"
          :fill-opacity="cell.filled ? 0.85 : 0"
          stroke="var(--board-heading-alt)"
          stroke-width="1.2"
        />
      </g>

      <!-- 总份数标注 -->
      <text :x="BAR_X" :y="BAR_Y - 10" class="sim-axis-label">
        平均分成 {{ denominator }} 份
      </text>
      <text :x="BAR_X + BAR_W" :y="BAR_Y - 10" class="sim-axis-label" text-anchor="end">
        取其中 {{ numerator }} 份
      </text>

      <!-- 分数等式 -->
      <text :x="W / 2" :y="BAR_Y + BAR_H + 34" class="sim-fraction-label" text-anchor="middle">
        {{ numerator }}/{{ denominator }} = {{ value.toFixed(2) }} = {{ (value * 100).toFixed(0) }}%
      </text>
    </svg>

    <div class="sim-fraction-side">
      <div v-for="item in readouts" :key="item.label" class="sim-readout">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
      <p class="sim-hint">分子分母同时乘 2，涂色面积不变——这就是等值分数。</p>
    </div>
  </div>
</template>

<style scoped>
.sim-fraction {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.sim-fraction svg {
  width: 100%;
  height: auto;
  background: color-mix(in srgb, var(--board-paper) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--board-line) 60%, transparent);
  border-radius: 3px;
}

.sim-axis-label {
  fill: var(--board-faint);
  font-size: 10.5px;
}

.sim-fraction-label {
  fill: var(--board-heading-alt);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
}

.sim-fraction-side {
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
  .sim-fraction {
    grid-template-columns: 1fr;
  }
}
</style>
