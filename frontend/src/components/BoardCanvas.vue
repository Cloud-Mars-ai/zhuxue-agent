<script setup>
import { computed, ref, watch } from 'vue'
import SimulationStage from '@/components/simulations/SimulationStage.vue'

const props = defineProps({
  lesson: { type: Object, default: null },
  visibleCount: { type: Number, default: 999 },
  interactive: { type: Boolean, default: true },
  landscape: { type: Boolean, default: false },
})

const emit = defineEmits(['answer'])
const selectedAnswers = ref({})
const animationSteps = ref({})
const treeStages = ref({})
const revealedBlanks = ref({})
const revealedWrong = ref({})
const judgeAnswers = ref({})
const revealedRules = ref({})

/**
 * 常驻面板（C5）：persistent block 不随揭示进度撤下，
 * 与已揭示 block 拼接后渲染；进场动效由 transition 字段驱动（C2/T1-T12）。
 */
const visibleBlocks = computed(() => {
  const blocks = props.lesson?.blocks || []
  const limit = Math.max(0, props.visibleCount)
  const head = blocks.slice(0, limit)
  const pinned = blocks.filter((block, index) => block.persistent && index >= limit)
  return [...head, ...pinned]
})

function toneLabel(tone) {
  if (tone === 'warn') return '易错点'
  if (tone === 'idea') return '理解抓手'
  if (tone === 'success') return '做对了'
  return '学习提示'
}

function chooseAnswer(question, option) {
  if (!props.interactive) return
  selectedAnswers.value = { ...selectedAnswers.value, [question]: option }
  emit('answer', { question, option })
}

function blockKey(block, index) {
  return `${block.type}-${index}`
}

/** 进场动效类名：pop/fade/slide-left/slide-right（默认 pop 由 CSS 兜底）。 */
function enterClass(block) {
  if (!block.transition?.enter) return ''
  return `enter-${block.transition.enter}`
}

/** transition 字段 → CSS 变量，供 TransitionGroup 的 enter-active 过渡消费。 */
function blockStyle(block) {
  const transition = block.transition
  if (!transition) return undefined
  return {
    '--block-duration': `${transition.durationMs ?? 420}ms`,
    '--block-delay': `${transition.delayMs ?? 0}ms`,
    '--block-easing':
      transition.enter === 'fade' ? 'ease' : 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  }
}

function animationIndex(block, index) {
  const steps = block.steps || []
  return Math.min(animationSteps.value[blockKey(block, index)] || 0, Math.max(0, steps.length - 1))
}

function animationFrame(block, index) {
  return block.steps?.[animationIndex(block, index)] || null
}

function setAnimationStep(block, index, nextIndex) {
  const steps = block.steps || []
  animationSteps.value = {
    ...animationSteps.value,
    [blockKey(block, index)]: Math.min(Math.max(0, nextIndex), Math.max(0, steps.length - 1)),
  }
}

/** 分类树阶段生长（T4/T5）：stages 决定当前可见分支与展开分支。 */
function treeStageIndex(block, index) {
  const stages = block.stages || []
  if (stages.length <= 1) return 0
  return Math.min(treeStages.value[blockKey(block, index)] || 0, stages.length - 1)
}

function treeVisibleBranches(block, index) {
  const stages = block.stages || []
  if (!stages.length) return block.branches.map((_, branchIndex) => branchIndex)
  return stages[treeStageIndex(block, index)]?.branches || []
}

function treeBranchExpanded(block, index, branchIndex) {
  const stages = block.stages || []
  if (!stages.length) return true
  return !!stages[treeStageIndex(block, index)]?.expand?.includes(branchIndex)
}

function setTreeStage(block, index, nextIndex) {
  const stages = block.stages || []
  if (stages.length <= 1) return
  treeStages.value = {
    ...treeStages.value,
    [blockKey(block, index)]: Math.min(Math.max(0, nextIndex), stages.length - 1),
  }
}

/** 留白填空（D2）：点击空位揭示答案。 */
function blankParts(block) {
  return block.prompt.split('___').map((part, partIndex) => ({
    text: part,
    answer: block.answers?.[partIndex] || '',
  }))
}

function blankRevealed(block, index, blankIndex) {
  return (revealedBlanks.value[blockKey(block, index)] || []).includes(blankIndex)
}

function revealBlank(block, index, blankIndex) {
  if (!props.interactive) return
  const key = blockKey(block, index)
  const revealed = new Set(revealedBlanks.value[key] || [])
  revealed.add(blankIndex)
  revealedBlanks.value = { ...revealedBlanks.value, [key]: [...revealed] }
}

/** 错解先行（B4）：先看错解，点击后定位错误并给出正解。 */
function wrongRevealed(block, index) {
  return !!revealedWrong.value[blockKey(block, index)]
}

function revealWrong(block, index) {
  revealedWrong.value = { ...revealedWrong.value, [blockKey(block, index)]: true }
}

/** 判断对错（D3）。 */
function judgeChoice(block, index) {
  return judgeAnswers.value[blockKey(block, index)] ?? null
}

function chooseJudge(block, index, choice) {
  if (!props.interactive) return
  judgeAnswers.value = { ...judgeAnswers.value, [blockKey(block, index)]: choice }
}

/** 观察归纳（B6）：点击后揭晓规则。 */
function ruleRevealed(block, index) {
  return !!revealedRules.value[blockKey(block, index)]
}

