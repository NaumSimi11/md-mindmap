import type { IStorageService, StorageDocument, StorageMetadata } from './IStorageService';

const STORAGE_KEY = 'mdreader-documents';
const METADATA_KEY = 'mdreader-metadata';

export class LocalStorageService implements IStorageService {
  private getDocuments(): Record<string, StorageDocument> {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  private saveDocuments(documents: Record<string, StorageDocument>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  }

  async create(title: string, content: string): Promise<StorageDocument> {
    const documents = this.getDocuments();
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const document: StorageDocument = {
      id,
      title,
      content,
      metadata: {
        id,
        title,
        createdAt: new Date(),
        updatedAt: new Date(),
        size: content.length,
      },
    };

    documents[id] = document;
    this.saveDocuments(documents);
    
    return document;
  }

  async read(id: string): Promise<StorageDocument | null> {
    const documents = this.getDocuments();
    const doc = documents[id];
    
    if (!doc) return null;
    
    // Ensure dates are Date objects
    doc.metadata.createdAt = new Date(doc.metadata.createdAt);
    doc.metadata.updatedAt = new Date(doc.metadata.updatedAt);
    
    return doc;
  }

  async update(id: string, content: string): Promise<void> {
    const documents = this.getDocuments();
    const doc = documents[id];
    
    if (!doc) {
      throw new Error(`Document ${id} not found`);
    }

    doc.content = content;
    doc.metadata.updatedAt = new Date();
    doc.metadata.size = content.length;
    
    documents[id] = doc;
    this.saveDocuments(documents);
  }

  async delete(id: string): Promise<void> {
    const documents = this.getDocuments();
    delete documents[id];
    this.saveDocuments(documents);
  }

  async list(): Promise<StorageMetadata[]> {
    const documents = this.getDocuments();
    return Object.values(documents)
      .map(doc => ({
        ...doc.metadata,
        createdAt: new Date(doc.metadata.createdAt),
        updatedAt: new Date(doc.metadata.updatedAt),
      }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async search(query: string): Promise<StorageMetadata[]> {
    const documents = this.getDocuments();
    const lowerQuery = query.toLowerCase();
    
    return Object.values(documents)
      .filter(doc => 
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.content.toLowerCase().includes(lowerQuery)
      )
      .map(doc => ({
        ...doc.metadata,
        createdAt: new Date(doc.metadata.createdAt),
        updatedAt: new Date(doc.metadata.updatedAt),
      }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async updateMetadata(id: string, metadata: Partial<StorageMetadata>): Promise<void> {
    const documents = this.getDocuments();
    const doc = documents[id];
    
    if (!doc) {
      throw new Error(`Document ${id} not found`);
    }

    doc.metadata = {
      ...doc.metadata,
      ...metadata,
      updatedAt: new Date(),
    };
    
    if (metadata.title) {
      doc.title = metadata.title;
    }
    
    documents[id] = doc;
    this.saveDocuments(documents);
  }

  async getStorageInfo(): Promise<{ used: number; total: number; type: 'local' | 'cloud' }> {
    const data = localStorage.getItem(STORAGE_KEY) || '';
    const used = new Blob([data]).size;
    
    // LocalStorage limit is typically 5-10MB
    const total = 10 * 1024 * 1024; // 10MB
    
    return {
      used,
      total,
      type: 'local',
    };
  }
}

