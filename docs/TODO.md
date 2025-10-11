# 📋 MD Creator - TODO & Feature Roadmap

> **Last Updated:** October 7, 2025  
> **Status:** Active Development

---

## ✅ Recently Completed

### Workspace Improvements
- [x] Removed duplicate "New Doc" button from top bar
- [x] Added dedicated "Document Name" input in New Document modal
- [x] Implemented desktop folder sync for existing `.md` files
- [x] Created adaptive sidebar with two-tab system:
  - **All Docs** - Browse all workspace documents
  - **This Doc** - Focus on current document
- [x] Fixed sidebar alignment issues across all tabs

### Document Outline Feature
- [x] Created live-syncing Document Outline
- [x] Enhanced outline to show:
  - Headings (H1-H6)
  - Bullet list items
  - Numbered list items
  - Bold text items (when following headings)
- [x] Added hierarchical indentation and visual styling
- [x] Implemented click-to-navigate (logs to console for now)

### Context Documents System ⭐ NEW
- [x] Created "Context Documents" tab in sidebar
- [x] Added folder organization system
- [x] Implemented file upload functionality:
  - Desktop: Native Tauri file picker
  - Web: Browser file input
- [x] Support for multiple file types:
  - PDFs, Word docs (.doc, .docx)
  - Markdown (.md)
  - Excel (.xlsx, .xls)
  - PowerPoint (.pptx)
  - Images (.png, .jpg, .jpeg)
  - Text files (.txt)
- [x] Added file management (delete files, delete folders)
- [x] Visual file type icons and metadata display
- [x] **Context files now load content for .txt and .md files** (web mode)
- [x] **File preview with content display** (View in modal)
- [x] **Quick actions: Preview, Copy Content, Copy Path, Use as AI Context**

### Smart AI Modal ⭐⭐ JUST ADDED
- [x] Created new Smart AI Modal to replace diagram-focused modal
- [x] Integrated **Context Files** from sidebar into AI modal
- [x] Added **6 Quick Actions**:
  - ✍️ Write for me (generate new content)
  - ✨ Improve text (enhance & polish)
  - 📋 Summarize (condense content)
  - 🎯 Extract tasks (find action items)
  - 💭 Brainstorm (creative ideas)
  - 🪄 Auto-format (add markdown structure)
- [x] Context file selection with checkboxes
- [x] Smart context display (shows folder + file name with icon)
- [x] Automatic detection of selected text vs full document
- [x] State management lifted to Workspace level (shared between sidebar & editor)
- [x] Clean separation: Old modal kept for reference, new modal active

---

## 🎯 Context Documents - Feature Ideas

### **Purpose & Vision**
The Context Documents system helps users organize reference materials related to their current document. Think of it as a "research folder" that lives alongside each document, making it easy to:
- Keep all related files in one place
- Reference source materials while writing
- Prepare context for AI assistance
- Organize by category (Marketing, Research, Technical Specs, etc.)

### **Proposed Enhancement Options**

#### **Option 1: AI Context Integration** 🤖 (PARTIALLY IMPLEMENTED ✅)
**Goal:** AI Assistant can read and understand context files

**✅ What's Working:**
- Context files appear in Smart AI Modal
- Checkboxes to select which files to use
- Text (.txt) and Markdown (.md) content auto-loaded
- Files organized by folder (with icons)
- File size display for context awareness

**🚧 Still Needed:**
- PDF text extraction (pdf.js or Tauri plugin)
- Word document parsing (.docx → text)
- Excel reading (basic sheet parsing)
- **Actual AI service integration** (currently logs to console)
- Token counting and optimization
- Context injection into prompts

**User Flow (IMPLEMENTED):**
```
1. Upload marketing-research.md to Context folder ✅
2. Click ✨ AI button in toolbar ✅
3. See file in "Context Files" section ✅
4. Check the file to include as context ✅
5. Type prompt or use Quick Action ✅
6. Generate (currently logs, needs AI service) 🚧
```

---

#### **Option 2: Quick Insert/Reference** 📝 (MEDIUM PRIORITY)
**Goal:** Manually insert references, summaries, or content from context files

**Right-click Context Menu:**
- **"Insert Reference"** → `[See: competitor-analysis.pdf](#context/marketing/file1)`
- **"Insert Summary"** → AI generates 2-3 line summary + inserts
- **"Insert Content"** (for .md files) → Paste full markdown
- **"Copy Path"** → Copy file path for external use
- **"Preview"** → Quick view in modal

**Use Cases:**
- Academic writing (citations)
- Technical documentation (referencing other docs)
- Report writing (sourcing data)

