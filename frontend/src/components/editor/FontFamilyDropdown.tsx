/**
 * Font Family Dropdown
 * Allows users to change the font of selected text
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Type, ChevronDown } from 'lucide-react';
import type { Editor } from '@tiptap/react';

interface FontFamilyDropdownProps {
  editor: Editor;
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

export const FontFamilyDropdown: React.FC<FontFamilyDropdownProps> = ({ editor }) => {
  const currentFont = editor.getAttributes('textStyle')?.fontFamily || '';

  const setFont = (fontFamily: string) => {
    if (fontFamily === '') {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(fontFamily).run();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1 min-w-[120px]">
          <Type className="h-4 w-4" />
          <span className="text-xs truncate">
            {fontFamilies.find(f => f.value === currentFont)?.name || 'Font'}
          </span>
          <ChevronDown className="h-3 w-3 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel className="text-xs">Font Family</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {fontFamilies.map((font) => (
          <DropdownMenuItem
            key={font.value}
            onClick={() => setFont(font.value)}
            className={currentFont === font.value ? 'bg-accent' : ''}
            style={{ fontFamily: font.value }}
          >
            <span>{font.name}</span>
            {font.value === '' && <span className="ml-auto text-xs text-muted-foreground">Reset</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

