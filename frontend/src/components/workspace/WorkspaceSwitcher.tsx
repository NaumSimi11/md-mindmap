/**
 * WorkspaceSwitcher - Dropdown to switch between workspaces
 */

import { Check, ChevronDown, Plus, Settings, Edit, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { Workspace } from '@/services/workspace-legacy/BackendWorkspaceService';
import type { WorkspaceRole } from '@/services/api/workspaceMembersClient';
import { getRoleInfo } from '@/hooks/useWorkspacePermissions';

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  onSwitch: (workspace: Workspace) => void;
  onCreate: () => void;
  onRename?: () => void;
  onSettings?: () => void;
  onMembers?: () => void;
  rolesByWorkspaceId?: Record<string, WorkspaceRole>;
}

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspace,
  onSwitch,
  onCreate,
  onRename,
  onSettings,
  onMembers,
  rolesByWorkspaceId,
}: WorkspaceSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 hover:bg-accent px-3 h-10"
          data-testid="workspace-switcher-trigger"
        >
          <span className="text-xl">{currentWorkspace.icon}</span>
          <span className="font-semibold max-w-[200px] truncate" data-testid="current-workspace-name">
            {currentWorkspace.name}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          My Workspaces
        </DropdownMenuLabel>

        {/* Workspace List */}
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            data-testid={`workspace-item-${workspace.slug || workspace.id}`}
            onClick={() => {
              if (workspace.id !== currentWorkspace.id) {
                onSwitch(workspace);
              }
            }}
            className="flex items-center gap-3 py-2 cursor-pointer"
          >
            <span className="text-xl">{workspace.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{workspace.name}</div>
              {workspace.description && (
                <div className="text-xs text-muted-foreground truncate">
                  {workspace.description}
                </div>
              )}
            </div>
            {rolesByWorkspaceId?.[workspace.id] && (
              <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                {getRoleInfo(rolesByWorkspaceId[workspace.id]).label}
              </span>
            )}
            {workspace.id === currentWorkspace.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Actions */}
        {onMembers && (
          <DropdownMenuItem onClick={onMembers} className="cursor-pointer">
            <Users className="h-4 w-4 mr-2" />
            Members
          </DropdownMenuItem>
        )}

        {onRename && (
          <DropdownMenuItem onClick={onRename} className="cursor-pointer">
            <Edit className="h-4 w-4 mr-2" />
            Rename Workspace
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={onCreate} className="cursor-pointer" data-testid="create-workspace-button">
          <Plus className="h-4 w-4 mr-2" />
          Create Workspace
        </DropdownMenuItem>

        {onSettings && (
          <DropdownMenuItem onClick={onSettings} className="cursor-pointer">
            <Settings className="h-4 w-4 mr-2" />
            Workspace Settings
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

