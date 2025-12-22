import { describe, it, expect } from 'vitest';
import { extractUuid, getCanonicalDocKey, getCanonicalWorkspaceKey } from '@/utils/identity';

describe('identity helpers', () => {
  describe('extractUuid', () => {
    it('returns bare uuid unchanged', () => {
      const id = '12345678-1234-1234-1234-123456789abc';
      expect(extractUuid(id)).toBe(id);
    });

    it('strips known prefixes like doc_, ws_, fld_', () => {
      const uuid = '12345678-1234-1234-1234-123456789abc';
      expect(extractUuid(`doc_${uuid}`)).toBe(uuid);
      expect(extractUuid(`ws_${uuid}`)).toBe(uuid);
      expect(extractUuid(`fld_${uuid}`)).toBe(uuid);
    });

    it('falls back to original id if suffix is not uuid-shaped', () => {
      expect(extractUuid('doc_not-a-uuid')).toBe('doc_not-a-uuid');
    });
  });

  describe('getCanonicalDocKey', () => {
    const uuid = '12345678-1234-1234-1234-123456789abc';

    it('prefers explicit cloudId when present', () => {
      const key = getCanonicalDocKey({ id: `doc_${uuid}`, cloudId: uuid });
      expect(key).toBe(uuid);
    });

    it('falls back to sync.cloudId when present', () => {
      const key = getCanonicalDocKey({ id: `doc_${uuid}`, sync: { cloudId: uuid } });
      expect(key).toBe(uuid);
    });

    it('uses normalized id when no cloudId present', () => {
      const key = getCanonicalDocKey({ id: `doc_${uuid}` });
      expect(key).toBe(uuid);
    });
  });

  describe('getCanonicalWorkspaceKey', () => {
    const uuid = '12345678-1234-1234-1234-123456789abc';

    it('prefers workspace.cloudId when present', () => {
      const key = getCanonicalWorkspaceKey({ id: `ws_${uuid}`, cloudId: uuid });
      expect(key).toBe(uuid);
    });

    it('normalizes id when no cloudId present', () => {
      const key = getCanonicalWorkspaceKey({ id: `ws_${uuid}` });
      expect(key).toBe(uuid);
    });
  });
});


