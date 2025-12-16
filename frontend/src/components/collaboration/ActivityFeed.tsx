/**
 * ActivityFeed
 * 
 * Shows recent collaboration activity
 * - User joined/left
 * - Document created/edited
 * - Comments added
 */

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  UserPlus,
  UserMinus,
  FileEdit,
  FilePlus,
  MessageSquare,
  Clock,
} from 'lucide-react';
// Removed date-fns dependency - using native formatters

export interface ActivityEvent {
  id: string;
  type: 'user_joined' | 'user_left' | 'document_created' | 'document_edited' | 'comment_added';
  userId: string;
  userName: string;
  userColor: string;
  documentId?: string;
  documentTitle?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
  maxEvents?: number;
  onClear?: () => void;
  className?: string;
}

export function ActivityFeed({
  events,
  maxEvents = 50,
  onClear,
  className = '',
}: ActivityFeedProps) {
  const [displayEvents, setDisplayEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    // Sort by timestamp (newest first) and limit
    const sorted = [...events]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, maxEvents);
    setDisplayEvents(sorted);
  }, [events, maxEvents]);

  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'user_joined':
        return <UserPlus className="h-3.5 w-3.5 text-green-500" />;
      case 'user_left':
        return <UserMinus className="h-3.5 w-3.5 text-gray-500" />;
      case 'document_created':
        return <FilePlus className="h-3.5 w-3.5 text-blue-500" />;
      case 'document_edited':
        return <FileEdit className="h-3.5 w-3.5 text-purple-500" />;
      case 'comment_added':
        return <MessageSquare className="h-3.5 w-3.5 text-orange-500" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-gray-500" />;
    }
  };

  const getEventMessage = (event: ActivityEvent): string => {
    switch (event.type) {
      case 'user_joined':
        return 'joined the workspace';
      case 'user_left':
        return 'left the workspace';
      case 'document_created':
        return `created "${event.documentTitle}"`;
      case 'document_edited':
        return `edited "${event.documentTitle}"`;
      case 'comment_added':
        return `commented on "${event.documentTitle}"`;
      default:
        return 'performed an action';
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Activity</h3>
        </div>
        {onClear && displayEvents.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Feed */}
      {displayEvents.length > 0 ? (
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {displayEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                {/* User Avatar */}
                <Avatar
                  className="h-8 w-8 border-2 border-background flex-shrink-0"
                  style={{ backgroundColor: event.userColor }}
                >
                  <AvatarFallback
                    className="text-white font-semibold text-xs"
                    style={{ backgroundColor: event.userColor }}
                  >
                    {getInitials(event.userName)}
                  </AvatarFallback>
                </Avatar>

                {/* Event Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {event.userName}
                    </span>
                    <span className="flex-shrink-0">
                      {getEventIcon(event.type)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getEventMessage(event)}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatTimeAgo(event.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-12 text-sm text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No recent activity</p>
        </div>
      )}
    </div>
  );
}

