# Verification Protocol - Avoiding False Assumptions

## 🚨 The Problem: Hallucinating Implementation Status

### Example of What Went Wrong

**Claimed:** "Starred documents - backend already supports it, just need UI"

**Reality:** Backend has NO starred documents implementation at all.

**What I Saw (Wrong Assumptions):**
- Frontend code has `starred` property in Document type
- Frontend has star icons in the sidebar
- ❌ **I assumed backend must have it implemented**

**What I Should Have Done:**
1. ✅ Actually grep the backend code FIRST
2. ✅ Check database schema
3. ✅ Verify API endpoints exist

---

## ✅ Proper Verification Process

### Before Claiming "X is Already Implemented"

**Step 1: Check Database Schema**
```bash
# Check if column exists in model
grep -r "is_starred\|starred" backend/app/models/

# Check database directly
docker exec mdreader-postgres psql -U mdreader -d mdreader_dev -c "\d documents"
```

**Step 2: Check Backend Code**
```bash
# Check models
grep -r "starred" backend/app/models/document.py

# Check schemas (Pydantic)
grep -r "starred" backend/app/schemas/document.py

# Check API endpoints
grep -r "star\|starred" backend/app/routers/documents.py

# Check services (business logic)
grep -r "starred" backend/app/services/document.py
```

**Step 3: Check API Endpoints**
```bash
# List all document-related endpoints
grep "@router\." backend/app/routers/documents.py

# Test if endpoint exists
curl http://localhost:7001/api/v1/documents/{id}/star
```

**Step 4: Only Then Make Claims**
- If ALL checks pass → "Feature is fully implemented"
- If ANY check fails → "Feature needs implementation"
- If unsure → "Let me verify the implementation status"

---

## 🔍 The Correct Verification Example

### How It Should Have Gone

**User asks:** "What about starred documents?"

**Correct Response:**
```
Let me check if starred documents are implemented in the backend:

[Runs grep commands]
[Checks database schema]
[Checks API endpoints]

Result: The backend does NOT have starred documents yet. It needs to be built.

What we need:
1. Add `is_starred` boolean column to documents table
2. Create migration
3. Add API endpoint: POST /api/v1/documents/{id}/star
4. Update DocumentService to handle starring
5. Wire up frontend UI
```

---

## 📋 Feature Status Checklist

Before claiming a feature is "already implemented," verify ALL of these:

### Backend Checklist
- [ ] Database column/table exists
- [ ] SQLAlchemy model has the field
- [ ] Pydantic schema includes the field
- [ ] API router has the endpoint
- [ ] Service layer has business logic
- [ ] Migrations exist and are applied

### Frontend Checklist
- [ ] TypeScript types include the field
- [ ] API service has the method
- [ ] UI components call the API
- [ ] State management handles the data

### Integration Checklist
- [ ] Can create/read/update via API
- [ ] Data persists in database
- [ ] Frontend displays the data
- [ ] End-to-end flow works

---

## 🎯 Key Principles

### 1. "Show, Don't Assume"
```
❌ "The backend has this"
✅ "Let me check: [runs grep] → backend has/doesn't have this"
```

### 2. "Verify Before Claiming"
```
❌ "This is already implemented"
✅ "Let me verify: [checks code] → confirmed/not implemented"
```

### 3. "Code is Truth"
```
❌ Assume based on UI elements
✅ Check actual backend/database code
```

### 4. "When Unsure, Check"
```
❌ Make confident claims without verification
✅ "Let me verify this first" → [checks] → accurate answer
```

---

## 🛠️ Quick Verification Commands

### Check Database Schema
```bash
docker exec mdreader-postgres psql -U mdreader -d mdreader_dev -c "\d+ documents"
```

### Check Backend Implementation
```bash
# Models
grep -A 10 "class Document" backend/app/models/document.py

# API endpoints
grep "@router\." backend/app/routers/documents.py | grep -i "star"

# Schemas
grep "starred\|is_starred" backend/app/schemas/document.py
```

### Check Frontend Implementation
```bash
# Types
grep "starred" frontend/src/services/workspace/BackendWorkspaceService.ts

# API calls
grep "starred\|star" frontend/src/services/api/DocumentService.ts
```

---

## 📖 Real-World Example

### Scenario: User asks "Can users tag documents?"

**Wrong Approach:**
> "Yes! Tags are already implemented in the backend."
> 
> (Based on seeing `tags: []` in frontend code)

**Correct Approach:**
> "Let me verify the tags implementation..."
> 
> ```bash
> grep -r "tags" backend/app/models/document.py
> grep -r "tags" backend/app/schemas/document.py
> ```
> 
> Result: 
> - ✅ Backend has `tags` field in Document model
> - ✅ Schema includes tags validation
> - ✅ Database has tags column (jsonb)
> - ⚠️ No dedicated tags API endpoint (add/remove)
> 
> Answer: "Tags are partially implemented. Documents can have tags, but there's no dedicated endpoint for tag management. We'd need to add tag search/filter endpoints."

---

## 💡 Summary

**The Golden Rule:**
> "Never claim something is implemented without running verification commands on the actual codebase."

**When In Doubt:**
1. Grep the code
2. Check the database
3. Test the API
4. Then answer confidently

**Remember:**
- Frontend UI elements ≠ Backend implementation
- Type definitions ≠ Working feature
- Comments in code ≠ Actual functionality

**Always verify. Code is truth.**

