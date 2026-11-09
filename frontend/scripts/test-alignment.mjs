#!/usr/bin/env node
/**
 * test-alignment.mjs —— 三大诊断改进回归测试（2026-11-08）。
 * 运行：npm run test:alignment
 *
 * 对应改进报告 docs/release/IMPROVEMENT-REPORT-2026-11-08.md：
 * A. illustrationScenes：场景注册表 / 关键词对齐（诊断二）
 * B. board.js 新块归一化：chart / columns / illustration（诊断一+二）
 * C. slideAdapter 新映射：image→illustration、src 直映射、chart→chart、
 *    多栏版面识别（诊断一+二）
 * D. sceneGenerator：widget-config → simulation 块（诊断一 F1.2）
 * E. tween：补间基元（诊断三 F3.1）
 *
 * 硬规则：所有被 import 的模块必须可用相对导入在 node 直跑。
 */
import assert from 'node:assert/strict'

import {
  ILLUSTRATION_SCENE_IDS,
  ILLUSTRATION_SCENES,
  illustrationScene,
  matchIllustrationScene,
} from '../src/utils/illustrationScenes.js'
import { normalizeBoardLesson } from '../src/utils/board.js'
import { slideElementsToLesson } from '../src/api/openmaic/slideAdapter.js'
import { widgetConfigToLesson } from '../src/api/openmaic/sceneGenerator.js'
import { tween, EASINGS } from '../src/utils/tween.js'

let passed = 0
const failures = []
function test(name, fn) {
  try {
    fn()
    passed += 1
  } catch (error) {
    failures.push({ name, error })
    console.error(`✗ ${name}\n  ${error.message}`)
  }
}

// ─────────────────────────── A. 场景注册表 ───────────────────────────

test('A1 注册表 12 个场景，id 唯一且字段完整', () => {
  assert.equal(ILLUSTRATION_SCENES.length, 12)
  assert.equal(new Set(ILLUSTRATION_SCENE_IDS).size, 12)
  for (const scene of ILLUSTRATION_SCENES) {
    assert.ok(scene.id && scene.label && scene.hint, `${scene.id} 字段缺失`)
    assert.ok(scene.keywords instanceof RegExp, `${scene.id} 缺关键词`)
    assert.equal(illustrationScene(scene.id)?.id, scene.id)
  }
  assert.equal(illustrationScene('not-exist'), null)
})

test('A2 关键词对齐：火箭/供需/PDCA/平方根各就各位', () => {
  assert.equal(matchIllustrationScene('一张火箭发射升空的照片')?.id, 'rocket-launch')
  assert.equal(matchIllustrationScene('市场需求与供给的均衡交点')?.id, 'supply-demand')
  assert.equal(matchIllustrationScene('PDCA 循环：计划执行检查改进')?.id, 'pdca-cycle')
  assert.equal(matchIllustrationScene('边长 a 的正方形，面积等于 a 的平方，开平方')?.id, 'square-root')
  assert.equal(matchIllustrationScene('城市天际线下的组织')?.id, 'city-skyline')
})

test('A2b 学科场景对齐（T-23）：时间轴/区域/流程/图纸', () => {
  assert.equal(matchIllustrationScene('中国近代史大事年表：从鸦片战争到辛亥革命')?.id, 'timeline')
  assert.equal(matchIllustrationScene('长江流域的地形与气候分布')?.id, 'map-region')
  assert.equal(matchIllustrationScene('生产线各工序的流转与上下游衔接')?.id, 'pipeline')
  assert.equal(matchIllustrationScene('查看装配图的结构尺寸与公差标注')?.id, 'blueprint')
})

test('A3 无命中返回 null；数组信号拍平；空文本安全', () => {
  assert.equal(matchIllustrationScene('完全无关的一段话'), null)
  assert.equal(matchIllustrationScene(''), null)
  assert.equal(matchIllustrationScene(), null)
  assert.equal(matchIllustrationScene(['火箭', '发射'])?.id, 'rocket-launch')
})

