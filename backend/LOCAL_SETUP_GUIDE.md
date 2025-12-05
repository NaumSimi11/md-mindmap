# Backend Local Development Setup Guide

**100% Local Development - No AWS Required**

---

## 📦 Prerequisites

### 1. Install Python 3.12+

Check if you have it:
```bash
python3 --version
```

If not installed:
- **macOS**: `brew install python@3.12`
- **Windows**: Download from python.org
- **Linux**: `sudo apt install python3.12`

### 2. Install Docker Desktop

Download from: https://www.docker.com/products/docker-desktop

Verify installation:
```bash
docker --version
docker-compose --version
```

### 3. Install PostgreSQL Client (optional, for direct DB access)

```bash
# macOS
brew install postgresql@16

# Linux
sudo apt install postgresql-client-16
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Navigate to Backend Folder

```bash
cd /Users/naum/Desktop/mdreader/mdreader-main/backend
```

### Step 2: Create Project Structure

```bash
# Create all necessary directories
mkdir -p app/{routers,services,models,schemas,dependencies,websocket,middleware,utils}
mkdir -p alembic/versions
mkdir -p tests/{unit,integration,e2e}
mkdir scripts
mkdir uploads  # Local file storage (replaces S3)
mkdir .data     # Local data (PostgreSQL, Redis volumes)

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
```

### Step 3: Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 4: Create Requirements Files

**requirements.txt** (production dependencies):
```txt
# Core
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.25
alembic==1.13.1
psycopg2-binary==2.9.9  # PostgreSQL driver

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0

# Redis
redis==5.0.1

# Validation
pydantic==2.5.0
pydantic-settings==2.1.0

# WebSocket & Real-Time
websockets==12.0
y-py==0.6.0  # Yjs CRDT for Python

# CORS
fastapi-cors==0.0.6

# Testing
pytest==7.4.4
pytest-asyncio==0.23.3
httpx==0.26.0  # For testing FastAPI
```

**requirements-dev.txt** (development dependencies):
```txt
-r requirements.txt

# Development
black==23.12.1          # Code formatter
flake8==7.0.0           # Linter
mypy==1.8.0             # Type checker
pytest-cov==4.1.0       # Test coverage
ipython==8.20.0         # Better REPL
```

Install dependencies:
```bash
pip install --upgrade pip
pip install -r requirements-dev.txt
```

### Step 5: Create Docker Compose (Local PostgreSQL + Redis)

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  # PostgreSQL Database
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

  # Redis Cache
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

  # pgAdmin (optional - database GUI)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: mdcreator-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@mdcreator.local
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres
```

Start services:
```bash
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 6: Create Environment Variables

**.env** (create this file):
```bash
# Application
ENV=development
DEBUG=true
API_VERSION=v1
SECRET_KEY=your-super-secret-key-change-this-in-production

# Database (Local PostgreSQL)
DATABASE_URL=postgresql://mdcreator:dev_password_123@localhost:5432/mdcreator_dev
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis (Local)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# File Storage (Local - replaces S3)
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=50

# Authentication (Local JWT - no Cognito yet)
JWT_SECRET_KEY=another-super-secret-key-for-jwt
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# CORS (Allow frontend)
CORS_ORIGINS=http://localhost:5173,http://localhost:8080

# Logging
LOG_LEVEL=INFO
```

**.env.example** (template for others):
```bash
# Copy this to .env and fill in values

# Application
ENV=development
DEBUG=true
API_VERSION=v1
SECRET_KEY=change-me

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# File Storage
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=50

# Authentication
JWT_SECRET_KEY=change-me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# CORS
CORS_ORIGINS=http://localhost:5173

# Logging
LOG_LEVEL=INFO
```

Add to **.gitignore**:
```bash
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

# Database
.data/
*.db
*.sqlite

# Uploads
uploads/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
.pytest_cache/
htmlcov/
.coverage
```

---

## ✅ Verify Setup

### 1. Check Python Environment

```bash
# Should show your venv path
which python

# Should list all installed packages
pip list
```

### 2. Check Docker Services

```bash
# All services should be "Up" and "healthy"
docker-compose ps

# Test PostgreSQL
docker exec -it mdcreator-postgres psql -U mdcreator -d mdcreator_dev -c "SELECT version();"

# Test Redis
docker exec -it mdcreator-redis redis-cli ping
# Should respond: PONG
```

### 3. Test Database Connection (Python)

Create **scripts/test_db.py**:
```python
import psycopg2

try:
    conn = psycopg2.connect(
        "postgresql://mdcreator:dev_password_123@localhost:5432/mdcreator_dev"
    )
    print("✅ PostgreSQL connection successful!")
    conn.close()
except Exception as e:
    print(f"❌ PostgreSQL connection failed: {e}")
```

Run it:
```bash
python scripts/test_db.py
```

### 4. Test Redis Connection (Python)

Create **scripts/test_redis.py**:
```python
import redis

try:
    r = redis.Redis(host='localhost', port=6379, db=0)
    r.ping()
    print("✅ Redis connection successful!")
except Exception as e:
    print(f"❌ Redis connection failed: {e}")
```

Run it:
```bash
python scripts/test_redis.py
```

---

## 📂 Final Project Structure

```
backend/
├── .data/                  # Docker volumes (gitignored)
│   ├── postgres/
│   └── redis/
├── app/
│   ├── __init__.py
│   ├── routers/            # API endpoints
│   ├── services/           # Business logic
│   ├── models/             # SQLAlchemy models
│   ├── schemas/            # Pydantic schemas
│   ├── dependencies/       # FastAPI dependencies
│   ├── websocket/          # WebSocket handlers
│   ├── middleware/         # Custom middleware
│   └── utils/              # Utilities
├── alembic/                # Database migrations
│   └── versions/
├── tests/                  # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/                # Helper scripts
├── uploads/                # Local file storage (gitignored)
├── docs/                   # Documentation
├── venv/                   # Virtual environment (gitignored)
├── docker-compose.yml      # Local services
├── requirements.txt        # Dependencies
├── requirements-dev.txt    # Dev dependencies
├── .env                    # Environment variables (gitignored)
├── .env.example            # Template
├── .gitignore
└── README.md
```

---

## 🎯 Next Steps

Once setup is complete, you're ready to start building:

1. **Create FastAPI application** (`app/main.py`)
2. **Setup database models** (`app/models/`)
3. **Configure Alembic migrations** (`alembic/`)
4. **Build authentication** (`app/routers/auth.py`)
5. **Create core API endpoints** (`app/routers/`)

See **DEVELOPMENT_ROADMAP.md** for detailed step-by-step instructions!

---

## 🆘 Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check if container is running
docker ps | grep postgres

# View logs
docker logs mdcreator-postgres

# Restart container
docker-compose restart postgres
```

### Redis Connection Issues

```bash
# Check if container is running
docker ps | grep redis

# Test connection
redis-cli -h localhost -p 6379 ping
```

### Port Already in Use

```bash
# Check what's using port 5432 (PostgreSQL)
lsof -i :5432

# Check what's using port 6379 (Redis)
lsof -i :6379

# Kill process if needed
kill -9 <PID>
```

### Docker Issues

```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Start fresh
docker-compose up -d
```

---

## 📚 Useful Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart postgres

# Access PostgreSQL CLI
docker exec -it mdcreator-postgres psql -U mdcreator -d mdcreator_dev

# Access Redis CLI
docker exec -it mdcreator-redis redis-cli

# Activate Python environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements-dev.txt

# Run tests
pytest

# Format code
black app/

# Check types
mypy app/
```

---

**Setup Complete! ✅ Ready to start development!**

