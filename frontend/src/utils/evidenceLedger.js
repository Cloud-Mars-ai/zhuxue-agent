/**
 * 证据账本（Evidence Ledger）—— 课程编译器第三层。
 *
 * 对应研究设计 RQ2：每个关键结论、例题和题目都必须能回到一个来源，
 * 模型不能凭空增加来源。来源分五类：
 * - requirement 课程要求（用户需求 / 数据集要求）
 * - chunk      材料片段（知识库/教材摘录，凭 chunkId 可回填页码）
 * - attempt    学生答题证据（赛事学情数据中的真实作答记录）
 * - rule       本地规则（易错点库 errorPatterns 等确定性资产）
 * - derived    由前述证据推导（必须挂靠至少一条上游证据）
 *
 * 账本记录两类对象：
 * - entries：证据本身（带 kind/ref/quote）；
 * - claims ：关键结论/例题/题目，每个声明挂 evidenceIds。
 *
 * 审计口径：
 * - 无依据结论比例 = 没有任何有效证据的声明 / 总声明；
 * - 伪造来源 = kind=chunk 但 ref 不在 allowedChunkIds 中（模型编造材料 ID）。
 *
 * 本文件不导入 '@/...'，保证 node 测试可直接运行。
 */

export const EVIDENCE_KINDS = ['requirement', 'chunk', 'attempt', 'rule', 'derived']

export const EVIDENCE_KIND_LABELS = {
  requirement: '课程要求',
  chunk: '材料片段',
  attempt: '学生答题证据',
  rule: '本地规则',
  derived: '推导结论',
}

const MAX_QUOTE = 160

function text(value, max = 240) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

export function createLedger(planId = '') {
  return {
    planId: text(planId, 80),
    entries: [],
    claims: [],
    seq: 0,
  }
}

export function addEvidence(ledger, entry) {
  const kind = EVIDENCE_KINDS.includes(entry?.kind) ? entry.kind : null
  const ref = text(entry?.ref, 120)
  if (!ledger || !kind || !ref) return null
  const quote = text(entry?.quote, MAX_QUOTE)
  const duplicate = ledger.entries.find(
    (item) => item.kind === kind && item.ref === ref && item.quote === quote,
  )
  if (duplicate) return duplicate
  ledger.seq += 1
  const record = {
    id: text(entry?.id, 80) || `ev_${ledger.seq}`,
    kind,
    ref,
    locator: text(entry?.locator, 120),
    quote,
    note: text(entry?.note, 160),
    addedBy: ['model', 'local', 'repair', 'seed'].includes(entry?.addedBy) ? entry.addedBy : 'local',
  }
  ledger.entries.push(record)
  return record
}

export function evidenceById(ledger, id) {
  return ledger?.entries?.find((entry) => entry.id === id) || null
}

/**
 * 登记一条关键声明。evidence 可以是证据 id 数组，也可以是待建证据对象数组
 * （会自动 addEvidence）。没有任何证据时声明仍然入账，但 verified=false，
 * 供审计统计"无依据结论"。
 */
export function addClaim(ledger, claim) {
  if (!ledger) return null
  const evidenceIds = []
  for (const item of Array.isArray(claim?.evidence) ? claim.evidence : []) {
    if (typeof item === 'string') {
      if (evidenceById(ledger, item)) evidenceIds.push(item)
      continue
    }
    if (item && typeof item === 'object') {
      const created = addEvidence(ledger, item)
      if (created) evidenceIds.push(created.id)
    }
  }
  ledger.seq += 1
  const record = {
    id: text(claim?.id, 80) || `cl_${ledger.seq}`,
    sceneId: text(claim?.sceneId, 80),
    target: text(claim?.target, 80), // block id / question id / 'scene'
    kind: text(claim?.kind, 40) || 'conclusion',
    text: text(claim?.text, 400),
    evidenceIds: Array.from(new Set(evidenceIds)),
    addedBy: ['model', 'local', 'repair', 'seed'].includes(claim?.addedBy) ? claim.addedBy : 'local',
  }
  ledger.claims.push(record)
  return record
}

export function evidenceLabel(entry) {
  if (!entry) return '未知来源'
  const where = entry.locator ? ` · ${entry.locator}` : ''
  return `${EVIDENCE_KIND_LABELS[entry.kind] || entry.kind} ${entry.ref}${where}`
}

/**
 * 审计账本。
 * @param allowedChunkIds 可用材料 ID；为空时跳过伪造检测。
 */
export function auditLedger(ledger, allowedChunkIds = []) {
  const claims = ledger?.claims || []
  const entries = ledger?.entries || []
  const allowed = new Set(allowedChunkIds)
  const entryMap = new Map(entries.map((entry) => [entry.id, entry]))
  const unsupported = []
  const fabricated = []
  for (const claim of claims) {
    const refs = claim.evidenceIds.map((id) => entryMap.get(id)).filter(Boolean)
    const valid = refs.filter((entry) => entry.kind !== 'chunk' || !allowed.size || allowed.has(entry.ref))
    if (!valid.length) {
      unsupported.push({
        claimId: claim.id,
        sceneId: claim.sceneId,
        target: claim.target,
        text: claim.text,
        reason: refs.length ? '证据均为不可用材料片段' : '没有任何证据',
      })
    }
  }
  for (const entry of entries) {
    if (entry.kind === 'chunk' && allowed.size && !allowed.has(entry.ref)) {
      fabricated.push({ entryId: entry.id, ref: entry.ref, quote: entry.quote })
    }
  }
  const supported = claims.length - unsupported.length
  return {
    total: claims.length,
    supported,
    unsupportedRate: claims.length ? Number((unsupported.length / claims.length).toFixed(3)) : 0,
    supportRate: claims.length ? Number((supported / claims.length).toFixed(3)) : 1,
    unsupported,
    fabricated,
  }
}

