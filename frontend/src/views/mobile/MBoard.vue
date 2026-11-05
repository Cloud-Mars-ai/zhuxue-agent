<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
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
const studioStore = useCourseStudioStore()
const knowledgeStore = useKnowledgeStore()
const userStore = useUserStore()
const currentChapter = computed(
  () => COURSE.chapters.find((chapter) => chapter.status === '进行中') || COURSE.chapters[0],
)
const chapter = computed(() => String(route.query.chapter || currentChapter.value?.title || ''))
const studyMode = computed(() => {
  const mode = Array.isArray(route.query.mode) ? route.query.mode[0] : route.query.mode
  return mode === 'sprint' ? 'sprint' : 'course'
})
const studioProjectId = computed(() => String(route.query.studio || ''))
const studioSceneId = computed(() => String(route.query.scene || ''))
const isStudioLesson = computed(() => !!studioProjectId.value)

const lesson = ref(null)
const loading = ref(true)
const fallback = ref(false)
const showChat = ref(false)
const input = ref('')
const asking = ref(false)
const savingBoard = ref(false)
const listRef = ref()
const messages = ref([
  {
    role: 'assistant',
    content: '我会按路线、概念、对照、追问展开。点击底部“边听边问”，不会中断板书。',
  },
])
const {
  visibleCount,
  narrating,
  voiceError,
  voiceEnabled,
  voiceStore,
  startReveal,
  stopNarration,
  toggleVoice,
  selectVoice,
} = useBoardPlayback(lesson)

async function loadLesson() {
  loading.value = true
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
      chapter: chapter.value,
      studyMode: studyMode.value,
    })
    lesson.value = result.lesson
    fallback.value = result.fallback
    nextTick(() => startReveal())
  } finally {
    loading.value = false
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
  })
}

