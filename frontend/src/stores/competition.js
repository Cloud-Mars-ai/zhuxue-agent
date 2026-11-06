import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { idbGet, idbSet } from '@/repositories/db'
import { useUserStore } from '@/stores/user'
import { buildCompetitionDataset } from '@/competition/dataset'
import {
  analyzeCompetitionDataset,
  buildRecommendation,
  buildTaskPackage,
  mergeImportedRecords,
  parseCsv,
  recommendationFor,
  learnerFor,
} from '@/competition/analysis'

const DATASET_KEY = 'competition-dataset-v2'
const ADJUSTMENTS_KEY = 'competition-teacher-adjustments-v1'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function validDataset(value) {
  return (
    value &&
    typeof value === 'object' &&
    Array.isArray(value.topics) &&
    Array.isArray(value.requirements) &&
    Array.isArray(value.materials) &&
    Array.isArray(value.questions) &&
    Array.isArray(value.students) &&
    Array.isArray(value.learningRecords)
  )
}

function normalizeDataset(raw, base) {
  if (!raw || typeof raw !== 'object') throw new Error('JSON 数据格式无效')
  const source = raw.data && typeof raw.data === 'object' ? raw.data : raw
  const records =
    source.learningRecords ||
    source.records ||
    source.learning_records ||
    source.learningData
  if (!Array.isArray(records)) {
    throw new Error('JSON 中没有找到 learningRecords 记录数组')
  }

  const next = validDataset(source) ? clone(source) : clone(base)
  next.topics = Array.isArray(source.topics) ? clone(source.topics) : next.topics
  next.requirements = Array.isArray(source.requirements)
    ? clone(source.requirements)
    : next.requirements
  next.materials = Array.isArray(source.materials)
    ? clone(source.materials)
    : next.materials
  next.questions = Array.isArray(source.questions)
    ? clone(source.questions)
    : next.questions
  next.students = Array.isArray(source.students) ? clone(source.students) : next.students
  next.taskConditions = Array.isArray(source.taskConditions)
    ? clone(source.taskConditions)
    : next.taskConditions
  next.learningRecords = clone(records)
  next.meta = {
    ...next.meta,
    ...(source.meta || {}),
    official: source.meta?.official ?? source.official ?? false,
    sourceType: source.meta?.sourceType || 'imported-json',
    lastImportAt: new Date().toISOString(),
    lastImportCount: records.length,
  }
  if (!next.meta.disclaimer) {
    next.meta.disclaimer = next.meta.official
      ? '正式赛事数据仅限本次比赛使用。'
      : '导入数据尚未声明来源，请补充数据使用说明。'
  }
  return next
}

