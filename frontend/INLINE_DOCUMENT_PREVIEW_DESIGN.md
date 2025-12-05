# 🎨 INLINE DOCUMENT PREVIEW - Revolutionary UX Design

**Your Brilliant Idea:**
> "Can we have the preview INSIDE THE DOCUMENT instead of just in the chat?"

**Answer:** YES! Like GitHub PR diffs, VS Code inline suggestions, or Google Docs comments!

---

## 🎯 The Vision

### Current (Chat Preview):
```
[Document]          [Chat Sidebar]
                    ┌──────────────────┐
## Installation     │ 📝 PREVIEW       │
...                 │ ## Prerequisites │
                    │ - [ ] Node.js   │
## Configuration    │ [Apply] [Cancel] │
...                 └──────────────────┘
```

### NEW (Inline Document Preview):
```
[Document with Inline Preview]

## Installation
Some content...

┌─────────────────────────────────────────────────┐
│ 📍 AI SUGGESTION - Will be inserted here       │
├─────────────────────────────────────────────────┤
│ ## Prerequisites                                │
│ - [ ] Node.js 18+ installed                    │
│ - [ ] PostgreSQL running                       │
│ - [ ] Git configured                           │
├─────────────────────────────────────────────────┤
│ [✅ Accept] [📍 Change Position] [❌ Reject]   │
└─────────────────────────────────────────────────┘

## Configuration
Some content...
```

---

## 🏗️ Technical Architecture

### 1. **TipTap Decoration**

Use TipTap's decoration system to insert a "widget" at the target position:

```typescript
// src/components/editor/InlinePreviewDecoration.tsx

import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Decoration, DecorationSet } from 'prosemirror-view';

export function createInlinePreview(
  position: number,
  content: string,
  onAccept: () => void,
  onReject: () => void
) {
  // Create a DOM node for the preview
  const previewNode = document.createElement('div');
  previewNode.className = 'inline-preview-widget';
  previewNode.innerHTML = `
    <div class="preview-container">
      <div class="preview-header">
        📍 AI SUGGESTION - Will be inserted here
      </div>
      <div class="preview-content">
        ${renderMarkdown(content)}
      </div>
      <div class="preview-actions">
        <button class="accept-btn">✅ Accept</button>
        <button class="position-btn">📍 Change Position</button>
        <button class="reject-btn">❌ Reject</button>
      </div>
    </div>
  `;
  
  // Attach event listeners
  previewNode.querySelector('.accept-btn').addEventListener('click', onAccept);
  previewNode.querySelector('.reject-btn').addEventListener('click', onReject);
  
  // Create decoration
  return Decoration.widget(position, previewNode, {
    side: 1,
    ignoreSelection: true,
  });
}
```

### 2. **TipTap Extension**

Create a custom extension to manage inline previews:

```typescript
// src/extensions/InlinePreviewExtension.ts

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

export const InlinePreviewExtension = Extension.create({
  name: 'inlinePreview',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('inlinePreview'),
        
        state: {
          init() {
            return DecorationSet.empty;
          },
          
          apply(tr, decorationSet) {
            // Get preview data from transaction meta
            const preview = tr.getMeta('addInlinePreview');
            if (preview) {
              const decoration = createInlinePreview(
                preview.position,
                preview.content,
                preview.onAccept,
                preview.onReject
              );
              return DecorationSet.create(tr.doc, [decoration]);
            }
            
            // Clear preview
            if (tr.getMeta('clearInlinePreview')) {
              return DecorationSet.empty;
            }
            
            return decorationSet.map(tr.mapping, tr.doc);
          },
        },
        
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
```

### 3. **Integration with Staging Store**

Update the staging flow to show inline preview:

```typescript
// In useAIChat.ts

const acceptStaged = async () => {
  const staged = stagingStore.acceptStaged();
  if (!staged || !editor) return;
  
  // Clear inline preview
  editor.view.dispatch(
    editor.state.tr.setMeta('clearInlinePreview', true)
  );
  
  // Apply changes
  await applyChanges(staged);
};

// When content is staged
const stageContent = (content, position) => {
  stagingStore.stageContent(content);
  
  // Show inline preview in document
  editor.view.dispatch(
    editor.state.tr.setMeta('addInlinePreview', {
      position: calculatePosition(position),
      content: content.generatedContent,
      onAccept: acceptStaged,
      onReject: rejectStaged,
    })
  );
};
```

---

## 🎨 Visual Design Mockups

### Style 1: GitHub-Style Diff
```
┌─────────────────────────────────────────────────┐
│ 🟢 AI Suggestion (+12 lines)                   │
├─────────────────────────────────────────────────┤
│ + ## Prerequisites                              │
│ +                                               │
│ + Before starting, ensure you have:             │
│ +                                               │
│ + - [ ] Node.js 18+ installed                  │
│ + - [ ] PostgreSQL 14+ running                 │
│ + - [ ] bcrypt library installed               │
├─────────────────────────────────────────────────┤
│ [Accept Changes] [Modify] [Reject]              │
└─────────────────────────────────────────────────┘
```

### Style 2: Google Docs-Style Suggestion
```
┌─────────────────────────────────────────────────┐
│ 💬 AI suggested adding content here             │
│                                                 │
│ ## Prerequisites                                │
│                                                 │
│ Before starting, ensure you have:               │
│                                                 │
│ - [ ] Node.js 18+ installed                    │
│ - [ ] PostgreSQL 14+ running                   │
│                                                 │
│ [✓ Accept] [✎ Edit] [✕ Reject]                │
└─────────────────────────────────────────────────┘
```

