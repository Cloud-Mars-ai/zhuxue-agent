# 项目日志 · 2026-11-07（Agent 协作与交接基线）

> 编制：WorkBuddy ｜ 编制时间：2026-11-07 22:00（GMT+8）
> 事实基准：`git main = add20fd`（20:30 基线 `38f519b` 之后新增 2 个提交：`baf094b` 课程编译器、`add20fd` 乱码放大字形修复），工作树 clean（0 未提交）；唯一远端 `mygithub`，两提交均已推送；tags：`v0.5-baseline` / `v0.6-hyperknow-core` / `v0.7-competition`
> 编制依据：git 历史（32 提交）、`.workbuddy/memory/` 逐日日志（10-27 → 11-07）、`docs/release/PROJECT-HANDOFF-2026-11-07.md`、代码实勘（路由/开关/测试脚本/构建产物哈希）
> **任务系统说明**：20:30 前的工作以逐日记忆日志 + git 提交为载体；20:30 后的深夜工作（课程编译器、乱码修复、双通道部署）已走任务清单管理，12 项任务全部完成并核验。本日志即按这些一手记录梳理而成，可作为后续 agent 协作的任务台账模板。

---

## 0. 读数面板（30 秒判断项目所处阶段）

| 读数 | 当前值 | 判断 |
| --- | --- | --- |
| 代码基线 | `main = add20fd`，工作树 clean，**WIP 已全部提交并推送** | 可安全接手，无未提交改动风险 |
| 源码规模 | `frontend/src` 143 文件（51 vue + 75 js + 其他），约 4.65 万行 | 主体功能完成 |
| 确定性测试 | E2E **37/37**；text-repair **48/48**；course-compiler **41/41**；visualization 26/26；course-script 36/36；competition 校验通过 | 回归基线健康 |
| 真实模型测试 | live E2E **5/5**（2026-11-04 记录）；**11-07 新改动（含编译器、乱码修复）未复测** | 见风险 R-4 |
| 公网三通道 | ① WorkBuddy 链接已发**最新版**（add20fd 构建，verified）；② GitHub Pages 落后 main **34 个提交**；③ 腾讯云服务器已部署**最新版**但域名未解析 | 发布收尾中（仅剩 Pages） |
| 待用户操作 | API Key 轮换（历史提交含明文）；DNSPod 加 A 记录 | 阻塞项见 §4 |
| 阶段判断 | **功能开发主体完成 → 收口 / 发布 / 验收阶段**；新增研究线「课程编译器」已落地。下一步不是大规模新开发，而是补缺口、发布、真实链路验收、文档对齐 | — |

---

## 1. 项目总体进度概述

### 1.1 项目定位

「人机协同助学智能体」（对外名「智慧学伴」）：一门课的 AI 助教——知道课本讲到哪、学生卡在哪、下一步做什么；结论能回到教材；老师能看见全班盲区。定位裁决：**模仿 HyperKnow和openmaic**，做"有教材依据、有教师治理、可审计"的学习 Agent。

当前产品同时承载两个场景：

1. **赛事模式**（主战场，2026 院级竞赛 · 智能体赛道）：使用赛方公开七年级数学模拟学情数据，覆盖"代数式与整式运算、方程与方程组、不等式与不等式组"三主题；展示内容梳理 → 学情分析 → 个性化建议 → 教师调整 → 成果包导出。
2. **通用课程生成与教学工作流**：主题由用户输入/上传材料决定（不再默认管理学），覆盖课程生成、板书讲解、知识库、作业、论坛、自测、考核。

### 1.2 近四天工作主线（11-04 → 11-07）

```
11-04  Codex 接手 → HyperKnow 逐帧复建（51 条帧观察）→ 结构化板书
       → DeepSeek 课程生成 → 赛事模式 v0.7-competition → 官方数据接入 b048828
11-07  五大任务：乱码修复 / 账号与学科归属拆分 / 数据可用性（教材摘录）
       → 课程通俗化 + 理科可视化交互模型（c58805e）
       → 41 个教学视频分析 → courseStudio v3 讲稿层
       → 云服务 PoC → 腾讯云部署 → 安全硬化 + 三通道发布（38f519b）
11-07 深夜  课程编译器六层管线（baf094b）→ 生成课程乱码放大字形修复
       （add20fd）→ 双通道部署最新版 + 推送 mygithub
```

