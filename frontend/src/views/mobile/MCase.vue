<script setup>
import { ref, computed } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
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
    showToast('请先填写案例标题与内容')
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
    showToast('AI 已整理摘要与标签')
  } catch (err) {
    showToast(err.message || 'AI 整理失败，可手动填写')
  } finally {
    organizing.value = false
  }
}

function submitCase() {
  if (!form.value.title.trim()) {
    showToast('请填写案例标题')
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
  showToast('案例已提交，等待老师选用')
  form.value = { title: '', chapter: form.value.chapter, link: '', reason: '', content: '' }
  aiSummary.value = ''
  aiTags.value = []
}

const myCases = computed(() => casesStore.myCases(userStore.user?.id))

const STATUS_LABEL = {
  pending: { label: '待选用', color: '#ff976a', plain: true },
  selected: { label: '本节课案例', color: '#07c160', plain: true },
  rejected: { label: '已驳回', color: '#969799', plain: true },
}

/* ========== 弹层状态 ========== */
const showChapterPicker = ref(false)
const showFilterPicker = ref(false)

/* ========== 教师：案例池 ========== */
const filterChapter = ref('')
const pool = computed(() => {
  let list = [...casesStore.cases]
  if (filterChapter.value) list = list.filter((c) => c.chapter === filterChapter.value)
  // 已选用置顶，其余按时间倒序
  return list.sort((a, b) => {
    if (a.status === 'selected') return -1
    if (b.status === 'selected') return 1
    return a.createdAt < b.createdAt ? 1 : -1
  })
})

async function choose(c) {
  try {
    await showConfirmDialog({
      title: '选用确认',
      message: `确定选《${c.title}》为本节课案例吗？`,
    })
    casesStore.select(c.id)
    showToast('已选为本节课案例')
  } catch {
    // 取消
  }
}

async function reject(c) {
  try {
    await showConfirmDialog({ title: '驳回确认', message: `确定驳回《${c.title}》吗？` })
    casesStore.reject(c.id)
    showToast('已驳回')
  } catch {
    // 取消
  }
}
</script>

<template>
  <div class="m-page">
    <!-- ===== 学生视图 ===== -->
    <template v-if="isStudent">
      <van-notice-bar
        v-if="!isConfigured"
        text="配置模型密钥后可使用 AI 辅助整理摘要与标签"
        background="#fdf6ec"
        color="#b06f00"
      />

      <van-cell-group inset title="提交预习案例" class="m-case-form">
        <van-field
          v-model="form.title"
          label="案例标题"
          placeholder="例如：瑞幸联名营销的决策逻辑"
          required
        />
        <van-field
          :model-value="form.chapter"
          is-link
          readonly
          label="相关章节"
          placeholder="选择章节"
          @click="showChapterPicker = true"
        />
        <van-field
          v-model="form.content"
          type="textarea"
          rows="3"
          autosize
          label="案例内容"
          placeholder="简述案例背景与经过"
        />
        <van-field v-model="form.link" label="参考链接" placeholder="选填" />
        <van-field
          v-model="form.reason"
          type="textarea"
          rows="2"
          autosize
          label="推荐理由"
          placeholder="为什么适合本节课？"
        />
      </van-cell-group>

      <div class="m-form-ops">
        <van-button
          plain
          size="small"
          type="primary"
          :loading="organizing"
          :disabled="!isConfigured"
          @click="organize"
        >
          AI 辅助整理
        </van-button>
        <van-button size="small" type="primary" @click="submitCase">提交案例</van-button>
      </div>

      <van-cell-group v-if="aiSummary || aiTags.length" inset title="AI 整理结果">
        <van-cell>
          <template #title>
            <div class="m-ai-summary">{{ aiSummary }}</div>
            <div class="m-ai-tags">
              <van-tag
                v-for="t in aiTags"
                :key="t"
                plain
                type="success"
                class="m-ai-tag"
              >
                {{ t }}
              </van-tag>
            </div>
          </template>
        </van-cell>
      </van-cell-group>

      <van-cell-group inset title="我的提交">
        <van-cell
          v-for="c in myCases"
          :key="c.id"
          :title="c.title"
          :label="`${c.chapter} · ${c.createdAt}`"
        >
          <template #right-icon>
            <van-tag :color="STATUS_LABEL[c.status].color" plain>
              {{ STATUS_LABEL[c.status].label }}
            </van-tag>
          </template>
        </van-cell>
        <van-empty v-if="!myCases.length" description="还没有提交过案例" image-size="60" />
      </van-cell-group>
    </template>

    <!-- ===== 教师视图 ===== -->
    <template v-else-if="isTeacher">
      <van-cell-group inset title="案例池">
        <van-cell title="章节筛选" :value="filterChapter || '全部章节'" is-link @click="showFilterPicker = true" />
      </van-cell-group>

      <div class="m-pool">
        <div v-for="c in pool" :key="c.id" class="m-pool-item">
          <div class="m-pool-head">
            <span class="m-pool-title">{{ c.title }}</span>
            <van-tag :color="STATUS_LABEL[c.status].color" plain>
              {{ STATUS_LABEL[c.status].label }}
            </van-tag>
          </div>
          <div class="m-pool-summary">{{ c.summary || c.reason || '（暂无摘要）' }}</div>
          <div v-if="c.tags?.length" class="m-ai-tags">
            <van-tag v-for="t in c.tags" :key="t" plain type="primary" class="m-ai-tag">
              {{ t }}
            </van-tag>
          </div>
          <div class="m-pool-meta">
            {{ c.submitter }}（{{ c.discipline }}）· {{ c.chapter }} · {{ c.createdAt }}
          </div>
          <div v-if="c.status !== 'selected'" class="m-pool-ops">
            <van-button size="mini" type="primary" @click="choose(c)">选用</van-button>
            <van-button
              v-if="c.status !== 'rejected'"
              size="mini"
              plain
              type="danger"
              @click="reject(c)"
            >
              驳回
            </van-button>
          </div>
        </div>
        <van-empty v-if="!pool.length" description="案例池为空" image-size="60" />
      </div>
    </template>

    <van-empty v-else description="当前角色暂无案例功能" image-size="60" />

    <van-popup v-model:show="showChapterPicker" position="bottom">
      <van-picker
        :columns="chapterOptions"
        @confirm="({ selectedOptions }) => { form.chapter = selectedOptions[0]?.value; showChapterPicker = false }"
        @cancel="showChapterPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showFilterPicker" position="bottom">
      <van-picker
        :columns="['全部章节', ...chapterOptions]"
        @confirm="({ selectedOptions }) => { filterChapter = selectedOptions[0]?.value === '全部章节' ? '' : selectedOptions[0]?.value; showFilterPicker = false }"
        @cancel="showFilterPicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped>
.m-form-ops {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px;
}

.m-ai-summary {
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.m-ai-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.m-ai-tag {
  font-size: 11px;
}

.m-pool {
  padding: 0 12px;
}

.m-pool-item {
  padding: 12px;
  margin-bottom: 10px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.m-pool-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.m-pool-title {
  font-size: 14px;
  font-weight: 600;
}

.m-pool-summary {
  margin: 6px 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-sub);
}

.m-pool-meta {
  font-size: 11px;
  color: var(--text-sub);
}

.m-pool-ops {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
</style>
