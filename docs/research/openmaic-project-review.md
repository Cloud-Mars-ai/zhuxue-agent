# OpenMAIC 全方位调研与课程生成复用报告

> 调研时间：2026-11-04  
> 上游仓库：<https://github.com/THU-MAIC/OpenMAIC>  
> 固定审阅版本：`10a92d652ba7a69d2801d9c1354d33287c3142e2`（`main`）  
> 许可证：MIT，Copyright (c) 2026 THU-MAIC  
> 本项目落点：教师端 `/app/studio` 与 `/m/studio` 的“智能课程编排”

## 1. 结论先行

OpenMAIC 值得复用的不是一个“生成整门课”的提示词，而是一套可审计的生成架构：

1. **先资料、后生成**：材料先解析、切片、限额，再进入大纲提示词。
2. **两阶段生成**：先产生 `SceneOutline[]`，教师确认后才逐场景生成内容与动作。
3. **结构化输出 + 本地校验**：JSON 宽松解析只是第一层，业务 schema 归一化才是真正的安全边界。
4. **长任务可恢复**：生成状态、每一步 checkpoint、失败步骤、重试和恢复位置都持久化。
5. **按场景隔离失败**：单个场景失败不会丢掉已生成内容，可停在失败处继续。
6. **分层能力插槽**：大纲、内容、动作、图片、视频、TTS、搜索相互解耦，可通过配置关闭。

本项目没有整套搬运其 Next.js、PostgreSQL、React 与多 Agent 课堂，而是把它们与当前目标最匹配的部分改造成纯前端可运行版本：

- 大纲生成 → 教师编辑 → 确认 → 逐场景生成；
- 本地 schema 校验 → 一次结构修复 → 确定性兜底；
- 大纲、场景状态和生成结果存 IndexedDB；
- 课程资源可导出为 `.course.json`；
- 生成的板书场景能直接进入现有 `/app/board` 与 `/m/board` 学习。

## 2. 上游项目定位与能力地图

OpenMAIC 是“从主题或文档生成交互式课堂”的多 Agent 开源平台。它的主要生产能力包括：

| 能力 | 上游实现 | 对本项目价值 |
| --- | --- | --- |
| 需求转课程大纲 | `packages/@openmaic/generation` | 高，直接决定生成质量与可控制性 |
| 大纲人工审阅 | `components/generation/outlines-editor.tsx` | 很高，符合教师确认制 |
| 场景内容生成 | `lib/server/generation/steps/scene-content.ts` | 高，可映射到板书/题目/案例 |
| 场景动作生成 | `scene-actions.ts` | 低，本项目不引入多 Agent 演播 |
| 服务端长任务 | `lib/server/generation/run/*` | 策略高，代码不宜直接搬；应做前端简化版 |
| PPT / 互动 / PBL | DSL 与专用 renderer | 低，超出本项目形态边界 |
| 图片 / 视频 / TTS | `steps/image.ts`、`video.ts`、`narration.ts` | 中，仅保留现有 TTS；课程生成先不生成媒体 |
| PostgreSQL 持久化 | `@openmaic/storage` | 低，本项目无后端；改为 IndexedDB |
| 多 Agent 课堂 | `lib/chat/pi/*` | 低，与“一门真实课程的助教”定位冲突 |
| PPTX / 离线 HTML 导出 | `lib/export/*` | 中，当前先导出可交换 JSON 课程包 |
| 提示词 golden tests | `test/*prompt*.test.ts` | 很高，应学习其契约测试方式 |

## 3. 智能课程生成的真实架构

### 3.1 总体流水线

OpenMAIC 的经典生成顺序可概括为：

```text
材料解析/检索
  → 大纲生成
  → 大纲确认
  → Agent 配置（可选）
  → 对每个场景：
       内容生成
       → 动作生成
       → 旁白/媒体（可选）
  → 课程完成
```

依据：

- `lib/server/generation/run/plan.ts`
- `lib/server/generation/run/engine.ts`
- `packages/@openmaic/generation/src/outline-generator.ts`
- `packages/@openmaic/generation/src/scene-generator.ts`

