"""
Authentication Schemas
======================

Security Validation (SECURITY_CHECKLIST.md - Section 3):
✅ Email format validation
✅ Password complexity rules
✅ Username format validation
✅ Input sanitization

API Contract: API_CONTRACTS.md - Section 2 (Authentication Endpoints)
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


# =========================================
# Password Validation (SECURITY_CHECKLIST.md)
# =========================================

def validate_password_complexity(password: str) -> str:
    """
    Validate password meets security requirements
    
    Rules (SECURITY_CHECKLIST.md):
    - Min 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    
    if not re.search(r'[A-Z]', password):
        raise ValueError("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        raise ValueError("Password must contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        raise ValueError("Password must contain at least one digit")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValueError("Password must contain at least one special character")
    
    return password


# =========================================
# Register (API_CONTRACTS.md - 2.1)
# =========================================

class UserRegister(BaseModel):
    """
    User registration schema
    
    Validation:
    - email: Valid email format (EmailStr)
    - username: 3-50 chars, alphanumeric + _ -
    - password: Complex password (8+ chars, upper, lower, digit, special)
    - full_name: Optional, max 100 chars
    """
    email: EmailStr = Field(
        ...,
        description="Valid email address",
        examples=["user@example.com"]
    )
    
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern=r'^[a-zA-Z0-9_-]+$',
        description="Username (3-50 chars, alphanumeric + _ -)",
        examples=["johndoe"]
    )
    
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (8+ chars, upper, lower, digit, special)",
        examples=["SecurePass123!"]
    )
    
    full_name: Optional[str] = Field(
        None,
        max_length=100,
        description="Full name (optional)",
        examples=["John Doe"]
    )
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password complexity"""
        return validate_password_complexity(v)
    
    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username is not reserved"""
        reserved = ["admin", "root", "system", "null", "undefined"]
        if v.lower() in reserved:
            raise ValueError(f"Username '{v}' is reserved")
        return v


# =========================================
# Login (API_CONTRACTS.md - 2.2)
# =========================================

class UserLogin(BaseModel):
    """
    User login schema
    
    Validation:
    - email: Valid email format
    - password: Required (validation done server-side)
    """
    email: EmailStr = Field(
        ...,
        description="Email address",
        examples=["user@example.com"]
    )
    
    password: str = Field(
        ...,
        min_length=1,
        description="Password",
        examples=["SecurePass123!"]
    )


# =========================================
# Token Refresh (API_CONTRACTS.md - 2.3)
# =========================================

class TokenRefresh(BaseModel):
    """Refresh token request"""
    refresh_token: str = Field(
        ...,
        description="Refresh token from login response"
    )


# =========================================
# User Response (API_CONTRACTS.md - 2.1, 2.2, 2.5)
# =========================================

class UserResponse(BaseModel):
    """
    User response schema
    
    Security: NEVER include hashed_password
    """
    id: str = Field(..., description="User ID (UUID)")
    email: str = Field(..., description="Email address")
    username: str = Field(..., description="Username")
    full_name: Optional[str] = Field(None, description="Full name")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")
    created_at: str = Field(..., description="Account creation timestamp (ISO 8601)")
    updated_at: str = Field(..., description="Last update timestamp (ISO 8601)")
    
    class Config:
        from_attributes = True  # Pydantic v2 (was orm_mode in v1)


# =========================================
# Token Response (API_CONTRACTS.md - 2.1, 2.2, 2.3)
# =========================================

class TokenResponse(BaseModel):
    """
    JWT token response
    
    Returned on:
    - Successful registration (2.1)
    - Successful login (2.2)
    - Token refresh (2.3)
    """
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type (always 'bearer')")
    expires_in: int = Field(..., description="Access token expiration (seconds)")


# =========================================
# Register Response (API_CONTRACTS.md - 2.1)
# =========================================

class RegisterResponse(BaseModel):
    """
    Registration response
    
    Combines user data and tokens
    """
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


# =========================================
# Login Response (API_CONTRACTS.md - 2.2)
# =========================================

class LoginResponse(BaseModel):
    """
    Login response
    
    Combines user data and tokens
    """
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

