<script setup>
/**
 * SquareRoot — 平方根的面积模型（边长 a 的正方形，面积 a²）。
 * 对应 OpenMAIC 视频 s_098 的「平方根探索」交互页视觉锚点。
 * 诊断二修复：内置确定性 SVG，替代上游文生图照片。
 */
</script>

<template>
  <svg class="ill-scene ill-square-root" viewBox="0 0 320 180" role="img" aria-label="平方根面积模型图示">
    <rect x="0" y="0" width="320" height="180" rx="6" fill="var(--board-paper)" />
    <!-- 大正方形 -->
    <rect x="96" y="26" width="112" height="112" rx="3"
      fill="color-mix(in srgb, var(--board-accent-soft) 55%, transparent)"
      stroke="var(--board-accent)" stroke-width="2" />
    <!-- 内部网格（4×4） -->
    <g stroke="var(--board-accent)" stroke-width="0.5" opacity="0.45">
      <line x1="124" y1="26" x2="124" y2="138" />
      <line x1="152" y1="26" x2="152" y2="138" />
      <line x1="180" y1="26" x2="180" y2="138" />
      <line x1="96" y1="54" x2="208" y2="54" />
      <line x1="96" y1="82" x2="208" y2="82" />
      <line x1="96" y1="110" x2="208" y2="110" />
    </g>
    <!-- 边长标注 -->
    <text x="152" y="20" class="ill-text ill-text-accent" text-anchor="middle">a</text>
    <text x="88" y="86" class="ill-text ill-text-accent" text-anchor="end">a</text>
    <text x="152" y="88" class="ill-text ill-text-strong" text-anchor="middle">面积 = a²</text>
    <!-- 数轴小图 -->
    <line x1="228" y1="120" x2="304" y2="120" stroke="var(--board-line)" stroke-width="1.2" />
    <g fill="var(--board-line)">
      <line x1="234" y1="116" x2="234" y2="124" stroke-width="1.2" />
      <line x1="266" y1="116" x2="266" y2="124" stroke-width="1.2" />
      <line x1="298" y1="116" x2="298" y2="124" stroke-width="1.2" />
    </g>
    <circle cx="266" cy="120" r="4" fill="var(--board-current)" />
    <text x="266" y="108" class="ill-text ill-text-current" text-anchor="middle">a</text>
    <text x="152" y="160" class="ill-text ill-text-strong" text-anchor="middle">√(a²) = a（a ≥ 0）</text>
  </svg>
</template>

<style scoped>
.ill-text {
  font-size: 12px;
}
.ill-text-accent {
  fill: var(--board-accent);
  font-weight: 700;
  font-size: 14px;
}
.ill-text-current {
  fill: var(--board-current);
  font-weight: 700;
}
.ill-text-strong {
  fill: var(--board-heading-alt);
  font-weight: 700;
}
</style>
