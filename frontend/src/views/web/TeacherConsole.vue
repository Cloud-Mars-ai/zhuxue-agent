<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { COURSE, HOMEWORKS, RISK_STUDENTS, STATS_WEEKLY } from '@/mock/data'
import { useUserStore } from '@/stores/user'
import { useAssessmentStore } from '@/stores/assessment'
import {
  analysisToCsv,
  buildClassKnowledgeAnalysis,
  listClassActivities,
} from '@/utils/classAnalytics'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const assessmentStore = useAssessmentStore()

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

const activities = computed(() => listClassActivities(assessmentStore.tasks))
const selectedActivityId = ref('')
const classAnalysis = ref(null)
const analysisKind = ref('all')
const analysisKinds = [
  { value: 'all', label: '全部' },
  { value: '作业', label: '作业' },
  { value: '考试', label: '考试' },
]

const filteredActivities = computed(() =>
  analysisKind.value === 'all'
    ? activities.value
    : activities.value.filter((item) => item.kind === analysisKind.value),
)

function generateAnalysis(activityId = selectedActivityId.value) {
  const activity =
    activities.value.find((item) => item.id === activityId) ||
    filteredActivities.value[0]
  if (!activity) return
  selectedActivityId.value = activity.id
  classAnalysis.value = buildClassKnowledgeAnalysis(activity)
}

function changeAnalysisKind(kind) {
  analysisKind.value = kind
  const first = filteredActivities.value[0]
  if (first) {
    generateAnalysis(first.id)
  } else {
    selectedActivityId.value = ''
    classAnalysis.value = null
  }
}

