import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Icon } from '@iconify/react';

export type IconNodeData = {
  icon: string; // iconify icon id, e.g., 'simple-icons:docker' or 'tabler:server'
  color?: string;
  title?: string;
  subtitle?: string;
};

function IconNodeComponent({ data, selected }: NodeProps) {
  const d = (data || {}) as IconNodeData;
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 10,
        background: '#fff',
        border: `2px solid ${selected ? '#3b82f6' : '#d1d5db'}`,
        minWidth: 160,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: selected ? '0 4px 10px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <Icon icon={d.icon} width={28} height={28} color={d.color || 'currentColor'} />
      <div style={{ lineHeight: 1.1 }}>
        {d.title && <div style={{ fontWeight: 700 }}>{d.title}</div>}
        {d.subtitle && (
          <div style={{ fontSize: 12, color: '#6b7280' }}>{d.subtitle}</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} id="a" style={{ left: '33%', background: '#555' }} />
      <Handle type="source" position={Position.Bottom} id="b" style={{ left: '66%', background: '#555' }} />
    </div>
  );
}

export const IconNode = memo(IconNodeComponent);
export default IconNode;