### 1.3 整体完成度判断

| 维度 | 状态 |
| --- | --- |
| 教学闭环（M1–M5） | ✅ 完成（双端） |
| 学习范式（S0–S3） | ✅ 完成；S4 部分（板书/追问/单入口已开，学习规划/页码引用未做） |
| 课程生成（courseStudio v3） | ✅ 完成（16 种 block + 五拍讲稿 + 可视化交互） |
| 课程编译器（研究线） | ✅ 六层管线落地（IR/验证/证据账本/学科检查/修复循环/实验评测），41/41 质量门 |
| 赛事模式 | ✅ 功能完成；等赛方正式数据包 |
| 板书/白板学习形态 | ✅ 完成（原最大形态缺口，11-04 补齐） |
| 部署（公网演示） | 🟡 三通道两通一欠（WorkBuddy/腾讯云已发最新版；Pages 落后 34 提交；域名未解析） |
| 安全 | 🟡 源码已无明文 key，但 git 历史需轮换 |
| 后端 / 云服务 | 🟡 PoC 通过，正式集成未开始 |
| 文档 | 🟡 部分过期（见 §6） |

---

## 2. 已完成任务与功能清单

### 2.1 近几天任务逐项台账（按完成时间倒序）

| # | 任务 | 完成日期 | 核心交付 | 验证 |
| --- | --- | --- | --- | --- |
| T-17 | 生成课程乱码（放大字形）修复 + 双通道部署 | 11-07 深夜 | `add20fd`：textRepair 第四层（AMPLIFIED_MAP 荞→p、株→q + 上下文感知，数字/句首不触发）；提示词禁令 v2.3；store `repairDeep` migration-on-read；部署腾讯云（pm2 4173 → 200）+ WorkBuddy 公网（200），均验证服务新构建 `index-D1trn0Ip.js` | test:text-repair **48/48**（新增 13 项含零误伤组）；E2E 37/37；build 通过；推送 mygithub |
| T-16 | 课程编译器六层管线（研究线） | 11-07 深夜 | `baf094b`：六层管线（IR → 生成 → 验证 → 修复 → 渲染 + 实验层）；utils 六件套（courseIR/courseValidator 9 约束码/evidenceLedger 五类证据+伪造检测/subjectCheck/courseRepair validate-and-accept/courseExperiment 四组对照）；`CourseCompilerView.vue` 研究面板（5 tab，实验台不依赖已有项目）；`/app/compiler` + `/m/compiler` 双端路由；设计文档 `docs/research/course-compiler-design.md`（RQ1–RQ4） | test:course-compiler **41/41**；E2E 37/37（新增编译器实验用例）；build 通过 |
| T-15 | 安全硬化 + 部署收尾 | 11-07 深夜 | server.mjs 安全响应头四件套 + 穿越防护 + 500 通用文案；aiProxy per-IP 限流（chat 30/min、tts 20/min）+ 错误分级；三通道全部打通 | 穿越/限流/GET 405 实测；E2E 36/36；npm audit 0 漏洞 |
| T-14 | GitHub 推送与公网发布 | 11-07 | 提交 c58805e（54 文件）+ 38f519b（33 文件）推送 mygithub；恢复误删交付 ZIP；复用应用 `wbapp_VcMqXrvl668JPEwXlPHsxU` 发布，sharecode 不变 | 公网链接 verified=true |
| T-13 | 后端部署到腾讯云 152.136.121.153 | 11-07 | `/home/wppjkw/zhuxue-agent/`（server.mjs + aiProxy.mjs + dist + .env），pm2 `zhuxue-agent` 端口 4173，`@reboot pm2 resurrect` 保活；nginx 反代配置就绪 | 服务器本地 health/深链接/安全头全 200 |
| T-12 | WorkBuddy 云服务 PoC | 11-07 | 建表 `course_history` + RLS 四策略（`TO authenticated`，owner_id 服务端从 JWT 填充）；多设备注册/历史/远程搜索/用户隔离全链路实测通过 | 结论：方案可行，可正式集成 |
| T-11 | 课程通俗化改造 + 理科可视化交互模型 | 11-07 | `utils/knowledgeVisualization.js`（六组概念信号加权判定）；`components/simulations/` 6 个交互模型（圆周运动/三角形/一次函数/数轴/分数）；board 新增 `simulation` block；16 种 block 白名单 + 五拍讲稿层（courseScript） | test:visualization 26/26；E2E 33/33（含两交互模型）；96 项测试全绿 |
| T-10 | 41 个教学视频逐帧+讲稿分析 | 11-07 | `docs/research/teaching-video-advantages-and-ai-reuse.md`：五维 35 条优势（带帧号/时间戳）+ 复用映射表 + 易错点库种子 12 条 | ffmpeg 抽帧 + stepaudio-2.5-asr 转写 41/41 |
| T-9 | 数据可用性梳理与设计 | 11-07 | 教材摘录提取链（B02/B05/B06 → 70 段 / 18.9KB，残留乱码 0）；数据集字段说明 42 条；工作台数据字典 + 边界声明卡 | E2E 31/31 + 页面目检 |
| T-8 | 教师账号与学科数据归属拆分 | 11-07 | 新增李老师（`math`/T003/数学）；赛事数据显式归属；调整可审计（operatorId）；数学教师登录落地赛事工作台 | build + E2E 31/31 |
| T-7 | 课程生成乱码修复 | 11-07 | `utils/textRepair.js`（映射表 + 区块启发式，白名单零误伤）；四层防御（导入/入库/输入/输出）+ 提示词 TEXT_INTEGRITY_RULE；PROMPT_VERSION v2.2 | test:text-repair 34/34（含 23.7 万字符真实语料）；11-07 深夜由 T-17 增加第四层并扩充至 48/48 |
| T-6 | 官方赛事数据接入 | 11-04→11-05 | `b048828`：3 主题/9 指标/11 材料/54 题/40 学生/806 原始记录（793 有效） | 赛事校验通过 |
| T-5 | 赛事模式（竞争学习伴侣工作台） | 11-04 | `/app/competition` + `/m/competition`；教师/学生双角色步骤流；成果包导出；tag `v0.7-competition` | E2E 覆盖 |
| T-4 | DeepSeek 课程生成与渐进体验 | 11-04 | 默认文本模型切 DeepSeek；3 路并发生成、单场景完成即入体验页；`/learn/:projectId` 独立体验页；语音教学 5 音色 | EVIDENCE-2026-11-04-deepseek-course.md；实测 7.9s 出大纲 / 17.6s 完成 6 场景 |
| T-3 | HyperKnow 逐帧复建 | 11-04 | `docs/research/hyperknow-frame-review.md`：51 条带帧号观察、16 条交互状态、8 组并排对比、三张差异表 | Codex 独立完成（P0-1 关闭） |
| T-2 | 结构化板书体系 | 11-04 | `Board.vue`/`MBoard.vue`/`BoardCanvas.vue` + `api/board.js` + 确定性兜底；逐块出现/暂停/缩放/全屏/右栏插问 | E2E 覆盖 |
| T-1 | E2E 重建 | 11-04 | `tests/e2e/`：critical-flows 33 + access-log 3 + live-stepfun 5 | 36/36 + 5/5 |

