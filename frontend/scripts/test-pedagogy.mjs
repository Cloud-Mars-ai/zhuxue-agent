#!/usr/bin/env node
/**
 * test-pedagogy.mjs —— 学科画像（Pedagogy Profile）回归测试（2026-11-09）。
 * 运行：npm run test:pedagogy
 *
 * 对应设计文档 docs/research/pedagogy-profile-design.md：
 * A. 域推断 inferPedagogyDomain：别名 / subject 精确 / 关键词打分 / general 回落
 * B. 资源域过滤：filterByPedagogy 语义（无标签=通用 / general=不过滤）+
 *    匹配侧（matchIllustrationSceneForDomain / matchSimulation domainId）
 * C. 提示词注入：pedagogyGuide / pedagogyIdentity 随域变化，general 空串
 * D. 新资源白名单：4 个 illustration 场景 + 2 个 simulation 模型过
 *    normalizeBoardLesson；参数 clamp
 * E. 管线接入：widgetConfigToLesson / slideElementsToLesson 的域参数；
 *    generateOpenmaicScene 的 sceneContext.pedagogyDomain（打桩 aiCall）
 *
 * 硬规则：所有被 import 的模块必须可用相对导入在 node 直跑。
 */
import assert from 'node:assert/strict'

import {
  GENERAL_PEDAGOGY,
  PEDAGOGY_DOMAINS,
  PEDAGOGY_DOMAIN_IDS,
  filterByPedagogy,
  inferPedagogyDomain,
  isGeneralPedagogy,
  pedagogyDomain,
  pedagogyGuide,
  pedagogyIdentity,
  resourceAllowedForDomain,
} from '../src/utils/pedagogyProfiles.js'
import {
  ILLUSTRATION_SCENES,
  ILLUSTRATION_SCENE_IDS,
  illustrationScene,
  matchIllustrationScene,
  matchIllustrationSceneForDomain,
} from '../src/utils/illustrationScenes.js'
import {
  SIMULATION_MODELS,
  buildSimulationBlock,
  clampParams,
  matchSimulation,
  simulationModel,
} from '../src/utils/knowledgeVisualization.js'
import { normalizeBoardLesson } from '../src/utils/board.js'
import { slideElementsToLesson } from '../src/api/openmaic/slideAdapter.js'
import { generateOpenmaicScene, widgetConfigToLesson } from '../src/api/openmaic/sceneGenerator.js'

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
async function testAsync(name, fn) {
  try {
    await fn()
    passed += 1
  } catch (error) {
    failures.push({ name, error })
    console.error(`✗ ${name}\n  ${error.message}`)
  }
}

// ─────────────────────────── A. 域推断 ───────────────────────────

test('A1 五域注册表：id 唯一、字段完整、general 单独定义', () => {
  assert.equal(PEDAGOGY_DOMAINS.length, 5)
  assert.equal(new Set(PEDAGOGY_DOMAIN_IDS).size, 5)
  for (const domain of PEDAGOGY_DOMAINS) {
    assert.ok(domain.id && domain.label && domain.paradigm && domain.blurb, `${domain.id} 字段缺失`)
    assert.ok(domain.sceneFlow && domain.pedagogy && domain.visualHint, `${domain.id} 缺策略文案`)
    assert.ok(Array.isArray(domain.subjects) && domain.subjects.length, `${domain.id} 缺学科清单`)
    assert.ok(Array.isArray(domain.blockBias) && domain.blockBias.length, `${domain.id} 缺积木偏好`)
    assert.equal(pedagogyDomain(domain.id)?.id, domain.id)
  }
  assert.equal(GENERAL_PEDAGOGY.id, 'general')
  assert.equal(pedagogyDomain('general'), null)
  assert.equal(pedagogyDomain('not-exist'), null)
  assert.equal(isGeneralPedagogy('general'), true)
  assert.equal(isGeneralPedagogy(''), true)
  assert.equal(isGeneralPedagogy('math-science'), false)
})

