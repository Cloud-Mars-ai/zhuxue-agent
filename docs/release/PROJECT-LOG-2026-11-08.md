# 项目日志 · 2026-11-08（材料上传四项需求 + 板书交互态修复 + T-21 学习者闭环与自动课程生成 + T-22 OpenMAIC 对齐三诊断修复 + T-23 学科教学画像）

> 编制：WorkBuddy ｜ 编制时间：2026-11-09（T-23 追加）
> 事实基准：`git main = 7df7fa4`（T-22 已提交并推送 mygithub），**T-23 工作树待提交**（见 §6）；git 历史共 44 提交（`git rev-list --count HEAD` 实勘）；本文档自身的提交会使总数 +1，以实时复验为准
> 上游日志：`docs/release/PROJECT-LOG-2026-11-07.md`（T-19 及以前）；冲突时以本日志 + 代码为准

---

## 0. 读数面板（30 秒判断项目所处阶段）

| 读数 | 当前值 | 判断 |
| --- | --- | --- |
| 代码基线 | `main = 7df7fa4`（T-22 已提交并推送 mygithub，见 §5）；**T-23 学科画像已在工作树完成（19/19 新套件 + E2E 39/39），待提交** | 接手先看 §6 |
| 工作树 | T-23 改动（16 改 + 8 新）；无并行会话未提交改动 | 提交前无需再确认归属 |
| 确定性测试 | E2E **39/39**（T-23 实跑）；node 8 套件全绿：compiler 44 / script 36 / openmaic 36 / text-repair 48 / visualization 26 / competition / alignment 17 / **pedagogy 19（T-23 新套件）** | 回归基线健康 |
| 本机 .env | `frontend/.env` 已配 DeepSeek key（用户侧接入，gitignore） | **E2E 必须显式置空 key 跑**（见 §3），且**跑前确认 4173 无遗留服务**（§6 E2E 排故） |
| 公网三通道 | T-21 已全部同步：GitHub `c6d8876`；workbuddy 分享链接 `https://zhuxue-agent.app.workbuddy.host/?sharecode=Z7X276B67K`（verified）；腾讯云 4173 新 bundle（Ca65O6_p）验证 200。**T-22/T-23 尚未同步到 workbuddy/腾讯云两通道**（未获发布授权，见遗留） | 代码通道领先两个发布通道两个提交 |
| 阶段判断 | T-23（学科教学画像：三层自适应 + 五域 + 6 新资源）完成 → 遗留项：资源库偏科补齐 / timeline 数据注入 / 策略 A/B 实验 / Step Key 轮换（最高优先级） | 下一步：按 §6 遗留表推进 |

---

## 1. T-20 台账：材料上传四项需求（用户截图反馈）

| 项 | 内容 |
| --- | --- |
| 需求 | ① 上传的文件要能够删除；② 能上传多个文件；③ 上传后先解析文件再继续下一步（解析成功才允许生成）；④ 生成课程时一定要真正利用这个资料 |
| 根因（④） | OpenMAIC 四类场景模板占位符只有 title/description/keyPoints/teacherContext/languageDirective，**无材料插值位**；teacherContext 只承载规则——场景阶段模型根本看不到资料正文 |
| 方案（④） | 不改上游模板（字节级同步铁律）：新增 `withReferenceMaterial(aiCall, materialText, {maxChars:4000})` 装饰器，在 user 消息末尾附「【参考材料 · 必须依据】」块；空材料恒等返回；slide/quiz/interactive 三路统一（`courseStudio.js` 场景 aiCall 包装） |
| ①② | 卡片点击行为二分：无文件 → 开选择器（支持多选）；有文件 → 开浮层（每份文件名 + 「已解析 N 字 · 清理乱码 N 处」+ 逐份 × 删除（确认弹窗 → 知识库真删除）+ 「+ 继续上传（可多选）」+ 提示语）；遮罩点击外部关闭 |
| ③ | 上传即 `importMaterialFile`（提取 + 乱码修复）→ 成功才 `addMaterial`（失败文件不入库、不进生成上下文）；解析期间卡片显示「解析中…」且 `askHero` 门控拒绝生成；**解析期间不弹浮层**（浮层遮罩会挡住「正常上课/输入主题」等下一步操作——第一版曾因此被 E2E 抓出） |
| 单一事实源 | 卡片文件列表从知识库 `kind` 派生；废弃 localStorage `ai-tutor-home-uploads` 双轨（删除不同步/显示过期）；旧数据一次性按「入口名 · 文件名」标题回填 kind 后清键 |
| 文件 | `views/web/CourseHome.vue`（主改造）、`api/openmaic/sceneGenerator.js`（withReferenceMaterial）、`api/openmaic/index.js`（导出）、`api/courseStudio.js`（包装 + teacherContext 规则锚定）、`stores/knowledge.js`（addMaterial 溯源字段 kind/sourceName/repairedChars）、`tests/e2e/critical-flows.spec.js`（新用例）、`scripts/test-openmaic-pipeline.mjs`（F7）、`playwright.config.js`（离线契约）、`components/BoardCanvas.vue`（连带修复） |
| 验证 | 单测 36/36（F7：空材料恒等/system 不动/user 附块/maxChars 截断）；E2E 38/38（新用例覆盖多选 → 「等 2 份」→ 浮层两份「已解析」→ 删一份（确认弹窗）→ 遮罩关闭 → 卡片回单文件）；全量回归 6 套件不破；build 通过 |
| 文档 | 设计文档 §4.5 新增「场景级材料注入」（根因/方案/配套体验），§6 增补 4000 字截断局限，§7 更新为 36 项 |

