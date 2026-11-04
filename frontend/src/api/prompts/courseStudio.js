import { TUTOR_IDENTITY, jsonOnly } from './shared'

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
  domain = 'management',
}) {
  const identity =
    domain === 'math7'
      ? '你是七年级数学课程设计助手，熟悉有理数、整式和一元一次方程的规则、常见错误与例题组织。'
      : TUTOR_IDENTITY
  const modeText =
    mode === 'sprint'
      ? '考前冲刺：先测后讲，压缩背景，突出高频考点、概念辨析和可考表达。'
      : '正常上课：跟随课程进度，先建立框架，再讲概念、案例与练习。'

  const system = `${identity}

你现在承担教师端的「课程编排师」角色。你的任务不是直接写一篇长讲义，而是先做一份可由教师修改的课程大纲。

课程范围：
- 章节：${chapter}
- 教师目标：${objective}
- 学习者：${audience}
- 学习模式：${modeText}
- 目标时长：${durationMinutes} 分钟

教学设计要求：
1. 只使用给定课程材料；材料未覆盖的内容不补，不引入外部事实。
2. 大纲要有教学递进：先建立问题与框架，再讲核心概念，再辨析/应用，最后用测验和复盘收束。
3. 场景类型只能是：${SCENE_TYPES}。
4. ${durationMinutes <= 20 ? '生成 3–5 个场景' : durationMinutes <= 35 ? '生成 5–7 个场景' : '生成 6–9 个场景'}。
5. 至少 2 个 lecture；恰好 1 个 quiz；冲刺模式至少有 1 个 practice；最后 1 个是 review。
6. 每个场景必须有可观察的教学目标、3–5 个要点和预计分钟数。场景时长相加应接近目标时长。
7. sourceChunkIds 只能填写下列材料 ID，不能编页码、文件名或章节号。
8. 课程标题要短、可扫读，不超过 30 个汉字；不要写“课程”“讲义”等空泛词。

${sourceGuide(sourceChunkIds)}

${jsonOnly(`{
  "courseTitle": "课程标题，≤30字",
  "courseSummary": "2句话说明本课解决什么问题、学完能做什么",
  "languageDirective": "授课语言与术语规则，2句话以内",
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
      "order": 1
    }
  ]
}`)}

不要输出 JSON 之外的任何内容。`

  const user = `教师确认材料（方括号内第一项是 chunkId）：
${materialText || '未检索到材料，请仅生成待核对的概念框架。'}

请生成课程大纲。`

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
      : TUTOR_IDENTITY
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
    materialText: materialText || '未检索到匹配材料。只能给出概念框架，并明确标注“待核对”。',
    sourceGuide: sourceGuide(sourceChunkIds),
  }

  if (outline.type === 'quiz') {
    const system = `${common.systemIdentity}

你是教育测量设计者。为课程「${common.projectTitle}」中的场景「${common.sceneTitle}」生成 2–3 道检索练习题。

硬约束：
- 只考给定材料覆盖的内容；不编教材页码、作者观点或材料外事实。
- 题目要覆盖本场景关键要点，而不是只考术语记忆。
- ${common.previous}
- ${common.sourceGuide}
- 每道题必须有一个明确正确答案，干扰项要合理且互斥。
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
        : '情境来自课程材料允许的管理场景或通用课堂案例，不得声称是材料中的真实企业事件。'
    }
- 题目不能暗示答案；必须要求学生先判断、再用概念解释、最后给行动。
- 参考答案只列判断要点，不给一篇标准答案。
- ${common.previous}
- ${common.sourceGuide}
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

板书只负责讲清楚，不负责堆信息。按“路线 → 定义 → 对照/图示 → 提示 → 追问”组织。

硬约束：
- 只使用给定材料；材料未覆盖时明确写“待核对”。
- 禁止输出 HTML、CSS、SVG、坐标、画布尺寸或任意脚本。
- 只能使用这些 block.type：outline / definition / table / diagram / callout / question。
- 每个 block 都必须严格遵守下方字段契约；不适用的可选字段直接省略。
- 4–7 个 block，必须至少包含 1 个 definition、1 个 table 或 diagram、1 个 question。
- ${common.previous}
- ${common.sourceGuide}
- 只输出 JSON，不要 Markdown、解释或代码块。

${jsonOnly(`{
  "sourceChunkIds": ["材料片段ID"],
  "lesson": {
    "chapter": "${project.chapter}",
    "title": "${outline.title}",
    "subtitle": "一句话说明本页解决什么问题",
    "blocks": [
      { "type": "outline", "title": "本节路线图", "items": ["第一站", "第二站", "第三站"] },
      { "type": "definition", "title": "核心概念", "term": "概念名", "definition": "定义", "analogy": "理解抓手" },
      { "type": "table", "title": "概念对照", "columns": ["概念", "一句话解释", "案例用法"], "rows": [["A", "解释A", "用法A"], ["B", "解释B", "用法B"]] },
      { "type": "diagram", "title": "判断链", "nodes": [{ "label": "识别现象", "note": "看什么" }, { "label": "匹配概念", "note": "为什么" }], "caption": "关系说明" },
      { "type": "callout", "title": "易错点", "tone": "warn", "text": "提醒" },
      { "type": "question", "title": "停下来想一想", "prompt": "问题", "options": ["选项A", "选项B"] }
    ]
  }
}`)}`

  const user = `课程目标：${common.objective}
学习者：${common.audience}
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
