"""
Test Share Links Router & Service
==================================

P0 Tests (MANDATORY):
- expired / revoked / max_uses / password mismatch → rejected
- valid token → correct role mapping

Security boundary: Guest access control
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
import bcrypt

from app.models.user import User
from app.models.document import Document
from app.models.document_share import DocumentShare
from app.models.share_link import ShareLink


# =========================================
# P0: Expired Link Rejected
# =========================================

@pytest.mark.asyncio
async def test_validate_expired_link_rejected(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document):
    """
    P0: Expired share link is rejected
    
    Invariant: expires_at is enforced
    Protects: Security boundary (time-limited access)
    Catches: Guest accessing expired link
    """
    # Create expired share link
    expired_link = ShareLink(
        document_id=test_document.id,
        token='expired_token_12345',
        mode='view',
        created_by=test_user.id,
        expires_at=datetime.utcnow() - timedelta(days=1),  # Expired 1 day ago
        revoked_at=None,
        max_uses=None,
        uses_count=0
    )
    test_db.add(expired_link)
    await test_db.commit()
    
    # Validate expired link
    response = await client.post(
        "/api/v1/share/validate",
        json={"token": "expired_token_12345", "password": None}
    )
    assert response.status_code == 200  # Returns 200 but valid=false
    data = response.json()
    
    assert data["valid"] is False
    assert data["reason"] == "expired"


# =========================================
# P0: Revoked Link Rejected
# =========================================

@pytest.mark.asyncio
async def test_validate_revoked_link_rejected(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document):
    """
    P0: Revoked share link is rejected
    
    Invariant: revoked_at is enforced
    Protects: Security boundary (admin can revoke)
    Catches: Guest accessing revoked link
    """
    # Create revoked share link
    revoked_link = ShareLink(
        document_id=test_document.id,
        token='revoked_token_12345',
        mode='view',
        created_by=test_user.id,
        expires_at=datetime.utcnow() + timedelta(days=30),
        revoked_at=datetime.utcnow(),  # Revoked
        max_uses=None,
        uses_count=0
    )
    test_db.add(revoked_link)
    await test_db.commit()
    
    # Validate revoked link
    response = await client.post(
        "/api/v1/share/validate",
        json={"token": "revoked_token_12345", "password": None}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["valid"] is False
    assert data["reason"] == "revoked"


# =========================================
# P0: Max Uses Exceeded Rejected
# =========================================

@pytest.mark.asyncio
async def test_validate_max_uses_exceeded_rejected(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document):
    """
    P0: Share link with max_uses exceeded is rejected
    
    Invariant: max_uses limit enforced
    Protects: Security boundary (limited sharing)
    Catches: Guest exceeding usage limit
    """
    # Create link with max_uses=5, uses_count=5 (limit reached)
    max_uses_link = ShareLink(
        document_id=test_document.id,
        token='maxuses_token_12345',
        mode='view',
        created_by=test_user.id,
        expires_at=datetime.utcnow() + timedelta(days=30),
        revoked_at=None,
        max_uses=5,
        uses_count=5  # Limit reached
    )
    test_db.add(max_uses_link)
    await test_db.commit()
    
    # Validate link (should be rejected)
    response = await client.post(
        "/api/v1/share/validate",
        json={"token": "maxuses_token_12345", "password": None}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["valid"] is False
    assert data["reason"] == "max_uses_exceeded"


# =========================================
# P0: Password Mismatch Rejected
# =========================================

@pytest.mark.asyncio
async def test_validate_password_mismatch_rejected(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document):
    """
    P0: Share link with wrong password is rejected
    
    Invariant: password_hash is verified
    Protects: Security boundary (password protection)
    Catches: Guest with wrong password
    """
    # Create password-protected link
    correct_password = "SecretPass123"
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(correct_password.encode('utf-8'), salt).decode('utf-8')
    
    password_link = ShareLink(
        document_id=test_document.id,
        token='password_token_12345',
        mode='view',
        password_hash=password_hash,
        created_by=test_user.id,
        expires_at=datetime.utcnow() + timedelta(days=30),
        revoked_at=None,
        max_uses=None,
        uses_count=0
    )
    test_db.add(password_link)
    await test_db.commit()
    
    # Validate with wrong password
    response = await client.post(
        "/api/v1/share/validate",
        json={"token": "password_token_12345", "password": "WrongPassword"}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["valid"] is False
    assert data["reason"] == "invalid_password"


# =========================================
# P0: Password Required (No Password Provided)
# =========================================

@pytest.mark.asyncio
async def test_validate_password_required(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document):
    """
    P0: Password-protected link requires password
    
    Invariant: password_hash enforced
    Protects: Security boundary
    Catches: Guest not providing password
    """
    # Create password-protected link
    correct_password = "SecretPass123"
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(correct_password.encode('utf-8'), salt).decode('utf-8')
    
    password_link = ShareLink(
        document_id=test_document.id,
        token='password_required_token',
        mode='view',
        password_hash=password_hash,
        created_by=test_user.id,
        expires_at=datetime.utcnow() + timedelta(days=30),
        revoked_at=None,
        max_uses=None,
        uses_count=0
    )
    test_db.add(password_link)
    await test_db.commit()
    
    # Validate without password
    response = await client.post(
        "/api/v1/share/validate",
        json={"token": "password_required_token", "password": None}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["valid"] is False
    assert data["reason"] == "password_required"


# =========================================
# P0: Valid Link → Correct Role Mapping
# =========================================

@pytest.mark.asyncio
async def test_validate_valid_link_view_mode(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document):
    """
    P0: Valid link (view mode) returns correct role mapping
    
    Invariant: mode → role mapping (view → viewer)
    Protects: HTTP ↔ WebSocket consistency
    Catches: Incorrect role assignment
    """
    # Create valid link (view mode)
    valid_link = ShareLink(
        document_id=test_document.id,
        token='valid_view_token',
        mode='view',
        created_by=test_user.id,
        expires_at=datetime.utcnow() + timedelta(days=30),
        revoked_at=None,
        max_uses=None,
        uses_count=0
    )
    test_db.add(valid_link)
    await test_db.commit()
    
    # Validate link
    response = await client.post(
        "/api/v1/share/validate",
        json={"token": "valid_view_token", "password": None}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["valid"] is True
    assert data["document_id"] == str(test_document.id)
    assert data["mode"] == "view"  # Should map to 'viewer' role in Hocuspocus


@pytest.mark.asyncio
async def test_validate_valid_link_comment_mode(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document):
    """
    P0: Valid link (comment mode) returns correct role mapping
    
    Invariant: mode → role mapping (comment → commenter)
    Protects: HTTP ↔ WebSocket consistency
    """
    # Create valid link (comment mode)
    valid_link = ShareLink(
        document_id=test_document.id,
        token='valid_comment_token',
        mode='comment',
        created_by=test_user.id,
        expires_at=datetime.utcnow() + timedelta(days=30),
        revoked_at=None,
        max_uses=None,
        uses_count=0
    )
    test_db.add(valid_link)
    await test_db.commit()
    
    # Validate link
    response = await client.post(
        "/api/v1/share/validate",
        json={"token": "valid_comment_token", "password": None}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["valid"] is True
    assert data["mode"] == "comment"  # Should map to 'commenter' role


@pytest.mark.asyncio
async def test_validate_valid_link_edit_mode(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document):
    """
    P0: Valid link (edit mode) returns correct role mapping
    
    Invariant: mode → role mapping (edit → editor)
    Protects: HTTP ↔ WebSocket consistency
    """
    # Create valid link (edit mode)
    valid_link = ShareLink(
        document_id=test_document.id,
        token='valid_edit_token',
        mode='edit',
        created_by=test_user.id,
        expires_at=datetime.utcnow() + timedelta(days=30),
        revoked_at=None,
        max_uses=None,
        uses_count=0
    )
    test_db.add(valid_link)
    await test_db.commit()
    
    # Validate link
    response = await client.post(
        "/api/v1/share/validate",
        json={"token": "valid_edit_token", "password": None}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["valid"] is True
    assert data["mode"] == "edit"  # Should map to 'editor' role


# =========================================
# P0: Uses Count Incremented Atomically
# =========================================

@pytest.mark.asyncio
async def test_validate_increments_uses_count(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document):
    """
    P0: Validating link increments uses_count
    
    Invariant: uses_count is incremented atomically
    Protects: Concurrency safety
    Catches: Multiple validations not counted
    """
    # Create valid link
    valid_link = ShareLink(
        document_id=test_document.id,
        token='increment_token',
        mode='view',
        created_by=test_user.id,
        expires_at=datetime.utcnow() + timedelta(days=30),
        revoked_at=None,
        max_uses=10,
        uses_count=0
    )
    test_db.add(valid_link)
    await test_db.commit()
    
    # Validate link
    response = await client.post(
        "/api/v1/share/validate",
        json={"token": "increment_token", "password": None}
    )
    assert response.status_code == 200
    assert response.json()["valid"] is True
    
    # Check uses_count incremented
    await test_db.refresh(valid_link)
    assert valid_link.uses_count == 1
    
    # Validate again
    response = await client.post(
        "/api/v1/share/validate",
        json={"token": "increment_token", "password": None}
    )
    assert response.status_code == 200
    assert response.json()["valid"] is True
    
    # Check uses_count incremented again
    await test_db.refresh(valid_link)
    assert valid_link.uses_count == 2


# =========================================
# P0: Invalid Token Rejected
# =========================================

@pytest.mark.asyncio
async def test_validate_invalid_token_rejected(client: AsyncClient):
    """
    P0: Non-existent token is rejected
    
    Invariant: Token must exist in DB
    Protects: Security boundary
    Catches: Guessing tokens
    """
    # Validate non-existent token
    response = await client.post(
        "/api/v1/share/validate",
        json={"token": "nonexistent_token_xyz", "password": None}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["valid"] is False
    assert data["reason"] == "invalid_token"


# =========================================
# P0: Create Link Returns Token
# =========================================

@pytest.mark.asyncio
async def test_create_share_link_returns_token(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document, auth_headers):
    """
    P0: Creating share link returns secure token
    
    Invariant: Token is generated and returned
    Protects: HTTP ↔ DB consistency
    Catches: Missing token in response
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
    
    # Create share link
    response = await client.post(
        f"/api/v1/documents/{test_document.id}/share-links",
        headers=auth_headers,
        json={
            "mode": "view",
            "expires_at": None,  # Default 30 days
            "max_uses": None,
            "password": None
        }
    )
    assert response.status_code == 201
    data = response.json()
    
    assert "token" in data
    assert len(data["token"]) > 20  # Should be secure token (>= 32 bytes)
    assert data["mode"] == "view"
    assert data["document_id"] == str(test_document.id)


# =========================================
# P0: Revoke Link Works
# =========================================

@pytest.mark.asyncio
async def test_revoke_share_link_success(client: AsyncClient, test_db: AsyncSession, test_user: User, test_document, auth_headers):
    """
    P0: Revoking link sets revoked_at
    
    Invariant: Revoked link is invalidated
    Protects: Security boundary (admin control)
    Catches: Revocation not working
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
    
    # Create share link
    share_link = ShareLink(
        document_id=test_document.id,
        token='revoke_test_token',
        mode='view',
        created_by=test_user.id,
        expires_at=datetime.utcnow() + timedelta(days=30),
        revoked_at=None,
        max_uses=None,
        uses_count=0
    )
    test_db.add(share_link)
    await test_db.commit()
    
    # Revoke link
    response = await client.delete(
        f"/api/v1/documents/{test_document.id}/share-links/{share_link.id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    
    # Verify link is revoked
    await test_db.refresh(share_link)
    assert share_link.revoked_at is not None
    
    # Verify validation now fails
    response = await client.post(
        "/api/v1/share/validate",
        json={"token": "revoke_test_token", "password": None}
    )
    data = response.json()
    assert data["valid"] is False
    assert data["reason"] == "revoked"