function revealRule(block, index) {
  revealedRules.value = { ...revealedRules.value, [blockKey(block, index)]: true }
}

/** 文本高亮（C6）：marks.target 在正文中定位，重叠的标记跳过。 */
function markedSegments(value, marks) {
  const source = String(value || '')
  if (!source || !marks?.length) return [{ text: source, style: null }]
  const matches = []
  marks.forEach((mark) => {
    const at = source.indexOf(mark.target)
    if (at >= 0) matches.push({ start: at, end: at + mark.target.length, style: mark.style })
  })
  matches.sort((a, b) => a.start - b.start)
  const segments = []
  let cursor = 0
  for (const match of matches) {
    if (match.start < cursor) continue
    if (match.start > cursor) segments.push({ text: source.slice(cursor, match.start), style: null })
    segments.push({ text: source.slice(match.start, match.end), style: match.style })
    cursor = match.end
  }
  if (cursor < source.length) segments.push({ text: source.slice(cursor), style: null })
  return segments.length ? segments : [{ text: source, style: null }]
}

function toneColor(tone) {
  if (tone === 'negative') return 'var(--board-negative)'
  if (tone === 'positive') return 'var(--board-positive)'
  if (tone === 'warn') return 'var(--board-warn)'
  if (tone === 'current') return 'var(--board-current)'
  return 'var(--board-accent)'
}

/** 数轴几何：viewBox 0 0 640 150，轴线 y=96。 */
const LINE_LEFT = 44
const LINE_RIGHT = 596
function numberLineX(block, value) {
  const span = block.max - block.min
  const ratio = span > 0 ? (value - block.min) / span : 0
  return LINE_LEFT + ratio * (LINE_RIGHT - LINE_LEFT)
}

/**
 * 板书稳定签名：章节/标题/副标题/block 结构一致即视为同一板书。
 * 不能直接 watch props.lesson 的对象标识——课程管线里的 updateScene
 * （讲稿、证据账本、修复记录等补写）会经 repairDeep 深拷贝 content，
 * 同一板书被反复替换出新对象；按标识监听会把用户已进行的
 * 答题选择、动画步进、揭示进度误清（E2E「下一步后计数回弹」即此）。
 */
function lessonSignature(lesson) {
  if (!lesson) return ''
  const blocks = Array.isArray(lesson.blocks) ? lesson.blocks : []
  return [
    lesson.chapter || '',
    lesson.title || '',
    lesson.subtitle || '',
    String(blocks.length),
    blocks.map((block) => `${block.type}:${block.title || ''}`).join(','),
  ].join('|')
}

watch(
  () => lessonSignature(props.lesson),
  () => {
    selectedAnswers.value = {}
    animationSteps.value = {}
    treeStages.value = {}
    revealedBlanks.value = {}
    revealedWrong.value = {}
    judgeAnswers.value = {}
    revealedRules.value = {}
  },
)
</script>

