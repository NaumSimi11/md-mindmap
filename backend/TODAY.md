# 🎯 What to Do TODAY - Day 1 Setup

**Time**: ~2 hours  
**Goal**: Get your backend development environment ready

---

## ✅ Step-by-Step Checklist (Copy & Paste)

### 1️⃣ Navigate to Backend Folder (5 seconds)

```bash
cd /Users/naum/Desktop/mdreader/mdreader-main/backend
```

---

### 2️⃣ Check Prerequisites (2 minutes)

```bash
# Check Python (need 3.12+)
python3 --version
# If version < 3.12, install: brew install python@3.12

# Check Docker (need for PostgreSQL + Redis)
docker --version
# If not installed, download Docker Desktop: https://www.docker.com/products/docker-desktop

# Check if Docker is running
docker ps
# If error, start Docker Desktop app
```

---

### 3️⃣ Create Project Structure (1 minute)

```bash
# Create all folders
mkdir -p app/{routers,services,models,schemas,dependencies,websocket,middleware,utils}
mkdir -p alembic/versions
mkdir -p tests/{unit,integration,e2e}
mkdir scripts uploads .data

# Create __init__.py files
touch app/__init__.py
touch app/routers/__init__.py
touch app/services/__init__.py
touch app/models/__init__.py
touch app/schemas/__init__.py
touch app/dependencies/__init__.py
touch app/websocket/__init__.py
touch app/middleware/__init__.py
touch app/utils/__init__.py
touch tests/__init__.py

echo "✅ Project structure created!"
```

---

### 4️⃣ Create Python Virtual Environment (2 minutes)

```bash
# Create venv
python3 -m venv venv

# Activate it
source venv/bin/activate  # macOS/Linux
# On Windows: venv\Scripts\activate

# Your prompt should now show (venv)
# Upgrade pip
pip install --upgrade pip

echo "✅ Virtual environment ready!"
```

---

### 5️⃣ Create requirements.txt (1 minute)

Copy this into **requirements.txt**:

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6
sqlalchemy==2.0.25
alembic==1.13.1
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
redis==5.0.1
pydantic==2.5.0
pydantic-settings==2.1.0
websockets==12.0
```

Create **requirements-dev.txt**:

```txt
-r requirements.txt
pytest==7.4.4
pytest-asyncio==0.23.3
pytest-cov==4.1.0
httpx==0.26.0
black==23.12.1
flake8==7.0.0
mypy==1.8.0
ipython==8.20.0
```

Install:
```bash
pip install -r requirements-dev.txt

echo "✅ Dependencies installed!"
```

---

### 6️⃣ Create docker-compose.yml (2 minutes)

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: mdcreator-postgres
    environment:
      POSTGRES_USER: mdcreator
      POSTGRES_PASSWORD: dev_password_123
      POSTGRES_DB: mdcreator_dev
    ports:
      - "5432:5432"
    volumes:
      - ./.data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mdcreator"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: mdcreator-redis
    ports:
      - "6379:6379"
    volumes:
      - ./.data/redis:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
```

Start services:
```bash
docker-compose up -d

# Wait 10 seconds for services to start
sleep 10

# Check status (should show "Up" and "healthy")
docker-compose ps

echo "✅ Docker services running!"
```

---

### 7️⃣ Create .env File (1 minute)

**File**: `.env`

```bash
# Application
ENV=development
DEBUG=true
API_VERSION=v1
SECRET_KEY=dev-secret-key-change-in-production

# Database
DATABASE_URL=postgresql://mdcreator:dev_password_123@localhost:5432/mdcreator_dev
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# File Storage (Local)
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=50

# Authentication (Local JWT)
JWT_SECRET_KEY=jwt-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:8080

# Logging
LOG_LEVEL=INFO
```

---

### 8️⃣ Create Test Scripts (3 minutes)

**File**: `scripts/test_db.py`

