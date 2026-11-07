<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useCompetitionStore } from '@/stores/competition'
import { useCourseStudioStore } from '@/stores/courseStudio'
import {
  buildCompetitionBlueprint,
  buildFlattenedRecommendations,
  buildQualityIssuesCsv,
  buildValidRecordsCsv,
  toCsv,
} from '@/competition/analysis'
import { textbookExcerptById } from '@/competition/textbookExcerpts'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const store = useCompetitionStore()
const courseStudioStore = useCourseStudioStore()

const isTeacher = computed(() =>
  ['teacher', 'admin', 'ta'].includes(userStore.role),
)
const activeStep = ref('data')
const selectedRecord = ref(null)
const importInput = ref()
const importing = ref(false)
const generating = ref(false)
const editDialogVisible = ref(false)
const editAction = ref(null)
const editForm = ref({
  title: '',
  description: '',
  reason: '',
  completionStandard: '',
  teacherReason: '',
})

const teacherSteps = [
  { key: 'data', no: '01', title: '内容与数据', desc: '课程要求、材料出处、数据质量' },
  { key: 'analysis', no: '02', title: '学情分析', desc: '个体、群体、共性与差异' },
  { key: 'plan', no: '03', title: '建议与核验', desc: '教师调整、证据链、成果导出' },
  { key: 'checkup', no: '04', title: '学习体检', desc: '盲区、证据与优先处理顺序' },
]
const studentSteps = [
  { key: 'analysis', no: '01', title: '我的学情', desc: '已有表现与信息不足' },
  { key: 'plan', no: '02', title: '学习路径', desc: '先学什么、为什么、用什么材料' },
  { key: 'data', no: '03', title: '内容图谱', desc: '课程要求与材料出处' },
  { key: 'checkup', no: '04', title: '学习体检', desc: '我的盲区与下一步行动' },
]
const steps = computed(() => (isTeacher.value ? teacherSteps : studentSteps))

const overview = computed(() => store.overview)
const quality = computed(() => store.analysis.quality)
const group = computed(() => store.analysis.group)
const curriculum = computed(() => store.dataset)
const datasetOfficial = computed(() => !!curriculum.value.meta?.official)
const datasetStatusTitle = computed(() =>
  datasetOfficial.value
    ? '已接入赛方正式模拟学情数据，仅限本次比赛使用。'
    : '当前为固定种子开发样例，不是赛方正式数据。',
)
const datasetStatusDescription = computed(
  () =>
    curriculum.value.meta?.disclaimer ||
    '正式数据到位后，可通过“导入数据”替换原始记录，分析与导出逻辑保持不变。',
)
/** 学科方向拆分（2026-11-07）：数据集显式归属某位教师，不再默认挂在唯一教师账号下 */
const datasetOwnerLabel = computed(() => {
  const meta = curriculum.value.meta || {}
  const owner = meta.ownerTeacher || '待指定'
  const subject = meta.subject ? ` · ${meta.subject}` : ''
  const grade = meta.grade ? ` · ${meta.grade}` : ''
  return `${owner}${subject}${grade}`
})
/** 当前教师/助教查看的是否为非本人负责的学科数据（管理员不限） */
const datasetOwnerMismatch = computed(() => {
  const meta = curriculum.value.meta || {}
  if (!meta.ownerTeacherId || !isTeacher.value) return false
  if (userStore.role === 'admin') return false
  return userStore.user?.id !== meta.ownerTeacherId
})
const selectedStudentId = computed({
  get: () =>
    store.selectedStudentId ||
    (isTeacher.value
      ? group.value.learners[0]?.studentId
      : store.linkedStudentId) ||
    '',
  set: (value) => store.selectStudent(value),
})
const selectedLearner = computed(
  () =>
    store.analysis.learners.find((item) => item.studentId === selectedStudentId.value) ||
    store.currentLearner,
)
const selectedRecommendation = computed(() =>
  selectedStudentId.value === store.linkedStudentId
    ? store.currentRecommendation
    : store.analysis.recommendations.find(
        (item) => item.studentId === selectedStudentId.value,
      ),
)
const selectedRecords = computed(() =>
  quality.value.validRecords
    .filter((record) => record.studentId === selectedStudentId.value)
    .slice()
    .sort((a, b) => String(b.attemptedAt).localeCompare(String(a.attemptedAt)))
    .slice(0, 12),
)
const checkupSignals = computed(() => {
  const learner = selectedLearner.value
  const recommendation = selectedRecommendation.value
  return {
    weakRequirements: learner?.weakRequirements || [],
    observations: (recommendation?.actions || []).filter(
      (item) => item.actionType === 'observation',
    ),
    actions: (recommendation?.actions || []).slice(0, 4),
    status: learner?.status || 'insufficient',
  }
})
const teacherAdjustmentCount = computed(() =>
  Object.values(store.adjustments || {}).reduce(
    (sum, perRecommendation) => sum + Object.keys(perRecommendation || {}).length,
    0,
  ),
)

const materialById = computed(
  () => new Map((curriculum.value.materials || []).map((item) => [item.id, item])),
)
const questionById = computed(
  () => new Map((curriculum.value.questions || []).map((item) => [item.id, item])),
)
const requirementById = computed(
  () =>
    new Map((curriculum.value.requirements || []).map((item) => [item.id, item])),
)

function requirementTitle(id) {
  return requirementById.value.get(id)?.title || id
}

function materialTitle(id) {
  return materialById.value.get(id)?.title || id
}

/**
 * 教材摘录（2026-11-07 数据可用性改造）：
 * 要求关联的教材中，优先返回已提取正文摘录的那本（B02/B05/B06）；
 * 其余教材（B01/B03/B04/B07/B08）未提取正文，返回 null，
 * 界面走“仅索引”态——chip 仍可点开看出处，但不提供摘录面板。
 */
function requirementExcerpt(requirement) {
  for (const id of requirement.materialIds || []) {
    const excerpt = textbookExcerptById(id)
    if (excerpt) return excerpt
  }
  return null
}
const expandedExcerptId = ref('')
function toggleExcerpt(id) {
  expandedExcerptId.value = expandedExcerptId.value === id ? '' : id
}
/** 证据详情对话框：选中教材时展示其摘录正文 */
const selectedRecordExcerpt = computed(() =>
  selectedRecord.value ? textbookExcerptById(selectedRecord.value.id) : null,
)

/** 字段说明数据字典：按数据表分组（来自 fields.csv，共 42 条） */
const fieldDictionary = computed(() => {
  const groups = new Map()
  for (const item of curriculum.value.fieldDefinitions || []) {
    if (!groups.has(item.table)) groups.set(item.table, [])
    groups.get(item.table).push(item)
  }
  return [...groups.entries()].map(([table, fields]) => ({ table, fields }))
})
const fieldFilterTable = ref('全部')
const fieldTableOptions = computed(() => [
  '全部',
  ...fieldDictionary.value.map((item) => item.table),
])
const visibleFieldGroups = computed(() =>
  fieldFilterTable.value === '全部'
    ? fieldDictionary.value
    : fieldDictionary.value.filter((item) => item.table === fieldFilterTable.value),
)

