# 🧠 Offline Sync Strategy - Brainstorming Session

**Date**: 2024-12-09  
**Focus**: UX refinement, edge cases, premium design patterns  
**Status**: Design phase - implementation pending

---

## 💎 **1. UX Philosophy: "Invisible Until It Matters"**

The best sync systems **feel like magic** because they're invisible 99% of the time.

### Current Approach vs. Premium Approach

| Current Plan | Premium Alternative |
|--------------|---------------------|
| `✓ Synced` badge always visible | Only show badge **during** sync or **when offline** |
| Status text in corner | Ambient pulse animation on avatar/workspace icon |
| Notification on reconnect | Subtle haptic + micro-toast that fades |
| Conflict modal blocks workflow | Non-blocking sidebar drawer with smart defaults |

### **Proposed: 3-Tier Visibility**

```typescript
// Tier 1: Silent (Default) - User doesn't see anything
'online_synced' → No UI (maybe subtle green dot on avatar)

// Tier 2: Awareness - User knows something is happening
'online_syncing' → Elegant spinner in nav bar (200ms delay)
'offline' → Amber dot + "Offline mode" in bottom bar

// Tier 3: Action Required - User must respond
'conflict' → Slide-in drawer from right (not modal!)
'error' → Toast with "Retry" or "View Details"
```

**Reference**: Linear, Notion, Arc browser all hide sync until critical.

---

## 🔥 **2. Sync Architecture Gaps & Solutions**

### **Gap 1: Partial Sync / Large Documents**

**Problem**: What if a user has:
- 500 documents
- Offline for 3 days
- Made 200 changes

Syncing all 200 on reconnect could take 2-3 minutes and lock up UI.

**Solution: Progressive Sync**
```typescript
interface SyncStrategy {
  priority: 'user-visible' | 'background' | 'deferred'
  batchSize: number
  concurrency: number
}

// Sync order:
// 1. Currently open document (immediate)
// 2. Recently edited docs (next 10s)
// 3. Rest of workspace (background, throttled)
```

**Implementation**:
```typescript
class ProgressiveSyncManager extends SyncManager {
  async syncOnReconnect() {
    const changes = await this.getPendingChanges();
    
    // Priority 1: Current document
    const currentDoc = changes.filter(c => c.entityId === currentDocumentId);
    await this.syncBatch(currentDoc, { priority: 'immediate' });
    
    // Priority 2: Recent edits (last 24h)
    const recentChanges = changes.filter(c => 
      isWithinLast24Hours(c.timestamp)
    );
    await this.syncBatch(recentChanges, { 
      priority: 'high',
      concurrency: 5 
    });
    
    // Priority 3: Everything else (background)
    const oldChanges = changes.filter(c => 
      !isWithinLast24Hours(c.timestamp)
    );
    await this.syncBatch(oldChanges, { 
      priority: 'low',
      concurrency: 2,
      throttle: 1000 // 1 request per second
    });
  }
}
```

---

### **Gap 2: Rich Content (Images, Embeds)**

**Problem**: Markdown can have:
- Embedded images (`![](base64...)`)
- Attachments
- Mermaid diagrams

A single doc could be 50MB with images.

**Solution: Chunked Upload + CDN**
```typescript
// Separate content from metadata
interface DocumentStorage {
  document: {
    id: string;
    title: string;
    content_ref: string; // "s3://bucket/doc-123/v5.md"
    attachments: Attachment[];
    metadata: DocumentMetadata;
  }
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  url: string;
  uploaded: boolean;
}

// Upload strategy:
async function uploadRichDocument(doc: Document) {
  // 1. Upload text content first (fast)
  await uploadTextContent(doc.id, doc.textOnly);
  showStatus('Document saved');
  
  // 2. Upload images in parallel (slow)
  const images = extractImages(doc.content);
  await Promise.all(
    images.map(img => uploadAttachment(doc.id, img))
  );
  
  // 3. Update document with attachment URLs
  await updateDocumentRefs(doc.id, images);
  showStatus('All attachments uploaded');
}
```

---

### **Gap 3: Sync During Editing**

**Problem**: 
- User is typing in editor
- Auto-save triggers every 3 seconds
- Sync tries to update IndexedDB
- **Race condition**: Local draft vs. syncing version

**Solution: Edit Lock + Draft State**
```typescript
interface DocumentState {
  committed: string;     // Last synced version
  draft: string;          // Current editor content
  isDirty: boolean;       // Has unsaved changes
  isSyncing: boolean;     // Currently uploading
  lastEditTime: Date;     // For debouncing
}

class EditorSyncManager {
  private editDebounceTimer?: number;
  
  onEditorChange(content: string) {
    // Update draft immediately (optimistic)
    this.setState({ draft: content, isDirty: true });
    
    // Debounce sync (don't interrupt typing)
    clearTimeout(this.editDebounceTimer);
    this.editDebounceTimer = setTimeout(() => {
      this.syncDraft();
    }, 3000);
  }
  
  async syncDraft() {
    const { draft, isSyncing } = this.state;
    
    // Never sync while already syncing
    if (isSyncing) return;
    
    this.setState({ isSyncing: true });
    
    try {
      await this.uploadDraft(draft);
      this.setState({ 
        committed: draft,
        isDirty: false,
        isSyncing: false
      });
    } catch (error) {
      // Keep draft, queue for later
      this.queueChange({ type: 'update', data: draft });
      this.setState({ isSyncing: false });
    }
  }
}
```

