from contextlib import asynccontextmanager

from api.routers import router
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from database import Base, SessionLocal, engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scripts.seed_data import seed_database
from update_db import update_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and seed data on startup
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Scheduling the background updates
    scheduler = BackgroundScheduler()
    # Run twice a day (e.g. at 00:00 and 12:00)
    scheduler.add_job(update_database, trigger=CronTrigger(hour="0,12", minute=0))
    scheduler.start()

    print("--- Background Scheduler Started ---")

    yield

    # Shutdown scheduler when app exits
    scheduler.shutdown()


app = FastAPI(
    title="MetaBench API",
    description="Metacritic for LLMs - Aggregated benchmark scores, leaderboards, and model comparison",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,  # type: ignore
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "MetaBench API",
        "version": "1.0.0",
        "docs": "/docs",
        "description": "Metacritic for LLMs",
    }