---

#### **Option 3: Side-by-side View** 👁️ (LOW PRIORITY)
**Goal:** View context files while writing

**Features:**
- Split screen: Editor | File Viewer
- Support for:
  - PDF rendering (pdf.js)
  - Image preview
  - Markdown rendering
  - Basic .docx preview
- Resizable panels
- Pin/unpin files

**Complexity:** High (requires file viewers for each type)

---

#### **Option 4: Smart Context Suggestions** 💡 (FUTURE)
**Goal:** AI suggests which files to reference

**Features:**
- "You're writing about competitors. Use competitor-analysis.pdf?"
- Auto-detect relevant files based on document content
- Smart folder suggestions

---

## 🚀 Other Priority Features

### High Priority
- [x] ~~Connect AI modal to actual AI service~~ ✅ DONE
- [x] ~~Implement context injection~~ ✅ DONE (selected files → AI prompt)
- [x] ~~Context folder persistence~~ ✅ DONE (localStorage per document)
- [x] ~~File preview modal~~ ✅ DONE
- [ ] **PDF text extraction** for context files (can upload, can't read yet)
- [ ] **Word document parsing** (.docx → text)
- [ ] **Implement scroll-to-line in editor** (outline click currently logs only)
- [ ] **Search within context files** (full-text search)

### Medium Priority
- [ ] **Drag & drop file upload** (easier than clicking "Add File")
- [ ] **Folder icons customization** (choose your own emoji)
- [ ] **File tagging system** (tag files: #important, #reference, etc.)
- [ ] **Context file statistics** (show total size, file count)
- [ ] **Export context folder** (ZIP all files)

### Low Priority
- [ ] **Cloud sync for context files** (if workspace is cloud-based)
- [ ] **Shared context libraries** (team collaboration)
- [ ] **Version history for files** (track changes)

---

## 🎨 UI/UX Improvements

### Sidebar Enhancements
- [ ] Collapsible folders (expand/collapse)
- [ ] File preview on hover (tooltip with metadata)
- [ ] Drag to reorder folders
- [ ] Custom folder colors/themes

### Editor Enhancements
- [ ] Context panel pinned to bottom (quick access)
- [ ] Breadcrumb navigation (show current document path)
- [ ] Quick switch documents (Cmd+K → document search)

---

## 🐛 Known Issues

- [ ] Outline scroll-to-line not implemented (just console.log)
- [ ] Context files not persisted (lost on reload)
- [ ] No file size limit check (could upload huge files)
- [ ] Desktop file paths not validated (broken links possible)

---

## 📝 Technical Debt

- [ ] Add proper TypeScript types for context system
- [ ] Implement file storage service (abstract upload logic)
- [ ] Add error boundaries for file upload failures
- [ ] Write tests for context document CRUD operations
- [ ] Optimize large file handling (chunking, lazy loading)

---

## 💭 Open Questions

1. **Storage Strategy:**
   - Web mode: Where to store uploaded files? (LocalStorage? IndexedDB? Cloud?)
   - Desktop mode: Store references vs copy files?

2. **AI Integration:**
   - Which files should AI read automatically?
   - How to handle large files (PDFs > 10MB)?
   - Token limits for context injection?

3. **User Experience:**
   - Should context folders be per-document or per-workspace?
   - Allow linking same file to multiple documents?

---

## 🎯 Next Sprint Goals

1. **Implement Option 1 (AI Context Integration)** - Most impactful
2. **Fix scroll-to-line in outline** - Complete existing feature
3. **Add context persistence** - Don't lose files on reload
4. **File preview modal** - Basic viewing capability

---

## 📚 Documentation Needed

- [ ] User guide for Context Documents
- [ ] API documentation for file upload service
- [ ] Architecture doc for AI context system
- [ ] Best practices for organizing context files

---

## 🎉 Future Vision

**MD Creator as an AI-Powered Research & Writing Hub:**
- Upload all research materials to Context folders
- AI reads everything and helps you write
- Smart suggestions based on your sources
- One place for documents + research + AI assistance
- Export complete packages (document + sources)

**Imagine:**
> "Write a competitive analysis section using the files in Marketing Research folder"  
> *AI reads 5 PDFs + writes comprehensive analysis*

**That's the dream!** ✨

---

## 📞 Contribution Guidelines

When adding new features:
1. Update this TODO with implementation details
2. Check existing code patterns (`WorkspaceService`, `StorageService`)
3. Add TypeScript types
4. Test on both web and desktop modes
5. Update documentation

---

**Questions? Ideas? Open an issue or update this file!** 🚀
