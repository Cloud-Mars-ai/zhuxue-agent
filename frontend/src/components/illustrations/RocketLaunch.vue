<script setup>
/**
 * RocketLaunch — 火箭发射（课程导入 / 愿景目标场景图示）。
 * 诊断二修复：内置确定性 SVG，替代 OpenMAIC 上游的文生图照片。
 */
</script>

<template>
  <svg class="ill-scene ill-rocket-launch" viewBox="0 0 320 180" role="img" aria-label="火箭发射场景图示">
    <rect x="0" y="0" width="320" height="180" rx="6" fill="color-mix(in srgb, var(--board-accent-soft) 60%, var(--board-paper))" />
    <g fill="var(--board-faint)">
      <circle cx="42" cy="30" r="1.6" />
      <circle cx="72" cy="58" r="1.1" />
      <circle cx="252" cy="38" r="1.6" />
      <circle cx="284" cy="66" r="1.1" />
      <circle cx="302" cy="28" r="1.2" />
      <circle cx="50" cy="98" r="1" />
      <circle cx="270" cy="98" r="1" />
    </g>
    <!-- 火箭体 -->
    <polygon points="145,44 160,16 175,44" fill="var(--board-negative)" />
    <rect x="145" y="44" width="30" height="76" rx="8" fill="var(--board-paper)" stroke="var(--board-line)" stroke-width="1.4" />
    <polygon points="145,96 126,128 145,120" fill="var(--board-negative)" />
    <polygon points="175,96 194,128 175,120" fill="var(--board-negative)" />
    <circle cx="160" cy="66" r="8" fill="var(--board-accent-soft)" stroke="var(--board-accent)" stroke-width="1.6" />
    <!-- 火焰 -->
    <path d="M 152 120 Q 156 140 160 156 Q 164 140 168 120 Z" fill="var(--board-warn)" />
    <path d="M 155 120 Q 158 134 160 144 Q 162 134 165 120 Z" fill="var(--board-warn-soft)" />
    <!-- 发射台与烟雾 -->
    <rect x="118" y="136" width="84" height="8" rx="2" fill="var(--board-line)" />
    <ellipse cx="138" cy="152" rx="16" ry="7" fill="var(--board-note)" stroke="var(--board-line)" stroke-width="0.8" />
    <ellipse cx="160" cy="158" rx="20" ry="8" fill="var(--board-note)" stroke="var(--board-line)" stroke-width="0.8" />
    <ellipse cx="184" cy="152" rx="14" ry="6" fill="var(--board-note)" stroke="var(--board-line)" stroke-width="0.8" />
    <text x="160" y="176" class="ill-text" text-anchor="middle">点火启航</text>
  </svg>
</template>
