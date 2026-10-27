<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { COURSE, FORUM_POSTS } from '@/mock/data'
import { useUserStore } from '@/stores/user'
import { useCasesStore } from '@/stores/cases'

const router = useRouter()
const userStore = useUserStore()
const casesStore = useCasesStore()

const overallProgress = computed(() => {
  const list = COURSE.chapters
  const sum = list.reduce((acc, c) => acc + c.progress, 0)
  return Math.round(sum / list.length)
})

const latestPosts = computed(() => FORUM_POSTS.slice(0, 3))

// 本节课案例：老师从案例池选用后，课堂主页置顶展示（M3）
const currentCase = computed(() => casesStore.currentCase())

// 学生看到自己的学习进度，教师看到班级整体情况
const isStudent = computed(() => userStore.role === 'student')
</script>

<template>
  <div>
    <div class="hero">
      <div class="hero-text">
        <h2>{{ COURSE.name }}</h2>
        <p>{{ COURSE.college }} · {{ COURSE.term }} · 主讲 {{ COURSE.teacher }}</p>
        <p class="hero-desc">{{ COURSE.description }}</p>
        <div class="hero-meta">
          <span><strong>{{ COURSE.credit }}</strong> 学分</span>
          <span><strong>{{ COURSE.hours }}</strong> 学时</span>
          <span><strong>{{ COURSE.studentCount }}</strong> 名学生</span>
        </div>
      </div>
      <div class="hero-progress">
        <el-progress
          type="dashboard"
          :percentage="overallProgress"
          :width="120"
          :color="[
            { color: '#f56c6c', percentage: 30 },
            { color: '#e6a23c', percentage: 70 },
            { color: '#67c23a', percentage: 100 },
          ]"
        />
        <p class="text-sub">{{ isStudent ? '我的学习进度' : '班级平均进度' }}</p>
      </div>
    </div>

    <div v-if="currentCase" class="case-banner">
      <div class="case-banner-label">本节课案例</div>
      <div class="case-banner-body">
        <div class="case-banner-title">{{ currentCase.title }}</div>
        <div class="case-banner-meta">
          {{ currentCase.chapter }} · 推荐人 {{ currentCase.submitter }}（{{ currentCase.discipline }}）
        </div>
        <p class="case-banner-summary">{{ currentCase.summary }}</p>
        <div class="case-banner-tags">
          <el-tag
            v-for="t in currentCase.tags || []"
            :key="t"
            size="small"
            effect="dark"
            class="case-banner-tag"
          >
            {{ t }}
          </el-tag>
        </div>
      </div>
      <el-button class="case-banner-btn" size="small" @click="router.push('/cases')">
        {{ isStudent ? '我也要提案例' : '管理案例池' }}
      </el-button>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :md="14">
        <div class="card">
          <h3 class="card-title">章节学习</h3>
          <el-table :data="COURSE.chapters" stripe>
            <el-table-column prop="title" label="章节" min-width="220" />
            <el-table-column label="进度" width="180">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :stroke-width="10" />
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :type="
                    row.status === '已完成'
                      ? 'success'
                      : row.status === '进行中'
                        ? 'warning'
                        : 'info'
                  "
                  effect="plain"
                >
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" align="right">
              <template #default>
                <el-button link type="primary" size="small">进入学习</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>

      <el-col :xs="24" :md="10">
        <div class="card">
          <h3 class="card-title">最新研讨</h3>
          <ul class="post-list">
            <li v-for="p in latestPosts" :key="p.id">
              <router-link :to="`/forum?id=${p.id}`" class="post-title">
                {{ p.title }}
              </router-link>
              <div class="text-sub">
                {{ p.author }} · {{ p.replies }} 条回复 · {{ p.createdAt }}
              </div>
            </li>
          </ul>
        </div>

        <div class="card">
          <h3 class="card-title">AI 助教</h3>
          <p class="text-sub">
            基于《管理学》教材与课件构建的知识库，支持课后答疑与苏格拉底式引导提问。
          </p>
          <el-button type="primary" plain class="w-full" @click="router.push('/ask')">开始提问</el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.case-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  margin-bottom: 16px;
  background: linear-gradient(120deg, #fff7e8, #ffedd0);
  border: 1px solid #f3d9a4;
  border-radius: var(--radius);
}

.case-banner-label {
  flex-shrink: 0;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
  color: #b06f00;
  background: #fff;
  border: 1px solid #f3d9a4;
  border-radius: 6px;
}

.case-banner-body {
  flex: 1;
  min-width: 0;
}

.case-banner-title {
  font-size: 15px;
  font-weight: 600;
  color: #7a5200;
}

.case-banner-meta {
  margin: 2px 0 4px;
  font-size: 12px;
  color: #a17400;
}

.case-banner-summary {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: #6b5410;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.case-banner-tags {
  margin-top: 6px;
}

.case-banner-tag {
  margin-right: 4px;
}

.case-banner-btn {
  flex-shrink: 0;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px;
  margin-bottom: 16px;
  color: #fff;
  background: linear-gradient(120deg, #2f6feb, #5b8def);
  border-radius: var(--radius);
}

.hero-text h2 {
  margin: 0 0 6px;
  font-size: 24px;
}

.hero-text p {
  margin: 0;
  opacity: 0.9;
  font-size: 13px;
}

.hero-desc {
  max-width: 640px;
  margin-top: 10px !important;
  line-height: 1.7;
}

.hero-meta {
  display: flex;
  gap: 24px;
  margin-top: 16px;
}

.hero-meta strong {
  font-size: 20px;
  margin-right: 4px;
}

.hero-progress {
  flex-shrink: 0;
  text-align: center;
}

.hero-progress .text-sub {
  color: rgba(255, 255, 255, 0.85);
  margin: 8px 0 0;
}

.card-title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
}

.post-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.post-list li {
  padding: 10px 0;
  border-bottom: 1px dashed var(--border);
}

.post-list li:last-child {
  border-bottom: none;
}

.post-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.w-full {
  width: 100%;
}

@media (max-width: 768px) {
  .hero {
    flex-direction: column;
    text-align: center;
  }
  .hero-meta {
    justify-content: center;
  }
  .case-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
