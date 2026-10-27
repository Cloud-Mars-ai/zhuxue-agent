<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { COURSE, FORUM_POSTS } from '@/mock/data'
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
  const sum = list.reduce((acc, c) => acc + c.progress, 0)
  return Math.round(sum / list.length)
})

const latestPosts = computed(() => FORUM_POSTS.slice(0, 3))

// 本节课案例：老师从案例池选用后，课堂主页置顶展示（M3）
const currentCase = computed(() => casesStore.currentCase())

// 学生看到自己的学习进度，教师看到班级整体情况
const isStudent = computed(() => userStore.role === 'student')

/* ==================================================
 * 双风格设计方案（示意 A-1 / B-1）数据
 * ================================================== */

// 问候语：按当地时间
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 12) return '上午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

// 当前进行中的章节（方案中的「第 3 章 进行中」）
const currentChapter = computed(
  () => COURSE.chapters.find((c) => c.status === '进行中') || COURSE.chapters[0],
)

// Hero 进度取当前章节进度（与方案示意一致）
const heroProgress = computed(() => currentChapter.value?.progress ?? overallProgress.value)

// 进度环 dasharray（r=22，周长约 138.23）
const ringDash = computed(() => {
  const c = 2 * Math.PI * 22
  return `${((heroProgress.value / 100) * c).toFixed(1)} ${c.toFixed(1)}`
})

// 待作答的模拟面试题数量（学生）
const pendingAssessmentCount = computed(() => {
  if (!isStudent.value) return 0
  return assessmentStore.visibleItemsFor(userStore.user?.id).filter((e) => !e.item.answer).length
})

// 我的练习次数（学生）
const myPracticeCount = computed(() => {
  if (!isStudent.value) return 0
  return practiceStore.myRecords(userStore.user?.id).length
})

