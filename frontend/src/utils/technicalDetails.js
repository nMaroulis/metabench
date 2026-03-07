export function getTechnicalDetails(model) {
    if (!model) return [];
    const name = (model.name || '').toLowerCase();

    // Default template structured by the user's requested 20 categories
    const details = {
        "Core Model Identity": {
            "Model Name": model.name || 'Unknown',
            "Organization": model.provider || 'Unknown',
            "Release Date": model.release_date || 'Unknown',
            "Model Family": name.includes('llama') ? 'LLaMA' : name.includes('gpt') ? 'GPT' : name.includes('qwen') ? 'Qwen' : name.includes('mistral') ? 'Mistral' : name.includes('claude') ? 'Claude' : name.includes('gemini') ? 'Gemini' : name.includes('deepseek') ? 'DeepSeek' : 'Custom / Unspecified',
            "Model Type": 'Dense Transformer',
            "License": model.license_type || 'Unknown',
            "Multimodal Support": 'No',
        },
        "Model Size": {
            "Total Parameters": model.parameters || 'Unknown',
            "Active Parameters per Token": 'N/A (Dense)',
            "Number of Experts": 'N/A',
            "Parameter Density": 'Dense',
        },
        "Transformer Architecture": {
            "Architecture Type": model.architecture || 'Decoder-only Transformer',
            "Layers": 'Unknown',
            "Hidden Size (d_model)": 'Unknown',
            "FFN Intermediate Size": 'Unknown',
        },
        "Attention Architecture": {
            "Attention Type": 'Multi-Head Attention (MHA)',
            "Number of Attention Heads": 'Unknown',
            "Number of KV Heads": 'Unknown',
            "Sliding Window Attention": 'No',
        },
        "Positional Encoding": {
            "Type": 'RoPE (Rotary Position Embedding)',
            "RoPE Scaling Method": 'Unknown',
        },
        "Context Window": {
            "Maximum Context Length": model.context_window ? `${model.context_window.toLocaleString()} tokens` : 'Unknown',
            "KV Cache Compression": 'None',
        },
        "Feed Forward Network Details": {
            "Activation Function": 'SwiGLU',
            "FFN Expansion Ratio": 'x4 (Standard)',
        },
        "Tokenization": {
            "Tokenizer Type": 'BPE (Byte-Pair Encoding)',
            "Vocabulary Size": 'Unknown',
        },
        "Training Dataset": {
            "Total Training Tokens": 'Unknown',
            "Dataset Composition": 'Web, Books, Code, Math',
        },
        "Training Process": {
            "Pretraining Objective": 'Next token prediction',
            "Optimizer": 'AdamW',
            "Mixed Precision Type": 'BF16',
        },
        "Post-Training": {
            "Fine-Tuning": 'SFT + RLHF (PPO / DPO)',
        },
        "Quantization Support": {
            "Native Precision": 'BF16',
            "Supported Formats": 'Not officially specified',
        },
        "Inference Characteristics": {
            "Memory Footprint": 'Unknown',
        },
        "Hardware Requirements": {
            "Minimum VRAM": 'Unknown',
            "Distributed Inference": 'Required for >70B',
        },
        "System / Infrastructure": {
            "Optimizations": 'FlashAttention, Continuous Batching, PagedAttention',
        }
    };

    // Override based on model family
    if (name.includes('gpt-4')) {
        details["Core Model Identity"]["Model Type"] = "Mixture-of-Experts (MoE)";
        details["Core Model Identity"]["Multimodal Support"] = "Yes (Native Vision/Audio)";
        details["Model Size"]["Active Parameters per Token"] = "~200B";
        details["Model Size"]["Number of Experts"] = "16 (Estimated)";
        details["Model Size"]["Parameter Density"] = "Sparse MoE";
        details["Attention Architecture"]["Attention Type"] = "Grouped Query Attention (GQA)";
        details["Tokenization"]["Tokenizer Type"] = "tiktoken (o200k_base)";
        details["Tokenization"]["Vocabulary Size"] = "200,000";
        details["Training Dataset"]["Total Training Tokens"] = "~15T+ tokens";
        details["Quantization Support"]["Supported Formats"] = "Proprietary (API only)";
        details["Post-Training"]["Fine-Tuning"] = "RLHF, RL, RLAIF";
    } else if (name.includes('deepseek-r1') || name.includes('deepseek-v3')) {
        details["Core Model Identity"]["Model Type"] = "Mixture-of-Experts (MoE)";
        details["Model Size"]["Total Parameters"] = "671B";
        details["Model Size"]["Active Parameters per Token"] = "37B";
        details["Model Size"]["Number of Experts"] = "256";
        details["Model Size"]["Parameter Density"] = "Highly Sparse MoE";
        details["Transformer Architecture"]["Layers"] = "61";
        details["Transformer Architecture"]["Hidden Size (d_model)"] = "7168";
        details["Attention Architecture"]["Attention Type"] = "Multi-head Latent Attention (MLA)";
        details["Attention Architecture"]["Number of Attention Heads"] = "128";
        details["Positional Encoding"]["Type"] = "YaRN RoPE";
        details["Tokenization"]["Tokenizer Type"] = "Byte-level BPE";
        details["Tokenization"]["Vocabulary Size"] = "129,280";
        details["Training Dataset"]["Total Training Tokens"] = "14.8T tokens";
        details["Training Process"]["Optimizer"] = "AdamW";
        details["Training Process"]["Mixed Precision Type"] = "FP8 Mixed Precision";
        details["Post-Training"]["Fine-Tuning"] = name.includes('r1') ? "Pure RL (GRPO)" : "SFT + DPO";
        details["System / Infrastructure"]["Optimizations"] = "FlashAttention-3, MLA, FP8 native";
        details["Quantization Support"]["Supported Formats"] = "AWQ, GGUF, EXL2, FP8";
    } else if (name.includes('llama 3') || name.includes('llama-3')) {
        const is70b = name.includes('70b');
        const is405b = name.includes('405b');
        details["Model Size"]["Total Parameters"] = is405b ? "405B" : is70b ? "70B" : "8B";
        details["Transformer Architecture"]["Layers"] = is405b ? "126" : is70b ? "80" : "32";
        details["Transformer Architecture"]["Hidden Size (d_model)"] = is405b ? "16384" : is70b ? "8192" : "4096";
        details["Attention Architecture"]["Attention Type"] = "Grouped Query Attention (GQA)";
        details["Positional Encoding"]["Type"] = "RoPE (Theta: 500k)";
        details["Tokenization"]["Tokenizer Type"] = "tiktoken (Llama 3)";
        details["Tokenization"]["Vocabulary Size"] = "128,256";
        details["Training Dataset"]["Total Training Tokens"] = "15T tokens";
        details["Quantization Support"]["Supported Formats"] = "GGUF, AWQ, GPTQ, EXL2";
        details["Inference Characteristics"]["Memory Footprint"] = is405b ? "~800GB (FP16)" : is70b ? "~140GB (FP16)" : "~16GB (FP16)";
        details["Post-Training"]["Fine-Tuning"] = "SFT, Rejection Sampling, PPO/DPO";
    } else if (name.includes('claude 3')) {
        details["Core Model Identity"]["Multimodal Support"] = "Yes (Vision)";
        details["Training Dataset"]["Total Training Tokens"] = "Proprietary High-Quality Mix";
        details["Quantization Support"]["Supported Formats"] = "Proprietary (API only)";
        details["Post-Training"]["Fine-Tuning"] = "Constitutional AI, SFT, RLHF";
        details["Attention Architecture"]["Attention Type"] = "Grouped Query Attention (GQA) / MQA";
    } else if (name.includes('gemini')) {
        details["Core Model Identity"]["Model Type"] = "Mixture-of-Experts (MoE)";
        details["Core Model Identity"]["Multimodal Support"] = "Yes (Interleaved Text, Vision, Audio)";
        details["Attention Architecture"]["Attention Type"] = "Multimodal Block GQA";
        details["Tokenization"]["Tokenizer Type"] = "SentencePiece (Multimodal)";
        details["Training Dataset"]["Total Training Tokens"] = "Google Proprietary Multimodal Data";
        details["Hardware Requirements"]["Minimum VRAM"] = "TPU v5p / TPU v5e Native";
        details["System / Infrastructure"]["Optimizations"] = "Ring Attention, Blockwise Compute Context";
    } else if (name.includes('o1') || name.includes('o3')) {
        details["Core Model Identity"]["Model Type"] = "RL Reasoning Model (MoE)";
        details["Core Model Identity"]["Reasoning Variant"] = "Yes (Chain-of-Thought / RL Search)";
        details["Training Process"]["Pretraining Objective"] = "RL Search, Next token prediction";
        details["Post-Training"]["Fine-Tuning"] = "Massive RL, Value Networks";
        details["Quantization Support"]["Supported Formats"] = "Proprietary (API only)";
    }

    // Format as array of categories
    return Object.entries(details).map(([title, facts]) => ({
        title,
        facts: Object.entries(facts).map(([label, value]) => ({ label, value }))
    }));
}
