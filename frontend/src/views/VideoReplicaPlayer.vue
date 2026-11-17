<template>
  <div class="rp-player" :class="{ 'is-end': finished }">
    <!-- 顶部：章节标题（仿视频标题排版：左上手写体 + 分隔线） -->
    <header class="rp-head">
      <div class="rp-head-main">
        <span class="rp-chapter-no">第 {{ chapter.no }} 个视频</span>
        <h2 class="rp-title">{{ chapter.title }}</h2>
        <div class="rp-rule" aria-hidden="true"></div>
      </div>
      <div class="rp-head-side">
        <span class="rp-step-count">{{ stepIndex + 1 }} / {{ chapter.steps.length }}</span>
        <button class="rp-icon-btn" type="button" title="章节列表" aria-label="章节列表" @click="drawerOpen = !drawerOpen">
          ☰
        </button>
      </div>
    </header>

    <!-- 章节抽屉 -->
    <div v-if="drawerOpen" class="rp-drawer">
      <button
        v-for="ch in chapters"
        :key="ch.id"
        type="button"
        class="rp-drawer-item"
        :class="{ active: ch.id === chapter.id }"
        @click="jumpChapter(ch.id)"
      >
        <span class="rp-drawer-no">{{ ch.no }}</span>
        <span class="rp-drawer-title">{{ ch.title }}</span>
      </button>
    </div>

    <!-- 舞台：点击推进 -->
    <div class="rp-stage" data-testid="replica-stage" @click="next">
      <ReplicaStage :scene="currentScene" :step-key="stepKey" />
      <div v-if="finished" class="rp-finish" data-testid="replica-finish">
        <div class="rp-finish-card">
          <p class="rp-finish-line">为师这就讲完了，徒儿们速速刷题去吧！</p>
          <div class="rp-finish-actions">
            <button type="button" class="rp-btn primary" @click.stop="restart">再看一遍</button>
            <button type="button" class="rp-btn" @click.stop="jumpChapter(chapters[0].id)">回到第 1 章</button>
          </div>
        </div>
      </div>
      <div v-else-if="atChapterEnd" class="rp-chapter-end">
        <button type="button" class="rp-btn primary" @click.stop="nextChapter">
          下一章：{{ nextChapterTitle }} ›
        </button>
      </div>
    </div>

    <!-- 字幕条（仿视频字幕） -->
    <div class="rp-subtitle" data-testid="replica-subtitle">
      <span class="rp-subtitle-text">{{ currentSay }}</span>
    </div>

    <!-- 控制条 -->
    <footer class="rp-controls">
      <button class="rp-btn" type="button" :disabled="stepIndex === 0 && chapterIndex === 0" @click="prev">
        ‹ 上一步
      </button>
      <button class="rp-btn primary" type="button" :disabled="finished" @click="next">
        下一步 ›
      </button>
      <button class="rp-btn" type="button" @click="replayChapter">重播本章</button>
      <button class="rp-btn" type="button" :class="{ on: autoPlay }" @click="toggleAuto">
        {{ autoPlay ? '⏸ 自动播放中' : '▶ 自动播放' }}
      </button>
      <div class="rp-dots" aria-hidden="true">
        <span
          v-for="(s, i) in chapter.steps"
          :key="i"
          class="rp-dot"
          :class="{ done: i < stepIndex, now: i === stepIndex }"
          @click.stop="gotoStep(i)"
        ></span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import ReplicaStage from '@/components/replica/ReplicaStage.vue'
import { chapters } from '@/data/rationalReplica'

const chapterIndex = ref(0)
const stepIndex = ref(0)
const autoPlay = ref(false)
const drawerOpen = ref(false)
const stepKey = ref(0)
let autoTimer = 0

const chapter = computed(() => chapters[chapterIndex.value])
const currentStep = computed(() => chapter.value.steps[stepIndex.value] || { say: '', scene: [] })
const currentSay = computed(() => currentStep.value.say || '')
const currentScene = computed(() => currentStep.value.scene || [])
const atChapterEnd = computed(
  () => stepIndex.value === chapter.value.steps.length - 1 && chapterIndex.value < chapters.length - 1,
)
const finished = computed(
  () => stepIndex.value === chapter.value.steps.length - 1 && chapterIndex.value === chapters.length - 1,
)
const nextChapterTitle = computed(() => chapters[chapterIndex.value + 1]?.title || '')

function next() {
  if (stepIndex.value < chapter.value.steps.length - 1) {
    stepIndex.value += 1
  } else if (chapterIndex.value < chapters.length - 1) {
    chapterIndex.value += 1
    stepIndex.value = 0
  }
  stepKey.value += 1
  scheduleAuto()
}

function prev() {
  if (stepIndex.value > 0) stepIndex.value -= 1
  else if (chapterIndex.value > 0) {
    chapterIndex.value -= 1
    stepIndex.value = chapter.value.steps.length - 1
  }
  stepKey.value += 1
  scheduleAuto()
}

function gotoStep(i) {
  stepIndex.value = Math.max(0, Math.min(i, chapter.value.steps.length - 1))
  stepKey.value += 1
  scheduleAuto()
}

function nextChapter() {
  if (chapterIndex.value < chapters.length - 1) {
    chapterIndex.value += 1
    stepIndex.value = 0
    stepKey.value += 1
    scheduleAuto()
  }
}

function jumpChapter(id) {
  const idx = chapters.findIndex((ch) => ch.id === id)
  if (idx >= 0) {
    chapterIndex.value = idx
    stepIndex.value = 0
    stepKey.value += 1
    drawerOpen.value = false
    scheduleAuto()
  }
}

