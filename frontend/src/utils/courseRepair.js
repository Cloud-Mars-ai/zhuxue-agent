/**
 * 验证—修复循环 —— 课程编译器第五层。
 *
 * 对应研究设计 RQ2/RQ4：验证失败时不重新生成整门课，只定位有问题的
 * 场景或 block，做两件事：
 * 1. 确定性修复（本地可判定的）：重排先修、时长再平衡、难度抬平、
 *    题型规格补齐、过滤假 chunk、数学答案/errorIndex 纠正、完成标准补齐；
 * 2. 定向修复（需要模型的）：生成只针对问题场景/block 的修复提示词，
 *    由 API 层调用模型重生成该场景，再回到验证层复检。
 *
 * 每次修复都写一条 RepairRecord（code / target / before / after / source），
 * 修复历史随课程持久化，供实验工具统计"自动修复贡献"。
 *
 * 本文件只用相对导入，保证 node 测试可直接运行。
 */

import { enforceDifficultyTiers, rebalanceMinutes } from './courseBlueprint.js'
import { validateCoursePlan } from './courseValidator.js'

function text(value, max = 240) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function record(code, target, action, before, after, source = 'deterministic') {
  return {
    id: `rp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    code,
    target,
    action,
    before: before ?? null,
    after: after ?? null,
    source,
    at: new Date().toISOString(),
  }
}

/**
 * 计划层确定性修复。返回 { plan, repairs, unresolved }。
 * unresolved 是需要模型介入的违规定位（scene 级或 plan 级）。
 */
export function repairCoursePlan(plan, validation) {
  const repairs = []
  const unresolved = []
  const next = JSON.parse(JSON.stringify(plan))
  const codes = new Set((validation?.violations || []).map((item) => item.code))

  // —— 先修顺序：先试拓扑重排，接受仅当不增加 error 数；否则摘除越界依赖边 ——
  if (codes.has('PREREQ_ORDER') || codes.has('PREREQ_MISSING')) {
    const errorCount = (validation) => validation?.metrics?.errorCount ?? 0
    const before = next.scenes.map((scene) => scene.id)
    const reordered = topologicalSceneOrder(next).map((scene, index) => ({ ...scene, order: index + 1 }))
    const reorderErrors = errorCount(validateCoursePlan({ ...next, scenes: reordered }))
    if (reorderErrors < errorCount(validation)) {
      next.scenes = reordered
      repairs.push(
        record(
          'PREREQ_ORDER',
          { type: 'plan', id: next.courseId },
          '按知识点先修关系重排场景顺序',
          before,
          next.scenes.map((scene) => scene.id),
        ),
      )
    } else {
      // 重排无法收敛（如收束场景被前移会引入新违规）：摘除越界依赖边
      const pointIds = new Set(next.knowledgePoints.map((point) => point.id))
      const orderOf = new Map(next.scenes.map((scene) => [scene.id, scene.order]))
      const introducedAt = new Map(next.knowledgePoints.map((point) => [point.id, point.introducedBy]))
      next.scenes.forEach((scene) => {
        const kept = []
        for (const id of scene.knowledgePointIds || []) {
          const intro = orderOf.get(introducedAt.get(id))
          if (!pointIds.has(id) || (intro != null && intro > scene.order)) continue
          kept.push(id)
        }
        if (kept.length !== (scene.knowledgePointIds || []).length) {
          repairs.push(
            record(
              'PREREQ_ORDER',
              { type: 'scene', id: scene.id },
              '摘除引入场景更晚的知识点引用',
              scene.knowledgePointIds,
              kept,
            ),
          )
          scene.knowledgePointIds = kept
        }
      })
    }
    // 仍指向不存在知识点的声明：直接清除（防死循环）
    const pointIds = new Set(next.knowledgePoints.map((point) => point.id))
    next.scenes.forEach((scene) => {
      const filtered = (scene.prerequisites || []).filter((id) => pointIds.has(id))
      if (filtered.length !== (scene.prerequisites || []).length) {
        repairs.push(
          record(
            'PREREQ_MISSING',
            { type: 'scene', id: scene.id },
            '清除不存在知识点的先修声明',
            scene.prerequisites,
            filtered,
          ),
        )
        scene.prerequisites = filtered
      }
    })
  }

  // —— 时长预算 ——
  if (codes.has('DURATION_BUDGET')) {
    const before = next.scenes.map((scene) => scene.estimatedMinutes)
    next.scenes = rebalanceMinutes(next.scenes, next.durationBudget)
    const after = next.scenes.map((scene) => scene.estimatedMinutes)
    if (before.join('|') !== after.join('|')) {
      repairs.push(
        record('DURATION_BUDGET', { type: 'plan', id: next.courseId }, '按类型区间再平衡场景时长', before, after),
      )
    }
  }

  // —— 难度递增 ——
  if (codes.has('DIFFICULTY_ORDER')) {
    const before = next.scenes.map((scene) => scene.difficultyTier)
    next.scenes = enforceDifficultyTiers(next.scenes)
    const after = next.scenes.map((scene) => scene.difficultyTier)
    if (before.join('|') !== after.join('|')) {
      repairs.push(
        record('DIFFICULTY_ORDER', { type: 'plan', id: next.courseId }, '抬平 lecture 难度阶梯为非降序', before, after),
      )
    }
  }

  // —— 题型规格 ——
  if (codes.has('EXERCISE_TYPES')) {
    next.scenes.forEach((scene) => {
      if (scene.type !== 'quiz') return
      const spec = scene.exerciseSpec || { types: [], count: 0 }
      if (spec.types.length >= 2 && spec.count >= 2) return
      const fixed = { types: ['choice', 'judge'], count: 2 }
      repairs.push(
        record(
          'EXERCISE_TYPES',
          { type: 'scene', id: scene.id },
          '补齐 quiz 题型规格为选择题+判断题、2 题',
          spec,
          fixed,
        ),
      )
      scene.exerciseSpec = fixed
    })
  }

  // —— 材料存在性 ——
  if (codes.has('MATERIAL_EXISTENCE') && next.allowedChunkIds?.length) {
    const allowed = new Set(next.allowedChunkIds)
    next.scenes.forEach((scene) => {
      const filtered = (scene.sourceChunkIds || []).filter((id) => allowed.has(id))
      if (filtered.length !== (scene.sourceChunkIds || []).length) {
        repairs.push(
          record(
            'MATERIAL_EXISTENCE',
            { type: 'scene', id: scene.id },
            '清除不存在材料片段的引用',
            scene.sourceChunkIds,
            filtered,
          ),
        )
        scene.sourceChunkIds = filtered
      }
    })
  }

  // —— 完成标准 / 知识点难度 ——
  next.scenes.forEach((scene) => {
    if (!(scene.completionCriteria || []).length) {
      scene.completionCriteria = [
        `能达成学习目标：${text(scene.teachingObjective, 60)}`,
        '能指出本场景中一个仍待核对的疑问或边界',
      ]
      repairs.push(
        record(
          'COMPLETION_CRITERIA',
          { type: 'scene', id: scene.id },
          '补齐默认完成标准',
          null,
          scene.completionCriteria,
        ),
      )
    }
  })
  next.knowledgePoints.forEach((point) => {
    if (point.difficulty < 1 || point.difficulty > 3) {
      const before = point.difficulty
      point.difficulty = Math.min(3, Math.max(1, point.difficulty))
      repairs.push(
        record('KP_RANGE', { type: 'knowledgePoint', id: point.id }, '知识点难度钳制到 1–3', before, point.difficulty),
      )
    }
  })

  // —— 覆盖不足：本地无法创造内容，交模型 ——
  for (const violation of validation?.violations || []) {
    if (violation.code === 'COVERAGE') unresolved.push(violation)
  }

  next.repairs = [...(next.repairs || []), ...repairs]
  return { plan: next, repairs, unresolved }
}

/** 稳定拓扑排序：满足"先修场景在前"，其余保持原顺序。 */
export function topologicalSceneOrder(plan) {
  const scenes = [...plan.scenes].sort((a, b) => a.order - b.order)
  const order = new Map(scenes.map((scene) => [scene.id, scene.order]))
  const introducedBy = new Map(plan.knowledgePoints.map((point) => [point.id, point.introducedBy]))
  const edges = new Map() // sceneId -> Set(必须先出现的 sceneId)
  scenes.forEach((scene) => edges.set(scene.id, new Set()))
  for (const scene of scenes) {
    const used = new Set([
      ...(scene.knowledgePointIds || []),
      ...(scene.prerequisites || []),
    ])
    for (const id of used) {
      for (const preId of plan.knowledgePoints.find((point) => point.id === id)?.prerequisites || []) {
        const preScene = introducedBy.get(preId)
        if (preScene && preScene !== scene.id) edges.get(scene.id)?.add(preScene)
      }
      const preScene = introducedBy.get(id)
      if (preScene && preScene !== scene.id && (scene.prerequisites || []).includes(id)) {
        edges.get(scene.id)?.add(preScene)
      }
    }
  }
  const result = []
  const placed = new Set()
  const pending = new Set(scenes.map((scene) => scene.id))
  while (pending.size) {
    // 取 order 最小且依赖已满足的场景
    let pick = null
    for (const id of pending) {
      const deps = edges.get(id) || new Set()
      const ready = [...deps].every((dep) => placed.has(dep) || !pending.has(dep))
      if (ready && (!pick || order.get(id) < order.get(pick))) pick = id
    }
    if (!pick) {
      // 剩余成环：按原顺序兜底吐出，避免死循环
      for (const id of [...pending].sort((a, b) => order.get(a) - order.get(b))) {
        result.push(scenes.find((scene) => scene.id === id))
        placed.add(id)
        pending.delete(id)
      }
      break
    }
    result.push(scenes.find((scene) => scene.id === pick))
    placed.add(pick)
    pending.delete(pick)
  }
  return result
}

/**
 * 场景内容层确定性修复（数学答案 / errorIndex / 选项）。
 * 返回 { content, repairs, unresolved }。
 */
export function repairSceneContent(scene, content, issues = []) {
  const repairs = []
  const unresolved = []
  let next = content ? JSON.parse(JSON.stringify(content)) : content

  for (const item of issues) {
    if (item.severity !== 'error' && item.code !== 'WRONG_FIRST_INDEX') continue
    const fix = item.fix || {}
    if (!next) {
      unresolved.push(item)
      continue
    }
    if (item.code === 'MATH_ANSWER_MISMATCH' && next.kind === 'quiz') {
      const question = (next.questions || []).find((q) => q.id === item.target)
      if (question && Number.isInteger(fix.answerIndex)) {
        const before = question.answerIndex
        question.answerIndex = fix.answerIndex
        repairs.push(
          record('MATH_ANSWER_MISMATCH', { type: 'scene', id: scene.id, blockId: item.target }, '纠正答案选项', before, fix.answerIndex),
        )
      } else if (question && fix.answer != null) {
        const match = (question.options || []).findIndex(
          (option) => String(option).trim() === String(fix.answer).trim(),
        )
        if (match >= 0) {
          const before = question.answerIndex
          question.answerIndex = match
          repairs.push(
            record('MATH_ANSWER_MISMATCH', { type: 'scene', id: scene.id, blockId: item.target }, '按正确值重指答案选项', before, match),
          )
        } else {
          unresolved.push(item)
        }
      } else {
        unresolved.push(item)
      }
      continue
    }
    if (item.code === 'QUIZ_DUP_OPTION' && next.kind === 'quiz') {
      const question = (next.questions || []).find((q) => q.id === item.target)
      if (question && Array.isArray(fix.options) && fix.options.length >= 2) {
        const before = { options: question.options, answerIndex: question.answerIndex }
        question.options = [...fix.options]
        if (
          Number.isInteger(fix.answerIndex) &&
          fix.answerIndex >= 0 &&
          fix.answerIndex < fix.options.length
        ) {
          question.answerIndex = fix.answerIndex
        }
        repairs.push(
          record(
            'QUIZ_DUP_OPTION',
            { type: 'scene', id: scene.id, blockId: item.target },
            '删除重复选项并把答案重指到保留项',
            before,
            { options: question.options, answerIndex: question.answerIndex },
          ),
        )
        continue
      }
    }
    if (item.code === 'MATH_ANSWER_MISMATCH' && next.kind === 'board') {
      const block = (next.lesson?.blocks || []).find((b) => b.id === item.target)
      if (block?.type === 'fill-blank' && Array.isArray(block.answers) && fix.answer != null) {
        const before = block.answers[0]
        block.answers[0] = String(fix.answer)
        repairs.push(
          record('MATH_ANSWER_MISMATCH', { type: 'scene', id: scene.id, blockId: item.target }, '按算式结果纠正填空答案', before, block.answers[0]),
        )
      } else {
        unresolved.push(item)
      }
      continue
    }
    if (item.code === 'WRONG_FIRST_INDEX' && Number.isInteger(fix.errorIndex) && next.kind === 'board') {
      const block = (next.lesson?.blocks || []).find((b) => b.id === item.target)
      if (block?.type === 'wrong-first') {
        const before = block.errorIndex
        block.errorIndex = fix.errorIndex
        repairs.push(
          record('WRONG_FIRST_INDEX', { type: 'scene', id: scene.id, blockId: item.target }, 'errorIndex 对准真实偏离步', before, fix.errorIndex),
        )
        continue
      }
    }
    unresolved.push(item)
  }

  return { content: next, repairs, unresolved }
}

/**
 * 定向修复提示词：只针对问题场景/block，让模型做最小改动。
 * 与"重新生成整门课"相对，这是修复循环控制成本与漂移的关键。
 */
export function buildSceneRepairPrompt({ plan, scene, issues = [], materialText = '', allowedChunkIds = [] }) {
  const problemList = issues
    .map((item) => `- [${item.code}] ${item.target || ''} ${item.message}${item.fix ? `｜修复建议：${JSON.stringify(item.fix)}` : ''}`)
    .join('\n')
  return `你是课程修复器。下面这门课只有一个场景没有通过校验，请只修复该场景。

课程：${plan?.title || ''}
问题场景：${scene?.title || ''}（${scene?.type || ''}，约 ${scene?.estimatedMinutes || 0} 分钟）
学习目标：${scene?.teachingObjective || ''}
完成标准：${(scene?.completionCriteria || []).join('；')}
材料片段 ID（只能引用这些）：${(allowedChunkIds.length ? allowedChunkIds : scene?.sourceChunkIds || []).map((id) => `"${id}"`).join('、') || '无'}

未通过校验的问题：
${problemList || '- 结构不完整'}

修复要求：
1. 保持原有教学意图，只改与问题相关的内容；
2. 数学步骤必须逐步等价，最终答案与方程解一致；
3. 选择题选项互不重复，且恰有一个正确选项；
4. 关键结论/例题/题目在 evidenceRefs 中给出材料片段 ID；没有材料依据的表述删除或改为"待核对"；
5. 只返回该场景的 JSON，字段契约与首次生成一致。

${materialText ? `可用材料摘录：\n${materialText.slice(0, 3000)}` : ''}`
}

/** 汇总一门课的全部修复记录（按 code 计数，供实验指标用）。 */
export function summarizeRepairs(repairs = []) {
  const byCode = {}
  const bySource = { deterministic: 0, model: 0 }
  for (const item of repairs) {
    byCode[item.code] = (byCode[item.code] || 0) + 1
    if (item.source === 'model') bySource.model += 1
    else bySource.deterministic += 1
  }
  return { total: repairs.length, byCode, bySource }
}
