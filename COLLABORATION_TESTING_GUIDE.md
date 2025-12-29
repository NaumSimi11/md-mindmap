# Collaboration Testing Guide

> Quick reference for testing real-time collaboration and preventing regressions.

---

## 🔐 Environment Setup (CRITICAL)

### Backend `.env` (backendv2/.env)
```bash
SECRET_KEY=your-secret-key-here-change-in-production-use-openssl-rand-hex-32
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/mdreader
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Hocuspocus `.env` (hocuspocus-server/.env)
```bash
# MUST MATCH backend SECRET_KEY exactly!
SECRET_KEY=your-secret-key-here-change-in-production-use-openssl-rand-hex-32
BACKEND_URL=http://localhost:7001
HOCUSPOCUS_PORT=1234
HOCUSPOCUS_HOST=0.0.0.0
```

### Frontend `.env` (frontend/.env)
```bash
VITE_API_URL=http://localhost:7001
VITE_WS_URL=ws://localhost:1234
```

⚠️ **If SECRET_KEY doesn't match between backend and Hocuspocus, JWT auth fails!**

---

## 🚀 Starting Services

```bash
# Terminal 1: Backend (port 7001)
cd backendv2 && uvicorn app.main:app --reload --port 7001

# Terminal 2: Hocuspocus (port 1234)
cd hocuspocus-server && npm run start

# Terminal 3: Frontend (port 5173)
cd frontend && npm run dev
```

---

## 🧪 Manual Collaboration Test Checklist

### Pre-Test Setup
- [ ] All 3 services running (backend:7001, hocuspocus:1234, frontend:5173)
- [ ] Two browser windows (or tabs) open
- [ ] Two different user accounts (e.g., naum@example.com, ljubo@example.com)

### Test 1: Basic Real-Time Sync
1. [ ] User A logs in, creates document
2. [ ] User A shares document with User B (via invite)
3. [ ] User B accepts invite (or manually add to `document_shares` table)
4. [ ] User B opens the shared document
5. [ ] User A types → text appears in User B's window
6. [ ] User B types → text appears in User A's window

### Test 2: Logout/Login Data Isolation
1. [ ] User A logs out
2. [ ] User B logs in on same browser
3. [ ] User B should NOT see User A's local documents
4. [ ] IndexedDB cache should be cleared on logout

### Test 3: Snapshot Persistence
1. [ ] Make edits to document
2. [ ] Check console for `✅ [Snapshot] Pushed successfully`
3. [ ] Refresh browser
4. [ ] Content should persist (loaded from backend)

---

## 🔧 Automated Tests to Add

### 1. JWT Claim Compatibility Test
```typescript
// frontend/src/__tests__/collaboration/jwt-claims.test.ts
import { describe, it, expect } from 'vitest';

describe('JWT Claims Compatibility', () => {
  it('should use "sub" claim for user ID (backend standard)', () => {
    // Mock JWT from backend
    const mockJwt = {
      sub: 'cf9e8404-1234-5678-9abc-def012345678',
      exp: Date.now() / 1000 + 3600,
      iat: Date.now() / 1000,
      type: 'access'
    };
    
    // Hocuspocus expects decoded.sub, NOT decoded.user_id
    expect(mockJwt.sub).toBeDefined();
    expect(mockJwt.user_id).toBeUndefined(); // This should NOT exist
  });
});
```

### 2. Document Share Access Test
```typescript
// frontend/src/__tests__/collaboration/document-access.test.ts
describe('Document Share Access', () => {
  it('shared users should access document via shares, not workspace', async () => {
    // User B has document share but is NOT in workspace
    // GET /documents/:id should return 200 (not 403)
  });
  
  it('shared users with editor role can save snapshots', async () => {
    // POST /documents/:id/snapshot should return 200 for editors
  });
});
```

### 3. IndexedDB Cache Isolation Test
```typescript
// frontend/src/__tests__/collaboration/cache-isolation.test.ts
describe('Cache Isolation on Logout', () => {
  it('should clear all IndexedDB tables on logout', async () => {
    // Trigger auth:logout event
    // Verify cacheDb.workspaces.count() === 0
    // Verify cacheDb.documents.count() === 0
  });
});
```

### 4. Hocuspocus Connection Test
```typescript
// frontend/src/__tests__/collaboration/websocket-auth.test.ts
describe('WebSocket Authentication', () => {
  it('should connect with valid JWT', async () => {
    // Mock HocuspocusProvider connection
    // Verify onAuthenticated callback fires
  });
  
  it('should include auth token in WebSocket params', () => {
    // Verify token is passed to ws://localhost:1234
  });
});
```

---

## 🐛 Common Issues & Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `JWT invalid signature` | SECRET_KEY mismatch | Sync `.env` files |
| `User undefined in members` | Wrong JWT claim | Use `decoded.sub` not `decoded.user_id` |
| 403 on shared document | Missing share check | Add `DocumentShare` check in `get_document` |
| 403 on snapshot | Missing editor check | Add share check in `update_document` |
| Same docs after logout | Cache not cleared | Clear IndexedDB on `auth:logout` |
| WebSocket disconnects | Hocuspocus not running | `npm run start` in hocuspocus-server |

---

## 📊 Hocuspocus Log Indicators

**✅ Good Signs:**
```
🔑 [JWT] Token valid for user ID: cf9e8404-...
✅ [JWT] Document access confirmed via shares
✅ [JWT] Access granted: cf9e8404-... → doc-id (editor)
✏️  Document updated: doc-id by User-cf9e8404
```

**❌ Bad Signs:**
```
❌ [JWT] Token invalid or expired: invalid signature  → SECRET_KEY mismatch
❌ [JWT] User undefined not in members              → Wrong JWT claim
❌ [JWT] User has no access to document             → Missing document share
```

---

## 🔄 CI/CD Integration

Add to GitHub Actions:
```yaml
# .github/workflows/collaboration-tests.yml
name: Collaboration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../hocuspocus-server && npm ci
      
      - name: Run collaboration tests
        run: cd frontend && npm run test -- --grep "collaboration"
```

---

## 📝 Quick Debug Commands

```bash
# Check Hocuspocus logs
tail -f /tmp/mdreader-hocuspocus.log

# Verify SECRET_KEY match
grep "^SECRET_KEY" backendv2/.env hocuspocus-server/.env

# Check WebSocket connections
lsof -i:1234

# Test backend JWT
curl -X POST http://localhost:7001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"naum@example.com","password":"password123"}'

# Decode JWT (paste token)
echo "YOUR_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq
```

---

*Last updated: December 28, 2025*
*Fixes applied: JWT claims, document shares, cache isolation, dotenv loading*

