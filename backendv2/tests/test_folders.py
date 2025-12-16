"""
Folder CRUD Tests
=================

Comprehensive tests for folder endpoints.
Based on API_CONTRACTS.md Section 5.

Test Coverage:
- Create folder (6 tests)
- List folders (4 tests)
- Get folder tree (3 tests)
- Update folder (4 tests)
- Move folder (5 tests)
- Delete folder (4 tests)
- API contract validation (1 test)

Total: 27 tests
"""

import pytest
from httpx import AsyncClient
from app.models.workspace import Workspace
from app.models.folder import Folder
from app.models.user import User


# =========================================
# Create Folder Tests
# =========================================

@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_create_folder_success(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace
):
    """
    Test POST /api/v1/folders (success)
    
    Contract: API_CONTRACTS.md 5.1
    - Returns 201 with folder data
    - All fields populated correctly
    """
    folder_data = {
        "name": "Work Projects",
        "icon": "📁",
        "color": "#3b82f6",
        "position": 0
    }
    
    response = await client.post(
        f"/api/v1/folders?workspace_id={test_workspace.id}",
        json=folder_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Work Projects"
    assert data["icon"] == "📁"
    assert data["color"] == "#3b82f6"
    assert data["workspace_id"] == str(test_workspace.id)
    assert data["parent_id"] is None
    assert data["position"] == 0
    assert "id" in data
    assert "created_at" in data


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_create_folder_minimal(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace
):
    """
    Test POST /api/v1/folders (minimal data)
    
    Contract: API_CONTRACTS.md 5.1
    - Only name required
    - Defaults applied
    """
    folder_data = {"name": "Minimal Folder"}
    
    response = await client.post(
        f"/api/v1/folders?workspace_id={test_workspace.id}",
        json=folder_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Minimal Folder"
    assert data["icon"] == "📁"  # Default
    assert data["position"] == 0  # Default


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_create_folder_with_parent(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace,
    test_folder: Folder
):
    """
    Test POST /api/v1/folders (with parent)
    
    Contract: API_CONTRACTS.md 5.1
    - Can create nested folder
    """
    folder_data = {
        "name": "Subfolder",
        "parent_id": str(test_folder.id)
    }
    
    response = await client.post(
        f"/api/v1/folders?workspace_id={test_workspace.id}",
        json=folder_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Subfolder"
    assert data["parent_id"] == str(test_folder.id)


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_create_folder_validation_errors(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace
):
    """
    Test POST /api/v1/folders (validation errors)
    
    Contract: API_CONTRACTS.md 5.1
    - Name required
    - Color must be hex
    """
    # Missing name
    response = await client.post(
        f"/api/v1/folders?workspace_id={test_workspace.id}",
        json={},
        headers=auth_headers
    )
    assert response.status_code == 422
    
    # Invalid color
    response = await client.post(
        f"/api/v1/folders?workspace_id={test_workspace.id}",
        json={"name": "Test", "color": "blue"},
        headers=auth_headers
    )
    assert response.status_code == 422


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_create_folder_parent_not_found(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace
):
    """
    Test POST /api/v1/folders (parent not found)
    
    Contract: API_CONTRACTS.md 5.1
    - Error: 404 if parent folder not found
    """
    folder_data = {
        "name": "Test Folder",
        "parent_id": "00000000-0000-0000-0000-000000000000"
    }
    
    response = await client.post(
        f"/api/v1/folders?workspace_id={test_workspace.id}",
        json=folder_data,
        headers=auth_headers
    )
    
    assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_create_folder_unauthorized(
    client: AsyncClient,
    test_workspace: Workspace
):
    """
    Test POST /api/v1/folders (unauthorized)
    
    Contract: API_CONTRACTS.md 5.1
    - Error: 401/403 if not authenticated
    """
    folder_data = {"name": "Test Folder"}
    
    response = await client.post(
        f"/api/v1/folders?workspace_id={test_workspace.id}",
        json=folder_data
    )
    
    assert response.status_code in [401, 403]


# =========================================
# List Folders Tests
# =========================================

@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_list_folders_success(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace,
    test_folder: Folder
):
    """
    Test GET /api/v1/folders/workspace/{workspace_id}
    
    Contract: API_CONTRACTS.md 5.2
    - Returns list of folders
    - Includes document count
    """
    response = await client.get(
        f"/api/v1/folders/workspace/{test_workspace.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) >= 1
    
    # Check first folder
    folder = data["items"][0]
    assert "id" in folder
    assert "name" in folder
    assert "document_count" in folder


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_list_folders_filter_by_parent(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace,
    test_folder: Folder
):
    """
    Test GET /api/v1/folders/workspace/{workspace_id} (filter by parent)
    
    Contract: API_CONTRACTS.md 5.2
    - Can filter by parent_id
    """
    # Create subfolder
    subfolder_data = {
        "name": "Subfolder",
        "parent_id": str(test_folder.id)
    }
    await client.post(
        f"/api/v1/folders?workspace_id={test_workspace.id}",
        json=subfolder_data,
        headers=auth_headers
    )
    
    # List subfolders
    response = await client.get(
        f"/api/v1/folders/workspace/{test_workspace.id}?parent_id={test_folder.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) >= 1
    assert all(f["parent_id"] == str(test_folder.id) for f in data["items"])


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_list_folders_empty(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace_2: Workspace
):
    """
    Test GET /api/v1/folders/workspace/{workspace_id} (empty)
    
    Contract: API_CONTRACTS.md 5.2
    - Returns empty list if no folders
    """
    response = await client.get(
        f"/api/v1/folders/workspace/{test_workspace_2.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_list_folders_workspace_not_found(
    client: AsyncClient,
    auth_headers: dict
):
    """
    Test GET /api/v1/folders/workspace/{workspace_id} (not found)
    
    Contract: API_CONTRACTS.md 5.2
    - Error: 404 if workspace not found
    """
    response = await client.get(
        "/api/v1/folders/workspace/00000000-0000-0000-0000-000000000000",
        headers=auth_headers
    )
    
    assert response.status_code == 404


# =========================================
# Get Folder Tree Tests
# =========================================

@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_get_folder_tree_success(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace,
    test_folder: Folder
):
    """
    Test GET /api/v1/folders/tree
    
    Contract: API_CONTRACTS.md 5.3
    - Returns hierarchical tree
    - Children populated
    """
    # Create subfolder
    subfolder_data = {
        "name": "Subfolder",
        "parent_id": str(test_folder.id)
    }
    await client.post(
        f"/api/v1/folders?workspace_id={test_workspace.id}",
        json=subfolder_data,
        headers=auth_headers
    )
    
    response = await client.get(
        f"/api/v1/folders/tree?workspace_id={test_workspace.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "folders" in data
    assert len(data["folders"]) >= 1
    
    # Check tree structure
    root_folder = data["folders"][0]
    assert "children" in root_folder
    assert isinstance(root_folder["children"], list)


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_get_folder_tree_empty(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace_2: Workspace
):
    """
    Test GET /api/v1/folders/tree (empty)
    
    Contract: API_CONTRACTS.md 5.3
    - Returns empty list if no folders
    """
    response = await client.get(
        f"/api/v1/folders/tree?workspace_id={test_workspace_2.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["folders"] == []


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_get_folder_tree_workspace_not_found(
    client: AsyncClient,
    auth_headers: dict
):
    """
    Test GET /api/v1/folders/tree (not found)
    
    Contract: API_CONTRACTS.md 5.3
    - Error: 404 if workspace not found
    """
    response = await client.get(
        "/api/v1/folders/tree?workspace_id=00000000-0000-0000-0000-000000000000",
        headers=auth_headers
    )
    
    assert response.status_code == 404


# =========================================
# Update Folder Tests
# =========================================

@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_update_folder_success(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace,
    test_folder: Folder
):
    """
    Test PATCH /api/v1/folders/{folder_id}
    
    Contract: API_CONTRACTS.md 5.4
    - Can update name, icon, color
    - Returns updated folder
    """
    update_data = {
        "name": "Updated Folder",
        "icon": "🚀",
        "color": "#10b981"
    }
    
    response = await client.patch(
        f"/api/v1/folders/{test_folder.id}?workspace_id={test_workspace.id}",
        json=update_data,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Folder"
    assert data["icon"] == "🚀"
    assert data["color"] == "#10b981"


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_update_folder_partial(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace,
    test_folder: Folder
):
    """
    Test PATCH /api/v1/folders/{folder_id} (partial update)
    
    Contract: API_CONTRACTS.md 5.4
    - All fields optional
    """
    update_data = {"name": "Only Name Updated"}
    
    response = await client.patch(
        f"/api/v1/folders/{test_folder.id}?workspace_id={test_workspace.id}",
        json=update_data,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Only Name Updated"


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_update_folder_not_found(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace
):
    """
    Test PATCH /api/v1/folders/{folder_id} (not found)
    
    Contract: API_CONTRACTS.md 5.4
    - Error: 404 if folder not found
    """
    update_data = {"name": "Updated"}
    
    response = await client.patch(
        f"/api/v1/folders/00000000-0000-0000-0000-000000000000?workspace_id={test_workspace.id}",
        json=update_data,
        headers=auth_headers
    )
    
    assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_update_folder_unauthorized(
    client: AsyncClient,
    test_workspace: Workspace,
    test_folder: Folder
):
    """
    Test PATCH /api/v1/folders/{folder_id} (unauthorized)
    
    Contract: API_CONTRACTS.md 5.4
    - Error: 401/403 if not authenticated
    """
    update_data = {"name": "Hacked"}
    
    response = await client.patch(
        f"/api/v1/folders/{test_folder.id}?workspace_id={test_workspace.id}",
        json=update_data
    )
    
    assert response.status_code in [401, 403]


# =========================================
# Move Folder Tests
# =========================================

@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_move_folder_success(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace,
    test_folder: Folder
):
    """
    Test PATCH /api/v1/folders/{folder_id}/move
    
    Contract: API_CONTRACTS.md 5.5
    - Can move folder to new parent
    - Can change position
    """
    # Create target parent
    parent_data = {"name": "Parent Folder"}
    parent_response = await client.post(
        f"/api/v1/folders?workspace_id={test_workspace.id}",
        json=parent_data,
        headers=auth_headers
    )
    parent_id = parent_response.json()["id"]
    
    # Move folder
    move_data = {
        "parent_id": parent_id,
        "position": 2
    }
    
    response = await client.patch(
        f"/api/v1/folders/{test_folder.id}/move?workspace_id={test_workspace.id}",
        json=move_data,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["parent_id"] == parent_id
    assert data["position"] == 2


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_move_folder_to_root(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace,
    test_folder: Folder
):
    """
    Test PATCH /api/v1/folders/{folder_id}/move (to root)
    
    Contract: API_CONTRACTS.md 5.5
    - Can move folder to root (parent_id = null)
    """
    move_data = {
        "parent_id": None,
        "position": 0
    }
    
    response = await client.patch(
        f"/api/v1/folders/{test_folder.id}/move?workspace_id={test_workspace.id}",
        json=move_data,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["parent_id"] is None


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_move_folder_circular_reference(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace,
    test_folder: Folder
):
    """
    Test PATCH /api/v1/folders/{folder_id}/move (circular reference)
    
    Contract: API_CONTRACTS.md 5.5
    - Error: 400 if circular reference
    """
    # Try to move folder into itself
    move_data = {
        "parent_id": str(test_folder.id),
        "position": 0
    }
    
    response = await client.patch(
        f"/api/v1/folders/{test_folder.id}/move?workspace_id={test_workspace.id}",
        json=move_data,
        headers=auth_headers
    )
    
    assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_move_folder_parent_not_found(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace,
    test_folder: Folder
):
    """
    Test PATCH /api/v1/folders/{folder_id}/move (parent not found)
    
    Contract: API_CONTRACTS.md 5.5
    - Error: 404 if parent not found
    """
    move_data = {
        "parent_id": "00000000-0000-0000-0000-000000000000",
        "position": 0
    }
    
    response = await client.patch(
        f"/api/v1/folders/{test_folder.id}/move?workspace_id={test_workspace.id}",
        json=move_data,
        headers=auth_headers
    )
    
    assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_move_folder_not_found(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace
):
    """
    Test PATCH /api/v1/folders/{folder_id}/move (folder not found)
    
    Contract: API_CONTRACTS.md 5.5
    - Error: 404 if folder not found
    """
    move_data = {
        "parent_id": None,
        "position": 0
    }
    
    response = await client.patch(
        f"/api/v1/folders/00000000-0000-0000-0000-000000000000/move?workspace_id={test_workspace.id}",
        json=move_data,
        headers=auth_headers
    )
    
    assert response.status_code == 404


# =========================================
# Delete Folder Tests
# =========================================

@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_delete_folder_success(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace,
    test_folder: Folder
):
    """
    Test DELETE /api/v1/folders/{folder_id}
    
    Contract: API_CONTRACTS.md 5.6
    - Returns 204 No Content
    - Soft delete
    """
    response = await client.delete(
        f"/api/v1/folders/{test_folder.id}?workspace_id={test_workspace.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 204


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_delete_folder_with_cascade(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace,
    test_folder: Folder,
    test_document: any
):
    """
    Test DELETE /api/v1/folders/{folder_id} (with cascade)
    
    Contract: API_CONTRACTS.md 5.6
    - Can delete folder with documents if cascade=true
    """
    response = await client.delete(
        f"/api/v1/folders/{test_folder.id}?workspace_id={test_workspace.id}&cascade=true",
        headers=auth_headers
    )
    
    assert response.status_code == 204


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_delete_folder_not_empty(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace
):
    """
    Test DELETE /api/v1/folders/{folder_id} (not empty)
    
    Contract: API_CONTRACTS.md 5.6
    - Error: 400 if folder has documents and cascade=false
    """
    # Create folder with document
    folder_response = await client.post(
        f"/api/v1/folders?workspace_id={test_workspace.id}",
        json={"name": "Folder with Doc"},
        headers=auth_headers
    )
    folder_id = folder_response.json()["id"]
    
    # Create document in folder
    doc_data = {
        "title": "Test Doc",
        "folder_id": folder_id
    }
    await client.post(
        f"/api/v1/documents?workspace_id={test_workspace.id}",
        json=doc_data,
        headers=auth_headers
    )
    
    # Try to delete without cascade
    response = await client.delete(
        f"/api/v1/folders/{folder_id}?workspace_id={test_workspace.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_delete_folder_not_found(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace
):
    """
    Test DELETE /api/v1/folders/{folder_id} (not found)
    
    Contract: API_CONTRACTS.md 5.6
    - Error: 404 if folder not found
    """
    response = await client.delete(
        f"/api/v1/folders/00000000-0000-0000-0000-000000000000?workspace_id={test_workspace.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 404


# =========================================
# API Contract Validation
# =========================================

@pytest.mark.integration
@pytest.mark.folder
@pytest.mark.asyncio
async def test_folder_response_schema(
    client: AsyncClient,
    auth_headers: dict,
    test_workspace: Workspace
):
    """
    Test folder response schema matches API contract
    
    Contract: API_CONTRACTS.md 5.1
    - All required fields present
    - Correct data types
    """
    folder_data = {
        "name": "Schema Test",
        "icon": "📁",
        "color": "#3b82f6"
    }
    
    response = await client.post(
        f"/api/v1/folders?workspace_id={test_workspace.id}",
        json=folder_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    
    # Required fields
    required_fields = [
        "id", "workspace_id", "name", "icon", "color",
        "parent_id", "position", "created_by_id",
        "created_at", "updated_at"
    ]
    for field in required_fields:
        assert field in data, f"Missing required field: {field}"
    
    # Data types
    assert isinstance(data["id"], str)
    assert isinstance(data["name"], str)
    assert isinstance(data["position"], int)
