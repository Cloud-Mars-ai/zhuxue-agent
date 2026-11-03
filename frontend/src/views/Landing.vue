<template>
  <div class="landing">
    <a class="skip-link" href="#main">跳到主要内容</a>

    <!-- ================= 导航：浮动控制台条 ================= -->
    <header class="nav" :class="{ 'is-scrolled': navScrolled }">
      <div class="nav-inner">
        <a class="nav-brand" href="#top" @click.prevent="scrollTop">
          <span class="nav-mark" aria-hidden="true">智</span>
          <span class="nav-name">人机协同助学</span>
        </a>

        <span class="nav-live" aria-hidden="true"><i class="live-dot"></i>LIVE</span>

        <nav class="nav-links" aria-label="页面章节">
          <a href="#features" @click.prevent="scrollToId('features')">功能亮点</a>
          <a href="#how" @click.prevent="scrollToId('how')">工作方式</a>
          <a href="#proof" @click.prevent="scrollToId('proof')">运行实况</a>
          <a href="#faq" @click.prevent="scrollToId('faq')">常见问题</a>
        </nav>

        <div class="nav-actions">
          <button
            class="skin-btn"
            type="button"
            :title="`切换到${themeStore.isMo ? '纸感' : '夜读'}皮肤`"
            @click="themeStore.toggle()"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" stroke="none" />
            </svg>
            <span>{{ themeStore.isMo ? '纸感' : '夜读' }}</span>
          </button>
          <button class="btn btn-primary nav-cta" type="button" @click="enterApp">{{ ctaLabel }}</button>
          <button
            class="nav-burger"
            type="button"
            :aria-expanded="menuOpen"
            aria-controls="nav-panel"
            :aria-label="menuOpen ? '关闭菜单' : '打开菜单'"
            @click="menuOpen = !menuOpen"
          >
            <span></span><span></span>
          </button>
        </div>
      </div>
    </header>

    <!-- 移动端全高面板：链接依次入场（置于 header 外，避免 transform 包含块干扰 fixed 定位） -->
    <div id="nav-panel" class="nav-panel" :class="{ open: menuOpen }">
      <nav class="panel-links" aria-label="移动端页面章节">
        <a v-for="(link, i) in ['features', 'how', 'proof', 'faq']" :key="link" :style="{ '--i': i }" href="#" @click.prevent="scrollToId(link)">
          {{ { features: '功能亮点', how: '工作方式', proof: '运行实况', faq: '常见问题' }[link] }}
        </a>
      </nav>
      <button class="btn btn-primary panel-cta" type="button" @click="menuOpen = false; enterApp()">
        {{ ctaLabel }}
      </button>
    </div>

    <main id="main">
      <!-- ================= Hero ================= -->
      <section class="hero grid-overlay" id="top">
        <div class="container hero-grid">
          <div class="hero-copy">
            <p class="kicker" data-reveal>北京化工大学经济管理学院 · 教学实践产品</p>
            <h1 class="hero-title" data-reveal>
              大班课上，<br />人人有题练，题题有反馈
            </h1>
            <p class="hero-sub" data-reveal>
              一款嵌入经管课程全教学周期的人机协同助学智能体。课前案例征集、一人一题练习、过程性评价、模拟面试考核，AI 引导学生思考，而不直接给答案。
            </p>
            <div class="cta-row" data-reveal>
              <button class="btn btn-primary btn-lg" type="button" @click="enterApp">{{ ctaLabel }}</button>
              <button class="btn btn-ghost btn-lg" type="button" @click="scrollToId('how')">看看怎么运作</button>
            </div>
            <p class="hero-proof" data-reveal>
              <span class="proof-dot" aria-hidden="true"></span>《管理学》2026 秋季学期 · 86 名学生真实运行中 ｜ 无需注册，演示账号一键体验
            </p>
          </div>

          <!-- 统治性视觉时刻：实况遥测面板 -->
          <div class="hero-visual" data-reveal>
            <div class="console-panel hud-corners">
              <div class="cp-head">
                <span class="cp-status"><i class="live-dot" aria-hidden="true"></i>LIVE</span>
                <span class="cp-title">助学引擎 · 运行中</span>
                <span class="cp-clock">{{ logLines[logLines.length - 1].time }}</span>
              </div>
              <ul class="cp-log">
                <li v-for="line in logLines" :key="line.seq">
                  <span class="log-time">{{ line.time }}</span>
                  <span class="log-text">{{ line.text }}</span>
                </li>
              </ul>
              <div class="cp-feedback">
                <p class="cp-sub">AI 三维反馈 · 一人一题</p>
                <div v-for="d in feedbackDims" :key="d.name" class="fc-row">
                  <span class="fc-name">{{ d.name }}</span>
                  <span class="fc-bar"><i :style="{ '--w': d.score + '%', background: toneColor(d.tone) }"></i></span>
                  <span class="fc-score">{{ d.score }}</span>
                </div>
                <p class="fc-note">结论前置做得不错，结尾可补一句动态修正。</p>
              </div>
              <div class="cp-queue">
                <span>待练习 <b>12</b></span>
                <span>进行中 <b>3</b></span>
                <span>今日已完成 <b>86</b></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= Tagline reveal（逐词点亮） ================= -->
      <section class="tagline" aria-label="产品主张">
        <div class="container">
          <p class="tagline-text">
            <span v-for="(tk, i) in taglineTokens" :key="i" class="tk" :style="{ '--i': i }">{{ tk }}</span><span class="tk-caret" aria-hidden="true"></span>
          </p>
        </div>
      </section>

      <!-- ================= 痛点与解法 ================= -->
      <section class="section" id="features">
        <div class="container">
          <header class="sec-head" data-reveal>
            <p class="kicker"><span class="sec-no">01</span>痛点与解法</p>
            <h2>五个老问题，一个闭环解法</h2>
            <p class="sec-lead">
              来自《管理学》教学团队的访谈：练习机会、预习抓手、考核方式、学生差异与功能寻路，是老师们提得最多的五件事。智能体的五个模块，逐一回应。
            </p>
          </header>

          <ul class="pain-list">
            <li v-for="(p, i) in pains" :key="i" class="pain-row" data-reveal>
              <div class="pain-left">
                <p class="pain-code">MOD-0{{ i + 1 }}</p>
                <h3>{{ p.pain }}</h3>
                <p>{{ p.detail }}</p>
              </div>
              <div class="pain-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </div>
              <div class="pain-right">
                <p class="pain-module">{{ p.module }}</p>
                <p class="pain-fix">{{ p.fix }}</p>
              </div>
            </li>
          </ul>

          <header class="sec-head sec-head-mid" data-reveal>
            <p class="kicker"><span class="sec-no">//</span>产品亮点</p>
            <h2>不只是聊天窗口</h2>
            <p class="sec-lead">四类角色各有完整动线，AI 在各个环节承担教练与助教角色。</p>
          </header>

          <div class="benefit-grid">
            <article v-for="(b, i) in benefits" :key="i" class="benefit-card" data-reveal>
              <p class="benefit-stat">{{ b.stat }}</p>
              <h3>{{ b.title }}</h3>
              <p class="benefit-body">{{ b.body }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- ================= 三步工作方式 ================= -->
      <section class="section section-alt" id="how">
        <div class="container">
          <header class="sec-head" data-reveal>
            <p class="kicker"><span class="sec-no">02</span>工作方式</p>
            <h2>三步跑完一轮教学闭环</h2>
            <p class="sec-lead">以一次课程考核为例，看看数据怎么在教师、学生与 AI 之间流动。</p>
          </header>

          <ol class="step-list">
            <li v-for="(s, i) in steps" :key="i" class="step" data-reveal>
              <span class="step-no" aria-hidden="true">{{ s.no }}</span>
              <h3>{{ s.title }}</h3>
              <p>{{ s.body }}</p>
            </li>
          </ol>
        </div>
      </section>

      <!-- ================= 运行实况 ================= -->
      <section class="section" id="proof">
        <div class="container">
          <header class="sec-head" data-reveal>
            <p class="kicker"><span class="sec-no">03</span>运行实况</p>
            <h2>在一门真实的课上跑着</h2>
            <p class="sec-lead">这不是概念验证：《管理学》2026 秋季学期的 86 名学生，正在这些功能里完成预习、练习与考核。</p>
          </header>

          <div class="stat-band" data-reveal>
            <div v-for="(s, i) in stats" :key="i" class="stat">
              <p class="stat-num">{{ s.num }}<span class="stat-unit">{{ s.unit }}</span></p>
              <p class="stat-label">{{ s.label }}</p>
            </div>
          </div>

          <figure class="exhibit" data-reveal>
            <div class="shot-frame">
              <div class="shot-bar" aria-hidden="true">
                <i></i><i></i><i></i>
                <span>zhuxue-agent.app · 课程主页</span>
                <span class="shot-live"><i class="live-dot"></i>LIVE</span>
              </div>
              <img
                class="shot"
                :src="heroShot"
                alt="人机协同助学智能体课程主页界面：今日待办、四宫格快捷入口、本节课案例与章节学习进度"
                width="1440"
                height="900"
              />
            </div>
            <figcaption class="exhibit-cap">课程主页实况 · 今日待办、四宫格入口、案例与章节进度一屏可见</figcaption>
          </figure>

          <ul class="fact-list" data-reveal>
            <li v-for="(f, i) in facts" :key="i">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 12.5l5 5L20 6.5" />
              </svg>
              <span>{{ f }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- ================= FAQ ================= -->
      <section class="section section-alt" id="faq">
        <div class="container container-narrow">
          <header class="sec-head" data-reveal>
            <p class="kicker"><span class="sec-no">04</span>常见问题</p>
            <h2>访问者最关心的八件事</h2>
          </header>

          <div class="faq-list" data-reveal>
            <div v-for="(item, i) in faqs" :key="i" class="faq-item" :class="{ open: openFaq === i }">
              <button
                class="faq-q"
                type="button"
                :aria-expanded="openFaq === i"
                :aria-controls="`faq-a-${i}`"
                @click="toggleFaq(i)"
              >
                <span><em class="faq-idx">Q-0{{ i + 1 }}</em>{{ item.q }}</span>
                <svg class="faq-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M6 9.5l6 6 6-6" />
                </svg>
              </button>
              <Transition name="faq">
                <div v-if="openFaq === i" class="faq-a" :id="`faq-a-${i}`" role="region">
                  <p>{{ item.a }}</p>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= 终局 CTA ================= -->
      <section class="final">
        <div class="container container-narrow" data-reveal>
          <div class="final-panel grid-overlay hud-corners">
            <p class="kicker"><span class="sec-no">//</span>READY</p>
            <h2>打开浏览器，直接开始</h2>
            <p class="final-sub">无需注册与安装。用演示账号登录，完整体验从案例征集到模拟面试的教学闭环。</p>
            <div class="cta-row cta-center">
              <button class="btn btn-primary btn-lg" type="button" @click="enterApp">{{ ctaLabel }}</button>
              <button class="btn btn-ghost btn-lg" type="button" @click="scrollToId('faq')">访问者常问</button>
            </div>
            <p class="final-note">演示账号 student 或 teacher，密码 123456；数据仅保存在本地浏览器，可随时清除。</p>
          </div>
        </div>
      </section>
    </main>

    <!-- ================= 页脚 ================= -->
    <footer class="footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <span class="nav-mark" aria-hidden="true">智</span>
          <div>
            <p class="footer-name">人机协同助学智能体</p>
            <p class="footer-tag">面向经管课程全教学周期的人机协同助学</p>
          </div>
        </div>
        <nav class="footer-links" aria-label="页脚链接">
          <a href="https://github.com/Cloud-Mars-ai/zhuxue-agent" target="_blank" rel="noopener">代码仓库</a>
          <a href="#faq" @click.prevent="scrollToId('faq')">常见问题</a>
          <a href="#top" @click.prevent="scrollTop">回到顶部</a>
        </nav>
        <p class="footer-meta">北京化工大学经济管理学院 · 《管理学》2026 秋季学期 · 院级竞赛智能体赛道参赛作品</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
/**
 * 产品落地页（公开页，路由 /）· 深色运行台视觉体系
 *
 * 按 landing-page-design 技能规范实现：
 *   Part A  一个主张（全周期 AI 助学）、一类受众（经管课程师生与评委）、
 *           一个主动作（进入演示）；hero → tagline reveal → 痛点解法 →
 *            亮点 → 三步 → 运行实况 → FAQ → 终局 CTA。
 *   Part B  字号全部落在 12/14/16/18/20/24/30/36/48 阶梯；间距只用
 *            2/4/8/12/16/24/32/40/48/64/80/96；单一字体、无斜体、字重封顶 700；
 *            卡片圆角走品牌令牌；背景以平色 + 唯一 hero 径向辉光 +
 *            遥测网格线构成运行台质感；动效统一 cubic-bezier(0.22,1,0.36,1)，
 *            只动 transform 与 opacity；滚动显现与 tagline 逐词点亮均用
 *            IntersectionObserver，只播放一次；尊重 prefers-reduced-motion。
 *
 * 运行台签名元素：hero 实况遥测面板（脉冲状态点 / 滚动运行日志 /
 * 三维反馈条 / 队列读数）、等宽数据标签、模块编号、HUD 角标。
 * 视觉层全部走语义令牌（--page-bg / --card-bg / --accent 等），
 * 因此落地页随产品双皮肤（运行台 / 夜读）自动换装。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import heroShot from '@/assets/landing-course.png'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

/* ---------- 主行动按钮：已登录回课程，未登录去演示 ---------- */
const ctaLabel = computed(() => (userStore.isLogin ? '回到课程' : '进入在线演示'))

function enterApp() {
  router.push(userStore.isLogin ? '/app/course' : '/login')
}

/* ---------- 导航：滚动态与移动端面板 ---------- */
const navScrolled = ref(false)
const menuOpen = ref(false)

let scrollFrame = null
function onScroll() {
  if (scrollFrame) return
  scrollFrame = scrollFrame || requestAnimationFrame(() => {
    navScrolled.value = window.scrollY > 8
    scrollFrame = null
  })
}

/* ---------- 遥测面板：运行日志轮换 ---------- */
const LOG_TEXTS = [
  '学生 #27 完成「领导职能」一人一题练习',
  'AI 反馈生成 · 三维评估 82 分',
  '新案例提交 · 已自动打知识标签',
  '模拟面试题 #12 已发布至 32 名学生',
  '课前预习完成率更新 · 91%',
  '教师批量复核通过 8 道题目',
  '工科背景学生拿到工程管理情境题',
  '章节掌握度图刷新 · 3 名学生进入关注名单',
]
const LOG_BASE_SEC = 9 * 3600 + 41 * 60 + 22
let logSeq = 0
function fmtClock(totalSec) {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}
const logLines = ref(
  LOG_TEXTS.slice(-4).map((text) => ({
    seq: logSeq++,
    time: fmtClock(LOG_BASE_SEC + (logSeq - 1) * 7),
    text,
  })),
)
let logCursor = LOG_TEXTS.length - 1
let logTimer = null
function rotateLog() {
  logCursor = (logCursor + 1) % LOG_TEXTS.length
  logLines.value.push({
    seq: logSeq++,
    time: fmtClock(LOG_BASE_SEC + logSeq * 7),
    text: LOG_TEXTS[logCursor],
  })
  if (logLines.value.length > 4) logLines.value.shift()
}

/* ---------- 遥测面板：三维反馈 ---------- */
const feedbackDims = [
  { name: '观点结构', score: 82, tone: 'ok' },
  { name: '理论运用', score: 64, tone: 'warn' },
  { name: '表达逻辑', score: 78, tone: 'link' },
]
const toneColor = (tone) =>
  ({ ok: 'var(--ok)', warn: 'var(--warn)', link: 'var(--link)' }[tone] || 'var(--accent)')

/* ---------- tagline reveal：逐词点亮 ---------- */
const taglineTokens = ['你练过的', '每一道题，', '都在决定', '考核怎么', '考你。']

/* ---------- FAQ 手风琴（单开） ---------- */
const faqs = [
  {
    q: '这个产品目前用在哪门课上？',
    a: '以北京化工大学经济管理学院《管理学》为载体落地，3 学分、48 学时、86 名在课学生。框架与流程可复用到其他经管课程。',
  },
  {
    q: '谁能用，怎么开始？',
    a: '学生、助教、教师、管理员四类角色各有完整动线。点「进入在线演示」后用演示账号一键登录，无需注册；登录页也可选择进入 Web 端或手机 H5 端。',
  },
  {
    q: 'AI 会直接给学生答案吗？',
    a: '不会。所有 AI 反馈遵循同一原则：先肯定亮点，再给一条具体可操作的改进建议，不代替学生思考，也不给标准答案。',
  },
  {
    q: '需要安装什么软件吗？',
    a: '不需要。浏览器打开即可使用，Web 端与手机 H5 端共用同一套账号与数据，桌面浏览器打开 H5 链接会自动居中模拟手机。',
  },
  {
    q: '接入的是什么大模型？',
    a: '基于 OpenAI 兼容协议，默认接入阶跃星辰。在「模型接入」页面可以切换任意服务商与模型，密钥只保存在本地浏览器，支持一键测试连接。',
  },
  {
    q: '演示数据保存在哪里？',
    a: '演示模式下，练习、案例与考核数据保存在浏览器本地，刷新不丢失。后端就绪后可以平滑切换到真实接口，页面无需改动。',
  },
  {
    q: '怎么避免学生用 AI 代答考核？',
    a: '考核采用模拟面试式口述作答，题目结合每位学生的练习记录逐人生成；AI 反馈只给思路建议，最终评分由教师完成，并计入过程性评价。',
  },
  {
    q: '两套皮肤有什么区别？',
    a: '纸感是浅卡其纸面：靛蓝强调、点阵底纹、轻阴影，适合日常学习与操作；夜读是浅象牙纸：衬线标题、朱砂批注、近直角，适合阅读与展示场景。',
  },
]
const openFaq = ref(-1)
function toggleFaq(i) {
  openFaq.value = openFaq.value === i ? -1 : i
}

/* ---------- 章节数据 ---------- */
const pains = [
  {
    pain: '大班练习机会不足',
    detail: '只有个别组能上台演练，多数一学期没开口练过一次',
    module: '一人一题练习',
    fix: '每位学生自选章节与题型，AI 出题、开口作答、三维反馈，练习记录计入过程性评价。',
  },
  {
    pain: '课前预习没有抓手',
    detail: '不知道带着什么问题来上课，预习流于形式',
    module: '课前案例征集',
    fix: '提交感兴趣案例，AI 辅助整理摘要与知识标签，老师选用后在课程主页置顶展示。',
  },
  {
    pain: '考核和实际运用脱节',
    detail: '一张试卷定成绩，考完就忘，练用分离',
    module: 'AI 模拟面试考核',
    fix: '结合个人练习记录逐人生题，口述作答，AI 反馈加教师评分，评分计入成绩。',
  },
  {
    pain: '学生背景差异大',
    detail: '经管类与工科类同班听课，理解起点完全不同',
    module: '学科背景引擎',
    fix: '同一章节，管理类学生拿到企业管理情境，工科类学生拿到工程管理与生产运营情境。',
  },
  {
    pain: '功能入口找不到',
    detail: '说一句「我想交作业」，找不到对应的菜单',
    module: '对话式意图跳转',
    fix: '本地规则引擎秒回可点击卡片，直达作业、练习、案例与考核页面，未命中才转大模型。',
  },
]

const benefits = [
  {
    stat: '5 个模块',
    title: '全周期闭环',
    body: '案例征集、一人一题、模拟面试、评分反馈贯穿课前到课末，数据在模块之间流动，而不是各管一段。',
  },
  {
    stat: '2 个引擎',
    title: '个性化训练',
    body: '学科背景引擎切换取材方向；过程性评价引擎让练过的题决定考你的题，薄弱章节自动加大权重。',
  },
  {
    stat: '3 张学情图',
    title: '教师一屏治理',
    body: '圈选出题、批量复核、一键发布；学习趋势、章节掌握度、学生分层三图联看，需要关注的学生自动浮现。',
  },
  {
    stat: '0 安装',
    title: '开箱即可演示',
    body: '浏览器打开即用，Web 与手机 H5 共用一套数据；OpenAI 兼容协议，页面上即可切换任意大模型。',
  },
]

const steps = [
  {
    no: '01',
    title: '圈人定范围',
    body: '教师勾选目标学生，划定章节、题型与难度，提交 AI 出题。',
  },
  {
    no: '02',
    title: '逐人生成题目',
    body: 'AI 读取每位学生的练习记录，薄弱章节自动加权，生成附参考要点的模拟面试题。',
  },
  {
    no: '03',
    title: '复核发布与评分',
    body: '教师逐题编辑或批量通过后发布；学生口述作答获得 AI 反馈，教师评分计入成绩。',
  },
]

const stats = [
  { num: '86', unit: '名', label: '在课学生' },
  { num: '48', unit: '学时', label: '教学周期覆盖' },
  { num: '5', unit: '个', label: '教学模块闭环' },
  { num: '39', unit: '项', label: '自动化断言' },
]

const facts = [
  '13 项断言走真实大模型链路，出题到反馈全流程验证',
  '默认接入阶跃星辰，可切换任意 OpenAI 兼容模型',
  '仿真数据加本地存储，无后端也可完整演示',
]

/* ---------- 观察器：滚动显现 + tagline 逐词点亮 ---------- */
let revealObserver = null
let taglineObserver = null

onMounted(() => {
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-revealed')
        revealObserver.unobserve(entry.target)
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  )
  document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el))

  const taglineEl = document.querySelector('.tagline-text')
  if (taglineEl) {
    taglineObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-lit')
          taglineObserver.unobserve(entry.target)
        }
      },
      { threshold: 0.35 },
    )
    taglineObserver.observe(taglineEl)
  }

  if (!reduceMotion()) logTimer = setInterval(rotateLog, 2200)

  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (scrollFrame) cancelAnimationFrame(scrollFrame)
  if (logTimer) clearInterval(logTimer)
  revealObserver?.disconnect()
  taglineObserver?.disconnect()
})

