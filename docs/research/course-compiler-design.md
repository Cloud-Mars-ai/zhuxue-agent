# 课程编译器（Course Compiler）研究设计

状态：已实现并通过测试（41/41 单测、36/36 E2E）。
代码地图见文末；实验复现方式见第 8 节。

## 1. 动机：把"看起来很完整"变成"教学上成立"

大模型生成课程的典型故障不是格式错误，而是**教学约束 silently violated**：

| 故障模式 | 表现 | 本项目的判定方式 |
| --- | --- | --- |
| 先修逆序 | 第 2 节就使用第 5 节才引入的概念 | `PREREQ_ORDER` |
| 时长失控 | 场景时长相加是课时预算的 2–3 倍 | `DURATION_BUDGET` |
| 材料引用不充分/编造 | 引用不存在的 chunkId | `MATERIAL_EXISTENCE` + 证据账本伪造检测 |
| 题目与目标不一致 | quiz 只有 1 类 1 题，覆盖不到目标 | `EXERCISE_TYPES` + `COVERAGE` |
| 数学错误 | 移项不变号、答案错指、选项不唯一 | 学科一致性检查器 |
| 结论无依据 | 板书/例题直接下结论，无来源 | 证据账本无依据率 |

这些问题有个共同点：**输出结构完整、语法合法，人看一眼截图发现不了，逐条核对才暴露**。因此本项目把生成过程拆成可判定的管线，让每个结论都能被追到一个具体检查。

## 2. 六层管线

```
            ┌──────────────────────────────────────────────┐
            │                课程规划 IR                    │  第 1 层
            │  knowledgePoints[] + scenes[] + requirements │
            └───────────────────┬──────────────────────────┘
                                │ planFromBlueprint(blueprint)
                                ▼
            ┌──────────────────────────────────────────────┐
            │                 内容生成                      │  第 2 层
            │  模型生成 / 本地确定性兜底（同一切分契约）      │
            └───────────────────┬──────────────────────────┘
                                │ 每场景
                                ▼
            ┌──────────────────────────────────────────────┐
            │            硬约束验证 + 学科一致性             │  第 3 层
            │  9 类约束（error/warning）+ math7/管理域检查   │
            └───────────────────┬──────────────────────────┘
                    ┌───────────┴───────────┐
               有 error 级问题            无 error
                    ▼                       │
            ┌──────────────────────┐        │
            │     验证—修复循环      │  第 4 层 │
            │ 计划层确定性修复        │        │
            │ 场景层定向模型修复      │        │
            └──────────┬───────────┘        │
                     └───────────┬──────────┘
                                 ▼
            ┌──────────────────────────────────────────────┐
            │              板书 / 讲稿渲染                   │  第 5 层
            │  结构化 block（模型只输出 chunkId）+ beats     │
            └───────────────────┬──────────────────────────┘
                                ▼
            ┌──────────────────────────────────────────────┐
            │            实验与评测（研究产出层）             │  第 6 层
            │  四组对照 × 任务 × 重复 → 指标 → 导出          │
            └──────────────────────────────────────────────┘
```

关键设计决定：**验证失败不重新生成整门课**。修复是两级定向的——计划层用确定性规则修（重排、时长再平衡、难度抬平、题型补齐、假 chunk 过滤），场景层只把问题场景连同学科检查 issues 送给模型修一次。每次修复写一条 `RepairRecord{code, target, action, before, after, source, at}`，随课程持久化。

## 3. 第 1 层：课程计划 IR

IR 版本 `course-ir-v1`。课程由模型蓝图（`outlines` 数组）归一化而来，也可从既有 IR 幂等重算。

**知识点表**（`plan.knowledgePoints`）：

