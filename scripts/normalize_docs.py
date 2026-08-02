#!/usr/bin/env python3
"""Minimally normalize generated docs.

Only two things are touched:
1. The leading derivation trees are merged into a single ```text block.
2. If no 中文翻译 marker exists, one is inserted before the first
   Chinese-heavy paragraph. Everything else is preserved as-is.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "output"

HEADING_LINE = re.compile(r"^#{1,4}\s")


def cjk_ratio(text: str) -> float:
    if not text:
        return 0.0
    cjk = sum(1 for ch in text if "\u4e00" <= ch <= "\u9fff")
    letters = sum(1 for ch in text if ch.isalpha())
    return cjk / max(letters, 1)


def split_paragraphs(lines: list[str]) -> list[str]:
    paras: list[str] = []
    current: list[str] = []
    in_fence = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            current.append(line)
            continue
        if not in_fence and stripped == "":
            if current:
                paras.append("\n".join(current))
                current = []
        else:
            current.append(line)
    if current:
        paras.append("\n".join(current))
    return paras


def is_tree_paragraph(paragraph: str) -> bool:
    return "词根" in paragraph or (
        paragraph.strip().startswith("```") and "──" in paragraph
    )


def normalize(text: str) -> str:
    paragraphs = split_paragraphs(text.split("\n"))
    header = [
        p for p in paragraphs if re.match(r"^#\s+Day\s+\d+", p.strip())
    ]
    body = [
        p for p in paragraphs if not re.match(r"^#\s+Day\s+\d+", p.strip())
    ]

    # Leading tree section: skip heading labels, then collect tree paragraphs.
    index = 0
    while index < len(body):
        stripped = body[index].strip()
        if not stripped or HEADING_LINE.match(stripped) or stripped.startswith(">") or stripped == "---":
            index += 1
            continue
        if is_tree_paragraph(body[index]):
            break
        index = len(body)
        break

    tree_paragraphs: list[str] = []
    while index < len(body) and (
        not body[index].strip()
        or HEADING_LINE.match(body[index].strip())
        or body[index].strip().startswith(">")
        or body[index].strip() == "---"
        or is_tree_paragraph(body[index])
    ):
        if (
            body[index].strip()
            and not HEADING_LINE.match(body[index].strip())
            and not body[index].strip().startswith(">")
            and body[index].strip() != "---"
        ):
            tree_paragraphs.append(body[index])
        index += 1
    rest = body[index:]

    tree_lines: list[str] = []
    for paragraph in tree_paragraphs:
        for line in paragraph.split("\n"):
            if not line.strip().startswith("```"):
                tree_lines.append(line)
    while tree_lines and not tree_lines[-1].strip():
        tree_lines.pop()

    has_translation_marker = any(
        re.search(r"中文翻译", p) and cjk_ratio(p) > 0.5
        for p in rest
    )
    zh_idx = next(
        (
            i
            for i, p in enumerate(rest)
            if cjk_ratio(p) > 0.5
            and len(p) > 30
            and not re.search(r"中文翻译", p)
        ),
        None,
    )

    parts = list(header)
    if tree_lines:
        parts.append("```text\n" + "\n".join(tree_lines).strip() + "\n```")
    if zh_idx is None:
        parts.extend(rest)
    else:
        parts.extend(rest[:zh_idx])
        if not has_translation_marker:
            parts.append("**中文翻译**")
        parts.extend(rest[zh_idx:])
    return "\n\n".join(parts).strip() + "\n"


def split_doc_sim(text: str):
    lines = text.split("\n")
    trans_idx = next(
        (i for i, line in enumerate(lines) if "中文翻译" in line),
        len(lines),
    )
    before = [
        line
        for line in lines[:trans_idx]
        if not re.match(r"^#\s+Day", line.strip())
        and not re.match(r"^>\s*生成时间", line.strip())
    ]
    translation = "\n".join(lines[trans_idx:]) if trans_idx < len(lines) else ""
    story_marker = re.compile(
        r"###\s*2\.?\s*连锁故事|^\*\*(英文)?连锁故事|^\*\*The Chain Story"
    )
    story_idx = next(
        (i for i, line in enumerate(before) if story_marker.search(line.strip())),
        -1,
    )
    if story_idx < 0:
        fence_start = next(
            (i for i, line in enumerate(before) if line.strip().startswith("```")),
            -1,
        )
        if fence_start >= 0:
            fence_end = next(
                (
                    i
                    for i, line in enumerate(before)
                    if i > fence_start and line.strip().startswith("```")
                ),
                -1,
            )
            story_idx = fence_end + 1 if fence_end >= 0 else fence_start + 1
        else:
            story_idx = 0
    derivation = "\n".join(before[:story_idx])
    story = "\n".join(before[story_idx:])

    def paras(markdown: str) -> list[str]:
        return [
            p.strip()
            for p in re.split(r"\n\s*\n", markdown)
            if p.strip()
            and not re.match(r"^#{1,4}\s", p.strip())
            and not re.match(r"^\*\*[^*]+\*\*$", p.strip())
            and not re.match(r"^\*\*[^*]+\*\*\s*([：:]\s*)?([（(][^）)]*[）)])?\s*[：:]?\s*$", p.strip())
            and not re.match(r"^-{3,}$", p.strip())
        ]

    return derivation, paras(story), paras(translation)


def validate(text: str) -> bool:
    derivation, story, translation = split_doc_sim(text)
    if not derivation.strip():
        return False
    if any(cjk_ratio(paragraph) > 0.5 for paragraph in story):
        return False
    if any(cjk_ratio(paragraph) < 0.25 and len(paragraph) > 30 for paragraph in translation):
        return False
    return True


def main() -> None:
    broken: list[Path] = []
    for path in sorted(DOCS_DIR.glob("Day_*.md")):
        original = path.read_text(encoding="utf-8")
        if validate(original):
            continue
        broken.append(path)
        path.write_text(normalize(original), encoding="utf-8")
        print(f"normalized {path.name}")
    print(f"done: {len(broken)} broken files fixed")


if __name__ == "__main__":
    main()
