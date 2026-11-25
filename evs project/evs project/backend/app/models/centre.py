"""Collection and recycling centre ORM model."""

from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class CollectionCentre(Base):
    """Registered recycling, e-waste, or hazardous waste drop-off facility."""

    __tablename__ = "collection_centres"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    address: Mapped[str] = mapped_column(String(280), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    waste_types: Mapped[str] = mapped_column(
        String(255), nullable=False
    )  # Comma-separated tags e.g. "E-waste,Metal,Plastic"
    contact_phone: Mapped[str] = mapped_column(String(40), nullable=False)
    contact_email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    operating_hours: Mapped[str] = mapped_column(String(140), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
