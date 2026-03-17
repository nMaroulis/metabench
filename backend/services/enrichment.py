import json
import os

from clients.llms import AnthropicClient, OpenAIClient
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from utils.logger import get_logger

logger = get_logger("LLM enrichment")

load_dotenv()


class ModelMetadataEnrichment(BaseModel):
    parameters: str = Field(..., description="Estimated parameter count, e.g., '70B', '8x7B', 'N/A'")
    architecture: str = Field(..., description="Model architecture, e.g., 'Dense Transformer', 'Sparse MoE', 'N/A'")
    context_window: int = Field(..., description="Context window size in tokens, e.g., 128000. 0 if N/A.")
    license_type: str = Field(..., description="License type, e.g., 'Open Source', 'Proprietary', 'N/A'")
    description: str = Field(..., description="A short (1-2 sentence) description of model.")
    multimodal: bool = Field(..., description="Whether the model supports multimodal inputs (vision, audio, etc.)")
    training_data_estimate: str = Field(..., description="Estimated training data size, e.g., '15T tokens', 'N/A'")
    release_date: str | None = Field(None, description="Release date in YYYY-MM-DD format if available.")
    model_family: str = Field(..., description="Model family, e.g., 'GPT', 'LLaMA', 'Claude', 'Gemini', 'N/A'")
    attention_type: str = Field(
        ..., description="Attention mechanism, e.g., 'Multi-Head Attention', 'Grouped Query Attention', 'N/A'"
    )
    layers: str = Field(..., description="Number of transformer layers, e.g., '80', '126', 'N/A'")
    optimizer: str = Field(..., description="Training optimizer, e.g., 'AdamW', 'Adam', 'N/A'")
    quantization_formats: str = Field(
        ..., description="Supported quantization formats, e.g., 'GGUF, AWQ, GPTQ', 'Proprietary only', 'N/A'"
    )
    active_parameters_per_token: str = Field(..., description="Active parameters per token, e.g., '37B', 'N/A', 'N/A'")
    number_of_experts: str = Field(..., description="Number of experts, e.g., '16', '256', 'N/A', 'N/A'")
    parameter_density: str = Field(..., description="Parameter density, e.g., 'Dense', 'Sparse MoE', 'N/A'")
    hidden_size: str = Field(..., description="Hidden size (d_model), e.g., '8192', '16384', 'N/A'")
    ffn_intermediate_size: str = Field(..., description="FFN intermediate size, e.g., '32768', 'N/A'")
    number_of_attention_heads: str = Field(..., description="Number of attention heads, e.g., '128', 'N/A'")
    number_of_kv_heads: str = Field(..., description="Number of KV heads, e.g., '32', 'N/A'")
    sliding_window_attention: str = Field(..., description="Sliding window attention, e.g., 'Yes', 'No', 'N/A'")
    positional_encoding_type: str = Field(..., description="Positional encoding type, e.g., 'RoPE', 'Absolute', 'N/A'")
    rope_scaling_method: str = Field(..., description="RoPE scaling method, e.g., 'YaRN', 'Linear', 'N/A'")
    kv_cache_compression: str = Field(..., description="KV cache compression, e.g., 'None', 'PagedAttention', 'N/A'")
    activation_function: str = Field(..., description="Activation function, e.g., 'SwiGLU', 'ReLU', 'N/A'")
    ffn_expansion_ratio: str = Field(..., description="FFN expansion ratio, e.g., 'x4', 'x8', 'N/A'")
    tokenizer_type: str = Field(..., description="Tokenizer type, e.g., 'BPE', 'tiktoken', 'N/A'")
    vocabulary_size: str = Field(..., description="Vocabulary size, e.g., '128000', 'N/A'")
    dataset_composition: str = Field(..., description="Dataset composition, e.g., 'Web, Books, Code, Math', 'N/A'")
    pretraining_objective: str = Field(..., description="Pretraining objective, e.g., 'Next token prediction', 'N/A'")
    mixed_precision_type: str = Field(..., description="Mixed precision type, e.g., 'BF16', 'FP8', 'N/A'")
    fine_tuning: str = Field(..., description="Fine-tuning method, e.g., 'SFT + RLHF', 'N/A'")
    native_precision: str = Field(..., description="Native precision, e.g., 'BF16', 'FP16', 'N/A'")
    memory_footprint: str = Field(..., description="Memory footprint, e.g., '~140GB (FP16)', 'N/A'")
    minimum_vram: str = Field(..., description="Minimum VRAM, e.g., '80GB', 'N/A'")
    distributed_inference: str = Field(..., description="Distributed inference, e.g., 'Required for >70B', 'N/A'")
    optimizations: str = Field(..., description="Optimizations, e.g., 'FlashAttention, PagedAttention', 'N/A'")

    def get_field(self, field_name: str, default: str = "N/A") -> str:
        """Safely get a field value with default fallback."""
        return getattr(self, field_name, default)


