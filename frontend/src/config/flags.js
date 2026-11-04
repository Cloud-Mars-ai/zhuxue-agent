/**
 * 功能开关（Feature Flags）
 *
 * 用途：
 * 1. 新功能默认可按开关灰度，出问题可一键回退；
 * 2. 演示现场可只打开主线功能，避免干扰；
 * 3. 后端/知识库未就绪时，相关能力先关，页面不报错。
 *
 * 本地覆盖：localStorage['ai-tutor-flags'] = {"knowledgeBase": true}
 */

export const FEATURE_FLAGS = {
  // —— S1 立即可得 ——
  selfTest: true, // 章节自测（先测后学）
  cheatsheet: true, // 章节速查表
  dynamicRecommend: true, // 答疑页动态推荐
  clarifyDialog: true, // 生成前选择题澄清
  trace: true, // AI 轨迹埋点
  offlineFallback: true, // 模型失败时使用预生成/本地兜底

  // —— S2 数据资产 ——
  persona: true, // 学习者画像
  checkup: true, // 学习体检 / 盲区诊断
  proactiveFeed: true, // 课程主页主动 Feed
  studyPlan: false, // 学习计划（下一阶段）

  // —— S3 知识地基 ——
  knowledgeBase: true, // 课程资料库与材料注入（教师确认稿已内置）
  citation: false, // 引用标签渲染（S3 后续：chunkId 回填页码）

  // —— S4 学习形态 ——
  deepLearn: false, // 章节学习路径
  boardMode: true, // 结构化板书 + 板书内追问
  socratic: true, // 苏格拉底追问
  tutorEntry: true, // 首页统一助教入口
}

const STORAGE_KEY = 'ai-tutor-flags'

function loadOverrides() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const overrides = loadOverrides()

/** 判断功能是否开启（本地覆盖优先） */
export function isEnabled(name) {
  if (Object.prototype.hasOwnProperty.call(overrides, name)) {
    return !!overrides[name]
  }
  return FEATURE_FLAGS[name] !== false
}

/** 演示用：临时打开/关闭某功能 */
export function setFlag(name, value) {
  overrides[name] = !!value
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  } catch {
    // 无法持久化时仅本次会话生效
  }
}

export default FEATURE_FLAGS
