<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import BoardCanvas from '@/components/BoardCanvas.vue'
import CourseCompleteCard from '@/components/course/CourseCompleteCard.vue'
import { useCourseStudioStore } from '@/stores/courseStudio'
import { COURSE_SCENE_LABELS, summarizeCourseProject } from '@/utils/courseStudio'
import { SCRIPT_BEAT_LABELS } from '@/utils/courseScript'
import { downloadBoardLesson } from '@/utils/boardDownload'

const route = useRoute()
const router = useRouter()
const studio = useCourseStudioStore()

const PLAY_SPEEDS = [1, 1.5, 2]

const loading = ref(true)
const missing = ref(false)
const selectedSceneId = ref('')
const scriptOpen = ref(false)
const projectId = computed(() => String(route.params.projectId || ''))
const project = computed(() => studio.find(projectId.value))
const stats = computed(() =>
  project.value ? summarizeCourseProject(project.value) : { totalMinutes: 0 },
)
const selectedOutline = computed(() =>
  project.value?.outlines.find((outline) => outline.id === selectedSceneId.value),
)
const selectedScene = computed(() =>
  project.value?.scenes.find((scene) => scene.outlineId === selectedSceneId.value),
)
const readyCount = computed(
  () =>
    project.value?.scenes.filter((scene) =>
      ['ready', 'fallback'].includes(scene.status),
    ).length || 0,
)
const generating = computed(
  () => project.value?.status === 'generating' || studio.isGenerating(projectId.value),
)
const progress = computed(() =>
  project.value?.outlines.length
    ? Math.round((readyCount.value / project.value.outlines.length) * 100)
    : 0,
)

// ---------------------------------------------------------------- 学习进度（会话级）
// P0-1/P0-2：完课闭环与小测作答的本地确定性状态，不写库、刷新即重置。
const visitedSceneIds = ref([])
const quizResults = ref([]) // { outlineId, questionId, correct }
const boardAnswerCounts = ref({}) // outlineId -> 已作答的板书问题数
const finished = ref(false)

// 小测作答状态（切换场景即重置）
const quizAnswers = ref({}) // questionId -> optionIndex
const quizJudged = ref({}) // questionId -> true（已判定）
const quizCursor = ref(0) // 当前题序

// 讲稿播放状态（P0-3）
const beatIndex = ref(0)
const playing = ref(false)
const speed = ref(1)
const revealedCount = ref(999)
let beatTimer = null

const beats = computed(() => selectedScene.value?.script?.beats || [])
const currentBeat = computed(() => beats.value[beatIndex.value] || null)
const isLastScene = computed(() => {
  if (!project.value || !selectedOutline.value) return false
  const sorted = [...project.value.outlines].sort((a, b) => a.order - b.order)
  return sorted.at(-1)?.id === selectedOutline.value.id
})

const quizQuestions = computed(() =>
  selectedScene.value?.content?.kind === 'quiz'
    ? selectedScene.value.content.questions || []
    : [],
)
const currentQuestion = computed(() => quizQuestions.value[quizCursor.value] || null)
const currentChoice = computed(() =>
  currentQuestion.value ? quizAnswers.value[currentQuestion.value.id] ?? null : null,
)
const currentJudged = computed(
  () => !!currentQuestion.value && !!quizJudged.value[currentQuestion.value.id],
)
const sceneQuizCorrect = computed(() =>
  quizResults.value.filter(
    (item) => item.outlineId === selectedSceneId.value && item.correct,
  ).length,
)
const sceneQuizDone = computed(
  () =>
    quizQuestions.value.length > 0 &&
    quizQuestions.value.every((question) => quizJudged.value[question.id]),
)
const completionStats = computed(() => {
  const scenes = project.value?.scenes || []
  const quizScenes = scenes.filter((scene) => scene.content?.kind === 'quiz')
  const breakdown = quizScenes.map((scene) => {
    const results = quizResults.value.filter((item) => item.outlineId === scene.outlineId)
    const correct = results.filter((item) => item.correct).length
    return {
      id: scene.outlineId,
      title:
        project.value?.outlines.find((outline) => outline.id === scene.outlineId)?.title ||
        '小测',
      total: results.length,
      correct,
      rate: results.length ? Math.round((correct / results.length) * 100) : 0,
    }
  })
  return {
    sceneCount: project.value?.outlines.length || 0,
    visitedCount: visitedSceneIds.value.length,
    boardCount: scenes.filter((scene) => scene.content?.kind === 'board').length,
    quizTotal: quizResults.value.length,
    quizCorrect: quizResults.value.filter((item) => item.correct).length,
    minutes: stats.value.totalMinutes || 0,
    quizScenes: breakdown.filter((item) => item.total > 0),
  }
})

