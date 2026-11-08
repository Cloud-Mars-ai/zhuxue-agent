#!/usr/bin/env node
/**
 * test-openmaic-pipeline.mjs —— OpenMAIC 接入管线回归测试。
 * 运行：npm run test:openmaic
 *
 * 覆盖（对应 docs/research/openmaic-integration-design.md）：
 * A. promptEngine：模板资产加载 / snippets / 条件块 / 变量插值 / 画布契约
 * B. jsonRepair：代码块 / reasoning 前缀 / LaTeX 转义 / 截断 / 尾逗号
 * C. generationRetry：可重试分类 / 空结果退避重试
 * D. outlineGenerator：提示词边界 / 三键契约 / 裸数组兜底 / 降级链 / 类型映射
 * E. slideAdapter：PPTElement→板书 / 结构保障 / 丢弃计数
 * F. sceneGenerator：quiz 适配 / slide / interactive widget-config / pbl
 * G. scientificModel：四字段归一化 / SCI-* 检查码
 */
import assert from 'node:assert/strict'

import {
  PROMPT_IDS,
  SLIDE_CANVAS,
  buildPrompt,
  buildSlideContentPrompt,
  processConditionalBlocks,
  processSnippets,
} from '../src/api/openmaic/promptEngine.js'
import {
  parseJsonResponse,
  repairJsonLight,
  stripReasoningPrefix,
} from '../src/api/openmaic/jsonRepair.js'
import {
  isAbortError,
  isRetryableGenerationError,
  withGenerationRetry,
} from '../src/api/openmaic/generationRetry.js'
import {
  OPENMAIC_SCENE_TYPES,
  OPENMAIC_WIDGET_TYPES,
  applyOutlineFallbacks,
  buildOutlinePrompt,
  generateSceneOutlines,
  mapSceneType,
  normalizeSceneOutlines,
} from '../src/api/openmaic/outlineGenerator.js'
import {
  adaptOpenmaicQuestions,
  extractWidgetConfig,
  generateOpenmaicScene,
  widgetConfigToLesson,
} from '../src/api/openmaic/sceneGenerator.js'
import { slideElementsToLesson } from '../src/api/openmaic/slideAdapter.js'
import {
  checkScientificModel,
  normalizeScientificModel,
} from '../src/api/openmaic/scientificModel.js'

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

// ─────────────────────────── A. promptEngine ───────────────────────────

test('A1 大纲模板加载且包含三键契约', () => {
  const prompt = buildPrompt(PROMPT_IDS.REQUIREMENTS_TO_OUTLINES, {
    requirement: '测试需求',
    pdfContent: 'None',
    availableImages: 'No images available',
    userProfile: '',
    hasSourceImages: false,
    imageEnabled: false,
    videoEnabled: false,
    mediaEnabled: false,
    researchContext: 'None',
    teacherContext: '',
  })
  assert.ok(prompt, '模板应存在')
  assert.match(prompt.system, /languageDirective/)
  assert.match(prompt.system, /courseTitle/)
  assert.match(prompt.system, /outlines/)
  assert.match(prompt.user, /测试需求/)
})

test('A2 quiz 模板 snippet 已展开（无占位符残留）', () => {
  const prompt = buildPrompt(PROMPT_IDS.QUIZ_CONTENT, { title: 't' })
  assert.ok(prompt)
  assert.ok(!prompt.system.includes('{{snippet:'), 'snippet 占位符必须被替换')
  assert.match(prompt.system, /json-output-rules|JSON/)
  assert.match(prompt.system, /value.*label|label.*value/)
})

test('A3 条件块按真值包含/移除', () => {
  const template = 'A{{#if on}}B{{/if}}C{{#if off}}D{{/if}}E'
  const out = processSnippets(template)
  assert.equal(out, template, '无 snippet 时原样返回')
  assert.equal(processConditionalBlocks(template, { on: true, off: false }), 'ABCE')
})

test('A4 slide 提示词注入画布尺寸且媒体条件块关闭', () => {
  const prompt = buildSlideContentPrompt()
  assert.ok(prompt)
  assert.ok(prompt.system.includes('1000'))
  assert.ok(prompt.system.includes('562.5'))
  assert.ok(!prompt.system.includes('{{canvas_width}}'), '变量必须已插值')
  // imageElementEnabled=false：图片指令块整体移除
  assert.ok(!/Use only the provided image IDs/.test(prompt.system))
})

