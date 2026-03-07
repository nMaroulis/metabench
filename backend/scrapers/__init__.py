"""
Scraper modules for fetching benchmark data from various sources.

Implemented scrapers:
- openrouter.py: Live pricing from OpenRouter API (no auth)
- chatbot_arena.py: Elo ratings from LMSYS Chatbot Arena CSVs on HuggingFace
- huggingface_llb.py: HuggingFace Open LLM Leaderboard v2 scores
- livebench.py: LiveBench scores from GitHub CSVs

Usage:
    from scrapers.openrouter import get_pricing_map
    from scrapers.chatbot_arena import fetch_arena_elo_ratings
    from scrapers.huggingface_llb import fetch_hf_leaderboard_scores
    from scrapers.livebench import fetch_livebench_scores
"""
