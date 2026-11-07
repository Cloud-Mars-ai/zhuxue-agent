import { TEXT_INTEGRITY_RULE, TUTOR_IDENTITY, jsonOnly } from './shared'
import {
  learnerProfileGuide,
  normalizeLearnerProfile,
} from '@/utils/learnerProfile'
import { SIMULATION_MODELS } from '@/utils/knowledgeVisualization'
import { errorPatternsFor, highEmphasisPatterns } from '@/data/errorPatterns'

/** 交互模型白名单：提示词只允许模型从这里选，参数以模型声明为准。 */
function simulationGuide() {
  const lines = SIMULATION_MODELS.map((model) => {
    const params = model.params.map((param) => `${param.key}(${param.min}–${param.max})`).join('、')
    return `- ${model.id}：${model.label}${params ? `，参数：${params}` : '，无参数'}`
  })
  return `可选交互模型（只能选这些 id，参数按上面范围给数值）：
${lines.join('\n')}`
}

/** 易错点库注入（报告 D4/B4）：错因只能从库里选，高频项标注需重复强调。 */
function errorPatternGuide(domain, subject = '') {
  const patterns = errorPatternsFor({ domain, subject })
  if (!patterns.length) {
    return '错因必须来自教师确认材料中实际出现过的常见错误，并用材料原话佐证；不许凭空编造错解。'
  }
  const lines = patterns.map(
    (pattern) =>
      `- ${pattern.wrong}｜正确做法：${pattern.correct}${
        pattern.emphasisCount >= 2 ? '（跨章节高频，本课需强调 ≥2 次）' : ''
      }`,
  )
  return `易错点库（错因只能从这里选一条，正确做法按库里给，不许另编）：
${lines.join('\n')}`
}

/**
 * 两阶段课程生成提示词（第三层为讲稿，见 courseScriptPrompt）。
 *
 * 结构参考 OpenMAIC 的 requirements-to-outlines / scene-content 分层：
 * 1. 先只生成可编辑大纲，不让模型直接写完整课程；
 * 2. 教师确认大纲后，再逐个场景生成结构化内容；
 * 3. 场景内容确认后，再生成与视觉事件对齐的讲稿 beats。
 *
 * 本项目在此基础上增加三条硬约束：只使用教师确认材料、只返回 chunkId、
 * 内容必须是受控 block/题目结构，不允许 HTML、坐标或自由画布。
 */

const SCENE_TYPES = 'lecture（板书讲解）/ quiz（检索练习）/ practice（案例应用）/ review（收束复盘）'

/** 场景口播字数预算（E1）：分钟 × 300–330 字。 */
function wordBudget(minutes) {
  const safe = Math.max(2, Math.round(Number(minutes) || 4))
  return `${safe * 300}–${safe * 330} 字`
}

function sourceGuide(sourceChunkIds = []) {
  return sourceChunkIds.length
    ? `可用材料片段 ID：${sourceChunkIds.map((id) => `"${id}"`).join('、')}。只能从这里选。`
    : '当前没有片段 ID；sourceChunkIds 返回空数组。'
}

