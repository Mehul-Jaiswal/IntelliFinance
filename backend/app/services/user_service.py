from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.auth import get_password_hash, verify_password


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email
        """
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Get user by ID
        """
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, email: str, password: str, full_name: str = None) -> User:
        """
        Create a new user
        """
        hashed_password = get_password_hash(password)
        user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            is_active=True,
            is_verified=False
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        Authenticate user with email and password
        """
        user = self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def update_user(self, user_id: int, **kwargs) -> Optional[User]:
        """
        Update user information
        """
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def deactivate_user(self, user_id: int) -> bool:
        """
        Deactivate user account
        """
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        user.is_active = False
        self.db.commit()
        return True

    def change_password(self, user_id: int, new_password: str) -> bool:
        """
        Change user password
        """
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        user.hashed_password = get_password_hash(new_password)
        self.db.commit()
        return True
