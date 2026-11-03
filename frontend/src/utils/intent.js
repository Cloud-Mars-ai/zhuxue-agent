/**
 * 小管同学对话式智能助手 —— 意图规则引擎（M1）
 *
 * 纯函数规则表：命中高频操作指令时直接返回可点击的操作卡片（响应快、结果确定），
 * 未命中则交由上层转交大模型自由问答。规则与待办数据解耦，
 * 后续替换为后端 LangGraph 工作流时可平滑迁移。
 */

/** 意图规则表：按优先级从上到下匹配 */
const RULES = [
  {
    intent: 'todo',
    patterns: [/待办/i, /要做什么/, /有什么事/, /todo/i, /安排/],
    reply:
      '这是你今天的待办，共三类，点击即可跳转：\n1. 课前预习——提交兴趣案例，供老师选用本节课案例；\n2. 课程作业——查看并提交作业；\n3. 课程考核——完成 AI 模拟面试题。',
    dynamicTodos: true,
  },
  {
    intent: 'homework',
    patterns: [/交作业/, /提交作业/, /作业/, /写作业/, /迟交/],
    reply: '好的，带你去作业页面。可以「前往作业页面」提交，也可以先「查看作业列表」了解截止时间。',
    actions: [
      { label: '前往作业页面', to: '/app/homework', mobile: '/m/course' },
      { label: '查看作业列表', to: '/app/homework', mobile: '/m/course' },
    ],
  },
  {
    intent: 'practice',
    patterns: [/练习/, /一人一题/, /练一练/, /刷题/],
    reply: '好呀！一人一题练习会为你生成专属情境题，作答后我会从观点结构、理论运用、表达逻辑三个维度给你反馈。',
    actions: [{ label: '开始一人一题练习', to: '/app/practice', mobile: '/m/practice' }],
  },
  {
    intent: 'selftest',
    patterns: [/自测/, /测一测/, /先测后学/, /测一下/, /摸底/],
    reply:
      '先测后学比直接看讲解更有效：合上资料作答，提交后才看解析。做完会告诉你哪几个概念是真正的盲点。',
    actions: [{ label: '开始章节自测', to: '/app/selftest', mobile: '/m/selftest' }],
  },
  {
    intent: 'cheatsheet',
    patterns: [/速查/, /小抄/, /备考/, /总结成表/, /整理.*表/],
    reply: '我会按主题而不是章节顺序重组，每条标出来源章节；屏幕看或打印带进考场都行。',
    actions: [{ label: '生成备考速查表', to: '/app/cheatsheet', mobile: '/m/cheatsheet' }],
  },
  {
    intent: 'checkup',
    patterns: [/体检/, /盲区/, /薄弱/, /哪里不会/, /哪不会/],
    reply:
      '学习体检会对比你的练习与自测记录，指出"零覆盖、低表现、概念盲点"三类问题，并按考核风险排序。',
    actions: [{ label: '查看学习体检', to: '/app/checkup', mobile: '/m/checkup' }],
  },
  {
    intent: 'case',
    patterns: [/案例/, /提案例/, /交案例/, /提交案例/, /预习/],
    reply: '预习时把感兴趣的案例提交到案例池，老师会挑选作为本节课案例。你的提交也会计入过程性评价。',
    actions: [{ label: '去提交预习案例', to: '/app/cases', mobile: '/m/case' }],
  },
  {
    intent: 'assessment',
    patterns: [/考核/, /考试/, /模拟面试/, /测验/, /做题/],
    reply: 'AI 模拟面试考核由老师圈定范围生成题目，你在这里查看分配给自己的题目并作答。',
    actions: [{ label: '进入课程考核', to: '/app/assessment', mobile: '/m/assessment' }],
  },
]

/**
 * 匹配用户输入的操作意图
 * @param {string} text 用户输入
 * @returns {{intent:string, reply:string, actions?:Array, dynamicTodos?:boolean}|null} 命中返回意图，未命中返回 null
 */
export function matchIntent(text) {
  const input = (text || '').trim()
  if (!input) return null
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(input))) {
      const { patterns: _ignored, ...rest } = rule
      return rest
    }
  }
  return null
}

/**
 * 组装待办中心数据（动态）：课前预习 / 课程作业 / 课程考核
 * 作业待办同步作业数据，考核待办同步教师已发布的模拟面试任务
 */
export function buildTodoActions() {
  return [
    {
      key: 'preview',
      label: '课前预习',
      desc: '提交兴趣案例，老师将选用本节课案例',
      to: '/app/cases',
      mobile: '/m/case',
    },
    {
      key: 'selftest',
      label: '章节自测',
      desc: '先测后学，提交后才看解析',
      to: '/app/selftest',
      mobile: '/m/selftest',
    },
    {
      key: 'homework',
      label: '课程作业',
      desc: '查看待提交作业与截止时间',
      to: '/app/homework',
      mobile: '/m/course',
    },
    {
      key: 'assessment',
      label: '课程考核',
      desc: '完成老师发布的 AI 模拟面试题',
      to: '/app/assessment',
      mobile: '/m/assessment',
    },
    {
      key: 'checkup',
      label: '学习体检',
      desc: '看盲区与下一步建议',
      to: '/app/checkup',
      mobile: '/m/checkup',
    },
  ]
}