def enrich_model_metadata(model_name: str, provider: str) -> ModelMetadataEnrichment | None:
    """
    Uses an LLM to research and return structured metadata for a given model.
    Prioritizes OpenAI if available, otherwise falls back to Anthropic.
    """
    system_prompt: str = """
    You are a technical AI researcher specializing in large language models (LLMs).

    Your task is to extract accurate technical metadata about AI models using reliable sources
    such as research papers, model cards, official announcements, and benchmark reports.

    Strict Rules:
    - Search the web.
    - Prefer documented facts over speculation.
    - If information is not publicly documented, fill the field with the value "N/A".
    - If confidence in a field is low, fill the field with the value "N/A" instead of guessing.
    - Do NOT invent specifications.
    - Use consensus estimates only if widely reported.
    - All outputs must be valid JSON.
    - Do not include explanations, markdown, or comments.
    """
    user_prompt: str = f"""
    Research the following Large Language Model and produce structured technical metadata.

    Model Information:
    - Model Name: {model_name}
    - Provider: {provider}

    Instructions:
    - Use official documentation, research papers, and technical blogs when possible.
    - If a field is unknown or undisclosed, return "N/A".
    - Numeric values must remain numeric when specified as integers.
    - The response must match the JSON schema exactly.

    Return ONLY the JSON object.

    JSON Schema:
    {{
        "parameters": "string (e.g., '1.8T', '70B', '8x7B')",
        "architecture": "string (e.g., 'Dense Transformer', 'Sparse MoE', 'Mixture-of-Experts')",
        "context_window": integer (context length in tokens, e.g. 128000),
        "license_type": "string ('Open Source' or 'Proprietary')",
        "description": "string (1-2 sentence brief technical summary)",
        "multimodal": boolean (true if it natively supports vision/audio/etc),
        "training_data_estimate": "string (e.g., '15T tokens')",
        "release_date": "string (YYYY-MM-DD if known, otherwise null)",
        "model_family": "string (e.g., 'GPT', 'LLaMA', 'Claude', 'Gemini', 'N/A')",
        "attention_type": "string (e.g., 'Multi-Head Attention', 'Grouped Query Attention', 'N/A')",
        "layers": "string (e.g., '80', '126', 'N/A')",
        "optimizer": "string (e.g., 'AdamW', 'Adam', 'N/A')",
        "quantization_formats": "string (e.g., 'GGUF, AWQ, GPTQ', 'Proprietary only', 'N/A')",
        "active_parameters_per_token": "string (e.g., '37B', 'N/A')",
        "number_of_experts": "string (e.g., '16', '256', 'N/A')",
        "parameter_density": "string (e.g., 'Dense', 'Sparse MoE', 'N/A')",
        "hidden_size": "string (e.g., '8192', '16384', 'N/A')",
        "ffn_intermediate_size": "string (e.g., '32768', 'N/A')",
        "number_of_attention_heads": "string (e.g., '128', 'N/A')",
        "number_of_kv_heads": "string (e.g., '32', 'N/A')",
        "sliding_window_attention": "string (e.g., 'Yes', 'No', 'N/A')",
        "positional_encoding_type": "string (e.g., 'RoPE', 'Absolute', 'N/A')",
        "rope_scaling_method": "string (e.g., 'YaRN', 'Linear', 'N/A')",
        "kv_cache_compression": "string (e.g., 'None', 'PagedAttention', 'N/A')",
        "activation_function": "string (e.g., 'SwiGLU', 'ReLU', 'N/A')",
        "ffn_expansion_ratio": "string (e.g., 'x4', 'x8', 'N/A')",
        "tokenizer_type": "string (e.g., 'BPE', 'tiktoken', 'N/A')",
        "vocabulary_size": "string (e.g., '128000', 'N/A')",
        "dataset_composition": "string (e.g., 'Web, Books, Code, Math', 'N/A')",
        "pretraining_objective": "string (e.g., 'Next token prediction', 'N/A')",
        "mixed_precision_type": "string (e.g., 'BF16', 'FP8', 'N/A')",
        "fine_tuning": "string (e.g., 'SFT + RLHF', 'N/A')",
        "native_precision": "string (e.g., 'BF16', 'FP16', 'N/A')",
        "memory_footprint": "string (e.g., '~140GB (FP16)', 'N/A')",
        "minimum_vram": "string (e.g., '80GB', 'N/A')",
        "distributed_inference": "string (e.g., 'Required for >70B', 'N/A')",
        "optimizations": "string (e.g., 'FlashAttention, PagedAttention', 'N/A')"
    }}
    """

    try:
        # Prioritize OpenAI for reliability in this environment
        client = None
        if os.getenv("OPENAI_API_KEY"):
            client = OpenAIClient(model="gpt-4o")
        elif os.getenv("ANTHROPIC_API_KEY"):
            client = AnthropicClient(model="claude-3-5-sonnet-20241022")
        else:
            logger.warning("No API keys found for enrichment.")
            return None

        content = client.get_response(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        if content is None:
            return None

        # Extract JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        data = json.loads(content)
        return ModelMetadataEnrichment.model_validate(data)

    except Exception as e:
        logger.error(f"Error enriching model {model_name}: {e}")
        return None
