"""
Cleanup User Data Script
=========================
Deletes all workspaces, folders, and documents for a specific user.

Usage:
    python scripts/cleanup_user_data.py liusernesto12@gmail.com
"""

import asyncio
import sys
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

# Add parent directory to path
sys.path.insert(0, '.')

from app.database import AsyncSessionLocal, engine
from app.models.user import User
from app.models.workspace import Workspace
from app.models.folder import Folder
from app.models.document import Document


async def cleanup_user_data(email: str):
    """
    Delete all data for a user by email
    
    Order of deletion (respects foreign keys):
    1. Documents (referenced by folders/workspaces)
    2. Folders (referenced by workspaces)
    3. Workspaces (referenced by user)
    """
    async with AsyncSessionLocal() as session:
        try:
            # Find user by email
            result = await session.execute(
                select(User).where(User.email == email)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                print(f"❌ User not found: {email}")
                return
            
            print(f"✅ Found user: {user.username} ({user.email})")
            print(f"   User ID: {user.id}")
            
            # Get all workspaces owned by user
            workspaces_result = await session.execute(
                select(Workspace).where(Workspace.owner_id == user.id)
            )
            workspaces = workspaces_result.scalars().all()
            workspace_ids = [w.id for w in workspaces]
            
            print(f"📦 Found {len(workspaces)} workspace(s)")
            
            if not workspace_ids:
                print("✅ No workspaces to delete")
                return
            
            # 1. Delete all documents in these workspaces
            documents_result = await session.execute(
                select(Document).where(Document.workspace_id.in_(workspace_ids))
            )
            documents = documents_result.scalars().all()
            document_ids = [d.id for d in documents]
            
            if document_ids:
                await session.execute(
                    delete(Document).where(Document.id.in_(document_ids))
                )
                print(f"🗑️  Deleted {len(document_ids)} document(s)")
            else:
                print("   No documents to delete")
            
            # 2. Delete all folders in these workspaces
            folders_result = await session.execute(
                select(Folder).where(Folder.workspace_id.in_(workspace_ids))
            )
            folders = folders_result.scalars().all()
            folder_ids = [f.id for f in folders]
            
            if folder_ids:
                await session.execute(
                    delete(Folder).where(Folder.id.in_(folder_ids))
                )
                print(f"🗑️  Deleted {len(folder_ids)} folder(s)")
            else:
                print("   No folders to delete")
            
            # 3. Delete all workspaces
            await session.execute(
                delete(Workspace).where(Workspace.owner_id == user.id)
            )
            print(f"🗑️  Deleted {len(workspaces)} workspace(s)")
            
            # Commit transaction
            await session.commit()
            
            print(f"\n✅ Successfully cleaned up all data for {email}")
            print(f"   - {len(document_ids)} documents deleted")
            print(f"   - {len(folder_ids)} folders deleted")
            print(f"   - {len(workspaces)} workspaces deleted")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
            raise


async def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/cleanup_user_data.py <email>")
        sys.exit(1)
    
    email = sys.argv[1]
    print(f"🧹 Cleaning up data for user: {email}\n")
    
    await cleanup_user_data(email)
    
    # Close engine
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

