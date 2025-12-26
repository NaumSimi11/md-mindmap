# 🛡️ Comprehensive Testing Strategy

**Goal**: Make it **impossible** for future developers to break the system without knowing immediately.

---

## Why E2E Tests Alone Are Not Enough

| Layer | E2E Catches | E2E Misses |
|-------|-------------|------------|
| UI | ✅ Buttons work | ❌ Edge cases in logic |
| Business Logic | ✅ Happy path | ❌ Race conditions |
| Data Layer | ✅ Basic CRUD | ❌ Data corruption |
| API Contracts | ❌ Buried under UI | ❌ Breaking changes |
| Performance | ❌ Too slow to test | ❌ Memory leaks |
| Security | ❌ Can't test auth bypass | ❌ Injection attacks |

**E2E tests are the TOP of the testing pyramid. You need all layers.**

---

## 🔺 The Testing Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │  ← 10% (slow, expensive)
                    │   (Playwright)  │
                    └────────┬────────┘
                             │
                 ┌───────────┴───────────┐
                 │  Integration Tests    │  ← 30%
                 │  (API + DB together)  │
                 └───────────┬───────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │           Unit Tests                     │  ← 60% (fast, cheap)
        │  (Pure functions, isolated components)  │
        └──────────────────────────────────────────┘
```

---

## 📊 Current State Analysis

### Backend (Python/FastAPI)

| Category | Files | Tests | Coverage |
|----------|-------|-------|----------|
| Workspaces | 1 | 44 | ✅ Good |
| Documents | 1 | 98 | ✅ Good |
| Folders | 1 | 104 | ✅ Good |
| Shares | 1 | 126 | ✅ Good |
| Share Links | 1 | 72 | ✅ Good |
| Snapshots | 1 | 138 | ✅ Good |
| Workspace Members | 1 | 23 | ⚠️ Needs more |
| Hocuspocus Auth | 1 | 61 | ✅ Good |
| **Total** | 10 | ~760 | ✅ Excellent |

### Frontend (TypeScript/React)

| Category | Files | Tests | Coverage |
|----------|-------|-------|----------|
| Sync Services | 4 | ~40 | ⚠️ Partial |
| Stores | 2 | ~10 | ⚠️ Minimal |
| Utilities | 1 | ~5 | ⚠️ Minimal |
| Editor | 2 | ~15 | ⚠️ Minimal |
| **Total** | 14 | ~70 | ❌ Poor |

### E2E (Playwright)

| Category | Files | Tests | Status |
|----------|-------|-------|--------|
| Local-First | 1 | 4 | ✅ Active |
| Sync Status | 1 | 2 | ⚠️ Partial (3 skipped) |
| Guest-Auth | 1 | 0 | ❌ All skipped |
| Negative Cases | 1 | ? | ⚠️ Unknown |
| **Total** | 7 | ~10 | ❌ Poor |

---

## 🎯 Comprehensive Strategy

### Layer 1: Contract Tests (API First)

**What**: Verify API contracts between frontend and backend never break.

**Why**: The #1 cause of production bugs is contract mismatches.

```typescript
// tests/contracts/document-api.contract.ts
import { z } from 'zod';

// This is the contract - if backend changes, test fails
const DocumentResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  workspace_id: z.string().uuid(),
  content_type: z.enum(['markdown', 'text', 'json']),
  version: z.number(),
  yjs_version: z.number().optional(),
  yjs_state_b64: z.string().optional(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  is_deleted: z.boolean(),
});

test('GET /documents/:id returns valid document', async () => {
  const response = await api.get(`/documents/${docId}`);
  
  // This fails immediately if contract changes
  const result = DocumentResponseSchema.safeParse(response.data);
  expect(result.success).toBe(true);
});
```

**Implementation**: Create `tests/contracts/` directory with schemas for all API endpoints.

---

### Layer 2: Unit Tests (Business Logic)

**What**: Test pure functions in isolation.

**Critical Missing Tests**:

```typescript
// frontend/src/services/workspace/__tests__/

// 1. ID Normalization (Bug #1, #7 source)
describe('ID Normalization', () => {
  test('extractUUID removes doc_ prefix', () => {
    expect(extractUUID('doc_123e4567-...')).toBe('123e4567-...');
  });
  
  test('extractUUID handles already-bare UUID', () => {
    expect(extractUUID('123e4567-...')).toBe('123e4567-...');
  });
  
  test('toCloudId normalizes for API calls', () => {
    expect(toCloudId('doc_abc')).toBe('abc');
    expect(toCloudId('abc')).toBe('abc');
  });
});

