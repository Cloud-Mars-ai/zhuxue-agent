<template>
  <svg
    ref="svgRef"
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
      :data-el-id="item.el.id"
      v-html="item.svg"
    ></g>
  </svg>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { buildElement } from './elements'

const props = defineProps({
  scene: { type: Array, default: () => [] },
  /** stepKey 变化即重新触发内部 SMIL 动画（用于重播本章） */
  stepKey: { type: [String, Number], default: '' },
})

const EXIT_MS = 380
const rendered = ref([])
const svgRef = ref(null)
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
  const changedIds = []
  const staying = rendered.value
    .filter((item) => nextIds.has(item.el.id))
    .map((item) => {
      const fresh = next.find((el) => el.id === item.el.id)
      const same = JSON.stringify(fresh) === JSON.stringify(item.el)
      if (!same) changedIds.push(fresh.id)
      const svg = same ? item.svg : toItem(fresh, 'stay').svg
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
  syncQa(changedIds)
}

/** QA 揭晓：内容变化的题目重置揭晓状态；为新按钮绑定原生点击（阻止冒泡，避免误推进步骤） */
function syncQa(changedIds) {
  nextTick(() => {
    const svg = svgRef.value
    if (!svg) return
    for (const id of changedIds) {
      const g = svg.querySelector(`g[data-el-id="${id}"]`)
      if (g) g.removeAttribute('data-revealed')
    }
    svg.querySelectorAll('.rp-qa-btn').forEach((btn) => {
      if (btn.__qaBound) return
      btn.__qaBound = true
      const toggle = (e) => {
        e.stopPropagation()
        e.preventDefault()
        const g = btn.closest('.rp-el')
        if (!g) return
        if (g.getAttribute('data-revealed') === '1') g.removeAttribute('data-revealed')
        else g.setAttribute('data-revealed', '1')
      }
      btn.addEventListener('click', toggle)
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') toggle(e)
      })
    })
  })
}

watch(
  () => props.scene,
  (next) => syncScene(next || []),
  { immediate: true, deep: false },
)

onMounted(() => syncQa([]))
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

/* —— 快问快答：先问后答，点击揭晓（v-html 内容需 :deep 穿透作用域） —— */
:deep(.rp-qa-btn) {
  cursor: pointer;
}

:deep(.rp-qa-btn):hover rect {
  filter: brightness(1.07);
}

:deep(.rp-qa-btn:focus-visible) {
  outline: none;
}

:deep(.rp-qa-btn:focus-visible) rect {
  stroke: #2a2721;
  stroke-width: 2.4;
}

:deep(.rp-qa-ans) {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.35s ease, transform 0.35s ease;
  pointer-events: none;
}

.rp-el[data-revealed] :deep(.rp-qa-ans) {
  opacity: 1;
  transform: none;
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