### 2.2 当前功能清单（按模块，代码实勘态）

**A. 教学闭环（M1–M5，双端可用）**

| 模块 | 能力 |
| --- | --- |
| M1 | 对话式意图跳转（本地规则引擎命中即出可点击卡片，未命中才走模型） |
| M2 | 一人一题：选章节+题型 → AI 出题 → 三维反馈（观点结构/理论运用/表达逻辑） |
| M3 | 课前案例征集：学生提交 + AI 摘要标签；教师筛选/排序/选用，选用后主页置顶 |
| M4 | AI 智能出题考核：教师圈人 → 逐人出题 → 复核/批量通过/发布 → 评分 |
| M5 | 学科背景差异化（学生自设背景，注入答疑与出题） |

**B. 学习范式（S0–S4）**

- S1：章节自测（5/10/20 题、自动判分、逐题解析）、速查表（双端 + A4 打印）、动态推荐、MCQ 前置澄清、轨迹埋点；
- S2：学习者画像、掌握度五级、盲区诊断、学习体检（已并入赛事工作台步骤）、主动 Feed（每条带理由）；
- S3：知识库（IndexedDB，TXT/MD/PDF/DOCX/PPTX/CSV/JSON 导入 + 正文提取 + 乱码修复）、章节+关键词 top-3 注入、来源标注；
- S4（部分）：`boardMode`/`socratic`/`tutorEntry` 已开；`studyPlan`/`citation`/`deepLearn` 未做（见 §4）。

