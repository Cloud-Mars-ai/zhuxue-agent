import { COURSE, HOMEWORKS, MOCK_STUDENTS } from '@/mock/data'
import { COURSE_OUTLINE, getOutlineByTitle } from '@/mock/courseOutline'

function hash(value) {
  let result = 2166136261
  const text = String(value || '')
  for (let index = 0; index < text.length; index += 1) {
    result ^= text.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

function randomFactory(seed) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let next = value
    next = Math.imul(next ^ (next >>> 15), next | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function chapterFromText(text) {
  const match = String(text || '').match(/第(\d+)章/)
  if (!match) return null
  return COURSE_OUTLINE.find((chapter) => chapter.id === Number(match[1])) || null
}

function groupsFor(count) {
  return Array.from({ length: count }, (_, index) => `第${Math.floor(index / 7) + 1}组`)
}

function buildStudents(total) {
  const groups = groupsFor(total)
  return Array.from({ length: total }, (_, index) => {
    const preset = MOCK_STUDENTS[index]
    return {
      id: preset?.id || `SIM-${String(index + 1).padStart(3, '0')}`,
      name: preset?.name || `模拟学生${String(index + 1).padStart(2, '0')}`,
      group: preset?.group || groups[index],
      discipline: preset?.discipline || '管理类',
    }
  })
}

export function listClassActivities(tasks = []) {
  const homeworkActivities = HOMEWORKS.map((item) => {
    const chapter = chapterFromText(item.title)
    return {
      id: `homework:${item.id}`,
      sourceId: String(item.id),
      kind: '作业',
      title: item.title,
      chapters: chapter ? [chapter.title] : [],
      submitted: item.submitted,
      total: item.total,
      status: item.status,
      deadline: item.deadline,
    }
  })
  const assessmentActivities = tasks.map((task) => ({
    id: `assessment:${task.id}`,
    sourceId: task.id,
    kind: '考试',
    title: `${task.scope?.chapters?.join('、') || '未设范围'} · ${task.scope?.questionType || '考核'}`,
    chapters: Array.isArray(task.scope?.chapters) ? task.scope.chapters : [],
    submitted: task.items?.filter((item) => item.answer).length || 0,
    total:
      task.items?.filter((item) => item.status === 'approved').length ||
      task.scope?.studentCount ||
      0,
    status: task.status,
    deadline: '',
    task,
  }))
  return [...assessmentActivities, ...homeworkActivities].filter(
    (activity) => activity.chapters.length,
  )
}

function selectedChapters(activity) {
  const found = (activity.chapters || []).map(getOutlineByTitle).filter(Boolean)
  if (found.length) return found
  return [COURSE_OUTLINE[2]]
}

function levelOf(score) {
  if (score >= 85) return '熟练掌握'
  if (score >= 70) return '基本掌握'
  if (score >= 60) return '待巩固'
  return '重点关注'
}

function confidenceOf(completion) {
  if (completion >= 0.85) return '较高'
  if (completion >= 0.6) return '中等'
  return '有限'
}

export function buildClassKnowledgeAnalysis(activity) {
  const chapters = selectedChapters(activity)
  const concepts = chapters.flatMap((chapter) =>
    chapter.keyPoints.map((point) => ({
      ...point,
      chapter: chapter.title,
      chapterId: chapter.id,
    })),
  )
  const totalStudents = Math.max(COURSE.studentCount, MOCK_STUDENTS.length)
  const students = buildStudents(totalStudents)
  const random = randomFactory(hash(activity.id))
  const declaredSubmitted = Number(activity.submitted) || 0
  const declaredTotal = Number(activity.total) || totalStudents
  const completionRate = clamp(
    declaredTotal > 0 ? declaredSubmitted / declaredTotal : 0,
    0,
    1,
  )
  const submittedTarget = Math.min(
    totalStudents,
    Math.max(0, Math.round(completionRate * totalStudents)),
  )
  const submittedIds = new Set(
    students
      .map((student) => ({
        id: student.id,
        rank: randomFactory(hash(`${activity.id}:submit:${student.id}`))(),
      }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, submittedTarget)
      .map((item) => item.id),
  )

  const conceptMastery = concepts.map((concept, index) => {
    const priorityLift = concept.priority ? 0.035 : 0
    const randomLift = (random() - 0.5) * 0.28
    const chapterProgress =
      COURSE.chapters.find((chapter) => chapter.title === concept.chapter)?.progress || 60
    const base =
      0.52 +
      completionRate * 0.2 +
      chapterProgress / 400 +
      priorityLift +
      randomLift -
      (index % 4 === 3 ? 0.06 : 0)
    return {
      ...concept,
      mastery:
        submittedTarget > 0
          ? Math.round(clamp(base, 0.36, 0.96) * 100)
          : null,
    }
  })

  const studentResults = students.map((student, studentIndex) => {
    const personal = randomFactory(hash(`${activity.id}:${student.id}`))
    const submitted = submittedIds.has(student.id)
    const averageMastery =
      conceptMastery.reduce((sum, concept) => sum + (concept.mastery || 0), 0) /
      Math.max(1, conceptMastery.length)
    const score = submitted
      ? Math.round(clamp(averageMastery + (personal() - 0.5) * 24, 28, 100))
      : null
    return {
      ...student,
      submitted,
      score,
      level: submitted ? levelOf(score) : '未提交',
      weakConcept:
        submitted && score < 72
          ? conceptMastery
              .slice()
              .sort((a, b) => a.mastery - b.mastery)[studentIndex % 2]?.term || ''
          : '',
    }
  })

  const submittedStudents = studentResults.filter((student) => student.submitted)
  const averageScore = submittedStudents.length
    ? Math.round(
        submittedStudents.reduce((sum, student) => sum + student.score, 0) /
          submittedStudents.length,
      )
    : 0
  const distribution = [
    {
      label: '熟练掌握',
      value: submittedStudents.filter((student) => student.score >= 85).length,
      tone: 'ok',
    },
    {
      label: '基本掌握',
      value: submittedStudents.filter(
        (student) => student.score >= 70 && student.score < 85,
      ).length,
      tone: 'accent',
    },
    {
      label: '待巩固',
      value: submittedStudents.filter(
        (student) => student.score >= 60 && student.score < 70,
      ).length,
      tone: 'warn',
    },
    {
      label: '重点关注',
      value: submittedStudents.filter((student) => student.score < 60).length,
      tone: 'danger',
    },
  ]

  const groupMap = new Map()
  studentResults.forEach((student) => {
    if (!groupMap.has(student.group)) {
      groupMap.set(student.group, { name: student.group, total: 0, submitted: 0, score: 0 })
    }
    const group = groupMap.get(student.group)
    group.total += 1
    if (student.submitted) {
      group.submitted += 1
      group.score += student.score
    }
  })
  const groups = [...groupMap.values()].map((group) => ({
    name: group.name,
    students: group.total,
    submitted: group.submitted,
    average: group.submitted ? Math.round(group.score / group.submitted) : 0,
  }))

  const weakConcepts = conceptMastery
    .filter((concept) => Number.isFinite(concept.mastery) && concept.mastery < 68)
    .sort((a, b) => a.mastery - b.mastery)
  const strongConcepts = conceptMastery
    .filter((concept) => Number.isFinite(concept.mastery))
    .slice()
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 3)
  const atRiskStudents = studentResults
    .filter((student) => student.submitted && student.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 6)
  const unsubmitted = studentResults.filter((student) => !student.submitted)

  return {
    activity,
    generatedAt: new Date().toISOString(),
    scope: {
      chapters: chapters.map((chapter) => chapter.title),
      concepts: conceptMastery.length,
      students: totalStudents,
    },
    completionRate: Math.round(completionRate * 100),
    submittedCount: submittedStudents.length,
    unsubmittedCount: unsubmitted.length,
    averageScore,
    passRate: submittedStudents.length
      ? Math.round(
          (submittedStudents.filter((student) => student.score >= 60).length /
            submittedStudents.length) *
            100,
        )
      : 0,
    excellenceRate: submittedStudents.length
      ? Math.round(
          (submittedStudents.filter((student) => student.score >= 85).length /
            submittedStudents.length) *
            100,
        )
      : 0,
    confidence: confidenceOf(completionRate),
    conceptMastery,
    weakConcepts,
    strongConcepts,
    distribution,
    groups,
    atRiskStudents,
    studentResults,
    insights: [
      weakConcepts.length
        ? `优先补强：${weakConcepts
            .slice(0, 3)
            .map((concept) => `${concept.term}（${concept.mastery}%）`)
            .join('、')}。`
        : '当前已观测知识点均达到基本掌握区间，可进入综合迁移练习。',
      atRiskStudents.length
        ? `${atRiskStudents.length} 名学生低于 60 分，主要集中在 ${
            weakConcepts[0]?.chapter || chapters[0].title
          }。`
        : '没有学生落入重点关注区间。',
      unsubmitted.length
        ? `${unsubmitted.length} 名学生尚未提交，未提交不计入平均分和掌握度。`
        : '本次活动提交完整，分析覆盖全部学生。',
    ],
    suggestions: [
      weakConcepts[0]
        ? `用 10 分钟重讲「${weakConcepts[0].term}」，随后安排 3 道基础检索题。`
        : '增加一组跨知识点辨析题，检验迁移能力。',
      weakConcepts[1]
        ? `将「${weakConcepts[1].term}」放入案例判断链，要求学生写出依据。`
        : '让学生用自己的话复述本章判断链。',
      atRiskStudents.length
        ? `优先关注 ${atRiskStudents
            .slice(0, 3)
            .map((student) => student.name)
            .join('、')}，安排短时个别反馈。`
        : '保持间隔复习，下一次活动加入开放题。',
    ],
  }
}

export function analysisToCsv(analysis) {
  const rows = [
    ['活动', analysis.activity.title],
    ['范围', analysis.scope.chapters.join('、')],
    ['学生数', analysis.scope.students],
    ['提交率', `${analysis.completionRate}%`],
    ['平均分', analysis.averageScore],
    ['及格率', `${analysis.passRate}%`],
    [],
    ['知识点', '章节', '掌握度', '状态'],
    ...analysis.conceptMastery.map((concept) => [
      concept.term,
      concept.chapter,
      concept.mastery == null ? '' : `${concept.mastery}%`,
      concept.mastery == null ? '未评估' : levelOf(concept.mastery),
    ]),
    [],
    ['学生', '小组', '是否提交', '得分', '状态'],
    ...analysis.studentResults.map((student) => [
      student.name,
      student.group,
      student.submitted ? '是' : '否',
      student.score ?? '',
      student.level,
    ]),
  ]
  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\r\n')
}
