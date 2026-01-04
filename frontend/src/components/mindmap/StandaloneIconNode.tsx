/**
 * StandaloneIconNode - Pure icon without wrapper box
 * Perfect for logos, tech stack icons, decorative elements
 * No border, no title, just the beautiful icon itself
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Icon } from '@iconify/react';

export interface StandaloneIconNodeData {
  icon: string; // Iconify icon ID (e.g., 'simple-icons:docker', 'logos:react')
  color?: string; // Custom color (optional, defaults to icon's native color)
  size?: number; // Icon size in pixels (default: 48)
  title?: string; // Tooltip text (not displayed, just for accessibility)
}

function StandaloneIconNodeComponent({ data, selected }: NodeProps<StandaloneIconNodeData>) {
  const iconSize = data.size || 48;
  const iconColor = data.color || undefined; // undefined = use icon's native colors

  return (
    <div
      className="relative group cursor-move"
      style={{
        width: iconSize,
        height: iconSize,
      }}
      title={data.title || data.icon}
    >
      {/* Invisible handles for connections - only visible on hover/select */}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: '#6366f1',
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />

      {/* The Icon - Pure and Clean */}
      <Icon
        icon={data.icon}
        width={iconSize}
        height={iconSize}
        color={iconColor}
        className="transition-all duration-200"
        style={{
          filter: selected
            ? 'drop-shadow(0 0 12px rgba(99, 102, 241, 0.8)) drop-shadow(0 0 24px rgba(99, 102, 241, 0.4))'
            : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
          transform: selected ? 'scale(1.1)' : 'scale(1)',
        }}
      />

      {/* Selection ring - subtle indicator */}
      {selected && (
        <div
          className="absolute inset-0 rounded-full border-2 border-indigo-500 animate-pulse"
          style={{
            width: iconSize + 8,
            height: iconSize + 8,
            left: -4,
            top: -4,
          }}
        />
      )}

      {/* Invisible handles for connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: '#6366f1',
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: '#6366f1',
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: '#6366f1',
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />
    </div>
  );
}

export const StandaloneIconNode = memo(StandaloneIconNodeComponent);
export default StandaloneIconNode;

