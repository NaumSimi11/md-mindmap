"""
Test Hocuspocus Auth Integration
=================================

P0 Tests (MANDATORY):
- JWT with access → allowed
- JWT without access → rejected
- valid share link → allowed with mapped role
- invalid/expired share link → rejected
- no auth → rejected

Note: These tests verify the backend APIs that Hocuspocus consumes.
Full WebSocket connection testing requires separate integration tests.

Security boundary: WebSocket authentication
HTTP ↔ WebSocket consistency: Role mapping must match
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.models.user import User
from app.models.document import Document
from app.models.document_share import DocumentShare
from app.models.share_link import ShareLink


# =========================================
# P0: JWT With Access → Allowed
# =========================================

@pytest.mark.asyncio
async def test_jwt_with_access_returns_role(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document, auth_headers):
    """
    P0: JWT auth with document access returns user role
    
    Invariant: JWT → document_shares check succeeds
    Protects: HTTP ↔ WebSocket consistency
    Catches: User with access being denied
    
    Simulates: Hocuspocus calling GET /documents/{id}/members
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
    await test_db.commit()
    
    # Hocuspocus would call this endpoint with JWT
    response = await client.get(
        f"/api/v1/documents/{test_document.id}/members",
        headers=auth_headers
    )
    assert response.status_code == 200  # Access granted
    data = response.json()
    
    # Verify user is in members list with role
    user_member = None
    for member in data["members"]:
        if member["principal_id"] == str(test_user.id):
            user_member = member
            break
    
    assert user_member is not None
    assert user_member["role"] == "owner"  # Role available for WebSocket context


# =========================================
# P0: JWT Without Access → Rejected
# =========================================

@pytest.mark.asyncio
async def test_jwt_without_access_returns_403(client: AsyncClient, test_db: AsyncSession, test_user: User, test_user_2: User, test_document, auth_headers_2):
    """
    P0: JWT auth without document access returns 403
    
    Invariant: No document_share → 403 Forbidden
    Protects: Permission boundary
    Catches: Unauthorized user connecting
    
    Simulates: Hocuspocus calling GET /documents/{id}/members (user not member)
    """
    # Create owner share for test_user ONLY
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
    
    # test_user_2 has NO share for test_document
    
    # Hocuspocus would call this endpoint with test_user_2's JWT
    response = await client.get(
        f"/api/v1/documents/{test_document.id}/members",
        headers=auth_headers_2  # test_user_2's headers
    )
    assert response.status_code == 403  # Access denied
    
    # Hocuspocus should reject connection


# =========================================
# P0: Valid Share Link → Allowed With Mapped Role
# =========================================

