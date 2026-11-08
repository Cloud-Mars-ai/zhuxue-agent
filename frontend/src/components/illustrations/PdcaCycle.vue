<script setup>
/**
 * PdcaCycle — 计划-执行-检查-改进管理闭环（管理核心场景图示）。
 * 诊断二修复：内置确定性 SVG，替代上游文生图照片。
 */
</script>

<template>
  <svg class="ill-scene ill-pdca-cycle" viewBox="0 0 320 180" role="img" aria-label="PDCA 管理闭环图示">
    <rect x="0" y="0" width="320" height="180" rx="6" fill="var(--board-paper)" />
    <!-- 顺时针流向弧线 -->
    <g fill="none" stroke="var(--board-line)" stroke-width="1.4">
      <path d="M 186 44 Q 224 52 238 74" marker-end="url(#ill-arrow)" />
      <path d="M 238 106 Q 224 128 186 136" marker-end="url(#ill-arrow)" />
      <path d="M 134 136 Q 96 128 82 106" marker-end="url(#ill-arrow)" />
      <path d="M 82 74 Q 96 52 134 44" marker-end="url(#ill-arrow)" />
    </g>
    <defs>
      <marker id="ill-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="var(--board-line)" />
      </marker>
    </defs>
    <!-- 四环 -->
    <g stroke-width="1.6">
      <circle cx="160" cy="38" r="21" fill="var(--board-accent-soft)" stroke="var(--board-accent)" />
      <circle cx="242" cy="90" r="21" fill="var(--board-positive-soft)" stroke="var(--board-positive)" />
      <circle cx="160" cy="142" r="21" fill="var(--board-warn-soft)" stroke="var(--board-warn)" />
      <circle cx="78" cy="90" r="21" fill="var(--board-negative-soft)" stroke="var(--board-negative)" />
    </g>
    <g class="ill-text" text-anchor="middle">
      <text x="160" y="36">P</text>
      <text x="160" y="50" class="ill-text-small">计划</text>
      <text x="242" y="88">D</text>
      <text x="242" y="102" class="ill-text-small">执行</text>
      <text x="160" y="140">C</text>
      <text x="160" y="154" class="ill-text-small">检查</text>
      <text x="78" y="88">A</text>
      <text x="78" y="102" class="ill-text-small">改进</text>
    </g>
    <text x="160" y="94" class="ill-text ill-text-strong" text-anchor="middle">持续改进</text>
  </svg>
</template>

<style scoped>
.ill-text {
  font-size: 14px;
  font-weight: 700;
}
.ill-text-small {
  font-size: 10px;
  font-weight: 400;
}
.ill-text-strong {
  font-size: 11px;
  fill: var(--board-heading-alt);
}
</style>
