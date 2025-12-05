import { useCallback } from "react";
import { NodeProps, NodeToolbar, NodeResizer, Handle, Position } from "@xyflow/react";
import { Button } from "@/components/ui/button";

interface MindNodeData {
  label: string;
  onRename?: (id: string, label: string) => void;
  onAddChild?: (parentId: string) => void;
  onDelete?: (id: string) => void;
  onToggleCollapse?: (id: string) => void;
  collapsed?: boolean;
}

export default function MindNode({ id, data, selected }: NodeProps<MindNodeData>) {
  const handleRename = useCallback(() => {
    const next = prompt("Rename node", data.label || "");
    if (next != null && data.onRename) data.onRename(id, next);
  }, [id, data]);

  const handleAddChild = useCallback(() => data.onAddChild && data.onAddChild(id), [id, data]);
  const handleDelete = useCallback(() => data.onDelete && data.onDelete(id), [id, data]);

  return (
    <div
      className="rounded-md bg-white text-black shadow border border-gray-200 px-3 py-2 min-w-[140px]"
      onDoubleClick={() => data.onToggleCollapse && data.onToggleCollapse(id)}
      title={data.collapsed ? 'Double‑click to expand' : 'Double‑click to collapse'}
    >
      <Handle type="target" position={Position.Top} />
      <NodeResizer minWidth={120} minHeight={40} isVisible={selected} />
      <div className="text-sm font-medium truncate flex items-center gap-2" title={data.label}>
        <span>{data.label || 'Node'}</span>
        {data.collapsed ? <span aria-label="collapsed" className="text-xs text-gray-500">(…)</span> : null}
      </div>
      <NodeToolbar isVisible={selected} position="top" className="flex gap-2">
        <Button size="xs" variant="outline" onClick={handleAddChild}>+ Child</Button>
        <Button size="xs" variant="outline" onClick={handleRename}>Rename</Button>
        <Button size="xs" variant="destructive" onClick={handleDelete}>Delete</Button>
      </NodeToolbar>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}


