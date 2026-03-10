from models import (
    Benchmark,
    BenchmarkScore,
    Model,
    ModelPerformance,
    ModelPricing,
    TechnicalSpec,
)
from normalization import (
    DEFAULT_WEIGHTS,
    compute_weighted_overall_score,
    normalize_score,
)
from sqlalchemy.orm import Session


def get_technical_details(
    model_name: str,
    model_provider: str,
    model_release_date: str,
    model_parameters: str,
    model_architecture: str,
    model_license_type: str,
    model_context_window: int,
) -> list:
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
        "source": "TIGER-Lab",
    },
    {
        "name": "GPQA Diamond",
        "category": "knowledge",
        "description": "Graduate-level science QA - PhD-level Q&A",
        "max_score": 100.0,
        "weight": 1.3,
        "source": "NYU",
    },
    {
        "name": "HLE",
        "category": "reasoning",
        "description": "Humanity's Last Exam - extremely difficult reasoning benchmark",
        "max_score": 100.0,
        "weight": 1.4,
        "source": "HLE",
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
        "source": "Hendrycks et al.",
    },
    {
        "name": "AIME",
        "category": "math",
        "description": "American Invitational Mathematics Examination problems",
        "max_score": 100.0,
        "weight": 1.2,
        "source": "AMC/AIME",
    },
    {
        "name": "AIME 2025",
        "category": "math",
        "description": "AIME 2025 benchmark variant",
        "max_score": 100.0,
        "weight": 1.2,
        "source": "AMC/AIME 2025",
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
        "source": "LiveCodeBench",
    },
    {
        "name": "SciCode",
        "category": "coding",
        "description": "Scientific programming tasks benchmark",
        "max_score": 100.0,
        "weight": 1.0,
        "source": "SciCode",
    },
    {
        "name": "TerminalBench Hard",
        "category": "coding",
        "description": "Autonomous coding/terminal tasks benchmark",
        "max_score": 100.0,
        "weight": 1.1,
        "source": "TerminalBench",
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
        "source": "LCR",
    },
    {
        "name": "IFEval",
        "category": "instruction",
        "description": "Instruction Following Evaluation",
        "max_score": 100.0,
        "weight": 1.0,
        "source": "Google",
    },
    {
        "name": "TAU2",
        "category": "agentic",
        "description": "TAU-Bench v2 - agentic tool-use tasks",
        "max_score": 100.0,
        "weight": 1.1,
        "source": "TAU-Bench",
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


def map_aa_scores(evals: dict) -> dict:
    """Map Artificial Analysis evaluation keys to local benchmark names."""
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


def populate_missing_scores(mapped_scores: dict) -> dict:
    """Safely populate any missing scores across the known BENCHMARKS."""
    from scripts.seed_data import BENCHMARKS  # ensure we know what the system needs

    populated = mapped_scores.copy()
    for b in BENCHMARKS:
        if b["name"] not in populated:
            populated[b["name"]] = 75.0  # Placeholder dummy value
    return populated


def seed_database(db: Session):
    """Seed the database with benchmarks and top LLM models from Artificial Analysis."""

    # Create benchmarks
    benchmark_objs = {}
    for b_data in BENCHMARKS:
        benchmark = db.query(Benchmark).filter(Benchmark.name == b_data["name"]).first()
        if not benchmark:
            benchmark = Benchmark(**b_data)
            db.add(benchmark)
            db.flush()
        benchmark_objs[b_data["name"]] = benchmark

    # If models already exist, we're done (seed only runs once for models)
    existing_model = db.query(Model).first()
    if existing_model:
        return

    # Fetch models from Artificial Analysis
    from services.fetch_models import get_models

    models = get_models()

    # Create models and scores dynamically
    for m in models:
        # Standardize parameters that AA does not expose.
        # Ensure we don't trip over Missing keys
        price_in = m.get("pricing", {}).get("price_1m_input_tokens", 0)
        price_out = m.get("pricing", {}).get("price_1m_output_tokens", 0)
        speed = m.get("median_time_to_first_answer_token", 0)

        tech_details = get_technical_details(
            model_name=m.get("name", ""),
            model_provider=m.get("model_creator", {}).get("name", "Unknown"),
            model_release_date=m.get("release_date", "Unknown"),
            model_parameters="Unknown",
            model_architecture="Unknown",
            model_license_type="Unknown",
            model_context_window=0,
        )

        # Extract evaluations (including composite indexes)
        evals = m.get("evaluations", {})

        # Performance metrics
        median_otps = m.get("median_output_tokens_per_second")
        median_ttft = m.get("median_time_to_first_token_seconds")
        median_ttfa = m.get("median_time_to_first_answer_token")

        # Blended pricing
        blended = m.get("pricing", {}).get("price_1m_blended_3_to_1")

        model = Model(
            name=m.get("name", "Unknown"),
            slug=m.get("slug", ""),
            provider=m.get("model_creator", {}).get("name", "Unknown"),
            model_creator_slug=m.get("model_creator", {}).get("slug", ""),
            description=m.get("slug", ""),
            parameters="Unknown",
            architecture="Unknown",
            license_type="Unknown",
            release_date=m.get("release_date"),
        )
        db.add(model)
        db.flush()

        pricing = ModelPricing(
            model_id=model.id,
            cost_per_1m_input_tokens=price_in,
            cost_per_1m_output_tokens=price_out,
            cost_per_1m_blended=blended,
        )
        db.add(pricing)

        performance = ModelPerformance(
            model_id=model.id,
            median_output_tokens_per_second=median_otps,
            median_ttft_seconds=median_ttft,
            median_ttfa_seconds=median_ttfa,
            avg_latency_ms=speed * 1000 if speed else 0,
            context_window=0,
        )
        db.add(performance)

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

        # Map scores and populate missing fields dummy values
        scores_data = populate_missing_scores(map_aa_scores(evals))

        score_list = []
        for bench_name, raw_score in scores_data.items():
            benchmark = benchmark_objs.get(bench_name)
            if not benchmark:
                continue
            normalized = normalize_score(raw_score, benchmark.max_score)
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

    db.commit()