test('A2 domain 别名优先（最强信号，confidence=high）', () => {
  assert.equal(inferPedagogyDomain({ domain: 'math7' }).id, 'math-science')
  assert.equal(inferPedagogyDomain({ domain: 'management' }).id, 'social-science')
  assert.equal(inferPedagogyDomain({ domain: 'history' }).id, 'humanities')
  assert.equal(inferPedagogyDomain({ domain: 'cs' }).id, 'engineering')
  assert.equal(inferPedagogyDomain({ domain: 'language' }).id, 'language-arts')
  assert.equal(inferPedagogyDomain({ domain: 'math7' }).confidence, 'high')
  // 别名压过正文：domain=management 但正文全是数学词，仍归经管
  const aliasWins = inferPedagogyDomain({ domain: 'management', objective: '方程与函数推导' })
  assert.equal(aliasWins.id, 'social-science')
})

test('A3 subject 精确命中域内学科名', () => {
  assert.equal(inferPedagogyDomain({ subject: '数学' }).id, 'math-science')
  assert.equal(inferPedagogyDomain({ subject: '初中历史' }).id, 'humanities')
  assert.equal(inferPedagogyDomain({ subject: '大学英语' }).id, 'language-arts')
  assert.equal(inferPedagogyDomain({ subject: '市场营销' }).id, 'social-science')
  assert.equal(inferPedagogyDomain({ subject: '机械设计基础' }).id, 'engineering')
  assert.equal(inferPedagogyDomain({ subject: '数学' }).confidence, 'high')
})

test('A4 关键词打分：正文主导时按域归类', () => {
  assert.equal(
    inferPedagogyDomain({ objective: '掌握一元二次方程的解法与判别式，理解函数图像的变化' }).id,
    'math-science',
  )
  assert.equal(
    inferPedagogyDomain({ objective: '梳理鸦片战争到辛亥革命的朝代沿革与因果' }).id,
    'humanities',
  )
  assert.equal(
    inferPedagogyDomain({ objective: '分析市场供需与企业战略决策' }).id,
    'social-science',
  )
  assert.equal(
    inferPedagogyDomain({ objective: '设计一条流水线的工序流程并调试产能瓶颈' }).id,
    'engineering',
  )
  assert.equal(
    inferPedagogyDomain({ objective: '通过范文归纳语法规则并写作运用' }).id,
    'language-arts',
  )
})

test('A5 全部落空回落 general；空输入安全', () => {
  const fallback = inferPedagogyDomain({ subject: '刺绣', objective: '学习基础针法' })
  assert.equal(fallback.id, 'general')
  assert.equal(fallback.confidence, 'low')
  assert.equal(inferPedagogyDomain().id, 'general')
  assert.equal(inferPedagogyDomain({}).id, 'general')
  assert.equal(inferPedagogyDomain({ subject: '', objective: '', materialText: '' }).id, 'general')
})

test('A6 材料文本参与推断（场景阶段信号）', () => {
  const fromMaterial = inferPedagogyDomain({
    objective: '本课导读',
    materialText: '【第二章】鸦片战争(1840)、洋务运动(1861)、甲午战争(1894)：近代化的曲折历程……',
  })
  assert.equal(fromMaterial.id, 'humanities')
})

// ─────────────────────────── B. 资源域过滤 ───────────────────────────

test('B1 过滤语义：无标签=通用；非空=仅声明域', () => {
  // 通用场景任何域可用
  for (const domainId of PEDAGOGY_DOMAIN_IDS) {
    assert.equal(resourceAllowedForDomain(illustrationScene('rocket-launch'), domainId), true)
    assert.equal(resourceAllowedForDomain(illustrationScene('growth-chart'), domainId), true)
    assert.equal(resourceAllowedForDomain(illustrationScene('balance-scale'), domainId), true)
  }
  // 学科场景只进声明域
  assert.equal(resourceAllowedForDomain(illustrationScene('square-root'), 'math-science'), true)
  assert.equal(resourceAllowedForDomain(illustrationScene('square-root'), 'humanities'), false)
  assert.equal(resourceAllowedForDomain(illustrationScene('timeline'), 'humanities'), true)
  assert.equal(resourceAllowedForDomain(illustrationScene('timeline'), 'math-science'), false)
  assert.equal(resourceAllowedForDomain(illustrationScene('blueprint'), 'engineering'), true)
  assert.equal(resourceAllowedForDomain(illustrationScene('blueprint'), 'social-science'), false)
  // general / 空域 = 不过滤
  assert.equal(resourceAllowedForDomain(illustrationScene('square-root'), 'general'), true)
  assert.equal(resourceAllowedForDomain(illustrationScene('square-root'), ''), true)
})

