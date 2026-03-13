from typing import Any

from db.database import SessionLocal
from models import (
    Benchmark,
    BenchmarkScore,
    Model,
    ModelPerformance,
    ModelPricing,
    TechnicalSpec,
)
from services.enrichment import enrich_model_metadata
from services.scoring import (
    DEFAULT_WEIGHTS,
    compute_weighted_overall_score,
    normalize_score,
)
from sqlalchemy.orm import Session

# -----------------------------------------------------------------------------
# Model License Classification
# -----------------------------------------------------------------------------

OPEN_SOURCE_PROVIDERS = {
    "Meta",
    "Mistral AI",
    "Alibaba",
    "DeepSeek",
    "ByteDance Seed",
}

CLOSED_SOURCE_PROVIDERS = {
    "OpenAI",
    "Anthropic",
    "Google",
}


def get_license_type(model_data: dict[str, Any]) -> str:
    """
    Classify a model as 'Proprietary' or 'Open Source' based on its provider.

    Args:
        model_data (dict[str, Any]): Raw model data containing creator information.

    Returns:
        str: 'Open Source', 'Proprietary', or 'Unknown'.
    """
    provider = model_data.get("model_creator", {}).get("name")

    if provider in OPEN_SOURCE_PROVIDERS:
        return "Open Source"
    if provider in CLOSED_SOURCE_PROVIDERS:
        return "Proprietary"

    return "Unknown"


# -----------------------------------------------------------------------------
# Model Technical Details
# -----------------------------------------------------------------------------