**UI Indicator**:
```tsx
// Show in editor footer
<div className="flex items-center gap-2 text-xs text-gray-500">
  {isDirty && !isSyncing && (
    <>
      <IconEdit className="w-3 h-3" />
      <span>Unsaved changes</span>
    </>
  )}
  {isSyncing && (
    <>
      <IconSync className="w-3 h-3 animate-spin" />
      <span>Syncing draft...</span>
    </>
  )}
  {!isDirty && !isSyncing && (
    <>
      <IconCheck className="w-3 h-3 text-green-500" />
      <span>All changes saved</span>
    </>
  )}
</div>
```

---

## 🎨 **3. Visual Design of Sync States**

### **Principle**: Use ambient indicators, not text badges

### **Workspace-Level Indicator**
```tsx
// Subtle glow around workspace icon
<div className="relative group">
  <WorkspaceIcon className="w-10 h-10" />
  
  {/* Syncing: Pulsing blue ring */}
  {syncStatus === 'syncing' && (
    <motion.div
      className="absolute inset-0 rounded-full ring-2 ring-blue-400/50"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  )}
  
  {/* Offline: Amber dot indicator */}
  {syncStatus === 'offline' && (
    <div className="absolute -top-1 -right-1 w-3 h-3 
                    bg-amber-500 rounded-full border-2 border-white
                    shadow-sm" />
  )}
  
  {/* Conflict: Red pulse */}
  {syncStatus === 'conflict' && (
    <motion.div
      className="absolute -top-1 -right-1 w-3 h-3 
                 bg-red-500 rounded-full border-2 border-white"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
    />
  )}
  
  {/* Hover tooltip */}
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="absolute inset-0" />
    </TooltipTrigger>
    <TooltipContent>
      {syncStatus === 'online_synced' && 'All changes synced'}
      {syncStatus === 'syncing' && 'Syncing changes...'}
      {syncStatus === 'offline' && '3 changes pending'}
      {syncStatus === 'conflict' && '2 conflicts need resolution'}
    </TooltipContent>
  </Tooltip>
</div>
```

---

### **Document-Level Micro-Interactions**
```tsx
// Tiny spinner next to doc title (only when that doc is syncing)
<div className="flex items-center gap-2">
  <h1 className="text-2xl font-semibold">{doc.title}</h1>
  
  {doc.isSyncing && (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ 
        duration: 1, 
        repeat: Infinity, 
        ease: "linear" 
      }}
    >
      <IconSync className="w-4 h-4 text-blue-500" />
    </motion.div>
  )}
  
  {doc.hasConflict && (
    <Badge variant="warning" className="animate-pulse">
      Conflict
    </Badge>
  )}
</div>
```

---

### **Conflict Resolution UI**

**❌ Bad**: Modal that blocks workflow

**✅ Good**: Side-by-side diff view

```tsx
// Slide in from bottom when conflict detected
<AnimatePresence>
  {hasConflict && (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl
                 rounded-t-xl z-50 max-h-[60vh] overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <IconAlertTriangle className="w-6 h-6 text-amber-500" />
            <div>
              <h3 className="font-semibold text-lg">
                Conflicting Changes Detected
              </h3>
              <p className="text-sm text-gray-600">
                This document was edited on another device
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={dismissConflict}>
            <IconX />
          </Button>
        </div>
        
        {/* Side-by-side diff */}
        <div className="grid grid-cols-2 gap-4">
          {/* Your version */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <IconDeviceLaptop className="w-4 h-4" />
              <span className="font-medium">Your Version</span>
              <span className="text-xs text-gray-500">
                Edited 2 mins ago
              </span>
            </div>
            <pre className="text-sm max-h-48 overflow-auto">
              {conflict.localVersion}
            </pre>
            <Button 
              className="mt-3 w-full" 
              onClick={() => resolveConflict('local')}
            >
              Keep This Version
            </Button>
          </div>
          
          {/* Server version */}
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="flex items-center gap-2 mb-3">
              <IconCloud className="w-4 h-4" />
              <span className="font-medium">Server Version</span>
              <span className="text-xs text-gray-500">
                Edited 5 mins ago
              </span>
            </div>
            <pre className="text-sm max-h-48 overflow-auto">
              {conflict.remoteVersion}
            </pre>
            <Button 
              variant="outline"
              className="mt-3 w-full"
              onClick={() => resolveConflict('remote')}
            >
              Use This Version
            </Button>
          </div>
        </div>
        
        {/* Advanced options */}
        <div className="mt-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={showDetailedDiff}
          >
            View Detailed Diff
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={saveAsNewDocument}
          >
            Save Both as Separate Docs
          </Button>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

---

## 🚨 **4. Edge Cases Not Covered**

### **Case 1: Clock Skew**
**Problem**:
```
Device A: System clock is wrong (2023 instead of 2025)
Device B: Correct time

Result: Device A's changes always lose (timestamp is older)
```

**Solution**: Use **server timestamp** + **vector clocks**
```typescript
interface Change {
  id: string;
  clientTimestamp: Date;  // From device
  serverTimestamp: Date;  // From backend (source of truth)
  vectorClock: {          // For conflict detection
    [deviceId: string]: number;
  };
}

// Comparison logic
function isNewerChange(a: Change, b: Change): boolean {
  // ALWAYS use server timestamp, not client
  return a.serverTimestamp > b.serverTimestamp;
}

