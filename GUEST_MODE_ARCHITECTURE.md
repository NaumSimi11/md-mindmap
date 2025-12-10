# 🎭 **Guest Mode Architecture - Zero-Auth Workspace**

**Date**: December 10, 2025  
**Status**: 🔥 **CRITICAL NEW REQUIREMENT**  
**Analyst**: Senior Engineering Architecture Team  
**Priority**: **P0 - Core User Acquisition Feature**

---

## 🎯 **The Vision**

**Goal**: User lands on homepage → Starts working immediately → Zero friction

**User Flow**:
```
User visits homepage
  ↓
"Start Writing" button (NO LOGIN)
  ↓
Full editor opens instantly
  ↓
Work on documents (all stored locally)
  ↓
(Optional) Sign up later → Migrate all work to cloud
```

**Key Constraint**: **NO backend access without auth** (AWS, DB, etc.)

---

## 🏗️ **Architectural Challenge**

### **The Problem**:

Our current system is **backend-centric**:
```
User → Auth (JWT) → Backend (FastAPI) → Database (PostgreSQL)
                ↓
          IndexedDB (cache only)
```

**Guest mode requires**:
```
Guest → NO AUTH → ??? → Local-only storage
```

**Questions**:
1. How do we handle workspaces without `owner_id`?
2. How do we handle documents without `user_id`?
3. What happens when guest signs up?
4. How do we migrate guest data to backend?
5. Can guests use offline sync? (No backend to sync to!)

---

## 🎨 **Architecture Solution: Three-Tier Mode System**

### **Mode 1: Guest (Local-Only)** 🆕

**Storage**: IndexedDB ONLY (no backend)  
**Auth**: None  
**Workspace**: Single "My Workspace" (local UUID)  
**Documents**: All local  
**Sync**: N/A (nothing to sync to)  
**Limitations**: 
- Data lost if browser storage cleared
- No cross-device sync
- No collaboration
- No sharing

**Key Insight**: **Guest mode is like Obsidian** - pure local app, no cloud.

---

### **Mode 2: Authenticated (Hybrid Offline/Online)** ✅ Existing

**Storage**: IndexedDB + Backend (sync)  
**Auth**: JWT  
**Workspace**: Real workspaces (PostgreSQL)  
**Documents**: Synced to backend  
**Sync**: Full offline sync (current system)  
**Features**: Everything

---

### **Mode 3: Guest → Authenticated (Migration)** 🆕

**Trigger**: Guest clicks "Sign Up" or "Log In"  
**Action**: Migrate all local data to backend  
**Process**:
1. User signs up/logs in
2. Detect guest data in IndexedDB
3. Show "Import your work?" modal
4. Bulk upload all documents to backend
5. Clear local guest data (or keep as backup)

---

## 🔧 **Technical Implementation**

### **1. Guest User Identification**

```typescript
// frontend/src/services/guest/GuestManager.ts

class GuestManager {
  private GUEST_ID_KEY = 'mdreader_guest_id';
  private GUEST_MODE_KEY = 'mdreader_guest_mode';
  
  isGuestMode(): boolean {
    return localStorage.getItem(this.GUEST_MODE_KEY) === 'true';
  }
  
  getGuestId(): string {
    let guestId = localStorage.getItem(this.GUEST_ID_KEY);
    if (!guestId) {
      guestId = `guest_${uuidv4()}`;
      localStorage.setItem(this.GUEST_ID_KEY, guestId);
    }
    return guestId;
  }
  
  enableGuestMode(): void {
    localStorage.setItem(this.GUEST_MODE_KEY, 'true');
    console.log('🎭 Guest mode enabled');
  }
  
  disableGuestMode(): void {
    localStorage.removeItem(this.GUEST_MODE_KEY);
    localStorage.removeItem(this.GUEST_ID_KEY);
    console.log('👤 Guest mode disabled');
  }
}

export const guestManager = new GuestManager();
```

---

### **2. Guest Workspace (Local-Only)**

