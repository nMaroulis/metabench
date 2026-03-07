from models import Model
from database import SessionLocal


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
        details["Core Model Identity"]["Multimodal Support"] = (
            "Yes (Native Vision/Audio)"
        )
        details["Model Size"]["Active Parameters per Token"] = "~200B"
        details["Model Size"]["Number of Experts"] = "16 (Estimated)"
        details["Model Size"]["Parameter Density"] = "Sparse MoE"
        details["Attention Architecture"]["Attention Type"] = (
            "Grouped Query Attention (GQA)"
        )
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
        details["Attention Architecture"]["Attention Type"] = (
            "Multi-head Latent Attention (MLA)"
        )
        details["Attention Architecture"]["Number of Attention Heads"] = "128"
        details["Positional Encoding"]["Type"] = "YaRN RoPE"
        details["Tokenization"]["Tokenizer Type"] = "Byte-level BPE"
        details["Tokenization"]["Vocabulary Size"] = "129,280"
        details["Training Dataset"]["Total Training Tokens"] = "14.8T tokens"
        details["Training Process"]["Optimizer"] = "AdamW"
        details["Training Process"]["Mixed Precision Type"] = "FP8 Mixed Precision"
        details["Post-Training"]["Fine-Tuning"] = (
            "Pure RL (GRPO)" if "r1" in name else "SFT + DPO"
        )
        details["System / Infrastructure"]["Optimizations"] = (
            "FlashAttention-3, MLA, FP8 native"
        )
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
        details["Attention Architecture"]["Attention Type"] = (
            "Grouped Query Attention (GQA)"
        )
        details["Positional Encoding"]["Type"] = "RoPE (Theta: 500k)"
        details["Tokenization"]["Tokenizer Type"] = "tiktoken (Llama)"
        details["Tokenization"]["Vocabulary Size"] = "128,256"
        details["Training Dataset"]["Total Training Tokens"] = "15T+ tokens"
        details["Quantization Support"]["Supported Formats"] = "GGUF, AWQ, GPTQ, EXL2"
        details["Inference Characteristics"]["Memory Footprint"] = (
            "~800GB (FP16)"
            if is400b or is405b
            else "~140GB (FP16)"
            if is70b or is109b
            else "~16GB (FP16)"
        )
        details["Post-Training"]["Fine-Tuning"] = "SFT, Rejection Sampling, PPO/DPO"
    elif "claude 3" in name:
        details["Core Model Identity"]["Multimodal Support"] = "Yes (Vision)"
        details["Training Dataset"]["Total Training Tokens"] = (
            "Proprietary High-Quality Mix"
        )
        details["Quantization Support"]["Supported Formats"] = "Proprietary (API only)"
        details["Post-Training"]["Fine-Tuning"] = "Constitutional AI, SFT, RLHF"
        details["Attention Architecture"]["Attention Type"] = (
            "Grouped Query Attention (GQA) / MQA"
        )
    elif "gemini" in name:
        details["Core Model Identity"]["Model Type"] = "Mixture-of-Experts (MoE)"
        details["Core Model Identity"]["Multimodal Support"] = (
            "Yes (Interleaved Text, Vision, Audio)"
        )
        details["Attention Architecture"]["Attention Type"] = "Multimodal Block GQA"
        details["Tokenization"]["Tokenizer Type"] = "SentencePiece (Multimodal)"
        details["Training Dataset"]["Total Training Tokens"] = (
            "Google Proprietary Multimodal Data"
        )
        details["Hardware Requirements"]["Minimum VRAM"] = "TPU v5p / TPU v5e Native"
        details["System / Infrastructure"]["Optimizations"] = (
            "Ring Attention, Blockwise Compute Context"
        )
    elif "o1" in name or "o3" in name:
        details["Core Model Identity"]["Model Type"] = "RL Reasoning Model (MoE)"
        details["Core Model Identity"]["Reasoning Variant"] = (
            "Yes (Chain-of-Thought / RL Search)"
        )
        details["Training Process"]["Pretraining Objective"] = (
            "RL Search, Next token prediction"
        )
        details["Post-Training"]["Fine-Tuning"] = "Massive RL, Value Networks"
        details["Quantization Support"]["Supported Formats"] = "Proprietary (API only)"

    # Format as array of categories strictly matching frontend
    output = []
    for title, facts in details.items():
        fact_list = [
            {"label": label, "value": str(value)} for label, value in facts.items()
        ]
        output.append({"title": title, "facts": fact_list})

    return output


def migrate_db():
    print("Connecting to DB...")
    db = SessionLocal()

    try:
        # Check if table exists
        models = db.query(Model).all()
        print(f"Found {len(models)} models to migrate.")

        migrated_count = 0
        for model in models:
            # Generate the technical details
            new_details = get_technical_details(
                model_name=model.name,
                model_provider=model.provider,
                model_release_date=model.release_date,
                model_parameters=model.parameters,
                model_architecture=model.architecture,
                model_license_type=model.license_type,
                model_context_window=model.context_window,
            )

            # Update
            model.technical_details = new_details
            migrated_count += 1

        db.commit()
        print(
            f"Successfully migrated {migrated_count} models with technical_details JSON."
        )
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    migrate_db()