// For offline changes (no server timestamp yet)
function detectConflictOffline(local: Change, remote: Change): boolean {
  // Use vector clocks
  const localVersion = local.vectorClock[local.deviceId] || 0;
  const remoteVersion = remote.vectorClock[remote.deviceId] || 0;
  
  // If both have changes the other doesn't know about → conflict
  return localVersion > 0 && remoteVersion > 0;
}
```

---

### **Case 2: Intentional Offline Mode**
**Problem**: User might want to work offline on purpose:
- Airplane mode
- Focus mode (no distractions)
- Metered connection (save data)

**Solution**: Add manual toggle
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      {isOnline ? <IconWifi /> : <IconWifiOff />}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Connection Mode</DropdownMenuLabel>
    <DropdownMenuSeparator />
    
    <DropdownMenuItem onClick={() => setMode('online')}>
      <IconWifi className="mr-2 w-4 h-4" />
      <span>Auto-sync (Online)</span>
      {mode === 'online' && <IconCheck className="ml-auto" />}
    </DropdownMenuItem>
    
    <DropdownMenuItem onClick={() => setMode('offline')}>
      <IconWifiOff className="mr-2 w-4 h-4" />
      <span>Work Offline</span>
      {mode === 'offline' && <IconCheck className="ml-auto" />}
    </DropdownMenuItem>
    
    <DropdownMenuItem onClick={() => setMode('metered')}>
      <IconDeviceMobile className="mr-2 w-4 h-4" />
      <span>Sync on Wi-Fi Only</span>
      {mode === 'metered' && <IconCheck className="ml-auto" />}
    </DropdownMenuItem>
    
    <DropdownMenuSeparator />
    
    <DropdownMenuItem onClick={manualSync}>
      <IconRefresh className="mr-2 w-4 h-4" />
      <span>Sync Now</span>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Settings Page**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Sync Preferences</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Auto-sync toggle */}
    <div className="flex items-center justify-between">
      <div>
        <Label>Auto-sync</Label>
        <p className="text-sm text-gray-500">
          Automatically sync changes to cloud
        </p>
      </div>
      <Switch checked={autoSync} onCheckedChange={setAutoSync} />
    </div>
    
    {/* Metered connection warning */}
    <div className="flex items-center justify-between">
      <div>
        <Label>Pause on metered connection</Label>
        <p className="text-sm text-gray-500">
          Save mobile data by syncing only on Wi-Fi
        </p>
      </div>
      <Switch checked={pauseOnMetered} onCheckedChange={setPauseOnMetered} />
    </div>
    
    {/* Background sync */}
    <div className="flex items-center justify-between">
      <div>
        <Label>Background sync</Label>
        <p className="text-sm text-gray-500">
          Keep syncing when app is in background
        </p>
      </div>
      <Switch checked={backgroundSync} onCheckedChange={setBackgroundSync} />
    </div>
  </CardContent>
</Card>
```

---

### **Case 3: Corrupted Local Data**
**Problem**: IndexedDB gets corrupted:
- Browser bug
- Force quit during write
- Disk full error

**Solution**: Detect + Recover
```typescript
class DataIntegrityManager {
  async validateIndexedDB(): Promise<boolean> {
    try {
      // Try to read a known record
      const testRecord = await db.syncMetadata.get('health-check');
      
      // Try to write
      await db.syncMetadata.put({ 
        id: 'health-check', 
        timestamp: Date.now() 
      });
      
      return true;
    } catch (error) {
      console.error('IndexedDB corrupted:', error);
      return false;
    }
  }
  
  async handleCorruptedData() {
    const isCorrupted = !(await this.validateIndexedDB());
    
    if (isCorrupted) {
      // Show user-friendly recovery UI
      const action = await showNotification({
        title: "Storage Issue Detected",
        message: "We found a problem with your local storage. Would you like to re-download your workspace from the cloud?",
        actions: [
          { label: "Download from Cloud", value: "recover" },
          { label: "Contact Support", value: "support" },
          { label: "Export What's Left", value: "export" }
        ]
      });
      
      switch (action) {
        case 'recover':
          await this.recoverFromBackend();
          break;
        case 'export':
          await this.exportCorruptedData();
          break;
        case 'support':
          window.location.href = '/support';
          break;
      }
    }
  }
  
  async recoverFromBackend() {
    showProgress('Recovering workspace...');
    
    try {
      // 1. Clear corrupted local storage
      await this.clearIndexedDB();
      
      // 2. Full sync from server
      await syncManager.fullSyncFromServer();
      
      // 3. Verify integrity
      const isHealthy = await this.validateIndexedDB();
      
      if (isHealthy) {
        showSuccess('Workspace recovered successfully!');
      } else {
        throw new Error('Recovery failed');
      }
    } catch (error) {
      showError('Recovery failed. Please contact support.');
      this.logError(error);
    }
  }
}
```

---

## 🎯 **5. Answers to Open Questions**

### **Q1: Storage Limits for IndexedDB on mobile?**

| Browser | IndexedDB Limit |
|---------|-----------------|
| Chrome (mobile) | ~60% of free disk space |
| Safari (iOS) | 50MB - 500MB (depends on storage pressure) |
| Firefox (mobile) | ~50% of free disk space |
| Edge (mobile) | Same as Chrome |

