/**
 * WorkspaceDownloadTab - Download workspace content with hierarchy selection
 * 
 * Features:
 * - Recursive folder/document tree with checkboxes
 * - Partial selection states (indeterminate)
 * - Progress indication for large downloads
 * - Preserves folder structure in ZIP
 * - Document title + timestamp filenames
 * 
 * Works for both:
 * - Guest users (local IndexedDB content)
 * - Authenticated users (cloud content)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  CheckSquare,
  Square,
  MinusSquare,
  Loader2,
  Package,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceData } from '@/contexts/workspace/WorkspaceDataContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useBackendFolders } from '@/hooks/useBackendFolders';
import { useAuth } from '@/hooks/useAuth';
import { guestWorkspaceService } from '@/services/workspace/GuestWorkspaceService';
import { yjsDocumentManager } from '@/services/yjs/YjsDocumentManager';
import { toast } from 'sonner';
import type { DocumentMeta } from '@/services/workspace/types';

// ============================================================================
// Types
// ============================================================================

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'document';
  children: TreeNode[];
  documentData?: DocumentMeta;
  folderData?: any;  // FolderTree from useBackendFolders
  isExpanded: boolean;
}

interface SelectionState {
  selected: Set<string>;  // IDs of selected items
  partial: Set<string>;   // IDs of partially selected folders
}

interface DownloadProgress {
  status: 'idle' | 'preparing' | 'extracting' | 'zipping' | 'complete' | 'error';
  current: number;
  total: number;
  currentItem: string;
  error?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format timestamp for filename: 20241210_143022
 */
