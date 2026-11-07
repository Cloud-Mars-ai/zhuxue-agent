import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDeviceStore } from '@/stores/device'
import { useAccessLogStore } from '@/stores/accessLog'

// 双击 dist/index.html 离线演示时是 file:// 协议，
// 该协议下 history 模式无法工作，自动降级为 hash 模式（URL 带 #）
const isFileProtocol = window.location.protocol === 'file:'
const forceHashHistory = import.meta.env.VITE_ROUTER_MODE === 'hash'

/**
 * 角色说明
 * admin   超级管理员
 * teacher 教师
 * ta      助教
 * student 学生
 *
 * meta.roles 为空表示登录即可访问；填写则表示仅这些角色可见
 * meta.public 为 true 表示无需登录
 */
const routes = [
  // 落地页（公开）：产品官网入口，CTA 导向登录/演示
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/Landing.vue'),
    meta: { public: true, title: '首页' },
  },

  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true, title: '登录' },
  },

  // ========== Web 端（Element Plus） ==========
  // 应用主体位于 /app 下；下方「旧路径兼容」把历史上的
  // /course、/ask 等入口原地跳转到 /app/...，旧链接不失效
  {
    path: '/app',
    component: () => import('@/layouts/WebLayout.vue'),
    redirect: '/app/course',
    children: [
      {
        path: 'course',
        name: 'CourseHome',
        component: () => import('@/views/web/CourseHome.vue'),
        meta: { title: '课程主页', icon: 'HomeFilled' },
      },
      {
        path: 'board',
        name: 'Board',
        component: () => import('@/views/web/Board.vue'),
        meta: { title: '板书讲解', icon: 'Notebook' },
      },
      {
        path: 'ask',
        name: 'Ask',
        component: () => import('@/views/web/Ask.vue'),
        meta: { title: 'AI协助', icon: 'ChatLineRound', nav: false },
      },
      {
        path: 'practice',
        name: 'Practice',
        component: () => import('@/views/web/Practice.vue'),
        meta: { title: '一人一题练习', icon: 'EditPen' },
      },
      {
        path: 'selftest',
        name: 'SelfTest',
        component: () => import('@/views/web/SelfTest.vue'),
        meta: { title: '章节自测', icon: 'Timer' },
      },
      {
        path: 'cheatsheet',
        name: 'Cheatsheet',
        component: () => import('@/views/web/Cheatsheet.vue'),
        meta: { title: '备考速查表', icon: 'Document' },
      },
      {
        path: 'checkup',
        redirect: (to) => ({
          path: '/app/competition',
          query: { ...to.query, step: 'checkup' },
        }),
        meta: { title: '学习体检', nav: false },
      },
      {
        path: 'competition',
        name: 'CompetitionWorkbench',
        component: () => import('@/views/CompetitionWorkbench.vue'),
        meta: { title: '智慧学伴', icon: 'MagicStick' },
      },
      {
        path: 'materials',
        name: 'Materials',
        component: () => import('@/views/web/Materials.vue'),
        meta: { title: '课程资料库', icon: 'FolderOpened', roles: ['admin', 'teacher', 'ta'] },
      },
      {
        path: 'studio',
        name: 'CourseStudio',
        component: () => import('@/views/web/CourseStudio.vue'),
        meta: { title: '智能课程编排', icon: 'MagicStick', nav: false },
      },
      {
        path: 'library',
        name: 'KnowledgeLibrary',
        component: () => import('@/views/web/KnowledgeLibrary.vue'),
        meta: { title: '知识库', icon: 'Collection' },
      },
      {
        path: 'experience',
        name: 'CourseExperienceLegacy',
        redirect: (to) =>
          to.query.project
            ? { path: `/learn/${encodeURIComponent(String(to.query.project))}`, query: to.query }
            : '/app/studio',
        meta: { title: '课程体验', nav: false },
      },
      {
        path: 'cases',
        name: 'Cases',
        component: () => import('@/views/web/Cases.vue'),
        meta: { title: '课前案例', icon: 'Files' },
      },
      {
        path: 'assessment',
        name: 'Assessment',
        component: () => import('@/views/web/Assessment.vue'),
        meta: { title: '课程考核', icon: 'Aim' },
      },
      {
        path: 'console',
        name: 'TeacherConsole',
        component: () => import('@/views/web/TeacherConsole.vue'),
        meta: { title: '教师主控台', icon: 'DataBoard', roles: ['admin', 'teacher', 'ta'] },
      },
      {
        path: 'forum',
        name: 'Forum',
        component: () => import('@/views/web/Forum.vue'),
        meta: { title: '研讨论坛', icon: 'ChatDotRound' },
      },
      {
        path: 'forum/:id',
        name: 'ForumDetail',
        component: () => import('@/views/web/ForumDetail.vue'),
        meta: { title: '研讨详情', nav: false },
      },
      {
        path: 'homework',
        name: 'Homework',
        component: () => import('@/views/web/Homework.vue'),
        meta: { title: '作业管理', icon: 'Notebook' },
      },
      {
        path: 'homework/:id',
        name: 'HomeworkDetail',
        component: () => import('@/views/web/HomeworkDetail.vue'),
        meta: { title: '作业详情', nav: false },
      },
      {
        path: 'statistics',
        redirect: (to) => ({
          path: '/app/competition',
          query: to.query,
          hash: to.hash,
        }),
        meta: { title: '学情统计', nav: false },
      },
      {
        path: 'model',
        name: 'ModelSettings',
        component: () => import('@/views/web/ModelSettings.vue'),
        meta: { title: '模型接入', icon: 'Connection', roles: ['admin', 'teacher'] },
      },
      {
        path: 'logs',
        name: 'AccessLog',
        component: () => import('@/views/web/AccessLog.vue'),
        meta: { title: '访问日志', icon: 'Tickets' },
      },
    ],
  },

  // ========== 旧路径兼容（应用迁至 /app 前的历史入口） ==========
  // 保留 query 与 hash：如 /forum?id=12 仍能跳到 /app/forum?id=12
  ...[
    'course',
    'board',
    'ask',
    'practice',
    'selftest',
    'cheatsheet',
    'checkup',
    'competition',
    'materials',
    'studio',
    'experience',
    'cases',
    'assessment',
    'console',
    'forum',
    'homework',
    'statistics',
    'library',
    'model',
    'logs',
  ].map((p) => ({
    path: `/${p}`,
    redirect: (to) => ({ path: `/app/${p}`, query: to.query, hash: to.hash }),
  })),

  // ========== H5 移动端（Vant） ==========
  {
    path: '/m',
    component: () => import('@/layouts/MobileLayout.vue'),
    redirect: '/m/course',
    children: [
      {
        path: 'course',
        name: 'MCourse',
        component: () => import('@/views/mobile/MCourse.vue'),
        meta: { title: '课程', mobile: true },
      },
      {
        path: 'board',
        name: 'MBoard',
        component: () => import('@/views/mobile/MBoard.vue'),
        meta: { title: '板书讲解', mobile: true },
      },
      {
        path: 'ask',
        name: 'MAsk',
        component: () => import('@/views/mobile/MAsk.vue'),
        meta: { title: 'AI协助', mobile: true },
      },
      {
        path: 'practice',
        name: 'MPractice',
        component: () => import('@/views/mobile/MPractice.vue'),
        meta: { title: '一人一题', mobile: true },
      },
      {
        path: 'selftest',
        name: 'MSelfTest',
        component: () => import('@/views/mobile/MSelfTest.vue'),
        meta: { title: '章节自测', mobile: true },
      },
      {
        path: 'cheatsheet',
        name: 'MCheatsheet',
        component: () => import('@/views/mobile/MCheatsheet.vue'),
        meta: { title: '备考速查表', mobile: true },
      },
      {
        path: 'checkup',
        redirect: (to) => ({
          path: '/m/competition',
          query: { ...to.query, step: 'checkup' },
        }),
        meta: { title: '学习体检', mobile: true, nav: false },
      },
      {
        path: 'competition',
        name: 'MCompetitionWorkbench',
        component: () => import('@/views/CompetitionWorkbench.vue'),
        meta: { title: '智慧学伴', mobile: true },
      },
      {
        path: 'case',
        name: 'MCase',
        component: () => import('@/views/mobile/MCase.vue'),
        meta: { title: '课前案例', mobile: true },
      },
      {
        path: 'assessment',
        name: 'MAssessment',
        component: () => import('@/views/mobile/MAssessment.vue'),
        meta: { title: '课程考核', mobile: true },
      },
      {
        path: 'studio',
        name: 'MCourseStudio',
        component: () => import('@/views/web/CourseStudio.vue'),
        meta: { title: '智能课程编排', mobile: true, nav: false },
      },
      {
        path: 'library',
        name: 'MKnowledgeLibrary',
        component: () => import('@/views/web/KnowledgeLibrary.vue'),
        meta: { title: '知识库', mobile: true },
      },
      {
        path: 'experience',
        name: 'MCourseExperienceLegacy',
        redirect: (to) =>
          to.query.project
            ? { path: `/learn/${encodeURIComponent(String(to.query.project))}`, query: to.query }
            : '/m/studio',
        meta: { title: '课程体验', mobile: true, nav: false },
      },
      {
        path: 'mine',
        name: 'MMine',
        component: () => import('@/views/mobile/MMine.vue'),
        meta: { title: '我的', mobile: true },
      },
      {
        path: 'forum',
        name: 'MForum',
        component: () => import('@/views/web/Forum.vue'),
        meta: { title: '研讨论坛', mobile: true },
      },
      {
        path: 'forum/:id',
        name: 'MForumDetail',
        component: () => import('@/views/web/ForumDetail.vue'),
        meta: { title: '研讨详情', mobile: true, nav: false },
      },
      {
        path: 'homework',
        name: 'MHomework',
        component: () => import('@/views/web/Homework.vue'),
        meta: { title: '作业', mobile: true },
      },
      {
        path: 'homework/:id',
        name: 'MHomeworkDetail',
        component: () => import('@/views/web/HomeworkDetail.vue'),
        meta: { title: '作业详情', mobile: true, nav: false },
      },
      {
        path: 'logs',
        name: 'MAccessLog',
        component: () => import('@/views/mobile/MAccessLog.vue'),
        meta: { title: '访问日志', mobile: true, nav: false },
      },
    ],
  },

  {
    path: '/learn/:projectId',
    name: 'CourseExperience',
    component: () => import('@/views/CourseExperience.vue'),
    meta: { title: '课程体验', standalone: true },
  },

  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/Forbidden.vue'),
    meta: { public: true, title: '无访问权限' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

/* ============================================================
 * 设备自适应：Web 路由树（/）⇄ H5 路由树（/m）互转
 * 手机 → /m；平板 / 桌面 → /
 * 仅对两端都存在的页面做等价映射，其余落到各树首页
 * ============================================================ */
const WEB_TO_MOBILE = {
  '/app/course': '/m/course',
  '/app/board': '/m/board',
  '/app/ask': '/m/ask',
  '/app/practice': '/m/practice',
  '/app/selftest': '/m/selftest',
  '/app/cheatsheet': '/m/cheatsheet',
  '/app/checkup': '/m/checkup',
  '/app/competition': '/m/competition',
  '/app/cases': '/m/case',
  '/app/assessment': '/m/assessment',
  '/app/studio': '/m/studio',
  '/app/library': '/m/library',
  '/app/forum': '/m/forum',
  '/app/homework': '/m/homework',
  '/app/experience': '/m/experience',
  '/app/logs': '/m/logs',
}
const MOBILE_TO_WEB = Object.fromEntries(
  Object.entries(WEB_TO_MOBILE).map(([web, mobile]) => [mobile, web]),
)

/** 把路径换算到目标路由树；无需改写的路径返回 null */
export function mapPathToTree(path, tree) {
  if (tree === 'mobile') return WEB_TO_MOBILE[path] || null
  return MOBILE_TO_WEB[path] || null
}

/** 目标路由树的兜底首页 */
function homeOf(tree) {
  return tree === 'mobile' ? '/m/course' : '/app/course'
}

const historyBase =
  import.meta.env.BASE_URL === './' || import.meta.env.BASE_URL === '/'
    ? '/'
    : import.meta.env.BASE_URL

const router = createRouter({
  history:
    isFileProtocol || forceHashHistory
      ? createWebHashHistory(historyBase)
      : createWebHistory(historyBase),
  routes,
})

// 全局前置守卫：未登录跳登录页，角色不符跳 403
router.beforeEach((to) => {
  const userStore = useUserStore()

  if (to.meta.public) return true

  if (!userStore.isLogin) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  const allowed = to.meta.roles
  if (allowed && allowed.length && !allowed.includes(userStore.role)) {
    return { name: 'Forbidden' }
  }

  return true
})

// 全局前置守卫：按设备类型在 Web / H5 两棵路由树之间自适应跳转
// （登录页与 403 为公共页不参与；用户手动切换过端口时以手动选择为准）
router.beforeEach((to) => {
  if (to.meta.public || to.meta.standalone) return true

  const deviceStore = useDeviceStore()
  const tree = deviceStore.tree
  const inMobileTree = to.path.startsWith('/m')

  // 手机落在 Web 树 → 转 /m；平板 / 桌面落在 /m → 转 /
  if (tree === 'mobile' && !inMobileTree) {
    const path = mapPathToTree(to.path, 'mobile')
    return path ? { path, query: to.query, hash: to.hash } : homeOf('mobile')
  }
  if (tree === 'web' && inMobileTree) {
    const path = mapPathToTree(to.path, 'web')
    return path ? { path, query: to.query, hash: to.hash } : homeOf('web')
  }
  return true
})

router.afterEach((to) => {
  const base = '人机协同助学智能体'
  document.title = to.meta.title ? `${to.meta.title} - ${base}` : base

  // 访问日志：记录页面访问（仅本机留存；query 里的分享码等参数一并入 detail）
  try {
    const logStore = useAccessLogStore()
    const userStore = useUserStore()
    logStore.record('page_view', {
      user: userStore.user || null,
      path: to.fullPath,
      title: to.meta.title || to.path,
      detail: {
        query: to.query && Object.keys(to.query).length ? { ...to.query } : null,
      },
    })
  } catch {
    // 日志失败不影响路由主流程
  }
})

export default router