test('B2 filterByPedagogy：每域至少保留通用场景，general 全量', () => {
  assert.equal(filterByPedagogy(ILLUSTRATION_SCENES, 'general').length, ILLUSTRATION_SCENES.length)
  assert.equal(filterByPedagogy(ILLUSTRATION_SCENES, '').length, ILLUSTRATION_SCENES.length)
  for (const domainId of PEDAGOGY_DOMAIN_IDS) {
    const kept = filterByPedagogy(ILLUSTRATION_SCENES, domainId)
    assert.ok(kept.length >= 3, `${domainId} 过滤后应至少保留 3 个通用/本域场景`)
    assert.ok(
      kept.every((scene) => !scene.domains.length || scene.domains.includes(domainId)),
      `${domainId} 过滤结果不应含他域专属场景`,
    )
  }
  // 域清单精确性：square-root 只在 math-science 结果里
  assert.ok(filterByPedagogy(ILLUSTRATION_SCENES, 'math-science').some((s) => s.id === 'square-root'))
  assert.ok(!filterByPedagogy(ILLUSTRATION_SCENES, 'humanities').some((s) => s.id === 'square-root'))
  assert.deepEqual(filterByPedagogy(null, 'math-science'), [])
  assert.deepEqual(filterByPedagogy('not-array', 'math-science'), [])
})

test('B3 插图匹配按域过滤（matchIllustrationSceneForDomain）', () => {
  // 同一段历史文本：humanities 命中 timeline，engineering 域下 timeline 被过滤 → null
  assert.equal(
    matchIllustrationSceneForDomain('humanities', '中国近代史大事年表：从鸦片战争到辛亥革命')?.id,
    'timeline',
  )
  assert.equal(
    matchIllustrationSceneForDomain('engineering', '中国近代史大事年表：从鸦片战争到辛亥革命'),
    null,
  )
  // 数学文本：math-science 命中 square-root，humanities 域下被过滤 → null
  assert.equal(
    matchIllustrationSceneForDomain('math-science', '边长 a 的正方形，面积等于 a 的平方，开平方')?.id,
    'square-root',
  )
  assert.equal(
    matchIllustrationSceneForDomain('humanities', '边长 a 的正方形，面积等于 a 的平方，开平方'),
    null,
  )
  // general / 空域等价于不过滤（向后兼容原签名）
  assert.equal(
    matchIllustrationSceneForDomain('general', '中国近代史大事年表')?.id,
    matchIllustrationScene('中国近代史大事年表')?.id,
  )
  assert.equal(matchIllustrationSceneForDomain('', '中国近代史大事年表')?.id, 'timeline')
})

test('B4 交互模型匹配按域过滤（matchSimulation domainId）', () => {
  const history = { text: '鸦片战争时间排序', subject: '历史', stage: 'junior' }
  assert.equal(matchSimulation({ ...history, domainId: 'humanities' })?.model.id, 'timeline-order')
  assert.equal(matchSimulation({ ...history, domainId: 'math-science' }), null)
  assert.equal(matchSimulation({ ...history })?.model.id, 'timeline-order', '不传域=不过滤（向后兼容）')

  const physics = { text: '圆周运动与向心力', subject: '物理', stage: 'junior' }
  assert.equal(matchSimulation({ ...physics, domainId: 'math-science' })?.model.id, 'circular-motion')
  assert.equal(matchSimulation({ ...physics, domainId: 'humanities' }), null)

  const pipeline = { text: '流水线工序与产能瓶颈', subject: '管理', stage: 'senior' }
  assert.equal(matchSimulation({ ...pipeline, domainId: 'social-science' })?.model.id, 'pipeline-flow')
  assert.equal(matchSimulation({ ...pipeline, domainId: 'humanities' }), null)
})

