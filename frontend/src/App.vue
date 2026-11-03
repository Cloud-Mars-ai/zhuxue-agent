<script setup>
// 根组件只负责渲染当前路由页面，布局由各 Layout 组件承担
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'
import { mapPathToTree } from './router'

const route = useRoute()
const router = useRouter()
const deviceStore = useDeviceStore()

// 断点穿越时实时改路：窗口从桌面拖窄到手机宽度（或反之）时，
// 当前所在路由树若与新设备不匹配，立即平移到对应路由树，
// 无需等待下一次点击导航（未手动切换过端口时才生效；
// 公开页如落地页 / 登录页不参与平移，避免阅读中被踢走）
watch(
  () => deviceStore.tree,
  (tree) => {
    if (route.meta.public) return
    const inMobileTree = route.path.startsWith('/m')
    const needMove =
      (tree === 'mobile' && !inMobileTree) || (tree === 'web' && inMobileTree)
    if (!needMove) return
    const mapped = mapPathToTree(route.path, tree)
    router.replace(mapped || (tree === 'mobile' ? '/m/course' : '/app/course'))
  },
)
</script>

<template>
  <router-view />
</template>
