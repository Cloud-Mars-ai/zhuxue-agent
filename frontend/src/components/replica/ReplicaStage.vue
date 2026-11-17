<template>
  <svg
    class="rp-stage-svg"
    viewBox="0 0 1000 560"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
  >
    <g
      v-for="item in rendered"
      :key="item.el.id"
      class="rp-el"
      :class="item.state"
      v-html="item.svg"
    ></g>
  </svg>
</template>

<script setup>
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { buildElement } from './elements'

const props = defineProps({
  scene: { type: Array, default: () => [] },
  /** stepKey 变化即重新触发内部 SMIL 动画（用于重播本章） */
  stepKey: { type: [String, Number], default: '' },
})

const EXIT_MS = 380
const rendered = ref([])
let exitTimer = 0

function toItem(el, state) {
  let svg = ''
  try {
    svg = buildElement(el)
  } catch (error) {
    svg = `<text x="${el.x || 40}" y="${el.y || 40}" font-size="16" fill="#c0483c">[${el.type} 渲染失败]</text>`
  }
  return { el, svg, state }
}

function syncScene(next) {
  const nextIds = new Set(next.map((el) => el.id))
  const prevIds = new Set(rendered.value.map((item) => item.el.id))
  // 退场：标记后延时移除
  const exiting = rendered.value.filter((item) => !nextIds.has(item.el.id))
  // 持续存在：数据更新则重算 svg（不动画）
  const staying = rendered.value
    .filter((item) => nextIds.has(item.el.id))
    .map((item) => {
      const fresh = next.find((el) => el.id === item.el.id)
      const svg = JSON.stringify(fresh) === JSON.stringify(item.el) ? item.svg : toItem(fresh, 'stay').svg
      return { el: fresh, svg, state: 'stay' }
    })
  // 新入场
  const entering = next.filter((el) => !prevIds.has(el.id)).map((el) => toItem(el, 'in'))
  rendered.value = [...staying, ...entering, ...exiting.map((item) => ({ ...item, state: 'out' }))]
  if (exiting.length) {
    window.clearTimeout(exitTimer)
    exitTimer = window.setTimeout(() => {
      rendered.value = rendered.value.filter((item) => item.state !== 'out')
    }, EXIT_MS)
  }
}

watch(
  () => props.scene,
  (next) => syncScene(next || []),
  { immediate: true, deep: false },
)

onBeforeUnmount(() => window.clearTimeout(exitTimer))
</script>

<style scoped>
.rp-stage-svg {
  display: block;
  width: 100%;
  height: 100%;
}

.rp-el {
  transform-box: fill-box;
  transform-origin: center;
}

.rp-el.in {
  animation: rp-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.rp-el.out {
  animation: rp-out 0.38s ease-in both;
  pointer-events: none;
}

@keyframes rp-pop {
  from {
    opacity: 0;
    transform: scale(0.82) translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes rp-out {
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rp-el.in,
  .rp-el.out {
    animation-duration: 0.01s;
  }
}
</style>
