<script setup>
/**
 * OrgChart — 组织结构与汇报关系（层级 / 部门场景图示）。
 * 诊断二修复：内置确定性 SVG，替代上游文生图照片。
 */
</script>

<template>
  <svg class="ill-scene ill-org-chart" viewBox="0 0 320 180" role="img" aria-label="组织结构图">
    <rect x="0" y="0" width="320" height="180" rx="6" fill="var(--board-paper)" />
    <g stroke="var(--board-line)" stroke-width="1.3" fill="none">
      <line x1="160" y1="48" x2="160" y2="64" />
      <line x1="86" y1="64" x2="234" y2="64" />
      <line x1="86" y1="64" x2="86" y2="80" />
      <line x1="160" y1="64" x2="160" y2="80" />
      <line x1="234" y1="64" x2="234" y2="80" />
      <line x1="86" y1="110" x2="86" y2="124" />
      <line x1="60" y1="124" x2="112" y2="124" />
      <line x1="60" y1="124" x2="60" y2="138" />
      <line x1="112" y1="124" x2="112" y2="138" />
    </g>
    <g stroke-width="1.4">
      <rect x="124" y="20" width="72" height="28" rx="4" fill="var(--board-accent-soft)" stroke="var(--board-accent)" />
      <rect x="50" y="80" width="72" height="30" rx="4" fill="var(--board-paper)" stroke="var(--board-line)" />
      <rect x="124" y="80" width="72" height="30" rx="4" fill="var(--board-paper)" stroke="var(--board-line)" />
      <rect x="198" y="80" width="72" height="30" rx="4" fill="var(--board-paper)" stroke="var(--board-line)" />
      <rect x="32" y="138" width="56" height="24" rx="4" fill="var(--board-note)" stroke="var(--board-line)" />
      <rect x="84" y="138" width="56" height="24" rx="4" fill="var(--board-note)" stroke="var(--board-line)" />
    </g>
    <g class="ill-text" text-anchor="middle">
      <text x="160" y="38">总经理</text>
      <text x="86" y="99">市场部</text>
      <text x="160" y="99">运营部</text>
      <text x="234" y="99">财务部</text>
      <text x="60" y="154" class="ill-text-small">华东区</text>
      <text x="112" y="154" class="ill-text-small">华南区</text>
    </g>
  </svg>
</template>

<style scoped>
.ill-text {
  font-size: 11.5px;
  font-weight: 600;
}
.ill-text-small {
  font-size: 10px;
  font-weight: 400;
}
</style>
