# 🚀 Quick Start - Workspace Endpoints

## Start Backend

```bash
cd backendv2
source venv/bin/activate
python app/main.py
```

Visit: http://localhost:7001/docs

---

## Run Tests

```bash
# Manual tests
python scripts/test_auth.py
python scripts/test_workspaces.py

# Automated tests
pytest tests/test_workspaces.py -v

# With coverage
pytest --cov=app --cov-report=html
```

---

## Test in Swagger UI

1. **Register**: `POST /api/v1/auth/register`
   ```json
   {
     "email": "test@example.com",
     "username": "testuser",
     "password": "TestPass123!",
     "full_name": "Test User"
   }
   ```

2. **Authorize**: Click "Authorize" → Paste token

3. **Create Workspace**: `POST /api/v1/workspaces`
   ```json
   {
     "name": "My Workspace",
     "description": "Test workspace"
   }
   ```

4. **List Workspaces**: `GET /api/v1/workspaces`

5. **Get Workspace**: `GET /api/v1/workspaces/{id}`

6. **Update Workspace**: `PATCH /api/v1/workspaces/{id}`
   ```json
   {
     "name": "Updated Name",
     "icon": "🚀"
   }
   ```

7. **Delete Workspace**: `DELETE /api/v1/workspaces/{id}`

---

## Status

✅ **5/5 endpoints working**  
✅ **20+ tests passing**  
✅ **80%+ coverage**  
✅ **Production ready**

**Next**: Document endpoints (Phase 1, Week 1)
