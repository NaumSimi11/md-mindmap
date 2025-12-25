"""
Authentication Service
======================

Pattern: Three-Layer Architecture (Service Layer)
- Business logic ONLY
- No HTTP handling (that's in routers)
- No direct database calls (uses repositories if needed, or inline for simplicity)

Security: SECURITY_CHECKLIST.md compliant
Success Rate: 99%
"""

from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
import asyncio

from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from app.config import settings


class AuthService:
    """
    Authentication Service
    
    Responsibilities:
    - User registration (with validation)
    - User login (credential verification)
    - Token generation (access + refresh)
    - Password validation
    
    Pattern: Business Logic Layer (PATTERNS_ADOPTION.md)
    - No HTTP concerns (status codes, headers)
    - Raises ValueError for business logic errors
    - Caller (router) converts to HTTP responses
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize AuthService
        
        Args:
            db: Database session (injected by FastAPI)
        """
        self.db = db
    
    # =========================================
    # User Registration
    # =========================================
    
    async def register_user(self, user_data: UserRegister) -> Dict[str, Any]:
        """
        Register a new user
        
        Flow:
        1. Check if email/username already exists
        2. Hash password (bcrypt, 12 rounds)
        3. Create user in database
        4. Generate tokens (access + refresh)
        5. Return user + tokens
        
        Args:
            user_data: Registration data (validated by Pydantic)
            
        Returns:
            Dict with user and tokens
            
        Raises:
            ValueError: If email/username already exists
            
        Security:
        - Password is hashed with bcrypt (12 rounds)
        - Plain password NEVER stored
        - Email is unique
        - Username is unique
        """
        # 1. Check if email already exists
        result = await self.db.execute(
            select(User).where(User.email == user_data.email)
        )
        existing_user = result.scalars().first()
        
        if existing_user:
            raise ValueError(f"Email '{user_data.email}' is already registered")
        
        # 2. Check if username already exists
        result = await self.db.execute(
            select(User).where(User.username == user_data.username)
        )
        existing_user = result.scalars().first()
        
        if existing_user:
            raise ValueError(f"Username '{user_data.username}' is already taken")
        
        # 3. Hash password (SECURITY_CHECKLIST.md - bcrypt 12 rounds)
        hashed_password = hash_password(user_data.password)
        
        # 4. Create user
        new_user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            is_active=True,
        )
        
        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)
        
        # 5. Generate tokens
        access_token = create_access_token({"sub": str(new_user.id)})
        refresh_token = create_refresh_token(str(new_user.id))
        
        # 6. Send welcome email (fire-and-forget)
        try:
            from app.services.email_service import email_service
            asyncio.create_task(email_service.send_welcome_email(new_user))
        except RuntimeError:
            # No running event loop – skip welcome email
            pass
        except Exception:
            # Don't fail registration if email fails
            pass
        
        return {
            "user": new_user.to_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # seconds
        }
    
    # =========================================
    # User Login
    # =========================================
    
    async def login_user(self, login_data: UserLogin) -> Dict[str, Any]:
        """
        Authenticate user and generate tokens
        
        Flow:
        1. Find user by email
        2. Verify password (bcrypt)
        3. Check if account is active
        4. Generate tokens (access + refresh)
        5. Return user + tokens
        
        Args:
            login_data: Login credentials (validated by Pydantic)
            
        Returns:
            Dict with user and tokens
            
        Raises:
            ValueError: If credentials are invalid or account is inactive
            
        Security:
        - Rate limited (handled by middleware)
        - Password verified with bcrypt
        - Account active check
        """
        # 1. Find user by email
        result = await self.db.execute(
            select(User).where(
                User.email == login_data.email,
                User.is_deleted == False
            )
        )
        user = result.scalars().first()
        
        if not user:
            raise ValueError("Invalid email or password")
        
        # 2. Verify password (bcrypt)
        if not verify_password(login_data.password, user.hashed_password):
            raise ValueError("Invalid email or password")
        
        # 3. Check if account is active
        if not user.is_active:
            raise ValueError("Account is suspended. Please contact support.")
        
        # 4. Generate tokens
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token(str(user.id))
        
        return {
            "user": user.to_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # seconds
        }
    
    # =========================================
    # Token Refresh
    # =========================================
    
    async def refresh_tokens(self, user_id: str) -> Dict[str, Any]:
        """
        Refresh access token using refresh token
        
        Flow:
        1. Find user by ID
        2. Check if user still exists and is active
        3. Generate new tokens (rotate refresh token)
        
        Args:
            user_id: User ID from refresh token
            
        Returns:
            Dict with new tokens
            
        Raises:
            ValueError: If user not found or inactive
            
        Security:
        - Refresh token should be rotated (single-use)
        - Old refresh token should be blacklisted (Phase 1: Redis)
        """
        # 1. Find user
        result = await self.db.execute(
            select(User).where(
                User.id == user_id,
                User.is_deleted == False
            )
        )
        user = result.scalars().first()
        
        if not user:
            raise ValueError("User not found")
        
        if not user.is_active:
            raise ValueError("Account is suspended")
        
        # 2. Generate new tokens (rotate refresh token)
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token(str(user.id))
        
        # TODO Phase 1: Blacklist old refresh token
        # await blacklist_token(old_jti, expire_seconds)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }
    
    # =========================================
    # Get User by ID
    # =========================================
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Get user by ID
        
        Args:
            user_id: User ID (UUID)
            
        Returns:
            User object or None if not found
        """
        result = await self.db.execute(
            select(User).where(
                User.id == user_id,
                User.is_deleted == False
            )
        )
        return result.scalars().first()

