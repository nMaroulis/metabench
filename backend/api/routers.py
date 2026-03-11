import csv
import io

import schemas
from crud import crud
from db.database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

router = APIRouter()


# ---------- Models ----------


@router.get("/models", response_model=list[schemas.ModelOut], tags=["Models"])
def list_models(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    provider: str | None = None,
    db: Session = Depends(get_db),
):
    """List all models with metadata and overall scores."""
    return crud.get_models(db, skip=skip, limit=limit, provider=provider)


@router.get("/models/{model_name}", tags=["Models"])
def get_model_detail(model_name: str, db: Session = Depends(get_db)):
    """Get detailed info for a specific model including all benchmark scores."""
    model = crud.get_model_detail(db, model_name)
    if not model:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")

    scores = crud.get_scores_for_model(db, model_name)

    return {
        "id": model.id,
        "name": model.name,
        "provider": model.provider,
        "description": model.description,
        "parameters": model.parameters,
        "architecture": model.architecture,
        "license_type": model.license_type,
        "release_date": model.release_date,
        "pricing": model.pricing,
        "performance": model.performance,
        "overall_score": model.overall_score,
        "confidence": model.confidence,
        "technical_details": schemas.ModelOut.model_validate(model).technical_details,
        "scores": scores,
    }


# ---------- Benchmarks ----------


@router.get("/benchmarks", tags=["Benchmarks"])
def list_benchmarks(
    model: str | None = None,
    db: Session = Depends(get_db),
):
    """List all benchmarks, or get per-task scores for a specific model."""
    if model:
        scores = crud.get_scores_for_model(db, model)
        if not scores:
            raise HTTPException(status_code=404, detail=f"No scores found for model '{model}'")
        return scores
    return crud.get_benchmarks(db)


# ---------- Compare ----------


@router.get("/compare", tags=["Comparison"])
def compare_models(
    models: str = Query(..., description="Comma-separated model names (2-5)"),
    db: Session = Depends(get_db),
):
    """Compare 2-5 models side by side."""
    model_names = [m.strip() for m in models.split(",")]
    if len(model_names) < 2 or len(model_names) > 5:
        raise HTTPException(status_code=400, detail="Must compare between 2 and 5 models")

    result = crud.compare_models(db, model_names)
    if not result["models"]:
        raise HTTPException(status_code=404, detail="No matching models found")
    return result


# ---------- Leaderboard ----------


@router.get("/leaderboard", response_model=schemas.LeaderboardResponse, tags=["Leaderboard"])
def get_leaderboard(
    task: str | None = None,
    language: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Get ranked leaderboard, optionally filtered by task/benchmark and language."""
    return crud.get_leaderboard(db, task=task, language=language, limit=limit)


# ---------- Export ----------


@router.get("/export", tags=["Export"])
def export_data(
    file_format: str = Query("json", pattern="^(json|csv)$"),
    db: Session = Depends(get_db),
):
    """Export all benchmark data as JSON or CSV."""
    data = crud.get_all_data_for_export(db)

    if file_format == "csv":
        if not data:
            return Response(content="", media_type="text/csv")
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=metabench_export.csv"},
        )

    return data


# ---------- Community Submissions ----------


@router.post(
    "/community/submit",
    response_model=schemas.CommunitySubmissionOut,
    tags=["Community"],
)
def submit_community_score(
    submission: schemas.CommunitySubmissionCreate,
    db: Session = Depends(get_db),
):
    """Submit a community benchmark evaluation."""
    return crud.create_community_submission(db, submission)


@router.get(
    "/community/submissions",
    response_model=list[schemas.CommunitySubmissionOut],
    tags=["Community"],
)
def list_community_submissions(
    status: str | None = None,
    db: Session = Depends(get_db),
):
    """List community submissions, optionally filtered by status."""
    return crud.get_community_submissions(db, status=status)


# ---------- Stats ----------


@router.get("/stats", tags=["Stats"])
def get_stats(db: Session = Depends(get_db)):
    """Get platform statistics."""
    from models import Benchmark, BenchmarkScore, CommunitySubmission, Model

    return {
        "total_models": db.query(Model).count(),
        "total_benchmarks": db.query(Benchmark).count(),
        "total_scores": db.query(BenchmarkScore).count(),
        "total_submissions": db.query(CommunitySubmission).count(),
        "providers": [r[0] for r in db.query(Model.provider).distinct().all()],
    }
