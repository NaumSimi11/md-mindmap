/**
 * Workspace Service Types
 * 
 * Shared types for all workspace services (Guest, Backend, Tauri)
 * All IDs use UUID format (ws_, fld_, doc_ prefixes)
 */

/**
 * Workspace - Top-level container for folders and documents
 */
export interface Workspace {
  id: string;              // ws_{uuid}
  name: string;
  icon: string;            // Emoji
  description?: string;
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
  
  // Sync metadata
  syncStatus: 'local' | 'synced' | 'syncing' | 'conflict';
  lastSyncedAt?: string;   // ISO 8601
  version: number;         // Optimistic locking
}

/**
 * Folder - Hierarchical organization within workspace
 */
export interface Folder {
  id: string;              // fld_{uuid}
  workspaceId: string;     // ws_{uuid}
  name: string;
  icon: string;            // Emoji
  parentId: string | null; // fld_{uuid} or null for root
  position: number;        // For ordering
  isExpanded: boolean;     // UI state
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
  
  // Sync metadata
  syncStatus: 'local' | 'synced' | 'syncing' | 'conflict';
  lastSyncedAt?: string;   // ISO 8601
  version: number;         // Optimistic locking
}

/**
 * Document Metadata + Content - Full document info (stored in IndexedDB)
 */
export interface DocumentMeta {
  id: string;              // doc_{uuid}
  workspaceId: string;     // ws_{uuid}
  folderId: string | null; // fld_{uuid} or null for root
  title: string;
  type: 'markdown' | 'mindmap' | 'presentation';
  content: string;         // 🔥 Full document content (moved from Yjs to IndexedDB)
  starred: boolean;
  tags: string[];
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
  lastOpenedAt?: string;   // ISO 8601
  
  // Sync metadata
  syncStatus: 'local' | 'synced' | 'syncing' | 'conflict';
  cloudId?: string;        // Backend document ID (when synced)
  lastSyncedAt?: string;   // ISO 8601
  yjsVersion?: number;     // Canonical Yjs version from cloud
  yjsStateB64?: string;    // 🔥 Full Yjs binary truth (Base64)
  version: number;         // Optimistic locking
}

/**
 * Guest User - Anonymous user with local-only data
 */
export interface GuestUser {
  id: string;              // guest_{uuid}
  badge: string;           // Fun identifier (e.g., "💫 Visionary", "🚀 Explorer")
  sessionCount: number;    // Number of times they've visited
  createdAt: string;       // ISO 8601
  lastSeenAt: string;      // ISO 8601
}

/**
 * Create Workspace Input
 */
export interface CreateWorkspaceInput {
  name: string;
  icon?: string;
  description?: string;
}

/**
 * Create Folder Input
 */
export interface CreateFolderInput {
  workspaceId: string;
  name: string;
  icon?: string;
  parentId?: string | null;
}

/**
 * Create Document Input
 */
export interface CreateDocumentInput {
  workspaceId: string;
  folderId?: string | null;
  title: string;
  type: 'markdown' | 'mindmap' | 'presentation';
  content?: string;  // 🔥 Optional initial content
}

/**
 * Update Workspace Input
 */
export interface UpdateWorkspaceInput {
  name?: string;
  icon?: string;
  description?: string;
}

/**
 * Update Folder Input
 */
export interface UpdateFolderInput {
  name?: string;
  icon?: string;
  parentId?: string | null;
  position?: number;
  isExpanded?: boolean;
  // Sync metadata (for push-to-cloud updates)
  syncStatus?: 'local' | 'synced' | 'syncing' | 'conflict';
  cloudId?: string;
  lastSyncedAt?: string;
}

/**
 * Update Document Input
 */
export interface UpdateDocumentInput {
  title?: string;
  content?: string;  // 🔥 Update content
  folderId?: string | null;
  starred?: boolean;
  tags?: string[];
  // Sync metadata (for push-to-cloud updates)
  syncStatus?: 'local' | 'synced' | 'syncing' | 'conflict';
  cloudId?: string;
  lastSyncedAt?: string;
  yjsVersion?: number;
  yjsStateB64?: string;
}