**Recommendations**:
1. **Show storage usage** in settings
2. **Warn at 80%** capacity
3. **Auto-cleanup** old docs (30+ days unmodified)
4. **Offer selective sync** (choose which workspaces to keep offline)

**Implementation**:
```typescript
interface StorageInfo {
  used: number;      // Bytes used
  available: number; // Bytes available
  quota: number;     // Total quota
  percentage: number; // used / quota
}

async function getStorageInfo(): Promise<StorageInfo> {
  const estimate = await navigator.storage.estimate();
  
  return {
    used: estimate.usage || 0,
    available: (estimate.quota || 0) - (estimate.usage || 0),
    quota: estimate.quota || 0,
    percentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100
  };
}

// Show warning when reaching capacity
async function checkStorageHealth() {
  const storage = await getStorageInfo();
  
  if (storage.percentage > 80) {
    showNotification({
      title: 'Storage Almost Full',
      message: `You're using ${formatBytes(storage.used)} of ${formatBytes(storage.quota)}`,
      actions: [
        { label: 'Free Up Space', action: () => openCleanupUI() },
        { label: 'Manage Offline Content', action: () => openSyncSettings() }
      ]
    });
  }
}
```

**Cleanup UI**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Storage Management</CardTitle>
    <CardDescription>
      Free up space by removing old documents
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Storage meter */}
    <div className="mb-6">
      <div className="flex justify-between text-sm mb-2">
        <span>Storage Used</span>
        <span>{storage.percentage.toFixed(1)}%</span>
      </div>
      <Progress value={storage.percentage} />
      <p className="text-xs text-gray-500 mt-1">
        {formatBytes(storage.used)} of {formatBytes(storage.quota)}
      </p>
    </div>
    
    {/* Cleanup options */}
    <div className="space-y-3">
      <Button 
        variant="outline" 
        className="w-full justify-between"
        onClick={deleteUnmodifiedDocs}
      >
        <span>Delete docs not opened in 30 days</span>
        <span className="text-sm text-gray-500">~{freeableSpace}MB</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="w-full justify-between"
        onClick={clearCache}
      >
        <span>Clear cached images</span>
        <span className="text-sm text-gray-500">~{cacheSize}MB</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="w-full justify-between"
        onClick={removeOldVersions}
      >
        <span>Keep only latest version of docs</span>
        <span className="text-sm text-gray-500">~{versionSize}MB</span>
      </Button>
    </div>
  </CardContent>
</Card>
```

---

### **Q2: Sync Frequency - How often to auto-sync?**

**❌ Bad Approach**: Time-based polling
```typescript
// DON'T DO THIS - Wastes battery and network
setInterval(() => {
  syncManager.syncNow();
}, 30000); // Every 30 seconds
```

**✅ Good Approach**: Event-based sync
```typescript
class SmartSyncScheduler {
  private debounceTimers = new Map<string, number>();
  
  // Sync on user actions
  onEditorChange(docId: string, content: string) {
    // Debounce: Don't sync while user is typing
    clearTimeout(this.debounceTimers.get(docId));
    
    this.debounceTimers.set(docId, setTimeout(() => {
      this.syncDocument(docId, content);
    }, 3000)); // 3 seconds after last keystroke
  }
  
  onDocumentClosed(docId: string) {
    // Immediate sync when user switches away
    this.syncDocument(docId);
  }
  
  onAppBackground() {
    // Sync everything when app goes to background
    this.syncAll();
  }
  
  onAppForeground() {
    // Fetch latest changes when app comes back
    this.fetchRemoteChanges();
  }
  
  onNetworkReconnect() {
    // Immediate sync when connection restored
    this.syncPendingQueue();
  }
}

// Register lifecycle hooks
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    scheduler.onAppBackground();
  } else {
    scheduler.onAppForeground();
  }
});

window.addEventListener('online', () => {
  scheduler.onNetworkReconnect();
});
```

**Adaptive Sync Strategy**:
```typescript
interface SyncPolicy {
  immediate: string[];   // Always sync instantly
  debounced: number;      // Debounce time in ms
  batched: boolean;       // Batch multiple changes
  networkAware: boolean;  // Adjust based on connection
}

function getAdaptiveSyncPolicy(): SyncPolicy {
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType || '4g';
  const saveData = connection?.saveData || false;
  
  // On slow connection or data saver mode
  if (saveData || effectiveType === '2g' || effectiveType === 'slow-2g') {
    return {
      immediate: ['current-document'], // Only sync what's visible
      debounced: 10000, // Wait 10s before syncing
      batched: true,    // Batch multiple changes
      networkAware: true
    };
  }
  
  // On fast connection
  if (effectiveType === '4g' || effectiveType === '5g') {
    return {
      immediate: ['current-document', 'recent-documents'],
      debounced: 2000,  // Sync after 2s
      batched: false,   // Individual syncs
      networkAware: false
    };
  }
  
  // Default (3g)
  return {
    immediate: ['current-document'],
    debounced: 5000,
    batched: true,
    networkAware: true
  };
}
```

---

### **Q3: Conflict UI - Show modal immediately or defer?**

**Answer**: Neither! Use **inline banner** at top of editor.

**Reasoning**:
- **Modal** = Blocks workflow, annoying
- **Notification center** = User might miss it
- **Inline banner** = Visible but non-blocking

