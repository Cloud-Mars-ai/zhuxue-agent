# 41 个教学视频优势提炼与课程生成 AI 复用方案

分析对象：`D:\临时\七年级\01有理数`（23 个）+ `D:\临时\七年级\03一元一次方程`（18 个），共 41 个微课视频，总时长 117.8 分钟，均为 854×480@30fps、AAC 44.1kHz 立体声。原片为「乐乐课堂」风格手绘动画微课（米纸底、卡通人物、渐进揭示）。

**证据基础**：每个视频按 4%→90% 时长均匀抽取 8 帧（共 328 帧，逐帧审阅）；音轨经 `stepaudio-2.5-asr`（Step Plan 自有模型，`api.stepfun.com/v1/audio/transcriptions`）全文转写（41/41 成功）。引用格式：`v06@52s` 表示第 6 个视频第 52 秒帧；引文来自转写原文。按 AGENTS.md §5，只复用**形态与范式**，品牌层（logo、右下角"微信搜索 aoshu222"水印）不在复用范围。

---

## 1. 逐视频速览（41/41 已看）

| # | 视频 | 时长 | 核心招式 | 一句话优势 |
|---|---|---|---|---|
| v01 | 正数与负数 | 142s | 温度计具身引入；正负号念法；0 是分界；相反意义的量（增重/左右走） | 开场钩子→定义→符号→应用→提醒，四段式完整闭环 |
| v02 | 有理数的概念 | 215s | 纠错开场（"有理数是有道理的数吗？No"）；徐光启词源；整数分数统称；π 排除；分类树渐进生成 | 词源故事 + 分类树 + 三点注意收尾 |
| v03 | 有理数的分类 | 265s | 两种分类顺序对比（先整数/分数 vs 先符号）；0 独立成类；"非负"翻译法；用分类表排除解题 | 双视角分类 + 把图表当解题工具 |
| v04 | 数轴 | 171s | 温度计→数轴；三要素；五等分定位分数；动点问题两种可能 | 具体→抽象 + 一题两解不丢解 |
| v05 | 相反数 | 115s | 数轴成对观察；关于原点对称；a 的相反数是 -a；负负得正 | 几何直观 → 符号泛化 |
| v06 | 绝对值 | 184s | 小狗散步故事引出"到原点距离"；三分情况表；\|a\|=a ↔ a≥0 | 故事定义 + 分类讨论表 + 非负数钩子 |
| v07 | 绝对值非负性 | 167s | \|a\|≥0；最小值为 0；和为零则皆为 0；整体思想（x-2 看成整体） | 性质→应用四级阶梯 + 留白填空 |
| v08 | 有理数比较大小 | 120s | 左小右大；数轴摆点排序；区间内数整数；负数"数值越大数越小"反转提醒 | 一题一法 + 显式易错提醒 |
| v09 | 有理数的加法 | 208s | 温故知新桥接；正数国/负数国能量对决故事；同号/异号/相反数三规则 | 国家隐喻讲符号规则 + 规则汇总 |
| v10 | 有理数凑整巧算 | 153s | 凑整 vs 加法交换律并列呈现；换位带符号；先减变加 | 一题两法 + 换位警告 |
| v11 | 相反意义的量与加减 | 148s | 巡逻行程记录；位置=带号和；路程=绝对值和；"14×a"错解先行示众 | 错解先行 + 位置/路程辨析 |
| v12 | 减法及加减混合 | 230s | 4-3=1 归纳出 a-b=a+(-b)；相反数衔接；"曲线是括号，直线是绝对值"口诀 | 归纳转化 + 符号辨识口诀 |
| v13 | 加减混合运算 | 144s | 减变加；凑整；整数/分数分组；同题两种策略 | 技法标签 + 一题两策 |
| v14 | 有理数的乘法 | 224s | 负号"提出来再放回去"；向后转隐喻；观察→归纳同号/异号；奇负偶正 | 身体隐喻 + 归纳法 + 符号先行 |
| v15 | 乘法分配律巧算 | 197s | 公式常驻表头；正用（拆开）/逆用（提取公因数）；除法先化乘法；统一符号 | 公式面板 + 正逆双向 |
| v16 | 除法及乘法混合 | 171s | 倒数（乘积为 1）；0 没有倒数；除变乘；stop 警示牌拦"冲动"；小数化分数 | 温故 + 冲动警示 + 化分数便于约分 |
| v17 | 复杂的乘法运算 | 122s | "标准错误答案"先行再纠错；除变乘；绝对值优先 | 错例教学法 |
| v18 | 四则混合运算 | 215s | 顺序与小学同；括号优先；分步红线下划线；"负数裸奔"拟人错误 | 运算顺序 + 拟人化错误命名 |
| v19 | 有理数的乘方 | 203s | 正方形面积/正方体体积引入；底数/指数/幂术语；"指数的管辖范围"；-5² vs (-5)² 对比 | 具身引入 + 管辖范围隐喻 |
| v20 | 有理数的混合运算 | 202s | 先乘方后乘除再加减；(-1)ⁿ 奇负偶正表；管辖范围再强调；右侧参考面板 | 一题贯穿 + 参考面板 + 跨视频复强调 |
| v21 | 科学记数与近似数 | 197s | 10 的幂阶梯；6×10³ 锚点；"6×10³/60×10²/0.6×10⁴ 三选一"推出规定；小数点移位数=指数 | 规律阶梯 + 规定溯源 + 速算技巧 |
| v22 | 有理数概念综合 | 161s | 快问快答 Q1-Q5（相反数/绝对值/倒数/平方/立方等于本身）；0/±1 特殊值；"依次代入验证"策略 | 问答驱动复习 + 特殊值汇总 |
| v23 | 数轴上的对称点 | 79s | 距离=分段和；对称点距离相等；单题讲透 | 单点突破短视频 |
| v24 | 一元一次方程 | 258s | 方程两条件；元/次数；三条件 ✓/✗ 反例表；系数≠0 陷阱；回带验证 | 概念三条件 + 反例矩阵 + 陷阱 |
| v25 | 等式的性质 | 231s | 冯大壮/金三胖天平故事（鸟落下、排翔、×3、÷2）；c≠0；c²+1≥1 推理 | 天平具身故事 + 除法零陷阱 |
| v26 | 合并同类项与移项 | 235s | 瞪眼法；目标 ax=b 常驻；移项变号；"字母放一边、孤零零的数甩另一边" | 目标驱动 + 移项规则拟人化 |
| v27 | 去括号 | 137s | 单题三变式（括号外正数→负数→俩括号）；漏乘警告；红弧线标注 | 单题深挖变式 |
| v28 | 去分母 | 239s | 每项乘最小公倍数；分子是"一坨"要加括号；整数项也不例外；三题递进 | 易错三连 + 递进 |
| v29 | 分母是小数 | 201s | 分母化整 vs 去分母辨析（一题两法并列） | 易混点对比教学 |
| v30 | 希望工程义演 | 102s | 表格建模（单价/数量/总价三行两列渐进填表）；设 x → 1000-x；总价相等列方程 | 表格法建模 |
| v31 | 工程问题 | 126s | 总量设 1；效率=1/时间；时间轴图分析每人工作时长；工作量相加=1 | 单位 1 + 时间轴 |
| v32 | 经济问题 | 112s | 概念关系图常驻（售价/进价/利润/利润率）；折扣；渐进代入得 a=50 | 概念图 + 渐进代入 |
| v33 | 行程问题 | 113s | 路程=速度×时间公式常驻；计划 vs 实际双行对比表；变速分段 | 对比表 + 分段思想 |
| v34 | 数字问题 | 108s | 等量关系面板；位值展开图；设元原则（便于表示其他量） | 关系面板 + 设元原则 |
| v35 | 简单绝对值方程 | 73s | \|x\|=4→±4→\|x-1\|=4；再应用到含参题（m≠2 筛选） | 基础→应用 + 条件筛选 |
| v36 | 恒等式概念 | 216s | 同类项系数对应相等；合并为 0 则各系数为 0；两种用法归一 | 原理表头 + 方法归一 |
| v37 | 恒等式特值法 | 227s | x=1 / x=-1 代入；两式相减、相加消元；? 号待填 | 特值代入 + 待解提示 |
| v38 | 已知解求参数 | 156s | 参数概念；解回带；三题递进（含"两个 x 都换掉"） | 回带法 + 难度阶梯 |
| v39 | 同解问题 | 137s | 先解无参方程再代入含参方程；两步法 | 两步法显性化 |
| v40 | 系数含参方程 | 193s | ax=b 三分表（唯一解/无数解/无解）；"谁告诉你 a 一定可以除过去？"；化为标准形对照 | 三分讨论表 + 反直觉提问 |
| v41 | 整数解问题 | 176s | 因数分析；正负别忘了；正整数限正因数；小怪→老怪→大 boss | 因数法 + 游戏化难度命名 |