<template>
  <article
    v-if="lesson"
    class="board-canvas"
    :class="{ 'is-landscape': landscape }"
    data-testid="board-canvas"
  >
    <header class="board-title">
      <span class="board-kicker">本节板书 · {{ lesson.chapter }}</span>
      <h1>{{ lesson.title }}</h1>
      <p>{{ lesson.subtitle }}</p>
    </header>

    <TransitionGroup name="block" tag="div" class="board-blocks">
      <section
        v-for="(block, index) in visibleBlocks"
        :key="`${block.type}-${index}`"
        class="board-block"
        :class="[`is-${block.type}`, enterClass(block)]"
        :data-block-index="index"
        :style="blockStyle(block)"
      >
        <template v-if="block.type === 'outline'">
          <h2>{{ block.title }}</h2>
          <ol class="outline-list">
            <li v-for="item in block.items" :key="item">
              <span class="outline-dot" />
              <span>{{ item }}</span>
            </li>
          </ol>
        </template>

        <template v-else-if="block.type === 'definition'">
          <h2>{{ block.title }}：{{ block.term }}</h2>
          <p class="definition-anchor"><span>具体例子：</span>{{ block.concreteAnchor }}</p>
          <p class="definition-text">
            <span>定义：</span>
            <template v-for="(segment, segmentIndex) in markedSegments(block.definition, block.marks)" :key="segmentIndex">
              <span v-if="segment.style" class="mark" :class="`mark-${segment.style}`">{{ segment.text }}</span>
              <template v-else>{{ segment.text }}</template>
            </template>
          </p>
          <p v-if="block.analogy" class="analogy">
            <span>形象比喻：</span>
            {{ block.analogy }}
          </p>
          <div v-if="block.method?.length" class="definition-method">
            <span>方法：</span>
            <ol>
              <li v-for="step in block.method" :key="step">{{ step }}</li>
            </ol>
          </div>
          <p v-if="block.verify" class="definition-verify"><span>验证：</span>{{ block.verify }}</p>
        </template>

        <template v-else-if="block.type === 'table'">
          <h2>{{ block.title }}</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th v-for="column in block.columns" :key="column">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in block.rows" :key="rowIndex">
                  <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <template v-else-if="block.type === 'diagram'">
          <h2>{{ block.title }}</h2>
          <div class="diagram-chain">
            <template v-for="(node, nodeIndex) in block.nodes" :key="node.label">
              <div class="diagram-node">
                <strong>{{ node.label }}</strong>
                <span>{{ node.note }}</span>
              </div>
              <span v-if="nodeIndex < block.nodes.length - 1" class="diagram-arrow">→</span>
            </template>
          </div>
          <p v-if="block.caption" class="diagram-caption">{{ block.caption }}</p>
        </template>

        <template v-else-if="block.type === 'animation'">
          <h2>{{ block.title }}</h2>
          <div class="animation-demo">
            <div class="animation-stage">
              <Transition name="frame" mode="out-in">
                <div
                  v-if="animationFrame(block, index)"
                  :key="animationIndex(block, index)"
                  class="animation-frame"
                >
                  <span class="animation-count">
                    {{ animationIndex(block, index) + 1 }} / {{ block.steps.length }}
                  </span>
                  <strong>{{ animationFrame(block, index).label }}</strong>
                  <p>{{ animationFrame(block, index).detail }}</p>
                </div>
              </Transition>
            </div>
            <div class="animation-controls">
              <button
                type="button"
                :disabled="!interactive || animationIndex(block, index) === 0"
                @click="setAnimationStep(block, index, animationIndex(block, index) - 1)"
              >
                上一步
              </button>
              <button
                type="button"
                :disabled="
                  !interactive || animationIndex(block, index) >= block.steps.length - 1
                "
                @click="setAnimationStep(block, index, animationIndex(block, index) + 1)"
              >
                下一步
              </button>
              <button
                type="button"
                :disabled="!interactive"
                @click="setAnimationStep(block, index, 0)"
              >
                重播
              </button>
            </div>
            <div class="animation-track" aria-hidden="true">
              <button
                v-for="(step, stepIndex) in block.steps"
                :key="`${step.label}-${stepIndex}`"
                type="button"
                :class="{ active: stepIndex <= animationIndex(block, index) }"
                :disabled="!interactive"
                :aria-label="`跳到：${step.label}`"
                @click="setAnimationStep(block, index, stepIndex)"
              />
            </div>
          </div>
          <p v-if="block.caption" class="diagram-caption">{{ block.caption }}</p>
        </template>

        <template v-else-if="block.type === 'simulation'">
          <h2>{{ block.title }}</h2>
          <SimulationStage :block="block" :interactive="interactive" />
        </template>

        <template v-else-if="block.type === 'callout'">
          <div class="callout" :class="`tone-${block.tone}`">
            <span class="callout-label">{{ toneLabel(block.tone) }}：{{ block.title }}</span>
            <p>
              <template v-for="(segment, segmentIndex) in markedSegments(block.text, block.marks)" :key="segmentIndex">
                <span v-if="segment.style" class="mark" :class="`mark-${segment.style}`">{{ segment.text }}</span>
                <template v-else>{{ segment.text }}</template>
              </template>
            </p>
            <p v-if="block.mnemonic" class="callout-mnemonic">口诀：{{ block.mnemonic }}</p>
          </div>
        </template>

        <template v-else-if="block.type === 'question'">
          <div class="question-card">
            <span class="block-label">
              {{ block.by === 'mascot' ? '吉祥物提问' : block.title }}
            </span>
            <h2>{{ block.prompt }}</h2>
            <div v-if="block.options?.length" class="question-options">
              <button
                v-for="(option, optionIndex) in block.options"
                :key="option"
                type="button"
                :disabled="!interactive"
                :class="{ selected: selectedAnswers[block.prompt] === option }"
                :aria-pressed="selectedAnswers[block.prompt] === option"
                @click="chooseAnswer(block.prompt, option)"
              >
                <span>{{ String.fromCharCode(65 + optionIndex) }}</span>
                {{ option }}
              </button>
            </div>
            <p v-if="selectedAnswers[block.prompt]" class="question-selection">
              已选择「{{ selectedAnswers[block.prompt] }}」。可以继续在对话栏补充你的判断依据。
            </p>
            <p class="question-tip">也可以直接在右侧输入自己的判断。</p>
          </div>
        </template>

        <!-- C4 图表族：分类树（T4 阶段生长） -->
        <template v-else-if="block.type === 'classification-tree'">
          <h2>{{ block.title }}</h2>
          <div class="tree-stage">
            <div class="tree-root">
              <strong>{{ block.root.label }}</strong>
              <span v-if="block.root.note">{{ block.root.note }}</span>
            </div>
            <div class="tree-branches">
              <div
                v-for="(branch, branchIndex) in block.branches"
                :key="branch.label"
                class="tree-branch"
                :class="{ 'is-hidden': !treeVisibleBranches(block, index).includes(branchIndex) }"
              >
                <div class="tree-branch-head">
                  <strong>{{ branch.label }}</strong>
                  <span v-if="branch.note">{{ branch.note }}</span>
                </div>
                <div v-if="treeBranchExpanded(block, index, branchIndex)" class="tree-children">
                  <span v-for="child in branch.children" :key="child.label" class="tree-child">
                    {{ child.label }}
                    <small v-if="child.note">{{ child.note }}</small>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="block.stages?.length > 1" class="animation-controls">
            <button
              type="button"
              :disabled="!interactive || treeStageIndex(block, index) === 0"
              @click="setTreeStage(block, index, treeStageIndex(block, index) - 1)"
            >
              上一阶段
            </button>
            <button
              type="button"
              :disabled="!interactive || treeStageIndex(block, index) >= block.stages.length - 1"
              @click="setTreeStage(block, index, treeStageIndex(block, index) + 1)"
            >
              下一阶段
            </button>
            <span class="tree-stage-label">
              {{ treeStageIndex(block, index) + 1 }} / {{ block.stages.length }}
              {{ block.stages[treeStageIndex(block, index)]?.label }}
            </span>
          </div>
          <p v-if="block.caption" class="diagram-caption">{{ block.caption }}</p>
        </template>

        <!-- C4 图表族：数轴 -->
        <template v-else-if="block.type === 'number-line'">
          <h2>{{ block.title }}</h2>
          <svg class="number-line" viewBox="0 0 640 150" role="img" :aria-label="block.title">
            <line
              :x1="LINE_LEFT"
              y1="96"
              :x2="LINE_RIGHT"
              y2="96"
              stroke="var(--board-line)"
              stroke-width="1.5"
            />
            <line
              v-for="segment in block.segments"
              :key="`${segment.from}-${segment.to}`"
              :x1="numberLineX(block, segment.from)"
              y1="96"
              :x2="numberLineX(block, segment.to)"
              y2="96"
              :stroke="toneColor(segment.tone)"
              stroke-width="7"
              stroke-linecap="round"
              opacity="0.32"
            />
            <g v-for="tick in block.ticks" :key="`tick-${tick.value}`">
              <line
                :x1="numberLineX(block, tick.value)"
                y1="88"
                :x2="numberLineX(block, tick.value)"
                y2="104"
                stroke="var(--board-line)"
                stroke-width="1.5"
              />
              <text
                :x="numberLineX(block, tick.value)"
                y="122"
                text-anchor="middle"
                class="number-line-tick"
              >
                {{ tick.label }}
              </text>
            </g>
            <g v-for="point in block.points" :key="`point-${point.value}-${point.label}`">
              <text
                :x="numberLineX(block, point.value)"
                y="62"
                text-anchor="middle"
                class="number-line-point"
                :fill="toneColor(point.tone)"
              >
                {{ point.label }}
              </text>
              <circle
                :cx="numberLineX(block, point.value)"
                cy="96"
                r="7"
                :fill="toneColor(point.tone)"
                stroke="var(--board-paper)"
                stroke-width="2"
              />
            </g>
            <text
              v-for="segment in block.segments"
              :key="`seg-label-${segment.from}-${segment.to}`"
              :x="(numberLineX(block, segment.from) + numberLineX(block, segment.to)) / 2"
              y="82"
              text-anchor="middle"
              class="number-line-segment"
              :fill="toneColor(segment.tone)"
            >
              {{ segment.label }}
            </text>
          </svg>
          <p v-if="block.caption" class="diagram-caption">{{ block.caption }}</p>
        </template>

        <!-- D2 留白填空 -->
        <template v-else-if="block.type === 'fill-blank'">
          <h2>{{ block.title }}</h2>
          <p class="fill-blank-prompt">
            <template v-for="(part, partIndex) in blankParts(block)" :key="partIndex">
              <span>{{ part.text }}</span>
              <button
                v-if="partIndex < blankParts(block).length - 1"
                type="button"
                class="fill-blank-slot"
                :class="{ filled: blankRevealed(block, index, partIndex) }"
                :disabled="!interactive"
                @click="revealBlank(block, index, partIndex)"
              >
                {{ blankRevealed(block, index, partIndex) ? part.answer : '点击填空' }}
              </button>
            </template>
          </p>
          <p v-if="block.hint" class="diagram-caption">提示：{{ block.hint }}</p>
        </template>

        <!-- B4 错解先行 -->
        <template v-else-if="block.type === 'wrong-first'">
          <h2>{{ block.title }}</h2>
          <div class="wrong-first">
            <p class="wrong-first-label">先看一份常见错解：</p>
            <ol class="wrong-steps">
              <li
                v-for="(step, stepIndex) in block.wrongSteps"
                :key="stepIndex"
                :class="{ 'is-error': wrongRevealed(block, index) && stepIndex === block.errorIndex }"
              >
                <span class="wrong-step-index">{{ stepIndex + 1 }}</span>
                {{ step }}
              </li>
            </ol>
            <button v-if="!wrongRevealed(block, index)" type="button" class="ghost-button" :disabled="!interactive" @click="revealWrong(block, index)">
              我同意，看看错在哪
            </button>
            <template v-else>
              <p class="wrong-first-hint">
                第 {{ block.errorIndex + 1 }} 步错了：{{ block.errorHint || '对照正确做法想一想' }}
              </p>
              <p class="wrong-first-label">正确做法：</p>
              <ol class="correct-steps">
                <li v-for="(step, stepIndex) in block.correctSteps" :key="stepIndex">
                  <span class="wrong-step-index">{{ stepIndex + 1 }}</span>
                  {{ step }}
                </li>
              </ol>
              <p v-if="block.takeaway" class="wrong-first-takeaway">带走：{{ block.takeaway }}</p>
            </template>
          </div>
        </template>

        <!-- D3 判断对错 -->
        <template v-else-if="block.type === 'judge'">
          <h2>{{ block.title }}</h2>
          <div class="judge-card">
            <p class="judge-statement">
              <template v-for="(segment, segmentIndex) in markedSegments(block.statement, block.marks)" :key="segmentIndex">
                <span v-if="segment.style" class="mark" :class="`mark-${segment.style}`">{{ segment.text }}</span>
                <template v-else>{{ segment.text }}</template>
              </template>
            </p>
            <div class="judge-options">
              <button
                v-for="choice in [true, false]"
                :key="String(choice)"
                type="button"
                class="judge-button"
                :class="{
                  selected: judgeChoice(block, index) === choice,
                  'is-correct': judgeChoice(block, index) !== null && choice === block.answer,
                  'is-wrong': judgeChoice(block, index) === choice && choice !== block.answer,
                }"
                :disabled="!interactive"
                @click="chooseJudge(block, index, choice)"
              >
                {{ choice ? '对' : '错' }}
              </button>
            </div>
            <p v-if="judgeChoice(block, index) !== null" class="judge-explanation">
              {{ judgeChoice(block, index) === block.answer ? '答对了。' : '再想想。' }}
              {{ block.explanation }}
            </p>
          </div>
        </template>

        <!-- C4 情形讨论表 -->
        <template v-else-if="block.type === 'case-table'">
          <h2>{{ block.title }}</h2>
          <ul class="case-list">
            <li v-for="item in block.cases" :key="item.condition" :style="{ borderLeftColor: toneColor(item.tone) }">
              <strong>{{ item.condition }}</strong>
              <span>{{ item.conclusion }}</span>
            </li>
          </ul>
          <p v-if="block.caption" class="diagram-caption">{{ block.caption }}</p>
        </template>

        <!-- B6 观察归纳 -->
        <template v-else-if="block.type === 'induction'">
          <h2>{{ block.title }}</h2>
          <ol class="induction-examples">
            <li v-for="example in block.examples" :key="example">{{ example }}</li>
          </ol>
          <button v-if="!ruleRevealed(block, index)" type="button" class="ghost-button" :disabled="!interactive" @click="revealRule(block, index)">
            归纳一下规律
          </button>
          <p v-else class="induction-rule">规律：{{ block.rule }}</p>
          <p v-if="block.hint && !ruleRevealed(block, index)" class="diagram-caption">提示：{{ block.hint }}</p>
        </template>

        <!-- B7 一题多解 -->
        <template v-else-if="block.type === 'multi-solution'">
          <h2>{{ block.title }}</h2>
          <p class="multi-problem">{{ block.problem }}</p>
          <div class="multi-methods">
            <article v-for="method in block.methods" :key="method.name" class="multi-method">
              <header>
                <strong>{{ method.name }}</strong>
                <span v-if="method.tag" class="method-tag">{{ method.tag }}</span>
              </header>
              <ol>
                <li v-for="step in method.steps" :key="step">{{ step }}</li>
              </ol>
            </article>
          </div>
          <p v-if="block.comparison" class="diagram-caption">{{ block.comparison }}</p>
        </template>
      </section>
    </TransitionGroup>
  </article>