/** 数据边界与合规声明（与 docs/competition/DATA-AVAILABILITY-2026-11-07.md 第 5 节一致） */
const dataBoundaries = [
  '学生、班级、分数与作答过程均为模拟数据，仅限本次比赛开发、分析与展示，禁止引入真实学生个人信息；',
  '教材切片“不涉及版权问题，仅供个人学习使用”（资料说明原文）；',
  '教材正文为修复文本层乱码后的摘录，可能与纸质教材存在排版差异，核对请以原书为准；',
  '课标仅呈现整理编号与页码索引，未做 OCR 全文；',
  '独立评测数据由赛方在评审时另行提供，当前产品不包含、不预测。',
]

function questionTitle(id) {
  return questionById.value.get(id)?.stem || id
}

function statusLabel(status) {
  return (
    {
      ready: '可分析',
      partial: '信息偏少',
      insufficient: '信息不足',
      weak: '需优先补强',
      developing: '正在形成',
      strong: '表现稳定',
      low_confidence: '样本偏少',
    }[status] || status
  )
}

function statusType(status) {
  if (['ready', 'strong'].includes(status)) return 'success'
  if (['partial', 'developing', 'low_confidence'].includes(status)) return 'warning'
  if (status === 'weak') return 'danger'
  return 'info'
}

function actionTypeLabel(type) {
  return (
    {
      observation: '补充观察',
      prerequisite: '补前置',
      relearn: '重讲',
      retrieval: '检索练习',
      transfer: '迁移应用',
      maintain: '保持复习',
    }[type] || type
  )
}

function issueType(code) {
  if (code === 'duplicate_record_id') return 'warning'
  if (code === 'derived_value') return 'info'
  return 'danger'
}

function actionStatusType(status) {
  if (status === 'accepted') return 'success'
  if (status === 'edited') return 'warning'
  if (status === 'rejected') return 'info'
  return 'primary'
}

function selectStep(key) {
  activeStep.value = key
}

function openImport() {
  importInput.value?.click()
}

async function handleImport(event) {
  const file = event.target.files?.[0]
  if (!file) return
  importing.value = true
  try {
    await store.importFile(file)
    ElMessage.success(
      `${file.name} 已导入；原始记录保留，质量问题已单独列出。`,
    )
  } catch (error) {
    ElMessage.error(error.message || '导入失败')
  } finally {
    importing.value = false
    event.target.value = ''
  }
}