def get_technical_details(
    model_name: str,
    model_provider: str,
    model_release_date: str,
    model_parameters: str,
    model_architecture: str,
    model_license_type: str,
    model_context_window: int,
) -> list[dict[str, Any]]:
    """
    Generate a structured list of technical details for a model.

    Args:
        model_name (str): Name of the model.
        model_provider (str): Name of the provider.
        model_release_date (str): Release date string.
        model_parameters (str): Formatted parameter count.
        model_architecture (str): Architecture description.
        model_license_type (str): Determined license type.
        model_context_window (int): Context window size in tokens.

    Returns:
        list[dict[str, Any]]: List of sections with fact labels and values.
    """
    name = (model_name or "").lower()

    # Format context window
    context_str = "Unknown"
    if model_context_window:
        if model_context_window >= 1000000:
            context_str = f"{int(model_context_window / 1000000)}M tokens"
        else:
            context_str = f"{int(model_context_window / 1000)}K tokens"

    # Default template structured by the user's requested 20 categories
    details = {
        "Core Model Identity": {
            "Model Name": model_name or "Unknown",
            "Organization": model_provider or "Unknown",
            "Release Date": model_release_date or "Unknown",
            "Model Family": "LLaMA"
            if "llama" in name
            else "GPT"
            if "gpt" in name
            else "Qwen"
            if "qwen" in name
            else "Mistral"
            if "mistral" in name
            else "Claude"
            if "claude" in name
            else "Gemini"
            if "gemini" in name
            else "DeepSeek"
            if "deepseek" in name
            else "Custom / Unspecified",
            "Model Type": "Dense Transformer",
            "License": model_license_type or "Unknown",
            "Multimodal Support": "No",
        },
        "Model Size": {
            "Total Parameters": model_parameters or "Unknown",
            "Active Parameters per Token": "N/A (Dense)",
            "Number of Experts": "N/A",
            "Parameter Density": "Dense",
        },
        "Transformer Architecture": {
            "Architecture Type": model_architecture or "Decoder-only Transformer",
            "Layers": "Unknown",
            "Hidden Size (d_model)": "Unknown",
            "FFN Intermediate Size": "Unknown",
        },
        "Attention Architecture": {
            "Attention Type": "Multi-Head Attention (MHA)",
            "Number of Attention Heads": "Unknown",
            "Number of KV Heads": "Unknown",
            "Sliding Window Attention": "No",
        },
        "Positional Encoding": {
            "Type": "RoPE (Rotary Position Embedding)",
            "RoPE Scaling Method": "Unknown",
        },
        "Context Window": {
            "Maximum Context Length": context_str,
            "KV Cache Compression": "None",
        },
        "Feed Forward Network Details": {
            "Activation Function": "SwiGLU",
            "FFN Expansion Ratio": "x4 (Standard)",
        },
        "Tokenization": {
            "Tokenizer Type": "BPE (Byte-Pair Encoding)",
            "Vocabulary Size": "Unknown",
        },
        "Training Dataset": {
            "Total Training Tokens": "Unknown",
            "Dataset Composition": "Web, Books, Code, Math",
        },
        "Training Process": {
            "Pretraining Objective": "Next token prediction",
            "Optimizer": "AdamW",
            "Mixed Precision Type": "BF16",
        },
        "Post-Training": {
            "Fine-Tuning": "SFT + RLHF (PPO / DPO)",
        },
        "Quantization Support": {
            "Native Precision": "BF16",
            "Supported Formats": "Not officially specified",
        },
        "Inference Characteristics": {
            "Memory Footprint": "Unknown",
        },
        "Hardware Requirements": {
            "Minimum VRAM": "Unknown",
            "Distributed Inference": "Required for >70B",
        },
        "System / Infrastructure": {
            "Optimizations": "FlashAttention, Continuous Batching, PagedAttention",
        },
    }

    # Override based on model family
    if "gpt-4" in name:
        details["Core Model Identity"]["Model Type"] = "Mixture-of-Experts (MoE)"
        details["Core Model Identity"]["Multimodal Support"] = "Yes (Native Vision/Audio)"
        details["Model Size"]["Active Parameters per Token"] = "~200B"
        details["Model Size"]["Number of Experts"] = "16 (Estimated)"
        details["Model Size"]["Parameter Density"] = "Sparse MoE"
        details["Attention Architecture"]["Attention Type"] = "Grouped Query Attention (GQA)"
        details["Tokenization"]["Tokenizer Type"] = "tiktoken (o200k_base)"
        details["Tokenization"]["Vocabulary Size"] = "200,000"
        details["Training Dataset"]["Total Training Tokens"] = "~15T+ tokens"
        details["Quantization Support"]["Supported Formats"] = "Proprietary (API only)"
        details["Post-Training"]["Fine-Tuning"] = "RLHF, RL, RLAIF"
    elif "deepseek-r1" in name or "deepseek-v3" in name:
        details["Core Model Identity"]["Model Type"] = "Mixture-of-Experts (MoE)"
        details["Model Size"]["Total Parameters"] = "671B"
        details["Model Size"]["Active Parameters per Token"] = "37B"
        details["Model Size"]["Number of Experts"] = "256"
        details["Model Size"]["Parameter Density"] = "Highly Sparse MoE"
        details["Transformer Architecture"]["Layers"] = "61"
        details["Transformer Architecture"]["Hidden Size (d_model)"] = "7168"
        details["Attention Architecture"]["Attention Type"] = "Multi-head Latent Attention (MLA)"
        details["Attention Architecture"]["Number of Attention Heads"] = "128"
        details["Positional Encoding"]["Type"] = "YaRN RoPE"
        details["Tokenization"]["Tokenizer Type"] = "Byte-level BPE"
        details["Tokenization"]["Vocabulary Size"] = "129,280"
        details["Training Dataset"]["Total Training Tokens"] = "14.8T tokens"
        details["Training Process"]["Optimizer"] = "AdamW"
        details["Training Process"]["Mixed Precision Type"] = "FP8 Mixed Precision"
        details["Post-Training"]["Fine-Tuning"] = "Pure RL (GRPO)" if "r1" in name else "SFT + DPO"
        details["System / Infrastructure"]["Optimizations"] = "FlashAttention-3, MLA, FP8 native"
        details["Quantization Support"]["Supported Formats"] = "AWQ, GGUF, EXL2, FP8"
    elif "llama 3" in name or "llama-3" in name or "llama 4" in name:
        is405b = "405b" in name
        is70b = "70b" in name
        is109b = "109b" in name or "scout" in name
        is400b = "400b" in name or "maverick" in name

        if is400b:
            details["Model Size"]["Total Parameters"] = "400B"
        elif is405b:
            details["Model Size"]["Total Parameters"] = "405B"
        elif is109b:
            details["Model Size"]["Total Parameters"] = "109B"
        elif is70b:
            details["Model Size"]["Total Parameters"] = "70B"
        else:
            details["Model Size"]["Total Parameters"] = "8B"

        if "4 " in name or "-4" in name:
            details["Core Model Identity"]["Model Type"] = "Mixture-of-Experts (MoE)"
            details["Model Size"]["Active Parameters per Token"] = "17B"
            details["Model Size"]["Parameter Density"] = "Sparse MoE"

        details["Transformer Architecture"]["Layers"] = (
            "126" if (is405b or is400b) else "80" if (is70b or is109b) else "32"
        )
        details["Transformer Architecture"]["Hidden Size (d_model)"] = (
            "16384" if (is405b or is400b) else "8192" if (is70b or is109b) else "4096"
        )
        details["Attention Architecture"]["Attention Type"] = "Grouped Query Attention (GQA)"
        details["Positional Encoding"]["Type"] = "RoPE (Theta: 500k)"
        details["Tokenization"]["Tokenizer Type"] = "tiktoken (Llama)"
        details["Tokenization"]["Vocabulary Size"] = "128,256"
        details["Training Dataset"]["Total Training Tokens"] = "15T+ tokens"
        details["Quantization Support"]["Supported Formats"] = "GGUF, AWQ, GPTQ, EXL2"
        details["Inference Characteristics"]["Memory Footprint"] = (
            "~800GB (FP16)" if is400b or is405b else "~140GB (FP16)" if is70b or is109b else "~16GB (FP16)"
        )
        details["Post-Training"]["Fine-Tuning"] = "SFT, Rejection Sampling, PPO/DPO"
    elif "claude 3" in name:
        details["Core Model Identity"]["Multimodal Support"] = "Yes (Vision)"
        details["Training Dataset"]["Total Training Tokens"] = "Proprietary High-Quality Mix"
        details["Quantization Support"]["Supported Formats"] = "Proprietary (API only)"
        details["Post-Training"]["Fine-Tuning"] = "Constitutional AI, SFT, RLHF"
        details["Attention Architecture"]["Attention Type"] = "Grouped Query Attention (GQA) / MQA"
    elif "gemini" in name:
        details["Core Model Identity"]["Model Type"] = "Mixture-of-Experts (MoE)"
        details["Core Model Identity"]["Multimodal Support"] = "Yes (Interleaved Text, Vision, Audio)"
        details["Attention Architecture"]["Attention Type"] = "Multimodal Block GQA"
        details["Tokenization"]["Tokenizer Type"] = "SentencePiece (Multimodal)"
        details["Training Dataset"]["Total Training Tokens"] = "Google Proprietary Multimodal Data"
        details["Hardware Requirements"]["Minimum VRAM"] = "TPU v5p / TPU v5e Native"
        details["System / Infrastructure"]["Optimizations"] = "Ring Attention, Blockwise Compute Context"
    elif "o1" in name or "o3" in name:
        details["Core Model Identity"]["Model Type"] = "RL Reasoning Model (MoE)"
        details["Core Model Identity"]["Reasoning Variant"] = "Yes (Chain-of-Thought / RL Search)"
        details["Training Process"]["Pretraining Objective"] = "RL Search, Next token prediction"
        details["Post-Training"]["Fine-Tuning"] = "Massive RL, Value Networks"
        details["Quantization Support"]["Supported Formats"] = "Proprietary (API only)"

    # Format as array of categories strictly matching frontend
    output = []
    for title, facts in details.items():
        fact_list = [{"label": label, "value": str(value)} for label, value in facts.items()]
        output.append({"title": title, "facts": fact_list})

    return output


