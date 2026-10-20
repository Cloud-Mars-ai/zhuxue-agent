# 人机协同助学智能体 · 前端

面向经管课程全教学周期的人机协同助学智能体（2026 院级竞赛 · 智能体赛道）前端工程。

Web 端基于 Element Plus，H5 端基于 Vant，共用一套路由、状态与仿真数据。

## 快速开始

```bash
npm install      # 首次或依赖变更后执行
npm run dev      # 开发服务器，浏览器打开 http://localhost:5173
npm run build    # 生产构建，产物在 dist/
npm run preview  # 本地预览构建产物
```

手机预览：手机与电脑连同一 WiFi，访问终端打印的 `Network` 地址加 `/m/course`。
IP 随网络变化，以终端实际输出为准，不要沿用文档里的历史地址。

要求 Node 18+（本机 v22.14.0）。存在 EBADENGINE 警告，部分底层包建议 Node ≥ 22.18，当前构建与运行均正常。

## 演示账号

密码均为 `123456`，登录页可点角色标签快捷填入。

| 账号 | 姓名 | 角色 | 可见页面 |
| --- | --- | --- | --- |
| admin | 系统管理员 | 超级管理员 | 全部 |
| teacher | 王教授 | 教师 | 全部 |
| ta | 李助教 | 助教 | 全部（主控台只读） |
| student | 张同学 | 学生 | 课程主页、论坛、作业；访问主控台/统计跳 403 |

当前为**仿真数据模式**，无需后端即可完整点击浏览。

## 目录结构

```
frontend/
├─ vite.config.js          路径别名 @、开发端口、/api 代理到 8000 端口的 FastAPI
└─ src/
   ├─ main.js              注册 Pinia、Router、Element Plus（中文包）、Vant、全局图标
   ├─ App.vue              仅承载 router-view
   ├─ style.css            全局 CSS 变量（品牌色/文字色/圆角）+ 基础排版 + 窄屏适配
   ├─ api/request.js       Axios 封装：baseURL、token 注入、错误提示、401 处理
   ├─ mock/data.js         全部仿真数据（账号、课程、章节、论坛、作业、学情、对话样例）
   ├─ stores/user.js       Pinia 用户状态：登录态持久化、角色、仿真/联调模式切换
   ├─ router/index.js      路由表 + 全局前置守卫（未登录跳登录、角色不符跳 403）
   ├─ layouts/
   │  ├─ WebLayout.vue     Element Plus 侧边栏布局，菜单按角色动态过滤
   │  └─ MobileLayout.vue  Vant 底部标签栏布局，限宽 480px 模拟手机
   └─ views/
      ├─ Login.vue         登录页，四类角色快捷填入，可选进入 Web 端或 H5 端
      ├─ Forbidden.vue     403 无权限页
      ├─ web/
      │  ├─ CourseHome.vue      课程主页：进度仪表盘、章节表、最新研讨、AI 助教入口
      │  ├─ TeacherConsole.vue  教师主控台：概览卡、作业跟踪、学生预警（助教只读）
      │  ├─ Forum.vue           研讨论坛：搜索、章节筛选、置顶排序、发帖弹窗
      │  ├─ Homework.vue        作业管理：状态筛选、截止倒计时、学生/教师双视角
      │  └─ Statistics.vue      学情统计：折线趋势、章节掌握度雷达、学生分层饼图
      └─ mobile/
         ├─ MCourse.vue    H5 课程页：进度条、待办作业、章节列表
         ├─ MAsk.vue       H5 答疑页：消息流、推荐问题、模拟 AI 响应
         └─ MMine.vue      H5 我的：账号信息、数据模式开关、切 Web 端、退出
```

## 待办清单

### 高优先级

- [x] 安装 Git 并配置提交身份（本机 Git 2.55.0）
- [x] 初始化仓库并完成首次提交（分支 `main`，根目录与 frontend/ 各有 .gitignore）
- [ ] 建 GitHub 私有仓库并推送，邀请团队 4 人 —— 本机未装 `gh` CLI，需网页建仓后关联远程
- [ ] 和孔晨宇敲定接口契约 —— 字段名、返回结构、`code` 约定，越早定越省事

### 中优先级

- [ ] 补 AI 答疑页 Web 端版本 —— 详见下方"已知缺口"
- [ ] 向吴思锜要 UI 原型稿 —— 现页面按计划文字描述搭建，拿到原型后需调整视觉与交互
- [ ] 优化打包体积 —— 构建提示两个 chunk 超 500KB（element-plus 与 echarts 均全量引入），改按需引入可显著减小

### 低优先级

- [ ] Node 版本升级至 ≥ 22.18 —— 消除 EBADENGINE 警告，当前可暂不处理
- [ ] 论坛/作业的增删改真实落库 —— 联调阶段接入接口后生效

## 已知缺口：Web 端答疑页

答疑功能目前只有 H5 端，Web 端缺三处：

1. `src/views/web/CourseHome.vue` 第 105 行的"开始提问"按钮未绑定任何事件
2. `src/router/index.js` 的 Web 端 children 中没有 `ask` 路由（H5 端第 78 行有）
3. 缺 `src/views/web/Ask.vue`，可参照 `src/views/mobile/MAsk.vue` 改写为 Element Plus 版

`layouts/WebLayout.vue` 的侧边栏菜单由路由表自动生成，因此只需在路由中新增一条并写好 `meta.title` 与 `meta.icon`，菜单项即自动出现，布局文件无需改动。

## 与后端联调

后端：孔晨宇，FastAPI，默认 8000 端口。

1. **接口前缀已配好** —— `vite.config.js` 中 `/api` 已代理到 `http://127.0.0.1:8000`，后端把路由挂在 `/api` 下即可，前端无需改动。
2. **确认返回格式** —— `api/request.js` 假定后端返回 `{ code, message, data }`，`code === 0` 为成功。需与后端确认此约定，不一致则改该文件的响应拦截器。
3. **关闭仿真模式** —— `stores/user.js` 中将 `useMock` 默认值改为 `false`，登录即走 `/auth/login` 接口。
4. **逐页替换假数据** —— 各页面顶部 `import { ... } from '@/mock/data'` 处换成对应 API 调用。答疑页 `views/mobile/MAsk.vue` 的 `setTimeout` 模拟已注明替换方式（改为 `post('/agent/chat', { question })`）。

## 已知行为说明

以下为仿真数据模式下的**预期行为**，非缺陷：

- 论坛发帖、作业提交仅前端提示，刷新不保留，等接口接入后生效。
- 学情统计页图表数据为写死的仿真值，"智能体分析结论"为静态文案，接入后端后需改为动态生成。
- 构建有 chunk 体积警告，不影响功能，上线前建议处理。

## 依赖版本

vue 3.5 / vue-router 5.4 / pinia 4.1 / axios 1.20
element-plus 2.14（Web 端）/ vant 4.10（H5 端）/ echarts 6.1 / @element-plus/icons-vue 2.3
构建：vite 8 / @vitejs/plugin-vue 6 / vite-plugin-singlefile 2.3

> 注意：vue-router 与 pinia 装到的是较新大版本（5.x / 4.x）。若参考的教程基于 vue-router 4 或 pinia 2，个别 API 写法需对照调整。
