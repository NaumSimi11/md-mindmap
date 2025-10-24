# 🎨 Edge Styling System - Complete Guide

**Date:** October 24, 2025

---

## 🎯 **USER REQUEST**

1. ✅ Remove `confirm()` dialog from Auto-Connect (use AI Response panel instead)
2. 🎨 Understand current edge styling (animated lines for AI connections)
3. 🛠️ Add ability to customize edge color, shape, animation per connection

---

## 📊 **CURRENT EDGE SYSTEM**

### **1. Edge Type Dropdown**
**Location:** Top toolbar in MindmapStudio2

**Current Options:**
- `bezier` - Smooth curved lines (default)
- `smoothstep` - Smooth right-angle lines
- `straight` - Direct straight lines
- `step` - Sharp right-angle lines

**Code:**
```typescript
const [edgeType, setEdgeType] = useState<'smoothstep' | 'bezier' | 'straight' | 'step'>('bezier');
```

---

### **2. Edge Style (Dash Pattern)**
**Current Options:**
- `solid` - Solid line (default)
- `dashed` - Dashed line (`strokeDasharray: '5,5'`)
- `dotted` - Dotted line (`strokeDasharray: '2,2'`)

**Code:**
```typescript
const [edgeStyle, setEdgeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
```

---

### **3. AI-Generated Edges (Smart Connections)**
**Special Styling:**
```typescript
const newEdges: Edge[] = suggestions.map(s => ({
  id: `edge-${s.source}-${s.target}-${Date.now()}`,
  source: s.source,
  target: s.target,
  type: 'default', // Bezier curves
  label: s.reason.split(' ').slice(0, 3).join(' '), // Short label
  labelStyle: { 
    fill: '#3b82f6',      // Blue text
    fontSize: 10, 
    fontWeight: 600 
  },
  style: { 
    stroke: '#3b82f6',           // Blue line
    strokeWidth: 2,
    strokeDasharray: '5,5',      // Dashed pattern
  },
  markerEnd: { 
    type: 'arrowclosed', 
    color: '#3b82f6'             // Blue arrow
  },
  animated: true,                // ✨ ANIMATED!
  data: { 
    aiGenerated: true,           // Flag for identification
    reason: s.reason             // Store full reason
  },
}));
```

**Visual Result:**
- 🔵 Blue color (vs. gray for normal edges)
- ⚡ Animated (flowing dots)
- - - Dashed pattern
- 💬 Label with reason

---

## 🎨 **REACT FLOW EDGE PROPERTIES**

### **Complete Edge Object:**
```typescript
interface Edge {
  id: string;                    // Unique ID
  source: string;                // Source node ID
  target: string;                // Target node ID
  
  // SHAPE
  type?: string;                 // 'default', 'straight', 'step', 'smoothstep', 'simplebezier'
  
  // LABEL
  label?: string;                // Text on edge
  labelStyle?: CSSProperties;    // Label styling
  labelBgStyle?: CSSProperties;  // Label background
  labelBgPadding?: [number, number]; // Label padding
  labelBgBorderRadius?: number;  // Label border radius
  
  // APPEARANCE
  style?: {
    stroke?: string;             // Line color (e.g., '#3b82f6')
    strokeWidth?: number;        // Line thickness (e.g., 2)
    strokeDasharray?: string;    // Dash pattern (e.g., '5,5')
    strokeLinecap?: 'butt' | 'round' | 'square';
  };
  
  // ARROW
  markerStart?: {
    type: 'arrow' | 'arrowclosed';
    color?: string;
    width?: number;
    height?: number;
  };
  markerEnd?: {
    type: 'arrow' | 'arrowclosed';
    color?: string;
    width?: number;
    height?: number;
  };
  
  // ANIMATION
  animated?: boolean;            // Flowing dots animation
  
  // INTERACTION
  selectable?: boolean;          // Can be selected
  deletable?: boolean;           // Can be deleted
  focusable?: boolean;           // Can receive focus
  
  // CUSTOM DATA
  data?: any;                    // Store custom data
}
```

---

## 🎨 **EDGE STYLING EXAMPLES**