test('A5 画布常量与上游一致', () => {
  assert.deepEqual(SLIDE_CANVAS, { width: 1000, height: 562.5 })
})

// ─────────────────────────── B. jsonRepair ───────────────────────────

test('B1 代码块包裹的 JSON', () => {
  const parsed = parseJsonResponse('前言\n```json\n{"a": 1}\n```\n后记')
  assert.deepEqual(parsed, { a: 1 })
})

test('B2 reasoning 前缀剥离', () => {
  const raw = '<think>让我想想</think>\n{"a": 2}'
  assert.deepEqual(parseJsonResponse(raw), { a: 2 })
  assert.equal(stripReasoningPrefix('</reasoning>\n[1,2]'), '[1,2]')
})

test('B3 LaTeX 反斜杠双转义（数学内容）', () => {
  // \alpha/\sqrt：非法转义，Attempt 1 失败 → Attempt 2 修复
  const parsed = parseJsonResponse('{"formula": "\\alpha = \\sqrt{b^2-4ac}"}')
  assert.equal(parsed.formula, '\\alpha = \\sqrt{b^2-4ac}')
  // \frac：\f 是合法转义（换页），裸 JSON.parse 会"成功"但内容被静默损坏，
  // 控制字符检测必须拦下并交还修复路径（对上游 parity 的改进）
  const frac = parseJsonResponse('{"formula": "\\frac{a}{b}"}')
  assert.equal(frac.formula, '\\frac{a}{b}')
  assert.ok(!frac.formula.includes('\x0C'), '不得残留换页控制符')
})

test('B4 截断数组补全', () => {
  const raw = '{"outlines": [{"id": "scene_1", "title": "一"}, {"id": "scene_2"'
  const parsed = parseJsonResponse(raw)
  assert.ok(Array.isArray(parsed.outlines))
  assert.equal(parsed.outlines.length, 1)
})

test('B5 尾逗号与裸键修复', () => {
  assert.deepEqual(parseJsonResponse('{"a": 1, "b": [1, 2,],}'), { a: 1, b: [1, 2] })
  assert.deepEqual(repairJsonLight('{"a": "x", }'), '{"a": "x"}')
})

test('B6 完全无法解析返回 null', () => {
  assert.equal(parseJsonResponse('完全不是 JSON'), null)
})

// ─────────────────────────── C. generationRetry ───────────────────────────

test('C1 可重试错误分类（与上游一致）', () => {
  assert.equal(isRetryableGenerationError({ status: 401 }), false)
  assert.equal(isRetryableGenerationError({ status: 403 }), false)
  assert.equal(isRetryableGenerationError({ status: 404 }), false)
  assert.equal(isRetryableGenerationError({ status: 422 }), false)
  assert.equal(isRetryableGenerationError({ status: 429 }), true)
  assert.equal(isRetryableGenerationError({ status: 408 }), true)
  assert.equal(isRetryableGenerationError({ status: 500 }), true)
  assert.equal(isRetryableGenerationError({ status: 503 }), true)
  assert.equal(isRetryableGenerationError(new Error('rate limit exceeded')), true)
  assert.equal(isRetryableGenerationError(new Error('fetch failed')), true)
  assert.equal(isRetryableGenerationError(new Error('bad request')), false)
  assert.equal(isRetryableGenerationError({ isRetryable: true }), true)
  const abort = new Error('cancelled')
  abort.name = 'AbortError'
  assert.equal(isRetryableGenerationError(abort), false)
  assert.equal(isAbortError(abort), true)
  // 嵌套 cause 递归
  assert.equal(isRetryableGenerationError({ cause: { status: 429 } }), true)
})

await testAsync('C2 空结果触发退避重试并最终成功', async () => {
  let calls = 0
  const delays = []
  const result = await withGenerationRetry(
    async () => {
      calls += 1
      return calls < 3 ? '' : 'done'
    },
    {
      label: 'test',
      maxRetries: 3,
      baseDelayMs: 10,
      shouldRetryResult: (value) => !String(value ?? '').trim(),
      sleep: (ms) => {
        delays.push(ms)
        return Promise.resolve()
      },
      random: () => 0.5,
    },
  )
  assert.equal(result, 'done')
  assert.equal(calls, 3)
  assert.equal(delays.length, 2)
  assert.ok(delays[0] >= 10 && delays[0] <= 12, `首次退避应≈baseDelay：${delays[0]}`)
  assert.ok(delays[1] > delays[0], '指数退避应递增')
})