async function ask(text) {
  const question = String(text ?? input.value).trim()
  if (!question || asking.value) return
  showChat.value = true
  messages.value.push({ role: 'user', content: question })
  input.value = ''
  asking.value = true
  scrollToBottom()
  try {
    const result = await answerBoardQuestion({
      chapter: lesson.value?.chapter || chapter.value,
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
    })
  } finally {
    asking.value = false
    scrollToBottom()
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

async function saveToLibrary() {
  if (!lesson.value || savingBoard.value) return
  savingBoard.value = true
  try {
    await knowledgeStore.saveBoard({
      title: lesson.value.title,
      chapter: lesson.value.chapter || chapter.value,
      projectId: studioProjectId.value,
      sceneId: studioSceneId.value,
      route: route.fullPath,
      lesson: lesson.value,
      ownerId: userStore.user?.id || '',
    })
    showToast('板书已保存到知识库')
  } catch (error) {
    showToast(error.message || '保存板书失败')
  } finally {
    savingBoard.value = false
  }
}

onMounted(loadLesson)
</script>

<template>
  <div class="m-board-page">
    <div class="m-board-meta">
      <span>
        {{ isStudioLesson ? '课程编排' : '板书讲解' }} ·
        {{ studyMode === 'sprint' ? '考前冲刺' : '正常上课' }}
      </span>
      <strong>{{ lesson?.chapter || chapter }}</strong>
    </div>
    <div v-if="fallback" class="m-fallback">本地生成 · 依据课程主题与可用材料</div>
    <div class="m-board-tools">
      <button type="button" :class="{ on: voiceEnabled }" @click="toggleVoice">
        {{ narrating ? '语音讲解中' : voiceEnabled ? '语音已开启' : '语音教学关闭' }}
      </button>
      <select
        v-if="voiceEnabled"
        :value="voiceStore.voiceId"
        aria-label="讲解音色"
        @change="selectVoice($event.target.value)"
      >
        <option v-for="voice in VOICE_PRESETS" :key="voice.id" :value="voice.id">
          {{ voice.name }}
        </option>
      </select>
      <button type="button" :disabled="!lesson" @click="downloadBoardLesson(lesson)">
        下载板书
      </button>
      <button type="button" :disabled="!lesson || savingBoard" @click="saveToLibrary">
        收藏板书
      </button>
    </div>
    <p v-if="voiceError && voiceEnabled" class="m-voice-error">{{ voiceError }}</p>

    <van-skeleton v-if="loading" title :row="8" class="m-skeleton" />
    <BoardCanvas
      v-else-if="lesson"
      :lesson="lesson"
      :visible-count="visibleCount"
      @answer="onAnswer"
    />

    <van-button
      class="ask-fab"
      type="primary"
      round
      icon="chat-o"
      @click="showChat = true"
    >
      边听边问
    </van-button>

    <van-popup
      v-model:show="showChat"
      position="bottom"
      round
      :style="{ height: '72%' }"
    >
      <div class="chat-sheet">
        <header>
          <div>
            <span>对话历史</span>
            <strong>边听边问</strong>
          </div>
          <van-icon name="cross" @click="showChat = false" />
        </header>
        <div ref="listRef" class="chat-list">
          <div
            v-for="(message, index) in messages"
            :key="index"
            class="chat-message"
            :class="message.role"
          >
            <span>{{ message.role === 'user' ? '你' : '助教' }}</span>
            <p>{{ message.content }}</p>
            <small v-if="message.fallback">演示缓存</small>
            <SpeakButton v-if="message.role === 'assistant'" :text="message.content" />
          </div>
          <p v-if="asking" class="chat-typing">助教正在结合当前板书回答…</p>
        </div>
        <div class="chat-input">
          <van-field
            v-model="input"
            type="textarea"
            rows="2"
            autosize
            placeholder="在这里插问，不会打断板书…"
            @keydown="handleEnter"
          />
          <van-button type="primary" size="small" :loading="asking" @click="ask()">
            发送
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.m-board-page {
  position: relative;
  min-height: calc(100vh - 96px);
  padding-bottom: 74px;
}

.m-board-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px 10px;
}

.m-board-meta span {
  color: var(--text-faint);
  font-size: 10px;
  letter-spacing: 0.08em;
}

.m-board-meta strong {
  overflow: hidden;
  color: var(--board-heading);
  font-family: var(--board-display);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-fallback {
  width: fit-content;
  margin: 0 16px 8px auto;
  padding: 4px 8px;
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: var(--radius-pill);
  font-size: 9.5px;
}

.m-board-tools {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px 9px;
}

.m-board-tools button,
.m-board-tools select {
  min-height: 28px;
  padding: 4px 9px;
  color: var(--text-sub);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: 10px;
}

.m-board-tools button.on {
  color: var(--accent);
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 34%, var(--card-border));
}

.m-board-tools button:disabled {
  opacity: 0.45;
}

.m-voice-error {
  margin: 0 14px 8px;
  color: var(--warn);
  font-size: 10px;
}

.m-skeleton {
  margin: 12px 14px;
  padding: 20px 14px;
  background: var(--card-bg);
  border-radius: var(--card-radius);
}

:deep(.board-canvas) {
  min-height: 0;
  margin: 0 12px;
  padding: 22px 16px 34px;
}

.ask-fab {
  position: fixed;
  z-index: 8;
  right: 18px;
  bottom: 78px;
  box-shadow: var(--el-box-shadow);
}

.chat-sheet {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
}

.chat-sheet > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--divider);
}

.chat-sheet > header div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat-sheet > header span {
  color: var(--text-faint);
  font-size: 9px;
}

.chat-sheet > header strong {
  color: var(--text-main);
  font-size: 14px;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
}

.chat-message {
  margin-bottom: 16px;
}

.chat-message > span {
  display: block;
  margin-bottom: 4px;
  color: var(--text-faint);
  font-size: 9px;
}

.chat-message p {
  margin: 0;
  padding: 9px 11px;
  color: var(--text-main);
  background: var(--surface-2);
  border-radius: var(--radius-sm);
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.chat-message.user p {
  color: var(--accent-on);
  background: var(--accent);
}

.chat-message small {
  color: var(--warn);
  font-size: 9px;
}

.chat-typing {
  color: var(--text-faint);
  font-size: 10px;
}

.chat-input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--divider);
}

.chat-input :deep(.van-field) {
  flex: 1;
  background: var(--surface-2);
  border-radius: var(--radius-md);
}
</style>
