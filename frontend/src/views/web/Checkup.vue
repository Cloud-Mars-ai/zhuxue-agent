<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { usePersonaStore } from '@/stores/persona'
import { useThemeStore } from '@/stores/theme'
import { diagnoseGaps } from '@/utils/diagnose'
import { generateDiagnosisNarrative } from '@/api/aiTasks'

const router = useRouter()
const userStore = useUserStore()
const personaStore = usePersonaStore()
const themeStore = useThemeStore()

const radarRef = ref()
let chart = null

const persona = computed(() => personaStore.data)
const report = computed(() =>
  diagnoseGaps({ persona: persona.value, studentName: userStore.name || '同学' }),
)
const gaps = computed(() => report.value.gaps)
const stats = computed(() => report.value.stats)
const hasData = computed(
  () => stats.value.attempts > 0 || stats.value.selfTestQuestions > 0,
)

const narrative = ref('')
const narrating = ref(false)

function chartTheme() {
  const s = getComputedStyle(document.documentElement)
  return {
    text: s.getPropertyValue('--text-sub').trim() || '#93a1b5',
    line: s.getPropertyValue('--divider').trim() || '#1a2536',
    accent: s.getPropertyValue('--accent').trim() || '#22d3ee',
  }
}

function renderRadar() {
  if (!radarRef.value) return
  const { text, line, accent } = chartTheme()
  if (chart) chart.dispose()
  chart = echarts.init(radarRef.value)
  const list = persona.value.masteryList
  chart.setOption({
    tooltip: {},
    radar: {
      indicator: list.map((m) => ({ name: m.short, max: 100 })),
      radius: '62%',
      axisName: { color: text, fontSize: 11 },
      splitLine: { lineStyle: { color: line } },
      axisLine: { lineStyle: { color: line } },
      splitArea: { areaStyle: { color: ['transparent', 'rgba(127,127,127,0.03)'] } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: list.map((m) => (m.total ? m.accuracy : 0)),
            name: '自测正确率',
            areaStyle: { color: `${accent}33` },
            lineStyle: { color: accent },
            itemStyle: { color: accent },
          },
        ],
      },
    ],
  })
}

onMounted(async () => {
  await nextTick()
  renderRadar()
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  if (chart) chart.dispose()
})

function resize() {
  if (chart) chart.resize()
}

watch(
  () => themeStore.theme,
  async () => {
    await nextTick()
    renderRadar()
  },
)

watch(
  () => personaStore.version,
  async () => {
    await nextTick()
    renderRadar()
  },
)

async function makeNarrative() {
  if (!gaps.value.length) return
  narrating.value = true
  try {
    narrative.value = await generateDiagnosisNarrative({
      studentName: userStore.name || '同学',
      gaps: gaps.value.slice(0, 3),
      stats: stats.value,
    })
  } catch (err) {
    ElMessage.error(err.message || '诊断叙述生成失败')
  } finally {
    narrating.value = false
  }
}

function trainGap(gap) {
  router.push({ path: '/app/selftest', query: { chapters: gap.chapter, count: 5 } })
}

function cheatsheetOf(gap) {
  router.push({ path: '/app/cheatsheet', query: { chapters: gap.chapter } })
}

function goSelfTest() {
  router.push({ path: '/app/selftest', query: { count: 10 } })
}

const typeType = {
  zero: 'info',
  low: 'warning',
  concept: 'danger',
}
</script>

