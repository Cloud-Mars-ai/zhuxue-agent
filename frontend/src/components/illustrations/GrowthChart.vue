<script setup>
/**
 * GrowthChart — 增长曲线与趋势（业务增长 / 复利场景图示）。
 * 诊断二修复：内置确定性 SVG，替代上游文生图照片。
 */
</script>

<template>
  <svg class="ill-scene ill-growth-chart" viewBox="0 0 320 180" role="img" aria-label="增长曲线图示">
    <rect x="0" y="0" width="320" height="180" rx="6" fill="var(--board-paper)" />
    <!-- 坐标轴 -->
    <line x1="40" y1="26" x2="40" y2="150" stroke="var(--board-line)" stroke-width="1.6" />
    <line x1="40" y1="150" x2="300" y2="150" stroke="var(--board-line)" stroke-width="1.6" />
    <polygon points="40,20 36,30 44,30" fill="var(--board-line)" />
    <polygon points="306,150 296,146 296,154" fill="var(--board-line)" />
    <text x="30" y="36" class="ill-text" text-anchor="end">指标</text>
    <text x="292" y="166" class="ill-text" text-anchor="end">时间</text>
    <!-- 面积 + 折线 -->
    <polygon points="56,140 96,124 136,100 176,78 216,54 258,34 258,150 56,150"
      fill="color-mix(in srgb, var(--board-accent-soft) 70%, transparent)" />
    <polyline points="56,140 96,124 136,100 176,78 216,54 258,34"
      fill="none" stroke="var(--board-accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
    <!-- 趋势延申虚线 -->
    <line x1="258" y1="34" x2="292" y2="20" stroke="var(--board-faint)" stroke-width="1.6" stroke-dasharray="5 4" />
    <g fill="var(--board-paper)" stroke="var(--board-accent)" stroke-width="2">
      <circle cx="56" cy="140" r="3.4" />
      <circle cx="96" cy="124" r="3.4" />
      <circle cx="136" cy="100" r="3.4" />
      <circle cx="176" cy="78" r="3.4" />
      <circle cx="216" cy="54" r="3.4" />
    </g>
    <circle cx="258" cy="34" r="5" fill="var(--board-current)" stroke="var(--board-paper)" stroke-width="1.6" />
    <text x="258" y="24" class="ill-text ill-text-current" text-anchor="middle">拐点</text>
  </svg>
</template>

<style scoped>
.ill-text-current {
  fill: var(--board-current);
  font-weight: 700;
}
</style>
