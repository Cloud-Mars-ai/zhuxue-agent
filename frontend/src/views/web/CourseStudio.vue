<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { compileCourseBlueprint } from '@/api/courseStudio'
import BoardCanvas from '@/components/BoardCanvas.vue'
import { isEnabled } from '@/config/flags'
import { useCourseStudioStore } from '@/stores/courseStudio'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useModelStore } from '@/stores/model'
import { useUserStore } from '@/stores/user'
import {
  COURSE_SCENE_LABELS,
  COURSE_SCENE_TYPES,
  reorderCourseOutline,
  summarizeCourseProject,
} from '@/utils/courseStudio'
import { learnerProfileLabel } from '@/utils/learnerProfile'
import { downloadBoardLesson } from '@/utils/boardDownload'
import { repairText } from '@/utils/textRepair'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const modelStore = useModelStore()
const studio = useCourseStudioStore()
const knowledgeStore = useKnowledgeStore()

const draft = reactive({
  chapter: '',
  objective: '',
  audience: '本课程学习者',
  mode: 'course',
  durationMinutes: 30,
  domain: 'general',
})

const projectId = ref('')
const generatingOutline = ref(false)
const generating = ref(false)
const selectedSceneId = ref('')
const showSetup = ref(true)

const project = computed(() =>
  projectId.value ? studio.find(projectId.value) : null,
)
const projectStats = computed(() =>
  project.value ? summarizeCourseProject(project.value) : { sceneCount: 0, totalMinutes: 0 },
)
const pipelineRunning = computed(
  () => generating.value || (projectId.value ? studio.isGenerating(projectId.value) : false),
)
const readyScenes = computed(
  () =>
    project.value?.scenes?.filter((scene) =>
      ['ready', 'fallback'].includes(scene.status),
    ).length || 0,
)
const progressPercent = computed(() => {
  const total = project.value?.outlines?.length || 0
  return total ? Math.round((readyScenes.value / total) * 100) : 0
})
const selectedOutline = computed(
  () =>
    project.value?.outlines?.find((outline) => outline.id === selectedSceneId.value) ||
    project.value?.outlines?.[0] ||
    null,
)
const selectedScene = computed(() => {
  if (!project.value || !selectedOutline.value) return null
  return (
    project.value.scenes.find((scene) => scene.outlineId === selectedOutline.value.id) || null
  )
})
const outlineErrors = computed(() => {
  if (!project.value) return []
  const errors = []
  project.value.outlines.forEach((outline, index) => {
    if (!outline.title?.trim()) errors.push(`第 ${index + 1} 个场景缺少标题`)
    if (!outline.keyPoints?.length) errors.push(`第 ${index + 1} 个场景缺少要点`)
  })
  return errors
})
const canGenerate = computed(
  () =>
    !!project.value &&
    project.value.outlines.length >= 3 &&
    outlineErrors.value.length === 0 &&
    !generatingOutline.value &&
    !pipelineRunning.value,
)
const fallbackReady = computed(() => isEnabled('offlineFallback'))
const GENERATION_CONCURRENCY = 3

function queryValue(value) {
  return Array.isArray(value) ? value[0] : value
}

function syncDraftFromProject(value) {
  if (!value) return
  draft.chapter = value.chapter
  draft.objective = value.objective
  draft.audience = value.audience
  draft.mode = value.mode
  draft.durationMinutes = value.durationMinutes
  draft.domain = value.domain || 'general'
}

onMounted(async () => {
  await Promise.all([studio.load(), knowledgeStore.load()])
  const requested = queryValue(route.query.project)
  const target =
    (requested && studio.find(String(requested))) ||
    studio.latestFor(userStore.user?.id) ||
    null
  if (target) {
    projectId.value = target.id
    syncDraftFromProject(target)
    selectedSceneId.value = target.outlines[0]?.id || ''
    showSetup.value = false
  }
})

async function createOutline() {
  if (draft.objective.trim().length < 6) {
    ElMessage.warning('请先写清这次课程要解决什么学习问题')
    return
  }
  if (!modelStore.isConfigured && !fallbackReady.value) {
    ElMessage.warning('请先配置模型，或开启 offlineFallback')
    return
  }

  generatingOutline.value = true
  try {
    // 输入先净化再生成与存档：PDF 复制来的主题常带乱码，原样入库会在
    // 草稿回显、重新生成时反复出现（净化在 API 入口还有一道，这里双保险）
    const cleanObjective = repairText(draft.objective.trim()).text
    const cleanChapter = repairText(draft.chapter.trim()).text
    const result = await compileCourseBlueprint({
      chapter: cleanChapter,
      objective: cleanObjective,
      audience: draft.audience,
      mode: draft.mode,
      durationMinutes: Number(draft.durationMinutes),
      domain: draft.domain,
      materialIds: knowledgeStore.materials
        .filter((item) => !item.seeded)
        .map((item) => item.id),
    })
    if (result.inputNotice) ElMessage.info(result.inputNotice)
    const saved = await studio.createDraft({
      ownerId: userStore.user?.id || '',
      input: { ...draft, chapter: cleanChapter, objective: cleanObjective },
      result,
    })
    projectId.value = saved.id
    selectedSceneId.value = saved.outlines[0]?.id || ''
    showSetup.value = false
    await router.replace({ query: { ...route.query, project: saved.id } })
    const repairCount = result.repairs?.length || 0
    ElMessage.success(
      result.fallback
        ? '已按用户主题和上传材料在本地生成可编辑大纲'
        : result.repaired
          ? '课程大纲已生成，并自动修复了结构'
          : repairCount
            ? `课程大纲已生成，编译器自动修复 ${repairCount} 处约束问题`
            : '课程大纲已生成，请先审阅',
    )
  } catch (error) {
    ElMessage.error(error.message || '课程大纲生成失败')
  } finally {
    generatingOutline.value = false
  }
}