await testAsync('C3 不可重试错误立即抛出', async () => {
  let calls = 0
  await assert.rejects(
    () =>
      withGenerationRetry(
        async () => {
          calls += 1
          throw Object.assign(new Error('nope'), { status: 401 })
        },
        { label: 'test', maxRetries: 3, baseDelayMs: 1, sleep: () => Promise.resolve() },
      ),
    /nope/,
  )
  assert.equal(calls, 1, '401 不应重试')
})

// ─────────────────────────── D. outlineGenerator ───────────────────────────

test('D1 OpenMAIC 场景/widget 类型集合完整', () => {
  assert.deepEqual(OPENMAIC_SCENE_TYPES, ['slide', 'quiz', 'interactive', 'pbl'])
  assert.equal(OPENMAIC_WIDGET_TYPES.length, 6)
})

test('D2 大纲提示词注入场景数边界与教师上下文', () => {
  const prompt = buildOutlinePrompt(
    { requirement: '学习计划职能' },
    { maxScenes: 6, teacherContext: 'HOST-RULES', pdfText: '' },
  )
  assert.ok(prompt.user.includes('学习计划职能'))
  assert.match(prompt.user, /6 scenes or fewer/)
  assert.ok(prompt.user.includes('HOST-RULES'))
  assert.ok(prompt.user.includes('No images available'))
})

test('D3 类型映射（OpenMAIC → 本项目）', () => {
  assert.equal(mapSceneType('slide'), 'lecture')
  assert.equal(mapSceneType('quiz'), 'quiz')
  assert.equal(mapSceneType('interactive'), 'practice')
  assert.equal(mapSceneType('pbl'), 'practice')
  assert.equal(mapSceneType('unknown'), 'lecture')
})

test('D4 降级链：interactive 缺 widget → slide', () => {
  const outline = { id: 's1', type: 'interactive', title: 't', keyPoints: ['k'] }
  const fixed = applyOutlineFallbacks(outline, true)
  assert.equal(fixed.type, 'slide')
})

test('D5 降级链：pbl 缺配置 → slide；procedural-skill → diagram', () => {
  const pbl = applyOutlineFallbacks({ id: 's', type: 'pbl', title: 't' }, true)
  assert.equal(pbl.type, 'slide')
  const skill = applyOutlineFallbacks(
    { id: 's', type: 'interactive', widgetType: 'procedural-skill', widgetOutline: { steps: ['a'] }, title: 't' },
    true,
  )
  assert.equal(skill.widgetType, 'diagram')
  assert.ok(!('steps' in skill.widgetOutline), 'procedural 字段必须被清除')
})

test('D6 normalizeSceneOutlines：元数据保留 + quizConfig 归一', () => {
  const result = normalizeSceneOutlines({
    languageDirective: '用中文授课',
    courseTitle: '计划职能',
    outlines: [
      { id: 'scene_1', type: 'slide', title: '概念', keyPoints: ['a', 'b'] },
      {
        id: 'scene_2',
        type: 'quiz',
        title: '练习',
        keyPoints: ['c'],
        quizConfig: { questionCount: 9, difficulty: 'hard', questionTypes: ['multiple', 'bogus'] },
      },
      {
        id: 'scene_3',
        type: 'interactive',
        title: '模拟',
        keyPoints: ['d'],
        widgetType: 'simulation',
        widgetOutline: { concept: 'x' },
      },
      {
        id: 'scene_4',
        type: 'pbl',
        title: '项目',
        keyPoints: ['e'],
        pblConfig: { projectTopic: '排产优化', targetSkills: ['计划', '控制'], issueCount: 9 },
      },
    ],
  })
  assert.ok(result)
  assert.equal(result.courseTitle, '计划职能')
  assert.equal(result.outlines.length, 4)
  assert.equal(result.outlines[0].type, 'lecture')
  assert.equal(result.outlines[1].quizConfig.questionCount, 4, '题数应收敛到 ≤4')
  assert.deepEqual(result.outlines[1].quizConfig.questionTypes, ['multiple'])
  assert.equal(result.outlines[2].widget.widgetType, 'simulation')
  assert.equal(result.outlines[3].pbl.issueCount, 6, 'issueCount 应收敛到 ≤6')
  assert.equal(result.outlines[3].type, 'practice')
})

