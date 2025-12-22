/**
 * Change Member Role Dialog
 * =========================
 * 
 * Dialog for changing a workspace member's role.
 * 
 * Cannot:
 * - Change owner role
 * - Promote to owner (use transfer ownership)
 */

import React, { useState, useEffect } from 'react';
import { UserCog } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChangeMemberRole } from '@/hooks/useWorkspaceMembers';
import { getRoleInfo } from '@/hooks/useWorkspacePermissions';
import type { WorkspaceMember, WorkspaceRole } from '@/services/api';

interface ChangeMemberRoleDialogProps {
  workspaceId: string;
  member: WorkspaceMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeMemberRoleDialog({
  workspaceId,
  member,
  open,
  onOpenChange,
}: ChangeMemberRoleDialogProps) {
  const changeMemberRole = useChangeMemberRole(workspaceId);
  const [newRole, setNewRole] = useState<Exclude<WorkspaceRole, 'owner'>>(
    member.role === 'owner' ? 'admin' : (member.role as Exclude<WorkspaceRole, 'owner'>)
  );

  // Update when member changes
  useEffect(() => {
    if (member.role !== 'owner') {
      setNewRole(member.role as Exclude<WorkspaceRole, 'owner'>);
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newRole === member.role) {
      onOpenChange(false);
      return;
    }

    try {
      await changeMemberRole.mutateAsync({
        userId: member.user_id,
        request: { role: newRole },
      });
      
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
            <UserCog className="h-5 w-5" />
            Change Member Role
          </DialogTitle>
          <DialogDescription>
            Change the role for <strong>{member.full_name || member.username}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Role Info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Current Role</p>
            <div className="flex items-center gap-2">
              <span>{getRoleInfo(member.role).icon}</span>
              <span className="font-medium">{getRoleInfo(member.role).label}</span>
            </div>
          </div>

          {/* New Role Select */}
          <div className="space-y-2">
            <Label htmlFor="newRole">New Role</Label>
            <Select value={newRole} onValueChange={(value) => setNewRole(value as typeof newRole)}>
              <SelectTrigger id="newRole">
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
            <p className="text-xs text-muted-foreground">
              Note: To make someone an owner, use "Transfer Ownership" in the Danger Zone.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={changeMemberRole.isPending || newRole === member.role}
            >
              {changeMemberRole.isPending ? 'Changing...' : 'Change Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

