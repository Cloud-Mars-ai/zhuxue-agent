<script setup>
/**
 * TimelineOrderSim — 历史事件时序推理（2026-11-09 学科画像新增）。
 *
 * 交互形态（人文历史的"叙事论辩"范式）：学生按时间顺序点选事件卡，
 * 点错给即时反馈；排完显示因果链与年份顺序的对照。
 * 数据来自注册表 data.events（block 契约不变，组件从 model 读取），
 * 因此文科课程无需文生图也能获得"可操作"的时序教具。
 */
import { computed, ref } from 'vue'

const props = defineProps({
  params: { type: Object, required: true },
  interactive: { type: Boolean, default: true },
  model: { type: Object, default: null },
})

const events = computed(() => {
  const list = props.model?.data?.events
  return Array.isArray(list) && list.length ? list : []
})
// 正确顺序 = 年份升序（确定性，无需模型）
const sorted = computed(() => events.value.slice().sort((a, b) => a.year - b.year))
const picked = ref([]) // 已点选（按点击顺序）的事件 label
const wrongFlash = ref('')

const nextExpected = computed(() => sorted.value[picked.value.length]?.label || '')
const done = computed(() => picked.value.length === sorted.value.length && sorted.value.length > 0)
const correctCount = computed(
  () => picked.value.filter((label, index) => sorted.value[index]?.label === label).length,
)

function pick(event) {
  if (!props.interactive || done.value) return
  if (picked.value.includes(event.label)) return
  if (event.label === nextExpected.value) {
    picked.value = [...picked.value, event.label]
    wrongFlash.value = ''
  } else {
    wrongFlash.value = event.label
    setTimeout(() => {
      if (wrongFlash.value === event.label) wrongFlash.value = ''
    }, 600)
  }
}

function reset() {
  picked.value = []
  wrongFlash.value = ''
}

const progress = computed(() => `${correctCount.value}/${sorted.value.length}`)
</script>

<template>
  <div class="sim-timeline-order">
    <svg viewBox="0 0 320 190" role="img" aria-label="历史事件时序推理交互">
      <!-- 目标时间轴（正确顺序，完成后显形） -->
      <line x1="24" y1="30" x2="296" y2="30" stroke="var(--board-line)" stroke-width="1.4" />
      <text x="24" y="20" class="sim-axis-title">时间轴</text>
      <g v-for="(event, index) in sorted" :key="`s-${event.label}`">
        <circle
          :cx="52 + index * 68"
          :cy="30"
          r="4"
          :fill="index < picked.length ? 'var(--board-accent)' : 'var(--board-faint)'"
          stroke="var(--board-paper)"
          stroke-width="1.2"
        />
        <text
          :x="52 + index * 68"
          :y="52"
          class="sim-axis-year"
          :class="{ 'is-done': index < picked.length }"
          text-anchor="middle"
        >
          {{ index < picked.length ? event.year : '?' }}
        </text>
      </g>

      <!-- 待排序事件卡（洗乱展示：按原始顺序） -->
      <g v-for="(event, index) in events" :key="`e-${event.label}`">
        <g
          class="sim-event-card"
          :class="{
            'is-picked': picked.includes(event.label),
            'is-wrong': wrongFlash === event.label,
          }"
          :transform="`translate(${16 + (index % 2) * 150}, ${74 + Math.floor(index / 2) * 44})`"
          role="button"
          tabindex="0"
          @click="pick(event)"
          @keydown.enter="pick(event)"
        >
          <rect width="138" height="34" rx="4" />
          <text x="10" y="21" class="sim-event-label">{{ event.label }}</text>
          <text x="128" y="21" class="sim-event-year" text-anchor="end">
            {{ picked.includes(event.label) ? event.year : '?' }}
          </text>
        </g>
      </g>

      <!-- 反馈区 -->
      <text x="160" y="184" class="sim-feedback" :class="{ 'is-done': done }" text-anchor="middle">
        {{ done ? `排好了：${picked.join(' → ')}` : `下一个该选哪个？（已排对 ${progress}）` }}
      </text>
    </svg>

    <div class="sim-timeline-side">
      <div class="sim-readout">
        <span>已排对</span>
        <strong>{{ progress }}</strong>
      </div>
      <p class="sim-hint">
        按事情发生的<b>先后</b>点选卡片：点错会闪红，不会计入。排完对照上方时间轴，看年份顺序和你的判断是否一致。
      </p>
      <button v-if="picked.length" type="button" class="sim-reset" @click="reset">重排一次</button>
    </div>
  </div>
</template>

<style scoped>
.sim-timeline-order {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.sim-timeline-order svg {
  width: 100%;
  height: auto;
  background: color-mix(in srgb, var(--board-paper) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--board-line) 60%, transparent);
  border-radius: 3px;
  touch-action: none;
}

.sim-axis-title {
  fill: var(--board-accent);
  font-weight: 700;
  font-size: 11px;
}

.sim-axis-year {
  fill: var(--board-faint);
  font-family: var(--font-mono);
  font-size: 10px;
}

.sim-axis-year.is-done {
  fill: var(--board-accent);
  font-weight: 700;
}

.sim-event-card rect {
  fill: var(--board-paper);
  stroke: var(--board-line);
  stroke-width: 1.2;
  cursor: pointer;
  transition: fill 0.15s ease, stroke 0.15s ease;
}

.sim-event-card:hover rect {
  fill: color-mix(in srgb, var(--board-accent-soft) 60%, var(--board-paper));
}

.sim-event-card.is-picked rect {
  fill: color-mix(in srgb, var(--board-accent-soft) 80%, var(--board-paper));
  stroke: var(--board-accent);
}

.sim-event-card.is-wrong rect {
  fill: color-mix(in srgb, var(--board-warn) 22%, var(--board-paper));
  stroke: var(--board-warn);
}

.sim-event-label {
  fill: var(--board-heading-alt);
  font-size: 11px;
  font-weight: 600;
  pointer-events: none;
}

.sim-event-year {
  fill: var(--board-faint);
  font-family: var(--font-mono);
  font-size: 10px;
  pointer-events: none;
}

.sim-feedback {
  fill: var(--board-faint);
  font-size: 10.5px;
}

.sim-feedback.is-done {
  fill: var(--board-accent);
  font-weight: 700;
}

.sim-timeline-side {
  display: grid;
  gap: 8px;
  justify-items: start;
}

.sim-readout {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
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

.sim-reset {
  padding: 5px 12px;
  border: 1px solid var(--board-line);
  border-radius: 3px;
  background: var(--board-paper);
  color: var(--board-heading-alt);
  font-size: 11px;
  cursor: pointer;
}

.sim-reset:hover {
  border-color: var(--board-accent);
  color: var(--board-accent);
}

@media (max-width: 880px) {
  .sim-timeline-order {
    grid-template-columns: 1fr;
  }
}
</style>
