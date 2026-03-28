import models as db_models
import schemas
from services.scoring import (
    DEFAULT_WEIGHTS,
    compute_weighted_overall_score,
)
from sqlalchemy import desc, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

# ---------- Models ----------


def get_models(db: Session, skip: int = 0, limit: int = 100, provider: str | None = None, sort: str = "score"):
    query = db.query(db_models.Model).filter(db_models.Model.is_active == 1)
    if provider:
        query = query.filter(db_models.Model.provider == provider)

    if sort == "latest":
        query = query.order_by(desc(db_models.Model.created_at))
    else:
        query = query.order_by(desc(db_models.Model.overall_score))

    return query.offset(skip).limit(limit).all()


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


def update_model_dynamic(db: Session, model_id: int, update_data: schemas.ModelUpdate):
    from utils.logger import get_logger

    logger = get_logger("crud.update")

    db_model = db.query(db_models.Model).filter(db_models.Model.id == model_id).first()
    if not db_model:
        return None

    logger.info(f"Updating model id={model_id} with data: {update_data.model_dump(exclude_unset=True)}")

    update_dict = update_data.model_dump(exclude_unset=True)

    # 1. Update basic fields
    basic_fields = [
        "name",
        "slug",
        "provider",
        "model_creator_slug",
        "description",
        "parameters",
        "architecture",
        "license_type",
        "release_date",
    ]
    for field in basic_fields:
        if field in update_dict and update_dict[field] is not None:
            setattr(db_model, field, update_dict[field])

    # 2. Update pricing
    if "pricing" in update_dict and update_dict["pricing"] is not None:
        pricing_data = update_dict["pricing"]
        if not db_model.pricing:
            db_model.pricing = db_models.ModelPricing(model_id=db_model.id)
            db.add(db_model.pricing)
        for p_field, p_value in pricing_data.items():
            if p_value is not None:
                setattr(db_model.pricing, p_field, p_value)

    # 3. Update performance
    if "performance" in update_dict and update_dict["performance"] is not None:
        perf_data = update_dict["performance"]
        if not db_model.performance:
            db_model.performance = db_models.ModelPerformance(model_id=db_model.id)
            db.add(db_model.performance)
        for p_field, p_value in perf_data.items():
            if p_value is not None:
                setattr(db_model.performance, p_field, p_value)

    # 4. Update technical specs (replace existing specs if provided)
    if "technical_specs" in update_dict and update_dict["technical_specs"] is not None:
        # Delete existing specs
        db.query(db_models.TechnicalSpec).filter(db_models.TechnicalSpec.model_id == db_model.id).delete()
        # Add new specs
        for spec_data in update_dict["technical_specs"]:
            if all(k in spec_data and spec_data[k] is not None for k in ["section", "label", "value"]):
                new_spec = db_models.TechnicalSpec(
                    model_id=db_model.id,
                    section=spec_data["section"],
                    label=spec_data["label"],
                    value=spec_data["value"],
                )
                db.add(new_spec)

    # 5. Update benchmark scores
    if "benchmark_scores" in update_dict and update_dict["benchmark_scores"] is not None:
        for score_data in update_dict["benchmark_scores"]:
            db_score = (
                db.query(db_models.BenchmarkScore)
                .filter(
                    db_models.BenchmarkScore.model_id == db_model.id,
                    db_models.BenchmarkScore.benchmark_id == score_data["benchmark_id"],
                )
                .first()
            )
            if db_score:
                if "raw_score" in score_data and score_data["raw_score"] is not None:
                    db_score.raw_score = score_data["raw_score"]
                if "normalized_score" in score_data and score_data["normalized_score"] is not None:
                    db_score.normalized_score = score_data["normalized_score"]
                if "notes" in score_data and score_data["notes"] is not None:
                    db_score.notes = score_data["notes"]
                # For this implementation, we only update existing scores to keep it clean.

    db.commit()
    db.refresh(db_model)
    return db_model


