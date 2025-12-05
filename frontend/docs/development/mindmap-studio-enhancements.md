# Mindmap Studio Enhancement Plan
**Research & Analysis of `mdtauri-main` Vue App**

---

## 📊 Executive Summary

After deep analysis of the `@mdtauri-main/` Vue/Tauri desktop app, I've identified **25+ powerful features** that should be migrated and enhanced in `@mdreader-main/`. The Vue app has a mature mindmap system with AI integration, multiple layouts, professional rendering, and project management capabilities that we're currently missing.

**Current State**:
- ✅ Basic D3 mindmap with milestone grouping
- ✅ Node drag, resize milestones, PM fields
- ✅ Local storage persistence

**Gap Analysis**:
- ❌ No AI-powered mindmap generation
- ❌ No automatic layout algorithms (Radial, Tree, Force, Concentric)
- ❌ No multi-format export (Mermaid, JSON, Markdown, PNG, SVG)
- ❌ No node relationship AI suggestions
- ❌ No advanced interactions (zoom, pan, multi-select, batch operations)
- ❌ Limited PM functionality compared to Vue app

---

## 🔍 Research Findings

### **1. Vue App Architecture**

#### **Component Structure**
```
MindmapPanel.vue (Main Container)
  ├── MindmapCanvasPro.vue (Advanced Canvas)
  │   ├── D3.js Professional Rendering
  │   ├── Shape Registry (Circle, Square, Diamond)
  │   ├── Layout Engine (Radial, Tree, Concentric, Force)
  │   ├── Zoom & Pan System
  │   ├── Milestone Selection & Grouping
  │   └── Context Menus & Toolbars
  │
  ├── useMindmap.js (Composable)
  │   ├── Generation from Headings
  │   ├── Generation from Selection
  │   ├── Multi-format Export
  │   └── State Management
  │
  └── useAI.js (AI Composable)
      ├── AI Mindmap Generation
      ├── Diagram Enhancement
      ├── Auto-fix Validation
      └── Template System
```

#### **State Management (Pinia)**
```javascript
// mdtauri-main/src/stores/mindmap.js
{
  nodes: [
    {
      id, x, y, text,
      metadata: {
        description, status, priority, owner,
        startDate, endDate, duration
      }
    }
  ],
  connections: [],
  milestones: [
    {
      id, title, groupedNodes,
      bounds: { x, y, width, height },
      metadata: { PM fields }
    }
  ],
  interactionMode: 'select' | 'add_node' | 'add_milestone'
}
```

---

### **2. Key Features in Vue App**

#### **A. Mindmap Generation**
| Feature | Current Status | Implementation |
|---------|---------------|----------------|
| **From Headings** | ❌ Missing | Extract `# ## ###` hierarchy → Auto-layout |
| **From Selection** | ❌ Missing | NLP concept extraction → Mindmap structure |
| **AI Generation** | ❌ Missing | Prompt-based mindmap creation with templates |
| **Template System** | ❌ Missing | Project, Concept, Process, Learning, Business, Technical |

#### **B. Layout Algorithms**
| Layout | Description | Use Case |
|--------|-------------|----------|
| **Radial** | Circular concentric rings | Hierarchical data, central concept |
| **Tree** | Top-down or left-right | Org charts, file structures |
| **Concentric** | Nested circles | Layer relationships |
| **Force** | Physics-based | Network diagrams, organic layouts |

**Current**: We only have manual positioning with drag.

#### **C. Export Formats**
| Format | Description | Status |
|--------|-------------|--------|
| **Mermaid Flowchart** | `flowchart TD` syntax | ❌ |
| **Mermaid Mindmap** | `mindmap` syntax | ❌ |
| **Mermaid Graph** | `graph LR` syntax | ❌ |
| **Mermaid Sequence** | `sequenceDiagram` | ❌ |
| **Mermaid Class** | `classDiagram` | ❌ |
| **Markdown** | Hierarchical list | ❌ |
| **JSON** | Full data export | ❌ |
| **PNG** | Image export | ❌ |
| **SVG** | Vector export | ❌ |

**Current**: No export functionality.