export function courseBlueprintPrompt({
  chapter,
  objective,
  audience,
  mode,
  durationMinutes,
  materialText,
  sourceChunkIds = [],
  domain = 'general',
  learnerProfile,
}) {
  const identity =
    domain === 'math7'
      ? '你是七年级数学课程设计助手，熟悉有理数、整式和一元一次方程的规则、常见错误与例题组织。'
      : domain === 'management'
        ? `${TUTOR_IDENTITY} 本轮材料明确属于管理主题，但课程范围仍以用户需求和材料为准。`
        : '你是跨学科课程设计助手。你的首要任务是准确理解用户想学的主题和上传材料，再设计对应课程，不把用户需求改写成其他学科。'
  const safeLearner = normalizeLearnerProfile(learnerProfile, {
    objective,
    chapter,
    audience,
    materialText,
  })
  const modeText =
    mode === 'sprint'
      ? '考前冲刺：先测后讲，压缩背景，突出高频考点、概念辨析和可考表达。'
      : '正常上课：跟随课程进度，先建立框架，再讲概念、案例与练习。'
  // 微切片（A1）：按目标时长反推场景数，lecture 2–4 分钟一段
  const sceneCount = Math.min(9, Math.max(3, Math.round(durationMinutes / 3.5)))

  const system = `${identity}

你现在承担教师端的「课程编排师」角色。你的任务不是直接写一篇长讲义，而是先做一份可由教师修改的课程大纲。

课程范围：
- 用户指定的主题或范围：${objective}
- 用户补充的章节名：${chapter || '未指定，以用户主题为准'}
- 教师目标：${objective}
- 学习者：${audience}
- 学习模式：${modeText}
- 目标时长：${durationMinutes} 分钟

教学设计要求：
1. 用户主题是课程设计的第一依据；不能用系统已有课程、章节或教师确认稿覆盖用户主题。
2. 学科、范围和年级均不预设。先根据用户原始需求、学习者描述和材料术语判断真正学科与难度，再设计课程；不能因为产品曾服务管理课程就把其他需求改写为管理学。
3. 有上传材料时，以材料为内容证据，优先使用材料中的术语、结构、例子和限制；材料不足时明确标记“待核对”，不声称引用了教材。
4. 没有上传材料时，可依据用户主题组织通用课程，但不能编造具体教材页码、作者观点或虚假出处。
5. 大纲要有教学递进：先建立问题与框架，再讲核心概念，再辨析/应用，最后用测验和复盘收束。
6. 场景类型只能是：${SCENE_TYPES}。
7. 微切片（节奏）：lecture 场景 2–4 分钟、quiz 4–6 分钟、practice 5–8 分钟、review 3–5 分钟；按目标时长反推场景数（约 ${sceneCount} 个），各场景 estimatedMinutes 相加应接近 ${durationMinutes} 分钟。场景时长同时决定该场景的口播字数预算（分钟 × 300–330 字）。
8. 至少 2 个 lecture；恰好 1 个 quiz；冲刺模式至少有 1 个 practice；最后 1 个是 review。
9. 开场三件套：第一个 lecture 场景的 description 必须写明“回顾锚点 → 热身提问 → 动机问题”三件套各自的具体内容（各一句）。
10. 三点式总结：每个 lecture 与 review 场景必须带恰好 3 条 takeaways——学生看完就能带走的结论句；review 场景的 keyPoints 从前面 lecture 的 takeaways 汇总。
11. 难度阶梯：lecture 场景按 order 标注 difficultyTier（1=识记、单一条件；2=应用、两个条件；3=综合、含易错点），同一课程内非降序。
12. 多视角覆盖：分类、双重性、正负性、多步骤等多视角知识点，至少拆成 2 个不同视角的 lecture 场景（例如“怎么分”与“怎么算”分开讲）。
13. 题型矩阵：quiz 场景从选择题 / 填空题 / 判断题中选取，共 2–3 题；本课若覆盖易错点，至少 1 题直接考查易错点。
14. 特殊值收束：review 场景必须汇总本课特殊值（如 0、1、-1、使系数为 0 的值）与方法清单。
15. sourceChunkIds 只能填写下列材料 ID，不能编页码、文件名或章节号。
16. 课程标题从用户主题提炼，短、可扫读，不超过 30 个汉字；不要写“课程”“讲义”等空泛词。
17. learnerProfile 必须先判断再填写；若用户或材料明确给出年级，必须采用，不能机械沿用系统初判。
18. 理科、几何、函数类概念如果存在“改变一个条件看结果”的结构，在 visualHint 中标注 recommend，并在 description 中说明该场景需要配可交互模型（拖动参数看变化）。

${TEXT_INTEGRITY_RULE}

【系统初判 · 供校正】
${learnerProfileGuide(safeLearner)}

${sourceGuide(sourceChunkIds)}

${jsonOnly(`{
  "courseTitle": "课程标题，≤30字",
  "courseSummary": "2句话说明本课解决什么问题、学完能做什么",
  "languageDirective": "授课语言与术语规则，2句话以内",
  "learnerProfile": {
    "subject": "从需求与材料判断出的学科或主题领域",
    "stage": "preschool|primary|junior|senior|university|adult|adaptive",
    "gradeLabel": "可能年级；没有明确线索时写学段或未明确",
    "confidence": "high|medium|low",
    "evidence": "判断依据，引用用户原话或材料中的短线索",
    "language": "适配该学段的语言方式",
    "teaching": "适配该学段的教学方式与例子类型",
    "board": "板书、模型或交互演示方式"
  },
  "outlines": [
    {
      "id": "scene_1",
      "type": "lecture",
      "title": "场景标题",
      "description": "这个场景的教学作用，1–2句；第一个 lecture 必须在此写全开场三件套",
      "teachingObjective": "可观察的学习目标",
      "keyPoints": ["要点1", "要点2", "要点3"],
      "takeaways": ["带走就能用的结论1", "结论2", "结论3"],
      "difficultyTier": 1,
      "estimatedMinutes": 4,
      "sourceChunkIds": ["材料片段ID"],
      "visualHint": {
        "level": "recommend|optional|skip",
        "reasons": ["为什么这个场景需要（或不需要）可交互模型，1–2条"]
      },
      "order": 1
    }
  ]
}`)}

不要输出 JSON 之外的任何内容。`

  const user = `用户原始需求：
${objective}

可用课程材料（方括号内第一项是 chunkId；没有材料时不要假装有材料）：
${materialText || '未上传匹配材料。请围绕用户原始需求生成课程；具体事实若无法确认，标注“待核对”。'}

请判断这份需求真正要学的主题、学习目标与难度，再生成课程大纲。`

  return {
    system,
    user,
    temperature: 0.35,
    maxTokens: 6000,
    reasoningEffort: 'low',
  }
}

