# 🎯 Backend Wiring Generator - Input Template

## **How to Use This Template**

1. Copy this template for each new feature
2. Fill in all 5 sections
3. Feed it to the `.cursorrules-be` prompt
4. Get a complete backend implementation plan

---

## 📋 **INPUT TEMPLATE**

### **1. FEATURE NAME**
```
Feature: [Feature Name Here]
Priority: [High/Medium/Low]
Epic: [Related Epic/Phase]
```

### **2. FRONTEND CONTEXT**

#### **Components Involved:**
```typescript
// List all React components that will use this feature
- ComponentName1 (path: src/components/...)
  - Props: { ... }
  - State: { ... }
  - Actions: [ ... ]

- ComponentName2 (path: src/pages/...)
  - Props: { ... }
  - State: { ... }
  - Actions: [ ... ]
```

#### **Frontend Logic Summary:**
```
1. User Action: [What triggers this feature?]
2. UI Flow: [Step-by-step user interaction]
3. State Management: [Context/Redux/Zustand - what gets updated?]
4. Expected Response: [What should the UI show?]
5. Error States: [What errors can occur?]
```

#### **Frontend API Calls:**
```typescript
// What the frontend expects to call
await api.someMethod({
  param1: "value",
  param2: 123
})
// Expected response: { ... }
```

---

### **3. BACKEND TECHNOLOGY STACK**

```yaml
Framework: FastAPI
Language: Python 3.11+
Database: PostgreSQL (via SQLAlchemy)
Cache: Redis
Authentication: JWT tokens (Argon2 hashing)
File Storage: Local filesystem (uploads/)
WebSockets: FastAPI WebSocket support
ORM: SQLAlchemy 2.0
Migrations: Alembic
```

---

### **4. DATA PERSISTENCE RULES**

#### **Storage Strategy:**
```
Primary Data:
  - [ ] PostgreSQL (transactional, relational)
  - [ ] Redis (cache, sessions, real-time data)
  - [ ] Local Filesystem (file uploads, media)
  - [ ] S3/Cloud Storage (future consideration)

Data Flow:
  1. [Where does data originate?]
  2. [How is it validated?]
  3. [Where is it stored?]
  4. [What gets cached?]
  5. [When does it sync?]
```

#### **Data Lifecycle:**
```
Create:    [Who can create? What validation?]
Read:      [Who can read? What filters?]
Update:    [Who can update? What fields?]
Delete:    [Soft delete? Hard delete? Who can delete?]
Archive:   [Archival rules?]
```

---

### **5. OFFLINE/ONLINE EXPECTATIONS**

#### **Online Mode:**
```
- Real-time updates: [Yes/No]
- WebSocket connection: [Required/Optional]
- API latency tolerance: [ms]
- Concurrent user handling: [Expected users]
```

#### **Offline Mode (Desktop App):**
```
- Local storage: [What data is cached?]
- Sync strategy: [On reconnect / Manual / Auto]
- Conflict resolution: [Last-write-wins / Manual / Timestamps]
- Offline capabilities: [Read-only / Full CRUD]
```

#### **Sync Requirements:**
```
- Initial sync: [Full download / Incremental]
- Delta sync: [Timestamp-based / Version-based]
- Conflict handling: [Strategy]
- Sync triggers: [App start / Timer / Manual button]
```

---

## 🎯 **FILLED EXAMPLE: Document Organization (Tags)**

### **1. FEATURE NAME**
```
Feature: Document Tags System
Priority: High
Epic: Phase 3 - Document Organization
```

### **2. FRONTEND CONTEXT**

#### **Components Involved:**
```typescript
- TagManager (path: src/components/tags/TagManager.tsx)
  - Props: { documentId: string }
  - State: { tags: Tag[], isCreating: boolean, searchQuery: string }
  - Actions: [ addTag, removeTag, searchTags, createTag ]

- TagInput (path: src/components/tags/TagInput.tsx)
  - Props: { onTagSelect: (tag: Tag) => void, existingTags: Tag[] }
  - State: { inputValue: string, suggestions: Tag[] }
  - Actions: [ handleInput, selectTag ]

- TagBadge (path: src/components/tags/TagBadge.tsx)
  - Props: { tag: Tag, onRemove?: () => void, isRemovable: boolean }
  - Actions: [ handleRemove ]
```