async function resetSample() {
  try {
    await ElMessageBox.confirm(
      '将清除当前导入数据并重新载入赛方模拟学情数据。教师调整记录会保留。',
      '重新载入赛方数据',
      {
        confirmButtonText: '重新载入',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    await store.resetDataset()
    ElMessage.success('已重新载入赛方模拟学情数据')
  } catch {
    // 用户取消
  }
}

async function acceptAction(item) {
  await store.adjustAction(selectedRecommendation.value.id, item.id, {
    status: 'accepted',
    reason: '教师复核通过',
  })
  ElMessage.success('已记录教师复核')
}

async function rejectAction(item) {
  await store.adjustAction(selectedRecommendation.value.id, item.id, {
    status: 'rejected',
    reason: '教师复核后移除',
  })
  ElMessage.info('已从当前建议中移除，保留调整记录')
}

function openEdit(item) {
  editAction.value = item
  editForm.value = {
    title: item.title || '',
    description: item.description || '',
    reason: item.reason || '',
    completionStandard: item.completionStandard || '',
    teacherReason: '',
  }
  editDialogVisible.value = true
}

async function saveEdit() {
  if (!editAction.value || !selectedRecommendation.value) return
  if (!editForm.value.teacherReason.trim()) {
    ElMessage.warning('请填写教师调整依据')
    return
  }
  await store.adjustAction(selectedRecommendation.value.id, editAction.value.id, {
    status: 'edited',
    patch: {
      title: editForm.value.title.trim(),
      description: editForm.value.description.trim(),
      reason: editForm.value.reason.trim(),
      completionStandard: editForm.value.completionStandard.trim(),
    },
    reason: editForm.value.teacherReason.trim(),
  })
  editDialogVisible.value = false
  ElMessage.success('调整已保存并纳入审计记录')
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function downloadPackage() {
  const JSZipModule = await import('jszip')
  const JSZip = JSZipModule.default || JSZipModule
  const zip = new JSZip()
  const pkg = store.taskPackage()
  zip.file('manifest.json', JSON.stringify(pkg.manifest, null, 2))
  zip.file('curriculum.json', JSON.stringify(pkg.curriculum, null, 2))
  zip.file('data-quality.json', JSON.stringify(pkg.dataQuality, null, 2))
  zip.file('student-analysis.json', JSON.stringify(pkg.studentAnalysis, null, 2))
  zip.file('group-analysis.json', JSON.stringify(pkg.groupAnalysis, null, 2))
  zip.file('recommendations.json', JSON.stringify(pkg.recommendations, null, 2))
  zip.file(
    'recommendations-flat.csv',
    toCsv(buildFlattenedRecommendations(store.analysis), [
      'recommendationId',
      'studentId',
      'studentName',
      'order',
      'actionType',
      'title',
      'requirementId',
      'materialIds',
      'questionIds',
      'reason',
      'completionStandard',
      'estimatedMinutes',
      'uncertainty',
      'scope',
    ]),
  )
  zip.file('case-verification.json', JSON.stringify(pkg.caseVerification, null, 2))
  zip.file('records-valid.csv', buildValidRecordsCsv(store.analysis))
  zip.file('records-quality-issues.csv', buildQualityIssuesCsv(store.analysis))
  zip.file('schema.json', JSON.stringify(pkg.schema, null, 2))
  zip.file(
    'input-sample.json',
    JSON.stringify(
      {
        meta: store.dataset.meta,
        students: store.dataset.students.slice(0, 5),
        questions: store.dataset.questions.slice(0, 6),
        learningRecords: store.dataset.learningRecords.slice(0, 24),
      },
      null,
      2,
    ),
  )
  zip.file(
      'competition-dataset.json',
    JSON.stringify(store.dataset, null, 2),
  )
  zip.file(
    'teacher-adjustments.json',
    JSON.stringify(pkg.teacherAdjustments, null, 2),
  )
  zip.file(
    'verification-report.json',
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        datasetVersion: store.dataset.meta?.version || '',
        analysisVersion: store.analysis.meta?.analysisVersion || '',
        officialData: !!store.dataset.meta?.official,
        checks: {
          topics: store.dataset.topics.length,
          students: store.dataset.students.length,
          rawRecords: store.analysis.quality.rawCount,
          validRecords: store.analysis.quality.validCount,
          qualityIssues: store.analysis.quality.issues.length,
          recommendations: store.analysis.recommendations.length,
        },
      },
      null,
      2,
    ),
  )
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = '智慧学伴任务成果包.zip'
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function downloadJson(filename, value) {
  downloadBlob(
    filename,
    JSON.stringify(value, null, 2),
    'application/json;charset=utf-8',
  )
}

function downloadCsv(filename, content) {
  downloadBlob(filename, `\uFEFF${content}`, 'text/csv;charset=utf-8')
}

async function generatePersonalCourse(mode = 'course') {
  if (!store.currentLearner || !store.currentRecommendation) return
  generating.value = true
  try {
    const blueprint = buildCompetitionBlueprint(
      store.dataset,
      store.currentLearner,
      store.currentRecommendation,
      mode,
    )
    const input = {
      chapter: store.currentLearner.weakRequirements[0]?.topicTitle || '七年级数学',
      objective: store.currentRecommendation.summary,
      audience: '七年级学生',
      mode,
      durationMinutes: mode === 'sprint' ? 30 : 40,
      domain: 'math7',
      competitionStudentId: store.currentLearner.studentId,
      recommendationId: store.currentRecommendation.id,
    }
    const saved = await courseStudioStore.createDraft({
      ownerId: userStore.user?.id || '',
      input,
      result: {
        blueprint,
        sources: (store.currentRecommendation.actions || [])
          .flatMap((item) => item.materialIds || [])
          .map((id) => materialById.value.get(id))
          .filter(Boolean)
          .map((item) => ({
            id: item.id,
            title: item.title,
            chapter: item.locator,
          })),
        fallback: true,
      },
    })
    await router.push({ path: '/app/studio', query: { project: saved.id } })
  } catch (error) {
    ElMessage.error(error.message || '课程大纲创建失败')
  } finally {
    generating.value = false
  }
}

function openRecord(record) {
  selectedRecord.value = record
}

watch(
  () => group.value.learners,
  (learners) => {
    if (isTeacher.value && !store.selectedStudentId && learners.length) {
      store.selectStudent(learners[0].studentId)
    }
  },
  { immediate: true },
)

onMounted(async () => {
  await store.load()
  if (String(route.query.step || '') === 'checkup') {
    activeStep.value = 'checkup'
  }
  if (!isTeacher.value) {
    if (activeStep.value !== 'checkup') activeStep.value = 'analysis'
    if (!store.selectedStudentId) {
      store.selectStudent(store.linkedStudentId)
    }
  }
})
</script>

<template>
  <div class="cw-page" data-testid="competition-workbench">
    <header class="cw-head">
      <div>
        <div class="cw-kicker">SMART LEARNING COMPANION · 赛事模式</div>
        <h1>智慧学伴工作台</h1>
        <p>
          一个工作台完成内容梳理、数据检查、个体与群体诊断、建议复核和成果导出。
          统计与排序由规则引擎完成，模型只负责解释和课程表达。
        </p>
        <p class="cw-owner">
          数据归属：<strong>{{ datasetOwnerLabel }}</strong>
          <span v-if="datasetOwnerMismatch">· 非本人负责的学科数据，你的调整会记录操作账号</span>
        </p>
      </div>
      <div class="cw-head-actions">
        <el-button v-if="isTeacher" plain :loading="importing" @click="openImport">
          导入数据
        </el-button>
        <input
          ref="importInput"
          class="cw-hidden-input"
          type="file"
          accept=".json,.csv,application/json,text/csv"
          @change="handleImport"
        />
        <el-button type="primary" @click="downloadPackage">导出任务成果包</el-button>
      </div>
    </header>

    <el-alert
      class="cw-alert"
      :type="datasetOfficial ? 'success' : 'warning'"
      :closable="false"
      show-icon
      :title="datasetStatusTitle"
      :description="datasetStatusDescription"
    />

    <nav class="cw-steps" aria-label="工作台步骤">
      <button
        v-for="step in steps"
        :key="step.key"
        type="button"
        :class="{ on: activeStep === step.key }"
        @click="selectStep(step.key)"
      >
        <span class="cw-step-no">{{ step.no }}</span>
        <span class="cw-step-copy">
          <strong>{{ step.title }}</strong>
          <small>{{ step.desc }}</small>
        </span>
      </button>
    </nav>

    <section v-if="activeStep === 'checkup'" class="cw-section checkup-section">
      <div class="cw-section-title">
        <div>
          <span>LEARNING CHECKUP</span>
          <h2>学习体检与行动优先级</h2>
          <p>用已有记录定位盲区、证据缺口和下一步，不把“没测过”误判成“不会”。</p>
        </div>
        <el-tag :type="statusType(checkupSignals.status)" effect="plain">
          {{ statusLabel(checkupSignals.status) }}
        </el-tag>
      </div>

      <div class="cw-stat-grid">
        <article>
          <span>待补强要求</span>
          <strong>{{ checkupSignals.weakRequirements.length }}</strong>
          <small>按证据强度排序</small>
        </article>
        <article>
          <span>建议动作</span>
          <strong>{{ checkupSignals.actions.length }}</strong>
          <small>可继续执行</small>
        </article>
        <article>
          <span>信息缺口</span>
          <strong>{{ checkupSignals.observations.length }}</strong>
          <small>先观察再下结论</small>
        </article>
        <article>
          <span>当前学习者</span>
          <strong>{{ selectedLearner?.studentName || '当前学生' }}</strong>
          <small>{{ isTeacher ? '教师视角' : '我的报告' }}</small>
        </article>
      </div>

      <div class="cw-two-col">
        <article class="cw-card">
          <div class="cw-card-head">
            <div>
              <h2>优先处理顺序</h2>
              <p>薄弱要求按“考核影响 × 证据强弱”排列。</p>
            </div>
          </div>
          <div class="checkup-list">
            <div
              v-for="(item, index) in checkupSignals.weakRequirements.slice(0, 6)"
              :key="item.requirementId || item.topicTitle || index"
            >
              <span class="checkup-rank">{{ String(index + 1).padStart(2, '0') }}</span>
              <div>
                <strong>{{ item.topicTitle || item.title || item.requirementId }}</strong>
                <small>{{ item.reason || item.uncertainty || '建议结合最近一次作答证据复核。' }}</small>
              </div>
              <el-tag size="small" type="warning" effect="plain">优先补强</el-tag>
            </div>
          </div>
        </article>

        <article class="cw-card">
          <div class="cw-card-head">
            <div>
              <h2>下一步怎么做</h2>
              <p>与学习路径使用同一份建议，不另造一套结论。</p>
            </div>
          </div>
          <div class="checkup-actions">
            <div v-for="item in checkupSignals.actions" :key="item.id">
              <span>{{ actionTypeLabel(item.actionType) }}</span>
              <strong>{{ item.title }}</strong>
              <small>{{ item.completionStandard || item.description }}</small>
            </div>
          </div>
          <div class="checkup-cta">
            <el-button type="primary" @click="activeStep = 'plan'">查看完整学习路径</el-button>
            <el-button @click="router.push('/app/selftest')">做一组摸底自测</el-button>
          </div>
        </article>
      </div>
    </section>

    <section v-if="activeStep === 'data'" class="cw-section">
      <div class="cw-stat-grid">
        <article>
          <span>学习主题</span>
          <strong>{{ overview.topics }}</strong>
          <small>首批范围</small>
        </article>
        <article>
          <span>课程要求</span>
          <strong>{{ overview.requirements }}</strong>
          <small>官方观察指标</small>
        </article>
        <article>
          <span>材料 / 题目</span>
          <strong>{{ overview.materials }} / {{ overview.questions }}</strong>
          <small>可回指出处</small>
        </article>
        <article>
          <span>学生 / 原始记录</span>
          <strong>{{ overview.students }} / {{ overview.records }}</strong>
          <small>{{ datasetOfficial ? '赛方脱敏模拟数据' : '脱敏开发样例' }}</small>
        </article>
      </div>

      <div class="cw-two-col">
        <article class="cw-card">
          <div class="cw-card-head">
            <div>
              <h2>数据质量</h2>
              <p>先报告问题，再决定哪些记录进入统计。</p>
            </div>
            <el-tag :type="quality.rejectedCount ? 'warning' : 'success'" effect="plain">
              {{ quality.rejectedCount }} 条未进入分析
            </el-tag>
          </div>
          <div class="cw-quality-grid">
            <div><span>有效记录</span><strong>{{ quality.validCount }}</strong></div>
            <div><span>修订覆盖</span><strong>{{ quality.supersededRevisionCount }}</strong></div>
            <div><span>待评分</span><strong>{{ quality.pendingReviewCount }}</strong></div>
            <div><span>重复记录</span><strong>{{ quality.duplicateCount }}</strong></div>
            <div><span>异常引用</span><strong>{{ quality.anomalyCount }}</strong></div>
            <div><span>缺失字段</span><strong>{{ quality.missingFieldCount }}</strong></div>
            <div><span>缺失观察</span><strong>{{ quality.missingObservationCount }}</strong></div>
            <div><span>自动补全</span><strong>{{ quality.derivedCount }}</strong></div>
          </div>
          <div class="cw-policy-list">
            <p v-for="item in quality.policy" :key="item">{{ item }}</p>
          </div>
          <el-table
            :data="quality.issues"
            size="small"
            max-height="260"
            empty-text="没有发现数据质量问题"
          >
            <el-table-column prop="recordId" label="记录" width="130" show-overflow-tooltip />
            <el-table-column label="问题" min-width="150">
              <template #default="{ row }">
                <el-tag size="small" :type="issueType(row.code)" effect="plain">
                  {{ row.message }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="action" label="处理方式" min-width="180" show-overflow-tooltip />
          </el-table>
          <div v-if="isTeacher" class="cw-sub-actions">
            <el-button plain @click="openImport">导入正式数据包</el-button>
            <el-button text @click="resetSample">重新载入赛方数据</el-button>
          </div>
        </article>

        <article class="cw-card">
          <div class="cw-card-head">
            <div>
              <h2>课程要求与材料出处</h2>
              <p>主题 → 要求 → 前置关系 → 材料 / 题目。</p>
            </div>
            <el-tag effect="plain">归属：{{ datasetOwnerLabel }}</el-tag>
            <el-tag effect="plain">{{ curriculum.meta?.version }}</el-tag>
          </div>
          <div class="cw-topic-list">
            <section v-for="topic in curriculum.topics" :key="topic.id" class="cw-topic">
              <div class="cw-topic-head">
                <span>{{ topic.id }}</span>
                <div>
                  <strong>{{ topic.title }}</strong>
                  <small>{{ topic.summary }}</small>
                </div>
              </div>
              <div class="cw-requirement-list">
                <div
                  v-for="requirement in curriculum.requirements.filter(
                    (item) => item.topicId === topic.id,
                  )"
                  :key="requirement.id"
                  class="cw-requirement"
                >
                  <div>
                    <b>{{ requirement.code }}</b>
                    <strong>{{ requirement.title }}</strong>
                  </div>
                  <p>{{ requirement.content }}</p>
                  <div class="cw-link-line">
                    <span>要求：{{ requirement.expectation }}</span>
                    <span>出处：{{ requirement.sourceRef }}</span>
                    <span v-if="requirement.prerequisiteIds.length">
                      前置：{{ requirement.prerequisiteIds.map(requirementTitle).join('、') }}
                    </span>
                  </div>
                  <div class="cw-resource-chips">
                    <button
                      v-for="materialId in requirement.materialIds"
                      :key="materialId"
                      type="button"
                      :class="{ 'cw-chip-has-excerpt': !!textbookExcerptById(materialId) }"
                      @click="selectedRecord = materialById.get(materialId)"
                    >
                      {{ materialTitle(materialId) }}
                    </button>
                    <button
                      v-if="requirementExcerpt(requirement)"
                      type="button"
                      class="cw-chip-action"
                      @click="toggleExcerpt(requirement.id)"
                    >
                      {{ expandedExcerptId === requirement.id ? '收起教材摘录' : '展开教材摘录' }}
                    </button>
                    <span>{{ requirement.questionIds.length }} 道题</span>
                  </div>
                  <div
                    v-if="expandedExcerptId === requirement.id && requirementExcerpt(requirement)"
                    class="cw-excerpt-panel"
                  >
                    <p class="cw-excerpt-note">
                      以下为修复文本层乱码后的教材摘录，仅供出处核对与阅读参考；
                      矢量线条符号可能缺失，与纸质教材或有排版差异，核对以原书为准。
                    </p>
                    <article
                      v-for="section in requirementExcerpt(requirement).sections"
                      :key="`${section.code}-${section.title}`"
                      class="cw-excerpt-section"
                    >
                      <h4>
                        <span v-if="section.code" class="cw-excerpt-code">{{ section.code }}</span>
                        {{ section.title }}
                        <small>教材第 {{ section.pages[0] }}—{{ section.pages[1] }} 页</small>
                      </h4>
                      <p v-for="(paragraph, index) in section.paragraphs" :key="index">
                        {{ paragraph }}
                      </p>
                    </article>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </article>
      </div>

      <div class="cw-two-col">
        <article class="cw-card">
          <div class="cw-card-head">
            <div>
              <h2>字段说明数据字典</h2>
              <p>
                赛方五张数据表（字段说明.csv 覆盖范围）的字段类型、含义、取值与为空规则，共
                {{ (curriculum.fieldDefinitions || []).length }} 条。
              </p>
            </div>
            <el-select v-model="fieldFilterTable" size="small" style="width: 132px">
              <el-option
                v-for="option in fieldTableOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>
          </div>
          <div class="cw-dict">
            <section v-for="group in visibleFieldGroups" :key="group.table" class="cw-dict-group">
              <h3>
                {{ group.table }}
                <small>{{ group.fields.length }} 个字段</small>
              </h3>
              <el-table :data="group.fields" size="small" max-height="240">
                <el-table-column prop="field" label="字段" width="128" show-overflow-tooltip />
                <el-table-column prop="type" label="类型" width="56" />
                <el-table-column prop="meaning" label="含义" min-width="130" show-overflow-tooltip />
                <el-table-column prop="format" label="取值 / 格式" min-width="100" show-overflow-tooltip />
                <el-table-column prop="example" label="示例" width="86" show-overflow-tooltip />
                <el-table-column prop="whenEmpty" label="为空时" width="64" show-overflow-tooltip />
              </el-table>
            </section>
          </div>
        </article>

        <article class="cw-card">
          <div class="cw-card-head">
            <div>
              <h2>数据边界与合规声明</h2>
              <p>哪些数据可用、用到什么程度、哪些不呈现，在此固定声明。</p>
            </div>
          </div>
          <ol class="cw-boundary-list">
            <li v-for="(item, index) in dataBoundaries" :key="index">{{ item }}</li>
          </ol>
        </article>
      </div>
    </section>

    <section v-if="activeStep === 'analysis'" class="cw-section">
      <template v-if="isTeacher">
        <div class="cw-stat-grid">
          <article>
            <span>可分析学生</span>
            <strong>{{ group.activeStudentCount }} / {{ group.studentCount }}</strong>
            <small>至少 1 条有效观察</small>
          </article>
          <article>
            <span>群体得分率</span>
            <strong>{{ group.scoreRatePct }}%</strong>
            <small>{{ group.observedCount }} 条有效观察</small>
          </article>
          <article>
            <span>确认共性薄弱点</span>
            <strong>{{ group.commonGaps.length }}</strong>
            <small>满足样本与覆盖门槛</small>
          </article>
          <article>
            <span>信息不足要求</span>
            <strong>{{ group.insufficientRequirements.length }}</strong>
            <small>不判定为未掌握</small>
          </article>
        </div>

        <div class="cw-two-col cw-analysis-layout">
          <article class="cw-card">
            <div class="cw-card-head">
              <div>
                <h2>群体与小组</h2>
                <p>共性问题必须满足记录数和受影响学生门槛。</p>
              </div>
            </div>
            <div class="cw-group-bars">
              <div v-for="row in group.groups" :key="row.group">
                <div class="cw-group-label">
                  <span>{{ row.group }} · {{ row.studentCount }} 人</span>
                  <b>{{ row.scoreRatePct }}%</b>
                </div>
                <el-progress
                  :percentage="row.scoreRatePct"
                  :show-text="false"
                  :stroke-width="7"
                />
                <small>
                  覆盖 {{ row.coveragePct }}% 要求 · {{ row.weakStudentCount }} 人存在薄弱项
                </small>
              </div>
            </div>
            <div class="cw-issue-block">
              <h3>确认的共同薄弱点</h3>
              <div v-if="group.commonGaps.length" class="cw-gap-list">
                <div v-for="gap in group.commonGaps" :key="gap.requirementId">
                  <strong>{{ gap.requirementCode }} · {{ gap.requirementTitle }}</strong>
                  <span>
                    得分率 {{ gap.scoreRatePct }}%，{{ gap.observedCount }} 条观察，
                    {{ gap.incorrect }} 次错误。
                  </span>
                </div>
              </div>
              <p v-else class="cw-muted">当前没有达到样本门槛的共同薄弱点。</p>
            </div>
            <div class="cw-issue-block">
              <h3>信息不足项</h3>
              <div class="cw-muted">
                {{
                  group.insufficientRequirements.length
                    ? group.insufficientRequirements
                        .map((item) => item.requirementCode)
                        .join('、')
                    : '所有课程要求的群体覆盖均已达到当前展示门槛。'
                }}
              </div>
            </div>
          </article>

          <article class="cw-card">
            <div class="cw-card-head">
              <div>
                <h2>个体分析</h2>
                <p>切换学生会同时更新证据、建议和教师调整对象。</p>
              </div>
              <el-select v-model="selectedStudentId" filterable style="width: 160px">
                <el-option
                  v-for="item in group.learners"
                  :key="item.studentId"
                  :label="`${item.displayName} · ${item.studentId}`"
                  :value="item.studentId"
                />
              </el-select>
            </div>
            <div v-if="selectedLearner" class="cw-student-summary">
              <div>
                <strong>{{ selectedLearner.displayName }}</strong>
                <span>{{ selectedLearner.studentId }} · {{ selectedLearner.group }}</span>
              </div>
              <el-tag :type="statusType(selectedLearner.status)" effect="plain">
                {{ statusLabel(selectedLearner.status) }}
              </el-tag>
            </div>
            <div v-if="selectedLearner" class="cw-student-numbers">
              <div><span>得分率</span><b>{{ selectedLearner.scoreRatePct }}%</b></div>
              <div><span>有效观察</span><b>{{ selectedLearner.observedCount }}</b></div>
              <div><span>要求覆盖</span><b>{{ selectedLearner.coveragePct }}%</b></div>
              <div><span>薄弱要求</span><b>{{ selectedLearner.weakRequirements.length }}</b></div>
            </div>
            <div v-if="selectedLearner" class="cw-req-bars">
              <div
                v-for="item in selectedLearner.requirementStats"
                :key="item.requirementId"
                class="cw-req-bar"
              >
                <div>
                  <span>
                    <b>{{ item.requirementCode }}</b>
                    {{ item.requirementTitle }}
                  </span>
                  <em>{{ item.observedCount ? `${item.scoreRatePct}%` : '信息不足' }}</em>
                </div>
                <el-progress
                  :percentage="item.observedCount ? item.scoreRatePct : 0"
                  :show-text="false"
                  :stroke-width="6"
                  :status="item.status === 'weak' ? 'exception' : undefined"
                />
              </div>
            </div>
            <el-alert
              v-if="selectedLearner?.limitations?.length"
              type="info"
              :closable="false"
              show-icon
              title="结论边界"
              :description="selectedLearner.limitations.join(' ')"
            />
            <div class="cw-evidence-list">
              <h3>最近证据</h3>
              <button
                v-for="record in selectedRecords"
                :key="record.id"
                type="button"
                @click="openRecord(record)"
              >
                <span>{{ record.id }}</span>
                <strong>{{ record.question?.stem || record.questionId }}</strong>
                <em>{{ record.status }} · {{ record.score ?? '—' }}/{{ record.maxScore }}</em>
              </button>
            </div>
          </article>
        </div>
      </template>

      <template v-else>
        <article v-if="store.currentLearner" class="cw-card cw-student-hero">
          <div>
            <div class="cw-kicker">MY LEARNING EVIDENCE</div>
            <h2>{{ store.currentLearner.displayName }}，先看已有表现，再看信息不足。</h2>
            <p>
              当前有效观察 {{ store.currentLearner.observedCount }} 条，要求覆盖率
              {{ store.currentLearner.coveragePct }}%。没有记录的部分不会被判定为未掌握。
            </p>
          </div>
          <el-tag :type="statusType(store.currentLearner.status)" size="large" effect="plain">
            {{ statusLabel(store.currentLearner.status) }}
          </el-tag>
        </article>
        <div v-if="store.currentLearner" class="cw-stat-grid">
          <article>
            <span>得分率</span>
            <strong>{{ store.currentLearner.scoreRatePct }}%</strong>
            <small>按题目满分归一</small>
          </article>
          <article>
            <span>正确</span>
            <strong>{{ store.currentLearner.correct }}</strong>
            <small>有效观察</small>
          </article>
          <article>
            <span>部分正确 / 错误</span>
            <strong>{{ store.currentLearner.partial }} / {{ store.currentLearner.incorrect }}</strong>
            <small>需要订正</small>
          </article>
          <article>
            <span>缺失观察</span>
            <strong>{{ store.currentLearner.missing }}</strong>
            <small>不进入正确率分母</small>
          </article>
        </div>
        <article v-if="store.currentLearner" class="cw-card">
          <div class="cw-card-head">
            <div>
              <h2>逐项要求</h2>
              <p>绿色只表示当前样本表现稳定；灰色表示信息不足。</p>
            </div>
          </div>
          <div class="cw-requirement-analysis">
            <div
              v-for="item in store.currentLearner.requirementStats"
              :key="item.requirementId"
              class="cw-requirement-analysis-row"
            >
              <div>
                <b>{{ item.requirementCode }}</b>
                <strong>{{ item.requirementTitle }}</strong>
                <span>{{ item.topicTitle }}</span>
              </div>
              <el-progress
                :percentage="item.observedCount ? item.scoreRatePct : 0"
                :stroke-width="7"
                :status="item.status === 'weak' ? 'exception' : undefined"
                :format="() => (item.observedCount ? `${item.scoreRatePct}%` : '信息不足')"
              />
              <p>
                {{ item.observedCount }} 条有效观察，正确 {{ item.correct }}，部分正确
                {{ item.partial }}，错误 {{ item.incorrect }}。
              </p>
            </div>
          </div>
        </article>
      </template>
    </section>

    <section v-if="activeStep === 'plan'" class="cw-section">
      <template v-if="selectedRecommendation">
        <article class="cw-card cw-plan-head">
          <div>
            <div class="cw-kicker">EVIDENCE-BASED PATH</div>
            <h2>{{ selectedRecommendation.studentName }} 的学习路径</h2>
            <p>{{ selectedRecommendation.summary }}</p>
            <small>{{ selectedRecommendation.uncertainty }}</small>
          </div>
          <div class="cw-plan-actions">
            <el-tag v-if="isTeacher" effect="plain">
              教师调整 {{ teacherAdjustmentCount }} 项
            </el-tag>
            <el-button
              v-else
              type="primary"
              :loading="generating"
              @click="generatePersonalCourse('course')"
            >
              生成个性化课程
            </el-button>
            <el-button
              v-if="!isTeacher"
              plain
              :loading="generating"
              @click="generatePersonalCourse('sprint')"
            >
              生成冲刺课
            </el-button>
          </div>
        </article>

        <div class="cw-plan-layout">
          <div class="cw-action-list">
            <article
              v-for="item in selectedRecommendation.actions"
              :key="item.id"
              class="cw-action-card"
            >
              <div class="cw-action-order">{{ String(item.order).padStart(2, '0') }}</div>
              <div class="cw-action-main">
                <div class="cw-action-head">
                  <el-tag size="small" effect="plain">
                    {{ actionTypeLabel(item.type) }}
                  </el-tag>
                  <el-tag
                    v-if="item.teacherDecision"
                    size="small"
                    :type="actionStatusType(item.teacherDecision)"
                    effect="plain"
                  >
                    {{ item.teacherDecision === 'accepted' ? '已通过' : item.teacherDecision === 'edited' ? '已调整' : '已移除' }}
                  </el-tag>
                  <small v-if="item.teacherDecision && item.operatorName" class="cw-action-operator">
                    {{ item.operatorName }} 复核
                  </small>
                  <span>{{ item.estimatedMinutes }} 分钟</span>
                </div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
                <div class="cw-reason">
                  <b>为什么是它</b>
                  <span>{{ item.reason }}</span>
                </div>
                <div class="cw-completion">
                  <b>完成标准</b>
                  <span>{{ item.completionStandard }}</span>
                </div>
                <div class="cw-resource-list">
                  <div>
                    <span>材料</span>
                    <button
                      v-for="id in item.materialIds"
                      :key="id"
                      type="button"
                      @click="selectedRecord = materialById.get(id)"
                    >
                      {{ materialTitle(id) }}
                    </button>
                    <em v-if="!item.materialIds.length">补充观察阶段暂不绑定材料</em>
                  </div>
                  <div>
                    <span>练习</span>
                    <button
                      v-for="id in item.questionIds"
                      :key="id"
                      type="button"
                      @click="selectedRecord = questionById.get(id)"
                    >
                      {{ questionTitle(id) }}
                    </button>
                    <em v-if="!item.questionIds.length">按教师补充任务执行</em>
                  </div>
                </div>
                <div class="cw-evidence-mini">
                  <span>证据：{{ item.evidenceRefs.join('、') || '无可用记录' }}</span>
                </div>
                <div v-if="isTeacher" class="cw-action-tools">
                  <el-button size="small" type="success" plain @click="acceptAction(item)">
                    通过
                  </el-button>
                  <el-button size="small" plain @click="openEdit(item)">调整</el-button>
                  <el-button size="small" text @click="rejectAction(item)">移除</el-button>
                </div>
              </div>
            </article>
          </div>

          <aside class="cw-plan-side">
            <article class="cw-card">
              <div class="cw-card-head">
                <div>
                  <h2>典型案例核验</h2>
                  <p>把要求、证据和建议放在同一条链上。</p>
                </div>
              </div>
              <div class="cw-cases">
                <button
                  v-for="item in store.analysis.cases"
                  :key="item.caseId"
                  type="button"
                  :class="{ on: item.studentId === selectedStudentId }"
                  @click="selectedStudentId = item.studentId"
                >
                  <span>{{ item.studentName }} · {{ item.group }}</span>
                  <strong>{{ item.requirement?.code || '补充观察' }}</strong>
                  <em>
                    {{
                      item.performance
                        ? `${item.performance.scoreRatePct}% · ${item.performance.observedCount} 条观察`
                        : '信息不足'
                    }}
                  </em>
                </button>
              </div>
            </article>

            <article class="cw-card">
              <div class="cw-card-head">
                <div>
                  <h2>成果导出</h2>
                  <p>结构化结果、输入样例、字段说明和教师审计。</p>
                </div>
              </div>
              <div class="cw-export-list">
                <el-button @click="downloadPackage">完整打包 ZIP</el-button>
                <el-button
                  plain
                  @click="
                    downloadJson(
                      'recommendations.json',
                      store.analysis.recommendations,
                    )
                  "
                >
                  建议 JSON
                </el-button>
                <el-button
                  plain
                  @click="
                    downloadCsv(
                      'records-valid.csv',
                      buildValidRecordsCsv(store.analysis),
                    )
                  "
                >
                  有效记录 CSV
                </el-button>
                <el-button
                  plain
                  @click="
                    downloadCsv(
                      'records-quality-issues.csv',
                      buildQualityIssuesCsv(store.analysis),
                    )
                  "
                >
                  质量问题 CSV
                </el-button>
              </div>
              <p class="cw-muted">
                导出包明确标记开发样例与正式数据来源；正式数据仅限本次比赛使用。
              </p>
            </article>
          </aside>
        </div>
      </template>
      <el-empty v-else description="当前没有可展示的学习建议" />
    </section>

    <el-dialog
      v-model="editDialogVisible"
      title="教师调整建议"
      width="min(560px, 92vw)"
    >
      <el-form label-position="top">
        <el-form-item label="任务标题">
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="任务说明">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="调整后的推荐理由">
          <el-input v-model="editForm.reason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="完成标准">
          <el-input v-model="editForm.completionStandard" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="教师调整依据（必填）">
          <el-input
            v-model="editForm.teacherReason"
            type="textarea"
            :rows="2"
            placeholder="例如：该生本周尚未学习前置内容，需延后变式题。"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存并纳入审计</el-button>
      </template>
    </el-dialog>

    <el-dialog
      :model-value="!!selectedRecord"
      title="证据详情"
      width="min(620px, 92vw)"
      @close="selectedRecord = null"
    >
      <template v-if="selectedRecord">
        <div class="cw-record-detail">
          <div><span>编号</span><strong>{{ selectedRecord.id }}</strong></div>
          <div><span>标题 / 题干</span><strong>{{ selectedRecord.title || selectedRecord.stem || selectedRecord.question?.stem || selectedRecord.id }}</strong></div>
          <div v-if="selectedRecord.content"><span>正文</span><p>{{ selectedRecord.content }}</p></div>
          <div v-if="selectedRecord.sourceRef">
            <span>来源</span><strong>{{ selectedRecord.sourceRef }} · {{ selectedRecord.locator }}</strong>
          </div>
          <div v-if="selectedRecord.status">
            <span>作答</span><strong>{{ selectedRecord.status }} · {{ selectedRecord.score ?? '—' }}/{{ selectedRecord.maxScore }}</strong>
          </div>
          <div v-if="selectedRecord.reason"><span>依据</span><p>{{ selectedRecord.reason }}</p></div>
          <div v-if="selectedRecordExcerpt">
            <span>教材摘录</span>
            <div class="cw-dialog-excerpt">
              <p class="cw-excerpt-note">
                修复文本层乱码后的摘录，仅供出处核对与阅读参考，核对以原书为准。
              </p>
              <article
                v-for="section in selectedRecordExcerpt.sections"
                :key="`${section.code}-${section.title}`"
                class="cw-excerpt-section"
              >
                <h4>
                  <span v-if="section.code" class="cw-excerpt-code">{{ section.code }}</span>
                  {{ section.title }}
                  <small>教材第 {{ section.pages[0] }}—{{ section.pages[1] }} 页</small>
                </h4>
                <p v-for="(paragraph, index) in section.paragraphs" :key="index">
                  {{ paragraph }}
                </p>
              </article>
            </div>
          </div>
          <div v-else-if="selectedRecord.type === 'textbook'">
            <span>教材摘录</span>
            <p class="cw-dialog-excerpt-empty">
              该教材切片仅接入章级索引，未提取正文摘录（详见数据边界说明）。
            </p>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.cw-page {
  max-width: 1480px;
  margin: 0 auto;
  color: var(--text-main);
}

.cw-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 16px;
}

.cw-kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1.8px;
  color: var(--accent);
}

