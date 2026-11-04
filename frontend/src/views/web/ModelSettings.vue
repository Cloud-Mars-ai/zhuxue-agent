<script setup>
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  useModelStore,
  DEFAULT_MODEL_CONFIG,
  DEEPSEEK_MODELS,
  STEPFUN_MODELS,
  STEPFUN_TTS_MODELS,
} from '@/stores/model'
import { useVoiceStore, VOICE_PRESETS } from '@/stores/voice'
import { sendChat } from '@/api/chat'
import { playSpeech } from '@/api/tts'

const modelStore = useModelStore()
const voiceStore = useVoiceStore()

const form = reactive({
  provider: 'deepseek',
  baseUrl: '',
  apiKey: '',
  model: '',
  temperature: 0.3,
  systemPrompt: '',
  ttsBaseUrl: '',
  ttsApiKey: '',
  ttsModel: '',
  ttsVoice: '',
  ttsSpeed: 0.98,
  ttsInstruction: '',
})

function loadForm() {
  const c = modelStore.config
  form.provider = c.provider || 'deepseek'
  form.baseUrl = c.baseUrl
  form.apiKey = c.apiKey
  form.model = c.model
  form.temperature = Number(c.temperature)
  form.systemPrompt = c.systemPrompt
  form.ttsBaseUrl = c.ttsBaseUrl || DEFAULT_MODEL_CONFIG.ttsBaseUrl
  form.ttsApiKey = c.ttsApiKey || ''
  form.ttsModel = c.ttsModel || DEFAULT_MODEL_CONFIG.ttsModel
  form.ttsVoice = c.ttsVoice || DEFAULT_MODEL_CONFIG.ttsVoice
  form.ttsSpeed = Number(c.ttsSpeed) || voiceStore.speed
  form.ttsInstruction = c.ttsInstruction || DEFAULT_MODEL_CONFIG.ttsInstruction
}
loadForm()

const providerOptions = [
  { value: 'deepseek', label: 'DeepSeek（默认）' },
  { value: 'stepfun', label: '阶跃星辰 StepFun' },
  { value: 'custom', label: '自定义 / 其他 OpenAI 兼容服务' },
]

const providerLabels = {
  deepseek: 'DeepSeek',
  stepfun: '阶跃星辰 StepFun',
  custom: '自定义服务',
}

// 阶跃星辰给出下拉候选，自定义服务时改为手动输入
const modelOptions = computed(() =>
  form.provider === 'deepseek'
    ? DEEPSEEK_MODELS.map((m) => ({ value: m, label: m }))
    : form.provider === 'stepfun'
      ? STEPFUN_MODELS.map((m) => ({ value: m, label: m }))
      : [],
)

const maskedKey = computed(() => {
  if (modelStore.serverProxyActive && !modelStore.config.apiKey) {
    return '服务端环境变量托管'
  }
  const key = modelStore.config.apiKey || ''
  if (!key) return '未配置'
  if (key.length <= 8) return '****'
  return `${key.slice(0, 3)}****${key.slice(-4)}`
})

const maskedTtsKey = computed(() => {
  if (modelStore.serverProxyActive && !modelStore.config.ttsApiKey) {
    return '服务端环境变量托管'
  }
  const key = modelStore.config.ttsApiKey || ''
  if (!key) return '未配置'
  if (key.length <= 8) return '****'
  return `${key.slice(0, 3)}****${key.slice(-4)}`
})

const showKey = ref(false)
const testing = ref(false)
const testResult = ref('')
const testingTts = ref(false)

function handleProviderChange(val) {
  if (val === 'deepseek') {
    form.baseUrl = 'https://api.deepseek.com/v1'
    if (!DEEPSEEK_MODELS.includes(form.model)) form.model = 'deepseek-chat'
  } else if (val === 'stepfun') {
    form.baseUrl = 'https://api.stepfun.com/v1'
    if (!STEPFUN_MODELS.includes(form.model)) {
      form.model = 'step-3.5-flash'
    }
  }
}

function handleVoiceChange(value) {
  form.ttsVoice = value
  const preset = VOICE_PRESETS.find((voice) => voice.id === value)
  if (preset) form.ttsInstruction = preset.instruction
}

