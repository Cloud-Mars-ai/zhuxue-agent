# OpenMAIC 接入设计（Course Generation × OpenMAIC Pipeline）

> 版本：v1.1（2026-11-08 增补：场景级材料注入）· v1（2026-11-07）· 上游：THU-MAIC/OpenMAIC `@openmaic/generation@0.3.29`（MIT）
> 浅克隆快照：`vendor/openmaic/`（depth 1，仅研究用，不提交）

## 1. 目标与边界

用户要求「课程生成功能直接完全接入 OpenMAIC」。本项目渲染层是**结构化板书**（受控 block，禁 HTML/坐标/脚本），
OpenMAIC 渲染层是**画布 PPT**（1000×562.5 自由坐标 + 交互 HTML）。完全接入的正确边界是：

| 层 | OpenMAIC | 本项目接入方式 |
| --- | --- | --- |
| 提示词资产 | `templates/` + `snippets/`（386 行大纲模板、939 行 slide 模板等） | **原样移植**，内嵌为前端资产 |
| 模板引擎 | `{{snippet}}` / `{{#if}}` / `{{variable}}` | **原样移植**（promptEngine.js） |
| JSON 修复 | `parseJsonResponse` 4 策略（代码块/裸 JSON/LaTeX 转义/截断修复） | **原样移植**（jsonRepair.js，jsonrepair 依赖用纯 JS 等价实现，不新增 npm 包） |
| 重试 | `withGenerationRetry` + `isRetryableGenerationError`（指数退避+抖动，408/409/425/429/5xx 可重试） | **原样移植**（generationRetry.js） |
| 大纲契约 | `{languageDirective, courseTitle, outlines[]}`，四场景类型 slide/quiz/interactive/pbl，widget 六型 | **完全接入**（outlineGenerator.js），产出适配为我们的蓝图形状 |
| 场景契约 | slide→PPTElement[] / quiz→value-label-answer / interactive→html+ScientificModel / pbl→projectV2 | **契约接入 + 渲染适配**：slide 经确定性适配器转为结构化板书；quiz 直接兼容（既有 normalizeCourseQuestions 已认 value/label）；interactive 抽取 ScientificModel 四字段渲染为受控块；pbl 取大纲级字段 |
| 渲染 | @openmaic/renderer 画布渲染器 | **不移植**（我们的板书渲染器是受控 block 管线，安全模型不同） |
| 编译器 | 无 | **保留并前移**：OpenMAIC 产出仍过 courseIR → courseValidator → courseRepair → evidenceLedger → subjectCheck |

设计动机：OpenMAIC 的提示词工程与两阶段管线是上游数版本沉淀的资产（语言推断 6 条决策规则、
题型矩阵、widget 选型表、JSON 三键契约），直接复用优于重写；但其自由画布/自由 HTML 输出
与本项目「AI 只填 JSON、前端受控渲染」的安全铁律冲突，因此渲染层用确定性适配器桥接。

## 2. 模块地图（新增 frontend/src/api/openmaic/）

```
openmaic/
  index.js             barrel 导出
  promptAssets.js      【生成物】templates + snippets 内嵌字符串（sync 脚本产出，提交入库）
  promptEngine.js      buildPrompt / processSnippets / processConditionalBlocks / interpolateVariables
  jsonRepair.js        parseJsonResponse / tryParseJson（4 策略）
  generationRetry.js   withGenerationRetry / isRetryableGenerationError / isAbortError
  outlineGenerator.js  buildOutlinePrompt / generateSceneOutlines / applyOutlineFallbacks / normalizeSceneOutlines
  sceneGenerator.js    generateOpenmaicScene（slide/quiz/interactive/pbl 分派）+ buildSlideContentPrompt
  slideAdapter.js      PPTElement[] → 结构化板书 blocks（确定性）
  scientificModel.js   ScientificModel 契约校验 + subjectCheck 增强
scripts/sync-openmaic-assets.mjs   vendor/openmaic → assets/*.md + promptAssets.js
```

硬规则（沿用本项目约定）：以上文件**只用相对导入**，保证 `node scripts/test-openmaic-pipeline.mjs`
可直接 import；模型调用一律**依赖注入 aiCall**，不在管线内 import store/pinia。