## 2. 连带修复：板书交互态被误清（既有缺陷，E2E 暴露）

- **现象**：E2E「课程生成会按内容推断年级」点击「下一步」后计数从 2/3 回弹 1/3；干净树（7bffa1a）复现，非 T-20 引入
- **根因**：`updateScene`（讲稿/证据/修复记录补写）经 `repairDeep` 深拷贝 content → 同一板书被替换出新对象；BoardCanvas 按 `props.lesson` **对象标识**监听 → 交互态全清（答题选择、动画步进、揭示进度）
- **修复**：改为按**板书稳定签名**（章节/标题/副标题/block 结构）监听——同板书深拷贝不触发，真换场景才重置（`BoardCanvas.vue` lessonSignature）
- **调试方法留档**：node + @playwright/test 写复现脚本，轮询 `.animation-count` + 监听 `/api/ai/chat` 请求，命中「点击后 200ms 出现 2/3 随即回弹 + 后台再来一批生成请求」

## 3. 环境坑（本机沙箱 + 本仓特有，实测）

1. **E2E 离线契约**：`frontend/.env` 配了 DeepSeek key 后，服务端代理会真调模型——断言「演示缓存/本地生成大纲」的用例全漂移（首跑 10 败）。`server.mjs` 的 .env 解析器不覆盖已定义变量，故 `DEEPSEEK_API_KEY= node server.mjs`（空串）即回 offline-fallback；已在 `playwright.config.js` webServer.env 显式置空 DEEPSEEK/STEPFUN key 固定契约
2. **playwright webServer 在本沙箱不可用**：`npm start` 内的 `vite build` 被 node-safe-delete-shim 拦（emptyDir 失败）→ webServer 起不来；沿用「手动起服务 + `reuseExistingServer` 复用」模式，且**起服务与测试须同一条 Bash 命令**（后台进程跨调用不存活；任务结束后服务成孤儿存活，复用前先确认端口）
3. **git 行尾**：本仓 autocrlf 导致 `git show` 产物（LF）与工作树（CRLF）不可直接 merge-file——先 `tr -d '\r'` 归一再合并
4. **并发会话协作**：T-20 验证期间另一会话在改 courseValidator/courseRepair/CourseExperience 等（QUIZ-* 题目质量校验，未提交）。处理：`git stash` 暂存本方改动 → 干净树对照实验 → 用 `git merge-file` 三方合并共享文件（courseStudio.js，双方 hunk 不重叠）→ 本方文件 `git checkout stash@{0} --` 恢复 → **只暂存本方 10 文件**（共享文件用 `hash-object` + `update-index --cacheinfo` 提交本方版本，对方改动留在工作树未暂存）→ 提交信息注明并行会话存在。**切忌 `git commit -a`**（会吞并对方 WIP）

---

## 4. T-21 台账：P0 学习者闭环 + P1 编译器质量门 + 真实模型自动课程生成（2026-11-09 追加）

