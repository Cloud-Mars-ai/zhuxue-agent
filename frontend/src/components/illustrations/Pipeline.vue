<script setup>
/**
 * Pipeline — 流程管线与工序流转（工科主线图示）。
 * 学科画像（2026-11-09）：工程技术的视觉母题，输入经若干工序到输出。
 */
</script>

<template>
  <svg class="ill-scene ill-pipeline" viewBox="0 0 320 180" role="img" aria-label="流程管线图示">
    <rect x="0" y="0" width="320" height="180" rx="6" fill="var(--board-paper)" />
    <text x="160" y="24" class="ill-text ill-text-title" text-anchor="middle">处理流程</text>
    <!-- 输入 -->
    <g>
      <rect x="16" y="60" width="52" height="44" rx="5" fill="var(--board-accent-soft)" stroke="var(--board-line)" stroke-width="1.4" />
      <text x="42" y="79" class="ill-text ill-text-strong" text-anchor="middle">输入</text>
      <text x="42" y="94" class="ill-text ill-text-faint" text-anchor="middle">原料/需求</text>
    </g>
    <!-- 工序 1 -->
    <g>
      <rect x="92" y="60" width="60" height="44" rx="5" fill="var(--board-paper)" stroke="var(--board-accent)" stroke-width="1.8" />
      <text x="122" y="79" class="ill-text ill-text-strong" text-anchor="middle">工序 1</text>
      <text x="122" y="94" class="ill-text ill-text-faint" text-anchor="middle">清洗/解析</text>
    </g>
    <!-- 工序 2（当前高亮） -->
    <g>
      <rect x="176" y="54" width="60" height="56" rx="5" fill="var(--board-current-soft, var(--board-accent-soft))" stroke="var(--board-current)" stroke-width="2.2" />
      <text x="206" y="76" class="ill-text ill-text-current" text-anchor="middle">工序 2</text>
      <text x="206" y="91" class="ill-text ill-text-faint" text-anchor="middle">核心变换</text>
    </g>
    <!-- 工序 3 -->
    <g>
      <rect x="260" y="60" width="46" height="44" rx="5" fill="var(--board-paper)" stroke="var(--board-line)" stroke-width="1.4" stroke-dasharray="4 3" />
      <text x="283" y="79" class="ill-text" text-anchor="middle">工序 3</text>
      <text x="283" y="94" class="ill-text ill-text-faint" text-anchor="middle">校验</text>
    </g>
    <!-- 流向箭头 -->
    <g fill="var(--board-line)">
      <polygon points="86,82 78,77 78,87" />
      <polygon points="170,82 162,77 162,87" />
      <polygon points="254,82 246,77 246,87" />
    </g>
    <!-- 输出 -->
    <g>
      <rect x="112" y="128" width="96" height="34" rx="5" fill="var(--board-accent-soft)" stroke="var(--board-line)" stroke-width="1.4" />
      <text x="160" y="149" class="ill-text ill-text-strong" text-anchor="middle">输出 · 合格品</text>
    </g>
    <!-- 回流（不合格重做） -->
    <path d="M 283 104 Q 283 120 208 122 Q 150 124 122 112" fill="none" stroke="var(--board-warn)" stroke-width="1.6" stroke-dasharray="5 4" />
    <polygon points="114,110 124,104 122,116" fill="var(--board-warn)" />
    <text x="216" y="136" class="ill-text ill-text-warn">不合格返工</text>
  </svg>
</template>

<style scoped>
.ill-text-title {
  fill: var(--board-accent);
  font-weight: 700;
  font-size: 13px;
}
.ill-text-strong {
  fill: var(--board-accent);
  font-weight: 700;
}
.ill-text-current {
  fill: var(--board-current);
  font-weight: 700;
}
.ill-text-warn {
  fill: var(--board-warn);
  font-size: 10px;
}
.ill-text-faint {
  fill: var(--board-faint);
  font-size: 10px;
}
</style>
