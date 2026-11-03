import { COURSE } from '@/mock/data'
import { COURSE_OUTLINE } from '@/mock/courseOutline'

/**
 * 每日推荐主题（S1-4 主动式提问的最小可行版本）
 *
 * 规则优先：薄弱概念 → 低表现章节 → 未覆盖章节 → 当前章节速查。
 * 理由必须引用真实数据；同一天内稳定，次日刷新，7 天内不重复同一主题。
 */

const CACHE_PREFIX = 'ai-tutor-recommend-'

function todayKey() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function signatureOf(persona) {
  const b = persona?.behavior || {}
  return `${b.practiceCount || 0}-${b.totalQuestions || 0}`
}

function cacheKeyOf(persona) {
  return `${CACHE_PREFIX}${todayKey()}-${signatureOf(persona)}`
}

function loadCache(persona) {
  try {
    const raw = window.localStorage.getItem(cacheKeyOf(persona))
    const list = raw ? JSON.parse(raw) : null
    return Array.isArray(list) && list.length ? list : null
  } catch {
    return null
  }
}

function saveCache(persona, list) {
  try {
    window.localStorage.setItem(cacheKeyOf(persona), JSON.stringify(list))
    // 清理 7 天前的推荐缓存，避免无限增长
    const keys = []
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith(CACHE_PREFIX)) keys.push(k)
    }
    keys
      .sort()
      .reverse()
      .slice(7)
      .forEach((k) => window.localStorage.removeItem(k))
  } catch {
    // 忽略
  }
}

function chapterProgress(title) {
  return COURSE.chapters.find((c) => c.title === title)?.progress ?? 0
}

/**
 * @param {Object} persona persona.data
 * @param {string} currentChapter 当前进行章节
 * @returns {Array<{id,text,reason,chapter,to?}>}
 */
export function buildRecommendations(persona, currentChapter = '') {
  if (!persona?.masteryList) return []
  const items = []

  // 1. 反复出错的概念
  const topError = Object.entries(persona.conceptErrors || {})
    .sort((a, b) => b[1] - a[1])
    .find(([, n]) => n >= 1)
  if (topError) {
    const [term, times] = topError
    const chapter =
      COURSE_OUTLINE.find((c) => c.keyPoints.some((p) => p.term === term))?.title || ''
    items.push({
      id: `concept-${term}`,
      text: `「${term}」我总记混，能用一个具体例子讲讲它到底在说什么吗？`,
      reason: `你在自测里这个词累计错了 ${times} 次，值得先把定义掰开`,
      chapter,
    })
  }

  // 2. 正确率最低的章节
  const weak = [...persona.masteryList]
    .filter((m) => m.total >= 3 && m.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy)[0]
  if (weak) {
    items.push({
      id: `weak-${weak.chapter}`,
      text: `用 5 道题测一下「${weak.short}」，看看我到底卡在哪`,
      reason: `这一章自测正确率 ${weak.accuracy}%（${weak.correct}/${weak.total}）`,
      chapter: weak.chapter,
      to: { path: '/app/selftest', query: { chapters: weak.chapter, count: 5 } },
    })
  }

  // 3. 已开讲但零覆盖的章节
  const untouched = persona.masteryList.find(
    (m) => m.practiceCount === 0 && m.total === 0 && chapterProgress(m.chapter) > 0,
  )
  if (untouched) {
    items.push({
      id: `zero-${untouched.chapter}`,
      text: `「${untouched.short}」已经讲了一部分，我还没练过，先从哪里入手？`,
      reason: `本章进度 ${chapterProgress(untouched.chapter)}%，但练习与自测都是 0`,
      chapter: untouched.chapter,
    })
  }

  // 4. 当前章节：速查表
  if (currentChapter) {
    const short = currentChapter.replace(/^第\d+章\s*/, '')
    items.push({
      id: `cheatsheet-${currentChapter}`,
      text: `把「${short}」整理成一页考前速查表`,
      reason: '本周正在讲这一章，趁热整理比考前突击省时间',
      chapter: currentChapter,
      to: { path: '/app/cheatsheet', query: { chapters: currentChapter } },
    })
  }

  // 5. 兜底：固定但好用的入门问题
  if (items.length < 3) {
    items.push(
      {
        id: 'fallback-1',
        text: '什么是有限理性决策？它和完全理性有什么区别？',
        reason: '第 3 章的高频易混点，先用一个问题建立框架',
        chapter: '第3章 决策与计划',
      },
      {
        id: 'fallback-2',
        text: '赫茨伯格双因素理论里，工资为什么不算激励因素？',
        reason: '第 5 章最容易记反的一处',
        chapter: '第5章 领导与激励',
      },
    )
  }

  return items.slice(0, 3)
}

/** 带缓存的入口：同一天、同一学习状态下返回同一组推荐 */
export function getDailyRecommendations(persona, currentChapter = '') {
  const cached = loadCache(persona)
  if (cached) return cached
  const list = buildRecommendations(persona, currentChapter)
  saveCache(persona, list)
  return list
}

/** 测试/演示用：清掉今日缓存 */
export function clearRecommendCache() {
  try {
    const keys = []
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith(`${CACHE_PREFIX}${todayKey()}`)) keys.push(k)
    }
    keys.forEach((k) => window.localStorage.removeItem(k))
  } catch {
    // 忽略
  }
}
