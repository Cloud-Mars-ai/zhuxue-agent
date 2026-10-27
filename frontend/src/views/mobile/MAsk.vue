<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { sendChat } from '@/api/chat'
import { matchIntent, buildTodoActions } from '@/utils/intent'

const router = useRouter()
const userStore = useUserStore()

// 主动问候：进入答疑页即展示欢迎语与推荐操作
const messages = ref([
  {
    role: 'assistant',
    content:
      '你好，我是小管同学，《管理学》课程的人机协同助学助手。\n' +
      '可以直接向我提问知识点；也可以直接对我说："我想交作业"、"待办有哪些"、"开始一人一题练习"、"我要提案例"——我会带你直达对应页面。',
  },
])
const input = ref('')
const sending = ref(false)
const listRef = ref()

const suggestions = ['待办有哪些', '我想交作业', '开始一人一题练习', '什么是有限理性决策？']

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
    const reply = await sendChat(messages.value)
    messages.value.push({ role: 'assistant', content: reply })
  } catch (err) {
    showToast(err.message || 'AI 助教暂时开小差了，请稍后再试')
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

function useSuggestion(s) {
  ask(s)
}
</script>

<template>
  <div class="ask-page">
    <div v-if="disciplineTag" class="discipline-tip">学科背景：{{ disciplineTag }}（讲解将贴合你的背景）</div>
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
        </div>
      </div>
      <div v-if="sending" class="msg assistant">
        <div class="bubble typing">
          <van-loading size="16" /> 正在思考…
        </div>
      </div>
    </div>

    <div class="suggest">
      <van-tag
        v-for="s in suggestions"
        :key="s"
        plain
        type="primary"
        class="suggest-tag"
        @click="useSuggestion(s)"
      >
        {{ s }}
      </van-tag>
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

.suggest {
  display: flex;
  gap: 8px;
  padding: 0 12px 8px;
  overflow-x: auto;
}

.suggest-tag {
  flex-shrink: 0;
  padding: 5px 10px;
  cursor: pointer;
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
