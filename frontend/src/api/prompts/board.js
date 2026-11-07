import {
  TUTOR_IDENTITY,
  LEARNING_ETHICS,
  TEXT_INTEGRITY_RULE,
  disciplineHint,
  jsonOnly,
} from './shared'
import {
  inferLearnerProfile,
  learnerProfileGuide,
  normalizeLearnerProfile,
} from '@/utils/learnerProfile'

const BOARD_SCHEMA = `{
  "chapter": "章节标题",
  "title": "本节主题，最多16字",
  "subtitle": "一句话说明本节解决什么问题",
  "blocks": [
    {
      "type": "outline",
      "title": "本节路线图",
      "items": ["3到5条学习路径"]
    },
    {
      "type": "definition",
      "title": "核心概念",
      "term": "概念名",
      "definition": "教材定义，必须来自给定材料",
      "analogy": "一个有助于理解的类比，可为空"
    },
    {
      "type": "table",
      "title": "对照表",
      "columns": ["维度", "功能", "核心含义"],
      "rows": [["2到4列文本", "与列数一致", "与列数一致"]]
    },
    {
      "type": "diagram",
      "title": "判断链",
      "nodes": [
        { "label": "节点名", "note": "节点说明" }
      ],
      "caption": "图示说明"
    },
    {
      "type": "animation",
      "title": "跟着变化看",
      "caption": "点下一步观察条件改变后的结果",
      "steps": [
        { "label": "初始状态", "detail": "先看起点" },
        { "label": "改变条件", "detail": "每次只改变一个条件" },
        { "label": "观察结果", "detail": "说出变化和原因" }
      ]
    },
    {
      "type": "callout",
      "title": "学习提示",
      "tone": "note|warn|idea",
      "text": "易错点或判断依据"
    },
    {
      "type": "question",
      "title": "停下来想一想",
      "prompt": "一个开放但有明确判断对象的问题",
      "options": ["可选的回答方向A", "可选的回答方向B"]
    }
  ]
}`

export function boardLessonPrompt({ chapter, materialText, discipline, focus, studyMode }) {
  const learnerProfile = normalizeLearnerProfile(
    inferLearnerProfile({ chapter, objective: focus, materialText }),
  )
  const youngerLearner = ['preschool', 'primary', 'junior'].includes(
    learnerProfile.stage,
  )
  return {
    system:
      `${TUTOR_IDENTITY}\n` +
      '你正在设计一页“结构化板书”，不是写一篇文章，也不是画自由画布。' +
      '板书服务于学生看清推理链：先给路线，再解释概念，再用表格或图示做对照，最后用问题逼学生表态。' +
      `${LEARNING_ETHICS}\n` +
      `${disciplineHint(discipline)}\n` +
      `【本轮学习者画像】\n${learnerProfileGuide(learnerProfile)}\n` +
      '硬约束：只使用给定课程材料；模型只写内容与 chunk 之外的章级来源，绝对不要编造页码；' +
      '不输出 HTML、Markdown、坐标、绘图指令或品牌文案；最多 8 个 block，至少包含 outline、definition 和一个 question。' +
      `${youngerLearner ? '当内容涉及流程、变化或运算过程时，加入 1 个 animation，用 2—4 帧表现“只改变一个条件后发生什么”。' : '仅在需要推演关系时使用 animation。'}\n` +
      `${TEXT_INTEGRITY_RULE}\n` +
      jsonOnly(BOARD_SCHEMA),
    user:
      `章节：${chapter}\n` +
      `学习模式：${studyMode === 'sprint' ? '考前冲刺，只讲高频考点与易错辨析' : '正常上课，跟随课程进度完整理解'}\n` +
      (focus ? `学生关注点：${focus}\n` : '') +
      `教师确认材料：\n${materialText}`,
    temperature: 0.35,
    maxTokens: 6000,
    reasoningEffort: 'low',
  }
}

export function boardQuestionPrompt({ chapter, lessonText, question, discipline }) {
  const learnerProfile = normalizeLearnerProfile(
    inferLearnerProfile({
      chapter,
      objective: question,
      materialText: lessonText,
    }),
  )
  return {
    system:
      `${TUTOR_IDENTITY}\n` +
      '你正在白板讲解中接到学生的插问。先判断学生是在确认概念、提出反例，还是要求直接给答案。' +
      '回答要接上当前板书，使用苏格拉底式引导；学生求作业答案时只给判断框架和下一步，不直接代做。' +
      '控制在 80—180 个汉字，先正面回应，再抛回一个可执行的小问题。不要重复整页板书。\n' +
      `${LEARNING_ETHICS}\n` +
      `${TEXT_INTEGRITY_RULE}\n` +
      `${disciplineHint(discipline)}\n` +
      `【本轮学习者画像】\n${learnerProfileGuide(learnerProfile)}`,
    user:
      `章节：${chapter}\n` +
      `当前板书：\n${lessonText}\n\n` +
      `学生插问：${question}`,
    temperature: 0.45,
    maxTokens: 1600,
    reasoningEffort: 'low',
  }
}
