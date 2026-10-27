<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { COURSE } from '@/mock/data'
import { useUserStore } from '@/stores/user'
import { useModelStore } from '@/stores/model'
import { useCasesStore } from '@/stores/cases'
import { summarizeCase } from '@/api/aiTasks'

const userStore = useUserStore()
const modelStore = useModelStore()
const casesStore = useCasesStore()

const isStudent = computed(() => userStore.role === 'student')
const isTeacher = computed(() => ['admin', 'teacher', 'ta'].includes(userStore.role))
const isConfigured = computed(() => modelStore.isConfigured)

const chapterOptions = computed(() => COURSE.chapters.map((c) => c.title))

/* ========== 学生：提交案例 ========== */
const form = ref({
  title: '',
  chapter: COURSE.chapters[2]?.title || '',
  link: '',
  reason: '',
  content: '',
})
const aiSummary = ref('')
const aiTags = ref([])
const organizing = ref(false)

async function organize() {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    ElMessage.warning('请先填写案例标题与案例内容，再使用 AI 辅助整理')
    return
  }
  organizing.value = true
  try {
    const { summary, tags } = await summarizeCase({
      title: form.value.title,
      chapter: form.value.chapter,
      content: form.value.content,
    })
    aiSummary.value = summary
    aiTags.value = tags
    ElMessage.success('AI 已整理摘要与知识标签')
  } catch (err) {
    ElMessage.error(err.message || 'AI 整理失败，可手动填写推荐理由')
  } finally {
    organizing.value = false
  }
}

function submitCase() {
  if (!form.value.title.trim()) {
    ElMessage.warning('请填写案例标题')
    return
  }
  casesStore.submit({
    title: form.value.title.trim(),
    chapter: form.value.chapter,
    link: form.value.link.trim(),
    reason: form.value.reason.trim(),
    summary: aiSummary.value,
    tags: aiTags.value,
    submitter: userStore.name,
    submitterId: userStore.user?.id,
    discipline: userStore.discipline,
  })
  ElMessage.success('案例已提交到案例池，等待老师选用')
  form.value = {
    title: '',
    chapter: form.value.chapter,
    link: '',
    reason: '',
    content: '',
  }
  aiSummary.value = ''
  aiTags.value = []
}

/* ========== 教师：案例池管理 ========== */
const filterChapter = ref('')
const filterStatus = ref('')
const sortBy = ref('time') // time 最新优先 / chapter 按章节

const pool = computed(() => {
  let list = [...casesStore.cases]
  if (filterChapter.value) list = list.filter((c) => c.chapter === filterChapter.value)
  if (filterStatus.value) list = list.filter((c) => c.status === filterStatus.value)
  if (sortBy.value === 'time') {
    list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  } else {
    const idx = (c) => chapterOptions.value.indexOf(c.chapter)
    list.sort((a, b) => idx(a) - idx(b))
  }
  // 已选用的课堂案例置顶
  list.sort((a, b) => (a.status === 'selected' ? -1 : b.status === 'selected' ? 1 : 0))
  return list
})

const selectedCount = computed(() => casesStore.cases.filter((c) => c.status === 'selected').length)

async function choose(c) {
  try {
    await ElMessageBox.confirm(
      `确定选为本节课案例吗？选用后课堂主页将置顶展示《${c.title}》。`,
      '选用确认',
      { confirmButtonText: '选用', cancelButtonText: '取消', type: 'info' },
    )
    casesStore.select(c.id)
    ElMessage.success('已选为本节课案例')
  } catch {
    // 用户取消
  }
}

async function reject(c) {
  try {
    await ElMessageBox.confirm(`确定驳回《${c.title}》吗？`, '驳回确认', {
      confirmButtonText: '驳回',
      cancelButtonText: '取消',
      type: 'warning',
    })
    casesStore.reject(c.id)
    ElMessage.success('已驳回')
  } catch {
    // 用户取消
  }
}

const STATUS_LABEL = {
  pending: { label: '待选用', type: 'warning' },
  selected: { label: '本节课案例', type: 'success' },
  rejected: { label: '已驳回', type: 'info' },
}

/* ========== 学生：我的提交 ========== */
const myCases = computed(() => casesStore.myCases(userStore.user?.id))
</script>