function previousSceneLine(previousScene) {
  if (!previousScene) return '这是第一个场景。'
  const points = (previousScene.keyPoints || []).join('；')
  return `上一场景「${previousScene.title}」讲的是：${points}。只做必要衔接，不要重复整段内容。`
}

/** lecture 板书的 block 契约说明（含 2026-11 新增图表族与通用字段）。 */
function blockContractGuide() {
  return `block.type 白名单（只能选这些）：
- outline：本节路线图 {title, items[]}；作常驻面板时加 persistent:true
- definition：核心概念 {title, term, concreteAnchor, definition, analogy?, method?, verify?}；concreteAnchor 必填——一个学生能指认的具体例子/场景/数字，先具体后抽象；method 是 ≤3 步方法，verify 是验证策略一句
- table：对照表 {title, columns[], rows[][]}
- diagram：关系图 {title, nodes[{label, note}], caption?}
- animation：分步演示 {title, caption?, steps[{label, detail}]}
- simulation：可交互模型 {title, model, params, observe[], linkConcept, caption?}
- callout：提示 {title, tone: note|warn|idea|success, text, mnemonic?}
- question：追问 {title, prompt, options[]}
- classification-tree：分类树 {title, root:{label, note}, branches:[{label, note, children:[{label, note}]}], stages?, caption?}
- number-line：数轴 {title, min, max, ticks[{value, label}], points[{value, label, tone}], segments?[{from, to, label, tone}], caption?}
- fill-blank：留白填空 {title, prompt（用___表示空）, answers[], hint?}
- wrong-first：错解先行 {title, wrongSteps[], errorIndex, errorHint, correctSteps[], takeaway?}
- judge：判断对错 {title, statement, answer:true|false, explanation}
- case-table：情形讨论 {title, dimension, cases:[{condition, conclusion, tone}]}
- induction：观察归纳 {title, examples[], rule, hint?}
- multi-solution：一题多解 {title, problem, methods:[{name, tag, steps[]}], comparison?}

通用可选字段（按需添加，不适用的省略）：
- transition：{enter: pop|fade|slide-left|slide-right, exit: fade, durationMs:300–1500, delayMs:0–800} 入场动效；单元素入场 ≤500ms，成块渐隐 1000–1500ms
- grow:"staged"：分类树按 stages 阶段生长（stages:[{label, branches:[分支下标], expand:[展开下标的分支]}]）
- persistent:true：常驻面板，不随揭示进度撤下
- marks：[{target: 正文中的原词, style: box|underline|circle|circle-char|cross|check|stop}] 文本高亮
- reveal:"tap"：需学生点击后展开（默认随讲解自动出现）`
}

