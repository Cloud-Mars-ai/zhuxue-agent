<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { COURSE } from '@/mock/data'
import BoardCanvas from '@/components/BoardCanvas.vue'
import SpeakButton from '@/components/SpeakButton.vue'
import { answerBoardQuestion, generateBoardLesson } from '@/api/board'
import { useCourseStudioStore } from '@/stores/courseStudio'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useUserStore } from '@/stores/user'
import { VOICE_PRESETS } from '@/stores/voice'
import { useBoardPlayback } from '@/composables/useBoardPlayback'
import { downloadBoardLesson } from '@/utils/boardDownload'

const route = useRoute()
const router = useRouter()
const studioStore = useCourseStudioStore()
const knowledgeStore = useKnowledgeStore()
const userStore = useUserStore()

const currentChapter = computed(
  () => COURSE.chapters.find((chapter) => chapter.status === '进行中') || COURSE.chapters[0],
)

const requestedChapter = computed(() => {
  const queryChapter = Array.isArray(route.query.chapter)
    ? route.query.chapter[0]
    : route.query.chapter
  return String(queryChapter || currentChapter.value?.title || '')
})
const studyMode = computed(() => {
  const mode = Array.isArray(route.query.mode) ? route.query.mode[0] : route.query.mode
  return mode === 'sprint' ? 'sprint' : 'course'
})
const studioProjectId = computed(() => String(route.query.studio || ''))
const studioSceneId = computed(() => String(route.query.scene || ''))
const isStudioLesson = computed(() => !!studioProjectId.value)
const returnPath = computed(() =>
  isStudioLesson.value
    ? `/app/studio?project=${encodeURIComponent(studioProjectId.value)}`
    : '/app/course',
)

const lesson = ref(null)
const loading = ref(true)
const fallback = ref(false)
const errorMessage = ref('')
const zoom = ref(100)
const showGrid = ref(true)
const showSettings = ref(false)
const settingsRef = ref()
const boardShellRef = ref()
const boardStageRef = ref()
const conversationRef = ref()
const input = ref('')
const asking = ref(false)
const savingBoard = ref(false)
const followReveal = ref(true)
const {
  visibleCount,
  paused,
  narrating,
  voiceError,
  voiceEnabled,
  revealFinished,
  voiceStore,
  startReveal,
  stopNarration,
  stopReveal,
  togglePause,
  restart,
  setVoiceEnabled,
  toggleVoice,
  selectVoice,
} = useBoardPlayback(lesson)

const messages = ref([
  {
    role: 'assistant',
    content:
      '我会按“路线 → 概念 → 对照 → 追问”的顺序展开。你随时可以在右侧插问，板书会留在原处。',
  },
])

const activeQuestion = computed(
  () =>
    lesson.value?.blocks
      ?.slice(0, Math.max(visibleCount.value, 0))
      .find((block) => block.type === 'question') || null,
)

async function loadLesson() {
  loading.value = true
  errorMessage.value = ''
  visibleCount.value = 0
  stopReveal()
  stopNarration()

  try {
    if (isStudioLesson.value) {
      await studioStore.load()
      const project = studioStore.find(studioProjectId.value)
      const scene = project?.scenes?.find((item) => item.outlineId === studioSceneId.value)
      if (!project || scene?.content?.kind !== 'board') {
        throw new Error('未找到这门课程中的板书场景')
      }
      lesson.value = scene.content.lesson
      fallback.value = scene.status === 'fallback'
      nextTick(() => startReveal())
      return
    }
    const result = await generateBoardLesson({
      chapter: requestedChapter.value,
      focus: String(route.query.focus || ''),
      studyMode: studyMode.value,
    })
    lesson.value = result.lesson
    fallback.value = result.fallback
    nextTick(() => startReveal())
  } catch (err) {
    errorMessage.value = err?.message || '板书生成失败'
  } finally {
    loading.value = false
  }
}

function zoomBy(delta) {
  zoom.value = Math.min(140, Math.max(70, zoom.value + delta))
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await boardShellRef.value?.requestFullscreen()
  } catch {
    // 浏览器拒绝全屏时保留普通布局
  }
}

function scrollConversation() {
  nextTick(() => {
    const element = conversationRef.value
    if (element) element.scrollTop = element.scrollHeight
  })
}

