import assert from 'node:assert/strict'
import { buildCompetitionDataset } from '../src/competition/dataset.js'
import {
  analyzeCompetitionDataset,
  buildRecommendation,
  parseCsv,
} from '../src/competition/analysis.js'

const first = buildCompetitionDataset()
const second = buildCompetitionDataset()
assert.deepEqual(first, second, '官方数据规范化结果必须可复现')
assert.equal(first.meta.official, true)
assert.equal(first.topics.length, 3)
assert.equal(first.requirements.length, 9)
assert.equal(first.materials.length, 11)
assert.equal(first.questions.length, 54)
assert.equal(first.students.length, 40)
assert.equal(first.assessmentNodes.length, 2)
assert.equal(first.learningRecords.length, 806)

const analysis = analyzeCompetitionDataset(first)
assert.equal(analysis.learners.length, first.students.length)
assert.equal(analysis.quality.rawCount, 806)
assert.equal(analysis.quality.validCount, 793)
assert.equal(analysis.quality.supersededRevisionCount, 7)
assert.equal(analysis.quality.pendingReviewCount, 4)
assert.equal(analysis.quality.duplicateCount, 0)
assert.equal(analysis.quality.anomalyCount, 2)
assert.ok(analysis.quality.anomalyCount > 0)
assert.equal(analysis.quality.missingObservationCount, 5)
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
  '记录编号,学生编号,材料编号,评分状态,得分,满分,作答事件编号,修订版本\nDR-NEW,D01,Q001,已评分,1,1,D01-N01-Q001,1',
)
assert.equal(csvRows.length, 1)
assert.equal(csvRows[0].记录编号, 'DR-NEW')

console.log(
  JSON.stringify(
    {
      passed: true,
      topics: first.topics.length,
      requirements: first.requirements.length,
      materials: first.materials.length,
      questions: first.questions.length,
      students: first.students.length,
      rawRecords: first.learningRecords.length,
      validRecords: analysis.quality.validCount,
      supersededRevisions: analysis.quality.supersededRevisionCount,
      pendingReview: analysis.quality.pendingReviewCount,
      qualityIssues: analysis.quality.issues.length,
      cases: analysis.cases.length,
    },
    null,
    2,
  ),
)
