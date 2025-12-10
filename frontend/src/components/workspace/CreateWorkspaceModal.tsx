/**
 * CreateWorkspaceModal - Modal for creating new workspaces
 */

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { WorkspaceIconPicker } from './WorkspaceIconPicker';
import { Loader2 } from 'lucide-react';

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string; icon: string }) => Promise<void>;
}

export function CreateWorkspaceModal({ open, onClose, onCreate }: CreateWorkspaceModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🚀');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onCreate({ name: name.trim(), description: description.trim(), icon });
      
      // Reset form
      setName('');
      setDescription('');
      setIcon('🚀');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName('');
      setDescription('');
      setIcon('🚀');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Organize your documents into separate workspaces for different projects or contexts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Workspace Name */}
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Name *</Label>
            <Input
              id="workspace-name"
              placeholder="Work Projects"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Icon Picker */}
          <WorkspaceIconPicker selected={icon} onSelect={setIcon} />

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="workspace-description">Description (optional)</Label>
            <Textarea
              id="workspace-description"
              placeholder="A workspace for all my work-related documents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

