/**
 * 主动学习 Feed（S2-3）
 *
 * 规则优先、可解释、离线可用。每条都必须回答"为什么是它"，
 * 理由必须引用真实数据，禁止空泛的"你应该努力"。
 */

const DOT = {
  urgent: '#E03131',
  normal: '#F59F00',
  calm: '#2B8A3E',
  info: '#3B5BDB',
}

function daysUntil(dateStr) {
  const target = new Date(String(dateStr).replace(/-/g, '/'))
  if (Number.isNaN(target.getTime())) return null
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

/**
 * @param {Object} params
 * @param {Object} params.persona persona store 的 data
 * @param {Array} params.gaps 诊断结果
 * @param {number} params.pendingAssessment 待作答考核题数
 * @param {number} params.daysSincePractice 距上次练习天数
 * @param {string} params.currentChapter 当前进行章节
 * @param {Array} params.homeworks 作业列表
 */
export function buildFeed({
  persona,
  gaps = [],
  pendingAssessment = 0,
  daysSincePractice = null,
  currentChapter = '',
  homeworks = [],
}) {
  const items = []

  // 1. 截止压力：作业 3 天内到期 / 已逾期
  homeworks.forEach((h) => {
    if (h.status === 'graded') return
    const d = daysUntil(h.deadline)
    if (d === null || d > 3) return
    items.push({
      id: `hw-${h.id}`,
      dot: d < 0 ? DOT.urgent : DOT.normal,
      title: d < 0 ? `作业已逾期：${h.title}` : `作业 ${d === 0 ? '今天' : `${d} 天后`}截止：${h.title}`,
      sub: `提交进度 ${h.submitted}/${h.total}，逾期会影响过程性评价`,
      date: d < 0 ? '已逾期' : d === 0 ? '今天' : `${d} 天`,
      to: { path: '/app/homework' },
      priority: d < 0 ? 100 : 90 - d * 5,
    })
  })

  // 2. 待作答考核
  if (pendingAssessment > 0) {
    items.push({
      id: 'assessment-pending',
      dot: DOT.urgent,
      title: `模拟面试题 ${pendingAssessment} 道待作答`,
      sub: '老师已复核发布，作答后会生成 AI 反馈',
      date: '',
      to: { path: '/app/assessment' },
      priority: 95,
    })
  }

  // 3. 最高风险盲区
  const topGap = gaps.find((g) => g.type !== 'zero') || gaps[0]
  if (topGap) {
    items.push({
      id: `gap-${topGap.chapter}`,
      dot: DOT.normal,
      title: `补一处盲区：${topGap.chapter.replace(/^第\d+章\s*/, '')}`,
      sub: topGap.evidence,
      date: '',
      to: {
        path: '/app/selftest',
        query: { chapters: topGap.chapter },
      },
      priority: topGap.risk,
    })
  }

  // 4. 练习节奏
  if (daysSincePractice === null || daysSincePractice >= 2) {
    items.push({
      id: 'practice-rhythm',
      dot: DOT.normal,
      title: daysSincePractice === null ? '先做一组 5 题摸底' : `已 ${daysSincePractice} 天没练，做一组找回手感`,
      sub:
        daysSincePractice === null
          ? '没有练习记录，先用自测定位你的起点'
          : `上次练习在 ${daysSincePractice} 天前，间隔太久会遗忘`,
      date: '',
      to: { path: '/app/selftest', query: { chapters: currentChapter } },
      priority: 70,
    })
  } else {
    items.push({
      id: 'cheatsheet-current',
      dot: DOT.calm,
      title: `把「${currentChapter.replace(/^第\d+章\s*/, '')}」整理成一页速查表`,
      sub: '按主题重组，考前直接打印',
      date: '',
      to: { path: '/app/cheatsheet', query: { chapters: currentChapter } },
      priority: 55,
    })
  }

  // 5. 学习体检（有足够数据才提示）
  if ((persona?.behavior?.practiceCount || 0) + (persona?.behavior?.selfTestCount || 0) >= 2) {
    items.push({
      id: 'checkup',
      dot: DOT.info,
      title: '看看你的学习体检报告',
      sub: `已累计 ${persona.behavior.practiceCount} 次练习、${persona.behavior.totalQuestions} 道自测`,
      date: '',
      to: { path: '/app/checkup' },
      priority: 50,
    })
  }

  const seen = new Set()
  return items
    .filter((i) => {
      if (seen.has(i.id)) return false
      seen.add(i.id)
      return true
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)
}

export { DOT }