---

## 2. 五维优势清单与 AI 复用映射

> 每条优势 = 描述 + 证据 + **复用功能点/实现思路**。落点均指向现有课程生成链路：`frontend/src/api/prompts/courseStudio.js`（大纲提示词 `courseBlueprintPrompt` / 场景提示词 `courseScenePrompt`）与板书 block 契约。

### 2.1 教学内容组织

**A1 微粒度切片：一个视频只讲一个知识点**
证据：41 个视频时长 73s–265s（中位 171s），如 v23《数轴上的对称点》79s 只讲"距离相等"一个招式；同章内"概念课（v02/v03）+ 技能课（v10/v13）+ 题型课（v30–v34）+ 专题课（v22）"分工明确。
复用：
- **大纲提示词增加切片约束**：场景（scene）按"单个可观察知识点"切分，每场景 estimatedMinutes 压到 2–4 分钟（现状单场景动辄 8 分钟，超出微课注意力窗口）；用 `durationMinutes` 反推场景数而非固定 3–9 个。
- 新增 scene 子类型标注 `granularity: "micro"`，前端课时表按微片渲染，支持"跳过已会切片"。

**A2 同一知识点的多视角覆盖**
证据：v02 按"整数/分数"分、v03 按"符号"分，两个视频讲同一分类；v15 分配律正用+逆用；v29 去分母两法并列。
复用：
- 蓝图提示词对"分类/双重性"知识点强制要求 ≥2 个视角场景（如"按定义分"+"按性质分"），并在场景 description 里写明两个视角的差异，防止 AI 只会一种讲法。

**A3 知识链显式衔接**
证据：v04 开场"在讲正数和负数的时候用过温度计"（回接 v01）；v09"有理数的相关概念你都学完了，那这些概念有什么用武之地呢？那就是计算"（旧知→新课动机）；v26"先问你个脑残的问题，2x=4"（低门槛热身）。
复用：
- `courseScenePrompt` 已有 `previousSceneLine`，升级为**强制开场三件套**：①一句旧知回顾 ②一个低门槛热身题 ③新课动机句；在讲稿契约中固化为 `opening: {review, warmup, motive}` 三个字段，缺一即判不合格。
- 蓝图阶段维护知识点前置依赖（已有 learnerProfile 可扩展），衔接句由知识图谱边自动生成，不靠模型临场编。

**A4 要点清单化（"三点式"总结）**
证据：41 个视频中"总结"出现 28 次，几乎全部以"首先/其次/最后"收尾（v02 三点注意、v24 三要求、v33 三要点）。
复用：
- 场景提示词要求每个 lecture 场景输出 `takeaways: [3]`（恰好 3 条、每条 ≤20 字、可独立成闪卡）；review 场景直接消费该字段生成复盘板书，保证"讲什么就复习什么"。

**A5 题型矩阵化**
证据：应用课按题型切片：表格（v30）/工程（v31）/经济（v32）/行程（v33）/数字（v34），共享同一方法论骨架（找等量关系→设元→列方程→解）。
复用：
- 蓝图提示词对应用题章节生成"题型矩阵"场景组，每个题型一个 micro 场景 + 末尾一个"方法论汇总"场景；prompt 中给出题型枚举（让模型选，不临场发明）。

**A6 难度阶梯（章内 + 视频内）**
证据：章内 v35→v41 绝对值方程→恒等式→特值法→求参数→同解→含参→整数解逐级升；视频内 v14 从 2×3 到 1×(-2)×(-3)×(-4) 五级例题。
复用：
- 蓝图提示词要求标注每场景 `difficultyTier: 1-3`，同章场景必须非降序；场景提示词内部例题按 tier 递进，prompt 明确"至少一个 tier+1 的例题"。

**A7 特殊值/边界汇总课**
证据：v22 快问快答 Q1–Q5 汇总"相反数/绝对值/倒数/平方/立方等于本身"的特殊值（0、±1），并给验证策略"把 0、1、-1 依次带进去"。
复用：
- 新增 review 子类型 `special-values`：提示词要求模型枚举该知识点的边界值/特殊情形（0、±1、空集、分母为零等）做成对照表，并附"代入验证"策略句。

