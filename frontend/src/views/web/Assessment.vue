<script setup>
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { COURSE, MOCK_STUDENTS } from '@/mock/data'
import { useUserStore } from '@/stores/user'
import { useModelStore } from '@/stores/model'
import { useAssessmentStore } from '@/stores/assessment'
import { usePracticeStore } from '@/stores/practice'
import {
  generateAssessmentQuestion,
  reviewAssessmentAnswer,
  ASSESSMENT_TYPES,
  DIFFICULTY_OPTIONS,
} from '@/api/aiTasks'

const userStore = useUserStore()
const modelStore = useModelStore()
const assessmentStore = useAssessmentStore()
const practiceStore = usePracticeStore()

const isStudent = computed(() => userStore.role === 'student')
const isTeacher = computed(() => ['admin', 'teacher', 'ta'].includes(userStore.role))
const isConfigured = computed(() => modelStore.isConfigured)

const chapterOptions = computed(() => COURSE.chapters.map((c) => c.title))
const groupOptions = computed(() => [...new Set(MOCK_STUDENTS.map((s) => s.group))])

/* ==================================================
 * 教师：圈人选范围 + AI 出题 + 复核发布 + 评分
 * ================================================== */
const scope = reactive({
  studentIds: [],
  chapters: [],
  questionType: ASSESSMENT_TYPES[0],
  difficulty: DIFFICULTY_OPTIONS[1],
})
const filterGroup = ref('')
const generating = ref(false)
const genProgress = ref({ done: 0, total: 0, current: '' })

const visibleStudents = computed(() =>
  filterGroup.value ? MOCK_STUDENTS.filter((s) => s.group === filterGroup.value) : MOCK_STUDENTS,
)

const scopeReady = computed(
  () => scope.studentIds.length > 0 && scope.chapters.length > 0,
)

function toggleStudent(id) {
  const i = scope.studentIds.indexOf(id)
  if (i >= 0) scope.studentIds.splice(i, 1)
  else scope.studentIds.push(id)
}

function toggleGroup(group) {
  const ids = MOCK_STUDENTS.filter((s) => s.group === group).map((s) => s.id)
  const allIn = ids.every((id) => scope.studentIds.includes(id))
  if (allIn) {
    scope.studentIds = scope.studentIds.filter((id) => !ids.includes(id))
  } else {
    ids.forEach((id) => {
      if (!scope.studentIds.includes(id)) scope.studentIds.push(id)
    })
  }
}

function groupAllSelected(group) {
  const ids = MOCK_STUDENTS.filter((s) => s.group === group).map((s) => s.id)
  return ids.length > 0 && ids.every((id) => scope.studentIds.includes(id))
}

function selectAll() {
  scope.studentIds = visibleStudents.value.map((s) => s.id)
}

function clearAll() {
  scope.studentIds = []
}

async function generate() {
  if (!scopeReady.value) {
    ElMessage.warning('请先勾选学生并选择至少一个章节作为出题范围')
    return
  }
  try {
    await ElMessageBox.confirm(
      `将为 ${scope.studentIds.length} 名学生生成个性化模拟面试题（结合练习记录与出题范围），继续？`,
      'AI 出题确认',
      { confirmButtonText: '开始生成', cancelButtonText: '取消', type: 'info' },
    )
  } catch {
    return
  }

  generating.value = true
  genProgress.value = { done: 0, total: scope.studentIds.length, current: '' }
  const items = []
  let seq = 0
  try {
    for (const id of scope.studentIds) {
      const student = MOCK_STUDENTS.find((s) => s.id === id)
      genProgress.value.current = student.name
      // 过程性评价：来自 M2 练习记录；出题范围来自教师划定（M4）
      const evaluation = practiceStore.evaluationSummary(id)
      const { question, referencePoints } = await generateAssessmentQuestion({
        student,
        evaluation,
        scope: { chapters: scope.chapters, questionType: scope.questionType, difficulty: scope.difficulty },
      })
      seq += 1
      items.push({
        id: `q-${Date.now().toString(36)}-${seq}`,
        studentId: student.id,
        studentName: student.name,
        discipline: student.discipline,
        question,
        referencePoints,
        status: 'pending_review',
      })
      genProgress.value.done += 1
    }
    const task = assessmentStore.createTask({
      scope: {
        chapters: [...scope.chapters],
        questionType: scope.questionType,
        difficulty: scope.difficulty,
        studentCount: scope.studentIds.length,
      },
      items,
    })
    ElMessage.success(`已生成 ${items.length} 道题，请逐题复核后发布`)
    activeTaskId.value = task.id
    // 重置圈选，保留范围设置便于再次出题
    scope.studentIds = []
  } catch (err) {
    ElMessage.error(err.message || '出题中断，已生成的题目不会保存，请重试')
  } finally {
    generating.value = false
    genProgress.value = { done: 0, total: 0, current: '' }
  }
}

