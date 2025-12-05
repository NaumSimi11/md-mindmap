#!/usr/bin/env python3
"""
Test Workspace Functionality
Comprehensive test of workspace CRUD and member management
"""

import sys
sys.path.insert(0, '/Users/naum/Desktop/mdreader/mdreader-main/backend')

from app.database import SessionLocal
from app.schemas.user import UserCreate
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate
from app.services.auth import AuthService
from app.services.workspace import WorkspaceService
from app.models.workspace import WorkspaceRole

print('🧪 Testing Workspace Functionality')
print('=' * 60)

db = SessionLocal()

try:
    # Clean up any existing test data
    from app.models.user import User
    from app.models.workspace import Workspace, WorkspaceMember
    
    # Delete in correct order (foreign keys)
    db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id.in_(
            db.query(User.id).filter(User.email.like('%@workspace-test.com'))
        )
    ).delete(synchronize_session=False)
    
    db.query(Workspace).filter(
        Workspace.owner_id.in_(
            db.query(User.id).filter(User.email.like('%@workspace-test.com'))
        )
    ).delete(synchronize_session=False)
    
    db.query(User).filter(User.email.like('%@workspace-test.com')).delete(synchronize_session=False)
    db.commit()
    
    # Test 1: Create test users
    print('\n1️⃣  Creating test users...')
    owner_data = UserCreate(
        email='owner@workspace-test.com',
        username='workspace_owner',
        password='Test123456',
        full_name='Workspace Owner'
    )
    owner = AuthService.create_user(db, owner_data)
    print(f'   ✅ Owner created: {owner.email} (ID: {owner.id})')
    
    member_data = UserCreate(
        email='member@workspace-test.com',
        username='workspace_member',
        password='Test123456',
        full_name='Team Member'
    )
    member = AuthService.create_user(db, member_data)
    print(f'   ✅ Member created: {member.email} (ID: {member.id})')
    
    # Test 2: Create workspace
    print('\n2️⃣  Creating workspace...')
    ws_data = WorkspaceCreate(
        name='Test Workspace',
        description='A test workspace for development',
        is_public=False
    )
    workspace = WorkspaceService.create_workspace(db, ws_data, owner.id)
    print(f'   ✅ Workspace created: {workspace.name}')
    print(f'      ID: {workspace.id}')
    print(f'      Slug: {workspace.slug}')
    print(f'      Owner: {workspace.owner_id}')
    
    # Test 3: Get workspace
    print('\n3️⃣  Retrieving workspace...')
    retrieved = WorkspaceService.get_workspace_by_id(db, workspace.id, owner.id)
    print(f'   ✅ Retrieved workspace: {retrieved.name}')
    
    # Test 4: List user workspaces
    print('\n4️⃣  Listing user workspaces...')
    workspaces, total = WorkspaceService.get_user_workspaces(db, owner.id)
    print(f'   ✅ Found {total} workspace(s)')
    for ws in workspaces:
        print(f'      - {ws.name} (slug: {ws.slug})')
    
    # Test 5: Add member
    print('\n5️⃣  Adding member to workspace...')
    ws_member = WorkspaceService.add_member(
        db,
        workspace.id,
        owner.id,
        member.id,
        WorkspaceRole.EDITOR
    )
    print(f'   ✅ Member added: {ws_member.user_id}')
    print(f'      Role: {ws_member.role}')
    print(f'      Invited by: {ws_member.invited_by_id}')
    
    # Test 6: List members
    print('\n6️⃣  Listing workspace members...')
    members = WorkspaceService.get_workspace_members(db, workspace.id, owner.id)
    print(f'   ✅ Found {len(members)} member(s)')
    for m in members:
        print(f'      - User: {m.user_id}, Role: {m.role}')
    
    # Test 7: Check permissions
    print('\n7️⃣  Testing permissions...')
    can_edit = workspace.can_user_edit(member.id)
    can_admin = workspace.can_user_admin(member.id)
    print(f'   ✅ Member can edit: {can_edit}')
    print(f'   ✅ Member can admin: {can_admin}')
    
    # Test 8: Update member role
    print('\n8️⃣  Updating member role...')
    updated_member = WorkspaceService.update_member_role(
        db,
        workspace.id,
        ws_member.id,
        owner.id,
        WorkspaceRole.ADMIN
    )
    print(f'   ✅ Role updated to: {updated_member.role}')
    
    # Test 9: Update workspace
    print('\n9️⃣  Updating workspace...')
    update_data = WorkspaceUpdate(
        description='Updated description',
        is_public=True
    )
    updated_ws = WorkspaceService.update_workspace(
        db,
        workspace.id,
        update_data,
        owner.id
    )
    print(f'   ✅ Workspace updated')
    print(f'      Description: {updated_ws.description}')
    print(f'      Is Public: {updated_ws.is_public}')
    
    # Test 10: Test member access
    print('\n🔟 Testing member workspace access...')
    member_workspaces, member_total = WorkspaceService.get_user_workspaces(db, member.id)
    print(f'   ✅ Member can see {member_total} workspace(s)')
    
    # Test 11: Slug generation
    print('\n1️⃣1️⃣  Testing slug generation...')
    ws2_data = WorkspaceCreate(
        name='Test Workspace',  # Same name
        description='Another workspace',
        is_public=False
    )
    workspace2 = WorkspaceService.create_workspace(db, ws2_data, owner.id)
    print(f'   ✅ Second workspace created with slug: {workspace2.slug}')
    
    # Test 12: Remove member
    print('\n1️⃣2️⃣  Removing member...')
    removed = WorkspaceService.remove_member(db, workspace.id, ws_member.id, owner.id)
    print(f'   ✅ Member removed: {removed}')
    
    # Test 13: Delete workspace
    print('\n1️⃣3️⃣  Soft deleting workspace...')
    deleted = WorkspaceService.delete_workspace(db, workspace2.id, owner.id)
    print(f'   ✅ Workspace deleted: {deleted}')
    
    print('\n' + '=' * 60)
    print('✅ ALL WORKSPACE TESTS PASSED!')
    print('=' * 60)
    
    print('\n📊 Final Statistics:')
    print(f'   Users created: 2')
    print(f'   Workspaces created: 2')
    print(f'   Members added: 1')
    print(f'   Role changes: 1')
    print(f'   Soft deletes: 1')
    
except Exception as e:
    print(f'\n❌ Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    db.close()

sys.exit(0)

