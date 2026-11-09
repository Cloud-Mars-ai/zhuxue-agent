<script setup>
/**
 * PipelineFlowSim — 流水线流程控制（2026-11-09 学科画像新增）。
 *
 * 工程技术「设计迭代」范式的参数型交互：调节来料速率与缓冲容量，
 * 观察产能、瓶颈工序与堆积位置的联动。教学点：产能由瓶颈工序决定，
 * 缓冲只能平滑波动、不能突破瓶颈。
 */
import { computed } from 'vue'

const props = defineProps({
  params: { type: Object, required: true },
  interactive: { type: Boolean, default: true },
  model: { type: Object, default: null },
})

const stages = computed(() => {
  const list = props.model?.data?.stages
  return Array.isArray(list) && list.length ? list : []
})

const rate = computed(() => {
  const value = Math.round(Number(props.params.rate))
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 60
})
const buffer = computed(() => {
  const value = Math.round(Number(props.params.buffer))
  return Number.isFinite(value) ? Math.min(50, Math.max(0, value)) : 20
})

// 产能 = min(来料, 各工序容量)；瓶颈 = 首个低于来料的工序（都低于则最小容量）
const capacityLimit = computed(() =>
  stages.value.length ? Math.min(...stages.value.map((stage) => stage.capacity)) : rate.value,
)
const throughput = computed(() => Math.min(rate.value, capacityLimit.value))
const bottleneck = computed(() => {
  const first = stages.value.find((stage) => stage.capacity < rate.value)
  return first ? first.label : '无（来料不足）'
})
// 堆积量：来料超过瓶颈产能的部分先填缓冲，溢出按比例可视化
const backlog = computed(() => {
  const excess = Math.max(0, rate.value - throughput.value)
  return Math.min(excess, buffer.value)
})
const overflow = computed(() => Math.max(0, rate.value - throughput.value - buffer.value))

const readouts = computed(() => [
  { label: '实际产能', value: `${throughput.value} 件/分` },
  { label: '瓶颈工序', value: bottleneck.value },
  { label: '缓冲堆积', value: `${backlog.value} 件` },
])

// 布局：三个工序横向排列，缓冲罐在工序之间上方
const BOX = { w: 82, h: 52, gap: 24, x0: 20, y: 88 }
function stageX(index) {
  return BOX.x0 + index * (BOX.w + BOX.gap)
}

// 工序负载率（相对自身容量）→ 颜色
function loadRatio(stage) {
  const ratio = rate.value / Math.max(1, stage.capacity)
  return Math.min(1.4, ratio)
}
function stageFill(stage) {
  const ratio = loadRatio(stage)
  if (ratio > 1) return 'var(--board-warn)'
  if (ratio > 0.75) return 'var(--board-current)'
  return 'var(--board-accent)'
}
</script>

