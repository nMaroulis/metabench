"""
Update Script for MetaBench Database
Runs all scrapers to fetch the latest model pricing and scores,
then updates the SQLite database.
"""

from database import SessionLocal
from models import Model, Benchmark, BenchmarkScore, ModelPricing, ModelPerformance
from normalization import (
    normalize_score,
    compute_weighted_overall_score,
    DEFAULT_WEIGHTS,
)

from scrapers.openrouter import get_pricing_map
from scrapers.chatbot_arena import fetch_arena_elo_ratings


def update_database():
    """Fetch live data and update the database."""
    print("--- Starting Live Data Update ---")
    db = SessionLocal()
    try:
        # 1. Fetch live OpenRouter pricing
        print("Fetching OpenRouter pricing...")
        pricing_data = get_pricing_map()

        # 2. Fetch live Chatbot Arena Elo ratings
        print("Fetching Chatbot Arena Elo ratings...")
        elo_data = fetch_arena_elo_ratings()

        # 3. Process Models in DB
        models = db.query(Model).all()
        for model in models:
            canonical_name = model.name

            # --- Update Pricing ---
            if canonical_name in pricing_data:
                pricing = pricing_data[canonical_name]

                # Make sure the relationship exists
                if not model.pricing:
                    model.pricing = ModelPricing(model_id=model.id)
                    db.add(model.pricing)

                if pricing["cost_per_1m_input_tokens"] is not None:
                    model.pricing.cost_per_1m_input_tokens = pricing[
                        "cost_per_1m_input_tokens"
                    ]
                if pricing["cost_per_1m_output_tokens"] is not None:
                    model.pricing.cost_per_1m_output_tokens = pricing[
                        "cost_per_1m_output_tokens"
                    ]

                # Update blended cost
                price_in = model.pricing.cost_per_1m_input_tokens
                price_out = model.pricing.cost_per_1m_output_tokens
                if price_in is not None and price_out is not None:
                    model.pricing.cost_per_1m_blended = round(
                        (price_in * 0.5 + price_out * 0.5), 4
                    )
                elif price_in is not None or price_out is not None:
                    model.pricing.cost_per_1m_blended = price_in or price_out or 0

                if pricing["context_window"] is not None:
                    # Context window goes on performance in our new schema
                    if not model.performance:
                        model.performance = ModelPerformance(model_id=model.id)
                        db.add(model.performance)
                    model.performance.context_window = pricing["context_window"]

                # Link OpenRouter ID if empty
                if not model.open_router_id:
                    model.open_router_id = pricing["openrouter_id"]

            # --- Update Arena Elo Score ---
            if canonical_name in elo_data:
                new_elo = elo_data[canonical_name]
                # Find Arena Elo benchmark
                arena_bench = (
                    db.query(Benchmark).filter(Benchmark.name == "Arena Elo").first()
                )
                if arena_bench:
                    # Look up existing score or create new one
                    score_entry = (
                        db.query(BenchmarkScore)
                        .filter(
                            BenchmarkScore.model_id == model.id,
                            BenchmarkScore.benchmark_id == arena_bench.id,
                        )
                        .first()
                    )

                    normalized_elo = normalize_score(new_elo, arena_bench.max_score)

                    if score_entry:
                        score_entry.raw_score = new_elo
                        score_entry.normalized_score = normalized_elo
                    else:
                        score_entry = BenchmarkScore(
                            model_id=model.id,
                            benchmark_id=arena_bench.id,
                            raw_score=new_elo,
                            normalized_score=normalized_elo,
                            language="en",
                        )
                        db.add(score_entry)

            db.flush()

            # --- Recalculate Overall Score ---
            all_scores = (
                db.query(BenchmarkScore)
                .filter(BenchmarkScore.model_id == model.id)
                .all()
            )
            score_list = [
                {
                    "benchmark_name": score.benchmark.name,
                    "normalized_score": score.normalized_score,
                }
                for score in all_scores
            ]
            overall, confidence = compute_weighted_overall_score(
                score_list, DEFAULT_WEIGHTS
            )
            model.overall_score = overall
            model.confidence = confidence

        db.commit()
        print("--- Live Data Update Completed Successfully ---")

    except Exception as e:
        db.rollback()
        print(f"Error during database update: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    update_database()
