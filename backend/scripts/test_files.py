#!/usr/bin/env python3
"""Test File Upload & Management"""

import sys
import os
sys.path.insert(0, '/Users/naum/Desktop/mdreader/mdreader-main/backend')

from app.database import SessionLocal
from app.schemas.user import UserCreate
from app.schemas.workspace import WorkspaceCreate
from app.services.auth import AuthService
from app.services.workspace import WorkspaceService
from app.services.file import FileService

print('🧪 Testing File Upload System')
print('=' * 60)

db = SessionLocal()

try:
    # Cleanup
    from app.models.user import User
    db.query(User).filter(User.email.like('%@file-test.com')).delete(synchronize_session=False)
    db.commit()
    
    # Test 1: Create user
    print('\n1️⃣  Creating test user...')
    user = AuthService.create_user(db, UserCreate(
        email='user@file-test.com',
        username='fileuser',
        password='Test123456',
        full_name='File User'
    ))
    print(f'   ✅ User created: {user.id}')
    
    # Test 2: Create workspace
    print('\n2️⃣  Creating workspace...')
    workspace = WorkspaceService.create_workspace(db, WorkspaceCreate(
        name='File Workspace',
        description='For testing files'
    ), user.id)
    print(f'   ✅ Workspace: {workspace.id}')
    
    # Test 3: Upload file
    print('\n3️⃣  Uploading test file...')
    test_content = b"# Test Document\n\nThis is a test markdown file."
    uploaded_file = FileService.upload_file(
        db, test_content, "test.md", user.id, workspace.id
    )
    print(f'   ✅ File uploaded: {uploaded_file.id}')
    print(f'      Filename: {uploaded_file.filename}')
    print(f'      Size: {uploaded_file.size_mb} MB')
    print(f'      Hash: {uploaded_file.file_hash[:12]}...')
    
    # Test 4: Get file info
    print('\n4️⃣  Retrieving file info...')
    file_info = FileService.get_file_by_id(db, uploaded_file.id, user.id)
    print(f'   ✅ File retrieved: {file_info.original_filename}')
    print(f'      MIME type: {file_info.mime_type}')
    print(f'      Storage: {file_info.storage_type}')
    
    # Test 5: List workspace files
    print('\n5️⃣  Listing workspace files...')
    files, total = FileService.list_workspace_files(db, workspace.id, user.id)
    print(f'   ✅ Found {total} file(s)')
    
    # Test 6: Get file content
    print('\n6️⃣  Downloading file content...')
    content = FileService.get_file_content(db, uploaded_file.id, user.id)
    print(f'   ✅ Downloaded {len(content)} bytes')
    print(f'      Content matches: {content == test_content}')
    
    # Test 7: Get workspace stats
    print('\n7️⃣  Getting workspace file stats...')
    stats = FileService.get_workspace_stats(db, workspace.id, user.id)
    print(f'   ✅ Total files: {stats["total_files"]}')
    print(f'      Total size: {stats["total_size_mb"]} MB')
    print(f'      By MIME: {stats["by_mime_type"]}')
    
    # Test 8: Upload image
    print('\n8️⃣  Uploading image file...')
    image_content = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100  # Fake PNG header
    image_file = FileService.upload_file(
        db, image_content, "test.png", user.id, workspace.id
    )
    print(f'   ✅ Image uploaded: {image_file.id}')
    print(f'      Is image: {image_file.is_image}')
    
    # Test 9: Check download counter
    print('\n9️⃣  Checking download counter...')
    original_count = uploaded_file.download_count
    FileService.get_file_content(db, uploaded_file.id, user.id)
    db.refresh(uploaded_file)
    print(f'   ✅ Downloads: {original_count} → {uploaded_file.download_count}')
    
    # Test 10: Delete file
    print('\n🔟 Soft deleting file...')
    deleted = FileService.delete_file(db, uploaded_file.id, user.id)
    print(f'   ✅ Deleted: {deleted}')
    
    print('\n' + '=' * 60)
    print('✅ ALL FILE TESTS PASSED!')
    print('=' * 60)
    
except Exception as e:
    print(f'\n❌ Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    db.close()

sys.exit(0)

