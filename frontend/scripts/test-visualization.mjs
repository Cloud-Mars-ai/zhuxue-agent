/**
 * 知识点可视化决策算法测试（npm run test:visualization）。
 * 覆盖：需求判定、学科匹配、参数收敛、block 契约、衔接兜底。
 */
import assert from 'node:assert/strict'
import {
  assessVisualizationNeed,
  matchSimulation,
  buildSimulationBlock,
  ensureSimulationBlock,
  clampParams,
  simulationModel,
  SIMULATION_MODELS,
} from '../src/utils/knowledgeVisualization.js'
import { normalizeBoardLesson, boardToContext } from '../src/utils/board.js'

let passed = 0
let failed = 0
const failures = []

function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`  ✓ ${name}`)
  } catch (error) {
    failed += 1
    failures.push({ name, error })
    console.log(`  ✗ ${name}\n    ${error.message}`)
  }
}

console.log('[1] 需求判定：力学概念应推荐交互')
test('向心力/圆周运动 → recommend', () => {
  const result = assessVisualizationNeed({
    text: '圆周运动中，向心力指向圆心；当速度增大时，所需向心力怎么变？',
    subject: '物理',
    stage: 'junior',
    keyPoints: ['向心力公式 F = mv²/r', '改变半径观察力的变化'],
  })
  assert.equal(result.level, 'recommend')
  assert.ok(result.score >= 60, `score=${result.score}`)
  assert.ok(result.needsInteraction)
  assert.ok(result.signals.some((signal) => signal.id === 'motion'))
})
test('三角形内角和 → recommend', () => {
  const result = assessVisualizationNeed({
    text: '三角形的内角和等于180°，拖动顶点观察三个角的变化',
    subject: '数学',
    stage: 'primary',
  })
  assert.equal(result.level, 'recommend')
})
test('一次函数 → recommend', () => {
  const result = assessVisualizationNeed({
    text: '一次函数 y = kx + b 的图像是一条直线，k 决定倾斜程度',
    subject: '数学',
    stage: 'junior',
  })
  assert.equal(result.level, 'recommend')
})

console.log('[2] 需求判定：无可视化信号应拒绝')
test('纯文科概念 → skip', () => {
  const result = assessVisualizationNeed({
    text: '古诗鉴赏要关注意象与情感，修辞手法包括比喻和对偶',
    subject: '语文',
    stage: 'junior',
  })
  assert.equal(result.level, 'skip')
  assert.ok(!result.needsInteraction)
})
test('管理学流程 → 不推荐（成人学段降权）', () => {
  const result = assessVisualizationNeed({
    text: '计划职能包括目标设定与方案选择，需要对照组织环境',
    subject: '经济管理',
    stage: 'adult',
  })
  assert.ok(['skip', 'optional'].includes(result.level), `level=${result.level}`)
})
test('高中力学仍可通过强信号（学段降权不误杀）', () => {
  const result = assessVisualizationNeed({
    text: '圆周运动向心力 速度 半径 加速度 受力分析 改变条件',
    subject: '物理',
    stage: 'senior',
  })
  assert.equal(result.level, 'recommend')
})

console.log('[3] 学科 × 概念 → 可视化形式匹配')
test('圆周运动 → circular-motion', () => {
  const matched = matchSimulation({
    text: '向心力与圆周运动，线速度和角速度的关系',
    subject: '物理',
    stage: 'junior',
  })
  assert.ok(matched)
  assert.equal(matched.model.id, 'circular-motion')
})
test('三角形 → geometry-triangle', () => {
  const matched = matchSimulation({
    text: '三角形的内角和与外角性质',
    subject: '数学',
    stage: 'primary',
  })
  assert.equal(matched.model.id, 'geometry-triangle')
})
test('一次函数 → linear-function', () => {
  const matched = matchSimulation({
    text: '一次函数 y=kx+b 的斜率和截距',
    subject: '数学',
    stage: 'junior',
  })
  assert.equal(matched.model.id, 'linear-function')
})
test('有理数 → number-line', () => {
  const matched = matchSimulation({
    text: '有理数在数轴上的表示，相反数与绝对值',
    subject: '数学',
    stage: 'primary',
  })
  assert.equal(matched.model.id, 'number-line')
})
test('分数 → fraction-parts', () => {
  const matched = matchSimulation({
    text: '分数的意义：几分之几，通分与约分',
    subject: '数学',
    stage: 'primary',
  })
  assert.equal(matched.model.id, 'fraction-parts')
})
test('学段过滤：number-line 不匹配高中', () => {
  const matched = matchSimulation({
    text: '有理数与数轴',
    subject: '数学',
    stage: 'senior',
  })
  if (matched) assert.notEqual(matched.model.id, 'number-line')
})
test('无信号文本 → null', () => {
  const matched = matchSimulation({ text: '今天天气很好，适合出门散步', subject: '语文' })
  assert.equal(matched, null)
})

console.log('[4] 参数收敛与模型查询')
test('clampParams 收敛越界值', () => {
  const model = simulationModel('circular-motion')
  const safe = clampParams(model, { radius: 9999, speed: -5, mass: 3 })
  assert.equal(safe.radius, 160)
  assert.equal(safe.speed, 0.5)
  assert.equal(safe.mass, 3)
})
test('clampParams 非数值回落默认值', () => {
  const model = simulationModel('linear-function')
  const safe = clampParams(model, { k: 'abc' })
  assert.equal(safe.k, 1)
  assert.equal(safe.b, 0)
})
test('未注册模型返回 null', () => {
  assert.equal(simulationModel('no-such-model'), null)
})
test('所有模型参数声明完整', () => {
  for (const model of SIMULATION_MODELS) {
    assert.ok(model.params.every((p) => p.min < p.max && p.step > 0), model.id)
    assert.ok(model.observe.length >= 2, model.id)
    assert.ok(model.stages.length, model.id)
  }
})

