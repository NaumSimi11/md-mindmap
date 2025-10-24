import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactFlow, 
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  addEdge,
  Connection,
  useEdgesState,
  useNodesState,
  Panel,
  useOnSelectionChange,
  useReactFlow,
  getNodesBounds,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ELK from "elkjs/lib/elk.bundled.js";
import { Button } from "@/components/ui/button";
import MindNode from "@/components/mindmap/MindNode";
import MilestoneNode from "@/components/mindmap/MilestoneNode";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NodeDetailsPanel, { NodePMData } from "@/components/mindmap/NodeDetailsPanel";
import AwsNode from "@/components/diagram/nodes/AwsNode";

const elk = new ELK();

export interface MindmapEntity {
  id: string;
  label: string;
  parentId?: string | null;
}

interface MindmapCanvasProps {
  initialEntities?: MindmapEntity[];
}

const nodeTypes = { mind: MindNode, milestone: MilestoneNode, aws: AwsNode } as const;

type LayoutMode = 'down' | 'right' | 'left' | 'up' | 'radial';

function elkOptionsFor(mode: LayoutMode) {
  if (mode === 'right') {
    return { "elk.algorithm": "layered", "elk.direction": "RIGHT", "elk.layered.spacing.nodeNodeBetweenLayers": "40", "elk.spacing.nodeNode": "40", "elk.layered.considerModelOrder": "true", "elk.layered.crossingMinimization.semiInteractive": "true", "elk.randomSeed": "42" } as Record<string, string>;
  }
  if (mode === 'left') {
    return { "elk.algorithm": "layered", "elk.direction": "LEFT", "elk.layered.spacing.nodeNodeBetweenLayers": "40", "elk.spacing.nodeNode": "40", "elk.layered.considerModelOrder": "true", "elk.layered.crossingMinimization.semiInteractive": "true", "elk.randomSeed": "42" } as Record<string, string>;
  }
  if (mode === 'up') {
    return { "elk.algorithm": "layered", "elk.direction": "UP", "elk.layered.spacing.nodeNodeBetweenLayers": "40", "elk.spacing.nodeNode": "40", "elk.layered.considerModelOrder": "true", "elk.layered.crossingMinimization.semiInteractive": "true", "elk.randomSeed": "42" } as Record<string, string>;
  }
  if (mode === 'radial') {
    return { "elk.algorithm": "radial", "elk.radial.separateDisconnectedComponents": "true", "elk.spacing.nodeNode": "40", "elk.randomSeed": "42" } as Record<string, string>;
  }
  // default 'down'
  return { "elk.algorithm": "layered", "elk.direction": "DOWN", "elk.layered.spacing.nodeNodeBetweenLayers": "40", "elk.spacing.nodeNode": "40", "elk.layered.considerModelOrder": "true", "elk.layered.crossingMinimization.semiInteractive": "true", "elk.randomSeed": "42" } as Record<string, string>;
}

async function layoutWithElk(nodes: Node[], edges: Edge[], mode: LayoutMode = 'down'): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const nodeIds = new Set(nodes.map((n) => n.id));
  // Sort by current x to hint ELK to keep sibling order stable
  const sortedNodes = [...nodes].sort((a, b) => (a.position?.x || 0) - (b.position?.x || 0));
  const elkNodes = sortedNodes.map((n) => ({ id: n.id, width: Math.max(140, (n.data?.label?.length || 4) * 7), height: 48 }));
  const safeEdges = edges.filter((e) => e.source && e.target && nodeIds.has(e.source) && nodeIds.has(e.target));
  const elkEdges = safeEdges.map((e) => ({ id: e.id, sources: [e.source!], targets: [e.target!] }));
  const graph = { id: "root", layoutOptions: elkOptionsFor(mode), children: elkNodes, edges: elkEdges } as any;
  const res = await elk.layout(graph);
  const posById: Record<string, { x: number; y: number }> = {};
  (res.children || []).forEach((c: any) => { posById[c.id] = { x: c.x || 0, y: c.y || 0 }; });
  const laidOut = nodes.map((n) => ({ ...n, position: posById[n.id] || n.position }));
  return { nodes: laidOut, edges: safeEdges };
}

