# WorkBuddy → Codex 项目交接文档

> 交接方：WorkBuddy（前一轮全部开发由本 Agent 完成）
> 接收方：Codex（桌面版 / CLI）
> 项目：面向经管课程全教学周期的人机协同助学智能体（2026 院级竞赛 · 智能体赛道）
> 编制时间：2026-11-04 10:30（GMT+8）｜修订：新增 §6「HyperKnow 参照基线」
> 事实基准：`git main = 8552214`，工作区无未提交改动；公网链接当日实测 200

---

## 0. 先读这一段（给接手方）

1. **这不是一个新项目，也不是自由发挥的设计题**。前端已能完整跑通、能公网演示、有 12 次提交历史。你的任务是**以 HyperKnow 为参照，把形态、设计、功能继续对齐并做得更实**（见 §6，这是本次交接最重要的一章）。
2. **必须先自己看视频帧，再谈设计**。`video-analysis/frames1/` 有 453 张 1fps 抽帧，已有 3 份分析报告是 WorkBuddy 写的，**不能直接采信**——Codex 需要从图片重新逐帧过一遍，产出自己的结论与差异表（§6.4–§6.5）。
3. **旧文档里描述的深色皮肤已作废**。`前端准备交接说明.md` 第十三节（深色运行台）已被第十五节（浅色纸感）取代，看文档注意节次时间戳。
4. **三条最容易踩的工程坑**：
   - 推送只能推 `mygithub`（`Cloud-Mars-ai/zhuxue-agent`），**`origin` 是别人的 fork，没有写权限**；
   - 新增页面**必须同步 `router/index.js` 的 `WEB_TO_MOBILE`**，否则手机端会被设备守卫弹回首页；
   - 构建产物是**相对 base（`base: './'`）**，深链接靠 `server.mjs` 改写，不要换成 `vite preview` 或纯静态托管。
5. **有一个未处理的密钥泄露**：`frontend/src/stores/model.js` 里硬编码了阶跃星辰 API Key，且已随公开仓库发布。见 §8.1，这是最高优先级的待处理项。

---

## 1. 项目速览

| 项 | 内容 |
| --- | --- |
| 一句话定位 | 一门课的 AI 助教：知道课本讲到哪、学生卡在哪、下一步做什么；结论能回到教材；老师能看见全班盲区 |
| 形态参照 | **HyperKnow（hyperknow.io）为第一参照系**；第四大学（The Fourth Institute）为第二参照系（组织范式） |
| 课程载体 | 《管理学》，北京化工大学经管学院，2026 秋，3 学分 / 48 学时 / 86 名学生（演示数据） |
| 技术栈 | Vue 3.5 + Vite 8.3 + Pinia 4 + Vue Router 5；Web 端 Element Plus 2.14，H5 端 Vant 4.10；图表 ECharts 6 |
| 形态 | 纯前端 SPA（**无后端**），双端（桌面 `/app/*`、移动 `/m/*`）× 双皮肤（纸感 / 夜读） |
| 数据 | 全部仿真：`mock/data.js` + localStorage + IndexedDB，无服务端 |
| 模型 | OpenAI 兼容协议，默认阶跃星辰 `https://api.stepfun.com/v1`，`step-3.5-flash` |
| 代码规模 | `frontend/src` 75 个文件；15 个 Web 页面 + 9 个 H5 页面 + 1 落地页 + 登录/403 |
| 公网演示 | https://zhuxue-agent.app.workbuddy.host/?sharecode=Z7X276B67K （根路径与 `/app/course` 实测 200） |
| 仓库 | https://github.com/Cloud-Mars-ai/zhuxue-agent （public，`main` = `8552214`） |

**当前阶段判断**：教学闭环（M1–M5）已完成；学习范式升级（S0–S3 核心）已完成；UI 已重构为浅色纸感并对齐 HyperKnow 首屏；**板书/白板学习形态、学习规划、单入口仍是最大形态缺口**；后端联调与真实模型验收未开始。

---

## 2. 工作空间整体结构与用途

工作区根目录 `D:\黑客松\经管Agent`，是一个"代码 + 竞品调研 + 交付文档 + 视频素材 + 部署"的混合目录：

```
D:\黑客松\经管Agent\
├─ frontend\                  ★ 唯一的产品代码（Vue 3 SPA）
├─ video-analysis\            ★★ HyperKnow 录屏素材（453 帧 + 113 帧 + 音轨，61MB）
├─ deploy\                    公网部署包（server.mjs + public/=dist 副本）
├─ docs\                      产品内文档：截图 19 张 / 黄金题库 / ADR 模板 / 发布证据模板
├─ 项目全方位升级执行方案.md    ★ 路线图与验收尺（58KB，S0–S6 全阶段手册）
├─ 前端准备交接说明.md          ★ 开发侧详细变更史（16 节，含踩坑记录）
├─ 智能体使用说明与特色优势.md  ★ 对外产品说明（含演示动线）+ 同名 .docx 成品
├─ HyperKnow*.md (5 份)        ★ 竞品分析（深度 / 实机 / 逐帧 / 实测 / 迁移方案）
├─ 第四大学产品深度分析报告.md  第二参照系（组织范式，不照搬）
├─ 学生端UI双风格设计方案.html  早期 UI 方案稿（历史物，浅色时代原貌，勿作依据）
├─ blogs-cn.yaml / home-en.yaml / login.yaml / shot-blogs-cn.png  竞品页面快照留档
├─ output\                     文档流水线中间产物（gitignored）：stage1/2/3 + trace
└─ .workbuddy\                 Agent 记忆与部署标记（gitignored，勿删）
```

### 2.1 各部分职责与"能不能信"

| 路径 | 用途 | 交接说明 |
| --- | --- | --- |
| `frontend/` | 产品全部源码 | 唯一真源。`node_modules` 已装好（228MB），可直接 `npm run dev` |
| `frontend/dist/` | 当前构建产物（3.7MB） | 与 `deploy/public/` 内容一致（`index-D5b3grF_.js` 同一 hash） |
| `frontend/dist-offline/` | `build:offline` 产物 | 单文件构建，支持 `file://` 双击离线演示，比赛现场兜底 |
| `deploy/` | 公网静态服务 | `server.mjs` 是深链接修正服务器；**平台发布能力属 WorkBuddy，Codex 无法更新该 share 链接**（见 §9.3） |
| `video-analysis/frames1/` | **453 张 1fps 抽帧**（`s_001`–`s_453`） | **帧号≈秒数**，本项目设计对齐的第一手素材 |
| `video-analysis/frames/` | 113 张疏采样（`f_001`–`f_113`） | 约 4 秒一张，用于快速总览 |
| `video-analysis/audio.m4a` | 11MB 旁白音轨 | 可与画面交叉验证"讲解节奏" |
| `docs/screenshots/` | 19 张关键页面截图 | 已被产品说明文档引用，改名会断图 |
| `docs/qa/golden-set.md` | 20 条黄金题库（A/B/C/D 类） | **发版验收的唯一尺子**，4 维 × 0–3 分，合格线 9/12 |
| `docs/decisions/ADR-0001-template.md` | 决策记录模板 | 只有模板，ADR 内容目前写在方案第 8 节 |
| `docs/release/EVIDENCE-TEMPLATE.md` | 发布证据模板 | **尚未填写过任何一次**，见 P0-3 |
| `HyperKnow*.md` 5 份 | 二手分析 | **当线索读，不当结论用**；以帧为准（§6.2 说明局限） |
| `output/` | 文档流水线中间态 | 两个 request 目录，非交付物，可忽略 |
| `.workbuddy/memory/*.md` | 逐日工作日志（10-27 → 11-04） | **强烈建议通读**，踩坑细节比正式文档更细 |