export const useCompetitionStore = defineStore('competition', () => {
  const userStore = useUserStore()
  const dataset = ref(buildCompetitionDataset())
  const loaded = ref(false)
  const loadingPromise = ref(null)
  const selectedStudentId = ref('')
  const adjustments = ref({})

  const analysis = computed(() => analyzeCompetitionDataset(dataset.value))

  const linkedStudentId = computed(() => {
    const configured = selectedStudentId.value
    if (configured) return configured
    if (userStore.role !== 'student') return analysis.value.learners[0]?.studentId || ''
    if (userStore.user?.id === '2024010001') return 'D01'
    if (userStore.user?.id === '2024010002') return 'D02'
    const learners = analysis.value.learners
    if (!learners.length) return ''
    const name = String(userStore.name || '')
    const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
    return learners[hash % learners.length].studentId
  })

  const currentLearner = computed(() =>
    learnerFor(analysis.value, linkedStudentId.value),
  )
  const currentRecommendationRaw = computed(() =>
    recommendationFor(analysis.value, linkedStudentId.value),
  )
  const currentRecommendation = computed(() => {
    const recommendation = currentRecommendationRaw.value
    if (!recommendation) return null
    const overrides = adjustments.value[recommendation.id] || {}
    return {
      ...clone(recommendation),
      actions: recommendation.actions
        .map((item) => {
          const override = overrides[item.id] || {}
          if (override.status === 'rejected') return null
          return {
            ...item,
            ...(override.patch || {}),
            teacherDecision: override.status || '',
            teacherReason: override.reason || '',
            adjustedAt: override.updatedAt || '',
          }
        })
        .filter(Boolean),
      adjustments: Object.values(overrides),
    }
  })

  const overview = computed(() => ({
    topics: dataset.value.topics.length,
    requirements: dataset.value.requirements.length,
    materials: dataset.value.materials.length,
    questions: dataset.value.questions.length,
    students: dataset.value.students.length,
    records: dataset.value.learningRecords.length,
    effectiveRecords: analysis.value.quality.validCount,
    supersededRevisions: analysis.value.quality.supersededRevisionCount,
    quality: analysis.value.quality,
    group: analysis.value.group,
  }))

  async function load() {
    if (loaded.value) return
    if (loadingPromise.value) return loadingPromise.value
    loadingPromise.value = (async () => {
      const [savedDataset, savedAdjustments] = await Promise.all([
        idbGet(DATASET_KEY),
        idbGet(ADJUSTMENTS_KEY),
      ])
      if (validDataset(savedDataset)) dataset.value = savedDataset
      if (savedAdjustments && typeof savedAdjustments === 'object') {
        adjustments.value = savedAdjustments
      }
      loaded.value = true
    })()
    return loadingPromise.value
  }

  async function persistDataset() {
    await idbSet(DATASET_KEY, clone(dataset.value))
  }

  async function persistAdjustments() {
    await idbSet(ADJUSTMENTS_KEY, clone(adjustments.value))
  }

  async function importJson(textValue, sourceName = 'dataset.json') {
    const parsed = JSON.parse(String(textValue || ''))
    dataset.value = normalizeDataset(parsed, dataset.value)
    selectedStudentId.value = ''
    await persistDataset()
    return analysis.value
  }

  async function importCsv(textValue, sourceName = 'records.csv') {
    const rows = parseCsv(textValue)
    if (!rows.length) throw new Error('CSV 没有数据行或表头无法识别')
    dataset.value = mergeImportedRecords(dataset.value, rows, sourceName)
    await persistDataset()
    return analysis.value
  }

  async function importFile(file) {
    if (!file) throw new Error('没有选择文件')
    const name = String(file.name || '').toLowerCase()
    const textValue = await file.text()
    if (name.endsWith('.csv')) return importCsv(textValue, file.name)
    if (name.endsWith('.json')) return importJson(textValue, file.name)
    throw new Error('仅支持 CSV 或 JSON 数据文件')
  }

  async function resetDataset() {
    dataset.value = buildCompetitionDataset()
    selectedStudentId.value = ''
    await persistDataset()
  }

  function selectStudent(studentId) {
    selectedStudentId.value = studentId
  }

  async function adjustAction(recommendationId, actionId, { status, patch, reason }) {
    if (!recommendationId || !actionId) return
    const current = adjustments.value[recommendationId] || {}
    current[actionId] = {
      recommendationId,
      actionId,
      status: status || 'edited',
      patch: patch || {},
      reason: String(reason || '').trim(),
      updatedAt: new Date().toISOString(),
    }
    adjustments.value = {
      ...adjustments.value,
      [recommendationId]: current,
    }
    await persistAdjustments()
  }

  function recommendationForStudent(studentId) {
    selectedStudentId.value = studentId
    return {
      learner: learnerFor(analysis.value, studentId),
      recommendation: buildRecommendation(
        dataset.value,
        learnerFor(analysis.value, studentId),
        analysis.value.quality,
      ),
    }
  }

  function taskPackage() {
    const pkg = buildTaskPackage(dataset.value, analysis.value)
    return {
      ...pkg,
      teacherAdjustments: clone(adjustments.value),
    }
  }

  return {
    dataset,
    loaded,
    analysis,
    overview,
    selectedStudentId,
    linkedStudentId,
    currentLearner,
    currentRecommendation,
    adjustments,
    load,
    importJson,
    importCsv,
    importFile,
    resetDataset,
    selectStudent,
    adjustAction,
    recommendationForStudent,
    taskPackage,
  }
})