#### **Frontend Logic Summary:**
```
1. User Action: User opens document and sees existing tags
2. UI Flow:
   - Click "Add Tag" button
   - Type to search existing tags or create new
   - Click tag or press Enter to add
   - Tag appears as badge below title
   - Click X on badge to remove
3. State Management: 
   - useBackendWorkspace() provides document tags
   - Local state manages UI (input, suggestions)
   - On change, immediately call backend API
4. Expected Response:
   - Tag added: Show badge immediately
   - Tag created: Add to global tag list + attach to document
   - Tag removed: Remove badge with animation
5. Error States:
   - Duplicate tag: Show toast "Tag already exists"
   - Network error: Show retry button
   - Max tags reached: Disable add button
```

#### **Frontend API Calls:**
```typescript
// Get all workspace tags
const tags = await tagService.getAllTags(workspaceId);
// Response: { tags: Tag[] }

// Search tags
const results = await tagService.searchTags(workspaceId, query);
// Response: { tags: Tag[] }

// Create tag
const newTag = await tagService.createTag(workspaceId, { name, color });
// Response: { tag: Tag }

// Attach tag to document
await tagService.addTagToDocument(documentId, tagId);
// Response: { success: boolean }

// Remove tag from document
await tagService.removeTagFromDocument(documentId, tagId);
// Response: { success: boolean }
```

---

### **3. BACKEND TECHNOLOGY STACK**

```yaml
Framework: FastAPI
Language: Python 3.11+
Database: PostgreSQL (via SQLAlchemy)
Cache: Redis (for tag autocomplete)
Authentication: JWT tokens (user must own workspace)
File Storage: N/A (metadata only)
WebSockets: Optional (real-time tag updates)
ORM: SQLAlchemy 2.0
Migrations: Alembic
```

---

### **4. DATA PERSISTENCE RULES**

#### **Storage Strategy:**
```
Primary Data:
  - [x] PostgreSQL (tags table, document_tags junction table)
  - [x] Redis (cached tag list per workspace for autocomplete)
  - [ ] Local Filesystem
  - [ ] S3/Cloud Storage

Data Flow:
  1. User types in tag input → Frontend queries backend
  2. Backend validates: user owns workspace, tag name valid
  3. Store in PostgreSQL: tags table + document_tags table
  4. Cache in Redis: workspace:{id}:tags (5 min TTL)
  5. Sync: Real-time via WebSocket (optional)
```

#### **Data Lifecycle:**
```
Create:    User with editor+ role can create tags in workspace
           Validation: unique name per workspace, 2-30 chars
Read:      All workspace members can see tags
           Filter: by workspace, by document, by name pattern
Update:    Rename tag, change color (affects all documents)
           Only workspace admins can edit global tags
Delete:    Soft delete (mark as deleted, keep for history)
           Only workspace admins can delete
           Cascade: Remove from all documents
Archive:   Unused tags auto-archived after 90 days
```

---

### **5. OFFLINE/ONLINE EXPECTATIONS**

#### **Online Mode:**
```
- Real-time updates: Yes (WebSocket for tag changes)
- WebSocket connection: Optional (fallback to polling)
- API latency tolerance: 300ms
- Concurrent user handling: 10 users/workspace
```

#### **Offline Mode (Desktop App):**
```
- Local storage: All workspace tags cached in IndexedDB
- Sync strategy: On reconnect, fetch changed tags (timestamp)
- Conflict resolution: Last-write-wins for tag edits
                       Merge for document tags (union)
- Offline capabilities: Full CRUD (queued for sync)
```

#### **Sync Requirements:**
```
- Initial sync: Download all workspace tags on workspace load
- Delta sync: Fetch tags updated_at > last_sync_timestamp
- Conflict handling: 
  - Tag rename: Show conflict modal, let user choose
  - Tag delete: If used offline, keep local until resolved
  - Document tags: Merge (no conflict possible)
- Sync triggers: 
  - App start
  - Every 30 seconds (if changes pending)
  - Manual "Sync Now" button
```

---

## 🚀 **USAGE WORKFLOW**

### **Step 1: Fill Template for Your Feature**
```bash
# Copy template
cp BACKEND_WIRING_INPUT_TEMPLATE.md features/your-feature-input.md

# Edit with your feature details
vim features/your-feature-input.md
```

### **Step 2: Feed to Backend Generator**
```
Prompt: "@.cursorrules-be Here's my feature input:"
[Paste your filled template]
```

