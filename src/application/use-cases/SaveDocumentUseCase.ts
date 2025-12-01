/**
 * Save Document Use Case
 * 
 * Command pattern: Performs a write operation.
 * Orchestrates domain entities and repository.
 */

import { Document } from '@/domain/entities/Document';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { Result, ok, fail } from '../common/Result';

export interface SaveDocumentCommand {
    id?: string;
    title: string;
    content: string;
    metadata?: {
        tags?: string[];
        category?: string;
        isFavorite?: boolean;
    };
}

export interface SaveDocumentResult {
    document: Document;
}

export class SaveDocumentUseCase {
    constructor(private readonly documentRepository: IDocumentRepository) { }

    async execute(command: SaveDocumentCommand): Promise<Result<SaveDocumentResult>> {
        try {
            // 1. Create or update document entity
            const document = command.id
                ? await this.updateExistingDocument(command)
                : this.createNewDocument(command);

            // 2. Validate domain rules
            if (!document.isValid()) {
                return fail(new Error('Invalid document: title is required'));
            }

            // 3. Persist via repository
            await this.documentRepository.save(document);

            // 4. Return success
            return ok({ document });
        } catch (error) {
            return fail(error instanceof Error ? error : new Error('Unknown error'));
        }
    }

    private async updateExistingDocument(command: SaveDocumentCommand): Promise<Document> {
        const existing = await this.documentRepository.findById(command.id!);

        if (!existing) {
            throw new Error(`Document with id ${command.id} not found`);
        }

        let updated = existing;

        if (command.title !== existing.title) {
            updated = updated.updateTitle(command.title);
        }

        if (command.content !== existing.content) {
            updated = updated.updateContent(command.content);
        }

        if (command.metadata) {
            updated = updated.updateMetadata(command.metadata);
        }

        return updated;
    }

    private createNewDocument(command: SaveDocumentCommand): Document {
        const document = Document.create(command.title, command.content);

        if (command.metadata) {
            return document.updateMetadata(command.metadata);
        }

        return document;
    }
}
