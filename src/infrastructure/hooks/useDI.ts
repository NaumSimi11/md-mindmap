/**
 * React Hook for Dependency Injection
 * 
 * Provides easy access to use cases from React components.
 */

import { useMemo } from 'react';
import { getService } from '../di/ServiceRegistration';
import { SaveDocumentUseCase } from '@/application/use-cases/SaveDocumentUseCase';
import { LoadDocumentUseCase } from '@/application/use-cases/LoadDocumentUseCase';
import { DeleteDocumentUseCase } from '@/application/use-cases/DeleteDocumentUseCase';
import { SearchDocumentsUseCase } from '@/application/use-cases/SearchDocumentsUseCase';

/**
 * Hook to get SaveDocumentUseCase
 */
export function useSaveDocument() {
    return useMemo(() => getService<SaveDocumentUseCase>('SaveDocumentUseCase'), []);
}

/**
 * Hook to get LoadDocumentUseCase
 */
export function useLoadDocument() {
    return useMemo(() => getService<LoadDocumentUseCase>('LoadDocumentUseCase'), []);
}

/**
 * Hook to get DeleteDocumentUseCase
 */
export function useDeleteDocument() {
    return useMemo(() => getService<DeleteDocumentUseCase>('DeleteDocumentUseCase'), []);
}

/**
 * Hook to get SearchDocumentsUseCase
 */
export function useSearchDocuments() {
    return useMemo(() => getService<SearchDocumentsUseCase>('SearchDocumentsUseCase'), []);
}

/**
 * Generic hook to get any service
 */
export function useService<T>(key: string): T {
    return useMemo(() => getService<T>(key), [key]);
}