## 3. 数据流

```
用户需求(章节/目标/受众/时长/材料)
  │
  ├─ collectSources（既有知识库检索，材料正文过 repairText）
  │
  ▼
generateSceneOutlines ── requirements-to-outlines 模板（OpenMAIC 原样）
  │   aiCall(system, user) → parseJsonResponse → applyOutlineFallbacks
  │   产出 {languageDirective, courseTitle, outlines[]}（OpenMAIC 契约）
  ▼
normalizeSceneOutlines ── 四类型 → lecture/quiz/practice/review + widget/scientificModel 元数据
  │   （适配后形状与既有 blueprint.outlines 一致，planFromBlueprint 无需改）
  ▼
compileCourseBlueprint（既有）── planFromBlueprint → validateCoursePlan → repairCoursePlan
  │
  ▼ 逐场景
generateOpenmaicScene ── 按 outline.type 分派：
  │   slide       → slide-content 模板 → PPTElement[] → slideAdapter → board blocks
  │   quiz        → quiz-content 模板 → value/label/answer → normalizeCourseQuestions（既有）
  │   interactive → simulation/scientificModel 提示词 → 四字段契约 → 受控块
  │   pbl         → 大纲级 projectTopic/targetSkills → practice 受控块
  │   （slide/quiz/interactive 三路 aiCall 统一经 withReferenceMaterial 包装，材料正文附在 user 消息末尾，见 §4.5）
  ▼
compileSceneContent（既有）── subjectCheck(+ScientificModel) → evidenceLedger → repairSceneContent
  ▼
既有渲染层（板书/测验/讲稿 beats）
```

## 4. 关键适配规则

### 4.1 大纲类型映射（normalizeSceneOutlines）

| OpenMAIC | 本项目 | 说明 |
| --- | --- | --- |
| slide | lecture | 板书讲解 |
| quiz | quiz | quizConfig{questionCount,difficulty,questionTypes} → exerciseSpec |
| interactive | practice | widgetType/widgetOutline/scientificModel 存入 outline.widget |
| pbl | practice | pblConfig → outline.pbl{projectTopic,targetSkills,issueCount} |

fallback（移植 applyOutlineFallbacks）：interactive 缺 widgetType/widgetOutline → 降级 slide；
pbl 缺 pblConfig → 降级 slide；空 outlines → 单 slide 场景。

### 4.2 PPTElement → 板书 blocks（slideAdapter，确定性）

- 画布 1000×562.5，边距 ≥50；文本元素按 top 排序
- 首个大字号文本（font-size ≥ 28 或 top 最小）→ `outline` 块标题来源；其余短文本（<30 字）按垂直聚类成 `outline` items
- 含「定义/概念/是什么」语义或 term: definition 形态 → `definition` 块（term/definition/concreteAnchor 必填，缺 anchor 时用首要点补）
- 连续 ≥2 个 shape/line 元素（有 fill/color，垂直区间相邻）→ `diagram` 块（nodes 取邻近文本标签）
- latex 元素 → `definition.formula` 字段（白名单命令集，拒绝即丢弃并记 issue）
- 超出受控 block 表达力的元素（图片/视频/自由 path）→ 丢弃并计入 adapter.dropped，进自行检查报告
- 保证至少产出 1 个 outline + 1 个 definition/table/diagram，否则判适配失败走本地兜底

### 4.3 quiz 契约

OpenMAIC：`{id,type:single|multiple|short_answer,question,options[{label,value}],answer:["A"],analysis,points,commentPrompt}`。
既有 `normalizeCourseQuestions` 已兼容 value/label + answer 字母（见 utils/courseStudio.js:737），
多选/简答按现有 quiz 契约收敛（answerIndex 取首个正确项；short_answer 的 commentPrompt → explanation）。

### 4.4 ScientificModel → subjectCheck

OpenMAIC 交互场景契约 `ScientificModel{core_formulas[],mechanism[],constraints[],forbidden_errors[]}`。
接入 `utils/subjectCheck`：对 interactive 场景抽取四字段，新增检查码
- SCI-FORMULA-COUNT：core_formulas 为空 → warn
- SCI-CONSTRAINT-UNCHECKED：constraints 未在内容中出现对应表述 → warn
- SCI-FORBIDDEN-HIT：内容命中 forbidden_errors 条目 → error（触发修复循环）

