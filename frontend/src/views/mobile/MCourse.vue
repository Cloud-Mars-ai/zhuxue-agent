<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { COURSE, HOMEWORKS } from '@/mock/data'
import { useUserStore } from '@/stores/user'
import { useModelStore } from '@/stores/model'
import { useCasesStore } from '@/stores/cases'
import { useAssessmentStore } from '@/stores/assessment'
import { usePracticeStore } from '@/stores/practice'
import { usePersonaStore } from '@/stores/persona'
import { useThemeStore } from '@/stores/theme'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useCourseStudioStore } from '@/stores/courseStudio'
import { diagnoseGaps } from '@/utils/diagnose'
import { buildFeed } from '@/utils/feed'
import { generateCourseBlueprint } from '@/api/courseStudio'
import danceBuddySrc from '@/assets/nailong-dance.webp'

const router = useRouter()
const userStore = useUserStore()
const modelStore = useModelStore()
const casesStore = useCasesStore()
const assessmentStore = useAssessmentStore()
const practiceStore = usePracticeStore()
const personaStore = usePersonaStore()
const themeStore = useThemeStore()
const knowledgeStore = useKnowledgeStore()
const courseStudioStore = useCourseStudioStore()

const MOBILE_ROUTE = {
  '/app/practice': '/m/practice',
  '/app/selftest': '/m/selftest',
  '/app/cheatsheet': '/m/cheatsheet',
  '/app/checkup': '/m/checkup',
  '/app/assessment': '/m/assessment',
  '/app/cases': '/m/case',
  '/app/ask': '/m/ask',
  '/app/homework': '/m/course',
}

function toMobile(to) {
  if (!to) return to
  if (typeof to === 'string') return MOBILE_ROUTE[to] || to
  return { ...to, path: MOBILE_ROUTE[to.path] || to.path }
}

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
 * 纸感首页数据
 * ================================================== */
const currentChapter = computed(
  () => COURSE.chapters.find((c) => c.status === '进行中') || COURSE.chapters[0],
)

const heroProgress = computed(() => currentChapter.value?.progress ?? overallProgress.value)

const pendingAssessmentCount = computed(() => {
  if (!isStudent.value) return 0
  return assessmentStore.visibleItemsFor(userStore.user?.id).filter((e) => !e.item.answer).length
})

const myPracticeCount = computed(() => {
  if (!isStudent.value) return 0
  return practiceStore.myRecords(userStore.user?.id).length
})

// 盲区诊断（本地规则）
const gapReport = computed(() =>
  diagnoseGaps({ persona: personaStore.data, studentName: userStore.name || '同学' }),
)

