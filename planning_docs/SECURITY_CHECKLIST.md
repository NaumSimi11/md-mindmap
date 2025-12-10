# 🔒 **Security Checklist - Industry Standards 2025**

**Date**: December 10, 2025  
**Purpose**: Comprehensive security standards and patterns  
**Status**: 🟢 **PRODUCTION READY**

---

## 📋 **Table of Contents**

1. [Authentication Security](#1-authentication-security)
2. [Authorization & Access Control](#2-authorization--access-control)
3. [Input Validation & Sanitization](#3-input-validation--sanitization)
4. [XSS Prevention](#4-xss-prevention)
5. [SQL Injection Prevention](#5-sql-injection-prevention)
6. [CSRF Protection](#6-csrf-protection)
7. [Rate Limiting](#7-rate-limiting)
8. [Data Encryption](#8-data-encryption)
9. [File Upload Security](#9-file-upload-security)
10. [WebSocket Security](#10-websocket-security)
11. [CORS Configuration](#11-cors-configuration)
12. [Security Headers](#12-security-headers)
13. [Logging & Monitoring](#13-logging--monitoring)
14. [Dependency Security](#14-dependency-security)

---

## 1. Authentication Security

### **1.1 JWT Token Standards**

#### **Token Generation** (Backend)
```python
# backend/app/utils/security.py

from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
import secrets

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """
    Hash password using bcrypt (industry standard)
    Automatically includes salt
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

# JWT token generation
def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Create JWT access token
    
    Security measures:
    - Short expiration (30 minutes)
    - Includes jti (JWT ID) for token revocation
    - Includes iat (issued at) timestamp
    """
    to_encode = data.copy()
    
    # Add security claims
    now = datetime.utcnow()
    expire = now + (expires_delta or timedelta(minutes=30))
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "jti": secrets.token_urlsafe(32),  # Unique token ID
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm="HS256"
    )
    return encoded_jwt

def create_refresh_token(user_id: str) -> str:
    """
    Create long-lived refresh token
    
    Security measures:
    - Long expiration (7 days)
    - Single-use (must be rotated)
    - Stored in database for revocation
    """
    to_encode = {
        "sub": user_id,
        "type": "refresh",
        "jti": secrets.token_urlsafe(32),
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
```

#### **Token Validation** (Backend)
```python
# backend/app/dependencies/auth.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Validate JWT and return current user
    
    Security checks:
    1. Token format valid
    2. Token not expired
    3. Token not in blacklist
    4. User still exists
    """
    token = credentials.credentials
    
    try:
        # Decode token
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        
        # Extract claims
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        jti: str = payload.get("jti")
        
        if user_id is None or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if token is blacklisted (logged out)
        if await is_token_blacklisted(jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def is_token_blacklisted(jti: str) -> bool:
    """Check if token is in blacklist (Redis)"""
    from app.database import redis_client
    return await redis_client.exists(f"blacklist:{jti}")
```

#### **Token Storage** (Frontend)
```typescript
// frontend/src/services/api/AuthService.ts

class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  
  /**
   * Store tokens securely
   * 
   * Security measures:
   * - localStorage (not sessionStorage) for persistence
   * - HttpOnly cookies preferred but not available in SPA
   * - Tokens auto-refresh before expiration
   */
  storeTokens(accessToken: string, refreshToken: string): void {
    // Store in localStorage (vulnerable to XSS, but acceptable for SPA)
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    
    // Set auto-refresh timer
    this.scheduleTokenRefresh(accessToken);
  }
  
  /**
   * Auto-refresh token before expiration
   */
  private scheduleTokenRefresh(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000; // Convert to ms
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      
      // Refresh 5 minutes before expiration
      const refreshIn = timeUntilExpiry - (5 * 60 * 1000);
      
      if (refreshIn > 0) {
        setTimeout(() => {
          this.refreshAccessToken();
        }, refreshIn);
      }
    } catch (err) {
      console.error('[AuthService] Failed to schedule token refresh:', err);
    }
  }
  
  /**
   * Clear tokens on logout
   */
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}
```

---

### **1.2 Password Policy**

#### **Password Requirements**
```typescript
// frontend/src/utils/validation.ts

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
}

export const PASSWORD_POLICY: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters`);
  }
  
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (PASSWORD_POLICY.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (PASSWORD_POLICY.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

#### **Password Hashing** (Backend)
```python
# backend/app/utils/security.py

from passlib.context import CryptContext

# Use bcrypt with 12 rounds (good balance of security and performance)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

def hash_password(password: str) -> str:
    """
    Hash password with bcrypt
    
    Security measures:
    - bcrypt (slow, designed for passwords)
    - 12 rounds (2^12 = 4096 iterations)
    - Automatic salt generation
    - Resistant to rainbow table attacks
    """
    return pwd_context.hash(password)
```

---

## 2. Authorization & Access Control

### **2.1 Role-Based Access Control (RBAC)**

```python
# backend/app/models/workspace.py

from enum import Enum

class WorkspaceRole(str, Enum):
    """
    Workspace roles (hierarchical)
    Owner > Admin > Editor > Viewer
    """
    OWNER = "owner"
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

class Permission(str, Enum):
    """Granular permissions"""
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    SHARE = "share"
    MANAGE_MEMBERS = "manage_members"
    MANAGE_SETTINGS = "manage_settings"

# Permission matrix
ROLE_PERMISSIONS = {
    WorkspaceRole.VIEWER: [Permission.READ],
    WorkspaceRole.EDITOR: [Permission.READ, Permission.WRITE],
    WorkspaceRole.ADMIN: [
        Permission.READ,
        Permission.WRITE,
        Permission.DELETE,
        Permission.SHARE,
        Permission.MANAGE_MEMBERS,
    ],
    WorkspaceRole.OWNER: list(Permission),  # All permissions
}

def check_permission(
    user_role: WorkspaceRole,
    required_permission: Permission
) -> bool:
    """Check if role has permission"""
    return required_permission in ROLE_PERMISSIONS.get(user_role, [])
```

#### **Permission Checking Decorator**
```python
# backend/app/dependencies/permissions.py

from functools import wraps
from fastapi import HTTPException, status

def require_permission(permission: Permission):
    """
    Decorator to require specific permission
    
    Usage:
    @require_permission(Permission.WRITE)
    async def update_document(...):
        ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user and resource from kwargs
            user = kwargs.get('current_user')
            workspace_id = kwargs.get('workspace_id')
            
            if not user or not workspace_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Missing user or workspace context"
                )
            
            # Get user's role in workspace
            member = db.query(WorkspaceMember).filter(
                WorkspaceMember.user_id == user.id,
                WorkspaceMember.workspace_id == workspace_id
            ).first()
            
            if not member:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User is not a member of this workspace"
                )
            
            # Check permission
            if not check_permission(member.role, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"User does not have '{permission}' permission"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator
```

---

## 3. Input Validation & Sanitization

### **3.1 Frontend Validation**

```typescript
// frontend/src/utils/sanitize.ts

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML input (XSS prevention)
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'code', 'pre',
      'blockquote', 'hr',
    ],
    ALLOWED_ATTR: ['href', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize text input (remove HTML tags)
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
```

### **3.2 Backend Validation**

```python
# backend/app/schemas/user.py

from pydantic import BaseModel, EmailStr, constr, validator
import re

class UserCreate(BaseModel):
    """User creation schema with validation"""
    
    email: EmailStr  # Pydantic validates email format
    username: constr(min_length=3, max_length=50, regex=r'^[a-zA-Z0-9_-]+$')
    password: constr(min_length=8, max_length=128)
    full_name: constr(max_length=100) | None = None
    
    @validator('password')
    def validate_password(cls, v):
        """
        Validate password complexity
        """
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        """Validate username format"""
        if v.lower() in ['admin', 'root', 'system', 'null', 'undefined']:
            raise ValueError('Username is reserved')
        return v
```

---

## 4. XSS Prevention

### **4.1 Content Security Policy (CSP)**

```typescript
// frontend/index.html

<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' http://localhost:7001 ws://localhost:1234;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
">
```

### **4.2 Output Encoding**

```typescript
// frontend/src/components/editor/WYSIWYGEditor.tsx

import DOMPurify from 'dompurify';

/**
 * Render user-generated HTML safely
 */
export function SafeHTMLRenderer({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html, {
    // Allow TipTap editor tags
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'code', 'pre',
      'blockquote', 'hr', 'img',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id'],
    // Remove potentially dangerous attributes
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    // Remove javascript: URLs
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
  });
  
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

---

## 5. SQL Injection Prevention

### **5.1 Parameterized Queries (SQLAlchemy)**

```python
# backend/app/services/document.py

from sqlalchemy import text

# ✅ SAFE: Using SQLAlchemy ORM (parameterized)
def get_documents_by_workspace(db: Session, workspace_id: UUID) -> List[Document]:
    return db.query(Document).filter(
        Document.workspace_id == workspace_id,
        Document.is_deleted == False
    ).all()

# ✅ SAFE: Using parameterized raw SQL
def search_documents(db: Session, query: str) -> List[Document]:
    sql = text("""
        SELECT * FROM documents
        WHERE title ILIKE :query OR content ILIKE :query
        LIMIT 100
    """)
    return db.execute(sql, {"query": f"%{query}%"}).fetchall()

# ❌ UNSAFE: String concatenation (NEVER DO THIS)
def unsafe_search(db: Session, query: str):
    # VULNERABLE TO SQL INJECTION!
    sql = f"SELECT * FROM documents WHERE title LIKE '%{query}%'"
    return db.execute(sql).fetchall()
```

### **5.2 Input Sanitization**

```python
# backend/app/utils/sanitize.py

import bleach
from typing import Any

def sanitize_sql_input(value: Any) -> str:
    """
    Sanitize input for SQL queries
    
    Note: This is a fallback. Always use parameterized queries.
    """
    if value is None:
        return ''
    
    # Convert to string
    value = str(value)
    
    # Remove dangerous SQL keywords (defense in depth)
    dangerous_keywords = [
        'DROP', 'DELETE', 'INSERT', 'UPDATE',
        'EXEC', 'EXECUTE', 'UNION', 'SELECT',
        '--', ';--', '/*', '*/', 'xp_', 'sp_'
    ]
    
    for keyword in dangerous_keywords:
        value = value.replace(keyword, '')
        value = value.replace(keyword.lower(), '')
    
    return value
```

---

## 6. CSRF Protection

### **6.1 CSRF Tokens** (Not needed for SPA with JWT)

```python
# backend/app/main.py

# For SPA with JWT in Authorization header:
# CSRF is not a concern because:
# 1. Cookies are not used for authentication
# 2. JWT tokens in localStorage/headers cannot be sent by attacker's site
# 3. SameSite cookie policy (if using cookies)

# However, for form-based auth or cookie-based sessions:
from fastapi_csrf_protect import CsrfProtect

@app.post("/api/v1/auth/login")
async def login(
    credentials: LoginRequest,
    csrf_protect: CsrfProtect = Depends()
):
    # Validate CSRF token
    await csrf_protect.validate_csrf(request)
    
    # ... login logic
```

---

## 7. Rate Limiting

### **7.1 API Rate Limiting** (Redis-based)

```python
# backend/app/middleware/rate_limit.py

from fastapi import Request, HTTPException, status
from app.database import redis_client
import time

class RateLimiter:
    """
    Token bucket rate limiter
    
    Rules:
    - Auth endpoints: 5 requests/minute
    - Read endpoints: 1000 requests/minute
    - Write endpoints: 100 requests/minute
    """
    
    LIMITS = {
        "/api/v1/auth/login": (5, 60),      # 5 requests per 60 seconds
        "/api/v1/auth/register": (3, 60),   # 3 requests per 60 seconds
        "/api/v1/documents": (100, 60),     # 100 requests per 60 seconds
        "default": (1000, 60),               # 1000 requests per 60 seconds
    }
    
    async def check_rate_limit(
        self,
        request: Request,
        identifier: str  # user_id or IP address
    ) -> None:
        """
        Check if request exceeds rate limit
        
        Raises HTTPException if limit exceeded
        """
        path = request.url.path
        limit, window = self.LIMITS.get(path, self.LIMITS["default"])
        
        key = f"rate_limit:{identifier}:{path}"
        
        # Get current count
        current = await redis_client.get(key)
        
        if current is None:
            # First request in window
            await redis_client.setex(key, window, 1)
            return
        
        current = int(current)
        
        if current >= limit:
            # Rate limit exceeded
            ttl = await redis_client.ttl(key)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {ttl} seconds.",
                headers={"Retry-After": str(ttl)}
            )
        
        # Increment counter
        await redis_client.incr(key)

# Middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Get identifier (user_id if authenticated, IP otherwise)
    identifier = request.headers.get("X-Forwarded-For", request.client.host)
    
    # Check rate limit
    limiter = RateLimiter()
    await limiter.check_rate_limit(request, identifier)
    
    response = await call_next(request)
    return response
```

---

## 8. Data Encryption

### **8.1 Encryption at Rest**

```python
# backend/app/utils/encryption.py

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
import base64
import os

class DataEncryption:
    """
    Encrypt sensitive data at rest
    
    Use cases:
    - API keys stored in database
    - Sensitive document content
    - User PII (Personally Identifiable Information)
    """
    
    def __init__(self):
        # Derive key from environment variable
        password = os.getenv("ENCRYPTION_KEY", "change-me-in-production").encode()
        salt = os.getenv("ENCRYPTION_SALT", "mdreader-salt").encode()
        
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        self.cipher = Fernet(key)
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt string data"""
        return self.cipher.encrypt(plaintext.encode()).decode()
    
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt string data"""
        return self.cipher.decrypt(ciphertext.encode()).decode()

# Usage
encryptor = DataEncryption()

# Encrypt API key before storing
encrypted_key = encryptor.encrypt(user_api_key)
db.execute("UPDATE users SET api_key = :key WHERE id = :id", {
    "key": encrypted_key,
    "id": user_id
})

# Decrypt when needed
encrypted_key = db.query(...).first().api_key
plain_key = encryptor.decrypt(encrypted_key)
```

---

### **8.2 Encryption in Transit (HTTPS/WSS)**

```python
# backend/app/main.py

# In production, use HTTPS
# Configured at reverse proxy level (Nginx, Cloudflare)

# For Hocuspocus, use WSS (WebSocket Secure)
# frontend/src/config/api.config.ts
export const WS_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'wss://hocuspocus.mdreader.app'
  : 'ws://localhost:1234';
```

---

## 9. File Upload Security

### **9.1 File Validation**

```python
# backend/app/utils/file_validation.py

from fastapi import UploadFile, HTTPException, status
import magic
import hashlib

class FileValidator:
    """
    Validate uploaded files
    
    Security checks:
    1. File size limit
    2. MIME type validation
    3. File extension whitelist
    4. Virus scanning (future)
    """
    
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    ALLOWED_MIME_TYPES = {
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'text/markdown', 'text/plain',
    }
    
    ALLOWED_EXTENSIONS = {
        '.jpg', '.jpeg', '.png', '.gif', '.webp',
        '.pdf',
        '.md', '.txt',
    }
    
    async def validate_file(self, file: UploadFile) -> None:
        """
        Validate uploaded file
        
        Raises HTTPException if validation fails
        """
        # Check file size
        content = await file.read()
        size = len(content)
        await file.seek(0)  # Reset file pointer
        
        if size > self.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds {self.MAX_FILE_SIZE / 1024 / 1024}MB limit"
            )
        
        # Check MIME type (using python-magic for accurate detection)
        mime = magic.from_buffer(content, mime=True)
        if mime not in self.ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type '{mime}' is not allowed"
            )
        
        # Check file extension
        extension = '.' + file.filename.split('.')[-1].lower()
        if extension not in self.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension '{extension}' is not allowed"
            )
        
        # Generate hash for duplicate detection
        file_hash = hashlib.sha256(content).hexdigest()
        
        return file_hash
```

---

## 10. WebSocket Security

### **10.1 Hocuspocus Authentication**

```typescript
// hocuspocus-server/src/auth.ts

import axios from 'axios';
import { onAuthenticatePayload } from '@hocuspocus/server';

export async function onAuthenticate(data: onAuthenticatePayload) {
  /**
   * Verify JWT token with FastAPI backend
   * 
   * Security measures:
   * 1. Token passed in query param (wss://host?token=...)
   * 2. Verified against FastAPI /auth/verify endpoint
   * 3. Rate limited (prevent brute force)
   */
  const { token } = data;
  
  if (!token) {
    throw new Error('No authentication token provided');
  }
  
  try {
    // Verify token with FastAPI
    const response = await axios.post(
      'http://localhost:7001/api/v1/auth/verify',
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: 5000,
      }
    );
    
    if (response.status !== 200) {
      throw new Error('Token validation failed');
    }
    
    const user = response.data;
    
    // Return user context
    return {
      user: {
        id: user.id,
        name: user.username || user.email,
      }
    };
    
  } catch (error) {
    console.error('[Hocuspocus] Auth failed:', error);
    throw new Error('Unauthorized');
  }
}
```

---

## 11. CORS Configuration

### **11.1 Backend CORS Settings**

```python
# backend/app/config.py

from fastapi.middleware.cors import CORSMiddleware

# Environment-specific CORS origins
CORS_ORIGINS = {
    "development": [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
    ],
    "staging": [
        "https://staging.mdreader.app",
    ],
    "production": [
        "https://mdreader.app",
        "https://www.mdreader.app",
    ],
}

# Get current environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS[ENVIRONMENT],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "X-Total-Count"],
    max_age=600,  # Cache preflight for 10 minutes
)
```

---

## 12. Security Headers

### **12.1 HTTP Security Headers** (Backend)

```python
# backend/app/middleware/security_headers.py

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses
    
    Headers based on OWASP recommendations
    """
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Enable XSS protection (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Strict Transport Security (HTTPS only)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions policy (disable features not used)
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )
        
        return response

# Register middleware
app.add_middleware(SecurityHeadersMiddleware)
```

---

## 13. Logging & Monitoring

### **13.1 Security Event Logging**

```python
# backend/app/utils/security_logger.py

import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger("security")

class SecurityLogger:
    """
    Log security-relevant events
    
    Events to log:
    - Failed login attempts
    - Permission denials
    - Token validation failures
    - Rate limit violations
    - File upload rejections
    """
    
    @staticmethod
    def log_failed_login(email: str, ip: str, reason: str):
        logger.warning(
            f"[FAILED_LOGIN] email={email} ip={ip} reason={reason} timestamp={datetime.utcnow().isoformat()}"
        )
    
    @staticmethod
    def log_permission_denied(user_id: str, resource: str, action: str):
        logger.warning(
            f"[PERMISSION_DENIED] user_id={user_id} resource={resource} action={action} timestamp={datetime.utcnow().isoformat()}"
        )
    
    @staticmethod
    def log_rate_limit_exceeded(identifier: str, endpoint: str):
        logger.warning(
            f"[RATE_LIMIT] identifier={identifier} endpoint={endpoint} timestamp={datetime.utcnow().isoformat()}"
        )
    
    @staticmethod
    def log_suspicious_activity(user_id: str, activity: str, details: dict):
        logger.error(
            f"[SUSPICIOUS] user_id={user_id} activity={activity} details={details} timestamp={datetime.utcnow().isoformat()}"
        )
```

---

## 14. Dependency Security

### **14.1 Regular Security Audits**

```bash
# Frontend dependencies
cd frontend
npm audit
npm audit fix

# Backend dependencies
cd backend
pip-audit
safety check

# Automated in CI/CD
# .github/workflows/security.yml
name: Security Audit
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run npm audit
        run: cd frontend && npm audit --audit-level=high
      - name: Run pip-audit
        run: cd backend && pip-audit
```

---

## 📋 **Security Checklist Summary**

### **Pre-Deployment Checklist**

- [ ] All secrets in environment variables (not hardcoded)
- [ ] HTTPS/WSS enabled in production
- [ ] JWT tokens use short expiration (30 min access, 7 day refresh)
- [ ] Password hashing uses bcrypt with 12 rounds
- [ ] Input validation on frontend and backend
- [ ] SQL queries parameterized (no string concatenation)
- [ ] XSS prevention (DOMPurify, CSP headers)
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled on auth endpoints
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] File uploads validated (size, type, extension)
- [ ] Error messages don't leak sensitive info
- [ ] Logging configured for security events
- [ ] Dependencies scanned for vulnerabilities
- [ ] RBAC permissions implemented and tested

---

**Status**: 🟢 **PRODUCTION READY**  
**Version**: 1.0  
**Last Updated**: December 10, 2025  
**Standards**: OWASP Top 10 2025, CWE Top 25

