<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { COURSE } from '@/mock/data'
import { useUserStore } from '@/stores/user'
import { useModelStore } from '@/stores/model'
import { useSelfTestStore } from '@/stores/selftest'
import { generateSelfTest } from '@/api/aiTasks'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const modelStore = useModelStore()
const selfTestStore = useSelfTestStore()

const chapterOptions = COURSE.chapters.map((c) => c.title)
const selectedChapters = ref([COURSE.chapters[2]?.title || chapterOptions[0]])
const count = ref(10)
const difficulty = ref('中等')

const stage = ref('setup') // setup | generating | testing | result
const genProgress = ref({ done: 0, total: 0 })
const questions = ref([])
const answers = ref({})
const current = ref(0)
const fallbackUsed = ref(false)
const result = ref(null)
const submitting = ref(false)
let startedAt = 0

const isConfigured = computed(() => modelStore.isConfigured)

const answeredCount = computed(() => Object.keys(answers.value).length)
const unansweredCount = computed(() => questions.value.length - answeredCount.value)
const currentQuestion = computed(() => questions.value[current.value] || null)
const progressPercent = computed(() =>
  questions.value.length ? Math.round((answeredCount.value / questions.value.length) * 100) : 0,
)

onMounted(() => {
  const q = route.query.chapters
  if (q) {
    const list = String(q)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const matched = list
      .map((s) => chapterOptions.find((c) => c === s || c.includes(s)))
      .filter(Boolean)
    if (matched.length) selectedChapters.value = matched
  }
  const c = Number(route.query.count)
  if ([5, 10, 20].includes(c)) count.value = c
})

function toggleChapter(ch) {
  const i = selectedChapters.value.indexOf(ch)
  if (i >= 0) {
    if (selectedChapters.value.length === 1) {
      ElMessage.warning('至少保留一个章节')
      return
    }
    selectedChapters.value.splice(i, 1)
  } else {
    selectedChapters.value.push(ch)
  }
}

/** 把总题数分摊到各章，每批最多 5 题，避免单次输出被截断 */
function planBatches(chapters, total) {
  const per = Math.floor(total / chapters.length)
  const rem = total % chapters.length
  const targets = chapters.map((chapter, i) => ({
    chapter,
    n: per + (i < rem ? 1 : 0),
  }))
  const batches = []
  targets.forEach((t) => {
    let left = t.n
    while (left > 0) {
      const n = Math.min(5, left)
      batches.push({ chapter: t.chapter, count: n })
      left -= n
    }
  })
  return batches.filter((b) => b.count > 0)
}

