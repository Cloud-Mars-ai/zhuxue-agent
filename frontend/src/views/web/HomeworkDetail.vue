<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useHomeworkStore } from '@/stores/homework'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const homeworkStore = useHomeworkStore()
const fileInput = ref()
const selectedFile = ref(null)
const uploading = ref(false)
const selectedStudentId = ref('')
const grading = ref({ score: 0, reply: '' })
const savingGrade = ref(false)

const assignmentId = computed(() => route.params.id)
const assignment = computed(() => homeworkStore.findAssignment(assignmentId.value))
const isStudent = computed(() => userStore.role === 'student')
const isMobileRoute = computed(() => route.path.startsWith('/m/'))
const ownSubmission = computed(() =>
  homeworkStore.submissionFor(assignmentId.value, userStore.user?.id),
)
const submittedStudents = computed(() => homeworkStore.submissionsFor(assignmentId.value))
const activeSubmission = computed(
  () =>
    submittedStudents.value.find((item) => item.studentId === selectedStudentId.value) ||
    submittedStudents.value[0] ||
    null,
)

function formatTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
}

function chooseFile() {
  if (fileInput.value) {
    fileInput.value.value = ''
    fileInput.value.click()
  }
}

function onFile(event) {
  selectedFile.value = event.target.files?.[0] || null
}

async function submitAssignment() {
  if (!selectedFile.value) {
    ElMessage.warning('请选择一个本地文件')
    return
  }
  uploading.value = true
  try {
    await homeworkStore.submitFile({
      assignmentId: assignmentId.value,
      student: userStore.user,
      file: selectedFile.value,
    })
    selectedFile.value = null
    ElMessage.success('作业已提交，老师批阅后可在这里查看回复')
  } catch (error) {
    ElMessage.error(error.message || '提交失败')
  } finally {
    uploading.value = false
  }
}

