use tauri::{command, AppHandle, Emitter};
use notify::{Watcher, RecursiveMode, Result as NotifyResult, Event, EventKind};
use std::sync::mpsc::channel;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChangeEvent {
    pub path: String,
    pub event_type: String,
    pub timestamp: String,
}

/// Start watching a directory for file changes
#[command]
pub async fn watch_directory(
    app_handle: AppHandle,
    directory_path: String,
) -> Result<(), String> {
    let path = PathBuf::from(&directory_path);
    
    if !path.exists() {
        return Err(format!("Directory does not exist: {}", directory_path));
    }
    
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", directory_path));
    }
    
    // Create a channel to receive the events
    let (tx, rx) = channel();
    
    // Create a watcher object, delivering debounced events
    let mut watcher = notify::recommended_watcher(move |res: NotifyResult<Event>| {
        if let Ok(event) = res {
            tx.send(event).ok();
        }
    }).map_err(|e| format!("Failed to create watcher: {}", e))?;
    
    // Add a path to be watched
    watcher.watch(&path, RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to watch directory: {}", e))?;
    
    println!("👀 Watching directory: {}", directory_path);
    
    // Spawn a task to handle events
    let app_handle_clone = app_handle.clone();
    
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
                            
                            println!("📝 File change detected: {} - {}", event_type, path_str);
                            
                            // Emit event to frontend
                            app_handle_clone.emit("file-changed", &change_event).ok();
                        }
                    }
                }
                _ => {}
            }
        }
    });
    
    // Keep watcher alive (don't drop it)
    // In a real app, you'd store this in app state
    std::mem::forget(watcher);
    
    Ok(())
}

/// Stop watching a directory (placeholder - requires state management)
#[command]
pub async fn stop_watching(directory_path: String) -> Result<(), String> {
    // This requires implementing proper state management for watchers
    // For now, just log
    println!("🛑 Stop watching: {}", directory_path);
    Ok(())
}

/// Get file metadata (last modified time, size, etc.)
#[command]
pub async fn get_file_metadata(file_path: String) -> Result<FileMetadata, String> {
    let path = PathBuf::from(&file_path);
    
    if !path.exists() {
        return Err(format!("File does not exist: {}", file_path));
    }
    
    let metadata = std::fs::metadata(&path)
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

#[derive(Debug, Serialize, Deserialize)]
pub struct FileMetadata {
    pub path: String,
    pub size: u64,
    pub modified: String,
    pub is_file: bool,
    pub is_dir: bool,
}

