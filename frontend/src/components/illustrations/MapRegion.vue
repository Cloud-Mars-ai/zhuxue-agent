<script setup>
/**
 * MapRegion — 区域地图与空间分布（地理 / 经济区位图示）。
 * 学科画像（2026-11-09）：人文历史与经管社科的空间母题。
 */
</script>

<template>
  <svg class="ill-scene ill-map-region" viewBox="0 0 320 180" role="img" aria-label="区域地图图示">
    <rect x="0" y="0" width="320" height="180" rx="6" fill="var(--board-paper)" />
    <!-- 区域轮廓（示意性大陆块） -->
    <path d="M 52 34 Q 92 22 128 32 Q 168 24 210 36 Q 254 30 272 52 Q 286 78 272 106 Q 264 134 236 148 Q 196 160 152 150 Q 108 158 76 140 Q 46 122 44 92 Q 42 58 52 34 Z"
      fill="var(--board-accent-soft)" stroke="var(--board-line)" stroke-width="2" stroke-linejoin="round" />
    <!-- 河流 -->
    <path d="M 96 48 Q 118 76 108 104 Q 100 128 118 146" fill="none" stroke="var(--board-current)" stroke-width="2" opacity="0.7" />
    <!-- 分界线 -->
    <path d="M 160 30 Q 168 70 158 108 Q 152 132 160 152" fill="none" stroke="var(--board-faint)" stroke-width="1.6" stroke-dasharray="6 4" />
    <!-- 标注点 -->
    <g>
      <circle cx="120" cy="66" r="5" fill="var(--board-current)" stroke="var(--board-paper)" stroke-width="1.6" />
      <rect x="94" y="44" width="52" height="18" rx="3" fill="var(--board-paper)" stroke="var(--board-line)" stroke-width="1" />
      <text x="120" y="57" class="ill-text ill-text-strong" text-anchor="middle">甲区</text>
    </g>
    <g>
      <circle cx="204" cy="94" r="5" fill="var(--board-accent)" stroke="var(--board-paper)" stroke-width="1.6" />
      <rect x="178" y="104" width="52" height="18" rx="3" fill="var(--board-paper)" stroke="var(--board-line)" stroke-width="1" />
      <text x="204" y="117" class="ill-text ill-text-strong" text-anchor="middle">乙区</text>
    </g>
    <g>
      <circle cx="96" cy="126" r="4.4" fill="var(--board-warn)" stroke="var(--board-paper)" stroke-width="1.4" />
      <text x="96" y="152" class="ill-text" text-anchor="middle">港口</text>
    </g>
    <!-- 图例 -->
    <g>
      <rect x="236" y="20" width="72" height="46" rx="4" fill="var(--board-paper)" stroke="var(--board-line)" stroke-width="1" />
      <circle cx="248" cy="32" r="3.6" fill="var(--board-current)" />
      <text x="258" y="36" class="ill-text">核心</text>
      <circle cx="248" cy="48" r="3.6" fill="var(--board-accent)" />
      <text x="258" y="52" class="ill-text">腹地</text>
      <line x1="242" y1="60" x2="254" y2="60" stroke="var(--board-faint)" stroke-width="1.6" stroke-dasharray="4 3" />
      <text x="258" y="64" class="ill-text">边界</text>
    </g>
    <!-- 方向标 -->
    <g>
      <polygon points="292,158 286,172 292,168 298,172" fill="var(--board-line)" />
      <text x="292" y="150" class="ill-text ill-text-faint" text-anchor="middle">N</text>
    </g>
  </svg>
</template>

<style scoped>
.ill-text-strong {
  fill: var(--board-accent);
  font-weight: 700;
}
.ill-text-faint {
  fill: var(--board-faint);
  font-size: 10px;
}
</style>
