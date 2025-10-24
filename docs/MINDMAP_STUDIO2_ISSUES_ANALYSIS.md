# Mindmap Studio 2 - Issues Analysis & Solutions

## Date: October 24, 2025

---

## 🔍 **Issues Identified**

### **Issue 1: Icon Node Shows Raw Icon ID When Title is Empty**

**Problem:**
When you delete the title/name of an icon node (e.g., Docker, Kubernetes), the node displays the raw Iconify icon ID like `simple-icons:docker` instead of showing just the icon without text.

**Root Cause:**
In `IconNode.tsx` (line 31), the fallback logic is:
```tsx
<div style={{ fontWeight: 700 }}>{d.title || d.icon}</div>
```

This means: "If `title` is empty/null, show the `icon` string (e.g., `'simple-icons:docker'`)".

**Current Code:**
```tsx:31:35:/Users/naum/Desktop/mdreader/mdreader-main/src/components/diagram/nodes/IconNode.tsx
<div style={{ lineHeight: 1.1 }}>
  <div style={{ fontWeight: 700 }}>{d.title || d.icon}</div>
  {d.subtitle && (
    <div style={{ fontSize: 12, color: '#6b7280' }}>{d.subtitle}</div>
  )}
</div>
```

**Solution:**
Change the fallback to show nothing (or a placeholder) when `title` is empty:
```tsx
<div style={{ fontWeight: 700 }}>{d.title || ''}</div>
```

Or, if you want icon-only nodes to be visually distinct:
```tsx
{d.title && <div style={{ fontWeight: 700 }}>{d.title}</div>}
```

---

### **Issue 2: Cannot Delete/Remove Connections Between Nodes**

**Problem:**
Once nodes are connected with an edge (line), there's no way to remove that connection. Users want to be able to break connections between nodes.

**Root Cause:**
React Flow supports edge deletion through the `onEdgesChange` handler, but it requires:
1. **Edge selection**: Edges must be selectable (default: true)
2. **Delete key**: Pressing `Delete` or `Backspace` triggers deletion
3. **Edge deletion button**: Or a custom UI button to delete selected edges

**Current Implementation:**
The `onEdgesChange` handler is already wired up in `MindmapStudio2.tsx`:
```tsx:2412:2412:/Users/naum/Desktop/mdreader/mdreader-main/src/pages/MindmapStudio2.tsx
onEdgesChange={onEdgesChange}
```

This means edge deletion **should work** by:
- Clicking an edge to select it (it should highlight)
- Pressing `Delete` or `Backspace` key

**Possible Issues:**
1. **Edges not selectable**: Check if `defaultEdgeOptions` or individual edges have `selectable: false`
2. **No visual feedback**: Selected edges might not be visually distinct
3. **Keyboard shortcuts disabled**: Delete key might be intercepted by another handler

**Solution:**
1. Ensure edges are selectable:
```tsx
defaultEdgeOptions={{
  type: getReactFlowEdgeType(edgeType),
  animated: false,
  selectable: true, // Add this
  markerEnd: { ... },
  style: { ... },
}}
```

2. Add visual feedback for selected edges:
```tsx
defaultEdgeOptions={{
  ...
  style: { 
    stroke: '#64748b', 
    strokeWidth: 2,
    strokeDasharray: edgeStyle === 'dashed' ? '5,5' : edgeStyle === 'dotted' ? '2,2' : undefined,
  },
  // Add selected style
  selectedStyle: {
    stroke: '#3b82f6',
    strokeWidth: 3,
  },
}}
```

3. Add a "Delete Connection" button in the toolbar for selected edges:
```tsx
const selectedEdges = edges.filter(e => e.selected);

<Button 
  size="sm" 
  variant="destructive"
  disabled={selectedEdges.length === 0}
  onClick={() => {
    setEdges((eds) => eds.filter(e => !e.selected));
  }}
>
  🗑️ Delete Connection ({selectedEdges.length})
</Button>
```

