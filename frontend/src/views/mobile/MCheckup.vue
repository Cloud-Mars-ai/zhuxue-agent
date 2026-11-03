<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { usePersonaStore } from '@/stores/persona'
import { diagnoseGaps } from '@/utils/diagnose'

const router = useRouter()
const userStore = useUserStore()
const personaStore = usePersonaStore()

const persona = computed(() => personaStore.data)
const report = computed(() =>
  diagnoseGaps({ persona: persona.value, studentName: userStore.name || '同学' }),
)
const gaps = computed(() => report.value.gaps)
const stats = computed(() => report.value.stats)
const hasData = computed(() => stats.value.attempts > 0 || stats.value.selfTestQuestions > 0)

function train(gap) {
  router.push({ path: '/m/selftest', query: { chapters: gap.chapter, count: 5 } })
}

function goTest() {
  router.push({ path: '/m/selftest', query: { count: 5 } })
}
</script>

<template>
  <div class="m-page">
    <div class="m-head">
      <div class="m-title">学习体检</div>
      <div class="m-sub">不是打分，是告诉你劲往哪使。</div>
    </div>

    <div class="m-stats">
      <div class="m-stat">
        <div class="m-num">{{ stats.attempts }}</div>
        <div class="m-lab">练习次数</div>
      </div>
      <div class="m-stat">
        <div class="m-num">{{ stats.selfTestQuestions }}</div>
        <div class="m-lab">自测题数</div>
      </div>
      <div class="m-stat">
        <div class="m-num">{{ stats.accuracy }}%</div>
        <div class="m-lab">正确率</div>
      </div>
      <div class="m-stat">
        <div class="m-num">{{ stats.gapCount }}</div>
        <div class="m-lab">待处理盲区</div>
      </div>
    </div>

    <div v-if="!hasData" class="m-card m-empty">
      <div class="m-label">还没有足够的数据</div>
      <p class="m-tip">先做一组 5 题摸底，系统才能定位盲区；没有数据时不会编报告。</p>
      <van-button block type="primary" size="small" class="mt" @click="goTest">
        去做一组自测
      </van-button>
    </div>

    <template v-else>
      <div class="m-card">
        <div class="m-label">章节正确率</div>
        <div v-for="m in persona.masteryList" :key="m.chapter" class="m-bar-row">
          <div class="m-bar-head">
            <span>{{ m.short }}</span>
            <span class="m-bar-val">{{ m.total ? `${m.accuracy}%` : '未测' }}</span>
          </div>
          <div class="m-bar">
            <div class="m-bar-fill" :style="{ width: `${m.total ? m.accuracy : 0}%` }" />
          </div>
        </div>
      </div>

      <div class="m-card">
        <div class="m-label">优先处理顺序</div>
        <div v-for="(g, i) in gaps.slice(0, 6)" :key="`${g.chapter}-${i}`" class="m-gap">
          <div class="m-gap-head">
            <span class="m-gap-no">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="m-gap-ch">{{ g.chapter }}</span>
            <span class="m-gap-type">{{ g.typeLabel }}</span>
          </div>
          <div class="m-gap-ev">{{ g.evidence }}</div>
          <div class="m-gap-sug">{{ g.suggestion }}</div>
          <van-button size="mini" type="primary" plain class="mt8" @click="train(g)">
            针对这处练一组
          </van-button>
        </div>
        <p v-if="!gaps.length" class="m-tip">暂未发现明显盲区，继续做跨章自测保持手感。</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.m-page {
  padding: 12px 0 20px;
}

.m-head {
  padding: 4px 16px 10px;
}

.m-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.m-sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-sub);
}

.m-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 0 12px 12px;
}

.m-stat {
  padding: 12px 14px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
}

.m-num {
  font-family: var(--font-mono, monospace);
  font-size: 24px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1.1;
}

.m-lab {
  margin-top: 3px;
  font-size: 11px;
  color: var(--text-sub);
}

.m-card {
  margin: 0 12px 12px;
  padding: 14px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.m-label {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.m-tip {
  margin: 6px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-sub);
}

.mt {
  margin-top: 12px;
}

.mt8 {
  margin-top: 8px;
}

.m-bar-row {
  margin-bottom: 8px;
}

.m-bar-head {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--text-sub);
  margin-bottom: 3px;
}

.m-bar-val {
  color: var(--text-main);
}

.m-bar {
  height: 5px;
  border-radius: 3px;
  background: var(--surface-2);
  overflow: hidden;
}

.m-bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
}

.m-gap {
  padding: 10px 0;
  border-bottom: 1px dashed var(--border);
}

.m-gap:last-child {
  border-bottom: none;
}

.m-gap-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.m-gap-no {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  color: var(--text-faint);
}

.m-gap-ch {
  flex: 1;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-main);
}

.m-gap-type {
  padding: 1px 6px;
  font-size: 10px;
  color: var(--warn, #e6a23c);
  border: 1px solid currentColor;
  border-radius: 3px;
}

.m-gap-ev {
  margin-top: 4px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-main);
}

.m-gap-sug {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-sub);
}
</style>
