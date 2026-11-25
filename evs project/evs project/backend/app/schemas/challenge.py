"""Challenge and progress schemas."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ChallengeCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=160)
    description: str = Field(..., min_length=5)
    challenge_type: str = Field(default="count", pattern="^(daily|count)$")
    target_count: int = Field(default=7, ge=1, le=100)
    unit_label: str = Field(default="items", min_length=1, max_length=40)
    points_reward: int = Field(default=50, ge=5, le=1000)
    category_tag: str = Field(default="General", max_length=60)
    is_active: bool = True


class ChallengeUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=160)
    description: Optional[str] = Field(default=None, min_length=5)
    challenge_type: Optional[str] = Field(default=None, pattern="^(daily|count)$")
    target_count: Optional[int] = Field(default=None, ge=1, le=100)
    unit_label: Optional[str] = Field(default=None, min_length=1, max_length=40)
    points_reward: Optional[int] = Field(default=None, ge=5, le=1000)
    category_tag: Optional[str] = Field(default=None, max_length=60)
    is_active: Optional[bool] = None


class ChallengeProgressUpdate(BaseModel):
    increment: int = Field(default=1, ge=1, le=20)
    step_number: Optional[int] = Field(default=None, ge=1, le=100)


class ChallengeWithProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    challenge_type: str
    target_count: int
    unit_label: str
    points_reward: int
    category_tag: str
    is_active: bool
    participant_count: int = 0
    joined: bool = False
    current_count: int = 0
    completed_steps: List[int] = []
    status: Optional[str] = None
    reward_claimed: bool = False
    joined_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
