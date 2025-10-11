# 🎯 Context Files + AI Integration

> **Status:** ✅ IMPLEMENTED  
> **Date:** October 7, 2025  
> **Feature:** Connect sidebar context files to Smart AI Modal

---

## 📖 Overview

We've successfully integrated the **Context Documents** system with a new **Smart AI Modal**, allowing users to:
1. Upload reference files to the sidebar
2. Select files to use as AI context
3. Use Quick Actions for common AI tasks
4. Generate AI responses based on selected context

---

## 🏗️ Architecture

### **Data Flow:**
```
┌─────────────────┐
│  Workspace.tsx  │ ← Top-level state management
│                 │
│ contextFolders  │ (State)
└────────┬────────┘
         │
    ┌────┴─────────────────────┐
    │                          │
    ▼                          ▼
┌─────────────────┐   ┌──────────────────┐
│ AdaptiveSidebar │   │ WYSIWYGEditor    │
│                 │   │                  │
│  Pass folders   │   │  Pass folders    │
│  to Context     │   │  Flatten to list │
└────────┬────────┘   └────────┬─────────┘
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌──────────────────┐
│ContextDocuments│   │  SmartAIModal    │
│                 │   │                  │
│  Upload/Manage  │   │  Select & Use    │
│  folders/files  │   │  as AI context   │
└─────────────────┘   └──────────────────┘
```

### **State Management:**

**Workspace.tsx** (Top Level):
```typescript
const [contextFolders, setContextFolders] = useState<Array<{
  id: string;
  name: string;
  icon: string;
  files: Array<{
    id: string;
    name: string;
    type: 'pdf' | 'docx' | 'md' | 'xlsx' | 'txt' | 'other';
    content?: string; // Cached for .txt and .md
    path?: string;
  }>;
}>>([]);
```

**WYSIWYGEditor.tsx** (Flattens for AI Modal):
```typescript
const flattenedContextFiles = useMemo(() => {
  return contextFolders.flatMap(folder => 
    folder.files.map(file => ({
      id: file.id,
      name: `${folder.icon} ${folder.name} / ${file.name}`,
      content: file.content,
    }))
  );
}, [contextFolders]);
```

---

## ✨ Features Implemented

### 1. **Smart AI Modal**
Located: `src/components/modals/SmartAIModal.tsx`

**Features:**
- ✅ 6 Quick Actions (Write, Improve, Summarize, Extract Tasks, Brainstorm, Auto-format)
- ✅ Context file selection with checkboxes
- ✅ Smart detection (selected text vs full document)
- ✅ File size display for context awareness
- ✅ Keyboard shortcut support (Ctrl+Enter to generate)
- ✅ Loading state during generation

### 2. **Context Files Integration**
- ✅ Files from sidebar appear in AI modal
- ✅ Organized by folder (with emoji icons)
- ✅ Content auto-loaded for .txt and .md files
- ✅ Checkboxes to select which files to use
- ✅ File size display (helps with token management)

### 3. **State Lifting**
- ✅ Context folders managed at Workspace level
- ✅ Shared between sidebar and editor
- ✅ Bi-directional updates
- ✅ Clean separation of concerns

---

## 🎮 User Flow

### **Upload Context Files:**
1. Open document in editor
2. Click "Context" tab in sidebar
3. Click "Add Folder" → name it (e.g., "Marketing")
4. Click folder's "Add File" → select files
5. Files appear in folder with icons

### **Use Context Files with AI:**
1. Click **✨ AI** button in toolbar
2. See "Context Files" section with uploaded files
3. Check boxes for files you want to include
4. Type your prompt OR use Quick Action
5. Click "Generate"
6. AI uses selected files as context

### **Quick Actions:**
- **Write for me**: Generate new content from scratch
- **Improve text**: Polish selected text
- **Summarize**: Condense long content
- **Extract tasks**: Find action items
- **Brainstorm**: Generate creative ideas
- **Auto-format**: Add markdown structure

---

## 📁 File Structure

```
src/
├── pages/
│   └── Workspace.tsx                    ← State management
├── components/
│   ├── workspace/
│   │   ├── AdaptiveSidebar.tsx         ← Routes to Context/Editor
│   │   └── ContextDocuments.tsx        ← Upload & manage files
│   ├── editor/
│   │   └── WYSIWYGEditor.tsx           ← Flattens context for modal
│   └── modals/
│       ├── SmartAIModal.tsx            ← NEW! AI interface
│       └── AIAssistantModal.tsx        ← OLD (kept for reference)
```

---

## 🔧 Technical Implementation

### **Props Flow:**

**Workspace → AdaptiveSidebar:**
```typescript
<AdaptiveSidebar
  contextFolders={contextFolders}
  onContextFoldersChange={setContextFolders}
/>
```

**AdaptiveSidebar → ContextDocuments:**
```typescript
<ContextDocuments 
  folders={contextFolders}
  onFoldersChange={onContextFoldersChange}
/>
```

