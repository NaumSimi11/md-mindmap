import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { workspaceService, Document } from '@/services/workspace/WorkspaceService';
import { AdaptiveSidebar } from '@/components/workspace/AdaptiveSidebar';
import { QuickSwitcher } from '@/components/workspace/QuickSwitcher';
import { NewDocumentModal } from '@/components/workspace/NewDocumentModal';
import { DesktopWorkspaceSelector } from '@/components/workspace/DesktopWorkspaceSelector';
import { WorkspaceHome } from '@/components/workspace/WorkspaceHome';
import { Button } from '@/components/ui/button';
import { Plus, Search, Sparkles, Presentation as PresentationIcon } from 'lucide-react';
import { getGuestCredits } from '@/lib/guestCredits';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { usePlatform } from '@/contexts/PlatformContext';
import { MindmapLoadingScreen } from '@/components/mindmap/MindmapLoadingScreen';
import MindmapGenerator from '@/services/MindmapGenerator';
import { sessionService } from '@/services/EditorStudioSession';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { PresentationWizardModal, type GenerationSettings } from '@/components/presentation/PresentationWizardModal';
import { PresentationLoadingScreen } from '@/components/presentation/PresentationLoadingScreen';
import { safePresentationService, type ProgressUpdate } from '@/services/presentation/SafePresentationService';
import { DEMO_PRESENTATION } from '@/data/demoPresentation';

// Import document editors
import { WYSIWYGEditor } from '@/components/editor/WYSIWYGEditor';
import MindmapStudio2 from './MindmapStudio2';
import PresentationEditor from './PresentationEditor';
import PresenterMode from './PresenterMode';

