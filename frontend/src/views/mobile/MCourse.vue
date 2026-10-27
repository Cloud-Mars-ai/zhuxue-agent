<script setup>
import { computed } from 'vue'
import { COURSE, HOMEWORKS } from '@/mock/data'
import { useCasesStore } from '@/stores/cases'

const casesStore = useCasesStore()

const overallProgress = computed(() => {
  const list = COURSE.chapters
  return Math.round(list.reduce((a, c) => a + c.progress, 0) / list.length)
})

const upcoming = computed(() =>
  HOMEWORKS.filter((h) => h.status !== 'graded').slice(0, 2),
)

// 本节课案例：老师从案例池选用后置顶展示（M3）
const currentCase = computed(() => casesStore.currentCase())
</script>

<template>
  <div class="m-page">
    <div class="m-hero">
      <h2>{{ COURSE.name }}</h2>
      <p>{{ COURSE.teacher }} · {{ COURSE.term }}</p>
      <div class="m-progress">
        <van-progress
          :percentage="overallProgress"
          stroke-width="8"
          color="var(--hero-progress)"
          track-color="var(--hero-track)"
        />
        <span class="m-progress-text">我的学习进度 {{ overallProgress }}%</span>
      </div>
    </div>

    <div v-if="currentCase" class="m-case-banner">
      <div class="m-case-label">本节课案例</div>
      <div class="m-case-title">{{ currentCase.title }}</div>
      <div class="m-case-meta">
        {{ currentCase.chapter }} · 推荐人 {{ currentCase.submitter }}（{{ currentCase.discipline }}）
      </div>
      <p class="m-case-summary">{{ currentCase.summary }}</p>
      <div class="m-ai-tags">
        <van-tag
          v-for="t in currentCase.tags || []"
          :key="t"
          plain
          type="warning"
          class="m-ai-tag"
        >
          {{ t }}
        </van-tag>
      </div>
      <van-button size="mini" plain type="primary" class="m-case-btn" :to="'/m/case'">
        进入案例池
      </van-button>
    </div>

    <van-cell-group inset title="待办作业">
      <van-cell
        v-for="h in upcoming"
        :key="h.id"
        :title="h.title"
        :label="`截止 ${h.deadline}`"
        is-link
      >
        <template #value>
          <van-tag :type="h.status === 'pending' ? 'default' : 'warning'" plain>
            {{ h.status === 'pending' ? '未开始' : '进行中' }}
          </van-tag>
        </template>
      </van-cell>
      <van-empty v-if="!upcoming.length" description="暂无待办作业" />
    </van-cell-group>

    <van-cell-group inset title="章节学习">
      <van-cell
        v-for="c in COURSE.chapters"
        :key="c.id"
        :title="c.title"
        :label="c.status"
        is-link
      >
        <template #value>
          <span class="m-chapter-progress">{{ c.progress }}%</span>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<style scoped>
.m-page {
  padding-bottom: 12px;
}

.m-hero {
  padding: 20px 16px;
  color: var(--hero-text);
  background: var(--hero-bg);
}

.m-hero h2 {
  margin: 0 0 4px;
  font-size: 20px;
  font-family: var(--font-title);
}

.m-hero p {
  margin: 0 0 14px;
  font-size: 12px;
  color: var(--hero-sub);
}

.m-progress-text {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: var(--hero-sub);
}

.m-case-banner {
  margin: 12px 12px 0;
  padding: 12px 14px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.m-case-label {
  display: inline-block;
  padding: 2px 8px;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: var(--radius-sm);
}

.m-case-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
}

.m-case-meta {
  margin: 2px 0 6px;
  font-size: 11px;
  color: var(--text-sub);
}

.m-case-summary {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-sub);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.m-case-btn {
  margin-top: 10px;
}

.m-chapter-progress {
  font-size: 13px;
  color: var(--brand);
  font-weight: 600;
}

:deep(.van-cell-group__title) {
  font-size: 14px;
}
</style>