</template>

<style scoped>
.board-canvas {
  position: relative;
  min-height: 560px;
  padding: 34px 42px 58px;
  color: var(--board-ink);
  background-color: var(--board-paper);
  background-image: radial-gradient(var(--board-grid) 1px, transparent 1px);
  background-size: 18px 18px;
  border: 1px solid color-mix(in srgb, var(--board-line) 14%, var(--card-border));
  border-radius: var(--radius-md);
  font-family: var(--board-font);
  font-size: 15px;
  line-height: 1.82;
  letter-spacing: 0.015em;
}

.board-canvas.is-landscape .board-blocks {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.board-title {
  max-width: 880px;
  margin-bottom: 30px;
  padding-bottom: 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--board-line) 18%, transparent);
}

.board-kicker,
.block-label,
.callout-label {
  color: var(--board-faint);
  font-family: var(--board-font);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.board-title h1 {
  width: fit-content;
  margin: 8px 0 7px;
  padding: 0 5px 2px 0;
  color: var(--board-heading);
  background: linear-gradient(
    to top,
    var(--board-highlight) 0,
    var(--board-highlight) 38%,
    transparent 38%
  );
  font-family: var(--board-display);
  font-size: clamp(26px, 2.6vw, 36px);
  font-weight: 600;
  line-height: 1.26;
  letter-spacing: 0.025em;
}

.board-title p {
  margin: 0;
  color: var(--board-muted);
  font-size: 14px;
  line-height: 1.75;
}

.board-blocks {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: start;
  gap: 34px 52px;
}

.board-block {
  min-width: 0;
  padding: 0;
  background: transparent;
  border: 0;
}

.board-block.is-outline,
.board-block.is-table,
.board-block.is-diagram,
.board-block.is-case-table,
.board-block.is-classification-tree,
.board-block.is-number-line,
.board-block.is-induction,
.board-block.is-multi-solution {
  grid-column: span 1;
}

.board-block.is-question,
.board-block.is-animation,
.board-block.is-simulation,
.board-block.is-wrong-first,
.board-block.is-fill-blank,
.board-block.is-judge {
  grid-column: 1 / -1;
}

.board-block h2 {
  width: fit-content;
  margin: 0 0 15px;
  padding: 0 5px 2px 0;
  color: var(--board-heading);
  background: linear-gradient(
    to top,
    var(--board-highlight) 0,
    var(--board-highlight) 42%,
    transparent 42%
  );
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  font-family: var(--board-display);
  font-size: 19px;
  font-weight: 600;
  line-height: 1.42;
  letter-spacing: 0.035em;
}

.outline-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0 0 0 8px;
  list-style: none;
}