function formatTimestamp(date: Date | string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${mins}${secs}`;
}

/**
 * Sanitize filename for ZIP (remove invalid chars)
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

/**
 * Format file size for display
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// Tree Building
// ============================================================================

/**
 * Build hierarchical tree from FolderTree (already hierarchical) and documents
 * FolderTree from useBackendFolders already has nested children structure
 */
function buildTree(
  folderTree: any[],  // FolderTree[] from useBackendFolders (already hierarchical)
  documents: DocumentMeta[]
): TreeNode[] {
  // Build folder ID set for quick lookup
  const allFolderIds = new Set<string>();
  const collectFolderIds = (folders: any[]) => {
    for (const folder of folders) {
      allFolderIds.add(folder.id);
      if (folder.children && folder.children.length > 0) {
        collectFolderIds(folder.children);
      }
    }
  };
  collectFolderIds(folderTree);
  
  // Group documents by folder
  const docsByFolder = new Map<string | null, DocumentMeta[]>();
  for (const doc of documents) {
    const folderId = doc.folderId && allFolderIds.has(doc.folderId) ? doc.folderId : null;
    if (!docsByFolder.has(folderId)) {
      docsByFolder.set(folderId, []);
    }
    docsByFolder.get(folderId)!.push(doc);
  }
  
  // Recursively convert FolderTree to TreeNode
  const convertFolder = (folder: any): TreeNode => {
    const folderDocs = docsByFolder.get(folder.id) || [];
    const docNodes: TreeNode[] = folderDocs.map(doc => ({
      id: doc.id,
      name: doc.title,
      type: 'document' as const,
      children: [],
      documentData: doc,
      isExpanded: false,
    }));
    
    const childFolders = (folder.children || []).map(convertFolder);
    
    return {
      id: folder.id,
      name: folder.name,
      type: 'folder',
      children: [...childFolders, ...docNodes],  // Folders first, then docs
      folderData: folder,
      isExpanded: true,
    };
  };
  
  // Build root nodes
  const rootNodes: TreeNode[] = [];
  
  // Add folders
  for (const folder of folderTree) {
    rootNodes.push(convertFolder(folder));
  }
  
  // Add root documents (not in any folder)
  const rootDocs = docsByFolder.get(null) || [];
  for (const doc of rootDocs) {
    rootNodes.push({
      id: doc.id,
      name: doc.title,
      type: 'document',
      children: [],
      documentData: doc,
      isExpanded: false,
    });
  }
  
  // Sort: folders first, then alphabetically
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortNodes(node.children);
      }
    }
  };
  
  sortNodes(rootNodes);
  return rootNodes;
}

/**
 * Get all document IDs in a subtree
 */
function getAllDocumentIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  
  const traverse = (node: TreeNode) => {
    if (node.type === 'document') {
      ids.push(node.id);
    }
    for (const child of node.children) {
      traverse(child);
    }
  };
  
  for (const node of nodes) {
    traverse(node);
  }
  
  return ids;
}

/**
 * Count documents in subtree
 */
function countDocuments(node: TreeNode): number {
  if (node.type === 'document') return 1;
  return node.children.reduce((sum, child) => sum + countDocuments(child), 0);
}

// ============================================================================
// Selection Logic
// ============================================================================

/**
 * Calculate selection state for a folder based on its children
 */
function calculateFolderState(
  node: TreeNode,
  selected: Set<string>
): 'none' | 'partial' | 'all' {
  if (node.type === 'document') {
    return selected.has(node.id) ? 'all' : 'none';
  }
  
  const childStates = node.children.map(child => 
    calculateFolderState(child, selected)
  );
  
  if (childStates.length === 0) return 'none';
  
  const allSelected = childStates.every(s => s === 'all');
  const noneSelected = childStates.every(s => s === 'none');
  
  if (allSelected) return 'all';
  if (noneSelected) return 'none';
  return 'partial';
}

/**
 * Toggle selection for a node (with cascade logic)
 */
function toggleSelection(
  node: TreeNode,
  selected: Set<string>,
  tree: TreeNode[]
): Set<string> {
  const newSelected = new Set(selected);
  
  if (node.type === 'document') {
    // Toggle document
    if (newSelected.has(node.id)) {
      newSelected.delete(node.id);
    } else {
      newSelected.add(node.id);
    }
  } else {
    // Toggle folder: select/deselect all documents in subtree
    const state = calculateFolderState(node, selected);
    const docIds = getAllDocumentIds([node]);
    
    if (state === 'all') {
      // Deselect all
      for (const id of docIds) {
        newSelected.delete(id);
      }
    } else {
      // Select all
      for (const id of docIds) {
        newSelected.add(id);
      }
    }
  }
  
  return newSelected;
}

// ============================================================================
// ZIP Generation (Client-Side)
// ============================================================================

/**
 * Generate ZIP file from selected documents
 * Note: Requires JSZip library - npm install jszip
 */
async function generateZip(
  workspaceName: string,
  tree: TreeNode[],
  selectedIds: Set<string>,
  onProgress: (progress: DownloadProgress) => void
): Promise<Blob> {
  // Dynamic import JSZip
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  const timestamp = formatTimestamp(new Date());
  const rootFolder = zip.folder(sanitizeFilename(`${workspaceName}_${timestamp}`));
  
  if (!rootFolder) {
    throw new Error('Failed to create ZIP folder');
  }
  
  // Collect all selected documents with their paths
  const documentsToExport: Array<{
    doc: DocumentMeta;
    path: string;
  }> = [];
  
  const collectDocuments = (nodes: TreeNode[], currentPath: string) => {
    for (const node of nodes) {
      if (node.type === 'document' && selectedIds.has(node.id) && node.documentData) {
        documentsToExport.push({
          doc: node.documentData,
          path: currentPath,
        });
      } else if (node.type === 'folder') {
        const folderPath = currentPath 
          ? `${currentPath}/${sanitizeFilename(node.name)}`
          : sanitizeFilename(node.name);
        collectDocuments(node.children, folderPath);
      }
    }
  };
  
  collectDocuments(tree, '');
  
  // Process each document
  const total = documentsToExport.length;
  let current = 0;
  
  for (const { doc, path } of documentsToExport) {
    current++;
    onProgress({
      status: 'extracting',
      current,
      total,
      currentItem: doc.title,
    });
    
    // Get content
    let content = '';
    
    try {
      // Try to get content from Yjs if document is open
      const yjsInstance = yjsDocumentManager.getDocumentInstance(doc.id);
      if (yjsInstance && yjsInstance.ydoc) {
        // Get content from Yjs
        const xmlFragment = yjsInstance.ydoc.getXmlFragment('prosemirror');
        // Simple text extraction - can be enhanced
        content = xmlFragment.toDOM().textContent || '';
      } else {
        // Fall back to IndexedDB content
        const fullDoc = await guestWorkspaceService.getDocument(doc.id);
        content = fullDoc?.content || '';
      }
    } catch (error) {
      console.warn(`Failed to get content for ${doc.title}:`, error);
      content = doc.content || ''; // Last resort fallback
    }
    
    // Generate filename with timestamp
    const docTimestamp = formatTimestamp(doc.updatedAt);
    const filename = sanitizeFilename(`${doc.title}_${docTimestamp}.md`);
    const fullPath = path ? `${path}/${filename}` : filename;
    
    rootFolder.file(fullPath, content);
  }
  
  onProgress({
    status: 'zipping',
    current: total,
    total,
    currentItem: 'Creating ZIP file...',
  });
  
  // Generate ZIP
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  
  onProgress({
    status: 'complete',
    current: total,
    total,
    currentItem: 'Download ready!',
  });
  
  return blob;
}

/**
 * Trigger browser download
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Component: TreeNodeItem
// ============================================================================

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  selected: Set<string>;
  onToggle: (node: TreeNode) => void;
  onExpand: (nodeId: string) => void;
  expandedIds: Set<string>;
}

function TreeNodeItem({
  node,
  depth,
  selected,
  onToggle,
  onExpand,
  expandedIds,
}: TreeNodeItemProps) {
  const isExpanded = expandedIds.has(node.id);
  const state = calculateFolderState(node, selected);
  
  const hasChildren = node.type === 'folder' && node.children.length > 0;
  const docCount = node.type === 'folder' ? countDocuments(node) : 0;
  
  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors group"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Expand/Collapse for folders */}
        {node.type === 'folder' ? (
          <button
            onClick={() => onExpand(node.id)}
            className="p-0.5 hover:bg-muted rounded transition-colors"
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}
        
        {/* Checkbox */}
        <button
          onClick={() => onToggle(node)}
          className="flex-shrink-0"
        >
          {state === 'all' ? (
            <CheckSquare className="h-4 w-4 text-primary" />
          ) : state === 'partial' ? (
            <MinusSquare className="h-4 w-4 text-primary/60" />
          ) : (
            <Square className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </button>
        
        {/* Icon */}
        {node.type === 'folder' ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 text-amber-500 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-amber-500 flex-shrink-0" />
          )
        ) : (
          <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
        )}
        
        {/* Name */}
        <span className="text-sm truncate flex-1">
          {node.name}
        </span>
        
        {/* Metadata */}
        {node.type === 'folder' && docCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {docCount} {docCount === 1 ? 'doc' : 'docs'}
          </span>
        )}
        {node.type === 'document' && node.documentData && (
          <span className="text-xs text-muted-foreground">
            {formatSize(node.documentData.content?.length || 0)}
          </span>
        )}
      </div>
      
      {/* Children */}
      {node.type === 'folder' && isExpanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selected={selected}
              onToggle={onToggle}
              onExpand={onExpand}
              expandedIds={expandedIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WorkspaceDownloadTab() {
  const { currentWorkspace } = useWorkspaceData();
  const { documents } = useWorkspace();
  const { folderTree, isLoading: foldersLoading } = useBackendFolders();
  const { isAuthenticated } = useAuth();
  
  // State
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<DownloadProgress>({
    status: 'idle',
    current: 0,
    total: 0,
    currentItem: '',
  });
  
  // Build tree from documents and folderTree
  useEffect(() => {
    const newTree = buildTree(folderTree || [], documents || []);
    setTree(newTree);
    
    // Expand all folders by default
    const allFolderIds = new Set<string>();
    const collectFolderIds = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.type === 'folder') {
          allFolderIds.add(node.id);
          collectFolderIds(node.children);
        }
      }
    };
    collectFolderIds(newTree);
    setExpandedIds(allFolderIds);
  }, [documents, folderTree]);
  
  // Handlers
  const handleToggle = useCallback((node: TreeNode) => {
    setSelected(prev => toggleSelection(node, prev, tree));
  }, [tree]);
  
  const handleExpand = useCallback((nodeId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);
  
  const handleSelectAll = useCallback(() => {
    const allDocIds = getAllDocumentIds(tree);
    setSelected(new Set(allDocIds));
  }, [tree]);
  
  const handleDeselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);
  
  const handleDownload = useCallback(async () => {
    if (selected.size === 0) {
      toast.error('Please select at least one document to download');
      return;
    }
    
    try {
      setProgress({
        status: 'preparing',
        current: 0,
        total: selected.size,
        currentItem: 'Preparing download...',
      });
      
      const workspaceName = currentWorkspace?.name || 'Workspace';
      const blob = await generateZip(workspaceName, tree, selected, setProgress);
      
      const timestamp = formatTimestamp(new Date());
      const filename = sanitizeFilename(`${workspaceName}_${timestamp}.zip`);
      
      downloadBlob(blob, filename);
      toast.success(`Downloaded ${selected.size} documents`);
      
      // Reset after short delay
      setTimeout(() => {
        setProgress({
          status: 'idle',
          current: 0,
          total: 0,
          currentItem: '',
        });
      }, 2000);
      
    } catch (error: any) {
      console.error('Download failed:', error);
      setProgress({
        status: 'error',
        current: 0,
        total: 0,
        currentItem: '',
        error: error.message || 'Download failed',
      });
      toast.error('Download failed: ' + (error.message || 'Unknown error'));
    }
  }, [selected, tree, currentWorkspace]);
  
  // Stats
  const totalDocs = useMemo(() => getAllDocumentIds(tree).length, [tree]);
  const selectedCount = selected.size;
  
  // Estimate size
  const estimatedSize = useMemo(() => {
    let size = 0;
    const traverse = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.type === 'document' && selected.has(node.id) && node.documentData) {
          size += node.documentData.content?.length || 0;
        }
        traverse(node.children);
      }
    };
    traverse(tree);
    return size;
  }, [tree, selected]);
  
  const isDownloading = progress.status !== 'idle' && progress.status !== 'error';
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Content
            </CardTitle>
            <CardDescription className="mt-1">
              Select documents to download as a ZIP file
            </CardDescription>
          </div>
          <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
            {isAuthenticated ? 'Cloud Workspace' : 'Local Workspace'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Selection Summary */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">{selectedCount}</span>
              <span className="text-muted-foreground"> of {totalDocs} documents selected</span>
            </div>
            {selectedCount > 0 && (
              <div className="text-sm text-muted-foreground">
                ~{formatSize(estimatedSize)}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              disabled={isDownloading}
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeselectAll}
              disabled={isDownloading || selectedCount === 0}
            >
              Deselect All
            </Button>
          </div>
        </div>
        
        {/* Progress */}
        {isDownloading && (
          <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {progress.status === 'complete' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {progress.currentItem}
              </span>
              <span className="text-muted-foreground">
                {progress.current} / {progress.total}
              </span>
            </div>
            <Progress 
              value={(progress.current / progress.total) * 100} 
              className="h-2"
            />
          </div>
        )}
        
        {/* Error */}
        {progress.status === 'error' && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {progress.error}
          </div>
        )}
        
        {/* Content Tree */}
        <ScrollArea className="h-[400px] border rounded-lg">
          <div className="p-2">
            {foldersLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 mb-4 animate-spin" />
                <p>Loading workspace content...</p>
              </div>
            ) : tree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p>No documents in this workspace</p>
              </div>
            ) : (
              tree.map(node => (
                <TreeNodeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  selected={selected}
                  onToggle={handleToggle}
                  onExpand={handleExpand}
                  expandedIds={expandedIds}
                />
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Download Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleDownload}
            disabled={selectedCount === 0 || isDownloading}
            className="gap-2"
            size="lg"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download {selectedCount > 0 ? `(${selectedCount} files)` : ''}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