#### **D. Advanced Interactions**
| Feature | Vue App | React App |
|---------|---------|-----------|
| Zoom In/Out | ✅ Mouse wheel, buttons | ❌ |
| Pan Canvas | ✅ Drag background | ❌ |
| Multi-Select | ✅ Shift+Click, Box select | ❌ |
| Batch Operations | ✅ Delete, Move, Group | ❌ |
| Keyboard Shortcuts | ✅ Enter, Tab, Delete, Arrows | ⚠️ Partial |
| Context Menus | ✅ Right-click options | ❌ |
| Node Shapes | ✅ Circle, Square, Diamond | ❌ |
| Connection Types | ✅ Hierarchy, Association, Flow | ❌ |
| Preserve Positions | ✅ On layout change | ❌ |

#### **E. AI Features**
| Feature | Description | Benefit |
|---------|-------------|---------|
| **AI Mindmap Generation** | Generate from description | Quick start from idea |
| **AI Node Expansion** | Expand node with sub-concepts | AI-assisted brainstorming |
| **AI Relationship Suggestions** | Suggest connections | Discover hidden relationships |
| **AI Diagram Validation** | Fix syntax errors | Quality assurance |
| **AI Enhancement** | Improve existing mindmap | Refinement suggestions |
| **Template-based Gen** | Project/Business/Tech templates | Domain-specific generation |

**Current**: We have `AIAssistantModal` but it's only for Mermaid diagram enhancement, not mindmap-specific.

#### **F. Project Management**
| Field | Vue App | React App |
|-------|---------|-----------|
| Description | ✅ Full text | ✅ |
| Status | ✅ Planned/In Progress/Done/Blocked | ✅ |
| Priority | ✅ Low/Medium/High/Critical | ✅ |
| Owner | ✅ String | ✅ |
| Start/End Dates | ✅ Date pickers | ✅ |
| Duration | ✅ Days calculation | ✅ |
| Progress % | ❌ Missing in Vue too | ❌ |
| Tags | ❌ Missing in Vue too | ❌ |
| Attachments | ❌ | ❌ |
| Comments | ❌ | ❌ |

---

### **3. Technical Implementation Details**

#### **A. D3.js Rendering System**
```javascript
// Vue app uses professional SVG rendering
const createNode = (svg, node, x, y) => {
  const nodeGroup = svg.append('g')
    .attr('class', 'node')
    .attr('transform', `translate(${x},${y})`)
    .attr('data-node-id', node.id)
  
  // Shape rendering (Circle, Square, Diamond)
  const shape = shapeRegistry.get(node.shape || 'circle')
  shape.render(nodeGroup, node)
  
  // Text rendering with wrapping
  const text = nodeGroup.append('text')
    .attr('class', 'node-text')
    .text(node.text)
    .call(wrapText, node.width - 20)
  
  // Drag behavior
  nodeGroup.call(d3.drag()
    .on('start', dragStart)
    .on('drag', dragging)
    .on('end', dragEnd))
  
  // Context menu
  nodeGroup.on('contextmenu', (e) => showContextMenu(e, node))
}
```

**Current**: We have basic D3 rendering but missing shape registry, text wrapping, context menus.

#### **B. Layout Algorithms**
```javascript
// Radial Layout
const renderRadialLayout = (svg, nodes, dimensions) => {
  const levels = groupBy(nodes, 'level')
  const maxLevel = Math.max(...Object.keys(levels))
  const radiusIncrement = 120
  
  Object.entries(levels).forEach(([level, nodesAtLevel]) => {
    const radius = level * radiusIncrement
    const angleStep = (2 * Math.PI) / nodesAtLevel.length
    
    nodesAtLevel.forEach((node, index) => {
      const angle = index * angleStep
      node.x = centerX + Math.cos(angle) * radius
      node.y = centerY + Math.sin(angle) * radius
      createNode(svg, node, node.x, node.y)
    })
  })
}

// Tree Layout
const renderTreeLayout = (svg, nodes, dimensions) => {
  const levels = groupBy(nodes, 'level')
  const levelHeight = dimensions.height / (maxLevel + 2)
  
  for (let level = 1; level <= maxLevel; level++) {
    const levelNodes = levels[level]
    const nodeSpacing = dimensions.width / (levelNodes.length + 1)
    
    levelNodes.forEach((node, index) => {
      node.x = (index + 1) * nodeSpacing
      node.y = startY + (level - 1) * levelHeight
      createNode(svg, node, node.x, node.y)
    })
  })
}
```