function ensureUsableSelection() {
  if (!project.value) return
  const current = project.value.scenes.find((scene) => scene.outlineId === selectedSceneId.value)
  if (current && ['ready', 'fallback', 'generating'].includes(current.status)) return
  const firstReady = project.value.scenes.find((scene) =>
    ['ready', 'fallback'].includes(scene.status),
  )
  selectedSceneId.value =
    firstReady?.outlineId || project.value.outlines[0]?.id || ''
}

async function ensureGeneration() {
  if (!project.value) return
  if (project.value.status === 'outline' || project.value.status === 'failed') {
    void studio.runGeneration(project.value.id, { concurrency: 3 })
  } else if (
    project.value.status === 'generating' &&
    !studio.isGenerating(project.value.id)
  ) {
    void studio.runGeneration(project.value.id, { concurrency: 3 })
  }
}

onMounted(async () => {
  await studio.load()
  if (!project.value) {
    missing.value = true
    loading.value = false
    return
  }
  ensureUsableSelection()
  await ensureGeneration()
  loading.value = false
})

watch(
  () =>
    project.value?.scenes
      .map((scene) => `${scene.outlineId}:${scene.status}`)
      .join('|') || '',
  () => ensureUsableSelection(),
)

function chooseScene(id) {
  selectedSceneId.value = id
}

function continueGeneration() {
  if (!project.value || studio.isGenerating(project.value.id)) return
  ElMessage.info('正在继续生成后面的场景')
  void studio.runGeneration(project.value.id, { concurrency: 3 })
}

function stopGeneration() {
  if (!project.value) return
  studio.cancelGeneration(project.value.id)
  ElMessage.info('将在当前场景完成后停止')
}

function backToStudio() {
  router.push({ path: '/app/studio', query: { project: projectId.value } })
}

// ---------------------------------------------------------------- 小测作答（P0-2）
function resetQuizState() {
  quizAnswers.value = {}
  quizJudged.value = {}
  quizCursor.value = 0
}

function chooseQuizOption(questionId, optionIndex) {
  if (quizJudged.value[questionId]) return
  quizAnswers.value = { ...quizAnswers.value, [questionId]: optionIndex }
}

function submitQuizAnswer(question) {
  if (!question || quizJudged.value[question.id]) return
  const picked = quizAnswers.value[question.id]
  if (picked == null) {
    ElMessage.warning('先选择一个选项，再提交答案')
    return
  }
  quizJudged.value = { ...quizJudged.value, [question.id]: true }
  quizResults.value = [
    ...quizResults.value,
    {
      outlineId: selectedSceneId.value,
      questionId: question.id,
      correct: picked === question.answerIndex,
    },
  ]
}

function nextQuizQuestion() {
  if (quizCursor.value >= quizQuestions.value.length - 1) {
    if (isLastScene.value) {
      finishCourse()
    } else {
      ElMessage.success('本场景小测完成，可切换到下一场景')
    }
    return
  }
  quizCursor.value += 1
}

function onBoardAnswer(payload) {
  // 板书内嵌问题：按场景去重计数（同一 prompt 只记一次）
  const key = String(payload?.question || '')
  if (!key) return
  const sceneId = selectedSceneId.value
  const seen = boardAnswerCounts.value[sceneId] || new Set()
  if (seen.has(key)) return
  const next = new Set(seen)
  next.add(key)
  boardAnswerCounts.value = { ...boardAnswerCounts.value, [sceneId]: next }
}

// ---------------------------------------------------------------- 讲稿播放（P0-3）
function syncReveal() {
  const beat = currentBeat.value
  const lesson = selectedScene.value?.content?.lesson
  if (!beat?.blockId || !lesson) return
  const index = (lesson.blocks || []).findIndex((block) => block.id === beat.blockId)
  if (index >= 0) revealedCount.value = Math.max(revealedCount.value, index + 1)
}

function pausePlayback() {
  playing.value = false
  if (beatTimer) {
    clearTimeout(beatTimer)
    beatTimer = null
  }
}

function togglePlayback() {
  if (playing.value) {
    pausePlayback()
    return
  }
  if (!beats.value.length) {
    ElMessage.info('这一场景还没有讲稿')
    return
  }
  if (beatIndex.value >= beats.value.length - 1) beatIndex.value = 0
  playing.value = true
  scriptOpen.value = true
  scheduleBeat()
}

