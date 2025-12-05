/**
 * Apply Template Use Case
 * 
 * Orchestrates template rendering and document creation.
 */

import { Document } from '@/domain/entities/Document';
import { Template } from '@/domain/entities/Template';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { ITemplateRepository } from '@/domain/repositories/ITemplateRepository';
import { Result, ok, fail } from '../common/Result';

export interface ApplyTemplateCommand {
    templateId: string;
    variables?: Record<string, string>;
    documentTitle?: string;
}

export interface ApplyTemplateResult {
    document: Document;
    template: Template;
}

export class ApplyTemplateUseCase {
    constructor(
        private readonly templateRepository: ITemplateRepository,
        private readonly documentRepository: IDocumentRepository
    ) { }

    async execute(command: ApplyTemplateCommand): Promise<Result<ApplyTemplateResult>> {
        try {
            // 1. Load template
            const template = await this.templateRepository.findById(command.templateId);

            if (!template) {
                return fail(new Error(`Template with id ${command.templateId} not found`));
            }

            // 2. Validate required variables
            const requiredVars = template.getRequiredVariables();
            const missingVars = requiredVars.filter(
                v => !command.variables || !command.variables[v.name]
            );

            if (missingVars.length > 0) {
                const missing = missingVars.map(v => v.name).join(', ');
                return fail(new Error(`Missing required variables: ${missing}`));
            }

            // 3. Render template (domain logic)
            const content = template.render(command.variables || {});

            // 4. Create document
            const title = command.documentTitle || template.name;
            const document = Document.create(title, content);

            // 5. Persist document
            await this.documentRepository.save(document);

            // 6. Return result
            return ok({ document, template });
        } catch (error) {
            return fail(error instanceof Error ? error : new Error('Failed to apply template'));
        }
    }
}