**Current**: We only have manual positioning.

#### **C. Milestone System**
```javascript
// Vue app's milestone rendering (lines 1394-1483)
const renderMilestones = (svg) => {
  const milestoneGroups = svg.selectAll('g.milestone')
    .data(milestones, d => d.id)
  
  const milestoneEnter = milestoneGroups.enter()
    .append('g')
    .attr('class', 'milestone')
  
  // Container rectangle
  milestoneEnter.append('rect')
    .attr('class', 'milestone-container')
    .attr('x', d => d.bounds.x)
    .attr('y', d => d.bounds.y)
    .attr('width', d => d.bounds.width)
    .attr('height', d => d.bounds.height)
    .attr('rx', 16)
    .attr('fill', 'rgba(99, 102, 241, 0.1)')
    .attr('stroke', '#6366f1')
    .attr('stroke-width', 3)
    .attr('stroke-dasharray', '10,5')
  
  // Title badge
  milestoneEnter.append('text')
    .attr('class', 'milestone-title')
    .attr('x', d => d.bounds.x + 12)
    .attr('y', d => d.bounds.y - 8)
    .text(d => d.title)
  
  // Drag behavior for container
  milestoneEnter.call(d3.drag()
    .on('start', milestoneDragStart)
    .on('drag', milestoneDragging)
    .on('end', milestoneDragEnd))
}
```

**Current**: We have milestone rendering but it's less polished and missing some features.

---

## 🎯 Enhancement Plan

### **Phase 1: Core Layout System** (Week 1)
**Priority: HIGH** | **Effort: Medium**

#### **1.1 Layout Engine**
- [ ] Create `LayoutEngine` class with algorithm registry
- [ ] Implement Radial layout (concentric circles)
- [ ] Implement Tree layout (hierarchical top-down)
- [ ] Implement Concentric layout (nested rings)
- [ ] Implement Force layout (physics-based)
- [ ] Add layout selector dropdown
- [ ] Add "Preserve manual positions" toggle
- [ ] Add "Auto-arrange" button

**Files to Create**:
```
src/services/mindmap/LayoutEngine.ts
src/services/mindmap/layouts/RadialLayout.ts
src/services/mindmap/layouts/TreeLayout.ts
src/services/mindmap/layouts/ConcentricLayout.ts
src/services/mindmap/layouts/ForceLayout.ts
```

**Acceptance Criteria**:
- User can switch between 4 layout modes
- Manual node positions are preserved when switching layouts
- Layouts are visually balanced and readable

---

### **Phase 2: Generation System** (Week 2)
**Priority: HIGH** | **Effort: High**

#### **2.1 Mindmap Generation**
- [ ] Port `MindmapGenerator.ts` enhancements from Vue app
- [ ] Add "Generate from Headings" button in Editor
- [ ] Add "Generate from Selection" with text selection
- [ ] Integrate with existing `MindmapPreviewModal`
- [ ] Add generation progress indicator
- [ ] Handle edge cases (no headings, empty selection)

#### **2.2 AI-Powered Generation**
- [ ] Create `MindmapAIService.ts`
- [ ] Add `generateAIMindmap()` method
- [ ] Add template system (Project, Concept, Process, Learning, Business, Technical)
- [ ] Add "AI Generate" button in studio toolbar
- [ ] Add prompt input dialog
- [ ] Add template selector
- [ ] Handle AI errors gracefully

**Files to Create/Modify**:
```
src/services/mindmap/MindmapAIService.ts
src/components/modals/AIMindmapGenerationModal.tsx
mdreader-main/src/services/MindmapGenerator.ts (enhance)
```

**Acceptance Criteria**:
- User can generate mindmap from document headings
- User can generate mindmap from selected text
- User can generate mindmap from AI prompt with templates
- Generation shows progress and handles errors

---

### **Phase 3: Export System** (Week 2)
**Priority: MEDIUM** | **Effort: Medium**

