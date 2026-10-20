<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 底部标签栏，与 /m 下的子路由一一对应
const tabs = [
  { path: '/m/course', name: '课程', icon: 'notes-o' },
  { path: '/m/ask', name: '答疑', icon: 'chat-o' },
  { path: '/m/mine', name: '我的', icon: 'user-o' },
]

const active = computed(() => tabs.findIndex((t) => t.path === route.path))
</script>

<template>
  <div class="mobile-layout">
    <van-nav-bar :title="route.meta.title || '人机协同助学'" fixed placeholder />

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
</style>
