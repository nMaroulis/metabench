from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class Model(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    provider = Column(String, nullable=False)
    open_router_id = Column(String, default="")
    description = Column(Text, default="")
    parameters = Column(String, default="")  # e.g., "70B", "8x7B"
    architecture = Column(String, default="")
    license_type = Column(String, default="")
    release_date = Column(String, default="")
    cost_per_1m_input_tokens = Column(Float, nullable=True)
    cost_per_1m_output_tokens = Column(Float, nullable=True)
    avg_latency_ms = Column(Float, nullable=True)
    context_window = Column(Integer, nullable=True)
    overall_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    scores = relationship(
        "BenchmarkScore", back_populates="model", cascade="all, delete-orphan"
    )


class Benchmark(Base):
    __tablename__ = "benchmarks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    category = Column(
        String, nullable=False
    )  # e.g., "reasoning", "coding", "math", "knowledge"
    description = Column(Text, default="")
    max_score = Column(Float, default=100.0)
    weight = Column(Float, default=1.0)  # Weight for overall score computation
    source = Column(String, default="")

    scores = relationship(
        "BenchmarkScore", back_populates="benchmark", cascade="all, delete-orphan"
    )


class BenchmarkScore(Base):
    __tablename__ = "benchmark_scores"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    benchmark_id = Column(Integer, ForeignKey("benchmarks.id"), nullable=False)
    raw_score = Column(Float, nullable=False)
    normalized_score = Column(Float, nullable=False)  # 0-100
    language = Column(String, default="en")
    evaluation_date = Column(String, default="")
    notes = Column(Text, default="")

    model = relationship("Model", back_populates="scores")
    benchmark = relationship("Benchmark", back_populates="scores")


class CommunitySubmission(Base):
    __tablename__ = "community_submissions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, nullable=False)
    benchmark_name = Column(String, nullable=False)
    score = Column(Float, nullable=False)
    language = Column(String, default="en")
    submitter = Column(String, default="anonymous")
    evidence_url = Column(String, default="")
    notes = Column(Text, default="")
    status = Column(String, default="pending")  # pending, approved, rejected
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    evaluation_data = Column(JSON, nullable=True)
