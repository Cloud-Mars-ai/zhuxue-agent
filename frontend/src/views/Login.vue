<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { MOCK_USERS } from '@/mock/data'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const target = ref('web') // web | mobile，登录后跳转的端

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
    ElMessage.success(`欢迎回来，${userStore.name}`)

    const redirect = route.query.redirect
    if (redirect) {
      router.push(redirect)
    } else {
      router.push(target.value === 'mobile' ? '/m/course' : '/course')
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
    <div class="login-box">
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
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #2f6feb 0%, #6f9ef5 50%, #eaf1ff 100%);
}

.login-box {
  width: 100%;
  max-width: 420px;
  padding: 32px 28px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
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
  border-radius: 10px;
  background: var(--brand);
  color: #fff;
  font-size: 20px;
  font-weight: 600;
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
