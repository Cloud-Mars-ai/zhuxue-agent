# 学科教学画像（Pedagogy Profile）研究设计

状态：已实现并通过测试（19/19 单测、全量回归 8 套件、39/39 E2E）。
代码地图见第 9 节；复现方式见第 8 节。

## 1. 动机：从"数学单点增强"到"全学科通用教授流程"

项目此前的视觉/交互资源与提示词话术都是**数学向**的：交互模型只有 6 个理科模型
（圆周运动、数轴、分数、平方根……），学科检查器只有 math7 与管理两个域。但课程
生成系统要服务的是全部学科门类——历史课被硬套成"板书+公式"、英语课拿到数轴、
工科课没有流程图示，都是同一根因：**系统只有一种教授方式**。

用户需求原话：「他生成教授的科目不仅仅是这一门课，还有可能是文科，各种理科、
工科等等。你需要针对不同的课程设计不同的一种教授方式流程」。

本设计回答的问题是：**如何在不动 IR、不动场景四类型、不动 block 白名单的前提下，
让同一套课程生成管线拥有多种教授方式？**

## 2. 核心思路：三层学科自适应（渐进式，零破坏）

学科差异不新增任何渲染契约，只体现在既有结构的三个层面上：

```
┌────────────────────────────────────────────────────────────┐
│  话术层（prompts）                                          │
│  pedagogyGuide / pedagogyIdentity → 大纲与场景提示词注入     │
│  学科策略：场景流程模板 + 讲授侧重 + 视觉与交互建议            │
├────────────────────────────────────────────────────────────┤
│  资源层（utils）                                            │
│  视觉场景库（12）× 交互模型库（8）全部带 domains 域标签        │
│  匹配侧按域过滤：文科课不会点亮圆周运动，数学课不会配时间轴    │
├────────────────────────────────────────────────────────────┤
│  搭建图纸层（blueprint）                                     │
│  场景流程模板随域变化（演绎探究/设计迭代/叙事论辩/案例决策/   │
│  积累运用），场景类型与 block 白名单不变                      │
└────────────────────────────────────────────────────────────┘
                    ↓ 全部经过
        编译管线（验证/修复/证据账本）与受控渲染不变
```

**为什么不动契约**：场景四类型（lecture/quiz/practice/review）与 19 种 block 是
「AI 只填 JSON、白名单强校验」铁律的载体，也是跨设备一致性与离线可用的地基。
学科自适应如果靠新增 block 类型实现，等于把契约面扩大一倍，验证/渲染/讲稿全部要
跟着改。三层方案把学科差异压缩进**数据与提示词**，契约面零增长。

## 3. 五大学科域

| 域 id | 名称 | 教学范式 | 典型学科 | 场景流程模板（摘要） |
| --- | --- | --- | --- | --- |
| `math-science` | 数理科学 | 演绎探究 | 数学/物理/化学/生物/地理 | 动机→定义→推导→变式（配交互模型）→测验 |
| `engineering` | 工程技术 | 设计迭代 | 计算机/机械/电子/土木/AI | 工程困境→原理→设计（配流程模拟）→调试优化 |
| `humanities` | 人文历史 | 叙事论辩 | 历史/政治/地理/哲学/语文 | 时空情境→史料研读→多方观点→辨析应用 |
| `social-science` | 经管社科 | 案例决策 | 经济/管理/金融/法律/营销 | 案例困境→概念工具→分析框架→决策练习 |
| `language-arts` | 语言艺术 | 积累运用 | 语文/英语/写作/艺术/音乐 | 范例赏析→规则归纳→情境运用→创作鉴赏 |

每个域携带四份策略文案（`sceneFlow`/`pedagogy`/`visualHint`/`blockBias`），
由提示词层注入；域推断失败回落 `general`（通用）：**不过滤任何资源、不注入任何
策略**——保证未知学科永远能出课，且不会比学科画像上线前更差。

### 3.1 域推断（确定性，无模型调用）

`inferPedagogyDomain({ subject, domain, objective, materialText })` 三级信号：

1. **domain 别名**（最强）：`math7→math-science`、`management→social-science`、
   `history→humanities`、`cs→engineering`、`language→language-arts`；
