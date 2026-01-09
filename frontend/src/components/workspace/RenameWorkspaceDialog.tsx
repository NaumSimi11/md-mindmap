/**
 * RenameWorkspaceDialog - Dialog for renaming workspace
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RenameWorkspaceDialogProps {
  open: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  currentName: string;
}

export function RenameWorkspaceDialog({
  open,
  onClose,
  onRename,
  currentName,
}: RenameWorkspaceDialogProps) {
  const [name, setName] = useState(currentName);

  // Update name when currentName changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(currentName);
    }
  }, [open, currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    
    if (!name.trim()) {
      console.warn('⚠️ Empty name, aborting');
      return;
    }

    onRename(name.trim());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Workspace</DialogTitle>
          <DialogDescription>
            Give your workspace a new name
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workspace name"
              autoFocus
              maxLength={50}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim() && name.trim() !== currentName) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            disabled={!name.trim() || name.trim() === currentName}
            onClick={(e) => handleSubmit(e as any)}
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

