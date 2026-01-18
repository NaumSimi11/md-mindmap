//! File Watcher Commands
//! 
//! This module provides Tauri commands for watching file system changes
//! with proper state management to prevent memory leaks.
//! 
//! ## Architecture
//! 
//! Watchers are stored in `AppState.watchers` HashMap, keyed by directory path.
//! This allows:
//! - Multiple directories to be watched simultaneously
//! - Proper cleanup when stopping watchers
//! - No memory leaks from `std::mem::forget`
//! - Graceful shutdown on app close

use tauri::{command, AppHandle, Emitter, State};
use notify::{Config, Watcher, RecursiveMode, Result as NotifyResult, Event, EventKind, RecommendedWatcher};
use std::sync::mpsc::channel;
use serde::{Deserialize, Serialize};
use crate::state::AppState;
use crate::utils::validate_directory_path;

/// Event emitted when a file changes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChangeEvent {
    pub path: String,
    pub event_type: String,
    pub timestamp: String,
}

/// Metadata about a file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub path: String,
    pub size: u64,
    pub modified: String,
    pub is_file: bool,
    pub is_dir: bool,
}

/// Information about an active watcher
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatcherInfo {
    pub path: String,
    pub is_active: bool,
    pub event_count: u64,
    pub uptime_seconds: i64,
}

/// Start watching a directory for file changes.
/// 
/// Security: Validates that directory_path is within the configured workspace.
/// 
/// # Arguments
/// * `app_handle` - Tauri app handle for emitting events
/// * `state` - Application state containing watcher registry
/// * `directory_path` - Directory to watch (must be within workspace)
/// 
/// # Events
/// Emits `file-changed` events to the frontend with `FileChangeEvent` payload
/// 
/// # Returns
/// * `Ok(())` - Watcher started successfully
/// * `Err(String)` - If validation fails or watcher cannot be created
#[command]
pub async fn watch_directory(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    directory_path: String,
) -> Result<(), String> {
    let workspace = state.get_workspace_path()?;
    
    // Validate directory is within workspace
    let validated_path = validate_directory_path(&directory_path, &workspace, true)
        .map_err(|e| format!("Security error: {}", e))?;
    
    // Check if already watching this directory
    if state.has_watcher(&directory_path) {
        log::info!("👀 Already watching directory: {}", directory_path);
        return Ok(());
    }
    
    // Create a channel to receive the events
    let (tx, rx) = channel::<Event>();
    
    // Clone values for the closure
    let dir_path_clone = directory_path.clone();
    let app_handle_clone = app_handle.clone();
    
    // Create watcher with custom config
    let config = Config::default()
        .with_poll_interval(std::time::Duration::from_secs(2));
    
    let watcher = RecommendedWatcher::new(
        move |res: NotifyResult<Event>| {
            if let Ok(event) = res {
                tx.send(event).ok();
            }
        },
        config,
    ).map_err(|e| format!("Failed to create watcher: {}", e))?;
    
    // Register watcher in state BEFORE starting to watch
    // This ensures proper cleanup even if watching fails
    state.register_watcher(directory_path.clone(), watcher)?;
    
    // Get a reference to add the watch path
    // We need to do this after registration to get the watcher from state
    {
        let mut watchers = state.watchers
            .lock()
            .map_err(|e| format!("Failed to lock watchers: {}", e))?;
        
        if let Some(entry) = watchers.get_mut(&directory_path) {
            entry.watcher.watch(&validated_path, RecursiveMode::Recursive)
                .map_err(|e| {
                    // Clean up on failure
                    drop(watchers);
                    state.remove_watcher(&directory_path).ok();
                    format!("Failed to watch directory: {}", e)
                })?;
        }
    }
    
    log::info!("👀 Started watching directory: {}", directory_path);
    
    // Spawn a task to handle events
    std::thread::spawn(move || {
        for event in rx {
            // Filter for relevant events
            match event.kind {
                EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_) => {
                    // Get the first path (usually there's only one)
                    if let Some(path) = event.paths.first() {
                        let path_str = path.to_string_lossy().to_string();
                        
                        // Only notify for .md files
                        if path_str.ends_with(".md") {
                            let event_type = match event.kind {
                                EventKind::Create(_) => "created",
                                EventKind::Modify(_) => "modified",
                                EventKind::Remove(_) => "deleted",
                                _ => "unknown",
                            };
                            
                            let change_event = FileChangeEvent {
                                path: path_str.clone(),
                                event_type: event_type.to_string(),
                                timestamp: chrono::Utc::now().to_rfc3339(),
                            };
                            
                            log::info!("📝 File change detected: {} - {}", event_type, path_str);
                            
                            // Emit event to frontend
                            if let Err(e) = app_handle_clone.emit("file-changed", &change_event) {
                                log::error!("Failed to emit file-changed event: {}", e);
                            }
                        }
                    }
                }
                _ => {}
            }
        }
        
        log::info!("🛑 Watcher event loop ended for: {}", dir_path_clone);
    });
    
    Ok(())
}