> 注意：`output/`、`.playwright-cli/`、`video-analysis/`、`deploy/public/` 都在 `.gitignore` 里，**不在仓库里**。换机器 clone 下来不会有这些。

---

## 3. 代码资产地图（`frontend/src`）

### 3.1 目录职责

| 目录 | 内容与职责 |
| --- | --- |
| `api/` | `chat.js`（模型调用核心：重试/轨迹/知识注入/`sendChatJSON`）、`aiTasks.js`（任务层：出题/反馈/速查表/诊断）、`request.js`（Axios 封装，`/api` 代理 + `{code,message,data}` 约定）、`prompts/`（5 个立场化提示词模块） |
| `stores/` | 12 个 Pinia store：`user`、`model`（**含硬编码密钥**）、`theme`、`device`、`practice`/`cases`/`assessment`（M2/M3/M4）、`trace`/`persona`/`selftest`/`cheatsheets`/`knowledge`（S1–S3） |
| `utils/` | `intent.js`（意图规则引擎）、`feed.js`（主动 Feed 排序）、`diagnose.js`（盲区诊断）、`recommend.js`、`cheatsheet.js`、`localQuiz.js`（本地出题兜底）、`json.js`、`md.js`、`device.js` |
| `views/web/` | 14 页：CourseHome / Ask / Practice / SelfTest / Cheatsheet / Checkup / Materials / Cases / Assessment / TeacherConsole / Forum / Homework / Statistics / ModelSettings |
| `views/mobile/` | 9 页：MCourse / MAsk / MPractice / MSelfTest / MCheatsheet / MCheckup / MCase / MAssessment / MMine |
| `views/` 根 | `Landing.vue`（公开落地页，约 900 行）、`Login.vue`、`Forbidden.vue` |
| `theme/` | `tokens.css`（约 60 个语义变量 + Vant/EP 组件变量覆写）、`skins.css`（夜读装饰层） |
| `layouts/` | `WebLayout.vue`（侧栏 + `GROUP_OF` 菜单分组 + 继续学习卡 + 最近活动）、`MobileLayout.vue` |
| `config/flags.js` | 功能开关（15 个），`localStorage['ai-tutor-flags']` 可覆盖 |
| `repositories/db.js` | IndexedDB 键值封装（`ai-tutor-db`），localStorage 降级 |
| `mock/` | `data.js`（仿真数据）、`courseOutline.js`（六章教师确认稿，40 个知识点） |
| `components/` | `ClarifyDialog.vue`（Web 澄清弹窗）、`ClarifySheet.vue`（H5 澄清面板） |

### 3.2 路由表（改动前必看）

| 树 | 路径 | 说明 |
| --- | --- | --- |
| 公开 | `/`（Landing，`meta.public`）、`/login`、`/403` | 落地页不参与设备树平移 |
| Web | `/app/course`、`ask`、`practice`、`selftest`、`cheatsheet`、`checkup`、`materials`、`cases`、`assessment`、`console`、`forum`、`homework`、`statistics`、`model` | `/materials`、`/model` 限教师/管理员 |
| H5 | `/m/course`、`ask`、`practice`、`selftest`、`cheatsheet`、`checkup`、`case`、`assessment`、`mine` | `case` 是单数，Web 是 `cases` |
| 兼容 | `/course`、`/ask` 等 14 条旧路径 | 函数式 redirect 到 `/app/*`，保留 query/hash |
| 兜底 | `/:pathMatch(.*)*` | 回 `/` |

### 3.3 数据契约（本地存储键）

| 键 | 位置 | 内容 |
| --- | --- | --- |
| `ai-tutor-user` | localStorage | 登录态、角色、学科背景、`useMock` |
| `ai-tutor-model-config` | localStorage | 服务商/baseUrl/apiKey/model/temperature/人设 |
| `ai-tutor-theme` | localStorage | `yun`（纸感，默认）/ `mo`（夜读） |
| `ai-tutor-device` | localStorage | 手动端覆盖 `web` / `mobile` |
| `ai-tutor-flags` | localStorage | 功能开关覆盖 |
| `ai-tutor-cases` / `-practice` / `-assessment` | localStorage | M2/M3/M4 业务数据 |
| `ai-tutor-db` | IndexedDB | 知识库材料与片段（S3） |

**后端接入改造点**：`stores` 直读写 localStorage，`repositories/` 只有通用 `db.js`。接 FastAPI 时按 ADR-10 补 `personaRepo` / `practiceRepo` 等，页面不动。

---

## 4. 当前进展

### 4.1 时间线（git 提交即里程碑）

| 提交 | 内容 |
| --- | --- |
| `74f55ed` | 初始化 Vue3 前端骨架 + 交接文档 |
| `e4fc6ac` | 模型接入 + AI 答疑 + M1–M5 五大模块（教师访谈痛点） |
| `5cfc304` | 学生端 UI 双风格设计方案（HTML 设计稿） |
| `e37688b` | 双皮肤主题系统落地（tokens/skins/theme store） |
| `45f5ba5` | 学生端页面**结构级**重构（杂志封面 / 报头 / 面试函 / 红批） |
| `4f7fe92` | 学习范式升级 S0–S3 + 浅色纸感 UI 重构（最大一次） |
| `e097dbc` / `8552214` | 公网部署配置 + 部署文档 |
| 待提交 | `Codex交接文档.md`、`AGENTS.md`、记忆日志 |

### 4.2 已完成清单（可直接对外讲）

**教学闭环 M1–M5（双端）**

