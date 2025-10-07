import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { workspaceService, Document } from '@/services/workspace/WorkspaceService';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { QuickSwitcher } from '@/components/workspace/QuickSwitcher';
import { NewDocumentModal } from '@/components/workspace/NewDocumentModal';
import { DesktopWorkspaceSelector } from '@/components/workspace/DesktopWorkspaceSelector';
import { Button } from '@/components/ui/button';
import { Plus, Search, Sparkles } from 'lucide-react';
import { getGuestCredits } from '@/lib/guestCredits';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { usePlatform } from '@/contexts/PlatformContext';

// Import document editors
import Editor from './Editor';
import MindmapStudio2 from './MindmapStudio2';
import PresentationEditor from './PresentationEditor';

type ViewMode = 'home' | 'edit' | 'mindmap' | 'slides';

export default function Workspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDesktop } = usePlatform();
  const { remaining, total } = getGuestCredits();

  // Parse URL to determine view mode and document ID
  // /workspace → home
  // /workspace/doc/:id/edit → edit mode
  // /workspace/doc/:id/mindmap → mindmap mode
  // /workspace/doc/:id/slides → slides mode
  const pathParts = location.pathname.split('/').filter(Boolean);
  const viewMode: ViewMode = pathParts[3] as ViewMode || 'home';
  const documentId = pathParts[2] || null;

  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🔍 Workspace state:', {
      viewMode,
      documentId,
      showQuickSwitcher,
      showNewDocModal,
      currentDocument: currentDocument?.title
    });
  }, [viewMode, documentId, showQuickSwitcher, showNewDocModal, currentDocument]);

  // Load document if ID is in URL
  useEffect(() => {
    if (documentId) {
      const doc = workspaceService.getDocument(documentId);
      if (doc) {
        setCurrentDocument(doc);
        workspaceService.markDocumentOpened(documentId);
      } else {
        // Document not found, go home
        navigate('/workspace');
      }
    } else {
      setCurrentDocument(null);
    }
  }, [documentId, navigate]);

  // Handle Cmd+K for quick switcher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickSwitcher(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle document selection from sidebar or quick switcher
  const handleDocumentSelect = (docId: string) => {
    const doc = workspaceService.getDocument(docId);
    if (!doc) return;

    // Navigate to appropriate view based on document type
    if (doc.type === 'markdown') {
      navigate(`/workspace/doc/${docId}/edit`);
    } else if (doc.type === 'mindmap') {
      navigate(`/workspace/doc/${docId}/mindmap`);
    } else if (doc.type === 'presentation') {
      navigate(`/workspace/doc/${docId}/slides`);
    }
  };

  // Handle new document creation
  const handleNewDocument = () => {
    console.log('🆕 Opening new document modal...');
    setShowNewDocModal(true);
  };

  const handleDocumentCreated = (docId: string) => {
    console.log('✅ Document created:', docId);
    handleDocumentSelect(docId);
  };

  // Render appropriate editor based on view mode
  const renderMainContent = () => {
    if (viewMode === 'home') {
      return (
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Welcome to Your Workspace</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Create, organize, and manage all your documents, mindmaps, and presentations in one place.
            </p>

            {/* Desktop Workspace Selector */}
            {isDesktop && (
              <div className="mb-8">
                <DesktopWorkspaceSelector />
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={handleNewDocument}
                className="p-6 rounded-lg border border-border hover:border-primary bg-card hover:bg-card/80 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Plus className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">New Document</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create from templates or start blank
                </p>
              </button>

              <button
                onClick={() => {
                  console.log('🔍 Opening quick switcher...');
                  setShowQuickSwitcher(true);
                }}
                className="p-6 rounded-lg border border-border hover:border-primary bg-card hover:bg-card/80 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Search className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold">Quick Search</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Press Cmd+K to search documents
                </p>
              </button>

              <button
                onClick={() => navigate('/')}
                className="p-6 rounded-lg border border-border hover:border-primary bg-card hover:bg-card/80 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold">AI Generate</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create content with AI assistance
                </p>
              </button>
            </div>

            {/* Recent Documents */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Recent Documents</h2>
              <div className="space-y-2">
                {workspaceService.getRecentDocuments(5).map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocumentSelect(doc.id)}
                    className="w-full p-4 rounded-lg border border-border hover:border-primary bg-card hover:bg-card/80 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {doc.type === 'markdown' && '📝 Markdown'}
                          {doc.type === 'mindmap' && '🧠 Mindmap'}
                          {doc.type === 'presentation' && '🎤 Presentation'}
                          {' • '}
                          {doc.lastOpenedAt ? new Date(doc.lastOpenedAt).toLocaleDateString() : 'Never opened'}
                        </p>
                      </div>
                      {doc.starred && <span className="text-yellow-500">⭐</span>}
                    </div>
                  </button>
                ))}
                {workspaceService.getRecentDocuments(5).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No recent documents</p>
                    <p className="text-sm mt-2">Create your first document to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (viewMode === 'edit') {
      return <Editor />;
    }

    if (viewMode === 'mindmap') {
      return <MindmapStudio2 />;
    }

    if (viewMode === 'slides') {
      return <PresentationEditor />;
    }

    return null;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <WorkspaceSidebar
        onDocumentSelect={handleDocumentSelect}
        onNewDocument={handleNewDocument}
        currentDocumentId={documentId}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-glow">MD Creator</h1>
            {currentDocument && (
              <span className="text-sm text-muted-foreground">
                / {currentDocument.title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* New Document Button */}
            <Button onClick={handleNewDocument} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New
            </Button>

            {/* Guest Credits */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/40 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500/80" />
                <span>Guest</span>
              </span>
              <span className="mx-1 text-border">•</span>
              <span className="inline-flex items-center gap-1">
                <span>⚡</span>
                <span>{remaining}/{total}</span>
              </span>
            </div>

            {/* Login */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/pricing')}
              className="hidden md:inline-flex"
            >
              Log in
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {renderMainContent()}
        </div>
      </div>

      {/* Quick Switcher Modal */}
      <QuickSwitcher
        isOpen={showQuickSwitcher}
        onDocumentSelect={handleDocumentSelect}
        onClose={() => setShowQuickSwitcher(false)}
      />

      {/* New Document Modal */}
      <NewDocumentModal
        isOpen={showNewDocModal}
        onClose={() => setShowNewDocModal(false)}
        onDocumentCreated={handleDocumentCreated}
        folderId={null}
      />
    </div>
  );
}