<template>
  <div class="checkup-page">
    <div class="page-head">
      <div>
        <h3 class="page-title">学习体检</h3>
        <p class="page-desc">
          不是给你打分，是告诉你劲往哪使。每条结论都能追溯到具体的练习与答题记录。
        </p>
      </div>
      <el-button v-if="gaps.length" type="primary" plain :loading="narrating" @click="makeNarrative">
        {{ narrative ? '重新生成诊断叙述' : '生成诊断叙述' }}
      </el-button>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-num">{{ stats.attempts }}</div>
        <div class="stat-label">一人一题练习</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ stats.selfTestQuestions }}</div>
        <div class="stat-label">自测题数</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ stats.accuracy }}%</div>
        <div class="stat-label">自测正确率</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ stats.gapCount }}</div>
        <div class="stat-label">待处理盲区</div>
      </div>
    </div>

    <el-alert
      v-if="!hasData"
      type="info"
      :closable="false"
      show-icon
      class="empty-tip"
      title="还没有足够的学习数据"
    >
      <template #default>
        先做一组 5 题摸底，系统才能定位你的盲区。没有数据时，我们不会编一份看起来很像的报告。
        <el-button link type="primary" @click="goSelfTest">去做一组自测 →</el-button>
      </template>
    </el-alert>

    <el-row :gutter="16">
      <el-col :xs="24" :md="11">
        <div class="card">
          <h4 class="card-title">章节正确率雷达</h4>
          <div ref="radarRef" class="chart"></div>
          <p class="chart-note">
            只统计自测题；没做过的章节为 0，不代表你不会，只代表还没测。
          </p>
        </div>
      </el-col>

      <el-col :xs="24" :md="13">
        <div class="card">
          <h4 class="card-title">优先处理顺序</h4>
          <div v-if="narrative" class="narrative">{{ narrative }}</div>

          <div v-if="gaps.length" class="gap-list">
            <div v-for="(g, i) in gaps.slice(0, 6)" :key="`${g.chapter}-${g.type}-${i}`" class="gap-item">
              <div class="gap-head">
                <span class="gap-rank">{{ String(i + 1).padStart(2, '0') }}</span>
                <span class="gap-chapter">{{ g.chapter }}</span>
                <el-tag size="small" :type="typeType[g.type]" effect="plain">
                  {{ g.typeLabel }}
                </el-tag>
              </div>
              <div class="gap-evidence">{{ g.evidence }}</div>
              <div class="gap-suggestion">{{ g.suggestion }}</div>
              <div class="gap-actions">
                <el-button size="small" type="primary" plain @click="trainGap(g)">
                  针对这处练一组
                </el-button>
                <el-button size="small" text @click="cheatsheetOf(g)">看本章速查表</el-button>
              </div>
            </div>
          </div>

          <el-empty
            v-else
            :description="hasData ? '暂未发现明显盲区，继续做跨章自测保持手感' : '先完成一组自测'"
            :image-size="70"
          />
        </div>
      </el-col>
    </el-row>

    <div class="card method-card">
      <h4 class="card-title">这份报告是怎么来的</h4>
      <div class="method-grid">
        <div class="method-item">
          <div class="method-no">01</div>
          <div class="method-title">零覆盖</div>
          <p>本章已开讲，但练习 0 次、自测 0 题。</p>
        </div>
        <div class="method-item">
          <div class="method-no">02</div>
          <div class="method-title">低表现</div>
          <p>自测正确率低于 60%，且样本不少于 3 题。</p>
        </div>
        <div class="method-item">
          <div class="method-no">03</div>
          <div class="method-title">概念盲点</div>
          <p>同一个概念在多次自测中反复答错。</p>
        </div>
        <div class="method-item">
          <div class="method-no">04</div>
          <div class="method-title">排序</div>
          <p>按"考核临近 × 薄弱程度"排，不按章节顺序。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkup-page {
  padding-bottom: 12px;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.page-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.page-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-sub);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.stat-card {
  padding: 14px 16px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.stat-num {
  font-family: var(--font-mono, monospace);
  font-size: 26px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1.1;
}

.stat-label {
  margin-top: 4px;
  font-size: 11.5px;
  color: var(--text-sub);
}

.empty-tip {
  margin-bottom: 14px;
}

.card {
  padding: 16px;
  margin-bottom: 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.card-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.chart {
  width: 100%;
  height: 280px;
}

.chart-note {
  margin: 6px 0 0;
  font-size: 11.5px;
  color: var(--text-faint);
}

.narrative {
  padding: 10px 12px;
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--text-main);
  background: var(--bg-page);
  border-left: 2px solid var(--accent);
  border-radius: 0 6px 6px 0;
}

.gap-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gap-item {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.gap-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gap-rank {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--text-faint);
}

.gap-chapter {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.gap-evidence {
  margin-top: 6px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-main);
}

.gap-suggestion {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-sub);
}

.gap-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.method-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.method-item {
  padding: 10px 12px;
  background: var(--bg-page);
  border-radius: 8px;
}

.method-no {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--accent);
}

.method-title {
  margin-top: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.method-item p {
  margin: 4px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-sub);
}

@media (max-width: 900px) {
  .stat-grid,
  .method-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
