<script setup>
/**
 * SupplyDemand — 供需曲线与市场均衡（经济学核心场景图示）。
 * 诊断二修复：内置确定性 SVG，替代上游文生图照片。
 */
</script>

<template>
  <svg class="ill-scene ill-supply-demand" viewBox="0 0 320 180" role="img" aria-label="供需曲线与市场均衡图示">
    <rect x="0" y="0" width="320" height="180" rx="6" fill="var(--board-paper)" />
    <!-- 坐标轴 -->
    <line x1="40" y1="26" x2="40" y2="150" stroke="var(--board-line)" stroke-width="1.6" />
    <line x1="40" y1="150" x2="300" y2="150" stroke="var(--board-line)" stroke-width="1.6" />
    <polygon points="40,20 36,30 44,30" fill="var(--board-line)" />
    <polygon points="306,150 296,146 296,154" fill="var(--board-line)" />
    <text x="30" y="36" class="ill-text" text-anchor="end">价格</text>
    <text x="292" y="166" class="ill-text" text-anchor="end">数量</text>
    <!-- 需求曲线（向下） -->
    <line x1="62" y1="44" x2="262" y2="136" stroke="var(--board-accent)" stroke-width="2.4" stroke-linecap="round" />
    <text x="266" y="146" class="ill-text ill-text-accent">需求 D</text>
    <!-- 供给曲线（向上） -->
    <line x1="62" y1="136" x2="262" y2="44" stroke="var(--board-negative)" stroke-width="2.4" stroke-linecap="round" />
    <text x="266" y="52" class="ill-text ill-text-negative">供给 S</text>
    <!-- 均衡点与虚线 -->
    <line x1="162" y1="90" x2="162" y2="150" stroke="var(--board-faint)" stroke-width="1" stroke-dasharray="4 3" />
    <line x1="40" y1="90" x2="162" y2="90" stroke="var(--board-faint)" stroke-width="1" stroke-dasharray="4 3" />
    <circle cx="162" cy="90" r="5" fill="var(--board-current)" stroke="var(--board-paper)" stroke-width="1.6" />
    <text x="170" y="84" class="ill-text ill-text-current">均衡点</text>
    <text x="162" y="164" class="ill-text" text-anchor="middle">Q*</text>
    <text x="34" y="94" class="ill-text" text-anchor="end">P*</text>
  </svg>
</template>

<style scoped>
.ill-text-accent {
  fill: var(--board-accent);
}
.ill-text-negative {
  fill: var(--board-negative);
}
.ill-text-current {
  fill: var(--board-current);
}
</style>