**C. 课程生成（courseStudio v3，当前旗舰能力）**

- 首页大输入框直接生成可编辑大纲 → `/app/studio` 确认 → 逐场景并发生成 → `/learn/:projectId` 体验；
- 16 种受控 block（含 classification-tree / number-line / fill-blank / wrong-first / judge / case-table / induction / multi-solution / **simulation** / animation）；
- 五拍型讲稿层（question/answer/confirm/recall/cta，与板书视觉事件对齐）；
- 跨学科自适应学习者画像（`learnerProfile.js`：学科 + 七学段推断，规则/关键词法，用户明确年级优先）；
- 可视化交互模型（理科知识点自动识别：motion/geometry/function/quantity/process/comparison 六组信号加权）；
- "正常上课 / 考前冲刺"双模式；教师与学生均可发起生成；
- 全程确定性兜底：无模型时可完整生成大纲 + 5–6 场景，标「演示缓存」；
- **课程编译器**（`flags.courseCompiler` 默认开）：生成过程物化为可验证研究对象——课程 IR（知识点/先修/场景序列）→ 9 类硬约束验证 → 五类证据账本（requirement/chunk/attempt/rule/derived，含伪造检测）→ 定向修复循环（validate-and-accept）→ 研究面板 `/app/compiler`（违规定位/修复历史/四组对照实验 Vanilla·RAG-only·Prompt+Schema·Full Compiler）。

**D. 赛事工作台（CompetitionWorkbench，Web/H5 复用同一组件）**

- 数据步骤：官方数据集（42 条字段说明数据字典）+ 教材摘录面板 + 数据边界五条声明；
- 分析步骤：个体/小组/群体三层分析，信息不足不判未掌握；质量问题单独报告；
- 建议步骤：参考材料/题目/理由/完成标准/顺序/适用范围可调整建议链 + 教师调整审计；
- 学生端：从建议直接生成个性化数学课程（复用并发生成/横向板书/语音）；
- 成果包：JSON/CSV 任务成果包导出（ZIP 已恢复，见 §3）。

**E. 学生工作流**：知识库（上传/笔记/收藏板书回看）、作业闭环（发布→上传→批阅→回信，IndexedDB 持久化）、论坛（发帖/搜索/评论，localStorage 持久化）、自测/练习/速查表/考核。

**F. 教师端**：主控台（班级知识点掌握分析：矩阵/提交覆盖/分数分布/重点学生/小组差异/全员明细/CSV 导出）、资料管理、考核圈人出题、访问日志（`/app/logs`，仅本机）。

**G. 主题与双端**：澄蓝（blue，教师默认）/ 纸感（yun，学生默认）双皮肤，语义令牌驱动；Web 23 条路由 + H5 19 条路由 + `/learn/:projectId` 独立体验页；`WEB_TO_MOBILE` 双向映射 + 设备守卫。

---

## 3. 进行中任务的当前状态

**严格意义上的 in_progress：无**——任务系统为空，且日志中所有任务均标记完成。但以下事项处于"代码已提交、链路未完全闭环"的半成品状态，是接手后第一周真正的"进行中"工作：