/* ---------- 工具 ---------- */
const reduceMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function scrollToId(id) {
  menuOpen.value = false
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' })
}

function scrollTop() {
  menuOpen.value = false
  window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' })
}
</script>

<style scoped>
/* 动效基曲线：全场唯一 */
.landing {
  --ease-base: cubic-bezier(0.22, 1, 0.36, 1);
  background: var(--page-bg);
  color: var(--text-main);
  font-family: var(--font-body);
  min-height: 100vh;
}

.container {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
}

.container-narrow {
  max-width: 760px;
}

/* ---------- 跳转主内容链接（无障碍） ---------- */
.skip-link {
  position: absolute;
  left: -9999px;
  top: 8px;
  z-index: 200;
  padding: 8px 12px;
  background: var(--card-bg);
  color: var(--text-main);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
}

.skip-link:focus-visible {
  left: 16px;
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ================= 运行台通用质感 ================= */
/* 遥测网格线：hero 与终局面板的底纹，径向遮罩自然消退 */
.grid-overlay {
  position: relative;
}

.grid-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: 48px 48px;
  -webkit-mask-image: radial-gradient(640px 420px at 50% 0%, #000 0%, transparent 78%);
  mask-image: radial-gradient(640px 420px at 50% 0%, #000 0%, transparent 78%);
}

/* HUD 角标：青色取景框边角 */
.hud-corners::before,
.hud-corners::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border: 0 solid var(--accent);
  pointer-events: none;
}

.hud-corners::before {
  top: -1px;
  left: -1px;
  border-top-width: 2px;
  border-left-width: 2px;
}

.hud-corners::after {
  bottom: -1px;
  right: -1px;
  border-bottom-width: 2px;
  border-right-width: 2px;
}

/* 脉冲状态点：运行台「活着」的签名 */
.live-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
  animation: pulseDot 2s var(--ease-base) infinite;
}

