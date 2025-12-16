/**
 * QuickSwitcherModal
 * 
 * Command palette for quick navigation (Cmd+K / Ctrl+K)
 * - Search documents
 * - Recent files
 * - Quick actions
 * - Keyboard navigation
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  FileText,
  Star,
  Clock,
  Plus,
  FolderPlus,
  Command,
  ArrowRight,
  Tag,
} from 'lucide-react';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';
import type { Document } from '@/services/workspace-legacy/BackendWorkspaceService';

interface QuickSwitcherModalProps {
  open: boolean;
  onClose: () => void;
  onDocumentSelect: (documentId: string) => void;
  onCreateDocument?: () => void;
  onCreateFolder?: () => void;
}

type ActionType = 'document' | 'action' | 'recent';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  type: ActionType;
  keywords?: string[];
}

export function QuickSwitcherModal({
  open,
  onClose,
  onDocumentSelect,
  onCreateDocument,
  onCreateFolder,
}: QuickSwitcherModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const {
    search,
    getRecentDocuments,
    getStarredDocuments,
  } = useDocumentSearch();

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'new-doc',
      label: 'Create New Document',
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        onCreateDocument?.();
        onClose();
      },
      type: 'action',
      keywords: ['new', 'create', 'document'],
    },
    {
      id: 'new-folder',
      label: 'Create New Folder',
      icon: <FolderPlus className="h-4 w-4" />,
      action: () => {
        onCreateFolder?.();
        onClose();
      },
      type: 'action',
      keywords: ['new', 'create', 'folder'],
    },
  ];

  // Get results
  const searchResults = query.trim().length > 0
    ? search({
        query,
        includeContent: true,
        includeTags: true,
        fuzzy: true,
        maxResults: 20,
      })
    : [];

  const recentDocs = query.trim().length === 0 ? getRecentDocuments(5) : [];
  const starredDocs = query.trim().length === 0 ? getStarredDocuments() : [];

  // Filter actions by query
  const filteredActions = query.trim().length > 0
    ? quickActions.filter(action =>
        action.label.toLowerCase().includes(query.toLowerCase()) ||
        action.keywords?.some(kw => kw.includes(query.toLowerCase()))
      )
    : quickActions;

  // Combine all items for keyboard navigation
  const allItems = [
    ...filteredActions.map(a => ({ type: 'action' as const, item: a })),
    ...searchResults.map(r => ({ type: 'document' as const, item: r })),
    ...(query.trim().length === 0 ? recentDocs.map(d => ({ type: 'recent' as const, item: d })) : []),
  ];

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, searchResults.length]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = allItems[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [selectedIndex, allItems, onClose]);

  const handleSelect = (item: typeof allItems[0]) => {
    if (item.type === 'action') {
      item.item.action();
    } else if (item.type === 'document') {
      onDocumentSelect(item.item.document.id);
      onClose();
    } else if (item.type === 'recent') {
      onDocumentSelect(item.item.id);
      onClose();
    }
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search documents or type a command..."
              className="pl-10 border-0 focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            {/* Actions */}
            {filteredActions.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Actions
                </div>
                {filteredActions.map((action, index) => {
                  const globalIndex = index;
                  return (
                    <div
                      key={action.id}
                      onClick={() => action.action()}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        selectedIndex === globalIndex
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted'
                      }`}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      {action.icon}
                      <span className="flex-1 text-sm">{action.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Search Results ({searchResults.length})
                </div>
                {searchResults.map((result, index) => {
                  const globalIndex = filteredActions.length + index;
                  return (
                    <div
                      key={result.document.id}
                      onClick={() => {
                        onDocumentSelect(result.document.id);
                        onClose();
                      }}
                      className={`flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        selectedIndex === globalIndex
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted'
                      }`}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      {getDocumentIcon(result.document.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {result.document.title}
                          </span>
                          {result.document.starred && (
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          )}
                        </div>
                        {result.snippet && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {result.snippet}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recent Documents */}
            {query.trim().length === 0 && recentDocs.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Recent
                </div>
                {recentDocs.map((doc, index) => {
                  const globalIndex = filteredActions.length + index;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        onDocumentSelect(doc.id);
                        onClose();
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        selectedIndex === globalIndex
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted'
                      }`}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm truncate">{doc.title}</span>
                      {doc.starred && (
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {allItems.length === 0 && query.trim().length > 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium mb-1">No results found</p>
                <p className="text-xs">Try a different search term</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">↵</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Command className="h-3 w-3" />
              <span>Quick Switcher</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