await testAsync('D7 generateSceneOutlines：三键契约解析', async () => {
  const result = await generateSceneOutlines(
    { requirement: 'r' },
    async () =>
      JSON.stringify({
        languageDirective: '用中文',
        courseTitle: '标题',
        outlines: [
          { id: 'scene_1', type: 'slide', title: '一', keyPoints: ['k1'] },
          { id: 'scene_2', type: 'quiz', title: '二', keyPoints: ['k2'] },
          { id: 'scene_3', type: 'slide', title: '三', keyPoints: ['k3'] },
        ],
      }),
    {},
  )
  assert.equal(result.success, true)
  assert.equal(result.data.outlines.length, 3)
  assert.equal(result.data.courseTitle, '标题')
})

await testAsync('D8 generateSceneOutlines：裸数组兜底 + 失败路径', async () => {
  const bare = await generateSceneOutlines(
    { requirement: 'r' },
    async () => JSON.stringify([{ id: 'scene_1', type: 'slide', title: '一', keyPoints: ['k'] }]),
    {},
  )
  assert.equal(bare.success, true)
  assert.equal(bare.data.outlines.length, 1)
  assert.ok(bare.data.languageDirective.length > 0)

  const bad = await generateSceneOutlines({ requirement: 'r' }, async () => 'not json at all', {})
  assert.equal(bad.success, false)

  const thrown = await generateSceneOutlines({ requirement: 'r' }, async () => {
    throw new Error('network down')
  }, {})
  assert.equal(thrown.success, false)
  assert.match(thrown.error, /network down/)
})

// ─────────────────────────── E. slideAdapter ───────────────────────────

test('E1 标准 slide → 板书（标题/路线/定义）', () => {
  const elements = [
    {
      id: 't1', type: 'text', left: 60, top: 50, width: 880, height: 76,
      content: '<p style="font-size:32px;"><strong>计划的类型</strong></p>',
    },
    {
      id: 't2', type: 'text', left: 60, top: 150, width: 880, height: 130,
      content:
        '<p style="font-size:18px;">• 战略计划：确定长期方向</p><p style="font-size:18px;">• 战术计划：分解年度目标</p><p style="font-size:18px;">• 作业计划：落实到班组</p>',
    },
    {
      id: 't3', type: 'text', left: 60, top: 320, width: 880, height: 90,
      content: '<p style="font-size:20px;">计划：对未来行动的事先安排</p>',
    },
  ]
  const lesson = slideElementsToLesson(elements, { keyPoints: ['计划的类型'], title: '计划的类型' })
  assert.ok(lesson, '应产出 lesson')
  assert.equal(lesson.title, '计划的类型')
  const types = lesson.blocks.map((block) => block.type)
  assert.ok(types.includes('outline'))
  assert.ok(types.includes('definition'))
  const outline = lesson.blocks.find((block) => block.type === 'outline')
  assert.equal(outline.items.length, 3)
  const definition = lesson.blocks.find((block) => block.type === 'definition')
  assert.equal(definition.term, '计划')
  assert.ok(definition.definition.includes('事先安排'))
  assert.ok(definition.concreteAnchor.length > 0, 'concreteAnchor 必填')
})

test('E2 媒体元素丢弃并计数；越界图形丢弃，越界文本保留', () => {
  const elements = [
    { id: 'i1', type: 'image', left: 60, top: 60, width: 200, height: 120 },
    { id: 'v1', type: 'video', left: 60, top: 200, width: 200, height: 120 },
    { id: 't1', type: 'text', left: 60, top: 400, width: 880, height: 76, content: '<p>标题</p>' },
    { id: 't2', type: 'text', left: 60, top: 440, width: 880, height: 60, content: '<p>• 要点一</p>' },
    // 越界文本：文本映射只按 top 排序不使用坐标，不得因位置丢弃（live 实测回归）
    { id: 't3', type: 'text', left: 990, top: 10, width: 880, height: 60, content: '<p>越界文本不丢弃</p>' },
    // 越界图形：坐标幻觉，丢弃并计数
    { id: 'bad', type: 'shape', left: 990, top: 480, width: 500, height: 60, content: '越界图形' },
  ]
  const lesson = slideElementsToLesson(elements, { keyPoints: [] })
  assert.ok(lesson)
  assert.equal(lesson.dropped.media, 2)
  assert.equal(lesson.dropped.outOfCanvas, 1)
  assert.ok(lesson.title.includes('越界文本不丢弃'), '越界文本不得因位置被丢弃')
})