export function courseScenePrompt({ project, outline, materialText, sourceChunkIds = [], previousScene }) {
  const identity =
    project.domain === 'math7'
      ? '你是七年级数学课程助手，必须把符号规则、步骤和等量关系讲清楚，并用材料中的题目证据检查理解。'
      : project.domain === 'management'
        ? `${TUTOR_IDENTITY} 本轮材料明确属于管理主题，但仍须服从当前主题、场景目标和学习者画像。`
        : '你是跨学科课程助教。严格按照用户主题、当前场景目标和材料证据讲解，不切换到其他课程内容。'
  const learnerProfile = normalizeLearnerProfile(project.learnerProfile, {
    objective: project.objective,
    chapter: project.chapter,
    audience: project.audience,
    materialText,
  })
  const common = {
    systemIdentity: identity,
    projectTitle: project.title,
    chapter: project.chapter,
    objective: project.objective,
    audience: project.audience,
    mode:
      project.mode === 'sprint'
        ? '考前冲刺；优先高频考点、易错辨析、可直接用于答题的表达'
        : '正常上课；优先理解框架、概念边界、案例判断链',
    sceneTitle: outline.title,
    sceneDescription: outline.description,
    teachingObjective: outline.teachingObjective,
    keyPoints: (outline.keyPoints || []).map((point, index) => `${index + 1}. ${point}`).join('\n'),
    takeaways: (outline.takeaways || []).map((point, index) => `${index + 1}. ${point}`).join('\n'),
    previous: previousSceneLine(previousScene),
    learnerProfile: learnerProfileGuide(learnerProfile),
    learnerStage: learnerProfile.stage,
    visualHint:
      outline.visualHint?.level === 'recommend'
        ? `本场景预判需要可交互模型（${(outline.visualHint.reasons || []).join('；')}）`
        : outline.visualHint?.level === 'optional'
          ? '本场景可选配交互模型；有可调参数关系时才加。'
          : '本场景不需要交互模型。',
    materialText:
      materialText ||
      '未上传匹配材料。围绕用户主题和场景目标生成内容；具体事实无法确认时标注“待核对”。',
    sourceGuide: sourceGuide(sourceChunkIds),
    textIntegrity: TEXT_INTEGRITY_RULE,
    minutes: outline.estimatedMinutes || 4,
    budget: wordBudget(outline.estimatedMinutes || 4),
  }

  if (outline.type === 'quiz') {
    const system = `${common.systemIdentity}

你是教育测量设计者。为课程「${common.projectTitle}」中的场景「${common.sceneTitle}」生成 2–3 道检索练习题。

硬约束：
- 只考给定材料覆盖的内容；不编教材页码、作者观点或材料外事实。
- 题型从三种中选取：选择题（options 4 个）/ 填空题（options 留空，答案写在 explanation 前段）/ 判断题（options 固定为 ["对","错"]）。
- 题目要覆盖本场景关键要点，而不是只考术语记忆；覆盖易错点时至少 1 题直接考易错点。
- 题干长度、选项措辞和解释方式必须符合学习者画像；低年级避免长句和抽象干扰项。
- ${common.previous}
- ${common.sourceGuide}
- 每道题必须有一个明确正确答案，干扰项要合理且互斥。
- ${common.textIntegrity}
- 只输出 JSON，不要 Markdown、解释或代码块。

${jsonOnly(`{
  "sourceChunkIds": ["材料片段ID"],
  "questions": [
    {
      "stem": "题干",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "answerIndex": 0,
      "explanation": "为什么这个答案正确，以及主要易错点",
      "concept": "考查概念"
    }
  ]
}`)}`
    const user = `课程目标：${common.objective}
学习者：${common.audience}
学习者画像：
${common.learnerProfile}
学习模式：${common.mode}
本场景教学目标：${common.teachingObjective}
要点：
${common.keyPoints}

教师确认材料：
${common.materialText}

请生成检索练习题。`
    return {
      system,
      user,
      temperature: 0.25,
      maxTokens: 3200,
      reasoningEffort: 'low',
    }
  }

  if (outline.type === 'practice') {
    const system = `${common.systemIdentity}

你是课程应用题设计者。为场景「${common.sceneTitle}」设计一道可口头或书面作答的应用题。

硬约束：
- ${
      project.domain === 'math7'
        ? '情境来自数学教材或材料允许的数量关系，不得引入材料外事实。'
        : '情境必须符合当前学科、学习者画像和材料允许范围，不得把无关的管理案例硬套到其他学科，也不得声称虚构情境是材料中的真实事件。'
    }
- 题目不能暗示答案；必须要求学生先判断、再用概念解释、最后给行动。
- 情境与作答要求要符合学习者画像；小学和初中优先使用具体、可操作的现实情境。
- 参考答案只列判断要点，不给一篇标准答案。
- ${common.previous}
- ${common.sourceGuide}
- ${common.textIntegrity}
- 只输出 JSON，不要 Markdown、解释或代码块。

${jsonOnly(`{
  "sourceChunkIds": ["材料片段ID"],
  "prompt": "案例情境与作答要求",
  "referencePoints": ["参考要点1", "参考要点2", "参考要点3"],
  "rubric": [
    { "criterion": "概念判断", "weight": 40 },
    { "criterion": "理论依据", "weight": 35 },
    { "criterion": "行动建议", "weight": 25 }
  ],
  "followUp": "一句苏格拉底式追问"
}`)}`
    const user = `课程目标：${common.objective}
学习者画像：
${common.learnerProfile}
本场景教学目标：${common.teachingObjective}
要点：
${common.keyPoints}

教师确认材料：
${common.materialText}

请生成案例应用题。`
    return {
      system,
      user,
      temperature: 0.45,
      maxTokens: 2800,
      reasoningEffort: 'low',
    }
  }

  const system = `${common.systemIdentity}

你是课程板书设计师。为课程「${common.projectTitle}」中的场景「${common.sceneTitle}」生成一页结构化板书。

板书只负责讲清楚，不负责堆信息。按“路线 → 定义 → 对照/图示 → 提示 → 追问”组织，并根据学习者画像选择比喻、模型或推导的深度。

开场三件套（讲解顺序，不占 block）：
1. 回顾锚点：一句话回顾上一场景结论（第一个场景改为锚定课程目标）；
2. 热身提问：一个 10 秒能答的小问题；
3. 动机问题：引出本页要解决的真问题。
${common.previous}
${
  outline.type === 'review'
    ? `本场景是收束复盘：必须汇总本课 special values（0、1、-1、使系数为 0 的值等）与方法清单。${reviewEmphasisGuide(project.domain)}`
    : ''
}

硬约束：
- 只使用给定材料；材料未覆盖时明确写“待核对”。
- 禁止输出 HTML、CSS、SVG、坐标、画布尺寸或任意脚本。
- 4–8 个 block，必须至少包含 1 个 definition、1 个 table/diagram/classification-tree/number-line/case-table、1 个 question。
- definition 的 concreteAnchor 必填（B2 具体→抽象）：先给一个学生能指认的具体例子/场景/数字，再给抽象定义。
- 每个 lecture 恰好 1 个 wrong-first 或 1 个 callout(tone=warn)（B4 错解先行）：
${errorPatternGuide(project.domain, learnerProfile.subject)}
- 字数预算（E1）：本页口播总字数 ${common.budget}（场景 ${common.minutes} 分钟）；block 内文字精简，长解释留给讲稿层，不要堆段落。
- 图表族推荐（C4）：分类知识点→classification-tree；数轴/对称/动点→number-line；多情形讨论→case-table；观察多个例子找规律→induction；同一题两种解法→multi-solution。
- 例题组织三选一（E2）：一题多变（改一个条件重做）/ 一题多解（用 multi-solution block 并列两种方法）/ 一题多用（同一例子串多个概念）。
- 渐进揭示（C2）：block 数组顺序即揭示顺序；可给 block 加 transition；常驻参考面板加 persistent:true；关键词高亮加 marks；分类树阶段生长用 grow:"staged"+stages。
- 禁止整页翻页：不得输出“翻到下一页/切换页面”类效果；所有变化都是同一板面上的增删，换内容用渐隐 + 逐条出现。
- 当学习者处于学前、小学或初中，且概念涉及流程、变化、因果或运算过程时，优先加入 1 个 animation；每一帧只改变一个条件，必须能由学生点击下一步观察变化，不能写成自由画布或脚本。
- 小学内容使用 2–3 帧、短句和一个具体比喻；初中使用 3–4 帧和可操作模型；高中及大学只有在推演关系确实需要时才使用 animation。
- ${common.visualHint} 预判为 recommend 时，必须加入恰好 1 个 simulation block，放在 definition 之后；model 从下面清单中选最贴切的一个，params 只填该模型声明的参数，observe 写 2–3 条"只改一个条件"的观察任务，linkConcept 填本页 definition 的概念名。预判为 optional 时，存在明确参数关系才加；skip 时不加。
- ${common.sourceGuide}
- ${common.textIntegrity}
- 只输出 JSON，不要 Markdown、解释或代码块。

${blockContractGuide()}

${simulationGuide()}

${jsonOnly(`{
  "sourceChunkIds": ["材料片段ID"],
  "lesson": {
    "chapter": "${project.chapter}",
    "title": "${outline.title}",
    "subtitle": "一句话说明本页解决什么问题",
    "blocks": [
      { "type": "outline", "title": "本节路线图", "items": ["第一站", "第二站", "第三站"], "persistent": true },
      { "type": "definition", "title": "核心概念", "term": "概念名", "concreteAnchor": "学生能指认的具体例子", "definition": "定义", "analogy": "理解抓手", "method": ["步骤1", "步骤2"], "verify": "回带检查" },
      { "type": "simulation", "title": "动手看：圆周运动与向心力", "model": "circular-motion", "params": { "radius": 90, "speed": 4, "mass": 2 }, "observe": ["保持半径不变，把速度调到最大，看向心力怎么变", "保持速度不变，把半径拉到最大"], "linkConcept": "向心力", "caption": "先读定义，再拖参数验证它" },
      { "type": "table", "title": "概念对照", "columns": ["概念", "一句话解释", "案例用法"], "rows": [["A", "解释A", "用法A"], ["B", "解释B", "用法B"]] },
      { "type": "classification-tree", "title": "有理数怎么分", "root": { "label": "有理数", "note": "可写成两个整数之比" }, "branches": [{ "label": "整数", "note": "正整数、0、负整数", "children": [{ "label": "正整数", "note": "1,2,3…" }, { "label": "负整数", "note": "-1,-2…" }] }, { "label": "分数", "note": "含有限小数和循环小数" }], "grow": "staged", "stages": [{ "label": "第一层：先分整数和分数", "branches": [0, 1] }, { "label": "第二层：展开整数", "branches": [0, 1], "expand": [0] }], "caption": "分类看边界，别漏负数" },
      { "type": "number-line", "title": "在数轴上定位", "min": -4, "max": 4, "ticks": [{ "value": -4, "label": "-4" }, { "value": 0, "label": "0" }, { "value": 4, "label": "4" }], "points": [{ "value": -2, "label": "-2", "tone": "negative" }, { "value": 3, "label": "3", "tone": "positive" }], "caption": "原点左边是负数" },
      { "type": "fill-blank", "title": "口诀留白", "prompt": "两数相乘，同号得___，异号得___。", "answers": ["正", "负"], "hint": "先想 (-2)×3 和 (-2)×(-3)" },
      { "type": "wrong-first", "title": "这道题先看错解", "wrongSteps": ["移项：3x = 5 - 2x", "得 5x = 5", "x = 1"], "errorIndex": 0, "errorHint": "检查移项后符号对不对", "correctSteps": ["移项要变号：3x + 2x = 5", "5x = 5", "x = 1，回带检验"], "takeaway": "移项必变号" },
      { "type": "animation", "title": "跟着变化看", "caption": "点下一步观察条件改变后发生了什么", "steps": [{ "label": "初始状态", "detail": "先看起点" }, { "label": "改变条件", "detail": "只改变一个条件" }, { "label": "观察结果", "detail": "说出变化与原因" }] },
      { "type": "callout", "title": "易错点", "tone": "warn", "text": "提醒", "mnemonic": "口诀：异号两数相加，取绝对值大的符号" },
      { "type": "question", "title": "停下来想一想", "prompt": "问题", "options": ["选项A", "选项B"], "transition": { "enter": "pop", "durationMs": 420 } }
    ]
  }
}`)}`

  const user = `课程目标：${common.objective}
学习者：${common.audience}
学习者画像：
${common.learnerProfile}
学习模式：${common.mode}
本场景教学目标：${common.teachingObjective}
场景作用：${common.sceneDescription}
本场景时长：${common.minutes} 分钟（口播字数预算 ${common.budget}）
要点：
${common.keyPoints}
${common.takeaways ? `本场景要带走的结论：\n${common.takeaways}` : ''}

教师确认材料：
${common.materialText}

请生成这一页板书。`

  return {
    system,
    user,
    temperature: 0.4,
    maxTokens: 5200,
    reasoningEffort: 'low',
  }
}