#### **3.1 Multi-Format Export**
- [ ] Create `MindmapExporter.ts` service
- [ ] Add Mermaid Flowchart export
- [ ] Add Mermaid Mindmap export
- [ ] Add Mermaid Graph export
- [ ] Add Markdown hierarchy export
- [ ] Add JSON export (full data)
- [ ] Add PNG export (canvas to image)
- [ ] Add SVG export (vector)
- [ ] Add "Export" dropdown in studio toolbar
- [ ] Add download functionality
- [ ] Add "Insert into Editor" functionality

**Files to Create**:
```
src/services/mindmap/MindmapExporter.ts
src/components/modals/ExportMindmapModal.tsx
```

**Acceptance Criteria**:
- User can export mindmap in 8+ formats
- User can download exported files
- User can insert Mermaid code into editor
- Export preserves all data and relationships

---

### **Phase 4: Advanced Interactions** (Week 3)
**Priority: MEDIUM** | **Effort: High**

#### **4.1 Zoom & Pan**
- [ ] Add mouse wheel zoom
- [ ] Add zoom in/out buttons
- [ ] Add pan on background drag
- [ ] Add zoom level indicator
- [ ] Add "Fit to Screen" button
- [ ] Add "Reset Zoom" button
- [ ] Preserve zoom/pan on layout change

#### **4.2 Multi-Select**
- [ ] Add Shift+Click multi-select
- [ ] Add Ctrl+Click toggle select
- [ ] Add box selection (drag on background)
- [ ] Add visual selection indicators
- [ ] Add "Select All" / "Clear Selection"
- [ ] Add batch operations (Delete, Move, Group into Milestone)

#### **4.3 Context Menus**
- [ ] Add node right-click menu (Edit, Delete, Add Child, AI Expand, Change Shape)
- [ ] Add milestone right-click menu (Edit, Delete, Ungroup, Add Task)
- [ ] Add canvas right-click menu (Add Node, Paste, Change Layout)
- [ ] Add connection right-click menu (Delete, Change Type)

#### **4.4 Keyboard Shortcuts**
- [ ] Enhance existing shortcuts (Enter, Tab, Delete)
- [ ] Add Arrow keys for navigation
- [ ] Add Ctrl+Z / Ctrl+Y for undo/redo
- [ ] Add Ctrl+A for select all
- [ ] Add Ctrl+D for duplicate
- [ ] Add Space+Drag for pan
- [ ] Add Escape to clear selection

**Files to Modify**:
```
mdreader-main/src/pages/MindmapStudio1.tsx (add zoom/pan/multi-select)
src/components/mindmap/ContextMenu.tsx (create)
src/hooks/useKeyboardShortcuts.ts (enhance)
```

**Acceptance Criteria**:
- User can zoom with mouse wheel
- User can pan by dragging background
- User can multi-select nodes
- User can batch delete/move/group
- User can access context menus
- Keyboard shortcuts work smoothly

---

### **Phase 5: AI Enhancements** (Week 4)
**Priority: HIGH** | **Effort: High**

#### **5.1 Node AI Actions**
- [ ] Add "AI Expand Node" (generate child concepts)
- [ ] Add "AI Rename Node" (suggest better names)
- [ ] Add "AI Summarize Subtree" (condense branch)
- [ ] Add "AI Suggest Connections" (find relationships)
- [ ] Add "AI Validate Structure" (check logic)
- [ ] Add "AI Enhance PM Fields" (auto-fill estimates, priorities)

#### **5.2 Mindmap AI Enhancement**
- [ ] Add "AI Review Mindmap" (suggestions for improvement)
- [ ] Add "AI Balance Layout" (optimize node placement)
- [ ] Add "AI Identify Gaps" (missing concepts/connections)
- [ ] Add "AI Generate Tasks" (convert concepts to actionable tasks)

**Files to Create**:
```
src/services/mindmap/MindmapAIEnhancer.ts
src/components/modals/AINodeActionModal.tsx
```

**Acceptance Criteria**:
- User can AI-expand any node
- User can get AI suggestions for connections
- AI actions integrate with guest credits system
- AI provides useful, contextual suggestions

---

