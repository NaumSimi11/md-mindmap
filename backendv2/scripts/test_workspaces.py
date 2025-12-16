"""
Test Workspace Endpoints
==========================

Manual tests for workspace CRUD operations.
Based on API_CONTRACTS.md Section 3.

Tests:
1. Create workspace
2. List workspaces
3. Get workspace
4. Update workspace
5. Delete workspace (with and without cascade)
6. Slug generation
7. Permission checks
"""

import asyncio
import httpx
from datetime import datetime

BASE_URL = "http://localhost:7001"
API_URL = f"{BASE_URL}/api/v1"


async def setup_test_user():
    """Create a test user and return access token"""
    print("\n" + "="*60)
    print("SETUP: Creating test user")
    print("="*60)
    
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    email = f"workspace_test_{timestamp}@example.com"
    username = f"wstest{timestamp}"
    
    user_data = {
        "email": email,
        "username": username,
        "password": "SecurePass123!",
        "full_name": "Workspace Test User"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_URL}/auth/register",
            json=user_data
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Test user created: {email}")
            print(f"   Access token: {data['access_token'][:50]}...")
            return data["access_token"]
        else:
            print(f"❌ Failed to create test user: {response.text}")
            raise AssertionError("Setup failed")


async def test_create_workspace(token: str):
    """Test POST /api/v1/workspaces"""
    print("\n" + "="*60)
    print("TEST 1: Create Workspace")
    print("="*60)
    
    workspace_data = {
        "name": "Test Workspace",
        "slug": "test-workspace",
        "description": "A test workspace",
        "icon": "📁",
        "is_public": False
    }
    
    print(f"Creating workspace: {workspace_data['name']}")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_URL}/workspaces",
            json=workspace_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Workspace created")
            print(f"   ID: {data['id']}")
            print(f"   Name: {data['name']}")
            print(f"   Slug: {data['slug']}")
            print(f"   Icon: {data['icon']}")
            print(f"   Owner ID: {data['owner_id']}")
            
            assert data["name"] == workspace_data["name"]
            assert data["slug"] == workspace_data["slug"]
            assert data["is_public"] == False
            
            return data["id"]
        else:
            print(f"❌ Error: {response.text}")
            raise AssertionError(f"Create workspace failed: {response.status_code}")


async def test_create_workspace_auto_slug(token: str):
    """Test POST /api/v1/workspaces with auto-generated slug"""
    print("\n" + "="*60)
    print("TEST 2: Create Workspace (Auto Slug)")
    print("="*60)
    
    workspace_data = {
        "name": "My Awesome Workspace",
        "description": "Slug should be auto-generated",
        "icon": "🚀"
    }
    
    print(f"Creating workspace without slug: {workspace_data['name']}")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_URL}/workspaces",
            json=workspace_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Workspace created with auto-slug")
            print(f"   ID: {data['id']}")
            print(f"   Name: {data['name']}")
            print(f"   Slug: {data['slug']} (auto-generated)")
            
            assert data["slug"] == "my-awesome-workspace"
            
            return data["id"]
        else:
            print(f"❌ Error: {response.text}")
            raise AssertionError(f"Create workspace failed: {response.status_code}")


async def test_list_workspaces(token: str):
    """Test GET /api/v1/workspaces"""
    print("\n" + "="*60)
    print("TEST 3: List Workspaces")
    print("="*60)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{API_URL}/workspaces",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Workspaces listed")
            print(f"   Total: {data['total']}")
            print(f"   Page: {data['page']}")
            print(f"   Page Size: {data['page_size']}")
            print(f"   Has More: {data['has_more']}")
            print(f"   Items: {len(data['items'])}")
            
            for item in data["items"]:
                print(f"   - {item['name']} ({item['slug']})")
                print(f"     Documents: {item.get('document_count', 0)}")
            
            assert data["total"] >= 2  # We created 2 workspaces
            assert len(data["items"]) >= 2
            
            return data["items"]
        else:
            print(f"❌ Error: {response.text}")
            raise AssertionError(f"List workspaces failed: {response.status_code}")


