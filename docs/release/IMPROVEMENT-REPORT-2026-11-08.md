# 改进报告：OpenMAIC 接入效果对齐与课程体验升级（2026-11-08）

> 项目：经管Agent（zhuxue-agent）｜ 撰写：深研研 ｜ 日期：2026-11-08（落实完成 2026-11-09）
> 关联输入：报告②《OpenMAIC 生成课程视频逐帧深度研究 v2》、报告③《本项目生成课程视频逐帧深度研究 v2》（docs/research/course-video-frame-review-*-2026-11-08.md）
> 落实状态：**全部改进任务已代码级落地，7 个测试套件全绿 + build 通过**

---

## 1. 背景与目标

同一提示词（「有理数→实数」七年级数学）下，对 OpenMAIC 生成课程与本项目生成课程做了同题视频逐帧对比（各 172s / 86s，1fps 全量抽帧 + 全分辨率深读），从**语言风格、界面排版、美学设计、逻辑条理**四维度系统评估后，确认本项目虽已接入 OpenMAIC 管线（flags.openmaicPipeline=true），但生成效果与对标视频存在三大核心差异：

1. **模型输出对齐问题**：OpenMAIC 视频中的图表、多栏版面、可操作交互模拟器，在本项目产物中被降级/丢失；
2. **真实图片缺失**：OpenMAIC 视频有真实照片与丰富图示，本项目产物中图片通道整体关闭；
3. **交互动画效果不佳**：本项目界面动效缺失或卡顿，交互反馈弱。

本报告给出三大差异的问题诊断、根因分析与改进方案，并记录全部改进任务的代码级落实情况。

---

## 2. 四维度对比结论（输入摘要）

| 维度 | OpenMAIC（报告②） | 本项目 v2 前 | 差距判定 |
| --- | --- | --- | --- |
| 语言风格 | 多智能体口语讲解，临场感强；小测选项重复（B1） | 讲稿 beats 五拍型严谨可审计；小测亦有选项重复（E1）+ 解析瑕疵（E2） | **互有长短**：保 beats 优势，补小测后校验 |
| 界面排版 | 三栏幻灯片、播放控制、笔记/对话双页签；单场景停留 31s 主次失衡（B3） | 板书板七件套模板统一、场景 chips 跳看可用；无播放控制（D5）、结尾长列表无折叠（D4） | 排版骨架接近，**缺控制条与折叠** |
| 美学设计 | 真实照片、韦恩图、深色数轴场景、统一紫色主题；图片占位符事故（B2） | 纸感浅色主题统一；素材单一、动效缺失（D6） | **差距最大**：图片与动效 |
| 逻辑条理 | 13 场景线性叙事 + 完课数据闭环（A1） | 六场景结构完整、收束板优秀；**无完课闭环**（D1） | **缺完课统计与反馈** |

---

## 3. 诊断一：模型输出对齐——图表/多栏/交互为何丢失

### 3.1 问题现象

- OpenMAIC 场景产物中的 `chart` 元素（柱状/饼图）进入本项目后**降级为静态表格**，可视化信息损失；
- 上游三栏卡片幻灯片（「核心问题/关键想象/课程目标」）的多栏版面被**拉平成单栏文本流**；
- OpenMAIC 视频 s_097–s_116 的核心亮点「可操作交互模拟器（求平方根）」在本项目管线中**只转成静态参数表**，交互性全部丢失。

### 3.2 根因分析

1. **block 白名单缺类型**：`utils/board.js` 的 `BOARD_BLOCK_TYPES` 只有 16 种，不含 `chart`/`columns`/`illustration`——适配器即使识别出图表/多栏，归一化阶段也会被丢弃或改写；
2. **适配器无映射通道**：`api/openmaic/slideAdapter.js` 对 chart 元素直接走表格兜底；对按 left 分桶的多栏文本无识别逻辑，全部进入单栏文本流；
3. **widget-config 无 simulation 映射**：OpenMAIC interactive 场景的 widget-config（变量/预设/联动）在 `sceneGenerator.js` 中只转成参数表，未接入本项目已有的 `utils/knowledgeVisualization.js` 模拟器注册表；
4. **提示词未请求媒体元素**：上游 `buildSlideContentPrompt` 默认 `imageElementEnabled=false`，模型不再产出版面插图指令。

