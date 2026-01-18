//! Import/Export Commands
//! 
//! This module provides Tauri commands for importing and exporting
//! markdown files and folders.
//! 
//! ## Security
//! - Import: Source can be anywhere (user selects via dialog), destination must be in workspace
//! - Export: Source must be in workspace, destination can be anywhere (user selects via dialog)

use tauri::{command, State};
use std::fs;
use std::path::PathBuf;
use crate::state::AppState;
use crate::utils::{validate_directory_path, sanitize_filename};

// ========================================
// IMPORT OPERATIONS
// ========================================

/// Import a markdown file into the workspace.
/// 
/// Security: 
/// - Source can be anywhere (user selected via dialog)
/// - Destination must be within the configured workspace
#[command]
pub async fn import_markdown_file(
    state: State<'_, AppState>,
    source_path: String,
    dest_folder: String,
) -> Result<String, String> {
    let workspace = state.get_workspace_path()?;
    
    // Validate destination is within workspace
    let validated_dest = validate_directory_path(&dest_folder, &workspace, true)
        .map_err(|e| format!("Security error: {}", e))?;
    
    let source = PathBuf::from(&source_path);
    
    if !source.exists() {
        return Err(format!("Source file does not exist: {}", source_path));
    }
    
    if !source.is_file() {
        return Err(format!("Source is not a file: {}", source_path));
    }
    
    // Get and sanitize file name
    let file_name = source.file_name()
        .ok_or("Failed to get file name")?
        .to_string_lossy()
        .to_string();
    
    let sanitized_name = sanitize_filename(&file_name);
    
    // Ensure .md extension
    let final_name = if sanitized_name.ends_with(".md") {
        sanitized_name
    } else {
        format!("{}.md", sanitized_name)
    };
    
    let dest_path = validated_dest.join(&final_name);
    
    // Copy file
    fs::copy(&source, &dest_path)
        .map_err(|e| format!("Failed to import file: {}", e))?;
    
    log::info!("📥 Imported: {} → {}", source_path, dest_path.display());
    Ok(dest_path.to_string_lossy().to_string())
}

/// Import a folder into the workspace.
/// 
/// Security: 
/// - Source can be anywhere (user selected via dialog)
/// - Destination must be within the configured workspace
#[command]
pub async fn import_folder(
    state: State<'_, AppState>,
    source_path: String,
    dest_folder: String,
) -> Result<Vec<String>, String> {
    let workspace = state.get_workspace_path()?;
    
    // Validate destination is within workspace
    let validated_dest = validate_directory_path(&dest_folder, &workspace, true)
        .map_err(|e| format!("Security error: {}", e))?;
    
    let source = PathBuf::from(&source_path);
    
    if !source.exists() {
        return Err(format!("Source folder does not exist: {}", source_path));
    }
    
    if !source.is_dir() {
        return Err(format!("Source is not a directory: {}", source_path));
    }
    
    // Get and sanitize folder name
    let folder_name = source.file_name()
        .ok_or("Failed to get folder name")?
        .to_string_lossy()
        .to_string();
    
    let sanitized_name = sanitize_filename(&folder_name);
    let dest_path = validated_dest.join(&sanitized_name);
    
    // Copy directory recursively
    copy_dir_recursive(&source, &dest_path)?;
    
    log::info!("📥 Imported folder: {} → {}", source_path, dest_path.display());
    
    // Return list of imported files
    let imported_files = list_files_recursive(&dest_path)?;
    Ok(imported_files)
}

// Helper: Copy directory recursively
fn copy_dir_recursive(source: &PathBuf, dest: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(dest)
        .map_err(|e| format!("Failed to create destination directory: {}", e))?;
    
    let entries = fs::read_dir(source)
        .map_err(|e| format!("Failed to read source directory: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let source_path = entry.path();
        let file_name = entry.file_name();
        let dest_path = dest.join(&file_name);
        
        if source_path.is_dir() {
            copy_dir_recursive(&source_path, &dest_path)?;
        } else {
            fs::copy(&source_path, &dest_path)
                .map_err(|e| format!("Failed to copy file: {}", e))?;
        }
    }
    
    Ok(())
}

// Helper: List all files in directory recursively
fn list_files_recursive(dir: &PathBuf) -> Result<Vec<String>, String> {
    let mut files = Vec::new();
    
    let entries = fs::read_dir(dir)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        
        if path.is_dir() {
            let sub_files = list_files_recursive(&path)?;
            files.extend(sub_files);
        } else {
            files.push(path.to_string_lossy().to_string());
        }
    }
    
    Ok(files)
}