**Implementation**:
```tsx
<div className="relative">
  {/* Conflict banner - slides down from top */}
  <AnimatePresence>
    {document.hasConflict && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 
                        border-l-4 border-amber-400 p-4 mb-4">
          <div className="flex items-start gap-3">
            <IconAlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            
            <div className="flex-1">
              <p className="font-medium text-amber-900">
                This document was edited on another device
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Changes made 2 minutes ago from "MacBook Pro"
              </p>
              
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => showConflictResolution(document.id)}
                >
                  Review Changes
                </Button>
                <Button 
                  size="sm"
                  onClick={() => resolveConflict(document.id, 'remote')}
                >
                  Use Server Version
                </Button>
                <Button 
                  size="sm"
                  variant="ghost"
                  onClick={() => resolveConflict(document.id, 'local')}
                >
                  Keep Mine
                </Button>
              </div>
            </div>
            
            <Button
              size="icon"
              variant="ghost"
              className="flex-shrink-0"
              onClick={() => dismissConflict(document.id)}
            >
              <IconX className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
  
  {/* Editor below */}
  <Editor content={document.content} />
</div>
```

**Advanced: Conflict Details View**
```tsx
function ConflictDetailsPanel({ conflict }: { conflict: Conflict }) {
  const [view, setView] = useState<'side-by-side' | 'unified'>('side-by-side');
  const diff = useMemo(() => computeDiff(conflict.local, conflict.remote), [conflict]);
  
  return (
    <Dialog>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Resolve Conflict</DialogTitle>
          <DialogDescription>
            Choose which version to keep or manually merge changes
          </DialogDescription>
        </DialogHeader>
        
        {/* View toggle */}
        <ToggleGroup type="single" value={view} onValueChange={setView}>
          <ToggleGroupItem value="side-by-side">
            Side by Side
          </ToggleGroupItem>
          <ToggleGroupItem value="unified">
            Unified Diff
          </ToggleGroupItem>
        </ToggleGroup>
        
        {/* Diff view */}
        {view === 'side-by-side' ? (
          <div className="grid grid-cols-2 gap-4 h-full overflow-auto">
            <DiffPanel 
              title="Your Version" 
              content={conflict.local}
              timestamp={conflict.localTimestamp}
              changes={diff.localChanges}
            />
            <DiffPanel 
              title="Server Version" 
              content={conflict.remote}
              timestamp={conflict.remoteTimestamp}
              changes={diff.remoteChanges}
            />
          </div>
        ) : (
          <UnifiedDiffView diff={diff} />
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => saveAsNewDocument()}>
            Save Both Separately
          </Button>
          <Button variant="outline" onClick={() => manualMerge()}>
            Manual Merge
          </Button>
          <Button onClick={() => resolveConflict('local')}>
            Use My Version
          </Button>
          <Button onClick={() => resolveConflict('remote')}>
            Use Server Version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### **Q4: Version History - How many versions to keep?**

**Answer**: Tiered retention strategy

```typescript
interface VersionRetentionPolicy {
  // Keep ALL versions for recent history (infinite undo)
  recentEdits: {
    count: 10;      // Last 10 edits
    retention: 'forever';
  };
  
  // Keep hourly snapshots for past week
  hourlySnapshots: {
    duration: 7 * 24 * 60 * 60 * 1000; // 7 days
    interval: 60 * 60 * 1000;           // 1 hour
  };
  
  // Keep daily snapshots for past month
  dailySnapshots: {
    duration: 30 * 24 * 60 * 60 * 1000; // 30 days
    interval: 24 * 60 * 60 * 1000;       // 1 day
  };
  
  // Keep weekly snapshots for older content
  weeklySnapshots: {
    duration: 365 * 24 * 60 * 60 * 1000; // 1 year
    interval: 7 * 24 * 60 * 60 * 1000;    // 1 week
  };
}
```

**Storage Optimization**: Use diff-based versioning
```typescript
interface Version {
  id: string;
  timestamp: Date;
  type: 'full' | 'diff';
  
  // Full version
  content?: string;
  
  // Or diff from previous
  basedOn?: string;  // ID of base version
  diff?: DiffPatch;   // Only store changes
  
  metadata: {
    author: string;
    device: string;
    size: number;
  };
}

// Example: 10 versions of a 100KB document
// Without diffs: 10 × 100KB = 1MB storage
// With diffs: 100KB + (9 × 5KB) = ~145KB storage
// Savings: 85%!

class VersionManager {
  async createVersion(docId: string, content: string): Promise<Version> {
    const previousVersion = await this.getLatestVersion(docId);
    
    // Every 10th version = full snapshot
    if (previousVersion && previousVersion.id % 10 !== 0) {
      const diff = computeDiff(previousVersion.content, content);
      
      return {
        id: generateId(),
        timestamp: new Date(),
        type: 'diff',
        basedOn: previousVersion.id,
        diff: diff,
        metadata: { /* ... */ }
      };
    } else {
      // Full snapshot
      return {
        id: generateId(),
        timestamp: new Date(),
        type: 'full',
        content: content,
        metadata: { /* ... */ }
      };
    }
  }
  
