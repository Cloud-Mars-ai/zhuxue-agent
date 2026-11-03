<script setup>
import { ref, watch } from 'vue'

/**
 * 生成前澄清（MCQ 前置澄清）
 *
 * 把"不知道该怎么提问"降解为 2–3 次点击；所有题都有默认值，可直接跳过。
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '先确认一下' },
  description: { type: String, default: '' },
  questions: { type: Array, default: () => [] },
  confirmText: { type: String, default: '开始生成' },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const answers = ref({})

function initAnswers() {
  const next = {}
  props.questions.forEach((q) => {
    next[q.id] = q.default ?? q.options?.[0]?.value ?? ''
  })
  answers.value = next
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) initAnswers()
  },
  { immediate: true },
)

function close() {
  emit('update:modelValue', false)
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
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="460px"
    append-to-body
    class="clarify-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p v-if="description" class="clarify-desc">{{ description }}</p>

    <div v-for="(q, qi) in questions" :key="q.id" class="clarify-item">
      <div class="clarify-label">{{ qi + 1 }}. {{ q.label }}</div>
      <el-radio-group v-model="answers[q.id]" class="clarify-options">
        <el-radio v-for="opt in q.options" :key="opt.value" :value="opt.value" border>
          {{ opt.label }}
        </el-radio>
      </el-radio-group>
    </div>

    <template #footer>
      <div class="clarify-footer">
        <el-button text @click="cancel">跳过，直接生成</el-button>
        <el-button type="primary" @click="confirm">{{ confirmText }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.clarify-desc {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-sub);
}

.clarify-item {
  margin-bottom: 16px;
}

.clarify-label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.clarify-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.clarify-options :deep(.el-radio) {
  margin-right: 0;
}

.clarify-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