### 4.5 场景级材料注入（withReferenceMaterial）

**问题（「真正利用资料」的根因）**：OpenMAIC 四类场景模板的占位符只有
title/description/keyPoints/teacherContext/languageDirective，**没有任何材料插值位**；
teacherContext 只承载规则文本。若只把材料写进 teacherContext，模型看到的是
「有资料」的规则而非资料正文——上传的材料不会进入生成上下文。

**方案**：不改上游模板（字节级同步铁律），在调用层包一层 aiCall 装饰器
（`frontend/src/api/openmaic/sceneGenerator.js`）：

```js
withReferenceMaterial(aiCall, materialText, { maxChars = 4000 })
```

- 在 user 消息末尾追加「【参考材料 · 必须依据」块：事实、数据、案例与术语以材料为准；
  材料未覆盖的内容不编造具体数据，可依据通用知识讲解但需标注
- 空材料零开销原样返回（恒等函数）；超长按 maxChars 截断并加省略号
- 模板无关：slide/quiz/interactive 三路场景生成统一生效，上游提示词资产零改动
- 材料来源：courseStudio 收集所选材料正文（过 repairText，多份以分隔线拼接）

配套的教师侧四项体验（`views/web/CourseHome.vue`）：上传即解析（`importMaterialFile`
提取 + 乱码修复，失败不入库）；卡片支持多文件与逐份删除（删除走知识库真删除）；
解析期间卡片显示「解析中…」且 `askHero` 门控拒绝生成；卡片列表从知识库按 `kind`
派生（单一事实源，废弃 localStorage 双轨存储）。

## 5. 开关与回退

- `flags.openmaicPipeline`（默认 true）：关则完全回退既有自研管线（courseBlueprintPrompt/courseScenePrompt）
- `flags.offlineFallback`（既有）：OpenMAIC 管线任何阶段失败 → 本地确定性兜底，标「演示缓存」
- aiCall 注入：API 层接 `sendChatJSON`；node 实测脚本接直连 DeepSeek 的 fetch 适配器

## 6. 已知局限（写入自行检查报告）

1. 画布自由元素（图片/视频/任意 path）不进受控渲染器，适配器丢弃并计数——这是安全模型的刻意裁剪，非缺陷
2. interactive 场景不渲染上游自由 HTML，改为 ScientificModel 结构化块；widget 六型仅作大纲级选型记录
3. PBL 不移植 planner-single-call（上游 1000+ 行项目制规划器），只取大纲级字段
4. slide 模板中图片/视频条件块在本项目恒关闭（无媒体生成通道），模板以 imageElementEnabled=false 渲染
5. 模型行为不可完全约束（live 实测观察，均有兜底或计数，不阻塞）：① 答案位置随机化仅部分遵守（两次实测 0/3、1/3）；② interactive 场景偶有省略 scientificModel 字段——不做兜底伪造，检查器无对象可查即放过；③ slide 内容丰富度随模型波动——文本稀薄时用大纲 keyPoints 兜底 outline（计入 `dropped.outlineFallback`）
6. interactive 场景 maxTokens 需 8000（3000 实测截断）；其余场景 3000 够用——这是实测标定值，换模型需重标
7. live 实测的 token 预算与重试参数按 DeepSeek 标定；上游 OpenMAIC 针对 Claude/GPT 的更长输出场景，本项目侧 token 预算偏保守
8. 材料注入按 4000 字截断（多份合计），超长材料只取前段——token 预算与「必须依据」强度的折中；后续可按场景类型分别标定

## 7. 验证口径

- `npm run test:openmaic`（新增）：promptEngine/jsonRepair/retry/outline/adapter/scientificModel 单测（36 项，F7 覆盖 withReferenceMaterial：空材料恒等 / system 不动 / user 附块 / maxChars 截断）
- `npm run test:course-compiler`、`test:text-repair`、`test:e2e` 全量回归不破
- 真实链路实测：DeepSeek + 新 key 跑 大纲→slide→quiz→interactive，记录每阶段原始输出与适配结果（test-openmaic-live.mjs，2026-11-07 实测 5/5 通过）
