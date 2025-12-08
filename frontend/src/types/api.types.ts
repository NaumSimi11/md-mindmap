/**
 * API Type Definitions
 * Shared types for backend API responses
 */

// User types
export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  email_verified_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  username: string;  // Required by backend
  password: string;
  full_name?: string;  // Optional
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceCreate {
  name: string;
  description?: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  user: User;
  joined_at: string;
}

// Document types
export interface Document {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  content_type: 'markdown' | 'text' | 'json';
  version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface DocumentCreate {
  workspace_id: string;
  title: string;
  content: string;
  content_type?: 'markdown' | 'text' | 'json';
}

export interface DocumentUpdate {
  title?: string;
  content?: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  content: string;
  created_by: string;
  created_at: string;
}

// File types
export interface FileUpload {
  id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
}

// WebSocket types
export interface WsMessage {
  type: 'connect' | 'disconnect' | 'update' | 'cursor' | 'presence';
  data: unknown;
  timestamp: string;
}

export interface WsPresence {
  user_id: string;
  user_name: string;
  cursor_position?: number;
  selection?: { from: number; to: number };
  color: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// Error types
export interface ApiErrorResponse {
  detail: string;
  status_code: number;
  errors?: Record<string, string[]>;
}

