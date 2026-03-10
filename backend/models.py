from datetime import UTC, datetime

from database import Base
from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship


class Model(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, default="", index=True)
    provider = Column(String, nullable=False)
    model_creator_slug = Column(String, default="")
    open_router_id = Column(String, default="")
    description = Column(Text, default="")
    parameters = Column(String, default="")  # e.g., "70B", "8x7B"
    architecture = Column(String, default="")
    license_type = Column(String, default="")
    release_date = Column(String, default="")
    overall_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    scores = relationship("BenchmarkScore", back_populates="model", cascade="all, delete-orphan")
    pricing = relationship(
        "ModelPricing",
        back_populates="model",
        uselist=False,
        cascade="all, delete-orphan",
    )
    performance = relationship(
        "ModelPerformance",
        back_populates="model",
        uselist=False,
        cascade="all, delete-orphan",
    )
    technical_specs = relationship("TechnicalSpec", back_populates="model", cascade="all, delete-orphan")


class ModelPricing(Base):
    __tablename__ = "model_pricing"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False, unique=True)
    cost_per_1m_input_tokens = Column(Float, nullable=True)
    cost_per_1m_output_tokens = Column(Float, nullable=True)
    cost_per_1m_blended = Column(Float, nullable=True)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    model = relationship("Model", back_populates="pricing")


class ModelPerformance(Base):
    __tablename__ = "model_performance"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False, unique=True)
    median_output_tokens_per_second = Column(Float, nullable=True)
    median_ttft_seconds = Column(Float, nullable=True)
    median_ttfa_seconds = Column(Float, nullable=True)
    avg_latency_ms = Column(Float, nullable=True)
    context_window = Column(Integer, nullable=True)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    model = relationship("Model", back_populates="performance")


class TechnicalSpec(Base):
    __tablename__ = "technical_specs"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    section = Column(String, nullable=False)  # e.g., "Model Size"
    label = Column(String, nullable=False)  # e.g., "Total Parameters"
    value = Column(String, nullable=False)  # e.g., "70B"

    model = relationship("Model", back_populates="technical_specs")


class Benchmark(Base):
    __tablename__ = "benchmarks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, nullable=False)  # e.g., "reasoning", "coding", "math", "knowledge"
    type = Column(String, default="benchmark")  # "benchmark" = actual test, "index" = composite score from a website
    description = Column(Text, default="")
    max_score = Column(Float, default=100.0)
    weight = Column(Float, default=1.0)  # Weight for overall score computation
    source = Column(String, default="")

    scores = relationship("BenchmarkScore", back_populates="benchmark", cascade="all, delete-orphan")


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
    submitted_at = Column(DateTime, default=lambda: datetime.now(UTC))
    evaluation_data = Column(JSON, nullable=True)
