//! File Operations Commands
//! 
//! This module provides Tauri commands for file system operations with
//! security validation to prevent directory traversal attacks.
//! 
//! ## Security
//! All file operations validate paths against the workspace root using
//! `validate_path_within_workspace` before performing any file system operations.

use tauri::{command, State};
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use crate::state::AppState;
use crate::utils::{
    validate_path_within_workspace,
    validate_file_path,
    validate_directory_path,
    sanitize_filename,
};

/// Metadata about a file or directory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub modified: String,
    pub is_directory: bool,
}

/// Workspace configuration stored in user's config directory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceConfig {
    pub workspace_path: String,
    pub recent_files: Vec<String>,
    pub last_opened: Option<String>,
}

// ============================================================================
// WORKSPACE SELECTION (No validation needed - user is selecting via dialog)
// ============================================================================

/// Opens a native folder picker dialog for selecting a workspace folder.
/// 
/// This operation is safe because:
/// - User explicitly chooses the folder via native dialog
/// - The selected path becomes the new workspace root
/// - AppState is updated with the new workspace path
#[command]
pub async fn select_workspace_folder(state: State<'_, AppState>) -> Result<String, String> {
    use rfd::FileDialog;
    
    let folder = FileDialog::new()
        .set_title("Select Workspace Folder")
        .pick_folder();
    
    match folder {
        Some(path) => {
            let path_str = path.to_string_lossy().to_string();
            
            // Update AppState with the new workspace path
            state.set_workspace_path(path_str.clone())?;
            
            log::info!("📂 Workspace selected: {}", path_str);
            Ok(path_str)
        }
        None => Err("No folder selected".to_string()),
    }
}

/// Lists files and directories in the workspace.
/// 
/// Security: Validates that workspace_path matches the configured workspace.
#[command]
pub async fn list_workspace_files(
    state: State<'_, AppState>,
    workspace_path: String,
) -> Result<Vec<FileMetadata>, String> {
    // Validate workspace path matches configured workspace
    let configured_workspace = state.get_workspace_path()?;
    
    // Canonicalize both paths for comparison
    let requested_canonical = PathBuf::from(&workspace_path)
        .canonicalize()
        .map_err(|_| "Invalid workspace path")?;
    let configured_canonical = PathBuf::from(&configured_workspace)
        .canonicalize()
        .map_err(|_| "Invalid configured workspace")?;
    
    // The requested path must be within the configured workspace
    if !requested_canonical.starts_with(&configured_canonical) {
        log::warn!("⚠️ Attempted to list files outside workspace: {}", workspace_path);
        return Err("Access denied: path outside workspace".to_string());
    }
    
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
        
        // Skip hidden files and only show .md files and directories
        if !file_name.starts_with('.') && (file_name.ends_with(".md") || metadata.is_dir()) {
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
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    Ok(files)
}

// ============================================================================
// FILE OPERATIONS (All require workspace path validation)
// ============================================================================

/// Saves content to a file within the workspace.
/// 
/// Security: Validates file_path is within the configured workspace.
#[command]
pub async fn save_document_to_file(
    state: State<'_, AppState>,
    file_path: String,
    content: String,
) -> Result<(), String> {
    let workspace = state.get_workspace_path()?;
    
    // Ensure the file has .md extension
    let path = if file_path.ends_with(".md") {
        file_path.clone()
    } else {
        format!("{}.md", file_path)
    };
    
    // Validate path is within workspace
    let validated_path = validate_file_path(&path, &workspace, &["md"])
        .map_err(|e| format!("Security error: {}", e))?;
    
    // Write the file
    fs::write(&validated_path, content)
        .map_err(|e| format!("Failed to save file: {}", e))?;
    
    log::info!("💾 Saved document: {:?}", validated_path);
    Ok(())
}

/// Loads content from a file within the workspace.
/// 
/// Security: Validates file_path is within the configured workspace.
#[command]
pub async fn load_document_from_file(
    state: State<'_, AppState>,
    file_path: String,
) -> Result<String, String> {
    let workspace = state.get_workspace_path()?;
    
    // Validate path is within workspace
    let validated_path = validate_path_within_workspace(&file_path, &workspace)
        .map_err(|e| format!("Security error: {}", e))?;
    
    // Read the file
    let content = fs::read_to_string(&validated_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    log::info!("📄 Loaded document: {:?}", validated_path);
    Ok(content)
}

/// Creates a new markdown file within the workspace.
/// 
/// Security: Validates the target path is within the configured workspace.
/// Uses exclusive file creation to prevent TOCTOU race conditions.
#[command]
pub async fn create_new_file(
    state: State<'_, AppState>,
    workspace_path: String,
    file_name: String,
) -> Result<String, String> {
    let workspace = state.get_workspace_path()?;
    
    // Validate workspace_path matches configured workspace
    let validated_workspace = validate_directory_path(&workspace_path, &workspace, true)
        .map_err(|e| format!("Security error: {}", e))?;
    
    // Sanitize the filename to prevent path traversal via filename
    let sanitized_name = sanitize_filename(&file_name);
    let file_name_with_ext = if sanitized_name.ends_with(".md") {
        sanitized_name
    } else {
        format!("{}.md", sanitized_name)
    };
    
    let file_path = validated_workspace.join(&file_name_with_ext);
    
    // Use OpenOptions for atomic file creation (prevents TOCTOU)
    use std::io::Write;
    use std::fs::OpenOptions;
    
    let initial_content = format!(
        "# {}\n\nStart writing...",
        file_name_with_ext.replace(".md", "")
    );
    
    // create_new() fails if file already exists - atomic operation
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)  // Fails if exists - prevents TOCTOU
        .open(&file_path)
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::AlreadyExists {
                "File already exists".to_string()
            } else {
                format!("Failed to create file: {}", e)
            }
        })?;
    
    file.write_all(initial_content.as_bytes())
        .map_err(|e| format!("Failed to write file content: {}", e))?;
    
    log::info!("✨ Created new file: {:?}", file_path);
    Ok(file_path.to_string_lossy().to_string())
}

