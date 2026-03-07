"""
LiveBench scraper – fetches benchmark scores from LiveBench GitHub CSV data.
Source: https://github.com/LiveBench/LiveBench
Categories: Math, Coding, Reasoning, Data Analysis, Language, Instruction Following
"""

import csv
import io
import httpx
from typing import Optional


LIVEBENCH_CSV_URLS = [
    "https://raw.githubusercontent.com/LiveBench/LiveBench/refs/heads/main/docs/all_groups.csv",
]

# Map LiveBench model identifiers to canonical names
LIVEBENCH_NAME_MAP = {
    "gpt-4o-2024-11-20": "GPT-4o",
    "gpt-4o-mini-2024-07-18": "GPT-4o Mini",
    "o1-2024-12-17": "o1",
    "o1-mini-2024-09-12": "o1-mini",
    "o3-mini-2025-01-31": "o3-mini",
    "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
    "claude-3-5-haiku-20241022": "Claude 3.5 Haiku",
    "claude-3-opus-20240229": "Claude 3 Opus",
    "gemini-2.0-flash": "Gemini 2.0 Flash",
    "gemini-2.0-pro": "Gemini 2.0 Pro",
    "gemini-1.5-pro": "Gemini 1.5 Pro",
    "Meta-Llama-3.1-405B-Instruct-Turbo": "Llama 3.1 405B",
    "Meta-Llama-3.1-70B-Instruct-Turbo": "Llama 3.1 70B",
    "Meta-Llama-3.3-70B-Instruct-Turbo": "Llama 3.3 70B",
    "deepseek-chat": "DeepSeek-V3",
    "deepseek-reasoner": "DeepSeek-R1",
    "Qwen2.5-72B-Instruct": "Qwen 2.5 72B",
    "QwQ-32B-Preview": "QwQ-32B",
    "mistral-large-2411": "Mistral Large 2",
    "grok-2-1212": "Grok-2",
    "command-r-plus-08-2024": "Command R+",
}


def fetch_livebench_scores() -> dict[str, dict]:
    """
    Fetch LiveBench scores from GitHub CSV.
    Returns dict mapping canonical name -> {category: score}
    """
    results = {}

    for url in LIVEBENCH_CSV_URLS:
        try:
            response = httpx.get(url, timeout=15, follow_redirects=True)
            if response.status_code != 200:
                print(f"[LiveBench] Failed to fetch {url}: {response.status_code}")
                continue

            reader = csv.DictReader(io.StringIO(response.text))
            for row in reader:
                model_name = row.get("model", "").strip()
                canonical = LIVEBENCH_NAME_MAP.get(model_name, model_name)

                scores = {}
                for field in reader.fieldnames:
                    if field == "model":
                        continue
                    val = row.get(field, "").strip()
                    if val and val != "-":
                        try:
                            scores[field] = float(val)
                        except ValueError:
                            continue

                if scores:
                    results[canonical] = scores
        except Exception as e:
            print(f"[LiveBench] Error fetching {url}: {e}")

    print(f"[LiveBench] Loaded scores for {len(results)} models")
    return results


if __name__ == "__main__":
    scores = fetch_livebench_scores()
    for name, benchmarks in sorted(scores.items()):
        avg = sum(benchmarks.values()) / max(len(benchmarks), 1)
        print(f"  {name}: avg={avg:.1f}")