// 今日待办 = 主动学习 Feed（移动端路由转换）
const todoRows = computed(() => {
  if (isStudent.value) {
    return buildFeed({
      persona: personaStore.data,
      gaps: gapReport.value.gaps,
      pendingAssessment: pendingAssessmentCount.value,
      daysSincePractice: practiceStore.daysSinceLast(userStore.user?.id),
      currentChapter: currentChapter.value?.title || '',
      homeworks: HOMEWORKS,
    }).map((r) => ({ ...r, to: toMobile(r.to) }))
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
        { ic: '板', color: '#3D5BD9', name: '板书讲解', sub: '边讲解 · 边追问', to: '/m/board' },
        { ic: '题', color: '#E8590C', name: '一人一题', sub: 'AI 出题练习', to: '/m/practice' },
        { ic: '测', color: '#3B5BDB', name: '章节自测', sub: '先测后学', to: '/m/selftest' },
        { ic: '表', color: '#9C36B5', name: '备考速查', sub: '按主题重组', to: '/m/cheatsheet' },
        { ic: '检', color: '#2B8A3E', name: '学习体检', sub: '盲区与建议', to: '/m/checkup' },
        { ic: '例', color: '#0C8599', name: '课前案例', sub: '提交兴趣案例', to: '/m/case' },
        { ic: '考', color: '#2B8A3E', name: '课程考核', sub: '模拟面试', to: '/m/assessment' },
        { ic: '问', color: '#F59F00', name: 'AI协助', sub: '小管同学', to: '/m/ask' },
        { ic: '我', color: '#495057', name: '我的', sub: '背景与设置', to: '/m/mine' },
      ]
    : [
        { ic: '板', color: '#3D5BD9', name: '板书讲解', sub: '课程内容对照', to: '/m/board' },
        { ic: '稿', color: '#3B5BDB', name: '案例选稿台', sub: '筛选 / 选用 / 驳回', to: '/m/case' },
        { ic: '卷', color: '#E8590C', name: '出题阅卷台', sub: '圈人出题 · 评分', to: '/m/assessment' },
        { ic: '问', color: '#F59F00', name: 'AI协助', sub: '小管同学', to: '/m/ask' },
      ],
)

const heroInput = ref('')
const studyMode = ref('course')
const modeChosen = ref(false)
const showModeMenu = ref(false)
const generatingCourse = ref(false)
const mHeroTitle = '奶龙陪你定制专属课程~'
const mHeroSub = ''

const mHeroMaterials = computed(() =>
  isStudent.value
    ? [
        { no: '1', title: '教学大纲', desc: '章节进度', to: '/m/course' },
        { no: '2', title: '课程案例', desc: '预习与研讨', to: '/m/case' },
        { no: '3', title: '学习记录', desc: '练习与盲区', to: '/m/checkup' },
      ]
    : [
        { no: '1', title: '课程资料', desc: '课件与教材', to: '/m/course' },
        { no: '2', title: '待选案例', desc: '学生提交', to: '/m/case' },
        { no: '3', title: '待复核题', desc: 'AI 已生成', to: '/m/assessment' },
      ],
)

const mHeroActions = computed(() =>
  isStudent.value
    ? [
        { label: '章节自测', to: '/m/selftest' },
        { label: '备考速查', to: '/m/cheatsheet' },
        { label: '学习体检', to: '/m/checkup' },
      ]
    : [
        { label: '教学主控台', to: '/m/course' },
        { label: '课程资料', to: '/m/course' },
        { label: '学情统计', to: '/m/course' },
      ],
)

const mPrimary = computed(() => quickEntries.value.slice(0, 4))
const mSecondary = computed(() => quickEntries.value.slice(4))

function chooseStudyMode(mode) {
  studyMode.value = mode
  modeChosen.value = true
  showModeMenu.value = false
}

async function askHero() {
  const q = heroInput.value.trim()
  if (!q || generatingCourse.value) return
  if (!modeChosen.value) {
    showModeMenu.value = true
    showToast('请先选择正常上课或考前冲刺')
    return
  }
  generatingCourse.value = true
  try {
    const result = await generateCourseBlueprint({
      chapter: currentChapter.value?.title || '未分章材料',
      objective: q,
      audience: userStore.discipline
        ? `管理学学生（${userStore.discipline}背景）`
        : '管理学本科生',
      mode: studyMode.value,
      durationMinutes: 30,
    })
    const saved = await courseStudioStore.createDraft({
      ownerId: userStore.user?.id || '',
      input: {
        chapter: currentChapter.value?.title || '未分章材料',
        objective: q,
        audience: userStore.discipline
          ? `管理学学生（${userStore.discipline}背景）`
          : '管理学本科生',
        mode: studyMode.value,
        durationMinutes: 30,
      },
      result,
    })
    showToast(result.fallback ? '已生成可编辑大纲（演示缓存）' : '课程大纲已生成')
    await router.push({ path: '/m/studio', query: { project: saved.id } })
  } catch (error) {
    showToast(error.message || '课程大纲生成失败')
  } finally {
    generatingCourse.value = false
  }
}

knowledgeStore.load()
</script>

<template>
  <div class="m-page">
    <!-- ==================================================
      方案一 · 夜读：杂志封面式课程主页（示意 A-1）
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
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M150 34 a26 26 0 1 1 0.1 0" class="f-body" />
            <path d="M124 30 q26 -22 52 0 l4 8 q-30 -12 -60 0 z" class="f-accent" />
            <path d="M176 34 l24 6 -24 6" class="f-accent" />
            <circle cx="140" cy="36" r="3.2" class="f-ink" /><circle cx="162" cy="36" r="3.2" class="f-ink" />
            <path d="M146 48 q8 6 16 0" />
            <path d="M150 62 q-4 40 -22 62 l38 8 q10 -30 6 -66" class="f-body" />
            <path d="M132 128 l-14 46 h84 l-10 -46" class="f-body" />
            <path d="M120 174 h96" class="s-accent" />
            <rect x="96" y="104" width="72" height="44" rx="3" class="f-body" />
            <path d="M96 104 l36 -14 36 14" class="f-body" />
            <circle cx="132" cy="126" r="7" class="s-accent" />
            <path d="M60 158 q10 -22 30 -24 q-4 -14 8 -20 q10 16 -6 26 q22 2 30 22 q-16 -8 -30 -4 q-14 4 -32 0z" class="f-body" />
            <circle cx="86" cy="136" r="2.6" class="f-ink" />
            <path d="M28 178 q30 -10 60 0 t60 0" class="s-dim" stroke-dasharray="4 6" />
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
              <span v-for="(t, ti) in todoRows.slice(0, 3)" :key="ti">
                {{ ['①', '②', '③'][ti] }} {{ t.title }}<br />
              </span>
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
      方案二 · 运行台：问候 + 待办 + 四宫格（示意 B-1）
      ================================================== -->
    <template v-else>
      <section class="m-home-hero" data-testid="yun-greeting">
        <div class="m-hero-tabs">
          <span class="on">开始学习</span>
          <span @click="router.push('/m/ask')">AI协助</span>
        </div>
        <h1 class="m-hero-title">{{ mHeroTitle }}</h1>
        <p v-if="mHeroSub" class="m-hero-sub">{{ mHeroSub }}</p>

        <div class="m-material-row">
          <div
            v-for="m in mHeroMaterials"
            :key="m.title"
            class="m-material-card"
            @click="router.push(m.to)"
          >
            <span class="m-material-no">{{ m.no }}</span>
            <div class="m-material-main">
              <div class="m-material-title">{{ m.title }}</div>
              <div class="m-material-desc">{{ m.desc }}</div>
            </div>
            <span class="m-material-plus">+</span>
          </div>
        </div>

        <div class="m-ask-box">
          <div v-if="!modeChosen && !heroInput" class="m-mode-prompt">
            <span>请选择</span>
            <button type="button" @click="chooseStudyMode('course')">
              <span>▤</span> 正常上课
            </button>
            <span>或</span>
            <button type="button" @click="chooseStudyMode('sprint')">
              <span>ϟ</span> 考前冲刺
            </button>
            <span>再输入要求</span>
          </div>
          <van-field
            v-model="heroInput"
            type="textarea"
            rows="2"
            autosize
            :placeholder="modeChosen ? '描述想学的课程目标…' : ''"
            class="m-ask-field"
            :class="{ 'with-mode-prompt': !modeChosen }"
            @keyup.enter="askHero"
          />
          <div class="m-ask-tools">
            <div class="m-ask-left-group">
              <div v-if="modeChosen" class="m-mode-dock-wrap">
                <button type="button" class="m-mode-dock" @click="showModeMenu = !showModeMenu">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 10.2 12 5l9 5.2-9 5.2-9-5.2Z" />
                    <path d="M6.5 12.3v4.2c2.8 2 8.2 2 11 0v-4.2" />
                    <path d="M21 10.5v5" />
                  </svg>
                </button>
                <div v-if="showModeMenu" class="m-mode-menu">
                  <button
                    type="button"
                    :class="{ active: studyMode === 'course' }"
                    @click="chooseStudyMode('course')"
                  >
                    <span>▤</span> 正常上课
                  </button>
                  <button
                    type="button"
                    :class="{ active: studyMode === 'sprint' }"
                    @click="chooseStudyMode('sprint')"
                  >
                    <span>ϟ</span> 考前冲刺
                  </button>
                </div>
              </div>
              <div class="m-ask-chips">
              <span
                v-for="a in mHeroActions"
                :key="a.label"
                class="skin-chip"
                @click="router.push(a.to)"
              >
                {{ a.label }}
              </span>
              </div>
            </div>
            <div class="m-ask-right">
              <span class="m-model">{{ modelStore.config.model }}</span>
              <button class="m-send" :disabled="!heroInput.trim() || generatingCourse" @click="askHero">
                {{ generatingCourse ? '…' : '↑' }}
              </button>
            </div>
          </div>
        </div>
        <p class="m-hero-hint">
          将依据已接入的 {{ knowledgeStore.materials.length }} 份教师确认材料生成课程。
        </p>
        <div class="m-hero-dance" aria-hidden="true">
          <img :src="danceBuddySrc" alt="" draggable="false" decoding="async" />
        </div>
      </section>

      <div class="m-home-below-fold-spacer" aria-hidden="true"></div>

      <section class="m-card m-continue">
        <div class="m-continue-head">
          <span>继续学习</span>
          <span class="skin-badge run">{{ currentChapter.status }}</span>
        </div>
        <div class="m-continue-title">{{ currentChapter.title }}</div>
        <p class="m-continue-desc">本周进度 {{ heroProgress }}%，先立框架再做题。</p>
        <van-progress :percentage="heroProgress" :show-pivot="false" stroke-width="5" />
        <div class="m-continue-actions">
          <van-button size="small" type="primary" @click="router.push('/m/selftest')">
            先测这一章
          </van-button>
          <van-button size="small" plain @click="router.push('/m/cheatsheet')">
            看速查表
          </van-button>
        </div>
      </section>

      <section class="m-card" data-testid="yun-todo">
        <div class="m-feed-head">
          <span>今天安排</span>
          <span>{{ todoRows.length }} 项 · 按优先级</span>
        </div>
        <div
          v-for="(r, i) in todoRows.slice(0, 3)"
          :key="i"
          class="m-feed-row"
          @click="r.to && router.push(r.to)"
        >
          <span class="m-feed-dot" :style="{ background: r.dot }" />
          <div class="m-feed-main">
            <div class="m-feed-title">{{ r.title }}</div>
            <div class="m-feed-sub">{{ r.sub }}</div>
          </div>
          <span class="m-feed-chev">›</span>
        </div>
      </section>

      <section class="m-primary-grid" data-testid="yun-grid">
        <div
          v-for="e in mPrimary"
          :key="e.name"
          class="m-primary"
          @click="router.push(e.to)"
        >
          <span class="m-primary-ic" :style="{ background: e.color }">{{ e.ic }}</span>
          <div class="m-primary-main">
            <div class="m-primary-name">{{ e.name }}</div>
            <div class="m-primary-sub">{{ e.sub }}</div>
          </div>
        </div>
      </section>
      <div class="m-text-links">
        <a v-for="l in mSecondary" :key="l.name" @click="router.push(l.to)">{{ l.name }}</a>
      </div>

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

/* —— 纸感首页（对齐 HyperKnow 首屏）—— */
.m-home-hero {
  position: relative;
  padding: 14px 16px 6px;
  text-align: center;
}

.m-hero-tabs {
  display: inline-flex;
  gap: 8px;
  margin-bottom: 14px;
}

.m-hero-tabs span {
  padding: 5px 14px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  color: var(--text-sub);
}

.m-hero-tabs span.on {
  background: var(--card-bg);
  border-color: var(--card-border);
  color: var(--text-main);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(74, 62, 38, 0.08);
}

.m-hero-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.3;
  font-family: var(--font-calligraphy);
  font-weight: 400;
  letter-spacing: 0.6px;
  color: var(--text-main);
  -webkit-text-stroke: 0.24px currentColor;
  text-shadow: 0.35px 0.2px 0 color-mix(in srgb, var(--text-main) 22%, transparent);
}

