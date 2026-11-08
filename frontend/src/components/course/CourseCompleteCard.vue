<script setup>
/**
 * 完课闭环卡片（P0-1）。
 * 学习旅程的终点：统计（场景/板书/答题/正确率）→ 动作（再学一次/返回编排/关闭）。
 * 纯本地确定性逻辑，不依赖任何 AI 调用；数据由 CourseExperience 会话级进度汇总。
 */
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  chapter: { type: String, default: '' },
  stats: {
    type: Object,
    default: () => ({
      sceneCount: 0,
      visitedCount: 0,
      boardCount: 0,
      quizTotal: 0,
      quizCorrect: 0,
      minutes: 0,
      quizScenes: [],
    }),
  },
})
const emit = defineEmits(['restart', 'edit', 'close'])

const accuracy = computed(() =>
  props.stats.quizTotal
    ? Math.round((props.stats.quizCorrect / props.stats.quizTotal) * 100)
    : null,
)
const accuracyTone = computed(() => {
  if (accuracy.value == null) return 'neutral'
  if (accuracy.value >= 80) return 'good'
  if (accuracy.value >= 50) return 'fair'
  return 'poor'
})
const verdict = computed(() => {
  if (accuracy.value == null) return '已完成全部学习场景'
  if (accuracy.value >= 90) return '掌握扎实，可以进入变式练习'
  if (accuracy.value >= 60) return '主线已通，建议回看错题对应场景'
  return '建议从第一个场景重新学一遍'
})
</script>

<template>
  <div class="complete-mask" role="dialog" aria-modal="true" aria-label="完课总结">
    <section class="complete-card">
      <button type="button" class="complete-close" aria-label="关闭" @click="emit('close')">×</button>
      <div class="complete-trophy" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none">
          <path
            d="M20 8h24v12c0 8.8-7.2 16-16 16S12 28.8 12 20V8h8z"
            fill="var(--accent-soft)"
            stroke="var(--accent)"
            stroke-width="2.5"
          />
          <path d="M32 36v10m-10 10h20" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" />
          <path d="M12 14H6v6a8 8 0 0 0 8 8m38-14h6v6a8 8 0 0 1-8 8" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" />
          <path d="M26 20l4.5 4.5L39 16" stroke="var(--ok)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <span class="complete-eyebrow">COURSE COMPLETE · {{ chapter }}</span>
      <h2>{{ title || '课程学习完成' }}</h2>
      <p class="complete-verdict">{{ verdict }}</p>

      <div class="complete-stats">
        <div class="complete-stat">
          <strong>{{ stats.visitedCount }}/{{ stats.sceneCount }}</strong>
          <span>学习场景</span>
        </div>
        <div class="complete-stat">
          <strong>{{ stats.boardCount }}</strong>
          <span>板书讲解</span>
        </div>
        <div class="complete-stat">
          <strong>{{ stats.quizTotal }}</strong>
          <span>完成答题</span>
        </div>
        <div class="complete-stat" :class="`is-${accuracyTone}`">
          <strong v-if="accuracy != null">{{ accuracy }}%</strong>
          <strong v-else>—</strong>
          <span>答题正确率</span>
        </div>
      </div>

      <div v-if="stats.quizScenes?.length" class="complete-breakdown">
        <span>分场景正确率</span>
        <ul>
          <li v-for="item in stats.quizScenes" :key="item.id">
            <em>{{ item.title }}</em>
            <span class="breakdown-track"><i :style="{ width: `${item.rate}%` }" /></span>
            <b>{{ item.correct }}/{{ item.total }}</b>
          </li>
        </ul>
      </div>

      <footer class="complete-actions">
        <button type="button" class="complete-button primary" @click="emit('restart')">再学一次</button>
        <button type="button" class="complete-button" @click="emit('edit')">返回编排调整</button>
        <button type="button" class="complete-button ghost" @click="emit('close')">留在本页</button>
      </footer>
      <p class="complete-note">约 {{ stats.minutes }} 分钟 · 学习记录仅保留在本机</p>
    </section>
  </div>
</template>

<style scoped>
.complete-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, var(--text-main) 32%, transparent);
  backdrop-filter: blur(6px);
  animation: complete-in 0.25s ease;
}

.complete-card {
  position: relative;
  width: min(520px, 100%);
  max-height: 90vh;
  overflow: auto;
  padding: 34px 36px 26px;
  text-align: center;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg, 18px);
  box-shadow: 0 24px 80px color-mix(in srgb, var(--text-main) 22%, transparent);
}

.complete-close {
  position: absolute;
  top: 12px;
  right: 14px;
  width: 28px;
  height: 28px;
  color: var(--text-faint);
  background: transparent;
  border: 0;
  border-radius: 50%;
  font-size: 17px;
  line-height: 1;
  cursor: pointer;
}

.complete-close:hover {
  color: var(--text-main);
  background: var(--surface-2);
}

.complete-trophy {
  width: 74px;
  height: 74px;
  margin: 0 auto 10px;
}

.complete-eyebrow {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.complete-card h2 {
  margin: 8px 0 4px;
  font-family: var(--board-display);
  font-size: 25px;
}

.complete-verdict {
  margin: 0 0 18px;
  color: var(--text-sub);
  font-size: 12px;
}

.complete-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 14px 0;
  border-top: 1px solid var(--card-border);
  border-bottom: 1px solid var(--card-border);
}

.complete-stat strong {
  display: block;
  color: var(--text-main);
  font-family: var(--font-mono);
  font-size: 19px;
}

.complete-stat span {
  color: var(--text-faint);
  font-size: 9.5px;
}

.complete-stat.is-good strong { color: var(--ok); }
.complete-stat.is-fair strong { color: var(--warn); }
.complete-stat.is-poor strong { color: var(--danger); }

.complete-breakdown {
  margin: 14px 0 4px;
  text-align: left;
}

.complete-breakdown > span {
  color: var(--text-faint);
  font-size: 9.5px;
}

.complete-breakdown ul {
  display: grid;
  gap: 7px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.complete-breakdown li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 90px auto;
  align-items: center;
  gap: 10px;
  font-size: 10.5px;
}

.complete-breakdown em {
  overflow: hidden;
  color: var(--text-sub);
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breakdown-track {
  height: 5px;
  overflow: hidden;
  background: var(--surface-3);
  border-radius: var(--radius-pill);
}

.breakdown-track i {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: inherit;
}

.complete-breakdown b {
  color: var(--text-main);
  font-family: var(--font-mono);
  font-size: 10px;
}

.complete-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
}

.complete-button {
  padding: 9px 18px;
  color: var(--text-sub);
  background: var(--surface-2);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.complete-button:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.complete-button.primary {
  color: #fff;
  background: var(--accent);
  border-color: var(--accent);
  font-weight: 600;
}

.complete-button.primary:hover {
  background: var(--accent-deep);
}

.complete-button.ghost {
  background: transparent;
}

.complete-note {
  margin: 12px 0 0;
  color: var(--text-faint);
  font-size: 9.5px;
}

@keyframes complete-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 560px) {
  .complete-stats { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .complete-actions { flex-wrap: wrap; }
}
</style>
