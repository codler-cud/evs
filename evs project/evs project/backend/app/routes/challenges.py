"""Waste segregation challenges endpoints."""

import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_optional_user
from app.database.session import get_db
from app.models.challenge import Challenge, ChallengeProgress
from app.models.user import User
from app.schemas.challenge import ChallengeProgressUpdate, ChallengeWithProgressOut
from app.services.eco_score import recalculate_user_score

router = APIRouter(prefix="/challenges", tags=["Challenges"])


def _serialize_challenge(
    challenge: Challenge,
    progress: Optional[ChallengeProgress],
    participant_count: int,
) -> ChallengeWithProgressOut:
    steps: List[int] = []
    if progress and progress.completed_steps_json:
        try:
            steps = json.loads(progress.completed_steps_json)
        except json.JSONDecodeError:
            steps = []

    return ChallengeWithProgressOut(
        id=challenge.id,
        title=challenge.title,
        description=challenge.description,
        challenge_type=challenge.challenge_type,
        target_count=challenge.target_count,
        unit_label=challenge.unit_label,
        points_reward=challenge.points_reward,
        category_tag=challenge.category_tag,
        is_active=challenge.is_active,
        participant_count=participant_count,
        joined=progress is not None,
        current_count=progress.current_count if progress else 0,
        completed_steps=steps,
        status=progress.status if progress else None,
        reward_claimed=progress.reward_claimed if progress else False,
        joined_at=progress.joined_at if progress else None,
        completed_at=progress.completed_at if progress else None,
    )


@router.get("", response_model=List[ChallengeWithProgressOut])
def list_challenges(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """List active challenges, enriched with the current user's progress if logged in."""
    challenges = (
        db.query(Challenge)
        .filter(Challenge.is_active.is_(True))
        .order_by(Challenge.id.asc())
        .all()
    )

    progress_map = {}
    if current_user:
        user_entries = (
            db.query(ChallengeProgress)
            .filter(ChallengeProgress.user_id == current_user.id)
            .all()
        )
        progress_map = {cp.challenge_id: cp for cp in user_entries}

    result = []
    for ch in challenges:
        count = db.query(ChallengeProgress).filter(ChallengeProgress.challenge_id == ch.id).count()
        result.append(_serialize_challenge(ch, progress_map.get(ch.id), count))
    return result


@router.post("/{challenge_id}/join", response_model=ChallengeWithProgressOut)
def join_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Enroll the authenticated user in a challenge."""
    challenge = (
        db.query(Challenge)
        .filter(Challenge.id == challenge_id, Challenge.is_active.is_(True))
        .first()
    )
    if not challenge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found.")

    existing = (
        db.query(ChallengeProgress)
        .filter(
            ChallengeProgress.user_id == current_user.id,
            ChallengeProgress.challenge_id == challenge_id,
        )
        .first()
    )
    if not existing:
        existing = ChallengeProgress(
            user_id=current_user.id,
            challenge_id=challenge_id,
            current_count=0,
            completed_steps_json="[]",
            status="in_progress",
        )
        db.add(existing)
        db.commit()
        db.refresh(existing)

    participant_count = (
        db.query(ChallengeProgress).filter(ChallengeProgress.challenge_id == challenge_id).count()
    )
    return _serialize_challenge(challenge, existing, participant_count)


@router.post("/{challenge_id}/progress", response_model=ChallengeWithProgressOut)
def update_challenge_progress(
    challenge_id: int,
    payload: ChallengeProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Advance progress (or toggle a specific day) for a joined challenge."""
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found.")

    progress = (
        db.query(ChallengeProgress)
        .filter(
            ChallengeProgress.user_id == current_user.id,
            ChallengeProgress.challenge_id == challenge_id,
        )
        .first()
    )
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please join the challenge before logging progress.",
        )

    try:
        steps: List[int] = json.loads(progress.completed_steps_json or "[]")
    except json.JSONDecodeError:
        steps = []

    if payload.step_number is not None:
        step = min(payload.step_number, challenge.target_count)
        if step in steps:
            steps.remove(step)
        else:
            steps.append(step)
        steps = sorted(set(steps))
        progress.current_count = len(steps)
    else:
        next_count = min(challenge.target_count, progress.current_count + payload.increment)
        progress.current_count = next_count
        steps = list(range(1, next_count + 1))

    progress.completed_steps_json = json.dumps(steps)

    if progress.current_count >= challenge.target_count:
        progress.status = "completed"
        if not progress.completed_at:
            progress.completed_at = datetime.now(timezone.utc)
        progress.reward_claimed = True
    else:
        progress.status = "in_progress"
        progress.completed_at = None
        progress.reward_claimed = False

    db.add(progress)
    db.flush()
    recalculate_user_score(db, current_user)
    db.commit()
    db.refresh(progress)

    participant_count = (
        db.query(ChallengeProgress).filter(ChallengeProgress.challenge_id == challenge_id).count()
    )
    return _serialize_challenge(challenge, progress, participant_count)
