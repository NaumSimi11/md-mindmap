"""
Workspace Members Tests
=======================

P0 Tests (Must Have):
- Membership CRUD (add, list, remove, change role)
- Transfer ownership (CRITICAL: atomicity invariants)
- User workspaces listing

Test Strategy:
- Use pytest fixtures from conftest.py
- Test authorization matrix (viewer/editor/admin/owner)
- Test error cases (403, 404, 409)
- Verify ownership transfer invariants
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.workspace_member import WorkspaceMember, WorkspaceRole
from app.models.workspace import Workspace


# ============================================================================
# A. Membership CRUD
# ============================================================================

@pytest.mark.asyncio
async def test_add_member_admin_success(client: AsyncClient, auth_headers, test_db: AsyncSession):
    """
    P0: Admin can add members to workspace
    
    Expected: 201 Created
    """
    # Create workspace (owner = user1)
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "slug": "test-workspace"},
        headers=auth_headers
    )
    assert workspace_response.status_code == 201
    workspace_id = workspace_response.json()["id"]
    
    # Create second user
    user2_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "user2@example.com",
            "username": "user2",
            "password": "Password123!"
        }
    )
    assert user2_response.status_code == 201
    user2_id = user2_response.json()["user"]["id"]
    
    # Add user2 as editor
    response = await client.post(
        f"/api/v1/workspaces/{workspace_id}/members",
        json={"user_id": user2_id, "role": "editor"},
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == user2_id
    assert data["role"] == "editor"
    assert data["status"] == "active"


@pytest.mark.asyncio
async def test_add_member_viewer_forbidden(client: AsyncClient, auth_headers, test_db: AsyncSession):
    """
    P0: Viewer cannot add members
    
    Expected: 403 Forbidden
    """
    # Create workspace (owner = user1)
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "slug": "test-workspace"},
        headers=auth_headers
    )
    assert workspace_response.status_code == 201
    workspace_id = workspace_response.json()["id"]
    
    # Create user2 and user3
    user2_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "user2@example.com", "username": "user2", "password": "Password123!"}
    )
    user2_id = user2_response.json()["user"]["id"]
    
    user3_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "user3@example.com", "username": "user3", "password": "Password123!"}
    )
    user3_id = user3_response.json()["user"]["id"]
    
    # Add user2 as viewer
    await client.post(
        f"/api/v1/workspaces/{workspace_id}/members",
        json={"user_id": user2_id, "role": "viewer"},
        headers=auth_headers
    )
    
    # Login as user2 (viewer)
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "user2@example.com", "password": "Password123!"}
    )
    user2_token = login_response.json()["access_token"]
    user2_headers = {"Authorization": f"Bearer {user2_token}"}
    
    # Try to add user3 as viewer (should fail)
    response = await client.post(
        f"/api/v1/workspaces/{workspace_id}/members",
        json={"user_id": user3_id, "role": "viewer"},
        headers=user2_headers
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_add_member_user_not_found(client: AsyncClient, auth_headers):
    """
    P0: Adding non-existent user returns 404
    
    Expected: 404 Not Found
    """
    # Create workspace
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "slug": "test-workspace"},
        headers=auth_headers
    )
    workspace_id = workspace_response.json()["id"]
    
    # Try to add non-existent user
    fake_user_id = "00000000-0000-0000-0000-000000000000"
    response = await client.post(
        f"/api/v1/workspaces/{workspace_id}/members",
        json={"user_id": fake_user_id, "role": "viewer"},
        headers=auth_headers
    )
    
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_add_member_already_member_conflict(client: AsyncClient, auth_headers):
    """
    P0: Adding existing member returns 409 Conflict (NOT 400 or 422)
    
    Expected: 409 Conflict
    
    CRITICAL: This must be 409, not 400/422
    """
    # Create workspace
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "slug": "test-workspace"},
        headers=auth_headers
    )
    workspace_id = workspace_response.json()["id"]
    
    # Create user2
    user2_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "user2@example.com", "username": "user2", "password": "Password123!"}
    )
    user2_id = user2_response.json()["user"]["id"]
    
    # Add user2 first time (success)
    response1 = await client.post(
        f"/api/v1/workspaces/{workspace_id}/members",
        json={"user_id": user2_id, "role": "viewer"},
        headers=auth_headers
    )
    assert response1.status_code == 201
    
    # Try to add user2 again (conflict)
    response2 = await client.post(
        f"/api/v1/workspaces/{workspace_id}/members",
        json={"user_id": user2_id, "role": "editor"},
        headers=auth_headers
    )
    
    # CRITICAL: Must be 409, not 400 or 422
    assert response2.status_code == 409


# ============================================================================
# B. List Members
# ============================================================================

@pytest.mark.asyncio
async def test_list_members_viewer_allowed(client: AsyncClient, auth_headers):
    """
    P0: Viewer can list workspace members
    
    Expected: 200 OK
    """
    # Create workspace
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "slug": "test-workspace"},
        headers=auth_headers
    )
    workspace_id = workspace_response.json()["id"]
    
    # Create user2 and add as viewer
    user2_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "user2@example.com", "username": "user2", "password": "Password123!"}
    )
    user2_id = user2_response.json()["user"]["id"]
    
    await client.post(
        f"/api/v1/workspaces/{workspace_id}/members",
        json={"user_id": user2_id, "role": "viewer"},
        headers=auth_headers
    )
    
    # Login as user2 (viewer)
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "user2@example.com", "password": "Password123!"}
    )
    user2_token = login_response.json()["access_token"]
    user2_headers = {"Authorization": f"Bearer {user2_token}"}
    
    # List members as viewer
    response = await client.get(
        f"/api/v1/workspaces/{workspace_id}/members",
        headers=user2_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2  # owner + viewer
    assert len(data["data"]) == 2


@pytest.mark.asyncio
async def test_list_members_non_member_forbidden(client: AsyncClient, auth_headers):
    """
    P0: Non-member cannot list workspace members
    
    Expected: 403 Forbidden
    """
    # Create workspace (owner = user1)
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "slug": "test-workspace"},
        headers=auth_headers
    )
    workspace_id = workspace_response.json()["id"]
    
    # Create user2 (not added to workspace)
    user2_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "user2@example.com", "username": "user2", "password": "Password123!"}
    )
    
    # Login as user2
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "user2@example.com", "password": "Password123!"}
    )
    user2_token = login_response.json()["access_token"]
    user2_headers = {"Authorization": f"Bearer {user2_token}"}
    
    # Try to list members as non-member
    response = await client.get(
        f"/api/v1/workspaces/{workspace_id}/members",
        headers=user2_headers
    )
    
    assert response.status_code == 403


# ============================================================================
# C. Remove Member
# ============================================================================

@pytest.mark.asyncio
async def test_remove_member_admin_success(client: AsyncClient, auth_headers):
    """
    P0: Admin can remove members
    
    Expected: 204 No Content
    """
    # Create workspace
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "slug": "test-workspace"},
        headers=auth_headers
    )
    workspace_id = workspace_response.json()["id"]
    
    # Create user2 and add as viewer
    user2_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "user2@example.com", "username": "user2", "password": "Password123!"}
    )
    user2_id = user2_response.json()["user"]["id"]
    
    await client.post(
        f"/api/v1/workspaces/{workspace_id}/members",
        json={"user_id": user2_id, "role": "viewer"},
        headers=auth_headers
    )
    
    # Remove user2
    response = await client.delete(
        f"/api/v1/workspaces/{workspace_id}/members/{user2_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_remove_member_owner_forbidden(client: AsyncClient, auth_headers, test_db: AsyncSession):
    """
    P0: Cannot remove workspace owner
    
    Expected: 403 Forbidden
    
    CRITICAL: This protects the "at least one owner" invariant
    """
    # Create workspace (owner = user1)
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "slug": "test-workspace"},
        headers=auth_headers
    )
    workspace_id = workspace_response.json()["id"]
    
    # Get owner user_id
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"}
    )
    owner_id = login_response.json()["user"]["id"]
    
    # Try to remove owner (should fail)
    response = await client.delete(
        f"/api/v1/workspaces/{workspace_id}/members/{owner_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_remove_member_non_member_404(client: AsyncClient, auth_headers):
    """
    P0: Removing non-existent member returns 404
    
    Expected: 404 Not Found
    """
    # Create workspace
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "slug": "test-workspace"},
        headers=auth_headers
    )
    workspace_id = workspace_response.json()["id"]
    
    # Try to remove non-existent member
    fake_user_id = "00000000-0000-0000-0000-000000000000"
    response = await client.delete(
        f"/api/v1/workspaces/{workspace_id}/members/{fake_user_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 404


# ============================================================================
# D. Change Role
# ============================================================================

@pytest.mark.asyncio
async def test_change_role_admin_success(client: AsyncClient, auth_headers):
    """
    P0: Admin can change member roles
    
    Expected: 200 OK
    """
    # Create workspace
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "slug": "test-workspace"},
        headers=auth_headers
    )
    workspace_id = workspace_response.json()["id"]
    
    # Create user2 and add as viewer
    user2_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "user2@example.com", "username": "user2", "password": "Password123!"}
    )
    user2_id = user2_response.json()["user"]["id"]
    
    await client.post(
        f"/api/v1/workspaces/{workspace_id}/members",
        json={"user_id": user2_id, "role": "viewer"},
        headers=auth_headers
    )
    
    # Change user2 to editor
    response = await client.patch(
        f"/api/v1/workspaces/{workspace_id}/members/{user2_id}/role",
        json={"role": "editor"},
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "editor"


@pytest.mark.asyncio
async def test_change_role_to_owner_forbidden(client: AsyncClient, auth_headers):
    """
    P0: Cannot promote member to owner role
    
    Expected: 422 Unprocessable Entity (Pydantic validation)
    
    Note: This is caught by Pydantic schema validation
    """
    # Create workspace
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "slug": "test-workspace"},
        headers=auth_headers
    )
    workspace_id = workspace_response.json()["id"]
    
    # Create user2 and add as viewer
    user2_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "user2@example.com", "username": "user2", "password": "Password123!"}
    )
    user2_id = user2_response.json()["user"]["id"]
    
    await client.post(
        f"/api/v1/workspaces/{workspace_id}/members",
        json={"user_id": user2_id, "role": "viewer"},
        headers=auth_headers
    )
    
    # Try to change user2 to owner (should fail at Pydantic validation)
    response = await client.patch(
        f"/api/v1/workspaces/{workspace_id}/members/{user2_id}/role",
        json={"role": "owner"},
        headers=auth_headers
    )
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_change_owner_role_forbidden(client: AsyncClient, auth_headers):
    """
    P0: Cannot change owner's role
    
    Expected: 403 Forbidden
    
    CRITICAL: Protects ownership integrity
    """
    # Create workspace (owner = user1)
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "slug": "test-workspace"},
        headers=auth_headers
    )
    workspace_id = workspace_response.json()["id"]
    
    # Get owner user_id
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"}
    )
    owner_id = login_response.json()["user"]["id"]
    
    # Try to change owner's role (should fail)
    response = await client.patch(
        f"/api/v1/workspaces/{workspace_id}/members/{owner_id}/role",
        json={"role": "admin"},
        headers=auth_headers
    )
    
    assert response.status_code == 403


# ============================================================================
# E. Transfer Ownership (CRITICAL)
# ============================================================================

@pytest.mark.asyncio
async def test_transfer_ownership_success(client: AsyncClient, auth_headers, test_db: AsyncSession):
    """
    P0: Owner can transfer ownership
    
    Expected: 204 No Content
    
    CRITICAL: Verify ALL 4 invariants:
    1. Old owner is demoted
    2. New owner exists exactly once
    3. workspace.owner_id is updated
    4. No second owner remains
    """
    # Create workspace (owner = user1)
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "slug": "test-workspace"},
        headers=auth_headers
    )
    workspace_id = workspace_response.json()["id"]
    
    # Create user2 and add as editor
    user2_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "user2@example.com", "username": "user2", "password": "Password123!"}
    )
    user2_id = user2_response.json()["user"]["id"]
    
    await client.post(
        f"/api/v1/workspaces/{workspace_id}/members",
        json={"user_id": user2_id, "role": "editor"},
        headers=auth_headers
    )
    
    # Get user1 (current owner) id
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"}
    )
    user1_id = login_response.json()["user"]["id"]
    
    # Transfer ownership to user2
    response = await client.post(
        f"/api/v1/workspaces/{workspace_id}/transfer-ownership",
        json={"new_owner_id": user2_id, "demote_current_owner_to": "admin"},
        headers=auth_headers
    )
    
    assert response.status_code == 204
    
    # ========================================
    # CRITICAL INVARIANT CHECKS
    # ========================================
    
    # 1. Verify exactly ONE owner exists
    owner_count_result = await test_db.execute(
        select(func.count())
        .select_from(WorkspaceMember)
        .where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.role == WorkspaceRole.OWNER,
            WorkspaceMember.status == "active"
        )
    )
    owner_count = owner_count_result.scalar()
    assert owner_count == 1, f"Expected exactly 1 owner, found {owner_count}"
    
    # 2. Verify new owner is user2
    new_owner_result = await test_db.execute(
        select(WorkspaceMember)
        .where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user2_id,
            WorkspaceMember.status == "active"
        )
    )
    new_owner = new_owner_result.scalar_one()
    assert new_owner.role == WorkspaceRole.OWNER, "New owner role mismatch"
    
    # 3. Verify old owner (user1) is demoted to admin
    old_owner_result = await test_db.execute(
        select(WorkspaceMember)
        .where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user1_id,
            WorkspaceMember.status == "active"
        )
    )
    old_owner = old_owner_result.scalar_one()
    assert old_owner.role == WorkspaceRole.ADMIN, "Old owner not demoted"
    
    # 4. Verify workspace.owner_id is updated
    workspace_result = await test_db.execute(
        select(Workspace).where(Workspace.id == workspace_id)
    )
    workspace = workspace_result.scalar_one()
    assert str(workspace.owner_id) == user2_id, "workspace.owner_id not updated"


@pytest.mark.asyncio
async def test_transfer_ownership_not_owner_forbidden(client: AsyncClient, auth_headers):
    """
    P0: Non-owner cannot transfer ownership
    
    Expected: 403 Forbidden
    """
    # Create workspace (owner = user1)
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "slug": "test-workspace"},
        headers=auth_headers
    )
    workspace_id = workspace_response.json()["id"]
    
    # Create user2 and add as admin
    user2_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "user2@example.com", "username": "user2", "password": "Password123!"}
    )
    user2_id = user2_response.json()["user"]["id"]
    
    await client.post(
        f"/api/v1/workspaces/{workspace_id}/members",
        json={"user_id": user2_id, "role": "admin"},
        headers=auth_headers
    )
    
    # Create user3
    user3_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "user3@example.com", "username": "user3", "password": "Password123!"}
    )
    user3_id = user3_response.json()["user"]["id"]
    
    # Login as user2 (admin, not owner)
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "user2@example.com", "password": "Password123!"}
    )
    user2_token = login_response.json()["access_token"]
    user2_headers = {"Authorization": f"Bearer {user2_token}"}
    
    # Try to transfer ownership as admin (should fail)
    response = await client.post(
        f"/api/v1/workspaces/{workspace_id}/transfer-ownership",
        json={"new_owner_id": user3_id},
        headers=user2_headers
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_transfer_ownership_new_owner_not_found(client: AsyncClient, auth_headers):
    """
    P0: Transferring to non-existent user returns 404
    
    Expected: 404 Not Found
    """
    # Create workspace
    workspace_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "slug": "test-workspace"},
        headers=auth_headers
    )
    workspace_id = workspace_response.json()["id"]
    
    # Try to transfer to non-existent user
    fake_user_id = "00000000-0000-0000-0000-000000000000"
    response = await client.post(
        f"/api/v1/workspaces/{workspace_id}/transfer-ownership",
        json={"new_owner_id": fake_user_id},
        headers=auth_headers
    )
    
    assert response.status_code == 404


# ============================================================================
# F. User Workspaces
# ============================================================================

@pytest.mark.asyncio
async def test_get_user_workspaces_lists_only_memberships(client: AsyncClient, auth_headers):
    """
    P0: User sees only workspaces they're a member of
    
    Expected: 200 OK with correct list
    """
    # Create workspace1 (owner = user1)
    workspace1_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Workspace 1", "slug": "workspace-1"},
        headers=auth_headers
    )
    workspace1_id = workspace1_response.json()["id"]
    
    # Create user2
    user2_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "user2@example.com", "username": "user2", "password": "Password123!"}
    )
    user2_id = user2_response.json()["user"]["id"]
    
    # Login as user2
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "user2@example.com", "password": "Password123!"}
    )
    user2_token = login_response.json()["access_token"]
    user2_headers = {"Authorization": f"Bearer {user2_token}"}
    
    # Create workspace2 (owner = user2)
    workspace2_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Workspace 2", "slug": "workspace-2"},
        headers=user2_headers
    )
    workspace2_id = workspace2_response.json()["id"]
    
    # Add user2 to workspace1 as viewer
    await client.post(
        f"/api/v1/workspaces/{workspace1_id}/members",
        json={"user_id": user2_id, "role": "viewer"},
        headers=auth_headers
    )
    
    # Get user2's workspaces
    response = await client.get(
        "/api/v1/users/me/workspaces",
        headers=user2_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2  # workspace1 (viewer) + workspace2 (owner)
    
    # Verify user2 is in both workspaces with correct roles
    workspace_ids = {w["id"] for w in data["data"]}
    assert workspace1_id in workspace_ids
    assert workspace2_id in workspace_ids
    
    # Verify roles
    for workspace in data["data"]:
        if workspace["id"] == workspace1_id:
            assert workspace["role"] == "viewer"
        elif workspace["id"] == workspace2_id:
            assert workspace["role"] == "owner"


@pytest.mark.asyncio
async def test_deleted_workspace_not_returned(client: AsyncClient, auth_headers, test_db: AsyncSession):
    """
    P0: Deleted workspaces are not returned in user's workspace list
    
    Expected: 200 OK with only active workspaces
    """
    # Create workspace1
    workspace1_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Workspace 1", "slug": "workspace-1"},
        headers=auth_headers
    )
    workspace1_id = workspace1_response.json()["id"]
    
    # Create workspace2
    workspace2_response = await client.post(
        "/api/v1/workspaces",
        json={"name": "Workspace 2", "slug": "workspace-2"},
        headers=auth_headers
    )
    workspace2_id = workspace2_response.json()["id"]
    
    # Soft delete workspace1
    workspace_result = await test_db.execute(
        select(Workspace).where(Workspace.id == workspace1_id)
    )
    workspace1 = workspace_result.scalar_one()
    workspace1.is_deleted = True
    await test_db.commit()
    
    # Get user's workspaces
    response = await client.get(
        "/api/v1/users/me/workspaces",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Should only see workspace2 (workspace1 is deleted)
    workspace_ids = {w["id"] for w in data["data"]}
    assert workspace2_id in workspace_ids
    assert workspace1_id not in workspace_ids

