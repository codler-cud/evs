"""Waste categories, items, and AI classification schemas."""

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class WasteCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    bin_color: str
    bin_label: str
    description: str
    examples: str
    icon_name: str


class DisposalMethodOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    category_id: int
    summary: str
    default_steps: str


class WasteItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    keywords: str
    description: str
    category_id: int
    disposal_method_id: Optional[int] = None
    bin_type: str
    recyclable: bool
    disposal_method_text: str
    instructions: str
    environmental_tip: str
    image_example: Optional[str] = None
    search_count: int
    category: WasteCategoryOut
    created_at: datetime


class WasteItemCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=140)
    keywords: str = Field(default="", max_length=300)
    description: str = Field(..., min_length=5)
    category_id: int
    disposal_method_id: Optional[int] = None
    bin_type: str = Field(..., min_length=2, max_length=100)
    recyclable: bool = True
    disposal_method_text: str = Field(..., min_length=2, max_length=160)
    instructions: str = Field(..., min_length=5)
    environmental_tip: str = Field(..., min_length=5)
    image_example: Optional[str] = Field(default=None, max_length=255)


class WasteItemUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=140)
    keywords: Optional[str] = Field(default=None, max_length=300)
    description: Optional[str] = Field(default=None, min_length=5)
    category_id: Optional[int] = None
    disposal_method_id: Optional[int] = None
    bin_type: Optional[str] = Field(default=None, min_length=2, max_length=100)
    recyclable: Optional[bool] = None
    disposal_method_text: Optional[str] = Field(default=None, min_length=2, max_length=160)
    instructions: Optional[str] = Field(default=None, min_length=5)
    environmental_tip: Optional[str] = Field(default=None, min_length=5)
    image_example: Optional[str] = Field(default=None, max_length=255)


class AIClassificationCandidate(BaseModel):
    category_slug: str
    category_name: str
    confidence: float


class AIClassificationResponse(BaseModel):
    predicted_label: str
    predicted_category_slug: str
    predicted_category: WasteCategoryOut
    confidence: float
    confidence_percent: int
    needs_manual_confirmation: bool
    model_name: str
    model_notes: str
    visual_signals: Dict[str, float | str]
    top_candidates: List[AIClassificationCandidate]
    matched_item: Optional[WasteItemOut] = None
    suggested_items: List[WasteItemOut] = []
    recommended_action: str
