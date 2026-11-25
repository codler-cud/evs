"""Authentication and user profile endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, UserLogin, UserRegister, UserResponse, UserUpdate

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Create a new standard user account with bcrypt password hashing."""
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        password_hash=hash_password(payload.password),
        role="user",
        is_active=True,
        eco_score=0,
        location=payload.location.strip() if payload.location else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user_id=user.id, role=user.role)
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate an existing user and issue a JWT access token."""
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials and try again.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated by an administrator.",
        )

    token = create_access_token(user_id=user.id, role=user.role)
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/logout")
def logout():
    """Stateless JWT logout endpoint for client session cleanup."""
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile name or location for the authenticated user."""
    if payload.name is not None:
        current_user.name = payload.name.strip()
    if payload.location is not None:
        current_user.location = payload.location.strip() or None
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
