<script setup>
import { ref, computed } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { useAccessLogStore, EVENT_LABELS, EVENT_TYPES } from '@/stores/accessLog'

const logStore = useAccessLogStore()

const typeFilter = ref('')
const keyword = ref('')
const showDetail = ref(false)
const activeEvent = ref(null)

const tabs = computed(() => [
  { key: '', title: '全部' },
  ...EVENT_TYPES.map((t) => ({ key: t, title: EVENT_LABELS[t] })),
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

function detailText(row) {
  if (!row.detail) return ''
  const parts = []
  if (row.detail.username) parts.push(`账号 ${row.detail.username}`)
  if (row.detail.method) parts.push(row.detail.method)
  if (row.detail.query) {
    const q = Object.entries(row.detail.query)
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
    if (q) parts.push(`参数 ${q}`)
  }
  return parts.join(' · ')
}

function openDetail(row) {
  activeEvent.value = row
  showDetail.value = true
}

function detailJson(row) {
  return JSON.stringify(
    {
      时间: row.at,
      用户: `${row.userName}（${row.userId}）`,
      事件: EVENT_LABELS[row.type] || row.type,
      页面: row.path,
      详情: row.detail || null,
    },
    null,
    2,
  )
}

async function handleClear() {
  try {
    await showConfirmDialog({ title: '清空访问日志', message: '将清空本机保存的全部访问日志，不可恢复。确定继续吗？' })
    logStore.clear()
    showToast('已清空')
  } catch {
    // 用户取消
  }
}

function handleExport() {
  if (!logStore.events.length) {
    showToast('暂无日志可导出')
    return
  }
  logStore.exportJson()
  showToast('已导出到本地文件')
}
</script>

<template>
  <div class="m-logs">
    <div class="m-logs-stats">
      <div class="stat">
        <strong>{{ logStore.total }}</strong>
        <span>累计记录</span>
      </div>
      <div class="stat">
        <strong>{{ logStore.loginCount }}</strong>
        <span>登录次数</span>
      </div>
      <div class="stat">
        <strong>{{ logStore.todayCount }}</strong>
        <span>今日访问</span>
      </div>
    </div>

    <p class="m-logs-tip">
      所有日志仅保存在本机浏览器，不上传服务器；详情内容（账号、页面参数）同样只留在本地。
    </p>

    <van-search v-model="keyword" placeholder="搜索页面 / 用户 / 账号" shape="round" />

    <van-tabs v-model:active="typeFilter" sticky>
      <van-tab v-for="t in tabs" :key="t.key" :title="t.title" :name="t.key" />
    </van-tabs>

    <van-cell-group inset>
      <van-cell
        v-for="e in filtered"
        :key="e.id"
        is-link
        @click="openDetail(e)"
      >
        <template #title>
          <div class="cell-title">
            <van-tag :type="e.type === 'login' ? 'success' : e.type === 'logout' ? 'default' : 'primary'" size="medium">
              {{ EVENT_LABELS[e.type] || e.type }}
            </van-tag>
            <span class="cell-page">{{ e.title }}</span>
          </div>
        </template>
        <template #label>
          <div class="cell-label">
            <span>{{ formatTime(e.at) }}</span>
            <span class="cell-user">{{ e.userName }}<template v-if="e.userId !== 'anonymous'"> · {{ e.userId }}</template></span>
          </div>
          <div v-if="detailText(e)" class="cell-detail">{{ detailText(e) }}</div>
        </template>
      </van-cell>
      <van-empty v-if="!filtered.length" description="暂无日志记录" />
    </van-cell-group>

    <div class="m-logs-actions">
      <van-button plain type="primary" block @click="handleExport">导出 JSON 到本地</van-button>
      <van-button plain type="danger" block @click="handleClear">清空日志</van-button>
    </div>

    <van-popup v-model:show="showDetail" position="bottom" round style="max-height: 70%; overflow: auto;">
      <div class="detail-sheet" v-if="activeEvent">
        <div class="detail-sheet-title">日志详情</div>
        <pre class="detail-json">{{ detailJson(activeEvent) }}</pre>
        <van-button block type="primary" @click="showDetail = false">关闭</van-button>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.m-logs {
  padding: 12px 0 20px;
}

.m-logs-stats {
  display: flex;
  gap: 10px;
  padding: 0 12px;
}

.m-logs-stats .stat {
  flex: 1;
  padding: 10px;
  text-align: center;
  background: var(--bg-page);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.m-logs-stats .stat strong {
  display: block;
  font-size: 18px;
  color: var(--brand);
}

.m-logs-stats .stat span {
  font-size: 11px;
  color: var(--text-sub);
}

.m-logs-tip {
  margin: 10px 16px;
  font-size: 11px;
  line-height: 1.7;
  color: var(--text-sub);
}

.cell-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cell-page {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.cell-label {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: var(--text-sub);
}

.cell-detail {
  margin-top: 2px;
  font-size: 11px;
  color: var(--text-sub);
  word-break: break-all;
}

.m-logs-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 16px 0;
}

.detail-sheet {
  padding: 16px;
}

.detail-sheet-title {
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  color: var(--text-main);
}

.detail-json {
  margin: 0 0 14px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
  background: var(--bg-page);
  border-radius: 8px;
  color: var(--text-main);
}
</style>