@keyframes pulseDot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* ================= 导航 ================= */
.nav {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: calc(100% - 32px);
  max-width: 1120px;
}

.nav-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 56px;
  padding: 0 8px 0 16px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--card-border);
  background: color-mix(in srgb, var(--card-bg) 82%, transparent);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  transition: background 300ms var(--ease-base), box-shadow 300ms var(--ease-base),
    border-color 300ms var(--ease-base);
}

.nav.is-scrolled .nav-inner {
  background: color-mix(in srgb, var(--card-bg) 96%, transparent);
  box-shadow: 0 4px 20px rgba(74, 62, 38, 0.1);
  border-color: color-mix(in srgb, var(--accent) 24%, var(--card-border));
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-main);
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
}

.nav-mark {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: var(--accent-on);
  font-size: 14px;
  font-weight: 600;
  box-shadow: var(--glow-accent);
}

.nav-live {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  border-radius: var(--radius-pill);
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 1px;
  white-space: nowrap;
}

.nav-links {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.nav-links a {
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-sub);
  font-size: 14px;
  transition: color 300ms var(--ease-base), background 300ms var(--ease-base);
}

.nav-links a:hover {
  color: var(--accent);
  background: var(--divider);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.skin-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-pill);
  background: var(--card-bg);
  color: var(--text-sub);
  font-size: 12px;
  cursor: pointer;
  transition: color 300ms var(--ease-base), border-color 300ms var(--ease-base),
    transform 500ms var(--ease-base);
}