| # | 事项 | 当前状态 | 缺口 |
| --- | --- | --- | --- |
| W-1 | animation block（分步动画板书） | 渲染器已提交（c58805e 内含），E2E 已覆盖 3 帧动画 | `boardNarration.js` 不识别 animation → **语音教学跳过该 block**；`boardDownload.js` 不识别 → **下载 HTML 缺该 block**。发布前必须补两个分支 + 测试 |
| W-2 | GitHub Pages 发布 | gh-pages = `be009a3`（11-05），**落后 main 34 个提交**（11-07 深夜两提交也未上网） | 官方数据接入、可视化、账号拆分、安全硬化、课程编译器、乱码修复均未上网；需 build:pages → 镜像 pages-deploy-2 工作树 → 推送 → 等 status=built → 浏览器验收 |
| W-3 | 腾讯云域名通道 | 服务器 + nginx 反代 + pm2 全部就绪，**最新版（add20fd 构建）已部署并本地验证 200** | **待用户在 DNSPod 加 A 记录** `zhuxue.wppjkw.online` → 152.136.121.153；HTTPS 待签（需 DNSPod API key → acme.sh） |
| W-4 | 云服务正式集成 | PoC 全链路通过（表/RLS/JWT/搜索/隔离） | 零产品代码接入：mock 登录 → 云 Auth（手机 OTP UI + auth gate）；课程历史 localStorage → 云 DB；分享码需另建 public-read 表 |
| W-5 | 真实模型验收 | 11-04 记录 5/5；公网 AI 代理已带密钥发布 | 11-07 的可视化/画像/课程编译器/乱码修复改动**未做 live 复测**；需配真实环境跑 `test:e2e:live` + 黄金题库抽测 |
| W-6 | 文档对齐 | `PROJECT-HANDOFF-2026-11-07.md` 写于 c58805e 之前 | 其"未提交 WIP"已提交（c58805e/38f519b/baf094b/add20fd）、交付 ZIP 已恢复、E2E 36→37；`Codex交接文档.md`/`AGENTS.md`/两个 README 均已过期（夜读皮肤、旧 key 风险、HyperKnow 待办等描述与现状不符） |
| W-7 | 乱码修复已知局限 | 放大字形（荞→p、株→q）已按上下文修复，23.7 万字符语料零误伤 | 模型把繁体 狀 简化出的"状"是极常用字（形状/状况），不做映射，"荞状"只能修成"p状"；已写入测试注释，属可接受残留 |

---

## 4. 未完成或待办事项

### P0 · 发布/交付前必须处理

| # | 事项 | 责任方 | 验收口径 |
| --- | --- | --- | --- |
| P0-1 | **历史提交中的明文 API Key 轮换**（阶跃星辰/DeepSeek/StepFun，曾随公开仓库发布） | **项目负责人**（agent 无法代做） | 服务商后台轮换；src 已无明文（`grep -rn "apiKey: '" src` 为空串） |
| P0-2 | **animation block 语音 + 下载出口**（W-1） | 开发 agent | boardNarration/boardDownload 增加 animation 分支；E2E 补下载/语音用例 |
| P0-3 | **GitHub Pages 发布最新 main**（W-2） | 开发 agent | Pages status=built 且 commit = 新推送（现落后 34 提交）；8 项发布后验收（首页 200、#/app/course、#/m/course、材料生成、知识库、作业回信、论坛评论、#/app/competition?step=checkup） |
| P0-4 | **真实模型复测**（W-5） | 开发 agent | `test:e2e:live` 全绿；黄金题库抽 10 条记录到 EVIDENCE |
| P0-5 | **交付物收口**：重建并校验 `智慧学伴任务成果包.zip` hash，更新 deliverables README / 根 README / Release 资产 | 开发 agent | SHA256 记录在案；ZIP 已存在于 deliverables/（11-07 14:34 恢复），需确认与 task-package/ 版本一致性 |

### P1 · 竞赛交付前应完成

