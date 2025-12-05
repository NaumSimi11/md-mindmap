#!/usr/bin/env python3
"""Test Document Functionality"""

import sys
sys.path.insert(0, '/Users/naum/Desktop/mdreader/mdreader-main/backend')

from app.database import SessionLocal
from app.schemas.user import UserCreate
from app.schemas.workspace import WorkspaceCreate
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.services.auth import AuthService
from app.services.workspace import WorkspaceService
from app.services.document import DocumentService

print('🧪 Testing Document System')
print('=' * 60)

db = SessionLocal()

try:
    # Cleanup
    from app.models.user import User
    db.query(User).filter(User.email.like('%@doc-test.com')).delete(synchronize_session=False)
    db.commit()
    
    # Test 1: Create user
    print('\n1️⃣  Creating test user...')
    user = AuthService.create_user(db, UserCreate(
        email='user@doc-test.com',
        username='docuser',
        password='Test123456',
        full_name='Doc User'
    ))
    print(f'   ✅ User created: {user.id}')
    
    # Test 2: Create workspace
    print('\n2️⃣  Creating workspace...')
    workspace = WorkspaceService.create_workspace(db, WorkspaceCreate(
        name='Doc Workspace',
        description='For testing'
    ), user.id)
    print(f'   ✅ Workspace: {workspace.id}')
    
    # Test 3: Create document
    print('\n3️⃣  Creating document...')
    doc = DocumentService.create_document(db, workspace.id, DocumentCreate(
        title='Test Document',
        content='# Hello World\n\nThis is a test document.',
        tags=['test', 'markdown']
    ), user.id)
    print(f'   ✅ Document created: {doc.id}')
    print(f'      Version: {doc.version}')
    print(f'      Word count: {doc.word_count}')
    
    # Test 4: Update document
    print('\n4️⃣  Updating document content...')
    updated = DocumentService.update_document(db, doc.id, DocumentUpdate(
        content='# Hello World\n\nUpdated content here!',
        change_summary='Added more content'
    ), user.id)
    print(f'   ✅ Updated to version: {updated.version}')
    
    # Test 5: Get versions
    print('\n5️⃣  Checking version history...')
    versions = DocumentService.get_document_versions(db, doc.id, user.id)
    print(f'   ✅ Found {len(versions)} versions')
    for v in versions:
        print(f'      - v{v.version_number}: "{v.change_summary}"')
    
    # Test 6: Restore version
    print('\n6️⃣  Restoring to version 1...')
    restored = DocumentService.restore_version(db, doc.id, 1, user.id)
    print(f'   ✅ Restored, now at version: {restored.version}')
    
    # Test 7: List documents
    print('\n7️⃣  Listing workspace documents...')
    docs, total = DocumentService.get_workspace_documents(db, workspace.id, user.id)
    print(f'   ✅ Found {total} document(s)')
    
    # Test 8: Search
    print('\n8️⃣  Searching documents...')
    results, total = DocumentService.search_documents(db, user.id, query='Test')
    print(f'   ✅ Search found {total} document(s)')
    
    # Test 9: Delete document
    print('\n9️⃣  Soft deleting document...')
    deleted = DocumentService.delete_document(db, doc.id, user.id)
    print(f'   ✅ Deleted: {deleted}')
    
    print('\n' + '=' * 60)
    print('✅ ALL DOCUMENT TESTS PASSED!')
    print('=' * 60)
    
except Exception as e:
    print(f'\n❌ Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    db.close()

sys.exit(0)