console.log('[5] simulation block 契约')
test('buildSimulationBlock 产出受控字段', () => {
  const block = buildSimulationBlock({
    model: 'circular-motion',
    title: '动手看：圆周运动与向心力',
    observe: ['把速度调到最大', '拉大半径'],
    linkConcept: '向心力',
  })
  assert.equal(block.type, 'simulation')
  assert.equal(block.model, 'circular-motion')
  assert.deepEqual(block.params, { radius: 90, speed: 4, mass: 2 })
  assert.equal(block.observe.length, 2)
  assert.equal(block.linkConcept, '向心力')
})
test('observe 缺省时回落模型默认任务', () => {
  const block = buildSimulationBlock({ model: 'number-line' })
  assert.ok(block.observe.length >= 2)
})
test('未注册模型 → null', () => {
  assert.equal(buildSimulationBlock({ model: 'hacker-canvas' }), null)
})

console.log('[6] 板书归一化与衔接')
test('normalizeBoardLesson 接受合法 simulation', () => {
  const lesson = normalizeBoardLesson({
    chapter: '物理',
    title: '向心力',
    blocks: [
      { type: 'definition', term: '向心力', definition: '指向圆心的合力', concreteAnchor: '绳子系着小球转圈时，绳子拉住小球的力' },
      {
        type: 'simulation',
        model: 'circular-motion',
        params: { radius: 100, speed: 6 },
        observe: ['观察箭头'],
        linkConcept: '向心力',
      },
      { type: 'question', prompt: '速度增大时力怎么变？' },
    ],
  })
  const sim = lesson.blocks.find((block) => block.type === 'simulation')
  assert.ok(sim)
  assert.equal(sim.params.radius, 100)
})
test('normalizeBoardLesson 拒绝未注册 model', () => {
  const lesson = normalizeBoardLesson({
    chapter: 'x',
    title: 't',
    blocks: [
      { type: 'simulation', model: 'evil-script', params: { x: 1 } },
      { type: 'question', prompt: 'q' },
    ],
  })
  assert.ok(!lesson.blocks.some((block) => block.type === 'simulation'))
})
test('ensureSimulationBlock：recommend 时插入 definition 之后', () => {
  const lesson = {
    chapter: '物理',
    title: '圆周运动与向心力',
    subtitle: '力指向圆心',
    blocks: [
      { type: 'outline', title: '路线', items: ['概念', '模型'] },
      { type: 'definition', term: '向心力', definition: '指向圆心、改变速度方向的合力', concreteAnchor: '月球绕地球转，地球对月球的引力' },
      { type: 'question', prompt: '速度增大时怎么变？' },
    ],
  }
  const next = ensureSimulationBlock(lesson, {
    subject: '物理',
    stage: 'junior',
    keyPoints: ['向心力 F = mv²/r', '改变速度观察力的变化'],
  })
  const types = next.blocks.map((block) => block.type)
  assert.ok(types.includes('simulation'), JSON.stringify(types))
  assert.equal(types.indexOf('simulation'), types.indexOf('definition') + 1)
  assert.equal(next.blocks[types.indexOf('simulation')].linkConcept, '向心力')
})
test('ensureSimulationBlock：skip 时不插入', () => {
  const lesson = {
    chapter: '语文',
    title: '古诗意象',
    blocks: [
      { type: 'definition', term: '意象', definition: '寄托情感的物象', concreteAnchor: '“月亮”常寄托思乡之情' },
      { type: 'question', prompt: '意象的作用？' },
    ],
  }
  const next = ensureSimulationBlock(lesson, { subject: '语文', stage: 'junior' })
  assert.ok(!next.blocks.some((block) => block.type === 'simulation'))
})
test('ensureSimulationBlock：已有 simulation 不重复插入', () => {
  const lesson = {
    chapter: '物理',
    title: '圆周运动与向心力',
    blocks: [
      { type: 'simulation', model: 'circular-motion', params: {} },
      { type: 'question', prompt: 'q' },
    ],
  }
  const next = ensureSimulationBlock(lesson, { subject: '物理', stage: 'junior' })
  assert.equal(next.blocks.filter((block) => block.type === 'simulation').length, 1)
})
test('boardToContext 序列化 simulation 供对话引用', () => {
  const lesson = normalizeBoardLesson({
    chapter: '物理',
    title: '向心力',
    blocks: [
      { type: 'definition', term: '向心力', definition: '指向圆心的合力', concreteAnchor: '绳子系着小球转圈时，绳子拉住小球的力' },
      {
        type: 'simulation',
        model: 'circular-motion',
        params: { radius: 90, speed: 4 },
        observe: ['把速度调到最大'],
        linkConcept: '向心力',
      },
      { type: 'question', prompt: 'q' },
    ],
  })
  const context = boardToContext(lesson)
  assert.ok(context.includes('交互模型'))
  assert.ok(context.includes('向心力'))
  assert.ok(context.includes('把速度调到最大'))
})

console.log(`\n结果：${passed} 通过，${failed} 失败`)
if (failed) {
  failures.forEach(({ name, error }) => console.log(`  - ${name}: ${error.message}`))
  process.exit(1)
}
