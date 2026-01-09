/**
 * Rename Folder Modal
 * ====================
 * 
 * A proper modal for renaming folders (replaces browser prompt)
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Folder, Edit } from 'lucide-react';

interface RenameFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onRename: (newName: string) => Promise<void>;
}

export function RenameFolderModal({
  isOpen,
  onClose,
  currentName,
  onRename,
}: RenameFolderModalProps) {
  const [newName, setNewName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, currentName]);

  const handleSubmit = async () => {
    const trimmedName = newName.trim();
    
    // Validate
    if (!trimmedName) {
      setError('Folder name cannot be empty');
      return;
    }
    
    if (trimmedName === currentName) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onRename(trimmedName);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to rename folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Edit className="h-4 w-4 text-amber-500" />
            </div>
            Rename Folder
          </DialogTitle>
          <DialogDescription>
            Enter a new name for this folder.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Name Display */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Current:</span>
            <span className="text-sm font-medium">{currentName}</span>
          </div>

          {/* New Name Input */}
          <div className="space-y-2">
            <Label htmlFor="folder-name">New Name</Label>
            <Input
              id="folder-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter folder name..."
              autoFocus
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !newName.trim()}
            className="gap-2"
          >
            {isSubmitting ? 'Renaming...' : 'Rename'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

