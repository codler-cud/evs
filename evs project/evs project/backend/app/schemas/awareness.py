"""Awareness article and admin analytics schemas."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AwarenessArticleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    summary: str
    content: str
    category_tag: str
    reading_time_mins: int
    is_featured: bool
    created_at: datetime
    updated_at: datetime


class AwarenessArticleCreate(BaseModel):
    title: str = Field(..., min_length=4, max_length=180)
    slug: Optional[str] = Field(default=None, max_length=120)
    summary: str = Field(..., min_length=10)
    content: str = Field(..., min_length=20)
    category_tag: str = Field(..., min_length=2, max_length=60)
    reading_time_mins: int = Field(default=3, ge=1, le=30)
    is_featured: bool = False


class AwarenessArticleUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=4, max_length=180)
    summary: Optional[str] = Field(default=None, min_length=10)
    content: Optional[str] = Field(default=None, min_length=20)
    category_tag: Optional[str] = Field(default=None, min_length=2, max_length=60)
    reading_time_mins: Optional[int] = Field(default=None, ge=1, le=30)
    is_featured: Optional[bool] = None


class AdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    is_active: bool
    eco_score: int
    location: Optional[str] = None
    records_count: int = 0
    created_at: datetime


class AdminUserStatusUpdate(BaseModel):
    is_active: bool


class ChartPoint(BaseModel):
    label: str
    value: int


class AdminAnalyticsOut(BaseModel):
    total_users: int
    active_users: int
    total_waste_records: int
    total_recycling_actions: int
    total_ewaste_records: int
    total_waste_items_catalog: int
    total_collection_centres: int
    most_searched_items: List[ChartPoint]
    category_distribution: List[ChartPoint]
    top_disposal_actions: List[ChartPoint]
    challenge_participation: List[ChartPoint]
