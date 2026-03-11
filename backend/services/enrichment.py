import json
import os

from anthropic import Anthropic
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv()


class ModelMetadataEnrichment(BaseModel):
    parameters: str = Field(..., description="Estimated parameter count, e.g., '70B', '8x7B', 'Unknown'")
    architecture: str = Field(..., description="Model architecture, e.g., 'Dense Transformer', 'Sparse MoE', 'Unknown'")
    context_window: int = Field(..., description="Context window size in tokens, e.g., 128000. 0 if unknown.")
    license_type: str = Field(..., description="License type, e.g., 'Open Source', 'Proprietary', 'Unknown'")
    description: str = Field(..., description="A short (1-2 sentence) description of the model.")
    multimodal: bool = Field(..., description="Whether the model supports multimodal inputs (vision, audio, etc.)")
    training_data_estimate: str = Field(..., description="Estimated training data size, e.g., '15T tokens', 'Unknown'")
    release_date: str | None = Field(None, description="Release date in YYYY-MM-DD format if available.")


def enrich_model_metadata(model_name: str, provider: str) -> ModelMetadataEnrichment | None:
    """
    Uses an LLM to research and return structured metadata for a given model.
    Prioritizes Claude 3.5 Sonnet if available, otherwise falls back to GPT-4o.
    """
    prompt = f"""
    Research the following Large Language Model and provide structured technical metadata.
    Model Name: {model_name}
    Provider: {provider}

    Provide your BEST technical estimate for each field based on technical papers, blogs, and public benchmarks.
    If a value is truly speculative but widely accepted (e.g., GPT-4 architecture), provide the consensus estimate.

    The output MUST be a valid JSON object matching this structure:
    {{
        "parameters": "string (e.g., '1.8T', '70B', '8x7B')",
        "architecture": "string (e.g., 'Dense Transformer', 'Sparse MoE', 'Mixture-of-Experts')",
        "context_window": integer (context length in tokens, e.g. 128000),
        "license_type": "string ('Open Source' or 'Proprietary')",
        "description": "string (1-2 sentence brief technical summary)",
        "multimodal": boolean (true if it natively supports vision/audio/etc),
        "training_data_estimate": "string (e.g., '15T tokens')",
        "release_date": "string (YYYY-MM-DD if known, otherwise null)"
    }}
    """

    try:
        # Prioritize OpenAI for reliability in this environment
        if os.getenv("OPENAI_API_KEY"):
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a specialized technical researcher for Large Language Models. Provide your best technical estimates based on public knowledge. Return ONLY valid JSON.",  # noqa: E501
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content
        elif os.getenv("ANTHROPIC_API_KEY"):
            client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
            response = client.messages.create(
                model="claude-3-5-sonnet-latest", max_tokens=1000, messages=[{"role": "user", "content": prompt}]
            )
            content = response.content[0].text
        else:
            print("No API keys found for enrichment.")
            return None

        # Extract JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        data = json.loads(content)
        return ModelMetadataEnrichment.model_validate(data)

    except Exception as e:
        print(f"Error enriching model {model_name}: {e}")
        return None
