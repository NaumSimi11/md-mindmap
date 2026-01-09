import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import type { DocumentMeta as Document } from '@/services/workspace/types';
import type { WebsocketProvider } from 'y-websocket';
import { AdaptiveSidebar } from '@/components/workspace/AdaptiveSidebar';
import { QuickSwitcher } from '@/components/workspace/QuickSwitcher';
import { PresenceList } from '@/components/collaboration/PresenceList';
import { NewDocumentModal } from '@/components/workspace/NewDocumentModal';
// import { SyncModeToggle } from '@/components/workspace/SyncModeToggle';
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal';
import { RenameWorkspaceDialog } from '@/components/workspace/RenameWorkspaceDialog';
import { DragDropZone } from '@/components/workspace/DragDropZone';
import { DesktopWorkspaceSelector } from '@/components/workspace/DesktopWorkspaceSelector';
// import { SyncStatusIndicator } from '@/components/offline/SyncStatusIndicator'; // ⚠️ REMOVED - Now in WYSIWYGEditor
import { WorkspaceHome } from '@/components/workspace/WorkspaceHome';
import { FileWatcherIndicator } from '@/components/workspace/FileWatcherIndicator';
// CollaborationSidebar removed - not implemented yet
import { QuickSwitcherModal } from '@/components/workspace/QuickSwitcherModal';
import { WorkspaceMembersModal } from '@/components/workspace/WorkspaceMembersModal';
import { useQuickSwitcher } from '@/hooks/useQuickSwitcher';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Sparkles, Presentation as PresentationIcon, User, Settings, LogOut, Clock, Database, X } from 'lucide-react';
import { getGuestCredits } from '@/lib/guestCredits';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { usePlatform } from '@/contexts/PlatformContext';
import { MindmapLoadingScreen } from '@/components/mindmap/MindmapLoadingScreen';
import MindmapGenerator from '@/services/MindmapGenerator';
import { sessionService } from '@/services/EditorStudioSession';
import { yjsDocumentManager } from '@/services/yjs/YjsDocumentManager';
import { serializeYjsToHtml } from '@/services/snapshots/serializeYjs';
import { htmlToMarkdown } from '@/utils/markdownConversion';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { PresentationWizardModal, type GenerationSettings } from '@/components/presentation/PresentationWizardModal';
import { PresentationLoadingScreen } from '@/components/presentation/PresentationLoadingScreen';
import { safePresentationService, type ProgressUpdate } from '@/services/presentation/SafePresentationService';
import { DEMO_PRESENTATION } from '@/data/demoPresentation';
import { VersionHistory } from '@/components/editor/VersionHistory';
// import { ConflictResolver } from '@/components/offline/ConflictResolver';
// import { useConflicts } from '@/hooks/useConflicts';

// Import document editors
import { YjsEditor } from '@/components/editor/YjsEditor';
import { WYSIWYGEditor } from '@/components/editor/WYSIWYGEditor';
import { EditorErrorBoundary } from '@/components/errors/EditorErrorBoundary';
import { SidebarErrorBoundary } from '@/components/errors/SidebarErrorBoundary';
import MindmapStudio2 from './MindmapStudio2';
import PresentationEditor from './PresentationEditor';
import PresenterMode from './PresenterMode';

type ViewMode = 'home' | 'edit' | 'mindmap' | 'slides' | 'present';

