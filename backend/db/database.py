from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = "sqlite:///./metabench.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def is_database_populated():
    """
    Check if the database has already been seeded with models.
    Uses raw SQL to avoid circular imports with models.py.
    """

    db = SessionLocal()
    try:
        # Check if models table exists and has at least one row
        # This is more robust than just checking for file existence
        db.execute(text("SELECT 1 FROM models LIMIT 1")).fetchone()
        return True
    except Exception:
        # Table might not exist yet
        return False
    finally:
        db.close()
