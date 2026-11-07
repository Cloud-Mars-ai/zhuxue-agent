import { TEXT_INTEGRITY_RULE, TUTOR_IDENTITY, jsonOnly } from './shared'
import {
  learnerProfileGuide,
  normalizeLearnerProfile,
} from '@/utils/learnerProfile'
import { SIMULATION_MODELS } from '@/utils/knowledgeVisualization'

/** 交互模型白名单：提示词只允许模型从这里选，参数以模型声明为准。 */
function simulationGuide() {
  const lines = SIMULATION_MODELS.map((model) => {
    const params = model.params.map((param) => `${param.key}(${param.min}–${param.max})`).join('、')
    return `- ${model.id}：${model.label}${params ? `，参数：${params}` : '，无参数'}`
  })
  return `可选交互模型（只能选这些 id，参数按上面范围给数值）：
${lines.join('\n')}`
}

/**
 * 两阶段课程生成提示词。
 *
 * 结构参考 OpenMAIC 的 requirements-to-outlines / scene-content 分层：
 * 1. 先只生成可编辑大纲，不让模型直接写完整课程；
 * 2. 教师确认大纲后，再逐个场景生成结构化内容。
 *
 * 本项目在此基础上增加三条硬约束：只使用教师确认材料、只返回 chunkId、
 * 内容必须是受控 block/题目结构，不允许 HTML、坐标或自由画布。
 */

const SCENE_TYPES = 'lecture（板书讲解）/ quiz（检索练习）/ practice（案例应用）/ review（收束复盘）'

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
7. ${durationMinutes <= 20 ? '生成 3–5 个场景' : durationMinutes <= 35 ? '生成 5–7 个场景' : '生成 6–9 个场景'}。
8. 至少 2 个 lecture；恰好 1 个 quiz；冲刺模式至少有 1 个 practice；最后 1 个是 review。
9. 每个场景必须有可观察的教学目标、3–5 个要点和预计分钟数。场景时长相加应接近目标时长。
10. sourceChunkIds 只能填写下列材料 ID，不能编页码、文件名或章节号。
11. 课程标题从用户主题提炼，短、可扫读，不超过 30 个汉字；不要写“课程”“讲义”等空泛词。
12. learnerProfile 必须先判断再填写；若用户或材料明确给出年级，必须采用，不能机械沿用系统初判。
13. 理科、几何、函数类概念如果存在“改变一个条件看结果”的结构，在 visualHint 中标注 recommend，并在 description 中说明该场景需要配可交互模型（拖动参数看变化）。

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
      "description": "这个场景的教学作用，1–2句",
      "teachingObjective": "可观察的学习目标",
      "keyPoints": ["要点1", "要点2", "要点3"],
      "estimatedMinutes": 8,
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
  }

  if (outline.type === 'quiz') {
    const system = `${common.systemIdentity}

你是教育测量设计者。为课程「${common.projectTitle}」中的场景「${common.sceneTitle}」生成 2–3 道检索练习题。

硬约束：
- 只考给定材料覆盖的内容；不编教材页码、作者观点或材料外事实。
- 题目要覆盖本场景关键要点，而不是只考术语记忆。
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

硬约束：
- 只使用给定材料；材料未覆盖时明确写“待核对”。
- 禁止输出 HTML、CSS、SVG、坐标、画布尺寸或任意脚本。
- 只能使用这些 block.type：outline / definition / table / diagram / animation / simulation / callout / question。
- 每个 block 都必须严格遵守下方字段契约；不适用的可选字段直接省略。
- 4–8 个 block，必须至少包含 1 个 definition、1 个 table 或 diagram、1 个 question。
- 当学习者处于学前、小学或初中，且概念涉及流程、变化、因果或运算过程时，优先加入 1 个 animation；每一帧只改变一个条件，必须能由学生点击下一步观察变化，不能写成自由画布或脚本。
- 小学内容使用 2–3 帧、短句和一个具体比喻；初中使用 3–4 帧和可操作模型；高中及大学只有在推演关系确实需要时才使用 animation。
- ${common.visualHint} 预判为 recommend 时，必须加入恰好 1 个 simulation block，放在 definition 之后；model 从下面清单中选最贴切的一个，params 只填该模型声明的参数，observe 写 2–3 条"只改一个条件"的观察任务，linkConcept 填本页 definition 的概念名。预判为 optional 时，存在明确参数关系才加；skip 时不加。
- ${common.previous}
- ${common.sourceGuide}
- ${common.textIntegrity}
- 只输出 JSON，不要 Markdown、解释或代码块。

${simulationGuide()}

${jsonOnly(`{
  "sourceChunkIds": ["材料片段ID"],
  "lesson": {
    "chapter": "${project.chapter}",
    "title": "${outline.title}",
    "subtitle": "一句话说明本页解决什么问题",
    "blocks": [
      { "type": "outline", "title": "本节路线图", "items": ["第一站", "第二站", "第三站"] },
      { "type": "definition", "title": "核心概念", "term": "概念名", "definition": "定义", "analogy": "理解抓手" },
      { "type": "simulation", "title": "动手看：圆周运动与向心力", "model": "circular-motion", "params": { "radius": 90, "speed": 4, "mass": 2 }, "observe": ["保持半径不变，把速度调到最大，看向心力怎么变", "保持速度不变，把半径拉到最大"], "linkConcept": "向心力", "caption": "先读定义，再拖参数验证它" },
      { "type": "table", "title": "概念对照", "columns": ["概念", "一句话解释", "案例用法"], "rows": [["A", "解释A", "用法A"], ["B", "解释B", "用法B"]] },
      { "type": "diagram", "title": "判断链", "nodes": [{ "label": "识别现象", "note": "看什么" }, { "label": "匹配概念", "note": "为什么" }], "caption": "关系说明" },
      { "type": "animation", "title": "跟着变化看", "caption": "点下一步观察条件改变后发生了什么", "steps": [{ "label": "初始状态", "detail": "先看起点" }, { "label": "改变条件", "detail": "只改变一个条件" }, { "label": "观察结果", "detail": "说出变化与原因" }] },
      { "type": "callout", "title": "易错点", "tone": "warn", "text": "提醒" },
      { "type": "question", "title": "停下来想一想", "prompt": "问题", "options": ["选项A", "选项B"] }
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
要点：
${common.keyPoints}

教师确认材料：
${common.materialText}

请生成这一页板书。`

  return {
    system,
    user,
    temperature: 0.4,
    maxTokens: 4000,
    reasoningEffort: 'low',
  }
}
