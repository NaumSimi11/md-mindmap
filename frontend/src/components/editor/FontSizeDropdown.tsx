/**
 * Font Size Dropdown
 * Allows users to change the font size of selected text
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

interface FontSizeDropdownProps {
  editor: Editor;
}

const fontSizes = [
  { name: 'Small', value: '12px' },
  { name: 'Normal', value: '16px' },
  { name: 'Medium', value: '18px' },
  { name: 'Large', value: '24px' },
  { name: 'Extra Large', value: '32px' },
  { name: 'Huge', value: '48px' },
];

export const FontSizeDropdown: React.FC<FontSizeDropdownProps> = ({ editor }) => {
  const currentFontSize = editor.getAttributes('textStyle')?.fontSize || '';

  const setFontSize = (fontSize: string) => {
    if (fontSize === '') {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(fontSize).run();
    }
  };

  // Display current size or default
  const displaySize = currentFontSize || '16px';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1 min-w-[90px]">
          <Type className="h-4 w-4" />
          <span className="text-xs truncate">
            {fontSizes.find(f => f.value === currentFontSize)?.name || displaySize}
          </span>
          <ChevronDown className="h-3 w-3 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="start">
        <DropdownMenuLabel className="text-xs">Font Size</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {fontSizes.map((size) => (
          <DropdownMenuItem
            key={size.value}
            onClick={() => setFontSize(size.value)}
            className={currentFontSize === size.value ? 'bg-accent' : ''}
          >
            <span style={{ fontSize: size.value }} className="font-medium">
              {size.name}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">{size.value}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setFontSize('')}>
          <span className="text-xs text-muted-foreground">Reset to default</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

