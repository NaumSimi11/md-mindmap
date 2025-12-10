/**
 * WorkspaceSidebar - Main navigation for documents and folders
 * 
 * Features:
 * - Folder tree (expandable/collapsible)
 * - Document list with icons
 * - Search bar
 * - New document/folder buttons
 * - Drag-and-drop to organize
 * - Context menus (right-click)
 * - Recent documents section
 * - Starred documents section
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Search,
  FileText,
  Brain,
  Presentation,
  Folder,
  Star,
  Clock,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Edit,
  Trash2,
  FolderPlus,
} from 'lucide-react';
import { workspaceService, type Document, type Folder as WorkspaceFolder } from '@/services/workspace/WorkspaceService';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useBackendFolders } from '@/hooks/useBackendFolders';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { CreateFolderModal } from './CreateFolderModal';
import { ImportDocumentButton } from './ImportDocumentButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NewDocumentModal } from './NewDocumentModal';

interface WorkspaceSidebarProps {
  onDocumentSelect: (documentId: string) => void;
  currentDocumentId?: string;
  onLoadDemo?: () => void;
}

export function WorkspaceSidebar({
  onDocumentSelect,
  currentDocumentId,
  onLoadDemo,
}: WorkspaceSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  // 🔥 USE SHARED WORKSPACE CONTEXT
  const { documents: backendDocuments, currentWorkspace, updateDocument: backendUpdateDocument } = useWorkspace();
  const { folderTree, createFolder, updateFolder, deleteFolder } = useBackendFolders();
  
  // Force re-render on workspace change
  const workspaceKey = currentWorkspace?.id || 'no-workspace';
  
  // Calculate document distribution
  const rootDocs = backendDocuments.filter(doc => !doc.folderId);
  const docsInFolders = backendDocuments.filter(doc => doc.folderId);
  
  // Collect all folder IDs (including nested)
  const folderIds = new Set<string>();
  const collectFolderIds = (folders: any[]) => {
    folders.forEach(f => {
      folderIds.add(f.id);
      if (f.children) collectFolderIds(f.children);
    });
  };
  collectFolderIds(folderTree);
  
  const orphanDocs = docsInFolders.filter(doc => !folderIds.has(doc.folderId!));
  
  console.log('🔍 WorkspaceSidebar render:', {
    workspace: currentWorkspace?.name,
    total: backendDocuments.length,
    rootDocs: rootDocs.length,
    docsInFolders: docsInFolders.length,
    orphanDocs: orphanDocs.length,
    folders: folderTree.length
  });
  
  if (orphanDocs.length > 0) {
    console.warn('⚠️ Orphan documents (folder_id points to non-existent folder):', orphanDocs.map(d => ({title: d.title, folderId: d.folderId})));
  }
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<'all' | 'recent' | 'starred'>('all');
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  
  // Auto-expand all folders when they load
  useEffect(() => {
    if (folderTree.length > 0) {
      const allFolderIds = new Set<string>();
      const collectIds = (folders: any[]) => {
        folders.forEach(f => {
          allFolderIds.add(f.id);
          if (f.children) collectIds(f.children);
        });
      };
      collectIds(folderTree);
      setExpandedFolders(allFolderIds);
    }
  }, [folderTree]);
  
  // Drag and drop
  const {
    draggedItem,
    dropTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop();

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateFolder = () => {
    setShowCreateFolderModal(true);
  };

  const handleRenameFolder = async (folderId: string, currentName: string) => {
    const name = prompt('Rename folder:', currentName);
    if (name && name !== currentName) {
      await updateFolder(folderId, { name });
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (confirm('Delete this folder and all its contents?')) {
      await deleteFolder(folderId);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm('Delete this document? This cannot be undone.')) {
      await workspaceService.deleteDocument(documentId);
    }
  };

  const handleToggleStar = async (documentId: string) => {
    const doc = backendDocuments.find(d => d.id === documentId);
    if (!doc) return;
    
    try {
      await backendUpdateDocument(documentId, { starred: !doc.starred });
      console.log('✅ Toggled star:', doc.title);
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const handleMoveDocument = async (documentId: string, folderId: string | null) => {
    try {
      await backendUpdateDocument(documentId, { folderId });
      console.log(`✅ Moved document to folder: ${folderId || 'root'}`);
    } catch (error) {
      console.error('Failed to move document:', error);
    }
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

  // 🔥 USE BACKEND DOCUMENTS instead of localStorage
  const filteredDocuments = searchQuery
    ? backendDocuments.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeSection === 'recent'
      ? backendDocuments.sort((a, b) => 
          (b.lastOpenedAt?.getTime() || 0) - (a.lastOpenedAt?.getTime() || 0)
        ).slice(0, 10)
      : activeSection === 'starred'
        ? backendDocuments.filter(doc => doc.starred)
        : backendDocuments;

  return (
    <div key={workspaceKey} className="w-72 border-r border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <span>{currentWorkspace?.icon || '🚀'}</span>
            <span>{currentWorkspace?.name || 'My Workspace'}</span>
          </h2>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* New Buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setShowNewDocModal(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Doc
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateFolder}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Import Button */}
          <ImportDocumentButton variant="outline" size="sm" className="w-full" />
        </div>
      </div>

      {/* New Document Modal */}
      <NewDocumentModal
        isOpen={showNewDocModal}
        onClose={() => setShowNewDocModal(false)}
        onDocumentCreated={(docId) => {
          onDocumentSelect(docId);
        }}
      />

      {/* Create Folder Modal */}
      <CreateFolderModal
        open={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onCreate={async (data) => {
          await createFolder(data);
        }}
      />

      {/* Section Tabs */}
      <div className="flex border-b border-border">
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${activeSection === 'all'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
            }`}
          onClick={() => setActiveSection('all')}
        >
          All
        </button>
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${activeSection === 'recent'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
            }`}
          onClick={() => setActiveSection('recent')}
        >
          <Clock className="h-3 w-3 inline mr-1" />
          Recent
        </button>
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${activeSection === 'starred'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
            }`}
          onClick={() => setActiveSection('starred')}
        >
          <Star className="h-3 w-3 inline mr-1" />
          Starred
        </button>
      </div>

      {/* Document List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {searchQuery ? (
            // Search Results
            <div className="space-y-1">
              {filteredDocuments.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No documents found
                </div>
              ) : (
                filteredDocuments.map(doc => (
                  <DocumentItem
                    key={doc.id}
                    document={doc}
                    isActive={doc.id === currentDocumentId}
                    onClick={() => {
                      workspaceService.markDocumentOpened(doc.id);
                      onDocumentSelect(doc.id);
                    }}
                    onToggleStar={() => handleToggleStar(doc.id)}
                    onDelete={() => handleDeleteDocument(doc.id)}
                    getIcon={getDocumentIcon}
                  />
                ))
              )}
            </div>
          ) : activeSection === 'recent' || activeSection === 'starred' ? (
            // Recent or Starred
            <div className="space-y-1">
              {filteredDocuments.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  {activeSection === 'recent' ? 'No recent documents' : 'No starred documents'}
                </div>
              ) : (
                filteredDocuments.map(doc => (
                  <DocumentItem
                    key={doc.id}
                    document={doc}
                    isActive={doc.id === currentDocumentId}
                    onClick={() => {
                      workspaceService.markDocumentOpened(doc.id);
                      onDocumentSelect(doc.id);
                    }}
                    onToggleStar={() => handleToggleStar(doc.id)}
                    onDelete={() => handleDeleteDocument(doc.id)}
                    getIcon={getDocumentIcon}
                  />
                ))
              )}
            </div>
          ) : (
            // All Documents - Folder Tree View
            <div className="space-y-1">
              {/* Root Level Documents + Orphans - 🔥 USE BACKEND DOCUMENTS */}
              {backendDocuments
                .filter(doc => !doc.folderId || !folderIds.has(doc.folderId)) // Root docs + orphans
                .map(doc => (
                <DocumentItem
                  key={doc.id}
                  document={doc}
                  isActive={doc.id === currentDocumentId}
                  onClick={() => {
                    onDocumentSelect(doc.id);
                  }}
                  onToggleStar={() => handleToggleStar(doc.id)}
                  onDelete={() => handleDeleteDocument(doc.id)}
                  getIcon={getDocumentIcon}
                  draggable={true}
                  onDragStart={() => handleDragStart({ type: 'document', id: doc.id, title: doc.title })}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedItem?.id === doc.id}
                />
              ))}

              {/* Folders - Backend folders only */}
              {folderTree.length > 0 ? (
                folderTree.map(folder => (
                  <BackendFolderItem
                    key={folder.id}
                    folder={folder}
                    expanded={expandedFolders.has(folder.id)}
                    onToggle={() => toggleFolder(folder.id)}
                    onRename={(name) => handleRenameFolder(folder.id, name)}
                    onDelete={() => handleDeleteFolder(folder.id)}
                    currentDocumentId={currentDocumentId}
                    onDocumentSelect={onDocumentSelect}
                    getDocumentIcon={getDocumentIcon}
                    allDocuments={backendDocuments}
                    expandedFolders={expandedFolders}
                    draggedItem={draggedItem}
                    dropTarget={dropTarget}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onMoveDocument={handleMoveDocument}
                  />
                ))
              ) : (
                // Empty state when no folders
                backendDocuments.length === 0 && (
                  <div className="text-center py-8 px-4">
                    <Folder className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-2">No folders yet</p>
                    <p className="text-xs text-muted-foreground/60 mb-3">
                      Organize documents with folders
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCreateFolder}
                      className="gap-2"
                    >
                      <FolderPlus className="h-4 w-4" />
                      Create First Folder
                    </Button>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>{backendDocuments.length} documents</span>
          <span>{folderTree.length} folders</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BackendFolderItem Component - Uses backend folder tree
// ============================================================================

interface BackendFolderItemProps {
  folder: any; // Backend folder type from useBackendFolders
  expanded: boolean;
  onToggle: () => void;
  onRename: (currentName: string) => void;
  onDelete: () => void;
  currentDocumentId?: string;
  onDocumentSelect: (documentId: string) => void;
  getDocumentIcon: (type: Document['type']) => JSX.Element;
  allDocuments: Document[];
  expandedFolders: Set<string>;
  level?: number;
  // Drag and drop props
  draggedItem: any;
  dropTarget: string | null;
  onDragStart: (item: any) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, targetId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetId: string | null, callback: (draggedId: string, targetId: string | null) => void) => void;
  onMoveDocument: (documentId: string, folderId: string | null) => void;
}

function BackendFolderItem({
  folder,
  expanded,
  onToggle,
  onRename,
  onDelete,
  currentDocumentId,
  onDocumentSelect,
  getDocumentIcon,
  allDocuments,
  expandedFolders,
  level = 0,
  draggedItem,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onMoveDocument,
}: BackendFolderItemProps) {
  const documentsInFolder = allDocuments.filter(d => d.folderId === folder.id);
  const subfolders = folder.children || [];

  return (
    <div>
      {/* Folder Header */}
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent group transition-colors ${
          dropTarget === folder.id ? 'bg-primary/20 border-2 border-primary' : ''
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onDragOver={(e) => onDragOver(e, folder.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, folder.id, (docId, folderId) => onMoveDocument(docId, folderId))}
      >
        {/* Chevron */}
        <button onClick={onToggle} className="flex-shrink-0" title={folder.name}>
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Folder Icon */}
        <Folder className="h-4 w-4 flex-shrink-0 text-yellow-600 cursor-pointer" onClick={onToggle} />

        {/* Folder Name - truncated with fixed max-width */}
        <span 
          className="text-sm truncate cursor-pointer" 
          style={{ maxWidth: '110px' }}
          onClick={onToggle}
          title={folder.name}
        >
          {folder.name}
        </span>

        {/* Document Count */}
        <span className="text-xs text-muted-foreground flex-shrink-0">
          ({documentsInFolder.length})
        </span>

        {/* 3-dot menu - ALWAYS VISIBLE */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              onClick={(e) => e.stopPropagation()}
              className="ml-auto p-1 hover:bg-muted rounded flex-shrink-0"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRename(folder.name)}>
              <Edit className="h-3.5 w-3.5 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Folder Contents (when expanded) */}
      {expanded && (
        <div>
          {/* Documents in this folder */}
          {documentsInFolder.map(doc => (
            <DocumentItem
              key={doc.id}
              document={doc}
              isActive={doc.id === currentDocumentId}
              onClick={() => onDocumentSelect(doc.id)}
              onToggleStar={() => {}}
              onDelete={() => {}}
              getIcon={getDocumentIcon}
              level={level + 1}
              draggable={true}
              onDragStart={() => onDragStart({ type: 'document', id: doc.id, title: doc.title })}
              onDragEnd={onDragEnd}
              isDragging={draggedItem?.id === doc.id}
            />
          ))}

          {/* Subfolders (recursive) */}
          {subfolders.map((subfolder: any) => (
            <BackendFolderItem
              key={subfolder.id}
              folder={subfolder}
              expanded={expandedFolders.has(subfolder.id)}
              onToggle={() => {}}
              onRename={onRename}
              onDelete={onDelete}
              currentDocumentId={currentDocumentId}
              onDocumentSelect={onDocumentSelect}
              getDocumentIcon={getDocumentIcon}
              allDocuments={allDocuments}
              expandedFolders={expandedFolders}
              level={level + 1}
              draggedItem={draggedItem}
              dropTarget={dropTarget}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onMoveDocument={onMoveDocument}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DocumentItem Component
// ============================================================================

interface DocumentItemProps {
  document: Document;
  isActive: boolean;
  onClick: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
  getIcon: (type: Document['type']) => JSX.Element;
  level?: number;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

function DocumentItem({
  document,
  isActive,
  onClick,
  onToggleStar,
  onDelete,
  getIcon,
  level = 0,
  draggable = false,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: DocumentItemProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`
        flex items-center gap-2 px-2 py-1.5 rounded group
        ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}
        ${isDragging ? 'opacity-50' : ''}
      `}
      style={{ paddingLeft: `${level * 12 + 8}px` }}
      title={document.title}
    >
      {/* Icon */}
      <div className="flex-shrink-0" onClick={onClick}>
        {getIcon(document.type)}
      </div>

      {/* Title - fixed max-width, truncates */}
      <span 
        className="text-sm truncate flex-1 cursor-pointer" 
        style={{ maxWidth: '130px' }}
        onClick={onClick}
      >
        {document.title}
      </span>

      {/* 3-dot menu - ALWAYS VISIBLE */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="ml-auto p-1 hover:bg-muted rounded flex-shrink-0"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onToggleStar}>
            <Star className={`h-3.5 w-3.5 mr-2 ${document.starred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
            {document.starred ? 'Unstar' : 'Star'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

