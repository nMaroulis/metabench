"""
Chatbot Arena scraper – fetches Elo ratings from LMSYS leaderboard CSVs on HuggingFace.
Source: https://huggingface.co/spaces/lmarena-ai/chatbot-arena-leaderboard
"""

import csv
import io
import httpx
from typing import Optional


HF_SPACE_API = "https://huggingface.co/api/spaces/lmarena-ai/chatbot-arena-leaderboard"
HF_CSV_BASE = (
    "https://huggingface.co/spaces/lmarena-ai/chatbot-arena-leaderboard/resolve/main"
)

# Map Arena model keys to our canonical names
ARENA_NAME_MAP = {
    "gpt-4o-2024-11-20": "GPT-4o",
    "gpt-4o-mini-2024-07-18": "GPT-4o Mini",
    "gpt-4.5-preview-2025-02-27": "GPT-4.5",
    "o1-2024-12-17": "o1",
    "o1-pro": "o1-pro",
    "o1-mini": "o1-mini",
    "o3-mini": "o3-mini",
    "o3-mini-high": "o3-mini-high",
    "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
    "claude-3-5-haiku-20241022": "Claude 3.5 Haiku",
    "claude-3-7-sonnet-20250219": "Claude 3.7 Sonnet",
    "claude-3-opus-20240229": "Claude 3 Opus",
    "gemini-2.0-flash-001": "Gemini 2.0 Flash",
    "gemini-2.0-pro-exp-02-05": "Gemini 2.0 Pro",
    "gemini-2.5-pro-exp-03-25": "Gemini 2.5 Pro",
    "gemini-2.5-flash-preview-04-17": "Gemini 2.5 Flash",
    "gemini-2.0-flash-lite": "Gemini 2.0 Flash Lite",
    "llama-3.1-405b-instruct": "Llama 3.1 405B",
    "llama-3.1-70b-instruct": "Llama 3.1 70B",
    "llama-3.3-70b-instruct": "Llama 3.3 70B",
    "llama-4-maverick": "Llama 4 Maverick",
    "llama-4-scout": "Llama 4 Scout",
    "mistral-large-2411": "Mistral Large 2",
    "mistral-small-2503": "Mistral Small 3",
    "deepseek-v3": "DeepSeek-V3",
    "deepseek-r1": "DeepSeek-R1",
    "qwen-2.5-72b-instruct": "Qwen 2.5 72B",
    "qwq-32b": "QwQ-32B",
    "grok-2-1212": "Grok-2",
    "grok-3": "Grok-3",
    "grok-3-mini": "Grok-3 Mini",
    "command-r-plus-08-2024": "Command R+",
    "amazon-nova-pro-v1": "Amazon Nova Pro",
    "phi-4": "Phi-4",
    "nemotron-70b": "Nemotron 70B",
}


def get_latest_csv_filename() -> Optional[str]:
    """Find the latest leaderboard_table CSV from HuggingFace Space siblings."""
    try:
        response = httpx.get(HF_SPACE_API, timeout=15)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"[ChatbotArena] Error fetching space info: {e}")
        return None

    csv_files = [
        s["rfilename"]
        for s in data.get("siblings", [])
        if s["rfilename"].startswith("leaderboard_table_")
        and s["rfilename"].endswith(".csv")
    ]
    if not csv_files:
        return None
    csv_files.sort()
    return csv_files[-1]  # Latest


def fetch_arena_elo_ratings() -> dict[str, float]:
    """Fetch Elo ratings from the latest Chatbot Arena leaderboard CSV."""
    filename = get_latest_csv_filename()
    if not filename:
        print("[ChatbotArena] No CSV found")
        return {}

    url = f"{HF_CSV_BASE}/{filename}"
    print(f"[ChatbotArena] Fetching {filename}")

    try:
        response = httpx.get(url, timeout=30)
        response.raise_for_status()
    except Exception as e:
        print(f"[ChatbotArena] Error fetching CSV: {e}")
        return {}

    # Parse CSV
    reader = csv.DictReader(io.StringIO(response.text))
    results = {}

    for row in reader:
        key = row.get("key", "").strip()
        canonical_name = ARENA_NAME_MAP.get(key)
        if not canonical_name:
            continue

        # The CSV has different formats over time
        # Try to extract the Arena score/Elo
        elo = None
        for field in ["Arena Score", "rating", "MT-bench (score)"]:
            val = row.get(field, "").strip()
            if val and val != "-":
                try:
                    elo = float(val)
                    break
                except ValueError:
                    continue

        if elo is not None:
            results[canonical_name] = elo

    print(f"[ChatbotArena] Found Elo ratings for {len(results)} models")
    return results


def normalize_elo_to_100(elo_scores: dict[str, float]) -> dict[str, float]:
    """Normalize Elo ratings to 0-100 scale using min-max across top models."""
    if not elo_scores:
        return {}

    values = list(elo_scores.values())
    min_elo = min(values)
    max_elo = max(values)

    if max_elo == min_elo:
        return {k: 50.0 for k in elo_scores}

    return {
        name: round(((elo - min_elo) / (max_elo - min_elo)) * 100.0, 2)
        for name, elo in elo_scores.items()
    }


if __name__ == "__main__":
    elo = fetch_arena_elo_ratings()
    normalized = normalize_elo_to_100(elo)
    for name, score in sorted(normalized.items(), key=lambda x: -x[1]):
        print(f"  {name}: {elo[name]:.0f} Elo -> {score:.1f}/100")
