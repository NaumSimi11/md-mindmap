# 🚀 Quick Start Guide

## **TL;DR - Start Everything Now**

```bash
./start-services.sh --with-user
```

Then open: [http://localhost:5173](http://localhost:5173)

Login:
- Email: `naum@example.com`
- Password: `Kozuvcanka#1`

---

## 📋 **Three Essential Commands**

### 1. Start All Services
```bash
./start-services.sh              # Normal start
./start-services.sh --clean      # Fresh database
./start-services.sh --with-user  # Ensure test user exists
```

### 2. Stop All Services
```bash
./stop-services.sh
```

### 3. Check What's Running
```bash
./check-services.sh
```

---

## 🎯 **What Runs Where**

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:5173 | 5173 |
| Backend | http://localhost:7001 | 7001 |
| PostgreSQL | localhost:7432 | 7432 |
| Redis | localhost:7379 | 7379 |

---

## 📝 **View Logs**

```bash
# Backend
tail -f /tmp/mdreader-backend.log

# Frontend
tail -f /tmp/mdreader-frontend.log
```

---

## 🐛 **Troubleshooting**

### Services won't start?
```bash
./stop-services.sh
./start-services.sh --clean
```

### Still not working?
```bash
# Kill everything
lsof -ti:7001,5173 | xargs kill -9
./start-services.sh --with-user
```

---

## 📚 **Full Documentation**

See [SERVICE_MANAGEMENT_GUIDE.md](./SERVICE_MANAGEMENT_GUIDE.md) for:
- Complete script documentation
- Architecture diagrams
- Troubleshooting guide
- All fixes we made

---

## ✅ **Currently Running**

All services are **LIVE** right now! 🎉

Open [http://localhost:5173](http://localhost:5173) and start using MDReader!