async function start() {
  if (!isConfigured.value) {
    ElMessage.warning('请先到「模型接入」页面完成配置')
    return
  }
  if (!selectedChapters.value.length) {
    ElMessage.warning('请先选择至少一个章节')
    return
  }

  const batches = planBatches(selectedChapters.value, count.value)
  stage.value = 'generating'
  genProgress.value = { done: 0, total: batches.length }
  questions.value = []
  answers.value = {}
  fallbackUsed.value = false

  try {
    for (let i = 0; i < batches.length; i += 1) {
      const b = batches[i]
      const res = await generateSelfTest({
        chapter: b.chapter,
        count: b.count,
        difficulty: difficulty.value,
        discipline: userStore.discipline,
      })
      // 每批题 id 重新编号，避免不同批次出现相同的 q-1
      questions.value.push(
        ...res.questions.map((item, qi) => ({
          ...item,
          id: `b${i}-${qi}-${item.id || 'q'}`,
        })),
      )
      if (res.fallback) fallbackUsed.value = true
      genProgress.value.done = i + 1
    }
    if (questions.value.length < 3) {
      throw new Error('生成题目不足，请重试或减少题量')
    }
    // 题干去重（模型偶尔重复）
    const seen = new Set()
    questions.value = questions.value.filter((q) => {
      const key = q.stem.slice(0, 40)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    current.value = 0
    startedAt = Date.now()
    stage.value = 'testing'
  } catch (err) {
    ElMessage.error(err.message || '自测题生成失败，请重试')
    stage.value = 'setup'
  }
}

function pick(index) {
  if (!currentQuestion.value) return
  answers.value = { ...answers.value, [currentQuestion.value.id]: index }
}

function next() {
  if (current.value < questions.value.length - 1) current.value += 1
}

function prev() {
  if (current.value > 0) current.value -= 1
}

async function submit() {
  if (unansweredCount.value > 0) {
    try {
      await ElMessageBox.confirm(
        `还有 ${unansweredCount.value} 题未作答。未作答按错误计，确定提交吗？`,
        '提交自测',
        { confirmButtonText: '仍然提交', cancelButtonText: '回去补答', type: 'warning' },
      )
    } catch {
      return
    }
  }
  submitting.value = true
  try {
    const session = selfTestStore.addSession({
      studentId: userStore.user?.id,
      studentName: userStore.name,
      chapters: selectedChapters.value,
      questions: questions.value,
      answers: answers.value,
      durationMs: Date.now() - startedAt,
      fallback: fallbackUsed.value,
    })
    result.value = session
    stage.value = 'result'
  } finally {
    submitting.value = false
  }
}

function restart() {
  stage.value = 'setup'
  questions.value = []
  answers.value = {}
  result.value = null
  fallbackUsed.value = false
}

function goCheatsheet() {
  router.push({ path: '/app/cheatsheet', query: { chapters: selectedChapters.value.join(',') } })
}

function goCheckup() {
  router.push('/app/checkup')
}

function optionClass(q, index) {
  if (!q) return ''
  const picked = answers.value[q.id]
  if (picked === undefined) return ''
  return picked === index ? 'is-picked' : 'is-dim'
}

function reviewClass(q) {
  const picked = answers.value[q.id]
  if (picked === undefined) return 'is-wrong'
  return Number(picked) === Number(q.answerIndex) ? 'is-right' : 'is-wrong'
}

function formatDuration(ms) {
  const s = Math.round((ms || 0) / 1000)
  return `${Math.floor(s / 60)} 分 ${s % 60} 秒`
}
</script>

<template>
  <div class="selftest-page">
    <div class="page-head">
      <div>
        <h3 class="page-title">章节自测 · 先测后学</h3>
        <p class="page-desc">
          合上资料，凭记忆作答。回想时的那点不适，正是记忆在加固的位置——不是失败信号。
        </p>
      </div>
      <el-tag v-if="fallbackUsed" type="warning" effect="plain">含演示缓存题目</el-tag>
    </div>

    <!-- 设置 -->
    <div v-if="stage === 'setup'" class="card">
      <h4 class="card-title">1. 选择章节</h4>
      <div class="chip-wrap">
        <span
          v-for="c in chapterOptions"
          :key="c"
          class="pick-chip"
          :class="{ on: selectedChapters.includes(c) }"
          @click="toggleChapter(c)"
        >
          {{ c }}
        </span>
      </div>

      <h4 class="card-title mt20">2. 题量与难度</h4>
      <div class="setting-row">
        <el-radio-group v-model="count">
          <el-radio-button :value="5">5 题 · 摸底</el-radio-button>
          <el-radio-button :value="10">10 题 · 常规</el-radio-button>
          <el-radio-button :value="20">20 题 · 考前</el-radio-button>
        </el-radio-group>
        <el-select v-model="difficulty" style="width: 120px">
          <el-option label="基础" value="基础" />
          <el-option label="中等" value="中等" />
          <el-option label="提高" value="提高" />
        </el-select>
      </div>

      <div class="start-row">
        <el-button type="primary" :disabled="!isConfigured" @click="start">
          开始自测
        </el-button>
        <span v-if="!isConfigured" class="hint">请先到「模型接入」完成配置</span>
        <span v-else class="hint">
          选择题会自动判分；提交后才显示解析，作答期间没有任何提示。
        </span>
      </div>
    </div>

    <!-- 生成中 -->
    <div v-else-if="stage === 'generating'" class="card gen-card">
      <el-icon class="is-loading gen-icon"><Loading /></el-icon>
      <h4 class="card-title">正在为你出题</h4>
      <p class="page-desc">
        按章节分批生成，避免一次输出被截断。已完成
        {{ genProgress.done }} / {{ genProgress.total }} 组。
      </p>
      <el-progress
        :percentage="genProgress.total ? Math.round((genProgress.done / genProgress.total) * 100) : 0"
        :stroke-width="8"
      />
    </div>

    <!-- 作答 -->
    <template v-else-if="stage === 'testing'">
      <div class="card test-card">
        <div class="test-head">
          <span class="test-counter">
            第 {{ current + 1 }} / {{ questions.length }} 题
          </span>
          <span class="test-meta">已答 {{ answeredCount }} 题</span>
        </div>
        <el-progress :percentage="progressPercent" :show-text="false" :stroke-width="4" />

        <div v-if="currentQuestion" class="question-body">
          <div class="q-chapter">{{ currentQuestion.chapter }} · {{ currentQuestion.concept }}</div>
          <div class="q-stem">{{ currentQuestion.stem }}</div>
          <div class="q-options">
            <div
              v-for="(opt, oi) in currentQuestion.options"
              :key="oi"
              class="q-option"
              :class="optionClass(currentQuestion, oi)"
              @click="pick(oi)"
            >
              <span class="q-option-no">{{ String.fromCharCode(65 + oi) }}</span>
              <span class="q-option-text">{{ opt }}</span>
            </div>
          </div>
        </div>

        <div class="test-actions">
          <el-button :disabled="current === 0" @click="prev">上一题</el-button>
          <el-button v-if="current < questions.length - 1" type="primary" plain @click="next">
            下一题
          </el-button>
          <el-button v-else type="primary" :loading="submitting" @click="submit">
            提交并看结果
          </el-button>
        </div>
      </div>

      <div class="card dot-card">
        <span class="dot-label">答题卡</span>
        <div class="dot-nav">
          <span
            v-for="(q, qi) in questions"
            :key="q.id"
            class="dot-item"
            :class="{ done: answers[q.id] !== undefined, cur: qi === current }"
            @click="current = qi"
          >
            {{ qi + 1 }}
          </span>
        </div>
      </div>
    </template>

    <!-- 结果 -->
    <template v-else-if="stage === 'result' && result">
      <div class="card result-card">
        <div class="result-main">
          <div class="result-score">
            <span class="result-num">{{ result.correct }}</span>
            <span class="result-total">/ {{ result.total }}</span>
          </div>
          <div class="result-info">
            <div class="result-title">正确率 {{ result.accuracy }}%</div>
            <div class="result-sub">
              用时 {{ formatDuration(result.durationMs) }} · 覆盖
              {{ result.chapters.length }} 个章节
            </div>
            <div v-if="fallbackUsed" class="result-sub">本次含演示缓存题目</div>
          </div>
        </div>

        <div v-if="result.wrongConcepts.length" class="weak-block">
          <div class="weak-label">暴露出的概念盲点</div>
          <div class="chip-wrap">
            <span v-for="t in result.wrongConcepts" :key="t" class="weak-chip">{{ t }}</span>
          </div>
          <p class="weak-tip">
            这不是"你不行"，而是下一次复习的精确坐标。先回到这几个概念，再重做一组同章自测。
          </p>
        </div>
        <div v-else class="weak-block">
          <div class="weak-label">这一组没有明显盲点</div>
          <p class="weak-tip">可以换一个章节，或用 20 题模式做一次跨章自测。</p>
        </div>

        <div class="result-actions">
          <el-button type="primary" @click="restart">再来一组</el-button>
          <el-button plain @click="goCheatsheet">看本章速查表</el-button>
          <el-button plain @click="goCheckup">查看学习体检</el-button>
        </div>
      </div>

      <div class="card">
        <h4 class="card-title">逐题回顾</h4>
        <div v-for="(q, qi) in result.questions" :key="q.id" class="review-item" :class="reviewClass(q)">
          <div class="review-head">
            <span class="review-no">{{ qi + 1 }}</span>
            <span class="review-stem">{{ q.stem }}</span>
            <el-tag
              size="small"
              :type="Number(result.answers[q.id]) === Number(q.answerIndex) ? 'success' : 'danger'"
              effect="plain"
            >
              {{ Number(result.answers[q.id]) === Number(q.answerIndex) ? '正确' : '错误' }}
            </el-tag>
          </div>
          <div class="review-answer">
            正确答案：{{ String.fromCharCode(65 + q.answerIndex) }}.
            {{ q.options[q.answerIndex] }}
            <span v-if="result.answers[q.id] !== undefined" class="review-mine">
              · 你选了 {{ String.fromCharCode(65 + Number(result.answers[q.id])) }}
            </span>
            <span v-else class="review-mine">· 未作答</span>
          </div>
          <div v-if="q.explanation" class="review-expl">{{ q.explanation }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.selftest-page {
  padding-bottom: 12px;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.page-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.page-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-sub);
}

.card {
  padding: 16px;
  margin-bottom: 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.card-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.mt20 {
  margin-top: 20px;
}

.chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pick-chip {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--text-sub);
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pick-chip.on {
  color: var(--accent-on);
  background: var(--accent);
  border-color: var(--accent);
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.start-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

.hint {
  font-size: 12px;
  color: var(--text-sub);
}

.gen-card {
  text-align: center;
  padding: 32px 16px;
}

.gen-icon {
  font-size: 28px;
  color: var(--accent);
  margin-bottom: 8px;
}

.test-card {
  padding: 18px 20px;
}

.test-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.test-counter {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.test-meta {
  font-size: 12px;
  color: var(--text-sub);
}

.question-body {
  padding: 18px 0 6px;
}

.q-chapter {
  font-size: 11px;
  letter-spacing: 0.5px;
  color: var(--text-faint);
  margin-bottom: 8px;
}

.q-stem {
  font-size: 16px;
  line-height: 1.8;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: 16px;
}

.q-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.q-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--bg-page);
}

.q-option:hover {
  border-color: var(--accent);
}

.q-option.is-picked {
  border-color: var(--accent);
  background: var(--accent-soft, rgba(34, 211, 238, 0.1));
}

.q-option.is-dim {
  opacity: 0.55;
}

.q-option-no {
  flex: none;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text-sub);
}

.q-option.is-picked .q-option-no {
  background: var(--accent);
  color: var(--accent-on);
}

.q-option-text {
  font-size: 14px;
  line-height: 1.65;
  color: var(--text-main);
}

.test-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 18px;
}

.dot-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
}

