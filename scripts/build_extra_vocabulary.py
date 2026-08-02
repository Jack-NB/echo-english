#!/usr/bin/env python3
"""Collect every English word from the generated docs into an extra vocabulary.

Non-outline words get POS + Chinese meanings from ECDICT, and derived words
remember the original word they come from. Everything is marked inOutline=false.
"""

from __future__ import annotations

import csv
import json
import os
import re
import urllib.request
from pathlib import Path

NETEM_URL = (
    "https://raw.githubusercontent.com/exam-data/NETEMVocabulary/"
    "master/netem_full_list.json"
)
ECDICT_URL = "https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv"
ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "output"
OUT_FILE = ROOT / "src" / "data" / "vocabulary-extra.js"
EXTRA_ID_START = 60000

DERIVED_LINE = re.compile(
    r"^\s*[├└]──\s*\**([A-Za-z][A-Za-z'’-]*)\**\s*\(([^)]*)\)"
)
TOP_LINE = re.compile(r"^([A-Za-z][A-Za-z'-]*)\s*\([^)]*\)")
WORD_RE = re.compile(r"[A-Za-z][A-Za-z'’-]*")
POS_PREFIX = re.compile(
    r"^(a|ad|n|v|vt|vi|adj|adv|prep|conj|pron|num|art|int|aux|modal|abbr|pref|suf)\.\s*",
    re.IGNORECASE,
)
POS_RE = re.compile(
    r"^(a|ad|n|v|vt|vi|adj|adv|prep|conj|pron|num|art|int|aux|modal|abbr)\.",
    re.IGNORECASE,
)


def fetch_json(url: str):
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_main_words() -> set[str]:
    payload = fetch_json(NETEM_URL)
    rows = next(iter(payload.values())) if isinstance(payload, dict) else payload
    return {str(row.get("单词", "")).lower() for row in rows if row.get("单词")}