.outline-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: var(--board-ink);
  font-size: 15px;
  line-height: 1.78;
}

.outline-dot {
  flex: none;
  width: 8px;
  height: 8px;
  display: grid;
  place-items: center;
  margin-top: 9px;
  color: transparent;
  background: var(--board-paper);
  border: 1px solid var(--board-accent);
  border-radius: 50%;
  font-size: 0;
}

.definition-text,
.definition-anchor,
.definition-method,
.definition-verify {
  margin: 0 0 10px;
  color: var(--board-ink);
  font-size: 15px;
  line-height: 1.85;
}

.definition-anchor {
  color: var(--board-heading-alt);
}

.definition-text span,
.definition-anchor span,
.analogy span,
.definition-method span,
.definition-verify span {
  color: var(--board-heading-alt);
  font-weight: 600;
}

.definition-method ol {
  margin: 6px 0 0;
  padding-left: 22px;
}

.definition-verify {
  color: var(--board-muted);
  font-size: 13.5px;
}

.analogy {
  margin: 0;
  color: var(--board-ink);
  font-size: 15px;
  line-height: 1.85;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  color: var(--board-ink);
  font-size: 14px;
  line-height: 1.65;
}

th,
td {
  padding: 9px 11px;
  border: 1px solid var(--board-line);
  text-align: left;
  vertical-align: top;
}

