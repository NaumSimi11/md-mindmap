# 🚀 **HOW TO START THE PROJECT**

**Complete guide to starting all services**

---

## 📋 **QUICK START (Recommended)**

### **Option 1: One Command (Automated)**
```bash
cd /Users/naum/Desktop/mdreader/mdreader-main
./start-production.sh
```

This will start ALL services automatically:
- ✅ PostgreSQL (Docker)
- ✅ Backend (FastAPI)
- ✅ Hocuspocus (WebSocket)
- ✅ Frontend (Vite)

---

## 🔧 **MANUAL START (Step by Step)**

If you prefer to start services individually:

### **Step 1: Start PostgreSQL**
```bash
cd /Users/naum/Desktop/mdreader/mdreader-main
docker-compose up -d postgres
```

**Verify**: 
```bash
docker ps | grep postgres
# Should show container running on port 5432
```

---

### **Step 2: Start Backend (FastAPI)**
```bash
cd /Users/naum/Desktop/mdreader/mdreader-main/backendv2
source venv/bin/activate  # Activate virtual environment
uvicorn app.main:app --reload --port 8000 > ../logs/backend.log 2>&1 &
```

**Verify**: 
```bash
curl http://localhost:8000/health
# Should return: {"status":"ok"}
```

---

### **Step 3: Start Hocuspocus Server (WebSocket)**
```bash
cd /Users/naum/Desktop/mdreader/mdreader-main/hocuspocus-server
npm start > ../logs/hocuspocus.log 2>&1 &
```

**Verify**: 
```bash
curl -I http://localhost:1234
# Should return HTTP headers (WebSocket server ready)
```

---

### **Step 4: Start Frontend (Vite)**
```bash
cd /Users/naum/Desktop/mdreader/mdreader-main/frontend
npm run dev > ../logs/frontend.log 2>&1 &
```

**Verify**: 
```bash
curl http://localhost:5173
# Should return HTML
```

---

## 🌐 **ACCESS POINTS**

Once everything is running:

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | http://localhost:5173 or 5174 | Main App |
| **Backend API** | http://localhost:8000 | REST API |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **Hocuspocus** | ws://localhost:1234 | WebSocket |
| **PostgreSQL** | localhost:5432 | Database |

---

## ✅ **VERIFY ALL SERVICES**

Run this to check everything is working:

```bash
cd /Users/naum/Desktop/mdreader/mdreader-main

echo "🔍 Checking services..."
echo ""

# Check PostgreSQL
if docker ps | grep -q postgres; then
    echo "✅ PostgreSQL: RUNNING"
else
    echo "❌ PostgreSQL: NOT RUNNING"
fi

# Check Backend
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend: RUNNING (port 8000)"
else
    echo "❌ Backend: NOT RUNNING"
fi

# Check Hocuspocus
if lsof -i :1234 > /dev/null 2>&1; then
    echo "✅ Hocuspocus: RUNNING (port 1234)"
else
    echo "❌ Hocuspocus: NOT RUNNING"
fi

# Check Frontend
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend: RUNNING (port 5173)"
elif curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo "✅ Frontend: RUNNING (port 5174)"
else
    echo "❌ Frontend: NOT RUNNING"
fi

echo ""
echo "🎯 All checks complete!"
```

---

## 🛑 **STOP ALL SERVICES**

### **Option 1: One Command**
```bash
cd /Users/naum/Desktop/mdreader/mdreader-main
./stop-production.sh
```

### **Option 2: Manual Stop**
```bash
# Stop Frontend
pkill -f "vite.*517"

# Stop Hocuspocus
pkill -f "node.*hocuspocus"

# Stop Backend
pkill -f "uvicorn"

# Stop PostgreSQL
docker-compose down postgres
```

---

## 📊 **LOGS**

View logs for each service:

```bash
# Frontend logs
tail -f logs/frontend.log

# Backend logs
tail -f logs/backend.log

# Hocuspocus logs
tail -f logs/hocuspocus.log

# All logs at once
tail -f logs/*.log
```

---

## 🔥 **COMMON ISSUES**

### **Issue 1: Port Already in Use**
```bash
# Kill process on port 5173 (Frontend)
lsof -ti:5173 | xargs kill -9

# Kill process on port 8000 (Backend)
lsof -ti:8000 | xargs kill -9

# Kill process on port 1234 (Hocuspocus)
lsof -ti:1234 | xargs kill -9
```

### **Issue 2: PostgreSQL Not Starting**
```bash
# Remove old containers
docker-compose down
docker-compose up -d postgres
```

### **Issue 3: Frontend Not Loading**
```bash
# Clear cache and restart
cd frontend
rm -rf node_modules/.vite
npm run dev
```

---

## 🎯 **RECOMMENDED WORKFLOW**

### **Development Mode**
```bash
# Terminal 1: Backend
cd backendv2 && source venv/bin/activate && uvicorn app.main:app --reload

# Terminal 2: Hocuspocus
cd hocuspocus-server && npm start

# Terminal 3: Frontend
cd frontend && npm run dev

# Terminal 4: PostgreSQL (already running)
docker-compose up postgres
```

### **Production Mode**
```bash
# Single command
./start-production.sh

# Open browser
open http://localhost:5173
```

---

## 📝 **FIRST TIME SETUP**

If this is your first time running the project:

```bash
# 1. Install Frontend dependencies
cd frontend
npm install

# 2. Install Hocuspocus dependencies
cd ../hocuspocus-server
npm install

# 3. Setup Backend virtual environment
cd ../backendv2
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. Run database migrations
alembic upgrade head

# 5. Start PostgreSQL
cd ..
docker-compose up -d postgres

# 6. Now you can start all services
./start-production.sh
```

---

## ✅ **READY TO GO!**

After starting everything, open:
**http://localhost:5173** (or 5174)

You should see:
- ✅ Managers initialized
- ✅ Workspace loaded
- ✅ Ready to create documents

**Enjoy! 🎉**