其关键设计是：**大纲确认前不运行昂贵的内容生成**。在 `advanceRun` 中，预备步骤完成后直接返回 `await-outline-confirmation`；只有确认后才进入 `generating` 阶段。

### 3.2 第一阶段：需求转大纲

上游提示词位于：

- `packages/@openmaic/generation/templates/requirements-to-outlines/system.md`
- `packages/@openmaic/generation/templates/requirements-to-outlines/user.md`

值得复用的提示工程：

1. 强制推断主题、受众、难度、时长、教学风格，但不向用户追问。
2. 输出固定对象，而非裸数组：

```json
{
  "languageDirective": "...",
  "courseTitle": "...",
  "outlines": []
}
```

3. 每个场景只描述“准备怎么教”，暂不写完整正文。
4. 场景必须包含 `title / description / keyPoints / order`；quiz、interactive、PBL 各有自己的附加配置。
5. 明确限制互动场景数量、PBL 数量、场景时长和测验位置。
6. 先讲资料边界，再讲创作自由。

本项目的改写没有照搬 `slide / interactive / pbl`，而是换成更贴合现有产品的：

```text
lecture 板书讲解
quiz    检索练习
practice 案例应用
review  收束复盘
```

### 3.3 大纲不是模型输出的“透传对象”

上游 `outline-generator.ts` 在模型返回后还会：

- 兼容包装对象和旧版裸数组；
- 缺失 `id` 时生成稳定 ID；
- 强制按返回顺序重写 `order`；
- 丢弃类型错误的 `mediaGenerations`；
- 对媒体元素 ID 去重；
- 配置缺失时把有问题的 interactive/PBL 降级为 slide。

服务端 `outline-schema.ts` 又增加：

- 1–100 个场景；
- 最大 512 KiB JSON；
- 场景必须有非空 `id`、`type`、整数 `order`；
- ID 与 order 不可重复；
- 对 null、错误类型、配置字段再次规范化。

这说明 OpenMAIC 的核心质量原则是：**模型输出仅是候选数据，业务归一化结果才可进入渲染和持久化。**

### 3.4 第二阶段：场景内容与动作分离

`scene-generator.ts` 中，内容生成与动作生成是两个步骤：

- 内容：slide elements、quiz questions、interactive HTML、PBL project；
- 动作：speech、spotlight、whiteboard、widget action 等。

本项目只复用“内容生成”这一层：

- `lecture/review` → 现有受控 `BoardLesson` block schema；
- `quiz` → 现有可判分题目结构；
- `practice` → 案例题、参考要点、量规、追问。

不引入“场景动作”是因为当前产品形态是学生主动学习，不是自动播放的 AI 课堂导演。

### 3.5 JSON 解析与修复

上游 `json-repair.ts` 的层级值得直接借鉴：

1. 精确 JSON；
2. 去掉推理前缀；
3. 从 Markdown 围栏提取；
4. 从任意文本截取括号平衡的 JSON；
5. 修复 AI 常见错误，例如 `"height: 76"` 这类坏属性片段；
6. 修复 LaTeX/非法转义；
7. 尝试补全截断对象；
8. `jsonrepair`；
9. 清除控制字符后重试。

本项目的 `utils/json.js` 已有围栏提取、平衡括号和尾逗号修复。本次没有引入新依赖，而是在课程生成任务层增加：

- 首次输出 → 本地 schema 归一化；
- 归一化失败 → 把原始输出、失败原因和严格契约发回模型；
- 仅允许一次“只修复结构”的调用；
- 仍失败 → 确定性教师确认稿兜底。

这比单纯放宽解析更安全：**JSON 能解析 ≠ 业务可用。**

### 3.6 重试与长任务恢复

上游有三层可靠性：

1. `generation-retry.ts`：区分可重试 HTTP 状态、网络错误和不可重试的 401/403/404/422；指数退避 + jitter。
2. `run/retry.ts`：场景级重试，首个场景与后续场景可有不同重试额度。
3. `run/engine.ts`：每一步成功后提交 checkpoint；失败后暂停在具体 step；恢复时按 `completed` 集合继续。

本项目的纯前端版本简化为：

