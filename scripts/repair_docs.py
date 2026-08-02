#!/usr/bin/env python3
"""Repair only the docs that fail strict validation, one file at a time."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "output"

LABEL = re.compile(
    r"^\*\*[^*]+\*\*\s*([：:]\s*)?([（(][^）)]*[）)])?\s*[：:]?\s*$"
)


def cjk_ratio(text: str) -> float:
    if not text:
        return 0.0
    cjk = sum(1 for ch in text if "\u4e00" <= ch <= "\u9fff")
    letters = sum(1 for ch in text if ch.isalpha())
    return cjk / max(letters, 1)


def split_paragraphs(text: str) -> list[str]:
    return [
        p.strip()
        for p in re.split(r"\n\s*\n", text)
        if p.strip()
    ]


def is_tree_paragraph(paragraph: str) -> bool:
    return "词根" in paragraph or bool(re.search(r"[├└┌│]", paragraph))


def clean_paragraphs(markdown: str) -> list[str]:
    out: list[str] = []
    for paragraph in split_paragraphs(markdown):
        paragraph = paragraph.strip()
        if not paragraph:
            continue
        if re.match(r"^#{1,4}\s", paragraph):
            continue
        if LABEL.match(paragraph) or re.match(r"^\*\*[^*]+\*\*$", paragraph):
            continue
        if re.match(r"^-{3,}$", paragraph):
            continue
        out.append(paragraph)
    return out


def strict_validate(text: str):
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

    derivation = before[:story_idx]
    story_paras = clean_paragraphs("\n".join(before[story_idx:]))
    translation_paras = (
        clean_paragraphs("\n".join(lines[trans_idx:]))
        if trans_idx < len(lines)
        else []
    )

    issues: list[str] = []
    if not "".join(derivation).strip():
        issues.append("NO_DERIVATION")
    if not story_paras:
        issues.append("NO_STORY")
    if not translation_paras:
        issues.append("NO_TRANSLATION")
    for paragraph in story_paras:
        if "```" in paragraph:
            issues.append("FENCE_IN_STORY")
        if is_tree_paragraph(paragraph):
            issues.append("TREE_IN_STORY")
        if cjk_ratio(paragraph) > 0.5:
            issues.append("ZH_IN_STORY")
    for paragraph in translation_paras:
        if "```" in paragraph:
            issues.append("FENCE_IN_TRANS")
        if cjk_ratio(paragraph) < 0.25 and len(paragraph) > 30:
            issues.append("EN_IN_TRANS")
    return not issues, issues


def repair(text: str) -> str:
    # Remove every fence marker first, then rebuild one tree block.
    lines = [
        line
        for line in text.split("\n")
        if not line.strip().startswith("```")
    ]
    paragraphs = split_paragraphs("\n".join(lines))

    header = [
        p for p in paragraphs if re.match(r"^#\s+Day\s+\d+", p.strip())
    ]
    body = [
        p for p in paragraphs if not re.match(r"^#\s+Day\s+\d+", p.strip())
    ]

    index = 0
    while index < len(body):
        stripped = body[index].strip()
        if not stripped or re.match(r"^#{1,4}\s", stripped) or stripped.startswith(">") or stripped == "---":
            index += 1
            continue
        break

    tree_paragraphs: list[str] = []
    while index < len(body):
        stripped = body[index].strip()
        if (
            not stripped
            or re.match(r"^#{1,4}\s", stripped)
            or stripped.startswith(">")
            or stripped == "---"
            or is_tree_paragraph(body[index])
        ):
            if (
                stripped
                and not re.match(r"^#{1,4}\s", stripped)
                and not stripped.startswith(">")
                and stripped != "---"
            ):
                tree_paragraphs.append(body[index])
            index += 1
        else:
            break
    rest = body[index:]

    zh_idx = next(
        (
            i
            for i, paragraph in enumerate(rest)
            if cjk_ratio(paragraph) > 0.5 and len(paragraph) > 30
        ),
        None,
    )

    parts = list(header)
    if tree_paragraphs:
        parts.append(
            "```text\n" + "\n".join(tree_paragraphs).strip() + "\n```"
        )
    if zh_idx is None:
        parts.extend(rest)
    else:
        parts.extend(rest[:zh_idx])
        if not any("中文翻译" in paragraph for paragraph in rest):
            parts.append("**中文翻译**")
        parts.extend(rest[zh_idx:])
    return "\n\n".join(parts).strip() + "\n"


def main() -> None:
    fixed: list[int] = []
    needs_translation: list[int] = []
    unfixed: list[tuple[int, list[str]]] = []
    for path in sorted(DOCS_DIR.glob("Day_*.md")):
        day = int(path.stem.split("_")[1])
        original = path.read_text(encoding="utf-8")
        ok, issues = strict_validate(original)
        if ok:
            continue
        repaired = repair(original)
        ok2, issues2 = strict_validate(repaired)
        if ok2 and repaired != original:
            path.write_text(repaired, encoding="utf-8")
            fixed.append(day)
            print(f"fixed Day_{day:03d}")
        elif "NO_TRANSLATION" in issues:
            needs_translation.append(day)
            print(f"needs translation Day_{day:03d}")
        else:
            unfixed.append((day, issues2 or issues))
            print(f"unfixed Day_{day:03d}: {issues2 or issues}")
    print(f"fixed={fixed}")
    print(f"needs_translation={needs_translation}")
    print(f"unfixed={unfixed}")


if __name__ == "__main__":
    main()
