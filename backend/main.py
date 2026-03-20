import os
from contextlib import asynccontextmanager
from urllib.parse import urlparse

from api.routers import router
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from db.database import Base, SessionLocal, check_db_exists, engine
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from scripts.seed_data import seed_database
from scripts.update_db import update_database
from utils.logger import get_logger

logger = get_logger("main")

FRONTEND_ADDRESS = os.getenv("FRONTEND_ADDRESS", "http://localhost:5173")
_parsed_frontend = urlparse(FRONTEND_ADDRESS).netloc
ALLOWED_HOSTS = {_parsed_frontend}
if "localhost" in _parsed_frontend:
    ALLOWED_HOSTS.add(_parsed_frontend.replace("localhost", "127.0.0.1"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Cache
    FastAPICache.init(InMemoryBackend())
    logger.info("FastAPI-Cache Initialized with InMemoryBackend")

    db = SessionLocal()
    try:
        if check_db_exists():
            logger.info("Database exists, running update_database")
            update_database(db)
        else:
            logger.info("Database doesn't exist, creating tables and seeding data")
            Base.metadata.create_all(bind=engine)
            seed_database(db)
    finally:
        db.close()

    # Scheduling the background updates
    scheduler = BackgroundScheduler()
    scheduler.add_job(update_database, trigger=CronTrigger(hour="0,6,12,18", minute=0, second=0))
    scheduler.start()

    logger.info("Background Scheduler Started")

    yield

    # Shutdown scheduler when app exits
    scheduler.shutdown()


app = FastAPI(
    title="MetaBench API",
    description="Metacritic for LLMs - Aggregated benchmark scores, leaderboards, and model comparison",
    version="1.0.0",
    lifespan=lifespan,
)

# === CORS Middleware ===
# Only allow all origins for /docs
app.add_middleware(
    CORSMiddleware,  # type: ignore
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# === Middleware to restrict /api to frontend only ===
@app.middleware("http")
async def restrict_api_to_frontend(request: Request, call_next):
    if request.url.path.startswith("/api"):
        origin = request.headers.get("origin") or request.headers.get("referer")

        if not origin:
            raise HTTPException(status_code=403, detail="Forbidden")
        # Just parse the incoming origin and check the set
        try:
            is_valid = urlparse(origin).netloc in ALLOWED_HOSTS
        except Exception:
            is_valid = False
        if not is_valid:
            logger.warning(f"Rejected origin: {origin}")
            raise HTTPException(status_code=403, detail="Forbidden")
    return await call_next(request)


# === Routers ===
app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "MetaBench API",
        "version": "1.0.0",
        "docs": "/docs",
        "description": "Metacritic for LLMs",
    }
