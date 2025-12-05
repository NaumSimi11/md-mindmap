/**
 * Export Document Use Case
 * 
 * Export document to various formats.
 */

import { Document } from '@/domain/entities/Document';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { Result, ok, fail } from '../common/Result';

export type ExportFormat = 'markdown' | 'html' | 'text';

export interface ExportDocumentCommand {
    documentId: string;
    format: ExportFormat;
}

export interface ExportDocumentResult {
    content: string;
    filename: string;
    mimeType: string;
}

export class ExportDocumentUseCase {
    constructor(private readonly documentRepository: IDocumentRepository) { }

    async execute(command: ExportDocumentCommand): Promise<Result<ExportDocumentResult>> {
        try {
            // Load document
            const document = await this.documentRepository.findById(command.documentId);

            if (!document) {
                return fail(new Error(`Document with id ${command.documentId} not found`));
            }

            // Export based on format
            const result = this.exportDocument(document, command.format);
            return ok(result);
        } catch (error) {
            return fail(error instanceof Error ? error : new Error('Export failed'));
        }
    }

    private exportDocument(document: Document, format: ExportFormat): ExportDocumentResult {
        const baseFilename = document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        switch (format) {
            case 'markdown':
                return {
                    content: document.content,
                    filename: `${baseFilename}.md`,
                    mimeType: 'text/markdown',
                };

            case 'html':
                return {
                    content: this.convertToHtml(document),
                    filename: `${baseFilename}.html`,
                    mimeType: 'text/html',
                };

            case 'text':
                return {
                    content: this.convertToText(document.content),
                    filename: `${baseFilename}.txt`,
                    mimeType: 'text/plain',
                };

            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    private convertToHtml(document: Document): string {
        // Simple HTML conversion (could use markdown-it for better results)
        const escapedContent = document.content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${document.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${document.title}</h1>
  <pre>${escapedContent}</pre>
</body>
</html>`;
    }

    private convertToText(markdown: string): string {
        // Remove markdown syntax for plain text
        return markdown
            .replace(/#{1,6}\s+/g, '') // Remove headings
            .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.+?)\*/g, '$1') // Remove italic
            .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
            .replace(/!\[.+?\]\(.+?\)/g, '') // Remove images
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/`(.+?)`/g, '$1'); // Remove inline code
    }
}
