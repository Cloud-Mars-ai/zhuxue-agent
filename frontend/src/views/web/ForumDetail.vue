<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useForumStore } from '@/stores/forum'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const forumStore = useForumStore()
const reply = ref('')

const mobile = computed(() => route.path.startsWith('/m/'))
const post = computed(() => forumStore.findPost(route.params.id))
const replies = computed(() => forumStore.repliesFor(route.params.id))

const roleMeta = {
  teacher: { label: '教师', type: 'danger' },
  ta: { label: '助教', type: 'warning' },
  student: { label: '学生', type: 'info' },
  admin: { label: '管理员', type: 'success' },
}

function submitReply() {
  const content = reply.value.trim()
  if (!content) {
    ElMessage.warning('请输入评论内容')
    return
  }
  forumStore.addReply({
    postId: route.params.id,
    content,
    author: userStore.name,
    role: userStore.role,
  })
  reply.value = ''
  ElMessage.success('评论已发布')
}
</script>

<template>
  <div class="thread-page">
    <button class="back-link" type="button" @click="router.push(mobile ? '/m/forum' : '/app/forum')">
      ← 返回讨论列表
    </button>

    <el-empty v-if="!post" description="研讨主题不存在或已被删除" />
    <template v-else>
      <article class="thread-head card">
        <div class="thread-tags">
          <el-tag v-if="post.isTop" type="danger" size="small" effect="dark">置顶</el-tag>
          <el-tag size="small" effect="plain">{{ post.chapter }}</el-tag>
          <el-tag v-if="post.solved" type="success" size="small" effect="plain">已解决</el-tag>
        </div>
        <h1>{{ post.title }}</h1>
        <p>{{ post.content }}</p>
        <div class="author-line">
          <span class="avatar">{{ post.author.slice(0, 1) }}</span>
          <div>
            <strong>{{ post.author }}</strong>
            <small>{{ roleMeta[post.role]?.label }} · {{ post.createdAt }}</small>
          </div>
        </div>
      </article>

      <section class="reply-section card">
        <div class="reply-head">
          <div>
            <h2>参与讨论</h2>
            <p>{{ replies.length }} 条评论 · 围绕问题本身补充依据与经验</p>
          </div>
        </div>

        <div class="reply-list">
          <el-empty v-if="!replies.length" description="还没有评论，来写第一条回复" :image-size="64" />
          <article v-for="item in replies" :key="item.id" class="reply-item">
            <span class="avatar">{{ item.author.slice(0, 1) }}</span>
            <div>
              <div class="reply-meta">
                <strong>{{ item.author }}</strong>
                <el-tag size="small" :type="roleMeta[item.role]?.type" effect="plain">
                  {{ roleMeta[item.role]?.label }}
                </el-tag>
                <small>{{ item.createdAt }}</small>
              </div>
              <p>{{ item.content }}</p>
            </div>
          </article>
        </div>

        <div class="reply-composer">
          <span class="avatar">{{ (userStore.name || '我').slice(0, 1) }}</span>
          <div>
            <el-input
              v-model="reply"
              type="textarea"
              :rows="4"
              placeholder="写下你的理解、依据或追问…"
              @keydown.ctrl.enter.prevent="submitReply"
            />
            <div class="composer-foot">
              <span>Ctrl + Enter 快速发布</span>
              <el-button type="primary" @click="submitReply">发表评论</el-button>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.thread-page {
  width: min(900px, 100%);
  margin: 0 auto;
}

.back-link {
  margin-bottom: 12px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
}

.thread-head,
.reply-section {
  padding: 24px;
}

.thread-head {
  margin-bottom: 16px;
}

.thread-tags {
  display: flex;
  gap: 7px;
  margin-bottom: 12px;
}

.thread-head h1 {
  margin: 0;
  color: var(--text-main);
  font-size: 28px;
  line-height: 1.35;
}

.thread-head > p {
  margin: 13px 0 18px;
  color: var(--text-sub);
  font-size: 14px;
  line-height: 1.9;
}

.author-line,
.reply-item,
.reply-composer,
.reply-meta {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: var(--accent);
  background: var(--accent-soft);
  font-size: 12px;
  font-weight: 700;
}

.author-line > div,
.reply-item > div {
  display: grid;
  flex: 1;
  gap: 3px;
}

.author-line strong,
.reply-meta strong {
  color: var(--text-main);
  font-size: 12px;
}

.author-line small,
.reply-meta small {
  color: var(--text-faint);
  font-size: 10.5px;
}

.reply-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.reply-head h2 {
  margin: 0;
  font-size: 18px;
}

.reply-head p {
  margin: 5px 0 0;
  color: var(--text-faint);
  font-size: 11px;
}

.reply-list {
  display: grid;
  gap: 0;
}

.reply-item {
  padding: 16px 0;
  border-top: 1px solid var(--divider);
}

.reply-meta {
  align-items: center;
}

.reply-item p {
  margin: 7px 0 0;
  color: var(--text-sub);
  line-height: 1.8;
}

.reply-composer {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}

.reply-composer > div {
  flex: 1;
}

.composer-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.composer-foot span {
  color: var(--text-faint);
  font-size: 10px;
}

@media (max-width: 640px) {
  .thread-head,
  .reply-section {
    padding: 16px;
  }

  .thread-head h1 {
    font-size: 23px;
  }
}
</style>