test('E3 模型文本稀薄时用大纲 keyPoints 兜底 outline', () => {
  // live 实测回归：图形密集场景模型不产出路线文本（块序列只有 diagram），
  // 用同一管线大纲契约的 keyPoints 兜底，不编造内容
  const elements = [
    { id: 't1', type: 'text', left: 60, top: 50, width: 880, height: 76, content: '<p style="font-size:30px;">资源分配模拟</p>' },
    { id: 's1', type: 'shape', left: 200, top: 150, width: 160, height: 80, content: '目标设定' },
    { id: 's2', type: 'shape', left: 500, top: 150, width: 160, height: 80, content: '资源约束' },
    { id: 's3', type: 'shape', left: 350, top: 300, width: 160, height: 80, content: '可行性反馈' },
    { id: 'l1', type: 'line', left: 360, top: 230, width: 140, height: 20 },
    { id: 'l2', type: 'line', left: 510, top: 230, width: 140, height: 20 },
    { id: 'lbl1', type: 'text', left: 200, top: 165, width: 160, height: 50, content: '<p>目标设定</p>' },
    { id: 'lbl2', type: 'text', left: 500, top: 165, width: 160, height: 50, content: '<p>资源约束</p>' },
    { id: 'lbl3', type: 'text', left: 350, top: 315, width: 160, height: 50, content: '<p>可行性反馈</p>' },
  ]
  const lesson = slideElementsToLesson(elements, {
    keyPoints: ['目标与资源的权衡', '反馈回路的作用', '计划可行性判断'],
  })
  assert.ok(lesson)
  const outline = lesson.blocks.find((block) => block.type === 'outline')
  assert.ok(outline, '应产出 outline 块')
  assert.deepEqual(outline.items, ['目标与资源的权衡', '反馈回路的作用', '计划可行性判断'])
  assert.ok(lesson.dropped.outlineFallback, '兜底应计数供观测')
  assert.ok(lesson.blocks.some((block) => block.type === 'diagram'))
})

test('E4 结构不足判失败（只有标题）', () => {
  const elements = [
    { id: 't1', type: 'text', left: 60, top: 50, width: 880, height: 76, content: '<p>只有标题</p>' },
  ]
  assert.equal(slideElementsToLesson(elements, {}), null)
})

test('E5 table / latex / 图形聚类适配', () => {
  const elements = [
    { id: 't1', type: 'text', left: 60, top: 50, width: 880, height: 60, content: '<p style="font-size:30px;">数据对照</p>' },
    {
      id: 'tb', type: 'table', left: 60, top: 150, width: 880, height: 200,
      data: [
        [{ text: '指标' }, { text: '计划A' }, { text: '计划B' }],
        [{ text: '成本' }, { text: '100' }, { text: '120' }],
      ],
    },
    { id: 'lx', type: 'latex', left: 60, top: 380, width: 400, height: 60, latex: '\\frac{a}{b}' },
    { id: 'sh1', type: 'shape', left: 500, top: 400, width: 100, height: 60, fill: '#000' },
    { id: 'sh2', type: 'shape', left: 620, top: 440, width: 100, height: 60, fill: '#000' },
    { id: 'lbl', type: 'text', left: 500, top: 460, width: 220, height: 30, content: '<p>输入</p>' },
    { id: 'lbl2', type: 'text', left: 500, top: 492, width: 220, height: 30, content: '<p>输出</p>' },
  ]
  const lesson = slideElementsToLesson(elements, { keyPoints: ['对照'] })
  assert.ok(lesson)
  const types = lesson.blocks.map((block) => block.type)
  assert.ok(types.includes('table'), 'table 元素应映射为 table 块')
  assert.ok(types.includes('diagram'), '相邻图形应聚类为 diagram 块')
  const outline = lesson.blocks.find((block) => block.type === 'outline')
  assert.ok(outline.items.some((item) => item.includes('\\frac{a}{b}')), 'latex 应进入路线要点')
})

// ─────────────────────────── F. sceneGenerator ───────────────────────────