| 字段 | 说明 |
| --- | --- |
| `id` / `name` | `kp_N`；名称来自场景 keyPoints（去重），可被课程级 `knowledgePoints[].name` 声明覆盖难度与先修 |
| `difficulty` | 1–3，越界由验证器报 `KP_RANGE`、修复器钳制 |
| `prerequisites` | 知识点 ID；由名称式声明解析，缺省时回退为"前两个已引入知识点" |
| `introducedBy` | 引入场景 ID（**使用场景不得早于引入场景**） |
| `estMinutes` | 引入场景的预计时长 |

**场景表**（`plan.scenes`）：`id / order / type(lecture·quiz·practice·review) / title / teachingObjective / completionCriteria / keyPoints / difficultyTier / estimatedMinutes / sourceChunkIds / exerciseSpec{types,count} / prerequisites / knowledgePointIds`。

课程级还有 `requirements[]`（来自用户目标 + 显式要求条目，id `rq_objective` 兜底）、`durationBudget`、`allowedChunkIds`（材料白名单，**模型只能返回白名单内的 chunkId**）。

归一化保证：至少 3 个场景、至少 1 个 quiz、最后 1 个 review、时长按预算再平衡、难度阶梯强制非降（lecture）。

## 4. 第 3 层：硬约束验证器

`validateCoursePlan(plan) → { passed, violations, metrics }`。`passed` = 无 error 级违规；warning 只提示不阻断。

| code | 严重级 | 判定 |
| --- | --- | --- |
| `PREREQ_ORDER` | error | 场景使用的知识点，其**引入场景 order 晚于**本场景（同场景内引入合法） |
| `PREREQ_MISSING` | error | 引用了不存在的知识点 / 先修 ID |
| `COVERAGE` | warning | 每条 requirement 与知识点/场景要点的关键词重叠度（中文按字符 bigram，拉丁数字按词，无分词器下的确定性近似） |
| `DURATION_BUDGET` | error | 场景时长合计偏离预算超阈值；单场景类型时长区间（lecture 2–6 / quiz 4–6 / practice 5–8 / review 3–5 分钟）为 warning |
| `DIFFICULTY_ORDER` | error | lecture 场景 `difficultyTier` 按 order 非降序 |
| `EXERCISE_TYPES` | error | 课程至少 1 个 quiz；每个 quiz 题型 ≥2 类且题量 ≥2 |
| `MATERIAL_EXISTENCE` | error | `sourceChunkIds` 必须 ∈ `allowedChunkIds` |
| `COMPLETION_CRITERIA` | warning | 每场景至少 1 条完成标准 |
| `KP_RANGE` | warning | 知识点难度 ∈ [1,3] |

`metrics = { coverage, durationDrift, totalMinutes, violationCount, errorCount }`，直接作为实验指标的数据源。

## 5. 第 3 层（续）：证据账本

每个关键结论（板书定义、错解步骤、题目、案例数字）都必须挂来源。五类证据：

| kind | 含义 | 典型来源 |
| --- | --- | --- |
| `requirement` | 课程要求 | 用户学习目标 |
| `chunk` | 材料片段 | 教师上传材料的 chunkId + 引文 |
| `attempt` | 学生答题证据 | 历史练习记录 |
| `rule` | 本地规则 | 学科检查器/教学规则 ID |
| `derived` | 推导结论 | 由 rule 推出（必须可追溯到 rule） |

抽取优先级（`extractSceneClaims`）：内容显式 `evidenceRefs` → 场景级 `sourceChunkIds` → 都没有则记为**无依据声明**（计入无依据率，交给修复循环）。

审计口径（`auditLedger`）：`supportRate = 有依据声明 / 总声明`；**伪造检测** = kind 为 chunk 但 ref 不在 `allowedChunkIds` 内。这两个指标就是论文里的"无依据结论比例"和"伪造引用率"。

## 6. 第 3 层（续）：学科一致性检查器

### 6.1 七年级数学（已实现，全检）

引擎是**线性多项式**：表达式解析为 `{a, b, var}`（a·x + b），支持全角符号、`²/³`、千分位、隐式乘法（`3x`）、括号。据此：

