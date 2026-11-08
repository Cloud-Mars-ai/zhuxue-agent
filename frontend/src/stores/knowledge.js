import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { COURSE_OUTLINE, outlineToText } from '@/mock/courseOutline'
import { idbGet, idbSet } from '@/repositories/db'
import { repairText } from '@/utils/textRepair'

/**
 * 课程知识库（S3 轻量版）
 *
 * - 材料必须由教师确认（confirmedBy: 'teacher'）才进入 AI 上下文；
 * - 切片在内存中完成，按章节/关键词检索 top-k，不把整门课塞进窗口；
 * - 存储走 IndexedDB，localStorage 只作为降级。
 */

const STORAGE_KEY = 'knowledge-materials-v1'
const BOARD_STORAGE_KEY = 'knowledge-boards-v1'
const MAX_CONTEXT_CHARS = 2000
const TOP_K = 3

function seedMaterials() {
  const now = new Date().toISOString()
  return COURSE_OUTLINE.map((c) => ({
    id: `m-ch${c.id}`,
    title: `${c.title} · 课程纲要（教师确认稿）`,
    chapter: c.title,
    text: outlineToText([c]),
    confirmedBy: 'teacher',
    seeded: true,
    updatedAt: now,
  }))
}

/** 按行聚合成不超过 maxLen 的片段 */
function chunkText(text, maxLen = 420) {
  const lines = String(text || '')
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
  const chunks = []
  let buf = ''
  lines.forEach((line) => {
    if ((buf + line).length > maxLen && buf) {
      chunks.push(buf)
      buf = line
    } else {
      buf = buf ? `${buf}\n${line}` : line
    }
  })
  if (buf) chunks.push(buf)
  return chunks
}

/** 中文按 2 字滑窗，英文按单词，构造检索词 */
function queryTerms(query) {
  const q = String(query || '').toLowerCase()
  const terms = new Set()
  const words = q.match(/[a-z0-9]{2,}/g) || []
  words.forEach((w) => terms.add(w))
  const han = q.replace(/[^\u4e00-\u9fa5]/g, '')
  for (let i = 0; i + 2 <= han.length; i += 1) {
    terms.add(han.slice(i, i + 2))
  }
  // 常见虚词不参与打分
  ;['的是', '什么', '怎么', '为什', '么是', '可以', '一下'].forEach((t) => terms.delete(t))
  return [...terms].slice(0, 40)
}