def ensure_ecdict() -> Path:
    target = Path(os.environ.get("TEMP", ROOT)) / "ecdict.csv"
    if not target.exists():
        request = urllib.request.Request(ECDICT_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(request, timeout=600) as response:
            target.write_bytes(response.read())
    return target


def load_ecdict(path: Path) -> dict[str, dict]:
    lookup: dict[str, dict] = {}
    with open(path, encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            word = (row.get("word") or "").lower()
            if not word:
                continue
            lookup[word] = {
                "translation": row.get("translation") or "",
                "pos": row.get("pos") or "",
                "definition": row.get("definition") or "",
            }
    return lookup


def base_candidates(word: str):
    yield word
    if word.endswith("ies") and len(word) > 4:
        yield word[:-3] + "y"
    if word.endswith("ied") and len(word) > 4:
        yield word[:-3] + "y"
    if word.endswith("es") and len(word) > 3:
        yield word[:-2]
    if word.endswith("s") and not word.endswith("ss") and len(word) > 2:
        yield word[:-1]
    if word.endswith("ing") and len(word) > 5:
        stem = word[:-3]
        yield stem
        yield stem + "e"
    if word.endswith("ed") and len(word) > 4:
        stem = word[:-2]
        yield stem + "e"
        yield stem
    if word.endswith("er") and len(word) > 3:
        yield word[:-2]
        yield word[:-2] + "e"
    if word.endswith("est") and len(word) > 4:
        yield word[:-3]
        yield word[:-3] + "e"
    if word.endswith("ly") and len(word) > 4:
        yield word[:-2]


def lookup_word(word: str, ecdict: dict[str, dict]):
    direct = ecdict.get(word)
    if direct:
        return direct, None
    for candidate in base_candidates(word):
        if candidate == word:
            continue
        hit = ecdict.get(candidate)
        if hit:
            return hit, candidate
    return None, None


def split_meanings(translation: str, pos: str) -> list[dict]:
    parts = [p.strip() for p in re.split(r"[；;\n]", translation) if p.strip()]
    cleaned: list[str] = []
    for part in parts:
        stripped = POS_PREFIX.sub("", part)
        if stripped and stripped not in cleaned:
            cleaned.append(stripped)
    derived_pos = pos or (POS_RE.search(translation).group(1).lower() if POS_RE.search(translation) else "")
    if cleaned:
        return [
            {
                "type": derived_pos or (POS_RE.search(part).group(1).lower() if POS_RE.search(part) else "义"),
                "translation": part,
            }
            for part in cleaned
        ]
    if translation:
        return [{"type": derived_pos or "义", "translation": translation}]
    return []


def collect_doc_words() -> tuple[dict[str, dict], set[str]]:
    tree_words: dict[str, dict] = {}
    story_words: set[str] = set()
    for path in sorted(DOCS_DIR.glob("Day_*.md")):
        try:
            day = int(path.stem.split("_")[1])
        except (IndexError, ValueError):
            continue
        lines = path.read_text(encoding="utf-8").splitlines()
        trans_idx = next(
            (i for i, line in enumerate(lines) if "中文翻译" in line),
            len(lines),
        )
        in_fence = False
        current_root = None
        for line in lines[:trans_idx]:
            stripped = line.strip()
            if stripped.startswith("```"):
                in_fence = not in_fence
                continue
            if in_fence:
                match = DERIVED_LINE.match(line)
                if match:
                    word = match.group(1).lower()
                    tree_words.setdefault(
                        word,
                        {
                            "meaning": match.group(2).strip(),
                            "root": current_root,
                            "day": day,
                        },
                    )
                top = TOP_LINE.match(line)
                if top:
                    current_root = top.group(1).lower()
            else:
                story_words.update(
                    WORD_RE.findall(stripped.lower())
                )
    return tree_words, story_words


def js_safe(text: str) -> str:
    return text.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def main() -> None:
    main_words = fetch_main_words()
    ecdict = load_ecdict(ensure_ecdict())
    tree_words, story_words = collect_doc_words()
    all_words = sorted(story_words | set(tree_words))

    entries: list[dict] = []
    for word in all_words:
        if word in main_words:
            continue
        tree = tree_words.get(word)
        hit, base = lookup_word(word, ecdict)
        if not base and hit:
            for candidate in base_candidates(word):
                if candidate != word and ecdict.get(candidate):
                    base = candidate
                    break
        base_hit = ecdict.get(base) if base else None
        translation = hit["translation"] if hit else (tree["meaning"] if tree else "")
        if not translation and base_hit:
            translation = base_hit["translation"]
        pos = (hit["pos"] if hit and hit["pos"] else "") or (base_hit["pos"] if base_hit else "")
        if not pos:
            pos_match = POS_RE.search(translation or "")
            pos = pos_match.group(1).lower() if pos_match else ""
        meanings = split_meanings(translation, pos) if hit and hit["translation"] else []
        meaning = (
            "；".join(item["translation"] for item in meanings)
            or translation
            or (tree["meaning"] if tree else "")
            or (hit["definition"] if hit else "")
        )
        entries.append(
            {
                "id": EXTRA_ID_START + len(entries),
                "word": word,
                "phonetic": "",
                "meaning": meaning,
                "example": "",
                "exampleCn": "",
                "frequency": None,
                "category": "",
                "subcategory": "",
                "alternate": None,
                "meanings": meanings,
                "phrases": [],
                "inOutline": False,
                "sourceDay": tree["day"] if tree else None,
                "rootWord": tree["root"] if tree and tree["root"] else None,
                "baseWord": (
                    base
                    if base
                    and base != word
                    and base != (tree["root"] if tree else None)
                    else None
                ),
            }
        )

    body = js_safe(json.dumps(entries, ensure_ascii=False, indent=2))
    content = (
        "// Generated by scripts/build_extra_vocabulary.py from output/Day_*.md "
        "and ECDICT. Do not edit.\n"
        "const vocabulary = "
        + body
        + ";\n\nexport default vocabulary;\n"
    )
    OUT_FILE.write_text(content, encoding="utf-8")
    print(f"extra vocabulary: {len(entries)} words -> {OUT_FILE}")


if __name__ == "__main__":
    main()
