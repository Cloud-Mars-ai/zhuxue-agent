<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { playSpeech, stopSpeech } from '@/api/tts'

const props = defineProps({
  text: { type: String, default: '' },
})

const loading = ref(false)
const playing = ref(false)

async function toggle() {
  if (loading.value) return
  if (playing.value) {
    stopSpeech()
    playing.value = false
    return
  }
  loading.value = true
  try {
    await playSpeech(props.text, {
      onEnded: () => {
        playing.value = false
      },
    })
    playing.value = true
  } catch (err) {
    ElMessage.error(err.message || '语音合成失败')
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  if (playing.value) stopSpeech()
})
</script>

<template>
  <button
    type="button"
    class="speak-button"
    :disabled="!text || loading"
    :aria-label="playing ? '停止朗读' : '朗读这条回答'"
    @click.stop="toggle"
  >
    <span class="speak-icon" :class="{ playing }">◖</span>
    {{ loading ? '生成语音…' : playing ? '停止朗读' : '朗读' }}
  </button>
</template>

<style scoped>
.speak-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  padding: 3px 8px;
  color: var(--text-faint);
  background: transparent;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}

.speak-button:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.speak-button:disabled {
  opacity: 0.45;
}

.speak-icon {
  font-size: 12px;
  transform: rotate(-35deg);
}

.speak-icon.playing {
  animation: pulse 0.9s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}
</style>