- 网络层沿用现有 `sendChatDetailed` 的一次可重试逻辑；
- 结构层增加一次专用 repair；
- 每个场景完成后立即写入 IndexedDB；
- 失败/取消时保留已完成场景，可从界面继续生成；
- 断网时每个场景独立回退，不影响整门课程保存。

### 3.7 资料上下文限额

上游不会把全部材料直接塞给每个生成步骤。它有材料解析、vision slice、图片文本降级、提示词输入上限和步骤上下文。

本项目对应改造：

- `knowledge.js` 新增 `buildGenerationContext()`；
- 优先本章材料，再按目标/场景关键词补足；
- 默认最多 6 个片段、6000 字符；
- 每个场景再次按 `sourceChunkIds` 取更窄的 5 个片段；
- 模型只能返回材料片段的 `chunkId`，标题和章节由前端回填；
- 模型不生成页码。

## 4. 上游课程生成的质量门

| 质量门 | 上游做法 | 本项目做法 |
| --- | --- | --- |
| 输入门 | 材料 ID、owner、模型授权、运行上限 | 章节 + 目标 + 教师确认材料检索 |
| 大纲门 | 数量、字节、ID、order、type 校验 | 3–10 场景、固定类型、时长、要点、来源 ID |
| 人工门 | 大纲编辑器可增删、拖拽、换类型、改要点 | 可改标题/类型/时长/描述/要点、上下移动、增删 |
| 内容门 | scene type 专属 schema + DSL normalize | board/quiz/practice 三类受控内容 |
| 恢复门 | step checkpoint + paused step + retry | scene checkpoint + 状态/错误 + 继续生成 |
| 安全门 | 禁止自由 HTML 进入部分能力、URL 校验 | 板书禁止 HTML/CSS/SVG/坐标/脚本 |
| 降级门 | 部分能力关闭/失败时走功能级 fallback | 每个场景可独立标“演示缓存” |
| 验收门 | prompt golden、scene generator、retry 等测试 | build + Playwright 关键链路 |

## 5. 复用决策表

| OpenMAIC 模块 | 决策 | 原因与本项目实现 |
| --- | --- | --- |
| 两阶段 `outline → scene` | **采纳** | 与教师确认、教材依据完全契合 |
| 大纲固定 JSON 契约 | **采纳并收窄** | 采用 lecture/quiz/practice/review，不引入 PBL DSL |
| 大纲人工编辑门 | **采纳并重写** | Vue 版 `CourseStudio.vue`，保留增删、重排、类型、要点、时长 |
| 生成前校验门 | **采纳** | `outlineErrors` 阻止空标题/空要点进入生成 |
| 宽松 JSON 解析 | **部分采纳** | 继续使用当前轻量解析，增加结构 repair |
| `jsonrepair` 库 | **暂不引入** | 当前依赖已够用；避免为演示增加体积 |
| 指数退避重试 | **部分采纳** | 复用网络层；结构层另做一次 repair |
| 服务端异步 job | **不直接搬** | 本项目无后端；改为本地逐场景状态机 |
| PostgreSQL checkpoint | **改成 IndexedDB** | 课件与课程包可能超过 localStorage 容量 |
| 场景动作 / 自动播放 | **不采纳** | 当前学习形态不是课堂演播器 |
| React slide DSL / Canvas 编辑 | **不采纳** | 与项目硬规则“结构化 block，不做自由画布”冲突 |
| 互动 HTML / 3D / 游戏 | **不采纳** | 课程质量、离线安全与维护成本不适合当前比赛主线 |
| PBL 项目运行器 | **不采纳** | 功能过重，本项目已有考核与一人一题 |
| 多 Agent 课堂讨论 | **不采纳** | 会稀释“单门真实课程助教”的定位 |
| 图片 / 视频生成 | **暂不采纳** | 当前无后端任务队列，且媒体质量与成本不可控 |
| TTS 旁白 | **保留现状** | 已有机内 StepAudio 能力，不与课程生成耦合 |
| 课程 ZIP / PPTX 导出 | **降级为 JSON** | 先保证结构可交换、可审阅、可恢复 |
| 多语言语言指令 | **部分采纳** | 当前固定中文授课 + 英文术语解释 |
| 提示词 golden tests | **采纳方向** | 新增课程编排 E2E；后续应补本地 deterministic unit tests |