### **1. Normal Hierarchy Edge (Current)**
```typescript
{
  type: 'bezier',
  style: {
    stroke: '#64748b',      // Gray
    strokeWidth: 2,
  },
  markerEnd: {
    type: 'arrowclosed',
    color: '#64748b',
  },
  animated: false,
}
```

---

### **2. AI Smart Connection (Current)**
```typescript
{
  type: 'default',
  style: {
    stroke: '#3b82f6',      // Blue
    strokeWidth: 2,
    strokeDasharray: '5,5', // Dashed
  },
  markerEnd: {
    type: 'arrowclosed',
    color: '#3b82f6',
  },
  animated: true,           // ✨ Animated!
  label: 'depends on',
}
```

---

### **3. Important/Critical Connection**
```typescript
{
  type: 'straight',
  style: {
    stroke: '#ef4444',      // Red
    strokeWidth: 3,         // Thicker
  },
  markerEnd: {
    type: 'arrowclosed',
    color: '#ef4444',
  },
  animated: true,
  label: '🔥 Critical',
}
```

---

### **4. Success/Completion Flow**
```typescript
{
  type: 'smoothstep',
  style: {
    stroke: '#10b981',      // Green
    strokeWidth: 2,
    strokeDasharray: '10,5', // Long dashes
  },
  markerEnd: {
    type: 'arrowclosed',
    color: '#10b981',
  },
  animated: false,
  label: '✅ Done',
}
```

---

### **5. Weak/Optional Connection**
```typescript
{
  type: 'bezier',
  style: {
    stroke: '#9ca3af',      // Light gray
    strokeWidth: 1,         // Thin
    strokeDasharray: '2,2', // Dotted
  },
  markerEnd: {
    type: 'arrow',          // Open arrow
    color: '#9ca3af',
  },
  animated: false,
  label: 'optional',
}
```

---

### **6. Bidirectional Connection**
```typescript
{
  type: 'straight',
  style: {
    stroke: '#8b5cf6',      // Purple
    strokeWidth: 2,
  },
  markerStart: {            // Arrow at start
    type: 'arrowclosed',
    color: '#8b5cf6',
  },
  markerEnd: {              // Arrow at end
    type: 'arrowclosed',
    color: '#8b5cf6',
  },
  animated: false,
  label: '⇄ Sync',
}
```

---

## 🛠️ **HOW TO CUSTOMIZE EDGES**

### **Option 1: Per-Edge Styling (Manual)**

**In Studio2Sidebar, add edge styling controls:**

```typescript
// Add to Studio2Sidebar.tsx
<div>
  <Label>Edge Color</Label>
  <Select 
    value={edgeColor} 
    onValueChange={(color) => {
      onUpdateEdge(selectedEdge.id, {
        style: { ...selectedEdge.style, stroke: color },
        markerEnd: { ...selectedEdge.markerEnd, color },
      });
    }}
  >
    <SelectItem value="#64748b">Gray (Default)</SelectItem>
    <SelectItem value="#3b82f6">Blue (AI)</SelectItem>
    <SelectItem value="#ef4444">Red (Critical)</SelectItem>
    <SelectItem value="#10b981">Green (Success)</SelectItem>
    <SelectItem value="#f59e0b">Orange (Warning)</SelectItem>
    <SelectItem value="#8b5cf6">Purple (Info)</SelectItem>
  </Select>
</div>

<div>
  <Label>Line Style</Label>
  <Select 
    value={lineStyle} 
    onValueChange={(style) => {
      const dashArray = {
        solid: undefined,
        dashed: '5,5',
        dotted: '2,2',
        longDash: '10,5',
      }[style];
      
      onUpdateEdge(selectedEdge.id, {
        style: { ...selectedEdge.style, strokeDasharray: dashArray },
      });
    }}
  >
    <SelectItem value="solid">Solid</SelectItem>
    <SelectItem value="dashed">Dashed</SelectItem>
    <SelectItem value="dotted">Dotted</SelectItem>
    <SelectItem value="longDash">Long Dash</SelectItem>
  </Select>
</div>

<div>
  <Label className="flex items-center gap-2">
    <input 
      type="checkbox" 
      checked={animated}
      onChange={(e) => {
        onUpdateEdge(selectedEdge.id, {
          animated: e.target.checked,
        });
      }}
    />
    Animated (flowing dots)
  </Label>
</div>

<div>
  <Label>Line Thickness</Label>
  <input 
    type="range" 
    min="1" 
    max="5" 
    value={thickness}
    onChange={(e) => {
      onUpdateEdge(selectedEdge.id, {
        style: { ...selectedEdge.style, strokeWidth: Number(e.target.value) },
      });
    }}
  />
</div>
```