th {
  color: var(--board-heading-alt);
  background: color-mix(in srgb, var(--board-accent-soft) 70%, transparent);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.035em;
}

.diagram-chain {
  display: flex;
  align-items: stretch;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 0 5px;
}

.diagram-node {
  flex: 1 0 110px;
  min-height: 84px;
  padding: 12px 13px;
  background: color-mix(in srgb, var(--board-paper) 84%, transparent);
  border: 1px solid var(--board-line);
  border-radius: 3px;
}

.diagram-node strong,
.diagram-node span {
  display: block;
}

.diagram-node strong {
  color: var(--board-heading-alt);
  font-family: var(--board-display);
  font-size: 13px;
  font-weight: 600;
}

.diagram-node span {
  margin-top: 6px;
  color: var(--board-muted);
  font-size: 11.5px;
  line-height: 1.55;
}

.diagram-arrow {
  align-self: center;
  color: var(--board-accent);
  font-size: 16px;
}

.diagram-caption {
  margin: 10px 0 0;
  color: var(--board-faint);
  font-size: 11.5px;
  line-height: 1.65;
}

.animation-demo {
  padding: 16px;
  background: color-mix(in srgb, var(--board-accent-soft) 46%, var(--board-paper));
  border: 1px solid var(--board-line);
  border-radius: 4px;
}

.animation-stage {
  min-height: 118px;
  display: grid;
  align-items: center;
  padding: 16px 18px;
  background: color-mix(in srgb, var(--board-paper) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--board-line) 70%, transparent);
  border-radius: 3px;
}

.animation-frame strong,
.animation-frame p {
  display: block;
}

.animation-frame strong {
  margin: 9px 0 5px;
  color: var(--board-heading-alt);
  font-family: var(--board-display);
  font-size: 18px;
}

.animation-frame p {
  margin: 0;
  color: var(--board-ink);
  font-size: 13.5px;
  line-height: 1.7;
}

.animation-count {
  color: var(--board-faint);
  font-family: var(--font-mono);
  font-size: 10px;
}

.animation-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.tree-stage-label {
  color: var(--board-faint);
  font-size: 11px;
}

.animation-controls button {
  padding: 6px 12px;
  color: var(--board-heading-alt);
  background: var(--board-paper);
  border: 1px solid var(--board-line);
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.animation-controls button:hover:not(:disabled) {
  border-color: var(--board-accent);
}

.animation-controls button:disabled {
  cursor: default;
  opacity: 0.45;
}

.animation-track {
  display: flex;
  gap: 5px;
  margin-top: 10px;
}

.animation-track button {
  flex: 1;
  height: 4px;
  padding: 0;
  background: var(--board-line);
  border: 0;
  border-radius: var(--radius-pill);
  cursor: pointer;
}

.animation-track button.active {
  background: var(--board-accent);
}

.frame-enter-active,
.frame-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.frame-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.frame-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

/* —— 文本高亮标记（C6/T8/T11/T12） —— */
.mark {
  padding: 0 2px;
  border-radius: 2px;
}

.mark-box {
  background: var(--board-current-soft);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--board-current) 45%, transparent);
}

.mark-underline {
  text-decoration: underline wavy var(--board-negative);
  text-underline-offset: 3px;
}

.mark-circle,
.mark-circle-char {
  border: 1.5px solid var(--board-negative);
  border-radius: 999px;
  padding: 0 4px;
  color: var(--board-negative);
}

.mark-cross {
  color: var(--board-negative);
  text-decoration: line-through;
}

.mark-check {
  color: var(--board-positive);
  font-weight: 600;
}

.mark-stop {
  background: var(--board-negative-soft);
  color: var(--board-negative);
  font-weight: 600;
}

.callout {
  padding: 12px 14px;
  background: var(--board-note);
  border-left: 3px solid var(--board-accent);
}

.callout.tone-warn {
  background: color-mix(in srgb, var(--board-warn-soft) 78%, var(--board-paper));
  border-left-color: var(--board-warn);
}

.callout.tone-idea {
  background: var(--board-accent-soft);
  border-left-color: var(--board-accent);
}

.callout.tone-note {
  background: var(--board-note);
}

