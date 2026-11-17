/** 自动生成的有理数演示课程 —— scripts/generate-rational-course.mjs 产出，请勿手改。
 * 重新生成：npm run gen:rational-course（密钥读 ~/.workbuddy/models.json 的 step-5-preview）
 * 生成时间：2026-11-17T07:24:23.220Z｜模型：step-5-preview
 */

export const DEMO_COURSE_RATIONAL_META = {
  "generatedAt": "2026-11-17T07:24:23.220Z",
  "model": "step-5-preview",
  "source": "D:/临时/七年级/01有理数（22 个原视频精炼，见 scripts/data/rational-materials.md）",
  "durationMinutes": 40,
  "sceneCount": 8,
  "lectureCount": 4,
  "quizCount": 1,
  "practiceCount": 2,
  "reviewCount": 1,
  "boardSceneCount": 5,
  "questionCount": 2,
  "scriptBeatCount": 128,
  "validation": {
    "passed": true,
    "errorCount": 0,
    "warningCount": 0,
    "coverage": 1,
    "durationDrift": 0,
    "codes": []
  },
  "ledger": {
    "total": 37,
    "supportRate": 0.432,
    "unsupportedRate": 0.568
  },
  "remainingErrorIssues": [],
  "stats": {
    "blueprintCalls": 1,
    "sceneCalls": 8,
    "sceneRepairCalls": 0,
    "scriptCalls": 8,
    "sceneFallbacks": 0,
    "scriptFallbacks": 0,
    "deterministicRepairs": 0,
    "modelRepairs": 0
  }
}

