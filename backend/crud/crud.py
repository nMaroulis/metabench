import models as db_models
import schemas
from services.scoring import (
    DEFAULT_WEIGHTS,
    compute_weighted_overall_score,
)
from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

# ---------- Models ----------


def get_models(db: Session, skip: int = 0, limit: int = 100, provider: str | None = None):
    query = db.query(db_models.Model).filter(db_models.Model.is_active == 1)
    if provider:
        query = query.filter(db_models.Model.provider == provider)
    return query.order_by(desc(db_models.Model.overall_score)).offset(skip).limit(limit).all()


def get_model_by_name(db: Session, name: str):
    return db.query(db_models.Model).filter(db_models.Model.name == name).first()


def get_model_by_id(db: Session, model_id: int):
    return db.query(db_models.Model).filter(db_models.Model.id == model_id).first()


def get_model_detail(db: Session, name: str):
    model = (
        db.query(db_models.Model)
        .options(joinedload(db_models.Model.scores).joinedload(db_models.BenchmarkScore.benchmark))
        .filter(db_models.Model.name == name)
        .first()
    )
    return model


# ---------- Benchmarks ----------


def get_benchmarks(db: Session):
    return db.query(db_models.Benchmark).all()


def get_benchmark_by_name(db: Session, name: str):
    return db.query(db_models.Benchmark).filter(db_models.Benchmark.name == name).first()


# ---------- Scores ----------


def get_scores_for_model(db: Session, model_name: str, language: str | None = None):
    model = get_model_by_name(db, model_name)
    if not model:
        return []
    query = db.query(db_models.BenchmarkScore).filter(db_models.BenchmarkScore.model_id == model.id)
    if language:
        query = query.filter(db_models.BenchmarkScore.language == language)
    scores = query.all()
    # Enrich with benchmark info
    result = []
    for s in scores:
        benchmark = db.query(db_models.Benchmark).get(s.benchmark_id)
        result.append(
            {
                "id": s.id,
                "model_id": s.model_id,
                "benchmark_id": s.benchmark_id,
                "benchmark_name": benchmark.name if benchmark else "",
                "benchmark_category": benchmark.category if benchmark else "",
                "raw_score": s.raw_score,
                "normalized_score": s.normalized_score,
                "benchmark_type": benchmark.type if benchmark else "benchmark",
                "language": s.language,
                "evaluation_date": s.evaluation_date,
                "notes": s.notes,
            }
        )
    return result


# ---------- Comparison ----------


def compare_models(db: Session, model_names: list[str]):
    results = []
    benchmarks = get_benchmarks(db)
    for name in model_names:
        model = get_model_by_name(db, name)
        if model:
            scores = get_scores_for_model(db, name)
            results.append(
                {
                    "model": model,
                    "scores": scores,
                }
            )
    return {"models": results, "benchmarks": benchmarks}


# ---------- Leaderboard ----------


def get_leaderboard(
    db: Session,
    task: str | None = None,
    language: str | None = None,
    limit: int = 50,
):
    if task:
        # Filter by specific benchmark
        benchmark = get_benchmark_by_name(db, task)
        if not benchmark:
            return {"task": task, "language": language, "entries": []}

        query = (
            db.query(db_models.BenchmarkScore)
            .join(db_models.Model)
            .options(
                joinedload(db_models.BenchmarkScore.model).joinedload(db_models.Model.pricing),
                joinedload(db_models.BenchmarkScore.model).joinedload(db_models.Model.performance),
            )
            .filter(db_models.BenchmarkScore.benchmark_id == benchmark.id)
            .filter(db_models.Model.is_active == 1)
        )
        if language:
            query = query.filter(db_models.BenchmarkScore.language == language)

        scores = query.order_by(desc(db_models.BenchmarkScore.normalized_score)).limit(limit).all()
        entries = []
        for rank, s in enumerate(scores, 1):
            model = db.query(db_models.Model).get(s.model_id)
            if model:
                # Explicitly validate and dump to ensure relationships are included
                model_out = schemas.ModelOut.model_validate(model).model_dump()
                entries.append(
                    {
                        "rank": rank,
                        "model": model_out,
                        "score": s.normalized_score,
                        "benchmark_name": benchmark.name,
                    }
                )
        return {"task": task, "language": language, "entries": entries}
    else:
        # Overall leaderboard
        models = (
            db.query(db_models.Model)
            .options(joinedload(db_models.Model.pricing), joinedload(db_models.Model.performance))
            .filter(db_models.Model.is_active == 1)
            .order_by(desc(db_models.Model.overall_score))
            .limit(limit)
            .all()
        )
        entries = []
        for rank, m in enumerate(models, 1):
            # Explicitly validate and dump to ensure relationships are included
            model_out = schemas.ModelOut.model_validate(m).model_dump()
            entries.append(
                {
                    "rank": rank,
                    "model": model_out,
                    "score": m.overall_score,
                    "benchmark_name": None,
                }
            )
        return {"task": None, "language": language, "entries": entries}


# ---------- Community Submissions ----------


def create_community_submission(db: Session, submission: schemas.CommunitySubmissionCreate):
    db_sub = db_models.CommunitySubmission(**submission.model_dump())
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub


def get_community_submissions(db: Session, status: str | None = None):
    query = db.query(db_models.CommunitySubmission)
    if status:
        query = query.filter(db_models.CommunitySubmission.status == status)
    return query.order_by(desc(db_models.CommunitySubmission.submitted_at)).all()


# ---------- Score Recomputation ----------


def recompute_overall_scores(db: Session):
    """Recomputer overall scores for all models."""
    models = db.query(db_models.Model).all()
    for model in models:
        scores = get_scores_for_model(db, str(model.name))
        if scores:
            overall, confidence = compute_weighted_overall_score(scores, DEFAULT_WEIGHTS)
            model.overall_score = overall
            model.confidence = confidence
    db.commit()


# ---------- Export ----------


def get_all_data_for_export(db: Session):
    """Get all models with their scores for CSV/JSON export."""
    models = (
        db.query(db_models.Model)
        .filter(db_models.Model.is_active == 1)
        .order_by(desc(db_models.Model.overall_score))
        .all()
    )
    export_data = []
    for model in models:
        scores = get_scores_for_model(db, str(model.name))
        model_data = {
            "name": model.name,
            "slug": model.slug,
            "provider": model.provider,
            "model_creator_slug": model.model_creator_slug,
            "parameters": model.parameters,
            "overall_score": model.overall_score,
            "confidence": model.confidence,
            "cost_per_1m_input_tokens": model.pricing.cost_per_1m_input_tokens if model.pricing else None,
            "cost_per_1m_output_tokens": model.pricing.cost_per_1m_output_tokens if model.pricing else None,
            "cost_per_1m_blended": model.pricing.cost_per_1m_blended if model.pricing else None,
            "median_output_tokens_per_second": model.performance.median_output_tokens_per_second
            if model.performance
            else None,
            "median_ttft_seconds": model.performance.median_ttft_seconds if model.performance else None,
            "median_ttfa_seconds": model.performance.median_ttfa_seconds if model.performance else None,
            "avg_latency_ms": model.performance.avg_latency_ms if model.performance else None,
            "context_window": model.performance.context_window if model.performance else None,
        }
        for s in scores:
            model_data[f"{s['benchmark_name']}_raw"] = s["raw_score"]
            model_data[f"{s['benchmark_name']}_normalized"] = s["normalized_score"]
        export_data.append(model_data)
    return export_data