  async reconstructVersion(versionId: string): Promise<string> {
    const version = await this.getVersion(versionId);
    
    if (version.type === 'full') {
      return version.content;
    } else {
      // Recursively apply diffs
      const baseContent = await this.reconstructVersion(version.basedOn);
      return applyDiff(baseContent, version.diff);
    }
  }
}
```

**Version History UI**:
```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="sm">
      <IconHistory className="mr-2" />
      Version History
    </Button>
  </SheetTrigger>
  
  <SheetContent side="right" className="w-[600px]">
    <SheetHeader>
      <SheetTitle>Version History</SheetTitle>
      <SheetDescription>
        View and restore previous versions of this document
      </SheetDescription>
    </SheetHeader>
    
    <ScrollArea className="h-full mt-6">
      {/* Timeline of versions */}
      <div className="space-y-4">
        {versions.map((version, index) => (
          <div key={version.id} className="flex gap-4">
            {/* Timeline dot */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-3 h-3 rounded-full border-2",
                index === 0 ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300"
              )} />
              {index < versions.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 mt-1" />
              )}
            </div>
            
            {/* Version card */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {index === 0 ? 'Current' : formatRelativeTime(version.timestamp)}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {formatDateTime(version.timestamp)} · {version.metadata.device}
                    </CardDescription>
                  </div>
                  
                  {index > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <IconDots />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => previewVersion(version.id)}>
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => restoreVersion(version.id)}>
                          Restore
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => compareWithCurrent(version.id)}>
                          Compare with Current
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              
              {/* Preview of changes */}
              {version.diff && (
                <CardContent className="pt-0">
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2 text-green-600">
                      <IconPlus className="w-3 h-3" />
                      <span>{version.diff.additions} additions</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-600">
                      <IconMinus className="w-3 h-3" />
                      <span>{version.diff.deletions} deletions</span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        ))}
      </div>
    </ScrollArea>
  </SheetContent>
</Sheet>
```

---

### **Q5: Batch Upload Concurrency - How many parallel uploads?**

**Answer**: Adaptive based on network conditions

```typescript
function getOptimalConcurrency(): number {
  const connection = (navigator as any).connection;
  
  if (!connection) {
    return 5; // Default for desktop
  }
  
  const effectiveType = connection.effectiveType;
  const downlink = connection.downlink; // Mbps
  const rtt = connection.rtt; // Round-trip time in ms
  
  // Adjust based on connection quality
  if (effectiveType === '4g' && downlink > 10) {
    return 10; // Fast connection
  } else if (effectiveType === '4g') {
    return 5;  // Standard 4G
  } else if (effectiveType === '3g') {
    return 3;  // Slower 3G
  } else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
    return 1;  // Very slow, sequential only
  }
  
  // Fallback based on RTT
  if (rtt < 100) {
    return 8;  // Low latency
  } else if (rtt < 300) {
    return 4;  // Medium latency
  } else {
    return 2;  // High latency
  }
}

class AdaptiveBatchUploader {
  private concurrency: number;
  private queue: UploadTask[] = [];
  private active: Set<UploadTask> = new Set();
  
  constructor() {
    this.concurrency = getOptimalConcurrency();
    
    // Listen for network changes
    (navigator as any).connection?.addEventListener('change', () => {
      this.concurrency = getOptimalConcurrency();
      this.processQueue();
    });
  }
  
  async upload(tasks: UploadTask[]): Promise<UploadResult[]> {
    this.queue.push(...tasks);
    return this.processQueue();
  }
  
  private async processQueue(): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    while (this.queue.length > 0 || this.active.size > 0) {
      // Fill up to concurrency limit
      while (this.active.size < this.concurrency && this.queue.length > 0) {
        const task = this.queue.shift()!;
        this.active.add(task);
        
        // Process task
        task.execute()
          .then(result => {
            results.push(result);
            this.active.delete(task);
            this.processQueue(); // Continue processing
          })
          .catch(error => {
            // Retry logic
            if (task.retryCount < 3) {
              task.retryCount++;
              this.queue.unshift(task); // Re-add to front
            } else {
              results.push({ success: false, error });
              this.active.delete(task);
            }
          });
      }
      
      // Wait for at least one to complete
      if (this.active.size >= this.concurrency) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
}
```

**Progress UI**:
```tsx
function BatchUploadProgress({ uploader }: { uploader: AdaptiveBatchUploader }) {
  const [progress, setProgress] = useState(uploader.getProgress());
  
  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Uploading Documents
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => uploader.cancel()}
          >
            <IconX className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Overall progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">
              {progress.completed} of {progress.total}
            </span>
            <span className="font-medium">
              {progress.percentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={progress.percentage} />
        </div>
        
        {/* Current uploads */}
        <div className="space-y-2">
          {progress.active.map(task => (
            <div key={task.id} className="flex items-center gap-2 text-xs">
              <IconLoader className="w-3 h-3 animate-spin" />
              <span className="flex-1 truncate">{task.filename}</span>
              <span className="text-gray-500">
                {formatBytes(task.uploaded)} / {formatBytes(task.total)}
              </span>
            </div>
          ))}
        </div>
        
        {/* Network info */}
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
          <IconWifi className="w-3 h-3" />
          <span>
            {progress.concurrency} concurrent · {progress.networkType}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 🔮 **6. Advanced Features (Phase 5+)**

### **Feature 1: Predictive Sync**
Use ML to predict which documents user will open next and pre-sync them.

```typescript
class PredictiveSyncManager {
  private model: DocumentAccessModel;
  
  async predictNextDocuments(userId: string): Promise<string[]> {
    const history = await this.getUserAccessHistory(userId);
    const currentTime = new Date().getHours();
    const currentDay = new Date().getDay();
    
    // Simple heuristics (can be replaced with ML model)
    const predictions = [];
    
    // 1. Recently viewed docs (80% likely to revisit)
    const recentDocs = history.filter(h => 
      isWithin(h.timestamp, 24, 'hours')
    );
    predictions.push(...recentDocs.map(d => d.id));
    
    // 2. Docs opened at this time of day
    const timeBasedDocs = history.filter(h => 
      h.timestamp.getHours() === currentTime
    );
    predictions.push(...timeBasedDocs.map(d => d.id));
    
    // 3. Docs related to current document
    if (currentDocumentId) {
      const related = await this.findRelatedDocuments(currentDocumentId);
      predictions.push(...related.map(d => d.id));
    }
    
    // Dedupe and return top 10
    return [...new Set(predictions)].slice(0, 10);
  }
  
  async prefetchInBackground() {
    const predictions = await this.predictNextDocuments(currentUserId);
    
    // Fetch in background with low priority
    for (const docId of predictions) {
      await syncManager.syncDocument(docId, { 
        priority: 'low',
        background: true 
      });
    }
  }
}
```

---

### **Feature 2: Collaborative Cursors (Google Docs Style)**
Show where other users are typing in real-time.

```typescript
interface UserPresence {
  userId: string;
  userName: string;
  userAvatar: string;
  documentId: string;
  cursorPosition: number;
  selection: [number, number] | null;
  color: string;
  lastActivity: Date;
}

class CollaborationManager {
  private ws: WebSocket;
  private presenceMap = new Map<string, UserPresence>();
  
  connect(documentId: string) {
    this.ws = new WebSocket(`wss://api.example.com/collab/${documentId}`);
    
    this.ws.on('presence', (presence: UserPresence) => {
      this.presenceMap.set(presence.userId, presence);
      this.renderCursor(presence);
    });
    
    this.ws.on('cursor', (data: { userId: string; position: number }) => {
      this.updateCursor(data.userId, data.position);
    });
  }
  
