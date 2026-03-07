from pydantic import BaseModel, Field
from datetime import datetime


# ---------- Model schemas ----------
class ModelBase(BaseModel):
    name: str
    provider: str
    description: str = ""
    parameters: str = ""
    architecture: str = ""
    license_type: str = ""
    release_date: str = ""
    cost_per_1m_input_tokens: float | None = None
    cost_per_1m_output_tokens: float | None = None
    avg_latency_ms: float | None = None
    context_window: int | None = None


class ModelOut(ModelBase):
    id: int
    overall_score: float = 0.0
    confidence: float = 0.0
    technical_details: list | None = None

    class Config:
        from_attributes = True


class ModelDetail(ModelOut):
    scores: list["BenchmarkScoreOut"] = []

    class Config:
        from_attributes = True


# ---------- Benchmark schemas ----------
class BenchmarkBase(BaseModel):
    name: str
    category: str
    description: str = ""
    max_score: float = 100.0
    weight: float = 1.0
    source: str = ""


class BenchmarkOut(BenchmarkBase):
    id: int

    class Config:
        from_attributes = True


# ---------- BenchmarkScore schemas ----------
class BenchmarkScoreBase(BaseModel):
    raw_score: float
    normalized_score: float
    language: str = "en"
    evaluation_date: str = ""
    notes: str = ""


class BenchmarkScoreOut(BenchmarkScoreBase):
    id: int
    model_id: int
    benchmark_id: int
    benchmark_name: str = ""
    benchmark_category: str = ""

    class Config:
        from_attributes = True


# ---------- Comparison schemas ----------
class ComparisonRequest(BaseModel):
    model_names: list[str] = Field(..., min_length=2, max_length=5)


class ModelComparisonItem(BaseModel):
    model: ModelOut
    scores: list[BenchmarkScoreOut]


class ComparisonResponse(BaseModel):
    models: list[ModelComparisonItem]
    benchmarks: list[BenchmarkOut]


# ---------- Leaderboard schemas ----------
class LeaderboardEntry(BaseModel):
    rank: int
    model: ModelOut
    score: float
    benchmark_name: str | None = None


class LeaderboardResponse(BaseModel):
    task: str | None = None
    language: str | None = None
    entries: list[LeaderboardEntry]


# ---------- Community Submission schemas ----------
class CommunitySubmissionCreate(BaseModel):
    model_name: str
    benchmark_name: str
    score: float
    language: str = "en"
    submitter: str = "anonymous"
    evidence_url: str = ""
    notes: str = ""
    evaluation_data: dict | None = None


class CommunitySubmissionOut(CommunitySubmissionCreate):
    id: int
    status: str = "pending"
    submitted_at: datetime | None = None

    class Config:
        from_attributes = True


# ---------- Export schemas ----------
class ExportParams(BaseModel):
    format: str = "json"  # json or csv
