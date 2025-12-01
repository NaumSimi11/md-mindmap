/**
 * Storage Service Interface
 * 
 * This interface abstracts storage operations across:
 * - LocalStorage (guest mode)
 * - AWS Amplify (authenticated users)
 * - Future: Supabase, Firebase, etc.
 */

export interface StorageMetadata {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: string;
  size: number;
  tags?: string[];
}

export interface StorageDocument {
  id: string;
  title: string;
  content: string;
  metadata: StorageMetadata;
}

export interface IStorageService {
  // Document CRUD
  create(title: string, content: string): Promise<StorageDocument>;
  read(id: string): Promise<StorageDocument | null>;
  update(id: string, content: string): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Listing
  list(): Promise<StorageMetadata[]>;
  search(query: string): Promise<StorageMetadata[]>;
  
  // Metadata operations
  updateMetadata(id: string, metadata: Partial<StorageMetadata>): Promise<void>;
  
  // Sync operations (for future multi-device support)
  sync?(): Promise<void>;
  
  // Storage info
  getStorageInfo(): Promise<{
    used: number;
    total: number;
    type: 'local' | 'cloud';
  }>;
}