  onLocalCursorMove(position: number) {
    // Throttle cursor updates (max 10/sec)
    throttle(() => {
      this.ws.send({
        type: 'cursor',
        position: position
      });
    }, 100);
  }
  
  renderCursor(presence: UserPresence) {
    // Render cursor at position with user's color
    const cursorElement = document.createElement('div');
    cursorElement.className = 'collaborative-cursor';
    cursorElement.style.borderColor = presence.color;
    
    const label = document.createElement('div');
    label.className = 'cursor-label';
    label.textContent = presence.userName;
    label.style.backgroundColor = presence.color;
    
    cursorElement.appendChild(label);
    
    // Position at cursor location
    const position = this.getPositionInEditor(presence.cursorPosition);
    cursorElement.style.left = `${position.x}px`;
    cursorElement.style.top = `${position.y}px`;
    
    editorContainer.appendChild(cursorElement);
  }
}
```

**UI Component**:
```tsx
function CollaborativeCursors({ presence }: { presence: UserPresence[] }) {
  return (
    <>
      {presence.map(user => (
        <motion.div
          key={user.userId}
          className="absolute pointer-events-none z-50"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: user.cursorPosition.x,
            y: user.cursorPosition.y
          }}
          transition={{ duration: 0.15 }}
        >
          {/* Cursor */}
          <div 
            className="w-0.5 h-5 -mt-5"
            style={{ backgroundColor: user.color }}
          />
          
          {/* User label */}
          <div
            className="px-1.5 py-0.5 rounded text-xs text-white whitespace-nowrap"
            style={{ backgroundColor: user.color }}
          >
            {user.userName}
          </div>
          
          {/* Selection highlight */}
          {user.selection && (
            <div
              className="absolute h-5 -mt-5 opacity-30"
              style={{
                backgroundColor: user.color,
                left: 0,
                width: `${user.selection[1] - user.selection[0]}ch`
              }}
            />
          )}
        </motion.div>
      ))}
    </>
  );
}
```

---

### **Feature 3: Smart Conflict Resolution**
Auto-merge non-overlapping changes.

```typescript
interface Change {
  type: 'insert' | 'delete' | 'replace';
  position: number;
  length: number;
  content?: string;
}

class SmartConflictResolver {
  detectConflicts(localChanges: Change[], remoteChanges: Change[]): boolean {
    // Check if changes overlap
    for (const local of localChanges) {
      for (const remote of remoteChanges) {
        if (this.changesOverlap(local, remote)) {
          return true; // Has conflict
        }
      }
    }
    return false; // No conflict, can auto-merge
  }
  
  changesOverlap(a: Change, b: Change): boolean {
    const aStart = a.position;
    const aEnd = a.position + a.length;
    const bStart = b.position;
    const bEnd = b.position + b.length;
    
    // Check if ranges overlap
    return !(aEnd <= bStart || bEnd <= aStart);
  }
  
  autoMerge(base: string, localChanges: Change[], remoteChanges: Change[]): string {
    // Apply both sets of changes
    let result = base;
    
    // Sort all changes by position (reverse order for safe application)
    const allChanges = [...localChanges, ...remoteChanges].sort(
      (a, b) => b.position - a.position
    );
    
    for (const change of allChanges) {
      result = this.applyChange(result, change);
    }
    
    return result;
  }
  
