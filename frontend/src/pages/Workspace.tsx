import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import type { Document } from '@/services/workspace/BackendWorkspaceService';
import { AdaptiveSidebar } from '@/components/workspace/AdaptiveSidebar';
import { QuickSwitcher } from '@/components/workspace/QuickSwitcher';
import { NewDocumentModal } from '@/components/workspace/NewDocumentModal';
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher';
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal';
import { DragDropZone } from '@/components/workspace/DragDropZone';
import { DesktopWorkspaceSelector } from '@/components/workspace/DesktopWorkspaceSelector';
import { SyncStatusIndicator } from '@/components/offline/SyncStatusIndicator';
import { WorkspaceHome } from '@/components/workspace/WorkspaceHome';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Sparkles, Presentation as PresentationIcon, User, Settings, LogOut, Clock, Database } from 'lucide-react';
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
import { VersionHistory } from '@/components/editor/VersionHistory';
// import { ConflictResolver } from '@/components/offline/ConflictResolver';
// import { useConflicts } from '@/hooks/useConflicts';

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
  
  // Auth state
  const { user, logout } = useAuth();
  
  // 🔥 Backend integration - Multi-Workspace Support
  const { 
    workspaces,
    currentWorkspace,
    createWorkspace,
    switchWorkspace,
    documents: backendDocuments,
    createDocument: backendCreateDocument,
    updateDocument: backendUpdateDocument,
    deleteDocument: backendDeleteDocument,
    getDocument: backendGetDocument,
    refreshDocuments,
    autoSaveDocument,
    isLoading: workspaceLoading,
  } = useWorkspace();

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
  
  // Conflict management (TODO: Enable after offline service is wired)
  // const { conflicts, hasConflicts, isResolving, resolveConflict, dismissConflict } = useConflicts(currentDocument?.id || null);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Ref to track LIVE editor content (not stored content) - using ref to avoid re-renders
  const liveEditorContentRef = React.useRef<string>('');

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
      const doc = backendGetDocument(documentId);
      if (doc) {
        setCurrentDocument(doc);
        // CRITICAL: Clear live editor content when loading new document
        liveEditorContentRef.current = doc.content || '';
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
      liveEditorContentRef.current = ''; // Clear content when no document
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
      const contentToUse = liveEditorContentRef.current || currentDocument.content;

      console.log('🧠 Mindmap mode detected:', {
        mode,
        type,
        contentLength: contentToUse.length,
        hasLiveContent: !!liveEditorContentRef.current,
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
  }, [viewMode, currentDocument, location.search]);

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
    const doc = backendGetDocument(docId);
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

  // Handle workspace creation
  const handleCreateWorkspace = async (data: { name: string; description: string; icon: string }) => {
    try {
      console.log('🏢 Creating new workspace:', data.name);
      const newWorkspace = await createWorkspace(data);
      console.log('✅ Workspace created and switched:', newWorkspace.name);
      // Navigation stays on same page, just workspace changes
    } catch (error) {
      console.error('❌ Failed to create workspace:', error);
      throw error;
    }
  };

  // Handle workspace switch
  const handleSwitchWorkspace = async (workspace: any) => {
    try {
      console.log('🔄 Switching to workspace:', workspace.name);
      await switchWorkspace(workspace);
      
      // Navigate to home when switching workspaces
      navigate('/workspace');
      
      console.log('✅ Switched to workspace:', workspace.name);
    } catch (error) {
      console.error('❌ Failed to switch workspace:', error);
    }
  };

  // Load demo presentation with all beautiful blocks
  const handleLoadDemoPresentation = async () => {
    console.log('🎨 Loading demo presentation...');

    try {
      // Save demo presentation to workspace
      const doc = await backendCreateDocument(
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
      const editorContent = liveEditorContentRef.current || currentDocument.content;
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
      const doc = await backendCreateDocument(
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
  const handleContentChange = React.useCallback((content: string) => {
    // Only save if content actually changed compared to what we already have in editor
    if (liveEditorContentRef.current === content) {
      return; // No change, skip
    }
    
    liveEditorContentRef.current = content; // Update ref instead of state to avoid re-renders!

    // Auto-save to backend (debounced)
    if (currentDocument) {
      autoSaveDocument(currentDocument.id, content);
    }
  }, [currentDocument, autoSaveDocument]);

  // Callback to handle title changes (memoized to prevent infinite loops)
  const handleTitleChange = React.useCallback((newTitle: string) => {
    if (currentDocument) {
      backendUpdateDocument(currentDocument.id, { title: newTitle });
      setCurrentDocument({ ...currentDocument, title: newTitle });
    }
  }, [currentDocument, backendUpdateDocument]);

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
          documents={backendDocuments}
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
          onTitleChange={handleTitleChange}
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
          documentContent={liveEditorContentRef.current || currentDocument?.content || ''}
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
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-glow">MD Creator</h1>
              
              {/* Workspace Switcher */}
              {currentWorkspace && workspaces.length > 0 && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <WorkspaceSwitcher
                    workspaces={workspaces}
                    currentWorkspace={currentWorkspace}
                    onSwitch={handleSwitchWorkspace}
                    onCreate={() => setShowCreateWorkspaceModal(true)}
                  />
                </>
              )}
              
              {currentDocument && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <input
                    type="text"
                    value={currentDocument.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setCurrentDocument({ ...currentDocument, title: newTitle });
                      backendUpdateDocument(currentDocument.id, { title: newTitle });
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
                        {viewMode === 'slides' && '📊 Presentation'}
                        {viewMode === 'present' && '🎬 Presenting'}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Sync Status Indicator */}
              <SyncStatusIndicator />
              
              {/* Version History Button - Only show when editing */}
              {currentDocument && viewMode === 'edit' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  <span className="hidden md:inline">History</span>
                </Button>
              )}

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

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                        {(user.full_name?.[0] || user.username?.[0] || 'U').toUpperCase()}
                      </div>
                      <span className="hidden md:inline">{user.full_name || user.username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.full_name || user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        if (confirm('⚠️ This will delete ALL offline data and refresh the page. Continue?')) {
                          try {
                            // Delete IndexedDB
                            await indexedDB.deleteDatabase('MDReaderOfflineDB');
                            console.log('✅ Offline database deleted');
                            
                            // Reload page
                            window.location.reload();
                          } catch (error) {
                            console.error('❌ Failed to reset offline data:', error);
                            alert('Failed to reset offline data. Check console for details.');
                          }
                        }
                      }}
                      className="text-orange-600 focus:text-orange-600"
                    >
                      <Database className="mr-2 h-4 w-4" />
                      Reset Offline Data
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        await logout();
                        navigate('/login');
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="hidden md:inline-flex"
                >
                  Log in
                </Button>
              )}

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
        createDocument={backendCreateDocument}
      />

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        open={showCreateWorkspaceModal}
        onClose={() => setShowCreateWorkspaceModal(false)}
        onCreate={handleCreateWorkspace}
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

      {/* Drag-and-Drop Zone */}
      <DragDropZone />

      {/* Version History Panel */}
      {showVersionHistory && currentDocument && (
        <div className="fixed right-0 top-0 h-full z-40">
          <VersionHistory
            documentId={currentDocument.id}
            currentVersion={currentDocument.metadata?.version || 1}
            onRestore={async (versionNumber) => {
              // Refresh document after restore
              await refreshDocuments();
              const restored = backendGetDocument(currentDocument.id);
              if (restored) {
                setCurrentDocument(restored);
              }
            }}
            onClose={() => setShowVersionHistory(false)}
          />
        </div>
      )}
    </div>
  );
}
