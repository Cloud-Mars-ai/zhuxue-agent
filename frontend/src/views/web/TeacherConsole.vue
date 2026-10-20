<script setup>
import { computed } from 'vue'
import { COURSE, HOMEWORKS, RISK_STUDENTS, STATS_WEEKLY } from '@/mock/data'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 教师看全部，助教只看教学相关板块
const canPublish = computed(() => ['admin', 'teacher'].includes(userStore.role))

const avgAttendance = computed(() => {
  const list = STATS_WEEKLY.attendance
  return Math.round(list.reduce((a, b) => a + b, 0) / list.length)
})

const avgInteraction = computed(() => {
  const list = STATS_WEEKLY.interaction
  return Math.round(list.reduce((a, b) => a + b, 0) / list.length)
})

const pendingHomework = computed(
  () => HOMEWORKS.filter((h) => h.status === 'submitting').length,
)

const overview = computed(() => [
  { label: '选课人数', value: COURSE.studentCount, unit: '人', icon: 'User', color: '#2f6feb' },
  { label: '平均出勤', value: avgAttendance.value, unit: '人', icon: 'Checked', color: '#67c23a' },
  { label: '课堂互动', value: avgInteraction.value, unit: '次/周', icon: 'ChatDotRound', color: '#e6a23c' },
  { label: '待批作业', value: pendingHomework.value, unit: '份', icon: 'Notebook', color: '#f56c6c' },
])

const levelTagType = { 高: 'danger', 中: 'warning', 低: 'info' }
</script>

<template>
  <div>
    <div class="toolbar">
      <div>
        <h3 class="page-title">教师主控台</h3>
        <p class="text-sub">
          当前身份：{{ userStore.roleLabel }}
          <template v-if="!canPublish">（助教身份为只读，发布操作由教师执行）</template>
        </p>
      </div>
      <el-button type="primary" :disabled="!canPublish">
        <el-icon><Plus /></el-icon>发布新任务
      </el-button>
    </div>

    <el-row :gutter="16" class="stat-row">
      <el-col v-for="s in overview" :key="s.label" :xs="12" :sm="12" :md="6">
        <div class="card stat-card">
          <el-icon class="stat-icon" :style="{ background: `${s.color}1a`, color: s.color }">
            <component :is="s.icon" />
          </el-icon>
          <div>
            <div class="stat-value">
              {{ s.value }}<span class="stat-unit">{{ s.unit }}</span>
            </div>
            <div class="text-sub">{{ s.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :md="14">
        <div class="card">
          <h3 class="card-title">进行中的作业</h3>
          <el-table :data="HOMEWORKS" stripe size="small">
            <el-table-column prop="title" label="作业" min-width="240" show-overflow-tooltip />
            <el-table-column label="提交情况" width="150">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.round((row.submitted / row.total) * 100)"
                  :stroke-width="10"
                />
                <span class="text-sub">{{ row.submitted }}/{{ row.total }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="deadline" label="截止时间" width="150" />
            <el-table-column label="操作" width="90" align="right">
              <template #default>
                <el-button link type="primary" size="small">批改</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>

      <el-col :xs="24" :md="10">
        <div class="card">
          <h3 class="card-title">需要关注的学生</h3>
          <el-table :data="RISK_STUDENTS" size="small">
            <el-table-column prop="name" label="学生" width="90" />
            <el-table-column prop="issue" label="预警原因" min-width="160" />
            <el-table-column label="等级" width="70">
              <template #default="{ row }">
                <el-tag size="small" :type="levelTagType[row.level]" effect="dark">
                  {{ row.level }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-alert type="warning" :closable="false" class="risk-tip">
            预警由学情数据自动汇总，建议教师人工复核后再介入。
          </el-alert>
        </div>
      </el-col>
    </el-row>
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

.stat-row {
  margin-bottom: 0;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  font-size: 22px;
  border-radius: 10px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}

.stat-unit {
  margin-left: 3px;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-sub);
}

.card-title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
}

.risk-tip {
  margin-top: 12px;
}
</style>