## 6. 已复制并优化的关键实现

### 6.1 新增数据流

```text
教师填写目标
  → knowledge.buildGenerationContext()
  → generateCourseBlueprint()
      → courseBlueprintPrompt()
      → sendChatJSON()
      → normalizeCourseBlueprint()
      → 失败：repair 一次
      → 再失败：buildLocalCourseBlueprint()
  → teacher edits outlines
  → IndexedDB
  → 逐场景 generateCourseScene()
      → scene-specific prompt
      → normalizeCourseSceneContent()
      → repair / deterministic fallback
      → update scene checkpoint in IndexedDB
  → ready resource pack
  → Board / quiz / practice preview
  → export .course.json
```

### 6.2 主要文件

| 文件 | 职责 |
| --- | --- |
| `frontend/src/api/prompts/courseStudio.js` | 两阶段提示词与硬 JSON 契约 |
| `frontend/src/api/courseStudio.js` | 材料取用、模型调用、schema 修复、场景生成 |
| `frontend/src/utils/courseStudio.js` | 大纲/内容归一化、教学顺序、本地确定性生成 |
| `frontend/src/stores/courseStudio.js` | 课程包、场景状态、IndexedDB 持久化 |
| `frontend/src/views/web/CourseStudio.vue` | 教师编排、审阅、生成、预览、导出 |
| `frontend/src/views/web/Board.vue` | 接收 `studio + scene` 参数，学习已生成板书 |
| `frontend/src/views/mobile/MBoard.vue` | H5 同样消费课程编排板书 |
| `frontend/src/stores/knowledge.js` | 课程生成专用 top-k 上下文与 chunkId 回查 |
| `frontend/tests/e2e/critical-flows.spec.js` | 两阶段生成到板书学习的回归 |

### 6.3 大纲 schema

```json
{
  "courseTitle": "≤30字",
  "courseSummary": "课程解决什么问题",
  "languageDirective": "授课语言与术语规则",
  "outlines": [
    {
      "id": "scene_1",
      "type": "lecture | quiz | practice | review",
      "title": "场景标题",
      "description": "教学作用",
      "teachingObjective": "可观察目标",
      "keyPoints": ["要点"],
      "estimatedMinutes": 8,
      "sourceChunkIds": ["chunk-id"],
      "order": 1
    }
  ]
}
```

本地归一化额外保证：

- 至少 3 个、最多 10 个场景；
- 有至少一个 quiz 和一个 review，缺失时由确定性规则补足；
- `order` 始终连续；
- 类型可兼容 OpenMAIC 的旧 `slide/interactive/pbl` 命名，但最终转为本项目类型；
- `sourceChunkIds` 只能引用本轮真实材料；
- 时长限制在 3–45 分钟。

### 6.4 内容 schema

板书：

```json
{
  "sourceChunkIds": ["..."],
  "lesson": {
    "chapter": "...",
    "title": "...",
    "subtitle": "...",
    "blocks": [
      { "type": "outline" },
      { "type": "definition" },
      { "type": "table | diagram" },
      { "type": "callout" },
      { "type": "question" }
    ]
  }
}
```

最终统一经过 `normalizeBoardLesson()`：

- 只接受 6 种 block；
- 截断字段长度；
- table 行列对齐；
- diagram 节点数量受限；
- 无追问时自动补一个 meta 问题；
- 丢弃 HTML、坐标和任何未知 block。

题目：

```json
{
  "sourceChunkIds": ["..."],
  "questions": [
    {
      "stem": "...",
      "options": ["A", "B", "C", "D"],
      "answerIndex": 0,
      "explanation": "...",
      "concept": "..."
    }
  ]
}
```

最终映射到项目现有 `normalizeQuestions()`，因此可直接复用判分、解析和诊断结构。

案例应用：

```json
{
  "sourceChunkIds": ["..."],
  "prompt": "...",
  "referencePoints": ["..."],
  "rubric": [{ "criterion": "概念判断", "weight": 40 }],
  "followUp": "..."
}
```

### 6.5 相对于上游的针对性优化

