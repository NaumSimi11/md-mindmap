# 🦀 Tauri Commands API Reference

This document provides a complete reference for all Tauri backend commands available in MD Creator.

## 📁 File Operations Commands

### `select_workspace_folder()`

Opens a native folder picker dialog for workspace selection.

**Signature:**
```rust
#[command]
pub async fn select_workspace_folder() -> Result<String, String>
```

**Returns:**
- `Ok(String)` - Absolute path to selected folder
- `Err(String)` - Error message if no folder selected

**Example Usage:**
```javascript
import { invoke } from '@tauri-apps/api/tauri'

try {
  const folderPath = await invoke('select_workspace_folder')
  console.log('Selected workspace:', folderPath)
  // Example: "/Users/john/Documents/my-notes"
} catch (error) {
  console.error('No folder selected:', error)
}
```

**UI Flow:**
1. Native OS folder picker opens
2. User selects folder
3. Path returned or error if cancelled

---

### `list_workspace_files(workspace_path: String)`

Lists all `.md` files and directories in the workspace.

**Signature:**
```rust
#[command]
pub async fn list_workspace_files(workspace_path: String) -> Result<Vec<FileMetadata>, String>
```

**Parameters:**
- `workspace_path` - Absolute path to workspace folder

**Returns:**
```rust
pub struct FileMetadata {
    pub name: String,        // File name (e.g., "notes.md")
    pub path: String,        // Full path (e.g., "/workspace/notes.md")
    pub size: u64,          // File size in bytes
    pub modified: String,    // Last modified timestamp
    pub is_directory: bool,  // true if directory, false if file
}
```

**Example Usage:**
```javascript
try {
  const files = await invoke('list_workspace_files', {
    workspacePath: '/Users/john/Documents/notes'
  })
  
  files.forEach(file => {
    if (file.is_directory) {
      console.log('📁 Directory:', file.name)
    } else {
      console.log('📄 File:', file.name, `(${file.size} bytes)`)
    }
  })
} catch (error) {
  console.error('Failed to list files:', error)
}
```

**Features:**
- Only shows `.md` files and directories
- Sorted: directories first, then files alphabetically
- Includes file metadata for smart loading

---

### `save_document_to_file(file_path: String, content: String)`

Saves document content to a file with automatic `.md` extension.

**Signature:**
```rust
#[command]
pub async fn save_document_to_file(file_path: String, content: String) -> Result<(), String>
```

**Parameters:**
- `file_path` - Target file path (`.md` added if missing)
- `content` - Document content to save

**Example Usage:**
```javascript
const document = {
  path: '/Users/john/Documents/notes/project-plan',
  content: '# Project Plan\n\nThis is my project...'
}

try {
  await invoke('save_document_to_file', {
    filePath: document.path,
    content: document.content
  })
  console.log('✅ Document saved successfully')
  // File saved as: /Users/john/Documents/notes/project-plan.md
} catch (error) {
  console.error('❌ Save failed:', error)
}
```

**Features:**
- Automatic `.md` extension addition
- Overwrites existing files
- Creates parent directories if needed
- UTF-8 encoding

---

### `load_document_from_file(file_path: String)`

Loads document content from a file.

**Signature:**
```rust
#[command]
pub async fn load_document_from_file(file_path: String) -> Result<String, String>
```

**Parameters:**
- `file_path` - Absolute path to the file

**Returns:**
- `Ok(String)` - File content as UTF-8 string
- `Err(String)` - Error message if file not found/readable

**Example Usage:**
```javascript
try {
  const content = await invoke('load_document_from_file', {
    filePath: '/Users/john/Documents/notes/project-plan.md'
  })
  
  console.log('Loaded content:', content.substring(0, 100) + '...')
} catch (error) {
  console.error('❌ Load failed:', error)
}
```

---

### `create_new_file(workspace_path: String, file_name: String)`

Creates a new `.md` file with initial content.

**Signature:**
```rust
#[command]
pub async fn create_new_file(workspace_path: String, file_name: String) -> Result<String, String>
```

**Parameters:**
- `workspace_path` - Workspace folder path
- `file_name` - File name (`.md` added if missing)

