/**
 * UnifiedToolbar - Single Configurable Toolbar System
 *
 * Consolidates FixedToolbar, FloatingToolbar, and FloatingSideToolbar into one system
 * Allows users to choose their preferred toolbar style and customize what's shown
 */

import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { useEditorToolbar } from '@/hooks/useEditorToolbar';
import { useEditorUIStore } from '@/stores/editorUIStore';
import { useAuth } from '@/hooks/useAuth';
import { useToolbarPreferences } from '@/hooks/useToolbarPreferences';
import { ToolbarSettings } from './ToolbarSettings';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Highlighter,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Table as TableIcon,
  Image as ImageIcon,
  Library,
  Sparkles,
  Wand2,
  Settings,
  MoreHorizontal,
  Type,
  ChevronDown,
  MessageSquare,
  Network,
  FileText,
  Keyboard,
  Save,
  Share,
  Cloud,
  HardDrive,
  Upload,
  Download,
  FolderOpen,
  Undo,
  Redo,
  Superscript as SuperIcon,
  Subscript as SubIcon,
} from 'lucide-react';
import { useCommentStore } from '@/stores/commentStore';

export type ToolbarStyle = 'fixed-top' | 'floating-side' | 'floating-selection' | 'compact';

export interface ToolbarConfig {
  style: ToolbarStyle;
  showFormat: boolean;
  showHeadings: boolean;
  showLists: boolean;
  showInsert: boolean;
  showAI: boolean;
  showComments: boolean;
  showSave: boolean;
  showShare: boolean;
  showTools: boolean;
}

interface UnifiedToolbarProps {
  editor: Editor | null;
  config: ToolbarConfig;
  onConfigChange: (config: ToolbarConfig) => void;

  // Optional callbacks
  onInsertTable?: () => void;
  onInsertLink?: () => void;
  onInsertImage?: () => void;
  onAutoFormat?: () => void;
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
  onSave?: () => void;
  onSaveToCloud?: () => void;
  onSaveAsLocal?: () => void;
  onSaveLocally?: () => void;
  onShare?: () => void;
  onAIFormat?: () => void;
}

