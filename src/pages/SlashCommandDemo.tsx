/**
 * SlashCommandDemo - Demo page for testing slash commands
 * Visit: http://localhost:8080/slash-demo
 */

import { useState, useRef } from 'react';
import SlashCommandMenu, { createSlashCommands, type SlashCommand } from '@/components/editor/SlashCommandMenu';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function SlashCommandDemo() {
  const [content, setContent] = useState('# Try Slash Commands!\n\nType `/` to see the magic ✨\n\n');
  const [slashMenu, setSlashMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    searchQuery: '',
    cursorPosition: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert text at cursor
  const insertAtCursor = (text: string, moveCursorBy: number = 0) => {
    if (!textareaRef.current) return;

    const start = slashMenu.cursorPosition;
    const before = content.slice(0, start);
    const after = content.slice(textareaRef.current.selectionStart);

    const newContent = before + text + after;
    setContent(newContent);

    // Close slash menu
    setSlashMenu(prev => ({ ...prev, isOpen: false }));

    // Move cursor
    setTimeout(() => {
      if (!textareaRef.current) return;
      const newCursorPos = start + text.length + moveCursorBy;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle AI actions
  const handleAIAction = (action: string) => {
    setSlashMenu(prev => ({ ...prev, isOpen: false }));
    alert(`🤖 AI Action: ${action}\n\nThis would trigger the AI assistant in the real editor!`);
  };

  // Create commands
  const commands = createSlashCommands(insertAtCursor, handleAIAction);

  // Handle textarea change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Detect slash command
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastLine = textBeforeCursor.split('\n').pop() || '';

    // Check if we just typed '/' at the start of a line or after whitespace
    const slashMatch = lastLine.match(/(?:^|\s)(\/\w*)$/);

    if (slashMatch) {
      const searchQuery = slashMatch[1].slice(1); // Remove the '/'
      const textarea = e.target;
      const rect = textarea.getBoundingClientRect();

      // Calculate approximate menu position
      const lineHeight = 24;
      const lines = textBeforeCursor.split('\n').length;

      setSlashMenu({
        isOpen: true,
        position: {
          x: rect.left + 40,
          y: rect.top + (lines * lineHeight),
        },
        searchQuery,
        cursorPosition: cursorPos - slashMatch[1].length,
      });
    } else if (slashMenu.isOpen) {
      setSlashMenu(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Handle command selection
  const handleCommandSelect = (command: SlashCommand) => {
    command.action();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Slash Commands Demo</h1>
                <p className="text-sm text-gray-500">Type `/` to see available commands</p>
              </div>
            </div>
            <Button onClick={() => setContent('')} variant="outline">
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Instructions */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 text-white">
            <h2 className="font-semibold mb-2">✨ How to use:</h2>
            <ul className="text-sm space-y-1 text-purple-100">
              <li>• Type <kbd className="px-2 py-0.5 bg-white/20 rounded">/</kbd> to open the command menu</li>
              <li>• Type to search (e.g., <kbd className="px-2 py-0.5 bg-white/20 rounded">/h1</kbd> or <kbd className="px-2 py-0.5 bg-white/20 rounded">/ai</kbd>)</li>
              <li>• Use <kbd className="px-2 py-0.5 bg-white/20 rounded">↑</kbd> <kbd className="px-2 py-0.5 bg-white/20 rounded">↓</kbd> to navigate</li>
              <li>• Press <kbd className="px-2 py-0.5 bg-white/20 rounded">Enter</kbd> to insert</li>
              <li>• Press <kbd className="px-2 py-0.5 bg-white/20 rounded">Esc</kbd> to close</li>
            </ul>
          </div>

          {/* Editor */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              className="w-full h-[600px] p-6 font-mono text-sm resize-none focus:outline-none"
              placeholder="Start typing... Press / for commands"
              style={{
                lineHeight: '24px',
              }}
            />
          </div>

          {/* Stats */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <span>Words: {content.split(/\s+/).filter(w => w).length}</span>
              <span>Characters: {content.length}</span>
              <span>Lines: {content.split('\n').length}</span>
            </div>
          </div>
        </div>

        {/* Available Commands Preview */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">📚 Available Commands ({commands.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {commands.map((cmd) => (
              <div key={cmd.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                  {cmd.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm text-gray-900">/{cmd.label.toLowerCase().replace(/\s+/g, '')}</div>
                  <div className="text-xs text-gray-500">{cmd.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slash Command Menu */}
      <SlashCommandMenu
        isOpen={slashMenu.isOpen}
        position={slashMenu.position}
        searchQuery={slashMenu.searchQuery}
        onSelect={handleCommandSelect}
        onClose={() => setSlashMenu(prev => ({ ...prev, isOpen: false }))}
        commands={commands}
      />
    </div>
  );
}
