#!/usr/bin/env python3
"""Build labelled contact sheets from the HyperKnow frame captures."""

from __future__ import annotations

import argparse
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def frame_number(path: Path) -> int:
    match = re.search(r"_(\d+)\.jpg$", path.name, flags=re.IGNORECASE)
    if not match:
        raise ValueError(f"Frame filename has no numeric index: {path.name}")
    return int(match.group(1))


def timestamp_label(path: Path, kind: str) -> str:
    number = frame_number(path)
    seconds = number if kind == "fine" else max(0, number - 1) * 4
    return f"{path.stem}  t={seconds // 60:02d}:{seconds % 60:02d}"


def load_font(size: int) -> ImageFont.ImageFont:
    for candidate in (
        Path(r"C:\Windows\Fonts\arial.ttf"),
        Path(r"C:\Windows\Fonts\segoeui.ttf"),
    ):
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def make_sheet(
    files: list[Path],
    target: Path,
    kind: str,
    columns: int,
    rows: int,
    thumb_width: int,
) -> None:
    label_height = 30
    frames = []
    for path in files:
        image = Image.open(path).convert("RGB")
        ratio = thumb_width / image.width
        size = (thumb_width, round(image.height * ratio))
        frames.append((path, image.resize(size, Image.Resampling.LANCZOS), size))

    thumb_height = max(size[1] for _, _, size in frames)
    sheet = Image.new(
        "RGB",
        (columns * thumb_width, rows * (thumb_height + label_height)),
        "#151515",
    )
    draw = ImageDraw.Draw(sheet)
    font = load_font(16)

    for index, (path, thumb, size) in enumerate(frames):
        column = index % columns
        row = index // columns
        x = column * thumb_width
        y = row * (thumb_height + label_height)
        sheet.paste(thumb, (x, y))
        draw.text(
            (x + 8, y + thumb_height + 5),
            timestamp_label(path, kind),
            fill="#f4f4f4",
            font=font,
        )

    target.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(target, quality=88, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--prefix", default="contact")
    parser.add_argument("--kind", choices=("coarse", "fine"), required=True)
    parser.add_argument("--columns", type=int, default=6)
    parser.add_argument("--rows", type=int, default=4)
    parser.add_argument("--thumb-width", type=int, default=320)
    args = parser.parse_args()

    files = sorted(args.source.glob("*.jpg"), key=frame_number)
    if not files:
        raise SystemExit(f"No JPG frames found in {args.source}")

    per_sheet = args.columns * args.rows
    sheet_count = math.ceil(len(files) / per_sheet)
    for index in range(sheet_count):
        chunk = files[index * per_sheet : (index + 1) * per_sheet]
        target = args.output / f"{args.prefix}-{index + 1:02d}.jpg"
        make_sheet(
            chunk,
            target,
            args.kind,
            args.columns,
            args.rows,
            args.thumb_width,
        )
        print(f"{target} ({chunk[0].name}..{chunk[-1].name})")


if __name__ == "__main__":
    main()
