/**
 * Event Registry - Central documentation for all custom events
 * 
 * This file defines the contracts for all custom events used in the application.
 * All events should be dispatched using the helper functions below.
 * 
 * Benefits:
 * - Type safety for event payloads
 * - Centralized documentation
 * - Consistent naming conventions
 * - Easy discoverability
 */

// ============================================================================
// AUTH EVENTS
// ============================================================================

/**
 * Dispatched after successful login
 * Listeners: SyncContext, UIStateContext
 */
export interface AuthLoginEvent {
  user: {
    id: string;
    email: string;
    username?: string;
  };
}

/**
 * Dispatched after logout
 * Listeners: YjsDocumentManager, BackendWorkspaceService, UnifiedSyncManager, 
 *            DocumentLifecycleManager, SyncManager
 */
export interface AuthLogoutEvent {
  // No payload
}

/**
 * Dispatched when API returns 401
 * Listeners: useAuth hook
 */
export interface AuthUnauthorizedEvent {
  // No payload
}

// ============================================================================
// SYNC EVENTS
// ============================================================================

/**
 * Dispatched when BackendWorkspaceService completes initialization
 * Listeners: SyncContext (for batch sync after login)
 */
export interface SyncBackendReadyEvent {
  // No payload
}

/**
 * Dispatched when batch sync completes after login
 * Listeners: UI components for refresh
 */
export interface BatchSyncCompleteEvent {
  totalOps: number;
  totalSuccessful: number;
  totalFailed: number;
}

/**
 * Dispatched when a document's sync status changes
 */
export interface DocumentSyncStatusEvent {
  documentId: string;
  status: 'local' | 'syncing' | 'synced' | 'conflict' | 'pending';
}

// ============================================================================
// DOCUMENT EVENTS
// ============================================================================

/**
 * Dispatched when a document is created
 */
export interface DocumentCreatedEvent {
  documentId: string;
  workspaceId: string;
  title: string;
}

/**
 * Dispatched when a document is deleted
 */
export interface DocumentDeletedEvent {
  documentId: string;
}

/**
 * Dispatched when document content changes (debounced)
 */
export interface DocumentUpdatedEvent {
  documentId: string;
  source: 'local' | 'remote';
}

// ============================================================================
// WORKSPACE EVENTS
// ============================================================================

/**
 * Dispatched when workspace is switched
 */
export interface WorkspaceSwitchEvent {
  previousWorkspaceId: string | null;
  newWorkspaceId: string;
}

// ============================================================================
// EVENT NAMES (Constants)
// ============================================================================

export const EventNames = {
  // Auth events
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_UNAUTHORIZED: 'auth:unauthorized',
  
  // Sync events
  SYNC_BACKEND_READY: 'sync:backend-ready',
  BATCH_SYNC_COMPLETE: 'batch-sync-complete',
  DOCUMENT_SYNC_STATUS: 'document:sync-status',
  
  // Document events
  DOCUMENT_CREATED: 'document:created',
  DOCUMENT_DELETED: 'document:deleted',
  DOCUMENT_UPDATED: 'document:updated',
  
  // Workspace events
  WORKSPACE_SWITCH: 'workspace:switch',
} as const;

// ============================================================================
// TYPE-SAFE DISPATCH HELPERS
// ============================================================================

/**
 * Dispatch auth:login event
 */
export function dispatchAuthLogin(user: AuthLoginEvent['user']): void {
  window.dispatchEvent(new CustomEvent(EventNames.AUTH_LOGIN, { 
    detail: { user } 
  }));
}

/**
 * Dispatch auth:logout event
 */
export function dispatchAuthLogout(): void {
  window.dispatchEvent(new CustomEvent(EventNames.AUTH_LOGOUT));
}

/**
 * Dispatch auth:unauthorized event
 */
export function dispatchAuthUnauthorized(): void {
  window.dispatchEvent(new CustomEvent(EventNames.AUTH_UNAUTHORIZED));
}

/**
 * Dispatch sync:backend-ready event
 */
export function dispatchSyncBackendReady(): void {
  window.dispatchEvent(new CustomEvent(EventNames.SYNC_BACKEND_READY));
}

/**
 * Dispatch batch-sync-complete event
 */
export function dispatchBatchSyncComplete(detail: BatchSyncCompleteEvent): void {
  window.dispatchEvent(new CustomEvent(EventNames.BATCH_SYNC_COMPLETE, { detail }));
}

/**
 * Dispatch document:sync-status event
 */
export function dispatchDocumentSyncStatus(detail: DocumentSyncStatusEvent): void {
  window.dispatchEvent(new CustomEvent(EventNames.DOCUMENT_SYNC_STATUS, { detail }));
}

/**
 * Dispatch document:created event
 */
export function dispatchDocumentCreated(detail: DocumentCreatedEvent): void {
  window.dispatchEvent(new CustomEvent(EventNames.DOCUMENT_CREATED, { detail }));
}

/**
 * Dispatch document:deleted event
 */
export function dispatchDocumentDeleted(detail: DocumentDeletedEvent): void {
  window.dispatchEvent(new CustomEvent(EventNames.DOCUMENT_DELETED, { detail }));
}

/**
 * Dispatch document:updated event
 */
export function dispatchDocumentUpdated(detail: DocumentUpdatedEvent): void {
  window.dispatchEvent(new CustomEvent(EventNames.DOCUMENT_UPDATED, { detail }));
}

/**
 * Dispatch workspace:switch event
 */
export function dispatchWorkspaceSwitch(detail: WorkspaceSwitchEvent): void {
  window.dispatchEvent(new CustomEvent(EventNames.WORKSPACE_SWITCH, { detail }));
}

// ============================================================================
// TYPE-SAFE LISTENER HELPERS
// ============================================================================

type EventCallback<T> = (event: CustomEvent<T>) => void;

/**
 * Add typed event listener with automatic cleanup
 * Returns a cleanup function
 */
export function addEventListener<T>(
  eventName: string,
  callback: EventCallback<T>
): () => void {
  const handler = (event: Event) => callback(event as CustomEvent<T>);
  window.addEventListener(eventName, handler);
  return () => window.removeEventListener(eventName, handler);
}

/**
 * Listen for auth:login
 */
export function onAuthLogin(callback: EventCallback<AuthLoginEvent>): () => void {
  return addEventListener(EventNames.AUTH_LOGIN, callback);
}

/**
 * Listen for auth:logout
 */
export function onAuthLogout(callback: () => void): () => void {
  return addEventListener(EventNames.AUTH_LOGOUT, callback as any);
}

/**
 * Listen for sync:backend-ready
 */
export function onSyncBackendReady(callback: () => void): () => void {
  return addEventListener(EventNames.SYNC_BACKEND_READY, callback as any);
}

/**
 * Listen for batch-sync-complete
 */
export function onBatchSyncComplete(callback: EventCallback<BatchSyncCompleteEvent>): () => void {
  return addEventListener(EventNames.BATCH_SYNC_COMPLETE, callback);
}

/**
 * Listen for document:sync-status
 */
export function onDocumentSyncStatus(callback: EventCallback<DocumentSyncStatusEvent>): () => void {
  return addEventListener(EventNames.DOCUMENT_SYNC_STATUS, callback);
}

