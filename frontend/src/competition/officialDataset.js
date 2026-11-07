import {
  assessmentNodesCsv,
  curriculumCsv,
  fieldsCsv,
  questionsMaterialsCsv,
  responsesCsv,
  studentsCsv,
} from './official/raw-sources.generated.js'
import { parseCsv } from './csv.js'

export const OFFICIAL_DATASET_VERSION = 'math7-official-v1'

const TOPIC_TEXTBOOK_IDS = {
  T01: ['B05', 'B06'],
  T02: ['B02', 'B06'],
  T03: ['B02'],
}

function text(value) {
  return String(value ?? '').trim()
}

function numberOrNull(value) {
  if (value === null || value === undefined || text(value) === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function splitIds(value) {
  return text(value)
    .split(/[、,，;；\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function statusFromResponse(row) {
  const gradingStatus = text(row['评分状态'])
  const score = numberOrNull(row['得分'])
  const maxScore = numberOrNull(row['满分'])
  if (gradingStatus === '未作答') return 'missing'
  if (gradingStatus === '待评分') return 'pending'
  if (gradingStatus !== '已评分') return ''
  if (score === null || maxScore === null || maxScore <= 0) return ''
  if (score === maxScore) return 'correct'
  if (score > 0) return 'partial'
  return 'incorrect'
}

function parseOptions(value) {
  return text(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseScoringPoints(value) {
  return text(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const match = /^(\S+)\s+(.+?)\s+(\d+)分?$/.exec(item)
      return match
        ? { id: match[1], criterion: match[2], score: Number(match[3]) }
        : { id: '', criterion: item, score: null }
    })
}

function questionType(value) {
  return (
    {
      选择题: 'choice',
      填空题: 'fill_blank',
      解答题: 'solution',
    }[text(value)] || 'question'
  )
}

function topicFromCurriculum(rows) {
  const map = new Map()
  rows.forEach((row) => {
    const id = text(row['主题编号'])
    if (!id) return
    if (!map.has(id)) {
      map.set(id, {
        id,
        title: text(row['主题']),
        summary: text(row['主题目标']),
        requirementIds: [],
        assessmentRef: text(row['课标整理编号']),
        textbookRef: text(row['教材正文页']),
      })
    }
    const topic = map.get(id)
    const requirementId = text(row['指标编号'])
    if (requirementId) topic.requirementIds.push(requirementId)
  })
  return [...map.values()]
}

export function buildOfficialCompetitionDataset() {
  const curriculumRows = parseCsv(curriculumCsv)
  const materialRows = parseCsv(questionsMaterialsCsv)
  const studentRows = parseCsv(studentsCsv)
  const nodeRows = parseCsv(assessmentNodesCsv)
  const responseRows = parseCsv(responsesCsv)
  const fieldRows = parseCsv(fieldsCsv)

  // 字段说明.csv → 数据字典（按数据表分组，供工作台“字段说明”面板使用）
  const fieldDefinitions = fieldRows.map((row) => ({
    table: text(row['数据表']),
    field: text(row['字段名']),
    type: text(row['类型']),
    meaning: text(row['含义']),
    format: text(row['取值或格式']),
    example: text(row['示例']),
    whenEmpty: text(row['为空时']),
  }))

  const topics = topicFromCurriculum(curriculumRows)
  const requirements = curriculumRows.map((row) => {
    const topicId = text(row['主题编号'])
    const id = text(row['指标编号'])
    return {
      id,
      topicId,
      code: id,
      title: text(row['观察指标']),
      content: text(row['观察指标']),
      expectation: text(row['主题目标']),
      sourceRef: `课程标准 ${text(row['课标整理编号'])} · 文件页 ${text(row['课标文件页／正文页'])}；教材 ${text(row['教材正文页'])}`,
      prerequisiteIds: [],
      nextRequirementIds: [],
      materialIds: [],
      questionIds: [],
      standardCode: text(row['课标整理编号']),
      standardPages: text(row['课标文件页／正文页']),
      textbookPages: text(row['教材正文页']),
    }
  })
  const requirementById = new Map(requirements.map((item) => [item.id, item]))
  const topicById = new Map(topics.map((item) => [item.id, item]))

  const questionRows = materialRows.filter((row) => text(row['材料类型']) === '题目')
  const supportRows = materialRows.filter((row) => text(row['材料类型']) !== '题目')
  const learningCardByTopic = new Map(
    supportRows
      .filter((row) => text(row['材料类型']) === '学习卡')
      .map((row) => [text(row['主题编号']), text(row['材料编号'])]),
  )

  const questions = questionRows.map((row) => {
    const id = text(row['材料编号'])
    const topicId = text(row['主题编号'])
    const requirementId = text(row['指标编号'])
    const requirement = requirementById.get(requirementId)
    const topic = topicById.get(topicId)
    const maxScore = numberOrNull(row['满分'])
    const type = questionType(row['题型'])
    return {
      id,
      materialId: learningCardByTopic.get(topicId) || '',
      topicId,
      requirementId,
      type,
      questionType: text(row['题型']),
      difficulty: maxScore && maxScore >= 3 ? 3 : 1,
      stem: text(row['题干或内容']),
      options: parseOptions(row['选项']),
      optionsText: text(row['选项']),
      answer: text(row['参考答案']),
      explanation: text(row['参考解析']),
      maxScore,
      scoringPoints: parseScoringPoints(row['评分点']),
      scoringPointsText: text(row['评分点']),
      concepts: [requirement?.title, topic?.title, text(row['题型'])].filter(Boolean),
      sourceRef: text(row['来源或资料文件']) || '赛事新编',
      locator: `题目 ${id}`,
    }
  })

  const materials = supportRows.map((row) => {
    const id = text(row['材料编号'])
    const topicId = text(row['主题编号'])
    const isCard = text(row['材料类型']) === '学习卡'
    const content = text(row['题干或内容'])
    return {
      id,
      topicId,
      requirementIds: splitIds(row['指标编号']),
      type: isCard ? 'explainer' : 'textbook',
      materialType: text(row['材料类型']),
      title: content,
      content,
      sourceRef: text(row['来源或资料文件']),
      locator: isCard ? `学习卡 ${id}` : `教材切片 ${id} · ${content}`,
      relatedTopicIds: isCard
        ? [topicId].filter(Boolean)
        : Object.entries(TOPIC_TEXTBOOK_IDS)
            .filter(([, ids]) => ids.includes(id))
            .map(([relatedTopicId]) => relatedTopicId),
    }
  })

  questions.forEach((question) => {
    const requirement = requirementById.get(question.requirementId)
    if (requirement) requirement.questionIds.push(question.id)
  })
  requirements.forEach((requirement) => {
    requirement.materialIds = materials
      .filter(
        (material) =>
          material.requirementIds.includes(requirement.id) ||
          (material.type === 'textbook' &&
            material.relatedTopicIds.includes(requirement.topicId)),
      )
      .map((material) => material.id)
  })

  const students = studentRows.map((row) => {
    const id = text(row['学生编号'])
    return {
      id,
      displayName: `学生 ${id}`,
      group: text(row['模拟班级编号']),
      grade: numberOrNull(row['年级']) || 7,
    }
  })

  const assessmentNodes = nodeRows.map((row) => ({
    id: text(row['节点编号']),
    date: text(row['模拟测验日期']),
    topicIds: splitIds(row['已教及测量主题']),
    title: text(row['说明']),
    questionIds: splitIds(row['可用题目编号']),
    description: text(row['说明']),
  }))

  const learningRecords = responseRows.map((row) => {
    const questionId = text(row['材料编号'])
    const question = questions.find((item) => item.id === questionId)
    return {
      id: text(row['记录编号']),
      studentId: text(row['学生编号']),
      questionId,
      materialId: questionId,
      topicId: text(row['主题编号']),
      requirementId: question?.requirementId || '',
      nodeId: text(row['节点编号']),
      attemptEventId: text(row['作答事件编号']),
      revision: numberOrNull(row['修订版本']) || 1,
      gradingStatus: text(row['评分状态']),
      status: statusFromResponse(row),
      score: numberOrNull(row['得分']),
      maxScore: numberOrNull(row['满分']),
      attemptedAt: text(row['模拟提交时间']),
      finalAnswer: text(row['学生最终作答']),
      solution: text(row['解答过程']),
      scoringPointScores: text(row['评分点得分']),
      source: '赛方模拟作答记录.csv',
    }
  })

  return {
    meta: {
      id: 'math7-official-simulation-2026',
      version: OFFICIAL_DATASET_VERSION,
      title: '智慧学伴 · 七年级数学赛方模拟学情数据',
      grade: '七年级',
      subject: '数学',
      // 学科方向拆分（2026-11-07）：数学类数据统一归李老师负责
      ownerTeacherId: 'T003',
      ownerTeacher: '李老师',
      sourceType: 'official-competition-package',
      official: true,
      disclaimer:
        '已接入赛方公开模拟学情数据，仅限本次比赛开发、分析与展示使用，不得引入真实学生个人信息。',
      sourceFiles: [
        '课程要求.csv',
        '题目与材料.csv',
        '模拟学生.csv',
        '测验节点.csv',
        '作答记录.csv',
        '字段说明.csv',
      ],
      counts: {
        curriculumRows: curriculumRows.length,
        materialRows: materialRows.length,
        questions: questions.length,
        supportMaterials: materials.length,
        students: students.length,
        assessmentNodes: assessmentNodes.length,
        responseRows: learningRecords.length,
        fieldDefinitions: fieldRows.length,
      },
      generatedAt: '2026-11-06T00:00:00.000+08:00',
    },
    topics,
    requirements,
    materials,
    questions,
    students,
    assessmentNodes,
    taskConditions: [
      {
        id: 'TASK-01',
        title: '学习内容与要求梳理',
        audience: ['teacher', 'student'],
        scope: topics.map((topic) => topic.id),
        constraints: ['标明课标、教材和题目出处', '保留原始观察指标'],
      },
      {
        id: 'TASK-02',
        title: '个体与群体学情分析',
        audience: ['teacher', 'student'],
        scope: topics.map((topic) => topic.id),
        constraints: [
          '同一作答事件采用最高修订版本',
          '未作答和待评分记录单独说明',
          '信息不足不判定为未掌握',
        ],
      },
      {
        id: 'TASK-03',
        title: '个性化学习建议',
        audience: ['teacher', 'student'],
        scope: topics.map((topic) => topic.id),
        constraints: ['对应具体学习卡与题目', '说明提示顺序、完成标准和调整条件'],
      },
    ],
    fieldDefinitions,
    learningRecords,
  }
}
