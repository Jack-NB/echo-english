#!/usr/bin/env python3
"""考研英语 AI 连锁记忆生成器。

按桌面 markdown.md 规格实现：自动下载词库，分批调用 DeepSeek API，
生成带词根派生树与连锁记忆短文的 Markdown 学习文档。
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import time
from datetime import datetime
from pathlib import Path

import requests
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()

DATA_SOURCES = {
    "netem": {
        "url": (
            "https://raw.githubusercontent.com/exam-data/NETEMVocabulary/"
            "master/netem_full_list.json"
        ),
        "word_key": "单词",
        "translation_key": "释义",
        "nested": True,
    },
    "kylebing": {
        "url": (
            "https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/"
            "词汇/考研英语.json"
        ),
        "word_key": "word",
        "translation_key": "translation",
        "nested": False,
    },
}

MODEL = "deepseek-chat"
TEMPERATURE = 0.8
MAX_TOKENS = 4000
MAX_RETRIES = 3
RETRY_INTERVAL_SECONDS = 5
BATCH_INTERVAL_SECONDS = 2
WEB_OUTPUT_DIR = Path(__file__).resolve().parent / "public" / "generated"


def build_prompt(words_batch: list[dict]) -> str:
    """Return the prompt template from the project spec, filled with one batch."""
    return f"""你是一位英语词源学专家和记忆大师。请为以下 {len(words_batch)} 个考研单词生成一份学习材料。

【单词数据】
{json.dumps(words_batch, ensure_ascii=False, indent=2)}

【输出要求（必须严格遵守）】

1. **派生词链**：对每个单词展示其词根拆解和派生词网络，格式如下：

```text
[单词] ([释义])
└── 词根: [词根] ([含义])
    ├── [派生词1] ([释义])
    ├── [派生词2] ([释义])
    └── [派生词3] ([释义])
```

*注意：如果该词没有明显派生词，请根据词根造一个合理的同根词或联想词。*

2. **连锁故事**：将所有单词按顺序融入一篇 300-500 字的连贯英文短文。要求：

- 故事要有画面感和逻辑性。
- 每个单词首次出现时，必须在括号中标注中文释义。
- 文中的派生词必须使用**加粗**（Markdown 的 `**` 符号）。

3. **中文翻译**：在英文故事下方，提供完整、流畅的中文翻译。

请直接输出内容，不要有任何多余的解释或开场白。"""


def fetch_vocabulary(source: str, limit: int) -> list[dict]:
    """Download and normalize the word list as [{"word", "translation"}]."""
    config = DATA_SOURCES[source]
    response = requests.get(config["url"], timeout=60)
    response.raise_for_status()
    payload = response.json()
    rows = next(iter(payload.values())) if config["nested"] else payload
    words = [
        {
            "word": str(row[config["word_key"]]).strip(),
            "translation": str(row[config["translation_key"]]).strip(),
        }
        for row in rows
        if row.get(config["word_key"]) and row.get(config["translation_key"])
    ]
    return words[:limit]


def chunk_list(items: list, size: int):
    for index in range(0, len(items), size):
        yield items[index : index + size]


def call_deepseek(client, prompt: str) -> str:
    """Call the model with retries: max 3 attempts, 5 seconds apart."""
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=TEMPERATURE,
                max_tokens=MAX_TOKENS,
            )
            return response.choices[0].message.content.strip()
        except Exception as exc:  # noqa: BLE001 - retry any transient API error
            last_error = exc
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_INTERVAL_SECONDS)
    raise RuntimeError(f"API 调用失败（已重试 {MAX_RETRIES} 次）: {last_error}")


def generate_day(client, batch: list[dict], day: int, output_dir: Path) -> Path:
    prompt = build_prompt(batch)
    content = call_deepseek(client, prompt)
    header = (
        f"# Day {day:03d}\n\n"
        f"> 生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    )
    target = output_dir / f"Day_{day:03d}.md"
    target.write_text(header + content + "\n", encoding="utf-8")
    return target


def sync_web_output(output_dir: Path) -> None:
    """Keep public/generated in sync so the web app can browse generated docs."""
    WEB_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    days = []
    for source in sorted(output_dir.glob("Day_*.md")):
        try:
            day = int(source.stem.split("_")[1])
        except (IndexError, ValueError):
            continue
        shutil.copyfile(source, WEB_OUTPUT_DIR / source.name)
        days.append({"day": day, "file": source.name})
    (WEB_OUTPUT_DIR / "manifest.json").write_text(
        json.dumps({"total": len(days), "days": days}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="考研英语 AI 连锁记忆生成器")
    parser.add_argument(
        "--source",
        choices=list(DATA_SOURCES),
        default="netem",
        help="词库数据源（默认 netem: exam-data/NETEMVocabulary）",
    )
    args = parser.parse_args()

    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise SystemExit(
            "未找到 DEEPSEEK_API_KEY，请先复制 .env.example 为 .env 并填写密钥。"
        )

    try:
        from openai import OpenAI
    except ImportError as exc:
        raise SystemExit("缺少 openai 依赖，请先执行: pip install -r requirements.txt") from exc

    client = OpenAI(api_key=api_key, base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"))

    print(f"正在从 {DATA_SOURCES[args.source]['url']} 下载词库...")
    words = fetch_vocabulary(args.source, limit=5500)
    batches = list(chunk_list(words, size=20))
    print(f"共 {len(words)} 个单词，分成 {len(batches)} 批")

    output_dir = Path(__file__).resolve().parent / "output"
    output_dir.mkdir(exist_ok=True)

    for index, batch in enumerate(tqdm(batches, desc="生成 Day"), start=1):
        target = output_dir / f"Day_{index:03d}.md"
        if target.exists():
            tqdm.write(f"跳过已生成的 {target.name}")
            continue
        generate_day(client, batch, day=index, output_dir=output_dir)
        sync_web_output(output_dir)
        time.sleep(BATCH_INTERVAL_SECONDS)

    sync_web_output(output_dir)
    print(f"完成，文件已写入 {output_dir}")


if __name__ == "__main__":
    main()
