<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { FORUM_POSTS, COURSE } from '@/mock/data'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const keyword = ref('')
const chapterFilter = ref('')

const chapters = computed(() => [...new Set(COURSE.chapters.map((c) => c.title))])

const posts = computed(() => {
  let list = [...FORUM_POSTS]
  if (chapterFilter.value) {
    list = list.filter((p) => p.chapter === chapterFilter.value)
  }
  if (keyword.value) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(
      (p) => p.title.toLowerCase().includes(kw) || p.content.toLowerCase().includes(kw),
    )
  }
  // 置顶帖排在最前
  return list.sort((a, b) => Number(!!b.isTop) - Number(!!a.isTop))
})

const dialogVisible = ref(false)
const newPost = ref({ title: '', chapter: '', content: '' })

const roleTag = {
  teacher: { label: '教师', type: 'danger' },
  ta: { label: '助教', type: 'warning' },
  student: { label: '学生', type: 'info' },
  admin: { label: '管理员', type: 'success' },
}

function openDialog() {
  newPost.value = { title: '', chapter: '', content: '' }
  dialogVisible.value = true
}

function submitPost() {
  if (!newPost.value.title.trim() || !newPost.value.content.trim()) {
    ElMessage.warning('标题和内容都不能为空')
    return
  }
  // 联调阶段：本地提示，接口就绪后改为 post('/forum/posts', newPost.value)
  ElMessage.success('发布成功（当前为仿真数据，刷新后不会保留）')
  dialogVisible.value = false
}
</script>

<template>
  <div>
    <div class="toolbar">
      <div class="filters">
        <el-input
          v-model="keyword"
          placeholder="搜索帖子标题或内容"
          clearable
          class="search"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="chapterFilter" placeholder="按章节筛选" clearable class="select">
          <el-option v-for="c in chapters" :key="c" :label="c" :value="c" />
        </el-select>
      </div>
      <el-button type="primary" @click="openDialog">
        <el-icon><EditPen /></el-icon>发起研讨
      </el-button>
    </div>

    <div class="card">
      <el-empty v-if="!posts.length" description="没有符合条件的帖子" />
      <div v-for="p in posts" :key="p.id" class="post">
        <div class="post-head">
          <el-tag v-if="p.isTop" type="danger" size="small" effect="dark">置顶</el-tag>
          <span class="post-title">{{ p.title }}</span>
          <el-tag v-if="p.solved" type="success" size="small" effect="plain">已解决</el-tag>
        </div>
        <p class="post-content">{{ p.content }}</p>
        <div class="post-foot">
          <span class="text-sub">
            <el-tag size="small" :type="roleTag[p.role]?.type" effect="plain">
              {{ roleTag[p.role]?.label }}
            </el-tag>
            {{ p.author }} · {{ p.createdAt }}
          </span>
          <span class="text-sub">
            <el-icon><ChatDotRound /></el-icon> {{ p.replies }}
            <el-icon class="ml"><View /></el-icon> {{ p.views }}
            <span class="chapter">{{ p.chapter }}</span>
          </span>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="发起研讨" width="560px">
      <el-form :model="newPost" label-width="70px">
        <el-form-item label="标题">
          <el-input v-model="newPost.title" placeholder="一句话描述你的问题" />
        </el-form-item>
        <el-form-item label="所属章节">
          <el-select v-model="newPost.chapter" placeholder="选择章节" class="w-full">
            <el-option v-for="c in chapters" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="newPost.content"
            type="textarea"
            :rows="5"
            placeholder="补充问题背景，方便老师和同学回答"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPost">发布</el-button>
      </template>
    </el-dialog>

    <p class="text-sub identity-tip">
      当前以「{{ userStore.roleLabel }}」身份浏览，教师与助教可置顶、标记已解决。
    </p>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.filters {
  display: flex;
  gap: 10px;
  flex: 1;
}

.search {
  max-width: 280px;
}

.select {
  width: 200px;
}

.post {
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}

.post:last-child {
  border-bottom: none;
}

.post-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.post-title {
  font-size: 15px;
  font-weight: 600;
}

.post-content {
  margin: 8px 0;
  font-size: 13px;
  color: var(--text-sub);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.post-foot .text-sub {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ml {
  margin-left: 8px;
}

.chapter {
  padding: 1px 8px;
  background: var(--brand-light);
  color: var(--brand);
  border-radius: 10px;
}

.w-full {
  width: 100%;
}

.identity-tip {
  margin: 12px 0 0;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .filters {
    flex-direction: column;
  }
  .search,
  .select {
    max-width: none;
    width: 100%;
  }
}
</style>
