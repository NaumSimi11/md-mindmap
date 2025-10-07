/**
 * Studio2MindNode - Custom React Flow node for Studio2
 * Beautiful, gradient-styled node with handles
 */

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Plus, Edit2, Trash2, Sparkles } from 'lucide-react';

export interface MindNodeData {
  label: string;
  description?: string;
  status?: string;
  priority?: string;
  onAddChild?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  onAIEnhance?: (nodeId: string) => void;
  onLabelChange?: (nodeId: string, newLabel: string) => void;
}

function Studio2MindNode({ data, id, selected }: NodeProps<MindNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const handleDoubleClick = () => {
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

  return (
    <div
      className={`
        relative px-6 py-4 rounded-full
        bg-gradient-to-br from-indigo-500 to-indigo-600
        shadow-lg
        border-2 border-white
        transition-all duration-200
        ${selected ? 'ring-4 ring-indigo-300 scale-105' : 'hover:shadow-xl hover:scale-102'}
      `}
      onDoubleClick={handleDoubleClick}
      style={{
        minWidth: '120px',
        filter: 'drop-shadow(0px 4px 8px rgba(99, 102, 241, 0.3))',
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
          "
          style={{ minWidth: '80px' }}
        />
      ) : (
        <div className="text-white font-semibold text-center text-sm whitespace-nowrap">
          {label.length > 15 ? label.slice(0, 13) + '...' : label}
        </div>
      )}

      {/* Description indicator */}
      {data.description && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-[8px]">📝</span>
        </div>
      )}

      {/* Status indicator */}
      {data.status && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-[10px]">✓</span>
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
              handleDoubleClick();
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
