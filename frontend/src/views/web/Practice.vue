<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { COURSE } from '@/mock/data'
import { useUserStore } from '@/stores/user'
import { useModelStore } from '@/stores/model'
import { usePracticeStore } from '@/stores/practice'
import { generatePracticeQuestion, reviewPracticeAnswer, PRACTICE_TYPES } from '@/api/aiTasks'

const userStore = useUserStore()
const modelStore = useModelStore()
const practiceStore = usePracticeStore()

// 章节选项取课程章节（去掉"第x章 "前缀只保留标题名太短，直接用完整标题）
const chapterOptions = computed(() => COURSE.chapters.map((c) => c.title))

const form = ref({
  chapter: COURSE.chapters[2]?.title || '',
  type: PRACTICE_TYPES[0],
})

const question = ref('')
const answer = ref('')
const feedback = ref('')
const generating = ref(false)
const reviewing = ref(false)
const error = ref('')

const isConfigured = computed(() => modelStore.isConfigured)
const myRecords = computed(() => practiceStore.myRecords(userStore.user?.id))

async function generate() {
  if (generating.value) return
  generating.value = true
  error.value = ''
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
    error.value = err.message || '出题失败，请稍后重试'
    ElMessage.error(error.value)
  } finally {
    generating.value = false
  }
}

async function submit() {
  const text = answer.value.trim()
  if (!text) {
    ElMessage.warning('请先写下你的作答，再提交获取反馈')
    return
  }
  if (!question.value) {
    ElMessage.warning('请先生成一道练习题')
    return
  }
  reviewing.value = true
  error.value = ''
  try {
    const result = await reviewPracticeAnswer({
      chapter: form.value.chapter,
      question: question.value,
      answer: text,
      discipline: userStore.discipline,
    })
    feedback.value = result
    // 写入练习记录，作为考核出题的过程性评价输入（M4）
    practiceStore.add({
      studentId: userStore.user?.id,
      studentName: userStore.name,
      chapter: form.value.chapter,
      type: form.value.type,
      question: question.value,
      answer: text,
      feedback: result,
    })
    ElMessage.success('已生成三维反馈，并计入过程性评价')
  } catch (err) {
    error.value = err.message || '反馈生成失败，请稍后重试'
    ElMessage.error(error.value)
  } finally {
    reviewing.value = false
  }
}

function formatTime(iso) {
  try {
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}
</script>

<template>
  <div class="practice-page">
    <el-alert v-if="!isConfigured" type="warning" :closable="false" show-icon class="mb12">
      <template #title>
        尚未完成模型配置，
        <el-link type="primary" :underline="false" @click="$router.push('/model')">
          去「模型接入」页面配置
        </el-link>
        后即可使用 AI 出题与反馈
      </template>
    </el-alert>

    <el-row :gutter="16">
      <el-col :xs="24" :md="14">
        <div class="card">
          <h3 class="card-title">一人一题 · 人人互动练习</h3>
          <p class="card-desc">
            大班教学场景下，每位同学都能获得专属情境题；作答后 AI 从观点结构、理论运用、表达逻辑三个维度给出反馈，练习记录计入过程性评价。
          </p>

          <el-form :model="form" label-width="80px" class="practice-form">
            <el-form-item label="考查章节">
              <el-select v-model="form.chapter" placeholder="选择章节" style="width: 100%">
                <el-option
                  v-for="c in chapterOptions"
                  :key="c"
                  :label="c"
                  :value="c"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="题型">
              <el-radio-group v-model="form.type">
                <el-radio-button v-for="t in PRACTICE_TYPES" :key="t" :value="t">
                  {{ t }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="generating"
                :disabled="!isConfigured"
                @click="generate"
              >
                {{ question ? '换一题' : 'AI 生成练习题' }}
              </el-button>
              <span v-if="userStore.discipline" class="discipline-tag">
                学科背景：{{ userStore.discipline }}（题目情境将贴合你的背景）
              </span>
            </el-form-item>
          </el-form>

          <el-skeleton v-if="generating" :rows="4" animated />

          <div v-if="question && !generating" class="question-box">
            <div class="question-label">本题情境</div>
            <div class="question-text">{{ question }}</div>
          </div>

          <div v-if="question && !generating" class="answer-box">
            <div class="question-label">我的作答</div>
            <el-input
              v-model="answer"
              type="textarea"
              :rows="5"
              resize="none"
              placeholder="请用口头表达的方式写下你的作答（就像在课堂上回答老师一样）"
            />
            <el-button
              type="primary"
              class="submit-btn"
              :loading="reviewing"
              @click="submit"
            >
              提交并获取反馈
            </el-button>
          </div>

          <div v-if="feedback" class="feedback-box">
            <div class="question-label">AI 三维反馈</div>
            <div class="feedback-text">{{ feedback }}</div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :md="10">
        <div class="card">
          <h3 class="card-title">我的练习记录</h3>
          <p class="card-desc">最近 {{ myRecords.length }} 次练习，作为考核出题的过程性评价依据。</p>
          <el-timeline v-if="myRecords.length" class="record-timeline">
            <el-timeline-item
              v-for="r in myRecords.slice(0, 10)"
              :key="r.id"
              :timestamp="formatTime(r.createdAt)"
              placement="top"
              type="primary"
            >
              <div class="record-chapter">{{ r.chapter }} · {{ r.type }}</div>
              <div class="record-question">{{ r.question }}</div>
              <el-popover placement="right" :width="320" trigger="click">
                <template #reference>
                  <el-button link type="primary" size="small">查看反馈</el-button>
                </template>
                <div class="record-feedback">{{ r.feedback }}</div>
              </el-popover>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="还没有练习记录，快去生成第一题吧" :image-size="80" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.practice-page {
  padding-bottom: 12px;
}

.mb12 {
  margin-bottom: 12px;
}

.card-title {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 600;
}

.card-desc {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-sub);
}

.practice-form {
  max-width: 560px;
}

.discipline-tag {
  margin-left: 12px;
  font-size: 12px;
  color: var(--text-sub);
}

.question-box,
.answer-box,
.feedback-box {
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-page);
}

.feedback-box {
  border-color: var(--brand);
  background: #eef4ff;
}

.question-label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--brand);
}

.question-text,
.feedback-text {
  font-size: 14px;
  line-height: 1.9;
  white-space: pre-wrap;
}

.submit-btn {
  margin-top: 10px;
}

.record-timeline {
  padding-left: 4px;
}

.record-chapter {
  font-size: 13px;
  font-weight: 600;
}

.record-question {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-sub);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.record-feedback {
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>
