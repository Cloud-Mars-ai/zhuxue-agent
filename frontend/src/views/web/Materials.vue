<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { COURSE } from '@/mock/data'
import { useKnowledgeStore } from '@/stores/knowledge'

const store = useKnowledgeStore()

const chapterOptions = COURSE.chapters.map((c) => c.title)
const showForm = ref(false)
const editingId = ref('')
const saving = ref(false)
const draft = reactive({
  chapter: chapterOptions[0],
  title: '',
  text: '',
})

const testQuery = ref('有限理性和完全理性有什么区别')
const testChapter = ref('')
const testing = ref(false)
const testChunks = ref([])

const stats = computed(() => store.stats)

onMounted(async () => {
  await store.load()
})

function openCreate() {
  editingId.value = ''
  draft.chapter = chapterOptions[0]
  draft.title = ''
  draft.text = ''
  showForm.value = true
}

function openEdit(m) {
  editingId.value = m.id
  draft.chapter = m.chapter
  draft.title = m.title
  draft.text = m.text
  showForm.value = true
}

async function save() {
  if (!draft.text.trim()) {
    ElMessage.warning('请粘贴材料正文')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await store.updateMaterial(editingId.value, {
        title: draft.title.trim() || `${draft.chapter} 补充材料`,
        chapter: draft.chapter,
        text: draft.text,
      })
      ElMessage.success('材料已更新')
    } else {
      await store.addMaterial({ ...draft })
      ElMessage.success('材料已接入，AI 回答将优先依据它')
    }
    showForm.value = false
  } finally {
    saving.value = false
  }
}

