import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { getIconComponent, type IconName } from '@/icons';

export type AwsNodeData = {
  icon: IconName;
  title: string;
  subtitle?: string;
  status?: 'ok' | 'warn' | 'error';
};

const statusColor: Record<NonNullable<AwsNodeData['status']>, string> = {
  ok: '#10b981',
  warn: '#f59e0b',
  error: '#ef4444',
};

function AwsNodeComponent({ data, selected }: NodeProps) {
  const d = data as AwsNodeData;
  const Icon = getIconComponent(d.icon);
  const border = selected ? '#3b82f6' : '#d1d5db';

  return (
    <div
      style={{
        padding: 10,
        borderRadius: 10,
        background: '#fff',
        border: `2px solid ${border}`,
        minWidth: 160,
        boxShadow: selected ? '0 4px 10px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon width={28} height={28} />
        {(d.title || d.subtitle) && (
          <div style={{ lineHeight: 1.1 }}>
            {d.title && <div style={{ fontWeight: 700 }}>{d.title}</div>}
            {d.subtitle && (
              <div style={{ fontSize: 12, color: '#6b7280' }}>{d.subtitle}</div>
            )}
          </div>
        )}
        {d.status && (
          <div
            style={{
              marginLeft: 'auto',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: statusColor[d.status],
            }}
          />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} id="a" style={{ left: '33%', background: '#555' }} />
      <Handle type="source" position={Position.Bottom} id="b" style={{ left: '66%', background: '#555' }} />
    </div>
  );
}

export const AwsNode = memo(AwsNodeComponent);
export default AwsNode;

