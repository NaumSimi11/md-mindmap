/**
 * Tests for ID Generator
 */

import {
  generateWorkspaceId,
  generateFolderId,
  generateDocumentId,
  generateUserId,
  generateGuestUserId,
  generateUUID,
  isValidUUID,
  getEntityType,
  extractUUID,
  isLegacyId,
  migrateLegacyId,
  idGenerator,
} from '../id-generator';

describe('ID Generator', () => {
  describe('generateWorkspaceId', () => {
    it('should generate ID with ws_ prefix', () => {
      const id = generateWorkspaceId();
      expect(id).toMatch(/^ws_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = generateWorkspaceId();
      const id2 = generateWorkspaceId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateFolderId', () => {
    it('should generate ID with fld_ prefix', () => {
      const id = generateFolderId();
      expect(id).toMatch(/^fld_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('generateDocumentId', () => {
    it('should generate ID with doc_ prefix', () => {
      const id = generateDocumentId();
      expect(id).toMatch(/^doc_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('generateUserId', () => {
    it('should generate ID with usr_ prefix', () => {
      const id = generateUserId();
      expect(id).toMatch(/^usr_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('generateGuestUserId', () => {
    it('should generate ID with guest_ prefix', () => {
      const id = generateGuestUserId();
      expect(id).toMatch(/^guest_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('generateUUID', () => {
    it('should generate raw UUID without prefix', () => {
      const id = generateUUID();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('isValidUUID', () => {
    it('should validate prefixed UUIDs', () => {
      const id = generateWorkspaceId();
      expect(isValidUUID(id)).toBe(true);
    });

    it('should validate raw UUIDs', () => {
      const id = generateUUID();
      expect(isValidUUID(id)).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('guest-workspace')).toBe(false);
      expect(isValidUUID('12345')).toBe(false);
    });
  });

  describe('getEntityType', () => {
    it('should extract entity type from prefixed ID', () => {
      expect(getEntityType(generateWorkspaceId())).toBe('workspace');
      expect(getEntityType(generateFolderId())).toBe('folder');
      expect(getEntityType(generateDocumentId())).toBe('document');
      expect(getEntityType(generateUserId())).toBe('user');
      expect(getEntityType(generateGuestUserId())).toBe('guest');
    });

    it('should return unknown for unprefixed IDs', () => {
      expect(getEntityType(generateUUID())).toBe('unknown');
      expect(getEntityType('random-id')).toBe('unknown');
    });
  });

  describe('extractUUID', () => {
    it('should extract UUID from prefixed ID', () => {
      const id = generateWorkspaceId();
      const uuid = extractUUID(id);
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(uuid).not.toContain('ws_');
    });

    it('should return raw UUID unchanged', () => {
      const uuid = generateUUID();
      expect(extractUUID(uuid)).toBe(uuid);
    });
  });

  describe('isLegacyId', () => {
    it('should identify legacy workspace IDs', () => {
      expect(isLegacyId('guest-workspace')).toBe(true);
      expect(isLegacyId('tauri-workspace')).toBe(true);
    });

    it('should identify legacy folder IDs', () => {
      expect(isLegacyId('folder-quick-notes')).toBe(true);
      expect(isLegacyId('folder-projects')).toBe(true);
    });

    it('should identify legacy document IDs', () => {
      expect(isLegacyId('doc-123456789')).toBe(true);
    });

    it('should not flag UUID-based IDs as legacy', () => {
      expect(isLegacyId(generateWorkspaceId())).toBe(false);
      expect(isLegacyId(generateFolderId())).toBe(false);
      expect(isLegacyId(generateDocumentId())).toBe(false);
    });
  });

  describe('migrateLegacyId', () => {
    it('should generate new UUID for legacy workspace ID', () => {
      const newId = migrateLegacyId('guest-workspace', 'workspace');
      expect(newId).toMatch(/^ws_/);
      expect(isValidUUID(newId)).toBe(true);
    });

    it('should generate new UUID for legacy folder ID', () => {
      const newId = migrateLegacyId('folder-quick-notes', 'folder');
      expect(newId).toMatch(/^fld_/);
      expect(isValidUUID(newId)).toBe(true);
    });

    it('should generate new UUID for legacy document ID', () => {
      const newId = migrateLegacyId('doc-123456789', 'document');
      expect(newId).toMatch(/^doc_/);
      expect(isValidUUID(newId)).toBe(true);
    });
  });

  describe('idGenerator object', () => {
    it('should provide all generator functions', () => {
      expect(idGenerator.workspace()).toMatch(/^ws_/);
      expect(idGenerator.folder()).toMatch(/^fld_/);
      expect(idGenerator.document()).toMatch(/^doc_/);
      expect(idGenerator.user()).toMatch(/^usr_/);
      expect(idGenerator.guest()).toMatch(/^guest_/);
      expect(idGenerator.uuid()).toMatch(/^[0-9a-f]{8}-/);
    });

    it('should provide validation helpers', () => {
      const id = idGenerator.workspace();
      expect(idGenerator.isValid(id)).toBe(true);
      expect(idGenerator.isLegacy(id)).toBe(false);
      expect(idGenerator.getType(id)).toBe('workspace');
      expect(idGenerator.extract(id)).not.toContain('ws_');
    });
  });

  describe('collision probability', () => {
    it('should generate 1000 unique workspace IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateWorkspaceId());
      }
      expect(ids.size).toBe(1000);
    });

    it('should generate 1000 unique document IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateDocumentId());
      }
      expect(ids.size).toBe(1000);
    });
  });
});

