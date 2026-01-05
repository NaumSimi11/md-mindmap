/**
 * WYSIWYG Editor using TipTap
 * Replaces the split markdown editor with a unified editing experience
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './wysiwyg-editor.css';
import './inline-preview.css';
import '../comments/comments.css';
import 'tippy.js/dist/tippy.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { EditorContent } from '@tiptap/react';

// Hooks
import { useTipTapEditor } from '@/hooks/useTipTapEditor';
import { useYjsDocument } from '@/hooks/useYjsDocument'; // ✅ STEP 3: Yjs integration
import { useSyncStatus } from '@/hooks/useSyncStatus'; // Durability / backup status
import { useEditorMode } from './handlers/useEditorMode';
import { useSyntaxHighlighting } from './handlers/useSyntaxHighlighting';
import { htmlToMarkdown, markdownToHtml } from '@/utils/markdownConversion';

// UI Components
import { FloatingToolbar } from './FloatingToolbar';
import { FloatingSideToolbar } from './FloatingSideToolbar';
import { LinkHoverToolbar } from './LinkHoverToolbar';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import { FixedToolbar } from './toolbar/FixedToolbar';
import { EditorContextMenu } from './EditorContextMenu';
import { DiagramInsertMenu } from './DiagramInsertMenu';
import { TableInsertModal } from './TableInsertModal';
import { TableMenu } from './TableMenu';
import { AISidebarChat } from './AISidebarChat';
import { FormatDropdown } from './FormatDropdown';
import { AISettingsDropdown } from './AISettingsDropdown';
import { InlineDocumentTitle } from './InlineDocumentTitle';
import { LinkInsertModal } from './LinkInsertModal';
import { ImageInsertModal } from './ImageInsertModal';
import { AIModalErrorBoundary } from '../modals/AIModalErrorBoundary';
import { CommentSidebar } from '../comments/CommentSidebar';
import { AddCommentButton } from '../comments/AddCommentButton';
import { useCommentStore } from '@/stores/commentStore';
import { SyncStatusBadge } from './SyncStatusBadge';
import { ShareModal } from '../sharing/ShareModal';
import { VersionHistoryPanel } from '../versioning/VersionHistoryPanel';
import { PresenceList } from '../collaboration/PresenceList';

// Utils & Services
import { autoFormatText, generateAIFormatPrompt, needsFormatting } from '@/utils/autoFormat';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEditorUIStore } from '@/stores/editorUIStore';
import { useSpellCheck, useFontSize, useShowActionBar, useShowFormattingToolbar, useShowSideToolbar } from '@/stores/userPreferencesStore';
import { UnifiedAIModal } from '@/components/modals/UnifiedAIModal';
import UnifiedDiagramModal from '@/components/modals/UnifiedDiagramModal';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { selectiveSyncService } from '@/services/sync/SelectiveSyncService';
import { documentExportService } from '@/services/export/DocumentExportService';
import { documentService } from '@/services/api/DocumentService';
import {
  Undo,
  Redo,
  Library,
  Sparkles,
  Network,
  Keyboard,
  FileText,
  MoreVertical,
  Upload,
  FolderOpen,
  Download,
  Save,
  Share,
  Cloud,
  HardDrive,
  Users,
  Clock,
  Menu,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

interface WYSIWYGEditorProps {
  documentId?: string;
  documentTitle?: string;
  // ❌ STEP 4: Removed initialContent (hydration handled by WorkspaceContext)
  // ❌ STEP 1: Removed onContentChange (Yjs handles persistence)
  onTitleChange?: (title: string) => void;
  onEditorReady?: (editor: any) => void;
  /** Document sync status (for version history) */
  documentSyncStatus?: 'local' | 'synced' | 'syncing' | 'conflict' | 'pending' | 'modified' | 'error';
  /** Document cloud ID (for version history) */
  documentCloudId?: string | null;
  contextFolders?: Array<{
    id: string;
    name: string;
    icon: string;
    files: Array<{
      id: string;
      name: string;
      type: 'pdf' | 'docx' | 'md' | 'xlsx' | 'txt' | 'other';
      size?: string;
      addedAt: Date;
      content?: string;
      path?: string;
    }>;
  }>;
}

