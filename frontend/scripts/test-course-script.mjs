/**
 * test-course-script.mjs —— 板书新契约 + 讲稿层 + 蓝图教学约束回归测试。
 * 运行：npm run test:course-script
 *
 * 覆盖 2026-11-07 教学视频分析落地（docs/research/teaching-video-advantages-and-ai-reuse.md）：
 * 1. board.js：8 种新 block 归一化、通用字段（transition/grow/persistent/marks/reveal）、
 *    definition.concreteAnchor 必填、block.id 位置编号；
 * 2. courseScript.js：beats 白名单、pauseMs 约束、blockId 校验、确定性兜底；
 * 3. courseBlueprint.js：takeaways 补齐、difficultyTier 非降序、时长再平衡；
 * 4. errorPatterns.js：易错点库检索与高频项。
 */
import assert from 'node:assert/strict'
import {
  normalizeBoardLesson,
  buildLocalBoardLesson,
  boardToContext,
  BOARD_BLOCK_TYPES,
  MARK_STYLES,
} from '../src/utils/board.js'
import {
  normalizeCourseScript,
  buildLocalCourseScript,
  SCRIPT_BEAT_KINDS,
} from '../src/utils/courseScript.js'
import {
  normalizeTakeaways,
  enforceDifficultyTiers,
  rebalanceMinutes,
} from '../src/utils/courseBlueprint.js'
import { errorPatternsFor, highEmphasisPatterns, ERROR_PATTERNS } from '../src/data/errorPatterns.js'

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

