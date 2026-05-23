"""
Schedule router — availability calendar
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas, security

router = APIRouter()


@router.post("/", response_model=schemas.ScheduleOut)
def set_schedule(
    req: schemas.ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    existing = db.query(models.Schedule).filter(
        models.Schedule.user_id == current_user.id,
        models.Schedule.date == req.date,
    ).first()
    if existing:
        existing.unavailable = req.unavailable
        existing.note = req.note
        db.commit()
        db.refresh(existing)
        return existing

    schedule = models.Schedule(
        user_id=current_user.id,
        family_id=current_user.family_id,
        date=req.date,
        unavailable=req.unavailable,
        note=req.note,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.get("/my", response_model=List[schemas.ScheduleOut])
def my_schedule(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return db.query(models.Schedule).filter(
        models.Schedule.user_id == current_user.id
    ).order_by(models.Schedule.date).all()


@router.get("/family", response_model=List[dict])
def family_schedule(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_family_admin),
):
    fid = current_user.family_id
    q = db.query(models.Schedule)
    if current_user.role != models.UserRole.SUPER_ADMIN:
        q = q.filter(models.Schedule.family_id == fid)
    rows = q.order_by(models.Schedule.date).all()
    return [
        {
            "date": r.date,
            "unavailable": r.unavailable,
            "note": r.note,
            "user_id": r.user_id,
        }
        for r in rows
    ]


@router.delete("/{date}")
def delete_schedule(
    date: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    entry = db.query(models.Schedule).filter(
        models.Schedule.user_id == current_user.id,
        models.Schedule.date == date,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(entry)
    db.commit()
    return {"message": "Deleted"}
