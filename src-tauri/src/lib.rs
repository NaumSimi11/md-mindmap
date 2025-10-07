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
      commands::file_operations::select_workspace_folder,
      commands::file_operations::list_workspace_files,
      commands::file_operations::save_document_to_file,
      commands::file_operations::load_document_from_file,
      commands::file_operations::create_new_file,
      commands::file_operations::delete_file,
      commands::file_operations::save_workspace_config,
      commands::file_operations::load_workspace_config,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
