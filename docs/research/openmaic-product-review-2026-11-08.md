# OpenMAIC 产品调研报告

> 调研日期：2026-11-08 ｜ 调研方：经管Agent项目组（深研研）
> 方法：GitHub 仓库页面实时抓取 + 本地浅克隆（`vendor/openmaic/`，v1.4.1，commit `5bd8cc8`，2026-11-06 20:52 +0800）+ 本项目《OpenMAIC 接入设计》文档交叉验证
> 用途：作为「同一提示词双管线课程生成对比」评测的基线资料（报告②③④的上游依据）

---

## 1. 产品概览

**OpenMAIC**（Open Multi-Agent Interactive Classroom，开源多智能体互动课堂）是清华大学 THU-MAIC 团队的开源项目，MIT 协议，可免费商用（商业合作联系 thu_maic@mail.tsinghua.edu.cn）。

一句话定位：**输入一个主题或一份文档，一键生成一堂"有多智能体实时授课、讨论、白板推导、可交互"的完整互动课堂**。

- 官网/在线体验：https://open.maic.chat/
- 仓库：https://github.com/THU-MAIC/OpenMAIC
- 学术论文：*From MOOC to MAIC: Reimagine Online Teaching and Learning through LLM-driven Agents*，Journal of Computer Science and Technology（JCST）2026，DOI: 10.1007/s11390-025-6000-0（作者含 Yu Zhang、Zhi-Yuan Liu、Mao-Song Sun 等）
- 当前版本：v1.4.1（2026-11-05 发布）；本地克隆快照 commit `5bd8cc8`（feat(edit): course-level undo timeline #2159，2026-11-06）

**热度信号**（GitHub 页面，2026-11-08 抓取）：43.0k stars / 6.6k forks / 859 commits / 177 watching。对教育科技类开源项目属头部热度。

---

## 2. 核心功能矩阵

### 2.1 课堂组件（生成物四种场景类型）

| 场景 | 能力 |
| --- | --- |
| **幻灯片 Slides** | AI 老师配合聚光灯（spotlight）、激光笔（laser）动作进行语音讲解，模拟真实课堂 |
| **测验 Quiz** | 单选/多选/简答，AI 实时判分与反馈 |
| **交互式模拟 Interactive** | 基于 HTML 的交互实验：物理模拟器、流程图等，可动手探索 |
| **项目制学习 PBL** | 选择角色，与 AI 智能体协作完成结构化项目，含里程碑与交付物 |

### 2.2 多智能体互动（产品差异化的核心）

- **课堂讨论**：智能体主动发起话题，学习者可随时加入或被点名互动
- **圆桌辩论**：多个不同人设的智能体围绕话题讨论，配合白板讲解
- **自由问答**：随时提问，AI 老师通过幻灯片/图表/白板解答
- **白板**：智能体在共享 SVG 白板上实时绘图——逐步推导方程、绘制流程图
- **AI 教师引导**：教师智能体可主动操作界面（高亮关键区域、设置条件、给提示），在恰当时机引导注意力

### 2.3 深度交互模式（v0.2.0 起，五种交互界面）

3D 可视化 / 模拟实验 / 游戏 / 思维导图 / 在线编程（浏览器内编码即时运行）。全部响应式（桌面/平板/手机）。官方另有更专业的 UI 生成版本 MAIC-UI（THU-MAIC/MAIC-UI）。

### 2.4 其它能力

- **TTS**：多服务商（openai/azure/glm/qwen/voxcpm/minimax/doubao/elevenlabs/lemonade）；VoxCPM2 自托管 + 音色克隆（Auto 动态音色 / Prompt 自然语言描述音色 / Clone 上传或录制参考音频）
- **ASR**：麦克风与 AI 老师对话；FunASR 本地转写（SenseVoiceSmall/Paraformer/Fun-ASR-Nano）
- **联网搜索/网页抓取**：Kimi、DeepSeek、Firecrawl 等托管阅读服务（需手动开启）
- **i18n**：11 种语言、12 个区域设置；暗色模式
- **知识库**（v1.3.0+）：上传文件持久保存、文件夹管理、每文件只解析一次、`@` 引用、agent 可读取搜索整理

---

