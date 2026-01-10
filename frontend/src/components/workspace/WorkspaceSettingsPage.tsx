/**
 * Workspace Settings Page
 * =======================
 * 
 * Full-page workspace settings with tabs:
 * - General: Name, description, icon (available to all)
 * - Members: List, invite, remove, change role (cloud only)
 * - Permissions: Default access model (cloud only)
 * - Danger Zone: Delete workspace (available to all)
 * 
 * Works for both authenticated and guest users:
 * - Guest users see General + Danger Zone with upgrade prompts
 * - Authenticated users see all tabs
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Settings, 
  Shield, 
  AlertTriangle,
  Sparkles,
  Crown,
  Lock,
  Save,
  Loader2,
  Trash2,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaceData } from '@/contexts/workspace/WorkspaceDataContext';
import { useWorkspacePermissions } from '@/hooks/useWorkspacePermissions';
import { WorkspaceMembersList } from './WorkspaceMembersList';
import { Skeleton } from '@/components/ui/skeleton';
import { TransferOwnershipDialog } from './TransferOwnershipDialog';
import { WorkspaceDownloadTab } from './WorkspaceDownloadTab';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Emoji picker options for workspace icon
const WORKSPACE_EMOJIS = [
  '📁', '📂', '💼', '🏠', '🏢', '🎯', '🚀', '💡', 
  '📚', '✏️', '📝', '💻', '🎨', '🔧', '⚡', '🌟',
  '🔥', '💎', '🎪', '🎭', '🎬', '📊', '📈', '🗂️'
];

export function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { currentWorkspace, workspaces, updateWorkspace, deleteWorkspace } = useWorkspaceData();
  const permissions = useWorkspacePermissions(workspaceId);
  
  const [activeTab, setActiveTab] = useState('general');
  const [showTransferOwnership, setShowTransferOwnership] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceIcon, setWorkspaceIcon] = useState('📁');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Load current workspace data
  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceName(currentWorkspace.name || '');
      // Extract emoji from name if present, or use default
      const firstChar = currentWorkspace.name?.charAt(0) || '';
      if (/\p{Emoji}/u.test(firstChar)) {
        setWorkspaceIcon(firstChar);
      }
    }
  }, [currentWorkspace]);

  // Check if this is the last workspace (can't delete)
  const isLastWorkspace = workspaces.length <= 1;
  
  // Check if workspace is synced to cloud
  const isCloudWorkspace = currentWorkspace?.syncStatus === 'synced' || 
                           currentWorkspace?.syncStatus === 'cloud';

  // Handle save workspace settings
  const handleSaveGeneral = async () => {
    if (!workspaceId || !workspaceName.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    setSaving(true);
    try {
      await updateWorkspace(workspaceId, {
        name: workspaceName.trim(),
        // icon could be stored separately in metadata
      });
      toast.success('Workspace settings saved');
    } catch (error) {
      console.error('Failed to save workspace settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete workspace
  const handleDeleteWorkspace = async () => {
    if (!workspaceId || isLastWorkspace) return;

    setDeleting(true);
    try {
      await deleteWorkspace(workspaceId);
      toast.success('Workspace deleted');
      navigate('/workspace');
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      toast.error('Failed to delete workspace');
    } finally {
      setDeleting(false);
    }
  };

  // Loading state
  if (!currentWorkspace) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Permission check for authenticated users on cloud workspaces
  if (isAuthenticated && isCloudWorkspace && !permissions.isLoading && !permissions.canEditWorkspace) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/workspace')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{workspaceIcon}</div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Workspace Settings
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {currentWorkspace.name}
                  {!isAuthenticated && (
                    <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                      Local Only
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="download" className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </TabsTrigger>
            <TabsTrigger 
              value="members" 
              className="gap-2"
              disabled={!isAuthenticated}
            >
              <Users className="h-4 w-4" />
              Members
              {!isAuthenticated && <Lock className="h-3 w-3 ml-1 opacity-50" />}
            </TabsTrigger>
            <TabsTrigger 
              value="permissions" 
              className="gap-2"
              disabled={!isAuthenticated}
            >
              <Shield className="h-4 w-4" />
              Permissions
              {!isAuthenticated && <Lock className="h-3 w-3 ml-1 opacity-50" />}
            </TabsTrigger>
            <TabsTrigger value="danger" className="gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </TabsTrigger>
          </TabsList>

          {/* General Tab - Available to all */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Manage workspace name and appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Workspace Icon */}
                <div className="space-y-3">
                  <Label>Workspace Icon</Label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-4xl p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                    >
                      {workspaceIcon}
                    </button>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Click to change the workspace icon
                    </p>
                  </div>
                  
                  {showEmojiPicker && (
                    <div className="grid grid-cols-8 gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      {WORKSPACE_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setWorkspaceIcon(emoji);
                            setShowEmojiPicker(false);
                          }}
                          className={`text-2xl p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                            workspaceIcon === emoji ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Workspace Name */}
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="My Workspace"
                    className="max-w-md"
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveGeneral}
                    disabled={saving || !workspaceName.trim()}
                    className="gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sync Status Card for non-authenticated users */}
            {!isAuthenticated && (
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200/50 dark:border-blue-800/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Enable Cloud Sync</CardTitle>
                      <CardDescription>
                        Sign up to sync your workspace across devices
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Access your documents from anywhere
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Real-time collaboration with team members
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Automatic backups and version history
                    </li>
                  </ul>
                  <Button 
                    onClick={() => navigate('/signup')}
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Crown className="h-4 w-4" />
                    Sign Up Free
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Download Tab - Available to all */}
          <TabsContent value="download" className="space-y-4">
            <WorkspaceDownloadTab />
          </TabsContent>

          {/* Members Tab - Cloud only */}
          <TabsContent value="members" className="space-y-4">
            {isAuthenticated ? (
              workspaceId && <WorkspaceMembersList workspaceId={workspaceId} />
            ) : (
              <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full mb-4">
                    <Users className="h-12 w-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Invite Team Members</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                    Sign up to invite collaborators to your workspace and work together in real-time.
                  </p>
                  <Button 
                    onClick={() => navigate('/signup')}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <Crown className="h-4 w-4" />
                    Sign Up to Collaborate
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Permissions Tab - Cloud only */}
          <TabsContent value="permissions" className="space-y-4">
            {isAuthenticated ? (
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
            ) : (
              <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full mb-4">
                    <Shield className="h-12 w-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Manage Permissions</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                    Sign up to control who can view, edit, or share your documents.
                  </p>
                  <Button 
                    onClick={() => navigate('/signup')}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <Crown className="h-4 w-4" />
                    Sign Up for Permissions
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Danger Zone Tab - Available to all */}
          <TabsContent value="danger" className="space-y-4">
            <Card className="border-red-200 dark:border-red-900/50">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Destructive actions that cannot be undone
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Transfer Ownership - Cloud only */}
                {isAuthenticated && isCloudWorkspace && (
                  <div className="p-4 border border-red-200 dark:border-red-900/50 rounded-lg">
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
                )}

                {/* Delete Workspace */}
                <div className="p-4 border border-red-200 dark:border-red-900/50 rounded-lg">
                  <h3 className="font-semibold mb-2">Delete Workspace</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete this workspace and all its documents.
                    {isLastWorkspace && (
                      <span className="block mt-2 text-amber-600 dark:text-amber-400">
                        ⚠️ You cannot delete your last workspace. Create another workspace first.
                      </span>
                    )}
                  </p>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        disabled={isLastWorkspace || deleting}
                        className="gap-2"
                      >
                        {deleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete Workspace
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete <strong>{currentWorkspace.name}</strong> and all {' '}
                          documents inside it. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteWorkspace}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Workspace
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Transfer Ownership Dialog */}
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
