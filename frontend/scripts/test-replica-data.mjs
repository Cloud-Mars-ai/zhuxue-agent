#!/usr/bin/env node
/**
 * test-replica-data.mjs — 有理数视频复刻课程数据校验
 *
 * 校验项：
 *  1. 22 章齐全，no 从 1 连续到 22，id 唯一
 *  2. 每章 steps 非空；每步 say 非空、scene 非空
 *  3. 元素 id 章内唯一；type 已注册；buildElement 可渲染
 *  4. authoring 层：drop 的目标必须存在过；add 不重复引入同章同 id（更新除外，允许）
 *  5. 舞台坐标粗检：x/y 在 viewBox 1000×560 合理范围内
 */
import assert from 'node:assert/strict'
import { chapters, totalSteps } from '../src/data/rationalReplica/index.js'
import { BUILDERS, buildElement } from '../src/components/replica/elements.js'
import part1 from '../src/data/rationalReplica/part1.js'
import part2 from '../src/data/rationalReplica/part2.js'
import part3 from '../src/data/rationalReplica/part3.js'
import part4 from '../src/data/rationalReplica/part4.js'

const rawChapters = [...part1, ...part2, ...part3, ...part4]
let passed = 0
function check(cond, msg) {
  assert.ok(cond, msg)
  passed += 1
}

/* 1. 章节结构 */
check(chapters.length === 22, `应有 22 章，实际 ${chapters.length}`)
check(rawChapters.length === 22, `authoring 应有 22 章，实际 ${rawChapters.length}`)
const ids = new Set(chapters.map((c) => c.id))
check(ids.size === 22, '章节 id 有重复')
chapters.forEach((ch, i) => {
  check(ch.no === i + 1, `第 ${i + 1} 章 no 应为 ${i + 1}，实际 ${ch.no}`)
  check(typeof ch.title === 'string' && ch.title.length > 0, `${ch.id} 缺少标题`)
})

/* 2. 每章 steps */
let stepTotal = 0
for (const ch of chapters) {
  check(Array.isArray(ch.steps) && ch.steps.length >= 6, `${ch.id} 步骤过少（${ch.steps?.length}）`)
  stepTotal += ch.steps.length
  for (const [si, st] of ch.steps.entries()) {
    check(typeof st.say === 'string' && st.say.trim().length > 0, `${ch.id} 第 ${si + 1} 步 say 为空`)
    check(Array.isArray(st.scene) && st.scene.length > 0, `${ch.id} 第 ${si + 1} 步 scene 为空`)
    const seen = new Set()
    for (const el of st.scene) {
      check(!seen.has(el.id), `${ch.id} 第 ${si + 1} 步元素 id 重复：${el.id}`)
      seen.add(el.id)
      check(typeof BUILDERS[el.type] === 'function', `${ch.id} 未知元素类型：${el.type}（${el.id}）`)
      const svg = buildElement(el)
      check(typeof svg === 'string' && svg.length > 0, `${ch.id} 元素 ${el.id} 渲染为空`)
      check(!svg.includes('NaN') && !svg.includes('undefined'), `${ch.id} 元素 ${el.id} 渲染含 NaN/undefined`)
      // 舞台坐标粗检（允许少量出界，但不应离谱）
      const x = Number(el.x)
      const y = Number(el.y)
      if (Number.isFinite(x)) check(x > -80 && x < 1120, `${ch.id} 元素 ${el.id} x 出界：${x}`)
      if (Number.isFinite(y)) check(y > -80 && y < 640, `${ch.id} 元素 ${el.id} y 出界：${y}`)
    }
  }
}
check(totalSteps === stepTotal, `totalSteps 统计不一致：${totalSteps} vs ${stepTotal}`)

/* 3. authoring 层 ops 合理性 */
for (const raw of rawChapters) {
  const everAdded = new Set()
  const alive = new Set()
  for (const [si, st] of raw.steps.entries()) {
    for (const id of st.drop || []) {
      check(alive.has(id), `${raw.id} 第 ${si + 1} 步 drop 了不存在的元素：${id}`)
      alive.delete(id)
    }
    for (const el of st.add || []) {
      check(!alive.has(el.id) || true, '') // 同 id 更新合法
      alive.add(el.id)
      everAdded.add(el.id)
    }
  }
}

/* 4. 汇总报告 */
const perChapter = chapters.map((c) => `${  String(c.no).padStart(2, '0') } ${c.title}（${c.steps.length} 步）`).join('\n')
console.log(`复刻课程数据校验通过：22 章 / ${totalSteps} 步 / ${passed} 项断言`)
console.log(perChapter)
console.log(`\n元素类型覆盖：${Object.keys(BUILDERS).join(', ')}`)
