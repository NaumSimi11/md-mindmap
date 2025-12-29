"""
Simulate Collaboration for Testing
===================================

This script helps test collaboration features without real email:
1. Creates test users (if not exist)
2. Simulates document sharing invites
3. Shows pending invitations that can be accepted

Usage:
    cd backendv2
    source venv/bin/activate
    python scripts/simulate_collaboration.py

Test Users:
    - john@example.com / John#123
    - ljubo@example.com / Ljubisha#1  
    - naum@example.com / Kozuvcanka#1
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta
from uuid import uuid4

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.workspace import Workspace
from app.models.document import Document
from app.models.invitation import Invitation
from app.models.document_share import DocumentShare
from app.utils.security import hash_password, create_access_token


async def ensure_test_users(session: AsyncSession) -> dict:
    """Create test users if they don't exist, return user dict"""
    users = {}
    
    test_users = [
        ("john@example.com", "johndoe", "John Doe", "John#123"),
        ("ljubo@example.com", "ljubisha", "Ljubisha", "Ljubisha#1"),
        ("naum@example.com", "naum", "Naum", "Kozuvcanka#1"),
    ]
    
    for email, username, full_name, password in test_users:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                email=email,
                username=username,
                full_name=full_name,
                hashed_password=hash_password(password)
            )
            session.add(user)
            await session.flush()
            print(f"✅ Created user: {email}")
        else:
            print(f"✓ User exists: {email}")
        
        users[email] = user
    
    await session.commit()
    return users


async def ensure_workspace_and_document(session: AsyncSession, user: User) -> tuple:
    """Ensure user has a workspace and test document"""
    
    # Get or create workspace
    result = await session.execute(
        select(Workspace).where(Workspace.owner_id == user.id)
    )
    workspace = result.scalar_one_or_none()
    
    if not workspace:
        workspace = Workspace(
            name=f"{user.full_name}'s Workspace",
            slug=f"{user.username}-workspace",
            owner_id=user.id
        )
        session.add(workspace)
        await session.flush()
        print(f"  ✅ Created workspace: {workspace.name}")
    
    # Get or create test document
    result = await session.execute(
        select(Document).where(
            Document.workspace_id == workspace.id,
            Document.title == "Collaboration Test Doc"
        )
    )
    doc = result.scalar_one_or_none()
    
    if not doc:
        doc = Document(
            title="Collaboration Test Doc",
            slug="collaboration-test-doc",
            workspace_id=workspace.id,
            created_by_id=user.id,
            content="# Collaboration Test\n\nThis document is for testing real-time collaboration.\n\n## Test It\n1. Open this document in two browser windows\n2. Log in as different users\n3. Type in one window - see changes in the other!"
        )
        session.add(doc)
        await session.flush()
        print(f"  ✅ Created document: {doc.title} (ID: {doc.id})")
    else:
        print(f"  ✓ Document exists: {doc.title}")
    
    await session.commit()
    return workspace, doc


async def create_document_share(
    session: AsyncSession,
    document: Document,
    owner: User,
    invitee: User,
    role: str = "editor"
) -> DocumentShare:
    """Create a document share (direct access, no invite needed)"""
    
    # Check if share already exists
    result = await session.execute(
        select(DocumentShare).where(
            DocumentShare.document_id == document.id,
            DocumentShare.principal_type == "user",
            DocumentShare.principal_id == invitee.id
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        print(f"  ✓ Share already exists: {invitee.email} has {existing.role} access")
        return existing
    
    share = DocumentShare(
        document_id=document.id,
        principal_type="user",
        principal_id=invitee.id,
        role=role,
        granted_by=owner.id,
        status="active"
    )
    session.add(share)
    await session.commit()
    
    print(f"  ✅ Created share: {invitee.email} → {document.title} ({role})")
    return share


async def show_collaboration_status(session: AsyncSession):
    """Show all documents and their collaborators"""
    
    print("\n" + "=" * 60)
    print("📄 DOCUMENT COLLABORATION STATUS")
    print("=" * 60)
    
    # Get all documents with shares
    result = await session.execute(
        select(Document, User, Workspace)
        .join(Workspace, Document.workspace_id == Workspace.id)
        .join(User, Workspace.owner_id == User.id)
        .order_by(Document.created_at.desc())
        .limit(10)
    )
    
    docs = result.all()
    
    for doc, owner, workspace in docs:
        print(f"\n📄 {doc.title}")
        print(f"   ID: {doc.id}")
        print(f"   Owner: {owner.email}")
        print(f"   Workspace: {workspace.name}")
        
        # Get shares
        shares_result = await session.execute(
            select(DocumentShare, User)
            .join(User, DocumentShare.principal_id == User.id)
            .where(
                DocumentShare.document_id == doc.id,
                DocumentShare.principal_type == "user"
            )
        )
        shares = shares_result.all()
        
        if shares:
            print("   Collaborators:")
            for share, user in shares:
                print(f"     - {user.email} ({share.role})")
        else:
            print("   Collaborators: None (only owner)")
    
    print("\n" + "=" * 60)


async def main():
    print("=" * 60)
    print("🚀 MDReader Collaboration Simulation")
    print("=" * 60)
    
    async with AsyncSessionLocal() as session:
        # 1. Ensure test users exist
        print("\n📋 Step 1: Ensuring test users exist...")
        users = await ensure_test_users(session)
        
        john = users["john@example.com"]
        ljubo = users["ljubo@example.com"]
        naum = users["naum@example.com"]
        
        # 2. Create workspace and document for John
        print("\n📋 Step 2: Ensuring John has a workspace and document...")
        workspace, doc = await ensure_workspace_and_document(session, john)
        
        # 3. Share the document with Ljubo and Naum
        print("\n📋 Step 3: Sharing document with other users...")
        await create_document_share(session, doc, john, ljubo, "editor")
        await create_document_share(session, doc, john, naum, "editor")
        
        # 4. Show status
        await show_collaboration_status(session)
        
        # 5. Print test instructions
        print("\n" + "=" * 60)
        print("🧪 HOW TO TEST COLLABORATION")
        print("=" * 60)
        print("""
1. Open TWO browser windows (or one regular + one incognito)

2. In Window 1:
   - Go to http://localhost:5173/login
   - Log in as: john@example.com / John#123
   - Navigate to "Collaboration Test Doc"

3. In Window 2:
   - Go to http://localhost:5173/login
   - Log in as: ljubo@example.com / Ljubisha#1
   - Navigate to "My Workspaces" → You should see shared docs
   - Open "Collaboration Test Doc"

4. Type in one window - see changes in the other!

5. Check Hocuspocus logs for connection info:
   tail -f /tmp/mdreader-hocuspocus.log
""")
        
        # 6. Generate direct links
        print("\n" + "=" * 60)
        print("🔗 DIRECT LINKS")
        print("=" * 60)
        print(f"\nDocument URL (after login):")
        print(f"  http://localhost:5173/workspace/doc/{doc.id}/edit")
        
        # Generate tokens for quick testing
        print("\n" + "=" * 60)
        print("🔑 LOGIN CREDENTIALS")
        print("=" * 60)
        print("""
User 1 (Owner):
  Email: john@example.com
  Password: John#123

User 2 (Collaborator):
  Email: ljubo@example.com
  Password: Ljubisha#1

User 3 (Collaborator):
  Email: naum@example.com
  Password: Kozuvcanka#1
""")


if __name__ == "__main__":
    asyncio.run(main())