// ─────────────────────────── C. 提示词注入 ───────────────────────────

test('C1 pedagogyGuide：随域变化，general 空串', () => {
  assert.equal(pedagogyGuide('general'), '')
  assert.equal(pedagogyGuide(''), '')
  assert.equal(pedagogyGuide('not-exist'), '')
  const math = pedagogyGuide('math-science')
  assert.ok(math.includes('演绎探究'), '数理域应声明演绎探究范式')
  assert.ok(math.includes('推导') && math.includes('交互模型'), '数理策略应含推导与交互')
  const history = pedagogyGuide('humanities')
  assert.ok(history.includes('叙事论辩'), '人文域应声明叙事论辩范式')
  assert.ok(history.includes('史料') && history.includes('时间轴'), '人文策略应含史料与时间轴')
  assert.notEqual(math, history, '不同域的策略文案必须不同')
  // 五域两两不同
  const guides = PEDAGOGY_DOMAIN_IDS.map((id) => pedagogyGuide(id))
  assert.equal(new Set(guides).size, 5)
})

test('C2 pedagogyIdentity：随域变化，general 空串', () => {
  assert.equal(pedagogyIdentity('general'), '')
  assert.ok(pedagogyIdentity('math-science').includes('数理科学'))
  assert.ok(pedagogyIdentity('engineering').includes('工程技术'))
  const identities = PEDAGOGY_DOMAIN_IDS.map((id) => pedagogyIdentity(id))
  assert.equal(new Set(identities).size, 5)
  for (const identity of identities) assert.ok(identity.length > 10)
})

// ─────────────────────────── D. 新资源白名单 ───────────────────────────

test('D1 四个新 illustration 场景：注册在册且过 board 白名单', () => {
  for (const id of ['timeline', 'map-region', 'pipeline', 'blueprint']) {
    assert.ok(ILLUSTRATION_SCENE_IDS.includes(id), `${id} 应在场景注册表`)
    const lesson = normalizeBoardLesson({
      blocks: [{ type: 'illustration', scene: id, title: '图示' }],
    })
    assert.ok(lesson.blocks.some((block) => block.type === 'illustration' && block.scene === id))
  }
  // 未注册 id 仍被拒（白名单不松）：唯一块被滤掉 → 整个 lesson 为 null
  assert.equal(
    normalizeBoardLesson({ blocks: [{ type: 'illustration', scene: 'not-exist' }] }),
    null,
  )
})

test('D2 两个新 simulation 模型：注册在册且过 board 归一化', () => {
  for (const id of ['timeline-order', 'pipeline-flow']) {
    const model = simulationModel(id)
    assert.ok(model, `${id} 应在模型注册表`)
    assert.ok(SIMULATION_MODELS.some((item) => item.id === id))
    const block = buildSimulationBlock({
      model,
      title: `动手看：${model.label}`,
      params: {},
      observe: ['观察读数变化'],
      linkConcept: model.label,
      caption: '调节参数，观察结果。',
    })
    assert.ok(block, `${id} 应能构造 simulation 块`)
    const lesson = normalizeBoardLesson({ blocks: [block] })
    const normalized = lesson.blocks.find((item) => item.type === 'simulation')
    assert.equal(normalized?.model, id)
  }
})

