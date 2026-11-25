"""Environmental awareness articles endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.awareness import AwarenessArticle
from app.schemas.awareness import AwarenessArticleOut

router = APIRouter(prefix="/awareness", tags=["Awareness & Education"])


@router.get("", response_model=List[AwarenessArticleOut])
def list_awareness_articles(
    tag: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """List educational articles, optionally filtered by topic tag."""
    query = db.query(AwarenessArticle)
    if tag and tag.lower() != "all":
        query = query.filter(AwarenessArticle.category_tag.ilike(f"%{tag.strip()}%"))
    return query.order_by(AwarenessArticle.is_featured.desc(), AwarenessArticle.id.asc()).all()


@router.get("/{slug}", response_model=AwarenessArticleOut)
def get_awareness_article(slug: str, db: Session = Depends(get_db)):
    """Fetch a single awareness article by slug."""
    article = db.query(AwarenessArticle).filter(AwarenessArticle.slug == slug).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found.",
        )
    return article
