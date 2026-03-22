import json
from typing import List

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app import models


def get_user_by_username(db: Session, username: str):
    normalized_username = username.strip().lower()
    return db.query(models.User).filter(func.lower(models.User.username) == normalized_username).first()


def create_user(db: Session, username: str, password_hash: str):
    user = models.User(username=username.strip(), password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_record(
    db: Session,
    user_id: int,
    original_resume: str,
    jd_text: str,
    style: str,
    optimized_resume: str,
    match_analysis: str,
    suggestions: List[str],
):
    """Insert one optimization record into DB."""
    next_record_number = (
        db.query(func.max(models.ResumeRecord.record_number))
        .filter(models.ResumeRecord.user_id == user_id)
        .scalar()
        or 0
    ) + 1

    record = models.ResumeRecord(
        user_id=user_id,
        record_number=next_record_number,
        original_resume=original_resume,
        jd_text=jd_text,
        style=style,
        optimized_resume=optimized_resume,
        match_analysis=match_analysis,
        suggestions=json.dumps(suggestions, ensure_ascii=False),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_records_paginated(
    db: Session,
    user_id: int,
    page: int,
    page_size: int,
    keyword: str = "",
    style: str = "",
):
    """Fetch paginated records for one user with optional filters."""
    query = db.query(models.ResumeRecord).filter(models.ResumeRecord.user_id == user_id)

    if keyword:
        like_keyword = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                models.ResumeRecord.original_resume.ilike(like_keyword),
                models.ResumeRecord.jd_text.ilike(like_keyword),
                models.ResumeRecord.optimized_resume.ilike(like_keyword),
                models.ResumeRecord.match_analysis.ilike(like_keyword),
            )
        )

    if style:
        query = query.filter(models.ResumeRecord.style == style)

    query = query.order_by(models.ResumeRecord.created_at.desc())
    total = query.count()
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    return items, total


def get_user_record_by_id(db: Session, user_id: int, record_id: int):
    """Fetch one record by id, scoped to user."""
    return (
        db.query(models.ResumeRecord)
        .filter(models.ResumeRecord.id == record_id, models.ResumeRecord.user_id == user_id)
        .first()
    )


def delete_user_record(db: Session, user_id: int, record_id: int) -> bool:
    """Delete one record by id scoped to user."""
    record = get_user_record_by_id(db, user_id=user_id, record_id=record_id)
    if not record:
        return False

    db.delete(record)
    db.commit()
    return True


def parse_suggestions(suggestions_raw: str) -> List[str]:
    """Convert DB stored JSON text back to list of strings."""
    try:
        data = json.loads(suggestions_raw)
        if isinstance(data, list):
            return [str(item) for item in data]
    except json.JSONDecodeError:
        pass

    return [suggestions_raw] if suggestions_raw else []


def build_record_preview(record: models.ResumeRecord, max_length: int = 160) -> str:
    """Return a short preview for history list views."""
    source = record.optimized_resume or record.match_analysis or record.original_resume or ""
    normalized = " ".join(source.split())
    if not normalized:
        return "Open this record to restore the full resume, JD, and generated output."

    if len(normalized) <= max_length:
        return normalized

    return f"{normalized[:max_length].rstrip()}..."
