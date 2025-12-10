# 🚀 Quick Start Guide - MDReader Full Stack

## Prerequisites
✅ Docker running (PostgreSQL + Redis)  
✅ Python 3.12+ installed  
✅ Node.js 18+ installed  

---

## 🔧 One-Time Setup

### Backend Setup (First Time Only)

```bash
# 1. Go to backend folder
cd /Users/naum/Desktop/mdreader/mdreader-main/backend

# 2. Create virtual environment (if not exists)
python3 -m venv venv

# 3. Activate virtual environment
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# 5. Run database migrations
alembic upgrade head

# 6. Test backend
python scripts/test_db.py
```

### Frontend Setup (First Time Only)

```bash
# 1. Go to frontend folder
cd /Users/naum/Desktop/mdreader/mdreader-main/frontend

# 2. Install dependencies
npm install
```

---

## 🚀 Daily Startup (2 Terminals)

### Terminal 1: Start Backend API

```bash
cd /Users/naum/Desktop/mdreader/mdreader-main/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 7001 --reload
```

**Backend will be available at:**
- API: http://localhost:7001
- Swagger Docs: http://localhost:7001/docs
- Health Check: http://localhost:7001/health

---

### Terminal 2: Start Frontend

```bash
cd /Users/naum/Desktop/mdreader/mdreader-main/frontend
npm run dev
```

**Frontend will be available at:**
- App: http://localhost:7100

---

## ✅ Verify Everything Works

### 1. Check Docker Services
```bash
docker ps
```
Should show: `mdreader-postgres` and `mdreader-redis`

### 2. Check Backend
```bash
curl http://localhost:7001/health
```
Should return: `{"status":"healthy",...}`

### 3. Check Frontend
Open browser: http://localhost:7100

---

## 🐛 Troubleshooting

### Backend won't start?

**Error: "No module named 'argon2'"**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

**Error: "Database connection failed"**
```bash
# Check Docker is running
docker ps

# Restart Docker services
cd backend
docker-compose restart
```

**Error: "Port 7001 already in use"**
```bash
# Find and kill process using port 7001
lsof -ti:7001 | xargs kill -9
```

---

### Frontend won't start?

**Error: "Cannot find module"**
```bash
cd frontend
npm install
```

**Error: "Port 7100 already in use"**
```bash
# Find and kill process using port 7100
lsof -ti:7100 | xargs kill -9
```

---

## 📦 What's Running?

| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 7432 | localhost:7432 |
| Redis | 7379 | localhost:7379 |
| Backend API | 7001 | http://localhost:7001 |
| Frontend | 7100 | http://localhost:7100 |

---

## 🧪 Run Tests

### Backend Tests
```bash
cd backend
source venv/bin/activate
./test_all.sh
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## 🎯 Next Steps

1. ✅ Start Docker: `docker-compose up -d`
2. ✅ Start Backend: Terminal 1
3. ✅ Start Frontend: Terminal 2
4. ✅ Open http://localhost:7100
5. 🎉 Start building!

---

**Need help?** Check:
- `backend/CODE_WALKTHROUGH.md` - Backend architecture
- `backend/TESTING.md` - Testing guide
- `backend/START_HERE.md` - Detailed backend guide

