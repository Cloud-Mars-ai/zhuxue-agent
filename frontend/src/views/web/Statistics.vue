<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  STATS_WEEKLY,
  STATS_CHAPTER_MASTERY,
  STATS_STUDENT_LEVEL,
  COURSE,
} from '@/mock/data'

const trendRef = ref()
const masteryRef = ref()
const levelRef = ref()
const charts = []

function renderTrend() {
  const chart = echarts.init(trendRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['出勤人数', '课堂互动次数', '作业提交率(%)'], bottom: 0 },
    grid: { left: 40, right: 20, top: 24, bottom: 48 },
    xAxis: { type: 'category', data: STATS_WEEKLY.weeks },
    yAxis: { type: 'value' },
    series: [
      {
        name: '出勤人数',
        type: 'line',
        smooth: true,
        data: STATS_WEEKLY.attendance,
        itemStyle: { color: '#2f6feb' },
      },
      {
        name: '课堂互动次数',
        type: 'line',
        smooth: true,
        data: STATS_WEEKLY.interaction,
        itemStyle: { color: '#67c23a' },
      },
      {
        name: '作业提交率(%)',
        type: 'line',
        smooth: true,
        data: STATS_WEEKLY.homeworkRate,
        itemStyle: { color: '#e6a23c' },
      },
    ],
  })
  charts.push(chart)
}

function renderMastery() {
  const chart = echarts.init(masteryRef.value)
  chart.setOption({
    tooltip: {},
    radar: {
      indicator: STATS_CHAPTER_MASTERY.map((c) => ({ name: c.chapter, max: 100 })),
      radius: '65%',
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: STATS_CHAPTER_MASTERY.map((c) => c.mastery),
            name: '班级平均掌握度',
            areaStyle: { color: 'rgba(47,111,235,0.25)' },
            lineStyle: { color: '#2f6feb' },
            itemStyle: { color: '#2f6feb' },
          },
        ],
      },
    ],
  })
  charts.push(chart)
}

function renderLevel() {
  const chart = echarts.init(levelRef.value)
  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 人 ({d}%)' },
    legend: { bottom: 0, left: 'center' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        data: STATS_STUDENT_LEVEL,
        label: { formatter: '{b}\n{c}人' },
        color: ['#67c23a', '#2f6feb', '#e6a23c', '#f56c6c'],
      },
    ],
  })
  charts.push(chart)
}

function resizeAll() {
  charts.forEach((c) => c.resize())
}

onMounted(async () => {
  await nextTick()
  renderTrend()
  renderMastery()
  renderLevel()
  window.addEventListener('resize', resizeAll)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeAll)
  charts.forEach((c) => c.dispose())
  charts.length = 0
})

const weakChapters = STATS_CHAPTER_MASTERY.filter(
  (c) => c.mastery > 0 && c.mastery < 70,
).map((c) => c.chapter)
</script>

<template>
  <div>
    <div class="toolbar">
      <div>
        <h3 class="page-title">学情统计</h3>
        <p class="text-sub">
          {{ COURSE.name }} · {{ COURSE.term }} · 共 {{ COURSE.studentCount }} 名学生
        </p>
      </div>
      <el-button plain>
        <el-icon><Download /></el-icon>导出报表
      </el-button>
    </div>

    <div class="card">
      <h3 class="card-title">近 6 周教学趋势</h3>
      <div ref="trendRef" class="chart chart-wide"></div>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :md="12">
        <div class="card">
          <h3 class="card-title">各章节掌握度</h3>
          <div ref="masteryRef" class="chart"></div>
        </div>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="card">
          <h3 class="card-title">学生分层分布</h3>
          <div ref="levelRef" class="chart"></div>
        </div>
      </el-col>
    </el-row>

    <div class="card">
      <h3 class="card-title">智能体分析结论</h3>
      <el-alert type="info" :closable="false">
        <template #title>
          <span v-if="weakChapters.length">
            薄弱章节：{{ weakChapters.join('、') }}，掌握度低于 70%，建议安排专题研讨或补充练习。
          </span>
          <span v-else>各章节掌握度均在 70% 以上，整体学习状态良好。</span>
        </template>
      </el-alert>
      <ul class="insight">
        <li>课堂互动次数从第 1 周的 32 次上升到第 6 周的 70 次，研讨参与度持续改善。</li>
        <li>作业提交率由 100% 降至 90%，需关注后期学习动力衰减。</li>
        <li>第 5、6 章尚未开课，掌握度为 0 属正常状态。</li>
      </ul>
      <p class="text-sub">以上结论由仿真数据生成，接入真实学情后由智能体自动汇总。</p>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.toolbar .page-title {
  margin-bottom: 4px;
}

.card-title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
}

.chart {
  width: 100%;
  height: 300px;
}

.chart-wide {
  height: 320px;
}

.insight {
  margin: 14px 0 8px;
  padding-left: 20px;
  font-size: 13px;
  color: var(--text-sub);
}

.insight li {
  margin-bottom: 6px;
}
</style>