// ─────────────────────────── B. board.js 新块归一化 ───────────────────────────

test('B1 chart：结构化数值通过；无数值/空标签拒绝', () => {
  const lesson = normalizeBoardLesson({
    blocks: [
      { type: 'chart', kind: 'bar', labels: ['Q1', 'Q2'], series: [{ name: 'A', values: [1, 2] }] },
    ],
  })
  const chart = lesson.blocks.find((block) => block.type === 'chart')
  assert.ok(chart, 'chart 块应存在')
  assert.equal(chart.kind, 'bar')
  assert.deepEqual(chart.labels, ['Q1', 'Q2'])
  assert.deepEqual(chart.series, [{ name: 'A', values: [1, 2] }])

  // kind 非法回落 bar
  const fallback = normalizeBoardLesson({
    blocks: [{ type: 'chart', kind: 'radar', labels: ['a', 'b'], series: [{ name: 's', values: [1, 2] }] }],
  })
  assert.equal(fallback.blocks.find((block) => block.type === 'chart').kind, 'bar')

  // 序列不足 2 个数值 / 标签不足 2 个 → 拒绝（无空图表占位）
  assert.equal(
    normalizeBoardLesson({ blocks: [{ type: 'chart', labels: ['a', 'b'], series: [{ name: 's', values: [1] }] }] }),
    null,
  )
  assert.equal(
    normalizeBoardLesson({ blocks: [{ type: 'chart', labels: ['a'], series: [{ name: 's', values: [1, 2] }] }] }),
    null,
  )
})

test('B2 columns：2–3 栏通过；单栏拒绝；heading 可缺省', () => {
  const lesson = normalizeBoardLesson({
    blocks: [
      {
        type: 'columns',
        title: '三种计划',
        columns: [
          { heading: '战略', items: ['三到五年'] },
          { heading: '战术', items: ['一年'] },
          { items: ['班组级'] },
        ],
      },
    ],
  })
  const columns = lesson.blocks.find((block) => block.type === 'columns')
  assert.ok(columns)
  assert.equal(columns.columns.length, 3)
  assert.equal(columns.columns[2].heading, '')
  assert.equal(
    normalizeBoardLesson({ blocks: [{ type: 'columns', columns: [{ items: ['only'] }] }] }),
    null,
    '单栏不构成 columns 块',
  )
})

test('B3 illustration：scene 白名单强校验', () => {
  const lesson = normalizeBoardLesson({
    blocks: [{ type: 'illustration', scene: 'rocket-launch', title: '启程', caption: '图示' }],
  })
  const illustration = lesson.blocks.find((block) => block.type === 'illustration')
  assert.equal(illustration.scene, 'rocket-launch')
  assert.equal(illustration.title, '启程')
  // 未注册 scene（含图片 URL / prompt 字符串）一律拒绝——契约上杜绝外链图
  assert.equal(
    normalizeBoardLesson({ blocks: [{ type: 'illustration', scene: 'https://x.com/a.png' }] }),
    null,
  )
  assert.equal(
    normalizeBoardLesson({ blocks: [{ type: 'illustration', scene: 'a rocket launching' }] }),
    null,
  )
})

// ─────────────────────────── C. slideAdapter 新映射 ───────────────────────────

