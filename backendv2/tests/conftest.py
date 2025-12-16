"""
Pytest Configuration and Shared Fixtures
==========================================

Provides shared test fixtures for all tests.

Fixtures:
- test_db: Test database session
- client: FastAPI test client
- test_user: Authenticated test user
- auth_headers: Authorization headers
- test_workspace: Test workspace
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator, Dict
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from httpx import AsyncClient
import os

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.utils.security import hash_password, create_access_token


# =========================================
# Test Database Configuration
# =========================================

# Use separate test database
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://mdreader:mdreader@localhost:5432/mdreader_test"
)

# Create test engine (no connection pooling for tests)
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=NullPool,
    echo=False  # Set to True for SQL debugging
)

# Create test session factory
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


# =========================================
# Event Loop Fixture (for async tests)
# =========================================

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """
    Create event loop for async tests
    
    Scope: session (one loop for all tests)
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# =========================================
# Database Fixtures
# =========================================

@pytest.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Create test database session
    
    Flow:
    1. Drop all tables (clean slate)
    2. Create all tables
    3. Yield session
    4. Rollback transaction
    5. Drop all tables
    
    Scope: function (fresh DB for each test)
    """
    # Drop tables first (clean slate)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()
    
    # Drop tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Create FastAPI test client with test database
    
    Overrides get_db dependency to use test database.
    
    Scope: function (fresh client for each test)
    """
    # Override database dependency
    async def override_get_db():
        yield test_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Create client
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    # Clean up
    app.dependency_overrides.clear()


# =========================================
# User Fixtures
# =========================================

@pytest.fixture(scope="function")
async def test_user(test_db: AsyncSession) -> User:
    """
    Create test user
    
    Returns:
        User object (not authenticated)
    
    Scope: function (fresh user for each test)
    """
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=hash_password("TestPass123!"),
        full_name="Test User",
        is_active=True,
        is_deleted=False
    )
    
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    
    return user


@pytest.fixture(scope="function")
async def test_user_2(test_db: AsyncSession) -> User:
    """
    Create second test user (for permission tests)
    
    Returns:
        User object (not authenticated)
    
    Scope: function (fresh user for each test)
    """
    user = User(
        email="test2@example.com",
        username="testuser2",
        hashed_password=hash_password("TestPass123!"),
        full_name="Test User 2",
        is_active=True,
        is_deleted=False
    )
    
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    
    return user


@pytest.fixture(scope="function")
def auth_token(test_user: User) -> str:
    """
    Create JWT access token for test user
    
    Returns:
        JWT access token string
    
    Scope: function
    """
    return create_access_token({"sub": str(test_user.id)})


@pytest.fixture(scope="function")
def auth_headers(auth_token: str) -> Dict[str, str]:
    """
    Create authorization headers for test user
    
    Returns:
        Dict with Authorization header
    
    Scope: function
    """
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="function")
def auth_token_2(test_user_2: User) -> str:
    """
    Create JWT access token for second test user
    
    Returns:
        JWT access token string
    
    Scope: function
    """
    return create_access_token({"sub": str(test_user_2.id)})


@pytest.fixture(scope="function")
def auth_headers_2(auth_token_2: str) -> Dict[str, str]:
    """
    Create authorization headers for second test user
    
    Returns:
        Dict with Authorization header
    
    Scope: function
    """
    return {"Authorization": f"Bearer {auth_token_2}"}


# =========================================
# Workspace Fixtures
# =========================================

@pytest.fixture(scope="function")
async def test_workspace(test_db: AsyncSession, test_user: User) -> Workspace:
    """
    Create test workspace
    
    Returns:
        Workspace object owned by test_user
    
    Scope: function (fresh workspace for each test)
    """
    workspace = Workspace(
        name="Test Workspace",
        slug="test-workspace",
        description="A test workspace",
        icon="📁",
        is_public=False,
        owner_id=test_user.id,
        is_deleted=False,
        version=1
    )
    
    test_db.add(workspace)
    await test_db.commit()
    await test_db.refresh(workspace)
    
    return workspace


@pytest.fixture(scope="function")
async def test_workspace_2(test_db: AsyncSession, test_user: User) -> Workspace:
    """
    Create second test workspace (for list/pagination tests)
    
    Returns:
        Workspace object owned by test_user
    
    Scope: function
    """
    workspace = Workspace(
        name="Test Workspace 2",
        slug="test-workspace-2",
        description="Second test workspace",
        icon="🚀",
        is_public=False,
        owner_id=test_user.id,
        is_deleted=False,
        version=1
    )
    
    test_db.add(workspace)
    await test_db.commit()
    await test_db.refresh(workspace)
    
    return workspace


@pytest.fixture(scope="function")
async def public_workspace(test_db: AsyncSession, test_user_2: User) -> Workspace:
    """
    Create public workspace (owned by test_user_2)
    
    Returns:
        Public workspace object
    
    Scope: function
    """
    workspace = Workspace(
        name="Public Workspace",
        slug="public-workspace",
        description="A public workspace",
        icon="🌍",
        is_public=True,
        owner_id=test_user_2.id,
        is_deleted=False,
        version=1
    )
    
    test_db.add(workspace)
    await test_db.commit()
    await test_db.refresh(workspace)
    
    return workspace


# =========================================
# Document Fixtures
# =========================================

@pytest.fixture(scope="function")
async def test_document(test_db: AsyncSession, test_workspace: Workspace, test_user: User):
    """Create test document"""
    from app.models.document import Document, StorageMode
    
    document = Document(
        title="Test Document",
        slug="test-document",
        content="# Test\n\nThis is a test document.",
        content_type="markdown",
        workspace_id=test_workspace.id,
        folder_id=None,
        tags=["work", "test"],
        is_public=False,
        is_template=False,
        is_starred=False,
        storage_mode=StorageMode.HYBRID_SYNC,
        version=1,
        yjs_version=0,
        word_count=6,
        created_by_id=test_user.id,
        is_deleted=False
    )
    
    test_db.add(document)
    await test_db.commit()
    await test_db.refresh(document)
    return document