console.log('[1] 新 block 类型归一化（C4/B4/D2/D3/B6/B7）')
test('classification-tree：staged 阶段 + 分支收敛', () => {
  const lesson = normalizeBoardLesson({
    chapter: '数学',
    title: '有理数分类',
    blocks: [
      {
        type: 'classification-tree',
        root: { label: '有理数', note: '可写成两个整数之比' },
        branches: [
          { label: '整数', children: [{ label: '正整数' }, { label: '负整数' }, { label: '零' }] },
          { label: '分数', children: [] },
          { label: '', children: [] },
        ],
        grow: 'staged',
        stages: [
          { label: '第一层', branches: [0, 1] },
          { label: '第二层', branches: [0, 1, 9], expand: [0, 9] },
        ],
      },
      { type: 'question', prompt: '0 是哪一类？' },
    ],
  })
  const tree = lesson.blocks[0]
  assert.equal(tree.type, 'classification-tree')
  assert.equal(tree.branches.length, 2, '空标签分支应被过滤')
  assert.equal(tree.grow, 'staged')
  assert.equal(tree.stages.length, 2)
  assert.deepEqual(tree.stages[1].branches, [0, 1], '越界分支下标应被过滤')
  assert.deepEqual(tree.stages[1].expand, [0], 'expand 必须是 branches 的子集')
})
test('classification-tree：无 stages 时补一个全貌阶段', () => {
  const block = normalizeBoardLesson({
    blocks: [
      {
        type: 'classification-tree',
        root: '实数',
        branches: [{ label: '有理数' }, { label: '无理数' }],
      },
      { type: 'question', prompt: 'q' },
    ],
  }).blocks[0]
  assert.equal(block.stages.length, 1)
  assert.deepEqual(block.stages[0].branches, [0, 1])
})
test('number-line：范围/刻度/点/线段收敛', () => {
  const block = normalizeBoardLesson({
    blocks: [
      {
        type: 'number-line',
        min: -4,
        max: 4,
        ticks: [
          { value: -4, label: '-4' },
          { value: 0, label: '0' },
          { value: 99, label: '越界' },
        ],
        points: [
          { value: -2, label: '-2', tone: 'negative' },
          { value: 3, label: '3', tone: 'positive' },
          { value: 100, label: '越界点' },
        ],
        segments: [{ from: -1, to: 2, label: '区间', tone: 'current' }],
      },
      { type: 'question', prompt: 'q' },
    ],
  }).blocks[0]
  assert.equal(block.ticks.length, 2, '越界刻度应被过滤')
  assert.equal(block.points.length, 2, '越界点应被过滤')
  assert.equal(block.points[0].tone, 'negative')
  assert.equal(block.segments[0].from, -1)
  assert.equal(block.segments[0].to, 2)
})
test('number-line：min>=max 或全空时拒绝', () => {
  const bad = normalizeBoardLesson({
    blocks: [
      { type: 'number-line', min: 4, max: 4, ticks: [{ value: 4, label: 'x' }] },
      { type: 'question', prompt: 'q' },
    ],
  })
  assert.ok(!bad.blocks.some((block) => block.type === 'number-line'))
})
test('fill-blank：空位数与答案对齐', () => {
  const block = normalizeBoardLesson({
    blocks: [
      { type: 'fill-blank', prompt: '同号得___，异号得___。', answers: ['正'] },
      { type: 'question', prompt: 'q' },
    ],
  }).blocks[0]
  assert.equal(block.answers.length, 2, '答案不足应补位')
  assert.equal(block.answers[0], '正')
})
test('fill-blank：没有 ___ 的 prompt 拒绝', () => {
  const bad = normalizeBoardLesson({
    blocks: [
      { type: 'fill-blank', prompt: '同号得正，异号得负。', answers: ['正'] },
      { type: 'question', prompt: 'q' },
    ],
  })
  assert.ok(!bad.blocks.some((block) => block.type === 'fill-blank'))
})
test('wrong-first：错解步数/错误下标/正解收敛', () => {
  const block = normalizeBoardLesson({
    blocks: [
      {
        type: 'wrong-first',
        wrongSteps: ['移项：3x = 5 - 2x', '得 5x = 5', 'x = 1'],
        errorIndex: 9,
        correctSteps: ['移项变号：3x + 2x = 5'],
      },
      { type: 'question', prompt: 'q' },
    ],
  }).blocks[0]
  assert.equal(block.errorIndex, 2, 'errorIndex 应钳制到最后一步')
  assert.equal(block.wrongSteps.length, 3)
})
test('judge / case-table / induction / multi-solution 基本契约', () => {
  const lesson = normalizeBoardLesson({
    blocks: [
      { type: 'judge', statement: '0 是正数', answer: false, explanation: '0 非正非负' },
      {
        type: 'case-table',
        dimension: 'a 的取值',
        cases: [
          { condition: 'a=0', conclusion: '方程无解', tone: 'negative' },
          { condition: 'a≠0', conclusion: '唯一解 x=b/a', tone: 'positive' },
        ],
      },
      { type: 'induction', examples: ['2×3=6', '(-2)×3=-6'], rule: '异号得负' },
      {
        type: 'multi-solution',
        problem: '计算 37×99+37',
        methods: [
          { name: '凑整', steps: ['提公因数 37'] },
          { name: '分配律', steps: ['拆 99=100-1'] },
        ],
      },
      { type: 'question', prompt: 'q' },
    ],
  })
  const types = lesson.blocks.map((block) => block.type)
  assert.ok(types.includes('judge'))
  assert.ok(types.includes('case-table'))
  assert.ok(types.includes('induction'))
  assert.ok(types.includes('multi-solution'))
  const judge = lesson.blocks.find((block) => block.type === 'judge')
  assert.equal(judge.answer, false)
})