/* ---- 任务列表与复核 ---- */
const activeTaskId = ref(null)
const activeTask = computed(() => assessmentStore.getTask(activeTaskId.value) || null)

const TASK_STATUS = {
  reviewing: { label: '复核中', type: 'warning' },
  published: { label: '已发布', type: 'success' },
}

const ITEM_STATUS = {
  pending_review: { label: '待复核', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'info' },
}

function taskProgress(task) {
  const total = task.items.length
  const approved = task.items.filter((i) => i.status === 'approved').length
  const answered = task.items.filter((i) => i.answer).length
  return { total, approved, answered }
}

const editingItem = ref(null)
const editingText = ref('')

function startEdit(item) {
  editingItem.value = item.id
  editingText.value = item.question
}

function saveEdit(item) {
  if (!editingText.value.trim()) {
    ElMessage.warning('题目内容不能为空')
    return
  }
  assessmentStore.reviewItem(activeTaskId.value, item.id, { question: editingText.value })
  editingItem.value = null
  ElMessage.success('题目已更新')
}

function approve(item) {
  assessmentStore.reviewItem(activeTaskId.value, item.id, { action: 'approve' })
}

function reject(item) {
  assessmentStore.reviewItem(activeTaskId.value, item.id, { action: 'reject' })
}

async function approveAll() {
  if (!activeTask.value) return
  const pending = activeTask.value.items.filter((i) => i.status === 'pending_review').length
  if (!pending) {
    ElMessage.info('没有待复核的题目')
    return
  }
  try {
    await ElMessageBox.confirm(`将批量通过 ${pending} 道待复核题目，继续？`, '批量通过', {
      confirmButtonText: '通过',
      cancelButtonText: '取消',
      type: 'warning',
    })
    assessmentStore.approveAll(activeTaskId.value)
    ElMessage.success('已批量通过')
  } catch {
    // 取消
  }
}

async function publish() {
  if (!activeTask.value) return
  const ok = assessmentStore.publish(activeTaskId.value)
  if (ok) {
    ElMessage.success('已发布，学生端可见分配的题目')
  } else {
    ElMessage.warning('至少需要一题通过复核后才能发布')
  }
}

const scoring = reactive({})

function score(taskId, item) {
  const v = scoring[item.id]
  if (v == null || v === '' || Number(v) < 0 || Number(v) > 100) {
    ElMessage.warning('请输入 0-100 的分数')
    return
  }
  assessmentStore.scoreItem(taskId, item.id, Number(v))
  ElMessage.success('评分已保存')
}