---

### **Issue 3: Cannot Add Labels/Icons to Connection Lines (Edges)**

**Problem:**
Users want to add labels, text, or icons to the connection lines between nodes (e.g., "YES/NO" for conditional flows, "2 weeks" for time, "depends on", etc.).

**Root Cause:**
React Flow supports edge labels natively, but the current implementation doesn't expose a UI for adding/editing them.

**React Flow Edge Label Support:**

1. **Basic Label (Built-in)**:
```tsx
const edge = {
  id: 'e1-2',
  source: '1',
  target: '2',
  label: 'YES ✅',
  labelStyle: { fill: '#10b981', fontWeight: 600 },
  labelBgStyle: { fill: 'white' },
};
```

2. **Custom Edge with Label** (Advanced):
```tsx
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

function CustomEdge({ id, sourceX, sourceY, targetX, targetY, data, ... }) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, ...
  });

  return (
    <>
      <BaseEdge path={edgePath} ... />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            border: '1px solid #ddd',
            cursor: 'pointer',
            pointerEvents: 'all',
          }}
          onClick={() => console.log('Edge label clicked')}
        >
          {data?.label || 'Connection'}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
```

**Solution Options:**

#### **Option A: Simple Label (Quick Win)**
Add a UI in the `Studio2Sidebar` to edit edge labels when an edge is selected:

1. Detect when an edge is selected:
```tsx
const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

const onSelectionChange = useCallback(({ nodes: selNodes, edges: selEdges }) => {
  if (selEdges.length === 1) {
    setSelectedEdge(selEdges[0]);
  } else {
    setSelectedEdge(null);
  }
}, []);
```

2. Show edge editor in sidebar:
```tsx
{selectedEdge && (
  <div className="edge-editor">
    <Label>Connection Label</Label>
    <Input
      value={selectedEdge.label || ''}
      onChange={(e) => {
        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === selectedEdge.id
              ? { ...edge, label: e.target.value }
              : edge
          )
        );
      }}
      placeholder="e.g., YES, depends on, 2 weeks"
    />
  </div>
)}
```

#### **Option B: Custom Edge Component (Advanced)**
Create a custom edge type with:
- Editable labels (double-click to edit)
- Icon support
- Conditional styling (YES/NO, colors)
- Position control (start/middle/end)

This requires:
1. Creating `src/components/diagram/edges/LabeledEdge.tsx`
2. Registering it in `edgeTypes`
3. Adding UI to configure edge properties

---

## 📋 **Implementation Priority**

### **P0 (Critical - Fix Now)**
1. ✅ **Issue 1**: Fix icon node showing raw icon ID
   - **Effort**: 5 minutes
   - **Impact**: High (UX bug)

2. ✅ **Issue 2**: Enable edge deletion
   - **Effort**: 15 minutes
   - **Impact**: High (missing core functionality)

### **P1 (Important - Next Sprint)**
3. **Issue 3 - Option A**: Add basic edge labels
   - **Effort**: 1-2 hours
   - **Impact**: Medium (nice-to-have feature)

### **P2 (Enhancement - Future)**
4. **Issue 3 - Option B**: Custom edge component with advanced features
   - **Effort**: 4-6 hours
   - **Impact**: Low (premium feature)

---

## 🛠️ **Recommended Fixes**

### **Fix 1: Icon Node Title Fallback**

**File**: `src/components/diagram/nodes/IconNode.tsx`

**Change**:
```tsx
// OLD:
<div style={{ fontWeight: 700 }}>{d.title || d.icon}</div>

// NEW (Option 1 - Empty):
<div style={{ fontWeight: 700 }}>{d.title || ''}</div>

// NEW (Option 2 - Conditional render):
{d.title && <div style={{ fontWeight: 700 }}>{d.title}</div>}
```

---

### **Fix 2: Enable Edge Deletion**

**File**: `src/pages/MindmapStudio2.tsx`

