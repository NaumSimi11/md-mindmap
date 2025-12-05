"""
Authentication Router
Endpoints for user registration, login, and token management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, TokenRefresh
from app.services.auth import AuthService
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.utils.security import verify_token, create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user
    
    - **email**: Valid email address (must be unique)
    - **username**: Unique username (3-50 chars, alphanumeric + _ -)
    - **password**: Strong password (min 8 chars, uppercase, lowercase, digit)
    - **full_name**: Optional full name
    - **bio**: Optional biography
    - **avatar_url**: Optional avatar image URL
    
    Returns the created user (without password)
    """
    try:
        user = AuthService.create_user(db, user_data)
        return UserResponse.model_validate(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )


@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT tokens
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns:
    - **access_token**: Short-lived JWT for API requests
    - **refresh_token**: Long-lived JWT for getting new access tokens
    - **token_type**: Always "bearer"
    - **expires_in**: Access token expiration time in seconds
    """
    user = AuthService.authenticate_user(db, login_data)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    tokens = AuthService.create_tokens_for_user(user)
    return Token(**tokens)


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: TokenRefresh,
    db: Session = Depends(get_db)
):
    """
    Get a new access token using a refresh token
    
    - **refresh_token**: Valid refresh token from login
    
    Returns new access and refresh tokens
    """
    # Verify refresh token
    payload = verify_token(token_data.refresh_token, token_type="refresh")
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user
    user_id = payload.get("sub")
    user = AuthService.get_user_by_id(db, user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new tokens
    tokens = AuthService.create_tokens_for_user(user)
    return Token(**tokens)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user's information
    
    Requires valid access token in Authorization header:
    `Authorization: Bearer <access_token>`
    
    Returns full user profile
    """
    return UserResponse.model_validate(current_user)


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout current user
    
    Note: Since we're using stateless JWT tokens, logout is handled client-side
    by deleting the tokens. This endpoint exists for completeness and could be
    extended to add tokens to a blacklist in Redis.
    """
    return {
        "message": "Successfully logged out",
        "user_id": str(current_user.id)
    }


@router.get("/check-email/{email}")
async def check_email_availability(
    email: str,
    db: Session = Depends(get_db)
):
    """
    Check if an email address is available for registration
    
    Returns:
    - **available**: True if email is not registered, False otherwise
    """
    user = AuthService.get_user_by_email(db, email)
    return {"available": user is None}


@router.get("/check-username/{username}")
async def check_username_availability(
    username: str,
    db: Session = Depends(get_db)
):
    """
    Check if a username is available for registration
    
    Returns:
    - **available**: True if username is not taken, False otherwise
    """
    user = AuthService.get_user_by_username(db, username)
    return {"available": user is None}

