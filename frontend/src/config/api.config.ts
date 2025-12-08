/**
 * API Configuration
 * Central configuration for backend API endpoints
 */

const env = import.meta.env;

export const API_CONFIG = {
  baseUrl: env.VITE_API_BASE_URL || 'http://localhost:8000',
  apiVersion: env.VITE_API_VERSION || 'v1',
  wsUrl: env.VITE_WS_URL || 'ws://localhost:8000',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    signup: '/api/v1/auth/register',  // Backend uses 'register' not 'signup'
    login: '/api/v1/auth/login',
    logout: '/api/v1/auth/logout',
    refresh: '/api/v1/auth/refresh',
    me: '/api/v1/auth/me',
  },
  // Workspaces
  workspaces: {
    list: '/api/v1/workspaces',
    create: '/api/v1/workspaces',
    get: (id: string) => `/api/v1/workspaces/${id}`,
    update: (id: string) => `/api/v1/workspaces/${id}`,
    delete: (id: string) => `/api/v1/workspaces/${id}`,
    members: (id: string) => `/api/v1/workspaces/${id}/members`,
  },
  // Documents
  documents: {
    list: (workspaceId: string) => `/api/v1/documents/workspace/${workspaceId}`,
    create: '/api/v1/documents',
    get: (id: string) => `/api/v1/documents/${id}`,
    update: (id: string) => `/api/v1/documents/${id}`,
    delete: (id: string) => `/api/v1/documents/${id}`,
    versions: (id: string) => `/api/v1/documents/${id}/versions`,
    restore: (id: string, versionId: string) => `/api/v1/documents/${id}/versions/${versionId}/restore`,
  },
  // Files
  files: {
    upload: '/api/v1/files/upload',
    get: (id: string) => `/api/v1/files/${id}`,
    delete: (id: string) => `/api/v1/files/${id}`,
  },
  // WebSocket
  ws: {
    connect: '/api/v1/ws',
    document: (documentId: string) => `/api/v1/ws/document/${documentId}`,
  },
} as const;

export default API_CONFIG;

