from pydantic import BaseModel, Field, computed_field
from datetime import datetime


class ModelPricingOut(BaseModel):
    cost_per_1m_input_tokens: float | None = None
    cost_per_1m_output_tokens: float | None = None
    cost_per_1m_blended: float | None = None

    class Config:
        from_attributes = True


class ModelPerformanceOut(BaseModel):
    median_output_tokens_per_second: float | None = None
    median_ttft_seconds: float | None = None
    median_ttfa_seconds: float | None = None
    avg_latency_ms: float | None = None
    context_window: int | None = None

    class Config:
        from_attributes = True


class TechnicalSpecOut(BaseModel):
    section: str
    label: str
    value: str

    class Config:
        from_attributes = True


# ---------- Model schemas ----------
class ModelBase(BaseModel):
    name: str
    slug: str = ""
    provider: str
    model_creator_slug: str = ""
    description: str = ""
    parameters: str = ""
    architecture: str = ""
    license_type: str = ""
    release_date: str = ""


class ModelOut(ModelBase):
    id: int
    overall_score: float = 0.0
    confidence: float = 0.0

    pricing: ModelPricingOut | None = None
    performance: ModelPerformanceOut | None = None
    technical_specs: list[TechnicalSpecOut] = Field(default_factory=list, exclude=True)

    @computed_field
    def technical_details(self) -> list[dict] | None:
        """Reconstruct the JSON format expected by the frontend TechnicalDetails.jsx"""
        if not self.technical_specs:
            return None

        # Group by section
        grouped = {}
        for spec in self.technical_specs:
            if spec.section not in grouped:
                grouped[spec.section] = []
            grouped[spec.section].append({"label": spec.label, "value": spec.value})

        # Format as requested array of {title, facts}
        output = []
        for section, facts in grouped.items():
            output.append({"title": section, "facts": facts})

        return output

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
    type: str = "benchmark"  # "benchmark" or "index"
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
    benchmark_type: str = "benchmark"

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