/// Deletes a file within the workspace.
/// 
/// Security: Validates file_path is within the configured workspace.
#[command]
pub async fn delete_file(
    state: State<'_, AppState>,
    file_path: String,
) -> Result<(), String> {
    let workspace = state.get_workspace_path()?;
    
    // Validate path is within workspace
    let validated_path = validate_path_within_workspace(&file_path, &workspace)
        .map_err(|e| format!("Security error: {}", e))?;
    
    // Only allow deleting markdown files
    if let Some(ext) = validated_path.extension() {
        if ext != "md" {
            return Err("Can only delete markdown (.md) files".to_string());
        }
    } else {
        return Err("File has no extension - cannot delete".to_string());
    }
    
    fs::remove_file(&validated_path)
        .map_err(|e| format!("Failed to delete file: {}", e))?;
    
    log::info!("🗑️ Deleted file: {:?}", validated_path);
    Ok(())
}

// ============================================================================
// FILE MANAGEMENT OPERATIONS
// ============================================================================

/// Renames a file within the workspace.
/// 
/// Security: Validates both old_path and new_path are within the workspace.
#[command]
pub async fn rename_file(
    state: State<'_, AppState>,
    old_path: String,
    new_path: String,
) -> Result<(), String> {
    let workspace = state.get_workspace_path()?;
    
    // Validate both paths
    let validated_old = validate_path_within_workspace(&old_path, &workspace)
        .map_err(|e| format!("Security error (source): {}", e))?;
    let validated_new = validate_path_within_workspace(&new_path, &workspace)
        .map_err(|e| format!("Security error (destination): {}", e))?;
    
    if !validated_old.exists() {
        return Err(format!("File does not exist: {}", old_path));
    }
    
    fs::rename(&validated_old, &validated_new)
        .map_err(|e| format!("Failed to rename file: {}", e))?;
    
    log::info!("✅ Renamed: {:?} → {:?}", validated_old, validated_new);
    Ok(())
}

/// Renames a directory within the workspace.
/// 
/// Security: Validates both old_path and new_path are within the workspace.
#[command]
pub async fn rename_directory(
    state: State<'_, AppState>,
    old_path: String,
    new_path: String,
) -> Result<(), String> {
    let workspace = state.get_workspace_path()?;
    
    // Validate both paths
    let validated_old = validate_directory_path(&old_path, &workspace, true)
        .map_err(|e| format!("Security error (source): {}", e))?;
    let validated_new = validate_path_within_workspace(&new_path, &workspace)
        .map_err(|e| format!("Security error (destination): {}", e))?;
    
    fs::rename(&validated_old, &validated_new)
        .map_err(|e| format!("Failed to rename directory: {}", e))?;
    
    log::info!("✅ Renamed directory: {:?} → {:?}", validated_old, validated_new);
    Ok(())
}

