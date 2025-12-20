/**
 * Unified Format Dropdown Menu
 * Consolidates all formatting options including font family and size
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  ChevronDown,
  Wand2,
  Sparkles,
  Type,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';

interface FormatDropdownProps {
  editor: Editor;
  onInsertTable: () => void;
  onInsertLink: () => void;
  onInsertImage: () => void;
  onAutoFormat?: () => void;
  onAutoFormatAll?: () => void;
  onAIFormat?: () => void;
}

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

export const FormatDropdown: React.FC<FormatDropdownProps> = ({
  editor,
  onInsertTable,
  onInsertLink,
  onInsertImage,
  onAutoFormat,
  onAutoFormatAll,
  onAIFormat,
}) => {
  const currentFont = editor.getAttributes('textStyle')?.fontFamily || '';
  const currentFontSize = editor.getAttributes('textStyle')?.fontSize || '';
  const { from, to } = editor.state.selection;
  const hasSelection = from !== to;
  // Force re-render on selection/transaction updates to reflect editor.isActive(...) state
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    if (!editor) return;
    const handle = () => forceUpdate();
    editor.on('transaction', handle);
    editor.on('selectionUpdate', handle);
    return () => {
      editor.off('transaction', handle);
      editor.off('selectionUpdate', handle);
    };
  }, [editor]);

  // Get current formatting status for display
  const getFormatLabel = () => {
    if (hasSelection) {
      const activeFormats = [];
      if (editor.isActive('bold')) activeFormats.push('Bold');
      if (editor.isActive('italic')) activeFormats.push('Italic');
      if (editor.isActive('heading', { level: 1 })) activeFormats.push('H1');
      if (editor.isActive('heading', { level: 2 })) activeFormats.push('H2');
      if (editor.isActive('heading', { level: 3 })) activeFormats.push('H3');
      
      if (activeFormats.length > 0) {
        return `Format (${activeFormats.join(', ')})`;
      }
      
      const fontName = fontFamilies.find(f => f.value === currentFont)?.name;
      const sizeName = fontSizes.find(f => f.value === currentFontSize)?.name;
      if (fontName && fontName !== 'Default') {
        return `Format (${fontName}${sizeName ? `, ${sizeName}` : ''})`;
      }
    }
    return 'Format';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <span className="text-xs">{getFormatLabel()}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 max-h-[80vh] overflow-y-auto" align="start">
        {/* TEXT FORMATTING */}
        <DropdownMenuLabel className="text-xs">Text Style</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent' : ''}
        >
          <Bold className="w-4 h-4 mr-2" />
          <span>Bold</span>
          <span className="ml-auto text-xs text-muted-foreground">Ctrl+B</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent' : ''}
        >
          <Italic className="w-4 h-4 mr-2" />
          <span>Italic</span>
          <span className="ml-auto text-xs text-muted-foreground">Ctrl+I</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'bg-accent' : ''}
        >
          <Strikethrough className="w-4 h-4 mr-2" />
          <span>Strikethrough</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'bg-accent' : ''}
        >
          <Code className="w-4 h-4 mr-2" />
          <span>Inline Code</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* HEADINGS */}
        <DropdownMenuLabel className="text-xs">Headings</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
        >
          <Heading1 className="w-4 h-4 mr-2" />
          <span>Heading 1</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
        >
          <Heading2 className="w-4 h-4 mr-2" />
          <span>Heading 2</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
        >
          <Heading3 className="w-4 h-4 mr-2" />
          <span>Heading 3</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* LISTS */}
        <DropdownMenuLabel className="text-xs">Lists</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent' : ''}
        >
          <List className="w-4 h-4 mr-2" />
          <span>Bullet List</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-accent' : ''}
        >
          <ListOrdered className="w-4 h-4 mr-2" />
          <span>Numbered List</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={editor.isActive('taskList') ? 'bg-accent' : ''}
        >
          <ListTodo className="w-4 h-4 mr-2" />
          <span>Task List</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* BLOCKS */}
        <DropdownMenuLabel className="text-xs">Blocks</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-accent' : ''}
        >
          <Quote className="w-4 h-4 mr-2" />
          <span>Quote</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="w-4 h-4 mr-2" />
          <span>Divider</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().setCodeBlock().run()}>
          <Code className="w-4 h-4 mr-2" />
          <span>Code Block</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* INSERT */}
        <DropdownMenuLabel className="text-xs">Insert</DropdownMenuLabel>
        <DropdownMenuItem onClick={onInsertLink}>
          <LinkIcon className="w-4 h-4 mr-2" />
          <span>Link</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onInsertImage}>
          <ImageIcon className="w-4 h-4 mr-2" />
          <span>Image</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onInsertTable}>
          <TableIcon className="w-4 h-4 mr-2" />
          <span>Table</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* FONT FAMILY */}
        <DropdownMenuLabel className="text-xs">Font Family</DropdownMenuLabel>
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
            className={currentFont === font.value ? 'bg-accent' : ''}
            style={{ fontFamily: font.value }}
          >
            <Type className="w-4 h-4 mr-2" />
            <span>{font.name}</span>
            {font.value === '' && <span className="ml-auto text-xs text-muted-foreground">Reset</span>}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* FONT SIZE */}
        <DropdownMenuLabel className="text-xs">Font Size</DropdownMenuLabel>
        {fontSizes.map((size) => (
          <DropdownMenuItem
            key={size.value}
            onClick={() => {
              editor.chain().focus().setFontSize(size.value).run();
            }}
            className={currentFontSize === size.value ? 'bg-accent' : ''}
          >
            <Type className="w-4 h-4 mr-2" />
            <span style={{ fontSize: size.value }} className="font-medium">
              {size.name}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">{size.value}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => editor.chain().focus().unsetFontSize().run()}>
          <Type className="w-4 h-4 mr-2" />
          <span className="text-xs text-muted-foreground">Reset to default</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* AUTO-FORMAT ACTIONS */}
        <DropdownMenuLabel className="text-xs">Auto-Format</DropdownMenuLabel>
        {onAutoFormat && hasSelection && (
          <DropdownMenuItem onClick={onAutoFormat}>
            <Wand2 className="w-4 h-4 mr-2" />
            <span>Format Selection</span>
          </DropdownMenuItem>
        )}
        {onAutoFormatAll && (
          <DropdownMenuItem onClick={onAutoFormatAll}>
            <Wand2 className="w-4 h-4 mr-2" />
            <span>Format Document</span>
          </DropdownMenuItem>
        )}
        {onAIFormat && (
          <DropdownMenuItem onClick={onAIFormat}>
            <Sparkles className="w-4 h-4 mr-2" />
            <span>AI Smart Format</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
