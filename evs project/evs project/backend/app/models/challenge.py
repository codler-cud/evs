"""Waste segregation challenges and user progress ORM models."""

from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Challenge(Base):
    """Community or personal sustainability challenge."""

    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    challenge_type: Mapped[str] = mapped_column(
        String(40), default="count", nullable=False
    )  # "daily" (e.g., 7-day tracker) or "count" (e.g., recycle 10 items)
    target_count: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    unit_label: Mapped[str] = mapped_column(String(40), default="days", nullable=False)
    points_reward: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    category_tag: Mapped[str] = mapped_column(String(60), default="General", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    progress_entries = relationship(
        "ChallengeProgress", back_populates="challenge", cascade="all, delete-orphan"
    )


class ChallengeProgress(Base):
    """Tracks an individual user's participation and progress in a challenge."""

    __tablename__ = "challenge_progress"
    __table_args__ = (UniqueConstraint("user_id", "challenge_id", name="uq_user_challenge"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    challenge_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True
    )
    current_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_steps_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default="in_progress", nullable=False
    )  # "in_progress" | "completed"
    reward_claimed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="challenge_progress")
    challenge = relationship("Challenge", back_populates="progress_entries")