console.log('\n[2] 通用字段契约（C2/C5/C6 + §7.3 转场）')
test('transition 受控枚举与毫秒钳制', () => {
  const block = normalizeBoardLesson({
    blocks: [
      {
        type: 'callout',
        tone: 'warn',
        text: '注意符号',
        transition: { enter: 'slide-left', exit: 'fade', durationMs: 99999, delayMs: -5 },
      },
      { type: 'question', prompt: 'q' },
    ],
  }).blocks[0]
  assert.equal(block.transition.enter, 'slide-left')
  assert.equal(block.transition.exit, 'fade')
  assert.equal(block.transition.durationMs, 1500, 'duration 应钳制到 1500')
  assert.equal(block.transition.delayMs, 0, 'delay 应钳制到 0')
})
test('transition 非法枚举被丢弃', () => {
  const block = normalizeBoardLesson({
    blocks: [
      { type: 'callout', text: 'x', transition: { enter: 'zoom-spin', exit: 'flip' } },
      { type: 'question', prompt: 'q' },
    ],
  }).blocks[0]
  assert.ok(!block.transition, '非法 enter/exit 不应保留')
})
test('marks 归一化 + 未知样式回落 box', () => {
  const block = normalizeBoardLesson({
    blocks: [
      {
        type: 'callout',
        text: '移项必须变号',
        marks: [
          { target: '变号', style: 'circle-char' },
          { target: '', style: 'box' },
          { target: '移项', style: 'rainbow' },
        ],
      },
      { type: 'question', prompt: 'q' },
    ],
  }).blocks[0]
  assert.equal(block.marks.length, 2, '空 target 应被过滤')
  assert.equal(block.marks[0].style, 'circle-char')
  assert.equal(block.marks[1].style, 'box', '未知样式回落 box')
})
test('persistent / reveal:tap / grow 保留', () => {
  const block = normalizeBoardLesson({
    blocks: [
      { type: 'outline', items: ['甲', '乙'], persistent: true, reveal: 'tap' },
      { type: 'question', prompt: 'q' },
    ],
  }).blocks[0]
  assert.equal(block.persistent, true)
  assert.equal(block.reveal, 'tap')
})
test('definition：concreteAnchor 必填，缺失即丢弃（B2）', () => {
  const lesson = normalizeBoardLesson({
    blocks: [
      { type: 'definition', term: '有理数', definition: '可写成两个整数之比的数' },
      { type: 'table', columns: ['a', 'b'], rows: [['1', '2']] },
      { type: 'question', prompt: 'q' },
    ],
  })
  assert.ok(!lesson.blocks.some((block) => block.type === 'definition'))
})
test('definition：method/verify 可选保留', () => {
  const block = normalizeBoardLesson({
    blocks: [
      {
        type: 'definition',
        term: '相反数',
        definition: '只有符号不同的两个数',
        concreteAnchor: '+3 与 -3 到原点距离相等',
        method: ['定符号', '抄数字'],
        verify: '两数相加应为 0',
      },
      { type: 'question', prompt: 'q' },
    ],
  }).blocks[0]
  assert.deepEqual(block.method, ['定符号', '抄数字'])
  assert.equal(block.verify, '两数相加应为 0')
})
test('callout：success 语义色 + mnemonic 口诀', () => {
  const block = normalizeBoardLesson({
    blocks: [
      { type: 'callout', tone: 'success', text: '回带成立', mnemonic: '解完回带' },
      { type: 'question', prompt: 'q' },
    ],
  }).blocks[0]
  assert.equal(block.tone, 'success')
  assert.equal(block.mnemonic, '解完回带')
})
test('question：by=mascot 保留', () => {
  const block = normalizeBoardLesson({
    blocks: [{ type: 'question', prompt: '猜猜看', by: 'mascot', options: ['A', 'B'] }],
  }).blocks[0]
  assert.equal(block.by, 'mascot')
})
test('block.id 位置编号（供讲稿 blockId 引用）', () => {
  const lesson = normalizeBoardLesson({
    blocks: [
      { type: 'outline', items: ['甲'] },
      { type: 'callout', text: '提示' },
      { type: 'question', prompt: 'q' },
    ],
  })
  assert.deepEqual(
    lesson.blocks.map((block) => block.id),
    ['b1', 'b2', 'b3'],
  )
})
test('question 缺失时补默认追问，id 连续', () => {
  const lesson = normalizeBoardLesson({
    blocks: [{ type: 'outline', items: ['甲'] }],
  })
  assert.equal(lesson.blocks.length, 2)
  assert.equal(lesson.blocks[1].type, 'question')
  assert.equal(lesson.blocks[1].id, 'b2')
})

