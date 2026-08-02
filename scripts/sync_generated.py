#!/usr/bin/env python3
"""Copy generated Day_*.md files into public/generated and refresh the manifest."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "output"
DST = ROOT / "public" / "generated"


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    days = []
    for source in sorted(SRC.glob("Day_*.md")):
        try:
            day = int(source.stem.split("_")[1])
        except (IndexError, ValueError):
            continue
        target = DST / source.name
        shutil.copyfile(source, target)
        days.append({"day": day, "file": source.name})
    manifest = {"total": len(days), "days": days}
    (DST / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"synced {len(days)} days -> {DST}")


if __name__ == "__main__":
    main()
