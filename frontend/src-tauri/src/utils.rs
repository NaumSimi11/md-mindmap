//! Utility functions for MDReader Tauri application
//! 
//! This module provides security-critical utilities including:
//! - Path validation to prevent directory traversal attacks
//! - Input sanitization helpers
//! - Common error types

use std::path::{Path, PathBuf};

/// Custom error types for utility functions
#[derive(Debug, Clone, PartialEq)]
pub enum ValidationError {
    /// Path is outside the allowed workspace
    PathOutsideWorkspace { requested: String, workspace: String },
    /// Path cannot be resolved (doesn't exist or permission denied)
    PathResolutionFailed { path: String, reason: String },
    /// Workspace root is invalid
    InvalidWorkspaceRoot { path: String, reason: String },
    /// Path contains invalid characters or patterns
    InvalidPathPattern { path: String, reason: String },
}

impl std::fmt::Display for ValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ValidationError::PathOutsideWorkspace { requested, workspace } => {
                write!(f, "Access denied: path '{}' is outside workspace '{}'", requested, workspace)
            }
            ValidationError::PathResolutionFailed { path, reason } => {
                write!(f, "Invalid path '{}': {}", path, reason)
            }
            ValidationError::InvalidWorkspaceRoot { path, reason } => {
                write!(f, "Invalid workspace root '{}': {}", path, reason)
            }
            ValidationError::InvalidPathPattern { path, reason } => {
                write!(f, "Invalid path pattern '{}': {}", path, reason)
            }
        }
    }
}

impl std::error::Error for ValidationError {}

/// Result type for validation operations
pub type ValidationResult<T> = Result<T, ValidationError>;

/// Validates that a requested path is within the workspace root.
/// 
/// This function prevents directory traversal attacks by:
/// 1. Checking for suspicious patterns (../, etc.)
/// 2. Canonicalizing both paths to resolve symlinks
/// 3. Verifying the requested path starts with the workspace root
/// 
/// # Arguments
/// * `requested_path` - The path requested by the frontend
/// * `workspace_root` - The root directory of the workspace
/// 
/// # Returns
/// * `Ok(PathBuf)` - The canonicalized safe path
/// * `Err(ValidationError)` - If the path is invalid or outside workspace
/// 
/// # Example
/// ```rust,ignore
/// // In your Tauri command:
/// use app_lib::validate_path_within_workspace;
/// 
/// let workspace = "/Users/me/Documents/MDReader";
/// let safe_path = validate_path_within_workspace(
///     "/Users/me/Documents/MDReader/notes/todo.md",
///     workspace
/// );
/// assert!(safe_path.is_ok());
/// 
/// // This would fail - path traversal attempt
/// let attack_path = validate_path_within_workspace(
///     "/Users/me/Documents/MDReader/../../../etc/passwd",
///     workspace
/// );
/// assert!(attack_path.is_err());
/// ```
pub fn validate_path_within_workspace(
    requested_path: &str,
    workspace_root: &str,
) -> ValidationResult<PathBuf> {
    // Quick check for obvious traversal patterns
    if contains_traversal_pattern(requested_path) {
        return Err(ValidationError::InvalidPathPattern {
            path: requested_path.to_string(),
            reason: "Path contains directory traversal patterns".to_string(),
        });
    }
    
    let requested = Path::new(requested_path);
    let workspace = Path::new(workspace_root);
    
    // Validate workspace root exists and is a directory
    if !workspace.exists() {
        return Err(ValidationError::InvalidWorkspaceRoot {
            path: workspace_root.to_string(),
            reason: "Workspace directory does not exist".to_string(),
        });
    }
    
    if !workspace.is_dir() {
        return Err(ValidationError::InvalidWorkspaceRoot {
            path: workspace_root.to_string(),
            reason: "Workspace path is not a directory".to_string(),
        });
    }
    
    // Canonicalize workspace root
    let workspace_canonical = workspace.canonicalize().map_err(|e| {
        ValidationError::InvalidWorkspaceRoot {
            path: workspace_root.to_string(),
            reason: format!("Cannot canonicalize workspace: {}", e),
        }
    })?;
    
    // For the requested path, we need to handle both existing and non-existing paths
    let requested_canonical = if requested.exists() {
        // Path exists - canonicalize it
        requested.canonicalize().map_err(|e| {
            ValidationError::PathResolutionFailed {
                path: requested_path.to_string(),
                reason: format!("Cannot resolve path: {}", e),
            }
        })?
    } else {
        // Path doesn't exist - canonicalize parent and append filename
        let parent = requested.parent().ok_or_else(|| {
            ValidationError::PathResolutionFailed {
                path: requested_path.to_string(),
                reason: "Path has no parent directory".to_string(),
            }
        })?;
        
        let filename = requested.file_name().ok_or_else(|| {
            ValidationError::PathResolutionFailed {
                path: requested_path.to_string(),
                reason: "Path has no filename".to_string(),
            }
        })?;
        
        // Parent must exist for us to create a file
        if !parent.exists() {
            return Err(ValidationError::PathResolutionFailed {
                path: requested_path.to_string(),
                reason: "Parent directory does not exist".to_string(),
            });
        }
        
        let parent_canonical = parent.canonicalize().map_err(|e| {
            ValidationError::PathResolutionFailed {
                path: requested_path.to_string(),
                reason: format!("Cannot resolve parent directory: {}", e),
            }
        })?;
        
        parent_canonical.join(filename)
    };
    
    // Check if the requested path is within the workspace
    if !requested_canonical.starts_with(&workspace_canonical) {
        return Err(ValidationError::PathOutsideWorkspace {
            requested: requested_path.to_string(),
            workspace: workspace_root.to_string(),
        });
    }
    
    Ok(requested_canonical)
}