// 2. Sync Status Logic
describe('SyncStatus Determination', () => {
  test('new document is local', () => {
    const doc = createDocument({});
    expect(doc.syncStatus).toBe('local');
  });
  
  test('pushed document is synced', () => {
    const doc = markAsSynced(localDoc);
    expect(doc.syncStatus).toBe('synced');
  });
});

// 3. Document Merge Logic
describe('Document Merging', () => {
  test('cloud doc takes precedence for synced docs', () => {
    const local = { id: '1', syncStatus: 'synced', title: 'Local' };
    const cloud = { id: '1', title: 'Cloud' };
    const merged = mergeDocuments(local, cloud);
    expect(merged.title).toBe('Cloud');
  });
  
  test('local doc preserved for pending docs', () => {
    const local = { id: '1', syncStatus: 'local', title: 'Local' };
    const merged = mergeDocuments(local, null);
    expect(merged.title).toBe('Local');
  });
});
```

**Target Coverage**: 80% for `services/`, `utils/`, `hooks/`

---

### Layer 3: Integration Tests (Components + Services)

**What**: Test React components with their dependencies.

```typescript
// frontend/src/__tests__/integration/document-creation.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewDocumentModal } from '@/components/workspace/NewDocumentModal';
import { AppDataProvider } from '@/contexts/AppDataProvider';

describe('Document Creation Flow', () => {
  test('creates document and appears in context', async () => {
    const user = userEvent.setup();
    
    render(
      <AppDataProvider>
        <NewDocumentModal open={true} />
        <DocumentList /> {/* Consumes context */}
      </AppDataProvider>
    );
    
    await user.type(screen.getByTestId('document-title-input'), 'Test Doc');
    await user.click(screen.getByTestId('create-blank-markdown'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Doc')).toBeInTheDocument();
    });
  });
});
```

---

### Layer 4: Backend Unit Tests

**What**: Test Python service functions in isolation.

**Critical Missing Tests**:

```python
# backendv2/tests/unit/test_batch_service.py

import pytest
from app.services.batch_service import BatchService

class TestBatchService:
    """Unit tests for batch document sync"""
    
    async def test_batch_create_documents(self, test_db, test_user):
        """Test creating multiple documents in batch"""
        batch_input = BatchSyncInput(
            documents=[
                BatchDocumentInput(id="doc1", title="Doc 1", content=""),
                BatchDocumentInput(id="doc2", title="Doc 2", content=""),
            ]
        )
        
        result = await BatchService.sync_documents(test_db, test_user.id, batch_input)
        
        assert len(result.synced) == 2
        assert len(result.failed) == 0
    
    async def test_batch_handles_partial_failure(self, test_db, test_user):
        """One doc fails, others succeed"""
        batch_input = BatchSyncInput(
            documents=[
                BatchDocumentInput(id="valid", title="Valid", content=""),
                BatchDocumentInput(id="invalid", title="", content=""),  # Invalid
            ]
        )
        
        result = await BatchService.sync_documents(test_db, test_user.id, batch_input)
        
        assert len(result.synced) == 1
        assert len(result.failed) == 1
```

---

### Layer 5: State Invariant Tests

**What**: Ensure state never enters invalid configurations.

```typescript
// frontend/src/__tests__/invariants/state-invariants.test.ts

describe('State Invariants', () => {
  test('document cannot be synced without cloudId', () => {
    const doc = { syncStatus: 'synced', cloudId: undefined };
    expect(isValidState(doc)).toBe(false);
  });
  
  test('two documents cannot have same ID', async () => {
    await createDocument({ id: 'doc_123' });
    await expect(createDocument({ id: 'doc_123' })).rejects.toThrow();
  });
  
  test('deleting workspace deletes its documents', async () => {
    const ws = await createWorkspace();
    const doc = await createDocument({ workspaceId: ws.id });
    await deleteWorkspace(ws.id);
    
    const orphanDocs = await getDocumentsByWorkspace(ws.id);
    expect(orphanDocs).toHaveLength(0);
  });
});
```

---

### Layer 6: Security Tests

**What**: Verify authorization and data isolation.

```python
# backendv2/tests/security/test_authorization.py

