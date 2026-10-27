<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { COURSE, HOMEWORKS } from '@/mock/data'
import { useUserStore } from '@/stores/user'
import { useCasesStore } from '@/stores/cases'
import { useAssessmentStore } from '@/stores/assessment'
import { usePracticeStore } from '@/stores/practice'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const userStore = useUserStore()
const casesStore = useCasesStore()
const assessmentStore = useAssessmentStore()
const practiceStore = usePracticeStore()
const themeStore = useThemeStore()

const overallProgress = computed(() => {
  const list = COURSE.chapters
  return Math.round(list.reduce((a, c) => a + c.progress, 0) / list.length)
})

const upcoming = computed(() =>
  HOMEWORKS.filter((h) => h.status !== 'graded').slice(0, 2),
)

// 本节课案例：老师从案例池选用后置顶展示（M3）
const currentCase = computed(() => casesStore.currentCase())

const isStudent = computed(() => userStore.role === 'student')

/* ==================================================
 * 双风格设计方案（示意 A-1 / B-1）数据
 * ================================================== */
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 12) return '上午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const currentChapter = computed(
  () => COURSE.chapters.find((c) => c.status === '进行中') || COURSE.chapters[0],
)

const heroProgress = computed(() => currentChapter.value?.progress ?? overallProgress.value)

const ringDash = computed(() => {
  const c = 2 * Math.PI * 22
  return `${((heroProgress.value / 100) * c).toFixed(1)} ${c.toFixed(1)}`
})

const pendingAssessmentCount = computed(() => {
  if (!isStudent.value) return 0
  return assessmentStore.visibleItemsFor(userStore.user?.id).filter((e) => !e.item.answer).length
})

const myPracticeCount = computed(() => {
  if (!isStudent.value) return 0
  return practiceStore.myRecords(userStore.user?.id).length
})

// 今日待办行（方案示意 B-1）
const todoRows = computed(() => {
  if (isStudent.value) {
    const rows = [
      {
        dot: '#E03131',
        title: '提交预习案例',
        sub: '老师将选用本节课案例',
        date: '今天 22:00',
        to: '/m/case',
      },
      {
        dot: '#F59F00',
        title: `一人一题练习 · ${currentChapter.value?.title.replace(/^第\d+章\s*/, '') || '本章'}`,
        sub: 'AI 出题 · 三维反馈',
        date: '今日',
        to: '/m/practice',
      },
    ]
    if (pendingAssessmentCount.value > 0) {
      rows.push({
        dot: '#3B5BDB',
        title: `模拟面试题 ${pendingAssessmentCount.value} 道待作答`,
        sub: '已由老师复核发布',
        date: '',
        to: '/m/assessment',
      })
    }
    return rows
  }
  const reviewCount = assessmentStore.tasks
    .flatMap((t) => t.items)
    .filter((i) => i.status === 'pending_review').length
  const pendingCases = casesStore.cases.filter((c) => c.status === 'pending').length
  const rows = []
  if (pendingCases > 0) {
    rows.push({ dot: '#E03131', title: `案例池待选用 ${pendingCases} 条`, sub: '学生提交的课前案例', date: '', to: '/m/case' })
  }
  if (reviewCount > 0) {
    rows.push({ dot: '#F59F00', title: `考核题目待复核 ${reviewCount} 道`, sub: 'AI 已逐人生成，待复核发布', date: '', to: '/m/assessment' })
  }
  if (!rows.length) {
    rows.push({ dot: '#2B8A3E', title: '暂无待处理事项', sub: '案例与考核均已处理完毕', date: '', to: '' })
  }
  return rows
})

// 四宫格快捷入口（方案示意 B-1）
const quickEntries = computed(() =>
  isStudent.value
    ? [
        { ic: '题', color: '#E8590C', name: '一人一题', sub: 'AI 出题练习', to: '/m/practice' },
        { ic: '例', color: '#3B5BDB', name: '课前案例', sub: '提交兴趣案例', to: '/m/case' },
        { ic: '考', color: '#2B8A3E', name: '课程考核', sub: '模拟面试', to: '/m/assessment' },
        { ic: '问', color: '#F59F00', name: 'AI 答疑', sub: '小管同学', to: '/m/ask' },
      ]
    : [
        { ic: '稿', color: '#3B5BDB', name: '案例选稿台', sub: '筛选 / 选用 / 驳回', to: '/m/case' },
        { ic: '卷', color: '#E8590C', name: '出题阅卷台', sub: '圈人出题 · 评分', to: '/m/assessment' },
        { ic: '问', color: '#F59F00', name: 'AI 答疑', sub: '小管同学', to: '/m/ask' },
      ],
)
</script>