test('C1 image → illustration：mediaGenerations prompt 对齐', () => {
  const lesson = slideElementsToLesson(
    [
      { id: 't1', type: 'text', left: 60, top: 50, width: 880, height: 60, content: '<p style="font-size:30px;">市场均衡</p>' },
      { id: 'img1', type: 'image', left: 620, top: 150, width: 300, height: 180, src: 'gen_img_1' },
      { id: 't2', type: 'text', left: 60, top: 150, width: 500, height: 60, content: '<p>• 需求随价格上升而下降</p>' },
    ],
    {
      title: '市场均衡',
      keyPoints: ['供需交点'],
      mediaGenerations: [
        { type: 'image', prompt: '供给与需求曲线相交的示意图', elementId: 'img1' },
      ],
    },
  )
  assert.ok(lesson)
  const illustration = lesson.blocks.find((block) => block.type === 'illustration')
  assert.ok(illustration, '对齐场景的 image 应产出 illustration 块')
  assert.equal(illustration.scene, 'supply-demand')
  assert.equal(lesson.dropped.media, 0, '已映射图片不计入丢弃')
  assert.ok(illustration.caption.includes('供给与需求'), 'caption 应带出图片 prompt')
})

test('C2 image src 直映射（轻量媒体契约）+ 未对齐仍计数', () => {
  const lesson = slideElementsToLesson(
    [
      { id: 't1', type: 'text', left: 60, top: 50, width: 880, height: 60, content: '<p style="font-size:30px;">课程导入</p>' },
      { id: 'img1', type: 'image', left: 620, top: 150, width: 300, height: 170, src: 'rocket-launch' },
      { id: 'img2', type: 'image', left: 620, top: 340, width: 300, height: 170, src: 'gen_img_2' },
      { id: 't2', type: 'text', left: 60, top: 150, width: 500, height: 60, content: '<p>• 本课目标</p>' },
    ],
    { title: '导入', keyPoints: [] },
  )
  assert.ok(lesson)
  const illustrations = lesson.blocks.filter((block) => block.type === 'illustration')
  assert.equal(illustrations.length, 1)
  assert.equal(illustrations[0].scene, 'rocket-launch')
  assert.equal(lesson.dropped.media, 1, '对齐不了的图片仍丢弃并计数')
})

test('C3 chart 元素 → chart 块（不再降级为表格）+ chartType 映射', () => {
  const lesson = slideElementsToLesson(
    [
      { id: 't1', type: 'text', left: 60, top: 50, width: 880, height: 60, content: '<p style="font-size:30px;">完成率对比</p>' },
      {
        id: 'c1', type: 'chart', left: 60, top: 140, width: 600, height: 300, chartType: 'column',
        data: { labels: ['一季度', '二季度'], legends: ['方案A'], series: [[62, 71]] },
      },
      {
        id: 'c2', type: 'chart', left: 60, top: 460, width: 600, height: 90, chartType: 'pie',
        data: { labels: ['甲', '乙'], legends: ['占比'], series: [[60, 40]] },
      },
    ],
    { title: '完成率对比', keyPoints: [] },
  )
  assert.ok(lesson)
  const charts = lesson.blocks.filter((block) => block.type === 'chart')
  assert.equal(charts.length, 2)
  assert.equal(charts[0].kind, 'bar', 'column 映射为 bar')
  assert.equal(charts[1].kind, 'pie')
  assert.deepEqual(charts[0].labels, ['一季度', '二季度'])
  assert.equal(charts[0].series[0].name, '方案A')
  assert.equal(lesson.dropped.chart, 0)
  // 无数值序列的 chart 仍丢弃计数（补一行正文保证 lesson 非空可断言）
  const bad = slideElementsToLesson(
    [
      { id: 't1', type: 'text', left: 60, top: 50, width: 880, height: 60, content: '<p style="font-size:30px;">空图</p>' },
      { id: 'b1', type: 'text', left: 60, top: 130, width: 880, height: 90, content: '<p>图表缺少数值序列时整块丢弃，其余文本照常成块。</p>' },
      { id: 'c', type: 'chart', left: 60, top: 240, width: 300, height: 200, chartType: 'line', data: { labels: ['a'], legends: [], series: [] } },
    ],
    { title: '空图', keyPoints: [] },
  )
  assert.ok(bad, '补正文后 lesson 不应为空')
  assert.equal(bad.dropped.chart, 1)
  assert.equal(bad.blocks.filter((block) => block.type === 'chart').length, 0, '无效 chart 不得产出块')
})

