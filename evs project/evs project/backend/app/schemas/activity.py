"""Waste disposal record and dashboard schemas."""

from datetime import date, datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.waste import WasteCategoryOut


class WasteRecordCreate(BaseModel):
    waste_item_id: Optional[int] = None
    item_name: str = Field(..., min_length=2, max_length=150)
    category_id: int
    action_type: str = Field(..., min_length=2, max_length=80)
    quantity: int = Field(default=1, ge=1, le=500)
    notes: Optional[str] = Field(default=None, max_length=400)
    disposed_date: Optional[date] = None


class WasteRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    waste_item_id: Optional[int] = None
    item_name: str
    category_id: int
    action_type: str
    quantity: int
    points_earned: int
    notes: Optional[str] = None
    disposed_date: date
    created_at: datetime
    category: WasteCategoryOut


class ChallengeSummaryOut(BaseModel):
    challenge_id: int
    title: str
    challenge_type: str
    current_count: int
    target_count: int
    unit_label: str
    status: str
    points_reward: int


class EcoLevelInfo(BaseModel):
    level_name: str
    badge_color: str
    current_score: int
    next_level_name: Optional[str] = None
    next_level_threshold: Optional[int] = None
    progress_percent: int
    scoring_rules: List[Dict[str, str | int]]
    impact_disclaimer: str


class DashboardOut(BaseModel):
    user_name: str
    total_records: int
    total_items_disposed: int
    recyclable_items: int
    ewaste_items: int
    wet_composted_items: int
    hazardous_items: int
    eco_score: int
    eco_level: EcoLevelInfo
    current_challenge: Optional[ChallengeSummaryOut] = None
    recent_activities: List[WasteRecordOut]
    estimated_diversion_note: str
