/**
 * AdaptiveSidebar - Smart sidebar that adapts to context
 * 
 * Shows:
 * - "All Documents" view when browsing workspace
 * - "Outline" view when editing a document
 * - Toggle button to switch between modes
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileStack, Hash, ChevronLeft, ChevronRight, FolderOpen, Plus } from 'lucide-react';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { DocumentOutline } from '../editor/DocumentOutline';
import { ContextDocuments } from './ContextDocuments';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdaptiveSidebarProps {
  // Document editing
  isEditingDocument: boolean;
  documentContent?: string;
  onHeadingClick?: (text: string, line: number) => void;
  currentLine?: number;
  activeHeadingText?: string;
  
  // Workspace navigation
  onDocumentSelect: (documentId: string) => void;
  onNewDocument?: () => void;
  currentDocumentId?: string;
  
  // Context folders
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
  onContextFoldersChange?: (folders: Array<{
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
  }>) => void;
  
  // Layout
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  
  // Editor integration
  onInsertContent?: (content: string) => void;
}

export function AdaptiveSidebar({
  isEditingDocument,
  documentContent = '',
  onHeadingClick,
  currentLine = 0,
  activeHeadingText,
  onDocumentSelect,
  onNewDocument,
  currentDocumentId,
  contextFolders = [],
  onContextFoldersChange,
  collapsed = false,
  onToggleCollapse,
  onInsertContent,
}: AdaptiveSidebarProps) {
  const [activeTab, setActiveTab] = useState<'documents' | 'outline' | 'context'>('outline');

  // When editing, default to outline; when browsing, show documents
  const defaultTab = isEditingDocument ? 'outline' : 'documents';
  const currentTab = isEditingDocument ? activeTab : 'documents';

  if (collapsed) {
    return (
      <div className="w-12 border-r border-border bg-card flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-8 h-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-72 border-r border-border bg-card flex flex-col h-full">
      {/* Show tabs only when editing a document */}
      {isEditingDocument ? (
        <Tabs value={currentTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full">
          {/* Main Tab Switcher at Top */}
          <div className="border-b border-border px-2 py-2">
            <div className="flex items-center gap-1">
              <Button
                variant={currentTab === 'documents' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('documents')}
                className="flex-1 h-8 text-xs"
              >
                <FileStack className="h-3 w-3 mr-1" />
                All Docs
              </Button>
              <Button
                variant={currentTab === 'outline' || currentTab === 'context' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('outline')}
                className="flex-1 h-8 text-xs"
              >
                <Hash className="h-3 w-3 mr-1" />
                This Doc
              </Button>
            </div>
          </div>

          {/* Tab Content for All Documents */}
          <TabsContent value="documents" className="flex-1 m-0 overflow-hidden">
            <WorkspaceSidebar
              onDocumentSelect={onDocumentSelect}
              currentDocumentId={currentDocumentId}
            />
          </TabsContent>

          {/* Shared Header and Subtabs for This Doc (shown for both outline and context) */}
          {(currentTab === 'outline' || currentTab === 'context') && (
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Document Outline</h3>
              </div>
              
              {/* Subtabs below header */}
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                <button
                  onClick={() => setActiveTab('outline')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded transition-colors ${
                    currentTab === 'outline' 
                      ? 'bg-background font-medium shadow-sm' 
                      : 'hover:bg-background/50'
                  }`}
                >
                  <Hash className="h-3 w-3" />
                  Outline
                </button>
                <button
                  onClick={() => setActiveTab('context')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded transition-colors ${
                    currentTab === 'context' 
                      ? 'bg-background font-medium shadow-sm' 
                      : 'hover:bg-background/50'
                  }`}
                >
                  <FolderOpen className="h-3 w-3" />
                  Context
                </button>
              </div>
            </div>
          )}

          {/* Tab Content for Outline */}
          <TabsContent value="outline" className="flex-1 m-0 overflow-hidden">
            <DocumentOutline
              content={documentContent}
              onHeadingClick={onHeadingClick}
              currentLine={currentLine}
              activeHeadingText={activeHeadingText}
              showHeader={false}
            />
          </TabsContent>

          {/* Tab Content for Context */}
          <TabsContent value="context" className="flex-1 m-0 overflow-hidden">
            <ContextDocuments 
              folders={contextFolders}
              onFoldersChange={onContextFoldersChange}
              onInsertContent={onInsertContent}
            />
          </TabsContent>

          {/* Collapse Button */}
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="w-full justify-start gap-2 text-xs"
            >
              <ChevronLeft className="h-4 w-4" />
              Collapse Sidebar
            </Button>
          </div>
        </Tabs>
      ) : (
        /* When not editing, just show workspace sidebar */
        <WorkspaceSidebar
          onDocumentSelect={onDocumentSelect}
          currentDocumentId={currentDocumentId}
        />
      )}
    </div>
  );
}
