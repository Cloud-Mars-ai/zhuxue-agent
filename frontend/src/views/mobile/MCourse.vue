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
          color="#fff"
          track-color="rgba(255,255,255,0.3)"
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
  color: #fff;
  background: linear-gradient(135deg, #2f6feb, #5b8def);
}

.m-hero h2 {
  margin: 0 0 4px;
  font-size: 20px;
}

.m-hero p {
  margin: 0 0 14px;
  font-size: 12px;
  opacity: 0.9;
}

.m-progress-text {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.9;
}

.m-case-banner {
  margin: 12px 12px 0;
  padding: 12px 14px;
  background: linear-gradient(120deg, #fff7e8, #ffedd0);
  border: 1px solid #f3d9a4;
  border-radius: 10px;
}

.m-case-label {
  display: inline-block;
  padding: 2px 8px;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #b06f00;
  background: #fff;
  border-radius: 4px;
}

.m-case-title {
  font-size: 15px;
  font-weight: 600;
  color: #7a5200;
}

.m-case-meta {
  margin: 2px 0 6px;
  font-size: 11px;
  color: #a17400;
}

.m-case-summary {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #6b5410;
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
