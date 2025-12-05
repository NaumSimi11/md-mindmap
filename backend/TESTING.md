# 🧪 Testing Guide

## Quick Test (Run Anytime)

```bash
cd /Users/naum/Desktop/mdreader/mdreader-main/backend
./test_all.sh
```

**That's it!** This tests everything:
- ✅ Database connectivity
- ✅ Redis connectivity
- ✅ User authentication
- ✅ Workspace CRUD
- ✅ Member management
- ✅ API server

---

## Individual Tests

### Test Database Only
```bash
source venv/bin/activate
python scripts/test_db.py
```

### Test Redis Only
```bash
source venv/bin/activate
python scripts/test_redis.py
```

### Test Workspaces Only
```bash
source venv/bin/activate
python scripts/test_workspaces.py
```

---

## Before Making Changes

**Always run tests before committing:**

```bash
./test_all.sh
```

If all tests pass ✅ → you're good to commit  
If any test fails ❌ → fix it before continuing

---

## Troubleshooting

### Docker services not running
```bash
docker-compose up -d
./test_all.sh
```

### Database connection error
```bash
docker-compose restart postgres
sleep 5
./test_all.sh
```

### Port already in use
```bash
# Kill any running server
pkill -f "uvicorn app.main:app"
./test_all.sh
```

---

## CI/CD Integration (Future)

This same `test_all.sh` can be used in GitHub Actions:

```yaml
- name: Run tests
  run: |
    cd backend
    ./test_all.sh
```

---

**Remember:** Run `./test_all.sh` before every commit! 🚀