function scheduleBeat() {
  if (!playing.value) return
  const beat = currentBeat.value
  if (!beat) {
    pausePlayback()
    return
  }
  const wait = Math.max(300, (beat.pauseMs || 800) / speed.value)
  beatTimer = setTimeout(() => {
    if (!playing.value) return
    if (beatIndex.value >= beats.value.length - 1) {
      pausePlayback()
      return
    }
    beatIndex.value += 1
    syncReveal()
    scheduleBeat()
  }, wait)
}

function stepBeat(delta) {
  pausePlayback()
  if (!beats.value.length) return
  beatIndex.value = Math.min(
    Math.max(0, beatIndex.value + delta),
    beats.value.length - 1,
  )
  syncReveal()
}

function cycleSpeed() {
  const index = PLAY_SPEEDS.indexOf(speed.value)
  speed.value = PLAY_SPEEDS[(index + 1) % PLAY_SPEEDS.length]
}

// ---------------------------------------------------------------- 完课闭环（P0-1）
function finishCourse() {
  finished.value = true
  pausePlayback()
}

function restartCourse() {
  finished.value = false
  quizResults.value = []
  visitedSceneIds.value = []
  boardAnswerCounts.value = {}
  resetQuizState()
  beatIndex.value = 0
  revealedCount.value = 999
  pausePlayback()
  ensureUsableSelection()
  ElMessage.success('已重置学习进度，可以重新开始')
}

watch(
  () => selectedSceneId.value,
  (id) => {
    if (!id) return
    if (!visitedSceneIds.value.includes(id)) visitedSceneIds.value.push(id)
    resetQuizState()
    beatIndex.value = 0
    revealedCount.value = 999
    pausePlayback()
  },
)

onBeforeUnmount(() => {
  if (beatTimer) clearTimeout(beatTimer)
})
</script>

