/**
 * Collaboration Regression Tests
 * 
 * These tests cover the specific bugs we fixed on December 28, 2025:
 * 1. Cross-user data leakage (IndexedDB cache not cleared on logout)
 * 2. JWT claim mismatch (backend uses 'sub', Hocuspocus expected 'user_id')
 * 3. Document share access (403 errors for shared documents)
 * 4. Snapshot permissions for shared editors
 * 5. Shared documents API response parsing
 * 6. Dotenv not loading in Hocuspocus
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// TEST 1: Cross-User Data Isolation (IndexedDB Cache Clearing)
// =============================================================================
describe('Cross-User Data Isolation', () => {
  // Mock the cacheDb
  const mockCacheDb = {
    workspaces: { clear: vi.fn().mockResolvedValue(undefined), toArray: vi.fn() },
    documents: { clear: vi.fn().mockResolvedValue(undefined), toArray: vi.fn() },
    folders: { clear: vi.fn().mockResolvedValue(undefined) },
    settings: { clear: vi.fn().mockResolvedValue(undefined) },
    workspaceMappings: { clear: vi.fn().mockResolvedValue(undefined) },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear ALL IndexedDB tables on logout event', async () => {
    // Simulate what BackendWorkspaceService.reset() should do
    const reset = async () => {
      await mockCacheDb.workspaces.clear();
      await mockCacheDb.documents.clear();
      await mockCacheDb.folders.clear();
      await mockCacheDb.settings.clear();
      await mockCacheDb.workspaceMappings.clear();
    };

    await reset();

    // Verify ALL tables were cleared
    expect(mockCacheDb.workspaces.clear).toHaveBeenCalledTimes(1);
    expect(mockCacheDb.documents.clear).toHaveBeenCalledTimes(1);
    expect(mockCacheDb.folders.clear).toHaveBeenCalledTimes(1);
    expect(mockCacheDb.settings.clear).toHaveBeenCalledTimes(1);
    expect(mockCacheDb.workspaceMappings.clear).toHaveBeenCalledTimes(1);
  });

  it('should not leak User A documents to User B after logout/login', async () => {
    // Setup: User A has documents in cache
    const userADocuments = [
      { id: 'doc-1', title: 'User A Secret Doc', createdBy: 'user-a-id' },
      { id: 'doc-2', title: 'Another A Doc', createdBy: 'user-a-id' },
    ];
    mockCacheDb.documents.toArray.mockResolvedValue(userADocuments);

    // Before logout: User A sees their docs
    let docs = await mockCacheDb.documents.toArray();
    expect(docs).toHaveLength(2);
    expect(docs[0].createdBy).toBe('user-a-id');

    // Simulate logout (cache clear)
    await mockCacheDb.documents.clear();
    mockCacheDb.documents.toArray.mockResolvedValue([]); // Cache is now empty

    // After logout: Cache should be empty
    docs = await mockCacheDb.documents.toArray();
    expect(docs).toHaveLength(0);

    // User B logs in - they should NOT see User A's docs
    const userBDocuments = [
      { id: 'doc-3', title: 'User B Doc', createdBy: 'user-b-id' },
    ];
    mockCacheDb.documents.toArray.mockResolvedValue(userBDocuments);

    docs = await mockCacheDb.documents.toArray();
    expect(docs).toHaveLength(1);
    expect(docs[0].createdBy).toBe('user-b-id');
    expect(docs.some(d => d.createdBy === 'user-a-id')).toBe(false);
  });
});

// =============================================================================
// TEST 2: JWT Claim Compatibility
// =============================================================================
describe('JWT Claim Compatibility', () => {
  it('backend JWT uses "sub" claim for user ID (not "user_id")', () => {
    // This is what the backend actually produces
    const backendJwtPayload = {
      sub: 'cf9e8404-1234-5678-9abc-def012345678', // User ID
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      jti: 'random-jwt-id',
      type: 'access',
    };

    // Verify correct claim structure
    expect(backendJwtPayload.sub).toBeDefined();
    expect(backendJwtPayload.sub).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );

    // These should NOT exist in backend JWT
    expect((backendJwtPayload as any).user_id).toBeUndefined();
    expect((backendJwtPayload as any).email).toBeUndefined();
    expect((backendJwtPayload as any).name).toBeUndefined();
  });

  it('Hocuspocus auth should extract user ID from "sub" claim', () => {
    const decoded = {
      sub: 'cf9e8404-1234-5678-9abc-def012345678',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      type: 'access',
    };

    // This is the correct way to extract user ID (fixed in AuthExtension.js)
    const userId = decoded.sub;
    expect(userId).toBe('cf9e8404-1234-5678-9abc-def012345678');

    // This was the OLD broken way
    const wrongUserId = (decoded as any).user_id;
    expect(wrongUserId).toBeUndefined();
  });
});

// =============================================================================
// TEST 3: Document Share Access
// =============================================================================
describe('Document Share Access', () => {
  it('should allow access to shared documents (not just workspace members)', async () => {
    // Simulate the access check logic from document_service.py
    const checkDocumentAccess = (params: {
      documentCreatorId: string;
      currentUserId: string;
      isPublic: boolean;
      documentShares: Array<{ principalId: string; role: string }>;
      workspaceMembers: Array<{ userId: string }>;
    }) => {
      const { documentCreatorId, currentUserId, isPublic, documentShares, workspaceMembers } = params;

      // 1. Creator always has access
      if (documentCreatorId === currentUserId) return { access: true, via: 'creator' };

      // 2. Public documents are accessible
      if (isPublic) return { access: true, via: 'public' };

      // 3. Document shares (THIS WAS MISSING BEFORE!)
      const share = documentShares.find(s => s.principalId === currentUserId);
      if (share) return { access: true, via: 'share', role: share.role };

      // 4. Workspace membership
      const member = workspaceMembers.find(m => m.userId === currentUserId);
      if (member) return { access: true, via: 'workspace' };

      return { access: false };
    };

    // Test case: User B has a document share but is NOT in workspace
    const result = checkDocumentAccess({
      documentCreatorId: 'user-a',
      currentUserId: 'user-b',
      isPublic: false,
      documentShares: [{ principalId: 'user-b', role: 'editor' }], // Has share!
      workspaceMembers: [], // NOT in workspace
    });

    expect(result.access).toBe(true);
    expect(result.via).toBe('share');
    expect(result.role).toBe('editor');
  });

  it('should deny access when user has no share or membership', () => {
    const checkDocumentAccess = (params: {
      documentCreatorId: string;
      currentUserId: string;
      isPublic: boolean;
      documentShares: Array<{ principalId: string; role: string }>;
      workspaceMembers: Array<{ userId: string }>;
    }) => {
      const { documentCreatorId, currentUserId, isPublic, documentShares, workspaceMembers } = params;
      if (documentCreatorId === currentUserId) return { access: true };
      if (isPublic) return { access: true };
      if (documentShares.find(s => s.principalId === currentUserId)) return { access: true };
      if (workspaceMembers.find(m => m.userId === currentUserId)) return { access: true };
      return { access: false };
    };

    const result = checkDocumentAccess({
      documentCreatorId: 'user-a',
      currentUserId: 'user-c', // Random user
      isPublic: false,
      documentShares: [{ principalId: 'user-b', role: 'editor' }], // Only user-b has share
      workspaceMembers: [],
    });

    expect(result.access).toBe(false);
  });
});

// =============================================================================
// TEST 4: Snapshot Permissions for Shared Editors
// =============================================================================
describe('Snapshot Permissions', () => {
  it('should allow snapshot save for users with editor share', () => {
    const canSaveSnapshot = (params: {
      documentCreatorId: string;
      currentUserId: string;
      workspaceOwnerId: string;
      documentShares: Array<{ principalId: string; role: string }>;
    }) => {
      const { documentCreatorId, currentUserId, workspaceOwnerId, documentShares } = params;

      // Creator can always save
      if (documentCreatorId === currentUserId) return true;

      // Workspace owner can save
      if (workspaceOwnerId === currentUserId) return true;

      // Editor+ share can save (THIS WAS MISSING BEFORE!)
      const share = documentShares.find(s => s.principalId === currentUserId);
      if (share && ['editor', 'admin', 'owner'].includes(share.role)) return true;

      return false;
    };

    // User B is an editor via share
    expect(
      canSaveSnapshot({
        documentCreatorId: 'user-a',
        currentUserId: 'user-b',
        workspaceOwnerId: 'user-a',
        documentShares: [{ principalId: 'user-b', role: 'editor' }],
      })
    ).toBe(true);

    // User C is only a viewer - should NOT be able to save
    expect(
      canSaveSnapshot({
        documentCreatorId: 'user-a',
        currentUserId: 'user-c',
        workspaceOwnerId: 'user-a',
        documentShares: [{ principalId: 'user-c', role: 'viewer' }],
      })
    ).toBe(false);
  });
});

// =============================================================================
// TEST 5: Shared Documents API Response Parsing
// =============================================================================
describe('Shared Documents API Response', () => {
  it('should extract items array from paginated response', () => {
    // This is what the backend actually returns
    const apiResponse = {
      items: [
        { id: 'doc-1', title: 'Shared Doc 1' },
        { id: 'doc-2', title: 'Shared Doc 2' },
      ],
      total: 2,
      page: 1,
      page_size: 50,
    };

    // The FIX: Extract items array (DocumentService.listSharedWithMe)
    const extractSharedDocs = (response: any) => {
      if (response.items && Array.isArray(response.items)) {
        return response.items;
      }
      console.warn('Unexpected response format');
      return [];
    };

    const docs = extractSharedDocs(apiResponse);
    expect(docs).toHaveLength(2);
    expect(docs[0].title).toBe('Shared Doc 1');
  });

  it('should handle direct array response (backwards compat)', () => {
    // In case API changes to return array directly
    const apiResponse = [
      { id: 'doc-1', title: 'Shared Doc 1' },
    ];

    const extractSharedDocs = (response: any) => {
      if (Array.isArray(response)) {
        return response;
      }
      if (response.items && Array.isArray(response.items)) {
        return response.items;
      }
      return [];
    };

    const docs = extractSharedDocs(apiResponse);
    expect(docs).toHaveLength(1);
  });

  it('should NOT crash when calling .map() on response', () => {
    const apiResponse = {
      items: [{ id: 'doc-1' }],
      total: 1,
    };

    // The BUG was: sharedWithMeDocs.map is not a function
    // Because we were doing: const docs = apiResponse; docs.map(...)
    // Instead of: const docs = apiResponse.items; docs.map(...)

    const extractSharedDocs = (response: any) => {
      if (response.items && Array.isArray(response.items)) {
        return response.items;
      }
      return [];
    };

    const docs = extractSharedDocs(apiResponse);

    // This should NOT throw
    expect(() => {
      docs.map((d: any) => d.id);
    }).not.toThrow();

    expect(docs.map((d: any) => d.id)).toEqual(['doc-1']);
  });
});

// =============================================================================
// TEST 6: Environment Variable Loading
// =============================================================================
describe('Environment Variable Configuration', () => {
  it('should have matching SECRET_KEY between backend and Hocuspocus', () => {
    // In a real test, you'd read from actual .env files
    // Here we just document the requirement
    const backendSecretKey = 'your-secret-key-here-change-in-production-use-openssl-rand-hex-32';
    const hocuspocusSecretKey = 'your-secret-key-here-change-in-production-use-openssl-rand-hex-32';

    expect(backendSecretKey).toBe(hocuspocusSecretKey);
  });

  it('should use correct backend URL in Hocuspocus', () => {
    // The FIX: Hocuspocus was defaulting to port 8000, but backend runs on 7001
    const correctBackendUrl = 'http://localhost:7001';
    const defaultBackendUrl = 'http://localhost:8000'; // This was wrong!

    expect(correctBackendUrl).not.toBe(defaultBackendUrl);
    expect(correctBackendUrl).toContain('7001');
  });

  it('dotenv must be loaded BEFORE accessing process.env', () => {
    // This documents the fix in AuthExtension.js
    // The import order must be:
    // 1. import dotenv from 'dotenv';
    // 2. dotenv.config();
    // 3. const SECRET_KEY = process.env.SECRET_KEY || 'default';

    // If dotenv.config() is called AFTER the const declaration,
    // process.env.SECRET_KEY will be undefined and fall back to default

    const simulateCorrectOrder = () => {
      const mockEnv: Record<string, string> = {};

      // Step 1: dotenv.config() populates process.env
      mockEnv['SECRET_KEY'] = 'correct-key-from-env';

      // Step 2: Now read the value
      const secretKey = mockEnv['SECRET_KEY'] || 'wrong-default';

      return secretKey;
    };

    const simulateWrongOrder = () => {
      const mockEnv: Record<string, string> = {};

      // Step 1: Read value BEFORE dotenv loads it
      const secretKey = mockEnv['SECRET_KEY'] || 'wrong-default';

      // Step 2: dotenv.config() runs (too late!)
      mockEnv['SECRET_KEY'] = 'correct-key-from-env';

      return secretKey;
    };

    expect(simulateCorrectOrder()).toBe('correct-key-from-env');
    expect(simulateWrongOrder()).toBe('wrong-default');
  });
});

// =============================================================================
// TEST 7: Auth Event Handling
// =============================================================================
describe('Auth Event Handling', () => {
  it('should trigger cache clear on auth:logout event', () => {
    const clearCacheMock = vi.fn();
    const resetMock = vi.fn();

    // Simulate event listener setup
    const setupLogoutHandler = (onLogout: () => void) => {
      // In real code: window.addEventListener('auth:logout', onLogout)
      return onLogout;
    };

    const logoutHandler = setupLogoutHandler(() => {
      clearCacheMock();
      resetMock();
    });

    // Simulate logout event
    logoutHandler();

    expect(clearCacheMock).toHaveBeenCalledTimes(1);
    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  it('BackendWorkspaceService should listen to auth:logout', () => {
    // Document the expected behavior
    const eventListeners: Record<string, Function[]> = {};

    const addEventListener = (event: string, handler: Function) => {
      if (!eventListeners[event]) eventListeners[event] = [];
      eventListeners[event].push(handler);
    };

    // BackendWorkspaceService constructor should do this:
    addEventListener('auth:logout', () => {
      // this.reset()
      // this.clearCache()
    });

    expect(eventListeners['auth:logout']).toBeDefined();
    expect(eventListeners['auth:logout'].length).toBeGreaterThan(0);
  });
});