function followCurrentBlock() {
  if (!followReveal.value || !lesson.value?.blocks?.length || visibleCount.value < 1) return
  nextTick(() => {
    const currentIndex = Math.min(
      visibleCount.value - 1,
      lesson.value.blocks.length - 1,
    )
    boardStageRef.value
      ?.querySelector(`[data-block-index="${currentIndex}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function toggleFollow() {
  followReveal.value = !followReveal.value
  if (followReveal.value) followCurrentBlock()
}

watch(visibleCount, followCurrentBlock)

async function ask(text) {
  const question = String(text ?? input.value).trim()
  if (!question || asking.value) return

  messages.value.push({ role: 'user', content: question })
  input.value = ''
  asking.value = true
  scrollConversation()

  try {
    const result = await answerBoardQuestion({
      chapter: lesson.value?.chapter || requestedChapter.value,
      lesson: lesson.value,
      question,
    })
    messages.value.push({
      role: 'assistant',
      content: result.text,
      fallback: result.fallback,
    })
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content: err?.message || '暂时无法回答，请稍后再试。',
      error: true,
    })
  } finally {
    asking.value = false
    scrollConversation()
  }
}

function onAnswer({ question, option }) {
  ask(`关于“${question}”，我选择：${option}`)
}

function handleEnter(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    ask()
  }
}

function onDocumentClick(event) {
  if (showSettings.value && !settingsRef.value?.contains(event.target)) {
    showSettings.value = false
  }
}

async function saveToLibrary() {
  if (!lesson.value || savingBoard.value) return
  savingBoard.value = true
  try {
    await knowledgeStore.saveBoard({
      title: lesson.value.title,
      chapter: lesson.value.chapter || requestedChapter.value,
      projectId: studioProjectId.value,
      sceneId: studioSceneId.value,
      route: route.fullPath,
      lesson: lesson.value,
      ownerId: userStore.user?.id || '',
    })
    ElMessage.success('板书已保存到知识库')
  } catch (error) {
    ElMessage.error(error.message || '保存板书失败')
  } finally {
    savingBoard.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  loadLesson()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <div class="board-page" data-testid="board-page">
    <div ref="boardShellRef" class="board-shell">
      <header class="board-topbar">
        <button class="icon-button" type="button" title="返回课程主页" @click="router.push(returnPath)">
          ×
        </button>
        <div class="course-title">
          <span>{{ lesson?.chapter || requestedChapter }}</span>
          <small>
            {{ isStudioLesson ? '课程编排 · ' : '' }}{{ studyMode === 'sprint' ? '考前冲刺' : '正常上课' }}
          </small>
        </div>

        <div class="board-tools">
          <button
            type="button"
            class="voice-toggle"
            :class="{ on: voiceEnabled }"
            :title="voiceEnabled ? '关闭语音教学' : '开启语音教学'"
            @click="toggleVoice"
          >
            {{ narrating ? '讲解中' : voiceEnabled ? '语音开' : '语音关' }}
          </button>
          <button
            type="button"
            title="保存到知识库"
            aria-label="保存到知识库"
            :disabled="!lesson || savingBoard"
            @click="saveToLibrary"
          >
            ☆
          </button>
          <button
            type="button"
            title="下载板书"
            aria-label="下载板书"
            :disabled="!lesson"
            @click="downloadBoardLesson(lesson)"
          >
            ⇩
          </button>
          <button type="button" title="缩小" @click="zoomBy(-10)">−</button>
          <span class="zoom-value">{{ zoom }}%</span>
          <button type="button" title="放大" @click="zoomBy(10)">＋</button>
          <span class="tool-divider" />
          <span class="page-count">1 / 1</span>
          <button v-if="!isStudioLesson" type="button" title="重新生成板书" @click="loadLesson">↻</button>
          <button type="button" title="全屏" @click="toggleFullscreen">⛶</button>
          <div ref="settingsRef" class="settings-wrap">
            <button type="button" title="显示设置" @click.stop="showSettings = !showSettings">⚙</button>
            <div v-if="showSettings" class="settings-popover" @click.stop>
              <strong>显示设置</strong>
              <label>
                <span>点阵背景</span>
                <input v-model="showGrid" type="checkbox" />
              </label>
              <label>
                <span>语音教学</span>
                <input
                  :checked="voiceEnabled"
                  type="checkbox"
                  @change="setVoiceEnabled($event.target.checked)"
                />
              </label>
              <label class="voice-select-row">
                <span>讲解音色</span>
                <select
                  :value="voiceStore.voiceId"
                  :disabled="!voiceEnabled"
                  @change="selectVoice($event.target.value)"
                >
                  <option v-for="voice in VOICE_PRESETS" :key="voice.id" :value="voice.id">
                    {{ voice.name }}
                  </option>
                </select>
              </label>
              <p v-if="voiceError" class="voice-error">{{ voiceError }}</p>
              <button type="button" @click="restart">从头播放</button>
            </div>
          </div>
        </div>
      </header>

      <main class="board-main">
        <section ref="boardStageRef" class="board-stage" data-testid="board-stage">
          <div v-if="fallback" class="fallback-banner">
            本地生成：当前板书依据课程主题与可用材料确定性生成
          </div>
          <div v-if="voiceError && voiceEnabled" class="voice-error-banner">
            {{ voiceError }}
          </div>
          <div v-if="loading" class="board-skeleton" aria-label="正在生成板书">
            <span class="skeleton-kicker" />
            <span class="skeleton-title" />
            <div class="skeleton-grid">
              <span v-for="item in 4" :key="item" />
            </div>
          </div>
          <div v-else-if="errorMessage" class="board-error">
            <strong>这一页没有生成成功</strong>
            <p>{{ errorMessage }}</p>
            <button type="button" @click="loadLesson">重新生成</button>
          </div>
          <div
            v-else
            class="board-paper"
            :class="{ 'hide-grid': !showGrid }"
            :style="{
              transform: `scale(${zoom / 100})`,
              width: `${100 / (zoom / 100)}%`,
            }"
          >
            <BoardCanvas
              :lesson="lesson"
              :visible-count="visibleCount"
              @answer="onAnswer"
            />
          </div>

          <div class="playback-bar">
            <button type="button" @click="togglePause">
              {{ paused ? '继续讲解' : revealFinished ? '重新播放' : narrating ? '暂停语音' : '暂停讲解' }}
            </button>
            <span class="playback-divider" />
            <button
              type="button"
              class="follow-toggle"
              :class="{ on: followReveal }"
              data-testid="follow-toggle"
              :aria-pressed="followReveal"
              @click="toggleFollow"
            >
              {{ followReveal ? '跟随中' : '跟随已关' }}
            </button>
            <span v-if="lesson">
              {{ Math.min(visibleCount, lesson.blocks.length) }} / {{ lesson.blocks.length }} 个板块
            </span>
          </div>
        </section>

        <aside class="conversation">
          <header>
            <div>
              <span class="conversation-kicker">对话历史</span>
              <strong>边听边问</strong>
            </div>
            <button type="button" title="收起对话" @click="router.push('/app/course')">×</button>
          </header>

          <div ref="conversationRef" class="conversation-list">
            <div
              v-for="(message, index) in messages"
              :key="index"
              class="message"
              :class="message.role"
            >
              <span class="message-role">{{ message.role === 'user' ? '你' : '助教' }}</span>
              <p>{{ message.content }}</p>
              <span v-if="message.fallback" class="message-source">演示缓存</span>
              <SpeakButton
                v-if="message.role === 'assistant'"
                :text="message.content"
              />
            </div>
            <div v-if="asking" class="message assistant typing">
              <span class="typing-dots"><i /><i /><i /></span>
              正在结合当前板书回答
            </div>
          </div>

          <div v-if="activeQuestion?.options?.length" class="quick-answers">
            <span>当前追问</span>
            <button
              v-for="option in activeQuestion.options"
              :key="option"
              type="button"
              :disabled="asking"
              @click="ask(`关于“${activeQuestion.prompt}”，我选择：${option}`)"
            >
              {{ option }}
            </button>
          </div>

          <div class="conversation-input">
            <textarea
              v-model="input"
              rows="2"
              placeholder="在这里插问，不会打断板书…"
              @keydown="handleEnter"
            />
            <button type="button" :disabled="!input.trim() || asking" @click="ask()">↑</button>
          </div>
        </aside>
      </main>
    </div>
  </div>
</template>

<style scoped>
.board-page {
  height: calc(100vh - 24px);
  min-height: 620px;
}

.board-shell {
  height: 100%;
  overflow: hidden;
  background: var(--surface-2);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
}

.board-topbar {
  height: 56px;
  display: grid;
  grid-template-columns: auto minmax(120px, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--divider);
}

.icon-button,
.board-tools button,
.settings-popover button {
  font: inherit;
  cursor: pointer;
}

.icon-button {
  width: 32px;
  height: 32px;
  color: var(--text-sub);
  background: transparent;
  border: 1px solid var(--card-border);
  border-radius: 50%;
  font-size: 20px;
  line-height: 1;
}

.course-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.course-title span {
  overflow: hidden;
  color: var(--board-heading);
  font-family: var(--board-display);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-title small {
  flex: none;
  color: var(--text-faint);
  font-size: 10px;
}

.board-tools {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: var(--surface-2);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-pill);
}

.board-tools button {
  min-width: 28px;
  height: 28px;
  padding: 0 7px;
  color: var(--text-sub);
  background: transparent;
  border: 0;
  border-radius: 50%;
}

.board-tools button:hover {
  color: var(--accent);
  background: var(--accent-soft);
}

.board-tools button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.board-tools .voice-toggle {
  width: auto;
  padding: 0 9px;
  border-radius: var(--radius-pill);
  font-size: 9.5px;
}

.board-tools .voice-toggle.on {
  color: var(--accent);
  background: var(--accent-soft);
}

.zoom-value,
.page-count {
  color: var(--text-sub);
  font-family: var(--font-mono);
  font-size: 10px;
}

.zoom-value {
  width: 38px;
  text-align: center;
}

.tool-divider {
  width: 1px;
  height: 16px;
  background: var(--divider);
}

.settings-wrap {
  position: relative;
}

.settings-popover {
  position: absolute;
  z-index: 10;
  top: 38px;
  right: 0;
  width: 190px;
  padding: 14px;
  color: var(--text-main);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--card-shadow);
}

.settings-popover strong {
  display: block;
  margin-bottom: 12px;
  font-size: 12px;
}

.settings-popover label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: var(--text-sub);
  font-size: 11px;
}

.voice-select-row {
  align-items: flex-start !important;
  flex-direction: column;
  gap: 6px;
}

.voice-select-row select {
  width: 100%;
  padding: 6px 8px;
  color: var(--text-main);
  background: var(--surface-2);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: 10px;
}

.voice-error {
  margin: -4px 0 10px;
  color: var(--warn);
  font-size: 9.5px;
  line-height: 1.45;
}

.settings-popover button {
  width: 100%;
  padding: 7px;
  color: var(--accent);
  background: var(--accent-soft);
  border: 0;
  border-radius: var(--radius-sm);
  font-size: 11px;
}

.board-main {
  height: calc(100% - 56px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 36%);
}

.board-stage {
  position: relative;
  min-width: 0;
  overflow: auto;
  padding: 18px 18px 54px;
}

.fallback-banner {
  position: sticky;
  z-index: 3;
  top: 0;
  width: fit-content;
  margin: 0 auto 10px;
  padding: 5px 10px;
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: var(--radius-pill);
  font-size: 10px;
}

.voice-error-banner {
  width: fit-content;
  margin: 0 auto 10px;
  padding: 5px 10px;
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: var(--radius-pill);
  font-size: 10px;
}

.board-paper {
  transform-origin: top left;
  transition: transform 0.18s ease;
}

.board-paper.hide-grid :deep(.board-canvas) {
  background-image: none;
}

.board-skeleton {
  min-height: 560px;
  padding: 34px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
}

.board-skeleton span {
  display: block;
  background: linear-gradient(
    90deg,
    var(--surface-2),
    color-mix(in srgb, var(--surface-2) 45%, var(--card-bg)),
    var(--surface-2)
  );
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: shimmer 1.4s infinite linear;
}

.skeleton-kicker {
  width: 150px;
  height: 10px;
}

.skeleton-title {
  width: min(480px, 70%);
  height: 32px;
  margin: 18px 0 30px;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.skeleton-grid span {
  height: 150px;
}

.board-error {
  max-width: 420px;
  margin: 100px auto;
  padding: 24px;
  text-align: center;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
}

.board-error p {
  color: var(--text-sub);
  font-size: 12px;
}

.board-error button {
  padding: 7px 12px;
  color: var(--accent-on);
  background: var(--accent);
  border: 0;
  border-radius: var(--radius-sm);
  font: inherit;
}

.playback-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  width: fit-content;
  margin: 18px auto -38px;
  padding: 7px 12px;
  color: var(--text-sub);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-pill);
  box-shadow: var(--card-shadow);
  font-size: 10px;
}

.playback-bar button {
  color: var(--accent);
  background: transparent;
  border: 0;
  font: inherit;
  cursor: pointer;
}

.playback-bar .follow-toggle {
  color: var(--text-faint);
}

.playback-bar .follow-toggle.on {
  color: var(--accent);
}

.playback-divider {
  width: 1px;
  height: 12px;
  background: var(--divider);
}

.conversation {
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  border-left: 1px solid var(--divider);
}

.conversation > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px;
  border-bottom: 1px solid var(--divider);
}

.conversation > header div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.conversation-kicker {
  color: var(--text-faint);
  font-size: 9.5px;
  letter-spacing: 0.08em;
}

.conversation > header strong {
  font-size: 13px;
}

.conversation > header button {
  color: var(--text-faint);
  background: transparent;
  border: 0;
  font-size: 18px;
  cursor: pointer;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  margin-bottom: 18px;
}

.message-role {
  display: block;
  margin-bottom: 5px;
  color: var(--text-faint);
  font-size: 9.5px;
  font-weight: 600;
}

.message p {
  margin: 0;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.75;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
  white-space: pre-wrap;
}

.message.user p {
  color: var(--accent-on);
  background: var(--accent);
}

.message-source {
  display: inline-block;
  margin-top: 5px;
  color: var(--warn);
  font-size: 9.5px;
}

.typing {
  color: var(--text-faint);
  font-size: 10.5px;
}

.typing-dots {
  display: inline-flex;
  gap: 3px;
  margin-right: 6px;
}

.typing-dots i {
  width: 4px;
  height: 4px;
  background: var(--accent);
  border-radius: 50%;
  animation: blink 1.1s infinite;
}

.typing-dots i:nth-child(2) {
  animation-delay: 0.16s;
}

.typing-dots i:nth-child(3) {
  animation-delay: 0.32s;
}

.quick-answers {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 8px 14px;
  border-top: 1px solid var(--divider);
}

.quick-answers > span {
  flex: none;
  align-self: center;
  color: var(--text-faint);
  font-size: 9.5px;
}

.quick-answers button {
  flex: none;
  max-width: 210px;
  padding: 5px 9px;
  overflow: hidden;
  color: var(--text-sub);
  background: var(--surface-2);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.conversation-input {
  display: flex;
  align-items: flex-end;
  gap: 7px;
  margin: 10px 12px 12px;
  padding: 8px 8px 8px 11px;
  background: var(--surface-2);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
}

.conversation-input textarea {
  flex: 1;
  min-width: 0;
  color: var(--text-main);
  background: transparent;
  border: 0;
  outline: 0;
  resize: none;
  font: inherit;
  font-size: 11px;
  line-height: 1.6;
}

.conversation-input textarea::placeholder {
  color: var(--text-faint);
}

.conversation-input button {
  width: 30px;
  height: 30px;
  color: var(--accent-on);
  background: var(--accent);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}

.conversation-input button:disabled {
  opacity: 0.35;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

@keyframes blink {
  0%,
  60%,
  100% {
    opacity: 0.25;
  }
  30% {
    opacity: 1;
  }
}

@media (max-width: 1050px) {
  .board-main {
    grid-template-columns: minmax(0, 1fr) 300px;
  }
}

@media (max-width: 820px) {
  .board-page {
    height: auto;
    min-height: 0;
  }

  .board-shell {
    overflow: visible;
  }

  .board-topbar {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .board-tools {
    grid-column: 1 / -1;
    justify-self: center;
  }

  .board-main {
    height: auto;
    grid-template-columns: 1fr;
  }

  .conversation {
    min-height: 460px;
    border-top: 1px solid var(--divider);
    border-left: 0;
  }
}
</style>
