<script setup>
import { ref, computed } from 'vue'
import { showToast } from 'vant'
import { COURSE } from '@/mock/data'
import { useUserStore } from '@/stores/user'
import { useModelStore } from '@/stores/model'
import { usePracticeStore } from '@/stores/practice'
import { useThemeStore } from '@/stores/theme'
import { renderMd } from '@/utils/md'
import { generatePracticeQuestion, reviewPracticeAnswer, PRACTICE_TYPES } from '@/api/aiTasks'

const userStore = useUserStore()
const modelStore = useModelStore()
const practiceStore = usePracticeStore()
const themeStore = useThemeStore()

const chapterOptions = computed(() => COURSE.chapters.map((c) => c.title))
const isConfigured = computed(() => modelStore.isConfigured)
const myRecords = computed(() => practiceStore.myRecords(userStore.user?.id))

// 出题设置：章节 / 题型用 chips 一屏完成（方案二「云课笺」语汇）
const form = ref({
  chapter: COURSE.chapters[2]?.title || '',
  type: PRACTICE_TYPES[0],
})

const question = ref('')
const answer = ref('')
const feedback = ref('')
const generating = ref(false)
const reviewing = ref(false)
const showFeedbackId = ref('')

// 栏目标题随皮肤切换：墨读下反馈区改称「红批」
const feedbackTitle = computed(() =>
  themeStore.isMo ? '红批 · AI 三维反馈' : 'AI 三维反馈',
)

// 提交按钮文案随皮肤切换：墨读下交卷即「寄出」，云课笺直陈操作
const submitLabel = computed(() => (themeStore.isMo ? '交卷 →' : '提交并获取反馈'))

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
    <!-- 墨读报头：一人一题日练 · 栏目号（方案示意 A-2） -->
    <div v-if="themeStore.isMo" class="mo-page-mast" data-testid="mo-practice-mast">
      <span class="mo-page-mast-brand">一人一题<em>日练</em></span>
      <span class="mo-page-mast-no">COLUMN 07</span>
    </div>

    <van-notice-bar
      v-if="!isConfigured"
      text="尚未配置模型密钥，配置后即可使用 AI 出题与反馈（模型接入见 Web 端）"
      background="#fdf6ec"
      color="#b06f00"
    />

    <!-- 出题设置：chips 选择章节与题型 -->
    <div class="m-setup">
      <div class="m-section-label">出题设置</div>
      <div class="m-chip-row">
        <span
          v-for="c in chapterOptions"
          :key="c"
          class="skin-chip"
          :class="{ on: form.chapter === c }"
          @click="form.chapter = c"
        >
          {{ c }}
        </span>
      </div>
      <div class="m-chip-row">
        <span
          v-for="t in PRACTICE_TYPES"
          :key="t"
          class="skin-chip"
          :class="{ on: form.type === t }"
          @click="form.type = t"
        >
          {{ t }}
        </span>
      </div>
      <van-button
        block
        type="primary"
        size="small"
        :loading="generating"
        :disabled="!isConfigured"
        @click="generate"
      >
        AI 生成练习题
      </van-button>
      <p v-if="userStore.discipline" class="m-discipline-tip">
        学科背景：{{ userStore.discipline }}（题目情境将贴合你的背景）
      </p>
    </div>

    <van-skeleton v-if="generating" title :row="3" />

    <!-- 本题情境：墨读皮肤下为报纸剪贴题卡（skins.css 覆写） -->
    <template v-if="question && !generating">
      <div class="m-q-section">
        <div class="m-q-head">
          <span class="m-section-label">本题情境</span>
          <span class="m-swap-link" @click="!generating && generate()">换一题</span>
        </div>
        <div class="m-question">
          {{ question }}
          <div class="m-q-foot">
            <span class="m-q-tag">考查：{{ form.chapter }} · {{ form.type }} · 200 字内口述</span>
            <span class="m-swap-link" @click="!generating && generate()">换一题</span>
          </div>
        </div>
      </div>

      <!-- 我的作答：墨读皮肤下为横格稿纸 -->
      <div class="m-answer-section">
        <div class="m-section-label">我的作答</div>
        <div class="skin-paper">
          <van-field
            v-model="answer"
            type="textarea"
            rows="4"
            autosize
            placeholder="请像在课堂上回答老师一样，完整写下你的表达"
          />
        </div>
        <div class="m-submit-wrap">
          <van-button
            block
            type="primary"
            size="small"
            :loading="reviewing"
            @click="submit"
          >
            {{ submitLabel }}
          </van-button>
        </div>
      </div>
    </template>

    <!-- AI 反馈：墨读皮肤下为红批批注框 -->
    <div v-if="feedback" class="m-feedback-section">
      <div class="m-feedback-head">
        <span class="m-section-label">{{ feedbackTitle }}</span>
        <span v-if="!themeStore.isMo" class="skin-badge ok">已完成 {{ myRecords.length }} 次</span>
      </div>
      <div class="m-feedback" v-html="renderMd(feedback)"></div>
    </div>

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
            <div class="m-pop-feedback" v-html="renderMd(feedbackRecord?.feedback)"></div>
          </van-popover>
        </template>
      </van-cell>
      <van-empty v-if="!myRecords.length" description="还没有练习记录" image-size="60" />
    </van-cell-group>
  </div>
