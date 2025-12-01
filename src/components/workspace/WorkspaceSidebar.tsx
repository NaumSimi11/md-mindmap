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
  const [workspace, setWorkspace] = useState(workspaceService.getCurrentWorkspace());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<'all' | 'recent' | 'starred'>('all');
  const [showNewDocModal, setShowNewDocModal] = useState(false);

  // Refresh workspace data
  const refreshWorkspace = () => {
    setWorkspace(workspaceService.getCurrentWorkspace());
  };

  // Initialize expanded folders
  useEffect(() => {
    const initialExpanded = new Set<string>();
    workspace.folders.forEach(folder => {
      if (folder.expanded) {
        initialExpanded.add(folder.id);
      }
    });
    setExpandedFolders(initialExpanded);
  }, []);

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
    workspaceService.toggleFolderExpanded(folderId);
  };

  const handleCreateFolder = () => {
    const name = prompt('Folder name:');
    if (name) {
      workspaceService.createFolder(name, null, '📁');
      refreshWorkspace();
    }
  };

  const handleRenameFolder = (folderId: string, currentName: string) => {
    const name = prompt('New folder name:', currentName);
    if (name && name !== currentName) {
      workspaceService.renameFolder(folderId, name);
      refreshWorkspace();
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    if (confirm('Delete this folder? Documents will be moved to the parent folder.')) {
      workspaceService.deleteFolder(folderId);
      refreshWorkspace();
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm('Delete this document? This cannot be undone.')) {
      await workspaceService.deleteDocument(documentId);
      refreshWorkspace();
    }
  };

  const handleToggleStar = (documentId: string) => {
    workspaceService.toggleStar(documentId);
    refreshWorkspace();
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

  const filteredDocuments = searchQuery
    ? workspaceService.searchDocuments(searchQuery)
    : activeSection === 'recent'
      ? workspaceService.getRecentDocuments()
      : activeSection === 'starred'
        ? workspaceService.getStarredDocuments()
        : workspace.documents;

  const rootFolders = workspace.folders.filter(f => f.parentId === null);

  return (
    <div className="w-72 border-r border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <span>{workspace.icon}</span>
            <span>{workspace.name}</span>
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
        </div>
      </div>

      {/* New Document Modal */}
      <NewDocumentModal
        isOpen={showNewDocModal}
        onClose={() => setShowNewDocModal(false)}
        onDocumentCreated={(docId) => {
          refreshWorkspace();
          onDocumentSelect(docId);
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
              {/* Root Level Documents */}
              {workspaceService.getDocumentsInFolder(null).map(doc => (
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
              ))}

              {/* Folders */}
              {rootFolders.map(folder => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  expanded={expandedFolders.has(folder.id)}
                  onToggle={() => toggleFolder(folder.id)}
                  onRename={(name) => handleRenameFolder(folder.id, name)}
                  onDelete={() => handleDeleteFolder(folder.id)}
                  currentDocumentId={currentDocumentId}
                  onDocumentSelect={onDocumentSelect}
                  onToggleStar={handleToggleStar}
                  onDeleteDocument={handleDeleteDocument}
                  getDocumentIcon={getDocumentIcon}
                  allFolders={workspace.folders}
                  allDocuments={workspace.documents}
                  expandedFolders={expandedFolders}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>{workspace.documents.length} documents</span>
          <span>{workspace.folders.length} folders</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FolderItem Component
// ============================================================================

interface FolderItemProps {
  folder: WorkspaceFolder;
  expanded: boolean;
  onToggle: () => void;
  onRename: (currentName: string) => void;
  onDelete: () => void;
  currentDocumentId?: string;
  onDocumentSelect: (documentId: string) => void;
  onToggleStar: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  getDocumentIcon: (type: Document['type']) => JSX.Element;
  allFolders: WorkspaceFolder[];
  allDocuments: Document[];
  expandedFolders: Set<string>;
  level?: number;
}

function FolderItem({
  folder,
  expanded,
  onToggle,
  onRename,
  onDelete,
  currentDocumentId,
  onDocumentSelect,
  onToggleStar,
  onDeleteDocument,
  getDocumentIcon,
  allFolders,
  allDocuments,
  expandedFolders,
  level = 0,
}: FolderItemProps) {
  const documentsInFolder = allDocuments.filter(d => d.folderId === folder.id);
  const subfolders = allFolders.filter(f => f.parentId === folder.id);

  return (
    <div>
      {/* Folder Header */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-accent cursor-pointer group"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <button onClick={onToggle} className="flex items-center flex-1 min-w-0">
          {expanded ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          )}
          <Folder className="h-4 w-4 mx-1 flex-shrink-0 text-yellow-600" />
          <span className="text-sm truncate">{folder.name}</span>
          <span className="text-xs text-muted-foreground ml-1">
            ({documentsInFolder.length})
          </span>
        </button>

        {/* Folder Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded">
              <MoreVertical className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRename(folder.name)}>
              <Edit className="h-3 w-3 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="h-3 w-3 mr-2" />
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
            <div key={doc.id} style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}>
              <DocumentItem
                document={doc}
                isActive={doc.id === currentDocumentId}
                onClick={() => {
                  workspaceService.markDocumentOpened(doc.id);
                  onDocumentSelect(doc.id);
                }}
                onToggleStar={() => onToggleStar(doc.id)}
                onDelete={() => onDeleteDocument(doc.id)}
                getIcon={getDocumentIcon}
              />
            </div>
          ))}

          {/* Subfolders */}
          {subfolders.map(subfolder => (
            <FolderItem
              key={subfolder.id}
              folder={subfolder}
              expanded={expandedFolders.has(subfolder.id)}
              onToggle={() => workspaceService.toggleFolderExpanded(subfolder.id)}
              onRename={(name) => {
                const newName = prompt('New folder name:', name);
                if (newName && newName !== name) {
                  workspaceService.renameFolder(subfolder.id, newName);
                }
              }}
              onDelete={() => {
                if (confirm('Delete this folder?')) {
                  workspaceService.deleteFolder(subfolder.id);
                }
              }}
              currentDocumentId={currentDocumentId}
              onDocumentSelect={onDocumentSelect}
              onToggleStar={onToggleStar}
              onDeleteDocument={onDeleteDocument}
              getDocumentIcon={getDocumentIcon}
              allFolders={allFolders}
              allDocuments={allDocuments}
              expandedFolders={expandedFolders}
              level={level + 1}
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
}

function DocumentItem({
  document,
  isActive,
  onClick,
  onToggleStar,
  onDelete,
  getIcon,
}: DocumentItemProps) {
  return (
    <div
      className={`
        flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group
        ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}
      `}
      onClick={onClick}
    >
      {getIcon(document.type)}
      <span className="text-sm truncate flex-1">{document.title}</span>

      {/* Star Icon */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar();
        }}
        className="opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"
      >
        <Star
          className={`h-3 w-3 ${document.starred ? 'fill-yellow-500 text-yellow-500' : ''}`}
        />
      </button>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded"
          >
            <MoreVertical className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onToggleStar}>
            <Star className="h-3 w-3 mr-2" />
            {document.starred ? 'Unstar' : 'Star'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            <Trash2 className="h-3 w-3 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

