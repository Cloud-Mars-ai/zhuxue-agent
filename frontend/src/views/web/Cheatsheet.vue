<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { COURSE } from '@/mock/data'
import { getOutlineChapters, outlineToText } from '@/mock/courseOutline'
import { useUserStore } from '@/stores/user'
import { useModelStore } from '@/stores/model'
import { useCheatsheetStore } from '@/stores/cheatsheets'
import { generateCheatsheet } from '@/api/aiTasks'
import { cheatsheetToText } from '@/utils/cheatsheet'
import ClarifyDialog from '@/components/web/ClarifyDialog.vue'

const route = useRoute()
const userStore = useUserStore()
const modelStore = useModelStore()
const sheetStore = useCheatsheetStore()

const chapterOptions = COURSE.chapters.map((c) => c.title)
const selectedChapters = ref([COURSE.chapters[2]?.title || chapterOptions[0]])
const layout = ref('screen')
const focus = ref('概念辨析')
const generating = ref(false)
const sheet = ref(null)
const fallbackUsed = ref(false)

const clarifyOpen = ref(false)
const clarifyQuestions = [
  {
    id: 'usage',
    label: '这份速查表主要用来做什么？',
    default: 'screen',
    options: [
      { label: '考前快速过一遍', value: 'screen' },
      { label: '打印带进考场', value: 'print' },
      { label: '系统复习整章', value: 'screen' },
    ],
  },
  {
    id: 'focus',
    label: '你最担心哪类题？',
    default: '概念辨析',
    options: [
      { label: '概念辨析', value: '概念辨析' },
      { label: '案例分析', value: '案例分析' },
      { label: '模型与要素', value: '模型与要素' },
    ],
  },
]

const isConfigured = computed(() => modelStore.isConfigured)
const totalPoints = computed(() =>
  (sheet.value?.topics || []).reduce((n, t) => n + t.points.length, 0),
)
const sheetDate = computed(() => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
})

onMounted(() => {
  const q = route.query.chapters
  if (q) {
    const list = String(q)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const matched = list
      .map((s) => chapterOptions.find((c) => c === s || c.includes(s)))
      .filter(Boolean)
    if (matched.length) selectedChapters.value = matched
  }
  // 有历史记录时直接展示最近一份
  const last = sheetStore.latest(userStore.user?.id)
  if (last) sheet.value = last
})

function toggleChapter(ch) {
  const i = selectedChapters.value.indexOf(ch)
  if (i >= 0) {
    if (selectedChapters.value.length === 1) {
      ElMessage.warning('至少保留一个章节')
      return
    }
    selectedChapters.value.splice(i, 1)
  } else {
    selectedChapters.value.push(ch)
  }
}

function openGenerate() {
  if (!isConfigured.value) {
    ElMessage.warning('请先到「模型接入」页面完成配置')
    return
  }
  clarifyOpen.value = true
}

async function generate(answers = {}) {
  if (answers.usage) layout.value = answers.usage
  if (answers.focus) focus.value = answers.focus
  generating.value = true
  try {
    const res = await generateCheatsheet({
      chapters: selectedChapters.value,
      outlineText: outlineToText(getOutlineChapters(selectedChapters.value)),
      layout: layout.value,
      focus: focus.value,
    })
    fallbackUsed.value = res.fallback
    sheet.value = sheetStore.save({
      studentId: userStore.user?.id,
      chapters: [...selectedChapters.value],
      topics: res.topics,
      layout: layout.value,
      fallback: res.fallback,
    })
    ElMessage.success(res.fallback ? '已生成（演示缓存版）' : '速查表已生成')
  } catch (err) {
    ElMessage.error(err.message || '生成失败，请重试')
  } finally {
    generating.value = false
  }
}

function printSheet() {
  window.print()
}

async function copyText() {
  if (!sheet.value) return
  const text = `${COURSE.name} · 备考速查表（${sheetDate.value}）\n\n${cheatsheetToText(
    sheet.value.topics,
  )}`
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制，可粘贴到笔记软件')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    ElMessage.success('已复制')
  }
}
</script>

