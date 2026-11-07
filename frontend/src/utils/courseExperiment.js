/**
 * 实验与评测工具 —— 课程编译器第六层（研究产出层）。
 *
 * 对应研究设计 RQ1–RQ4 的实验部分：把"生成过程"变成可批量复跑的
 * 研究对象。四组对照：
 * - vanilla  直接让大模型生成完整课程（无材料、无 schema、无编译）
 * - rag      提供教材材料，但无结构化规划
 * - schema   要求输出 JSON 与受控 block（有结构、无验证修复）
 * - compiler 完整编译器（规划 IR + 证据账本 + 验证 + 自动修复）
 *
 * 指标（每个 run 一条记录，聚合到组）：
 * - constraintPassRate  硬约束通过率
 * - coverage            课程要求覆盖率
 * - unsupportedRate     无依据结论比例（证据账本审计）
 * - prereqErrorRate     先修关系错误率
 * - mathErrorRate       数学计算/答案错误率
 * - stability           多次生成结构稳定性（run 间指纹 Jaccard）
 * - latencyMs/tokens    生成延迟与 token 成本
 *
 * 人工评分（3–5 名教师）通过 exportHumanScoreSheet 导出评分表，
 * 回收后用 importHumanScores 合入汇总。
 *
 * 本文件只用相对导入，保证 node 测试可直接运行。
 */

import { auditLedger } from './evidenceLedger.js'
import { planFingerprint } from './courseIR.js'

export const EXPERIMENT_GROUPS = {
  vanilla: {
    id: 'vanilla',
    label: 'Vanilla',
    description: '直接让大模型生成完整课程（无材料注入、无 schema、无验证修复）',
    compiler: false,
    rag: false,
    schema: false,
  },
  rag: {
    id: 'rag',
    label: 'RAG-only',
    description: '提供教材材料检索，但无结构化规划与验证',
    compiler: false,
    rag: true,
    schema: false,
  },
  schema: {
    id: 'schema',
    label: 'Prompt+Schema',
    description: '要求模型输出 JSON 与受控 block，仍无约束验证与修复',
    compiler: false,
    rag: true,
    schema: true,
  },
  compiler: {
    id: 'compiler',
    label: 'Full Compiler',
    description: '规划 IR + 证据账本 + 硬约束验证 + 自动修复',
    compiler: true,
    rag: true,
    schema: true,
  },
}

export const GROUP_IDS = Object.keys(EXPERIMENT_GROUPS)

function ratio(numerator, denominator) {
  return denominator > 0 ? Number((numerator / denominator).toFixed(3)) : 0
}

function mean(values) {
  if (!values.length) return 0
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(3))
}

/** 单次运行的标准化记录。 */
export function createExperimentRun({ task, group, repeat, plan, scenes = [], ledger, validation, subjectIssues = [], repairs = [], latencyMs = 0, tokens = 0, notes = '' }) {
  const audit = auditLedger(ledger, plan?.allowedChunkIds || [])
  const violations = validation?.violations || []
  const mathErrors = subjectIssues.filter((item) => item.severity === 'error' && item.code.startsWith('MATH_'))
  return {
    taskId: task?.id || '',
    group,
    repeat: Number(repeat) || 0,
    planId: plan?.courseId || '',
    fingerprint: plan ? planFingerprint(plan) : '',
    constraintPassed: !!validation?.passed,
    coverage: validation?.metrics?.coverage ?? 0,
    durationDrift: validation?.metrics?.durationDrift ?? 0,
    unsupportedRate: audit.unsupportedRate,
    supportRate: audit.supportRate,
    fabricatedEvidence: audit.fabricated.length,
    prereqErrors: violations.filter((item) => item.code === 'PREREQ_ORDER' || item.code === 'PREREQ_MISSING').length,
    mathErrors: mathErrors.length,
    subjectIssues: subjectIssues.length,
    repairs: repairs.length,
    sceneCount: plan?.scenes?.length || 0,
    latencyMs: Number(latencyMs) || 0,
    tokens: Number(tokens) || 0,
    fallback: !!notes?.includes?.('fallback'),
    notes: String(notes || ''),
  }
}

