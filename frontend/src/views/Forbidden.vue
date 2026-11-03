<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

function goBack() {
  router.push(userStore.role === 'student' ? '/app/course' : '/app/console')
}
</script>

<template>
  <div class="forbidden">
    <div class="forbidden-box hud-corners">
      <p class="forbidden-kicker">ERR-403 · ACCESS DENIED</p>
      <el-result icon="warning" title="403" sub-title="当前角色没有访问该页面的权限">
        <template #extra>
          <p class="text-sub">
            你的身份是「{{ userStore.roleLabel }}」。教师主控台与学情统计仅对教师、助教和管理员开放。
          </p>
          <el-button type="primary" @click="goBack">返回可用页面</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<style scoped>
.forbidden {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--page-bg);
}

.forbidden-box {
  position: relative;
  width: 100%;
  max-width: 560px;
  padding: 40px 32px;
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
}

/* HUD 角标 */
.forbidden-box.hud-corners::before,
.forbidden-box.hud-corners::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border: 0 solid var(--accent);
  pointer-events: none;
}

.forbidden-box.hud-corners::before {
  top: -1px;
  left: -1px;
  border-top-width: 2px;
  border-left-width: 2px;
}

.forbidden-box.hud-corners::after {
  bottom: -1px;
  right: -1px;
  border-bottom-width: 2px;
  border-right-width: 2px;
}

.forbidden-kicker {
  margin: 0 0 8px;
  color: var(--danger);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2px;
  text-align: center;
}

@media (max-width: 480px) {
  .forbidden-box {
    padding: 28px 20px;
  }
}
</style>
