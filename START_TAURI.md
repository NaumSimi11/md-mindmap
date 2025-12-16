# 🖥️ **HOW TO RUN TAURI DESKTOP APP**

**Complete guide to running the native desktop version**

---

## 📋 **PREREQUISITES**

### **1. Install Rust** (if not already installed)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### **2. Install Tauri CLI**
```bash
cd /Users/naum/Desktop/mdreader/mdreader-main/frontend
npm install -D @tauri-apps/cli
```

### **3. Verify Rust Installation**
```bash
rustc --version
cargo --version
```

---

## 🚀 **START TAURI DESKTOP APP**

### **Option 1: Development Mode (Recommended)**
```bash
cd /Users/naum/Desktop/mdreader/mdreader-main/frontend
npm run tauri dev
```

This will:
- ✅ Build Rust backend
- ✅ Start Vite dev server
- ✅ Open native desktop window
- ✅ Enable hot reload
- ✅ Enable DevTools

**First run may take 5-10 minutes** (compiling Rust dependencies)

---

### **Option 2: Production Build**
```bash
cd /Users/naum/Desktop/mdreader/mdreader-main/frontend
npm run tauri build
```

This creates a standalone desktop app:
- macOS: `.dmg` file in `src-tauri/target/release/bundle/dmg/`
- Windows: `.exe` file in `src-tauri/target/release/bundle/`
- Linux: `.deb` or `.AppImage` in `src-tauri/target/release/bundle/`

---

## 🎯 **WHAT TAURI ADDS**

### **Desktop-Specific Features**

1. **Native File System Access**
   - Choose workspace folder on first launch
   - Direct file read/write operations
   - No browser security restrictions

2. **File Watchers**
   - Real-time detection of external changes
   - Auto-reload when files change outside app
   - Notifications for file modifications

3. **Import/Export**
   - Drag & drop .md files
   - Bulk import from folders
   - Export workspace as .zip

4. **Better Performance**
   - Native rendering
   - Lower memory usage
   - Faster startup

5. **Offline-First**
   - Works completely offline
   - No internet required
   - Data stored locally

---

## 🔧 **TAURI + BACKEND SERVICES**

### **Full Stack Development**

**Terminal 1: Backend Services**
```bash
cd /Users/naum/Desktop/mdreader/mdreader-main
./start-all.sh
```

**Terminal 2: Tauri Desktop**
```bash
cd frontend
npm run tauri dev
```

This gives you:
- ✅ Desktop app with native features
- ✅ Backend API for auth & sync
- ✅ Hocuspocus for real-time collaboration
- ✅ PostgreSQL for cloud persistence

---

## 📊 **COMPARISON: WEB vs DESKTOP**

| Feature | Web Version | Desktop (Tauri) |
|---------|-------------|-----------------|
| **Browser** | ✅ Chrome/Firefox/Safari | ❌ Not needed |
| **File System** | ❌ Limited (IndexedDB) | ✅ Full access |
| **File Watchers** | ❌ No | ✅ Yes |
| **Import/Export** | ❌ Upload/Download only | ✅ Native dialogs |
| **Offline** | ✅ Works offline | ✅ Works offline |
| **Performance** | ✅ Good | ✅ Excellent |
| **Setup Time** | ✅ Instant | ⚠️ 5-10 min first run |
| **DevTools** | ✅ Browser DevTools | ✅ Same + Rust logs |
| **Hot Reload** | ✅ Yes | ✅ Yes |
| **Distribution** | ✅ URL only | ✅ Installable app |

---

## 🐛 **TROUBLESHOOTING**

### **Issue 1: Rust Not Found**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add to PATH
source $HOME/.cargo/env

# Verify
rustc --version
```

### **Issue 2: Tauri Build Fails**
```bash
# Clean build
cd frontend/src-tauri
cargo clean
cd ../..
npm run tauri dev
```

### **Issue 3: Workspace Not Initializing**
```bash
# Clear Tauri storage
rm -rf ~/Library/Application\ Support/com.mdreader.app

# Restart Tauri
npm run tauri dev
```

### **Issue 4: File Watcher Not Working**
Check that the Tauri commands are registered in `src-tauri/src/lib.rs`:
- `start_file_watcher`
- `stop_file_watcher`

---

## 📝 **CURRENT TAURI IMPLEMENTATION**

We've already implemented:

✅ **Workspace Management**
- `create_directory`
- `get_default_workspace_location`
- `save_workspace_config_v2`
- `load_workspace_config_v2`
- `is_workspace_configured`
- `create_default_folders`
- `create_welcome_document`
- `list_workspace_contents`
- `verify_workspace_path`

✅ **File Operations**
- `read_file_content`
- `write_file_content`
- `rename_file`
- `delete_file`
- `rename_directory`
- `delete_directory`
- `copy_file`
- `move_file`
- `file_exists`

✅ **Import/Export**
- `import_file`
- `export_file`
- `import_folder`
- `export_folder`
- `export_workspace_to_zip`

✅ **File Watchers**
- `start_file_watcher`
- `stop_file_watcher`
- Real-time change notifications

---

## 🎯 **RECOMMENDED WORKFLOW**

### **Phase 1: Web Development (Current)**
```bash
# Focus on core features
./start-all.sh
# Open http://localhost:5173
```

### **Phase 2: Desktop Testing**
```bash
# Test desktop-specific features
cd frontend
npm run tauri dev
```

### **Phase 3: Desktop Production**
```bash
# Build standalone app
npm run tauri build
```

---

## ✅ **WHEN TO USE TAURI**

Use Tauri when you need to test:
- 📁 File system integration
- 👀 File watchers
- 📥 Import/Export functionality
- 🖥️ Native desktop experience
- 📦 Standalone app distribution

Use Web when:
- 🚀 Developing core features
- 🐛 Debugging managers
- 🔄 Testing real-time sync
- 👥 Testing collaboration
- ⚡ Need fast iteration

---

## 🏁 **QUICK START**

**Want to try desktop app now?**
```bash
cd /Users/naum/Desktop/mdreader/mdreader-main/frontend
npm run tauri dev
```

**First time?** Expect 5-10 min compile time.  
**After that?** Opens in 10-20 seconds with hot reload.

---

**Currently, the web version is already running and working perfectly. Tauri is optional for desktop-specific features.**
