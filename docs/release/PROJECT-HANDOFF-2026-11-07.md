# 智慧学伴项目详细交接文档

编制日期：2026-11-07（Asia/Shanghai）

适用范围：当前主工作区 `D:\黑客松\经管Agent` 及其 GitHub Pages 发布工作树。

> **状态勘误（2026-11-07 22:40，以 `docs/release/PROJECT-LOG-2026-11-07.md` 为现状基准）**：本文写于 `b048828` 时点，其"状态类"陈述已被后续 7 个提交超越，接手时**不要以本文数字为准**，请以项目日志为准：
>
> | 本文记录（写成时） | 当前事实（22:40 实勘，main = `c7e00a0`，共 37 提交） |
> | --- | --- |
> | HEAD = `b048828`，工作树有未提交 WIP | `main = c7e00a0`（共 37 提交），工作树 clean；WIP 已全部提交并推送（`c58805e` / `38f519b` / `baf094b` / `add20fd` / `eb0566c` / `3ae081c` / `c7e00a0`） |
> | E2E 31/31 | E2E **37/37**（22:10 实跑复验）；另 text-repair 48/48、course-compiler 41/41、visualization 26/26、course-script 36/36、competition 通过 |
> | Pages = `be009a3` 未含官方数据 | **Pages 已发布最新版**（gh-pages = `cb7a064`，22:39 `status=built`，线上服务 `index-DFHJxuu-.js`，11 项定向验收全过）；三通道全部打通，唯一欠项为 DNSPod 域名解析 |
> | 交付 ZIP 被删待重建 | `deliverables/智慧学伴任务成果包.zip` 已于 11-07 14:34 恢复（hash 校验见日志 P0-5） |
> | 源码约 118 文件 / 3.9 万行 | `frontend/src` 143 文件（51 vue + 75 js）/ 46,501 行 |
> | 真实模型 5/5（11-04） | 仍为 5/5；**11-07 新改动未 live 复测**（日志 W-5 / R-4） |
>
> 本文保留的价值：发布流程细节（§11）、文件索引（§16）、本地运行与模型配置（§8/§9）、接手检查清单（§15）。状态、进度、风险、下一步一律读 `PROJECT-LOG-2026-11-07.md`。
>
> 根目录旧的 `Codex交接文档.md`、`AGENTS.md` 和 `frontend/README.md` 亦含过期信息（如"夜读皮肤仍存在""作业/论坛刷新不保留""固定管理学课程"），不应单独作为现状依据。

---

## 0. 先看结论

### 当前代码状态

| 项目 | 当前值 |
| --- | --- |
| 主工作区 | `D:\黑客松\经管Agent` |
| 当前分支 | `main` |
| 已提交 HEAD | `b048828` (`integrate-official-dataset`) |
| GitHub `main` | `b048828`，已同步 |
| 公网 `gh-pages` | `be009a3`，已构建成功 |
| 公网状态 | **落后于本地 `main`，也未包含当前未提交工作** |
| 工作树状态 | **有未提交改动，不能直接视为干净发布基线** |
| 当前源码规模 | `frontend/src` 约 118 个文件、3.9 万行、1.8 MB |

### 当前验证结果

以下命令已于 2026-11-07 在当前工作树实际执行：

| 命令 | 结果 |
| --- | --- |
| `git diff --check` | 通过，无空白错误 |
| `npm run build` | 通过，仅有既有的大 chunk 警告 |
| `npm run test:competition` | 通过 |
| `npm run test:e2e` | **31/31 通过** |
| `npm audit --omit=dev` | **0 个已知漏洞** |

赛事校验关键结果：

```text
topics=3, requirements=9, materials=11, questions=54
students=40, rawRecords=806, validRecords=793
supersededRevisions=7, pendingReview=4, qualityIssues=13, cases=3
```

### 当前最重要的未完成动作

1. 审阅并决定是否提交当前未提交的“自适应学习者画像 + 分步动画板书”改动。
2. 正式成果包 `docs/competition/deliverables/智慧学伴任务成果包.zip` 在当前工作树被删除，需要重新导出。
3. 将 `main` 的官方数据接入和后续自适应改动重新发布到 GitHub Pages。
4. 更新旧交接文档、README、AGENTS 和 Release 资产。
5. 历史提交中的旧模型密钥仍需项目负责人轮换。

---

## 1. 项目定位与当前形态

项目名：“智慧学伴” / 人机协同助学智能体。

当前产品同时存在两个使用场景：

1. **赛事模式**
   - 使用赛方公开七年级数学模拟学情数据；
   - 面向“代数式与整式运算、方程与方程组、不等式与不等式组”三个主题；
   - 重点展示内容梳理、学情分析、个性化建议、教师调整和成果包导出。

2. **通用课程生成与学生工作流**
   - 课程主题由用户输入和上传材料决定；
   - 不再默认生成管理学课程；
   - 支持 Web 与 H5；
   - 包含知识库、板书、作业、论坛、自测、练习和课程体验。

技术栈：