/// Validates a file path and ensures it has the correct extension.
/// 
/// # Arguments
/// * `requested_path` - The path requested by the frontend
/// * `workspace_root` - The root directory of the workspace
/// * `allowed_extensions` - List of allowed file extensions (e.g., ["md", "txt"])
/// 
/// # Returns
/// * `Ok(PathBuf)` - The validated path with correct extension
/// * `Err(ValidationError)` - If validation fails
pub fn validate_file_path(
    requested_path: &str,
    workspace_root: &str,
    allowed_extensions: &[&str],
) -> ValidationResult<PathBuf> {
    let path = validate_path_within_workspace(requested_path, workspace_root)?;
    
    // Check file extension
    if let Some(ext) = path.extension() {
        let ext_str = ext.to_string_lossy().to_lowercase();
        if !allowed_extensions.iter().any(|&allowed| allowed.to_lowercase() == ext_str) {
            return Err(ValidationError::InvalidPathPattern {
                path: requested_path.to_string(),
                reason: format!(
                    "File extension '{}' not allowed. Allowed: {:?}",
                    ext_str, allowed_extensions
                ),
            });
        }
    } else if !allowed_extensions.is_empty() {
        return Err(ValidationError::InvalidPathPattern {
            path: requested_path.to_string(),
            reason: format!("File must have one of these extensions: {:?}", allowed_extensions),
        });
    }
    
    Ok(path)
}

/// Validates a directory path within the workspace.
/// 
/// # Arguments
/// * `requested_path` - The directory path requested
/// * `workspace_root` - The root directory of the workspace
/// * `must_exist` - Whether the directory must already exist
/// 
/// # Returns
/// * `Ok(PathBuf)` - The validated directory path
/// * `Err(ValidationError)` - If validation fails
pub fn validate_directory_path(
    requested_path: &str,
    workspace_root: &str,
    must_exist: bool,
) -> ValidationResult<PathBuf> {
    let path = validate_path_within_workspace(requested_path, workspace_root)?;
    
    if must_exist && !path.is_dir() {
        return Err(ValidationError::PathResolutionFailed {
            path: requested_path.to_string(),
            reason: "Path is not a directory or does not exist".to_string(),
        });
    }
    
    Ok(path)
}

/// Checks if a path string contains directory traversal patterns.
/// 
/// This is a quick pre-check before canonicalization.
/// We only flag `..` when it appears as a path component, not within filenames.
fn contains_traversal_pattern(path: &str) -> bool {
    let path_lower = path.to_lowercase();
    
    // Check for URL-encoded traversal patterns first
    let url_patterns = [
        "..%2f",        // URL encoded ../
        "..%5c",        // URL encoded ..\
        "%2e%2e",       // URL encoded ..
    ];
    
    if url_patterns.iter().any(|p| path_lower.contains(p)) {
        return true;
    }
    
    // Split path by separators and check each component
    let components: Vec<&str> = path.split(|c| c == '/' || c == '\\').collect();
    
    for component in components {
        // Check if the component is exactly ".." (parent directory)
        if component == ".." {
            return true;
        }
    }
    
    false
}