### 2.2 讲解逻辑

**B1 温故知新桥接**（见 A3 证据）
复用：开场三件套（A3）+ 蓝图阶段注入前置知识点要点。

**B2 具体→抽象两级跳**
证据：v04 温度计→数轴；v19 正方形面积 a²、正方体体积 a³→aⁿ；v06 小狗散步→"到原点的距离"→绝对值符号。
复用：
- 场景提示词的 definition block 增加 `concreteAnchor` 字段（强制填一个学生可见、可摸的具体物），`analogy` 字段已有但当前可选——改为 definition 必填，且要求"从 anchor 到 term 的抽象只用一步"。

**B3 故事化/身体化隐喻系统**
证据：v09 正数国负数国"能量对决"（同号累加、异号抵消、相反数同归于尽）；v25 冯大壮金三胖天平（加减乘除四条性质一个故事讲完）；v14"向后转一次到反方向，再转一次转回来"= 负负得正；v12"曲线是括号，直线是绝对值"；v18"负数裸奔了，得给它加个括号"。
复用：
- **新增隐喻库 + 隐喻生成提示词**：`metaphorPrompt` 要求为抽象规则产出一个自洽人格化场景（角色+动作+结局=数学结论），输出 `{metaphor, mapping: {角色→数学对象, 动作→运算, 结局→结果}}`；mapping 必须显式，防止隐喻失真。前端在 definition block 下渲染 `analogy` 卡片。
- 口诀化命名（"裸奔"= 缺括号、"管辖范围"= 指数作用域）进 `callout` block 的 `mnemonic` 字段，成为可检索的错误命名资产。

**B4 错解先行（先给错答案再纠错）**
证据：v17"嘿嘿，这就是标准错误答案啦。想想看，错在哪了？"；v11"有小伙伴说用 14 乘以 a，不对不对"；v24"如果 m 是 1，系数就是零，x 就被干掉了"；v16"冷静一下，冲动是魔鬼呀"。
复用：
- **新增 block 类型 `wrong-first`**：`{type:"wrong-first", wrongSolution, wrongReason, correctSolution}`，契约要求先渲染错解（可点击"我同意"再揭示错误），错因必须对应一个已知易错点。
- 场景提示词要求每个 lecture 场景恰好 1 个 wrong-first 或 callout(warn)，错解从"易错点库"选取而非模型随机编造（见 §3 易错点库）。

**B5 设问—停顿—确认链**
证据："那么问题来了"×7、"对喽"×9、"考考你"、"答案是肯定的"；v37/v38/v39 画面大量"?"气泡留待学生想。
复用：
- 讲稿契约新增 `beats` 数组，每拍标注 `{type:"question"|"answer"|"confirm", pauseMs}`；question 拍之后强制 pauseMs≥1500 的停顿标记，TTS/播放器按标记停顿。question block 已有，升级为支持 `expectedThinkingMs`。

**B6 观察→归纳→验证**
证据：v14 摆出 2×3=6、(-2)×3=-6、2×(-3)=-6、(-2)×(-3)=6 四例→归纳"同号正异号负"；v21 10 的幂阶梯→归纳"后面有几个零就是十的几次方"。
复用：
- 新增 block 类型 `induction`：`{examples:[...], blanks:[待填结论], rule:归纳结论}`，渲染为"例题逐条出现→结论填空→揭晓规则"的三步交互；prompt 要求 examples 数量 3–5 且覆盖正负/零情形。

**B7 一题多解并列**
证据：v10 凑整 vs 交换律同屏左右并列；v13 同题凑整/分组两策略；v29 两法并列。
复用：
- 新增 block 类型 `multi-solution`：`{problem, methods:[{name, steps, tag}], comparison:差异一句话}`；prompt 要求方法名用技法标签（见 C7），比较句必须说明"什么题风下选哪招"。

**B8 方法论显性化 + 验证策略**
证据：v39"两步：先解无参方程，再代入含参方程"；v24"判断方程解最好的办法就是回带"；v22"记不住就把 0、1、-1 依次带进去验证"。
复用：
- definition/callout block 增加 `method` 字段（步骤化方法，≤3 步）与 `verify` 字段（验证策略一句）；review 场景把本课所有 method 汇成方法清单板书。

### 2.3 视觉呈现

**C1 统一纸感手绘风**
证据：全部 41 个视频米纸底 + 手绘线条 + 同一吉祥物生态，无一张照片/截图。
复用：
- 与项目 `yun`/`mo` 浅色纸感主题天然一致（AGENTS.md 硬规则 4）；block 渲染走 `src/theme/tokens.css` 语义变量（硬规则 5），纸感纹理作为 token 级背景资产，不允许页面写死色值。

**C2 渐进式揭示（progressive reveal）**
证据：v01 帧序列 t=6s 仅标题+温度计 → t=23s 出正负数定义 → t=40s 出数列 → t=74s 出有理数行 → t=91s 出相反意义的量 → t=108s 出数轴应用 → t=128s 只剩结论行。内容随讲解一步步"长"出来。
复用：
- **板书 block 数组顺序即揭示顺序**（现有结构已支持），在 block 契约中增加 `reveal: "auto"|"click"` 与 `dependsOn`（前置 block id），播放器/学生端按依赖逐步揭示；animation block 已有"点下一步"机制，推广到全部 block 类型。

**C3 颜色语义系统**
证据：全系列一致——红=负数/警示/当前步，绿=正数/正确/正解，蓝=中性术语；v19 中 -5²（红）与 (-5)²（绿）对比仅靠颜色就传达符号规则。
复用：
- 在 tokens.css 固化语义色板：`--semantic-negative`（红）、`--semantic-positive`（绿）、`--semantic-warn`、`--semantic-current`（当前步高亮）；block 内容字段支持 `tone` 枚举（positive/negative/warn/neutral），AI 只选 tone 不选色值。