<template>
  <div class="cheatsheet-page">
    <div class="page-head no-print">
      <div>
        <h3 class="page-title">备考速查表</h3>
        <p class="page-desc">
          按主题重组，不按章节顺序——因为考试按主题考。每条都标了来源章节，方便回查。
        </p>
      </div>
      <el-tag v-if="fallbackUsed || sheet?.fallback" type="warning" effect="plain">
        含演示缓存内容
      </el-tag>
    </div>

    <div class="card setup-card no-print">
      <div class="setup-block">
        <div class="setup-label">选择章节</div>
        <div class="chip-wrap">
          <span
            v-for="c in chapterOptions"
            :key="c"
            class="pick-chip"
            :class="{ on: selectedChapters.includes(c) }"
            @click="toggleChapter(c)"
          >
            {{ c }}
          </span>
        </div>
      </div>

      <div class="setup-row">
        <div class="setup-label">排版</div>
        <el-radio-group v-model="layout">
          <el-radio-button value="screen">屏幕阅读版</el-radio-button>
          <el-radio-button value="print">打印压缩版</el-radio-button>
        </el-radio-group>
        <el-button type="primary" :loading="generating" @click="openGenerate">
          {{ sheet ? '重新生成' : '生成速查表' }}
        </el-button>
        <span class="hint">约 30–90 秒，按章节分批生成后按主题合并</span>
      </div>
    </div>

    <div v-if="generating" class="card gen-card no-print">
      <el-icon class="is-loading gen-icon"><Loading /></el-icon>
      <div class="gen-title">正在整理主题与考点</div>
      <p class="page-desc">先分章提取，再按管理职能重组，避免一条条按教材顺序抄。</p>
    </div>

    <div v-if="sheet" class="sheet" :class="`is-${sheet.layout}`">
      <div class="sheet-head">
        <div class="sheet-kicker">《管理学》 · 备考专栏</div>
        <h1 class="sheet-title">考前速查表</h1>
        <div class="sheet-meta">
          <span>{{ sheet.chapters.join(' · ') }}</span>
          <span>{{ sheetDate }}</span>
          <span>共 {{ totalPoints }} 条</span>
        </div>
      </div>

      <div class="topics">
        <section v-for="(topic, ti) in sheet.topics" :key="topic.name" class="topic">
          <h2 class="topic-title">
            <span class="topic-no">{{ String(ti + 1).padStart(2, '0') }}</span>
            {{ topic.name }}
          </h2>
          <div
            v-for="(p, pi) in topic.points"
            :key="`${topic.name}-${pi}`"
            class="point"
            :class="{ priority: p.priority }"
          >
            <div class="point-term">
              {{ p.term }}
              <span v-if="p.priority" class="point-flag">重点</span>
            </div>
            <div class="point-def">{{ p.definition }}</div>
            <div v-if="p.examTip" class="point-tip">考点：{{ p.examTip }}</div>
            <div v-if="p.source" class="point-source">{{ p.source }}</div>
          </div>
        </section>
      </div>

      <div class="sheet-foot">
        <span>依据课程纲要整理，未覆盖的内容不会编造。</span>
        <span>AI 生成，仅供复习参考；以教师课件与课堂讲授为准。</span>
      </div>
    </div>

    <div v-if="sheet" class="actions no-print">
      <el-button type="primary" plain @click="printSheet">打印 / 导出 PDF</el-button>
      <el-button plain @click="copyText">复制全文</el-button>
      <span class="hint">
        打印版建议 A4 双面；浏览器打印设置里关闭「页眉页脚」效果更好。
      </span>
    </div>

    <ClarifyDialog
      v-model="clarifyOpen"
      title="先确认用途，再决定怎么排"
      description="两个问题，帮我把这份速查表做成你真正会用的样子。"
      :questions="clarifyQuestions"
      confirm-text="生成速查表"
      @confirm="generate"
    />
  </div>
</template>

