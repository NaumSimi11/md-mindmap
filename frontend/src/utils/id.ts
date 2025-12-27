/**
 * Unified ID Utilities
 * ====================
 * 
 * Single source of truth for all ID operations in MDReader.
 * 
 * ID Formats:
 * - Local (IndexedDB):  doc_<uuid>, ws_<uuid>, fld_<uuid>
 * - Cloud (Backend):    <uuid> (bare UUID)
 * 
 * This file consolidates:
 * - utils/identity.ts (canonical keys, extractUuid)
 * - utils/id-generator.ts (generators, extractUUID, validation)
 * - SelectiveSyncService.ts (toCloudId, toLocalId)
 * 
 * @module utils/id
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Prefix used for local document IDs */
export const DOC_PREFIX = 'doc_';

/** Prefix used for local workspace IDs */
export const WS_PREFIX = 'ws_';

/** Prefix used for local folder IDs */
export const FLD_PREFIX = 'fld_';

/** UUID v4 regex pattern (case-insensitive) */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Strict UUID v4 regex (validates version nibble) */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ============================================================================
// CORE EXTRACTION & NORMALIZATION
// ============================================================================

/**
 * Extract bare UUID from a prefixed ID.
 * 
 * @example
 * extractUuid('doc_a1b2c3d4-...') → 'a1b2c3d4-...'
 * extractUuid('a1b2c3d4-...')     → 'a1b2c3d4-...' (unchanged)
 * extractUuid('ws_1234_abc')      → 'ws_1234_abc' (no valid UUID suffix)
 * 
 * @param id - The ID to extract from (may be prefixed or bare)
 * @returns Bare UUID if valid suffix found, otherwise original ID
 */
export function extractUuid(id: string): string {
  if (!id) return id;

  const underscoreIndex = id.indexOf('_');
  if (underscoreIndex === -1) {
    // Already a bare UUID or other format
    return id;
  }

  const possibleUuid = id.slice(underscoreIndex + 1);

  // Validate it looks like a UUID
  if (UUID_REGEX.test(possibleUuid)) {
    return possibleUuid;
  }

  // Suffix doesn't look like UUID - return original
  return id;
}

// Alias for backward compatibility with id-generator.ts users
export const extractUUID = extractUuid;

/**
 * Convert any document ID to cloud format (bare UUID).
 * Used when sending IDs to the backend API.
 * 
 * @example
 * toCloudId('doc_a1b2c3d4-...') → 'a1b2c3d4-...'
 * toCloudId('a1b2c3d4-...')     → 'a1b2c3d4-...'
 */
export function toCloudId(id: string): string {
  if (!id) return id;
  if (id.startsWith(DOC_PREFIX)) return id.slice(DOC_PREFIX.length);
  if (id.startsWith(WS_PREFIX)) return id.slice(WS_PREFIX.length);
  if (id.startsWith(FLD_PREFIX)) return id.slice(FLD_PREFIX.length);
  return id;
}

/**
 * Convert any document ID to local format (with doc_ prefix).
 * Used when storing IDs in IndexedDB.
 * 
 * @example
 * toLocalDocId('a1b2c3d4-...')     → 'doc_a1b2c3d4-...'
 * toLocalDocId('doc_a1b2c3d4-...') → 'doc_a1b2c3d4-...'
 */
export function toLocalDocId(id: string): string {
  if (!id) return id;
  return id.startsWith(DOC_PREFIX) ? id : `${DOC_PREFIX}${id}`;
}

// Alias for backward compatibility
export const toLocalId = toLocalDocId;

/**
 * Convert any workspace ID to local format (with ws_ prefix).
 */
export function toLocalWorkspaceId(id: string): string {
  if (!id) return id;
  return id.startsWith(WS_PREFIX) ? id : `${WS_PREFIX}${id}`;
}

/**
 * Convert any folder ID to local format (with fld_ prefix).
 */
export function toLocalFolderId(id: string): string {
  if (!id) return id;
  return id.startsWith(FLD_PREFIX) ? id : `${FLD_PREFIX}${id}`;
}

// ============================================================================
// CANONICAL KEYS (for deduplication)
// ============================================================================

/**
 * Compute canonical key for a document.
 * Used for deduplicating guest/backend documents in sidebar.
 * 
 * Priority:
 * 1. cloudId (if present)
 * 2. sync.cloudId (if present)
 * 3. id (normalized)
 */
export function getCanonicalDocKey(metaOrDoc: {
  id: string;
  sync?: { cloudId?: string };
  cloudId?: string;
}): string {
  const cloudId = metaOrDoc.cloudId ?? metaOrDoc.sync?.cloudId;
  if (cloudId) return extractUuid(cloudId);
  return extractUuid(metaOrDoc.id);
}

