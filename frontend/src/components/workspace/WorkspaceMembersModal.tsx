/**
 * Workspace Members Modal
 * =======================
 *
 * Quick access modal for managing workspace members.
 * Uses the same underlying WorkspaceMembersList as the settings page.
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { WorkspaceMembersList } from './WorkspaceMembersList';

interface WorkspaceMembersModalProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkspaceMembersModal({ workspaceId, open, onOpenChange }: WorkspaceMembersModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Workspace Members</DialogTitle>
          <DialogDescription>
            Manage roles, invites, and access at the workspace level.
          </DialogDescription>
        </DialogHeader>
        <WorkspaceMembersList workspaceId={workspaceId} />
      </DialogContent>
    </Dialog>
  );
}