<template>
  <div class="experience-page">
    <header class="experience-topbar">
      <button type="button" class="back-button" @click="backToStudio">← 返回编排</button>
      <div class="experience-brand">
        <span>协同智学</span>
        <strong>{{ project?.title || '课程体验' }}</strong>
      </div>
      <div class="topbar-actions">
        <span class="mode-badge">
          {{ project?.mode === 'sprint' ? 'ϟ 考前冲刺' : '▤ 正常上课' }}
        </span>
        <button
          v-if="generating"
          type="button"
          class="quiet-button"
          @click="stopGeneration"
        >
          当前场景后停止
        </button>
        <button
          v-else-if="project && project.status !== 'ready'"
          type="button"
          class="quiet-button"
          @click="continueGeneration"
        >
          继续生成
        </button>
      </div>
    </header>

    <main v-if="loading" class="experience-loading">
      <span />
      <p>正在准备课程体验…</p>
    </main>

    <main v-else-if="missing" class="experience-loading">
      <h1>没有找到这门课程</h1>
      <button type="button" @click="backToStudio">返回课程编排</button>
    </main>

    <main v-else class="experience-content">
      <section class="course-heading">
        <div>
          <span class="eyebrow">COURSE EXPERIENCE · {{ project.chapter }}</span>
          <h1>{{ project.title }}</h1>
          <p>{{ project.summary }}</p>
        </div>
        <div class="course-metrics">
          <strong>{{ stats.totalMinutes }}</strong>
          <span>分钟</span>
          <strong>{{ readyCount }}/{{ project.outlines.length }}</strong>
          <span>场景可用</span>
        </div>
      </section>

      <section class="progress-card">
        <div class="progress-copy">
          <strong>{{ generating ? '后面的内容正在生成' : project.status === 'ready' ? '课程已准备完毕' : '等待继续生成' }}</strong>
          <span>
            {{ generating ? '已完成的场景可以直接体验，页面会继续自动更新。' : '已生成内容已保存，可继续学习或回到编排页调整。' }}
          </span>
        </div>
        <div class="progress-track"><span :style="{ width: `${progress}%` }" /></div>
        <em>{{ progress }}%</em>
      </section>

      <nav class="scene-rail" aria-label="课程场景">
        <button
          v-for="(outline, index) in project.outlines"
          :key="outline.id"
          type="button"
          :class="{
            active: selectedSceneId === outline.id,
            ready: ['ready', 'fallback'].includes(
              project.scenes.find((scene) => scene.outlineId === outline.id)?.status,
            ),
            generating:
              project.scenes.find((scene) => scene.outlineId === outline.id)?.status ===
              'generating',
          }"
          @click="chooseScene(outline.id)"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ outline.title }}</strong>
          <small>{{ COURSE_SCENE_LABELS[outline.type] }}</small>
        </button>
      </nav>

      <section class="lesson-frame">
        <div class="lesson-toolbar">
          <div>
            <span>{{ selectedOutline ? COURSE_SCENE_LABELS[selectedOutline.type] : '课程场景' }}</span>
            <strong>{{ selectedOutline?.title || '正在准备第一个场景' }}</strong>
          </div>
          <div class="toolbar-group">
            <el-tag v-if="selectedScene?.status === 'fallback'" type="warning" effect="plain">
              演示缓存
            </el-tag>
            <div v-if="beats.length" class="playback-bar" role="group" aria-label="讲稿播放">
              <button
                type="button"
                class="frame-button play-button"
                :aria-label="playing ? '暂停讲解' : '播放讲解'"
                @click="togglePlayback"
              >
                {{ playing ? '❚❚ 暂停' : '▶ 播放' }}
              </button>
              <button type="button" class="frame-button" :disabled="beatIndex <= 0" @click="stepBeat(-1)">
                上一拍
              </button>
              <span class="beat-counter">{{ beatIndex + 1 }}/{{ beats.length }}</span>
              <button
                type="button"
                class="frame-button"
                :disabled="beatIndex >= beats.length - 1"
                @click="stepBeat(1)"
              >
                下一拍
              </button>
              <button type="button" class="frame-button speed-button" @click="cycleSpeed">
                {{ speed }}×
              </button>
            </div>
            <button
              v-if="selectedScene?.content?.kind === 'board'"
              type="button"
              class="frame-button"
              @click="downloadBoardLesson(selectedScene.content.lesson)"
            >
              下载板书
            </button>
            <button type="button" class="frame-button" @click="backToStudio">编辑课程</button>
          </div>
        </div>

        <div v-if="!selectedScene || selectedScene.status === 'pending'" class="scene-state">
          <span class="pulse-dot" />
          <h2>正在排队生成「{{ selectedOutline?.title }}」</h2>
          <p>先完成的内容已经可以切换体验，这一场景将在后台自动补齐。</p>
        </div>
        <div v-else-if="selectedScene.status === 'generating'" class="scene-state">
          <el-icon class="is-loading"><Loading /></el-icon>
          <h2>正在生成「{{ selectedOutline?.title }}」</h2>
          <p>你无需停留等待；其他已完成场景现在就可以体验。</p>
        </div>
        <div v-else-if="selectedScene.status === 'error'" class="scene-state error">
          <h2>这个场景生成中断</h2>
          <p>{{ selectedScene.error }}</p>
          <button type="button" @click="continueGeneration">继续生成</button>
        </div>
        <template v-else-if="selectedScene.content">
          <div v-if="selectedScene.content.kind === 'board'" class="landscape-board">
            <BoardCanvas
              :lesson="selectedScene.content.lesson"
              :visible-count="revealedCount"
              :interactive="true"
              landscape
              @answer="onBoardAnswer"
            />
          </div>
          <div v-else-if="selectedScene.content.kind === 'quiz'" class="experience-quiz">
            <article v-if="currentQuestion" class="quiz-stage">
              <header class="quiz-progress">
                <span class="quiz-counter">第 {{ quizCursor + 1 }} / {{ quizQuestions.length }} 题</span>
                <div class="quiz-dots" aria-hidden="true">
                  <i
                    v-for="(question, dotIndex) in quizQuestions"
                    :key="question.id"
                    :class="{
                      done: quizJudged[question.id],
                      active: dotIndex === quizCursor,
                      correct:
                        quizJudged[question.id] &&
                        quizAnswers[question.id] === question.answerIndex,
                    }"
                  />
                </div>
                <span class="quiz-score">已答对 {{ sceneQuizCorrect }}</span>
              </header>
              <h3 class="quiz-stem">{{ currentQuestion.stem }}</h3>
              <div class="quiz-options" role="radiogroup" :aria-label="currentQuestion.stem">
                <button
                  v-for="(option, optionIndex) in currentQuestion.options"
                  :key="option"
                  type="button"
                  role="radio"
                  :aria-checked="currentChoice === optionIndex"
                  :class="{
                    selected: currentChoice === optionIndex,
                    correct: currentJudged && optionIndex === currentQuestion.answerIndex,
                    wrong:
                      currentJudged &&
                      currentChoice === optionIndex &&
                      optionIndex !== currentQuestion.answerIndex,
                  }"
                  :disabled="currentJudged"
                  @click="chooseQuizOption(currentQuestion.id, optionIndex)"
                >
                  <span>{{ String.fromCharCode(65 + optionIndex) }}</span>
                  {{ option }}
                </button>
              </div>
              <footer class="quiz-footer">
                <template v-if="!currentJudged">
                  <button
                    type="button"
                    class="quiz-submit"
                    :disabled="currentChoice == null"
                    @click="submitQuizAnswer(currentQuestion)"
                  >
                    提交答案
                  </button>
                  <span class="quiz-hint">选择选项后提交，立即判定并给出解析</span>
                </template>
                <template v-else>
                  <p class="quiz-verdict" :class="{ wrong: currentChoice !== currentQuestion.answerIndex }">
                    {{
                      currentChoice === currentQuestion.answerIndex
                        ? '回答正确'
                        : `再想想：正确答案是 ${String.fromCharCode(65 + currentQuestion.answerIndex)}`
                    }}
                  </p>
                  <p v-if="currentQuestion.explanation" class="quiz-explanation">
                    {{ currentQuestion.explanation }}
                  </p>
                  <button type="button" class="quiz-submit" @click="nextQuizQuestion">
                    {{
                      quizCursor >= quizQuestions.length - 1
                        ? isLastScene
                          ? '完成课程'
                          : '完成小测'
                        : '下一题'
                    }}
                  </button>
                </template>
              </footer>
            </article>
            <div v-else class="scene-state">
              <h2>这个小测还没有可用题目</h2>
              <p>可以返回编排页重新生成该场景。</p>
            </div>
          </div>
          <div v-else-if="selectedScene.content.kind === 'practice'" class="experience-practice">
            <span>案例应用</span>
            <h2>{{ selectedScene.content.prompt }}</h2>
            <ol>
              <li v-for="point in selectedScene.content.referencePoints" :key="point">
                {{ point }}
              </li>
            </ol>
            <blockquote v-if="selectedScene.content.followUp">
              {{ selectedScene.content.followUp }}
            </blockquote>
          </div>
        </template>

        <!-- 讲稿层：beats 与板书视觉事件 1:1 对齐，问后有停顿标记 -->
        <div v-if="selectedScene?.script?.beats?.length" class="scene-script">
          <button
            type="button"
            class="script-toggle"
            :aria-expanded="scriptOpen"
            @click="scriptOpen = !scriptOpen"
          >
            <span class="script-icon" aria-hidden="true">◈</span>
            讲稿（{{ selectedScene.script.beats.length }} 拍）
            <span v-if="playing" class="script-live">播放中 {{ beatIndex + 1 }}/{{ beats.length }}</span>
            <span class="script-arrow" :class="{ open: scriptOpen }">▾</span>
          </button>
          <ol v-if="scriptOpen" class="script-beats">
            <li
              v-for="(beat, beatIndex_) in selectedScene.script.beats"
              :key="beatIndex_"
              :class="[
                `is-${beat.kind}`,
                { active: playing && beatIndex === beatIndex_ },
              ]"
              @click="beatIndex = beatIndex_; syncReveal()"
            >
              <span class="beat-kind">{{ SCRIPT_BEAT_LABELS[beat.kind] || beat.kind }}</span>
              <p>{{ beat.text }}</p>
              <span v-if="beat.kind === 'question'" class="beat-pause">停 {{ (beat.pauseMs / 1000).toFixed(1) }}s</span>
              <span v-if="beat.blockId" class="beat-block">→ {{ beat.blockId }}</span>
            </li>
          </ol>
        </div>

        <footer v-if="selectedScene && ['ready', 'fallback'].includes(selectedScene.status)" class="lesson-footer">
          <span v-if="sceneQuizDone" class="footer-hint">本场景小测已完成</span>
          <span v-else-if="isLastScene" class="footer-hint">这是最后一个场景</span>
          <button type="button" class="finish-button" @click="finishCourse">
            {{ isLastScene ? '完成课程，查看学习报告' : '提前完课，查看学习报告' }}
          </button>
        </footer>
      </section>

      <CourseCompleteCard
        v-if="finished"
        :title="`${project?.title || '课程'} · 学习报告`"
        :chapter="project?.chapter || ''"
        :stats="completionStats"
        @restart="restartCourse"
        @edit="backToStudio"
        @close="finished = false"
      />
    </main>
  </div>