type ViewMode = 'home' | 'edit' | 'mindmap' | 'slides' | 'present';

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
  // /workspace/doc/:id/present → present mode (full-screen)
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

  // Presentation wizard & progress
  const [showPresentationWizard, setShowPresentationWizard] = useState(false);
  const [showPresentationProgress, setShowPresentationProgress] = useState(false);
  const [presentationProgress, setPresentationProgress] = useState<ProgressUpdate | null>(null);
  const [presentationError, setPresentationError] = useState<string | null>(null);

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

  // Load demo presentation with all beautiful blocks
  const handleLoadDemoPresentation = async () => {
    console.log('🎨 Loading demo presentation...');

    try {
      // Save demo presentation to workspace
      const doc = await workspaceService.createDocument(
        'presentation',
        'Beautiful Blocks Showcase',
        JSON.stringify(DEMO_PRESENTATION)
      );

      console.log('✅ Demo presentation created:', doc.id);

      // Navigate to presentation editor
      navigate(`/workspace/doc/${doc.id}/slides`);
    } catch (error) {
      console.error('❌ Failed to load demo:', error);
      alert('Failed to load demo presentation');
    }
  };

  // Generate presentation from editor
  const handleGeneratePresentation = async (settings: GenerationSettings) => {
    console.log('🎬 Generating presentation from editor with settings:', settings);

    if (!currentDocument) return;

    // 🔧 CLEAR OLD SESSION KEYS (from old Editor.tsx flow)
    localStorage.removeItem('presentation-session');
    const oldKeys = Object.keys(localStorage).filter(key =>
      key.startsWith('editor-pres-session-') ||
      key.startsWith('mindmap-pres-session-')
    );
    oldKeys.forEach(key => localStorage.removeItem(key));
    console.log('🧹 Cleared old session keys:', oldKeys.length);

    // Close wizard, show progress
    setShowPresentationWizard(false);
    setShowPresentationProgress(true);
    setPresentationProgress(null);
    setPresentationError(null);

    try {
      const editorContent = liveEditorContent || currentDocument.content;
      console.log('📝 Editor content length:', editorContent.length);

      console.log('🤖 Calling safe presentation service...');
      const presentation = await safePresentationService.generateSafely(
        editorContent,
        null, // No mindmap data from editor
        settings,
        currentDocument.id, // ✅ Pass source document ID
        (progress: ProgressUpdate) => {
          console.log('📊 Progress:', progress);
          setPresentationProgress(progress);
        }
      );

      console.log('✅ Presentation generated:', presentation);

      // Save presentation to workspace
      console.log('💾 Saving presentation to workspace...');
      const doc = await workspaceService.createDocument(
        'presentation',
        `${currentDocument.title} - Presentation`,
        JSON.stringify(presentation)
      );
      console.log('✅ Presentation saved:', doc.id);

      // Wait a moment to show success, then navigate
      setTimeout(() => {
        setShowPresentationProgress(false);
        navigate(`/workspace/doc/${doc.id}/slides`);
      }, 1500);
    } catch (error: any) {
      console.error('❌ Failed to generate presentation:', error);
      setPresentationError(error.message || 'Failed to generate presentation');

      // Auto-close error after 5 seconds
      setTimeout(() => {
        setShowPresentationProgress(false);
        setPresentationError(null);
      }, 5000);
    }
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

  // Helper function to scroll editor to specific heading by index
  const scrollToHeading = (headingIndex: number) => {
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
    console.log('🔍 Scrolling to heading index:', headingIndex);

    // Set scrolling flag
    isScrollingRef.current = true;

    try {
      const { state } = editor;
      const { doc } = state;
      let currentHeadingIndex = 0;
      let targetPos = -1;

      // Find the Nth heading node
      doc.descendants((node, pos) => {
        if (targetPos !== -1) return false;

        if (node.type.name === 'heading') {
          if (currentHeadingIndex === headingIndex) {
            targetPos = pos;
            console.log('✅ Found target heading at position:', targetPos, 'Text:', node.textContent);
            return false;
          }
          currentHeadingIndex++;
        }
      });

      if (targetPos !== -1) {
        console.log('📍 Scrolling to position:', targetPos);

        setTimeout(() => {
          try {
            // Focus editor first
            editor.commands.focus();

            // Get the DOM node at the target position
            const domNode = editor.view.domAtPos(targetPos);
            let element = domNode.node.nodeType === Node.ELEMENT_NODE
              ? (domNode.node as HTMLElement)
              : domNode.node.parentElement;

            // Find the actual heading element
            if (element) {
              let headingElement: HTMLElement | null = null;

              // Strategy 1: Check if current element IS a heading
              if ((element as HTMLElement).tagName?.match(/^H[1-6]$/)) {
                headingElement = element as HTMLElement;
              }

              // Strategy 2: Look for heading in immediate children
              if (!headingElement) {
                headingElement = element.querySelector('h1, h2, h3, h4, h5, h6');
              }

              // Strategy 3: Look in siblings
              if (!headingElement && element.parentElement) {
                for (const sibling of Array.from(element.parentElement.children)) {
                  if ((sibling as HTMLElement).tagName?.match(/^H[1-6]$/)) {
                    headingElement = sibling as HTMLElement;
                    break;
                  }
                }
              }

              // Use the heading element if found, otherwise fall back to original
              const targetElement = headingElement || element;

              // Use native scrollIntoView with top positioning
              targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
              });

              // Set cursor position
              editor.commands.setTextSelection(targetPos);

              // Reset scrolling flag
              setTimeout(() => {
                isScrollingRef.current = false;
                console.log('🔓 Scroll lock released');
              }, 600);
            } else {
              // Fallback to TipTap scroll
              editor.chain().focus().setTextSelection(targetPos).scrollIntoView().run();
              setTimeout(() => isScrollingRef.current = false, 600);
            }
          } catch (scrollError) {
            console.error('❌ Scroll error:', scrollError);
            isScrollingRef.current = false;
          }
        }, 50); // Small delay to ensure UI is ready
      } else {
        console.warn('❌ Could not find heading at index:', headingIndex);
        isScrollingRef.current = false;
      }
    } catch (error) {
      console.error('❌ Error scrolling to heading:', error);
      isScrollingRef.current = false;
    }
  };

  // Render appropriate editor based on view mode
  const renderMainContent = () => {
    if (viewMode === 'home') {
      return (
        <WorkspaceHome
          onDocumentSelect={handleDocumentSelect}
          onNewDocument={handleNewDocument}
          onLoadDemo={handleLoadDemoPresentation}
        />
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

    if (viewMode === 'present') {
      // Full-screen presenter mode - no sidebar
      return <PresenterMode />;
    }

    return null;
  };

  return (
    <div className="flex h-screen bg-background relative">
      {/* Adaptive Sidebar - Hidden in Focus Mode and Presenter Mode */}
      {!focusMode && viewMode !== 'present' && (
        <AdaptiveSidebar
          isEditingDocument={viewMode === 'edit' || viewMode === 'mindmap' || viewMode === 'slides'}
          documentContent={liveEditorContent || currentDocument?.content || ''}
          onHeadingClick={(text, line, headingIndex) => {
            console.log('📍 Scroll to heading index:', headingIndex, 'Text:', text);
            // Trigger scroll in editor by index (more reliable)
            if (editorInstanceRef.current && headingIndex !== undefined) {
              scrollToHeading(headingIndex);
            }
          }}
          currentLine={0}
          activeHeadingText={activeHeadingText || undefined}
          onDocumentSelect={handleDocumentSelect}
          onNewDocument={handleNewDocument}
          currentDocumentId={documentId}
          contextFolders={contextFolders}
          onLoadDemo={handleLoadDemoPresentation}
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
          <header className="flex items-center justify-between px-6 py-4 bg-card/30 backdrop-blur-sm mb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-glow">MD Creator</h1>
              {currentDocument && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <input
                    type="text"
                    value={currentDocument.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setCurrentDocument({ ...currentDocument, title: newTitle });
                      workspaceService.updateDocument(currentDocument.id, { title: newTitle });
                    }}
                    className="text-sm font-medium bg-transparent border-none outline-none focus:ring-0 min-w-[200px] max-w-[400px] hover:bg-muted/30 px-2 py-1 rounded transition-colors"
                    placeholder="Untitled Document"
                  />

                  {/* View Mode Indicator */}
                  {viewMode && viewMode !== 'home' && (
                    <>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-sm font-medium text-primary px-2 py-1 rounded-md bg-primary/10">
                        {viewMode === 'edit' && '✍️ Editor'}
                        {viewMode === 'mindmap' && '🧠 Mindmap'}
                        {viewMode === 'presentation' && '📊 Presentation'}
                      </span>
                    </>
                  )}
                </>
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

      {/* Presentation Wizard */}
      <PresentationWizardModal
        open={showPresentationWizard}
        onOpenChange={setShowPresentationWizard}
        onGenerate={handleGeneratePresentation}
      />

      {/* Full-Screen Presentation Loading */}
      {showPresentationProgress && (
        <PresentationLoadingScreen progress={presentationProgress} />
      )}
    </div>
  );
}
