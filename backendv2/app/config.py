"""
Configuration Management
========================

Pattern: Pydantic Settings (v2)
Benefits:
- Type-safe configuration
- Environment variable parsing
- Validation on startup
- IDE autocomplete

Security:
- Secrets loaded from environment
- No hardcoded credentials
- Validation for required fields
"""

from typing import List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    
    Follows SECURITY_CHECKLIST.md standards:
    - No hardcoded secrets
    - Validation on all critical fields
    - Type safety
    """
    
    # =========================================
    # Application
    # =========================================
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=True)
    APP_NAME: str = Field(default="MDReader API v2")
    APP_VERSION: str = Field(default="2.0.0")
    API_V1_PREFIX: str = Field(default="/api/v1")
    
    # =========================================
    # Server
    # =========================================
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=7001)
    
    # =========================================
    # Database
    # =========================================
    DATABASE_URL: str = Field(
        ...,  # Required
        description="Async PostgreSQL connection string"
    )
    DATABASE_URL_SYNC: str = Field(
        ...,  # Required
        description="Sync PostgreSQL connection string for Alembic"
    )
    
    # Connection pool settings (Pattern: Connection Pooling)
    DB_POOL_SIZE: int = Field(default=20)
    DB_MAX_OVERFLOW: int = Field(default=10)
    DB_POOL_TIMEOUT: int = Field(default=30)
    DB_POOL_RECYCLE: int = Field(default=3600)  # 1 hour
    
    # =========================================
    # Redis (Phase 1 - Read-Through Cache Pattern)
    # =========================================
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    REDIS_PASSWORD: str = Field(default="")
    REDIS_SSL: bool = Field(default=False)
    REDIS_CACHE_TTL: int = Field(default=3600)  # 1 hour
    
    # =========================================
    # JWT Authentication (SECURITY_CHECKLIST.md)
    # =========================================
    SECRET_KEY: str = Field(
        ...,  # Required
        min_length=32,
        description="Secret key for JWT signing (use openssl rand -hex 32)"
    )
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    
    # =========================================
    # CORS (Security)
    # =========================================
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:5174"]
    )
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from JSON string if needed"""
        if isinstance(v, str):
            return json.loads(v)
        return v
    
    # =========================================
    # Security (SECURITY_CHECKLIST.md - Password Policy)
    # =========================================
    BCRYPT_ROUNDS: int = Field(default=12, ge=10, le=14)
    PASSWORD_MIN_LENGTH: int = Field(default=8)
    
    # =========================================
    # Rate Limiting (Pattern: Circuit Breaker)
    # =========================================
    RATE_LIMIT_ENABLED: bool = Field(default=True)
    RATE_LIMIT_PER_MINUTE: int = Field(default=60)
    
    # =========================================
    # File Upload (SECURITY_CHECKLIST.md)
    # =========================================
    MAX_UPLOAD_SIZE_MB: int = Field(default=10)
    ALLOWED_UPLOAD_TYPES: List[str] = Field(
        default=[
            "image/jpeg",
            "image/png",
            "image/gif",
            "text/markdown",
            "text/plain"
        ]
    )
    
    @field_validator("ALLOWED_UPLOAD_TYPES", mode="before")
    @classmethod
    def parse_upload_types(cls, v):
        """Parse ALLOWED_UPLOAD_TYPES from JSON string if needed"""
        if isinstance(v, str):
            return json.loads(v)
        return v
    
    # =========================================
    # Hocuspocus (Phase 1 - Collaboration)
    # =========================================
    HOCUSPOCUS_URL: str = Field(default="ws://localhost:1234")
    HOCUSPOCUS_SECRET: str = Field(default="")
    
    # =========================================
    # Observability (Optional)
    # =========================================
    SENTRY_DSN: str = Field(default="")
    PROMETHEUS_ENABLED: bool = Field(default=False)
    
    # =========================================
    # Logging
    # =========================================
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FORMAT: str = Field(default="json")
    
    # =========================================
    # Pydantic v2 Configuration
    # =========================================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # Ignore extra env vars
    )
    
    # =========================================
    # Computed Properties
    # =========================================
    
    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.ENVIRONMENT.lower() == "development"
    
    @property
    def max_upload_size_bytes(self) -> int:
        """Get max upload size in bytes"""
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


# =========================================
# Global Settings Instance (Singleton Pattern)
# =========================================
settings = Settings()

# Validate critical settings on startup
if settings.is_production:
    if settings.DEBUG:
        raise ValueError("DEBUG must be False in production")
    
    if settings.SECRET_KEY == "your-secret-key-here-change-in-production-use-openssl-rand-hex-32":
        raise ValueError("SECRET_KEY must be changed in production")
    
    if len(settings.SECRET_KEY) < 32:
        raise ValueError("SECRET_KEY must be at least 32 characters in production")