**Returns:**
- `Ok(String)` - Full path to created file
- `Err(String)` - Error if file exists or creation failed

**Example Usage:**
```javascript
try {
  const filePath = await invoke('create_new_file', {
    workspacePath: '/Users/john/Documents/notes',
    fileName: 'new-idea'
  })
  
  console.log('✅ Created file:', filePath)
  // Returns: "/Users/john/Documents/notes/new-idea.md"
  // Initial content: "# new-idea\n\nStart writing..."
} catch (error) {
  console.error('❌ Creation failed:', error)
}
```

**Features:**
- Prevents overwriting existing files
- Generates initial content based on filename
- Returns full path for immediate use

---

### `delete_file(file_path: String)`

Deletes a file from the file system.

**Signature:**
```rust
#[command]
pub async fn delete_file(file_path: String) -> Result<(), String>
```

**Parameters:**
- `file_path` - Absolute path to file to delete

**Example Usage:**
```javascript
try {
  await invoke('delete_file', {
    filePath: '/Users/john/Documents/notes/old-file.md'
  })
  console.log('✅ File deleted successfully')
} catch (error) {
  console.error('❌ Delete failed:', error)
}
```

**⚠️ Warning:** This permanently deletes the file. Consider implementing trash/recycle bin functionality for safety.

---

## ⚙️ Configuration Commands

### `save_workspace_config(config: WorkspaceConfig)`

Saves workspace configuration to app config directory.

**Signature:**
```rust
#[command]
pub async fn save_workspace_config(config: WorkspaceConfig) -> Result<(), String>

pub struct WorkspaceConfig {
    pub workspace_path: String,
    pub recent_files: Vec<String>,
    pub last_opened: Option<String>,
}
```

**Example Usage:**
```javascript
const config = {
  workspace_path: '/Users/john/Documents/notes',
  recent_files: [
    '/Users/john/Documents/notes/project.md',
    '/Users/john/Documents/notes/ideas.md'
  ],
  last_opened: '/Users/john/Documents/notes/project.md'
}

try {
  await invoke('save_workspace_config', { config })
  console.log('✅ Workspace config saved')
} catch (error) {
  console.error('❌ Config save failed:', error)
}
```

**Storage Location:**
- macOS: `~/Library/Application Support/com.mdcreator.app/workspace.json`
- Windows: `%APPDATA%/com.mdcreator.app/workspace.json`
- Linux: `~/.config/com.mdcreator.app/workspace.json`

---

### `load_workspace_config()`

Loads workspace configuration from app config directory.

**Signature:**
```rust
#[command]
pub async fn load_workspace_config() -> Result<Option<WorkspaceConfig>, String>
```

**Returns:**
- `Ok(Some(WorkspaceConfig))` - Loaded configuration
- `Ok(None)` - No configuration file exists
- `Err(String)` - Error reading/parsing configuration

**Example Usage:**
```javascript
try {
  const config = await invoke('load_workspace_config')
  
  if (config) {
    console.log('Workspace:', config.workspace_path)
    console.log('Recent files:', config.recent_files.length)
    
    if (config.last_opened) {
      // Auto-open last file
      const content = await invoke('load_document_from_file', {
        filePath: config.last_opened
      })
    }
  } else {
    console.log('No workspace configured - first run')
  }
} catch (error) {
  console.error('❌ Config load failed:', error)
}
```

---

## 🚀 Usage Examples

### **Complete Workspace Setup Flow**

