<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { COURSE } from '@/mock/data'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useDeviceStore } from '@/stores/device'
import { useTraceStore } from '@/stores/trace'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const deviceStore = useDeviceStore()
const traceStore = useTraceStore()

// 侧栏只保留少量一级入口，其余按「学习 / 教学 / 设置」收进分组，
// 避免新增页面后菜单无限变长。
const GROUP_META = {
  首页: { icon: 'HomeFilled' },
  学习: { icon: 'Reading' },
  考核: { icon: 'Aim' },
  教学: { icon: 'DataBoard' },
  讨论: { icon: 'ChatDotRound' },
  作业: { icon: 'Notebook' },
  设置: { icon: 'Setting' },
}
const GROUP_ORDER = ['首页', '学习', '考核', '教学', '讨论', '作业', '设置']
const GROUP_OF = {
  course: '首页',
  board: '学习',
  ask: '学习',
  practice: '学习',
  selftest: '学习',
  cheatsheet: '学习',
  checkup: '学习',
  cases: '学习',
  assessment: '考核',
  console: '教学',
  materials: '教学',
  statistics: '教学',
  forum: '讨论',
  homework: '作业',
  model: '设置',
}

const menus = computed(() => {
  const webRoot = router.options.routes.find((r) => r.path === '/app')
  const items = (webRoot?.children || [])
    .filter((child) => {
      const allowed = child.meta?.roles
      return child.meta?.nav !== false && (!allowed || allowed.includes(userStore.role))
    })
    .map((child) => ({
      index: `/app/${child.path}`,
      title: child.meta.title,
      icon: child.meta.icon,
      group: GROUP_OF[child.path] || '更多',
    }))

  return GROUP_ORDER.map((title) => ({
    key: `group-${title}`,
    title,
    icon: GROUP_META[title]?.icon || 'Menu',
    items: items.filter((i) => i.group === title),
  })).filter((g) => g.items.length)
})

const activeMenu = computed(() => route.path)

const currentChapter = computed(
  () => COURSE.chapters.find((c) => c.status === '进行中') || COURSE.chapters[0],
)
const sideProgress = computed(() => currentChapter.value?.progress || 0)

const KIND_LABEL = {
  practice: '完成一人一题',
  selftest: '完成章节自测',
  cheatsheet: '生成备考速查表',
  diagnosis: '查看学习体检',
  chat: 'AI协助',
  assessment: '课程考核',
  case: '课前案例',
}

const recentActivities = computed(() =>
  traceStore.records
    .filter((r) => r.ok)
    .slice(0, 3)
    .map((r) => {
      const d = new Date(r.at)
      const time = Number.isNaN(d.getTime())
        ? ''
        : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      return { id: r.id, label: KIND_LABEL[r.kind] || '学习记录', time }
    }),
)

/* ============================================================
 * 响应式导航形态（随设备类型实时切换，不影响既有功能）
 *   桌面端  ≥1200px  完整侧栏 220px
 *   平板    768~1199 侧栏收起为 64px 图标栏
 *   窄屏    <768     侧栏收起，头部汉堡按钮拉起抽屉菜单
 * ============================================================ */
const isTablet = computed(() => deviceStore.isTablet)
const isNarrow = computed(() => deviceStore.isPhone)
const drawerOpen = ref(false)

// 手动切换到 H5 移动端：写入手动选择并跳转（之后该设备固定走 /m，直至清除）
function switchToMobile() {
  deviceStore.setOverride('mobile')
  router.push('/m/course')
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    })
    userStore.logout()
    router.push({ name: 'Login' })
  } catch {
    // 用户取消，无需处理
  }
}
</script>