| 模块 | 能力 |
| --- | --- |
| M1 | 对话式意图跳转：`utils/intent.js` 本地规则命中"交作业/练习/案例/考核/待办"，返回可点击卡片；未命中才走模型 |
| M2 | 一人一题：选章节+题型 → AI 出题（贴合学科背景）→ 作答 → 三维反馈（观点结构/理论运用/表达逻辑） |
| M3 | 课前案例征集：学生提交 + AI 整理摘要标签；教师筛选/排序/选用，选用后课程主页置顶横幅 |
| M4 | AI 智能出题考核：教师圈人 → 结合过程性评价逐人出题 → 复核/批量通过/发布 → 作答 → 评分 |
| M5 | 学科背景差异化：学生自设背景，答疑与出题自动注入（经管类 / 工科类两套取材） |

**学习范式升级 S0–S3**

| 阶段 | 状态 | 交付 |
| --- | --- | --- |
| S0 基线 | 完成 | 功能开关、20 条黄金题库、ADR 模板、发布证据模板、离线兜底 |
| S1 立即可得 | 完成 | 提示词立场化、章节自测（5/10/20 题、自动判分、逐题解析）、速查表（双端 + A4 打印）、动态推荐、MCQ 前置澄清、轨迹埋点 |
| S2 数据资产 | 核心完成 | 学习者画像、掌握度五级、盲区诊断（三类）、学习体检（双端）、主动 Feed（每条带理由） |
| S3 知识地基 | 轻量完成 | 课程资料库（IndexedDB）、教师确认材料、章节+关键词 top-3 注入、来源标注；**页码级引用未做** |

**UI 与工程**

- 双皮肤（纸感 / 夜读），语义令牌驱动，切换不影响逻辑，三处入口；
- 侧栏 13 项收敛为 5–7 组；侧栏含「继续学习」课程卡 + 「最近活动」（读 trace）；
- 首页改版**对齐 HyperKnow 首屏结构**（页签 / 三材料卡 / 大输入框 / 继续学习 / 今天安排）；
- 设备自适应（768/1200 断点，Web⇄H5 自动映射，`scripts/verify-device.mjs` 17 用例）；
- 落地页（`/`）+ `/app` 路由重构 + 旧路径兼容；
- 部署：`deploy/server.mjs` 深链接改写，`npm start` = build + serve。

### 4.3 三次 UI 反复的结论（别再翻烧饼）

1. 初版：浅色卡其/纸米双皮肤 → 用户反馈"只换皮、结构没换" → 做结构级重构；
2. 中期：用户反馈"UI 太差" → 全部迁入深色"运行台"；
3. **最终（11-03 晚）**：用户明确"删掉黑色皮肤、恢复卡其色、参考 HyperKnow 形态" → 浅色纸感 + 浅色夜读，侧栏收敛，首页重排。

> 结论：**当前基调 = 浅色纸感 + HyperKnow 式首屏 + 收敛侧栏**。深色方案已删除，代码里残留的深色注释/旧截图引用属历史遗留，不要"恢复"。

---

## 5. 待办事项（按优先级，含验收口径）

### P0 · 接手即做（阻塞级）

| # | 事项 | 具体做法 | 验收 |
| --- | --- | --- | --- |
| **P0-1** | **重做 HyperKnow 逐帧分析**（详见 §6） | 不看结论先看帧：453 张 1fps 帧三轮过（总览→分段细读→差异表），产出 `docs/research/hyperknow-frame-review.md` + 形态对照表 + 设计/功能优化清单 | 文档含 ≥40 条带帧号的观察、≥12 条可落地项、每条能指到具体页面文件 |
| P0-2 | **密钥泄露处置** | `frontend/src/stores/model.js` 的 `DEFAULT_MODEL_CONFIG.apiKey` 已随公开仓库发布。轮换新 key；默认 key 置空或改后端代理 | 仓库中 `grep -rn "apiKey: '" src` 无真实 key；无 key 也能进演示（走兜底） |
| P0-3 | **真实模型链路验收** | S1–S3 此前用**无效 key 验证兜底**，真实外网调用未系统跑过。用真 key 跑答疑/自测/速查表/诊断，抽 `docs/qa/golden-set.md` 10 条评分 | 填好 `docs/release/EVIDENCE-TEMPLATE.md`，黄金题库 ≥18/20，截图存档 |
| P0-4 | **重建 E2E 回归脚本** | `.playwright-cli/` 中的 `e2e-theme.js`/`e2e-design*.js`/`e2e-doc-shots.js` **已不在工作区**（仅剩 3 个零散脚本），"39 项断言"无法复现。建议写关键 8 条主链路并**纳入仓库**（`frontend/tests/e2e/`） | 覆盖：登录→首页、意图跳转、一人一题、自测、速查表、考核发布、皮肤切换持久化、深链接直达 |
| P0-5 | **远端与基线清理** | `origin` 仍指 `yunwenshuai/zhuxue-agent`（无权限，落后 10 提交）→ 删除；`main` 无 tag，S0-1 基线 tag 未打 | `git remote -v` 只剩 `mygithub`；有 `v0.5-baseline` 之类 tag |

### P1 · 竞赛交付前应完成（多数来自 §6 的形态缺口）

| # | 事项 | 位置 / 建议 |
| --- | --- | --- |
| P1-1 | **板书/白板学习形态**（HyperKnow 最强形态，本项目最大缺口） | 新增 `views/web/Board.vue` + `components/BoardCanvas.vue`，`flags.boardMode`；AI 输出 block JSON（标题/要点/表格/图示/批注），前端渲染，**不做自由画布** |
| P1-2 | 学习规划（S2-4，对应 HyperKnow「学习规划」工具） | `flags.studyPlan=false`；`stores/plan.js` + `views/web/Plan.vue`，Feed 消费 |
| P1-3 | 苏格拉底追问卡（对应视频里的"停下来问"） | `components/SocraticCard.vue`，接一人一题与板书；`flags.socratic` |
| P1-4 | 助教单入口（对应 HyperKnow 中央大输入 + 工具菜单） | `views/web/Tutor.vue` + `utils/intent.js` 扩规则；`flags.tutorEntry` |
| P1-5 | 页码级引用（`flags.citation=false`） | 模型只出 `chunkId`，前端回填章节/页码；**禁止模型自写页码**（ADR-03） |
| P1-6 | PDF/PPT 材料抽取 | 当前只支持"粘贴正文"；加 `pdfjs-dist` + 离线 PPTX 脚本 |
| P1-7 | 轨迹回查 UI（S2-6） | 埋点已有（`stores/trace.js`），缺 `TraceDrawer.vue` |
| P1-8 | 学情统计去仿真 | `views/web/Statistics.vue` 三图数值仍写死，改为读 `persona`/`practice` |
| P1-9 | 论坛/作业落库 | 目前只弹提示，刷新丢失（等后端） |
| P1-10 | 双端一致性巡检 | H5 课程页已按新结构重排，但后续 Web 改动未回灌，需逐项比对 |