function downloadSubmission(item) {
  if (!item?.fileDataBase64 && !item?.fileData) {
    ElMessage.info('演示数据只保留了文件名，没有真实附件')
    return
  }
  let bytes = item.fileData
  if (item.fileDataBase64) {
    const binary = atob(item.fileDataBase64)
    bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  }
  const blob = new Blob([bytes], { type: item.fileType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = item.fileName
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function syncGrading(item) {
  grading.value = {
    score: item?.score ?? 0,
    reply: item?.teacherReply || '',
  }
}

watch(activeSubmission, syncGrading, { immediate: true })

async function saveGrade() {
  if (!activeSubmission.value) return
  if (!grading.value.reply.trim()) {
    ElMessage.warning('请填写给学生的回复')
    return
  }
  savingGrade.value = true
  try {
    await homeworkStore.grade({
      assignmentId: assignmentId.value,
      studentId: activeSubmission.value.studentId,
      score: grading.value.score,
      reply: grading.value.reply,
      grader: userStore.name,
    })
    ElMessage.success('批阅已保存，学生可以查看回复')
  } catch (error) {
    ElMessage.error(error.message || '保存批阅失败')
  } finally {
    savingGrade.value = false
  }
}

onMounted(async () => {
  await homeworkStore.load()
  if (isStudent.value && ownSubmission.value) {
    selectedStudentId.value = userStore.user?.id || ''
  } else if (submittedStudents.value.length) {
    selectedStudentId.value = submittedStudents.value[0].studentId
  }
})
</script>

<template>
  <div class="detail-page">
    <button class="back-link" type="button" @click="router.push(isMobileRoute ? '/m/homework' : '/app/homework')">
      ← 返回作业列表
    </button>

    <el-empty v-if="!assignment" description="未找到这项作业" />
    <template v-else>
      <header class="detail-head card">
        <div>
          <div class="detail-kicker">ASSIGNMENT · {{ assignment.id }}</div>
          <h1>{{ assignment.title }}</h1>
          <p>{{ assignment.description }}</p>
        </div>
        <div class="detail-meta">
          <span>发布教师：{{ assignment.teacher }}</span>
          <span>截止时间：{{ assignment.deadline }}</span>
          <el-tag v-if="ownSubmission?.status === 'graded'" type="success" effect="plain">
            已批阅 · {{ ownSubmission.score }} 分
          </el-tag>
          <el-tag v-else-if="ownSubmission" type="warning" effect="plain">已提交</el-tag>
        </div>
      </header>

      <div class="detail-grid">
        <section class="card">
          <h2>作业要求</h2>
          <ul class="requirement-list">
            <li v-for="item in assignment.requirements" :key="item">{{ item }}</li>
          </ul>

          <template v-if="isStudent">
            <div class="submit-panel">
              <div class="upload-copy">
                <span class="upload-icon">⇧</span>
                <div>
                  <strong>{{ selectedFile?.name || '选择本地文件提交' }}</strong>
                  <small>支持 PDF、DOCX、PPTX、图片、TXT、ZIP，单文件不超过 20 MB</small>
                </div>
              </div>
              <input
                ref="fileInput"
                class="hidden-input"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp,.zip"
                @change="onFile"
              />
              <div class="upload-actions">
                <el-button @click="chooseFile">选择文件</el-button>
                <el-button type="primary" :loading="uploading" @click="submitAssignment">
                  {{ ownSubmission ? '重新提交' : '提交作业' }}
                </el-button>
              </div>
            </div>

            <div v-if="ownSubmission" class="submission-card">
              <div class="submission-head">
                <div>
                  <strong>我的提交</strong>
                  <span>{{ ownSubmission.fileName }} · {{ formatTime(ownSubmission.submittedAt) }}</span>
                </div>
                <el-button text type="primary" @click="downloadSubmission(ownSubmission)">
                  下载文件
                </el-button>
              </div>
              <div
                v-if="ownSubmission.status === 'graded'"
                class="teacher-reply"
                data-testid="teacher-reply"
              >
                <div>
                  <span>老师回复</span>
                  <strong>{{ ownSubmission.score }} 分</strong>
                </div>
                <p>{{ ownSubmission.teacherReply }}</p>
                <small>{{ ownSubmission.grader }} · {{ formatTime(ownSubmission.gradedAt) }}</small>
              </div>
              <el-alert
                v-else
                type="info"
                :closable="false"
                show-icon
                title="已提交，等待老师批阅。批阅后会在同一位置显示回复。"
              />
            </div>
          </template>

          <template v-else>
            <div class="teacher-submissions">
              <div class="submission-head">
                <strong>学生提交</strong>
                <el-select v-model="selectedStudentId" placeholder="选择学生">
                  <el-option
                    v-for="item in submittedStudents"
                    :key="item.studentId"
                    :label="`${item.studentName} · ${item.fileName}`"
                    :value="item.studentId"
                  />
                </el-select>
              </div>
              <el-empty
                v-if="!activeSubmission"
                description="还没有学生提交这项作业"
                :image-size="64"
              />
              <template v-else>
                <div class="student-file">
                  <div>
                    <strong>{{ activeSubmission.studentName }}</strong>
                    <span>{{ activeSubmission.fileName }} · {{ formatTime(activeSubmission.submittedAt) }}</span>
                  </div>
                  <el-button text type="primary" @click="downloadSubmission(activeSubmission)">
                    下载文件
                  </el-button>
                </div>
                <el-form label-position="top" class="grade-form">
                  <el-form-item label="评分">
                    <el-input-number v-model="grading.score" :min="0" :max="100" />
                  </el-form-item>
                  <el-form-item label="回复学生">
                    <el-input
                      v-model="grading.reply"
                      type="textarea"
                      :rows="5"
                      placeholder="说明完成情况、问题和下一步建议…"
                    />
                  </el-form-item>
                  <el-button type="primary" :loading="savingGrade" @click="saveGrade">
                    保存批阅并发送回复
                  </el-button>
                </el-form>
              </template>
            </div>
          </template>
        </section>

        <aside class="card">
          <h2>提交与评价</h2>
          <div class="timeline">
            <div class="done">
              <span />
              <div>
                <strong>教师发布</strong>
                <small>{{ formatTime(assignment.createdAt) }}</small>
              </div>
            </div>
            <div :class="{ done: ownSubmission || submittedStudents.length }">
              <span />
              <div>
                <strong>学生提交文件</strong>
                <small>{{ ownSubmission ? formatTime(ownSubmission.submittedAt) : '等待提交' }}</small>
              </div>
            </div>
            <div :class="{ done: ownSubmission?.status === 'graded' || activeSubmission?.status === 'graded' }">
              <span />
              <div>
                <strong>教师批阅并回复</strong>
                <small>
                  {{
                    ownSubmission?.status === 'graded'
                      ? formatTime(ownSubmission.gradedAt)
                      : activeSubmission?.status === 'graded'
                        ? formatTime(activeSubmission.gradedAt)
                        : '等待批阅'
                  }}
                </small>
              </div>
            </div>
          </div>
          <p class="side-note">
            文件保存在当前浏览器，供本机演示完整的提交、批阅和回信流程。
          </p>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  width: min(1120px, 100%);
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

.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 16px;
}

.detail-kicker {
  margin-bottom: 7px;
  color: var(--accent);
  font: 9.5px/1.4 var(--font-mono);
  letter-spacing: 1.2px;
}

.detail-head h1 {
  margin: 0 0 8px;
  color: var(--text-main);
  font-size: 25px;
}

.detail-head p {
  margin: 0;
  color: var(--text-sub);
  line-height: 1.8;
}

.detail-meta {
  display: grid;
  flex: none;
  gap: 6px;
  font-size: 11px;
  color: var(--text-sub);
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
}

.detail-grid h2 {
  margin: 0 0 14px;
  color: var(--text-main);
  font-size: 17px;
}

.requirement-list {
  margin: 0;
  padding-left: 20px;
  color: var(--text-sub);
  line-height: 1.9;
}

.submit-panel,
.submission-card,
.teacher-submissions {
  margin-top: 18px;
  padding: 16px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}

.upload-copy,
.upload-actions,
.submission-head,
.student-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.upload-copy {
  justify-content: flex-start;
}

.upload-copy > div {
  display: grid;
  gap: 3px;
}

.submission-head > div {
  display: grid;
  gap: 3px;
}

.upload-copy strong {
  color: var(--text-main);
}

.upload-copy small,
.submission-head span,
.student-file span {
  color: var(--text-sub);
  font-size: 10.5px;
}

.upload-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 20px;
}

.hidden-input {
  display: none;
}

.upload-actions {
  justify-content: flex-end;
  margin-top: 12px;
}

.teacher-reply {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--accent) 25%, var(--card-border));
  border-radius: 12px;
  background: var(--card-bg);
}

