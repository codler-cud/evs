"""Protected Administrator Management and Analytics endpoints."""

import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.security import require_admin
from app.database.session import get_db
from app.models import (
    AwarenessArticle,
    Challenge,
    ChallengeProgress,
    CollectionCentre,
    DisposalMethod,
    User,
    WasteCategory,
    WasteItem,
    WasteRecord,
)
from app.schemas.awareness import (
    AdminAnalyticsOut,
    AdminUserOut,
    AdminUserStatusUpdate,
    AwarenessArticleCreate,
    AwarenessArticleOut,
    AwarenessArticleUpdate,
)
from app.schemas.centre import (
    CollectionCentreCreate,
    CollectionCentreOut,
    CollectionCentreUpdate,
)
from app.schemas.challenge import ChallengeCreate, ChallengeUpdate, ChallengeWithProgressOut
from app.schemas.waste import (
    DisposalMethodOut,
    WasteItemCreate,
    WasteItemOut,
    WasteItemUpdate,
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin Panel"],
    dependencies=[Depends(require_admin)],
)


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "article"


# --- Analytics ---
@router.get("/analytics", response_model=AdminAnalyticsOut)
def get_admin_analytics(db: Session = Depends(get_db)):
    """Return platform KPIs and chart-ready analytics for administrators."""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active.is_(True)).count()
    total_records = db.query(WasteRecord).count()

    total_recycling_actions = (
        db.query(WasteRecord)
        .filter(WasteRecord.action_type.ilike("%Recycl%"))
        .count()
    )
    ewaste_cat = db.query(WasteCategory).filter(WasteCategory.slug == "e-waste").first()
    total_ewaste_records = (
        db.query(WasteRecord).filter(WasteRecord.category_id == ewaste_cat.id).count()
        if ewaste_cat
        else 0
    )

    most_searched = (
        db.query(WasteItem)
        .order_by(WasteItem.search_count.desc(), WasteItem.name.asc())
        .limit(6)
        .all()
    )

    cat_rows = (
        db.query(WasteCategory.name, func.count(WasteRecord.id))
        .outerjoin(WasteRecord, WasteRecord.category_id == WasteCategory.id)
        .group_by(WasteCategory.id, WasteCategory.name)
        .all()
    )

    action_rows = (
        db.query(WasteRecord.action_type, func.count(WasteRecord.id))
        .group_by(WasteRecord.action_type)
        .order_by(func.count(WasteRecord.id).desc())
        .all()
    )

    challenge_rows = (
        db.query(Challenge.title, func.count(ChallengeProgress.id))
        .outerjoin(ChallengeProgress, ChallengeProgress.challenge_id == Challenge.id)
        .group_by(Challenge.id, Challenge.title)
        .all()
    )

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_waste_records": total_records,
        "total_recycling_actions": total_recycling_actions,
        "total_ewaste_records": total_ewaste_records,
        "total_waste_items_catalog": db.query(WasteItem).count(),
        "total_collection_centres": db.query(CollectionCentre).count(),
        "most_searched_items": [
            {"label": item.name, "value": item.search_count} for item in most_searched
        ],
        "category_distribution": [
            {"label": name, "value": count} for name, count in cat_rows
        ],
        "top_disposal_actions": [
            {"label": action, "value": count} for action, count in action_rows
        ],
        "challenge_participation": [
            {"label": title, "value": count} for title, count in challenge_rows
        ],
    }


# --- User Management ---
@router.get("/users", response_model=List[AdminUserOut])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id.asc()).all()
    out = []
    for u in users:
        rec_count = db.query(WasteRecord).filter(WasteRecord.user_id == u.id).count()
        out.append(
            AdminUserOut(
                id=u.id,
                name=u.name,
                email=u.email,
                role=u.role,
                is_active=u.is_active,
                eco_score=u.eco_score,
                location=u.location,
                records_count=rec_count,
                created_at=u.created_at,
            )
        )
    return out


@router.patch("/users/{user_id}/status", response_model=AdminUserOut)
def update_user_status(
    user_id: int,
    payload: AdminUserStatusUpdate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.id == admin_user.id and not payload.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own admin account.",
        )

    user.is_active = payload.is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    rec_count = db.query(WasteRecord).filter(WasteRecord.user_id == user.id).count()
    return AdminUserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        eco_score=user.eco_score,
        location=user.location,
        records_count=rec_count,
        created_at=user.created_at,
    )


# --- Waste Item Management ---
@router.get("/disposal-methods", response_model=List[DisposalMethodOut])
def list_disposal_methods(db: Session = Depends(get_db)):
    return db.query(DisposalMethod).order_by(DisposalMethod.id.asc()).all()


