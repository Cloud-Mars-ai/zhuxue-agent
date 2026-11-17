/**
 * rationalReplica/index.js — 有理数「视频复刻」课程数据总装
 *
 * 输入：part1–part4 的章节定义（authoring 格式）
 *   { id, no, title, steps: [{ say, add?: 元素[], drop?: id[] }] }
 * 输出：播放器消费的 chapters
 *   [{ id, no, title, steps: [{ say, scene: 元素[] }] }]
 *   scene 为累积式：每步全量列出当前可见元素（ReplicaStage 按 id diff 做动画）
 */
import part1 from './part1.js'
import part2 from './part2.js'
import part3 from './part3.js'
import part4 from './part4.js'

/**
 * 把 authoring 格式编译成累积 scene。
 * - add：插入或更新元素（同 id 更新时保持原顺序，舞台不重播入场动画）
 * - drop：移除元素（舞台播退场动画）
 */
function compileChapter(raw) {
  const live = new Map()
  const steps = []
  for (const st of raw.steps) {
    for (const id of st.drop || []) live.delete(id)
    for (const el of st.add || []) {
      if (!el || typeof el.id !== 'string' || !el.id) {
        throw new Error(`${raw.id}: 元素缺少 id（${JSON.stringify(el).slice(0, 60)}）`)
      }
      if (typeof el.type !== 'string' || !el.type) {
        throw new Error(`${raw.id}: 元素 ${el.id} 缺少 type`)
      }
      live.set(el.id, el)
    }
    steps.push({ say: st.say || '', scene: [...live.values()] })
  }
  return { id: raw.id, no: raw.no, title: raw.title, steps }
}

export const chapters = [...part1, ...part2, ...part3, ...part4].map(compileChapter)

export const totalSteps = chapters.reduce((n, ch) => n + ch.steps.length, 0)

export const chapterTitles = chapters.map((ch) => ({ id: ch.id, no: ch.no, title: ch.title }))

export default chapters