</template>

<style scoped>
.experience-page {
  min-height: 100vh;
  padding: 18px 22px 40px;
  background: var(--page-bg);
  color: var(--text-main);
}

.experience-topbar {
  max-width: 1500px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  margin: 0 auto 18px;
  padding: 11px 14px;
  background: color-mix(in srgb, var(--card-bg) 88%, transparent);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(12px);
}

.back-button,
.quiet-button,
.frame-button,
.experience-loading button,
.scene-state button {
  padding: 6px 10px;
  color: var(--text-sub);
  background: var(--surface-2);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: 10.5px;
  cursor: pointer;
}

.back-button:hover,
.quiet-button:hover,
.frame-button:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.experience-brand {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.experience-brand span {
  flex: none;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.experience-brand strong {
  overflow: hidden;
  font-family: var(--board-display);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-badge {
  padding: 4px 8px;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: var(--radius-pill);
  font-size: 9.5px;
  font-weight: 700;
}

.experience-content {
  max-width: 1500px;
  margin: auto;
}

.course-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 12px 4px 20px;
}

.eyebrow {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.course-heading h1 {
  margin: 7px 0 5px;
  font-family: var(--board-display);
  font-size: clamp(27px, 3vw, 42px);
  line-height: 1.18;
}

.course-heading p {
  max-width: 860px;
  margin: 0;
  color: var(--text-sub);
  font-size: 12.5px;
  line-height: 1.7;
}

.course-metrics {
  display: grid;
  grid-template-columns: auto auto;
  gap: 1px 7px;
  align-items: baseline;
  flex: none;
}

.course-metrics strong {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 18px;
  text-align: right;
}

.course-metrics span {
  color: var(--text-faint);
  font-size: 9.5px;
}

.progress-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 32%) auto;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  padding: 12px 15px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
}

.progress-copy strong,
.progress-copy span {
  display: block;
}

.progress-copy strong {
  font-size: 11.5px;
}

.progress-copy span {
  margin-top: 2px;
  color: var(--text-faint);
  font-size: 9.5px;
}

.progress-track {
  height: 5px;
  overflow: hidden;
  background: var(--surface-3);
  border-radius: var(--radius-pill);
}

.progress-track span {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: inherit;
  transition: width 0.3s ease;
}

.progress-card em {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 10px;
  font-style: normal;
}

.scene-rail {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 1px 12px;
}

.scene-rail button {
  flex: 0 0 178px;
  display: grid;
  grid-template-columns: 25px minmax(0, 1fr);
  gap: 2px 8px;
  padding: 9px 10px;
  color: var(--text-sub);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  text-align: left;
  cursor: pointer;
}

.scene-rail button > span {
  grid-row: span 2;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  color: var(--text-faint);
  background: var(--surface-2);
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 9px;
}

.scene-rail strong {
  overflow: hidden;
  color: var(--text-main);
  font-size: 10.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-rail small {
  color: var(--text-faint);
  font-size: 8.5px;
}

.scene-rail button.ready {
  border-color: color-mix(in srgb, var(--ok) 24%, var(--card-border));
}

.scene-rail button.generating > span {
  color: var(--accent);
  background: var(--accent-soft);
  animation: pulse 1s infinite;
}

.scene-rail button.active {
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 38%, var(--card-border));
}

.lesson-frame {
  padding: 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--text-main) 4%, transparent),
    0 24px 64px color-mix(in srgb, var(--text-main) 7%, transparent);
}

