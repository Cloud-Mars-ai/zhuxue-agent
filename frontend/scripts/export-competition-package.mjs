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
await write('development-sample-dataset.json', json(dataset))
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
    passed: dataset.topics.length >= 2 && dataset.topics.length <= 3,
    value: dataset.topics.length,
    expectation: '2-3 个学习主题',
  },
  {
    id: 'students',
    passed: dataset.students.length >= 20 && dataset.students.length <= 50,
    value: dataset.students.length,
    expectation: '公开样例参考规模 20-50 名学生',
  },
  {
    id: 'records',
    passed:
      dataset.learningRecords.length >= 300 &&
      dataset.learningRecords.length <= 1000,
    value: dataset.learningRecords.length,
    expectation: '公开样例参考规模 300-1000 条记录',
  },
  {
    id: 'quality_issues',
    passed:
      analysis.quality.duplicateCount > 0 &&
      analysis.quality.anomalyCount > 0 &&
      analysis.quality.missingObservationCount > 0,
    value: {
      duplicate: analysis.quality.duplicateCount,
      anomaly: analysis.quality.anomalyCount,
      missingObservation: analysis.quality.missingObservationCount,
    },
    expectation: '样例覆盖重复、异常和缺失观察',
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
  developmentSample: !dataset.meta.official,
  checks,
  passed: checks.every((item) => item.passed),
}
await write('verification-report.json', json(verification))

console.log(
  JSON.stringify(
    {
      outputDir,
      files: 14,
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
