<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { COURSE, FORUM_POSTS, HOMEWORKS } from '@/mock/data'
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
import { importMaterialFile } from '@/utils/materialImport'
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

// 盲区诊断（本地规则）：供主动 Feed 排序
const gapReport = computed(() =>
  diagnoseGaps({ persona: personaStore.data, studentName: userStore.name || '同学' }),
)

// 今日待办 = 主动学习 Feed：每条都带"为什么是它"
const todoRows = computed(() => {
  if (isStudent.value) {
    return buildFeed({
      persona: personaStore.data,
      gaps: gapReport.value.gaps,
      pendingAssessment: pendingAssessmentCount.value,
      daysSincePractice: practiceStore.daysSinceLast(userStore.user?.id),
      currentChapter: currentChapter.value?.title || '',
      homeworks: HOMEWORKS,
    })
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
      to: '/app/cases',
    })
  }
  if (reviewCount > 0) {
    rows.push({
      dot: '#F59F00',
      title: `考核题目待复核 ${reviewCount} 道`,
      sub: 'AI 已逐人生成，待复核发布',
      date: '',
      to: '/app/assessment',
    })
  }
  if (!rows.length) {
    rows.push({ dot: '#2B8A3E', title: '暂无待处理事项', sub: '案例与考核均已处理完毕', date: '', to: '' })
  }
  return rows
})

// 四宫格快捷入口（方案示意 B-1）
const allEntries = computed(() =>
  isStudent.value
    ? [
        { ic: '板', color: '#3D5BD9', name: '板书讲解', sub: '边讲解 · 边追问', to: '/app/board' },
        { ic: '题', color: '#E8590C', name: '一人一题', sub: 'AI 出题练习', to: '/app/practice' },
        { ic: '测', color: '#3D5BD9', name: '章节自测', sub: '先测后学', to: '/app/selftest' },
        { ic: '表', color: '#9C36B5', name: '备考速查', sub: '按主题重组', to: '/app/cheatsheet' },
        { ic: '检', color: '#2F8F5B', name: '学习体检', sub: '盲区与建议', to: '/app/checkup' },
        { ic: '例', color: '#0C8599', name: '课前案例', sub: '提交兴趣案例', to: '/app/cases' },
        { ic: '考', color: '#2F8F5B', name: '课程考核', sub: '模拟面试', to: '/app/assessment' },
        { ic: '坛', color: '#6B6558', name: '研讨论坛', sub: '同学讨论', to: '/app/forum' },
      ]
    : [
        { ic: '稿', color: '#3D5BD9', name: '案例选稿台', sub: '筛选 / 选用 / 驳回', to: '/app/cases' },
        { ic: '卷', color: '#E8590C', name: '出题阅卷台', sub: '圈人出题 · 评分', to: '/app/assessment' },
        { ic: '析', color: '#2F8F5B', name: '学情统计', sub: '参与度 · 掌握度', to: '/app/statistics' },
        { ic: '料', color: '#B7791F', name: '课程资料库', sub: '材料接入 · 检索', to: '/app/materials' },
      ],
)

const primaryEntries = computed(() => allEntries.value.slice(0, 4))
const secondaryEntries = computed(() => allEntries.value.slice(4))

const heroInput = ref('')
const studyMode = ref('course')
const modeChosen = ref(false)
const showModeMenu = ref(false)
const generatingCourse = ref(false)
const uploadInput = ref()
const activeUploadKind = ref('')
const uploadingKind = ref('')
const UPLOAD_STORAGE_KEY = 'ai-tutor-home-uploads'
const uploadHistory = ref(loadUploadHistory())

const MATERIAL_LABELS = {
  syllabus: '教学大纲',
  courseware: '课程课件',
  more: '更多材料',
}