# -----------------------------------------------------------------------------
# Benchmark Data
# -----------------------------------------------------------------------------


BENCHMARKS = [
    {
        "name": "MMLU",
        "category": "knowledge",
        "description": "Massive Multitask Language Understanding - 57 subjects",
        "max_score": 100.0,
        "weight": 1.2,
        "source": "Hendrycks et al.",
    },
    {
        "name": "MMLU-Pro",
        "category": "knowledge",
        "description": "MMLU Professional - harder, more discriminative version",
        "max_score": 100.0,
        "weight": 1.3,
        "source": "Artificial Analysis",
    },
    {
        "name": "GPQA Diamond",
        "category": "knowledge",
        "description": "Graduate-level science QA - PhD-level Q&A",
        "max_score": 100.0,
        "weight": 1.3,
        "source": "Artificial Analysis",
    },
    {
        "name": "HLE",
        "category": "reasoning",
        "description": "Humanity's Last Exam - extremely difficult reasoning benchmark",
        "max_score": 100.0,
        "weight": 1.4,
        "source": "Artificial Analysis",
    },
    {
        "name": "GSM8K",
        "category": "math",
        "description": "Grade School Math - multi-step math problems",
        "max_score": 100.0,
        "weight": 1.0,
        "source": "OpenAI",
    },
    {
        "name": "MATH-500",
        "category": "math",
        "description": "Competition-level math - 500 problems",
        "max_score": 100.0,
        "weight": 1.2,
        "source": "Artificial Analysis",
    },
    {
        "name": "AIME",
        "category": "math",
        "description": "American Invitational Mathematics Examination problems",
        "max_score": 100.0,
        "weight": 1.2,
        "source": "Artificial Analysis",
    },
    {
        "name": "AIME 2025",
        "category": "math",
        "description": "AIME 2025 benchmark variant",
        "max_score": 100.0,
        "weight": 1.2,
        "source": "Artificial Analysis",
    },
    {
        "name": "HumanEval",
        "category": "coding",
        "description": "Python coding - functional correctness",
        "max_score": 100.0,
        "weight": 1.2,
        "source": "OpenAI",
    },
    {
        "name": "LiveCodeBench",
        "category": "coding",
        "description": "Live competitive programming benchmark",
        "max_score": 100.0,
        "weight": 1.1,
        "source": "Artificial Analysis",
    },
    {
        "name": "SciCode",
        "category": "coding",
        "description": "Scientific programming tasks benchmark",
        "max_score": 100.0,
        "weight": 1.0,
        "source": "Artificial Analysis",
    },
    {
        "name": "TerminalBench Hard",
        "category": "coding",
        "description": "Autonomous coding/terminal tasks benchmark",
        "max_score": 100.0,
        "weight": 1.1,
        "source": "Artificial Analysis",
    },
    {
        "name": "BigBench-Hard",
        "category": "reasoning",
        "description": "23 challenging BIG-Bench reasoning tasks",
        "max_score": 100.0,
        "weight": 1.1,
        "source": "Google",
    },
    {
        "name": "ARC-Challenge",
        "category": "reasoning",
        "description": "AI2 Reasoning Challenge - science questions",
        "max_score": 100.0,
        "weight": 0.9,
        "source": "AI2",
    },
    {
        "name": "LCR",
        "category": "reasoning",
        "description": "Long Context Reasoning - reasoning with large context windows",
        "max_score": 100.0,
        "weight": 1.0,
        "source": "Artificial Analysis",
    },
    {
        "name": "IFEval",
        "category": "instruction",
        "description": "Instruction Following Evaluation",
        "max_score": 100.0,
        "weight": 1.0,
        "source": "Artificial Analysis",
    },
    {
        "name": "TAU2",
        "category": "agentic",
        "description": "TAU-Bench v2 - agentic tool-use tasks",
        "max_score": 100.0,
        "weight": 1.1,
        "source": "Artificial Analysis",
    },
    {
        "name": "Arena Elo",
        "category": "human_preference",
        "description": "Chatbot Arena Elo - human preference votes",
        "max_score": 1400.0,
        "weight": 1.5,
        "source": "LMSYS / Chatbot Arena",
    },
    {
        "name": "LiveBench",
        "category": "reasoning",
        "type": "index",
        "description": "Live benchmark - contamination-free reasoning",
        "max_score": 100.0,
        "weight": 1.2,
        "source": "LiveBench.ai",
    },
    {
        "name": "EQBench",
        "category": "emotional_intelligence",
        "type": "benchmark",
        "description": "Emotional intelligence and nuance understanding",
        "max_score": 100.0,
        "weight": 0.8,
        "source": "EQ-Bench",
    },
    {
        "name": "AA Intelligence Index",
        "category": "composite",
        "type": "index",
        "description": "Artificial Analysis composite score for overall model intelligence",
        "max_score": 100.0,
        "weight": 1.5,
        "source": "Artificial Analysis",
    },
    {
        "name": "AA Coding Index",
        "category": "composite",
        "type": "index",
        "description": "Artificial Analysis composite score for coding ability",
        "max_score": 100.0,
        "weight": 1.3,
        "source": "Artificial Analysis",
    },
    {
        "name": "AA Math Index",
        "category": "composite",
        "type": "index",
        "description": "Artificial Analysis composite score for math reasoning",
        "max_score": 100.0,
        "weight": 1.3,
        "source": "Artificial Analysis",
    },
]