**C4 结构化图表族**
证据：分类树（v02/v03）、表格（v30 票价表、v33 计划/实际表）、数轴（v04/v05/v08/v23 反复出现）、天平（v25）、时间轴（v31）、线段图（v33）、概念关系图（v32）、位值展开图（v34）。
复用：
- **新增 block 类型**（全部符合 AGENTS.md 硬规则 8"AI 填 JSON、前端渲染"）：
  - `classification-tree`：`{nodes:[{label, kind:"integer|fraction|positive|negative|zero", children}]}`，对应有理数分类树；
  - `number-line`：`{range, ticks, points:[{value,label,color}], segments:[{from,to,label}]}`，数轴/对称点/动点通用；
  - `case-table`：`{dimension, cases:[{condition, conclusion, tone}]}`，对应 v06 绝对值三分表、v40 ax=b 三分表；
  - `timeline`：`{tracks:[{name, spans:[{from,to,label}]}]}`，对应 v31 工程时间轴；
  - `concept-map`：`{nodes, relations:[{from,to,formula}]}`，对应 v32 经济概念图。
- 场景提示词的 visualHint 机制已存在，扩展为"图表族推荐"：分类知识点→classification-tree，含数轴/对称/动点→number-line，多情形讨论→case-table，多方协作/流程→timeline。

**C5 常驻参考面板**
证据：v15 分配律公式全程驻顶；v26 ax=b 目标常驻；v32 概念图、v33 公式、v36 原理句、v40 三分表全程在屏。
复用：
- block 契约增加 `persistent: true` 标记 + `panel: "header"|"sidebar"` 位置；场景提示词要求每个 lecture 场景恰好 1 个 persistent block（公式/目标形/原理句），学生端渲染为不随滚动消失的侧栏/顶栏。

**C6 高亮标记语言**
证据：红框=关键规则（v09 (+3)+(+4)=+7）；红下划线=当前计算步（v18）；红圈=凑整配对（v10）；✗=错解/排除项（v24/v35）；✓=验证通过（v22/v36）；stop 牌=冲动警示（v16）。
复用：
- block 通用字段 `marks:[{target:"step-2"|"term-a", style:"box"|"underline"|"circle"|"cross"|"check"|"stop", note}]`；场景提示词要求"当前步"marks 在 solution-steps 中唯一，错解 marks 必须配 note。

**C7 步骤编号与技法标签**
证据：v20 ①②③ 圈号标步骤；v12/v13/v17 红框标签"减变加""除变乘""凑整""分组"——把招式命名，学生可复述。
复用：
- solution-steps block 的 step 增加 `no`（自动序号）与 `tag`（技法名，从受控技法语料库选：减变加/除变乘/凑整/分组/移项/去分母/整体思想/特值法/回带/因式分析…）；语料库进提示词白名单，防止模型自造术语。

**C8 mascot 角色提问**
证据：v02 官员小人问"有理数？可比数"；v04 问题兔举牌；v06 小狗；v41"我想出来"小人收尾。
复用：
- question block 增加 `by:"mascot"` 可选字段与 mascot 资产槽位（复用项目现有 IP 形象，不仿原片品牌形象）；讲稿 beats 中 mascot 提问拍用轻快音色/气泡样式区分。

### 2.4 互动设计

**D1 先问后讲**
证据：v08 先抛"五个数排序"再讲法；v22 全程快问快答；v24"考考你，这几个是不是方程"。
复用：
- 新增 scene 子类型 `quiz-rapid`（快问快答）：3–5 道单点题、无长解析、答完即给下一题；蓝图提示词在 lecture 场景之间插入 quiz-rapid 作为"注意力锚点"。

**D2 留白填空（blanks）**
证据：v06 "\|a\|=a，a=?"；v07 "x=___ y=___"；v14 预测 (-2)×(-3)=? 再揭示。
复用：
- 新增 block 类型 `fill-blank`：`{prompt, blanks:[{answer, accept:[]}], reveal:"click"}`； induction/solution-steps 的结论步自动降级为 fill-blank 变体（先空后揭）。

**D3 判断对错（✓/✗）**
证据：v25 四个变形判断（除数可能为 0 的陷阱）；v24 五个式子 ✓/✗ 反例矩阵。
复用：
- 新增 block 类型 `judge`：`{statements:[{text, verdict:true|false, reason}]}`，reason 必填；v25 式"看似对实则错"（除以不确定的 c）作为 prompt 中的范例模式要求复制。

**D4 错误选项示众与纠错**
证据：v11 错解 14a 被打叉、正确 68a 高亮；v35 m=2 被 ✗；v17 整题错解先行。
复用：并入 B4 `wrong-first` block + judge block；另建**易错点库**（见 §3）作为素材源，错因必须挂库，不允许无来源编造。

**D5 性格化讲师人设与结尾行动号召**
证据：讲师人设贯穿 41 个视频——"为师这就讲完了，徒儿们速速刷题去吧"（v05/v08）、"本宫有些乏了，尔等快退下做些题目吧"（v09）、"八嘎呀路"（v06）、"妥妥的/欧了/臣妾做不到呀"；41/41 视频以"明白了吗？→ 快去刷题"收尾。
复用：
- 讲稿契约增加 `persona` 字段（默认"毒舌但亲和的师兄"），允许教师端选 persona 模板；每场景讲稿结尾固定 `cta` 句（链接到本项目练习/检索测），格式化为 `{type:"cta", target:"practice"}` beat。
- 语气规则进提示词白名单：可用"妥妥的/对喽/别忘了/千万"，禁说"综上所述/值得注意的是"等说明书腔。

**D6 游戏化难度命名**
证据：v29"挑战大 boss"、v41"简单的题搞完了，该搞搞老怪了……KO 了老怪"。
复用：
- 场景 difficultyTier 的展示层命名（1=小兵 2=精英 3=boss），仅作用于 UI 文案，不影响内容契约。

### 2.5 节奏控制

**E1 时长预算与知识点复杂度匹配**
证据：单点短视频 73–79s（v23/v35），概念综合 216–265s（v02/v03/v24）；讲稿语速实测平均 327 字/分钟（区间 275–417），密度高但无废字。
复用：
- **讲稿字数预算 = 目标分钟数 × 300–330 字/分钟**，写进场景提示词为硬约束（超字数的板书+讲稿组合直接判超时）；蓝图层 estimatedMinutes 与讲稿预算联动校验。

**E2 三种例题组织模式**
证据：①单题深挖：v27 一题三变式（括号外正→负→俩括号）；②多题并列：v10/v13 左右双题；③例题阶梯：v14 五级、v38 三题递进。
复用：
- 场景提示词要求显式选择并声明 `exampleStrategy: "deepen-one"|"parallel-two"|"ladder"`，对应不同 block 组合（deepen-one=同一 problem 的 solution-steps 变式组；parallel-two=multi-solution 或双栏 table；ladder=tier 递进例题组），禁止"一题一带过"。

