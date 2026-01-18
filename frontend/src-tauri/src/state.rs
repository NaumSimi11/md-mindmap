//! Application State Management for MDReader
//! 
//! This module provides centralized state management for the Tauri application,
//! including:
//! - File watcher registry (preventing memory leaks)
//! - Workspace path tracking
//! - Thread-safe state access

use std::collections::HashMap;
use std::sync::Mutex;
use notify::RecommendedWatcher;

/// Application state managed by Tauri
/// 
/// This struct is registered with Tauri via `.manage()` and provides
/// thread-safe access to shared application state.
/// 
/// # Thread Safety
/// All fields are wrapped in `Mutex` to allow safe concurrent access
/// from multiple Tauri command handlers.
/// 
/// # Example Usage
/// ```rust,ignore
/// use tauri::State;
/// use app_lib::AppState;
/// 
/// #[tauri::command]
/// async fn my_command(state: State<'_, AppState>) -> Result<(), String> {
///     let workspace = state.get_workspace_path()?;
///     // ... use workspace path
///     Ok(())
/// }
/// ```
pub struct AppState {
    /// Registry of active file watchers, keyed by directory path
    /// 
    /// This prevents the memory leak caused by `std::mem::forget` in the
    /// original implementation. Watchers are properly dropped when removed.
    pub watchers: Mutex<HashMap<String, WatcherEntry>>,
    
    /// Current workspace root path
    /// 
    /// All file operations are validated against this path to prevent
    /// directory traversal attacks.
    workspace_path: Mutex<Option<String>>,
}

/// Entry in the watcher registry
pub struct WatcherEntry {
    /// The actual file watcher
    /// Note: This field is intentionally kept to prevent the watcher from being dropped.
    /// The watcher continues running in the background as long as this struct exists.
    #[allow(dead_code)]
    pub watcher: RecommendedWatcher,
    /// When the watcher was created
    pub created_at: chrono::DateTime<chrono::Utc>,
    /// Number of events received
    pub event_count: u64,
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

impl AppState {
    /// Creates a new AppState instance
    pub fn new() -> Self {
        Self {
            watchers: Mutex::new(HashMap::new()),
            workspace_path: Mutex::new(None),
        }
    }
    
    // =========================================================================
    // Workspace Path Management
    // =========================================================================
    
    /// Sets the current workspace path
    /// 
    /// # Arguments
    /// * `path` - The workspace root path
    /// 
    /// # Returns
    /// * `Ok(())` - If the path was set successfully
    /// * `Err(String)` - If the mutex is poisoned
    pub fn set_workspace_path(&self, path: String) -> Result<(), String> {
        let mut workspace = self.workspace_path
            .lock()
            .map_err(|e| format!("Failed to lock workspace path: {}", e))?;
        
        log::info!("📂 Workspace path set to: {}", path);
        *workspace = Some(path);
        Ok(())
    }
    
    /// Gets the current workspace path
    /// 
    /// # Returns
    /// * `Ok(String)` - The workspace path
    /// * `Err(String)` - If no workspace is configured or mutex is poisoned
    pub fn get_workspace_path(&self) -> Result<String, String> {
        let workspace = self.workspace_path
            .lock()
            .map_err(|e| format!("Failed to lock workspace path: {}", e))?;
        
        workspace.clone().ok_or_else(|| "No workspace configured".to_string())
    }
    
    /// Checks if a workspace is configured
    pub fn has_workspace(&self) -> bool {
        self.workspace_path
            .lock()
            .map(|w| w.is_some())
            .unwrap_or(false)
    }
    
    /// Clears the current workspace path
    pub fn clear_workspace_path(&self) -> Result<(), String> {
        let mut workspace = self.workspace_path
            .lock()
            .map_err(|e| format!("Failed to lock workspace path: {}", e))?;
        
        log::info!("📂 Workspace path cleared");
        *workspace = None;
        Ok(())
    }
    
    // =========================================================================
    // Watcher Registry Management
    // =========================================================================
    
    /// Registers a new file watcher for a directory
    /// 
    /// If a watcher already exists for the given path, it will be replaced
    /// (the old watcher is properly dropped).
    /// 
    /// # Arguments
    /// * `path` - The directory path being watched
    /// * `watcher` - The file watcher instance
    /// 
    /// # Returns
    /// * `Ok(bool)` - True if a previous watcher was replaced
    /// * `Err(String)` - If the mutex is poisoned
    pub fn register_watcher(&self, path: String, watcher: RecommendedWatcher) -> Result<bool, String> {
        let mut watchers = self.watchers
            .lock()
            .map_err(|e| format!("Failed to lock watchers: {}", e))?;
        
        let entry = WatcherEntry {
            watcher,
            created_at: chrono::Utc::now(),
            event_count: 0,
        };
        
        let replaced = watchers.insert(path.clone(), entry).is_some();
        
        if replaced {
            log::info!("👀 Replaced watcher for: {}", path);
        } else {
            log::info!("👀 Registered new watcher for: {}", path);
        }
        
        Ok(replaced)
    }
    