- Vue 3.5
- Vite 8
- Pinia 4
- Vue Router 5
- Web 端 Element Plus
- H5 端 Vant
- ECharts 6
- Node 静态服务器与 OpenAI 兼容代理

当前仍是**纯前端 + 可选同源 Node 代理**架构，没有业务数据库或账号后端。

---

## 2. Git、工作树与公网拓扑

### 2.1 远程仓库

唯一应使用的远程：

```text
mygithub = https://github.com/Cloud-Mars-ai/zhuxue-agent.git
```

不要再向其他 fork 推送。

### 2.2 工作树

| 路径 | 分支/提交 | 用途 | 备注 |
| --- | --- | --- | --- |
| `D:\黑客松\经管Agent` | `main@b048828` | 主源码工作树 | 当前有未提交改动 |
| `D:\chatting_records\Chatgpt\worktrees\pages-deploy-2\经管Agent` | detached `be009a3` | 当前 GitHub Pages 发布树 | 只放构建产物 |
| `D:\chatting_records\Chatgpt\worktrees\pages-deploy\经管Agent` | `gh-pages@7411117` | 旧发布树 | `git worktree list` 报 prunable，不要再使用 |

### 2.3 公网

- 根入口：https://cloud-mars-ai.github.io/zhuxue-agent/
- 教师工作台：https://cloud-mars-ai.github.io/zhuxue-agent/#/app/competition
- 学生 H5：https://cloud-mars-ai.github.io/zhuxue-agent/#/m/competition
- 知识库：https://cloud-mars-ai.github.io/zhuxue-agent/#/app/library
- 作业：https://cloud-mars-ai.github.io/zhuxue-agent/#/app/homework
- 论坛：https://cloud-mars-ai.github.io/zhuxue-agent/#/app/forum

GitHub Pages 使用 Hash 路由；旧无 Hash 路径由 `dist-pages/404.html` 自动跳转。

### 2.4 发布状态差异

```text
本地 main:      b048828  integrate-official-dataset
公网 gh-pages:  be009a3  personalized learning workflows
```

因此，公网目前：

- 已有个性化课程、知识库、作业回信、论坛评论、学习体检合并和双主题；
- **没有已提交的官方赛事数据接入 `b048828`**；
- **没有当前未提交的跨学科自适应画像和分步动画板书**。

---

## 3. 事实来源与可信度

### 3.1 当前应优先信任的文件

| 文件/目录 | 用途 |
| --- | --- |
| `frontend/src/` | 产品唯一源码真源 |
| `frontend/tests/e2e/critical-flows.spec.js` | 37 条确定性 E2E 主链路（11-07 深夜由 31 扩充） |
| `docs/release/PROJECT-LOG-2026-11-07.md` | **当前状态/进度/风险/下一步的唯一基准**（git `eb0566c`，22:10 全量测试实勘） |
| `docs/competition/data-contract.md` | 官方模拟数据契约 |
| `frontend/src/competition/official/` | 官方 CSV 的 ASCII 固化副本 |
| `frontend/src/competition/officialDataset.js` | 官方 CSV 到前端数据模型的转换 |
| `docs/release/EVIDENCE-2026-11-04-competition.md` | 最近一次赛事发布证据，但提交号需按项目日志更新 |
| `docs/research/openmaic-project-review.md` | OpenMAIC 全方位调研（固定版本 `10a92d65…`）+ 复用决策表 |
| `docs/research/openmaic-course-generation-adaptation.md` | OpenMAIC 生成流程适配说明 |
| `docs/research/hyperknow-frame-review.md` | HyperKnow 帧级调研（51 条帧观察） |
| `docs/research/teaching-video-advantages-and-ai-reuse.md` | 乐乐课堂 41 视频优势提炼 + AI 复用映射（§8 落地明细） |
| `docs/research/course-compiler-design.md` | 课程编译器研究线设计（RQ1–RQ4） |

### 3.2 已经过期的文档

- `Codex交接文档.md`
  - 基线停留在 `8552214`；
  - 仍描述旧 API Key 风险、旧夜读主题和旧待办；
  - 当前工作树标记为 modified，但不要把旧内容当成现状。
- `frontend/README.md`
  - 仍写“论坛发帖、作业提交刷新不保留”；
  - 当前已使用 localStorage / IndexedDB 做浏览器本地持久化。
- `AGENTS.md`
  - 仍写 `yun/mo` 双皮肤；
  - 当前实际是 `blue/yun`，夜读页面不可选；
  - 仍将 HyperKnow 调研列为第一优先，而该任务早已完成。
- 根 `README.md`
  - 仍有一句“当前内置数据不是赛方正式数据”；
  - `b048828` 之后，赛事工作台已默认加载赛方公开模拟数据。

---

## 4. 目录与架构

### 4.1 顶层目录