console.log('\n[3] boardToContext / 本地兜底')
test('boardToContext 序列化新 block 类型', () => {
  const lesson = normalizeBoardLesson({
    blocks: [
      { type: 'wrong-first', wrongSteps: ['错1', '错2'], errorIndex: 1, correctSteps: ['对1'] },
      { type: 'number-line', min: -2, max: 2, ticks: [{ value: 0, label: '0' }], points: [{ value: 1, label: '1' }] },
      { type: 'fill-blank', prompt: 'a___b', answers: ['加'] },
      { type: 'judge', statement: '0 是整数', answer: true, explanation: '是' },
    ],
  })
  const context = boardToContext(lesson)
  assert.ok(context.includes('错解先行'))
  assert.ok(context.includes('数轴[-2, 2]'))
  assert.ok(context.includes('填空'))
  assert.ok(context.includes('判断'))
})
test('buildLocalBoardLesson 通过新契约（concreteAnchor 必填）', () => {
  const lesson = buildLocalBoardLesson('管理学原理')
  assert.ok(lesson)
  const definition = lesson.blocks.find((block) => block.type === 'definition')
  assert.ok(definition.concreteAnchor, '本地兜底 definition 必须带 concreteAnchor')
  const outline = lesson.blocks.find((block) => block.type === 'outline')
  assert.equal(outline.persistent, true, '路线图应常驻')
})

console.log('\n[4] 讲稿层：normalizeCourseScript')
const scriptLesson = normalizeBoardLesson({
  blocks: [
    { type: 'outline', items: ['路线'] },
    { type: 'definition', term: '相反数', definition: '只有符号不同的两个数', concreteAnchor: '+3 与 -3' },
    { type: 'question', prompt: '0 的相反数是谁？' },
  ],
})
const scriptOutline = { title: '相反数', keyPoints: ['相反数'], sourceChunkIds: ['c1'] }

test('合法 beats 通过；pauseMs 按拍型钳制', () => {
  const script = normalizeCourseScript(
    {
      persona: '沉稳的数学老师',
      beats: [
        { kind: 'question', text: '相反数是什么？', pauseMs: 500, blockId: 'b1' },
        { kind: 'answer', text: '只有符号不同的两个数。', pauseMs: 99999, blockId: 'b2' },
        { kind: 'confirm', text: '对，+3 与 -3 就是。', pauseMs: 100, blockId: 'b2' },
        { kind: 'cta', text: '自己再说一遍。', pauseMs: 100 },
      ],
    },
    { outline: scriptOutline, lesson: scriptLesson },
  )
  assert.equal(script.persona, '沉稳的数学老师')
  assert.equal(script.beats[0].pauseMs, 1500, 'question 拍最低 1500ms（E4）')
  assert.equal(script.beats[0].blockId, 'b1')
  assert.equal(script.beats[1].pauseMs, 6000, 'pauseMs 上限 6000')
  assert.equal(script.beats[1].blockId, 'b2')
  assert.equal(script.beats[2].blockId, null, 'confirm 拍不挂 blockId')
  assert.equal(script.beats[2].pauseMs, 600)
})
test('未知 blockId 置空；未知 kind 回落 answer', () => {
  const script = normalizeCourseScript(
    {
      beats: [
        { kind: 'question', text: '设问', pauseMs: 1600, blockId: 'b999' },
        { kind: 'improv', text: '闲聊', pauseMs: 800 },
        { kind: 'cta', text: '收尾', pauseMs: 800 },
      ],
    },
    { outline: scriptOutline, lesson: scriptLesson },
  )
  assert.equal(script.beats[0].blockId, null)
  assert.equal(script.beats[1].kind, 'answer')
})
test('缺 question / 缺 cta / 少于 3 拍 → null（触发重试或兜底）', () => {
  const base = { outline: scriptOutline, lesson: scriptLesson }
  assert.equal(
    normalizeCourseScript(
      { beats: [{ kind: 'answer', text: 'a', pauseMs: 800 }, { kind: 'cta', text: 'c', pauseMs: 800 }, { kind: 'answer', text: 'b', pauseMs: 800 }] },
      base,
    ),
    null,
  )
  assert.equal(
    normalizeCourseScript(
      { beats: [{ kind: 'question', text: 'a', pauseMs: 1500 }, { kind: 'answer', text: 'b', pauseMs: 800 }, { kind: 'answer', text: 'c', pauseMs: 800 }] },
      base,
    ),
    null,
  )
  assert.equal(normalizeCourseScript({ beats: [{ kind: 'cta', text: 'c' }] }, base), null)
})