export default function Workspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDesktop } = usePlatform();
  const { remaining, total } = getGuestCredits();
  const { isOpen: isQuickSwitcherOpen, close: closeQuickSwitcher } = useQuickSwitcher();
  
  // Auth state
  const { user, logout } = useAuth();
  const { toast } = useToast();

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


  // NOTE: This page still straddles legacy + new workspace types. Until the migration is complete,
  // keep the runtime shape flexible here to avoid type-level churn blocking UX fixes.
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  
  // Conflict management (TODO: Enable after offline service is wired)
  // const { conflicts, hasConflicts, isResolving, resolveConflict, dismissConflict } = useConflicts(currentDocument?.id || null);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [showRenameWorkspaceDialog, setShowRenameWorkspaceDialog] = useState(false);
  const [showWorkspaceMembers, setShowWorkspaceMembers] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Auto-collapse sidebar on small screens (< 1024px) on initial load
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });
  const [focusMode, setFocusMode] = useState(false);
  
  // Auto-collapse sidebar on window resize
  useEffect(() => {
    const handleResize = () => {
      // Auto-collapse on screens smaller than 1024px (lg breakpoint)
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
      // Don't auto-expand - let user control that manually
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  // Collaboration sidebar removed - not implemented yet
  const [activityEvents, setActivityEvents] = useState<any[]>([]);
  const [websocketProvider, setWebsocketProvider] = useState<WebsocketProvider | null>(null);

  // 🔥 CHANGED: Use STATE instead of REF so sidebar re-renders when content changes!
  const [liveEditorContent, setLiveEditorContent] = React.useState<string>('');
  // Outline content should be derived from the *live editor doc structure*, not from cached markdown.
  // We keep it lightweight: only headings (as markdown `#` lines) so the Outline is always in sync.
  const [liveOutlineContent, setLiveOutlineContent] = React.useState<string>('');
  const outlineCleanupRef = React.useRef<null | (() => void)>(null);
  const outlineRafRef = React.useRef<number | null>(null);

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
    // 🔥 FIX: Wait for workspace to finish loading before attempting to fetch document
    if (documentId && workspaceLoading) {
      return;
    }

    // 🔥 FIX: Ensure service is initialized before calling
    if (!backendGetDocument) {
      return;
    }

    if (documentId && currentWorkspace) {
      // 🔥 SAFETY: Small delay to ensure service is fully initialized
      const timeoutId = setTimeout(() => {
        // 🔥 FIX: getDocument is now async - must await it
        backendGetDocument(documentId).then(doc => {
        if (doc) {
          // 🚀 NEW: Check if this is a guest doc with cloud mapping
          const redirectToCloudId = (doc as any).__redirectToCloudId;
          if (redirectToCloudId && redirectToCloudId !== documentId) {
            // Redirect to cloud ID (this will enable WebSocket!)
            const currentPath = location.pathname;
            const newPath = currentPath.replace(documentId, redirectToCloudId);
            navigate(newPath, { replace: true });
            return; // Don't set currentDocument, let the redirect handle it
          }

          setCurrentDocument(doc);
          // CRITICAL: Clear live editor content when loading new document
          setLiveEditorContent(doc.content || '');
        } else {
          console.error('❌ [Workspace] Document NOT found:', documentId);
          // Document not found, go home
          navigate('/workspace');
        }
        }).catch(err => {
          console.error('❌ [Workspace] Error loading document:', err);
          navigate('/workspace');
        });
      }, 150); // 150ms delay to ensure service is ready

      return () => clearTimeout(timeoutId);
    } else if (!documentId) {
      setCurrentDocument(null);
      setLiveEditorContent(''); // Clear content when no document
    }
  }, [documentId, workspaceLoading, currentWorkspace?.id]); // FIX: Use .id to prevent infinite loop from object reference changes

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  // 🔥 BUG FIX #3: Listen for document-pushed-to-cloud event and reload if currently viewing
  useEffect(() => {
    const handleDocumentPushed = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { documentId: pushedDocId, message } = customEvent.detail;
      
      // If this is the document currently being viewed, reload it
      if (documentId === pushedDocId) {
        // Show success toast
        toast({
          title: "✅ Document synced to cloud!",
          description: "Reloading fresh content...",
          duration: 2000,
        });

        // Navigate away briefly then back to force fresh load
        const currentPath = location.pathname;
        navigate('/workspace');

        // Navigate back after a short delay to ensure cleanup
        setTimeout(() => {
          navigate(currentPath);
        }, 100);
      }
    };
    
    window.addEventListener('document-pushed-to-cloud', handleDocumentPushed);
    return () => window.removeEventListener('document-pushed-to-cloud', handleDocumentPushed);
  }, [documentId, toast]);

  // Handle mindmap generation from URL params
  useEffect(() => {
    if (viewMode === 'mindmap' && currentDocument) {
      const searchParams = new URLSearchParams(location.search);
      const mode = searchParams.get('mode');
      const type = searchParams.get('type') as 'mindmap' | 'flowchart' | 'orgchart';

      // 🔥 FIX: Get LIVE content directly from Yjs document (source of truth)
      // The previous approach using `liveEditorContent` state was stale because it wasn't
      // wired to live Yjs edits. Now we extract directly from Yjs.
      let contentToUse = '';
      
      try {
        // Normalize document ID (same as useYjsDocument.ts) to find the right Yjs instance
        const normalizedDocId = currentDocument.id.startsWith('doc_') 
          ? currentDocument.id.slice(4) 
          : currentDocument.id;
        
        const yjsInstance = yjsDocumentManager.getDocumentInstance(normalizedDocId);
        if (yjsInstance?.ydoc) {
          const html = serializeYjsToHtml(yjsInstance.ydoc);
          if (html) {
            contentToUse = htmlToMarkdown(html);
          }
        } else {
          console.warn('⚠️ [Mindmap] No Yjs instance found for:', normalizedDocId);
        }
      } catch (err) {
        console.warn('⚠️ [Mindmap] Failed to get content from Yjs, falling back:', err);
      }
      
      // Fallback to stored content if Yjs extraction failed
      if (!contentToUse) {
        contentToUse = liveEditorContent || currentDocument.content || '';
      }

      // Mindmap mode detected

      if (mode === 'generate' && type && contentToUse) {
        // Start AI generation with LIVE content
        generateMindmap(contentToUse, type);
      } else if (mode === 'generate' && type && !contentToUse) {
        console.error('❌ No content available to generate mindmap!');
        alert('Please add some content to your document before generating a mindmap.');
        navigate(location.pathname, { replace: true }); // Clear params
      }
    }
  }, [viewMode, currentDocument]);

  // Generate mindmap from content
  const generateMindmap = async (content: string, type: 'mindmap' | 'flowchart' | 'orgchart') => {

    setIsGeneratingMindmap(true);
    setMindmapProgress(0);

    try {
      // Simulate progress steps
      setMindmapProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate mindmap data
      const generator = new MindmapGenerator();
      const mindmapData = generator.generateFromHeadings(content);

      setMindmapProgress(60);
      await new Promise(resolve => setTimeout(resolve, 500));

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
  const handleDocumentSelect = async (docId: string) => {
    // 🔥 FIX: getDocument is now async
    const doc = await backendGetDocument(docId);
    
    if (!doc) {
      console.error('❌ Document not found in context:', docId);
      // 🔥 FIX: Navigate anyway (document exists in localStorage/IndexedDB)
      navigate(`/workspace/doc/${docId}/edit`);
      return;
    }


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
    setShowNewDocModal(true);
  };

  // Handle workspace creation
  const handleCreateWorkspace = async (data: { name: string; description: string; icon: string }) => {
    try {
      const newWorkspace = await createWorkspace(data);
      
      // 🔥 Navigate to workspace root (clear document view)
      navigate('/workspace');
    } catch (error) {
      console.error('❌ Failed to create workspace:', error);
      throw error;
    }
  };

  // Handle workspace switch
  const handleSwitchWorkspace = async (workspace: any) => {
    try {
      await switchWorkspace(workspace);
      
      // Navigate to home when switching workspaces
      navigate('/workspace');
      
    } catch (error) {
      console.error('❌ Failed to switch workspace:', error);
    }
  };

  // Load demo presentation with all beautiful blocks
  const handleLoadDemoPresentation = async () => {

    try {
      // Save demo presentation to workspace
      const doc = await backendCreateDocument(
        'presentation',
        'Beautiful Blocks Showcase',
        JSON.stringify(DEMO_PRESENTATION)
      );

      // Navigate to presentation editor
      navigate(`/workspace/doc/${doc.id}/slides`);
    } catch (error) {
      console.error('❌ Failed to load demo:', error);
      alert('Failed to load demo presentation');
    }
  };

  // Generate presentation from editor
  const handleGeneratePresentation = async (settings: GenerationSettings) => {

    if (!currentDocument) return;

    // 🔧 CLEAR OLD SESSION KEYS (from old Editor.tsx flow)
    localStorage.removeItem('presentation-session');
    const oldKeys = Object.keys(localStorage).filter(key =>
      key.startsWith('editor-pres-session-') ||
      key.startsWith('mindmap-pres-session-')
    );
    oldKeys.forEach(key => localStorage.removeItem(key));

    // Close wizard, show progress
    setShowPresentationWizard(false);
    setShowPresentationProgress(true);
    setPresentationProgress(null);
    setPresentationError(null);

    try {
      const editorContent = liveEditorContent || currentDocument.content;

      const presentation = await safePresentationService.generateSafely(
        editorContent,
        null, // No mindmap data from editor
        settings,
        currentDocument.id, // ✅ Pass source document ID
        (progress: ProgressUpdate) => {
          setPresentationProgress(progress);
        }
      );

      // Save presentation to workspace
      const doc = await backendCreateDocument(
        'presentation',
        `${currentDocument.title} - Presentation`,
        JSON.stringify(presentation)
      );

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

  const handleDocumentCreated = (docId: string, doc?: any) => {
    
    // If we have the document object, use it directly (avoids race condition)
    if (doc) {
      setCurrentDocument(doc);
      // Navigate to edit mode (viewMode is derived from URL)
      navigate(`/workspace/doc/${docId}/edit`);
    } else {
      // Fallback: select by ID (will search in state)
      handleDocumentSelect(docId);
    }
  };

  // Handle content insertion from context files
  const handleInsertContent = (content: string) => {
    if (editorInstanceRef.current) {
      // Use TipTap editor instance to insert content
      editorInstanceRef.current.chain().focus().insertContent(`\n\n${content}\n\n`).run();
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(content);
      console.warn('⚠️ Editor instance not available, copied to clipboard');
    }
  };

  // Callback to receive live content updates from editors
  const handleContentChange = React.useCallback((content: string) => {
    // Only save if content actually changed
    setLiveEditorContent(prev => {
      if (prev === content) return prev; // No change, skip
      return content;
    });

    // Auto-save to backend (debounced)
    if (currentDocument) {
      // DEBUG: Log actual content being passed to save
      autoSaveDocument(currentDocument.id, content);
    }
  }, [currentDocument, autoSaveDocument]);

  // Derive outline from TipTap document structure (heading nodes), matching `scrollToHeading()` indexing.
  const computeOutlineMarkdownFromEditor = React.useCallback((editor: any): string => {
    try {
      const { doc } = editor.state;
      const lines: string[] = [];
      doc.descendants((node: any) => {
        if (node.type?.name === 'heading') {
          const level = Math.min(6, Math.max(1, Number(node.attrs?.level || 1)));
          const text = String(node.textContent || '').trim();
          if (text) lines.push(`${'#'.repeat(level)} ${text}`);
        }
      });
      return lines.join('\n');
    } catch {
      return '';
    }
  }, []);

  // Attach/detach outline sync listeners cleanly across doc switches.
  const handleEditorReady = React.useCallback((editor: any) => {
    editorInstanceRef.current = editor;

    // Cleanup any prior listeners
    outlineCleanupRef.current?.();
    outlineCleanupRef.current = null;

    const updateOutline = () => {
      if (outlineRafRef.current) cancelAnimationFrame(outlineRafRef.current);
      outlineRafRef.current = requestAnimationFrame(() => {
        setLiveOutlineContent(computeOutlineMarkdownFromEditor(editor));
      });
    };

    // Initial populate + live updates
    updateOutline();
    editor.on?.('update', updateOutline);

    outlineCleanupRef.current = () => {
      try {
        editor.off?.('update', updateOutline);
      } catch {
        // no-op
      }
      if (outlineRafRef.current) cancelAnimationFrame(outlineRafRef.current);
      outlineRafRef.current = null;
    };
  }, [computeOutlineMarkdownFromEditor]);

  // Ensure listeners are cleaned up if Workspace unmounts.
  React.useEffect(() => {
    return () => outlineCleanupRef.current?.();
  }, []);

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
      return;
    }

    if (!editorInstanceRef.current) {
      console.warn('⚠️ Editor instance not available');
      return;
    }

    const editor = editorInstanceRef.current;

    // Set scrolling flag
    isScrollingRef.current = true;

    try {
      const { state } = editor;
      const { doc } = state;
      let currentHeadingIndex = 0;
      let targetPos = -1;

      // 🔍 DEBUG: Log all node types in document
      const allNodes: Array<{type: string, text: string, pos: number}> = [];
      doc.descendants((node, pos) => {
        allNodes.push({
          type: node.type.name,
          text: node.textContent.substring(0, 50),
          pos
        });
      });

      // Find the Nth heading node
      doc.descendants((node, pos) => {
        if (targetPos !== -1) return false;

        if (node.type.name === 'heading') {
          if (currentHeadingIndex === headingIndex) {
            targetPos = pos;
            return false;
          }
          currentHeadingIndex++;
        }
      });

      if (targetPos !== -1) {

        setTimeout(() => {
          try {
            // 🔥 NEW APPROACH: Use TipTap's built-in scrollIntoView + manual offset adjustment
            
            // 1. Set cursor position first
            editor.commands.setTextSelection(targetPos);
            
            // 2. Focus editor
            editor.commands.focus();
            
            // 3. Get the DOM element for manual scrolling
            const domNode = editor.view.domAtPos(targetPos);
            let element = domNode.node.nodeType === Node.ELEMENT_NODE
              ? (domNode.node as HTMLElement)
              : domNode.node.parentElement;

            // Find the actual heading element
            let headingElement: HTMLElement | null = null;
            
            if (element) {
              // Check if current element IS a heading
              if ((element as HTMLElement).tagName?.match(/^H[1-6]$/)) {
                headingElement = element as HTMLElement;
              }
              
              // Look for heading in children
              if (!headingElement) {
                headingElement = element.querySelector('h1, h2, h3, h4, h5, h6');
              }
              
              // Look in siblings
              if (!headingElement && element.parentElement) {
                for (const sibling of Array.from(element.parentElement.children)) {
                  if ((sibling as HTMLElement).tagName?.match(/^H[1-6]$/)) {
                    headingElement = sibling as HTMLElement;
                    break;
                  }
                }
              }
            }

            const targetElement = headingElement || element;

            if (targetElement) {
              // 4. Scroll with proper offset (accounting for header/toolbar)
              const headerOffset = 120; // Adjust this based on your header height
              const elementPosition = targetElement.getBoundingClientRect().top;
              const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

              // Find the scrollable container (ProseMirror's parent)
              const scrollContainer = targetElement.closest('.overflow-auto, .overflow-y-auto') 
                || document.querySelector('.flex-1.overflow-auto') // Main content area
                || window;

              if (scrollContainer && scrollContainer !== window) {
                // Scroll within container
                (scrollContainer as HTMLElement).scrollTo({
                  top: targetElement.offsetTop - headerOffset,
                  behavior: 'smooth'
                });
              } else {
                // Scroll window
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
              }

            }

            // Reset scrolling flag
            setTimeout(() => {
              isScrollingRef.current = false;
            }, 600);
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
          documents={backendDocuments as any}
          createDocument={backendCreateDocument}
        />
      );
    }

    if (viewMode === 'edit') {
      // 🔥 Always use WYSIWYGEditor (now with Yjs integration)
      return (
        <EditorErrorBoundary documentId={currentDocument?.id}>
          <WYSIWYGEditor
            key={currentDocument?.id}
            documentId={currentDocument?.id}
            documentTitle={currentDocument?.title || 'Untitled Document'}
            // ❌ STEP 4: Removed initialContent (hydration in WorkspaceContext)
            // ❌ STEP 1: Removed onContentChange (no auto-save)
            onTitleChange={handleTitleChange}
            onEditorReady={handleEditorReady}
            contextFolders={contextFolders}
            documentSyncStatus={currentDocument?.syncStatus}
            documentCloudId={currentDocument?.cloudId}
          />
        </EditorErrorBoundary>
      );
    }

    if (viewMode === 'mindmap') {
   

      // Wait for document to load before showing mindmap
      if (!currentDocument && documentId) {
        return (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading mindmap...</p>
            </div>
          </div>
        );
      }

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
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* Adaptive Sidebar - Hidden in Focus Mode, Presenter Mode, and Mindmap Mode */}
      {!focusMode && viewMode !== 'present' && viewMode !== 'mindmap' && (
        <SidebarErrorBoundary>
          <AdaptiveSidebar
            isEditingDocument={viewMode === 'edit' || viewMode === 'slides'}
            // Outline reads only heading structure; keep it synced to the live editor doc.
            documentContent={liveOutlineContent || currentDocument?.content || ''}
            onHeadingClick={(text, line, headingIndex) => {
              // Trigger scroll in editor by index (more reliable)
              if (editorInstanceRef.current && headingIndex !== undefined) {
                scrollToHeading(headingIndex);
              } else {
                console.warn('⚠️ Cannot scroll: editor not ready or headingIndex undefined', {
                  hasEditor: !!editorInstanceRef.current,
                  headingIndex,
                });
              }
            }}
            currentLine={0}
            activeHeadingText={activeHeadingText || undefined}
            onDocumentSelect={handleDocumentSelect}
            onNewDocument={handleNewDocument}
            currentDocumentId={documentId}
            workspaces={workspaces as any}
            currentWorkspace={currentWorkspace as any}
            onSwitchWorkspace={handleSwitchWorkspace}
            onCreateWorkspace={() => setShowCreateWorkspaceModal(true)}
            onRenameWorkspace={() => setShowRenameWorkspaceDialog(true)}
            onOpenWorkspaceMembers={() => setShowWorkspaceMembers(true)}
            onOpenWorkspaceSettings={() => {
              if (currentWorkspace) navigate(`/workspace/${currentWorkspace.id}/settings`);
            }}
            contextFolders={contextFolders}
            onLoadDemo={handleLoadDemoPresentation}
            onContextFoldersChange={setContextFolders}
            onInsertContent={handleInsertContent}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </SidebarErrorBoundary>
      )}

      {/* Workspace Members Modal (quick access) */}
      {currentWorkspace && (
        <WorkspaceMembersModal
          workspaceId={currentWorkspace.id}
          open={showWorkspaceMembers}
          onOpenChange={setShowWorkspaceMembers}
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
        {/* Premium Top Bar - Matching Homepage Style - RESPONSIVE */}
        {!focusMode && (
          <div className="relative flex-shrink-0 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 bg-white dark:bg-slate-900">
            {/* Premium background with gradients and glassmorphism */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-slate-50/95 to-white dark:from-slate-900 dark:via-slate-800/90 dark:to-slate-900 backdrop-blur-2xl border-b border-slate-300/60 dark:border-slate-700/50 shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]" />

            {/* Subtle animated gradients - only visible in light mode - hidden on small screens for performance */}
            <div className="absolute inset-0 overflow-hidden dark:opacity-30 hidden sm:block">
              <div className="absolute -inset-24 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_50%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.06),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.04),transparent_50%)] animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-slate-100/10 dark:from-transparent dark:via-transparent dark:to-transparent" />
            </div>

            <div className="relative flex items-center justify-between w-full gap-2">
              {/* Left Section - Document Navigation with Enhanced Title Input */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {currentDocument && (
                  <>
                    {/* Close Document Button - Back to Workspace Home */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/workspace')}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-muted/50 flex-shrink-0"
                      title="Close document"
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <div className="relative group min-w-0 flex-1 max-w-[200px] sm:max-w-[300px] lg:max-w-[400px]">
                      <input
                        type="text"
                        value={currentDocument.title}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setCurrentDocument({ ...currentDocument, title: newTitle });
                          backendUpdateDocument(currentDocument.id, { title: newTitle });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        className="w-full bg-transparent border-0 outline-none font-semibold text-base sm:text-lg text-foreground placeholder:text-muted-foreground/60 hover:bg-muted/30 focus:bg-muted/50 px-2 sm:px-3 py-1 rounded-md transition-colors truncate"
                        placeholder="Untitled Document"
                        title="Click to edit document title"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-md" />
                    </div>

                    {/* View Mode Indicator - hidden on very small screens */}
                    {viewMode && viewMode !== 'home' && (
                      <>
                        <span className="text-muted-foreground font-medium hidden sm:inline">/</span>
                        <span className="hidden sm:inline text-xs sm:text-sm font-medium text-primary px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-primary/10 border border-primary/20 shadow-sm whitespace-nowrap">
                          {viewMode === 'edit' && '✍️ Editor'}
                          {viewMode === 'mindmap' && '🧠 Mindmap'}
                          {viewMode === 'slides' && '📊 Slides'}
                          {viewMode === 'present' && '🎬 Present'}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Right Section - Premium Status & Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
                {/* Presence List - Top-right avatars - hidden on very small screens */}
                <div className="hidden sm:block">
                  <PresenceList provider={websocketProvider} />
                </div>

                {/* Guest indicator - premium style - compact on mobile */}
                {!user && (
                  <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200/50 dark:border-orange-800/50 text-xs text-orange-700 dark:text-orange-300 shadow-sm backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 shadow-sm" />
                    <span className="font-medium hidden sm:inline">Guest</span>
                    <span className="hidden sm:inline mx-1 text-orange-400 dark:text-orange-500">•</span>
                    <span className="font-mono font-medium">{remaining}/{total}</span>
                  </div>
                )}

                {/* User Menu - Premium Style */}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 sm:gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-300 rounded-lg px-2 sm:px-3"
                      >
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs sm:text-sm font-medium shadow-sm">
                          {(user.full_name?.[0] || user.username?.[0] || 'U').toUpperCase()}
                        </div>
                        <span className="hidden lg:inline font-medium">{user.full_name || user.username}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-2xl p-2"
                    >
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1 px-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{user.full_name || user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate('/profile')}
                        className="rounded-xl px-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                      >
                        <User className="mr-3 h-4 w-4 text-blue-500" />
                        <span className="font-medium">Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate('/settings')}
                        className="rounded-xl px-3 py-3 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                      >
                        <Settings className="mr-3 h-4 w-4 text-green-500" />
                        <span className="font-medium">Settings</span>
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
                        className="rounded-xl px-3 py-3 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors text-orange-600 focus:text-orange-600"
                      >
                        <Database className="mr-3 h-4 w-4" />
                        <span className="font-medium">Reset Offline Data</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => {
                          await logout();
                          // 🔥 FIX: Redirect to landing page, not login (less confusing)
                          navigate('/');
                        }}
                        className="rounded-xl px-3 py-3 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-red-600 focus:text-red-600"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span className="font-medium">Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="hidden md:inline-flex bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-300 rounded-lg px-4"
                  >
                    <span className="font-medium">Log in</span>
                  </Button>
                )}

              {/* File Watcher Indicator (Desktop only) */}
              <div className="hidden lg:block">
                <FileWatcherIndicator />
              </div>

              {/* Theme Toggle */}
                <ThemeToggle />
              </div>
            </div>
          </div>
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

      {/* Version history moved into the editor header (single source of truth) */}

      {/* Quick Switcher (Cmd+K) */}
      <QuickSwitcherModal
        open={isQuickSwitcherOpen}
        onClose={closeQuickSwitcher}
        onDocumentSelect={(docId) => {
          const doc = backendDocuments.find(d => d.id === docId);
          if (doc) {
            setCurrentDocument(doc);
            navigate(`/workspace/doc/${docId}/edit`);
          }
        }}
        onCreateDocument={() => setShowNewDocModal(true)}
        onCreateFolder={() => {
          // Trigger folder creation
          console.log('Create folder from quick switcher');
        }}
      />
    </div>
  );
}
