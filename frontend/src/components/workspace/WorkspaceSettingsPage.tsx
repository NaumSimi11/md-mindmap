/**
 * Workspace Settings Page
 * =======================
 * 
 * Full-page workspace settings with tabs:
 * - General: Name, slug, description, icon
 * - Members: List, invite, remove, change role
 * - Permissions: Default access model
 * - Danger Zone: Delete workspace, transfer ownership
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Settings, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useWorkspacePermissions } from '@/hooks/useWorkspacePermissions';
import { WorkspaceMembersList } from './WorkspaceMembersList';
import { Skeleton } from '@/components/ui/skeleton';
import { TransferOwnershipDialog } from './TransferOwnershipDialog';

export function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const permissions = useWorkspacePermissions(workspaceId);
  const [activeTab, setActiveTab] = useState('members');
  const [showTransferOwnership, setShowTransferOwnership] = useState(false);

  // Permission check
  if (!permissions.isLoading && !permissions.canEditWorkspace) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access workspace settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (permissions.isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Workspace Settings</h1>
            <p className="text-sm text-muted-foreground">
              {currentWorkspace?.name || 'Loading...'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="danger" className="text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage workspace name, description, and icon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coming soon: Workspace name, slug, description, and icon editing
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          {workspaceId && <WorkspaceMembersList workspaceId={workspaceId} />}
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Permissions</CardTitle>
              <CardDescription>
                Configure default access model for new documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coming soon: Default access model configuration
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="space-y-4">
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
              <CardDescription>
                Destructive actions that cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-red-200 dark:border-red-900 rounded-lg">
                <h3 className="font-semibold mb-2">Transfer Ownership</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Transfer workspace ownership to another member.
                </p>
                <Button
                  variant="destructive"
                  disabled={!permissions.canTransferOwnership}
                  onClick={() => setShowTransferOwnership(true)}
                >
                  Transfer Ownership
                </Button>
              </div>

              <div className="p-4 border border-red-200 dark:border-red-900 rounded-lg">
                <h3 className="font-semibold mb-2">Delete Workspace</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete this workspace and all its documents.
                </p>
                <Button variant="destructive" disabled={!permissions.canDeleteWorkspace}>
                  Delete Workspace
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {workspaceId && (
        <TransferOwnershipDialog
          workspaceId={workspaceId}
          open={showTransferOwnership}
          onOpenChange={setShowTransferOwnership}
        />
      )}
    </div>
  );
}

