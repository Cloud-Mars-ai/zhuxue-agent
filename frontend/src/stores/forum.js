import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { FORUM_POSTS } from '@/mock/data'

const STORAGE_KEY = 'ai-tutor-forum-v1'

function seedPosts() {
  return FORUM_POSTS.map((item) => ({
    ...item,
    createdAtValue: item.createdAt || new Date().toISOString(),
  }))
}

function seedReplies() {
  return {
    1: [
      {
        id: 'r-1-1',
        author: '李助教',
        role: 'ta',
        content:
          '先抓住“信息不完全”和“搜索成本”这两个边界。有限理性不是否定理性，而是说明决策者只能在可得信息与有限计算能力下做满意解。',
        createdAt: '2026-10-15 10:10',
      },
      {
        id: 'r-1-2',
        author: '刘同学',
        role: 'student',
        content: '所以案例里如果强调时间和信息不足，就不宜直接套“完全理性”的最优解，对吗？',
        createdAt: '2026-10-15 10:28',
      },
    ],
    2: [
      {
        id: 'r-2-1',
        author: '王老师',
        role: 'teacher',
        content:
          '不要只看“多元化经营”一个线索。还要比较总部控制成本、业务协同、响应速度和责任边界，再判断职能制或事业部制是否适用。',
        createdAt: '2026-10-16 18:20',
      },
    ],
  }
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && Array.isArray(parsed.posts) && parsed.replies) return parsed
  } catch {
    // 使用固定种子
  }
  return { posts: seedPosts(), replies: seedReplies() }
}

export const useForumStore = defineStore('forum', () => {
  const initial = loadState()
  const posts = ref(initial.posts)
  const replies = ref(initial.replies)

  const sortedPosts = computed(() =>
    [...posts.value].sort((a, b) => Number(!!b.isTop) - Number(!!a.isTop)),
  )

  function persist() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ posts: posts.value, replies: replies.value }),
      )
    } catch {
      // 本地存储不可用时仍保留当前会话状态
    }
  }

  function findPost(id) {
    return posts.value.find((item) => String(item.id) === String(id)) || null
  }

  function repliesFor(id) {
    return replies.value[String(id)] || []
  }

  function addPost({ title, content, chapter, author, role }) {
    const item = {
      id: `post-${Date.now().toString(36)}`,
      title: title.trim(),
      content: content.trim(),
      chapter,
      author,
      role,
      createdAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      replies: 0,
      views: 0,
      solved: false,
    }
    posts.value = [item, ...posts.value]
    replies.value = { ...replies.value, [String(item.id)]: [] }
    persist()
    return item
  }

  function addReply({ postId, content, author, role }) {
    const key = String(postId)
    const item = {
      id: `reply-${Date.now().toString(36)}`,
      content: content.trim(),
      author,
      role,
      createdAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    replies.value = {
      ...replies.value,
      [key]: [...(replies.value[key] || []), item],
    }
    posts.value = posts.value.map((post) =>
      String(post.id) === key
        ? { ...post, replies: (replies.value[key] || []).length }
        : post,
    )
    persist()
    return item
  }

  return { posts, replies, sortedPosts, findPost, repliesFor, addPost, addReply }
})