/**
 * 第三阶段：讲稿层（beats 契约）。
 *
 * 依据报告 B5（设问—停顿—确认链）、§7.3 结论 3（讲稿 beats 与视觉事件
 * 1:1 对齐）、E4（思考停顿 pauseMs≥1500）、E1（字数预算）。
 * 板书已经“长”在板面上，讲稿负责在正确的时间说正确的话。
 */
export function courseScriptPrompt({ project, outline, scene, sourceChunkIds = [] }) {
  const identity =
    project.domain === 'math7'
      ? '你是七年级数学老师，口语化、短句、爱提问，讲完一个点就停下来让学生想。'
      : '你是课程主讲老师。用口语讲学，不念稿；每个知识点之间用提问推进。'
  const minutes = Math.max(2, Math.round(Number(outline.estimatedMinutes) || 4))
  const blocks = scene?.lesson?.blocks || []
  const blockList = blocks.length
    ? blocks
        .map((block, index) => `${block.id || `b${index + 1}`}｜${block.type}｜${block.title}`)
        .join('\n')
    : '（本场景无板书 block：quiz/practice 场景按题目组织 beats）'
  const kind =
    scene?.kind === 'quiz'
      ? '本场景是检索练习：每个 question 拍读一道题（pauseMs≥2000），answer 拍只给判断要点，不要展开完整解析。'
      : scene?.kind === 'practice'
        ? '本场景是案例应用：第一拍念案例情境，中间拍给思考框架，最后一拍 cta。'
        : '本场景是板书讲解：beats 与板书 block 的出现顺序对齐。'

  const system = `${identity}

你是课程讲稿作者。为课程「${project.title || ''}」中的场景「${outline.title}」写一份口语讲稿。

讲稿不是把板书念一遍，而是在正确的时间说正确的话：
- 先问后讲：每个新知识点先用一个 question 拍把问题抛出来；
- 讲完就停：question 拍之后留足思考时间；
- 确认闭环：学生（可能）答完，用 confirm 拍给出判断和反馈。

硬约束：
- ${kind}
- 第一拍必须是 question（动机设问或回顾设问），最后一拍必须是 cta。
- question 拍 pauseMs ≥ 1500（思考停顿，E4）；其他拍 ≥ 600。
- 每个 question/answer 拍最多关联 1 个 blockId（视觉事件与讲解 1:1 对齐）；confirm/recall/cta 不挂 blockId；blockId 只能取下方清单里的 id。
- beats 总数 6–16 个；达到 4 拍以上时至少 1 个 recall（回顾锚点）。
- 每拍 text ≤ 90 字，口语化，可以用“我们/你/想一想/对不对”，不要书面长句。
- 全篇口播总字数 = ${minutes} 分钟 × 300–330 字（约 ${minutes * 300}–${minutes * 330} 字）。
- 禁止“翻页/下一页/请看大屏幕”类表述；板面变化一律说“我们接着看/回到黑板/把它写在旁边”。
- 只讲本场景材料覆盖的内容；材料未覆盖的标注“待核对”。
- ${TEXT_INTEGRITY_RULE}
- ${sourceGuide(sourceChunkIds)}
- 只输出 JSON，不要 Markdown、解释或代码块。

板书 block 清单（blockId 只能从这里选）：
${blockList}

${jsonOnly(`{
  "persona": "讲稿人设一句话，如：沉稳的数学老师，多用提问推进",
  "beats": [
    { "kind": "question", "text": "设问原话", "pauseMs": 1800, "blockId": "b1", "emphasis": ["关键词"] },
    { "kind": "answer", "text": "讲解原话", "pauseMs": 800, "blockId": "b1", "emphasis": [] },
    { "kind": "confirm", "text": "确认与反馈", "pauseMs": 800 },
    { "kind": "recall", "text": "回顾锚点", "pauseMs": 1200 },
    { "kind": "cta", "text": "行动号召", "pauseMs": 800 }
  ]
}`)}`

  const user = `课程目标：${project.objective || ''}
学习者：${project.audience || ''}
学习模式：${project.mode === 'sprint' ? '考前冲刺' : '正常上课'}
本场景教学目标：${outline.teachingObjective || ''}
要点：
${(outline.keyPoints || []).map((point, index) => `${index + 1}. ${point}`).join('\n')}

教师确认材料：
${scene?.sourceChunkIds?.length ? '（已随场景注入，讲稿不得超出材料范围）' : '未上传匹配材料。'}

请生成本场景的讲稿 beats。`

  return {
    system,
    user,
    temperature: 0.5,
    maxTokens: 3600,
    reasoningEffort: 'low',
  }
}

/** review 场景提示词引用：跨章节高频易错点需双次强调（E3/E5）。 */
export function reviewEmphasisGuide(domain = 'math7') {
  const patterns = highEmphasisPatterns(domain)
  if (!patterns.length) return ''
  return `本课高频易错点（开场与收尾各强调一次）：${patterns
    .map((pattern) => pattern.wrong)
    .join('；')}。`
}
