<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

function goBack() {
  router.push(userStore.role === 'student' ? '/course' : '/console')
}
</script>

<template>
  <div class="forbidden">
    <el-result icon="warning" title="403" sub-title="当前角色没有访问该页面的权限">
      <template #extra>
        <p class="text-sub">
          你的身份是「{{ userStore.roleLabel }}」。教师主控台与学情统计仅对教师、助教和管理员开放。
        </p>
        <el-button type="primary" @click="goBack">返回可用页面</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped>
.forbidden {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px;
  background: #fff;
}
</style>