### **Phase 6: Professional Rendering** (Week 3-4)
**Priority: MEDIUM** | **Effort: Medium**

#### **6.1 Shape System**
- [ ] Create shape registry
- [ ] Add Circle shape (current default)
- [ ] Add Square/Rectangle shape
- [ ] Add Diamond shape
- [ ] Add Hexagon shape
- [ ] Add Oval shape
- [ ] Add shape selector per node
- [ ] Add shape theme (apply to all)

#### **6.2 Connection Styling**
- [ ] Add connection type selector (Hierarchy, Association, Flow)
- [ ] Add curved connections (Bezier curves)
- [ ] Add connection labels
- [ ] Add connection arrowheads
- [ ] Add connection color coding

#### **6.3 Visual Enhancements**
- [ ] Add text wrapping for long labels
- [ ] Add node icons/emojis
- [ ] Add node color themes
- [ ] Add gradient backgrounds
- [ ] Add drop shadows
- [ ] Add animations (hover, selection)
- [ ] Add minimap for large mindmaps

**Files to Create**:
```
src/services/mindmap/shapes/ShapeRegistry.ts
src/services/mindmap/shapes/CircleShape.ts
src/services/mindmap/shapes/SquareShape.ts
src/services/mindmap/shapes/DiamondShape.ts
src/services/mindmap/ConnectionRenderer.ts
```

**Acceptance Criteria**:
- User can choose from 5+ node shapes
- Connections are visually distinct by type
- Text wraps properly in nodes
- Mindmap looks professional and polished

---

### **Phase 7: PM Enhancements** (Week 5)
**Priority: LOW** | **Effort: Low**

#### **7.1 Enhanced PM Fields**
- [ ] Add Progress % slider
- [ ] Add Tags (multi-select chips)
- [ ] Add Dependencies (node → node relationships)
- [ ] Add Attachments (file links)
- [ ] Add Comments thread
- [ ] Add Activity log (changes history)

#### **7.2 PM Views**
- [ ] Add Gantt chart view (timeline)
- [ ] Add Kanban board view (status columns)
- [ ] Add Calendar view (dates)
- [ ] Add List view (table)
- [ ] Add filtering by status/priority/owner
- [ ] Add sorting by various fields

**Files to Create**:
```
src/components/mindmap/NodeDetailsEnhanced.tsx
src/components/mindmap/views/GanttView.tsx
src/components/mindmap/views/KanbanView.tsx
```

**Acceptance Criteria**:
- PM fields are comprehensive
- Users can switch between views
- Filtering and sorting work correctly

---

### **Phase 8: Collaboration & Sharing** (Week 6)
**Priority: LOW** | **Effort: High**

#### **8.1 Sharing**
- [ ] Add "Share Mindmap" button
- [ ] Generate shareable link
- [ ] Add view-only mode
- [ ] Add embed code
- [ ] Add permission controls

#### **8.2 Templates Library**
- [ ] Create template gallery
- [ ] Add pre-built templates (Software Project, Marketing Plan, Study Guide, etc.)
- [ ] Add "Save as Template" functionality
- [ ] Add template preview
- [ ] Add template search/filter

**Files to Create**:
```
src/components/modals/ShareMindmapModal.tsx
src/pages/TemplateGallery.tsx
src/services/mindmap/TemplateService.ts
```

**Acceptance Criteria**:
- Users can share mindmaps
- View-only mode works
- Template gallery is populated
- Users can create custom templates

---

## 🛠️ Technical Architecture