</template>

<style scoped>
/* 分区标签：两种皮肤下通用的小节题 */
.m-section-label {
  padding: 14px 16px 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.m-setup {
  margin: 12px;
  padding: 4px 14px 14px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.m-setup .m-section-label {
  padding: 10px 0 6px;
}

.m-chip-row {
  margin-bottom: 2px;
}

.m-discipline-tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-sub);
}

/* 本题情境：云课笺为圆角卡片（墨读覆写见块尾） */
.m-question {
  margin: 0 12px;
  padding: 14px 16px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  font-size: 14px;
  line-height: var(--question-leading);
  white-space: pre-wrap;
  color: var(--text-main);
}

/* 题卡头部（云课笺）：小节标签 + 换一题 */
.m-q-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 8px;
}

.m-q-head .m-section-label {
  padding: 0;
}

.m-swap-link {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  cursor: pointer;
  font-family: var(--font-ui);
  white-space: nowrap;
}

.m-swap-link:hover {
  opacity: 0.8;
}

/* 题卡脚注（墨读）：考查标签 + 换一题，云课笺下隐藏 */
.m-q-foot {
  display: none;
}

.m-q-tag {
  font-family: var(--font-ui);
  font-size: 11px;
  letter-spacing: 1px;
  color: #6b6255;
}

/* 反馈区头部：小节标签 + 完成次数徽章（云课笺） */
.m-feedback-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 16px;
}

.m-feedback-head .m-section-label {
  padding-right: 0;
}

/* 我的作答：云课笺为圆角卡片包裹的输入区（墨读下为横格稿纸） */
.skin-paper {
  margin: 0 12px;
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  overflow: hidden;
  background: var(--card-bg);
}

.m-submit-wrap {
  padding: 10px 12px 0;
}

/* AI 反馈：云课笺为圆角卡片（墨读下为红批批注框） */
.m-feedback {
  margin: 0 12px;
  padding: 14px 16px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  font-size: 14px;
  line-height: var(--question-leading);
  white-space: pre-wrap;
  color: var(--text-main);
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

/* ---- 墨读皮肤覆写（置于块尾，特异性高于上方基础规则） ---- */
html[data-theme='mo'] .m-q-head {
  display: none;
}

html[data-theme='mo'] .m-q-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #b9af9e;
}

html[data-theme='mo'] .m-answer-section .m-section-label {
  display: none;
}

html[data-theme='mo'] .m-setup {
  background: transparent;
  border: none;
  box-shadow: none;
  margin: 6px 12px 0;
  padding: 0 4px;
}
</style>
