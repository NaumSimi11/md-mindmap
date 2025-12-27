/**
 * Universal ID Generator
 * 
 * @deprecated This file is deprecated. Import from '@/utils/id' instead.
 * This file re-exports from the unified ID module for backward compatibility.
 */

export {
  // Generators
  generateWorkspaceId,
  generateFolderId,
  generateDocumentId,
  generateUserId,
  generateGuestUserId,
  generateUUID,

  // Validation
  isValidUUID,
  isLegacyId,
  getEntityType,

  // Extraction (note: extractUUID is alias for extractUuid)
  extractUUID,
  extractUuid,

  // Migration
  migrateLegacyId,

  // Convenience object
  idGenerator,
  idGenerator as default,
} from './id';