.skin-btn svg {
  width: 14px;
  height: 14px;
}

.skin-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.skin-btn:active {
  transform: scale(0.98);
}

.nav-cta {
  height: 32px;
  padding: 0 12px;
  font-size: 14px;
}

/* 汉堡按钮：两段线条，开关心形互变 */
.nav-burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 32px;
  height: 32px;
  padding: 0 7px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  cursor: pointer;
}

.nav-burger span {
  display: block;
  height: 1.5px;
  background: var(--text-main);
  border-radius: 2px;
  transition: transform 500ms var(--ease-base), opacity 300ms var(--ease-base);
}

.nav-burger[aria-expanded='true'] span:first-child {
  transform: translateY(3.25px) rotate(45deg);
}

.nav-burger[aria-expanded='true'] span:last-child {
  transform: translateY(-3.25px) rotate(-45deg);
}

/* 移动端全高面板 */
.nav-panel {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 32px;
  padding: 96px 32px 48px;
  overflow-y: auto;
  background: color-mix(in srgb, var(--page-bg) 94%, transparent);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  opacity: 0;
  visibility: hidden;
  transition: opacity 500ms var(--ease-base), visibility 500ms var(--ease-base);
}

.nav-panel.open {
  opacity: 1;
  visibility: visible;
}

