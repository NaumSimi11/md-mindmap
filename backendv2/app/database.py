"""
Database Connection Management
===============================

Patterns Applied:
- Async SQLAlchemy (Modern, FastAPI best practice)
- Connection Pooling (PATTERNS_ADOPTION.md)
- Dependency Injection (for session management)

Benefits:
- Optimal connection reuse
- Automatic cleanup
- Type-safe queries
- Transaction management
"""

from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool, QueuePool

from app.config import settings


# =========================================
# Base Model (all models inherit from this)
# =========================================
Base = declarative_base()


# =========================================
# Async Engine (Singleton Pattern)
# =========================================

# Connection pooling configuration (PATTERNS_ADOPTION.md)
# - pool_size: Number of permanent connections
# - max_overflow: Additional connections when pool exhausted
# - pool_timeout: Wait time for available connection
# - pool_recycle: Recycle connections after N seconds (prevent stale connections)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Log SQL queries in development
    future=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=settings.DB_POOL_RECYCLE,
    # Use NullPool for testing, QueuePool for production
    poolclass=NullPool if settings.ENVIRONMENT == "test" else QueuePool,
)


# =========================================
# Async Session Factory (Singleton Pattern)
# =========================================
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Prevent DetachedInstanceError
    autocommit=False,
    autoflush=False,
)


# =========================================
# Dependency: Get DB Session (FastAPI Dependency Injection)
# =========================================

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency to get database session
    
    Pattern: Dependency Injection (PATTERNS_ADOPTION.md)
    
    Usage:
        @router.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(User))
            return result.scalars().all()
    
    Benefits:
    - Automatic session creation
    - Automatic cleanup (even on error)
    - Transaction management
    - Easy testing (can override in tests)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()  # Commit if no errors
        except Exception:
            await session.rollback()  # Rollback on error
            raise
        finally:
            await session.close()  # Always close


# =========================================
# Database Health Check
# =========================================

async def check_db_connection() -> bool:
    """
    Check if database is reachable
    
    Used by:
    - Lifespan startup (warmup)
    - Health check endpoint
    - K8s readiness probe
    """
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False


# =========================================
# Lifespan Integration
# =========================================

async def init_db():
    """
    Initialize database on app startup
    
    Pattern: Lifespan Context Manager (PATTERNS_ADOPTION.md)
    
    Called by main.py lifespan function
    """
    # Check connection
    if not await check_db_connection():
        raise RuntimeError("Database connection failed on startup")
    
    print("✅ Database connection established")
    print(f"   Pool size: {settings.DB_POOL_SIZE}")
    print(f"   Max overflow: {settings.DB_MAX_OVERFLOW}")


async def close_db():
    """
    Close database connections on app shutdown
    
    Pattern: Lifespan Context Manager (PATTERNS_ADOPTION.md)
    
    Ensures:
    - No connection leaks
    - Graceful shutdown
    - K8s-friendly SIGTERM handling
    """
    await engine.dispose()
    print("✅ Database connections closed")