test('C4 多栏版面：三栏卡片保留为 columns；通栏文本不误判', () => {
  const lesson = slideElementsToLesson(
    [
      { id: 't1', type: 'text', left: 60, top: 40, width: 880, height: 70, content: '<p style="font-size:32px;">三种计划对着看</p>' },
      // 三栏：每栏 heading + 两行正文（宽 260px，未超 560 上限）
      { id: 'c1h', type: 'text', left: 60, top: 140, width: 260, height: 30, content: '<p>核心问题</p>' },
      { id: 'c1b', type: 'text', left: 60, top: 175, width: 260, height: 90, content: '<p>计划到底解决什么不确定性</p><p>没有目标就没有计划</p>' },
      { id: 'c2h', type: 'text', left: 370, top: 140, width: 260, height: 30, content: '<p>关键想象</p>' },
      { id: 'c2b', type: 'text', left: 370, top: 175, width: 260, height: 90, content: '<p>把三到五年的方向讲清楚</p><p>再分解到每一年</p>' },
      { id: 'c3h', type: 'text', left: 680, top: 140, width: 260, height: 30, content: '<p>课程目标</p>' },
      { id: 'c3b', type: 'text', left: 680, top: 175, width: 260, height: 90, content: '<p>能区分三种计划的层级</p><p>能判断适用条件</p>' },
    ],
    { title: '三种计划', keyPoints: ['计划类型'] },
  )
  assert.ok(lesson)
  const columns = lesson.blocks.find((block) => block.type === 'columns')
  assert.ok(columns, '三栏卡片应产出 columns 块')
  assert.equal(columns.columns.length, 3)
  assert.equal(columns.columns[0].heading, '核心问题')
  assert.ok(columns.columns[0].items.length >= 2)
  // 分栏消费了正文，不应再出现重复的 outline 兜底
  assert.ok(!lesson.dropped.outlineFallback, '有 columns 时不用 keyPoints 兜底路线图')
})

test('C5 单栏宽文本 + 定义句不误判为 columns（E1 契约保持）', () => {
  const lesson = slideElementsToLesson(
    [
      { id: 't1', type: 'text', left: 60, top: 50, width: 880, height: 76, content: '<p style="font-size:32px;"><strong>计划的类型</strong></p>' },
      {
        id: 't2', type: 'text', left: 60, top: 150, width: 880, height: 130,
        content: '<p style="font-size:18px;">• 战略计划：确定长期方向</p><p style="font-size:18px;">• 战术计划：分解年度目标</p>',
      },
      { id: 't3', type: 'text', left: 60, top: 320, width: 880, height: 90, content: '<p style="font-size:20px;">计划：对未来行动的事先安排</p>' },
    ],
    { keyPoints: ['计划的类型'], title: '计划的类型' },
  )
  assert.ok(lesson)
  assert.ok(!lesson.blocks.some((block) => block.type === 'columns'), '通栏版面不产出 columns')
  const definition = lesson.blocks.find((block) => block.type === 'definition')
  assert.equal(definition.term, '计划', '定义句仍走 definition 通道')
})

// ─────────────────────────── D. widget-config → simulation ───────────────────────────

test('D1 数学 widget（平方根）命中 square-root 模型补交互块', () => {
  const built = widgetConfigToLesson(
    {
      type: 'simulation',
      concept: '平方根',
      description: '用面积模型理解开平方：边长 a 的正方形面积是 a²',
      variables: [
        { name: 'a', label: '边长', min: 1, max: 16, default: 5, unit: '' },
        { name: 'b', label: '对照点', min: -8, max: 8, default: -2 },
      ],
      presets: [{ name: '完全平方数', variables: { a: 9, b: -3 } }],
    },
    { title: '平方根', keyPoints: ['开平方的几何含义'] },
  )
  assert.ok(built)
  const types = built.lesson.blocks.map((block) => block.type)
  assert.ok(types.includes('definition'))
  assert.ok(types.includes('table'), '变量仍映射为参数表（既有契约）')
  const simulation = built.lesson.blocks.find((block) => block.type === 'simulation')
  assert.ok(simulation, '应补 simulation 块（诊断一 F1.2）')
  assert.equal(simulation.model, 'square-root', '平方根概念命中专用模型而非泛化 number-line')
  assert.equal(simulation.params.a, 5, 'widget 变量默认值映射到模型参数')
  assert.equal(simulation.linkConcept, '平方根')
})

