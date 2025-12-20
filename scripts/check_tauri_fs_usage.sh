#!/usr/bin/env bash
set -euo pipefail

echo "🔒 Running Tauri FS usage guard..."

# Find direct instantiation of TauriStorageProvider
matches="$(grep -R --line-number \"new TauriStorageProvider\" frontend/src || true)"

if [ -n \"$matches\" ]; then
  # Exclude the factory file itself
  filtered="$(echo \"$matches\" | grep -v \"StorageProviderFactory\" || true)"
  if [ -n \"$filtered\" ]; then
    echo \"❌ Direct TauriStorageProvider usage detected outside StorageProviderFactory:\"
    echo \"$filtered\"
    exit 1
  fi
fi

echo \"✅ No direct TauriStorageProvider usage detected outside StorageProviderFactory.\"


