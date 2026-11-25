"""User waste disposal tracking ORM model."""

from datetime import date, datetime, timezone
from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class WasteRecord(Base):
    """Logged responsible disposal or recycling action by a user."""

    __tablename__ = "waste_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    waste_item_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("waste_items.id", ondelete="SET NULL"), nullable=True, index=True
    )
    item_name: Mapped[str] = mapped_column(String(150), nullable=False)
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("waste_categories.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    action_type: Mapped[str] = mapped_column(
        String(80), nullable=False, index=True
    )  # e.g. "Recycled", "Composted", "E-Waste Disposal", "Hazardous Drop-off", "Reused"
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    points_earned: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    disposed_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user = relationship("User", back_populates="waste_records")
    waste_item = relationship("WasteItem", back_populates="waste_records")
    category = relationship("WasteCategory", back_populates="waste_records")
