<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAccessLogStore, EVENT_LABELS, EVENT_TYPES } from '@/stores/accessLog'
import { useUserStore } from '@/stores/user'

const logStore = useAccessLogStore()
const userStore = useUserStore()

const typeFilter = ref('')
const keyword = ref('')

const typeOptions = computed(() => [
  { value: '', label: '全部类型' },
  ...EVENT_TYPES.map((t) => ({ value: t, label: EVENT_LABELS[t] })),
])

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return logStore.events.filter((e) => {
    if (typeFilter.value && e.type !== typeFilter.value) return false
    if (!kw) return true
    return (
      e.path.toLowerCase().includes(kw) ||
      e.title.toLowerCase().includes(kw) ||
      e.userName.toLowerCase().includes(kw) ||
      String(e.detail?.username || '').toLowerCase().includes(kw)
    )
  })
})

function formatTime(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatLastLogin(iso) {
  return iso ? formatTime(iso) : '暂无记录'
}

const typeTagType = (type) =>
  ({ login: 'success', logout: 'info', page_view: 'warning' }[type] || 'info')

function detailText(row) {
  if (!row.detail) return '—'
  const parts = []
  if (row.detail.username) parts.push(`账号 ${row.detail.username}`)
  if (row.detail.method) parts.push(row.detail.method)
  if (row.detail.query) {
    const q = Object.entries(row.detail.query)
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
    if (q) parts.push(`参数 ${q}`)
  }
  return parts.length ? parts.join(' · ') : '—'
}

async function handleClear() {
  try {
    await ElMessageBox.confirm(
      '将清空本机保存的全部访问日志，且不可恢复。确定继续吗？',
      '清空访问日志',
      { type: 'warning' },
    )
    logStore.clear()
    ElMessage.success('访问日志已清空')
  } catch {
    // 用户取消
  }
}

function handleExport() {
  if (!logStore.events.length) {
    ElMessage.warning('暂无日志可导出')
    return
  }
  logStore.exportJson()
  ElMessage.success('已导出到本地文件')
}
</script>

<template>
  <div class="logs-page">
    <div class="card">
      <h3 class="card-title">访问日志</h3>
      <p class="card-desc">
        记录本机的登录/登出与页面访问情况。<strong>所有日志仅保存在当前浏览器本地</strong>，不会上传到任何服务器；
        详情内容（账号、页面参数等）同样只留在本机。导出后可自行存档或清理。
      </p>

      <el-row :gutter="12" class="stat-row">
        <el-col :xs="12" :sm="6">
          <div class="stat-box">
            <div class="stat-num">{{ logStore.total }}</div>
            <div class="stat-label">累计记录</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-box">
            <div class="stat-num">{{ logStore.loginCount }}</div>
            <div class="stat-label">登录次数</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-box">
            <div class="stat-num">{{ logStore.todayCount }}</div>
            <div class="stat-label">今日访问</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-box">
            <div class="stat-num stat-time">{{ formatLastLogin(logStore.lastLoginAt) }}</div>
            <div class="stat-label">最近登录</div>
          </div>
        </el-col>
      </el-row>

      <div class="toolbar">
        <el-select v-model="typeFilter" style="width: 140px" placeholder="事件类型">
          <el-option
            v-for="opt in typeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-input
          v-model="keyword"
          style="width: 240px"
          placeholder="搜索页面 / 用户 / 账号"
          clearable
        />
        <span class="toolbar-spacer" />
        <el-button plain @click="handleExport">导出 JSON</el-button>
        <el-button type="danger" plain @click="handleClear">清空日志</el-button>
      </div>

      <el-table
        v-if="filtered.length"
        :data="filtered"
        style="width: 100%"
        :default-sort="{ prop: 'at', order: 'descending' }"
      >
        <el-table-column label="时间" width="180">
          <template #default="{ row }">{{ formatTime(row.at) }}</template>
        </el-table-column>
        <el-table-column label="用户" width="170">
          <template #default="{ row }">
            <span class="user-cell">
              {{ row.userName }}
              <span v-if="row.userId !== 'anonymous'" class="user-id">{{ row.userId }}</span>
              <span v-else class="user-id">未登录</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="事件" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.type)" size="small" effect="light">
              {{ EVENT_LABELS[row.type] || row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="页面" min-width="200">
          <template #default="{ row }">
            <div class="page-cell">
              <span class="page-title">{{ row.title }}</span>
              <span class="page-path">{{ row.path }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="详情" min-width="220">
          <template #default="{ row }">
            <span class="detail-text">{{ detailText(row) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无日志记录（登录或浏览页面后会自动记录）" />
    </div>
  </div>
</template>

<style scoped>
.logs-page {
  padding-bottom: 12px;
}

.stat-row {
  margin-bottom: 16px;
}

.stat-box {
  padding: 12px 14px;
  background: var(--bg-page);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 8px;
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--brand);
  line-height: 1.2;
}

.stat-time {
  font-size: 14px;
}

.stat-label {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-sub);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.toolbar-spacer {
  flex: 1;
}

.user-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.user-id {
  font-size: 11px;
  color: var(--text-sub);
}

.page-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.page-title {
  font-size: 13px;
}

.page-path {
  font-size: 11px;
  color: var(--text-sub);
  word-break: break-all;
}

.detail-text {
  font-size: 12px;
  color: var(--text-sub);
  word-break: break-all;
}
</style>