def map_aa_scores(evals: dict[str, Any]) -> dict[str, float]:
    """
    Map Artificial Analysis evaluation keys to local benchmark names.

    Args:
        evals (dict[str, Any]): Raw evaluations dictionary from AA API.

    Returns:
        dict[str, float]: Mapped scores by benchmark name.
    """
    if not evals:
        return {}

    # Regular benchmarks (0-1 scale, will be multiplied by 100)
    benchmark_mapping = {
        "mmlu_pro": "MMLU-Pro",
        "gpqa": "GPQA Diamond",
        "hle": "HLE",
        "livecodebench": "LiveCodeBench",
        "scicode": "SciCode",
        "math_500": "MATH-500",
        "aime": "AIME",
        "aime_25": "AIME 2025",
        "ifbench": "IFEval",
        "lcr": "LCR",
        "terminalbench_hard": "TerminalBench Hard",
        "tau2": "TAU2",
    }

    # Composite indexes (already 0-100+ scale, NOT multiplied by 100)
    index_mapping = {
        "artificial_analysis_intelligence_index": "AA Intelligence Index",
        "artificial_analysis_coding_index": "AA Coding Index",
        "artificial_analysis_math_index": "AA Math Index",
    }

    mapped_scores = {}
    for aa_key, bench_name in benchmark_mapping.items():
        if aa_key in evals and evals[aa_key] is not None:
            # Multiply raw decimal stats to fit our local out of 100 system.
            mapped_scores[bench_name] = evals[aa_key] * 100

    for aa_key, bench_name in index_mapping.items():
        if aa_key in evals and evals[aa_key] is not None:
            # Already on 0-100+ scale, store as-is
            mapped_scores[bench_name] = evals[aa_key]

    return mapped_scores