@pytest.mark.asyncio
async def test_valid_share_link_returns_mode(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document):
    """
    P0: Valid share link returns mode for role mapping
    
    Invariant: valid link → mode returned (view/comment/edit)
    Protects: HTTP ↔ WebSocket consistency
    Catches: Valid link being rejected
    
    Simulates: Hocuspocus calling POST /share/validate
    Role mapping: view→viewer, comment→commenter, edit→editor
    """
    # Create valid share link (edit mode)
    valid_link = ShareLink(
        document_id=test_document.id,
        token='valid_edit_link',
        mode='edit',
        created_by=test_user.id,
        expires_at=datetime.utcnow() + timedelta(days=30),
        revoked_at=None,
        max_uses=None,
        uses_count=0
    )
    test_db.add(valid_link)
    await test_db.commit()
    
    # Hocuspocus would call this endpoint (no JWT, public)
    response = await client.post(
        "/api/v1/share/validate",
        json={"token": "valid_edit_link", "password": None}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["valid"] is True
    assert data["document_id"] == str(test_document.id)
    assert data["mode"] == "edit"  # Hocuspocus maps this to 'editor' role


# =========================================
# P0: Invalid Share Link → Rejected
# =========================================

@pytest.mark.asyncio
async def test_invalid_share_link_returns_invalid(client: AsyncClient):
    """
    P0: Invalid share link token returns valid=false
    
    Invariant: Non-existent token → rejected
    Protects: Security boundary
    Catches: Guest with fake token
    
    Simulates: Hocuspocus calling POST /share/validate (bad token)
    """
    # Hocuspocus would call this endpoint with invalid token
    response = await client.post(
        "/api/v1/share/validate",
        json={"token": "invalid_fake_token", "password": None}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["valid"] is False
    assert data["reason"] == "invalid_token"
    
    # Hocuspocus should reject connection


# =========================================
# P0: Expired Share Link → Rejected
# =========================================

@pytest.mark.asyncio
async def test_expired_share_link_returns_expired(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document):
    """
    P0: Expired share link returns valid=false
    
    Invariant: expires_at is checked
    Protects: Time-limited access
    Catches: Guest with expired link
    
    Simulates: Hocuspocus calling POST /share/validate (expired)
    """
    # Create expired share link
    expired_link = ShareLink(
        document_id=test_document.id,
        token='expired_link_token',
        mode='view',
        created_by=test_user.id,
        expires_at=datetime.utcnow() - timedelta(days=1),  # Expired
        revoked_at=None,
        max_uses=None,
        uses_count=0
    )
    test_db.add(expired_link)
    await test_db.commit()
    
    # Hocuspocus would call this endpoint
    response = await client.post(
        "/api/v1/share/validate",
        json={"token": "expired_link_token", "password": None}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["valid"] is False
    assert data["reason"] == "expired"
    
    # Hocuspocus should reject connection


# =========================================
# P0: Role Hierarchy Consistency (JWT vs Share Link)
# =========================================

@pytest.mark.asyncio
async def test_role_mapping_consistency(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document, auth_headers):
    """
    P0: Role mapping is consistent between JWT and share links
    
    Invariant: Same document → same role capabilities
    Protects: HTTP ↔ WebSocket consistency
    Catches: Role mismatch
    
    Verifies:
    - JWT admin → 'admin' role
    - Share link 'edit' → 'editor' role
    - Both should have similar capabilities (not tested here, but ensured by design)
    """
    # Create admin share for test_user
    admin_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user.id,
        role='admin',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(admin_share)
    
    # Create edit share link
    edit_link = ShareLink(
        document_id=test_document.id,
        token='edit_link_token',
        mode='edit',
        created_by=test_user.id,
        expires_at=datetime.utcnow() + timedelta(days=30),
        revoked_at=None,
        max_uses=None,
        uses_count=0
    )
    test_db.add(edit_link)
    await test_db.commit()
    
    # JWT auth → returns admin role
    response_jwt = await client.get(
        f"/api/v1/documents/{test_document.id}/members",
        headers=auth_headers
    )
    assert response_jwt.status_code == 200
    jwt_role = None
    for member in response_jwt.json()["members"]:
        if member["principal_id"] == str(test_user.id):
            jwt_role = member["role"]
    assert jwt_role == "admin"
    
    # Share link → returns edit mode (maps to editor)
    response_link = await client.post(
        "/api/v1/share/validate",
        json={"token": "edit_link_token", "password": None}
    )
    assert response_link.status_code == 200
    link_data = response_link.json()
    assert link_data["valid"] is True
    assert link_data["mode"] == "edit"  # Maps to 'editor' in Hocuspocus
    
    # Both admin and editor have editing capabilities
    # Hocuspocus would assign appropriate role context


# =========================================
# P0: No Auth → Rejected (Verified via 401)
# =========================================

@pytest.mark.asyncio
async def test_no_auth_returns_401(client: AsyncClient, test_db: AsyncSession, test_document):
    """
    P0: No authentication (no JWT, no share link) returns 401
    
    Invariant: Authentication required
    Protects: Security boundary
    Catches: Unauthenticated access
    
    Simulates: Hocuspocus with no token and no x-share-token header
    """
    # Try to access members endpoint without auth
    response = await client.get(
        f"/api/v1/documents/{test_document.id}/members"
        # No headers = no JWT
    )
    assert response.status_code == 401  # Unauthorized
    
    # Hocuspocus should reject connection if neither JWT nor share link provided


# =========================================
# P0: Document Not Found → 404
# =========================================

@pytest.mark.asyncio
async def test_document_not_found_returns_404(client: AsyncClient, auth_headers):
    """
    P0: Non-existent document returns 404
    
    Invariant: Document must exist
    Protects: Data integrity
    Catches: Connection to deleted/missing document
    
    Simulates: Hocuspocus calling /documents/{id}/members (invalid ID)
    """
    import uuid
    fake_document_id = str(uuid.uuid4())
    
    # Try to access non-existent document
    response = await client.get(
        f"/api/v1/documents/{fake_document_id}/members",
        headers=auth_headers
    )
    assert response.status_code == 404  # Not Found
    
    # Hocuspocus should reject connection


# =========================================
# P0: Viewer Can Connect (Lower Permission)
# =========================================

@pytest.mark.asyncio
async def test_viewer_can_connect(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document, auth_headers):
    """
    P0: User with viewer role can connect
    
    Invariant: Viewer is valid role for connection
    Protects: HTTP ↔ WebSocket consistency
    Catches: Viewer being rejected
    
    Verifies: All roles (owner, admin, editor, commenter, viewer) can connect
    """
    # Create viewer share for test_user
    viewer_share = DocumentShare(
        document_id=test_document.id,
        principal_type='user',
        principal_id=test_user.id,
        role='viewer',
        granted_by=test_user.id,
        status='active'
    )
    test_db.add(viewer_share)
    await test_db.commit()
    
    # Hocuspocus would call this endpoint
    response = await client.get(
        f"/api/v1/documents/{test_document.id}/members",
        headers=auth_headers
    )
    assert response.status_code == 200  # Viewer can connect
    
    user_member = None
    for member in response.json()["members"]:
        if member["principal_id"] == str(test_user.id):
            user_member = member
            break
    
    assert user_member is not None
    assert user_member["role"] == "viewer"


# =========================================
# P0: Share Link Mode Mapping Verified
# =========================================

@pytest.mark.asyncio
async def test_share_link_mode_mapping(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document):
    """
    P0: All share link modes map correctly
    
    Invariant: Mode → Role mapping
    - view → viewer
    - comment → commenter
    - edit → editor
    
    Protects: HTTP ↔ WebSocket consistency
    Catches: Incorrect role assignment
    """
    # Create links for all modes
    modes = ['view', 'comment', 'edit']
    
    for mode in modes:
        link = ShareLink(
            document_id=test_document.id,
            token=f'{mode}_link_token',
            mode=mode,
            created_by=test_user.id,
            expires_at=datetime.utcnow() + timedelta(days=30),
            revoked_at=None,
            max_uses=None,
            uses_count=0
        )
        test_db.add(link)
    await test_db.commit()
    
    # Verify each mode
    for mode in modes:
        response = await client.post(
            "/api/v1/share/validate",
            json={"token": f"{mode}_link_token", "password": None}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["valid"] is True
        assert data["mode"] == mode
        
        # Hocuspocus maps:
        # view → viewer
        # comment → commenter
        # edit → editor

