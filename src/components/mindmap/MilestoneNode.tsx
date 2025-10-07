import { NodeProps, NodeResizer, NodeToolbar } from "@xyflow/react";
import { Button } from "@/components/ui/button";

interface MilestoneData {
  title: string;
  color?: string;
  collapsed?: boolean;
  onAddChild?: (parentId: string) => void;
  onToggleCollapse?: (id: string) => void;
  onUngroup?: (id: string) => void;
  onRename?: (id: string, title: string) => void;
}

export default function MilestoneNode({ id, data, selected }: NodeProps<MilestoneData>) {
  const bg = data.color || "rgba(99,102,241,0.08)"; // indigo-500 @ 8%
  return (
    <div
      className="rounded-lg border border-indigo-200 shadow-sm relative"
      style={{ background: bg, padding: 8, width: '100%', height: '100%' }}
      onDoubleClick={() => data.onToggleCollapse && data.onToggleCollapse(id)}
      title={data.collapsed ? 'Double‑click to expand' : 'Double‑click to collapse'}
    >
      <NodeResizer isVisible={selected} minWidth={220} minHeight={140} />
      {/* Corner badge label (does not push content) */}
      <div className="absolute -top-3 left-2 rounded-full bg-white border border-indigo-200 px-2 py-0.5 text-xs font-medium shadow-sm flex items-center gap-1">
        <span className="select-none">🏁</span>
        <input
          className="bg-transparent outline-none text-xs font-medium w-[140px]"
          value={data.title || 'Milestone'}
          onChange={(e)=> data.onRename && data.onRename(id, e.target.value)}
        />
      </div>
      <NodeToolbar isVisible={selected} position="top" className="flex gap-2">
        <Button size="xs" variant="outline" onClick={() => data.onAddChild && data.onAddChild(id)}>+ Task</Button>
        <Button size="xs" variant="outline" onClick={() => data.onToggleCollapse && data.onToggleCollapse(id)}>
          {data.collapsed ? 'Expand' : 'Collapse'}
        </Button>
        <Button size="xs" variant="outline" onClick={() => data.onRename && data.onRename(id, prompt('Rename milestone', data.title || 'Milestone') || data.title || 'Milestone')}>Rename</Button>
        <Button size="xs" variant="destructive" onClick={() => data.onUngroup && data.onUngroup(id)}>Ungroup</Button>
      </NodeToolbar>
    </div>
  );
}


