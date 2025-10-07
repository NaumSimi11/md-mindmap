# 🖥️ Tauri Desktop Implementation Plan for @mdreader-main

**Goal:** Add Tauri desktop support to the React/TypeScript app while keeping web functionality intact.

---

## 📊 **CURRENT STATE ANALYSIS**

### **@mdtauri-main (Old - Vue/JS)**
- ✅ Vue 3 + Vite
- ✅ Tauri 2.x integration
- ✅ Rust backend with file system commands
- ✅ Hybrid storage (desktop files + web localStorage)
- ✅ Platform detection: `window.__TAURI__`
- ✅ Workspace folder selection
- ✅ Direct .md file read/write

### **@mdreader-main (New - React/TS)**
- ✅ React 18 + TypeScript + Vite
- ✅ Modern UI (shadcn/ui + Radix)
- ✅ Advanced features (AI, mindmaps, presentations)
- ✅ Web-only (localStorage)
- ❌ No Tauri integration yet
- ❌ No desktop file system support

---

## 🎯 **IMPLEMENTATION STRATEGY**

### **Phase 1: Add Tauri Dependencies (Week 1)**
**Goal:** Install Tauri without breaking existing web functionality

#### **1.1 Install Tauri CLI & Dependencies**
```bash
cd /Users/naum/Desktop/mdreader/mdreader-main

# Install Tauri CLI
npm install --save-dev @tauri-apps/cli@^2

# Install Tauri API
npm install @tauri-apps/api@^2
npm install @tauri-apps/plugin-opener@^2
npm install @tauri-apps/plugin-dialog@^2
npm install @tauri-apps/plugin-fs@^2
```

#### **1.2 Initialize Tauri**
```bash
npm run tauri init
```

**Configuration:**
- App name: `MD Creator`
- Window title: `MD Creator - AI-Powered Markdown & Mindmaps`
- Dev URL: `http://localhost:8080` (match current Vite port)
- Frontend dist: `../dist`
- Before dev command: `npm run dev`
- Before build command: `npm run build`

#### **1.3 Update package.json Scripts**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

---

### **Phase 2: Platform Detection Service (Week 1-2)**
**Goal:** Detect if running in Tauri vs web browser

#### **2.1 Create Platform Detection Utility**
```typescript
// src/utils/platform.ts

export type Platform = 'desktop' | 'web';

/**
 * Detect if running in Tauri desktop app
 * Tauri injects window.__TAURI__ when running in desktop mode
 */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

export function getPlatform(): Platform {
  return isDesktop() ? 'desktop' : 'web';
}

export function isTauriAvailable(): boolean {
  return isDesktop();
}

// Type guard for Tauri APIs
export function assertTauri(): asserts window is Window & { __TAURI__: any } {
  if (!isDesktop()) {
    throw new Error('Tauri APIs are only available in desktop mode');
  }
}
```

#### **2.2 Create Platform Context**
```typescript
// src/contexts/PlatformContext.tsx

import { createContext, useContext, ReactNode } from 'react';
import { getPlatform, Platform } from '@/utils/platform';

interface PlatformContextType {
  platform: Platform;
  isDesktop: boolean;
  isWeb: boolean;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const platform = getPlatform();
  
  return (
    <PlatformContext.Provider
      value={{
        platform,
        isDesktop: platform === 'desktop',
        isWeb: platform === 'web',
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within PlatformProvider');
  }
  return context;
}
```

---

### **Phase 3: Rust Backend Commands (Week 2)**
**Goal:** Port file system operations from old app

#### **3.1 Copy Rust Commands**
Copy from `@mdtauri-main/src-tauri/src/commands/` to new Tauri setup:

```rust
// src-tauri/src/commands/file_operations.rs

use tauri::command;
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileMetadata {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub modified: String,
    pub is_directory: bool,
}

#[command]
pub async fn select_workspace_folder() -> Result<String, String> {
    // Folder picker dialog
}

#[command]
pub async fn list_workspace_files(workspace_path: String) -> Result<Vec<FileMetadata>, String> {
    // List .md files in workspace
}

#[command]
pub async fn save_document_to_file(file_path: String, content: String) -> Result<(), String> {
    // Save markdown to disk
}

#[command]
pub async fn load_document_from_file(file_path: String) -> Result<String, String> {
    // Load markdown from disk
}

#[command]
pub async fn create_new_file(workspace_path: String, file_name: String) -> Result<String, String> {
    // Create new .md file
}

#[command]
pub async fn delete_file(file_path: String) -> Result<(), String> {
    // Delete file
}
```

#### **3.2 Register Commands in main.rs**
```rust
// src-tauri/src/main.rs

mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::file_operations::select_workspace_folder,
            commands::file_operations::list_workspace_files,
            commands::file_operations::save_document_to_file,
            commands::file_operations::load_document_from_file,
            commands::file_operations::create_new_file,
            commands::file_operations::delete_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

### **Phase 4: Hybrid Storage Service (Week 2-3)**
**Goal:** Unified API that works on both web and desktop

#### **4.1 Create Storage Abstraction**
```typescript
// src/services/storage/StorageService.ts

import { isDesktop } from '@/utils/platform';
import { invoke } from '@tauri-apps/api/tauri';

export interface Document {
  id: string;
  title: string;
  content: string;
  type: 'markdown' | 'mindmap' | 'presentation';
  createdAt: string;
  updatedAt: string;
  filePath?: string; // Desktop only
}

export class StorageService {
  private platform: 'desktop' | 'web';
  
  constructor() {
    this.platform = isDesktop() ? 'desktop' : 'web';
  }
  
  // ========================================
  // UNIFIED API (works on both platforms)
  // ========================================
  
  async getDocument(id: string): Promise<Document | null> {
    if (this.platform === 'desktop') {
      return this.getDocumentDesktop(id);
    } else {
      return this.getDocumentWeb(id);
    }
  }
  
  async saveDocument(doc: Document): Promise<void> {
    if (this.platform === 'desktop') {
      await this.saveDocumentDesktop(doc);
    } else {
      await this.saveDocumentWeb(doc);
    }
  }
  
  async listDocuments(): Promise<Document[]> {
    if (this.platform === 'desktop') {
      return this.listDocumentsDesktop();
    } else {
      return this.listDocumentsWeb();
    }
  }
  
  async deleteDocument(id: string): Promise<void> {
    if (this.platform === 'desktop') {
      await this.deleteDocumentDesktop(id);
    } else {
      await this.deleteDocumentWeb(id);
    }
  }
  
  // ========================================
  // DESKTOP IMPLEMENTATION (Tauri)
  // ========================================
  
  private async getDocumentDesktop(id: string): Promise<Document | null> {
    try {
      const filePath = this.getFilePathFromId(id);
      const content = await invoke<string>('load_document_from_file', { filePath });
      
      // Parse metadata from file
      return {
        id,
        title: this.extractTitle(content),
        content,
        type: 'markdown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        filePath,
      };
    } catch (error) {
      console.error('Failed to load document from desktop:', error);
      return null;
    }
  }
  
  private async saveDocumentDesktop(doc: Document): Promise<void> {
    const filePath = doc.filePath || this.generateFilePath(doc);
    await invoke('save_document_to_file', {
      filePath,
      content: doc.content,
    });
  }
  
  private async listDocumentsDesktop(): Promise<Document[]> {
    const workspacePath = await this.getWorkspacePath();
    const files = await invoke<any[]>('list_workspace_files', { workspacePath });
    
    return files
      .filter(f => !f.is_directory && f.name.endsWith('.md'))
      .map(f => ({
        id: this.generateIdFromPath(f.path),
        title: f.name.replace('.md', ''),
        content: '', // Lazy load
        type: 'markdown' as const,
        createdAt: f.modified,
        updatedAt: f.modified,
        filePath: f.path,
      }));
  }
  