.m-hero-sub {
  margin: 8px 0 16px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--text-sub);
}

.m-material-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
  text-align: left;
}

.m-material-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
}

.m-material-no {
  display: grid;
  place-items: center;
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text-sub);
  font-family: var(--font-mono);
  font-size: 10px;
}

.m-material-main {
  flex: 1;
  min-width: 0;
}

.m-material-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-main);
}

.m-material-desc {
  margin-top: 1px;
  font-size: 10.5px;
  color: var(--text-faint);
}

.m-material-plus {
  color: var(--text-faint);
  font-size: 16px;
}

.m-ask-box {
  position: relative;
  padding: 10px 12px 8px;
  text-align: left;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  box-shadow: var(--card-shadow);
}

.m-mode-prompt {
  position: absolute;
  z-index: 2;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  color: color-mix(in srgb, var(--text-faint) 78%, transparent);
  font-size: 12px;
  pointer-events: none;
}

.m-mode-prompt button {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  color: color-mix(in srgb, var(--text-faint) 85%, transparent);
  background: color-mix(in srgb, var(--surface-2) 72%, transparent);
  border: 1px solid color-mix(in srgb, var(--card-border) 75%, transparent);
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: 11.5px;
  pointer-events: auto;
}

.m-ask-field.with-mode-prompt :deep(.van-field__control) {
  min-height: 42px;
}