test('D3 参数 clamp：越界收敛回模型声明范围；空 params 模型安全', () => {
  const pipeline = simulationModel('pipeline-flow')
  const clamped = clampParams(pipeline, { rate: 200, buffer: 999 })
  assert.equal(clamped.rate, 100, 'rate 超上限应收敛到 100')
  assert.equal(clamped.buffer, 50, 'buffer 超上限应收敛到 50')
  assert.deepEqual(clampParams(pipeline, {}), { rate: 60, buffer: 20 }, '缺省值回落模型默认')
  const timeline = simulationModel('timeline-order')
  assert.deepEqual(clampParams(timeline, { anything: 1 }), {}, '无参数模型 clamp 结果应为空对象')
  assert.deepEqual(clampParams(timeline, null), {})
})

// ─────────────────────────── E. 管线接入 ───────────────────────────

test('E1 widgetConfigToLesson：interactive 模型按域过滤', () => {
  const config = {
    concept: '中国近代史',
    description: '梳理鸦片战争等事件的先后顺序与因果链',
    variables: [{ name: 'lens', label: '观察视角', min: 0, max: 10, default: 5 }],
    presets: [],
  }
  const outline = { title: '中国近代史', keyPoints: ['鸦片战争', '洋务运动'] }

  const humanities = widgetConfigToLesson(config, outline, { pedagogyDomain: 'humanities' })
  const sim = humanities.lesson.blocks.find((block) => block.type === 'simulation')
  assert.ok(sim, '人文域应点亮历史时序模型')
  assert.equal(sim.model, 'timeline-order')

  const mathScience = widgetConfigToLesson(config, outline, { pedagogyDomain: 'math-science' })
  assert.ok(
    !mathScience.lesson.blocks.some((block) => block.type === 'simulation'),
    '数理域下历史内容不应误配数学模型',
  )

  // 不传域（旧调用方）：行为不变，仍按关键词匹配
  const legacy = widgetConfigToLesson(config, outline, {})
  assert.ok(legacy.lesson.blocks.some((block) => block.type === 'simulation'), '向后兼容：不过滤')
})

test('E2 slideElementsToLesson：src 直映射过域校验', () => {
  const elements = [
    { id: 't1', type: 'text', left: 60, top: 50, width: 880, height: 60, content: '<p style="font-size:30px;">近代中国的抗争</p>' },
    { id: 't2', type: 'text', left: 60, top: 160, width: 880, height: 60, content: '<p style="font-size:18px;">• 鸦片战争</p>' },
    { id: 't3', type: 'text', left: 60, top: 260, width: 880, height: 60, content: '<p style="font-size:18px;">条约：战后签订的不平等条款</p>' },
    { id: 'img', type: 'image', left: 60, top: 360, width: 400, height: 200, src: 'square-root' },
  ]
  const keyPoints = ['鸦片战争', '洋务运动']

  // 数学场景 id 在人文域下不成立：src 被域校验拦下，prompt 也无命中 → 丢弃计数
  const blocked = slideElementsToLesson(elements, { keyPoints, title: '近代中国的抗争', pedagogyDomain: 'humanities' })
  assert.ok(blocked, '其余块足够时仍应产出 lesson')
  assert.equal(blocked.dropped.media, 1, '域外 src 应计丢弃')
  assert.ok(!blocked.blocks.some((block) => block.type === 'illustration'), '域外 src 不应产出插图')

  // 数理域下 src 直映射成立
  const allowed = slideElementsToLesson(elements, { keyPoints, title: '近代中国的抗争', pedagogyDomain: 'math-science' })
  const illustration = allowed.blocks.find((block) => block.type === 'illustration')
  assert.equal(illustration?.scene, 'square-root')
  assert.equal(allowed.dropped.media, 0)
})

