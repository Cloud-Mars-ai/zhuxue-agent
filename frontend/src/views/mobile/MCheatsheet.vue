<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { COURSE } from '@/mock/data'
import { getOutlineChapters, outlineToText } from '@/mock/courseOutline'
import { useUserStore } from '@/stores/user'
import { useModelStore } from '@/stores/model'
import { useCheatsheetStore } from '@/stores/cheatsheets'
import { generateCheatsheet } from '@/api/aiTasks'
import { cheatsheetToText } from '@/utils/cheatsheet'

const route = useRoute()
const userStore = useUserStore()
const modelStore = useModelStore()
const sheetStore = useCheatsheetStore()

const chapterOptions = COURSE.chapters.map((c) => c.title)
const selected = ref(COURSE.chapters[2]?.title || chapterOptions[0])
const generating = ref(false)
const sheet = ref(null)

const isConfigured = computed(() => modelStore.isConfigured)
const totalPoints = computed(() =>
  (sheet.value?.topics || []).reduce((n, t) => n + t.points.length, 0),
)

onMounted(() => {
  const c = String(route.query.chapters || '').trim()
  if (c) {
    const found = chapterOptions.find((x) => x === c || x.includes(c))
    if (found) selected.value = found
  }
  const last = sheetStore.latest(userStore.user?.id)
  if (last) sheet.value = last
})

async function generate() {
  if (!isConfigured.value) {
    showToast('请先在电脑端完成模型配置')
    return
  }
  generating.value = true
  try {
    const res = await generateCheatsheet({
      chapters: [selected.value],
      outlineText: outlineToText(getOutlineChapters([selected.value])),
      layout: 'screen',
      focus: '概念辨析',
    })
    sheet.value = sheetStore.save({
      studentId: userStore.user?.id,
      chapters: [selected.value],
      topics: res.topics,
      layout: 'screen',
      fallback: res.fallback,
    })
    showToast(res.fallback ? '已生成（演示缓存版）' : '速查表已生成')
  } catch (err) {
    showToast(err.message || '生成失败')
  } finally {
    generating.value = false
  }
}

async function copyText() {
  if (!sheet.value) return
  const text = `${COURSE.name} · 备考速查表\n\n${cheatsheetToText(sheet.value.topics)}`
  try {
    await navigator.clipboard.writeText(text)
    showToast('已复制')
  } catch {
    showToast('当前浏览器不支持复制，请长按选择')
  }
}
</script>

<template>
  <div class="m-page">
    <div class="m-head">
      <div class="m-title">备考速查表</div>
      <div class="m-sub">按主题重组，不按章节顺序；考前直接过一遍。</div>
    </div>

    <div class="m-card">
      <div class="m-label">选择章节</div>
      <div class="m-chips">
        <span
          v-for="c in chapterOptions"
          :key="c"
          class="skin-chip"
          :class="{ on: selected === c }"
          @click="selected = c"
        >
          {{ c }}
        </span>
      </div>
      <van-button block type="primary" class="mt" :loading="generating" @click="generate">
        {{ sheet ? '重新生成' : '生成速查表' }}
      </van-button>
    </div>

    <template v-if="sheet">
      <div class="m-card m-sheet">
        <div class="m-sheet-kicker">《管理学》 · 备考专栏</div>
        <div class="m-sheet-title">考前速查表</div>
        <div class="m-sheet-meta">{{ sheet.chapters.join(' · ') }} · 共 {{ totalPoints }} 条</div>

        <div v-for="(topic, ti) in sheet.topics" :key="topic.name" class="m-topic">
          <div class="m-topic-title">
            <span class="m-topic-no">{{ String(ti + 1).padStart(2, '0') }}</span>
            {{ topic.name }}
          </div>
          <div
            v-for="(p, pi) in topic.points"
            :key="`${topic.name}-${pi}`"
            class="m-point"
            :class="{ priority: p.priority }"
          >
            <div class="m-point-term">
              {{ p.term }}
              <span v-if="p.priority" class="m-point-flag">重点</span>
            </div>
            <div class="m-point-def">{{ p.definition }}</div>
            <div v-if="p.examTip" class="m-point-tip">考点：{{ p.examTip }}</div>
            <div v-if="p.source" class="m-point-src">{{ p.source }}</div>
          </div>
        </div>

        <van-button block plain size="small" class="mt" @click="copyText">复制全文</van-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.m-page {
  padding: 12px 0 20px;
}

.m-head {
  padding: 4px 16px 10px;
}

.m-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.m-sub {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-sub);
}

.m-card {
  margin: 0 12px 12px;
  padding: 14px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.m-label {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.m-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mt {
  margin-top: 14px;
}

.m-sheet-kicker {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--text-faint);
}

.m-sheet-title {
  margin-top: 4px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--text-main);
}

.m-sheet-meta {
  margin-top: 4px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-sub);
}

.m-topic {
  margin-top: 14px;
}

.m-topic-title {
  display: flex;
  gap: 6px;
  align-items: baseline;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.m-topic-no {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  color: var(--accent);
}

.m-point {
  padding: 8px 10px;
  margin-bottom: 6px;
  background: var(--bg-page);
  border-left: 2px solid transparent;
  border-radius: 0 6px 6px 0;
}

.m-point.priority {
  border-left-color: var(--accent);
}

.m-point-term {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.m-point-flag {
  margin-left: 5px;
  padding: 0 4px;
  font-size: 9.5px;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 3px;
}

.m-point-def {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-main);
}

.m-point-tip {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--warn, #e6a23c);
}

.m-point-src {
  margin-top: 3px;
  font-size: 10px;
  color: var(--text-faint);
}
</style>
