from pathlib import Path
from datetime import date

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.pdfgen import canvas as pdfcanvas


ROOT = Path(__file__).resolve().parents[3]
OUTPUT = ROOT / "output" / "pdf" / "智慧学伴设计方案.pdf"
DATA_IMG = ROOT / "tmp" / "competition-workbench-data.png"
ANALYSIS_IMG = ROOT / "tmp" / "competition-workbench-analysis.png"
PLAN_IMG = ROOT / "tmp" / "competition-workbench-plan-v2.png"
MOBILE_IMG = ROOT / "tmp" / "competition-student-mobile.png"

FONT_BODY = "CJK-Song"
FONT_BOLD = "CJK-Hei"
FONT_TITLE = "CJK-Kai"
pdfmetrics.registerFont(
    TTFont(FONT_BODY, r"C:\Windows\Fonts\simsun.ttc", subfontIndex=0)
)
pdfmetrics.registerFont(TTFont(FONT_BOLD, r"C:\Windows\Fonts\simhei.ttf"))
pdfmetrics.registerFont(TTFont(FONT_TITLE, r"C:\Windows\Fonts\simkai.ttf"))

PAGE_W, PAGE_H = A4
MARGIN_X = 18 * mm
MARGIN_TOP = 22 * mm
MARGIN_BOTTOM = 17 * mm
ACCENT = colors.HexColor("#3D5BD9")
ACCENT_SOFT = colors.HexColor("#E9EDFF")
INK = colors.HexColor("#24221F")
SUB = colors.HexColor("#6B6558")
FAINT = colors.HexColor("#9A9387")
PAPER = colors.HexColor("#FAF8F2")
LINE = colors.HexColor("#DED8CB")
GOLD = colors.HexColor("#B7791F")
OK = colors.HexColor("#2F8F5B")
DANGER = colors.HexColor("#C0483C")

styles = getSampleStyleSheet()
BODY = ParagraphStyle(
    "Body",
    parent=styles["BodyText"],
    fontName=FONT_BODY,
    fontSize=9.5,
    leading=16,
    textColor=INK,
    spaceAfter=5,
)
BODY_SMALL = ParagraphStyle(
    "BodySmall",
    parent=BODY,
    fontSize=8.4,
    leading=13.5,
    textColor=SUB,
    spaceAfter=4,
)
CAPTION = ParagraphStyle(
    "Caption",
    parent=BODY_SMALL,
    fontSize=7.8,
    leading=11,
    textColor=FAINT,
    alignment=TA_CENTER,
)
H1 = ParagraphStyle(
    "H1",
    parent=BODY,
    fontName=FONT_TITLE,
    fontSize=24,
    leading=29,
    textColor=INK,
    spaceAfter=10,
)
H2 = ParagraphStyle(
    "H2",
    parent=BODY,
    fontName=FONT_BOLD,
    fontSize=13,
    leading=18,
    textColor=INK,
    spaceBefore=4,
    spaceAfter=6,
)
H3 = ParagraphStyle(
    "H3",
    parent=BODY,
    fontName=FONT_BOLD,
    fontSize=10.5,
    leading=15,
    textColor=ACCENT,
    spaceBefore=3,
    spaceAfter=3,
)
KICKER = ParagraphStyle(
    "Kicker",
    parent=BODY_SMALL,
    fontName=FONT_BOLD,
    fontSize=7,
    leading=9,
    textColor=ACCENT,
    tracking=1.2,
)
QUOTE = ParagraphStyle(
    "Quote",
    parent=BODY,
    fontName=FONT_TITLE,
    fontSize=15,
    leading=23,
    textColor=INK,
    leftIndent=8 * mm,
    rightIndent=6 * mm,
    spaceBefore=5,
    spaceAfter=8,
    borderColor=ACCENT,
    borderWidth=0,
    borderPadding=0,
)


def P(text, style=BODY):
    return Paragraph(text, style)


def bullets(items, style=BODY_SMALL):
    return [Paragraph(f"• {item}", style) for item in items]