<template>
  <div class="m-page">
    <!-- ==================================================
      方案一 · 墨读：杂志封面式课程主页（示意 A-1）
      ================================================== -->
    <section v-if="themeStore.isMo" class="mo-magazine" data-testid="mo-course-home">
      <div class="mo-mast">
        <span class="mo-mast-brand">管理学<em>日课</em></span>
        <span class="mo-mast-week">WEEK 08 · {{ currentChapter.title.replace(/^第\d+章\s*/, '') }}</span>
      </div>

      <div class="mo-hero">
        <div class="mo-hero-text">
          <div class="mo-kicker">BEIJING INSTITUTE OF CHEMICAL TECHNOLOGY · 2026 AUTUMN</div>
          <h1 class="mo-hero-title" data-testid="mo-hero-title">
            把每一天<br />过成<em>案例</em>
          </h1>
          <p class="mo-sub">
            {{ COURSE.college }} ·《{{ COURSE.name }}》{{ currentChapter.title }} 进行中（{{ heroProgress }}%）
          </p>
          <div class="mo-cta">
            <a @click="router.push('/m/practice')">进入今日之题 →</a>
            <a @click="router.push('/m/case')">提交预习案例 →</a>
          </div>
        </div>
        <div class="mo-hero-art">
          <svg
            width="132"
            height="105"
            viewBox="0 0 240 190"
            fill="none"
            stroke="#1F1B16"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M150 34 a26 26 0 1 1 0.1 0" fill="#F7F3EA" />
            <path d="M124 30 q26 -22 52 0 l4 8 q-30 -12 -60 0 z" fill="#C0432B" stroke="#C0432B" />
            <path d="M176 34 l24 6 -24 6" fill="#C0432B" stroke="#C0432B" />
            <circle cx="140" cy="36" r="3.2" fill="#1F1B16" /><circle cx="162" cy="36" r="3.2" fill="#1F1B16" />
            <path d="M146 48 q8 6 16 0" />
            <path d="M150 62 q-4 40 -22 62 l38 8 q10 -30 6 -66" fill="#F7F3EA" />
            <path d="M132 128 l-14 46 h84 l-10 -46" fill="#F7F3EA" />
            <path d="M120 174 h96" stroke="#C0432B" />
            <rect x="96" y="104" width="72" height="44" rx="3" fill="#FFFEFA" />
            <path d="M96 104 l36 -14 36 14" fill="#F7F3EA" />
            <circle cx="132" cy="126" r="7" stroke="#C0432B" />
            <path d="M60 158 q10 -22 30 -24 q-4 -14 8 -20 q10 16 -6 26 q22 2 30 22 q-16 -8 -30 -4 q-14 4 -32 0z" fill="#F7F3EA" />
            <circle cx="86" cy="136" r="2.6" fill="#1F1B16" />
            <path d="M28 178 q30 -10 60 0 t60 0" stroke="#B9AF9E" stroke-dasharray="4 6" />
          </svg>
        </div>
      </div>

      <div class="mo-dots"><span>预习</span><span>练习</span><span>考核</span><span>研讨</span></div>

      <div class="mo-cols" data-testid="mo-cols">
        <div class="mo-col">
          <div class="mo-col-no">TODO · {{ isStudent ? '今日待办' : '待处理事项' }}</div>
          <template v-if="isStudent">
            <h4 class="mo-col-title">三件事</h4>
            <p class="mo-col-text">
              ① 提交预习案例（今晚 22:00 截止）<br />
              ② 完成一人一题练习 1 次<br />
              ③ {{ pendingAssessmentCount > 0 ? `模拟面试题 ${pendingAssessmentCount} 道待作答` : '复盘最近一次红批' }}
            </p>
          </template>
          <template v-else>
            <h4 class="mo-col-title">待处理</h4>
            <p class="mo-col-text">
              ① {{ todoRows[0]?.title || '案例池已清空' }}<br />
              ② {{ todoRows[1]?.title || '考核题目已清空' }}
            </p>
          </template>
          <span class="mo-col-more" @click="router.push(isStudent ? '/m/practice' : '/m/assessment')">查看全部 →</span>
        </div>
        <div class="mo-col">
          <div class="mo-col-no">CASE · 本节课案例</div>
          <template v-if="currentCase">
            <h4 class="mo-col-title">{{ currentCase.title }}</h4>
            <p class="mo-col-text">
              {{ currentCase.submitter }} 推荐 · {{ currentCase.discipline }}<br />
              {{ currentCase.chapter }}，老师已选用。
            </p>
            <span class="mo-col-more" @click="router.push('/m/case')">进入研讨 →</span>
          </template>
          <template v-else>
            <h4 class="mo-col-title">虚位以待</h4>
            <p class="mo-col-text">老师尚未选用本节课案例，<br />去案例池看看同学们的推荐。</p>
            <span class="mo-col-more" @click="router.push('/m/case')">进入案例池 →</span>
          </template>
        </div>
        <div class="mo-col">
          <div class="mo-col-no">PROGRESS · {{ isStudent ? '我的进度' : '班级进度' }}</div>
          <div class="mo-col-num">{{ heroProgress }}%</div>
          <p class="mo-col-text">
            {{ currentChapter.title }}<br />
            练习 {{ myPracticeCount }} 次 · 连续 3 天
          </p>
          <span class="mo-col-more" @click="router.push('/m/mine')">学习档案 →</span>
        </div>
      </div>
    </section>

    <!-- ==================================================
      方案二 · 云课笺：问候 + 待办 + 四宫格（示意 B-1）
      ================================================== -->
    <template v-else>
      <section class="yun-top" data-testid="yun-greeting">
        <div class="yun-hi">
          {{ greeting }}，{{ userStore.name || '同学' }} <small>《{{ COURSE.name }}》第 8 周</small>
        </div>
        <div class="yun-badges">
          <span class="skin-badge run">● {{ currentChapter.title.replace(/^第\d+章\s*/, '') }} 进行中</span>
          <span class="skin-badge dis">学科背景：{{ userStore.discipline || '未设置' }}</span>
          <svg class="skin-ring" viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="22" fill="none" stroke="#F0EEE8" stroke-width="6" />
            <circle
              cx="26"
              cy="26"
              r="22"
              fill="none"
              stroke="#E8590C"
              stroke-width="6"
              stroke-linecap="round"
              :stroke-dasharray="ringDash"
              transform="rotate(-90 26 26)"
            />
            <text x="26" y="30" text-anchor="middle" font-size="12" font-weight="700" fill="#2B2A28">
              {{ heroProgress }}%
            </text>
          </svg>
        </div>
      </section>

      <section class="m-card yun-todo" data-testid="yun-todo">
        <div class="yun-card-head">
          <span class="yun-card-title"
            >今日待办 <small>{{ todoRows.length }} 项 · 最早截止 今晚 22:00</small></span
          >
          <span class="skin-badge new">NEW</span>
        </div>
        <div v-for="(r, i) in todoRows" :key="i" class="yun-todo-row" @click="r.to && router.push(r.to)">
          <span class="yun-todo-dot" :style="{ background: r.dot }" />
          <span class="yun-todo-main">
            <span class="yun-todo-title">{{ r.title }}</span>
            <span class="yun-todo-sub">{{ r.sub }}</span>
          </span>
          <span v-if="r.date" class="yun-todo-date">{{ r.date }}</span>
          <span class="yun-todo-chev">›</span>
        </div>
      </section>

      <section class="yun-grid" data-testid="yun-grid">
        <div v-for="e in quickEntries" :key="e.name" class="yun-entry" @click="router.push(e.to)">
          <div class="yun-entry-ic" :style="{ background: e.color }">{{ e.ic }}</div>
          <div class="yun-entry-name">{{ e.name }}</div>
          <div class="yun-entry-sub">{{ e.sub }}</div>
        </div>
      </section>

      <section v-if="currentCase" class="m-card yun-case" data-testid="yun-case">
        <div class="yun-card-head">
          <span class="yun-card-title">本节课案例 <small>老师已选用</small></span>
          <span class="skin-badge ok">已选用</span>
        </div>
        <div class="yun-case-title">{{ currentCase.title }}</div>
        <p class="yun-case-desc">
          {{ currentCase.submitter }} 推荐 · {{ currentCase.chapter }}。{{ currentCase.summary }}
        </p>
        <div class="yun-case-chips">
          <span class="skin-chip on" @click="router.push('/m/ask')">进入研讨</span>
          <span class="skin-chip" @click="router.push('/m/case')">查看案例池</span>
        </div>
      </section>
    </template>

    <!-- 待办作业 + 章节学习（两皮肤通用） -->
    <van-cell-group inset title="待办作业">
      <van-cell
        v-for="h in upcoming"
        :key="h.id"
        :title="h.title"
        :label="`截止 ${h.deadline}`"
        is-link
      >
        <template #value>
          <van-tag :type="h.status === 'pending' ? 'default' : 'warning'" plain>
            {{ h.status === 'pending' ? '未开始' : '进行中' }}
          </van-tag>
        </template>
      </van-cell>
      <van-empty v-if="!upcoming.length" description="暂无待办作业" />
    </van-cell-group>

    <van-cell-group inset title="章节学习">
      <van-cell
        v-for="c in COURSE.chapters"
        :key="c.id"
        :title="c.title"
        :label="c.status"
        is-link
      >
        <template #value>
          <span class="m-chapter-progress">{{ c.progress }}%</span>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<style scoped>