.callout.tone-success {
  background: color-mix(in srgb, var(--board-positive-soft) 80%, var(--board-paper));
  border-left-color: var(--board-positive);
}

.callout p {
  margin: 7px 0 0;
  color: var(--board-ink);
  font-size: 13px;
  line-height: 1.72;
}

.callout-mnemonic {
  color: var(--board-heading-alt) !important;
  font-family: var(--board-display);
  font-weight: 600;
}

.question-card {
  padding: 18px 20px 17px;
  background: color-mix(in srgb, var(--board-highlight) 44%, var(--board-paper));
  border: 1px solid color-mix(in srgb, var(--board-line) 24%, transparent);
  border-radius: 4px;
}

.question-card h2 {
  margin: 8px 0 14px;
  background: none;
  font-size: 17px;
}

.question-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.question-options button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px 7px 7px;
  color: var(--board-ink);
  background: var(--board-paper);
  border: 1px solid var(--board-line);
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.question-options button:hover {
  border-color: var(--board-accent);
}

.question-options button.selected {
  color: var(--board-heading);
  background: var(--board-accent-soft);
  border-color: var(--board-accent);
}

.question-options button span {
  width: 21px;
  height: 21px;
  display: grid;
  place-items: center;
  color: var(--board-paper);
  background: var(--board-accent);
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 10px;
}

.question-tip {
  margin: 11px 0 0;
  color: var(--board-faint);
  font-size: 10.5px;
}

.question-selection {
  margin: 9px 0 0;
  color: var(--board-heading-alt);
  font-size: 11px;
  line-height: 1.6;
}

/* —— 分类树（T4 阶段生长） —— */
.tree-stage {
  padding: 14px 16px;
  background: color-mix(in srgb, var(--board-accent-soft) 40%, var(--board-paper));
  border: 1px solid var(--board-line);
  border-radius: 4px;
}

.tree-root {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed color-mix(in srgb, var(--board-line) 45%, transparent);
}

.tree-root strong {
  color: var(--board-heading);
  font-family: var(--board-display);
  font-size: 16px;
}

.tree-root span {
  color: var(--board-muted);
  font-size: 11.5px;
}

