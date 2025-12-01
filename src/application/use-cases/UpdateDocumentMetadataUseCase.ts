/**
 * Update Document Metadata Use Case
 * 
 * Update document metadata (tags, favorite, etc.)
 */

import { Document, DocumentMetadata } from '@/domain/entities/Document';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { Result, ok, fail } from '../common/Result';

export interface UpdateDocumentMetadataCommand {
    documentId: string;
    metadata: DocumentMetadata;
}

export interface UpdateDocumentMetadataResult {
    document: Document;
}

export class UpdateDocumentMetadataUseCase {
    constructor(private readonly documentRepository: IDocumentRepository) { }

    async execute(command: UpdateDocumentMetadataCommand): Promise<Result<UpdateDocumentMetadataResult>> {
        try {
            // Load document
            const document = await this.documentRepository.findById(command.documentId);

            if (!document) {
                return fail(new Error(`Document with id ${command.documentId} not found`));
            }

            // Update metadata
            const updated = document.updateMetadata(command.metadata);

            // Save
            await this.documentRepository.save(updated);

            return ok({ document: updated });
        } catch (error) {
            return fail(error instanceof Error ? error : new Error('Failed to update metadata'));
        }
    }
}
