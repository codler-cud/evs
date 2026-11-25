"""Waste categories, disposal methods, and waste items ORM models."""

from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class WasteCategory(Base):
    """Primary waste classification category (Wet/Organic, Dry/Recyclable, E-Waste, Hazardous)."""

    __tablename__ = "waste_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(60), unique=True, nullable=False, index=True)
    bin_color: Mapped[str] = mapped_column(String(40), nullable=False)
    bin_label: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    examples: Mapped[str] = mapped_column(Text, nullable=False)
    icon_name: Mapped[str] = mapped_column(String(50), default="recycle", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    waste_items = relationship("WasteItem", back_populates="category")
    waste_records = relationship("WasteRecord", back_populates="category")
    disposal_methods = relationship("DisposalMethod", back_populates="category")


class DisposalMethod(Base):
    """Standardized disposal/recycling pathways stored in the database."""

    __tablename__ = "disposal_methods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("waste_categories.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    default_steps: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    category = relationship("WasteCategory", back_populates="disposal_methods")
    waste_items = relationship("WasteItem", back_populates="disposal_method")


class WasteItem(Base):
    """Searchable waste item with categorization, bin recommendation, and step-by-step instructions."""

    __tablename__ = "waste_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(140), unique=True, nullable=False, index=True)
    keywords: Mapped[str] = mapped_column(String(300), default="", nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("waste_categories.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    disposal_method_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("disposal_methods.id", ondelete="SET NULL"), nullable=True, index=True
    )
    bin_type: Mapped[str] = mapped_column(String(100), nullable=False)
    recyclable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    disposal_method_text: Mapped[str] = mapped_column(String(160), nullable=False)
    instructions: Mapped[str] = mapped_column(Text, nullable=False)  # Newline-separated steps
    environmental_tip: Mapped[str] = mapped_column(Text, nullable=False)
    image_example: Mapped[str | None] = mapped_column(String(255), nullable=True)
    search_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    category = relationship("WasteCategory", back_populates="waste_items")
    disposal_method = relationship("DisposalMethod", back_populates="waste_items")
    waste_records = relationship("WasteRecord", back_populates="waste_item")