**E3 视频内渐进难度曲线**
证据：v28 去分母三题（一个分母→俩分母→俩分母+整数项陷阱）；v41 三题（直接因数→系数变异→俩 x 捆一起）。
复用：同 E1/E6 的 tier 递进约束，prompt 要求每题比上一题多一个"新障碍点"，且障碍点必须来自易错点库。

**E4 高密度讲解 + 结构性停顿**
证据：语速 327 字/分钟但每个"那么问题来了"后都有明显停顿让学生想（v04/v06/v07 连续三问"那么问题又来了"）。
复用：beats 契约中 question 拍强制停顿标记（见 B5）；TTS 侧按 pauseMs 插入静音，前端进度条显示"思考点"。

**E5 关键点跨视频 + 视频内重复强调**
证据：v20"这个注意点我在上一个视频中就已经讲过，但是掉进去的人实在太多，所以我还要再强调一遍"；v29 同一句提醒在开头和结尾各说一遍；"千万"×14、"别忘了"×10、"特别提醒"×7。
复用：
- 易错点库带 `emphasisCount` 字段：跨章节复现的易错点（如移项变号、每项乘公分母）在提示词中被标记为"必须在本课重复强调 ≥2 次（开场 + 收尾各一次）"。

**E6 视频内回顾锚点**
证据：v10"这一步刚才算过，还记得结果为几不？对喽，负六"；v20 每一步都声明"现在只剩简单的加减混合了"。
复用：
- 讲稿 beats 支持 `type:"recall"` 拍（引用本课前文结论），场景提示词要求长步骤链（≥4 步）的解法中至少 1 个 recall 拍，把"进度感知"做实。

---

## 3. 复用映射总表（优势 → 功能点 → 落点）

| 优势 | 功能点 | 落点（文件/结构） | 优先级 |
|---|---|---|---|
| A1 微粒度切片 | 场景按时长反推 + micro 粒度约束 | `courseBlueprintPrompt` 教学设计要求第 7 条改写 | P0 |
| A2 多视角覆盖 | 分类/双重性知识点 ≥2 视角场景 | `courseBlueprintPrompt` 新增约束 | P1 |
| A3 知识链衔接 | 开场三件套 review/warmup/motive | `courseScenePrompt` system 新增 opening 契约 | P0 |
| A4 三点式总结 | takeaways[3] + review 消费 | 场景输出 JSON 新增 takeaways 字段 | P0 |
| A5 题型矩阵 | 题型枚举 + 方法论汇总场景 | `courseBlueprintPrompt` 新增题型枚举 | P1 |
| A6/A7 难度阶梯+特殊值 | difficultyTier 非降序 + special-values review | 蓝图输出 JSON 新增字段 | P1 |
| B2 具体→抽象 | definition.concreteAnchor 必填 | 场景板书 JSON definition block | P0 |
| B3 隐喻系统 | metaphorPrompt + analogy 卡片 + 口诀命名 | 新增提示词函数 + callout.mnemonic | P1 |
| B4 错解先行 | wrong-first block + 易错点库 | 新增 block 类型 + 题库侧易错点表 | P0 |
| B5 设问链 | beats 契约 + 停顿标记 | 新增讲稿生成层（见下） | P0 |
| B6 观察归纳 | induction block | 新增 block 类型 | P1 |
| B7 一题多解 | multi-solution block | 新增 block 类型 | P1 |
| B8 方法论显性化 | method/verify 字段 | definition/callout block 扩展 | P1 |
| C2 渐进揭示 | reveal/dependsOn 字段 | block 通用契约 + 播放器 | P0 |
| C3 颜色语义 | tone 枚举 + tokens.css 语义色 | `src/theme/tokens.css` 新增语义变量 | P0 |
| C4 图表族 | classification-tree / number-line / case-table / timeline / concept-map 五个 block | 板书 block 契约 + 前端渲染组件 | P0（tree/line）P1（其余） |
| C5 常驻面板 | persistent + panel 字段 | block 通用契约 + 布局 | P0 |
| C6 高亮标记 | marks 字段（box/underline/circle/cross/check/stop） | block 通用契约 | P0 |
| C7 技法标签 | 受控技法语料库 + step.tag | 提示词白名单 + solution-steps | P1 |
| C8 mascot 提问 | question.by="mascot" + 项目 IP 槽位 | question block 扩展 | P2 |
| D1 先问后讲 | quiz-rapid 场景子类型 | `courseBlueprintPrompt` SCENE_TYPES 扩展 | P1 |
| D2 留白填空 | fill-blank block | 新增 block 类型 | P0 |
| D3 判断对错 | judge block | 新增 block 类型 | P1 |
| D4 错题素材 | 易错点库（含 emphasisCount） | 数据层新增表 + 提示词引用 | P0 |
| D5 人设+CTA | persona 模板 + cta beat + 语气白名单 | 讲稿契约 + `shared.js` 语气规则 | P1 |
| D6 游戏化命名 | tier 展示名（小兵/精英/boss） | 纯 UI 文案 | P2 |
| E1 节奏预算 | 字数预算 = 分钟 × 300–330 | 场景提示词硬约束 | P0 |
| E2 例题组织 | exampleStrategy 三选一 | 场景提示词约束 | P1 |
| E3/E5 重复强调 | emphasisCount≥2 的易错点双次强调 | 提示词引用易错点库 | P1 |
| E4 思考停顿 | question 拍 pauseMs≥1500 | 讲稿 beats 契约 | P0 |
| E6 回顾锚点 | recall 拍（≥4 步链至少 1 个） | 讲稿 beats 契约 | P1 |

**最大架构缺口：讲稿层。** 41 个视频的本质 = 口语讲稿（人设、设问、停顿、CTA）+ 结构化板书。现有 `courseScenePrompt` 只生成板书 blocks，没有逐拍讲稿。建议新增 `courseScriptPrompt(scene)`：输入场景要点与板书 blocks，输出 `beats[]`（question/answer/confirm/recall/cta + pauseMs + 对应 blockId），与板书按 blockId 对齐播放。这是把"看板书"升级为"讲课"的关键一步。

---

## 4. 易错点库种子（从 41 个视频直接抽取）

提示词与 wrong-first/callout 的素材源，建议入库（字段：id、学科、知识点、错因、正确做法、出现视频、emphasisCount）：

