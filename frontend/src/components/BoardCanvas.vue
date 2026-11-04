<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  lesson: { type: Object, default: null },
  visibleCount: { type: Number, default: 999 },
  interactive: { type: Boolean, default: true },
  landscape: { type: Boolean, default: false },
})

const emit = defineEmits(['answer'])
const selectedAnswers = ref({})

const visibleBlocks = computed(() =>
  (props.lesson?.blocks || []).slice(0, Math.max(0, props.visibleCount)),
)

function toneLabel(tone) {
  if (tone === 'warn') return '易错点'
  if (tone === 'idea') return '理解抓手'
  return '学习提示'
}

function chooseAnswer(question, option) {
  if (!props.interactive) return
  selectedAnswers.value = { ...selectedAnswers.value, [question]: option }
  emit('answer', { question, option })
}

watch(
  () => props.lesson,
  () => {
    selectedAnswers.value = {}
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
        :class="`is-${block.type}`"
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
          <p class="definition-text"><span>定义：</span>{{ block.definition }}</p>
          <p v-if="block.analogy" class="analogy">
            <span>形象比喻：</span>
            {{ block.analogy }}
          </p>
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

        <template v-else-if="block.type === 'callout'">
          <div class="callout" :class="`tone-${block.tone}`">
            <span class="callout-label">{{ toneLabel(block.tone) }}：{{ block.title }}</span>
            <p>{{ block.text }}</p>
          </div>
        </template>

        <template v-else-if="block.type === 'question'">
          <div class="question-card">
            <span class="block-label">{{ block.title }}</span>
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
.board-block.is-diagram {
  grid-column: span 1;
}

.board-block.is-question {
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

.definition-text {
  margin: 0 0 10px;
  color: var(--board-ink);
  font-size: 15px;
  line-height: 1.85;
}

.definition-text span,
.analogy span {
  color: var(--board-heading-alt);
  font-weight: 600;
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

.callout {
  padding: 12px 14px;
  background: var(--board-note);
  border-left: 3px solid var(--board-accent);
}

.callout.tone-warn {
  background: color-mix(in srgb, var(--warn-soft) 78%, var(--board-paper));
  border-left-color: var(--warn);
}

.callout.tone-idea {
  background: var(--board-accent-soft);
  border-left-color: var(--board-accent);
}

.callout.tone-note {
  background: var(--board-note);
}

.callout p {
  margin: 7px 0 0;
  color: var(--board-ink);
  font-size: 13px;
  line-height: 1.72;
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

.block-enter-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.block-enter-from {
  opacity: 0;
  transform: translateY(8px);
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