1. **从“课堂生成”降维到“课程资源编排”**：去掉不必要媒体与动作，降低失败面和演示成本。
2. **教师治理前置**：大纲确认成为硬门，不让模型直接生成可用课程。
3. **所有板书进入 block schema**：延续本项目已有安全边界。
4. **来源传播更明确**：每个大纲场景和每个内容场景都保留 `sourceChunkIds`。
5. **失败粒度更细**：单个场景回退，不把整门课标成失败。
6. **恢复成本更低**：每场景立即持久化，刷新后可继续。
7. **无后端也可演示**：没有模型时直接生成 5–6 场景确定性课程。
8. **结果可继续消费**：板书可直接进入现有学习页，而不是停在预览里。

## 7. 明确不复制的内容

### 7.1 品牌与内容

未复制 OpenMAIC 的 logo、插画、角色、文案、命名、课程内容或营销叙事。

### 7.2 技术栈

未引入 Next.js、React、PostgreSQL、Drizzle、React Flow、OpenMAIC DSL 或 renderer。原因是本项目是 Vue SPA，且明确不做服务端长任务。

### 7.3 功能范围

未引入：

- 课程集市；
- 多 Agent 自动授课；
- PPT 级自由布局；
- 互动 HTML / 3D / 游戏；
- PBL 项目全流程；
- 图片与视频生成；
- 语音主流程。

这些能力在 OpenMAIC 内成立，但会破坏本项目当前的产品聚焦与离线可靠性。

## 8. 风险与后续建议

### 8.1 当前风险

| 风险 | 影响 | 下一步 |
| --- | --- | --- |
| 仍为纯前端生成 | 关闭页面后无法在后台继续 | 有后端后把 store 状态机迁到 job runner |
| 没有并发控制 | 长课程逐场景生成耗时 | 可像 OpenMAIC 一样预取后续 1–2 场景，但先保证稳定 |
| 内容质量依赖模型 | 可能出现空泛场景 | 已加 schema、材料边界和教师编辑；后续补评分器 |
| JSON repair 仍是单次 | 极复杂坏输出可能失败 | 记录失败样本，决定是否引入 `jsonrepair` |
| 导出为 JSON 而非 PPTX | 不能直接作为课件播放 | 后续可做 PPTX / 离线 HTML 适配器 |
| 无单元测试 | 本地 schema 回归仍不够细 | 按 OpenMAIC 思路补 outline/scene golden fixtures |

### 8.2 推荐下一步

1. 把成功生成且教师确认后的场景写回知识库，作为“课程资产”，而不是只存在课程包中。
2. 增加场景级“重新生成”和“只改一段”的能力。
3. 为大纲与三类内容各建 5–10 个固定 fixture，做纯本地单测。
4. 增加课程质量评分：材料覆盖、目标一致性、认知负荷、测验对齐。
5. 后端就绪后迁移为异步 job，并复用上游的 checkpoint 语义。

## 9. 验收记录

已完成：

- `npm run build`：通过；
- Playwright 确定性回归：15/15 通过，包含课程生成、刷新持久化、板书直达与 H5 查询参数映射；
- Playwright 真实模型回归：Step 5 Preview 完成真实课程大纲与首个板书场景，1/1 通过，总耗时约 90 秒；
- 无模型配置时仍可通过教师确认稿生成完整课程；
- H5 路由映射与查询参数保留已补齐；
- 课程板书可由 `/app/studio` 直达现有学习页。

真实模型验收中发现并修复了两个问题：

1. Step 5 默认推理会占用输出预算，首次大纲曾在 `finish_reason=length` 处截断；课程任务现使用 `reasoning_effort: low`，并放宽大纲输出预算。
2. 模型偶尔会使用对象数组、中文类型名或不同字段别名；本地归一化现兼容这些合理变体，但仍拒绝空课程、未知类型和材料外来源 ID。

建议每次发版继续执行：

```bash
cd frontend
npm run build
npm run test:e2e
```

## 10. 许可证与署名

本项目基于 OpenMAIC 复用的代码思路和改写在 `THIRD_PARTY_NOTICES.md` 中保留 MIT 许可证与版权声明。上游整体为 MIT；其内部 `packages/mathml2omml` 使用 LGPL-3.0-or-later，但本项目没有复制该包或相关代码。