| 目录 | 作用 |
| --- | --- |
| `frontend/` | Vue 产品源码 |
| `deploy/` | 旧 Node 静态部署副本，`deploy/public/` 被 gitignore |
| `docs/competition/` | 赛事方案、数据契约、工具和成果包 |
| `docs/research/` | OpenMAIC、HyperKnow 调研与对照图 |
| `docs/release/` | 发布证据与交接文档 |
| `output/` | 文档、PDF、PPT、视频中间产物，gitignored |
| `video-analysis/` | HyperKnow 视频抽帧，gitignored |
| `tmp/` | 本地调试、截图、导出中间态，gitignored |
| `【赛题材料】智慧学伴/` | 赛方原始规则、PDF 和 CSV，当前 untracked |
| `.workbuddy/` | 旧 WorkBuddy 记忆与部署标记，gitignored |

### 4.2 核心源码目录

| 路径 | 职责 |
| --- | --- |
| `frontend/src/api/` | 模型调用、课程生成、板书生成、提示词 |
| `frontend/src/stores/` | Pinia 状态与浏览器持久化 |
| `frontend/src/utils/` | 课程规范化、学习者画像、诊断、板书、下载等 |
| `frontend/src/competition/` | 官方数据转换、统计分析、建议规则 |
| `frontend/src/views/web/` | Element Plus 页面 |
| `frontend/src/views/mobile/` | Vant 页面 |
| `frontend/src/layouts/` | Web/H5 主导航布局 |
| `frontend/src/theme/` | `blue` / `yun` 主题令牌与装饰 |
| `frontend/src/repositories/db.js` | IndexedDB 键值封装与 localStorage 降级 |

### 4.3 路由

Web：

- `/app/course`
- `/app/board`
- `/app/ask`
- `/app/practice`
- `/app/selftest`
- `/app/cheatsheet`
- `/app/competition`
- `/app/library`
- `/app/studio`
- `/app/cases`
- `/app/assessment`
- `/app/console`
- `/app/forum`
- `/app/forum/:id`
- `/app/homework`
- `/app/homework/:id`
- `/app/materials`
- `/app/model`

H5：

- `/m/course`
- `/m/board`
- `/m/ask`
- `/m/practice`
- `/m/selftest`
- `/m/cheatsheet`
- `/m/competition`
- `/m/library`
- `/m/studio`
- `/m/case`
- `/m/assessment`
- `/m/forum`
- `/m/forum/:id`
- `/m/homework`
- `/m/homework/:id`
- `/m/mine`

特殊路由：

- `/learn/:projectId`：独立全屏课程体验。
- `/app/checkup`：重定向到 `/app/competition?step=checkup`。
- `/app/studio`：不在侧栏显示，由首页输入后直接进入。

### 4.4 浏览器数据键

| 键 | 存储 | 内容 |
| --- | --- | --- |
| `ai-tutor-user` | localStorage | 用户与角色 |
| `ai-tutor-model-config` | localStorage | 模型和 TTS 配置 |
| `ai-tutor-theme` | localStorage | `blue` / `yun` |
| `ai-tutor-theme-explicit` | localStorage | 用户是否手动选过皮肤 |
| `ai-tutor-device` | localStorage | Web/H5 手动覆盖 |
| `ai-tutor-flags` | localStorage | 功能开关 |
| `course-studio-projects-v1` | IndexedDB | 课程项目、大纲、场景 |
| `knowledge-materials-v1` | IndexedDB | 上传材料与笔记 |
| `knowledge-boards-v1` | IndexedDB | 收藏板书 |
| `ai-tutor-homework-v2` | IndexedDB | 作业、提交、批阅回复 |
| `ai-tutor-forum-v1` | localStorage | 论坛主题与评论 |
| `competition-dataset-v2` | IndexedDB | 导入或覆盖后的赛事数据 |
| `competition-teacher-adjustments-v1` | IndexedDB | 教师调整审计 |

这些数据默认只在当前浏览器可用，不会跨设备同步。

---

## 5. 已完成的用户任务

### 5.1 OpenMAIC 调研与课程生成重构

状态：已完成并已发布过一版；当前又叠加了未提交的自适应画像增强。

已实现：

- 参考 OpenMAIC 的“需求 → 材料 → 大纲 → 单场景内容 → 校验/重试”分层流程。
- 用户输入决定课程主题。
- 上传资料是高优先级证据源。
- 新课程默认排除内置管理学纲要。
- 模型失败时按用户主题和材料生成确定性大纲。
- 单场景板书、练习、题目也使用当前场景内容，不再回退管理学。
- 首页输入后直接进入大纲确认页。
- 左侧“智能课程编排”已隐藏。

关键文件：

- `frontend/src/api/prompts/courseStudio.js`
- `frontend/src/api/courseStudio.js`
- `frontend/src/utils/courseStudio.js`
- `frontend/src/stores/knowledge.js`

### 5.2 DeepSeek、生成速度和渐进体验

状态：已完成。

- 默认文本模型为 DeepSeek `deepseek-chat`。
- 默认 TTS 为 StepAudio 3。
- 前端不保存真实密钥；生产由 Node 代理读取环境变量。
- 场景生成最多 3 路并发。
- 第一场景完成后即可进入课程体验，后续场景后台补齐。
- 课程项目写入 IndexedDB，离开编排页后可继续生成。

### 5.3 语音教学、音色与板书下载

状态：已完成。

