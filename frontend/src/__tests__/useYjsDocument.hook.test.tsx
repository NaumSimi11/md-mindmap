import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const getDocumentMock = vi.hoisted(() => vi.fn());
const releaseDocumentMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/yjs/YjsDocumentManager', () => ({
  yjsDocumentManager: {
    getDocument: getDocumentMock,
    releaseDocument: releaseDocumentMock,
  },
}));

const useAuthMock = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

import { useYjsDocument } from '@/hooks/useYjsDocument';

type Props = { documentId: string };
function TestComponent({ documentId }: Props) {
  const { status, websocketProvider, online } = useYjsDocument(documentId);
  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="online">{String(online)}</div>
      <div data-testid="ws">{websocketProvider ? 'yes' : 'no'}</div>
    </div>
  );
}

describe('useYjsDocument (hook contract)', () => {
  beforeEach(() => {
    getDocumentMock.mockReset();
    releaseDocumentMock.mockReset();

    // Default: guest mode, online.
    useAuthMock.mockReturnValue({ user: null, isAuthenticated: false });

    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => true,
    });
  });

  it('should request a document with websocket disabled in guest mode', async () => {
    getDocumentMock.mockReturnValue({
      ydoc: {},
      isInitialized: true,
      websocketProvider: null,
    });

    render(<TestComponent documentId="doc-1" />);

    // Hook should call manager with expected options
    expect(getDocumentMock).toHaveBeenCalledTimes(1);
    expect(getDocumentMock).toHaveBeenCalledWith('doc-1', {
      enableWebSocket: false,
      websocketUrl: 'ws://localhost:1234',
      isAuthenticated: false,
    });

    expect(screen.getByTestId('status').textContent).toBe('local-only');
    expect(screen.getByTestId('ws').textContent).toBe('no');
  });

  it('should request a document with websocket enabled when authenticated + online', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1' }, isAuthenticated: true });

    getDocumentMock.mockReturnValue({
      ydoc: {},
      isInitialized: true,
      websocketProvider: {},
    });

    render(<TestComponent documentId="doc-2" />);

    expect(getDocumentMock).toHaveBeenCalledTimes(1);
    expect(getDocumentMock).toHaveBeenCalledWith('doc-2', {
      enableWebSocket: true,
      websocketUrl: 'ws://localhost:1234',
      isAuthenticated: true,
    });

    // If the manager returns an already-initialized instance, the hook reports `synced` immediately.
    expect(screen.getByTestId('status').textContent).toBe('synced');
    expect(screen.getByTestId('ws').textContent).toBe('yes');
  });

  it('should release document on unmount', async () => {
    getDocumentMock.mockReturnValue({
      ydoc: {},
      isInitialized: true,
      websocketProvider: null,
    });

    const { unmount } = render(<TestComponent documentId="doc-3" />);

    expect(releaseDocumentMock).not.toHaveBeenCalled();

    unmount();

    expect(releaseDocumentMock).toHaveBeenCalledTimes(1);
    expect(releaseDocumentMock).toHaveBeenCalledWith('doc-3');
  });
});
