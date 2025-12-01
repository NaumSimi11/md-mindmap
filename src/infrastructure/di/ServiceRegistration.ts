/**
 * Service Registration
 * 
 * Centralized setup for all dependencies.
 * This is where we wire everything together.
 */

import { DIContainer } from './DIContainer';
import { TauriDocumentRepository } from '../persistence/TauriDocumentRepository';
import { LocalStorageDocumentRepository } from '../persistence/LocalStorageDocumentRepository';
import { TauriMindmapRepository } from '../persistence/TauriMindmapRepository';
import { LocalStorageMindmapRepository } from '../persistence/LocalStorageMindmapRepository';
import { TauriTemplateRepository } from '../persistence/TauriTemplateRepository';
import { LocalStorageTemplateRepository } from '../persistence/LocalStorageTemplateRepository';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { IMindmapRepository } from '@/domain/repositories/IMindmapRepository';
import { ITemplateRepository } from '@/domain/repositories/ITemplateRepository';
import { SaveDocumentUseCase } from '@/application/use-cases/SaveDocumentUseCase';
import { LoadDocumentUseCase } from '@/application/use-cases/LoadDocumentUseCase';
import { DeleteDocumentUseCase } from '@/application/use-cases/DeleteDocumentUseCase';
import { SearchDocumentsUseCase } from '@/application/use-cases/SearchDocumentsUseCase';
import { GenerateMindmapUseCase } from '@/application/use-cases/GenerateMindmapUseCase';
import { ApplyTemplateUseCase } from '@/application/use-cases/ApplyTemplateUseCase';

/**
 * Check if running in Tauri environment
 */
function isTauriEnvironment(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Setup all services in the DI container
 */
export function setupServices(): void {
    const container = DIContainer.getInstance();

    // ============ REPOSITORIES ============

    // Document Repository (singleton)
    container.registerSingleton<IDocumentRepository>(
        'IDocumentRepository',
        () => {
            if (isTauriEnvironment()) {
                return new TauriDocumentRepository();
            } else {
                return new LocalStorageDocumentRepository();
            }
        }
    );

    // Mindmap Repository (singleton)
    container.registerSingleton<IMindmapRepository>(
        'IMindmapRepository',
        () => {
            if (isTauriEnvironment()) {
                return new TauriMindmapRepository();
            } else {
                return new LocalStorageMindmapRepository();
            }
        }
    );

    // Template Repository (singleton)
    container.registerSingleton<ITemplateRepository>(
        'ITemplateRepository',
        () => {
            if (isTauriEnvironment()) {
                return new TauriTemplateRepository();
            } else {
                return new LocalStorageTemplateRepository();
            }
        }
    );

    // ============ USE CASES ============

    // SaveDocumentUseCase
    container.register(
        'SaveDocumentUseCase',
        () => new SaveDocumentUseCase(
            container.resolve<IDocumentRepository>('IDocumentRepository')
        )
    );

    // LoadDocumentUseCase
    container.register(
        'LoadDocumentUseCase',
        () => new LoadDocumentUseCase(
            container.resolve<IDocumentRepository>('IDocumentRepository')
        )
    );

    // DeleteDocumentUseCase
    container.register(
        'DeleteDocumentUseCase',
        () => new DeleteDocumentUseCase(
            container.resolve<IDocumentRepository>('IDocumentRepository'),
            container.resolve<IMindmapRepository>('IMindmapRepository')
        )
    );

    // SearchDocumentsUseCase
    container.register(
        'SearchDocumentsUseCase',
        () => new SearchDocumentsUseCase(
            container.resolve<IDocumentRepository>('IDocumentRepository')
        )
    );

    // GenerateMindmapUseCase
    container.register(
        'GenerateMindmapUseCase',
        () => new GenerateMindmapUseCase(
            container.resolve<IDocumentRepository>('IDocumentRepository'),
            container.resolve<IMindmapRepository>('IMindmapRepository')
        )
    );

    // ApplyTemplateUseCase
    container.register(
        'ApplyTemplateUseCase',
        () => new ApplyTemplateUseCase(
            container.resolve<ITemplateRepository>('ITemplateRepository'),
            container.resolve<IDocumentRepository>('IDocumentRepository')
        )
    );
}

/**
 * Get a service from the container
 */
export function getService<T>(key: string): T {
    return DIContainer.getInstance().resolve<T>(key);
}

/**
 * Get an async service from the container
 */
export async function getServiceAsync<T>(key: string): Promise<T> {
    return DIContainer.getInstance().resolveAsync<T>(key);
}