/// Stop watching a directory for file changes.
/// 
/// This properly removes the watcher from state and drops it,
/// releasing all resources.
/// 
/// # Arguments
/// * `state` - Application state containing watcher registry
/// * `directory_path` - Directory to stop watching
/// 
/// # Returns
/// * `Ok(bool)` - True if a watcher was found and removed
/// * `Err(String)` - If state access fails
#[command]
pub async fn stop_watching(
    state: State<'_, AppState>,
    directory_path: String,
) -> Result<bool, String> {
    let removed = state.remove_watcher(&directory_path)?;
    
    if removed {
        log::info!("🛑 Stopped watching: {}", directory_path);
    } else {
        log::warn!("⚠️ No watcher found for: {}", directory_path);
    }
    
    Ok(removed)
}

/// Get file metadata (last modified time, size, etc.)
/// 
/// Security: Validates that file_path is within the configured workspace.
#[command]
pub async fn get_file_metadata(
    state: State<'_, AppState>,
    file_path: String,
) -> Result<FileMetadata, String> {
    let workspace = state.get_workspace_path()?;
    
    // Validate path is within workspace
    let validated_path = crate::utils::validate_path_within_workspace(&file_path, &workspace)
        .map_err(|e| format!("Security error: {}", e))?;
    
    if !validated_path.exists() {
        return Err(format!("File does not exist: {}", file_path));
    }
    
    let metadata = std::fs::metadata(&validated_path)
        .map_err(|e| format!("Failed to read metadata: {}", e))?;
    
    let modified = metadata.modified()
        .map(|t| format!("{:?}", t))
        .unwrap_or_else(|_| "Unknown".to_string());
    
    Ok(FileMetadata {
        path: file_path,
        size: metadata.len(),
        modified,
        is_file: metadata.is_file(),
        is_dir: metadata.is_dir(),
    })
}

/// List all currently active watchers.
/// 
/// This is useful for debugging and UI display.
#[command]
pub async fn list_active_watchers(
    state: State<'_, AppState>,
) -> Result<Vec<WatcherInfo>, String> {
    let directories = state.get_watched_directories()?;
    let mut watchers = Vec::new();
    
    for path in directories {
        if let Ok(Some(stats)) = state.get_watcher_stats(&path) {
            watchers.push(WatcherInfo {
                path: stats.path,
                is_active: true,
                event_count: stats.event_count,
                uptime_seconds: stats.uptime_seconds,
            });
        }
    }
    
    Ok(watchers)
}

