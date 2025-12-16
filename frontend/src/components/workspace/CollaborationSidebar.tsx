/**
 * CollaborationSidebar
 * 
 * Right sidebar showing collaboration features
 * - Active collaborators
 * - Activity feed
 * - Document info
 */

import { useState } from 'react';
import { X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import type { CollaboratorInfo } from '@/components/collaboration/CollaborationBadge';
import type { ActivityEvent } from '@/components/collaboration/ActivityFeed';

interface CollaborationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: CollaboratorInfo[];
  activityEvents: ActivityEvent[];
  currentDocumentTitle?: string;
  onClearActivity?: () => void;
}

export function CollaborationSidebar({
  isOpen,
  onClose,
  collaborators,
  activityEvents,
  currentDocumentTitle,
  onClearActivity,
}: CollaborationSidebarProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-background border-l z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Collaboration</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4">
          <CollaborationPanel
            collaborators={collaborators}
            activityEvents={activityEvents}
            currentDocumentTitle={currentDocumentTitle}
            onClearActivity={onClearActivity}
          />
        </div>
      </div>
    </>
  );
}