.panel-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-links a {
  padding: 12px 8px;
  border-bottom: 1px solid var(--divider);
  color: var(--text-main);
  font-size: 20px;
  font-weight: 600;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 500ms var(--ease-base), transform 500ms var(--ease-base);
  transition-delay: calc(var(--i) * 60ms);
}

.nav-panel.open .panel-links a {
  opacity: 1;
  transform: none;
}

.panel-cta {
  align-self: flex-start;
  height: 40px;
  padding: 0 16px;
  font-size: 16px;
}

/* ================= 按钮 ================= */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: var(--btn-radius);
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  cursor: pointer;
  transition: background 300ms var(--ease-base), color 300ms var(--ease-base),
    border-color 300ms var(--ease-base), transform 500ms var(--ease-base),
    box-shadow 300ms var(--ease-base);
}

.btn-primary {
  background: var(--accent);
  color: var(--accent-on);
}

.btn-primary:hover {
  background: var(--accent-deep);
  transform: translateY(-1px);
  box-shadow: var(--glow-accent);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-ghost {
  background: transparent;
  color: var(--text-main);
  border-color: var(--card-border);
}

.btn-ghost:hover {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-1px);
}

.btn-ghost:active {
  transform: scale(0.98);
}

.btn:focus-visible,
.nav-links a:focus-visible,
.skin-btn:focus-visible,
.nav-burger:focus-visible,
.faq-q:focus-visible,
.footer-links a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ================= Hero ================= */
.hero {
  padding: 96px 0 80px;
  background: var(--hero-bg);
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
}