/// Stop all active watchers.
/// 
/// This is called during app shutdown or workspace change.
#[command]
pub async fn stop_all_watchers(
    state: State<'_, AppState>,
) -> Result<usize, String> {
    let count = state.clear_all_watchers()?;
    log::info!("🧹 Stopped {} watchers", count);
    Ok(count)
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_change_event_serialization() {
        let event = FileChangeEvent {
            path: "/test/file.md".to_string(),
            event_type: "modified".to_string(),
            timestamp: "2024-01-01T00:00:00Z".to_string(),
        };
        
        let json = serde_json::to_string(&event).expect("Failed to serialize");
        assert!(json.contains("file.md"));
        assert!(json.contains("modified"));
        
        let parsed: FileChangeEvent = serde_json::from_str(&json).expect("Failed to deserialize");
        assert_eq!(parsed.path, event.path);
        assert_eq!(parsed.event_type, event.event_type);
    }

    #[test]
    fn test_file_metadata_serialization() {
        let metadata = FileMetadata {
            path: "/test/file.md".to_string(),
            size: 1024,
            modified: "SystemTime { ... }".to_string(),
            is_file: true,
            is_dir: false,
        };
        
        let json = serde_json::to_string(&metadata).expect("Failed to serialize");
        assert!(json.contains("1024"));
        assert!(json.contains("true"));
        
        let parsed: FileMetadata = serde_json::from_str(&json).expect("Failed to deserialize");
        assert_eq!(parsed.size, 1024);
        assert!(parsed.is_file);
        assert!(!parsed.is_dir);
    }

    #[test]
    fn test_watcher_info_serialization() {
        let info = WatcherInfo {
            path: "/test/workspace".to_string(),
            is_active: true,
            event_count: 42,
            uptime_seconds: 3600,
        };
        
        let json = serde_json::to_string(&info).expect("Failed to serialize");
        assert!(json.contains("42"));
        assert!(json.contains("3600"));
        
        let parsed: WatcherInfo = serde_json::from_str(&json).expect("Failed to deserialize");
        assert_eq!(parsed.event_count, 42);
        assert_eq!(parsed.uptime_seconds, 3600);
    }

    #[test]
    fn test_app_state_watcher_lifecycle() {
        use notify::{Config, RecommendedWatcher};
        use std::sync::mpsc::channel;
        
        let state = AppState::new();
        
        // Initially no watchers
        assert_eq!(state.watcher_count(), 0);
        
        // Create and register a watcher
        let (tx, _rx) = channel();
        let watcher = RecommendedWatcher::new(
            move |_res| { tx.send(()).ok(); },
            Config::default(),
        ).expect("Failed to create watcher");
        
        state.register_watcher("/test/path".to_string(), watcher).unwrap();
        
        // Now has one watcher
        assert_eq!(state.watcher_count(), 1);
        assert!(state.has_watcher("/test/path"));
        
        // Remove watcher
        let removed = state.remove_watcher("/test/path").unwrap();
        assert!(removed);
        assert_eq!(state.watcher_count(), 0);
    }

    #[test]
    fn test_watcher_replacement() {
        use notify::{Config, RecommendedWatcher};
        use std::sync::mpsc::channel;
        
        let state = AppState::new();
        
        // Register first watcher
        let (tx1, _rx1) = channel();
        let watcher1 = RecommendedWatcher::new(
            move |_res| { tx1.send(()).ok(); },
            Config::default(),
        ).expect("Failed to create watcher");
        
        let replaced1 = state.register_watcher("/test/path".to_string(), watcher1).unwrap();
        assert!(!replaced1); // First registration, nothing replaced
        
        // Register second watcher for same path
        let (tx2, _rx2) = channel();
        let watcher2 = RecommendedWatcher::new(
            move |_res| { tx2.send(()).ok(); },
            Config::default(),
        ).expect("Failed to create watcher");
        
        let replaced2 = state.register_watcher("/test/path".to_string(), watcher2).unwrap();
        assert!(replaced2); // Should replace existing
        
        // Still only one watcher
        assert_eq!(state.watcher_count(), 1);
    }

    #[test]
    fn test_no_memory_leak_on_replacement() {
        use notify::{Config, RecommendedWatcher};
        use std::sync::mpsc::channel;
        
        let state = AppState::new();
        
        // Register multiple watchers to same path
        // Each new registration drops the previous watcher
        for i in 0..10 {
            let (tx, _rx) = channel();
            let watcher = RecommendedWatcher::new(
                move |_res| { tx.send(()).ok(); },
                Config::default(),
            ).expect("Failed to create watcher");
            
            let replaced = state.register_watcher("/test/path".to_string(), watcher).unwrap();
            
            // First one shouldn't replace, subsequent ones should
            if i == 0 {
                assert!(!replaced);
            } else {
                assert!(replaced);
            }
        }
        
        // Still only one watcher (others were dropped/replaced)
        assert_eq!(state.watcher_count(), 1);
        
        // Clear all
        state.clear_all_watchers().unwrap();
        assert_eq!(state.watcher_count(), 0);
    }
}