/**
 * Compute canonical key for a workspace.
 */
export function getCanonicalWorkspaceKey(ws: {
  id: string;
  cloudId?: string;
}): string {
  const cloudId = ws.cloudId;
  if (cloudId) return extractUuid(cloudId);
  return extractUuid(ws.id);
}

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate a new document ID with prefix.
 * @example generateDocumentId() → 'doc_a1b2c3d4-e5f6-...'
 */
export function generateDocumentId(): string {
  return `${DOC_PREFIX}${uuidv4()}`;
}

/**
 * Generate a new workspace ID with prefix.
 * @example generateWorkspaceId() → 'ws_a1b2c3d4-e5f6-...'
 */
export function generateWorkspaceId(): string {
  return `${WS_PREFIX}${uuidv4()}`;
}

/**
 * Generate a new folder ID with prefix.
 * @example generateFolderId() → 'fld_a1b2c3d4-e5f6-...'
 */
export function generateFolderId(): string {
  return `${FLD_PREFIX}${uuidv4()}`;
}

/**
 * Generate a bare UUID without prefix.
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Generate a user ID with prefix.
 */
export function generateUserId(): string {
  return `usr_${uuidv4()}`;
}

/**
 * Generate a guest user ID with prefix.
 */
export function generateGuestUserId(): string {
  return `guest_${uuidv4()}`;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if string is a valid UUID (with or without prefix).
 */
export function isValidUUID(id: string): boolean {
  if (!id) return false;
  const uuidPart = id.includes('_') ? id.split('_').pop()! : id;
  return UUID_V4_REGEX.test(uuidPart);
}

/**
 * Check if ID uses a legacy format (non-UUID based).
 */
export function isLegacyId(id: string): boolean {
  if (!id) return true;
  if (id === 'guest-workspace') return true;
  if (id === 'tauri-workspace') return true;
  if (id.startsWith('folder-') && !id.includes('_')) return true;
  if (id.startsWith('doc-') && !id.includes('_')) return true;
  return !isValidUUID(id);
}

// ============================================================================
// ENTITY TYPE DETECTION
// ============================================================================

/** Entity types that can be identified by prefix */
export type EntityType = 'workspace' | 'folder' | 'document' | 'user' | 'guest' | 'unknown';

/**
 * Detect entity type from prefixed ID.
 */
export function getEntityType(id: string): EntityType {
  if (!id) return 'unknown';
  if (id.startsWith(WS_PREFIX)) return 'workspace';
  if (id.startsWith(FLD_PREFIX)) return 'folder';
  if (id.startsWith(DOC_PREFIX)) return 'document';
  if (id.startsWith('usr_')) return 'user';
  if (id.startsWith('guest_')) return 'guest';
  return 'unknown';
}

/**
 * Check if ID is a document ID (has doc_ prefix or is bare UUID).
 */
export function isDocumentId(id: string): boolean {
  if (!id) return false;
  if (id.startsWith(DOC_PREFIX)) return true;
  // Bare UUID is also considered a document ID (from cloud)
  return UUID_REGEX.test(id);
}

/**
 * Check if ID is a workspace ID.
 */
export function isWorkspaceId(id: string): boolean {
  return id?.startsWith(WS_PREFIX) || false;
}

/**
 * Check if ID is a folder ID.
 */
export function isFolderId(id: string): boolean {
  return id?.startsWith(FLD_PREFIX) || false;
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Migrate a legacy ID to new UUID-based format.
 * Generates a new ID - the caller must handle storing the mapping.
 */
export function migrateLegacyId(
  _legacyId: string,
  entityType: 'workspace' | 'folder' | 'document'
): string {
  switch (entityType) {
    case 'workspace':
      return generateWorkspaceId();
    case 'folder':
      return generateFolderId();
    case 'document':
      return generateDocumentId();
    default:
      return generateUUID();
  }
}

// ============================================================================
// CONVENIENCE OBJECT (backward compatibility with id-generator.ts)
// ============================================================================

/**
 * Convenience object with all ID utilities.
 * @deprecated Prefer importing individual functions for tree-shaking.
 */
export const idGenerator = {
  // Generators
  workspace: generateWorkspaceId,
  folder: generateFolderId,
  document: generateDocumentId,
  user: generateUserId,
  guest: generateGuestUserId,
  uuid: generateUUID,

  // Validation
  isValid: isValidUUID,
  isLegacy: isLegacyId,
  getType: getEntityType,

  // Extraction
  extract: extractUuid,
  toCloud: toCloudId,
  toLocal: toLocalDocId,

  // Migration
  migrate: migrateLegacyId,
};

export default idGenerator;