export const UnifiedToolbar: React.FC<UnifiedToolbarProps> = ({
  editor,
  config: propConfig,
  onConfigChange,
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
  onAIFormat,
}) => {
  const { setShowAIModal } = useEditorUIStore();
  const { isAuthenticated } = useAuth();
  const { formatActions, headingActions, listActions, insertActions } = useEditorToolbar(editor);
  const { toggleCommentSidebar, comments } = useCommentStore();

  // Use toolbar preferences hook for persistent config
  const { config, updateConfig, resetToDefaults } = useToolbarPreferences();

  // Use prop config if provided, otherwise use hook config
  const currentConfig = propConfig || config;
  const handleConfigChange = onConfigChange || updateConfig;

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const openCommentsCount = comments.filter(c => c.status === 'open').length;
  const hasSelection = editor ? !editor.state.selection.empty : false;

  // Toolbar style-specific rendering
  const renderFixedTopToolbar = () => {
    // Get most frequently used tools
    const essentialFormatActions = formatActions.filter(action =>
      ['Bold', 'Italic', 'Underline'].includes(action.label)
    );
    const essentialHeadingActions = headingActions.slice(0, 2); // H1, H2 only
    const essentialListActions = listActions.slice(0, 2); // Bullet, Numbered only
    const essentialInsertActions = insertActions.filter(action =>
      ['Link', 'Image'].includes(action.label)
    );

    return (
      <div className="border-b border-border bg-card px-4 py-2 flex items-center gap-1 flex-wrap">
        {/* Essential Format - Most Used */}
        {currentConfig.showFormat && (
          <>
            <div className="flex items-center gap-1">
              {essentialFormatActions.map((action, i) => (
                <ToolbarButton key={i} action={action} />
              ))}
            </div>
            <div className="w-px h-6 bg-border mx-1" />
          </>
        )}

        {/* Essential Headings - H1, H2 */}
        {currentConfig.showHeadings && (
          <>
            <div className="flex items-center gap-1">
              {essentialHeadingActions.map((action, i) => (
                <ToolbarButton key={i} action={action} />
              ))}
            </div>
            <div className="w-px h-6 bg-border mx-1" />
          </>
        )}

        {/* Essential Lists - Bullet, Numbered */}
        {currentConfig.showLists && (
          <>
            <div className="flex items-center gap-1">
              {essentialListActions.map((action, i) => (
                <ToolbarButton key={i} action={action} />
              ))}
            </div>
            <div className="w-px h-6 bg-border mx-1" />
          </>
        )}

        {/* Essential Insert - Link, Image */}
        {currentConfig.showInsert && (
          <>
            <div className="flex items-center gap-1">
              {essentialInsertActions.map((action, i) => (
                <ToolbarButton key={i} action={action} />
              ))}
            </div>
            <div className="w-px h-6 bg-border mx-1" />
          </>
        )}

        {/* Comments */}
        {currentConfig.showComments && (
          <button
            onClick={toggleCommentSidebar}
            className="relative p-2 rounded hover:bg-accent transition-colors"
            title="Comments"
          >
            <MessageSquare className="w-4 h-4" />
            {openCommentsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                {openCommentsCount}
              </span>
            )}
          </button>
        )}

        {/* More Tools Dropdown - Contains less-used tools */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>More Formatting</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Advanced Format */}
            {formatActions.filter(action =>
              !['Bold', 'Italic', 'Underline'].includes(action.label)
            ).map((action, i) => (
              <DropdownMenuItem key={i} onClick={action.action}>
                <action.icon className="w-4 h-4 mr-2" />
                {action.label}
                {action.shortcut && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {action.shortcut}
                  </span>
                )}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* Advanced Headings */}
            {headingActions.slice(2).map((action, i) => (
              <DropdownMenuItem key={i} onClick={action.action}>
                <action.icon className="w-4 h-4 mr-2" />
                {action.label}
                {action.shortcut && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {action.shortcut}
                  </span>
                )}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* Advanced Insert */}
            {insertActions.filter(action =>
              !['Link', 'Image'].includes(action.label)
            ).map((action, i) => (
              <DropdownMenuItem key={i} onClick={action.action}>
                <action.icon className="w-4 h-4 mr-2" />
                {action.label}
                {action.shortcut && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {action.shortcut}
                  </span>
                )}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* Toolbar Settings */}
            <DropdownMenuItem onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Toolbar Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const renderFloatingSideToolbar = () => (
    <div className="fixed top-1/2 -translate-y-1/2 z-50 right-4">
      <div className="bg-card/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-border/50 p-2 flex flex-col gap-1.5">
        {/* Format */}
        {currentConfig.showFormat && (
          <ToolbarButton
            icon={Type}
            label="Format"
            onClick={() => setShowSettings(true)}
          />
        )}

        {/* AI */}
        {currentConfig.showAI && (
          <ToolbarButton
            icon={Sparkles}
            label="AI Assistant"
            onClick={() => setShowAIModal(true)}
            variant="primary"
          />
        )}

        {/* Comments */}
        {currentConfig.showComments && (
          <ToolbarButton
            icon={MessageSquare}
            label="Comments"
            onClick={toggleCommentSidebar}
            badge={openCommentsCount > 0 ? openCommentsCount.toString() : undefined}
          />
        )}

        {/* Tools */}
        {currentConfig.showTools && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToolbarButton icon={MoreHorizontal} label="More Tools" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="left">
              {currentConfig.showSave && isAuthenticated && (
                <DropdownMenuItem onClick={onSaveToCloud}>
                  <Cloud className="w-4 h-4 mr-2" />
                  Save to Cloud
                </DropdownMenuItem>
              )}
              {currentConfig.showShare && (
                <DropdownMenuItem onClick={onShare}>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onShowKeyboardShortcuts}>
                <Keyboard className="w-4 h-4 mr-2" />
                Keyboard Shortcuts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Toolbar Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );

  const renderFloatingSelectionToolbar = () => {
    if (!editor || !hasSelection) return null;

    return (
      <div className="fixed z-50 bg-card border border-border rounded-lg shadow-lg p-1 flex items-center gap-0.5">
        {/* Basic formatting from FloatingToolbar */}
        <ToolbarButton
          icon={Bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          label="Bold"
        />
        <ToolbarButton
          icon={Italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          label="Italic"
        />
        <ToolbarButton
          icon={Underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          label="Underline"
        />
        <ToolbarButton
          icon={LinkIcon}
          onClick={onInsertLink}
          isActive={editor.isActive('link')}
          label="Link"
        />
      </div>
    );
  };

  const renderCompactToolbar = () => (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-card/95 backdrop-blur-2xl rounded-full shadow-xl border border-border/50 p-1 flex items-center gap-0.5">
        {currentConfig.showFormat && (
          <ToolbarButton icon={Bold} onClick={() => editor?.chain().focus().toggleBold().run()} />
        )}
        {currentConfig.showAI && (
          <ToolbarButton icon={Sparkles} onClick={() => setShowAIModal(true)} variant="primary" />
        )}
        <ToolbarButton icon={Settings} onClick={() => setShowSettings(true)} />
      </div>
    </div>
  );

  // Main render based on style
  const toolbarContent = (() => {
    switch (currentConfig.style) {
      case 'fixed-top':
        return renderFixedTopToolbar();
      case 'floating-side':
        return renderFloatingSideToolbar();
      case 'floating-selection':
        return renderFloatingSelectionToolbar();
      case 'compact':
        return renderCompactToolbar();
      default:
        return renderFixedTopToolbar();
    }
  })();

  return (
    <>
      {toolbarContent}

      {/* Toolbar Settings Modal */}
      <ToolbarSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={currentConfig}
        onConfigChange={handleConfigChange}
        onResetToDefaults={resetToDefaults}
      />
    </>
  );
};

// Reusable ToolbarButton component
interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
  onClick?: () => void;
  isActive?: boolean;
  variant?: 'default' | 'primary' | 'ghost';
  badge?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  isActive,
  variant = 'default',
  badge,
}) => {
  const button = (
    <button
      onClick={onClick}
      className={`
        relative p-2 rounded-lg transition-all duration-150
        ${variant === 'primary'
          ? 'bg-gradient-to-br from-blue-600 to-sky-600 text-white shadow-md'
          : isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }
      `}
      title={label}
    >
      <Icon className="w-4 h-4" />
      {badge && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );

  if (label) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

export default UnifiedToolbar;
