/**
 * 竞赛阶段仿真数据
 * 后端接口就绪后，把 stores/user.js 里的 useMock 置为 false，
 * 并在各页面把 import 的假数据替换为 api 调用即可。
 */

export const COURSE = {
  name: '管理学',
  college: '北京化工大学经济管理学院',
  term: '2026 秋季学期',
  teacher: '王教授',
  credit: 3,
  hours: 48,
  studentCount: 86,
  description:
    '本课程系统讲授管理的基本职能与核心理论，覆盖计划、组织、领导、控制四大模块，强调理论分析与案例研讨相结合。',
  chapters: [
    { id: 1, title: '第1章 管理与管理者', progress: 100, status: '已完成' },
    { id: 2, title: '第2章 管理理论的形成与发展', progress: 100, status: '已完成' },
    { id: 3, title: '第3章 决策与计划', progress: 72, status: '进行中' },
    { id: 4, title: '第4章 组织设计与组织变革', progress: 30, status: '进行中' },
    { id: 5, title: '第5章 领导与激励', progress: 0, status: '未开始' },
    { id: 6, title: '第6章 控制与控制过程', progress: 0, status: '未开始' },
  ],
}

export const MOCK_USERS = [
  { username: 'admin', password: '123456', name: '系统管理员', role: 'admin', id: 'A001' },
  { username: 'teacher', password: '123456', name: '王教授', role: 'teacher', id: 'T001' },
  { username: 'ta', password: '123456', name: '李助教', role: 'ta', id: 'T002' },
  {
    username: 'student',
    password: '123456',
    name: '张同学',
    role: 'student',
    id: '2024010001',
    discipline: '管理类',
  },
  {
    username: 'student2',
    password: '123456',
    name: '李骁',
    role: 'student',
    id: '2024010002',
    discipline: '工科类',
  },
]

/** 学科背景选项（M5 学科背景差异化引擎） */
export const DISCIPLINE_OPTIONS = ['管理类', '工科类', '其他']

/**
 * 大班学生名单（教师端圈人选范围用）
 * discipline: 管理类 / 工科类 / 其他 —— 决定 AI 出题与讲解的案例取材方向
 */
export const MOCK_STUDENTS = [
  { id: '2024010001', name: '张同学', group: '第1组', discipline: '管理类' },
  { id: '2024010002', name: '李骁', group: '第1组', discipline: '工科类' },
  { id: '2024010003', name: '王浩然', group: '第1组', discipline: '管理类' },
  { id: '2024010004', name: '陈思雨', group: '第2组', discipline: '管理类' },
  { id: '2024010005', name: '刘一鸣', group: '第2组', discipline: '工科类' },
  { id: '2024010006', name: '赵欣怡', group: '第2组', discipline: '管理类' },
  { id: '2024010007', name: '孙志强', group: '第3组', discipline: '工科类' },
  { id: '2024010008', name: '周子墨', group: '第3组', discipline: '管理类' },
  { id: '2024010009', name: '吴佳琪', group: '第3组', discipline: '其他' },
  { id: '2024010010', name: '郑宇轩', group: '第4组', discipline: '工科类' },
  { id: '2024010011', name: '何雨桐', group: '第4组', discipline: '管理类' },
  { id: '2024010012', name: '马俊杰', group: '第4组', discipline: '管理类' },
]

/** 案例池预置数据（M3，教师已选用一条作为课堂案例） */
export const MOCK_CASES = [
  {
    id: 'c-1001',
    title: '小米 SU7 交付风波中的跨部门协同',
    chapter: '第4章 组织设计与组织变革',
    link: '',
    summary:
      '小米汽车量产初期研发、供应链、交付三部门目标冲突，通过设立联合 PMO 与统一看板实现协同，可对应矩阵式组织与跨部门沟通机制。',
    reason: '新闻热度高，学生有切身感知，适合讲横向协调机制。',
    tags: ['组织协调', '矩阵结构'],
    submitter: '陈思雨',
    discipline: '管理类',
    status: 'selected',
    createdAt: '2026-10-20 21:14',
  },
  {
    id: 'c-1002',
    title: '某化工车间班组排班改革',
    chapter: '第3章 决策与计划',
    link: 'https://example.com/shift-reform',
    summary:
      '某石化车间原四班三倒响应慢，改用弹性班组+计划看板后异常响应时间缩短 40%，对应计划职能与决策程序。',
    reason: '工科背景同学的实习见闻，贴近工程管理实际。',
    tags: ['计划职能', '现场管理'],
    submitter: '李骁',
    discipline: '工科类',
    status: 'pending',
    createdAt: '2026-10-22 16:40',
  },
]