function replayChapter() {
  stepIndex.value = 0
  stepKey.value += 1
  scheduleAuto()
}

function restart() {
  chapterIndex.value = 0
  stepIndex.value = 0
  stepKey.value += 1
  scheduleAuto()
}

function toggleAuto() {
  autoPlay.value = !autoPlay.value
  scheduleAuto()
}

/** 按字幕字数估算停留时长（中文约 4.8 字/秒），自动播放用 */
function scheduleAuto() {
  window.clearTimeout(autoTimer)
  if (!autoPlay.value || finished.value) return
  const chars = currentSay.value.length
  const ms = Math.max(2400, (chars / 4.8) * 1000 + 900)
  autoTimer = window.setTimeout(next, ms)
}

function onKey(event) {
  if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    next()
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    prev()
  }
}

watch(currentSay, () => scheduleAuto())
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.clearTimeout(autoTimer)
  window.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.rp-player {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 560px;
  background:
    radial-gradient(circle at 1px 1px, rgba(120, 105, 80, 0.14) 1px, transparent 0) 0 0 / 22px 22px,
    #ffffff;
  border: 1px solid var(--divider, #eae3d5);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

/* —— 顶部标题 —— */
.rp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 22px 10px;
}

.rp-chapter-no {
  font-size: 12px;
  color: var(--text-faint, #8a8378);
  letter-spacing: 0.08em;
}

.rp-title {
  margin: 2px 0 0;
  font-size: 30px;
  font-weight: 700;
  color: var(--text-main, #2a2721);
  font-family: 'Kaiti SC', 'KaiTi', 'STKaiti', 'Noto Sans SC', serif;
}

.rp-rule {
  margin-top: 8px;
  width: 240px;
  height: 2px;
  background: linear-gradient(90deg, var(--text-main, #2a2721), transparent);
  border-radius: 2px;
}

.rp-head-side {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rp-step-count {
  font-size: 13px;
  color: var(--text-sub, #6b6558);
  font-variant-numeric: tabular-nums;
}

.rp-icon-btn {
  border: 1px solid var(--divider, #eae3d5);
  background: #fff;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 15px;
  color: var(--text-sub, #6b6558);
}

.rp-icon-btn:hover {
  border-color: var(--brand, #4a6cf7);
  color: var(--brand, #4a6cf7);
}

/* —— 章节抽屉 —— */
.rp-drawer {
  position: absolute;
  top: 64px;
  right: 16px;
  z-index: 20;
  width: 264px;
  max-height: 62vh;
  overflow: auto;
  background: #fff;
  border: 1px solid var(--divider, #eae3d5);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(42, 39, 33, 0.14);
  padding: 8px;
}

.rp-drawer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  font-size: 13.5px;
  color: var(--text-main, #2a2721);
}

.rp-drawer-item:hover {
  background: var(--surface-2, #f6f2ea);
}

.rp-drawer-item.active {
  background: var(--hero-bg, #f3eee3);
  font-weight: 700;
}

.rp-drawer-no {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--surface-2, #f6f2ea);
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--text-sub, #6b6558);
}

/* —— 舞台 —— */
.rp-stage {
  position: relative;
  flex: 1;
  min-height: 380px;
  cursor: pointer;
}

.rp-chapter-end {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 14px;
  display: flex;
  justify-content: center;
}

.rp-finish {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(2px);
}

.rp-finish-card {
  text-align: center;
  padding: 26px 34px;
  background: #fff;
  border: 1px solid var(--divider, #eae3d5);
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(42, 39, 33, 0.12);
}

.rp-finish-line {
  margin: 0 0 14px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main, #2a2721);
  font-family: 'Kaiti SC', 'KaiTi', 'STKaiti', serif;
}

.rp-finish-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* —— 字幕条 —— */
.rp-subtitle {
  padding: 12px 22px;
  background: rgba(42, 39, 33, 0.88);
  color: #fff;
  min-height: 58px;
  display: flex;
  align-items: center;
}

.rp-subtitle-text {
  font-size: 15.5px;
  line-height: 1.75;
}

/* —— 控制条 —— */
.rp-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--divider, #eae3d5);
  background: #fff;
  flex-wrap: wrap;
}

.rp-btn {
  border: 1px solid var(--divider, #eae3d5);
  background: #fff;
  color: var(--text-main, #2a2721);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.rp-btn:hover:not(:disabled) {
  border-color: var(--brand, #4a6cf7);
  color: var(--brand, #4a6cf7);
}

.rp-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.rp-btn.primary {
  background: var(--brand, #4a6cf7);
  border-color: var(--brand, #4a6cf7);
  color: #fff;
}

.rp-btn.primary:hover:not(:disabled) {
  color: #fff;
  filter: brightness(1.06);
}

.rp-btn.on {
  border-color: var(--ok, #2f8f5b);
  color: var(--ok, #2f8f5b);
}

.rp-dots {
  display: flex;
  gap: 5px;
  margin-left: auto;
  flex-wrap: wrap;
  max-width: 46%;
}

.rp-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--divider, #eae3d5);
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.rp-dot.done {
  background: var(--text-faint, #8a8378);
}

.rp-dot.now {
  background: var(--brand, #4a6cf7);
  transform: scale(1.35);
}

@media (max-width: 720px) {
  .rp-title {
    font-size: 22px;
  }

  .rp-dots {
    display: none;
  }

  .rp-subtitle-text {
    font-size: 14px;
  }
}
</style>