.kicker {
  margin: 0 0 12px;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2px;
}

.sec-no {
  margin-right: 8px;
  color: var(--accent);
}

.hero-title {
  margin: 0 0 24px;
  max-width: 680px;
  font-family: var(--font-title);
  font-size: 44px;
  font-weight: var(--title-weight);
  line-height: 1.14;
  letter-spacing: var(--title-tracking);
  text-wrap: balance;
  /* 全页唯一渐变：hero 标题文字（冷白 → 遥测蓝） */
  background: linear-gradient(95deg, var(--hero-text), var(--link));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-sub {
  margin: 0 0 32px;
  max-width: 680px;
  color: var(--hero-sub);
  font-size: 16px;
  line-height: 28px;
  text-wrap: pretty;
}

.cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.cta-center {
  justify-content: center;
}

.hero-proof {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 24px 0 0;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 20px;
}

.proof-dot {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--ok);
  box-shadow: 0 0 8px var(--ok);
}

/* ---------- hero 视觉：实况遥测面板 ---------- */
.hero-visual {
  position: relative;
}

.console-panel {
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--card-bg) 88%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  box-shadow: var(--card-shadow);
}

.cp-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--divider);
  font-family: var(--font-mono);
  font-size: 12px;
}

.cp-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--accent);
  font-weight: 600;
  letter-spacing: 1px;
}

.cp-title {
  color: var(--text-sub);
}

.cp-clock {
  margin-left: auto;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}

.cp-log {
  margin: 0;
  padding: 12px 16px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-bottom: 1px solid var(--divider);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 18px;
}

.cp-log li {
  display: flex;
  gap: 8px;
}

.cp-log li:last-child {
  animation: logIn 400ms var(--ease-base);
}

@keyframes logIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.log-time {
  flex: none;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.log-text {
  color: var(--text-sub);
}

.cp-feedback {
  padding: 16px;
  border-bottom: 1px solid var(--divider);
}

.cp-sub {
  margin: 0 0 12px;
  color: var(--text-sub);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 1px;
}

.fc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.fc-name {
  flex: none;
  width: 56px;
  color: var(--text-main);
  font-size: 12px;
}

.fc-bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--divider);
  overflow: hidden;
}

.fc-bar i {
  display: block;
  height: 100%;
  border-radius: 2px;
  animation: barGrow 900ms var(--ease-base) 350ms both;
}

@keyframes barGrow {
  from {
    width: 0;
  }
  to {
    width: var(--w);
  }
}