- 语音教学支持开启/关闭。
- 支持 5 个中文音色。
- 板书可见内容与字幕驱动语音。
- 语音下一段预取，减少播放延迟。
- 板书可导出为自包含 HTML。

注意：当前未提交的新 `animation` block 尚未接入语音和 HTML 下载，见风险章节。

### 5.4 首页、学习模式和布局

状态：已完成。

- 支持“正常上课 / 考前冲刺”。
- 模式选择后会收成小型入口，可再次切换。
- 支持 TXT、Markdown、PDF、DOCX、PPTX、CSV、JSON 等材料。
- 首页标题与输入区居中，输入区与标题保持间距。
- 教师首页默认澄蓝，学生默认纸感。
- 夜读已从可选皮肤移除。

### 5.5 课程体验页与横向板书

状态：已完成。

- 生成完成后进入 `/learn/:projectId` 独立页面。
- 横向场景轨、淡阴影内容框。
- 板书按屏幕缩放，支持下载、全屏和跟随。
- Web/H5 均可使用。

### 5.6 合并工作台与教师分析

状态：已完成。

- “学习体检”合并进“智慧学伴”，成为工作台步骤。
- `/app/checkup` 自动跳转到 `?step=checkup`。
- 教师主控台支持按作业/考试筛选。
- 输出包括提交覆盖、平均分、及格率、优秀率、成绩分布、知识点矩阵、风险学生、小组差异和全员明细。
- 支持 CSV 导出。

### 5.7 知识库

状态：已完成。

- 学生/教师可上传资料。
- 可新建文字笔记。
- 可删除自己的资料。
- 可收藏板书并在知识库回看。
- 课程生成优先使用用户资料。

关键文件：

- `frontend/src/views/web/KnowledgeLibrary.vue`
- `frontend/src/stores/knowledge.js`
- `frontend/src/utils/materialImport.js`

### 5.8 作业闭环

状态：已完成，浏览器本地持久化。

- 教师发布作业、设置截止时间与要求。
- 学生进入详情上传本地文件。
- 文件保存为 Base64 写入 IndexedDB，避免 `ArrayBuffer` 克隆失败。
- 教师可下载、评分、写回复。
- 学生刷新或切换角色后可看到批阅结果与教师回复。

关键文件：

- `frontend/src/views/web/Homework.vue`
- `frontend/src/views/web/HomeworkDetail.vue`
- `frontend/src/stores/homework.js`

### 5.9 讨论闭环

状态：已完成，浏览器本地持久化。

- 主题列表可搜索、筛选和发帖。
- 点击主题进入详情。
- 详情展示历史评论。
- 学生、教师、助教均可评论。
- 发表后写回 localStorage。

关键文件：

- `frontend/src/views/web/Forum.vue`
- `frontend/src/views/web/ForumDetail.vue`
- `frontend/src/stores/forum.js`

### 5.10 官方赛事数据接入

状态：已提交到 `main`，尚未发布公网。

已替换原开发样例为赛方公开模拟数据：

- 3 个学习主题；
- 9 项观察指标；
- 11 份学习材料；
- 54 道题；
- 40 名学生；
- 2 个测验节点；
- 806 条原始作答记录；
- 793 条有效记录；
- 7 条被高修订版本替代；
- 4 条待评分；
- 13 条数据质量问题。

数据入口：

- 原始官方文件：`【赛题材料】智慧学伴/赛题数据/赛题资料包/4_赛题数据/模拟学情数据/`
- 前端固化 CSV：`frontend/src/competition/official/`
- 转换器：`frontend/src/competition/officialDataset.js`
- 数据契约：`docs/competition/data-contract.md`
- 同步脚本：`frontend/scripts/sync-competition-data.mjs`

注意：

- 官方 PDF 课程标准与教材切片体积约 40 MB，未复制进前端构建；
- 当前只保留课程要求中的文件索引、页码与来源字段；
- `【赛题材料】智慧学伴/` 目前 untracked，不应在未确认赛事数据公开许可前直接提交。

### 5.11 生成内容与质量的三方对标（摘要）

课程生成的内容与质量按三个一手证据源分层对齐（完整对照表、帧号/视频号证据与验证口径见 `PROJECT-LOG-2026-11-07.md` §5.4）：

| 来源 | 证据 | 对标层次 | 落点 |
| --- | --- | --- | --- |
| HyperKnow | 453 帧逐帧复建 + 51 条帧观察（`docs/research/hyperknow-frame-review.md`） | 形态与范式 | 资料先于生成、单入口分流、板书逐块生长（outline 恒首块 + 16 block + transition 参数化）、右栏追问不打断（A/B + 自由文本）、先问题后讲解（quiz-rapid）；明确不做语音主流程/自由白板/课程集市 |
| OpenMAIC | 固定版本 `10a92d65…` 调研（`docs/research/openmaic-project-review.md` + `openmaic-course-generation-adaptation.md`，MIT 署名已入 `THIRD_PARTY_NOTICES.md`） | 生成机制 | 两阶段（大纲确认前不生成内容）、schema 归一化才是安全边界（JSON 能解析 ≠ 业务可用）、按场景隔离失败 + IndexedDB checkpoint 可恢复、材料 top-k 限额且模型只回 chunkId（硬规则 7）、八道质量门 |
| 乐乐课堂 | 41 个微课视频 328 帧 + ASR 转写 41/41（`docs/research/teaching-video-advantages-and-ai-reuse.md` §8 落地明细） | 讲解内容与质量 | 五维 35 优势：微粒度切片（按时长反推场景数）、开场三件套、三点 takeaways、难度阶梯非降序、wrong-first 错解先行 + 12 条易错点库、五拍讲稿（question/answer/confirm/recall/cta）、marks 7 样式、常驻面板、字数预算 300–330 字/分、12 种转场参数化（禁整页翻页） |

