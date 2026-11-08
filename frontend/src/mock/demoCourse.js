/** 自动生成的系统性演示课程 —— scripts/generate-demo-course.mjs 产出，请勿手改。
 * 重新生成：npm run gen:demo-course（需 frontend/.env 配置 DEEPSEEK_API_KEY）
 * 生成时间：2026-11-08T16:11:55.346Z｜模型：deepseek-chat
 */

export const DEMO_COURSE_META = {
  "generatedAt": "2026-11-08T16:11:55.346Z",
  "model": "deepseek-chat",
  "durationMinutes": 45,
  "sceneCount": 9,
  "lectureCount": 4,
  "quizCount": 2,
  "practiceCount": 2,
  "reviewCount": 1,
  "boardSceneCount": 5,
  "questionCount": 6,
  "scriptBeatCount": 127,
  "validation": {
    "passed": true,
    "errorCount": 0,
    "warningCount": 0,
    "coverage": 1,
    "durationDrift": 2,
    "codes": []
  },
  "ledger": {
    "total": 53,
    "supportRate": 0.34,
    "unsupportedRate": 0.66
  },
  "remainingErrorIssues": [],
  "stats": {
    "blueprintCalls": 1,
    "sceneCalls": 9,
    "sceneRepairCalls": 0,
    "scriptCalls": 9,
    "sceneFallbacks": 0,
    "scriptFallbacks": 0,
    "deterministicRepairs": 0,
    "modelRepairs": 0
  }
}

