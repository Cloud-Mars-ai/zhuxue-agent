#!/usr/bin/env python3
"""Build reviewable HyperKnow-vs-current comparison sheets."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[3]
FRAMES = ROOT / "video-analysis" / "frames1"
CURRENT = ROOT / "docs" / "research" / "current"
OUTPUT = ROOT / "docs" / "research" / "comparisons"

PAIRS = [
    (
        "01-onboarding-whiteboard",
        "s_031.jpg",
        "03-board.png",
        "白板引导：点阵板、右侧对话历史、底部字幕，对应本项目板书页骨架",
    ),
    (
        "02-single-entry",
        "s_112.jpg",
        "01-course-home.png",
        "单入口首页：中央大输入、快捷标签、每日推荐",
    ),
    (
        "03-tool-menu",
        "s_120.jpg",
        "02-tool-menu.png",
        "工具菜单：从首页一次点击进入具体学习工具",
    ),
    (
        "04-assistant-tools",
        "s_123.jpg",
        "05-ask.png",
        "即时协助：讲解、计划、速查、追问应能归入同一入口",
    ),
    (
        "05-mastery",
        "s_201.jpg",
        "06-checkup.png",
        "掌握度与下一步：课程状态标签、成长路径和优先级",
    ),
    (
        "06-whiteboard-shell",
        "s_300.jpg",
        "03-board.png",
        "白板课内骨架：课程名、缩放/分页、常驻对话和输入区",
    ),
    (
        "07-structured-board",
        "s_405.jpg",
        "09-board-table.png",
        "结构化板书：路线图、定义、表格、图示与连续讲解",
    ),
    (
        "08-socratic",
        "s_372.jpg",
        "04-board-socratic-question.png",
        "打断提问：问题进入右栏，学生回答后继续原板书",
    ),
]


def load_font(size: int) -> ImageFont.ImageFont:
    for path in (
        Path(r"C:\Windows\Fonts\msyh.ttc"),
        Path(r"C:\Windows\Fonts\arial.ttf"),
    ):
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def fit(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return Image.open(image).convert("RGB").resize(size, Image.Resampling.LANCZOS)


def make_pair(slug: str, frame: str, current: str, caption: str) -> None:
    width = 920
    body_height = 545
    top = 46
    bottom = 42
    gutter = 20
    canvas = Image.new(
        "RGB",
        (width * 2 + gutter * 2, top + body_height + bottom),
        "#171717",
    )
    draw = ImageDraw.Draw(canvas)
    title_font = load_font(20)
    caption_font = load_font(17)

    left_x = gutter
    right_x = gutter * 2 + width
    left = fit(FRAMES / frame, (width, body_height))
    right = fit(CURRENT / current, (width, body_height))
    canvas.paste(left, (left_x, top))
    canvas.paste(right, (right_x, top))

    draw.text((left_x, 13), f"HyperKnow · {Path(frame).stem}", font=title_font, fill="#ffffff")
    draw.text((right_x, 13), f"星学 Agent · {Path(current).stem}", font=title_font, fill="#ffffff")
    draw.text((gutter, top + body_height + 12), caption, font=caption_font, fill="#e8e8e8")

    OUTPUT.mkdir(parents=True, exist_ok=True)
    canvas.save(OUTPUT / f"{slug}.jpg", quality=90, optimize=True)
    print(f"{slug}.jpg")


def main() -> None:
    for pair in PAIRS:
        make_pair(*pair)


if __name__ == "__main__":
    main()