/** 结构稳定性：同组同任务多次生成之间的场景集合 Jaccard 相似度均值。 */
function stabilityOf(runs) {
  const byKey = new Map()
  for (const run of runs) {
    const key = `${run.taskId}::${run.group}`
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key).push(run)
  }
  const scores = []
  for (const list of byKey.values()) {
    if (list.length < 2) continue
    const signatures = list.map((run) => {
      try {
        const parsed = JSON.parse(run.fingerprint)
        return new Set((parsed.scenes || []).map((scene) => `${scene.type}|${scene.title}`))
      } catch {
        return new Set()
      }
    })
    for (let i = 0; i < signatures.length; i += 1) {
      for (let j = i + 1; j < signatures.length; j += 1) {
        const a = signatures[i]
        const b = signatures[j]
        const union = new Set([...a, ...b]).size
        const intersection = [...a].filter((item) => b.has(item)).length
        scores.push(union ? intersection / union : 0)
      }
    }
  }
  return Number(mean(scores).toFixed(3))
}

/** 汇总：按组聚合 + 与 Full Compiler 的差值对照。 */
export function summarizeExperiment(runs = []) {
  const groups = {}
  for (const id of GROUP_IDS) groups[id] = []
  for (const run of runs) {
    if (groups[run.group]) groups[run.group].push(run)
  }
  const summary = {}
  for (const [id, list] of Object.entries(groups)) {
    if (!list.length) continue
    summary[id] = {
      group: id,
      label: EXPERIMENT_GROUPS[id].label,
      runs: list.length,
      constraintPassRate: ratio(list.filter((run) => run.constraintPassed).length, list.length),
      coverage: mean(list.map((run) => run.coverage)),
      unsupportedRate: mean(list.map((run) => run.unsupportedRate)),
      prereqErrorRate: ratio(list.filter((run) => run.prereqErrors > 0).length, list.length),
      mathErrorRate: ratio(list.filter((run) => run.mathErrors > 0).length, list.length),
      fabricatedEvidenceRate: ratio(list.filter((run) => run.fabricatedEvidence > 0).length, list.length),
      stability: stabilityOf(list),
      repairsPerRun: mean(list.map((run) => run.repairs)),
      avgLatencyMs: Math.round(mean(list.map((run) => run.latencyMs))),
      avgTokens: Math.round(mean(list.map((run) => run.tokens))),
    }
  }
  const baseline = summary.compiler
  const comparison = {}
  if (baseline) {
    for (const [id, item] of Object.entries(summary)) {
      if (id === 'compiler') continue
      comparison[id] = {
        label: item.label,
        deltaConstraintPassRate: Number((baseline.constraintPassRate - item.constraintPassRate).toFixed(3)),
        deltaCoverage: Number((baseline.coverage - item.coverage).toFixed(3)),
        deltaUnsupportedRate: Number((item.unsupportedRate - baseline.unsupportedRate).toFixed(3)),
        deltaPrereqErrorRate: Number((item.prereqErrorRate - baseline.prereqErrorRate).toFixed(3)),
        deltaMathErrorRate: Number((item.mathErrorRate - baseline.mathErrorRate).toFixed(3)),
        deltaStability: Number((baseline.stability - item.stability).toFixed(3)),
      }
    }
  }
  return { generatedAt: new Date().toISOString(), totalRuns: runs.length, groups: summary, comparison }
}

/**
 * 批量执行实验。generate 由调用方注入（真实模型走 API 层；
 * 演示/测试可注入本地模拟生成器），签名：
 *   async generate({ task, group, repeat }) => { plan, scenes, ledger, validation, subjectIssues, repairs, latencyMs, tokens }
 * 其中 group 为组 ID 字符串（EXPERIMENT_GROUPS 的键）。
 */
export async function runExperiment({ tasks = [], groups = GROUP_IDS, repeats = 3, generate, onProgress }) {
  const runs = []
  let done = 0
  const total = tasks.length * groups.length * repeats
  for (const task of tasks) {
    for (const group of groups) {
      for (let repeat = 1; repeat <= repeats; repeat += 1) {
        const started = Date.now()
        const result = (await generate({ task, group, repeat })) || {}
        const latencyMs = result.latencyMs ?? Date.now() - started
        runs.push(
          createExperimentRun({
            task,
            group,
            repeat,
            plan: result.plan,
            scenes: result.scenes,
            ledger: result.ledger,
            validation: result.validation,
            subjectIssues: result.subjectIssues,
            repairs: result.repairs,
            latencyMs,
            tokens: result.tokens,
            notes: result.notes,
          }),
        )
        done += 1
        onProgress?.({ done, total, taskId: task.id, group, repeat })
      }
    }
  }
  return runs
}

export function exportExperimentJson(summary, runs) {
  return JSON.stringify({ summary, runs }, null, 2)
}

