/**
 * AdaptiveSidebar - Premium 2025 SaaS Sidebar Experience
 *
 * Features:
 * - ✨ Glassmorphism design with backdrop blur
 * - 🎨 Gradient accents and premium visual hierarchy
 * - 🌟 Interactive animations and micro-feedback
 * - 📱 Responsive design with collapsible states
 * - 🎯 Clear visual information architecture
 * - 💫 Engaging hover states and transitions
 *
 * Shows:
 * - "All Documents" view when browsing workspace
 * - "Outline" view when editing a document
 * - Toggle button to switch between modes
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileStack, Hash, ChevronLeft, ChevronRight, FolderOpen, Plus, Sparkles, Zap, PanelLeftClose } from 'lucide-react';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { DocumentOutline } from '../editor/DocumentOutline';
import { ContextDocuments } from './ContextDocuments';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import type { Workspace } from '@/services/workspace-legacy/BackendWorkspaceService';
import { useUserWorkspaces } from '@/hooks/useWorkspaceMembers';

interface AdaptiveSidebarProps {
  // Document editing
  isEditingDocument: boolean;
  documentContent?: string;
  onHeadingClick?: (text: string, line: number, headingIndex?: number) => void;
  currentLine?: number;
  activeHeadingText?: string;

  // Workspace navigation
  onDocumentSelect: (documentId: string) => void;
  onNewDocument?: () => void;
  currentDocumentId?: string;
  // Workspace management (single source of truth)
  workspaces?: Workspace[];
  currentWorkspace?: Workspace | null;
  onSwitchWorkspace?: (workspace: Workspace) => void;
  onCreateWorkspace?: () => void;
  onRenameWorkspace?: () => void;
  onOpenWorkspaceMembers?: () => void;
  onOpenWorkspaceSettings?: () => void;

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

  // Demo
  onLoadDemo?: () => void;
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
  workspaces,
  currentWorkspace,
  onSwitchWorkspace,
  onCreateWorkspace,
  onRenameWorkspace,
  onOpenWorkspaceMembers,
  onOpenWorkspaceSettings,
  contextFolders = [],
  onContextFoldersChange,
  collapsed = false,
  onToggleCollapse,
  onInsertContent,
  onLoadDemo,
}: AdaptiveSidebarProps) {
  const [activeTab, setActiveTab] = useState<'documents' | 'outline' | 'context'>('outline');
  const { data: userWorkspaces } = useUserWorkspaces();
  const rolesByWorkspaceId = userWorkspaces?.data?.reduce((acc: any, ws: any) => {
    acc[ws.id] = ws.role;
    return acc;
  }, {} as Record<string, any>);

  // When editing, default to outline; when browsing, show documents
  const currentTab = isEditingDocument ? activeTab : 'documents';

  if (collapsed) {
    return (
      <div className="relative w-12 flex flex-col items-center py-4">
        {/* Apple-Inspired Collapsed Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-slate-50/90 to-white/95 dark:from-slate-900/95 dark:via-slate-800/90 dark:to-slate-900/95 backdrop-blur-2xl border-r border-slate-200/50 dark:border-slate-700/50 shadow-[0_0_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_20px_rgba(0,0,0,0.2)] rounded-r-2xl" />

        {/* Subtle Apple gradients */}
        <div className="absolute inset-0 overflow-hidden rounded-r-2xl dark:opacity-30">
          <div className="absolute -inset-8 bg-[radial-gradient(circle_at_50%_50%,rgba(0,123,255,0.03),transparent_50%)] animate-pulse" />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="relative w-8 h-8 p-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-300 rounded-lg shadow-sm"
        >
          <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </Button>
      </div>
    );
  }

  // Render the subtabs for Outline/Context
  const renderSubtabs = () => (
    <div className="flex-shrink-0 px-4 pt-2 pb-2">
      <div className="flex items-center gap-2 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('outline')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-lg transition-all duration-200 ${
            currentTab === 'outline'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30 font-medium'
              : 'hover:bg-white/50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
          }`}
        >
          <Hash className="h-4 w-4" />
          Outline
        </button>
        <button
          onClick={() => setActiveTab('context')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-lg transition-all duration-200 ${
            currentTab === 'context'
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/30 font-medium'
              : 'hover:bg-white/50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
          }`}
        >
          <FolderOpen className="h-4 w-4" />
          Context
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative w-72 flex flex-col h-full">
      {/* Apple-Inspired Premium Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-slate-50/90 to-white/95 dark:from-slate-900/95 dark:via-slate-800/90 dark:to-slate-900/95 backdrop-blur-2xl border-r border-slate-200/50 dark:border-slate-700/50 shadow-[0_0_40px_rgba(0,0,0,0.05)] dark:shadow-[0_0_40px_rgba(0,0,0,0.2)]" />

      {/* Apple-Style Subtle Animated Gradients - Only in Light Mode */}
      <div className="absolute inset-0 overflow-hidden rounded-r-2xl dark:opacity-30">
        <div className="absolute -inset-16 bg-[radial-gradient(circle_at_20%_20%,rgba(0,123,255,0.04),transparent_50%),radial-gradient(circle_at_80%_40%,rgba(255,69,58,0.03),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(255,159,10,0.03),transparent_50%)] animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-slate-100/5 dark:from-slate-900/5 dark:to-slate-800/5" />
      </div>

      <div className="relative flex flex-col h-full overflow-hidden">
        {/* Workspace switcher section - compact */}
        {workspaces && currentWorkspace && onSwitchWorkspace && onCreateWorkspace && (
          <div className="flex-shrink-0 px-4 pt-4 pb-2 flex items-center justify-between gap-2">
            <WorkspaceSwitcher
              workspaces={workspaces}
              currentWorkspace={currentWorkspace}
              onSwitch={onSwitchWorkspace}
              onCreate={onCreateWorkspace}
              onRename={onRenameWorkspace}
              onMembers={onOpenWorkspaceMembers}
              onSettings={onOpenWorkspaceSettings}
              rolesByWorkspaceId={rolesByWorkspaceId}
            />

            {onToggleCollapse && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-9 w-9 rounded-xl bg-white/60 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-700/70 shadow-sm hover:shadow-lg hover:bg-white/90 dark:hover:bg-slate-900 transition-all duration-300"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4 text-slate-700 dark:text-slate-200" />
              </Button>
            )}
          </div>
        )}

        {/* Content section */}
        {isEditingDocument ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Main Tab Switcher: All Docs / This Doc */}
            <div className="flex-shrink-0 px-4 py-3">
              <div className="flex items-center gap-2 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30">
                <Button
                  variant={currentTab === 'documents' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('documents')}
                  className={`flex-1 h-9 text-xs font-medium transition-all duration-200 ${
                    currentTab === 'documents'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileStack className="h-3.5 w-3.5 mr-2" />
                  All Docs
                </Button>
                <Button
                  variant={currentTab === 'outline' || currentTab === 'context' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('outline')}
                  className={`flex-1 h-9 text-xs font-medium transition-all duration-200 ${
                    currentTab === 'outline' || currentTab === 'context'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Hash className="h-3.5 w-3.5 mr-2" />
                  This Doc
                </Button>
              </div>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {currentTab === 'documents' && (
                <WorkspaceSidebar
                  onDocumentSelect={onDocumentSelect}
                  currentDocumentId={currentDocumentId}
                  onLoadDemo={onLoadDemo}
                  className="w-full h-full flex flex-col"
                />
              )}

              {currentTab === 'outline' && (
                <div className="flex flex-col h-full">
                  {renderSubtabs()}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <DocumentOutline
                      content={documentContent}
                      onHeadingClick={onHeadingClick}
                      currentLine={currentLine}
                      activeHeadingText={activeHeadingText}
                      showHeader={false}
                    />
                  </div>
                </div>
              )}

              {currentTab === 'context' && (
                <div className="flex flex-col h-full">
                  {renderSubtabs()}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <ContextDocuments
                      folders={contextFolders}
                      onFoldersChange={onContextFoldersChange}
                      onInsertContent={onInsertContent}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Fixed-position collapse button */}
            <div className="fixed bottom-6 left-[calc(16rem+1rem)] z-50">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="justify-center gap-2 text-sm bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 rounded-xl py-2.5 px-4 shadow-lg"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="font-medium hidden sm:inline">Collapse</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Premium workspace browsing state - NO document selected */
          <div className="flex-1 min-h-0 overflow-hidden">
            <WorkspaceSidebar
              onDocumentSelect={onDocumentSelect}
              currentDocumentId={currentDocumentId}
              onLoadDemo={onLoadDemo}
              className="w-full h-full flex flex-col"
            />
          </div>
        )}
      </div>
    </div>
  );
}
