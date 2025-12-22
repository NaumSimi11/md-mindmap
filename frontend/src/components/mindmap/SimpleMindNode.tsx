/**
 * SimpleMindNode - Lightweight, performant React Flow node
 * Alternative style option - simpler design, better performance
 * Maintains all functionality of Studio2MindNode
 */

import { memo, useState } from 'react';
import { Handle, Position, NodeProps, NodeToolbar } from '@xyflow/react';
import { Plus, Edit2, Trash2, Sparkles } from 'lucide-react';
import { Icon } from '@iconify/react';

export interface SimpleNodeData {
  label: string;
  description?: string;
  status?: string;
  priority?: string;
  color?: string; // Hex color or color name
  shape?: string; // Node shape: 'rounded-full', 'rounded-2xl', 'rounded', 'rounded-none', 'diamond', 'hexagon'
  statusIcon?: string; // Iconify icon ID (e.g., 'tabler:check', 'mdi:check-circle')
  showStatusIcon?: boolean; // Show/hide status icon
  onAddChild?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  onAIEnhance?: (nodeId: string) => void;
  onLabelChange?: (nodeId: string, newLabel: string) => void;
}

// Color conversion helper
const colorMap: Record<string, string> = {
  indigo: '#6366f1',
  blue: '#3b82f6',
  purple: '#9333ea',
  pink: '#ec4899',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  teal: '#14b8a6',
};

function convertColor(color?: string): string {
  if (!color) return '#6366f1';
  if (color.startsWith('#')) return color;
  return colorMap[color.toLowerCase()] || '#6366f1';
}

function SimpleMindNode({ data, id, selected }: NodeProps<SimpleNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const nodeColor = convertColor(data.color);
  const nodeShape = data.shape || 'rounded-full';
  
  // Shape handling
  const isDiamond = nodeShape === 'diamond';
  const isHexagon = nodeShape === 'hexagon';
  
  // Get border radius class
  const getBorderRadius = () => {
    if (isDiamond || isHexagon) return '0';
    switch (nodeShape) {
      case 'rounded-full': return '9999px';
      case 'rounded-2xl': return '16px';
      case 'rounded': return '8px';
      case 'rounded-none': return '0';
      default: return '8px';
    }
  };
  
  // Calculate text color based on background brightness
  const getTextColor = (bgColor: string) => {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#1f2937' : '#ffffff';
  };

  const textColor = getTextColor(nodeColor);

  const handleLabelDoubleClick = (e: React.MouseEvent) => {
    // Stop propagation only for label text - let node double-click work for sidebar
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (label !== data.label) {
      data.onLabelChange?.(id, label);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setLabel(data.label);
      setIsEditing(false);
    }
  };

  return (
    <>
      {/* Built-in NodeToolbar */}
      <NodeToolbar isVisible={selected} position={Position.Top} offset={10}>
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: 'white',
            padding: '4px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onAddChild?.(id);
            }}
            style={{
              padding: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Add Child"
          >
            <Plus size={14} color="#374151" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            style={{
              padding: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Edit"
          >
            <Edit2 size={14} color="#374151" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onAIEnhance?.(id);
            }}
            style={{
              padding: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="AI Enhance"
          >
            <Sparkles size={14} color="#9333ea" />
          </button>
          <div
            style={{
              width: '1px',
              height: '20px',
              background: '#e5e7eb',
              margin: '0 2px',
            }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete?.(id);
            }}
            style={{
              padding: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Delete"
          >
            <Trash2 size={14} color="#dc2626" />
          </button>
        </div>
      </NodeToolbar>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '10px',
          height: '10px',
          background: '#10b981',
          border: '2px solid white',
        }}
      />

      {/* Node Content */}
      <div
        style={{
          padding: '12px 16px',
          background: nodeColor,
          color: textColor,
          borderRadius: getBorderRadius(),
          minWidth: '100px',
          maxWidth: '200px',
          border: selected ? '2px solid #3b82f6' : '2px solid transparent',
          boxShadow: selected
            ? '0 4px 12px rgba(0,0,0,0.15)'
            : '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          position: 'relative',
          ...(isDiamond && {
            transform: 'rotate(45deg)',
            width: '100px',
            height: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
          }),
          ...(isHexagon && {
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
            minWidth: '140px',
          }),
        }}
        // Don't add onDoubleClick here - let React Flow's onNodeDoubleClick handle it
        // This allows double-click on node to open sidebar
      >
        {isEditing ? (
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: textColor,
              border: 'none',
              outline: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              width: '100%',
              fontSize: '14px',
              fontWeight: 600,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="nodrag nopan"
          />
        ) : (
          <div
            style={{
              fontWeight: 600,
              fontSize: '14px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              ...(isDiamond ? { transform: 'rotate(-45deg)' } : {}),
            }}
            title={data.label}
            onDoubleClick={handleLabelDoubleClick}
          >
            {data.label}
          </div>
        )}

        {/* Description indicator */}
        {data.description && (
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '16px',
              height: '16px',
              background: '#fbbf24',
              borderRadius: '50%',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
            }}
          >
            📝
          </div>
        )}

        {/* Status indicator - Configurable icon */}
        {data.status && data.showStatusIcon !== false && (
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              left: '-8px',
              width: '20px',
              height: '20px',
              background: '#10b981',
              borderRadius: '50%',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            {data.statusIcon ? (
              <Icon 
                icon={data.statusIcon} 
                width={12} 
                height={12} 
                color="white"
              />
            ) : (
              <span style={{ fontSize: '10px', color: 'white' }}>✓</span>
            )}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '10px',
          height: '10px',
          background: '#6366f1',
          border: '2px solid white',
        }}
      />
    </>
  );
}

export default memo(SimpleMindNode);