2. **subject 精确命中**域内学科名（「初中历史」含「历史」→ humanities）；
3. **关键词打分**：subject 权重 ×3（领域声明比正文出现更可信）+ 正文/材料命中数，
   阈值 ≥2 才采纳。

全部落空 → `general`（confidence=low）。**推断必须宽容**：域推断只影响增益，
误判代价是策略不合适，课仍然出得来；因此低置信时优先 general，不做激进猜测。

## 4. 资源层：域标签与过滤语义

视觉场景与交互模型共享同一过滤契约（`resourceAllowedForDomain`）：

- 资源 `domains` 空数组 = **通用资源**，任何域可用（增长曲线/天平权衡/火箭发射
  这类跨学科母题）；
- `domains` 非空 = **仅声明域可用**（平方根面积模型只服务数理科学）；
- 调用方 `domainId` 为 `general`/空 = **不过滤**（向后兼容原签名）。

### 4.1 本次新增资源（6 个）

| id | 类型 | 域 | 教学母题 |
| --- | --- | --- | --- |
| `timeline` | 视觉场景 | humanities/language-arts | 历史时序、事件因果链 |
| `map-region` | 视觉场景 | humanities/social-science | 地理分布、疆域变迁 |
| `pipeline` | 视觉场景 | engineering/math-science | 工序流转、输入到输出 |
| `blueprint` | 视觉场景 | engineering | 结构制图、尺寸公差 |
| `timeline-order` | 交互模型 | humanities/language-arts | 点选事件按时间排序（params 空数组，数据走注册表 `data.events`） |
| `pipeline-flow` | 交互模型 | engineering/social-science | 来料速率/缓冲容量滑块 → 产能=min(来料,瓶颈)、堆积/溢出可视化 |

`timeline-order` 示范了**非参数型交互**如何契入既有契约：模型 `params` 为空数组
（无滑块），事件数据放注册表 `data` 字段，组件内部管理 `picked/nextExpected/done`
状态；board 契约（`type:'simulation'` + `model` id 白名单）完全不变。

## 5. 管线接入点（零破坏扩展模式）

| 文件 | 改动 | 兼容性 |
| --- | --- | --- |
| `utils/pedagogyProfiles.js` | 新建：五域注册表 + 域推断 + 过滤 + 提示词注入纯函数 | 新文件 |
| `utils/illustrationScenes.js` | 8 个既有场景加 `domains`；新增 4 场景；新增 `matchIllustrationSceneForDomain(domainId, ...)`，原 `matchIllustrationScene(...)` 委派它（domainId=''） | 原签名行为不变 |
| `utils/knowledgeVisualization.js` | 6 个既有模型加 `domains:['math-science']`；新增 2 模型；`matchSimulation` 加可选 `domainId`（默认 ''）；`ensureSimulationBlock` 透传 `context.pedagogyDomain` | 原签名行为不变 |
| `api/prompts/courseStudio.js` | 大纲提示词注入 `pedagogyGuide`；场景提示词注入 `pedagogyHint`（blockBias+讲授侧重）与 `pedagogyIdentity` | 无域时注入空串 |
| `api/openmaic/sceneGenerator.js` | `generateOpenmaicScene` 入口推断一次学科域写入 `sceneContext.pedagogyDomain`；`illustrationCatalog` 按域过滤；`widgetConfigToLesson` 的 `matchSimulation` 传 `domainId` | 不传 context 时域为 '' = 不过滤 |
| `api/openmaic/slideAdapter.js` | image case 改走 `matchIllustrationSceneForDomain(context.pedagogyDomain, ...)`；**src 直映射也过域校验**（模型引用域外场景 id 时退化为关键词匹配，防历史课渲染出平方根图示） | 不传域时行为不变 |
| `api/courseStudio.js` | 调用 `generateOpenmaicScene` 时补传 `subject/domain/materialText` | 纯增量字段 |
| `utils/courseStudio.js` | 本地兜底路径 `ensureSimulationBlock` 也传域（`scenePedagogyDomain` 辅助函数） | 纯增量字段 |
| `competition/analysis.js` | 竞赛路径显式 `pedagogyDomain:'math-science'`（内容恒为数学） | 纯增量字段 |