  async resolveConflict(conflict: Conflict): Promise<string> {
    const localChanges = this.extractChanges(conflict.base, conflict.local);
    const remoteChanges = this.extractChanges(conflict.base, conflict.remote);
    
    if (this.detectConflicts(localChanges, remoteChanges)) {
      // True conflict - requires manual resolution
      return this.showConflictUI(conflict);
    } else {
      // No overlap - auto-merge silently
      const merged = this.autoMerge(conflict.base, localChanges, remoteChanges);
      
      showNotification({
        title: 'Changes Merged Automatically',
        message: 'Your changes and remote changes were combined successfully',
        duration: 3000
      });
      
      return merged;
    }
  }
}
```

---

## 🎨 **7. Premium Sync Experience Checklist**

### **Silent by Default**
- [ ] No sync indicator when everything is working
- [ ] Subtle ambient glow only during active sync
- [ ] Status badge only appears when user needs to know

### **Non-Blocking**
- [ ] Sync happens in background (never locks UI)
- [ ] User can keep working during sync
- [ ] Editor never gets interrupted by incoming updates

### **Intelligent**
- [ ] Debounced saves (don't spam server while typing)
- [ ] Priority queue (current doc syncs first)
- [ ] Network-aware (adapts to connection speed)
- [ ] Battery-aware (reduces sync on low power)

### **Conflict Handling**
- [ ] Auto-merge when possible (no user intervention)
- [ ] Inline banner for conflicts (not modal)
- [ ] Side-by-side diff view
- [ ] One-click resolution ("Keep Mine" / "Use Server")

### **Transparency**
- [ ] Last sync time visible in settings
- [ ] Sync history/log for debugging
- [ ] Storage usage indicator
- [ ] Manual "Sync Now" button

### **Resilient**
- [ ] Retry with exponential backoff
- [ ] Queue changes when offline
- [ ] Detect corrupted storage
- [ ] Graceful degradation

### **Performance**
- [ ] Diff-based version storage
- [ ] Chunked upload for large files
- [ ] Image/attachment separate from text
- [ ] Selective sync (only active workspaces)

---

## 🚀 **8. Implementation Priority**

### **Phase 1: Foundation (Week 1-2)** ✅ Current
- [x] Online + Logged In mode
- [ ] Basic offline detection
- [ ] Simple IndexedDB setup
- [ ] Queue pending changes

### **Phase 2: Core Sync (Week 3-4)**
- [ ] Implement SyncManager
- [ ] Auto-sync on reconnect
- [ ] Last-write-wins resolution
- [ ] Progress indicators

### **Phase 3: Polish (Week 5-6)**
- [ ] Ambient sync indicators
- [ ] Inline conflict UI
- [ ] Version history
- [ ] Storage management

### **Phase 4: Advanced (Week 7-8)**
- [ ] Diff-based versioning
- [ ] Smart conflict resolution
- [ ] Predictive prefetch
- [ ] Network-aware batching

### **Phase 5: Elite (Week 9-10)**
- [ ] Collaborative cursors
- [ ] Real-time presence
- [ ] Advanced conflict merge
- [ ] ML-based predictions

---

## 💬 **9. Final Recommendations**

### **Do This First**
1. **Implement document upload** (drag-drop + file picker)
2. **Add network status detection** (online/offline events)
3. **Build IndexedDB layer** (queue structure)
4. **Create sync indicator UI** (ambient, not intrusive)

### **Don't Worry About (Yet)**
1. Real-time collaboration (Phase 5)
2. Manual conflict merging (auto-merge first)
3. Cross-device cursor sync (Phase 5)
4. Advanced version control (basic history first)

### **Test Heavily**
1. **Offline scenarios**: Work offline for hours, then reconnect
2. **Network flakiness**: Turn Wi-Fi on/off repeatedly
3. **Concurrent edits**: Edit same doc on 2 devices
4. **Large batches**: Upload 100+ documents at once
5. **Corrupted storage**: Simulate IndexedDB failures

### **Learn From**
- **Notion**: Best offline-first sync in the industry
- **Linear**: Cleanest ambient status indicators
- **Obsidian**: Great local-first philosophy
- **Google Docs**: Gold standard for collaboration

---

## 📚 **10. Resources & References**

### **Technical Reading**
- [Operational Transformation](https://en.wikipedia.org/wiki/Operational_transformation) (for real-time collab)
- [CRDTs](https://crdt.tech/) (Conflict-free Replicated Data Types)
- [IndexedDB Best Practices](https://web.dev/indexeddb-best-practices/)
- [Service Workers for Offline](https://developers.google.com/web/fundamentals/primers/service-workers)

### **UI/UX Inspiration**
- [Linear's sync indicators](https://linear.app)
- [Notion's offline mode](https://notion.so)
- [Arc's connection states](https://arc.net)
- [Figma's multiplayer cursors](https://figma.com)

### **Libraries to Consider**
```json
{
  "sync": [
    "dexie - Better IndexedDB wrapper",
    "idb - Minimal IndexedDB wrapper",
    "yjs - CRDT for real-time collab"
  ],
  "diff": [
    "diff-match-patch - Google's diff algorithm",
    "fast-diff - Faster alternative",
    "json-diff - For structured data"
  ],
  "network": [
    "reconnecting-websocket - Auto-reconnect WS",
    "axios - HTTP with retry logic",
    "ky - Modern fetch wrapper"
  ]
}
```

---

**Session Complete!** 🎉

**Related Documents**:
- See `OFFLINE_SYNC_STRATEGY.md` for the base strategy
- See implementation roadmap for phased rollout plan

**Next Action**: Pick one item from Phase 2 and start building!