.m-ask-field {
  padding: 0;
  background: transparent;
}

.m-ask-left-group {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.m-mode-dock-wrap {
  position: relative;
  flex: none;
}

.m-mode-dock {
  width: 27px;
  height: 27px;
  display: grid;
  place-items: center;
  padding: 6px;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid color-mix(in srgb, var(--accent) 28%, var(--card-border));
  border-radius: 50%;
}

.m-mode-dock svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.m-mode-menu {
  position: absolute;
  z-index: 15;
  left: 0;
  bottom: 34px;
  width: 145px;
  display: grid;
  gap: 3px;
  padding: 5px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--card-shadow);
}

.m-mode-menu button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 8px;
  color: var(--text-sub);
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: 10.5px;
  text-align: left;
}

.m-mode-menu button.active {
  color: var(--accent);
  background: var(--accent-soft);
}

.m-ask-field :deep(.van-field__control) {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-main);
}

.m-ask-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.m-ask-chips {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.m-ask-chips .skin-chip {
  margin: 0;
  padding: 3px 8px;
  font-size: 10.5px;
}

.m-ask-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.m-model {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--text-faint);
}

.m-send {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-on);
  font-size: 14px;
}

.m-send:disabled {
  opacity: 0.35;
}

.m-hero-hint {
  margin: 8px 0 0;
  font-size: 10.5px;
  color: var(--text-faint);
}

