import { computed, onBeforeUnmount, ref } from 'vue'
import { playSpeech, preloadSpeech, stopSpeech } from '@/api/tts'
import { useVoiceStore } from '@/stores/voice'
import { boardBlockNarration, shortSpeechText } from '@/utils/boardNarration'

/**
 * 板书字幕与语音的统一播放器。
 * 语音开启时，上一段播完才显示下一块，保证字幕和讲解同步；
 * 当前段播放期间预取下一段，减少切换延迟。
 */
export function useBoardPlayback(lesson, options = {}) {
  const revealDelay = Number(options.revealDelay) || 900
  const voiceStore = useVoiceStore()
  const visibleCount = ref(0)
  const paused = ref(false)
  const narrating = ref(false)
  const voiceError = ref('')
  let revealTimer = null
  let narrationEpoch = 0

  const revealFinished = computed(
    () => !!lesson.value && visibleCount.value >= lesson.value.blocks.length,
  )
  const voiceEnabled = computed(() => voiceStore.enabled)

  function stopReveal() {
    if (revealTimer) {
      clearInterval(revealTimer)
      revealTimer = null
    }
  }

  function stopNarration() {
    narrationEpoch += 1
    stopSpeech()
    narrating.value = false
  }

  function startInterval(force = false) {
    stopReveal()
    if (!lesson.value || paused.value || (voiceStore.enabled && !force)) return
    revealTimer = window.setInterval(() => {
      if (!lesson.value || visibleCount.value >= lesson.value.blocks.length) {
        stopReveal()
        return
      }
      visibleCount.value += 1
    }, revealDelay)
  }

  async function narrateAt(index, epoch) {
    if (
      !voiceStore.enabled ||
      paused.value ||
      epoch !== narrationEpoch ||
      !lesson.value
    ) {
      return
    }
    const blocks = lesson.value.blocks || []
    if (index >= blocks.length) {
      narrating.value = false
      stopReveal()
      return
    }

    visibleCount.value = Math.max(visibleCount.value, index + 1)
    const text = shortSpeechText(boardBlockNarration(blocks[index]))
    if (!text) {
      visibleCount.value = Math.min(blocks.length, index + 2)
      void narrateAt(index + 1, epoch)
      return
    }

    const nextText = shortSpeechText(boardBlockNarration(blocks[index + 1]))
    narrating.value = true
    voiceError.value = ''
    try {
      await Promise.allSettled([
        preloadSpeech(text, { config: voiceStore.ttsConfig }),
        nextText
          ? preloadSpeech(nextText, { config: voiceStore.ttsConfig })
          : Promise.resolve(null),
      ])
      if (
        epoch !== narrationEpoch ||
        !voiceStore.enabled ||
        paused.value
      ) {
        return
      }
      await playSpeech(text, {
        config: voiceStore.ttsConfig,
        onEnded: () => {
          narrating.value = false
          if (
            epoch !== narrationEpoch ||
            !voiceStore.enabled ||
            paused.value
          ) {
            return
          }
          visibleCount.value = Math.min(blocks.length, index + 2)
          void narrateAt(index + 1, epoch)
        },
      })
    } catch (error) {
      narrating.value = false
      voiceError.value =
        error?.name === 'NotAllowedError'
          ? '浏览器阻止了自动播放，请点击“开启语音”'
          : error?.message || '语音播放失败'
      if (epoch === narrationEpoch) startInterval(true)
    }
  }

  function startReveal(fromStart = false) {
    stopReveal()
    stopNarration()
    paused.value = false
    if (fromStart) visibleCount.value = 0
    if (!lesson.value) return

    const blocks = lesson.value.blocks || []
    if (!blocks.length) return
    if (voiceStore.enabled) {
      const startIndex = fromStart
        ? 0
        : Math.min(Math.max(visibleCount.value - 1, 0), blocks.length - 1)
      visibleCount.value = Math.max(1, startIndex + 1)
      const epoch = narrationEpoch
      void narrateAt(startIndex, epoch)
      return
    }

    visibleCount.value = Math.max(visibleCount.value, 1)
    startInterval()
  }

  function togglePause() {
    if (!lesson.value) return
    if (revealFinished.value) {
      startReveal(true)
      return
    }
    if (paused.value) {
      paused.value = false
      if (voiceStore.enabled) {
        const index = Math.min(
          Math.max(visibleCount.value - 1, 0),
          lesson.value.blocks.length - 1,
        )
        const epoch = ++narrationEpoch
        void narrateAt(index, epoch)
      } else {
        startInterval()
      }
      return
    }
    paused.value = true
    stopReveal()
    stopNarration()
  }

  function restart() {
    startReveal(true)
  }

  function setVoiceEnabled(enabled) {
    voiceStore.setEnabled(enabled)
    voiceError.value = ''
    if (enabled) startReveal(revealFinished.value)
    else {
      stopNarration()
      if (!revealFinished.value) startInterval()
    }
  }

  function toggleVoice() {
    setVoiceEnabled(!voiceStore.enabled)
  }

  function selectVoice(id) {
    voiceStore.setVoice(id)
    if (voiceStore.enabled) startReveal(false)
  }

  onBeforeUnmount(() => {
    stopReveal()
    stopNarration()
  })

  return {
    visibleCount,
    paused,
    narrating,
    voiceError,
    voiceEnabled,
    revealFinished,
    voiceStore,
    startReveal,
    startInterval,
    stopReveal,
    stopNarration,
    togglePause,
    restart,
    setVoiceEnabled,
    toggleVoice,
    selectVoice,
  }
}