def delete_model(db: Session, model_id: int):
    """Deletes a model and its associated scores/metadata (via cascade)."""
    db_model = get_model_by_id(db, model_id)
    if not db_model:
        return False
    db.delete(db_model)
    db.commit()
    return True


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
    category: str | None = None,
    language: str | None = None,
    limit: int = 50,
    skip: int = 0,
):
    if task:
        # Filter by specific benchmark
        benchmark = get_benchmark_by_name(db, task)
        if not benchmark:
            return {
                "task": task,
                "category": None,
                "language": language,
                "total": 0,
                "limit": limit,
                "skip": skip,
                "entries": [],
            }

        base_query = (
            db.query(db_models.BenchmarkScore)
            .join(db_models.Model)
            .filter(db_models.BenchmarkScore.benchmark_id == benchmark.id)
            .filter(db_models.Model.is_active == 1)
        )
        if language:
            base_query = base_query.filter(db_models.BenchmarkScore.language == language)

        total = base_query.count()
        scores = (
            base_query.options(
                joinedload(db_models.BenchmarkScore.model).joinedload(db_models.Model.pricing),
                joinedload(db_models.BenchmarkScore.model).joinedload(db_models.Model.performance),
                joinedload(db_models.BenchmarkScore.model).joinedload(db_models.Model.technical_specs),
            )
            .order_by(desc(db_models.BenchmarkScore.normalized_score))
            .offset(skip)
            .limit(limit)
            .all()
        )

        entries = []
        for rank, s in enumerate(scores, skip + 1):
            model = s.model
            if model:
                model_out = schemas.ModelOut.model_validate(model).model_dump()
                entries.append(
                    {
                        "rank": rank,
                        "model": model_out,
                        "score": s.normalized_score,
                        "benchmark_name": benchmark.name,
                    }
                )
        return {
            "task": task,
            "category": None,
            "language": language,
            "total": total,
            "limit": limit,
            "skip": skip,
            "entries": entries,
        }
    elif category:
        # Subquery to calculate average scores per model for the given category
        avg_scores_sub = (
            db.query(
                db_models.BenchmarkScore.model_id,
                func.avg(db_models.BenchmarkScore.normalized_score).label("avg_score"),
            )
            .join(db_models.Benchmark, db_models.BenchmarkScore.benchmark_id == db_models.Benchmark.id)
            .filter(db_models.Benchmark.category == category)
        )

        if language:
            avg_scores_sub = avg_scores_sub.filter(db_models.BenchmarkScore.language == language)

        avg_scores_sub = avg_scores_sub.group_by(db_models.BenchmarkScore.model_id).subquery()

        # Main query to fetch models and their aggregated scores
        base_query = (
            db.query(db_models.Model, avg_scores_sub.c.avg_score)
            .join(avg_scores_sub, db_models.Model.id == avg_scores_sub.c.model_id)
            .filter(db_models.Model.is_active == 1)
        )

        total = base_query.count()
        results = (
            base_query.options(
                joinedload(db_models.Model.pricing),
                joinedload(db_models.Model.performance),
                joinedload(db_models.Model.technical_specs),
            )
            .order_by(desc(avg_scores_sub.c.avg_score))
            .offset(skip)
            .limit(limit)
            .all()
        )

        entries = []
        for rank, (model, avg_score) in enumerate(results, skip + 1):
            model_out = schemas.ModelOut.model_validate(model).model_dump()
            entries.append(
                {
                    "rank": rank,
                    "model": model_out,
                    "score": float(avg_score),
                    "benchmark_name": f"{category.capitalize()} Composite",
                }
            )
        return {
            "task": None,
            "category": category,
            "language": language,
            "total": total,
            "limit": limit,
            "skip": skip,
            "entries": entries,
        }
    else:
        # Overall leaderboard
        base_query = db.query(db_models.Model).filter(db_models.Model.is_active == 1)

        total = base_query.count()
        models = (
            base_query.options(
                joinedload(db_models.Model.pricing),
                joinedload(db_models.Model.performance),
                joinedload(db_models.Model.technical_specs),
            )
            .order_by(desc(db_models.Model.overall_score))
            .offset(skip)
            .limit(limit)
            .all()
        )

        entries = []
        for rank, m in enumerate(models, skip + 1):
            model_out = schemas.ModelOut.model_validate(m).model_dump()
            entries.append(
                {
                    "rank": rank,
                    "model": model_out,
                    "score": m.overall_score,
                    "benchmark_name": None,
                }
            )
        return {
            "task": None,
            "language": language,
            "total": total,
            "limit": limit,
            "skip": skip,
            "entries": entries,
        }


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


# ---------- Admin Snapshot ----------


