import { Panel } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export type NodePMData = {
  description?: string;
  startDate?: string; // yyyy-mm-dd
  endDate?: string;   // yyyy-mm-dd
  status?: "todo" | "in_progress" | "blocked" | "done";
  priority?: "low" | "medium" | "high" | "critical";
  assignee?: string;
  estimate?: number; // days or points
  progress?: number; // 0..100
  tags?: string;
};

interface NodeDetailsPanelProps {
  visible: boolean;
  title: string;
  data: NodePMData | undefined;
  onChange: (next: NodePMData) => void;
  onClose?: () => void;
  // Hierarchy insight for selected node
  levels?: { level: number; labels: string[] }[];
  levelFilter?: number | null;
  maxDepth?: number;
  onLevelFilterChange?: (v: number | null) => void;
}

export default function NodeDetailsPanel({ visible, title, data, onChange, onClose, levels = [], levelFilter = null, maxDepth = 0, onLevelFilterChange }: NodeDetailsPanelProps) {
  if (!visible) return null;
  const d = data || {};

  return (
    <Panel position="top-right" className="w-[320px] max-h-[70vh] overflow-auto rounded-md border border-border bg-card p-3 shadow">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">Node details</div>
        {onClose ? <Button size="sm" variant="ghost" onClick={onClose}>Close</Button> : null}
      </div>
      <div className="space-y-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Title</div>
          <Input value={title} readOnly />
        </div>
        {levels.length > 0 && (
          <div className="rounded-md border border-border p-2">
            <div className="text-xs font-medium mb-2">Hierarchy</div>
            <div className="text-xs text-muted-foreground mb-2">Depth levels: {levels.length - 1}</div>
            <div className="space-y-1 max-h-32 overflow-auto pr-1">
              {levels.map(({ level, labels }) => (
                <div key={level} className="text-xs">
                  <span className="font-medium">L{level}:</span> {labels.slice(0,6).join(', ')}{labels.length>6?'…':''}
                </div>
              ))}
            </div>
            {onLevelFilterChange && (
              <div className="mt-2 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => onLevelFilterChange(null)}>Show all</Button>
                <div className="text-xs">Show up to level:</div>
                <Select value={levelFilter==null? 'all' : String(levelFilter)} onValueChange={(v)=> onLevelFilterChange(v==='all'? null : Number(v))}>
                  <SelectTrigger className="h-8 w-[100px]"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {Array.from({length: maxDepth+1}).map((_,i)=> (
                      <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
        <div>
          <div className="text-xs text-muted-foreground mb-1">Description</div>
          <Textarea value={d.description || ''} onChange={(e) => onChange({ ...d, description: e.target.value })} className="h-24" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Start</div>
            <Input type="date" value={d.startDate || ''} onChange={(e) => onChange({ ...d, startDate: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">End</div>
            <Input type="date" value={d.endDate || ''} onChange={(e) => onChange({ ...d, endDate: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            <Select value={d.status || "todo"} onValueChange={(v) => onChange({ ...d, status: v as any })}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To do</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Priority</div>
            <Select value={d.priority || "medium"} onValueChange={(v) => onChange({ ...d, priority: v as any })}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Assignee</div>
            <Input value={d.assignee || ''} onChange={(e) => onChange({ ...d, assignee: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Estimate (pts)</div>
            <Input type="number" min={0} value={d.estimate ?? 0} onChange={(e) => onChange({ ...d, estimate: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Progress: {d.progress ?? 0}%</div>
          <Slider value={[d.progress ?? 0]} onValueChange={([v]) => onChange({ ...d, progress: v })} max={100} step={1} />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Tags (comma separated)</div>
          <Input value={d.tags || ''} onChange={(e) => onChange({ ...d, tags: e.target.value })} />
        </div>
      </div>
    </Panel>
  );
}


