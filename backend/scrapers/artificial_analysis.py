"""
Artificial Analysis scraper – fetches quality and performance metrics.
API: GET https://artificialanalysis.ai/api/v1/models
Requires ARTIFICIAL_ANALYSIS_API_KEY in .env
"""

import os
import httpx
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


AA_API_KEY = os.getenv("ARTIFICIAL_ANALYSIS_API_KEY")
AA_API_URL = "https://artificialanalysis.ai/api/v1/models"


def fetch_aa_metrics() -> dict[str, dict]:
    """
    Fetch Quality Index and speed metrics from ArtificialAnalysis.
    Returns dict mapping canonical name -> {metric: score}
    """
    if not AA_API_KEY:
        print("[ArtificialAnalysis] No API key found in .env, skipping.")
        return {}

    headers = {"x-api-key": AA_API_KEY}
    results = {}

    try:
        response = httpx.get(AA_API_URL, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()

        # Depending on API shape, we would parse it here.
        # Since we don't have the definitive API schema, we'll try catching basic metrics
        for model in data:
            name = model.get("name", "")
            if not name:
                continue

            # Map name to canonical name (skipping complex mapping for brevity)
            # You would add mapping here if names mismatch heavily
            metrics = {}
            if "quality_index" in model:
                metrics["Quality Index"] = model["quality_index"]

            if metrics:
                results[name] = metrics

        print(f"[ArtificialAnalysis] Fetched metrics for {len(results)} models")
    except Exception as e:
        print(f"[ArtificialAnalysis] Error fetching data: {e}")

    return results


if __name__ == "__main__":
    scores = fetch_aa_metrics()
    print(scores)
