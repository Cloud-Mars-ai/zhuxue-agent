# 智慧学伴赛事数据契约

> 版本：math7-official-v1
> 适用范围：七年级数学“代数式与整式运算、方程与方程组、不等式与不等式组”
> 数据来源：赛方公开模拟学情数据（课程要求、题目与材料、模拟学生、测验节点、作答记录、字段说明）
> 数据边界：学生、班级、分数和作答过程均为模拟数据，仅限本次比赛使用；不得引入真实学生个人信息。

## 0. 已接入数据

| 数据 | 数量 | 说明 |
| --- | ---: | --- |
| 学习主题 | 3 | T01 代数式与整式运算、T02 方程与方程组、T03 不等式与不等式组 |
| 观察指标 | 9 | 每个主题 3 项指标，关联课标整理编号与教材页码 |
| 学习材料 | 11 | 3 张学习卡 + 8 份教材切片索引 |
| 题目 | 54 | 3 道选择题、33 道填空题、18 道解答题 |
| 模拟学生 | 40 | DC01、DC02 两个模拟班 |
| 测验节点 | 2 | N01 上学期期末、N02 下学期期末 |
| 原始作答记录 | 806 | 799 个作答事件，其中 7 条为早期修订版本 |

原始 CSV 位于 `frontend/src/competition/official/`，通过 Vite `?raw` 随构建打包，并由
`officialDataset.js` 转换为本文定义的数据契约。官方 PDF 教材切片以编号、章节和文件路径
登记在课程要求与材料数据中；为避免公网包增加约 40MB，当前不直接复制 PDF 正文。

## 1. 设计原则

1. 原始记录只读保留，质量检查生成独立问题清单。
2. 重复记录、异常记录和缺失字段不得静默删除。
3. `missing` 表示观察信息不足，不进入正确率分母。
4. 统计、排序和推荐由确定性规则计算；模型只负责解释和课程表达。
5. 每个诊断和建议必须能回指学生、作答记录、题目、课程要求和材料。

## 2. 核心对象

| 对象 | 关键字段 | 说明 |
| --- | --- | --- |
| `topics` | `id`, `title`, `summary`, `requirementIds` | 本次范围中的学习主题 |
| `requirements` | `id`, `topicId`, `code`, `title`, `content`, `expectation`, `sourceRef`, `prerequisiteIds` | 学习内容与要求 |
| `materials` | `id`, `topicId`, `requirementIds`, `type`, `title`, `content`, `sourceRef`, `locator` | 课程标准和配套材料 |
| `questions` | `id`, `materialId`, `topicId`, `requirementId`, `type`, `difficulty`, `stem`, `answer`, `concepts` | 练习和题目 |
| `students` | `id`, `displayName`, `group`, `grade` | 脱敏模拟学生与群体 |
| `taskConditions` | `id`, `title`, `audience`, `scope`, `constraints` | 任务条件 |
| `learningRecords` | `id`, `studentId`, `questionId`, `materialId`, `status`, `score`, `maxScore`, `attemptedAt`, `source` | 原始学习记录 |
| `dataQuality` | `rawCount`, `validCount`, `issues`, `coverage` | 数据质量检查结果 |
| `diagnosis` | `studentId`, `requirementId`, `status`, `scoreRate`, `evidenceRefs` | 个体或群体诊断 |
| `recommendation` | `id`, `studentId`, `actions`, `evidenceRefs`, `uncertainty`, `version` | 个性化学习建议 |
| `teacherAdjustment` | `recommendationId`, `action`, `changes`, `reason`, `createdAt` | 教师调整与审计 |

## 3. 学习记录枚举

| `status` | 含义 | 是否进入正确率 |
| --- | --- | --- |
| `correct` | 正确 | 是 |
| `partial` | 部分正确 | 是，按得分率计算 |
| `incorrect` | 错误 | 是 |
| `missing` | 没有观察结果或记录不足 | 否 |

`score` 与 `maxScore` 必须为有限数字；`score` 位于 `0..maxScore`。时间字段缺失时保留记录并提示，但不得伪造时间。

## 4. 质量检查规则

1. 相同 `recordId` 只使用第一条，其余标记 `duplicate_record_id`。
2. 学生、题目或材料引用不存在时标记 `unknown_reference`。
3. 必填字段为空时标记 `missing_required_field`。
4. 分数越界、非数字或状态未知时标记 `invalid_value`。
5. 时间不可解析时标记 `invalid_timestamp`，记录仍可用于掌握度统计。
6. 报告同时保留问题数量、受影响记录 ID 和处理方式。
7. 同一 `attemptEventId` 存在多个 `revision` 时，只采用最高修订版本；旧版本保留原文并报告 `superseded_revision`。
8. `评分状态=待评分` 的记录单独报告，评分完成前不进入掌握度统计。
9. `评分状态=未作答` 的记录映射为 `missing`，进入信息不足统计，不进入正确率分母。

## 5. 个体与群体分析

个体层面按学习主题与课程要求计算：

- 有效作答数、覆盖题目数、覆盖要求比例；
- 得分率、正确/部分正确/错误数量；
- 错误集中概念与证据记录；
- 信息不足项及其原因。

群体层面计算：

- 有效学生数、记录覆盖率、要求覆盖率；
- 群体得分率分布、共性问题、组间差异；
- 样本量不足的结论不进入“已确认薄弱点”。

## 6. 建议约束

每条建议必须包含：

1. 对应问题与证据；
2. 学习内容、材料和练习 ID；
3. 选择理由；
4. 先后顺序和完成标准；
5. 适用范围与不确定性；
6. 教师可调整字段。

默认顺序为：补前置概念 → 重讲目标概念 → 低难度检索 → 中难度变式 → 应用迁移 → 复盘。

## 7. 输出文件

任务成果包至少包含：

- `curriculum.json`：主题、要求、关系与材料出处；
- `data-quality.json`：原始/有效数量、异常和缺失处理；
- `student-analysis.json`：个体摘要与证据；
- `group-analysis.json`：群体摘要、共性与差异；
- `recommendations.json`：建议、理由、顺序和材料映射；
- `case-verification.json`：典型案例的“要求—表现—建议”证据链；
- `records-valid.csv`：有效记录；
- `records-quality-issues.csv`：质量问题记录；
- `schema.json`：字段和枚举说明。
