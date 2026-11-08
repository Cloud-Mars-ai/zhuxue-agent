# 项目报告 · 助学智能体课程管线完善与自动课程生成（T-21）· v2

> 编制：WorkBuddy ｜ 编制时间：2026-11-09（GMT+8）｜ **v2 = 依据 §5 执行结果迭代后的定稿**（迭代记录见 §11）
> 代码基线：`git main = 82ab702`（T-20），git 历史共 **42 提交**；本报告对应的改动在工作树（9 改 + 5 新目录/文件），提交后总数 +N，以实时复验为准
> 上游报告：`docs/research/`（OpenMAIC 产品调研①、双视频逐帧分析②③、优化策略④）；`docs/release/PROJECT-LOG-2026-11-08.md`（T-20 台账）
> 本报告定位：**完整项目报告**——覆盖本轮全部工作（研究输入 → 任务清单 → 实现 → 自动课程生成 → 全量验证 → 发布），并作为后续迭代的事实基准

---

## 0. 读数面板（30 秒）

| 读数 | 当前值 | 判断 |
| --- | --- | --- |
| 功能完成度 | P0 三项（完课闭环 / 小测作答 / 播放控制）+ P1 两项（结构下限 / 题目质量校验）全部落地 | 与策略报告④的 P0/P1 清单逐项对齐，无遗漏 |
| 自动课程生成 | 真实模型（DeepSeek）两阶段生成 **9 场景系统课程**，编译器全部门禁零 error 零 warning | 落库 `src/mock/demoCourse.js`（约 178KB），发布链接开箱即有完整体验 |
| 确定性测试 | 6 套 node 套件（44+36+36+48+26+competition 全绿）+ **E2E 39/39** + 生产构建通过 + 深链接 200 | 回归基线健康，新增 P0 用例 1 项 |
| 发布状态 | GitHub 推送与公网发布**待执行**（任务 #14，需用户授权） | 机制全通（见 §7） |
| 阶段判断 | 开发主体完成 → 本报告 + 发布收口 | 下一步：提交推送 → 发布 → 报告迭代 |

---

## 1. 研究输入与本轮任务的对应关系

四份研究报告（`docs/research/`，2026-11-08 完成）构成本轮工作的输入：

| 报告 | 核心发现 | 落到本轮的实现 |
| --- | --- | --- |
| ① OpenMAIC 产品调研 | 上游四类场景模板、画布约束、widget-config 提取等机制；MIT 可借鉴 | 已在 T-19 完全接入（`api/openmaic/` 11 模块）；本轮未再改动上游资产 |
| ② OpenMAIC 生成课程逐帧分析 | 讲解流畅但**无完课闭环**、无作答交互、无播放控制 | P0-1 / P0-2 / P0-3（§3.1–3.3） |
| ③ 本项目生成课程逐帧分析 | 编译器约束强，但**学习者侧是"只读幻灯片"**；题目偶有重复选项/单选不唯一 | P0-1 / P0-2 / P0-3 + P1-4（§3.1–3.4） |
| ④ 优化策略 | P0：完成循环 / 小测交互 / 播放控制；P1：交互数轴（本期缓行）/ 题目质量码 / 结构下限；P2：问题气泡 / TTS | P0 全做 + P1 两项（结构下限、题目质量码）；交互数轴与 P2 列入遗留（§8） |

任务清单（14 项）中 #1–#4 为研究（已完成），#5–#11 为实现与验证（已完成），#12–#14 为本报告、迭代与发布（本报告即 #12 交付物）。

---

## 2. 总体方案：把"生成系统"补成"学习系统"

编译器六层管线（IR → 生成 → 验证 → 修复 → 渲染）保证的是**内容质量**；三轮逐帧分析共同指向的缺口在**学习者侧闭环**：课程生成完就"结束了"，没有答题、没有讲稿驱动、没有完成仪式。本轮在两个方向同时收口：

1. **内容侧质量门继续加高**（编译器层，对 AI 产出做确定性约束）：
   - `STRUCT_MIN_SCENES`：场景类型下限 + 总场景数下限（plan 级 warning）
   - `QUIZ_DUP_OPTION` / `QUIZ_SINGLE_ANSWER` / `QUIZ_OPTION_COUNT`：题目级质量码（content 级，warning/error 分级），重复选项有**确定性修复**（去重 + 答案下标重映射），其余升级给模型修复
