#!/usr/bin/env python3
"""Test Presence & Real-time Collaboration"""

import sys
sys.path.insert(0, '/Users/naum/Desktop/mdreader/mdreader-main/backend')

from app.database import SessionLocal
from app.schemas.user import UserCreate
from app.schemas.workspace import WorkspaceCreate
from app.schemas.document import DocumentCreate
from app.services.auth import AuthService
from app.services.workspace import WorkspaceService
from app.services.document import DocumentService
from app.services.presence import PresenceService

print('🧪 Testing Presence & Real-time System')
print('=' * 60)

db = SessionLocal()

try:
    # Cleanup
    from app.models.user import User
    db.query(User).filter(User.email.like('%@presence-test.com')).delete(synchronize_session=False)
    db.commit()
    
    # Test 1: Create users
    print('\n1️⃣  Creating test users...')
    user1 = AuthService.create_user(db, UserCreate(
        email='user1@presence-test.com',
        username='presenceuser1',
        password='Test123456',
        full_name='User 1'
    ))
    user2 = AuthService.create_user(db, UserCreate(
        email='user2@presence-test.com',
        username='presenceuser2',
        password='Test123456',
        full_name='User 2'
    ))
    print(f'   ✅ Users created: {user1.id}, {user2.id}')
    
    # Test 2: Create workspace & document
    print('\n2️⃣  Creating workspace & document...')
    workspace = WorkspaceService.create_workspace(db, WorkspaceCreate(
        name='Presence Workspace',
        description='For testing'
    ), user1.id)
    
    document = DocumentService.create_document(db, workspace.id, DocumentCreate(
        title='Collaboration Doc',
        content='# Real-time Document'
    ), user1.id)
    print(f'   ✅ Document: {document.id}')
    
    # Test 3: Create sessions
    print('\n3️⃣  Creating user sessions...')
    session1 = PresenceService.create_session(db, user1.id, "conn-1", device_type="web")
    session2 = PresenceService.create_session(db, user2.id, "conn-2", device_type="desktop")
    print(f'   ✅ Sessions created: {session1.id}, {session2.id}')
    
    # Test 4: Join document
    print('\n4️⃣  Users joining document...')
    presence1 = PresenceService.join_document(db, document.id, user1.id, session1.id)
    presence2 = PresenceService.join_document(db, document.id, user2.id, session2.id)
    print(f'   ✅ Presences created: {presence1.id}, {presence2.id}')
    
    # Test 5: Update cursor
    print('\n5️⃣  Updating cursor positions...')
    PresenceService.update_cursor(db, document.id, user1.id, line=10, column=5)
    PresenceService.update_cursor(db, document.id, user2.id, line=15, column=8)
    print(f'   ✅ Cursors updated')
    
    # Test 6: Update selection
    print('\n6️⃣  Updating selections...')
    PresenceService.update_selection(
        db, document.id, user1.id,
        start_line=10, start_column=5,
        end_line=12, end_column=10
    )
    print(f'   ✅ Selection updated')
    
    # Test 7: Set editing status
    print('\n7️⃣  Setting editing status...')
    PresenceService.set_editing_status(db, document.id, user1.id, True)
    print(f'   ✅ User 1 is now editing')
    
    # Test 8: Get document presence
    print('\n8️⃣  Getting document presence...')
    presence_list = PresenceService.get_document_presence(db, document.id)
    print(f'   ✅ Found {len(presence_list)} active user(s):')
    for p in presence_list:
        print(f'      - User: {p.user_id}, Editing: {p.is_editing}')
    
    # Test 9: Leave document
    print('\n9️⃣  User 2 leaving document...')
    PresenceService.leave_document(db, document.id, user2.id)
    remaining = PresenceService.get_document_presence(db, document.id)
    print(f'   ✅ Remaining users: {len(remaining)}')
    
    # Test 10: Cleanup stale sessions
    print('\n🔟 Testing stale session cleanup...')
    cleaned = PresenceService.cleanup_stale_sessions(db, stale_minutes=0)
    print(f'   ✅ Cleaned {cleaned} stale session(s)')
    
    print('\n' + '=' * 60)
    print('✅ ALL PRESENCE TESTS PASSED!')
    print('=' * 60)
    
except Exception as e:
    print(f'\n❌ Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    db.close()

sys.exit(0)

