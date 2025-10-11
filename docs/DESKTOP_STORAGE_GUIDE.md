# 🗄️ Desktop Storage Guide

## Overview

MD Creator supports **two storage modes**:

1. **Web Mode** (Browser): Documents saved in `localStorage` (temporary)
2. **Desktop Mode** (Tauri): Documents saved as real `.md` files on your desktop (permanent)

---

## 🖥️ Desktop Mode (Tauri)

### Setup

1. **Launch the desktop app** (Tauri build)
2. **Go to the home screen** in your workspace
3. **You'll see a prominent warning:**
   ```
   💾 Important: Select a folder to save your documents!
   ```

### How to Select a Folder

1. Click the **"Select Folder"** button
2. Choose any folder on your desktop (e.g., `~/Documents/MyNotes/`)
3. ✅ All documents will now be saved as `.md` files in that folder!

### How It Works

```
Document: "Project Plan"
  ↓
Saved as: ~/Documents/MyNotes/project-plan.md
```

- **File names** are auto-generated from document titles
- **Content** is saved as standard Markdown
- **No data loss** on refresh!

### Sync Existing Files

If you already have `.md` files in a folder:

1. **Select that folder** as your workspace
2. Click **"Sync Files"**
3. All `.md` files will be imported into the sidebar!

---

## 🌐 Web Mode (Browser)

### How It Works

- Documents saved in `localStorage`
- **Persists across sessions** (unless you clear browser data)
- **Will be lost** if you:
  - Clear browser cache
  - Use incognito mode
  - Switch browsers

### When to Use

- Quick prototyping
- Temporary notes
- Testing features

### Recommendation

⚠️ **Use Desktop Mode for permanent storage!**

---

## 📁 File Structure

When you select a workspace folder, documents are saved like this:

```
~/Documents/MyNotes/
├── project-plan.md
├── meeting-notes.md
├── api-documentation.md
└── design-spec.md
```

- **Standard Markdown** format
- **Compatible** with any Markdown editor
- **Git-friendly** (commit to version control!)

---

## 🔄 Hybrid Storage

The app uses **hybrid storage**:

```
Desktop Mode:
  ├─ Content: Saved as .md files (permanent)
  └─ Metadata: Saved in localStorage (for quick access)

Web Mode:
  └─ Everything: Saved in localStorage (temporary)
```

---

## 🚀 Quick Start

### For Desktop Users:

1. **Launch the desktop app**
2. **Select a folder** (e.g., `~/Desktop/MDCreator/`)
3. **Create documents** → They're automatically saved as `.md` files!
4. **Refresh** → Your documents are still there! ✅

### For Web Users:

1. **Open in browser** (`npm run dev`)
2. **Create documents** → Saved in localStorage
3. ⚠️ **Don't clear browser data** or you'll lose everything!

---

## 🔧 Technical Details

### Storage Service

- **Location**: `src/services/storage/StorageService.ts`
- **Desktop Commands**: Uses Tauri file system APIs
- **Web Fallback**: Uses `localStorage` API

### Workspace Service

- **Location**: `src/services/workspace/WorkspaceService.ts`
- **Auto-detects** desktop vs web mode
- **Calls StorageService** for actual file operations

### File Naming

```typescript
sanitizeFileName(title: string): string {
  // "Project Plan 2024" → "project-plan-2024.md"
  return title
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase() + '.md';
}
```

---

## ❓ FAQ

### Q: Can I use Dropbox/Google Drive?

**A:** Yes! Just select a folder synced by Dropbox/Google Drive as your workspace.

### Q: Can I edit files in other editors?

**A:** Yes! Files are standard Markdown. Edit them in VS Code, Obsidian, etc.

### Q: What happens if I delete a file manually?

**A:** The app will show an error when trying to open it. You can remove it from the sidebar.

### Q: Can I have multiple workspaces?

**A:** Currently, only one workspace at a time. You can change it using "Change" button.

---

## 🎯 Best Practices

1. **Always select a workspace folder** (desktop mode)
2. **Use descriptive titles** (they become file names)
3. **Commit to Git** (for version control)
4. **Sync regularly** (to import new files)
5. **Backup your workspace folder** (just in case)

---

## 🐛 Troubleshooting

### Documents disappearing on refresh?

**Cause:** No workspace folder selected  
**Fix:** Select a folder using the "Select Folder" button

### "No workspace folder selected" error?

**Cause:** Running in desktop mode without selecting a folder  
**Fix:** Go to home screen and select a folder

### Files not syncing?

**Cause:** Folder path changed or files moved  
**Fix:** Click "Sync Files" again or re-select the folder

---

## 🔥 Summary

- **Desktop Mode**: Real `.md` files, permanent storage ✅
- **Web Mode**: Browser storage, temporary ⚠️
- **Hybrid**: Best of both worlds (metadata + files)
- **Git-friendly**: Standard Markdown format
- **Cross-compatible**: Works with any Markdown editor

**Choose Desktop Mode for permanent storage!** 💾

