<script setup>
import { computed } from 'vue'
import { COURSE, HOMEWORKS } from '@/mock/data'

const overallProgress = computed(() => {
  const list = COURSE.chapters
  return Math.round(list.reduce((a, c) => a + c.progress, 0) / list.length)
})

const upcoming = computed(() =>
  HOMEWORKS.filter((h) => h.status !== 'graded').slice(0, 2),
)
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

.m-chapter-progress {
  font-size: 13px;
  color: var(--brand);
  font-weight: 600;
}

:deep(.van-cell-group__title) {
  font-size: 14px;
}
</style>