### P2 · 赛后 / 有时间再做

- 结构化板书卡进阶（分页、三色标注、进度回放）；章节学习路径（5 站）；
- S5 治理规模化：班级盲区热力图、规则提案与审批、复核审计视图、学科模板；
- 工程：Element Plus / ECharts 按需引入（当前两 chunk >500KB 警告）、ESLint + 单测、`md.js` 换 marked + DOMPurify。

### 明确不做（避免被"功能对标"带偏，见方案第 11 节）

课程集市 / 一句话生成整门课 / 积分付费 / Manim 视频管线 / 自由白板 / 多 Agent 递归 / Canvas-LTI / 社区排行 / 原生 App。

---

## 6. HyperKnow 参照基线：仿建目标与逐帧重分析要求

> 本章是用户明确的交接要求，优先级高于其它章节。**核心动作：Codex 自己看帧，重新分析一遍，再据此优化设计与功能。**

### 6.1 任务定位（要仿什么、仿到什么程度）

| 维度 | 要求 |
| --- | --- |
| 参照对象 | HyperKnow（`agent.hyperknow.io`，v1.3.16）+ 7 分 33 秒实机录屏 |
| 仿的层次 | **形态层**（页面骨架、信息密度、交互节奏）+ **范式层**（先测后讲、白板讲解、资料第一、主动推荐）；**不仿品牌层**（不放其 logo/文案/插图/命名） |
| 不仿的部分 | 课程集市、Craft Course 一句话建课、积分体系、视频管线、多 Agent 组织（见 §6.8 与方案第 11 节） |
| 判定标准 | 不看"像不像截图"，看"学生能不能在 3 步内从'我想学这章'到'看到讲解并被打断提问'"。形态服务于动线，不是视觉临摹 |
| 与既有定位的关系 | 仍是"有教材依据、有教师治理、可审计"的学习 Agent。HyperKnow 是**体验参照**，不是产品定位 |

### 6.2 为什么必须重做逐帧分析（现有报告的四个局限）

WorkBuddy 已产出 3 份报告（深度分析 / 实机深度解析 / 逐帧解析），但作为"仿建依据"有明确缺陷：

1. **没有帧号锚定**：报告按主题分章（学习方式/实现形式/UI…），结论无法回溯到具体某一帧，改设计时无法核对"依据在哪"；
2. **单次观察、未交叉验证**：部分判断基于个别画面推断（如板书机制、语音交互），未做"同组件在不同页面的多帧比对"；
3. **没有差异表**：报告是"HyperKnow 有什么"，缺"我们已有什么、差在哪、改哪个文件"的三列对照；
4. **二手材料混入**：营销站文案、第三方评测与产品实机结论混在一起，容易把"宣传语"当"功能"。

> 因此：**报告只当索引，帧才是证据**。Codex 必须自己看图得出判断；与报告不一致时，以帧为准并在文档中注明分歧。

### 6.3 素材清单与帧号规则

| 素材 | 路径 | 规格 | 用法 |
| --- | --- | --- | --- |
| 主抽帧 | `video-analysis/frames1/s_001.jpg` … `s_453.jpg` | 453 张，1fps，约 2560×1516 原分辨率缩至千像素级 | **帧号 ≈ 秒数**：`s_120` = 第 2:00；反向换算时间码 `mm:ss` 直接用帧号 |
| 疏采样 | `video-analysis/frames/f_001.jpg` … `f_113.jpg` | 113 张，约 4 秒一张 | 先看这套建立整体地图，再进 frames1 细读 |
| 旁白音轨 | `video-analysis/audio.m4a` | 11MB | 与画面交叉验证讲解节奏（哪里停顿、哪里提问） |
| 原始录屏 | 不在工作区 | 932MB，位于本机 ScreenSketch 录制目录 | 需要更高帧率/清晰度时再向用户索取；否则以 frames1 为准 |
| 已有报告 | `HyperKnow产品深度分析报告.md`、`…实机演示深度解析报告.md`、`…实机演示逐帧解析报告.md`、`…网站实测探索报告.md` | 二手 | 只作线索索引 |

**视频性质**：一段中文用户真实试用的"新用户首课"完整动线（非官方宣传片），窗口含浏览器标签与录屏工具，画面里可见其真实操作路径——这比宣传片更有价值。

### 6.4 已核验的帧锚点（WorkBuddy 本次实测，可直接作为起点）

| 帧 | 时间 | 画面内容（已亲验） | 对本项目的意义 |
| --- | --- | --- | --- |
| `s_045` | 0:45 | 引导态：顶部一行大字"而课程里的大部分学习，都发生在白板上，就像这样。"；中央点阵白板上有**手写体板书**（"二次函数 y=ax²+bx+c 画出来是一条抛物线。它的转折点叫顶点"，含红笔圈画与箭头）；右侧浮层"对话历史"（含「板书」标签、可关闭）；板下逐字打字机文字"你也随时可以打断我提问，不会被落下。"；底部「上一步 / 下一步」 | 板书学习形态的原型：**左白板 + 右对话历史 + 底部语音条**，三栏骨架 |
| `s_120` | 2:00 | 主界面：左侧栏（首页/我的课程/学习动态/历史/课程集市/更多选项 + 近期活动空态）；右上 `FREE · 20` 与"邀请好友"；顶部页签「打造课程 / 即时协助」；中央大字"你准备好了吗？" + 大输入框（左 `+`、右工具/语音/发送）；工具菜单浮层（**白板课堂 / 学习规划 / 问题求解**）；下方"今日值得学"列表（4 条带箭头的条目 + 换一批）；左下角版本号 v1.3.16 | **单入口 + 工具菜单 + 每日推荐**三件套，正是我们 `tutorEntry` 与 `feed` 要对齐的形态 |
| `s_200` | 3:20 | `/marketplace/{uuid}/preview` 页面骨架屏加载态（左封面卡 + 右标题/描述/标签/单元列表占位） | 说明"课程集市"是独立路由的详情页；**我们不做**，但可借其"骨架屏"做法 |
| `s_300` | 5:00 | 课程白板页 `/course/{uuid}/sessions/whiteboard/...`：顶栏左侧 `×` + 课程名「无政府状态与主权」+ 音量图标；右上工具条（− 100% + / 1/1 页码 / 全屏 / 设置 / 笔记）；中央**大白板**；右侧「对话历史」面板（AI 导师开场白："你好，chenyu! 欢迎来到国际关系基础课堂。我是你的导师。今天我们要一起揭开全球政治舞台的'底层规则'。在正式开始前，我们要回答三个核心问题。"）；底部语音输入条（麦克风 + "语音输入模式已开启，模型正在聆听"）+"暂停"；左下音量 | 白板页的**完整信息架构**：课程名常驻、缩放/分页、笔记、对话历史常驻右侧、语音优先 |
| `s_430` | 7:10 | 同一白板页，内容已铺满：左侧「本节课路线图」（国际体系的基础 / 无政府状态 / 自助逻辑，含手绘层级图与"国内社会（有政府）vs 国际体系（无政府）"对比）；中间「核心概念：主权」（定义、形象比喻"国家的'硬壳'"、一张**三列对照表**：维度/功能/核心含义 对内主权·对外主权、公式"法律平等 ≠ 实力平等"、两行结论）；右侧对话历史滚动（含「板书」标签、时间戳 21:06、苏格拉底式追问"既然每个国家都是自己的'老板'…你是会选择相信他的和平承诺，还是会觉得他可能要打你？"）；板下打字机式讲解字幕 | **板书的结构化范式**：路线图 + 概念定义 + 对照表 + 图示 + 一句追问；可 1:1 映射为我们的 block schema |