    /// Removes and drops a file watcher for a directory
    /// 
    /// # Arguments
    /// * `path` - The directory path to stop watching
    /// 
    /// # Returns
    /// * `Ok(bool)` - True if a watcher was found and removed
    /// * `Err(String)` - If the mutex is poisoned
    pub fn remove_watcher(&self, path: &str) -> Result<bool, String> {
        let mut watchers = self.watchers
            .lock()
            .map_err(|e| format!("Failed to lock watchers: {}", e))?;
        
        let removed = watchers.remove(path).is_some();
        
        if removed {
            log::info!("🛑 Removed watcher for: {}", path);
        } else {
            log::warn!("⚠️ No watcher found for: {}", path);
        }
        
        Ok(removed)
    }
    
    /// Checks if a watcher exists for a directory
    pub fn has_watcher(&self, path: &str) -> bool {
        self.watchers
            .lock()
            .map(|w| w.contains_key(path))
            .unwrap_or(false)
    }
    
    /// Gets the number of active watchers
    pub fn watcher_count(&self) -> usize {
        self.watchers
            .lock()
            .map(|w| w.len())
            .unwrap_or(0)
    }
    
    /// Gets a list of all watched directories
    pub fn get_watched_directories(&self) -> Result<Vec<String>, String> {
        let watchers = self.watchers
            .lock()
            .map_err(|e| format!("Failed to lock watchers: {}", e))?;
        
        Ok(watchers.keys().cloned().collect())
    }
    
    /// Removes all watchers (for cleanup on app shutdown)
    pub fn clear_all_watchers(&self) -> Result<usize, String> {
        let mut watchers = self.watchers
            .lock()
            .map_err(|e| format!("Failed to lock watchers: {}", e))?;
        
        let count = watchers.len();
        watchers.clear();
        
        log::info!("🧹 Cleared {} watchers", count);
        Ok(count)
    }
    
    /// Increments the event count for a watcher
    pub fn increment_watcher_event_count(&self, path: &str) -> Result<u64, String> {
        let mut watchers = self.watchers
            .lock()
            .map_err(|e| format!("Failed to lock watchers: {}", e))?;
        
        if let Some(entry) = watchers.get_mut(path) {
            entry.event_count += 1;
            Ok(entry.event_count)
        } else {
            Err(format!("No watcher found for: {}", path))
        }
    }
    
    /// Gets statistics about a specific watcher
    pub fn get_watcher_stats(&self, path: &str) -> Result<Option<WatcherStats>, String> {
        let watchers = self.watchers
            .lock()
            .map_err(|e| format!("Failed to lock watchers: {}", e))?;
        
        Ok(watchers.get(path).map(|entry| WatcherStats {
            path: path.to_string(),
            created_at: entry.created_at,
            event_count: entry.event_count,
            uptime_seconds: (chrono::Utc::now() - entry.created_at).num_seconds(),
        }))
    }
}

/// Statistics about a file watcher
#[derive(Debug, Clone, serde::Serialize)]
pub struct WatcherStats {
    pub path: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub event_count: u64,
    pub uptime_seconds: i64,
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use notify::{Config, RecommendedWatcher, Watcher};
    use std::sync::mpsc::channel;
    use tempfile::TempDir;

    /// Helper to create a test watcher
    fn create_test_watcher() -> RecommendedWatcher {
        let (tx, _rx) = channel();
        RecommendedWatcher::new(
            move |_res| {
                tx.send(()).ok();
            },
            Config::default(),
        ).expect("Failed to create watcher")
    }

    /// Helper to create test workspace
    fn setup_test_workspace() -> TempDir {
        TempDir::new().expect("Failed to create temp dir")
    }

    // -------------------------------------------------------------------------
    // Workspace Path Tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_set_and_get_workspace_path() {
        let state = AppState::new();
        
        // Initially no workspace
        assert!(state.get_workspace_path().is_err());
        assert!(!state.has_workspace());
        
        // Set workspace
        state.set_workspace_path("/test/workspace".to_string()).unwrap();
        
        // Now has workspace
        assert!(state.has_workspace());
        assert_eq!(state.get_workspace_path().unwrap(), "/test/workspace");
    }

    #[test]
    fn test_clear_workspace_path() {
        let state = AppState::new();
        
        state.set_workspace_path("/test/workspace".to_string()).unwrap();
        assert!(state.has_workspace());
        
        state.clear_workspace_path().unwrap();
        assert!(!state.has_workspace());
    }

    #[test]
    fn test_workspace_path_override() {
        let state = AppState::new();
        
        state.set_workspace_path("/first/path".to_string()).unwrap();
        assert_eq!(state.get_workspace_path().unwrap(), "/first/path");
        
        state.set_workspace_path("/second/path".to_string()).unwrap();
        assert_eq!(state.get_workspace_path().unwrap(), "/second/path");
    }

    // -------------------------------------------------------------------------
    // Watcher Registry Tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_register_watcher() {
        let state = AppState::new();
        let watcher = create_test_watcher();
        
        // Initially no watchers
        assert_eq!(state.watcher_count(), 0);
        
        // Register watcher
        let replaced = state.register_watcher("/test/dir".to_string(), watcher).unwrap();
        
