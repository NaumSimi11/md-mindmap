# 🚀 How to Start MDReader Project

## Quick Start (Daily Use)

### 1. Start Docker (if not running)
```bash
cd backend
docker-compose up -d
```

### 2. Start Backend API
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 7001 --reload
```
**Leave this terminal open!**

### 3. Start Frontend (NEW TERMINAL)
```bash
cd frontend
npm run dev
```
**Leave this terminal open!**

### 4. Open Browser
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:7001/docs

---

## Check What's Running

```bash
# Check all ports
lsof -i :7001 -i :5173 -i :7432 -i :7379

# Or check individual services
docker ps                    # Docker services
curl http://localhost:7001/health  # Backend
curl http://localhost:5173   # Frontend
```

---

## Stop Everything

```bash
# Stop backend
pkill -f "uvicorn app.main"

# Stop frontend
pkill -f "vite"

# Stop Docker
cd backend && docker-compose down
```

---

## Ports Reference

| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 7432 | localhost:7432 |
| Redis | 7379 | localhost:7379 |
| Backend API | 7001 | http://localhost:7001 |
| API Docs | 7001 | http://localhost:7001/docs |
| Frontend | 5173 | http://localhost:5173 |

---

## Test Credentials

**Username**: testuser  
**Email**: test@mdreader.com  
**Password**: TestPassword123!

Or create a new account at: http://localhost:5173

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on specific port
lsof -ti:7001 | xargs kill -9   # Backend
lsof -ti:5173 | xargs kill -9   # Frontend
```

### Docker Not Running
```bash
cd backend
docker-compose restart
```

### Backend Dependencies Missing
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend Dependencies Missing
```bash
cd frontend
npm install
```

---

## Fresh Start (Clean Slate)

```bash
# 1. Stop everything
pkill -f "uvicorn app.main"
pkill -f "vite"
cd backend && docker-compose down

# 2. Restart Docker
docker-compose up -d

# 3. Start backend (Terminal 1)
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 7001 --reload

# 4. Start frontend (Terminal 2)
cd ../frontend
npm run dev
```

---

## Common Issues Fixed

✅ **Port 8000 → 7001**: API now on correct port  
✅ **CORS Errors**: Backend allows http://localhost:5173  
✅ **Username Validation**: Auto-trims spaces  
✅ **Error Messages**: Shows readable errors, not "[object Object]"  
✅ **Infinite Loop**: Auto-save no longer spams backend  

---

**Need help? Check:**
- `backend/CODE_WALKTHROUGH.md` - Backend architecture
- `backend/TESTING.md` - How to run tests
- `QUICK_START.md` - Detailed setup guide

