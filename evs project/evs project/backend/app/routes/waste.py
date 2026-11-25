"""Waste search, category lookup, and AI waste classification endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.ai.service import WasteClassificationService
from app.database.session import get_db
from app.models.waste import WasteCategory, WasteItem
from app.schemas.waste import AIClassificationResponse, WasteCategoryOut, WasteItemOut

router = APIRouter(prefix="/waste", tags=["Waste & AI Classification"])
ai_service = WasteClassificationService()


@router.get("/categories", response_model=List[WasteCategoryOut])
def list_categories(db: Session = Depends(get_db)):
    """List all waste segregation categories."""
    return db.query(WasteCategory).order_by(WasteCategory.id.asc()).all()


@router.get("", response_model=List[WasteItemOut])
def search_waste_items(
    q: Optional[str] = Query(default=None, description="Search waste item by name or keyword"),
    category: Optional[str] = Query(default=None, description="Filter by category slug"),
    db: Session = Depends(get_db),
):
    """Search waste items by query text and/or category slug."""
    query = db.query(WasteItem).options(joinedload(WasteItem.category))

    if category and category != "all":
        query = query.join(WasteCategory).filter(WasteCategory.slug == category)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                WasteItem.name.ilike(term),
                WasteItem.keywords.ilike(term),
                WasteItem.description.ilike(term),
            )
        )

    return query.order_by(WasteItem.search_count.desc(), WasteItem.name.asc()).all()


@router.get("/{item_id}", response_model=WasteItemOut)
def get_waste_item(
    item_id: int,
    track_search: bool = Query(default=True, description="Increment search popularity counter"),
    db: Session = Depends(get_db),
):
    """Retrieve full disposal instructions for a specific waste item."""
    item = (
        db.query(WasteItem)
        .options(joinedload(WasteItem.category))
        .filter(WasteItem.id == item_id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waste item not found.",
        )

    if track_search:
        item.search_count += 1
        db.add(item)
        db.commit()
        db.refresh(item)

    return item


@router.post("/classify", response_model=AIClassificationResponse)
async def classify_waste_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Classify an uploaded waste photo via the AI service and fetch DB disposal guidance."""
    allowed_types = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    if file.content_type and file.content_type.lower() not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image format. Please upload a JPG, PNG, or WEBP image.",
        )

    raw_bytes = await file.read()
    try:
        result = ai_service.classify_image_bytes(
            db=db,
            raw_bytes=raw_bytes,
            filename=file.filename or "",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return result
