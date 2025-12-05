use tauri::command;
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileMetadata {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub modified: String,
    pub is_directory: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceConfig {
    pub workspace_path: String,
    pub recent_files: Vec<String>,
    pub last_opened: Option<String>,
}

// ========================================
// WORKSPACE MANAGEMENT
// ========================================

#[command]
pub async fn select_workspace_folder() -> Result<String, String> {
    use rfd::FileDialog;
    
    let folder = FileDialog::new()
        .set_title("Select Workspace Folder")
        .pick_folder();
    
    match folder {
        Some(path) => Ok(path.to_string_lossy().to_string()),
        None => Err("No folder selected".to_string()),
    }
}

#[command]
pub async fn list_workspace_files(workspace_path: String) -> Result<Vec<FileMetadata>, String> {
    let path = PathBuf::from(&workspace_path);
    
    if !path.exists() {
        return Err("Workspace path does not exist".to_string());
    }
    
    let mut files = Vec::new();
    
    let entries = fs::read_dir(&path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let metadata = entry.metadata()
            .map_err(|e| format!("Failed to read metadata: {}", e))?;
        
        let file_name = entry.file_name().to_string_lossy().to_string();
        
        // Only show .md files and directories
        if file_name.ends_with(".md") || metadata.is_dir() {
            files.push(FileMetadata {
                name: file_name,
                path: entry.path().to_string_lossy().to_string(),
                size: metadata.len(),
                modified: format!("{:?}", metadata.modified().unwrap_or(std::time::SystemTime::UNIX_EPOCH)),
                is_directory: metadata.is_dir(),
            });
        }
    }
    
    // Sort: directories first, then files alphabetically
    files.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.cmp(&b.name),
        }
    });
    
    Ok(files)
}

// ========================================
// FILE OPERATIONS
// ========================================

#[command]
pub async fn save_document_to_file(file_path: String, content: String) -> Result<(), String> {
    // Ensure the file has .md extension
    let path = if file_path.ends_with(".md") {
        file_path
    } else {
        format!("{}.md", file_path)
    };
    
    fs::write(&path, content)
        .map_err(|e| format!("Failed to save file: {}", e))?;
    
    Ok(())
}

#[command]
pub async fn load_document_from_file(file_path: String) -> Result<String, String> {
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[command]
pub async fn create_new_file(workspace_path: String, file_name: String) -> Result<String, String> {
    let file_name = if file_name.ends_with(".md") {
        file_name
    } else {
        format!("{}.md", file_name)
    };
    
    let file_path = PathBuf::from(&workspace_path).join(&file_name);
    
    if file_path.exists() {
        return Err("File already exists".to_string());
    }
    
    let initial_content = format!("# {}\n\nStart writing...", file_name.replace(".md", ""));
    
    fs::write(&file_path, initial_content)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    
    Ok(file_path.to_string_lossy().to_string())
}

#[command]
pub async fn delete_file(file_path: String) -> Result<(), String> {
    fs::remove_file(&file_path)
        .map_err(|e| format!("Failed to delete file: {}", e))
}

// ========================================
// WORKSPACE CONFIGURATION
// ========================================

#[command]
pub async fn save_workspace_config(config: WorkspaceConfig) -> Result<(), String> {
    let config_dir = dirs::config_dir()
        .ok_or("Failed to get config directory")?
        .join("md-creator");
    
    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;
    
    let config_file = config_dir.join("workspace.json");
    let config_json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(config_file, config_json)
        .map_err(|e| format!("Failed to save config: {}", e))?;
    
    Ok(())
}

#[command]
pub async fn load_workspace_config() -> Result<Option<WorkspaceConfig>, String> {
    let config_dir = dirs::config_dir()
        .ok_or("Failed to get config directory")?
        .join("md-creator");
    
    let config_file = config_dir.join("workspace.json");
    
    if !config_file.exists() {
        return Ok(None);
    }
    
    let config_json = fs::read_to_string(config_file)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    
    let config: WorkspaceConfig = serde_json::from_str(&config_json)
        .map_err(|e| format!("Failed to parse config: {}", e))?;
    
    Ok(Some(config))
}
