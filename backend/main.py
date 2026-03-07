"""BenchIndex – FastAPI backend entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal, Base
from api.routers import router
from seed_data import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and seed data on startup
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="BenchIndex API",
    description="Metacritic for LLMs – Aggregated benchmark scores, leaderboards, and model comparison",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "BenchIndex API",
        "version": "1.0.0",
        "docs": "/docs",
        "description": "Metacritic for LLMs",
    }
