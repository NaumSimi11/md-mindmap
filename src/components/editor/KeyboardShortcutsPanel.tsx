/**
 * Keyboard Shortcuts Panel
 * Shows all available keyboard shortcuts in the editor
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  {
    category: 'Text Formatting',
    items: [
      { keys: ['Ctrl', 'B'], action: 'Bold' },
      { keys: ['Ctrl', 'I'], action: 'Italic' },
      { keys: ['Ctrl', 'U'], action: 'Underline' },
      { keys: ['Ctrl', 'Shift', 'X'], action: 'Strikethrough' },
      { keys: ['Ctrl', 'E'], action: 'Code' },
      { keys: ['Ctrl', 'Shift', 'H'], action: 'Highlight' },
    ],
  },
  {
    category: 'Headings',
    items: [
      { keys: ['Ctrl', 'Alt', '1'], action: 'Heading 1' },
      { keys: ['Ctrl', 'Alt', '2'], action: 'Heading 2' },
      { keys: ['Ctrl', 'Alt', '3'], action: 'Heading 3' },
      { keys: ['Ctrl', 'Alt', '0'], action: 'Normal text' },
    ],
  },
  {
    category: 'Lists',
    items: [
      { keys: ['Ctrl', 'Shift', '8'], action: 'Bullet list' },
      { keys: ['Ctrl', 'Shift', '9'], action: 'Numbered list' },
      { keys: ['Ctrl', 'Shift', '7'], action: 'Task list' },
    ],
  },
  {
    category: 'Editing',
    items: [
      { keys: ['Ctrl', 'Z'], action: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo' },
      { keys: ['Ctrl', 'C'], action: 'Copy' },
      { keys: ['Ctrl', 'X'], action: 'Cut' },
      { keys: ['Ctrl', 'V'], action: 'Paste' },
      { keys: ['Ctrl', 'A'], action: 'Select all' },
    ],
  },
  {
    category: 'Insert',
    items: [
      { keys: ['/'], action: 'Slash command menu' },
      { keys: ['Ctrl', 'K'], action: 'Insert link' },
      { keys: ['Ctrl', 'Shift', 'C'], action: 'Insert code block' },
      { keys: ['Tab'], action: 'Indent' },
      { keys: ['Shift', 'Tab'], action: 'Outdent' },
    ],
  },
  {
    category: 'Navigation',
    items: [
      { keys: ['Ctrl', 'Home'], action: 'Go to start' },
      { keys: ['Ctrl', 'End'], action: 'Go to end' },
      { keys: ['Cmd/Ctrl', 'Click'], action: 'Open link' },
    ],
  },
];

const KeyBadge = ({ keyName }: { keyName: string }) => (
  <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
    {keyName}
  </kbd>
);

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Master these shortcuts to work faster
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.action}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, kidx) => (
                        <React.Fragment key={kidx}>
                          <KeyBadge keyName={key} />
                          {kidx < shortcut.keys.length - 1 && (
                            <span className="text-xs text-muted-foreground">
                              +
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Replace "Ctrl" with "Cmd" (⌘) on Mac
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

