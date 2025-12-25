"""
Fix Missing Workspace Members
==============================

Adds workspace owner as a member for workspaces that don't have the owner in workspace_members table.
This fixes workspaces created before the auto-add feature was implemented.

Usage:
    python scripts/fix_workspace_members.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember, WorkspaceRole
import uuid


async def fix_missing_workspace_members():
    async with AsyncSessionLocal() as session:
        print("=" * 60)
        print("🔧 Fix Missing Workspace Members")
        print("=" * 60)

        # Fetch all active workspaces
        result = await session.execute(
            select(Workspace).where(Workspace.is_deleted == False)
        )
        workspaces = result.scalars().all()
        print(f"🔍 Found {len(workspaces)} workspaces")

        fixed_count = 0
        for workspace in workspaces:
            # Check if owner is already a member
            member_result = await session.execute(
                select(WorkspaceMember).where(
                    WorkspaceMember.workspace_id == workspace.id,
                    WorkspaceMember.user_id == workspace.owner_id,
                    WorkspaceMember.role == WorkspaceRole.OWNER,
                    WorkspaceMember.status == "active"
                )
            )
            existing_member = member_result.scalars().first()

            if not existing_member:
                print(f"  🔧 Fixing workspace: {workspace.name} (ID: {workspace.id})")
                owner_member = WorkspaceMember(
                    id=uuid.uuid4(),
                    workspace_id=workspace.id,
                    user_id=workspace.owner_id,
                    role=WorkspaceRole.OWNER,
                    status="active"
                )
                session.add(owner_member)
                fixed_count += 1
        
        if fixed_count > 0:
            await session.commit()
            print(f"\n✅ Fixed {fixed_count} workspaces")
        else:
            print("\nℹ️ No missing workspace members found.")

        print("\nDone!")


if __name__ == "__main__":
    asyncio.run(fix_missing_workspace_members())