function loadUploadHistory() {
  try {
    const raw = window.localStorage.getItem(UPLOAD_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}
const showToolMenu = ref(false)
const canGenerateCourse = computed(() => !!userStore.user)

const heroTitle = '奶龙陪你定制专属课程~'
const heroSubtitle = ''

const heroPlaceholder = computed(() =>
  modeChosen.value
    ? '描述想学的课程目标，例如：帮我生成一节案例判断课…'
    : '',
)

const heroHint = computed(() =>
  generatingCourse.value
    ? '正在检索已上传材料并生成可编辑大纲，通常需要数秒…'
    : `将依据已接入的 ${knowledgeStore.materials.length} 份教师确认材料生成大纲；补充材料会优先参与编排。`,
)

const heroActions = computed(() =>
  isStudent.value
    ? [
        { label: '板书讲解', to: '/app/board' },
        { label: '章节自测', to: '/app/selftest' },
        { label: '备考速查', to: '/app/cheatsheet' },
        { label: '学习体检', to: '/app/checkup' },
      ]
    : [
        { label: '教学主控台', to: '/app/console' },
        { label: '课程资料', to: '/app/materials' },
        { label: '学情统计', to: '/app/statistics' },
      ],
)

const assistantTools = computed(() => [
  {
    label: '生成课程',
    desc: '从已上传材料编排课程',
    icon: '课',
    action: () => {
      heroInput.value =
        heroInput.value ||
        `围绕${currentChapter.value?.title || '当前章节'}生成一节能用于案例判断的课程`
      askHero()
    },
  },
  {
    label: '板书讲解',
    desc: '从路线图讲到追问',
    icon: '板',
    action: () =>
      router.push({
        path: '/app/board',
        query: {
          chapter: currentChapter.value?.title || '',
          mode: studyMode.value,
        },
      }),
  },
  {
    label: 'AI协助',
    desc: '围绕当前章节答疑',
    icon: '问',
    action: () => router.push({ path: '/app/ask', query: { mode: studyMode.value } }),
  },
  {
    label: '章节自测',
    desc: '先测后讲',
    icon: '测',
    action: () => router.push('/app/selftest'),
  },
  {
    label: '学习体检',
    desc: '看盲区与下一步',
    icon: '检',
    action: () => router.push('/app/checkup'),
  },
])

const heroMaterials = computed(() =>
  [
    { kind: 'syllabus', no: '1', title: '教学大纲', desc: '课程大纲与安排' },
    { kind: 'courseware', no: '2', title: '课程课件', desc: '讲义与笔记' },
    { kind: 'more', no: '3', title: '更多材料', desc: '作业、模拟考试等' },
  ].map((item) => ({
    ...item,
    files: uploadHistory.value[item.kind] || [],
    action: () => openFilePicker(item.kind),
  })),
)

const chapterDesc = computed(
  () => `本周进度 ${heroProgress.value}%，先把这一章的概念框架立起来，再做题。`,
)

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
    ElMessage.info('请先选择正常上课或考前冲刺模式')
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
    ElMessage.success(
      result.fallback ? '已基于教师材料生成可编辑大纲（演示缓存）' : '课程大纲已生成',
    )
    await router.push({ path: '/app/studio', query: { project: saved.id } })
  } catch (error) {
    ElMessage.error(error.message || '课程大纲生成失败')
  } finally {
    generatingCourse.value = false
  }
}

function openAssistantTool(tool) {
  showToolMenu.value = false
  tool.action()
}

function openModeFromDock() {
  showModeMenu.value = !showModeMenu.value
}

function openHeroAction(action) {
  if (action.to === '/app/board') {
    router.push({
      path: action.to,
      query: {
        chapter: currentChapter.value?.title || '',
        mode: studyMode.value,
      },
    })
    return
  }
  router.push(action.to)
}

function openFilePicker(kind) {
  activeUploadKind.value = kind
  if (uploadInput.value) {
    uploadInput.value.value = ''
    uploadInput.value.click()
  }
}

function saveUploadHistory() {
  try {
    window.localStorage.setItem(UPLOAD_STORAGE_KEY, JSON.stringify(uploadHistory.value))
  } catch {
    // 本地存储不可用时只保留当前会话
  }
}

async function handleFilesSelected(event) {
  const files = [...(event.target.files || [])]
  const kind = activeUploadKind.value
  if (!files.length || !MATERIAL_LABELS[kind]) return

  uploadingKind.value = kind
  await knowledgeStore.ensureLoaded()
  let imported = 0
  const failures = []

  for (const file of files) {
    try {
      const text = await importMaterialFile(file)
      await knowledgeStore.addMaterial({
        title: `${MATERIAL_LABELS[kind]} · ${file.name}`,
        chapter: currentChapter.value?.title || '未分章材料',
        text,
      })
      const history = uploadHistory.value[kind] || []
      uploadHistory.value[kind] = [
        {
          name: file.name,
          size: file.size,
          chars: text.length,
          at: new Date().toISOString(),
        },
        ...history,
      ].slice(0, 6)
      imported += 1
    } catch (err) {
      failures.push(`${file.name}：${err.message || '解析失败'}`)
    }
  }

  saveUploadHistory()
  if (imported) ElMessage.success(`已导入 ${imported} 份材料，AI 将优先依据这些内容`)
  if (failures.length) ElMessage.warning(failures.join('；'))
  uploadingKind.value = ''
}

