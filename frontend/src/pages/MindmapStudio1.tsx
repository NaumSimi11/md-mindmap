import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Plus, FileText, Upload, Layout } from "lucide-react";
import * as d3 from "d3";
import { layoutEngine } from "@/services/mindmap/LayoutEngine";
import { radialLayout } from "@/services/mindmap/layouts/RadialLayout";
import { treeVerticalLayout, treeHorizontalLayout } from "@/services/mindmap/layouts/TreeLayout";
import { forceLayout } from "@/services/mindmap/layouts/ForceLayout";
import { mindmapExporter, type ExportFormat } from "@/services/mindmap/MindmapExporter";
import { ContextMenu, type ContextMenuItem } from "@/components/mindmap/ContextMenu";
import { mindmapAIService, type MindmapContext } from "@/services/mindmap/MindmapAIService";
import { mindmapQualityAnalyzer, type QualityReport } from "@/services/mindmap/MindmapQualityAnalyzer";
import { mindmapTemplateService, type MindmapTemplate } from "@/services/mindmap/MindmapTemplates";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  fx?: number;
  fy?: number;
  type?: 'node' | 'milestone';
  width?: number;
  height?: number;
  memberOf?: string;
  startMouseX?: number;
  startMouseY?: number;
  originalX?: number; // For milestone dragging
  originalY?: number; // For milestone dragging
  // PM Fields
  description?: string;
  status?: 'planned' | 'in-progress' | 'done' | 'blocked';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  owner?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
}

interface Link {
  source: string | Node;
  target: string | Node;
}

interface Milestone {
  id: string;
  title: string;
  groupedNodes: string[];
  bounds: { x: number; y: number; width: number; height: number };
  // PM Fields
  description?: string;
  status?: 'planned' | 'in-progress' | 'done' | 'blocked';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  owner?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
}

