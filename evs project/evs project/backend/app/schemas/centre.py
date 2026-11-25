"""Collection centre schemas."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CollectionCentreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    address: str
    city: str
    waste_types: str
    contact_phone: str
    contact_email: Optional[str] = None
    operating_hours: str
    notes: Optional[str] = None
    latitude: float
    longitude: float
    is_active: bool
    created_at: datetime

    @property
    def waste_types_list(self) -> List[str]:
        return [t.strip() for t in self.waste_types.split(",") if t.strip()]


class CollectionCentreCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=160)
    address: str = Field(..., min_length=5, max_length=280)
    city: str = Field(..., min_length=2, max_length=100)
    waste_types: str = Field(..., min_length=2, max_length=255)
    contact_phone: str = Field(..., min_length=5, max_length=40)
    contact_email: Optional[str] = Field(default=None, max_length=150)
    operating_hours: str = Field(..., min_length=3, max_length=140)
    notes: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    is_active: bool = True


class CollectionCentreUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=160)
    address: Optional[str] = Field(default=None, min_length=5, max_length=280)
    city: Optional[str] = Field(default=None, min_length=2, max_length=100)
    waste_types: Optional[str] = Field(default=None, min_length=2, max_length=255)
    contact_phone: Optional[str] = Field(default=None, min_length=5, max_length=40)
    contact_email: Optional[str] = Field(default=None, max_length=150)
    operating_hours: Optional[str] = Field(default=None, min_length=3, max_length=140)
    notes: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    is_active: Optional[bool] = None