/// Sanitizes a filename by removing or replacing invalid characters.
/// 
/// # Arguments
/// * `filename` - The original filename
/// 
/// # Returns
/// A sanitized filename safe for use on all platforms
pub fn sanitize_filename(filename: &str) -> String {
    // Characters not allowed in filenames on various platforms
    let invalid_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*', '\0'];
    
    let mut sanitized: String = filename
        .chars()
        .map(|c| {
            if invalid_chars.contains(&c) || c.is_control() {
                '_'
            } else {
                c
            }
        })
        .collect();
    
    // Remove leading/trailing whitespace and dots
    sanitized = sanitized.trim().trim_matches('.').to_string();
    
    // Ensure filename is not empty
    if sanitized.is_empty() {
        sanitized = "unnamed".to_string();
    }
    
    // Limit filename length (255 is max on most filesystems)
    if sanitized.len() > 200 {
        sanitized.truncate(200);
    }
    
    sanitized
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::{self, File};
    use tempfile::TempDir;

    /// Helper to create a test workspace with files
    fn setup_test_workspace() -> TempDir {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        
        // Create subdirectories
        fs::create_dir_all(temp_dir.path().join("notes")).expect("Failed to create notes dir");
        fs::create_dir_all(temp_dir.path().join("projects")).expect("Failed to create projects dir");
        
        // Create test files
        File::create(temp_dir.path().join("test.md")).expect("Failed to create test.md");
        File::create(temp_dir.path().join("notes/todo.md")).expect("Failed to create todo.md");
        
        temp_dir
    }

    // -------------------------------------------------------------------------
    // validate_path_within_workspace tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_valid_path_in_workspace_root() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path().to_str().unwrap();
        let file_path = workspace.path().join("test.md");
        
        let result = validate_path_within_workspace(
            file_path.to_str().unwrap(),
            workspace_path,
        );
        
        assert!(result.is_ok());
        assert!(result.unwrap().ends_with("test.md"));
    }

    #[test]
    fn test_valid_path_in_subdirectory() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path().to_str().unwrap();
        let file_path = workspace.path().join("notes/todo.md");
        
        let result = validate_path_within_workspace(
            file_path.to_str().unwrap(),
            workspace_path,
        );
        
        assert!(result.is_ok());
    }

    #[test]
    fn test_path_traversal_attack_blocked() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path().to_str().unwrap();
        
        // Attempt to escape workspace using ../
        let attack_path = format!("{}/../../../etc/passwd", workspace_path);
        
        let result = validate_path_within_workspace(&attack_path, workspace_path);
        
        assert!(result.is_err());
        match result {
            Err(ValidationError::InvalidPathPattern { .. }) => (),
            other => panic!("Expected InvalidPathPattern, got {:?}", other),
        }
    }

    #[test]
    fn test_path_outside_workspace_blocked() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path().to_str().unwrap();
        
        // Try to access a path completely outside workspace
        let outside_path = "/etc/passwd";
        
        let result = validate_path_within_workspace(outside_path, workspace_path);
        
        assert!(result.is_err());
    }

    #[test]
    fn test_nonexistent_file_in_valid_directory() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path().to_str().unwrap();
        let new_file = workspace.path().join("notes/new_file.md");
        
        let result = validate_path_within_workspace(
            new_file.to_str().unwrap(),
            workspace_path,
        );
        
        // Should succeed - parent exists and path is within workspace
        assert!(result.is_ok());
    }

    #[test]
    fn test_nonexistent_parent_directory_fails() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path().to_str().unwrap();
        let bad_path = workspace.path().join("nonexistent/dir/file.md");
        
        let result = validate_path_within_workspace(
            bad_path.to_str().unwrap(),
            workspace_path,
        );
        
        assert!(result.is_err());
        match result {
            Err(ValidationError::PathResolutionFailed { .. }) => (),
            other => panic!("Expected PathResolutionFailed, got {:?}", other),
        }
    }

    #[test]
    fn test_invalid_workspace_root() {
        let workspace = setup_test_workspace();
        let file_path = workspace.path().join("test.md");
        
        let result = validate_path_within_workspace(
            file_path.to_str().unwrap(),
            "/nonexistent/workspace",
        );
        
        assert!(result.is_err());
        match result {
            Err(ValidationError::InvalidWorkspaceRoot { .. }) => (),
            other => panic!("Expected InvalidWorkspaceRoot, got {:?}", other),
        }
    }

    #[test]
    fn test_url_encoded_traversal_blocked() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path().to_str().unwrap();
        
        let attack_paths = vec![
            format!("{}%2f..%2f..%2fetc%2fpasswd", workspace_path),
            format!("{}..%2f..%2fetc%2fpasswd", workspace_path),
        ];
        
        for attack_path in attack_paths {
            let result = validate_path_within_workspace(&attack_path, workspace_path);
            assert!(result.is_err(), "Should block: {}", attack_path);
        }
    }

    // -------------------------------------------------------------------------
    // validate_file_path tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_valid_markdown_file() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path().to_str().unwrap();
        let file_path = workspace.path().join("test.md");
        
        let result = validate_file_path(
            file_path.to_str().unwrap(),
            workspace_path,
            &["md"],
        );
        
        assert!(result.is_ok());
    }

    #[test]
    fn test_invalid_extension_blocked() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path().to_str().unwrap();
        
        // Create a .exe file
        let exe_path = workspace.path().join("malicious.exe");
        File::create(&exe_path).expect("Failed to create exe file");
        
        let result = validate_file_path(
            exe_path.to_str().unwrap(),
            workspace_path,
            &["md", "txt"],
        );
        
        assert!(result.is_err());
        match result {
            Err(ValidationError::InvalidPathPattern { reason, .. }) => {
                assert!(reason.contains("extension"));
            }
            other => panic!("Expected InvalidPathPattern, got {:?}", other),
        }
    }

    #[test]
    fn test_multiple_allowed_extensions() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path().to_str().unwrap();
        
        // Create test files
        let md_path = workspace.path().join("doc.md");
        let txt_path = workspace.path().join("notes.txt");
        File::create(&md_path).unwrap();
        File::create(&txt_path).unwrap();
        
        let allowed = &["md", "txt", "markdown"];
        
        assert!(validate_file_path(md_path.to_str().unwrap(), workspace_path, allowed).is_ok());
        assert!(validate_file_path(txt_path.to_str().unwrap(), workspace_path, allowed).is_ok());
    }

    // -------------------------------------------------------------------------
    // validate_directory_path tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_valid_existing_directory() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path().to_str().unwrap();
        let dir_path = workspace.path().join("notes");
        
        let result = validate_directory_path(
            dir_path.to_str().unwrap(),
            workspace_path,
            true, // must_exist
        );
        
        assert!(result.is_ok());
    }

    #[test]
    fn test_nonexistent_directory_must_exist_fails() {
        let workspace = setup_test_workspace();
        let workspace_path = workspace.path().to_str().unwrap();
        let dir_path = workspace.path().join("nonexistent_dir");
        
        let result = validate_directory_path(
            dir_path.to_str().unwrap(),
            workspace_path,
            true, // must_exist
        );
        
        assert!(result.is_err());
    }

    // -------------------------------------------------------------------------
    // contains_traversal_pattern tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_traversal_pattern_detection() {
        assert!(contains_traversal_pattern("../etc/passwd"));
        assert!(contains_traversal_pattern("..\\windows\\system32"));
        assert!(contains_traversal_pattern("/path/to/../../../etc"));
        assert!(contains_traversal_pattern("..%2fetc"));
        assert!(contains_traversal_pattern("%2e%2e/etc"));
        
        // These should NOT match
        assert!(!contains_traversal_pattern("/normal/path/file.md"));
        assert!(!contains_traversal_pattern("file.md"));
        assert!(!contains_traversal_pattern("my..file.md")); // dots in filename ok
    }

    // -------------------------------------------------------------------------
    // sanitize_filename tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_sanitize_normal_filename() {
        assert_eq!(sanitize_filename("document.md"), "document.md");
        assert_eq!(sanitize_filename("My Notes.md"), "My Notes.md");
    }

    #[test]
    fn test_sanitize_invalid_characters() {
        assert_eq!(sanitize_filename("file<>:\"/\\|?*.md"), "file_________.md");
        assert_eq!(sanitize_filename("path/to/file.md"), "path_to_file.md");
    }

    #[test]
    fn test_sanitize_leading_trailing() {
        assert_eq!(sanitize_filename("  .hidden.md  "), "hidden.md");
        assert_eq!(sanitize_filename("...file.md"), "file.md");
    }

    #[test]
    fn test_sanitize_empty_filename() {
        assert_eq!(sanitize_filename(""), "unnamed");
        assert_eq!(sanitize_filename("   "), "unnamed");
        assert_eq!(sanitize_filename("..."), "unnamed");
    }

    #[test]
    fn test_sanitize_long_filename() {
        let long_name = "a".repeat(300);
        let sanitized = sanitize_filename(&long_name);
        assert!(sanitized.len() <= 200);
    }

    // -------------------------------------------------------------------------
    // Error display tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_error_display() {
        let err = ValidationError::PathOutsideWorkspace {
            requested: "/etc/passwd".to_string(),
            workspace: "/home/user/docs".to_string(),
        };
        
        let display = format!("{}", err);
        assert!(display.contains("outside workspace"));
        assert!(display.contains("/etc/passwd"));
    }
}