test('F1 OpenMAIC quiz 题目适配（value/label/answer）', () => {
  const questions = adaptOpenmaicQuestions(
    [
      {
        id: 'q1', type: 'single', question: '计划的首要步骤是？',
        options: [
          { label: '确定目标', value: 'A' },
          { label: '直接执行', value: 'B' },
        ],
        answer: ['A'], analysis: '目标是起点', points: 10,
      },
      { id: 'q2', type: 'single', question: '缺选项', options: [{ label: 'x', value: 'A' }], answer: ['A'] },
      { id: 'q3', type: 'short_answer', question: '简述控制过程', analysis: '参考', commentPrompt: '细则' },
    ],
    '第三章',
  )
  assert.equal(questions.length, 2, '缺选项题目应被丢弃')
  assert.equal(questions[0].stem, '计划的首要步骤是？')
  assert.equal(questions[0].answerIndex, 0)
  assert.equal(questions[0].options[0], '确定目标')
  assert.equal(questions[0].chapter, '第三章')
  assert.equal(questions[1].kind, 'short_answer')
})

await testAsync('F2 generateOpenmaicScene：quiz 场景（假 aiCall）', async () => {
  const outline = {
    id: 'scene_2', type: 'quiz', title: '检索练习', keyPoints: ['目标'],
    quizConfig: { questionCount: 2, difficulty: 'medium', questionTypes: ['single'] },
  }
  const scene = await generateOpenmaicScene(
    outline,
    async () =>
      JSON.stringify([
        {
          id: 'q1', type: 'single', question: '以下哪项是计划的前提？',
          options: [
            { label: '明确目标', value: 'A' },
            { label: '无需目标', value: 'B' },
          ],
          answer: ['A'], analysis: '目标是计划起点',
        },
      ]),
    { chapter: '第三章' },
  )
  assert.equal(scene.kind, 'quiz')
  assert.equal(scene.questions.length, 1)
  assert.equal(scene.questions[0].answerIndex, 0)
  assert.ok(!scene.fallbackReason)
})

await testAsync('F3 generateOpenmaicScene：slide 场景走适配器', async () => {
  const outline = { id: 'scene_1', type: 'lecture', title: '计划的类型', keyPoints: ['战略'] }
  const scene = await generateOpenmaicScene(
    outline,
    async () =>
      JSON.stringify({
        background: { type: 'solid', color: '#ffffff' },
        elements: [
          { id: 't1', type: 'text', left: 60, top: 50, width: 880, height: 76, content: '<p style="font-size:32px;">计划的类型</p>' },
          { id: 't2', type: 'text', left: 60, top: 160, width: 880, height: 120, content: '<p style="font-size:18px;">• 战略计划</p><p style="font-size:18px;">• 战术计划</p>' },
          { id: 't3', type: 'text', left: 60, top: 320, width: 880, height: 80, content: '<p style="font-size:20px;">计划：对未来行动的事先安排</p>' },
        ],
      }),
    {},
  )
  assert.equal(scene.kind, 'board')
  assert.ok(scene.lesson, '应产出结构化 lesson')
  assert.ok(scene.lesson.blocks.some((block) => block.type === 'outline'))
  assert.ok(scene.lesson.blocks.some((block) => block.type === 'definition'))
})

await testAsync('F4 generateOpenmaicScene：模型输出无效 → fallbackReason', async () => {
  const scene = await generateOpenmaicScene(
    { id: 's', type: 'lecture', title: 't', keyPoints: ['k'] },
    async () => '完全无法解析的输出',
    {},
  )
  assert.ok(scene.fallbackReason, '应标记回退原因')
})

test('F5 widget-config 提取与受控块映射', () => {
  const html = `<!DOCTYPE html><html><body><script type="application/json" id="widget-config">
{"type":"simulation","concept":"抛体运动","description":"研究角度与初速度对射程的影响","variables":[{"name":"angle","label":"发射角","min":0,"max":90,"default":45,"unit":"°"},{"name":"velocity","label":"初速度","min":5,"max":40,"default":20,"unit":"m/s"}],"presets":[{"name":"命中靶心","variables":{"angle":30,"velocity":25}},{"name":"高抛","variables":{"angle":75,"velocity":30}}],"scientificModel":{"core_formulas":["R = v^2 sin(2θ)/g"],"mechanism":["水平匀速","竖直匀变速"],"constraints":["忽略空气阻力"],"forbidden_errors":["射程与角度成正比"]}}
</script></body></html>`
  const config = extractWidgetConfig(html)
  assert.ok(config)
  assert.equal(config.concept, '抛体运动')
  const built = widgetConfigToLesson(config, { title: '抛体运动', keyPoints: ['射程'] })
  assert.ok(built)
  const types = built.lesson.blocks.map((block) => block.type)
  assert.ok(types.includes('definition'))
  assert.ok(types.includes('table'), '变量应映射为参数表')
  assert.ok(types.includes('diagram'), '预设应映射为对照图')
  assert.ok(built.scientificModel)
  assert.equal(built.scientificModel.core_formulas.length, 1)
  assert.equal(built.dropped.html, 1, '自由 HTML 不渲染但应计数')
})