  private async deleteDocumentDesktop(id: string): Promise<void> {
    const filePath = this.getFilePathFromId(id);
    await invoke('delete_file', { filePath });
  }
  
  // ========================================
  // WEB IMPLEMENTATION (localStorage)
  // ========================================
  
  private async getDocumentWeb(id: string): Promise<Document | null> {
    const docs = this.getAllDocumentsFromLocalStorage();
    return docs.find(d => d.id === id) || null;
  }
  
  private async saveDocumentWeb(doc: Document): Promise<void> {
    const docs = this.getAllDocumentsFromLocalStorage();
    const index = docs.findIndex(d => d.id === doc.id);
    
    if (index >= 0) {
      docs[index] = doc;
    } else {
      docs.push(doc);
    }
    
    localStorage.setItem('documents', JSON.stringify(docs));
  }
  
  private async listDocumentsWeb(): Promise<Document[]> {
    return this.getAllDocumentsFromLocalStorage();
  }
  
  private async deleteDocumentWeb(id: string): Promise<void> {
    const docs = this.getAllDocumentsFromLocalStorage();
    const filtered = docs.filter(d => d.id !== id);
    localStorage.setItem('documents', JSON.stringify(filtered));
  }
  
  // ========================================
  // HELPER METHODS
  // ========================================
  
  private getAllDocumentsFromLocalStorage(): Document[] {
    const stored = localStorage.getItem('documents');
    return stored ? JSON.parse(stored) : [];
  }
  
  private async getWorkspacePath(): Promise<string> {
    // Load from config or prompt user
    const config = localStorage.getItem('workspace-config');
    if (config) {
      return JSON.parse(config).workspacePath;
    }
    
    // Prompt user to select workspace
    const path = await invoke<string>('select_workspace_folder');
    localStorage.setItem('workspace-config', JSON.stringify({ workspacePath: path }));
    return path;
  }
  