export function claimsForScene(ledger, sceneId) {
  return (ledger?.claims || []).filter((claim) => claim.sceneId === sceneId)
}

export function ledgerSummary(ledger) {
  const audit = auditLedger(ledger)
  const byKind = {}
  for (const entry of ledger?.entries || []) {
    byKind[entry.kind] = (byKind[entry.kind] || 0) + 1
  }
  return { ...audit, evidenceByKind: byKind }
}

/**
 * 从场景内容确定性抽取关键声明（板书 block / 题目 / 案例）。
 * 抽取优先级：
 * 1. 内容上显式声明的 evidenceRefs（模型按契约输出时）；
 * 2. 场景级 sourceChunkIds → chunk 证据；
 * 3. 都没有 → 无证据声明（计入无依据比例，交给修复循环处理）。
 */
export function extractSceneClaims(ledger, { plan, scene, content }) {
  if (!ledger || !scene) return []
  const chunkEvidence = (scene.sourceChunkIds || []).map((ref) => ({
    kind: 'chunk',
    ref,
    addedBy: 'local',
    note: '场景级材料引用',
  }))
  const requirementEvidence = (plan?.requirements || []).map((requirement) => ({
    kind: 'requirement',
    ref: requirement.id,
    addedBy: 'local',
    note: '课程要求',
  }))
  const created = []

  const push = (claim) => {
    const record = addClaim(ledger, claim)
    if (record) created.push(record)
  }

  if (content?.kind === 'board') {
    for (const block of content.lesson?.blocks || []) {
      const refs = Array.isArray(block?.evidenceRefs) ? block.evidenceRefs : []
      const evidence = refs.length
        ? refs.map((ref) => ({ kind: 'chunk', ref, addedBy: 'model' }))
        : chunkEvidence.slice(0, 2)
      if (block.type === 'definition') {
        push({
          sceneId: scene.id,
          target: block.id,
          kind: 'definition',
          text: `${block.term}：${block.definition}`,
          evidence,
          addedBy: refs.length ? 'model' : 'local',
        })
      }
      if (block.type === 'wrong-first') {
        push({
          sceneId: scene.id,
          target: block.id,
          kind: 'example',
          text: `正解：${(block.correctSteps || []).join(' → ')}`,
          evidence: refs.length ? refs.map((ref) => ({ kind: 'chunk', ref, addedBy: 'model' })) : chunkEvidence.slice(0, 2),
          addedBy: refs.length ? 'model' : 'local',
        })
      }
      if (block.type === 'callout' && block.tone === 'warn') {
        push({
          sceneId: scene.id,
          target: block.id,
          kind: 'conclusion',
          text: text(block.text, 200),
          evidence: refs.length ? refs.map((ref) => ({ kind: 'chunk', ref, addedBy: 'model' })) : chunkEvidence.slice(0, 2),
          addedBy: refs.length ? 'model' : 'local',
        })
      }
    }
  }

  if (content?.kind === 'quiz') {
    for (const question of content.questions || []) {
      const refs = Array.isArray(question?.evidenceRefs) ? question.evidenceRefs : []
      push({
        sceneId: scene.id,
        target: question.id,
        kind: 'question',
        text: text(question.stem, 240),
        evidence: refs.length
          ? refs.map((ref) => ({ kind: 'chunk', ref, addedBy: 'model' }))
          : chunkEvidence.slice(0, 2),
        addedBy: refs.length ? 'model' : 'local',
      })
      if (question.explanation) {
        push({
          sceneId: scene.id,
          target: question.id,
          kind: 'explanation',
          text: text(question.explanation, 240),
          evidence: refs.length
            ? refs.map((ref) => ({ kind: 'chunk', ref, addedBy: 'model' }))
            : chunkEvidence.slice(0, 2),
          addedBy: refs.length ? 'model' : 'local',
        })
      }
    }
  }

  if (content?.kind === 'practice') {
    for (const point of content.referencePoints || []) {
      push({
        sceneId: scene.id,
        target: 'scene',
        kind: 'reference',
        text: text(point, 240),
        evidence: chunkEvidence.slice(0, 2),
        addedBy: 'local',
      })
    }
  }

  // 场景完成标准 → 课程要求证据
  for (const criterion of scene.completionCriteria || []) {
    push({
      sceneId: scene.id,
      target: 'scene',
      kind: 'criterion',
      text: text(criterion, 240),
      evidence: requirementEvidence.slice(0, 1),
      addedBy: 'local',
    })
  }

  return created
}

/** 为修复后的声明补挂规则证据（易错点库等），返回修复记录信息。 */
export function attachRuleEvidence(ledger, claimId, ruleId, note = '') {
  const claim = ledger?.claims?.find((item) => item.id === claimId)
  if (!claim) return null
  const entry = addEvidence(ledger, { kind: 'rule', ref: ruleId, addedBy: 'repair', note })
  if (!entry) return null
  if (!claim.evidenceIds.includes(entry.id)) claim.evidenceIds.push(entry.id)
  claim.addedBy = 'repair'
  return claim
}
