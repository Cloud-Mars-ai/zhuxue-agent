<script setup>
/**
 * Blueprint — 工程图纸与结构制图（工科制图母题）。
 * 学科画像（2026-11-09）：工程技术的图纸语言——网格、标注、剖面。
 */
</script>

<template>
  <svg class="ill-scene ill-blueprint" viewBox="0 0 320 180" role="img" aria-label="工程图纸图示">
    <rect x="0" y="0" width="320" height="180" rx="6" fill="var(--board-paper)" />
    <!-- 网格底纹 -->
    <defs>
      <pattern id="ill-bp-grid" width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M 16 0 L 0 0 0 16" fill="none" stroke="var(--board-faint)" stroke-width="0.5" opacity="0.5" />
      </pattern>
    </defs>
    <rect x="14" y="14" width="292" height="152" rx="3" fill="url(#ill-bp-grid)" stroke="var(--board-line)" stroke-width="1.4" />
    <!-- 主视图：支架结构 -->
    <g stroke="var(--board-accent)" stroke-width="2" fill="none" stroke-linejoin="round">
      <rect x="60" y="70" width="120" height="60" />
      <line x1="60" y1="70" x2="90" y2="40" />
      <line x1="180" y1="70" x2="150" y2="40" />
      <line x1="90" y1="40" x2="150" y2="40" />
      <line x1="90" y1="100" x2="150" y2="100" stroke-dasharray="5 4" />
    </g>
    <!-- 剖面填充 -->
    <polygon points="90,40 150,40 150,70 90,70" fill="var(--board-accent-soft)" stroke="none" />
    <polygon points="90,100 150,100 150,130 90,130" fill="var(--board-current-soft, var(--board-accent-soft))" stroke="none" opacity="0.6" />
    <!-- 尺寸标注：总宽 -->
    <g stroke="var(--board-line)" stroke-width="1.2">
      <line x1="60" y1="146" x2="180" y2="146" />
      <line x1="60" y1="141" x2="60" y2="151" />
      <line x1="180" y1="141" x2="180" y2="151" />
    </g>
    <text x="120" y="158" class="ill-text ill-text-strong" text-anchor="middle">120 mm</text>
    <!-- 尺寸标注：高度 -->
    <g stroke="var(--board-line)" stroke-width="1.2">
      <line x1="204" y1="40" x2="204" y2="130" />
      <line x1="199" y1="40" x2="209" y2="40" />
      <line x1="199" y1="130" x2="209" y2="130" />
    </g>
    <text x="216" y="88" class="ill-text ill-text-strong">90 mm</text>
    <!-- 半径标注 -->
    <circle cx="90" cy="40" r="3" fill="var(--board-current)" />
    <text x="98" y="34" class="ill-text ill-text-current">R5</text>
    <!-- 图签栏 -->
    <g>
      <rect x="212" y="96" width="86" height="62" rx="3" fill="var(--board-paper)" stroke="var(--board-line)" stroke-width="1.2" />
      <line x1="212" y1="112" x2="298" y2="112" stroke="var(--board-line)" stroke-width="1" />
      <line x1="212" y1="128" x2="298" y2="128" stroke="var(--board-line)" stroke-width="1" />
      <text x="218" y="108" class="ill-text ill-text-faint">图号 / 比例</text>
      <text x="218" y="124" class="ill-text ill-text-faint">材料 / 公差</text>
      <text x="218" y="140" class="ill-text ill-text-faint">设计 / 日期</text>
    </g>
    <text x="24" y="30" class="ill-text ill-text-faint">A3 · 1:2</text>
  </svg>
</template>

<style scoped>
.ill-text-strong {
  fill: var(--board-accent);
  font-weight: 700;
}
.ill-text-current {
  fill: var(--board-current);
  font-weight: 700;
}
.ill-text-faint {
  fill: var(--board-faint);
  font-size: 10px;
}
</style>