test('F6 widget-config 提取容忍 maxTokens 截断（无闭合 script）', () => {
  // live 实测回归：完整 simulation HTML 超 3000 token 被截断，
  // 严格匹配 </script> 会返回 null → interactive 场景整体回退
  const truncated = `<!DOCTYPE html><html><body><script type="application/json" id="widget-config">
{"type":"simulation","concept":"抛体运动","description":"研究角度与初速度对射程的影响","variables":[{"name":"angle","label":"发射角","min":0,"max":90,"default":45,"unit":"°"},{"name":"velocity","label":"初速度","min":5,"max":40,"default":20,"unit":"m/s"}],"presets":[{"name":"命中靶心","vari`
  const config = extractWidgetConfig(truncated)
  assert.ok(config, '截断 HTML 仍应提取到 widget-config')
  assert.equal(config.concept, '抛体运动')
  const built = widgetConfigToLesson(config, { title: '抛体运动', keyPoints: ['射程'] })
  assert.ok(built, '截断 config 经修复后仍应产出受控块')
})

// ─────────────────────────── G. scientificModel ───────────────────────────

test('G1 归一化：四字段清洗与空模型判定', () => {
  const model = normalizeScientificModel({
    core_formulas: ['a', 'a', ''],
    mechanism: 'not-array',
    constraints: ['c'],
    forbidden_errors: ['f'],
  })
  assert.deepEqual(model.core_formulas, ['a'])
  assert.deepEqual(model.mechanism, [])
  assert.equal(normalizeScientificModel({}), null)
  assert.equal(normalizeScientificModel(null), null)
})

test('G2 检查码：公式空/约束缺失/禁错命中', () => {
  const content = JSON.stringify({ kind: 'board', lesson: { blocks: [] } })
  const empty = checkScientificModel({ model: { core_formulas: [], mechanism: [], constraints: [], forbidden_errors: [] }, content })
  assert.equal(empty.issues.length, 0, '空模型不产码（normalize 后为 null）')

  const full = checkScientificModel({
    model: {
      core_formulas: ['R = v^2 sin(2θ)/g'],
      mechanism: ['分解为水平与竖直分量'],
      constraints: ['忽略空气阻力时成立'],
      forbidden_errors: ['射程随角度单调递增'],
    },
    content: '{"text":"在忽略空气阻力时成立的条件下，射程存在极大值"}',
  })
  const codes = full.issues.map((issue) => issue.code)
  assert.ok(!codes.includes('SCI-FORBIDDEN-HIT'), '内容未命中禁错')
  assert.ok(!codes.includes('SCI-CONSTRAINT-MISSING'), '约束关键词已出现')

  const hit = checkScientificModel({
    model: { core_formulas: ['f'], mechanism: ['m'], constraints: [], forbidden_errors: ['射程随角度单调递增'] },
    content: '学生常误以为射程随角度单调递增',
  })
  const hitCodes = hit.issues.map((issue) => issue.code)
  assert.ok(hitCodes.includes('SCI-FORBIDDEN-HIT'))
  const severity = hit.issues.find((issue) => issue.code === 'SCI-FORBIDDEN-HIT').severity
  assert.equal(severity, 'error', '禁错命中必须是 error 级')

  const missing = checkScientificModel({
    model: { core_formulas: ['f'], mechanism: ['m'], constraints: ['必须考虑摩擦力矩'], forbidden_errors: [] },
    content: '{"text":"完全无关的内容"}',
  })
  assert.ok(missing.issues.some((issue) => issue.code === 'SCI-CONSTRAINT-MISSING'))
})

// ─────────────────────────── 汇总 ───────────────────────────

console.log(`\nOpenMAIC 管线测试：${passed} 通过，${failures.length} 失败`)
if (failures.length) {
  console.error('失败项：')
  for (const item of failures) console.error(`  - ${item.name}: ${item.error.message}`)
  process.exit(1)
}
