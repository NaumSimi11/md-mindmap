# 🚀 SLASH COMMANDS IMPLEMENTATION GUIDE

## ✅ COMPLETED: SlashCommandMenu Component Created

Location: `/src/components/editor/SlashCommandMenu.tsx`

This component provides:
- Modern slash command UI
- Keyboard navigation (↑↓ Enter Esc)
- Category grouping (Basic, Advanced, AI)
- 17 pre-built commands
- Search/filter functionality

---

## 📋 NEXT STEPS: Integration into Editor.tsx

Due to the size and complexity of Editor.tsx (1300+ lines), here's what needs to be added:

### 1. **Detect Slash Input** (Add to textarea onChange)

```typescript
const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  setMarkdownContent(value);
  
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
    
    // Calculate menu position
    const lineHeight = 20;
    const lines = textBeforeCursor.split('\n').length;
    
    setSlashMenu({
      isOpen: true,
      position: {
        x: rect.left + 20,
        y: rect.top + (lines * lineHeight),
      },
      searchQuery,
      cursorPosition: cursorPos - slashMatch[1].length,
    });
  } else if (slashMenu.isOpen) {
    setSlashMenu(prev => ({ ...prev, isOpen: false }));
  }
};
```

### 2. **Command Handlers**

```typescript
// Insert text at cursor
const insertAtCursor = (text: string, moveCursorBy: number = 0) => {
  const textarea = document.querySelector('.desktop-editor-textarea') as HTMLTextAreaElement;
  if (!textarea) return;
  
  const start = slashMenu.cursorPosition;
  const before = markdownContent.slice(0, start);
  const after = markdownContent.slice(textarea.selectionStart);
  
  const newContent = before + text + after;
  setMarkdownContent(newContent);
  
  // Close slash menu
  setSlashMenu(prev => ({ ...prev, isOpen: false }));
  
  // Move cursor
  setTimeout(() => {
    const newCursorPos = start + text.length + moveCursorBy;
    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  }, 0);
};

// AI action handler
const handleAIAction = (action: string) => {
  setSlashMenu(prev => ({ ...prev, isOpen: false }));
  
  switch (action) {
    case 'continue':
      // Open AI modal with "continue writing" prompt
      setAiOpen(true);
      break;
    case 'improve':
      // Get selected text or paragraph and improve it
      setAiOpen(true);
      break;
    case 'mindmap':
      setShowMindmapModal(true);
      setMindmapModalMode('headings');
      break;
    case 'summarize':
      // Summarize current document
      setAiOpen(true);
      break;
  }
};

// Create commands
const slashCommands = createSlashCommands(insertAtCursor, handleAIAction);

// Handle command selection
const handleSlashCommandSelect = (command: SlashCommand) => {
  command.action();
};
```

### 3. **Add SlashCommandMenu to JSX** (Before closing </div>)

```tsx
{/* Slash Command Menu */}
<SlashCommandMenu
  isOpen={slashMenu.isOpen}
  position={slashMenu.position}
  searchQuery={slashMenu.searchQuery}
  onSelect={handleSlashCommandSelect}
  onClose={() => setSlashMenu(prev => ({ ...prev, isOpen: false }))}
  commands={slashCommands}
/>
```

---

## 🎯 SIMPLIFIED ALTERNATIVE: Quick Demo

If the full integration is too complex, create a minimal demo:

**File:** `/src/pages/SlashCommandDemo.tsx`

```typescript
import { useState } from 'react';
import SlashCommandMenu, { createSlashCommands } from '@/components/editor/SlashCommandMenu';

export default function SlashCommandDemo() {
  const [content, setContent] = useState('');
  const [slashMenu, setSlashMenu] = useState({
    isOpen: false,
    position: { x: 100, y: 100 },
    searchQuery: '',
    cursorPosition: 0,
  });

  const insertText = (text: string) => {
    setContent(prev => prev + text);
    setSlashMenu(prev => ({ ...prev, isOpen: false }));
  };

  const handleAI = (action: string) => {
    alert(`AI Action: ${action}`);
    setSlashMenu(prev => ({ ...prev, isOpen: false }));
  };

  const commands = createSlashCommands(insertText, handleAI);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Slash Command Demo</h1>
      <button 
        onClick={() => setSlashMenu(prev => ({ ...prev, isOpen: !prev.isOpen }))}
        className="px-4 py-2 bg-purple-600 text-white rounded"
      >
        Toggle Slash Menu
      </button>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-64 mt-4 p-4 border rounded"
        placeholder="Type your content here..."
      />

      <SlashCommandMenu
        isOpen={slashMenu.isOpen}
        position={slashMenu.position}
        searchQuery={slashMenu.searchQuery}
        onSelect={(cmd) => cmd.action()}
        onClose={() => setSlashMenu(prev => ({ ...prev, isOpen: false }))}
        commands={commands}
      />
    </div>
  );
}
```

Add route in App.tsx:
```tsx
<Route path="/slash-demo" element={<SlashCommandDemo />} />
```

Then visit: `http://localhost:8080/slash-demo`

---

## 📝 RECOMMENDATION

1. **Start with the demo page** to see the slash menu working
2. **Test all commands** to ensure they work
3. **Then integrate** into the main Editor.tsx

Want me to create the demo page so you can see it working right away?