```javascript
import { invoke } from '@tauri-apps/api/tauri'

class WorkspaceManager {
  async setupWorkspace() {
    try {
      // 1. Select workspace folder
      const workspacePath = await invoke('select_workspace_folder')
      
      // 2. Save configuration
      await invoke('save_workspace_config', {
        config: {
          workspace_path: workspacePath,
          recent_files: [],
          last_opened: null
        }
      })
      
      // 3. Load existing files
      const files = await invoke('list_workspace_files', { workspacePath })
      
      // 4. Load documents into app
      const documents = []
      for (const file of files) {
        if (!file.is_directory) {
          const content = await invoke('load_document_from_file', {
            filePath: file.path
          })
          
          documents.push({
            id: file.path,
            name: file.name.replace('.md', ''),
            content,
            filePath: file.path,
            lastModified: new Date(file.modified)
          })
        }
      }
      
      return { workspacePath, documents }
      
    } catch (error) {
      console.error('Workspace setup failed:', error)
      throw error
    }
  }
  
  async saveDocument(document) {
    try {
      await invoke('save_document_to_file', {
        filePath: document.filePath,
        content: document.content
      })
      
      // Update recent files
      const config = await invoke('load_workspace_config')
      if (config) {
        config.recent_files = [
          document.filePath,
          ...config.recent_files.filter(f => f !== document.filePath)
        ].slice(0, 10) // Keep only 10 recent files
        
        config.last_opened = document.filePath
        
        await invoke('save_workspace_config', { config })
      }
      
    } catch (error) {
      console.error('Document save failed:', error)
      throw error
    }
  }
}
```

### **Auto-save Implementation**

```javascript
class AutoSaveManager {
  constructor(documentsStore) {
    this.documentsStore = documentsStore
    this.saveQueue = new Set()
    this.saving = false
  }
  
  startAutoSave() {
    setInterval(() => {
      this.processSaveQueue()
    }, 5000) // Save every 5 seconds
  }
  
  markForSave(documentId) {
    this.saveQueue.add(documentId)
  }
  
  async processSaveQueue() {
    if (this.saving || this.saveQueue.size === 0) return
    
    this.saving = true
    
    try {
      for (const docId of this.saveQueue) {
        const doc = this.documentsStore.getDocument(docId)
        if (doc && doc.isDirty) {
          await invoke('save_document_to_file', {
            filePath: doc.filePath,
            content: doc.content
          })
          
          doc.isDirty = false
          this.saveQueue.delete(docId)
        }
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      this.saving = false
    }
  }
}
```

---

## 🛡️ Security Considerations

### **File System Sandboxing**

Tauri commands are automatically sandboxed to prevent malicious file access:

- ✅ **User-selected folders**: Full access to chosen workspace
- ✅ **App config directory**: Read/write app configuration
- ❌ **System directories**: No access to OS system files
- ❌ **Other app data**: No access to other applications

### **Path Validation**

```rust
// Built-in path validation in commands
fn validate_workspace_path(path: &str) -> Result<(), String> {
    let path = PathBuf::from(path);
    
    // Ensure path exists and is directory
    if !path.exists() {
        return Err("Path does not exist".to_string());
    }
    
    if !path.is_dir() {
        return Err("Path is not a directory".to_string());
    }
    
    // Additional security checks...
    Ok(())
}
```

### **Error Handling**

All commands use `Result<T, String>` for consistent error handling:

```javascript
// Always wrap in try/catch
try {
  const result = await invoke('command_name', { params })
  // Handle success
} catch (error) {
  // Error is automatically a string message
  console.error('Command failed:', error)
  // Show user-friendly error message
}
```

---

## 📊 Performance Considerations

### **File Loading Optimization**

```javascript
// Load files in parallel for better performance
const loadAllDocuments = async (files) => {
  const loadPromises = files
    .filter(f => !f.is_directory)
    .map(async (file) => {
      try {
        const content = await invoke('load_document_from_file', {
          filePath: file.path
        })
        return { file, content }
      } catch (error) {
        console.warn(`Failed to load ${file.name}:`, error)
        return null
      }
    })
  
  const results = await Promise.all(loadPromises)
  return results.filter(Boolean) // Remove failed loads
}
```

### **Batched Operations**

```javascript
// Batch multiple saves for better performance
const saveMultipleDocuments = async (documents) => {
  const savePromises = documents.map(doc => 
    invoke('save_document_to_file', {
      filePath: doc.filePath,
      content: doc.content
    })
  )
  
  const results = await Promise.allSettled(savePromises)
  
  // Report any failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Failed to save ${documents[index].name}:`, result.reason)
    }
  })
}
```

---

## 📚 Related Documentation

- [Storage & Auth System](../architecture/storage-auth-system.md)
- [Development Setup](../development/setup.md)
- [Building Guide](../development/building.md)

**Last Updated**: September 2024  
**Next Review**: October 2024