.cw-head h1 {
  margin: 6px 0 8px;
  font-family: var(--font-calligraphy);
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 400;
}

.cw-head p {
  max-width: 760px;
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--text-sub);
}

/* 数据归属行：学科方向拆分后，赛事数据显式归属李老师（数学） */
.cw-owner {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px !important;
  font-size: 12px;
  color: var(--text-sub);
}

.cw-owner strong {
  color: var(--accent);
  font-weight: 600;
}

.cw-owner span {
  color: var(--text-faint);
}

.cw-head-actions,
.cw-plan-actions,
.cw-sub-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cw-hidden-input {
  display: none;
}

.cw-alert {
  margin-bottom: 16px;
}

.cw-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.cw-steps button {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 14px 16px;
  text-align: left;
  color: var(--text-sub);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  cursor: pointer;
}

.cw-steps button.on {
  color: var(--text-main);
  border-color: color-mix(in srgb, var(--accent) 46%, var(--card-border));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 12%, transparent);
}

.cw-step-no {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent);
}

.cw-step-copy {
  display: grid;
  min-width: 0;
}

.cw-step-copy strong {
  font-size: 13px;
}

.cw-step-copy small {
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10.5px;
  color: var(--text-faint);
}

.cw-section {
  display: grid;
  gap: 14px;
}