// 夜读三栏目录：TODO / CASE / PROGRESS
const moTodoItems = computed(() => {
  if (isStudent.value) {
    return todoRows.value.slice(0, 3).map((r) => r.title)
  }
  const reviewCount = assessmentStore.tasks.flatMap((t) => t.items).filter((i) => i.status === 'pending_review').length
  const pendingCases = casesStore.cases.filter((c) => c.status === 'pending').length
  return [`案例池待选用 ${pendingCases} 条`, `考核题目待复核 ${reviewCount} 道`]
})

/** 掌握度五级（S2-5）：未开始 / 已尝试 / 熟悉 / 熟练 / 已掌握 */
function masteryOf(chapter) {
  return personaStore.data.mastery[chapter]?.level || '未开始'
}

function masteryTagType(chapter) {
  const level = masteryOf(chapter)
  if (level === '已掌握' || level === '熟练') return 'success'
  if (level === '熟悉') return 'primary'
  if (level === '已尝试') return 'warning'
  return 'info'
}

function startSelfTest(chapter) {
  router.push({ path: '/app/selftest', query: { chapters: chapter, count: 5 } })
}

onMounted(() => {
  knowledgeStore.load()
})
</script>

<template>
  <div class="course-home">
    <!-- ==================================================
      方案一 · 夜读：杂志封面式课程主页（示意 A-1）
      ================================================== -->
    <section v-if="themeStore.isMo" class="mo-magazine" data-testid="mo-course-home">
      <div class="mo-mast">
        <span class="mo-mast-brand">管理学<em>日课</em></span>
        <nav class="mo-mast-nav">
          <a @click="router.push('/app/ask')">答疑</a>
          <a @click="router.push('/app/practice')">练习</a>
          <a @click="router.push('/app/cases')">案例</a>
          <a @click="router.push('/app/assessment')">考核</a>
          <a @click="router.push('/app/forum')">论坛</a>
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
            <a @click="router.push('/app/practice')">进入今日之题 →</a>
            <a @click="router.push('/app/cases')">提交预习案例 →</a>
          </div>
        </div>
        <div class="mo-hero-art">
          <svg
            width="240"
            height="190"
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
              <span v-for="(t, ti) in moTodoItems" :key="ti">
                {{ ['①', '②', '③'][ti] }} {{ t }}<br />
              </span>
            </p>
          </template>
          <template v-else>
            <h4 class="mo-col-title">两件事</h4>
            <p class="mo-col-text">
              ① {{ moTodoItems[0] }}<br />
              ② {{ moTodoItems[1] }}
            </p>
          </template>
          <span class="mo-col-more" @click="router.push(isStudent ? '/app/practice' : '/app/assessment')">查看全部 →</span>
        </div>
        <div class="mo-col">
          <div class="mo-col-no">CASE · 本节课案例</div>
          <template v-if="currentCase">
            <h4 class="mo-col-title">{{ currentCase.title }}</h4>
            <p class="mo-col-text">
              {{ currentCase.submitter }} 推荐 · {{ currentCase.discipline }}<br />
              {{ currentCase.chapter }}，老师已选用。
            </p>
            <span class="mo-col-more" @click="router.push('/app/cases')">进入研讨 →</span>
          </template>
          <template v-else>
            <h4 class="mo-col-title">虚位以待</h4>
            <p class="mo-col-text">老师尚未选用本节课案例，<br />去案例池看看同学们的推荐。</p>
            <span class="mo-col-more" @click="router.push('/app/cases')">进入案例池 →</span>
          </template>
        </div>
        <div class="mo-col">
          <div class="mo-col-no">PROGRESS · {{ isStudent ? '我的进度' : '班级进度' }}</div>
          <div class="mo-col-num">{{ heroProgress }}%</div>
          <p class="mo-col-text">
            {{ currentChapter.title }}<br />
            练习 {{ myPracticeCount }} 次 · 连续 3 天
          </p>
          <span class="mo-col-more" @click="router.push('/app/statistics')">学习档案 →</span>
        </div>
      </div>
    </section>

    <!-- ==================================================
      方案二 · 运行台：问候 + 待办 + 四宫格（示意 B-1）
      ================================================== -->
    <template v-else>
      <section class="home-hero" data-testid="yun-greeting">
        <div class="hero-tabs">
          <button class="hero-tab on" type="button">开始学习</button>
          <button class="hero-tab" type="button" @click="router.push('/app/ask')">AI协助</button>
        </div>

        <div class="hero-kicker">
          {{ greeting }}，{{ userStore.name || '同学' }} · 《{{ COURSE.name }}》第 8 周
        </div>
        <h1 class="hero-title">{{ heroTitle }}</h1>
        <p v-if="heroSubtitle" class="hero-sub">{{ heroSubtitle }}</p>

        <div class="learning-composer">
          <div class="material-row">
            <button
              v-for="m in heroMaterials"
              :key="m.title"
              class="material-card"
              type="button"
              :disabled="uploadingKind === m.kind"
              @click="m.action()"
            >
              <span class="material-no">{{ m.no }}</span>
              <span class="material-main">
                <span class="material-title">{{ m.title }}</span>
                <span class="material-desc">
                  {{ m.files[0]?.name || m.desc }}
                </span>
              </span>
              <span class="material-plus">
                {{ uploadingKind === m.kind ? '…' : m.files.length ? '✓' : '+' }}
              </span>
            </button>
          </div>

          <div class="ask-box">
            <div class="composer-input-wrap">
              <div v-if="!modeChosen && !heroInput" class="mode-prompt">
                <span>请选择</span>
                <button type="button" @click="chooseStudyMode('course')">
                  <span>▤</span> 正常上课
                </button>
                <span>或</span>
                <button type="button" @click="chooseStudyMode('sprint')">
                  <span>ϟ</span> 考前冲刺
                </button>
                <span>模式，再输入您的具体要求。</span>
              </div>
              <textarea
                v-model="heroInput"
                rows="2"
                :class="{ 'with-mode-prompt': !modeChosen }"
                :placeholder="heroPlaceholder"
                @keydown.enter.exact.prevent="askHero"
              />
            </div>
            <div class="ask-tools">
              <div class="ask-left">
                <div class="ask-plus-wrap">
                  <button
                    class="ask-plus"
                    type="button"
                    :aria-expanded="showToolMenu"
                    aria-label="打开学习工具"
                    @click="showToolMenu = !showToolMenu"
                  >
                    +
                  </button>
                  <div v-if="showToolMenu" class="assistant-tool-menu">
                    <button
                      v-for="tool in assistantTools"
                      :key="tool.label"
                      type="button"
                      @click="openAssistantTool(tool)"
                    >
                      <span class="assistant-tool-icon">{{ tool.icon }}</span>
                      <span>
                        <strong>{{ tool.label }}</strong>
                        <small>{{ tool.desc }}</small>
                      </span>
                    </button>
                  </div>
                </div>
                <div v-if="modeChosen" class="mode-dock-wrap">
                  <button
                    class="mode-dock"
                    type="button"
                    :title="studyMode === 'sprint' ? '当前：考前冲刺' : '当前：正常上课'"
                    :aria-expanded="showModeMenu"
                    @click.stop="openModeFromDock"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 10.2 12 5l9 5.2-9 5.2-9-5.2Z" />
                      <path d="M6.5 12.3v4.2c2.8 2 8.2 2 11 0v-4.2" />
                      <path d="M21 10.5v5" />
                    </svg>
                  </button>
                  <div v-if="showModeMenu" class="mode-dock-menu" @click.stop>
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
                <div class="ask-chips">
                  <button
                    v-for="a in heroActions"
                    :key="a.label"
                    class="ask-chip"
                    type="button"
                  @click="openHeroAction(a)"
                  >
                    {{ a.label }}
                  </button>
                </div>
                <span class="ask-sync">
                  本校课程材料
                </span>
              </div>
              <div class="ask-right">
                <span class="model-badge">{{ modelStore.config.model }}</span>
                <button
                  class="ask-send"
                  type="button"
                  :disabled="!heroInput.trim() || generatingCourse"
                  :title="canGenerateCourse ? '从材料生成课程大纲' : '发送问题'"
                  :aria-label="canGenerateCourse ? '从材料生成课程大纲' : '发送问题'"
                  @click="askHero"
                >
                  {{ generatingCourse ? '…' : '↑' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <input
          ref="uploadInput"
          class="hidden-upload"
          type="file"
          multiple
          accept=".pdf,.docx,.pptx,.txt,.md,.markdown,.csv,.json,application/pdf"
          @change="handleFilesSelected"
        />
        <p class="hero-hint">{{ heroHint }}</p>
        <div class="hero-dance" aria-hidden="true">
          <img :src="danceBuddySrc" alt="" draggable="false" decoding="async" />
        </div>
      </section>

      <div class="home-below-fold-spacer" aria-hidden="true"></div>

      <div class="home-columns">
        <section class="card continue-card">
          <div class="card-head">
            <span class="card-title">继续学习</span>
            <span class="skin-badge run">{{ currentChapter.status }}</span>
          </div>
          <div class="continue-title">{{ currentChapter.title }}</div>
          <p class="continue-desc">{{ chapterDesc }}</p>
          <el-progress :percentage="heroProgress" :stroke-width="8" :show-text="false" />
          <div class="continue-meta">{{ heroProgress }}% · 已练习 {{ myPracticeCount }} 次</div>
          <div class="continue-actions">
            <el-button type="primary" size="small" @click="router.push('/app/selftest')">
              先测这一章
            </el-button>
            <el-button size="small" @click="router.push('/app/cheatsheet')">
              看速查表
            </el-button>
          </div>
        </section>

        <section class="card feed-card" data-testid="yun-todo">
          <div class="card-head">
            <span class="card-title">今天安排</span>
            <span class="card-sub">{{ todoRows.length }} 项 · 按优先级</span>
          </div>
          <div
            v-for="(r, i) in todoRows.slice(0, 4)"
            :key="i"
            class="feed-row"
            @click="r.to && router.push(r.to)"
          >
            <span class="feed-dot" :style="{ background: r.dot }" />
            <span class="feed-main">
              <span class="feed-title">{{ r.title }}</span>
              <span class="feed-sub">{{ r.sub }}</span>
            </span>
            <span class="feed-chev">›</span>
          </div>
        </section>
      </div>

      <section class="primary-grid" data-testid="yun-grid">
        <div
          v-for="e in primaryEntries"
          :key="e.name"
          class="primary-entry"
          @click="router.push(e.to)"
        >
          <div class="primary-ic" :style="{ background: e.color }">{{ e.ic }}</div>
          <div class="primary-main">
            <div class="primary-name">{{ e.name }}</div>
            <div class="primary-sub">{{ e.sub }}</div>
          </div>
          <span class="primary-arrow">›</span>
        </div>
      </section>

      <div class="text-links">
        <a v-for="l in secondaryEntries" :key="l.name" @click="router.push(l.to)">{{ l.name }}</a>
      </div>

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
          <span class="skin-chip on" @click="router.push('/app/forum')">进入研讨</span>
          <span class="skin-chip" @click="router.push('/app/cases')">查看案例池</span>
        </div>
      </section>
    </template>

    <!-- ==================================================
      章节学习 + 最新研讨 + AI 助教（两皮肤通用）
      ================================================== -->
    <el-row :gutter="16" class="home-row">
      <el-col :xs="24" :md="14">
        <div id="chapters" class="card">
          <h3 class="card-title">章节学习</h3>
          <el-table :data="COURSE.chapters" stripe>
            <el-table-column prop="title" label="章节" min-width="220" />
            <el-table-column label="进度" width="180">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :stroke-width="10" />
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
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
            <el-table-column label="我的掌握度" width="120">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  effect="plain"
                  :type="masteryTagType(row.title)"
                >
                  {{ masteryOf(row.title) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="startSelfTest(row.title)">
                  去自测
                </el-button>
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
              <router-link :to="`/app/forum?id=${p.id}`" class="post-title">
                {{ p.title }}
              </router-link>
              <div class="text-sub">
                {{ p.author }} · {{ p.replies }} 条回复 · {{ p.createdAt }}
              </div>
            </li>
          </ul>
        </div>

        <div class="card">
          <h3 class="card-title">AI协助</h3>
          <p class="text-sub">
            基于《管理学》教材与课件构建的知识库，支持课后答疑与苏格拉底式引导提问。
          </p>
          <el-button type="primary" plain class="w-full" @click="router.push('/app/ask')">开始提问</el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.course-home {
  padding-bottom: 12px;
}

/* —— 夜读杂志封面（示意 A-1）—— */
.mo-magazine {
  margin-bottom: 16px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 3px;
}

/* —— 运行台顶部（示意 B-1）—— */
.home-hero {
  position: relative;
  max-width: 800px;
  margin: 6px auto 12px;
  text-align: center;
  padding: 4px 8px 0;
}

.hero-tabs {
  display: inline-flex;
  gap: 8px;
  margin-bottom: 20px;
}

.hero-tab {
  padding: 6px 18px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--text-sub);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
}

.hero-tab.on {
  background: var(--card-bg);
  border-color: var(--card-border);
  color: var(--text-main);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(74, 62, 38, 0.08);
}

.hero-kicker {
  margin-bottom: 10px;
  font-size: 12px;
  letter-spacing: 0.4px;
  color: var(--text-faint);
}

.hero-title {
  margin: 0;
  font-size: 38px;
  line-height: 1.25;
  font-family: var(--font-calligraphy);
  font-weight: 400;
  letter-spacing: 1px;
  color: var(--text-main);
  -webkit-text-stroke: 0.28px currentColor;
  text-shadow: 0.4px 0.25px 0 color-mix(in srgb, var(--text-main) 24%, transparent);
}

.hero-sub {
  margin: 8px 0 14px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-sub);
}

.learning-composer {
  position: relative;
  max-width: 720px;
  margin: 0 auto;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
}

.material-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  padding: 6px 8px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--divider);
  border-radius: 16px 16px 0 0;
}