```typescript
// frontend/src/services/guest/GuestWorkspaceService.ts

interface GuestWorkspace {
  id: string;
  name: string;
  icon: string;
  created_at: string;
  is_guest: true; // Flag to distinguish from real workspaces
}

interface GuestDocument {
  id: string;
  workspace_id: string;
  folder_id: string | null;
  title: string;
  content: string;
  starred: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  is_guest: true; // Flag for guest documents
}

class GuestWorkspaceService {
  private db = offlineDB; // Reuse existing IndexedDB
  
  async createGuestWorkspace(): Promise<GuestWorkspace> {
    const guestId = guestManager.getGuestId();
    
    const workspace: GuestWorkspace = {
      id: `guest_workspace_${uuidv4()}`,
      name: 'My Workspace',
      icon: '📝',
      created_at: new Date().toISOString(),
      is_guest: true
    };
    
    // Store in IndexedDB
    await this.db.workspaces.add({
      ...workspace,
      owner_id: guestId, // Use guest ID as owner
      description: 'Guest workspace',
      slug: 'guest-workspace',
      last_synced: null,
      is_active: true
    });
    
    console.log('🎭 Created guest workspace:', workspace.id);
    return workspace;
  }
  
  async getGuestWorkspace(): Promise<GuestWorkspace | null> {
    const guestId = guestManager.getGuestId();
    const workspaces = await this.db.workspaces
      .where('owner_id').equals(guestId)
      .toArray();
    
    if (workspaces.length === 0) return null;
    
    return {
      id: workspaces[0].id,
      name: workspaces[0].name,
      icon: workspaces[0].icon || '📝',
      created_at: workspaces[0].created_at,
      is_guest: true
    };
  }
  
  async createGuestDocument(
    title: string,
    content: string = '',
    folderId: string | null = null
  ): Promise<GuestDocument> {
    const workspace = await this.getGuestWorkspace();
    if (!workspace) throw new Error('No guest workspace found');
    
    const doc: GuestDocument = {
      id: `guest_doc_${uuidv4()}`,
      workspace_id: workspace.id,
      folder_id: folderId,
      title,
      content,
      starred: false,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_guest: true
    };
    
    // Store in IndexedDB (no backend sync)
    await this.db.documents.add({
      id: doc.id,
      workspaceId: doc.workspace_id,
      folderId: doc.folder_id,
      title: doc.title,
      content: doc.content,
      starred: doc.starred,
      tags: doc.tags,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      remote_version: 0, // No remote version (local only)
      last_synced: null, // Never synced
      pending_changes: false // No pending changes (nothing to sync to)
    });
    
    console.log('🎭 Created guest document:', doc.title);
    return doc;
  }
  
  async updateGuestDocument(docId: string, updates: Partial<GuestDocument>): Promise<void> {
    await this.db.documents.update(docId, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    console.log('🎭 Updated guest document:', docId);
  }
  
  async getAllGuestDocuments(): Promise<GuestDocument[]> {
    const workspace = await this.getGuestWorkspace();
    if (!workspace) return [];
    
    const docs = await this.db.documents
      .where('workspaceId').equals(workspace.id)
      .toArray();
    
    return docs.map(d => ({
      id: d.id,
      workspace_id: d.workspaceId,
      folder_id: d.folderId,
      title: d.title,
      content: d.content,
      starred: d.starred,
      tags: d.tags,
      created_at: d.createdAt,
      updated_at: d.updatedAt,
      is_guest: true
    }));
  }
}

export const guestWorkspaceService = new GuestWorkspaceService();
```

---

### **3. Guest → User Migration**

