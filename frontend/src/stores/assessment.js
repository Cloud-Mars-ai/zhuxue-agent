import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'ai-tutor-assessment'

function safeGetItem(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key, value) {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function load() {
  const raw = safeGetItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/**
 * AI 智能出题与模拟面试考核（M4）
 * 流程：教师圈人选范围 → AI 生成题目 → 教师复核发布 → 学生作答 → AI 反馈 → 教师评分
 *
 * task.items[].status: pending_review 待复核 / approved 已通过（学生可见） / rejected 已驳回
 * task.status: reviewing 复核中 / published 已发布
 */
export const useAssessmentStore = defineStore('assessment', () => {
  const tasks = ref(load())

  function persist() {
    safeSetItem(STORAGE_KEY, JSON.stringify(tasks.value))
  }

  function createTask({ scope, items }) {
    const task = {
      id: `a-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      scope,
      items,
      status: 'reviewing',
    }
    tasks.value.unshift(task)
    persist()
    return task
  }

  function getTask(id) {
    return tasks.value.find((t) => t.id === id) || null
  }

  /** 教师复核单个题目：通过 / 驳回 / 编辑 */
  function reviewItem(taskId, itemId, { action, question }) {
    const task = getTask(taskId)
    if (!task) return
    const item = task.items.find((i) => i.id === itemId)
    if (!item) return
    if (typeof question === 'string' && question.trim()) item.question = question.trim()
    if (action === 'approve') item.status = 'approved'
    if (action === 'reject') item.status = 'rejected'
    persist()
  }

  /** 批量通过待复核题目 */
  function approveAll(taskId) {
    const task = getTask(taskId)
    if (!task) return
    task.items.forEach((i) => {
      if (i.status === 'pending_review') i.status = 'approved'
    })
    persist()
  }

  /** 发布：仅当至少一题通过后才可发布，发布后学生端可见 */
  function publish(taskId) {
    const task = getTask(taskId)
    if (!task) return false
    if (!task.items.some((i) => i.status === 'approved')) return false
    task.status = 'published'
    persist()
    return true
  }

  /** 学生提交作答，写入 AI 反馈 */
  function submitAnswer(taskId, itemId, { answer, feedback }) {
    const task = getTask(taskId)
    if (!task) return
    const item = task.items.find((i) => i.id === itemId)
    if (!item) return
    item.answer = answer
    item.aiFeedback = feedback
    item.answeredAt = new Date().toISOString()
    persist()
  }

  /** 教师最终评分 */
  function scoreItem(taskId, itemId, score) {
    const task = getTask(taskId)
    if (!task) return
    const item = task.items.find((i) => i.id === itemId)
    if (!item) return
    item.teacherScore = score
    persist()
  }

  /** 学生可见的题目（已发布任务中分配给自己且已通过复核的） */
  function visibleItemsFor(studentId) {
    const result = []
    tasks.value
      .filter((t) => t.status === 'published')
      .forEach((t) => {
        t.items.forEach((i) => {
          if (i.studentId === studentId && i.status === 'approved') {
            result.push({ task: t, item: i })
          }
        })
      })
    return result
  }

  function resetAll() {
    tasks.value = []
    persist()
  }

  return {
    tasks,
    createTask,
    getTask,
    reviewItem,
    approveAll,
    publish,
    submitAnswer,
    scoreItem,
    visibleItemsFor,
    resetAll,
  }
})
