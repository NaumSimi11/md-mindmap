/**
 * Generate Mindmap Use Case
 * 
 * Complex orchestration: Uses multiple domain services.
 */

import { Document } from '@/domain/entities/Document';
import { Mindmap } from '@/domain/entities/Mindmap';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { IMindmapRepository } from '@/domain/repositories/IMindmapRepository';
import { MarkdownService } from '@/domain/services/MarkdownService';
import { Result, ok, fail } from '../common/Result';

export interface GenerateMindmapCommand {
    documentId: string;
    title?: string;
    strategy: 'headings' | 'keywords' | 'ai';
}

export interface GenerateMindmapResult {
    mindmap: Mindmap;
}

export class GenerateMindmapUseCase {
    constructor(
        private readonly documentRepository: IDocumentRepository,
        private readonly mindmapRepository: IMindmapRepository
    ) { }

    async execute(command: GenerateMindmapCommand): Promise<Result<GenerateMindmapResult>> {
        try {
            // 1. Load source document
            const document = await this.documentRepository.findById(command.documentId);

            if (!document) {
                return fail(new Error(`Document with id ${command.documentId} not found`));
            }

            // 2. Generate mindmap based on strategy
            const mindmap = await this.generateMindmap(document, command);

            // 3. Persist mindmap
            await this.mindmapRepository.save(mindmap);

            // 4. Return result
            return ok({ mindmap });
        } catch (error) {
            return fail(error instanceof Error ? error : new Error('Failed to generate mindmap'));
        }
    }

    private async generateMindmap(
        document: Document,
        command: GenerateMindmapCommand
    ): Promise<Mindmap> {
        const title = command.title || `Mindmap: ${document.title}`;

        switch (command.strategy) {
            case 'headings':
                return this.generateFromHeadings(document, title);

            case 'keywords':
                return this.generateFromKeywords(document, title);

            case 'ai':
                // AI generation would be handled by infrastructure layer
                throw new Error('AI generation not yet implemented');

            default:
                throw new Error(`Unknown strategy: ${command.strategy}`);
        }
    }

    private generateFromHeadings(document: Document, title: string): Mindmap {
        // Use domain service to extract headings
        const headings = MarkdownService.extractHeadings(document.content);

        if (headings.length === 0) {
            // Fallback: use document title as root
            return Mindmap.create(title, document.title);
        }

        // Use entity factory method
        return Mindmap.fromMarkdownHeadings(title, headings);
    }

    private generateFromKeywords(document: Document, title: string): Mindmap {
        // Simple keyword extraction (could be enhanced)
        const words = document.content
            .split(/\s+/)
            .filter(w => w.length > 5)
            .slice(0, 10);

        const rootNode = {
            id: crypto.randomUUID(),
            text: document.title,
            children: words.map(word => ({
                id: crypto.randomUUID(),
                text: word,
                children: [],
            })),
        };

        return new Mindmap(
            crypto.randomUUID(),
            title,
            rootNode,
            new Date(),
            new Date(),
            document.id
        );
    }
}
