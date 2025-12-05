/**
 * Search Documents Use Case
 * 
 * Query with filtering and sorting.
 */

import { Document } from '@/domain/entities/Document';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { MarkdownService } from '@/domain/services/MarkdownService';
import { Result, ok, fail } from '../common/Result';

export interface SearchDocumentsQuery {
    searchTerm?: string;
    tags?: string[];
    favoritesOnly?: boolean;
    sortBy?: 'title' | 'updatedAt' | 'wordCount';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
}

export interface SearchDocumentsResult {
    documents: Document[];
    totalCount: number;
}

export class SearchDocumentsUseCase {
    constructor(private readonly documentRepository: IDocumentRepository) { }

    async execute(query: SearchDocumentsQuery): Promise<Result<SearchDocumentsResult>> {
        try {
            // 1. Fetch documents based on filters
            let documents = await this.fetchDocuments(query);

            // 2. Apply sorting
            documents = this.sortDocuments(documents, query);

            // 3. Apply limit
            if (query.limit) {
                documents = documents.slice(0, query.limit);
            }

            // 4. Return result
            return ok({
                documents,
                totalCount: documents.length,
            });
        } catch (error) {
            return fail(error instanceof Error ? error : new Error('Search failed'));
        }
    }

    private async fetchDocuments(query: SearchDocumentsQuery): Promise<Document[]> {
        // Favorites filter
        if (query.favoritesOnly) {
            return this.documentRepository.findFavorites();
        }

        // Tag filter
        if (query.tags && query.tags.length > 0) {
            const results = await Promise.all(
                query.tags.map(tag => this.documentRepository.findByTag(tag))
            );
            return this.deduplicateDocuments(results.flat());
        }

        // Search term
        if (query.searchTerm) {
            return this.documentRepository.search(query.searchTerm);
        }

        // Default: all documents
        return this.documentRepository.findAll();
    }

    private sortDocuments(documents: Document[], query: SearchDocumentsQuery): Document[] {
        const sortBy = query.sortBy || 'updatedAt';
        const sortOrder = query.sortOrder || 'desc';

        const sorted = [...documents].sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'updatedAt':
                    comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
                    break;
                case 'wordCount':
                    comparison = a.getWordCount() - b.getWordCount();
                    break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return sorted;
    }

    private deduplicateDocuments(documents: Document[]): Document[] {
        const seen = new Set<string>();
        return documents.filter(doc => {
            if (seen.has(doc.id)) return false;
            seen.add(doc.id);
            return true;
        });
    }
}