@pytest.fixture(scope="function")
async def test_document_2(test_db: AsyncSession, test_workspace: Workspace, test_user_2: User):
    """Create second test document (owned by test_user_2)"""
    from app.models.document import Document, StorageMode
    
    document = Document(
        title="Test Document 2",
        slug="test-document-2",
        content="# Another Test",
        content_type="markdown",
        workspace_id=test_workspace.id,
        folder_id=None,
        tags=["personal"],
        is_public=False,
        is_template=False,
        is_starred=False,
        storage_mode=StorageMode.HYBRID_SYNC,
        version=1,
        yjs_version=0,
        word_count=3,
        created_by_id=test_user_2.id,
        is_deleted=False
    )
    
    test_db.add(document)
    await test_db.commit()
    await test_db.refresh(document)
    return document


@pytest.fixture(scope="function")
async def test_document_3(test_db: AsyncSession, test_workspace: Workspace, test_user: User):
    """Create third test document"""
    from app.models.document import Document, StorageMode
    
    document = Document(
        title="Another Document",
        slug="another-document",
        content="More content here",
        content_type="markdown",
        workspace_id=test_workspace.id,
        folder_id=None,
        tags=["work"],
        is_public=False,
        is_template=False,
        is_starred=False,
        storage_mode=StorageMode.HYBRID_SYNC,
        version=1,
        yjs_version=0,
        word_count=3,
        created_by_id=test_user.id,
        is_deleted=False
    )
    
    test_db.add(document)
    await test_db.commit()
    await test_db.refresh(document)
    return document


@pytest.fixture(scope="function")
async def public_document(test_db: AsyncSession, test_workspace: Workspace, test_user_2: User):
    """Create public test document"""
    from app.models.document import Document, StorageMode
    
    document = Document(
        title="Public Document",
        slug="public-document",
        content="# Public Content",
        content_type="markdown",
        workspace_id=test_workspace.id,
        folder_id=None,
        tags=["public"],
        is_public=True,
        is_template=False,
        is_starred=False,
        storage_mode=StorageMode.HYBRID_SYNC,
        version=1,
        yjs_version=0,
        word_count=2,
        created_by_id=test_user_2.id,
        is_deleted=False
    )
    
    test_db.add(document)
    await test_db.commit()
    await test_db.refresh(document)
    return document


@pytest.fixture(scope="function")
async def starred_document(test_db: AsyncSession, test_workspace: Workspace, test_user: User):
    """Create starred test document"""
    from app.models.document import Document, StorageMode
    
    document = Document(
        title="Starred Document",
        slug="starred-document",
        content="# Important",
        content_type="markdown",
        workspace_id=test_workspace.id,
        folder_id=None,
        tags=["important"],
        is_public=False,
        is_template=False,
        is_starred=True,
        storage_mode=StorageMode.HYBRID_SYNC,
        version=1,
        yjs_version=0,
        word_count=1,
        created_by_id=test_user.id,
        is_deleted=False
    )
    
    test_db.add(document)
    await test_db.commit()
    await test_db.refresh(document)
    return document


# =========================================
# Helper Functions
# =========================================

# =========================================
# Folder Fixtures
# =========================================

@pytest.fixture(scope="function")
async def test_folder(test_db: AsyncSession, test_workspace: Workspace, test_user: User):
    """
    Create test folder
    
    Returns:
        Folder object in test_workspace owned by test_user
    
    Scope: function
    """
    from app.models.folder import Folder
    
    folder = Folder(
        workspace_id=test_workspace.id,
        name="Test Folder",
        icon="📁",
        color="#3b82f6",
        parent_id=None,
        position=0,
        created_by_id=test_user.id,
        is_deleted=False,
        version=1
    )
    
    test_db.add(folder)
    await test_db.commit()
    await test_db.refresh(folder)
    return folder


@pytest.fixture(scope="function")
async def test_folder_2(test_db: AsyncSession, test_workspace: Workspace, test_user: User):
    """
    Create second test folder
    
    Returns:
        Folder object in test_workspace owned by test_user
    
    Scope: function
    """
    from app.models.folder import Folder
    
    folder = Folder(
        workspace_id=test_workspace.id,
        name="Test Folder 2",
        icon="📂",
        color="#10b981",
        parent_id=None,
        position=1,
        created_by_id=test_user.id,
        is_deleted=False,
        version=1
    )
    
    test_db.add(folder)
    await test_db.commit()
    await test_db.refresh(folder)
    return folder


# =========================================
# Helper Fixtures
# =========================================

@pytest.fixture(scope="function")
def assert_valid_uuid():
    """
    Helper to assert valid UUID format
    
    Usage:
        assert_valid_uuid(response_data["id"])
    """
    import uuid
    
    def _assert(value: str):
        try:
            uuid.UUID(value)
            return True
        except (ValueError, AttributeError):
            pytest.fail(f"Invalid UUID: {value}")
    
    return _assert


@pytest.fixture(scope="function")
def assert_valid_timestamp():
    """
    Helper to assert valid ISO 8601 timestamp
    
    Usage:
        assert_valid_timestamp(response_data["created_at"])
    """
    from datetime import datetime
    
    def _assert(value: str):
        try:
            datetime.fromisoformat(value.replace('Z', '+00:00'))
            return True
        except (ValueError, AttributeError):
            pytest.fail(f"Invalid timestamp: {value}")
    
    return _assert
