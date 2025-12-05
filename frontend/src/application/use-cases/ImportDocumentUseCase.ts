/**
 * Import Document Use Case
 * 
 * Import document from file content.
 */

import { Document } from '@/domain/entities/Document';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { Result, ok, fail } from '../common/Result';

export interface ImportDocumentCommand {
    filename: string;
    content: string;
}

export interface ImportDocumentResult {
    document: Document;
}

export class ImportDocumentUseCase {
    constructor(private readonly documentRepository: IDocumentRepository) { }

    async execute(command: ImportDocumentCommand): Promise<Result<ImportDocumentResult>> {
        try {
            // Extract title from filename
            const title = this.extractTitle(command.filename);

            // Create document
            const document = Document.create(title, command.content);

            // Save
            await this.documentRepository.save(document);

            return ok({ document });
        } catch (error) {
            return fail(error instanceof Error ? error : new Error('Import failed'));
        }
    }

    private extractTitle(filename: string): string {
        // Remove extension
        const withoutExt = filename.replace(/\.(md|txt|markdown)$/i, '');

        // Clean up
        return withoutExt
            .replace(/[_-]/g, ' ')
            .trim() || 'Untitled Document';
    }
}
