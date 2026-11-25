"""Collection and recycling centres endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.centre import CollectionCentre
from app.schemas.centre import CollectionCentreOut

router = APIRouter(prefix="/collection-centres", tags=["Collection Centres"])


@router.get("", response_model=List[CollectionCentreOut])
def list_collection_centres(
    waste_type: Optional[str] = Query(default=None, description="Filter by accepted waste type"),
    q: Optional[str] = Query(default=None, description="Search by centre name, address, or city"),
    db: Session = Depends(get_db),
):
    """List active recycling and collection centres with optional type and text filters."""
    query = db.query(CollectionCentre).filter(CollectionCentre.is_active.is_(True))

    if waste_type and waste_type.lower() != "all":
        query = query.filter(CollectionCentre.waste_types.ilike(f"%{waste_type.strip()}%"))

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                CollectionCentre.name.ilike(term),
                CollectionCentre.address.ilike(term),
                CollectionCentre.city.ilike(term),
                CollectionCentre.waste_types.ilike(term),
            )
        )

    return query.order_by(CollectionCentre.name.asc()).all()


@router.get("/{centre_id}", response_model=CollectionCentreOut)
def get_collection_centre(centre_id: int, db: Session = Depends(get_db)):
    """Get details of a single collection centre."""
    centre = db.query(CollectionCentre).filter(CollectionCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection centre not found.",
        )
    return centre
