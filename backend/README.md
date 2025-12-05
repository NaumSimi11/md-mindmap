# MD Creator Backend

**FastAPI + PostgreSQL + Redis** - Local Development First, AWS Later

---

## 🚀 Quick Start

**Never built a backend before? Start here**: [`START_HERE.md`](./START_HERE.md)

**Just want to get running?**

```bash
# 1. Setup (Day 1)
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
docker-compose up -d

# 2. Start developing (Day 2+)
uvicorn app.main:app --reload
# Visit: http://localhost:8000/docs
```

---

## 📚 Documentation

### For Getting Started
- **[START_HERE.md](./START_HERE.md)** - Your roadmap (read this first!)
- **[LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md)** - Complete setup instructions (Day 1)
- **[DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)** - What to build & when (Days 2-18)

### For Architecture & API Specs
- **[docs/BACKEND_README.md](./docs/BACKEND_README.md)** - Complete documentation index
- **[docs/BACKEND_EXECUTIVE_SUMMARY.md](./docs/BACKEND_EXECUTIVE_SUMMARY.md)** - High-level overview
- **[docs/BACKEND_QUICK_REFERENCE.md](./docs/BACKEND_QUICK_REFERENCE.md)** - Code patterns & commands

---

## 🎯 Project Status

**Current Phase**: 🔧 Setup & Foundation

- [ ] Phase 0: Local environment setup
- [ ] Phase 1: Authentication system
- [ ] Phase 2: Core API (workspaces, documents)
- [ ] Phase 3: File storage
- [ ] Phase 4: Real-time collaboration
- [ ] Phase 5: Advanced features

---

## 🏗️ Architecture

### Local Development (Now)
```
Frontend (React)
    ↓ HTTP
FastAPI Backend
    ↓
PostgreSQL (Docker) + Redis (Docker)
    ↓
Local File Storage
```

### Production (Later)
```
Frontend (React)
    ↓ HTTPS
AWS ECS Fargate (FastAPI)
    ↓
AWS RDS (PostgreSQL) + ElastiCache (Redis)
    ↓
AWS S3 (File Storage)
```

---

## 🛠️ Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| **API Framework** | FastAPI | Modern, async, auto-docs |
| **Database** | PostgreSQL 16 | Relational, full-text search |
| **Cache** | Redis 7 | Fast, presence tracking |
| **ORM** | SQLAlchemy 2.0 | Type-safe, migrations |
| **Auth** | JWT | Stateless, scalable |
| **Real-Time** | WebSocket + Yjs | Conflict-free editing |
| **File Storage** | Local → S3 | Start simple, scale later |

---

## 📂 Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── database.py          # Database connection
│   ├── routers/             # API endpoints
│   ├── services/            # Business logic
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── dependencies/        # FastAPI dependencies
│   ├── websocket/           # WebSocket handlers
│   ├── middleware/          # Custom middleware
│   └── utils/               # Utilities
├── alembic/                 # Database migrations
├── tests/                   # Tests
├── scripts/                 # Helper scripts
├── uploads/                 # Local file storage
├── docs/                    # Architecture docs
├── docker-compose.yml       # Local services
├── requirements.txt         # Dependencies
├── .env                     # Environment variables
└── README.md               # This file
```

---

## 🔧 Development Commands

```bash
# Setup
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
docker-compose up -d

# Run server
uvicorn app.main:app --reload

# Database migrations
alembic revision --autogenerate -m "Description"
alembic upgrade head
alembic downgrade -1

# Testing
pytest
pytest --cov=app

# Code quality
black app/
flake8 app/
mypy app/

# Docker
docker-compose ps
docker-compose logs -f
docker-compose down
```

---

## 🌐 API Endpoints

Once running, visit: http://localhost:8000/docs

### Phase 1 (Authentication)
- `POST /api/auth/signup` - Register user
- `POST /api/auth/login` - Login & get tokens
- `GET /api/auth/me` - Get current user

### Phase 2 (Core API)
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/{id}/documents` - List documents
- `POST /api/documents` - Create document

### Phase 3+ (Coming Soon)
- File uploads
- Real-time collaboration
- Comments
- Search

---

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test
pytest tests/unit/test_auth.py

# Run integration tests
pytest tests/integration/
```

---

## 🔐 Environment Variables

Create `.env` file (see `.env.example`):

```bash
# Required
DATABASE_URL=postgresql://mdcreator:dev_password_123@localhost:5432/mdcreator_dev
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret

# Optional (defaults work)
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGINS=http://localhost:5173
```

---

## 📊 Database

### Access PostgreSQL

```bash
# Via Docker
docker exec -it mdcreator-postgres psql -U mdcreator -d mdcreator_dev

# Via client (if installed)
psql postgresql://mdcreator:dev_password_123@localhost:5432/mdcreator_dev
```

### Common SQL Queries

```sql
-- List all tables
\dt

-- Show users
SELECT * FROM users;

-- Show table structure
\d users
```

---

## 🐛 Troubleshooting

### Services won't start

```bash
# Check Docker
docker ps
docker-compose logs

# Restart
docker-compose restart
```

### Database connection fails

```bash
# Check PostgreSQL is running
docker exec -it mdcreator-postgres pg_isready

# Check logs
docker logs mdcreator-postgres
```

### Port already in use

```bash
# Find what's using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>
```

---

## 📈 Development Timeline

**Total**: ~3 weeks (18 days)

- **Week 1** (Days 1-5): Setup + Auth + Core API start
- **Week 2** (Days 6-12): Core API + Files + Real-time start
- **Week 3** (Days 13-18): Real-time + Advanced features

**Daily commitment**: 6-8 hours

---

## 🎯 Goals by Phase

### Phase 1 (Days 2-4): Foundation ✅
- FastAPI running
- PostgreSQL connected
- User authentication working

### Phase 2 (Days 5-8): Core API
- Create workspaces
- Create documents
- Basic CRUD operations

### Phase 3 (Days 9-10): File Storage
- Upload files
- Attachments
- Context files

### Phase 4 (Days 11-14): Real-Time
- WebSocket server
- Live collaboration
- Presence indicators

### Phase 5 (Days 15-18): Polish
- Comments
- Search
- AI proxy (optional)

---

## 🚀 Getting Help

**Stuck?** Check these docs:
1. [START_HERE.md](./START_HERE.md) - Overview
2. [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md) - Setup help
3. [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) - Build instructions

**Still stuck?** Check:
- FastAPI docs: https://fastapi.tiangolo.com/
- SQLAlchemy docs: https://docs.sqlalchemy.org/

---

## 📝 License

Internal use - MD Creator project

---

## 🎉 Let's Build!

**Ready to start?**

👉 Open [`START_HERE.md`](./START_HERE.md) and follow the steps!

**Total time to MVP**: ~3 weeks

**Let's go! 💪**

