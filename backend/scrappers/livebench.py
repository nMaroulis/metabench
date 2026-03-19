"""
Livebench Scraper Module.

Fetches and caches LiveBench model scores from an external CSV file.
"""

import csv
import json
import os
import re
import time
from io import StringIO

import requests
from dotenv import load_dotenv

load_dotenv()

_LIVEBENCH_CSV_URL = os.getenv("LIVEBENCH_CSV_URL", "https://livebench.ai/table_2026_01_08.csv")


class LivebenchScraper:
    """
    A scraper utility for fetching and caching large language model benchmark
    scores from the LiveBench CSV data source.

    Attributes:
        cache_file (str): The local file path to store the cached JSON data.
        cache_duration (int): The duration in seconds the cache remains valid.
    """

    def __init__(self, cache_file: str = "/tmp/livebench_cache.json", cache_duration: int = 172800) -> None:
        """
        Initializes the LivebenchScraper.

        Args:
            cache_file: File path for caching the fetched scores. Defaults to '/tmp/livebench_cache.json'.
            cache_duration: Cache validity duration in seconds. Defaults to 172800 (2 days).
        """
        self.cache_file: str = cache_file
        self.cache_duration: int = cache_duration
        self._scores: dict[str, float | None] | None = None

    @staticmethod
    def normalize(name: str) -> str:
        """
        Normalizes a model name by downcasing and removing non-alphanumeric characters.

        Args:
            name: The original model name string.

        Returns:
            The normalized model name string.
        """
        return re.sub(r"[^a-z0-9]", "", name.lower())

    def fetch_livebench_scores(self) -> dict[str, float | None]:
        """
        Fetches livebench scores from the CSV. Returns cached data if available
        and unexpired. Otherwise, fetches fresh data, updates the local cache,
        and returns the results.

        Returns:
            A dictionary mapping normalized model names to their benchmark scores string.
        """
        if os.path.exists(self.cache_file):
            if time.time() - os.path.getmtime(self.cache_file) < self.cache_duration:
                try:
                    with open(self.cache_file) as f:
                        return json.load(f)
                except json.JSONDecodeError:
                    pass

        response = requests.get(_LIVEBENCH_CSV_URL)
        response.raise_for_status()

        csv_text = response.text
        reader = csv.DictReader(StringIO(csv_text))

        scores: dict[str, float | None] = {}

        for row in reader:
            model = row.get("model") or row.get("Model")
            score = row.get("norm_score") or row.get("NormScore") or row.get("score")

            if model:
                scores[self.normalize(model)] = float(score) if score else None

        try:
            with open(self.cache_file, "w") as f:
                json.dump(scores, f)
        except OSError:
            pass

        return scores

    def get_scores(self) -> dict[str, float | None]:
        """
        Retrieves LiveBench scores while maintaining an internal memory cache
        upon the first invocation to avoid redundant I/O operations.

        Returns:
            A dictionary of all available cached LiveBench scores.
        """
        if self._scores is None:
            self._scores = self.fetch_livebench_scores()
        return self._scores

    def _map_model_to_livebench_model_name(self, model_name: str) -> float | None:
        """
        Internal helper mapping a specific normalized model name to its score.

        Args:
            model_name: The name of the model to look up.

        Returns:
            The numeric score if found, or None.
        """
        scores = self.get_scores()

        return scores.get(self.normalize(model_name), None)

    def get_score_for_model(self, model_name: str) -> float | None:
        """
        Fetches the benchmark score for a given model name.

        Args:
            model_name: The name of the model to search for.

        Returns:
            The corresponding benchmark score float, or None if the model is not found.
        """
        return self._map_model_to_livebench_model_name(model_name)