.cw-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.cw-stat-grid article {
  display: grid;
  gap: 3px;
  padding: 16px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.cw-stat-grid span,
.cw-stat-grid small {
  font-size: 11px;
  color: var(--text-sub);
}

.cw-stat-grid strong {
  font-family: var(--font-mono);
  font-size: 24px;
  color: var(--accent);
}

.cw-two-col {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 14px;
  align-items: start;
}

.cw-analysis-layout {
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
}

.cw-card {
  min-width: 0;
  padding: 18px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.cw-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.cw-card-head h2 {
  margin: 0;
  font-size: 16px;
}

.cw-card-head p {
  margin: 4px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-faint);
}

.cw-quality-grid,
.cw-student-numbers {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.cw-quality-grid div,
.cw-student-numbers div {
  display: grid;
  gap: 3px;
  padding: 10px;
  background: var(--bg-page);
  border-radius: 8px;
}

.cw-quality-grid span,
.cw-student-numbers span {
  font-size: 10.5px;
  color: var(--text-faint);
}

.cw-quality-grid strong,
.cw-student-numbers b {
  font-family: var(--font-mono);
  font-size: 17px;
  color: var(--text-main);
}

.cw-policy-list {
  display: grid;
  gap: 3px;
  margin: 12px 0;
}

.cw-policy-list p {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-sub);
}

.cw-policy-list p::before {
  content: '✓';
  margin-right: 6px;
  color: var(--ok);
}

.cw-topic-list,
.cw-requirement-list,
.cw-cases,
.cw-action-list {
  display: grid;
  gap: 10px;
}

.cw-topic {
  padding: 12px;
  background: var(--bg-page);
  border-radius: 10px;
}

.cw-topic-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.cw-topic-head > span {
  padding: 4px 7px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 5px;
}

.cw-topic-head div {
  display: grid;
  gap: 2px;
}

.cw-topic-head strong {
  font-size: 14px;
}

.cw-topic-head small {
  font-size: 11px;
  color: var(--text-sub);
}

.cw-requirement {
  padding: 10px 0;
  border-top: 1px dashed var(--divider);
}

.cw-requirement:first-child {
  border-top: none;
  padding-top: 0;
}

.cw-requirement > div:first-child {
  display: flex;
  gap: 7px;
  align-items: baseline;
}

.cw-requirement b {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent);
}

