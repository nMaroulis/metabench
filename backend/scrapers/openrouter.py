"""
OpenRouter scraper - fetches live pricing and model metadata.
API: GET https://openrouter.ai/api/v1/models (no auth required)
"""

import httpx

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/models"

# Map OpenRouter model IDs to our canonical model names
MODEL_ID_MAP = {
    "openai/gpt-4o": "GPT-4o",
    "openai/gpt-4o-2024-11-20": "GPT-4o",
    "openai/gpt-4o-mini": "GPT-4o Mini",
    "openai/gpt-4o-mini-2024-07-18": "GPT-4o Mini",
    "openai/gpt-4.5-preview": "GPT-4.5",
    "openai/o1": "o1",
    "openai/o1-mini": "o1-mini",
    "openai/o1-pro": "o1-pro",
    "openai/o3-mini": "o3-mini",
    "openai/o3-mini-high": "o3-mini-high",
    "anthropic/claude-3.5-sonnet": "Claude 3.5 Sonnet",
    "anthropic/claude-3.5-sonnet:beta": "Claude 3.5 Sonnet",
    "anthropic/claude-3.5-haiku": "Claude 3.5 Haiku",
    "anthropic/claude-3.7-sonnet": "Claude 3.7 Sonnet",
    "anthropic/claude-3-opus": "Claude 3 Opus",
    "google/gemini-2.0-flash-001": "Gemini 2.0 Flash",
    "google/gemini-2.0-flash-lite-001": "Gemini 2.0 Flash Lite",
    "google/gemini-2.5-pro-preview": "Gemini 2.5 Pro",
    "google/gemini-2.0-pro-exp-02-05": "Gemini 2.0 Pro",
    "google/gemini-2.5-flash-preview": "Gemini 2.5 Flash",
    "meta-llama/llama-3.1-405b-instruct": "Llama 3.1 405B",
    "meta-llama/llama-3.1-70b-instruct": "Llama 3.1 70B",
    "meta-llama/llama-3.3-70b-instruct": "Llama 3.3 70B",
    "meta-llama/llama-4-maverick": "Llama 4 Maverick",
    "meta-llama/llama-4-scout": "Llama 4 Scout",
    "mistralai/mistral-large-2411": "Mistral Large 2",
    "mistralai/mistral-small-2503": "Mistral Small 3",
    "deepseek/deepseek-chat": "DeepSeek-V3",
    "deepseek/deepseek-r1": "DeepSeek-R1",
    "qwen/qwen-2.5-72b-instruct": "Qwen 2.5 72B",
    "qwen/qwen-2.5-coder-32b-instruct": "Qwen 2.5 Coder 32B",
    "qwen/qwq-32b": "QwQ-32B",
    "x-ai/grok-2-1212": "Grok-2",
    "x-ai/grok-3": "Grok-3",
    "x-ai/grok-3-mini": "Grok-3 Mini",
    "cohere/command-r-plus": "Command R+",
    "cohere/command-r-plus-08-2024": "Command R+",
    "amazon/nova-pro-v1": "Amazon Nova Pro",
    "amazon/nova-lite-v1": "Amazon Nova Lite",
    "nvidia/llama-3.1-nemotron-70b-instruct": "Nemotron 70B",
    "microsoft/phi-4": "Phi-4",
    "perplexity/sonar-pro": "Sonar Pro",
    "perplexity/sonar": "Sonar",
}


def fetch_openrouter_models() -> list[dict]:
    """Fetch all models from OpenRouter API and return pricing data."""
    try:
        response = httpx.get(OPENROUTER_API_URL, timeout=30)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"[OpenRouter] Error fetching models: {e}")
        return []

    results = []
    seen_names = set()

    for model in data.get("data", []):
        model_id = model.get("id", "")
        canonical_name = MODEL_ID_MAP.get(model_id)

        if not canonical_name or canonical_name in seen_names:
            continue
        seen_names.add(canonical_name)

        pricing = model.get("pricing", {})
        prompt_cost = pricing.get("prompt", "0")
        completion_cost = pricing.get("completion", "0")

        # Convert from per-token to per-1M-tokens
        try:
            cost_input = float(prompt_cost) * 1_000_000
            cost_output = float(completion_cost) * 1_000_000
        except (ValueError, TypeError):
            cost_input = None
            cost_output = None

        context_length = model.get("context_length")
        arch = model.get("architecture", {})  # noqa: F841

        results.append(
            {
                "canonical_name": canonical_name,
                "openrouter_id": model_id,
                "cost_per_1m_input_tokens": round(cost_input, 4) if cost_input else None,
                "cost_per_1m_output_tokens": round(cost_output, 4) if cost_output else None,
                "context_window": context_length,
                "description": model.get("description", "")[:300],
            }
        )

    print(f"[OpenRouter] Fetched pricing for {len(results)} models")
    return results


def get_pricing_map() -> dict[str, dict]:
    """Return a dict mapping canonical model name -> pricing info."""
    models = fetch_openrouter_models()
    return {m["canonical_name"]: m for m in models}


if __name__ == "__main__":
    pricing = get_pricing_map()
    for name, info in sorted(pricing.items()):
        print(
            f"  {name}: input=${info['cost_per_1m_input_tokens']}/1M, "
            f"output=${info['cost_per_1m_output_tokens']}/1M, "
            f"ctx={info['context_window']}"
        )
