/**
 * Share Modal
 * ============
 * 
 * Main sharing UI with 3 tabs:
 * - Members: View/manage members and roles
 * - Invites: Invite users by email
 * - Links: Create/manage share links
 * 
 * Backend is authoritative for all permissions.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { SharesClient, type Member, type Invitation, type ShareLink, type Role } from '@/services/api/sharesClient';
import { useDocumentPermissions } from '@/hooks/useDocumentPermissions';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, Link2, Trash2, Copy, Check, AlertCircle, Crown, Shield, Edit, MessageSquare, Eye, Lock } from 'lucide-react';
import { documentService } from '@/services/api';

interface ShareModalProps {
  documentId: string;
  userRole: Role;
  isAuthenticated: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  documentId,
  userRole,
  isAuthenticated,
  isOpen,
  onClose,
}) => {
  const permissions = useDocumentPermissions(userRole, isAuthenticated);
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [accessModel, setAccessModel] = useState<'inherited' | 'restricted' | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && documentId) {
      loadData();
    }
  }, [isOpen, documentId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 🔥 FIX: First verify document exists
      const doc = isAuthenticated ? await documentService.getDocument(documentId) : null;
      
      if (!doc) {
        setError('Document not found');
        setLoading(false);
        return;
      }
      
      // Document exists, fetch members and links
      const [membersData, linksData] = await Promise.all([
        SharesClient.listMembers(documentId),
        SharesClient.listShareLinks(documentId),
      ]);
      
      setMembers(membersData.members);
      setInvitations(membersData.pending_invites);
      setShareLinks(linksData.links);
      setAccessModel((doc as any)?.access_model || null);
    } catch (err) {
      const errorMessage = (err as any)?.response?.status === 404 
        ? 'Document not found' 
        : (err as Error).message;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const pendingInvitesCount = invitations.filter(i => i.status === 'pending').length;
  const activeLinksCount = shareLinks.filter(l => !l.revoked_at).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Manage document sharing, members, and access links
          </DialogDescription>
        </DialogHeader>

        {/* Access Model Banner */}
        {accessModel && (
          <div className={`rounded-md border p-3 text-sm ${
            accessModel === 'restricted'
              ? 'border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20'
              : 'border-border bg-muted/30'
          }`}>
            {accessModel === 'restricted' ? (
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 mt-0.5 text-amber-700 dark:text-amber-300" />
                <div>
                  <div className="font-medium">Restricted document</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    Workspace membership does not apply. Only people with explicit shares (or the creator) can access.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Inherited from workspace</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    Workspace roles apply. Direct shares can additionally grant higher access.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-2" />
              Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="invites">
              <Mail className="w-4 h-4 mr-2" />
              Invites ({pendingInvitesCount})
            </TabsTrigger>
            <TabsTrigger value="links">
              <Link2 className="w-4 h-4 mr-2" />
              Links ({activeLinksCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-4">
            <MembersTab
              members={members}
              documentId={documentId}
              permissions={permissions}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="invites" className="mt-4">
            <InvitesTab
              invitations={invitations}
              documentId={documentId}
              permissions={permissions}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="links" className="mt-4">
            <LinksTab
              shareLinks={shareLinks}
              documentId={documentId}
              permissions={permissions}
              onRefresh={loadData}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// Members Tab
// ============================================================================

interface MembersTabProps {
  members: Member[];
  documentId: string;
  permissions: ReturnType<typeof useDocumentPermissions>;
  onRefresh: () => void;
}

const MembersTab: React.FC<MembersTabProps> = ({
  members,
  documentId,
  permissions,
  onRefresh,
}) => {
  const { toast } = useToast();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  const handleRemoveMember = async (memberId: string) => {
    try {
      await SharesClient.removeMember(documentId, memberId);
      toast({ title: 'Member Removed', description: 'Member has been removed from document' });
      onRefresh();
    } catch (err) {
      toast({
        title: 'Remove Failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: Role) => {
    try {
      await SharesClient.changeMemberRole(documentId, memberId, newRole);
      toast({ title: 'Role Changed', description: `Member role updated to ${newRole}` });
      onRefresh();
    } catch (err) {
      toast({
        title: 'Role Change Failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'editor': return <Edit className="w-4 h-4" />;
      case 'commenter': return <MessageSquare className="w-4 h-4" />;
      case 'viewer': return <Eye className="w-4 h-4" />;
    }
  };

  return (
    <>
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {members.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No members yet
            </div>
          )}

          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  {member.user_name || (member.principal_type === 'workspace' ? 'Workspace access' : 'Unknown')}
                  <Badge variant="outline" className="text-[10px]">
                    {member.principal_type === 'workspace' ? 'via workspace' : 'direct share'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {member.user_email || (member.principal_type === 'workspace' ? 'Inherited from workspace membership' : '')}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {permissions.canManageMembers && member.role !== 'owner' ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleChangeRole(member.id, value as Role)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="commenter">Commenter</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(member.role)}
                      {member.role}
                    </div>
                  </Badge>
                )}

                {permissions.canManageMembers && member.role !== 'owner' && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setRemovingId(member.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {removingId && (
        <AlertDialog open onOpenChange={() => setRemovingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Member?</AlertDialogTitle>
              <AlertDialogDescription>
                This member will lose access to the document.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleRemoveMember(removingId)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

// ============================================================================
// Invites Tab
// ============================================================================

interface InvitesTabProps {
  invitations: Invitation[];
  documentId: string;
  permissions: ReturnType<typeof useDocumentPermissions>;
  onRefresh: () => void;
}

const InvitesTab: React.FC<InvitesTabProps> = ({
  invitations,
  documentId,
  permissions,
  onRefresh,
}) => {
  const { toast } = useToast();
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState<Role>('editor');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
    
    if (emailList.length === 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter at least one email address',
        variant: 'destructive',
      });
      return;
    }

    setInviting(true);
    
    try {
      const result = await SharesClient.inviteUsers(documentId, emailList, role);
      
      toast({
        title: 'Invitations Sent',
        description: `Invited ${result.invited.length} user(s)`,
      });
      
      setEmails('');
      onRefresh();
    } catch (err) {
      toast({
        title: 'Invite Failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  const pendingInvites = invitations.filter(i => i.status === 'pending');

  return (
    <div className="space-y-6">
      {permissions.canManageMembers && (
        <div className="space-y-4 p-4 border rounded-lg bg-accent/50">
          <div>
            <Label htmlFor="emails">Email Addresses (comma-separated)</Label>
            <Input
              id="emails"
              placeholder="user1@example.com, user2@example.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              disabled={inviting}
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="commenter">Commenter</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleInvite} disabled={inviting} className="w-full">
            {inviting ? 'Sending...' : 'Send Invitations'}
          </Button>
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium mb-3">Pending Invitations</h4>
        <ScrollArea className="h-[250px]">
          {pendingInvites.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No pending invitations
            </div>
          )}

          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{invite.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Invited {new Date(invite.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant="outline">{invite.role}</Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

// ============================================================================
// Links Tab
// ============================================================================

interface LinksTabProps {
  shareLinks: ShareLink[];
  documentId: string;
  permissions: ReturnType<typeof useDocumentPermissions>;
  onRefresh: () => void;
}

const LinksTab: React.FC<LinksTabProps> = ({
  shareLinks,
  documentId,
  permissions,
  onRefresh,
}) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'view' | 'comment' | 'edit'>('view');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleCreateLink = async () => {
    setCreating(true);
    
    try {
      const link = await SharesClient.createShareLink(documentId, mode);
      toast({ title: 'Link Created', description: 'Share link created successfully' });
      onRefresh();
    } catch (err) {
      toast({
        title: 'Create Failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = (token: string, linkId: string) => {
    const url = `${window.location.origin}/share?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    toast({ title: 'Link Copied', description: 'Share link copied to clipboard' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevokeLink = async (linkId: string) => {
    try {
      await SharesClient.revokeShareLink(documentId, linkId);
      toast({ title: 'Link Revoked', description: 'Share link has been revoked' });
      onRefresh();
    } catch (err) {
      toast({
        title: 'Revoke Failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setRevokingId(null);
    }
  };

  const activeLinks = shareLinks.filter(l => !l.revoked_at);

  return (
    <>
      <div className="space-y-6">
        {permissions.canCreateLinks && (
          <div className="space-y-4 p-4 border rounded-lg bg-accent/50">
            <div>
              <Label htmlFor="mode">Access Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                <SelectTrigger id="mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="comment">Comment</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCreateLink} disabled={creating} className="w-full">
              {creating ? 'Creating...' : 'Create Share Link'}
            </Button>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium mb-3">Active Links</h4>
          <ScrollArea className="h-[300px]">
            {activeLinks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No active share links
              </div>
            )}

            <div className="space-y-3">
              {activeLinks.map((link) => (
                <div
                  key={link.link_id}
                  className="p-3 border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge>{link.mode}</Badge>
                    <div className="text-xs text-muted-foreground">
                      {link.uses_count} {link.max_uses ? `/ ${link.max_uses}` : ''} uses
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLink(link.token, link.link_id)}
                      className="flex-1"
                    >
                      {copiedId === link.link_id ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>

                    {permissions.canCreateLinks && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRevokingId(link.link_id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {revokingId && (
        <AlertDialog open onOpenChange={() => setRevokingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke Share Link?</AlertDialogTitle>
              <AlertDialogDescription>
                This link will no longer provide access to the document.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleRevokeLink(revokingId)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Revoke
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

