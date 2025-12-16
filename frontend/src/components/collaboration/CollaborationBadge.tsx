/**
 * CollaborationBadge
 * 
 * Shows who's currently viewing/editing a document
 * Displays in document item and workspace header
 */

import { Users, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface CollaboratorInfo {
  id: string;
  name: string;
  email?: string;
  color: string;
  isActive: boolean;
  lastSeen?: Date;
}

interface CollaborationBadgeProps {
  collaborators: CollaboratorInfo[];
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
  showCount?: boolean;
  className?: string;
}

export function CollaborationBadge({
  collaborators,
  size = 'sm',
  maxDisplay = 3,
  showCount = true,
  className = '',
}: CollaborationBadgeProps) {
  const activeCollaborators = collaborators.filter(c => c.isActive);
  const displayCollaborators = activeCollaborators.slice(0, maxDisplay);
  const remainingCount = activeCollaborators.length - displayCollaborators.length;

  if (activeCollaborators.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-5 w-5 text-[8px]',
    md: 'h-6 w-6 text-[10px]',
    lg: 'h-8 w-8 text-xs',
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-1 ${className}`}>
        {/* Avatars */}
        <div className="flex -space-x-2">
          {displayCollaborators.map((collaborator) => (
            <Tooltip key={collaborator.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar
                    className={`${sizeClasses[size]} border-2 border-background cursor-pointer hover:scale-110 transition-transform`}
                    style={{ backgroundColor: collaborator.color }}
                  >
                    <AvatarFallback
                      className="text-white font-semibold"
                      style={{ backgroundColor: collaborator.color }}
                    >
                      {getInitials(collaborator.name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Active indicator */}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background"
                    style={{ backgroundColor: '#10b981' }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <div className="space-y-1">
                  <div className="font-semibold">{collaborator.name}</div>
                  {collaborator.email && (
                    <div className="text-muted-foreground text-[10px]">
                      {collaborator.email}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-green-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px]">Active now</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Remaining count */}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`${sizeClasses[size]} rounded-full bg-muted border-2 border-background flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`}
                >
                  <span className="text-muted-foreground font-semibold">
                    +{remainingCount}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {remainingCount} more {remainingCount === 1 ? 'person' : 'people'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Count badge */}
        {showCount && activeCollaborators.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{activeCollaborators.length}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Single collaborator indicator (for compact spaces)
 */
interface SingleCollaboratorBadgeProps {
  count: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function SingleCollaboratorBadge({
  count,
  size = 'sm',
  className = '',
}: SingleCollaboratorBadgeProps) {
  if (count === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-4 w-4 text-[9px]',
    md: 'h-5 w-5 text-[10px]',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`${sizeClasses[size]} rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center ${className}`}
          >
            <span className="text-green-600 dark:text-green-400 font-semibold">
              {count}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {count} {count === 1 ? 'person' : 'people'} viewing
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