.tree-branches {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.tree-branch {
  flex: 1 0 150px;
  padding: 10px 12px;
  background: var(--board-paper);
  border: 1px solid var(--board-line);
  border-radius: 3px;
  transition: opacity 0.3s ease;
}

.tree-branch.is-hidden {
  opacity: 0.28;
}

.tree-branch-head strong {
  display: block;
  color: var(--board-heading-alt);
  font-family: var(--board-display);
  font-size: 14px;
}

.tree-branch-head span {
  display: block;
  margin-top: 3px;
  color: var(--board-muted);
  font-size: 11px;
}

.tree-children {
  display: grid;
  gap: 6px;
  margin-top: 9px;
  padding-top: 9px;
  border-top: 1px dashed color-mix(in srgb, var(--board-line) 40%, transparent);
}

.tree-child {
  display: block;
  padding: 4px 8px;
  background: color-mix(in srgb, var(--board-current-soft) 60%, transparent);
  border-radius: 3px;
  color: var(--board-ink);
  font-size: 12.5px;
}

.tree-child small {
  display: block;
  color: var(--board-faint);
  font-size: 10.5px;
}

/* —— 数轴 —— */
.number-line {
  width: 100%;
  height: auto;
}

.number-line-tick {
  fill: var(--board-muted);
  font-family: var(--font-mono);
  font-size: 12px;
}

.number-line-point {
  font-family: var(--board-display);
  font-size: 13px;
  font-weight: 600;
}

.number-line-segment {
  font-size: 11px;
}

/* —— 留白填空（D2） —— */
.fill-blank-prompt {
  margin: 0;
  color: var(--board-ink);
  font-size: 16px;
  line-height: 2.1;
}

.fill-blank-slot {
  display: inline-grid;
  place-items: center;
  min-width: 74px;
  margin: 0 6px;
  padding: 3px 12px;
  color: var(--board-faint);
  background: var(--board-paper);
  border: 1px dashed var(--board-accent);
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.fill-blank-slot:hover:not(:disabled) {
  border-color: var(--board-current);
  color: var(--board-current);
}

.fill-blank-slot.filled {
  color: var(--board-positive);
  background: var(--board-positive-soft);
  border-style: solid;
  border-color: var(--board-positive);
  font-weight: 600;
  cursor: default;
}

/* —— 错解先行（B4） —— */
.wrong-first {
  padding: 16px 18px;
  background: color-mix(in srgb, var(--board-negative-soft) 40%, var(--board-paper));
  border: 1px solid color-mix(in srgb, var(--board-negative) 22%, transparent);
  border-radius: 4px;
}

.wrong-first-label {
  margin: 0 0 8px;
  color: var(--board-muted);
  font-size: 12px;
}

.wrong-steps,
.correct-steps {
  display: grid;
  gap: 7px;
  margin: 0 0 12px;
  padding: 0;
  list-style: none;
}

.wrong-steps li,
.correct-steps li {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 7px 11px;
  background: var(--board-paper);
  border: 1px solid var(--board-line);
  border-radius: 3px;
  color: var(--board-ink);
  font-size: 13.5px;
}

.wrong-steps li.is-error {
  border-color: var(--board-negative);
  background: var(--board-negative-soft);
  color: var(--board-negative);
}

.correct-steps li {
  border-color: color-mix(in srgb, var(--board-positive) 35%, transparent);
}

.wrong-step-index {
  flex: none;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  color: var(--board-paper);
  background: var(--board-muted);
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 10px;
}

.is-error .wrong-step-index {
  background: var(--board-negative);
}

.wrong-first-hint {
  margin: 0 0 10px;
  color: var(--board-negative);
  font-size: 13px;
  font-weight: 600;
}

.wrong-first-takeaway {
  margin: 10px 0 0;
  color: var(--board-heading-alt);
  font-family: var(--board-display);
  font-size: 13.5px;
  font-weight: 600;
}

.ghost-button {
  padding: 6px 14px;
  color: var(--board-heading-alt);
  background: var(--board-paper);
  border: 1px solid var(--board-accent);
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.ghost-button:hover:not(:disabled) {
  background: var(--board-accent-soft);
}

.ghost-button:disabled {
  cursor: default;
  opacity: 0.5;
}

/* —— 判断对错（D3） —— */
.judge-card {
  padding: 16px 18px;
  background: color-mix(in srgb, var(--board-highlight) 36%, var(--board-paper));
  border: 1px solid color-mix(in srgb, var(--board-line) 24%, transparent);
  border-radius: 4px;
}

.judge-statement {
  margin: 0 0 12px;
  color: var(--board-ink);
  font-size: 16px;
  line-height: 1.75;
}

.judge-options {
  display: flex;
  gap: 10px;
}

.judge-button {
  min-width: 64px;
  padding: 7px 16px;
  color: var(--board-ink);
  background: var(--board-paper);
  border: 1px solid var(--board-line);
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.judge-button:hover:not(:disabled) {
  border-color: var(--board-accent);
}

.judge-button.selected {
  border-color: var(--board-current);
  background: var(--board-current-soft);
  color: var(--board-current);
  font-weight: 600;
}

.judge-button.is-correct {
  border-color: var(--board-positive);
  background: var(--board-positive-soft);
  color: var(--board-positive);
}

.judge-button.is-wrong {
  border-color: var(--board-negative);
  background: var(--board-negative-soft);
  color: var(--board-negative);
}

.judge-explanation {
  margin: 12px 0 0;
  color: var(--board-ink);
  font-size: 13px;
  line-height: 1.7;
}

/* —— 情形讨论表（C4） —— */
.case-list {
  display: grid;
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.case-list li {
  display: grid;
  gap: 4px;
  padding: 9px 13px;
  background: color-mix(in srgb, var(--board-paper) 86%, transparent);
  border: 1px solid var(--board-line);
  border-left-width: 3px;
  border-radius: 3px;
}

.case-list strong {
  color: var(--board-heading-alt);
  font-size: 13px;
}

.case-list span {
  color: var(--board-ink);
  font-size: 13px;
  line-height: 1.65;
}

/* —— 观察归纳（B6） —— */
.induction-examples {
  display: grid;
  gap: 7px;
  margin: 0 0 12px;
  padding: 0 0 0 22px;
  color: var(--board-ink);
  font-size: 14.5px;
}

.induction-examples li {
  padding: 5px 9px;
  background: color-mix(in srgb, var(--board-accent-soft) 42%, transparent);
  border-radius: 3px;
}

.induction-rule {
  margin: 12px 0 0;
  padding: 10px 13px;
  color: var(--board-positive);
  background: var(--board-positive-soft);
  border-radius: 3px;
  font-family: var(--board-display);
  font-size: 15px;
  font-weight: 600;
}

/* —— 一题多解（B7） —— */
.multi-problem {
  margin: 0 0 12px;
  color: var(--board-ink);
  font-size: 15px;
}

.multi-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
}

.multi-method {
  padding: 12px 14px;
  background: color-mix(in srgb, var(--board-paper) 86%, transparent);
  border: 1px solid var(--board-line);
  border-radius: 3px;
}

.multi-method header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.multi-method strong {
  color: var(--board-heading-alt);
  font-family: var(--board-display);
  font-size: 14px;
}

.method-tag {
  padding: 1px 8px;
  color: var(--board-current);
  background: var(--board-current-soft);
  border-radius: var(--radius-pill);
  font-size: 10.5px;
}

.multi-method ol {
  margin: 0;
  padding-left: 20px;
  color: var(--board-ink);
  font-size: 13px;
  line-height: 1.7;
}

/* —— 进场动效（C2/T1-T12）：duration/delay/easing 由 block.transition 驱动 —— */
.block-enter-active {
  transition:
    opacity var(--block-duration, 0.35s) var(--block-easing, ease) var(--block-delay, 0s),
    transform var(--block-duration, 0.35s) var(--block-easing, ease) var(--block-delay, 0s);
}

.block-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.enter-pop.block-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(6px);
}

.enter-fade.block-enter-from {
  opacity: 0;
  transform: none;
}

.enter-slide-left.block-enter-from {
  opacity: 0;
  transform: translateX(-28px);
}

.enter-slide-right.block-enter-from {
  opacity: 0;
  transform: translateX(28px);
}

@media (max-width: 880px) {
  .board-canvas {
    padding: 24px 18px 38px;
    font-size: 14px;
  }

  .board-blocks {
    grid-template-columns: 1fr;
    gap: 26px;
  }

  .board-block,
  .board-block.is-question {
    grid-column: 1;
  }

  .board-canvas.is-landscape .board-blocks {
    grid-template-columns: 1fr;
  }
}
</style>
