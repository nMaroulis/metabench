from db.database import SessionLocal
from models import Benchmark, Model
from scripts.seed_data import process_and_add_model
from sqlalchemy.orm import Session


def update_database(db: Session | None = None):
    """
    Fetch models from AA API and add them to the database if they don't exist.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # 1. Fetch existing benchmarks to map scores correctly
        benchmarks = db.query(Benchmark).all()
        benchmark_objs = {b.name: b for b in benchmarks}

        # 2. Fetch models from API
        from services.fetch_models import get_models

        api_models = get_models()

        # 3. Get existing model names to avoid duplicates
        existing_names = {m[0] for m in db.query(Model.name).all()}

        newly_added = 0
        for m_data in api_models:
            if m_data.get("name") not in existing_names:
                print(f"Adding new model: {m_data.get('name')}")
                process_and_add_model(db, m_data, benchmark_objs)
                newly_added += 1

        if newly_added > 0:
            db.commit()
            print(f"Successfully added {newly_added} new models.")
        else:
            print("No new models to add.")

    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    update_database()