1. 负数"裸奔"——负数参与后续运算必须加括号（v12/v18/v20）
2. 指数管辖范围——-5² ≠ (-5)²；分子/分母/负号谁参与乘方（v19/v20，跨视频复强调）
3. 移项必须变号（v26）
4. 去分母：每项都要乘公因数；分子是"一坨"要加括号；整数项也不例外（v28 三连）
5. 分母化整 ≠ 去分母（前者只动该分数，后者动每一项）（v29 明确点名"搞混"）
6. 乘除混合必须从左到右、先除变乘，不能挑好算的先算（v16/v17）
7. 一元一次方程系数不能为 0（m≠1 / m≠2）（v24/v35）
8. 等式两边除法除数不能为 0；c²+1、|c|+1 型必然非零（v25）
9. 0 没有倒数、0 是正负分界且非正非负（v01/v16/v03）
10. 负数也是整数/因数，"千万别忘了负数"（v41/v22）
11. 总路程 ≠ 位移，求路程忽略符号（v11）
12. 相反数/绝对值/倒数/平方/立方等于本身的特殊值汇总（v22）

---

## 5. 与项目硬规则的兼容性检查

| AGENTS.md 硬规则 | 兼容性 |
|---|---|
| 1. 推送只用 mygithub | 不涉及 |
| 2. 新增页面同步 WEB_TO_MOBILE / GROUP_OF | 本次仅新增 block 类型与提示词，不新增页面；若做 quiz-rapid 独立页则需同步 |
| 3. 构建相对 base，深链接用 server.mjs 验证 | 前端改动后按 `npm run build && node server.mjs` 验证 |
| 4. 浅色纸感 yun/mo，不恢复深色皮肤 | C1 纸感与视频原片一致；语义色板只做浅色档 |
| 5. 颜色/圆角/字体只走 tokens.css | C3 tone→语义变量，AI 不直接输出色值 |
| 6. AI 功能带本地确定性兜底 | 每个新 block 类型需配 offlineFallback 模板（如分类树兜底为两级 table），失败标"演示缓存" |
| 7. 模型只输出 chunkId，不回填页码 | 新 block 全部只引用 chunkId/术语，不涉及页码 |
| 8. 板书只做结构化 block 渲染 | 全部新 block 均为 JSON 契约 + 前端渲染，无自由画布 |

---

## 6. 局限与后续

1. **互动维度为推断**：原片是单向讲授，"互动设计"证据来自讲稿设问与画面填空/判断结构，非真实学生交互数据；上线后应以真实点击/停顿数据校准 pauseMs 与题目密度。
2. **ASR 局限**：口语化讲稿经 `stepaudio-2.5-asr` 转写，个别语气词/数字可能有误（如"二分之派"实为 π）；关键数字均已与帧面核对。
3. **动画转场细节已逐秒重建**：见 §7「转场效果逐帧重建目录」（5 个代表视频，2fps 帧差定位 + 10fps 密集重采样，12 种转场效果带时长参数）。
4. **品牌层已按项目规则排除**：讲师口头禅（"为师/徒儿/本宫"）属可复用的"人设范式"，但具体 IP 形象、logo、水印不在复用范围。

---

## 7. 转场效果逐帧重建目录（1fps 级）

**方法**：对 v01/v02/v09/v19/v26 五个代表视频（覆盖概念引入、分类树、规则隐喻、公式变式、解题步骤流五种课型）先以 2fps 全量抽帧做帧差分析（变化像素占比 + 变化区域包围盒 + 质心追踪），定位全部转场事件（5 视频共 163 个事件，**硬切为 0**——全部是同一画布上的增删），再对 30 个关键事件做 10fps 全分辨率重采样逐帧判读。帧图证据存于 `docs/research/transitions/`（v01_e1–e6、v02_e1–e6、v09_e1–e6、v19_e1–e6、v26_e1–e6，每张 8–18 帧）。

### 7.1 转场效果目录（12 种，含实测时长参数）

| ID | 效果 | 实测表现（证据帧） | 时长参数 | 触发时机 | 仿制参数（前端实现） |
|---|---|---|---|---|---|
| T1 | 逐条弹入 | 刻度数字/要点行/数轴标记/汇总行逐个出现，单个元素 ≤0.5s 完成即停（v01_e1：-10→-20→-30 逐个出现；v01_e5：数轴点标记重入；v09_e6：汇总行逐行） | 单元素 ≤500ms，元素间隔 250–500ms，出现后停留 1.5–4s | 讲稿讲到该元素时 | block `transition.enter="pop"`，`staggerMs:300`，`durationMs:400`，ease-out |
| T2 | 渐隐清除 | 旧内容块整体渐隐（不清屏），保留锚点（温度计/标题）（v01_e3：公式区渐隐只剩温度计；v09_e6：城堡角色渐隐） | 1000–1500ms | 换场景前、新内容入场前 | 退出动画 `exit="fade"`，`durationMs:1200`；锚点元素标 `persistent` 不参与退出 |
| T3 | 定向滑入 | 大号低透明度标题从左侧滑入（v09_e2）；组名标签从右滑入（v02_e1）；mascot 从左滑入站定（v19_e5） | ~500ms，无弹跳 | 标题/标签/mascot 入场 | `enter="slide-left"/"slide-right"`，`durationMs:500` |
| T4 | 分类树生长 | ①叶子组逐组红框高亮 ②大括号展开 ③组名标签落位 ④底部注释（v02_e2 十二帧全程） | 全程 2000–4000ms，四阶段间隔 ~500ms | 分类知识点首讲 | `classification-tree` block 的 `grow:"staged"`，阶段序列 `[highlight-leaves, brace, group-label, note]`，每阶段 500ms |
| T5 | 结构重组 | 旧行渐隐 + 新行淡入 + 括号重画 + 分组换色高亮（v02_e4：小数行删、负整数/负分数行入、括号重画、绿色高亮） | 1500–2000ms | 分类树换维度（整数/分数 ↔ 正/负） | tree block `restructure:true`，行级 `enter/exit` 错开 200ms |
| T6 | 角色步态移动 | 角色双腿交替行走、身体上下微颤，地面拖出轨迹线，头顶名牌跟随，相遇处闪白交锋特效（v09_e5 十三帧） | 移动段 2000–4000ms，步频 ~4 步/s | 叙事隐喻的角色走位 | MVP 不做连续步态；降级为 T1 弹入 + 轨迹线 800ms 延伸 + 相遇点 200ms 闪白（`clash:true`） |
| T7 | 曲线箭头 | 概念框与实例间的弧线箭头，0.5s 内出现并停留（v19_e3：aⁿ 图解 → -5²/(-5)²） | ≤500ms 出现，停留至讲解结束 | 概念→实例连接 | `diagram` block 关系边 `arrow:"curve"`，`drawMs:500` |
| T8 | 高亮切换 | 色块从一个元素跳到另一个元素（绿答案 v26_e2；技法标签灰→红 v26_e5） | ~500ms 交叉淡化 | 当前步/当前技法指示 | block `marks` 支持 `active:true` 单例，切换用 500ms 过渡 |
| T9 | 面板常驻 | 红框目标 ax=b、公式表头、概念图、三分表全程驻屏不动，内容在其下流动（v26 全段；v15/v32/v36/v40） | 全程 | 目标形/公式/原理出现后 | block `persistent:true` + `panel:"header"/"sidebar"`（已在主报告 C5 落地） |
| T10 | 笔刷擦除 | 一支深色笔刷形状横扫过画面完成过渡（v09_e3 @35.8s，5 视频中仅 1 例） | ~500ms | 场景切换（低频） | 可选 `wipe:"brush"`，`durationMs:500`；不强制 |
| T11 | 红笔圈字 | 红笔圈住单个字/词，停留讲解后撤回（v02_e1：圈"理"字） | 圈上 ≤500ms，停留 1–2s，撤回 ≤500ms | 强调术语中的关键字 | `marks` 增加 `style:"circle-char"`，作用域到单字 |
| T12 | 标记即时出现 | ✗/✓/stop 牌/红色下划线在一帧内出现（v24/v35/v16/v18） | <500ms（实测帧间隔内完成） | 错解示众、验证通过、冲动警示 | `marks` 其余样式（cross/check/stop/underline）即时渲染，无动画 |