        assert!(!replaced);
        assert_eq!(state.watcher_count(), 1);
        assert!(state.has_watcher("/test/dir"));
    }

    #[test]
    fn test_replace_watcher() {
        let state = AppState::new();
        
        // Register first watcher
        let watcher1 = create_test_watcher();
        let replaced1 = state.register_watcher("/test/dir".to_string(), watcher1).unwrap();
        assert!(!replaced1);
        
        // Register second watcher for same path (replaces first)
        let watcher2 = create_test_watcher();
        let replaced2 = state.register_watcher("/test/dir".to_string(), watcher2).unwrap();
        assert!(replaced2);
        
        // Still only one watcher
        assert_eq!(state.watcher_count(), 1);
    }

    #[test]
    fn test_remove_watcher() {
        let state = AppState::new();
        let watcher = create_test_watcher();
        
        state.register_watcher("/test/dir".to_string(), watcher).unwrap();
        assert_eq!(state.watcher_count(), 1);
        
        // Remove watcher
        let removed = state.remove_watcher("/test/dir").unwrap();
        assert!(removed);
        assert_eq!(state.watcher_count(), 0);
        assert!(!state.has_watcher("/test/dir"));
        
        // Remove again (should return false)
        let removed_again = state.remove_watcher("/test/dir").unwrap();
        assert!(!removed_again);
    }

    #[test]
    fn test_clear_all_watchers() {
        let state = AppState::new();
        
        // Register multiple watchers
        state.register_watcher("/dir1".to_string(), create_test_watcher()).unwrap();
        state.register_watcher("/dir2".to_string(), create_test_watcher()).unwrap();
        state.register_watcher("/dir3".to_string(), create_test_watcher()).unwrap();
        
        assert_eq!(state.watcher_count(), 3);
        
        // Clear all
        let cleared = state.clear_all_watchers().unwrap();
        assert_eq!(cleared, 3);
        assert_eq!(state.watcher_count(), 0);
    }

    #[test]
    fn test_get_watched_directories() {
        let state = AppState::new();
        
        state.register_watcher("/dir1".to_string(), create_test_watcher()).unwrap();
        state.register_watcher("/dir2".to_string(), create_test_watcher()).unwrap();
        
        let dirs = state.get_watched_directories().unwrap();
        assert_eq!(dirs.len(), 2);
        assert!(dirs.contains(&"/dir1".to_string()));
        assert!(dirs.contains(&"/dir2".to_string()));
    }

    #[test]
    fn test_watcher_event_count() {
        let state = AppState::new();
        state.register_watcher("/test".to_string(), create_test_watcher()).unwrap();
        
        // Initial count is 0
        let stats = state.get_watcher_stats("/test").unwrap().unwrap();
        assert_eq!(stats.event_count, 0);
        
        // Increment
        state.increment_watcher_event_count("/test").unwrap();
        state.increment_watcher_event_count("/test").unwrap();
        
        let stats = state.get_watcher_stats("/test").unwrap().unwrap();
        assert_eq!(stats.event_count, 2);
    }

    #[test]
    fn test_watcher_stats() {
        let state = AppState::new();
        state.register_watcher("/test".to_string(), create_test_watcher()).unwrap();
        
        let stats = state.get_watcher_stats("/test").unwrap();
        assert!(stats.is_some());
        
        let stats = stats.unwrap();
        assert_eq!(stats.path, "/test");
        assert!(stats.uptime_seconds >= 0);
    }

    #[test]
    fn test_nonexistent_watcher_stats() {
        let state = AppState::new();
        
        let stats = state.get_watcher_stats("/nonexistent").unwrap();
        assert!(stats.is_none());
    }

    // -------------------------------------------------------------------------
    // Thread Safety Tests
    // -------------------------------------------------------------------------

    #[test]
    fn test_concurrent_workspace_access() {
        use std::sync::Arc;
        use std::thread;
        
        let state = Arc::new(AppState::new());
        let mut handles = vec![];
        
        // Spawn multiple threads that access workspace path
        for i in 0..10 {
            let state_clone = Arc::clone(&state);
            let handle = thread::spawn(move || {
                state_clone.set_workspace_path(format!("/workspace/{}", i)).unwrap();
                state_clone.get_workspace_path().unwrap();
            });
            handles.push(handle);
        }
        
        // Wait for all threads
        for handle in handles {
            handle.join().unwrap();
        }
        
        // State should be valid
        assert!(state.has_workspace());
    }

    #[test]
    fn test_concurrent_watcher_access() {
        use std::sync::Arc;
        use std::thread;
        
        let state = Arc::new(AppState::new());
        let mut handles = vec![];
        
        // Spawn multiple threads that register watchers
        for i in 0..10 {
            let state_clone = Arc::clone(&state);
            let handle = thread::spawn(move || {
                let watcher = create_test_watcher();
                state_clone.register_watcher(format!("/dir{}", i), watcher).unwrap();
            });
            handles.push(handle);
        }
        
        // Wait for all threads
        for handle in handles {
            handle.join().unwrap();
        }
        
        // All watchers should be registered
        assert_eq!(state.watcher_count(), 10);
    }
}