async function startNewProject() {
  if (pipelineRunning.value) return
  projectId.value = ''
  selectedSceneId.value = ''
  showSetup.value = true
  draft.chapter = ''
  draft.objective = ''
  draft.audience = '本课程学习者'
  draft.mode = 'course'
  draft.durationMinutes = 30
  draft.domain = 'general'
  await router.replace({ query: {} })
}

async function selectProject(value) {
  if (!value || pipelineRunning.value) return
  projectId.value = value.id
  selectedSceneId.value = value.outlines[0]?.id || ''
  showSetup.value = false
  syncDraftFromProject(value)
  await router.replace({ query: { ...route.query, project: value.id } })
}

async function persistOutline() {
  if (!project.value || pipelineRunning.value) return
  await studio.replaceOutline(project.value.id, project.value.outlines)
}

async function updateKeyPoints(outline, value) {
  outline.keyPoints = String(value || '')
    .split(/\n|[；;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5)
  await persistOutline()
}

async function moveScene(index, offset) {
  if (!project.value) return
  const target = index + offset
  if (target < 0 || target >= project.value.outlines.length) return
  const next = reorderCourseOutline(project.value.outlines, index, target)
  await studio.replaceOutline(project.value.id, next)
}

async function removeScene(index) {
  if (!project.value) return
  if (project.value.outlines.length <= 3) {
    ElMessage.warning('至少保留 3 个场景，才能形成完整学习闭环')
    return
  }
  const removed = project.value.outlines[index]
  const next = project.value.outlines
    .filter((_, sceneIndex) => sceneIndex !== index)
    .map((scene, sceneIndex) => ({ ...scene, order: sceneIndex + 1 }))
  await studio.replaceOutline(project.value.id, next)
  if (selectedSceneId.value === removed.id) selectedSceneId.value = next[0]?.id || ''
}

async function addScene() {
  if (!project.value) return
  if (project.value.outlines.length >= 10) {
    ElMessage.warning('最多 10 个场景，避免单次课程过载')
    return
  }
  const index = project.value.outlines.length
  const next = [
    ...project.value.outlines,
    {
      id: `scene_${Date.now().toString(36)}`,
      type: 'lecture',
      title: `补充讲解 ${index + 1}`,
      description: '补充一个需要教师审阅的教学场景。',
      teachingObjective: draft.objective,
      keyPoints: ['待补充概念'],
      estimatedMinutes: 6,
      sourceChunkIds: project.value.sourceChunkIds.slice(0, 3),
      order: index + 1,
    },
  ]
  await studio.replaceOutline(project.value.id, next)
  selectedSceneId.value = next.at(-1).id
}

async function startGeneration() {
  if (!canGenerate.value) {
    ElMessage.warning(outlineErrors.value[0] || '当前大纲还不能生成')
    return
  }
  await persistOutline()
  const id = project.value.id
  generating.value = true
  const runPromise = studio.runGeneration(id, { concurrency: GENERATION_CONCURRENCY })
  try {
    await router.push(`/learn/${id}`)
    void runPromise.catch(() => {
      studio.finishGeneration(id, 'failed')
      ElMessage.error('课程在后台生成时中断，可在体验页继续生成')
    })
  } finally {
    generating.value = false
  }
}

function stopGeneration() {
  if (!project.value) return
  studio.cancelGeneration(project.value.id)
  ElMessage.info('将在当前场景返回后停止')
}

function sceneState(outlineId) {
  return (
    project.value?.scenes?.find((scene) => scene.outlineId === outlineId) || {
      status: 'pending',
      content: null,
    }
  )
}

function statusLabel(status) {
  return (
    {
      pending: '待生成',
      generating: '生成中',
      ready: '已生成',
      fallback: '本地生成',
      error: '需重试',
    }[status] || '待生成'
  )
}

function sourceLabels(ids = []) {
  return ids
    .map((id) => project.value?.sources?.find((source) => source.id === id)?.title)
    .filter(Boolean)
}

async function openInBoard(outline) {
  if (!project.value) return
  const state = sceneState(outline.id)
  if (state.content?.kind !== 'board') {
    ElMessage.info('这个场景不是板书内容')
    return
  }
  await router.push({
    path: '/app/board',
    query: {
      studio: project.value.id,
      scene: outline.id,
      mode: project.value.mode,
    },
  })
}

async function removeProject() {
  if (!project.value) return
  try {
    await ElMessageBox.confirm(
      `确定删除课程「${project.value.title}」吗？课程大纲与已生成内容都会被移除。`,
      '删除课程',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  const id = project.value.id
  await studio.remove(id)
  projectId.value = ''
  selectedSceneId.value = ''
  showSetup.value = true
  await router.replace({ query: {} })
  ElMessage.success('课程已删除')
}

async function exportProject() {
  if (!project.value) return
  const text = JSON.stringify(
    {
      format: 'zhuxue-course-package',
      version: 1,
      generator: project.value.generatorVersion,
      exportedAt: new Date().toISOString(),
      project: project.value,
    },
    null,
    2,
  )
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${project.value.title.replace(/[\\/:*?"<>|]/g, '-')}.course.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  ElMessage.success('课程资源包已导出')
}

function formatTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (number) => String(number).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
</script>

<template>
  <div class="studio-page">
    <section class="studio-hero">
      <div>
        <span class="studio-kicker">COURSE STUDIO · 用户需求优先</span>
        <h1>先生成大纲，确认后再逐场景生成。</h1>
        <p>
          课程主题来自你的输入，学科、范围和学段也由内容与上传材料判断。系统先做教学编排，再由你修改场景、顺序和要点，最后才生成板书、练习与复盘。
        </p>
      </div>
      <div class="hero-actions">
        <el-tag :type="modelStore.isConfigured ? 'success' : 'warning'" effect="plain" round>
          {{ modelStore.isConfigured ? '真实模型已接入' : '确定性演示模式' }}
        </el-tag>
        <el-button plain @click="startNewProject">新建课程</el-button>
        <el-button v-if="project && !showSetup" plain @click="showSetup = true">
          调整生成条件
        </el-button>
        <el-button
          v-if="project"
          type="danger"
          plain
          :disabled="pipelineRunning"
          @click="removeProject"
        >
          删除
        </el-button>
      </div>
    </section>

    <div class="studio-layout">
      <main class="studio-main">
        <section v-if="!project || showSetup" class="studio-card setup-card">
          <header class="card-head">
            <div>
              <span class="step-no">01</span>
              <h2>定义这次课</h2>
              <p>自由目标 + 教师材料 + 场景边界，形成可审阅的大纲。</p>
            </div>
            <span class="mode-note">
              {{ draft.mode === 'sprint' ? '先测后讲' : '框架先行' }}
            </span>
          </header>

          <div class="form-grid">
            <label class="field">
              <span>单元 / 范围（可选）</span>
              <el-input
                v-model="draft.chapter"
                :disabled="pipelineRunning"
                placeholder="例如：Python 基础第 3 单元"
              />
            </label>
            <label class="field">
              <span>目标时长</span>
              <el-select v-model="draft.durationMinutes" :disabled="pipelineRunning">
                <el-option :value="20" label="20 分钟 · 微课" />
                <el-option :value="30" label="30 分钟 · 短课" />
                <el-option :value="45" label="45 分钟 · 完整课时" />
              </el-select>
            </label>
            <label class="field field-wide">
              <span>学习目标</span>
              <el-input
                v-model="draft.objective"
                type="textarea"
                :rows="3"
                resize="none"
                placeholder="例如：学完后能解释 Python 循环，并独立排查常见错误。"
              />
            </label>
            <label class="field">
              <span>学习者（可选）</span>
              <el-input
                v-model="draft.audience"
                placeholder="例如：初一学生；留空则由内容自动判断"
              />
              <small class="field-help">
                学科、范围和年级不预设；明确填写年级会覆盖自动推断。
              </small>
            </label>
            <div class="field">
              <span>学习模式</span>
              <div class="mode-switch">
                <button
                  type="button"
                  :class="{ active: draft.mode === 'course' }"
                  @click="draft.mode = 'course'"
                >
                  正常上课
                </button>
                <button
                  type="button"
                  :class="{ active: draft.mode === 'sprint' }"
                  @click="draft.mode = 'sprint'"
                >
                  考前冲刺
                </button>
              </div>
            </div>
          </div>

          <div class="source-line">
            <span class="source-icon">材</span>
            <div>
              <strong>资料第一</strong>
              <p>
                自动从课程资料库检索教师确认片段；模型只看到 top-k 材料，只允许返回
                chunkId，页码与来源标题由前端回填。
              </p>
            </div>
            <el-tag v-if="project" size="small" effect="plain">
              {{ project.sources.length }} 个来源片段
            </el-tag>
          </div>

          <div class="card-actions">
            <el-button
              type="primary"
              size="large"
              :loading="generatingOutline"
              :disabled="pipelineRunning"
              data-testid="studio-generate-outline"
              @click="createOutline"
            >
              {{ project ? '重新生成课程大纲' : '生成课程大纲' }}
            </el-button>
            <span class="hint">第一阶段只生成结构，不直接写整门课。</span>
          </div>
        </section>

        <section v-if="project" class="studio-card outline-card">
          <header class="card-head">
            <div>
              <span class="step-no">02</span>
              <h2>审阅并调整大纲</h2>
              <p>拖动顺序之外，先把每个场景的教学作用说清楚，再确认生成。</p>
            </div>
            <div class="head-tags">
              <el-tag v-if="project.fallback" type="warning" effect="plain">本地生成大纲</el-tag>
              <el-tooltip
                v-if="project.outlineError"
                :content="project.outlineError"
                placement="bottom"
              >
                <el-tag type="danger" effect="plain">模型未通过校验</el-tag>
              </el-tooltip>
              <el-tag type="info" effect="plain">{{ projectStats.sceneCount }} 个场景</el-tag>
              <el-tag type="info" effect="plain">{{ projectStats.totalMinutes }} 分钟</el-tag>
              <el-tooltip
                v-if="project.learnerProfile"
                :content="
                  project.learnerProfile.evidence ||
                  '根据用户需求与材料难度自动判断'
                "
                placement="bottom"
              >
                <el-tag type="success" effect="plain">
                  {{ learnerProfileLabel(project.learnerProfile) }}
                </el-tag>
              </el-tooltip>
            </div>
          </header>

          <div class="course-title-row">
            <label>
              <span>课程名</span>
              <el-input
                v-model="project.title"
                maxlength="30"
                show-word-limit
                @change="studio.updateProject(project.id, { title: project.title })"
              />
            </label>
            <p>{{ project.summary }}</p>
          </div>

          <div class="outline-list">
            <article
              v-for="(outline, index) in project.outlines"
              :key="outline.id"
              class="outline-row"
              :class="{ selected: selectedSceneId === outline.id }"
              @click="selectedSceneId = outline.id"
            >
              <div class="scene-index">{{ String(index + 1).padStart(2, '0') }}</div>
              <div class="scene-fields">
                <div class="scene-line">
                  <el-input
                    v-model="outline.title"
                    class="scene-title-input"
                    @change="persistOutline"
                  />
                  <el-select
                    v-model="outline.type"
                    class="scene-type"
                    :disabled="pipelineRunning"
                    @change="persistOutline"
                  >
                    <el-option
                      v-for="type in COURSE_SCENE_TYPES"
                      :key="type"
                      :value="type"
                      :label="COURSE_SCENE_LABELS[type]"
                    />
                  </el-select>
                  <el-input-number
                    v-model="outline.estimatedMinutes"
                    :min="3"
                    :max="45"
                    size="small"
                    controls-position="right"
                    @change="persistOutline"
                  />
                </div>
                <el-input
                  v-model="outline.description"
                  type="textarea"
                  :autosize="{ minRows: 1, maxRows: 3 }"
                  class="scene-description"
                  @change="persistOutline"
                />
                <el-input
                  :model-value="outline.keyPoints.join('\n')"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 5 }"
                  class="scene-points"
                  placeholder="每个要点一行，3–5 条"
                  @update:model-value="updateKeyPoints(outline, $event)"
                />
                <div class="scene-meta">
                  <span>{{ outline.teachingObjective }}</span>
                  <span v-if="sourceLabels(outline.sourceChunkIds).length" class="source-ref">
                    来源：{{ sourceLabels(outline.sourceChunkIds).join(' · ') }}
                  </span>
                </div>
              </div>
              <div class="scene-tools" @click.stop>
                <el-button text :disabled="index === 0 || pipelineRunning" @click="moveScene(index, -1)">
                  ↑
                </el-button>
                <el-button
                  text
                  :disabled="index === project.outlines.length - 1 || pipelineRunning"
                  @click="moveScene(index, 1)"
                >
                  ↓
                </el-button>
                <el-button text type="danger" :disabled="pipelineRunning" @click="removeScene(index)">
                  ×
                </el-button>
              </div>
            </article>
          </div>

          <div class="outline-footer">
            <div>
              <el-button plain :disabled="pipelineRunning" @click="addScene">+ 添加场景</el-button>
              <p v-if="outlineErrors.length" class="error-line">{{ outlineErrors[0] }}</p>
              <p v-else class="hint">
                场景通过校验，将使用最多 3 路并发逐场景生成；每完成一幕立即保存。
              </p>
            </div>
            <div class="generate-actions">
              <el-button v-if="pipelineRunning" type="warning" plain @click="stopGeneration">
                当前场景后停止
              </el-button>
              <el-button
                type="primary"
                size="large"
                :loading="pipelineRunning"
                :disabled="!canGenerate"
                data-testid="studio-generate-course"
                @click="startGeneration"
              >
                确认大纲并生成课程
              </el-button>
            </div>
          </div>
        </section>
      </main>

      <aside class="studio-aside">
        <section class="studio-card pipeline-card">
          <span class="aside-kicker">GENERATION PIPELINE</span>
          <h3>四道质量门</h3>
          <ol>
            <li :class="{ done: !!project }"><span>1</span>资料检索与上下文限额</li>
            <li :class="{ done: !!project }"><span>2</span>结构化大纲 + 本地校验</li>
            <li :class="{ done: readyScenes > 0 }"><span>3</span>逐场景生成 + 结构修复</li>
            <li :class="{ done: project?.status === 'ready' }"><span>4</span>资源包审阅与导出</li>
          </ol>
          <div class="pipeline-note">
            模型调用失败时，系统会按用户主题与已上传材料在本地生成，并在对应场景标明“本地生成”。
          </div>
        </section>

        <section class="studio-card projects-card">
          <div class="aside-head">
            <h3>最近课程</h3>
            <span>{{ studio.projects.length }}</span>
          </div>
          <button
            v-for="item in studio.projects.slice(0, 5)"
            :key="item.id"
            type="button"
            class="project-link"
            :class="{ active: item.id === projectId }"
            @click="selectProject(item)"
          >
            <span>
              <strong>{{ item.title }}</strong>
              <small>{{ item.chapter }} · {{ item.outlines.length }} 场 · {{ formatTime(item.updatedAt) }}</small>
            </span>
            <em v-if="item.demo" class="demo-badge">演示</em>
            <em v-else>{{ item.status === 'ready' ? '完成' : item.status === 'generating' ? '生成中' : '大纲' }}</em>
          </button>
          <p v-if="!studio.projects.length" class="empty-note">还没有课程，先生成第一份大纲。</p>
        </section>
      </aside>
    </div>

    <section v-if="project && project.scenes.some((scene) => scene.status !== 'pending')" class="studio-card result-card">
      <header class="result-head">
        <div>
          <span class="step-no">03</span>
          <h2>课程资源包</h2>
          <p>{{ project.title }} · {{ readyScenes }} / {{ project.outlines.length }} 个场景已生成</p>
        </div>
        <div class="result-actions">
          <el-button
            v-if="project.status === 'failed' || project.status === 'outline'"
            type="primary"
            plain
            :disabled="pipelineRunning"
            @click="startGeneration"
          >
            继续生成
          </el-button>
          <el-button plain :disabled="pipelineRunning" @click="exportProject">导出课程包</el-button>
        </div>
      </header>

      <div class="progress-line">
        <span :style="{ width: `${progressPercent}%` }" />
      </div>

      <div class="result-layout">
        <nav class="scene-nav">
          <button
            v-for="(outline, index) in project.outlines"
            :key="outline.id"
            type="button"
            :class="{
              active: selectedSceneId === outline.id,
              fallback: sceneState(outline.id).status === 'fallback',
              failed: sceneState(outline.id).status === 'error',
            }"
            @click="selectedSceneId = outline.id"
          >
            <span>{{ index + 1 }}</span>
            <div>
              <strong>{{ outline.title }}</strong>
              <small>{{ COURSE_SCENE_LABELS[outline.type] }}</small>
            </div>
            <em>{{ statusLabel(sceneState(outline.id).status) }}</em>
          </button>
        </nav>

        <div class="scene-preview">
          <div v-if="!selectedScene || selectedScene.status === 'pending'" class="preview-empty">
            <span>待生成</span>
            <h3>{{ selectedOutline?.title }}</h3>
            <p>确认大纲后，这里会出现板书、练习或案例题。</p>
          </div>
          <div v-else-if="selectedScene.status === 'generating'" class="preview-empty">
            <el-icon class="is-loading"><Loading /></el-icon>
            <h3>正在生成「{{ selectedOutline?.title }}」</h3>
            <p>先做结构校验；失败时会自动修复一次，再使用确定性兜底。</p>
          </div>
          <div v-else-if="selectedScene.status === 'error'" class="preview-empty error">
            <span>生成中断</span>
            <h3>{{ selectedOutline?.title }}</h3>
            <p>{{ selectedScene.error }}</p>
          </div>
          <template v-else-if="selectedScene.content">
            <div class="preview-toolbar">
              <div>
                <span>{{ COURSE_SCENE_LABELS[selectedOutline.type] }}</span>
                <strong>{{ selectedOutline.title }}</strong>
              </div>
              <div>
                <el-tag
                  v-if="selectedScene.status === 'fallback'"
                  type="warning"
                  effect="plain"
                  size="small"
                >
                  本地生成
                </el-tag>
                <el-tag
                  v-if="selectedScene.repaired"
                  type="info"
                  effect="plain"
                  size="small"
                >
                  结构已修复
                </el-tag>
                <el-button
                  v-if="selectedScene.content.kind === 'board'"
                  type="primary"
                  plain
                  size="small"
                  @click="openInBoard(selectedOutline)"
                >
                  进入板书学习
                </el-button>
                <el-button
                  v-if="selectedScene.content.kind === 'board'"
                  plain
                  size="small"
                  @click="downloadBoardLesson(selectedScene.content.lesson)"
                >
                  下载板书
                </el-button>
              </div>
            </div>

            <BoardCanvas
              v-if="selectedScene.content.kind === 'board'"
              :lesson="selectedScene.content.lesson"
              :visible-count="999"
              :interactive="false"
            />

            <div v-else-if="selectedScene.content.kind === 'quiz'" class="quiz-preview">
              <article
                v-for="(question, index) in selectedScene.content.questions"
                :key="question.id"
                class="quiz-question"
              >
                <span class="question-no">Q{{ index + 1 }}</span>
                <h3>{{ question.stem }}</h3>
                <div class="quiz-options">
                  <div
                    v-for="(option, optionIndex) in question.options"
                    :key="option"
                    :class="{ correct: optionIndex === question.answerIndex }"
                  >
                    <span>{{ String.fromCharCode(65 + optionIndex) }}</span>
                    {{ option }}
                  </div>
                </div>
                <p v-if="question.explanation">{{ question.explanation }}</p>
              </article>
            </div>

            <div v-else-if="selectedScene.content.kind === 'practice'" class="practice-preview">
              <span class="practice-label">案例应用</span>
              <h3>{{ selectedScene.content.prompt }}</h3>
              <div class="practice-grid">
                <section>
                  <span>参考判断要点</span>
                  <ol>
                    <li v-for="point in selectedScene.content.referencePoints" :key="point">
                      {{ point }}
                    </li>
                  </ol>
                </section>
                <section>
                  <span>评价量规</span>
                  <div
                    v-for="item in selectedScene.content.rubric"
                    :key="item.criterion"
                    class="rubric-row"
                  >
                    <p>{{ item.criterion }}</p>
                    <strong>{{ item.weight }}%</strong>
                  </div>
                </section>
              </div>
              <blockquote v-if="selectedScene.content.followUp">
                {{ selectedScene.content.followUp }}
              </blockquote>
            </div>

            <div class="source-strip">
              <span>本场景依据</span>
              <strong>
                {{ sourceLabels(selectedScene.content.sourceChunkIds).join(' · ') || '教师确认课程纲要' }}
              </strong>
            </div>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.studio-page {
  max-width: 1480px;
  margin: 0 auto;
  padding-bottom: 28px;
}

.studio-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 18px;
  padding: 6px 2px 2px;
}

.studio-kicker,
.aside-kicker {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.studio-hero h1 {
  max-width: 760px;
  margin: 8px 0 8px;
  color: var(--text-main);
  font-family: var(--font-title);
  font-size: clamp(26px, 3vw, 42px);
  line-height: 1.12;
  letter-spacing: var(--title-tracking);
}

.studio-hero p {
  max-width: 820px;
  margin: 0;
  color: var(--text-sub);
  font-size: 13px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.studio-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 290px;
  align-items: start;
  gap: 14px;
}

.studio-main {
  min-width: 0;
}

.studio-card {
  padding: 18px;
  margin-bottom: 14px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.card-head,
.result-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.card-head > div:first-child {
  position: relative;
  padding-left: 46px;
}

.step-no {
  position: absolute;
  top: 1px;
  left: 0;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
}

.card-head h2,
.result-head h2 {
  margin: 0;
  color: var(--text-main);
  font-family: var(--font-title);
  font-size: 19px;
}

.card-head p,
.result-head p {
  margin: 4px 0 0;
  color: var(--text-sub);
  font-size: 12px;
  line-height: 1.65;
}

.mode-note {
  flex: none;
  padding: 5px 9px;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: var(--radius-pill);
  font-size: 10px;
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field-wide {
  grid-column: 1 / -1;
}

.field > span,
.course-title-row label > span,
.practice-label {
  color: var(--text-sub);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.field-help {
  color: var(--text-faint);
  font-size: 10px;
  line-height: 1.55;
}

.mode-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 3px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--btn-radius);
}

.mode-switch button {
  padding: 7px 9px;
  color: var(--text-sub);
  background: transparent;
  border: 0;
  border-radius: calc(var(--btn-radius) - 2px);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.mode-switch button.active {
  color: var(--accent);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  font-weight: 700;
}

.source-line {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 11px 13px;
  background: var(--surface-2);
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
}

.source-icon {
  flex: none;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
}

.source-line div {
  min-width: 0;
  flex: 1;
}

.source-line strong {
  color: var(--text-main);
  font-size: 11px;
}

.source-line p {
  margin: 2px 0 0;
  color: var(--text-faint);
  font-size: 10.5px;
  line-height: 1.55;
}

.card-actions,
.outline-footer,
.result-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 15px;
}

.hint {
  color: var(--text-faint);
  font-size: 10.5px;
}

.error-line {
  margin: 7px 0 0;
  color: var(--danger);
  font-size: 11px;
}

.head-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.course-title-row {
  display: grid;
  grid-template-columns: minmax(220px, 0.45fr) minmax(0, 1fr);
  align-items: end;
  gap: 16px;
  padding: 12px 0 15px;
  border-top: 1px solid var(--divider);
  border-bottom: 1px solid var(--divider);
}

.course-title-row label {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.course-title-row p {
  margin: 0;
  color: var(--text-faint);
  font-size: 11px;
  line-height: 1.65;
}

.outline-list {
  display: grid;
  gap: 9px;
  margin-top: 13px;
}

.outline-row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 40px;
  gap: 11px;
  padding: 12px;
  background: var(--surface-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  transition:
    border-color 0.16s ease,
    background 0.16s ease;
}

.outline-row.selected {
  background: color-mix(in srgb, var(--accent-soft) 38%, var(--card-bg));
  border-color: color-mix(in srgb, var(--accent) 32%, var(--card-border));
}

.scene-index {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  color: var(--text-sub);
  background: var(--card-bg);
  border: 1px solid var(--divider);
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 10px;
}

.scene-fields {
  min-width: 0;
}

.scene-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px 108px;
  gap: 8px;
}

.scene-title-input :deep(.el-input__inner) {
  font-weight: 700;
}

.scene-description,
.scene-points {
  margin-top: 7px;
}

.scene-points :deep(.el-textarea__inner) {
  color: var(--text-sub);
  font-size: 11px;
  line-height: 1.6;
}

.scene-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 7px;
  color: var(--text-faint);
  font-size: 9.5px;
  line-height: 1.55;
}

.scene-meta > span:first-child {
  max-width: 64%;
}

.source-ref {
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-tools {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.scene-tools :deep(.el-button) {
  width: 30px;
  min-height: 25px;
  margin: 0;
  padding: 0;
}

.generate-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.studio-aside {
  min-width: 0;
}

.pipeline-card h3,
.projects-card h3 {
  margin: 5px 0 14px;
  color: var(--text-main);
  font-family: var(--font-title);
  font-size: 17px;
}

.pipeline-card ol {
  display: grid;
  gap: 13px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pipeline-card li {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text-faint);
  font-size: 11px;
}

.pipeline-card li > span {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border: 1px solid var(--divider);
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 9px;
}

.pipeline-card li.done {
  color: var(--text-main);
}

.pipeline-card li.done > span {
  color: var(--accent-on);
  background: var(--accent);
  border-color: var(--accent);
}

.pipeline-note {
  margin-top: 16px;
  padding-top: 13px;
  color: var(--text-faint);
  border-top: 1px dashed var(--divider);
  font-size: 10px;
  line-height: 1.65;
}

.aside-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.aside-head span {
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 10px;
}

.project-link {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 8px;
  color: inherit;
  background: transparent;
  border: 0;
  border-top: 1px solid var(--divider);
  text-align: left;
  cursor: pointer;
}

.project-link:first-of-type {
  border-top: 0;
}

.project-link.active {
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: var(--radius-sm);
}

.project-link > span {
  min-width: 0;
}

.project-link strong,
.project-link small {
  display: block;
}

.project-link strong {
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-link small {
  margin-top: 3px;
  color: var(--text-faint);
  font-size: 9px;
}

.project-link em {
  flex: none;
  color: var(--text-faint);
  font-size: 9px;
  font-style: normal;
}

.project-link em.demo-badge {
  padding: 1px 7px;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: var(--radius-pill);
  font-weight: 700;
}

.empty-note {
  color: var(--text-faint);
  font-size: 10.5px;
  line-height: 1.6;
}

.result-card {
  margin-top: 2px;
}

.result-head > div:first-child {
  position: relative;
  padding-left: 46px;
}

.progress-line {
  height: 4px;
  overflow: hidden;
  margin-bottom: 14px;
  background: var(--surface-3);
  border-radius: var(--radius-pill);
}

.progress-line span {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: inherit;
  transition: width 0.3s ease;
}

.result-layout {
  display: grid;
  grid-template-columns: 265px minmax(0, 1fr);
  align-items: start;
  gap: 14px;
}

.scene-nav {
  display: grid;
  gap: 6px;
}

.scene-nav button {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 9px;
  color: inherit;
  background: var(--surface-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  text-align: left;
  cursor: pointer;
}

.scene-nav button.active {
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 32%, var(--card-border));
}

.scene-nav button.fallback {
  border-style: dashed;
}

.scene-nav button.failed {
  border-color: var(--danger);
}

.scene-nav button > span {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  color: var(--text-sub);
  background: var(--card-bg);
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 9px;
}

.scene-nav strong,
.scene-nav small {
  display: block;
}

.scene-nav strong {
  overflow: hidden;
  color: var(--text-main);
  font-size: 10.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-nav small {
  margin-top: 2px;
  color: var(--text-faint);
  font-size: 8.5px;
}

.scene-nav em {
  color: var(--text-faint);
  font-size: 8.5px;
  font-style: normal;
}

.scene-preview {
  min-width: 0;
  min-height: 440px;
  padding: 12px;
  background: var(--surface-2);
  border-radius: var(--radius-md);
}

.preview-empty {
  min-height: 410px;
  display: grid;
  align-content: center;
  justify-items: center;
  padding: 30px;
  text-align: center;
}

.preview-empty > span {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
}

.preview-empty h3 {
  margin: 8px 0 4px;
  color: var(--text-main);
  font-family: var(--font-title);
  font-size: 20px;
}

.preview-empty p {
  max-width: 440px;
  margin: 0;
  color: var(--text-faint);
  font-size: 11px;
  line-height: 1.7;
}

.preview-empty.error h3 {
  color: var(--danger);
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.preview-toolbar > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-toolbar span {
  color: var(--text-faint);
  font-size: 9px;
}

.preview-toolbar strong {
  color: var(--text-main);
  font-size: 11px;
}

.scene-preview :deep(.board-canvas) {
  min-height: 470px;
  box-shadow: none;
}

.quiz-preview {
  display: grid;
  gap: 12px;
}

.quiz-question {
  padding: 18px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
}

.question-no {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
}

.quiz-question h3 {
  margin: 7px 0 14px;
  color: var(--text-main);
  font-family: var(--font-title);
  font-size: 17px;
  line-height: 1.5;
}

.quiz-options {
  display: grid;
  gap: 7px;
}

.quiz-options div {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 9px 11px;
  color: var(--text-sub);
  background: var(--surface-2);
  border: 1px solid var(--divider);
  border-radius: var(--radius-sm);
  font-size: 11px;
  line-height: 1.55;
}

.quiz-options div.correct {
  color: var(--ok);
  background: var(--ok-soft);
  border-color: color-mix(in srgb, var(--ok) 30%, var(--border));
}

.quiz-options div span {
  flex: none;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  background: var(--card-bg);
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 9px;
}

.quiz-question > p {
  margin: 13px 0 0;
  padding-top: 11px;
  color: var(--text-faint);
  border-top: 1px dashed var(--divider);
  font-size: 10.5px;
  line-height: 1.65;
}

.practice-preview {
  padding: 24px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
}

.practice-preview h3 {
  max-width: 900px;
  margin: 9px 0 22px;
  color: var(--text-main);
  font-family: var(--font-title);
  font-size: clamp(18px, 2.2vw, 25px);
  line-height: 1.65;
}

.practice-grid {
  display: grid;
  grid-template-columns: 1.35fr 0.65fr;
  gap: 18px;
}

.practice-grid section > span {
  color: var(--text-faint);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.practice-grid ol {
  margin: 10px 0 0;
  padding-left: 18px;
  color: var(--text-sub);
  font-size: 11px;
  line-height: 1.8;
}

.rubric-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px dashed var(--divider);
}

.rubric-row p {
  margin: 0;
  color: var(--text-sub);
  font-size: 10.5px;
}

.rubric-row strong {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 10px;
}

.practice-preview blockquote {
  margin: 22px 0 0;
  padding: 12px 14px;
  color: var(--accent);
  background: var(--accent-soft);
  border-left: 3px solid var(--accent);
  font-size: 11px;
  line-height: 1.7;
}

.source-strip {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 10px;
  color: var(--text-faint);
  background: var(--card-bg);
  border-radius: var(--radius-sm);
  font-size: 9.5px;
  line-height: 1.55;
}

.source-strip strong {
  color: var(--text-sub);
  font-weight: 500;
}

@media (max-width: 1180px) {
  .studio-layout {
    grid-template-columns: 1fr;
  }

  .studio-aside {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
}

@media (max-width: 780px) {
  .studio-hero,
  .card-head,
  .result-head,
  .preview-toolbar,
  .outline-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .studio-hero h1 {
    font-size: 27px;
  }

  .hero-actions,
  .result-actions {
    justify-content: flex-start;
  }

  .studio-aside,
  .form-grid,
  .course-title-row,
  .result-layout,
  .practice-grid {
    grid-template-columns: 1fr;
  }

  .field-wide {
    grid-column: auto;
  }

  .outline-row {
    grid-template-columns: 30px minmax(0, 1fr);
  }

  .scene-tools {
    grid-column: 2;
    flex-direction: row;
    justify-content: flex-end;
  }

  .scene-line {
    grid-template-columns: 1fr;
  }

  .scene-meta {
    flex-direction: column;
    gap: 4px;
  }

  .scene-meta > span:first-child {
    max-width: none;
  }

  .scene-nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .scene-preview {
    padding: 7px;
  }

  .result-card {
    padding: 13px;
  }
}
</style>
