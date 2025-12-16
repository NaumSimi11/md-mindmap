/**
 * Universal ID Generator
 * 
 * Generates UUIDs for all entities in the system.
 * IDs are generated client-side first, enabling offline-first architecture
 * and seamless guest → authenticated user migration.
 * 
 * ID Format:
 * - Workspace: ws_123e4567-e89b-12d3-a456-426614174000
 * - Folder:    fld_987fcdeb-51a3-4f2e-9c3d-123456789abc
 * - Document:  doc_a1b2c3d4-e5f6-7890-abcd-ef1234567890
 * - User:      usr_12345678-1234-1234-1234-123456789012
 * - Guest:     guest_87654321-4321-4321-4321-210987654321
 * 
 * Why UUIDs?
 * - No server round-trip needed to create entities
 * - Collision probability: < 0.0001% (negligible with UUIDv4)
 * - Guest data can be synced to backend without ID remapping
 * - Enables true local-first architecture
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a workspace ID
 * Format: ws_{uuid}
 */
export function generateWorkspaceId(): string {
  return `ws_${uuidv4()}`;
}

/**
 * Generate a folder ID
 * Format: fld_{uuid}
 */
export function generateFolderId(): string {
  return `fld_${uuidv4()}`;
}

/**
 * Generate a document ID
 * Format: doc_{uuid}
 */
export function generateDocumentId(): string {
  return `doc_${uuidv4()}`;
}

/**
 * Generate a user ID (for registered users)
 * Format: usr_{uuid}
 */
export function generateUserId(): string {
  return `usr_${uuidv4()}`;
}

/**
 * Generate a guest user ID (for anonymous users)
 * Format: guest_{uuid}
 */
export function generateGuestUserId(): string {
  return `guest_${uuidv4()}`;
}

/**
 * Generate a generic UUID (no prefix)
 * Use this when you need a raw UUID without entity type prefix
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Validate if a string is a valid UUID (with or without prefix)
 */
export function isValidUUID(id: string): boolean {
  // Remove prefix if present
  const uuidPart = id.includes('_') ? id.split('_')[1] : id;
  
  // UUID v4 regex pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  return uuidRegex.test(uuidPart);
}

/**
 * Extract entity type from prefixed ID
 * Returns: 'workspace' | 'folder' | 'document' | 'user' | 'guest' | 'unknown'
 */
export function getEntityType(id: string): string {
  if (id.startsWith('ws_')) return 'workspace';
  if (id.startsWith('fld_')) return 'folder';
  if (id.startsWith('doc_')) return 'document';
  if (id.startsWith('usr_')) return 'user';
  if (id.startsWith('guest_')) return 'guest';
  return 'unknown';
}

/**
 * Extract raw UUID from prefixed ID
 * Example: 'ws_123e4567-...' → '123e4567-...'
 */
export function extractUUID(id: string): string {
  return id.includes('_') ? id.split('_')[1] : id;
}

/**
 * Check if ID is a legacy (non-UUID) ID
 * Legacy IDs include: 'guest-workspace', 'folder-quick-notes', 'doc-123456789'
 */
export function isLegacyId(id: string): boolean {
  // Legacy patterns
  if (id === 'guest-workspace') return true;
  if (id === 'tauri-workspace') return true;
  if (id.startsWith('folder-') && !id.includes('_')) return true;
  if (id.startsWith('doc-') && !id.includes('_')) return true;
  
  // If it's not a valid UUID, it's legacy
  return !isValidUUID(id);
}

/**
 * Migrate legacy ID to UUID-based ID
 * This is useful for migrating old data to the new ID format
 */
export function migrateLegacyId(legacyId: string, entityType: 'workspace' | 'folder' | 'document'): string {
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

/**
 * Convenience object with all ID generators
 * Usage: idGenerator.workspace(), idGenerator.folder(), etc.
 */
export const idGenerator = {
  workspace: generateWorkspaceId,
  folder: generateFolderId,
  document: generateDocumentId,
  user: generateUserId,
  guest: generateGuestUserId,
  uuid: generateUUID,
  
  // Validation helpers
  isValid: isValidUUID,
  isLegacy: isLegacyId,
  getType: getEntityType,
  extract: extractUUID,
  migrate: migrateLegacyId,
};

/**
 * Default export for convenience
 */
export default idGenerator;