.lesson-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 4px 11px;
}

.lesson-toolbar > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lesson-toolbar span {
  color: var(--text-faint);
  font-size: 9px;
}

.lesson-toolbar strong {
  font-size: 11px;
}

.landscape-board {
  overflow: visible;
  padding: 8px;
  background: var(--surface-2);
  border-radius: var(--radius-md);
}

.landscape-board :deep(.board-canvas) {
  width: 100%;
  min-width: 0;
  box-shadow: 0 10px 34px color-mix(in srgb, var(--text-main) 6%, transparent);
}

.scene-state {
  min-height: 520px;
  display: grid;
  align-content: center;
  justify-items: center;
  padding: 30px;
  text-align: center;
}

.scene-state h2 {
  margin: 10px 0 3px;
  font-family: var(--board-display);
  font-size: 24px;
}

.scene-state p {
  margin: 0;
  color: var(--text-faint);
  font-size: 11px;
}

.scene-state.error h2 {
  color: var(--danger);
}

.pulse-dot {
  width: 9px;
  height: 9px;
  background: var(--accent);
  border-radius: 50%;
  animation: pulse 1s infinite;
}

.experience-quiz article,
.experience-practice {
  padding: 22px;
  background: var(--board-paper);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
}

.experience-quiz article > span,
.experience-practice > span {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 9px;
}

