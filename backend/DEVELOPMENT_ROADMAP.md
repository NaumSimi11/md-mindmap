# Backend Development Roadmap - Step by Step

**100% Local Development - What to Build & When**

---

## 🎯 Overview

This guide takes you from zero to a working backend in **18 days**, building feature by feature.

**Timeline**: ~3 weeks (working 6-8 hours/day)

---

## 📅 Phase 0: Setup (Day 1 - TODAY)

**Goal**: Get your local development environment running

### ✅ Checklist
- [ ] Install Python 3.12+
- [ ] Install Docker Desktop
- [ ] Create project structure
- [ ] Setup virtual environment
- [ ] Install dependencies
- [ ] Start Docker services (PostgreSQL + Redis)
- [ ] Create .env file
- [ ] Test database connection
- [ ] Test Redis connection

**Time**: 2 hours

**Guide**: See `LOCAL_SETUP_GUIDE.md`

**Verification**:
```bash
# All should work:
docker-compose ps          # All "Up" and "healthy"
python scripts/test_db.py  # ✅ PostgreSQL connection successful!
python scripts/test_redis.py # ✅ Redis connection successful!
```

---

## 📅 Phase 1: Foundation (Days 2-4)

### Day 2: FastAPI Application & Database Setup

#### Step 1: Create Main Application (1 hour)

**File**: `app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

# Create FastAPI app
app = FastAPI(
    title="MD Creator API",
    description="Backend API for MD Creator",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "MD Creator API", "status": "running"}

@app.get("/healthz")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Test it**:
```bash
python -m app.main
# Visit: http://localhost:8000/docs
```

#### Step 2: Create Configuration (30 min)

**File**: `app/config.py`

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # App
    ENV: str = "development"
    DEBUG: bool = True
    API_VERSION: str = "v1"
    SECRET_KEY: str
    
    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50
    
    # Authentication
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

#### Step 3: Setup Database Connection (30 min)

**File**: `app/database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,  # Verify connections before using
    echo=settings.DEBUG  # Log SQL queries in debug mode
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency for routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### Step 4: Setup Alembic (Database Migrations) (1 hour)

```bash
# Initialize Alembic
alembic init alembic

# Edit alembic.ini - set database URL
# Comment out: sqlalchemy.url = ...

# Edit alembic/env.py
```

**File**: `alembic/env.py` (replace contents):

```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Import your models and config
from app.config import settings
from app.database import Base
from app.models import *  # Import all models

# Alembic Config
config = context.config

# Override sqlalchemy.url with our DATABASE_URL
config.set_main_option('sqlalchemy.url', settings.DATABASE_URL)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate
target_metadata = Base.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

**Test Alembic**:
```bash
alembic current
# Should show: (no current revision)
```

---

### Day 3: User Model & Authentication (Part 1)

#### Step 1: Create User Model (1 hour)

**File**: `app/models/user.py`

```python
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    email_verified = Column(Boolean, default=False)
    
    # Profile
    display_name = Column(String(255))
    avatar_url = Column(String(500))
    bio = Column(String(1000))
    
    # Settings
    settings = Column(JSON, default={})
    
    # Subscription
    subscription_tier = Column(String(50), default='free')
    subscription_status = Column(String(50), default='active')
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_seen_at = Column(DateTime, default=datetime.utcnow)
    
    # Soft delete
    deleted_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<User {self.email}>"
```

**File**: `app/models/__init__.py`

```python
from app.models.user import User

__all__ = ["User"]
```

#### Step 2: Create First Migration (30 min)

```bash
# Generate migration
alembic revision --autogenerate -m "Create users table"

# Review the migration file in alembic/versions/

# Apply migration
alembic upgrade head

# Verify
docker exec -it mdcreator-postgres psql -U mdcreator -d mdcreator_dev -c "\dt"
# Should show "users" table
```

#### Step 3: Create User Schemas (Pydantic) (1 hour)

**File**: `app/schemas/user.py`

```python
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
import uuid

# Base schema
class UserBase(BaseModel):
    email: EmailStr
    display_name: Optional[str] = None

# Schema for creating user
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

# Schema for updating user
class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    settings: Optional[dict] = None

# Schema for response (what API returns)
class UserResponse(UserBase):
    id: uuid.UUID
    email_verified: bool
    avatar_url: Optional[str] = None
    subscription_tier: str
    created_at: datetime
    last_seen_at: datetime
    
    class Config:
        from_attributes = True  # Allows SQLAlchemy model → Pydantic model

# Schema for login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Schema for token response
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
```

**File**: `app/schemas/__init__.py`

```python
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin,
    Token
)

__all__ = [
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "Token"
]
```

#### Step 4: Create Authentication Utilities (2 hours)

**File**: `app/utils/security.py`

```python
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None
```

---

### Day 4: Authentication API (Complete Auth System)

#### Step 1: Create Auth Service (2 hours)

**File**: `app/services/auth_service.py`

```python
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token
from datetime import timedelta

class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    def signup(self, user_data: UserCreate) -> User:
        """Register new user"""
        # Check if user exists
        existing_user = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        # Create user
        user = User(
            email=user_data.email,
            display_name=user_data.display_name or user_data.email.split('@')[0],
            password_hash=hash_password(user_data.password)
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def login(self, login_data: UserLogin) -> dict:
        """Authenticate user and return tokens"""
        # Find user
        user = self.db.query(User).filter(User.email == login_data.email).first()
        
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Create tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user
        }
    
    def get_user_by_email(self, email: str) -> User:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_id(self, user_id: str) -> User:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
```

#### Step 2: Create Auth Dependencies (1 hour)

**File**: `app/dependencies/auth.py`

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.security import decode_token
from typing import Optional

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    
    # Decode token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user ID from token
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Optional authentication (allows guest access)"""
    if not credentials:
        return None
    
    return await get_current_user(credentials, db)
```

#### Step 3: Create Auth Router (2 hours)

**File**: `app/routers/auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse
from app.services.auth_service import AuthService
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register new user account"""
    auth_service = AuthService(db)
    user = auth_service.signup(user_data)
    return user

@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Authenticate user and receive JWT tokens"""
    auth_service = AuthService(db)
    result = auth_service.login(login_data)
    return result

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user info"""
    return current_user

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """Logout user (client should delete tokens)"""
    return {"message": "Logged out successfully"}
```

#### Step 4: Register Router in Main App (15 min)

**File**: `app/main.py` (add this):

```python
from app.routers import auth

# ... existing code ...

# Register routers
app.include_router(auth.router)

# ... rest of code ...
```

#### Step 5: Test Authentication (30 min)

Start server:
```bash
uvicorn app.main:app --reload
```

Visit: http://localhost:8000/docs

Test endpoints:
1. **POST /api/auth/signup** - Create account
2. **POST /api/auth/login** - Get tokens
3. **GET /api/auth/me** - Get user info (use access_token)

---

## 🎯 End of Phase 1 Checkpoint

**You now have**:
- ✅ FastAPI application running
- ✅ PostgreSQL database connected
- ✅ User model and migrations
- ✅ Complete authentication system
- ✅ JWT tokens working
- ✅ API documentation at /docs

**Test it**:
```bash
# Signup
curl -X POST "http://localhost:8000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","display_name":"Test User"}'

# Login
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

**Next**: Phase 2 (Days 5-8) - Core API (Workspaces & Documents)

Would you like me to continue with Phase 2?

