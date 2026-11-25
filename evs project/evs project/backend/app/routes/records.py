"""Waste disposal activity tracker and protected user dashboard endpoints."""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.activity import WasteRecord
from app.models.challenge import ChallengeProgress
from app.models.user import User
from app.models.waste import WasteCategory, WasteItem
from app.schemas.activity import DashboardOut, WasteRecordCreate, WasteRecordOut
from app.services.eco_score import (
    calculate_record_points,
    get_eco_level,
    recalculate_user_score,
)

router = APIRouter(tags=["Activity & Dashboard"])


@router.post("/waste-records", response_model=WasteRecordOut, status_code=status.HTTP_201_CREATED)
def create_waste_record(
    payload: WasteRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log a responsible waste disposal or recycling action and update Eco Score."""
    category = db.query(WasteCategory).filter(WasteCategory.id == payload.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected waste category does not exist.",
        )

    if payload.waste_item_id is not None:
        w_item = db.query(WasteItem).filter(WasteItem.id == payload.waste_item_id).first()
        if not w_item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referenced waste item was not found.",
            )

    points = calculate_record_points(
        category_slug=category.slug,
        action_type=payload.action_type,
        quantity=payload.quantity,
    )

    record = WasteRecord(
        user_id=current_user.id,
        waste_item_id=payload.waste_item_id,
        item_name=payload.item_name.strip(),
        category_id=category.id,
        action_type=payload.action_type.strip(),
        quantity=payload.quantity,
        points_earned=points,
        notes=payload.notes.strip() if payload.notes else None,
        disposed_date=payload.disposed_date or date.today(),
    )
    db.add(record)
    db.flush()

    recalculate_user_score(db, current_user)
    db.commit()

    created = (
        db.query(WasteRecord)
        .options(joinedload(WasteRecord.category))
        .filter(WasteRecord.id == record.id)
        .first()
    )
    return created


@router.get("/waste-records", response_model=List[WasteRecordOut])
def list_my_waste_records(
    category: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the authenticated user's disposal activity history."""
    query = (
        db.query(WasteRecord)
        .options(joinedload(WasteRecord.category))
        .filter(WasteRecord.user_id == current_user.id)
    )
    if category and category != "all":
        query = query.join(WasteCategory).filter(WasteCategory.slug == category)

    return query.order_by(WasteRecord.disposed_date.desc(), WasteRecord.id.desc()).all()


@router.delete("/waste-records/{record_id}", status_code=status.HTTP_200_OK)
def delete_waste_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a disposal record owned by the user and recalculate Eco Score."""
    record = (
        db.query(WasteRecord)
        .filter(WasteRecord.id == record_id, WasteRecord.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity record not found.",
        )

    db.delete(record)
    db.flush()
    recalculate_user_score(db, current_user)
    db.commit()
    return {"message": "Activity record deleted.", "eco_score": current_user.eco_score}


@router.get("/dashboard", response_model=DashboardOut)
def get_user_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate stats, Eco Score level, active challenge, and recent activity."""
    records = (
        db.query(WasteRecord)
        .options(joinedload(WasteRecord.category))
        .filter(WasteRecord.user_id == current_user.id)
        .order_by(WasteRecord.disposed_date.desc(), WasteRecord.id.desc())
        .all()
    )

    total_items = sum(r.quantity for r in records)
    recyclable_items = sum(
        r.quantity for r in records if r.category and r.category.slug == "dry-recyclable"
    )
    ewaste_items = sum(
        r.quantity for r in records if r.category and r.category.slug == "e-waste"
    )
    wet_items = sum(
        r.quantity for r in records if r.category and r.category.slug == "wet-organic"
    )
    hazardous_items = sum(
        r.quantity for r in records if r.category and r.category.slug == "hazardous-special"
    )

    active_cp = (
        db.query(ChallengeProgress)
        .options(joinedload(ChallengeProgress.challenge))
        .filter(
            ChallengeProgress.user_id == current_user.id,
            ChallengeProgress.status == "in_progress",
        )
        .order_by(ChallengeProgress.joined_at.desc())
        .first()
    )
    if not active_cp:
        active_cp = (
            db.query(ChallengeProgress)
            .options(joinedload(ChallengeProgress.challenge))
            .filter(ChallengeProgress.user_id == current_user.id)
            .order_by(ChallengeProgress.joined_at.desc())
            .first()
        )

    current_challenge = None
    if active_cp and active_cp.challenge:
        ch = active_cp.challenge
        current_challenge = {
            "challenge_id": ch.id,
            "title": ch.title,
            "challenge_type": ch.challenge_type,
            "current_count": active_cp.current_count,
            "target_count": ch.target_count,
            "unit_label": ch.unit_label,
            "status": active_cp.status,
            "points_reward": ch.points_reward,
        }

    return {
        "user_name": current_user.name,
        "total_records": len(records),
        "total_items_disposed": total_items,
        "recyclable_items": recyclable_items,
        "ewaste_items": ewaste_items,
        "wet_composted_items": wet_items,
        "hazardous_items": hazardous_items,
        "eco_score": current_user.eco_score,
        "eco_level": get_eco_level(current_user.eco_score),
        "current_challenge": current_challenge,
        "recent_activities": records[:6],
        "estimated_diversion_note": (
            f"You have logged {total_items} responsible disposal actions across {len(records)} entries. "
            "Counts represent self-reported actions guided by EcoSort segregation rules."
        ),
    }