console.log('\n[5] 讲稿层：确定性兜底 buildLocalCourseScript')
test('板书场景：首拍 question、question block 停顿 1800、末拍 cta', () => {
  const script = buildLocalCourseScript({ domain: 'math7' }, scriptOutline, {
    kind: 'board',
    lesson: scriptLesson,
  })
  assert.equal(script.local, true)
  assert.equal(script.beats[0].kind, 'question')
  assert.equal(script.beats[0].pauseMs, 1800)
  assert.equal(script.beats.at(-1).kind, 'cta')
  const questionBeat = script.beats.find((beat) => beat.blockId === 'b3')
  assert.ok(questionBeat, '板书 question block 应转成 question 拍')
  assert.equal(questionBeat.pauseMs, 1800)
  assert.ok(script.beats.some((beat) => beat.kind === 'recall'), '≥4 block 应有 recall 拍')
})
test('quiz 场景：每题一问一答 + cta', () => {
  const script = buildLocalCourseScript({}, scriptOutline, {
    kind: 'quiz',
    questions: [
      { stem: '0 的相反数？', explanation: '0 的相反数是 0' },
      { stem: '-5 的相反数？', explanation: '是 5' },
    ],
  })
  const questions = script.beats.filter((beat) => beat.kind === 'question')
  assert.equal(questions.length, 2)
  assert.equal(questions[0].pauseMs, 2000)
  assert.equal(script.beats.at(-1).kind, 'cta')
})
test('practice 场景：情境拍 + 参考要点 + cta', () => {
  const script = buildLocalCourseScript({}, scriptOutline, {
    kind: 'practice',
    prompt: '设计一个能检验相反数理解的情境',
    referencePoints: ['能举例子', '能说依据'],
  })
  assert.equal(script.beats[0].kind, 'question')
  assert.ok(script.beats[0].text.includes('情境'))
  assert.equal(script.beats.at(-1).kind, 'cta')
})

console.log('\n[6] 蓝图教学约束（A1/A4/A6）')
test('normalizeTakeaways：lecture 恰好 3 条，quiz 可选', () => {
  const three = normalizeTakeaways(['结论一'], ['要点A', '要点B', '要点C'], true)
  assert.equal(three.length, 3)
  assert.equal(three[0], '结论一')
  assert.ok(three.includes('要点A'))
  const optional = normalizeTakeaways(['一条'], ['x'], false)
  assert.deepEqual(optional, ['一条'])
})
test('enforceDifficultyTiers：逆序被抬平为非降序', () => {
  const scenes = [
    { type: 'lecture', difficultyTier: 3 },
    { type: 'lecture', difficultyTier: 1 },
    { type: 'quiz', difficultyTier: 1 },
    { type: 'lecture', difficultyTier: 2 },
  ]
  const tiers = enforceDifficultyTiers(scenes).map((scene) => scene.difficultyTier)
  assert.deepEqual(tiers, [3, 3, 1, 3])
})
test('rebalanceMinutes：总和偏离目标时按类型钳制缩放', () => {
  const scenes = [
    { type: 'lecture', estimatedMinutes: 10 },
    { type: 'lecture', estimatedMinutes: 10 },
    { type: 'quiz', estimatedMinutes: 10 },
    { type: 'review', estimatedMinutes: 10 },
  ]
  const balanced = rebalanceMinutes(scenes, 16)
  const sum = balanced.reduce((total, scene) => total + scene.estimatedMinutes, 0)
  assert.ok(Math.abs(sum - 16) <= 2, `总和应贴近 16，实际 ${sum}`)
  balanced.forEach((scene) => {
    const range = { lecture: [2, 6], quiz: [4, 6], review: [3, 5] }[scene.type] || [3, 8]
    assert.ok(
      scene.estimatedMinutes >= range[0] && scene.estimatedMinutes <= range[1],
      `${scene.type} 超出 ${range}`,
    )
  })
})
test('rebalanceMinutes：偏差在容忍带内不动', () => {
  const scenes = [
    { type: 'lecture', estimatedMinutes: 4 },
    { type: 'lecture', estimatedMinutes: 4 },
    { type: 'quiz', estimatedMinutes: 5 },
    { type: 'review', estimatedMinutes: 4 },
  ]
  const same = rebalanceMinutes(scenes, 17)
  assert.deepEqual(
    same.map((scene) => scene.estimatedMinutes),
    [4, 4, 5, 4],
  )
})