async function handleTest() {
  if (!form.apiKey?.trim() && !modelStore.serverProxyActive) {
    ElMessage.warning('请先填写 API 密钥')
    return
  }
  if (!form.baseUrl?.trim() || !form.model?.trim()) {
    ElMessage.warning('请先填写接口地址和模型名称')
    return
  }

  testing.value = true
  testResult.value = ''
  try {
    // 用表单中的当前值测试，不必先保存
    const reply = await sendChat(
      [{ role: 'user', content: '你好，请用一句话介绍你自己。' }],
      { config: { ...form }, timeout: 45000 },
    )
    testResult.value = reply
    ElMessage.success('连接成功，模型返回正常')
  } catch (err) {
    testResult.value = ''
    ElMessage.error(err.message || '连接失败')
  } finally {
    testing.value = false
  }
}

async function handleTestTts() {
  if (
    (!form.ttsApiKey?.trim() && !modelStore.serverProxyActive) ||
    !form.ttsBaseUrl?.trim() ||
    !form.ttsModel?.trim()
  ) {
    ElMessage.warning('请先填写语音接口地址、模型和密钥')
    return
  }
  testingTts.value = true
  try {
    await playSpeech('你好，我是课程助学助手，语音连接正常。', {
      config: {
        ...form,
        apiKey: form.apiKey,
      },
    })
    ElMessage.success('语音连接成功，正在播放测试音频')
  } catch (err) {
    ElMessage.error(err.message || '语音连接失败')
  } finally {
    testingTts.value = false
  }
}

function handleSave() {
  if (!form.baseUrl?.trim()) {
    ElMessage.warning('请填写接口地址')
    return
  }
  if (!form.apiKey?.trim() && !modelStore.serverProxyActive) {
    ElMessage.warning('请填写 API 密钥')
    return
  }
  if (!form.model?.trim()) {
    ElMessage.warning('请填写模型名称')
    return
  }
  if (
    !form.ttsBaseUrl?.trim() ||
    (!form.ttsApiKey?.trim() && !modelStore.serverProxyActive) ||
    !form.ttsModel?.trim()
  ) {
    ElMessage.warning('请补全语音合成配置')
    return
  }
  modelStore.updateConfig({ ...form })
  voiceStore.setVoice(form.ttsVoice)
  voiceStore.setSpeed(form.ttsSpeed)
  ElMessage.success('配置已保存，AI 助教将使用该模型')
}

function handleReset() {
  modelStore.resetConfig()
  loadForm()
  testResult.value = ''
  ElMessage.success('已恢复并保存默认配置（DeepSeek + StepAudio）')
}
</script>

