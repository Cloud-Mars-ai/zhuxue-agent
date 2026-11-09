<script setup>
/**
 * IllustrationStage — 场景图示渲染分派（诊断二：媒体通道修复的渲染层；
 * 2026-11-09 学科画像：注册 timeline/map-region/pipeline/blueprint）。
 *
 * 契约：block.scene 必须来自 utils/illustrationScenes.js 注册表
 * （board.js 归一化时已校验）；这里只做 id → 组件分派。
 * 未注册 id 不渲染（归一化已拦截，双保险），绝不回退到外链图片。
 */
import BalanceScale from './BalanceScale.vue'
import Blueprint from './Blueprint.vue'
import CitySkyline from './CitySkyline.vue'
import GrowthChart from './GrowthChart.vue'
import MapRegion from './MapRegion.vue'
import OrgChart from './OrgChart.vue'
import PdcaCycle from './PdcaCycle.vue'
import Pipeline from './Pipeline.vue'
import RocketLaunch from './RocketLaunch.vue'
import SquareRoot from './SquareRoot.vue'
import SupplyDemand from './SupplyDemand.vue'
import Timeline from './Timeline.vue'

defineProps({
  scene: { type: String, required: true },
})

const SCENE_COMPONENTS = {
  'balance-scale': BalanceScale,
  'blueprint': Blueprint,
  'city-skyline': CitySkyline,
  'growth-chart': GrowthChart,
  'map-region': MapRegion,
  'org-chart': OrgChart,
  'pdca-cycle': PdcaCycle,
  'pipeline': Pipeline,
  'rocket-launch': RocketLaunch,
  'square-root': SquareRoot,
  'supply-demand': SupplyDemand,
  timeline: Timeline,
}
</script>

<template>
  <div class="ill-stage" :data-scene="scene">
    <component :is="SCENE_COMPONENTS[scene]" v-if="SCENE_COMPONENTS[scene]" />
  </div>
</template>

<style scoped>
.ill-stage {
  margin-top: 8px;
  border: 1px solid color-mix(in srgb, var(--board-line) 55%, transparent);
  border-radius: 4px;
  overflow: hidden;
  background: var(--board-paper);
}
</style>
