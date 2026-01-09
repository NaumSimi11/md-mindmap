/**
 * PresenceList Component - Production-Grade
 * 
 * Purpose: Display active users editing the document in real-time
 * 
 * Features:
 * - Real-time user presence tracking
 * - User avatars with initials
 * - User colors (consistent per user)
 * - Active indicator
 * - Tooltip with full name
 * - Compact design (top-right)
 * - Anonymous user support
 * - Overflow handling (show +N more)
 * 
 * Design: Minimal, professional, unobtrusive
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { WebsocketProvider } from 'y-websocket';
import * as awarenessProtocol from 'y-protocols/awareness';

interface User {
  clientId: number;
  name: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
  };
}

interface PresenceListProps {
  provider: WebsocketProvider | null;
  maxVisible?: number;
}

/**
 * Generate consistent color from string (username)
 */
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * PresenceList Component
 */
export const PresenceList: React.FC<PresenceListProps> = ({
  provider,
  maxVisible = 5,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  
  useEffect(() => {
    if (!provider) {
      setUsers([]);
      return;
    }
    
    const awareness = provider.awareness;
    
    const updateUsers = () => {
      const states = awareness.getStates();
      const activeUsers: User[] = [];
      
      states.forEach((state, clientId) => {
        // Skip if no user info
        if (!state.user) return;
        
        // Skip current user
        if (clientId === awareness.clientID) return;
        
        activeUsers.push({
          clientId,
          name: state.user.name || 'Anonymous',
          color: state.user.color || stringToColor(state.user.name || `user-${clientId}`),
          cursor: state.cursor,
        });
      });
      
      setUsers(activeUsers);
    };
    
    // Initial update
    updateUsers();
    
    // Listen for awareness changes
    awareness.on('change', updateUsers);
    
    return () => {
      awareness.off('change', updateUsers);
    };
  }, [provider]);
  
  const visibleUsers = useMemo(() => users.slice(0, maxVisible), [users, maxVisible]);
  const hiddenCount = users.length - visibleUsers.length;
  
  // 🔥 Show nothing when no other users - avatars are shown at cursor positions
  if (users.length === 0) {
    return null;
  }
  
  // 🔥 Compact presence indicator - just shows count
  // Avatars are now displayed at cursor positions in the document
  return (
    <div className="fixed top-16 right-4 z-40">
      <div 
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        title={users.map(u => u.name).join(', ')}
      >
        {/* Stacked mini avatars */}
        <div className="flex items-center -space-x-1.5">
          {visibleUsers.slice(0, 3).map((user) => (
            <div
              key={user.clientId}
              className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor: user.color }}
              title={user.name}
            >
              {getInitials(user.name)}
            </div>
          ))}
          {users.length > 3 && (
            <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-[10px] font-medium text-gray-700 dark:text-gray-200">
              +{users.length - 3}
            </div>
          )}
        </div>
        
        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {users.length} live
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * UserAvatar Component
 */
interface UserAvatarProps {
  user: User;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Avatar */}
      <div
        className="
          w-8 h-8 rounded-full
          border-2 border-white dark:border-gray-900
          flex items-center justify-center
          text-xs font-bold text-white
          shadow-sm
          cursor-pointer
          transition-transform hover:scale-110
        "
        style={{ backgroundColor: user.color }}
      >
        {getInitials(user.name)}
      </div>
      
      {/* Active Indicator */}
      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-50">
          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-1 rounded text-xs shadow-lg">
            {user.name}
          </div>
          {/* Arrow */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
            <div className="border-4 border-transparent border-b-gray-900 dark:border-b-gray-100" />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact Presence Badge (Alternative for tight spaces)
 */
interface PresenceBadgeProps {
  userCount: number;
}

export const PresenceBadge: React.FC<PresenceBadgeProps> = ({ userCount }) => {
  if (userCount === 0) return null;
  
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span>{userCount} editing</span>
    </div>
  );
};
