<script setup>
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  useModelStore,
  DEFAULT_MODEL_CONFIG,
  STEPFUN_MODELS,
} from '@/stores/model'
import { sendChat } from '@/api/chat'

const modelStore = useModelStore()

const form = reactive({
  provider: 'stepfun',
  baseUrl: '',
  apiKey: '',
  model: '',
  temperature: 0.3,
  systemPrompt: '',
})

function loadForm() {
  const c = modelStore.config
  form.provider = c.provider || 'stepfun'
  form.baseUrl = c.baseUrl
  form.apiKey = c.apiKey
  form.model = c.model
  form.temperature = Number(c.temperature)
  form.systemPrompt = c.systemPrompt
}
loadForm()

const providerOptions = [
  { value: 'stepfun', label: '阶跃星辰 StepFun（默认）' },
  { value: 'custom', label: '自定义 / 其他 OpenAI 兼容服务' },
]

const providerLabels = {
  stepfun: '阶跃星辰 StepFun',
  custom: '自定义服务',
}

// 阶跃星辰给出下拉候选，自定义服务时改为手动输入
const modelOptions = computed(() =>
  form.provider === 'stepfun' ? STEPFUN_MODELS.map((m) => ({ value: m, label: m })) : [],
)

const maskedKey = computed(() => {
  const key = modelStore.config.apiKey || ''
  if (!key) return '未配置'
  if (key.length <= 8) return '****'
  return `${key.slice(0, 3)}****${key.slice(-4)}`
})

const showKey = ref(false)
const testing = ref(false)
const testResult = ref('')

function handleProviderChange(val) {
  if (val === 'stepfun') {
    form.baseUrl = DEFAULT_MODEL_CONFIG.baseUrl
    if (!STEPFUN_MODELS.includes(form.model)) {
      form.model = DEFAULT_MODEL_CONFIG.model
    }
  }
}

async function handleTest() {
  if (!form.apiKey?.trim()) {
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

function handleSave() {
  if (!form.baseUrl?.trim()) {
    ElMessage.warning('请填写接口地址')
    return
  }
  if (!form.apiKey?.trim()) {
    ElMessage.warning('请填写 API 密钥')
    return
  }
  if (!form.model?.trim()) {
    ElMessage.warning('请填写模型名称')
    return
  }
  modelStore.updateConfig({ ...form })
  ElMessage.success('配置已保存，AI 助教将使用该模型')
}

function handleReset() {
  modelStore.resetConfig()
  loadForm()
  testResult.value = ''
  ElMessage.success('已恢复并保存默认配置（阶跃星辰）')
}
</script>

<template>
  <div class="model-settings">
    <el-alert type="info" :closable="false" show-icon class="tip">
      <template #title>
        配置大模型后，「AI 答疑 / AI 助教」等智能体功能将调用该模型生成回答。
        默认使用阶跃星辰（StepFun）的 OpenAI 兼容接口；密钥仅保存在当前浏览器本地，不会上传到任何服务器。
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
          <el-input v-model="form.baseUrl" placeholder="https://api.stepfun.com/v1" />
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
            阶跃星辰常用：step-3.5-flash（快）、step-3.7-flash、step-5-preview（百万上下文）等
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

        <el-form-item>
          <el-button type="primary" @click="handleSave">保存配置</el-button>
          <el-button @click="handleReset">恢复默认</el-button>
          <el-button :loading="testing" @click="handleTest">测试连接</el-button>
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
