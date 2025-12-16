"""
Workspace API Tests
====================

Comprehensive tests for workspace endpoints.
Based on API_CONTRACTS.md Section 3.

Test Coverage:
- Create workspace (happy path + validation + errors)
- List workspaces (pagination + filtering)
- Get workspace (access control)
- Update workspace (permissions + validation)
- Delete workspace (cascade + permissions)
- Slug generation and uniqueness
- Permission checks
- Error responses
- API contract validation
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.workspace import Workspace


# =========================================
# Create Workspace Tests
# =========================================

@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.asyncio
async def test_create_workspace_success(
    client: AsyncClient,
    auth_headers: dict,
    test_user: User
):
    """
    Test POST /api/v1/workspaces (happy path)
    
    Contract: API_CONTRACTS.md 3.1
    - Request: name, slug, description, icon, is_public
    - Response: 201 Created with workspace object
    """
    workspace_data = {
        "name": "My Workspace",
        "slug": "my-workspace",
        "description": "Personal workspace",
        "icon": "📁",
        "is_public": False
    }
    
    response = await client.post(
        "/api/v1/workspaces",
        json=workspace_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    
    # Validate response structure
    assert "id" in data
    assert data["name"] == workspace_data["name"]
    assert data["slug"] == workspace_data["slug"]
    assert data["description"] == workspace_data["description"]
    assert data["icon"] == workspace_data["icon"]
    assert data["is_public"] == workspace_data["is_public"]
    assert data["owner_id"] == str(test_user.id)
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.asyncio
async def test_create_workspace_auto_slug(
    client: AsyncClient,
    auth_headers: dict
):
    """
    Test POST /api/v1/workspaces with auto-generated slug
    
    Contract: API_CONTRACTS.md 3.1
    - Slug is auto-generated from name if not provided
    """
    workspace_data = {
        "name": "My Awesome Workspace",
        "description": "Slug should be auto-generated"
    }
    
    response = await client.post(
        "/api/v1/workspaces",
        json=workspace_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    
    assert data["slug"] == "my-awesome-workspace"


@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.asyncio
async def test_create_workspace_duplicate_slug(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace
):
    """
    Test POST /api/v1/workspaces with duplicate slug
    
    Contract: API_CONTRACTS.md 3.1
    - Error: 409 Conflict if slug already exists for this owner
    """
    workspace_data = {
        "name": "Another Workspace",
        "slug": test_workspace.slug  # Duplicate slug
    }
    
    response = await client.post(
        "/api/v1/workspaces",
        json=workspace_data,
        headers=auth_headers
    )
    
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()


@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.validation
@pytest.mark.asyncio
async def test_create_workspace_validation_errors(
    client: AsyncClient,
    auth_headers: dict
):
    """
    Test POST /api/v1/workspaces with invalid data
    
    Contract: API_CONTRACTS.md 3.1
    - Validation: name required, 1-100 chars
    - Validation: description max 500 chars
    """
    # Empty name
    response = await client.post(
        "/api/v1/workspaces",
        json={"name": ""},
        headers=auth_headers
    )
    assert response.status_code == 422
    
    # Name too long
    response = await client.post(
        "/api/v1/workspaces",
        json={"name": "x" * 101},
        headers=auth_headers
    )
    assert response.status_code == 422
    
    # Description too long
    response = await client.post(
        "/api/v1/workspaces",
        json={
            "name": "Valid Name",
            "description": "x" * 501
        },
        headers=auth_headers
    )
    assert response.status_code == 422


@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.auth
@pytest.mark.asyncio
async def test_create_workspace_unauthorized(client: AsyncClient):
    """
    Test POST /api/v1/workspaces without authentication
    
    Contract: API_CONTRACTS.md 3.1
    - Error: 401/403 Unauthorized if not authenticated
    """
    workspace_data = {"name": "Test Workspace"}
    
    response = await client.post(
        "/api/v1/workspaces",
        json=workspace_data
    )
    
    # FastAPI returns 403 when auth dependency fails
    assert response.status_code in [401, 403]


# =========================================
# List Workspaces Tests
# =========================================

@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.asyncio
async def test_list_workspaces_success(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace,
    test_workspace_2: Workspace
):
    """
    Test GET /api/v1/workspaces (happy path)
    
    Contract: API_CONTRACTS.md 3.2
    - Response: 200 OK with paginated list
    """
    response = await client.get(
        "/api/v1/workspaces",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Validate response structure
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "has_more" in data
    
    # Should have 2 workspaces
    assert data["total"] >= 2
    assert len(data["items"]) >= 2
    
    # Validate item structure
    item = data["items"][0]
    assert "id" in item
    assert "name" in item
    assert "slug" in item
    assert "owner_id" in item
    assert "document_count" in item
    assert "member_count" in item


@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.asyncio
async def test_list_workspaces_pagination(
    client: AsyncClient,
    auth_headers: dict,
    test_db: AsyncSession,
    test_user: User
):
    """
    Test GET /api/v1/workspaces with pagination
    
    Contract: API_CONTRACTS.md 3.2
    - Query params: page, page_size
    """
    # Create 5 workspaces
    for i in range(5):
        workspace = Workspace(
            name=f"Workspace {i}",
            slug=f"workspace-{i}",
            owner_id=test_user.id,
            is_deleted=False,
            version=1
        )
        test_db.add(workspace)
    await test_db.commit()
    
    # Get page 1 (2 items)
    response = await client.get(
        "/api/v1/workspaces?page=1&page_size=2",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["total"] == 5
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert len(data["items"]) == 2
    assert data["has_more"] is True
    
    # Get page 2
    response = await client.get(
        "/api/v1/workspaces?page=2&page_size=2",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["page"] == 2
    assert len(data["items"]) == 2


@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.asyncio
async def test_list_workspaces_empty(
    client: AsyncClient,
    auth_headers: dict
):
    """
    Test GET /api/v1/workspaces with no workspaces
    
    Contract: API_CONTRACTS.md 3.2
    - Should return empty list, not error
    """
    response = await client.get(
        "/api/v1/workspaces",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["total"] == 0
    assert len(data["items"]) == 0


# =========================================
# Get Workspace Tests
# =========================================

@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.asyncio
async def test_get_workspace_success(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace
):
    """
    Test GET /api/v1/workspaces/{workspace_id} (happy path)
    
    Contract: API_CONTRACTS.md 3.3
    - Response: 200 OK with workspace details + owner + stats
    """
    response = await client.get(
        f"/api/v1/workspaces/{test_workspace.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Validate response structure
    assert data["id"] == str(test_workspace.id)
    assert data["name"] == test_workspace.name
    assert data["slug"] == test_workspace.slug
    
    # Validate owner
    assert "owner" in data
    assert "id" in data["owner"]
    assert "username" in data["owner"]
    
    # Validate stats
    assert "stats" in data
    assert "document_count" in data["stats"]
    assert "folder_count" in data["stats"]
    assert "member_count" in data["stats"]
    assert "storage_used_bytes" in data["stats"]


@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.permissions
@pytest.mark.asyncio
async def test_get_workspace_not_found(
    client: AsyncClient,
    auth_headers: dict
):
    """
    Test GET /api/v1/workspaces/{workspace_id} with invalid ID
    
    Contract: API_CONTRACTS.md 3.3
    - Error: 404 Not Found
    """
    fake_id = "00000000-0000-0000-0000-000000000000"
    
    response = await client.get(
        f"/api/v1/workspaces/{fake_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.permissions
@pytest.mark.asyncio
async def test_get_workspace_no_access(
    client: AsyncClient,
    auth_headers: dict,
    public_workspace: Workspace,
    test_user_2: User
):
    """
    Test GET /api/v1/workspaces/{workspace_id} without access
    
    Contract: API_CONTRACTS.md 3.3
    - Error: 403 Forbidden if not owner and not public
    """
    # Make workspace private
    public_workspace.is_public = False
    
    response = await client.get(
        f"/api/v1/workspaces/{public_workspace.id}",
        headers=auth_headers  # Different user
    )
    
    assert response.status_code == 404  # Returns 404 for security


@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.asyncio
async def test_get_public_workspace(
    client: AsyncClient,
    auth_headers: dict,
    public_workspace: Workspace
):
    """
    Test GET /api/v1/workspaces/{workspace_id} for public workspace
    
    Contract: API_CONTRACTS.md 3.3
    - Should allow access to public workspaces
    """
    response = await client.get(
        f"/api/v1/workspaces/{public_workspace.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["is_public"] is True


# =========================================
# Update Workspace Tests
# =========================================

@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.asyncio
async def test_update_workspace_success(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace
):
    """
    Test PATCH /api/v1/workspaces/{workspace_id} (happy path)
    
    Contract: API_CONTRACTS.md 3.4
    - Request: All fields optional
    - Response: 200 OK with updated workspace
    """
    update_data = {
        "name": "Updated Name",
        "description": "Updated description",
        "icon": "🚀"
    }
    
    response = await client.patch(
        f"/api/v1/workspaces/{test_workspace.id}",
        json=update_data,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["name"] == update_data["name"]
    assert data["description"] == update_data["description"]
    assert data["icon"] == update_data["icon"]
    assert data["slug"] == test_workspace.slug  # Slug unchanged


@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.permissions
@pytest.mark.asyncio
async def test_update_workspace_not_owner(
    client: AsyncClient,
    auth_headers_2: dict,
    test_workspace: Workspace
):
    """
    Test PATCH /api/v1/workspaces/{workspace_id} by non-owner
    
    Contract: API_CONTRACTS.md 3.4
    - Error: 403 Forbidden if not owner
    """
    update_data = {"name": "Hacked Name"}
    
    response = await client.patch(
        f"/api/v1/workspaces/{test_workspace.id}",
        json=update_data,
        headers=auth_headers_2  # Different user
    )
    
    assert response.status_code == 403


# =========================================
# Delete Workspace Tests
# =========================================

@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.asyncio
async def test_delete_workspace_success(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace
):
    """
    Test DELETE /api/v1/workspaces/{workspace_id} (happy path)
    
    Contract: API_CONTRACTS.md 3.5
    - Response: 204 No Content
    """
    response = await client.delete(
        f"/api/v1/workspaces/{test_workspace.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 204
    
    # Verify workspace is soft-deleted
    response = await client.get(
        f"/api/v1/workspaces/{test_workspace.id}",
        headers=auth_headers
    )
    assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.permissions
@pytest.mark.asyncio
async def test_delete_workspace_not_owner(
    client: AsyncClient,
    auth_headers_2: dict,
    test_workspace: Workspace
):
    """
    Test DELETE /api/v1/workspaces/{workspace_id} by non-owner
    
    Contract: API_CONTRACTS.md 3.5
    - Error: 403 Forbidden if not owner
    """
    response = await client.delete(
        f"/api/v1/workspaces/{test_workspace.id}",
        headers=auth_headers_2  # Different user
    )
    
    assert response.status_code == 403


# =========================================
# Contract Validation Tests
# =========================================

@pytest.mark.integration
@pytest.mark.workspace
@pytest.mark.contract
@pytest.mark.asyncio
async def test_workspace_response_schema(
    client: AsyncClient,
    auth_headers: dict
):
    """
    Test workspace response matches API contract
    
    Contract: API_CONTRACTS.md 3.1
    - All required fields present
    - Correct types
    - Valid formats (UUID, ISO timestamp)
    """
    workspace_data = {"name": "Schema Test"}
    
    response = await client.post(
        "/api/v1/workspaces",
        json=workspace_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    
    # Required fields
    required_fields = [
        "id", "name", "slug", "is_public",
        "owner_id", "created_at", "updated_at"
    ]
    for field in required_fields:
        assert field in data, f"Missing required field: {field}"
    
    # UUID format
    import uuid
    uuid.UUID(data["id"])
    uuid.UUID(data["owner_id"])
    
    # ISO timestamp format
    from datetime import datetime
    datetime.fromisoformat(data["created_at"].replace('Z', '+00:00'))
    datetime.fromisoformat(data["updated_at"].replace('Z', '+00:00'))