.fc-score {
  flex: none;
  width: 24px;
  color: var(--text-sub);
  font-family: var(--font-mono);
  font-size: 12px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.fc-note {
  margin: 12px 0 0;
  color: var(--text-sub);
  font-size: 12px;
  line-height: 18px;
}

.cp-queue {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  padding: 12px 16px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 12px;
}

.cp-queue b {
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

/* ================= Tagline reveal ================= */
.tagline {
  padding: 80px 0;
  border-top: 1px solid var(--divider);
}

.tagline-text {
  margin: 0;
  max-width: 680px;
  font-family: var(--font-title);
  font-size: 36px;
  font-weight: var(--title-weight);
  line-height: 40px;
  letter-spacing: var(--title-tracking);
  text-wrap: balance;
}

.tagline-text .tk {
  opacity: 0.3; /* 基色文字 30% 透明度起步 */
  transition: opacity 500ms var(--ease-base);
  transition-delay: calc(var(--i) * 90ms);
}

.tagline-text.is-lit .tk {
  opacity: 1;
}

/* 终端光标：逐词点亮后驻留闪烁 */
.tk-caret {
  display: inline-block;
  width: 4px;
  height: 0.88em;
  margin-left: 6px;
  vertical-align: -0.06em;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
  animation: caretBlink 1.1s steps(1) infinite;
}

@keyframes caretBlink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

/* ================= 通用章节 ================= */
.section {
  padding: 80px 0;
}

.section-alt {
  background: var(--card-bg);
  border-top: 1px solid var(--divider);
  border-bottom: 1px solid var(--divider);
}

.sec-head {
  max-width: 680px;
  margin-bottom: 48px;
}

.sec-head-mid {
  margin-top: 80px;
}

.sec-head h2 {
  margin: 0 0 16px;
  font-family: var(--font-title);
  font-size: 30px;
  font-weight: var(--title-weight);
  line-height: 36px;
  letter-spacing: var(--title-tracking);
  text-wrap: balance;
}

.sec-lead {
  margin: 0;
  color: var(--text-sub);
  font-size: 16px;
  line-height: 28px;
  text-wrap: pretty;
}

/* ---------- 痛点列表：模块行 ---------- */
.pain-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pain-row {
  display: grid;
  grid-template-columns: 1fr 48px 1fr;
  gap: 16px;
  align-items: center;
  padding: 24px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  transition: border-color 300ms var(--ease-base);
}

.pain-row:hover {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--card-border));
}

.pain-code {
  margin: 0 0 4px;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 1px;
}

.pain-left h3 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}

.pain-left p {
  margin: 0;
  color: var(--text-sub);
  font-size: 14px;
  line-height: 20px;
}

.pain-arrow {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  justify-self: center;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
}

.pain-arrow svg {
  width: 16px;
  height: 16px;
}

.pain-module {
  display: inline-block;
  margin: 0 0 4px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
}

.pain-fix {
  margin: 0;
  color: var(--text-main);
  font-size: 14px;
  line-height: 22px;
}

/* ---------- 亮点卡片：bento（首卡横贯） ---------- */
.benefit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.benefit-card {
  padding: 24px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  transition: transform 500ms var(--ease-base), border-color 300ms var(--ease-base),
    box-shadow 300ms var(--ease-base);
}

.benefit-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent) 45%, var(--card-border));
}

.benefit-card:first-child {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 240px 1fr;
  column-gap: 32px;
}

.benefit-card:first-child .benefit-stat {
  grid-column: 1;
  margin-bottom: 8px;
}

.benefit-card:first-child h3 {
  grid-column: 1;
}

.benefit-card:first-child .benefit-body {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
}

.benefit-stat {
  display: inline-block;
  margin: 0 0 12px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.benefit-card h3 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
}

.benefit-body {
  margin: 0;
  color: var(--text-sub);
  font-size: 14px;
  line-height: 22px;
}

/* ---------- 三步 ---------- */
.step-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  counter-reset: step;
}

.step {
  position: relative;
  padding: 24px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: var(--page-bg);
}

.step-no {
  display: block;
  margin-bottom: 12px;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 18px var(--accent-ring);
}

.step h3 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
}

.step p {
  margin: 0;
  color: var(--text-sub);
  font-size: 14px;
  line-height: 22px;
}

/* ---------- 数据带 ---------- */
.stat-band {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 32px 24px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
}

.stat {
  text-align: center;
}

.stat + .stat {
  border-left: 1px solid var(--divider);
}

.stat-num {
  margin: 0 0 4px;
  color: var(--text-main);
  font-family: var(--font-mono);
  font-size: 30px;
  font-weight: 700;
  line-height: 36px;
  font-variant-numeric: tabular-nums;
}

.stat-unit {
  margin-left: 2px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-sub);
}

.stat-label {
  margin: 0;
  color: var(--text-sub);
  font-size: 12px;
  line-height: 16px;
}

/* ---------- 界面实证 ---------- */
.exhibit {
  margin: 24px 0 0;
}

.shot-frame {
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.shot-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--divider);
  font-family: var(--font-mono);
  font-size: 12px;
}

.shot-bar i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--divider);
}

.shot-bar > span:first-of-type {
  margin-left: 8px;
  color: var(--text-faint);
}

.shot-live {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  color: var(--accent);
  letter-spacing: 1px;
}

