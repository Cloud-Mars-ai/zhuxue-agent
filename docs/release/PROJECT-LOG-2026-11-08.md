# 项目日志 · 2026-11-08（材料上传四项需求 + 板书交互态修复）

> 编制：WorkBuddy ｜ 编制时间：2026-11-09 00:20（GMT+8）
> 事实基准：`git main = f652122`（T-20 已提交并推送 mygithub），**git 历史共 41 提交**（`git rev-list --count be009a3..main` 实勘）；本文档自身的提交会使总数 +1，以实时复验为准
> 上游日志：`docs/release/PROJECT-LOG-2026-11-07.md`（T-19 及以前）；冲突时以本日志 + 代码为准

---

## 0. 读数面板（30 秒判断项目所处阶段）

| 读数 | 当前值 | 判断 |
| --- | --- | --- |
| 代码基线 | `main = f652122`（T-20 已提交并推送 mygithub） | 可安全接手 |
| 工作树 | **有并行会话未提交改动**（题目质量校验 QUIZ-*：courseValidator/courseRepair/courseStudio 片段/CourseExperience/package.json + 新目录 `src/components/course/`、`scripts/lib/`，其 course-compiler 测试 44/44 绿） | **提交前必须确认归属**；T-20 提交已刻意只含本方 10 文件，未吞并对方工作树 |
| 确定性测试 | E2E **38/38**（T-20 实跑，含新增材料用例 + 505 修复）；text-repair 48/48；openmaic **36/36**（F7 新增）；course-script 36/36；course-compiler 44/44（含并行会话新增 3 项）；visualization 26/26；competition 通过 | 回归基线健康 |
| 本机 .env | `frontend/.env` 已配 DeepSeek key（用户侧接入，gitignore） | **E2E 必须显式置空 key 跑**（见 §3），否则模型真答题、断言漂移 |
| 公网三通道 | 均停留在 T-19 之前构建（add20fd/cb7a064）；**T-20 新构建待部署（需用户授权）** | 机制全通，版本待推送 |
| 阶段判断 | 功能开发主体完成 → 收口 / 发布 / 验收；T-20 补齐材料上传核心体验 | 下一步：部署授权 + 真实链路验收 |

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

*本日志由 WorkBuddy 依据 git `f652122`（41 提交，日志提交自身 +1 以实时复验为准）与代码实勘生成；与旧文档冲突时，以本日志 + `PROJECT-LOG-2026-11-07.md` + 代码为准。建议后续 agent 每次完成实质工作后追加台账条目（任务 / 日期 / 交付 / 验证 / 遗留），保持交接链不断。*