.material-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px 11px;
  background: transparent;
  border: 0;
  border-left: 1px solid var(--divider);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: border-color 0.15s, transform 0.15s;
}

.material-card:first-child {
  border-left: 0;
}

.material-card:hover {
  background: var(--card-bg);
}

.material-card:disabled {
  cursor: wait;
  opacity: 0.65;
}

.material-no {
  flex: none;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text-sub);
  font-family: var(--font-mono);
  font-size: 11px;
}

.material-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.material-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.material-desc {
  margin-top: 2px;
  font-size: 11px;
  color: var(--text-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-plus {
  flex: none;
  font-size: 18px;
  line-height: 1;
  color: var(--text-faint);
}

.ask-box {
  padding: 14px 16px 8px;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.composer-input-wrap {
  position: relative;
  min-height: 48px;
}

.mode-prompt {
  position: absolute;
  z-index: 2;
  inset: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  color: color-mix(in srgb, var(--text-faint) 78%, transparent);
  font-size: 14px;
  line-height: 1.7;
  pointer-events: none;
}

.mode-prompt > span {
  pointer-events: none;
}

.mode-prompt button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  color: color-mix(in srgb, var(--text-faint) 82%, transparent);
  background: color-mix(in srgb, var(--surface-2) 66%, transparent);
  border: 1px solid color-mix(in srgb, var(--card-border) 72%, transparent);
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  pointer-events: auto;
}

.mode-prompt button:hover {
  color: var(--accent);
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 28%, var(--card-border));
}

.ask-box textarea {
  width: 100%;
  min-height: 48px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--text-main);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.7;
}