const CSV_HEADERS = [
  'taskId', 'group', 'repeat', 'constraintPassed', 'coverage', 'unsupportedRate',
  'prereqErrors', 'mathErrors', 'repairs', 'sceneCount', 'latencyMs', 'tokens', 'notes',
]

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function exportExperimentCsv(runs) {
  const lines = [CSV_HEADERS.join(',')]
  for (const run of runs) {
    lines.push(
      CSV_HEADERS.map((header) =>
        csvCell({
          taskId: run.taskId,
          group: run.group,
          repeat: run.repeat,
          constraintPassed: run.constraintPassed,
          coverage: run.coverage,
          unsupportedRate: run.unsupportedRate,
          prereqErrors: run.prereqErrors,
          mathErrors: run.mathErrors,
          repairs: run.repairs,
          sceneCount: run.sceneCount,
          latencyMs: run.latencyMs,
          tokens: run.tokens,
          notes: run.notes,
        }[header]),
      ).join(','),
    )
  }
  return lines.join('\n')
}

/** 教师人工评分表（3–5 名学科教师/教研人员）。 */
export function exportHumanScoreSheet(tasks = [], groups = ['vanilla', 'compiler']) {
  const rows = [['taskId', 'group', 'sceneOrder', 'sceneTitle', 'sceneType', 'teacherScore(1-5)', 'willingness(直接使用/需修改/拒绝)', 'comment']]
  for (const task of tasks) {
    for (const group of groups) {
      rows.push([task.id, group, '', '', '', '', '', ''])
    }
  }
  return rows.map((row) => row.map(csvCell).join(',')).join('\n')
}

/** 回收人工评分：willingness 比例 + 均分。 */
export function importHumanScores(records = []) {
  const valid = records.filter((item) => item && item.teacherScore != null)
  const willingness = { 直接使用: 0, 需修改: 0, 拒绝: 0 }
  for (const item of valid) {
    if (Object.prototype.hasOwnProperty.call(willingness, item.willingness)) {
      willingness[item.willingness] += 1
    }
  }
  return {
    scored: valid.length,
    meanScore: valid.length ? Number((valid.reduce((sum, item) => sum + Number(item.teacherScore), 0) / valid.length).toFixed(2)) : 0,
    willingness,
    willingnessRate: {
      直接使用: ratio(willingness.直接使用, valid.length),
      需修改: ratio(willingness.需修改, valid.length),
      拒绝: ratio(willingness.拒绝, valid.length),
    },
  }
}

export function formatExperimentMarkdown(summary) {
  const lines = [
    '# 课程编译器实验报告',
    '',
    `生成时间：${summary.generatedAt}｜总运行次数：${summary.totalRuns}`,
    '',
    '| 组 | 运行次数 | 硬约束通过率 | 要求覆盖率 | 无依据结论比例 | 先修错误率 | 数学错误率 | 结构稳定性 | 修复次数/课 | 平均延迟(ms) | 平均 token |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const item of Object.values(summary.groups)) {
    lines.push(
      `| ${item.label} | ${item.runs} | ${(item.constraintPassRate * 100).toFixed(1)}% | ${(item.coverage * 100).toFixed(1)}% | ${(item.unsupportedRate * 100).toFixed(1)}% | ${(item.prereqErrorRate * 100).toFixed(1)}% | ${(item.mathErrorRate * 100).toFixed(1)}% | ${item.stability.toFixed(2)} | ${item.repairsPerRun} | ${item.avgLatencyMs} | ${item.avgTokens} |`,
    )
  }
  if (Object.keys(summary.comparison).length) {
    lines.push('', '## Full Compiler 相对其他组的差值（正值=编译器更优）', '', '| 对照组 | 约束通过率差 | 覆盖率差 | 无依据比例差 | 先修错误率差 | 数学错误率差 | 稳定性差 |', '| --- | --- | --- | --- | --- | --- | --- |')
    for (const item of Object.values(summary.comparison)) {
      lines.push(
        `| ${item.label} | +${(item.deltaConstraintPassRate * 100).toFixed(1)}pp | +${(item.deltaCoverage * 100).toFixed(1)}pp | -${(item.deltaUnsupportedRate * 100).toFixed(1)}pp | -${(item.deltaPrereqErrorRate * 100).toFixed(1)}pp | -${(item.deltaMathErrorRate * 100).toFixed(1)}pp | +${item.deltaStability.toFixed(2)} |`,
      )
    }
  }
  return lines.join('\n')
}