---

### **Option 2: Edge Type Presets**

**Add preset styles for common connection types:**

```typescript
// In MindmapStudio2.tsx
const EDGE_PRESETS = {
  hierarchy: {
    style: { stroke: '#64748b', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#64748b' },
    animated: false,
  },
  aiSuggestion: {
    style: { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
    animated: true,
  },
  critical: {
    style: { stroke: '#ef4444', strokeWidth: 3 },
    markerEnd: { type: 'arrowclosed', color: '#ef4444' },
    animated: true,
  },
  success: {
    style: { stroke: '#10b981', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#10b981' },
    animated: false,
  },
  optional: {
    style: { stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '2,2' },
    markerEnd: { type: 'arrow', color: '#9ca3af' },
    animated: false,
  },
};

// Apply preset
const applyEdgePreset = (edgeId: string, preset: keyof typeof EDGE_PRESETS) => {
  setEdges((eds) =>
    eds.map((edge) =>
      edge.id === edgeId
        ? { ...edge, ...EDGE_PRESETS[preset] }
        : edge
    )
  );
};
```

---

### **Option 3: Context Menu for Edges**

**Right-click on edge to style it:**

```typescript
// Add to ReactFlow component
<ReactFlow
  // ... other props
  onEdgeContextMenu={(event, edge) => {
    event.preventDefault();
    showEdgeContextMenu(edge, event.clientX, event.clientY);
  }}
>
```

**Context Menu:**
```tsx
<ContextMenu>
  <ContextMenuItem onClick={() => applyEdgePreset(edge.id, 'aiSuggestion')}>
    🤖 AI Style (Blue, Animated)
  </ContextMenuItem>
  <ContextMenuItem onClick={() => applyEdgePreset(edge.id, 'critical')}>
    🔥 Critical (Red, Thick)
  </ContextMenuItem>
  <ContextMenuItem onClick={() => applyEdgePreset(edge.id, 'success')}>
    ✅ Success (Green)
  </ContextMenuItem>
  <ContextMenuItem onClick={() => applyEdgePreset(edge.id, 'optional')}>
    ⚪ Optional (Gray, Dotted)
  </ContextMenuItem>
</ContextMenu>
```

---

## 🎨 **COLOR PALETTE**

### **Semantic Colors:**
```typescript
const EDGE_COLORS = {
  // Status
  default: '#64748b',    // Gray - Normal hierarchy
  ai: '#3b82f6',         // Blue - AI suggestions
  critical: '#ef4444',   // Red - Critical path
  success: '#10b981',    // Green - Completed
  warning: '#f59e0b',    // Orange - Warning
  info: '#8b5cf6',       // Purple - Information
  
  // Relationships
  depends: '#3b82f6',    // Blue - Dependency
  blocks: '#ef4444',     // Red - Blocking
  enables: '#10b981',    // Green - Enabling
  optional: '#9ca3af',   // Light gray - Optional
  
  // Time
  past: '#6b7280',       // Dark gray - Past
  current: '#3b82f6',    // Blue - Current
  future: '#a78bfa',     // Light purple - Future
};
```

---

## 🚀 **RECOMMENDED IMPLEMENTATION**

### **Phase 1: Fix Auto-Connect Dialog** ✅
Remove `confirm()` and let AI Response panel handle it.

### **Phase 2: Add Edge Styling to Sidebar** 🎨
Add color, thickness, animation, dash pattern controls when edge is selected.

### **Phase 3: Add Edge Presets** 🎯
Quick buttons for common styles (AI, Critical, Success, etc.)

### **Phase 4: Context Menu** 🖱️
Right-click edge to apply preset styles.

---

## 📝 **NEXT STEPS**

1. ✅ Remove `confirm()` from Auto-Connect
2. 🎨 Add edge styling controls to Studio2Sidebar
3. 🎯 Create edge preset system
4. 🖱️ Add edge context menu

**Want me to implement these?**

