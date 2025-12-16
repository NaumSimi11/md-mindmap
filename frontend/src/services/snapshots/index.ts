/**
 * STEP 5: Cloud Snapshots Entry Point
 * 
 * Cloud snapshots are READ-ONLY DERIVATIONS of Yjs state.
 * They NEVER write to Yjs during normal operation.
 */

export { SnapshotManager } from './SnapshotManager';
export { 
  serializeYjsBinary, 
  serializeYjsToHtml,
  binaryToBase64,
  base64ToBinary,
  createSnapshotPayload,
  type SnapshotPayload 
} from './serializeYjs';
export { pushSnapshot, fetchSnapshot } from './snapshotClient';
export { restoreFromSnapshot, canRestore, previewSnapshot } from './restoreSnapshot';