def populate_missing_scores(mapped_scores: dict[str, Any]) -> dict[str, Any]:
    """
    Safely populate any missing scores across the known BENCHMARKS with placeholder values.

    Args:
        mapped_scores (dict[str, Any]): Dictionary of existing scores.

    Returns:
        dict[str, Any]: Dictionary with all benchmarks populated.
    """
    from scripts.seed_data import BENCHMARKS  # ensure we know what the system needs

    populated = mapped_scores.copy()
    for b in BENCHMARKS:
        if b["name"] not in populated:
            populated[str(b["name"])] = 75.0  # Placeholder dummy value
    return populated


def process_and_add_model(db: Session, m: dict[str, Any], benchmark_objs: dict[str, Benchmark]) -> Model:
    """
    Process a single model's data from AA API, enrich it, and add/update it in the DB.
    """
    # Standardize parameters that AA does not expose.
    price_in = m.get("pricing", {}).get("price_1m_input_tokens", 0)
    price_out = m.get("pricing", {}).get("price_1m_output_tokens", 0)
    speed = m.get("median_time_to_first_answer_token", 0)

    # Determine initial license type and values
    license_type = get_license_type(m)
    current_params = "Unknown"
    current_arch = "Unknown"
    current_context = 0
    current_license = license_type
    current_desc = m.get("slug", "")

    # LLM Enrichment for missing data
    enriched = None

    # Check if we should enrich (e.g., if basic info is unknown)
    if current_params == "Unknown" or current_arch == "Unknown" or current_license == "Unknown":
        print(f"Enriching metadata for {m.get('name')}...")
        enriched = enrich_model_metadata(m.get("name", ""), m.get("model_creator", {}).get("name", "Unknown"))
        if enriched:
            current_params = enriched.parameters
            current_arch = enriched.architecture
            current_context = enriched.context_window
            current_license = enriched.license_type
            current_desc = enriched.description

    tech_details = get_technical_details(
        model_name=m.get("name", ""),
        model_provider=m.get("model_creator", {}).get("name", "Unknown"),
        model_release_date=m.get("release_date", "Unknown"),
        model_parameters=current_params,
        model_architecture=current_arch,
        model_license_type=current_license,
        model_context_window=current_context,
    )

    # Extract evaluations (including composite indexes)
    evals = m.get("evaluations", {})

    # Performance metrics
    median_otps = m.get("median_output_tokens_per_second")
    median_ttft = m.get("median_time_to_first_token_seconds")
    median_ttfa = m.get("median_time_to_first_answer_token")

    # Blended pricing
    blended = m.get("pricing", {}).get("price_1m_blended_3_to_1")

    # Try to find existing model by name
    model = db.query(Model).filter(Model.name == m.get("name")).first()

    if model:
        # Update existing model
        model.slug = m.get("slug", "")
        model.provider = m.get("model_creator", {}).get("name", "Unknown")
        model.model_creator_slug = m.get("model_creator", {}).get("slug", "")
        model.license_type = current_license
        model.release_date = m.get("release_date")
        model.parameters = current_params
        model.architecture = current_arch
        model.description = current_desc
        # Ensure it's active if we're seeing it in the seed/update
        model.is_active = 1
    else:
        # Create new model
        model = Model(
            name=m.get("name", "Unknown"),
            slug=m.get("slug", ""),
            provider=m.get("model_creator", {}).get("name", "Unknown"),
            model_creator_slug=m.get("model_creator", {}).get("slug", ""),
            description=current_desc,
            parameters=current_params,
            architecture=current_arch,
            license_type=current_license,
            release_date=m.get("release_date"),
            is_active=1,
        )
        db.add(model)

    db.flush()

    # Update or create pricing
    if not model.pricing:
        pricing = ModelPricing(
            model_id=model.id,
            cost_per_1m_input_tokens=price_in,
            cost_per_1m_output_tokens=price_out,
            cost_per_1m_blended=blended,
        )
        db.add(pricing)
    else:
        model.pricing.cost_per_1m_input_tokens = price_in
        model.pricing.cost_per_1m_output_tokens = price_out
        model.pricing.cost_per_1m_blended = blended

    # Update or create performance
    if not model.performance:
        performance = ModelPerformance(
            model_id=model.id,
            median_output_tokens_per_second=median_otps,
            median_ttft_seconds=median_ttft,
            median_ttfa_seconds=median_ttfa,
            avg_latency_ms=speed * 1000 if speed else 0,
            context_window=0,
        )
        db.add(performance)
    else:
        model.performance.median_output_tokens_per_second = median_otps
        model.performance.median_ttft_seconds = median_ttft
        model.performance.median_ttfa_seconds = median_ttfa
        model.performance.avg_latency_ms = speed * 1000 if speed else 0
        if current_context > 0:
            model.performance.context_window = current_context

    # Update technical specs (delete and recreate for simplicity)
    db.query(TechnicalSpec).filter(TechnicalSpec.model_id == model.id).delete()
    for sec in tech_details:
        section_title = sec["title"]
        for fact in sec["facts"]:
            spec = TechnicalSpec(
                model_id=model.id,
                section=section_title,
                label=fact["label"],
                value=fact["value"],
            )
            db.add(spec)

    # Map Scores
    scores_data = map_aa_scores(evals)
    score_list = []
    for bench_name, raw_score in scores_data.items():
        benchmark = benchmark_objs.get(bench_name)
        if not benchmark:
            continue
        normalized = normalize_score(raw_score, float(str(benchmark.max_score)))

        # Check for existing score
        existing_score = (
            db.query(BenchmarkScore)
            .filter(BenchmarkScore.model_id == model.id, BenchmarkScore.benchmark_id == benchmark.id)
            .first()
        )

        if existing_score:
            # Update existing score
            existing_score.raw_score = raw_score
            existing_score.normalized_score = normalized
            existing_score.evaluation_date = model.release_date
        else:
            # Create new score
            score = BenchmarkScore(
                model_id=model.id,
                benchmark_id=benchmark.id,
                raw_score=raw_score,
                normalized_score=normalized,
                language="en",
                evaluation_date=model.release_date,
            )
            db.add(score)

        score_list.append(
            {
                "benchmark_name": bench_name,
                "normalized_score": normalized,
            }
        )

    overall, confidence = compute_weighted_overall_score(score_list, DEFAULT_WEIGHTS)
    model.overall_score = overall
    model.confidence = confidence

    return model


def seed_database(db: Session) -> None:
    """
    Seed the database with benchmarks and top LLM models from Artificial Analysis.
    This function handles both record creation and updates.

    Args:
        db (Session): SQLAlchemy database session.
    """

    # Create benchmarks
    benchmark_objs = {}
    for b_data in BENCHMARKS:
        benchmark = db.query(Benchmark).filter(Benchmark.name == b_data["name"]).first()
        if not benchmark:
            benchmark = Benchmark(**b_data)
            db.add(benchmark)
            db.flush()
        benchmark_objs[b_data["name"]] = benchmark

    # If models already exist, we'll check if any need enrichment.
    models_to_enrich = (
        db.query(Model)
        .filter((Model.license_type == "Unknown") | (Model.parameters == "Unknown") | (Model.architecture == "Unknown"))
        .all()
    )

    # If no models need enrichment and models exist, we can potentially skip fetching.
    # However, for the first run or if we want to ensure everything is up to date, we fetch.
    if not models_to_enrich and db.query(Model).first():
        return

    # Fetch models from Artificial Analysis
    from services.fetch_models import get_models

    models = get_models()

    # Create models and scores dynamically
    for m in models:
        process_and_add_model(db, m, benchmark_objs)

    db.commit()


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
