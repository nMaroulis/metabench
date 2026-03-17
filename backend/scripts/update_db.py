"""Update database script for MetaBench.

This module handles incremental updates to the database by fetching the latest
model data from Artificial Analysis API and synchronizing it with our local
database. It implements a three-way sync strategy:
1. Add new models with enrichment
2. Update existing active models
3. Deactivate models no longer available in the API
"""

from db.database import SessionLocal
from models import Benchmark, Model
from scripts.seed_data import process_and_add_model, update_model_benchmarks
from services.fetch_models import get_models
from sqlalchemy.orm import Session
from utils.logger import get_logger

logger = get_logger("update_db")


def update_database(db: Session | None = None) -> None:
    """
    Update the database with models from AA API.

    This function performs a comprehensive synchronization between the
    Artificial Analysis API and our local database. It ensures our data
    stays current while preserving historical information.

    The update strategy:
    1. NEW MODELS: Models in API but not in DB are added with full enrichment
    2. EXISTING MODELS: Active models in both API and DB get updated scores/data
    3. STALE MODELS: Models in DB but not in API are marked inactive (is_active=0)

    This approach allows us to:
    - Always have the latest benchmark scores
    - Preserve historical data for models that are no longer available
    - Track when models become unavailable

    Args:
        db (Session | None): Optional SQLAlchemy session. If None, creates a new one.

    Side Effects:
        - Creates new model records with enrichment
        - Updates existing model data (benchmarks, pricing, performance)
        - Sets is_active=0 for models not in current API response
        - Commits all changes to the database
    """
    # Handle database session - create one if not provided
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # 1. Fetch existing benchmarks to map scores correctly
        benchmarks = db.query(Benchmark).all()
        benchmark_objs: dict[str, Benchmark] = {str(b.name): b for b in benchmarks}

        # 2. Fetch models from API
        api_models = get_models()

        # Track all model names from API
        # We'll use this set to identify stale models (in DB but not in API)
        api_model_names = {m.get("name") for m in api_models}

        # 3. Process each model from API
        newly_added_model: list[str] = []
        updated = 0

        for m_data in api_models:
            model_name = m_data.get("name")
            existing_model = db.query(Model).filter(Model.name == model_name).first()

            if not existing_model:
                # NEW MODEL: Not in the DB yet
                # Add it with full enrichment (LLM call for missing metadata)
                process_and_add_model(db, m_data, benchmark_objs)
                newly_added_model.append(model_name)
            else:
                # EXISTING MODEL: Already in our DB
                # Only update if it's currently active
                if existing_model.is_active == 1:
                    # Use lightweight update - only benchmarks/pricing/performance
                    # Does NOT touch metadata (parameters, architecture, technical specs)
                    update_model_benchmarks(db, existing_model, m_data, benchmark_objs)
                    updated += 1
                # Note: We don't update inactive models to preserve their historical state

        # 4. Deactivate models not in the fetched data
        # These are models that were previously available but are no longer
        # returned by the AA API (possibly deprecated or removed)
        stale_models = db.query(Model).filter(Model.name.notin_(api_model_names), Model.is_active == 1).all()

        deactivated_models: list[str] = []
        for model in stale_models:
            model.is_active = 0  # Mark as inactive but keep the data
            deactivated_models.append(str(model.name))

        # Commit all changes in a single transaction
        # This ensures consistency - either all updates succeed or none do
        db.commit()

        # Print summary of what changed
        logger.simple_print("\n" + "=" * 50)
        logger.simple_print("DATABASE UPDATE SUMMARY")
        logger.simple_print("=" * 50)

        logger.simple_print(
            f"\n📦 Added {len(newly_added_model)} new model(s):",
        )
        if newly_added_model:
            for name in newly_added_model:
                logger.simple_print(f"   • {name}")
        else:
            logger.simple_print("   (none)")

        logger.simple_print(f"\n🔄 Updated {updated} existing model(s)")

        logger.simple_print(f"\n🚫 Deactivated {len(deactivated_models)} stale model(s):")
        if deactivated_models:
            for name in deactivated_models:
                logger.simple_print(f"   • {name}")
        else:
            logger.simple_print("   (none)")

        logger.simple_print("\n" + "=" * 50)

    finally:
        # Clean up database session if we created it
        if should_close:
            db.close()


if __name__ == "__main__":
    # Entry point when running script directly
    # Example: python backend/scripts/update_db.py
    update_database()