```typescript
// frontend/src/services/guest/GuestMigrationService.ts

class GuestMigrationService {
  async detectGuestData(): Promise<boolean> {
    if (!guestManager.isGuestMode()) return false;
    
    const workspace = await guestWorkspaceService.getGuestWorkspace();
    if (!workspace) return false;
    
    const docs = await guestWorkspaceService.getAllGuestDocuments();
    return docs.length > 0;
  }
  
  async migrateToAuthenticatedUser(userId: string): Promise<void> {
    console.log('🔄 Starting guest data migration for user:', userId);
    
    // 1. Get all guest documents
    const guestDocs = await guestWorkspaceService.getAllGuestDocuments();
    console.log(`📦 Found ${guestDocs.length} guest documents to migrate`);
    
    if (guestDocs.length === 0) {
      console.log('✅ No guest data to migrate');
      return;
    }
    
    // 2. Create a new workspace on backend
    const newWorkspace = await api.createWorkspace({
      name: 'My Workspace (Imported)',
      description: 'Imported from guest session',
      icon: '📝'
    });
    console.log('✅ Created workspace on backend:', newWorkspace.id);
    
    // 3. Upload all documents to backend
    let successCount = 0;
    let errorCount = 0;
    
    for (const guestDoc of guestDocs) {
      try {
        await api.createDocument({
          workspace_id: newWorkspace.id,
          title: guestDoc.title,
          content: guestDoc.content,
          content_type: 'markdown',
          folder_id: null, // Flatten structure for now
          tags: guestDoc.tags,
          is_starred: guestDoc.starred
        });
        successCount++;
        console.log(`  ✓ Migrated: ${guestDoc.title}`);
      } catch (err) {
        console.error(`  ✗ Failed to migrate: ${guestDoc.title}`, err);
        errorCount++;
      }
    }
    
    console.log(`✅ Migration complete: ${successCount} success, ${errorCount} errors`);
    
    // 4. Clear guest data from IndexedDB
    await this.clearGuestData();
    
    // 5. Disable guest mode
    guestManager.disableGuestMode();
    
    // 6. Show success notification
    return;
  }
  
  async clearGuestData(): Promise<void> {
    const guestId = guestManager.getGuestId();
    
    // Delete guest workspace
    await offlineDB.workspaces.where('owner_id').equals(guestId).delete();
    
    // Delete guest documents
    const workspace = await guestWorkspaceService.getGuestWorkspace();
    if (workspace) {
      await offlineDB.documents.where('workspaceId').equals(workspace.id).delete();
    }
    
    console.log('🗑️ Cleared all guest data from IndexedDB');
  }
  
  async promptMigration(): Promise<boolean> {
    // Show UI modal
    return new Promise((resolve) => {
      // User clicks "Yes, import" or "No, discard"
      // For now, placeholder:
      const shouldMigrate = window.confirm(
        'You have unsaved work from your guest session. Would you like to import it to your account?'
      );
      resolve(shouldMigrate);
    });
  }
}

export const guestMigrationService = new GuestMigrationService();
```

---

### **4. Unified Context (Guest + Authenticated)**

```typescript
// frontend/src/contexts/UnifiedWorkspaceContext.tsx

type WorkspaceMode = 'guest' | 'authenticated';

interface UnifiedWorkspaceContextType {
  mode: WorkspaceMode;
  isGuest: boolean;
  currentWorkspace: Workspace | GuestWorkspace | null;
  documents: Document[] | GuestDocument[];
  // ... other workspace functions
}

export function UnifiedWorkspaceProvider({ children }: PropsWithChildren) {
  const { user, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<WorkspaceMode>('guest');
  
  // Determine mode
  useEffect(() => {
    if (isAuthenticated && user) {
      setMode('authenticated');
      
      // Check for guest data to migrate
      guestMigrationService.detectGuestData().then(hasGuestData => {
        if (hasGuestData) {
          guestMigrationService.promptMigration().then(shouldMigrate => {
            if (shouldMigrate) {
              guestMigrationService.migrateToAuthenticatedUser(user.id);
            } else {
              guestMigrationService.clearGuestData();
            }
          });
        }
      });
    } else {
      setMode('guest');
      guestManager.enableGuestMode();
    }
  }, [isAuthenticated, user]);
  
  // ... rest of context logic
  
  return (
    <UnifiedWorkspaceContext.Provider value={{ mode, isGuest: mode === 'guest', ... }}>
      {children}
    </UnifiedWorkspaceContext.Provider>
  );
}
```

---

## 🎨 **UI/UX Flow**

### **Landing Page (Guest Entry Point)**

```tsx
// frontend/src/pages/LandingPage.tsx

function LandingPage() {
  const navigate = useNavigate();
  
  const handleStartGuest = () => {
    guestManager.enableGuestMode();
    navigate('/workspace'); // Opens guest workspace
  };
  
  return (
    <div className="hero">
      <h1>Start Writing, No Login Required</h1>
      
      {/* Primary CTA - Guest Mode */}
      <Button 
        size="lg" 
        onClick={handleStartGuest}
        className="text-lg px-8 py-6"
      >
        🚀 Start Writing Now
        <span className="text-sm opacity-70">No account needed</span>
      </Button>
      
      {/* Secondary CTA - Auth */}
      <div className="mt-4 flex gap-3">
        <Button variant="outline" onClick={() => navigate('/login')}>
          Log In
        </Button>
        <Button variant="outline" onClick={() => navigate('/signup')}>
          Sign Up
        </Button>
      </div>
    </div>
  );
}
```

---

### **Guest Workspace Banner**

