/**
 * CollaborationPanel
 * 
 * Sidebar panel showing:
 * - Active collaborators
 * - Activity feed
 * - Presence information
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Activity, Info } from 'lucide-react';
import type { CollaboratorInfo } from './CollaborationBadge';
import { ActivityFeed, type ActivityEvent } from './ActivityFeed';
import { Button } from '@/components/ui/button';

interface CollaborationPanelProps {
  collaborators: CollaboratorInfo[];
  activityEvents: ActivityEvent[];
  currentDocumentTitle?: string;
  onClearActivity?: () => void;
  className?: string;
}

export function CollaborationPanel({
  collaborators,
  activityEvents,
  currentDocumentTitle,
  onClearActivity,
  className = '',
}: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('collaborators');

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const activeCollaborators = collaborators.filter(c => c.isActive);
  const inactiveCollaborators = collaborators.filter(c => !c.isActive);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="collaborators" className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span>People</span>
            {activeCollaborators.length > 0 && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                {activeCollaborators.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" />
            <span>Activity</span>
            {activityEvents.length > 0 && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                {activityEvents.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Collaborators Tab */}
        <TabsContent value="collaborators" className="flex-1 mt-4 data-[state=inactive]:hidden">
          <div className="space-y-4">
            {/* Current Document Info */}
            {currentDocumentTitle && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Info className="h-3 w-3" />
                  <span>Viewing</span>
                </div>
                <div className="font-medium text-sm truncate">
                  {currentDocumentTitle}
                </div>
              </div>
            )}

            {/* Active Collaborators */}
            {activeCollaborators.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Active Now ({activeCollaborators.length})
                </h4>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {activeCollaborators.map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="relative">
                          <Avatar
                            className="h-9 w-9 border-2 border-background"
                            style={{ backgroundColor: collaborator.color }}
                          >
                            <AvatarFallback
                              className="text-white font-semibold text-xs"
                              style={{ backgroundColor: collaborator.color }}
                            >
                              {getInitials(collaborator.name)}
                            </AvatarFallback>
                          </Avatar>
                          {/* Active indicator */}
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {collaborator.name}
                          </div>
                          {collaborator.email && (
                            <div className="text-xs text-muted-foreground truncate">
                              {collaborator.email}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span>Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Inactive Collaborators */}
            {inactiveCollaborators.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Recently Left ({inactiveCollaborators.length})
                </h4>
                <div className="space-y-2">
                  {inactiveCollaborators.slice(0, 5).map((collaborator) => (
                    <div
                      key={collaborator.id}
                      className="flex items-center gap-3 p-2 rounded-lg opacity-50"
                    >
                      <Avatar
                        className="h-8 w-8 border-2 border-background"
                        style={{ backgroundColor: collaborator.color }}
                      >
                        <AvatarFallback
                          className="text-white font-semibold text-xs"
                          style={{ backgroundColor: collaborator.color }}
                        >
                          {getInitials(collaborator.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {collaborator.name}
                        </div>
                        {collaborator.lastSeen && (
                          <div className="text-xs text-muted-foreground">
                            Left {formatTimeAgo(collaborator.lastSeen)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Collaborators */}
            {collaborators.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium mb-1">No collaborators</p>
                <p className="text-xs">
                  Invite others to collaborate on this document
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="flex-1 mt-4 data-[state=inactive]:hidden">
          <ActivityFeed
            events={activityEvents}
            onClear={onClearActivity}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