- **方程等价性**：逐步 `solveEquation`，某步起后续解集与首步不一致 → `MATH_STEP_DIVERGENCE`
- **计算步骤**：逐步算术求值，不等 → `MATH_STEP_ARITH`
- **答案**：最终答案与 target 不等 → `MATH_ANSWER_MISMATCH`（可确定性修复为正确值）
- **选项唯一性**：选项求值后唯一正确 → `MATH_OPTION_UNIQUE`；选项两两求值相同 → `MATH_OPTION_DUPLICATE`；选项数 ≠4 → `MATH_OPTION_COUNT`
- **常见错误模式**：移项不变号检测（`detectMoveWithoutSignChange`）；wrong-first 板书要求错解**恰好在 `errorIndex` 处首次偏离**，过早/过晚/无错解分别报 `WRONG_FIRST_EARLY_DIVERGENCE` / `WRONG_FIRST_INDEX` / `WRONG_FIRST_NO_ERROR`
- **解析兜底**：无法解析（非线性等）降级 warning，不误报 error

### 6.2 经管/其他域（轻检）

管理域做**数字溯源**：内容中的数字 token 必须能在材料文本中精确匹配（token 级，避免 `'20'` 误中 `'2023'`），否则 `MGMT_NUMBER_UNSOURCED`。其他域跳过（`MATH_PARSE_UNSUPPORTED` 之外的静默）。

扩展路径：新学科 = 一个新的 `subjectCheck/<domain>.js` + `index.js` 分发，不改管线。

## 7. 第 4 层：验证—修复循环

```
validate(plan)
   │
   ├─ 无 error ──────────────────────────────► 进入生成
   │
   └─ 有 error ──► repairCoursePlan(plan, validation)  【计划层，确定性】
                    │  先修拓扑重排（validate-and-accept：重排后 error 数不降才接受，
                    │   否则摘除越界依赖边）
                    │  时长再平衡 / 难度抬平 / 题型规格补齐 / 假 chunk 过滤 /
                    │  完成标准补齐 / KP 难度钳制
                    │  COVERAGE 留作 unresolved（需要语义判断）
                    ▼
                复检 ──► 仍失败的 error 级问题 → buildSceneRepairPrompt 只送问题场景给模型修一次
                                        （temperature 0.2，附材料白名单与 issues）
                                        ▼
                                    场景内容层 repairSceneContent：
                                    MATH_ANSWER_MISMATCH 改答案 / WRONG_FIRST_INDEX 对准 errorIndex
```

安全性：拓扑重排采用 validate-and-accept，避免"修一个坏一个"的级联；每次修复都留 `before/after`，可审计、可回放。

## 8. 第 6 层：实验与评测

### 8.1 四组对照

| 组 | 材料 | Schema | 编译（验证+修复） |
| --- | --- | --- | --- |
| Vanilla | ✗ | ✗ | ✗ |
| RAG-only | ✓ | ✗ | ✗ |
| Prompt+Schema | ✓ | ✓ | ✗ |
| Full Compiler | ✓ | ✓ | ✓ |

### 8.2 任务集

内置 12 个任务（`src/api/experiments.js` `BUILTIN_TASKS`）：七年级数学 8 个（方程/有理数/整式/不等式/冲刺/复习）、经管 2 个、通用 2 个。论文正式实验建议扩到 **80–150 个任务**（同知识点变体 + 不同时长/学段），任务定义保持同一 schema 即可直接接入。

### 8.3 指标口径

| 指标 | 计算 |
| --- | --- |
| 硬约束通过率 | `validation.passed` 的 run 占比 |
| 要求覆盖率 | `metrics.coverage` 均值 |
| 无依据结论比例 | 证据账本 `unsupportedRate` 均值 |
| 先修关系错误率 | 含 `PREREQ_ORDER/PREREQ_MISSING` 的 run 占比 |
| 数学计算/答案错误率 | error 级 `MATH_*` issue 的 run 占比 |
| 伪造引用率 | `fabricated.length > 0` 的 run 占比 |
| 结构稳定性 | 同组同任务多次生成的场景集合指纹 Jaccard 均值 |
| 修复贡献 | `repairsPerRun`（区分确定性/模型来源） |
| 延迟 / token | run 级 `latencyMs` / `tokens` 均值 |