.teacher-reply > div {
  display: flex;
  justify-content: space-between;
  color: var(--accent);
}

.teacher-reply p {
  margin: 10px 0;
  color: var(--text-main);
  line-height: 1.8;
}

.teacher-reply small {
  color: var(--text-faint);
}

.teacher-submissions {
  margin-top: 20px;
}

.submission-head :deep(.el-select) {
  width: 260px;
}

.student-file {
  margin: 14px 0;
  padding: 10px;
  border-radius: 10px;
  background: var(--card-bg);
}

.student-file > div {
  display: grid;
  gap: 3px;
}

.grade-form {
  margin-top: 10px;
}

.timeline {
  display: grid;
  gap: 0;
}

.timeline > div {
  position: relative;
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: 9px;
  min-height: 62px;
}

.timeline > div > span {
  position: relative;
  width: 10px;
  height: 10px;
  margin-top: 3px;
  border: 2px solid var(--card-border);
  border-radius: 50%;
  background: var(--card-bg);
}

.timeline > div:not(:last-child) > span::after {
  content: '';
  position: absolute;
  top: 12px;
  left: 3px;
  width: 1px;
  height: 48px;
  background: var(--divider);
}

.timeline > div.done > span {
  border-color: var(--accent);
  background: var(--accent);
}

.timeline > div > div {
  display: grid;
  align-content: start;
  gap: 3px;
}

.timeline strong {
  color: var(--text-main);
  font-size: 12px;
}

.timeline small,
.side-note {
  color: var(--text-sub);
  font-size: 10.5px;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .detail-head,
  .upload-copy,
  .submission-head,
  .student-file {
    flex-direction: column;
    align-items: flex-start;
  }

  .submission-head :deep(.el-select) {
    width: 100%;
  }
}
</style>