def get_admin_snapshot(db: Session) -> schemas.AdminSnapshot:
    benchmarks = db.query(db_models.Benchmark).order_by(db_models.Benchmark.id.asc()).all()
    models = (
        db.query(db_models.Model)
        .options(
            joinedload(db_models.Model.pricing),
            joinedload(db_models.Model.performance),
            joinedload(db_models.Model.technical_specs),
            joinedload(db_models.Model.scores).joinedload(db_models.BenchmarkScore.benchmark),
        )
        .order_by(db_models.Model.id.asc())
        .all()
    )

    snapshot = schemas.AdminSnapshot(exported_at=None)
    snapshot.benchmarks = [
        schemas.AdminSnapshotBenchmark(
            name=str(b.name),
            category=str(b.category),
            type=str(b.type),
            description=str(b.description or ""),
            max_score=float(b.max_score or 100.0),  # type: ignore
            weight=float(b.weight or 1.0),  # type: ignore
            source=str(b.source or ""),
        )
        for b in benchmarks
    ]

    snapshot.models = []
    for m in models:
        snapshot_model = schemas.AdminSnapshotModel(
            name=str(m.name),
            slug=str(m.slug or ""),
            provider=str(m.provider),
            model_creator_slug=str(m.model_creator_slug or ""),
            open_router_id=str(m.open_router_id or ""),
            description=str(m.description or ""),
            parameters=str(m.parameters or ""),
            architecture=str(m.architecture or ""),
            license_type=str(m.license_type or ""),
            release_date=str(m.release_date or ""),
            is_active=int(m.is_active or 1),  # type: ignore
            pricing=(
                schemas.AdminSnapshotModelPricing(
                    cost_per_1m_input_tokens=(
                        float(m.pricing.cost_per_1m_input_tokens)
                        if m.pricing.cost_per_1m_input_tokens is not None
                        else None
                    ),
                    cost_per_1m_output_tokens=(
                        float(m.pricing.cost_per_1m_output_tokens)
                        if m.pricing.cost_per_1m_output_tokens is not None
                        else None
                    ),
                    cost_per_1m_blended=(
                        float(m.pricing.cost_per_1m_blended) if m.pricing.cost_per_1m_blended is not None else None
                    ),
                )
                if m.pricing
                else None
            ),
            performance=(
                schemas.AdminSnapshotModelPerformance(
                    median_output_tokens_per_second=(
                        float(m.performance.median_output_tokens_per_second)
                        if m.performance.median_output_tokens_per_second is not None
                        else None
                    ),
                    median_ttft_seconds=(
                        float(m.performance.median_ttft_seconds)
                        if m.performance.median_ttft_seconds is not None
                        else None
                    ),
                    median_ttfa_seconds=(
                        float(m.performance.median_ttfa_seconds)
                        if m.performance.median_ttfa_seconds is not None
                        else None
                    ),
                    avg_latency_ms=(
                        float(m.performance.avg_latency_ms) if m.performance.avg_latency_ms is not None else None
                    ),
                    context_window=(
                        int(m.performance.context_window) if m.performance.context_window is not None else None
                    ),
                )
                if m.performance
                else None
            ),
            technical_specs=[
                schemas.AdminSnapshotTechnicalSpec(section=str(s.section), label=str(s.label), value=str(s.value))
                for s in (m.technical_specs or [])
            ],
            benchmark_scores=[
                schemas.AdminSnapshotBenchmarkScore(
                    benchmark_name=str(sc.benchmark.name) if sc.benchmark else "",
                    raw_score=float(sc.raw_score),
                    normalized_score=float(sc.normalized_score),
                    language=str(sc.language or "en"),
                    evaluation_date=str(sc.evaluation_date or ""),
                    notes=str(sc.notes or ""),
                )
                for sc in (m.scores or [])
                if sc.benchmark and sc.benchmark.name
            ],
        )
        snapshot.models.append(snapshot_model)

    return snapshot