export const DEMO_COURSE_PROJECT = {
  "id": "course-demo-mw815lqq",
  "ownerId": "",
  "status": "ready",
  "title": "计划职能：类型、过程与组织控制衔接",
  "chapter": "第3章 决策与计划",
  "domain": "management",
  "objective": "理解计划职能的含义、计划的主要类型与制定过程，能用一个企业案例说明计划如何衔接组织与控制",
  "audience": "高校管理类专业二年级学生",
  "mode": "course",
  "durationMinutes": 45,
  "summary": "本课帮助管理类专业二年级学生理解计划职能的含义、主要类型与制定过程，并用一个企业案例说明计划如何衔接组织与控制。学完能按步骤分析企业计划问题，并解释计划、组织、控制三者的联动关系。",
  "languageDirective": "使用规范学术汉语，术语采用材料中的标准表述（如战略计划、目标管理、滚动计划法）。案例讲解用具体企业情境，避免生僻字与乱码字形。",
  "learnerProfile": {
    "stage": "university",
    "stageLabel": "大学",
    "gradeLabel": "高校管理类专业二年级",
    "language": "使用规范学术汉语，先建立框架再讲概念，术语与材料一致，案例用具体企业情境。",
    "teaching": "先框架后概念，配合企业案例与练习，强调考点辨析（如战略计划与作业计划、MBO与压指标）。",
    "board": "板书以“计划—组织—控制”一条主线加类型分类表、制定过程流程图为主，案例用分步演示。",
    "subject": "管理学（决策与计划）",
    "confidence": "high",
    "evidence": "用户明确写“高校管理类专业二年级学生”，并给出章节“第3章 决策与计划”与计划职能相关目标。",
    "source": "explicit"
  },
  "outlines": [
    {
      "id": "scene_1",
      "type": "lecture",
      "title": "计划职能是什么：从问题到框架",
      "description": "回顾锚点：回顾上一章决策过程六步骤，指出决策之后要落地为计划。热身提问：请学生说一个自己定过的学习计划，它包含哪些要素。动机问题：为什么有的企业计划写完就束之高阁，而有的计划能推动组织行动？本场景建立计划职能的含义与“计划—组织—控制”主线框架。",
      "teachingObjective": "能用自己的话说明计划职能的含义，并说出计划在管理循环中的位置。",
      "keyPoints": [
        "计划职能的含义",
        "计划与决策的关系",
        "计划—组织—控制主线"
      ],
      "takeaways": [
        "计划职能是为实现目标而对未来行动做出的预先安排。",
        "计划是决策的延续，决策选方向，计划定路径。",
        "计划、组织、控制构成管理闭环，计划是起点。"
      ],
      "difficultyTier": 1,
      "estimatedMinutes": 4,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "skip",
        "score": 14,
        "reasons": [
          "过程与变换（循环）"
        ]
      },
      "order": 1
    },
    {
      "id": "scene_2",
      "type": "lecture",
      "title": "计划怎么分：三个维度看类型",
      "description": "从层次、时间、明确性三个维度拆解计划类型，重点辨析战略计划与作业计划的差别，并说明各类型适用场景。",
      "teachingObjective": "能按三个维度对给定计划进行分类，并说明战略计划与作业计划的关键区别。",
      "keyPoints": [
        "按层次分：战略、战术、作业计划",
        "按时间分：长期、中期、短期计划",
        "按明确性分：具体计划与指导性计划"
      ],
      "takeaways": [
        "战略计划由高层制定、覆盖全局、期限较长。",
        "作业计划面向具体任务，期限短、明确性高。",
        "同一计划可同时属于多个维度，分类看的是划分标准。"
      ],
      "difficultyTier": 1,
      "estimatedMinutes": 5,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "skip",
        "score": 10,
        "reasons": [
          "对照与分类（辨析、分类、区别）"
        ]
      },
      "order": 2
    },
    {
      "id": "scene_3",
      "type": "lecture",
      "title": "计划怎么定：制定过程与工具",
      "description": "讲解计划制定过程的主要步骤，并引入目标管理（MBO）与SMART原则、滚动计划法“近细远粗”两个工具，说明它们分别解决什么问题。",
      "teachingObjective": "能按步骤描述计划制定过程，并说明MBO与滚动计划法各自的作用与易错点。",
      "keyPoints": [
        "计划制定过程的主要步骤",
        "目标管理与SMART原则",
        "滚动计划法近细远粗"
      ],
      "takeaways": [
        "计划制定是识别机会、设定目标、拟定方案、选择方案、编制计划、执行反馈的多步骤过程。",
        "MBO强调上下级共同制定目标与自我控制，不是自上而下压指标。",
        "滚动计划法按近细远粗定期修订，适合环境变化大的场景。"
      ],
      "difficultyTier": 2,
      "estimatedMinutes": 6,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "skip",
        "score": 10,
        "reasons": [
          "对照与分类（易错）"
        ]
      },
      "order": 3
    },
    {
      "id": "scene_4",
      "type": "quiz",
      "title": "检索练习：类型与过程辨析",
      "description": "用选择题与判断题快速检索计划类型、制定过程与MBO易错点，其中一题直接考查“MBO不是压指标”这一易错点。",
      "teachingObjective": "能准确区分计划类型，并识别MBO与滚动计划法的常见误解。",
      "keyPoints": [
        "计划的类型",
        "计划的制定过程",
        "目标管理与SMART原则"
      ],
      "takeaways": [
        "分类看标准，不混用维度。",
        "MBO的关键是参与与自我控制。",
        "滚动计划法不等于弹性计划。"
      ],
      "difficultyTier": 2,
      "estimatedMinutes": 5,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "skip",
        "score": 10,
        "reasons": [
          "对照与分类（辨析、易错）"
        ]
      },
      "order": 4
    },
    {
      "id": "scene_5",
      "type": "practice",
      "title": "案例应用：一家企业的计划链条",
      "description": "给出一个企业案例情境（如某制造企业年度目标分解到车间任务），让学生按计划制定过程梳理其计划链条，并指出计划如何为组织分工与控制标准提供依据。",
      "teachingObjective": "能用计划制定过程分析企业案例，并说明计划对组织与控制的前置作用。",
      "keyPoints": [
        "计划制定过程的主要步骤",
        "计划与组织、控制的衔接"
      ],
      "takeaways": [
        "企业计划从战略目标逐层分解为部门与岗位任务。",
        "计划分解的结果直接决定组织分工与职责。",
        "计划中的目标与指标就是控制的标准来源。"
      ],
      "difficultyTier": 3,
      "estimatedMinutes": 8,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "skip",
        "score": 0,
        "reasons": []
      },
      "order": 5
    },
    {
      "id": "scene_6",
      "type": "lecture",
      "title": "计划如何衔接组织与控制：闭环视角",
      "description": "从闭环视角讲清计划、组织、控制三者的接口：计划定目标与标准，组织配资源与职责，控制比对偏差并反馈修订计划，并辨析常见误区。",
      "teachingObjective": "能画出计划—组织—控制闭环，并解释反馈如何回到计划修订。",
      "keyPoints": [
        "计划为组织提供分工依据",
        "计划为控制提供标准",
        "控制反馈修订计划"
      ],
      "takeaways": [
        "没有计划，组织分工失去依据，控制失去标准。",
        "控制不是计划之后的一次性动作，而是持续反馈。",
        "偏差反馈会触发计划修订，形成闭环。"
      ],
      "difficultyTier": 3,
      "estimatedMinutes": 6,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "skip",
        "score": 10,
        "reasons": [
          "对照与分类（辨析）"
        ]
      },
      "order": 6
    },
    {
      "id": "scene_7",
      "type": "quiz",
      "title": "易错点检测：MBO与滚动计划法",
      "description": "针对本课易错点设计选择题与判断题，检测学生是否把MBO误解为压指标、把滚动计划法等同于弹性计划。",
      "teachingObjective": "能识别并纠正MBO与滚动计划法的典型误解。",
      "keyPoints": [
        "目标管理与SMART原则",
        "滚动计划法近细远粗"
      ],
      "takeaways": [
        "MBO重参与与自我控制。",
        "滚动计划法靠定期修订保持弹性。",
        "易错点要靠对比记忆。"
      ],
      "difficultyTier": 3,
      "estimatedMinutes": 4,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "skip",
        "score": 10,
        "reasons": [
          "对照与分类（易错）"
        ]
      },
      "order": 7
    },
    {
      "id": "scene_8",
      "type": "practice",
      "title": "迁移练习：为案例企业补一份计划",
      "description": "让学生为案例企业的一个部门补写短期作业计划，要求符合SMART原则，并说明该计划将如何被组织落实、被控制检验。",
      "teachingObjective": "能写出符合SMART的部门计划，并指出其组织落实与控制检验方式。",
      "keyPoints": [
        "目标管理与SMART原则",
        "计划与组织、控制的衔接"
      ],
      "takeaways": [
        "好计划要具体、可衡量、有时限。",
        "计划写完要落到责任人与资源。",
        "计划指标要能进入控制环节被检验。"
      ],
      "difficultyTier": 3,
      "estimatedMinutes": 5,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "skip",
        "score": 0,
        "reasons": []
      },
      "order": 8
    },
    {
      "id": "scene_9",
      "type": "review",
      "title": "收束复盘：一条主线与三个易错点",
      "description": "汇总本课主线与特殊值、方法清单：计划—组织—控制闭环，计划类型三维度，制定过程步骤，MBO与滚动计划法要点，并回顾易错点。",
      "teachingObjective": "能复述本课主线与方法清单，并说出三个易错点的正确表述。",
      "keyPoints": [
        "计划职能的含义",
        "计划的类型",
        "计划的制定过程",
        "计划与组织、控制的衔接"
      ],
      "takeaways": [
        "计划是管理闭环的起点，为组织提供依据、为控制提供标准。",
        "分类看标准，MBO重参与，滚动计划法靠近细远粗。",
        "案例分析的通用方法：定目标、分层次、配组织、设标准、看反馈。"
      ],
      "difficultyTier": 3,
      "estimatedMinutes": 4,
      "sourceChunkIds": [],
      "visualHint": {
        "level": "skip",
        "score": 10,
        "reasons": [
          "对照与分类（易错）"
        ]
      },
      "order": 9
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
          "chapter": "第3章 决策与计划",
          "title": "计划职能是什么：从问题到框架",
          "subtitle": "用一句话说清计划职能的含义，并把它放回管理循环中定位",
          "blocks": [
            {
              "type": "outline",
              "title": "本节路线图",
              "items": [
                "先看一个计划长什么样",
                "给计划职能下定义",
                "计划与决策怎么接",
                "计划—组织—控制主线",
                "留一个问题带走"
              ],
              "persistent": true,
              "id": "b1"
            },
            {
              "type": "definition",
              "title": "核心概念：计划职能",
              "term": "计划职能",
              "definition": "计划职能是为实现目标而对未来行动做出的预先安排。它回答三件事：要达成什么、通过什么路径、什么时候做到。",
              "concreteAnchor": "开学第一周你给自己排的复习表：哪天看哪章、几点到几点、周末做一套题——这就是一份计划。",
              "analogy": "决策像选目的地，计划像画路线图：目的地定了，还得标出先走哪条路、在哪歇脚。",
              "method": [
                "先定目标",
                "再排路径与时间",
                "最后留出检查点"
              ],
              "verify": "回带检查：把这份安排交给别人，他能不能照着做？能，才算计划。",
              "id": "b2"
            },
            {
              "type": "table",
              "title": "计划与决策：分工对照",
              "columns": [
                "维度",
                "决策",
                "计划"
              ],
              "rows": [
                [
                  "回答的问题",
                  "走哪个方向",
                  "怎么走到"
                ],
                [
                  "产出",
                  "选定的方案",
                  "目标、路径、时间安排"
                ],
                [
                  "在循环中的位置",
                  "计划之前",
                  "决策的延续"
                ],
                [
                  "材料依据",
                  "决策过程六步骤",
                  "计划职能含义（待核对：教材原文表述）"
                ]
              ],
              "id": "b3"
            },
            {
              "type": "diagram",
              "title": "计划—组织—控制：管理闭环",
              "nodes": [
                {
                  "label": "计划",
                  "note": "定目标与路径，是起点"
                },
                {
                  "label": "组织",
                  "note": "配人、配资源去执行"
                },
                {
                  "label": "控制",
                  "note": "比对偏差，反馈修正"
                }
              ],
              "caption": "控制的结果回流到计划，闭环才转得起来",
              "id": "b4"
            },
            {
              "type": "callout",
              "title": "易错点：计划不是写完就完",
              "tone": "warn",
              "text": "常见误解是把计划当成一次性文件。材料强调计划要能衔接组织与控制：没有组织和控制接住，计划就只是纸面安排。",
              "mnemonic": "口诀：计划定路，组织走路，控制看路。",
              "id": "b5"
            },
            {
              "type": "question",
              "title": "停下来想一想",
              "prompt": "某企业年度计划写得很漂亮，年底却几乎没完成。按“计划—组织—控制”主线，最可能断在哪一环？",
              "options": [
                "计划环节：目标本身没定清楚",
                "组织环节：没配人配资源去执行",
                "控制环节：执行中没人比对偏差并反馈"
              ],
              "transition": {
                "enter": "pop",
                "durationMs": 420
              },
              "id": "b6"
            }
          ]
        },
        "sourceChunkIds": []
      },
      "script": {
        "persona": "沉稳的管理学老师，习惯先抛问题再讲解，用日常语言把概念落到学生身边",
        "beats": [
          {
            "kind": "question",
            "text": "先问大家一句：你早上出门前想好今天要干哪几件事，这算不算在做计划？想一想，别急着答。",
            "pauseMs": 1800,
            "blockId": "b1",
            "emphasis": [
              "计划",
              "想一想"
            ]
          },
          {
            "kind": "answer",
            "text": "算，但只是最浅的一层。我们这门课说的计划职能，是管理者事先定目标、选路径、配资源的一套正式工作。",
            "pauseMs": 800,
            "blockId": "b1",
            "emphasis": [
              "目标",
              "路径",
              "资源"
            ]
          },
          {
            "kind": "question",
            "text": "那再往下追一步：计划到底要回答哪几个问题？谁能用几个词概括一下？",
            "pauseMs": 1800,
            "blockId": "b2",
            "emphasis": [
              "回答哪几个问题"
            ]
          },
          {
            "kind": "answer",
            "text": "核心就三问：做什么、怎么做、拿什么做。落到定义上，就是明确目标、拟定可行方案、安排资源与时间。",
            "pauseMs": 800,
            "blockId": "b2",
            "emphasis": [
              "做什么",
              "怎么做",
              "拿什么做"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，抓住“目标加方案加资源”这三样，定义就立住了。别把它背成一句空话。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "那计划和决策是什么关系？有人说计划就是决策，你同意吗？",
            "pauseMs": 1800,
            "blockId": "b3",
            "emphasis": [
              "决策",
              "关系"
            ]
          },
          {
            "kind": "answer",
            "text": "两者咬得很紧，但分工不同：决策重在选，在几个方案里拍板；计划重在铺，把选定的路铺成步骤、责任和时间表。",
            "pauseMs": 800,
            "blockId": "b3",
            "emphasis": [
              "选",
              "铺",
              "步骤"
            ]
          },
          {
            "kind": "recall",
            "text": "回想刚才那句定义：目标、方案、资源。决策定的是目标和方案的方向，计划负责把它落成可执行的安排。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "那计划在管理循环里站哪儿？我们把它写在旁边这张图上，你觉得它排第几？",
            "pauseMs": 1800,
            "blockId": "b4",
            "emphasis": [
              "管理循环",
              "第几"
            ]
          },
          {
            "kind": "answer",
            "text": "它排最前。先有计划定方向，组织才好搭架子分人手，控制才有尺子去比对偏差。计划是后面两步的依据。",
            "pauseMs": 800,
            "blockId": "b4",
            "emphasis": [
              "最前",
              "依据"
            ]
          },
          {
            "kind": "confirm",
            "text": "没错，计划—组织—控制是一条主线，计划打头。没有它，组织和控制都会失去参照。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "最后一个坑：计划写完贴在墙上，是不是这个职能就完成了？",
            "pauseMs": 1800,
            "blockId": "b5",
            "emphasis": [
              "写完就完"
            ]
          },
          {
            "kind": "answer",
            "text": "不是。计划是活的：执行中要跟踪、要修正，偏差反馈回去再调计划，这才和控制接上了口。",
            "pauseMs": 800,
            "blockId": "b5",
            "emphasis": [
              "活的",
              "修正",
              "反馈"
            ]
          },
          {
            "kind": "cta",
            "text": "课后请你用自己的话写三句：计划是什么、它和决策怎么分工、它在循环里排第几。下节课我们拿一个企业案例来验一验。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          }
        ],
        "sceneTitle": "计划职能是什么：从问题到框架",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"lecture\",\"title\":\"计划职能是什么：从问题到框架\",\"description\":\"回顾锚点：回顾上一章决策过程六步骤，指出决策之后要落地为计划。热身提问：请学生说一个自己定过的学习计划，它包含哪些要素。动机问题：为什么有的企业计划写完就束之高阁，而有的计划能推动组织行动？本场景建立计划职能的含义与“计划—组织—控制”主线框架。\",\"objective\":\"能用自己的话说明计划职能的含义，并说出计划在管理循环中的位置。\",\"keyPoints\":[\"计划职能的含义\",\"计划与决策的关系\",\"计划—组织—控制主线\"]}",
      "evidence": [
        {
          "id": "cl_6",
          "target": "b2",
          "kind": "definition",
          "text": "计划职能：计划职能是为实现目标而对未来行动做出的预先安排。它回答三件事：要达成什么、通过什么路径、什么时候做到。",
          "evidenceIds": []
        },
        {
          "id": "cl_7",
          "target": "b5",
          "kind": "conclusion",
          "text": "常见误解是把计划当成一次性文件。材料强调计划要能衔接组织与控制：没有组织和控制接住，计划就只是纸面安排。",
          "evidenceIds": []
        },
        {
          "id": "cl_8",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：能用自己的话说明计划职能的含义，并说出计划在管理循环中的位置。",
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
      "subjectIssues": [],
      "repairs": [],
      "error": ""
    },
    {
      "outlineId": "scene_2",
      "status": "ready",
      "content": {
        "kind": "board",
        "lesson": {
          "chapter": "第3章 决策与计划",
          "title": "计划怎么分：三个维度看类型",
          "subtitle": "用层次、时间、明确性三把尺子，给同一份计划贴对标签",
          "blocks": [
            {
              "type": "outline",
              "title": "本节路线图",
              "items": [
                "第一站：三个维度是什么",
                "第二站：层次维度——战略、战术、作业",
                "第三站：时间与明确性维度",
                "第四站：同一计划的多重身份"
              ],
              "persistent": true,
              "id": "b1"
            },
            {
              "type": "definition",
              "title": "核心概念",
              "term": "计划类型的三维划分",
              "definition": "计划类型可按三个标准划分：按层次分为战略计划、战术计划、作业计划；按时间分为长期、中期、短期计划；按明确性分为具体计划与指导性计划。",
              "concreteAnchor": "某制造企业高层定下“三年内进入行业前五”，生产车间排好下周的班次表——这两份文件都是计划，却分属不同维度。",
              "analogy": "像给同一件衣服贴三张标签：场合、季节、材质，标签不同但衣服只有一件。",
              "method": [
                "先问“谁制定、管多宽”——定层次",
                "再问“管多久”——定时间",
                "最后问“写得多细”——定明确性"
              ],
              "verify": "拿一份真实计划文件，三个维度各贴一个标签，看是否自洽。",
              "id": "b2"
            },
            {
              "type": "classification-tree",
              "title": "三个维度看类型",
              "root": {
                "label": "计划",
                "note": "同一计划可同时属于多个维度"
              },
              "branches": [
                {
                  "label": "按层次",
                  "note": "谁制定、覆盖多宽",
                  "children": [
                    {
                      "label": "战略计划",
                      "note": "高层制定、覆盖全局、期限较长"
                    },
                    {
                      "label": "战术计划",
                      "note": "中层制定、分解战略"
                    },
                    {
                      "label": "作业计划",
                      "note": "面向具体任务、期限短、明确性高"
                    }
                  ]
                },
                {
                  "label": "按时间",
                  "note": "管多久",
                  "children": [
                    {
                      "label": "长期计划",
                      "note": "待核对：具体年限材料未给"
                    },
                    {
                      "label": "中期计划",
                      "note": "待核对：具体年限材料未给"
                    },
                    {
                      "label": "短期计划",
                      "note": "待核对：具体年限材料未给"
                    }
                  ]
                },
                {
                  "label": "按明确性",
                  "note": "写得多细",
                  "children": [
                    {
                      "label": "具体计划",
                      "note": "目标与步骤清晰可执行"
                    },
                    {
                      "label": "指导性计划",
                      "note": "只给方向与原则，留弹性"
                    }
                  ]
                }
              ],
              "caption": "分类看的是划分标准，不是计划本身",
              "stages": [
                {
                  "label": "第一层：先立三个划分标准",
                  "branches": [
                    0,
                    1,
                    2
                  ],
                  "expand": []
                },
                {
                  "label": "第二层：展开层次维度",
                  "branches": [
                    0,
                    1,
                    2
                  ],
                  "expand": [
                    0
                  ]
                },
                {
                  "label": "第三层：展开明确性维度",
                  "branches": [
                    0,
                    1,
                    2
                  ],
                  "expand": [
                    2
                  ]
                }
              ],
              "grow": "staged",
              "id": "b3"
            },
            {
              "type": "table",
              "title": "战略计划与作业计划对照",
              "columns": [
                "比较项",
                "战略计划",
                "作业计划"
              ],
              "rows": [
                [
                  "制定者",
                  "高层",
                  "基层管理者与执行者"
                ],
                [
                  "覆盖范围",
                  "全局",
                  "具体任务"
                ],
                [
                  "期限",
                  "较长",
                  "短"
                ],
                [
                  "明确性",
                  "偏方向性",
                  "明确性高"
                ],
                [
                  "回答的问题",
                  "做什么、往哪走",
                  "怎么做、谁在何时做"
                ]
              ],
              "id": "b4"
            },
            {
              "type": "wrong-first",
              "title": "先看一个常见错解",
              "wrongSteps": [
                "看到“三年进入行业前五”，判断它是长期计划，所以是作业计划",
                "看到车间班次表写得很细，判断它是具体计划，所以是战略计划"
              ],
              "errorIndex": 0,
              "errorHint": "把“时间长短”直接当成“层次高低”，两个维度混用了。",
              "correctSteps": [
                "“三年进入行业前五”由高层制定、覆盖全局——层次上是战略计划，时间上是长期计划",
                "车间班次表面向具体任务、期限短、明确性高——层次上是作业计划，明确性上是具体计划",
                "结论：同一计划可同时属于多个维度，分类看的是划分标准"
              ],
              "takeaway": "维度之间不能互相替代，先问标准再贴标签。",
              "id": "b5"
            },
            {
              "type": "callout",
              "title": "易混提醒",
              "tone": "warn",
              "text": "材料明确：战略计划由高层制定、覆盖全局、期限较长。作业计划面向具体任务，期限短、明确性高。判断时先锁定“谁制定、管多宽”，再看时间与明确性。",
              "mnemonic": "口诀：先看人，再看天，最后看写得多细。",
              "id": "b6"
            },
            {
              "type": "question",
              "title": "停下来想一想",
              "prompt": "某公司发布“未来五年数字化转型纲要”，只写方向与原则，未列具体指标。按三个维度，它最贴切的标签组合是？",
              "options": [
                "战略计划 + 长期计划 + 指导性计划",
                "作业计划 + 短期计划 + 具体计划",
                "战术计划 + 中期计划 + 具体计划"
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
        "persona": "沉稳的管理学老师，习惯用提问带学生一步步拆解概念，语气亲切但不拖沓。",
        "beats": [
          {
            "kind": "question",
            "text": "上节课我们说了计划是管理的第一职能。那现在给你一家公司的年度计划书，你怎么判断它属于哪一种计划？想一想，分类的抓手在哪？",
            "pauseMs": 1800,
            "blockId": "b1",
            "emphasis": [
              "分类",
              "抓手"
            ]
          },
          {
            "kind": "answer",
            "text": "其实抓手不止一个。我们回到黑板，先画一条路线：层次、时间、明确性，三个维度各切一刀，同一份计划就能被定位三次。",
            "pauseMs": 700,
            "blockId": "b1",
            "emphasis": [
              "层次",
              "时间",
              "明确性"
            ]
          },
          {
            "kind": "question",
            "text": "先看第一个维度——层次。公司里有总经理、部门经理、一线主管，他们做的计划是一回事吗？你猜怎么分？",
            "pauseMs": 1800,
            "blockId": "b3",
            "emphasis": [
              "层次"
            ]
          },
          {
            "kind": "answer",
            "text": "按层次分三类：战略计划管全局和长远方向，战术计划把战略落到部门，作业计划则细到班组每天干什么。三层像漏斗，越往下越具体。",
            "pauseMs": 700,
            "blockId": "b3",
            "emphasis": [
              "战略",
              "战术",
              "作业"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，很多同学第一反应就是按部门分，但层次维度看的是计划在组织中的位置，不是部门名称。这个区分要记牢。",
            "pauseMs": 700,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "第二个维度是时间。长期、中期、短期，听起来简单，但多长算长？你心里的分界线是几年？",
            "pauseMs": 1800,
            "blockId": "b3",
            "emphasis": [
              "时间"
            ]
          },
          {
            "kind": "answer",
            "text": "没有绝对标准，但常见说法是：长期一般五年以上，中期一到五年，短期一年以内。注意，时间维度和层次维度会交叉，战略计划往往偏长期。",
            "pauseMs": 700,
            "blockId": "b3",
            "emphasis": [
              "长期",
              "中期",
              "短期"
            ]
          },
          {
            "kind": "question",
            "text": "第三个维度是明确性。有的计划写得像操作手册，有的只给方向。这两种计划分别叫什么？",
            "pauseMs": 1800,
            "blockId": "b3",
            "emphasis": [
              "明确性"
            ]
          },
          {
            "kind": "answer",
            "text": "写得具体、目标数字清晰的叫具体计划；只给指导原则、留出弹性的叫指导性计划。环境越不确定，指导性计划越有用。",
            "pauseMs": 700,
            "blockId": "b3",
            "emphasis": [
              "具体计划",
              "指导性计划"
            ]
          },
          {
            "kind": "confirm",
            "text": "没错，具体和指导不是好坏之分，而是看环境。稳定环境用具体计划，动荡环境留指导空间。",
            "pauseMs": 700,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "recall",
            "text": "我们停一下回顾：三个维度——层次、时间、明确性。同一份计划可以同时是战略的、长期的、指导性的。三个标签不冲突。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "那战略计划和作业计划到底差在哪？只是层次高低吗？看这张对照表，你发现最关键的区别是什么？",
            "pauseMs": 1800,
            "blockId": "b4",
            "emphasis": [
              "战略计划",
              "作业计划"
            ]
          },
          {
            "kind": "answer",
            "text": "关键区别在时间跨度、覆盖范围和不确定性。战略计划面向未来、覆盖整个组织、不确定性高；作业计划面向当下、范围窄、确定性高。",
            "pauseMs": 700,
            "blockId": "b4",
            "emphasis": [
              "时间跨度",
              "覆盖范围",
              "不确定性"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，所以战略计划更需要指导性，作业计划更适合具体化。这就把三个维度串起来了。",
            "pauseMs": 700,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "cta",
            "text": "课后找一家你熟悉的企业，把它的计划按三个维度各归一次类，下次课我们用案例看计划怎么衔接组织与控制。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          }
        ],
        "sceneTitle": "计划怎么分：三个维度看类型",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"lecture\",\"title\":\"计划怎么分：三个维度看类型\",\"description\":\"从层次、时间、明确性三个维度拆解计划类型，重点辨析战略计划与作业计划的差别，并说明各类型适用场景。\",\"objective\":\"能按三个维度对给定计划进行分类，并说明战略计划与作业计划的关键区别。\",\"keyPoints\":[\"按层次分：战略、战术、作业计划\",\"按时间分：长期、中期、短期计划\",\"按明确性分：具体计划与指导性计划\"]}",
      "evidence": [
        {
          "id": "cl_25",
          "target": "b2",
          "kind": "definition",
          "text": "计划类型的三维划分：计划类型可按三个标准划分：按层次分为战略计划、战术计划、作业计划；按时间分为长期、中期、短期计划；按明确性分为具体计划与指导性计划。",
          "evidenceIds": []
        },
        {
          "id": "cl_26",
          "target": "b5",
          "kind": "example",
          "text": "正解：“三年进入行业前五”由高层制定、覆盖全局——层次上是战略计划，时间上是长期计划 → 车间班次表面向具体任务、期限短、明确性高——层次上是作业计划，明确性上是具体计划 → 结论：同一计划可同时属于多个维度，分类看的是划分标准",
          "evidenceIds": []
        },
        {
          "id": "cl_27",
          "target": "b6",
          "kind": "conclusion",
          "text": "材料明确：战略计划由高层制定、覆盖全局、期限较长。作业计划面向具体任务，期限短、明确性高。判断时先锁定“谁制定、管多宽”，再看时间与明确性。",
          "evidenceIds": []
        },
        {
          "id": "cl_28",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：能按三个维度对给定计划进行分类，并说明战略计划与作业计划的关键区别。",
          "evidenceIds": [
            "ev_3"
          ]
        },
        {
          "id": "cl_29",
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
      "outlineId": "scene_3",
      "status": "ready",
      "content": {
        "kind": "board",
        "lesson": {
          "chapter": "第3章 决策与计划",
          "title": "计划怎么定：制定过程与工具",
          "subtitle": "按步骤走完计划制定流程，并用MBO与滚动计划法解决“目标怎么定、计划怎么改”两个真问题",
          "blocks": [
            {
              "type": "outline",
              "title": "本节路线图",
              "items": [
                "路线：六步制定过程（识别机会→反馈调整）",
                "定义：目标管理（MBO）与SMART",
                "对照：MBO与压指标、滚动计划与弹性计划",
                "提示：两个工具各治什么病",
                "追问：给你的案例配工具"
              ],
              "persistent": true,
              "id": "b1"
            },
            {
              "type": "definition",
              "title": "核心概念：计划制定过程",
              "term": "计划制定过程",
              "definition": "计划制定是识别机会、设定目标、拟定方案、选择方案、编制计划、执行反馈的多步骤过程；每一步都为下一步提供输入，反馈又回到目标与方案。",
              "concreteAnchor": "某连锁咖啡企业明年要新开50家门店：先看市场机会与自身产能，再定“新增50店、单店回本18个月”的目标，然后拟自建、加盟、并购三套方案，比较后选加盟为主，编出年度与季度计划，最后按月复盘调整。",
              "analogy": "像导航：先定位（识别机会）、再设目的地（目标）、选路线（方案）、出发（编制）、途中按路况改道（反馈）。",
              "method": [
                "按六步顺序展开，案例题逐步写，别只写“选择方案”",
                "每步问一句：这一步的输入从哪来、输出给谁",
                "反馈环节要写“回到目标或方案”，体现闭环"
              ],
              "verify": "遮住步骤名，能否凭“输入—输出”复述六步且不跳步。",
              "id": "b2"
            },
            {
              "type": "table",
              "title": "两个工具对照：MBO与滚动计划法",
              "columns": [
                "工具",
                "解决什么问题",
                "关键做法",
                "易错点"
              ],
              "rows": [
                [
                  "目标管理（MBO）",
                  "目标怎么定、怎么让人认账",
                  "上下级共同制定目标、分解目标、自我控制、以成果评价；目标符合SMART",
                  "误当成自上而下压指标，丢掉“参与”与“自我控制”"
                ],
                [
                  "滚动计划法",
                  "环境变了计划怎么改",
                  "按“近细远粗”定期修订并向前滚动，保持连续性与弹性",
                  "与“弹性计划”混为一谈，忽略“定期修订、向前滚动”"
                ]
              ],
              "id": "b3"
            },
            {
              "type": "wrong-first",
              "title": "先看一个常见错解",
              "wrongSteps": [
                "总经理直接把明年营收目标拆到各部门，要求签字认领",
                "认为这就是目标管理，因为“目标分解了、也考核了”",
                "计划一旦下发就整年不动，年底再对照"
              ],
              "errorIndex": 0,
              "errorHint": "材料原话：MBO强调“参与”和“自我控制”，不是自上而下压指标。",
              "correctSteps": [
                "上下级共同制定目标，部门对目标有参与和承诺",
                "目标分解后以自我控制为主，用成果评价",
                "环境变化大时叠加滚动计划法，近细远粗定期修订"
              ],
              "takeaway": "有目标不等于有MBO；有考核不等于有自我控制。",
              "id": "b4"
            },
            {
              "type": "callout",
              "title": "两个工具各治什么病",
              "tone": "warn",
              "text": "MBO治“目标没人认账”，滚动计划法治“计划赶不上变化”。目标要SMART：具体、可衡量、可实现、相关、有时限；滚动计划法记住“近细远粗、定期修订、向前滚动”，适合环境变化较大的场景。",
              "mnemonic": "目标靠参与，变化靠滚动；近处写细，远处写粗。",
              "id": "b5"
            },
            {
              "type": "question",
              "title": "停下来想一想",
              "prompt": "一家新能源车企面对电池技术快速迭代，年度计划该怎么配工具？",
              "options": [
                "只做自上而下的指标分解，全年不修订",
                "用MBO让研发与销售共同定目标，再用滚动计划法按季度近细远粗修订",
                "只做滚动计划法，不需要目标管理"
              ],
              "id": "b6"
            }
          ]
        },
        "sourceChunkIds": []
      },
      "script": {
        "persona": "沉稳的管理学老师，善用提问推进，语言口语化，注重学生思考与反馈。",
        "beats": [
          {
            "kind": "question",
            "text": "上节课我们讲了计划的类型，现在想一想：如果让你给一个企业定计划，你会从哪里开始？",
            "pauseMs": 1800,
            "blockId": "b1",
            "emphasis": [
              "从哪里开始"
            ]
          },
          {
            "kind": "answer",
            "text": "对，得先有个大方向。其实计划制定是有套路的，我们把它写在黑板上：第一步，估量机会；第二步，设定目标；第三步，确定前提条件；第四步，拟定备选方案；第五步，评价方案；第六步，选择方案；第七步，制定派生计划；第八步，用预算量化。",
            "pauseMs": 800,
            "blockId": "b1",
            "emphasis": [
              "估量机会",
              "设定目标",
              "八个步骤"
            ]
          },
          {
            "kind": "confirm",
            "text": "没错，这八步就是计划制定的基本流程。你可能会问，每一步具体怎么做？我们重点看第二步设定目标，因为目标错了，后面全错。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "说到设定目标，你听过SMART原则吗？它要求目标满足哪五个条件？",
            "pauseMs": 1800,
            "blockId": "b2",
            "emphasis": [
              "SMART原则"
            ]
          },
          {
            "kind": "answer",
            "text": "很好，SMART就是：具体、可衡量、可达成、相关、有时限。比如“提高客户满意度”就不够SMART，改成“本季度客户满意度提升到90%”就具体可衡量了。",
            "pauseMs": 800,
            "blockId": "b2",
            "emphasis": [
              "具体",
              "可衡量",
              "有时限"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，SMART原则能帮我们把模糊的目标变清晰。但光有目标还不够，计划还得能适应变化，这就引出了滚动计划法。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "滚动计划法你听说过吗？它为什么叫“滚动”？",
            "pauseMs": 1800,
            "blockId": "b3",
            "emphasis": [
              "滚动计划法"
            ]
          },
          {
            "kind": "answer",
            "text": "滚动计划法的核心是“近细远粗”：近期计划详细具体，远期计划粗略模糊。每过一段时间，就根据实际情况调整并向前滚动一期。比如五年计划，每年滚动一次，第一年详细，后四年粗略，第二年再细化。",
            "pauseMs": 800,
            "blockId": "b3",
            "emphasis": [
              "近细远粗",
              "滚动"
            ]
          },
          {
            "kind": "confirm",
            "text": "没错，滚动计划法让计划既有稳定性又有灵活性。但要注意，它容易犯一个错误：远期计划太粗，可能失去指导意义。所以粗细要适度。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "recall",
            "text": "我们回顾一下：计划制定八步骤，从估量机会到预算量化；SMART原则让目标清晰；滚动计划法近细远粗。这些你都记住了吗？",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "最后想一想：MBO和滚动计划法，它们各自解决什么问题？",
            "pauseMs": 1800,
            "blockId": "b5",
            "emphasis": [
              "MBO",
              "滚动计划法"
            ]
          },
          {
            "kind": "answer",
            "text": "MBO目标管理强调员工参与设定目标，解决的是目标认同和激励问题；滚动计划法解决的是计划适应变化的问题。两者结合，计划才既有人气又有弹性。",
            "pauseMs": 800,
            "blockId": "b5",
            "emphasis": [
              "目标管理",
              "适应变化"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，工具没有好坏，关键看用在哪。MBO治“目标不落地”，滚动计划法治“计划赶不上变化”。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "cta",
            "text": "课后请找一个企业案例，用今天讲的步骤和工具分析它的计划制定过程，下节课我们分享。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          }
        ],
        "sceneTitle": "计划怎么定：制定过程与工具",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"lecture\",\"title\":\"计划怎么定：制定过程与工具\",\"description\":\"讲解计划制定过程的主要步骤，并引入目标管理（MBO）与SMART原则、滚动计划法“近细远粗”两个工具，说明它们分别解决什么问题。\",\"objective\":\"能按步骤描述计划制定过程，并说明MBO与滚动计划法各自的作用与易错点。\",\"keyPoints\":[\"计划制定过程的主要步骤\",\"目标管理与SMART原则\",\"滚动计划法近细远粗\"]}",
      "evidence": [
        {
          "id": "cl_15",
          "target": "b2",
          "kind": "definition",
          "text": "计划制定过程：计划制定是识别机会、设定目标、拟定方案、选择方案、编制计划、执行反馈的多步骤过程；每一步都为下一步提供输入，反馈又回到目标与方案。",
          "evidenceIds": []
        },
        {
          "id": "cl_16",
          "target": "b4",
          "kind": "example",
          "text": "正解：上下级共同制定目标，部门对目标有参与和承诺 → 目标分解后以自我控制为主，用成果评价 → 环境变化大时叠加滚动计划法，近细远粗定期修订",
          "evidenceIds": []
        },
        {
          "id": "cl_17",
          "target": "b5",
          "kind": "conclusion",
          "text": "MBO治“目标没人认账”，滚动计划法治“计划赶不上变化”。目标要SMART：具体、可衡量、可实现、相关、有时限；滚动计划法记住“近细远粗、定期修订、向前滚动”，适合环境变化较大的场景。",
          "evidenceIds": []
        },
        {
          "id": "cl_18",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：能按步骤描述计划制定过程，并说明MBO与滚动计划法各自的作用与易错点。",
          "evidenceIds": [
            "ev_3"
          ]
        },
        {
          "id": "cl_19",
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
      "outlineId": "scene_4",
      "status": "ready",
      "content": {
        "kind": "quiz",
        "questions": [
          {
            "id": "course-q-1",
            "stem": "某公司总经理牵头制定未来五年的发展计划，明确公司整体进入哪些行业、如何配置资源；生产车间则据此制定下月的班组排产安排。关于这两类计划，下列说法正确的是：",
            "options": [
              "前者属于战略计划，由高层制定、覆盖全局、期限较长；后者属于作业计划",
              "前者属于作业计划，后者属于战略计划",
              "两者都属于战术计划，只是时间长短不同",
              "两者都属于具体计划，区别只在于由谁编写"
            ],
            "answerIndex": 0,
            "explanation": "正确答案是A。按层次划分，计划分为战略计划、战术计划和作业计划：战略计划由高层制定、覆盖全局、期限较长；作业计划则落到具体班组和短期安排。易错点：把“时间长短”当成唯一分类标准，忽略制定层次和覆盖范围，从而误选C或D。",
            "concept": "计划的类型（按层次划分）",
            "chapter": "第3章 决策与计划"
          },
          {
            "id": "course-q-2",
            "stem": "判断：目标管理（MBO）就是上级把指标层层分解、直接下达给下级，下级按指标执行即可。",
            "options": [
              "对",
              "错"
            ],
            "answerIndex": 1,
            "explanation": "正确答案是“错”。MBO强调上下级共同制定目标、分解目标、自我控制、以成果评价，核心是“参与”和“自我控制”，不是自上而下压指标。易错点：把“目标分解”误当成“压指标”，忽略共同制定与自我控制这两个关键特征。",
            "concept": "目标管理（MBO）的实质",
            "chapter": "第3章 决策与计划"
          },
          {
            "id": "course-q-3",
            "stem": "某企业所处市场环境变化较大，采用滚动计划法编制计划。下列做法符合该方法要求的是：",
            "options": [
              "近期计划编得较细，远期计划编得较粗，并定期修订、向前滚动",
              "各期计划一律编得同样详细，一经确定不再调整",
              "只编制长期计划，短期安排临时决定",
              "先由上级压指标，再按指标逐级分解到个人"
            ],
            "answerIndex": 0,
            "explanation": "正确答案是A。滚动计划法按“近细远粗”原则，定期修订未来计划并向前滚动，使计划既有连续性又有弹性，适合环境变化较大的场景。易错点：把滚动计划法与“弹性计划”混为一谈，或误以为计划一经确定就不能调整（B）；D描述的是压指标，属于MBO的常见误解，不是滚动计划法。",
            "concept": "滚动计划法",
            "chapter": "第3章 决策与计划"
          }
        ],
        "sourceChunkIds": []
      },
      "script": {
        "persona": "沉稳的管理学老师，善用连续提问带学生辨析概念，反馈干脆不拖泥带水",
        "beats": [
          {
            "kind": "question",
            "text": "先热个身。按时间跨度分，计划一般分成哪几类？你脑子里先冒出几个词，别急着说全。",
            "pauseMs": 2500,
            "blockId": null,
            "emphasis": [
              "时间跨度",
              "分类"
            ]
          },
          {
            "kind": "answer",
            "text": "判断要点：长期、中期、短期，这是按时间分；另外还有战略计划和战术计划这一组。两组别混着答。",
            "pauseMs": 900,
            "blockId": null,
            "emphasis": [
              "长期",
              "战略计划"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，能分开这两组标准就说明你没背串。答成“具体计划和指导性计划”的，那属于按明确性分，也对，但要说清依据。",
            "pauseMs": 900,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "第二题。滚动计划法，最核心的那个动作是什么？想清楚再答，这题错的人特别多。",
            "pauseMs": 2500,
            "blockId": null,
            "emphasis": [
              "滚动计划法",
              "核心动作"
            ]
          },
          {
            "kind": "answer",
            "text": "判断要点：近细远粗，按期向前滚动、逐期修正。关键词是“滚动”和“修正”，不是一次编完就锁死。",
            "pauseMs": 900,
            "blockId": null,
            "emphasis": [
              "近细远粗",
              "逐期修正"
            ]
          },
          {
            "kind": "confirm",
            "text": "很好。有同学说“把长期计划拆成短期”，那是分解，不是滚动。滚动的灵魂在于计划期不断往前推、内容不断更新。",
            "pauseMs": 900,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "recall",
            "text": "停一下，把刚才两条锚住：类型看分类标准，滚动看“近细远粗加逐期修正”。后面两题都建在这上面。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "第三题。MBO，目标管理，它的落脚点到底是“目标”还是“人”？给你五秒，选一个并说理由。",
            "pauseMs": 2500,
            "blockId": null,
            "emphasis": [
              "MBO",
              "目标",
              "人"
            ]
          },
          {
            "kind": "answer",
            "text": "判断要点：两者都要，但机制是上下级共同制定目标、以自我控制代替压制式管理。只答“定指标”就丢了参与。",
            "pauseMs": 900,
            "blockId": null,
            "emphasis": [
              "共同制定",
              "自我控制"
            ]
          },
          {
            "kind": "confirm",
            "text": "对。常见误解是把MBO当成上级下指标、下级签字。那不叫目标管理，那叫派任务。参与和反馈才是它的骨架。",
            "pauseMs": 900,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "最后一题。SMART里的M和A，分别指什么？顺便说一句，哪个最容易被写歪？",
            "pauseMs": 2500,
            "blockId": null,
            "emphasis": [
              "SMART",
              "M",
              "A"
            ]
          },
          {
            "kind": "answer",
            "text": "判断要点：M是可衡量，A是可达成。最常写歪的是M，写成“提升服务水平”这种没法量的表述。",
            "pauseMs": 900,
            "blockId": null,
            "emphasis": [
              "可衡量",
              "可达成"
            ]
          },
          {
            "kind": "confirm",
            "text": "没错。记住一句话：目标写得越模糊，控制环节就越没法接。计划的终点，正好是控制的起点。",
            "pauseMs": 900,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "cta",
            "text": "课后做一件事：找一个你熟悉的企业，用长期短期、滚动、SMART三个角度各写一句点评，下次课我们拿它串组织与控制。",
            "pauseMs": 900,
            "blockId": null,
            "emphasis": []
          }
        ],
        "sceneTitle": "检索练习：类型与过程辨析",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"quiz\",\"title\":\"检索练习：类型与过程辨析\",\"description\":\"用选择题与判断题快速检索计划类型、制定过程与MBO易错点，其中一题直接考查“MBO不是压指标”这一易错点。\",\"objective\":\"能准确区分计划类型，并识别MBO与滚动计划法的常见误解。\",\"keyPoints\":[\"计划的类型\",\"计划的制定过程\",\"目标管理与SMART原则\"]}",
      "evidence": [
        {
          "id": "cl_38",
          "target": "course-q-1",
          "kind": "question",
          "text": "某公司总经理牵头制定未来五年的发展计划，明确公司整体进入哪些行业、如何配置资源；生产车间则据此制定下月的班组排产安排。关于这两类计划，下列说法正确的是：",
          "evidenceIds": []
        },
        {
          "id": "cl_39",
          "target": "course-q-1",
          "kind": "explanation",
          "text": "正确答案是A。按层次划分，计划分为战略计划、战术计划和作业计划：战略计划由高层制定、覆盖全局、期限较长；作业计划则落到具体班组和短期安排。易错点：把“时间长短”当成唯一分类标准，忽略制定层次和覆盖范围，从而误选C或D。",
          "evidenceIds": []
        },
        {
          "id": "cl_40",
          "target": "course-q-2",
          "kind": "question",
          "text": "判断：目标管理（MBO）就是上级把指标层层分解、直接下达给下级，下级按指标执行即可。",
          "evidenceIds": []
        },
        {
          "id": "cl_41",
          "target": "course-q-2",
          "kind": "explanation",
          "text": "正确答案是“错”。MBO强调上下级共同制定目标、分解目标、自我控制、以成果评价，核心是“参与”和“自我控制”，不是自上而下压指标。易错点：把“目标分解”误当成“压指标”，忽略共同制定与自我控制这两个关键特征。",
          "evidenceIds": []
        },
        {
          "id": "cl_42",
          "target": "course-q-3",
          "kind": "question",
          "text": "某企业所处市场环境变化较大，采用滚动计划法编制计划。下列做法符合该方法要求的是：",
          "evidenceIds": []
        },
        {
          "id": "cl_43",
          "target": "course-q-3",
          "kind": "explanation",
          "text": "正确答案是A。滚动计划法按“近细远粗”原则，定期修订未来计划并向前滚动，使计划既有连续性又有弹性，适合环境变化较大的场景。易错点：把滚动计划法与“弹性计划”混为一谈，或误以为计划一经确定就不能调整（B）；D描述的是压指标，属于MBO的常见误解，不是滚动计划法。",
          "evidenceIds": []
        },
        {
          "id": "cl_44",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：能准确区分计划类型，并识别MBO与滚动计划法的常见误解。",
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
      "outlineId": "scene_5",
      "status": "ready",
      "content": {
        "kind": "practice",
        "prompt": "案例情境（虚构，仅用于练习，不是材料中的真实事件）：某中型连锁烘焙企业“麦禾公司”有门店40家、中央工厂1座。近两年门店数量快速增加，但出现三类问题：各门店自行决定每周生产哪些新品，畅销品常缺货、滞销品大量报废；总部年初制定的“全年新开门店12家、单店月均营业额提升8%”的目标，到年中无人跟踪，年底考核时才发现差距很大；新店开业常因人员招聘、设备到位与门店装修不同步而延期。总经理要求你以管理专业实习生的身份，用计划的制定过程梳理这条“计划链条”，并说明计划如何为组织和控制提供依据。作答要求：（1）判断：指出该公司在计划制定过程中哪些环节存在明显缺失，并判断“全年新开门店12家”属于哪一层次、哪一时间跨度的计划；（2）解释：用计划制定过程的主要步骤和计划与组织、控制的衔接关系说明你的判断，指出该公司目标设定与分解中不符合SMART原则或MBO要求之处；（3）行动：提出三项具体改进措施，并说明每项措施分别衔接组织工作或控制工作的哪一环节。可口头作答，也可书面作答。",
        "referencePoints": [
          "判断要点：计划制定过程在环境分析、目标分解、方案拟定与选择、实施与反馈调整等环节存在缺失；门店各自决定新品说明缺少作业层计划与统一协调；年度目标无人跟踪说明缺少实施、检查与反馈调整。",
          "判断要点：“全年新开门店12家”属于战略计划或战术计划层次（需结合企业规模说明理由），时间上属于年度计划即短期计划（相对长期战略而言），覆盖全局、由高层主导。",
          "解释要点：计划是组织与控制的前置：计划决定分工、岗位与资源配置（组织），并提供控制标准与偏差纠正依据（控制）；目标未分解到门店与月份，控制就失去可比较的标准。",
          "解释要点：目标设定与分解问题：单店月均营业额提升8%若未明确口径与责任人，可衡量性和相关性不足；目标由总部单向下达、缺少上下级共同制定与自我控制，属于“压指标”而非MBO；应运用SMART原则逐项检查。",
          "行动要点：如建立门店月度销售与生产计划并采用滚动计划法“近细远粗”修订；将年度目标按门店、季度、月份分解并明确责任人与检查节点；建立月度经营复盘与偏差纠正机制；新店开业采用跨部门进度表协调招聘、设备与装修。以上措施须分别对应组织或控制环节。"
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
        "followUp": "如果只把年度目标分解到每个门店，却不给门店调整计划的权限，这样的计划还能起到控制作用吗？",
        "sourceChunkIds": []
      },
      "script": {
        "persona": "沉稳的管理学老师，习惯用提问带学生一步步拆案例，讲完就停、答完就反馈",
        "beats": [
          {
            "kind": "question",
            "text": "先给大家一个情境：一家做家用小家电的企业，去年定下“一年内进入三个新省份、营收涨三成”。你猜，这个目标往下会变成什么？",
            "pauseMs": 2000,
            "blockId": null,
            "emphasis": [
              "目标",
              "往下"
            ]
          },
          {
            "kind": "answer",
            "text": "它不会停在老板嘴里。往下会拆成区域销售指标、新品上市节点、产线排产和招聘名额，一层层落到部门和岗位上，这就是一条计划链条。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "拆",
              "计划链条"
            ]
          },
          {
            "kind": "question",
            "text": "那这条链条是怎么长出来的？回想计划制定过程，第一步该干什么？",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "第一步"
            ]
          },
          {
            "kind": "answer",
            "text": "第一步是估量机会，看清市场、竞争和自己手里的资源；接着定目标，再往下是前提条件、备选方案、方案比较和选方案，最后派生计划、做预算。",
            "pauseMs": 900,
            "blockId": null,
            "emphasis": [
              "估量机会",
              "定目标",
              "预算"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，顺序不能乱。先看清机会再定目标，目标才不悬空；先有方案比较再选，计划才不是拍脑袋。",
            "pauseMs": 700,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "放到这家企业身上，你试着走一遍：它估量机会时该看什么？",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "估量机会"
            ]
          },
          {
            "kind": "answer",
            "text": "比如三个新省份的渠道密度、竞品价格带、自己的产能上限和现金流。看清这些，三成营收这个目标才有依据，不然就是一句口号。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "渠道",
              "产能",
              "现金流"
            ]
          },
          {
            "kind": "recall",
            "text": "我们回到刚才那条链：机会、目标、前提、方案、选方案、派生计划、预算。这七步，就是分析任何案例的骨架。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "关键来了：计划定完，为什么还要谈组织和控制？它俩跟计划是什么关系？",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "组织",
              "控制"
            ]
          },
          {
            "kind": "answer",
            "text": "计划是前置。目标拆到区域，就得配区域经理和相应权限，这是组织；指标定成季度节点，就得按月对进度、纠偏差，这是控制。没有计划，组织和控制都没有尺子。",
            "pauseMs": 900,
            "blockId": null,
            "emphasis": [
              "前置",
              "尺子"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，计划在前，组织搭架子，控制量偏差。三者是一条线，不是三件事。",
            "pauseMs": 700,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "那如果这家企业中途发现某省只完成一半，按这条链，它该先动哪一环？",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "先动哪一环"
            ]
          },
          {
            "kind": "answer",
            "text": "先看前提变没变：是渠道没铺开，还是竞品降价。前提变了就修计划，再调组织和资源；前提没变，就是执行问题，靠控制纠偏。",
            "pauseMs": 900,
            "blockId": null,
            "emphasis": [
              "前提",
              "纠偏"
            ]
          },
          {
            "kind": "cta",
            "text": "课后请你选一家熟悉的企业，用这七步画出它的计划链条，再标出组织和控制各接在哪一环，下节课我们抽两位同学讲。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          }
        ],
        "sceneTitle": "案例应用：一家企业的计划链条",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"practice\",\"title\":\"案例应用：一家企业的计划链条\",\"description\":\"给出一个企业案例情境（如某制造企业年度目标分解到车间任务），让学生按计划制定过程梳理其计划链条，并指出计划如何为组织分工与控制标准提供依据。\",\"objective\":\"能用计划制定过程分析企业案例，并说明计划对组织与控制的前置作用。\",\"keyPoints\":[\"计划制定过程的主要步骤\",\"计划与组织、控制的衔接\"]}",
      "evidence": [
        {
          "id": "cl_53",
          "target": "scene",
          "kind": "reference",
          "text": "判断要点：计划制定过程在环境分析、目标分解、方案拟定与选择、实施与反馈调整等环节存在缺失；门店各自决定新品说明缺少作业层计划与统一协调；年度目标无人跟踪说明缺少实施、检查与反馈调整。",
          "evidenceIds": []
        },
        {
          "id": "cl_54",
          "target": "scene",
          "kind": "reference",
          "text": "判断要点：“全年新开门店12家”属于战略计划或战术计划层次（需结合企业规模说明理由），时间上属于年度计划即短期计划（相对长期战略而言），覆盖全局、由高层主导。",
          "evidenceIds": []
        },
        {
          "id": "cl_55",
          "target": "scene",
          "kind": "reference",
          "text": "解释要点：计划是组织与控制的前置：计划决定分工、岗位与资源配置（组织），并提供控制标准与偏差纠正依据（控制）；目标未分解到门店与月份，控制就失去可比较的标准。",
          "evidenceIds": []
        },
        {
          "id": "cl_56",
          "target": "scene",
          "kind": "reference",
          "text": "解释要点：目标设定与分解问题：单店月均营业额提升8%若未明确口径与责任人，可衡量性和相关性不足；目标由总部单向下达、缺少上下级共同制定与自我控制，属于“压指标”而非MBO；应运用SMART原则逐项检查。",
          "evidenceIds": []
        },
        {
          "id": "cl_57",
          "target": "scene",
          "kind": "reference",
          "text": "行动要点：如建立门店月度销售与生产计划并采用滚动计划法“近细远粗”修订；将年度目标按门店、季度、月份分解并明确责任人与检查节点；建立月度经营复盘与偏差纠正机制；新店开业采用跨部门进度表协调招聘、设备与装修。以上措施须分别对应组织或控制环节。",
          "evidenceIds": []
        },
        {
          "id": "cl_58",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：能用计划制定过程分析企业案例，并说明计划对组织与控制的前置作用。",
          "evidenceIds": [
            "ev_3"
          ]
        },
        {
          "id": "cl_59",
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
      "outlineId": "scene_6",
      "status": "ready",
      "content": {
        "kind": "board",
        "lesson": {
          "chapter": "第3章 决策与计划",
          "title": "计划如何衔接组织与控制：闭环视角",
          "subtitle": "用一条闭环主线，讲清计划定标准、组织配资源、控制反馈修订计划",
          "blocks": [
            {
              "type": "outline",
              "title": "本节路线图",
              "items": [
                "闭环全景：计划—组织—控制",
                "接口一：计划为组织提供分工依据",
                "接口二：计划为控制提供标准",
                "接口三：控制反馈修订计划",
                "误区辨析与追问"
              ],
              "persistent": true,
              "id": "b1"
            },
            {
              "type": "definition",
              "title": "核心概念：计划—组织—控制闭环",
              "term": "计划—组织—控制闭环",
              "definition": "闭环指计划先给出目标与衡量标准，组织据此配置资源与划分职责，控制按计划标准比对实际偏差，偏差再反馈回计划进行修订，三者首尾相接、持续循环。",
              "concreteAnchor": "某企业年度计划写明“本年度市场占有率提升到25%”，于是把销售部分为华东、华南两个大区并各配一名区域经理（组织），每月统计实际占有率与25%比对（控制），发现华东只到20%，于是把华东目标细化为季度追赶方案并修订下半年计划（反馈修订）。",
              "analogy": "像空调的恒温控制：设定温度是计划，风道与出风口是组织，温度传感器比对是控制，偏冷偏热就回调设定，循环不停。",
              "method": [
                "先看计划是否给出可衡量标准",
                "再看组织分工与资源是否对准该标准",
                "最后看控制偏差是否回流到计划修订"
              ],
              "verify": "任取一个企业案例，能依次指出计划标准、组织接口、控制反馈三处，即闭环成立。",
              "id": "b2"
            },
            {
              "type": "table",
              "title": "三个接口对照：谁给谁什么",
              "columns": [
                "接口",
                "计划一侧提供什么",
                "另一侧如何承接",
                "断链后果"
              ],
              "rows": [
                [
                  "计划→组织",
                  "目标、任务分解、分工依据",
                  "按任务设部门、配资源、定职责",
                  "分工失去依据，职责重叠或空缺"
                ],
                [
                  "计划→控制",
                  "可衡量的目标与标准",
                  "以标准比对实际、发现偏差",
                  "控制失去标准，只能凭感觉评价"
                ],
                [
                  "控制→计划",
                  "偏差信息与原因",
                  "修订目标、调整方案、滚动修订",
                  "计划僵化，偏差重复发生"
                ]
              ],
              "id": "b3"
            },
            {
              "type": "wrong-first",
              "title": "先看一个常见错解",
              "wrongSteps": [
                "认为计划做完就交给组织执行，控制是执行完之后的一次性检查",
                "把控制结果只用于考核奖惩，不回流到计划",
                "结论：计划、组织、控制是先后三段，各管一段"
              ],
              "errorIndex": 0,
              "errorHint": "把闭环看成了单向流水线：控制只“判分”不“回传”，计划就不会被修订。材料强调目标管理是“上下级共同制定目标、自我控制、以成果评价”，控制结果本就要回到目标与计划。",
              "correctSteps": [
                "计划给出目标与标准，组织据此分工配资源",
                "控制持续按标准比对偏差，而非事后一次性检查",
                "偏差反馈回计划，触发目标与方案修订，进入下一轮循环"
              ],
              "takeaway": "控制不是计划之后的一次性动作，而是持续反馈并修订计划。",
              "id": "b4"
            },
            {
              "type": "diagram",
              "title": "闭环全景图",
              "nodes": [
                {
                  "label": "计划",
                  "note": "定目标与衡量标准（如占有率25%）"
                },
                {
                  "label": "组织",
                  "note": "按任务分工、配资源与职责"
                },
                {
                  "label": "控制",
                  "note": "按标准比对实际、找偏差"
                },
                {
                  "label": "反馈修订",
                  "note": "偏差回流，修订目标与方案"
                }
              ],
              "caption": "计划→组织→控制→反馈修订→再计划，箭头首尾相接",
              "id": "b5"
            },
            {
              "type": "callout",
              "title": "易错点提醒",
              "tone": "warn",
              "text": "两个高频混淆：一是把目标管理当成自上而下压指标，材料明确 MBO 强调“参与”和“自我控制”；二是把滚动计划法与弹性计划混为一谈，滚动计划法按“近细远粗”定期修订并向前滚动。",
              "mnemonic": "闭环三问：标准在哪？分工对谁？偏差回哪？",
              "id": "b6"
            },
            {
              "type": "question",
              "title": "停下来想一想",
              "prompt": "某企业计划把次品率降到2%以下，质检部每月统计发现实际为5%，管理层随即只对车间扣奖金，计划本身一字未改。用闭环视角看，这个做法缺了哪一环？",
              "options": [
                "缺组织接口：没有按任务分工配资源",
                "缺反馈修订：偏差没有回流到计划，目标与方案未调整",
                "缺控制标准：计划没有给出可衡量标准"
              ],
              "id": "b7"
            }
          ]
        },
        "sourceChunkIds": []
      },
      "script": {
        "persona": "沉稳的管理学老师，习惯用提问把学生带进闭环逻辑，讲完一个点就停下来等回应",
        "beats": [
          {
            "kind": "question",
            "text": "先想一个问题：计划定完了，是不是就交给组织去干、控制去查，三件事各干各的？",
            "pauseMs": 1800,
            "blockId": "b1",
            "emphasis": [
              "各干各的",
              "计划"
            ]
          },
          {
            "kind": "answer",
            "text": "不是。我们这节课就走一条线：计划给组织分工依据，给控制定标准，控制的反馈再回到计划修订。路线写在黑板上了。",
            "pauseMs": 800,
            "blockId": "b1",
            "emphasis": [
              "分工依据",
              "标准",
              "反馈"
            ]
          },
          {
            "kind": "question",
            "text": "那先看第一个接口：计划凭什么成为组织的分工依据？想一想，部门是按什么划出来的？",
            "pauseMs": 1800,
            "blockId": "b3",
            "emphasis": [
              "分工依据",
              "部门"
            ]
          },
          {
            "kind": "answer",
            "text": "因为计划里写了目标、任务和资源怎么分。任务一拆，谁负责哪块就清楚了，岗位、部门、权责才有出处。没有计划，组织设计就是拍脑袋。",
            "pauseMs": 800,
            "blockId": "b3",
            "emphasis": [
              "任务",
              "权责"
            ]
          },
          {
            "kind": "question",
            "text": "再看第二个接口：控制要判断干得好不好，它手里的尺子从哪来？",
            "pauseMs": 1800,
            "blockId": "b3",
            "emphasis": [
              "控制",
              "尺子"
            ]
          },
          {
            "kind": "answer",
            "text": "尺子就是计划里的目标、指标和时间节点。计划定标准，控制拿标准去比对实际，偏差才量得出来。所以计划是控制的前提，对不对？",
            "pauseMs": 800,
            "blockId": "b3",
            "emphasis": [
              "标准",
              "偏差"
            ]
          },
          {
            "kind": "recall",
            "text": "回到刚才那条线：计划给组织分工依据，计划给控制定标准。这两句先记住，后面全靠它们。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "那控制发现偏差以后呢？是只改执行，还是也要动计划本身？",
            "pauseMs": 1800,
            "blockId": "b5",
            "emphasis": [
              "偏差",
              "计划本身"
            ]
          },
          {
            "kind": "answer",
            "text": "两条路都要走。执行偏了就纠执行；要是标准本身不现实，就得回头修订计划。反馈顺着箭头回到计划，闭环才闭上。",
            "pauseMs": 800,
            "blockId": "b5",
            "emphasis": [
              "修订计划",
              "闭环"
            ]
          },
          {
            "kind": "question",
            "text": "这里有个常见错解，你先判断一下：有人说闭环就是控制查完、写个报告就结束了。对吗？",
            "pauseMs": 1800,
            "blockId": "b4",
            "emphasis": [
              "闭环",
              "报告"
            ]
          },
          {
            "kind": "answer",
            "text": "不对。报告只是信息，闭环的关键是信息回到计划，引起目标或方案的调整。只报不改，那还是开环。",
            "pauseMs": 800,
            "blockId": "b4",
            "emphasis": [
              "开环",
              "调整"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，能说出“反馈要回到计划修订”这句，说明闭环你抓住了。只改执行不改计划，是半个闭环。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "recall",
            "text": "把三个接口连起来：计划到组织是分工依据，计划到控制是标准，控制回计划是修订。三句话就是整张图。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "cta",
            "text": "课后拿一个你熟悉的企业，画出它的计划—组织—控制闭环，标出反馈从哪回到哪。下节课我们挑两张图一起看。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          }
        ],
        "sceneTitle": "计划如何衔接组织与控制：闭环视角",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"lecture\",\"title\":\"计划如何衔接组织与控制：闭环视角\",\"description\":\"从闭环视角讲清计划、组织、控制三者的接口：计划定目标与标准，组织配资源与职责，控制比对偏差并反馈修订计划，并辨析常见误区。\",\"objective\":\"能画出计划—组织—控制闭环，并解释反馈如何回到计划修订。\",\"keyPoints\":[\"计划为组织提供分工依据\",\"计划为控制提供标准\",\"控制反馈修订计划\"]}",
      "evidence": [
        {
          "id": "cl_65",
          "target": "b2",
          "kind": "definition",
          "text": "计划—组织—控制闭环：闭环指计划先给出目标与衡量标准，组织据此配置资源与划分职责，控制按计划标准比对实际偏差，偏差再反馈回计划进行修订，三者首尾相接、持续循环。",
          "evidenceIds": []
        },
        {
          "id": "cl_66",
          "target": "b4",
          "kind": "example",
          "text": "正解：计划给出目标与标准，组织据此分工配资源 → 控制持续按标准比对偏差，而非事后一次性检查 → 偏差反馈回计划，触发目标与方案修订，进入下一轮循环",
          "evidenceIds": []
        },
        {
          "id": "cl_67",
          "target": "b6",
          "kind": "conclusion",
          "text": "两个高频混淆：一是把目标管理当成自上而下压指标，材料明确 MBO 强调“参与”和“自我控制”；二是把滚动计划法与弹性计划混为一谈，滚动计划法按“近细远粗”定期修订并向前滚动。",
          "evidenceIds": []
        },
        {
          "id": "cl_68",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：能画出计划—组织—控制闭环，并解释反馈如何回到计划修订。",
          "evidenceIds": [
            "ev_3"
          ]
        },
        {
          "id": "cl_69",
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
            "stem": "某公司推行目标管理（MBO）。下列哪种做法最符合MBO的要求？",
            "options": [
              "高层把年度指标直接下发给各部门，部门只负责执行",
              "上级与下属共同商定目标，员工在过程中自我控制，期末按成果评价",
              "只考核员工的工作态度，不设定具体目标",
              "目标定得越高越好，以体现挑战性"
            ],
            "answerIndex": 1,
            "explanation": "正确答案是B。MBO的关键是上下级共同制定目标、分解目标、自我控制、以成果评价，强调“参与”和“自我控制”。A是自上而下压指标，正是本场景要纠正的典型误解；C缺少可衡量的目标；D违背SMART原则中的“可实现”。",
            "concept": "目标管理（MBO）与SMART原则",
            "chapter": "第3章 决策与计划"
          },
          {
            "id": "course-q-2",
            "stem": "判断：滚动计划法按“近细远粗”原则定期修订并向前滚动，因此它适合环境变化较大的场景。",
            "options": [
              "对",
              "错"
            ],
            "answerIndex": 0,
            "explanation": "正确答案是“对”。滚动计划法的要点就是“近细远粗”：近期计划细、远期计划粗，定期修订并向前滚动，使计划既有连续性又有弹性，适合环境变化较大的场景。易错点是把它与“弹性计划”混为一谈，或误以为远期计划也应同样详细。",
            "concept": "滚动计划法",
            "chapter": "第3章 决策与计划"
          },
          {
            "id": "course-q-3",
            "stem": "关于MBO的目标设定，下列说法正确的是（　）。",
            "options": [
              "目标只需具体，不必可衡量",
              "目标应具体、可衡量、可实现、相关、有时限",
              "目标由上级单方面确定即可",
              "目标不需要设定完成期限"
            ],
            "answerIndex": 1,
            "explanation": "正确答案是B，即SMART原则：具体、可衡量、可实现、相关、有时限。A漏掉“可衡量”；C是自上而下压指标，与MBO的“参与”相悖；D漏掉“有时限”。这三项都是常见易错点。",
            "concept": "SMART原则",
            "chapter": "第3章 决策与计划"
          }
        ],
        "sourceChunkIds": []
      },
      "script": {
        "persona": "沉稳的管理学老师，习惯用连续追问带学生自查易错点",
        "beats": [
          {
            "kind": "question",
            "text": "先热个身：目标管理里的“目标”，是上级定好了往下发，还是上下一起商量着定？想清楚再答。",
            "pauseMs": 2500,
            "blockId": null,
            "emphasis": [
              "上级定",
              "一起商量"
            ]
          },
          {
            "kind": "answer",
            "text": "判断要点：MBO的目标是上下级共同商定，不是单向摊派。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "共同商定"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，共同商定是MBO的底色。谁只记住“下指标”，谁就掉坑里了。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "接着来：有人说“目标越多越全面越好”，按SMART原则，这句话错在哪？",
            "pauseMs": 2500,
            "blockId": null,
            "emphasis": [
              "SMART",
              "越多越好"
            ]
          },
          {
            "kind": "answer",
            "text": "判断要点：目标要具体、可衡量、可达成、相关、有时限，不是堆数量。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "具体",
              "可衡量",
              "有时限"
            ]
          },
          {
            "kind": "confirm",
            "text": "没错，SMART管的是目标质量，不是目标数量。堆得越多，越难落地。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "recall",
            "text": "停一下回想：刚才两个坑，一个是目标怎么定，一个是目标写成什么样。都抓住了吗？",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "换滚动计划法：它最典型的特点是“近细远粗”，那远期的部分是不是就可以随便写写？",
            "pauseMs": 2500,
            "blockId": null,
            "emphasis": [
              "近细远粗",
              "远期"
            ]
          },
          {
            "kind": "answer",
            "text": "判断要点：远期是粗，但方向要清楚，而且会随滚动逐步细化，不是敷衍。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "粗",
              "逐步细化"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，“粗”是颗粒度粗，不是态度粗。这一点考试里最爱设陷阱。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "最后一题：滚动计划法是不是计划一旦定好，就按原样执行到期？",
            "pauseMs": 2500,
            "blockId": null,
            "emphasis": [
              "滚动",
              "原样执行"
            ]
          },
          {
            "kind": "answer",
            "text": "判断要点：不是。它按期向前滚动、边执行边修订，靠的是持续调整。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "滚动",
              "修订"
            ]
          },
          {
            "kind": "confirm",
            "text": "正确。滚动计划法的生命力就在“滚”字上，静态执行就失去意义了。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "cta",
            "text": "课后把这三个易错点各写一句纠正版，下节课我们拿企业案例对照检验。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          }
        ],
        "sceneTitle": "易错点检测：MBO与滚动计划法",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"quiz\",\"title\":\"易错点检测：MBO与滚动计划法\",\"description\":\"针对本课易错点设计选择题与判断题，检测学生是否把MBO误解为压指标、把滚动计划法等同于弹性计划。\",\"objective\":\"能识别并纠正MBO与滚动计划法的典型误解。\",\"keyPoints\":[\"目标管理与SMART原则\",\"滚动计划法近细远粗\"]}",
      "evidence": [
        {
          "id": "cl_78",
          "target": "course-q-1",
          "kind": "question",
          "text": "某公司推行目标管理（MBO）。下列哪种做法最符合MBO的要求？",
          "evidenceIds": []
        },
        {
          "id": "cl_79",
          "target": "course-q-1",
          "kind": "explanation",
          "text": "正确答案是B。MBO的关键是上下级共同制定目标、分解目标、自我控制、以成果评价，强调“参与”和“自我控制”。A是自上而下压指标，正是本场景要纠正的典型误解；C缺少可衡量的目标；D违背SMART原则中的“可实现”。",
          "evidenceIds": []
        },
        {
          "id": "cl_80",
          "target": "course-q-2",
          "kind": "question",
          "text": "判断：滚动计划法按“近细远粗”原则定期修订并向前滚动，因此它适合环境变化较大的场景。",
          "evidenceIds": []
        },
        {
          "id": "cl_81",
          "target": "course-q-2",
          "kind": "explanation",
          "text": "正确答案是“对”。滚动计划法的要点就是“近细远粗”：近期计划细、远期计划粗，定期修订并向前滚动，使计划既有连续性又有弹性，适合环境变化较大的场景。易错点是把它与“弹性计划”混为一谈，或误以为远期计划也应同样详细。",
          "evidenceIds": []
        },
        {
          "id": "cl_82",
          "target": "course-q-3",
          "kind": "question",
          "text": "关于MBO的目标设定，下列说法正确的是（ ）。",
          "evidenceIds": []
        },
        {
          "id": "cl_83",
          "target": "course-q-3",
          "kind": "explanation",
          "text": "正确答案是B，即SMART原则：具体、可衡量、可实现、相关、有时限。A漏掉“可衡量”；C是自上而下压指标，与MBO的“参与”相悖；D漏掉“有时限”。这三项都是常见易错点。",
          "evidenceIds": []
        },
        {
          "id": "cl_84",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：能识别并纠正MBO与滚动计划法的典型误解。",
          "evidenceIds": [
            "ev_3"
          ]
        },
        {
          "id": "cl_85",
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
        "kind": "practice",
        "prompt": "【案例情境】某城市一家连锁烘焙企业“麦香坊”有12家门店。近一年来，门店间业绩差距拉大，新品上市经常延期，总部与门店互相抱怨“计划赶不上变化”。总经理决定下一季度先在3家门店试点“季度部门计划”，要求运营部牵头、门店配合，并明确该计划要能落到岗位、能在季度末检验。假设你是运营部助理，请完成以下任务：（1）判断：这份“季度部门计划”在计划类型中属于哪一类（战略、战术还是作业计划？长期、中期还是短期？具体计划还是指导性计划？），并说明判断依据；（2）解释：从目标管理与SMART原则出发，说明制定这份计划时最容易出现的两个偏差，并用计划与组织、控制衔接的思路解释为什么计划必须同时写清“谁来做”和“怎么检验”；（3）行动：为试点门店写出一条符合SMART原则的季度目标，并分别指出它在组织落实和控制检验上的具体安排。作答要求：先给出判断，再用概念解释，最后给出可操作行动；可口头陈述，也可书面作答。",
        "referencePoints": [
          "计划类型判断：季度部门计划通常属于战术计划或作业计划（视其覆盖范围而定），短期计划，具体计划；判断依据应结合制定层级、覆盖范围、期限和明确程度。",
          "SMART偏差识别：常见偏差包括目标笼统不可衡量、缺少时限、目标与门店实际能力不匹配、目标与公司整体方向脱节；应结合“具体、可衡量、可实现、相关、有时限”逐项说明。",
          "计划与组织、控制衔接：计划要明确责任岗位与资源安排（组织落实），同时设置可检验的指标、检查节点和反馈调整机制（控制检验），形成“计划—组织—控制”闭环。",
          "行动建议要点：写出含明确指标、时限、责任人的季度目标，并说明由谁负责、如何分解到岗位、用什么数据在什么节点检查、偏差如何反馈调整。"
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
        "followUp": "如果季度末发现目标达成了，但门店之间的业绩差距反而扩大，你会怎样判断这份计划在“组织落实”或“控制检验”上可能漏掉了什么？",
        "sourceChunkIds": []
      },
      "script": {
        "persona": "沉稳的管理学老师，用案例和提问带学生把计划落到纸面",
        "beats": [
          {
            "kind": "question",
            "text": "先看案例：一家做智能小家电的企业，去年营收涨得快，但售后投诉翻倍，部门之间互相推。现在要你给客服部补一份年度计划。你第一反应会写什么？",
            "pauseMs": 2000,
            "blockId": null,
            "emphasis": [
              "客服部",
              "年度计划"
            ]
          },
          {
            "kind": "answer",
            "text": "别急着写“提高服务质量”。计划得先有目标，目标要能检验。我们回到黑板，把目标写成可衡量的样子。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "可衡量"
            ]
          },
          {
            "kind": "question",
            "text": "那目标怎么写才算合格？想一想SMART：具体、可衡量、可达成、相关、有时限。客服部的目标，你能套进去说一句吗？",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "SMART"
            ]
          },
          {
            "kind": "answer",
            "text": "比如：本年度把投诉首次响应时间压到2小时内，重复投诉率降到5%以下，每季度复盘一次。时间、数字、责任都清楚了，对不对？",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "2小时",
              "5%",
              "每季度"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，这就是SMART落地。目标不是口号，是能拿数据对账的承诺。写计划时先问自己：年底拿什么证明我做到了？",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "数据对账"
            ]
          },
          {
            "kind": "recall",
            "text": "回顾一下：计划职能就是定目标、选路径、配资源。前面讲的类型里，这是部门层面的运营计划，往上接公司战略。",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": [
              "运营计划",
              "战略"
            ]
          },
          {
            "kind": "question",
            "text": "目标有了，计划怎么落到组织上？客服部要压响应时间，得动谁？是只靠客服自己加班，还是要改流程、调岗位？",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "组织落实"
            ]
          },
          {
            "kind": "answer",
            "text": "得把任务分到岗：谁接单、谁升级、谁回访；再给权限和培训。计划不配组织，就是一张纸。这一步写进计划的责任矩阵里。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "责任矩阵",
              "权限"
            ]
          },
          {
            "kind": "question",
            "text": "最后，怎么知道计划真在跑？控制环节你打算设哪几个检查点？月度看什么、季度看什么？",
            "pauseMs": 1800,
            "blockId": null,
            "emphasis": [
              "控制",
              "检查点"
            ]
          },
          {
            "kind": "answer",
            "text": "月度看响应时长和投诉量，季度看重复投诉率；偏差超过阈值就纠偏，比如加派班次或改话术。控制检验的就是计划里的指标。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "偏差",
              "纠偏"
            ]
          },
          {
            "kind": "confirm",
            "text": "好，这样计划、组织、控制就串成一条线：目标定指标，组织分责任，控制拿指标对账。三者对不上，计划就悬空。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "一条线"
            ]
          },
          {
            "kind": "cta",
            "text": "现在动手：给这家企业客服部写一份年度计划，三条SMART目标，标出责任岗位和一个控制检查点。写完同桌互评，看能不能对账。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": [
              "三条目标",
              "互评"
            ]
          }
        ],
        "sceneTitle": "迁移练习：为案例企业补一份计划",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"practice\",\"title\":\"迁移练习：为案例企业补一份计划\",\"description\":\"让学生为案例企业的一个部门补写短期作业计划，要求符合SMART原则，并说明该计划将如何被组织落实、被控制检验。\",\"objective\":\"能写出符合SMART的部门计划，并指出其组织落实与控制检验方式。\",\"keyPoints\":[\"目标管理与SMART原则\",\"计划与组织、控制的衔接\"]}",
      "evidence": [
        {
          "id": "cl_92",
          "target": "scene",
          "kind": "reference",
          "text": "计划类型判断：季度部门计划通常属于战术计划或作业计划（视其覆盖范围而定），短期计划，具体计划；判断依据应结合制定层级、覆盖范围、期限和明确程度。",
          "evidenceIds": []
        },
        {
          "id": "cl_93",
          "target": "scene",
          "kind": "reference",
          "text": "SMART偏差识别：常见偏差包括目标笼统不可衡量、缺少时限、目标与门店实际能力不匹配、目标与公司整体方向脱节；应结合“具体、可衡量、可实现、相关、有时限”逐项说明。",
          "evidenceIds": []
        },
        {
          "id": "cl_94",
          "target": "scene",
          "kind": "reference",
          "text": "计划与组织、控制衔接：计划要明确责任岗位与资源安排（组织落实），同时设置可检验的指标、检查节点和反馈调整机制（控制检验），形成“计划—组织—控制”闭环。",
          "evidenceIds": []
        },
        {
          "id": "cl_95",
          "target": "scene",
          "kind": "reference",
          "text": "行动建议要点：写出含明确指标、时限、责任人的季度目标，并说明由谁负责、如何分解到岗位、用什么数据在什么节点检查、偏差如何反馈调整。",
          "evidenceIds": []
        },
        {
          "id": "cl_96",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：能写出符合SMART的部门计划，并指出其组织落实与控制检验方式。",
          "evidenceIds": [
            "ev_3"
          ]
        },
        {
          "id": "cl_97",
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
      "outlineId": "scene_9",
      "status": "ready",
      "content": {
        "kind": "board",
        "lesson": {
          "chapter": "第3章 决策与计划",
          "title": "收束复盘：一条主线与三个易错点",
          "subtitle": "把计划—组织—控制串成一条线，带走方法清单与三个易错点的正确表述",
          "blocks": [
            {
              "type": "outline",
              "title": "复盘路线",
              "items": [
                "主线：计划—组织—控制闭环",
                "类型：三个分类标准",
                "过程：制定步骤与MBO、滚动计划法",
                "易错点：三条正确表述",
                "方法清单：案例五步"
              ],
              "persistent": true,
              "id": "b1"
            },
            {
              "type": "definition",
              "title": "主线锚点",
              "term": "计划职能",
              "definition": "计划是管理闭环的起点：它确定目标与实现路径，为组织提供依据、为控制提供标准。",
              "concreteAnchor": "案例企业先定“明年营收增长15%”，再据此设销售部岗位与月度考核指标——这一串动作的起点就是计划。",
              "analogy": "像盖楼先出图纸：图纸定结构（组织），也定验收标准（控制）。",
              "method": [
                "定目标：明确要到哪里",
                "分层次：战略—战术—作业逐层落地",
                "设标准：把目标转成可考核指标"
              ],
              "verify": "回带检查：组织分工与控制指标能否追溯到计划目标？",
              "id": "b2"
            },
            {
              "type": "table",
              "title": "计划类型：看标准再分类",
              "columns": [
                "分类标准",
                "类型",
                "关键特征"
              ],
              "rows": [
                [
                  "按层次",
                  "战略计划",
                  "高层制定、覆盖全局、期限较长"
                ],
                [
                  "按层次",
                  "战术计划",
                  "中层衔接、分解战略"
                ],
                [
                  "按层次",
                  "作业计划",
                  "基层执行、具体到日常活动"
                ],
                [
                  "按时间",
                  "长期/中期/短期",
                  "期限长短不同，需相互衔接"
                ],
                [
                  "按明确性",
                  "具体计划",
                  "目标与步骤明确，可操作"
                ],
                [
                  "按明确性",
                  "指导性计划",
                  "给方向留弹性，适合不确定环境"
                ]
              ],
              "id": "b3"
            },
            {
              "type": "wrong-first",
              "title": "易错点一：MBO不是压指标",
              "wrongSteps": [
                "把MBO理解成上级把指标层层下压",
                "认为目标由高层单方面确定",
                "评价只看结果数字，不看参与过程"
              ],
              "errorIndex": 0,
              "errorHint": "材料原话：MBO强调“参与”和“自我控制”，不是自上而下压指标。",
              "correctSteps": [
                "上下级共同制定目标",
                "逐层分解目标，员工自我控制",
                "以成果评价，目标符合SMART原则"
              ],
              "takeaway": "MBO重参与、重自我控制，不是压指标。",
              "id": "b4"
            },
            {
              "type": "callout",
              "title": "易错点二与三",
              "tone": "warn",
              "text": "滚动计划法按“近细远粗”定期修订并向前滚动，适合环境变化大的场景，注意与“弹性计划”区分；战略计划由高层制定、覆盖全局、期限较长，不能与作业计划混为一谈。",
              "mnemonic": "近细远粗向前滚，战略高层管全局。",
              "id": "b5"
            },
            {
              "type": "classification-tree",
              "title": "方法清单：案例五步",
              "root": {
                "label": "案例分析通用方法",
                "note": "从目标到反馈走一遍闭环"
              },
              "branches": [
                {
                  "label": "定目标",
                  "note": "目标符合SMART",
                  "children": [
                    {
                      "label": "具体可衡量",
                      "note": "避免空泛口号"
                    }
                  ]
                },
                {
                  "label": "分层次",
                  "note": "战略—战术—作业",
                  "children": [
                    {
                      "label": "按时间与明确性补充",
                      "note": "长中短期、具体与指导性"
                    }
                  ]
                },
                {
                  "label": "配组织",
                  "note": "计划为组织提供依据",
                  "children": [
                    {
                      "label": "岗位与职责落地",
                      "note": "谁来做"
                    }
                  ]
                },
                {
                  "label": "设标准",
                  "note": "计划为控制提供标准",
                  "children": [
                    {
                      "label": "可考核指标",
                      "note": "做到什么程度"
                    }
                  ]
                },
                {
                  "label": "看反馈",
                  "note": "滚动修订、闭环调整",
                  "children": [
                    {
                      "label": "近细远粗",
                      "note": "环境变化大时滚动计划法"
                    }
                  ]
                }
              ],
              "caption": "五步走完，计划才真正衔接组织与控制。",
              "stages": [
                {
                  "label": "全貌",
                  "branches": [
                    0,
                    1,
                    2,
                    3,
                    4
                  ],
                  "expand": [
                    0,
                    1,
                    2,
                    3,
                    4
                  ]
                }
              ],
              "id": "b6"
            },
            {
              "type": "question",
              "title": "停下来想一想",
              "prompt": "案例企业把“明年营收增长15%”直接压给各部门、只看年终数字，这最违背本课哪条要点？",
              "options": [
                "MBO强调参与与自我控制，不是自上而下压指标",
                "战略计划应由基层制定",
                "滚动计划法要求近粗远细"
              ],
              "id": "b7"
            }
          ]
        },
        "sourceChunkIds": []
      },
      "script": {
        "persona": "沉稳的管理学老师，善用提问推进，语气亲切，节奏清晰。",
        "beats": [
          {
            "kind": "question",
            "text": "同学们，我们这节课快收尾了。谁能用一句话说说，计划职能到底在管什么？",
            "pauseMs": 1800,
            "blockId": "b1",
            "emphasis": [
              "计划职能",
              "一句话"
            ]
          },
          {
            "kind": "answer",
            "text": "对，计划就是定目标、选路径。我们把它作为主线锚点写在黑板中间：目标—路径—资源。",
            "pauseMs": 800,
            "blockId": "b2",
            "emphasis": [
              "目标",
              "路径",
              "资源"
            ]
          },
          {
            "kind": "confirm",
            "text": "很好，这条主线抓住了。后面所有类型和过程，都挂在这条线上。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "那计划的类型那么多，我们分类时最先看什么？想一想，是看时间长短吗？",
            "pauseMs": 1800,
            "blockId": "b3",
            "emphasis": [
              "分类",
              "标准"
            ]
          },
          {
            "kind": "answer",
            "text": "看标准再分类。按时间分长中短，按范围分战略战术，按重复性分程序与非程序。标准不同，类型就不同。",
            "pauseMs": 800,
            "blockId": "b3",
            "emphasis": [
              "标准",
              "时间",
              "范围",
              "重复性"
            ]
          },
          {
            "kind": "confirm",
            "text": "没错，先问标准再贴标签，这是第一个易错点的邻居。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "recall",
            "text": "回忆一下，我们讲目标管理时，最容易把它误解成什么？",
            "pauseMs": 1200,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "是不是有人觉得，目标管理就是上级给下级压指标？",
            "pauseMs": 1800,
            "blockId": "b4",
            "emphasis": [
              "目标管理",
              "压指标"
            ]
          },
          {
            "kind": "answer",
            "text": "易错点一：MBO不是压指标。它是上下共同定目标、自我控制、结果反馈的循环。",
            "pauseMs": 800,
            "blockId": "b4",
            "emphasis": [
              "MBO",
              "共同定目标",
              "自我控制"
            ]
          },
          {
            "kind": "confirm",
            "text": "对，压指标只是单向下达，MBO强调参与和反馈，这个区别要记牢。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "再看易错点二和三。计划和变化冲突时，计划还有用吗？计划做完就结束了吗？",
            "pauseMs": 1800,
            "blockId": "b5",
            "emphasis": [
              "变化",
              "结束"
            ]
          },
          {
            "kind": "answer",
            "text": "易错点二：计划不是预测不变，而是应对变化。易错点三：计划不是终点，它要衔接组织与控制。",
            "pauseMs": 800,
            "blockId": "b5",
            "emphasis": [
              "应对变化",
              "衔接",
              "组织",
              "控制"
            ]
          },
          {
            "kind": "confirm",
            "text": "很好，三个易错点都摆出来了：不压指标、不怕变化、不止于计划。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          },
          {
            "kind": "question",
            "text": "那方法清单怎么落地？我们案例里的五步，谁还记得第一步？",
            "pauseMs": 1800,
            "blockId": "b6",
            "emphasis": [
              "方法清单",
              "五步"
            ]
          },
          {
            "kind": "answer",
            "text": "案例五步：定目标、拆任务、配资源、设检查点、反馈调整。每一步都连着组织和控制。",
            "pauseMs": 800,
            "blockId": "b6",
            "emphasis": [
              "五步",
              "检查点",
              "反馈"
            ]
          },
          {
            "kind": "cta",
            "text": "课后请用这五步，把你们小组的项目计划写成一页纸，下次课我们互评。",
            "pauseMs": 800,
            "blockId": null,
            "emphasis": []
          }
        ],
        "sceneTitle": "收束复盘：一条主线与三个易错点",
        "sourceChunkIds": []
      },
      "sources": [],
      "repaired": false,
      "fingerprint": "{\"type\":\"review\",\"title\":\"收束复盘：一条主线与三个易错点\",\"description\":\"汇总本课主线与特殊值、方法清单：计划—组织—控制闭环，计划类型三维度，制定过程步骤，MBO与滚动计划法要点，并回顾易错点。\",\"objective\":\"能复述本课主线与方法清单，并说出三个易错点的正确表述。\",\"keyPoints\":[\"计划职能的含义\",\"计划的类型\",\"计划的制定过程\",\"计划与组织、控制的衔接\"]}",
      "evidence": [
        {
          "id": "cl_103",
          "target": "b2",
          "kind": "definition",
          "text": "计划职能：计划是管理闭环的起点：它确定目标与实现路径，为组织提供依据、为控制提供标准。",
          "evidenceIds": []
        },
        {
          "id": "cl_104",
          "target": "b4",
          "kind": "example",
          "text": "正解：上下级共同制定目标 → 逐层分解目标，员工自我控制 → 以成果评价，目标符合SMART原则",
          "evidenceIds": []
        },
        {
          "id": "cl_105",
          "target": "b5",
          "kind": "conclusion",
          "text": "滚动计划法按“近细远粗”定期修订并向前滚动，适合环境变化大的场景，注意与“弹性计划”区分；战略计划由高层制定、覆盖全局、期限较长，不能与作业计划混为一谈。",
          "evidenceIds": []
        },
        {
          "id": "cl_106",
          "target": "scene",
          "kind": "criterion",
          "text": "能达成学习目标：能复述本课主线与方法清单，并说出三个易错点的正确表述。",
          "evidenceIds": [
            "ev_3"
          ]
        },
        {
          "id": "cl_107",
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
    }
  ],
  "plan": {
    "version": "course-ir-v1",
    "courseId": "plan-mw815ze7",
    "title": "计划职能：类型、过程与组织控制衔接",
    "summary": "本课帮助管理类专业二年级学生理解计划职能的含义、主要类型与制定过程，并用一个企业案例说明计划如何衔接组织与控制。学完能按步骤分析企业计划问题，并解释计划、组织、控制三者的联动关系。",
    "languageDirective": "使用规范学术汉语，术语采用材料中的标准表述（如战略计划、目标管理、滚动计划法）。案例讲解用具体企业情境，避免生僻字与乱码字形。",
    "learnerProfile": {
      "stage": "university",
      "stageLabel": "大学",
      "gradeLabel": "高校管理类专业二年级",
      "language": "使用规范学术汉语，先建立框架再讲概念，术语与材料一致，案例用具体企业情境。",
      "teaching": "先框架后概念，配合企业案例与练习，强调考点辨析（如战略计划与作业计划、MBO与压指标）。",
      "board": "板书以“计划—组织—控制”一条主线加类型分类表、制定过程流程图为主，案例用分步演示。",
      "subject": "管理学（决策与计划）",
      "confidence": "high",
      "evidence": "用户明确写“高校管理类专业二年级学生”，并给出章节“第3章 决策与计划”与计划职能相关目标。",
      "source": "explicit"
    },
    "domain": "management",
    "durationBudget": 45,
    "requirements": [
      {
        "id": "rq_1",
        "text": "理解计划职能的含义、计划的主要类型与制定过程，能用一个企业案例说明计划如何衔接组织与控制",
        "source": "requirement"
      },
      {
        "id": "rq_objective",
        "text": "理解计划职能的含义、计划的主要类型与制定过程，能用一个企业案例说明计划如何衔接组织与控制",
        "source": "requirement"
      }
    ],
    "knowledgePoints": [
      {
        "id": "kp_1",
        "name": "计划职能的含义",
        "difficulty": 1,
        "prerequisites": [],
        "introducedBy": "scene_1",
        "estMinutes": 4
      },
      {
        "id": "kp_2",
        "name": "计划与决策的关系",
        "difficulty": 1,
        "prerequisites": [
          "kp_1"
        ],
        "introducedBy": "scene_1",
        "estMinutes": 4
      },
      {
        "id": "kp_3",
        "name": "计划—组织—控制主线",
        "difficulty": 1,
        "prerequisites": [
          "kp_1",
          "kp_2"
        ],
        "introducedBy": "scene_1",
        "estMinutes": 4
      },
      {
        "id": "kp_4",
        "name": "按层次分：战略、战术、作业计划",
        "difficulty": 1,
        "prerequisites": [
          "kp_2",
          "kp_3"
        ],
        "introducedBy": "scene_2",
        "estMinutes": 5
      },
      {
        "id": "kp_5",
        "name": "按时间分：长期、中期、短期计划",
        "difficulty": 1,
        "prerequisites": [
          "kp_3",
          "kp_4"
        ],
        "introducedBy": "scene_2",
        "estMinutes": 5
      },
      {
        "id": "kp_6",
        "name": "按明确性分：具体计划与指导性计划",
        "difficulty": 1,
        "prerequisites": [
          "kp_4",
          "kp_5"
        ],
        "introducedBy": "scene_2",
        "estMinutes": 5
      },
      {
        "id": "kp_7",
        "name": "计划制定过程的主要步骤",
        "difficulty": 2,
        "prerequisites": [
          "kp_5",
          "kp_6"
        ],
        "introducedBy": "scene_3",
        "estMinutes": 6
      },
      {
        "id": "kp_8",
        "name": "目标管理与SMART原则",
        "difficulty": 2,
        "prerequisites": [
          "kp_6",
          "kp_7"
        ],
        "introducedBy": "scene_3",
        "estMinutes": 6
      },
      {
        "id": "kp_9",
        "name": "滚动计划法近细远粗",
        "difficulty": 2,
        "prerequisites": [
          "kp_7",
          "kp_8"
        ],
        "introducedBy": "scene_3",
        "estMinutes": 6
      },
      {
        "id": "kp_10",
        "name": "计划的类型",
        "difficulty": 2,
        "prerequisites": [
          "kp_8",
          "kp_9"
        ],
        "introducedBy": "scene_4",
        "estMinutes": 5
      },
      {
        "id": "kp_11",
        "name": "计划的制定过程",
        "difficulty": 2,
        "prerequisites": [
          "kp_9",
          "kp_10"
        ],
        "introducedBy": "scene_4",
        "estMinutes": 5
      },
      {
        "id": "kp_12",
        "name": "计划与组织、控制的衔接",
        "difficulty": 3,
        "prerequisites": [
          "kp_10",
          "kp_11"
        ],
        "introducedBy": "scene_5",
        "estMinutes": 8
      },
      {
        "id": "kp_13",
        "name": "计划为组织提供分工依据",
        "difficulty": 3,
        "prerequisites": [
          "kp_11",
          "kp_12"
        ],
        "introducedBy": "scene_6",
        "estMinutes": 6
      },
      {
        "id": "kp_14",
        "name": "计划为控制提供标准",
        "difficulty": 3,
        "prerequisites": [
          "kp_12",
          "kp_13"
        ],
        "introducedBy": "scene_6",
        "estMinutes": 6
      },
      {
        "id": "kp_15",
        "name": "控制反馈修订计划",
        "difficulty": 3,
        "prerequisites": [
          "kp_13",
          "kp_14"
        ],
        "introducedBy": "scene_6",
        "estMinutes": 6
      }
    ],
    "scenes": [
      {
        "id": "scene_1",
        "order": 1,
        "type": "lecture",
        "title": "计划职能是什么：从问题到框架",
        "description": "回顾锚点：回顾上一章决策过程六步骤，指出决策之后要落地为计划。热身提问：请学生说一个自己定过的学习计划，它包含哪些要素。动机问题：为什么有的企业计划写完就束之高阁，而有的计划能推动组织行动？本场景建立计划职能的含义与“计划—组织—控制”主线框架。",
        "teachingObjective": "能用自己的话说明计划职能的含义，并说出计划在管理循环中的位置。",
        "completionCriteria": [
          "能达成学习目标：能用自己的话说明计划职能的含义，并说出计划在管理循环中的位置。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "计划职能的含义",
          "计划与决策的关系",
          "计划—组织—控制主线"
        ],
        "takeaways": [
          "计划职能是为实现目标而对未来行动做出的预先安排。",
          "计划是决策的延续，决策选方向，计划定路径。",
          "计划、组织、控制构成管理闭环，计划是起点。"
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
          "kp_2",
          "kp_3"
        ],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "none",
          "score": 14,
          "reasons": [
            "过程与变换（循环）"
          ]
        }
      },
      {
        "id": "scene_2",
        "order": 2,
        "type": "lecture",
        "title": "计划怎么分：三个维度看类型",
        "description": "从层次、时间、明确性三个维度拆解计划类型，重点辨析战略计划与作业计划的差别，并说明各类型适用场景。",
        "teachingObjective": "能按三个维度对给定计划进行分类，并说明战略计划与作业计划的关键区别。",
        "completionCriteria": [
          "能达成学习目标：能按三个维度对给定计划进行分类，并说明战略计划与作业计划的关键区别。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "按层次分：战略、战术、作业计划",
          "按时间分：长期、中期、短期计划",
          "按明确性分：具体计划与指导性计划"
        ],
        "takeaways": [
          "战略计划由高层制定、覆盖全局、期限较长。",
          "作业计划面向具体任务，期限短、明确性高。",
          "同一计划可同时属于多个维度，分类看的是划分标准。"
        ],
        "difficultyTier": 1,
        "estimatedMinutes": 5,
        "sourceChunkIds": [],
        "exerciseSpec": {
          "types": [],
          "count": 0
        },
        "prerequisites": [
          "kp_2",
          "kp_3"
        ],
        "knowledgePointIds": [
          "kp_4",
          "kp_5",
          "kp_6"
        ],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "none",
          "score": 10,
          "reasons": [
            "对照与分类（辨析、分类、区别）"
          ]
        }
      },
      {
        "id": "scene_3",
        "order": 3,
        "type": "lecture",
        "title": "计划怎么定：制定过程与工具",
        "description": "讲解计划制定过程的主要步骤，并引入目标管理（MBO）与SMART原则、滚动计划法“近细远粗”两个工具，说明它们分别解决什么问题。",
        "teachingObjective": "能按步骤描述计划制定过程，并说明MBO与滚动计划法各自的作用与易错点。",
        "completionCriteria": [
          "能达成学习目标：能按步骤描述计划制定过程，并说明MBO与滚动计划法各自的作用与易错点。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "计划制定过程的主要步骤",
          "目标管理与SMART原则",
          "滚动计划法近细远粗"
        ],
        "takeaways": [
          "计划制定是识别机会、设定目标、拟定方案、选择方案、编制计划、执行反馈的多步骤过程。",
          "MBO强调上下级共同制定目标与自我控制，不是自上而下压指标。",
          "滚动计划法按近细远粗定期修订，适合环境变化大的场景。"
        ],
        "difficultyTier": 2,
        "estimatedMinutes": 6,
        "sourceChunkIds": [],
        "exerciseSpec": {
          "types": [],
          "count": 0
        },
        "prerequisites": [
          "kp_5",
          "kp_6"
        ],
        "knowledgePointIds": [
          "kp_7",
          "kp_8",
          "kp_9"
        ],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "none",
          "score": 10,
          "reasons": [
            "对照与分类（易错）"
          ]
        }
      },
      {
        "id": "scene_4",
        "order": 4,
        "type": "quiz",
        "title": "检索练习：类型与过程辨析",
        "description": "用选择题与判断题快速检索计划类型、制定过程与MBO易错点，其中一题直接考查“MBO不是压指标”这一易错点。",
        "teachingObjective": "能准确区分计划类型，并识别MBO与滚动计划法的常见误解。",
        "completionCriteria": [
          "能达成学习目标：能准确区分计划类型，并识别MBO与滚动计划法的常见误解。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "计划的类型",
          "计划的制定过程",
          "目标管理与SMART原则"
        ],
        "takeaways": [
          "分类看标准，不混用维度。",
          "MBO的关键是参与与自我控制。",
          "滚动计划法不等于弹性计划。"
        ],
        "difficultyTier": 2,
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
          "kp_8",
          "kp_9"
        ],
        "knowledgePointIds": [
          "kp_10",
          "kp_11"
        ],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "none",
          "score": 10,
          "reasons": [
            "对照与分类（辨析、易错）"
          ]
        }
      },
      {
        "id": "scene_5",
        "order": 5,
        "type": "practice",
        "title": "案例应用：一家企业的计划链条",
        "description": "给出一个企业案例情境（如某制造企业年度目标分解到车间任务），让学生按计划制定过程梳理其计划链条，并指出计划如何为组织分工与控制标准提供依据。",
        "teachingObjective": "能用计划制定过程分析企业案例，并说明计划对组织与控制的前置作用。",
        "completionCriteria": [
          "能达成学习目标：能用计划制定过程分析企业案例，并说明计划对组织与控制的前置作用。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "计划制定过程的主要步骤",
          "计划与组织、控制的衔接"
        ],
        "takeaways": [
          "企业计划从战略目标逐层分解为部门与岗位任务。",
          "计划分解的结果直接决定组织分工与职责。",
          "计划中的目标与指标就是控制的标准来源。"
        ],
        "difficultyTier": 3,
        "estimatedMinutes": 8,
        "sourceChunkIds": [],
        "exerciseSpec": {
          "types": [],
          "count": 0
        },
        "prerequisites": [
          "kp_10",
          "kp_11"
        ],
        "knowledgePointIds": [
          "kp_12"
        ],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "none",
          "score": 0,
          "reasons": []
        }
      },
      {
        "id": "scene_6",
        "order": 6,
        "type": "lecture",
        "title": "计划如何衔接组织与控制：闭环视角",
        "description": "从闭环视角讲清计划、组织、控制三者的接口：计划定目标与标准，组织配资源与职责，控制比对偏差并反馈修订计划，并辨析常见误区。",
        "teachingObjective": "能画出计划—组织—控制闭环，并解释反馈如何回到计划修订。",
        "completionCriteria": [
          "能达成学习目标：能画出计划—组织—控制闭环，并解释反馈如何回到计划修订。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "计划为组织提供分工依据",
          "计划为控制提供标准",
          "控制反馈修订计划"
        ],
        "takeaways": [
          "没有计划，组织分工失去依据，控制失去标准。",
          "控制不是计划之后的一次性动作，而是持续反馈。",
          "偏差反馈会触发计划修订，形成闭环。"
        ],
        "difficultyTier": 3,
        "estimatedMinutes": 6,
        "sourceChunkIds": [],
        "exerciseSpec": {
          "types": [],
          "count": 0
        },
        "prerequisites": [
          "kp_11",
          "kp_12"
        ],
        "knowledgePointIds": [
          "kp_13",
          "kp_14",
          "kp_15"
        ],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "none",
          "score": 10,
          "reasons": [
            "对照与分类（辨析）"
          ]
        }
      },
      {
        "id": "scene_7",
        "order": 7,
        "type": "quiz",
        "title": "易错点检测：MBO与滚动计划法",
        "description": "针对本课易错点设计选择题与判断题，检测学生是否把MBO误解为压指标、把滚动计划法等同于弹性计划。",
        "teachingObjective": "能识别并纠正MBO与滚动计划法的典型误解。",
        "completionCriteria": [
          "能达成学习目标：能识别并纠正MBO与滚动计划法的典型误解。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "目标管理与SMART原则",
          "滚动计划法近细远粗"
        ],
        "takeaways": [
          "MBO重参与与自我控制。",
          "滚动计划法靠定期修订保持弹性。",
          "易错点要靠对比记忆。"
        ],
        "difficultyTier": 3,
        "estimatedMinutes": 4,
        "sourceChunkIds": [],
        "exerciseSpec": {
          "types": [
            "choice",
            "judge"
          ],
          "count": 2
        },
        "prerequisites": [],
        "knowledgePointIds": [],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "none",
          "score": 10,
          "reasons": [
            "对照与分类（易错）"
          ]
        }
      },
      {
        "id": "scene_8",
        "order": 8,
        "type": "practice",
        "title": "迁移练习：为案例企业补一份计划",
        "description": "让学生为案例企业的一个部门补写短期作业计划，要求符合SMART原则，并说明该计划将如何被组织落实、被控制检验。",
        "teachingObjective": "能写出符合SMART的部门计划，并指出其组织落实与控制检验方式。",
        "completionCriteria": [
          "能达成学习目标：能写出符合SMART的部门计划，并指出其组织落实与控制检验方式。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "目标管理与SMART原则",
          "计划与组织、控制的衔接"
        ],
        "takeaways": [
          "好计划要具体、可衡量、有时限。",
          "计划写完要落到责任人与资源。",
          "计划指标要能进入控制环节被检验。"
        ],
        "difficultyTier": 3,
        "estimatedMinutes": 5,
        "sourceChunkIds": [],
        "exerciseSpec": {
          "types": [],
          "count": 0
        },
        "prerequisites": [],
        "knowledgePointIds": [],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "none",
          "score": 0,
          "reasons": []
        }
      },
      {
        "id": "scene_9",
        "order": 9,
        "type": "review",
        "title": "收束复盘：一条主线与三个易错点",
        "description": "汇总本课主线与特殊值、方法清单：计划—组织—控制闭环，计划类型三维度，制定过程步骤，MBO与滚动计划法要点，并回顾易错点。",
        "teachingObjective": "能复述本课主线与方法清单，并说出三个易错点的正确表述。",
        "completionCriteria": [
          "能达成学习目标：能复述本课主线与方法清单，并说出三个易错点的正确表述。",
          "能指出本场景中一个仍待核对的疑问或边界"
        ],
        "keyPoints": [
          "计划职能的含义",
          "计划的类型",
          "计划的制定过程",
          "计划与组织、控制的衔接"
        ],
        "takeaways": [
          "计划是管理闭环的起点，为组织提供依据、为控制提供标准。",
          "分类看标准，MBO重参与，滚动计划法靠近细远粗。",
          "案例分析的通用方法：定目标、分层次、配组织、设标准、看反馈。"
        ],
        "difficultyTier": 3,
        "estimatedMinutes": 4,
        "sourceChunkIds": [],
        "exerciseSpec": {
          "types": [],
          "count": 0
        },
        "prerequisites": [],
        "knowledgePointIds": [],
        "knowledgePointNames": [],
        "prerequisiteNames": [],
        "visualHint": {
          "level": "none",
          "score": 10,
          "reasons": [
            "对照与分类（易错）"
          ]
        }
      }
    ],
    "allowedChunkIds": [],
    "repairs": [],
    "createdAt": "2026-11-08T16:12:13.039Z"
  },
  "validation": {
    "passed": true,
    "violations": [],
    "metrics": {
      "coverage": 1,
      "durationDrift": 2,
      "totalMinutes": 47,
      "violationCount": 0,
      "errorCount": 0
    }
  },
  "repairs": [],
  "ledger": {
    "planId": "plan-mw815ze7",
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
        "text": "计划职能：计划职能是为实现目标而对未来行动做出的预先安排。它回答三件事：要达成什么、通过什么路径、什么时候做到。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_7",
        "sceneId": "scene_1",
        "target": "b5",
        "kind": "conclusion",
        "text": "常见误解是把计划当成一次性文件。材料强调计划要能衔接组织与控制：没有组织和控制接住，计划就只是纸面安排。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_8",
        "sceneId": "scene_1",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：能用自己的话说明计划职能的含义，并说出计划在管理循环中的位置。",
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
        "id": "cl_15",
        "sceneId": "scene_3",
        "target": "b2",
        "kind": "definition",
        "text": "计划制定过程：计划制定是识别机会、设定目标、拟定方案、选择方案、编制计划、执行反馈的多步骤过程；每一步都为下一步提供输入，反馈又回到目标与方案。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_16",
        "sceneId": "scene_3",
        "target": "b4",
        "kind": "example",
        "text": "正解：上下级共同制定目标，部门对目标有参与和承诺 → 目标分解后以自我控制为主，用成果评价 → 环境变化大时叠加滚动计划法，近细远粗定期修订",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_17",
        "sceneId": "scene_3",
        "target": "b5",
        "kind": "conclusion",
        "text": "MBO治“目标没人认账”，滚动计划法治“计划赶不上变化”。目标要SMART：具体、可衡量、可实现、相关、有时限；滚动计划法记住“近细远粗、定期修订、向前滚动”，适合环境变化较大的场景。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_18",
        "sceneId": "scene_3",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：能按步骤描述计划制定过程，并说明MBO与滚动计划法各自的作用与易错点。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_19",
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
        "id": "cl_25",
        "sceneId": "scene_2",
        "target": "b2",
        "kind": "definition",
        "text": "计划类型的三维划分：计划类型可按三个标准划分：按层次分为战略计划、战术计划、作业计划；按时间分为长期、中期、短期计划；按明确性分为具体计划与指导性计划。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_26",
        "sceneId": "scene_2",
        "target": "b5",
        "kind": "example",
        "text": "正解：“三年进入行业前五”由高层制定、覆盖全局——层次上是战略计划，时间上是长期计划 → 车间班次表面向具体任务、期限短、明确性高——层次上是作业计划，明确性上是具体计划 → 结论：同一计划可同时属于多个维度，分类看的是划分标准",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_27",
        "sceneId": "scene_2",
        "target": "b6",
        "kind": "conclusion",
        "text": "材料明确：战略计划由高层制定、覆盖全局、期限较长。作业计划面向具体任务，期限短、明确性高。判断时先锁定“谁制定、管多宽”，再看时间与明确性。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_28",
        "sceneId": "scene_2",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：能按三个维度对给定计划进行分类，并说明战略计划与作业计划的关键区别。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_29",
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
        "id": "cl_38",
        "sceneId": "scene_4",
        "target": "course-q-1",
        "kind": "question",
        "text": "某公司总经理牵头制定未来五年的发展计划，明确公司整体进入哪些行业、如何配置资源；生产车间则据此制定下月的班组排产安排。关于这两类计划，下列说法正确的是：",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_39",
        "sceneId": "scene_4",
        "target": "course-q-1",
        "kind": "explanation",
        "text": "正确答案是A。按层次划分，计划分为战略计划、战术计划和作业计划：战略计划由高层制定、覆盖全局、期限较长；作业计划则落到具体班组和短期安排。易错点：把“时间长短”当成唯一分类标准，忽略制定层次和覆盖范围，从而误选C或D。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_40",
        "sceneId": "scene_4",
        "target": "course-q-2",
        "kind": "question",
        "text": "判断：目标管理（MBO）就是上级把指标层层分解、直接下达给下级，下级按指标执行即可。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_41",
        "sceneId": "scene_4",
        "target": "course-q-2",
        "kind": "explanation",
        "text": "正确答案是“错”。MBO强调上下级共同制定目标、分解目标、自我控制、以成果评价，核心是“参与”和“自我控制”，不是自上而下压指标。易错点：把“目标分解”误当成“压指标”，忽略共同制定与自我控制这两个关键特征。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_42",
        "sceneId": "scene_4",
        "target": "course-q-3",
        "kind": "question",
        "text": "某企业所处市场环境变化较大，采用滚动计划法编制计划。下列做法符合该方法要求的是：",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_43",
        "sceneId": "scene_4",
        "target": "course-q-3",
        "kind": "explanation",
        "text": "正确答案是A。滚动计划法按“近细远粗”原则，定期修订未来计划并向前滚动，使计划既有连续性又有弹性，适合环境变化较大的场景。易错点：把滚动计划法与“弹性计划”混为一谈，或误以为计划一经确定就不能调整（B）；D描述的是压指标，属于MBO的常见误解，不是滚动计划法。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_44",
        "sceneId": "scene_4",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：能准确区分计划类型，并识别MBO与滚动计划法的常见误解。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_45",
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
        "id": "cl_53",
        "sceneId": "scene_5",
        "target": "scene",
        "kind": "reference",
        "text": "判断要点：计划制定过程在环境分析、目标分解、方案拟定与选择、实施与反馈调整等环节存在缺失；门店各自决定新品说明缺少作业层计划与统一协调；年度目标无人跟踪说明缺少实施、检查与反馈调整。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_54",
        "sceneId": "scene_5",
        "target": "scene",
        "kind": "reference",
        "text": "判断要点：“全年新开门店12家”属于战略计划或战术计划层次（需结合企业规模说明理由），时间上属于年度计划即短期计划（相对长期战略而言），覆盖全局、由高层主导。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_55",
        "sceneId": "scene_5",
        "target": "scene",
        "kind": "reference",
        "text": "解释要点：计划是组织与控制的前置：计划决定分工、岗位与资源配置（组织），并提供控制标准与偏差纠正依据（控制）；目标未分解到门店与月份，控制就失去可比较的标准。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_56",
        "sceneId": "scene_5",
        "target": "scene",
        "kind": "reference",
        "text": "解释要点：目标设定与分解问题：单店月均营业额提升8%若未明确口径与责任人，可衡量性和相关性不足；目标由总部单向下达、缺少上下级共同制定与自我控制，属于“压指标”而非MBO；应运用SMART原则逐项检查。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_57",
        "sceneId": "scene_5",
        "target": "scene",
        "kind": "reference",
        "text": "行动要点：如建立门店月度销售与生产计划并采用滚动计划法“近细远粗”修订；将年度目标按门店、季度、月份分解并明确责任人与检查节点；建立月度经营复盘与偏差纠正机制；新店开业采用跨部门进度表协调招聘、设备与装修。以上措施须分别对应组织或控制环节。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_58",
        "sceneId": "scene_5",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：能用计划制定过程分析企业案例，并说明计划对组织与控制的前置作用。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_59",
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
        "id": "cl_65",
        "sceneId": "scene_6",
        "target": "b2",
        "kind": "definition",
        "text": "计划—组织—控制闭环：闭环指计划先给出目标与衡量标准，组织据此配置资源与划分职责，控制按计划标准比对实际偏差，偏差再反馈回计划进行修订，三者首尾相接、持续循环。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_66",
        "sceneId": "scene_6",
        "target": "b4",
        "kind": "example",
        "text": "正解：计划给出目标与标准，组织据此分工配资源 → 控制持续按标准比对偏差，而非事后一次性检查 → 偏差反馈回计划，触发目标与方案修订，进入下一轮循环",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_67",
        "sceneId": "scene_6",
        "target": "b6",
        "kind": "conclusion",
        "text": "两个高频混淆：一是把目标管理当成自上而下压指标，材料明确 MBO 强调“参与”和“自我控制”；二是把滚动计划法与弹性计划混为一谈，滚动计划法按“近细远粗”定期修订并向前滚动。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_68",
        "sceneId": "scene_6",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：能画出计划—组织—控制闭环，并解释反馈如何回到计划修订。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_69",
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
        "id": "cl_78",
        "sceneId": "scene_7",
        "target": "course-q-1",
        "kind": "question",
        "text": "某公司推行目标管理（MBO）。下列哪种做法最符合MBO的要求？",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_79",
        "sceneId": "scene_7",
        "target": "course-q-1",
        "kind": "explanation",
        "text": "正确答案是B。MBO的关键是上下级共同制定目标、分解目标、自我控制、以成果评价，强调“参与”和“自我控制”。A是自上而下压指标，正是本场景要纠正的典型误解；C缺少可衡量的目标；D违背SMART原则中的“可实现”。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_80",
        "sceneId": "scene_7",
        "target": "course-q-2",
        "kind": "question",
        "text": "判断：滚动计划法按“近细远粗”原则定期修订并向前滚动，因此它适合环境变化较大的场景。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_81",
        "sceneId": "scene_7",
        "target": "course-q-2",
        "kind": "explanation",
        "text": "正确答案是“对”。滚动计划法的要点就是“近细远粗”：近期计划细、远期计划粗，定期修订并向前滚动，使计划既有连续性又有弹性，适合环境变化较大的场景。易错点是把它与“弹性计划”混为一谈，或误以为远期计划也应同样详细。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_82",
        "sceneId": "scene_7",
        "target": "course-q-3",
        "kind": "question",
        "text": "关于MBO的目标设定，下列说法正确的是（ ）。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_83",
        "sceneId": "scene_7",
        "target": "course-q-3",
        "kind": "explanation",
        "text": "正确答案是B，即SMART原则：具体、可衡量、可实现、相关、有时限。A漏掉“可衡量”；C是自上而下压指标，与MBO的“参与”相悖；D漏掉“有时限”。这三项都是常见易错点。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_84",
        "sceneId": "scene_7",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：能识别并纠正MBO与滚动计划法的典型误解。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_85",
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
        "id": "cl_92",
        "sceneId": "scene_8",
        "target": "scene",
        "kind": "reference",
        "text": "计划类型判断：季度部门计划通常属于战术计划或作业计划（视其覆盖范围而定），短期计划，具体计划；判断依据应结合制定层级、覆盖范围、期限和明确程度。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_93",
        "sceneId": "scene_8",
        "target": "scene",
        "kind": "reference",
        "text": "SMART偏差识别：常见偏差包括目标笼统不可衡量、缺少时限、目标与门店实际能力不匹配、目标与公司整体方向脱节；应结合“具体、可衡量、可实现、相关、有时限”逐项说明。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_94",
        "sceneId": "scene_8",
        "target": "scene",
        "kind": "reference",
        "text": "计划与组织、控制衔接：计划要明确责任岗位与资源安排（组织落实），同时设置可检验的指标、检查节点和反馈调整机制（控制检验），形成“计划—组织—控制”闭环。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_95",
        "sceneId": "scene_8",
        "target": "scene",
        "kind": "reference",
        "text": "行动建议要点：写出含明确指标、时限、责任人的季度目标，并说明由谁负责、如何分解到岗位、用什么数据在什么节点检查、偏差如何反馈调整。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_96",
        "sceneId": "scene_8",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：能写出符合SMART的部门计划，并指出其组织落实与控制检验方式。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_97",
        "sceneId": "scene_8",
        "target": "scene",
        "kind": "criterion",
        "text": "能指出本场景中一个仍待核对的疑问或边界",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_103",
        "sceneId": "scene_9",
        "target": "b2",
        "kind": "definition",
        "text": "计划职能：计划是管理闭环的起点：它确定目标与实现路径，为组织提供依据、为控制提供标准。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_104",
        "sceneId": "scene_9",
        "target": "b4",
        "kind": "example",
        "text": "正解：上下级共同制定目标 → 逐层分解目标，员工自我控制 → 以成果评价，目标符合SMART原则",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_105",
        "sceneId": "scene_9",
        "target": "b5",
        "kind": "conclusion",
        "text": "滚动计划法按“近细远粗”定期修订并向前滚动，适合环境变化大的场景，注意与“弹性计划”区分；战略计划由高层制定、覆盖全局、期限较长，不能与作业计划混为一谈。",
        "evidenceIds": [],
        "addedBy": "local"
      },
      {
        "id": "cl_106",
        "sceneId": "scene_9",
        "target": "scene",
        "kind": "criterion",
        "text": "能达成学习目标：能复述本课主线与方法清单，并说出三个易错点的正确表述。",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      },
      {
        "id": "cl_107",
        "sceneId": "scene_9",
        "target": "scene",
        "kind": "criterion",
        "text": "能指出本场景中一个仍待核对的疑问或边界",
        "evidenceIds": [
          "ev_3"
        ],
        "addedBy": "local"
      }
    ],
    "seq": 107
  },
  "fallback": false,
  "demo": true,
  "generatorVersion": "demo-generator-v1",
  "createdAt": "2026-11-08T16:11:55.346Z",
  "updatedAt": "2026-11-08T16:12:52.348Z"
}

export default DEMO_COURSE_PROJECT