async def test_get_workspace(token: str, workspace_id: str):
    """Test GET /api/v1/workspaces/{workspace_id}"""
    print("\n" + "="*60)
    print("TEST 4: Get Workspace")
    print("="*60)
    
    print(f"Getting workspace: {workspace_id}")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{API_URL}/workspaces/{workspace_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Workspace retrieved")
            print(f"   ID: {data['id']}")
            print(f"   Name: {data['name']}")
            print(f"   Slug: {data['slug']}")
            print(f"   Owner: {data['owner']['username']}")
            print(f"   Stats:")
            print(f"     - Documents: {data['stats']['document_count']}")
            print(f"     - Folders: {data['stats']['folder_count']}")
            print(f"     - Members: {data['stats']['member_count']}")
            
            assert data["id"] == workspace_id
            assert "owner" in data
            assert "stats" in data
            
            return data
        else:
            print(f"❌ Error: {response.text}")
            raise AssertionError(f"Get workspace failed: {response.status_code}")


async def test_update_workspace(token: str, workspace_id: str):
    """Test PATCH /api/v1/workspaces/{workspace_id}"""
    print("\n" + "="*60)
    print("TEST 5: Update Workspace")
    print("="*60)
    
    update_data = {
        "name": "Updated Workspace Name",
        "description": "Updated description",
        "icon": "🎯"
    }
    
    print(f"Updating workspace: {workspace_id}")
    print(f"New name: {update_data['name']}")
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{API_URL}/workspaces/{workspace_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Workspace updated")
            print(f"   ID: {data['id']}")
            print(f"   Name: {data['name']}")
            print(f"   Description: {data['description']}")
            print(f"   Icon: {data['icon']}")
            
            assert data["name"] == update_data["name"]
            assert data["description"] == update_data["description"]
            assert data["icon"] == update_data["icon"]
            
            return data
        else:
            print(f"❌ Error: {response.text}")
            raise AssertionError(f"Update workspace failed: {response.status_code}")


async def test_delete_workspace_without_cascade(token: str, workspace_id: str):
    """Test DELETE /api/v1/workspaces/{workspace_id} (no cascade)"""
    print("\n" + "="*60)
    print("TEST 6: Delete Workspace (No Cascade)")
    print("="*60)
    
    print(f"Deleting workspace: {workspace_id}")
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{API_URL}/workspaces/{workspace_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 204:
            print(f"✅ Workspace deleted")
            return True
        else:
            print(f"❌ Error: {response.text}")
            raise AssertionError(f"Delete workspace failed: {response.status_code}")


async def test_duplicate_slug(token: str):
    """Test creating workspace with duplicate slug"""
    print("\n" + "="*60)
    print("TEST 7: Duplicate Slug (Should Fail)")
    print("="*60)
    
    # Create first workspace
    workspace_data = {
        "name": "Duplicate Test",
        "slug": "duplicate-test"
    }
    
    async with httpx.AsyncClient() as client:
        # Create first
        response1 = await client.post(
            f"{API_URL}/workspaces",
            json=workspace_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response1.status_code == 201:
            print(f"✅ First workspace created")
            
            # Try to create duplicate
            response2 = await client.post(
                f"{API_URL}/workspaces",
                json=workspace_data,
                headers={"Authorization": f"Bearer {token}"}
            )
            
            print(f"Duplicate attempt status: {response2.status_code}")
            
            if response2.status_code == 409:
                print(f"✅ Duplicate slug rejected (409 Conflict)")
                print(f"   Error: {response2.json()['detail']}")
                return True
            else:
                print(f"❌ Expected 409, got {response2.status_code}")
                raise AssertionError("Duplicate slug should be rejected")
        else:
            print(f"❌ Failed to create first workspace: {response1.text}")
            raise AssertionError("Setup failed")


async def test_unauthorized_access():
    """Test accessing workspaces without auth"""
    print("\n" + "="*60)
    print("TEST 8: Unauthorized Access (Should Fail)")
    print("="*60)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_URL}/workspaces")
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print(f"✅ Unauthorized access rejected (401)")
            return True
        else:
            print(f"❌ Expected 401, got {response.status_code}")
            raise AssertionError("Unauthorized access should be rejected")


async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("MDReader API v2 - Workspace Tests")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Started: {datetime.now().isoformat()}")
    
    try:
        # Setup
        token = await setup_test_user()
        
        # Test 1: Create workspace
        workspace_id_1 = await test_create_workspace(token)
        
        # Test 2: Create workspace with auto slug
        workspace_id_2 = await test_create_workspace_auto_slug(token)
        
        # Test 3: List workspaces
        workspaces = await test_list_workspaces(token)
        
        # Test 4: Get workspace
        await test_get_workspace(token, workspace_id_1)
        
        # Test 5: Update workspace
        await test_update_workspace(token, workspace_id_1)
        
        # Test 6: Delete workspace
        await test_delete_workspace_without_cascade(token, workspace_id_2)
        
        # Test 7: Duplicate slug
        await test_duplicate_slug(token)
        
        # Test 8: Unauthorized access
        await test_unauthorized_access()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED")
        print("="*60)
        
    except AssertionError as e:
        print("\n" + "="*60)
        print(f"❌ TEST FAILED: {e}")
        print("="*60)
        raise
    except Exception as e:
        print("\n" + "="*60)
        print(f"❌ UNEXPECTED ERROR: {e}")
        print("="*60)
        raise


if __name__ == "__main__":
    asyncio.run(main())