.m-hero-dance {
  position: absolute;
  z-index: 2;
  right: 18px;
  bottom: -70px;
  width: 76px;
  pointer-events: none;
  filter: drop-shadow(0 7px 12px rgba(74, 62, 38, 0.12));
  animation: m-dance-bob 3.2s ease-in-out infinite;
}

.m-hero-dance img {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
}

.m-home-below-fold-spacer {
  height: max(250px, calc(100svh - 460px));
}

@keyframes m-dance-bob {
  0%,
  100% {
    transform: translateY(0) rotate(-1deg);
  }
  50% {
    transform: translateY(-4px) rotate(1deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .m-hero-dance {
    animation: none;
  }
}

.m-continue {
  margin-top: 0;
}

.m-continue-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.m-continue-title {
  margin: 2px 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.m-continue-desc {
  margin: 0 0 8px;
  font-size: 11.5px;
  color: var(--text-sub);
}

.m-continue-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.m-feed-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.m-feed-head span:last-child {
  font-size: 10.5px;
  font-weight: 400;
  color: var(--text-faint);
}

.m-feed-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid var(--divider);
}

.m-feed-row:last-child {
  border-bottom: none;
}

.m-feed-dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.m-feed-main {
  flex: 1;
  min-width: 0;
}

.m-feed-title {
  font-size: 12px;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-feed-sub {
  font-size: 10.5px;
  color: var(--text-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-feed-chev {
  color: var(--text-faint);
  font-size: 14px;
}

.m-primary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 0 12px 8px;
}

.m-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
}

.m-primary-ic {
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.m-primary-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.m-primary-sub {
  font-size: 10px;
  color: var(--text-faint);
}

.m-text-links {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin: 0 16px 12px;
  font-size: 11.5px;
  color: var(--text-sub);
}

.m-text-links a {
  padding-bottom: 1px;
  border-bottom: 1px dashed var(--divider);
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
 * 夜读杂志封面：移动端适配（示意 A-1）
 * 置于块尾覆盖 skins.css 的共享定义
 * ================================================== */
.mo-magazine {
  margin: 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
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

/* 手绘线稿插图：线条/填充全部走令牌，随皮肤（夜读深色）自适应 */
.mo-hero-art svg {
  stroke: var(--text-main);
}
.mo-hero-art .f-body {
  fill: var(--surface-2);
}
.mo-hero-art .f-accent {
  fill: var(--accent);
  stroke: var(--accent);
}
.mo-hero-art .f-ink {
  fill: var(--text-main);
}
.mo-hero-art .s-accent {
  stroke: var(--accent);
}
.mo-hero-art .s-dim {
  stroke: var(--text-sub);
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
  border-top: 1px dashed var(--divider);
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
