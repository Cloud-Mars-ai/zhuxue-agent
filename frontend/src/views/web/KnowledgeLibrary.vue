<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useUserStore } from '@/stores/user'
import { importMaterialFile } from '@/utils/materialImport'

const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const userStore = useUserStore()

const fileInput = ref()
const uploading = ref(false)
const keyword = ref('')
const note = ref({ title: '', text: '' })
const showNoteEditor = ref(false)

const customMaterials = computed(() =>
  knowledgeStore.materials.filter((item) => !item.seeded),
)
const filteredMaterials = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const list = [...customMaterials.value]
  if (!kw) return list
  return list.filter(
    (item) =>
      item.title.toLowerCase().includes(kw) || item.text.toLowerCase().includes(kw),
  )
})

function formatSize(value) {
  const bytes = Number(value) || 0
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function openPicker() {
  if (fileInput.value) {
    fileInput.value.value = ''
    fileInput.value.click()
  }
}

async function handleFiles(event) {
  const files = [...(event.target.files || [])]
  if (!files.length) return
  uploading.value = true
  let imported = 0
  let repairedCharsTotal = 0
  const failures = []
  for (const file of files) {
    try {
      const { text, repairedChars } = await importMaterialFile(file)
      await knowledgeStore.addMaterial({
        title: file.name,
        chapter: '学生自主资料',
        text,
        size: file.size,
      })
      repairedCharsTotal += repairedChars
      imported += 1
    } catch (error) {
      failures.push(`${file.name}：${error.message || '解析失败'}`)
    }
  }
  uploading.value = false
  if (imported) ElMessage.success(`已将 ${imported} 份资料保存到知识库`)
  if (repairedCharsTotal > 0) {
    ElMessage.info(`已自动清理 ${repairedCharsTotal} 个乱码字符（从 PDF 复制文本时常见）`)
  }
  if (failures.length) ElMessage.warning(failures.join('；'))
}

async function saveNote() {
  if (!note.value.title.trim() || !note.value.text.trim()) {
    ElMessage.warning('请填写标题和内容')
    return
  }
  await knowledgeStore.addMaterial({
    title: note.value.title.trim(),
    chapter: '学习笔记',
    text: note.value.text.trim(),
  })
  note.value = { title: '', text: '' }
  showNoteEditor.value = false
  ElMessage.success('笔记已保存')
}

async function removeMaterial(item) {
  try {
    await ElMessageBox.confirm(`确定从知识库删除「${item.title}」吗？`, '删除资料', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await knowledgeStore.removeMaterial(item.id)
    ElMessage.success('资料已删除')
  } catch {
    // 用户取消
  }
}

async function removeBoard(item) {
  try {
    await ElMessageBox.confirm(`确定删除板书「${item.title}」吗？`, '删除板书', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await knowledgeStore.removeBoard(item.id)
    ElMessage.success('板书已删除')
  } catch {
    // 用户取消
  }
}

function openBoard(item) {
  if (item.route) {
    router.push(item.route)
    return
  }
  if (item.projectId && item.sceneId) {
    router.push({
      path: '/app/board',
      query: { studio: item.projectId, scene: item.sceneId },
    })
  }
}

onMounted(async () => {
  await Promise.all([knowledgeStore.load(), knowledgeStore.loadBoards()])
})
</script>

<template>
  <div class="library-page" data-testid="knowledge-library">
    <header class="library-head">
      <div>
        <div class="library-kicker">PERSONAL KNOWLEDGE BASE</div>
        <h1>我的知识库</h1>
        <p>上传课程资料、保存学习笔记和生成过的板书；生成课程时会优先读取这里的内容。</p>
      </div>
      <div class="head-actions">
        <el-button :loading="uploading" @click="openPicker">上传资料</el-button>
        <el-button type="primary" @click="showNoteEditor = true">新建笔记</el-button>
        <input
          ref="fileInput"
          class="hidden-input"
          type="file"
          multiple
          accept=".txt,.md,.markdown,.csv,.json,.html,.pdf,.docx,.pptx"
          @change="handleFiles"
        />
      </div>
    </header>

    <section class="library-stats">
      <article>
        <span>我的资料</span>
        <strong>{{ customMaterials.length }}</strong>
        <small>份可参与课程生成</small>
      </article>
      <article>
        <span>保存板书</span>
        <strong>{{ knowledgeStore.savedBoards.length }}</strong>
        <small>可随时回看</small>
      </article>
      <article>
        <span>资料字数</span>
        <strong>{{ (knowledgeStore.stats.chars / 1000).toFixed(1) }}k</strong>
        <small>含系统课程资料</small>
      </article>
    </section>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="上传后即保存到当前浏览器；课程生成会优先使用你的资料，而不是内置示例章节。"
    />

    <section class="library-grid">
      <div class="library-panel materials-panel">
        <div class="panel-head">
          <div>
            <h2>我的资料</h2>
            <p>支持 TXT、Markdown、PDF、DOCX、PPTX、CSV 与 JSON。</p>
          </div>
          <el-input v-model="keyword" clearable placeholder="搜索资料" />
        </div>

        <el-empty
          v-if="!filteredMaterials.length"
          description="还没有上传资料，先添加一份课程文件或笔记"
        />
        <div v-else class="material-list">
          <article v-for="item in filteredMaterials" :key="item.id" class="material-item">
            <div class="file-mark">{{ item.title.split('.').pop()?.slice(0, 4).toUpperCase() }}</div>
            <div class="material-copy">
              <strong>{{ item.title }}</strong>
              <span>
                {{ item.chapter }} · {{ item.text.length.toLocaleString() }} 字 ·
                {{ formatTime(item.updatedAt) }}
              </span>
              <p>{{ item.text.slice(0, 130) }}…</p>
            </div>
            <el-button text type="danger" @click="removeMaterial(item)">删除</el-button>
          </article>
        </div>
      </div>

      <div class="library-panel board-panel">
        <div class="panel-head">
          <div>
            <h2>保存的板书</h2>
            <p>在任意板书页点击“保存到知识库”，即会出现在这里。</p>
          </div>
          <el-button text type="primary" @click="router.push('/app/board')">去生成板书</el-button>
        </div>

        <el-empty
          v-if="!knowledgeStore.savedBoards.length"
          description="还没有保存的板书"
          :image-size="70"
        />
        <div v-else class="board-list">
          <article v-for="item in knowledgeStore.savedBoards" :key="item.id">
            <div class="board-icon">板</div>
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.chapter || '专题课程' }} · {{ formatTime(item.savedAt) }}</span>
              <small>{{ item.lesson?.blocks?.length || 0 }} 个知识块</small>
            </div>
            <div class="board-actions">
              <el-button text type="primary" @click="openBoard(item)">打开</el-button>
              <el-button text type="danger" @click="removeBoard(item)">删除</el-button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <el-dialog v-model="showNoteEditor" title="新建学习笔记" width="560px">
      <el-form label-position="top">
        <el-form-item label="标题">
          <el-input v-model="note.title" placeholder="例如：Python 循环的三个易错点" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="note.text"
            type="textarea"
            :rows="8"
            placeholder="粘贴课堂笔记、资料摘录或自己的总结…"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNoteEditor = false">取消</el-button>
        <el-button type="primary" @click="saveNote">保存到知识库</el-button>
      </template>
    </el-dialog>

    <p class="identity-tip">
      当前知识库归属：{{ userStore.name || '当前用户' }}。资料仅保存在此浏览器。
    </p>
  </div>
</template>

<style scoped>
.library-page {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.library-head,
.panel-head,
.material-item,
.board-list article {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.library-head {
  align-items: flex-start;
  margin-bottom: 18px;
}

.library-kicker {
  margin-bottom: 6px;
  color: var(--accent);
  font: 10px/1 var(--font-mono);
  letter-spacing: 1.8px;
}

.library-head h1 {
  margin: 0 0 6px;
  font-size: 28px;
  color: var(--text-main);
}

.library-head p,
.panel-head p {
  margin: 0;
  color: var(--text-sub);
  line-height: 1.7;
}

.head-actions {
  display: flex;
  gap: 8px;
}

.hidden-input {
  display: none;
}

.library-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.library-stats article,
.library-panel {
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
}

.library-stats article {
  display: grid;
  gap: 3px;
  padding: 16px 18px;
}

.library-stats span,
.library-stats small {
  color: var(--text-sub);
  font-size: 11px;
}

.library-stats strong {
  color: var(--text-main);
  font: 24px/1.2 var(--font-mono);
}

.library-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(340px, 0.75fr);
  gap: 14px;
  margin-top: 14px;
}

.library-panel {
  padding: 18px;
}

.panel-head {
  align-items: flex-start;
  margin-bottom: 14px;
}

.panel-head h2 {
  margin: 0 0 4px;
  font-size: 16px;
}

.panel-head :deep(.el-input) {
  width: 190px;
}

.material-list,
.board-list {
  display: grid;
  gap: 9px;
}

.material-item {
  align-items: flex-start;
  padding: 12px;
  border: 1px solid var(--card-border);
  border-radius: 12px;
  background: var(--surface-2);
}

.file-mark,
.board-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: var(--accent);
  background: var(--accent-soft);
  font: 700 10px/1 var(--font-mono);
}

.material-copy {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 3px;
}

.material-copy strong,
.board-list strong {
  color: var(--text-main);
  font-size: 13px;
}

.material-copy span,
.board-list span,
.board-list small {
  color: var(--text-faint);
  font-size: 10.5px;
}

.material-copy p {
  margin: 5px 0 0;
  color: var(--text-sub);
  font-size: 11px;
  line-height: 1.65;
}

.board-list article {
  align-items: flex-start;
  padding: 11px;
  border: 1px solid var(--card-border);
  border-radius: 12px;
}

.board-list article > div:nth-child(2) {
  display: grid;
  flex: 1;
  gap: 3px;
}

.board-actions {
  display: flex;
  flex: none;
}

.identity-tip {
  margin: 14px 0 0;
  color: var(--text-faint);
  font-size: 10.5px;
}

@media (max-width: 900px) {
  .library-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .library-head,
  .panel-head {
    flex-direction: column;
  }

  .head-actions,
  .panel-head :deep(.el-input) {
    width: 100%;
  }

  .library-stats {
    grid-template-columns: 1fr;
  }

  .material-item {
    flex-wrap: wrap;
  }
}
</style>