### 3.3 改进方案与落实

| # | 改进项 | 落实文件 | 状态 |
| --- | --- | --- | --- |
| F1.1 | **chart block + ChartBlock.vue**：`BOARD_BLOCK_TYPES` 16→19 种（新增 chart/columns/illustration）；normalizeBlock 增加 chart 校验（labels≥2、序列≥2 数值）；chartType 映射 column/bar→bar、line/area/radar/scatter→line、pie/ring→pie；新建 `components/ChartBlock.vue`（bar/line/pie SVG，3 序列主题色，饼图负值钳 0） | `utils/board.js`、`components/ChartBlock.vue`、`api/openmaic/slideAdapter.js` | ✅ |
| F1.2 | **widget-config → 受控 simulation 块**：`widgetConfigToLesson` 末尾用注册表模型做语义匹配，命中则补 simulation 块；widget 变量名与模型参数重合时映射默认值（clampParams 收敛）；**requireKeywords 严格模式**杜绝「抛体运动」经「速度」误配圆周运动；新增 `square-root` 模型 + `SquareRootSim.vue`（a×a 方格阵列 + 数轴双标记）对齐视频 s_098 | `api/openmaic/sceneGenerator.js`、`utils/knowledgeVisualization.js`、`components/simulations/SquareRootSim.vue`、`components/simulations/SimulationStage.vue` | ✅ |
| F1.3 | **多栏版面保留**：`detectColumns(bodyTexts)` 按 left 分三桶（<340/340–680/≥680），一桶需宽 200–560px 且 ≥2 行，≥2 桶达标才产出 columns 块；首行 ≤12 字升 heading；consumed 集合防文本重复进 outline/definition；有 columns 时抑制 keyPoints 兜底 | `api/openmaic/slideAdapter.js`、`utils/board.js`、`components/BoardCanvas.vue`、`utils/boardNarration.js`、`utils/boardDownload.js` | ✅ |
| F1.4 | **轻量媒体契约**：`slideUserVariables.assignedImages` 从 `'None'` 改为场景目录文本；slide 调用改 `buildSlideContentPrompt({ imageElementEnabled: true })`，让模型恢复画布插图版面 | `api/openmaic/sceneGenerator.js` | ✅ |

---

## 4. 诊断二：真实图片缺失——媒体通道为何整体关闭

### 4.1 问题现象

OpenMAIC 视频中的真实照片（火箭发射 s_026）、函数图、韦恩图在本项目产物中完全缺失——本项目「已接入 openmaic 模型但生成效果与预期不符」的最直观差距。

### 4.2 根因分析

排查适配器全链路，发现**媒体通道四层全关**：

1. **无文生图后端**：上游 OpenMAIC 用 LLM prompt + 文生图 provider（10 个）生成真实照片；本项目无文生图服务，且产品铁律**禁外链图**（怕挂、怕审查、怕版权）；
2. **image 元素直丢**：`slideAdapter.js` 对 image 元素没有映射目标 block 类型，只能计入 `dropped.media`；
3. **提示词关闭**：`assignedImages='None'` + `imageElementEnabled=false`，模型侧也不再产出插图指令；
4. **无兜底**：媒体丢光后版面只剩文字，视觉锚点消失。

### 4.3 改进方案与落实

核心策略：**不追文生图，用内置确定性 SVG 场景库替代**——AI 只选场景 id，白名单强校验，从契约上杜绝占位符/叉号/外链图（正好避开 OpenMAIC B2 图片加载失败事故）。