### 7.2 节奏参数（5 视频合计）

- **事件密度**：v02 46 事件/215s（4.7s 一个）、v09 35/208s（6.0s）、v26 33/235s（7.1s）、v19 28/203s（7.3s）、v01 21/142s（6.8s）——**平均 4.7–7.3s 一次视觉事件**，与讲稿设问拍（"那么问题来了"×7）一一对应。
- **硬切为 0**：全程无镜头切换，所有变化都是同一纸面画布上的增删，这是"板书感"的来源——仿制时**禁用幻灯片式整页翻页**，换页必须走 T2 渐隐 + T1 逐条淡入。
- **单次变化全部局部化**：163 个事件中 156 个是局部/小区域变化（变化像素 <35%），仅 7 个是大块换页（T2/T5/T10），且都伴随锚点保留。
- **停留比**：每个视觉事件后有 1.5–4s 静止停留（讲稿解释时间），动画:停留 ≈ 1:4——**AI 生成时应约束"动效不抢讲解"**。

### 7.3 对课程生成工具的直接结论

1. **block 契约增加 `transition` 字段**（T1/T2/T3/T8/T11/T12 的参数化）：`{enter:"pop|fade|slide-left|slide-right", exit:"fade", durationMs, delayMs, easing}`，AI 只填枚举与毫秒数（受控值域：duration 300–1500ms，delay 0–800ms），前端按 §7.1 仿制参数渲染。这正好落在主报告 C2（渐进揭示）的落地细节上。
2. **黑板类 block 增加 `grow:"staged"`**（T4/T5）：classification-tree / timeline / concept-map 支持"阶段生长"序列，阶段名进白名单。
3. **讲稿 beats 与视觉事件对齐**：§7.2 的 4.7–7.3s 事件密度换算成讲稿约束——**每个 question/answer 拍至多触发 1 个视觉事件**，一拍对应一 block 的 reveal。
4. **禁用整页翻页**：进 prompt 硬约束（"不得输出整页切换效果"），换页 = 渐隐 + 逐条，保持纸面连续性。
5. T6 角色连续走位列为 P2（MVP 用弹入+轨迹线+闪白降级），T10 笔刷擦除不强制。

---

## 8. 落地实现记录（2026-11-07，v3 改造）

§3 复用映射总表的 P0/P1 项已全部落地为代码，P2 三项按降级方案处理。以下逐项标注落地文件与状态，验证结果见 §8.3。

### 8.1 已落地项（按映射表编号）

