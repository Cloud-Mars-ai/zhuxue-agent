<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { HOMEWORKS, HOMEWORK_STATUS } from '@/mock/data'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const isStudent = computed(() => userStore.role === 'student')

const statusFilter = ref('')

const statusTabs = [
  { label: '全部', value: '' },
  { label: '未开始', value: 'pending' },
  { label: '提交中', value: 'submitting' },
  { label: '已批改', value: 'graded' },
]

const list = computed(() => {
  if (!statusFilter.value) return HOMEWORKS
  return HOMEWORKS.filter((h) => h.status === statusFilter.value)
})

// 距离截止时间还剩几天，已过截止返回负数
function daysLeft(deadline) {
  const now = new Date('2026-10-17T20:00:00+08:00').getTime()
  const end = new Date(deadline.replace(' ', 'T') + '+08:00').getTime()
  return Math.ceil((end - now) / 86400000)
}

function deadlineText(h) {
  const d = daysLeft(h.deadline)
  if (h.status === 'graded') return '已截止'
  if (d < 0) return '已逾期'
  if (d === 0) return '今天截止'
  return `还剩 ${d} 天`
}

function deadlineType(h) {
  const d = daysLeft(h.deadline)
  if (h.status === 'graded') return 'info'
  if (d < 0) return 'danger'
  if (d <= 2) return 'warning'
  return 'success'
}

function handleSubmit(h) {
  // 接口就绪后改为 post('/homework/{id}/submit', formData)
  ElMessage.success(`已提交「${h.title}」（仿真数据模式）`)
}
</script>

<template>
  <div>
    <div class="toolbar">
      <div>
        <h3 class="page-title">作业管理</h3>
        <p class="text-sub">
          {{ isStudent ? '查看并提交你的课程作业' : '发布作业、跟踪提交与批改进度' }}
        </p>
      </div>
      <el-button v-if="!isStudent" type="primary">
        <el-icon><Plus /></el-icon>布置作业
      </el-button>
    </div>

    <el-radio-group v-model="statusFilter" class="tabs">
      <el-radio-button v-for="t in statusTabs" :key="t.value" :value="t.value">
        {{ t.label }}
      </el-radio-button>
    </el-radio-group>

    <div class="card">
      <el-empty v-if="!list.length" description="该状态下暂无作业" />
      <div v-for="h in list" :key="h.id" class="hw">
        <div class="hw-main">
          <div class="hw-title">
            {{ h.title }}
            <el-tag size="small" :type="HOMEWORK_STATUS[h.status].type" effect="plain">
              {{ HOMEWORK_STATUS[h.status].label }}
            </el-tag>
          </div>
          <div class="text-sub hw-meta">
            <span>截止：{{ h.deadline }}</span>
            <el-tag size="small" :type="deadlineType(h)" effect="light">
              {{ deadlineText(h) }}
            </el-tag>
            <span v-if="h.score !== null">我的得分：<strong>{{ h.score }}</strong></span>
          </div>
          <div v-if="!isStudent" class="hw-progress">
            <el-progress
              :percentage="Math.round((h.submitted / h.total) * 100)"
              :stroke-width="10"
            />
            <span class="text-sub">已提交 {{ h.submitted }}/{{ h.total }} 人</span>
          </div>
        </div>
        <div class="hw-actions">
          <el-button v-if="isStudent" type="primary" plain @click="handleSubmit(h)">
            {{ h.status === 'graded' ? '查看批阅' : '提交作业' }}
          </el-button>
          <el-button v-else type="primary" plain>批改</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.toolbar .page-title {
  margin-bottom: 4px;
}

.tabs {
  margin-bottom: 16px;
}

.hw {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}

.hw:last-child {
  border-bottom: none;
}

.hw-main {
  flex: 1;
  min-width: 0;
}

.hw-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}

.hw-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.hw-meta strong {
  color: var(--brand);
  font-size: 15px;
}

.hw-progress {
  max-width: 260px;
  margin-top: 10px;
}

.hw-progress .text-sub {
  display: block;
  margin-top: 4px;
}

.hw-actions {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .hw {
    flex-direction: column;
  }
  .hw-actions {
    width: 100%;
  }
  .hw-actions :deep(.el-button) {
    width: 100%;
  }
}
</style>