.cw-requirement strong {
  font-size: 12.5px;
}

.cw-requirement p {
  margin: 4px 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--text-sub);
}

.cw-link-line {
  display: grid;
  gap: 2px;
  font-size: 10.5px;
  line-height: 1.55;
  color: var(--text-faint);
}

.cw-resource-chips {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 7px;
}

.cw-resource-chips button,
.cw-resource-list button {
  padding: 3px 7px;
  color: var(--accent);
  background: var(--accent-soft);
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}

.cw-resource-chips span {
  padding: 3px 0;
  font-size: 10px;
  color: var(--text-faint);
}

/* 教材 chip：有正文摘录的加实线描边区分“仅索引”态 */
.cw-resource-chips button.cw-chip-has-excerpt {
  box-shadow: inset 0 0 0 1px var(--accent);
}

.cw-resource-chips button.cw-chip-action {
  color: var(--text-main);
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--card-border);
}

.cw-excerpt-panel {
  margin-top: 8px;
  padding: 10px 12px;
  background: var(--accent-soft);
  border-radius: 8px;
}

.cw-excerpt-note {
  margin: 0 0 8px;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--text-faint);
}

.cw-excerpt-section + .cw-excerpt-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--card-border);
}

.cw-excerpt-section h4 {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 0 0 5px;
  font-size: 12px;
}

