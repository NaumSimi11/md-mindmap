/**
 * Load Recent Documents Use Case
 * 
 * Query for recently updated documents.
 */

import { Document } from '@/domain/entities/Document';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { Result, ok, fail } from '../common/Result';

export interface LoadRecentDocumentsQuery {
    limit?: number;
}

export interface LoadRecentDocumentsResult {
    documents: Document[];
}

export class LoadRecentDocumentsUseCase {
    constructor(private readonly documentRepository: IDocumentRepository) { }

    async execute(query: LoadRecentDocumentsQuery = {}): Promise<Result<LoadRecentDocumentsResult>> {
        try {
            const limit = query.limit || 10;
            const documents = await this.documentRepository.getRecent(limit);

            return ok({ documents });
        } catch (error) {
            return fail(error instanceof Error ? error : new Error('Failed to load recent documents'));
        }
    }
}