def data_table(rows, widths=None, header=True):
    converted = []
    for r_index, row in enumerate(rows):
        converted.append(
            [
                cell
                if isinstance(cell, (Paragraph, Image, Table))
                else P(str(cell), H3 if header and r_index == 0 else BODY_SMALL)
                for cell in row
            ]
        )
    table = Table(converted, colWidths=widths, hAlign="LEFT", repeatRows=1 if header else 0)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), ACCENT_SOFT if header else PAPER),
                ("TEXTCOLOR", (0, 0), (-1, 0), INK),
                ("FONTNAME", (0, 0), (-1, -1), FONT_BODY),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.35, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PAPER]),
            ]
        )
    )
    return table


def safe_image(path, max_w, max_h):
    img = PILImage.open(path)
    ratio = min(max_w / img.width, max_h / img.height)
    return Image(str(path), width=img.width * ratio, height=img.height * ratio)


def section_title(kicker, title, lead=None):
    parts = [P(kicker, KICKER), Spacer(1, 2 * mm), P(title, H1)]
    if lead:
        parts += [P(lead, BODY_SMALL), Spacer(1, 2.5 * mm)]
    return parts


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.4)
    canvas.line(MARGIN_X, 12 * mm, PAGE_W - MARGIN_X, 12 * mm)
    canvas.setFillColor(SUB)
    canvas.setFont(FONT_BODY, 7)
    canvas.drawString(MARGIN_X, 7.5 * mm, "智慧学伴 · 学情诊断与个性化学习智能体")
    canvas.drawRightString(PAGE_W - MARGIN_X, 7.5 * mm, f"{doc.page:02d}")
    canvas.restoreState()


