"""
Create Test Users for MDReader Backend v2
==========================================

Creates test users with workspaces for development/testing.

Usage:
    python scripts/create_test_users.py
"""

import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.workspace import Workspace
from app.utils.security import hash_password

# Suppress SQLAlchemy logging when called from startup script
QUIET_MODE = os.environ.get('QUIET_MODE', 'false').lower() == 'true'


async def create_test_users():
    """Create test users with default workspaces"""
    
    async with AsyncSessionLocal() as session:
        try:
            # Test User 1: John Doe
            print("\n🔹 Creating Test User 1: John Doe")
            
            # Check if user exists
            from sqlalchemy import select
            result = await session.execute(
                select(User).where(User.email == "john@example.com")
            )
            existing_user1 = result.scalar_one_or_none()
            
            if existing_user1:
                print("   ⚠️  User already exists: john@example.com")
                user1 = existing_user1
            else:
                user1 = User(
                    email="john@example.com",
                    username="johndoe",
                    full_name="John Doe",
                    hashed_password=hash_password("John#123")
                )
                session.add(user1)
                await session.flush()  # Get user ID
                print(f"   ✅ Created user: {user1.email} (ID: {user1.id})")
            
            # Create default workspace for user1
            result = await session.execute(
                select(Workspace).where(
                    Workspace.owner_id == user1.id,
                    Workspace.slug == "personal"
                )
            )
            existing_workspace1 = result.scalar_one_or_none()
            
            if existing_workspace1:
                print("   ⚠️  Workspace already exists: Personal")
            else:
                workspace1 = Workspace(
                    name="Personal",
                    slug="personal",
                    owner_id=user1.id
                )
                session.add(workspace1)
                print(f"   ✅ Created workspace: {workspace1.name}")
            
            # Test User 2: Ljubisha
            print("\n🔹 Creating Test User 2: Ljubisha")
            
            result = await session.execute(
                select(User).where(User.email == "ljubo@example.com")
            )
            existing_user2 = result.scalar_one_or_none()
            
            if existing_user2:
                print("   ⚠️  User already exists: ljubo@example.com")
                user2 = existing_user2
            else:
                user2 = User(
                    email="ljubo@example.com",
                    username="ljubisha",
                    full_name="Ljubisha",
                    hashed_password=hash_password("Ljubisha#1")
                )
                session.add(user2)
                await session.flush()
                print(f"   ✅ Created user: {user2.email} (ID: {user2.id})")
            
            # Create default workspace for user2
            result = await session.execute(
                select(Workspace).where(
                    Workspace.owner_id == user2.id,
                    Workspace.slug == "main"
                )
            )
            existing_workspace2 = result.scalar_one_or_none()
            
            if existing_workspace2:
                print("   ⚠️  Workspace already exists: Main Workspace")
            else:
                workspace2 = Workspace(
                    name="Main Workspace",
                    slug="main",
                    owner_id=user2.id
                )
                session.add(workspace2)
                print(f"   ✅ Created workspace: {workspace2.name}")
            
            # Commit all changes
            await session.commit()
            
            if not QUIET_MODE:
                print("\n✅ Test users created successfully!")
                print("\nLogin Credentials:")
                print("─" * 50)
                print("User 1:")
                print("  Email: john@example.com")
                print("  Password: John#123")
                print("\nUser 2:")
                print("  Email: ljubo@example.com")
                print("  Password: Ljubisha#1")
                print("─" * 50)
            
        except Exception as e:
            await session.rollback()
            # Don't fail if users already exist - just exit silently
            if not QUIET_MODE and "already exists" not in str(e).lower():
                print(f"\n❌ Error creating test users: {e}")
            # Exit successfully even if users exist (for idempotent startup script)
            pass
        finally:
            await session.close()


if __name__ == "__main__":
    if not QUIET_MODE:
        print("=" * 50)
        print("🚀 MDReader Backend v2 - Create Test Users")
        print("=" * 50)
    
    asyncio.run(create_test_users())