| # | 事项 | 说明 |
| --- | --- | --- |
| P1-1 | 云服务正式集成（W-4） | 多设备数据同步是明确用户需求；PoC 已证可行，主要是 UI + store 改造工作量 |
| P1-2 | DNSPod A 记录 + HTTPS（W-3） | 需用户操作 DNSPod；HTTPS 用 acme.sh DNS 验证（模板 `api.wppjkw.online.conf`） |
| P1-3 | 文档对齐（W-6） | 用 `PROJECT-HANDOFF-2026-11-07.md` + 本日志替代/归档旧交接文档；更新 AGENTS.md 硬规则描述 |
| P1-4 | 页码级引用（`flags.citation=false`） | 模型只出 chunkId，前端回填；与 HyperKnow 的差异化卖点，未兑现 |
| P1-5 | 学习规划（`flags.studyPlan=false`） | HyperKnow「学习规划」对应物；规则排 7 天 + 模型微调 |
| P1-6 | 章节学习路径（`flags.deepLearn=false`） | 5 站式路径 |
| P1-7 | 学习者画像增强 | 当前规则匹配，混合学科/模糊表述可能误判；可加模型分类回路 |
| P1-8 | 全量教材页码级检索 | 当前 3 本有摘录（70 段），其余 5 本仅索引态（DATA-AVAILABILITY-2026-11-07.md §8） |

### P2 · 赛后 / 工程优化

- chunk 优化（EP/ECharts 主 chunk >500KB，课程生成 chunk ~211KB）；
- ESLint + 单元测试 + 类型检查补齐；
- 骨架屏统一组件（仿 HyperKnow `s_200`）；
- 学情统计页去仿真（Statistics.vue 仍有写死数值，已由 competition 工作台部分替代）；
- 论坛/作业的多设备同步（依赖云集成）。

### 明确不做（边界，防止被"功能对标"带偏）

/ 积分付费 / Manim 视频管线 / 自由白板画布/ Canvas-LTI / 社区排行 / 原生 App 。

---

## 5. 关键需求与功能点

### 5.1 竞赛侧（智慧学伴 · 七年级数学）

1. 基于赛方公开模拟学情数据（3 主题 / 9 指标 / 11 材料 / 54 题 / 40 学生 / 806 记录）完成内容梳理、学情分析、个性化建议；
2. 教师调整可审计、成果包可导出（JSON/CSV/ZIP）；
3. 学生可从建议一键生成个性化课程；
4. **未满足**：赛方正式数据包与最终典型 case 未提供；正式数据仅限本次比赛范围使用并按赛方要求删除。

### 5.2 产品侧核心功能点（演示主线）

1. **先测后讲**：自测/澄清前置（已达标）；
2. **板书讲解**：结构化 block + 逐块出现 + 讲中可打断追问（已达标）；
3. **资料第一**：上传材料优先注入生成，来源可溯（轻量达标，页码引用未做）；
4. **每日推荐**：主动 Feed 带理由（已达标）；
5. **教师治理**：圈人出题/复核/审计/班级知识点分析（已达标，差异化优势）；
6. **通俗化 + 可视化**：课程语言适配学段；理科知识点交互模型（已达标）；
7. **确定性兜底**：断网/无效 key 下全功能可演示（已达标）。

### 5.3 工程硬规则（违反会直接坏掉演示）

1. 推送只走 `mygithub`（`Cloud-Mars-ai/zhuxue-agent`）；
2. 新增页面必须同步 `router/index.js` 的 `WEB_TO_MOBILE` + `WebLayout.vue` 的 `GROUP_OF`；
3. 构建相对 base（`base: './'`），深链接验证必须 `npm run build && node server.mjs`（4173）；
4. UI 浅色纸感（blue/yun），深色皮肤已删勿恢复；色值只走 `theme/tokens.css`；
5. AI 功能必须带本地确定性兜底（`flags.offlineFallback`），失败标「演示缓存」；
6. 模型只输出 `chunkId`，页码前端回填；
7. 板书只做结构化 block 渲染，禁止自由画布/自由 HTML；
8. 演示账号：`student`/`student2`/`ta`/`teacher`/`admin`/`math`，密码均 `123456`。

---

## 6. 存在的问题与风险

### 6.1 安全（最高优先级）

| # | 风险 | 现状 | 处置 |
| --- | --- | --- | --- |
| R-1 | git 历史含明文 API Key（阶跃/DeepSeek/StepFun 三把，曾推 public 仓库） | 当前源码已空串，公网走服务端代理；**历史提交仍可扒** | 负责人后台轮换；迁移后端代理时同步清理历史 |
| R-2 | 无鉴权体系 | 演示账号明文 `123456`，纯前端角色判断 | 仅适合演示；上线须后端签发 token（云 Auth PoC 已就绪） |
| R-3 | 数据仅存浏览器 | 知识库/作业/论坛/课程项目都在 localStorage/IndexedDB，不跨设备 | 云集成（W-4）解决 |

