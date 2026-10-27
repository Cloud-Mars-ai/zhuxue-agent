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
// 首屏挂载前同步应用皮肤，避免主题闪烁
import { THEME_KEY, DEFAULT_THEME } from './stores/theme'

try {
  const stored = window.localStorage.getItem(THEME_KEY)
  document.documentElement.setAttribute(
    'data-theme',
    stored === 'mo' || stored === 'yun' ? stored : DEFAULT_THEME,
  )
} catch {
  document.documentElement.setAttribute('data-theme', DEFAULT_THEME)
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.use(Vant)

for (const [name, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(name, component)
}

app.mount('#app')
