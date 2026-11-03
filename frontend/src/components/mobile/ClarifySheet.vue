<script setup>
import { ref, watch } from 'vue'

/**
 * 生成前澄清（H5 版）
 */
const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '先确认一下' },
  description: { type: String, default: '' },
  questions: { type: Array, default: () => [] },
  confirmText: { type: String, default: '开始生成' },
})

const emit = defineEmits(['update:show', 'confirm', 'cancel'])

const answers = ref({})

function initAnswers() {
  const next = {}
  props.questions.forEach((q) => {
    next[q.id] = q.default ?? q.options?.[0]?.value ?? ''
  })
  answers.value = next
}

watch(
  () => props.show,
  (open) => {
    if (open) initAnswers()
  },
  { immediate: true },
)

function close() {
  emit('update:show', false)
}

function cancel() {
  emit('cancel')
  close()
}

function confirm() {
  emit('confirm', { ...answers.value })
  close()
}
</script>

<template>
  <van-popup
    :show="show"
    round
    position="bottom"
    :style="{ paddingBottom: '20px' }"
    @update:show="emit('update:show', $event)"
  >
    <div class="m-clarify">
      <div class="m-clarify-title">{{ title }}</div>
      <p v-if="description" class="m-clarify-desc">{{ description }}</p>

      <div v-for="(q, qi) in questions" :key="q.id" class="m-clarify-item">
        <div class="m-clarify-label">{{ qi + 1 }}. {{ q.label }}</div>
        <div class="m-clarify-options">
          <span
            v-for="opt in q.options"
            :key="opt.value"
            class="skin-chip"
            :class="{ on: answers[q.id] === opt.value }"
            @click="answers[q.id] = opt.value"
          >
            {{ opt.label }}
          </span>
        </div>
      </div>

      <div class="m-clarify-actions">
        <van-button block plain size="small" @click="cancel">跳过</van-button>
        <van-button block type="primary" size="small" @click="confirm">
          {{ confirmText }}
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<style scoped>
.m-clarify {
  padding: 20px 16px 4px;
}

.m-clarify-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.m-clarify-desc {
  margin: 6px 0 16px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-sub);
}

.m-clarify-item {
  margin-bottom: 16px;
}

.m-clarify-label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.m-clarify-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.m-clarify-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
</style>
