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
 */

import React, { useState } from 'react';

// ... existing imports ...
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code,
  Strikethrough,
  Underline,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Library,
  Sparkles,
  Network,
  FileText,
  Undo,
  Redo,
  Keyboard,
  Wand2,
  MoreHorizontal,
  Type,
  Minus,
  ChevronRight,
  Settings,
  Upload,
  Download,
  Save,
  Share,
  ChevronDown,
  FolderOpen,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import type { Editor } from '@tiptap/react';

import { useEditorUIStore } from '@/stores/editorUIStore';

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
  onSave?: () => void;
  onShare?: () => void;
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

// Font families and sizes (matching FormatDropdown)
const fontFamilies = [
  { name: 'Default', value: '' },
  { name: 'Sans Serif', value: 'Inter, system-ui, sans-serif' },
  { name: 'Serif', value: 'Georgia, serif' },
  { name: 'Monospace', value: 'JetBrains Mono, monospace' },
  { name: 'Cursive', value: 'Comic Sans MS, cursive' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Tahoma', value: 'Tahoma, sans-serif' },
  { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
  { name: 'Impact', value: 'Impact, fantasy' },
];

const fontSizes = [
  { name: 'Small', value: '12px' },
  { name: 'Normal', value: '16px' },
  { name: 'Medium', value: '18px' },
  { name: 'Large', value: '24px' },
  { name: 'Extra Large', value: '32px' },
  { name: 'Huge', value: '48px' },
];

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
  onShare,
  onAIFormat,
}) => {
  // Force re-render on editor state changes (transactions)
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const { setShowAIModal } = useEditorUIStore();

  // State for UI interactions
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [formatExpanded, setFormatExpanded] = useState(false);

  // Get current editor state
  const currentFont = editor.getAttributes('textStyle').fontFamily || '';
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '16px';
  const hasSelection = !editor.state.selection.empty;

  React.useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      forceUpdate();
    };

    editor.on('transaction', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);

    return () => {
      editor.off('transaction', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
    };
  }, [editor]);

  // Insert actions
  const insertButtons: ToolbarButtonConfig[] = [
    {
      icon: LinkIcon,
      label: 'Insert Link',
      shortcut: 'Ctrl+K',
      onClick: () => {
        console.log('Link button clicked');
        onInsertLink?.();
      },
      group: 'insert',
    },
  ];

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
        ${formatExpanded ? 'w-auto' : ''}
      `}
      style={{
        right: '1rem',
      }}
    >
      {/* Main Toolbar - Vertical */}
      <div className="flex flex-col gap-1.5">
        {/* Format Button - Expands */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setFormatExpanded(!formatExpanded)}
                className={`
                  relative w-8 h-8 rounded-lg
                  flex items-center justify-center
                  transition-all duration-150
                  ${formatExpanded
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-foreground/60 hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                <Type className="h-3.5 w-3.5" />
                {formatExpanded && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-blue-400" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl">
              <span className="font-semibold text-sm">Format</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* AI Settings Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`
                relative w-8 h-8 rounded-lg
                flex items-center justify-center
                transition-all duration-150
                ${(aiAutocompleteEnabled || aiHintsEnabled)
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-foreground/60 hover:text-foreground hover:bg-muted/50'
                }
              `}
              title="AI Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="left"
            align="start"
            className="w-80 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-2"
          >
            <DropdownMenuLabel className="text-xs flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              AI Writing Assistance
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
                  Smart inline suggestions for headings, lists, and sentence completions.
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
                  Contextual phrase continuations as ghosted text.
                </p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="w-full h-px bg-border/30 my-1" />

        {/* Insert Group - Link (Direct JSX for reliability) */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  console.log('Link button clicked (Direct)');
                  onInsertLink?.();
                }}
                onMouseEnter={() => setHoveredButton('insert-link')}
                onMouseLeave={() => setHoveredButton(null)}
                className={`
                  relative w-8 h-8 rounded-lg
                  flex items-center justify-center
                  transition-all duration-150 ease-out
                  group
                  flex-shrink-0
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

        {/* Image Button (Direct JSX - Triggers Modal in Parent) */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  console.log('Image button clicked (Direct)');
                  onInsertImage?.();
                }}
                onMouseEnter={() => setHoveredButton('insert-image')}
                onMouseLeave={() => setHoveredButton(null)}
                className={`
                  relative w-8 h-8 rounded-lg
                  flex items-center justify-center
                  transition-all duration-150 ease-out
                  group
                  flex-shrink-0
                  cursor-pointer
                  text-foreground/60 hover:text-foreground hover:bg-muted/50
                  ${hoveredButton === 'insert-image' ? 'scale-105' : ''}
                `}
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl px-3 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">Insert Image</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Diagram Button (Direct JSX) */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  console.log('Diagram button clicked (Direct)');
                  onShowDiagramMenu?.();
                }}
                onMouseEnter={() => setHoveredButton('insert-diagram')}
                onMouseLeave={() => setHoveredButton(null)}
                className={`
                  relative w-8 h-8 rounded-lg
                  flex items-center justify-center
                  transition-all duration-150 ease-out
                  group
                  flex-shrink-0
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

        {/* Table Button (Direct to Dialog) */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  console.log('Table button clicked (Direct)');
                  onInsertTable?.();
                }}
                onMouseEnter={() => setHoveredButton('insert-table')}
                onMouseLeave={() => setHoveredButton(null)}
                className={`
                  relative w-8 h-8 rounded-lg
                  flex items-center justify-center
                  transition-all duration-150 ease-out
                  group
                  flex-shrink-0
                  cursor-pointer
                  text-foreground/60 hover:text-foreground hover:bg-muted/50
                  ${hoveredButton === 'insert-table' ? 'scale-105' : ''}
                `}
              >
                <TableIcon className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl px-3 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">Insert Table</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Divider */}
        <div className="w-full h-px bg-border/30 my-1" />

        {/* AI Assistant - Primary Action (Direct JSX) */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  console.log('AI Assistant button clicked (Direct)');
                  setShowAIModal(true);
                }}
                onMouseEnter={() => setHoveredButton('ai-assistant')}
                onMouseLeave={() => setHoveredButton(null)}
                className={`
                  relative w-8 h-8 rounded-lg
                  flex items-center justify-center
                  transition-all duration-150 ease-out
                  group
                  flex-shrink-0
                  cursor-pointer
                  bg-gradient-to-br from-blue-600 to-sky-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40
                  ${hoveredButton === 'ai-assistant' ? 'scale-105' : ''}
                `}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl px-3 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">AI Assistant</span>
                <span className="text-xs text-muted-foreground font-mono">Ctrl+Shift+A</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* AI More Dropdown */}
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
              title="More AI Tools"
            >
              <Wand2 className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="left"
            align="start"
            className="w-56 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-2"
          >
            <DropdownMenuItem
              onClick={() => onShowMindmapChoice?.()}
              className="rounded-xl px-3 py-2.5 mb-1 hover:bg-muted/60 transition-all"
            >
              <Network className="h-4 w-4 mr-3" />
              <span className="flex-1">Mindmap Studio</span>
              <span className="text-xs text-muted-foreground font-mono ml-2">Ctrl+Shift+M</span>
            </DropdownMenuItem>
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

        {/* Tools - Undo/Redo (Direct JSX) */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                onMouseEnter={() => setHoveredButton('undo')}
                onMouseLeave={() => setHoveredButton(null)}
                className={`
                  relative w-8 h-8 rounded-lg
                  flex items-center justify-center
                  transition-all duration-150 ease-out
                  group
                  flex-shrink-0
                  ${!editor.can().undo() ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                  text-foreground/60 hover:text-foreground hover:bg-muted/50
                  ${hoveredButton === 'undo' ? 'scale-105' : ''}
                `}
              >
                <Undo className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl px-3 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">Undo</span>
                <span className="text-xs text-muted-foreground font-mono">Ctrl+Z</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                onMouseEnter={() => setHoveredButton('redo')}
                onMouseLeave={() => setHoveredButton(null)}
                className={`
                  relative w-8 h-8 rounded-lg
                  flex items-center justify-center
                  transition-all duration-150 ease-out
                  group
                  flex-shrink-0
                  ${!editor.can().redo() ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                  text-foreground/60 hover:text-foreground hover:bg-muted/50
                  ${hoveredButton === 'redo' ? 'scale-105' : ''}
                `}
              >
                <Redo className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl px-3 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">Redo</span>
                <span className="text-xs text-muted-foreground font-mono">Ctrl+Y</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

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
            className="w-64 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-2"
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
            {onSave && (
              <DropdownMenuItem
                onClick={() => onSave()}
                className="rounded-xl px-3 py-2.5 mb-1 hover:bg-muted/60 transition-all"
              >
                <Save className="h-4 w-4 mr-3" />
                <span className="flex-1">Save</span>
                <span className="text-xs text-muted-foreground font-mono ml-2">Ctrl+S</span>
              </DropdownMenuItem>
            )}
            {onShare && (
              <DropdownMenuItem
                onClick={() => onShare()}
                className="rounded-xl px-3 py-2.5 mb-1 hover:bg-muted/60 transition-all"
              >
                <Share className="h-4 w-4 mr-3" />
                <span>Share</span>
              </DropdownMenuItem>
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

      {/* Expanded Format Panel - Slides out */}
      {formatExpanded && (
        <div
          className="
            flex flex-col gap-1.5
            bg-card/98 backdrop-blur-2xl
            rounded-xl
            border border-border/50
            p-2
            min-w-[200px]
            shadow-xl
            animate-in slide-in-from-right fade-in duration-200
            max-h-[60vh] overflow-y-auto
            scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent
          "
        >
          {/* Close button */}
          <div className="flex items-center justify-between mb-1 sticky top-0 bg-card/98 backdrop-blur-xl z-10 pb-2 border-b border-border/30">
            <span className="text-xs font-semibold text-foreground/70">Format</span>
            <button
              onClick={() => setFormatExpanded(false)}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted/50 text-foreground/60 hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-3 w-3 rotate-180" />
            </button>
          </div>

          <div className="space-y-1.5">
            {/* Text Styles */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                Text Style
              </div>
              <FormatButton icon={Bold} label="Bold" shortcut="Ctrl+B" onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} />
              <FormatButton icon={Italic} label="Italic" shortcut="Ctrl+I" onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} />
              <FormatButton icon={Strikethrough} label="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} />
              <FormatButton icon={Code} label="Inline Code" onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} />
            </div>

            {/* Divider */}
            <div className="h-px bg-border/30 my-1" />

            {/* Headings */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                Headings
              </div>
              <FormatButton icon={Heading1} label="Heading 1" shortcut="Ctrl+Alt+1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} />
              <FormatButton icon={Heading2} label="Heading 2" shortcut="Ctrl+Alt+2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} />
              <FormatButton icon={Heading3} label="Heading 3" shortcut="Ctrl+Alt+3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} />
            </div>

            {/* Divider */}
            <div className="h-px bg-border/30 my-1" />

            {/* Lists */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                Lists
              </div>
              <FormatButton icon={List} label="Bullet List" shortcut="Ctrl+Shift+8" onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} />
              <FormatButton icon={ListOrdered} label="Numbered List" shortcut="Ctrl+Shift+9" onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} />
              <FormatButton icon={ListTodo} label="Task List" onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} />
            </div>

            {/* Divider */}
            <div className="h-px bg-border/30 my-1" />

            {/* Blocks */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                Blocks
              </div>
              <FormatButton icon={Quote} label="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} />
              <FormatButton icon={Minus} label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
              <FormatButton icon={Code} label="Code Block" onClick={() => editor.chain().focus().setCodeBlock().run()} isActive={editor.isActive('codeBlock')} />
            </div>

            {/* Divider */}
            <div className="h-px bg-border/30 my-1" />

            {/* Font Family */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                Font Family
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all">
                    <Type className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 text-left">
                      {fontFamilies.find(f => f.value === currentFont)?.name || 'Default'}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="left" align="start" className="w-56 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-2 max-h-[300px] overflow-y-auto">
                  {fontFamilies.map((font) => (
                    <DropdownMenuItem
                      key={font.value}
                      onClick={() => {
                        if (font.value === '') {
                          editor.chain().focus().unsetFontFamily().run();
                        } else {
                          editor.chain().focus().setFontFamily(font.value).run();
                        }
                      }}
                      className={`rounded-xl px-3 py-2 mb-1 ${currentFont === font.value ? 'bg-blue-500/20 text-blue-400' : ''}`}
                      style={{ fontFamily: font.value }}
                    >
                      <span>{font.name}</span>
                      {font.value === '' && <span className="ml-auto text-xs text-muted-foreground">Reset</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Font Size */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                Font Size
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all">
                    <Type className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 text-left">
                      {fontSizes.find(s => s.value === currentFontSize)?.name || 'Normal'}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="left" align="start" className="w-56 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-2">
                  {fontSizes.map((size) => (
                    <DropdownMenuItem
                      key={size.value}
                      onClick={() => editor.chain().focus().setFontSize(size.value).run()}
                      className={`rounded-xl px-3 py-2 mb-1 ${currentFontSize === size.value ? 'bg-blue-500/20 text-blue-400' : ''}`}
                    >
                      <span style={{ fontSize: size.value }} className="font-medium">
                        {size.name}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">{size.value}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().unsetFontSize().run()}
                    className="rounded-xl px-3 py-2 text-xs text-muted-foreground"
                  >
                    Reset to default
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Divider */}
            <div className="h-px bg-border/30 my-1" />

            {/* Auto Format */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                Auto Format
              </div>
              {onAutoFormat && hasSelection && (
                <FormatButton
                  icon={Wand2}
                  label="Format Selection"
                  onClick={() => onAutoFormat()}
                />
              )}
              {onAutoFormatAll && (
                <FormatButton
                  icon={Wand2}
                  label="Format Document"
                  onClick={() => onAutoFormatAll()}
                />
              )}
              {onAIFormat && (
                <FormatButton
                  icon={Sparkles}
                  label="AI Smart Format"
                  onClick={() => onAIFormat?.()}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Format Button Component for expanded panel
const FormatButton = ({
  icon: Icon,
  label,
  shortcut,
  onClick,
  isActive
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  onClick: () => void;
  isActive?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
      text-sm
      transition-all duration-150
      ${isActive
        ? 'bg-blue-500/20 text-blue-400'
        : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
      }
    `}
  >
    <Icon className="h-4 w-4 flex-shrink-0" />
    <span className="flex-1 text-left">{label}</span>
    {shortcut && (
      <span className="text-xs text-muted-foreground font-mono">{shortcut}</span>
    )}
  </button>
);
