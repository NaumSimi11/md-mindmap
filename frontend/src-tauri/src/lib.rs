//! MDReader Tauri Application Library
//! 
//! This is the main entry point for the MDReader desktop application.
//! 
//! ## Architecture
//! 
//! ```text
//! lib.rs (entry point)
//! ├── state.rs      - AppState management (watchers, workspace)
//! ├── utils.rs      - Security utilities (path validation)
//! └── commands/     - Tauri command handlers
//!     ├── file_operations.rs  - File CRUD operations
//!     ├── file_watcher.rs     - File system watching
//!     ├── workspace.rs        - Workspace management
//!     └── import_export.rs    - Import/export operations
//! ```
//! 
//! ## Security
//! 
//! All file operations are validated against the workspace root to prevent
//! directory traversal attacks. See `utils::validate_path_within_workspace`.

// Core modules
mod commands;
mod state;
mod utils;

// Import Tauri traits
use tauri::Manager;

// Re-export for use in commands
pub use state::AppState;
pub use utils::{
    validate_path_within_workspace,
    validate_file_path,
    validate_directory_path,
    sanitize_filename,
    ValidationError,
    ValidationResult,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Register application state
        .manage(AppState::new())
        .setup(|app| {
            // Initialize logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            
            log::info!("🚀 MDReader starting up...");
            log::info!("📦 Version: {}", env!("CARGO_PKG_VERSION"));
            
            log::info!("✅ Application initialized successfully");
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // =====================================================
            // File Operations (with path validation)
            // =====================================================
            commands::file_operations::select_workspace_folder,
            commands::file_operations::list_workspace_files,
            commands::file_operations::save_document_to_file,
            commands::file_operations::load_document_from_file,
            commands::file_operations::create_new_file,
            commands::file_operations::delete_file,
            commands::file_operations::save_workspace_config,
            commands::file_operations::load_workspace_config,
            commands::file_operations::rename_file,
            commands::file_operations::rename_directory,
            commands::file_operations::delete_directory,
            commands::file_operations::copy_file,
            commands::file_operations::move_file,
            commands::file_operations::file_exists,
            
            // =====================================================
            // Workspace Management
            // =====================================================
            commands::workspace::create_directory,
            commands::workspace::get_default_workspace_location,
            commands::workspace::save_workspace_config_v2,
            commands::workspace::load_workspace_config_v2,
            commands::workspace::is_workspace_configured,
            commands::workspace::create_default_folders,
            commands::workspace::create_welcome_document,
            commands::workspace::list_workspace_contents,
            commands::workspace::verify_workspace_path,
            
            // =====================================================
            // Import/Export Operations
            // =====================================================
            commands::import_export::import_markdown_file,
            commands::import_export::import_folder,
            commands::import_export::export_document,
            
            // =====================================================
            // File Watching (with state management)
            // =====================================================
            commands::file_watcher::watch_directory,
            commands::file_watcher::stop_watching,
            commands::file_watcher::get_file_metadata,
            commands::file_watcher::list_active_watchers,
            commands::file_watcher::stop_all_watchers,
        ])
        .on_window_event(|window, event| {
            // Handle window close for cleanup
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                log::info!("🔒 Window close requested, cleaning up...");
                
                // Get app state and clean up watchers
                let state: tauri::State<'_, AppState> = window.state();
                match state.clear_all_watchers() {
                    Ok(count) => log::info!("🧹 Cleaned up {} file watchers", count),
                    Err(e) => log::error!("❌ Failed to clean up watchers: {}", e),
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_state_creation() {
        let state = AppState::new();
        assert!(!state.has_workspace());
        assert_eq!(state.watcher_count(), 0);
    }

    #[test]
    fn test_module_exports() {
        // Verify public exports are accessible
        let _: fn(&str, &str) -> ValidationResult<std::path::PathBuf> = validate_path_within_workspace;
        let _: fn(&str, &str, &[&str]) -> ValidationResult<std::path::PathBuf> = validate_file_path;
        let _: fn(&str) -> String = sanitize_filename;
    }
}