test('D2 无注册模型命中的 widget 不硬造 simulation（抛体运动）', () => {
  const built = widgetConfigToLesson(
    {
      type: 'simulation',
      concept: '抛体运动',
      description: '研究角度与初速度对射程的影响',
      variables: [
        { name: 'angle', label: '发射角', min: 0, max: 90, default: 45, unit: '°' },
        { name: 'velocity', label: '初速度', min: 5, max: 40, default: 20, unit: 'm/s' },
      ],
      presets: [],
    },
    { title: '抛体运动', keyPoints: ['射程'] },
  )
  assert.ok(built)
  assert.ok(
    !built.lesson.blocks.some((block) => block.type === 'simulation'),
    '注册表外概念不得伪造模型 id',
  )
})

// ─────────────────────────── E. tween 补间基元 ───────────────────────────

test('E1 确定性帧驱动：起止值/中间插值/完成回调', () => {
  const frames = []
  const scheduler = (callback) => {
    frames.push(callback)
    return frames.length
  }
  let clock = 1000
  const updates = []
  let completed = null
  const handle = tween({
    from: 0,
    to: 10,
    duration: 100,
    easing: 'easeOutCubic',
    scheduler,
    now: () => clock,
    onUpdate: (value) => updates.push(Math.round(value * 100) / 100),
    onComplete: (value) => {
      completed = value
    },
  })
  clock = 1050
  frames.shift()()
  assert.equal(updates.length, 1)
  // easeOutCubic(0.5) = 1-(1-0.5)^3 = 0.875 → 0 + 10×0.875 = 8.75
  assert.equal(updates[0], 8.75, `t=0.5  easeOutCubic 应=8.75，实际 ${updates[0]}`)
  clock = 1100
  frames.shift()()
  assert.equal(completed, 10, '结束必须精确落在 to')
  assert.equal(frames.length, 0, '完成后不再排帧')

  handle.cancel() // 幂等，不抛错
})

test('E2 duration<=0 或 from===to 同步落值；取消后不再回调', () => {
  let calls = 0
  tween({ from: 3, to: 3, duration: 100, onUpdate: () => (calls += 1) })
  assert.equal(calls, 1, '同值应同步落一次')
  calls = 0
  tween({ from: 0, to: 5, duration: 0, onUpdate: () => (calls += 1) })
  assert.equal(calls, 1, '零时长同步落值')

  const frames = []
  let afterCancel = 0
  const handle = tween({
    from: 0,
    to: 1,
    duration: 100,
    scheduler: (callback) => frames.push(callback),
    onUpdate: () => (afterCancel += 1),
  })
  handle.cancel()
  frames.forEach((frame) => frame())
  assert.equal(afterCancel, 0, '取消后回调必须静默')
})

test('E3 EASINGS 齐全且端点正确', () => {
  for (const [name, ease] of Object.entries(EASINGS)) {
    assert.ok(Math.abs(ease(0)) < 1e-9, `${name}(0) 应为 0`)
    assert.ok(Math.abs(ease(1) - 1) < 1e-9, `${name}(1) 应为 1`)
  }
})

console.log(`\n结果：${passed} 通过，${failed_count(failures)} 失败`)
function failed_count(list) {
  return list.length
}
if (failures.length > 0) {
  failures.forEach(({ name, error }) => console.error(`✗ ${name}\n  ${error.stack}`))
  process.exit(1)
}
