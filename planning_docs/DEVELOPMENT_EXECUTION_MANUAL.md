# 🔧 **Development Execution Manual**

**Date**: December 10, 2025  
**Purpose**: Operational guide for continuous development  
**Status**: 🟢 **EXECUTION READY**

---

## 📋 **Table of Contents**

1. [Environment Setup](#1-environment-setup)
2. [Testing Protocols](#2-testing-protocols)
3. [Coding Patterns](#3-coding-patterns)
4. [Error Handling](#4-error-handling)
5. [Performance Benchmarks](#5-performance-benchmarks)
6. [Debug Playbook](#6-debug-playbook)
7. [Task Acceptance Criteria](#7-task-acceptance-criteria)
8. [Code Review Standards](#8-code-review-standards)
9. [Deployment Procedures](#9-deployment-procedures)
10. [Rollback Strategy](#10-rollback-strategy)

---

## 1. Environment Setup

### **1.1 Local Development Environment**

#### **Prerequisites**
```bash
# Required versions
node --version    # >= 18.0.0
python --version  # >= 3.10
docker --version  # >= 20.10.0
```

#### **One-Command Setup**
```bash
# Clone and setup
cd /Users/naum/Desktop/mdreader/mdreader-main

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Mac/Linux
pip install -r requirements.txt
alembic upgrade head

# Frontend setup
cd ../frontend
npm install

# Start services
docker-compose up -d  # PostgreSQL + Redis
```

#### **Verification**
```bash
# Check services
docker ps  # Should see: postgres, redis

# Test backend
cd backend
uvicorn app.main:app --reload --port 7001
# Visit: http://localhost:7001/docs

# Test frontend
cd frontend
npm run dev
# Visit: http://localhost:5173
```

---

### **1.2 Environment Variables**

Create `.env` files:

#### **Backend** (`backend/.env`)
```bash
# Database
DATABASE_URL=postgresql://mdreader:mdreader@localhost:5432/mdreader

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["http://localhost:5173","http://localhost:5174"]

# Environment
ENVIRONMENT=development
DEBUG=true
```

#### **Frontend** (`frontend/.env`)
```bash
VITE_API_BASE_URL=http://localhost:7001
VITE_WS_BASE_URL=ws://localhost:1234
VITE_ENVIRONMENT=development
```

---

### **1.3 Hocuspocus Server Setup** (Phase 1)

```bash
# Create hocuspocus-server directory
mkdir -p hocuspocus-server
cd hocuspocus-server

# Initialize Node.js project
npm init -y

# Install dependencies
npm install @hocuspocus/server @hocuspocus/extension-database
npm install @hocuspocus/extension-logger pg axios
npm install -D typescript @types/node ts-node

# TypeScript config
cat > tsconfig.json <<EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  }
}
EOF

# Create directory structure
mkdir -p src

# Run
npm run dev  # Starts on port 1234
```

---

## 2. Testing Protocols

### **2.1 Frontend Testing**

#### **Unit Tests**
```bash
# Run all unit tests
npm run test

# Run specific test file
npm run test -- useAuth.test.ts

# Watch mode (for TDD)
npm run test:watch

# Coverage report
npm run test:coverage

# Expected output:
# ✓ All tests passing (0 failed)
# Coverage: > 80%
```

#### **E2E Tests**
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test
npm run test:e2e -- guest-mode.spec.ts

# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Expected output:
# ✓ All tests passing
# Screenshots saved to: test-results/
```

#### **Linting**
```bash
# Check for linting errors
npm run lint

# Auto-fix
npm run lint:fix

# Expected output:
# ✓ 0 errors, 0 warnings
```

---

### **2.2 Backend Testing**

#### **Unit Tests**
```bash
cd backend

# Run all tests
pytest

# Run specific test file
pytest tests/test_document_service.py

# Run with coverage
pytest --cov=app --cov-report=html

# Expected output:
# ===== X passed in Y.YY seconds =====
# Coverage: > 80%
```

#### **Integration Tests**
```bash
# Run integration tests (requires Docker)
pytest tests/integration/

# Test specific endpoint
pytest tests/integration/test_auth_endpoints.py

# Expected output:
# ✓ All API endpoints responding
# ✓ Database operations working
```

#### **API Testing**
```bash
# Test with curl
curl -X POST http://localhost:7001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Expected: 200 OK with JWT tokens

# Automated API tests
cd backend/tests
pytest test_api_contracts.py -v
```

---

### **2.3 Performance Testing**

#### **Frontend Performance**
```bash
# Lighthouse audit
npm run audit:lighthouse

# Bundle size check
npm run build
du -sh dist/

# Expected:
# dist/ < 5MB (uncompressed)
# Lighthouse score > 90

# Real-time latency test
npm run test:latency

# Expected:
# Keystroke → Sync: < 100ms
```

#### **Backend Performance**
```bash
# Load testing with Locust
cd backend/tests/load
locust -f locustfile.py --host=http://localhost:7001

# Or with k6
k6 run load-test.js

# Expected:
# /api/v1/documents: < 100ms (p95)
# /api/v1/workspaces: < 50ms (p95)
# Error rate: < 0.1%
```

---

## 3. Coding Patterns

### **3.1 Frontend Patterns**

#### **Creating a New Hook**
```typescript
// frontend/src/hooks/useFeatureName.ts

import { useState, useEffect, useCallback } from 'react';

/**
 * useFeatureName Hook
 * 
 * Purpose: [Describe what this hook does]
 * Usage: const { data, loading, error, action } = useFeatureName();
 */
export function useFeatureName() {
  const [data, setData] = useState<Type | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiService.fetchData();
        setData(result);
        
      } catch (err: any) {
        console.error('[useFeatureName] Load failed:', err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Action handler
  const performAction = useCallback(async (param: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.performAction(param);
      setData(result);
      
      return result;
    } catch (err: any) {
      console.error('[useFeatureName] Action failed:', err);
      setError(err.message || 'Action failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    data,
    loading,
    error,
    performAction,
  };
}
```

#### **Creating a New Component**
```typescript
// frontend/src/components/feature/ComponentName.tsx

import { FC } from 'react';
import { cn } from '@/lib/utils';

interface ComponentNameProps {
  className?: string;
  onAction?: () => void;
}

/**
 * ComponentName
 * 
 * Purpose: [Describe component purpose]
 */
export const ComponentName: FC<ComponentNameProps> = ({
  className,
  onAction,
}) => {
  // State
  const [state, setState] = useState<Type>(initialValue);
  
  // Hooks
  const { data, loading } = useFeatureName();
  
  // Handlers
  const handleAction = useCallback(() => {
    try {
      // Logic here
      onAction?.();
    } catch (err) {
      console.error('[ComponentName] Action failed:', err);
    }
  }, [onAction]);
  
  // Loading state
  if (loading) {
    return <Skeleton />;
  }
  
  // Render
  return (
    <div className={cn('component-base-styles', className)}>
      {/* Component content */}
    </div>
  );
};
```

#### **Creating a New Service**
```typescript
// frontend/src/services/api/FeatureService.ts

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';

/**
 * FeatureService
 * 
 * Handles API calls for [feature name]
 */
class FeatureService {
  /**
   * Fetch items
   */
  async getItems(): Promise<Item[]> {
    try {
      const response = await apiClient.get<{ items: Item[] }>(
        API_ENDPOINTS.feature.list
      );
      return response.data.items;
    } catch (error: any) {
      console.error('[FeatureService] getItems failed:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch items');
    }
  }
  
  /**
   * Create item
   */
  async createItem(data: CreateItemRequest): Promise<Item> {
    try {
      const response = await apiClient.post<Item>(
        API_ENDPOINTS.feature.create,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('[FeatureService] createItem failed:', error);
      throw new Error(error.response?.data?.detail || 'Failed to create item');
    }
  }
}

export const featureService = new FeatureService();
```

---

### **3.2 Backend Patterns**

#### **Creating a New Service**
```python
# backend/app/services/feature_service.py

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from uuid import UUID

from app.models.feature import Feature
from app.schemas.feature import FeatureCreate, FeatureUpdate

class FeatureService:
    """
    Service for handling feature operations
    
    Responsibilities:
    - Business logic for features
    - Validation
    - Permissions checking
    - Database operations
    """
    
    @staticmethod
    def create_feature(
        db: Session,
        feature_data: FeatureCreate,
        user_id: UUID
    ) -> Feature:
        """
        Create a new feature
        
        Args:
            db: Database session
            feature_data: Feature creation data
            user_id: Current user ID
            
        Returns:
            Created feature
            
        Raises:
            ValueError: Invalid input
            PermissionError: No permission
        """
        try:
            # Validation
            if not feature_data.name:
                raise ValueError("Feature name is required")
            
            # Check permissions (example)
            # if not user.has_permission('create_feature'):
            #     raise PermissionError("No permission to create feature")
            
            # Create feature
            feature = Feature(
                name=feature_data.name,
                description=feature_data.description,
                created_by_id=user_id,
            )
            
            db.add(feature)
            db.flush()  # Get ID without committing
            
            # Additional operations (e.g., create related records)
            
            db.commit()
            db.refresh(feature)
            
            return feature
            
        except IntegrityError as e:
            db.rollback()
            raise ValueError(f"Database integrity error: {str(e)}")
        except Exception as e:
            db.rollback()
            raise
    
    @staticmethod
    def get_feature_by_id(
        db: Session,
        feature_id: UUID,
        user_id: UUID
    ) -> Optional[Feature]:
        """Get feature by ID with access check"""
        feature = db.query(Feature).filter(
            Feature.id == feature_id,
            Feature.is_deleted == False
        ).first()
        
        if not feature:
            return None
        
        # Check access
        # if not feature.can_user_access(user_id):
        #     return None
        
        return feature
```

#### **Creating a New Router**
```python
# backend/app/routers/feature.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.feature import (
    FeatureCreate,
    FeatureUpdate,
    FeatureResponse,
    FeatureListResponse,
)
from app.services.feature import FeatureService

router = APIRouter(prefix="/api/v1/features", tags=["Features"])


@router.post("", response_model=FeatureResponse, status_code=status.HTTP_201_CREATED)
async def create_feature(
    feature_data: FeatureCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new feature
    
    Requires authentication.
    """
    try:
        feature = FeatureService.create_feature(db, feature_data, current_user.id)
        return FeatureResponse.model_validate(feature)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/{feature_id}", response_model=FeatureResponse)
async def get_feature(
    feature_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get feature by ID"""
    try:
        feature_uuid = UUID(feature_id)
        feature = FeatureService.get_feature_by_id(db, feature_uuid, current_user.id)
        
        if not feature:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feature not found"
            )
        
        return FeatureResponse.model_validate(feature)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid feature ID"
        )
```

---

## 4. Error Handling

### **4.1 Frontend Error Handling**

#### **HTTP Error Handler**
```typescript
// frontend/src/services/api/ApiClient.ts

import axios, { AxiosError } from 'axios';

// Error types
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Global error handler
export const handleAPIError = (error: any): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail: string; code?: string }>;
    
    // Network error
    if (!axiosError.response) {
      throw new APIError(
        'Network error. Please check your connection.',
        0,
        'NETWORK_ERROR'
      );
    }
    
    // HTTP errors
    const status = axiosError.response.status;
    const detail = axiosError.response.data?.detail || 'Unknown error';
    const code = axiosError.response.data?.code;
    
    switch (status) {
      case 400:
        throw new APIError(detail, 400, code || 'BAD_REQUEST');
      
      case 401:
        // Unauthorized - trigger login
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new APIError('Session expired. Please log in again.', 401, 'UNAUTHORIZED');
      
      case 403:
        throw new APIError('You do not have permission to perform this action.', 403, 'FORBIDDEN');
      
      case 404:
        throw new APIError('Resource not found.', 404, 'NOT_FOUND');
      
      case 409:
        throw new APIError(detail, 409, code || 'CONFLICT');
      
      case 422:
        throw new APIError('Validation error: ' + detail, 422, 'VALIDATION_ERROR', axiosError.response.data);
      
      case 500:
        throw new APIError('Server error. Please try again later.', 500, 'INTERNAL_ERROR');
      
      default:
        throw new APIError(detail, status, 'UNKNOWN_ERROR');
    }
  }
  
  // Non-Axios errors
  throw new APIError(
    error.message || 'An unexpected error occurred.',
    0,
    'UNKNOWN_ERROR'
  );
};

// Usage in API client
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    handleAPIError(error);
  }
);
```

#### **Component Error Boundary**
```typescript
// frontend/src/components/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    // Send to error tracking (Sentry, etc.)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="space-x-4">
              <Button onClick={this.handleReset}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### **4.2 Backend Error Handling**

#### **Custom Exceptions**
```python
# backend/app/exceptions.py

class MDReaderException(Exception):
    """Base exception for MDReader"""
    def __init__(self, message: str, code: str = "UNKNOWN_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class ValidationError(MDReaderException):
    """Raised when validation fails"""
    def __init__(self, message: str, field: str = None):
        self.field = field
        super().__init__(message, "VALIDATION_ERROR")


class NotFoundError(MDReaderException):
    """Raised when resource not found"""
    def __init__(self, resource: str, resource_id: str = None):
        message = f"{resource} not found"
        if resource_id:
            message += f": {resource_id}"
        super().__init__(message, "NOT_FOUND")


class PermissionDeniedError(MDReaderException):
    """Raised when user lacks permission"""
    def __init__(self, action: str, resource: str = None):
        message = f"Permission denied: {action}"
        if resource:
            message += f" on {resource}"
        super().__init__(message, "PERMISSION_DENIED")


class ConflictError(MDReaderException):
    """Raised when resource conflict occurs"""
    def __init__(self, message: str):
        super().__init__(message, "CONFLICT")
```

#### **Global Exception Handler**
```python
# backend/app/main.py

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError

from app.exceptions import (
    MDReaderException,
    ValidationError,
    NotFoundError,
    PermissionDeniedError,
    ConflictError,
)

app = FastAPI()

@app.exception_handler(MDReaderException)
async def mdreader_exception_handler(request: Request, exc: MDReaderException):
    """Handle custom MDReader exceptions"""
    status_code = {
        "VALIDATION_ERROR": status.HTTP_400_BAD_REQUEST,
        "NOT_FOUND": status.HTTP_404_NOT_FOUND,
        "PERMISSION_DENIED": status.HTTP_403_FORBIDDEN,
        "CONFLICT": status.HTTP_409_CONFLICT,
    }.get(exc.code, status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return JSONResponse(
        status_code=status_code,
        content={
            "detail": exc.message,
            "code": exc.code,
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "code": "VALIDATION_ERROR",
            "errors": errors,
        }
    )


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    """Handle database integrity errors"""
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "detail": "Database integrity error. Resource may already exist.",
            "code": "INTEGRITY_ERROR",
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler"""
    # Log to error tracking
    import traceback
    print(f"Unhandled exception: {exc}")
    print(traceback.format_exc())
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal error occurred. Please try again later.",
            "code": "INTERNAL_ERROR",
        }
    )
```

---

## 5. Performance Benchmarks

### **5.1 Frontend Performance Targets**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **First Contentful Paint** | < 1.5s | Lighthouse |
| **Time to Interactive** | < 3.0s | Lighthouse |
| **Largest Contentful Paint** | < 2.5s | Lighthouse |
| **Cumulative Layout Shift** | < 0.1 | Lighthouse |
| **Bundle Size** | < 5MB | `npm run build && du -sh dist/` |
| **Keystroke Latency** | < 50ms | Custom benchmark |
| **Yjs Sync Latency** | < 100ms | Custom benchmark |

#### **Measurement Script**
```bash
# frontend/scripts/benchmark.sh

#!/bin/bash

echo "Running performance benchmarks..."

# Lighthouse audit
npm run build
npx lighthouse http://localhost:5173 \
  --output html \
  --output-path ./lighthouse-report.html \
  --chrome-flags="--headless"

# Bundle size
echo "Bundle size:"
du -sh dist/

# Check thresholds
BUNDLE_SIZE=$(du -s dist/ | awk '{print $1}')
if [ $BUNDLE_SIZE -gt 5000 ]; then
  echo "❌ Bundle size exceeds 5MB"
  exit 1
fi

echo "✅ All benchmarks passed"
```

---

### **5.2 Backend Performance Targets**

| Endpoint | Target (p95) | Load Test |
|----------|-------------|-----------|
| **POST /auth/login** | < 200ms | 100 req/s |
| **GET /workspaces** | < 50ms | 500 req/s |
| **GET /documents/{id}** | < 100ms | 1000 req/s |
| **PATCH /documents/{id}** | < 150ms | 500 req/s |
| **POST /documents** | < 200ms | 200 req/s |

#### **Load Test Script** (k6)
```javascript
// backend/tests/load/load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp up
    { duration: '1m', target: 500 },   // Sustained load
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'],  // 95% < 100ms
    http_req_failed: ['rate<0.01'],    // < 1% error rate
  },
};

const BASE_URL = 'http://localhost:7001';

export default function () {
  // Login
  let loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'Test123!',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });
  
  let token = loginRes.json('access_token');
  
  // Get workspaces
  let workspacesRes = http.get(`${BASE_URL}/api/v1/workspaces`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  check(workspacesRes, {
    'workspaces retrieved': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  sleep(1);
}
```

---

## 6. Debug Playbook

### **6.1 Hocuspocus Connection Issues**

#### **Symptom**: Frontend can't connect to Hocuspocus

**Debug Steps**:
```bash
# 1. Check if Hocuspocus is running
docker ps | grep hocuspocus
# OR
curl http://localhost:1234
# Expected: Connection response

# 2. Check Hocuspocus logs
docker logs hocuspocus -f

# 3. Check JWT token validity
# In frontend console:
localStorage.getItem('access_token')
# Decode at jwt.io - check expiration

# 4. Test WebSocket manually
wscat -c ws://localhost:1234
# Should connect

# 5. Check CORS/network
# Browser DevTools → Network → WS tab
# Look for connection errors
```

**Common Fixes**:
```bash
# Restart Hocuspocus
docker-compose restart hocuspocus

# Rebuild Hocuspocus
cd hocuspocus-server
npm run build
docker-compose up -d --build

# Check environment variables
cat hocuspocus-server/.env
```

---

### **6.2 IndexedDB Quota Exceeded**

#### **Symptom**: "QuotaExceededError" in browser console

**Debug Steps**:
```javascript
// Check current usage
if (navigator.storage && navigator.storage.estimate) {
  navigator.storage.estimate().then(({ usage, quota }) => {
    console.log(`Using ${usage} of ${quota} bytes (${(usage/quota*100).toFixed(2)}%)`);
  });
}
```

**Fix**:
```typescript
// Prompt user to sync to cloud
if (usagePercent > 80) {
  showDialog({
    title: 'Storage Almost Full',
    message: 'Your local storage is 80% full. Sync to cloud to free up space?',
    actions: [
      { label: 'Sync to Cloud', onClick: () => syncToCloud() },
      { label: 'Delete Old Documents', onClick: () => showDeleteDialog() },
    ],
  });
}
```

---

### **6.3 Real-Time Sync Not Working**

#### **Symptom**: User A types, User B doesn't see changes

**Debug Steps**:
```javascript
// Frontend console
const provider = window.__HOCUSPOCUS_PROVIDER__;
console.log('Connected:', provider.isConnected);
console.log('Synced:', provider.isSynced);
console.log('Awareness:', provider.awareness.getStates());

// Check network traffic
// DevTools → Network → WS → Messages tab
// Should see binary messages flowing
```

**Common Fixes**:
```typescript
// Reconnect provider
provider.disconnect();
await new Promise(r => setTimeout(r, 1000));
provider.connect();

// Check if Y.Doc is bound correctly
const ydoc = editor.extensionManager.extensions.find(
  ext => ext.name === 'collaboration'
)?.options.document;
console.log('Y.Doc:', ydoc);
```

---

### **6.4 Database Migration Failures**

#### **Symptom**: Alembic migration fails

**Debug Steps**:
```bash
# Check current migration version
cd backend
alembic current

# Check pending migrations
alembic heads

# Inspect migration file
cat alembic/versions/xxxxx_migration_name.py
```

**Fix**:
```bash
# Rollback one version
alembic downgrade -1

# Fix migration file
# Then re-run
alembic upgrade head

# If stuck, reset (DANGEROUS - only in dev)
alembic downgrade base
alembic upgrade head
```

---

## 7. Task Acceptance Criteria

### **Phase 0: Task 0.1 - Landing Page Enhancement**

**Done When**:
- [ ] User visits `/` → New landing page appears
- [ ] "Start Writing (No Login)" button visible
- [ ] Click button → Navigates to `/guest/editor`
- [ ] File drop zone functional → Triggers guest editor
- [ ] Test passes: `npm run test:e2e -- landing.spec.ts`
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] Code coverage > 80%
- [ ] No linter errors: `npm run lint`

---

### **Phase 0: Task 0.2 - Guest Mode Context**

**Done When**:
- [ ] `GuestModeContext.tsx` created and exports context
- [ ] `useGuestMode()` hook functional
- [ ] Guest documents stored in IndexedDB (test with DevTools)
- [ ] Close/reopen browser → Guest docs persist
- [ ] Test passes: `npm run test -- GuestModeContext.test.ts`
- [ ] Can create 10+ guest documents without errors
- [ ] "Login to Sync" banner appears when guest has documents
- [ ] Code coverage > 80%

---

### **Phase 1: Task 1.1 - Hocuspocus Server**

**Done When**:
- [ ] `hocuspocus-server/` directory created
- [ ] Server starts: `npm run dev` → Port 1234 listening
- [ ] `curl http://localhost:1234` → Connection response
- [ ] WebSocket connection works: `wscat -c ws://localhost:1234`
- [ ] JWT authentication functional (401 without token, 200 with valid token)
- [ ] Document state persists to PostgreSQL `document_collab_state` table
- [ ] Load test passes: `k6 run load-test.js` (< 100ms p95)
- [ ] Docker build successful: `docker build -t hocuspocus .`
- [ ] Logs visible: `docker logs hocuspocus` shows activity

---

### **Phase 1: Task 1.2 - Yjs Integration**

**Done When**:
- [ ] `useYjsDocument.ts` hook created
- [ ] Creates Y.Doc instance
- [ ] IndexedDB persistence works (y-indexeddb)
- [ ] Connects to Hocuspocus when online
- [ ] Test: Go offline → Edit → Go online → Syncs
- [ ] Test passes: `npm run test -- useYjsDocument.test.ts`
- [ ] DevTools → Application → IndexedDB shows `yjs-doc-{id}` database
- [ ] No memory leaks (open/close document 100 times)

---

### **Phase 1: Task 1.3 - TipTap + Yjs Binding**

**Done When**:
- [ ] TipTap editor bound to Yjs Y.Doc
- [ ] Two browser windows → Real-time sync (< 100ms)
- [ ] Collaborative cursors visible (shows other user's cursor)
- [ ] Test: User A types "Hello" → User B sees "Hello"
- [ ] Test: Both type simultaneously → No conflict (CRDT merge)
- [ ] Offline edits sync on reconnect
- [ ] Test passes: `npm run test:e2e -- collaboration.spec.ts`
- [ ] Performance: Keystroke → Sync latency < 100ms

---

## 8. Code Review Standards

### **8.1 Code Review Checklist**

**Before Requesting Review**:
- [ ] All tests passing: `npm run test`
- [ ] No linter errors: `npm run lint`
- [ ] Code coverage > 80%: `npm run test:coverage`
- [ ] No console errors in browser
- [ ] Performance benchmarks pass
- [ ] Code follows patterns in this manual
- [ ] All TODOs addressed or documented
- [ ] Comments added for complex logic

**Reviewer Checks**:
- [ ] Code follows DRY principle
- [ ] Error handling implemented correctly
- [ ] Security considerations addressed (XSS, SQL injection, etc.)
- [ ] Performance considerations (no N+1 queries, etc.)
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Mobile responsive (if UI change)
- [ ] Tests cover edge cases
- [ ] Documentation updated

---

### **8.2 Security Review Checklist**

**Every PR Must Check**:
- [ ] No hardcoded secrets (API keys, passwords)
- [ ] User input sanitized (XSS prevention)
- [ ] SQL parameterized (injection prevention)
- [ ] JWT tokens validated
- [ ] CORS properly configured
- [ ] Rate limiting on auth endpoints
- [ ] File uploads validated (type, size, content)
- [ ] Error messages don't leak sensitive info

---

## 9. Deployment Procedures

### **9.1 Phase 0 Deployment** (Guest Mode)

```bash
# 1. Final testing
npm run test
npm run test:e2e
npm run lint

# 2. Build frontend
cd frontend
npm run build

# 3. Verify build
ls -lh dist/
# Should see index.html, assets/

# 4. Test production build locally
npm run preview
# Visit http://localhost:4173

# 5. Deploy (example: Vercel)
vercel deploy --prod

# 6. Smoke test production
curl https://mdreader.app
# Expected: 200 OK

# 7. Monitor errors (Sentry)
# Check Sentry dashboard for new errors
```

---

### **9.2 Phase 1 Deployment** (Hocuspocus)

```bash
# 1. Build Hocuspocus server
cd hocuspocus-server
npm run build

# 2. Build Docker image
docker build -t mdreader-hocuspocus:v1.0.0 .

# 3. Test Docker image locally
docker run -p 1234:1234 \
  -e DATABASE_URL=postgresql://... \
  mdreader-hocuspocus:v1.0.0

# 4. Push to registry
docker push registry.example.com/mdreader-hocuspocus:v1.0.0

# 5. Deploy to server
# (Kubernetes, Docker Compose, or cloud provider)

# 6. Verify deployment
curl http://hocuspocus.example.com:1234
wscat -c ws://hocuspocus.example.com:1234

# 7. Update frontend environment
# VITE_WS_BASE_URL=wss://hocuspocus.example.com
```

---

## 10. Rollback Strategy

### **10.1 Frontend Rollback**

```bash
# If Phase 0 deployment breaks production:

# 1. Identify last working version
git log --oneline

# 2. Revert to previous commit
git revert <commit-hash>

# 3. Rebuild and redeploy
npm run build
vercel deploy --prod

# 4. Verify
curl https://mdreader.app
# Check: Landing page works, no console errors
```

---

### **10.2 Backend Rollback**

```bash
# If database migration breaks:

# 1. Rollback migration
cd backend
alembic downgrade -1

# 2. Verify database state
psql mdreader -c "SELECT version_num FROM alembic_version;"

# 3. Restart backend with previous code
git checkout <previous-commit>
docker-compose restart backend

# 4. Verify API
curl http://localhost:7001/api/v1/health
```

---

### **10.3 Hocuspocus Rollback**

```bash
# If Hocuspocus v1.1.0 breaks:

# 1. Rollback to previous version
docker pull registry.example.com/mdreader-hocuspocus:v1.0.0

# 2. Restart with old version
docker-compose down
docker-compose up -d

# 3. Verify
wscat -c ws://localhost:1234
# Should connect successfully

# 4. Check document syncing
# Open two browser windows, test real-time sync
```

---

## 📋 **Quick Reference Card**

### **Common Commands**

```bash
# Start all services
docker-compose up -d
cd backend && uvicorn app.main:app --reload --port 7001 &
cd frontend && npm run dev

# Run all tests
cd frontend && npm run test && npm run test:e2e
cd backend && pytest

# Check code quality
npm run lint
npm run test:coverage

# Performance check
npm run audit:lighthouse
k6 run backend/tests/load/load-test.js

# Debug
docker logs -f hocuspocus
docker logs -f postgres
```

### **Important Endpoints**

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:7001/docs`
- Hocuspocus: `ws://localhost:1234`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

---

**Status**: 🟢 **READY FOR EXECUTION**  
**Version**: 1.0  
**Last Updated**: December 10, 2025