```tsx
// frontend/src/components/workspace/GuestModeBanner.tsx

function GuestModeBanner() {
  const { isGuest } = useWorkspace();
  const navigate = useNavigate();
  
  if (!isGuest) return null;
  
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 
                    dark:border-amber-800 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <span className="text-sm text-amber-800 dark:text-amber-200">
          You're in <strong>Guest Mode</strong> - Your work is saved locally only.
        </span>
      </div>
      
      <Button 
        size="sm" 
        variant="default"
        onClick={() => navigate('/signup')}
      >
        Sign Up to Save Forever
      </Button>
    </div>
  );
}
```

---

### **Migration Modal**

```tsx
// frontend/src/components/guest/MigrationModal.tsx

function MigrationModal({ documentCount, onMigrate, onDiscard }: Props) {
  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Import Your Work?</AlertDialogTitle>
          <AlertDialogDescription>
            You have <strong>{documentCount} documents</strong> from your guest session.
            <br /><br />
            Would you like to import them to your account?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>
            Discard (Delete Forever)
          </AlertDialogCancel>
          <AlertDialogAction onClick={onMigrate}>
            Yes, Import My Work
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## 🔐 **Security & Data Isolation**

### **Key Principles**:

1. **Guest data NEVER touches backend**
   - No API calls
   - No JWT tokens
   - No AWS resources

2. **IndexedDB namespacing**
   - Guest workspaces have `owner_id: guest_<uuid>`
   - Guest documents have `is_guest: true` flag
   - Easy to identify and clean up

3. **Migration is one-way**
   - Guest → Authenticated (supported)
   - Authenticated → Guest (not allowed)

4. **No cross-contamination**
   - Guest data isolated in IndexedDB
   - Authenticated data syncs to backend
   - Clear separation

---

## 🚀 **Implementation Phases**

### **Phase 1: Guest Workspace (Week 1)** - 20 hours

**Tasks**:
- [ ] Create `GuestManager` class
- [ ] Create `GuestWorkspaceService` class
- [ ] Update `UnifiedWorkspaceContext` to support guest mode
- [ ] Add guest mode detection in `App.tsx`
- [ ] Update landing page with "Start Writing" CTA
- [ ] Add `GuestModeBanner` to workspace
- [ ] Test guest document CRUD (create, edit, delete)

**Deliverable**: Guest can create/edit documents without login

---

### **Phase 2: Guest Migration (Week 2)** - 16 hours

**Tasks**:
- [ ] Create `GuestMigrationService` class
- [ ] Build migration logic (bulk upload to backend)
- [ ] Create `MigrationModal` component
- [ ] Add migration prompt after signup/login
- [ ] Test migration with 10+ documents
- [ ] Handle migration errors gracefully

**Deliverable**: Guest can sign up and import all work

---

### **Phase 3: Polish & Edge Cases (Week 2)** - 8 hours

**Tasks**:
- [ ] Add "Export as Markdown" for guests (safety net)
- [ ] Show storage usage in guest mode
- [ ] Warn if IndexedDB quota exceeded
- [ ] Add "Upgrade to account" prompts throughout UI
- [ ] Analytics for guest → user conversion

**Deliverable**: Production-ready guest mode

---

## 📊 **Guest Mode vs Authenticated Mode**

| Feature | Guest Mode | Authenticated Mode |
|---------|------------|-------------------|
| **Login Required** | ❌ No | ✅ Yes |
| **Storage** | IndexedDB only | IndexedDB + Backend |
| **Offline Support** | ✅ Yes (always) | ✅ Yes (sync) |
| **Cross-Device** | ❌ No | ✅ Yes |
| **Collaboration** | ❌ No | ⚠️ Coming soon |
| **Sharing** | ❌ No | ⚠️ Coming soon |
| **Folders** | ✅ Yes | ✅ Yes |
| **Search** | ✅ Yes (local) | ✅ Yes (local + backend) |
| **Export** | ✅ Markdown | ✅ Markdown, PDF |
| **Data Safety** | ⚠️ Browser storage | ✅ Cloud backup |
| **Max Documents** | ⚠️ ~1000 (browser limit) | ✅ Unlimited |

---

## ⚠️ **Risks & Mitigation**

### **Risk 1: Data Loss (Browser Storage Cleared)**

**Problem**: Guest clears cookies/cache → all work lost

**Mitigation**:
- Prominent warnings in UI
- "Export all as Markdown" button
- Frequent prompts to sign up
- Auto-export to Downloads folder every 10 documents

---

### **Risk 2: Storage Quota Exceeded**

**Problem**: Guest creates 1000+ documents → IndexedDB quota hit

**Mitigation**:
- Monitor storage usage
- Show warning at 80% capacity
- Force signup at 90% capacity
- Suggest deleting old documents

---

### **Risk 3: Migration Failure**

**Problem**: Signup fails mid-migration → data inconsistency

**Mitigation**:
- Keep guest data until migration confirmed
- Retry failed uploads
- Show progress bar
- Allow manual retry

---

## 💡 **Premium Solutions (Cutting Edge)**

### **1. Progressive Web App (PWA)** ✨

**Install as desktop app** → Guest data persists forever
```typescript
// public/manifest.json
{
  "name": "MDReader",
  "short_name": "MDReader",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [...]
}
```

**Benefit**: Guest mode feels like native app (Obsidian-style)

---

### **2. Auto-Export to Downloads** ✨

```typescript
// Periodic backup to local filesystem
setInterval(async () => {
  if (guestManager.isGuest()) {
    const docs = await guestWorkspaceService.getAllGuestDocuments();
    const zip = await createZip(docs); // Zip all markdown files
    downloadFile(zip, `mdreader-backup-${Date.now()}.zip`);
    console.log('🔒 Auto-backup created');
  }
}, 1000 * 60 * 30); // Every 30 minutes
```

**Benefit**: Zero data loss even if browser crashes

---

### **3. Smart Upgrade Prompts** ✨

```typescript
// Trigger signup prompts based on engagement
const UPGRADE_TRIGGERS = {
  documents_created: 5,   // After 5 documents
  days_active: 3,         // After 3 days
  words_written: 1000,    // After 1000 words
  folders_created: 3      // After organizing
};

