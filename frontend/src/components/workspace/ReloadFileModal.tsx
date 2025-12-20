import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ReloadFileModalProps {
  open: boolean;
  filePath: string;
  changeCount: number;
  isDirty: boolean;
  onReload: () => Promise<void>;
  onCancel: () => void;
}

export function ReloadFileModal({ open, filePath, changeCount, isDirty, onReload, onCancel }: ReloadFileModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>External file changed</DialogTitle>
          <DialogDescription>
            The file <b>{filePath}</b> was modified outside the app.
            {changeCount > 1 ? ` (${changeCount} changes)` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            {isDirty ? (
              <span className="font-semibold text-amber-600">Warning: You have local edits that will be replaced if you reload.</span>
            ) : (
              <span>The reload will replace the current in-editor content.</span>
            )}
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Ignore</Button>
          <Button onClick={onReload} variant="default">Reload file</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReloadFileModal;