| 项 | 内容 |
| --- | --- |
| 输入 | `docs/research/` 四份报告（OpenMAIC 产品调研 / 双视频逐帧分析 / 优化策略④）+ 用户指令「完善项目 → 自动生成系统性课程 → 完整项目报告 → 按执行结果迭代 → 上传 GitHub 并发布 → 更新日志」 |
| P0-1 完课闭环 | 新组件 `src/components/course/CourseCompleteCard.vue`（统计 / 分场景正确率 / 再学一次·返回编排·留在本页）；`CourseExperience.vue` 会话级进度（visitedSceneIds / quizResults / boardAnswerCounts）+ `completionStats`；footer「完成课程」入口 |
| P0-2 小测作答 | 逐题舞台：进度点 / 计分 / 选择→提交→判定→解析→下一题；判定后选项锁定（correct/wrong 着色）；板书内嵌问题按场景去重计数（onBoardAnswer） |
| P0-3 播放控制 | playback-bar：播放/暂停 / 上一拍 / 下一拍 / 1·1.5·2 倍速；beats 与板书视觉事件 1:1，`syncReveal` 按 beat.blockId 逐块揭示（只增不减）；播放自动展开讲稿层 |
| P1-4 题目质量码 | `validateQuizContent`：QUIZ_DUP_OPTION / QUIZ_SINGLE_ANSWER（error）+ QUIZ_OPTION_COUNT（warning）；重复选项确定性修复（去重 + 答案下标重映射，`repairSceneContent` 分支）；判断题成对词豁免 `isJudgePair()`（对/错/是/否/true/false…）——首轮生成曾把合法判断题误伤，豁免后重生成 |
| P1-3 结构下限 | `STRUCT_MIN_SCENES`：类型下限 lecture 2 / quiz 1 / practice 1 / review 1 + 总数 ≥ 8，warning 不阻断（场景创造属模型侧，与 COVERAGE 铁律同理） |
| 自动生成 | `scripts/generate-demo-course.mjs`（`npm run gen:demo-course`）：DeepSeek 真实模型两阶段管线，无 pinia；ESM 别名钩子 `scripts/lib/`（`@/` + 扩展名）让 node 直跑 src 模块；产物 `src/mock/demoCourse.js`：9 场景（4 板书/2 小测/2 应用/1 复盘）、IR 0 error 0 warning、6 题、127 拍、53 条证据（支持率 34%）、19 次模型调用 0 修复 0 兜底 |
| 开箱体验 | `stores/courseStudio.js` `load()` 首注入演示课程（ownerId='demo' 不参与最近课程自动选中）；`CourseStudio.vue` 演示徽标；深链接 `/learn/course-demo-mw815lqq` |
| 执行结果问题（3 个，均闭环） | ① 判断题被 QUIZ_OPTION_COUNT 误伤 → isJudgePair 豁免 + 单测；② E2E strict mode 冲突（el-select teleport 浮层拷贝演示课程标题）→ `.first()`；③ 场景数非确定性（首轮 7<8）→ 生成器阶段 1 两级重试（归一化失败 / 复检残留违规各重试一次，验收按 (errorCount, 违规数) 字典序严格更优，不用 error 换 warning） |
| 报告 | `docs/release/PROJECT-REPORT-2026-11-08.md`（完整项目报告 v2，含 §10 迭代记录） |
| 验证 | node 6 套件全绿（compiler 44 / script 36 / openmaic 36 / text-repair 48 / visualization 26 / competition）；**E2E 39/39**（新增「演示课程支持小测作答、讲稿播放与完课报告」）；build 通过；本地 + 服务器深链接 200 |
| 发布 | 提交 `c6d8876`（19 文件，+7012）推送 mygithub；workbuddy 发布复用 wbapp_VcMqXrvl668JPEwXlPHsxU（`https://zhuxue-agent.app.workbuddy.host/?sharecode=Z7X276B67K`，verified）；腾讯云服务器已同步（dist 替换 + pm2 restart，新 bundle 哈希 Ca65O6_p 验证 200） |
| 遗留 | 交互数轴（P1-1）、问题气泡/TTS（P2）；demo 课程 id 硬编码于 E2E（重生成需同步测试）；src/stores/model.js 硬编码 Step API Key 需负责人轮换 |

---

## 5. T-22 台账：OpenMAIC 输出对齐三诊断修复 + 视频报告四维度重构（2026-11-09 追加）

