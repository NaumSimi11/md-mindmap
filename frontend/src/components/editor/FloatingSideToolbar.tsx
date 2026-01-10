/**
 * FloatingSideToolbar - Beautiful Modern AI-Era Floating Toolbar
 * 
 * Inspired by: Figma, Notion, Cursor, Linear
 * Features:
 * - Glassmorphism with backdrop blur
 * - Smooth animations and micro-interactions
 * - Gradient accents
 * - Glow effects
 * - Beautiful hover states
 * - Compact, organized layout
 * 
 * NOTE: Format expandable panel was removed to avoid duplication with Formatting Toolbar.
 * Use the Formatting Toolbar (FixedToolbar) for text formatting (Bold, Italic, Headings, etc.)
 */

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Library,
  Sparkles,
  Network,
  FileText,
  Keyboard,
  Wand2,
  MoreHorizontal,
  Settings,
  Upload,
  Download,
  Save,
  Cloud,
  HardDrive,
  Users,
  Clock,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import type { Editor } from '@tiptap/react';

import { useEditorUIStore } from '@/stores/editorUIStore';
import { useAuth } from '@/hooks/useAuth';

interface FloatingSideToolbarProps {
  editor: Editor;
  onInsertTable?: () => void;
  onInsertLink?: () => void;
  onInsertImage?: (url?: string) => void;
  onAutoFormatAll?: () => void;
  onShowDiagramMenu?: () => void;
  onShowMindmapChoice?: () => void;
  onShowKeyboardShortcuts?: () => void;
  onToggleEditorMode?: () => void;
  editorMode?: 'wysiwyg' | 'markdown';
  aiAutocompleteEnabled?: boolean;
  onAIAutocompleteChange?: (enabled: boolean) => void;
  aiHintsEnabled?: boolean;
  onAIHintsChange?: (enabled: boolean) => void;
  onImportFile?: (replaceDocument: boolean) => void;
  onExportMarkdown?: () => void;
  onSave?: () => void; // Legacy: kept for backward compatibility
  onSaveToCloud?: () => void;
  onSaveAsLocal?: () => void;
  onSaveLocally?: () => void;
  onShare?: () => void;
  onShowShareModal?: () => void;
  onShowVersionHistory?: () => void;
  onAIFormat?: () => void; // Added onAIFormat to props
  onAutoFormat?: () => void; // Kept onAutoFormat as it's used in the expanded panel
}

interface ToolbarButtonConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  onClick: () => void;
  isActive?: boolean;
  variant?: 'default' | 'primary' | 'ghost';
  group?: 'format' | 'insert' | 'ai' | 'tools';
}

