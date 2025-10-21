import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { workspaceService, Document } from '@/services/workspace/WorkspaceService';
import { AdaptiveSidebar } from '@/components/workspace/AdaptiveSidebar';
import { QuickSwitcher } from '@/components/workspace/QuickSwitcher';
import { NewDocumentModal } from '@/components/workspace/NewDocumentModal';
import { DesktopWorkspaceSelector } from '@/components/workspace/DesktopWorkspaceSelector';
import { Button } from '@/components/ui/button';
import { Plus, Search, Sparkles } from 'lucide-react';
import { getGuestCredits } from '@/lib/guestCredits';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { usePlatform } from '@/contexts/PlatformContext';
import { MindmapLoadingScreen } from '@/components/mindmap/MindmapLoadingScreen';
import MindmapGenerator from '@/services/MindmapGenerator';
import { sessionService } from '@/services/EditorStudioSession';
import { useScrollSpy } from '@/hooks/useScrollSpy';

// Import document editors
import { WYSIWYGEditor } from '@/components/editor/WYSIWYGEditor';
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
  const [focusMode, setFocusMode] = useState(false);
  
  // State to track LIVE editor content (not stored content)
  const [liveEditorContent, setLiveEditorContent] = useState<string>('');
  
  // Editor instance ref for direct content insertion
  const editorInstanceRef = React.useRef<any>(null);
  const editorContainerRef = useRef<HTMLElement>(null);
  
  // 🔧 Ref to prevent overlapping scroll operations
  const isScrollingRef = useRef(false);
  
  // ScrollSpy for active heading detection - DISABLED for now to prevent loops
  // TODO: Re-enable after fixing container detection
  const activeHeadingText = null;
  // const activeHeadingText = useScrollSpy(editorContainerRef, {
  //   headingSelector: '.ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6',
  //   offset: 150,
  //   throttle: 100,
  // });
  
  // Set up editor container ref for ScrollSpy - DISABLED
  // useEffect(() => {
  //   // Find the editor's scrollable container after a short delay to ensure it's mounted
  //   const timer = setTimeout(() => {
  //     const editorScrollContainer = document.querySelector('.overflow-y-auto') as HTMLElement
  //       || document.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
  //       || document.querySelector('.ProseMirror')?.parentElement as HTMLElement;
  //     
  //     if (editorScrollContainer) {
  //       editorContainerRef.current = editorScrollContainer;
  //       console.log('✅ Editor scroll container found for ScrollSpy');
  //     }
  //   }, 500);

  //   return () => clearTimeout(timer);
  // }, [viewMode, documentId]); // Re-run when switching documents or views
  
  // Context folders state
  const [contextFolders, setContextFolders] = useState<Array<any>>([]);
  
  // Mindmap generation state
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);
  const [mindmapProgress, setMindmapProgress] = useState(0);

  // Removed debug logging that was causing confusion

  // Load document if ID is in URL
  useEffect(() => {
    if (documentId) {
      const doc = workspaceService.getDocument(documentId);
      if (doc) {
        setCurrentDocument(doc);
        // CRITICAL: Clear live editor content when loading new document
        setLiveEditorContent(doc.content || '');
        workspaceService.markDocumentOpened(documentId);
        console.log('📄 Document loaded:', {
          id: doc.id,
          title: doc.title,
          contentLength: doc.content?.length || 0,
        });
      } else {
        // Document not found, go home
        navigate('/workspace');
      }
    } else {
      setCurrentDocument(null);
      setLiveEditorContent(''); // Clear content when no document
    }
  }, [documentId, navigate]);

  // Handle Cmd+K for quick switcher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K for Quick Switcher
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        setShowQuickSwitcher(true);
      }
      
      // Cmd/Ctrl+Shift+F for Focus Mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFocusMode(prev => !prev);
        console.log('🎯 Focus Mode toggled:', !focusMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  // Handle mindmap generation from URL params
  useEffect(() => {
    if (viewMode === 'mindmap' && currentDocument) {
      const searchParams = new URLSearchParams(location.search);
      const mode = searchParams.get('mode');
      const type = searchParams.get('type') as 'mindmap' | 'flowchart' | 'orgchart';

      // Use LIVE content if available (most recent), otherwise use stored content
      const contentToUse = liveEditorContent || currentDocument.content;
      
      console.log('🧠 Mindmap mode detected:', { 
        mode, 
        type, 
        contentLength: contentToUse.length,
        hasLiveContent: !!liveEditorContent,
        preview: contentToUse.substring(0, 200)
      });

      if (mode === 'generate' && type && contentToUse) {
        // Start AI generation with LIVE content
        generateMindmap(contentToUse, type);
      } else if (mode === 'generate' && type && !contentToUse) {
        console.error('❌ No content available to generate mindmap!');
        alert('Please add some content to your document before generating a mindmap.');
        navigate(location.pathname, { replace: true }); // Clear params
      }
    }
  }, [viewMode, currentDocument, location.search, liveEditorContent]);

  // Generate mindmap from content
  const generateMindmap = async (content: string, type: 'mindmap' | 'flowchart' | 'orgchart') => {
    console.log('🚀 Starting mindmap generation:', { type, contentLength: content.length });
    
    setIsGeneratingMindmap(true);
    setMindmapProgress(0);

    try {
      // Simulate progress steps
      setMindmapProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate mindmap data
      console.log('🧠 Generating mindmap data...');
      const generator = new MindmapGenerator();
      const mindmapData = generator.generateFromHeadings(content);
      
      setMindmapProgress(60);
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('✅ Mindmap data generated:', mindmapData);

      // Store in session for MindmapStudio2 to pick up
      sessionService.setMindmapData({
        nodes: mindmapData.nodes,
        connections: mindmapData.connections,
        metadata: {
          ...mindmapData.metadata,
          generationType: type,
          sourceDocument: currentDocument?.id || '',
          originalContent: content, // CRITICAL: Store original content for smart merge
        }
      });

      setMindmapProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Complete!
      setMindmapProgress(100);
      console.log('🎉 Mindmap generation complete!');

      // Wait a moment to show 100%, then close loading screen
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear URL params and show the mindmap
      const newUrl = location.pathname; // Remove query params
      navigate(newUrl, { replace: true });
      
      setIsGeneratingMindmap(false);
      setMindmapProgress(0);
    } catch (error) {
      console.error('❌ Mindmap generation failed:', error);
      setIsGeneratingMindmap(false);
      setMindmapProgress(0);
      alert('Failed to generate mindmap. Please try again.');
    }
  };

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
  
  // Handle content insertion from context files
  const handleInsertContent = (content: string) => {
    if (editorInstanceRef.current) {
      // Use TipTap editor instance to insert content
      editorInstanceRef.current.chain().focus().insertContent(`\n\n${content}\n\n`).run();
      console.log('✅ Content inserted into editor');
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(content);
      console.warn('⚠️ Editor instance not available, copied to clipboard');
    }
  };

  // Callback to receive live content updates from editors
  const handleContentChange = (content: string) => {
    setLiveEditorContent(content);
    
    // CRITICAL: Save to document!
    if (currentDocument) {
      // Only update if content actually changed to prevent infinite loop
      if (currentDocument.content !== content) {
        workspaceService.updateDocument(currentDocument.id, { content });
        // DON'T update currentDocument state here - it causes infinite loop!
        // The editor already has the latest content, no need to pass it back
      }
    }
  };

  // Helper function to scroll editor to specific text
  const scrollToTextInEditor = (searchText: string) => {
    // 🔧 FIX: Prevent overlapping scroll operations (race condition fix!)
    if (isScrollingRef.current) {
      console.log('⏸️ Already scrolling, ignoring click');
      return;
    }
    
    if (!editorInstanceRef.current) {
      console.warn('⚠️ Editor instance not available');
      return;
    }

    const editor = editorInstanceRef.current;
    console.log('🔍 Searching for:', searchText);
    
    // Set scrolling flag
    isScrollingRef.current = true;
    
    try {
      const { state } = editor;
      const { doc } = state;
      let found = false;
      let targetPos = 0;
      
      // Clean search text for better matching
      const cleanSearch = searchText.trim().toLowerCase();

      // 🔧 FIX: Only search heading nodes for better precision
      doc.descendants((node, pos) => {
        if (found) return false;
        
        // ONLY check heading nodes (outline items are always headings)
        if (node.type.name === 'heading') {
          const nodeText = node.textContent.trim().toLowerCase();
          
          // Try exact match first
          if (nodeText === cleanSearch) {
            targetPos = pos;
            found = true;
            console.log('✅ Found exact heading match:', node.textContent, 'at position:', targetPos);
            return false;
          }
          
          // If not exact, try if search text is contained in heading
          // But make sure it's a significant match (not just "a" matching "Chapter A")
          if (cleanSearch.length > 3 && nodeText.includes(cleanSearch)) {
            targetPos = pos;
            found = true;
            console.log('✅ Found heading containing:', cleanSearch, 'Full text:', node.textContent, 'at position:', targetPos);
            return false;
          }
        }
      });

      if (found) {  // 🔧 FIX: Allow targetPos = 0 (valid for first heading!)
        console.log('📍 Scrolling to position:', targetPos);
        
        // 🔧 FIX: More reliable scroll approach
        setTimeout(() => {
          try {
            // Focus editor first
            editor.commands.focus();
            
            // Get the DOM node at the target position
            const domNode = editor.view.domAtPos(targetPos);
            let element = domNode.node.nodeType === Node.ELEMENT_NODE 
              ? (domNode.node as HTMLElement) 
              : domNode.node.parentElement;
            
            // 🔧 FIX: Find the actual heading element - check CURRENT/CHILDREN first, not parents!
            if (element) {
              let headingElement: HTMLElement | null = null;
              
              // Strategy 1: Check if current element IS a heading
              if (element.tagName?.match(/^H[1-6]$/)) {
                headingElement = element;
              }
              
              // Strategy 2: Look for heading in immediate children
              if (!headingElement) {
                headingElement = element.querySelector('h1, h2, h3, h4, h5, h6');
              }
              
              // Strategy 3: Look in siblings (sometimes the text node is separate)
              if (!headingElement && element.parentElement) {
                for (const sibling of Array.from(element.parentElement.children)) {
                  if (sibling.tagName?.match(/^H[1-6]$/)) {
                    headingElement = sibling as HTMLElement;
                    break;
                  }
                }
              }
              
              // Strategy 4: Only as last resort, traverse up ONE level
              if (!headingElement && element.parentElement && element.parentElement.tagName?.match(/^H[1-6]$/)) {
                headingElement = element.parentElement;
              }
              
              // Use the heading element if found, otherwise fall back to original
              const targetElement = headingElement || element;
              console.log('📍 Found element:', targetElement.tagName, targetElement.textContent?.substring(0, 50));
              
              // Use native scrollIntoView with center positioning for best results
              targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
              });
              
              // Also set cursor position for visual feedback
              editor.commands.setTextSelection(targetPos);
              
              console.log('✅ Scroll completed to position:', targetPos);
              
              // 🔧 Reset scrolling flag after animation completes (smooth scroll takes ~500ms)
              setTimeout(() => {
                isScrollingRef.current = false;
                console.log('🔓 Scroll lock released');
              }, 600);
            } else {
              console.warn('⚠️ Could not find DOM element for position:', targetPos);
              isScrollingRef.current = false; // Reset on failure
            }
          } catch (scrollError) {
            console.error('❌ Scroll error:', scrollError);
            // Fallback: Try TipTap's built-in scroll
            try {
              editor.chain()
                .focus()
                .setTextSelection(targetPos)
                .scrollIntoView()
                .run();
              console.log('✅ Used fallback scroll');
              
              // Reset flag after fallback
              setTimeout(() => {
                isScrollingRef.current = false;
                console.log('🔓 Scroll lock released (fallback)');
              }, 600);
            } catch (fallbackError) {
              console.error('❌ Fallback scroll also failed:', fallbackError);
              isScrollingRef.current = false; // Reset on failure
            }
          }
        }, 100);
      } else {
        console.warn('❌ Could not find text:', searchText);
        isScrollingRef.current = false; // Reset on not found
      }
    } catch (error) {
      console.error('❌ Error scrolling to text:', error);
      isScrollingRef.current = false; // Reset on error
    }
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

            {/* Storage Warning */}
            {isDesktop ? (
              <div className="mb-8">
                <div className="mb-4 p-4 bg-primary/10 border-2 border-primary/30 rounded-lg">
                  <h2 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
                    💾 Important: Select a folder to save your documents!
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    Without selecting a folder, your documents will only be saved in browser memory and 
                    <strong className="text-foreground"> will be lost on refresh</strong>!
                  </p>
                </div>
                <DesktopWorkspaceSelector />
              </div>
            ) : (
              <div className="mb-8 p-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg">
                <h2 className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mb-2 flex items-center gap-2">
                  ⚠️ Web Mode: Documents stored in browser
                </h2>
                <p className="text-sm text-muted-foreground">
                  You're using the web version. Documents are saved in browser storage (localStorage).
                  <strong className="text-foreground"> They will be lost if you clear browser data!</strong>
                  <br />
                  <span className="text-xs mt-2 block">
                    💡 For permanent storage, use the desktop app (Tauri) and select a folder.
                  </span>
                </p>
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

      return (
        <WYSIWYGEditor
          key={currentDocument?.id} // Force re-render when document changes
          documentId={currentDocument?.id}
          documentTitle={currentDocument?.title || 'Untitled Document'}
          initialContent={currentDocument?.content || ''}
          onContentChange={handleContentChange}
          onTitleChange={(newTitle) => {
            if (currentDocument) {
              workspaceService.updateDocument(currentDocument.id, { title: newTitle });
              setCurrentDocument({ ...currentDocument, title: newTitle });
            }
          }}
          onEditorReady={(editor) => {
            editorInstanceRef.current = editor;
          }}
          contextFolders={contextFolders}
        />
      );
    }

    if (viewMode === 'mindmap') {
      // Show loading screen if generating
      if (isGeneratingMindmap) {
        const searchParams = new URLSearchParams(location.search);
        const type = searchParams.get('type') as 'mindmap' | 'flowchart' | 'orgchart' || 'mindmap';
        return <MindmapLoadingScreen type={type} progress={mindmapProgress} />;
      }
      
      // Show MindmapStudio2
      return <MindmapStudio2 />;
    }

    if (viewMode === 'slides') {
      return <PresentationEditor />;
    }

    return null;
  };

  return (
    <div className="flex h-screen bg-background relative">
      {/* Adaptive Sidebar - Hidden in Focus Mode */}
      {!focusMode && (
        <AdaptiveSidebar
          isEditingDocument={viewMode === 'edit' || viewMode === 'mindmap' || viewMode === 'slides'}
          documentContent={liveEditorContent || currentDocument?.content || ''}
          onHeadingClick={(text, line) => {
            console.log('📍 Scroll to:', text, 'at line', line);
            // Trigger scroll in editor by searching for the text
            if (editorInstanceRef.current) {
              scrollToTextInEditor(text);
            }
          }}
          currentLine={0}
          activeHeadingText={activeHeadingText || undefined}
          onDocumentSelect={handleDocumentSelect}
          onNewDocument={handleNewDocument}
          currentDocumentId={documentId}
          contextFolders={contextFolders}
          onContextFoldersChange={setContextFolders}
          onInsertContent={handleInsertContent}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}
      
      {/* Focus Mode Exit Button */}
      {focusMode && (
        <div className="fixed top-4 left-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFocusMode(false)}
            className="bg-background/80 backdrop-blur-sm hover:bg-background border-primary/20"
          >
            <span className="mr-2">✨</span>
            Exit Focus Mode
            <span className="ml-2 text-xs text-muted-foreground">(Cmd+Shift+F)</span>
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        {!focusMode && (
          <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-glow">MD Creator</h1>
            {currentDocument && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/</span>
                <input
                  type="text"
                  value={currentDocument.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setCurrentDocument({ ...currentDocument, title: newTitle });
                    workspaceService.updateDocument(currentDocument.id, { title: newTitle });
                  }}
                  className="text-sm font-medium bg-transparent border-none outline-none focus:ring-0 min-w-[200px] max-w-[400px]"
                  placeholder="Untitled Document"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
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
        )}

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