<template>
  <div class="cases-page">
    <!-- ===== 学生视图 ===== -->
    <template v-if="isStudent">
      <el-row :gutter="16">
        <el-col :xs="24" :md="14">
          <div class="card">
            <h3 class="card-title">提交预习案例</h3>
            <p class="card-desc">
              预习时把感兴趣的案例提交到案例池，老师将挑选作为本节课案例。你的提交会计入过程性评价。
            </p>
            <el-form :model="form" label-width="90px">
              <el-form-item label="案例标题" required>
                <el-input v-model="form.title" placeholder="例如：瑞幸咖啡联名营销的组织决策" />
              </el-form-item>
              <el-form-item label="相关章节">
                <el-select v-model="form.chapter" style="width: 100%">
                  <el-option v-for="c in chapterOptions" :key="c" :label="c" :value="c" />
                </el-select>
              </el-form-item>
              <el-form-item label="案例内容">
                <el-input
                  v-model="form.content"
                  type="textarea"
                  :rows="4"
                  resize="none"
                  placeholder="简述案例背景与经过，或粘贴原文链接后写要点"
                />
              </el-form-item>
              <el-form-item label="参考链接">
                <el-input v-model="form.link" placeholder="选填，新闻/文章链接" />
              </el-form-item>
              <el-form-item label="推荐理由">
                <el-input
                  v-model="form.reason"
                  type="textarea"
                  :rows="2"
                  resize="none"
                  placeholder="为什么这个案例适合本节课？（可先用 AI 辅助整理，再补充你的想法）"
                />
              </el-form-item>
              <el-form-item>
                <el-button
                  plain
                  :loading="organizing"
                  :disabled="!isConfigured"
                  @click="organize"
                >
                  AI 辅助整理摘要与标签
                </el-button>
                <el-button type="primary" @click="submitCase">提交案例</el-button>
              </el-form-item>
            </el-form>

            <div v-if="aiSummary || aiTags.length" class="ai-result">
              <div class="ai-label">AI 整理结果</div>
              <p v-if="aiSummary" class="ai-summary">{{ aiSummary }}</p>
              <div v-if="aiTags.length" class="ai-tags">
                <el-tag v-for="t in aiTags" :key="t" size="small" type="success" effect="plain">
                  {{ t }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-col>

        <el-col :xs="24" :md="10">
          <div class="card">
            <h3 class="card-title">我的提交（{{ myCases.length }}）</h3>
            <div v-if="myCases.length" class="my-list">
              <div v-for="c in myCases" :key="c.id" class="my-item">
                <div class="my-item-head">
                  <span class="my-item-title">{{ c.title }}</span>
                  <el-tag size="small" :type="STATUS_LABEL[c.status].type" effect="plain">
                    {{ STATUS_LABEL[c.status].label }}
                  </el-tag>
                </div>
                <div class="my-item-meta">{{ c.chapter }} · {{ c.createdAt }}</div>
                <p v-if="c.summary" class="my-item-summary">{{ c.summary }}</p>
              </div>
            </div>
            <el-empty v-else description="还没有提交过案例" :image-size="80" />
          </div>
        </el-col>
      </el-row>
    </template>

    <!-- ===== 教师视图 ===== -->
    <template v-else-if="isTeacher">
      <div class="card">
        <div class="pool-head">
          <h3 class="card-title">案例池（{{ casesStore.cases.length }}）</h3>
          <div class="pool-actions">
            <span v-if="selectedCount" class="selected-tip">
              已选用：{{ selectedCount }} 个课堂案例
            </span>
            <el-select v-model="filterChapter" placeholder="全部章节" clearable style="width: 200px">
              <el-option v-for="c in chapterOptions" :key="c" :label="c" :value="c" />
            </el-select>
            <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 140px">
              <el-option label="待选用" value="pending" />
              <el-option label="已选用" value="selected" />
              <el-option label="已驳回" value="rejected" />
            </el-select>
            <el-radio-group v-model="sortBy" style="margin-left: 8px">
              <el-radio-button value="time">按时间</el-radio-button>
              <el-radio-button value="chapter">按章节</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <el-table :data="pool" stripe>
          <el-table-column label="案例" min-width="260">
            <template #default="{ row }">
              <div class="case-title">{{ row.title }}</div>
              <div class="case-summary">{{ row.summary || row.reason || '（暂无摘要）' }}</div>
              <div v-if="row.tags?.length" class="case-tags">
                <el-tag
                  v-for="t in row.tags"
                  :key="t"
                  size="small"
                  effect="plain"
                  class="case-tag"
                >
                  {{ t }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="chapter" label="相关章节" width="170" />
          <el-table-column label="提交人" width="130">
            <template #default="{ row }">
              <div>{{ row.submitter }}</div>
              <div class="text-sub">{{ row.discipline }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="提交时间" width="130" />
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag size="small" :type="STATUS_LABEL[row.status].type" effect="plain">
                {{ STATUS_LABEL[row.status].label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="170" align="right">
            <template #default="{ row }">
              <template v-if="row.status !== 'selected'">
                <el-button link type="primary" size="small" @click="choose(row)">选用</el-button>
                <el-button
                  v-if="row.status !== 'rejected'"
                  link
                  type="danger"
                  size="small"
                  @click="reject(row)"
                >
                  驳回
                </el-button>
              </template>
              <el-button v-else link type="success" size="small" disabled>已选用</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!pool.length" description="没有符合条件的案例" :image-size="80" />
      </div>
    </template>

    <el-empty v-else description="当前角色暂无案例功能入口" :image-size="80" />
  </div>
</template>

<style scoped>
.cases-page {
  padding-bottom: 12px;
}

.card-title {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 600;
}

.card-desc {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-sub);
}

.ai-result {
  margin-top: 14px;
  padding: 12px 14px;
  background: var(--bg-page);
  border: 1px dashed var(--brand);
  border-radius: 8px;
}

.ai-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--brand);
  margin-bottom: 6px;
}

.ai-summary {
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 1.8;
}

.my-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.my-item {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.my-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.my-item-title {
  font-size: 14px;
  font-weight: 600;
}

.my-item-meta {
  margin: 4px 0 6px;
  font-size: 12px;
  color: var(--text-sub);
}

.my-item-summary {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-sub);
}

.pool-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}

.pool-head .card-title {
  margin: 0;
}

.pool-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.selected-tip {
  font-size: 12px;
  color: var(--brand);
}

.case-title {
  font-size: 14px;
  font-weight: 600;
}

.case-summary {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-sub);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.case-tags {
  margin-top: 4px;
}

.case-tag {
  margin-right: 4px;
}
</style>
