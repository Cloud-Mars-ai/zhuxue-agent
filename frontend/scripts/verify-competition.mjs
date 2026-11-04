import assert from 'node:assert/strict'
import { buildCompetitionDataset } from '../src/competition/dataset.js'
import {
  analyzeCompetitionDataset,
  buildRecommendation,
  parseCsv,
} from '../src/competition/analysis.js'

const first = buildCompetitionDataset()
const second = buildCompetitionDataset()
assert.deepEqual(first, second, '固定种子数据必须可复现')
assert.ok(first.topics.length >= 2 && first.topics.length <= 3)
assert.ok(first.students.length >= 20 && first.students.length <= 50)
assert.ok(first.learningRecords.length >= 300 && first.learningRecords.length <= 1000)
assert.equal(first.questions.length, 60)

const analysis = analyzeCompetitionDataset(first)
assert.equal(analysis.learners.length, first.students.length)
assert.ok(analysis.quality.duplicateCount > 0)
assert.ok(analysis.quality.anomalyCount > 0)
assert.ok(analysis.quality.missingObservationCount > 0)
assert.ok(analysis.cases.length >= 3)

const readyLearner = analysis.learners.find((item) => item.status === 'ready')
assert.ok(readyLearner)
const recommendation = buildRecommendation(first, readyLearner)
assert.ok(recommendation.actions.length > 0)
assert.ok(
  recommendation.actions.every(
    (action) =>
      action.reason &&
      action.completionStandard &&
      Array.isArray(action.materialIds) &&
      Array.isArray(action.questionIds),
  ),
)

const csvRows = parseCsv(
  'record_id,student_id,question_id,status,score,max_score\nR-NEW,S001,Q-NUM-01,correct,10,10',
)
assert.equal(csvRows.length, 1)
assert.equal(csvRows[0].record_id, 'R-NEW')

console.log(
  JSON.stringify(
    {
      passed: true,
      topics: first.topics.length,
      questions: first.questions.length,
      students: first.students.length,
      rawRecords: first.learningRecords.length,
      validRecords: analysis.quality.validCount,
      qualityIssues: analysis.quality.issues.length,
      cases: analysis.cases.length,
    },
    null,
    2,
  ),
)
