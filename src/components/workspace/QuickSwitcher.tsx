/**
 * QuickSwitcher - Cmd+K quick document finder
 * 
 * Features:
 * - Fuzzy search across all documents
 * - Keyboard navigation (arrows, enter, escape)
 * - Shows recent documents first
 * - Document type icons
 * - Quick preview
 */

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FileText, Brain, Presentation, Clock, Search } from 'lucide-react';
import { workspaceService, type Document } from '@/services/workspace/WorkspaceService';
import Fuse from 'fuse.js';

interface QuickSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentSelect: (documentId: string) => void;
}

export function QuickSwitcher({
  isOpen,
  onClose,
  onDocumentSelect,
}: QuickSwitcherProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<Document[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Setup fuzzy search
  const allDocuments = workspaceService.getAllDocuments();
  const fuse = useRef(
    new Fuse(allDocuments, {
      keys: ['title', 'content', 'tags'],
      threshold: 0.3,
      includeScore: true,
    })
  );

  // Update fuse when documents change
  useEffect(() => {
    fuse.current = new Fuse(allDocuments, {
      keys: ['title', 'content', 'tags'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [allDocuments.length]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      // Show recent documents when no query
      const recent = workspaceService.getRecentDocuments(10);
      setResults(recent.length > 0 ? recent : allDocuments.slice(0, 10));
    } else {
      // Fuzzy search
      const searchResults = fuse.current.search(query);
      setResults(searchResults.map(result => result.item).slice(0, 10));
    }
    setSelectedIndex(0);
  }, [query, allDocuments]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelect = (document: Document) => {
    workspaceService.markDocumentOpened(document.id);
    onDocumentSelect(document.id);
    onClose();
  };

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'markdown':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'mindmap':
        return <Brain className="h-4 w-4 text-purple-500" />;
      case 'presentation':
        return <Presentation className="h-4 w-4 text-pink-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getDocumentTypeLabel = (type: Document['type']) => {
    switch (type) {
      case 'markdown':
        return 'Document';
      case 'mindmap':
        return 'Mindmap';
      case 'presentation':
        return 'Presentation';
      default:
        return 'Document';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        {/* Search Input */}
        <div className="relative border-b border-border">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search documents... (type to filter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 pl-12 h-14 text-base"
          />
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No documents found</p>
              {query && (
                <p className="text-sm mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-border flex items-center gap-2">
                {query ? (
                  <>
                    <Search className="h-3 w-3" />
                    <span>Search Results ({results.length})</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    <span>Recent Documents</span>
                  </>
                )}
              </div>

              {/* Document List */}
              <div className="py-2">
                {results.map((doc, index) => (
                  <button
                    key={doc.id}
                    className={`
                      w-full px-4 py-3 flex items-center gap-3 transition-colors text-left
                      ${
                        index === selectedIndex
                          ? 'bg-accent'
                          : 'hover:bg-accent/50'
                      }
                    `}
                    onClick={() => handleSelect(doc)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getDocumentIcon(doc.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{doc.title}</span>
                        {doc.starred && (
                          <span className="text-yellow-500">⭐</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{getDocumentTypeLabel(doc.type)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.updatedAt)}</span>
                        {doc.metadata.wordCount && (
                          <>
                            <span>•</span>
                            <span>{doc.metadata.wordCount} words</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Keyboard Hint */}
                    {index === selectedIndex && (
                      <div className="flex-shrink-0 text-xs text-muted-foreground">
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">↵</kbd>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↑↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↵</kbd> to open
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded">esc</kbd> to close
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