<template>
  <div class="model-settings">
    <el-alert type="info" :closable="false" show-icon class="tip">
      <template #title>
        配置大模型后，「AI协助 / AI 助教」等智能体功能将调用该模型生成回答。
        默认使用 DeepSeek 的 OpenAI 兼容接口，语音合成继续使用 StepAudio。
        生产环境由同源 Node 代理读取服务端环境变量，密钥不会进入前端构建；开发环境可临时使用本机配置。
      </template>
    </el-alert>

    <el-card shadow="never" class="current">
      <template #header><span>当前生效配置</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="服务商">
          {{ providerLabels[modelStore.config.provider] || modelStore.config.provider }}
        </el-descriptions-item>
        <el-descriptions-item label="模型">
          {{ modelStore.config.model || '未配置' }}
        </el-descriptions-item>
        <el-descriptions-item label="接口地址">
          {{ modelStore.config.baseUrl || '未配置' }}
        </el-descriptions-item>
        <el-descriptions-item label="密钥">{{ maskedKey }}</el-descriptions-item>
        <el-descriptions-item label="语音模型">
          {{ modelStore.config.ttsModel || '未配置' }}
        </el-descriptions-item>
        <el-descriptions-item label="语音密钥">{{ maskedTtsKey }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never">
      <template #header><span>模型配置</span></template>
      <el-form :model="form" label-width="96px" class="form">
        <el-form-item label="服务商">
          <el-select v-model="form.provider" style="width: 100%" @change="handleProviderChange">
            <el-option
              v-for="o in providerOptions"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="接口地址">
          <el-input v-model="form.baseUrl" placeholder="https://api.deepseek.com/v1" />
          <div class="form-help">OpenAI 兼容接口地址，无需携带 /chat/completions 后缀</div>
        </el-form-item>

        <el-form-item label="模型名称">
          <el-select
            v-model="form.model"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入模型名称"
            style="width: 100%"
          >
            <el-option
              v-for="m in modelOptions"
              :key="m.value"
              :label="m.label"
              :value="m.value"
            />
          </el-select>
          <div class="form-help">
            DeepSeek 默认使用 deepseek-chat（速度与质量平衡）；需要深度推理时可切换 deepseek-reasoner
          </div>
        </el-form-item>

        <el-form-item label="API 密钥">
          <el-input v-model="form.apiKey" :type="showKey ? 'text' : 'password'" placeholder="sk-...">
            <template #append>
              <el-button @click="showKey = !showKey">{{ showKey ? '隐藏' : '显示' }}</el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="温度">
          <el-slider
            v-model="form.temperature"
            :min="0"
            :max="1"
            :step="0.1"
            show-input
            class="slider"
          />
          <div class="form-help">越低回答越稳定严谨，越高越发散灵活</div>
        </el-form-item>

        <el-form-item label="助教人设">
          <el-input
            v-model="form.systemPrompt"
            type="textarea"
            :rows="8"
            placeholder="系统提示词（System Prompt），定义 AI 助教的角色与回答风格"
          />
        </el-form-item>

        <el-divider content-position="left">语音合成 · StepAudio</el-divider>

        <el-form-item label="接口地址">
          <el-input v-model="form.ttsBaseUrl" placeholder="https://api.stepfun.com/v1" />
        </el-form-item>

        <el-form-item label="语音模型">
          <el-select
            v-model="form.ttsModel"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option
              v-for="m in STEPFUN_TTS_MODELS"
              :key="m"
              :label="m"
              :value="m"
            />
          </el-select>
          <div class="form-help">StepAudio 3 TTS 模型 ID：stepaudio-3-tts</div>
        </el-form-item>

        <el-form-item label="音色">
          <el-select v-model="form.ttsVoice" style="width: 100%" @change="handleVoiceChange">
            <el-option
              v-for="voice in VOICE_PRESETS"
              :key="voice.id"
              :label="`${voice.name} · ${voice.desc}`"
              :value="voice.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="语速">
          <el-slider
            v-model="form.ttsSpeed"
            :min="0.8"
            :max="1.15"
            :step="0.01"
            show-input
            class="slider"
          />
        </el-form-item>

        <el-form-item label="语音密钥">
          <el-input v-model="form.ttsApiKey" :type="showKey ? 'text' : 'password'" placeholder="语音模型 API Key">
            <template #append>
              <el-button @click="showKey = !showKey">{{ showKey ? '隐藏' : '显示' }}</el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="朗读指导">
          <el-input
            v-model="form.ttsInstruction"
            type="textarea"
            :rows="3"
            placeholder="例如：清晰、温和、有节奏的课堂讲解语气"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSave">保存配置</el-button>
          <el-button @click="handleReset">恢复默认</el-button>
          <el-button :loading="testing" @click="handleTest">测试连接</el-button>
          <el-button :loading="testingTts" @click="handleTestTts">测试语音</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="testing || testResult" shadow="never">
      <template #header><span>测试结果</span></template>
      <div v-if="testing" class="testing">正在请求模型，请稍候…</div>
      <div v-else class="test-result">{{ testResult }}</div>
    </el-card>
  </div>
</template>

<style scoped>
.model-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 860px;
}

.tip :deep(.el-alert__title) {
  line-height: 1.7;
}

.form {
  max-width: 720px;
}

.form-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-sub);
}

.slider {
  max-width: 460px;
}

.testing {
  color: var(--text-sub);
}

.test-result {
  white-space: pre-wrap;
  line-height: 1.8;
}
</style>