.ask-box textarea.with-mode-prompt {
  min-height: 52px;
}

.ask-box textarea::placeholder {
  color: var(--text-faint);
}

.ask-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.ask-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ask-plus {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid var(--card-border);
  border-radius: 50%;
  background: transparent;
  color: var(--text-sub);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.ask-plus-wrap {
  position: relative;
  flex: none;
}

.mode-dock-wrap {
  position: relative;
  flex: none;
}

.mode-dock {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  padding: 6px;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid color-mix(in srgb, var(--accent) 26%, var(--card-border));
  border-radius: 50%;
  cursor: pointer;
}

.mode-dock svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.mode-dock-menu {
  position: absolute;
  z-index: 14;
  left: 0;
  bottom: 35px;
  width: 154px;
  display: grid;
  gap: 3px;
  padding: 5px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--card-shadow);
}

.mode-dock-menu button {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 8px;
  color: var(--text-sub);
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: 10.5px;
  text-align: left;
  cursor: pointer;
}

.mode-dock-menu button:hover,
.mode-dock-menu button.active {
  color: var(--accent);
  background: var(--accent-soft);
}

.assistant-tool-menu {
  position: absolute;
  z-index: 12;
  left: 0;
  bottom: 38px;
  width: 230px;
  padding: 6px;
  text-align: left;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--card-shadow);
}