function exportAnalysis() {
  if (!classAnalysis.value) return
  const blob = new Blob([`\uFEFF${analysisToCsv(classAnalysis.value)}`], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `班级知识点分析-${classAnalysis.value.activity.title}.csv`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

onMounted(() => {
  const requested = String(route.query.activity || '')
  generateAnalysis(requested)
})
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
      <div class="head-actions">
        <el-button plain @click="router.push('/app/studio')">
          <el-icon><MagicStick /></el-icon>智能课程编排
        </el-button>
        <el-button plain @click="router.push('/app/materials')">
          <el-icon><FolderOpened /></el-icon>课程资料库
        </el-button>
        <el-button type="primary" :disabled="!canPublish">
          <el-icon><Plus /></el-icon>发布新任务
        </el-button>
      </div>
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

    <section class="card analysis-card" data-testid="class-knowledge-analysis">
      <div class="analysis-head">
        <div>
          <div class="analysis-kicker">CLASS KNOWLEDGE DIAGNOSIS</div>
          <h3 class="card-title">班级知识点掌握分析</h3>
          <p class="analysis-lead">
            每次作业或考试生成一份独立分析。未提交不会按 0 分计入，系统会单独标记数据覆盖边界。
          </p>
        </div>
        <div class="analysis-actions">
          <el-button-group>
            <el-button
              v-for="kind in analysisKinds"
              :key="kind.value"
              size="small"
              :type="analysisKind === kind.value ? 'primary' : 'default'"
              @click="changeAnalysisKind(kind.value)"
            >
              {{ kind.label }}
            </el-button>
          </el-button-group>
          <el-select
            v-model="selectedActivityId"
            placeholder="选择作业或考试"
            style="width: 280px"
            @change="generateAnalysis"
          >
            <el-option
              v-for="item in filteredActivities"
              :key="item.id"
              :label="`${item.kind} · ${item.title}`"
              :value="item.id"
            />
          </el-select>
          <el-button type="primary" @click="generateAnalysis()">生成分析</el-button>
          <el-button :disabled="!classAnalysis" @click="exportAnalysis">导出 CSV</el-button>
        </div>
      </div>

      <template v-if="classAnalysis">
        <div class="analysis-overview">
          <article>
            <span>本次范围</span>
            <strong>{{ classAnalysis.scope.concepts }} 个知识点</strong>
            <small>{{ classAnalysis.scope.chapters.join('、') }}</small>
          </article>
          <article>
            <span>提交覆盖</span>
            <strong>{{ classAnalysis.completionRate }}%</strong>
            <small>{{ classAnalysis.submittedCount }} 已提交 · {{ classAnalysis.unsubmittedCount }} 未提交</small>
          </article>
          <article>
            <span>班级平均</span>
            <strong>{{ classAnalysis.averageScore }}</strong>
            <small>及格率 {{ classAnalysis.passRate }}%</small>
          </article>
          <article>
            <span>优秀率</span>
            <strong>{{ classAnalysis.excellenceRate }}%</strong>
            <small>结论置信度：{{ classAnalysis.confidence }}</small>
          </article>
        </div>

        <div class="analysis-grid">
          <div class="analysis-panel knowledge-panel">
            <div class="analysis-panel-head">
              <h4>知识点掌握矩阵</h4>
              <span>{{ classAnalysis.activity.kind }} · {{ classAnalysis.activity.title }}</span>
            </div>
            <div class="knowledge-list">
              <div
                v-for="concept in classAnalysis.conceptMastery"
                :key="`${concept.chapter}-${concept.term}`"
                class="knowledge-row"
              >
                <div class="knowledge-copy">
                  <strong>{{ concept.term }}</strong>
                  <span>{{ concept.chapter }}</span>
                </div>
                <el-progress
                  :percentage="concept.mastery || 0"
                  :stroke-width="7"
                  :status="concept.mastery != null && concept.mastery < 60 ? 'exception' : undefined"
                />
                <el-tag
                  size="small"
                  effect="plain"
                  :type="
                    concept.mastery == null
                      ? 'info'
                      : concept.mastery >= 85
                        ? 'success'
                        : concept.mastery < 60
                          ? 'danger'
                          : 'warning'
                  "
                >
                  {{ concept.mastery == null ? '未评估' : `${concept.mastery}%` }}
                </el-tag>
              </div>
            </div>
          </div>

          <div class="analysis-side">
            <div class="analysis-panel">
              <div class="analysis-panel-head">
                <h4>成绩分布</h4>
                <span>仅统计已提交</span>
              </div>
              <div class="score-distribution">
                <div
                  v-for="item in classAnalysis.distribution"
                  :key="item.label"
                  class="distribution-row"
                >
                  <span>{{ item.label }}</span>
                  <div class="distribution-track">
                    <i
                      :class="item.tone"
                      :style="{
                        width: `${
                          classAnalysis.submittedCount
                            ? (item.value / classAnalysis.submittedCount) * 100
                            : 0
                        }%`,
                      }"
                    />
                  </div>
                  <b>{{ item.value }}</b>
                </div>
              </div>
            </div>

            <div class="analysis-panel">
              <div class="analysis-panel-head">
                <h4>教学建议</h4>
                <span>由本次数据生成</span>
              </div>
              <ol class="analysis-notes">
                <li v-for="item in classAnalysis.insights" :key="item">{{ item }}</li>
              </ol>
              <div class="suggestion-list">
                <div v-for="item in classAnalysis.suggestions" :key="item">{{ item }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="risk-grid">
          <div class="analysis-panel">
            <div class="analysis-panel-head">
              <h4>重点关注学生</h4>
              <span>{{ classAnalysis.atRiskStudents.length }} 人</span>
            </div>
            <div class="risk-student-list">
              <div v-for="student in classAnalysis.atRiskStudents" :key="student.id">
                <strong>{{ student.name }}</strong>
                <span>{{ student.group }} · {{ student.score }} 分</span>
                <em>{{ student.weakConcept || '基础判断链' }}</em>
              </div>
              <p v-if="!classAnalysis.atRiskStudents.length">本次没有发现低于 60 分的学生。</p>
            </div>
          </div>
          <div class="analysis-panel">
            <div class="analysis-panel-head">
              <h4>小组差异</h4>
              <span>{{ classAnalysis.groups.length }} 个小组</span>
            </div>
            <div class="group-analysis-list">
              <div v-for="group in classAnalysis.groups.slice(0, 8)" :key="group.name">
                <span>{{ group.name }} · {{ group.submitted }}/{{ group.students }} 提交</span>
                <b>{{ group.average }}</b>
              </div>
            </div>
          </div>
        </div>

        <el-collapse class="student-detail-collapse">
          <el-collapse-item :title="`查看全部学生明细（${classAnalysis.studentResults.length} 人）`">
            <el-table :data="classAnalysis.studentResults" size="small" max-height="360">
              <el-table-column prop="name" label="学生" width="130" />
              <el-table-column prop="group" label="小组" width="90" />
              <el-table-column label="提交" width="80">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.submitted ? 'success' : 'info'" effect="plain">
                    {{ row.submitted ? '已提交' : '未提交' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="本次得分" width="100">
                <template #default="{ row }">{{ row.submitted ? row.score : '—' }}</template>
              </el-table-column>
              <el-table-column prop="level" label="掌握状态" width="110" />
              <el-table-column prop="weakConcept" label="需关注知识点" min-width="150" />
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </template>
      <el-empty v-else description="暂无作业或考试数据" :image-size="70" />
    </section>

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
            <el-table-column label="操作" width="150" align="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="generateAnalysis(`homework:${row.id}`)"
                >
                  知识点分析
                </el-button>
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

.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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

.analysis-card {
  margin-top: 18px;
  padding: 22px;
}

.analysis-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.analysis-kicker {
  margin-bottom: 5px;
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 1.4px;
  color: var(--accent);
}

.analysis-head .card-title {
  margin-bottom: 5px;
}

.analysis-lead {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-sub);
}

.analysis-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.analysis-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.analysis-overview article {
  display: grid;
  gap: 3px;
  padding: 13px 14px;
  background: var(--surface-2);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
}

.analysis-overview span,
.analysis-overview small {
  font-size: 10.5px;
  color: var(--text-sub);
}

.analysis-overview strong {
  font-family: var(--font-mono);
  font-size: 21px;
  color: var(--text-main);
}

.analysis-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
  gap: 12px;
  align-items: start;
}

.analysis-side {
  display: grid;
  gap: 12px;
}

.analysis-panel {
  padding: 14px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
}

.analysis-panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.analysis-panel-head h4 {
  margin: 0;
  font-size: 13px;
  color: var(--text-main);
}

.analysis-panel-head span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  color: var(--text-faint);
}

.knowledge-list {
  display: grid;
  gap: 9px;
  max-height: 460px;
  padding-right: 5px;
  overflow: auto;
}

.knowledge-row {
  display: grid;
  grid-template-columns: minmax(150px, 0.8fr) minmax(130px, 1fr) 56px;
  align-items: center;
  gap: 12px;
}

.knowledge-copy {
  display: grid;
  min-width: 0;
  gap: 1px;
}

.knowledge-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11.5px;
  color: var(--text-main);
}

