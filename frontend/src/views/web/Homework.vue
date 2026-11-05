<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { HOMEWORK_STATUS } from '@/mock/data'
import { useHomeworkStore } from '@/stores/homework'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const homeworkStore = useHomeworkStore()
const isStudent = computed(() => userStore.role === 'student')
const isMobileRoute = computed(() => route.path.startsWith('/m/'))

const statusFilter = ref('')
const showPublish = ref(false)
const publishForm = ref({
  title: '',
  deadline: '',
  description: '',
})

const statusTabs = [
  { label: '全部', value: '' },
  { label: '未开始', value: 'pending' },
  { label: '提交中', value: 'submitting' },
  { label: '已批改', value: 'graded' },
]

const list = computed(() => {
  const rows = homeworkStore.sortedAssignments
  if (!statusFilter.value) return rows
  return rows.filter((item) => item.status === statusFilter.value)
})

function submissionOf(item) {
  return homeworkStore.submissionFor(item.id, userStore.user?.id)
}

function displayStatus(item) {
  if (!isStudent.value) return HOMEWORK_STATUS[item.status] || HOMEWORK_STATUS.pending
  const submission = submissionOf(item)
  if (submission?.status === 'graded') return { label: '已批阅', type: 'success' }
  if (submission) return { label: '已提交', type: 'warning' }
  return HOMEWORK_STATUS[item.status] || HOMEWORK_STATUS.pending
}

function daysLeft(deadline) {
  const end = new Date(String(deadline || '').replace(' ', 'T') + '+08:00').getTime()
  if (!Number.isFinite(end)) return null
  return Math.ceil((end - Date.now()) / 86400000)
}

function deadlineText(item) {
  const submission = submissionOf(item)
  if (submission?.status === 'graded') return '批阅已完成'
  const days = daysLeft(item.deadline)
  if (days == null) return '未设置截止时间'
  if (days < 0) return '已逾期'
  if (days === 0) return '今天截止'
  return `还剩 ${days} 天`
}

function deadlineType(item) {
  const days = daysLeft(item.deadline)
  if (days == null) return 'info'
  if (days < 0) return 'danger'
  if (days <= 2) return 'warning'
  return 'success'
}

function openDetail(item) {
  router.push(`${isMobileRoute.value ? '/m' : '/app'}/homework/${item.id}`)
}

async function publishAssignment() {
  if (!publishForm.value.title.trim() || !publishForm.value.deadline) {
    ElMessage.warning('请填写作业标题和截止时间')
    return
  }
  const item = await homeworkStore.addAssignment({
    ...publishForm.value,
    teacher: userStore.name,
  })
  showPublish.value = false
  publishForm.value = { title: '', deadline: '', description: '' }
  ElMessage.success(`已发布「${item.title}」`)
}

onMounted(homeworkStore.load)
</script>

<template>
  <div class="homework-page">
    <div class="toolbar">
      <div>
        <h1 class="page-title">作业</h1>
        <p class="text-sub">
          {{
            isStudent
              ? '点击作业查看要求、上传本地文件并查看老师的批阅回复。'
              : '发布作业，进入详情查看学生提交并完成批阅。'
          }}
        </p>
      </div>
      <el-button v-if="!isStudent" type="primary" @click="showPublish = true">
        <el-icon><Plus /></el-icon>布置作业
      </el-button>
    </div>

    <el-radio-group v-model="statusFilter" class="tabs">
      <el-radio-button v-for="tab in statusTabs" :key="tab.value" :value="tab.value">
        {{ tab.label }}
      </el-radio-button>
    </el-radio-group>

    <div class="card">
      <el-empty v-if="!list.length" description="该状态下暂无作业" />
      <div v-for="item in list" :key="item.id" class="hw">
        <button class="hw-main" type="button" @click="openDetail(item)">
          <div class="hw-title">
            {{ item.title }}
            <el-tag size="small" :type="displayStatus(item).type" effect="plain">
              {{ displayStatus(item).label }}
            </el-tag>
          </div>
          <p class="hw-desc">{{ item.description }}</p>
          <div class="text-sub hw-meta">
            <span>截止：{{ item.deadline }}</span>
            <el-tag size="small" :type="deadlineType(item)" effect="light">
              {{ deadlineText(item) }}
            </el-tag>
            <span v-if="submissionOf(item)?.score != null">
              得分：<strong>{{ submissionOf(item).score }}</strong>
            </span>
            <span v-if="submissionOf(item)">提交文件：{{ submissionOf(item).fileName }}</span>
          </div>
          <div v-if="!isStudent" class="hw-progress">
            <el-progress
              :percentage="Math.round((item.submitted / Math.max(1, item.total)) * 100)"
              :stroke-width="8"
            />
            <span class="text-sub">已提交 {{ item.submitted }}/{{ item.total }} 人</span>
          </div>
        </button>
        <div class="hw-actions">
          <el-button type="primary" :plain="isStudent" @click="openDetail(item)">
            {{
              isStudent
                ? submissionOf(item)?.status === 'graded'
                  ? '查看批阅'
                  : submissionOf(item)
                    ? '查看提交'
                    : '进入提交'
                : '查看提交与批改'
            }}
          </el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="showPublish" title="布置作业" width="560px">
      <el-form label-position="top">
        <el-form-item label="作业标题">
          <el-input v-model="publishForm.title" placeholder="例如：第 4 章组织结构案例分析" />
        </el-form-item>
        <el-form-item label="截止时间">
          <el-date-picker
            v-model="publishForm.deadline"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm"
            placeholder="选择截止时间"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="作业要求">
          <el-input
            v-model="publishForm.description"
            type="textarea"
            :rows="5"
            placeholder="说明任务、提交格式和评价标准…"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPublish = false">取消</el-button>
        <el-button type="primary" @click="publishAssignment">发布作业</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.homework-page {
  width: min(1080px, 100%);
  margin: 0 auto;
}

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
  padding: 15px 0;
  border-bottom: 1px solid var(--border);
}

.hw:last-child {
  border-bottom: none;
}

.hw-main {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.hw-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
}

.hw-desc {
  margin: 6px 0 0;
  color: var(--text-sub);
  font-size: 12px;
  line-height: 1.7;
}

.hw-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.hw-meta strong {
  color: var(--accent);
  font-size: 15px;
}

.hw-progress {
  max-width: 300px;
  margin-top: 10px;
}

.hw-progress .text-sub {
  display: block;
  margin-top: 4px;
}

.hw-actions {
  flex-shrink: 0;
}

.w-full {
  width: 100%;
}

@media (max-width: 768px) {
  .toolbar,
  .hw {
    flex-direction: column;
  }

  .hw-actions,
  .hw-actions :deep(.el-button) {
    width: 100%;
  }
}
</style>