.assistant-tool-menu button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px;
  color: var(--text-main);
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.assistant-tool-menu button:hover {
  background: var(--surface-2);
}

.assistant-tool-icon {
  flex: none;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
}

.assistant-tool-menu button > span:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.assistant-tool-menu strong {
  font-size: 12px;
  font-weight: 600;
}

.assistant-tool-menu small {
  color: var(--text-faint);
  font-size: 10px;
}

.ask-plus:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.ask-sync {
  font-size: 11px;
  color: var(--text-faint);
  padding-left: 2px;
}

.ask-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.ask-chip {
  padding: 4px 10px;
  border: 1px solid var(--card-border);
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-sub);
  font-size: 11.5px;
  font-family: inherit;
  cursor: pointer;
}

.ask-chip:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.ask-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-badge {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--text-faint);
}

.ask-send {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-on);
  font-size: 16px;
  cursor: pointer;
}

.ask-send:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.hero-hint {
  margin: 7px 0 0;
  font-size: 11.5px;
  color: var(--text-faint);
}

.hidden-upload {
  display: none;
}

.hero-dance {
  position: absolute;
  z-index: 2;
  right: -126px;
  bottom: 46px;
  width: 116px;
  pointer-events: none;
  filter: drop-shadow(0 8px 14px rgba(74, 62, 38, 0.12));
  animation: dance-bob 3.2s ease-in-out infinite;
}