.knowledge-copy span {
  font-size: 9.5px;
  color: var(--text-faint);
}

.score-distribution {
  display: grid;
  gap: 10px;
}

.distribution-row {
  display: grid;
  grid-template-columns: 66px minmax(80px, 1fr) 24px;
  align-items: center;
  gap: 8px;
  font-size: 10.5px;
  color: var(--text-sub);
}

.distribution-track {
  height: 7px;
  overflow: hidden;
  background: var(--surface-2);
  border-radius: 999px;
}

.distribution-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
}

.distribution-track i.ok {
  background: var(--ok);
}

.distribution-track i.warn {
  background: var(--warn);
}

.distribution-track i.danger {
  background: var(--danger);
}

.analysis-notes {
  margin: 0;
  padding-left: 18px;
  font-size: 11px;
  line-height: 1.7;
  color: var(--text-sub);
}

.suggestion-list {
  display: grid;
  gap: 6px;
  margin-top: 10px;
}

.suggestion-list div {
  padding: 8px 9px;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--text-main);
  background: var(--surface-2);
  border-radius: var(--radius-sm);
}

.risk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.risk-student-list,
.group-analysis-list {
  display: grid;
  gap: 7px;
}

.risk-student-list > div,
.group-analysis-list > div {
  display: grid;
  grid-template-columns: 86px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 8px 9px;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
}

.risk-student-list strong,
.group-analysis-list span {
  font-size: 11px;
  color: var(--text-main);
}

.risk-student-list span,
.risk-student-list em,
.risk-student-list p {
  font-size: 10.5px;
  font-style: normal;
  color: var(--text-sub);
}

.risk-student-list em {
  text-align: right;
  color: var(--danger);
}

.group-analysis-list b {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent);
}

.student-detail-collapse {
  margin-top: 12px;
  border-top: 1px solid var(--divider);
  border-bottom: 0;
}

.student-detail-collapse :deep(.el-collapse-item__header) {
  background: transparent;
  border-bottom-color: var(--divider);
  font-size: 12px;
  color: var(--text-sub);
}

@media (max-width: 1100px) {
  .analysis-head {
    flex-direction: column;
  }

  .analysis-actions {
    justify-content: flex-start;
  }

  .analysis-grid,
  .risk-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .analysis-card {
    padding: 16px;
  }

  .analysis-actions {
    width: 100%;
  }

  .analysis-actions :deep(.el-select) {
    width: 100% !important;
  }

  .analysis-overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .knowledge-row {
    grid-template-columns: 1fr 52px;
  }

  .knowledge-row :deep(.el-progress) {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
