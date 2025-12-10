# 🚀 MDReader Service Management Guide

## 📋 Overview

This guide explains how to start, stop, and manage all MDReader services easily.

---

## ✅ **ALL SERVICES ARE NOW RUNNING!**

### Current Status
- ✅ **PostgreSQL**: Running on `localhost:7432`
- ✅ **Redis**: Running on `localhost:7379`
- ✅ **Backend API**: Running on `http://localhost:7001`
- ✅ **Frontend**: Running on `http://localhost:5173`

### 🌐 Open Your Browser
**URL**: [http://localhost:5173](http://localhost:5173)

### 🔑 Login Credentials
```
Email:    naum@example.com
Password: Kozuvcanka#1
```

---

## 🛠️ **Management Scripts**

We've created 3 powerful scripts to manage your services:

### 1. **Start Services** (`./start-services.sh`)

Start all services with intelligent dependency management.

#### Usage Options:

```bash
# Start with existing data (default)
./start-services.sh

# Clean database and start fresh
./start-services.sh --clean

# Start and ensure test user exists
./start-services.sh --with-user
```

#### What it does:
1. ✅ Stops any conflicting processes
2. ✅ Starts Docker services (PostgreSQL + Redis)
3. ✅ Runs database migrations
4. ✅ Creates test user (if requested)
5. ✅ Starts backend API
6. ✅ Starts frontend dev server
7. ✅ Verifies all services are healthy

---

### 2. **Stop Services** (`./stop-services.sh`)

Cleanly stop all running services.

```bash
./stop-services.sh
```

#### What it does:
- Stops backend API
- Stops frontend dev server
- Stops Docker containers (PostgreSQL + Redis)

---

### 3. **Check Services** (`./check-services.sh`)

Check which services are currently running.

```bash
./check-services.sh
```

#### Example Output:
```
╔══════════════════════════════════════════════════════════════╗
║          MDReader - Service Status                           ║
╚══════════════════════════════════════════════════════════════╝

📊 SERVICE STATUS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ PostgreSQL
     → localhost:7432
  ✅ Redis
     → localhost:7379
  ✅ Backend
     → http://localhost:7001
  ✅ Frontend
     → http://localhost:5173
```

---

## 📝 **Viewing Logs**

Service logs are stored in `/tmp/`:

```bash
# Backend logs
tail -f /tmp/mdreader-backend.log

# Frontend logs
tail -f /tmp/mdreader-frontend.log

# Docker logs
cd backend
docker-compose logs -f
```

---

## 🐛 **Issues We Fixed**

### Problem: Backend Startup Failures

The backend was failing to start due to SQLAlchemy relationship mismatches.

#### Root Causes:
1. **Relationship Naming Mismatch**: `UserSession` had relationships named `workspace` and `document`, but `Workspace` and `Document` models expected `current_workspace` and `current_document`.

2. **Missing `back_populates`**: The bidirectional relationships weren't properly connected.

3. **Test User Script Errors**:
   - Wrong import: `app.utils.password` → `app.utils.security`
   - Wrong attribute: `Workspace.user_id` → `Workspace.owner_id`
   - Missing required field: `Workspace.slug`

#### Fixes Applied:

**File: `backend/app/models/presence.py`** (lines 69-72)
```python
# BEFORE
user = relationship("User", foreign_keys=[user_id])
workspace = relationship("Workspace", foreign_keys=[current_workspace_id])
document = relationship("Document", foreign_keys=[current_document_id])

# AFTER
user = relationship("User", foreign_keys=[user_id])
current_workspace = relationship("Workspace", foreign_keys=[current_workspace_id], back_populates="active_sessions")
current_document = relationship("Document", foreign_keys=[current_document_id], back_populates="active_sessions")
```

**File: `backend/scripts/create_test_user.py`**
```python
# BEFORE
from app.utils.password import hash_password
workspace = Workspace(
    name="My Workspace",
    icon="💼",
    user_id=user.id,
    is_default=True
)

# AFTER
from app.utils.security import hash_password
workspace = Workspace(
    name="My Workspace",
    slug="my-workspace",
    owner_id=user.id
)
```

---

## 🎯 **Why These Scripts?**

Before, you had to:
1. Manually start Docker
2. Run migrations
3. Create test users
4. Start backend
5. Start frontend
6. Debug port conflicts
7. Check if everything is actually running

**Now**: Just run `./start-services.sh` ✨

---

## 💡 **Common Workflows**

### Fresh Start (Clean Database)
```bash
./stop-services.sh
./start-services.sh --clean
```

### Quick Restart
```bash
./stop-services.sh
./start-services.sh
```

### Check What's Running
```bash
./check-services.sh
```

### View Backend Errors
```bash
tail -f /tmp/mdreader-backend.log
```

### After Mac Restart
```bash
# Docker Desktop might need to start first
# Then:
./start-services.sh --with-user
```

---

## 🔧 **Port Configuration**

All ports are configurable in `start-services.sh`:

```bash
BACKEND_PORT=7001
FRONTEND_PORT=5173
POSTGRES_PORT=7432
REDIS_PORT=7379
```

---

## 📚 **Service Architecture**

```
┌─────────────────────────────────────────────┐
│           Frontend (React + Vite)           │
│         http://localhost:5173               │
└───────────────┬─────────────────────────────┘
                │
                │ API Calls
                ▼
┌─────────────────────────────────────────────┐
│        Backend (FastAPI + Python)           │
│         http://localhost:7001               │
└───────┬───────────────────────────┬─────────┘
        │                           │
        │                           │
        ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│   PostgreSQL     │      │      Redis       │
│  localhost:7432  │      │  localhost:7379  │
└──────────────────┘      └──────────────────┘
```

---

## 🎉 **Benefits**

### Before:
- ❌ Manual startup process
- ❌ Forgot to run migrations
- ❌ Port conflicts
- ❌ Unclear what's running
- ❌ No logs visibility

### After:
- ✅ One command startup
- ✅ Automatic migrations
- ✅ Smart port management
- ✅ Clear status reporting
- ✅ Centralized logging
- ✅ Test user creation

---

## 🚦 **Next Steps**

1. **Open your browser**: [http://localhost:5173](http://localhost:5173)
2. **Login** with: `naum@example.com` / `Kozuvcanka#1`
3. **Test features**:
   - Multi-workspace system
   - Folder organization
   - Document creation
   - Real-time editing

---

## 🆘 **Troubleshooting**

### Services Won't Start
```bash
# Kill everything and restart
./stop-services.sh
lsof -ti:7001,5173,7432,7379 | xargs kill -9
./start-services.sh --with-user
```

### Docker Not Running
```bash
# Start Docker Desktop first, then:
./start-services.sh
```

### Database Issues
```bash
# Clean start with fresh database
./start-services.sh --clean
```

### Frontend Not Loading
```bash
# Check frontend logs
tail -f /tmp/mdreader-frontend.log

# Hard refresh browser
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R
```

### Backend Errors
```bash
# Check backend logs
tail -f /tmp/mdreader-backend.log

# Verify database connection
cd backend
docker-compose ps
```

---

## 📊 **Service Health Checks**

### Backend Health
```bash
curl http://localhost:7001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "MDReader API",
  "version": "1.0.0",
  "environment": "development",
  "database": "connected"
}
```

### Frontend Health
```bash
curl http://localhost:5173
```

Should return HTML.

---

## 🎓 **Script Behavior Details**

### `start-services.sh`

**Smart Process Management:**
- Detects existing processes on ports
- Kills conflicting processes gracefully
- Waits for services to be ready before proceeding

**Dependency Chain:**
1. Docker must be running
2. PostgreSQL must be ready before migrations
3. Migrations must complete before user creation
4. Backend must be running before frontend
5. Each step validates before continuing

**Error Handling:**
- Exits immediately on critical errors
- Provides clear error messages
- Shows which step failed

### `stop-services.sh`

**Clean Shutdown:**
- Stops backend gracefully
- Stops frontend dev server
- Stops Docker containers (not volumes)
- Removes PID files
- Clears port locks

### `check-services.sh`

**Status Reporting:**
- Checks port availability
- Shows URLs for running services
- Points to log files
- Color-coded output

---

## 🔐 **Security Notes**

- Test credentials are for **development only**
- Never commit real credentials
- Use environment variables for production
- Docker containers are isolated
- Ports are localhost-only by default

---

## 📦 **What's Included**

### Scripts Created:
1. `start-services.sh` - Start all services
2. `stop-services.sh` - Stop all services
3. `check-services.sh` - Check service status
4. `backend/scripts/create_test_user.py` - Create test user

### Log Files:
- `/tmp/mdreader-backend.log`
- `/tmp/mdreader-frontend.log`

### PID Files:
- `/tmp/mdreader-backend.pid`
- `/tmp/mdreader-frontend.pid`

---

## 🎯 **Pro Tips**

1. **Always use scripts** instead of manual commands
2. **Check logs** when something seems wrong
3. **Use `--clean`** if database state is weird
4. **Hard refresh** browser after frontend changes
5. **Check status** before debugging

---

## 📞 **Quick Reference**

```bash
# Start everything
./start-services.sh

# Stop everything
./stop-services.sh

# Check what's running
./check-services.sh

# Fresh start
./start-services.sh --clean

# View backend logs
tail -f /tmp/mdreader-backend.log

# View frontend logs
tail -f /tmp/mdreader-frontend.log
```

---

## ✅ **You're All Set!**

All services are running perfectly. Open your browser and start testing! 🎉

**URL**: [http://localhost:5173](http://localhost:5173)

