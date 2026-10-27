<script setup>
import { ref, computed } from 'vue'
import { showToast } from 'vant'
import { COURSE } from '@/mock/data'
import { useUserStore } from '@/stores/user'
import { useModelStore } from '@/stores/model'
import { usePracticeStore } from '@/stores/practice'
import { generatePracticeQuestion, reviewPracticeAnswer, PRACTICE_TYPES } from '@/api/aiTasks'

const userStore = useUserStore()
const modelStore = useModelStore()
const practiceStore = usePracticeStore()

const chapterOptions = computed(() => COURSE.chapters.map((c) => c.title))
const isConfigured = computed(() => modelStore.isConfigured)
const myRecords = computed(() => practiceStore.myRecords(userStore.user?.id))

const showPicker = ref(false)
const pickerField = ref('chapter')
const form = ref({
  chapter: COURSE.chapters[2]?.title || '',
  type: PRACTICE_TYPES[0],
})

const pickerColumns = computed(() =>
  pickerField.value === 'chapter'
    ? chapterOptions.value
    : PRACTICE_TYPES,
)

function onPickerConfirm({ selectedOptions }) {
  const value = selectedOptions[0]?.value ?? selectedOptions[0]
  if (pickerField.value === 'chapter') form.value.chapter = value
  else form.value.type = value
  showPicker.value = false
}

const question = ref('')
const answer = ref('')
const feedback = ref('')
const generating = ref(false)
const reviewing = ref(false)
const showFeedbackId = ref('')

async function generate() {
  generating.value = true
  feedback.value = ''
  answer.value = ''
  question.value = ''
  try {
    question.value = await generatePracticeQuestion({
      chapter: form.value.chapter,
      type: form.value.type,
      discipline: userStore.discipline,
    })
  } catch (err) {
    showToast(err.message || '出题失败，请稍后重试')
  } finally {
    generating.value = false
  }
}

async function submit() {
  const text = answer.value.trim()
  if (!text) {
    showToast('请先写下你的作答')
    return
  }
  if (!question.value) {
    showToast('请先生成一道练习题')
    return
  }
  reviewing.value = true
  try {
    const result = await reviewPracticeAnswer({
      chapter: form.value.chapter,
      question: question.value,
      answer: text,
      discipline: userStore.discipline,
    })
    feedback.value = result
    practiceStore.add({
      studentId: userStore.user?.id,
      studentName: userStore.name,
      chapter: form.value.chapter,
      type: form.value.type,
      question: question.value,
      answer: text,
      feedback: result,
    })
    showToast('已生成反馈，并计入过程性评价')
  } catch (err) {
    showToast(err.message || '反馈生成失败，请稍后重试')
  } finally {
    reviewing.value = false
  }
}

function formatTime(iso) {
  try {
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

// 当前弹出反馈浮层对应的练习记录（showFeedbackPop 由点击与浮层关闭事件共同维护）
const showFeedbackPop = ref(false)
const feedbackRecord = computed(
  () => myRecords.value.find((r) => r.id === showFeedbackId.value) || null,
)

function toggleFeedback(id) {
  showFeedbackId.value = showFeedbackId.value === id ? '' : id
  showFeedbackPop.value = !!showFeedbackId.value
}
</script>

<template>
  <div class="m-page">
    <van-notice-bar
      v-if="!isConfigured"
      text="尚未配置模型密钥，配置后即可使用 AI 出题与反馈（模型接入见 Web 端）"
      background="#fdf6ec"
      color="#b06f00"
    />

    <van-cell-group inset title="出题设置">
      <van-cell
        title="考查章节"
        :value="form.chapter"
        is-link
        @click="pickerField = 'chapter'; showPicker = true"
      />
      <van-cell
        title="题型"
        :value="form.type"
        is-link
        @click="pickerField = 'type'; showPicker = true"
      />
    </van-cell-group>

    <div class="m-gen-wrap">
      <van-button
        block
        type="primary"
        size="small"
        :loading="generating"
        :disabled="!isConfigured"
        @click="generate"
      >
        {{ question ? '换一题' : 'AI 生成练习题' }}
      </van-button>
      <p v-if="userStore.discipline" class="m-discipline-tip">
        学科背景：{{ userStore.discipline }}（题目情境将贴合你的背景）
      </p>
    </div>

    <van-skeleton v-if="generating" title :row="3" />

    <template v-if="question && !generating">
      <van-cell-group inset title="本题情境">
        <div class="m-question">{{ question }}</div>
      </van-cell-group>

      <van-cell-group inset title="我的作答">
        <van-field
          v-model="answer"
          type="textarea"
          rows="4"
          autosize
          placeholder="请像在课堂上回答老师一样，完整写下你的表达"
        />
        <div class="m-submit-wrap">
          <van-button
            block
            type="primary"
            size="small"
            :loading="reviewing"
            @click="submit"
          >
            提交并获取反馈
          </van-button>
        </div>
      </van-cell-group>
    </template>

    <van-cell-group v-if="feedback" inset title="AI 三维反馈">
      <div class="m-feedback">{{ feedback }}</div>
    </van-cell-group>

    <van-cell-group inset title="我的练习记录">
      <van-cell
        v-for="r in myRecords.slice(0, 10)"
        :key="r.id"
        :title="r.chapter"
        :label="`${r.type} · ${formatTime(r.createdAt)}`"
      >
        <template #right-icon>
          <van-popover
            v-model:show="showFeedbackPop"
            placement="left"
            theme="round"
            :actions="[{ text: '关闭' }]"
          >
            <template #reference>
              <van-button size="mini" plain type="primary" @click.stop="toggleFeedback(r.id)">
                查看反馈
              </van-button>
            </template>
            <div class="m-pop-feedback">{{ feedbackRecord?.feedback }}</div>
          </van-popover>
        </template>
      </van-cell>
      <van-empty v-if="!myRecords.length" description="还没有练习记录" image-size="60" />
    </van-cell-group>

    <van-popup v-model:show="showPicker" position="bottom">
      <van-picker
        :columns="pickerColumns"
        @confirm="onPickerConfirm"
        @cancel="showPicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped>
.m-gen-wrap {
  padding: 12px 16px 0;
}

.m-discipline-tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-sub);
}

.m-question {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.9;
  white-space: pre-wrap;
}

.m-submit-wrap {
  padding: 10px 16px 14px;
}

.m-feedback {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.9;
  white-space: pre-wrap;
}

.m-pop-feedback {
  max-width: 260px;
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>
