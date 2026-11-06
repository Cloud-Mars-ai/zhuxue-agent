import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCompetitionDataset } from '../src/competition/dataset.js'
import {
  analyzeCompetitionDataset,
  buildFlattenedRecommendations,
  buildQualityIssuesCsv,
  buildTaskPackage,
  buildValidRecordsCsv,
  toCsv,
} from '../src/competition/analysis.js'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const outputDir = resolve(
  process.argv[2] || resolve(scriptDir, '../../docs/competition/task-package'),
)

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

async function write(name, content) {
  await writeFile(resolve(outputDir, name), content, 'utf8')
}

const dataset = buildCompetitionDataset()
const analysis = analyzeCompetitionDataset(dataset)
const taskPackage = buildTaskPackage(dataset, analysis)
const inputSample = {
  meta: dataset.meta,
  students: dataset.students.slice(0, 5),
  questions: dataset.questions.slice(0, 6),
  learningRecords: dataset.learningRecords.slice(0, 24),
}

await mkdir(outputDir, { recursive: true })
await write('manifest.json', json(taskPackage.manifest))
await write('curriculum.json', json(taskPackage.curriculum))
await write('data-quality.json', json(taskPackage.dataQuality))
await write('student-analysis.json', json(taskPackage.studentAnalysis))
await write('group-analysis.json', json(taskPackage.groupAnalysis))
await write('recommendations.json', json(taskPackage.recommendations))
await write('case-verification.json', json(taskPackage.caseVerification))
await write('schema.json', json(taskPackage.schema))
await write('input-sample.json', json(inputSample))
await write('competition-dataset.json', json(dataset))
await write('teacher-adjustments.json', json({}))
await write(
  'recommendations-flat.csv',
  `\uFEFF${toCsv(buildFlattenedRecommendations(analysis), [
    'recommendationId',
    'studentId',
    'studentName',
    'order',
    'actionType',
    'title',
    'requirementId',
    'materialIds',
    'questionIds',
    'reason',
    'completionStandard',
    'estimatedMinutes',
    'uncertainty',
    'scope',
  ])}`,
)
await write('records-valid.csv', `\uFEFF${buildValidRecordsCsv(analysis)}`)
await write(
  'records-quality-issues.csv',
  `\uFEFF${buildQualityIssuesCsv(analysis)}`,
)

const checks = [
  {
    id: 'topics',
    passed: dataset.topics.length === 3,
    value: dataset.topics.length,
    expectation: '3 个学习主题',
  },
  {
    id: 'requirements',
    passed: dataset.requirements.length === 9,
    value: dataset.requirements.length,
    expectation: '9 个官方观察指标',
  },
  {
    id: 'materials_questions',
    passed: dataset.materials.length === 11 && dataset.questions.length === 54,
    value: {
      materials: dataset.materials.length,
      questions: dataset.questions.length,
    },
    expectation: '11 份学习材料、54 道题',
  },
  {
    id: 'students',
    passed: dataset.students.length === 40,
    value: dataset.students.length,
    expectation: '40 名模拟学生',
  },
  {
    id: 'records',
    passed: dataset.learningRecords.length === 806,
    value: dataset.learningRecords.length,
    expectation: '806 条原始作答记录',
  },
  {
    id: 'quality_issues',
    passed:
      analysis.quality.supersededRevisionCount === 7 &&
      analysis.quality.pendingReviewCount === 4 &&
      analysis.quality.anomalyCount > 0 &&
      analysis.quality.missingObservationCount > 0,
    value: {
      supersededRevision: analysis.quality.supersededRevisionCount,
      pendingReview: analysis.quality.pendingReviewCount,
      duplicate: analysis.quality.duplicateCount,
      anomaly: analysis.quality.anomalyCount,
      missingObservation: analysis.quality.missingObservationCount,
    },
    expectation: '正确区分旧修订、待评分、异常和缺失观察',
  },
  {
    id: 'individual_cases',
    passed: analysis.learners.length === dataset.students.length,
    value: analysis.learners.length,
    expectation: '每名模拟学生均有个体摘要',
  },
  {
    id: 'recommendation_traceability',
    passed: analysis.recommendations.every((item) =>
      item.actions.every(
        (action) =>
          action.reason &&
          action.completionStandard &&
          Array.isArray(action.evidenceRefs),
      ),
    ),
    value: analysis.recommendations.length,
    expectation: '每条建议包含理由、完成标准和证据',
  },
]

const verification = {
  generatedAt: new Date().toISOString(),
  datasetVersion: dataset.meta.version,
  analysisVersion: analysis.meta.analysisVersion,
  officialData: !!dataset.meta.official,
  checks,
  passed: checks.every((item) => item.passed),
}
await write('verification-report.json', json(verification))

console.log(
  JSON.stringify(
    {
      outputDir,
      files: 15,
      validationPassed: verification.passed,
      rawRecords: analysis.quality.rawCount,
      validRecords: analysis.quality.validCount,
      issues: analysis.quality.issues.length,
      learners: analysis.learners.length,
      recommendations: analysis.recommendations.length,
    },
    null,
    2,
  ),
)