.dot-label {
  flex: none;
  font-size: 12px;
  color: var(--text-sub);
  padding-top: 4px;
}

.dot-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dot-item {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  font-size: 11px;
  border-radius: 6px;
  border: 1px solid var(--border);
  color: var(--text-sub);
  cursor: pointer;
}

.dot-item.done {
  background: var(--surface-2);
  color: var(--text-main);
}

.dot-item.cur {
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 700;
}

.result-card {
  padding: 20px;
}

.result-main {
  display: flex;
  align-items: center;
  gap: 20px;
}

.result-score {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-family: var(--font-mono, monospace);
}

.result-num {
  font-size: 44px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.result-total {
  font-size: 16px;
  color: var(--text-sub);
}

.result-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.result-sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-sub);
}

.weak-block {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed var(--border);
}

.weak-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 8px;
}

.weak-chip {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--warn, #e6a23c);
  background: var(--warn-soft, rgba(230, 162, 60, 0.12));
  border-radius: 999px;
}

.weak-tip {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-sub);
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.review-item {
  padding: 12px 14px;
  margin-bottom: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  border-left-width: 3px;
}

.review-item.is-right {
  border-left-color: var(--success, #67c23a);
}

.review-item.is-wrong {
  border-left-color: var(--danger, #f56c6c);
}

.review-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.review-no {
  flex: none;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  font-size: 11px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text-sub);
}

.review-stem {
  flex: 1;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-main);
}

.review-answer {
  margin: 8px 0 0 28px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-sub);
}

.review-mine {
  color: var(--text-faint);
}

.review-expl {
  margin: 6px 0 0 28px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-sub);
}
</style>