> 上面 5 帧是我亲验的。其余 448 帧未逐张看——**这正是 P0-1 要补的活**。

### 6.5 重做方法（三轮，Codex 必须自己看）

**第 1 轮 · 总览（约 30 分钟）**
- 看 `frames/f_*.jpg`（113 张）建地图，按 5–15 秒粒度判断"页面是否切换"；
- 产出**时间轴分段表**：`时间段 | 页面/路由 | 场景（引导/首页/集市/白板/对话）| 关键动作`；
- 已知大致分段（需你验证）：0:00–1:30 Onboarding（课程结构 → 白板演示 → 拖拽互动 → 工具菜单 → 即时协助）→ 1:30–3:30 首页与工具、课程集市 → 3:30–7:33 白板课堂实录（国际关系"无政府状态与主权"，含两次苏格拉底提问）。

**第 2 轮 · 分段细读（主力工作，约 2–3 小时）**
- 对每个场景，用 `frames1/s_*.jpg` 按 1–2 秒粒度连续看（关注**过渡帧**：弹层怎么出现、板书写入顺序、字幕与语音的时序）；
- 每帧按固定字段记录，缺一不可：

```
帧号 / 时间码        s_432 / 07:12
页面与路由           /course/{id}/sessions/whiteboard/...
区域                 左(路线图) | 中(概念区) | 右(对话历史) | 底(语音条) | 顶(工具栏)
组件                卡片/表格/图示/手写标注/标签/输入条
文案原文             （逐字抄，含标点与错别字）
排版               字号层级、行高、留白、对齐、栏宽比
色彩                底/卡/主色/强调/边框（估色值即可）
交互状态            默认/悬停/加载/流式输出/暂停/打断
一句话意图          这一屏想让学习者做什么
可迁移点            迁移到我们哪个页面/组件（写具体文件名）
```

- 硬性要求：**≥40 条观察**、**≥15 条交互状态**、**≥8 张对比截图**（HyperKnow 帧 vs 我们的页面，并排）。

**第 3 轮 · 差异表（产出物）**
必须产出三张表，落在 `docs/research/hyperknow-frame-review.md`：

1. **形态对照表**：`HyperKnow 构件 | 我们的现状 | 差距 | 改哪个文件 | 工作量`；
2. **动线对照表**：`HyperKnow 步骤 | 我们对应步骤 | 步数差 | 阻塞点`（例：它 1 步从首页到白板，我们目前需 3 步）；
3. **取舍结论表**：`构件 | 采纳/改造/不做 | 理由（对齐定位 or 成本）`——**必须写理由**，避免下一个人重开辩论。

### 6.6 设计层仿建清单（形态要素 → 本项目落点）

| HyperKnow 形态（帧依据） | 现状 | 优化动作 |
| --- | --- | --- |
| 中央大输入 + 双页签 + 工具菜单（`s_120`） | 首页已有页签、大输入框、chips；**缺工具菜单** | 在输入框左侧 `+` 挂工具菜单：白板课堂 / 学习规划 / 问题求解 / 章节自测，落到 `CourseHome.vue` |
| 左侧栏：首页/我的课程/学习动态/历史/课程集市 + 近期活动（`s_120`） | 已收敛为 5–7 组 + 继续学习 + 最近活动 | 对齐措辞与顺序；"学习动态"对应我们的 Feed，"历史"对应轨迹（P1-7） |
| 白板 + 右侧对话历史常驻（`s_045`/`s_300`） | **无** | 新增板书页，双栏 62:38；右栏为可折叠对话历史，含「板书」标签 |
| 白板工具栏：缩放 / 页码 1/1 / 全屏 / 设置 / 笔记（`s_300`） | **无** | 板书卡分页 + 缩放（CSS transform）+ 全屏；笔记移到导出/收藏 |
| 板书内容结构：路线图 + 定义 + 对照表 + 图示 + 追问（`s_430`） | 讲解仍是纯文本流（`md.js`） | 定 block schema：`outline / definition / table / diagram / callout / question`，AI 只填 JSON |
| 逐字打字机字幕 + 语音条（`s_045`/`s_300`） | 无 | 文字流式渲染即可（先不做语音），保证"逐块出现"节奏 |
| 骨架屏加载（`s_200`） | 部分页面有 loading | 统一 skeleton 组件，首屏与长任务都上 |
| 掌握度徽标 / 单元进度 | 已有五级掌握度 | 保留，样式向 HyperKnow 徽标语言靠 |
| 每日"今日值得学"（`s_120`） | 已有主动 Feed + 动态推荐 | 保留规则引擎，视觉改成单行条目 + "换一批" |

**排版基线（从帧估读，落地时可微调）**：正文 14–15px / 行高 1.7；标题层级只保留 3 级；卡圆角 12–14px；主色为低饱和靛蓝，强调色仅用于"当前/可点"；大面积留白，单屏信息密度低于我们现有后台式页面——**这是"像 HyperKnow"最容易被忽略的一条**。

### 6.7 功能层优化清单（能力 → 状态 → 差距）

| HyperKnow 能力 | 我们 | 差距与建议 |
| --- | --- | --- |
| 白板讲解（渐进书写、圈画、对照表） | 无 | **最高价值缺口**，P1-1；先做静态 block 渲染，再做逐块出现 |
| 讲解中打断提问 | 无（问答与讲解分离） | 板书页内嵌输入条，问题插入右栏对话，不打断板书 |
| 先测后讲 | 有（自测/澄清） | 已达标；补"讲完即测"的闭环跳转 |
| 学习规划 | 无（`studyPlan=false`） | P1-2；先用规则排 7 天，再由模型微调 |
| 资料第一 / 引用 | 轻量知识库 + 来源标注 | 补页码级引用（P1-5），这是与 HyperKnow 的差异化优势 |
| 课程集市 / 建课 | 无 | **不做**（见 §6.8） |
| 掌握度五级 | 有 | 已达标，接入板书页展示 |
| 语音输入 | 无 | 不做（误识别风险），赛后可选 H5 走读 |
| 每日推荐 | 有 | 已达标，补"换一批"与理由展示 |

