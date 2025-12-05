/**
 * Delete Document Use Case
 * 
 * Command with cascading effects.
 */

import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { IMindmapRepository } from '@/domain/repositories/IMindmapRepository';
import { Result, ok, fail } from '../common/Result';

export interface DeleteDocumentCommand {
    id: string;
    deleteMindmaps?: boolean; // Cascade delete
}

export interface DeleteDocumentResult {
    deletedDocumentId: string;
    deletedMindmapCount: number;
}

export class DeleteDocumentUseCase {
    constructor(
        private readonly documentRepository: IDocumentRepository,
        private readonly mindmapRepository: IMindmapRepository
    ) { }

    async execute(command: DeleteDocumentCommand): Promise<Result<DeleteDocumentResult>> {
        try {
            // 1. Check if document exists
            const exists = await this.documentRepository.exists(command.id);

            if (!exists) {
                return fail(new Error(`Document with id ${command.id} not found`));
            }

            // 2. Handle cascade delete of mindmaps
            let deletedMindmapCount = 0;

            if (command.deleteMindmaps) {
                const mindmaps = await this.mindmapRepository.findBySourceDocument(command.id);

                for (const mindmap of mindmaps) {
                    await this.mindmapRepository.delete(mindmap.id);
                    deletedMindmapCount++;
                }
            }

            // 3. Delete document
            await this.documentRepository.delete(command.id);

            // 4. Return result
            return ok({
                deletedDocumentId: command.id,
                deletedMindmapCount,
            });
        } catch (error) {
            return fail(error instanceof Error ? error : new Error('Failed to delete document'));
        }
    }
}
