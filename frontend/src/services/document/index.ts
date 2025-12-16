/**
 * Document Lifecycle System - Public API
 * 
 * Exports all public interfaces and classes
 */

// Main manager
export { DocumentLifecycleManager } from './DocumentLifecycleManager';
export { DocumentRegistry } from './DocumentRegistry';

// Types
export type {
  DocumentInstance,
  DocumentMetadata,
  CreateDocumentOptions,
  LoadDocumentOptions,
  SaveDocumentOptions,
  CloseDocumentOptions,
  DocumentEvent,
  DocumentEventListener,
  DocumentStateInfo,
  DocumentConfig,
} from './types';

export {
  DocumentState,
  DocumentEventType,
  DocumentErrorCode,
  DocumentError,
  DEFAULT_DOCUMENT_CONFIG,
} from './types';
