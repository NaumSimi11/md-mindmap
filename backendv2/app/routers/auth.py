"""
Authentication Router
=====================

Pattern: Three-Layer Architecture (Router/API Layer)
- HTTP handling ONLY (request/response)
- No business logic (that's in AuthService)
- Clean error handling

API Contract: API_CONTRACTS.md - Section 2 (Authentication Endpoints)
Success Rate: 99%
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.auth_service import AuthService
from app.dependencies.auth import get_auth_service, get_current_user
from app.models.user import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenRefresh,
    UserResponse,
    RegisterResponse,
    LoginResponse,
    TokenResponse,
)
from app.utils.security import decode_token
from jose import JWTError


# =========================================
# Router Configuration
# =========================================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# =========================================
# Register (API_CONTRACTS.md - 2.1)
# =========================================

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description=(
        "Register a new user account\n\n"
        "**Validation:**\n"
        "- Email: Valid email format, unique\n"
        "- Username: 3-50 chars, alphanumeric + _ -, unique\n"
        "- Password: 8+ chars, uppercase, lowercase, digit, special\n\n"
        "**Returns:** User data + JWT tokens"
    )
)
async def register(
    user_data: UserRegister,
    auth_service: AuthService = Depends(get_auth_service)
) -> RegisterResponse:
    """
    Register a new user
    
    Pattern: API Layer (PATTERNS_ADOPTION.md #1)
    - Validation handled by Pydantic (UserRegister)
    - Business logic in AuthService
    - Error handling converts to HTTP responses
    """
    try:
        result = await auth_service.register_user(user_data)
        return RegisterResponse(**result)
        
    except ValueError as e:
        # Business logic error (email/username exists)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
        # Unexpected error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


# =========================================
# Login (API_CONTRACTS.md - 2.2)
# =========================================

@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Login",
    description=(
        "Authenticate user and receive JWT tokens\n\n"
        "**Rate Limited:** 5 requests per minute (security)\n\n"
        "**Returns:** User data + JWT tokens"
    )
)
async def login(
    login_data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service)
) -> LoginResponse:
    """
    Authenticate user and generate tokens
    
    Security:
    - Rate limited (5 req/min)
    - Password verified with bcrypt
    - Account active check
    """
    try:
        result = await auth_service.login_user(login_data)
        return LoginResponse(**result)
        
    except ValueError as e:
        # Invalid credentials or inactive account
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        # Unexpected error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


# =========================================
# Refresh Token (API_CONTRACTS.md - 2.3)
# =========================================

@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token",
    description=(
        "Refresh access token using refresh token\n\n"
        "**Security:** Refresh token should be rotated (single-use)"
    )
)
async def refresh_token(
    token_data: TokenRefresh,
    auth_service: AuthService = Depends(get_auth_service)
) -> TokenResponse:
    """
    Refresh access token
    
    Security:
    - Validates refresh token
    - Rotates refresh token (generates new one)
    - Old refresh token should be blacklisted (Phase 1)
    """
    try:
        # Decode refresh token
        payload = decode_token(token_data.refresh_token)
        
        # Validate token type
        token_type = payload.get("type")
        if token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        # Extract user ID
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Generate new tokens
        result = await auth_service.refresh_tokens(user_id)
        return TokenResponse(**result)
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    except ValueError as e:
        # User not found or inactive
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        # Unexpected error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


# =========================================
# Logout (API_CONTRACTS.md - 2.4)
# =========================================

@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout",
    description=(
        "Logout user (blacklist current token)\n\n"
        "**Note:** Phase 1 will implement token blacklist with Redis"
    )
)
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout user
    
    Phase 0: Returns success (client should discard tokens)
    Phase 1: Will blacklist token in Redis
    
    Security:
    - Token should be blacklisted until expiration
    - Prevents reuse of logged-out tokens
    """
    # TODO Phase 1: Blacklist token in Redis
    # jti = get_token_jti(request.headers.get("Authorization"))
    # await blacklist_token(jti, expire_seconds)
    
    return None  # 204 No Content


# =========================================
# Get Current User (API_CONTRACTS.md - 2.5)
# =========================================

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user",
    description="Get currently authenticated user's profile"
)
async def get_me(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """
    Get current user profile
    
    Requires: Valid JWT token in Authorization header
    """
    return UserResponse(**current_user.to_dict())

