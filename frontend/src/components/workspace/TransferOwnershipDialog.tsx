/**
 * Transfer Ownership Dialog
 * ========================
 *
 * Owner-only destructive operation (workspace-level).
 * Backend is authoritative and performs the atomic role swap + workspace.owner_id update.
 */

import React, { useMemo, useState } from 'react';
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
import { AlertTriangle } from 'lucide-react';
import { useWorkspaceMembers, useTransferOwnership } from '@/hooks/useWorkspaceMembers';
import { useAuth } from '@/hooks/useAuth';

interface TransferOwnershipDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferOwnershipDialog({ workspaceId, open, onOpenChange }: TransferOwnershipDialogProps) {
  const { user } = useAuth();
  const { data: membersData, isLoading } = useWorkspaceMembers(workspaceId);
  const transfer = useTransferOwnership(workspaceId);
  const [newOwnerId, setNewOwnerId] = useState<string>('');
  const [confirmText, setConfirmText] = useState<string>('');

  const eligibleMembers = useMemo(() => {
    const members = membersData?.data || [];
    return members
      .filter(m => m.status === 'active')
      .filter(m => m.user_id !== user?.id)
      .filter(m => m.role !== 'owner');
  }, [membersData, user?.id]);

  const canSubmit = newOwnerId && confirmText.trim().toLowerCase() === 'transfer';

  const handleTransfer = async () => {
    if (!canSubmit) return;
    await transfer.mutateAsync({
      new_owner_id: newOwnerId,
      demote_current_owner_to: 'admin',
    });
    setNewOwnerId('');
    setConfirmText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Transfer Workspace Ownership
          </DialogTitle>
          <DialogDescription>
            This is a destructive operation. The selected member will become <strong>Owner</strong>.
            You will be demoted to <strong>Admin</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>New Owner</Label>
            <Select value={newOwnerId} onValueChange={setNewOwnerId} disabled={isLoading || eligibleMembers.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={eligibleMembers.length === 0 ? 'No eligible members' : 'Select a member'} />
              </SelectTrigger>
              <SelectContent>
                {eligibleMembers.map(m => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {(m.full_name || m.username || m.email || m.user_id).toString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only existing workspace members can become owner.
            </p>
          </div>

          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-3">
            <div className="text-sm font-medium text-red-700 dark:text-red-300">Confirmation</div>
            <div className="text-xs text-muted-foreground mt-1">
              Type <strong>transfer</strong> to confirm ownership transfer.
            </div>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="transfer"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!canSubmit || transfer.isPending}
            onClick={handleTransfer}
          >
            {transfer.isPending ? 'Transferring…' : 'Transfer Ownership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