.cw-excerpt-section h4 small {
  font-size: 10px;
  font-weight: 400;
  color: var(--text-faint);
}

.cw-excerpt-code {
  padding: 1px 5px;
  background: var(--card-bg);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent);
}

.cw-excerpt-section p {
  margin: 0 0 4px;
  font-size: 11.5px;
  line-height: 1.8;
  text-align: justify;
}

.cw-dialog-excerpt {
  max-height: 320px;
  overflow-y: auto;
}

.cw-dialog-excerpt-empty {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--text-faint);
}

/* 字段说明数据字典 */
.cw-dict {
  display: grid;
  gap: 14px;
  max-height: 420px;
  overflow-y: auto;
}

.cw-dict-group h3 {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0 0 6px;
  font-size: 12.5px;
}

.cw-dict-group h3 small {
  font-size: 10px;
  font-weight: 400;
  color: var(--text-faint);
}

/* 数据边界声明 */
.cw-boundary-list {
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 8px;
  font-size: 11.5px;
  line-height: 1.8;
}

.cw-boundary-list li::marker {
  color: var(--accent);
  font-family: var(--font-mono);
}

.cw-group-bars,
.cw-req-bars,
.cw-issue-block {
  display: grid;
  gap: 10px;
}

.cw-group-bars > div {
  display: grid;
  gap: 5px;
}

.cw-group-label {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
}

.cw-group-label b {
  font-family: var(--font-mono);
  color: var(--accent);
}

.cw-group-bars small,
.cw-muted {
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--text-faint);
}