export const FloatingSideToolbar: React.FC<FloatingSideToolbarProps> = ({
  editor,
  onInsertTable,
  onInsertLink,
  onInsertImage,
  onAutoFormat,
  onAutoFormatAll,
  onShowDiagramMenu,
  onShowMindmapChoice,
  onShowKeyboardShortcuts,
  onToggleEditorMode,
  editorMode = 'wysiwyg',
  aiAutocompleteEnabled = false,
  onAIAutocompleteChange,
  aiHintsEnabled = false,
  onAIHintsChange,
  onImportFile,
  onExportMarkdown,
  onSave,
  onSaveToCloud,
  onSaveAsLocal,
  onSaveLocally,
  onShare,
  onShowShareModal,
  onShowVersionHistory,
  onAIFormat,
}) => {
  const { setShowAIModal } = useEditorUIStore();
  const { isAuthenticated } = useAuth();

  // State for UI interactions
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    button: ToolbarButtonConfig;
    id: string;
    isHovered: boolean;
    onHover: (id: string | null) => void;
  }

  const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
    ({ button, id, isHovered, onHover, ...props }, ref) => {
      const Icon = button.icon;
      const isDisabled = button.group === 'tools' && button.isActive === false;

      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                ref={ref}
                {...props}
                onClick={(e) => {
                  if (props.onClick) props.onClick(e);
                  if (button.onClick) button.onClick();
                }}
                disabled={isDisabled}
                onMouseEnter={() => onHover(id)}
                onMouseLeave={() => onHover(null)}
                className={`
                relative w-8 h-8 rounded-lg
                flex items-center justify-center
                transition-all duration-150 ease-out
                group
                flex-shrink-0
                ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                ${button.isActive
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-foreground/60 hover:text-foreground hover:bg-muted/50'
                  }
                ${button.variant === 'primary'
                    ? 'bg-gradient-to-br from-blue-600 to-sky-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40'
                    : ''
                  }
                ${isHovered ? 'scale-105' : ''}
                ${props.className || ''}
              `}
              >
                <Icon className="h-3.5 w-3.5" />

                {/* Active indicator */}
                {button.isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-blue-400" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl px-3 py-2"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">{button.label}</span>
                {button.shortcut && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {button.shortcut}
                  </span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  );
  ToolbarButton.displayName = 'ToolbarButton';

  return (
    <div
      className={`
        fixed top-1/2 -translate-y-1/2 z-50
        bg-card/95 backdrop-blur-2xl
        rounded-2xl
        shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.05)]
        border border-border/50
        transition-all duration-300 ease-out
        flex flex-row items-start
        p-2 gap-2
        overflow-visible
        hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(59,130,246,0.2)]
        hover:border-blue-500/30
        group/toolbar
      `}
      style={{
        right: '1rem',
      }}
    >
      {/* Main Toolbar - Vertical - SIMPLIFIED (removed duplicated Format section) */}
      <div className="flex flex-col gap-1.5">
        {/* 1. Diagram Button - Primary quick action */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onShowDiagramMenu?.()}
                onMouseEnter={() => setHoveredButton('insert-diagram')}
                onMouseLeave={() => setHoveredButton(null)}
                className={`
                  relative w-8 h-8 rounded-lg
                  flex items-center justify-center
                  transition-all duration-150 ease-out
                  cursor-pointer
                  text-foreground/60 hover:text-foreground hover:bg-muted/50
                  ${hoveredButton === 'insert-diagram' ? 'scale-105' : ''}
                `}
              >
                <Library className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl px-3 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">Insert Diagram</span>
                <span className="text-xs text-muted-foreground font-mono">Ctrl+Shift+D</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* 2. Mindmap Button - Quick access */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onShowMindmapChoice?.()}
                onMouseEnter={() => setHoveredButton('mindmap')}
                onMouseLeave={() => setHoveredButton(null)}
                className={`
                  relative w-8 h-8 rounded-lg
                  flex items-center justify-center
                  transition-all duration-150 ease-out
                  cursor-pointer
                  text-foreground/60 hover:text-foreground hover:bg-muted/50
                  ${hoveredButton === 'mindmap' ? 'scale-105' : ''}
                `}
              >
                <Network className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl px-3 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">Mindmap Studio</span>
                <span className="text-xs text-muted-foreground font-mono">Ctrl+Shift+M</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* 3. AI Settings + Ask AI Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`
                relative w-8 h-8 rounded-lg
                flex items-center justify-center
                transition-all duration-150
                bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40
              `}
              title="AI Tools"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="left"
            align="start"
            className="w-80 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-2"
          >
            {/* Ask AI - Primary Action */}
            <DropdownMenuItem
              onClick={() => setShowAIModal(true)}
              className="rounded-xl px-3 py-3 mb-2 hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-all bg-purple-50 dark:bg-purple-950/20"
            >
              <Sparkles className="h-4 w-4 mr-3 text-purple-500" />
              <div className="flex flex-col">
                <span className="font-semibold">Ask AI</span>
                <span className="text-xs text-muted-foreground">Generate content, rewrite, chat</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-xs flex items-center gap-2 mt-2">
              <Settings className="h-3 w-3" />
              AI Settings
            </DropdownMenuLabel>

            <div className="px-2 py-3 space-y-4">
              {/* AI Autocomplete */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">AI Autocomplete</span>
                  </div>
                  <Switch
                    checked={aiAutocompleteEnabled}
                    onCheckedChange={onAIAutocompleteChange}
                  />
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Smart inline suggestions.
                </p>
              </div>

              <DropdownMenuSeparator />

              {/* AI Hints */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">AI Hints</span>
                  </div>
                  <Switch
                    checked={aiHintsEnabled}
                    onCheckedChange={onAIHintsChange}
                  />
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Ghosted text continuations.
                </p>
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* AI Format */}
            <DropdownMenuItem
              onClick={() => onAIFormat?.()}
              className="rounded-xl px-3 py-2.5 hover:bg-muted/60 transition-all"
            >
              <Wand2 className="h-4 w-4 mr-3" />
              <span>AI Format</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="w-full h-px bg-border/30 my-1" />

        {/* 5. Link Button */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onInsertLink?.()}
                onMouseEnter={() => setHoveredButton('insert-link')}
                onMouseLeave={() => setHoveredButton(null)}
                className={`
                  relative w-8 h-8 rounded-lg
                  flex items-center justify-center
                  transition-all duration-150 ease-out
                  cursor-pointer
                  text-foreground/60 hover:text-foreground hover:bg-muted/50
                  ${hoveredButton === 'insert-link' ? 'scale-105' : ''}
                `}
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl px-3 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">Insert Link</span>
                <span className="text-xs text-muted-foreground font-mono">Ctrl+K</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* 6. Image Button */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onInsertImage?.()}
                onMouseEnter={() => setHoveredButton('insert-image')}
                onMouseLeave={() => setHoveredButton(null)}
                className={`
                  relative w-8 h-8 rounded-lg
                  flex items-center justify-center
                  transition-all duration-150 ease-out
                  cursor-pointer
                  text-foreground/60 hover:text-foreground hover:bg-muted/50
                  ${hoveredButton === 'insert-image' ? 'scale-105' : ''}
                `}
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl px-3 py-2">
              <span className="font-semibold text-sm">Insert Image</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* 7. Table Button */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onInsertTable?.()}
                onMouseEnter={() => setHoveredButton('insert-table')}
                onMouseLeave={() => setHoveredButton(null)}
                className={`
                  relative w-8 h-8 rounded-lg
                  flex items-center justify-center
                  transition-all duration-150 ease-out
                  cursor-pointer
                  text-foreground/60 hover:text-foreground hover:bg-muted/50
                  ${hoveredButton === 'insert-table' ? 'scale-105' : ''}
                `}
              >
                <TableIcon className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl px-3 py-2">
              <span className="font-semibold text-sm">Insert Table</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Divider */}
        <div className="w-full h-px bg-border/30 my-1" />

        {/* ❌ STEP 3: Undo/Redo buttons disabled - Yjs Collaboration provides undo/redo via keyboard shortcuts (Ctrl+Z/Ctrl+Y) */}
        {/* Will be re-enabled in STEP 4 with proper Yjs undo/redo commands */}
        {/* NOTE: Yjs undo/redo works via Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y) automatically */}

        {/* More Tools Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="
              relative w-8 h-8 rounded-lg
              flex items-center justify-center
              transition-all duration-150
              text-foreground/60 hover:text-foreground
              hover:bg-muted/50
              group/dropdown
              flex-shrink-0
            "
              title="More Tools"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="left"
            align="start"
            className="w-64 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-2 z-[55] overflow-visible"
          >
            {/* Import Section */}
            <DropdownMenuLabel className="text-xs px-2 py-1.5">Import Document</DropdownMenuLabel>
            {onImportFile && (
              <>
                <DropdownMenuItem
                  onClick={() => onImportFile(false)}
                  className="rounded-xl px-3 py-2.5 mb-1 hover:bg-muted/60 transition-all"
                >
                  <Upload className="h-4 w-4 mr-3" />
                  <div className="flex flex-col flex-1">
                    <span className="text-sm">Insert from file</span>
                    <span className="text-xs text-muted-foreground">Add content after current document</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onImportFile(true)}
                  className="rounded-xl px-3 py-2.5 mb-1 hover:bg-muted/60 transition-all"
                >
                  <FileText className="h-4 w-4 mr-3" />
                  <div className="flex flex-col flex-1">
                    <span className="text-sm">Replace document</span>
                    <span className="text-xs text-muted-foreground">Open file and replace all content</span>
                  </div>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            {/* Export Section */}
            <DropdownMenuLabel className="text-xs px-2 py-1.5">Export Document</DropdownMenuLabel>
            {onExportMarkdown && (
              <DropdownMenuItem
                onClick={() => onExportMarkdown()}
                className="rounded-xl px-3 py-2.5 mb-1 hover:bg-muted/60 transition-all"
              >
                <Download className="h-4 w-4 mr-3" />
                <div className="flex flex-col flex-1">
                  <span className="text-sm">Export as Markdown</span>
                  <span className="text-xs text-muted-foreground">Download as .md file</span>
                </div>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Other Actions */}
            {(onSave || onSaveToCloud || onSaveAsLocal || onSaveLocally) && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger 
                  className="rounded-xl px-3 py-2.5 mb-1 hover:bg-muted/60 transition-all"
                 
                >
                  <Save className="h-4 w-4 mr-3" />
                  <span className="flex-1">Save</span>
                  <span className="text-xs text-muted-foreground font-mono ml-2">Ctrl+S</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent 
                  className="min-w-[200px] bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl !z-[9999]"
                  style={{ 
                    marginLeft: '-8px'
                  }}
                >
                  {isAuthenticated && onSaveToCloud && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSaveToCloud();
                      }}
                      className="rounded-xl px-3 py-2.5 mb-1 hover:bg-muted/60 transition-all"
                    >
                      <Cloud className="h-4 w-4 mr-3" />
                      <div className="flex flex-col">
                        <span>Save to Cloud</span>
                        <span className="text-xs text-muted-foreground">Sync to cloud storage</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {onSaveAsLocal && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSaveAsLocal();
                      }}
                      className="rounded-xl px-3 py-2.5 mb-1 hover:bg-muted/60 transition-all"
                    >
                      <HardDrive className="h-4 w-4 mr-3" />
                      <div className="flex flex-col">
                        <span>Save Locally</span>
                        <span className="text-xs text-muted-foreground">Save to computer disk</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />

            {/* Editor Tools */}
            <DropdownMenuItem
              onClick={() => onToggleEditorMode?.()}
              className="rounded-xl px-3 py-2.5 mb-1 hover:bg-muted/60 transition-all"
            >
              <FileText className="h-4 w-4 mr-3" />
              <span className="flex-1">
                {editorMode === 'wysiwyg' ? 'Switch to Markdown' : 'Switch to WYSIWYG'}
              </span>
              <span className="text-xs text-muted-foreground font-mono ml-2">Ctrl+M</span>
            </DropdownMenuItem>

            {/* Share & Version History */}
            {onShowShareModal && (
              <DropdownMenuItem
                onClick={() => onShowShareModal()}
                className="rounded-xl px-3 py-2.5 mb-1 hover:bg-muted/60 transition-all"
              >
                <Users className="h-4 w-4 mr-3" />
                <span>Share Document</span>
              </DropdownMenuItem>
            )}
            {onShowVersionHistory && (
              <DropdownMenuItem
                onClick={() => onShowVersionHistory()}
                className="rounded-xl px-3 py-2.5 mb-1 hover:bg-muted/60 transition-all"
              >
                <Clock className="h-4 w-4 mr-3" />
                <span>Version History</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => onShowKeyboardShortcuts?.()}
              className="rounded-xl px-3 py-2.5 hover:bg-muted/60 transition-all"
            >
              <Keyboard className="h-4 w-4 mr-3" />
              <span>Keyboard Shortcuts</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
