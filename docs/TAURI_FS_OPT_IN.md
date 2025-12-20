Tauri Filesystem Storage Opt-In (Developer Notes)
===============================================

Purpose
-------
This document explains the opt-in mechanism for using the Tauri filesystem as a storage provider.
By default, the canonical storage is IndexedDB in the browser. Tauri filesystem storage is explicitly
dangerous and must be opt-in to avoid accidental activation.

Flags
-----
- VITE_ENABLE_TAURI_FS_CANONICAL (build/runtime env)  
  - Default: false  
  - When set to 'true' and the runtime platform is DESKTOP, the app will attempt to use the Tauri FS provider.

- window.__MDREADER_ENABLE_TAURI_FS_CANONICAL__ (runtime dev override)  
  - Only honored in DEV mode. Ignored in PROD builds.
  - For troubleshooting/local development only.

Behavior
--------
1. Default: IndexedDBStorageProvider will be created and initialized. The log will contain:
   "Creating IndexedDBStorageProvider (platform: X) - Reason: default canonical storage"

2. If opt-in is enabled AND platform === DESKTOP:
   - The app will attempt to dynamically import `TauriStorageProvider`.
   - If successful, it will use Tauri FS and log:
     "Creating TauriStorageProvider (platform: DESKTOP) - Reason: explicit opt-in"
   - An experimental warning is logged:
     "⚠️ WARNING: Tauri filesystem storage is EXPERIMENTAL and NOT CANONICAL by default"

3. If opt-in is enabled but platform !== DESKTOP:
   - The app will fall back to IndexedDB and log a warning.

CI / Safety
---------
Run `npm run check:tauri-fs` in CI to ensure no code directly constructs `TauriStorageProvider`
outside of `StorageProviderFactory`. This prevents accidental bypasses.

Notes
-----
- Do NOT treat Tauri FS as canonical across devices—this is a local desktop feature.
- File watcher and UI behavior remain unchanged by this opt-in.
- Use this only for controlled experiments; prefer IndexedDB for canonical state.