.cw-issue-block {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed var(--divider);
}

.cw-issue-block h3,
.cw-evidence-list h3 {
  margin: 0;
  font-size: 12px;
}

.cw-gap-list {
  display: grid;
  gap: 8px;
}

.cw-gap-list > div {
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  background: color-mix(in srgb, var(--danger) 7%, var(--bg-page));
  border-radius: 7px;
}

.cw-gap-list strong {
  font-size: 11.5px;
}

.cw-gap-list span {
  font-size: 10.5px;
  color: var(--text-sub);
}

.cw-student-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.cw-student-summary div {
  display: grid;
  gap: 2px;
}

.cw-student-summary strong {
  font-size: 16px;
}

.cw-student-summary span {
  font-size: 10.5px;
  color: var(--text-faint);
}

.cw-req-bars {
  margin: 12px 0;
}

.cw-req-bar > div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
  font-size: 11px;
}

.cw-req-bar b {
  margin-right: 5px;
  font-family: var(--font-mono);
  color: var(--accent);
}

.cw-req-bar em {
  font-style: normal;
  color: var(--text-sub);
}

.cw-evidence-list {
  display: grid;
  gap: 5px;
  margin-top: 16px;
}

.cw-evidence-list button {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 8px;
  text-align: left;
  color: var(--text-sub);
  background: var(--bg-page);
  border: 1px solid transparent;
  border-radius: 7px;
  cursor: pointer;
}

.cw-evidence-list button:hover {
  border-color: var(--card-border);
}

.cw-evidence-list span,
.cw-evidence-list em {
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-style: normal;
  color: var(--text-faint);
}

.cw-evidence-list strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10.5px;
  font-weight: 500;
}

.cw-student-hero,
.cw-plan-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.cw-student-hero h2,
.cw-plan-head h2 {
  margin: 5px 0 8px;
  font-size: clamp(21px, 3vw, 31px);
  font-family: var(--font-calligraphy);
  font-weight: 400;
}

.cw-student-hero p,
.cw-plan-head p {
  max-width: 780px;
  margin: 0;
  font-size: 12.5px;
  line-height: 1.8;
  color: var(--text-sub);
}

.cw-plan-head small {
  display: block;
  margin-top: 8px;
  font-size: 10.5px;
  color: var(--text-faint);
}

.cw-requirement-analysis {
  display: grid;
  gap: 14px;
}

.cw-requirement-analysis-row {
  display: grid;
  grid-template-columns: minmax(200px, 0.9fr) minmax(160px, 1fr) minmax(200px, 1.2fr);
  gap: 14px;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--divider);
}

.cw-requirement-analysis-row > div {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 6px;
  align-items: baseline;
}

.cw-requirement-analysis-row b {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent);
}

.cw-requirement-analysis-row strong {
  font-size: 12px;
}

.cw-requirement-analysis-row span,
.cw-requirement-analysis-row p {
  font-size: 10.5px;
  color: var(--text-faint);
}

.cw-requirement-analysis-row p {
  margin: 0;
  line-height: 1.6;
}

.cw-plan-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.65fr);
  gap: 14px;
  align-items: start;
}

.cw-action-card {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 12px;
  padding: 16px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.cw-action-order {
  font-family: var(--font-mono);
  font-size: 21px;
  color: var(--accent);
}

.cw-action-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cw-action-head > span {
  margin-left: auto;
  font-size: 10px;
  color: var(--text-faint);
}

/* 复核操作账号：跨教师调整时可追溯是谁改的 */
.cw-action-operator {
  font-size: 10px;
  color: var(--text-faint);
}

.cw-action-main h3 {
  margin: 8px 0 5px;
  font-size: 15px;
}

.cw-action-main > p {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-sub);
}

.cw-reason,
.cw-completion {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 8px;
  margin-top: 9px;
  padding: 8px 10px;
  font-size: 11px;
  line-height: 1.65;
  background: var(--bg-page);
  border-radius: 7px;
}

.cw-reason b,
.cw-completion b {
  color: var(--text-main);
}

.cw-reason span,
.cw-completion span {
  color: var(--text-sub);
}

.cw-resource-list {
  display: grid;
  gap: 7px;
  margin-top: 10px;
}

.cw-resource-list > div {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  align-items: center;
}

.cw-resource-list span {
  width: 34px;
  font-size: 10.5px;
  color: var(--text-faint);
}

.cw-resource-list em {
  font-size: 10px;
  font-style: normal;
  color: var(--text-faint);
}

.cw-evidence-mini {
  margin-top: 9px;
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--text-faint);
}

.cw-action-tools {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.cw-plan-side {
  display: grid;
  gap: 14px;
}

.cw-cases button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 3px 8px;
  padding: 10px;
  text-align: left;
  color: var(--text-sub);
  background: var(--bg-page);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
}

.cw-cases button.on {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.cw-cases span {
  font-size: 11px;
}

.cw-cases strong {
  grid-row: span 2;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
}

.cw-cases em {
  font-size: 10px;
  font-style: normal;
  color: var(--text-faint);
}

.cw-export-list {
  display: grid;
  gap: 7px;
}

.cw-export-list :deep(.el-button) {
  margin-left: 0;
}

.cw-record-detail {
  display: grid;
  gap: 10px;
}

.cw-record-detail > div {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--divider);
}

.cw-record-detail span {
  font-size: 11px;
  color: var(--text-faint);
}

.cw-record-detail strong,
.cw-record-detail p {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-main);
}

.cw-section-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.cw-section-title span {
  font: 9.5px/1.4 var(--font-mono);
  letter-spacing: 1.4px;
  color: var(--accent);
}

.cw-section-title h2 {
  margin: 4px 0;
  font-size: 22px;
  color: var(--text-main);
}

.cw-section-title p {
  margin: 0;
  color: var(--text-sub);
  line-height: 1.7;
}

.checkup-list,
.checkup-actions {
  display: grid;
  gap: 9px;
}

.checkup-list > div {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--surface-2);
  border-radius: var(--radius-md);
}

.checkup-rank {
  font: 700 13px/1 var(--font-mono);
  color: var(--accent);
}

.checkup-list > div > div,
.checkup-actions > div {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.checkup-list strong,
.checkup-actions strong {
  font-size: 12px;
  color: var(--text-main);
}

.checkup-list small,
.checkup-actions small {
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--text-sub);
}

.checkup-actions > div {
  padding: 11px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
}

.checkup-actions > div > span {
  width: fit-content;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 9.5px;
}

.checkup-cta {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

@media (max-width: 1120px) {
  .cw-two-col,
  .cw-analysis-layout,
  .cw-plan-layout {
    grid-template-columns: 1fr;
  }

  .cw-plan-side {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 760px) {
  .cw-head,
  .cw-student-hero,
  .cw-plan-head,
  .cw-section-title {
    flex-direction: column;
  }

  .cw-head-actions,
  .cw-plan-actions {
    width: 100%;
  }

  .cw-steps {
    grid-template-columns: 1fr;
  }

  .cw-stat-grid,
  .cw-quality-grid,
  .cw-student-numbers {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cw-card {
    padding: 14px;
  }

  .cw-plan-side {
    grid-template-columns: 1fr;
  }

  .cw-requirement-analysis-row {
    grid-template-columns: 1fr;
  }

  .cw-action-card {
    grid-template-columns: 1fr;
  }

  .cw-action-order {
    font-size: 15px;
  }
}
</style>