def import_admin_snapshot(db: Session, snapshot: schemas.AdminSnapshot) -> dict:
    """Upsert benchmarks/models from a snapshot.

    Uses `name` as the stable key for both benchmarks and models.
    """

    created_benchmarks = 0
    updated_benchmarks = 0
    created_models = 0
    updated_models = 0
    upserted_scores = 0
    replaced_specs = 0

    try:
        with db.begin():
            # 1) Benchmarks upsert
            benchmark_by_name: dict[str, db_models.Benchmark] = {
                str(b.name): b for b in db.query(db_models.Benchmark).all()
            }
            for b in snapshot.benchmarks:
                existing = benchmark_by_name.get(b.name)
                if existing:
                    existing.category = b.category
                    existing.type = b.type
                    existing.description = b.description
                    existing.max_score = b.max_score
                    existing.weight = b.weight
                    existing.source = b.source
                    updated_benchmarks += 1
                else:
                    new_b = db_models.Benchmark(
                        name=b.name,
                        category=b.category,
                        type=b.type,
                        description=b.description,
                        max_score=b.max_score,
                        weight=b.weight,
                        source=b.source,
                    )
                    db.add(new_b)
                    db.flush()
                    benchmark_by_name[b.name] = new_b
                    created_benchmarks += 1

            # 2) Models upsert
            model_by_name: dict[str, db_models.Model] = {str(m.name): m for m in db.query(db_models.Model).all()}

            for m in snapshot.models:
                existing_model = model_by_name.get(m.name)
                if existing_model:
                    db_model = existing_model
                    updated_models += 1
                else:
                    db_model = db_models.Model(name=m.name, provider=m.provider)
                    db.add(db_model)
                    db.flush()
                    model_by_name[m.name] = db_model
                    created_models += 1

                # Basic fields
                db_model.slug = m.slug or ""
                db_model.provider = m.provider
                db_model.model_creator_slug = m.model_creator_slug or ""
                db_model.open_router_id = m.open_router_id or ""
                db_model.description = m.description or ""
                db_model.parameters = m.parameters or ""
                db_model.architecture = m.architecture or ""
                db_model.license_type = m.license_type or ""
                db_model.release_date = m.release_date or ""
                db_model.is_active = int(m.is_active) if m.is_active is not None else 1

                # Pricing (upsert)
                if m.pricing is not None:
                    if not db_model.pricing:
                        db_model.pricing = db_models.ModelPricing(model_id=db_model.id)
                        db.add(db_model.pricing)
                    db_model.pricing.cost_per_1m_input_tokens = m.pricing.cost_per_1m_input_tokens
                    db_model.pricing.cost_per_1m_output_tokens = m.pricing.cost_per_1m_output_tokens
                    db_model.pricing.cost_per_1m_blended = m.pricing.cost_per_1m_blended

                # Performance (upsert)
                if m.performance is not None:
                    if not db_model.performance:
                        db_model.performance = db_models.ModelPerformance(model_id=db_model.id)
                        db.add(db_model.performance)
                    db_model.performance.median_output_tokens_per_second = m.performance.median_output_tokens_per_second
                    db_model.performance.median_ttft_seconds = m.performance.median_ttft_seconds
                    db_model.performance.median_ttfa_seconds = m.performance.median_ttfa_seconds
                    db_model.performance.avg_latency_ms = m.performance.avg_latency_ms
                    db_model.performance.context_window = m.performance.context_window

                # Technical specs (replace)
                db.query(db_models.TechnicalSpec).filter(db_models.TechnicalSpec.model_id == db_model.id).delete()
                for spec in m.technical_specs or []:
                    db.add(
                        db_models.TechnicalSpec(
                            model_id=db_model.id,
                            section=spec.section,
                            label=spec.label,
                            value=spec.value,
                        )
                    )
                replaced_specs += 1

                # Benchmark scores (upsert)
                for sc in m.benchmark_scores or []:
                    bench = benchmark_by_name.get(sc.benchmark_name)
                    if not bench:
                        # If the snapshot references a benchmark that isn't defined in `benchmarks`, skip it.
                        continue

                    existing_score = (
                        db.query(db_models.BenchmarkScore)
                        .filter(
                            db_models.BenchmarkScore.model_id == db_model.id,
                            db_models.BenchmarkScore.benchmark_id == bench.id,
                            db_models.BenchmarkScore.language == (sc.language or "en"),
                        )
                        .first()
                    )
                    if existing_score:
                        existing_score.raw_score = sc.raw_score
                        existing_score.normalized_score = sc.normalized_score
                        existing_score.evaluation_date = sc.evaluation_date or ""
                        existing_score.notes = sc.notes or ""
                    else:
                        db.add(
                            db_models.BenchmarkScore(
                                model_id=db_model.id,
                                benchmark_id=bench.id,
                                raw_score=sc.raw_score,
                                normalized_score=sc.normalized_score,
                                language=sc.language or "en",
                                evaluation_date=sc.evaluation_date or "",
                                notes=sc.notes or "",
                            )
                        )
                    upserted_scores += 1

        # recompute overall scores after the transaction
        recompute_overall_scores(db)

        return {
            "created_benchmarks": created_benchmarks,
            "updated_benchmarks": updated_benchmarks,
            "created_models": created_models,
            "updated_models": updated_models,
            "upserted_scores": upserted_scores,
            "replaced_specs": replaced_specs,
        }
    except SQLAlchemyError:
        db.rollback()
        raise