| 映射项 | 落地文件 | 落地内容 |
|---|---|---|
| A1 微粒度切片 | `src/api/prompts/courseStudio.js`（要求 7）、`src/utils/courseBlueprint.js` | 蓝图提示词按时长反推场景数（`sceneCount = clamp(round(duration/3.5), 3, 9)`）；`rebalanceMinutes` 按 lecture[2,6]/quiz[4,6]/practice[5,8]/review[3,5] 钳制缩放 |
| A2 多视角覆盖 | `src/api/prompts/courseStudio.js`（要求 10） | 分类/双重性知识点要求 ≥2 视角场景 |
| A3 知识链衔接 | `src/api/prompts/courseStudio.js`（opening 契约）+ `courseScenePrompt` | 开场三件套 review/warmup/motive 字段化 |
| A4 三点式总结 | `courseBlueprint.js`（`normalizeTakeaways`）、`courseStudio.js` | takeaways 恰好 3 条，不足从 keyPoints 补齐；review 场景提示词消费 |
| A5 题型矩阵 | `src/api/prompts/courseStudio.js`（题型枚举） | 选择题/填空题/解答题/判断题/应用题枚举 + 方法论汇总场景 |
| A6/A7 难度阶梯+特殊值 | `courseBlueprint.js`（`enforceDifficultyTiers`）、蓝图提示词 | difficultyTier 非降序（running max 抬平）；特殊值收束进 review 场景要求 |
| B2 具体→抽象 | `src/utils/board.js` | `definition.concreteAnchor` 必填（缺失返回 null 触发重试）；另加 `method≤3`/`verify≤140 字` |
| B3 隐喻系统 | `board.js` + `BoardCanvas.vue` | callout tone 扩 `note/warn/idea/success` + `mnemonic` 口诀字段 |
| B4 错解先行 | `board.js` + `BoardCanvas.vue` + `src/data/errorPatterns.js` | `wrong-first` block（wrongSteps≥2/errorIndex 钳制/正确步骤）；易错点库 12 条种子带 `emphasisCount`，提示词注入错因候选 |
| B5 设问链（讲稿层） | `src/utils/courseScript.js` + `courseScriptPrompt` + `src/api/courseStudio.js` + `src/stores/courseStudio.js` + `CourseExperience.vue` | 五拍型 beats 契约（question/answer/confirm/recall/cta）、pauseMs 下限（question≥1500 其余≥600，上限 6000）、blockId 1:1 挂载且仅 question/answer 拍可挂、≥4 拍至少 1 recall、末拍 cta；讲稿面板可折叠展示 |
| B6 观察归纳 | `board.js` + `BoardCanvas.vue` | `induction` block（案例序列 + 点击揭晓规则） |
| B7 一题多解 | `board.js` + `BoardCanvas.vue` | `multi-solution` block（methods 2–3 并列渲染） |
| B8 方法论显性化 | `board.js` + `boardNarration.js` + `boardDownload.js` | definition.method/verify 贯通归一化、TTS 旁白、HTML 导出 |
| C2 渐进揭示 | `board.js`（`normalizeTransition`/`applyCommon`）+ `BoardCanvas.vue` | 全部 16 种 block 挂 `transition`（duration 300–1500/delay 0–800）+ `grow:"staged"` + `reveal:"tap"`；CSS 变量 `--block-duration/--block-delay` 驱动 Vue `<Transition>` |
| C3 颜色语义 | `src/theme/tokens.css` | yun/mo/blue 三套皮肤各加 8 个语义令牌（`--board-negative/-positive/-warn/-current` + soft 变体），marks 与新 block 全部走变量 |
| C4 图表族 | `board.js` + `BoardCanvas.vue` | 新落地 8 种：classification-tree（阶段生长）/number-line（SVG）/fill-blank/wrong-first/judge/case-table/induction/multi-solution；timeline/concept-map 未做（见 §8.2） |
| C5 常驻面板 | `board.js` + `BoardCanvas.vue` | `persistent:true` block 跨场景拼接保留（`visibleBlocks`）；panel 位置参数 MVP 简化为整宽常驻 |
| C6 高亮标记 | `board.js` + `BoardCanvas.vue` | `marks[]` 7 种样式（box/underline/circle/circle-char/cross/check/stop），`indexOf` 定位 + 重叠跳过 |
| C7 技法标签 | `courseScenePrompt` + `board.js` | 受控技法语料白名单进提示词；`solution-steps` 的 `tag` 字段约束枚举 |
| D1 先问后讲 | `courseBlueprintPrompt` | quiz-rapid 场景子类型（每场景一题快问快答） |
| D2 留白填空 | `board.js` + `BoardCanvas.vue` | `fill-blank` block（prompt 必须含 `___`，点击空位揭晓答案） |
| D3 判断对错 | `board.js` + `BoardCanvas.vue` | `judge` block（对错按钮 + 即时反馈） |
| D4 错题素材 | `src/data/errorPatterns.js` | 12 条种子（字段 id/domain/topics/wrong/correct/sources/emphasisCount/tags）+ `errorPatternsFor`（按学科/知识点/文本匹配）+ `highEmphasisPatterns` |
| D5 人设+CTA | `courseScript.js` + `courseScriptPrompt` | `persona` 字段 + 末拍 cta 硬约束；语气规则复用 shared.js |
| E1 节奏预算 | `courseScenePrompt` | `wordBudget(minutes) = 分钟 × 300–330`，讲稿层同步按总字数校验 |
| E2 例题组织 | `courseScenePrompt` | exampleStrategy 三选一（具体数值/一般化/特殊值检验） |
| E3/E5 重复强调 | `courseStudioPrompt`（`reviewEmphasisGuide`） | `emphasisCount≥2` 的 8 条易错点在 review 场景双次强调 |
| E4 思考停顿 | `courseScript.js` | question 拍 `pauseMs≥1500`，其余拍 ≥600，上限 6000 |
| E6 回顾锚点 | `courseScript.js` | `beats.length≥4` 时强制插入 recall 拍 |
| §7.3-1 transition | 见 C2 | T1/T2/T3/T8/T11/T12 全部参数化（enter 四枚举 + exit 两枚举） |
| §7.3-2 staged | 见 C4 | classification-tree 四阶段生长序列（highlight-leaves/brace/group-label/note） |
| §7.3-3 拍-事件对齐 | `courseScriptPrompt` | 每 question/answer 拍至多 1 个 blockId，一拍一 reveal |
| §7.3-4 禁整页翻页 | `courseScenePrompt` | 硬约束"不得输出整页切换效果"，换页 = 渐隐 + 逐条 |

### 8.2 降级与未落地项（排期）

| 项 | 状态 | 说明 |
|---|---|---|
| T6 角色连续步态走位（P2） | 降级 | MVP 用 T1 弹入 + mascot 名牌落位实现；连续步态需精灵动画，待角色资产就绪后排期 |
| T10 笔刷擦除（P2） | 不强制 | 提示词未启用；如需可加 `transition.wipe:"brush"` 渲染分支 |
| D6 tier 展示名（小兵/精英/boss） | 未落地 | 纯 UI 文案，待难度阶梯 UI 暴露给用户时一并加 |
| C8 mascot IP 槽位（P2） | 部分 | `question.by="mascot" 已支持；项目 IP 形象依赖设计资产，当前用中性 mascot 占位 |
| timeline / concept-map block | 未落地 | C4 五个图表族中优先做了 tree/number-line/case-table（证据最多）；timeline/concept-map 的渲染复杂度高且 41 视频中直接证据少，列为下一迭代 |
| 整页翻页检测（运行时） | 未落地 | §7.3-4 目前只约束提示词；运行时可在 normalizeBoardLesson 加"单场景 block 全替换"启发式检测，列为加固项 |

### 8.3 验证结果

- 新增单测 `frontend/scripts/test-course-script.mjs`（36 项断言，8 个分区：新 block 归一化/通用字段契约/序列化与兜底/讲稿 normalize/讲稿兜底/蓝图三函数/易错点库/16 种白名单完整性）。
- 全量测试：`test:text-repair` 34 ✓、`test:visualization` 26 ✓、`test:competition` ✓、`test:course-script` 36 ✓，共 96 项通过。
- `vite build` 2.59s 成功（courseStudio chunk 252.62 kB，超出 500kB 告警线属既有问题）。
- 离线兜底：所有新能力均带本地确定性模板（`buildLocalCourseScript`/`buildLocalBoardLesson`/`buildLocalCourseBlueprint`），模型不可用时降级为"演示缓存"。
