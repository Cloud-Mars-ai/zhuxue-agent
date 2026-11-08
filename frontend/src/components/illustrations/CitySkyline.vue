<script setup>
/**
 * CitySkyline — 城市天际线（组织外部环境 / 行业格局场景图示）。
 * 诊断二修复：内置确定性 SVG，替代上游文生图照片。
 */
</script>

<template>
  <svg class="ill-scene ill-city-skyline" viewBox="0 0 320 180" role="img" aria-label="城市天际线场景图示">
    <rect x="0" y="0" width="320" height="180" rx="6" fill="color-mix(in srgb, var(--board-accent-soft) 55%, var(--board-paper))" />
    <circle cx="268" cy="36" r="15" fill="var(--board-warn-soft)" stroke="var(--board-warn)" stroke-width="1.2" />
    <!-- 楼群 -->
    <g stroke="var(--board-line)" stroke-width="1.2">
      <rect x="26" y="92" width="38" height="88" fill="var(--board-paper)" />
      <rect x="68" y="66" width="30" height="114" fill="var(--board-note)" />
      <rect x="102" y="104" width="26" height="76" fill="var(--board-paper)" />
      <rect x="132" y="52" width="40" height="128" fill="var(--board-note)" />
      <rect x="176" y="84" width="30" height="96" fill="var(--board-paper)" />
      <rect x="210" y="100" width="34" height="80" fill="var(--board-note)" />
      <rect x="248" y="72" width="44" height="108" fill="var(--board-paper)" />
    </g>
    <!-- 窗格 -->
    <g fill="var(--board-accent-soft)" stroke="var(--board-accent)" stroke-width="0.6">
      <rect x="33" y="100" width="7" height="7" /><rect x="46" y="100" width="7" height="7" />
      <rect x="33" y="116" width="7" height="7" /><rect x="46" y="116" width="7" height="7" />
      <rect x="74" y="76" width="7" height="7" /><rect x="86" y="76" width="7" height="7" />
      <rect x="74" y="94" width="7" height="7" /><rect x="86" y="94" width="7" height="7" />
      <rect x="139" y="62" width="8" height="8" /><rect x="153" y="62" width="8" height="8" />
      <rect x="139" y="80" width="8" height="8" /><rect x="153" y="80" width="8" height="8" />
      <rect x="139" y="98" width="8" height="8" /><rect x="153" y="98" width="8" height="8" />
      <rect x="255" y="82" width="8" height="8" /><rect x="270" y="82" width="8" height="8" />
      <rect x="255" y="100" width="8" height="8" /><rect x="270" y="100" width="8" height="8" />
      <rect x="255" y="118" width="8" height="8" /><rect x="270" y="118" width="8" height="8" />
    </g>
    <line x1="0" y1="180" x2="320" y2="180" stroke="var(--board-line)" stroke-width="2" />
    <text x="160" y="176" class="ill-text" text-anchor="middle">组织身处的外部环境</text>
  </svg>
</template>