2. **学习者侧闭环补齐**（CourseExperience + 新组件）：
   - 完课卡片（统计 + 分场景正确率 + 三个出口动作）
   - 小测逐题作答（选择 → 提交 → 判定 → 解析 → 下一题，进度点与计分）
   - 讲稿播放条（播放/暂停/上一拍/下一拍/1·1.5·2 倍速，beats 与板书视觉事件 1:1 对齐，播放时逐块揭示板书）

所有新增逻辑均为**本地确定性**（不新增 AI 调用），遵循项目铁律"AI 功能必须带本地确定性兜底"。

---

## 3. 实现明细

### 3.1 P0-1 完课闭环（任务 #5）

- 新组件 `frontend/src/components/course/CourseCompleteCard.vue`（约 310 行）：`role="dialog"` 遮罩弹层，奖杯 SVG、四项统计（学习场景 / 板书讲解 / 完成答题 / 答题正确率，正确率按 80/50 分档配色）、分场景正确率条形分解、三个动作（再学一次 / 返回编排调整 / 留在本页）。
- `CourseExperience.vue` 接入：会话级进度状态（`visitedSceneIds / quizResults / boardAnswerCounts / finished`），`completionStats` 计算属性汇总；`finishCourse / restartCourse`；footer「完成课程，查看学习报告」按钮；小测最后一题在末场景直接触发完课。
- 会话级状态不写库、刷新即重置——与"学习记录仅保留在本机"的提示语一致。

### 3.2 P0-2 小测作答交互（任务 #6）

- 逐题舞台：一题一呈现（`quiz-stage`），进度点（done/active/correct 三态）、题号计数、已答对计数。
- 交互链：点选选项（`selected` 态，`role="radio"` + `aria-checked`）→「提交答案」→ 立即判定（`quiz-verdict`：正确 / "再想想：正确答案是 X"）→ 展开解析 →「下一题」；判定后选项锁定（`correct/wrong` 着色 + `disabled`）。
- 判定结果写入 `quizResults`（供完课统计与分场景分解）；板书内嵌问题经 `onBoardAnswer` 按场景去重计数。
- 未选选项时提交给出 ElMessage 警告（`submitQuizAnswer` 兜底）。

### 3.3 P0-3 播放控制条 + 讲稿分拍（任务 #7）

- `lesson-toolbar` 内新增 `playback-bar`：播放/暂停（`aria-label` 随态切换）、上一拍/下一拍（边界禁用）、`beatIndex+1/beats.length` 计数、倍速循环 1× → 1.5× → 2×。
- 播放时自动展开讲稿层（`scriptOpen=true`），`scheduleBeat` 按 `max(300, pauseMs/speed)` 推进；问句 beat 的停顿（pauseMs）即等待时长。
- **板书逐块揭示**：`syncReveal` 按 beat.blockId 找到对应 block，把 `visibleCount` 推到该块序号——讲稿与板书视觉事件严格 1:1；`revealedCount` 只增不减（回退不掩盖已讲内容）。
- 讲稿列表高亮当前拍（`active`）、问句拍显示"停 X.Xs"、点击任意拍跳转并同步揭示。

### 3.4 P1-4 题目质量校验码 + 修复（任务 #8）

`frontend/src/utils/courseValidator.js`：

- 新增内容级检查 `validateQuizContent(scenes)`，返回 `{code, severity, target, message, fix, hint}`：
  - `QUIZ_DUP_OPTION`（error）：选项重复，携带确定性修复 `{options: 去重后, answerIndex: 重映射}`
  - `QUIZ_SINGLE_ANSWER`（error）：多个下标等于 answerIndex（多选不唯一）
  - `QUIZ_OPTION_COUNT`（warning）：选项 < 3；**判断题豁免**（对/错/是/否/true/false… 成对出现时不触发，`isJudgePair()`）
- `CONSTRAINT_CODES` 增至 13 项，导出 `QUIZ_QUALITY_CODES`。
- `frontend/src/utils/courseRepair.js`：`repairSceneContent` 新增 `QUIZ_DUP_OPTION` 确定性分支（应用 fix 并留痕 RepairRecord）。
- `frontend/src/api/courseStudio.js`：`compileSceneContent` 在修复前并入 `validateQuizContent` 结果；修复后复检题目质量，回传 subjectIssues。
- 测试（`scripts/test-course-compiler.mjs` 新增 [6.5] 节 3 项）：STRUCT_MIN_SCENES 检测不阻塞 passed；QUIZ-* 三类检出 + 判断题豁免；QUIZ_DUP_OPTION 修复（去重 + 答案重映射，复检 0 error，剩余 option-count warning 留模型）。

### 3.5 P1-3 场景结构下限（任务 #9）

