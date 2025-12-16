/**
 * WorkspaceHome - Clean, Modern Workspace View
 * 
 * Features:
 * - Visual document cards (with previews)
 * - Minimal quick actions
 * - Clean spacing (no rigid borders)
 * - Modern, fluid design
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Search,
  FileText,
  Brain,
  Presentation,
  ArrowRight,
  Clock,
  Star,
  TrendingUp,
} from 'lucide-react';
import type { Document } from '@/services/workspace-legacy/BackendWorkspaceService';
import { QuickSwitcher } from './QuickSwitcher';

interface WorkspaceHomeProps {
  onDocumentSelect: (documentId: string) => void;
  onNewDocument: () => void;
  onLoadDemo?: () => void;
  documents?: Document[]; // 🔥 Now passed from parent
}

export function WorkspaceHome({
  onDocumentSelect,
  onNewDocument,
  onLoadDemo,
  documents = [],
}: WorkspaceHomeProps) {
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);

  // Get recent and starred from passed documents
  const recentDocs = documents
    .filter(d => d.lastOpenedAt)
    .sort((a, b) => {
      const aTime = a.lastOpenedAt?.getTime() || 0;
      const bTime = b.lastOpenedAt?.getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, 8);
  
  const starredDocs = documents.filter(d => d.starred).slice(0, 4);

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'markdown':
        return <FileText className="h-5 w-5 text-blue-400" />;
      case 'mindmap':
        return <Brain className="h-5 w-5 text-sky-400" />;
      case 'presentation':
        return <Presentation className="h-5 w-5 text-blue-400" />;
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
    }
  };

  return (
    <div className="flex-1 relative overflow-auto">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8 space-y-12">
        {/* Quick Actions - Minimal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={onNewDocument}
              className="bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowQuickSwitcher(true)}
              className="border-border/50 hover:bg-muted/50"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
              <kbd className="ml-2 px-1.5 py-0.5 bg-muted rounded text-xs">⌘K</kbd>
            </Button>
            {onLoadDemo && (
              <Button
                variant="outline"
                onClick={onLoadDemo}
                className="border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400"
              >
                <span className="mr-2">✨</span>
                Blocks Demo
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 opacity-60" />
              <span>{documents.length} documents</span>
            </div>
          </div>
        </div>

        {/* Recent Documents - Visual Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground opacity-70" />
              <h2 className="text-lg font-semibold">Recent</h2>
            </div>
            {recentDocs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickSwitcher(true)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View all
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>

          {recentDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onDocumentSelect(doc.id)}
                  className="group relative p-4 rounded-xl border border-border/40 bg-card/50 hover:border-blue-500/40 hover:bg-card/70 transition-all text-left overflow-hidden backdrop-blur-sm"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-sky-500/0 group-hover:from-blue-500/10 group-hover:to-sky-500/10 transition-all" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        {getDocumentIcon(doc.type)}
                      </div>
                      {doc.starred && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <h3 className="font-semibold mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {getDocumentTypeLabel(doc.type)}
                      {doc.lastOpenedAt && (
                        <>
                          {' • '}
                          <span>{new Date(doc.lastOpenedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </p>
                    {/* Content preview */}
                    {doc.content && doc.type === 'markdown' && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.content.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 rounded-2xl bg-muted/20 backdrop-blur-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">No documents yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create your first document to get started
              </p>
              <Button
                onClick={onNewDocument}
                className="bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Document
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Switcher */}
      <QuickSwitcher
        isOpen={showQuickSwitcher}
        onDocumentSelect={onDocumentSelect}
        onClose={() => setShowQuickSwitcher(false)}
      />
    </div>
  );
}

