"""
Test Shares Router & Service
==============================

P0 Tests (MANDATORY):
- assert_role() hierarchy enforcement
- owner-only operations protected
- cannot promote above own role

Security boundary: Permission enforcement
Data loss prevention: Cannot remove owner without transfer
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.models.user import User
from app.models.document import Document
from app.models.document_share import DocumentShare
from app.models.invitation import Invitation
from app.services.share_service import ShareService


# =========================================
# P0: assert_role() Hierarchy Enforcement
# =========================================

@pytest.mark.asyncio
async def test_assert_role_owner_has_all_access(test_db: AsyncSession, test_user: User, test_document):
    """
    P0: Owner has access to all operations
    
    Invariant: Role hierarchy (owner >= any role)
    Protects: Permission boundary
    """
    # Create owner share
    owner_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user.id,
        role='owner',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(owner_share)
    await test_db.commit()
    
    # Owner can access owner-level operations
    result = await ShareService.assert_role(test_db, test_document.id, test_user.id, 'owner')
    assert result.role == 'owner'
    
    # Owner can access admin-level operations
    result = await ShareService.assert_role(test_db, test_document.id, test_user.id, 'admin')
    assert result.role == 'owner'
    
    # Owner can access viewer-level operations
    result = await ShareService.assert_role(test_db, test_document.id, test_user.id, 'viewer')
    assert result.role == 'owner'


@pytest.mark.asyncio
async def test_assert_role_editor_cannot_access_admin(test_db: AsyncSession, test_user: User, test_user_2: User, test_document):
    """
    P0: Editor cannot access admin-level operations
    
    Invariant: Role hierarchy (editor < admin)
    Protects: Permission boundary
    Catches: Privilege escalation
    """
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
    await test_db.commit()
    
    # Editor can access editor operations
    result = await ShareService.assert_role(test_db, test_document.id, test_user_2.id, 'editor')
    assert result.role == 'editor'
    
    # Editor CANNOT access admin operations
    with pytest.raises(ValueError, match="Insufficient permissions"):
        await ShareService.assert_role(test_db, test_document.id, test_user_2.id, 'admin')


@pytest.mark.asyncio
async def test_assert_role_no_access_rejected(test_db: AsyncSession, test_user: User, test_user_2: User, test_document):
    """
    P0: User with no share is rejected
    
    Invariant: Must have document_share entry
    Protects: Permission boundary
    Catches: Unauthorized access
    """
    # test_user_2 has NO share for test_document
    
    with pytest.raises(ValueError, match="No access"):
        await ShareService.assert_role(test_db, test_document.id, test_user_2.id, 'viewer')


# =========================================
# P0: Owner-Only Operations Protected
# =========================================

@pytest.mark.asyncio
async def test_transfer_ownership_owner_only(client: AsyncClient, test_db: AsyncSession, test_user: User, test_user_2: User, test_document, auth_headers, auth_headers_2):
    """
    P0: Transfer ownership is owner-only
    
    Invariant: Only owner can transfer ownership
    Protects: Security boundary (ownership control)
    Catches: Non-owner attempting to transfer
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
    
    # Create admin share for test_user_2
    admin_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user_2.id,
        role='admin',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(admin_share)
    await test_db.commit()
    
    # Admin (test_user_2) tries to transfer ownership → REJECTED
    response = await client.post(
        f"/api/v1/documents/{test_document.id}/transfer-ownership",
        headers=auth_headers_2,
        json={"new_owner_id": str(test_user_2.id)}
    )
    assert response.status_code == 403  # Forbidden
    
    # Owner (test_user) can transfer → ALLOWED
    response = await client.post(
        f"/api/v1/documents/{test_document.id}/transfer-ownership",
        headers=auth_headers,
        json={"new_owner_id": str(test_user_2.id)}
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_remove_member_cannot_remove_owner(client: AsyncClient, test_db: AsyncSession, test_user: User, test_user_2: User, test_document, auth_headers):
    """
    P0: Cannot remove owner without transfer
    
    Invariant: Owner cannot be removed directly
    Protects: Data loss (orphaned documents)
    Catches: Accidental owner removal
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
    
    # Create admin share for test_user_2
    admin_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user_2.id,
        role='admin',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(admin_share)
    await test_db.commit()
    
    # Try to remove owner → REJECTED
    response = await client.delete(
        f"/api/v1/documents/{test_document.id}/members/{owner_share.id}",
        headers=auth_headers
    )
    assert response.status_code == 403  # Forbidden
    assert "owner" in response.json()["detail"].lower()


# =========================================
# P0: Cannot Promote Above Own Role
# =========================================

@pytest.mark.asyncio
async def test_invite_cannot_invite_above_own_role(client: AsyncClient, test_db: AsyncSession, test_user: User, test_user_2: User, test_document, auth_headers_2):
    """
    P0: Cannot invite to role higher than own
    
    Invariant: Inviter cannot grant higher privilege
    Protects: Permission boundary
    Catches: Privilege escalation via invite
    """
    # Create admin share for test_user_2
    admin_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user_2.id,
        role='admin',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(admin_share)
    await test_db.commit()
    
    # Admin tries to invite as owner → REJECTED
    response = await client.post(
        f"/api/v1/documents/{test_document.id}/invite",
        headers=auth_headers_2,
        json={
            "emails": ["newuser@example.com"],
            "role": "owner",
            "send_email": False
        }
    )
    assert response.status_code == 403  # Forbidden
    assert "cannot invite" in response.json()["detail"].lower() or "higher" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_change_role_cannot_promote_above_own_role(client: AsyncClient, test_db: AsyncSession, test_user: User, test_user_2: User, test_document, auth_headers_2):
    """
    P0: Cannot change role to higher than own
    
    Invariant: Cannot promote to higher privilege
    Protects: Permission boundary
    Catches: Privilege escalation via role change
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
    
    # Create admin share for test_user_2
    admin_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user_2.id,
        role='admin',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(admin_share)
    await test_db.commit()
    
    # Admin tries to promote owner to... owner (should work but test escalation)
    # Actually, let's test: admin tries to promote editor to owner → REJECTED
    
    # Create editor share
    editor_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user.id,  # Reuse test_user as editor for this test
        role='editor',
        granted_by=test_user_2.id,
        status='active'
    )
    test_db.add(editor_share)
    await test_db.commit()
    
    # Admin (test_user_2) tries to change editor to owner → REJECTED
    response = await client.post(
        f"/api/v1/documents/{test_document.id}/members/{editor_share.id}/role",
        headers=auth_headers_2,
        json={"role": "owner"}
    )
    assert response.status_code == 403  # Forbidden