export const FORUM_POSTS = [
  {
    id: 1,
    title: '决策的有限理性到底怎么理解？',
    author: '张同学',
    role: 'student',
    chapter: '第3章 决策与计划',
    createdAt: '2026-10-15 09:24',
    replies: 6,
    views: 42,
    solved: true,
    content:
      '西蒙提出的有限理性，和古典经济学里的完全理性差别在哪里？考试会怎么考？',
  },
  {
    id: 2,
    title: '组织结构设计：职能制和事业部制怎么选？',
    author: '刘同学',
    role: 'student',
    chapter: '第4章 组织设计与组织变革',
    createdAt: '2026-10-16 14:02',
    replies: 3,
    views: 28,
    solved: false,
    content: '案例题里遇到多元化经营的企业，是不是就该直接答事业部制？',
  },
  {
    id: 3,
    title: '第4章课件里的矩阵式组织补充资料',
    author: '李助教',
    role: 'ta',
    chapter: '第4章 组织设计与组织变革',
    createdAt: '2026-10-16 20:15',
    replies: 1,
    views: 65,
    solved: false,
    isTop: true,
    content: '补充两篇矩阵式组织的经典文献，见附件，研讨课前请读完。',
  },
]

export const HOMEWORKS = [
  {
    id: 1,
    title: '第3章课后案例分析：某公司投资决策失误',
    deadline: '2026-10-20 23:59',
    status: 'submitting',
    submitted: 54,
    total: 86,
    score: null,
  },
  {
    id: 2,
    title: '第2章管理理论对比表格',
    deadline: '2026-10-08 23:59',
    status: 'graded',
    submitted: 84,
    total: 86,
    score: 88,
  },
  {
    id: 3,
    title: '第1章课堂研讨纪要',
    deadline: '2026-09-25 23:59',
    status: 'graded',
    submitted: 86,
    total: 86,
    score: 92,
  },
  {
    id: 4,
    title: '第4章组织结构设计作业',
    deadline: '2026-11-02 23:59',
    status: 'pending',
    submitted: 0,
    total: 86,
    score: null,
  },
]

export const HOMEWORK_STATUS = {
  pending: { label: '未开始', type: 'info' },
  submitting: { label: '提交中', type: 'warning' },
  graded: { label: '已批改', type: 'success' },
}

// 学情统计：近 6 周课堂参与度
export const STATS_WEEKLY = {
  weeks: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周'],
  attendance: [86, 84, 85, 82, 83, 81],
  interaction: [32, 45, 51, 48, 62, 70],
  homeworkRate: [100, 98, 96, 95, 92, 90],
}

// 各章节掌握度（雷达图）
export const STATS_CHAPTER_MASTERY = [
  { chapter: '第1章', mastery: 88 },
  { chapter: '第2章', mastery: 85 },
  { chapter: '第3章', mastery: 67 },
  { chapter: '第4章', mastery: 52 },
  { chapter: '第5章', mastery: 0 },
  { chapter: '第6章', mastery: 0 },
]

// 学生分层分布
export const STATS_STUDENT_LEVEL = [
  { name: '优秀（≥90）', value: 18 },
  { name: '良好（80-89）', value: 31 },
  { name: '中等（70-79）', value: 24 },
  { name: '待提高（<70）', value: 13 },
]

export const RISK_STUDENTS = [
  { id: '2024010017', name: '赵同学', issue: '连续 2 次未交作业', level: '高' },
  { id: '2024010042', name: '孙同学', issue: '近 3 周出勤率 60%', level: '中' },
  { id: '2024010068', name: '周同学', issue: '研讨课零发言', level: '中' },
]

// AI 答疑对话样例
export const CHAT_SAMPLE = [
  {
    role: 'user',
    content: '什么是有限理性决策？',
  },
  {
    role: 'assistant',
    content:
      '有限理性（Bounded Rationality）由赫伯特·西蒙提出，指决策者在现实中无法掌握全部信息、也无法穷尽所有方案，因此追求的是"满意解"而非"最优解"。\n\n它包含三个要点：\n1. 信息不完全——决策者只能获取部分相关信息；\n2. 认知能力有限——人脑处理信息的能力有上限；\n3. 满意原则——找到一个"足够好"的方案即停止搜索。\n\n📖 依据：《管理学》第3章 3.2 节，第 78 页。\n\n需要我出一道口述题帮你检验掌握情况吗？',
  },
]
