from datetime import timedelta
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.utils import auth as security
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.services.user_service import UserService
from app.utils.auth import create_access_token, get_current_user

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

router = APIRouter()

@router.post("/register")
async def register(
    *,
    db: Session = Depends(get_db),
    user_data: UserRegister
) -> Any:
    """
    Register a new user
    """
    user_service = UserService(db)
    
    # Check if user already exists
    if user_service.get_user_by_email(user_data.email):
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )
    
    # Create new user
    user = user_service.create_user(
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name
    )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active
        }
    }

@router.post("/login")
async def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user_service = UserService(db)
    user = user_service.authenticate_user(
        email=form_data.username,
        password=form_data.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active
        }
    }

@router.post("/refresh")
async def refresh_token(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Refresh access token
    """
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(current_user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me")
async def read_users_me(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current user
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "currency": current_user.currency,
        "timezone": current_user.timezone
    }
