"""
Artificial Analysis client wrapper - fetches quality and performance metrics.
API: GET https://artificialanalysis.ai/api/v2/
Requires ARTIFICIAL_ANALYSIS_API_KEY in .env
"""

import os
from typing import Any

import requests
from dotenv import load_dotenv

load_dotenv()


class ArtificialAnalysisAPIClient:
    BASE_URL = "https://artificialanalysis.ai/api/v2"

    def __init__(self, timeout: int = 30):
        self.api_key = os.getenv("ARTIFICIAL_ANALYSIS_API_KEY")
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({"x-api-key": self.api_key, "Content-Type": "application/json"})

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

        Artificial Analysis Model Object Fields:
            Top-level fields
                id: Unique UUID identifying the model in the Artificial Analysis database.
                name: Human-readable model name (e.g., Qwen3 14B (Reasoning)).
                slug: URL-safe identifier for the model (used as a stable key in APIs).
                release_date: Official model release date in YYYY-MM-DD format.
                model_creator: Object describing the organization that created the model.
                evaluations: Object containing benchmark scores for the model across multiple evaluations.
                pricing: Object containing pricing information for API usage.
                median_output_tokens_per_second: Median generation speed measured in output tokens per second.
                median_time_to_first_token_seconds: Median latency between request and first token returned.
                median_time_to_first_answer_token: Median time until the first meaningful answer token appears.
            model_creator Object
                model_creator.id: Unique identifier of the model creator organization.
                model_creator.name: Organization name (e.g., Alibaba, OpenAI).
                model_creator.slug: URL-safe organization identifier.
            evaluations Object (Benchmarks)
                artificial_analysis_intelligence_index: Composite score representing overall model intelligence across multiple benchmarks.
                artificial_analysis_coding_index: Composite score measuring coding ability.
                artificial_analysis_math_index: Composite score measuring math reasoning ability.
                mmlu_pro: Score on MMLU-Pro, a harder version of the Massive Multitask Language Understanding benchmark.
                gpqa: Score on GPQA (Graduate-Level Google-Proof Q&A) benchmark measuring advanced reasoning.
                hle: Score on Humanity's Last Exam, an extremely difficult reasoning benchmark.
                livecodebench	Score on LiveCodeBench, measuring real-world coding performance.
                scicode	Score on SciCode, evaluating scientific programming tasks.
                math_500	Score on MATH-500, a benchmark of challenging mathematical problems.
                aime	Score on AIME (American Invitational Mathematics Examination) problems.
                aime_25	Score on AIME 2025 benchmark variant.
                ifbench	Score on Instruction Following Benchmark evaluating adherence to instructions.
                lcr	Score on Long Context Reasoning benchmark measuring reasoning with large context windows.
                terminalbench_hard	Score on TerminalBench Hard, measuring autonomous coding/terminal tasks.
                tau2	Score on TAU-Bench v2, evaluating agentic tool-use tasks.
                - Values are usually 0-1 normalized accuracy scores (except composite indexes which can exceed 100).
            pricing Object
                price_1m_input_tokens: Cost in USD for 1 million input tokens.
                price_1m_output_tokens: Cost in USD for 1 million output tokens.
                price_1m_blended_3_to_1: Estimated blended cost assuming a 3:1 input-to-output token ratio.
            Performance Metrics
                median_output_tokens_per_second: Median generation throughput across providers.
                median_time_to_first_token_seconds: Median latency to the first token.
                median_time_to_first_answer_token: Median latency until the first meaningful answer token.
        """  # noqa: E501
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