<template>
  <div class="sim-pipeline-flow">
    <svg viewBox="0 0 320 200" role="img" aria-label="流水线流程控制交互">
      <!-- 来料 -->
      <g>
        <rect x="14" y="104" width="46" height="30" rx="4" fill="var(--board-accent-soft)" stroke="var(--board-line)" stroke-width="1.2" />
        <text x="37" y="123" class="sim-in-label" text-anchor="middle">来料 {{ rate }}</text>
      </g>

      <!-- 工序 -->
      <g v-for="(stage, index) in stages" :key="stage.key">
        <rect
          :x="stageX(index)"
          :y="BOX.y"
          :width="BOX.w"
          :height="BOX.h"
          rx="4"
          fill="color-mix(in srgb, var(--board-paper) 88%, transparent)"
          :stroke="stageFill(stage)"
          stroke-width="1.8"
        />
        <text :x="stageX(index) + BOX.w / 2" :y="BOX.y + 20" class="sim-stage-label" text-anchor="middle">
          {{ stage.label }}
        </text>
        <text :x="stageX(index) + BOX.w / 2" :y="BOX.y + 38" class="sim-stage-cap" text-anchor="middle">
          产能 {{ stage.capacity }}
        </text>
        <!-- 负载条 -->
        <rect
          :x="stageX(index) + 10"
          :y="BOX.y + BOX.h - 10"
          :width="BOX.w - 20"
          height="4"
          rx="2"
          fill="color-mix(in srgb, var(--board-line) 40%, transparent)"
        />
        <rect
          :x="stageX(index) + 10"
          :y="BOX.y + BOX.h - 10"
          :width="Math.max(0, (BOX.w - 20) * Math.min(1, loadRatio(stage)))"
          height="4"
          rx="2"
          :fill="stageFill(stage)"
        />
        <!-- 流向箭头 -->
        <polygon
          v-if="index < stages.length - 1"
          :points="`${stageX(index) + BOX.w + 4},${BOX.y + BOX.h / 2 - 5} ${stageX(index) + BOX.w + 16},${BOX.y + BOX.h / 2} ${stageX(index) + BOX.w + 4},${BOX.y + BOX.h / 2 + 5}`"
          fill="var(--board-line)"
        />
      </g>

      <!-- 输出 -->
      <g>
        <rect :x="stageX(stages.length - 1) + BOX.w + 18" y="104" width="46" height="30" rx="4" fill="var(--board-accent-soft)" stroke="var(--board-line)" stroke-width="1.2" />
        <text :x="stageX(stages.length - 1) + BOX.w + 41" y="123" class="sim-out-label" text-anchor="middle">
          出 {{ throughput }}
        </text>
      </g>

      <!-- 缓冲罐（堆积可视化） -->
      <g>
        <rect x="200" y="30" width="56" height="40" rx="4" fill="color-mix(in srgb, var(--board-paper) 88%, transparent)" stroke="var(--board-line)" stroke-width="1.2" />
        <rect
          :x="202"
          :y="68 - 36 * (buffer.value / 50)"
          width="52"
          :height="36 * (buffer.value / 50)"
          rx="2"
          fill="color-mix(in srgb, var(--board-current) 30%, transparent)"
        />
        <text x="228" y="24" class="sim-buffer-label" text-anchor="middle">缓冲 {{ buffer }}</text>
        <text v-if="overflow > 0" x="228" y="86" class="sim-overflow" text-anchor="middle">
          溢出 {{ overflow }}
        </text>
      </g>

      <!-- 瓶颈警示 -->
      <text x="160" y="176" class="sim-feedback" :class="{ 'is-alarm': overflow > 0 }" text-anchor="middle">
        {{ overflow > 0 ? `缓冲已满，${bottleneck} 前开始堵塞` : bottleneck }}
      </text>
    </svg>

    <div class="sim-pipeline-side">
      <div v-for="item in readouts" :key="item.label" class="sim-readout">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
      <p class="sim-hint">
        拖动<b>来料速率</b>与<b>缓冲容量</b>：产能永远追着最慢的工序（瓶颈）走；缓冲只能临时囤料，救不了瓶颈。
      </p>
    </div>
  </div>
</template>

<style scoped>
.sim-pipeline-flow {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.sim-pipeline-flow svg {
  width: 100%;
  height: auto;
  background: color-mix(in srgb, var(--board-paper) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--board-line) 60%, transparent);
  border-radius: 3px;
  touch-action: none;
}

.sim-stage-label {
  fill: var(--board-heading-alt);
  font-size: 11px;
  font-weight: 700;
}

.sim-stage-cap,
.sim-in-label,
.sim-out-label,
.sim-buffer-label {
  fill: var(--board-faint);
  font-family: var(--font-mono);
  font-size: 10px;
}

.sim-overflow {
  fill: var(--board-warn);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
}

.sim-feedback {
  fill: var(--board-accent);
  font-size: 11px;
  font-weight: 600;
}

.sim-feedback.is-alarm {
  fill: var(--board-warn);
}

.sim-pipeline-side {
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

.sim-hint b {
  color: var(--board-accent);
}

@media (max-width: 880px) {
  .sim-pipeline-flow {
    grid-template-columns: 1fr;
  }
}
</style>