## 3. 技术架构

| 层 | 选型 |
| --- | --- |
| 前端框架 | Next.js 16（App Router）+ React 19 + TypeScript 5 + Tailwind CSS 4 |
| 状态管理 | Zustand（`lib/store/`） |
| UI 组件 | shadcn/ui + Radix |
| 动画 | gsap、framer-motion（Motion 默认 300ms tween 固化进描述符） |
| 幻灯片渲染 | 自研 Canvas 幻灯片编辑器/渲染器（`components/slide-renderer/`，自由坐标画布 1000×562.5） |
| 白板 | SVG 绘图（`components/whiteboard/`） |
| 存储 | PostgreSQL 16（课程文档/对话/会话/媒体；媒体可放 S3）+ 资产字节存储 |
| 工作区包 | pnpm workspace；`@openmaic/*` SDK 已发布 npm：dsl / generation / renderer / importer / editor / storage |
| 视频导出 | 独立 render-service 容器（Chromium + FFmpeg + Hyperframes producer） |
| 测试 | Vitest 单测 + Playwright E2E |

**架构要点**：

- **生成流水线**（`@openmaic/generation`）：两阶段——大纲生成 → 逐场景内容生成
- **多智能体编排**（`lib/chat/pi/`）：服务端 Pi 导演循环，通过 `call_agent` 把每轮课堂对话交给各智能体
- **回放引擎**（`lib/playback/`）：状态机 idle → playing → live
- **动作引擎**（`lib/action/`）：21 种动作类型（语音、白板绘图/文字/形状/图表、聚光灯、激光笔…）
- **编排单一事实来源**（`lib/choreography/`）：播放引擎与课堂视频导出器共享同一套编排语义，防止"silently drifting"；用 ESLint 纯度边界规则强制该目录不依赖宿主路径/React/动态 import，使导出器可在纯 Node 环境解释规范
- **服务端优先**（v1.2.0+）：生成在服务端常驻进程运行，关页面/重启不中断；SSE 流式输出（LISTEN/NOTIFY，150ms 消息增量节奏）；1.2.0 起不再支持 Vercel 等 Serverless

---

## 4. 课程生成流程（用户视角）

1. 首页输入主题或上传材料（图片/视频/PPTX/ZIP/PDF；文档经 MinerU 或内置解析器提取）
2. **两阶段流水线**：AI 分析输入生成结构化课堂大纲 → 每个大纲条目生成为丰富场景（slide/quiz/interactive/pbl）
3. Pro 工作台（v1.0.0+）中，发出请求后、第一页生成前即可看到 agent 工作预览；课堂标签页可在学习与编辑间切换
4. 生成完成 → 教室侧载入场景 → 课堂按编排时间线播放（AI 老师语音讲解 + 白板 + 互动）

**Agent 工作台**（v1.0.0 主题）：会话聊天、文件夹管理、时间线（课程级 undo/redo 覆盖手动与 agent 编辑）、草稿编辑；agent 工具集含 web_search、fetch_url（per-session URL trust gate 防 SSRF）、页面生成、幻灯片编辑、花名册/声音注册、文件夹整理。

---

## 5. 模型 Provider 中立设计（槽位机制）

`openmaic.yml` 声明服务端可调用的**服务商**（账号），并为每个**槽位**（用到 AI 的地方）指定模型：

```yaml
providers:
  openai: { preset: openai, apiKey: ${OPENAI_API_KEY} }
slots:
  llm: openai:gpt-5.5          # 默认对话模型
  course.outline: anthropic:claude-sonnet-4-6
  video: null                  # 关闭某项能力
```

- 支持服务商：OpenAI / Azure / Anthropic / Bedrock / Gemini / DeepSeek / Qwen / Kimi / MiniMax / Grok / OpenRouter / TokenDance / 豆包 / 腾讯混元 / 小米 MiMo / 智谱 GLM / Ollama / Lemonade（本地）/ FunASR（本地）/ 任何 OpenAI 兼容服务
- 槽位可 `lock` 锁定或 `allowUserKeys: false` 禁止用户自带密钥；启动时校验配置，出错指出字段/行号
- Token Plan：一个 Key 覆盖对话/图像/视频/TTS/联网（MiniMax、TokenDance、小米 MiMo 均有集群）
- 工程文化：提交记录反复出现 "provider-neutrality" 与 vendor-token 债务清理，不绑定特定厂商

