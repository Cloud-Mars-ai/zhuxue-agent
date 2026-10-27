import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 双击 dist/index.html 离线演示时是 file:// 协议，
// 该协议下 history 模式无法工作，自动降级为 hash 模式（URL 带 #）
const isFileProtocol = window.location.protocol === 'file:'

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
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true, title: '登录' },
  },

  // ========== Web 端（Element Plus） ==========
  {
    path: '/',
    component: () => import('@/layouts/WebLayout.vue'),
    redirect: '/course',
    children: [
      {
        path: 'course',
        name: 'CourseHome',
        component: () => import('@/views/web/CourseHome.vue'),
        meta: { title: '课程主页', icon: 'HomeFilled' },
      },
      {
        path: 'ask',
        name: 'Ask',
        component: () => import('@/views/web/Ask.vue'),
        meta: { title: 'AI 答疑', icon: 'ChatLineRound' },
      },
      {
        path: 'practice',
        name: 'Practice',
        component: () => import('@/views/web/Practice.vue'),
        meta: { title: '一人一题练习', icon: 'EditPen' },
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
        path: 'homework',
        name: 'Homework',
        component: () => import('@/views/web/Homework.vue'),
        meta: { title: '作业管理', icon: 'Notebook' },
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/web/Statistics.vue'),
        meta: { title: '学情统计', icon: 'TrendCharts', roles: ['admin', 'teacher', 'ta'] },
      },
      {
        path: 'model',
        name: 'ModelSettings',
        component: () => import('@/views/web/ModelSettings.vue'),
        meta: { title: '模型接入', icon: 'Connection', roles: ['admin', 'teacher'] },
      },
    ],
  },

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
        path: 'ask',
        name: 'MAsk',
        component: () => import('@/views/mobile/MAsk.vue'),
        meta: { title: '答疑', mobile: true },
      },
      {
        path: 'practice',
        name: 'MPractice',
        component: () => import('@/views/mobile/MPractice.vue'),
        meta: { title: '一人一题', mobile: true },
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
        path: 'mine',
        name: 'MMine',
        component: () => import('@/views/mobile/MMine.vue'),
        meta: { title: '我的', mobile: true },
      },
    ],
  },

  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/Forbidden.vue'),
    meta: { public: true, title: '无访问权限' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/course' },
]

const router = createRouter({
  history: isFileProtocol ? createWebHashHistory() : createWebHistory(),
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

router.afterEach((to) => {
  const base = '人机协同助学智能体'
  document.title = to.meta.title ? `${to.meta.title} - ${base}` : base
})

export default router
