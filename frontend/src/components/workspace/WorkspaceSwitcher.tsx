/**
 * WorkspaceSwitcher - Dropdown to switch between workspaces
 */

import { Check, ChevronDown, Plus, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { Workspace } from '@/services/workspace/BackendWorkspaceService';

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  onSwitch: (workspace: Workspace) => void;
  onCreate: () => void;
  onSettings?: () => void;
}

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspace,
  onSwitch,
  onCreate,
  onSettings,
}: WorkspaceSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 hover:bg-accent px-3 h-10"
        >
          <span className="text-xl">{currentWorkspace.icon}</span>
          <span className="font-semibold max-w-[200px] truncate">
            {currentWorkspace.name}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Workspaces
        </DropdownMenuLabel>

        {/* Workspace List */}
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
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
            {workspace.id === currentWorkspace.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Actions */}
        <DropdownMenuItem onClick={onCreate} className="cursor-pointer">
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