.hero-dance img {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
}

.home-below-fold-spacer {
  height: max(260px, calc(100svh - 430px));
}

@keyframes dance-bob {
  0%,
  100% {
    transform: translateY(0) rotate(-1deg);
  }
  50% {
    transform: translateY(-5px) rotate(1deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-dance {
    animation: none;
  }
}

.home-columns {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  align-items: start;
  gap: 12px;
  margin-top: 12px;
  margin-bottom: 12px;
}

.card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.card-sub {
  font-size: 11.5px;
  color: var(--text-faint);
}

.continue-card {
  padding: 18px;
}

.continue-title {
  margin: 4px 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.continue-desc {
  margin: 0 0 12px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--text-sub);
}

.continue-meta {
  margin: 7px 0 12px;
  font-size: 11.5px;
  color: var(--text-faint);
}

.continue-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.feed-card {
  padding: 16px 18px;
}

.feed-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--divider);
  cursor: pointer;
}

.feed-row:last-child {
  border-bottom: none;
}

.feed-dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.feed-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.feed-title {
  font-size: 12.5px;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-sub {
  font-size: 11px;
  color: var(--text-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-chev {
  flex: none;
  color: var(--text-faint);
}

.primary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.primary-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}

.primary-entry:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.primary-ic {
  flex: none;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.primary-main {
  flex: 1;
  min-width: 0;
}

.primary-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.primary-sub {
  margin-top: 2px;
  font-size: 10.5px;
  color: var(--text-faint);
}

.primary-arrow {
  flex: none;
  color: var(--text-faint);
}

.text-links {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  margin: 2px 0 16px 4px;
  font-size: 12px;
  color: var(--text-sub);
}

.text-links a {
  cursor: pointer;
  padding-bottom: 2px;
  border-bottom: 1px dashed var(--divider);
}

.text-links a:hover {
  color: var(--accent);
  border-color: var(--accent);
}

@media (max-width: 1100px) {
  .home-columns {
    grid-template-columns: 1fr;
  }

  .hero-dance {
    right: -66px;
    width: 96px;
  }
}

@media (max-width: 760px) {
  .material-row,
  .primary-grid {
    grid-template-columns: 1fr;
  }
  .hero-title {
    font-size: 27px;
  }

  .hero-dance {
    right: 10px;
    bottom: -66px;
    width: 76px;
  }
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