| 项 | 内容 |
| --- | --- |
| 输入 | 用户指令「再次查看视频，重新修改两份视频的深度研究报告，从语言风格、界面排版、美学设计和逻辑条理四个维度进行系统性对比与重构」+ 三大核心差异排查（模型输出对齐 / 真实图片缺失 / 交互动画） |
| 视频复核 | 对两份视频新增 23 帧全分辨率复核（OpenMAIC 17 帧 + native 6 帧），**修正 12 处场景归属误记**：报告② s_029–s_032 实为火箭三栏页（非城市天际线）、s_049–s_064 场景 1→2、s_065–s_076 场景 3、s_077–s_080 小测开始页（非切换卡）、s_081 答题中 0/3（非 3/3）、s_117 场景 8、s_125–s_132 场景 9（右侧图片位带叉空框）、s_133 起场景 10 深色数轴交互、s_149–s_166 场景 11→13、s_167 起完课；报告③ s_033–s_041 场景 04→05、s_073–s_080 场景 04 回看、s_081–s_084 场景 05 小测 Q6、s_042 非三栏（实为路线图+关系图模板） |
| 新证据 | 报告③新增：小测 Q6 选项 B/C/D 文字完全相同（E1，与报告② B1 同类）+ Q2 解析「无理不循环小数」/Q1 解析数字游走（E2）；用户场景 chips 跳看序列 01→02→04→05→06→01→02→04→05（导航真实可用） |
| 诊断一修复 | board.js 白名单 16→19 种（chart/columns/illustration）+ ChartBlock.vue（bar/line/pie，chartType 映射）；slideAdapter detectColumns 多栏保留 + 四级图片映射 + illustration 前置保视觉锚点；sceneGenerator widget-config → simulation 映射（**requireKeywords 严格模式**防「抛体运动」误配圆周运动）；knowledgeVisualization 新增 square-root 模型 + SquareRootSim.vue（对齐视频 s_098）；提示词轻量媒体契约（assignedImages 目录 + imageElementEnabled） |
| 诊断二修复 | 新增 illustrationScenes.js（8 场景注册表，关键词打分）+ 9 个 illustration SFC（viewBox 320×180，--board-* 主题变量）+ IllustrationStage 分派；**illustration block 白名单强校验**（注册表外 id 拒收）——不追文生图，从契约上杜绝占位符/叉号/外链图（结构性规避报告② B2 事故） |
| 诊断三修复 | 新增 tween.js 补间基元（rAF + 五曲线 + 可注入 scheduler/now，node 可确定性测试）；NumberLineSim 连续拖拽 + 松手吸附整数 + emit 双向同步 + watch props.params 280ms 补间（修复「拖了没反应」——ref 只初始化一次）；BoardCanvas 级联 stagger（70ms/360ms 封顶）；CourseExperience 场景过渡 + verdict-pop/shake/rise 判定动效；SimulationStage 滑块填充轨道 + 数值翻牌；全部支持 prefers-reduced-motion |
| 文档 | 报告②/③ v2 四维度重构（各新增 §3 四维度评估：语言风格/界面排版/美学设计/逻辑条理，含评级表）；新增 `docs/release/IMPROVEMENT-REPORT-2026-11-08.md`（三诊断 + 根因 + F1.1–F3.5 落实清单 + T1–T9 验证 + §8 遗留 P1–P5） |
| 验证 | **新套件 test-alignment.mjs 16/16**（A 场景注册表/B 新块归一化/C 适配器映射/D widget→simulation/E tween）；7 套件全绿（compiler 44 / script 36 / openmaic 36 / text-repair 48 / visualization 26 / competition / alignment 16）；build 通过；**E2E 31/31** |
| 发布 | 提交 `dd08aed`（31 文件，+2800/-283）推送 mygithub；workbuddy/腾讯云两通道**尚未同步**（本次未获发布授权，见遗留） |
| 遗留 | P1 播放控制条（报告③ D5，超出对齐范围）；P2 小测后校验（选项去重+解析一致性+术语校对，报告② B1/报告③ E1E2，可在 courseValidator QUIZ-* 框架扩展）；P3 完课闭环增强（奖杯/数据卡/反馈）；P4 讲稿长列表分组折叠；P5 场景 03「数轴上的加法模拟」产品内验证（录制被跳看绕过）；**src/stores/model.js 硬编码 Step API Key 需负责人轮换（最高优先级，多轮遗留）** |

