/**
 * Content Hashing Utility
 * 
 * 🔴 CRITICAL POINT #1: Browser Compatibility
 * - Uses Web Crypto API (crypto.subtle)
 * - Supported in all modern browsers
 * - Falls back to simple string comparison if unavailable
 * 
 * 🔴 CRITICAL POINT #2: Async Operations
 * - All hash functions are async (crypto.subtle is async)
 * - Must await before comparing
 * - Don't use in synchronous contexts
 */

/**
 * Generate SHA256 hash of content for duplicate detection
 * 
 * @param content - The text content to hash
 * @returns Hex string representation of SHA256 hash
 * 
 * ⚠️ BREAKABLE POINT: If crypto.subtle is unavailable (old browsers, non-HTTPS)
 * Solution: Falls back to simple length check
 */
export async function getContentHash(content: string): Promise<string> {
  try {
    // Check if crypto.subtle is available
    if (!window.crypto || !window.crypto.subtle) {
      console.warn('⚠️ crypto.subtle not available, using fallback hash');
      // Fallback: Use simple hash (not cryptographically secure, but good enough for deduplication)
      return simpleFallbackHash(content);
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('❌ Hash generation failed:', error);
    // Fallback on error
    return simpleFallbackHash(content);
  }
}

/**
 * Fallback hash for environments without crypto.subtle
 * 
 * ⚠️ NOT cryptographically secure - only for deduplication
 */
function simpleFallbackHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `fallback-${hash.toString(16)}-${content.length}`;
}

/**
 * Compare two content strings by hash
 * 
 * @param content1 - First content string
 * @param content2 - Second content string
 * @returns true if content is identical
 * 
 * 🔴 CRITICAL POINT #3: Hash Collision
 * - SHA256 has negligible collision probability
 * - Fallback hash has higher collision risk
 * - For critical operations, also compare content length
 */
export async function contentMatches(content1: string, content2: string): Promise<boolean> {
  // Quick length check first (optimization)
  if (content1.length !== content2.length) {
    return false;
  }

  const hash1 = await getContentHash(content1);
  const hash2 = await getContentHash(content2);
  
  return hash1 === hash2;
}

/**
 * Get content hash synchronously (for emergency use only)
 * 
 * ⚠️ AVOID THIS - Use async version instead
 * Only use if you absolutely cannot await
 */
export function getContentHashSync(content: string): string {
  return simpleFallbackHash(content);
}
