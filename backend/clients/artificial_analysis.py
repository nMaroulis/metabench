"""
Artificial Analysis client wrapper - fetches quality and performance metrics.
API: GET https://artificialanalysis.ai/api/v2/
Requires ARTIFICIAL_ANALYSIS_API_KEY in .env
"""

import os
from dotenv import load_dotenv
import requests
from typing import Any

load_dotenv()


class ArtificialAnalysisAPIClient:
    BASE_URL = "https://artificialanalysis.ai/api/v2"

    def __init__(self, timeout: int = 30):
        self.api_key = os.getenv("ARTIFICIAL_ANALYSIS_API_KEY")
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update(
            {"x-api-key": self.api_key, "Content-Type": "application/json"}
        )

    def _get(self, endpoint: str) -> dict[str, Any]:
        url = f"{self.BASE_URL}{endpoint}"
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        return response.json()

    # -----------------------------
    # Models
    # -----------------------------

    def get_models(self) -> list[dict[str, Any]]:
        """
        Returns all models available in Artificial Analysis.
        """
        data = self._get("/data/llms/models")
        return data.get("data", [])

    def get_model_by_slug(self, slug: str) -> dict[str, Any] | None:
        """
        Returns a specific model by slug.
        """
        models = self.get_models()

        for model in models:
            if model.get("slug") == slug:
                return model

        return None

    # -----------------------------
    # Benchmark Scores
    # -----------------------------

    def get_model_evaluations(self, slug: str) -> dict[str, Any] | None:
        """
        Returns evaluation benchmarks for a model.
        """
        model = self.get_model_by_slug(slug)

        if not model:
            return None

        return model.get("evaluations", {})

    def get_model_benchmark(self, slug: str, benchmark_name: str) -> float | None:
        """
        Returns a specific benchmark score.
        """
        evaluations = self.get_model_evaluations(slug)

        if not evaluations:
            return None

        return evaluations.get(benchmark_name)

    # -----------------------------
    # Convenience Utilities
    # -----------------------------

    def list_model_slugs(self) -> list[str]:
        """
        Returns all model slugs.
        """
        return [m["slug"] for m in self.get_models()]

    def get_frontier_models(self) -> list[dict[str, Any]]:
        """
        Filters models to only frontier families.
        """
        frontier_keywords = [
            "gpt",
            "claude",
            "gemini",
            "llama",
            "mistral",
            "mixtral",
            "qwen",
            "gemma",
            "deepseek",
        ]

        models = self.get_models()

        frontier = []
        for model in models:
            name = model.get("name", "").lower()
            if any(k in name for k in frontier_keywords):
                frontier.append(model)

        return frontier
