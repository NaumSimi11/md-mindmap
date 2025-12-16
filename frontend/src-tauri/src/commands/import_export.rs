use tauri::command;
use std::fs;
use std::path::PathBuf;

// ========================================
// IMPORT OPERATIONS
// ========================================

#[command]
pub async fn import_markdown_file(source_path: String, dest_folder: String) -> Result<String, String> {
    let source = PathBuf::from(&source_path);
    let dest_dir = PathBuf::from(&dest_folder);
    
    if !source.exists() {
        return Err(format!("Source file does not exist: {}", source_path));
    }
    
    if !source.is_file() {
        return Err(format!("Source is not a file: {}", source_path));
    }
    
    // Get file name
    let file_name = source.file_name()
        .ok_or("Failed to get file name")?
        .to_string_lossy()
        .to_string();
    
    // Ensure .md extension
    let final_name = if file_name.ends_with(".md") {
        file_name
    } else {
        format!("{}.md", file_name)
    };
    
    let dest_path = dest_dir.join(&final_name);
    
    // Copy file
    fs::copy(&source, &dest_path)
        .map_err(|e| format!("Failed to import file: {}", e))?;
    
    println!("📥 Imported: {} → {}", source_path, dest_path.display());
    Ok(dest_path.to_string_lossy().to_string())
}

#[command]
pub async fn import_folder(source_path: String, dest_folder: String) -> Result<Vec<String>, String> {
    let source = PathBuf::from(&source_path);
    let dest_dir = PathBuf::from(&dest_folder);
    
    if !source.exists() {
        return Err(format!("Source folder does not exist: {}", source_path));
    }
    
    if !source.is_dir() {
        return Err(format!("Source is not a directory: {}", source_path));
    }
    
    let folder_name = source.file_name()
        .ok_or("Failed to get folder name")?
        .to_string_lossy()
        .to_string();
    
    let dest_path = dest_dir.join(&folder_name);
    
    // Copy directory recursively
    copy_dir_recursive(&source, &dest_path)?;
    
    println!("📥 Imported folder: {} → {}", source_path, dest_path.display());
    
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

#[command]
pub async fn export_workspace_to_zip(_workspace_path: String, _dest_path: String) -> Result<(), String> {
    // TODO: Implement ZIP export
    // Requires adding zip crate to Cargo.toml
    Err("ZIP export not yet implemented".to_string())
}

#[command]
pub async fn export_document(document_path: String, dest_path: String) -> Result<(), String> {
    let source = PathBuf::from(&document_path);
    let dest = PathBuf::from(&dest_path);
    
    if !source.exists() {
        return Err(format!("Document does not exist: {}", document_path));
    }
    
    fs::copy(&source, &dest)
        .map_err(|e| format!("Failed to export document: {}", e))?;
    
    println!("📤 Exported: {} → {}", document_path, dest_path);
    Ok(())
}

