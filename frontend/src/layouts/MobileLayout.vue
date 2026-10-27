<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const themeStore = useThemeStore()

// 底部标签栏，与 /m 下的子路由一一对应
const tabs = [
  { path: '/m/course', name: '课程', icon: 'notes-o' },
  { path: '/m/ask', name: '答疑', icon: 'chat-o' },
  { path: '/m/mine', name: '我的', icon: 'user-o' },
]

const active = computed(() => tabs.findIndex((t) => t.path === route.path))

// 皮肤快捷切换：显示目标皮肤名，点击即切换（云课笺 ⇄ 墨读）
const switchLabel = computed(() => (themeStore.isMo ? '云课笺' : '墨读'))
</script>

<template>
  <div class="mobile-layout">
    <van-nav-bar :title="route.meta.title || '人机协同助学'" fixed placeholder>
      <template #right>
        <span class="theme-toggle" data-testid="theme-toggle" @click="themeStore.toggle()">
          {{ switchLabel }}
        </span>
      </template>
    </van-nav-bar>

    <div class="mobile-body">
      <router-view />
    </div>

    <van-tabbar :model-value="active" route fixed placeholder safe-area-inset-bottom>
      <van-tabbar-item v-for="t in tabs" :key="t.path" :to="t.path" :icon="t.icon">
        {{ t.name }}
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.mobile-layout {
  max-width: 480px;
  min-height: 100vh;
  margin: 0 auto;
  background: var(--bg-page);
  /* 桌面浏览器里预览 H5 时加个边框，方便区分 */
  box-shadow: 0 0 0 1px var(--border);
}

.mobile-body {
  padding-bottom: 8px;
}

/* 导航栏皮肤切换：小号描边胶囊，跟随主题色 */
.theme-toggle {
  display: inline-block;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-ui);
  letter-spacing: 1px;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-pill);
  cursor: pointer;
}

html[data-theme='mo'] .theme-toggle {
  border-radius: 3px;
}
</style>
