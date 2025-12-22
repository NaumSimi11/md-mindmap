// Identity utilities for workspaces and documents
// ------------------------------------------------
// Central place to:
// - Normalize IDs coming from guest vs backend (doc_<uuid> vs <uuid>)
// - Derive a stable canonical key for deduplication and lookups
//
// IMPORTANT:
// - These helpers must remain pure (no side effects)
// - Any changes here impact sidebar composition and mapping logic

/**
 * Extract a bare UUID from an id that may use prefixes like:
 * - doc_<uuid>
 * - ws_<uuid>
 * - fld_<uuid>
 *
 * If the id does not contain an underscore or does not look like a prefixed id,
 * it is returned unchanged.
 */
export function extractUuid(id: string): string {
  if (!id) return id;

  const underscoreIndex = id.indexOf('_');
  if (underscoreIndex === -1) {
    // Already looks like a bare UUID or some other format
    return id;
  }

  const possibleUuid = id.slice(underscoreIndex + 1);

  // Very lightweight UUID shape check (8-4-4-4-12 hex segments)
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (uuidRegex.test(possibleUuid)) {
    return possibleUuid;
  }

  // Fallback: if suffix doesn't look like UUID, keep original id
  return id;
}

/**
 * Compute a canonical key for a document, used for:
 * - Deduplicating guest/backend variants in the sidebar
 * - Mapping between local and cloud representations
 *
 * Preference order:
 * 1) cloudId (if present)
 * 2) sync.cloudId (if present)
 * 3) id (normalized via extractUuid)
 */
export function getCanonicalDocKey(metaOrDoc: {
  id: string;
  sync?: { cloudId?: string } | undefined;
  cloudId?: string;
}): string {
  const cloudId = metaOrDoc.cloudId ?? metaOrDoc.sync?.cloudId;
  if (cloudId) return extractUuid(cloudId);
  return extractUuid(metaOrDoc.id);
}

/**
 * Compute a canonical key for a workspace.
 *
 * Today we only normalize the id shape (e.g. ws_<uuid> → <uuid>),
 * but this centralizes the logic so we can evolve it safely.
 */
export function getCanonicalWorkspaceKey(ws: { id: string; cloudId?: string }): string {
  const cloudId = ws.cloudId;
  if (cloudId) return extractUuid(cloudId);
  return extractUuid(ws.id);
}


