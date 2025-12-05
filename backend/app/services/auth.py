"""
Authentication Service
Business logic for user authentication and management
"""

from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.config import settings


class AuthService:
    """Service for handling authentication operations"""
    
    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        """
        Create a new user
        
        Args:
            db: Database session
            user_data: User registration data
            
        Returns:
            Created user instance
            
        Raises:
            IntegrityError: If email or username already exists
        """
        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Create user instance
        user = User(
            email=user_data.email.lower(),
            username=user_data.username.lower(),
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            bio=user_data.bio,
            avatar_url=user_data.avatar_url,
        )
        
        try:
            db.add(user)
            db.commit()
            db.refresh(user)
            return user
        except IntegrityError as e:
            db.rollback()
            if "email" in str(e.orig):
                raise ValueError("Email already registered")
            elif "username" in str(e.orig):
                raise ValueError("Username already taken")
            raise
    
    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin) -> Optional[User]:
        """
        Authenticate a user with email and password
        
        Args:
            db: Database session
            login_data: Login credentials
            
        Returns:
            User instance if authentication successful, None otherwise
        """
        # Find user by email
        user = db.query(User).filter(
            User.email == login_data.email.lower(),
            User.is_deleted == False
        ).first()
        
        if not user:
            return None
        
        # Verify password
        if not verify_password(login_data.password, user.hashed_password):
            return None
        
        # Check if user is active
        if not user.is_active:
            return None
        
        # Update last login
        user.update_last_login()
        db.commit()
        
        return user
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        """
        Get user by ID
        
        Args:
            db: Database session
            user_id: User UUID
            
        Returns:
            User instance if found, None otherwise
        """
        return db.query(User).filter(
            User.id == user_id,
            User.is_deleted == False
        ).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """
        Get user by email
        
        Args:
            db: Database session
            email: User email address
            
        Returns:
            User instance if found, None otherwise
        """
        return db.query(User).filter(
            User.email == email.lower(),
            User.is_deleted == False
        ).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """
        Get user by username
        
        Args:
            db: Database session
            username: Username
            
        Returns:
            User instance if found, None otherwise
        """
        return db.query(User).filter(
            User.username == username.lower(),
            User.is_deleted == False
        ).first()
    
    @staticmethod
    def create_tokens_for_user(user: User) -> dict:
        """
        Create access and refresh tokens for a user
        
        Args:
            user: User instance
            
        Returns:
            Dictionary with access_token, refresh_token, and metadata
        """
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "username": user.username,
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
        }

