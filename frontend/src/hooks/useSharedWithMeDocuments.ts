/**
 * Shared-with-me documents hook
 * ============================
 *
 * Fetches documents that the user can access via explicit document shares but
 * does NOT have workspace membership (or restricted docs where they have a share).
 *
 * This is a VIEW, not a workspace container.
 */

import { useQuery } from '@tanstack/react-query';
import { documentService } from '@/services/api';

export const sharedWithMeKeys = {
  all: ['shared-with-me'] as const,
};

export function useSharedWithMeDocuments(enabled: boolean = true) {
  return useQuery({
    queryKey: sharedWithMeKeys.all,
    queryFn: () => documentService.listSharedWithMe(),
    enabled,
  });
}