质量不只是"像"：课程编译器（`flags.courseCompiler`）把上述标准物化为可验证对象——课程 IR + 9 类硬约束 + 五类证据账本（含伪造检测）+ subjectCheck 学科分发 + validate-and-accept 修复循环，配 37/37 E2E 与五个专项测试套件（41/41、48/48、36/36、26/26）作为回归基线。

---

## 6. 当前未提交工作（重要）

当前工作树有约 21 个 tracked 修改、1 个新源码文件及若干本地产物。

### 6.1 跨学科自适应学习者画像

新增：

- `frontend/src/utils/learnerProfile.js`

能力：

- 从用户目标、章节、学习者和材料文本 infer 学科；
- 识别学前、小学、初中、高中、大学、成人、未知；
- 生成语言方式、教学方式和板书方式；
- 用户明确给出的年级/学段优先；
- 模型能回传 `learnerProfile`，本地会校验并补齐字段；
- 课程项目持久化 `learnerProfile`；
- 课程大纲、题目、练习和板书提示词都用画像调整。

涉及文件：

- `frontend/src/api/chat.js`
- `frontend/src/api/courseStudio.js`
- `frontend/src/api/prompts/shared.js`
- `frontend/src/api/prompts/courseStudio.js`
- `frontend/src/stores/model.js`
- `frontend/src/stores/courseStudio.js`
- `frontend/src/utils/courseStudio.js`
- `frontend/src/views/web/ModelSettings.vue`
- `frontend/src/views/web/Ask.vue`
- `frontend/src/views/mobile/MAsk.vue`
- `frontend/src/views/web/CourseStudio.vue`
- `frontend/src/views/CourseExperience.vue`

当前推断方式是规则/关键词，不是语义分类模型：

- 优点是确定、离线可用、没有额外成本；
- 风险是跨学科词、混合领域或模糊说法可能误判；
- 用户明确年级/学段时可信度最高。

### 6.2 分步动画板书

新增 `animation` block：

- `frontend/src/components/BoardCanvas.vue`
- `frontend/src/utils/board.js`
- `frontend/src/api/prompts/board.js`
- `frontend/src/utils/courseStudio.js`

能力：

- 按步骤“上一步 / 下一步 / 重播”；
- 学前、小学、初中遇到流程、变化、因果、运算时可由模型或本地兜底生成；
- 当前 E2E 已覆盖“七年级一元一次方程”的 3 帧动画。

### 6.3 当前 WIP 的验证状态

当前 WIP 已通过：

- `npm run build`
- `npm run test:e2e`：31/31
- `npm run test:competition`
- `npm audit --omit=dev`

但它尚未：

- 提交到 `main`；
- 构建为 GitHub Pages；
- 发布；
- 在真实公网做浏览器复验；
- 让项目负责人完成最终视觉/教学口径验收。

### 6.4 当前 WIP 的明确缺口

`animation` block 已进入渲染器，但还没有完整接入以下出口：

- `frontend/src/utils/boardNarration.js` 不识别 `animation`，语音教学会跳过该 block；
- `frontend/src/utils/boardDownload.js` 不识别 `animation`，下载 HTML 时该 block 不会渲染。

在发布 WIP 前，应补这两个分支并增加下载/语音测试。

### 6.5 其他未提交/本地产物

- `docs/competition/deliverables/智慧学伴任务成果包.zip`
  - 当前工作树显示为 deleted；
  - 但 `docs/competition/task-package/智慧学伴任务成果包.zip` 仍存在；
  - 需要重新执行 `npm run export:competition`，确认是否覆盖/重建正式交付 ZIP。
- `frontend/src/utils/learnerProfile.js`
  - 新源码，应随 WIP 一起评审。
- `frontend/scripts/start-local.ps1`
  - 新增本地启动器，当前 untracked。
- `start-local.cmd`、`启动本地项目.cmd`
  - 根目录本地启动命令，当前 untracked。
- `docs/research/current/report-course-home.png`
  - 本地截图，除非需要证据归档，否则不要提交。
- `tmp/`
  - gitignored，测试截图和临时文件。
- `【赛题材料】智慧学伴/`
  - 赛方原始材料，当前 untracked；
  - 注意体积与比赛数据使用限制。
- `Codex交接文档.md`
  - 工作树显示 modified；
  - 内容明显落后于当前实现；
  - 不要用 `git checkout` 覆盖用户的未提交工作。