### 6.8 边界（必须遵守，否则返工或侵权）

1. **不复制品牌资产**：不用其 logo、吉祥物、插图、命名（"白板课堂""备考秘籍""定制课程"等为对方产品命名，我们用自己的词，如"板书讲解""章节速查""学习规划"）；
2. **不搬运内容**：课程文本、题目、讲义一律来自我方教师材料（`mock/courseOutline.js` 为教师确认稿）；
3. **不做形态照搬**：其营销页叙事（Framer 站）不作为产品依据，只参考应用内（`agent.hyperknow.io`）实机形态；
4. **不引入其商业模式相关物**：积分、邀请返佣、订阅墙一律不出现；
5. **保留差异化**：教师治理端（圈人出题/复核/审计）、教材依据与引用、过程性评价——这三样是 HyperKnow 没有的，任何"更像它"的改动都不能削弱它们。

---

## 7. 关键决策与背景

### 7.1 决策链：为什么长成现在这样

```
5 份竞品报告（HyperKnow ×4 + 第四大学 ×1）        ← 只当线索
        ↓ 提炼共识 + 六处修正
《项目全方位升级执行方案》（S0–S6 路线、ADR、风险册、验收门）
        ↓ 按序落地
S0 → S1 → S2 核心 → S3 轻量 → UI 对齐 HyperKnow 首屏
        ↓ 本次交接
Codex 从帧重建形态基线（§6）→ 补板书/规划/单入口
```

**定位裁决（最重要的一句）**：不做第二个 HyperKnow，做"**有教材依据、有教师治理、可审计**"的学习 Agent。借它的学习范式与体验形态，不借它的 C 端生意。

### 7.2 六处必须修正（照原迁移方案做会返工，已裁决）

| # | 原方案 | 现裁决 |
| --- | --- | --- |
| 1 | 材料切片存 localStorage | 改 **IndexedDB**（5–10MB 限制 + 同步阻塞） |
| 2 | 100 万上下文整章注入 | **章节过滤 + top-k，≤6k token**；速查表分章生成再合并 |
| 3 | Family 单入口列 P0 | 推到 S4，先做"统一输入框 + 澄清"，避免空壳门面 |
| 4 | 模型输出页码 | **模型只出 chunkId，前端回填**，杜绝伪造 |
| 5 | 三学科并行 | 管理学 + 统计学做深，第三学科仅配置验证 |
| 6 | 自由白板生成 | **结构化板书 block schema**，AI 只填内容 |

### 7.3 工程 ADR 摘要（详见方案第 8 节）

- 材料/轨迹存 IndexedDB；检索用章节过滤 + 关键词 top-k，**不上向量库**；
- 结构化输出走 JSON + 一次修复重试 + 纯文本兜底（`utils/json.js`）；
- 每个 AI 功能必须有本地确定性兜底，界面标"演示缓存"（`flags.offlineFallback`）；
- 字体只用 OFL / 系统字体；
- 上层只能通过仓储层读数据，`mock / localStorage / IndexedDB / FastAPI` 四种实现可切。

### 7.4 团队与外部依赖

| 角色 | 人 | 待交接状态 |
| --- | --- | --- |
| 前端 | 贠文帅 | 全部代码由本 Agent 代做，其交接文档即 `前端准备交接说明.md` |
| 后端 | 孔晨宇 | **FastAPI 尚未交付**；约定 8000 端口、`/api` 前缀、返回 `{code, message, data}`、`code===0` 成功 |
| UI 原型 | 吴思锜 | 原型稿**始终未提供**，现有界面按文字方案 + HyperKnow 参考自建 |
| 教师顾问 | — | 黄金题库口径与《管理学》纲要由教师确认稿（`mock/courseOutline.js` 六章）承载 |

---

## 8. 已知问题与风险

### 8.1 安全（最高优先级）

| 风险 | 现状 | 处置 |
| --- | --- | --- |
| **API Key 硬编码** | `stores/model.js` 默认配置含真实阶跃星辰 key，已 push 到 public 仓库，公网页面会下发到浏览器 | 轮换 key → 置空或后端代理 → 清理 git 历史。**不要只删当前文件就认为安全** |
| 学生姓名/成绩 | 全为仿真数据，无真实个人信息 | 接后端时按 R-11：本地优先、脱敏、权限、边界声明 |
| 无鉴权 | 演示账号明文 `123456`，纯前端角色判断 | 仅适合演示；上线必须后端签发 token |

> 2026-11-04 后续：项目负责人明确要求先把 Step 5 Preview 与 StepAudio 3 TTS 的两把密钥临时内置到前端，后续再迁移到后端代理。当前构建产物会包含这两把密钥，交付或公开部署前必须先轮换并移除。

### 8.2 缺陷与技术债（按影响排序）

| # | 问题 | 位置 | 影响 |
| --- | --- | --- | --- |
| 1 | **E2E 脚本丢失** | `.playwright-cli/` 仅剩 3 个零散脚本 | "39 项断言通过"不可复现，回归无基线 |
| 2 | **无板书形态** | 全局 | 与 HyperKnow 最直观的差距，讲解仍是文本流 |
| 3 | 无后端 | 全局 | 论坛/作业不落库；统计为仿真；多人协作不可用 |
| 4 | 统计页写死数据 | `views/web/Statistics.vue` | 画像/诊断无法复用真实数据 |
| 5 | 引用不可点 | `flags.citation=false` | 演示主线"点开看原文"无法兑现 |
| 6 | 包体偏大 | `main.js` 全量引入 EP + ECharts | 两 chunk >500KB，首屏慢 |
| 7 | 无流式输出 | `api/chat.js` | 长任务首字 10s+ |
| 8 | Node 版本警告 | `EBADENGINE` | 当前 22.22.2 运行正常，暂不处理 |
| 9 | 落地页页脚占位 | 源代码库/隐私/条款 | 上线前需补 |
| 10 | 文档漂移 | 交接说明 §13、`学生端UI双风格设计方案.html` | 以本文档 + 代码为准 |

### 8.3 演示风险与兜底

| 风险 | 触发信号 | 已有兜底 |
| --- | --- | --- |
| 现场断网 | 模型 429 / 超时 | `flags.offlineFallback` 本地确定性出题（`localQuiz.js`）、`dist-offline` 单文件 `file://` 版 |
| 模型 JSON 不稳 | 解析失败 | `utils/json.js` 稳健解析 + 一次修复重试 + 文本兜底 |
| 密钥失效 | 401 | 页面提示 + 兜底结果；演示前务必真 key 跑一遍（P0-3） |
| 深链接白屏 | `/app/*`、`/m/*` 资源 404 | `server.mjs` 改写 `/*/assets/*`；**别用纯静态托管替代** |
| 手机端被踢回首页 | 新增页面未同步映射 | `router/index.js` 的 `WEB_TO_MOBILE` |