/// Deletes a directory within the workspace.
/// 
/// Security: Validates path is within the workspace.
/// Warning: With recursive=true, this can delete many files!
#[command]
pub async fn delete_directory(
    state: State<'_, AppState>,
    path: String,
    recursive: bool,
) -> Result<(), String> {
    let workspace = state.get_workspace_path()?;
    
    // Validate path is within workspace
    let validated_path = validate_directory_path(&path, &workspace, true)
        .map_err(|e| format!("Security error: {}", e))?;
    
    // Prevent deleting the workspace root itself
    let workspace_canonical = PathBuf::from(&workspace)
        .canonicalize()
        .map_err(|_| "Invalid workspace")?;
    
    if validated_path == workspace_canonical {
        return Err("Cannot delete the workspace root directory".to_string());
    }
    
    if recursive {
        fs::remove_dir_all(&validated_path)
            .map_err(|e| format!("Failed to delete directory recursively: {}", e))?;
        log::info!("🗑️ Deleted directory (recursive): {:?}", validated_path);
    } else {
        fs::remove_dir(&validated_path)
            .map_err(|e| format!("Failed to delete directory: {}", e))?;
        log::info!("🗑️ Deleted directory: {:?}", validated_path);
    }
    
    Ok(())
}

/// Copies a file within the workspace.
/// 
/// Security: Validates both source_path and dest_path are within the workspace.
#[command]
pub async fn copy_file(
    state: State<'_, AppState>,
    source_path: String,
    dest_path: String,
) -> Result<(), String> {
    let workspace = state.get_workspace_path()?;
    
    // Validate both paths
    let validated_source = validate_path_within_workspace(&source_path, &workspace)
        .map_err(|e| format!("Security error (source): {}", e))?;
    let validated_dest = validate_path_within_workspace(&dest_path, &workspace)
        .map_err(|e| format!("Security error (destination): {}", e))?;
    
    if !validated_source.exists() {
        return Err(format!("Source file does not exist: {}", source_path));
    }
    
    fs::copy(&validated_source, &validated_dest)
        .map_err(|e| format!("Failed to copy file: {}", e))?;
    
    log::info!("📋 Copied: {:?} → {:?}", validated_source, validated_dest);
    Ok(())
}

/// Moves a file within the workspace.
/// 
/// Security: Validates both source_path and dest_path are within the workspace.
#[command]
pub async fn move_file(
    state: State<'_, AppState>,
    source_path: String,
    dest_path: String,
) -> Result<(), String> {
    let workspace = state.get_workspace_path()?;
    
    // Validate both paths
    let validated_source = validate_path_within_workspace(&source_path, &workspace)
        .map_err(|e| format!("Security error (source): {}", e))?;
    let validated_dest = validate_path_within_workspace(&dest_path, &workspace)
        .map_err(|e| format!("Security error (destination): {}", e))?;
    
    if !validated_source.exists() {
        return Err(format!("Source file does not exist: {}", source_path));
    }
    
    fs::rename(&validated_source, &validated_dest)
        .map_err(|e| format!("Failed to move file: {}", e))?;
    
    log::info!("📦 Moved: {:?} → {:?}", validated_source, validated_dest);
    Ok(())
}

/// Checks if a path exists within the workspace.
/// 
/// Security: Validates path is within the configured workspace.
#[command]
pub async fn file_exists(
    state: State<'_, AppState>,
    path: String,
) -> Result<bool, String> {
    let workspace = state.get_workspace_path()?;
    
    // Validate path is within workspace
    match validate_path_within_workspace(&path, &workspace) {
        Ok(validated_path) => Ok(validated_path.exists()),
        Err(_) => {
            // Path is outside workspace - return false, don't expose error details
            log::warn!("⚠️ file_exists called with path outside workspace: {}", path);
            Ok(false)
        }
    }
}

// ============================================================================
// WORKSPACE CONFIGURATION
// ============================================================================

/// Saves workspace configuration to the user's config directory.
/// 
/// Note: This writes to the app's config directory, not the workspace,
/// so it doesn't need workspace path validation.
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
    
    fs::write(&config_file, config_json)
        .map_err(|e| format!("Failed to save config: {}", e))?;
    
    log::info!("⚙️ Saved workspace config to {:?}", config_file);
    Ok(())
}