// 今日待办行（方案示意 B-1：状态点 + 标题/副标 + 日期 + Chevron）
const todoRows = computed(() => {
  if (isStudent.value) {
    const rows = [
      {
        dot: '#E03131',
        title: '提交预习案例',
        sub: '老师将选用本节课案例',
        date: '今天 22:00',
        to: '/cases',
      },
      {
        dot: '#F59F00',
        title: `一人一题练习 · ${currentChapter.value?.title.replace(/^第\d+章\s*/, '') || '本章'}`,
        sub: 'AI 出题 · 三维反馈',
        date: '今日',
        to: '/practice',
      },
    ]
    if (pendingAssessmentCount.value > 0) {
      rows.push({
        dot: '#3B5BDB',
        title: `模拟面试题 ${pendingAssessmentCount.value} 道待作答`,
        sub: '已由老师复核发布',
        date: '',
        to: '/assessment',
      })
    }
    return rows
  }
  // 教师：待处理事项
  const reviewCount = assessmentStore.tasks
    .flatMap((t) => t.items)
    .filter((i) => i.status === 'pending_review').length
  const pendingCases = casesStore.cases.filter((c) => c.status === 'pending').length
  const rows = []
  if (pendingCases > 0) {
    rows.push({
      dot: '#E03131',
      title: `案例池待选用 ${pendingCases} 条`,
      sub: '学生提交的课前案例',
      date: '',
      to: '/cases',
    })
  }
  if (reviewCount > 0) {
    rows.push({
      dot: '#F59F00',
      title: `考核题目待复核 ${reviewCount} 道`,
      sub: 'AI 已逐人生成，待复核发布',
      date: '',
      to: '/assessment',
    })
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
        { ic: '题', color: '#E8590C', name: '一人一题', sub: 'AI 出题练习', to: '/practice' },
        { ic: '例', color: '#3B5BDB', name: '课前案例', sub: '提交兴趣案例', to: '/cases' },
        { ic: '考', color: '#2B8A3E', name: '课程考核', sub: '模拟面试', to: '/assessment' },
        { ic: '问', color: '#F59F00', name: 'AI 答疑', sub: '小管同学', to: '/ask' },
      ]
    : [
        { ic: '稿', color: '#3B5BDB', name: '案例选稿台', sub: '筛选 / 选用 / 驳回', to: '/cases' },
        { ic: '卷', color: '#E8590C', name: '出题阅卷台', sub: '圈人出题 · 评分', to: '/assessment' },
        { ic: '析', color: '#2B8A3E', name: '学情统计', sub: '参与度 · 掌握度', to: '/statistics' },
        { ic: '问', color: '#F59F00', name: 'AI 答疑', sub: '小管同学', to: '/ask' },
      ],
)

// 墨读三栏目录：TODO / CASE / PROGRESS
const moTodoItems = computed(() => {
  if (isStudent.value) {
    return [
      pendingAssessmentCount.value > 0 ? `模拟面试题 ${pendingAssessmentCount.value} 道待作答` : '完成一人一题练习 1 次',
      '提交预习案例（今晚 22:00 截止）',
    ]
  }
  const reviewCount = assessmentStore.tasks.flatMap((t) => t.items).filter((i) => i.status === 'pending_review').length
  const pendingCases = casesStore.cases.filter((c) => c.status === 'pending').length
  return [`案例池待选用 ${pendingCases} 条`, `考核题目待复核 ${reviewCount} 道`]
})
</script>

<template>
  <div class="course-home">
    <!-- ==================================================
      方案一 · 墨读：杂志封面式课程主页（示意 A-1）
      ================================================== -->
    <section v-if="themeStore.isMo" class="mo-magazine" data-testid="mo-course-home">
      <div class="mo-mast">
        <span class="mo-mast-brand">管理学<em>日课</em></span>
        <nav class="mo-mast-nav">
          <a @click="router.push('/ask')">答疑</a>
          <a @click="router.push('/practice')">练习</a>
          <a @click="router.push('/cases')">案例</a>
          <a @click="router.push('/assessment')">考核</a>
          <a @click="router.push('/forum')">论坛</a>
        </nav>
        <span class="mo-mast-week">WEEK 08 · {{ currentChapter.title.replace(/^第\d+章\s*/, '') }}</span>
      </div>

      <div class="mo-hero">
        <div class="mo-hero-text">
          <div class="mo-kicker">BEIJING INSTITUTE OF CHEMICAL TECHNOLOGY · 2026 AUTUMN</div>
          <h1 class="mo-hero-title" data-testid="mo-hero-title">
            把每一天<br />过成<em>案例</em>
          </h1>
          <p class="mo-sub">
            {{ COURSE.college }} ·《{{ COURSE.name }}》{{ currentChapter.title }} 进行中（{{ heroProgress }}%）<br />
            把每一次预习、练习与考核，都写成可复用的经验。
          </p>
          <div class="mo-cta">
            <a @click="router.push('/practice')">进入今日之题 →</a>
            <a @click="router.push('/cases')">提交预习案例 →</a>
          </div>
        </div>
        <div class="mo-hero-art">
          <svg
            width="240"
            height="190"
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
            <h4 class="mo-col-title">两件事</h4>
            <p class="mo-col-text">
              ① {{ moTodoItems[0] }}<br />
              ② {{ moTodoItems[1] }}
            </p>
          </template>
          <span class="mo-col-more" @click="router.push(isStudent ? '/practice' : '/assessment')">查看全部 →</span>
        </div>
        <div class="mo-col">
          <div class="mo-col-no">CASE · 本节课案例</div>
          <template v-if="currentCase">
            <h4 class="mo-col-title">{{ currentCase.title }}</h4>
            <p class="mo-col-text">
              {{ currentCase.submitter }} 推荐 · {{ currentCase.discipline }}<br />
              {{ currentCase.chapter }}，老师已选用。
            </p>
            <span class="mo-col-more" @click="router.push('/cases')">进入研讨 →</span>
          </template>
          <template v-else>
            <h4 class="mo-col-title">虚位以待</h4>
            <p class="mo-col-text">老师尚未选用本节课案例，<br />去案例池看看同学们的推荐。</p>
            <span class="mo-col-more" @click="router.push('/cases')">进入案例池 →</span>
          </template>
        </div>
        <div class="mo-col">
          <div class="mo-col-no">PROGRESS · {{ isStudent ? '我的进度' : '班级进度' }}</div>
          <div class="mo-col-num">{{ heroProgress }}%</div>
          <p class="mo-col-text">
            {{ currentChapter.title }}<br />
            练习 {{ myPracticeCount }} 次 · 连续 3 天
          </p>
          <span class="mo-col-more" @click="router.push('/statistics')">学习档案 →</span>
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

      <section class="card yun-todo" data-testid="yun-todo">
        <div class="yun-card-head">
          <span class="yun-card-title"
            >今日待办 <small>{{ todoRows.length }} 项 · 最早截止 今晚 22:00</small></span
          >
          <span class="skin-badge new">NEW</span>
        </div>
        <div
          v-for="(r, i) in todoRows"
          :key="i"
          class="yun-todo-row"
          @click="r.to && router.push(r.to)"
        >
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

      <section v-if="currentCase" class="card yun-case" data-testid="yun-case">
        <div class="yun-card-head">
          <span class="yun-card-title">本节课案例 <small>老师已选用</small></span>
          <span class="skin-badge ok">已选用</span>
        </div>
        <div class="yun-case-title">{{ currentCase.title }}</div>
        <p class="yun-case-desc">
          {{ currentCase.submitter }} 推荐 · {{ currentCase.chapter }}。{{ currentCase.summary }}
        </p>
        <div class="yun-case-chips">
          <span class="skin-chip on" @click="router.push('/forum')">进入研讨</span>
          <span class="skin-chip" @click="router.push('/cases')">查看案例池</span>
        </div>
      </section>
    </template>

    <!-- ==================================================
      章节学习 + 最新研讨 + AI 助教（两皮肤通用）
      ================================================== -->
    <el-row :gutter="16" class="home-row">
      <el-col :xs="24" :md="14">
        <div class="card">
          <h3 class="card-title">章节学习</h3>
          <el-table :data="COURSE.chapters" stripe>
            <el-table-column prop="title" label="章节" min-width="220" />
            <el-table-column label="进度" width="180">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :stroke-width="10" />
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :type="
                    row.status === '已完成'
                      ? 'success'
                      : row.status === '进行中'
                        ? 'warning'
                        : 'info'
                  "
                  effect="plain"
                >
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" align="right">
              <template #default>
                <el-button link type="primary" size="small">进入学习</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>

      <el-col :xs="24" :md="10">
        <div class="card">
          <h3 class="card-title">最新研讨</h3>
          <ul class="post-list">
            <li v-for="p in latestPosts" :key="p.id">
              <router-link :to="`/forum?id=${p.id}`" class="post-title">
                {{ p.title }}
              </router-link>
              <div class="text-sub">
                {{ p.author }} · {{ p.replies }} 条回复 · {{ p.createdAt }}
              </div>
            </li>
          </ul>
        </div>

        <div class="card">
          <h3 class="card-title">AI 助教</h3>
          <p class="text-sub">
            基于《管理学》教材与课件构建的知识库，支持课后答疑与苏格拉底式引导提问。
          </p>
          <el-button type="primary" plain class="w-full" @click="router.push('/ask')">开始提问</el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.course-home {
  padding-bottom: 12px;
}

/* —— 墨读杂志封面（示意 A-1）—— */
.mo-magazine {
  margin-bottom: 16px;
  background: #f7f3ea;
  border: 1px solid #1f1b16;
  border-radius: 3px;
}

/* —— 云课笺顶部（示意 B-1）—— */
.yun-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.yun-hi {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-main);
}

.yun-hi small {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-faint);
  margin-left: 8px;
}

.yun-badges {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.card {
  padding: 14px 16px;
  margin-bottom: 12px;
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
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
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

.card-title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
}

.post-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.post-list li {
  padding: 10px 0;
  border-bottom: 1px dashed var(--border);
}

.post-list li:last-child {
  border-bottom: none;
}

.post-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.w-full {
  width: 100%;
}

.home-row {
  margin-top: 4px;
}
</style>