---

## 7. Git 里程碑

| 提交 | 内容 |
| --- | --- |
| `7a75c83` | HyperKnow 交接基线、结构化板书 |
| `07e5f97` | Step 5 / StepAudio 和课程首屏 |
| `bd93fc1` | 智能课程编排与板书视觉重构 |
| `b929b59` | DeepSeek、渐进式课程体验 |
| `e64ce75` | 学生端课程生成、独立体验页 |
| `49742a6` | 板书自适应与题目选项修复 |
| `9412cb2` | 学生课程首页刷新 |
| `cb72bfb` | 赛事学习伴侣工作流，tag `v0.7-competition` |
| `9610523` | 班级分析、澄蓝主题、主页调整 |
| `391c2e8` | 个性化课程、知识库、作业、论坛闭环 |
| `b048828` | 官方模拟学情数据接入 |

当前 `main` 没有包含：

- 自适应学习者画像；
- 分步动画板书；
- 最新 31/31 测试中的新增用例。

---

## 8. 本地运行与访问

### 8.1 开发模式

```powershell
cd D:\黑客松\经管Agent\frontend
npm install
npm run dev
```

地址：

```text
http://localhost:5173/
http://localhost:5173/#/app/course
http://localhost:5173/#/m/course
```

### 8.2 一键启动

```powershell
D:\黑客松\经管Agent\start-local.cmd
```

或双击 `启动本地项目.cmd`。

该脚本：

- 先检查 5173 是否已有项目；
- 没有则启动新的 PowerShell 窗口；
- 缺少依赖时自动 `npm install`；
- 就绪后打开浏览器。

### 8.3 生产式深链接验证

```powershell
cd D:\黑客松\经管Agent\frontend
npm start
```

访问：

```text
http://localhost:4173/
```

`npm start` 会先构建 `dist/`，再由 `server.mjs` 提供静态服务和 `/api` 模型代理。

### 8.4 离线单文件

```powershell
cd D:\黑客松\经管Agent\frontend
npm run build:offline
```

产物：

```text
frontend/dist-offline/index.html
```

### 8.5 演示账号

密码均为 `123456`：

| 账号 | 角色 |
| --- | --- |
| `student` | 学生 |
| `student2` | 第二学生样例 |
| `ta` | 助教 |
| `teacher` | 教师 |
| `admin` | 管理员 |

---

## 9. 模型与密钥

### 9.1 默认配置

- 文本 Provider：DeepSeek
- 默认模型：`deepseek-chat`
- Base URL：`https://api.deepseek.com/v1`
- TTS Provider：StepFun / StepAudio
- 默认音色：`qinhenvsheng`

前端默认 `apiKey` 为空。

### 9.2 服务端环境变量

参考：

- `frontend/.env.example`
- `deploy/.env.example`

关键变量：

```text
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

STEPFUN_API_KEY=
STEPFUN_BASE_URL=https://api.stepfun.com/v1
STEPFUN_TTS_MODEL=stepaudio-3-tts
```

不要把真实密钥写进 `src/`、README、截图或 GitHub Release。

### 9.3 安全现状

- 当前源码扫描未发现明文 `sk-`；
- 历史提交曾包含真实密钥，仍必须轮换；
- GitHub Pages 是静态站，不能安全保存模型密钥；
- 公网未配置服务端时使用确定性兜底。

---

## 10. 测试与校验

### 10.1 赛事数据

```powershell
cd D:\黑客松\经管Agent\frontend
npm run sync:competition-data
npm run test:competition
```

用途：

- 从官方 CSV 同步 ASCII 固化副本；
- 校验字段、记录、质量规则、建议和案例。

### 10.2 完整回归

```powershell
cd D:\黑客松\经管Agent\frontend
npm run test:e2e
```

当前：

```text
31 passed
```

覆盖：

- 登录、主题、落地页欢迎视频；
- 首页材料导入和课程生成；
- 知识库上传与板书收藏；
- 作业提交、教师批阅、学生回信；
- 论坛详情与评论；
- 自测、练习、速查表、考核；
- 教师班级分析；
- 独立课程体验与横向板书；
- 自适应年级推断与分步动画；
- Web/H5 路由；
- 语音开关和音色切换。

### 10.3 真实模型测试

```powershell
cd D:\黑客松\经管Agent\frontend
npm run test:e2e:live
```

这套测试需要真实 DeepSeek / StepAudio 配置。

上次有记录的真实链路验证是 2026-11-04 的 5/5：

- DeepSeek 普通回答；
- StepAudio TTS；
- 语音跟随字幕；
- DeepSeek 结构化板书；
- DeepSeek 课程大纲与首场景。

当前 11-07 的未提交画像改动**没有重新做真实模型回归**。

### 10.4 生产依赖

```powershell
cd D:\黑客松\经管Agent\frontend
npm audit --omit=dev
```

当前结果为 0 个已知漏洞。

---

## 11. GitHub Pages 发布流程

### 11.1 构建

```powershell
cd D:\黑客松\经管Agent\frontend
npm run build:pages
```

