from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.utils.auth import get_current_active_user

router = APIRouter()

@router.get("/profile")
async def get_user_profile(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current user profile
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "currency": current_user.currency,
        "timezone": current_user.timezone,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at
    }

@router.put("/profile")
async def update_user_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    full_name: str = None,
    currency: str = None,
    timezone: str = None
) -> Any:
    """
    Update user profile
    """
    if full_name is not None:
        current_user.full_name = full_name
    if currency is not None:
        current_user.currency = currency
    if timezone is not None:
        current_user.timezone = timezone
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "currency": current_user.currency,
            "timezone": current_user.timezone
        }
    }