**Changes**:

1. Add `selectable: true` to `defaultEdgeOptions`:
```tsx
defaultEdgeOptions={{
  type: getReactFlowEdgeType(edgeType),
  animated: false,
  selectable: true, // ADD THIS
  markerEnd: {
    type: 'arrowclosed',
    color: '#64748b',
  },
  style: { 
    stroke: '#64748b', 
    strokeWidth: 2,
    strokeDasharray: edgeStyle === 'dashed' ? '5,5' : edgeStyle === 'dotted' ? '2,2' : undefined,
  },
}}
```

2. Add visual feedback for selected edges (optional but recommended):
```tsx
// Add to ReactFlow props:
<ReactFlow
  ...
  connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
  defaultEdgeOptions={{
    ...
    style: { 
      stroke: '#64748b', 
      strokeWidth: 2,
    },
  }}
  // This will be applied to selected edges automatically
  edgesFocusable={true}
  edgesReconnectable={true}
/>
```

3. Add a "Delete Connection" button (optional):
```tsx
// In toolbar, after other buttons:
{(() => {
  const selectedEdges = edges.filter(e => e.selected);
  return selectedEdges.length > 0 ? (
    <Button 
      size="sm" 
      variant="destructive"
      onClick={() => {
        setEdges((eds) => eds.filter(e => !e.selected));
      }}
    >
      🗑️ Delete Connection ({selectedEdges.length})
    </Button>
  ) : null;
})()}
```

---

### **Fix 3: Add Edge Labels with Icons (Option A - ENHANCED)**

**File**: `src/pages/MindmapStudio2.tsx`

**Changes**:

1. Track selected edge:
```tsx
const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

const onSelectionChange = useCallback(({ nodes: selNodes, edges: selEdges }) => {
  setSelectedNodeIds(selNodes.map(n => n.id));
  
  // Track selected edge
  if (selEdges.length === 1) {
    setSelectedEdge(selEdges[0]);
  } else {
    setSelectedEdge(null);
  }
}, []);
```

2. Pass `selectedEdge` to `Studio2Sidebar`:
```tsx
<Studio2Sidebar
  selectedNode={sidebarNode}
  selectedEdge={selectedEdge} // ADD THIS
  onClose={() => {
    setSidebarNode(null);
    setSelectedEdge(null);
  }}
  onUpdate={handleSidebarUpdate}
  onUpdateEdge={(edgeId, data) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId ? { ...edge, ...data } : edge
      )
    );
  }}
  onAddIconNode={addIconifyNode}
/>
```

**File**: `src/components/mindmap/Studio2Sidebar.tsx`

**Changes**:

1. Update interface:
```tsx
interface Studio2SidebarProps {
  selectedNode: Node | null;
  selectedEdge?: Edge | null; // ADD THIS
  onClose: () => void;
  onUpdate: (nodeId: string, data: Partial<any>) => void;
  onUpdateEdge?: (edgeId: string, data: Partial<Edge>) => void; // ADD THIS
  onAddIconNode?: (title: string, icon: string, color?: string) => void;
}
```

