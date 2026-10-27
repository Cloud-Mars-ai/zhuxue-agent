<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

// 只展示当前角色有权访问的菜单项
const menus = computed(() => {
  const webRoot = router.options.routes.find((r) => r.path === '/')
  return (webRoot?.children || [])
    .filter((child) => {
      const allowed = child.meta?.roles
      return !allowed || allowed.includes(userStore.role)
    })
    .map((child) => ({
      index: `/${child.path}`,
      title: child.meta.title,
      icon: child.meta.icon,
    }))
})

const activeMenu = computed(() => route.path)

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    })
    userStore.logout()
    router.push({ name: 'Login' })
  } catch {
    // 用户取消，无需处理
  }
}
</script>

<template>
  <el-container class="web-layout">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <span class="logo-mark">智</span>
        <span class="logo-text">人机协同助学</span>
      </div>
      <el-menu :default-active="activeMenu" router class="menu">
        <el-menu-item v-for="m in menus" :key="m.index" :index="m.index">
          <el-icon v-if="m.icon"><component :is="m.icon" /></el-icon>
          <span>{{ m.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-title">{{ route.meta.title }}</div>
        <div class="header-right">
          <el-tooltip :content="`切换到${themeStore.isMo ? '云课笺' : '墨读'}皮肤`" placement="bottom">
            <el-button
              size="small"
              round
              data-testid="web-theme-toggle"
              @click="themeStore.toggle()"
            >
              {{ themeStore.isMo ? '云课笺' : '墨读' }}
            </el-button>
          </el-tooltip>
          <el-link :underline="false" class="text-sub" @click="router.push('/m/course')">
            切换 H5 移动端
          </el-link>
          <el-divider direction="vertical" />
          <el-tag size="small" type="success" effect="plain">
            {{ userStore.roleLabel }}
          </el-tag>
          <el-dropdown>
            <span class="user-name">
              {{ userStore.name }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.web-layout {
  height: 100vh;
}

.aside {
  background: #fff;
  border-right: 1px solid var(--border);
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 60px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border);
}

.logo-mark {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--brand);
  color: #fff;
  font-weight: 600;
}

.logo-text {
  font-size: 15px;
  font-weight: 600;
}

.menu {
  border-right: none;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  background: #fff;
  border-bottom: 1px solid var(--border);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
}

.main {
  background: var(--bg-page);
  padding: 16px;
  overflow-y: auto;
}
</style>