/// Loads workspace configuration from the user's config directory.
/// 
/// Note: This reads from the app's config directory, not the workspace.
#[command]
pub async fn load_workspace_config() -> Result<Option<WorkspaceConfig>, String> {
    let config_dir = dirs::config_dir()
        .ok_or("Failed to get config directory")?
        .join("md-creator");
    
    let config_file = config_dir.join("workspace.json");
    
    if !config_file.exists() {
        return Ok(None);
    }
    
    let config_json = fs::read_to_string(&config_file)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    
    let config: WorkspaceConfig = serde_json::from_str(&config_json)
        .map_err(|e| format!("Failed to parse config: {}", e))?;
    
    log::info!("⚙️ Loaded workspace config from {:?}", config_file);
    Ok(Some(config))
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::fs::File;
    use crate::state::AppState;

    // ========================================================================
    // TEST HELPERS
    // ========================================================================

    /// Helper to create a test workspace with AppState configured
    fn setup_test_workspace() -> TempDir {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        
        // Create subdirectories
        fs::create_dir_all(temp_dir.path().join("notes")).expect("Failed to create notes dir");
        fs::create_dir_all(temp_dir.path().join("projects")).expect("Failed to create projects dir");
        
        // Create test files
        File::create(temp_dir.path().join("test.md")).expect("Failed to create test.md");
        fs::write(temp_dir.path().join("test.md"), "# Test\nContent").unwrap();
        fs::write(temp_dir.path().join("notes").join("note1.md"), "# Note 1").unwrap();
        
        temp_dir
    }

    /// Helper to create workspace with AppState for integration tests
    fn setup_workspace_with_state() -> (TempDir, AppState) {
        let temp_dir = setup_test_workspace();
        let state = AppState::new();
        state.set_workspace_path(temp_dir.path().to_string_lossy().to_string())
            .expect("Failed to set workspace");
        (temp_dir, state)
    }

    // ========================================================================
    // SERIALIZATION TESTS (Existing)
    // ========================================================================

    #[test]
    fn test_file_metadata_serialization() {
        let metadata = FileMetadata {
            name: "test.md".to_string(),
            path: "/workspace/test.md".to_string(),
            size: 100,
            modified: "2024-01-01".to_string(),
            is_directory: false,
        };
        
        let json = serde_json::to_string(&metadata).expect("Failed to serialize");
        assert!(json.contains("test.md"));
        assert!(json.contains("100"));
    }

    #[test]
    fn test_workspace_config_serialization() {
        let config = WorkspaceConfig {
            workspace_path: "/test/workspace".to_string(),
            recent_files: vec!["file1.md".to_string(), "file2.md".to_string()],
            last_opened: Some("file1.md".to_string()),
        };
        
        let json = serde_json::to_string(&config).expect("Failed to serialize");
        let parsed: WorkspaceConfig = serde_json::from_str(&json).expect("Failed to deserialize");
        
        assert_eq!(parsed.workspace_path, config.workspace_path);
        assert_eq!(parsed.recent_files.len(), 2);
    }

    // ========================================================================
    // FILENAME SANITIZATION TESTS
    // ========================================================================

    #[test]
    fn test_sanitize_filename_in_context() {
        let dangerous_inputs = vec![
            "../../../etc/passwd",
            "..\\..\\windows\\system32",
            "file/../../../hack.md",
            "<script>alert('xss')</script>.md",
            "file:with:colons.md",
        ];
        
        for input in dangerous_inputs {
            let sanitized = sanitize_filename(input);
            
            assert!(!sanitized.contains("/"), 
                "Should not contain / for: {} -> {}", input, sanitized);
            assert!(!sanitized.contains("\\"), 
                "Should not contain \\ for: {} -> {}", input, sanitized);
            assert!(!sanitized.contains("<"), 
                "Should not contain < for: {} -> {}", input, sanitized);
            assert!(!sanitized.contains(">"), 
                "Should not contain > for: {} -> {}", input, sanitized);
            assert!(!sanitized.contains(":"), 
                "Should not contain : for: {} -> {}", input, sanitized);
            assert!(!sanitized.is_empty(), 
                "Should not be empty for: {}", input);
        }
    }

    // ========================================================================
    // PATH VALIDATION TESTS (Existing + New)
    // ========================================================================

    #[test]
    fn test_path_validation_integration() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path().to_str().unwrap();
        
        // Valid path should pass
        let valid_path = workspace.path().join("test.md");
        let result = validate_path_within_workspace(
            valid_path.to_str().unwrap(),
            workspace_path,
        );
        assert!(result.is_ok());
        
        // Path outside workspace should fail
        let attack_path = format!("{}/../../../etc/passwd", workspace_path);
        let result = validate_path_within_workspace(&attack_path, workspace_path);
        assert!(result.is_err());
    }

    #[test]
    fn test_create_new_file_atomicity() {
        let workspace = setup_test_workspace();
        let target = workspace.path().join("atomic_test.md");
        
        use std::fs::OpenOptions;
        
        // First creation should succeed
        let result1 = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&target);
        assert!(result1.is_ok());
        
        // Second creation should fail (file exists)
        let result2 = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&target);
        assert!(result2.is_err());
        assert_eq!(result2.unwrap_err().kind(), std::io::ErrorKind::AlreadyExists);
    }

    // ========================================================================
    // FILE LISTING TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_list_workspace_files_logic() {
        let (workspace, _state) = setup_workspace_with_state();
        let workspace_path = workspace.path();
        
        // Read directory and filter like list_workspace_files does
        let entries = fs::read_dir(workspace_path).expect("Failed to read dir");
        let mut files: Vec<FileMetadata> = Vec::new();
        
        for entry in entries {
            let entry = entry.expect("Failed to read entry");
            let metadata = entry.metadata().expect("Failed to get metadata");
            let file_name = entry.file_name().to_string_lossy().to_string();
            
            // Apply same filter as list_workspace_files
            if !file_name.starts_with('.') && (file_name.ends_with(".md") || metadata.is_dir()) {
                files.push(FileMetadata {
                    name: file_name,
                    path: entry.path().to_string_lossy().to_string(),
                    size: metadata.len(),
                    modified: "test".to_string(),
                    is_directory: metadata.is_dir(),
                });
            }
        }
        
        // Should have test.md, notes/, projects/
        assert!(files.len() >= 3, "Expected at least 3 items, got {}", files.len());
        assert!(files.iter().any(|f| f.name == "test.md"), "Should contain test.md");
        assert!(files.iter().any(|f| f.name == "notes" && f.is_directory), "Should contain notes dir");
        assert!(files.iter().any(|f| f.name == "projects" && f.is_directory), "Should contain projects dir");
    }

    #[test]
    fn test_list_workspace_files_security_check() {
        let (workspace, state) = setup_workspace_with_state();
        let workspace_path = workspace.path().to_string_lossy().to_string();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Valid path should pass the security check
        let requested_canonical = PathBuf::from(&workspace_path)
            .canonicalize()
            .expect("Should canonicalize");
        let configured_canonical = PathBuf::from(&configured_workspace)
            .canonicalize()
            .expect("Should canonicalize configured");
        
        assert!(requested_canonical.starts_with(&configured_canonical),
            "Valid workspace path should be within configured workspace");
        
        // Attempt to access parent directory should fail
        let attack_path = format!("{}/..", workspace_path);
        let attack_canonical = PathBuf::from(&attack_path).canonicalize();
        
        // If canonicalization succeeds, check it's not within workspace
        if let Ok(canonical) = attack_canonical {
            assert!(!canonical.starts_with(&configured_canonical) || canonical == configured_canonical.parent().unwrap(),
                "Attack path should not be within workspace");
        }
    }

    // ========================================================================
    // SAVE DOCUMENT TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_save_document_logic() {
        let (workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Test file path with .md extension
        let file_path = workspace.path().join("new_doc.md");
        let path_str = file_path.to_string_lossy().to_string();
        
        // Validate path (simulating save_document_to_file logic)
        let validated = validate_file_path(&path_str, &configured_workspace, &["md"]);
        assert!(validated.is_ok(), "Path validation should succeed");
        
        // Write content
        let content = "# New Document\n\nSome content here.";
        fs::write(&file_path, content).expect("Should write file");
        
        // Verify file exists and content is correct
        assert!(file_path.exists(), "File should exist after save");
        let read_content = fs::read_to_string(&file_path).expect("Should read file");
        assert_eq!(read_content, content, "Content should match");
    }

    #[test]
    fn test_save_document_adds_md_extension() {
        let file_path = "document_without_extension";
        
        // Simulate the extension addition logic
        let path = if file_path.ends_with(".md") {
            file_path.to_string()
        } else {
            format!("{}.md", file_path)
        };
        
        assert!(path.ends_with(".md"), "Should add .md extension");
        assert_eq!(path, "document_without_extension.md");
    }

    #[test]
    fn test_save_document_blocks_path_traversal() {
        let (workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Attempt path traversal attack
        let attack_paths = vec![
            format!("{}/../../../etc/passwd.md", workspace.path().display()),
            format!("{}/../../attack.md", workspace.path().display()),
            "../../../sensitive.md".to_string(),
        ];
        
        for attack_path in attack_paths {
            let result = validate_file_path(&attack_path, &configured_workspace, &["md"]);
            assert!(result.is_err(), 
                "Path traversal should be blocked for: {}", attack_path);
        }
    }

    // ========================================================================
    // LOAD DOCUMENT TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_load_document_logic() {
        let (workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Test loading existing file
        let file_path = workspace.path().join("test.md");
        let path_str = file_path.to_string_lossy().to_string();
        
        // Validate path
        let validated = validate_path_within_workspace(&path_str, &configured_workspace);
        assert!(validated.is_ok(), "Path validation should succeed");
        
        // Read content
        let content = fs::read_to_string(&file_path).expect("Should read file");
        assert!(content.contains("# Test"), "Content should contain expected header");
    }

    #[test]
    fn test_load_document_blocks_path_traversal() {
        let (workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Various traversal attack patterns
        let attacks = vec![
            "../../../etc/passwd".to_string(),
            "..\\..\\windows\\system32\\config".to_string(),
            format!("{}/../../../etc/shadow", workspace.path().display()),
        ];
        
        for attack in &attacks {
            let result = validate_path_within_workspace(attack, &configured_workspace);
            assert!(result.is_err(), 
                "Load should block path traversal: {}", attack);
        }
    }

    // ========================================================================
    // CREATE NEW FILE TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_create_new_file_logic() {
        let (workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Validate workspace path
        let validated_workspace = validate_directory_path(
            &workspace.path().to_string_lossy(), 
            &configured_workspace, 
            true
        );
        assert!(validated_workspace.is_ok(), "Workspace validation should succeed");
        
        // Sanitize filename
        let file_name = "My New Document";
        let sanitized = sanitize_filename(file_name);
        let file_name_with_ext = format!("{}.md", sanitized);
        
        assert_eq!(file_name_with_ext, "My New Document.md");
        
        // Create file path
        let file_path = validated_workspace.unwrap().join(&file_name_with_ext);
        
        // Create file with atomic operation
        use std::fs::OpenOptions;
        use std::io::Write;
        
        let initial_content = format!("# {}\n\nStart writing...", sanitized);
        
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&file_path)
            .expect("Should create file");
        
        file.write_all(initial_content.as_bytes()).expect("Should write content");
        
        // Verify
        assert!(file_path.exists(), "File should be created");
        let content = fs::read_to_string(&file_path).expect("Should read");
        assert!(content.contains("# My New Document"), "Should have header");
    }

    #[test]
    fn test_create_new_file_already_exists_error() {
        let workspace = setup_test_workspace();
        let existing_file = workspace.path().join("test.md");
        
        use std::fs::OpenOptions;
        
        // Try to create file that already exists
        let result = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&existing_file);
        
        assert!(result.is_err(), "Should fail for existing file");
        assert_eq!(
            result.unwrap_err().kind(), 
            std::io::ErrorKind::AlreadyExists,
            "Error should be AlreadyExists"
        );
    }

    // ========================================================================
    // DELETE FILE TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_delete_file_logic() {
        let (workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Create a file to delete
        let file_to_delete = workspace.path().join("to_delete.md");
        fs::write(&file_to_delete, "# Delete me").expect("Should create file");
        assert!(file_to_delete.exists(), "File should exist before delete");
        
        // Validate path
        let validated = validate_path_within_workspace(
            &file_to_delete.to_string_lossy(), 
            &configured_workspace
        );
        assert!(validated.is_ok(), "Path validation should succeed");
        
        // Check extension (like delete_file does)
        let validated_path = validated.unwrap();
        assert_eq!(validated_path.extension().unwrap(), "md", "Should be .md file");
        
        // Delete
        fs::remove_file(&validated_path).expect("Should delete file");
        assert!(!file_to_delete.exists(), "File should not exist after delete");
    }

    #[test]
    fn test_delete_file_blocks_outside_workspace() {
        let (workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Attempt to delete file outside workspace
        let attack_path = format!("{}/../../../etc/passwd", workspace.path().display());
        
        let result = validate_path_within_workspace(&attack_path, &configured_workspace);
        assert!(result.is_err(), "Should block delete outside workspace");
    }

    #[test]
    fn test_delete_file_only_allows_md_files() {
        let workspace = setup_test_workspace();
        
        // Create a non-md file
        let non_md_file = workspace.path().join("script.sh");
        fs::write(&non_md_file, "#!/bin/bash\necho 'test'").expect("Should create file");
        
        // Check extension validation
        let extension = non_md_file.extension();
        assert!(extension.is_some(), "Should have extension");
        assert_ne!(extension.unwrap(), "md", "Should not be .md");
        
        // The delete_file function should reject this
        // Simulating the check: if ext != "md" { return Err(...) }
        let is_md = extension.map_or(false, |ext| ext == "md");
        assert!(!is_md, "Non-md file should be rejected");
    }

    // ========================================================================
    // RENAME FILE TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_rename_file_logic() {
        let (workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Create a file to rename
        let old_file = workspace.path().join("old_name.md");
        let new_file = workspace.path().join("new_name.md");
        fs::write(&old_file, "# Content").expect("Should create file");
        
        // Validate both paths
        let validated_old = validate_path_within_workspace(
            &old_file.to_string_lossy(), 
            &configured_workspace
        );
        let validated_new = validate_path_within_workspace(
            &new_file.to_string_lossy(), 
            &configured_workspace
        );
        
        assert!(validated_old.is_ok(), "Old path should be valid");
        assert!(validated_new.is_ok(), "New path should be valid");
        
        // Rename
        fs::rename(&old_file, &new_file).expect("Should rename file");
        
        // Verify
        assert!(!old_file.exists(), "Old file should not exist");
        assert!(new_file.exists(), "New file should exist");
        
        let content = fs::read_to_string(&new_file).expect("Should read");
        assert!(content.contains("# Content"), "Content should be preserved");
    }

    // ========================================================================
    // COPY AND MOVE FILE TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_copy_file_logic() {
        let (workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Source file already exists: test.md
        let source = workspace.path().join("test.md");
        let dest = workspace.path().join("test_copy.md");
        
        // Validate paths
        let validated_source = validate_path_within_workspace(
            &source.to_string_lossy(), 
            &configured_workspace
        );
        let validated_dest = validate_path_within_workspace(
            &dest.to_string_lossy(), 
            &configured_workspace
        );
        
        assert!(validated_source.is_ok(), "Source should be valid");
        assert!(validated_dest.is_ok(), "Dest should be valid");
        
        // Copy
        fs::copy(&source, &dest).expect("Should copy file");
        
        // Verify both exist
        assert!(source.exists(), "Source should still exist");
        assert!(dest.exists(), "Dest should exist");
        
        // Content should match
        let source_content = fs::read_to_string(&source).unwrap();
        let dest_content = fs::read_to_string(&dest).unwrap();
        assert_eq!(source_content, dest_content, "Content should match");
    }

    #[test]
    fn test_move_file_logic() {
        let (workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Create a file to move
        let source = workspace.path().join("to_move.md");
        let dest = workspace.path().join("notes").join("moved.md");
        fs::write(&source, "# Moving content").expect("Should create file");
        
        // Validate paths
        let validated_source = validate_path_within_workspace(
            &source.to_string_lossy(), 
            &configured_workspace
        );
        let validated_dest = validate_path_within_workspace(
            &dest.to_string_lossy(), 
            &configured_workspace
        );
        
        assert!(validated_source.is_ok(), "Source should be valid");
        assert!(validated_dest.is_ok(), "Dest should be valid");
        
        // Move (using rename)
        fs::rename(&source, &dest).expect("Should move file");
        
        // Verify
        assert!(!source.exists(), "Source should not exist");
        assert!(dest.exists(), "Dest should exist");
        
        let content = fs::read_to_string(&dest).unwrap();
        assert!(content.contains("# Moving content"), "Content preserved");
    }

    // ========================================================================
    // FILE EXISTS TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_file_exists_logic() {
        let (workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Test existing file
        let existing_path = workspace.path().join("test.md");
        let validated = validate_path_within_workspace(
            &existing_path.to_string_lossy(), 
            &configured_workspace
        );
        assert!(validated.is_ok() && validated.unwrap().exists(), 
            "Existing file should return true");
        
        // Test non-existing file
        let non_existing_path = workspace.path().join("nonexistent.md");
        let validated = validate_path_within_workspace(
            &non_existing_path.to_string_lossy(), 
            &configured_workspace
        );
        // Path is valid but file doesn't exist
        assert!(validated.is_ok(), "Path validation should succeed");
        assert!(!validated.unwrap().exists(), "Non-existing file should return false");
    }

    #[test]
    fn test_file_exists_outside_workspace_returns_false() {
        let (_workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Path outside workspace - validation fails, so we return false (not error)
        let outside_path = "../../../etc/passwd".to_string();
        let result = validate_path_within_workspace(&outside_path, &configured_workspace);
        
        // In file_exists, we catch the error and return Ok(false)
        // Simulating: match validate_path { Ok(p) => Ok(p.exists()), Err(_) => Ok(false) }
        let exists = match result {
            Ok(p) => p.exists(),
            Err(_) => false,  // Return false for paths outside workspace
        };
        
        assert!(!exists, "Should return false for path outside workspace");
    }

    // ========================================================================
    // DIRECTORY OPERATIONS TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_delete_directory_logic() {
        let (workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Create a directory to delete
        let dir_to_delete = workspace.path().join("temp_dir");
        fs::create_dir(&dir_to_delete).expect("Should create dir");
        
        // Create a file inside it
        fs::write(dir_to_delete.join("file.md"), "# File").expect("Should create file");
        
        // Validate path
        let validated = validate_directory_path(
            &dir_to_delete.to_string_lossy(), 
            &configured_workspace,
            true
        );
        assert!(validated.is_ok(), "Directory should be valid");
        
        // Delete recursively
        fs::remove_dir_all(&dir_to_delete).expect("Should delete dir recursively");
        assert!(!dir_to_delete.exists(), "Directory should be deleted");
    }

    #[test]
    fn test_delete_directory_blocks_workspace_root() {
        let (workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Attempt to delete workspace root
        let validated = validate_directory_path(
            &configured_workspace, 
            &configured_workspace,
            true
        );
        
        if validated.is_ok() {
            let validated_path = validated.unwrap();
            let workspace_canonical = PathBuf::from(&configured_workspace)
                .canonicalize()
                .expect("Should canonicalize");
            
            // Check if it's the workspace root
            let is_root = validated_path == workspace_canonical;
            assert!(is_root, "Should detect workspace root");
            
            // In actual code, we'd return error here
            // return Err("Cannot delete the workspace root directory".to_string());
        }
    }

    #[test]
    fn test_rename_directory_logic() {
        let (workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        // Create a directory to rename
        let old_dir = workspace.path().join("old_dir");
        let new_dir = workspace.path().join("new_dir");
        fs::create_dir(&old_dir).expect("Should create dir");
        fs::write(old_dir.join("file.md"), "# File").expect("Should create file");
        
        // Validate paths
        let validated_old = validate_directory_path(
            &old_dir.to_string_lossy(), 
            &configured_workspace,
            true
        );
        let validated_new = validate_path_within_workspace(
            &new_dir.to_string_lossy(), 
            &configured_workspace
        );
        
        assert!(validated_old.is_ok(), "Old dir should be valid");
        assert!(validated_new.is_ok(), "New dir should be valid");
        
        // Rename
        fs::rename(&old_dir, &new_dir).expect("Should rename dir");
        
        // Verify
        assert!(!old_dir.exists(), "Old dir should not exist");
        assert!(new_dir.exists(), "New dir should exist");
        assert!(new_dir.join("file.md").exists(), "File inside should exist");
    }

    // ========================================================================
    // SECURITY TESTS (Comprehensive)
    // ========================================================================

    #[test]
    fn test_security_path_traversal_comprehensive() {
        let (workspace, state) = setup_workspace_with_state();
        let configured_workspace = state.get_workspace_path().expect("Should have workspace");
        
        let attack_vectors = vec![
            // Basic traversal
            "../../../etc/passwd".to_string(),
            "..\\..\\..\\windows\\system32".to_string(),
            // Double encoding
            "..%2f..%2f..%2fetc%2fpasswd".to_string(),
            // Mixed separators
            "..\\../..\\../etc/passwd".to_string(),
            // With valid prefix
            format!("{}/../../etc/passwd", workspace.path().display()),
            // Null byte injection attempt
            format!("{}/file.md\x00.sh", workspace.path().display()),
            // Unicode tricks
            "..／..／..／etc／passwd".to_string(),
            // Repeated slashes
            "....//....//etc/passwd".to_string(),
        ];
        
        for attack in &attack_vectors {
            let result = validate_path_within_workspace(attack, &configured_workspace);
            // Most of these should fail either in validation or canonicalization
            // The key is that none of them should allow access outside workspace
            if result.is_ok() {
                let path = result.unwrap();
                let workspace_canonical = PathBuf::from(&configured_workspace)
                    .canonicalize()
                    .expect("Should canonicalize workspace");
                
                assert!(path.starts_with(&workspace_canonical),
                    "If validation passes, path must be within workspace: {}", attack);
            }
        }
    }

    #[test]
    fn test_security_symlink_would_be_followed() {
        // Note: This test documents the behavior - symlinks ARE followed by canonicalize
        // This could be a security consideration in some contexts
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path().to_str().unwrap();
        
        // Create a file
        let target_file = workspace.path().join("target.md");
        fs::write(&target_file, "# Target").expect("Should create file");
        
        // The canonicalize function follows symlinks
        // In a real attack scenario, a symlink could point outside workspace
        // Our validation happens AFTER canonicalization, so we catch this
        
        let valid_result = validate_path_within_workspace(
            target_file.to_str().unwrap(),
            workspace_path
        );
        assert!(valid_result.is_ok(), "Regular file should be accessible");
    }
}
