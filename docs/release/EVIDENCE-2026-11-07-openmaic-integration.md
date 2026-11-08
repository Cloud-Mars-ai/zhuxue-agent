# 自行检查报告：课程生成完全接入 OpenMAIC（2026-11-07 / 08）

> 原则：**已验证的说清楚，未验证的也要说清楚。** 本报告覆盖用户四项请求的全部交付，
> 证据以本次实跑命令输出为准；与旧文档冲突时以本报告 + 代码为准。

## 0. 结论

**全绿，可交付。** 真实模型端到端实测 5/5 阶段通过；OpenMAIC 管线单测 35/35；
全量回归 6 个套件不破；Playwright E2E 30/30；生产构建通过。
实测暴露的 2 个真实问题（interactive 截断、slide 越界文本丢弃）已修复并各配回归用例；
连带修复上游 OpenMAIC 2 处 latent bug 与本项目 1 处正则陷阱、1 处 JSON 补全缺陷。

## 1. 用户四项请求完成情况

| # | 请求 | 状态 | 证据 |
|---|------|------|------|
| 1 | API Key 失效问题 | ✅ 完成（前阶段） | `sk-****48cb` 直连 DeepSeek 全部 200 |
| 2 | 课程生成完全接入 OpenMAIC | ✅ 完成 | `frontend/src/api/openmaic/` 11 模块；`flags.openmaicPipeline=true`；设计文档 `docs/research/openmaic-integration-design.md` |
| 3 | 自行安排顺序 + 自行检查 + 报告 + 改进 | ✅ 完成 | 本报告 + §7 改进已落实 |
| 4 | 写日志 + 上传 GitHub | ✅ 完成 | `docs/release/PROJECT-LOG-2026-11-07.md` 追加台账；push `mygithub` |

## 2. 接入范围（边界）

**完全接入**：上游提示词资产（4 模板 + 11 snippets，原样字节级同步，`assets/` 为唯一事实源）、
模板引擎（snippets → 条件块 → 插值的上游处理顺序）、JSON 修复、生成重试、大纲三键契约、
场景四类型（slide/quiz/interactive/pbl）与 widget 六型、quiz 字段契约（value/label/answer）、
ScientificModel 四字段检查。

**适配接入**：场景产出 → 本项目受控板书块（确定性适配器，`slideAdapter.js` 等）；
测验题型收敛为单选（渲染器约束）。

**刻意不移植**：上游 renderer（本项目受控渲染安全模型）；PBL planner-single-call
（只取大纲级字段）；媒体生成通道（image/video 条件块恒关）。

## 3. 验证矩阵（全部实跑）

| 套件 | 命令 | 结果 |
|------|------|------|
| OpenMAIC 管线 | `npm run test:openmaic` | **35/35** |
| 文本修复 | `npm run test:text-repair` | 48/48 |
| 课程编译器 | `npm run test:course-compiler` | 41/41 |
| 课程脚本 | `npm run test:course-script` | 36/36 |
| 知识可视化 | `npm run test:visualization` | 26/26 |
| 赛事校验 | `npm run test:competition` | 通过（3 cases） |
| E2E | `npx playwright test`（build 后） | **30/30** |
| 生产构建 | `npm run build` | 通过（chunk 体积告警为既有情况） |
| 真实模型 E2E | `node scripts/test-openmaic-live.mjs` | **5/5** |

## 4. 真实模型实测明细（DeepSeek deepseek-chat，key `sk-****48cb`）

样本课程：《管理学的计划职能》（高校管理类二年级，约 30 分钟）。

- **阶段 1 大纲**：正确产出 6 场景——4 lecture + 1 practice（simulation widget）+ 1 quiz
  （quizConfig: 3 题/medium/三题型）；languageDirective 推断正确（简体中文 + 术语处理规则）；
  courseTitle ≤30 字符。
- **阶段 2a slide**：PPTElement[] → 板书块。本次模型图形密集、文本稀薄
  （块序列 diagram → question）——触发已落实的 keyPoints 兜底改进（见 P2-1）。
- **阶段 2b quiz**：3 题 value/label/answer → 题目/选项/answerIndex 映射全部正确；
  答案位置 1/3 非首位（上游提示词已要求随机化，模型部分遵守，观察项）。
- **阶段 2c interactive**：simulation HTML 被 maxTokens 截断，修复后成功提取
  widget-config 并映射为 definition → table → diagram → question 四块。

## 5. 发现的问题与修复

### P0-1 interactive 场景因输出截断整体回退（live 实测捕获）

- **现象**：完整 simulation HTML 超 3000 token 被截断，`</script>` 缺失 →
  `extractWidgetConfig` 严格匹配返回 null → 场景 `invalid-model-output` 回退。
- **修复**：① 提取正则改为 `([\s\S]*?)(?:<\/script>|$)`，容许截断并交给
  jsonRepair 括号栈补全；② interactive 场景 maxTokens 4000→**8000**（实测安全线）；
  live 脚本支持分阶段 token 预算。