2. Add edge editor UI:
```tsx
export default function Studio2Sidebar({ 
  selectedNode, 
  selectedEdge, 
  onClose, 
  onUpdate, 
  onUpdateEdge,
  onAddIconNode 
}: Studio2SidebarProps) {
  // If edge is selected, show edge editor
  if (selectedEdge && onUpdateEdge) {
    return (
      <div className="fixed right-0 top-0 h-screen w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col">
        <div className="p-4 border-b border-border bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">🔗 Connection Details</h2>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <Label>Connection Label</Label>
            <Input
              value={selectedEdge.label || ''}
              onChange={(e) => onUpdateEdge(selectedEdge.id, { label: e.target.value })}
              placeholder="e.g., YES, depends on, 2 weeks"
            />
          </div>
          
          {/* Connection Icons - 20 popular icons */}
          <div>
            <Label>Connection Icons</Label>
            <div className="grid grid-cols-4 gap-2">
              {/* Arrows, symbols, etc. using Iconify */}
            </div>
          </div>
          
          {/* Conditional/Decision Labels */}
          <div>
            <Label>Conditional / Decision</Label>
            <div className="grid grid-cols-2 gap-2">
              {['✅ YES', '❌ NO', '✓ TRUE', '✗ FALSE', '↗️ IF', '↘️ ELSE', '1️⃣ Option 1', '2️⃣ Option 2'].map(...)}
            </div>
          </div>
          
          {/* Relationship Labels */}
          <div>
            <Label>Relationships</Label>
            <div className="grid grid-cols-2 gap-2">
              {['➡️ Leads to', '🔄 Depends on', '⚡ Triggers', '🎯 Influences', '📤 Sends to', '📥 Receives from', ...].map(...)}
            </div>
          </div>
          
          {/* Time/Cost/Priority Labels */}
          <div>
            <Label>Time / Cost / Priority</Label>
            <div className="grid grid-cols-2 gap-2">
              {['📅 2 weeks', '⏱️ 3 days', '💰 $5,000', '📊 High', '🔥 Urgent', '👤 John', ...].map(...)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ... rest of node editor code
}
```

---

## 📊 **Testing Checklist**

### **Issue 1: Icon Node Title**
- [ ] Create an icon node (Docker, K8s, etc.)
- [ ] Double-click to open sidebar
- [ ] Clear the title field completely
- [ ] Save changes
- [ ] **Expected**: Node shows only the icon, no text
- [ ] **Actual**: (test and report)

### **Issue 2: Edge Deletion**
- [ ] Create two nodes
- [ ] Connect them with an edge
- [ ] Click the edge (should highlight/select)
- [ ] Press `Delete` or `Backspace` key
- [ ] **Expected**: Edge is removed
- [ ] **Actual**: (test and report)
- [ ] Try with multiple edges selected (Shift+Click)
- [ ] Try the "Delete Connection" button (if implemented)

### **Issue 3: Edge Labels**
- [ ] Create two nodes with a connection
- [ ] Click the edge to select it
- [ ] Sidebar should show "Connection Details"
- [ ] Enter a label (e.g., "YES")
- [ ] **Expected**: Label appears on the connection line
- [ ] **Actual**: (test and report)
- [ ] Try quick label buttons
- [ ] Try with different edge types (bezier, straight, step)

---

## 🔗 **Related Documentation**

- [React Flow Edge Documentation](https://reactflow.dev/api-reference/types/edge)
- [React Flow Custom Edges](https://reactflow.dev/examples/edges/custom-edge)
- [React Flow Edge Label Renderer](https://reactflow.dev/api-reference/components/edge-label-renderer)
- [React Flow onEdgesChange](https://reactflow.dev/api-reference/react-flow#on-edges-change)

---

## 📝 **Notes**

1. **Edge Deletion**: React Flow handles this automatically through `onEdgesChange`. If it's not working, there might be a conflict with keyboard event handlers or the edges are not selectable.

2. **Edge Labels**: React Flow supports labels natively via the `label` property on edges. For more advanced use cases (icons, custom styling, click handlers), use `EdgeLabelRenderer` with a custom edge component.

3. **Performance**: For large diagrams (100+ nodes), consider using `memo()` for custom edge components and avoid re-rendering all edges when only one changes.

4. **Accessibility**: Ensure edge labels are keyboard-accessible and screen-reader friendly.

---

## ✅ **Next Steps**

1. Implement Fix 1 (Icon Node Title) - 5 minutes
2. Implement Fix 2 (Edge Deletion) - 15 minutes
3. Test both fixes thoroughly
4. Decide on edge label implementation (Option A vs B)
5. If Option A, implement Fix 3 - 1-2 hours
6. Update user documentation with new features