export const useKnowledgeStore = defineStore('knowledge', () => {
  const materials = ref([])
  const savedBoards = ref([])
  const loaded = ref(false)
  const boardsLoaded = ref(false)
  let loadingPromise = null
  let boardsLoadingPromise = null

  const stats = computed(() => {
    const chars = materials.value.reduce((n, m) => n + (m.text?.length || 0), 0)
    return { count: materials.value.length, chars }
  })

  const allChunks = computed(() => {
    const list = []
    materials.value.forEach((m) => {
      chunkText(m.text).forEach((text, i) => {
        list.push({
          id: `${m.id}-${i}`,
          materialId: m.id,
          title: m.title,
          chapter: m.chapter,
          text,
          seeded: !!m.seeded,
          updatedAt: m.updatedAt || '',
        })
      })
    })
    return list
  })

  async function load() {
    if (loaded.value) return
    if (loadingPromise) return loadingPromise
    loadingPromise = (async () => {
      const saved = await idbGet(STORAGE_KEY)
      if (Array.isArray(saved)) {
        materials.value = saved
      } else {
        materials.value = seedMaterials()
        await idbSet(STORAGE_KEY, materials.value)
      }
      loaded.value = true
    })()
    return loadingPromise
  }

  async function ensureLoaded() {
    if (!loaded.value) await load()
    return materials.value
  }

  async function persist() {
    await idbSet(STORAGE_KEY, materials.value)
  }

  async function loadBoards() {
    if (boardsLoaded.value) return savedBoards.value
    if (boardsLoadingPromise) return boardsLoadingPromise
    boardsLoadingPromise = (async () => {
      const saved = await idbGet(BOARD_STORAGE_KEY)
      savedBoards.value = Array.isArray(saved) ? saved : []
      boardsLoaded.value = true
      return savedBoards.value
    })()
    return boardsLoadingPromise
  }

  async function persistBoards() {
    await idbSet(BOARD_STORAGE_KEY, savedBoards.value)
  }

  async function saveBoard({
    title,
    chapter = '',
    projectId = '',
    sceneId = '',
    route = '',
    lesson,
    ownerId = '',
  }) {
    await loadBoards()
    const stableId = `${projectId || 'board'}:${sceneId || title || Date.now()}`
    const item = {
      id: stableId,
      title: String(title || lesson?.title || '未命名板书').trim(),
      chapter: String(chapter || lesson?.chapter || '').trim(),
      projectId,
      sceneId,
      route,
      ownerId,
      lesson,
      savedAt: new Date().toISOString(),
    }
    const existing = savedBoards.value.findIndex((board) => board.id === stableId)
    if (existing >= 0) savedBoards.value.splice(existing, 1, item)
    else savedBoards.value.unshift(item)
    savedBoards.value = savedBoards.value.slice(0, 60)
    await persistBoards()
    return item
  }

  async function removeBoard(id) {
    await loadBoards()
    savedBoards.value = savedBoards.value.filter((board) => board.id !== id)
    await persistBoards()
  }

  /**
   * 新增材料。kind/sourceName/repairedChars 为课程主页三卡上传的溯源字段
   * （2026-11-08 新增）：卡片列表以知识库为唯一事实源，删除即真删除，
   * 不再读可能过期的 localStorage 元数据。其他入口不传即为空串。
   */
  async function addMaterial({ title, chapter, text, size = 0, kind = '', sourceName = '', repairedChars = 0 }) {
    // 入库前修复：用户手动粘贴的 PDF 文本同样可能带乱码，
    // 不修的话会存进知识库并在材料列表、检索上下文中扩散。
    const cleanTitle = repairText(title).text.trim()
    const cleanText = repairText(text).text.trim()
    const item = {
      id: `m-${Date.now().toString(36)}`,
      title: cleanTitle || `${chapter} 补充材料`,
      chapter,
      text: cleanText,
      size: Number(size) || 0,
      kind: String(kind || ''),
      sourceName: String(sourceName || ''),
      repairedChars: Number(repairedChars) || 0,
      confirmedBy: 'teacher',
      seeded: false,
      updatedAt: new Date().toISOString(),
    }
    materials.value = [item, ...materials.value]
    await persist()
    return item
  }

  async function updateMaterial(id, patch) {
    materials.value = materials.value.map((m) =>
      m.id === id ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m,
    )
    await persist()
  }

  async function removeMaterial(id) {
    materials.value = materials.value.filter((m) => m.id !== id)
    await persist()
  }

  async function resetToOutline() {
    materials.value = seedMaterials()
    await persist()
  }

  /**
   * 构造检索上下文
   * @returns {{text:string, chunks:Array}}
   */
  async function buildContext({ chapter = '', query = '' } = {}) {
    await ensureLoaded()
    const pool = allChunks.value.filter((c) => c.materialId)
    if (!pool.length) return { text: '', chunks: [] }

    const terms = queryTerms(query)
    const scored = pool.map((c) => {
      let score = 0
      if (chapter && c.chapter === chapter) score += 6
      terms.forEach((t) => {
        if (c.text.toLowerCase().includes(t)) score += 2
        if (c.title.toLowerCase().includes(t)) score += 1
      })
      return { ...c, score }
    })

    let picked = scored
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K)

    // 没有命中时，回退到该章前 2 片，保证"讲这一章"仍有材料
    if (!picked.length) {
      picked = pool.filter((c) => !chapter || c.chapter === chapter).slice(0, 2)
    }

    let used = 0
    const chosen = []
    picked.forEach((c) => {
      if (used + c.text.length > MAX_CONTEXT_CHARS) return
      chosen.push(c)
      used += c.text.length
    })

    if (!chosen.length) return { text: '', chunks: [] }

    const text =
      '【课程材料 · 仅可依据以下内容】\n' +
      chosen
        .map((c, i) => `[材料${i + 1}｜${c.title}｜${c.chapter}]\n${c.text}`)
        .join('\n\n') +
      '\n\n【材料使用规则】优先使用上述材料回答；材料未覆盖时明确说"课程材料未涉及"，不要编造；引用时在句末标注（来源：材料标题）。'

    return { text, chunks: chosen }
  }

  /**
   * 课程编排需要比答疑更宽的上下文：优先本章材料，再按关键词补足，
   * 但仍保留硬上限，避免把整本教材塞进一次生成请求。
   */
  async function buildGenerationContext({
    chapter = '',
    query = '',
    maxContextChars = 6000,
    topK = 6,
    materialIds = [],
    preferUploaded = false,
    excludeSeeded = false,
  } = {}) {
    await ensureLoaded()
    const restricted = (Array.isArray(materialIds) ? materialIds : []).filter(Boolean)
    const allowedMaterials = restricted.length ? new Set(restricted) : null
    const pool = allChunks.value.filter(
      (chunk) =>
        chunk.materialId &&
        (!allowedMaterials || allowedMaterials.has(chunk.materialId)) &&
        (!excludeSeeded || !chunk.seeded),
    )
    if (!pool.length) return { text: '', chunks: [] }

    const terms = queryTerms(`${query} ${chapter}`)
    const scored = pool.map((c) => {
      let score = 0
      if (chapter && c.chapter === chapter) score += 10
      if (chapter && c.chapter.includes(chapter.replace(/^第\d+章\s*/, ''))) score += 4
      terms.forEach((term) => {
        if (c.text.toLowerCase().includes(term)) score += 2
        if (c.title.toLowerCase().includes(term)) score += 1
      })
      return { ...c, score }
    })

    const uploaded = scored.filter((c) => !c.seeded)
    const chapterChunks = scored.filter((c) => !chapter || c.chapter === chapter)
    const selected = []
    const seen = new Set()
    const add = (chunk) => {
      if (!chunk || seen.has(chunk.id) || selected.length >= topK) return
      seen.add(chunk.id)
      selected.push(chunk)
    }

    if (preferUploaded && uploaded.length) {
      uploaded
        .sort(
          (a, b) =>
            b.score - a.score ||
            String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')),
        )
        .forEach(add)
    }
    chapterChunks
      .sort((a, b) => b.score - a.score)
      .forEach(add)
    scored
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .forEach(add)
    if (!preferUploaded || !uploaded.length) chapterChunks.forEach(add)

    let used = 0
    const chunks = []
    for (const chunk of selected) {
      if (used + chunk.text.length > maxContextChars) {
        const remaining = maxContextChars - used
        if (remaining < 160) continue
        chunks.push({ ...chunk, text: `${chunk.text.slice(0, remaining - 1)}…` })
        break
      }
      chunks.push(chunk)
      used += chunk.text.length
    }
    if (!chunks.length) return { text: '', chunks: [] }

    const text = chunks
      .map(
        (chunk, index) =>
          `[${chunk.id}｜材料${index + 1}｜${chunk.title}｜${chunk.chapter}]\n${chunk.text}`,
      )
      .join('\n\n')

    return { text, chunks }
  }

  async function chunksByIds(ids = []) {
    await ensureLoaded()
    const wanted = new Set((Array.isArray(ids) ? ids : []).filter(Boolean))
    if (!wanted.size) return []
    return allChunks.value.filter((chunk) => wanted.has(chunk.id))
  }

  function byChapter(chapter) {
    return materials.value.filter((m) => m.chapter === chapter)
  }

  return {
    materials,
    savedBoards,
    loaded,
    stats,
    allChunks,
    load,
    loadBoards,
    ensureLoaded,
    addMaterial,
    updateMaterial,
    removeMaterial,
    resetToOutline,
    buildContext,
    buildGenerationContext,
    chunksByIds,
    byChapter,
    saveBoard,
    removeBoard,
  }
})
