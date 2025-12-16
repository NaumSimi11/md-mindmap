// Import commands module
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      // File operations
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
      // Workspace management
      commands::workspace::create_directory,
      commands::workspace::get_default_workspace_location,
      commands::workspace::save_workspace_config_v2,
      commands::workspace::load_workspace_config_v2,
      commands::workspace::is_workspace_configured,
      commands::workspace::create_default_folders,
      commands::workspace::create_welcome_document,
      commands::workspace::list_workspace_contents,
      commands::workspace::verify_workspace_path,
      // Import/Export operations
      commands::import_export::import_markdown_file,
      commands::import_export::import_folder,
      commands::import_export::export_document,
      // File watching
      commands::file_watcher::watch_directory,
      commands::file_watcher::stop_watching,
      commands::file_watcher::get_file_metadata,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
