# 项目日志 · 2026-11-08（材料上传四项需求 + 板书交互态修复 + T-21 学习者闭环与自动课程生成）

> 编制：WorkBuddy ｜ 编制时间：2026-11-09 00:40（GMT+8，T-21 追加）
> 事实基准：`git main = c6d8876`（T-21 已提交并推送 mygithub），**git 历史共 43 提交**（`git rev-list --count HEAD` 实勘）；本文档自身的提交会使总数 +1，以实时复验为准
> 上游日志：`docs/release/PROJECT-LOG-2026-11-07.md`（T-19 及以前）；冲突时以本日志 + 代码为准

---

## 0. 读数面板（30 秒判断项目所处阶段）

| 读数 | 当前值 | 判断 |
| --- | --- | --- |
| 代码基线 | `main = c6d8876`（T-21 已提交并推送 mygithub，见 §4） | 可安全接手 |
| 工作树 | T-21 已收口（19 文件入库）；**无并行会话未提交改动**（T-20 台账所述 QUIZ-* 工作已由 T-21 完成并提交） | 提交前无需再确认归属 |
| 确定性测试 | E2E **39/39**（T-21 实跑，新增演示课程小测+播放+完课报告用例）；text-repair 48/48；openmaic 36/36；course-script 36/36；course-compiler 44/44；visualization 26/26；competition 通过 | 回归基线健康 |
| 本机 .env | `frontend/.env` 已配 DeepSeek key（用户侧接入，gitignore） | **E2E 必须显式置空 key 跑**（见 §3），否则模型真答题、断言漂移 |
| 公网三通道 | T-21 已全部同步：GitHub `c6d8876`；workbuddy 分享链接 `https://zhuxue-agent.app.workbuddy.host/?sharecode=Z7X276B67K`（verified）；腾讯云 4173 新 bundle（Ca65O6_p）验证 200 | 三通道一致，无落后构建 |
| 阶段判断 | T-21（P0/P1 + 自动课程 + 报告 + 发布）完成 → 遗留项（交互数轴 P1-1 / 问题气泡 P2 / Step Key 轮换） | 下一步：按 §4 遗留表推进 |

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

*本日志由 WorkBuddy 依据 git `c6d8876`（43 提交，日志提交自身 +1 以实时复验为准）与代码实勘生成；与旧文档冲突时，以本日志 + `PROJECT-LOG-2026-11-07.md` + 代码为准。建议后续 agent 每次完成实质工作后追加台账条目（任务 / 日期 / 交付 / 验证 / 遗留），保持交接链不断。*
