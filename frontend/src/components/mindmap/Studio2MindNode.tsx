/**
 * Studio2MindNode - Custom React Flow node for Studio2
 * Beautiful, gradient-styled node with handles
 */

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Plus, Edit2, Trash2, Sparkles } from 'lucide-react';
import { Icon } from '@iconify/react';

export interface MindNodeData {
  label: string;
  description?: string;
  status?: string;
  priority?: string;
  statusIcon?: string; // Iconify icon ID (e.g., 'tabler:check', 'mdi:check-circle')
  showStatusIcon?: boolean; // Show/hide status icon
  onAddChild?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  onAIEnhance?: (nodeId: string) => void;
  onLabelChange?: (nodeId: string, newLabel: string) => void;
}

function Studio2MindNode({ data, id, selected }: NodeProps<MindNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const handleLabelDoubleClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent React Flow's onNodeDoubleClick from firing
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    data.label = label;
    data.onLabelChange?.(id, label);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      data.label = label;
      data.onLabelChange?.(id, label);
    } else if (e.key === 'Escape') {
      setLabel(data.label);
      setIsEditing(false);
    }
  };

  // Get color and shape from data, with defaults
  const nodeColor = data.color || 'indigo';
  const nodeShape = data.shape || 'rounded-full';
  
  // Map color names to Tailwind gradient classes
  const colorMap: Record<string, { from: string; to: string; ring: string; shadow: string }> = {
    indigo: { from: 'from-indigo-500', to: 'to-indigo-600', ring: 'ring-indigo-300', shadow: 'rgba(99, 102, 241, 0.3)' },
    blue: { from: 'from-blue-500', to: 'to-blue-600', ring: 'ring-blue-300', shadow: 'rgba(59, 130, 246, 0.3)' },
    purple: { from: 'from-purple-500', to: 'to-purple-600', ring: 'ring-purple-300', shadow: 'rgba(139, 92, 246, 0.3)' },
    pink: { from: 'from-pink-500', to: 'to-pink-600', ring: 'ring-pink-300', shadow: 'rgba(236, 72, 153, 0.3)' },
    red: { from: 'from-red-500', to: 'to-red-600', ring: 'ring-red-300', shadow: 'rgba(239, 68, 68, 0.3)' },
    orange: { from: 'from-orange-500', to: 'to-orange-600', ring: 'ring-orange-300', shadow: 'rgba(249, 115, 22, 0.3)' },
    yellow: { from: 'from-yellow-500', to: 'to-yellow-600', ring: 'ring-yellow-300', shadow: 'rgba(234, 179, 8, 0.3)' },
    green: { from: 'from-green-500', to: 'to-green-600', ring: 'ring-green-300', shadow: 'rgba(34, 197, 94, 0.3)' },
    teal: { from: 'from-teal-500', to: 'to-teal-600', ring: 'ring-teal-300', shadow: 'rgba(20, 184, 166, 0.3)' },
  };
  
  const colors = colorMap[nodeColor] || colorMap.indigo;
  
  // Special handling for diamond and hexagon shapes
  const isDiamond = nodeShape === 'diamond';
  const isHexagon = nodeShape === 'hexagon';
  
  // Get the appropriate border-radius class
  const borderRadiusClass = isDiamond || isHexagon ? '' : nodeShape;

  return (
    <div
      className={`
        relative px-6 py-4 ${borderRadiusClass}
        bg-gradient-to-br ${colors.from} ${colors.to}
        shadow-lg
        border-4
        transition-all duration-200
        ${selected ? `ring-4 ${colors.ring} scale-105 shadow-2xl` : 'hover:shadow-xl hover:scale-102'}
      `}
      style={{
        minWidth: '120px',
        borderColor: `rgba(255, 255, 255, 0.4)`,
        filter: `drop-shadow(0px 4px 8px ${colors.shadow})`,
        ...(isDiamond && {
          transform: 'rotate(45deg)',
          width: '100px',
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }),
        ...(isHexagon && {
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
          minWidth: '140px',
        }),
      }}
    >
      {/* Connection Handles - Top-down tree layout */}
      {/* SOURCE handle (outgoing connections) - BOTTOM ONLY for vertical tree */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white"
      />
      
      {/* TARGET handle (incoming connections) - TOP ONLY for vertical tree */}
      <Handle 
        type="target" 
        position={Position.Top}
        id="top"
        className="!w-3 !h-3 !bg-green-400 !border-2 !border-white"
      />

      {/* Label */}
      {isEditing ? (
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="
            bg-white/20 text-white font-semibold text-center
            border-none outline-none rounded px-2 py-1
            placeholder-white/50
            nodrag nopan
          "
          style={{ 
            minWidth: '80px',
            ...(isDiamond && { transform: 'rotate(-45deg)' }),
          }}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div 
          className="text-white font-semibold text-center text-sm whitespace-nowrap"
          onDoubleClick={handleLabelDoubleClick}
          title="Double-click to edit label"
          style={isDiamond ? { transform: 'rotate(-45deg)' } : {}}
        >
          {label.length > 15 ? label.slice(0, 13) + '...' : label}
        </div>
      )}

      {/* Description indicator */}
      {data.description && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-[8px]">📝</span>
        </div>
      )}

      {/* Status indicator - Configurable icon */}
      {data.status && data.showStatusIcon !== false && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
          {data.statusIcon ? (
            <Icon icon={data.statusIcon} width={12} height={12} color="white" />
          ) : (
            <span className="text-[10px]">✓</span>
          )}
        </div>
      )}

      {/* Hover Toolbar */}
      {selected && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-lg shadow-lg p-1 border border-gray-200">
          <button 
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Add Child"
            onClick={(e) => {
              e.stopPropagation();
              data.onAddChild?.(id);
            }}
          >
            <Plus className="h-3 w-3 text-gray-700" />
          </button>
          <button 
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Edit2 className="h-3 w-3 text-gray-700" />
          </button>
          <button 
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="AI Enhance"
            onClick={(e) => {
              console.log('🔥🔥🔥 SPARKLES ICON CLICKED! 🔥🔥🔥');
              console.log('Node ID:', id);
              console.log('Node Label:', data.label);
              console.log('onAIEnhance exists?', !!data.onAIEnhance);
              e.stopPropagation();
              
              if (data.onAIEnhance) {
                console.log('✅ Calling onAIEnhance...');
                data.onAIEnhance(id);
              } else {
                console.error('❌ onAIEnhance is NOT DEFINED!');
              }
            }}
          >
            <Sparkles className="h-3 w-3 text-purple-600" />
          </button>
          <div className="w-px h-4 bg-gray-300" />
          <button 
            className="p-1.5 hover:bg-red-50 rounded transition-colors"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete?.(id);
            }}
          >
            <Trash2 className="h-3 w-3 text-red-600" />
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(Studio2MindNode);
