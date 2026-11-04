<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useDeviceStore } from '@/stores/device'
import { useThemeStore } from '@/stores/theme'
import { MOCK_USERS } from '@/mock/data'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const deviceStore = useDeviceStore()
const themeStore = useThemeStore()

const formRef = ref()
const loading = ref(false)
// 默认入口按检测到的设备类型预选：手机 → H5，平板 / 桌面 → Web（用户仍可手动改）
const target = ref(deviceStore.isPhone ? 'mobile' : 'web')

const form = reactive({ username: '', password: '' })

const rules = {
  username: [{ required: true, message: '请输入学号或工号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

// 演示用快捷登录，点击直接填入对应角色账号
function quickFill(username) {
  form.username = username
  form.password = '123456'
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.loginByUsername(form.username, form.password)
    themeStore.applyRoleDefault(userStore.role)
    ElMessage.success(`欢迎回来，${userStore.name}`)

    const redirect = route.query.redirect
    if (redirect) {
      router.push(redirect)
    } else {
      router.push(target.value === 'mobile' ? '/m/course' : '/app/course')
    }
  } catch (err) {
    ElMessage.error(err.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-box hud-corners">
      <p class="login-kicker">AUTH · 演示模式</p>
      <div class="login-head">
        <div class="brand">
          <span class="brand-mark">智</span>
          <div>
            <h1>人机协同助学智能体</h1>
            <p class="text-sub">面向经管课程全教学周期 · 《管理学》</p>
          </div>
        </div>
      </div>

      <el-alert type="info" :closable="false" class="mock-tip">
        当前为<strong>仿真数据模式</strong>，可直接用下方演示账号登录，无需后端服务。
      </el-alert>

      <el-form ref="formRef" :model="form" :rules="rules" size="large" @submit.prevent>
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="学号 / 工号" clearable>
            <template #prefix><el-icon><User /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            show-password
            @keyup.enter="handleSubmit"
          >
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>

          <el-form-item label="登录后进入">
            <el-radio-group v-model="target">
              <el-radio-button value="web">Web 端</el-radio-button>
              <el-radio-button value="mobile">H5 移动端</el-radio-button>
            </el-radio-group>
            <div class="text-sub device-hint">
              已识别到{{ deviceStore.label }}访问，自动选择入口，可手动更改
            </div>
          </el-form-item>

        <el-button type="primary" size="large" class="submit" :loading="loading" @click="handleSubmit">
          登录
        </el-button>
      </el-form>

      <div class="demo-accounts">
        <p class="text-sub">演示账号（密码均为 123456）</p>
        <div class="account-list">
          <el-tag
            v-for="u in MOCK_USERS"
            :key="u.username"
            class="account-tag"
            effect="plain"
            @click="quickFill(u.username)"
          >
            {{ u.name }} · {{ u.username }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--login-bg);
}

/* 运行台网格底纹：径向遮罩自然消退 */
.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: 48px 48px;
  -webkit-mask-image: radial-gradient(720px 480px at 50% 40%, #000 0%, transparent 78%);
  mask-image: radial-gradient(720px 480px at 50% 40%, #000 0%, transparent 78%);
}

.login-box {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 32px 28px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

/* HUD 角标 */
.login-box.hud-corners::before,
.login-box.hud-corners::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border: 0 solid var(--accent);
  pointer-events: none;
}

.login-box.hud-corners::before {
  top: -1px;
  left: -1px;
  border-top-width: 2px;
  border-left-width: 2px;
}

.login-box.hud-corners::after {
  bottom: -1px;
  right: -1px;
  border-bottom-width: 2px;
  border-right-width: 2px;
}

.login-kicker {
  margin: 0 0 16px;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: var(--accent-on);
  font-size: 20px;
  font-weight: 600;
  box-shadow: var(--glow-accent);
}

.brand h1 {
  margin: 0;
  font-size: 19px;
}

.brand p {
  margin: 2px 0 0;
}

.mock-tip {
  margin-bottom: 20px;
}

.submit {
  width: 100%;
}

.device-hint {
  margin-top: 4px;
  line-height: 1.5;
}

.demo-accounts {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed var(--border);
}

.demo-accounts p {
  margin: 0 0 10px;
}

.account-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.account-tag {
  cursor: pointer;
}

@media (max-width: 480px) {
  .login-box {
    padding: 24px 18px;
  }
}
</style>