---

## 9. 重要文件路径与访问地址

### 9.1 必读文件（按顺序）

| 顺序 | 路径 | 为什么读 |
| --- | --- | --- |
| 1 | `Codex交接文档.md`（本文件） | 全貌、优先级、HyperKnow 参照要求 |
| 2 | `video-analysis/frames1/` + `frames/` | **设计依据的第一手证据**（P0-1） |
| 3 | `项目全方位升级执行方案.md`（§0–§6、§8–§12） | 路线图、验收门、ADR、风险册、8 分钟动线 |
| 4 | `项目全方位升级执行方案.md` §4.5 + §12 | 目标蓝图 8 个"啊哈时刻"与演示动线 |
| 5 | `.workbuddy/memory/2026-11-03.md` 等日志 | 踩坑细节（CSS 特异性、transform 包含块、docx 图片边界） |
| 6 | `前端准备交接说明.md` §14–§16 | 最新一轮功能与 UI 变更（§13 已作废） |
| 7 | `docs/qa/golden-set.md` | 验收尺子 |

### 9.2 代码入口

```
frontend/package.json                脚本：dev / build / build:offline / preview / start
frontend/vite.config.js              base:'./'、@ 别名、5173、/api → 127.0.0.1:8000
frontend/server.mjs                  生产静态服务（深链接修正 + SPA 回退），4173
frontend/src/main.js                 Pinia/Router/EP(中文)/Vant/全局图标 + 皮肤防闪烁
frontend/src/router/index.js         ★ 路由表 + 设备守卫 + WEB_TO_MOBILE
frontend/src/api/chat.js             模型调用核心（maxTokens 可配、重试、轨迹、知识注入）
frontend/src/api/aiTasks.js          任务层（组装/解析/降级）
frontend/src/config/flags.js         15 个功能开关
frontend/src/stores/model.js         ★ 模型配置（含待轮换的 key）
frontend/src/mock/courseOutline.js   六章课程纲要（速查表/自测/诊断共同数据源）
frontend/src/theme/tokens.css        双皮肤语义令牌（改 UI 从这里动）
frontend/src/layouts/WebLayout.vue   侧栏 + GROUP_OF 分组 + 继续学习/最近活动
frontend/src/views/web/CourseHome.vue 首页（HyperKnow 式首屏主战场）
docs/screenshots/                    19 张截图（被产品文档引用，勿改名）
```

### 9.3 访问地址

| 类型 | 地址 | 说明 |
| --- | --- | --- |
| 公网演示 | https://zhuxue-agent.app.workbuddy.host/?sharecode=Z7X276B67K | 2026-11-04 实测 `/` 与 `/app/course` 均 200 |
| 参照产品 | https://agent.hyperknow.io （需邀请码，登录后核心界面不可达） | 形态以录屏帧为准 |
| 代码仓库 | https://github.com/Cloud-Mars-ai/zhuxue-agent | 分支 `main`；远端别名 `mygithub` |
| 无效远端 | `origin` = github.com/yunwenshuai/zhuxue-agent | **无写权限，勿推**；`main` 领先 10 个提交 |
| 本地开发 | http://localhost:5173 （`npm run dev`） | 局域网 IP 以终端打印为准 |
| 本地生产 | http://localhost:4173 （`npm start`） | `node server.mjs`，`PORT` 可改 |
| 部署应用记录 | `.workbuddy/applications.yaml` → `wbapp_VcMqXrvl668JPEwXlPHsxU` | WorkBuddy 平台发布标记 |
| 模型服务 | `https://api.stepfun.com/v1`（OpenAI 兼容） | 候选：`step-3.5-flash`（默认）/ `step-3.7-flash` / `step-router-v1` / `step-5-preview` |

**部署权属提醒**：该 share 链接由 WorkBuddy 平台签发，**Codex 无法复用或更新**。继续更新线上有两条路：① 改完回 WorkBuddy 重新发布（`deploy/` 目录，复用同一链接）；② 自建 Node 托管（`deploy/` 可直接 `npm start`，**必须跑 `server.mjs`**）。另需知道：**WorkBuddy 一个环境只有一条公网链接**，后发布会覆盖先发布（历史上曾把应用覆盖成设计文档页）。

---

## 10. 首次上手 30 分钟清单

```bash
# 1) 环境（node 可能不在 PATH，WorkBuddy 托管版路径如下）
node -v          # 期望 v22.22.2
# /c/Users/24358/.workbuddy/binaries/node/versions/22.22.2-6/bin

# 2) 装依赖（node_modules 缺失时，228MB，约 1 分钟）
cd D:/黑客松/经管Agent/frontend && npm install

# 3) 构建自检（2–3s，应 exit 0，仅有 chunk 体积警告）
npm run build

# 4) 跑起来
npm run dev      # http://localhost:5173
# 或 npm start   # 构建 + 4173 生产预览（深链接验证用）

# 5) 冒烟路线（密码均 123456）
#    student → /app/course（纸感首页）→ 输入问题 → /app/ask 自动发送
#    → /app/selftest 生成 5 题 → 提交 → /app/checkup 看雷达
#    teacher → /app/console → /app/materials → /app/assessment 圈人出题
#    顶栏切皮肤 → 刷新 → 确认保持

# 6) 打开帧开始 P0-1（先看疏采样建地图）
#    看 video-analysis/frames/f_001.jpg … f_113.jpg
```

自检三个"读数"：
- `git status` clean，`git log -1` 为 `8552214`；
- `frontend/dist/index.html` 与 `deploy/public/index.html` 引用同一 `index-*.js`（当前 `index-D5b3grF_.js`）；
- 浏览器 Console 无 error（模型 401 属预期，未配真 key 时）。

---

## 11. 交接未尽事项（需明确承接）

| # | 事项 | 为什么必须交代 |
| --- | --- | --- |
| 1 | **逐帧重分析未做** | 已有报告只是线索，566 张帧（453 + 113）未逐张过；这是 P0-1 的全部工作量 |
| 2 | **API Key 轮换** | 只有负责人能操作阶跃星辰控制台，Codex 无法代做 |
| 3 | **`origin` 远端处置** | 保留会误推（403）；建议 `git remote remove origin` |
| 4 | **E2E 基线重建** | 历史断言无法复现，回归能力需重新投入 |
| 5 | **后端接口契约未签** | 孔晨宇侧 FastAPI 未交付；`{code,message,data}` 是前端假设 |
| 6 | **UI 原型稿始终缺失** | 吴思锜未交付；若后续给稿，改动面较大 |
| 7 | **教师材料版权** | 课程纲要为"教师确认稿"，对外需确权；材料入库前需确权 |
| 8 | **线上链接更新权在 WorkBuddy** | 见 §9.3 |
| 9 | **`.workbuddy/` 不可删** | 内含记忆日志与部署标记 |