.m-page {
  padding-bottom: 12px;
}

/* —— 云课笺顶部（示意 B-1）—— */
.yun-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 14px 12px 4px;
}

.yun-hi {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-main);
}

.yun-hi small {
  display: block;
  font-size: 11.5px;
  font-weight: 400;
  color: var(--text-faint);
  margin-left: 0;
  margin-top: 2px;
}

.yun-badges {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.m-card {
  margin: 12px;
  padding: 12px 14px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.yun-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.yun-card-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-main);
}

.yun-card-title small {
  font-weight: 400;
  color: var(--text-faint);
  margin-left: 6px;
  font-size: 11.5px;
}

.yun-case-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-main);
}

.yun-case-desc {
  margin: 0;
  font-size: 12px;
  color: var(--text-sub);
  line-height: 1.7;
}

.yun-case-chips {
  margin-top: 8px;
}

.m-chapter-progress {
  font-size: 13px;
  color: var(--brand);
  font-weight: 600;
}

:deep(.van-cell-group__title) {
  font-size: 14px;
}

/* ==================================================
 * 墨读杂志封面：移动端适配（示意 A-1）
 * 置于块尾覆盖 skins.css 的共享定义
 * ================================================== */
.mo-magazine {
  margin: 12px;
  background: #f7f3ea;
  border: 1px solid #1f1b16;
  border-radius: 3px;
  padding-bottom: 14px;
}

.mo-mast {
  padding: 14px 14px 10px;
}

.mo-mast-brand {
  font-size: 17px;
}

.mo-hero {
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding: 20px 14px 16px;
}

.mo-hero-title {
  font-size: 27px;
  letter-spacing: 1px;
}

.mo-kicker {
  font-size: 9.5px;
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.mo-sub {
  font-size: 12px;
  margin-bottom: 14px;
}

.mo-cta {
  font-size: 12.5px;
  gap: 16px;
}

.mo-hero-art {
  align-self: center;
}

.mo-dots {
  margin: 4px 14px 0;
  font-size: 10px;
  letter-spacing: 3px;
}

/* 三栏目录在移动端纵向堆叠，用虚线分隔 */
.mo-cols {
  grid-template-columns: 1fr;
  margin: 14px 14px 0;
}

.mo-col {
  padding: 12px 0 0;
  border-right: none;
  border-top: 1px dashed #b9af9e;
}

.mo-col:first-child {
  border-top: none;
  padding-top: 0;
}

.mo-col-title {
  font-size: 15px;
}

.mo-col-num {
  font-size: 26px;
}
</style>
