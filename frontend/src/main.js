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

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.use(Vant)

for (const [name, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(name, component)
}

app.mount('#app')
