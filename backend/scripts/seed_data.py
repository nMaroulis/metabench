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
    model_family: str = "Unknown",
    attention_type: str = "Unknown",
    layers: str = "Unknown",
    optimizer: str = "Unknown",
    quantization_formats: str = "Unknown",
) -> list[dict[str, Any]]:
    """
    Generate a structured list of technical details for a model.

    This function creates a generic template based on the available model data
    without making hardcoded assumptions about specific model families or
    architectures.

    Args:
        model_name (str): Name of the model.
        model_provider (str): Name of the provider.
        model_release_date (str): Release date string.
        model_parameters (str): Formatted parameter count.
        model_architecture (str): Architecture description.
        model_license_type (str): Determined license type.
        model_context_window (int): Context window size in tokens.
        model_family (str): Model family (e.g., 'GPT', 'LLaMA').
        attention_type (str): Attention mechanism type.
        layers (str): Number of transformer layers.
        optimizer (str): Training optimizer used.
        quantization_formats (str): Supported quantization formats.

    Returns:
        list[dict[str, Any]]: List of sections with fact labels and values.
    """
    # Format context window
    context_str = "Unknown"
    if model_context_window:
        if model_context_window >= 1000000:
            context_str = f"{int(model_context_window / 1000000)}M tokens"
        else:
            context_str = f"{int(model_context_window / 1000)}K tokens"

    # Generic template based on available data
    details = {
        "Core Model Identity": {
            "Model Name": model_name or "Unknown",
            "Organization": model_provider or "Unknown",
            "Release Date": model_release_date or "Unknown",
            "Model Family": model_family or "Unknown",
            "Model Type": model_architecture or "Unknown",
            "License": model_license_type or "Unknown",
            "Multimodal Support": "Unknown",
        },
        "Model Size": {
            "Total Parameters": model_parameters or "Unknown",
            "Active Parameters per Token": "Unknown",
            "Number of Experts": "Unknown",
            "Parameter Density": "Unknown",
        },
        "Transformer Architecture": {
            "Architecture Type": model_architecture or "Unknown",
            "Layers": layers or "Unknown",
            "Hidden Size (d_model)": "Unknown",
            "FFN Intermediate Size": "Unknown",
        },
        "Attention Architecture": {
            "Attention Type": attention_type or "Unknown",
            "Number of Attention Heads": "Unknown",
            "Number of KV Heads": "Unknown",
            "Sliding Window Attention": "Unknown",
        },
        "Positional Encoding": {
            "Type": "Unknown",
            "RoPE Scaling Method": "Unknown",
        },
        "Context Window": {
            "Maximum Context Length": context_str,
            "KV Cache Compression": "Unknown",
        },
        "Feed Forward Network Details": {
            "Activation Function": "Unknown",
            "FFN Expansion Ratio": "Unknown",
        },
        "Tokenization": {
            "Tokenizer Type": "Unknown",
            "Vocabulary Size": "Unknown",
        },
        "Training Dataset": {
            "Total Training Tokens": "Unknown",
            "Dataset Composition": "Unknown",
        },
        "Training Process": {
            "Pretraining Objective": "Unknown",
            "Optimizer": optimizer or "Unknown",
            "Mixed Precision Type": "Unknown",
        },
        "Post-Training": {
            "Fine-Tuning": "Unknown",
        },
        "Quantization Support": {
            "Native Precision": "Unknown",
            "Supported Formats": quantization_formats or "Unknown",
        },
        "Inference Characteristics": {
            "Memory Footprint": "Unknown",
        },
        "Hardware Requirements": {
            "Minimum VRAM": "Unknown",
            "Distributed Inference": "Unknown",
        },
        "System / Infrastructure": {
            "Optimizations": "Unknown",
        },
    }

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

    This function translates between AA's internal benchmark naming convention
    and our standardized benchmark names. It handles two types of scores:
    1. Regular benchmarks (0-1 scale) which are multiplied by 100
    2. Composite indexes (already 0-100+ scale) which are kept as-is

    Args:
        evals (dict[str, Any]): Raw evaluations dictionary from AA API.
                               Keys are AA's internal benchmark names,
                               values are scores.

    Returns:
        dict[str, float]: Mapped scores by our benchmark names.
                         All scores normalized to 0-100 scale.
    """
    if not evals:
        return {}

    # Regular benchmarks (0-1 scale, will be multiplied by 100)
    # These are standard benchmarks where AA returns a decimal score (0.0-1.0)
    # that we convert to percentage (0-100) for consistency
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
    # These are AA's proprietary composite scores that combine multiple benchmarks
    # They're already on a 0-100+ scale, so we don't multiply them
    index_mapping = {
        "artificial_analysis_intelligence_index": "AA Intelligence Index",
        "artificial_analysis_coding_index": "AA Coding Index",
        "artificial_analysis_math_index": "AA Math Index",
    }

    mapped_scores = {}

    # Process regular benchmarks - convert from decimal to percentage
    for aa_key, bench_name in benchmark_mapping.items():
        if aa_key in evals and evals[aa_key] is not None:
            # Multiply raw decimal stats to fit our local out of 100 system.
            mapped_scores[bench_name] = evals[aa_key] * 100

    # Process composite indexes - already in correct scale
    for aa_key, bench_name in index_mapping.items():
        if aa_key in evals and evals[aa_key] is not None:
            # Already on 0-100+ scale, store as-is
            mapped_scores[bench_name] = evals[aa_key]

    return mapped_scores


def populate_missing_scores(mapped_scores: dict[str, Any]) -> dict[str, Any]:
    """
    Safely populate any missing scores across the known BENCHMARKS with placeholder values.

    This function ensures all benchmarks have a value, even if the API didn't provide
    a score. This is important for consistent UI display and score calculations.
    Currently uses 75.0 as a neutral placeholder.

    Args:
        mapped_scores (dict[str, Any]): Dictionary of existing scores from API.

    Returns:
        dict[str, Any]: Dictionary with all benchmarks populated,
                        including placeholders for missing scores.
    """
    from scripts.seed_data import BENCHMARKS  # ensure we know what the system needs

    populated = mapped_scores.copy()
    for b in BENCHMARKS:
        if b["name"] not in populated:
            populated[str(b["name"])] = 75.0  # Placeholder dummy value
    return populated


def process_and_add_model(
    db: Session,
    m: dict[str, Any],
    benchmark_objs: dict[str, Benchmark],
    *,
    skip_enrichment: bool = False,
) -> Model:
    """
    Process a single model's data from AA API, enrich it, and add/update it in the DB.

    This function handles both creation of new models and updating existing ones.
    It will:
    1. Extract pricing, performance, and evaluation data from the API response
    2. Enrich model metadata using LLM if critical fields are unknown (and not skipped)
    3. Create or update the model record with is_active = 1
    4. Update all related data (pricing, performance, technical specs, benchmarks)
    5. Compute and store the weighted overall score

    Args:
        db (Session): SQLAlchemy database session
        m (dict[str, Any]): Model data from Artificial Analysis API
        benchmark_objs (dict[str, Benchmark]): Mapping of benchmark names to DB objects
        skip_enrichment (bool): If True, skip LLM enrichment (use for existing models)

    Returns:
        Model: The created or updated model instance
    """
    # Extract pricing data from API response
    # Note: AA provides prices per 1M tokens
    price_in = m.get("pricing", {}).get("price_1m_input_tokens", 0)
    price_out = m.get("pricing", {}).get("price_1m_output_tokens", 0)
    speed = m.get("median_time_to_first_answer_token", 0)

    # Determine initial license type and values
    current_params = "Unknown"
    current_arch = "Unknown"
    current_context = 0
    current_license = "Unknown"
    current_desc = m.get("slug", "")

    # LLM Enrichment for missing data (only for new models)
    enriched = None

    # Only call the enrichment service if:
    # 1. We're not skipping enrichment (i.e., this is a new model)
    # 2. We're missing critical metadata
    if not skip_enrichment and (
        current_params == "Unknown" or current_arch == "Unknown" or current_license == "Unknown"
    ):
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
        model_family=enriched.model_family if enriched else "Unknown",
        attention_type=enriched.attention_type if enriched else "Unknown",
        layers=enriched.layers if enriched else "Unknown",
        optimizer=enriched.optimizer if enriched else "Unknown",
        quantization_formats=enriched.quantization_formats if enriched else "Unknown",
    )

    # Extract evaluations (including composite indexes)
    evals = m.get("evaluations", {})

    # Performance metrics
    median_otps = m.get("median_output_tokens_per_second")
    median_ttft = m.get("median_time_to_first_token_seconds")
    median_ttfa = m.get("median_time_to_first_answer_token")

    # Blended pricing
    blended = m.get("pricing", {}).get("price_1m_blended_3_to_1")

    # Check if model already exists in DB
    # We use name as the unique identifier for models
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
        # IMPORTANT: Set is_active = 1 since we're seeing it in the current API data
        # This ensures that models remain active when they're still available
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
        # Flush to get model.id for new models before adding related records
        db.flush()
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

    # Update technical specs (only for existing models with valid IDs)
    # For new models, technical specs are added after the model gets its ID on commit
    if model.id is not None:
        # Delete old specs for existing models
        db.query(TechnicalSpec).filter(TechnicalSpec.model_id == model.id).delete()

    # Add technical specs for both new and existing models
    # For new models, SQLAlchemy will set model_id after commit via relationship
    for sec in tech_details:
        section_title = sec["title"]
        for fact in sec["facts"]:
            spec = TechnicalSpec(
                model_id=model.id,  # Will be None for new models, set by SQLAlchemy on commit
                section=section_title,
                label=fact["label"],
                value=fact["value"],
            )
            db.add(spec)

    # Process benchmark scores from API evaluations
    scores_data = map_aa_scores(evals)
    score_list = []  # Collect normalized scores for overall score calculation
    for bench_name, raw_score in scores_data.items():
        benchmark = benchmark_objs.get(bench_name)
        if not benchmark:
            continue
        normalized = normalize_score(raw_score, float(str(benchmark.max_score)))

        # Check if we already have a score for this model/benchmark combination
        # This allows us to update existing scores rather than creating duplicates
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

        # Track this score for overall score calculation
        score_list.append(
            {
                "benchmark_name": bench_name,
                "normalized_score": normalized,
            }
        )

    # Compute weighted overall score based on all available benchmarks
    # The confidence score indicates how many benchmarks contributed to the overall score
    overall, confidence = compute_weighted_overall_score(score_list, DEFAULT_WEIGHTS)
    model.overall_score = overall
    model.confidence = confidence

    return model


def update_model_benchmarks(
    db: Session,
    model: Model,
    m: dict[str, Any],
    benchmark_objs: dict[str, Benchmark],
) -> None:
    """
    Lightweight update for existing models - only updates benchmarks, pricing, and performance.

    This function is used during database updates to refresh benchmark scores and
    performance metrics without touching model metadata (parameters, architecture,
    technical specs, etc.). This is much faster than full enrichment since it
    skips the LLM enrichment step entirely.

    Args:
        db (Session): SQLAlchemy database session
        model (Model): Existing model instance from database
        m (dict[str, Any]): Model data from Artificial Analysis API
        benchmark_objs (dict[str, Benchmark]): Mapping of benchmark names to DB objects
    """
    # Extract pricing data from API
    price_in = m.get("pricing", {}).get("price_1m_input_tokens", 0)
    price_out = m.get("pricing", {}).get("price_1m_output_tokens", 0)
    blended = m.get("pricing", {}).get("price_1m_blended_3_to_1")

    # Performance metrics
    speed = m.get("median_time_to_first_answer_token", 0)
    median_otps = m.get("median_output_tokens_per_second")
    median_ttft = m.get("median_time_to_first_token_seconds")
    median_ttfa = m.get("median_time_to_first_answer_token")

    # Extract evaluations (including composite indexes)
    evals = m.get("evaluations", {})

    # Update pricing (create if doesn't exist, update if it does)
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

    # Update performance metrics
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

    # Update benchmark scores
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
            existing_score.raw_score = raw_score
            existing_score.normalized_score = normalized
            existing_score.evaluation_date = model.release_date
        else:
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

    # Recompute overall score with updated benchmarks
    overall, confidence = compute_weighted_overall_score(score_list, DEFAULT_WEIGHTS)
    model.overall_score = overall
    model.confidence = confidence


def seed_database(db: Session) -> None:
    """
    Seed the database with benchmarks and top LLM models from Artificial Analysis.

    This is the main entry point for initial database population. It:
    1. Creates all benchmark definitions if they don't exist
    2. Checks if models need enrichment (optimization to avoid unnecessary API calls)
    3. Fetches all models from Artificial Analysis API
    4. Processes each model (create/update with enrichment as needed)

    Note: This function is safe to run multiple times - it will update existing
    records rather than creating duplicates.

    Args:
        db (Session): SQLAlchemy database session.
    """

    # Step 1: Ensure all benchmarks exist in the database
    # We need these before processing models since scores reference benchmarks
    benchmark_objs = {}
    for b_data in BENCHMARKS:
        benchmark = db.query(Benchmark).filter(Benchmark.name == b_data["name"]).first()
        if not benchmark:
            # Create new benchmark definition
            benchmark = Benchmark(**b_data)
            db.add(benchmark)
            # Note: We don't flush here to avoid holding DB locks
        benchmark_objs[b_data["name"]] = benchmark

    # Step 2: Check if we can skip processing (optimization)
    # If all existing models have complete metadata, we might skip the API fetch
    models_to_enrich = (
        db.query(Model)
        .filter((Model.license_type == "Unknown") | (Model.parameters == "Unknown") | (Model.architecture == "Unknown"))
        .all()
    )

    # Skip if:
    # 1. No models need enrichment AND
    # 2. We already have models in the database
    # This avoids unnecessary API calls on subsequent runs
    if not models_to_enrich and db.query(Model).first():
        return

    # Step 3: Fetch current model data from Artificial Analysis API
    from services.fetch_models import get_models

    models = get_models()

    # Step 4: Process each model - create new or update existing
    # The process_and_add_model function handles all the complex logic
    for m in models:
        process_and_add_model(db, m, benchmark_objs)

    # Commit all changes in a single transaction
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
