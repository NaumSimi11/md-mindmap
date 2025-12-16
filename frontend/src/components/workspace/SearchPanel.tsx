/**
 * SearchPanel
 * 
 * Advanced search interface with filters
 * - Full-text search
 * - Tag filtering
 * - Recent searches
 * - Search results with snippets
 */

import { useState, useEffect } from 'react';
import { Search, X, Clock, Tag, FileText, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useDocumentSearch, type SearchResult } from '@/hooks/useDocumentSearch';
import type { Document } from '@/services/workspace-legacy/BackendWorkspaceService';

interface SearchPanelProps {
  onDocumentSelect: (documentId: string) => void;
  className?: string;
}

export function SearchPanel({ onDocumentSelect, className = '' }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showRecent, setShowRecent] = useState(true);
  
  const {
    search,
    getRecentDocuments,
    getStarredDocuments,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  } = useDocumentSearch();

  const recentDocs = getRecentDocuments(10);
  const starredDocs = getStarredDocuments();

  // Perform search
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setShowRecent(true);
      return;
    }

    setShowRecent(false);
    const searchResults = search({
      query,
      includeContent: true,
      includeTags: true,
      fuzzy: true,
      maxResults: 50,
    });

    setResults(searchResults);

    // Add to recent searches (debounced)
    const timer = setTimeout(() => {
      if (query.trim().length > 2) {
        addRecentSearch(query);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [query, search, addRecentSearch]);

  const handleDocumentClick = (documentId: string) => {
    onDocumentSelect(documentId);
    setQuery('');
  };

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'markdown':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'mindmap':
        return <span className="text-sm">🧠</span>;
      case 'presentation':
        return <span className="text-sm">📊</span>;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Search Input */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents..."
            className="pl-10 pr-10"
            autoFocus
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && showRecent && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Recent Searches</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRecentSearches}
                className="h-5 text-xs"
              >
                Clear
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.slice(0, 5).map((recentQuery, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/20"
                  onClick={() => setQuery(recentQuery)}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {recentQuery}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Search Results */}
          {!showRecent && results.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Found {results.length} {results.length === 1 ? 'result' : 'results'}
              </div>
              {results.map((result) => (
                <div
                  key={result.document.id}
                  onClick={() => handleDocumentClick(result.document.id)}
                  className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getDocumentIcon(result.document.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {result.document.title}
                        </span>
                        {result.document.starred && (
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        )}
                      </div>
                      {result.snippet && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {result.snippet}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        {result.matchedFields.map((field) => (
                          <Badge key={field} variant="outline" className="text-[10px] h-5">
                            {field}
                          </Badge>
                        ))}
                        {result.document.tags && result.document.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            {result.document.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px] h-5">
                                <Tag className="h-2.5 w-2.5 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!showRecent && query && results.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium mb-1">No results found</p>
              <p className="text-xs">Try a different search term</p>
            </div>
          )}

          {/* Recent Documents */}
          {showRecent && recentDocs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Recent Documents</span>
              </div>
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleDocumentClick(doc.id)}
                  className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {getDocumentIcon(doc.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {doc.title}
                        </span>
                        {doc.starred && (
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        )}
                      </div>
                      {doc.lastOpenedAt && (
                        <div className="text-xs text-muted-foreground">
                          {formatTimeAgo(doc.lastOpenedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Starred Documents */}
          {showRecent && starredDocs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5" />
                <span>Starred Documents</span>
              </div>
              {starredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleDocumentClick(doc.id)}
                  className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {getDocumentIcon(doc.type)}
                    <span className="font-medium text-sm truncate flex-1">
                      {doc.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

/**
 * Fuzzy match implementation
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