---

## 6. T-23 台账：学科教学画像——从数学单点增强到全学科通用教授流程（2026-11-09 追加）

| 项 | 内容 |
| --- | --- |
| 输入 | 用户指令「不仅仅只是对这个有理数知识点，增加特定的功能（图片、交互动画、模型等等）……他生成教授的科目不仅仅是这一门课，还有可能是文科、各种理科、工科等等。你需要针对不同的课程设计不同的一种教授方式流程，请你思考一个可行通用的方案」 |
| 方案 | **三层学科自适应**（设计文档 `docs/research/pedagogy-profile-design.md`）：话术层（提示词注入学科策略）+ 资源层（视觉/交互资源域标签过滤）+ 搭建图纸层（场景流程模板随域变化）；**不动 IR、不动场景四类型、不动 block 白名单**——契约面零增长，铁律（AI 只填 JSON/白名单强校验/本地兜底）全部延续 |
| 五大学科域 | `math-science` 演绎探究 / `engineering` 设计迭代 / `humanities` 叙事论辩 / `social-science` 案例决策 / `language-arts` 积累运用；每域携带 sceneFlow/pedagogy/visualHint/blockBias 四份策略文案；推断失败回落 `general`（不过滤资源、不注入策略，保证未知学科永不出错） |
| 域推断 | `inferPedagogyDomain({subject,domain,objective,materialText})` 三级确定性信号：domain 别名（math7→math-science 等，high）> subject 精确命中 > 关键词打分（subject×3，阈值≥2）；纯函数无模型调用 |
| 资源扩展 | 12 视觉场景（8 既有 + 新 timeline/map-region/pipeline/blueprint）+ 8 交互模型（6 既有 + 新 timeline-order/pipeline-flow），全部带 `domains` 域标签；空数组=通用资源；`timeline-order` 示范非参数型交互（params 空数组，数据走注册表 `data.events`，组件内部管理排序状态）；`pipeline-flow` 产能=min(来料,瓶颈容量)+堆积/溢出可视化 |
| 管线接入 | sceneGenerator 入口一次推断写 `sceneContext.pedagogyDomain`，三处共用（场景目录/交互模型/slide 插图）；slideAdapter image case 域过滤 + **src 直映射域校验**（防历史课渲染出平方根图示）；本地兜底 `ensureSimulationBlock` 与竞赛路径同步透传；`matchIllustrationSceneForDomain`/`matchSimulation(domainId)` 均为可选参数（默认 ''=不过滤，旧调用方行为不变） |
| 验证 | **新套件 test-pedagogy.mjs 19/19**（A 域推断/B 资源过滤/C 提示词注入/D 新资源白名单/E 管线接入含打桩 aiCall 断言目录过滤）；test-alignment 更新 8→12 场景计数 + 新增 A2b 学科场景断言（17/17）；8 套件全绿（pedagogy 19 / alignment 17 / openmaic 36 / visualization 26 / script 36 / compiler 44 / text-repair 48 / competition 3 cases）；build 通过；**E2E 39/39** |
| E2E 排故 | 首跑 8 败（课程生成类用例）——`git stash` 干净树复现同败 → 非本次回归；根因：**4173 端口有遗留 node 服务（带真实 DeepSeek key），`reuseExistingServer:true` 复用导致「本地生成大纲」离线契约断言漂移**；终止进程后全绿。留档：起过带 key 的服务后，E2E 前先确认端口 |
| 遗留 | 资源库覆盖仍偏科（语言艺术域仅通用场景、经管无专属交互模型）；`timeline-order` 数据为内置样例（换课文需注册表补数据）；五域策略文案未做 A/B 实验验证（实验台已具备四组对照能力，待排期）；workbuddy/腾讯云两通道仍未同步 T-22/T-23（未获发布授权）；Step API Key 轮换（最高优先级，多轮遗留） |

---

*本日志由 WorkBuddy 依据 git `7df7fa4`（44 提交，T-23 提交自身 +1 以实时复验为准）与代码实勘生成；与旧文档冲突时，以本日志 + `PROJECT-LOG-2026-11-07.md` + 代码为准。建议后续 agent 每次完成实质工作后追加台账条目（任务 / 日期 / 交付 / 验证 / 遗留），保持交接链不断。*
