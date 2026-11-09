import {
  COMPETITION_DATASET_VERSION,
  DATA_DICTIONARY,
  buildCompetitionDataset,
  getMaterial,
  getQuestion,
  getRequirement,
  getTopic,
} from './dataset.js'
import { parseCsv } from './csv.js'
import { normalizeBoardLesson } from '../utils/board.js'
import { ensureSimulationBlock } from '../utils/knowledgeVisualization.js'

const ANALYSIS_VERSION = 'math7-analysis-v1'
const VALID_STATUSES = new Set(['correct', 'partial', 'incorrect', 'missing'])
const STATUS_ALIASES = {
  correct: 'correct',
  right: 'correct',
  true: 'correct',
  正确: 'correct',
  partial: 'partial',
  partly_correct: 'partial',
  部分正确: 'partial',
  incorrect: 'incorrect',
  wrong: 'incorrect',
  false: 'incorrect',
  错误: 'incorrect',
  missing: 'missing',
  absent: 'missing',
  no_record: 'missing',
  缺失: 'missing',
  未记录: 'missing',
}

const FIELD_ALIASES = {
  recordId: ['recordId', 'record_id', 'id', '记录编号'],
  studentId: ['studentId', 'student_id', '学生编号'],
  questionId: ['questionId', 'question_id', '题目编号'],
  materialId: ['materialId', 'material_id', '材料编号'],
  requirementId: ['requirementId', 'requirement_id', '要求编号'],
  status: ['status', 'result', '作答结果', '评分状态'],
  score: ['score', '得分'],
  maxScore: ['maxScore', 'max_score', '满分'],
  attemptedAt: ['attemptedAt', 'attempted_at', 'timestamp', '作答时间'],
  attemptEventId: ['attemptEventId', 'attempt_event_id', 'event_id', '作答事件编号'],
  revision: ['revision', '修订版本'],
  gradingStatus: ['gradingStatus', 'grading_status', '评分状态'],
  source: ['source', '来源'],
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function text(value) {
  return String(value ?? '').trim()
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function readField(row, field) {
  for (const key of FIELD_ALIASES[field] || [field]) {
    if (Object.prototype.hasOwnProperty.call(row, key)) return row[key]
  }
  return undefined
}

function pct(value) {
  return Math.round((Number(value) || 0) * 100)
}

function ratio(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0
}

function scoreOf(record) {
  const max = finiteNumber(record.maxScore) ?? 10
  const raw = finiteNumber(record.score)
  if (raw !== null) return { score: raw, maxScore: max }
  if (record.status === 'correct') return { score: max, maxScore: max }
  if (record.status === 'partial') return { score: max / 2, maxScore: max }
  return { score: 0, maxScore: max }
}

export function normalizeLearningRecord(row, context = {}) {
  const raw = row && typeof row === 'object' ? row : {}
  const statusRaw = text(readField(raw, 'status')).toLowerCase()
  const gradingStatus = text(readField(raw, 'gradingStatus'))
  const questionId = text(readField(raw, 'questionId'))
  const knownQuestion =
    context.questionById?.get?.(questionId) || getQuestion(context.dataset, questionId)
  const score = finiteNumber(readField(raw, 'score'))
  const maxScore =
    finiteNumber(readField(raw, 'maxScore')) ?? finiteNumber(knownQuestion?.maxScore)
  let status = STATUS_ALIASES[statusRaw] || statusRaw
  if (gradingStatus === '未作答') status = 'missing'
  else if (gradingStatus === '待评分') status = 'pending'
  else if (gradingStatus === '已评分' && score !== null && maxScore !== null) {
    status = score >= maxScore ? 'correct' : score > 0 ? 'partial' : 'incorrect'
  }

  return {
    id: text(readField(raw, 'recordId')),
    studentId: text(readField(raw, 'studentId')),
    questionId,
    materialId:
      text(readField(raw, 'materialId')) ||
      text(knownQuestion?.materialId),
    requirementId:
      text(readField(raw, 'requirementId')) ||
      text(knownQuestion?.requirementId),
    status,
    gradingStatus,
    attemptEventId: text(readField(raw, 'attemptEventId')),
    revision: finiteNumber(readField(raw, 'revision')) || 1,
    score,
    maxScore,
    attemptedAt: text(readField(raw, 'attemptedAt')),
    topicId: text(raw.topicId || raw['主题编号']),
    nodeId: text(raw.nodeId || raw['节点编号']),
    finalAnswer: text(raw.finalAnswer || raw['学生最终作答']),
    solution: text(raw.solution || raw['解答过程']),
    scoringPointScores: text(raw.scoringPointScores || raw['评分点得分']),
    source: text(readField(raw, 'source')) || 'imported',
  }
}

export function mergeImportedRecords(dataset, rows, source = 'csv-import') {
  const next = clone(dataset)
  const imported = (Array.isArray(rows) ? rows : []).map((row) =>
    normalizeLearningRecord(
      {
        source,
        ...row,
      },
      { dataset: next },
    ),
  )
  next.learningRecords = [...(next.learningRecords || []), ...imported]
  next.meta = {
    ...next.meta,
    lastImportAt: new Date().toISOString(),
    lastImportCount: imported.length,
    lastImportSource: source,
  }
  return next
}

export function analyzeDataQuality(dataset) {
  const studentIds = new Set((dataset?.students || []).map((item) => item.id))
  const questionById = new Map((dataset?.questions || []).map((item) => [item.id, item]))
  const materialIds = new Set((dataset?.materials || []).map((item) => item.id))
  const requirementIds = new Set((dataset?.requirements || []).map((item) => item.id))
  const seenRecordIds = new Set()
  const issues = []
  const validRecords = []
  const normalizedEntries = (dataset?.learningRecords || []).map((rawRecord, index) => ({
    rawRecord,
    index,
    record: normalizeLearningRecord(rawRecord, { dataset, questionById }),
  }))
  const latestByEvent = new Map()
  const supersededIndexes = new Set()
  normalizedEntries.forEach((entry) => {
    const eventId = entry.record.attemptEventId
    if (!eventId) return
    const previous = latestByEvent.get(eventId)
    if (!previous) {
      latestByEvent.set(eventId, entry)
      return
    }
    if (entry.record.revision > previous.record.revision) {
      supersededIndexes.add(previous.index)
      latestByEvent.set(eventId, entry)
    } else {
      supersededIndexes.add(entry.index)
    }
  })

  function issue(record, index, code, severity, message, action) {
    issues.push({
      code,
      severity,
      message,
      action,
      recordId: record.id || '(空记录编号)',
      rawIndex: index,
    })
  }

  normalizedEntries.forEach(({ record, index }) => {
    if (supersededIndexes.has(index)) {
      const latest = latestByEvent.get(record.attemptEventId)
      issue(
        record,
        index,
        'superseded_revision',
        'info',
        '同一作答事件存在更高修订版本',
        `采用修订版本 ${latest?.record.revision || record.revision + 1}，本条保留原文但不进入统计`,
      )
      return
    }

    if (!record.id) {
      issue(record, index, 'missing_required_field', 'error', '记录编号为空', '保留原始行，不进入分析')
      return
    }
    if (seenRecordIds.has(record.id)) {
      issue(record, index, 'duplicate_record_id', 'error', '记录编号重复', '保留首条，忽略重复记录')
      return
    }
    seenRecordIds.add(record.id)

    if (!record.studentId) {
      issue(record, index, 'missing_required_field', 'error', '学生编号为空', '保留原始行，不进入分析')
      return
    }
    if (!studentIds.has(record.studentId)) {
      issue(record, index, 'unknown_reference', 'error', '学生编号不存在', '保留原始行，不进入分析')
      return
    }

    const question = questionById.get(record.questionId)
    if (!record.questionId || !question) {
      issue(record, index, 'unknown_reference', 'error', '题目编号不存在', '保留原始行，不进入分析')
      return
    }

    if (record.status === 'pending') {
      issue(record, index, 'pending_review', 'warning', '记录仍在待评分状态', '保留原始行，评分完成后重新分析')
      return
    }

    if (!VALID_STATUSES.has(record.status)) {
      issue(record, index, 'invalid_value', 'error', '作答状态无法识别', '保留原始行，不进入分析')
      return
    }

    const effectiveRequirementId = question.requirementId || record.requirementId
    if (!requirementIds.has(effectiveRequirementId)) {
      issue(record, index, 'unknown_reference', 'error', '课程要求编号不存在', '保留原始行，不进入分析')
      return
    }

    let materialId = record.materialId || question.materialId
    const materialIsQuestion = materialId === question.id
    if (materialId && !materialIds.has(materialId) && !materialIsQuestion) {
      issue(record, index, 'unknown_material_reference', 'warning', '材料编号不存在', '使用题目关联材料继续分析')
      materialId = question.materialId
    }

    let maxScore = record.maxScore
    if (maxScore === null || maxScore <= 0) {
      maxScore = 10
      issue(record, index, 'derived_value', 'info', '满分缺失或无效', '按 10 分制继续分析')
    }

    if (record.status === 'missing') {
      if (record.score !== null) {
        issue(record, index, 'inconsistent_value', 'warning', '缺失状态包含分数', '分数不进入正确率分母')
      }
    } else {
      if (record.score === null) {
        issue(record, index, 'derived_value', 'info', '得分缺失', '按作答状态推导得分')
      } else if (record.score < 0 || record.score > maxScore) {
        issue(record, index, 'invalid_value', 'error', '得分超出 0..满分范围', '保留原始行，不进入分析')
        return
      }
    }

    if (record.attemptedAt) {
      const timestamp = Date.parse(record.attemptedAt)
      if (Number.isNaN(timestamp)) {
        issue(record, index, 'invalid_timestamp', 'warning', '作答时间无法解析', '保留记录，不参与时间趋势')
      }
    }

    const score = scoreOf({ ...record, maxScore })
    validRecords.push({
      ...record,
      requirementId: effectiveRequirementId,
      materialId,
      score: record.status === 'missing' ? null : score.score,
      maxScore,
      question,
      material: materialIsQuestion
        ? question
        : getMaterial(dataset, materialId || question.materialId),
      quality: {
        derivedScore: record.score === null && record.status !== 'missing',
        invalidTimestamp:
          !!record.attemptedAt && Number.isNaN(Date.parse(record.attemptedAt)),
      },
    })
  })

  const counts = issues.reduce((acc, item) => {
    acc[item.code] = (acc[item.code] || 0) + 1
    return acc
  }, {})

  return {
    rawCount: dataset?.learningRecords?.length || 0,
    validCount: validRecords.length,
    rejectedCount: (dataset?.learningRecords?.length || 0) - validRecords.length,
    observedCount: validRecords.filter((item) => item.status !== 'missing').length,
    missingObservationCount: validRecords.filter((item) => item.status === 'missing').length,
    duplicateCount: counts.duplicate_record_id || 0,
    supersededRevisionCount: counts.superseded_revision || 0,
    pendingReviewCount: counts.pending_review || 0,
    anomalyCount:
      (counts.invalid_value || 0) +
      (counts.unknown_reference || 0) +
      (counts.invalid_timestamp || 0) +
      (counts.unknown_material_reference || 0),
    missingFieldCount: counts.missing_required_field || 0,
    derivedCount:
      (counts.derived_value || 0) + (counts.inconsistent_value || 0),
    counts,
    issues,
    validRecords,
    policy: [
      '原始记录永久保留在数据包中，质量问题单独输出。',
      '同一作答事件只采用最高修订版本，旧版本保留原文但不进入统计。',
      '记录编号完全重复时只采用第一条。',
      '待评分记录暂不进入分析，完成评分后重新计算。',
      '未知学生、题目或课程要求不进入统计。',
      '状态为 missing 的记录进入信息不足统计，不进入正确率分母。',
      '时间异常不阻断掌握度分析。',
    ],
  }
}

export { parseCsv }

function summarizeRecords(records) {
  const observed = records.filter((record) => record.status !== 'missing')
  const correct = observed.filter((record) => record.status === 'correct').length
  const partial = observed.filter((record) => record.status === 'partial').length
  const incorrect = observed.filter((record) => record.status === 'incorrect').length
  const missing = records.filter((record) => record.status === 'missing').length
  const totalScore = observed.reduce(
    (sum, record) => sum + (finiteNumber(record.score) || 0),
    0,
  )
  const totalMax = observed.reduce(
    (sum, record) => sum + (finiteNumber(record.maxScore) || 10),
    0,
  )
  return {
    recordCount: records.length,
    observedCount: observed.length,
    correct,
    partial,
    incorrect,
    missing,
    scoreRate: ratio(totalScore, totalMax),
    accuracy: ratio(correct, observed.length),
  }
}

function conceptEvidence(records) {
  const map = new Map()
  records
    .filter((record) => ['incorrect', 'partial'].includes(record.status))
    .forEach((record) => {
      const question = record.question
      ;(question?.concepts || ['未标注概念']).forEach((concept) => {
        if (!map.has(concept)) {
          map.set(concept, {
            concept,
            count: 0,
            weight: 0,
            evidenceRefs: [],
          })
        }
        const item = map.get(concept)
        item.count += 1
        item.weight += record.status === 'incorrect' ? 1 : 0.5
        if (item.evidenceRefs.length < 8) item.evidenceRefs.push(record.id)
      })
    })
  return [...map.values()].sort((a, b) => b.weight - a.weight || b.count - a.count)
}

function statForRequirement(dataset, records, requirementId) {
  const requirement = getRequirement(dataset, requirementId)
  const filtered = records.filter((record) => record.requirementId === requirementId)
  const summary = summarizeRecords(filtered)
  const topic = requirement ? getTopic(dataset, requirement.topicId) : null
  const concepts = conceptEvidence(filtered)
  let status = 'insufficient'
  if (summary.observedCount >= 3) {
    if (summary.scoreRate < 0.6) status = 'weak'
    else if (summary.scoreRate < 0.8) status = 'developing'
    else status = 'strong'
  } else if (summary.observedCount > 0) {
    status = 'low_confidence'
  }

  return {
    requirementId,
    requirementCode: requirement?.code || '',
    requirementTitle: requirement?.title || requirementId,
    topicId: requirement?.topicId || '',
    topicTitle: topic?.title || '',
    ...summary,
    scoreRatePct: pct(summary.scoreRate),
    status,
    concepts,
    evidenceRefs: filtered
      .filter((record) => ['incorrect', 'partial', 'missing'].includes(record.status))
      .slice(0, 16)
      .map((record) => record.id),
    limitations:
      summary.observedCount < 3
        ? ['有效作答不足 3 条，只能描述已有记录，不能判断掌握水平。']
        : [],
  }
}

function topicStats(dataset, records) {
  return (dataset?.topics || []).map((topic) => {
    const requirementStats = (topic.requirementIds || []).map((id) =>
      statForRequirement(dataset, records, id),
    )
    const filtered = records.filter((record) => {
      const question = record.question
      return question?.topicId === topic.id
    })
    const summary = summarizeRecords(filtered)
    return {
      topicId: topic.id,
      title: topic.title,
      summary: topic.summary,
      ...summary,
      scoreRatePct: pct(summary.scoreRate),
      requirementStats,
    }
  })
}

function attachQuestionAndMaterial(dataset, records) {
  return records.map((record) => {
    const question = getQuestion(dataset, record.questionId)
    return {
      ...record,
      question,
      material: getMaterial(dataset, record.materialId || question?.materialId),
    }
  })
}

export function analyzeLearner(dataset, quality, studentId) {
  const student = (dataset?.students || []).find((item) => item.id === studentId)
  if (!student) return null

  const records = quality.validRecords.filter((record) => record.studentId === studentId)
  const requirementStats = (dataset?.requirements || []).map((item) =>
    statForRequirement(dataset, records, item.id),
  )
  const observedRequirements = requirementStats.filter((item) => item.observedCount > 0)
  const overall = summarizeRecords(records)
  const weak = requirementStats
    .filter((item) => ['weak', 'low_confidence'].includes(item.status))
    .sort(
      (a, b) =>
        a.scoreRate - b.scoreRate ||
        b.incorrect + b.partial - (a.incorrect + a.partial),
    )
  const insufficient = requirementStats.filter(
    (item) => item.status === 'insufficient' || item.status === 'low_confidence',
  )
  const strengths = requirementStats
    .filter((item) => item.status === 'strong')
    .sort((a, b) => b.scoreRate - a.scoreRate)

  let status = 'ready'
  if (overall.observedCount < 3) status = 'insufficient'
  else if (observedRequirements.length / Math.max(1, requirementStats.length) < 0.34) {
    status = 'partial'
  }

  return {
    studentId,
    displayName: student.displayName,
    group: student.group,
    grade: student.grade,
    status,
    ...overall,
    scoreRatePct: pct(overall.scoreRate),
    coveragePct: pct(observedRequirements.length / Math.max(1, requirementStats.length)),
    requirementStats,
    topicStats: topicStats(dataset, records),
    weakRequirements: weak,
    insufficientRequirements: insufficient,
    strengths,
    concepts: conceptEvidence(records),
    evidenceRefs: records.slice(0, 40).map((record) => record.id),
    limitations:
      status === 'ready'
        ? []
        : [
            `当前只有 ${overall.observedCount} 条有效观察，覆盖 ${observedRequirements.length} 项课程要求。`,
            '信息不足项不判定为未掌握，优先补充观察。',
          ],
  }
}

function questionsForRequirement(dataset, requirementId, maxDifficulty = 3) {
  return (dataset?.questions || []).filter(
    (question) =>
      question.requirementId === requirementId &&
      Number(question.difficulty) <= maxDifficulty,
  )
}

function materialsForRequirement(dataset, requirementId) {
  return (dataset?.materials || []).filter((material) =>
    (material.requirementIds || []).includes(requirementId),
  )
}

function action({
  id,
  type,
  title,
  description,
  requirementId,
  materialIds = [],
  questionIds = [],
  reason,
  completionStandard,
  evidenceRefs,
  minutes,
}) {
  return {
    id,
    type,
    title,
    description,
    requirementId,
    materialIds,
    questionIds,
    reason,
    completionStandard,
    evidenceRefs,
    estimatedMinutes: minutes,
  }
}

export function buildRecommendation(dataset, learner, quality = null) {
  if (!learner) return null
  const actions = []
  if (learner.status === 'insufficient' || learner.status === 'partial') {
    const targetRequirements =
      learner.insufficientRequirements.length > 0
        ? learner.insufficientRequirements.slice(0, 3)
        : learner.requirementStats.slice(0, 3)
    const materials = targetRequirements.flatMap((item) =>
      materialsForRequirement(dataset, item.requirementId).map((material) => material.id),
    )
    const questions = targetRequirements.flatMap((item) =>
      questionsForRequirement(dataset, item.requirementId, 2)
        .slice(0, 2)
        .map((question) => question.id),
    )
    actions.push(
      action({
        id: `REC-${learner.studentId}-OBSERVE`,
        type: 'observation',
        title: '先补齐观察，不急着下结论',
        description: '完成一组覆盖不同主题的基础题，再重新生成学情结论。',
        requirementId: targetRequirements[0]?.requirementId || '',
        materialIds: Array.from(new Set(materials)).slice(0, 6),
        questionIds: Array.from(new Set(questions)).slice(0, 6),
        reason: `当前有效观察 ${learner.observedCount} 条，仅覆盖 ${learner.coveragePct}% 的课程要求。`,
        completionStandard: '至少新增 6 条有效作答，且覆盖 3 个学习主题。',
        evidenceRefs: learner.evidenceRefs.slice(0, 8),
        minutes: 20,
      }),
    )
  }

  const targets = learner.weakRequirements
    .filter((item) => item.status !== 'insufficient')
    .slice(0, 3)
  targets.forEach((stat, index) => {
    const requirement = getRequirement(dataset, stat.requirementId)
    if (!requirement) return
    const prerequisite = (requirement.prerequisiteIds || [])
      .map((id) =>
        statForRequirement(
          dataset,
          learnerRecords(dataset, learner.studentId, quality),
          id,
        ),
      )
      .find((item) => item && ['weak', 'low_confidence'].includes(item.status))
    const materials = materialsForRequirement(dataset, requirement.id)
    const explainer =
      materials.find((material) => material.type === 'explainer') || materials[0]
    const worked =
      materials.find((material) => material.type === 'worked_example') || materials[1]
    const baseQuestions = questionsForRequirement(dataset, requirement.id, 2)
    const transferQuestions = questionsForRequirement(dataset, requirement.id, 3)
      .filter((question) => !baseQuestions.slice(0, 4).some((item) => item.id === question.id))
      .slice(0, 3)
    const conceptText = stat.concepts
      .slice(0, 2)
      .map((item) => item.concept)
      .join('、')

    if (prerequisite) {
      const prerequisiteMaterials = materialsForRequirement(dataset, prerequisite.requirementId)
      actions.push(
        action({
          id: `REC-${learner.studentId}-PRE-${index + 1}`,
          type: 'prerequisite',
          title: `先补前置：${prerequisite.requirementTitle}`,
          description: `先恢复前置要求的判断依据，再学习「${requirement.title}」。`,
          requirementId: prerequisite.requirementId,
          materialIds: prerequisiteMaterials.map((material) => material.id),
          questionIds: questionsForRequirement(dataset, prerequisite.requirementId, 1)
            .slice(0, 2)
            .map((question) => question.id),
          reason: `前置要求得分率 ${prerequisite.scoreRatePct}%，会直接影响当前要求的理解。`,
          completionStandard: '前置练习至少达到 2/3 正确，并能说明关键规则。',
          evidenceRefs: prerequisite.evidenceRefs.slice(0, 5),
          minutes: 10,
        }),
      )
    }

    actions.push(
      action({
        id: `REC-${learner.studentId}-RELEARN-${index + 1}`,
        type: 'relearn',
        title: `重讲：${requirement.title}`,
        description: conceptText
          ? `重点澄清「${conceptText}」，用材料中的例题走一遍判断步骤。`
          : '回到课程要求与示例，重建概念边界。',
        requirementId: requirement.id,
        materialIds: [explainer, worked].filter(Boolean).map((material) => material.id),
        questionIds: baseQuestions.slice(0, 2).map((item) => item.id),
        reason: `该要求得分率 ${stat.scoreRatePct}%，出现 ${stat.incorrect} 次错误和 ${stat.partial} 次部分正确。`,
        completionStandard: '能不看材料解释核心规则，并独立完成 1 道示例题。',
        evidenceRefs: stat.evidenceRefs.slice(0, 6),
        minutes: 12,
      }),
    )
    actions.push(
      action({
        id: `REC-${learner.studentId}-RETRIEVE-${index + 1}`,
        type: 'retrieval',
        title: `检索练习：${requirement.code}`,
        description: '先回忆规则再作答，错题必须写明错在概念、符号还是步骤。',
        requirementId: requirement.id,
        materialIds: baseQuestions[0]?.materialId ? [baseQuestions[0].materialId] : [],
        questionIds: baseQuestions.slice(0, 4).map((item) => item.id),
        reason: '用短间隔检索替代重复阅读，验证刚才的理解是否真正可用。',
        completionStandard: '4 题至少正确 3 题；错误题完成一次订正。',
        evidenceRefs: stat.evidenceRefs.slice(0, 8),
        minutes: 15,
      }),
    )
    if (transferQuestions.length) {
      actions.push(
        action({
          id: `REC-${learner.studentId}-TRANSFER-${index + 1}`,
          type: 'transfer',
          title: `变式迁移：${requirement.title}`,
          description: '换情境、换问法完成变式题，解释为什么仍使用同一等量关系或运算规则。',
          requirementId: requirement.id,
          materialIds: transferQuestions[0]?.materialId
            ? [transferQuestions[0].materialId]
            : [],
          questionIds: transferQuestions.map((item) => item.id),
          reason: '基础检索通过后，需要验证能否迁移到新情境。',
          completionStandard: '能写出求解过程，并用一句话说明适用范围。',
          evidenceRefs: stat.evidenceRefs.slice(-5),
          minutes: 15,
        }),
      )
    }
  })

  if (!actions.length) {
    const strong = learner.strengths[0]
    actions.push(
      action({
        id: `REC-${learner.studentId}-MAINTAIN`,
        type: 'maintain',
        title: strong ? `保持并迁移：${strong.requirementTitle}` : '保持间隔复习',
        description: '选择跨主题变式题，保持检索练习并记录新的易错点。',
        requirementId: strong?.requirementId || '',
        materialIds: strong
          ? materialsForRequirement(dataset, strong.requirementId).map((item) => item.id)
          : [],
        questionIds: learner.topicStats
          .flatMap((topic) => {
            const target = (dataset.questions || []).find(
              (question) =>
                question.topicId === topic.topicId && Number(question.difficulty) >= 2,
            )
            return target ? [target.id] : []
          })
          .slice(0, 3),
        reason: '当前没有确认的薄弱要求，继续用跨主题检索维持掌握。',
        completionStandard: '完成 3 道跨主题题，并记录新的错误模式。',
        evidenceRefs: learner.evidenceRefs.slice(0, 6),
        minutes: 15,
      }),
    )
  }

  return {
    id: `REC-${learner.studentId}-${ANALYSIS_VERSION}`,
    studentId: learner.studentId,
    studentName: learner.displayName,
    status: learner.status,
    summary:
      learner.status === 'ready'
        ? `优先处理 ${targets.length} 个已确认薄弱要求，按前置、重讲、检索、迁移顺序推进。`
        : '有效观察不足，先补充数据；已有记录只用于描述表现，不判定未掌握。',
    scope: '本建议只适用于当前数据集、当前课程标准范围与当前记录时间窗口。',
    uncertainty:
      learner.status === 'ready'
        ? `有效观察 ${learner.observedCount} 条，要求覆盖率 ${learner.coveragePct}%。`
        : `有效观察不足，缺失记录不进入正确率分母。`,
    actions: actions.map((item, index) => ({ ...item, order: index + 1 })),
    evidenceRefs: learner.evidenceRefs.slice(0, 20),
    version: ANALYSIS_VERSION,
  }
}

function learnerRecords(dataset, studentId, quality = null) {
  const resolved = quality || analyzeDataQuality(dataset)
  return resolved.validRecords.filter((record) => record.studentId === studentId)
}

export function analyzeGroup(dataset, quality) {
  const records = quality.validRecords
  const requirementStats = (dataset?.requirements || []).map((item) =>
    statForRequirement(dataset, records, item.id),
  )
  const learners = (dataset?.students || [])
    .map((student) => analyzeLearner(dataset, quality, student.id))
    .filter(Boolean)
  const groups = [...new Set(learners.map((item) => item.group))]
  const distribution = groups.map((name) => {
    const members = learners.filter((item) => item.group === name)
    const groupRecords = records.filter((record) =>
      members.some((member) => member.studentId === record.studentId),
    )
    const summary = summarizeRecords(groupRecords)
    const covered = new Set(groupRecords.map((record) => record.requirementId)).size
    return {
      group: name,
      studentCount: members.length,
      observedCount: summary.observedCount,
      scoreRatePct: pct(summary.scoreRate),
      coveragePct: pct(covered / Math.max(1, requirementStats.length)),
      weakStudentCount: members.filter((item) =>
        item.weakRequirements.some((stat) => stat.status === 'weak'),
      ).length,
    }
  })

  const commonGaps = requirementStats
    .filter(
      (stat) =>
        stat.observedCount >= 10 &&
        stat.scoreRate < 0.68 &&
        learners.filter(
          (learner) =>
            learner.weakRequirements.find(
              (item) => item.requirementId === stat.requirementId && item.status === 'weak',
            ),
        ).length >=
          Math.max(3, Math.ceil(learners.length * 0.2)),
    )
    .sort((a, b) => a.scoreRate - b.scoreRate)

  const insufficient = requirementStats.filter(
    (stat) =>
      stat.observedCount < 3 ||
      learners.filter(
        (learner) =>
          learner.requirementStats.find(
            (item) => item.requirementId === stat.requirementId,
          )?.observedCount > 0,
      ).length <
        learners.length * 0.5,
  )

  const overall = summarizeRecords(records)
  return {
    studentCount: learners.length,
    activeStudentCount: learners.filter((item) => item.observedCount > 0).length,
    ...overall,
    scoreRatePct: pct(overall.scoreRate),
    requirementStats,
    groups: distribution,
    commonGaps,
    insufficientRequirements: insufficient,
    differences: distribution
      .map((group) => ({
        group: group.group,
        scoreRatePct: group.scoreRatePct,
        weakStudentCount: group.weakStudentCount,
      }))
      .sort((a, b) => b.scoreRatePct - a.scoreRatePct),
    learners: learners.map((item) => ({
      studentId: item.studentId,
      displayName: item.displayName,
      group: item.group,
      status: item.status,
      observedCount: item.observedCount,
      scoreRatePct: item.scoreRatePct,
      coveragePct: item.coveragePct,
      weakCount: item.weakRequirements.length,
    })),
  }
}

export function buildCaseVerification(dataset, quality, learners) {
  const candidates = [...learners].sort((a, b) => {
    if (a.status !== b.status) {
      const order = { ready: 0, partial: 1, insufficient: 2 }
      return (order[a.status] ?? 9) - (order[b.status] ?? 9)
    }
    return a.scoreRatePct - b.scoreRatePct
  })
  const picks = [
    candidates.find((item) => item.status === 'ready' && item.scoreRatePct < 65),
    candidates.find((item) => item.status === 'ready' && item.scoreRatePct >= 65),
    candidates.find((item) => item.status !== 'ready'),
  ].filter(Boolean)

  return picks.map((learner) => {
    const target = learner.weakRequirements[0] || learner.insufficientRequirements[0]
    const recommendation = buildRecommendation(dataset, learner, quality)
    const related = quality.validRecords
      .filter(
        (record) =>
          record.studentId === learner.studentId &&
          (!target || record.requirementId === target.requirementId),
      )
      .slice(0, 8)
    return {
      caseId: `CASE-${learner.studentId}`,
      studentId: learner.studentId,
      studentName: learner.displayName,
      group: learner.group,
      scope: dataset.meta?.official
        ? '赛方公开模拟学情数据；仅限本次比赛分析、展示与核验使用。'
        : '七年级数学开发样例；仅用于核对分析链路，不代表真实学习效果。',
      requirement: target
        ? {
            id: target.requirementId,
            title: target.requirementTitle,
            code: target.requirementCode,
            source: getRequirement(dataset, target.requirementId)?.sourceRef || '',
          }
        : null,
      performance: target
        ? {
            scoreRatePct: target.scoreRatePct,
            observedCount: target.observedCount,
            correct: target.correct,
            partial: target.partial,
            incorrect: target.incorrect,
            missing: target.missing,
            status: target.status,
            evidence: related.map((record) => ({
              recordId: record.id,
              questionId: record.questionId,
              status: record.status,
              score: record.score,
              maxScore: record.maxScore,
            })),
          }
        : null,
      recommendation: target
        ? {
            recommendationId: recommendation.id,
            actions: recommendation.actions
              .filter((item) => item.requirementId === target.requirementId)
              .slice(0, 3),
          }
        : { recommendationId: recommendation.id, actions: recommendation.actions.slice(0, 1) },
      limitations: learner.limitations,
    }
  })
}

export function analyzeCompetitionDataset(dataset) {
  const quality = analyzeDataQuality(dataset)
  const enrichedDataset = clone(dataset)
  enrichedDataset.learningRecords = attachQuestionAndMaterial(dataset, quality.validRecords)
  const learners = (dataset?.students || [])
    .map((student) => analyzeLearner(dataset, quality, student.id))
    .filter(Boolean)
  const group = analyzeGroup(dataset, quality)
  const recommendations = learners
    .map((learner) => buildRecommendation(dataset, learner, quality))
    .filter(Boolean)
  const cases = buildCaseVerification(dataset, quality, learners)

  return {
    meta: {
      analysisVersion: ANALYSIS_VERSION,
      datasetVersion: dataset?.meta?.version || COMPETITION_DATASET_VERSION,
      generatedAt: new Date().toISOString(),
      officialData: !!dataset?.meta?.official,
      disclaimer: dataset?.meta?.disclaimer || '',
    },
    quality,
    learners,
    group,
    recommendations,
    cases,
  }
}

export function recommendationFor(analysis, studentId) {
  return (
    analysis?.recommendations?.find((item) => item.studentId === studentId) || null
  )
}

export function learnerFor(analysis, studentId) {
  return analysis?.learners?.find((item) => item.studentId === studentId) || null
}

export function buildTaskPackage(dataset, analysis) {
  const materialById = new Map((dataset.materials || []).map((item) => [item.id, item]))
  const questionById = new Map((dataset.questions || []).map((item) => [item.id, item]))
  const curriculum = {
    meta: dataset.meta,
    topics: dataset.topics,
    requirements: dataset.requirements.map((requirement) => ({
      ...requirement,
      materials: (requirement.materialIds || [])
        .map((id) => materialById.get(id))
        .filter(Boolean),
      questions: (requirement.questionIds || [])
        .map((id) => questionById.get(id))
        .filter(Boolean),
    })),
    materials: dataset.materials,
    questions: dataset.questions,
  }
  return {
    manifest: {
      name: '智慧学伴任务成果包',
      version: COMPETITION_DATASET_VERSION,
      analysisVersion: ANALYSIS_VERSION,
      generatedAt: new Date().toISOString(),
      sourceType: dataset.meta.sourceType,
      officialData: dataset.meta.official,
      disclaimer: dataset.meta.disclaimer,
      files: [
        'curriculum.json',
        'data-quality.json',
        'student-analysis.json',
        'group-analysis.json',
        'recommendations.json',
        'recommendations-flat.csv',
        'case-verification.json',
        'records-valid.csv',
        'records-quality-issues.csv',
        'schema.json',
        'input-sample.json',
        'competition-dataset.json',
        'teacher-adjustments.json',
        'verification-report.json',
      ],
    },
    curriculum,
    dataQuality: analysis.quality,
    studentAnalysis: analysis.learners,
    groupAnalysis: analysis.group,
    recommendations: analysis.recommendations,
    caseVerification: analysis.cases,
    schema: {
      dictionary: DATA_DICTIONARY,
      statuses: [...VALID_STATUSES],
    },
  }
}

function csvCell(value) {
  const stringValue = Array.isArray(value)
    ? value.join('|')
    : value && typeof value === 'object'
      ? JSON.stringify(value)
      : String(value ?? '')
  return `"${stringValue.replace(/"/g, '""')}"`
}

export function toCsv(rows, columns) {
  const headers = columns || Object.keys(rows?.[0] || {})
  return [
    headers.map(csvCell).join(','),
    ...(rows || []).map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\r\n')
}

export function buildValidRecordsCsv(analysis) {
  return toCsv(analysis.quality.validRecords, [
    'id',
    'studentId',
    'questionId',
    'materialId',
    'requirementId',
    'attemptEventId',
    'revision',
    'gradingStatus',
    'status',
    'score',
    'maxScore',
    'attemptedAt',
    'source',
  ])
}

export function buildQualityIssuesCsv(analysis) {
  return toCsv(analysis.quality.issues, [
    'recordId',
    'rawIndex',
    'code',
    'severity',
    'message',
    'action',
  ])
}

export function buildFlattenedRecommendations(analysis) {
  return analysis.recommendations.flatMap((recommendation) =>
    recommendation.actions.map((item) => ({
      recommendationId: recommendation.id,
      studentId: recommendation.studentId,
      studentName: recommendation.studentName,
      order: item.order,
      actionType: item.type,
      title: item.title,
      requirementId: item.requirementId,
      materialIds: item.materialIds,
      questionIds: item.questionIds,
      reason: item.reason,
      completionStandard: item.completionStandard,
      estimatedMinutes: item.estimatedMinutes,
      uncertainty: recommendation.uncertainty,
      scope: recommendation.scope,
    })),
  )
}

export function buildCompetitionBlueprint(dataset, learner, recommendation, mode = 'course') {
  const target =
    learner.weakRequirements.find((item) => item.status === 'weak') ||
    learner.insufficientRequirements[0] ||
    learner.requirementStats[0]
  const requirement = getRequirement(dataset, target?.requirementId)
  const topic = requirement ? getTopic(dataset, requirement.topicId) : dataset.topics[0]
  const materialIds = Array.from(
    new Set(recommendation?.actions?.flatMap((item) => item.materialIds || []) || []),
  )
  const requirementIds =
    mode === 'sprint'
      ? [target?.requirementId].filter(Boolean)
      : [
          target?.requirementId,
          ...(requirement?.prerequisiteIds || []),
        ].filter(Boolean)
  const baseTitle = target?.requirementTitle || topic?.title || '个性化学习'
  const counts = mode === 'sprint' ? 4 : 6
  const durations = mode === 'sprint' ? [6, 8, 10, 6] : [6, 9, 8, 12, 9, 6]
  const scenes = [
    {
      type: 'lecture',
      title: mode === 'sprint' ? `先定位：${baseTitle}` : `从学情证据出发：${baseTitle}`,
      description:
        learner.status === 'ready'
          ? `依据 ${target?.scoreRatePct || 0}% 的得分率与错误记录，建立本节问题。`
          : '当前数据不足，先建立观察框架，不把缺失记录当作未掌握。',
      teachingObjective: '能说出本节要解决的具体问题和判断依据。',
      keyPoints: [
        target?.requirementTitle || '学习目标',
        target?.concepts?.[0]?.concept || '核心概念',
        '适用条件与检查方法',
      ],
    },
    {
      type: 'lecture',
      title: `核心规则：${target?.requirementTitle || topic?.title}`,
      description: '结合材料重讲概念、规则和常见错误。',
      teachingObjective: '能用自己的话解释规则，并指出至少一个易错点。',
      keyPoints: [
        requirement?.content || topic?.summary || '',
        requirement?.expectation || '',
        target?.concepts?.[1]?.concept || '常见错误',
      ],
    },
    {
      type: 'practice',
      title: '用一道变式题走完判断链',
      description: '从读题、找关系、选择规则到检查结果，完整示范。',
      teachingObjective: '能按步骤完成一道同类型题并说明每一步依据。',
      keyPoints: ['识别已知与未知', '选择规则', '执行与检查'],
    },
    {
      type: 'quiz',
      title: '检索练习：不看材料先作答',
      description: '用短题检查规则记忆与概念边界。',
      teachingObjective: '能独立完成基础检索题，并根据反馈订正。',
      keyPoints: ['概念辨认', '符号与步骤', '结果检查'],
    },
    {
      type: 'practice',
      title: mode === 'sprint' ? '冲刺变式：最容易丢分的问法' : '迁移应用：换一个情境',
      description: '将当前规则迁移到新情境或新问法。',
      teachingObjective: '能解释为什么新问题仍使用同一规则。',
      keyPoints: ['情境变化', '等量关系或运算关系', '答案解释'],
    },
    {
      type: 'review',
      title: '收束：下次先检查什么',
      description: '用一页卡片收束错误模式、规则与下一步。',
      teachingObjective: '能说出下次遇到同类题的第一步和检查点。',
      keyPoints: ['错误模式', '核心规则', '下一步任务'],
    },
  ].slice(0, counts)

  return {
    courseTitle: `${topic?.title || '数学'} · ${baseTitle}${mode === 'sprint' ? '冲刺课' : '个性化课'}`,
    courseSummary:
      learner.status === 'ready'
        ? `围绕得分率 ${target?.scoreRatePct || 0}% 的课程要求组织学习，先补依据，再做检索与迁移。`
        : '当前信息不足，本节先补充观察，再根据新记录调整路径。',
    languageDirective: '使用七年级数学课堂语言；符号、步骤和等量关系必须解释清楚。',
    outlines: scenes.map((scene, index) => ({
      id: `math7-scene-${index + 1}`,
      ...scene,
      keyPoints: scene.keyPoints.filter(Boolean),
      estimatedMinutes: durations[index] || 8,
      sourceChunkIds: materialIds.slice(0, 4),
      requirementIds,
      order: index + 1,
    })),
  }
}

export function buildCompetitionSceneContent(dataset, outline, mode = 'course') {
  const requirement = getRequirement(dataset, outline.requirementIds?.[0])
  const topic = requirement ? getTopic(dataset, requirement.topicId) : null
  const materials = (outline.sourceChunkIds || [])
    .map((id) => getMaterial(dataset, id))
    .filter(Boolean)
  const questions = (dataset.questions || [])
    .filter((question) => (outline.requirementIds || []).includes(question.requirementId))
    .slice(0, 4)

  if (outline.type === 'quiz') {
    return {
      kind: 'quiz',
      questions: questions.map((question, index) => ({
        id: question.id,
        stem: question.stem,
        options: [
          question.answer,
          index % 2 ? '只写结论，不说明依据' : '跳过检查直接作答',
          '把未知量当作已知量',
          '以上都不对',
        ],
        answerIndex: 0,
        explanation: `依据「${requirement?.title || topic?.title}」的规则完成判断。`,
        concept: question.concepts?.[0] || requirement?.title || '',
      })),
      sourceChunkIds: materials.map((material) => material.id),
    }
  }

  if (outline.type === 'practice') {
    const sample = questions[0]
    return {
      kind: 'practice',
      prompt: sample?.stem || `请用「${requirement?.title || topic?.title}」解决一个变式问题。`,
      referencePoints: [
        `能识别并说明「${requirement?.title || topic?.title}」使用的条件。`,
        '关键步骤完整，符号和单位正确。',
        '完成后能用一句话检查结果是否合理。',
      ],
      rubric: [
        { criterion: '概念判断', weight: 35 },
        { criterion: '过程与符号', weight: 40 },
        { criterion: '检查与解释', weight: 25 },
      ],
      followUp: '如果把题中的一个条件改掉，原来的判断还成立吗？',
      sourceChunkIds: materials.map((material) => material.id),
    }
  }

  const explanation = materials.find((material) => material.type !== 'exercise_set') || materials[0]
  // 先过白名单归一化，再接可视化兜底：七年级数学的不等式/方程场景
  // 若预判推荐交互（如数轴、一次函数），自动补一个受控 simulation 块
  const lesson = normalizeBoardLesson(
    {
      title: outline.title,
      subtitle: outline.description,
      blocks: [
        {
          type: 'outline',
          title: mode === 'sprint' ? '冲刺路线' : '本节路线',
          items: outline.keyPoints,
        },
        {
          type: 'definition',
          title: '课程要求',
          term: requirement?.title || topic?.title || '学习目标',
          definition: requirement?.content || topic?.summary || '',
          concreteAnchor:
            requirement?.expectation ||
            '先看一道能上手的例题，再回到这条要求本身。',
          analogy: requirement?.expectation || '先明确要求，再看表现和下一步。',
        },
        {
          type: 'callout',
          title: '材料出处',
          tone: 'note',
          text: explanation
            ? `${explanation.title} · ${explanation.locator} · ${explanation.sourceRef}`
            : '当前仅为开发样例，正式材料接入后替换。',
        },
        {
          type: 'diagram',
          title: '判断链',
          nodes: [
            { label: '读要求', note: requirement?.code || '' },
            { label: '找关系', note: '已知与未知' },
            { label: '用规则', note: requirement?.title || '' },
            { label: '做检查', note: '符号、单位、结果' },
          ],
          caption: '每一步都要能回指课程要求和证据。',
        },
        {
          type: 'question',
          title: '停下来想一想',
          prompt: questions[0]?.stem || '这道题最关键的一步是什么？',
          options: ['先找等量关系', '先看答案选项'],
        },
      ],
    },
    requirement?.title || topic?.title || '',
  )
  const withSimulation = ensureSimulationBlock(lesson, {
    subject: '数学',
    stage: 'junior',
    keyPoints: outline.keyPoints,
    // 竞赛Workbench 内容恒为数学（math7）：交互模型按数理域过滤
    pedagogyDomain: 'math-science',
  })
  return {
    kind: 'board',
    lesson: withSimulation,
    sourceChunkIds: materials.map((material) => material.id),
  }
}

export function defaultCompetitionDataset() {
  return buildCompetitionDataset()
}

export { ANALYSIS_VERSION }
