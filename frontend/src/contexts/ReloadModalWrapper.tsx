import React, { useState } from 'react';
import ReloadFileModal from '@/components/workspace/ReloadFileModal';
import { fileWatcherService } from '@/services/tauri/FileWatcherService';

export default function ReloadModalWrapper({ reloadPrompt, onClose, snapshotBeforeReload }: any) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReload = async () => {
    setIsProcessing(true);
    try {
      await snapshotBeforeReload(reloadPrompt.documentId, {
        reason: 'external-file-reload',
        filePath: reloadPrompt.filePath,
        timestamp: reloadPrompt.timestamp,
      });

      // Explicit reload action (mutates Yjs)
      await fileWatcherService.reloadDocumentFromFile(reloadPrompt.documentId);
    } catch (err) {
      console.error('❌ Reload failed:', err);
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  // Determine a simple dirtiness heuristic: if doc exists in local docs store with non-empty content
  // Try to avoid importing workspace context here to keep separation; minimal heuristic: false
  const isDirty = false;

  return (
    <ReloadFileModal
      open={true}
      filePath={reloadPrompt.filePath}
      changeCount={reloadPrompt.changeCount}
      isDirty={isDirty}
      onReload={handleReload}
      onCancel={handleCancel}
    />
  );
}


