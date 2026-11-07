<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { COURSE } from '@/mock/data'
import { useUserStore } from '@/stores/user'
import { usePersonaStore } from '@/stores/persona'
import { isEnabled } from '@/config/flags'
import { sendChat } from '@/api/chat'
import { matchIntent, buildTodoActions } from '@/utils/intent'
import { getDailyRecommendations } from '@/utils/recommend'
import SpeakButton from '@/components/SpeakButton.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const personaStore = usePersonaStore()

// 主动问候：进入答疑页即展示欢迎语与推荐操作
const messages = ref([
  {
    role: 'assistant',
    content:
      '你好，我是你的跨学科学习助教。告诉我学科、年级和学习目标，或先上传资料，我会据此调整讲法。\n' +
      '也可以直接说："我想交作业"、"待办有哪些"、"开始一人一题练习"、"我要提案例"——我会带你直达对应页面。',
  },
])
const input = ref('')
const sending = ref(false)
const listRef = ref()

const currentChapter = computed(
  () => COURSE.chapters.find((c) => c.status === '进行中')?.title || COURSE.chapters[0]?.title || '',
)
const studyMode = computed(() => {
  const value = Array.isArray(route.query.mode) ? route.query.mode[0] : route.query.mode
  return value === 'sprint' ? 'sprint' : 'course'
})

const recommendations = computed(() =>
  getDailyRecommendations(personaStore.data, currentChapter.value),
)

const knowledgeOn = computed(() => isEnabled('knowledgeBase'))

function useRecommendation(rec) {
  if (rec.to) router.push(rec.to)
  else ask(rec.text)
}

const disciplineTag = computed(() =>
  userStore.isStudent && userStore.discipline ? userStore.discipline : '',
)

function scrollToBottom() {
  nextTick(() => {
    const el = listRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function go(action) {
  if (action?.mobile) router.push(action.mobile)
}

async function ask(text) {
  const question = (text ?? input.value).trim()
  if (!question || sending.value) return

  messages.value.push({ role: 'user', content: question })
  input.value = ''
  sending.value = true
  scrollToBottom()

  // M1：本地意图规则优先命中，直接返回可点击操作卡片（不调用模型）
  const intent = matchIntent(question)
  if (intent) {
    const reply = { role: 'assistant', content: intent.reply }
    if (intent.dynamicTodos) reply.todos = buildTodoActions()
    if (intent.actions) reply.actions = intent.actions
    messages.value.push(reply)
    sending.value = false
    scrollToBottom()
    return
  }

  try {
    // 模型无记忆，每次携带完整对话历史（chat.js 内部会截取最近 20 条）
    const reply = await sendChat(messages.value, {
      useKnowledge: true,
      chapter: currentChapter.value,
      studyMode: studyMode.value,
      traceRefs: { chapter: currentChapter.value },
    })
    messages.value.push({ role: 'assistant', content: reply })
  } catch (err) {
    showToast(err.message || 'AI 助教暂时开小差了，请稍后再试')
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

// 从课程主页带问题过来：进入即发送
onMounted(() => {
  const q = String(route.query.q || '').trim()
  if (q) ask(q)
})
</script>

<template>
  <div class="ask-page">
    <div v-if="disciplineTag || knowledgeOn" class="discipline-tip">
      <span v-if="disciplineTag">学科背景：{{ disciplineTag }}（讲解将贴合你的背景）</span>
      <span v-if="knowledgeOn"> · 课程材料已接入</span>
    </div>
    <div ref="listRef" class="msg-list">
      <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
        <div class="bubble">
          <span class="bubble-text">{{ m.content }}</span>
          <div v-if="m.actions?.length" class="action-cards">
            <van-button
              v-for="a in m.actions"
              :key="a.label"
              size="small"
              type="primary"
              plain
              @click="go(a)"
            >
              {{ a.label }}
            </van-button>
          </div>
          <div v-if="m.todos?.length" class="action-cards">
            <van-button
              v-for="t in m.todos"
              :key="t.key"
              size="small"
              type="primary"
              plain
              @click="go(t)"
            >
              {{ t.label }}｜{{ t.desc }}
            </van-button>
          </div>
          <SpeakButton v-if="m.role === 'assistant'" :text="m.content" />
        </div>
      </div>
      <div v-if="sending" class="msg assistant">
        <div class="bubble typing">
          <van-loading size="16" /> 正在思考…
        </div>
      </div>
    </div>

    <div class="daily-reco">
      <div class="daily-head">
        <span>今天值得想一想</span>
        <span class="daily-sub">每天刷新</span>
      </div>
      <div
        v-for="r in recommendations"
        :key="r.id"
        class="daily-item"
        @click="useRecommendation(r)"
      >
        <div class="daily-text">{{ r.text }}</div>
        <div class="daily-reason">{{ r.reason }}</div>
      </div>
    </div>

    <div class="input-bar">
      <van-field
        v-model="input"
        placeholder="输入你的问题或指令…"
        class="input-field"
        @keyup.enter="ask()"
      />
      <van-button
        type="primary"
        size="small"
        icon="guide-o"
        :loading="sending"
        @click="ask()"
      />
    </div>
  </div>
</template>

<style scoped>
.ask-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 96px);
}

.discipline-tip {
  padding: 6px 12px 0;
  font-size: 12px;
  color: var(--text-sub);
}

.msg-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.msg {
  display: flex;
  margin-bottom: 12px;
}

.msg.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 82%;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.7;
  border-radius: 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  color: var(--text-main);
}

.bubble-text {
  white-space: pre-wrap;
}

.msg.user .bubble {
  color: var(--accent-on);
  background: var(--accent);
  border-color: var(--accent);
}

.action-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.typing {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-sub);
}

.daily-reco {
  padding: 0 12px 8px;
}

.daily-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.daily-sub {
  font-size: 10.5px;
  font-weight: 400;
  color: var(--text-faint);
}

.daily-item {
  padding: 9px 11px;
  margin-bottom: 6px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
}

.daily-text {
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--text-main);
}

.daily-reason {
  margin-top: 3px;
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--text-faint);
}

.input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--card-bg);
  border-top: 1px solid var(--border);
}

.input-field {
  flex: 1;
  padding: 6px 10px;
  background: var(--bg-page);
  border-radius: 18px;
}
</style>
