/**
 * useDocumentSearch
 * 
 * Provides full-text search across all documents
 * Supports fuzzy search, tag filtering, and recent files
 */

import { useState, useEffect, useMemo } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import type { Document } from '@/services/workspace-legacy/BackendWorkspaceService';

export interface SearchResult {
  document: Document;
  score: number;
  matchedFields: string[];
  snippet?: string;
}

export interface SearchOptions {
  query: string;
  includeContent?: boolean;
  includeTags?: boolean;
  fuzzy?: boolean;
  maxResults?: number;
}

export function useDocumentSearch() {
  const { documents } = useWorkspace();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  /**
   * Search documents
   */
  const search = useMemo(() => {
    return (options: SearchOptions): SearchResult[] => {
      const {
        query,
        includeContent = true,
        includeTags = true,
        fuzzy = true,
        maxResults = 50,
      } = options;

      if (!query || query.trim().length === 0) {
        return [];
      }

      const normalizedQuery = query.toLowerCase().trim();
      const results: SearchResult[] = [];

      for (const document of documents) {
        let score = 0;
        const matchedFields: string[] = [];
        let snippet: string | undefined;

        // Search in title (highest weight)
        if (document.title.toLowerCase().includes(normalizedQuery)) {
          score += 10;
          matchedFields.push('title');
        }

        // Fuzzy search in title
        if (fuzzy && fuzzyMatch(document.title.toLowerCase(), normalizedQuery)) {
          score += 5;
          if (!matchedFields.includes('title')) {
            matchedFields.push('title');
          }
        }

        // Search in content
        if (includeContent && document.content) {
          const contentLower = document.content.toLowerCase();
          if (contentLower.includes(normalizedQuery)) {
            score += 3;
            matchedFields.push('content');
            snippet = extractSnippet(document.content, normalizedQuery);
          }
        }

        // Search in tags
        if (includeTags && document.tags) {
          const tagMatch = document.tags.some(tag =>
            tag.toLowerCase().includes(normalizedQuery)
          );
          if (tagMatch) {
            score += 2;
            matchedFields.push('tags');
          }
        }

        // If any match found, add to results
        if (score > 0) {
          results.push({
            document,
            score,
            matchedFields,
            snippet,
          });
        }
      }

      // Sort by score (highest first)
      results.sort((a, b) => b.score - a.score);

      // Limit results
      return results.slice(0, maxResults);
    };
  }, [documents]);

  /**
   * Get recent documents
   */
  const getRecentDocuments = useMemo(() => {
    return (limit: number = 10): Document[] => {
      return [...documents]
        .filter(d => d.lastOpenedAt)
        .sort((a, b) => {
          const aTime = a.lastOpenedAt?.getTime() || 0;
          const bTime = b.lastOpenedAt?.getTime() || 0;
          return bTime - aTime;
        })
        .slice(0, limit);
    };
  }, [documents]);

  /**
   * Get starred documents
   */
  const getStarredDocuments = useMemo(() => {
    return (): Document[] => {
      return documents.filter(d => d.starred);
    };
  }, [documents]);

  /**
   * Search by tag
   */
  const searchByTag = useMemo(() => {
    return (tag: string): Document[] => {
      return documents.filter(d =>
        d.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
      );
    };
  }, [documents]);

  /**
   * Add to recent searches
   */
  const addRecentSearch = (query: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q !== query);
      return [query, ...filtered].slice(0, 10);
    });
  };

  /**
   * Clear recent searches
   */
  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  return {
    search,
    getRecentDocuments,
    getStarredDocuments,
    searchByTag,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };
}

/**
 * Fuzzy match algorithm
 */
function fuzzyMatch(text: string, pattern: string): boolean {
  let patternIdx = 0;
  let textIdx = 0;

  while (textIdx < text.length && patternIdx < pattern.length) {
    if (text[textIdx] === pattern[patternIdx]) {
      patternIdx++;
    }
    textIdx++;
  }

  return patternIdx === pattern.length;
}

/**
 * Extract snippet around match
 */
function extractSnippet(content: string, query: string, contextLength: number = 100): string {
  const lowerContent = content.toLowerCase();
  const index = lowerContent.indexOf(query.toLowerCase());

  if (index === -1) {
    return content.substring(0, contextLength) + '...';
  }

  const start = Math.max(0, index - contextLength / 2);
  const end = Math.min(content.length, index + query.length + contextLength / 2);

  let snippet = content.substring(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