  private generateFilePath(doc: Document): string {
    const workspacePath = localStorage.getItem('workspace-path') || '';
    return `${workspacePath}/${doc.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
  }
  
  private getFilePathFromId(id: string): string {
    // Decode file path from ID
    return atob(id);
  }
  
  private generateIdFromPath(path: string): string {
    // Encode file path as ID
    return btoa(path);
  }
  
  private extractTitle(content: string): string {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1] : 'Untitled';
  }
}

export const storageService = new StorageService();
```

---

### **Phase 5: Update Existing Services (Week 3)**
**Goal:** Replace localStorage calls with StorageService

#### **5.1 Update WorkspaceService**
```typescript
// src/services/workspace/WorkspaceService.ts

import { storageService } from '@/services/storage/StorageService';
import { isDesktop } from '@/utils/platform';

class WorkspaceService {
  // ... existing code ...
  
  createDocument(type: DocumentType, title: string, content: string, folderId: string | null): Document {
    const doc: Document = {
      id: `doc-${Date.now()}`,
      type,
      title,
      content,
      folderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Use hybrid storage
    storageService.saveDocument(doc);
    
    return doc;
  }
  
  getDocument(id: string): Document | null {
    return storageService.getDocument(id);
  }
  
  // ... rest of methods use storageService ...
}
```

---

### **Phase 6: Desktop-Specific UI (Week 3-4)**
**Goal:** Add desktop-only features

#### **6.1 Workspace Selector Modal**
```typescript
// src/components/workspace/WorkspaceSelectorModal.tsx

import { useState } from 'react';
import { usePlatform } from '@/contexts/PlatformContext';
import { invoke } from '@tauri-apps/api/tauri';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, Rocket } from 'lucide-react';

export function WorkspaceSelectorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isDesktop } = usePlatform();
  const [loading, setLoading] = useState(false);
  
  const handleSelectFolder = async () => {
    setLoading(true);
    try {
      const folderPath = await invoke<string>('select_workspace_folder');
      localStorage.setItem('workspace-path', folderPath);
      onClose();
    } catch (error) {
      console.error('Failed to select folder:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUseDemo = () => {
    localStorage.setItem('workspace-mode', 'demo');
    onClose();
  };
  
  if (!isDesktop) {
    return null; // Web users don't see this
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Welcome to MD Creator</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Select Workspace Folder */}
          <div className="border rounded-lg p-6 hover:border-purple-500 cursor-pointer" onClick={handleSelectFolder}>
            <Folder className="h-12 w-12 text-purple-500 mb-4" />
            <h3 className="font-semibold mb-2">Select Workspace Folder</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose a folder on your computer to store your .md files.
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>✅ Direct file access</div>
              <div>✅ No size limits</div>
              <div>✅ Works with Git</div>
              <div>✅ Backup friendly</div>
            </div>
          </div>
          
          {/* Use Demo */}
          <div className="border rounded-lg p-6 hover:border-indigo-500 cursor-pointer" onClick={handleUseDemo}>
            <Rocket className="h-12 w-12 text-indigo-500 mb-4" />
            <h3 className="font-semibold mb-2">Start with Demo Content</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Skip workspace setup and start with example documents.
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>⚡ Quick start</div>
              <div>📝 Example content</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### **Phase 7: Testing & Validation (Week 4)**

#### **7.1 Test Checklist**
- [ ] Web mode still works (no Tauri)
- [ ] Desktop mode detects platform correctly
- [ ] File system operations work
- [ ] Workspace folder selection works
- [ ] Documents save to disk
- [ ] Documents load from disk
- [ ] Auto-save works
- [ ] All existing features work in desktop mode

#### **7.2 Build Desktop App**
```bash
npm run tauri:build
```

**Output:**
- macOS: `.dmg` installer
- Windows: `.msi` installer
- Linux: `.deb` / `.AppImage`

---

## 📁 **FILE STRUCTURE**

```
mdreader-main/
├── src/
│   ├── utils/
│   │   └── platform.ts                 # Platform detection
│   ├── contexts/
│   │   └── PlatformContext.tsx         # Platform context
│   ├── services/
│   │   └── storage/
│   │       └── StorageService.ts       # Hybrid storage
│   └── components/
│       └── workspace/
│           └── WorkspaceSelectorModal.tsx
├── src-tauri/                          # NEW: Tauri backend
│   ├── src/
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   └── file_operations.rs
│   │   ├── main.rs
│   │   └── lib.rs
│   ├── Cargo.toml
│   ├── Cargo.lock
│   ├── tauri.conf.json
│   └── icons/
└── package.json                        # Updated with Tauri scripts
```

---

## 🎯 **MIGRATION BENEFITS**

### **For Users:**
- ✅ **Desktop app** with native file system
- ✅ **No file size limits** (unlike web localStorage)
- ✅ **Git-friendly** (files are real .md files)
- ✅ **Backup-friendly** (files on disk)
- ✅ **Still works as web app** (no breaking changes)

### **For Development:**
- ✅ **Gradual migration** (web keeps working)
- ✅ **Unified codebase** (one React app, two platforms)
- ✅ **Modern stack** (React + TypeScript + Rust)
- ✅ **Best of both worlds** (web convenience + desktop power)

---

## 🚀 **NEXT STEPS**

1. **Review this plan** - Make sure it aligns with your vision
2. **Start Phase 1** - Install Tauri dependencies
3. **Test platform detection** - Verify web still works
4. **Port Rust commands** - Copy file operations
5. **Build hybrid storage** - Unified API
6. **Test desktop build** - Create .dmg/.msi

---

**Ready to start? Say "GO" and I'll begin Phase 1!** 🎯
