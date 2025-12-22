"""
Test Snapshots Router & Service (CRITICAL - CRDT SAFETY)
========================================================

P0 Tests (MANDATORY):
- editor can restore as new_document
- overwrite: non-owner rejected
- overwrite: missing backup rejected
- overwrite: stale backup rejected
- overwrite: owner + valid backup accepted
- confirm no CRDT logic is executed server-side

CRDT Invariant: Server NEVER applies CRDT ops
Data loss prevention: Overwrite requires backup
Security boundary: Only owner can overwrite
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
import base64

from app.models.user import User
from app.models.document import Document
from app.models.document_share import DocumentShare
from app.models.document_snapshot import DocumentSnapshot


# =========================================
# P0: Editor Can Restore As New Document
# =========================================

@pytest.mark.asyncio
async def test_restore_as_new_document_editor_allowed(client: AsyncClient, test_db: AsyncSession, test_user: User, test_user_2: User, test_document, auth_headers_2):
    """
    P0 CRITICAL: Editor can restore snapshot as new document
    
    Invariant: new_document action allowed for editor+
    Protects: Data safety (original untouched)
    Catches: Editor blocked from safe restore
    """
    # Create owner share for test_user
    owner_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user.id,
        role='owner',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(owner_share)
    
    # Create editor share for test_user_2
    editor_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user_2.id,
        role='editor',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(editor_share)
    
    # Create snapshot
    fake_yjs_state = b'\x00\x01\x02\x03'  # Fake binary
    snapshot = DocumentSnapshot(
        document_id=test_document.id,
        created_by=test_user.id,
        type='manual',
        yjs_state=fake_yjs_state,
        size_bytes=len(fake_yjs_state)
    )
    test_db.add(snapshot)
    await test_db.commit()
    
    # Editor restores as new document → ALLOWED
    response = await client.post(
        f"/api/v1/documents/{test_document.id}/snapshots/{snapshot.id}/restore",
        headers=auth_headers_2,
        json={
            "action": "new_document",
            "title": "Restored Copy",
            "backup_snapshot_id": None,
            "force": False
        }
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["action"] == "new_document"
    assert "new_document_id" in data
    assert data["new_document_id"] != str(test_document.id)  # Different document


# =========================================
# P0: Overwrite - Non-Owner Rejected
# =========================================

@pytest.mark.asyncio
async def test_restore_overwrite_non_owner_rejected(client: AsyncClient, test_db: AsyncSession, test_user: User, test_user_2: User, test_document, auth_headers_2):
    """
    P0 CRITICAL: Non-owner cannot overwrite document
    
    Invariant: overwrite action owner-only
    Protects: Data loss (unauthorized overwrite)
    Catches: Editor/Admin overwriting document
    """
    # Create owner share for test_user
    owner_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user.id,
        role='owner',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(owner_share)
    
    # Create admin share for test_user_2 (not owner)
    admin_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user_2.id,
        role='admin',  # Admin, not owner
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(admin_share)
    
    # Create snapshot
    fake_yjs_state = b'\x00\x01\x02\x03'
    snapshot = DocumentSnapshot(
        document_id=test_document.id,
        created_by=test_user.id,
        type='manual',
        yjs_state=fake_yjs_state,
        size_bytes=len(fake_yjs_state)
    )
    test_db.add(snapshot)
    
    # Create backup snapshot
    backup_snapshot = DocumentSnapshot(
        document_id=test_document.id,
        created_by=test_user_2.id,
        type='restore-backup',
        yjs_state=fake_yjs_state,
        size_bytes=len(fake_yjs_state)
    )
    test_db.add(backup_snapshot)
    await test_db.commit()
    
    # Admin tries overwrite → REJECTED
    response = await client.post(
        f"/api/v1/documents/{test_document.id}/snapshots/{snapshot.id}/restore",
        headers=auth_headers_2,
        json={
            "action": "overwrite",
            "title": None,
            "backup_snapshot_id": str(backup_snapshot.id),
            "force": True
        }
    )
    assert response.status_code == 403  # Forbidden
    assert "owner" in response.json()["detail"].lower()


# =========================================
# P0: Overwrite - Missing Backup Rejected
# =========================================

@pytest.mark.asyncio
async def test_restore_overwrite_missing_backup_rejected(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document, auth_headers):
    """
    P0 CRITICAL: Overwrite without backup is rejected
    
    Invariant: backup_snapshot_id required for overwrite
    Protects: Data loss (no backup before overwrite)
    Catches: Overwrite without safety net
    """
    # Create owner share for test_user
    owner_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user.id,
        role='owner',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(owner_share)
    
    # Create snapshot
    fake_yjs_state = b'\x00\x01\x02\x03'
    snapshot = DocumentSnapshot(
        document_id=test_document.id,
        created_by=test_user.id,
        type='manual',
        yjs_state=fake_yjs_state,
        size_bytes=len(fake_yjs_state)
    )
    test_db.add(snapshot)
    await test_db.commit()
    
    # Owner tries overwrite without backup → REJECTED
    response = await client.post(
        f"/api/v1/documents/{test_document.id}/snapshots/{snapshot.id}/restore",
        headers=auth_headers,
        json={
            "action": "overwrite",
            "title": None,
            "backup_snapshot_id": None,  # Missing backup!
            "force": True
        }
    )
    assert response.status_code == 400  # Bad Request
    assert "backup" in response.json()["detail"].lower()


# =========================================
# P0: Overwrite - Stale Backup Rejected
# =========================================

@pytest.mark.asyncio
async def test_restore_overwrite_stale_backup_rejected(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document, auth_headers):
    """
    P0 CRITICAL: Overwrite with stale backup (>5 min) is rejected
    
    Invariant: Backup must be recent (<5 minutes)
    Protects: Data loss (backup might be outdated)
    Catches: Using old backup for overwrite
    """
    # Create owner share for test_user
    owner_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user.id,
        role='owner',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(owner_share)
    
    # Create snapshot
    fake_yjs_state = b'\x00\x01\x02\x03'
    snapshot = DocumentSnapshot(
        document_id=test_document.id,
        created_by=test_user.id,
        type='manual',
        yjs_state=fake_yjs_state,
        size_bytes=len(fake_yjs_state)
    )
    test_db.add(snapshot)
    
    # Create STALE backup snapshot (>5 minutes old)
    stale_backup = DocumentSnapshot(
        document_id=test_document.id,
        created_by=test_user.id,
        type='restore-backup',
        yjs_state=fake_yjs_state,
        size_bytes=len(fake_yjs_state),
        created_at=datetime.utcnow() - timedelta(minutes=10)  # 10 minutes ago
    )
    test_db.add(stale_backup)
    await test_db.commit()
    
    # Owner tries overwrite with stale backup → REJECTED
    response = await client.post(
        f"/api/v1/documents/{test_document.id}/snapshots/{snapshot.id}/restore",
        headers=auth_headers,
        json={
            "action": "overwrite",
            "title": None,
            "backup_snapshot_id": str(stale_backup.id),
            "force": True
        }
    )
    assert response.status_code == 400  # Bad Request
    assert "old" in response.json()["detail"].lower() or "stale" in response.json()["detail"].lower() or "5 minutes" in response.json()["detail"].lower()


# =========================================
# P0: Overwrite - Owner + Valid Backup Accepted
# =========================================

@pytest.mark.asyncio
async def test_restore_overwrite_owner_valid_backup_accepted(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document, auth_headers):
    """
    P0 CRITICAL: Owner with valid backup can overwrite
    
    Invariant: Owner + fresh backup (<5 min) + force=true → allowed
    Protects: Proper authorization flow
    Catches: Valid overwrite being blocked
    """
    # Create owner share for test_user
    owner_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user.id,
        role='owner',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(owner_share)
    
    # Create snapshot
    fake_yjs_state = b'\x00\x01\x02\x03'
    snapshot = DocumentSnapshot(
        document_id=test_document.id,
        created_by=test_user.id,
        type='manual',
        yjs_state=fake_yjs_state,
        size_bytes=len(fake_yjs_state)
    )
    test_db.add(snapshot)
    
    # Create FRESH backup snapshot (<5 minutes)
    fresh_backup = DocumentSnapshot(
        document_id=test_document.id,
        created_by=test_user.id,
        type='restore-backup',
        yjs_state=fake_yjs_state,
        size_bytes=len(fake_yjs_state),
        created_at=datetime.utcnow()  # Just now
    )
    test_db.add(fresh_backup)
    await test_db.commit()
    
    # Owner tries overwrite with valid backup → ALLOWED
    response = await client.post(
        f"/api/v1/documents/{test_document.id}/snapshots/{snapshot.id}/restore",
        headers=auth_headers,
        json={
            "action": "overwrite",
            "title": None,
            "backup_snapshot_id": str(fresh_backup.id),
            "force": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["action"] == "overwrite"
    assert data["backup_snapshot_id"] == str(fresh_backup.id)


# =========================================
# P0 CRITICAL: No CRDT Logic Executed Server-Side
# =========================================

@pytest.mark.asyncio
async def test_restore_no_crdt_logic_server_side(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document, auth_headers):
    """
    P0 CRITICAL: Server does NOT apply CRDT ops during restore
    
    Invariant: Server NEVER touches Yjs binary
    Protects: CRDT safety (no server-side merge)
    Catches: Server applying Y.applyUpdate()
    
    Verification:
    - Check yjs_state is stored as-is (opaque blob)
    - No parsing or modification
    - Restore only updates document.yjs_state field
    """
    # Create owner share for test_user
    owner_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user.id,
        role='owner',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(owner_share)
    
    # Create snapshot with specific binary (to verify no modification)
    original_yjs_state = b'\xAA\xBB\xCC\xDD\xEE\xFF'  # Unique binary
    snapshot = DocumentSnapshot(
        document_id=test_document.id,
        created_by=test_user.id,
        type='manual',
        yjs_state=original_yjs_state,
        size_bytes=len(original_yjs_state)
    )
    test_db.add(snapshot)
    
    # Create backup
    backup_snapshot = DocumentSnapshot(
        document_id=test_document.id,
        created_by=test_user.id,
        type='restore-backup',
        yjs_state=b'\x00\x00\x00\x00',
        size_bytes=4
    )
    test_db.add(backup_snapshot)
    await test_db.commit()
    
    # Set original document yjs_state
    test_document.yjs_state = b'\x11\x22\x33\x44'
    await test_db.commit()
    
    # Restore overwrite
    response = await client.post(
        f"/api/v1/documents/{test_document.id}/snapshots/{snapshot.id}/restore",
        headers=auth_headers,
        json={
            "action": "overwrite",
            "title": None,
            "backup_snapshot_id": str(backup_snapshot.id),
            "force": True
        }
    )
    assert response.status_code == 200
    
    # Verify document.yjs_state was replaced (not merged)
    await test_db.refresh(test_document)
    assert test_document.yjs_state == original_yjs_state  # Exact binary match (no modification)


# =========================================
# P0: Overwrite Without Force Returns 409
# =========================================

@pytest.mark.asyncio
async def test_restore_overwrite_without_force_returns_409(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document, auth_headers):
    """
    P0 CRITICAL: Overwrite without force=true returns 409
    
    Invariant: Explicit confirmation required (provider might be active)
    Protects: CRDT safety (prevent overwrite during collaboration)
    Catches: Accidental overwrite
    """
    # Create owner share for test_user
    owner_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user.id,
        role='owner',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(owner_share)
    
    # Create snapshot
    fake_yjs_state = b'\x00\x01\x02\x03'
    snapshot = DocumentSnapshot(
        document_id=test_document.id,
        created_by=test_user.id,
        type='manual',
        yjs_state=fake_yjs_state,
        size_bytes=len(fake_yjs_state)
    )
    test_db.add(snapshot)
    
    # Create backup
    backup_snapshot = DocumentSnapshot(
        document_id=test_document.id,
        created_by=test_user.id,
        type='restore-backup',
        yjs_state=fake_yjs_state,
        size_bytes=len(fake_yjs_state)
    )
    test_db.add(backup_snapshot)
    await test_db.commit()
    
    # Owner tries overwrite WITHOUT force → 409 CONFLICT
    response = await client.post(
        f"/api/v1/documents/{test_document.id}/snapshots/{snapshot.id}/restore",
        headers=auth_headers,
        json={
            "action": "overwrite",
            "title": None,
            "backup_snapshot_id": str(backup_snapshot.id),
            "force": False  # No explicit confirmation
        }
    )
    assert response.status_code == 409  # Conflict
    data = response.json()
    
    assert "provider_active" in str(data) or "suggested_action" in str(data)


# =========================================
# P0: List Snapshots Returns Metadata Only
# =========================================

@pytest.mark.asyncio
async def test_list_snapshots_no_yjs_state(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document, auth_headers):
    """
    P0: List snapshots does NOT return yjs_state binary
    
    Invariant: yjs_state excluded from list response
    Protects: Performance (large binary not sent)
    Catches: Binary being sent in list
    """
    # Create owner share for test_user
    owner_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user.id,
        role='owner',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(owner_share)
    
    # Create snapshot
    large_yjs_state = b'\x00' * 10000  # 10KB binary
    snapshot = DocumentSnapshot(
        document_id=test_document.id,
        created_by=test_user.id,
        type='manual',
        yjs_state=large_yjs_state,
        size_bytes=len(large_yjs_state)
    )
    test_db.add(snapshot)
    await test_db.commit()
    
    # List snapshots
    response = await client.get(
        f"/api/v1/documents/{test_document.id}/snapshots",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    
    assert len(data["snapshots"]) == 1
    snapshot_data = data["snapshots"][0]
    
    # Verify yjs_state NOT in response
    assert "yjs_state" not in snapshot_data
    
    # Verify size_bytes IS in response
    assert snapshot_data["size_bytes"] == 10000


# =========================================
# P0: Download Snapshot Returns Binary
# =========================================

@pytest.mark.asyncio
async def test_download_snapshot_returns_binary(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document, auth_headers):
    """
    P0: Download endpoint returns yjs_state as binary
    
    Invariant: yjs_state is opaque binary blob
    Protects: CRDT safety (no parsing)
    Catches: Binary being corrupted
    """
    # Create owner share for test_user
    owner_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user.id,
        role='owner',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(owner_share)
    
    # Create snapshot with specific binary
    original_binary = b'\xDE\xAD\xBE\xEF'
    snapshot = DocumentSnapshot(
        document_id=test_document.id,
        created_by=test_user.id,
        type='manual',
        yjs_state=original_binary,
        size_bytes=len(original_binary)
    )
    test_db.add(snapshot)
    await test_db.commit()
    
    # Download snapshot
    response = await client.get(
        f"/api/v1/documents/{test_document.id}/snapshots/{snapshot.id}/download",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/octet-stream"
    
    # Verify binary is exact match (no corruption)
    assert response.content == original_binary


# =========================================
# P0: Create Manual Snapshot Stores Binary
# =========================================

@pytest.mark.asyncio
async def test_create_manual_snapshot_stores_binary(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document, auth_headers):
    """
    P0: Creating snapshot stores base64 → binary correctly
    
    Invariant: base64 decoding is correct
    Protects: Data integrity
    Catches: Binary corruption
    """
    # Create editor share for test_user
    editor_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user.id,
        role='editor',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(editor_share)
    await test_db.commit()
    
    # Create snapshot
    original_binary = b'\xCA\xFE\xBA\xBE'
    yjs_state_base64 = base64.b64encode(original_binary).decode('utf-8')
    
    response = await client.post(
        f"/api/v1/documents/{test_document.id}/snapshots",
        headers=auth_headers,
        json={
            "yjs_state_base64": yjs_state_base64,
            "note": "Test snapshot",
            "html_preview": None,
            "type": "manual"
        }
    )
    assert response.status_code == 201
    data = response.json()
    
    assert data["success"] is True
    snapshot_id = data["snapshot_id"]
    
    # Verify binary was stored correctly
    from sqlalchemy import select
    snapshot_query = select(DocumentSnapshot).where(DocumentSnapshot.id == snapshot_id)
    result = await test_db.execute(snapshot_query)
    snapshot = result.scalar_one()
    
    assert snapshot.yjs_state == original_binary  # Exact match

