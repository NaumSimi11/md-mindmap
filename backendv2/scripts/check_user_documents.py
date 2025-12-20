"""
Check User Documents Script
===========================
Checks documents in PostgreSQL vs local IndexedDB for a user.

Usage:
    python scripts/check_user_documents.py liusernesto12@gmail.com
"""

import asyncio
import sys
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Add parent directory to path
sys.path.insert(0, '.')

from app.database import AsyncSessionLocal, engine
from app.models.user import User
from app.models.workspace import Workspace
from app.models.document import Document


async def check_user_documents(email: str):
    """
    Check documents for a user in PostgreSQL
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
            
            print(f"✅ User found: {user.email} (ID: {user.id})")
            print(f"   Username: {user.username}")
            print()
            
            # Get all workspaces for this user
            workspaces_result = await session.execute(
                select(Workspace).where(Workspace.owner_id == str(user.id))
            )
            workspaces = workspaces_result.scalars().all()
            
            print(f"📁 PostgreSQL Workspaces: {len(workspaces)}")
            workspace_ids = []
            for ws in workspaces:
                workspace_ids.append(str(ws.id))
                print(f"   - {ws.name} (ID: {ws.id})")
            
            print()
            
            # Get all documents in these workspaces
            total_docs = 0
            document_details = []
            for ws in workspaces:
                docs_result = await session.execute(
                    select(Document).where(
                        Document.workspace_id == str(ws.id),
                        Document.is_deleted == False
                    )
                )
                docs = docs_result.scalars().all()
                total_docs += len(docs)
                if len(docs) > 0:
                    print(f"   📄 {ws.name}: {len(docs)} documents")
                    for doc in docs:
                        document_details.append({
                            'id': str(doc.id),
                            'title': doc.title,
                            'workspace_id': str(doc.workspace_id),
                            'workspace_name': ws.name,
                            'folder_id': str(doc.folder_id) if doc.folder_id else None,
                            'created_at': doc.created_at.isoformat(),
                            'updated_at': doc.updated_at.isoformat(),
                        })
                        print(f"      - {doc.title} (ID: {doc.id})")
            
            print()
            print(f"📊 PostgreSQL Summary:")
            print(f"   - Workspaces: {len(workspaces)}")
            print(f"   - Total Documents: {total_docs}")
            print()
            print("=" * 60)
            print("LOCAL INDEXEDDB CHECK")
            print("=" * 60)
            print()
            print("⚠️  To check local IndexedDB, open browser DevTools:")
            print("   1. Open Chrome DevTools (F12)")
            print("   2. Go to Application tab")
            print("   3. Expand 'IndexedDB'")
            print("   4. Check these databases:")
            print("      - MDReaderBackendCache (authenticated user cache)")
            print("      - MDReaderGuest (guest/local documents)")
            print()
            print("Or use this JavaScript in browser console:")
            print()
            print("""
// Check Backend Cache (authenticated user)
(async () => {
  const db = await new Dexie('MDReaderBackendCache').open();
  const docs = await db.documents.toArray();
  console.log('📦 Backend Cache Documents:', docs.length);
  docs.forEach(d => console.log(`   - ${d.title} (${d.id}) [${d.syncStatus}]`));
  db.close();
})();

// Check Guest Cache (local-only)
(async () => {
  const db = await new Dexie('MDReaderGuest').open();
  const docs = await db.documents.toArray();
  console.log('📦 Guest Cache Documents:', docs.length);
  docs.forEach(d => console.log(`   - ${d.title} (${d.id}) [${d.syncStatus}]`));
  db.close();
})();
            """)
            print()
            print("=" * 60)
            print("DOCUMENT DETAILS (PostgreSQL)")
            print("=" * 60)
            for doc in document_details:
                print(f"📄 {doc['title']}")
                print(f"   ID: {doc['id']}")
                print(f"   Workspace: {doc['workspace_name']} ({doc['workspace_id']})")
                if doc['folder_id']:
                    print(f"   Folder ID: {doc['folder_id']}")
                else:
                    print(f"   Folder: Root")
                print(f"   Created: {doc['created_at']}")
                print(f"   Updated: {doc['updated_at']}")
                print()
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await session.close()


async def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/check_user_documents.py <email>")
        sys.exit(1)
    
    email = sys.argv[1]
    print(f"🔍 Checking documents for user: {email}\n")
    print("=" * 60)
    print("POSTGRESQL DATABASE")
    print("=" * 60)
    print()
    
    await check_user_documents(email)
    
    # Close engine
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())




