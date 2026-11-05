import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { HOMEWORKS } from '@/mock/data'
import { idbGet, idbSet } from '@/repositories/db'

const STORAGE_KEY = 'ai-tutor-homework-v2'

function seedAssignments() {
  return HOMEWORKS.map((item) => ({
    ...item,
    description:
      item.description ||
      '请结合本周课程内容完成作业。提交前请检查论点、依据和格式，必要时附上本地文件。',
    requirements: item.requirements || [
      '写明使用的课程概念与判断依据',
      '如引用资料，请标出来源',
      '上传格式支持 PDF、DOCX、PPTX、图片、TXT 或 ZIP',
    ],
    materials: item.materials || [],
    teacher: '王老师',
    createdAt: item.createdAt || '2026-10-01 09:00',
  }))
}

function clone(value) {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return value
  }
}

export const useHomeworkStore = defineStore('homework', () => {
  const assignments = ref([])
  const submissions = ref({})
  const loaded = ref(false)
  let loadingPromise = null

  const sortedAssignments = computed(() =>
    [...assignments.value].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    ),
  )

  function submissionKey(assignmentId, studentId) {
    return `${assignmentId}:${studentId}`
  }

  function findAssignment(id) {
    return assignments.value.find((item) => String(item.id) === String(id)) || null
  }

  function submissionFor(assignmentId, studentId) {
    return submissions.value[submissionKey(assignmentId, studentId)] || null
  }

  function submissionsFor(assignmentId) {
    return Object.values(submissions.value)
      .filter((item) => String(item.assignmentId) === String(assignmentId))
      .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)))
  }

  async function persist() {
    const plainSubmissions = Object.fromEntries(
      Object.entries(submissions.value).map(([key, item]) => [key, { ...item }]),
    )
    await idbSet(STORAGE_KEY, {
      assignments: clone(assignments.value),
      submissions: plainSubmissions,
    })
  }

  async function load() {
    if (loaded.value) return
    if (loadingPromise) return loadingPromise
    loadingPromise = (async () => {
      const saved = await idbGet(STORAGE_KEY)
      assignments.value =
        saved && Array.isArray(saved.assignments) && saved.assignments.length
          ? saved.assignments
          : seedAssignments()
      submissions.value =
        saved && saved.submissions && typeof saved.submissions === 'object'
          ? saved.submissions
          : {
              '2:2024010001': {
                assignmentId: 2,
                studentId: '2024010001',
                studentName: '张同学',
                status: 'graded',
                score: 88,
                fileName: '第2章管理理论对比表.pdf',
                fileType: 'application/pdf',
                submittedAt: '2026-10-07T20:30:00+08:00',
                teacherReply:
                  '结构清晰，概念对比准确。请补上“适用条件”一列，并在下一版中用具体案例说明两种理论的差异。',
                grader: '王老师',
                gradedAt: '2026-10-09T10:20:00+08:00',
              },
              '3:2024010001': {
                assignmentId: 3,
                studentId: '2024010001',
                studentName: '张同学',
                status: 'graded',
                score: 92,
                fileName: '第1章研讨纪要.docx',
                fileType:
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                submittedAt: '2026-09-24T21:10:00+08:00',
                teacherReply: '纪要完整，重点突出。如果能补充每位发言者的依据，会更接近高质量研讨记录。',
                grader: '王老师',
                gradedAt: '2026-09-26T09:45:00+08:00',
              },
            }
      loaded.value = true
      if (!saved) await persist()
    })()
    return loadingPromise
  }

  async function addAssignment(payload) {
    await load()
    const item = {
      id: `hw-${Date.now().toString(36)}`,
      title: String(payload.title || '').trim(),
      description: String(payload.description || '').trim(),
      requirements: [
        '提交前检查论证结构、材料引用与格式',
        '支持上传 PDF、DOCX、PPTX、图片、TXT 或 ZIP',
      ],
      materials: payload.materials || [],
      deadline: payload.deadline,
      status: 'pending',
      submitted: 0,
      total: 86,
      score: null,
      teacher: payload.teacher || '当前教师',
      createdAt: new Date().toISOString(),
    }
    assignments.value = [item, ...assignments.value]
    await persist()
    return item
  }

  async function submitFile({ assignmentId, student, file }) {
    await load()
    if (!file) throw new Error('请选择要提交的文件')
    if (file.size > 20 * 1024 * 1024) throw new Error('单个文件不能超过 20 MB')
    const bytes = new Uint8Array(await file.arrayBuffer())
    let binary = ''
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
    }
    const item = {
      assignmentId,
      studentId: student.id,
      studentName: student.name,
      status: 'submitted',
      score: null,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      fileDataBase64: btoa(binary),
      submittedAt: new Date().toISOString(),
      teacherReply: '',
    }
    submissions.value = {
      ...submissions.value,
      [submissionKey(assignmentId, student.id)]: item,
    }
    const assignment = findAssignment(assignmentId)
    if (assignment && assignment.status === 'pending') assignment.status = 'submitting'
    await persist()
    return item
  }

  async function grade({ assignmentId, studentId, score, reply, grader }) {
    await load()
    const key = submissionKey(assignmentId, studentId)
    const current = submissions.value[key]
    if (!current) throw new Error('未找到该学生的提交')
    submissions.value[key] = {
      ...current,
      status: 'graded',
      score: Math.max(0, Math.min(100, Number(score) || 0)),
      teacherReply: String(reply || '').trim(),
      grader,
      gradedAt: new Date().toISOString(),
    }
    const assignment = findAssignment(assignmentId)
    if (assignment) assignment.status = 'graded'
    await persist()
    return submissions.value[key]
  }

  return {
    assignments,
    submissions,
    loaded,
    sortedAssignments,
    load,
    findAssignment,
    submissionFor,
    submissionsFor,
    addAssignment,
    submitFile,
    grade,
  }
})
