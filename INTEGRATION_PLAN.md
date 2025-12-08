# 🚀 Frontend-Backend Integration Plan

## ✅ Current Status

### Backend (Port 8000) - **RUNNING** ✅
- FastAPI server with hot reload
- PostgreSQL database (port 7432)
- Redis cache (port 7379)
- All migrations applied
- Full API with auth, workspaces, documents, WebSockets

### Frontend (Port 5173) - **RUNNING** ✅
- React + Vite + TypeScript
- Currently using LocalStorage
- Beautiful UI with Tailwind + shadcn/ui
- AI integration ready

### API Integration Layer - **COMPLETED** ✅
- ✅ API configuration (`src/config/api.config.ts`)
- ✅ API client with auth (`src/services/api/ApiClient.ts`)
- ✅ Auth service (`src/services/api/AuthService.ts`)
- ✅ Workspace service (`src/services/api/WorkspaceService.ts`)
- ✅ Document service (`src/services/api/DocumentService.ts`)
- ✅ TypeScript types (`src/types/api.types.ts`)
- ✅ React auth hook (`src/hooks/useAuth.ts`)
- ✅ Environment variables (`.env`)

---

## 📋 Next Steps

### Phase 1: Authentication UI (2-3 hours)
**Status**: Ready to implement

**Tasks**:
1. Create login page component
2. Create signup page component
3. Add protected route wrapper
4. Update App.tsx with auth routing
5. Add user menu in header

**Files to Create**:
- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/components/layout/UserMenu.tsx`

**Test**:
- Sign up new user
- Login with credentials
- Access protected routes
- Logout functionality

---

### Phase 2: Workspace Integration (2-3 hours)
**Status**: Pending Phase 1

**Tasks**:
1. Update WorkspaceService to use backend API
2. Create workspace selector component
3. Sync local workspaces with backend
4. Add workspace creation/management UI

**Files to Modify**:
- `src/services/workspace/WorkspaceService.ts`
- `src/pages/Workspace.tsx`
- Add workspace switcher to header

**Test**:
- Create workspace
- List workspaces
- Switch between workspaces
- Update workspace settings

---

### Phase 3: Document Sync (3-4 hours)
**Status**: Pending Phase 2

**Tasks**:
1. Replace LocalStorage with backend API calls
2. Implement auto-save functionality
3. Add version history UI
4. Handle offline/online states

**Files to Modify**:
- `src/services/storage/StorageService.ts`
- `src/pages/Editor.tsx`
- `src/hooks/useDocument.ts` (create new)

**Features**:
- Auto-save every 2 seconds
- Version history sidebar
- Conflict resolution
- Offline mode with sync

**Test**:
- Create/edit documents
- Auto-save works
- Version history
- Restore previous versions

---

### Phase 4: Real-Time Collaboration (4-5 hours)
**Status**: Pending Phase 3

**Tasks**:
1. Create WebSocket service
2. Implement presence indicators
3. Add live cursor tracking
4. Sync document changes in real-time

**Files to Create**:
- `src/services/api/WebSocketService.ts`
- `src/hooks/useCollaboration.ts`
- `src/components/editor/PresenceIndicators.tsx`

**Features**:
- See who's online
- Live cursor positions
- Real-time updates
- Conflict-free editing (CRDT)

**Test**:
- Open same document in 2 browsers
- See presence indicators
- Type and see live updates
- Cursor tracking

---

### Phase 5: Polish & Testing (2-3 hours)
**Status**: Pending Phase 4

**Tasks**:
1. Error handling & user feedback
2. Loading states & skeletons
3. Offline mode indicators
4. E2E testing

**Test Scenarios**:
- Full user journey (signup → create workspace → create document → collaborate)
- Error cases (network failure, auth expiry)
- Performance (large documents, many users)
- Mobile responsiveness

---

## 🎯 Quick Start Guide

### For You (Developer)

**1. Test Backend API** (5 minutes)
```bash
# Backend is already running on port 8000
# Open in browser:
http://localhost:8000/docs

# Try these endpoints:
POST /api/auth/signup
POST /api/auth/login
GET /api/workspaces
```

**2. Test Frontend Integration** (10 minutes)
```bash
# Frontend is already running on port 5173
# Open browser console and test:

import { authService } from './src/services/api';

// Test signup
await authService.signup({
  email: 'test@example.com',
  password: 'password123',
  full_name: 'Test User'
});

// Test login
await authService.login({
  email: 'test@example.com',
  password: 'password123'
});

// Test get user
await authService.getCurrentUser();
```

**3. Start Building Auth UI** (Next)
```bash
# Create login page
# File: src/pages/Login.tsx

# Use the useAuth hook:
import { useAuth } from '@/hooks/useAuth';

