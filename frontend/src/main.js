import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Web 端 UI 库
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

// H5 移动端 UI 库
import Vant from 'vant'
import 'vant/lib/index.css'

// 图标按需全局注册，路由里用字符串名动态渲染
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import './style.css'
// 双皮肤设计令牌与装饰层（须在 style.css 之后引入以覆写 UI 库变量）
import './theme/tokens.css'
import './theme/skins.css'
// 设备自适应样式层（断点 / 字体 / 图片 / 触控，置于最后按端微调）
import './style/responsive.css'
// 首屏挂载前同步应用皮肤，避免主题闪烁
import { THEME_KEY, THEME_EXPLICIT_KEY, DEFAULT_THEME, TEACHER_DEFAULT_THEME } from './stores/theme'
import { useDeviceStore } from './stores/device'

try {
  const stored = window.localStorage.getItem(THEME_KEY)
  const explicit = window.localStorage.getItem(THEME_EXPLICIT_KEY) === '1'
  const user = JSON.parse(window.localStorage.getItem('ai-tutor-user') || 'null')
  const roleDefault = ['teacher', 'admin', 'ta'].includes(user?.role)
    ? TEACHER_DEFAULT_THEME
    : DEFAULT_THEME
  document.documentElement.setAttribute(
    'data-theme',
    explicit && (stored === 'blue' || stored === 'yun') ? stored : roleDefault,
  )
} catch {
  document.documentElement.setAttribute('data-theme', DEFAULT_THEME)
}

const app = createApp(App)

app.use(createPinia())
// 挂载前完成设备检测：写入 <html data-device> 并监听断点变化
useDeviceStore().init()
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.use(Vant)

for (const [name, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(name, component)
}

app.mount('#app')