---

## 6. 导出与互操作

| 格式 | 说明 |
| --- | --- |
| **PPTX** | 可编辑幻灯片，含图片、图表、LaTeX 公式；互动/测验/PBL 场景保留为占位页（带在线打开按钮和二维码） |
| **教学资源包** | PPTX + 每个互动场景的独立网页 |
| **离线 HTML** | 单文件离线播放整堂课：带字幕旁白、聚光灯与激光笔、幻灯片视频、测验与互动场景；外部资源（KaTeX/Three.js/Tailwind CDN/字体/图片）以 `data:` URI 内联，导入内网实例后可完全离线播放 |
| **课堂 ZIP** | 完整课堂（结构+媒体），可备份、分享、跨部署迁移 |
| **MP4** | render-service 渲染（Hyperframes），与播放引擎共享编排语义 |

> 400MB 以上的课堂导出为 ZIP。

---

## 7. 部署形态与身份模型

- **环境要求**：Node ≥ 22.19、pnpm ≥ 10、PostgreSQL 16（缺失 `DATABASE_URL` 拒绝启动并以退出码 1 提示）
- **Compose 默认个人安装**：单用户模式（所有浏览器同一个课程库），只监听 127.0.0.1:3000；对外开放需设置长随机 `ACCESS_CODE`（签名令牌 cookie，7 天）+ `PERSISTENCE_POSTGRES_PASSWORD` + `OPENMAIC_PUBLISH_ADDRESS=0.0.0.0`
- **四种身份模式**：单用户 / 共享团队（ACCESS_CODE）/ 匿名（每浏览器 cookie 一个课程库）/ 自有账号（`instrumentation.ts` 注册认证方法）
- **升级纪律**：v1.4.0 起单向升级（asset migration v4 使旧版本拒绝启动；数据库超前时 Node 服务约一分钟内自行退休）；升级前必须停掉所有旧实例
- **中国大陆加速**：Docker 构建支持 `ALPINE_MIRROR` / `NPM_REGISTRY` 参数

---

## 8. 版本演进时间线（节选）

| 版本 | 日期 | 关键内容 |
| --- | --- | --- |
| v0.1.0 | 2026-03-26 | 讨论语音、沉浸模式、键盘快捷键 |
| v0.2.0 | 2026-04-20 | 深度交互模式（3D/模拟/游戏/思维导图/在线编程） |
| v0.2.1 | 2026-04-26 | VoxCPM2 TTS 与音色克隆 |
| v0.3.0 | 2026-06-28 | PBL v2、Edit with AI、`@openmaic/*` SDK 上 npm、协议改 MIT |
| v1.0.0 | 2026-08-27 | Agent 工作台、持久会话、可复用技能、厂商中立服务端 |
| v1.1.0 | 2026-09-24 | 课堂对话改 Agent 循环 |
| v1.2.0 | 2026-10-16 | **服务端优先**（Serverless 不再支持）、联网调研、课堂导出 |
| v1.3.0 | 2026-10-29 | 知识库与 Pro 工作台升级 |
| v1.4.0 | 2026-11-04 | **PBL v3**（云端工作区真实项目 + AI 导师 + 里程碑 + 沙箱）；升级不可逆 |
| v1.4.1 | 2026-11-05 | 后台同步不再丢失编辑与学习进度 |

安全记录：v1.0.1–v1.1.3 连续修了 Next.js RCE、SSRF/DNS 重绑定、MinerU 加固、幻灯片 HTML 净化（GHSA 系列公告）——**迭代很快，安全响应也密集**。

---

## 9. 质量保障体系

- **eval/ 评测套件**（本地克隆实证）：`orchestration`（编排）、`outline-language`（大纲语言）、`pbl-v2-planner`、`sandbox-lifecycle`、`whiteboard-layout` / `whiteboard-shapes`（白板布局/形状）、`zone-of-proximal-development`（**最近发展区**——教学法评测）——已从"功能项目"进入"用教学法指标做自动化评测"的阶段
- **确定性工程**：版本化 zod 校验的动画描述符（声明式 property/from/to/duration/easing）；未解析视频时长默认 `throw`（fail loudly）而非静默 0ms；deterministic no-audio speech estimate
- **交叉 review**：大量 codex / Claude cross-review 轮次修复时间线分歧
- **测试**：Vitest 单测 + Playwright E2E（1.61）+ 包 tarball 冒烟测试