class PdfDoc(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        super().__init__(filename, **kwargs)
        frame = Frame(
            MARGIN_X,
            MARGIN_BOTTOM,
            PAGE_W - MARGIN_X * 2,
            PAGE_H - MARGIN_TOP - MARGIN_BOTTOM,
            id="main",
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )
        self.addPageTemplates(
            [
                PageTemplate(id="cover", frames=[frame], onPage=self.cover_page),
                PageTemplate(id="body", frames=[frame], onPage=footer),
            ]
        )

    @staticmethod
    def cover_page(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(colors.HexColor("#F4F0E7"))
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        canvas.setFillColor(ACCENT)
        canvas.roundRect(MARGIN_X, PAGE_H - 58 * mm, PAGE_W - MARGIN_X * 2, 3 * mm, 1.5 * mm, fill=1, stroke=0)
        canvas.setFillColor(FAINT)
        canvas.setFont(FONT_BOLD, 8)
        canvas.drawString(MARGIN_X, PAGE_H - 35 * mm, "SECOND BEIJING COLLEGE STUDENTS' AI+ INNOVATION COMPETITION")
        canvas.restoreState()


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = PdfDoc(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=MARGIN_TOP,
        bottomMargin=MARGIN_BOTTOM,
        title="智慧学伴：学情诊断与个性化学习智能体设计方案",
        author="人机协同助学智能体项目组",
    )
    story = []

    # 1 Cover
    story += [
        Spacer(1, 42 * mm),
        P("赛题：智慧学伴 · 学情诊断与个性化学习智能体构建", KICKER),
        Spacer(1, 7 * mm),
        P("智慧学伴", ParagraphStyle("CoverTitle", parent=H1, fontName=FONT_TITLE, fontSize=34, leading=42)),
        P("让每一条学情结论都有依据<br/>让每一项学习建议都能落地", ParagraphStyle("CoverLead", parent=QUOTE, fontSize=19, leading=31)),
        Spacer(1, 48 * mm),
        data_table(
            [
                ["设计范围", "七年级数学 · 有理数 / 整式 / 一元一次方程"],
                ["核心任务", "内容梳理 · 个体与群体学情 · 个性化建议"],
                ["交付形态", "Web + H5 · 一个工作台 · 可复核成果包"],
                ["版本", f"math7-competition-v1 · {date.today().isoformat()}"],
            ],
            [38 * mm, 120 * mm],
            header=False,
        ),
        Spacer(1, 12 * mm),
        P("当前内置数据为固定种子开发样例，正式提交前须替换为赛方数据。", CAPTION),
        NextPageTemplate("body"),
        PageBreak(),
    ]
    story[0]._pageBreak = True

    # 2 Requirements
    story += section_title(
        "01 / REQUIREMENT READING",
        "赛题要求与方案回应",
        "评分重点不是技术堆叠，而是结果是否准确、依据是否充分、建议是否合理、复核是否容易。",
    )
    story += [
        data_table(
            [
                ["赛题任务", "评分关注", "本方案回应"],
                ["学习内容与要求梳理", "范围、内容理解、材料依据、组织关系", "主题—要求—前置关系—材料—题目五层图谱，每项保留出处"],
                ["学生学习情况分析", "数据处理、表现描述、问题依据、分析呈现", "原始记录与有效记录分离，重复/异常/缺失单独报告"],
                ["个性化学习建议", "建议适切、理由依据、不同需求、实施调整", "材料与练习 ID 绑定，建议有顺序、完成标准和教师调整"],
                ["文档与演示", "完整、清晰、时长、复核材料", "JSON/CSV 成果包、20 页内 PDF、5 分钟内视频、答辩 PPT"],
            ],
            [38 * mm, 63 * mm, 73 * mm],
        ),
        Spacer(1, 5 * mm),
        P("关键判断", H2),
        P("只要生成页面好看而不提供统计依据，就无法回应赛题的复核要求。系统因此把确定性计算放在生成模型之前，模型不能改写统计与排序。", BODY),
        Spacer(1, 4 * mm),
        data_table(
            [
                ["权重", "资料评审", "现场答辩"],
                ["80 / 20", "方案、成果包、视频、复核依据", "10 分钟讲解 + 5 分钟问答"],
                ["同分规则", "优先比较学情分析", "其次比较个性化建议"],
            ],
            [35 * mm, 68 * mm, 68 * mm],
        ),
        PageBreak(),
    ]

    # 3 Product definition
    story += section_title(
        "02 / PRODUCT DEFINITION",
        "一个工作台，完成三项核心任务",
        "把“内容与数据、学情分析、建议与核验”合并为同一页面内的三个连续步骤。",
    )
    story += [
        data_table(
            [
                ["步骤", "教师看到什么", "系统实际做了什么"],
                ["01 内容与数据", "主题、课程要求、材料出处、质量问题", "导入数据；去重；校验引用；隔离无效记录；建立内容关系"],
                ["02 学情分析", "群体、小组、个体、共性与信息不足", "按课程要求计算观察数、得分率、覆盖率、错误概念和证据"],
                ["03 建议与核验", "顺序建议、理由、材料、练习、教师调整、导出", "规则生成行动链；绑定证据；记录调整；构建任务成果包"],
            ],
            [38 * mm, 74 * mm, 62 * mm],
        ),
        Spacer(1, 5 * mm),
        P("学生端不新增工作台", H2),
        P("学生复用现有课程首页和学习体验，只保留“我的学情、学习路径、内容图谱”三个视图。学习路径可以直接生成正常上课或考前冲刺课程，进入横向结构化板书。", BODY),
        Spacer(1, 4 * mm),
        data_table(
            [
                ["角色", "入口", "主要动作"],
                ["教师 / 助教", "智慧学伴工作台", "导入、诊断、复核、调整、导出"],
                ["学生", "课程首页 / 智慧学伴 / H5 学伴", "看依据、按顺序学习、生成课程、继续提问"],
            ],
            [38 * mm, 58 * mm, 78 * mm],
        ),
        Spacer(1, 7 * mm),
        P("设计原则：每个结论必须回答“依据哪条记录、对应哪项要求、为什么给出这项建议”。", QUOTE),
        PageBreak(),
    ]

    # 4 Architecture
    story += section_title(
        "03 / ARCHITECTURE",
        "确定性分析与生成式表达分层",
        "统计、排序、材料映射由规则引擎完成；大模型只组织解释和课程内容。",
    )
    architecture = [
        ["输入", "课程要求 / 材料 / 题目 / 学生 / 学习记录 / 任务条件"],
        ["质量层", "去重 / 缺失字段 / 未知引用 / 异常分数 / 非法状态 / 时间格式"],
        ["内容层", "主题 → 课程要求 → 前置关系 → 材料 → 题目"],
        ["学情层", "个体统计 / 小组比较 / 群体共性问题 / 信息不足"],
        ["建议层", "补前置 / 重讲 / 检索 / 变式 / 迁移 / 复盘"],
        ["体验层", "个性化课程 / 横向板书 / 语音讲解 / 追问"],
        ["证据层", "记录 ID / 题目 ID / 材料 ID / 规则版本 / 教师调整审计"],
    ]
    story += [
        data_table(architecture, [32 * mm, 142 * mm], header=False),
        Spacer(1, 7 * mm),
        P("为什么不让模型直接算", H2),
    ]
    story += bullets(
        [
            "同一输入必须产生同一统计结果，便于赛题复核；",
            "缺失记录不能因为模型推测而变成“未掌握”；",
            "材料与题目必须能按 ID 追踪，模型只允许从允许集合中选择；",
            "模型失败时仍能完成数据质量、诊断、建议、导出和确定性课程演示。",
        ]
    )
    story += [
        Spacer(1, 6 * mm),
        P("模型边界", H3),
        P("模型可写解释、课堂语言和板书组织，但不能新增不存在的学生、题目、材料或统计值；所有结构化输出都会经过 schema 归一化，不允许 HTML、脚本或自由画布。", BODY),
        PageBreak(),
    ]

    # 5 Data model and quality
    story += section_title(
        "04 / DATA QUALITY",
        "先保留原始记录，再隔离有效分析数据",
        "数据质量不是清洗日志，而是可复核的结果组成。",
    )
    story += [
        data_table(
            [
                ["对象", "关键字段", "用途"],
                ["主题 / 要求", "ID、内容、期望、前置关系、出处", "建立学习内容与要求清单"],
                ["材料", "ID、类型、正文、来源、定位", "把建议回指具体材料"],
                ["题目", "ID、要求、材料、难度、概念", "形成表现证据和练习映射"],
                ["学生 / 群体", "脱敏 ID、小组、年级", "个体与群体分析"],
                ["学习记录", "学生、题目、状态、得分、时间", "计算覆盖、得分率与错误概念"],
            ],
            [34 * mm, 76 * mm, 64 * mm],
        ),
        Spacer(1, 5 * mm),
        P("质量处理规则", H2),
        data_table(
            [
                ["问题", "处理", "是否进入正确率"],
                ["重复 recordId", "保留首条并报告", "否"],
                ["学生 / 题目 / 材料引用不存在", "原文保留，报告问题", "否"],
                ["必填字段为空", "原文保留，报告问题", "否"],
                ["负分 / 超满分 / 状态非法", "原文保留，报告问题", "否"],
                ["时间不可解析", "报告问题，保留作答结果", "是"],
                ["status=missing", "进入信息不足统计", "否"],
            ],
            [62 * mm, 78 * mm, 34 * mm],
        ),
        Spacer(1, 5 * mm),
        P("开发样例：417 条原始记录中，411 条进入有效分析；识别 6 条质量问题、14 条缺失观察。界面与导出包均明确标注“开发样例，不是赛方正式数据”。", BODY_SMALL),
        PageBreak(),
    ]

    # 6 Learner/group
    story += section_title(
        "05 / LEARNING ANALYSIS",
        "个体看证据，群体看门槛",
        "把“信息不足”作为独立状态，而不是把没有记录直接等同于不会。",
    )
    story += [
        data_table(
            [
                ["分析层级", "结果", "证据形式"],
                ["个体", "每项课程要求的观察数、得分率、正确/部分/错误、错误概念", "记录 ID + 题目 + 材料出处"],
                ["要求覆盖", "当前学生已经出现观察的要求比例", "已覆盖要求 / 全部要求"],
                ["群体", "班级与小组得分率、覆盖率、薄弱学生比例", "汇总统计 + 受影响学生数"],
                ["共性薄弱点", "达到观察数、得分率和受影响比例门槛", "要求 ID + 记录 ID + 统计值"],
                ["信息不足", "观察少或覆盖不足，不能形成掌握判断", "缺失观察数与覆盖边界"],
            ],
            [35 * mm, 77 * mm, 62 * mm],
        ),
        Spacer(1, 5 * mm),
        P("三类状态", H2),
        data_table(
            [
                ["状态", "含义", "系统输出"],
                ["可分析", "达到最低有效观察", "可给出已确认薄弱点和稳定表现"],
                ["信息偏少", "有一定记录但覆盖不足", "只描述已有表现，并建议补充观察"],
                ["信息不足", "有效观察过少", "不判断掌握水平，不生成“未掌握”结论"],
            ],
            [30 * mm, 70 * mm, 74 * mm],
        ),
        Spacer(1, 5 * mm),
        P("群体结论设置门槛的价值：避免用一个班 30 人中的 1 条错题就生成“全班共性薄弱点”，也避免样本量小时过度排序。", QUOTE),
        PageBreak(),
    ]

    # 7 Recommendations
    story += section_title(
        "06 / RECOMMENDATION",
        "每条建议都是可执行、可调整的行动链",
        "建议不只写“多练习”，而要回答练什么、为什么先练、达到什么标准。",
    )
    story += [
        data_table(
            [
                ["字段", "示例"],
                ["对应要求", "EXP-03 同类项与整式加减"],
                ["行动", "先重讲同类项定义，再做 4 道检索题，最后完成 1 道变式题"],
                ["材料", "《同类项与去括号》+《整式加减的分步示范》"],
                ["理由", "得分率 56%，48 条观察中错误 17 次，错误集中在符号处理"],
                ["完成标准", "4 题至少正确 3 题；错误题写明错在概念、符号还是步骤"],
                ["边界", "只适用于当前课程范围与该学生当前记录窗口"],
            ],
            [35 * mm, 139 * mm],
        ),
        Spacer(1, 5 * mm),
        P("默认顺序", H2),
        P("补前置 → 重讲目标概念 → 低难度检索 → 变式练习 → 情境迁移 → 复盘", BODY),
        Spacer(1, 4 * mm),
        P("教师调整", H2),
    ]
    story += bullets(
        [
            "通过：确认建议可以执行；",
            "调整：修改任务、说明、理由或完成标准，必须填写调整依据；",
            "移除：保留移除记录，不删除原始建议；",
            "审计：记录推荐版本、操作时间、教师原因和调整前后内容。",
        ]
    )
    story += [
        Spacer(1, 5 * mm),
        P("信息不足时，系统先生成“补充观察”任务，不生成能力结论。", BODY_SMALL),
        PageBreak(),
    ]

    # 8 Course generation
    story += section_title(
        "07 / COURSE EXPERIENCE",
        "从建议直接进入学习，不让建议停在列表",
        "复用既有两阶段课程生成、渐进展示、结构化板书和语音讲解。",
    )
    story += [
        data_table(
            [
                ["阶段", "产物", "失败时"],
                ["大纲", "6 个场景：定位、规则、变式、检索、迁移、复盘", "使用建议链与材料确定性生成"],
                ["场景", "板书 / 检索 / 实践 / 复盘", "逐场景完成即写入 IndexedDB，按 3 路并发推进"],
                ["体验", "完成可学、未完成继续生成", "首场景完成即可开始，不需要等待全部场景"],
                ["板书", "路线、定义、对照、图示、提示、追问", "受控 block schema；不输出 HTML / 脚本 / 自由画布"],
                ["语音", "字幕自动跟随；5 种音色；开关可控", "语音失败不阻断字幕和板书"],
            ],
            [32 * mm, 83 * mm, 59 * mm],
        ),
        Spacer(1, 6 * mm),
        P("正常上课与考前冲刺", H2),
        P("正常上课先补前置，完整建立规则、理解和迁移；考前冲刺压缩背景，集中处理高频错误、常见问法和可直接用于答题的表达。两种模式共用同一份证据和建议，避免出现两套互不一致的结论。", BODY),
        Spacer(1, 6 * mm),
        P("学生学习路径的关键不是“生成内容更多”，而是每个场景仍能回指课程要求和推荐依据。", QUOTE),
        PageBreak(),
    ]

    # 9 UI overview
    story += section_title(
        "08 / WORKBENCH",
        "内容、学情与建议在同一页面完成",
        "教师不需要在多个工作台之间搬数据；三步导航始终可见。",
    )
    story += [
        KeepTogether(
            [
                safe_image(DATA_IMG, 168 * mm, 82 * mm),
                P("内容与数据：开发标签、数据规模、质量问题和课程要求图谱同屏。", CAPTION),
            ]
        ),
        Spacer(1, 4 * mm),
        KeepTogether(
            [
                safe_image(ANALYSIS_IMG, 168 * mm, 82 * mm),
                P("学情分析：群体门槛与个体证据并列，切换学生即时更新。", CAPTION),
            ]
        ),
        PageBreak(),
    ]

    # 10 Plan/mobile
    story += section_title(
        "09 / EVIDENCE CHAIN",
        "建议、核验与学生端保持同一条证据链",
        "教师端可调整，学生端看到的是同一套行动顺序与学习依据。",
    )
    story += [
        Table(
            [
                [
                    Table(
                        [[safe_image(PLAN_IMG, 105 * mm, 72 * mm)]],
                        colWidths=[109 * mm],
                        style=TableStyle(
                            [
                                ("BOX", (0, 0), (-1, -1), 0.35, LINE),
                                ("LEFTPADDING", (0, 0), (-1, -1), 1),
                                ("RIGHTPADDING", (0, 0), (-1, -1), 1),
                                ("TOPPADDING", (0, 0), (-1, -1), 1),
                                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                            ]
                        ),
                    ),
                    Table(
                        [[safe_image(MOBILE_IMG, 34 * mm, 90 * mm)]],
                        colWidths=[38 * mm],
                        style=TableStyle(
                            [
                                ("BOX", (0, 0), (-1, -1), 0.35, LINE),
                                ("LEFTPADDING", (0, 0), (-1, -1), 1),
                                ("RIGHTPADDING", (0, 0), (-1, -1), 1),
                                ("TOPPADDING", (0, 0), (-1, -1), 1),
                                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                            ]
                        ),
                    ),
                ],
                [
                    P(
                        "桌面教师端：建议卡按顺序展开，理由、完成标准、材料、练习和证据均可点击查看；右侧是典型案例和成果导出。",
                        BODY_SMALL,
                    ),
                    P(
                        "H5 学生端：只显示已有表现、信息不足、逐项要求和建议路径；生成课程后进入同一套课程体验。",
                        BODY_SMALL,
                    ),
                ]
            ],
            colWidths=[112 * mm, 58 * mm],
            style=TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 2),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 2),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ]
            ),
        ),
        Spacer(1, 4 * mm),
        P("学生的下一步不是“再生成一份报告”，而是进入一节有材料、有练习、有追问的课程。", QUOTE),
        PageBreak(),
    ]

    # 11 Security
    story += section_title(
        "10 / SECURITY & COMPLIANCE",
        "把密钥、内容边界和数据边界写进工程实现",
        "安全要求不能只放在方案说明里，必须在请求链路中执行。",
    )
    story += [
        data_table(
            [
                ["风险", "控制"],
                ["前端明文密钥", "DeepSeek / StepAudio 密钥移至服务端 `.env`，前端只调用同源 `/api/ai/*`"],
                ["输入过大或格式异常", "请求体 1.5 MB 上限；消息数与长度限制；只接受 JSON"],
                ["高风险管理内容", "请求与模型响应执行基础教育内容安全检查"],
                ["模型输出结构不稳定", "JSON 解析、schema 归一化、一次修复重试、确定性兜底"],
                ["真实个人信息", "内置样例为脱敏模拟学生；检测疑似身份证号或手机号"],
                ["赛事数据外传", "导出包标记数据性质；正式数据使用范围和赛后删除写入交付说明"],
            ],
            [58 * mm, 116 * mm],
        ),
        Spacer(1, 5 * mm),
        P("开源与第三方资产", H2),
        P("OpenMAIC 等开源实现只复用结构、交互和工程策略，不复制品牌资产；引用来源、版本和许可证在交付前统一登记。", BODY),
        Spacer(1, 4 * mm),
        P("数据安全提示", H3),
        P("赛方提供的数据仅限本次比赛使用。正式数据接入前，应确认访问权限、保存位置、导出范围和赛后删除责任人。", BODY_SMALL),
        PageBreak(),
    ]

    # 12 Verification
    story += section_title(
        "11 / VERIFICATION",
        "样例覆盖的是边界条件，而不只是顺利路径",
        "固定种子使输入可重放，质量问题与信息不足也能稳定复现。",
    )
    story += [
        data_table(
            [
                ["核对项", "当前样例", "验证意义"],
                ["范围", "3 个主题 / 9 项要求 / 18 份材料", "覆盖赛题首批 2–3 个主题结构"],
                ["题库", "60 道题", "与参考规模对齐"],
                ["学生", "30 名，分为 3 组", "支持个体、小组、群体分析"],
                ["原始记录", "417 条", "覆盖不同覆盖率和信息不足"],
                ["有效记录", "411 条", "质量问题与统计分母隔离"],
                ["质量问题", "重复 1、异常 4、缺字段 1、缺失观察 14", "验证质量处理与证据保留"],
                ["建议", "30 份；每项行动均有理由、完成标准、材料、题和证据", "验证建议可执行与可追踪"],
                ["典型案例", "3 个", "覆盖有表现、表现较好、信息不足"],
            ],
            [42 * mm, 74 * mm, 58 * mm],
        ),
        Spacer(1, 7 * mm),
        P("可复现命令", H2),
        P("npm run test:competition → JSON/CSV 结果 → npm run export:competition → 复核 verification-report.json", BODY_SMALL),
        Spacer(1, 5 * mm),
        P("正式评测前仍需完成：替换正式数据、确认字段字典、复核典型 case、检查公开部署和处理赛方要求的删除策略。", BODY),
        PageBreak(),
    ]

    # 13 Deliverables and roadmap
    story += section_title(
        "12 / DELIVERY",
        "交付物与执行顺序",
        "先完成可复核的数据与分析，再完成演示材料和发布。",
    )
    story += [
        data_table(
            [
                ["顺序", "工作", "验收"],
                ["0", "数据契约、字段说明、样例数据", "输入输出可复现"],
                ["1", "质量检查与有效记录隔离", "问题清单 + 有效记录 CSV"],
                ["2", "内容图谱与个体/群体分析", "每条结论带证据"],
                ["3", "建议链与教师调整", "建议有理由、顺序、材料和题"],
                ["4", "学生个性化课程与双端体验", "建议直达课程与板书"],
                ["5", "PDF、MP4、PPT、成果包", "20 页内、5 分钟内、可复核"],
                ["6", "密钥迁移、回归测试、公网发布", "无明文密钥；深链接可用"],
            ],
            [20 * mm, 90 * mm, 64 * mm],
        ),
        Spacer(1, 7 * mm),
        P("当前完成度", H2),
        data_table(
            [
                ["已完成", "待替换 / 待确认"],
                ["一个工作台、确定性引擎、开发样例、个体/群体分析、建议链、教师调整、成果包、学生课程入口、服务端 AI 代理", "赛方正式数据、赛方最终典型 case、正式 PDF/视频/PPT、公网发布和密钥轮换"],
            ],
            [84 * mm, 90 * mm],
        ),
        PageBreak(),
    ]

    # 14 Boundary
    story += section_title(
        "13 / LIMITS",
        "适用范围与需要人工把关的部分",
        "明确边界比夸大结果更符合比赛对准确性、依据充分性和建议合理性的要求。",
    )
    story += bullets(
        [
            "开发样例中的数值和案例只用于验证链路，不代表真实教学效果；",
            "正式数据字段、主题和典型案例以赛方最终说明为准；",
            "基础教育内容安全检查不能替代人工审核；",
            "策略规则需要与教师确认，尤其是低表现阈值、共同问题门槛和前置关系；",
            "模型不可用于生成页码或隐藏的材料出处，引用必须回指真实数据 ID；",
            "教师调整后需要人工复核其合理性和适用边界。",
        ]
    )
    story += [
        Spacer(1, 12 * mm),
        P("方案落点", H2),
        P("用可复现的统计发现学生需求，用可追踪的材料和练习把建议落下来，再把建议变成可继续追问的课程。这是“智慧学伴”的最小完整闭环。", BODY),
        Spacer(1, 14 * mm),
        P("附录：数据契约、任务成果包、开发样例、验证报告与源代码目录由仓库附件提供。", BODY_SMALL),
    ]

    doc.build(story)
    print("PDF written")


if __name__ == "__main__":
    build()