const { login, isLoading, error } = useAuth();
```

---

## 📁 Project Structure

```
md-mindmap/
├── backend/                    # FastAPI Backend ✅ RUNNING
│   ├── app/
│   │   ├── main.py            # Entry point
│   │   ├── routers/           # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── models/            # Database models
│   │   └── schemas/           # Pydantic schemas
│   ├── .env                   # Backend config ✅
│   └── docker-compose.yml     # PostgreSQL + Redis
│
├── frontend/                   # React Frontend ✅ RUNNING
│   ├── src/
│   │   ├── config/
│   │   │   └── api.config.ts  # API endpoints ✅
│   │   ├── services/
│   │   │   └── api/           # API services ✅
│   │   │       ├── ApiClient.ts
│   │   │       ├── AuthService.ts
│   │   │       ├── WorkspaceService.ts
│   │   │       └── DocumentService.ts
│   │   ├── hooks/
│   │   │   └── useAuth.ts     # Auth hook ✅
│   │   ├── types/
│   │   │   └── api.types.ts   # TypeScript types ✅
│   │   └── pages/
│   │       ├── Login.tsx      # TODO: Create
│   │       ├── Signup.tsx     # TODO: Create
│   │       └── Workspace.tsx  # TODO: Update
│   └── .env                   # Frontend config ✅
│
└── INTEGRATION_PLAN.md        # This file
```

---

## 🔥 API Endpoints Available

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login (returns JWT tokens)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Workspaces
- `GET /api/workspaces` - List user's workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/{id}` - Get workspace
- `PUT /api/workspaces/{id}` - Update workspace
- `DELETE /api/workspaces/{id}` - Delete workspace
- `GET /api/workspaces/{id}/members` - List members

### Documents
- `GET /api/workspaces/{id}/documents` - List documents
- `POST /api/documents` - Create document
- `GET /api/documents/{id}` - Get document
- `PUT /api/documents/{id}` - Update document
- `DELETE /api/documents/{id}` - Delete document
- `GET /api/documents/{id}/versions` - Version history
- `POST /api/documents/{id}/versions/{version_id}/restore` - Restore version

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/{id}` - Get file
- `DELETE /api/files/{id}` - Delete file

### WebSocket
- `WS /api/ws/document/{id}` - Real-time collaboration

---

## 🎨 Design Philosophy

**"Build something so visually balanced and emotionally satisfying, users instantly trust it."**

### UI Principles
- ✨ Premium 2025 SaaS aesthetic
- 🎭 Glassmorphism + gradient accents
- 🌊 Fluid animations (200-400ms)
- 🎯 Tactile feedback on interactions
- 🌓 Elite light & dark themes
- 📱 Responsive (phone/tablet)

### Component Standards
- Clean sans-serif fonts (Inter, Geist)
- Rounded corners (12-16px)
- Soft shadows with blur
- Generous padding (breathing room)
- Smooth transitions
- Micro-interactions for delight

---

## 🧪 Testing Strategy

### Manual Testing
1. **Auth Flow**: Signup → Login → Logout
2. **Workspace**: Create → List → Update → Delete
3. **Documents**: Create → Edit → Auto-save → Version history
4. **Collaboration**: Multi-user editing → Presence → Cursors
5. **Offline**: Disconnect → Edit → Reconnect → Sync

### Automated Testing (Later)
- Unit tests for services
- Integration tests for API calls
- E2E tests for user flows
- Performance tests for large documents

---

## 🚨 Common Issues & Solutions

### CORS Errors
**Problem**: Frontend can't reach backend  
**Solution**: Backend already configured for `http://localhost:5173`

### 401 Unauthorized
**Problem**: Token expired or invalid  
**Solution**: Use `authService.refreshToken()` or re-login

### WebSocket Connection Failed
**Problem**: Can't establish WS connection  
**Solution**: Check backend is running, use correct WS URL

### Auto-save Not Working
**Problem**: Documents not saving  
**Solution**: Check network tab, verify token, check backend logs

---

## 📊 Timeline Estimate

| Phase | Time | Status |
|-------|------|--------|
| **Phase 0**: API Layer | 2h | ✅ Complete |
| **Phase 1**: Auth UI | 2-3h | 🔄 Next |
| **Phase 2**: Workspaces | 2-3h | ⏳ Pending |
| **Phase 3**: Documents | 3-4h | ⏳ Pending |
| **Phase 4**: Real-Time | 4-5h | ⏳ Pending |
| **Phase 5**: Polish | 2-3h | ⏳ Pending |
| **Total** | **15-20h** | **~2-3 days** |

---

## 🎯 Success Criteria

### MVP (Minimum Viable Product)
- ✅ User can signup/login
- ✅ User can create workspaces
- ✅ User can create/edit documents
- ✅ Documents auto-save to backend
- ✅ Version history works

### V1 (Full Featured)
- ✅ All MVP features
- ✅ Real-time collaboration
- ✅ Presence indicators
- ✅ Offline mode with sync
- ✅ Beautiful, polished UI

---

## 💡 Pro Tips

1. **Start Simple**: Get auth working first, then add features
2. **Test Often**: Use browser console to test API calls
3. **Check Network Tab**: Debug API issues in DevTools
4. **Read Backend Logs**: Backend terminal shows errors
5. **Use TypeScript**: Let types guide you
6. **Follow Design System**: Use existing components
7. **Commit Often**: Small, working increments

---

## 🎉 You're Ready!

**Current State**: ✅ Backend running, ✅ Frontend running, ✅ API layer complete

**Next Action**: Create Login/Signup pages

**Command to Start**:
```bash
# Frontend is already running on http://localhost:5173
# Backend is already running on http://localhost:8000
# Just start coding! 🚀
```

**Need Help?**
- Backend API docs: http://localhost:8000/docs
- This plan: `INTEGRATION_PLAN.md`
- Backend docs: `backend/README.md`

---

**Let's build something amazing! 💪**