| # | 改进项 | 落实文件 | 状态 |
| --- | --- | --- | --- |
| F2.1 | **场景注册表**：`utils/illustrationScenes.js` 纯数据 + 纯函数，8 个场景（rocket-launch/city-skyline/supply-demand/pdca-cycle/growth-chart/org-chart/square-root/balance-scale），`matchIllustrationScene(...sources)` 关键词打分 | `utils/illustrationScenes.js` | ✅ |
| F2.2 | **illustration block + IllustrationStage.vue**：8 个场景 SFC（viewBox 0 0 320 180，全部用 --board-* 主题变量，纸感统一）；normalizeBlock 对 illustration 做**场景 id 白名单强校验**（注册表外 id 拒收） | `utils/board.js`、`components/illustrations/*`（9 文件） | ✅ |
| F2.3 | **适配器四级图片映射**（优先级从高到低）：① `src` 是注册场景 id；② `mediaGenerations[].prompt` 按 elementId 查找后关键词匹配；③ 元素自身 `prompt/alt`；④ 本页标题+keyPoints 关键词对齐；对齐不了仍 `dropped.media++` | `api/openmaic/slideAdapter.js` | ✅ |
| F2.4 | **块顺序保障视觉锚点**：outline → columns → **illustration** → definition → tables → charts → diagrams → callouts，illustration 前置保证 8 块上限时不被裁 | `api/openmaic/slideAdapter.js` | ✅ |
| F2.5 | **契约提示词**：courseStudio blockContractGuide 增加 chart/columns/illustration 三条契约 + 版面推荐行 + JSON 示例；sceneGenerator assignedImages 目录化（F1.4 联动） | `api/prompts/courseStudio.js`、`api/openmaic/sceneGenerator.js` | ✅ |

---

## 5. 诊断三：交互动画——为何体验卡顿

### 5.1 问题现象

对照 OpenMAIC 视频的实时联动（滑块→面积方块缩放）、场景过渡、判定反馈，本项目界面动效缺失：模拟器控件拖了没反应、块入场生硬、场景切换瞬跳、小测判定无反馈。

### 5.2 根因分析

1. **ref 只初始化一次**：`NumberLineSim.vue` 的拖拽处理绑在初次渲染的 DOM 引用上，props.params 外部更新时控件无响应——「拖了没反应」的直接原因；
2. **无补间基元**：数值跳变无过渡，滑块/数轴标记瞬移；
3. **无级联与场景过渡**：BoardCanvas 块同时入场（信息平铺无节奏）；CourseExperience 场景内容瞬跳；
4. **滑块无视觉反馈**：原生 range 样式，无填充轨道/数值变化提示。

### 5.3 改进方案与落实

| # | 改进项 | 落实文件 | 状态 |
| --- | --- | --- | --- |
| F3.1 | **补间基元**：`utils/tween.js`（rAF 驱动，EASINGS 五种曲线，可注入 scheduler/now 供 node 确定性测试；duration<=0 或同值同步落值；返回 cancel 幂等） | `utils/tween.js` | ✅ |
| F3.2 | **NumberLineSim 交互重写**：连续拖拽（svgX 不再 round）+ 松手吸附整数并 emit('param') 双向同步 + watch props.params 280ms 补间 + glideTargets 防双补间 + onBeforeUnmount 取消 | `components/simulations/NumberLineSim.vue` | ✅ |
| F3.3 | **BoardCanvas 级联入场**：stagger 70ms 步进 / 360ms 封顶，与 transition.delayMs 相加；columns 块新增 .columns-grid 卡片样式 + 移动端单列 | `components/BoardCanvas.vue` | ✅ |
| F3.4 | **场景切换与判定动效**：CourseExperience `<Transition name="scene" mode="out-in">` + verdict-pop/verdict-shake/verdict-rise 关键帧 + prefers-reduced-motion 降级 | `views/CourseExperience.vue` | ✅ |
| F3.5 | **滑块视觉升级**：SimulationStage rangeFillStyle 产 `--fill` 填充轨道 + output 包 `<Transition name="slider-value">` 数值翻牌 + .sim-range 自定义轨道/滑块 CSS + reduced-motion | `components/simulations/SimulationStage.vue` | ✅ |

---

## 6. 测试与验证落实

| # | 验证项 | 结果 |
| --- | --- | --- |
| T1 | **新测试套件 `scripts/test-alignment.mjs`**（A 场景注册表 / B 新块归一化 / C 适配器映射含 chartType 与多栏 / D widget→simulation 含严格模式与 square-root / E tween 基元） | ✅ 16/16 通过 |
| T2 | `test-course-compiler.mjs`（课程编译器质量门） | ✅ 44/44 |
| T3 | `test-course-script.mjs`（白名单改名「19 种 block」+ 3 个新块 sample） | ✅ 36/36 |
| T4 | `test-openmaic-pipeline.mjs`（OpenMAIC 管线） | ✅ 36/36 |
| T5 | `test-text-repair.mjs` | ✅ 48/48 |
| T6 | `test-visualization.mjs`（matchSimulation 加 requireKeywords 后无回归） | ✅ 26/26 |
| T7 | `verify-competition.mjs` | ✅ 3 cases |
| T8 | `npm run build`（vite 生产构建，新增 9 个 illustration SFC + ChartBlock + SquareRootSim 全量编译） | ✅ 通过 |
| T9 | `package.json` 新增 `"test:alignment"` script | ✅ |

