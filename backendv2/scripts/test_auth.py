"""
Test Authentication Flow
=========================

Tests:
1. Health check
2. User registration
3. User login
4. Get current user (/me)
5. Token refresh
6. Invalid credentials
"""

import asyncio
import httpx
from datetime import datetime

BASE_URL = "http://localhost:7001"
API_URL = f"{BASE_URL}/api/v1"


async def test_health():
    """Test health check endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Health Check")
    print("="*60)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        
        print("✅ Health check passed")


async def test_register():
    """Test user registration"""
    print("\n" + "="*60)
    print("TEST 2: User Registration")
    print("="*60)
    
    # Unique email with timestamp
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    email = f"test{timestamp}@example.com"
    username = f"testuser{timestamp}"
    
    user_data = {
        "email": email,
        "username": username,
        "password": "SecurePass123!",
        "full_name": "Test User"
    }
    
    print(f"Registering user: {email}")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_URL}/auth/register",
            json=user_data
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"User ID: {data['user']['id']}")
            print(f"Username: {data['user']['username']}")
            print(f"Email: {data['user']['email']}")
            print(f"Access Token: {data['access_token'][:50]}...")
            print(f"Token Type: {data['token_type']}")
            print(f"Expires In: {data['expires_in']}s")
            
            assert data["token_type"] == "bearer"
            assert len(data["access_token"]) > 100
            assert len(data["refresh_token"]) > 100
            
            print("✅ Registration passed")
            return data
        else:
            print(f"Error: {response.text}")
            raise AssertionError(f"Registration failed: {response.status_code}")


async def test_login(email: str, password: str):
    """Test user login"""
    print("\n" + "="*60)
    print("TEST 3: User Login")
    print("="*60)
    
    login_data = {
        "email": email,
        "password": password
    }
    
    print(f"Logging in: {email}")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_URL}/auth/login",
            json=login_data
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"User ID: {data['user']['id']}")
            print(f"Username: {data['user']['username']}")
            print(f"Access Token: {data['access_token'][:50]}...")
            
            assert data["token_type"] == "bearer"
            assert len(data["access_token"]) > 100
            
            print("✅ Login passed")
            return data
        else:
            print(f"Error: {response.text}")
            raise AssertionError(f"Login failed: {response.status_code}")


async def test_get_me(access_token: str):
    """Test get current user"""
    print("\n" + "="*60)
    print("TEST 4: Get Current User (/me)")
    print("="*60)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{API_URL}/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"User ID: {data['id']}")
            print(f"Username: {data['username']}")
            print(f"Email: {data['email']}")
            print(f"Created At: {data['created_at']}")
            
            print("✅ Get current user passed")
            return data
        else:
            print(f"Error: {response.text}")
            raise AssertionError(f"Get /me failed: {response.status_code}")


async def test_refresh(refresh_token: str):
    """Test token refresh"""
    print("\n" + "="*60)
    print("TEST 5: Token Refresh")
    print("="*60)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_URL}/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"New Access Token: {data['access_token'][:50]}...")
            print(f"New Refresh Token: {data['refresh_token'][:50]}...")
            
            assert len(data["access_token"]) > 100
            assert len(data["refresh_token"]) > 100
            
            print("✅ Token refresh passed")
            return data
        else:
            print(f"Error: {response.text}")
            raise AssertionError(f"Token refresh failed: {response.status_code}")


async def test_invalid_credentials():
    """Test login with invalid credentials"""
    print("\n" + "="*60)
    print("TEST 6: Invalid Credentials")
    print("="*60)
    
    login_data = {
        "email": "nonexistent@example.com",
        "password": "WrongPassword123!"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_URL}/auth/login",
            json=login_data
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print(f"Error message: {response.json()['detail']}")
            print("✅ Invalid credentials handled correctly")
        else:
            raise AssertionError("Invalid credentials should return 401")


async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("MDReader API v2 - Authentication Tests")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Started: {datetime.now().isoformat()}")
    
    try:
        # Test 1: Health check
        await test_health()
        
        # Test 2: Register
        register_result = await test_register()
        email = register_result["user"]["email"]
        access_token = register_result["access_token"]
        refresh_token = register_result["refresh_token"]
        
        # Test 3: Login
        login_result = await test_login(email, "SecurePass123!")
        
        # Test 4: Get current user
        await test_get_me(access_token)
        
        # Test 5: Token refresh
        await test_refresh(refresh_token)
        
        # Test 6: Invalid credentials
        await test_invalid_credentials()
        
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

