<script setup>
import { ref, nextTick } from 'vue'
import { showToast } from 'vant'
import { CHAT_SAMPLE } from '@/mock/data'

const messages = ref([...CHAT_SAMPLE])
const input = ref('')
const sending = ref(false)
const listRef = ref()

const suggestions = [
  '什么是有限理性决策？',
  '职能制和事业部制的区别？',
  '帮我梳理第3章知识框架',
]

function scrollToBottom() {
  nextTick(() => {
    const el = listRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function ask(text) {
  const question = (text ?? input.value).trim()
  if (!question || sending.value) return

  messages.value.push({ role: 'user', content: question })
  input.value = ''
  sending.value = true
  scrollToBottom()

  // 联调阶段：模拟 AI 响应延迟，接口就绪后改为调用 /agent/chat
  setTimeout(() => {
    messages.value.push({
      role: 'assistant',
      content:
        '（仿真回复）后端智能体接口尚未接入。接入后此处会返回基于《管理学》教材知识库的解答，并附带出处页码。\n\n对接方式：把本文件的 setTimeout 替换为 post(\'/agent/chat\', { question })。',
    })
    sending.value = false
    scrollToBottom()
  }, 700)
}

function useSuggestion(s) {
  ask(s)
}
</script>

<template>
  <div class="ask-page">
    <div ref="listRef" class="msg-list">
      <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
        <div class="bubble">
          <span class="bubble-text">{{ m.content }}</span>
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
        placeholder="输入你的问题…"
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
  background: #fff;
}

.bubble-text {
  white-space: pre-wrap;
}

.msg.user .bubble {
  color: #fff;
  background: var(--brand);
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
  background: #fff;
  border-top: 1px solid var(--border);
}

.input-field {
  flex: 1;
  padding: 6px 10px;
  background: var(--bg-page);
  border-radius: 18px;
}
</style>