- `SCENE_TYPE_MINIMUMS = {lecture: 2, quiz: 1, practice: 1, review: 1}`、`SCENE_TOTAL_MINIMUM = 8`；`checkSceneStructure(plan)` 仅产 warning（缺类型点名缺失类型、总数不足报 "至少 8 个"），接入 `validateCoursePlan`。
- 设计取舍：**warning 不阻断**——结构问题是"建议模型重规划"的信号，硬阻断会把偶发小课一棍子打死；COMPILER 铁律"COVERAGE 不做确定性修复，留给模型"同理延伸。

---

## 4. 自动生成系统性课程内容（任务 #10）

### 4.1 生成工具链（无 pinia、可在 node 直跑）

- `frontend/scripts/generate-demo-course.mjs`（约 330 行，`npm run gen:demo-course`）：
  - DeepSeek OpenAI 兼容适配（json_object，150s 超时，读 `frontend/.env`）；`requestJson` 带一次结构修复重试
  - 两阶段真实模型管线：**阶段 1** `courseBlueprintPrompt` → `normalizeCourseBlueprint` → `planFromBlueprint` → `validateCoursePlan` → `repairCoursePlan` → 复检；**阶段 2**（并发 3）`courseScenePrompt` → `normalizeCourseSceneContent` → `compileScene`（subjectCheck + validateQuizContent + extractSceneClaims + repairSceneContent，阻断级 error 走模型修复）；**阶段 3** `courseScriptPrompt` → `normalizeCourseScript`（带 `buildLocalCourseScript` 兜底）
  - 出口：写 `src/mock/demoCourse.js`（`DEMO_COURSE_META` + `DEMO_COURSE_PROJECT`）；**场景为空或残留 error 级问题则非零退出**（生成质量门）
- `frontend/scripts/lib/alias-hooks.mjs` + `register-alias.mjs`：ESM resolve 钩子把 `@/` 映射到 src/、补 `.js` 扩展名——node 原生跑 vite 别名模块的关键基建（后续所有 node 侧工具复用）。

### 4.2 生成结果（真实数据，写入 `src/mock/demoCourse.js`）

| 指标 | 数值 |
| --- | --- |
| 课程 | 《计划职能：类型、过程与组织控制衔接》（第3章 决策与计划，management，45 分钟） |
| 场景 | **9**（4 板书 / 2 小测 / 2 案例应用 / 1 复盘），全部 ready |
| IR 校验 | **passed，errorCount 0，warningCount 0**，要求覆盖率 1，时长偏差 2 分钟 |
| 题目 | 6 题（4 选单选 + 2 选判断混合；无重复选项） |
| 讲稿 | 127 拍（问句 beat 带停顿标记，与板书 block 1:1） |
| 证据账本 | 53 条声明，支持率 34%（未支持声明按设计不伪造、留给教师复核） |
| 板书 | 43 blocks，8 种块型（outline/definition/table/diagram/callout/question/classification-tree/wrong-first） |
| 模型调用 | blueprint 1 + scene 9 + script 9 = 19 次；**修复调用 0、兜底 0**（首轮生成即过全部门禁） |
| 生成时间 | 2026-11-08T16:11:55Z，model = deepseek-chat |

生成过程中暴露并修复的真实问题（见 §5.2）：判断题被 `QUIZ_OPTION_COUNT` 误伤 → 增加 `isJudgePair()` 豁免；场景数 7 < 8 触发 STRUCT_MIN_SCENES → 以 `--minutes 45` 重生成得 9 场景零 warning。

### 4.3 开箱体验：首次进入自动注入

- `stores/courseStudio.js` `load()`：本机无任何课程时动态 import 演示课程并落库（`persist()`），try/catch 兜底；`ownerId: 'demo'` **不参与** `latestFor(userId)` 的"最近课程"自动选中，只在列表展示（带「演示」徽标，`CourseStudio.vue`）。
- 效果：发布链接（`?sharecode=…`）首次打开即有完整体验路径 `/learn/course-demo-mw815lqq`——小测、播放、完课报告全部可用；用户生成自己的课程后互不干扰。

---

## 5. 执行结果与发现的问题（迭代输入）

### 5.1 全量验证实跑（2026-11-09）