export const WYSIWYGEditor: React.FC<WYSIWYGEditorProps> = ({
  documentId,
  documentTitle = 'Untitled Document',
  // ❌ STEP 4: Removed initialContent (hydration in WorkspaceContext)
  // ❌ STEP 1: Removed onContentChange
  onTitleChange,
  onEditorReady,
  contextFolders = [],
  documentSyncStatus,
  documentCloudId,
}) => {
  // 🔥 ISSUE 1 FIX: Early return if no documentId
  // Prevents TipTap from ever mounting without ydoc
  // NOTE: This is before hooks (Rules of Hooks exception for deterministic guards)
  if (!documentId) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        <div className="text-center">
          <p className="text-lg">Waiting for document...</p>
          <p className="text-sm mt-2">No document ID provided</p>
        </div>
      </div>
    );
  }

  const navigate = useNavigate();
  const [title, setTitle] = useState(documentTitle);

  // Zustand Store
  const {
    showAIModal, setShowAIModal,
    showDiagramMenu, setShowDiagramMenu,
    showTableModal, setShowTableModal,
    showTableMenu, setShowTableMenu,
    tableMenuPosition,
    isSidebarOpen, toggleSidebar,
    showMindmapChoiceModal, setShowMindmapChoiceModal,
    showKeyboardShortcuts, setShowKeyboardShortcuts,
    showLinkModal, setShowLinkModal,
    showImageModal, setShowImageModal
  } = useEditorUIStore();

  // User Preferences
  const spellCheckEnabled = useSpellCheck();
  const editorFontSize = useFontSize();
  const showActionBar = useShowActionBar();
  const showFormattingToolbar = useShowFormattingToolbar();
  const showSideToolbar = useShowSideToolbar();

  // Local State
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(false);
  const [aiAutocompleteEnabled, setAiAutocompleteEnabled] = useState(true);
  const { toast } = useToast();
  
  // Sharing & Version History State
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'editor' | 'commenter' | 'viewer' | null>(null);

  // Auth & Workspace
  const { isAuthenticated, user } = useAuth();
  const { refreshDocuments } = useWorkspace();
  
  // Durability / backup status (used for inline badge)
  const syncStatus = useSyncStatus(documentId);

  // File open/insert helpers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openReplaceNextRef = useRef<boolean>(false);

  // Editor Mode State
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg');
  const [markdownContent, setMarkdownContent] = useState('');
  const markdownTextareaRef = useRef<HTMLTextAreaElement>(null);
  const savedCursorTextRef = useRef<string | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    selectedText: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    selectedText: '',
  });
  
  // Comment State
  const [showCommentButton, setShowCommentButton] = useState(false);
  const [commentButtonPosition, setCommentButtonPosition] = useState({ x: 0, y: 0 });
  const [selectedTextForComment, setSelectedTextForComment] = useState('');

  // 🔥 RULES OF HOOKS FIX: ALL hooks must run unconditionally
  // Get Yjs document (may be undefined initially)
  const { ydoc, websocketProvider, status, syncStatus: yjsSyncStatus } = useYjsDocument(documentId);
  
  console.log('✅ [STEP 3] Yjs document status:', status, 'for document:', documentId);

  // 🔥 Collaboration cursor user info
  const currentUser = useMemo(() => {
    if (!user) return undefined;
    // Generate consistent color from user ID or email
    const seed = user.id || user.email || 'anonymous';
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    }
    return {
      name: user.full_name || user.username || user.email?.split('@')[0] || 'Anonymous',
      color: colors[Math.abs(hash) % colors.length],
    };
  }, [user]);

  // 🔥 Initialize TipTap with Yjs (ydoc may be undefined initially, that's OK)
  // When ydoc changes from undefined → defined, editor will re-initialize
  const { editor, isProgrammaticUpdateRef } = useTipTapEditor({
    onEditorReady,
    aiSuggestionsEnabled,
    aiAutocompleteEnabled,
    setShowDiagramMenu,
    setShowAIModal,
    setShowTableModal,
    setShowTableMenu,
    setContextMenu,
    ydoc, // May be undefined initially (will trigger re-init when defined)
    provider: websocketProvider,
    localSynced: yjsSyncStatus.local,  // 🔥 FIX: Wait for IndexedDB sync before loading _init_markdown
    currentUser, // 🔥 NEW: User info for collaboration cursors
  });

  // Editor Mode Hook
  const { toggleEditorMode } = useEditorMode({
    editor,
    editorMode,
    setEditorMode,
    markdownContent,
    setMarkdownContent,
    markdownTextareaRef,
    savedCursorTextRef,
    isProgrammaticUpdateRef,
  });

  // Syntax Highlighting Hook
  useSyntaxHighlighting(editor);

  // 🔥 Track when TipTap view is actually mounted and ready
  const [viewReady, setViewReady] = useState(false);
  useEffect(() => {
    if (!editor || viewReady) return;
    
    const checkInterval = setInterval(() => {
      try {
        if (editor.view && editor.view.dom) {
          console.log('✅ [STEP 3] TipTap View is now ready for', documentId);
          setViewReady(true);
          clearInterval(checkInterval);
        }
      } catch (e) {
        // View not ready yet
      }
    }, 50);
    
    return () => clearInterval(checkInterval);
  }, [editor, viewReady, documentId]);

  // ✅ STEP 4: Hydration moved to WorkspaceContext (data layer)
  // Editor is now a pure renderer - receives only ydoc, no initialContent

  // Update title (only when title changes, not when callback changes)
  const prevTitleRef = useRef<string>(title);
  useEffect(() => {
    if (prevTitleRef.current !== title) {
      prevTitleRef.current = title;
      onTitleChange?.(title);
    }
  }, [title]); // ← REMOVED onTitleChange from deps to prevent infinite loop

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+M: Toggle editor mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'm' && !e.shiftKey) {
        e.preventDefault();
        toggleEditorMode();
      }

      // Ctrl+Shift+A: Open AI Assistant
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAIModal(true);
      }

      // Ctrl+Shift+D: Open Diagram Menu
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDiagramMenu(true);
      }

      // Ctrl+Shift+M: Open Mindmap Studio
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setShowMindmapChoiceModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleEditorMode, setShowAIModal, setShowDiagramMenu, setShowMindmapChoiceModal]);

  /**
   * Load user role for permissions (editor header buttons)
   *
   * Previous implementation eagerly called `/documents/:id/members` on every
   * document selection. That caused noisy 403s for perfectly valid cases
   * (e.g. user has access via workspace but is not in document_shares).
   *
   * We keep the behaviour simple here:
   * - If authenticated + documentId → enable sharing UI (optimistic viewer role)
   * - Actual permission is still enforced server‑side when user opens Share modal
   *   or performs share actions.
   *
   * This removes the extra `/members` call on every select and keeps the
   * selection flow clean.
   */
  useEffect(() => {
    if (!isAuthenticated || !documentId) {
      setUserRole(null);
      return;
    }

    // Determine user's role for this document
    // For local-only documents (doc_ prefix), skip backend call
    const isLocalOnly = documentId.startsWith('doc_');
    
    if (isLocalOnly) {
      // Local documents are always owned by the current user
      setUserRole('owner');
      return;
    }
    
    const determineRole = async () => {
      try {
        // Try to get document details to check ownership
        const doc = await documentService.getDocument(documentId);
        if (doc && user && doc.created_by === user.id) {
          setUserRole('owner');
        } else {
          // Default to editor for authenticated users (backend will enforce actual permissions)
          setUserRole('owner'); // Temporary: treat all authenticated users as owners for UI
        }
      } catch {
        // Fallback: assume owner for UI purposes (backend is authoritative)
        setUserRole('owner');
      }
    };
    
    determineRole();
  }, [isAuthenticated, documentId, user]);

  // Flatten context folders for AI modal
  const flattenedContextFiles = useMemo(() => {
    return contextFolders.flatMap(folder =>
      folder.files.map(file => ({
        id: file.id,
        name: `${folder.icon} ${folder.name} / ${file.name}`,
        content: file.content,
      }))
    );
  }, [contextFolders]);

  // Handle markdown textarea changes
  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = e.target.value;
    setMarkdownContent(newMarkdown);
    // ❌ STEP 1: No auto-save on change (Yjs will handle in STEP 3)
  };

  // Toolbar actions
  const insertMermaidDiagram = (code?: string) => {
    if (!editor) return;
    const diagramCode = code || 'flowchart TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[End]\n  B -->|No| A';

    const { state } = editor;
    const to = state.selection.to;
    editor.chain().focus().setTextSelection({ from: to, to }).run();

    editor.commands.insertContent([
      { type: 'paragraph' },
      { type: 'mermaid', attrs: { code: diagramCode, scale: 1, width: '780px' } },
      { type: 'paragraph' }
    ]);
  };

  const insertTable = () => setShowTableModal(true);

  const handleTableInsert = (rows: number, cols: number, withHeaderRow: boolean) => {
    editor?.chain().focus().insertTable({ rows, cols, withHeaderRow }).run();
  };

  const insertImage = (url?: string) => {
    if (url && typeof url === 'string') {
      editor?.chain().focus().setImage({ src: url }).run();
    } else {
      setShowImageModal(true);
    }
  };

  const insertLink = () => {
    setShowLinkModal(true);
  };

  const handleLinkInsert = (url: string, text?: string) => {
    if (!editor) return;

    if (text) {
      // If text is provided, insert it with the link
      editor.chain().focus()
        .insertContent({
          type: 'text',
          text: text,
          marks: [{ type: 'link', attrs: { href: url } }]
        })
        .run();
    } else {
      // Otherwise just toggle link on selection or insert link
      editor.chain().focus().toggleLink({ href: url }).run();
    }
  };

  // File Import Logic
  const getFileExtension = (name: string): string => {
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
  };

  const fileTextToHtml = (text: string, ext: string): string => {
    if (!text) return '';
    if (ext === 'html' || ext === 'htm') return text;
    return markdownToHtml(text);
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    try {
      const ext = getFileExtension(file.name);
      const validExtensions = ['.md', '.markdown', '.txt', '.html', '.htm'];
      if (!validExtensions.some(validExt => file.name.toLowerCase().endsWith(validExt))) {
        toast({ title: 'Invalid file type', description: 'Please select a .md, .txt, or .html file.', variant: 'destructive' });
        return;
      }

      const text = await file.text();
      if (!text || text.trim().length === 0) {
        toast({ title: 'Empty file', description: 'The selected file is empty.', variant: 'destructive' });
        return;
      }

      const html = fileTextToHtml(text, ext);
      if (!html) {
        toast({ title: 'Failed to parse file', description: 'Could not read the file content.', variant: 'destructive' });
        return;
      }

      if (openReplaceNextRef.current && editor) {
        isProgrammaticUpdateRef.current = true;
        editor.commands.clearContent();
        editor.commands.setContent(html);
        requestAnimationFrame(() => {
          isProgrammaticUpdateRef.current = false;
          try { editor.commands.focus(); } catch { }
          // ❌ STEP 1: No auto-save on import (manual save only)
        });
        toast({ title: 'File imported', description: `Replaced document with "${file.name}"` });
      } else if (editor) {
        editor.chain().focus().insertContent(html).run();
        toast({ title: 'File inserted', description: `Inserted content from "${file.name}"` });
      }
    } catch (err) {
      console.error('Failed to open file:', err);
      toast({ title: 'Import failed', description: err instanceof Error ? err.message : 'Failed to open file.', variant: 'destructive' });
    }
  };

  const triggerOpenFile = (replaceDocument: boolean) => {
    openReplaceNextRef.current = replaceDocument;
    fileInputRef.current?.click();
  };

  // Auto-format handlers
  const handleAutoFormat = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) {
      alert('Please select text to format');
      return;
    }
    const selectedText = editor.state.doc.textBetween(from, to, '\n');
    const formatted = autoFormatText(selectedText);
    editor.chain().focus().deleteRange({ from, to }).insertContent(formatted).run();
  };

  const handleAutoFormatAll = () => {
    if (!editor) return;
    const allText = editor.getText();
    if (!needsFormatting(allText)) {
      alert('Document appears to already be formatted!');
      return;
    }
    const formatted = autoFormatText(allText);
    editor.chain().focus().setContent(formatted).run();
  };

  const handleAIFormat = async () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    const text = hasSelection ? editor.state.doc.textBetween(from, to, '\n') : editor.getText();
    const prompt = generateAIFormatPrompt(text);
    setShowAIModal(true);
    console.log('AI Format prompt:', prompt);
  };

  const exportAsMarkdown = () => {
    try {
      const markdown = htmlToMarkdown('', editor);
      if (!markdown || markdown.trim().length === 0) {
        toast({ title: 'Nothing to export', description: 'The document is empty.', variant: 'destructive' });
        return;
      }
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sanitizedTitle = title.trim() || 'Untitled Document';
      a.download = `${sanitizedTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Export successful', description: `Downloaded "${sanitizedTitle}.md"` });
    } catch (err) {
      console.error('Failed to export markdown:', err);
      toast({ title: 'Export failed', description: 'Failed to export document.', variant: 'destructive' });
    }
  };

  // Save Handlers
  const handleSaveToCloud = async () => {
    if (!documentId || !isAuthenticated) {
      toast({ 
        title: 'Cannot save to cloud', 
        description: 'Please log in to save documents to the cloud.', 
        variant: 'destructive' 
      });
      return;
    }

    if (!editor) {
      toast({ 
        title: 'Cannot save', 
        description: 'Editor is not ready.', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      toast({ title: 'Saving to cloud...', description: 'Please wait...' });
      
      // 🔥 FIX: Get live content from editor, not stale cache
      const liveContent = htmlToMarkdown('', editor);
      console.log('☁️ [Cloud Save] Sending content:', liveContent.substring(0, 100) + '...');
      
      const result = await selectiveSyncService.pushDocument(documentId, liveContent);
      
      if (result.success) {
        toast({ title: 'Saved to cloud', description: 'Document synced successfully.' });
        
        // 🔥 Refresh documents to update sync status icon in sidebar
        // The sync status is already updated in IndexedDB by pushDocument
        // We just need to reload the documents list to reflect the change
        await refreshDocuments();
      } else if (result.status === 'conflict') {
        toast({ 
          title: 'Conflict detected', 
          description: 'Cloud version is newer. Please resolve conflicts.', 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Save failed', 
          description: result.error || 'Failed to save to cloud.', 
          variant: 'destructive' 
        });
      }
    } catch (err) {
      console.error('Failed to save to cloud:', err);
      toast({ 
        title: 'Save failed', 
        description: 'An error occurred while saving to cloud.', 
        variant: 'destructive' 
      });
    }
  };

  const handleSaveAsLocal = async () => {
    if (!documentId) {
      toast({ 
        title: 'Cannot save', 
        description: 'No document selected.', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      toast({ title: 'Saving to local machine...', description: 'Please wait...' });
      
      // Get content from editor directly (most reliable)
      let editorContent: string | undefined;
      if (editor) {
        // Convert editor HTML to markdown
        editorContent = htmlToMarkdown('', editor);
      }
      
      const result = await documentExportService.exportToLocalMachine(
        documentId,
        title || 'Untitled Document',
        { format: 'markdown' },
        editorContent // Pass editor content directly
      );

      if (result.success) {
        toast({ 
          title: 'Saved successfully', 
          description: result.path ? `Saved to: ${result.path}` : 'Document saved to local machine.' 
        });
      } else {
        toast({ 
          title: 'Save failed', 
          description: result.error || 'Failed to save document.', 
          variant: 'destructive' 
        });
      }
    } catch (err) {
      console.error('Failed to save as local:', err);
      toast({ 
        title: 'Save failed', 
        description: 'An error occurred while saving.', 
        variant: 'destructive' 
      });
    }
  };

  const handleSaveLocally = () => {
    // ❌ STEP 1: Manual save disabled (no persistence layer yet)
    // Will be re-implemented in STEP 5 via Yjs snapshot export
    toast({ 
      title: 'Save disabled (STEP 1)', 
      description: 'Persistence will be re-enabled in STEP 3 via Yjs.', 
      variant: 'destructive' 
    });
  };

  // ❌ STEP 1: Auto-save to cloud DISABLED
  // Will be re-implemented in STEP 5 using ydoc.on('update') instead of editor.on('update')
  // 
  // useEffect(() => {
  //   // DISABLED for STEP 1 baseline
  // }, []);

  // Context Menu Handlers
  const handleContextFormat = (format: string) => {
    if (!editor) return;
    switch (format) {
      case 'bold': editor.chain().focus().toggleBold().run(); break;
      case 'italic': editor.chain().focus().toggleItalic().run(); break;
      case 'underline': editor.chain().focus().toggleUnderline().run(); break;
      case 'strikethrough': editor.chain().focus().toggleStrike().run(); break;
      case 'highlight': editor.chain().focus().toggleHighlight().run(); break;
      case 'code': editor.chain().focus().toggleCode().run(); break;
      case 'superscript': editor.chain().focus().toggleSuperscript().run(); break;
      case 'subscript': editor.chain().focus().toggleSubscript().run(); break;
      case 'link': insertLink(); break;
      case 'heading1': editor.chain().focus().toggleHeading({ level: 1 }).run(); break;
      case 'heading2': editor.chain().focus().toggleHeading({ level: 2 }).run(); break;
      case 'heading3': editor.chain().focus().toggleHeading({ level: 3 }).run(); break;
      case 'bulletList': editor.chain().focus().toggleBulletList().run(); break;
      case 'orderedList': editor.chain().focus().toggleOrderedList().run(); break;
      case 'blockquote': editor.chain().focus().toggleBlockquote().run(); break;
    }
  };

  const handleContextAIAction = (action: string) => {
    setShowAIModal(true);
  };

  const handleContextInsert = (type: string) => {
    if (!editor) return;
    switch (type) {
      case 'table': setShowTableModal(true); break;
      case 'diagram': setShowDiagramMenu(true); break;
    }
  };

  const handleContextBasicAction = (action: string) => {
    if (!editor) return;
    switch (action) {
      case 'copy': document.execCommand('copy'); break;
      case 'cut': document.execCommand('cut'); break;
      case 'paste': document.execCommand('paste'); break;
      case 'delete': editor.chain().focus().deleteSelection().run(); break;
    }
  };

  // 🔥 RULES OF HOOKS FIX: Conditional rendering AFTER all hooks
  // This prevents mounting TipTap without Yjs, but doesn't violate Rules of Hooks
  if (!ydoc) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        <div className="text-center">
          <p className="text-lg">Loading document...</p>
          <p className="text-sm mt-2">Initializing IndexedDB storage...</p>
        </div>
      </div>
    );
  }
  
  if (!editor) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Initializing editor...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-background relative">
      {/* 🔥 Collaboration Presence List - Shows other users editing */}
      <PresenceList provider={websocketProvider as any} />
      
      {/* Side Toolbar - Controlled by user preferences */}
      {viewReady && showSideToolbar && (
        <FloatingSideToolbar
          editor={editor}
          onInsertTable={insertTable}
          onInsertLink={insertLink}
          onInsertImage={insertImage}
          onAutoFormat={handleAutoFormat}
          onAutoFormatAll={handleAutoFormatAll}
          onAIFormat={handleAIFormat}
          onShowDiagramMenu={() => setShowDiagramMenu(true)}
          onShowMindmapChoice={() => {
            // ❌ STEP 1: No auto-save before mindmap (Yjs will handle in STEP 3)
            setShowMindmapChoiceModal(true);
          }}
          onShowKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
          onToggleEditorMode={toggleEditorMode}
          editorMode={editorMode}
          aiAutocompleteEnabled={aiAutocompleteEnabled}
          onAIAutocompleteChange={setAiAutocompleteEnabled}
          aiHintsEnabled={aiSuggestionsEnabled}
          onAIHintsChange={setAiSuggestionsEnabled}
          onImportFile={triggerOpenFile}
          onExportMarkdown={exportAsMarkdown}
          onSaveToCloud={handleSaveToCloud}
          onSaveAsLocal={handleSaveAsLocal}
          onSaveLocally={handleSaveLocally}
          onSave={() => {
            // ❌ STEP 1: Legacy save disabled (no persistence)
            toast({ 
              title: 'Save disabled (STEP 1)', 
              description: 'Use "Save to Cloud" or "Save As Local" buttons.', 
              variant: 'destructive' 
            });
          }}
          onShare={() => console.log('Share clicked')}
          onShowShareModal={isAuthenticated && documentId && userRole ? () => setShowShareModal(true) : undefined}
          onShowVersionHistory={isAuthenticated && documentId && userRole ? () => setShowVersionHistory(true) : undefined}
        />
      )}

      {/* Premium Top Bar - Matching Homepage Style - RESPONSIVE - Controlled by user preferences */}
      {showActionBar && (
      <div className="relative flex-shrink-0 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 bg-white dark:bg-slate-900">
        {/* Premium background with gradients and glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-slate-50/90 to-white dark:from-slate-900 dark:via-slate-800/90 dark:to-slate-900 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]" />

        {/* Subtle animated gradients - only visible in light mode */}
        <div className="absolute inset-0 overflow-hidden dark:opacity-30">
          <div className="absolute -inset-24 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_50%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.06),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.04),transparent_50%)] animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-slate-100/10 dark:from-transparent dark:via-transparent dark:to-transparent" />
        </div>

        <div className="relative flex items-center justify-between w-full gap-2">
          {/* Left Section - Premium Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0 overflow-x-auto scrollbar-hide">
            
            {/* MOBILE: Collapsed Tools Menu (visible on small screens) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex lg:hidden gap-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-300/50 dark:border-slate-600/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-300 rounded-lg px-2.5 sm:px-3"
                >
                  <Menu className="h-4 w-4" />
                  <span className="text-xs font-medium hidden sm:inline">Tools</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-2xl p-2">
                {/* Format Dropdown Entry */}
                {viewReady && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <FileText className="h-4 w-4 mr-3 text-slate-600 dark:text-slate-400" />
                      <span className="font-medium">Format</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-2xl p-2 min-w-[200px]">
                      <DropdownMenuItem onClick={handleAutoFormat} className="rounded-xl px-3 py-2">
                        Auto Format Selection
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleAutoFormatAll} className="rounded-xl px-3 py-2">
                        Auto Format All
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleAIFormat} className="rounded-xl px-3 py-2">
                        AI Format
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}
                
                <DropdownMenuItem
                  onClick={() => setShowDiagramMenu(true)}
                  className="rounded-xl px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                >
                  <Library className="h-4 w-4 mr-3 text-blue-500" />
                  <span className="font-medium">Insert Diagram</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={() => setShowMindmapChoiceModal(true)}
                  className="rounded-xl px-3 py-2.5 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors"
                >
                  <Network className="h-4 w-4 mr-3 text-orange-500" />
                  <span className="font-medium">Mindmap Studio</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-2" />
                
                <DropdownMenuItem
                  onClick={() => setShowKeyboardShortcuts(true)}
                  className="rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <Keyboard className="h-4 w-4 mr-3 text-slate-500" />
                  <span className="font-medium">Keyboard Shortcuts</span>
                </DropdownMenuItem>
                
                {isAuthenticated && documentId && userRole && (
                  <>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem
                      onClick={() => setShowShareModal(true)}
                      className="rounded-xl px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                    >
                      <Users className="h-4 w-4 mr-3 text-blue-500" />
                      <span className="font-medium">Share Document</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowVersionHistory(true)}
                      className="rounded-xl px-3 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
                    >
                      <Clock className="h-4 w-4 mr-3 text-purple-500" />
                      <span className="font-medium">Version History</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* DESKTOP: Full toolbar (hidden on small screens) */}
            {/* Format Dropdown - Desktop Only */}
            <div className="hidden lg:block">
              {viewReady && (
                <FormatDropdown
                  editor={editor}
                  onInsertTable={insertTable}
                  onInsertLink={insertLink}
                  onInsertImage={insertImage}
                  onAutoFormat={handleAutoFormat}
                  onAutoFormatAll={handleAutoFormatAll}
                  onAIFormat={handleAIFormat}
                />
              )}
            </div>

            <div className="hidden lg:block w-px h-8 bg-slate-300/50 dark:bg-slate-600/50 mx-2" />

            {/* Diagram Button - Desktop Only */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDiagramMenu(true)}
              title="Insert Diagram"
              className="hidden lg:flex gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-300/50 dark:border-slate-600/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 rounded-lg px-3"
            >
              <Library className="h-4 w-4" />
              <span className="text-xs font-medium">Diagram</span>
            </Button>

            {/* AI Assistant Dropdown - ALWAYS VISIBLE (priority action) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  title="AI Assistant"
                  className="gap-1.5 sm:gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 rounded-lg px-2.5 sm:px-3 lg:px-4"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-medium">AI</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-2xl p-2">
                <DropdownMenuItem
                  onClick={() => setShowAIModal(true)}
                  className="rounded-xl px-3 py-3 mb-1 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
                >
                  <Sparkles className="h-4 w-4 mr-3 text-purple-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Ask AI</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">Generate content, rewrite, chat</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <div className="px-3 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">AI Autocomplete</span>
                    <button
                      onClick={(e) => { e.preventDefault(); setAiAutocompleteEnabled(!aiAutocompleteEnabled); }}
                      className={`w-10 h-5 rounded-full transition-colors ${aiAutocompleteEnabled ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${aiAutocompleteEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">AI Hints</span>
                    <button
                      onClick={(e) => { e.preventDefault(); setAiSuggestionsEnabled(!aiSuggestionsEnabled); }}
                      className={`w-10 h-5 rounded-full transition-colors ${aiSuggestionsEnabled ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${aiSuggestionsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mindmap Button - Desktop Only */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMindmapChoiceModal(true)}
              title="Open Mindmap Studio"
              className="hidden lg:flex gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-orange-300/50 dark:border-orange-600/50 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 rounded-lg px-3"
            >
              <Network className="h-4 w-4" />
              <span className="text-xs font-medium">Mindmap</span>
            </Button>

            {/* Keyboard Shortcuts - Desktop Only */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowKeyboardShortcuts(true)}
              title="Keyboard Shortcuts (?)"
              className="hidden xl:flex bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-300 rounded-lg px-3"
            >
              <Keyboard className="h-4 w-4" />
            </Button>

            <div className="hidden md:block w-px h-8 bg-slate-300/50 dark:bg-slate-600/50 mx-1 lg:mx-2" />

            {/* Mode Toggle - ALWAYS VISIBLE (priority action) */}
            <Button
              size="sm"
              variant={editorMode === 'markdown' ? 'default' : 'outline'}
              onClick={toggleEditorMode}
              title="Toggle Mode (Ctrl+M)"
              className={`gap-1.5 sm:gap-2 transition-all duration-300 rounded-lg px-2 sm:px-3 ${
                editorMode === 'markdown'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/40'
                  : 'bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-300/50 dark:border-slate-600/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium hidden sm:inline">{editorMode === 'wysiwyg' ? 'MD' : 'WYSIWYG'}</span>
            </Button>
            
            {/* Share & Version History Buttons - Desktop Only */}
            {isAuthenticated && documentId && userRole && (
              <>
                <Separator orientation="vertical" className="hidden lg:block h-6 mx-1" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowShareModal(true)}
                  title="Share Document"
                  className="hidden lg:flex gap-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-300/50 dark:border-slate-600/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-300 rounded-lg"
                >
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium">Share</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowVersionHistory(true)}
                  title="Version History"
                  className="hidden lg:flex gap-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-300/50 dark:border-slate-600/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-300 rounded-lg"
                >
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">History</span>
                </Button>
              </>
            )}
          </div>

          {/* Center Section - Spacer */}
          <div className="flex-1 min-w-0" />

          {/* Right Section - Premium Status & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
            {/* Sync status button with tooltip */}
            {isAuthenticated && documentId && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`relative gap-1 sm:gap-2 backdrop-blur-sm transition-all duration-300 rounded-lg px-2 sm:px-3 ${
                        syncStatus.isBackingUp 
                          ? 'bg-yellow-50 dark:bg-yellow-950/30 hover:bg-yellow-100 dark:hover:bg-yellow-950/50 border border-yellow-300/50 dark:border-yellow-700/50' 
                          : syncStatus.isOnline && syncStatus.lastSyncSuccess 
                            ? 'bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50 border border-green-300/50 dark:border-green-700/50' 
                            : syncStatus.isOnline 
                              ? 'bg-yellow-50 dark:bg-yellow-950/30 hover:bg-yellow-100 dark:hover:bg-yellow-950/50 border border-yellow-300/50 dark:border-yellow-700/50' 
                              : 'bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 border border-red-300/50 dark:border-red-700/50'
                      }`}
                    >
                      <div 
                        className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                          syncStatus.isBackingUp 
                            ? 'bg-yellow-500 animate-pulse' 
                            : syncStatus.isOnline && syncStatus.lastSyncSuccess 
                              ? 'bg-green-500' 
                              : syncStatus.isOnline 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                        }`}
                      />
                      <span className={`text-xs font-medium hidden sm:inline ${
                        syncStatus.isBackingUp 
                          ? 'text-yellow-700 dark:text-yellow-300' 
                          : syncStatus.isOnline && syncStatus.lastSyncSuccess 
                            ? 'text-green-700 dark:text-green-300' 
                            : syncStatus.isOnline 
                              ? 'text-yellow-700 dark:text-yellow-300' 
                              : 'text-red-700 dark:text-red-300'
                      }`}>
                        {syncStatus.isBackingUp 
                          ? 'Syncing...' 
                          : syncStatus.isOnline && syncStatus.lastSyncSuccess 
                            ? 'Synced' 
                            : syncStatus.isOnline 
                              ? 'Pending' 
                              : 'Offline'}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                    <div className="space-y-2 p-1">
                      <div className="font-semibold text-sm">Backup Status</div>
                      
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Local:</span>
                          <span className="font-medium text-green-500">Saved ✓</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cloud Backup:</span>
                          <span className={`font-medium ${
                            syncStatus.isBackingUp 
                              ? 'text-yellow-500' 
                              : syncStatus.isOnline && syncStatus.lastSyncSuccess 
                                ? 'text-green-500' 
                                : syncStatus.isOnline 
                                  ? 'text-yellow-500' 
                                  : 'text-red-500'
                          }`}>
                            {syncStatus.isBackingUp 
                              ? 'Backing up...' 
                              : syncStatus.isOnline && syncStatus.lastSyncSuccess 
                                ? 'Backed up ✓' 
                                : syncStatus.isOnline 
                                  ? 'Pending sync' 
                                  : 'Offline'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Network:</span>
                          <span className="font-medium">
                            {syncStatus.isOnline ? 'Online ✓' : 'Offline ✗'}
                          </span>
                        </div>
                        
                        {syncStatus.lastSyncedAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last backed up:</span>
                            <span className="font-medium">
                              {new Date(syncStatus.lastSyncedAt).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                        
                        {syncStatus.pendingCount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pending retries:</span>
                            <span className="font-medium text-red-500">{syncStatus.pendingCount}</span>
                          </div>
                        )}
                      </div>
                      
                      {!syncStatus.isOnline && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-[10px] text-muted-foreground">
                            Changes are saved locally. Cloud backup will resume when online.
                          </p>
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Premium more actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-300 rounded-lg px-2 sm:px-3"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 sm:w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-2xl p-2"
              >
                <div className="px-3 py-2 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-500" />
                  Import Document
                </div>
                <DropdownMenuItem
                  onClick={() => triggerOpenFile(false)}
                  className="rounded-xl px-3 py-3 mb-1 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-3 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Insert from file</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">Add content after current document</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => triggerOpenFile(true)}
                  className="rounded-xl px-3 py-3 mb-1 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                >
                  <FolderOpen className="h-4 w-4 mr-3 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Replace document</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">Open file and replace all content</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2" />

                <div className="px-3 py-2 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Download className="h-4 w-4 text-green-500" />
                  Export Document
                </div>
                <DropdownMenuItem
                  onClick={exportAsMarkdown}
                  className="rounded-xl px-3 py-3 mb-1 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                >
                  <Download className="h-4 w-4 mr-3 text-green-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Export as Markdown</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">Download as .md file</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />

                {/* Save Options - Section header */}
                <div className="px-3 py-2 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Save className="h-4 w-4 text-purple-500" />
                  Save Options
                </div>

                {/* Save Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="rounded-xl px-3 py-3 mb-1 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors">
                    <Save className="h-4 w-4 mr-3 text-purple-500" />
                    <span className="font-medium flex-1">Save Options</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Ctrl+S</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-2xl p-2 min-w-[220px]">
                    {isAuthenticated && (
                      <DropdownMenuItem
                        onClick={handleSaveToCloud}
                        className="rounded-xl px-3 py-3 mb-1 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                      >
                        <Cloud className="h-4 w-4 mr-3 text-blue-500" />
                        <div className="flex flex-col">
                          <span className="font-medium">Save to Cloud</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400">Sync to cloud storage</span>
                        </div>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={handleSaveAsLocal}
                      className="rounded-xl px-3 py-3 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                    >
                      <HardDrive className="h-4 w-4 mr-3 text-green-500" />
                      <div className="flex flex-col">
                        <span className="font-medium">Save Locally</span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">Save to computer disk</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      )}

      <div className="flex-1 overflow-y-auto bg-background" data-testid="editor-container">
        {editorMode === 'wysiwyg' ? (
          <>
            {/* Formatting Toolbar - Controlled by user preferences */}
            {viewReady && showFormattingToolbar && <FixedToolbar editor={editor} />}
            <EditorContent editor={editor} data-testid="wysiwyg-editor" />
            {viewReady && editor && <FloatingToolbar editor={editor} />}
            {viewReady && editor && <LinkHoverToolbar editor={editor} />}
          </>
        ) : (
          <textarea
            ref={markdownTextareaRef}
            value={markdownContent}
            onChange={handleMarkdownChange}
            className="w-full h-full p-6 resize-none border-0 focus:outline-none font-mono leading-relaxed bg-background"
            style={{ fontSize: `var(--font-size-editor)` }}
            placeholder="# Start writing in Markdown..."
            spellCheck={spellCheckEnabled}
            data-testid="markdown-editor"
          />
        )}
      </div>

      <div className="bg-muted/50 backdrop-blur-sm px-6 py-2 flex-shrink-0 mt-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Words: {viewReady ? (editor.storage.characterCount?.words() || editor.getText().split(/\s+/).filter(w => w.length > 0).length) : 0}</span>
            <span>Characters: {viewReady ? (editor.storage.characterCount?.characters() || editor.getText().length) : 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span>Ready</span>
          </div>
        </div>
      </div>

      <AIModalErrorBoundary>
      <UnifiedAIModal
        open={showAIModal}
        onOpenChange={setShowAIModal}
        documentContent={editor ? htmlToMarkdown('', editor) : ''}
          selectedText={editor && !editor.state.selection.empty
            ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, '\n')
            : contextMenu.selectedText}
        contextFiles={flattenedContextFiles}
          onInsertText={(result: string) => editor?.chain().focus().insertContent(`\n\n${result}\n\n`).run()}
          onInsertDiagram={(code: string) => editor?.chain().focus().insertContent(`\n\`\`\`mermaid\n${code}\n\`\`\`\n`).run()}
        defaultTab="text"
      />
      </AIModalErrorBoundary>

      <UnifiedDiagramModal
        open={showMindmapChoiceModal}
        onOpenChange={setShowMindmapChoiceModal}
        editor={editor}
        documentContent={viewReady && editor ? htmlToMarkdown('', editor) : ''}
        documentId={documentId}
        documentTitle={title}
        selectedText={viewReady && editor?.state.selection.empty ? undefined : (viewReady ? editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ') : undefined)}
      />

      <DiagramInsertMenu
        isOpen={showDiagramMenu}
        onClose={() => setShowDiagramMenu(false)}
        onInsert={insertMermaidDiagram}
        selectedText={viewReady && editor?.state.selection.empty ? '' : (viewReady ? editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ') : '') || ''}
      />

      <TableInsertModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onInsert={handleTableInsert}
      />

      {showTableMenu && viewReady && (
        <TableMenu
          editor={editor}
          isOpen={showTableMenu}
          position={tableMenuPosition}
          onClose={() => setShowTableMenu(false)}
        />
      )}

      {/* Floating AI Chat Trigger Button */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transition-all duration-200 flex items-center justify-center z-50 group"
          title="Open AI Chat"
        >
          <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      <AISidebarChat
        editor={editor}
        documentContent={viewReady ? (editor?.getText() || '') : ''}
        documentTitle={title}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />

      {contextMenu.visible && viewReady && (
        <EditorContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          selectedText={contextMenu.selectedText}
          onClose={() => setContextMenu({ ...contextMenu, visible: false })}
          onFormat={handleContextFormat}
          onAIAction={handleContextAIAction}
          onInsert={handleContextInsert}
          onBasicAction={handleContextBasicAction}
        />
      )}

      <KeyboardShortcutsPanel
        open={showKeyboardShortcuts}
        onOpenChange={setShowKeyboardShortcuts}
      />

      <LinkInsertModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onInsert={handleLinkInsert}
        initialUrl={viewReady ? editor?.getAttributes('link').href : ''}
        initialText={viewReady && !editor?.state.selection.empty ? editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ') : ''}
      />

      <ImageInsertModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onInsert={(url) => insertImage(url)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,.html,.htm,text/markdown,text/plain,text/html"
        className="hidden"
        onChange={handleFileChosen}
      />
      
      {/* 💬 Comment System */}
      {viewReady && <CommentSidebar editor={editor} />}
      
      {showCommentButton && viewReady && (
        <AddCommentButton
          editor={editor}
          position={commentButtonPosition}
          selectedText={selectedTextForComment}
          onClose={() => setShowCommentButton(false)}
        />
      )}
      
      {/* Collaboration UI - DISABLED (Yjs removed) */}
      {/* Sync Status Indicator - DISABLED (Yjs removed) */}
      
      {/* Share Modal */}
      {showShareModal && userRole && documentId && (
        <ShareModal
          documentId={documentId}
          userRole={userRole}
          isAuthenticated={isAuthenticated}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
      
      {/* Version History Panel */}
      {showVersionHistory && userRole && documentId && (
        <VersionHistoryPanel
          documentId={documentId}
          userRole={userRole}
          isAuthenticated={isAuthenticated}
          isOpen={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          syncStatus={documentSyncStatus}
          cloudId={documentCloudId}
          currentContent={editor ? editor.getText() : ''}
          editor={editor}
          onReplaceVersion={(content) => {
            if (editor) {
              editor.commands.setContent(content);
              toast({ title: 'Version restored', description: 'Current document has been replaced' });
            }
          }}
          onRestoreComplete={(newDocId) => {
            if (newDocId) {
              // Navigate to new document
              window.location.href = `/workspace/doc/${newDocId}/edit`;
            } else {
              // Reload current document after overwrite
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
};
