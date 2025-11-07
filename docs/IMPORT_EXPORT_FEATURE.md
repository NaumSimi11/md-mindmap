# 📥📤 Import/Export Feature Implementation

## Overview

Implemented comprehensive import/export functionality for markdown documents in the WYSIWYG editor.

---

## ✅ Features Implemented

### **Import Functionality**

1. **Visible Import Button**
   - Added prominent "Import" button in the editor header
   - Quick access to import markdown files

2. **File Type Support**
   - `.md` / `.markdown` - Markdown files
   - `.txt` - Plain text files
   - `.html` / `.htm` - HTML files

3. **Import Modes**
   - **Insert Mode**: Insert file content at cursor position
   - **Replace Mode**: Replace entire document with file content
   - Accessible via dropdown menu: "Insert from file" or "Open file (replace document)"

4. **User Feedback**
   - Toast notifications for:
     - ✅ Successful imports
     - ❌ Invalid file types
     - ❌ Empty files
     - ❌ Parse errors

5. **Validation**
   - File type validation
   - Empty file detection
   - Error handling with user-friendly messages

---

### **Export Functionality**

1. **Visible Export Button**
   - Added prominent "Export" button in the editor header
   - One-click markdown export

2. **Export Format**
   - Exports as `.md` (Markdown) file
   - Properly converts WYSIWYG content to markdown
   - Preserves:
     - Headings, lists, links, images
     - Code blocks with syntax highlighting
     - Mermaid diagrams
     - Tables, callouts, and other custom nodes

3. **File Naming**
   - Uses document title for filename
   - Sanitizes special characters
   - Falls back to "Untitled Document" if no title

4. **User Feedback**
   - Toast notifications for:
     - ✅ Successful exports
     - ❌ Empty document warnings
     - ❌ Export errors

---

## 🎯 User Experience

### **Import Flow**
```
1. Click "Import" button
2. File picker opens
3. Select .md/.txt/.html file
4. Content is imported (inserted or replaces)
5. Toast notification confirms success
```

### **Export Flow**
```
1. Click "Export" button
2. Markdown file downloads automatically
3. Toast notification confirms download
```

---

## 🔧 Technical Details

### **Files Modified**

- `src/components/editor/WYSIWYGEditor.tsx`
  - Added `useToast` hook
  - Enhanced `handleFileChosen` with validation and toast notifications
  - Fixed `exportAsMarkdown` to export actual markdown (was exporting HTML)
  - Added Import/Export buttons to header
  - Updated dropdown menu with better labels

### **Key Functions**

1. **`handleFileChosen`**
   - Validates file type
   - Reads file content
   - Converts to HTML (for editor)
   - Inserts or replaces content
   - Shows toast notifications

2. **`exportAsMarkdown`**
   - Converts editor HTML to markdown using `htmlToMarkdown`
   - Creates blob with markdown content
   - Triggers download
   - Shows toast notification

---

## 📋 Supported File Types

| Extension | Type | Description |
|-----------|------|-------------|
| `.md` | Markdown | Standard markdown files |
| `.markdown` | Markdown | Alternative markdown extension |
| `.txt` | Plain Text | Plain text files (treated as markdown) |
| `.html` | HTML | HTML files (converted to markdown) |
| `.htm` | HTML | Alternative HTML extension |

---

## 🎨 UI Changes

### **Header Buttons**
- **Import Button**: Upload icon + "Import" label
- **Export Button**: Download icon + "Export" label
- Both buttons are visible and easily accessible

### **Dropdown Menu**
- "Insert from file…" - Insert at cursor
- "Open file… (replace document)" - Replace entire document
- "Export as Markdown" - Export current document

---

## 🚀 Future Enhancements

Potential improvements:
- [ ] Drag & drop file import
- [ ] Export to HTML/PDF formats
- [ ] Batch import multiple files
- [ ] Import from URL
- [ ] Export with custom templates
- [ ] Workspace-level import/export

---

## ✅ Testing Checklist

- [x] Import .md file (insert mode)
- [x] Import .md file (replace mode)
- [x] Import .txt file
- [x] Import .html file
- [x] Export markdown file
- [x] Toast notifications work
- [x] Error handling for invalid files
- [x] Error handling for empty files
- [x] File name sanitization
- [x] Mermaid diagrams preserved in export

---

## 📝 Notes

- The export function uses the existing `htmlToMarkdown` converter which handles all custom nodes (Mermaid, callouts, etc.)
- Import converts files to HTML first, then the editor handles the conversion internally
- File input accepts multiple MIME types for better browser compatibility
- Toast notifications use the existing `useToast` hook from shadcn/ui