- **回归**：`F6 widget-config 提取容忍 maxTokens 截断`。

### P0-2 slide 场景文本因「越界」被凭空丢弃（live 实测捕获）

- **现象**：模型不守 50px 边距，3 个文本元素被判越界丢弃——而文本块映射只按
  top 排序、不使用坐标，因位置丢文本 = 凭空损失内容。
- **修复**：画布校验收紧为**仅图形元素**（shape/line，坐标幻觉的典型来源）、
  按全画布边界（0..1000×0..562.5）而非提示词边距；文本永不因位置丢弃。
- **回归**：`E2`（越界图形丢弃计数 + 越界文本保留断言）。

### P1 级缺陷（测试与精读捕获）

| 编号 | 问题 | 修复 |
|------|------|------|
| P1-1 | 上游 latent bug：LaTeX `\frac` 的 `\f` 是合法 JSON 转义，裸 parse「成功」但值被换成换页符（静默数据损坏） | exact parse 与 tryParseJson 双处加控制字符检测；Fix 1 按「反斜杠+字母串」判别 LaTeX |
| P1-2 | 上游 latent bug：Fix 1 产出的 `\\alpha` 被 Fix 2 二次转义 | 否定后顾 `(?<!\\)` |
| P1-3 | 上游截断对象补全非法：直接按 `}` 数量补齐，对象套截断数组时产出 `{...[{...}}` | `closeOpenBrackets`：最后完整元素处截断 + 括号栈补齐 |
| P1-4 | 尾逗号替换残留空格导致二次 parse 失败 | 正则替换目标改为 `$2` |
| P1-5 | 本项目 DEFINITION 正则 `.{2,30?}` 被 V8 解析为 `{2,3}`+字面量 `0?`，「术语：解释」匹配失败 | 改 `.{2,30}?`（懒标记在括号外） |

### P2-1 slide 内容丰富度随模型波动（改进项）

- **现象**：图形密集场景模型不产出路线文本，板书只有 diagram + 自动补齐的 question。
- **改进**：`outlineItems` 为空且有大纲 keyPoints 时，用大纲契约数据兜底 outline 块
  （同一管线的确定性数据，非编造），并计入 `dropped.outlineFallback` 供观测。
- **回归**：`E3 模型文本稀薄时用大纲 keyPoints 兜底 outline`。

## 6. 模型行为观察（不阻塞，均有兜底或计数）

1. **答案位置随机化仅部分遵守**：两次实测 0/3、1/3。提示词已要求；前端渲染不依赖位置，不强制。
2. **scientificModel 偶有省略**：interactive 场景模型未输出该字段时不做兜底伪造
   （避免编造公式），检查器无对象可查即放过，日志留痕。
3. **内容丰富度波动**：见 P2-1 兜底。

## 7. 改进落实清单

| 改进 | 落点 |
|------|------|
| 截断容忍 + token 预算 | `sceneGenerator.js` / `courseStudio.js` / `test-openmaic-live.mjs` |
| 画布校验语义修正 | `slideAdapter.js`（graphicsWithinCanvas） |
| keyPoints 兜底 | `slideAdapter.js` + E3 回归 |
| 上游可复现性 | `promptAssets.js` 头部记录上游 commit `5bd8cc8`；`vendor/` 入 .gitignore |
| 密钥防护 | 根/frontend `.gitignore` 增加 `.env` 规则（前阶段暴露过硬编码 key，本次防再犯） |
| 文档 | 设计文档 §6 新增 3 条已知局限、§7 更新验证口径；本报告 |

## 8. 未验证与风险

1. **样本单一**：live 实测仅 1 门课程（管理学计划职能）；未做多样本/多学科回归。
2. **token 预算按 DeepSeek 标定**：interactive 8000 / 其余 3000；换模型需重标
   （上游针对 Claude/GPT 更长输出场景）。
3. **PBL 仅大纲级**：planner-single-call 未移植（设计边界，非缺陷）。
4. **E2E 未专门断言 OpenMAIC 产物**：30/30 通过说明链路不破，但用例断言的是既有行为；
   OpenMAIC 管线的正确性主要由 35 项单测 + live 5/5 承载。
5. **媒体通道恒关**：图片/视频元素丢弃并计数，课程无视觉素材（本项目安全模型取舍）。

## 9. 复现命令

```bash
cd frontend
npm run test:openmaic                                   # 35 项单测
npm run test:text-repair && npm run test:course-compiler \
  && npm run test:course-script && npm run test:visualization \
  && npm run test:competition                           # 全量回归
node scripts/test-openmaic-live.mjs                     # 真实模型 5/5（需 frontend/.env）
npm run build && (node server.mjs &) && npx playwright test   # E2E 30/30
node scripts/sync-openmaic-assets.mjs --check           # 资产同步校验
```

---

*报告人：WorkBuddy（自行检查）。实测时间 2026-11-07 晚至 2026-11-08。密钥只在本机
frontend/.env（已 gitignore），不写入任何文档与提交。*
