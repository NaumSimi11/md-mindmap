/**
 * Workspace Members List
 * ======================
 * 
 * Displays workspace members with:
 * - Member info (name, email, role)
 * - Role badges with icons
 * - Actions dropdown (change role, remove)
 * - Invite button
 */

import React, { useState } from 'react';
import { Crown, Shield, Edit, Eye, MoreVertical, UserMinus, UserCog } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaceMembers, useRemoveWorkspaceMember } from '@/hooks/useWorkspaceMembers';
import { useWorkspacePermissions, getRoleInfo } from '@/hooks/useWorkspacePermissions';
import { useAuth } from '@/hooks/useAuth';
import { InviteMemberDialog } from './InviteMemberDialog';
import { ChangeMemberRoleDialog } from './ChangeMemberRoleDialog';
import type { WorkspaceMember } from '@/services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface WorkspaceMembersListProps {
  workspaceId: string;
}

export function WorkspaceMembersList({ workspaceId }: WorkspaceMembersListProps) {
  const { user } = useAuth();
  const { data: membersData, isLoading } = useWorkspaceMembers(workspaceId);
  const permissions = useWorkspacePermissions(workspaceId);
  const removeMember = useRemoveWorkspaceMember(workspaceId);

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [memberToChangeRole, setMemberToChangeRole] = useState<WorkspaceMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null);

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    await removeMember.mutateAsync(memberToRemove.user_id);
    setMemberToRemove(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const members = membersData?.data || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Manage who has access to this workspace
              </CardDescription>
            </div>
            {permissions.canManageMembers && (
              <Button onClick={() => setShowInviteDialog(true)}>
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => {
              const roleInfo = getRoleInfo(member.role);
              const isCurrentUser = member.user_id === user?.id;
              const canModify = permissions.canManageMembers && !isCurrentUser && member.role !== 'owner';

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Avatar */}
                  <Avatar>
                    <AvatarFallback>
                      {(member.full_name || member.username || member.email || '?')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {member.full_name || member.username}
                        {isCurrentUser && <span className="text-muted-foreground ml-1">(you)</span>}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.email}
                    </p>
                  </div>

                  {/* Role Badge */}
                  <Badge className={`${roleInfo.bgColor} ${roleInfo.color} border-none`}>
                    <span className="mr-1">{roleInfo.icon}</span>
                    {roleInfo.label}
                  </Badge>

                  {/* Actions Dropdown */}
                  {canModify && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {permissions.canChangeRoles && (
                          <DropdownMenuItem onClick={() => setMemberToChangeRole(member)}>
                            <UserCog className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                        )}
                        {permissions.canRemoveMembers && (
                          <DropdownMenuItem
                            onClick={() => setMemberToRemove(member)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}

            {members.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No members found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showInviteDialog && (
        <InviteMemberDialog
          workspaceId={workspaceId}
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
        />
      )}

      {memberToChangeRole && (
        <ChangeMemberRoleDialog
          workspaceId={workspaceId}
          member={memberToChangeRole}
          open={!!memberToChangeRole}
          onOpenChange={(open) => !open && setMemberToChangeRole(null)}
        />
      )}

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberToRemove?.full_name || memberToRemove?.username}</strong> from this workspace?
              They will lose access to all documents in this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

