"""SQLAlchemy ORM models package."""

from app.models.user import User
from app.models.waste import WasteCategory, DisposalMethod, WasteItem
from app.models.centre import CollectionCentre
from app.models.activity import WasteRecord
from app.models.challenge import Challenge, ChallengeProgress
from app.models.awareness import AwarenessArticle

__all__ = [
    "User",
    "WasteCategory",
    "DisposalMethod",
    "WasteItem",
    "CollectionCentre",
    "WasteRecord",
    "Challenge",
    "ChallengeProgress",
    "AwarenessArticle",
]