@router.post("/waste", response_model=WasteItemOut, status_code=status.HTTP_201_CREATED)
def create_waste_item(payload: WasteItemCreate, db: Session = Depends(get_db)):
    if db.query(WasteItem).filter(WasteItem.name.ilike(payload.name.strip())).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A waste item with this name already exists.",
        )
    if not db.query(WasteCategory).filter(WasteCategory.id == payload.category_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id.")

    item = WasteItem(**payload.model_dump())
    item.name = payload.name.strip()
    db.add(item)
    db.commit()
    return (
        db.query(WasteItem)
        .options(joinedload(WasteItem.category))
        .filter(WasteItem.id == item.id)
        .first()
    )


@router.put("/waste/{item_id}", response_model=WasteItemOut)
def update_waste_item(item_id: int, payload: WasteItemUpdate, db: Session = Depends(get_db)):
    item = db.query(WasteItem).filter(WasteItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waste item not found.")

    updates = payload.model_dump(exclude_unset=True)
    if "category_id" in updates:
        if not db.query(WasteCategory).filter(WasteCategory.id == updates["category_id"]).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id.")
    for field, val in updates.items():
        setattr(item, field, val)

    db.add(item)
    db.commit()
    return (
        db.query(WasteItem)
        .options(joinedload(WasteItem.category))
        .filter(WasteItem.id == item.id)
        .first()
    )


@router.delete("/waste/{item_id}")
def delete_waste_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(WasteItem).filter(WasteItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waste item not found.")
    db.delete(item)
    db.commit()
    return {"message": "Waste item deleted."}


# --- Collection Centre Management ---
@router.get("/collection-centres", response_model=List[CollectionCentreOut])
def admin_list_centres(db: Session = Depends(get_db)):
    return db.query(CollectionCentre).order_by(CollectionCentre.id.asc()).all()


@router.post("/collection-centres", response_model=CollectionCentreOut, status_code=status.HTTP_201_CREATED)
def create_centre(payload: CollectionCentreCreate, db: Session = Depends(get_db)):
    centre = CollectionCentre(**payload.model_dump())
    db.add(centre)
    db.commit()
    db.refresh(centre)
    return centre


@router.put("/collection-centres/{centre_id}", response_model=CollectionCentreOut)
def update_centre(centre_id: int, payload: CollectionCentreUpdate, db: Session = Depends(get_db)):
    centre = db.query(CollectionCentre).filter(CollectionCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection centre not found.")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(centre, field, val)
    db.add(centre)
    db.commit()
    db.refresh(centre)
    return centre


@router.delete("/collection-centres/{centre_id}")
def delete_centre(centre_id: int, db: Session = Depends(get_db)):
    centre = db.query(CollectionCentre).filter(CollectionCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection centre not found.")
    db.delete(centre)
    db.commit()
    return {"message": "Collection centre deleted."}


# --- Awareness Articles Management ---
@router.post("/awareness", response_model=AwarenessArticleOut, status_code=status.HTTP_201_CREATED)
def create_article(payload: AwarenessArticleCreate, db: Session = Depends(get_db)):
    base_slug = _slugify(payload.slug or payload.title)
    slug = base_slug
    counter = 1
    while db.query(AwarenessArticle).filter(AwarenessArticle.slug == slug).first():
        counter += 1
        slug = f"{base_slug}-{counter}"

    article = AwarenessArticle(
        title=payload.title.strip(),
        slug=slug,
        summary=payload.summary.strip(),
        content=payload.content.strip(),
        category_tag=payload.category_tag.strip(),
        reading_time_mins=payload.reading_time_mins,
        is_featured=payload.is_featured,
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@router.put("/awareness/{article_id}", response_model=AwarenessArticleOut)
def update_article(article_id: int, payload: AwarenessArticleUpdate, db: Session = Depends(get_db)):
    article = db.query(AwarenessArticle).filter(AwarenessArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found.")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(article, field, val)
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@router.delete("/awareness/{article_id}")
def delete_article(article_id: int, db: Session = Depends(get_db)):
    article = db.query(AwarenessArticle).filter(AwarenessArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found.")
    db.delete(article)
    db.commit()
    return {"message": "Awareness article deleted."}


# --- Challenge Management ---
@router.get("/challenges", response_model=List[ChallengeWithProgressOut])
def admin_list_challenges(db: Session = Depends(get_db)):
    challenges = db.query(Challenge).order_by(Challenge.id.asc()).all()
    out = []
    for ch in challenges:
        participants = (
            db.query(ChallengeProgress).filter(ChallengeProgress.challenge_id == ch.id).count()
        )
        out.append(
            ChallengeWithProgressOut(
                id=ch.id,
                title=ch.title,
                description=ch.description,
                challenge_type=ch.challenge_type,
                target_count=ch.target_count,
                unit_label=ch.unit_label,
                points_reward=ch.points_reward,
                category_tag=ch.category_tag,
                is_active=ch.is_active,
                participant_count=participants,
            )
        )
    return out


@router.post("/challenges", response_model=ChallengeWithProgressOut, status_code=status.HTTP_201_CREATED)
def create_challenge(payload: ChallengeCreate, db: Session = Depends(get_db)):
    if db.query(Challenge).filter(Challenge.title.ilike(payload.title.strip())).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A challenge with this title already exists.",
        )
    ch = Challenge(**payload.model_dump())
    ch.title = payload.title.strip()
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ChallengeWithProgressOut(
        id=ch.id,
        title=ch.title,
        description=ch.description,
        challenge_type=ch.challenge_type,
        target_count=ch.target_count,
        unit_label=ch.unit_label,
        points_reward=ch.points_reward,
        category_tag=ch.category_tag,
        is_active=ch.is_active,
        participant_count=0,
    )


@router.put("/challenges/{challenge_id}", response_model=ChallengeWithProgressOut)
def update_challenge(challenge_id: int, payload: ChallengeUpdate, db: Session = Depends(get_db)):
    ch = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not ch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found.")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(ch, field, val)
    db.add(ch)
    db.commit()
    db.refresh(ch)
    participants = (
        db.query(ChallengeProgress).filter(ChallengeProgress.challenge_id == ch.id).count()
    )
    return ChallengeWithProgressOut(
        id=ch.id,
        title=ch.title,
        description=ch.description,
        challenge_type=ch.challenge_type,
        target_count=ch.target_count,
        unit_label=ch.unit_label,
        points_reward=ch.points_reward,
        category_tag=ch.category_tag,
        is_active=ch.is_active,
        participant_count=participants,
    )


@router.delete("/challenges/{challenge_id}")
def delete_challenge(challenge_id: int, db: Session = Depends(get_db)):
    ch = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not ch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found.")
    db.delete(ch)
    db.commit()
    return {"message": "Challenge deleted."}