---

## 7. 与两份视频报告的直接对应

| 视频报告发现 | 本报告改进 | 落实 |
| --- | --- | --- |
| 报告② A2 可操作交互模拟（s_097–s_116） | F1.2 simulation 映射 + square-root 模型 | ✅ 本项目现在能产出同形态「被开方数 a 滑块 → a×a 方格 → 数轴标记」交互块 |
| 报告② A5 真实照片与图表 | F2.1–F2.5 内置 SVG 场景库（火箭/城市天际线等 8 场景对应视频视觉母题） | ✅ 版面恢复视觉锚点，且无外链/占位符风险 |
| 报告③ D6 视觉素材单一 | F2 + F1.1 chart block | ✅ |
| 报告③ D7 交互模拟缺位 | F1.2 + F3.2 | ✅ 静态数轴 → 可拖拽吸附模拟器 |
| 报告③ D5 无播放控制 / 报告② A7 | 见 §8 遗留事项 P1 | ⏳ 未做（产品级功能，超出本次对齐范围） |
| 报告② B1 / 报告③ E1 小测选项重复 | 见 §8 遗留事项 P2 | ⏳ 已定位（课程编译器 subjectCheck 域），排期处理 |
| 报告③ D1 无完课闭环 / 报告② A1 | 见 §8 遗留事项 P3 | ⏳ 需产品设计（奖杯/数据卡/反馈） |
| 报告② B2 图片占位符事故 | F2.2 白名单强校验从契约上杜绝 | ✅ 结构性规避 |

---

## 8. 遗留事项与后续建议

1. **P1 播放控制条**（报告③ D5）：板书播放加倍速/暂停/上一段下一段/进度条——需交互设计与 CourseExperience 播放态状态机，建议下一迭代；
2. **P2 小测题目后校验**（报告② B1、报告③ E1/E2）：在课程编译器 subjectCheck 增加「选项去重 + 解析-选项一致性 + 术语校对（如『无限不循环小数』）」三项确定性检查，与既有 9 约束码同框架落地；
3. **P3 完课闭环**（报告③ D1）：场景统计持久化 + 完课数据卡 + 反馈入口，需云 DB 表设计（course_history 模式可复用）；
4. **P4 讲稿长列表分组折叠**（报告③ D4）：beats 按拍型分组 + 「只读前 3 拍 + 展开」控件；
5. **P5 场景 03「数轴上的加法模拟」产品内验证**（报告③ R5）：录制被跳看绕过，需在产品内确认该场景交互形态是否符合预期。

---

## 9. 结论

本次改进完整落实了用户提出的三项核心要求：

1. **模型输出对齐**：图表不再降级、多栏版面保留、widget-config 恢复为可交互 simulation（含严格关键词匹配防误配）——OpenMAIC 视频中的三类高价值产物形态全部对齐；
2. **真实图片机制**：辨明上游依赖文生图 provider 后，改以「内置确定性 SVG 场景库 + 白名单强校验 + 四级映射 + 提示词契约」四位一体修复，从契约层面杜绝占位符/叉号/外链图；
3. **交互动画**：统一补间基元 + 模拟器连续拖拽吸附 + 块级级联入场 + 场景过渡 + 判定动效 + 滑块视觉升级，全部支持 prefers-reduced-motion 降级。

两份视频深度研究报告已按四维度（语言风格/界面排版/美学设计/逻辑条理）重构并校准时间线（报告②修正 s_049–s_166 共 8 处场景归属误记；报告③修正 s_033–s_086 共 4 处并新增小测缺陷证据）。7 个测试套件 209 项全绿、生产构建通过。播放控制、小测后校验、完课闭环三项产品级增强已列入后续迭代（§8）。
