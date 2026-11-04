import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { idbGet, idbSet } from '@/repositories/db'

const STORAGE_KEY = 'course-studio-projects-v1'
const MAX_PROJECTS = 12

function clone(value) {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return value
  }
}

function normalizeSceneState(scene) {
  return {
    outlineId: scene?.outlineId || '',
    status: ['pending', 'generating', 'ready', 'fallback', 'error'].includes(scene?.status)
      ? scene.status
      : 'pending',
    content: scene?.content || null,
    sources: Array.isArray(scene?.sources) ? scene.sources : [],
    error: scene?.error || '',
    repaired: !!scene?.repaired,
    fingerprint: scene?.fingerprint || '',
  }
}

function normalizeProject(project) {
  if (!project || typeof project !== 'object') return null
  return {
    id: project.id || `course-${Date.now().toString(36)}`,
    ownerId: project.ownerId || '',
    status: ['outline', 'generating', 'ready', 'failed'].includes(project.status)
      ? project.status
      : 'outline',
    title: project.title || '未命名课程',
    chapter: project.chapter || '',
    objective: project.objective || '',
    audience: project.audience || '',
    mode: project.mode === 'sprint' ? 'sprint' : 'course',
    durationMinutes: Number(project.durationMinutes) || 30,
    summary: project.summary || '',
    languageDirective: project.languageDirective || '',
    outlines: Array.isArray(project.outlines) ? clone(project.outlines) : [],
    sourceChunkIds: Array.isArray(project.sourceChunkIds) ? project.sourceChunkIds : [],
    sources: Array.isArray(project.sources) ? project.sources : [],
    scenes: (Array.isArray(project.scenes) ? project.scenes : []).map(normalizeSceneState),
    fallback: !!project.fallback,
    outlineError: project.outlineError || '',
    generatorVersion: project.generatorVersion || '',
    error: project.error || '',
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: project.updatedAt || new Date().toISOString(),
  }
}

export const useCourseStudioStore = defineStore('courseStudio', () => {
  const projects = ref([])
  const loaded = ref(false)
  let loadingPromise = null

  const latest = computed(() => projects.value[0] || null)

  async function load() {
    if (loaded.value) return projects.value
    if (loadingPromise) return loadingPromise
    loadingPromise = (async () => {
      const saved = await idbGet(STORAGE_KEY)
      projects.value = (Array.isArray(saved) ? saved : []).map(normalizeProject).filter(Boolean)
      loaded.value = true
      return projects.value
    })()
    return loadingPromise
  }

  async function persist() {
    await idbSet(STORAGE_KEY, clone(projects.value.slice(0, MAX_PROJECTS)))
  }

  function find(projectId) {
    return projects.value.find((project) => project.id === projectId) || null
  }

  function latestFor(ownerId) {
    return projects.value.find((project) => !ownerId || project.ownerId === ownerId) || null
  }

  async function save(project) {
    const normalized = normalizeProject({
      ...project,
      updatedAt: new Date().toISOString(),
    })
    if (!normalized) return null
    const index = projects.value.findIndex((item) => item.id === normalized.id)
    if (index >= 0) projects.value.splice(index, 1, normalized)
    else projects.value.unshift(normalized)
    projects.value = [...projects.value]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, MAX_PROJECTS)
    await persist()
    return find(normalized.id)
  }

  async function createDraft({ ownerId, input, result }) {
    const now = new Date().toISOString()
    const outlines = clone(result.blueprint.outlines)
    const project = {
      id: `course-${Date.now().toString(36)}`,
      ownerId,
      status: 'outline',
      title: result.blueprint.courseTitle,
      chapter: input.chapter,
      objective: input.objective,
      audience: input.audience,
      mode: input.mode,
      durationMinutes: input.durationMinutes,
      summary: result.blueprint.courseSummary,
      languageDirective: result.blueprint.languageDirective,
      outlines,
      sourceChunkIds: Array.from(
        new Set(outlines.flatMap((scene) => scene.sourceChunkIds || [])),
      ),
      sources: clone(result.sources || []),
      scenes: outlines.map((scene) => normalizeSceneState({ outlineId: scene.id })),
      fallback: !!result.fallback,
      outlineError: result.error?.message || '',
      generatorVersion: 'openmaic-10a92d6-adapt-v1',
      createdAt: now,
      updatedAt: now,
    }
    return save(project)
  }

  async function updateProject(projectId, patch) {
    const project = find(projectId)
    if (!project) return null
    Object.assign(project, clone(patch), { updatedAt: new Date().toISOString() })
    projects.value = [...projects.value]
    await persist()
    return project
  }

  async function replaceOutline(projectId, outlines) {
    const project = find(projectId)
    if (!project) return null
    const existing = new Map(project.scenes.map((scene) => [scene.outlineId, scene]))
    project.outlines = clone(outlines)
    project.sourceChunkIds = Array.from(
      new Set(outlines.flatMap((scene) => scene.sourceChunkIds || [])),
    )
    project.scenes = outlines.map((scene) =>
      normalizeSceneState(existing.get(scene.id) || { outlineId: scene.id }),
    )
    project.status = 'outline'
    project.error = ''
    project.updatedAt = new Date().toISOString()
    await persist()
    return project
  }

  async function beginGeneration(projectId, { reset = true } = {}) {
    const project = find(projectId)
    if (!project) return null
    project.status = 'generating'
    project.error = ''
    if (reset) {
      project.scenes = project.outlines.map((scene) =>
        normalizeSceneState({ outlineId: scene.id }),
      )
    } else {
      const byId = new Map(project.scenes.map((scene) => [scene.outlineId, scene]))
      project.scenes = project.outlines.map((scene) =>
        normalizeSceneState(byId.get(scene.id) || { outlineId: scene.id }),
      )
    }
    project.updatedAt = new Date().toISOString()
    await persist()
    return project
  }

  async function updateScene(projectId, outlineId, patch) {
    const project = find(projectId)
    if (!project) return null
    const index = project.scenes.findIndex((scene) => scene.outlineId === outlineId)
    if (index < 0) return null
    project.scenes.splice(index, 1, normalizeSceneState({ ...project.scenes[index], ...patch }))
    project.updatedAt = new Date().toISOString()
    await persist()
    return project.scenes[index]
  }

  async function finishGeneration(projectId, status = 'ready') {
    const project = find(projectId)
    if (!project) return null
    project.status = status
    project.fallback = project.scenes.some((scene) => scene.status === 'fallback')
    project.updatedAt = new Date().toISOString()
    await persist()
    return project
  }

  async function remove(projectId) {
    projects.value = projects.value.filter((project) => project.id !== projectId)
    await persist()
  }

  return {
    projects,
    loaded,
    latest,
    load,
    find,
    latestFor,
    save,
    createDraft,
    updateProject,
    replaceOutline,
    beginGeneration,
    updateScene,
    finishGeneration,
    remove,
  }
})
