"""
Scraper modules for fetching benchmark data from various sources.
Each scraper should implement a `fetch()` function that returns a list of
score dictionaries compatible with the BenchmarkScore model.

Supported sources (to be implemented):
- HuggingFace Open LLM Leaderboard
- MMLU / MMLU-Pro
- GSM8K / MATH
- HumanEval / MBPP
- BigBench-Hard
- TypeThink
- Vellum
- Community submissions
"""
