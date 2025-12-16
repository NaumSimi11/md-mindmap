/**
 * Document Lifecycle Types
 * 
 * Core types for document management
 */

import * as Y from 'yjs';
import type { WebsocketProvider } from 'y-websocket';
import type { IndexeddbPersistence } from 'y-indexeddb';

// ============================================================================
// DOCUMENT STATE
// ============================================================================

export enum DocumentState {
  UNLOADED = 'UNLOADED',
  LOADING = 'LOADING',
  LOADED = 'LOADED',
  SAVING = 'SAVING',
  SAVED = 'SAVED',
  ERROR = 'ERROR',
  CLOSING = 'CLOSING',
}

export interface DocumentStateInfo {
  state: DocumentState;
  timestamp: number;
  error?: Error;
}

// ============================================================================
// DOCUMENT INSTANCE
// ============================================================================

export interface DocumentInstance {
  id: string;
  ydoc: Y.Doc;
  state: DocumentState;
  refCount: number;
  createdAt: number;
  lastAccessedAt: number;
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  title: string;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
  size: number;
  version: number;
}

// ============================================================================
// DOCUMENT OPTIONS
// ============================================================================

export interface CreateDocumentOptions {
  title: string;
  initialContent?: string;
  folderId?: string;
  type?: 'markdown' | 'mindmap' | 'presentation';
  starred?: boolean;
  tags?: string[];
}

export interface LoadDocumentOptions {
  documentId: string;
  readonly?: boolean;
  version?: number;
}

export interface SaveDocumentOptions {
  force?: boolean;
  createVersion?: boolean;
}

export interface CloseDocumentOptions {
  force?: boolean;
  saveBeforeClose?: boolean;
}

// ============================================================================
// DOCUMENT EVENTS
// ============================================================================

export enum DocumentEventType {
  DOCUMENT_CREATED = 'DOCUMENT_CREATED',
  DOCUMENT_LOADED = 'DOCUMENT_LOADED',
  DOCUMENT_UPDATED = 'DOCUMENT_UPDATED',
  DOCUMENT_SAVED = 'DOCUMENT_SAVED',
  DOCUMENT_CLOSED = 'DOCUMENT_CLOSED',
  DOCUMENT_ERROR = 'DOCUMENT_ERROR',
  STATE_CHANGED = 'STATE_CHANGED',
}

export interface DocumentEvent {
  type: DocumentEventType;
  documentId: string;
  timestamp: number;
  data?: any;
}

export type DocumentEventListener = (event: DocumentEvent) => void;

// ============================================================================
// DOCUMENT ERRORS
// ============================================================================

export enum DocumentErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_LOADED = 'ALREADY_LOADED',
  LOAD_FAILED = 'LOAD_FAILED',
  SAVE_FAILED = 'SAVE_FAILED',
  CREATE_FAILED = 'CREATE_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  CORRUPTED = 'CORRUPTED',
  VERSION_CONFLICT = 'VERSION_CONFLICT',
}

export class DocumentError extends Error {
  constructor(
    public code: DocumentErrorCode,
    message: string,
    public documentId?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'DocumentError';
  }
}

// ============================================================================
// DOCUMENT CONFIGURATION
// ============================================================================

export interface DocumentConfig {
  // Lifecycle settings
  autoSaveInterval: number;
  autoCloseTimeout: number;
  maxOpenDocuments: number;
  
  // Performance settings
  lazyLoad: boolean;
  preloadEnabled: boolean;
  
  // Feature flags
  enableVersioning: boolean;
  enableAutoSave: boolean;
  enableOfflineMode: boolean;
}

export const DEFAULT_DOCUMENT_CONFIG: DocumentConfig = {
  autoSaveInterval: 3000, // 3 seconds
  autoCloseTimeout: 300000, // 5 minutes
  maxOpenDocuments: 10,
  lazyLoad: true,
  preloadEnabled: false,
  enableVersioning: true,
  enableAutoSave: true,
  enableOfflineMode: true,
};
