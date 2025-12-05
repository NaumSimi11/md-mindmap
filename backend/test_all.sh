#!/bin/bash
# Complete Backend Test Suite
# Run this anytime to verify everything works

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           MDReader Backend - Complete Test Suite            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in backend directory
if [ ! -f "app/main.py" ]; then
    echo "❌ Error: Run from backend directory"
    exit 1
fi

# Activate venv
source venv/bin/activate

# Check Docker services
echo "1️⃣  Checking Docker Services..."
if ! docker ps | grep -q "mdreader-postgres"; then
    echo "   Starting PostgreSQL..."
    docker-compose up -d postgres
    sleep 5
fi

if ! docker ps | grep -q "mdreader-redis"; then
    echo "   Starting Redis..."
    docker-compose up -d redis
    sleep 2
fi
echo "   ✅ Docker services running"
echo ""

# Test 1: Database Connection
echo "2️⃣  Testing Database Connection..."
python scripts/test_db.py
if [ $? -eq 0 ]; then
    echo "   ✅ Database OK"
else
    echo "   ❌ Database FAILED"
    exit 1
fi
echo ""

# Test 2: Redis Connection
echo "3️⃣  Testing Redis Connection..."
python scripts/test_redis.py
if [ $? -eq 0 ]; then
    echo "   ✅ Redis OK"
else
    echo "   ❌ Redis FAILED"
    exit 1
fi
echo ""

# Test 3: Authentication System
echo "4️⃣  Testing Authentication System..."
python -c "
import sys
sys.path.insert(0, '$(pwd)')
from app.database import SessionLocal
from app.schemas.user import UserCreate, UserLogin
from app.services.auth import AuthService
from app.utils.security import verify_token

db = SessionLocal()
try:
    # Clean up
    from app.models.user import User
    existing = db.query(User).filter(User.email == 'test-auth@test.com').first()
    if existing:
        db.delete(existing)
        db.commit()
    
    # Test create user
    user_data = UserCreate(email='test-auth@test.com', username='testauth', password='Test123456', full_name='Test')
    user = AuthService.create_user(db, user_data)
    assert user.email == 'test-auth@test.com'
    
    # Test login
    login_data = UserLogin(email='test-auth@test.com', password='Test123456')
    auth_user = AuthService.authenticate_user(db, login_data)
    assert auth_user is not None
    
    # Test tokens
    tokens = AuthService.create_tokens_for_user(auth_user)
    assert 'access_token' in tokens
    payload = verify_token(tokens['access_token'])
    assert payload is not None
    
    print('✅ Auth tests passed')
except Exception as e:
    print(f'❌ Auth tests failed: {e}')
    sys.exit(1)
finally:
    db.close()
"
if [ $? -eq 0 ]; then
    echo "   ✅ Authentication OK"
else
    echo "   ❌ Authentication FAILED"
    exit 1
fi
echo ""

# Test 4: Workspace System
echo "5️⃣  Testing Workspace System..."
python scripts/test_workspaces.py
if [ $? -eq 0 ]; then
    echo "   ✅ Workspaces OK"
else
    echo "   ❌ Workspaces FAILED"
    exit 1
fi
echo ""

# Test 5: Document System
echo "6️⃣  Testing Document System..."
python scripts/test_documents.py
if [ $? -eq 0 ]; then
    echo "   ✅ Documents OK"
else
    echo "   ❌ Documents FAILED"
    exit 1
fi
echo ""

# Test 6: File Upload System
echo "7️⃣  Testing File Upload System..."
python scripts/test_files.py
if [ $? -eq 0 ]; then
    echo "   ✅ File Upload OK"
else
    echo "   ❌ File Upload FAILED"
    exit 1
fi
echo ""

# Test 7: Presence & Real-time
echo "8️⃣  Testing Presence & Real-time System..."
python scripts/test_presence.py
if [ $? -eq 0 ]; then
    echo "   ✅ Presence & Real-time OK"
else
    echo "   ❌ Presence & Real-time FAILED"
    exit 1
fi
echo ""

# Test 8: API Server
echo "9️⃣  Testing API Server..."
echo "   Starting server..."
PYTHONPATH=$(pwd) uvicorn app.main:app --host 0.0.0.0 --port 7001 > /tmp/test_server.log 2>&1 &
SERVER_PID=$!
sleep 4

# Test health endpoint
HEALTH=$(curl -s http://localhost:7001/health | python -c "import sys, json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "fail")

# Kill server before checking result
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

if [ "$HEALTH" = "healthy" ]; then
    echo "   ✅ API Server OK"
else
    echo "   ❌ API Server FAILED"
    exit 1
fi
echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  ✅ ALL TESTS PASSED! ✅                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Tests Run:"
echo "   ✅ Database Connection"
echo "   ✅ Redis Connection"
echo "   ✅ User Authentication"
echo "   ✅ Workspace CRUD"
echo "   ✅ Member Management"
echo "   ✅ Document CRUD & Versioning"
echo "   ✅ File Upload & Storage"
echo "   ✅ Presence & Real-time"
echo "   ✅ WebSocket System"
echo "   ✅ API Server"
echo ""
echo "🎉 Backend is fully functional!"
echo ""

exit 0

