/**
 * 内置 SVG 场景库注册表（2026-11-08，诊断二「真实图片」的确定性修复；
 * 2026-11-09 学科画像扩展：新增 domains 域标签与 4 个学科场景）。
 *
 * 背景：OpenMAIC 上游用 LLM 写 prompt + 文生图 provider（Seedream / GPT Image /
 * Qwen / Gemini Nano Banana 等 10 个）生成真实照片；本项目禁外链图片/禁自由
 * HTML，且不接文生图后端，媒体通道四层主动关闭，导致 OpenMAIC 画布上的
 * image 元素全部丢弃（dropped.media 计数）。
 *
 * 修复策略（与「AI 只填 JSON」铁律一致）：
 * - 场景库是**手工绘制的确定性 SVG**（见 components/illustrations/），
 *   无外部请求、无加载失败、无叉号占位符——占位符问题的根因就是
 *   异步图片资源，内置 SVG 从机制上不可能出现；
 * - AI 只能**选场景 id**（本注册表白名单），不能 invent URL / prompt；
 * - OpenMAIC 画布 image 元素经 matchIllustrationScene 关键词对齐到场景，
 *   对齐不了仍然丢弃计数（保持可观测）；
 * - 好处：跨设备一致、离线可用、体积极小、风格与纸感板书统一。
 *
 * domains 域标签（2026-11-09 学科画像，utils/pedagogyProfiles.js）：
 * - 空数组 = 通用资源（任何学科域都可用，如「增长曲线」「天平权衡」）；
 * - 非空 = 仅声明域可用（如「平方根面积模型」只服务数理科学），
 *   匹配侧用 resourceAllowedForDomain 过滤，防止文科课配数学图示。
 *
 * 硬规则：本文件只允许纯数据与纯函数（node 测试脚本直接 import）。
 */

import { filterByPedagogy } from './pedagogyProfiles.js'

export const ILLUSTRATION_SCENES = [
  {
    id: 'rocket-launch',
    label: '火箭发射',
    hint: '课程导入、愿景目标、从 0 到 1 的启动',
    keywords: /火箭|发射|升空|启航|点火|腾空|探索|梦想|愿景|起步/g,
    domains: [], // 通用：导入/愿景母题跨学科成立
  },
  {
    id: 'city-skyline',
    label: '城市天际线',
    hint: '组织外部环境、商业生态、行业格局',
    keywords: /城市|天际线|高楼|写字楼|都市|商业环境|行业格局|生态/g,
    domains: ['social-science', 'engineering'],
  },
  {
    id: 'supply-demand',
    label: '供需曲线',
    hint: '价格形成、市场均衡、需求供给变化',
    keywords: /供需|需求|供给|均衡|价格|市场|交点|定价/g,
    domains: ['social-science', 'math-science'],
  },
  {
    id: 'pdca-cycle',
    label: 'PDCA 循环',
    hint: '计划-执行-检查-改进的管理闭环',
    keywords: /pdca|戴明|循环|闭环|持续改进|迭代|计划.{0,4}执行|检查.{0,4}改进/g,
    domains: ['social-science', 'engineering'],
  },
  {
    id: 'growth-chart',
    label: '增长曲线',
    hint: '趋势变化、业务增长、复利效应',
    keywords: /增长|趋势|上升|复利|扩张|爬坡|逐年|曲线/g,
    domains: [], // 通用：统计/经济/生物增长同母题
  },
  {
    id: 'org-chart',
    label: '组织结构',
    hint: '层级汇报、部门划分、团队架构',
    keywords: /组织|结构|层级|部门|汇报|架构|团队|指挥链/g,
    domains: ['social-science'],
  },
  {
    id: 'square-root',
    label: '平方根面积模型',
    hint: '边长为 a 的正方形面积是 a²，开平方的几何含义',
    keywords: /平方根|开方|算术平方根|正方形面积|边长|面积等于/g,
    domains: ['math-science'],
  },
  {
    id: 'balance-scale',
    label: '天平权衡',
    hint: '两个方案的利弊权衡、资源取舍',
    keywords: /权衡|平衡|天平|取舍|利弊|比较|权衡利弊|轻重/g,
    domains: [], // 通用：文科辨析/经管决策/理科比较同母题
  },
  {
    id: 'timeline',
    label: '时间轴',
    hint: '历史时序、事件因果链、发展阶段',
    keywords: /时间轴|年代|世纪|朝代|先后|顺序|时序|沿革|历程|大事记|年表|大事年表/gi,
    domains: ['humanities', 'language-arts'],
  },
  {
    id: 'map-region',
    label: '区域地图',
    hint: '地理分布、疆域变迁、区域对比',
    keywords: /地图|区域|地形|疆域|流域|气候|分布|位置|地形图|区位/g,
    domains: ['humanities', 'social-science'],
  },
  {
    id: 'pipeline',
    label: '流程管线',
    hint: '处理流程、工序流转、输入到输出的管线',
    keywords: /流程|工序|管线|流水线|步骤|处理过程|流转|上下游|环节/g,
    domains: ['engineering', 'math-science'],
  },
  {
    id: 'blueprint',
    label: '工程图纸',
    hint: '结构制图、设计蓝图、尺寸与公差标注',
    keywords: /图纸|蓝图|制图|结构图|尺寸|公差|标注|剖面|装配/gi,
    domains: ['engineering'],
  },
]

export const ILLUSTRATION_SCENE_IDS = ILLUSTRATION_SCENES.map((scene) => scene.id)

const SCENES_BY_ID = new Map(ILLUSTRATION_SCENES.map((scene) => [scene.id, scene]))

export function illustrationScene(id) {
  return SCENES_BY_ID.get(id) || null
}

function matchCount(text, pattern) {
  pattern.lastIndex = 0
  return text.match(pattern)?.length || 0
}

function matchedTerms(text, pattern, limit = 3) {
  pattern.lastIndex = 0
  const found = new Set()
  let match
  while ((match = pattern.exec(text)) && found.size < limit) {
    found.add(match[0])
  }
  return [...found]
}

/**
 * 关键词 → 场景对齐（确定性，无模型调用）。
 * 输入通常是 OpenMAIC image 元素的 prompt/alt 文本或本课标题+要点；
 * 返回得分最高且 > 0 的场景，否则 null（调用方继续按丢弃计数）。
 */
export function matchIllustrationScene(...sources) {
  return matchIllustrationSceneForDomain('', ...sources)
}

/**
 * 学科域受限版（2026-11-09 学科画像）：
 * 先用 resourceAllowedForDomain 过滤候选场景再打分——防止文科历史课
 * 因为出现「比较」二字配到数学向的 square-root 图示。
 * domainId 为空/general 时等价于全量匹配（不过滤）。
 */
export function matchIllustrationSceneForDomain(domainId, ...sources) {
  const text = sources
    .flatMap((source) => (Array.isArray(source) ? source : [source]))
    .map((value) => String(value ?? ''))
    .join(' ')
    .slice(0, 4000)
  if (!text.trim()) return null

  const candidates = filterByPedagogy(ILLUSTRATION_SCENES, domainId)
  let best = null
  for (const scene of candidates) {
    const hits = matchCount(text, scene.keywords)
    if (!hits) continue
    const score = hits
    if (!best || score > best.score) {
      best = { id: scene.id, label: scene.label, score, terms: matchedTerms(text, scene.keywords) }
    }
  }
  return best
}
