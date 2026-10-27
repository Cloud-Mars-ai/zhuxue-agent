<script setup>
import { ref, computed, reactive } from 'vue'
import { showToast, showConfirmDialog, showLoadingToast, closeToast } from 'vant'
import { COURSE, MOCK_STUDENTS } from '@/mock/data'
import { useUserStore } from '@/stores/user'
import { useModelStore } from '@/stores/model'
import { useAssessmentStore } from '@/stores/assessment'
import { usePracticeStore } from '@/stores/practice'
import { useThemeStore } from '@/stores/theme'
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
const themeStore = useThemeStore()

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
const showChapterPicker = ref(false)
const showTypePicker = ref(false)
const showDifficultyPicker = ref(false)
const generating = ref(false)
const genTip = ref('')

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

const scopeReady = computed(() => scope.studentIds.length > 0 && scope.chapters.length > 0)

async function generate() {
  if (!scopeReady.value) {
    showToast('请先勾选学生并选择章节范围')
    return
  }
  try {
    await showConfirmDialog({
      title: 'AI 出题确认',
      message: `将为 ${scope.studentIds.length} 名学生生成个性化模拟面试题（结合练习记录与出题范围），继续？`,
    })
  } catch {
    return
  }

  generating.value = true
  const items = []
  let seq = 0
  try {
    for (const id of scope.studentIds) {
      const student = MOCK_STUDENTS.find((s) => s.id === id)
      genTip.value = `正在为 ${student.name} 出题（${items.length + 1}/${scope.studentIds.length}）`
      showLoadingToast({ message: genTip.value, duration: 0, forbidClick: true })
      const evaluation = practiceStore.evaluationSummary(id)
      const { question, referencePoints } = await generateAssessmentQuestion({
        student,
        evaluation,
        scope: {
          chapters: scope.chapters,
          questionType: scope.questionType,
          difficulty: scope.difficulty,
        },
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
    activeTaskId.value = task.id
    scope.studentIds = []
    showToast(`已生成 ${items.length} 道题，请复核后发布`)
  } catch (err) {
    showToast(err.message || '出题中断，请重试')
  } finally {
    closeToast()
    generating.value = false
    genTip.value = ''
  }
}

/* ---- 任务列表与复核 ---- */
const activeTaskId = ref('')
const activeTask = computed(() => assessmentStore.getTask(activeTaskId.value) || null)

const TASK_STATUS = {
  reviewing: { label: '复核中', color: '#ff976a' },
  published: { label: '已发布', color: '#07c160' },
}

const ITEM_STATUS = {
  pending_review: { label: '待复核', color: '#ff976a' },
  approved: { label: '已通过', color: '#07c160' },
  rejected: { label: '已驳回', color: '#969799' },
}

const editingItem = ref('')
const editingText = ref('')

function startEdit(item) {
  editingItem.value = item.id
  editingText.value = item.question
}

function saveEdit(item) {
  if (!editingText.value.trim()) {
    showToast('题目内容不能为空')
    return
  }
  assessmentStore.reviewItem(activeTaskId.value, item.id, { question: editingText.value })
  editingItem.value = ''
  showToast('题目已更新')
}

function approve(item) {
  assessmentStore.reviewItem(activeTaskId.value, item.id, { action: 'approve' })
}

function reject(item) {
  assessmentStore.reviewItem(activeTaskId.value, item.id, { action: 'reject' })
}

async function approveAll() {
  const pending = activeTask.value?.items.filter((i) => i.status === 'pending_review').length || 0
  if (!pending) {
    showToast('没有待复核的题目')
    return
  }
  try {
    await showConfirmDialog({ title: '批量通过', message: `将通过 ${pending} 道待复核题目` })
    assessmentStore.approveAll(activeTaskId.value)
    showToast('已批量通过')
  } catch {
    // 取消
  }
}

async function publish() {
  const ok = assessmentStore.publish(activeTaskId.value)
  if (ok) showToast('已发布，学生端可见')
  else showToast('至少一题通过后才能发布')
}

const scoring = reactive({})

function score(item) {
  const v = scoring[item.id]
  if (v == null || v === '' || Number(v) < 0 || Number(v) > 100) {
    showToast('请输入 0-100 的分数')
    return
  }
  assessmentStore.scoreItem(activeTaskId.value, item.id, Number(v))
  showToast('评分已保存')
}

/* ==================================================
 * 学生：查看题目 → 作答 → AI 反馈
 * ================================================== */
const myItems = computed(() => assessmentStore.visibleItemsFor(userStore.user?.id))
const answers = reactive({})
const submitting = ref(false)

// 学生视图栏目标题随皮肤切换：墨读下考核题目装帧为「面试函」
const studentSectionTitle = computed(() =>
  themeStore.isMo ? '面试函 · 我的题目' : '我的模拟面试题',
)

async function submitAnswer(entry) {
  const text = (answers[entry.item.id] || '').trim()
  if (!text) {
    showToast('请先写下你的作答')
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
    showToast('作答已提交，AI 反馈已生成')
  } catch (err) {
    showToast(err.message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="m-page">
    <!-- ================= 教师视图 ================= -->
    <template v-if="isTeacher">
      <van-notice-bar
        v-if="!isConfigured"
        text="配置模型密钥后即可使用 AI 智能出题（模型接入见 Web 端）"
        background="#fdf6ec"
        color="#b06f00"
      />

      <van-cell-group inset title="出题范围">
        <van-cell
          title="考查章节"
          :value="scope.chapters.length ? scope.chapters.join('、') : '点击选择（可多选）'"
          is-link
          @click="showChapterPicker = true"
        />
        <van-cell
          title="题型"
          :value="scope.questionType"
          is-link
          @click="showTypePicker = true"
        />
        <van-cell
          title="难度"
          :value="scope.difficulty"
          is-link
          @click="showDifficultyPicker = true"
        />
      </van-cell-group>

      <van-cell-group inset :title="`选择学生（已选 ${scope.studentIds.length} 人）`">
        <van-cell
          v-for="g in groupOptions"
          :key="g"
          :title="g"
          clickable
          @click="toggleGroup(g)"
        >
          <template #right-icon>
            <van-checkbox :model-value="groupAllSelected(g)" @click.stop="toggleGroup(g)" />
          </template>
        </van-cell>
        <van-checkbox-group v-model="scope.studentIds" style="padding: 0 16px 10px">
          <div class="m-student-grid">
            <van-checkbox
              v-for="s in MOCK_STUDENTS"
              :key="s.id"
              :name="s.id"
              shape="square"
            >
              <span class="m-student-name">{{ s.name }}</span>
              <span class="m-student-discipline">{{ s.discipline }}</span>
            </van-checkbox>
          </div>
        </van-checkbox-group>
      </van-cell-group>

      <div class="m-gen-wrap">
        <van-button
          block
          type="primary"
          size="small"
          :loading="generating"
          :disabled="!isConfigured || !scopeReady"
          @click="generate"
        >
          AI 智能生成模拟面试题
        </van-button>
        <p v-if="genTip" class="m-gen-tip">{{ genTip }}</p>
      </div>

      <van-cell-group inset title="考核任务">
        <van-cell
          v-for="t in assessmentStore.tasks"
          :key="t.id"
          :title="t.scope.chapters.join('、')"
          :label="`${t.scope.questionType} · ${t.scope.difficulty} · ${t.scope.studentCount} 人 · 已通过 ${t.items.filter((i) => i.status === 'approved').length}/${t.items.length}`"
          is-link
          @click="activeTaskId = activeTaskId === t.id ? '' : t.id"
        >
          <template #right-icon>
            <van-tag :color="TASK_STATUS[t.status].color" plain>
              {{ TASK_STATUS[t.status].label }}
            </van-tag>
          </template>
        </van-cell>
        <van-empty v-if="!assessmentStore.tasks.length" description="还没有考核任务" image-size="60" />
      </van-cell-group>

      <!-- 任务复核面板 -->
      <template v-if="activeTask">
        <van-cell-group inset :title="`复核：${activeTask.scope.chapters.join('、')}`">
          <div class="m-review-ops">
            <van-button size="mini" @click="approveAll">批量通过</van-button>
            <van-button
              size="mini"
              type="primary"
              :disabled="activeTask.status === 'published'"
              @click="publish"
            >
              {{ activeTask.status === 'published' ? '已发布' : '发布任务' }}
            </van-button>
          </div>

          <div v-for="item in activeTask.items" :key="item.id" class="m-review-item">
            <div class="m-review-head">
              <span class="m-review-student">
                {{ item.studentName }}（{{ item.discipline }}）
              </span>
              <van-tag :color="ITEM_STATUS[item.status].color" plain>
                {{ ITEM_STATUS[item.status].label }}
              </van-tag>
            </div>

            <template v-if="editingItem === item.id">
              <van-field
                v-model="editingText"
                type="textarea"
                rows="3"
                autosize
              />
              <div class="m-review-ops">
                <van-button size="mini" type="primary" @click="saveEdit(item)">保存</van-button>
                <van-button size="mini" @click="editingItem = ''">取消</van-button>
              </div>
            </template>
            <template v-else>
              <div class="m-review-question">{{ item.question }}</div>
              <div v-if="item.referencePoints" class="m-review-refs">
                参考要点：{{ item.referencePoints }}
              </div>
            </template>

            <div v-if="item.answer" class="m-review-answer">
              <div class="m-review-label">学生作答</div>
              <p class="m-review-text">{{ item.answer }}</p>
              <div class="m-review-label">AI 反馈</div>
              <p class="m-review-text">{{ item.aiFeedback }}</p>
            </div>

            <div class="m-review-ops">
              <template v-if="editingItem !== item.id">
                <van-button size="mini" plain type="primary" @click="startEdit(item)">编辑</van-button>
                <van-button
                  v-if="item.status !== 'approved'"
                  size="mini"
                  type="success"
                  @click="approve(item)"
                >
                  通过
                </van-button>
                <van-button
                  v-if="item.status !== 'rejected'"
                  size="mini"
                  plain
                  type="danger"
                  @click="reject(item)"
                >
                  驳回
                </van-button>
              </template>
              <template v-if="item.teacherScore != null">
                <span class="m-score-text">得分 {{ item.teacherScore }}</span>
              </template>
              <template v-else>
                <van-field
                  v-model.number="scoring[item.id]"
                  class="m-score-field"
                  type="digit"
                  placeholder="0-100"
                />
                <van-button size="mini" plain type="warning" @click="score(item)">评分</van-button>
              </template>
            </div>
          </div>
        </van-cell-group>
      </template>
    </template>

    <!-- ================= 学生视图 ================= -->
    <template v-else-if="isStudent">
      <van-cell-group inset :title="studentSectionTitle">
        <div v-if="myItems.length" class="m-student-items">
          <div v-for="entry in myItems" :key="entry.item.id" class="m-student-item">
            <div class="m-student-head">
              <span class="m-student-chapter">{{ entry.task.scope.chapters.join('、') }}</span>
              <van-tag :color="TASK_STATUS.published.color" plain>
                {{ entry.task.scope.questionType }} · {{ entry.task.scope.difficulty }}
              </van-tag>
              <van-tag v-if="entry.item.teacherScore != null" color="#ee0a24" plain>
                得分 {{ entry.item.teacherScore }}
              </van-tag>
            </div>
            <div class="m-student-question">
              {{ entry.item.question }}
              <!-- 墨读皮肤：得分以朱砂圆形印章盖在「面试函」落款处 -->
              <span v-if="entry.item.teacherScore != null" class="mo-stamp">
                {{ entry.item.teacherScore }}
              </span>
            </div>

            <template v-if="entry.item.answer">
              <div class="m-review-answer">
                <div class="m-review-label">我的作答</div>
                <p class="m-review-text">{{ entry.item.answer }}</p>
                <div class="m-review-label">AI 反馈</div>
                <p class="m-review-text">{{ entry.item.aiFeedback }}</p>
              </div>
            </template>
            <template v-else>
              <div class="skin-paper">
                <van-field
                  v-model="answers[entry.item.id]"
                  type="textarea"
                  rows="3"
                  autosize
                  placeholder="请像面对面试官一样，完整写下你的表达"
                />
              </div>
              <div class="m-review-ops">
                <van-button
                  size="mini"
                  type="primary"
                  :loading="submitting"
                  @click="submitAnswer(entry)"
                >
                  提交作答
                </van-button>
              </div>
            </template>
          </div>
        </div>
        <van-empty v-else description="老师还没有发布分配给您的题目" image-size="60" />
      </van-cell-group>
    </template>

    <van-empty v-else description="当前角色暂无考核功能" image-size="60" />

    <!-- 弹层 -->
    <van-popup v-model:show="showChapterPicker" position="bottom">
      <van-picker
        :columns="chapterOptions"
        @confirm="({ selectedOptions }) => {
          const v = selectedOptions[0]?.value
          if (!scope.chapters.includes(v)) scope.chapters.push(v)
          showChapterPicker = false
        }"
        @cancel="showChapterPicker = false"
      />
      <div class="m-picker-footer">
        <van-button size="small" plain type="primary" @click="showChapterPicker = false">
          完成（已选 {{ scope.chapters.length }} 个章节）
        </van-button>
      </div>
    </van-popup>

    <van-popup v-model:show="showTypePicker" position="bottom">
      <van-picker
        :columns="ASSESSMENT_TYPES"
        @confirm="({ selectedOptions }) => { scope.questionType = selectedOptions[0]?.value; showTypePicker = false }"
        @cancel="showTypePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showDifficultyPicker" position="bottom">
      <van-picker
        :columns="DIFFICULTY_OPTIONS"
        @confirm="({ selectedOptions }) => { scope.difficulty = selectedOptions[0]?.value; showDifficultyPicker = false }"
        @cancel="showDifficultyPicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped>
.m-student-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.m-student-name {
  font-size: 13px;
}

.m-student-discipline {
  margin-left: 4px;
  font-size: 11px;
  color: var(--text-sub);
}

.m-gen-wrap {
  padding: 10px 16px 0;
}

.m-gen-tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--brand);
}

.m-review-ops {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  flex-wrap: wrap;
}

.m-review-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.m-review-item:last-child {
  border-bottom: none;
}

.m-review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.m-review-student {
  font-size: 14px;
  font-weight: 600;
}

.m-review-question {
  font-size: 13px;
  line-height: 1.8;
}

.m-review-refs {
  margin-top: 6px;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: 6px;
}

.m-review-answer {
  margin-top: 10px;
  padding: 10px 12px;
  background: var(--bg-page);
  border-radius: 8px;
}

.m-review-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--brand);
}

.m-review-text {
  margin: 4px 0 10px;
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.m-review-text:last-child {
  margin-bottom: 0;
}

.m-score-field {
  width: 80px;
  padding: 4px 10px;
  background: var(--bg-page);
  border-radius: 16px;
}

.m-score-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--brand);
}

.m-student-items {
  padding: 4px 0;
}

.m-student-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.m-student-item:last-child {
  border-bottom: none;
}

.m-student-head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.m-student-chapter {
  font-size: 13px;
  font-weight: 600;
  color: var(--brand);
}

.m-student-question {
  position: relative;
  padding: 10px 12px;
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
}

/* 学生作答区：云课笺为圆角卡（墨读下由 skins.css 覆写为稿纸） */
.skin-paper {
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  overflow: hidden;
  background: var(--card-bg);
}

.m-picker-footer {
  padding: 10px 16px;
  text-align: center;
}
</style>
