<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
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
const selected = ref(COURSE.chapters[2]?.title || chapterOptions[0])
const count = ref(5)
const difficulty = ref('中等')

const stage = ref('setup')
const genProgress = ref({ done: 0, total: 0 })
const questions = ref([])
const answers = ref({})
const current = ref(0)
const result = ref(null)
const fallbackUsed = ref(false)
let startedAt = 0

const isConfigured = computed(() => modelStore.isConfigured)
const q = computed(() => questions.value[current.value] || null)
const answeredCount = computed(() => Object.keys(answers.value).length)
const unanswered = computed(() => questions.value.length - answeredCount.value)
const progress = computed(() =>
  questions.value.length ? Math.round((answeredCount.value / questions.value.length) * 100) : 0,
)

onMounted(() => {
  const c = String(route.query.chapters || '').trim()
  if (c) {
    const found = chapterOptions.find((x) => x === c || x.includes(c))
    if (found) selected.value = found
  }
  const n = Number(route.query.count)
  if ([5, 10].includes(n)) count.value = n
})

function planBatches(total) {
  const batches = []
  let left = total
  while (left > 0) {
    const n = Math.min(5, left)
    batches.push(n)
    left -= n
  }
  return batches
}

async function start() {
  if (!isConfigured.value) {
    showToast('请先在电脑端完成模型配置')
    return
  }
  const batches = planBatches(count.value)
  stage.value = 'generating'
  genProgress.value = { done: 0, total: batches.length }
  questions.value = []
  answers.value = {}
  fallbackUsed.value = false

  try {
    for (let i = 0; i < batches.length; i += 1) {
      const res = await generateSelfTest({
        chapter: selected.value,
        count: batches[i],
        difficulty: difficulty.value,
        discipline: userStore.discipline,
      })
      questions.value.push(
        ...res.questions.map((item, qi) => ({
          ...item,
          id: `b${i}-${qi}-${item.id || 'q'}`,
        })),
      )
      if (res.fallback) fallbackUsed.value = true
      genProgress.value.done = i + 1
    }
    const seen = new Set()
    questions.value = questions.value.filter((x) => {
      const k = x.stem.slice(0, 40)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    if (questions.value.length < 3) throw new Error('题目生成不足，请重试')
    current.value = 0
    startedAt = Date.now()
    stage.value = 'testing'
  } catch (err) {
    showToast(err.message || '生成失败')
    stage.value = 'setup'
  }
}

function pick(i) {
  if (!q.value) return
  answers.value = { ...answers.value, [q.value.id]: i }
}

function next() {
  if (current.value < questions.value.length - 1) current.value += 1
}

function prev() {
  if (current.value > 0) current.value -= 1
}

async function submit() {
  if (unanswered.value > 0) {
    try {
      await showConfirmDialog({
        title: '还有题目未作答',
        message: `还有 ${unanswered.value} 题未答，未答按错误计。确定提交吗？`,
        confirmButtonText: '仍然提交',
      })
    } catch {
      return
    }
  }
  result.value = selfTestStore.addSession({
    studentId: userStore.user?.id,
    studentName: userStore.name,
    chapters: [selected.value],
    questions: questions.value,
    answers: answers.value,
    durationMs: Date.now() - startedAt,
    fallback: fallbackUsed.value,
  })
  stage.value = 'result'
}

function restart() {
  stage.value = 'setup'
  questions.value = []
  answers.value = {}
  result.value = null
  fallbackUsed.value = false
}

function goCheatsheet() {
  router.push({ path: '/m/cheatsheet', query: { chapters: selected.value } })
}
</script>

<template>
  <div class="m-page">
    <div class="m-head">
      <div class="m-title">章节自测</div>
      <div class="m-sub">合上资料，凭记忆作答；提交后才看解析。</div>
    </div>

    <template v-if="stage === 'setup'">
      <div class="m-card">
        <div class="m-label">选择章节</div>
        <div class="m-chips">
          <span
            v-for="c in chapterOptions"
            :key="c"
            class="skin-chip"
            :class="{ on: selected === c }"
            @click="selected = c"
          >
            {{ c }}
          </span>
        </div>

        <div class="m-label mt">题量</div>
        <div class="m-chips">
          <span class="skin-chip" :class="{ on: count === 5 }" @click="count = 5">5 题 · 摸底</span>
          <span class="skin-chip" :class="{ on: count === 10 }" @click="count = 10">10 题 · 常规</span>
        </div>

        <div class="m-label mt">难度</div>
        <div class="m-chips">
          <span
            v-for="d in ['基础', '中等', '提高']"
            :key="d"
            class="skin-chip"
            :class="{ on: difficulty === d }"
            @click="difficulty = d"
          >
            {{ d }}
          </span>
        </div>

        <van-button block type="primary" class="mt" :disabled="!isConfigured" @click="start">
          开始自测
        </van-button>
        <p v-if="!isConfigured" class="m-tip">请先在电脑端「模型接入」完成配置</p>
      </div>
    </template>

    <template v-else-if="stage === 'generating'">
      <div class="m-card m-center">
        <van-loading size="24" />
        <p class="m-tip">正在出题 {{ genProgress.done }} / {{ genProgress.total }} 组…</p>
      </div>
    </template>

    <template v-else-if="stage === 'testing' && q">
      <div class="m-card">
        <div class="m-progress-row">
          <span>第 {{ current + 1 }} / {{ questions.length }} 题</span>
          <span>已答 {{ answeredCount }}</span>
        </div>
        <van-progress :percentage="progress" :show-pivot="false" stroke-width="3" />

        <div class="m-q-meta">{{ q.chapter }} · {{ q.concept }}</div>
        <div class="m-stem">{{ q.stem }}</div>

        <div class="m-options">
          <div
            v-for="(opt, oi) in q.options"
            :key="oi"
            class="m-option"
            :class="{ on: answers[q.id] === oi }"
            @click="pick(oi)"
          >
            <span class="m-option-no">{{ String.fromCharCode(65 + oi) }}</span>
            <span>{{ opt }}</span>
          </div>
        </div>

        <div class="m-actions">
          <van-button size="small" plain :disabled="current === 0" @click="prev">上一题</van-button>
          <van-button
            v-if="current < questions.length - 1"
            size="small"
            type="primary"
            plain
            @click="next"
          >
            下一题
          </van-button>
          <van-button v-else size="small" type="primary" @click="submit">提交</van-button>
        </div>
      </div>
    </template>

    <template v-else-if="stage === 'result' && result">
      <div class="m-card m-result">
        <div class="m-score">{{ result.correct }}<small>/{{ result.total }}</small></div>
        <div class="m-score-label">正确率 {{ result.accuracy }}%</div>
        <div v-if="result.wrongConcepts.length" class="m-weak">
          <div class="m-label">暴露出的概念盲点</div>
          <div class="m-chips">
            <span v-for="t in result.wrongConcepts" :key="t" class="m-weak-chip">{{ t }}</span>
          </div>
          <p class="m-tip">这不是失败，是下一次复习的精确坐标。</p>
        </div>
        <div class="m-actions">
          <van-button size="small" plain @click="restart">再来一组</van-button>
          <van-button size="small" type="primary" plain @click="goCheatsheet">看速查表</van-button>
        </div>
      </div>

      <div class="m-card">
        <div class="m-label">逐题回顾</div>
        <div v-for="(item, i) in result.questions" :key="item.id" class="m-review">
          <div class="m-review-stem">
            {{ i + 1 }}. {{ item.stem }}
            <span
              class="m-review-flag"
              :class="{ ok: Number(result.answers[item.id]) === Number(item.answerIndex) }"
            >
              {{ Number(result.answers[item.id]) === Number(item.answerIndex) ? '对' : '错' }}
            </span>
          </div>
          <div class="m-review-ans">
            正确答案：{{ String.fromCharCode(65 + item.answerIndex) }}.
            {{ item.options[item.answerIndex] }}
          </div>
          <div v-if="item.explanation" class="m-review-exp">{{ item.explanation }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.m-page {
  padding: 12px 0 20px;
}

.m-head {
  padding: 4px 16px 10px;
}

.m-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.m-sub {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-sub);
}

.m-card {
  margin: 0 12px 12px;
  padding: 14px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.m-label {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.mt {
  margin-top: 16px;
}

.m-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.m-tip {
  margin: 8px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-sub);
}

.m-center {
  text-align: center;
  padding: 28px 14px;
}

.m-progress-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 11.5px;
  color: var(--text-sub);
}

.m-q-meta {
  margin-top: 14px;
  font-size: 11px;
  color: var(--text-faint);
}

.m-stem {
  margin-top: 6px;
  font-size: 15px;
  line-height: 1.75;
  font-weight: 500;
  color: var(--text-main);
}

.m-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.m-option {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-main);
  background: var(--bg-page);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.m-option.on {
  border-color: var(--accent);
  background: var(--accent-soft, rgba(34, 211, 238, 0.1));
}

.m-option-no {
  flex: none;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text-sub);
}

.m-option.on .m-option-no {
  background: var(--accent);
  color: var(--accent-on);
}

.m-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.m-result {
  text-align: center;
}

.m-score {
  font-family: var(--font-mono, monospace);
  font-size: 40px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1.1;
}

.m-score small {
  font-size: 14px;
  color: var(--text-sub);
}

.m-score-label {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-main);
}

.m-weak {
  margin-top: 14px;
  text-align: left;
}

.m-weak-chip {
  padding: 4px 9px;
  font-size: 11.5px;
  color: var(--warn, #e6a23c);
  background: var(--warn-soft, rgba(230, 162, 60, 0.12));
  border-radius: 999px;
}

.m-review {
  padding: 10px 0;
  border-bottom: 1px dashed var(--border);
}

.m-review:last-child {
  border-bottom: none;
}

.m-review-stem {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-main);
}

.m-review-flag {
  margin-left: 4px;
  padding: 1px 5px;
  font-size: 10px;
  border-radius: 3px;
  color: var(--danger, #f56c6c);
  border: 1px solid currentColor;
}

.m-review-flag.ok {
  color: var(--success, #67c23a);
}

.m-review-ans {
  margin-top: 4px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-sub);
}

.m-review-exp {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-faint);
}
</style>