### 8.4 人工评分

`exportHumanScoreSheet` 导出 `taskId × group` 的评分表（教师 1–5 分 + 直接使用/需修改/拒绝 + 评语），回收后 `importHumanScores` 合成为均分与三类意愿比例。建议 3–5 名学科教师，评分表按组匿名打乱。

### 8.5 复现方式

```bash
cd frontend
npm run test:course-compiler   # 41 项单测：IR/验证/证据/学科检查/修复/实验口径
npm run test:e2e               # 36 项端到端
# 页面：/app/compiler（教师/助教/管理员）→「实验与评测」→ 运行实验 → 导出 CSV/JSON/Markdown
```

两种生成模式：

- **离线模拟**（默认）：固定种子伪随机复现四类典型缺陷（难度逆序/时长失控/题型不足/假 chunk），四组差异全部来自编译器开关。用于跑通指标口径与方法论演示，**结论必须标注"模拟数据"**。
- **真实模型**：compiler 组走 `compileCourseBlueprint` 完整管线，vanilla 组只 `generateCourseBlueprint` 不验证不修复，其余组按同输入降级。需先在「模型接入」配置模型。

## 9. 研究问题映射

| RQ | 问题 | 回答它的指标 | 负责模块 |
| --- | --- | --- | --- |
| RQ1 | 编译器能否把"教学上不成立"的生成变成可判定的失败？ | 硬约束通过率、违规定位覆盖率、先修错误率 | courseValidator |
| RQ2 | 结论是否可溯源？ | 无依据结论比例、伪造引用率 | evidenceLedger |
| RQ3 | 定向验证—修复能否替代整体重生成？ | 修复贡献（repairsPerRun）、修复后通过率、相对整课重生成的延迟/token | courseRepair |
| RQ4 | 编译器产出是否更稳定、更被教师接受？ | 结构稳定性、人工均分、直接使用比例 | courseExperiment |

## 10. 代码地图

| 层 | 文件 |
| --- | --- |
| IR | `frontend/src/utils/courseIR.js` |
| 硬约束验证 | `frontend/src/utils/courseValidator.js` |
| 证据账本 | `frontend/src/utils/evidenceLedger.js` |
| 学科检查 | `frontend/src/utils/subjectCheck/{mathExpr,math7,index}.js` |
| 验证—修复 | `frontend/src/utils/courseRepair.js` |
| 实验评测 | `frontend/src/utils/courseExperiment.js`、`frontend/src/api/experiments.js` |
| 管线编排 | `frontend/src/api/courseStudio.js`（`compileCourseBlueprint` / `compileSceneContent` / `recompilePlan`） |
| 提示词契约 | `frontend/src/api/prompts/courseStudio.js`（IR 契约 + `evidenceRefs` + 场景修复提示词） |
| 状态持久化 | `frontend/src/stores/courseStudio.js`（plan / validation / repairs / ledger） |
| 研究面板 | `frontend/src/views/web/CourseCompilerView.vue`（路由 `/app/compiler`、`/m/compiler`） |
| 测试 | `frontend/scripts/test-course-compiler.mjs`（41 项） |

## 11. 已知局限

1. 覆盖率用词面重叠（中文 bigram）近似语义覆盖，会低估同义改写；正式实验建议叠加人工抽检。
2. 数学检查限线性方程/一元一次；二次方程、不等式组、函数题需扩展 `mathExpr`（当前降级 warning，不误报 error）。
3. 管理域只做数字溯源，不做因果链/案例结构检查。
4. 结构稳定性按场景 `type|title` 集合 Jaccard，不含场景内部 block 级差异。
5. 离线模拟是方法论演示，不能替代真实模型实验结论。