### Style 3: VS Code-Style Inline
```
┌─────────────────────────────────────────────────┐
│ ⚡ AI Preview │ 4 sections • 520 words         │
├─────────────────────────────────────────────────┤
│                                                 │
│ ## Prerequisites                                │
│ - [ ] Node.js 18+                              │
│ - [ ] PostgreSQL                               │
│ ...                                             │
│                                                 │
│ ## Authentication Flow                          │
│ 1. User Registration                            │
│ ...                                             │
│                                                 │
├─────────────────────────────────────────────────┤
│ 📍 After "Installation" ▼                      │
│ [Accept & Insert] [Change Position] [Discard]  │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Features

### 1. **Position Indicator**
```
## Installation
Some content...
      ↓
  ┌───┴───────────────────┐
  │ ⬇️ Insert here        │
  └───────────────────────┘
      ↓
[PREVIEW CONTENT]
      ↓
  ┌───┴───────────────────┐
  │ ⬆️ Insert above       │
  └───────────────────────┘
      ↓
## Configuration
```

### 2. **Collapsible Preview**
```
Collapsed:
┌──────────────────────────────────────┐
│ 📝 AI Suggestion (4 sections) [▼]   │
│ [Accept] [Reject]                    │
└──────────────────────────────────────┘

Expanded:
┌──────────────────────────────────────┐
│ 📝 AI Suggestion (4 sections) [▲]   │
├──────────────────────────────────────┤
│ [Full content preview]               │
├──────────────────────────────────────┤
│ [Accept] [Reject]                    │
└──────────────────────────────────────┘
```

### 3. **Position Selector (Dropdown)**
```
┌──────────────────────────────────────┐
│ 📍 Insert position:                  │
│ ┌──────────────────────────────────┐ │
│ │ ○ Start of document              │ │
│ │ ○ After "Introduction"           │ │
│ │ ● After "Installation" ✓         │ │
│ │ ○ Before "Configuration"         │ │
│ │ ○ End of document                │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### 4. **Live Reflow**

As user scrolls, the preview stays in place:
```
[Scrolling down...]

┌──────────────────────────────────────┐
│ 📝 AI Suggestion                     │
│ [Sticky at insertion point]          │
└──────────────────────────────────────┘
```

---

## 💡 Implementation Strategy

### Phase 1: Basic Inline Widget (2 hours)
- [ ] Create `InlinePreviewWidget` component
- [ ] Add TipTap decoration support
- [ ] Show preview at target position
- [ ] Basic styling (box with border)

### Phase 2: Actions & Interaction (2 hours)
- [ ] Add Accept/Reject buttons
- [ ] Wire up to staging store
- [ ] Handle accept → insert content
- [ ] Handle reject → clear preview

### Phase 3: Position Control (2 hours)
- [ ] Add position dropdown
- [ ] Calculate available positions
- [ ] Update preview on position change
- [ ] Visual indicators (arrows)

### Phase 4: Polish & UX (2 hours)
- [ ] Beautiful styling (gradients, shadows)
- [ ] Smooth animations (fade in/out)
- [ ] Collapsible preview
- [ ] Keyboard shortcuts (Tab to accept, Esc to reject)

### Phase 5: Advanced Features (3 hours)
- [ ] Diff view (show what's being added)
- [ ] Multiple previews (if multiple edits)
- [ ] Drag to reposition
- [ ] Preview conflicts (if inserting in edited area)

---

## 🎯 User Experience Flow

### Complete Workflow:

```
Step 1: User asks in chat
┌─────────────────────────────────┐
│ AI Chat                         │
│ You: "add prerequisites"        │
└─────────────────────────────────┘

Step 2: AI generates & shows inline preview
┌─────────────────────────────────────────────┐
│ [Document]                                  │
│                                             │
│ ## Installation                             │
│ ...                                         │
│                                             │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃ 📝 AI Suggestion                        ┃  │
│ ┃ ├─────────────────────────────────────┤ ┃  │
│ ┃ │ ## Prerequisites                    │ ┃  │
│ ┃ │ - [ ] Node.js 18+                  │ ┃  │
│ ┃ │ - [ ] PostgreSQL                   │ ┃  │
│ ┃ ├─────────────────────────────────────┤ ┃  │
│ ┃ │ 📍 After "Installation" ▼          │ ┃  │
│ ┃ │ [Accept] [Change] [Reject]         │ ┃  │
│ ┃ └─────────────────────────────────────┘ ┃  │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                             │
│ ## Configuration                            │
│ ...                                         │
└─────────────────────────────────────────────┘

Step 3: User clicks Accept
→ Preview fades out
→ Content is inserted
→ Document updates
✅ Done!
```

---

## 🔥 Why This is Amazing

1. **WYSIWYG** - See EXACTLY where content goes
2. **Contextual** - Actions right in the document
3. **No Context Switching** - Don't need to look at chat
4. **Visual Feedback** - Clear insertion point
5. **Intuitive** - Like familiar tools (Google Docs, GitHub)
6. **Professional** - Looks like a premium editor

---

## 🎨 Styling Example

```css
.inline-preview-widget {
  margin: 20px 0;
  border: 2px dashed #8b5cf6;
  border-radius: 12px;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.05), 
    rgba(59, 130, 246, 0.05)
  );
  backdrop-filter: blur(10px);
  padding: 16px;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.1);
  animation: fadeIn 0.3s ease-in-out;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #8b5cf6;
  margin-bottom: 12px;
}

.preview-content {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
  opacity: 0.9;
}

.preview-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 🚀 Next Steps

**Should we build this?**

This would be a GAME-CHANGER for the editor! Users would:
- ✅ See exactly where content goes
- ✅ Accept/reject in context
- ✅ Feel like using a premium tool
- ✅ Have zero confusion about placement

**Ready to implement?** 🎯🔥