### 6.2 技术债与缺陷（按影响排序）

| # | 问题 | 影响 |
| --- | --- | --- |
| R-4 | 11-07 改动（含课程编译器、乱码修复）未经真实模型复测 | 现场若密钥失效/接口变更，兜底可演示但真实链路未验 |
| R-5 | animation block 语音/下载缺口（W-1） | 语音教学与 HTML 下载会静默跳过该 block |
| R-6 | 包体偏大（两 chunk >500KB） | 首屏慢，比赛现场弱网风险 |
| R-7 | 文档漂移（W-6） | 新旧交接文档/README/AGENTS 相互矛盾，接手方易被误导 |
| R-8 | learnerProfile 规则匹配 | 混合学科/模糊需求误判风险 |
| R-9 | 无 ESLint/单测/类型检查 | 长期维护成本 |
| R-10 | Statistics.vue 写死数据 | 已被 competition 工作台部分替代，仍未清理 |

### 6.3 演示风险与兜底（均已实装）

| 风险 | 触发信号 | 兜底 |
| --- | --- | --- |
| 现场断网 | 429/超时 | offlineFallback 本地确定性生成 + `dist-offline` 单文件版 |
| 模型 JSON 不稳 | 解析失败 | 稳健解析 + 一次修复重试 + 文本兜底 |
| 密钥失效 | 401 | 页面提示 + 兜底结果 |
| 深链接白屏 | 资源 404 | server.mjs 改写（勿换纯静态托管） |
| 手机端被踢首页 | 新页面未同步映射 | WEB_TO_MOBILE（硬规则 2） |

### 6.4 外部依赖（不在 agent 控制内）

1. 负责人：API Key 轮换、赛方数据确权；
2. 用户：DNSPod A 记录、HTTPS 证书、云服务运营商后台（邮件通道 degraded，发码不到件——正式集成用手机 OTP）；
3. 后端队友（孔晨宇）：FastAPI 未交付，`{code,message,data}` 是前端假设；
4. UI 原型队友（吴思锜）：原型稿始终未提供。

---

## 7. 下一步建议（按序执行）

### 第 1 步 · 收口半成品（1–2 个工作日）

1. 补 `boardNarration.js` / `boardDownload.js` 的 animation 分支，E2E 补 2 条用例（P0-2）；
2. 配真实 DeepSeek/StepAudio 环境跑 `npm run test:e2e:live` + 黄金题库抽 10 条，写 EVIDENCE（P0-4）；**乱码修复与课程编译器路径需纳入 live 复测范围**（用带乱码的主题生成一次，确认无荞/株残留）；
3. 全量回归：`npm run build` / `test:e2e` / `test:competition` / `test:text-repair` / `test:course-compiler` / `test:visualization` / `test:course-script` / `npm audit --omit=dev`。

### 第 2 步 · 发布三通道（仅剩 Pages，0.5 个工作日）

1. ✅ 已完成（11-07 深夜）：`baf094b` + `add20fd` 已推送 mygithub；腾讯云已同步最新 dist + server.mjs + aiProxy.mjs（pm2 `zhuxue-agent`，4173 本地 200）；WorkBuddy 链接已重新发布（复用应用 `wbapp_VcMqXrvl668JPEwXlPHsxU`，sharecode 不变，`https://zhuxue-agent.app.workbuddy.host/?sharecode=Z7X276B67K`），两条通道均验证服务新构建 `index-D1trn0Ip.js`；
2. **仅剩**：`npm run build:pages` → robocopy 镜像 pages-deploy-2 工作树 → `git push mygithub HEAD:gh-pages` → `gh api` 等 `status=built` → 8 项浏览器验收（P0-3）；
3. 提醒用户：DNSPod A 记录（P1-2）；负责人：轮换 Key（P0-1）。

### 第 3 步 · 交付物与文档（0.5 个工作日）