```python
import psycopg2
import sys

try:
    conn = psycopg2.connect(
        "postgresql://mdcreator:dev_password_123@localhost:5432/mdcreator_dev"
    )
    print("✅ PostgreSQL connection successful!")
    
    # Test query
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"   PostgreSQL version: {version[0][:50]}...")
    
    cursor.close()
    conn.close()
    sys.exit(0)
    
except Exception as e:
    print(f"❌ PostgreSQL connection failed: {e}")
    sys.exit(1)
```

**File**: `scripts/test_redis.py`

```python
import redis
import sys

try:
    r = redis.Redis(host='localhost', port=6379, db=0)
    response = r.ping()
    
    if response:
        print("✅ Redis connection successful!")
        print(f"   Redis version: {r.info()['redis_version']}")
        sys.exit(0)
    else:
        print("❌ Redis ping failed")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ Redis connection failed: {e}")
    sys.exit(1)
```

Make executable:
```bash
chmod +x scripts/test_db.py
chmod +x scripts/test_redis.py
```

---

### 9️⃣ Test Everything (5 minutes)

```bash
# Test PostgreSQL
python scripts/test_db.py
# Expected: ✅ PostgreSQL connection successful!

# Test Redis
python scripts/test_redis.py
# Expected: ✅ Redis connection successful!

# Check Docker status
docker-compose ps
# Expected: All services "Up" and "healthy"

echo "✅ All systems operational!"
```

---

### 🔟 Create .gitignore (1 minute)

**File**: `.gitignore`

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/

# Environment
.env
.env.local

# Database & Storage
.data/
uploads/
*.db
*.sqlite

# Testing
.pytest_cache/
htmlcov/
.coverage
*.cover
.hypothesis/

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Logs
*.log

# Alembic
alembic/versions/*.pyc
```

---

## ✅ VERIFICATION CHECKLIST

After completing all steps, verify:

```bash
# 1. Virtual environment active
echo $VIRTUAL_ENV
# Should show: /Users/naum/Desktop/mdreader/mdreader-main/backend/venv

# 2. Dependencies installed
pip list | grep fastapi
# Should show: fastapi 0.109.0

# 3. Docker services running
docker-compose ps
# Should show: postgres (Up, healthy), redis (Up, healthy)

# 4. Database accessible
python scripts/test_db.py
# Should show: ✅ PostgreSQL connection successful!

# 5. Redis accessible
python scripts/test_redis.py
# Should show: ✅ Redis connection successful!

# 6. Project structure created
ls -la app/
# Should show: routers/, services/, models/, etc.
```

---

## 🎯 SUCCESS! You're Ready!

**If all checks pass ✅, you're ready for Day 2!**

**Tomorrow (Day 2)**: You'll create your first FastAPI application and connect it to the database.

**Next Step**: Read `DEVELOPMENT_ROADMAP.md` - Phase 1, Day 2

---

## 🆘 If Something Failed

### PostgreSQL won't start
```bash
# Check logs
docker logs mdcreator-postgres

# Try restarting
docker-compose restart postgres

# If still failing, remove and recreate
docker-compose down
rm -rf .data/postgres
docker-compose up -d
```

### Redis won't start
```bash
# Check logs
docker logs mdcreator-redis

# Restart
docker-compose restart redis
```

### Python dependencies fail
```bash
# Make sure venv is activated
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Try installing one by one
pip install fastapi
pip install uvicorn
# etc.
```

### Import errors
```bash
# Make sure __init__.py files exist in all folders
find app -type d -exec touch {}/__init__.py \;
```

---

## 📞 Need More Help?

- **Setup issues**: Check `LOCAL_SETUP_GUIDE.md` - Troubleshooting section
- **What to build next**: Read `DEVELOPMENT_ROADMAP.md`
- **Architecture questions**: See `docs/` folder

---

## 🎉 Congratulations!

**You've completed Day 1 setup! 🎊**

**Your backend development environment is ready!**

**Tomorrow**: Start building your FastAPI application!

---

**Time Spent**: ~2 hours  
**Status**: ✅ Complete  
**Next**: Day 2 - FastAPI Foundation

