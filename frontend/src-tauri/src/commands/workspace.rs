use tauri::command;
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceConfig {
    pub workspace_path: String,
    pub recent_files: Vec<String>,
    pub last_opened: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Get the default workspace path based on OS
fn get_default_workspace_path() -> Result<PathBuf, String> {
    // Get user's Documents directory
    let home_dir = dirs::document_dir()
        .ok_or("Failed to get documents directory")?;
    
    // Create MDReader folder in Documents
    Ok(home_dir.join("MDReader"))
}

/// Get the config file path (stored in app data directory)
fn get_config_path() -> Result<PathBuf, String> {
    // Get app data directory based on OS
    // Mac: ~/Library/Application Support/com.mdreader.app/
    // Windows: C:\Users\{user}\AppData\Roaming\com.mdreader.app\
    // Linux: ~/.config/mdreader/
    let config_dir = dirs::config_dir()
        .ok_or("Failed to get config directory")?
        .join("mdreader");
    
    // Create config directory if it doesn't exist
    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;
    
    Ok(config_dir.join("workspace-config.json"))
}

/// Create a directory (and parent directories if needed)
#[command]
pub async fn create_directory(path: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);
    
    fs::create_dir_all(&path_buf)
        .map_err(|e| format!("Failed to create directory '{}': {}", path, e))?;
    
    println!("✅ Created directory: {}", path);
    Ok(())
}

/// Get the default workspace path for the current OS
#[command]
pub async fn get_default_workspace_location() -> Result<String, String> {
    let path = get_default_workspace_path()?;
    Ok(path.to_string_lossy().to_string())
}

/// Save workspace configuration (v2 - new format)
#[command]
pub async fn save_workspace_config_v2(config: WorkspaceConfig) -> Result<(), String> {
    let config_path = get_config_path()?;
    
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, json)
        .map_err(|e| format!("Failed to save config: {}", e))?;
    
    println!("💾 Workspace config saved to: {}", config_path.display());
    Ok(())
}

/// Load workspace configuration (v2 - new format)
#[command]
pub async fn load_workspace_config_v2() -> Result<WorkspaceConfig, String> {
    let config_path = get_config_path()?;
    
    if !config_path.exists() {
        return Err("No workspace config found".to_string());
    }
    
    let json = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    
    let config: WorkspaceConfig = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse config: {}", e))?;
    
    println!("📂 Workspace config loaded: {}", config.workspace_path);
    Ok(config)
}

/// Check if workspace is configured
#[command]
pub async fn is_workspace_configured() -> Result<bool, String> {
    let config_path = get_config_path()?;
    Ok(config_path.exists())
}

/// Create default folder structure in workspace
#[command]
pub async fn create_default_folders(workspace_path: String) -> Result<Vec<String>, String> {
    let workspace = PathBuf::from(&workspace_path);
    
    if !workspace.exists() {
        fs::create_dir_all(&workspace)
            .map_err(|e| format!("Failed to create workspace: {}", e))?;
    }
    
    let folders = vec![
        "Quick Notes",
        "Projects",
    ];
    
    let mut created_folders = Vec::new();
    
    for folder_name in folders {
        let folder_path = workspace.join(folder_name);
        fs::create_dir_all(&folder_path)
            .map_err(|e| format!("Failed to create folder '{}': {}", folder_name, e))?;
        
        created_folders.push(folder_path.to_string_lossy().to_string());
        println!("  ✅ Created folder: {}", folder_name);
    }
    
    Ok(created_folders)
}

/// Create welcome document
#[command]
pub async fn create_welcome_document(workspace_path: String) -> Result<String, String> {
    let welcome_path = PathBuf::from(&workspace_path)
        .join("Quick Notes")
        .join("Welcome.md");
    
    let content = format!(r#"# Welcome to MDReader! 🎉

This is your **local workspace**. All your documents are stored as `.md` files on your computer.

## 🚀 Getting Started

- **Create Documents**: Click "New Doc" in the sidebar
- **Import Files**: Drag & drop `.md` files or use "Import"
- **Organize**: Create folders to organize your notes
- **Sync**: Use Git, Dropbox, or any sync tool

## 📁 Your Workspace Location

```
{}
```

You can open this folder in Finder/Explorer to:
- ✅ Backup your files
- ✅ Sync with Dropbox/OneDrive/Google Drive
- ✅ Version control with Git
- ✅ Edit with VS Code, Obsidian, or any markdown editor

## 🎨 Features

- **Real-time editing** with rich formatting
- **Offline-first** - works without internet
- **Local-first** - your data stays on your machine
- **Collaboration** - sync when you want to collaborate

Happy writing! ✍️

---

*Created by MDReader - The local-first markdown editor*
"#, workspace_path);
    
    fs::write(&welcome_path, content)
        .map_err(|e| format!("Failed to create welcome document: {}", e))?;
    
    println!("📄 Created Welcome.md");
    Ok(welcome_path.to_string_lossy().to_string())
}

/// List all markdown files and folders in a directory
#[command]
pub async fn list_workspace_contents(directory_path: String) -> Result<Vec<super::file_operations::FileMetadata>, String> {
    let path = PathBuf::from(&directory_path);
    
    if !path.exists() {
        return Err(format!("Directory does not exist: {}", directory_path));
    }
    
    let mut contents = Vec::new();
    
    let entries = fs::read_dir(&path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let metadata = entry.metadata()
            .map_err(|e| format!("Failed to read metadata: {}", e))?;
        
        let file_name = entry.file_name().to_string_lossy().to_string();
        
        // Skip hidden files and system files
        if file_name.starts_with('.') {
            continue;
        }
        
        // Include directories and .md files
        if metadata.is_dir() || file_name.ends_with(".md") {
            let modified = metadata.modified()
                .map(|t| format!("{:?}", t))
                .unwrap_or_else(|_| "Unknown".to_string());
            
            contents.push(super::file_operations::FileMetadata {
                name: file_name,
                path: entry.path().to_string_lossy().to_string(),
                size: metadata.len(),
                modified,
                is_directory: metadata.is_dir(),
            });
        }
    }
    
    // Sort: directories first, then files alphabetically
    contents.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.cmp(&b.name),
        }
    });
    
    Ok(contents)
}

/// Check if a directory exists and is accessible
#[command]
pub async fn verify_workspace_path(path: String) -> Result<bool, String> {
    let path_buf = PathBuf::from(&path);
    
    if !path_buf.exists() {
        return Ok(false);
    }
    
    // Try to read the directory to ensure we have permissions
    match fs::read_dir(&path_buf) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

