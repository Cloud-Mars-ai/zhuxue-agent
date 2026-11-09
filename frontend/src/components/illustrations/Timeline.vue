<script setup>
/**
 * Timeline — 时间轴与事件时序（历史学科主线图示）。
 * 学科画像（2026-11-09）：人文历史的视觉母题，替代上游文生图照片。
 */
</script>

<template>
  <svg class="ill-scene ill-timeline" viewBox="0 0 320 180" role="img" aria-label="时间轴图示">
    <rect x="0" y="0" width="320" height="180" rx="6" fill="var(--board-paper)" />
    <!-- 主轴 -->
    <line x1="28" y1="92" x2="296" y2="92" stroke="var(--board-line)" stroke-width="2.4" stroke-linecap="round" />
    <polygon points="302,92 292,87 292,97" fill="var(--board-line)" />
    <!-- 交替上下的事件卡 -->
    <g>
      <line x1="62" y1="92" x2="62" y2="56" stroke="var(--board-faint)" stroke-width="1.4" />
      <circle cx="62" cy="92" r="4.6" fill="var(--board-accent)" stroke="var(--board-paper)" stroke-width="1.6" />
      <rect x="30" y="26" width="64" height="30" rx="4" fill="var(--board-accent-soft)" stroke="var(--board-line)" stroke-width="1" />
      <text x="62" y="38" class="ill-text ill-text-strong" text-anchor="middle">起点</text>
      <text x="62" y="50" class="ill-text" text-anchor="middle">事件一</text>
    </g>
    <g>
      <line x1="130" y1="92" x2="130" y2="128" stroke="var(--board-faint)" stroke-width="1.4" />
      <circle cx="130" cy="92" r="4.6" fill="var(--board-accent)" stroke="var(--board-paper)" stroke-width="1.6" />
      <rect x="98" y="128" width="64" height="30" rx="4" fill="var(--board-accent-soft)" stroke="var(--board-line)" stroke-width="1" />
      <text x="130" y="140" class="ill-text ill-text-strong" text-anchor="middle">发展</text>
      <text x="130" y="152" class="ill-text" text-anchor="middle">事件二</text>
    </g>
    <g>
      <line x1="198" y1="92" x2="198" y2="56" stroke="var(--board-faint)" stroke-width="1.4" />
      <circle cx="198" cy="92" r="4.6" fill="var(--board-accent)" stroke="var(--board-paper)" stroke-width="1.6" />
      <rect x="166" y="26" width="64" height="30" rx="4" fill="var(--board-accent-soft)" stroke="var(--board-line)" stroke-width="1" />
      <text x="198" y="38" class="ill-text ill-text-strong" text-anchor="middle">转折</text>
      <text x="198" y="50" class="ill-text" text-anchor="middle">事件三</text>
    </g>
    <g>
      <line x1="266" y1="92" x2="266" y2="128" stroke="var(--board-faint)" stroke-width="1.4" />
      <circle cx="266" cy="92" r="5.4" fill="var(--board-current)" stroke="var(--board-paper)" stroke-width="1.6" />
      <rect x="234" y="128" width="64" height="30" rx="4" fill="var(--board-current-soft, var(--board-accent-soft))" stroke="var(--board-line)" stroke-width="1" />
      <text x="266" y="140" class="ill-text ill-text-strong" text-anchor="middle">结果</text>
      <text x="266" y="152" class="ill-text" text-anchor="middle">事件四</text>
    </g>
    <!-- 时间刻度 -->
    <text x="62" y="112" class="ill-text ill-text-faint" text-anchor="middle">T1</text>
    <text x="130" y="112" class="ill-text ill-text-faint" text-anchor="middle">T2</text>
    <text x="198" y="112" class="ill-text ill-text-faint" text-anchor="middle">T3</text>
    <text x="266" y="112" class="ill-text ill-text-faint" text-anchor="middle">T4</text>
    <!-- 因果暗示 -->
    <path d="M 70 82 Q 100 74 124 82" fill="none" stroke="var(--board-faint)" stroke-width="1.4" stroke-dasharray="4 3" />
    <path d="M 138 102 Q 168 110 192 102" fill="none" stroke="var(--board-faint)" stroke-width="1.4" stroke-dasharray="4 3" />
    <path d="M 206 82 Q 236 74 260 82" fill="none" stroke="var(--board-faint)" stroke-width="1.4" stroke-dasharray="4 3" />
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
