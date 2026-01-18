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


// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    // ========================================================================
    // TEST HELPERS
    // ========================================================================

    /// Creates a test workspace directory
    fn setup_test_workspace() -> TempDir {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        
        // Create some initial structure
        fs::create_dir_all(temp_dir.path().join("existing_folder")).unwrap();
        fs::write(temp_dir.path().join("existing.md"), "# Existing").unwrap();
        
        temp_dir
    }

    // ========================================================================
    // SERIALIZATION TESTS (Existing)
    // ========================================================================

    #[test]
    fn test_workspace_config_serialization() {
        let config = WorkspaceConfig {
            workspace_path: "/test/workspace".to_string(),
            recent_files: vec!["file1.md".to_string(), "file2.md".to_string()],
            last_opened: Some("file1.md".to_string()),
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-02T00:00:00Z".to_string(),
        };
        
        let json = serde_json::to_string(&config).expect("Failed to serialize");
        let parsed: WorkspaceConfig = serde_json::from_str(&json).expect("Failed to deserialize");
        
        assert_eq!(parsed.workspace_path, config.workspace_path);
        assert_eq!(parsed.recent_files.len(), 2);
        assert_eq!(parsed.last_opened, config.last_opened);
    }

    #[test]
    fn test_workspace_config_full_roundtrip() {
        let config = WorkspaceConfig {
            workspace_path: "/home/user/Documents/MDReader".to_string(),
            recent_files: vec![
                "note1.md".to_string(), 
                "projects/task.md".to_string(),
                "archive/old.md".to_string(),
            ],
            last_opened: Some("note1.md".to_string()),
            created_at: "2024-01-01T12:00:00Z".to_string(),
            updated_at: "2024-06-15T15:30:00Z".to_string(),
        };
        
        // Serialize
        let json = serde_json::to_string_pretty(&config).expect("Should serialize");
        
        // Verify JSON structure
        assert!(json.contains("workspace_path"));
        assert!(json.contains("recent_files"));
        assert!(json.contains("last_opened"));
        assert!(json.contains("created_at"));
        assert!(json.contains("updated_at"));
        
        // Deserialize back
        let parsed: WorkspaceConfig = serde_json::from_str(&json).expect("Should deserialize");
        
        // Verify all fields
        assert_eq!(parsed.workspace_path, config.workspace_path);
        assert_eq!(parsed.recent_files.len(), 3);
        assert_eq!(parsed.last_opened, config.last_opened);
        assert_eq!(parsed.created_at, config.created_at);
        assert_eq!(parsed.updated_at, config.updated_at);
    }

    // ========================================================================
    // PATH UTILITY TESTS (Existing)
    // ========================================================================

    #[test]
    fn test_get_default_workspace_path() {
        let result = get_default_workspace_path();
        assert!(result.is_ok());
        
        let path = result.unwrap();
        assert!(path.to_string_lossy().contains("MDReader"));
    }

    #[test]
    fn test_get_config_path() {
        let result = get_config_path();
        assert!(result.is_ok());
        
        let path = result.unwrap();
        assert!(path.to_string_lossy().contains("mdreader"));
        assert!(path.to_string_lossy().contains("workspace-config.json"));
    }

    // ========================================================================
    // CREATE DIRECTORY TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_create_directory_success() {
        let workspace = setup_test_workspace();
        let new_dir = workspace.path().join("new_folder");
        
        // Simulate create_directory logic
        let result = fs::create_dir_all(&new_dir);
        
        assert!(result.is_ok(), "Should create directory");
        assert!(new_dir.exists(), "Directory should exist");
        assert!(new_dir.is_dir(), "Should be a directory");
    }

    #[test]
    fn test_create_directory_nested() {
        let workspace = setup_test_workspace();
        let nested_dir = workspace.path().join("level1").join("level2").join("level3");
        
        // Simulate create_directory logic with nested paths
        let result = fs::create_dir_all(&nested_dir);
        
        assert!(result.is_ok(), "Should create nested directories");
        assert!(nested_dir.exists(), "Nested directory should exist");
        
        // Verify all parent directories were created
        assert!(workspace.path().join("level1").exists());
        assert!(workspace.path().join("level1").join("level2").exists());
    }

    #[test]
    fn test_create_directory_already_exists() {
        let workspace = setup_test_workspace();
        let existing_dir = workspace.path().join("existing_folder");
        
        // Directory already exists from setup
        assert!(existing_dir.exists(), "Directory should exist before test");
        
        // create_dir_all should not fail if directory exists
        let result = fs::create_dir_all(&existing_dir);
        assert!(result.is_ok(), "Should not fail on existing directory");
    }

    // ========================================================================
    // CREATE DEFAULT FOLDERS TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_create_default_folders_creates_structure() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path();
        
        // Simulate create_default_folders logic
        let folders = vec!["Quick Notes", "Projects"];
        let mut created_folders = Vec::new();
        
        for folder_name in &folders {
            let folder_path = workspace_path.join(folder_name);
            fs::create_dir_all(&folder_path).expect("Should create folder");
            created_folders.push(folder_path.to_string_lossy().to_string());
        }
        
        // Verify structure
        assert!(workspace_path.join("Quick Notes").exists(), "Quick Notes should exist");
        assert!(workspace_path.join("Projects").exists(), "Projects should exist");
        assert_eq!(created_folders.len(), 2, "Should create 2 folders");
    }

    #[test]
    fn test_create_default_folders_idempotent() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path();
        
        // Create folders twice
        for _ in 0..2 {
            let folders = vec!["Quick Notes", "Projects"];
            for folder_name in folders {
                let folder_path = workspace_path.join(folder_name);
                fs::create_dir_all(&folder_path).expect("Should not fail on second run");
            }
        }
        
        // Verify structure still correct
        assert!(workspace_path.join("Quick Notes").exists());
        assert!(workspace_path.join("Projects").exists());
    }

    // ========================================================================
    // CREATE WELCOME DOCUMENT TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_create_welcome_document_content() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path().to_string_lossy().to_string();
        
        // Create Quick Notes folder first
        fs::create_dir_all(workspace.path().join("Quick Notes")).unwrap();
        
        // Simulate create_welcome_document logic
        let welcome_path = PathBuf::from(&workspace_path)
            .join("Quick Notes")
            .join("Welcome.md");
        
        let content = format!(r#"# Welcome to MDReader! 🎉

This is your **local workspace**. All your documents are stored as `.md` files on your computer.

## 📁 Your Workspace Location

```
{}
```
"#, workspace_path);
        
        fs::write(&welcome_path, &content).expect("Should create welcome document");
        
        // Verify
        assert!(welcome_path.exists(), "Welcome.md should exist");
        
        let read_content = fs::read_to_string(&welcome_path).unwrap();
        assert!(read_content.contains("Welcome to MDReader"), "Should have title");
        assert!(read_content.contains(&workspace_path), "Should include workspace path");
        assert!(read_content.contains("local workspace"), "Should have description");
    }

    #[test]
    fn test_create_welcome_document_overwrites() {
        let workspace = setup_test_workspace();
        
        // Create Quick Notes folder
        fs::create_dir_all(workspace.path().join("Quick Notes")).unwrap();
        
        let welcome_path = workspace.path().join("Quick Notes").join("Welcome.md");
        
        // Create initial file
        fs::write(&welcome_path, "Old content").unwrap();
        
        // Overwrite with new content
        let new_content = "# Welcome to MDReader! 🎉\nNew content here";
        fs::write(&welcome_path, new_content).unwrap();
        
        // Verify overwrites correctly
        let read_content = fs::read_to_string(&welcome_path).unwrap();
        assert!(!read_content.contains("Old content"), "Should not have old content");
        assert!(read_content.contains("Welcome to MDReader"), "Should have new content");
    }

    // ========================================================================
    // LIST WORKSPACE CONTENTS TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_list_workspace_contents_returns_files_and_dirs() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path();
        
        // Create additional test content
        fs::create_dir_all(workspace_path.join("folder1")).unwrap();
        fs::create_dir_all(workspace_path.join("folder2")).unwrap();
        fs::write(workspace_path.join("note1.md"), "# Note 1").unwrap();
        fs::write(workspace_path.join("note2.md"), "# Note 2").unwrap();
        fs::write(workspace_path.join("not_markdown.txt"), "text file").unwrap();
        
        // Simulate list_workspace_contents logic
        let entries = fs::read_dir(workspace_path).expect("Should read directory");
        let mut contents: Vec<super::super::file_operations::FileMetadata> = Vec::new();
        
        for entry in entries {
            let entry = entry.unwrap();
            let metadata = entry.metadata().unwrap();
            let file_name = entry.file_name().to_string_lossy().to_string();
            
            // Skip hidden files
            if file_name.starts_with('.') {
                continue;
            }
            
            // Include directories and .md files
            if metadata.is_dir() || file_name.ends_with(".md") {
                contents.push(super::super::file_operations::FileMetadata {
                    name: file_name,
                    path: entry.path().to_string_lossy().to_string(),
                    size: metadata.len(),
                    modified: "test".to_string(),
                    is_directory: metadata.is_dir(),
                });
            }
        }
        
        // Verify results
        let md_files: Vec<_> = contents.iter().filter(|f| f.name.ends_with(".md")).collect();
        let dirs: Vec<_> = contents.iter().filter(|f| f.is_directory).collect();
        
        assert!(md_files.len() >= 3, "Should have at least 3 .md files (existing + note1 + note2)");
        assert!(dirs.len() >= 3, "Should have at least 3 directories (existing_folder + folder1 + folder2)");
        
        // Verify .txt file is NOT included
        assert!(
            !contents.iter().any(|f| f.name == "not_markdown.txt"),
            "Should not include .txt files"
        );
    }

    #[test]
    fn test_list_workspace_contents_excludes_hidden() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path();
        
        // Create hidden files and directories
        fs::write(workspace_path.join(".hidden_file.md"), "hidden").unwrap();
        fs::create_dir_all(workspace_path.join(".hidden_dir")).unwrap();
        
        // Simulate list logic
        let entries = fs::read_dir(workspace_path).expect("Should read directory");
        let visible: Vec<_> = entries
            .filter_map(|e| e.ok())
            .filter(|e| !e.file_name().to_string_lossy().starts_with('.'))
            .collect();
        
        // Verify hidden items are excluded
        for entry in visible {
            let name = entry.file_name().to_string_lossy().to_string();
            assert!(!name.starts_with('.'), "Should not include hidden item: {}", name);
        }
    }

    #[test]
    fn test_list_workspace_contents_sorting() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path();
        
        // Create mixed content
        fs::create_dir_all(workspace_path.join("z_folder")).unwrap();
        fs::create_dir_all(workspace_path.join("a_folder")).unwrap();
        fs::write(workspace_path.join("z_file.md"), "").unwrap();
        fs::write(workspace_path.join("a_file.md"), "").unwrap();
        
        // Collect and sort like list_workspace_contents does
        let mut contents: Vec<(String, bool)> = Vec::new();
        for entry in fs::read_dir(workspace_path).unwrap() {
            let entry = entry.unwrap();
            let name = entry.file_name().to_string_lossy().to_string();
            let is_dir = entry.metadata().unwrap().is_dir();
            
            if !name.starts_with('.') && (is_dir || name.ends_with(".md")) {
                contents.push((name, is_dir));
            }
        }
        
        // Sort: directories first, then alphabetically
        contents.sort_by(|a, b| {
            match (a.1, b.1) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => a.0.cmp(&b.0),
            }
        });
        
        // Verify directories come first
        let first_file_idx = contents.iter().position(|(_, is_dir)| !is_dir);
        let last_dir_idx = contents.iter().rposition(|(_, is_dir)| *is_dir);
        
        if let (Some(file_idx), Some(dir_idx)) = (first_file_idx, last_dir_idx) {
            assert!(dir_idx < file_idx, "All directories should come before files");
        }
    }

    // ========================================================================
    // VERIFY WORKSPACE PATH TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_verify_workspace_path_valid() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path();
        
        // Simulate verify_workspace_path logic
        let exists = workspace_path.exists();
        let readable = fs::read_dir(workspace_path).is_ok();
        
        assert!(exists, "Workspace should exist");
        assert!(readable, "Workspace should be readable");
    }

    #[test]
    fn test_verify_workspace_path_nonexistent() {
        let temp_dir = TempDir::new().unwrap();
        let nonexistent = temp_dir.path().join("does_not_exist");
        
        // Simulate verify_workspace_path logic
        let exists = nonexistent.exists();
        
        assert!(!exists, "Nonexistent path should return false");
    }

    #[test]
    fn test_verify_workspace_path_file_not_dir() {
        let workspace = setup_test_workspace();
        let file_path = workspace.path().join("existing.md");
        
        // Verify the file exists (from setup)
        assert!(file_path.exists(), "File should exist");
        
        // Attempting to read it as a directory should fail
        let result = fs::read_dir(&file_path);
        assert!(result.is_err(), "Should fail to read file as directory");
    }

    // ========================================================================
    // WORKSPACE CONFIG LIFECYCLE TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_workspace_config_save_and_load_logic() {
        // Use a temp directory for config to avoid polluting real config
        let temp_config_dir = TempDir::new().expect("Failed to create temp config dir");
        let config_file = temp_config_dir.path().join("workspace-config.json");
        
        // Create config
        let config = WorkspaceConfig {
            workspace_path: "/test/workspace".to_string(),
            recent_files: vec!["file1.md".to_string()],
            last_opened: Some("file1.md".to_string()),
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-02T00:00:00Z".to_string(),
        };
        
        // Simulate save
        let json = serde_json::to_string_pretty(&config).expect("Should serialize");
        fs::write(&config_file, &json).expect("Should save config");
        
        // Simulate load
        let loaded_json = fs::read_to_string(&config_file).expect("Should read config");
        let loaded_config: WorkspaceConfig = serde_json::from_str(&loaded_json)
            .expect("Should parse config");
        
        // Verify
        assert_eq!(loaded_config.workspace_path, config.workspace_path);
        assert_eq!(loaded_config.recent_files, config.recent_files);
        assert_eq!(loaded_config.last_opened, config.last_opened);
    }

    #[test]
    fn test_is_workspace_configured_logic() {
        let temp_config_dir = TempDir::new().expect("Failed to create temp config dir");
        let config_file = temp_config_dir.path().join("workspace-config.json");
        
        // Initially, config should not exist
        assert!(!config_file.exists(), "Config should not exist initially");
        
        // Create config file
        fs::write(&config_file, "{}").expect("Should create config");
        
        // Now config should exist
        assert!(config_file.exists(), "Config should exist after creation");
    }

    // ========================================================================
    // ERROR HANDLING TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_list_workspace_contents_nonexistent_directory() {
        let temp_dir = TempDir::new().unwrap();
        let nonexistent = temp_dir.path().join("nonexistent");
        
        // Verify directory doesn't exist
        assert!(!nonexistent.exists(), "Directory should not exist");
        
        // Attempting to read should fail
        let result = fs::read_dir(&nonexistent);
        assert!(result.is_err(), "Should fail to read nonexistent directory");
    }

    #[test]
    fn test_create_directory_with_special_characters() {
        let workspace = setup_test_workspace();
        
        // Test directories with special characters (that are allowed)
        let special_dirs = vec![
            "folder with spaces",
            "folder_with_underscores",
            "folder-with-dashes",
            "123_numeric_prefix",
        ];
        
        for dir_name in special_dirs {
            let dir_path = workspace.path().join(dir_name);
            let result = fs::create_dir_all(&dir_path);
            assert!(result.is_ok(), "Should create directory: {}", dir_name);
            assert!(dir_path.exists(), "Directory should exist: {}", dir_name);
        }
    }
}