class TestDocumentAuthorization:
    """Verify users can only access their own data"""
    
    async def test_user_cannot_read_others_document(self, client, user_a_headers, user_b_doc):
        """User A cannot read User B's private document"""
        response = await client.get(
            f"/api/v1/documents/{user_b_doc.id}",
            headers=user_a_headers
        )
        assert response.status_code == 403
    
    async def test_user_cannot_delete_others_document(self, client, user_a_headers, user_b_doc):
        """User A cannot delete User B's document"""
        response = await client.delete(
            f"/api/v1/documents/{user_b_doc.id}",
            headers=user_a_headers
        )
        assert response.status_code == 403
    
    async def test_viewer_cannot_edit_document(self, client, viewer_headers, shared_doc):
        """Viewer role cannot modify document"""
        response = await client.patch(
            f"/api/v1/documents/{shared_doc.id}",
            json={"title": "Hacked"},
            headers=viewer_headers
        )
        assert response.status_code == 403
```

---

### Layer 7: Performance Tests

**What**: Ensure operations complete within acceptable time.

```typescript
// frontend/src/__tests__/performance/load-time.test.ts

describe('Performance Invariants', () => {
  test('document list loads under 200ms', async () => {
    const start = performance.now();
    await guestWorkspaceService.getDocuments(workspaceId);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(200);
  });
  
  test('document switch under 100ms', async () => {
    const start = performance.now();
    await selectDocument(docId);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
  
  test('Yjs hydration under 500ms for 100KB doc', async () => {
    const largeDoc = generateLargeDocument(100 * 1024);
    
    const start = performance.now();
    await yjsHydrationService.hydrateDocument(ydoc, largeDoc);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(500);
  });
});
```

---

### Layer 8: Regression Tests

**What**: Test for every bug that was fixed.

```typescript
// frontend/src/__tests__/regression/

// Bug #1: Documents not loading on initial page load
test('REGRESSION-001: Documents load on /workspace route', async () => {
  // This was broken because refreshDocuments wasn't called on mount
});

// Bug #3: Content loss after push to cloud
test('REGRESSION-003: Content preserved after push to cloud', async () => {
  // This was broken because Yjs instance wasn't cleared
});

// Bug #7: Content divergence due to two Yjs instances
test('REGRESSION-007: Single Yjs instance per logical document', async () => {
  const instance1 = yjsDocumentManager.getDocument('doc_123');
  const instance2 = yjsDocumentManager.getDocument('123');
  expect(instance1.ydoc).toBe(instance2.ydoc); // Same instance
});
```

---

### Layer 9: Mutation Testing

**What**: Verify tests actually catch bugs by introducing mutations.

```bash
# Install Stryker for mutation testing
npm install --save-dev @stryker-mutator/core @stryker-mutator/typescript-checker

# Run mutation tests
npx stryker run
```

**What it does**: Automatically changes code (mutations) and verifies tests fail.

Example mutations:
- `if (a > b)` → `if (a < b)` 
- `return true` → `return false`
- `syncStatus: 'synced'` → `syncStatus: 'local'`

If tests still pass after mutation → **tests are weak**.

---

## 🎯 Implementation Priority

### Week 1: Foundation
| Task | Type | Priority |
|------|------|----------|
| Add contract tests for all API endpoints | Contract | P0 |
| Add unit tests for `extractUUID`, `toCloudId` | Unit | P0 |
| Add unit tests for sync status logic | Unit | P0 |
| Add regression tests for bugs #1-#10 | Regression | P0 |

### Week 2: Critical Paths
| Task | Type | Priority |
|------|------|----------|
| Add integration tests for document creation | Integration | P0 |
| Add integration tests for workspace switching | Integration | P0 |
| Add security tests for authorization | Security | P0 |

### Week 3: E2E
| Task | Type | Priority |
|------|------|----------|
| Implement Guest Mode E2E (from E2E_TESTING_PLAN.md) | E2E | P1 |
| Add data-testid to all UI components | E2E | P1 |

### Week 4: Auth + Cloud
| Task | Type | Priority |
|------|------|----------|
| Implement Auth E2E tests | E2E | P1 |
| Implement Push-to-Cloud E2E tests | E2E | P1 |
| Unblock skipped tests | E2E | P1 |

### Week 5: Advanced
| Task | Type | Priority |
|------|------|----------|
| Add performance tests | Performance | P2 |
| Add collaboration E2E tests | E2E | P2 |
| Setup mutation testing | Quality | P2 |

---

## 📁 Final Test Structure

```
mdreader-main/
├── tests/
│   ├── contracts/                  # API contract tests
│   │   ├── document-api.contract.ts
│   │   ├── workspace-api.contract.ts
│   │   └── auth-api.contract.ts
│   │
│   └── e2e/                        # Playwright E2E
│       ├── guest/
│       ├── authenticated/
│       ├── invariants/
│       └── helpers/
│
├── frontend/src/
│   └── __tests__/
│       ├── unit/                   # Pure function tests
│       │   ├── id-generator.test.ts
│       │   ├── sync-status.test.ts
│       │   └── document-merge.test.ts
│       │
│       ├── integration/            # Component + service tests
│       │   ├── document-creation.test.tsx
│       │   ├── workspace-switching.test.tsx
│       │   └── push-to-cloud.test.tsx
│       │
│       ├── invariants/             # State invariant tests
│       │   └── state-invariants.test.ts
│       │
│       ├── performance/            # Performance tests
│       │   └── load-time.test.ts
│       │
│       └── regression/             # Bug regression tests
│           └── fixed-bugs.test.ts
│
└── backendv2/tests/
    ├── unit/                       # Python unit tests
    │   ├── test_batch_service.py
    │   └── test_email_service.py
    │
    ├── integration/                # Existing integration tests
    │   └── ...
    │
    ├── security/                   # Authorization tests
    │   └── test_authorization.py
    │
    └── performance/                # Backend performance
        └── test_api_latency.py
```

---

## ✅ Definition of "Can't Break"

A system is considered **unbreakable** when:

| Check | Verification |
|-------|--------------|
| ✅ All API contracts validated | Contract tests pass |
| ✅ All business logic tested | Unit test coverage > 80% |
| ✅ All critical paths tested | Integration tests pass |
| ✅ All user journeys tested | E2E tests pass |
| ✅ All past bugs have tests | Regression tests pass |
| ✅ All auth rules enforced | Security tests pass |
| ✅ Performance acceptable | Performance tests pass |
| ✅ Tests catch real bugs | Mutation score > 70% |

---

## 🏃 CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Complete Test Suite

on: [push, pull_request]

jobs:
  contracts:
    name: Contract Tests
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:contracts

  unit-frontend:
    name: Frontend Unit Tests
    runs-on: ubuntu-latest
    steps:
      - run: cd frontend && npm run test:coverage
      - run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi

  unit-backend:
    name: Backend Unit Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: mdreader_test
    steps:
      - run: cd backendv2 && pytest tests/ -v --cov=app --cov-fail-under=80

  integration:
    name: Integration Tests
    needs: [contracts, unit-frontend, unit-backend]
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:integration

  e2e:
    name: E2E Tests
    needs: [integration]
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:e2e

  security:
    name: Security Tests
    needs: [integration]
    runs-on: ubuntu-latest
    steps:
      - run: cd backendv2 && pytest tests/security/ -v

  # Block merge if any job fails
  required-checks:
    name: All Tests Must Pass
    needs: [contracts, unit-frontend, unit-backend, integration, e2e, security]
    runs-on: ubuntu-latest
    steps:
      - run: echo "All tests passed!"
```

---

## Summary

| Layer | Purpose | Catches |
|-------|---------|---------|
| **Contract Tests** | API shape never changes | Breaking changes |
| **Unit Tests** | Functions work correctly | Logic bugs |
| **Integration Tests** | Components work together | Wiring bugs |
| **E2E Tests** | User journeys work | UX regressions |
| **Regression Tests** | Past bugs stay fixed | Reintroduced bugs |
| **Security Tests** | Auth rules enforced | Access violations |
| **Performance Tests** | Speed is acceptable | Slowdowns |
| **Mutation Tests** | Tests are meaningful | Weak tests |

**E2E alone = 10% confidence**  
**Full pyramid = 95% confidence**

The only thing this doesn't catch:
- Novel bugs never seen before
- Third-party dependency issues
- Infrastructure failures

But those are handled by monitoring, not testing.