### **Recommended Project Structure**
```
mdreader-main/src/
├── services/
│   └── mindmap/
│       ├── MindmapGenerator.ts (enhanced)
│       ├── MindmapAIService.ts (NEW)
│       ├── MindmapExporter.ts (NEW)
│       ├── MindmapAIEnhancer.ts (NEW)
│       ├── LayoutEngine.ts (NEW)
│       ├── ConnectionRenderer.ts (NEW)
│       ├── TemplateService.ts (NEW)
│       ├── layouts/
│       │   ├── RadialLayout.ts
│       │   ├── TreeLayout.ts
│       │   ├── ConcentricLayout.ts
│       │   └── ForceLayout.ts
│       └── shapes/
│           ├── ShapeRegistry.ts
│           ├── CircleShape.ts
│           ├── SquareShape.ts
│           └── DiamondShape.ts
│
├── components/
│   └── mindmap/
│       ├── MindmapCanvas.tsx (enhanced)
│       ├── MindNode.tsx (enhanced)
│       ├── MilestoneNode.tsx (enhanced)
│       ├── NodeDetailsEnhanced.tsx (NEW)
│       ├── ContextMenu.tsx (NEW)
│       ├── ToolbarMindmap.tsx (NEW)
│       ├── MiniMap.tsx (NEW)
│       └── views/
│           ├── GanttView.tsx
│           └── KanbanView.tsx
│
├── pages/
│   ├── MindmapStudio.tsx (main React Flow version)
│   ├── MindmapStudio1.tsx (D3 experimental)
│   └── TemplateGallery.tsx (NEW)
│
└── hooks/
    ├── useMindmapLayout.ts (NEW)
    ├── useMindmapAI.ts (NEW)
    ├── useMindmapExport.ts (NEW)
    └── useZoomPan.ts (NEW)
```

---

## 📋 Implementation Priorities

### **Must Have (MVP)**
1. ✅ Layout Engine (Radial, Tree)
2. ✅ Generation from Headings
3. ✅ Mermaid Export (Flowchart, Mindmap)
4. ✅ Zoom & Pan
5. ✅ Context Menus

### **Should Have (V1.0)**
6. ⚠️ AI Mindmap Generation
7. ⚠️ Multi-Select & Batch Operations
8. ⚠️ Shape System
9. ⚠️ AI Node Expansion
10. ⚠️ PNG/SVG Export

### **Nice to Have (V2.0)**
11. ◯ Force Layout
12. ◯ PM Views (Gantt, Kanban)
13. ◯ Collaboration Features
14. ◯ Template Gallery
15. ◯ Advanced AI (Suggest Connections, Validate)

---

## 🚀 Quick Wins (Do First)

### **1. Generation from Headings** (2 hours)
- Port logic from `useMindmap.js`
- Add button in Editor toolbar
- Open in MindmapStudio with auto-layout

### **2. Mermaid Export** (3 hours)
- Create `MindmapExporter.ts`
- Add `toMermaidFlowchart()` and `toMermaidMindmap()` methods
- Add Export dropdown in studio toolbar

### **3. Radial Layout** (4 hours)
- Implement radial algorithm
- Add layout selector
- Make it the default

### **4. Zoom & Pan** (3 hours)
- Add mouse wheel zoom
- Add background drag pan
- Add zoom controls

### **5. Context Menus** (4 hours)
- Right-click on nodes
- Add Edit, Delete, Add Child
- Add styling

---

## 📊 Success Metrics

### **User Engagement**
- **Mindmap Creation Rate**: Target 50% of editor sessions → create mindmap
- **AI Generation Usage**: Target 30% of mindmaps use AI
- **Export Rate**: Target 40% of mindmaps are exported
- **Average Nodes per Mindmap**: Target 12+ nodes

### **Feature Adoption**
- **Layout Changes**: Track which layouts are most used
- **AI Actions**: Track AI expand, suggestions, validation usage
- **PM Field Usage**: Track which fields are filled
- **Multi-Select**: Track batch operations

### **Performance**
- **Render Time**: < 100ms for 50 nodes
- **AI Response**: < 5s for mindmap generation
- **Export Time**: < 2s for all formats
- **Drag Smoothness**: 60 FPS

---

## 🎨 UI/UX Mockups

