<script setup>
/**
 * BalanceScale — 天平权衡（两方案利弊 / 资源取舍场景图示）。
 * 诊断二修复：内置确定性 SVG，替代上游文生图照片。
 */
</script>

<template>
  <svg class="ill-scene ill-balance-scale" viewBox="0 0 320 180" role="img" aria-label="天平权衡图示">
    <rect x="0" y="0" width="320" height="180" rx="6" fill="var(--board-paper)" />
    <!-- 支架 -->
    <polygon points="160,96 148,152 172,152" fill="var(--board-note)" stroke="var(--board-line)" stroke-width="1.4" />
    <line x1="132" y1="152" x2="188" y2="152" stroke="var(--board-line)" stroke-width="2" />
    <!-- 横梁 -->
    <line x1="64" y1="60" x2="256" y2="60" stroke="var(--board-line)" stroke-width="3" stroke-linecap="round" />
    <circle cx="160" cy="60" r="5" fill="var(--board-accent)" />
    <!-- 左右悬索与托盘 -->
    <g stroke="var(--board-line)" stroke-width="1.2" fill="none">
      <line x1="64" y1="60" x2="46" y2="92" />
      <line x1="64" y1="60" x2="82" y2="92" />
      <line x1="256" y1="60" x2="238" y2="92" />
      <line x1="256" y1="60" x2="274" y2="92" />
    </g>
    <path d="M 42 92 Q 64 106 86 92" fill="var(--board-accent-soft)" stroke="var(--board-accent)" stroke-width="1.6" />
    <path d="M 234 92 Q 256 106 278 92" fill="var(--board-negative-soft)" stroke="var(--board-negative)" stroke-width="1.6" />
    <!-- 托盘内容 -->
    <rect x="56" y="76" width="16" height="16" rx="2" fill="var(--board-accent)" />
    <circle cx="256" cy="84" r="8" fill="var(--board-negative)" />
    <text x="64" y="126" class="ill-text ill-text-accent" text-anchor="middle">方案 A</text>
    <text x="256" y="126" class="ill-text ill-text-negative" text-anchor="middle">方案 B</text>
    <text x="160" y="172" class="ill-text ill-text-strong" text-anchor="middle">先列标准，再谈取舍</text>
  </svg>
</template>

<style scoped>
.ill-text {
  font-size: 11.5px;
  font-weight: 700;
}
.ill-text-accent {
  fill: var(--board-accent);
}
.ill-text-negative {
  fill: var(--board-negative);
}
.ill-text-strong {
  fill: var(--board-heading-alt);
  font-size: 10.5px;
  font-weight: 400;
}
</style>
