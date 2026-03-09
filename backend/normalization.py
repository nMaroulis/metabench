"""
Score normalization utilities for MetaBench.
Normalizes raw benchmark scores to a 0-100 scale and computes
weighted Overall Intelligence Scores with confidence intervals.
"""

import math


def normalize_score(
    raw_score: float, max_score: float, min_score: float = 0.0
) -> float:
    """Normalize a raw score to 0-100 scale using min-max normalization."""
    if max_score == min_score:
        return 0.0
    normalized = ((raw_score - min_score) / (max_score - min_score)) * 100.0
    return round(max(0.0, min(100.0, normalized)), 2)


def compute_weighted_overall_score(
    scores: list[dict],
    weights: dict[str, float] | None = None,
) -> tuple[float, float]:
    """
    Compute weighted overall score and confidence from a list of benchmark scores.

    Args:
        scores: List of dicts with keys: 'benchmark_name', 'normalized_score'
        weights: Optional dict mapping benchmark_name -> weight. Defaults to equal weights.

    Returns:
        Tuple of (overall_score, confidence) both in 0-100 range.
        Confidence is based on number of benchmarks and score variance.
    """
    if not scores:
        return 0.0, 0.0

    if weights is None:
        weights = {s["benchmark_name"]: 1.0 for s in scores}

    total_weight = 0.0
    weighted_sum = 0.0
    score_values = []

    for s in scores:
        name = s["benchmark_name"]
        w = weights.get(name, 1.0)
        ns = s["normalized_score"]
        weighted_sum += ns * w
        total_weight += w
        score_values.append(ns)

    if total_weight == 0:
        return 0.0, 0.0

    overall = round(weighted_sum / total_weight, 2)

    # Confidence: based on coverage (number of benchmarks) and consistency (low variance)
    n = len(score_values)
    coverage_factor = min(n / 10.0, 1.0)  # Full confidence at 10+ benchmarks

    if n > 1:
        mean = sum(score_values) / n
        variance = sum((v - mean) ** 2 for v in score_values) / (n - 1)
        std_dev = math.sqrt(variance)
        consistency_factor = max(0.0, 1.0 - (std_dev / 50.0))  # Penalize high variance
    else:
        consistency_factor = 0.5

    confidence = round(coverage_factor * consistency_factor * 100, 2)

    return overall, confidence


# Default benchmark weights (higher = more important for overall score)
DEFAULT_WEIGHTS = {
    "MMLU": 1.2,
    "MMLU-Pro": 1.3,
    "GPQA Diamond": 1.3,
    "GSM8K": 1.0,
    "MATH-500": 1.2,
    "HumanEval": 1.2,
    "LiveCodeBench": 1.1,
    "BigBench-Hard": 1.1,
    "ARC-Challenge": 0.9,
    "IFEval": 1.0,
    "Arena Elo": 1.5,
    "LiveBench": 1.2,
    "EQBench": 0.8,
}