console.log('\n[7] 易错点库（D4）')
test('math7 返回全部 12 条；其他域为空', () => {
  assert.equal(errorPatternsFor({ domain: 'math7' }).length, 12)
  assert.equal(errorPatternsFor({ domain: 'management' }).length, 0)
})
test('高频项（emphasisCount≥2）用于 review 双次强调', () => {
  const high = highEmphasisPatterns('math7')
  assert.ok(high.length >= 5)
  assert.ok(high.every((pattern) => pattern.emphasisCount >= 2))
  assert.ok(high.some((pattern) => pattern.id === 'ep-02'))
})
test('每条种子字段完整', () => {
  ERROR_PATTERNS.forEach((pattern) => {
    assert.ok(pattern.id && pattern.wrong && pattern.correct, `${pattern.id} 字段缺失`)
    assert.ok(pattern.tags.length >= 2, `${pattern.id} 标签过少`)
  })
})

console.log('\n[8] 白名单完整性')
test('16 种 block 全部有归一化分支', () => {
  const sample = {
    outline: { type: 'outline', items: ['a'] },
    definition: { type: 'definition', term: 't', definition: 'd', concreteAnchor: 'c' },
    table: { type: 'table', columns: ['a', 'b'], rows: [['1', '2']] },
    diagram: { type: 'diagram', nodes: [{ label: 'a' }, { label: 'b' }] },
    animation: { type: 'animation', steps: [{ label: 'a', detail: 'x' }, { label: 'b', detail: 'y' }] },
    simulation: { type: 'simulation', model: 'circular-motion', params: {} },
    callout: { type: 'callout', text: 't' },
    question: { type: 'question', prompt: 'p' },
    'classification-tree': { type: 'classification-tree', root: 'r', branches: [{ label: 'a' }, { label: 'b' }] },
    'number-line': { type: 'number-line', min: 0, max: 1, ticks: [{ value: 0, label: '0' }] },
    'fill-blank': { type: 'fill-blank', prompt: 'a___b', answers: ['x'] },
    'wrong-first': { type: 'wrong-first', wrongSteps: ['a', 'b'], errorIndex: 0, correctSteps: ['c'] },
    judge: { type: 'judge', statement: 's', answer: true },
    'case-table': { type: 'case-table', dimension: 'd', cases: [{ condition: 'c', conclusion: 'x' }, { condition: 'd', conclusion: 'y' }] },
    induction: { type: 'induction', examples: ['a', 'b'], rule: 'r' },
    'multi-solution': { type: 'multi-solution', problem: 'p', methods: [{ name: 'm', steps: ['s'] }, { name: 'n', steps: ['t'] }] },
  }
  BOARD_BLOCK_TYPES.forEach((type) => {
    const lesson = normalizeBoardLesson({ blocks: [sample[type], { type: 'question', prompt: 'q' }] })
    assert.ok(
      lesson.blocks.some((block) => block.type === type),
      `${type} 没有通过归一化`,
    )
  })
})
test('MARK_STYLES 覆盖报告 T8/T11/T12', () => {
  ;['box', 'underline', 'circle', 'circle-char', 'cross', 'check', 'stop'].forEach((style) => {
    assert.ok(MARK_STYLES.includes(style), `缺少 ${style}`)
  })
})
test('SCRIPT_BEAT_KINDS 覆盖设问链', () => {
  assert.deepEqual(SCRIPT_BEAT_KINDS, ['question', 'answer', 'confirm', 'recall', 'cta'])
})

console.log(`\n结果：${passed} 通过，${failed} 失败`)
if (failed > 0) {
  failures.forEach(({ name, error }) => console.error(`✗ ${name}\n  ${error.stack}`))
  process.exit(1)
}