### **Enhanced Toolbar**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🧠 Mindmap Studio                              [Guest: 3 runs]  │
├─────────────────────────────────────────────────────────────────┤
│ [+ Node] [🎯 Milestone] [🤖 AI Generate]  [⚙️ Layout ▼]         │
│                                                                  │
│ [Radial] [Tree] [Force] [Concentric]   [○ ◻ ◇] Shapes          │
│                                                                  │
│ [🔍−] 100% [🔍+]  [📊 View ▼]  [📤 Export ▼]  [⋯ More]          │
└─────────────────────────────────────────────────────────────────┘
```

### **Context Menu (Node)**
```
┌─────────────────────────┐
│ ✏️  Edit Label           │
│ ➕  Add Child            │
│ 🎨  Change Shape        │
│ 🤖  AI Expand           │
│ ──────────────────      │
│ 📋  Copy                 │
│ ✂️  Cut                  │
│ 🗑️  Delete              │
└─────────────────────────┘
```

### **AI Generation Modal**
```
┌──────────────────────────────────────────────────┐
│ 🤖 AI Mindmap Generation              [×]        │
├──────────────────────────────────────────────────┤
│                                                   │
│ Template:                                         │
│ ┌────────────────────────────────────────────┐  │
│ │ [Project] [Concept] [Process] [Learning]   │  │
│ │ [Business] [Technical]                     │  │
│ └────────────────────────────────────────────┘  │
│                                                   │
│ Description:                                      │
│ ┌────────────────────────────────────────────┐  │
│ │ Build a mobile app for task management    │  │
│ │ with team collaboration features          │  │
│ └────────────────────────────────────────────┘  │
│                                                   │
│ Options:                                          │
│ Max Nodes: [15 ▼]    Include Details: [✓]       │
│                                                   │
│ ╔══════════════════════════════════════════╗   │
│ ║  This will use 1 AI credit               ║   │
│ ║  You have 3 credits remaining            ║   │
│ ╚══════════════════════════════════════════╝   │
│                                                   │
│              [Cancel]  [🤖 Generate]             │
└──────────────────────────────────────────────────┘
```

---

## 📝 Next Steps

### **Immediate Actions (This Week)**
1. ✅ **Document Research** (Done - this file)
2. ⏭️ **Review with User** - Get feedback on priorities
3. ⏭️ **Create Phase 1 Tickets** - Break down Layout Engine work
4. ⏭️ **Start RadialLayout Implementation** - First quick win

### **Questions for User**
1. **Priority**: Should we focus on AI features first or layout/export features?
2. **Scope**: Do we want to maintain both `/studio` (React Flow) and `/studio1` (D3) or consolidate?
3. **Timeline**: What's the deadline for MVP vs. V1.0?
4. **Resources**: Are we working solo or can we parallelize work?

---

## 🔗 Reference Links

### **Vue App Files (Key References)**
- `mdtauri-main/src/components/MindmapCanvasPro.vue` - Main canvas implementation
- `mdtauri-main/src/components/MindmapPanel.vue` - Panel container
- `mdtauri-main/src/composables/useMindmap.js` - Mindmap logic
- `mdtauri-main/src/composables/useAI.js` - AI integration
- `mdtauri-main/src/services/MindmapGenerator.js` - Generation logic
- `mdtauri-main/src/services/AIService.js` - AI service
- `mdtauri-main/src/stores/mindmap.js` - State management

### **React App Files (Current State)**
- `mdreader-main/src/pages/MindmapStudio.tsx` - React Flow version
- `mdreader-main/src/pages/MindmapStudio1.tsx` - D3 experimental
- `mdreader-main/src/components/mindmap/MindmapCanvas.tsx` - React Flow canvas
- `mdreader-main/src/services/MindmapGenerator.ts` - Basic generation
- `mdreader-main/src/services/ai/AIService.ts` - AI service

---

## 📌 Conclusion

The Vue app has a **mature, feature-rich mindmap system** that we need to port to React. The key areas are:

1. **Layout Engine** - Professional auto-layout algorithms
2. **AI Integration** - Mindmap generation, node expansion, suggestions
3. **Export System** - Multi-format export (8+ formats)
4. **Advanced UI** - Zoom, pan, multi-select, context menus
5. **PM Features** - Enhanced project management fields and views

**Recommended Approach**: 
- Start with **Quick Wins** (Generation, Export, Radial Layout, Zoom/Pan)
- Then **AI Features** (highest user value)
- Then **Advanced Interactions** (better UX)
- Finally **PM & Collaboration** (power users)

**Estimated Timeline**: 
- MVP (Must Have): **2 weeks**
- V1.0 (Should Have): **4 weeks**
- V2.0 (Nice to Have): **6+ weeks**

Let's discuss priorities and get started! 🚀
