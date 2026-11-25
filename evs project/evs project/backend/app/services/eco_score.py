"""Transparent, assumption-based Eco Score calculation and level progression."""

from typing import Dict, List
from sqlalchemy.orm import Session

from app.models.activity import WasteRecord
from app.models.user import User

ECO_LEVELS = [
    (0, "Seed Starter", "sage"),
    (50, "Eco Explorer", "emerald"),
    (150, "Green Guardian", "forest"),
    (300, "Sustainability Champion", "gold"),
]

# Transparent point rules (project assumptions — not scientific carbon metrics)
ACTION_BASE_POINTS: Dict[str, int] = {
    "Recycled": 12,
    "Composted": 10,
    "E-Waste Disposal": 25,
    "Hazardous Drop-off": 22,
    "Reused": 14,
}

CATEGORY_BONUS_POINTS: Dict[str, int] = {
    "dry-recyclable": 3,
    "wet-organic": 2,
    "e-waste": 10,
    "hazardous-special": 8,
}

SCORING_RULES: List[Dict[str, str | int]] = [
    {"action": "Dry / Recyclable properly sorted", "points": 15, "note": "12 base + 3 category bonus per action"},
    {"action": "Wet / Organic waste composted", "points": 12, "note": "10 base + 2 category bonus per action"},
    {"action": "E-Waste dropped at authorized centre", "points": 35, "note": "25 base + 10 category bonus (high environmental hazard avoided)"},
    {"action": "Hazardous waste safely handled", "points": 30, "note": "22 base + 8 category bonus"},
    {"action": "Item reused or repurposed", "points": 14, "note": "Supports the 3R Reuse principle"},
    {"action": "Consistency bonus (5+ total records)", "points": 15, "note": "One-time milestone bonus for building a habit"},
    {"action": "Challenge completion reward", "points": 50, "note": "Varies per challenge (30–100 pts)"},
]


def calculate_record_points(category_slug: str, action_type: str, quantity: int = 1) -> int:
    """Compute Eco Score points for a single disposal record.

    Capped per log entry to keep the scoring fair and prevent accidental inflation.
    """
    base = ACTION_BASE_POINTS.get(action_type, 10)
    bonus = CATEGORY_BONUS_POINTS.get(category_slug, 0)
    effective_qty = min(max(quantity, 1), 5)
    # Full points for first item, modest scaling for bulk logs
    return (base + bonus) + (effective_qty - 1) * 4


def get_eco_level(score: int) -> dict:
    """Return the user's current Eco Level and progress toward the next tier."""
    current_name = ECO_LEVELS[0][1]
    current_color = ECO_LEVELS[0][2]
    current_floor = 0
    next_name = None
    next_threshold = None

    for idx, (threshold, name, color) in enumerate(ECO_LEVELS):
        if score >= threshold:
            current_name = name
            current_color = color
            current_floor = threshold
            if idx + 1 < len(ECO_LEVELS):
                next_threshold = ECO_LEVELS[idx + 1][0]
                next_name = ECO_LEVELS[idx + 1][1]
            else:
                next_threshold = None
                next_name = None

    if next_threshold is None:
        progress_percent = 100
    else:
        span = max(next_threshold - current_floor, 1)
        progress_percent = min(100, int(((score - current_floor) / span) * 100))

    return {
        "level_name": current_name,
        "badge_color": current_color,
        "current_score": score,
        "next_level_name": next_name,
        "next_level_threshold": next_threshold,
        "progress_percent": progress_percent,
        "scoring_rules": SCORING_RULES,
        "impact_disclaimer": (
            "Eco Score is a motivational engagement metric based on project assumptions "
            "for responsible segregation actions, not an exact measurement of kg CO2 saved."
        ),
    }


def recalculate_user_score(db: Session, user: User) -> int:
    """Recompute a user's Eco Score cleanly from all records + claimed challenge rewards."""
    records = db.query(WasteRecord).filter(WasteRecord.user_id == user.id).all()
    total = sum(r.points_earned for r in records)
    if len(records) >= 5:
        total += 15  # Consistency habit bonus

    for cp in user.challenge_progress:
        if cp.reward_claimed and cp.challenge:
            total += cp.challenge.points_reward

    user.eco_score = total
    db.add(user)
    return total
