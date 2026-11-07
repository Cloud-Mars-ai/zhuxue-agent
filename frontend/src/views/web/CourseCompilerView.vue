<script setup>
/**
 * 课程编译器研究面板（Course Compiler Console）。
 *
 * 对应六层管线的「可视化验证层」：把课程计划 IR、硬约束验证报告、
 * 证据账本、修复历史与实验评测集中到一个页面，使"生成过程是否
 * 教学上成立"可被逐条核对，而不是只靠页面截图。
 *
 * 页面本身不做生成决策，只消费 courseStudio store 中已编译的项目
 * 与 utils/experiments.js 计算出的指标。
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { isEnabled } from '@/config/flags'
import { useCourseStudioStore } from '@/stores/courseStudio'
import { useModelStore } from '@/stores/model'
import { useUserStore } from '@/stores/user'
import { BUILTIN_TASKS, auditProjectLedger, runBrowserExperiment } from '@/api/experiments'
import { countBySeverity } from '@/utils/courseValidator'
import { summarizeRepairs } from '@/utils/courseRepair'
import { EVIDENCE_KIND_LABELS } from '@/utils/evidenceLedger'
import { sceneKnowledgePoints } from '@/utils/courseIR'
import {
  EXPERIMENT_GROUPS,
  exportExperimentCsv,
  exportExperimentJson,
  exportHumanScoreSheet,
  formatExperimentMarkdown,
  importHumanScores,
} from '@/utils/courseExperiment'

const route = useRoute()
const router = useRouter()
const studio = useCourseStudioStore()
const modelStore = useModelStore()
const userStore = useUserStore()

const CONSTRAINT_LABELS = {
  PREREQ_ORDER: '先修顺序',
  PREREQ_MISSING: '先修引用缺失',
  COVERAGE: '课程要求覆盖',
  DURATION_BUDGET: '时长预算',
  DIFFICULTY_ORDER: '难度递增',
  EXERCISE_TYPES: '题型完整性',
  MATERIAL_EXISTENCE: '材料存在性',
  COMPLETION_CRITERIA: '完成标准',
  KP_RANGE: '知识点难度范围',
}

const SCENE_TYPE_LABELS = {
  lecture: '讲授',
  quiz: '练习',
  practice: '应用',
  review: '复盘',
}

const EXERCISE_TYPE_LABELS = {
  choice: '选择',
  fill: '填空',
  judge: '判断',
}

const ISSUE_CODE_LABELS = {
  MATH_STEP_DIVERGENCE: '步骤不等价',
  MATH_STEP_ARITH: '步骤算术错误',
  MATH_ANSWER_MISMATCH: '答案不一致',
  MATH_OPTION_UNIQUE: '选项唯一性',
  MATH_OPTION_DUPLICATE: '选项重复',
  MATH_OPTION_COUNT: '选项数量',
  MATH_ERROR_PATTERN: '错误模式归类',
  MATH_PARSE_UNSUPPORTED: '表达式无法解析',
  WRONG_FIRST_NO_ERROR: '错解缺少错误步',
  WRONG_FIRST_EARLY_DIVERGENCE: '错解偏离过早',
  WRONG_FIRST_INDEX: '错解定位偏移',
  MGMT_NUMBER_UNSOURCED: '数字缺少材料依据',
}

const SEVERITY_TYPES = { error: 'danger', warning: 'warning' }

/* ---------------- 项目选择 ---------------- */

const projectId = ref('')

const compiledProjects = computed(() =>
  studio.projects.filter((item) => item.plan && isEnabled('courseCompiler')),
)

const project = computed(() =>
  projectId.value ? studio.find(projectId.value) : compiledProjects.value[0] || null,
)

const validation = computed(() => project.value?.validation || null)
const severity = computed(() => countBySeverity(validation.value))
const repairSummary = computed(() => summarizeRepairs(project.value?.repairs || []))
const ledgerAudit = computed(() => auditProjectLedger(project.value))

const metrics = computed(() => validation.value?.metrics || null)

const kpMap = computed(() => {
  const map = new Map()
  for (const point of project.value?.plan?.knowledgePoints || []) map.set(point.id, point)
  return map
})

const sceneRows = computed(() =>
  (project.value?.plan?.scenes || []).map((scene) => {
    const state =
      project.value?.scenes?.find((item) => item.outlineId === scene.id) || null
    return {
      ...scene,
      state,
      knowledgePointNames: sceneKnowledgePoints(project.value.plan, scene).map(
        (point) => point.name,
      ),
    }
  }),
)

const sceneIssueCount = computed(() =>
  (project.value?.scenes || []).reduce(
    (sum, scene) => sum + (scene.subjectIssues?.length || 0),
    0,
  ),
)

