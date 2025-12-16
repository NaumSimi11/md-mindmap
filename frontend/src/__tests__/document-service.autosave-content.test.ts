import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We test current behavior: DocumentService.autoSave() sends { content } via REST.
// This is intentionally treated as legacy/temporary until Yjs fully owns content transport.

const patchMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/api/ApiClient', () => ({
  apiClient: {
    patch: patchMock,
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('DocumentService.autoSave (legacy REST-content path)', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    patchMock.mockReset();
    patchMock.mockResolvedValue({});

    // Ensure we get a fresh singleton instance across tests
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should PATCH content after debounce when content changed', async () => {
    const { documentService } = await import('@/services/api/DocumentService');

    documentService.autoSave('doc-1', 'hello', 1000);

    // Not yet
    expect(patchMock).not.toHaveBeenCalled();

    // Flush timers
    await vi.advanceTimersByTimeAsync(1000);

    expect(patchMock).toHaveBeenCalledTimes(1);
    const [url, payload] = patchMock.mock.calls[0];

    expect(payload).toEqual({ content: 'hello' });
    expect(typeof url).toBe('string');
  });

  it('should NOT PATCH if content is unchanged since last save', async () => {
    const { documentService } = await import('@/services/api/DocumentService');

    // First save
    documentService.autoSave('doc-1', 'same', 10);
    await vi.advanceTimersByTimeAsync(10);
    expect(patchMock).toHaveBeenCalledTimes(1);

    // Second call with same content should be a no-op
    documentService.autoSave('doc-1', 'same', 10);
    await vi.advanceTimersByTimeAsync(10);

    expect(patchMock).toHaveBeenCalledTimes(1);
  });
});
