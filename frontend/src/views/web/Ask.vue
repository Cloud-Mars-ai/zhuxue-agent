<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useModelStore } from '@/stores/model'
import { useUserStore } from '@/stores/user'
import { sendChat } from '@/api/chat'
import { matchIntent, buildTodoActions } from '@/utils/intent'

const router = useRouter()
const modelStore = useModelStore()
const userStore = useUserStore()

// 主动问候：进入答疑页即展示欢迎语与推荐操作
const WELCOME = {
  role: 'assistant',
  content:
    '你好，我是小管同学，《管理学》课程的人机协同助学助手。\n' +
    '可以直接向我提问知识点；也可以直接对我说："我想交作业"、"待办有哪些"、"开始一人一题练习"、"我要提案例"——我会带你直达对应页面。',
}

const messages = ref([WELCOME])
const input = ref('')
const sending = ref(false)
const listRef = ref()

const suggestions = [
  '待办有哪些',
  '我想交作业',
  '开始一人一题练习',
  '什么是有限理性决策？',
]

const isConfigured = computed(() => modelStore.isConfigured)
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
  if (action?.to) router.push(action.to)
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
    ElMessage.error(err.message || 'AI 助教暂时无法回答，请稍后再试')
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

function clearChat() {
  messages.value = [WELCOME]
}

function handleEnter(e) {
  // Enter 发送，Shift+Enter 换行
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    ask()
  }
}
</script>

<template>
  <div class="ask-page">
    <div class="ask-toolbar">
      <span class="model-tag">
        当前模型：
        <el-tag size="small" type="success" effect="plain">{{ modelStore.config.model }}</el-tag>
        <el-tag v-if="disciplineTag" size="small" type="info" effect="plain" class="ml8">
          学科背景：{{ disciplineTag }}
        </el-tag>
      </span>
      <el-button text type="primary" @click="clearChat">清空对话</el-button>
    </div>

    <el-alert v-if="!isConfigured" type="warning" :closable="false" show-icon class="config-tip">
      <template #title>
        尚未完成模型配置，
        <el-link type="primary" :underline="false" @click="router.push('/model')">
          去「模型接入」页面配置
        </el-link>
        （意图跳转与待办查询不受影响）
      </template>
    </el-alert>

    <div ref="listRef" class="msg-list">
      <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
        <div class="bubble">
          <span class="bubble-text">{{ m.content }}</span>
          <div v-if="m.actions?.length" class="action-cards">
            <el-button
              v-for="a in m.actions"
              :key="a.label"
              size="small"
              type="primary"
              plain
              @click="go(a)"
            >
              {{ a.label }}
            </el-button>
          </div>
          <div v-if="m.todos?.length" class="action-cards">
            <el-button
              v-for="t in m.todos"
              :key="t.key"
              size="small"
              type="primary"
              plain
              @click="go(t)"
            >
              {{ t.label }}｜{{ t.desc }}
            </el-button>
          </div>
        </div>
      </div>
      <div v-if="sending" class="msg assistant">
        <div class="bubble typing">
          <span class="dot" /><span class="dot" /><span class="dot" />
          正在思考…
        </div>
      </div>
    </div>

    <div class="suggest">
      <span class="suggest-label">试试说：</span>
      <el-tag
        v-for="s in suggestions"
        :key="s"
        class="suggest-tag"
        effect="plain"
        @click="ask(s)"
      >
        {{ s }}
      </el-tag>
    </div>

    <div class="input-bar">
      <el-input
        v-model="input"
        type="textarea"
        :rows="2"
        resize="none"
        placeholder="输入你的问题或指令，Enter 发送，Shift+Enter 换行"
        @keydown="handleEnter"
      />
      <el-button
        type="primary"
        class="send-btn"
        :loading="sending"
        :disabled="!input.trim()"
        @click="ask()"
      >
        发送
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.ask-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 96px);
}

.ask-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.model-tag {
  font-size: 13px;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  gap: 6px;
}

.ml8 {
  margin-left: 8px;
}

.config-tip {
  margin-bottom: 12px;
}

.msg-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 2px 12px;
}

.msg {
  display: flex;
  margin-bottom: 12px;
}

.msg.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 72%;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.8;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--border);
}

.bubble-text {
  white-space: pre-wrap;
}

.msg.user .bubble {
  color: #fff;
  background: var(--brand);
  border-color: var(--brand);
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

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand);
  animation: blink 1.2s infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%,
  60%,
  100% {
    opacity: 0.25;
  }
  30% {
    opacity: 1;
  }
}

.suggest {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.suggest-label {
  font-size: 13px;
  color: var(--text-sub);
}

.suggest-tag {
  cursor: pointer;
}

.input-bar {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.send-btn {
  flex-shrink: 0;
}
</style>