function formatTime(iso) {
  try {
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

/* ==================================================
 * 学生：查看题目 → 作答 → AI 反馈 → 教师评分
 * ================================================== */
const myItems = computed(() => assessmentStore.visibleItemsFor(userStore.user?.id))
const answers = reactive({})
const submitting = ref(false)

async function submitAnswer(entry) {
  const text = (answers[entry.item.id] || '').trim()
  if (!text) {
    ElMessage.warning('请先写下你的作答')
    return
  }
  submitting.value = true
  try {
    const feedback = await reviewAssessmentAnswer({
      question: entry.item.question,
      answer: text,
      referencePoints: entry.item.referencePoints,
    })
    assessmentStore.submitAnswer(entry.task.id, entry.item.id, { answer: text, feedback })
    ElMessage.success('作答已提交，AI 反馈已生成')
  } catch (err) {
    ElMessage.error(err.message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="assessment-page">
    <!-- ================= 教师视图 ================= -->
    <template v-if="isTeacher">
      <el-alert v-if="!isConfigured" type="warning" :closable="false" show-icon class="mb12">
        <template #title>
          尚未完成模型配置，
          <el-link type="primary" :underline="false" @click="$router.push('/model')">
            去「模型接入」页面配置
          </el-link>
          后即可使用 AI 智能出题
        </template>
      </el-alert>

      <el-row :gutter="16">
        <el-col :xs="24" :md="10">
          <div class="card">
            <h3 class="card-title">圈人选范围 · AI 出题</h3>
            <p class="card-desc">
              勾选学生划定出题范围，AI 结合每位学生的过程性评价（练习记录）与学科背景，生成个性化模拟面试题，教师复核后发布。
            </p>

            <div class="scope-block">
              <div class="scope-label">出题范围</div>
              <el-select
                v-model="scope.chapters"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="选择考查章节（可多选）"
                style="width: 100%"
              >
                <el-option v-for="c in chapterOptions" :key="c" :label="c" :value="c" />
              </el-select>
              <div class="scope-row">
                <el-select v-model="scope.questionType" style="flex: 1">
                  <el-option v-for="t in ASSESSMENT_TYPES" :key="t" :label="t" :value="t" />
                </el-select>
                <el-select v-model="scope.difficulty" style="flex: 1">
                  <el-option v-for="d in DIFFICULTY_OPTIONS" :key="d" :label="d" :value="d" />
                </el-select>
              </div>
            </div>

            <div class="scope-block">
              <div class="scope-label">
                选择学生（已选 {{ scope.studentIds.length }} 人）
                <div class="scope-ops">
                  <el-button link type="primary" size="small" @click="selectAll">全选当前</el-button>
                  <el-button link type="primary" size="small" @click="clearAll">清空</el-button>
                </div>
              </div>
              <el-select v-model="filterGroup" placeholder="全部小组" clearable size="small" style="width: 140px; margin-bottom: 8px">
                <el-option v-for="g in groupOptions" :key="g" :label="g" :value="g" />
              </el-select>

              <div class="group-row" v-for="g in groupOptions" :key="g">
                <el-checkbox
                  :model-value="groupAllSelected(g)"
                  @change="toggleGroup(g)"
                >
                  {{ g }}
                </el-checkbox>
                <div class="student-chips">
                  <el-checkbox
                    v-for="s in visibleStudents.filter((x) => x.group === g)"
                    :key="s.id"
                    :model-value="scope.studentIds.includes(s.id)"
                    @change="toggleStudent(s.id)"
                  >
                    <span :title="s.discipline">{{ s.name }}</span>
                  </el-checkbox>
                </div>
              </div>
            </div>

            <el-button
              type="primary"
              class="gen-btn"
              :loading="generating"
              :disabled="!isConfigured || !scopeReady"
              @click="generate"
            >
              AI 智能生成模拟面试题
            </el-button>
            <div v-if="generating" class="gen-progress">
              正在为 {{ genProgress.current }} 出题…（{{ genProgress.done }}/{{ genProgress.total }}）
            </div>
          </div>
        </el-col>

        <el-col :xs="24" :md="14">
          <div class="card">
            <h3 class="card-title">考核任务（{{ assessmentStore.tasks.length }}）</h3>
            <div v-if="assessmentStore.tasks.length" class="task-list">
              <div
                v-for="t in assessmentStore.tasks"
                :key="t.id"
                class="task-item"
                :class="{ active: t.id === activeTaskId }"
                @click="activeTaskId = t.id"
              >
                <div class="task-item-head">
                  <span class="task-item-title">
                    {{ t.scope.chapters.join('、') }}
                  </span>
                  <el-tag size="small" :type="TASK_STATUS[t.status].type" effect="plain">
                    {{ TASK_STATUS[t.status].label }}
                  </el-tag>
                </div>
                <div class="task-item-meta">
                  {{ t.scope.questionType }} · {{ t.scope.difficulty }} · {{ t.scope.studentCount }} 人 ·
                  已通过 {{ taskProgress(t).approved }}/{{ taskProgress(t).total }} ·
                  {{ formatTime(t.createdAt) }}
                </div>
              </div>
            </div>
            <el-empty v-else description="还没有考核任务，先在左侧圈人选范围" :image-size="80" />
          </div>
        </el-col>
      </el-row>

      <!-- 任务复核 / 发布 / 评分面板 -->
      <div v-if="activeTask" class="card review-card">
        <div class="review-head">
          <h3 class="card-title">
            任务复核：{{ activeTask.scope.chapters.join('、') }}（{{ activeTask.scope.questionType }}）
          </h3>
          <div class="review-ops">
            <el-button size="small" @click="approveAll">批量通过</el-button>
            <el-button
              size="small"
              type="primary"
              :disabled="activeTask.status === 'published'"
              @click="publish"
            >
              {{ activeTask.status === 'published' ? '已发布' : '发布任务' }}
            </el-button>
          </div>
        </div>

        <el-table :data="activeTask.items" stripe>
          <el-table-column label="学生" width="150">
            <template #default="{ row }">
              <div>{{ row.studentName }}</div>
              <div class="text-sub">{{ row.discipline }}</div>
            </template>
          </el-table-column>
          <el-table-column label="题目（含教师复核要点）" min-width="340">
            <template #default="{ row }">
              <template v-if="editingItem === row.id">
                <el-input v-model="editingText" type="textarea" :rows="3" resize="none" />
                <div class="edit-ops">
                  <el-button size="small" type="primary" @click="saveEdit(row)">保存</el-button>
                  <el-button size="small" @click="editingItem = null">取消</el-button>
                </div>
              </template>
              <template v-else>
                <div class="q-text">{{ row.question }}</div>
                <div v-if="row.referencePoints" class="q-refs">参考要点：{{ row.referencePoints }}</div>
              </template>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="ITEM_STATUS[row.status].type" effect="plain">
                {{ ITEM_STATUS[row.status].label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="学生作答 / AI 反馈" min-width="200">
            <template #default="{ row }">
              <template v-if="row.answer">
                <el-popover placement="left" :width="340" trigger="click">
                  <template #reference>
                    <el-button link type="primary" size="small">查看作答</el-button>
                  </template>
                  <div class="pop-block">
                    <div class="pop-label">学生作答</div>
                    <p class="pop-text">{{ row.answer }}</p>
                    <div class="pop-label">AI 反馈</div>
                    <p class="pop-text">{{ row.aiFeedback }}</p>
                  </div>
                </el-popover>
              </template>
              <span v-else class="text-sub">未作答</span>
            </template>
          </el-table-column>
          <el-table-column label="教师评分" width="150">
            <template #default="{ row }">
              <template v-if="row.teacherScore != null">
                <span class="score-text">{{ row.teacherScore }}</span>
              </template>
              <template v-else>
                <div class="score-row">
                  <el-input
                    v-model.number="scoring[row.id]"
                    size="small"
                    style="width: 70px"
                    placeholder="0-100"
                  />
                  <el-button size="small" type="primary" plain @click="score(activeTask.id, row)">
                    评分
                  </el-button>
                </div>
              </template>
            </template>
          </el-table-column>
          <el-table-column label="复核操作" width="180" align="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="startEdit(row)">编辑</el-button>
              <el-button
                v-if="row.status !== 'approved'"
                link
                type="success"
                size="small"
                @click="approve(row)"
              >
                通过
              </el-button>
              <el-button
                v-if="row.status !== 'rejected'"
                link
                type="danger"
                size="small"
                @click="reject(row)"
              >
                驳回
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- ================= 学生视图 ================= -->
    <template v-else-if="isStudent">
      <el-alert v-if="!isConfigured" type="warning" :closable="false" show-icon class="mb12">
        <template #title>
          尚未完成模型配置，暂无法获取 AI 反馈；配置后可在「模型接入」页面完成。
        </template>
      </el-alert>

      <div class="card">
        <h3 class="card-title">我的模拟面试题（{{ myItems.length }}）</h3>
        <p class="card-desc">
          老师圈定范围后由 AI 生成、教师复核发布的个性化题目。作答后 AI 给出反馈，最终由教师评分。
        </p>

        <div v-if="myItems.length" class="student-items">
          <div v-for="entry in myItems" :key="entry.item.id" class="student-item">
            <div class="student-item-head">
              <span class="student-item-chapter">{{ entry.task.scope.chapters.join('、') }}</span>
              <el-tag size="small" type="success" effect="plain">
                {{ entry.task.scope.questionType }} · {{ entry.task.scope.difficulty }}
              </el-tag>
              <el-tag v-if="entry.item.teacherScore != null" size="small" type="danger" effect="plain">
                得分 {{ entry.item.teacherScore }}
              </el-tag>
            </div>
            <div class="student-item-question">{{ entry.item.question }}</div>

            <template v-if="entry.item.answer">
              <div class="answer-block">
                <div class="answer-label">我的作答</div>
                <p class="answer-text">{{ entry.item.answer }}</p>
                <div class="answer-label">AI 反馈</div>
                <p class="answer-text ai">{{ entry.item.aiFeedback }}</p>
              </div>
            </template>
            <template v-else>
              <el-input
                v-model="answers[entry.item.id]"
                type="textarea"
                :rows="4"
                resize="none"
                placeholder="请像面对面试官一样，完整口头作答（写下你的表达）"
              />
              <el-button
                type="primary"
                size="small"
                class="submit-answer-btn"
                :loading="submitting"
                @click="submitAnswer(entry)"
              >
                提交作答
              </el-button>
            </template>
          </div>
        </div>
        <el-empty v-else description="老师还没有发布分配给您的模拟面试题" :image-size="80" />
      </div>
    </template>

    <el-empty v-else description="当前角色暂无考核功能入口" :image-size="80" />
  </div>
</template>

<style scoped>
.assessment-page {
  padding-bottom: 12px;
}

.mb12 {
  margin-bottom: 12px;
}

.card-title {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 600;
}

.card-desc {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-sub);
}

.scope-block {
  margin-bottom: 18px;
}

.scope-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
}

.scope-ops {
  display: flex;
  gap: 4px;
}

.scope-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.group-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px dashed var(--border);
}

.group-row:last-child {
  border-bottom: none;
}

.student-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}

.gen-btn {
  width: 100%;
}

.gen-progress {
  margin-top: 8px;
  font-size: 12px;
  color: var(--brand);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.task-item:hover {
  border-color: var(--brand);
}

.task-item.active {
  border-color: var(--brand);
  background: #eef4ff;
}

.task-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.task-item-title {
  font-size: 14px;
  font-weight: 600;
}

.task-item-meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-sub);
}

.review-card {
  margin-top: 16px;
}

.review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}

.review-head .card-title {
  margin: 0;
}

.review-ops {
  display: flex;
  gap: 8px;
}

.q-text {
  font-size: 14px;
  line-height: 1.8;
}

.q-refs {
  margin-top: 6px;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.7;
  color: #b06f00;
  background: #fdf6ec;
  border-radius: 6px;
}

.edit-ops {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.score-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--brand);
}

.pop-block {
  max-height: 300px;
  overflow-y: auto;
}

.pop-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--brand);
}

.pop-text {
  margin: 4px 0 12px;
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.student-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.student-item {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.student-item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.student-item-chapter {
  font-size: 13px;
  font-weight: 600;
  color: var(--brand);
}

.student-item-question {
  padding: 12px 14px;
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.9;
  white-space: pre-wrap;
  background: var(--bg-page);
  border-radius: 8px;
}

.submit-answer-btn {
  margin-top: 10px;
}

.answer-block {
  padding: 12px 14px;
  background: var(--bg-page);
  border-radius: 8px;
}

.answer-label {
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--brand);
}

.answer-text {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.9;
  white-space: pre-wrap;
}

.answer-text.ai {
  margin-bottom: 0;
}
</style>