.experience-quiz h3,
.experience-practice h2 {
  font-family: var(--board-display);
}

.experience-practice {
  margin: 8px;
}

.experience-practice ol {
  line-height: 1.8;
}

.experience-practice blockquote {
  margin: 18px 0 0;
  padding: 10px 12px;
  color: var(--accent);
  background: var(--accent-soft);
  border-left: 3px solid var(--accent);
}

.experience-loading {
  min-height: 80vh;
  display: grid;
  align-content: center;
  justify-items: center;
}

.experience-loading > span {
  width: 26px;
  height: 26px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 780px) {
  .experience-page {
    padding: 10px 10px 24px;
  }

  .experience-topbar {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .topbar-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }

  .course-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .progress-card {
    grid-template-columns: 1fr auto;
  }

  .progress-track {
    grid-column: 1 / -1;
  }

  .experience-quiz {
    grid-template-columns: 1fr;
  }

  .landscape-board {
    padding: 4px;
  }
}

/* —— 讲稿面板（beats：设问—停顿—确认链） —— */
  .scene-script {
    margin-top: 18px;
    border: 1px solid var(--card-border);
    border-radius: var(--radius-md);
    background: var(--card-bg);
    overflow: hidden;
  }

  .script-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 16px;
    color: var(--text-sub);
    background: transparent;
    border: 0;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }

  .script-toggle:hover {
    color: var(--text-main);
  }

  .script-icon {
    color: var(--accent);
  }

  .script-arrow {
    margin-left: auto;
    transition: transform 0.2s ease;
  }

  .script-arrow.open {
    transform: rotate(180deg);
  }

  .script-beats {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 4px 16px 16px;
    list-style: none;
    counter-reset: beat;
  }

  .script-beats li {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: baseline;
    gap: 10px;
    padding: 9px 12px;
    background: var(--surface-2);
    border-left: 3px solid var(--divider);
    border-radius: var(--radius-sm);
  }

  .script-beats li.is-question {
    border-left-color: var(--accent);
  }

  .script-beats li.is-answer {
    border-left-color: var(--ok);
  }

  .script-beats li.is-confirm {
    border-left-color: var(--warn);
  }

  .script-beats li.is-recall {
    border-left-color: var(--text-sub);
  }

  .script-beats li.is-cta {
    border-left-color: var(--accent-deep);
  }

  .beat-kind {
    padding: 1px 8px;
    color: var(--text-sub);
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-pill);
    font-size: 11px;
  }

  .script-beats li.is-question .beat-kind {
    color: var(--accent);
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  }

  .script-beats p {
    margin: 0;
    color: var(--text-main);
    font-size: 13.5px;
    line-height: 1.7;
  }

  .beat-pause {
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 11px;
  }

  .beat-block {
    color: var(--text-faint);
    font-family: var(--font-mono);
    font-size: 10.5px;
  }