---

## 附录 A：常用命令与踩坑速查

| 场景 | 做法 |
| --- | --- |
| 构建 + 本地生产预览 | `npm run build && node server.mjs`（别用 `vite preview` 验深链接） |
| 离线单文件演示 | `npm run build:offline` → `dist-offline/index.html` 双击可开 |
| 更新线上 | `npm run build` → `rm -rf ../deploy/public && cp -r dist ../deploy/public` → WorkBuddy 重新发布 |
| 新增页面 | 加路由 → **同步 `WEB_TO_MOBILE`** → 加 `GROUP_OF` → 补 H5 页 → build |
| 改皮肤 | 只动 `theme/tokens.css` / `skins.css`，业务代码不写死颜色 |
| 强制走兜底 | 模型配置填无效 key，保持 `offlineFallback: true` |
| 临时关功能 | `localStorage['ai-tutor-flags'] = {"studyPlan":false,"citation":false}` |
| 跳过登录调试 | localStorage 注入 `ai-tutor-user`（比 UI 登录稳） |
| 看视频帧 | 帧号≈秒数，`s_430` 即 7:10；先疏采样 `frames/`，再 `frames1/` 细读 |

**已验证的历史坑（别重犯）**

1. 多类选择器（0,4,0）会击败 `html[data-theme='mo'] .x`（0,2,1）——皮肤覆写放同 scoped 块末尾或改单类；
2. `fixed` 浮层不能放在带 `transform` 的祖先里（会成为包含块，`inset:0` 只拿到父盒）；
3. `base:'./'` 时深链接必然 `/m/assets/*` 404，必须靠 `server.mjs` 改写；
4. Vant 组件 props 可直接传 CSS 变量（`background="var(--warn-soft)"`），别硬编码色值；
5. HTML→docx 流水线中 `src` 用相对路径会被**静默丢弃图片**，必须 data URI 或绝对路径，转换后校验 `word/media` 数量；
6. 视觉争议以 PNG 像素采样为准，别信无头截图缩略图（会误判黑边/未绘制）；
7. 每新增 AI 功能必须带本地兜底，否则现场断网即翻车；
8. 抄 HyperKnow 只抄结构与节奏，**不抄文案与命名**；每处仿建都要在差异表里写"改哪个文件"。

## 附录 B：功能开关现状（`config/flags.js`）

| 开关 | 值 | 含义 |
| --- | --- | --- |
| `selfTest` / `cheatsheet` / `dynamicRecommend` / `clarifyDialog` / `trace` / `offlineFallback` | `true` | S1 全部开启 |
| `persona` / `checkup` / `proactiveFeed` | `true` | S2 核心开启 |
| `studyPlan` | `false` | 学习规划未做（对应 HyperKnow「学习规划」，P1-2） |
| `knowledgeBase` | `true` | 知识库开启（内置六章纲要） |
| `citation` | `false` | 引用标签待做 |
| `deepLearn` / `boardMode` / `socratic` / `tutorEntry` | `false` | S4 未做；`boardMode` 为 HyperKnow 板书形态开关（P1-1） |

---

*本文档由 WorkBuddy 依据当前代码、git 历史、逐日日志与录屏帧实抽核验生成；如与旧文档冲突，以本文档 + 帧 + 代码为准。*

---

## 附录 C：Codex 接手记录（2026-11-04）

工作分支：`codex/handoff-hyperknow`

已完成：

1. 从 `frames/` 与 `frames1/` 自行重建 HyperKnow 参照，产出 `docs/research/hyperknow-frame-review.md`：51 条带帧号观察、16 条交互状态、8 组与现有页面的并排对比。
2. 按项目负责人要求，在 `stores/model.js` 中临时内置 Step 5 Preview 与 StepAudio 3 TTS 两套配置和密钥；真实文本、语音接口均已从页面调用验证。公开部署前必须轮换密钥并迁移到后端代理。
3. 新增 Web/H5 结构化板书：`views/web/Board.vue`、`views/mobile/MBoard.vue`、`components/BoardCanvas.vue`；支持逐块出现、暂停/重播、缩放、全屏、右栏插问与 A/B 追问。
4. 新增板书模型任务与确定性兜底：`api/board.js`、`api/prompts/board.js`、`utils/board.js`。模型只输出受控 block JSON，失败时使用教师确认稿并标“演示缓存”。
5. 首页 `+` 已改为统一学习工具菜单；同步 `/app/board`、`/m/board`、`WEB_TO_MOBILE`、`GROUP_OF` 与 H5 入口。
6. 修正一人一题、自测、速查表、考核的“无模型”入口：打开 `offlineFallback` 时仍可进入确定性演示，不再被配置检查挡在按钮外。
7. 重建 Playwright 回归：`frontend/tests/e2e/critical-flows.spec.js` 共 13 条确定性用例，另有 3 条 `@live` 真实 StepFun 用例；覆盖登录首页、意图跳转、工具菜单、一体化材料区/双模式、TXT/PDF 文件上传、一人一题、自测、速查表、考核生成复核发布、皮肤持久化、生产深链接、H5 板书、Step 5、结构化板书与 TTS。最新结果：`13 passed`、`3 passed`。
8. 在 `8552214` 建立 `v0.5-baseline`，移除无写权限的 `origin`；仓库只保留 `mygithub` 推送远端。
9. 首页材料区与输入区合并为一体化学习编排器，交互宽度收窄；新增“正常上课 / 考前冲刺”模式。三个材料卡现在直接打开文件选择器，支持 TXT/Markdown/PDF/DOCX/PPTX 浏览器内正文提取并写入知识库。
10. 左侧栏移除 AI 答疑入口，顶部改为“AI协助”；AI 回答与板书回复均增加 StepAudio 3 TTS 朗读按钮。模型接入页可查看、编辑和测试文本/语音两套配置。

当前阻塞：

- 真实模型链路已验收：Step 5 Preview 对话、结构化板书、StepAudio 3 TTS 均通过页面级 `@live` 测试。正式交付前仍需要轮换当前明文 Key 并迁移到后端代理。
- 当前按要求内置的两把新 Key 会出现在公开构建与后续提交中；迁移到后端代理时应同时轮换并清理历史。
- 本轮未更新 WorkBuddy 公网链接；线上发布权仍在原平台。

常用验证：

```bash
cd frontend
npm run build
npm run test:e2e
npm start
```