产物：

```text
frontend/dist-pages/
```

配置：

- Base：`/zhuxue-agent/`
- Router：Hash
- 自动生成 `404.html`

### 11.2 镜像到发布工作树

目标：

```text
D:\chatting_records\Chatgpt\worktrees\pages-deploy-2\经管Agent
```

保留：

- `.git`
- `.nojekyll`

当前可靠命令采用 `robocopy`：

```powershell
robocopy `
  D:\黑客松\经管Agent\frontend\dist-pages `
  D:\chatting_records\Chatgpt\worktrees\pages-deploy-2\经管Agent `
  /MIR /XF .git .nojekyll
```

`robocopy` 返回码 0–7 属于正常成功范围。

### 11.3 推送

```powershell
cd D:\chatting_records\Chatgpt\worktrees\pages-deploy-2\经管Agent
git add -A
git commit -m "deploy: ..."
git push mygithub HEAD:gh-pages
```

### 11.4 等待构建

```powershell
gh api repos/Cloud-Mars-ai/zhuxue-agent/pages/builds/latest
```

必须看到：

```json
{
  "status": "built",
  "commit": "<刚推送的 gh-pages commit>"
}
```

### 11.5 发布后真实验收

至少验证：

1. GitHub Pages 首页 200；
2. `#/app/course`、`#/m/course` 能渲染；
3. 上传一份非管理学材料后生成对应主题；
4. 知识库可见；
5. 作业详情有教师回复；
6. 论坛详情能评论；
7. `#/app/competition?step=checkup` 正常；
8. Web/H5 无横向溢出。

---

## 12. 赛事交付物状态

### 12.1 已存在

| 文件 | 状态 |
| --- | --- |
| `docs/competition/deliverables/智慧学伴设计方案.pdf` | 存在 |
| `docs/competition/deliverables/智慧学伴答辩PPT.pptx` | 存在 |
| `docs/competition/deliverables/智慧学伴演示视频.mp4` | 存在 |
| `docs/competition/task-package/` | 16 个 JSON/CSV/ZIP 文件 |
| Release `v0.7-competition` | 存在 |

### 12.2 当前缺失

| 文件 | 问题 |
| --- | --- |
| `docs/competition/deliverables/智慧学伴任务成果包.zip` | 工作树中被删除 |

虽然 `docs/competition/task-package/智慧学伴任务成果包.zip` 仍在，但主 README 和交付 README
指向的是 `deliverables/` 路径，需要重新导出并校验 hash。

### 12.3 重新生成

```powershell
cd D:\黑客松\经管Agent\frontend
npm run test:competition
npm run export:competition
```

随后执行：

```powershell
Get-FileHash -Algorithm SHA256 `
  D:\黑客松\经管Agent\docs\competition\deliverables\智慧学伴任务成果包.zip