# =========================================
# P0: List Members Returns Correct Data
# =========================================

@pytest.mark.asyncio
async def test_list_members_success(client: AsyncClient, test_db: AsyncSession, test_user: User, test_user_2: User, test_document, auth_headers):
    """
    P0: List members returns active shares
    
    Invariant: Members list reflects document_shares
    Protects: HTTP ↔ DB consistency
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
    await test_db.commit()
    
    # Get members
    response = await client.get(
        f"/api/v1/documents/{test_document.id}/members",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    
    assert len(data["members"]) == 2
    assert any(m["role"] == "owner" for m in data["members"])
    assert any(m["role"] == "editor" for m in data["members"])


# =========================================
# P0: Accept Invitation Creates Share
# =========================================

@pytest.mark.asyncio
async def test_accept_invitation_creates_share(client: AsyncClient, test_db: AsyncSession, test_user: User, test_user_2: User, test_document, auth_headers_2):
    """
    P0: Accepting invitation creates document_share
    
    Invariant: Invitation → share creation
    Protects: HTTP ↔ DB consistency
    Catches: Accepted invite without share
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
    
    # Create invitation for test_user_2
    invitation = Invitation(
        document_id=test_document.id,
        email=test_user_2.email,
        invited_by=test_user.id,
        role='editor',
        token='test_token_12345',
        status='pending',
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    test_db.add(invitation)
    await test_db.commit()
    
    # Accept invitation
    response = await client.post(
        f"/api/v1/invitations/test_token_12345/accept",
        headers=auth_headers_2
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["role"] == "editor"
    
    # Verify share was created
    from sqlalchemy import select
    share_query = select(DocumentShare).where(
        DocumentShare.document_id == test_document.id,
        DocumentShare.principal_id == test_user_2.id
    )
    result = await test_db.execute(share_query)
    share = result.scalar_one_or_none()
    
    assert share is not None
    assert share.role == 'editor'
    assert share.status == 'active'


# =========================================
# P0: Declined Invitation Does NOT Create Share
# =========================================

@pytest.mark.asyncio
async def test_decline_invitation_no_share_created(client: AsyncClient, test_db: AsyncSession, test_user: User, test_user_2: User, test_document, auth_headers_2):
    """
    P0: Declining invitation does NOT create share
    
    Invariant: Declined invite → no share
    Protects: Permission boundary
    Catches: Declined user gaining access
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
    
    # Create invitation for test_user_2
    invitation = Invitation(
        document_id=test_document.id,
        email=test_user_2.email,
        invited_by=test_user.id,
        role='editor',
        token='test_token_decline',
        status='pending',
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    test_db.add(invitation)
    await test_db.commit()
    
    # Decline invitation
    response = await client.post(
        f"/api/v1/invitations/test_token_decline/decline",
        headers=auth_headers_2
    )
    assert response.status_code == 200
    
    # Verify NO share was created
    from sqlalchemy import select
    share_query = select(DocumentShare).where(
        DocumentShare.document_id == test_document.id,
        DocumentShare.principal_id == test_user_2.id
    )
    result = await test_db.execute(share_query)
    share = result.scalar_one_or_none()
    
    assert share is None  # No share should exist

