/**
 * SimpleMilestoneNode - Lightweight milestone/group container
 * Optimized for better performance
 */

import { memo } from 'react';
import { NodeProps, NodeResizer, NodeToolbar, Position } from '@xyflow/react';
import { Folder, Trash2 } from 'lucide-react';

export interface SimpleMilestoneData {
  label: string;
  description?: string;
  groupedNodeIds?: string[];
  onUngroup?: (milestoneId: string) => void;
  onDelete?: (milestoneId: string) => void;
}

function SimpleMilestoneNode({ data, id, selected }: NodeProps<SimpleMilestoneData>) {
  const nodeCount = data.groupedNodeIds?.length || 0;

  return (
    <>
      {/* Resizer - only when selected */}
      {selected && (
        <NodeResizer
          minWidth={200}
          minHeight={150}
          color="#6366f1"
          handleStyle={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#6366f1',
            border: '2px solid white',
          }}
        />
      )}

      {/* Toolbar */}
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
              data.onDelete?.(id);
            }}
            style={{
              padding: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Delete Milestone"
          >
            <Trash2 size={14} color="#dc2626" />
          </button>
        </div>
      </NodeToolbar>

      {/* Container */}
      <div
        style={{
          width: '100%',
          height: '100%',
          minWidth: '200px',
          minHeight: '150px',
          borderRadius: '12px',
          border: selected ? '2px dashed #6366f1' : '2px dashed #c7d2fe',
          background: 'rgba(99, 102, 241, 0.05)',
          transition: 'all 0.2s ease',
          boxShadow: selected
            ? '0 4px 12px rgba(99, 102, 241, 0.2)'
            : '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        {/* Header Badge */}
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#6366f1',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Folder size={12} />
          <span>{data.label}</span>
          {nodeCount > 0 && (
            <span
              style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '2px 6px',
                borderRadius: '8px',
                marginLeft: '4px',
              }}
            >
              {nodeCount}
            </span>
          )}
        </div>

        {/* Description */}
        {data.description && (
          <div
            style={{
              position: 'absolute',
              top: '32px',
              left: '16px',
              right: '16px',
              fontSize: '12px',
              color: '#6b7280',
              background: 'rgba(255,255,255,0.8)',
              padding: '6px 8px',
              borderRadius: '6px',
            }}
          >
            {data.description}
          </div>
        )}

        {/* Empty state */}
        {nodeCount === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: '12px',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                Empty Milestone
              </div>
              <div>Drag nodes here to group</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default memo(SimpleMilestoneNode);

