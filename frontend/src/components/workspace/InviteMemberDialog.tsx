/**
 * Invite Member Dialog
 * ====================
 * 
 * Dialog for inviting a user to a workspace.
 * 
 * For MVP: Add by user ID (later: add by email with invite system)
 */

import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAddWorkspaceMember } from '@/hooks/useWorkspaceMembers';
import { getRoleInfo } from '@/hooks/useWorkspacePermissions';
import type { WorkspaceRole } from '@/services/api';

interface InviteMemberDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({ workspaceId, open, onOpenChange }: InviteMemberDialogProps) {
  const addMember = useAddWorkspaceMember(workspaceId);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<Exclude<WorkspaceRole, 'owner'>>('viewer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId.trim()) return;

    try {
      await addMember.mutateAsync({
        user_id: userId.trim(),
        role,
      });
      
      // Reset and close
      setUserId('');
      setRole('viewer');
      onOpenChange(false);
    } catch (error) {
      // Error toast shown by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Member
          </DialogTitle>
          <DialogDescription>
            Add a user to this workspace. They will have access to all documents based on their role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User ID Input (MVP) */}
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              placeholder="Enter user ID..."
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Note: Email invites coming soon. For now, enter the user's ID.
            </p>
          </div>

          {/* Role Select */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as typeof role)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['admin', 'editor', 'viewer'] as const).map((roleOption) => {
                  const roleInfo = getRoleInfo(roleOption);
                  return (
                    <SelectItem key={roleOption} value={roleOption}>
                      <div className="flex items-center gap-2">
                        <span>{roleInfo.icon}</span>
                        <div>
                          <div className="font-medium">{roleInfo.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {roleInfo.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addMember.isPending || !userId.trim()}>
              {addMember.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

