# ⚡ **QUICKSTART - Get Running in 5 Minutes**

## **Prerequisites**

```bash
python3 --version  # >= 3.10
docker --version   # >= 20.10.0
```

---

## **Step 1: Setup** (2 minutes)

```bash
cd backendv2

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## **Step 2: Configure** (1 minute)

```bash
# Copy environment template
cp env.example .env

# Generate secret key
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))" >> .env

# Set database URL (or use default)
echo "DATABASE_URL=postgresql+asyncpg://mdreader:mdreader@localhost:5432/mdreader" >> .env
echo "DATABASE_URL_SYNC=postgresql://mdreader:mdreader@localhost:5432/mdreader" >> .env
```

---

## **Step 3: Start PostgreSQL** (30 seconds)

```bash
# From project root
cd ..
docker-compose up -d postgres

# Wait for PostgreSQL to start
sleep 5
```

---

## **Step 4: Create Database** (30 seconds)

```bash
cd backendv2

# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head
```

---

## **Step 5: Start Server** (30 seconds)

```bash
# Easy way (auto-reload)
python app/main.py

# OR with uvicorn
uvicorn app.main:app --reload --port 7001
```

**✅ Server running at:**
- **API**: http://localhost:7001
- **Docs**: http://localhost:7001/docs
- **Health**: http://localhost:7001/health

---

## **Step 6: Test** (1 minute)

### **Health Check**

```bash
curl http://localhost:7001/health
```

**Expected:**
```json
{"status":"healthy","version":"2.0.0","environment":"development","database":"up"}
```

### **Register User**

```bash
curl -X POST http://localhost:7001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePass123!",
    "full_name": "Test User"
  }'
```

**Expected (201):**
```json
{
  "user": {...},
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

---

## **Automated Test**

```bash
# Run full authentication test suite
python scripts/test_auth.py
```

**Expected:**
```
====================================================================
✅ ALL TESTS PASSED
====================================================================
```

---

## **One-Command Startup** (future runs)

```bash
cd backendv2
./scripts/start-dev.sh
```

This script:
1. ✅ Checks virtual environment
2. ✅ Checks dependencies
3. ✅ Checks PostgreSQL
4. ✅ Checks migrations
5. ✅ Starts server

---

## **🎉 You're Ready!**

**Next Steps:**
1. Explore API docs: http://localhost:7001/docs
2. Read full docs: `README.md`
3. Check patterns: `../planning_docs/PATTERNS_ADOPTION.md`

---

**Total Time**: ⏱️ **~5 minutes**  
**Status**: ✅ **READY**  
**Confidence**: 🟢 **HIGH**

