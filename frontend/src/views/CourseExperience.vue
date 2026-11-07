<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import BoardCanvas from '@/components/BoardCanvas.vue'
import { useCourseStudioStore } from '@/stores/courseStudio'
import { COURSE_SCENE_LABELS, summarizeCourseProject } from '@/utils/courseStudio'
import { SCRIPT_BEAT_LABELS } from '@/utils/courseScript'
import { downloadBoardLesson } from '@/utils/boardDownload'

const route = useRoute()
const router = useRouter()
const studio = useCourseStudioStore()

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
          <div>
            <el-tag v-if="selectedScene?.status === 'fallback'" type="warning" effect="plain">
              演示缓存
            </el-tag>
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
              :visible-count="999"
              :interactive="true"
              landscape
              @answer="() => {}"
            />
          </div>          <div v-else-if="selectedScene.content.kind === 'quiz'" class="experience-quiz">
            <article
              v-for="(question, index) in selectedScene.content.questions"
              :key="question.id"
            >
              <span>Q{{ index + 1 }}</span>
              <h3>{{ question.stem }}</h3>
              <div class="quiz-options">
                <p
                  v-for="(option, optionIndex) in question.options"
                  :key="option"
                  :class="{ correct: optionIndex === question.answerIndex }"
                >
                  {{ String.fromCharCode(65 + optionIndex) }}. {{ option }}
                </p>
              </div>
              <small>{{ question.explanation }}</small>
            </article>
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
            <span class="script-arrow" :class="{ open: scriptOpen }">▾</span>
          </button>
          <ol v-if="scriptOpen" class="script-beats">
            <li v-for="(beat, beatIndex) in selectedScene.script.beats" :key="beatIndex" :class="`is-${beat.kind}`">
              <span class="beat-kind">{{ SCRIPT_BEAT_LABELS[beat.kind] || beat.kind }}</span>
              <p>{{ beat.text }}</p>
              <span v-if="beat.kind === 'question'" class="beat-pause">停 {{ (beat.pauseMs / 1000).toFixed(1) }}s</span>
              <span v-if="beat.blockId" class="beat-block">→ {{ beat.blockId }}</span>
            </li>
          </ol>
        </div>
      </section>
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

.experience-quiz {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 8px;
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

.quiz-options {
  display: grid;
  gap: 6px;
}

.quiz-options p {
  margin: 0;
  padding: 8px 10px;
  color: var(--text-sub);
  background: var(--surface-2);
  border-radius: var(--radius-sm);
  font-size: 11px;
}

.quiz-options p.correct {
  color: var(--ok);
  background: var(--ok-soft);
}

.experience-quiz small {
  display: block;
  margin-top: 12px;
  color: var(--text-faint);
  line-height: 1.6;
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
</style>