| 套件 | 结果 | 备注 |
| --- | --- | --- |
| `test:course-compiler` | **44/44** | 含 [6.5] 新增 3 项（STRUCT/QUIZ/修复） |
| `test:course-script` | 36/36 | beats/停顿契约 |
| `test:openmaic` | 36/36 | 上游资产同步与场景适配 |
| `test:text-repair` | 48/48 | 乱码修复 |
| `test:visualization` | 26/26 | 板书可视化 |
| competition 套件 | 通过 | 赛方数据工作台 |
| **E2E（Playwright）** | **39/39** | 新增「演示课程支持小测作答、讲稿播放与完课报告」；修复 2 处既有断言（§5.2） |
| 生产构建 | 通过（2.35s，bundle 1.08MB / gzip 349KB） | 既有 chunk 体积告警未恶化 |
| 深链接 | `/learn/course-demo-mw815lqq` → **200**，引用最新 bundle 哈希 | 按项目约定 `npm run build && node server.mjs`（4173）验证 |

### 5.2 执行结果暴露的 3 个问题及修复（已闭环）

1. **判断题误伤（设计缺陷）**：生成的 6 题中有一道合法判断题（对/错，2 选项）触发 `QUIZ_OPTION_COUNT`。修复：`isJudgePair()` 豁免成对判断词；补单测；重新生成干净产物。——教训：**质量码必须覆盖合法的小题型变体，否则会把好内容打成坏内容**。
2. **E2E 编译器用例 strict mode 冲突（测试缺陷）**：演示课程标题同时出现在 el-select 已选项与其 teleport 浮层拷贝中，`getByText` 解析到 2 个元素。修复：`.first()` + 注释说明浮层拷贝来源。——教训：**teleport 到 body 的 EP 组件会让全文 getByText 不稳定，断言要加 `.first()` 或限定容器**。
3. **场景数非确定性（生成工具局限，v2 已加固）**：同一提示词首轮生成 7 场景（触发 7<8 warning），`--minutes 45` 重生成得 9 场景零 warning。v1 仅人工重跑；**v2 已在生成器内建自动重试**（归一化失败或复检残留违规时带修复提示重试一次蓝图，验收规则见 §11），保留 9 场景产物不变。

### 5.3 既有两个测试断言的适配（非缺陷）

- 「课程编译器可在无项目时运行离线实验」原断言空态文案「还没有已编译的课程」——演示课程注入后空态不再出现，改为断言演示课程标题可见（空态文案保留在代码中，无课程时仍走该分支）。
- 演示项目 id 为 `course-demo-mw815lqq`（时间戳生成），E2E 深链测试硬编码该 id——**若重新生成 demo 课程，需同步更新该测试**（已在测试注释与 §8 遗留中标注）。

---

## 6. 关键设计决策留档

| 决策 | 取舍 |
| --- | --- |
| 新质量码分级：QUIZ_DUP_OPTION/SINGLE_ANSWER 为 error，OPTION_COUNT 为 warning | 重复选项/答案不唯一会直接破坏作答判定（error）；选项少是体验问题（warning） |
| QUIZ_DUP_OPTION 只做确定性修复，OPTION_COUNT 留给模型 | 去重可机械完成且语义安全；"补足选项"需要内容创造力，铁律"COVERAGE 类不做确定性修复"的延伸 |
| STRUCT_MIN_SCENES 为 warning 不阻断 | 结构不足应提示重规划而非判死刑；与 coverage 铁律一致 |
| 学习进度会话级、不写库 | 完课统计是"本次学习"的仪式感数据；写库会引入隐私与同步复杂度，与卡片提示语一致 |
| 播放揭示只增不减（`Math.max`） | 回退拍时不掩盖已讲内容，避免"板书倒退"的观感断裂 |
| demo 课程 ownerId='demo' | 不污染"最近课程"自动选中（latestFor 按 ownerId 过滤），但保留在列表可见 |
| 生成工具独立于 pinia（node 直跑） | 生成是离线研究动作，复用 store 会拖入浏览器依赖；别名钩子基建让 node 可跑 src 模块 |

---

## 7. 发布计划（任务 #14，执行中）

| 通道 | 状态 | 说明 |
| --- | --- | --- |
| GitHub（mygithub / Cloud-Mars-ai/zhuxue-agent） | 待提交推送 | 仅推 `mygithub`（origin 无写权限）；提交前确认无并行会话 WIP 吞并（本仓 42 提交基线） |
| WorkBuddy 云发布（wbapp_VcMqXrvl668JPEwXlPHsxU） | 待发布 | 复用既有应用；**需用户明确发布授权**（发布技能硬规则，不得凭历史同意部署） |
| 腾讯云服务器（152.136.121.153） | 待同步 | `scp -r` dist/ + 两个 .mjs → `pm2 restart zhuxue-agent`；服务器上 curl 127.0.0.1:4173 验证新 bundle 哈希 |
| DNSPod A 记录（zhuxue.wppjkw.online） | 仍待用户操作 | 与 T-19 台账一致，非本轮阻塞项 |

---

