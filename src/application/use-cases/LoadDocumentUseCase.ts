/**
 * Load Document Use Case
 * 
 * Query pattern: Performs a read operation.
 * No side effects, just retrieves data.
 */

import { Document } from '@/domain/entities/Document';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { Result, ok, fail } from '../common/Result';

export interface LoadDocumentQuery {
    id: string;
}

export interface LoadDocumentResult {
    document: Document;
    statistics: {
        wordCount: number;
        characterCount: number;
        readingTimeMinutes: number;
    };
}

export class LoadDocumentUseCase {
    constructor(private readonly documentRepository: IDocumentRepository) { }

    async execute(query: LoadDocumentQuery): Promise<Result<LoadDocumentResult>> {
        try {
            // 1. Fetch from repository
            const document = await this.documentRepository.findById(query.id);

            if (!document) {
                return fail(new Error(`Document with id ${query.id} not found`));
            }

            // 2. Calculate statistics (domain logic)
            const statistics = {
                wordCount: document.getWordCount(),
                characterCount: document.getCharacterCount(),
                readingTimeMinutes: document.getReadingTimeMinutes(),
            };

            // 3. Return result
            return ok({ document, statistics });
        } catch (error) {
            return fail(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
}