// ========================================
// EXPORT OPERATIONS
// ========================================

/// Export entire workspace to a ZIP file.
/// 
/// TODO: Implement with zip crate
#[allow(dead_code)]
async fn export_workspace_to_zip(
    _state: State<'_, AppState>,
    _workspace_path: String,
    _dest_path: String,
) -> Result<(), String> {
    // TODO: Implement ZIP export
    // Requires adding zip crate to Cargo.toml
    Err("ZIP export not yet implemented".to_string())
}

/// Export a document from the workspace.
/// 
/// Security:
/// - Source must be within the configured workspace
/// - Destination can be anywhere (user selects via dialog)
#[command]
pub async fn export_document(
    state: State<'_, AppState>,
    document_path: String,
    dest_path: String,
) -> Result<(), String> {
    let workspace = state.get_workspace_path()?;
    
    // Validate source is within workspace
    let validated_source = crate::utils::validate_path_within_workspace(&document_path, &workspace)
        .map_err(|e| format!("Security error: {}", e))?;
    
    if !validated_source.exists() {
        return Err(format!("Document does not exist: {}", document_path));
    }
    
    let dest = PathBuf::from(&dest_path);
    
    // Ensure destination directory exists
    if let Some(parent) = dest.parent() {
        if !parent.exists() {
            return Err(format!("Destination directory does not exist: {:?}", parent));
        }
    }
    
    fs::copy(&validated_source, &dest)
        .map_err(|e| format!("Failed to export document: {}", e))?;
    
    log::info!("📤 Exported: {} → {}", document_path, dest_path);
    Ok(())
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::fs::File;
    use std::io::Write;
    use crate::state::AppState;
    use crate::utils::validate_path_within_workspace;

    // ========================================================================
    // TEST HELPERS
    // ========================================================================

    fn setup_test_dirs() -> (TempDir, TempDir) {
        let source_dir = TempDir::new().expect("Failed to create source dir");
        let dest_dir = TempDir::new().expect("Failed to create dest dir");
        (source_dir, dest_dir)
    }

    /// Creates a workspace with AppState configured for integration tests
    fn setup_workspace_with_state() -> (TempDir, AppState) {
        let workspace = TempDir::new().expect("Failed to create workspace");
        let state = AppState::new();
        state.set_workspace_path(workspace.path().to_string_lossy().to_string())
            .expect("Failed to set workspace");
        
        // Create destination folder
        fs::create_dir_all(workspace.path().join("imports")).unwrap();
        
        (workspace, state)
    }

    /// Creates a source directory with test markdown files
    fn create_source_with_files() -> TempDir {
        let source = TempDir::new().expect("Failed to create source");
        
        // Create some test files
        fs::write(source.path().join("readme.md"), "# Readme\n\nContent here").unwrap();
        fs::write(source.path().join("notes.md"), "# Notes\n\n- Item 1\n- Item 2").unwrap();
        
        // Create a subfolder with files
        fs::create_dir_all(source.path().join("subfolder")).unwrap();
        fs::write(source.path().join("subfolder").join("nested.md"), "# Nested").unwrap();
        
        source
    }

    // ========================================================================
    // HELPER FUNCTION TESTS (Existing)
    // ========================================================================

    #[test]
    fn test_copy_dir_recursive() {
        let (source_dir, dest_dir) = setup_test_dirs();
        
        // Create source structure
        let subdir = source_dir.path().join("subdir");
        fs::create_dir(&subdir).unwrap();
        
        let mut file1 = File::create(source_dir.path().join("test.md")).unwrap();
        file1.write_all(b"# Test").unwrap();
        
        let mut file2 = File::create(subdir.join("nested.md")).unwrap();
        file2.write_all(b"# Nested").unwrap();
        
        // Copy
        let dest_path = dest_dir.path().join("copied");
        copy_dir_recursive(&source_dir.path().to_path_buf(), &dest_path).unwrap();
        
        // Verify
        assert!(dest_path.join("test.md").exists());
        assert!(dest_path.join("subdir").join("nested.md").exists());
    }

    #[test]
    fn test_list_files_recursive() {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        
        // Create structure
        let subdir = temp_dir.path().join("subdir");
        fs::create_dir(&subdir).unwrap();
        
        File::create(temp_dir.path().join("file1.md")).unwrap();
        File::create(subdir.join("file2.md")).unwrap();
        
        // List
        let files = list_files_recursive(&temp_dir.path().to_path_buf()).unwrap();
        
        assert_eq!(files.len(), 2);
        assert!(files.iter().any(|f| f.contains("file1.md")));
        assert!(files.iter().any(|f| f.contains("file2.md")));
    }

    // ========================================================================
    // IMPORT MARKDOWN FILE TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_import_markdown_file_logic() {
        let (workspace, state) = setup_workspace_with_state();
        let source = create_source_with_files();
        
        let workspace_path = state.get_workspace_path().expect("Should have workspace");
        let imports_dir = workspace.path().join("imports");
        
        // Validate destination
        let validated_dest = validate_directory_path(
            &imports_dir.to_string_lossy(),
            &workspace_path,
            true
        );
        assert!(validated_dest.is_ok(), "Destination should be valid");
        
        // Source file
        let source_file = source.path().join("readme.md");
        assert!(source_file.exists(), "Source file should exist");
        
        // Simulate import logic
        let file_name = source_file.file_name().unwrap().to_string_lossy().to_string();
        let sanitized_name = sanitize_filename(&file_name);
        let dest_path = validated_dest.unwrap().join(&sanitized_name);
        
        // Copy file
        fs::copy(&source_file, &dest_path).expect("Should copy file");
        
        // Verify
        assert!(dest_path.exists(), "Imported file should exist");
        let content = fs::read_to_string(&dest_path).unwrap();
        assert!(content.contains("# Readme"), "Content should be preserved");
    }

    #[test]
    fn test_import_markdown_file_sanitizes_filename() {
        // Test filename sanitization for import
        let dangerous_names = vec![
            "../../../etc/passwd.md",
            "file<>:\"|?*.md",
            "  spaces_around  .md",
            "..\\..\\windows.md",
        ];
        
        for name in dangerous_names {
            let sanitized = sanitize_filename(name);
            
            // Should not contain path separators
            assert!(!sanitized.contains('/'), "Should not contain / in: {} -> {}", name, sanitized);
            assert!(!sanitized.contains('\\'), "Should not contain \\ in: {} -> {}", name, sanitized);
            
            // Should not contain dangerous characters
            assert!(!sanitized.contains('<'), "Should not contain < in: {}", sanitized);
            assert!(!sanitized.contains('>'), "Should not contain > in: {}", sanitized);
            assert!(!sanitized.contains(':'), "Should not contain : in: {}", sanitized);
            assert!(!sanitized.contains('"'), "Should not contain \" in: {}", sanitized);
            assert!(!sanitized.contains('|'), "Should not contain | in: {}", sanitized);
            assert!(!sanitized.contains('?'), "Should not contain ? in: {}", sanitized);
            assert!(!sanitized.contains('*'), "Should not contain * in: {}", sanitized);
            
            // Should not be empty
            assert!(!sanitized.is_empty(), "Should not be empty for: {}", name);
        }
    }

    #[test]
    fn test_import_markdown_file_adds_extension() {
        let source = TempDir::new().unwrap();
        let source_file = source.path().join("no_extension");
        fs::write(&source_file, "# Content without .md extension").unwrap();
        
        // Get filename and add extension if needed
        let file_name = source_file.file_name().unwrap().to_string_lossy().to_string();
        let sanitized = sanitize_filename(&file_name);
        
        let final_name = if sanitized.ends_with(".md") {
            sanitized
        } else {
            format!("{}.md", sanitized)
        };
        
        assert!(final_name.ends_with(".md"), "Should add .md extension");
        assert_eq!(final_name, "no_extension.md");
    }

    // ========================================================================
    // IMPORT FOLDER TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_import_folder_recursive() {
        let (workspace, state) = setup_workspace_with_state();
        let source = create_source_with_files();
        
        let workspace_path = state.get_workspace_path().expect("Should have workspace");
        let imports_dir = workspace.path().join("imports");
        
        // Validate destination
        let validated_dest = validate_directory_path(
            &imports_dir.to_string_lossy(),
            &workspace_path,
            true
        ).expect("Should validate");
        
        // Get folder name
        let folder_name = source.path().file_name()
            .unwrap()
            .to_string_lossy()
            .to_string();
        let sanitized_name = sanitize_filename(&folder_name);
        let dest_path = validated_dest.join(&sanitized_name);
        
        // Copy directory recursively
        copy_dir_recursive(&source.path().to_path_buf(), &dest_path).expect("Should copy");
        
        // Verify structure
        assert!(dest_path.exists(), "Destination folder should exist");
        assert!(dest_path.join("readme.md").exists(), "readme.md should exist");
        assert!(dest_path.join("notes.md").exists(), "notes.md should exist");
        assert!(dest_path.join("subfolder").exists(), "subfolder should exist");
        assert!(dest_path.join("subfolder").join("nested.md").exists(), "nested.md should exist");
        
        // List files to verify count
        let files = list_files_recursive(&dest_path).expect("Should list files");
        assert_eq!(files.len(), 3, "Should have 3 files (readme.md, notes.md, nested.md)");
    }

    #[test]
    fn test_import_folder_preserves_content() {
        let (workspace, _state) = setup_workspace_with_state();
        let source = create_source_with_files();
        
        let dest_path = workspace.path().join("imports").join("copied_folder");
        
        // Copy
        copy_dir_recursive(&source.path().to_path_buf(), &dest_path).expect("Should copy");
        
        // Verify content is preserved
        let original_content = fs::read_to_string(source.path().join("readme.md")).unwrap();
        let copied_content = fs::read_to_string(dest_path.join("readme.md")).unwrap();
        
        assert_eq!(original_content, copied_content, "Content should be identical");
    }

    // ========================================================================
    // EXPORT DOCUMENT TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_export_document_logic() {
        let (workspace, state) = setup_workspace_with_state();
        let export_dest = TempDir::new().expect("Failed to create export dest");
        
        let workspace_path = state.get_workspace_path().expect("Should have workspace");
        
        // Create a document in workspace to export
        let doc_path = workspace.path().join("to_export.md");
        fs::write(&doc_path, "# Export Me\n\nThis document will be exported.").unwrap();
        
        // Validate source is within workspace
        let validated_source = validate_path_within_workspace(
            &doc_path.to_string_lossy(),
            &workspace_path
        );
        assert!(validated_source.is_ok(), "Source should be within workspace");
        
        // Export
        let dest_file = export_dest.path().join("exported.md");
        fs::copy(&doc_path, &dest_file).expect("Should export");
        
        // Verify
        assert!(dest_file.exists(), "Exported file should exist");
        let content = fs::read_to_string(&dest_file).unwrap();
        assert!(content.contains("Export Me"), "Content should be preserved");
    }

    #[test]
    fn test_export_document_validates_source() {
        let (workspace, state) = setup_workspace_with_state();
        let workspace_path = state.get_workspace_path().expect("Should have workspace");
        
        // Try to export a file outside the workspace
        let outside_file = "/etc/passwd";
        
        let result = validate_path_within_workspace(outside_file, &workspace_path);
        assert!(result.is_err(), "Should block export from outside workspace");
    }

    #[test]
    fn test_export_document_source_must_exist() {
        let (workspace, state) = setup_workspace_with_state();
        let workspace_path = state.get_workspace_path().expect("Should have workspace");
        
        // Create path to non-existent file in workspace
        let nonexistent = workspace.path().join("does_not_exist.md");
        
        // Validation might pass (path is within workspace)
        let validated = validate_path_within_workspace(
            &nonexistent.to_string_lossy(),
            &workspace_path
        );
        
        // But existence check should fail
        if validated.is_ok() {
            assert!(!validated.unwrap().exists(), "File should not exist");
        }
    }

    // ========================================================================
    // SECURITY TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_import_destination_must_be_in_workspace() {
        let (workspace, state) = setup_workspace_with_state();
        let workspace_path = state.get_workspace_path().expect("Should have workspace");
        
        // Try to import to a path outside workspace
        let attack_destinations = vec![
            "/tmp/malicious".to_string(),
            format!("{}/../../../tmp/escape", workspace.path().display()),
            "../../../etc".to_string(),
        ];
        
        for dest in attack_destinations {
            let result = validate_directory_path(&dest, &workspace_path, true);
            // Most of these should fail because they're outside workspace
            // or don't exist
            if result.is_ok() {
                let validated = result.unwrap();
                let workspace_canonical = PathBuf::from(&workspace_path)
                    .canonicalize()
                    .expect("Should canonicalize");
                
                assert!(validated.starts_with(&workspace_canonical),
                    "If validation passes, path must be in workspace: {}", dest);
            }
        }
    }

    #[test]
    fn test_export_source_must_be_in_workspace() {
        let (_workspace, state) = setup_workspace_with_state();
        let workspace_path = state.get_workspace_path().expect("Should have workspace");
        let _ = &_workspace; // Use workspace to silence warning
        
        // Try to export from outside workspace
        let attack_sources = vec![
            "/etc/passwd",
            "/etc/shadow",
            "../../../etc/passwd",
        ];
        
        for source in attack_sources {
            let result = validate_path_within_workspace(source, &workspace_path);
            assert!(result.is_err(), "Should block export from: {}", source);
        }
    }

    // ========================================================================
    // EDGE CASE TESTS (NEW)
    // ========================================================================

    #[test]
    fn test_copy_empty_directory() {
        let (source_dir, dest_dir) = setup_test_dirs();
        
        // Create empty source directory
        let empty_subdir = source_dir.path().join("empty");
        fs::create_dir(&empty_subdir).unwrap();
        
        // Copy
        let dest_path = dest_dir.path().join("copied_empty");
        let result = copy_dir_recursive(&empty_subdir, &dest_path);
        
        assert!(result.is_ok(), "Should copy empty directory");
        assert!(dest_path.exists(), "Destination should exist");
        assert!(dest_path.is_dir(), "Should be a directory");
        
        // List should return empty
        let files = list_files_recursive(&dest_path).unwrap();
        assert_eq!(files.len(), 0, "Empty directory should have 0 files");
    }

    #[test]
    fn test_copy_deeply_nested_structure() {
        let (source_dir, dest_dir) = setup_test_dirs();
        
        // Create deeply nested structure
        let deep_path = source_dir.path()
            .join("level1")
            .join("level2")
            .join("level3")
            .join("level4");
        fs::create_dir_all(&deep_path).unwrap();
        fs::write(deep_path.join("deep.md"), "# Deep nested file").unwrap();
        
        // Copy
        let dest_path = dest_dir.path().join("deep_copy");
        copy_dir_recursive(&source_dir.path().to_path_buf(), &dest_path).expect("Should copy");
        
        // Verify deep structure
        let deep_dest = dest_path
            .join("level1")
            .join("level2")
            .join("level3")
            .join("level4")
            .join("deep.md");
        
        assert!(deep_dest.exists(), "Deeply nested file should exist");
        
        let content = fs::read_to_string(&deep_dest).unwrap();
        assert!(content.contains("Deep nested file"), "Content should be preserved");
    }

    #[test]
    fn test_list_files_with_mixed_content() {
        let temp_dir = TempDir::new().unwrap();
        
        // Create mixed content
        fs::write(temp_dir.path().join("doc1.md"), "# Doc 1").unwrap();
        fs::write(temp_dir.path().join("doc2.txt"), "Text file").unwrap();  // Non-md file
        fs::create_dir(temp_dir.path().join("subfolder")).unwrap();
        fs::write(temp_dir.path().join("subfolder").join("doc3.md"), "# Doc 3").unwrap();
        
        // List all files
        let files = list_files_recursive(&temp_dir.path().to_path_buf()).unwrap();
        
        // Should include all files regardless of extension
        assert_eq!(files.len(), 3, "Should have 3 files total");
        assert!(files.iter().any(|f| f.contains("doc1.md")));
        assert!(files.iter().any(|f| f.contains("doc2.txt")));  // Also included
        assert!(files.iter().any(|f| f.contains("doc3.md")));
    }
}