const sceneRepairCount = computed(() =>
  (project.value?.scenes || []).reduce(
    (sum, scene) => sum + (scene.repairs?.length || 0),
    0,
  ),
)

onMounted(async () => {
  await studio.load()
  const requested = route.query.project
  const target =
    (requested && studio.find(String(requested))) || compiledProjects.value[0] || null
  projectId.value = target?.id || ''
})

function selectProject(value) {
  projectId.value = value
  router.replace({ query: { ...route.query, project: value } })
}

async function recompileCurrent() {
  if (!project.value) return
  const updated = await studio.recompile(project.value.id)
  ElMessage.success(
    updated?.plan ? `已重建 IR：${(updated.repairs || []).length} 条修复记录` : '重建失败',
  )
}

/* ---------------- 实验控制台 ---------------- */

const expMode = ref('simulation')
const expRepeats = ref(3)
const expGroups = ref(['vanilla', 'rag', 'schema', 'compiler'])
const expRunning = ref(false)
const expProgress = ref({ done: 0, total: 0 })
const expSummary = ref(null)
const expRuns = ref([])
const humanSummary = ref(null)

const expTaskCount = computed(() => expGroups.value.length * expRepeats.value * BUILTIN_TASKS.length)

async function runExperimentNow() {
  if (expRunning.value) return
  if (!expGroups.value.length) {
    ElMessage.warning('至少选择一个实验组')
    return
  }
  if (expMode.value === 'model' && !modelStore.isConfigured) {
    ElMessage.warning('真实模型模式需要先配置模型；可改用离线模拟模式')
    return
  }
  expRunning.value = true
  expSummary.value = null
  expRuns.value = []
  expProgress.value = { done: 0, total: expTaskCount.value }
  try {
    const { runs, summary } = await runBrowserExperiment({
      groups: expGroups.value,
      repeats: expRepeats.value,
      mode: expMode.value,
      onProgress: ({ done, total }) => {
        expProgress.value = { done, total }
      },
    })
    expRuns.value = runs
    expSummary.value = summary
    ElMessage.success(`实验完成：${runs.length} 次运行`)
  } catch (error) {
    ElMessage.error(error.message || '实验执行失败')
  } finally {
    expRunning.value = false
  }
}

function downloadText(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')

function exportCsv() {
  if (!expRuns.value.length) return
  downloadText(`course-experiment-${stamp()}.csv`, exportExperimentCsv(expRuns.value), 'text/csv;charset=utf-8')
}

function exportJson() {
  if (!expSummary.value) return
  downloadText(
    `course-experiment-${stamp()}.json`,
    exportExperimentJson(expSummary.value, expRuns.value),
    'application/json;charset=utf-8',
  )
}

function exportMarkdown() {
  if (!expSummary.value) return
  downloadText(
    `course-experiment-${stamp()}.md`,
    formatExperimentMarkdown(expSummary.value),
    'text/markdown;charset=utf-8',
  )
}

function exportScoreSheet() {
  downloadText(
    `course-human-scores-${stamp()}.csv`,
    exportHumanScoreSheet(BUILTIN_TASKS, expGroups.value.length ? expGroups.value : ['vanilla', 'compiler']),
    'text/csv;charset=utf-8',
  )
  ElMessage.success('已导出教师评分表，回收后可从下方导入')
}

/** 简易 CSV 解析（评分表由本工具导出，无嵌套引号复杂场景）。 */
function parseCsv(text) {
  return String(text || '')
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const cells = []
      let current = ''
      let inQuote = false
      for (let i = 0; i < line.length; i += 1) {
        const char = line[i]
        if (inQuote) {
          if (char === '"' && line[i + 1] === '"') {
            current += '"'
            i += 1
          } else if (char === '"') {
            inQuote = false
          } else {
            current += char
          }
        } else if (char === '"') {
          inQuote = true
        } else if (char === ',') {
          cells.push(current)
          current = ''
        } else {
          current += char
        }
      }
      cells.push(current)
      return cells
    })
}

async function importScores(event) {
  const file = event?.target?.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const rows = parseCsv(text)
    const header = rows[0] || []
    const records = rows.slice(1).map((cells) => {
      const row = {}
      header.forEach((key, index) => {
        row[key.trim()] = (cells[index] || '').trim()
      })
      return {
        taskId: row.taskId,
        group: row.group,
        teacherScore: Number(row['teacherScore(1-5)']),
        willingness: row['willingness(直接使用/需修改/拒绝)'],
        comment: row.comment,
      }
    })
    humanSummary.value = importHumanScores(records)
    ElMessage.success(`已导入 ${humanSummary.value.scored} 条评分`)
  } catch (error) {
    ElMessage.error(error.message || '评分表解析失败')
  } finally {
    if (event?.target) event.target.value = ''
  }
}

