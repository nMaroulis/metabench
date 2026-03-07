"""Unit tests for BenchIndex normalization and scoring logic."""

import sys
import os

# Add parent dir to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from normalization import (
    normalize_score,
    compute_weighted_overall_score,
    DEFAULT_WEIGHTS,
)


class TestNormalizeScore:
    def test_basic_normalization(self):
        assert normalize_score(50.0, 100.0) == 50.0

    def test_full_score(self):
        assert normalize_score(100.0, 100.0) == 100.0

    def test_zero_score(self):
        assert normalize_score(0.0, 100.0) == 0.0

    def test_above_max_clamped(self):
        assert normalize_score(120.0, 100.0) == 100.0

    def test_below_min_clamped(self):
        assert normalize_score(-10.0, 100.0) == 0.0

    def test_custom_range(self):
        result = normalize_score(75.0, 100.0, 50.0)
        assert result == 50.0

    def test_equal_min_max(self):
        assert normalize_score(50.0, 50.0, 50.0) == 0.0

    def test_decimal_precision(self):
        result = normalize_score(33.33, 100.0)
        assert result == 33.33

    def test_small_range(self):
        result = normalize_score(0.85, 1.0, 0.0)
        assert result == 85.0


class TestComputeWeightedOverallScore:
    def test_empty_scores(self):
        overall, confidence = compute_weighted_overall_score([])
        assert overall == 0.0
        assert confidence == 0.0

    def test_single_score(self):
        scores = [{"benchmark_name": "MMLU", "normalized_score": 80.0}]
        overall, confidence = compute_weighted_overall_score(scores)
        assert overall == 80.0
        assert confidence > 0.0

    def test_equal_weights(self):
        scores = [
            {"benchmark_name": "A", "normalized_score": 60.0},
            {"benchmark_name": "B", "normalized_score": 80.0},
        ]
        overall, _ = compute_weighted_overall_score(scores)
        assert overall == 70.0

    def test_custom_weights(self):
        scores = [
            {"benchmark_name": "A", "normalized_score": 60.0},
            {"benchmark_name": "B", "normalized_score": 80.0},
        ]
        weights = {"A": 2.0, "B": 1.0}
        overall, _ = compute_weighted_overall_score(scores, weights)
        assert abs(overall - 66.67) < 0.01

    def test_high_confidence_many_consistent_scores(self):
        scores = [
            {"benchmark_name": f"bench_{i}", "normalized_score": 80.0}
            for i in range(10)
        ]
        _, confidence = compute_weighted_overall_score(scores)
        assert confidence >= 90.0

    def test_low_confidence_few_scores(self):
        scores = [{"benchmark_name": "A", "normalized_score": 80.0}]
        _, confidence = compute_weighted_overall_score(scores)
        assert confidence < 50.0

    def test_low_confidence_high_variance(self):
        scores = [
            {"benchmark_name": "A", "normalized_score": 10.0},
            {"benchmark_name": "B", "normalized_score": 90.0},
        ]
        _, confidence = compute_weighted_overall_score(scores)
        assert confidence < 30.0  # High variance should reduce confidence

    def test_default_weights_structure(self):
        assert isinstance(DEFAULT_WEIGHTS, dict)
        assert "MMLU" in DEFAULT_WEIGHTS
        assert "HumanEval" in DEFAULT_WEIGHTS
        assert all(isinstance(v, float) for v in DEFAULT_WEIGHTS.values())

    def test_with_default_weights(self):
        scores = [
            {"benchmark_name": "MMLU", "normalized_score": 88.7},
            {"benchmark_name": "HumanEval", "normalized_score": 90.2},
            {"benchmark_name": "GSM8K", "normalized_score": 95.8},
        ]
        overall, confidence = compute_weighted_overall_score(scores, DEFAULT_WEIGHTS)
        assert 85.0 < overall < 95.0
        assert confidence > 0.0


class TestIntegration:
    """Integration tests that verify normalization + scoring pipeline."""

    def test_full_pipeline(self):
        # Simulate normalizing raw scores and computing overall
        raw_scores = {
            "MMLU": (88.7, 100.0),
            "HumanEval": (90.2, 100.0),
            "GSM8K": (95.8, 100.0),
            "MATH": (76.6, 100.0),
        }

        normalized = []
        for name, (raw, max_s) in raw_scores.items():
            ns = normalize_score(raw, max_s)
            normalized.append({"benchmark_name": name, "normalized_score": ns})

        overall, confidence = compute_weighted_overall_score(
            normalized, DEFAULT_WEIGHTS
        )
        assert 80.0 < overall < 95.0
        assert confidence > 20.0