/* —— 播放控制条（P0-3） —— */
  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .playback-bar {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 6px;
    background: var(--surface-2);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-pill);
  }

  .playback-bar .frame-button {
    border: 0;
    background: transparent;
    padding: 4px 8px;
  }

  .playback-bar .frame-button:disabled {
    color: var(--text-faint);
    cursor: not-allowed;
    opacity: 0.5;
  }

  .play-button {
    color: var(--accent) !important;
    font-weight: 600;
  }

  .beat-counter {
    min-width: 34px;
    color: var(--text-sub);
    font-family: var(--font-mono);
    font-size: 9.5px;
    text-align: center;
  }

  .speed-button {
    font-family: var(--font-mono);
  }

  /* —— 交互小测（P0-2） —— */
  .experience-quiz {
    display: grid;
    place-items: center;
    min-height: 520px;
    padding: 8px;
  }

  .quiz-stage {
    width: min(680px, 100%);
    padding: 30px 34px 26px;
    background: var(--board-paper);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-md);
    box-shadow: 0 12px 40px color-mix(in srgb, var(--text-main) 6%, transparent);
  }

  .quiz-progress {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 14px;
    border-bottom: 1px dashed var(--card-border);
  }

  .quiz-counter,
  .quiz-score {
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
  }

  .quiz-score {
    color: var(--text-faint);
    font-weight: 400;
  }

  .quiz-dots {
    display: flex;
    gap: 6px;
  }

  .quiz-dots i {
    width: 8px;
    height: 8px;
    background: var(--surface-3);
    border-radius: 50%;
    transition: all 0.2s ease;
  }

  .quiz-dots i.active {
    background: var(--accent);
    transform: scale(1.25);
  }

  .quiz-dots i.done.correct {
    background: var(--ok);
  }

  .quiz-dots i.done:not(.correct) {
    background: var(--danger);
  }

  .quiz-stem {
    margin: 18px 0 20px;
    font-family: var(--board-display);
    font-size: 19px;
    line-height: 1.5;
  }

  .quiz-options {
    display: grid;
    gap: 9px;
  }

  .quiz-options button {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    color: var(--text-sub);
    background: var(--surface-2);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-sm);
    font: inherit;
    font-size: 12.5px;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .quiz-options button span {
    flex: none;
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    color: var(--text-faint);
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 50%;
    font-family: var(--font-mono);
    font-size: 10px;
  }

  .quiz-options button:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--text-main);
  }

  .quiz-options button.selected {
    color: var(--text-main);
    background: var(--accent-soft);
    border-color: var(--accent);
  }

  .quiz-options button.selected span {
    color: #fff;
    background: var(--accent);
    border-color: var(--accent);
  }

  .quiz-options button:disabled {
    cursor: default;
  }

  .quiz-options button.correct {
    color: var(--ok);
    background: var(--ok-soft);
    border-color: color-mix(in srgb, var(--ok) 46%, transparent);
  }

  .quiz-options button.correct span {
    color: #fff;
    background: var(--ok);
    border-color: var(--ok);
  }

  .quiz-options button.wrong {
    color: var(--danger);
    background: color-mix(in srgb, var(--danger) 8%, transparent);
    border-color: color-mix(in srgb, var(--danger) 40%, transparent);
  }

  .quiz-options button.wrong span {
    color: #fff;
    background: var(--danger);
    border-color: var(--danger);
  }

  .quiz-footer {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px dashed var(--card-border);
  }

  .quiz-submit {
    padding: 9px 22px;
    color: #fff;
    background: var(--accent);
    border: 0;
    border-radius: var(--radius-pill);
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .quiz-submit:hover:not(:disabled) {
    background: var(--accent-deep);
  }

  .quiz-submit:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .quiz-hint {
    color: var(--text-faint);
    font-size: 10px;
  }

  .quiz-verdict {
    margin: 0;
    color: var(--ok);
    font-size: 12.5px;
    font-weight: 700;
  }

  .quiz-verdict.wrong {
    color: var(--danger);
  }

  .quiz-explanation {
    flex: 1 1 100%;
    margin: 0;
    padding: 10px 12px;
    color: var(--text-sub);
    background: var(--surface-2);
    border-left: 3px solid var(--accent);
    border-radius: var(--radius-sm);
    font-size: 11.5px;
    line-height: 1.7;
  }

  /* —— 完课入口（P0-1） —— */
  .lesson-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 14px;
    padding: 12px 6px 2px;
    border-top: 1px solid var(--card-border);
  }

  .footer-hint {
    color: var(--text-faint);
    font-size: 10px;
  }

  .finish-button {
    padding: 9px 20px;
    color: var(--accent);
    background: var(--accent-soft);
    border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent);
    border-radius: var(--radius-pill);
    font: inherit;
    font-size: 11.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .finish-button:hover {
    color: #fff;
    background: var(--accent);
    border-color: var(--accent);
  }

  /* —— 讲稿播放态高亮 —— */
  .script-live {
    margin-left: auto;
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 10px;
  }

  .script-beats li {
    cursor: pointer;
  }

  .script-beats li.active {
    background: var(--accent-soft);
    border-left-color: var(--accent);
  }

  .script-beats li.active p {
    color: var(--accent-deep);
    font-weight: 600;
  }

  .experience-quiz .scene-state {
    min-height: 0;
  }

  @media (max-width: 780px) {
    .experience-quiz {
      grid-template-columns: 1fr;
      min-height: 0;
    }

    .quiz-stage {
      padding: 20px 18px;
    }

    .playback-bar {
      flex-wrap: wrap;
    }
  }
</style>
