/**
 * Tests for Unified ID Utilities (@/utils/id)
 * 
 * This is the comprehensive test suite for the unified ID module.
 * Tests cover all ID operations: generation, extraction, validation,
 * and conversion between local/cloud formats.
 */

import {
  // Constants
  DOC_PREFIX,
  WS_PREFIX,
  FLD_PREFIX,

  // Extraction
  extractUuid,
  extractUUID,
  toCloudId,
  toLocalDocId,
  toLocalId,
  toLocalWorkspaceId,
  toLocalFolderId,

  // Canonical keys
  getCanonicalDocKey,
  getCanonicalWorkspaceKey,

  // Generation
  generateDocumentId,
  generateWorkspaceId,
  generateFolderId,
  generateUUID,
  generateUserId,
  generateGuestUserId,

  // Validation
  isValidUUID,
  isLegacyId,
  getEntityType,
  isDocumentId,
  isWorkspaceId,
  isFolderId,

  // Migration
  migrateLegacyId,

  // Convenience object
  idGenerator,
} from '../id';

describe('Unified ID Module (@/utils/id)', () => {
  // ==========================================================================
  // EXTRACTION TESTS
  // ==========================================================================

  describe('extractUuid / extractUUID', () => {
    it('should extract UUID from doc_ prefixed ID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(extractUuid(`doc_${uuid}`)).toBe(uuid);
      expect(extractUUID(`doc_${uuid}`)).toBe(uuid); // alias
    });

    it('should extract UUID from ws_ prefixed ID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(extractUuid(`ws_${uuid}`)).toBe(uuid);
    });

    it('should extract UUID from fld_ prefixed ID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(extractUuid(`fld_${uuid}`)).toBe(uuid);
    });

    it('should return bare UUID unchanged', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(extractUuid(uuid)).toBe(uuid);
    });

    it('should return ID unchanged if suffix is not a valid UUID', () => {
      expect(extractUuid('ws_12345_notauuid')).toBe('ws_12345_notauuid');
      expect(extractUuid('doc_invalid')).toBe('doc_invalid');
    });

    it('should handle empty and null-ish values', () => {
      expect(extractUuid('')).toBe('');
      expect(extractUuid(null as any)).toBe(null);
      expect(extractUuid(undefined as any)).toBe(undefined);
    });

    it('should handle legacy timestamp-based IDs', () => {
      // These have _ but suffix is not UUID
      const legacyId = 'ws_1766647644416_mb1c9uyp9';
      expect(extractUuid(legacyId)).toBe(legacyId); // unchanged
    });
  });

  // ==========================================================================
  // CLOUD/LOCAL CONVERSION TESTS
  // ==========================================================================

  describe('toCloudId', () => {
    it('should strip doc_ prefix', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(toCloudId(`doc_${uuid}`)).toBe(uuid);
    });

    it('should strip ws_ prefix', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(toCloudId(`ws_${uuid}`)).toBe(uuid);
    });

    it('should strip fld_ prefix', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(toCloudId(`fld_${uuid}`)).toBe(uuid);
    });

    it('should return bare UUID unchanged', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(toCloudId(uuid)).toBe(uuid);
    });

    it('should handle empty values', () => {
      expect(toCloudId('')).toBe('');
    });
  });

  describe('toLocalDocId / toLocalId', () => {
    it('should add doc_ prefix to bare UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(toLocalDocId(uuid)).toBe(`doc_${uuid}`);
      expect(toLocalId(uuid)).toBe(`doc_${uuid}`); // alias
    });

    it('should not double-prefix', () => {
      const prefixed = 'doc_123e4567-e89b-12d3-a456-426614174000';
      expect(toLocalDocId(prefixed)).toBe(prefixed);
    });

    it('should handle empty values', () => {
      expect(toLocalDocId('')).toBe('');
    });
  });

  describe('toLocalWorkspaceId', () => {
    it('should add ws_ prefix to bare UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(toLocalWorkspaceId(uuid)).toBe(`ws_${uuid}`);
    });

    it('should not double-prefix', () => {
      const prefixed = 'ws_123e4567-e89b-12d3-a456-426614174000';
      expect(toLocalWorkspaceId(prefixed)).toBe(prefixed);
    });
  });

  describe('toLocalFolderId', () => {
    it('should add fld_ prefix to bare UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(toLocalFolderId(uuid)).toBe(`fld_${uuid}`);
    });

    it('should not double-prefix', () => {
      const prefixed = 'fld_123e4567-e89b-12d3-a456-426614174000';
      expect(toLocalFolderId(prefixed)).toBe(prefixed);
    });
  });

  // ==========================================================================
  // CANONICAL KEY TESTS
  // ==========================================================================

  describe('getCanonicalDocKey', () => {
    it('should prefer cloudId if present', () => {
      const doc = {
        id: 'doc_local-id',
        cloudId: 'cloud-uuid-123',
      };
      expect(getCanonicalDocKey(doc)).toBe('cloud-uuid-123');
    });

    it('should prefer sync.cloudId if cloudId not present', () => {
      const doc = {
        id: 'doc_local-id',
        sync: { cloudId: 'sync-cloud-uuid' },
      };
      expect(getCanonicalDocKey(doc)).toBe('sync-cloud-uuid');
    });

    it('should fall back to extracted ID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const doc = { id: `doc_${uuid}` };
      expect(getCanonicalDocKey(doc)).toBe(uuid);
    });

    it('should extract UUID from cloudId', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const doc = {
        id: 'doc_other',
        cloudId: `doc_${uuid}`,
      };
      expect(getCanonicalDocKey(doc)).toBe(uuid);
    });
  });

  describe('getCanonicalWorkspaceKey', () => {
    it('should prefer cloudId if present', () => {
      const ws = { id: 'ws_local', cloudId: 'cloud-ws-uuid' };
      expect(getCanonicalWorkspaceKey(ws)).toBe('cloud-ws-uuid');
    });

    it('should fall back to extracted ID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const ws = { id: `ws_${uuid}` };
      expect(getCanonicalWorkspaceKey(ws)).toBe(uuid);
    });
  });

  // ==========================================================================
  // GENERATION TESTS
  // ==========================================================================

  describe('ID Generation', () => {
    it('should generate document ID with doc_ prefix', () => {
      const id = generateDocumentId();
      expect(id).toMatch(/^doc_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate workspace ID with ws_ prefix', () => {
      const id = generateWorkspaceId();
      expect(id).toMatch(/^ws_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate folder ID with fld_ prefix', () => {
      const id = generateFolderId();
      expect(id).toMatch(/^fld_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate bare UUID', () => {
      const id = generateUUID();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateDocumentId());
      }
      expect(ids.size).toBe(100);
    });
  });

  // ==========================================================================
  // VALIDATION TESTS
  // ==========================================================================

  describe('isValidUUID', () => {
    it('should validate prefixed UUIDs', () => {
      expect(isValidUUID(generateDocumentId())).toBe(true);
      expect(isValidUUID(generateWorkspaceId())).toBe(true);
      expect(isValidUUID(generateFolderId())).toBe(true);
    });

    it('should validate bare UUIDs', () => {
      expect(isValidUUID(generateUUID())).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('guest-workspace')).toBe(false);
      expect(isValidUUID('12345')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });

  describe('isLegacyId', () => {
    it('should identify legacy workspace IDs', () => {
      expect(isLegacyId('guest-workspace')).toBe(true);
      expect(isLegacyId('tauri-workspace')).toBe(true);
    });

    it('should identify legacy folder IDs', () => {
      expect(isLegacyId('folder-quick-notes')).toBe(true);
    });

    it('should identify legacy document IDs', () => {
      expect(isLegacyId('doc-123456789')).toBe(true);
    });

    it('should not flag UUID-based IDs as legacy', () => {
      expect(isLegacyId(generateWorkspaceId())).toBe(false);
      expect(isLegacyId(generateDocumentId())).toBe(false);
    });
  });

  describe('getEntityType', () => {
    it('should detect entity types correctly', () => {
      expect(getEntityType(generateWorkspaceId())).toBe('workspace');
      expect(getEntityType(generateFolderId())).toBe('folder');
      expect(getEntityType(generateDocumentId())).toBe('document');
      expect(getEntityType(generateUserId())).toBe('user');
      expect(getEntityType(generateGuestUserId())).toBe('guest');
      expect(getEntityType(generateUUID())).toBe('unknown');
    });
  });

  describe('isDocumentId / isWorkspaceId / isFolderId', () => {
    it('should identify document IDs', () => {
      expect(isDocumentId(generateDocumentId())).toBe(true);
      expect(isDocumentId(generateUUID())).toBe(true); // bare UUID is treated as doc
      expect(isDocumentId(generateWorkspaceId())).toBe(false);
    });

    it('should identify workspace IDs', () => {
      expect(isWorkspaceId(generateWorkspaceId())).toBe(true);
      expect(isWorkspaceId(generateDocumentId())).toBe(false);
    });

    it('should identify folder IDs', () => {
      expect(isFolderId(generateFolderId())).toBe(true);
      expect(isFolderId(generateDocumentId())).toBe(false);
    });
  });

  // ==========================================================================
  // MIGRATION TESTS
  // ==========================================================================

  describe('migrateLegacyId', () => {
    it('should generate new IDs with correct prefixes', () => {
      const wsId = migrateLegacyId('guest-workspace', 'workspace');
      expect(wsId).toMatch(/^ws_/);
      expect(isValidUUID(wsId)).toBe(true);

      const fldId = migrateLegacyId('folder-notes', 'folder');
      expect(fldId).toMatch(/^fld_/);
      expect(isValidUUID(fldId)).toBe(true);

      const docId = migrateLegacyId('doc-123', 'document');
      expect(docId).toMatch(/^doc_/);
      expect(isValidUUID(docId)).toBe(true);
    });
  });

  // ==========================================================================
  // CONVENIENCE OBJECT TESTS
  // ==========================================================================

  describe('idGenerator convenience object', () => {
    it('should provide all generator functions', () => {
      expect(idGenerator.workspace()).toMatch(/^ws_/);
      expect(idGenerator.folder()).toMatch(/^fld_/);
      expect(idGenerator.document()).toMatch(/^doc_/);
      expect(idGenerator.user()).toMatch(/^usr_/);
      expect(idGenerator.guest()).toMatch(/^guest_/);
      expect(idGenerator.uuid()).toMatch(/^[0-9a-f]{8}-/i);
    });

    it('should provide validation functions', () => {
      const id = idGenerator.workspace();
      expect(idGenerator.isValid(id)).toBe(true);
      expect(idGenerator.isLegacy(id)).toBe(false);
      expect(idGenerator.getType(id)).toBe('workspace');
    });

    it('should provide extraction functions', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(idGenerator.extract(`doc_${uuid}`)).toBe(uuid);
      expect(idGenerator.toCloud(`doc_${uuid}`)).toBe(uuid);
      expect(idGenerator.toLocal(uuid)).toBe(`doc_${uuid}`);
    });
  });

  // ==========================================================================
  // CONSTANTS TESTS
  // ==========================================================================

  describe('Constants', () => {
    it('should export correct prefixes', () => {
      expect(DOC_PREFIX).toBe('doc_');
      expect(WS_PREFIX).toBe('ws_');
      expect(FLD_PREFIX).toBe('fld_');
    });
  });

  // ==========================================================================
  // ROUND-TRIP TESTS (Critical for sync reliability)
  // ==========================================================================

  describe('Round-trip conversions', () => {
    it('should round-trip: local → cloud → local', () => {
      const original = generateDocumentId();
      const cloud = toCloudId(original);
      const backToLocal = toLocalDocId(cloud);
      expect(backToLocal).toBe(original);
    });

    it('should round-trip: cloud → local → cloud', () => {
      const original = generateUUID();
      const local = toLocalDocId(original);
      const backToCloud = toCloudId(local);
      expect(backToCloud).toBe(original);
    });

    it('should produce same canonical key from local and cloud IDs', () => {
      const uuid = generateUUID();
      const localId = toLocalDocId(uuid);
      const cloudId = uuid;

      const docWithLocal = { id: localId };
      const docWithCloud = { id: cloudId };

      expect(getCanonicalDocKey(docWithLocal)).toBe(getCanonicalDocKey(docWithCloud));
    });
  });
});