export const DEMO_COURSE_RATIONAL_PROJECT = {
  "id": "course-demo-youshushu",
  "ownerId": "",
  "status": "ready",
  "title": "有理数：从正负分界到混合运算",
  "chapter": "有理数",
  "domain": "math7",
  "objective": "掌握有理数的核心概念与全章运算：正负数的意义、有理数概念与分类、数轴、相反数、绝对值及其非负性、大小比较、加减乘除乘方与混合运算、科学记数法，能用「奇负偶正」等口诀定符号、按步骤规范运算",
  "audience": "七年级学生（刚学完小学正数，第一次系统接触负数）",
  "mode": "course",
  "durationMinutes": 40,
  "summary": "本课解决七年级有理数入门难、运算符号易错的问题。学完能建立正负数框架，掌握数轴、相反数、绝对值等核心概念，规范完成加减乘除乘方与混合运算，并用科学记数法表示大数。",
  "languageDirective": "授课用为师/徒儿人设，第二人称对话式行文，短句为主。重要规则后紧跟最小例子，口诀用奇负偶正、除变乘等大白话。",
  "learnerProfile": {
    "stage": "junior",
    "stageLabel": "初中",
    "gradeLabel": "七年级",
    "language": "短句、具体名词和生活化提问，先讲\"它像什么\"，再给正式名称。",
    "teaching": "用温度计、正数国火拼、汪星人散步等故事和分步示范；优先设计可点击的分步演示、口头预测和即时反馈。",
    "board": "板书以一条清晰路线、一个形象比喻和2—4帧分步演示为主，避免同时堆放多个抽象概念。",
    "subject": "数学",
    "confidence": "high",
    "evidence": "用户明确\"七年级学生（刚学完小学正数，第一次系统接触负数）\"",
    "source": "explicit"
  },
  "outlines": [
    {
      "id": "scene_1",
      "type": "lecture",
      "title": "温度计分界：正负数与有理数入门",
      "description": "开场三件套：回顾锚点——小学只学过正数和0，从没写过比0小的数；热身提问——温度计上零下5度到底该记成什么；动机问题——要是没有负数，\"欠款3元\"和\"零下5度\"怎么区分？从温度计分界引出正负数，再讲有理数概念与分类，告诉你有限小数循环小数都是分数，π却不是。",
      "teachingObjective": "能说出正负数的相对意义，0非正非负；能把给定数按整数/分数和正负分类。",
      "keyPoints": [
        "正负数意义",
        "有理数概念与分类"
      ],
      "takeaways": [
        "0是正负分界点，非正非负",
        "有限小数和循环小数都看作分数",
        "分类两把尺子：整数分数、正负符号，结果都是五类"
      ],
      "difficultyTier": 1,
      "estimatedMinutes": 4,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "recommend",
        "score": 40,
        "reasons": [
          "数量结构（有理数、分数）",
          "过程与变换（循环）",
          "对照与分类（分类）"
        ]
      },
      "order": 1
    },
    {
      "id": "scene_2",
      "type": "lecture",
      "title": "数轴上的双胞胎：相反数与绝对值",
      "description": "从温度计抽象出数轴三要素。用汪星人散步的故事讲绝对值：从原点出发走3个单位长度，向左到-3、向右到3，到原点的距离都是3。再讲相反数：数轴上关于原点对称的一对点数，0的相反数还是0。",
      "teachingObjective": "会画数轴并标出相反数；会用距离定义求绝对值。",
      "keyPoints": [
        "数轴",
        "相反数",
        "绝对值"
      ],
      "takeaways": [
        "a的相反数是-a，-(-5)=5",
        "正数绝对值是本身，负数绝对值是相反数",
        "0的相反数是0，0的绝对值是0"
      ],
      "difficultyTier": 1,
      "estimatedMinutes": 4,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "recommend",
        "score": 40,
        "reasons": [
          "几何关系（对称）",
          "数量结构（数轴、相反数、绝对值）",
          "学段偏低，交互优先于文字推导"
        ]
      },
      "order": 2
    },
    {
      "id": "scene_3",
      "type": "lecture",
      "title": "火拼与巡逻：大小比较和加减法则",
      "description": "用正数国/负数国火拼的故事讲加减法则：同号相加能量累加，异号相加火拼抵消。用警察南北大道巡逻区分最终位置和总路程。再讲绝对值非负性：两个非负数相加得0，只能每个都是0。最后用数轴比大小，左小右大，特别强调负数之间数值越大数反而越小。",
      "teachingObjective": "掌握加减法法则和大小比较方法；理解非负性用途。",
      "keyPoints": [
        "绝对值非负性",
        "有理数大小比较",
        "有理数加减法"
      ],
      "takeaways": [
        "两个非负数相加得0，只能每个都是0",
        "负数比较：数值越大，数反而越小",
        "同号累加符号不变，异号抵消符号跟大的"
      ],
      "difficultyTier": 2,
      "estimatedMinutes": 4,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "recommend",
        "score": 50,
        "reasons": [
          "运动与受力（路程）",
          "数量结构（绝对值、数轴、有理数）",
          "对照与分类（比较）"
        ]
      },
      "order": 3
    },
    {
      "id": "scene_4",
      "type": "practice",
      "title": "加减混合巧算实战",
      "description": "错解先行：先让你试试-3又2/3+6.3-2又1/3，很多徒儿会直接按顺序算或者换位置丢符号。咱用减法变加法、凑整搬家、带分数化假分数来秒杀。再来一道警察巡逻综合题，求位置带符号相加，求路程不带符号。",
      "teachingObjective": "规范完成加减混合运算，会用凑整简化。",
      "keyPoints": [
        "有理数加减法",
        "减法变加法",
        "凑整与带符号搬家"
      ],
      "takeaways": [
        "减去一个数等于加上它的相反数",
        "换位置必须带符号，负数不能裸奔",
        "总路程不带符号，最终位置带符号"
      ],
      "difficultyTier": 2,
      "estimatedMinutes": 6,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "recommend",
        "score": 40,
        "reasons": [
          "运动与受力（路程）",
          "数量结构（分数、有理数）",
          "学段偏低，交互优先于文字推导"
        ]
      },
      "order": 4
    },
    {
      "id": "scene_5",
      "type": "lecture",
      "title": "向后转与指数管辖：乘除乘方",
      "description": "多个负数相乘怎么办？数负号，奇负偶正。除变乘、小数化分数。重点讲指数管辖范围：没括号指数只管紧挨的数，有括号管整个括号。-5²=-25，(-5)²=25。用杨幂不叫杨乘方的段子记住底数、指数、幂。混合运算顺序与小学相同，先括号再乘除后加减。",
      "teachingObjective": "掌握乘除法则、乘方意义和指数管辖范围。",
      "keyPoints": [
        "有理数乘除法",
        "有理数乘方",
        "有理数混合运算"
      ],
      "takeaways": [
        "多个负因数：奇负偶正",
        "-5²=-25，(-5)²=25，括号决定指数管辖",
        "除变乘、小数化分数、先括号再乘除后加减"
      ],
      "difficultyTier": 3,
      "estimatedMinutes": 5,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "skip",
        "score": 16,
        "reasons": [
          "数量结构（分数、有理数）"
        ]
      },
      "order": 5
    },
    {
      "id": "scene_6",
      "type": "practice",
      "title": "混合运算与科学记数法应用",
      "description": "综合练习含乘方、绝对值、乘除的混合运算，练\"遇除变乘再约分\"和\"绝对值先算\"。再练科学记数法：a×10ⁿ中a的整数部分必须是一位非零数，10的指数等于小数点移动的位数。近似数四舍五入，精确到千位要回原数找数位。",
      "teachingObjective": "规范完成含乘方、绝对值、乘除的混合运算；会用科学记数法表示数。",
      "keyPoints": [
        "有理数混合运算",
        "科学记数法"
      ],
      "takeaways": [
        "有乘方先算乘方，再乘除后加减",
        "科学记数法中a的整数部分必须是一位非零数",
        "10的指数等于小数点移动的位数"
      ],
      "difficultyTier": 3,
      "estimatedMinutes": 7,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "skip",
        "score": 16,
        "reasons": [
          "数量结构（绝对值、约分、有理数）"
        ]
      },
      "order": 6
    },
    {
      "id": "scene_7",
      "type": "quiz",
      "title": "有理数核心快问快答",
      "description": "3道快问快答覆盖概念、运算和易错点。有选择题考\"哪个不是有理数\"，判断题考\"-5²=25\"这个经典错误，填空题考绝对值和相反数。错哪儿改哪儿，搞懂为止。",
      "teachingObjective": "检测对核心概念和易错点的掌握。",
      "keyPoints": [
        "有理数概念辨析",
        "有理数运算规范",
        "易错点排查"
      ],
      "takeaways": [
        "0非正非负，相反数是本身",
        "负数比较数值越大数越小",
        "指数管辖范围决定符号"
      ],
      "difficultyTier": 3,
      "estimatedMinutes": 5,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "optional",
        "score": 26,
        "reasons": [
          "数量结构（有理数、绝对值、相反数）",
          "对照与分类（易错、辨析）",
          "学段偏低，交互优先于文字推导"
        ]
      },
      "order": 7
    },
    {
      "id": "scene_8",
      "type": "review",
      "title": "特殊值复盘与方法清单",
      "description": "总结时间到。为师带你复盘0、1、-1的特殊性质：相反数是本身只有0，绝对值是本身是非负数，倒数是本身是±1，平方是本身是0和1，立方是本身是0、±1。再盘点全章口诀：奇负偶正、除变乘、小数化分数、负数不能裸奔、指数管辖范围。最后CTA：为师这就讲完了，徒儿们速速刷题去吧。",
      "teachingObjective": "记住特殊值性质，形成全章方法清单。",
      "keyPoints": [
        "特殊值综合",
        "全章运算口诀",
        "概念方法清单"
      ],
      "takeaways": [
        "相反数是本身只有0；绝对值是本身是非负数；倒数是本身是±1",
        "平方是本身是0和1；立方是本身是0、±1",
        "奇负偶正、除变乘、小数化分数、指数管辖范围、非负相加得0则每项为0"
      ],
      "difficultyTier": 3,
      "estimatedMinutes": 5,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "skip",
        "score": 16,
        "reasons": [
          "数量结构（相反数、绝对值、倒数）"
        ]
      },
      "order": 8
    }
  ],
  "sourceChunkIds": [],
  "sources": [],
  "scenes": [
    {
      "outlineId": "scene_1",
      "status": "ready",
      "content": {
        "kind": "board",
        "lesson": {
          "chapter": "有理数",
          "title": "温度计分界：正负数与有理数入门",
          "subtitle": "从温度计0℃分界出发，搞懂正负数、0的位置和有理数分类",
          "blocks": [
            {
              "type": "outline",
              "title": "本节路线图",
              "items": [
                "温度计分界：正负数是什么",
                "有理数：整数和分数的统称",
                "两把尺子分出五类",
                "错解放大镜：0去哪类"
              ],
              "persistent": true,
              "id": "b1"
            },
            {
              "type": "definition",
              "title": "核心概念",
              "term": "正数与负数",
              "definition": "比0大的数是正数，比0小的数是负数；0是正负分界点，非正非负。",
              "concreteAnchor": "温度计上，零上5℃记 +5℃，零下5℃记 -5℃，0℃就是分界。",
              "analogy": "温度计0℃像国界：0上面住正数国，0下面住负数国，0是关口本身，不姓正也不姓负。",
              "method": [
                "先找0刻度",
                "再看在0上方还是下方",
                "上方写正号可省略，下方写负号"
              ],
              "verify": "回读符号，看它是不是表示了相反意义的量。",
              "id": "b2"
            },
            {
              "type": "simulation",
              "model": "number-line",
              "title": "动手看：数轴上的0分界",
              "params": {
                "a": -5,
                "b": 3
              },
              "observe": [
                "只把 a 从 -5 拉到 0，看点从0左边移到分界点",
                "只把 b 从 3 移到 -2，看点穿过0，从正数变负数",
                "保持 a=-5、b=3 不动，说出一个在0左、一个在0右"
              ],
              "linkConcept": "正数与负数",
              "caption": "先读定义，再拖参数验证它",
              "id": "b3"
            },
            {
              "type": "animation",
              "title": "跟着变化看：从温度计到数轴",
              "caption": "点下一步，一次只改一个条件",
              "steps": [
                {
                  "label": "温度计分界",
                  "detail": "0℃上5度记 +5℃，下5度记 -5℃；0不姓正也不姓负。"
                },
                {
                  "label": "放平成像数轴",
                  "detail": "0℃变原点，向右为正，向左为负；点跨过0时符号改变。"
                },
                {
                  "label": "小数归分数",
                  "detail": "0.7=7/10，0.33…=1/3，都看作分数；π不是有理数。"
                }
              ],
              "id": "b4"
            },
            {
              "type": "classification-tree",
              "title": "有理数怎么分",
              "root": {
                "label": "有理数",
                "note": "整数和分数的统称，能写成两个整数之比"
              },
              "branches": [
                {
                  "label": "整数",
                  "note": "正整数、0、负整数；4/2=2 算整数",
                  "children": [
                    {
                      "label": "正整数",
                      "note": "1, 2, 3…"
                    },
                    {
                      "label": "0",
                      "note": "分界点，非正非负"
                    },
                    {
                      "label": "负整数",
                      "note": "-1, -2…"
                    }
                  ]
                },
                {
                  "label": "分数",
                  "note": "有限小数、循环小数都看作分数",
                  "children": [
                    {
                      "label": "正分数",
                      "note": "1/5、0.7、0.33…"
                    },
                    {
                      "label": "负分数",
                      "note": "-1/5、-0.7、-0.111…"
                    }
                  ]
                }
              ],
              "caption": "π是无限不循环小数，不是有理数；分类别漏负数。",
              "stages": [
                {
                  "label": "第一把尺子：先分整数和分数",
                  "branches": [
                    0,
                    1
                  ],
                  "expand": []
                },
                {
                  "label": "展开整数：0单独一类",
                  "branches": [
                    0,
                    1
                  ],
                  "expand": [
                    0
                  ]
                },
                {
                  "label": "展开分数：有限循环小数都算分数",
                  "branches": [
                    0,
                    1
                  ],
                  "expand": [
                    0,
                    1
                  ]
                }
              ],
              "grow": "staged",
              "id": "b5"
            },
            {
              "type": "wrong-first",
              "title": "这道题先看错解",
              "wrongSteps": [
                "看到零下5度，就记 +5",
                "觉得0比正数小，所以0是负数",
                "分类时把0放进负数一类"
              ],
              "errorIndex": 0,
              "errorHint": "先找0刻度：零下在0下面，该记负；0是分界点，不姓正也不姓负。",
              "correctSteps": [
                "零上5℃记 +5℃，零下5℃记 -5℃",
                "0是分界点，非正非负",
                "分类时0单独一类，别塞进正数或负数"
              ],
              "takeaway": "0是正负分界点，非正非负。",
              "id": "b6"
            },
            {
              "type": "question",
              "title": "停下来想一想",
              "prompt": "徒儿，哪个数不是有理数？",
              "options": [
                "0.333…",
                "-0.7",
                "π",
                "4/2"
              ],
              "transition": {
                "enter": "pop",
                "durationMs": 420
              },
              "id": "b7"
            }
          ]
        },
        "sourceChunkIds": []
      },
      "script": {
        "persona": "亦师亦友的七年级数学老师，自称「为师」称学生「徒儿」，像大哥哥给弟弟妹妹讲题，多用提问推进",
        "beats": [
          {
            "kind": "question",
            "text": "徒儿，这段课，为师要和你聊聊温度计上的正负分界。你肯定见过温度计，对不对？那零上5度和零下5度，明明都是5，到底差在哪儿？",
            "pauseMs": 1800,
            "blockId": "b1",
            "emphasis": [
              "温度计",
              "差在哪儿"
            ]
          },
          {
            "kind": "answer",
            "text": "差在方向。零上是从0往上走，零下是从0往下走。小学你只玩过正数，今天负数要登场了。我们把它写在旁边，这就是有理数世界的起点，也是分界的开始。",
            "pauseMs": 800,
            "blockId": "b1",
            "emphasis": [
              "方向",
              "负数登场"
            ]
          },
          {
            "kind": "question",
            "text": "那么问题来了。温度计正中间那个0度，到底是正数还是负数？有小伙伴说0是正数，毕竟它写在上面。你同意吗？再想一想。",
            "pauseMs": 1800,
            "blockId": "b3",
            "emphasis": [
              "0度",
              "正数还是负数"
            ]
          },
          {
            "kind": "answer",
            "text": "0既不是正数，也不是负数。它是分界点，是中立国。正数在0上面，负数在0下面。你牢记一点，0只负责分界。",
            "pauseMs": 800,
            "blockId": "b2",
            "emphasis": [
              "不是正数",
              "不是负数",
              "分界点"
            ]
          },
          {
            "kind": "confirm",
            "text": "对喽。0就是那条分界线，正数大于0，负数小于0。这个感觉要秒懂，做题时一眼就要看出来，千万别搞混了。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "等等，难道温度计只能看温度吗？咱把温度计横过来放，让0对着一个原点，会得到什么？有小伙伴说，这就是一把特殊的尺子。你猜是什么？",
            "pauseMs": 1800,
            "blockId": "b4",
            "emphasis": [
              "横过来",
              "特殊的尺子"
            ]
          },
          {
            "kind": "answer",
            "text": "对喽，这就是数轴。温度计上的刻度搬到直线上，0是原点，向右为正，向左为负。每个数都能找到自己的家，位置清清楚楚，一目了然。",
            "pauseMs": 800,
            "blockId": "b4",
            "emphasis": [
              "数轴",
              "原点",
              "向右为正"
            ]
          },
          {
            "kind": "question",
            "text": "那么问题来了。整数能分正负，分数行不行？有小伙伴说，有理数就是整数的集合。你站出来说说，这话到底漏掉了谁？",
            "pauseMs": 1800,
            "blockId": "b5",
            "emphasis": [
              "分数行不行",
              "漏掉了谁"
            ]
          },
          {
            "kind": "answer",
            "text": "他漏掉了分数。整数和分数，统称为有理数。小数也能化成分数，所以也算有理数。咱给它分分类，写在旁边，别漏项。",
            "pauseMs": 800,
            "blockId": "b5",
            "emphasis": [
              "整数和分数",
              "统称为有理数"
            ]
          },
          {
            "kind": "question",
            "text": "来，刷道小题。把3、-2、0、-0.5、1/2分类。有小伙伴说-0.5不是有理数，因为它是小数。你快点说说，他错在哪儿？",
            "pauseMs": 1800,
            "blockId": "b6",
            "emphasis": [
              "分类",
              "-0.5"
            ]
          },
          {
            "kind": "answer",
            "text": "哎呀，他二了。-0.5能化成分数-1/2，当然是分数，是有理数。正数：3、1/2。负数：-2、-0.5。0单独站，谁家也不进。",
            "pauseMs": 800,
            "blockId": "b6",
            "emphasis": [
              "化成分数",
              "0单独站"
            ]
          },
          {
            "kind": "confirm",
            "text": "妥妥好用。判断有理数，你就看它能不能写成分数。小数先化分数，千万别被外表骗了，这是秒杀技巧，刷题时直接套用。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "特别提醒你注意。徒儿，看这道题：哪个数不是有理数？有小伙伴说带省略号的 0.333… 不是，难道对吗？停下来想一想，再告诉为师。",
            "pauseMs": 1800,
            "blockId": "b7",
            "emphasis": [
              "正数国",
              "负数国",
              "谁更冷"
            ]
          },
          {
            "kind": "answer",
            "text": "0.333…是循环小数，能化成分数三分之一，是有理数；-0.7是有限小数，也是有理数；4/2等于2，是整数；只有π是无限不循环小数，写不成两个整数之比，所以它不是有理数。判断有理数，就看能不能化成分数，这是秒杀技巧。",
            "pauseMs": 800,
            "blockId": "b7",
            "emphasis": [
              "越往下越冷",
              "-5小于-3"
            ]
          },
          {
            "kind": "recall",
            "text": "总结时间到。第一，正负数表示相反意义的量。第二，0非正非负，是分界。第三，有理数包括整数和分数。你牢记这三点。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "cta",
            "text": "徒儿们速速刷题去吧。把今天的正负分界搞定，有理数入门就欧了。错题圈出来，下节课为师带你秒杀混合运算，妥妥好用。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          }
        ],
        "sceneTitle": "温度计分界：正负数与有理数入门",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"lecture\",\"title\":\"温度计分界：正负数与有理数入门\",\"description\":\"开场三件套：回顾锚点——小学只学过正数和0，从没写过比0小的数；热身提问——温度计上零下5度到底该记成什么；动机问题——要是没有负数，\\\"欠款3元\\\"和\\\"零下5度\\\"怎么区分？从温度计分界引出正负数，再讲有理数概念与分类，告诉你有限小数循环小数都是分数，π却不是。\",\"objective\":\"能说出正负数的相对意义，0非正非负；能把给定数按整数/分数和正负分类。\",\"keyPoints\":[\"正负数意义\",\"有理数概念与分类\"]}",
      "evidence": [
        {
          "id": "cl_6",
          "target": "b2",
          "kind": "definition",
          "text": "正数与负数：比0大的数是正数，比0小的数是负数；0是正负分界点，非正非负。",
          "evidenceIds": []
        },
        {
          "id": "cl_7",
          "target": "b6",
          "kind": "example",
          "text": "正解：零上5℃记 +5℃，零下5℃记 -5℃ → 0是分界点，非正非负 → 分类时0单独一类，别塞进正数或负数",
          "evidenceIds": []
        },
        {
          "id": "cl_8",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：能说出正负数的相对意义，0非正非负；能把给定数按整数/分数和正负分类。",
          "evidenceIds": [
            "ev_3"
          ]
        },
        {
          "id": "cl_9",
          "target": "scene",
          "kind": "criterion",
          "text": "能指出本场景中一个仍待核对的疑问或边界",
          "evidenceIds": [
            "ev_3"
          ]
        }
      ],
      "subjectIssues": [
        {
          "code": "MATH_PARSE_UNSUPPORTED",
          "severity": "warning",
          "target": "b6",
          "message": "步骤无法解析为可判定算式，跳过数学检查",
          "fix": null
        },
        {
          "code": "MATH_PARSE_UNSUPPORTED",
          "severity": "warning",
          "target": "b6",
          "message": "步骤无法解析为可判定算式，跳过数学检查",
          "fix": null
        }
      ],
      "repairs": [],
      "error": ""
    },
    {
      "outlineId": "scene_2",
      "status": "ready",
      "content": {
        "kind": "board",
        "lesson": {
          "chapter": "有理数",
          "title": "数轴上的双胞胎：相反数与绝对值",
          "subtitle": "从温度计到数轴，用汪星人散步把相反数和绝对值一次搞清。",
          "blocks": [
            {
              "type": "outline",
              "title": "本节路线图",
              "items": [
                "温度计→数轴三要素",
                "汪星人散步→绝对值",
                "原点对称→相反数",
                "0 的相反数和绝对值",
                "错解纠正加追问"
              ],
              "persistent": true,
              "id": "b1"
            },
            {
              "type": "definition",
              "title": "核心概念",
              "term": "相反数与绝对值",
              "definition": "只有符号不同的两个数互为相反数，a 的相反数是 -a，0 的相反数是 0；数轴上表示数 a 的点到原点的距离叫做 a 的绝对值，记 |a|。",
              "concreteAnchor": "数轴上有 -3 和 3 一对；汪星人从原点出发，向左或向右都走 3 个单位长度，到原点的距离都是 3。",
              "analogy": "相反数像原点两侧的双胞胎；绝对值像回家距离，不讲方向只讲距离。",
              "method": [
                "求相反数：在前面添负号，-(-5)=5",
                "求绝对值：先判断符号，正数取本身，负数取相反数，0 取 0"
              ],
              "verify": "回数轴上看：两点关于原点对称，到原点距离相等。",
              "marks": [
                {
                  "target": "相反数",
                  "style": "box"
                },
                {
                  "target": "绝对值",
                  "style": "box"
                }
              ],
              "id": "b2"
            },
            {
              "type": "simulation",
              "model": "number-line",
              "title": "动手看：双胞胎和距离",
              "params": {
                "a": -3,
                "b": 3
              },
              "observe": [
                "保持 b=3 不动，只把 a 从 -3 拖到 0，看两点还关于原点对称吗",
                "保持 a=-3 不动，只把 b 从 3 拖到 -3，看两个点到原点的距离怎么变",
                "只把 a 拖到 0，看 b 要到哪里才重新成为原点对称的一对"
              ],
              "linkConcept": "相反数与绝对值",
              "caption": "先读定义，再拖参数验证它。",
              "id": "b3"
            },
            {
              "type": "animation",
              "title": "跟着汪星人走三步",
              "caption": "点下一步：每次只改方向，距离不变。",
              "steps": [
                {
                  "label": "起点",
                  "detail": "汪星人站在原点，位置是 0。"
                },
                {
                  "label": "只改方向：向左",
                  "detail": "向左走 3 个单位长度，位置变成 -3，到原点距离是 3。"
                },
                {
                  "label": "只改方向：向右",
                  "detail": "向右走 3 个单位长度，位置变成 3，到原点距离还是 3。"
                }
              ],
              "id": "b4"
            },
            {
              "type": "number-line",
              "title": "在数轴上定位 -3 和 3",
              "min": -5,
              "max": 5,
              "span": 10,
              "ticks": [
                {
                  "value": -5,
                  "label": "-5"
                },
                {
                  "value": -3,
                  "label": "-3"
                },
                {
                  "value": 0,
                  "label": "0"
                },
                {
                  "value": 3,
                  "label": "3"
                },
                {
                  "value": 5,
                  "label": "5"
                }
              ],
              "points": [
                {
                  "value": -3,
                  "label": "-3",
                  "tone": "negative"
                },
                {
                  "value": 0,
                  "label": "原点",
                  "tone": "neutral"
                },
                {
                  "value": 3,
                  "label": "3",
                  "tone": "positive"
                }
              ],
              "segments": [
                {
                  "from": -3,
                  "to": 0,
                  "label": "距离 3",
                  "tone": "negative"
                },
                {
                  "from": 0,
                  "to": 3,
                  "label": "距离 3",
                  "tone": "positive"
                }
              ],
              "caption": "原点、正方向、单位长度，三要素齐了；-3 和 3 关于原点对称，两段距离一样。",
              "id": "b5"
            },
            {
              "type": "table",
              "title": "三个数，一张表看清",
              "columns": [
                "数",
                "相反数",
                "绝对值",
                "一句话提醒"
              ],
              "rows": [
                [
                  "5",
                  "-5",
                  "5",
                  "正数的绝对值是它本身"
                ],
                [
                  "-3",
                  "3",
                  "3",
                  "负数的绝对值是它的相反数"
                ],
                [
                  "0",
                  "0",
                  "0",
                  "0 的相反数和绝对值都是 0"
                ]
              ],
              "id": "b6"
            },
            {
              "type": "wrong-first",
              "title": "先看错解：0 被漏掉了",
              "wrongSteps": [
                "|a|=a，所以 a 一定是正数",
                "相反数等于本身的数除了 0，还有 1"
              ],
              "errorIndex": 0,
              "errorHint": "0 非正非负，被你漏掉了。",
              "correctSteps": [
                "|a|=a 时，a 可以是正数，也可以是 0，合起来是非负数",
                "相反数等于本身的只有 0；绝对值等于本身的是正数和 0",
                "特别提醒你注意：0 的相反数是 0，0 的绝对值也是 0"
              ],
              "takeaway": "特殊值记混：0 是分界，非正非负；但它的相反数和绝对值都是本身。",
              "id": "b7"
            },
            {
              "type": "question",
              "title": "停下来想一想",
              "prompt": "有小伙伴说：0 非正非负，所以 0 没有相反数。你同意吗？",
              "options": [
                "同意，0 没有相反数",
                "不同意，0 的相反数是 0",
                "同意，0 的绝对值也没有",
                "不同意，0 的相反数是 1"
              ],
              "transition": {
                "enter": "pop",
                "durationMs": 420
              },
              "id": "b8"
            }
          ]
        },
        "sourceChunkIds": []
      },
      "script": {
        "persona": "亦师亦友的七年级数学老师，自称为师，称学生徒儿，善用提问和大白话口诀推进课堂",
        "beats": [
          {
            "kind": "question",
            "text": "这段课，为师要和你聊聊数轴上的双胞胎。你肯定见过温度计，零上零下就一条线。看路线图：数轴、相反数、绝对值，三关打通，期末题直接秒杀。徒儿们，准备好了吗？",
            "pauseMs": 1800,
            "blockId": "b1",
            "emphasis": [
              "双胞胎",
              "三关打通",
              "秒杀"
            ]
          },
          {
            "kind": "answer",
            "text": "正数国和负数国火拼，总得有个裁判。数轴就是裁判：原点、正方向、单位长度，缺一不可。你牢记一点，画线先标原点，再定方向，最后刻格子。原点右边第三格是+3，左边第三格是-3。",
            "pauseMs": 800,
            "blockId": "b2",
            "emphasis": [
              "三要素",
              "先标原点"
            ]
          },
          {
            "kind": "question",
            "text": "那么问题来了，+3和-3，这俩货长得不像，咋回事？等等，难道它们只是符号不同吗？有小伙伴说，它俩肯定认识。咱动手看，把这对双胞胎请出来，在数轴上溜溜。",
            "pauseMs": 1800,
            "blockId": "b3",
            "emphasis": [
              "符号不同",
              "双胞胎"
            ]
          },
          {
            "kind": "answer",
            "text": "只有符号不同的两个数，叫互为相反数。比如+3的相反数是-3，-3的相反数是+3。0的相反数是0，它自己和自己配对。绝对值的事，咱下一步说。",
            "pauseMs": 800,
            "blockId": "b3",
            "emphasis": [
              "互为相反数",
              "0的相反数是0"
            ]
          },
          {
            "kind": "confirm",
            "text": "对喽。你牢记一点，相反数是成对出现的，就像双胞胎，单独一个不算。这点期中必考，可别马虎。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "answer",
            "text": "徒儿，动笔。在数轴上定位-3和3。它俩关于原点对称，像照镜子。警察巡逻，从原点出发，路程一样。特别提醒你注意，单位长度要统一。画好标在旁边。",
            "pauseMs": 800,
            "blockId": "b5",
            "emphasis": [
              "关于原点对称",
              "单位长度统一"
            ]
          },
          {
            "kind": "question",
            "text": "那么问题来了。想象你养了条汪星人，从原点散步。它走到-3，再走到3，问：离原点多远？等等，难道-3比3近吗？有小伙伴说，绝对值就是去负号，对吗？",
            "pauseMs": 1800,
            "blockId": "b4",
            "emphasis": [
              "离原点多远",
              "去负号"
            ]
          },
          {
            "kind": "answer",
            "text": "对了一半。绝对值用距离定义：数a对应的点到原点的距离。所以-3的绝对值是3，3的绝对值也是3。距离没有负的，绝对值永远非负。这是易错点，再强调一遍。",
            "pauseMs": 800,
            "blockId": "b4",
            "emphasis": [
              "距离定义",
              "永远非负"
            ]
          },
          {
            "kind": "answer",
            "text": "看表。-3的相反数是3，绝对值是3；0的相反数是0，绝对值是0；3的相反数是-3，绝对值是3。发现没？互为相反数的两数，绝对值相等。做题直接套，欧了。",
            "pauseMs": 800,
            "blockId": "b6",
            "emphasis": [
              "绝对值相等",
              "直接套"
            ]
          },
          {
            "kind": "question",
            "text": "再看错解。有小伙伴写：-3的相反数是3，3的相反数是-3，0的相反数没有。等等，难道0被漏掉了吗？有小伙伴说，0就是0，不用配对。看看错在哪。",
            "pauseMs": 1800,
            "blockId": "b7",
            "emphasis": [
              "0被漏掉",
              "不用配对"
            ]
          },
          {
            "kind": "answer",
            "text": "0是正负分界，就像温度计的0度。0的相反数就是0，绝对值也是0。有小伙伴说0不用配对，哎呀我二了，0自己就是一档。",
            "pauseMs": 800,
            "blockId": "b7",
            "emphasis": [
              "正负分界",
              "自己就是一档"
            ]
          },
          {
            "kind": "confirm",
            "text": "对喽。我再强调一遍，0的相反数和绝对值都是它自己，妥妥的。做题时0最容易被漏掉，你可长点心吧。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "停下来想一想。如果a的绝对值等于a，a可能是几？如果a的绝对值等于-a，a可能是几？这两个问题搞懂，绝对值就通了。徒儿，动脑子，三十秒。",
            "pauseMs": 1800,
            "blockId": "b8",
            "emphasis": [
              "等于a",
              "等于-a"
            ]
          },
          {
            "kind": "answer",
            "text": "想好了吗？a的绝对值等于a，a是非负数；等于-a，a是非正数。所以绝对值大于等于0，铁律。这节课的三件套齐活了，再难臣妾做不到呀，不存在。",
            "pauseMs": 800,
            "blockId": "b8",
            "emphasis": [
              "非负数",
              "非正数",
              "铁律"
            ]
          },
          {
            "kind": "recall",
            "text": "总结时间到，就三点。第一，数轴三要素：原点、方向、单位长度。第二，相反数是双胞胎，符号不同，0的相反数是0。第三，绝对值是距离，永远非负。刷题不慌。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "cta",
            "text": "这节课就到这。数轴画好，双胞胎认准，距离算清。徒儿们速速刷题去吧，课后习题前三道热身，后两道拔高，搞定它们，欧了。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          }
        ],
        "sceneTitle": "数轴上的双胞胎：相反数与绝对值",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"lecture\",\"title\":\"数轴上的双胞胎：相反数与绝对值\",\"description\":\"从温度计抽象出数轴三要素。用汪星人散步的故事讲绝对值：从原点出发走3个单位长度，向左到-3、向右到3，到原点的距离都是3。再讲相反数：数轴上关于原点对称的一对点数，0的相反数还是0。\",\"objective\":\"会画数轴并标出相反数；会用距离定义求绝对值。\",\"keyPoints\":[\"数轴\",\"相反数\",\"绝对值\"]}",
      "evidence": [
        {
          "id": "cl_22",
          "target": "b2",
          "kind": "definition",
          "text": "相反数与绝对值：只有符号不同的两个数互为相反数，a 的相反数是 -a，0 的相反数是 0；数轴上表示数 a 的点到原点的距离叫做 a 的绝对值，记 |a|。",
          "evidenceIds": []
        },
        {
          "id": "cl_23",
          "target": "b7",
          "kind": "example",
          "text": "正解：|a|=a 时，a 可以是正数，也可以是 0，合起来是非负数 → 相反数等于本身的只有 0；绝对值等于本身的是正数和 0 → 特别提醒你注意：0 的相反数是 0，0 的绝对值也是 0",
          "evidenceIds": []
        },
        {
          "id": "cl_24",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：会画数轴并标出相反数；会用距离定义求绝对值。",
          "evidenceIds": [
            "ev_3"
          ]
        },
        {
          "id": "cl_25",
          "target": "scene",
          "kind": "criterion",
          "text": "能指出本场景中一个仍待核对的疑问或边界",
          "evidenceIds": [
            "ev_3"
          ]
        }
      ],
      "subjectIssues": [
        {
          "code": "MATH_PARSE_UNSUPPORTED",
          "severity": "warning",
          "target": "b7",
          "message": "步骤无法解析为可判定算式，跳过数学检查",
          "fix": null
        },
        {
          "code": "MATH_PARSE_UNSUPPORTED",
          "severity": "warning",
          "target": "b7",
          "message": "步骤无法解析为可判定算式，跳过数学检查",
          "fix": null
        }
      ],
      "repairs": [],
      "error": ""
    },
    {
      "outlineId": "scene_3",
      "status": "ready",
      "content": {
        "kind": "board",
        "lesson": {
          "chapter": "有理数",
          "title": "火拼与巡逻：大小比较和加减法则",
          "subtitle": "接着上一场景的数轴与绝对值，用正负数国火拼和警察巡逻，搞定加减法则、位置与路程、数轴比大小。",
          "blocks": [
            {
              "type": "outline",
              "title": "本节路线图",
              "items": [
                "第一站：火拼定加减，符号跟大的",
                "第二站：巡逻分清楚，位置带符号、路程取绝对值",
                "第三站：数轴比大小，左小右大",
                "第四站：非负性秒杀，带走结论去刷题"
              ],
              "persistent": true,
              "id": "b1"
            },
            {
              "type": "definition",
              "title": "核心概念",
              "term": "有理数加法法则",
              "definition": "同号相加，符号不变，绝对值相加；异号相加，取绝对值较大的符号，并用大绝对值减小绝对值；互为相反数的两数相加得 0。",
              "concreteAnchor": "正数国派出 4 人，负数国派出 3 人，火拼后正国多 1 人，所以 4+(-3)=1。",
              "analogy": "徒儿记住：同国人能量累加，异国人火拼抵消，能量值高的胜出，符号跟胜者。",
              "method": [
                "先看两数同号还是异号",
                "同号算绝对值累加，异号算绝对值取差",
                "最后写符号：同号不变，异号跟大的"
              ],
              "verify": "把结果代回最小例子或数轴上，看是否说得通。",
              "id": "b2"
            },
            {
              "type": "simulation",
              "model": "number-line",
              "title": "动手看：数轴上火拼",
              "params": {
                "a": 4,
                "b": -3
              },
              "observe": [
                "保持 a=4 不变，把 b 从 -3 拖到 -6，看哪个点更右、谁的能量大",
                "保持 b=-3 不变，把 a 从 4 拖到 2，看火拼结果怎么变",
                "把 a 和 b 拖成一对相反数，看两点是否关于原点对称"
              ],
              "linkConcept": "有理数加法法则",
              "caption": "先读定义，再拖参数验证它",
              "id": "b3"
            },
            {
              "type": "animation",
              "title": "加减混合：先把减法变加法",
              "caption": "点下一步，一次只变一个条件",
              "steps": [
                {
                  "label": "原始式子",
                  "detail": "-5-3+7+2，有减有加，别急着算。"
                },
                {
                  "label": "只把减号变加号",
                  "detail": "-3 变成 +(-3)，式子写成 -5+(-3)+7+2。"
                },
                {
                  "label": "同号先凑",
                  "detail": "负数 -5+(-3)=-8，正数 7+2=9。"
                },
                {
                  "label": "最后合成",
                  "detail": "-8+9=1，欧了。"
                }
              ],
              "id": "b4"
            },
            {
              "type": "case-table",
              "title": "加法三路对照",
              "dimension": "看符号",
              "cases": [
                {
                  "condition": "同号相加",
                  "conclusion": "符号不变，绝对值累加：(-3)+(-4)=-7",
                  "tone": "positive"
                },
                {
                  "condition": "异号相加",
                  "conclusion": "取绝对值大的符号，数值相减：9+(-6)=3",
                  "tone": "neutral"
                },
                {
                  "condition": "互为相反数",
                  "conclusion": "双双阵亡，和为零：4+(-4)=0",
                  "tone": "neutral"
                }
              ],
              "caption": "",
              "id": "b5"
            },
            {
              "type": "wrong-first",
              "title": "这道题先看错解",
              "wrongSteps": [
                "规定向北为正，警察记录 27 和 -41",
                "总路程 = 27+(-41)=-14 千米",
                "耗油 = 14a 升"
              ],
              "errorIndex": 1,
              "errorHint": "总路程要把每段取绝对值再相加，不能带负号；最终位置才带符号。",
              "correctSteps": [
                "最终位置 = 27+(-41)=-14 千米，在岗亭南边 14 千米",
                "总路程 = |27|+|-41|=68 千米",
                "总耗油 = 68a 升"
              ],
              "takeaway": "位移带符号，路程取绝对值。",
              "id": "b6"
            },
            {
              "type": "number-line",
              "title": "数轴比大小：左小右大",
              "min": -6,
              "max": 4,
              "span": 10,
              "ticks": [
                {
                  "value": -6,
                  "label": "-6"
                },
                {
                  "value": -4,
                  "label": "-4"
                },
                {
                  "value": -2,
                  "label": "-2"
                },
                {
                  "value": 0,
                  "label": "0"
                },
                {
                  "value": 2,
                  "label": "2"
                },
                {
                  "value": 4,
                  "label": "4"
                }
              ],
              "points": [
                {
                  "value": -5,
                  "label": "-5",
                  "tone": "negative"
                },
                {
                  "value": -1,
                  "label": "-1",
                  "tone": "negative"
                },
                {
                  "value": 0,
                  "label": "0",
                  "tone": "neutral"
                },
                {
                  "value": 3,
                  "label": "3",
                  "tone": "positive"
                }
              ],
              "segments": [
                {
                  "from": -5,
                  "to": -1,
                  "label": "往右，数变大",
                  "tone": "negative"
                }
              ],
              "caption": "负数之间数值越大，数反而越小：-5 < -1。",
              "id": "b7"
            },
            {
              "type": "question",
              "title": "停下来想一想",
              "prompt": "下面哪句话对？",
              "options": [
                "-5 > -1",
                "|-2|+|y|=0 时，y=0",
                "总路程可以记成 -14 千米",
                "两个非负数相加得 0，可能一个是正数"
              ],
              "transition": {
                "enter": "pop",
                "durationMs": 420
              },
              "id": "b8"
            }
          ]
        },
        "sourceChunkIds": []
      },
      "script": {
        "persona": "自称师亦友的七年级数学老师，善用火拼、巡逻、汪星人等比喻，短句发问带动思考",
        "beats": [
          {
            "kind": "question",
            "text": "徒儿，这段课，为师要和你聊聊有理数的大小比较和加减法则。你想过没有，正数国和负数国在数轴上火拼，到底谁地盘大？警察巡逻，位置和路程是一回事吗？来，先看路线图，咱一步步搞定。",
            "pauseMs": 1800,
            "blockId": "b1",
            "emphasis": [
              "火拼",
              "地盘"
            ]
          },
          {
            "kind": "recall",
            "text": "先回忆下，绝对值就是汪星人散步走的路程，|-3|等于3，|-5|等于5。我再强调一遍，绝对值表示点到原点的距离，距离没有负数，所以它妥妥非负，这点你千万别忘了，这是根基。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "那么问题来了，要是某数的绝对值等于-2，你觉得存在这样的数吗？有小伙伴说肯定有，难道负数国又派新兵了？绝对值难道能是负的吗？这符合汪星人散步的规矩吗？",
            "pauseMs": 1800,
            "blockId": "b2",
            "emphasis": [
              "非负",
              "距离"
            ]
          },
          {
            "kind": "answer",
            "text": "对喽，不存在。绝对值非负，所以|x|不可能等于负数。你牢记一点，绝对值最小只能是0，比如|0|等于0。这是解题利器，很多压轴题靠它秒杀，为师绝不骗你，妥妥好用。",
            "pauseMs": 800,
            "blockId": "b2",
            "emphasis": [
              "最小是0"
            ]
          },
          {
            "kind": "question",
            "text": "等等，难道-1比-3大吗？温度计上，零下1度和零下3度，哪个更冷？有小伙伴说负数越小越大，难道负数国兵少反而厉害？你仔细想想，别被表面骗了。",
            "pauseMs": 1800,
            "blockId": "b7",
            "emphasis": [
              "左小右大"
            ]
          },
          {
            "kind": "answer",
            "text": "在数轴上，左边小右边大，这是铁律。-3在左，-1在右，所以-3小于-1。特别提醒你注意，两个负数比大小，绝对值大的反而小，比如-5小于-2，妥妥好用。",
            "pauseMs": 800,
            "blockId": "b7",
            "emphasis": [
              "绝对值大的反而小"
            ]
          },
          {
            "kind": "question",
            "text": "有小伙伴说，减法就是加法反过来。那为师问你，5减8等于几？正数国和负数国火拼，5个兵打不过8个兵，最后剩几个？势力往哪边倒？你心里有数吗？",
            "pauseMs": 1800,
            "blockId": "b3",
            "emphasis": [
              "相反数"
            ]
          },
          {
            "kind": "answer",
            "text": "减去一个数，等于加上它的相反数。5减8就是5加-8，等于-3。记住，减法先变加法，这是加减混合的第一步，也是警察巡逻换方向的秘诀，欧了，搞定。",
            "pauseMs": 800,
            "blockId": "b4",
            "emphasis": [
              "减法变加法"
            ]
          },
          {
            "kind": "question",
            "text": "那么问题来了，正数加负数，比如8加-5，结果符号怎么定？难道随便猜吗？有小伙伴说看第一个数，难道8加-10也成正数？这规矩到底怎么破？",
            "pauseMs": 1800,
            "blockId": "b5",
            "emphasis": [
              "符号怎么定"
            ]
          },
          {
            "kind": "answer",
            "text": "那可不行。绝对值相等，和为零；不等时，取大的绝对值，符号跟着大的走。比如8加-5，8的绝对值大，结果就是正3。再比如8加-10，就得-2。收好。",
            "pauseMs": 800,
            "blockId": "b5",
            "emphasis": [
              "符号跟着大的走"
            ]
          },
          {
            "kind": "question",
            "text": "看这道题：-2加3减5。有小伙伴直接从左到右硬算，得-4。难道他做对了吗？步骤规范吗？混合运算能这么裸奔吗？为师看他悬，你说呢？",
            "pauseMs": 1800,
            "blockId": "b6",
            "emphasis": [
              "步骤规范"
            ]
          },
          {
            "kind": "answer",
            "text": "哎呀我二了，得先看减法。-2加3减5，先把减5变成加-5，再算-2加3加-5，结果确实是-4。虽然数对，但混合运算必须先变身，负数不能裸奔，记住了？",
            "pauseMs": 800,
            "blockId": "b6",
            "emphasis": [
              "先变身",
              "不能裸奔"
            ]
          },
          {
            "kind": "question",
            "text": "徒儿，停下来想一想。要是|-x|等于3，x等于几？有小伙伴说就是3，难道没有别的可能了吗？绝对值不是表示距离吗？原点两边都能逛，你明白吗？",
            "pauseMs": 1800,
            "blockId": "b8",
            "emphasis": [
              "两边"
            ]
          },
          {
            "kind": "answer",
            "text": "当然有，x还可以是-3。因为绝对值是距离，原点左右各一个点。这再次说明绝对值非负的用途，看到绝对值，你要立刻想到两边，不能只想一头，欧了。",
            "pauseMs": 800,
            "blockId": "b8",
            "emphasis": [
              "立刻想到两边"
            ]
          },
          {
            "kind": "confirm",
            "text": "总结时间到。第一，绝对值非负，最小是0，方程要两边想；第二，数轴上左小右大，两负比较绝对值大的反而小；第三，减法变加法，符号看绝对值。妥妥的。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "cta",
            "text": "徒儿们速速刷题去吧，把这些法则练到秒杀。记住为师的话，刷题不在多，在于每道题都用对法则，讲究规范步骤，欧了，为师等你好消息！",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          }
        ],
        "sceneTitle": "火拼与巡逻：大小比较和加减法则",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"lecture\",\"title\":\"火拼与巡逻：大小比较和加减法则\",\"description\":\"用正数国/负数国火拼的故事讲加减法则：同号相加能量累加，异号相加火拼抵消。用警察南北大道巡逻区分最终位置和总路程。再讲绝对值非负性：两个非负数相加得0，只能每个都是0。最后用数轴比大小，左小右大，特别强调负数之间数值越大数反而越小。\",\"objective\":\"掌握加减法法则和大小比较方法；理解非负性用途。\",\"keyPoints\":[\"绝对值非负性\",\"有理数大小比较\",\"有理数加减法\"]}",
      "evidence": [
        {
          "id": "cl_14",
          "target": "b2",
          "kind": "definition",
          "text": "有理数加法法则：同号相加，符号不变，绝对值相加；异号相加，取绝对值较大的符号，并用大绝对值减小绝对值；互为相反数的两数相加得 0。",
          "evidenceIds": []
        },
        {
          "id": "cl_15",
          "target": "b6",
          "kind": "example",
          "text": "正解：最终位置 = 27+(-41)=-14 千米，在岗亭南边 14 千米 → 总路程 = |27|+|-41|=68 千米 → 总耗油 = 68a 升",
          "evidenceIds": []
        },
        {
          "id": "cl_16",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：掌握加减法法则和大小比较方法；理解非负性用途。",
          "evidenceIds": [
            "ev_3"
          ]
        },
        {
          "id": "cl_17",
          "target": "scene",
          "kind": "criterion",
          "text": "能指出本场景中一个仍待核对的疑问或边界",
          "evidenceIds": [
            "ev_3"
          ]
        }
      ],
      "subjectIssues": [
        {
          "code": "MATH_PARSE_UNSUPPORTED",
          "severity": "warning",
          "target": "b6",
          "message": "步骤无法解析为可判定算式，跳过数学检查",
          "fix": null
        },
        {
          "code": "MATH_PARSE_UNSUPPORTED",
          "severity": "warning",
          "target": "b6",
          "message": "步骤无法解析为可判定算式，跳过数学检查",
          "fix": null
        }
      ],
      "repairs": [],
      "error": ""
    },
    {
      "outlineId": "scene_4",
      "status": "ready",
      "content": {
        "kind": "practice",
        "prompt": "徒儿，南北大道岗亭旁有本巡逻记录：某交警先向北 3.7 km，再向南 6.3 km，再向北 2.3 km，再向南 4.7 km。为师不直接问你最终位置。你先判断：按记录顺序直接加，和先观察数字特点再调整计算顺序，哪种更符合有理数加减混合的三步口诀？请用概念解释你的判断，再给出具体的计算步骤，并说明你用了哪几步巧算。",
        "referencePoints": [
          "是否先把减法变成加法，将加减混合统一成加法式子，再观察数字特点",
          "是否利用加法交换律、结合律带符号搬家，寻找同号或能凑整的数先算，且符号随数一起走",
          "能否写出统一后的式子，说明分组凑整过程，并给出带符号的最终位置"
        ],
        "rubric": [
          {
            "criterion": "概念判断",
            "weight": 40
          },
          {
            "criterion": "理论依据",
            "weight": 35
          },
          {
            "criterion": "行动建议",
            "weight": 25
          }
        ],
        "followUp": "如果最后两段路也改成向北，你的巧算步骤会变吗？减法变加法后，符号搬家会不会把负号弄丢？",
        "sourceChunkIds": []
      },
      "script": {
        "persona": "自称为师、称学生为徒儿的七年级数学老师，像大哥哥一样用提问和口诀讲题",
        "beats": [
          {
            "kind": "question",
            "text": "这段课，为师要和你聊聊有理数加减混合巧算。你肯定见过一串正负数加减，硬算不仅慢，还容易在符号上栽跟头。想一想，有啥妙招能直接秒杀？",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "加减混合",
              "秒杀"
            ]
          },
          {
            "kind": "answer",
            "text": "来，咱先搭桥。正数国和负数国火拼，加法就是两国合并排队。减法呢，相当于向后转，换成加它的相反数。比如 5 减 3，就是 5 加负 3。这是老底子，你得牢记。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "减法变加法",
              "相反数"
            ]
          },
          {
            "kind": "confirm",
            "text": "对喽。加减混合别害怕，第一步就是把减法统统变成加法。这是地基，地基不牢，地动山摇。你记住，减法只是加法的伪装，别被它忽悠了。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "recall",
            "text": "回顾一下。减法变加法，减去一个数，等于加上它的相反数。相反数就是只有符号不同的俩数，比如 3 和负 3。绝对值是汪星人散步的长度，不管方向。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "那么问题来了。统统变成加法以后，比如负 5 加 3 减 7 加 2，难道只能从左到右硬算吗？有小伙伴说，得按原来顺序算。你咋看？",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "从左到右",
              "顺序"
            ]
          },
          {
            "kind": "answer",
            "text": "当然不用死板。加法有交换律和结合律，带符号搬家随便搬。你牢记一点，数字前面的符号是它的身份证，搬到哪跟到哪。人走，证不能留。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "带符号搬家",
              "身份证"
            ]
          },
          {
            "kind": "confirm",
            "text": "对喽。符号就是身份证，人搬家，证得跟着。特别提醒你注意，搬完家再算，顺序就活了，妥妥好用。千万别光屁股搬数，符号必须带。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "等等，难道只是搬搬家吗？面对负 3.7 加 2.5 加 3.7 这种，有没有更爽的招？有小伙伴说，凑整！你第一反应是找啥？",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "凑整"
            ]
          },
          {
            "kind": "answer",
            "text": "凑整，妥妥的秒杀技。先找互为相反数的，比如 3.7 和负 3.7，一凑就没。再找能凑整的，比如负 3.7 和 2.3 凑成负 1.4。先观察，再动手。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "相反数",
              "凑整"
            ]
          },
          {
            "kind": "confirm",
            "text": "对喽。凑整就是找好朋友，相反数一对消灭，能凑整的抱团。哎呀我二了，差点忘了，小数化分数有时更好凑，你可以灵活换装。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "有小伙伴说，加减混合写成省略加号的和式后，就能随便重排，完全不用管原来顺序，也不用管符号。对吗？你思考一下，再告诉为师。",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "省略加号",
              "重排"
            ]
          },
          {
            "kind": "answer",
            "text": "对一半。省略加号是简化写法，比如负 5 加 3 减 7 加 2，写成负 5、正 3、负 7、正 2。然后带符号搬家，先凑整，再从左往右算，步骤不能乱。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "省略加号",
              "步骤"
            ]
          },
          {
            "kind": "confirm",
            "text": "很好。我再强调一遍，省略加号不是去掉符号，是简化写法。负数不能裸奔，符号必须带着。这是规范，也是保命符，记住了？",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "answer",
            "text": "来道真题练手。算负 5 加 2.5 加 5 减 3.7 加 3.7。先变减法，再搬家，5 和负 5 凑没，负 3.7 和 3.7 凑没，最后得 2.5。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "真题",
              "凑没"
            ]
          },
          {
            "kind": "recall",
            "text": "总结时间到。第一，减法变加法，减去变加反。第二，带符号搬家，符号是身份证。第三，优先凑整，相反数消灭，整数小数抱团。你牢记这三点。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "cta",
            "text": "徒儿们速速刷题去吧。找三道加减混合，用今天招数秒杀。记住减法变加法、带符号搬家、优先凑整。刷完报个到，欧了！",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          }
        ],
        "sceneTitle": "加减混合巧算实战",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"practice\",\"title\":\"加减混合巧算实战\",\"description\":\"错解先行：先让你试试-3又2/3+6.3-2又1/3，很多徒儿会直接按顺序算或者换位置丢符号。咱用减法变加法、凑整搬家、带分数化假分数来秒杀。再来一道警察巡逻综合题，求位置带符号相加，求路程不带符号。\",\"objective\":\"规范完成加减混合运算，会用凑整简化。\",\"keyPoints\":[\"有理数加减法\",\"减法变加法\",\"凑整与带符号搬家\"]}",
      "evidence": [
        {
          "id": "cl_31",
          "target": "scene",
          "kind": "reference",
          "text": "是否先把减法变成加法，将加减混合统一成加法式子，再观察数字特点",
          "evidenceIds": []
        },
        {
          "id": "cl_32",
          "target": "scene",
          "kind": "reference",
          "text": "是否利用加法交换律、结合律带符号搬家，寻找同号或能凑整的数先算，且符号随数一起走",
          "evidenceIds": []
        },
        {
          "id": "cl_33",
          "target": "scene",
          "kind": "reference",
          "text": "能否写出统一后的式子，说明分组凑整过程，并给出带符号的最终位置",
          "evidenceIds": []
        },
        {
          "id": "cl_34",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：规范完成加减混合运算，会用凑整简化。",
          "evidenceIds": [
            "ev_3"
          ]
        },
        {
          "id": "cl_35",
          "target": "scene",
          "kind": "criterion",
          "text": "能指出本场景中一个仍待核对的疑问或边界",
          "evidenceIds": [
            "ev_3"
          ]
        }
      ],
      "subjectIssues": [],
      "repairs": [],
      "error": ""
    },
    {
      "outlineId": "scene_5",
      "status": "ready",
      "content": {
        "kind": "board",
        "lesson": {
          "chapter": "有理数",
          "title": "向后转与指数管辖：乘除乘方",
          "subtitle": "数负号定符号，看括号定地盘，混合运算按规矩来",
          "blocks": [
            {
              "type": "outline",
              "title": "本节路线图",
              "items": [
                "乘除先变身：除变乘、小数化分数",
                "负号排队：奇负偶正",
                "指数管辖：括号说了算",
                "混合顺序：先括号再乘除后加减"
              ],
              "persistent": true,
              "id": "b1"
            },
            {
              "type": "definition",
              "title": "核心概念",
              "term": "乘方与指数管辖",
              "definition": "求 n 个相同因数相乘的积叫乘方。底数是挨着指数的数，指数站在右上角管着底数。没括号时指数只管紧挨的那个数；有括号时指数管整个括号里的数。",
              "concreteAnchor": "你看 -5² 和 (-5)²，长得像双胞胎，结果一个 -25 一个 25，差老远了。",
              "analogy": "指数像个小队长，没括号时只罩着身边那个数；加了括号，地盘扩大到整个括号。那个明星可不叫杨乘方，叫杨幂！",
              "method": [
                "先找底数：看指数紧挨着谁，括号算不算",
                "再数负号：多个负因数相乘，奇负偶正",
                "最后算数：除变乘、小数化分数，从左到右"
              ],
              "verify": "算完回来看一眼：-5² 的底数是 5 不是 -5；(-5)² 的底数才是 -5。",
              "id": "b2"
            },
            {
              "type": "animation",
              "title": "跟着括号看地盘",
              "caption": "点下一步，只看括号怎么改变指数的管辖范围",
              "steps": [
                {
                  "label": "没括号",
                  "detail": "-5²：指数只管 5，符号在管辖外，等于 -(5×5) = -25"
                },
                {
                  "label": "加括号",
                  "detail": "(-5)²：指数管整个 -5，底数变成 -5，等于 (-5)×(-5) = 25"
                },
                {
                  "label": "分数一个理",
                  "detail": "(-2/5)² 管整个分数得 4/25；-(2/5)² 只管 2/5，负号在外得 -4/25"
                },
                {
                  "label": "回头验证",
                  "detail": "先问自己：指数紧挨着谁？括号在不在？答案就错不了"
                }
              ],
              "id": "b3"
            },
            {
              "type": "case-table",
              "title": "指数管辖情形表",
              "dimension": "括号与符号的位置",
              "cases": [
                {
                  "condition": "-5²（没括号）",
                  "conclusion": "指数只管 5，负号在外，结果 -25",
                  "tone": "negative"
                },
                {
                  "condition": "(-5)²（有括号）",
                  "conclusion": "指数管整个 -5，负负得正，结果 25",
                  "tone": "positive"
                },
                {
                  "condition": "(-2/5)²（括号包整个分数）",
                  "conclusion": "符号参与乘方，分子分母各自平方，结果 4/25",
                  "tone": "positive"
                },
                {
                  "condition": "-(2/5)²（括号在分数外）",
                  "conclusion": "负号在管辖外，先算 (2/5)²=4/25，再取相反数，结果 -4/25",
                  "tone": "negative"
                }
              ],
              "caption": "",
              "id": "b4"
            },
            {
              "type": "wrong-first",
              "title": "这道题先看错解",
              "wrongSteps": [
                "算 -5² + (-5)²，有小伙伴嘴快：-5² 就是 (-5)×(-5)=25，所以 25+25=50",
                "算 12÷(-2)×3，他挑好算的先算：12÷(-6)=-2"
              ],
              "errorIndex": 0,
              "errorHint": "先查 -5² 的底数是谁；再查乘除混合是不是除了变乘、从左到右",
              "correctSteps": [
                "-5² 的底数是 5，得 -25；(-5)² 的底数是 -5，得 25，两者相加为 0",
                "除变乘：12×(-1/2)×3，从左到右算得 -18"
              ],
              "takeaway": "括号决定指数管辖；乘除混合必须除变乘后从左到右，不能挑好算的",
              "id": "b5"
            },
            {
              "type": "question",
              "title": "停下来想一想",
              "prompt": "徒儿，-3² + (-3)² 等于多少？",
              "options": [
                "0",
                "18",
                "-18",
                "-9"
              ],
              "transition": {
                "enter": "pop",
                "durationMs": 420
              },
              "id": "b6"
            },
            {
              "type": "columns",
              "title": "混合运算保命三步",
              "columns": [
                {
                  "heading": "先括号",
                  "items": [
                    "有括号先算括号里",
                    "括号里先乘方再乘除后加减"
                  ]
                },
                {
                  "heading": "再乘除",
                  "items": [
                    "除变乘，除以一个数等于乘它的倒数",
                    "小数化分数，方便约分",
                    "从左到右，绝不挑好算的"
                  ]
                },
                {
                  "heading": "后加减",
                  "items": [
                    "减法变加法",
                    "负数参与下一步先加括号，别裸奔"
                  ]
                }
              ],
              "caption": "",
              "id": "b7"
            }
          ]
        },
        "sourceChunkIds": []
      },
      "script": {
        "persona": "自称师长的七年级数学老师，口语化短句，爱提问，亦师亦友带徒儿刷题",
        "beats": [
          {
            "kind": "question",
            "text": "徒儿们，这段课，为师要和你聊聊有理数的乘除乘方。已学正负分界，现在正数国和负数国要火拼了，你怕不怕？我们先看路线图，再上高速。",
            "pauseMs": 1800,
            "blockId": "b1",
            "emphasis": [
              "乘除乘方",
              "正负分界",
              "路线图"
            ]
          },
          {
            "kind": "answer",
            "text": "本节路线很简单：先定符号，再算数值。乘除看负号个数，乘方看指数管辖，混合运算按步骤来，千万别跳步。",
            "pauseMs": 800,
            "blockId": "b1",
            "emphasis": [
              "先定符号",
              "再算数值",
              "指数管辖"
            ]
          },
          {
            "kind": "recall",
            "text": "回想一下，温度计上零度是分界，正数国和负数国，向后转就是负负得正。汪星人散步，绝对值管距离，不管方向，警察巡逻看位置，这些基础你都学过，别忘干净。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": [
              "温度计",
              "向后转",
              "汪星人散步"
            ]
          },
          {
            "kind": "question",
            "text": "那么问题来了，负二乘负三到底等于几？等等，难道负负还得负吗？有小伙伴说等于负六，你同意吗？先自己想一想，再回答，别急着下结论。",
            "pauseMs": 1800,
            "blockId": "b2",
            "emphasis": [
              "负二乘负三",
              "负负得正"
            ]
          },
          {
            "kind": "answer",
            "text": "错！负负得正。负二乘负三等于六。同号得正，异号得负，再把绝对值相乘。除法记住除变乘，负十二除负三，变成乘负三分之一，结果得四。",
            "pauseMs": 800,
            "blockId": "b2",
            "emphasis": [
              "同号得正",
              "异号得负",
              "除变乘"
            ]
          },
          {
            "kind": "confirm",
            "text": "对喽，负负得正，咱向后转。除变乘，符号照旧。你牢记一点：符号优先，数值靠边站，千万别搞反。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "向后转",
              "符号优先"
            ]
          },
          {
            "kind": "question",
            "text": "现在看乘方。括号负二的平方，和负二的平方，难道真的一样吗？有小伙伴说一样，都等于四。你分得清吗？想一想，再告诉为师。",
            "pauseMs": 1800,
            "blockId": "b3",
            "emphasis": [
              "括号负二的平方",
              "负二的平方"
            ]
          },
          {
            "kind": "answer",
            "text": "哎呀我二了，这俩不一样！括号负二的平方，指数管整个负二，等于四。负二的平方没括号，指数只管二，等于负四。",
            "pauseMs": 800,
            "blockId": "b3",
            "emphasis": [
              "括号地盘",
              "指数只管二"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，括号就是地盘。负数不能裸奔，要平方先穿括号衣。特别提醒你注意，括号是保命符，千万别忘了，不然真的臣妾做不到呀。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "负数不能裸奔",
              "括号是保命符"
            ]
          },
          {
            "kind": "question",
            "text": "特别提醒你注意，指数管辖到底管到哪？括号负三的立方，和负三的平方，你分得清吗？难道都等于负二十七吗？先自己想一想，再回答。",
            "pauseMs": 1800,
            "blockId": "b4",
            "emphasis": [
              "指数管辖",
              "括号负三的立方"
            ]
          },
          {
            "kind": "answer",
            "text": "看情形表。有括号，指数管所有：括号负三的立方等于负二十七。没括号，指数只管前面那个数：负三的平方等于负九。",
            "pauseMs": 800,
            "blockId": "b4",
            "emphasis": [
              "有括号",
              "没括号",
              "奇负偶正"
            ]
          },
          {
            "kind": "question",
            "text": "来道真题热身。先看错解：有小伙伴嘴快，说 -5² 就是 (-5)×(-5)=25，所以 -5²+(-5)²=25+25=50。等等，难道这波没毛病吗？你再仔细看看。",
            "pauseMs": 1800,
            "blockId": "b5",
            "emphasis": [
              "错解",
              "括号负一的平方"
            ]
          },
          {
            "kind": "answer",
            "text": "错！-5² 的指数只管 5，底数是 5，得 -25；(-5)² 的指数管整个 -5，得 25。所以 -25+25=0，不是 50。括号决定指数管辖，这个坑年年有人踩，我再强调一遍。",
            "pauseMs": 800,
            "blockId": "b5",
            "emphasis": [
              "指数只管二",
              "有括号"
            ]
          },
          {
            "kind": "question",
            "text": "混合运算保命三步，你还记得吗？总结时间到，为师考你，乘除看什么？乘方看什么？混合运算先干嘛？快想一想，速速回答。",
            "pauseMs": 1800,
            "blockId": "b6",
            "emphasis": [
              "保命三步",
              "总结时间到"
            ]
          },
          {
            "kind": "answer",
            "text": "第一步定符号，奇负偶正；第二步算数值，绝对值先算；第三步查括号，指数管辖别越界。乘除同号得正，除变乘；乘方看括号；混合先符号后数值。你牢记一点：负数不能裸奔。",
            "pauseMs": 800,
            "blockId": "b7",
            "emphasis": [
              "定符号",
              "算数值",
              "查括号"
            ]
          },
          {
            "kind": "cta",
            "text": "徒儿们速速刷题去吧，把这些口诀用起来：奇负偶正管符号，括号地盘管乘方，混合三步走，秒杀有理数运算。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "速速刷题",
              "秒杀"
            ]
          }
        ],
        "sceneTitle": "向后转与指数管辖：乘除乘方",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"lecture\",\"title\":\"向后转与指数管辖：乘除乘方\",\"description\":\"多个负数相乘怎么办？数负号，奇负偶正。除变乘、小数化分数。重点讲指数管辖范围：没括号指数只管紧挨的数，有括号管整个括号。-5²=-25，(-5)²=25。用杨幂不叫杨乘方的段子记住底数、指数、幂。混合运算顺序与小学相同，先括号再乘除后加减。\",\"objective\":\"掌握乘除法则、乘方意义和指数管辖范围。\",\"keyPoints\":[\"有理数乘除法\",\"有理数乘方\",\"有理数混合运算\"]}",
      "evidence": [
        {
          "id": "cl_62",
          "target": "b2",
          "kind": "definition",
          "text": "乘方与指数管辖：求 n 个相同因数相乘的积叫乘方。底数是挨着指数的数，指数站在右上角管着底数。没括号时指数只管紧挨的那个数；有括号时指数管整个括号里的数。",
          "evidenceIds": []
        },
        {
          "id": "cl_63",
          "target": "b5",
          "kind": "example",
          "text": "正解：-5² 的底数是 5，得 -25；(-5)² 的底数是 -5，得 25，两者相加为 0 → 除变乘：12×(-1/2)×3，从左到右算得 -18",
          "evidenceIds": []
        },
        {
          "id": "cl_64",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：掌握乘除法则、乘方意义和指数管辖范围。",
          "evidenceIds": [
            "ev_3"
          ]
        },
        {
          "id": "cl_65",
          "target": "scene",
          "kind": "criterion",
          "text": "能指出本场景中一个仍待核对的疑问或边界",
          "evidenceIds": [
            "ev_3"
          ]
        }
      ],
      "subjectIssues": [
        {
          "code": "MATH_PARSE_UNSUPPORTED",
          "severity": "warning",
          "target": "b5",
          "message": "步骤无法解析为可判定算式，跳过数学检查",
          "fix": null
        },
        {
          "code": "MATH_PARSE_UNSUPPORTED",
          "severity": "warning",
          "target": "b5",
          "message": "步骤无法解析为可判定算式，跳过数学检查",
          "fix": null
        }
      ],
      "repairs": [],
      "error": ""
    },
    {
      "outlineId": "scene_6",
      "status": "ready",
      "content": {
        "kind": "practice",
        "prompt": "徒儿，为师接了个求助。正数国档案馆的管理员要整理一批「能量档案」，他列了个算式： 4×(-2)³ + 3×(-5²) 然后他说：「我算出来了，(-2)³ 是 -8，-5² 是 -25，加起来乘一乘，最后等于 -107。科学记数法嘛，我写成 -10.7×10¹ 不就行了？」 档案馆门口贴着规定：所有大数必须用科学记数法登记，而且格式要标准。 你先别动笔，也别急着说对错。为师的题目来了： 第一，你先判断：管理员这个算法和这个写法，能直接归档吗？ 第二，如果哪里不妥，用你学过的概念说说，是哪条规矩被「不小心」碰了？ 第三，最后给管理员一个「行动清单」：他应该怎么改，以后怎么写才不会再被档案馆退回来？",
        "referencePoints": [
          "乘方符号判断：负号在括号外不参与乘方，-5² 与 (-5)² 的结果不同，需先看清指数管辖范围",
          "科学记数法格式：a 必须满足 1≤|a|<10，整数部分只能是一位非零数，-10.7 不符合要求",
          "混合运算顺序：含乘方、乘法、加法的算式，要按先乘方、再乘除、后加减的顺序核算，并检查符号"
        ],
        "rubric": [
          {
            "criterion": "概念判断",
            "weight": 40
          },
          {
            "criterion": "理论依据",
            "weight": 35
          },
          {
            "criterion": "行动建议",
            "weight": 25
          }
        ],
        "followUp": "如果管理员把 -107 写成 -1.07×10²，你觉得档案馆还会退回来吗？为什么？",
        "sourceChunkIds": []
      },
      "script": {
        "persona": "自称为师、称学生为徒儿的七年级数学老师，像大哥哥一样用提问、口诀和比喻带刷题",
        "beats": [
          {
            "kind": "question",
            "text": "徒儿，这段课为师要和你聊聊有理数混合运算。你肯定见过正数国和负数国火拼的场面，加减乘除乘方一窝蜂涌上来，这时候你先算谁？难道凭感觉瞎算吗？有小伙伴说从左到右，对吗？",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "正数国和负数国火拼",
              "先算谁"
            ]
          },
          {
            "kind": "answer",
            "text": "当然不是。咱先算乘方和绝对值，再乘除，后加减，括号里面的优先。就像警察巡逻，先管位置再管路程，一步都不能乱。你牢记一点，这个顺序就是老大，谁也不能插队。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "乘方和绝对值",
              "警察巡逻"
            ]
          },
          {
            "kind": "question",
            "text": "那么问题来了，多个负数相乘除，结果到底是正还是负？你难道想一个一个小试吗？有小伙伴说负负得正，那三个负数相乘呢？四个呢？总不能每次都动手吧？",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "多个负数相乘除",
              "负负得正"
            ]
          },
          {
            "kind": "answer",
            "text": "为师送你大白话口诀：奇负偶正。负数个数是奇数，结果就穿黑衣；是偶数，结果就穿红衣。比如 (-2)×(-3)×(-4)，三个负，奇数，所以是负的。负号计数千万别漏。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "奇负偶正",
              "负号计数"
            ]
          },
          {
            "kind": "question",
            "text": "等等，难道绝对值里的负号也要参加计数吗？比如 |-3| 和 -3，难道它们一样吗？有小伙伴说绝对值就是去掉负号，那结果一定是正的，对吗？你仔细想想。",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "绝对值里的负号",
              "去掉负号"
            ]
          },
          {
            "kind": "answer",
            "text": "对了一半。绝对值表示距离，就像汪星人从家出发走了多远，肯定是非负的。|-3| 等于 3，但 -3 还是 -3。负数不能裸奔，负号在绝对值外面，结果照样是负，妥妥记住。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "汪星人",
              "非负",
              "负数不能裸奔"
            ]
          },
          {
            "kind": "question",
            "text": "来，咱看一道题：(-2) 的平方加上 3 乘以 (-1) 的立方，再除以 |-6|。你先别动笔，告诉为师，第一步该干嘛？难道直接从左往右算吗？",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "(-2) 的平方",
              "第一步"
            ]
          },
          {
            "kind": "answer",
            "text": "先算乘方和绝对值。(-2) 的平方是 4，(-1) 的立方是 -1，|-6| 是 6。原式变成 4 加上 3 乘以 -1，再除以 6。然后算乘除，3 乘以 -1 得 -3，这一步别错。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "乘方和绝对值",
              "乘除"
            ]
          },
          {
            "kind": "answer",
            "text": "接着算加减和除。4 加上 -3 得 1，1 除以 6 得六分之一。哎呀我二了，除变乘别忘记，除以 6 就是乘六分之一，结果还是六分之一，妥妥搞定，欧了。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "除变乘",
              "妥妥搞定"
            ]
          },
          {
            "kind": "confirm",
            "text": "对喽，只要按顺序拆，长算式就是纸老虎。特别提醒你注意，指数管辖范围只看底数，-2 的平方和 (-2) 的平方可不一样，这个坑千万别踩。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "指数管辖范围",
              "只看底数"
            ]
          },
          {
            "kind": "recall",
            "text": "咱回到黑板旁边，想想以前学的正数国大数字。像 350000 这种，写起来费劲，读起来臣妾做不到呀。这时候科学记数法就来救场，把它写成 a 乘以 10 的 n 次方。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": [
              "正数国大数字",
              "科学记数法"
            ]
          },
          {
            "kind": "question",
            "text": "那么问题来了，a 和 n 有什么讲究？难道 a 随便取，n 随便定吗？有小伙伴说小数点随便挪，反正乘个 10 就欧了，对吗？你难道不怀疑吗？",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "a 和 n",
              "小数点随便挪"
            ]
          },
          {
            "kind": "answer",
            "text": "不对。你牢记一点：a 必须是大于等于 1 且小于 10 的数，n 是正整数。比如 350000，小数点往左挪五位，a 是 3.5，n 是 5，写成 3.5 乘 10 的 5 次方。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "大于等于 1 且小于 10",
              "正整数"
            ]
          },
          {
            "kind": "confirm",
            "text": "对喽，我再强调一遍，a 的范围是 1 到 10 之间，包含 1 不包含 10。负数也能用，比如 -350000 就是 -3.5 乘 10 的 5 次方，符号别丢，妥妥好用。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "1 到 10 之间",
              "符号别丢"
            ]
          },
          {
            "kind": "answer",
            "text": "总结时间到。第一，运算顺序是老大，乘方绝对值优先，乘除后来，加减收尾。第二，符号判断用奇负偶正，负号计数别漏。第三，科学记数法 a 管一到十，n 管挪几位。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "运算顺序",
              "奇负偶正",
              "a 管一到十"
            ]
          },
          {
            "kind": "cta",
            "text": "徒儿们速速刷题去吧，找三道混合运算、两道科学记数法，限时秒杀。刷完你对对答案，搞定这些，本章就妥了，欧了。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "速速刷题",
              "限时秒杀"
            ]
          }
        ],
        "sceneTitle": "混合运算与科学记数法应用",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"practice\",\"title\":\"混合运算与科学记数法应用\",\"description\":\"综合练习含乘方、绝对值、乘除的混合运算，练\\\"遇除变乘再约分\\\"和\\\"绝对值先算\\\"。再练科学记数法：a×10ⁿ中a的整数部分必须是一位非零数，10的指数等于小数点移动的位数。近似数四舍五入，精确到千位要回原数找数位。\",\"objective\":\"规范完成含乘方、绝对值、乘除的混合运算；会用科学记数法表示数。\",\"keyPoints\":[\"有理数混合运算\",\"科学记数法\"]}",
      "evidence": [
        {
          "id": "cl_41",
          "target": "scene",
          "kind": "reference",
          "text": "乘方符号判断：负号在括号外不参与乘方，-5² 与 (-5)² 的结果不同，需先看清指数管辖范围",
          "evidenceIds": []
        },
        {
          "id": "cl_42",
          "target": "scene",
          "kind": "reference",
          "text": "科学记数法格式：a 必须满足 1≤|a|<10，整数部分只能是一位非零数，-10.7 不符合要求",
          "evidenceIds": []
        },
        {
          "id": "cl_43",
          "target": "scene",
          "kind": "reference",
          "text": "混合运算顺序：含乘方、乘法、加法的算式，要按先乘方、再乘除、后加减的顺序核算，并检查符号",
          "evidenceIds": []
        },
        {
          "id": "cl_44",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：规范完成含乘方、绝对值、乘除的混合运算；会用科学记数法表示数。",
          "evidenceIds": [
            "ev_3"
          ]
        },
        {
          "id": "cl_45",
          "target": "scene",
          "kind": "criterion",
          "text": "能指出本场景中一个仍待核对的疑问或边界",
          "evidenceIds": [
            "ev_3"
          ]
        }
      ],
      "subjectIssues": [],
      "repairs": [],
      "error": ""
    },
    {
      "outlineId": "scene_7",
      "status": "ready",
      "content": {
        "kind": "quiz",
        "questions": [
          {
            "id": "course-q-1",
            "stem": "徒儿，为师问你：绝对值等于它本身的数，是什么数？",
            "options": [
              "正数",
              "非负数",
              "整数",
              "负数"
            ],
            "answerIndex": 1,
            "explanation": "那么问题来了，绝对值等于它本身的，难道负数也行吗？错错错。-3 的绝对值是 3，才不是 -3。有小伙伴说只有正数，对喽一半！0 的绝对值还是 0。我再强调一遍：正数和 0 合起来叫非负数。所以这题选「非负数」。易错点：只选「正数」，漏了 0。",
            "concept": "绝对值的非负性",
            "chapter": "有理数"
          },
          {
            "id": "course-q-2",
            "stem": "等等，难道 -5² 和 (-5)² 的结果一样吗？徒儿你判断这对不对。",
            "options": [
              "对",
              "错"
            ],
            "answerIndex": 1,
            "explanation": "徒儿先猜，再听为师算。-5² 里指数只管紧挨的 5，等于 -(5×5)=-25。(-5)² 里有括号，指数管整个 -5，等于 25。一个 -25 一个 25，能一样吗？特别提醒你注意：指数管辖范围，没括号只管一个，有括号管一窝。这题是易错点，千万别忘了。",
            "concept": "乘方的指数管辖范围",
            "chapter": "有理数"
          }
        ],
        "sourceChunkIds": []
      },
      "script": {
        "persona": "自称为师、称学生为徒儿的七年级数学老师，像大哥哥一样用提问、口诀和比喻带徒儿刷题",
        "beats": [
          {
            "kind": "question",
            "text": "这段课，为师要和你聊聊有理数核心快问快答，专抓概念和运算里的易错点。先热个身：温度计上，0℃是正数还是负数？有小伙伴说它是正数，难道对吗？给为师三秒钟，好好想一想，到底是不是呢？",
            "pauseMs": 2000,
            "blockId": null,
            "emphasis": [
              "0℃",
              "正数",
              "负数"
            ]
          },
          {
            "kind": "answer",
            "text": "0℃既不是正数，也不是负数，它是正数与负数的分界点。就像温度计上的零刻度线，往上是正数国，往下是负数国，两边水火不容，0坐镇中场，不偏不倚，稳稳当当。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "分界点",
              "正数国",
              "负数国"
            ]
          },
          {
            "kind": "confirm",
            "text": "对喽，你牢记一点：0是正负分界，它很特殊，既不属于正数国，也不属于负数国，但它是有理数，也是整数，还是一个没有符号的数，这个点极易错，年年考。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "那么问题来了：-π是有理数吗？0.333...呢？有小伙伴说只要带省略号的就是有理数，难道对吗？你先猜猜，再告诉为师理由，别急着说不会，给三秒钟认真思考吧。",
            "pauseMs": 2000,
            "blockId": null,
            "emphasis": [
              "-π",
              "有理数",
              "省略号"
            ]
          },
          {
            "kind": "answer",
            "text": "-π不是有理数，它是无限不循环小数，写不成两个整数之比。0.333...是有理数，它是无限循环小数，能写成分数三分之一，所以算妥妥的有理数，能进门。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "无限不循环",
              "无限循环",
              "分数"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，判断有理数就看能不能写成两个整数之比。无限不循环的，直接踢出有理数国，无限循环的才能进门，这个口诀妥妥好用，徒儿们千万别记混了。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "有小伙伴说：绝对值等于本身的数一定是正数。等等，难道0被吃了吗？绝对值具有非负性，就像警察巡逻只看路程，你品品，先想想千万别急着回答。",
            "pauseMs": 2000,
            "blockId": null,
            "emphasis": [
              "绝对值",
              "非负性",
              "0"
            ]
          },
          {
            "kind": "answer",
            "text": "错。正数和0的绝对值都等于本身。绝对值表示距离，就像汪星人散步，走多远都是非负的路程，它是考试常客，你牢记一点，千万别搞错方向。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "距离",
              "非负",
              "汪星人"
            ]
          },
          {
            "kind": "confirm",
            "text": "对喽，千万别忘了0。我再强调一遍：绝对值一定大于或等于0，这就是非负性，选择填空题最爱考这个坑，徒儿们一考一个准儿，千万要小心。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "等等，难道(-2)²和-2²一样吗？有小伙伴说都有平方，结果肯定相同。你手里有笔的话，先算算看，三秒钟再回答，看看究竟是谁粗心大意了。",
            "pauseMs": 2000,
            "blockId": null,
            "emphasis": [
              "(-2)²",
              "-2²",
              "平方"
            ]
          },
          {
            "kind": "answer",
            "text": "不一样。(-2)²=4，-2²=-4。指数管辖范围只到括号前，括号才是自己人，特别提醒你注意：负数不能裸奔，得穿括号这件妥妥的外套才行。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "指数管辖",
              "括号",
              "负数不能裸奔"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，指数管辖范围，括号是护身符。你牢记一点：看见平方先找括号，没有括号就是负号在搞鬼，千万别中招，要仔细审题，别臣妾做不到呀。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "recall",
            "text": "回顾一下：有理数要看分数形式，绝对值非负，乘方看括号管辖，混合运算先定符号再动手，这些易错点一个都不能忘，送分题咱不能丢。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "最后一题：0.000405用科学记数法写，指数是几？有小伙伴说是4，难道小数点会向后转吗？想想正数国变小的规矩，想清楚再动笔写。",
            "pauseMs": 2000,
            "blockId": null,
            "emphasis": [
              "科学记数法",
              "指数",
              "小数点"
            ]
          },
          {
            "kind": "answer",
            "text": "写成4.05×10⁻⁴。小数点向右移动四位，所以指数是-4。向后转得靠负指数，你记住：小于1的正数，指数必须是负的，哎呀我二了，可别写反。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "4.05×10⁻⁴",
              "负指数"
            ]
          },
          {
            "kind": "cta",
            "text": "总结时间到：一辨概念形式，二抓非负与括号管辖，三用奇负偶正定符号。徒儿们速速刷题去吧，搞定它，欧了，妥妥好用，加油马上刷题去。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          }
        ],
        "sceneTitle": "有理数核心快问快答",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"quiz\",\"title\":\"有理数核心快问快答\",\"description\":\"3道快问快答覆盖概念、运算和易错点。有选择题考\\\"哪个不是有理数\\\"，判断题考\\\"-5²=25\\\"这个经典错误，填空题考绝对值和相反数。错哪儿改哪儿，搞懂为止。\",\"objective\":\"检测对核心概念和易错点的掌握。\",\"keyPoints\":[\"有理数概念辨析\",\"有理数运算规范\",\"易错点排查\"]}",
      "evidence": [
        {
          "id": "cl_52",
          "target": "course-q-1",
          "kind": "question",
          "text": "徒儿，为师问你：绝对值等于它本身的数，是什么数？",
          "evidenceIds": []
        },
        {
          "id": "cl_53",
          "target": "course-q-1",
          "kind": "explanation",
          "text": "那么问题来了，绝对值等于它本身的，难道负数也行吗？错错错。-3 的绝对值是 3，才不是 -3。有小伙伴说只有正数，对喽一半！0 的绝对值还是 0。我再强调一遍：正数和 0 合起来叫非负数。所以这题选「非负数」。易错点：只选「正数」，漏了 0。",
          "evidenceIds": []
        },
        {
          "id": "cl_54",
          "target": "course-q-2",
          "kind": "question",
          "text": "等等，难道 -5² 和 (-5)² 的结果一样吗？徒儿你判断这对不对。",
          "evidenceIds": []
        },
        {
          "id": "cl_55",
          "target": "course-q-2",
          "kind": "explanation",
          "text": "徒儿先猜，再听为师算。-5² 里指数只管紧挨的 5，等于 -(5×5)=-25。(-5)² 里有括号，指数管整个 -5，等于 25。一个 -25 一个 25，能一样吗？特别提醒你注意：指数管辖范围，没括号只管一个，有括号管一窝。这题是易错点，千万别忘了。",
          "evidenceIds": []
        },
        {
          "id": "cl_56",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：检测对核心概念和易错点的掌握。",
          "evidenceIds": [
            "ev_3"
          ]
        },
        {
          "id": "cl_57",
          "target": "scene",
          "kind": "criterion",
          "text": "能指出本场景中一个仍待核对的疑问或边界",
          "evidenceIds": [
            "ev_3"
          ]
        }
      ],
      "subjectIssues": [],
      "repairs": [],
      "error": ""
    },
    {
      "outlineId": "scene_8",
      "status": "ready",
      "content": {
        "kind": "board",
        "lesson": {
          "chapter": "有理数",
          "title": "特殊值复盘与方法清单",
          "subtitle": "总结时间到：为师带你复盘 0、1、-1 的特殊性质，再盘点全章口诀与方法清单",
          "blocks": [
            {
              "type": "outline",
              "title": "本节路线图",
              "items": [
                "回顾锚点：快问快答已过完，该盘特殊值了",
                "热身：0、1、-1 谁「等于本身」？",
                "动机：全章方法清单怎么用？",
                "总结时间到：徒儿速速刷题去吧"
              ],
              "persistent": true,
              "id": "b1"
            },
            {
              "type": "definition",
              "title": "核心概念：等于本身的数",
              "term": "特殊值「等于本身」家族",
              "definition": "在有理数中，0、1、-1 这几个特殊值，经过相反数、绝对值、倒数、平方、立方运算后，结果可能等于原数。记不住就把三兄弟依次代进去验证。",
              "concreteAnchor": "你算算看：0 的相反数是 0，1 的倒数是 1，(-1) 的立方还是 -1。这几个数就像会「原地转身」，转完还在老地方。",
              "analogy": "就像汪星人散步，从原点出发走三步，向左到 -3、向右到 3，回原点的距离一样；而 0 根本不用动，原地就是家。",
              "method": [
                "先请出三兄弟：0、1、-1",
                "逐个运算：相反、绝对、倒、平方、立方",
                "只记结果「不变」的那几个"
              ],
              "verify": "拿 0、1、-1 各算一遍，看结果是不是原数",
              "id": "b2"
            },
            {
              "type": "table",
              "title": "特殊值性质一张表",
              "columns": [
                "运算",
                "等于本身的数",
                "最小例子"
              ],
              "rows": [
                [
                  "相反数",
                  "只有 0",
                  "0 的相反数是 0"
                ],
                [
                  "绝对值",
                  "非负数（正数和 0）",
                  "|3|=3，|0|=0"
                ],
                [
                  "倒数",
                  "1 和 -1",
                  "1×1=1，(-1)×(-1)=1"
                ],
                [
                  "平方",
                  "0 和 1",
                  "0²=0，1²=1"
                ],
                [
                  "立方",
                  "0、1、-1",
                  "(-1)³=-1"
                ]
              ],
              "id": "b3"
            },
            {
              "type": "wrong-first",
              "title": "这道题先看错解",
              "wrongSteps": [
                "问：平方等于本身的数是几？",
                "答：-1、0、1",
                "因为 (-1)²=1，所以 -1 的平方是本身"
              ],
              "errorIndex": 1,
              "errorHint": "(-1)²=1，1 不是 -1，所以 -1 的平方不是它本身",
              "correctSteps": [
                "平方等于本身：0²=0，1²=1",
                "(-1)²=1≠-1，所以 -1 不算",
                "答案只有 0 和 1"
              ],
              "takeaway": "特殊值记混：平方是本身的只有 0 和 1，别把 -1 拉进来",
              "id": "b4"
            },
            {
              "type": "callout",
              "title": "易错点：负数不能裸奔",
              "tone": "warn",
              "text": "我再强调一遍：负数参与乘方、代入、作分母时，必须先加括号。-5² 的底数是 5，得 -25；(-5)² 的底数是 -5，得 25。指数管辖范围，括号说了算。",
              "mnemonic": "口诀：负数不能裸奔，要加括号；指数管辖范围，先看底数是谁",
              "id": "b5"
            },
            {
              "type": "columns",
              "title": "全章方法清单",
              "columns": [
                {
                  "heading": "运算三步",
                  "items": [
                    "先定符号：奇负偶正",
                    "再变形式：除变乘、减变加",
                    "后算数值：从左到右，小数化分数"
                  ]
                },
                {
                  "heading": "符号口诀",
                  "items": [
                    "同号得正，异号得负",
                    "奇负偶正（数负号）",
                    "负负得正（向后转）"
                  ]
                },
                {
                  "heading": "易错雷达",
                  "items": [
                    "0 非正非负，没有倒数",
                    "列举整数、因数别漏负数",
                    "去分母每一项都乘，分子是式子要加括号"
                  ]
                }
              ],
              "caption": "",
              "id": "b6"
            },
            {
              "type": "question",
              "title": "停下来想一想",
              "prompt": "下列说法对几个？① 0 的相反数是 0；② -1 的倒数是 -1；③ 绝对值是本身的数是非负数；④ 立方是本身的数只有 0 和 1",
              "options": [
                "1 个",
                "2 个",
                "3 个",
                "4 个"
              ],
              "transition": {
                "enter": "pop",
                "durationMs": 420
              },
              "id": "b7"
            }
          ]
        },
        "sourceChunkIds": []
      },
      "script": {
        "persona": "亦师亦友的数学老师，自称为师，善用提问、口诀和隐喻带徒儿刷题",
        "beats": [
          {
            "kind": "question",
            "text": "徒儿们，这段课为师要和你聊聊有理数的特殊值复盘，还有全章方法清单。先看看黑板上的路线图，从正负分界一路到混合运算，咱今天要把它们串成一条线。你肯定见过那些挖坑题，一看就会，一做就废，对不对？",
            "pauseMs": 1800,
            "blockId": "b1",
            "emphasis": [
              "特殊值复盘",
              "方法清单"
            ]
          },
          {
            "kind": "answer",
            "text": "别怕，咱从温度计的正负分界出发。你学过数轴，知道相反数是向后转，绝对值像汪星人散步只算路程。警察巡逻还分位置与路程。这些底子打好了，今天复盘就轻松。咱先抓特殊值，再背方法清单，妥妥好用。",
            "pauseMs": 800,
            "blockId": "b1",
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "那么问题来了，有没有一个数，加它减它乘它，结果都等于本身？等等，难道0和1都行吗？有小伙伴说，当然是1啊，乘法单位元嘛。你先猜猜，减法里谁才是老大？",
            "pauseMs": 1800,
            "blockId": "b3",
            "emphasis": [
              "等于本身",
              "0和1"
            ]
          },
          {
            "kind": "answer",
            "text": "对喽，加看0，减看0，乘看1。-1也特殊，绝对值是1，相反数也是1。(-1)²=1，(-1)³=-1。0的绝对值是0，相反数也是0。(-1)的倒数还是-1。你牢记一点，这张表比背十遍都强。",
            "pauseMs": 800,
            "blockId": "b3",
            "emphasis": [
              "零次幂"
            ]
          },
          {
            "kind": "confirm",
            "text": "看看，特殊值就这几个，考试专挑它们挖坑。你只要扫一眼表格，就知道出题人想干嘛。臣妾做不到呀？不，你做到喽。把这些数当成老熟人，见面就得认得。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "先看道错解，计算-2²+(-3)²。有同学写-4+9=5，还有同学写4+9=13。哪个对？等等，难道负号也要平方吗？有小伙伴说，-2²就是(-2)²，一样一样。你仔细瞅瞅。",
            "pauseMs": 1800,
            "blockId": "b4",
            "emphasis": [
              "指数管辖范围"
            ]
          },
          {
            "kind": "answer",
            "text": "哎呀我二了，刚看走眼。-2²里，指数只管2，不管负号，这叫指数管辖范围，结果是-4。(-3)²=9，负负得正。所以5是对的。13那位，你把负号也塞进平方里，负数裸奔了。",
            "pauseMs": 800,
            "blockId": "b4",
            "emphasis": [
              "负负得正"
            ]
          },
          {
            "kind": "confirm",
            "text": "对喽，选5的徒儿稳得很。选13的也别哭，咱把这页撕掉，啊不，把这错题抄旁边。指数管辖范围是大白话：指数只管自己眼皮底下的数，负号在括号外，它管不着。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "我再强调一遍，负数不能裸奔。(-2)²和-2²差多少？你品品。一个穿着括号防护服，一个光着膀子。有小伙伴说，不都是平方吗？等等，难道结果会一样？你算算看。",
            "pauseMs": 1800,
            "blockId": "b5",
            "emphasis": [
              "负数不能裸奔"
            ]
          },
          {
            "kind": "answer",
            "text": "(-2)²=4，-2²=-4。差老鼻子了，一个天上一个地下。括号就是防护服，该穿就得穿。除法除变乘，小数化分数，你也得配例子记。比如-6÷2，除变乘，等于-6×1/2=-3。",
            "pauseMs": 800,
            "blockId": "b5",
            "emphasis": [
              "除变乘"
            ]
          },
          {
            "kind": "confirm",
            "text": "妥妥好用，你发现没有，所有错题都是裸奔惹的祸。负数出门必须穿括号，除非它真的没穿。特别提醒你注意，符号错一步，满盘皆输。刷题时眼睛擦亮，看见负号先找括号。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "recall",
            "text": "回顾一下，从温度计的正负分界，到绝对值像汪星人散步只算路程，再到警察巡逻的位置与路程，咱靠这些把有理数摸透了。正数国负数国火拼，奇负偶正定符号。这些就是你脑子里的锚点。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "那么问题来了，全章运算有没有口诀能秒杀？多个数相乘，负号个数奇偶怎么定？有小伙伴说，负号多于正号就赢。等等，难道不看个数吗？除法咋办？混合运算先干啥？你抢答。",
            "pauseMs": 1800,
            "blockId": "b6",
            "emphasis": [
              "奇负偶正"
            ]
          },
          {
            "kind": "answer",
            "text": "奇负偶正，四个字秒杀。负号个数是奇数，结果为负；偶数个，结果为正。除法除变乘，小数化分数。混合运算先乘方，再乘除，后加减。有括号先算括号里。你牢记一点，步骤别乱，一步一检查，欧了。",
            "pauseMs": 800,
            "blockId": "b6",
            "emphasis": [
              "混合运算顺序"
            ]
          },
          {
            "kind": "confirm",
            "text": "对喽，背下这几句，刷题速度起码快一倍。方法清单不是死记，是给你兜底。哪怕题目没见过，按步骤走，也能拿下。臣妾做不到呀？不，你做到喽。把这些口诀贴在铅笔盒里，天天见。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "cta",
            "text": "总结时间到：一记特殊值表，二背奇负偶正，三防负数裸奔。徒儿们速速刷题去吧，搞定它，妥妥好用，欧了！",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          }
        ],
        "sceneTitle": "特殊值复盘与方法清单",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"review\",\"title\":\"特殊值复盘与方法清单\",\"description\":\"总结时间到。为师带你复盘0、1、-1的特殊性质：相反数是本身只有0，绝对值是本身是非负数，倒数是本身是±1，平方是本身是0和1，立方是本身是0、±1。再盘点全章口诀：奇负偶正、除变乘、小数化分数、负数不能裸奔、指数管辖范围。最后CTA：为师这就讲完了，徒儿们速速刷题去吧。\",\"objective\":\"记住特殊值性质，形成全章方法清单。\",\"keyPoints\":[\"特殊值综合\",\"全章运算口诀\",\"概念方法清单\"]}",
      "evidence": [
        {
          "id": "cl_71",
          "target": "b2",
          "kind": "definition",
          "text": "特殊值「等于本身」家族：在有理数中，0、1、-1 这几个特殊值，经过相反数、绝对值、倒数、平方、立方运算后，结果可能等于原数。记不住就把三兄弟依次代进去验证。",
          "evidenceIds": []
        },
        {
          "id": "cl_72",
          "target": "b4",
          "kind": "example",
          "text": "正解：平方等于本身：0²=0，1²=1 → (-1)²=1≠-1，所以 -1 不算 → 答案只有 0 和 1",
          "evidenceIds": []
        },
        {
          "id": "cl_73",
          "target": "b5",
          "kind": "conclusion",
          "text": "我再强调一遍：负数参与乘方、代入、作分母时，必须先加括号。-5² 的底数是 5，得 -25；(-5)² 的底数是 -5，得 25。指数管辖范围，括号说了算。",
          "evidenceIds": []
        },
        {
          "id": "cl_74",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：记住特殊值性质，形成全章方法清单。",
          "evidenceIds": [
            "ev_3"
          ]
        },
        {
          "id": "cl_75",
          "target": "scene",
          "kind": "criterion",
          "text": "能指出本场景中一个仍待核对的疑问或边界",
          "evidenceIds": [
            "ev_3"
          ]
        }
      ],
      "subjectIssues": [
        {
          "code": "MATH_PARSE_UNSUPPORTED",
          "severity": "warning",
          "target": "b4",
          "message": "步骤无法解析为可判定算式，跳过数学检查",
          "fix": null
        },
        {
          "code": "MATH_PARSE_UNSUPPORTED",
          "severity": "warning",
          "target": "b4",
          "message": "步骤无法解析为可判定算式，跳过数学检查",
          "fix": null
        }
      ],
      "repairs": [],
      "error": ""
    }
  ],
  "plan": {
    "version": "course-ir-v1",
    "courseId": "plan-mwkdcuey",
    "title": "有理数：从正负分界到混合运算",
    "summary": "本课解决七年级有理数入门难、运算符号易错的问题。学完能建立正负数框架，掌握数轴、相反数、绝对值等核心概念，规范完成加减乘除乘方与混合运算，并用科学记数法表示大数。",
    "languageDirective": "授课用为师/徒儿人设，第二人称对话式行文，短句为主。重要规则后紧跟最小例子，口诀用奇负偶正、除变乘等大白话。",
    "learnerProfile": {
      "stage": "junior",
      "stageLabel": "初中",
      "gradeLabel": "七年级",
      "language": "短句、具体名词和生活化提问，先讲\"它像什么\"，再给正式名称。",
      "teaching": "用温度计、正数国火拼、汪星人散步等故事和分步示范；优先设计可点击的分步演示、口头预测和即时反馈。",
      "board": "板书以一条清晰路线、一个形象比喻和2—4帧分步演示为主，避免同时堆放多个抽象概念。",
      "subject": "数学",
      "confidence": "high",
      "evidence": "用户明确\"七年级学生（刚学完小学正数，第一次系统接触负数）\"",
      "source": "explicit"
    },
    "domain": "math7",
    "durationBudget": 40,
    "requirements": [
      {
        "id": "rq_1",
        "text": "掌握有理数的核心概念与全章运算：正负数的意义、有理数概念与分类、数轴、相反数、绝对值及其非负性、大小比较、加减乘除乘方与混合运算、科学记数法，能用「奇负偶正」等口诀定符号、按步骤规范运算",
        "source": "requirement"
      },
      {
        "id": "rq_objective",
        "text": "掌握有理数的核心概念与全章运算：正负数的意义、有理数概念与分类、数轴、相反数、绝对值及其非负性、大小比较、加减乘除乘方与混合运算、科学记数法，能用「奇负偶正」等口诀定符号、按步骤规范运算",
        "source": "requirement"
      }
    ],
    "knowledgePoints": [
      {
        "id": "kp_1",
        "name": "正负数意义",
        "difficulty": 1,
        "prerequisites": [],
        "introducedBy": "scene_1",
        "estMinutes": 4
      },
      {
        "id": "kp_2",
        "name": "有理数概念与分类",
        "difficulty": 1,
        "prerequisites": [
          "kp_1"
        ],
        "introducedBy": "scene_1",
        "estMinutes": 4
      },
      {
        "id": "kp_3",
        "name": "数轴",
        "difficulty": 1,
        "prerequisites": [
          "kp_1",
          "kp_2"
        ],
        "introducedBy": "scene_2",
        "estMinutes": 4
      },
      {
        "id": "kp_4",
        "name": "相反数",
        "difficulty": 1,
        "prerequisites": [
          "kp_2",
          "kp_3"
        ],
        "introducedBy": "scene_2",
        "estMinutes": 4
      },
      {
        "id": "kp_5",
        "name": "绝对值",
        "difficulty": 1,
        "prerequisites": [
          "kp_3",
          "kp_4"
        ],
        "introducedBy": "scene_2",
        "estMinutes": 4
      },
      {
        "id": "kp_6",
        "name": "绝对值非负性",
        "difficulty": 2,
        "prerequisites": [
          "kp_4",
          "kp_5"
        ],
        "introducedBy": "scene_3",
        "estMinutes": 4
      },
      {
        "id": "kp_7",
        "name": "有理数大小比较",
        "difficulty": 2,
        "prerequisites": [
          "kp_5",
          "kp_6"
        ],
        "introducedBy": "scene_3",
        "estMinutes": 4
      },
      {
        "id": "kp_8",
        "name": "有理数加减法",
        "difficulty": 2,
        "prerequisites": [
          "kp_6",
          "kp_7"
        ],
        "introducedBy": "scene_3",
        "estMinutes": 4
      },
      {
        "id": "kp_9",
        "name": "减法变加法",
        "difficulty": 2,
        "prerequisites": [
          "kp_7",
          "kp_8"
        ],
        "introducedBy": "scene_4",
        "estMinutes": 6
      },
      {
        "id": "kp_10",
        "name": "凑整与带符号搬家",
        "difficulty": 2,
        "prerequisites": [
          "kp_8",
          "kp_9"
        ],
        "introducedBy": "scene_4",
        "estMinutes": 6
      },
      {
        "id": "kp_11",
        "name": "有理数乘除法",
        "difficulty": 3,
        "prerequisites": [
          "kp_9",
          "kp_10"
        ],
        "introducedBy": "scene_5",
        "estMinutes": 5
      },
      {
        "id": "kp_12",
        "name": "有理数乘方",
        "difficulty": 3,
        "prerequisites": [
          "kp_10",
          "kp_11"
        ],
        "introducedBy": "scene_5",
        "estMinutes": 5
      },
      {
        "id": "kp_13",
        "name": "有理数混合运算",
        "difficulty": 3,
        "prerequisites": [
          "kp_11",
          "kp_12"
        ],
        "introducedBy": "scene_5",
        "estMinutes": 5
      },
      {
        "id": "kp_14",
        "name": "科学记数法",
        "difficulty": 3,
        "prerequisites": [
          "kp_12",
          "kp_13"
        ],
        "introducedBy": "scene_6",
        "estMinutes": 7
      },
      {
        "id": "kp_15",
        "name": "有理数概念辨析",
        "difficulty": 3,
        "prerequisites": [
          "kp_13",
          "kp_14"
        ],
        "introducedBy": "scene_7",
        "estMinutes": 5
      },
      {
        "id": "kp_16",
        "name": "有理数运算规范",
        "difficulty": 3,
        "prerequisites": [
          "kp_14",
          "kp_15"
        ],
        "introducedBy": "scene_7",
        "estMinutes": 5
      },
      {
        "id": "kp_17",
        "name": "易错点排查",
        "difficulty": 3,
        "prerequisites": [
          "kp_15",
          "kp_16"
        ],
        "introducedBy": "scene_7",
        "estMinutes": 5
      },
      {
        "id": "kp_18",
        "name": "特殊值综合",
        "difficulty": 3,
        "prerequisites": [
          "kp_16",
          "kp_17"
        ],
        "introducedBy": "scene_8",
        "estMinutes": 5
      },
      {
        "id": "kp_19",
        "name": "全章运算口诀",
        "difficulty": 3,
        "prerequisites": [
          "kp_17",
          "kp_18"
        ],
        "introducedBy": "scene_8",
        "estMinutes": 5
      },
      {
        "id": "kp_20",
        "name": "概念方法清单",
        "difficulty": 3,
        "prerequisites": [
          "kp_18",
          "kp_19"
        ],
        "introducedBy": "scene_8",
        "estMinutes": 5
      }
    ],
    "scenes": [
      {
        "id": "scene_1",
        "order": 1,
        "type": "lecture",
        "title": "温度计分界：正负数与有理数入门",
        "description": "开场三件套：回顾锚点——小学只学过正数和0，从没写过比0小的数；热身提问——温度计上零下5度到底该记成什么；动机问题——要是没有负数，\"欠款3元\"和\"零下5度\"怎么区分？从温度计分界引出正负数，再讲有理数概念与分类，告诉你有限小数循环小数都是分数，π却不是。",
        "teachingObjective": "能说出正负数的相对意义，0非正非负；能把给定数按整数/分数和正负分类。",
        "completionCriteria": [
          "能达成学习目标：能说出正负数的相对意义，0非正非负；能把给定数按整数/分数和正负分类。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "正负数意义",
          "有理数概念与分类"
        ],
        "takeaways": [
          "0是正负分界点，非正非负",
          "有限小数和循环小数都看作分数",
          "分类两把尺子：整数分数、正负符号，结果都是五类"
        ],
        "difficultyTier": 1,
        "estimatedMinutes": 4,
        "sourceChunkIds": [],
        "exerciseSpec": {
          "types": [],
          "count": 0
        },
        "prerequisites": [],
        "knowledgePointIds": [
          "kp_1",
          "kp_2"
        ],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "recommend",
          "score": 40,
          "reasons": [
            "数量结构（有理数、分数）",
            "过程与变换（循环）",
            "对照与分类（分类）"
          ]
        }
      },
      {
        "id": "scene_2",
        "order": 2,
        "type": "lecture",
        "title": "数轴上的双胞胎：相反数与绝对值",
        "description": "从温度计抽象出数轴三要素。用汪星人散步的故事讲绝对值：从原点出发走3个单位长度，向左到-3、向右到3，到原点的距离都是3。再讲相反数：数轴上关于原点对称的一对点数，0的相反数还是0。",
        "teachingObjective": "会画数轴并标出相反数；会用距离定义求绝对值。",
        "completionCriteria": [
          "能达成学习目标：会画数轴并标出相反数；会用距离定义求绝对值。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "数轴",
          "相反数",
          "绝对值"
        ],
        "takeaways": [
          "a的相反数是-a，-(-5)=5",
          "正数绝对值是本身，负数绝对值是相反数",
          "0的相反数是0，0的绝对值是0"
        ],
        "difficultyTier": 1,
        "estimatedMinutes": 4,
        "sourceChunkIds": [],
        "exerciseSpec": {
          "types": [],
          "count": 0
        },
        "prerequisites": [
          "kp_1",
          "kp_2"
        ],
        "knowledgePointIds": [
          "kp_3",
          "kp_4",
          "kp_5"
        ],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "recommend",
          "score": 40,
          "reasons": [
            "几何关系（对称）",
            "数量结构（数轴、相反数、绝对值）",
            "学段偏低，交互优先于文字推导"
          ]
        }
      },
      {
        "id": "scene_3",
        "order": 3,
        "type": "lecture",
        "title": "火拼与巡逻：大小比较和加减法则",
        "description": "用正数国/负数国火拼的故事讲加减法则：同号相加能量累加，异号相加火拼抵消。用警察南北大道巡逻区分最终位置和总路程。再讲绝对值非负性：两个非负数相加得0，只能每个都是0。最后用数轴比大小，左小右大，特别强调负数之间数值越大数反而越小。",
        "teachingObjective": "掌握加减法法则和大小比较方法；理解非负性用途。",
        "completionCriteria": [
          "能达成学习目标：掌握加减法法则和大小比较方法；理解非负性用途。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "绝对值非负性",
          "有理数大小比较",
          "有理数加减法"
        ],
        "takeaways": [
          "两个非负数相加得0，只能每个都是0",
          "负数比较：数值越大，数反而越小",
          "同号累加符号不变，异号抵消符号跟大的"
        ],
        "difficultyTier": 2,
        "estimatedMinutes": 4,
        "sourceChunkIds": [],
        "exerciseSpec": {
          "types": [],
          "count": 0
        },
        "prerequisites": [
          "kp_4",
          "kp_5"
        ],
        "knowledgePointIds": [
          "kp_6",
          "kp_7",
          "kp_8"
        ],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "recommend",
          "score": 50,
          "reasons": [
            "运动与受力（路程）",
            "数量结构（绝对值、数轴、有理数）",
            "对照与分类（比较）"
          ]
        }
      },
      {
        "id": "scene_4",
        "order": 4,
        "type": "practice",
        "title": "加减混合巧算实战",
        "description": "错解先行：先让你试试-3又2/3+6.3-2又1/3，很多徒儿会直接按顺序算或者换位置丢符号。咱用减法变加法、凑整搬家、带分数化假分数来秒杀。再来一道警察巡逻综合题，求位置带符号相加，求路程不带符号。",
        "teachingObjective": "规范完成加减混合运算，会用凑整简化。",
        "completionCriteria": [
          "能达成学习目标：规范完成加减混合运算，会用凑整简化。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "有理数加减法",
          "减法变加法",
          "凑整与带符号搬家"
        ],
        "takeaways": [
          "减去一个数等于加上它的相反数",
          "换位置必须带符号，负数不能裸奔",
          "总路程不带符号，最终位置带符号"
        ],
        "difficultyTier": 2,
        "estimatedMinutes": 6,
        "sourceChunkIds": [],
        "exerciseSpec": {
          "types": [],
          "count": 0
        },
        "prerequisites": [
          "kp_7",
          "kp_8"
        ],
        "knowledgePointIds": [
          "kp_9",
          "kp_10"
        ],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "recommend",
          "score": 40,
          "reasons": [
            "运动与受力（路程）",
            "数量结构（分数、有理数）",
            "学段偏低，交互优先于文字推导"
          ]
        }
      },
      {
        "id": "scene_5",
        "order": 5,
        "type": "lecture",
        "title": "向后转与指数管辖：乘除乘方",
        "description": "多个负数相乘怎么办？数负号，奇负偶正。除变乘、小数化分数。重点讲指数管辖范围：没括号指数只管紧挨的数，有括号管整个括号。-5²=-25，(-5)²=25。用杨幂不叫杨乘方的段子记住底数、指数、幂。混合运算顺序与小学相同，先括号再乘除后加减。",
        "teachingObjective": "掌握乘除法则、乘方意义和指数管辖范围。",
        "completionCriteria": [
          "能达成学习目标：掌握乘除法则、乘方意义和指数管辖范围。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "有理数乘除法",
          "有理数乘方",
          "有理数混合运算"
        ],
        "takeaways": [
          "多个负因数：奇负偶正",
          "-5²=-25，(-5)²=25，括号决定指数管辖",
          "除变乘、小数化分数、先括号再乘除后加减"
        ],
        "difficultyTier": 3,
        "estimatedMinutes": 5,
        "sourceChunkIds": [],
        "exerciseSpec": {
          "types": [],
          "count": 0
        },
        "prerequisites": [
          "kp_9",
          "kp_10"
        ],
        "knowledgePointIds": [
          "kp_11",
          "kp_12",
          "kp_13"
        ],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "none",
          "score": 16,
          "reasons": [
            "数量结构（分数、有理数）"
          ]
        }
      },
      {
        "id": "scene_6",
        "order": 6,
        "type": "practice",
        "title": "混合运算与科学记数法应用",
        "description": "综合练习含乘方、绝对值、乘除的混合运算，练\"遇除变乘再约分\"和\"绝对值先算\"。再练科学记数法：a×10ⁿ中a的整数部分必须是一位非零数，10的指数等于小数点移动的位数。近似数四舍五入，精确到千位要回原数找数位。",
        "teachingObjective": "规范完成含乘方、绝对值、乘除的混合运算；会用科学记数法表示数。",
        "completionCriteria": [
          "能达成学习目标：规范完成含乘方、绝对值、乘除的混合运算；会用科学记数法表示数。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "有理数混合运算",
          "科学记数法"
        ],
        "takeaways": [
          "有乘方先算乘方，再乘除后加减",
          "科学记数法中a的整数部分必须是一位非零数",
          "10的指数等于小数点移动的位数"
        ],
        "difficultyTier": 3,
        "estimatedMinutes": 7,
        "sourceChunkIds": [],
        "exerciseSpec": {
          "types": [],
          "count": 0
        },
        "prerequisites": [
          "kp_12",
          "kp_13"
        ],
        "knowledgePointIds": [
          "kp_14"
        ],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "none",
          "score": 16,
          "reasons": [
            "数量结构（绝对值、约分、有理数）"
          ]
        }
      },
      {
        "id": "scene_7",
        "order": 7,
        "type": "quiz",
        "title": "有理数核心快问快答",
        "description": "3道快问快答覆盖概念、运算和易错点。有选择题考\"哪个不是有理数\"，判断题考\"-5²=25\"这个经典错误，填空题考绝对值和相反数。错哪儿改哪儿，搞懂为止。",
        "teachingObjective": "检测对核心概念和易错点的掌握。",
        "completionCriteria": [
          "能达成学习目标：检测对核心概念和易错点的掌握。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "有理数概念辨析",
          "有理数运算规范",
          "易错点排查"
        ],
        "takeaways": [
          "0非正非负，相反数是本身",
          "负数比较数值越大数越小",
          "指数管辖范围决定符号"
        ],
        "difficultyTier": 3,
        "estimatedMinutes": 5,
        "sourceChunkIds": [],
        "exerciseSpec": {
          "types": [
            "choice",
            "judge"
          ],
          "count": 2
        },
        "prerequisites": [
          "kp_13",
          "kp_14"
        ],
        "knowledgePointIds": [
          "kp_15",
          "kp_16",
          "kp_17"
        ],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "none",
          "score": 26,
          "reasons": [
            "数量结构（有理数、绝对值、相反数）",
            "对照与分类（易错、辨析）",
            "学段偏低，交互优先于文字推导"
          ]
        }
      },
      {
        "id": "scene_8",
        "order": 8,
        "type": "review",
        "title": "特殊值复盘与方法清单",
        "description": "总结时间到。为师带你复盘0、1、-1的特殊性质：相反数是本身只有0，绝对值是本身是非负数，倒数是本身是±1，平方是本身是0和1，立方是本身是0、±1。再盘点全章口诀：奇负偶正、除变乘、小数化分数、负数不能裸奔、指数管辖范围。最后CTA：为师这就讲完了，徒儿们速速刷题去吧。",
        "teachingObjective": "记住特殊值性质，形成全章方法清单。",
        "completionCriteria": [
          "能达成学习目标：记住特殊值性质，形成全章方法清单。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "特殊值综合",
          "全章运算口诀",
          "概念方法清单"
        ],
        "takeaways": [
          "相反数是本身只有0；绝对值是本身是非负数；倒数是本身是±1",
          "平方是本身是0和1；立方是本身是0、±1",
          "奇负偶正、除变乘、小数化分数、指数管辖范围、非负相加得0则每项为0"
        ],
        "difficultyTier": 3,
        "estimatedMinutes": 5,
        "sourceChunkIds": [],
        "exerciseSpec": {
          "types": [],
          "count": 0
        },
        "prerequisites": [
          "kp_16",
          "kp_17"
        ],
        "knowledgePointIds": [
          "kp_18",
          "kp_19",
          "kp_20"
        ],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "none",
          "score": 16,
          "reasons": [
            "数量结构（相反数、绝对值、倒数）"
          ]
        }
      }
    ],
    "allowedChunkIds": [],
    "repairs": [],
    "createdAt": "2026-11-17T07:26:42.682Z"
  },
  "validation": {
    "passed": true,
    "violations": [],
    "metrics": {
      "coverage": 1,
      "durationDrift": 0,
      "totalMinutes": 40,
      "violationCount": 0,
      "errorCount": 0
    }
  },
  "repairs": [],
  "ledger": {
    "planId": "plan-mwkdcuey",
    "entries": [
      {
        "id": "ev_3",
        "kind": "requirement",
        "ref": "rq_1",
        "locator": "",
        "quote": "",
        "note": "课程要求",
        "addedBy": "local"
      }
    ],
    "claims": [
      {
        "id": "cl_6",
        "sceneId": "scene_1",
        "target": "b2",
        "kind": "definition",
        "text": "正数与负数：比0大的数是正数，比0小的数是负数；0是正负分界点，非正非负。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_7",
        "sceneId": "scene_1",
        "target": "b6",
        "kind": "example",
        "text": "正解：零上5℃记 +5℃，零下5℃记 -5℃ → 0是分界点，非正非负 → 分类时0单独一类，别塞进正数或负数",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_8",
        "sceneId": "scene_1",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：能说出正负数的相对意义，0非正非负；能把给定数按整数/分数和正负分类。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_9",
        "sceneId": "scene_1",
        "target": "scene",
        "kind": "criterion",
        "text": "能指出本场景中一个仍待核对的疑问或边界",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_14",
        "sceneId": "scene_3",
        "target": "b2",
        "kind": "definition",
        "text": "有理数加法法则：同号相加，符号不变，绝对值相加；异号相加，取绝对值较大的符号，并用大绝对值减小绝对值；互为相反数的两数相加得 0。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_15",
        "sceneId": "scene_3",
        "target": "b6",
        "kind": "example",
        "text": "正解：最终位置 = 27+(-41)=-14 千米，在岗亭南边 14 千米 → 总路程 = |27|+|-41|=68 千米 → 总耗油 = 68a 升",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_16",
        "sceneId": "scene_3",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：掌握加减法法则和大小比较方法；理解非负性用途。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_17",
        "sceneId": "scene_3",
        "target": "scene",
        "kind": "criterion",
        "text": "能指出本场景中一个仍待核对的疑问或边界",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_22",
        "sceneId": "scene_2",
        "target": "b2",
        "kind": "definition",
        "text": "相反数与绝对值：只有符号不同的两个数互为相反数，a 的相反数是 -a，0 的相反数是 0；数轴上表示数 a 的点到原点的距离叫做 a 的绝对值，记 |a|。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_23",
        "sceneId": "scene_2",
        "target": "b7",
        "kind": "example",
        "text": "正解：|a|=a 时，a 可以是正数，也可以是 0，合起来是非负数 → 相反数等于本身的只有 0；绝对值等于本身的是正数和 0 → 特别提醒你注意：0 的相反数是 0，0 的绝对值也是 0",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_24",
        "sceneId": "scene_2",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：会画数轴并标出相反数；会用距离定义求绝对值。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_25",
        "sceneId": "scene_2",
        "target": "scene",
        "kind": "criterion",
        "text": "能指出本场景中一个仍待核对的疑问或边界",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_31",
        "sceneId": "scene_4",
        "target": "scene",
        "kind": "reference",
        "text": "是否先把减法变成加法，将加减混合统一成加法式子，再观察数字特点",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_32",
        "sceneId": "scene_4",
        "target": "scene",
        "kind": "reference",
        "text": "是否利用加法交换律、结合律带符号搬家，寻找同号或能凑整的数先算，且符号随数一起走",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_33",
        "sceneId": "scene_4",
        "target": "scene",
        "kind": "reference",
        "text": "能否写出统一后的式子，说明分组凑整过程，并给出带符号的最终位置",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_34",
        "sceneId": "scene_4",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：规范完成加减混合运算，会用凑整简化。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_35",
        "sceneId": "scene_4",
        "target": "scene",
        "kind": "criterion",
        "text": "能指出本场景中一个仍待核对的疑问或边界",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_41",
        "sceneId": "scene_6",
        "target": "scene",
        "kind": "reference",
        "text": "乘方符号判断：负号在括号外不参与乘方，-5² 与 (-5)² 的结果不同，需先看清指数管辖范围",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_42",
        "sceneId": "scene_6",
        "target": "scene",
        "kind": "reference",
        "text": "科学记数法格式：a 必须满足 1≤|a|<10，整数部分只能是一位非零数，-10.7 不符合要求",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_43",
        "sceneId": "scene_6",
        "target": "scene",
        "kind": "reference",
        "text": "混合运算顺序：含乘方、乘法、加法的算式，要按先乘方、再乘除、后加减的顺序核算，并检查符号",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_44",
        "sceneId": "scene_6",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：规范完成含乘方、绝对值、乘除的混合运算；会用科学记数法表示数。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_45",
        "sceneId": "scene_6",
        "target": "scene",
        "kind": "criterion",
        "text": "能指出本场景中一个仍待核对的疑问或边界",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_52",
        "sceneId": "scene_7",
        "target": "course-q-1",
        "kind": "question",
        "text": "徒儿，为师问你：绝对值等于它本身的数，是什么数？",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_53",
        "sceneId": "scene_7",
        "target": "course-q-1",
        "kind": "explanation",
        "text": "那么问题来了，绝对值等于它本身的，难道负数也行吗？错错错。-3 的绝对值是 3，才不是 -3。有小伙伴说只有正数，对喽一半！0 的绝对值还是 0。我再强调一遍：正数和 0 合起来叫非负数。所以这题选「非负数」。易错点：只选「正数」，漏了 0。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_54",
        "sceneId": "scene_7",
        "target": "course-q-2",
        "kind": "question",
        "text": "等等，难道 -5² 和 (-5)² 的结果一样吗？徒儿你判断这对不对。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_55",
        "sceneId": "scene_7",
        "target": "course-q-2",
        "kind": "explanation",
        "text": "徒儿先猜，再听为师算。-5² 里指数只管紧挨的 5，等于 -(5×5)=-25。(-5)² 里有括号，指数管整个 -5，等于 25。一个 -25 一个 25，能一样吗？特别提醒你注意：指数管辖范围，没括号只管一个，有括号管一窝。这题是易错点，千万别忘了。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_56",
        "sceneId": "scene_7",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：检测对核心概念和易错点的掌握。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_57",
        "sceneId": "scene_7",
        "target": "scene",
        "kind": "criterion",
        "text": "能指出本场景中一个仍待核对的疑问或边界",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_62",
        "sceneId": "scene_5",
        "target": "b2",
        "kind": "definition",
        "text": "乘方与指数管辖：求 n 个相同因数相乘的积叫乘方。底数是挨着指数的数，指数站在右上角管着底数。没括号时指数只管紧挨的那个数；有括号时指数管整个括号里的数。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_63",
        "sceneId": "scene_5",
        "target": "b5",
        "kind": "example",
        "text": "正解：-5² 的底数是 5，得 -25；(-5)² 的底数是 -5，得 25，两者相加为 0 → 除变乘：12×(-1/2)×3，从左到右算得 -18",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_64",
        "sceneId": "scene_5",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：掌握乘除法则、乘方意义和指数管辖范围。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_65",
        "sceneId": "scene_5",
        "target": "scene",
        "kind": "criterion",
        "text": "能指出本场景中一个仍待核对的疑问或边界",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_71",
        "sceneId": "scene_8",
        "target": "b2",
        "kind": "definition",
        "text": "特殊值「等于本身」家族：在有理数中，0、1、-1 这几个特殊值，经过相反数、绝对值、倒数、平方、立方运算后，结果可能等于原数。记不住就把三兄弟依次代进去验证。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_72",
        "sceneId": "scene_8",
        "target": "b4",
        "kind": "example",
        "text": "正解：平方等于本身：0²=0，1²=1 → (-1)²=1≠-1，所以 -1 不算 → 答案只有 0 和 1",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_73",
        "sceneId": "scene_8",
        "target": "b5",
        "kind": "conclusion",
        "text": "我再强调一遍：负数参与乘方、代入、作分母时，必须先加括号。-5² 的底数是 5，得 -25；(-5)² 的底数是 -5，得 25。指数管辖范围，括号说了算。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_74",
        "sceneId": "scene_8",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：记住特殊值性质，形成全章方法清单。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_75",
        "sceneId": "scene_8",
        "target": "scene",
        "kind": "criterion",
        "text": "能指出本场景中一个仍待核对的疑问或边界",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      }
    ],
    "seq": 75
  },
  "fallback": false,
  "demo": true,
  "generatorVersion": "rational-generator-v1",
  "createdAt": "2026-11-17T07:24:23.220Z",
  "updatedAt": "2026-11-17T07:37:40.723Z"
}

export default DEMO_COURSE_RATIONAL_PROJECT