/* ---------------- 格式化 ---------------- */

const pct = (value) => `${Math.round((Number(value) || 0) * 100)}%`
const diff = (value) => (value > 0 ? `+${value}` : `${value}`)

function sceneTitle(sceneId) {
  return project.value?.plan?.scenes?.find((scene) => scene.id === sceneId)?.title || sceneId
}
</script>

<template>
  <div class="compiler-page">
    <section class="compiler-hero">
      <div>
        <span class="compiler-kicker">COURSE COMPILER · 研究面板</span>
        <h1>把课程生成过程变成可验证的对象。</h1>
        <p>
          规划 IR → 内容生成 → 约束验证 → 自动修复 → 渲染。这一页集中展示硬约束报告、证据账本与修复历史，
          并提供四组对照实验的批量评测与导出。
        </p>
      </div>
      <div class="hero-actions">
        <el-select
          :model-value="project?.id || ''"
          placeholder="选择已编译课程"
          style="width: 220px"
          @change="selectProject"
        >
          <el-option
            v-for="item in compiledProjects"
            :key="item.id"
            :value="item.id"
            :label="`${item.title}（${item.outlines.length} 场景）`"
          />
        </el-select>
        <el-button plain :disabled="!project" @click="recompileCurrent">重建 IR 并复检</el-button>
      </div>
    </section>

    <el-alert
      v-if="!isEnabled('courseCompiler')"
      type="warning"
      show-icon
      :closable="false"
      title="courseCompiler 开关已关闭：新课程不会走编译管线，本页只展示历史编译数据。"
      style="margin-bottom: 16px"
    />

    <el-alert
      v-if="!project"
      type="info"
      show-icon
      :closable="false"
      title="还没有已编译的课程：先在「智能课程编排」生成大纲，编译报告会出现在这里。实验与评测不依赖已有课程，可直接运行。"
      style="margin-bottom: 16px"
    />

    <el-tabs type="border-card" class="compiler-tabs">
        <!-- ============ 1. 编译概览 ============ -->
        <el-tab-pane label="编译概览" name="overview">
          <template v-if="project">
          <div class="metric-grid">
            <div class="metric-card" :class="validation?.passed ? 'ok' : 'bad'">
              <span class="metric-label">硬约束</span>
              <strong class="metric-value">{{ validation?.passed ? '通过' : '未通过' }}</strong>
              <span class="metric-note">error 级违规 {{ severity.error }} 条</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">要求覆盖率</span>
              <strong class="metric-value">{{ pct(metrics?.coverage) }}</strong>
              <span class="metric-note">课程要求与知识点/要点的词面重叠</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">时长漂移</span>
              <strong class="metric-value">{{ metrics?.totalMinutes ?? 0 }} / {{ project.plan?.durationBudget ?? 0 }} 分钟</strong>
              <span class="metric-note">场景合计 / 预算</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">违规总数</span>
              <strong class="metric-value">{{ metrics?.violationCount ?? 0 }}</strong>
              <span class="metric-note">warning {{ severity.warning }} 条</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">自动修复</span>
              <strong class="metric-value">{{ repairSummary.total }}</strong>
              <span class="metric-note">确定性 {{ repairSummary.bySource.deterministic }} / 模型 {{ repairSummary.bySource.model }}</span>
            </div>
            <div class="metric-card" :class="(ledgerAudit?.unsupportedRate ?? 0) > 0 ? 'bad' : 'ok'">
              <span class="metric-label">无依据结论</span>
              <strong class="metric-value">{{ pct(ledgerAudit?.unsupportedRate) }}</strong>
              <span class="metric-note">伪造材料引用 {{ ledgerAudit?.fabricated?.length || 0 }} 条</span>
            </div>
          </div>

          <div class="pane-grid">
            <section class="pane">
              <header class="pane-head">
                <h3>违规定位</h3>
                <span class="pane-note">按严重级排序；warning 不阻断编译</span>
              </header>
              <el-table
                v-if="validation?.violations?.length"
                :data="[...validation.violations].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1))"
                size="small"
                max-height="360"
              >
                <el-table-column label="约束" width="120">
                  <template #default="{ row }">
                    <el-tag :type="SEVERITY_TYPES[row.severity] || 'info'" effect="plain" size="small">
                      {{ CONSTRAINT_LABELS[row.code] || row.code }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="级别" width="76">
                  <template #default="{ row }">
                    <span class="sev" :class="row.severity">{{ row.severity === 'error' ? 'error' : 'warning' }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="message" label="问题" min-width="240" show-overflow-tooltip />
                <el-table-column label="位置" width="130">
                  <template #default="{ row }">
                    <span class="mono">
                      {{ row.target?.type === 'scene' ? sceneTitle(row.target.id) : row.target?.type === 'knowledgePoint' ? (kpMap.get(row.target.id)?.name || row.target.id) : '课程级' }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="hint" label="修复建议" min-width="180" show-overflow-tooltip />
              </el-table>
              <el-empty v-else description="没有任何违规定位" :image-size="60" />
            </section>

            <section class="pane">
              <header class="pane-head">
                <h3>修复动作分布</h3>
                <span class="pane-note">按约束码统计</span>
              </header>
              <div v-if="repairSummary.total" class="repair-bars">
                <div v-for="(count, code) in repairSummary.byCode" :key="code" class="repair-bar-row">
                  <span class="repair-bar-label">{{ CONSTRAINT_LABELS[code] || code }}</span>
                  <div class="repair-bar-track">
                    <div class="repair-bar-fill" :style="{ width: `${(count / repairSummary.total) * 100}%` }" />
                  </div>
                  <span class="repair-bar-count mono">{{ count }}</span>
                </div>
              </div>
              <el-empty v-else description="本次编译没有触发自动修复" :image-size="60" />
              <div class="pane-foot">
                <span>场景级学科问题 {{ sceneIssueCount }} 条</span>
                <span>场景级修复 {{ sceneRepairCount }} 次</span>
              </div>
            </section>
          </div>
          </template>
          <el-empty v-else description="选择一门已编译课程后查看验证报告" :image-size="60" />
        </el-tab-pane>

        <!-- ============ 2. 课程计划 IR ============ -->
        <el-tab-pane label="课程计划 IR" name="ir">
          <template v-if="project">
          <section class="pane">
            <header class="pane-head">
              <h3>知识点（{{ project.plan?.knowledgePoints?.length || 0 }}）</h3>
              <span class="pane-note">难度 1–3；先修指向更早引入的知识点</span>
            </header>
            <el-table :data="project.plan?.knowledgePoints || []" size="small" max-height="300">
              <el-table-column prop="id" label="ID" width="70">
                <template #default="{ row }"><span class="mono">{{ row.id }}</span></template>
              </el-table-column>
              <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
              <el-table-column label="难度" width="70">
                <template #default="{ row }">
                  <span class="tier" :class="`tier-${row.difficulty}`">{{ row.difficulty }}</span>
                </template>
              </el-table-column>
              <el-table-column label="先修" min-width="150">
                <template #default="{ row }">
                  <span v-if="!row.prerequisites?.length" class="faint">—</span>
                  <el-tag v-for="pre in row.prerequisites" :key="pre" size="small" effect="plain" class="kp-tag">
                    {{ kpMap.get(pre)?.name || pre }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="引入场景" width="150">
                <template #default="{ row }"><span class="faint">{{ sceneTitle(row.introducedBy) }}</span></template>
              </el-table-column>
              <el-table-column label="预计时长" width="90">
                <template #default="{ row }"><span class="mono">{{ row.estMinutes }} min</span></template>
              </el-table-column>
            </el-table>
          </section>

          <section class="pane">
            <header class="pane-head">
              <h3>场景序列（{{ sceneRows.length }}）</h3>
              <span class="pane-note">IR version {{ project.plan?.version }}</span>
            </header>
            <el-table :data="sceneRows" size="small" max-height="420">
              <el-table-column label="#" width="52">
                <template #default="{ row }"><span class="mono">{{ row.order }}</span></template>
              </el-table-column>
              <el-table-column label="类型" width="76">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain">{{ SCENE_TYPE_LABELS[row.type] || row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="title" label="标题" min-width="130" show-overflow-tooltip />
              <el-table-column label="知识点" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="faint">{{ row.knowledgePointNames.join('、') || '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="先修场景" width="120" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="faint">{{ (row.prerequisites || []).map((id) => kpMap.get(id)?.name || id).join('、') || '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="难度" width="60">
                <template #default="{ row }">
                  <span class="tier" :class="`tier-${row.difficultyTier}`">{{ row.difficultyTier }}</span>
                </template>
              </el-table-column>
              <el-table-column label="时长" width="76">
                <template #default="{ row }"><span class="mono">{{ row.estimatedMinutes }}m</span></template>
              </el-table-column>
              <el-table-column label="材料" width="90">
                <template #default="{ row }">
                  <span class="mono" :class="{ bad: !row.sourceChunkIds?.length }">
                    {{ row.sourceChunkIds?.length || 0 }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="题型规格" width="120">
                <template #default="{ row }">
                  <span v-if="row.type !== 'quiz'" class="faint">—</span>
                  <span v-else class="mono">
                    {{ (row.exerciseSpec?.types || []).map((t) => EXERCISE_TYPE_LABELS[t] || t).join('/') }} ×{{ row.exerciseSpec?.count || 0 }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="110">
                <template #default="{ row }">
                  <el-tag v-if="row.state?.subjectIssues?.length" type="danger" size="small" effect="plain">
                    {{ row.state.subjectIssues.length }} 学科问题
                  </el-tag>
                  <el-tag v-else-if="row.state?.repairs?.length" type="warning" size="small" effect="plain">
                    修复 {{ row.state.repairs.length }}
                  </el-tag>
                  <el-tag v-else type="success" size="small" effect="plain">干净</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="完成标准" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="faint">{{ (row.completionCriteria || []).join('；') }}</span>
                </template>
              </el-table-column>
            </el-table>
          </section>
          </template>
          <el-empty v-else description="选择一门已编译课程后查看课程计划 IR" :image-size="60" />
        </el-tab-pane>

        <!-- ============ 3. 证据账本 ============ -->
        <el-tab-pane label="证据账本" name="evidence">
          <template v-if="project">
          <div class="metric-grid compact">
            <div class="metric-card">
              <span class="metric-label">声明总数</span>
              <strong class="metric-value">{{ ledgerAudit?.total ?? 0 }}</strong>
              <span class="metric-note">板书定义 / 错解 / 题目 / 案例结论</span>
            </div>
            <div class="metric-card" :class="(ledgerAudit?.unsupportedRate ?? 0) > 0 ? 'bad' : 'ok'">
              <span class="metric-label">有依据率</span>
              <strong class="metric-value">{{ pct(ledgerAudit?.supportRate) }}</strong>
              <span class="metric-note">无依据 {{ ledgerAudit?.unsupported?.length || 0 }} 条</span>
            </div>
            <div class="metric-card" :class="(ledgerAudit?.fabricated?.length ?? 0) > 0 ? 'bad' : 'ok'">
              <span class="metric-label">伪造材料引用</span>
              <strong class="metric-value">{{ ledgerAudit?.fabricated?.length ?? 0 }}</strong>
              <span class="metric-note">引用了不在材料库中的 chunk</span>
            </div>
          </div>

          <section class="pane">
            <header class="pane-head">
              <h3>声明 → 证据</h3>
              <span class="pane-note">模型不得凭空增加来源；derived 需可追溯到规则</span>
            </header>
            <el-table :data="ledgerAudit?.claims || []" size="small" max-height="460">
              <el-table-column label="场景" width="120" show-overflow-tooltip>
                <template #default="{ row }"><span class="faint">{{ sceneTitle(row.sceneId) }}</span></template>
              </el-table-column>
              <el-table-column prop="target" label="对象" width="110" show-overflow-tooltip>
                <template #default="{ row }"><span class="mono">{{ row.target }}</span></template>
              </el-table-column>
              <el-table-column prop="text" label="声明" min-width="220" show-overflow-tooltip />
              <el-table-column label="证据" min-width="220">
                <template #default="{ row }">
                  <span v-if="!row.evidence?.length" class="bad">无依据</span>
                  <el-tag
                    v-for="(entry, index) in row.evidence"
                    :key="index"
                    size="small"
                    effect="plain"
                    class="ev-tag"
                    :title="entry.quote || ''"
                  >
                    {{ EVIDENCE_KIND_LABELS[entry.kind] || entry.kind }} · {{ entry.ref }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </section>
          </template>
          <el-empty v-else description="选择一门已编译课程后查看证据账本" :image-size="60" />
        </el-tab-pane>

        <!-- ============ 4. 修复历史 ============ -->
        <el-tab-pane label="修复历史" name="repairs">
          <template v-if="project">
          <section class="pane">
            <header class="pane-head">
              <h3>修复记录（{{ project.repairs?.length || 0 }}）</h3>
              <span class="pane-note">只修问题场景/约束，不重新生成整门课</span>
            </header>
            <el-table :data="project.repairs || []" size="small" max-height="480">
              <el-table-column label="约束" width="120">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain">{{ CONSTRAINT_LABELS[row.code] || row.code }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="来源" width="90">
                <template #default="{ row }">
                  <span :class="row.source === 'model' ? 'warn' : 'faint'">
                    {{ row.source === 'model' ? '模型修复' : '确定性修复' }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="target" label="目标" width="140" show-overflow-tooltip />
              <el-table-column prop="action" label="动作" min-width="160" show-overflow-tooltip />
              <el-table-column label="前后变化" min-width="240">
                <template #default="{ row }">
                  <div class="before-after">
                    <span class="before mono">{{ JSON.stringify(row.before) }}</span>
                    <span class="arrow">→</span>
                    <span class="after mono">{{ JSON.stringify(row.after) }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="时间" width="150">
                <template #default="{ row }"><span class="mono faint">{{ row.at?.slice(0, 19).replace('T', ' ') }}</span></template>
              </el-table-column>
            </el-table>
          </section>

          <section class="pane" v-if="sceneRepairCount">
            <header class="pane-head">
              <h3>场景级修复</h3>
              <span class="pane-note">内容生成阶段触发（学科检查 / 错解定位）</span>
            </header>
            <el-table
              :data="(project.scenes || []).filter((scene) => scene.repairs?.length)"
              size="small"
              max-height="300"
            >
              <el-table-column label="场景" width="140">
                <template #default="{ row }">
                  <span class="faint">{{ project.outlines?.find((o) => o.id === row.outlineId)?.title || row.outlineId }}</span>
                </template>
              </el-table-column>
              <el-table-column label="修复" min-width="260">
                <template #default="{ row }">
                  <el-tag v-for="item in row.repairs" :key="item.id || item.code" size="small" effect="plain" class="ev-tag">
                    {{ item.code }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="学科问题" min-width="260">
                <template #default="{ row }">
                  <el-tag
                    v-for="(issue, index) in row.subjectIssues || []"
                    :key="index"
                    size="small"
                    :type="issue.severity === 'error' ? 'danger' : 'warning'"
                    effect="plain"
                    class="ev-tag"
                  >
                    {{ ISSUE_CODE_LABELS[issue.code] || issue.code }}
                  </el-tag>
                  <span v-if="!row.subjectIssues?.length" class="faint">—</span>
                </template>
              </el-table-column>
            </el-table>
          </section>
          </template>
          <el-empty v-else description="选择一门已编译课程后查看修复历史" :image-size="60" />
        </el-tab-pane>

        <!-- ============ 5. 实验与评测 ============ -->
        <el-tab-pane label="实验与评测" name="experiment">
          <section class="pane">
            <header class="pane-head">
              <h3>批量实验</h3>
              <span class="pane-note">Vanilla / RAG-only / Prompt+Schema / Full Compiler 四组对照</span>
            </header>

            <div class="exp-form">
              <label class="exp-field">
                <span>生成模式</span>
                <el-radio-group v-model="expMode">
                  <el-radio value="simulation">离线模拟（无需模型）</el-radio>
                  <el-radio value="model">真实模型</el-radio>
                </el-radio-group>
              </label>
              <label class="exp-field">
                <span>每组重复次数</span>
                <el-select v-model="expRepeats" style="width: 110px" data-testid="compiler-repeats">
                  <el-option :value="1" label="1 次" />
                  <el-option :value="3" label="3 次" />
                  <el-option :value="5" label="5 次" />
                </el-select>
              </label>
              <label class="exp-field">
                <span>实验组</span>
                <el-checkbox-group v-model="expGroups">
                  <el-checkbox v-for="item in Object.values(EXPERIMENT_GROUPS)" :key="item.id" :value="item.id">
                    {{ item.label }}
                  </el-checkbox>
                </el-checkbox-group>
              </label>
              <div class="exp-actions">
                <el-button
                  type="primary"
                  :loading="expRunning"
                  :disabled="expRunning"
                  data-testid="compiler-run-experiment"
                  @click="runExperimentNow"
                >
                  运行实验（{{ expTaskCount }} 次生成）
                </el-button>
                <span class="hint">内置 {{ BUILTIN_TASKS.length }} 个任务；离线模拟用固定种子复现典型缺陷，结果标注"模拟数据"。</span>
              </div>
              <el-progress
                v-if="expRunning"
                :percentage="expProgress.total ? Math.round((expProgress.done / expProgress.total) * 100) : 0"
                :stroke-width="10"
              />
            </div>
          </section>

          <template v-if="expSummary">
            <section class="pane">
              <header class="pane-head">
                <h3>组间指标</h3>
                <span class="pane-note">共 {{ expSummary.totalRuns }} 次运行</span>
              </header>
              <el-table :data="Object.values(expSummary.groups)" size="small" max-height="320">
                <el-table-column prop="label" label="组" width="120" />
                <el-table-column label="硬约束通过率" width="120">
                  <template #default="{ row }"><span class="mono">{{ pct(row.constraintPassRate) }}</span></template>
                </el-table-column>
                <el-table-column label="要求覆盖率" width="110">
                  <template #default="{ row }"><span class="mono">{{ pct(row.coverage) }}</span></template>
                </el-table-column>
                <el-table-column label="无依据比例" width="110">
                  <template #default="{ row }"><span class="mono" :class="{ bad: row.unsupportedRate > 0 }">{{ pct(row.unsupportedRate) }}</span></template>
                </el-table-column>
                <el-table-column label="先修错误率" width="110">
                  <template #default="{ row }"><span class="mono" :class="{ bad: row.prereqErrorRate > 0 }">{{ pct(row.prereqErrorRate) }}</span></template>
                </el-table-column>
                <el-table-column label="数学错误率" width="110">
                  <template #default="{ row }"><span class="mono" :class="{ bad: row.mathErrorRate > 0 }">{{ pct(row.mathErrorRate) }}</span></template>
                </el-table-column>
                <el-table-column label="伪造证据率" width="110">
                  <template #default="{ row }"><span class="mono">{{ pct(row.fabricatedEvidenceRate) }}</span></template>
                </el-table-column>
                <el-table-column label="结构稳定性" width="100">
                  <template #default="{ row }"><span class="mono">{{ row.stability.toFixed(2) }}</span></template>
                </el-table-column>
                <el-table-column label="修复/课" width="90">
                  <template #default="{ row }"><span class="mono">{{ row.repairsPerRun }}</span></template>
                </el-table-column>
                <el-table-column label="平均延迟" width="100">
                  <template #default="{ row }"><span class="mono">{{ row.avgLatencyMs }} ms</span></template>
                </el-table-column>
                <el-table-column label="平均 token" width="100">
                  <template #default="{ row }"><span class="mono">{{ row.avgTokens }}</span></template>
                </el-table-column>
              </el-table>
            </section>

            <section v-if="Object.keys(expSummary.comparison).length" class="pane">
              <header class="pane-head">
                <h3>Full Compiler 相对差值</h3>
                <span class="pane-note">正值 = 编译器更优</span>
              </header>
              <el-table :data="Object.values(expSummary.comparison)" size="small" max-height="260">
                <el-table-column prop="label" label="对照组" width="140" />
                <el-table-column label="约束通过率" width="120">
                  <template #default="{ row }"><span class="mono ok-text">{{ diff(row.deltaConstraintPassRate) }} pp</span></template>
                </el-table-column>
                <el-table-column label="覆盖率" width="110">
                  <template #default="{ row }"><span class="mono ok-text">{{ diff(row.deltaCoverage) }} pp</span></template>
                </el-table-column>
                <el-table-column label="无依据比例" width="120">
                  <template #default="{ row }"><span class="mono ok-text">{{ diff(-row.deltaUnsupportedRate) }} pp</span></template>
                </el-table-column>
                <el-table-column label="先修错误率" width="120">
                  <template #default="{ row }"><span class="mono ok-text">{{ diff(-row.deltaPrereqErrorRate) }} pp</span></template>
                </el-table-column>
                <el-table-column label="数学错误率" width="120">
                  <template #default="{ row }"><span class="mono ok-text">{{ diff(-row.deltaMathErrorRate) }} pp</span></template>
                </el-table-column>
                <el-table-column label="稳定性" width="100">
                  <template #default="{ row }"><span class="mono ok-text">{{ diff(row.deltaStability) }}</span></template>
                </el-table-column>
              </el-table>
            </section>

            <section class="pane">
              <header class="pane-head">
                <h3>导出与人工评分</h3>
                <span class="pane-note">指标口径见 docs/research/course-compiler-design.md</span>
              </header>
              <div class="export-actions">
                <el-button plain @click="exportCsv">导出逐次运行 CSV</el-button>
                <el-button plain @click="exportJson">导出 JSON</el-button>
                <el-button plain @click="exportMarkdown">导出 Markdown 报告</el-button>
                <el-button plain @click="exportScoreSheet">导出教师评分表</el-button>
                <el-upload :auto-upload="false" :show-file-list="false" accept=".csv" :on-change="importScores">
                  <el-button plain>导入回收评分</el-button>
                </el-upload>
              </div>
              <div v-if="humanSummary" class="human-summary">
                <span>已评分 {{ humanSummary.scored }} 条</span>
                <span>均分 <strong class="mono">{{ humanSummary.meanScore }}</strong> / 5</span>
                <span>直接使用 <strong class="mono ok-text">{{ pct(humanSummary.willingnessRate['直接使用']) }}</strong></span>
                <span>需修改 <strong class="mono">{{ pct(humanSummary.willingnessRate['需修改']) }}</strong></span>
                <span>拒绝 <strong class="mono" :class="{ bad: humanSummary.willingnessRate['拒绝'] > 0 }">{{ pct(humanSummary.willingnessRate['拒绝']) }}</strong></span>
              </div>
            </section>
          </template>

          <el-empty v-else description="还没有实验结果。先运行一轮批量实验（离线模拟模式不消耗模型额度）。" :image-size="70" />
        </el-tab-pane>
      </el-tabs>
  </div>
</template>

<style scoped>
.compiler-page {
  max-width: 1480px;
  margin: 0 auto;
  padding-bottom: 28px;
}

.compiler-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 18px;
  padding: 6px 2px 2px;
}

.compiler-kicker {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.compiler-hero h1 {
  max-width: 760px;
  margin: 8px 0;
  color: var(--text-main);
  font-family: var(--font-title);
  font-size: clamp(24px, 2.6vw, 36px);
  line-height: 1.15;
  letter-spacing: var(--title-tracking);
}

.compiler-hero p {
  max-width: 780px;
  margin: 0;
  color: var(--text-sub);
  font-size: 12.5px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.compiler-card,
.pane {
  padding: 16px 18px;
  background: var(--card-bg);
  border: 1px solid var(--divider);
  border-radius: var(--radius-md);
}

.compiler-tabs {
  border-radius: var(--radius-md);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.metric-grid.compact {
  margin-bottom: 12px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  background: var(--surface-2);
  border: 1px solid var(--divider);
  border-radius: var(--radius-sm);
}

.metric-card.ok {
  border-color: color-mix(in srgb, var(--success, #2f8f5b) 34%, var(--divider));
}

.metric-card.bad {
  border-color: color-mix(in srgb, var(--danger) 34%, var(--divider));
}

.metric-label {
  color: var(--text-faint);
  font-size: 10.5px;
}

.metric-value {
  color: var(--text-main);
  font-family: var(--font-title);
  font-size: 20px;
  line-height: 1.2;
}

.metric-note {
  color: var(--text-faint);
  font-size: 10px;
  line-height: 1.5;
}

.pane-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 14px;
}

.pane + .pane {
  margin-top: 14px;
}

.pane-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.pane-head h3 {
  margin: 0;
  color: var(--text-main);
  font-family: var(--font-title);
  font-size: 14px;
}

.pane-note {
  color: var(--text-faint);
  font-size: 10.5px;
}

.pane-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  color: var(--text-faint);
  font-size: 10.5px;
}

.mono {
  font-family: var(--font-mono);
  font-size: 11px;
}

.faint {
  color: var(--text-faint);
  font-size: 11px;
}

.bad {
  color: var(--danger);
  font-size: 11px;
}

.warn {
  color: var(--warn);
  font-size: 11px;
}

.ok-text {
  color: var(--success, #2f8f5b);
}

.sev.error {
  color: var(--danger);
}

.sev.warning {
  color: var(--warn);
}

.sev {
  font-size: 11px;
}

.tier {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-sub);
  background: var(--surface-2);
  border: 1px solid var(--divider);
}

.tier-3 {
  color: var(--danger);
  border-color: color-mix(in srgb, var(--danger) 40%, var(--divider));
}

.tier-2 {
  color: var(--warn);
  border-color: color-mix(in srgb, var(--warn) 40%, var(--divider));
}

.kp-tag,
.ev-tag {
  margin: 0 4px 4px 0;
}

.repair-bars {
  display: grid;
  gap: 8px;
}

.repair-bar-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) 28px;
  align-items: center;
  gap: 10px;
}

.repair-bar-label {
  color: var(--text-sub);
  font-size: 11px;
}

.repair-bar-track {
  height: 8px;
  background: var(--surface-2);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.repair-bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-pill);
}

.repair-bar-count {
  text-align: right;
  color: var(--text-sub);
}

.before-after {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.before-after .before {
  color: var(--text-faint);
  text-decoration: line-through;
}

.before-after .after {
  color: var(--text-main);
}

.before-after .arrow {
  color: var(--accent);
}

.exp-form {
  display: grid;
  gap: 14px;
}

.exp-field {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exp-field > span {
  min-width: 88px;
  color: var(--text-sub);
  font-size: 11.5px;
}

.exp-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.hint {
  color: var(--text-faint);
  font-size: 10.5px;
}

.export-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.human-summary {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--divider);
  color: var(--text-sub);
  font-size: 11.5px;
}

.empty-card {
  padding: 40px 20px;
}

@media (max-width: 960px) {
  .pane-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .compiler-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
