/**
 * 教育场景基础内容安全检查。
 *
 * 这不是完整的审核系统，而是演示交付的确定性最后一道门槛：
 * - 明确拒绝高风险操作指令；
 * - 拒绝批量真实身份证号或手机号出现在模型请求中；
 * - 检查失败时停止展示模型内容，并提示人工复核。
 */

const RULES = [
  {
    code: 'self_harm',
    message: '内容涉及自伤或自杀操作指令',
    pattern: /(自杀(方法|步骤|教程)|怎么自杀|如何自残|伤害自己(的|最).*(方法|步骤))/i,
  },
  {
    code: 'weapon_instruction',
    message: '内容涉及危险武器或爆炸物的制作步骤',
    pattern: /(炸弹|爆炸物|枪支).*(制作|配方|组装|教程|步骤)/i,
  },
  {
    code: 'illegal_drug',
    message: '内容涉及违禁药物制造或贩运步骤',
    pattern: /(毒品|违禁药物).*(制作|提纯|贩运|购买渠道)/i,
  },
  {
    code: 'personal_data',
    message: '请求中包含疑似真实身份证号或手机号',
    pattern: /(?:\b\d{17}[\dXx]\b|\b1[3-9]\d{9}\b)/,
  },
]

export function checkContentSafety(value) {
  const content = String(value || '')
  const issues = RULES.filter((rule) => rule.pattern.test(content)).map(
    ({ code, message }) => ({ code, message }),
  )
  return {
    ok: issues.length === 0,
    issues,
    reviewed: true,
    policyVersion: 'education-content-safety-v1',
  }
}

export function assertContentSafe(value, label = '内容') {
  const result = checkContentSafety(value)
  if (!result.ok) {
    const error = new Error(
      `${label}未通过安全检查：${result.issues.map((item) => item.message).join('；')}`,
    )
    error.code = 'CONTENT_SAFETY_BLOCKED'
    error.safety = result
    throw error
  }
  return result
}