<style scoped>
.cheatsheet-page {
  padding-bottom: 20px;
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

.card {
  padding: 16px;
  margin-bottom: 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.setup-block {
  margin-bottom: 12px;
}

.setup-label {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--text-sub);
}

.setup-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.setup-row .setup-label {
  margin-bottom: 0;
}

.chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pick-chip {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--text-sub);
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pick-chip.on {
  color: var(--accent-on);
  background: var(--accent);
  border-color: var(--accent);
}

.hint {
  font-size: 12px;
  color: var(--text-sub);
}

.gen-card {
  text-align: center;
  padding: 28px 16px;
}

.gen-icon {
  font-size: 26px;
  color: var(--accent);
}

.gen-title {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

/* —— 速查表主体：屏幕版 —— */
.sheet {
  padding: 24px 26px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.sheet-head {
  padding-bottom: 14px;
  border-bottom: 2px solid var(--text-main);
  margin-bottom: 18px;
}

.sheet-kicker {
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--text-faint);
  font-family: var(--font-mono, monospace);
}

.sheet-title {
  margin: 6px 0 8px;
  font-size: 26px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: 2px;
}

.sheet-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 11px;
  color: var(--text-sub);
}

.topics {
  display: grid;
  gap: 18px;
}

.topic-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--border);
}

.topic-no {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--accent);
}

.point {
  padding: 8px 10px;
  margin-bottom: 6px;
  border-left: 2px solid transparent;
  background: var(--bg-page);
  border-radius: 0 6px 6px 0;
}

.point.priority {
  border-left-color: var(--accent);
}

.point-term {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.point-flag {
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 500;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 3px;
}

.point-def {
  margin-top: 3px;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--text-main);
}

.point-tip {
  margin-top: 3px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--warn, #e6a23c);
}

.point-source {
  margin-top: 3px;
  font-size: 10.5px;
  color: var(--text-faint);
}

.sheet-foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
  font-size: 10.5px;
  color: var(--text-faint);
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
}
</style>

<style>
/* 打印：强制白底黑字，两栏排版，A4 两页内 */
@media print {
  body,
  .main,
  .web-layout,
  .card,
  .sheet {
    background: #fff !important;
    color: #000 !important;
    box-shadow: none !important;
  }

  .aside,
  .header,
  .no-print,
  .van-nav-bar,
  .van-tabbar {
    display: none !important;
  }

  .main {
    padding: 0 !important;
    overflow: visible !important;
  }

  .cheatsheet-page {
    padding: 0 !important;
  }

  .sheet {
    border: none !important;
    padding: 0 !important;
    border-radius: 0 !important;
  }

  .sheet-title {
    color: #000 !important;
    font-size: 22pt !important;
  }

  .sheet-kicker,
  .sheet-meta,
  .point-source,
  .sheet-foot,
  .topic-no {
    color: #444 !important;
  }

  .sheet-head {
    border-bottom: 1.5pt solid #000 !important;
    margin-bottom: 8pt !important;
    padding-bottom: 6pt !important;
  }

  .topics {
    display: block !important;
    column-count: 2;
    column-gap: 14pt;
  }

  .topic {
    break-inside: avoid;
    margin-bottom: 10pt;
  }

  .topic-title {
    color: #000 !important;
    font-size: 10.5pt !important;
    border-bottom: 0.5pt dashed #999 !important;
    margin-bottom: 4pt !important;
  }

  .point {
    background: transparent !important;
    padding: 2pt 0 2pt 5pt !important;
    margin-bottom: 3pt !important;
    break-inside: avoid;
    border-left: 2pt solid #bbb !important;
  }

  .point.priority {
    border-left: 2pt solid #000 !important;
  }

  .point-term {
    font-size: 9.5pt !important;
    color: #000 !important;
  }

  .point-def {
    font-size: 8.5pt !important;
    line-height: 1.45 !important;
    color: #111 !important;
  }

  .point-tip {
    font-size: 8pt !important;
    color: #333 !important;
  }

  .point-flag {
    color: #000 !important;
    border-color: #000 !important;
    font-size: 7.5pt !important;
  }

  @page {
    size: A4;
    margin: 12mm;
  }
}
</style>
