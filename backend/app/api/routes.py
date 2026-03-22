from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.database import get_db
from app.services.ai_service import optimize_resume
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api", tags=["resume"])


@router.post("/optimize", response_model=schemas.OptimizeResponse)
def optimize(
    payload: schemas.OptimizeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Optimize resume with AI (or mock), then save record into SQLite."""
    result = optimize_resume(
        resume_text=payload.resume_text,
        jd_text=payload.jd_text,
        style=payload.style,
    )

    crud.create_record(
        db=db,
        user_id=current_user.id,
        original_resume=payload.resume_text,
        jd_text=payload.jd_text,
        style=payload.style,
        optimized_resume=result["optimized_resume"],
        match_analysis=result["match_analysis"],
        suggestions=result["suggestions"],
    )

    return schemas.OptimizeResponse(**result)


@router.get("/records", response_model=schemas.RecordsPageResponse)
def list_records(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=5, ge=1, le=50),
    keyword: str = Query(default=""),
    style: str = Query(default=""),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return paginated records with optional keyword/style filters."""
    records, total = crud.get_records_paginated(
        db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        keyword=keyword,
        style=style,
    )

    items = [
        schemas.RecordSummaryResponse(
            id=record.id,
            display_number=record.record_number or index,
            style=record.style,
            preview_text=crud.build_record_preview(record),
            created_at=record.created_at,
        )
        for index, record in enumerate(records, start=1)
    ]

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return schemas.RecordsPageResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/records/{record_id}", response_model=schemas.RecordResponse)
def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return one record by id for current user only."""
    record = crud.get_user_record_by_id(db, user_id=current_user.id, record_id=record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    return schemas.RecordResponse(
        id=record.id,
        original_resume=record.original_resume,
        jd_text=record.jd_text,
        style=record.style,
        optimized_resume=record.optimized_resume,
        match_analysis=record.match_analysis,
        suggestions=crud.parse_suggestions(record.suggestions),
        created_at=record.created_at,
    )


@router.delete("/records/{record_id}", response_model=schemas.DeleteRecordResponse)
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete one record by id for current user only."""
    deleted = crud.delete_user_record(db, user_id=current_user.id, record_id=record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Record not found")

    return schemas.DeleteRecordResponse(message="Record deleted successfully")