### 5.1 一次推断、多处复用

学科域在 `generateOpenmaicScene` 入口只推断一次（`inferPedagogyDomain`），
写入 `sceneContext.pedagogyDomain` 后供场景目录、交互模型匹配、slide 插图匹配
三处共用——避免各处推断不一致导致"目录给了时间轴、插图匹配却按数学域过滤"。

## 6. 与既有铁律的关系

- **AI 只选 id**：学科扩展不新增任何自由输入通道。场景/模型仍靠关键词确定性匹配，
  AI 至多在目录内选场景 id；新增的两个交互模型数据全部来自注册表。
- **受控渲染**：新场景/新模型全部过 `board.js` 白名单归一化（测试 D1/D2 断言），
  未注册 id 仍被拒。
- **本地确定性兜底**：域推断、过滤、匹配全是纯函数，无模型调用；离线可用。
- **编译器不变**：学科画像产出仍完整经过课程编译器（9 约束 + 学科检查 + 证据账本
  + 修复循环）——学科自适应发生在"教什么、怎么教"层，不发生在"教得对不对"层。

## 7. 已知局限

1. **域推断是关键词级**：跨学科课程（如"数学史"）会归到分值更高的域；general
   回落保证不出错，但策略可能不精确。后续可引入大纲阶段模型自标域 + 本函数校验。
2. **资源库覆盖仍偏科**：视觉场景 12 个、交互模型 8 个，人文学科各有 2 个、
   经管 4 个场景但 0 个专属交互模型（pipeline-flow 双域含 social-science 算半个）。
   语言艺术域只有通用场景。扩充顺序应按真实开课频次。
3. **`timeline-order` 数据是内置样例**（鸦片战争/洋务运动/甲午/辛亥革命），
   换课文需要注册表补数据或后续支持大纲级 data 注入；当前组件对空数据安全
   （渲染空列表不崩）。
4. **提示词策略未做 A/B 验证**：五域策略文案来自教学法先验，尚无实验数据支撑
   "叙事论辩模板比通用模板更好"；实验台（`/app/compiler`）已具备四组对照能力，
   待排期。

## 8. 复现与验证

```bash
cd frontend
npm run test:pedagogy        # 19 项：域推断/资源过滤/提示词/新资源白名单/管线接入
npm run test:alignment       # 17 项（含新增学科场景对齐断言 A2b）
npm run test:openmaic        # 36 项
npm run test:visualization   # 26 项
npm run test:course-script   # 36 项
npm run test:course-compiler # 44 项
npm run test:text-repair     # 48 项
npm run test:competition     # 3 cases
npm run build && npm run test:e2e   # 39/39
```

E2E 注意事项：Playwright 配置显式置空模型 key 以断言离线契约；
**若 4173 端口已有带 key 的遗留服务，`reuseExistingServer:true` 会复用它导致
「本地生成大纲」类断言失败**（2026-11-09 实测捕获，非代码回归）。

## 9. 代码地图

```
frontend/src/utils/pedagogyProfiles.js        # 五域注册表 + 推断/过滤/提示词注入（纯函数）
frontend/src/utils/illustrationScenes.js      # 12 场景（含 domains）+ matchIllustrationSceneForDomain
frontend/src/utils/knowledgeVisualization.js  # 8 交互模型（含 domains）+ matchSimulation(domainId)
frontend/src/api/prompts/courseStudio.js      # 大纲/场景提示词的学科策略注入
frontend/src/api/openmaic/sceneGenerator.js   # sceneContext.pedagogyDomain + 目录过滤 + widget 域匹配
frontend/src/api/openmaic/slideAdapter.js     # image case 域过滤 + src 域校验
frontend/src/api/courseStudio.js              # 调用处补传学科信号
frontend/src/utils/courseStudio.js            # 本地兜底 ensureSimulationBlock 域透传
frontend/src/competition/analysis.js          # 竞赛路径显式 math-science
frontend/src/components/illustrations/        # Timeline/MapRegion/Pipeline/Blueprint.vue（新）
frontend/src/components/simulations/          # TimelineOrderSim/PipelineFlowSim.vue（新）
frontend/scripts/test-pedagogy.mjs            # 19 项回归
```