### **Step 3: Get Output**
You'll receive:
1. ✅ API endpoint specifications
2. ✅ Database models
3. ✅ Cache structures
4. ✅ Auth rules
5. ✅ Sync logic
6. ✅ Error handling
7. ✅ Integration steps
8. ✅ Validation checklist

### **Step 4: Implement**
Follow the generated plan step-by-step.

---

## 📚 **BLANK TEMPLATE (Copy This)**

```markdown
### **1. FEATURE NAME**
Feature: 
Priority: 
Epic: 

### **2. FRONTEND CONTEXT**

#### **Components Involved:**
- 

#### **Frontend Logic Summary:**
1. User Action: 
2. UI Flow: 
3. State Management: 
4. Expected Response: 
5. Error States: 

#### **Frontend API Calls:**


### **3. BACKEND TECHNOLOGY STACK**
[Use standard MDReader stack from above]

### **4. DATA PERSISTENCE RULES**

#### **Storage Strategy:**
Primary Data:
  - [ ] PostgreSQL
  - [ ] Redis
  - [ ] Local Filesystem
  - [ ] S3/Cloud Storage

Data Flow:
1. 
2. 
3. 

#### **Data Lifecycle:**
Create: 
Read: 
Update: 
Delete: 
Archive: 

### **5. OFFLINE/ONLINE EXPECTATIONS**

#### **Online Mode:**
- Real-time updates: 
- WebSocket connection: 
- API latency tolerance: 
- Concurrent user handling: 

#### **Offline Mode:**
- Local storage: 
- Sync strategy: 
- Conflict resolution: 
- Offline capabilities: 

#### **Sync Requirements:**
- Initial sync: 
- Delta sync: 
- Conflict handling: 
- Sync triggers: 
```

---

## 💡 **PRO TIPS**

### **Be Specific:**
❌ Bad: "User can add tags"
✅ Good: "User clicks 'Add Tag', types 'urgent', sees dropdown with existing 'urgent' tag (red), presses Enter, tag appears as red badge below title"

### **Include Edge Cases:**
- What if user has no internet?
- What if tag name is 100 characters?
- What if 2 users create same tag simultaneously?
- What if document is deleted while tags are being added?

### **Reference Existing Code:**
- Point to similar features: "Like workspace switching, but for tags"
- Reference existing models: "Extend Document model with tags relationship"
- Mention existing services: "Use BackendWorkspaceService pattern"

### **Provide UI Context:**
- Attach screenshots or Figma links
- Describe animations: "Fade in over 200ms"
- Specify loading states: "Show skeleton while fetching"

---

## 🎯 **DYNAMIC FEATURES TO CONSIDER**

When filling inputs for MDReader, consider these patterns:

### **1. Real-time Collaboration**
```
- WebSocket events
- Presence tracking
- Conflict resolution
- Optimistic updates
```

### **2. Workspace Isolation**
```
- Multi-tenancy rules
- Permission checks
- Cross-workspace queries
- Workspace switching
```

### **3. Document Hierarchy**
```
- Folder nesting
- Move operations
- Breadcrumbs
- Circular reference prevention
```

### **4. Search & Filters**
```
- Full-text search
- Tag filters
- Date ranges
- Fuzzy matching
```

### **5. File Management**
```
- Upload validation
- Size limits
- MIME types
- Storage optimization
```

---

## ✅ **CHECKLIST: Is Your Input Complete?**

Before feeding to `.cursorrules-be`, verify:

- [ ] Feature name is clear and specific
- [ ] All frontend components are listed
- [ ] User flow is step-by-step detailed
- [ ] API calls show exact TypeScript signatures
- [ ] Storage strategy specifies which DB/cache
- [ ] Data lifecycle covers CRUD + edge cases
- [ ] Offline mode is fully described
- [ ] Sync strategy handles conflicts
- [ ] Error states are enumerated
- [ ] Auth/permission rules are explicit

---

## 🚀 **NEXT STEPS**

1. Pick a feature from `IMPLEMENTATION_ROADMAP.md`
2. Copy the blank template above
3. Fill it with your feature details
4. Feed it to `.cursorrules-be`
5. Get a complete backend plan
6. Implement systematically

**Example command:**
```
"@.cursorrules-be Here's my input for Document Tags feature: [paste filled template]"
```

You'll get back a complete, actionable backend implementation plan! 🎉