<template>
  <el-container class="web-layout" :class="{ 'is-tablet': isTablet, 'is-narrow': isNarrow }">
    <!-- 桌面/平板：侧栏（平板自动收起为 64px 图标栏） -->
    <el-aside v-if="!isNarrow" :width="isTablet ? '64px' : '220px'" class="aside">
      <div class="logo">
        <span class="logo-mark">智</span>
        <span v-show="!isTablet" class="logo-text">人机协同助学</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="menu"
        :collapse="isTablet"
        :collapse-transition="false"
        :unique-opened="false"
      >
        <template v-for="g in menus" :key="g.key">
          <el-sub-menu v-if="g.items.length > 1" :index="g.key">
            <template #title>
              <el-icon><component :is="g.icon" /></el-icon>
              <span>{{ g.title }}</span>
            </template>
            <el-menu-item v-for="m in g.items" :key="m.index" :index="m.index">
              <el-icon v-if="m.icon"><component :is="m.icon" /></el-icon>
              <span>{{ m.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="g.items[0].index" :title="g.items[0].title">
            <el-icon><component :is="g.icon" /></el-icon>
            <span>{{ g.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>

      <div v-if="!isTablet" class="side-extra">
        <div class="side-label">继续学习</div>
        <div class="side-course" @click="router.push('/app/selftest')">
          <span class="side-course-tag">{{ currentChapter.status }}</span>
          <div class="side-course-title">{{ currentChapter.title }}</div>
          <div class="side-course-meta">{{ sideProgress }}% · 第 8 周</div>
          <div class="side-progress"><span :style="{ width: `${sideProgress}%` }" /></div>
        </div>

        <div class="side-label side-label-gap">最近活动</div>
        <div v-if="recentActivities.length" class="side-activities">
          <div v-for="a in recentActivities" :key="a.id" class="side-activity">
            <span class="side-activity-dot" />
            <span class="side-activity-text">{{ a.label }}</span>
            <span class="side-activity-time">{{ a.time }}</span>
          </div>
        </div>
        <p v-else class="side-empty">暂无活动记录，开始一次自测吧</p>
      </div>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon v-if="isNarrow" class="hamburger" @click="drawerOpen = true"><Fold /></el-icon>
          <div class="header-title">{{ route.meta.title }}</div>
        </div>
        <div class="header-right">
          <el-tooltip :content="`切换到${themeStore.isMo ? '纸感' : '夜读'}皮肤`" placement="bottom">
            <el-button
              size="small"
              round
              data-testid="web-theme-toggle"
              @click="themeStore.toggle()"
            >
              {{ themeStore.isMo ? '纸感' : '夜读' }}
            </el-button>
          </el-tooltip>
          <el-link :underline="false" class="text-sub switch-link" @click="switchToMobile">
            切换 H5 移动端
          </el-link>
          <el-divider direction="vertical" class="header-divider" />
          <el-tag size="small" type="success" effect="plain" class="role-tag">
            {{ userStore.roleLabel }}
          </el-tag>
          <el-dropdown>
            <span class="user-name">
              <span class="user-avatar">{{ (userStore.name || '?').slice(0, 1) }}</span>
              {{ userStore.name }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>

    <!-- 窄屏：抽屉式导航（与侧栏同一套菜单数据） -->
    <el-drawer v-model="drawerOpen" direction="ltr" size="220px" :with-header="false" class="nav-drawer">
      <div class="logo">
        <span class="logo-mark">智</span>
        <span class="logo-text">人机协同助学</span>
      </div>
      <el-menu :default-active="activeMenu" router class="menu" @select="drawerOpen = false">
        <template v-for="g in menus" :key="g.key">
          <el-sub-menu v-if="g.items.length > 1" :index="g.key">
            <template #title>
              <el-icon><component :is="g.icon" /></el-icon>
              <span>{{ g.title }}</span>
            </template>
            <el-menu-item v-for="m in g.items" :key="m.index" :index="m.index">
              <el-icon v-if="m.icon"><component :is="m.icon" /></el-icon>
              <span>{{ m.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="g.items[0].index">
            <el-icon><component :is="g.icon" /></el-icon>
            <span>{{ g.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
      <div class="drawer-footer">
        <el-link :underline="false" type="primary" @click="switchToMobile(); drawerOpen = false">
          切换 H5 移动端
        </el-link>
      </div>
    </el-drawer>
  </el-container>
</template>

<style scoped>
.web-layout {
  height: 100vh;
}

.aside {
  display: flex;
  flex-direction: column;
  background: var(--page-bg);
  border-right: 1px solid var(--card-border);
  transition: width 0.2s ease;
  overflow-y: auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 64px;
  padding: 0 18px;
  border-bottom: 1px solid var(--card-border);
  overflow: hidden;
  white-space: nowrap;
}

.logo-mark {
  display: grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--accent);
  color: var(--accent-on);
  font-weight: 600;
}

.logo-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
}

.menu {
  border-right: none;
  background: transparent;
  padding: 8px 0;
}

.menu :deep(.el-menu-item),
.menu :deep(.el-sub-menu__title) {
  height: 42px;
  line-height: 42px;
  margin: 2px 10px;
  border-radius: 10px;
  color: var(--text-sub);
  font-size: 13.5px;
}

.menu :deep(.el-menu-item:hover),
.menu :deep(.el-sub-menu__title:hover) {
  background: var(--surface-2);
  color: var(--text-main);
}

.menu :deep(.el-menu-item.is-active) {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

.menu :deep(.el-sub-menu .el-menu-item) {
  height: 38px;
  line-height: 38px;
  margin: 2px 10px 2px 18px;
  font-size: 13px;
}

.side-extra {
  padding: 10px 14px 20px;
  border-top: 1px solid var(--card-border);
  margin-top: 8px;
}

.side-label {
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
  color: var(--text-faint);
}

.side-label-gap {
  margin-top: 18px;
}

.side-course {
  padding: 10px 12px;
  border: 1px solid var(--card-border);
  border-radius: 10px;
  background: var(--card-bg);
  cursor: pointer;
  transition: border-color 0.15s;
}

.side-course:hover {
  border-color: var(--accent);
}

.side-course-tag {
  display: inline-block;
  padding: 1px 6px;
  margin-bottom: 6px;
  font-size: 10px;
  border-radius: 3px;
  color: var(--accent);
  background: var(--accent-soft);
}

.side-course-title {
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--text-main);
}

.side-course-meta {
  margin-top: 3px;
  font-size: 10.5px;
  color: var(--text-faint);
}

.side-progress {
  height: 4px;
  margin-top: 8px;
  border-radius: 2px;
  background: var(--surface-2);
  overflow: hidden;
}

.side-progress span {
  display: block;
  height: 100%;
  border-radius: 2px;
  background: var(--accent);
}

.side-activity {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 0;
}

.side-activity-dot {
  width: 5px;
  height: 5px;
  flex: none;
  border-radius: 50%;
  background: var(--accent);
}

.side-activity-text {
  flex: 1;
  min-width: 0;
  font-size: 11.5px;
  color: var(--text-sub);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-activity-time {
  font-size: 10.5px;
  color: var(--text-faint);
}

.side-empty {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-faint);
}

/* 窄屏抽屉菜单与侧栏菜单间距一致 */
.nav-drawer :deep(.el-drawer__body) {
  padding: 0;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  background: var(--page-bg);
  border-bottom: 1px solid var(--card-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.hamburger {
  font-size: 20px;
  cursor: pointer;
  color: var(--text-main);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
}

.user-avatar {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
}

.main {
  background-color: var(--page-bg);
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(120, 105, 80, 0.08) 1px,
    transparent 0
  );
  background-size: 22px 22px;
  padding: 24px 28px 32px;
  /* 双轴滚动：窄屏 / 平板下宽表格可横向滚动，不被裁切 */
  overflow: auto;
}

/* 平板：收紧留白与头部元素 */
.web-layout.is-tablet .main {
  padding: 12px;
}

.web-layout.is-tablet .header-right {
  gap: 6px;
}

.web-layout.is-tablet .header-right :deep(.el-button--small) {
  padding: 5px 10px;
}

/* 窄屏：隐藏次要头部元素（切端入口移入抽屉），避免溢出 */
.web-layout.is-narrow .switch-link,
.web-layout.is-narrow .header-divider,
.web-layout.is-narrow .role-tag {
  display: none;
}

.web-layout.is-narrow .header-right {
  gap: 6px;
}

.nav-drawer .logo {
  height: 56px;
}

.drawer-footer {
  position: absolute;
  bottom: 16px;
  left: 16px;
}
</style>
