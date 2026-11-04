<script setup>
import { computed } from 'vue'

const props = defineProps({
  lesson: { type: Object, default: null },
  visibleCount: { type: Number, default: 999 },
  interactive: { type: Boolean, default: true },
})

const emit = defineEmits(['answer'])

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
  emit('answer', { question, option })
}
</script>

<template>
  <article v-if="lesson" class="board-canvas" data-testid="board-canvas">
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
          <span class="block-label">{{ block.title }}</span>
          <h2>{{ block.term }}</h2>
          <p class="definition-text">{{ block.definition }}</p>
          <p v-if="block.analogy" class="analogy">
            <span>理解抓手</span>
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
            <span class="callout-label">{{ toneLabel(block.tone) }} · {{ block.title }}</span>
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
                @click="chooseAnswer(block.prompt, option)"
              >
                <span>{{ String.fromCharCode(65 + optionIndex) }}</span>
                {{ option }}
              </button>
            </div>
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
  padding: 28px 34px 56px;
  background-color: var(--card-bg);
  background-image: radial-gradient(var(--grid-line) 1px, transparent 1px);
  background-size: 22px 22px;
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  color: var(--text-main);
}

.board-title {
  max-width: 760px;
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 1px dashed var(--divider);
}

.board-kicker,
.block-label,
.callout-label {
  color: var(--text-faint);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.board-title h1 {
  margin: 7px 0 6px;
  font-family: var(--font-title);
  font-size: clamp(24px, 2.4vw, 34px);
  line-height: 1.2;
  letter-spacing: var(--title-tracking);
}

.board-title p {
  margin: 0;
  color: var(--text-sub);
  font-size: 13px;
  line-height: var(--body-leading);
}

.board-blocks {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: start;
  gap: 20px;
}

.board-block {
  min-width: 0;
  padding: 20px 22px;
  background: color-mix(in srgb, var(--card-bg) 92%, transparent);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
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
  margin: 0 0 14px;
  font-family: var(--font-title);
  font-size: 18px;
  line-height: 1.45;
}

.outline-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: outline;
}

.outline-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--text-sub);
  font-size: 14px;
  line-height: 1.65;
  counter-increment: outline;
}

.outline-dot {
  flex: none;
  width: 23px;
  height: 23px;
  display: grid;
  place-items: center;
  margin-top: 1px;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 10px;
}

.outline-dot::before {
  content: counter(outline);
}

.definition-text {
  margin: 12px 0;
  font-size: 14px;
  line-height: var(--body-leading);
}

.analogy {
  margin: 14px 0 0;
  padding: 12px 14px;
  color: var(--text-sub);
  background: var(--surface-2);
  border-left: 3px solid var(--accent);
  font-size: 12.5px;
  line-height: 1.75;
}

.analogy span {
  display: block;
  margin-bottom: 3px;
  color: var(--accent);
  font-size: 10.5px;
  font-weight: 700;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  line-height: 1.55;
}

th,
td {
  padding: 9px 10px;
  border: 1px solid var(--divider);
  text-align: left;
  vertical-align: top;
}

th {
  color: var(--text-sub);
  background: var(--surface-2);
  font-size: 11px;
  letter-spacing: 0.04em;
}

.diagram-chain {
  display: flex;
  align-items: stretch;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.diagram-node {
  flex: 1 0 110px;
  min-height: 84px;
  padding: 12px;
  background: var(--surface-2);
  border: 1px solid var(--divider);
  border-radius: var(--radius-sm);
}

.diagram-node strong,
.diagram-node span {
  display: block;
}

.diagram-node strong {
  font-size: 12px;
}

.diagram-node span {
  margin-top: 6px;
  color: var(--text-faint);
  font-size: 10.5px;
  line-height: 1.5;
}

.diagram-arrow {
  align-self: center;
  color: var(--accent);
  font-size: 18px;
}

.diagram-caption {
  margin: 10px 0 0;
  color: var(--text-faint);
  font-size: 11px;
  line-height: 1.6;
}

.callout {
  padding: 15px 16px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
}

.callout.tone-warn {
  background: var(--warn-soft);
  border-color: color-mix(in srgb, var(--warn) 28%, var(--card-border));
}

.callout.tone-idea {
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 25%, var(--card-border));
}

.callout.tone-note {
  background: var(--surface-2);
}

.callout p {
  margin: 7px 0 0;
  font-size: 12.5px;
  line-height: 1.75;
}

.question-card {
  padding: 18px 20px;
  background: var(--accent-soft);
  border: 1px solid color-mix(in srgb, var(--accent) 28%, var(--card-border));
  border-radius: var(--radius-md);
}

.question-card h2 {
  margin: 8px 0 14px;
  font-size: 16px;
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
  color: var(--text-main);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.question-options button:hover {
  border-color: var(--accent);
}

.question-options button span {
  width: 21px;
  height: 21px;
  display: grid;
  place-items: center;
  color: var(--accent-on);
  background: var(--accent);
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 10px;
}

.question-tip {
  margin: 11px 0 0;
  color: var(--text-faint);
  font-size: 10.5px;
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
    padding: 22px 18px 36px;
  }

  .board-blocks {
    grid-template-columns: 1fr;
  }

  .board-block,
  .board-block.is-question {
    grid-column: 1;
  }
}
</style>
