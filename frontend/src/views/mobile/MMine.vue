<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { useUserStore, DISCIPLINE_OPTIONS } from '@/stores/user'
import { COURSE } from '@/mock/data'

const router = useRouter()
const userStore = useUserStore()

const initial = computed(() => userStore.name.slice(0, 1))

const mockLabel = computed(() => (userStore.useMock ? '仿真数据模式' : '接口联调模式'))

// 学科背景设置（M5：决定 AI 出题与讲解的取材方向，学生自助维护）
const showDisciplinePicker = ref(false)
const isStudent = computed(() => userStore.role === 'student')

const disciplineLabel = computed(() => userStore.discipline || '未设置')

function onDisciplineConfirm({ selectedOptions }) {
  const value = selectedOptions[0]?.value
  if (value && value !== userStore.discipline) {
    userStore.setDiscipline(value)
    showToast(`学科背景已设置为「${value}」，AI 将按此调整案例取材`)
  }
  showDisciplinePicker.value = false
}

const tools = [
  { title: '一人一题练习', desc: 'AI 出题 · 三维反馈', path: '/m/practice', icon: 'edit' },
  { title: '课前案例', desc: '提交兴趣案例 · 老师选用', path: '/m/case', icon: 'description' },
  { title: '课程考核', desc: 'AI 模拟面试题', path: '/m/assessment', icon: 'aim' },
  { title: 'AI 答疑', desc: '小管同学在线解答', path: '/m/ask', icon: 'chat' },
]

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

    <van-cell-group inset title="学习工具">
      <van-cell
        v-for="t in tools"
        :key="t.path"
        :title="t.title"
        :label="t.desc"
        is-link
        :to="t.path"
      >
        <template #icon>
          <van-icon :name="t.icon" class="tool-icon" />
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group v-if="isStudent" inset title="学科背景">
      <van-cell
        title="我的学科背景"
        :value="disciplineLabel"
        is-link
        @click="showDisciplinePicker = true"
      >
        <template #label>
          <span class="discipline-desc">
            决定 AI 出题与讲解的案例取材方向（工科类将获得工程管理场景案例）
          </span>
        </template>
      </van-cell>
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

    <van-popup v-model:show="showDisciplinePicker" position="bottom">
      <van-picker
        :columns="DISCIPLINE_OPTIONS"
        :model-value="[userStore.discipline || DISCIPLINE_OPTIONS[0]]"
        @confirm="onDisciplineConfirm"
        @cancel="showDisciplinePicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped>
.tool-icon {
  margin-right: 8px;
  color: var(--brand);
}

.discipline-desc {
  font-size: 11px;
  color: var(--text-sub);
  white-space: normal;
}

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
