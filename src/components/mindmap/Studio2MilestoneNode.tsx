/**
 * Studio2MilestoneNode - Custom React Flow milestone/group container
 * Uses parent nodes strategy for FREE grouping functionality!
 */

import { memo } from 'react';
import { NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';
import { Folder, Maximize2, Trash2 } from 'lucide-react';
import { Icon } from '@iconify/react';

export interface MilestoneNodeData {
  label: string;
  description?: string;
  groupedNodeIds?: string[];
  icon?: string; // Iconify icon ID (e.g., 'tabler:folder', 'mdi:folder-star')
  onUngroup?: (milestoneId: string) => void;
  onDelete?: (milestoneId: string) => void;
}

function Studio2MilestoneNode({ data, id, selected }: NodeProps<MilestoneNodeData>) {
  const nodeCount = data.groupedNodeIds?.length || 0;
  const { getNode } = useReactFlow();
  const currentNode = getNode(id);
  
  // Check if this milestone is nested (has a parent milestone)
  const hasParentMilestone = currentNode && (currentNode as any).parentId;
  const parentNode = hasParentMilestone ? getNode((currentNode as any).parentId) : null;
  const isNested = parentNode?.type === 'milestone';
  
  // Adjust styling for nested milestones
  const opacity = isNested ? 0.6 : 0.3; // Less opacity when nested
  const blurAmount = isNested ? 'none' : 'blur(4px)'; // No blur when nested to prevent stacking blur

  return (
    <>
      {/* Resizable container */}
      {selected && (
        <NodeResizer 
          minWidth={200}
          minHeight={150}
          color="#6366f1"
          handleStyle={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#6366f1',
            border: '2px solid white',
          }}
        />
      )}

      <div
        className={`
          relative w-full h-full
          rounded-xl border-2 border-dashed
          transition-all duration-200
          ${selected ? 'border-indigo-500 shadow-xl' : isNested ? 'border-indigo-400' : 'border-indigo-300 shadow-md'}
        `}
        style={{
          minWidth: '200px',
          minHeight: '150px',
          backgroundColor: `rgba(99, 102, 241, ${opacity})`,
          backdropFilter: blurAmount,
          WebkitBackdropFilter: blurAmount,
        }}
      >
        {/* Header Badge */}
        <div className="absolute -top-3 left-4 flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-3 py-1 rounded-full shadow-lg text-xs font-semibold">
          {data.icon ? (
            <Icon icon={data.icon} width={12} height={12} />
          ) : (
            <Folder className="h-3 w-3" />
          )}
          <span>{data.label}</span>
          <div className="flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-white/20 rounded-full">
            <span>{nodeCount}</span>
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <div className="absolute top-8 left-4 right-4 text-xs text-gray-600 bg-white/60 backdrop-blur-sm px-2 py-1 rounded">
            {data.description}
          </div>
        )}

        {/* Toolbar (when selected) */}
        {selected && (
          <div className="absolute -top-10 right-4 flex items-center gap-1 bg-white rounded-lg shadow-lg p-1 border border-gray-200">
            <button 
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Resize"
            >
              <Maximize2 className="h-3 w-3 text-gray-700" />
            </button>
            <div className="w-px h-4 bg-gray-300" />
            <button 
              className="p-1.5 hover:bg-red-50 rounded transition-colors"
              title="Delete Milestone"
              onClick={(e) => {
                e.stopPropagation();
                data.onDelete?.(id);
              }}
            >
              <Trash2 className="h-3 w-3 text-red-600" />
            </button>
          </div>
        )}

        {/* Instructions overlay (when empty) */}
        {nodeCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400 text-xs">
              <p className="font-semibold">Empty Milestone</p>
              <p className="mt-1">Drag nodes here to group them</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default memo(Studio2MilestoneNode);