async function remove(m) {
  try {
    await ElMessageBox.confirm(
      `确定移除「${m.title}」吗？移除后 AI 不再引用这份材料。`,
      '移除材料',
      { confirmButtonText: '移除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  await store.removeMaterial(m.id)
  ElMessage.success('已移除')
}

async function resetOutline() {
  try {
    await ElMessageBox.confirm(
      '将清空当前所有材料，恢复为六章课程纲要（教师确认稿）。确定继续吗？',
      '恢复课程纲要',
      { confirmButtonText: '恢复', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  await store.resetToOutline()
  ElMessage.success('已恢复为课程纲要')
}

async function runTest() {
  if (!testQuery.value.trim()) return
  testing.value = true
  try {
    const { chunks } = await store.buildContext({
      chapter: testChapter.value,
      query: testQuery.value,
    })
    testChunks.value = chunks
    if (!chunks.length) ElMessage.info('没有命中材料，回答会明确说明"材料未涉及"')
  } finally {
    testing.value = false
  }
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function chars(m) {
  return (m.text || '').length
}
</script>

<template>
  <div class="materials-page">
    <div class="page-head">
      <div>
        <h3 class="page-title">课程资料库</h3>
        <p class="page-desc">
          只有教师确认的材料才会进入 AI 上下文。回答优先依据这些内容；材料没讲的，AI 会明确说"未涉及"，而不是编。
        </p>
      </div>
      <div class="head-actions">
        <el-button plain @click="resetOutline">恢复课程纲要</el-button>
        <el-button type="primary" @click="openCreate">接入新材料</el-button>
      </div>
    </div>

    <div class="stat-strip">
      <div class="stat-item">
        <span class="stat-num">{{ stats.count }}</span>
        <span class="stat-label">份材料</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.chars }}</span>
        <span class="stat-label">字</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ store.allChunks.length }}</span>
        <span class="stat-label">个可检索片段</span>
      </div>
      <div class="stat-note">
        当前为六章课程纲要（教师确认稿）。正式上线时，把课件 PDF / PPT 的正文粘贴进来即可。
      </div>
    </div>

    <el-alert type="info" :closable="false" show-icon class="tip">
      <template #title>
        资料第一原则：AI 不再只靠通用知识回答。每次提问会按章节与关键词检索 top-3 片段，注入上下文并标注来源。
      </template>
    </el-alert>

    <div v-if="showForm" class="card form-card">
      <h4 class="card-title">{{ editingId ? '编辑材料' : '接入新材料' }}</h4>
      <el-form label-width="80px">
        <el-form-item label="关联章节">
          <el-select v-model="draft.chapter" style="width: 100%">
            <el-option v-for="c in chapterOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="材料标题">
          <el-input v-model="draft.title" placeholder="例如：第4章课件 · 矩阵式组织" />
        </el-form-item>
        <el-form-item label="材料正文">
          <el-input
            v-model="draft.text"
            type="textarea"
            :rows="10"
            resize="vertical"
            placeholder="粘贴课件、教材段落或教学大纲。表格类内容建议整理成文字后粘贴。"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="save">保存并接入</el-button>
          <el-button @click="showForm = false">取消</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card">
      <div class="card-head">
        <h4 class="card-title">已接入材料</h4>
        <span class="hint">共 {{ store.materials.length }} 份</span>
      </div>

      <div v-for="m in store.materials" :key="m.id" class="material-item">
        <div class="material-main">
          <div class="material-title">
            {{ m.title }}
            <el-tag v-if="m.seeded" size="small" effect="plain" type="info">纲要</el-tag>
            <el-tag size="small" effect="plain" type="success">教师确认</el-tag>
          </div>
          <div class="material-meta">
            {{ m.chapter }} · {{ chars(m) }} 字 · 更新于 {{ formatTime(m.updatedAt) }}
          </div>
          <el-collapse class="material-collapse">
            <el-collapse-item title="查看原文" :name="m.id">
              <div class="material-text">{{ m.text }}</div>
            </el-collapse-item>
          </el-collapse>
        </div>
        <div class="material-actions">
          <el-button link type="primary" size="small" @click="openEdit(m)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(m)">移除</el-button>
        </div>
      </div>
    </div>

    <div class="card">
      <h4 class="card-title">检索自检</h4>
      <p class="page-desc">
        输入一个学生可能会问的问题，看看系统会取哪几段材料。检索不到时会回退到该章前两片，或明确说"未涉及"。
      </p>
      <div class="test-row">
        <el-select v-model="testChapter" clearable placeholder="不限章节" style="width: 200px">
          <el-option v-for="c in chapterOptions" :key="c" :label="c" :value="c" />
        </el-select>
        <el-input v-model="testQuery" placeholder="输入测试问题" style="flex: 1" />
        <el-button type="primary" plain :loading="testing" @click="runTest">测试检索</el-button>
      </div>

      <div v-if="testChunks.length" class="chunk-list">
        <div v-for="(c, i) in testChunks" :key="c.id" class="chunk-item">
          <div class="chunk-head">
            <span class="chunk-no">材料 {{ i + 1 }}</span>
            <span class="chunk-title">{{ c.title }}</span>
          </div>
          <div class="chunk-text">{{ c.text.slice(0, 220) }}{{ c.text.length > 220 ? '…' : '' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.materials-page {
  padding-bottom: 12px;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.page-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.page-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-sub);
}

.head-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-strip {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  padding: 12px 16px;
  margin-bottom: 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.stat-num {
  font-family: var(--font-mono, monospace);
  font-size: 24px;
  font-weight: 700;
  color: var(--accent);
}

.stat-label {
  font-size: 12px;
  color: var(--text-sub);
}

.stat-note {
  flex: 1;
  min-width: 240px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-faint);
}

.tip {
  margin-bottom: 12px;
}

.card {
  padding: 16px;
  margin-bottom: 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.card-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.hint {
  font-size: 12px;
  color: var(--text-sub);
}

.material-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px dashed var(--border);
}

.material-item:last-child {
  border-bottom: none;
}

.material-main {
  flex: 1;
  min-width: 0;
}

.material-title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.material-meta {
  margin-top: 3px;
  font-size: 11.5px;
  color: var(--text-faint);
}

.material-collapse {
  margin-top: 6px;
  border: none;
}

.material-text {
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-sub);
  white-space: pre-wrap;
}

.material-actions {
  flex: none;
  display: flex;
  gap: 2px;
}

.test-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.chunk-list {
  margin-top: 12px;
}

.chunk-item {
  padding: 10px 12px;
  margin-bottom: 8px;
  background: var(--bg-page);
  border-left: 2px solid var(--accent);
  border-radius: 0 6px 6px 0;
}

.chunk-head {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.chunk-no {
  font-family: var(--font-mono, monospace);
  font-size: 10.5px;
  color: var(--accent);
}

.chunk-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-main);
}

.chunk-text {
  margin-top: 4px;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--text-sub);
  white-space: pre-wrap;
}
</style>
