# 🚀 **MDReader Build Plan - Executive Summary**

**Date**: December 10, 2025  
**Status**: 🟢 **READY TO START**  
**Timeline**: 9 weeks (Phases 0-4)

---

## 📊 **Quick Status**

### **What We Have** ✅
- Frontend: Auth, offline sync, workspace, editor, AI (90% complete)
- Backend: FastAPI, PostgreSQL, Redis, CRUD APIs (80% complete)

### **What We Need** ❌
- Hocuspocus server (real-time collaboration)
- Yjs integration (CRDT sync)
- Guest Mode (no-auth workflow)
- Tauri desktop packaging

---

## 🎯 **Build Plan** (9 Weeks)

```
Week 1: Phase 0 - Guest Mode (Start without login)
    ├─ Task 0.1: Landing page enhancement
    ├─ Task 0.2: Guest mode context (IndexedDB only)
    └─ Task 0.3: Wiring

Week 2-3: Phase 1 - Real-Time Collaboration
    ├─ Task 1.1: Deploy Hocuspocus server (Node.js, port 1234)
    ├─ Task 1.2: Frontend Yjs integration
    └─ Task 1.3: TipTap + Yjs binding

Week 4-5: Phase 2 - Storage Modes
    ├─ Task 2.1: UI for mode selector (LocalOnly/HybridSync/CloudOnly)
    └─ Task 2.2: Backend storage mode support

Week 6-7: Phase 3 - Guest → Cloud Migration
    └─ Task 3.1: Migration flow (guest docs → cloud)

Week 8-9: Phase 4 - Tauri Desktop
    └─ Task 4.1: Desktop packaging + file system access
```

---

## 🔑 **Key Decisions**

### **Architecture**
```
Frontend (React + Yjs)
    ↓ REST (metadata)      ↓ WebSocket (content)
FastAPI (port 7001)    Hocuspocus (port 1234)
    ↓                       ↓
PostgreSQL (metadata + Yjs snapshots)
```

**Why Split**:
- Metadata (title, folder) changes rarely → REST
- Content (keystrokes) changes constantly → WebSocket
- Different protocols for different needs

---

### **Service Layers** ✅
```
Router → Service → Database (SQLAlchemy ORM)
```

**Verdict**: ✅ **Keep current architecture** (not overcomplicated)

---

### **Storage Modes**
```
LocalOnly:   Never syncs (IndexedDB only)
HybridSync:  Local + cloud (default)
CloudOnly:   Stream from cloud (no local)
```

**User controls** per document.

---

## 📋 **Critical Paths**

### **Phase 0 Blockers** 🔴
1. Guest mode must work **without backend**
2. IndexedDB persistence across sessions
3. Migration UX must be seamless

### **Phase 1 Blockers** 🔴
1. Hocuspocus deployment (Docker + port 1234)
2. JWT verification between Hocuspocus ↔ FastAPI
3. Yjs learning curve (2-day spike)

### **Phase 2 Blockers** 🟡
1. Storage mode UI/UX (user must understand choices)
2. Backend respects mode (e.g., don't sync LocalOnly)

### **Phase 3 Blockers** 🟡
1. Migration must not lose data (> 99% success rate)
2. IndexedDB quota might be exceeded

### **Phase 4 Blockers** 🟡
1. Tauri learning curve
2. Cross-platform builds (macOS, Windows, Linux)

---

## 🧪 **Testing Strategy**

### **Unit Tests** (Continuous)
- Frontend developers write tests as they build
- Coverage target: > 80%

### **Integration Tests** (Per Phase)
- E2E tests with Playwright
- Critical paths: Guest mode, real-time collab, migration

### **Manual Testing** (End of Phase)
- QA engineer: 2-3 days per phase
- Use cases from COMPREHENSIVE_USE_CASES.md

---

## 📊 **Success Metrics**

| Phase | Metric | Target |
|-------|--------|--------|
| **Phase 0** | Guest adoption | 50%+ start without login |
| **Phase 1** | Real-time latency | < 100ms |
| **Phase 2** | Mode switching | 20%+ users switch modes |
| **Phase 3** | Migration success | > 99% |
| **Phase 4** | Desktop downloads | 1000+ in first month |

---

## 🚨 **Risk Mitigation**

| Risk | Mitigation |
|------|------------|
| **Yjs learning curve** | 2-day spike before Phase 1 |
| **Migration data loss** | Backup IndexedDB, allow rollback |
| **Scope creep** | Stick to plan, defer Phase 5-7 |
| **Breaking existing features** | Feature flags, comprehensive tests |

---

## ✅ **Pre-Flight Checklist**

**Before Starting**:
- [ ] Push current code to `main`
- [ ] Create `feature/phase-0-guest-mode` branch
- [ ] Set up CI/CD pipeline
- [ ] Assign developers to tasks
- [ ] Schedule daily standups (15 min)

---

## 📖 **Full Documentation**

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `BUILD_AND_WIRE_PLAN.md` | **Detailed plan** (this is the main document) | Before starting each phase |
| `SENIOR_ENGINEERING_PLAN.md` | Overall vision (Phases 0-7) | Product strategy meetings |
| `COMPREHENSIVE_USE_CASES.md` | All user scenarios (85+) | Writing acceptance criteria |
| `BACKEND_ARCHITECTURE_BRIEF.md` | Service layers, communication | Backend development |
| `SERVICE_LAYER_ARCHITECTURE.md` | Is our architecture good? | Architecture reviews |

---

## 🎯 **Next Steps** (Today)

1. **Review** this plan with team (1 hour)
2. **Push** current code to main
3. **Start** Phase 0, Task 0.1 (Landing Page)
4. **Daily standups** at 10 AM

---

## 💬 **Team Communication**

### **Daily Standup** (15 min)
- What did you do yesterday?
- What will you do today?
- Any blockers?

### **Slack Channels**
- `#mdreader-build` - General discussion
- `#mdreader-frontend` - Frontend dev
- `#mdreader-backend` - Backend dev
- `#mdreader-qa` - Testing/QA

### **Weekly Review** (Friday, 1 hour)
- Demo completed work
- Review metrics
- Plan next week

---

## 🎉 **What Success Looks Like**

**After 9 Weeks**:
- ✅ Users can start writing without login (Guest Mode)
- ✅ Real-time collaboration works (< 100ms latency)
- ✅ Users control where data lives (LocalOnly/HybridSync/CloudOnly)
- ✅ Guest users can migrate to cloud (> 99% success)
- ✅ Desktop app available (macOS/Windows/Linux)

**Then**: Move to Phase 5 (Win Features), Phase 6 (Scale), Phase 7 (Growth)

---

**Status**: 🟢 **READY TO BUILD**  
**Confidence**: 🟢 HIGH  
**Risk**: 🟡 MEDIUM  
**Team**: 2-3 developers

**Let's ship it.** 🚀