**Workspace → WYSIWYGEditor:**
```typescript
<WYSIWYGEditor
  contextFolders={contextFolders}
/>
```

**WYSIWYGEditor → SmartAIModal:**
```typescript
<SmartAIModal
  contextFiles={flattenedContextFiles}
  onGenerate={(prompt, contextIds) => {
    // TODO: Integrate AI service
  }}
/>
```

---

## 🚧 What's Missing (Next Steps)

### **High Priority:**
1. **AI Service Integration**
   - Connect to OpenAI / Anthropic / etc.
   - Implement context injection into prompts
   - Handle API errors gracefully

2. **PDF Text Extraction**
   - Use pdf.js for web mode
   - Use Tauri plugin for desktop
   - Cache extracted text in file.content

3. **Word Document Parsing**
   - Extract text from .docx files
   - Use mammoth.js or similar

4. **Context Persistence**
   - Save context folders with workspace
   - Load on document open

### **Medium Priority:**
1. Token counting & optimization
2. Smart context suggestions
3. Preview for binary files (PDF/DOCX)
4. Drag & drop file upload

---

## 🧪 Testing Guide

### **Manual Tests:**

**Test 1: Upload Context Files**
1. Create folder "Test Folder"
2. Upload a .txt file
3. Check file appears in folder
4. Verify file icon matches type

**Test 2: File Content Loading**
1. Upload a .md file with content
2. Click file → Preview
3. Verify content displays correctly

**Test 3: AI Modal Integration**
1. Upload 2-3 files
2. Click ✨ AI button
3. Verify files appear in "Context Files" section
4. Check/uncheck boxes
5. Verify selection count updates

**Test 4: Quick Actions**
1. Open AI modal
2. Click each Quick Action button
3. Verify prompt field updates
4. Check prompts are appropriate

**Test 5: Selected Text Detection**
1. Select text in editor
2. Open AI modal
3. Verify modal shows "Working with X selected words"

---

## 💡 Usage Examples

### **Example 1: Writing with Research**
```
1. Upload "competitor-analysis.md" to Marketing folder
2. Write intro paragraph in editor
3. Click ✨ AI → Select "Write for me"
4. Check competitor-analysis.md
5. Prompt: "Write a market trends section"
6. Generate → AI uses research to write
```

### **Example 2: Summarizing Multiple Sources**
```
1. Upload 3 research papers (.md files)
2. Click ✨ AI → Select "Summarize"
3. Check all 3 files
4. Prompt: "Summarize key findings from these papers"
5. Generate → AI synthesizes all sources
```

### **Example 3: Task Extraction**
```
1. Upload "meeting-notes.txt"
2. Click ✨ AI → Select "Extract tasks"
3. Check meeting-notes.txt
4. Generate → AI finds all action items
```

---

## 🎯 Design Decisions

### **Why lift state to Workspace?**
- Context files need to be shared between sidebar and editor
- Avoids prop drilling through multiple layers
- Single source of truth for all context data

### **Why flatten folders for AI Modal?**
- AI service doesn't need folder structure
- Simpler interface for file selection
- Display shows folder info (icon + name) for context

### **Why keep old AIAssistantModal?**
- Safe rollback if new modal has issues
- Reference for diagram-specific features
- Easy comparison during development

### **Why use checkboxes vs auto-include?**
- User control over context size (token management)
- Flexibility to mix/match files
- Clear visual feedback on what's included

---

## 📚 Related Documentation

- **Context Documents System**: See `TODO.md` for full feature roadmap
- **Smart AI Modal Props**: See `SmartAIModal.tsx` interface
- **File Upload Logic**: See `ContextDocuments.tsx`
- **Workspace State Management**: See `Workspace.tsx`

---

## 🎉 Success Criteria

✅ **ACHIEVED:**
- [x] Context files appear in AI modal
- [x] Files organized by folder
- [x] Content loaded for text files
- [x] Checkbox selection works
- [x] Quick Actions implemented
- [x] State shared across components
- [x] Clean separation from old modal

🚧 **NEXT:**
- [ ] Connect to real AI service
- [ ] Implement context injection
- [ ] Add PDF/DOCX parsing
- [ ] Persist context folders

---

## 🐛 Known Issues

1. **No AI service integration yet** (logs to console only)
2. **No PDF text extraction** (can upload, can't read)
3. **No .docx parsing** (can upload, can't read)
4. **Context folders not persisted** (lost on reload)

---

## 💬 Questions?

**Q: Where are context files stored?**  
A: Currently in Workspace component state. Will add persistence soon.

**Q: Can I use the same file for multiple documents?**  
A: Not yet. Context is per-document for now.

**Q: What's the file size limit?**  
A: No limit enforced yet. Be careful with large files.

**Q: How do I delete context files?**  
A: Click file's dropdown → Delete

**Q: Can I preview PDF files?**  
A: Not yet. Need to add pdf.js viewer.

---

**This feature is a MAJOR step toward making MD Creator an AI-powered research & writing hub!** 🚀