```

并更新：

- `docs/competition/deliverables/README.md`
- 根 `README.md`
- Release 资产

---

## 13. 已知问题与风险

### P0：发布前必须处理

| 风险 | 说明 | 处理建议 |
| --- | --- | --- |
| 未提交 WIP | 自适应画像和动画板书尚未进入 Git | 评审后提交或明确回退 |
| 公网落后 | Pages 仍是 `be009a3` | 发布 `b048828 + 最终 WIP` |
| 交付 ZIP 缺失 | `deliverables/` 下 ZIP 被删除 | 重新导出、校验、提交 |
| 旧密钥 | 历史公开提交中可能存在真实 API Key | 在服务商后台轮换 |
| 真实模型未复测 | 当前 WIP 只跑确定性 E2E | 配真实环境跑 `test:e2e:live` |

### P1：应在最终提交前修复

| 问题 | 说明 |
| --- | --- |
| 动画板书语音缺失 | `boardNarration.js` 不认识 `animation` |
| 动画板书下载缺失 | `boardDownload.js` 不认识 `animation` |
| 文档过期 | 根 README、AGENTS、frontend README、旧交接文档相互矛盾 |
| 学习者画像仍是规则匹配 | 混合学科或模糊需求可能误判 |
| 静态站无跨设备存储 | 知识库、作业、论坛只在当前浏览器存在 |
| 赛事 PDF 未打包（部分关闭） | 主题相关三本教材（B02/B05/B06）已有修复文本层乱码后的正文摘录进入前端包（70 段 / 18.9 KB），工作台 chip 可展开、证据对话框可核对；其余五本仍为索引态，对话框有明确说明。全量页码级检索仍未做，见 DATA-AVAILABILITY-2026-11-07.md 第 8 节 |

### P2：工程优化

- Element Plus、ECharts 等主 chunk 仍超过 500 KB。
- 课程生成相关 chunk 也达到约 211 KB。
- 缺少 ESLint、单元测试和类型检查。
- 没有后端鉴权、权限隔离、云存储、多人实时同步。
- 板书交互目前是结构化 block，不是自由画布；这是有意约束，不应随意引入自由 HTML。

---

## 14. 推荐后续顺序

### 第 1 步：收口当前 WIP

1. 人工检查自适应画像的学科/学段判断。
2. 人工检查七年级数学动画板书视觉与教学节奏。
3. 补 `animation` 的语音和 HTML 下载分支。
4. 重跑：

```powershell
cd D:\黑客松\经管Agent\frontend
npm run build
npm run test:e2e
npm run test:competition
npm audit --omit=dev
```

### 第 2 步：整理交付物与文档

1. 重建 `智慧学伴任务成果包.zip`。
2. 更新交付 README 和 hash。
3. 更新根 README。
4. 更新 `AGENTS.md`，删除过期的夜读/API Key/HyperKnow 待办描述。
5. 用本文件替代旧交接文档，或把旧文档标记为历史归档。
6. 更新 `docs/release/EVIDENCE-2026-11-04-competition.md` 的提交号、30→31 测试和官方数据说明。

### 第 3 步：提交与发布

1. 提交 WIP。
2. 推送 `main`。
3. `npm run build:pages`。
4. 镜像到 Pages 工作树。
5. 推送 `HEAD:gh-pages`。
6. 等待 Pages `status=built`。
7. 用真实浏览器跑桌面与 H5 验收。

### 第 4 步：Release

1. 更新 Release 的 PDF、PPT、ZIP。
2. 更新 Release notes。
3. 如创建新版本，建议使用 `v0.8-official-adaptive` 或团队统一命名。

### 第 5 步：真实模型

1. 在 Node 环境配置 DeepSeek / StepAudio。
2. 跑真实模型测试。
3. 用黄金题库抽测。
4. 记录响应时间、失败率、JSON 稳定性和 TTS 可用性。

---

## 15. 接手检查清单

接手后的第一天建议按此顺序：

- [ ] `git status --short --branch`
- [ ] `git log -10 --oneline --decorate`
- [ ] `git worktree list --porcelain`
- [ ] 阅读本文第 0、6、13 节
- [ ] 打开当前 diff，确认哪些是用户已有工作
- [ ] 不执行 `git reset --hard` 或 `git checkout --`
- [ ] 跑 `npm run test:e2e`
- [ ] 跑 `npm run test:competition`
- [ ] 检查 `frontend/dist-pages` 是否对应待发布源码
- [ ] 检查 `docs/competition/deliverables/智慧学伴任务成果包.zip`
- [ ] 查 GitHub Pages 当前 commit
- [ ] 查 Release 当前资产
- [ ] 在服务商后台确认 API Key 是否已轮换

---

## 16. 关键文件索引

### 课程生成

- `frontend/src/api/courseStudio.js`
- `frontend/src/api/prompts/courseStudio.js`
- `frontend/src/utils/courseStudio.js`
- `frontend/src/stores/courseStudio.js`
- `frontend/src/views/web/CourseStudio.vue`
- `frontend/src/views/CourseExperience.vue`

### 自适应学习者画像

- `frontend/src/utils/learnerProfile.js`
- `frontend/src/api/chat.js`
- `frontend/src/stores/model.js`
- `frontend/src/api/prompts/shared.js`
- `frontend/src/views/web/ModelSettings.vue`

### 板书

- `frontend/src/api/board.js`
- `frontend/src/api/prompts/board.js`
- `frontend/src/utils/board.js`
- `frontend/src/components/BoardCanvas.vue`
- `frontend/src/views/web/Board.vue`
- `frontend/src/views/mobile/MBoard.vue`
- `frontend/src/utils/boardNarration.js`
- `frontend/src/utils/boardDownload.js`

### 赛事数据与分析

- `frontend/src/competition/officialDataset.js`
- `frontend/src/competition/dataset.js`
- `frontend/src/competition/analysis.js`
- `frontend/src/stores/competition.js`
- `frontend/src/views/CompetitionWorkbench.vue`
- `docs/competition/data-contract.md`

### 学生工作流

- `frontend/src/stores/knowledge.js`
- `frontend/src/views/web/KnowledgeLibrary.vue`
- `frontend/src/stores/homework.js`
- `frontend/src/views/web/Homework.vue`
- `frontend/src/views/web/HomeworkDetail.vue`
- `frontend/src/stores/forum.js`
- `frontend/src/views/web/Forum.vue`
- `frontend/src/views/web/ForumDetail.vue`

### 工程入口

- `frontend/package.json`
- `frontend/vite.config.js`
- `frontend/server.mjs`
- `frontend/aiProxy.mjs`
- `frontend/scripts/build-pages.mjs`
- `frontend/tests/e2e/critical-flows.spec.js`
- `frontend/tests/e2e/live-stepfun.spec.js`

---

## 17. 当前结论

主线功能已经完整，且当前工作树的功能测试、赛事校验和构建均通过。

真正需要下一位接手者先做的不是重新开发，而是：

1. 处理当前未提交的自适应/动画工作；
2. 补齐动画语音和下载出口；
3. 重建交付 ZIP；
4. 更新过期文档；
5. 提交并重新部署公网；
6. 用真实模型做最后验收。

只要按此顺序推进，当前 `main` 可作为稳定的功能基线，未提交工作可作为下一版候选。
