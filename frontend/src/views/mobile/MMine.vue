<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { COURSE } from '@/mock/data'

const router = useRouter()
const userStore = useUserStore()

const initial = computed(() => userStore.name.slice(0, 1))

const mockLabel = computed(() => (userStore.useMock ? '仿真数据模式' : '接口联调模式'))

async function handleLogout() {
  try {
    await showConfirmDialog({ title: '提示', message: '确定要退出登录吗？' })
    userStore.logout()
    router.push({ name: 'Login' })
  } catch {
    // 用户取消
  }
}

function toggleMock() {
  userStore.setMockMode(!userStore.useMock)
  showToast(userStore.useMock ? '已切换到仿真数据模式' : '已切换到接口联调模式')
}
</script>

<template>
  <div>
    <div class="m-profile">
      <div class="avatar">{{ initial }}</div>
      <div class="profile-text">
        <h3>{{ userStore.name }}</h3>
        <p>{{ userStore.roleLabel }} · {{ userStore.user?.id }}</p>
      </div>
    </div>

    <van-cell-group inset title="我的课程">
      <van-cell title="课程名称" :value="COURSE.name" />
      <van-cell title="任课教师" :value="COURSE.teacher" />
      <van-cell title="学期" :value="COURSE.term" />
    </van-cell-group>

    <van-cell-group inset title="设置">
      <van-cell title="数据模式" :label="mockLabel" is-link @click="toggleMock">
        <template #value>
          <van-switch
            :model-value="!userStore.useMock"
            size="20"
            @click.stop="toggleMock"
          />
        </template>
      </van-cell>
      <van-cell title="切换到 Web 端" is-link @click="router.push('/course')" />
      <van-cell title="关于系统" value="v0.1.0 竞赛演示版" />
    </van-cell-group>

    <div class="logout-wrap">
      <van-button block type="danger" plain @click="handleLogout">退出登录</van-button>
    </div>
  </div>
</template>

<style scoped>
.m-profile {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 16px;
  color: #fff;
  background: linear-gradient(135deg, #2f6feb, #5b8def);
}

.avatar {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  font-size: 22px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
}

.profile-text h3 {
  margin: 0 0 4px;
  font-size: 18px;
}

.profile-text p {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
}

.logout-wrap {
  padding: 20px 16px;
}
</style>