function checkUpgradePrompt() {
  if (guestManager.isGuest()) {
    const stats = getGuestStats();
    
    if (stats.documentsCreated >= 5 && !hasSeenPrompt('5-docs')) {
      showUpgradeModal('You\'re on a roll! Sign up to save forever.');
    }
  }
}
```

**Benefit**: Convert engaged users, not annoy new users

---

### **4. Collaborative Guest Links** ✨ (Future)

**Concept**: Guest creates doc → Gets shareable link → Others can view (read-only)

```typescript
// Generate public link for guest document
const shareLink = await guestWorkspaceService.createPublicLink(docId);
// https://mdreader.com/share/guest_doc_abc123

// Link opens read-only view for anyone (no login)
```

**Benefit**: Guest can share work before signing up

---

## 🎯 **Success Metrics**

| Metric | Target | Tracking |
|--------|--------|----------|
| **Guest → User Conversion** | > 15% | After 7 days |
| **Documents Created (Guest)** | Avg 3+ | Per session |
| **Time to First Document** | < 10 seconds | From landing |
| **Migration Success Rate** | > 95% | On signup |
| **Guest Data Loss** | < 1% | Browser clear events |

---

## 🏁 **Integration with Option 1 (Enhanced Current System)**

**Perfect Fit**: Guest mode uses the SAME offline system we're already enhancing!

**Architecture**:
```
Guest Mode:
  IndexedDB (Dexie)
    ↓
  No backend sync
    ↓
  Local-only

Authenticated Mode:
  IndexedDB (Dexie)
    ↓
  SyncManager → Backend API
    ↓
  Offline/Online sync

Shared:
  - Same database schema
  - Same UI components
  - Same editor
  - Same folder system
```

**Benefit**: 
- ✅ No duplicate code
- ✅ Consistent UX
- ✅ Easy to implement (just skip sync)

---

## ✅ **Decision: Guest Mode = ENABLED**

**Recommendation**: **Implement in parallel with Option 1 enhancements**

**Why?**
- Leverages existing IndexedDB infrastructure
- Massive user acquisition opportunity
- Low risk (no backend involvement)
- 2-3 weeks to implement

**Timeline**:
- **Week 1**: Basic guest workspace + CRUD
- **Week 2**: Migration + polish
- **Week 3**: Analytics + conversion optimization

**Total Effort**: 40-50 hours

---

**Status**: 🟢 **APPROVED - Ready to Implement**  
**Next Step**: Create implementation tickets for Phase 1  
**Owner**: Frontend Team + Product  
**Target**: Ship guest mode in 3 weeks

---

**Document Created**: December 10, 2025  
**Last Updated**: December 10, 2025  
**Related Docs**: `COLLABORATION_DECISION_REQUIRED.md`, `OFFLINE_FOLDER_OPERATIONS_COMPLETE.md`