## 8. 遗留与下一步

| 项 | 级别 | 说明 |
| --- | --- | --- |
| 交互数轴（P1-1） | P1 | 策略报告④列项，本轮未做（工作量集中在 P0 + 编译器门）；建议作为 T-22 主题 |
| 问题气泡 / TTS（P2） | P2 | 依赖 TTS 配额与气泡组件设计，排入 T-23+ |
| demo 课程 id 硬编码 | 小 | `course-demo-mw815lqq` 被 E2E 引用；重新生成 demo 需同步测试（§5.3） |
| bundle 体积 | 观察 | index chunk 1.08MB（gzip 349KB），路由懒加载已生效；后续可拆 compiler/openmaic 大依赖 |
| src/stores/model.js 硬编码 Step API Key | **高（历史遗留）** | 需负责人轮换，与本轮无关但仍在待办榜首 |

---

## 9. 交付物清单

| 类别 | 文件 |
| --- | --- |
| 新组件 | `frontend/src/components/course/CourseCompleteCard.vue` |
| 主改造 | `frontend/src/views/CourseExperience.vue`（+约 480 行：小测/播放/完课） |
| 编译器 | `frontend/src/utils/courseValidator.js`（+4 码 + 两个检查函数）、`frontend/src/utils/courseRepair.js`（QUIZ_DUP_OPTION 修复）、`frontend/src/api/courseStudio.js`（题目质量接入） |
| 生成工具 | `frontend/scripts/generate-demo-course.mjs`、`frontend/scripts/lib/{alias-hooks,register-alias}.mjs`、`frontend/package.json`（gen:demo-course） |
| 生成产物 | `frontend/src/mock/demoCourse.js`（9 场景课程，约 178KB） |
| 商店/列表 | `frontend/src/stores/courseStudio.js`（首注入演示课程）、`frontend/src/views/web/CourseStudio.vue`（演示徽标） |
| 测试 | `frontend/scripts/test-course-compiler.mjs`（+3 项）、`frontend/tests/e2e/critical-flows.spec.js`（+1 用例 / 修 2 处断言） |
| 研究输入 | `docs/research/` 四份报告（OpenMAIC 产品 / 双视频逐帧 / 优化策略） |
| 本报告 | `docs/release/PROJECT-REPORT-2026-11-08.md` |

---

## 10. 迭代记录（v1 → v2）

v1 报告依据 §5 执行结果（全量验证 + 问题发现）做了一轮项目与报告的双向迭代：

| # | 执行结果发现 | 项目侧迭代 | 报告侧迭代 |
| --- | --- | --- | --- |
| 1 | §5.2-1 判断题被 QUIZ_OPTION_COUNT 误伤 | v1 已修：`isJudgePair()` 豁免 + 单测 + 重新生成干净产物 | §3.4 / §5.2-1 留档（设计缺陷→豁免的完整链路） |
| 2 | §5.2-2 E2E strict mode 冲突（teleport 浮层拷贝） | v1 已修：`.first()` + 注释 | §5.2-2 留档（EP teleport 断言教训） |
| 3 | §5.2-3 / §8 场景数非确定性、生成器无重试策略 | **v2 新增**：`generate-demo-course.mjs` 阶段 1 两级重试——① 归一化失败带结构修复提示重试一次；② IR 复检残留违规（如 STRUCT_MIN_SCENES）带违规明细重试一次蓝图。验收按 `(errorCount, violationCount)` 字典序**严格更优**才接受（绝不用 error 换 warning，对齐修复循环铁律），否则保留首轮。`node --check` + 5 组验收规则单测通过；演示课程产物（9 场景）不变，重试逻辑服务于后续重生成 | §5.2-3、§8 同步更新 |
| 4 | 报告数据需与实跑对齐 | —— | §5.1 全量验证表按 2026-11-09 实跑复核（44/36/36/48/26/competition 通过、E2E 39/39、build、深链接 200） |

**v2 定稿结论未变**：P0/P1 全部落地，自动课程过全部门禁，测试全绿；剩余为发布收口（#14）与遗留项（§8）。

---

## 11. 结论

本轮把项目从"内容生成系统"推进为"可学习、可验证、可发布"的完整产品形态：**P0 三项学习者闭环 + P1 两项编译器质量门全部落地；真实模型自动生成 9 场景系统课程并通过编译全部部门禁（0 error / 0 warning）；6 套 node 套件 + 39 项 E2E + 生产构建 + 深链接全绿**。剩余工作仅为收口：提交推送（#14）、发布授权。发布机制三通道均已在 T-19/T-20 验证可用，无技术风险。