.shot {
  display: block;
  width: 100%;
  height: auto;
}

.exhibit-cap {
  margin: 12px 0 0;
  text-align: center;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 18px;
}

.fact-list {
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fact-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--text-sub);
  font-size: 14px;
  line-height: 22px;
}

.fact-list svg {
  width: 16px;
  height: 16px;
  flex: none;
  margin-top: 3px;
  color: var(--ok);
}

/* ---------- FAQ ---------- */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.faq-item {
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: var(--page-bg);
  overflow: hidden;
}

.faq-q {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 16px;
  border: none;
  background: transparent;
  color: var(--text-main);
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  text-align: left;
  cursor: pointer;
  transition: color 300ms var(--ease-base);
}

.faq-q:hover {
  color: var(--accent);
}

.faq-idx {
  margin-right: 8px;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
}

.faq-chev {
  width: 16px;
  height: 16px;
  flex: none;
  color: var(--text-sub);
  transition: transform 300ms var(--ease-base);
}

.faq-item.open .faq-chev {
  transform: rotate(180deg);
}

.faq-a {
  padding: 0 16px 16px;
}

.faq-a p {
  margin: 0;
  color: var(--text-sub);
  font-size: 14px;
  line-height: 22px;
}

.faq-enter-active,
.faq-leave-active {
  transition: opacity 300ms var(--ease-base), transform 300ms var(--ease-base);
}

.faq-enter-from,
.faq-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ---------- 终局 CTA：终端面板 ---------- */
.final {
  padding: 96px 0;
  text-align: center;
}

.final-panel {
  padding: 64px 32px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  background: var(--hero-bg);
  overflow: hidden;
}

.final h2 {
  margin: 0 0 16px;
  font-family: var(--font-title);
  font-size: 36px;
  font-weight: var(--title-weight);
  line-height: 40px;
  letter-spacing: var(--title-tracking);
  text-wrap: balance;
}

.final-sub {
  margin: 0 auto 32px;
  max-width: 680px;
  color: var(--text-sub);
  font-size: 16px;
  line-height: 28px;
}

.final-note {
  margin: 24px 0 0;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 16px;
}

/* ---------- 页脚 ---------- */
.footer {
  padding: 48px 0;
  border-top: 1px solid var(--divider);
  background: var(--card-bg);
}

.footer-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.footer-tag {
  margin: 2px 0 0;
  color: var(--text-sub);
  font-size: 12px;
}

.footer-links {
  display: flex;
  gap: 16px;
  margin-left: auto;
}

.footer-links a {
  color: var(--text-sub);
  font-size: 14px;
  transition: color 300ms var(--ease-base);
}

.footer-links a:hover {
  color: var(--accent);
}

.footer-meta {
  flex: 1 0 100%;
  margin: 0;
  padding-top: 24px;
  border-top: 1px solid var(--divider);
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 16px;
}

/* ================= 滚动显现（上浮 32px，700ms，只播一次） ================= */
[data-reveal] {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 700ms var(--ease-base), transform 700ms var(--ease-base);
}

[data-reveal].is-revealed {
  opacity: 1;
  transform: none;
}

/* ================= 响应式 ================= */
@media (max-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 64px;
  }

  .hero-visual {
    max-width: 640px;
  }

  .benefit-card:first-child {
    grid-column: auto;
    display: block;
  }

  .benefit-card:first-child .benefit-stat,
  .benefit-card:first-child h3,
  .benefit-card:first-child .benefit-body {
    grid-column: auto;
    grid-row: auto;
  }

  .benefit-card:first-child .benefit-stat {
    margin-bottom: 12px;
  }

  .step-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .nav-links,
  .nav-live {
    display: none;
  }

  .nav-burger {
    display: flex;
  }

  .skin-btn span {
    display: none;
  }

  .skin-btn {
    padding: 0 8px;
  }

  .pain-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .pain-arrow {
    transform: rotate(90deg);
  }

  .stat-band {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  .stat:nth-child(odd) {
    border-left: none;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 96px 0 64px;
  }

  .hero-title {
    font-size: 30px;
    line-height: 36px;
  }

  .tagline-text {
    font-size: 30px;
    line-height: 36px;
  }

  .final h2 {
    font-size: 30px;
    line-height: 36px;
  }

  .sec-head h2 {
    font-size: 24px;
    line-height: 32px;
  }

  .section {
    padding: 64px 0;
  }

  .tagline {
    padding: 64px 0;
  }

  .final {
    padding: 64px 0;
  }

  .final-panel {
    padding: 48px 20px;
  }

  .footer-grid {
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-links {
    margin-left: 0;
  }
}

/* ================= 动效减弱 ================= */
@media (prefers-reduced-motion: reduce) {
  .landing *,
  .landing *::before,
  .landing *::after {
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
  }

  [data-reveal] {
    opacity: 1;
    transform: none;
  }

  .tagline-text .tk {
    opacity: 1;
  }

  .panel-links a {
    opacity: 1;
    transform: none;
  }

  .live-dot,
  .tk-caret,
  .cp-log li:last-child {
    animation: none;
  }

  .tk-caret {
    opacity: 1;
  }

  .fc-bar i {
    animation: none;
    width: var(--w);
  }
}
</style>