test('E3 slideElementsToLesson：image prompt 匹配按域过滤', () => {
  const base = [
    { id: 't1', type: 'text', left: 60, top: 50, width: 880, height: 60, content: '<p style="font-size:30px;">近代化的历程</p>' },
    { id: 't2', type: 'text', left: 60, top: 160, width: 880, height: 60, content: '<p style="font-size:18px;">• 洋务运动</p>' },
    { id: 't3', type: 'text', left: 60, top: 260, width: 880, height: 60, content: '<p style="font-size:18px;">历程：近代化探索的先后顺序</p>' },
  ]
  const image = {
    id: 'img', type: 'image', left: 60, top: 360, width: 400, height: 200,
    alt: '中国近代史大事年表：鸦片战争到辛亥革命的时间轴',
  }
  const keyPoints = ['鸦片战争']

  const humanities = slideElementsToLesson([...base, image], { keyPoints, title: '近代化的历程', pedagogyDomain: 'humanities' })
  assert.equal(humanities.blocks.find((block) => block.type === 'illustration')?.scene, 'timeline')

  const engineering = slideElementsToLesson([...base, image], { keyPoints, title: '近代化的历程', pedagogyDomain: 'engineering' })
  assert.equal(engineering.dropped.media, 1, '工程域下时间轴被过滤且无其他命中 → 丢弃')
  assert.ok(!engineering.blocks.some((block) => block.type === 'illustration'))

  // general / 不传域：不过滤，原行为
  const general = slideElementsToLesson([...base, image], { keyPoints, title: '近代化的历程' })
  assert.equal(general.blocks.find((block) => block.type === 'illustration')?.scene, 'timeline')
})

await testAsync('E4 generateOpenmaicScene：sceneContext.pedagogyDomain 驱动场景目录过滤', async () => {
  const slideJson = JSON.stringify({
    background: { type: 'solid', color: '#ffffff' },
    elements: [
      { id: 't1', type: 'text', left: 60, top: 50, width: 880, height: 76, content: '<p style="font-size:32px;">鸦片战争</p>' },
      { id: 't2', type: 'text', left: 60, top: 160, width: 880, height: 120, content: '<p style="font-size:18px;">• 背景</p><p style="font-size:18px;">• 影响</p>' },
      { id: 't3', type: 'text', left: 60, top: 320, width: 880, height: 80, content: '<p style="font-size:20px;">条约：战后签订的不平等条款</p>' },
    ],
  })

  // 人文域：目录给 timeline/map-region，不给 square-root
  let captured = ''
  const historyScene = await generateOpenmaicScene(
    { id: 's1', type: 'lecture', title: '鸦片战争', description: '近代史开端', keyPoints: ['背景', '影响'] },
    async (_system, user) => {
      captured = user
      return slideJson
    },
    { subject: '历史', chapter: '中国近代史' },
  )
  assert.equal(historyScene.kind, 'board')
  assert.ok(captured.includes('timeline｜时间轴'), '人文目录应含时间轴场景')
  assert.ok(!captured.includes('square-root'), '人文目录不应含平方根模型场景')

  // 数理域：目录给 square-root，不给 timeline
  captured = ''
  const mathScene = await generateOpenmaicScene(
    { id: 's2', type: 'lecture', title: '平方根', description: '算术平方根的几何含义', keyPoints: ['面积', '边长'] },
    async (_system, user) => {
      captured = user
      return slideJson
    },
    { subject: '数学', domain: 'math7', chapter: '第七章' },
  )
  assert.equal(mathScene.kind, 'board')
  assert.ok(captured.includes('square-root｜平方根面积模型'), '数理目录应含平方根场景')
  assert.ok(!captured.includes('timeline｜时间轴'), '数理目录不应含时间轴场景')

  // 未知学科（general）：目录不过滤，全量可见
  captured = ''
  const generalScene = await generateOpenmaicScene(
    { id: 's3', type: 'lecture', title: '插花艺术入门', description: '基础针法与构图', keyPoints: ['构图', '针法'] },
    async (_system, user) => {
      captured = user
      return slideJson
    },
    { subject: '刺绣', chapter: '第一章' },
  )
  assert.equal(generalScene.kind, 'board')
  assert.ok(captured.includes('timeline｜时间轴') && captured.includes('square-root'), 'general 目录应全量')
})

// ─────────────────────────── 汇总 ───────────────────────────

console.log(`\n学科画像测试：${passed} 通过，${failures.length} 失败`)
if (failures.length) {
  console.error('失败项：')
  for (const item of failures) console.error(`  - ${item.name}: ${item.error.message}`)
  process.exit(1)
}