---

## 10. 与本项目的关系

本项目（人机协同助学智能体）已于 2026-11-07 完成 OpenMAIC 课程生成管线的接入（提交 `6cd6421`）：

- **接入内容**：提示词资产（templates + snippets 字节级同步）、模板引擎、JSON 修复、重试策略、大纲契约（`{languageDirective, courseTitle, outlines[]}` 三键）、四场景类型契约（slide/quiz/interactive/pbl）、ScientificModel 四字段
- **接入边界**：OpenMAIC 渲染层是**自由画布 PPT**（1000×562.5 自由坐标 + 交互 HTML）；本项目渲染层是**受控结构化板书**（AI 只填 JSON、前端渲染）。因此渲染层不移植，用确定性适配器（`slideAdapter.js`）桥接：PPTElement[] → 板书 blocks；交互场景抽取 ScientificModel 四字段渲染为受控块
- **保留层**：OpenMAIC 产出仍过本项目课程编译器六层管线（courseIR → validator → repair → evidenceLedger → subjectCheck）
- **开关**：`flags.openmaicPipeline`（默认开），关闭即回退自研管线；任何阶段失败走本地确定性兜底并标「演示缓存」

---

## 11. 优势 / 局限 / 启示

**优势（值得对标）**：
1. 多智能体课堂形态完整（老师+同学+讨论+白板+编排动作），"AI 老师"的存在感和课堂仪式感是纯幻灯片产品没有的
2. 两阶段生成管线经过多版本沉淀，提示词工程（语言推断 6 条决策规则、题型矩阵、widget 选型表）是高质量资产
3. Provider 中立 + 槽位机制，工程可运维性强
4. 导出体系完整（PPTX/离线 HTML/ZIP/MP4），离线 HTML 的 data: URI 内联是真正可用的离线能力
5. 用教学法指标（ZPD）做自动化评测，研究深度超过一般竞品
6. 迭代速度极快（8 个月从 0.1.0 到 1.4.1，859 commits）且安全响应密集

**局限/风险**：
1. 重依赖 PostgreSQL + 常驻 Node 服务，部署门槛高于纯静态/Serverless 方案
2. 自由画布 + 自由 HTML 输出与"受控渲染"安全模型冲突（本项目因此放弃移植渲染层）
3. 单向升级 + 资产迁移，自用版本管理成本高
4. 匿名部署的计费沙箱暴露风险（官方文档明示需 ACCESS_CODE 保护）
5. 热度极高意味着同质化风险——比赛场景需要做出差异，而非复刻

**对我方产品的核心启示**：OpenMAIC 定义了"AI 生成课堂"的体验上限（多智能体、白板编排、深度交互、导出闭环）。本项目的差异化不在复刻这些，而在于**受控渲染的安全模型 + 教学编译器（验证/修复/证据账本）+ 学情数据闭环**——这些正是报告④策略部分要展开的方向。

---

## References

- [THU-MAIC/OpenMAIC GitHub 仓库](https://github.com/THU-MAIC/OpenMAIC)（43.0k stars，MIT，2026-11-08 抓取）
- [OpenMAIC README-zh（本地克隆 vendor/openmaic/README-zh.md，v1.4.1，commit 5bd8cc8）](file:///D:/黑客松/经管Agent/vendor/openmaic/README-zh.md)
- [OpenMAIC package.json（v1.4.1）](file:///D:/黑客松/经管Agent/vendor/openmaic/package.json)
- [JCST 论文：From MOOC to MAIC](https://jcst.ict.ac.cn/en/article/doi/10.1007/s11390-025-6000-0)
- [OpenMAIC 在线体验 open.maic.chat](https://open.maic.chat/)
- [本项目《OpenMAIC 接入设计》](file:///D:/黑客松/经管Agent/docs/research/openmaic-integration-design.md)