1. `npm run export:competition` 重建成果包 ZIP，校验 SHA256，更新 README/Release（P0-5）；
2. 以 `PROJECT-HANDOFF-2026-11-07.md` + 本日志为新基线，归档 `Codex交接文档.md`（标注历史），重写 AGENTS.md 过期条目（P1-3）。

### 第 4 步 · 冲刺项（按赛程倒排）

1. 云服务正式集成：手机 OTP 登录 UI + auth gate → 课程历史上云 → 分享码 public 表（P1-1）；
2. 页码级引用（P1-4）——这是对 HyperKnow 的差异化卖点，演示价值高；
3. 学习规划（P1-5）如需对标「学习规划」工具再启动。

### 第 5 步 · 赛后

chunk 优化、ESLint/单测、统计页去仿真、画像增强。

---

## 附录 A：关键路径与命令速查

```bash
# 开发
cd frontend && npm run dev          # 5173
npm start                           # build + server.mjs（4173，深链接验证）
npm run build:offline               # dist-offline 单文件离线演示

# 回归（交付前全跑）
npm run test:e2e                    # 37 确定性
npm run test:e2e:live               # 5 真实模型（需真 key）
npm run test:competition
npm run test:text-repair && npm run test:visualization && npm run test:course-script
npm run test:course-compiler        # 41 编译器质量门

# 发布
npm run build:pages                 # dist-pages（Hash 路由 + 404.html）
npm run export:competition          # 成果包 ZIP

# GitHub Pages（robocopy 镜像后）
git push mygithub HEAD:gh-pages
gh api repos/Cloud-Mars-ai/zhuxue-agent/pages/builds/latest

# 腾讯云更新
scp -i ~/.ssh/id_rsa frontend/dist/* server.mjs aiProxy.mjs wppjkw@152.136.121.153:/home/wppjkw/zhuxue-agent/
ssh wppjkw@152.136.121.153 "pm2 restart zhuxue-agent"
```

**入口文件索引**：课程生成 `api/courseStudio.js` + `api/prompts/courseStudio.js` + `utils/courseStudio.js` + `stores/courseStudio.js`；板书 `api/board.js` + `utils/board.js` + `components/BoardCanvas.vue`；画像 `utils/learnerProfile.js`；可视化 `utils/knowledgeVisualization.js` + `components/simulations/`；赛事 `src/competition/` + `views/CompetitionWorkbench.vue` + `stores/competition.js`；修复 `utils/textRepair.js` + `utils/materialImport.js`；主题 `theme/tokens.css`；路由/守卫 `router/index.js`；开关 `config/flags.js`；课程编译器 `utils/courseIR.js` + `courseValidator.js` + `evidenceLedger.js` + `subjectCheck.js` + `courseRepair.js` + `courseExperiment.js` + `views/web/CourseCompilerView.vue` + `api/experiments.js`，设计文档 `docs/research/course-compiler-design.md`。

## 附录 B：环境坑（本机沙箱，实测）

1. curl 必须 `--noproxy '*'`（沙箱有 HTTP_PROXY，引号不能省）；
2. 起服务 + 测试必须写在同一条 Bash 命令里（后台进程跨调用不存活）；
3. npm 脚本用 `npm --prefix <dir> run <script>` 跑，避免配置解析错位；
4. StepFun ASR 走 `api.stepfun.com/v1`（`step_plan/v1` 路径 404）；
5. paramiko SFTP 在该服务器路径解析异常，用系统 scp；paramiko 装在 miniconda Python 3.9；
6. 服务器 wppjkw 有完整 sudo（密码 = 登录密码），`sudo -n` 会误判；
7. nginx `-s reload` 后 1 秒内旧 worker 仍在服务，验证要等稳；
8. Git Bash 中文 pathspec 不匹配时，用 `git checkout -- <目录>` 恢复 tracked 文件。

---

*本日志由 WorkBuddy 依据 git `add20fd`、逐日记忆日志与代码实勘生成；与旧文档冲突时，以本日志 + `PROJECT-HANDOFF-2026-11-07.md` + 代码为准。建议后续 agent 每次完成实质工作后，在本文档或对应记忆日志中追加台账条目（任务 / 日期 / 交付 / 验证 / 遗留），保持交接链不断。*
