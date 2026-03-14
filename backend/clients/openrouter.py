from datetime import UTC, datetime
from typing import Any

import requests


def fetch_openrouter_models(api_key: str) -> list[dict[str, Any]]:
    """
    Fetches all models from OpenRouter and returns a list of dicts with full metadata.

    Each dict contains all fields seen in OpenRouter responses, with "N/A" for missing values:

    Fields:
    - id: OpenRouter model ID (string)
    - canonical_slug: Canonical slug for the model (string)
    - hugging_face_id: Corresponding HuggingFace model ID if available (string)
    - name: Full model name (string)
    - created: Unix timestamp when the model was added (int, converted to YYYY-MM-DD)
    - description: Model description (string)
    - context_length: Maximum context length in tokens (int)
    - architecture: dict containing:
        - modality: Modality string, e.g., "text+image->text"
        - input_modalities: List of input modalities
        - output_modalities: List of output modalities
        - tokenizer: Tokenizer name
        - instruct_type: Optional instruction type
    - pricing: dict containing:
        - prompt: Price per prompt token
        - completion: Price per completion token
        - web_search: Price per web search call
        - input_cache_read: Price per cache read
        - image: Price per image (if available)
        - request: Price per request (if available)
        - internal_reasoning: Price per internal reasoning call (if available)
    - top_provider: dict containing:
        - context_length: Max context length for provider
        - max_completion_tokens: Maximum completion tokens
        - is_moderated: Boolean if model is moderated
    - per_request_limits: dict or N/A
    - supported_parameters: List of supported parameters
    - default_parameters: dict with default parameter values
    - expiration_date: Expiration date or None

    Returns:
        List of dicts with normalized model data.
    """

    url = "https://openrouter.ai/api/v1/models"

    # headers = {"Authorization": f"Bearer {api_key}"}

    response = requests.get(url)
    response.raise_for_status()
    data = response.json().get("data", [])

    normalized = []
    for model in data:
        normalized.append(
            {
                "id": model.get("id", "N/A"),
                "canonical_slug": model.get("canonical_slug", "N/A"),
                "hugging_face_id": model.get("hugging_face_id") or "N/A",
                "name": model.get("name", "N/A"),
                "created": datetime.fromtimestamp(model.get("created", 0), tz=UTC).strftime("%Y-%m-%d")
                if model.get("created")
                else "N/A",
                "description": model.get("description", "N/A"),
                "context_length": model.get("context_length", "N/A"),
                "architecture": {
                    "modality": model.get("architecture", {}).get("modality", "N/A"),
                    "input_modalities": model.get("architecture", {}).get("input_modalities", "N/A"),
                    "output_modalities": model.get("architecture", {}).get("output_modalities", "N/A"),
                    "tokenizer": model.get("architecture", {}).get("tokenizer", "N/A"),
                    "instruct_type": model.get("architecture", {}).get("instruct_type") or "N/A",
                },
                "pricing": {
                    "prompt": model.get("pricing", {}).get("prompt", "N/A"),
                    "completion": model.get("pricing", {}).get("completion", "N/A"),
                    "web_search": model.get("pricing", {}).get("web_search", "N/A"),
                    "input_cache_read": model.get("pricing", {}).get("input_cache_read", "N/A"),
                    "image": model.get("pricing", {}).get("image", "N/A"),
                    "request": model.get("pricing", {}).get("request", "N/A"),
                    "internal_reasoning": model.get("pricing", {}).get("internal_reasoning", "N/A"),
                },
                "top_provider": {
                    "context_length": model.get("top_provider", {}).get("context_length", "N/A"),
                    "max_completion_tokens": model.get("top_provider", {}).get("max_completion_tokens", "N/A"),
                    "is_moderated": model.get("top_provider", {}).get("is_moderated", "N/A"),
                },
                "per_request_limits": model.get("per_request_limits", "N/A"),
                "supported_parameters": model.get("supported_parameters", "N/A"),
                "default_parameters": model.get("default_parameters", "N/A"),
                "expiration_date": model.get("expiration_date", "N/A"),
            }
        )

    return normalized
