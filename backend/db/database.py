import os

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = "sqlite:///storage/metabench.db"

# Configure engine with timeout for waiting on locks
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30,  # Wait up to 30 seconds for locks
    },
)


# Enable WAL mode for better concurrency on every connection
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_exists() -> bool:
    """
    Check if the database file exists.
    """
    db_path = DATABASE_URL.replace("sqlite:///", "")
    # Ensure the storage directory exists
    storage_dir = os.path.dirname(db_path)
    if storage_dir and not os.path.exists(storage_dir):
        os.makedirs(storage_dir, exist_ok=True)
    return os.path.exists(db_path)


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
