<script setup>
/**
 * SimulationStage — 板书交互模型容器。
 *
 * 职责：按 block.model 分派到确定性模型组件；按模型声明的 params 渲染统一
 * 参数控制条；展示观察任务清单与回指概念；把交互状态以受控事件抛出
 * （不引入自由 HTML / 脚本，与 board.js 白名单契约一致）。
 */
import { computed, ref, watch } from 'vue'
import { simulationModel } from '@/utils/knowledgeVisualization'
import CircularMotionSim from './CircularMotionSim.vue'
import GeometryTriangleSim from './GeometryTriangleSim.vue'
import LinearFunctionSim from './LinearFunctionSim.vue'
import NumberLineSim from './NumberLineSim.vue'
import FractionPartsSim from './FractionPartsSim.vue'

const props = defineProps({
  block: { type: Object, required: true },
  interactive: { type: Boolean, default: true },
})

const emit = defineEmits(['observe'])

const MODEL_COMPONENTS = {
  'circular-motion': CircularMotionSim,
  'geometry-triangle': GeometryTriangleSim,
  'linear-function': LinearFunctionSim,
  'number-line': NumberLineSim,
  'fraction-parts': FractionPartsSim,
}

const model = computed(() => simulationModel(props.block.model))
const component = computed(() => MODEL_COMPONENTS[props.block.model] || null)

const params = ref({ ...(props.block.params || {}) })
const seenTasks = ref(new Set())

watch(
  () => props.block,
  () => {
    params.value = { ...(props.block.params || {}) }
    seenTasks.value = new Set()
  },
)

function updateParam(key, value) {
  params.value = { ...params.value, [key]: value }
}

function toggleTask(task, index) {
  const next = new Set(seenTasks.value)
  if (next.has(index)) next.delete(index)
  else next.add(index)
  seenTasks.value = next
  emit('observe', { task, done: next.has(index), seen: [...next] })
}
</script>

<template>
  <div v-if="component" class="sim-stage" :data-model="block.model">
    <div class="sim-stage-head">
      <div>
        <span class="sim-stage-label">交互模型</span>
        <strong v-if="block.linkConcept" class="sim-stage-link">
          对照概念：{{ block.linkConcept }}
        </strong>
      </div>
      <span v-if="model" class="sim-stage-model">{{ model.label }}</span>
    </div>

    <div class="sim-stage-canvas">
      <component
        :is="component"
        :params="params"
        :interactive="interactive"
        :model="model"
        @param="updateParam"
      />
    </div>

    <div v-if="model?.params?.length" class="sim-controls">
      <label v-for="param in model.params" :key="param.key" class="sim-slider">
        <span class="sim-slider-label">{{ param.label }}</span>
        <input
          type="range"
          :min="param.min"
          :max="param.max"
          :step="param.step"
          :value="params[param.key]"
          :disabled="!interactive"
          :aria-label="param.label"
          @input="updateParam(param.key, Number($event.target.value))"
        />
        <output class="sim-slider-value">
          {{ params[param.key] }}{{ param.unit ? ` ${param.unit}` : '' }}
        </output>
      </label>
    </div>

    <ol v-if="block.observe?.length" class="sim-observe">
      <li v-for="(task, index) in block.observe" :key="task">
        <button
          type="button"
          :class="{ done: seenTasks.has(index) }"
          :disabled="!interactive"
          :aria-pressed="seenTasks.has(index)"
          @click="toggleTask(task, index)"
        >
          <span class="sim-observe-box">{{ seenTasks.has(index) ? '✓' : '' }}</span>
          <span class="sim-observe-text">{{ task }}</span>
        </button>
      </li>
    </ol>

    <p v-if="block.caption" class="sim-caption">{{ block.caption }}</p>
  </div>
</template>

<style scoped>
.sim-stage {
  padding: 14px 16px 16px;
  background: color-mix(in srgb, var(--board-accent-soft) 42%, var(--board-paper));
  border: 1px solid var(--board-line);
  border-radius: 4px;
}

.sim-stage-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
}

.sim-stage-label {
  color: var(--board-faint);
  font-size: 10.5px;
  letter-spacing: 0.08em;
}

.sim-stage-link {
  margin-left: 10px;
  color: var(--board-heading-alt);
  font-size: 12.5px;
}

.sim-stage-model {
  color: var(--board-faint);
  font-size: 11px;
}

.sim-stage-canvas {
  margin-top: 10px;
}

.sim-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 22px;
  margin-top: 10px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--board-paper) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--board-line) 70%, transparent);
  border-radius: 3px;
}

.sim-slider {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
}

.sim-slider-label {
  color: var(--board-heading-alt);
  white-space: nowrap;
}

.sim-slider input[type='range'] {
  width: 110px;
  accent-color: var(--board-accent);
}

.sim-slider input[type='range']:disabled {
  opacity: 0.45;
}

.sim-slider-value {
  min-width: 52px;
  color: var(--board-ink);
  font-family: var(--font-mono);
  font-size: 11px;
}

.sim-observe {
  display: grid;
  gap: 6px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.sim-observe button {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 9px;
  padding: 7px 10px;
  color: var(--board-ink);
  background: color-mix(in srgb, var(--board-paper) 84%, transparent);
  border: 1px solid color-mix(in srgb, var(--board-line) 70%, transparent);
  border-radius: 3px;
  font: inherit;
  font-size: 12.5px;
  line-height: 1.6;
  text-align: left;
  cursor: pointer;
}

.sim-observe button:hover:not(:disabled) {
  border-color: var(--board-accent);
}

.sim-observe button:disabled {
  cursor: default;
  opacity: 0.6;
}

.sim-observe button.done {
  border-color: var(--board-accent);
  background: var(--board-accent-soft);
}

.sim-observe-box {
  flex: none;
  width: 15px;
  height: 15px;
  display: grid;
  place-items: center;
  margin-top: 2px;
  color: var(--board-paper);
  background: transparent;
  border: 1px solid var(--board-accent);
  border-radius: 3px;
  font-size: 10px;
}

.sim-observe button.done .sim-observe-box {
  background: var(--board-accent);
}

.sim-caption {
  margin: 10px 0 0;
  color: var(--board-faint);
  font-size: 11px;
  line-height: 1.6;
}

@media (max-width: 880px) {
  .sim-slider input[type='range'] {
    width: 84px;
  }
}
</style>