export default function MindmapStudio1() {
  const [title, setTitle] = useState("Mindmap Studio (D3 EXP)");
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'root', label: 'Root', x: 400, y: 300, type: 'node' },
    { id: 'node1', label: 'Node 1', x: 300, y: 200, type: 'node' },
    { id: 'node2', label: 'Node 2', x: 500, y: 200, type: 'node' },
    { id: 'node3', label: 'Node 3', x: 400, y: 150, type: 'node' },
  ]);
  const [links] = useState<Link[]>([
    { source: 'root', target: 'node1' },
    { source: 'root', target: 'node2' },
    { source: 'root', target: 'node3' },
  ]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneMode, setMilestoneMode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionCurrent, setSelectionCurrent] = useState({ x: 0, y: 0 });
  
  // Details sidebar state
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  
  // Milestone selection/resize state
  const [selectedMilestoneForResize, setSelectedMilestoneForResize] = useState<string | null>(null);
  
  // Layout state
  const [currentLayout, setCurrentLayout] = useState<string>('manual');
  
  // Export state
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [showMinimap, setShowMinimap] = useState(true);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);
  
  // AI state
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [showQualityReport, setShowQualityReport] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  
  // Register layouts on mount
  useEffect(() => {
    layoutEngine.register('radial', radialLayout);
    layoutEngine.register('tree-vertical', treeVerticalLayout);
    layoutEngine.register('tree-horizontal', treeHorizontalLayout);
    layoutEngine.register('force', forceLayout);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;

      // Delete selected node
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNodeId) {
          const node = nodes.find(n => n.id === selectedNodeId);
          if (node && confirm(`Delete node "${node.label}"?`)) {
            setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
            setSelectedNodeId(null);
            setShowSidebar(false);
          }
          event.preventDefault();
        }
      }

      // Escape - Close sidebar/deselect
      if (event.key === 'Escape') {
        setShowSidebar(false);
        setSelectedNodeId(null);
        setSelectedMilestoneId(null);
        setSelectedMilestoneForResize(null);
        setContextMenu(null);
        event.preventDefault();
      }

      // Ctrl/Cmd + Z - Undo (placeholder)
      if (ctrl && event.key === 'z' && !shift) {
        event.preventDefault();
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo (placeholder)
      if ((ctrl && shift && event.key === 'z') || (ctrl && event.key === 'y')) {
        event.preventDefault();
      }

      // Ctrl/Cmd + A - Select all (placeholder)
      if (ctrl && event.key === 'a') {
        event.preventDefault();
      }

      // Ctrl/Cmd + D - Duplicate (placeholder)
      if (ctrl && event.key === 'd') {
        if (selectedNodeId) {
          const node = nodes.find(n => n.id === selectedNodeId);
          if (node) {
            const duplicateNode: Node = {
              ...node,
              id: `node-${Date.now()}`,
              label: `${node.label} (Copy)`,
              x: node.x + 50,
              y: node.y + 50,
            };
            setNodes(prev => [...prev, duplicateNode]);
          }
        }
        event.preventDefault();
      }

      // Ctrl/Cmd + E - Export
      if (ctrl && event.key === 'e') {
        setShowExportMenu(true);
        event.preventDefault();
      }

      // Ctrl/Cmd + + - Zoom in
      if (ctrl && (event.key === '+' || event.key === '=')) {
        handleZoomIn();
        event.preventDefault();
      }

      // Ctrl/Cmd + - - Zoom out
      if (ctrl && event.key === '-') {
        handleZoomOut();
        event.preventDefault();
      }

      // Ctrl/Cmd + 0 - Reset zoom
      if (ctrl && event.key === '0') {
        handleResetZoom();
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedMilestoneId, nodes]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;

    // Create a main group for zoom & pan
    const mainGroup = svg.append("g")
      .attr("class", "main-group");
    
    // Apply current transform
    mainGroup.attr("transform", `translate(${transform.x},${transform.y}) scale(${transform.k})`);

    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4]) // Min/max zoom
      .on("zoom", (event) => {
        const newTransform = event.transform;
        mainGroup.attr("transform", newTransform);
        setTransform({ x: newTransform.x, y: newTransform.y, k: newTransform.k });
        setZoomLevel(newTransform.k);
      });

    // Apply zoom to SVG
    svg.call(zoom as any);
    
    // Add canvas context menu
    svg.on("contextmenu", function(event) {
      // Only show if not on a node or milestone
      const target = event.target as SVGElement;
      if (target.tagName === 'svg' || target.classList.contains('main-group')) {
        showCanvasContextMenu(event);
      }
    });

    // No simulation - static positioning

    // Draw links with curved paths (Bezier curves)
    const link = mainGroup.append("g")
      .selectAll("path")
      .data(links)
      .enter().append("path")
      .attr("fill", "none")
      .attr("stroke", "#64748b")
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", 2)
      .attr("d", (d: any) => {
        const source = nodes.find(n => n.id === d.source);
        const target = nodes.find(n => n.id === d.target);
        if (!source || !target) return '';

        const sx = source.x;
        const sy = source.y;
        const tx = target.x;
        const ty = target.y;

        // Calculate control points for smooth curve
        const dx = tx - sx;
        const dy = ty - sy;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        // Use quadratic Bezier curve for smooth, organic look
        const midX = (sx + tx) / 2;
        const midY = (sy + ty) / 2;
        
        // Offset control point perpendicular to the line
        const offsetX = -dy * 0.2;
        const offsetY = dx * 0.2;
        
        return `M ${sx},${sy} Q ${midX + offsetX},${midY + offsetY} ${tx},${ty}`;
      })
      .style("filter", "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.1))");

    // Define gradients for nodes
    const defs = mainGroup.append("defs");
    
    const gradient = defs.append("radialGradient")
      .attr("id", "node-gradient")
      .attr("cx", "30%")
      .attr("cy", "30%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#6366f1")
      .attr("stop-opacity", 1);
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#4f46e5")
      .attr("stop-opacity", 1);

    // Draw regular nodes
    const node = mainGroup.append("g")
      .selectAll("g.node")
      .data(nodes.filter(n => n.type === 'node'))
      .enter().append("g")
      .attr("class", "node")
      .style("cursor", "move")
      .on("contextmenu", function(event, d) {
        showNodeContextMenu(event, d);
      })
      .on("mousedown", function(event, d) {
        if (event.button !== 0) return; // Only left mouse button
        
        
        let isDragging = false;
        let startMouseX = event.clientX;
        let startMouseY = event.clientY;
        let startNodeX = d.x;
        let startNodeY = d.y;
        
        const handleMouseMove = (e: MouseEvent) => {
          if (!isDragging) {
            // Start dragging on first move
            isDragging = true;
          }
          
          // Calculate movement delta from original position
          const deltaX = e.clientX - startMouseX;
          const deltaY = e.clientY - startMouseY;
          const newX = startNodeX + deltaX;
          const newY = startNodeY + deltaY;
          
          
          // Update node position immediately
          d.x = newX;
          d.y = newY;
          
          // Update visual position
          d3.select(this).attr("transform", `translate(${newX},${newY})`);
          
          // Update React state
          setNodes(prev => prev.map(n => 
            n.id === d.id ? { ...n, x: newX, y: newY } : n
          ));
          
          e.preventDefault();
        };
        
        const handleMouseUp = (e: MouseEvent) => {
          
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          
          e.preventDefault();
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        event.preventDefault();
        event.stopPropagation();
      })
      .on("dblclick", function(event, d) {
        
        // Open details sidebar for this node
        setSelectedNodeId(d.id);
        setSelectedMilestoneId(null);
        setShowSidebar(true);
        
        event.preventDefault();
        event.stopPropagation();
      });

    // Node circles
    node.append("circle")
      .attr("r", 28)
      .attr("fill", "url(#node-gradient)")
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .style("filter", "drop-shadow(0px 4px 8px rgba(99, 102, 241, 0.3))");

    // Node labels
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 5)
      .attr("font-size", "13px")
      .attr("font-weight", "600")
      .attr("fill", "white")
      .style("pointer-events", "none")
      .style("text-shadow", "0px 1px 2px rgba(0, 0, 0, 0.3)")
      .text(d => d.label.length > 12 ? d.label.slice(0, 10) + '...' : d.label);

    // Position nodes statically
    node.attr("transform", d => `translate(${d.x},${d.y})`);

    // Clear existing milestone elements first
    mainGroup.selectAll(".milestone-container").remove();
    mainGroup.selectAll(".milestone-title").remove();

    // Render milestone containers BEHIND nodes
    
    milestones.forEach((milestone, index) => {
      
      // Create milestone container
      const container = mainGroup.insert("rect", ":first-child") // Insert at beginning so it's behind nodes
        .datum(milestone)
        .attr("class", "milestone-container")
        .attr("data-milestone-id", milestone.id)
        .attr("x", milestone.bounds.x)
        .attr("y", milestone.bounds.y)
        .attr("width", milestone.bounds.width)
        .attr("height", milestone.bounds.height)
        .attr("rx", 16)
        .attr("ry", 16)
        .attr("fill", "rgba(255, 107, 53, 0.2)")
        .attr("stroke", "#ff6b35")
        .attr("stroke-width", 4)
        .attr("stroke-dasharray", "10,5")
        .style("filter", "drop-shadow(0px 4px 12px rgba(255, 107, 53, 0.4))")
        .style("cursor", "pointer")
        .on("contextmenu", function(event, d) {
          showMilestoneContextMenu(event, d);
        })
        .on("click", function(event, d) {
          // Use a timeout to distinguish between single and double clicks
          const element = this;
          const clickData = d;
          
          // Clear any existing timeout
          if ((element as any).clickTimeout) {
            clearTimeout((element as any).clickTimeout);
            (element as any).clickTimeout = null;
            
            // This is a double click
            
            // Open details sidebar for this milestone
            setSelectedMilestoneId(clickData.id);
            setSelectedNodeId(null);
            setShowSidebar(true);
            
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          
          // Set timeout for single click
          (element as any).clickTimeout = setTimeout(() => {
            
            // Select milestone for resizing
            setSelectedMilestoneForResize(clickData.id);
            // Clear sidebar selection
            setShowSidebar(false);
            setSelectedNodeId(null);
            setSelectedMilestoneId(null);
            
            (element as any).clickTimeout = null;
          }, 300); // 300ms delay to detect double click
          
          event.stopPropagation();
        })
        .on("mousedown", function(event, d) {
          if (event.button !== 0 || milestoneMode) return;
          
          // Add a small delay to allow double-click to be detected first
          let dragTimeout: NodeJS.Timeout;
          let hasMoved = false;
          const startX = event.clientX;
          const startY = event.clientY;
          const startBoundsX = d.bounds.x;
          const startBoundsY = d.bounds.y;
          
          const handleMouseMove = (e: MouseEvent) => {
            const moveDistance = Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY);
            
            // Only start dragging if mouse has moved significantly
            if (moveDistance > 5 && !hasMoved) {
              hasMoved = true;
              
              // Clear any pending drag timeout
              if (dragTimeout) {
                clearTimeout(dragTimeout);
              }
            }
            
            if (!hasMoved) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const newX = startBoundsX + deltaX;
            const newY = startBoundsY + deltaY;
            
            d.bounds.x = newX;
            d.bounds.y = newY;
            
            d3.select(this)
              .attr("x", newX)
              .attr("y", newY);
            
            // Update title position
            mainGroup.selectAll("text.milestone-title")
              .filter((titleData: any) => titleData.id === d.id)
              .attr("x", newX + 12)
              .attr("y", newY - 8);
            
            // Move grouped nodes - get fresh data from React state
            const currentMilestone = milestones.find(m => m.id === d.id);
            const groupedNodeIds = new Set(currentMilestone?.groupedNodes || d.groupedNodes);
            
            
            setNodes(prev => prev.map(node => {
              if (groupedNodeIds.has(node.id)) {
                if (!node.originalX) {
                  node.originalX = node.x;
                  node.originalY = node.y;
                }
                
                const newNodeX = node.originalX + deltaX;
                const newNodeY = node.originalY + deltaY;
                
                mainGroup.selectAll("g.node")
                  .filter((nodeData: any) => nodeData.id === node.id)
                  .attr("transform", `translate(${newNodeX},${newNodeY})`);
                
                return { ...node, x: newNodeX, y: newNodeY };
              }
              return node;
            }));
            
            setMilestones(prev => prev.map(milestone => 
              milestone.id === d.id ? { ...milestone, bounds: { ...milestone.bounds, x: newX, y: newY } } : milestone
            ));
            
            e.preventDefault();
          };
          
          const handleMouseUp = (e: MouseEvent) => {
            // Clear any pending timeout
            if (dragTimeout) {
              clearTimeout(dragTimeout);
            }
            
            if (hasMoved) {
              
              // Get fresh grouped nodes data for cleanup
              const currentMilestone = milestones.find(m => m.id === d.id);
              const groupedNodeIds = new Set(currentMilestone?.groupedNodes || d.groupedNodes);
              
              setNodes(prev => prev.map(node => {
                if (groupedNodeIds.has(node.id)) {
                  const cleanNode = { ...node };
                  delete cleanNode.originalX;
                  delete cleanNode.originalY;
                  return cleanNode;
                }
                return node;
              }));
            }
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            e.preventDefault();
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
          
          event.preventDefault();
          event.stopPropagation();
        });
      
      // Create milestone title
      const title = mainGroup.append("text")
        .datum(milestone)
        .attr("class", "milestone-title")
        .attr("data-milestone-id", milestone.id)
        .attr("x", milestone.bounds.x + 12)
        .attr("y", milestone.bounds.y - 8)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "#ff6b35")
        .style("filter", "drop-shadow(0px 1px 2px rgba(255, 107, 53, 0.5))")
        .style("pointer-events", "none") // Don't interfere with container clicks
        .text(milestone.title);
    });

    // Render resize handles for selected milestone
    if (selectedMilestoneForResize) {
      const selectedMilestone = milestones.find(m => m.id === selectedMilestoneForResize);
      if (selectedMilestone) {
        renderMilestoneResizeHandles(svg, selectedMilestone);
      }
    }


    // Render selection box when selecting
    if (isSelecting) {
      const selectionBounds = {
        x: Math.min(selectionStart.x, selectionCurrent.x),
        y: Math.min(selectionStart.y, selectionCurrent.y),
        width: Math.abs(selectionCurrent.x - selectionStart.x),
        height: Math.abs(selectionCurrent.y - selectionStart.y)
      };

      mainGroup.selectAll("rect.selection-box").remove();
      mainGroup.append("rect")
        .attr("class", "selection-box")
        .attr("x", selectionBounds.x)
        .attr("y", selectionBounds.y)
        .attr("width", selectionBounds.width)
        .attr("height", selectionBounds.height)
        .attr("fill", "rgba(59, 130, 246, 0.1)")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5");
    } else {
      mainGroup.selectAll("rect.selection-box").remove();
    }

    // Add milestone selection functionality
    if (milestoneMode) {
      svg.style("cursor", "crosshair");
      
      svg.on("mousedown", function(event) {
        if (event.button !== 0) return; // Only left mouse button
        
        const rect = svgRef.current!.getBoundingClientRect();
        const startX = event.clientX - rect.left;
        const startY = event.clientY - rect.top;
        
        setSelectionStart({ x: startX, y: startY });
        setSelectionCurrent({ x: startX, y: startY });
        setIsSelecting(true);
        
        
        event.preventDefault();
        event.stopPropagation();
      });
    } else {
      svg.style("cursor", "default");
      // Remove milestone selection handlers when milestone mode is off
      svg.on("mousedown", null);
      svg.on("mousemove", null);
      svg.on("mouseup", null);
      
      // Add click handler to clear milestone selection
      svg.on("click", function(event) {
        // Only clear if clicking on empty space (not on nodes or milestones)
        const target = event.target;
        if (target === svg.node() || target.tagName === 'svg') {
          setSelectedMilestoneForResize(null);
        }
      });
      
      // Also ensure selection state is cleared
      setIsSelecting(false);
    }

    // Add global mouse handlers for selection ONLY when milestone mode is ON and selecting
    if (isSelecting && milestoneMode) {
      const handleMouseMove = (event: MouseEvent) => {
        const rect = svgRef.current!.getBoundingClientRect();
        const currentX = event.clientX - rect.left;
        const currentY = event.clientY - rect.top;
        
        setSelectionCurrent({ x: currentX, y: currentY });
      };
      
      const handleMouseUp = (event: MouseEvent) => {
        setIsSelecting(false);
        
        // Calculate selection bounds
        const bounds = {
          x: Math.min(selectionStart.x, selectionCurrent.x),
          y: Math.min(selectionStart.y, selectionCurrent.y),
          width: Math.abs(selectionCurrent.x - selectionStart.x),
          height: Math.abs(selectionCurrent.y - selectionStart.y)
        };
        
        // Find nodes within selection
        const selectedNodeIds = findNodesInSelection(bounds);
        
        if (selectedNodeIds.length > 0) {
          createMilestone(selectedNodeIds);
        }
        
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }

  }, [nodes, links, milestones, milestoneMode, isSelecting, selectionStart, selectionCurrent, selectedMilestoneForResize]);

  // Helper function to find nodes within selection bounds
  const findNodesInSelection = (bounds: { x: number; y: number; width: number; height: number }) => {
    const selectedIds: string[] = [];
    
    nodes.forEach(node => {
      // Check if node center is within selection bounds
      if (node.x >= bounds.x && 
          node.x <= bounds.x + bounds.width &&
          node.y >= bounds.y && 
          node.y <= bounds.y + bounds.height) {
        selectedIds.push(node.id);
      }
    });
    
    return selectedIds;
  };

  // Helper function to create milestone from selected nodes
  const createMilestone = (nodeIds: string[]) => {
    const milestoneId = `milestone_${Date.now()}`;
    
    // Calculate bounds from selected nodes
    const selectedNodes = nodes.filter(n => nodeIds.includes(n.id));
    const padding = 40;
    const minX = Math.min(...selectedNodes.map(n => n.x)) - padding;
    const minY = Math.min(...selectedNodes.map(n => n.y)) - padding;
    const maxX = Math.max(...selectedNodes.map(n => n.x)) + padding;
    const maxY = Math.max(...selectedNodes.map(n => n.y)) + padding;
    
    const milestone: Milestone = {
      id: milestoneId,
      title: `Milestone ${milestones.length + 1}`,
      groupedNodes: nodeIds,
      bounds: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      },
      description: '',
      status: 'planned',
      priority: 'medium'
    };
    
    setMilestones(prev => [...prev, milestone]);
  };

  // Get selected node or milestone for sidebar (always get fresh data)
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const selectedMilestone = selectedMilestoneId ? milestones.find(m => m.id === selectedMilestoneId) : null;
  
  // Debug: Log milestone data when sidebar is open
  if (selectedMilestone && showSidebar) {
    console.log('📋 Sidebar showing milestone:', selectedMilestone.id, 'with nodes:', selectedMilestone.groupedNodes);
  }

  // Auto-refresh sidebar when milestone data changes
  useEffect(() => {
    if (selectedMilestoneId && showSidebar) {
      console.log('🔄 Milestone data changed, sidebar will auto-refresh');
    }
  }, [milestones, selectedMilestoneId, showSidebar]);

  // Update node function
  const updateNode = (nodeId: string, updates: Partial<Node>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  };

  // Update milestone function
  const updateMilestone = (milestoneId: string, updates: Partial<Milestone>) => {
    setMilestones(prev => prev.map(milestone => 
      milestone.id === milestoneId ? { ...milestone, ...updates } : milestone
    ));
  };

  // Render milestone resize handles
  const renderMilestoneResizeHandles = (svg: any, milestone: Milestone) => {
    const { bounds } = milestone;
    const handleSize = 8;
    
    // Clear existing resize handles
    mainGroup.selectAll(".resize-handle").remove();
    mainGroup.selectAll(".resize-border").remove();
    
    // Add selection border
    mainGroup.append("rect")
      .attr("class", "resize-border")
      .attr("x", bounds.x - 2)
      .attr("y", bounds.y - 2)
      .attr("width", bounds.width + 4)
      .attr("height", bounds.height + 4)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .style("pointer-events", "none");
    
    // Resize handles positions
    const handles = [
      { name: 'nw', x: bounds.x, y: bounds.y, cursor: 'nw-resize' },
      { name: 'ne', x: bounds.x + bounds.width, y: bounds.y, cursor: 'ne-resize' },
      { name: 'sw', x: bounds.x, y: bounds.y + bounds.height, cursor: 'sw-resize' },
      { name: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height, cursor: 'se-resize' },
      { name: 'n', x: bounds.x + bounds.width / 2, y: bounds.y, cursor: 'n-resize' },
      { name: 's', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, cursor: 's-resize' },
      { name: 'w', x: bounds.x, y: bounds.y + bounds.height / 2, cursor: 'w-resize' },
      { name: 'e', x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, cursor: 'e-resize' }
    ];
    
    // Create resize handles
    handles.forEach(handle => {
      const handleElement = mainGroup.append("rect")
        .attr("class", "resize-handle")
        .attr("data-handle", handle.name)
        .attr("x", handle.x - handleSize / 2)
        .attr("y", handle.y - handleSize / 2)
        .attr("width", handleSize)
        .attr("height", handleSize)
        .attr("fill", "#3b82f6")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .style("cursor", handle.cursor)
        .on("mousedown", function(event) {
          event.preventDefault();
          event.stopPropagation();
          
          
          const startX = event.clientX;
          const startY = event.clientY;
          const originalBounds = { ...bounds };
          
          const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newBounds = { ...originalBounds };
            
            // Calculate new bounds based on handle
            switch (handle.name) {
              case 'nw':
                newBounds.x = originalBounds.x + deltaX;
                newBounds.y = originalBounds.y + deltaY;
                newBounds.width = originalBounds.width - deltaX;
                newBounds.height = originalBounds.height - deltaY;
                break;
              case 'ne':
                newBounds.y = originalBounds.y + deltaY;
                newBounds.width = originalBounds.width + deltaX;
                newBounds.height = originalBounds.height - deltaY;
                break;
              case 'sw':
                newBounds.x = originalBounds.x + deltaX;
                newBounds.width = originalBounds.width - deltaX;
                newBounds.height = originalBounds.height + deltaY;
                break;
              case 'se':
                newBounds.width = originalBounds.width + deltaX;
                newBounds.height = originalBounds.height + deltaY;
                break;
              case 'n':
                newBounds.y = originalBounds.y + deltaY;
                newBounds.height = originalBounds.height - deltaY;
                break;
              case 's':
                newBounds.height = originalBounds.height + deltaY;
                break;
              case 'w':
                newBounds.x = originalBounds.x + deltaX;
                newBounds.width = originalBounds.width - deltaX;
                break;
              case 'e':
                newBounds.width = originalBounds.width + deltaX;
                break;
            }
            
            // Minimum size constraints
            if (newBounds.width < 50) {
              if (handle.name.includes('w')) {
                newBounds.x = originalBounds.x + originalBounds.width - 50;
              }
              newBounds.width = 50;
            }
            if (newBounds.height < 50) {
              if (handle.name.includes('n')) {
                newBounds.y = originalBounds.y + originalBounds.height - 50;
              }
              newBounds.height = 50;
            }
            
            // Update milestone bounds
            updateMilestone(milestone.id, { bounds: newBounds });
            
            e.preventDefault();
          };
          
          const handleMouseUp = (e: MouseEvent) => {
            
            // Update grouped nodes based on new bounds (with delay to ensure state is updated)
            setTimeout(() => {
              updateGroupedNodesFromBounds(milestone.id);
            }, 50);
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            e.preventDefault();
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });
    });
  };

  // Apply layout algorithm
  const applyLayout = (layoutId: string) => {
    if (layoutId === 'manual') {
      return;
    }


    try {
      // Convert to layout format
      const layoutNodes = nodes.map(node => ({
        id: node.id,
        label: node.label,
        x: node.x,
        y: node.y,
        parent: links.find(l => l.target === node.id)?.source as string | undefined,
      }));

      const layoutEdges = links.map(link => ({
        id: `${link.source}-${link.target}`,
        source: typeof link.source === 'string' ? link.source : link.source.id,
        target: typeof link.target === 'string' ? link.target : link.target.id,
      }));

      const dimensions = {
        width: 800,
        height: 600,
        centerX: 400,
        centerY: 300,
      };

      // Apply layout
      const result = layoutEngine.apply(layoutId, layoutNodes, layoutEdges, dimensions, {
        preservePositions: false, // For now, don't preserve (will add toggle later)
      });

      // Update node positions
      setNodes(prev => prev.map(node => {
        const layoutNode = result.nodes.find(n => n.id === node.id);
        if (layoutNode && layoutNode.x !== undefined && layoutNode.y !== undefined) {
          return {
            ...node,
            x: layoutNode.x,
            y: layoutNode.y,
          };
        }
        return node;
      }));

    } catch (error) {
      console.error('🎨 Layout failed:', error);
    }
  };

  // Export mindmap
  const handleExport = (format: ExportFormat) => {
    
    try {
      // Convert D3 data to export format
      const exportData = {
        title: title,
        nodes: nodes.map(node => ({
          id: node.id,
          label: node.label,
          x: node.x,
          y: node.y,
        })),
        edges: links.map(link => ({
          source: typeof link.source === 'string' ? link.source : link.source.id,
          target: typeof link.target === 'string' ? link.target : link.target.id,
        })),
      };

      // Export
      const content = mindmapExporter.export(exportData, format);
      
      // Determine filename and MIME type
      const formatInfo = mindmapExporter.getAvailableFormats().find(f => f.id === format);
      const filename = `${title.replace(/\s+/g, '-').toLowerCase()}${formatInfo?.extension || '.txt'}`;
      const mimeType = format === 'json' ? 'application/json' : 'text/markdown';

      // Download
      mindmapExporter.download(content, filename, mimeType);
      
      setShowExportMenu(false);
    } catch (error) {
      console.error('📤 Export failed:', error);
    }
  };

  // AI handlers
  const handleAIExpandNode = async (nodeId: string) => {
    setAILoading(true);
    try {
      const context: MindmapContext = {
        title,
        nodes: nodes.map(n => ({
          id: n.id,
          label: n.label,
          description: n.description,
        })),
        edges: links.map(link => ({
          source: typeof link.source === 'string' ? link.source : link.source.id,
          target: typeof link.target === 'string' ? link.target : link.target.id,
        })),
      };

      const children = await mindmapAIService.generateChildNodes(nodeId, context, {
        count: 3,
        style: 'concise',
      });

      // Add generated nodes
      const parentNode = nodes.find(n => n.id === nodeId);
      if (!parentNode) return;

      const newNodes: Node[] = children.map((child, index) => ({
        id: `node-${Date.now()}-${index}`,
        label: child.label,
        description: child.description,
        x: parentNode.x + 200,
        y: parentNode.y + (index - 1) * 100,
        type: 'node',
      }));

      setNodes(prev => [...prev, ...newNodes]);
      
    } catch (error) {
      console.error('❌ AI expansion failed:', error);
      alert('AI expansion failed. Please try again.');
    } finally {
      setAILoading(false);
    }
  };

  const handleAIEnhanceNode = async (nodeId: string) => {
    setAILoading(true);
    try {
      const context: MindmapContext = {
        title,
        nodes: nodes.map(n => ({
          id: n.id,
          label: n.label,
          description: n.description,
        })),
        edges: links.map(link => ({
          source: typeof link.source === 'string' ? link.source : link.source.id,
          target: typeof link.target === 'string' ? link.target : link.target.id,
        })),
      };

      const enhanced = await mindmapAIService.enhanceNode(nodeId, context, 'both');

      setNodes(prev => prev.map(n =>
        n.id === nodeId
          ? { ...n, label: enhanced.label || n.label, description: enhanced.description || n.description }
          : n
      ));

      console.log(`✨ AI enhanced node`);
    } catch (error) {
      console.error('❌ AI enhancement failed:', error);
      alert('AI enhancement failed. Please try again.');
    } finally {
      setAILoading(false);
    }
  };

  const handleLoadTemplate = (template: MindmapTemplate) => {
    setTitle(template.name);
    setNodes(template.nodes as Node[]);
    setLinks(template.links);
    setShowTemplateGallery(false);
  };

  const handleAnalyzeQuality = async () => {
    setAILoading(true);
    try {
      const context: MindmapContext = {
        title,
        nodes: nodes.map(n => ({
          id: n.id,
          label: n.label,
          description: n.description,
        })),
        edges: links.map(link => ({
          source: typeof link.source === 'string' ? link.source : link.source.id,
          target: typeof link.target === 'string' ? link.target : link.target.id,
        })),
      };

      const report = await mindmapQualityAnalyzer.analyze(context);
      setQualityReport(report);
      setShowQualityReport(true);

    } catch (error) {
      console.error('❌ Quality analysis failed:', error);
      alert('Quality analysis failed. Please try again.');
    } finally {
      setAILoading(false);
    }
  };

  const handleAISuggestConnections = async () => {
    setAILoading(true);
    try {
      const context: MindmapContext = {
        title,
        nodes: nodes.map(n => ({
          id: n.id,
          label: n.label,
          description: n.description,
        })),
        edges: links.map(link => ({
          source: typeof link.source === 'string' ? link.source : link.source.id,
          target: typeof link.target === 'string' ? link.target : link.target.id,
        })),
      };

      const suggestions = await mindmapAIService.suggestConnections(context, 5);

      if (suggestions.length === 0) {
        alert('No new connections suggested. Your mindmap is well-connected!');
        return;
      }

      // Show suggestions with confirmation
      const confirmMsg = `AI found ${suggestions.length} suggested connections:\n\n` +
        suggestions.map((s, i) => {
          const source = nodes.find(n => n.id === s.source);
          const target = nodes.find(n => n.id === s.target);
          return `${i + 1}. ${source?.label} → ${target?.label}\n   Reason: ${s.reason}`;
        }).join('\n\n') +
        '\n\nAdd these connections?';

      if (confirm(confirmMsg)) {
        const newLinks = suggestions.map(s => ({
          source: s.source,
          target: s.target,
        }));
        setLinks(prev => [...prev, ...newLinks]);
      }
    } catch (error) {
      console.error('❌ Connection suggestion failed:', error);
      alert('Connection suggestion failed. Please try again.');
    } finally {
      setAILoading(false);
    }
  };

  // Context menu handlers
  const showNodeContextMenu = (event: MouseEvent, node: Node) => {
    event.preventDefault();
    event.stopPropagation();
    
    const items: ContextMenuItem[] = [
      {
        id: 'edit',
        label: 'Edit Label',
        icon: '✏️',
        onClick: () => {
          const newLabel = prompt('Edit node label:', node.label);
          if (newLabel && newLabel.trim()) {
            setNodes(prev => prev.map(n => 
              n.id === node.id ? { ...n, label: newLabel.trim() } : n
            ));
          }
        },
      },
      {
        id: 'add-child',
        label: 'Add Child Node',
        icon: '➕',
        onClick: () => {
          const childId = `node-${Date.now()}`;
          const childNode: Node = {
            id: childId,
            label: 'New Child',
            x: node.x + 150,
            y: node.y + 100,
            type: 'node',
          };
          setNodes(prev => [...prev, childNode]);
        },
      },
      {
        id: 'divider1',
        label: '',
        divider: true,
        onClick: () => {},
      },
      {
        id: 'ai-expand',
        label: 'AI: Expand Node',
        icon: '✨',
        disabled: aiLoading,
        onClick: () => handleAIExpandNode(node.id),
      },
      {
        id: 'ai-enhance',
        label: 'AI: Enhance',
        icon: '🎨',
        disabled: aiLoading,
        onClick: () => handleAIEnhanceNode(node.id),
      },
      {
        id: 'divider2',
        label: '',
        divider: true,
        onClick: () => {},
      },
      {
        id: 'details',
        label: 'View Details',
        icon: '📋',
        onClick: () => {
          setSelectedNodeId(node.id);
          setSelectedMilestoneId(null);
          setShowSidebar(true);
        },
      },
      {
        id: 'divider2',
        label: '',
        divider: true,
        onClick: () => {},
      },
      {
        id: 'delete',
        label: 'Delete Node',
        icon: '🗑️',
        danger: true,
        onClick: () => {
          if (confirm(`Delete node "${node.label}"?`)) {
            setNodes(prev => prev.filter(n => n.id !== node.id));
          }
        },
      },
    ];

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items,
    });
  };

  const showMilestoneContextMenu = (event: MouseEvent, milestone: Milestone) => {
    event.preventDefault();
    event.stopPropagation();
    
    const items: ContextMenuItem[] = [
      {
        id: 'edit',
        label: 'Edit Title',
        icon: '✏️',
        onClick: () => {
          const newTitle = prompt('Edit milestone title:', milestone.title);
          if (newTitle && newTitle.trim()) {
            setMilestones(prev => prev.map(m => 
              m.id === milestone.id ? { ...m, title: newTitle.trim() } : m
            ));
          }
        },
      },
      {
        id: 'details',
        label: 'View Details',
        icon: '📋',
        onClick: () => {
          setSelectedMilestoneId(milestone.id);
          setSelectedNodeId(null);
          setShowSidebar(true);
        },
      },
      {
        id: 'divider1',
        label: '',
        divider: true,
        onClick: () => {},
      },
      {
        id: 'resize',
        label: 'Resize',
        icon: '⇲',
        onClick: () => {
          setSelectedMilestoneForResize(milestone.id);
        },
      },
      {
        id: 'divider2',
        label: '',
        divider: true,
        onClick: () => {},
      },
      {
        id: 'delete',
        label: 'Delete Milestone',
        icon: '🗑️',
        danger: true,
        onClick: () => {
          if (confirm(`Delete milestone "${milestone.title}"?`)) {
            // Ungroup nodes
            const ungroupedNodes = milestone.groupedNodes.map(nodeId => {
              const node = nodes.find(n => n.id === nodeId);
              return node;
            }).filter(Boolean) as Node[];
            
            // Delete milestone
            setMilestones(prev => prev.filter(m => m.id !== milestone.id));
          }
        },
      },
    ];

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items,
    });
  };

  const showCanvasContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const items: ContextMenuItem[] = [
      {
        id: 'add-node',
        label: 'Add Node Here',
        icon: '➕',
        onClick: () => {
          const newNode: Node = {
            id: `node-${Date.now()}`,
            label: 'New Node',
            x: event.offsetX,
            y: event.offsetY,
            type: 'node',
          };
          setNodes(prev => [...prev, newNode]);
        },
      },
      {
        id: 'divider1',
        label: '',
        divider: true,
        onClick: () => {},
      },
      {
        id: 'ai-suggest',
        label: 'AI: Suggest Connections',
        icon: '🔗',
        disabled: aiLoading || nodes.length < 3,
        onClick: () => handleAISuggestConnections(),
      },
      {
        id: 'ai-analyze',
        label: 'AI: Analyze Quality',
        icon: '📊',
        disabled: aiLoading || nodes.length < 2,
        onClick: () => handleAnalyzeQuality(),
      },
      {
        id: 'divider2',
        label: '',
        divider: true,
        onClick: () => {},
      },
      {
        id: 'reset-zoom',
        label: 'Reset Zoom',
        icon: '⊙',
        onClick: () => handleResetZoom(),
      },
    ];

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items,
    });
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const newZoom = Math.min(transform.k * 1.3, 4);
    const newTransform = d3.zoomIdentity
      .translate(transform.x, transform.y)
      .scale(newZoom);
    svg.transition().duration(300).call(
      d3.zoom().transform as any,
      newTransform
    );
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const newZoom = Math.max(transform.k / 1.3, 0.1);
    const newTransform = d3.zoomIdentity
      .translate(transform.x, transform.y)
      .scale(newZoom);
    svg.transition().duration(300).call(
      d3.zoom().transform as any,
      newTransform
    );
  };

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const newTransform = d3.zoomIdentity;
    svg.transition().duration(300).call(
      d3.zoom().transform as any,
      newTransform
    );
  };

  // Update grouped nodes based on milestone bounds
  const updateGroupedNodesFromBounds = (milestoneId: string) => {
    // Use functional updates to get the latest state
    setMilestones(currentMilestones => {
      const milestone = currentMilestones.find(m => m.id === milestoneId);
      if (!milestone) {
        return currentMilestones;
      }
  
      
      // Get current nodes from state
      let currentNodes: Node[] = [];
      setNodes(n => {
        currentNodes = n;
        return n;
      });
      
      
      // Find all nodes within the new bounds with some padding for better detection
      const padding = 25; // Node radius
      const { x, y, width, height } = milestone.bounds;
      
      
      const nodesInBounds = currentNodes.filter(node => {
        const isInsideX = node.x >= (x - padding) && node.x <= (x + width + padding);
        const isInsideY = node.y >= (y - padding) && node.y <= (y + height + padding);
        const isInside = isInsideX && isInsideY;
        
      
        
        return isInside;
      });
      
      const newGroupedNodes = nodesInBounds.map(n => n.id);
      
 
      
      // Force sidebar refresh if this milestone is currently selected
      if (selectedMilestoneId === milestoneId && showSidebar) {
        setTimeout(() => {
          setSelectedMilestoneId(null);
          setTimeout(() => {
            setSelectedMilestoneId(milestoneId);
          }, 10);
        }, 0);
      }
      
      // Return updated milestones with new grouped nodes
      return currentMilestones.map(m => 
        m.id === milestoneId ? { ...m, groupedNodes: newGroupedNodes } : m
      );
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            className="bg-transparent border-none outline-none text-lg font-semibold"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button size="sm" variant="outline" onClick={() => setShowTemplateGallery(true)}>
            <FileText className="h-4 w-4 mr-2"/>Templates
          </Button>
          <Button size="sm" variant="outline"><Upload className="h-4 w-4 mr-2"/>Import</Button>
          <Button size="sm" className="gradient-primary text-white"><Plus className="h-4 w-4 mr-2"/>New node</Button>
          <Button 
            size="sm" 
            variant={milestoneMode ? "default" : "outline"}
            onClick={() => setMilestoneMode(!milestoneMode)}
          >
            🏁 Milestone {milestoneMode ? 'ON' : 'OFF'}
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <div className="flex items-center gap-2">
            <Layout className="h-4 w-4 text-muted-foreground" />
            <Select value={currentLayout} onValueChange={(value) => {
              setCurrentLayout(value);
              applyLayout(value);
            }}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="Layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="radial">🎯 Radial</SelectItem>
                <SelectItem value="tree-vertical">🌳 Tree (Top-Down)</SelectItem>
                <SelectItem value="tree-horizontal">🌳 Tree (Left-Right)</SelectItem>
                <SelectItem value="force">⚛️ Force (Organic)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              📤 Export
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Mermaid Diagrams</div>
                  <button 
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded text-sm"
                    onClick={() => handleExport('mermaid-flowchart')}
                  >
                    <div className="font-medium">Flowchart</div>
                    <div className="text-xs text-muted-foreground">Top-down flowchart</div>
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded text-sm"
                    onClick={() => handleExport('mermaid-mindmap')}
                  >
                    <div className="font-medium">Mindmap</div>
                    <div className="text-xs text-muted-foreground">Hierarchical mindmap</div>
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded text-sm"
                    onClick={() => handleExport('mermaid-graph')}
                  >
                    <div className="font-medium">Graph</div>
                    <div className="text-xs text-muted-foreground">Network graph</div>
                  </button>
                  <div className="border-t border-border my-1"></div>
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Other Formats</div>
                  <button 
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded text-sm"
                    onClick={() => handleExport('markdown')}
                  >
                    <div className="font-medium">Markdown</div>
                    <div className="text-xs text-muted-foreground">Hierarchical list</div>
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded text-sm"
                    onClick={() => handleExport('json')}
                  >
                    <div className="font-medium">JSON</div>
                    <div className="text-xs text-muted-foreground">Full data export</div>
                  </button>
                </div>
              </div>
            )}
          </div>
          <Button 
            size="sm" 
            className="gradient-primary text-white"
            onClick={() => setShowAIPanel(!showAIPanel)}
            disabled={aiLoading}
          >
            <Sparkles className={`h-4 w-4 mr-2 ${aiLoading ? 'animate-spin' : ''}`}/>
            {aiLoading ? 'AI Working...' : 'AI Tools'}
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-card border border-border rounded-lg p-2 shadow-lg">
          <Button size="sm" variant="outline" onClick={handleZoomIn} title="Zoom In">
            <span className="text-lg">+</span>
          </Button>
          <div className="text-xs text-center text-muted-foreground px-1">
            {Math.round(zoomLevel * 100)}%
          </div>
          <Button size="sm" variant="outline" onClick={handleZoomOut} title="Zoom Out">
            <span className="text-lg">−</span>
          </Button>
          <div className="border-t border-border my-1"></div>
          <Button size="sm" variant="outline" onClick={handleResetZoom} title="Reset Zoom">
            <span className="text-sm">⊙</span>
          </Button>
          <div className="border-t border-border my-1"></div>
          <Button 
            size="sm" 
            variant={showMinimap ? "default" : "outline"} 
            onClick={() => setShowMinimap(!showMinimap)} 
            title="Toggle Minimap"
          >
            <span className="text-sm">🗺️</span>
          </Button>
        </div>

        {/* Minimap */}
        {showMinimap && nodes.length > 3 && (
          <div className="absolute bottom-4 right-4 z-20 bg-card/95 border-2 border-border rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-border bg-muted/50 flex items-center justify-between">
              <span className="text-xs font-semibold">Minimap</span>
              <button 
                onClick={() => setShowMinimap(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <svg width="200" height="150" className="block">
              {/* Background */}
              <rect width="200" height="150" fill="hsl(var(--muted))" opacity="0.3" />
              
              {/* Draw all nodes as small dots */}
              {nodes.map(node => {
                // Calculate minimap position (scale to fit 200x150)
                const bounds = {
                  minX: Math.min(...nodes.map(n => n.x)),
                  maxX: Math.max(...nodes.map(n => n.x)),
                  minY: Math.min(...nodes.map(n => n.y)),
                  maxY: Math.max(...nodes.map(n => n.y)),
                };
                const width = bounds.maxX - bounds.minX || 1;
                const height = bounds.maxY - bounds.minY || 1;
                const scale = Math.min(180 / width, 130 / height);
                
                const miniX = 10 + ((node.x - bounds.minX) * scale);
                const miniY = 10 + ((node.y - bounds.minY) * scale);
                
                return (
                  <circle
                    key={node.id}
                    cx={miniX}
                    cy={miniY}
                    r="3"
                    fill="hsl(var(--primary))"
                    opacity="0.6"
                  />
                );
              })}
              
              {/* Draw connections */}
              {links.map((link, i) => {
                const source = nodes.find(n => n.id === (typeof link.source === 'string' ? link.source : link.source.id));
                const target = nodes.find(n => n.id === (typeof link.target === 'string' ? link.target : link.target.id));
                if (!source || !target) return null;
                
                const bounds = {
                  minX: Math.min(...nodes.map(n => n.x)),
                  maxX: Math.max(...nodes.map(n => n.x)),
                  minY: Math.min(...nodes.map(n => n.y)),
                  maxY: Math.max(...nodes.map(n => n.y)),
                };
                const width = bounds.maxX - bounds.minX || 1;
                const height = bounds.maxY - bounds.minY || 1;
                const scale = Math.min(180 / width, 130 / height);
                
                const x1 = 10 + ((source.x - bounds.minX) * scale);
                const y1 = 10 + ((source.y - bounds.minY) * scale);
                const x2 = 10 + ((target.x - bounds.minX) * scale);
                const y2 = 10 + ((target.y - bounds.minY) * scale);
                
                return (
                  <line
                    key={`minilink-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                    opacity="0.2"
                  />
                );
              })}
              
              {/* Viewport indicator */}
              <rect
                x="5"
                y="5"
                width="190"
                height="140"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.5"
              />
            </svg>
          </div>
        )}
        
        {/* Main Canvas - Full Width */}
        <div className="w-full h-full">
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ border: '1px solid #e5e7eb' }}
          />
        </div>

        {/* Sidebar Backdrop - Click to close */}
        {showSidebar && (
          <div 
            className="absolute inset-0 bg-black/20 z-5"
            onClick={() => {
              console.log('🖱️ Sidebar backdrop clicked - closing sidebar');
              setShowSidebar(false);
              setSelectedNodeId(null);
              setSelectedMilestoneId(null);
            }}
          />
        )}

        {/* Details Sidebar - Floating Overlay */}
        {showSidebar && (
          <div className="absolute top-0 right-0 w-80 h-full border-l border-border bg-card flex flex-col shadow-lg z-10">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">
                {selectedNode ? 'Node Details' : selectedMilestone ? 'Milestone Details' : 'Details'}
              </h3>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setShowSidebar(false);
                  setSelectedNodeId(null);
                  setSelectedMilestoneId(null);
                }}
              >
                ✕
              </Button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedNode && (
                <div className="space-y-4">
                  {/* Basic Properties */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={selectedNode.label || ''}
                      onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md"
                      placeholder="Node name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={selectedNode.description || ''}
                      onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md"
                      rows={3}
                      placeholder="Node description"
                    />
                  </div>

                  {/* PM Fields */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={selectedNode.status || 'planned'}
                      onChange={(e) => updateNode(selectedNode.id, { status: e.target.value as Node['status'] })}
                      className="w-full px-3 py-2 border border-border rounded-md"
                    >
                      <option value="planned">Planned</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={selectedNode.priority || 'medium'}
                      onChange={(e) => updateNode(selectedNode.id, { priority: e.target.value as Node['priority'] })}
                      className="w-full px-3 py-2 border border-border rounded-md"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Owner</label>
                    <input
                      type="text"
                      value={selectedNode.owner || ''}
                      onChange={(e) => updateNode(selectedNode.id, { owner: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md"
                      placeholder="Assigned to"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <input
                        type="date"
                        value={selectedNode.startDate || ''}
                        onChange={(e) => updateNode(selectedNode.id, { startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <input
                        type="date"
                        value={selectedNode.endDate || ''}
                        onChange={(e) => updateNode(selectedNode.id, { endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Duration (Days)</label>
                    <input
                      type="number"
                      value={selectedNode.durationDays || 0}
                      onChange={(e) => updateNode(selectedNode.id, { durationDays: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-border rounded-md"
                      min="0"
                    />
                  </div>

                  {/* Metadata */}
                  <div className="pt-4 border-t border-border">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Type: node</div>
                      <div>ID: {selectedNode.id}</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedMilestone && (
                <div className="space-y-4">
                  {/* Basic Properties */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={selectedMilestone.title || ''}
                      onChange={(e) => updateMilestone(selectedMilestone.id, { title: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md"
                      placeholder="Milestone title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={selectedMilestone.description || ''}
                      onChange={(e) => updateMilestone(selectedMilestone.id, { description: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md"
                      rows={3}
                      placeholder="Milestone description"
                    />
                  </div>

                  {/* PM Fields */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={selectedMilestone.status || 'planned'}
                      onChange={(e) => updateMilestone(selectedMilestone.id, { status: e.target.value as Milestone['status'] })}
                      className="w-full px-3 py-2 border border-border rounded-md"
                    >
                      <option value="planned">Planned</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={selectedMilestone.priority || 'medium'}
                      onChange={(e) => updateMilestone(selectedMilestone.id, { priority: e.target.value as Milestone['priority'] })}
                      className="w-full px-3 py-2 border border-border rounded-md"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Owner</label>
                    <input
                      type="text"
                      value={selectedMilestone.owner || ''}
                      onChange={(e) => updateMilestone(selectedMilestone.id, { owner: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md"
                      placeholder="Assigned to"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <input
                        type="date"
                        value={selectedMilestone.startDate || ''}
                        onChange={(e) => updateMilestone(selectedMilestone.id, { startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <input
                        type="date"
                        value={selectedMilestone.endDate || ''}
                        onChange={(e) => updateMilestone(selectedMilestone.id, { endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Duration (Days)</label>
                    <input
                      type="number"
                      value={selectedMilestone.durationDays || 0}
                      onChange={(e) => updateMilestone(selectedMilestone.id, { durationDays: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-border rounded-md"
                      min="0"
                    />
                  </div>

                  {/* Grouped Nodes */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Controlled Nodes ({selectedMilestone.groupedNodes.length})
                    </label>
                    <div className="text-xs text-muted-foreground mb-2">
                      This milestone controls the following nodes:
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedMilestone.groupedNodes.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic px-2 py-1 bg-muted rounded">
                          No nodes in this milestone
                        </div>
                      ) : (
                        selectedMilestone.groupedNodes.map(nodeId => {
                          const node = nodes.find(n => n.id === nodeId);
                          return (
                            <div key={nodeId} className="flex items-center justify-between text-sm px-3 py-2 bg-muted rounded hover:bg-muted/80 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="font-medium">{node?.label || nodeId}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {node?.status || 'planned'}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {selectedMilestone.groupedNodes.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        💡 Tip: Use single-click + resize handles to adjust which nodes are included
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="pt-4 border-t border-border">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Type: milestone</div>
                      <div>ID: {selectedMilestone.id}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={contextMenu.items}
            onClose={() => setContextMenu(null)}
          />
        )}

        {/* Template Gallery Modal */}
        {showTemplateGallery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowTemplateGallery(false)}>
            <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-border">
                <h2 className="text-2xl font-bold">Template Gallery</h2>
                <p className="text-sm text-muted-foreground mt-1">Start with a pre-built template</p>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mindmapTemplateService.getAllTemplates().map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleLoadTemplate(template)}
                      className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent/50 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{template.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">{template.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">{template.nodes.length} nodes</span>
                            <span className="text-xs text-muted-foreground capitalize">{template.category}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-border flex justify-end">
                <Button variant="outline" onClick={() => setShowTemplateGallery(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quality Report Modal */}
        {showQualityReport && qualityReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowQualityReport(false)}>
            <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Quality Analysis</h2>
                    <p className="text-sm text-muted-foreground mt-1">{title}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-5xl font-bold ${
                      qualityReport.score >= 80 ? 'text-green-500' :
                      qualityReport.score >= 60 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {qualityReport.score}
                    </div>
                    <div className="text-xs text-muted-foreground">out of 100</div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
                {/* Summary */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-sm text-muted-foreground">{qualityReport.summary}</p>
                </div>

                {/* Strengths */}
                {qualityReport.strengths.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="text-green-500">✓</span> Strengths
                    </h3>
                    <ul className="space-y-1">
                      {qualityReport.strengths.map((strength, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Issues */}
                {qualityReport.issues.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="text-yellow-500">⚠</span> Issues Found ({qualityReport.issues.length})
                    </h3>
                    <div className="space-y-3">
                      {qualityReport.issues.map((issue) => (
                        <div 
                          key={issue.id} 
                          className={`p-3 rounded-lg border ${
                            issue.severity === 'critical' ? 'border-red-500/50 bg-red-500/5' :
                            issue.severity === 'warning' ? 'border-yellow-500/50 bg-yellow-500/5' :
                            'border-blue-500/50 bg-blue-500/5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-semibold uppercase ${
                                  issue.severity === 'critical' ? 'text-red-500' :
                                  issue.severity === 'warning' ? 'text-yellow-500' :
                                  'text-blue-500'
                                }`}>
                                  {issue.severity}
                                </span>
                                <h4 className="font-semibold text-sm">{issue.title}</h4>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{issue.description}</p>
                              {issue.suggestion && (
                                <p className="text-xs text-muted-foreground italic">💡 {issue.suggestion}</p>
                              )}
                            </div>
                            {issue.autoFixable && (
                              <Button size="sm" variant="outline" className="text-xs">
                                Fix
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {qualityReport.issues.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-xl font-semibold mb-2">Perfect Structure!</h3>
                    <p className="text-sm text-muted-foreground">
                      No issues found. Your mindmap is well-structured and balanced.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowQualityReport(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}