export default function MindmapCanvas({ initialEntities = [] }: MindmapCanvasProps) {
  const rf = useReactFlow();
  const initialNodes = useMemo<Node[]>(() => {
    if (initialEntities.length === 0) {
      return [
        { id: "root", data: { label: "Root" }, position: { x: 0, y: 0 }, type: "mind" },
        { id: "n1", data: { label: "Idea A" }, position: { x: 0, y: 0 }, type: "mind" },
        { id: "n2", data: { label: "Idea B" }, position: { x: 0, y: 0 }, type: "mind" },
      ];
    }
    return initialEntities.map((e) => ({ id: e.id, data: { label: e.label }, position: { x: 0, y: 0 }, type: "mind" }));
  }, [initialEntities]);

  const initialEdges = useMemo<Edge[]>(() => {
    if (initialEntities.length === 0) {
      return [ { id: "e1", source: "root", target: "n1" }, { id: "e2", source: "root", target: "n2" } ];
    }
    const edges: Edge[] = [];
    initialEntities.forEach((e) => { if (e.parentId) edges.push({ id: `${e.parentId}-${e.id}`, source: e.parentId, target: e.id }); });
    return edges;
  }, [initialEntities]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selection, setSelection] = useState<{ nodes: string[]; edges: string[] }>({ nodes: [], edges: [] });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('down');
  const [pmByNodeId, setPmByNodeId] = useState<Record<string, NodePMData>>({});
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [milestoneSelectActive, setMilestoneSelectActive] = useState<boolean>(false);
  // Grouping temporarily disabled

  useOnSelectionChange({ onChange: ({ nodes: selNodes, edges: selEdges }) => setSelection({ nodes: selNodes.map((n) => n.id), edges: selEdges.map((e) => e.id) }) });

  const onConnect = useCallback((connection: Connection) => {
    const nextEdges = addEdge({ ...connection }, edges);
    setEdges(nextEdges);
    applyLayoutWith(nodes, nextEdges);
  }, [edges, nodes]);

  const applyLayoutWith = useCallback(async (n: Node[], e: Edge[]) => {
    const res = await layoutWithElk(n, e, layoutMode);
    setNodes(res.nodes);
    setEdges(res.edges);
  }, [setNodes, setEdges, layoutMode]);

  const applyLayout = useCallback(async () => {
    await applyLayoutWith(nodes, edges);
  }, [nodes, edges, applyLayoutWith]);

  // Re-layout immediately when mode changes
  useEffect(() => {
    applyLayoutWith(nodes, edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutMode]);

  const addChildTo = (parentId: string) => {
    const id = `n${Date.now()}`;
    const parent = nodes.find((n) => n.id === parentId);
    const children = edges.filter((e) => e.source === parentId).map((e) => nodes.find((n) => n.id === e.target)!).filter(Boolean);
    const baseX = parent ? (parent.position?.x || 0) : 0;
    const baseY = parent ? (parent.position?.y || 0) : 0;
    const spacingX = 220;
    const spacingY = 120;
    const nextX = children.length > 0 ? Math.max(...children.map((c) => c.position?.x || baseX)) + spacingX : baseX;
    const nextY = baseY + spacingY;
    const newNode: Node = { id, data: { label: `New Node` }, position: { x: nextX, y: nextY }, type: "mind" };
    setNodes((ns) => [...ns, newNode]);
    setEdges((es) => [...es, { id: `e-${id}`, source: parentId, target: id } as Edge]);
    // Do NOT re-run global layout here to preserve sibling order. Users can click Re-layout when desired.
  };

  const addChildToRoot = () => addChildTo("root");

  // AWS icon nodes: quick insert helpers
  const addAwsNode = (title: string, icon: any) => {
    const id = `aws-${Date.now()}`;
    // Place near root with spacing based on count
    const countAws = nodes.filter((n)=> n.type === 'aws').length;
    const baseX = 120 + (countAws % 4) * 220;
    const baseY = 80 + Math.floor(countAws / 4) * 160;
    const newNode: Node = { id, type: 'aws', position: { x: baseX, y: baseY }, data: { title, icon, status: 'ok' } } as Node;
    setNodes((ns) => [...ns, newNode]);
  };

  const renameNode = (id: string, titleOrLabel: string) => {
    setNodes((ns) => ns.map((n) => {
      if (n.id !== id) return n;
      if (n.type === 'milestone') {
        return { ...n, data: { ...n.data, title: titleOrLabel } } as Node;
      }
      return { ...n, data: { ...n.data, label: titleOrLabel } } as Node;
    }));
  };

  const deleteNode = (id: string) => {
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
    setNodes((ns) => ns.filter((n) => n.id !== id));
  };

  // Collapse/expand: hide descendants by filtering edges and nodes in view
  const toggleCollapse = (id: string) => {
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  };

  const visibleNodeIds = useMemo(() => {
    const hidden = new Set<string>();
    const coll = collapsed;
    const childrenOf = (pid: string) => edges.filter((e) => e.source === pid).map((e) => e.target);
    const dfsHide = (pid: string) => {
      for (const ch of childrenOf(pid)) {
        hidden.add(ch);
        dfsHide(ch);
      }
    };
    Object.keys(coll).forEach((id) => { if (coll[id]) dfsHide(id); });
    // Level filter: compute levels from the currently selected node (first selection) or from root
    if (levelFilter != null) {
      const roots = nodes.filter((n) => !edges.some((e) => e.target === n.id));
      const anchorId = selection.nodes[0] || roots[0]?.id;
      const levelById = new Map<string, number>();
      if (anchorId) {
        const queue: Array<{ id: string; level: number }> = [{ id: anchorId, level: 0 }];
        const seen = new Set<string>();
        while (queue.length) {
          const { id, level } = queue.shift()!;
          if (seen.has(id)) continue; seen.add(id);
          levelById.set(id, level);
          edges.filter((e) => e.source === id).forEach((e) => queue.push({ id: e.target!, level: level + 1 }));
        }
        nodes.forEach((n) => { if ((levelById.get(n.id) ?? Infinity) > levelFilter) hidden.add(n.id); });
      }
    }
    return new Set(nodes.map((n) => n.id).filter((id) => !hidden.has(id)));
  }, [collapsed, nodes, edges, levelFilter, selection]);
  // Build hierarchy summary for selected node
  const hierarchyLevels = useMemo(() => {
    const anchor = selection.nodes[0];
    if (!anchor) return [] as { level: number; labels: string[] }[];
    const levels: Record<number, string[]> = { 0: [nodes.find((n)=>n.id===anchor)?.data?.label || anchor] };
    const queue: Array<{ id: string; level: number }> = [{ id: anchor, level: 0 }];
    const seen = new Set<string>();
    while (queue.length) {
      const { id, level } = queue.shift()!;
      if (seen.has(id)) continue; seen.add(id);
      edges.filter((e) => e.source === id).forEach((e) => {
        const next = nodes.find((n)=>n.id===e.target);
        const lbl = next?.data?.label || e.target!;
        const l = level + 1;
        if (!levels[l]) levels[l] = [];
        levels[l].push(lbl);
        queue.push({ id: e.target!, level: l });
      });
    }
    return Object.keys(levels).map((k)=>({ level: Number(k), labels: levels[Number(k)] }));
  }, [selection, nodes, edges]);

  // Hoisted function so it's available before usage
  function ungroupMilestone(milestoneId: string) {
    const parent = nodes.find((n)=> n.id===milestoneId);
    if (!parent) return;
    const px = parent.position?.x || 0; const py = parent.position?.y || 0;
    setNodes((ns)=> ns.filter((n)=> n.id !== milestoneId).map((n)=> n.parentNode === milestoneId ? { ...n, parentNode: undefined, position: { x: (n.position?.x || 0) + px, y: (n.position?.y || 0) + py }, extent: undefined } : n));
  }

  const nodesForRender = nodes.map((n) => ({ ...n, hidden: !visibleNodeIds.has(n.id), data: { ...(n.data||{}), onAddChild: addChildTo, onRename: renameNode, onUngroup: ungroupMilestone, onDelete: deleteNode, onToggleCollapse: toggleCollapse, collapsed: !!collapsed[n.id] } }));
  const edgesForRender = edges.map((e) => ({ ...e, hidden: !visibleNodeIds.has(e.source!) || !visibleNodeIds.has(e.target!) }));

  // Provide handlers to custom node via data
  // Keyboard shortcuts: Enter new sibling, Tab child, Backspace delete
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const focused = selection.nodes[0];
      if (!focused) return;
      if (e.key === 'Enter') { // sibling under same parent (fallback root)
        e.preventDefault();
        const parent = edges.find((ed) => ed.target === focused)?.source || 'root';
        addChildTo(parent);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        addChildTo(focused);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        deleteNode(focused);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selection, edges]);

  // Auto-layout on first mount
  const didInitialLayout = useRef(false);
  useEffect(() => {
    if (!didInitialLayout.current) { didInitialLayout.current = true; setTimeout(applyLayout, 0); }
  }, []);

  // Cycle prevention: check if newParent is in descendant chain of nodeId
  const wouldCreateCycle = useCallback((nodeId: string, newParentId: string) => {
    if (nodeId === newParentId) return true;
    const parentsByChild = new Map<string, string | null>();
    edges.forEach((e) => parentsByChild.set(e.target!, e.source!));
    let p: string | null | undefined = newParentId;
    const guard = new Set<string>();
    while (p) {
      if (p === nodeId) return true;
      if (guard.has(p)) break;
      guard.add(p);
      p = parentsByChild.get(p);
    }
    return false;
  }, [edges]);

  // Drag-to-reparent: on drag stop, if dropped over another node, reparent
  const widthByIdRef = useRef<Record<string, { w: number; h: number }>>({});
  // Approximate sizes to avoid measuring; MindNode min sizes used
  const getSize = (id: string) => widthByIdRef.current[id] || { w: 160, h: 60 };

  const onNodeDragStop = useCallback((_: any, dragged: Node) => {
    const center = {
      x: (dragged.position?.x || 0) + getSize(dragged.id).w / 2,
      y: (dragged.position?.y || 0) + getSize(dragged.id).h / 2,
    };
    const target = nodes.find((n) => n.id !== dragged.id && !n.hidden &&
      center.x >= (n.position?.x || 0) && center.x <= (n.position?.x || 0) + getSize(n.id).w &&
      center.y >= (n.position?.y || 0) && center.y <= (n.position?.y || 0) + getSize(n.id).h);
    if (!target) return;

    // Prevent cycles
    if (wouldCreateCycle(dragged.id, target.id)) return;

    const withoutOld = edges.filter((e) => !(e.target === dragged.id));
    const nextEdges = [...withoutOld, { id: `e-${target.id}-${dragged.id}-${Date.now()}`, source: target.id, target: dragged.id } as Edge];
    setEdges(nextEdges);
    applyLayoutWith(nodes, nextEdges);
  }, [nodes, applyLayout, setEdges, wouldCreateCycle]);

  // Smart containment: clamp child dragging within milestone bounds and auto-fit milestone to children
  const onNodeDrag = useCallback((_: any, dragged: Node) => {
    if (!dragged.parentNode) return;
    const parent = nodes.find((n) => n.id === dragged.parentNode);
    if (!parent) return;
    const parentStyle = (parent.style || {}) as any;
    const parentW: number = typeof parentStyle.width === 'number' ? parentStyle.width : 320;
    const parentH: number = typeof parentStyle.height === 'number' ? parentStyle.height : 200;
    const pad = 12;
    const size = getSize(dragged.id);
    let x = dragged.position.x;
    let y = dragged.position.y;
    x = Math.max(pad, Math.min(x, parentW - size.w - pad));
    y = Math.max(pad, Math.min(y, parentH - size.h - pad));
    if (x !== dragged.position.x || y !== dragged.position.y) {
      setNodes((ns) => ns.map((n) => (n.id === dragged.id ? { ...n, position: { x, y } } : n)));
    }
  }, [nodes]);

  const autoFitMilestone = useCallback((milestoneId: string) => {
    const parent = nodes.find((n) => n.id === milestoneId);
    if (!parent) return;
    const pad = 40;
    const children = nodes.filter((n) => n.parentNode === milestoneId);
    let maxX = 0, maxY = 0;
    children.forEach((c) => {
      const s = getSize(c.id);
      const x = (c.position?.x || 0) + s.w;
      const y = (c.position?.y || 0) + s.h;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });
    const newStyle = { ...((parent.style || {}) as any), width: maxX + pad, height: maxY + pad } as any;
    setNodes((ns) => ns.map((n) => (n.id === milestoneId ? { ...n, style: newStyle } : n)));
  }, [nodes]);

  const onNodeDragStopWithFit = useCallback((e: any, dragged: Node) => {
    onNodeDragStop(e, dragged);
    if (dragged.parentNode) autoFitMilestone(dragged.parentNode as string);
  }, [onNodeDragStop, autoFitMilestone]);

  // Create milestone container from current selection (box or manual)
  const groupSelectionAsMilestone = () => {
    const ids = selection.nodes;
    if (!ids.length) return;
    // Use measured nodes from store for precise bounds
    const storeNodes = rf.getNodes();
    const selNodes = storeNodes.filter((n)=> ids.includes(n.id));
    const bounds = getNodesBounds(selNodes as any);
    const minX = bounds.x; const minY = bounds.y; const maxX = bounds.x + bounds.width; const maxY = bounds.y + bounds.height;
    const padding = 40;
    const pos = { x: minX - padding, y: minY - padding };
    const size = { width: (maxX - minX) + padding * 2, height: (maxY - minY) + padding * 2 };
    const mid = `ms-${Date.now()}`;
    const milestoneNode: Node = { id: mid, type: 'milestone', position: pos, style: { ...(size as any), zIndex: 0 } as any, data: { title: 'Milestone' } };
    // Phase 1: add milestone first so parent exists
    setNodes((ns) => [milestoneNode, ...ns]);
    // Phase 2: on next frame, attach selected nodes as children with relative positions
    setTimeout(() => {
      setNodes((ns) => ns.map((n) => {
        if (!ids.includes(n.id)) return n;
        const abs = n.position || { x: 0, y: 0 };
        const childStyle = { ...((n.style||{}) as any), zIndex: 1 } as any;
        return { ...n, parentNode: mid, style: childStyle, position: { x: abs.x - pos.x, y: abs.y - pos.y }, extent: 'parent' } as Node;
      }));
      // Ensure container fits after initial parenting
      autoFitMilestone(mid);
    }, 0);
    // Keep edges intact (no detaching)
  };

  // (definition moved above)

  // Save/Restore
  const saveFlow = useCallback(() => {
    try {
      const payload = { nodes, edges, collapsed };
      localStorage.setItem('mindmapStudioFlow', JSON.stringify(payload));
    } catch {}
  }, [nodes, edges, collapsed]);

  const restoreFlow = useCallback(() => {
    try {
      const raw = localStorage.getItem('mindmapStudioFlow');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.nodes && parsed.edges) {
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
        setCollapsed(parsed.collapsed || {});
        setTimeout(applyLayout, 0);
      }
    } catch {}
  }, [setNodes, setEdges, applyLayout]);

  const expandAll = () => setCollapsed({});
  const collapseAll = () => {
    const map: Record<string, boolean> = {};
    nodes.forEach((n) => { if (edges.some((e) => e.source === n.id)) map[n.id] = true; });
    setCollapsed(map);
  };

  return (
    <div className="h-full w-full relative">
      <Panel position="top-left" className="flex gap-2">
        <Button size="sm" onClick={addChildToRoot}>Add child</Button>
        <Button size="sm" variant="outline" onClick={applyLayout}>Re-layout</Button>
        <Button size="sm" variant="outline" onClick={saveFlow}>Save</Button>
        <Button size="sm" variant="outline" onClick={restoreFlow}>Restore</Button>
        <Button size="sm" variant="outline" onClick={expandAll}>Expand all</Button>
        <Button size="sm" variant="outline" onClick={collapseAll}>Collapse all</Button>
        {/* Quick AWS nodes (research phase) */}
        <Button size="sm" variant="outline" onClick={() => addAwsNode('ALB', 'aws.alb')}>+ ALB</Button>
        <Button size="sm" variant="outline" onClick={() => addAwsNode('EC2', 'aws.ec2')}>+ EC2</Button>
        <Button size="sm" variant={milestoneSelectActive? 'default':'outline'} onClick={() => setMilestoneSelectActive((v)=>!v)}>
          {milestoneSelectActive? 'Selecting… drag to box' : 'Milestone select'}
        </Button>
        <Select value={layoutMode} onValueChange={(v) => setLayoutMode(v as LayoutMode)}>
          <SelectTrigger className="w-[160px] h-8">
            <SelectValue placeholder="Layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="down">Tree (top → bottom)</SelectItem>
            <SelectItem value="right">Tree (left → right)</SelectItem>
            <SelectItem value="left">Tree (right → left)</SelectItem>
            <SelectItem value="up">Tree (bottom → top)</SelectItem>
            <SelectItem value="radial">Radial</SelectItem>
          </SelectContent>
        </Select>
      </Panel>
      <ReactFlow
        nodes={nodesForRender}
        edges={edgesForRender}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStopWithFit}
        selectionOnDrag={milestoneSelectActive}
        panOnDrag={!milestoneSelectActive}
        nodeTypes={nodeTypes}
        fitView
        onMoveEnd={() => {
          if (milestoneSelectActive && selection.nodes.length > 0) {
            groupSelectionAsMilestone();
            setMilestoneSelectActive(false);
          }
        }}
      >
        <Background />
        <MiniMap />
        <Controls />
        <NodeDetailsPanel
          visible={!!selection.nodes[0]}
          title={(nodes.find((n)=>n.id===selection.nodes[0])?.data?.label) ?? (nodes.find((n)=>n.id===selection.nodes[0])?.data as any)?.title ?? ''}
          data={pmByNodeId[selection.nodes[0]]}
          onChange={(next)=> setPmByNodeId((m)=>({ ...m, [selection.nodes[0]]: next }))}
          levels={hierarchyLevels}
          levelFilter={levelFilter}
          maxDepth={Math.max(0, hierarchyLevels.length-1)}
          onLevelFilterChange={setLevelFilter}
        />
      </ReactFlow>
    </div>
  );
}
