/**
 * MindmapStudio2 - React Flow Powered Mindmap Studio
 * Production-ready mindmap editor using @xyflow/react
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Plus, FileText, Upload, Layout as LayoutIcon, Folder, ArrowLeft } from "lucide-react";
import Studio2MindNode from "@/components/mindmap/Studio2MindNode";
import Studio2MilestoneNode from "@/components/mindmap/Studio2MilestoneNode";
import Studio2Sidebar from "@/components/mindmap/Studio2Sidebar";
import Studio2ExportModal from "@/components/mindmap/Studio2ExportModal";
import Studio2TemplateModal from "@/components/mindmap/Studio2TemplateModal";
import Studio2AIToolsModal, { type AIAction } from "@/components/mindmap/Studio2AIToolsModal";
import StreamingText from "@/components/mindmap/StreamingText";
import { mindmapAIService, type MindmapContext } from "@/services/mindmap/MindmapAIService";
import { aiService } from "@/services/ai/AIService";
import { chatContextManager } from "@/services/mindmap/ChatContextManager";
import { actionHistoryManager } from "@/services/mindmap/ActionHistoryManager";
import { suggestionDetector } from "@/services/mindmap/SuggestionDetector";
import ProactiveSuggestion, { type Suggestion } from "@/components/mindmap/ProactiveSuggestion";
import { getLayoutedElements } from "@/utils/elkLayout";
import { type MindmapTemplate } from "@/services/mindmap/MindmapTemplates";
import { sessionService } from "@/services/EditorStudioSession";
import MindmapGenerator from "@/services/MindmapGenerator";
import { mindmapExporter } from "@/services/mindmap/MindmapExporter";

// Custom node types
const nodeTypes = {
  mindNode: Studio2MindNode,
  milestone: Studio2MilestoneNode,
};

// Initial nodes and edges
const getInitialNodes = (): Node[] => [
  {
    id: '1',
    type: 'mindNode',
    position: { x: 400, y: 300 },
    data: { 
      label: 'Central Idea',
      // Callbacks will be injected after component mounts
    },
  },
];

const initialEdges: Edge[] = [];

export default function MindmapStudio2() {
  return (
    <ReactFlowProvider>
      <MindmapStudio2Content />
    </ReactFlowProvider>
  );
}

function MindmapStudio2Content() {
  const [title, setTitle] = useState("Untitled Mindmap");
  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [currentLayout, setCurrentLayout] = useState<string>('manual');
  const [edgeType, setEdgeType] = useState<'smoothstep' | 'bezier' | 'straight' | 'step'>('bezier');
  
  // Map UI edge type to React Flow edge type
  const getReactFlowEdgeType = (type: typeof edgeType): string => {
    return type === 'bezier' ? 'default' : type;
  };
  const [edgeStyle, setEdgeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [aiLoading, setAILoading] = useState(false);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [sidebarNode, setSidebarNode] = useState<Node | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAIToolsModal, setShowAIToolsModal] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [chatMode, setChatMode] = useState<'brainstorm' | 'command'>('brainstorm');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [showNodeDropdown, setShowNodeDropdown] = useState(false);
  const [filteredNodes, setFilteredNodes] = useState<Node[]>([]);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const [discussionTargetNode, setDiscussionTargetNode] = useState<string | null>(null); // Track which node we're discussing
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [hasEditorSession, setHasEditorSession] = useState(false);
  
  // Proactive suggestions
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null);
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle AI Enhance button click (show proactive suggestion)
  const handleAIEnhanceClick = useCallback((nodeId: string, executeCommand: (cmd: string) => void) => {
    console.log('⭐ handleAIEnhanceClick called for:', nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      console.error('❌ Node not found:', nodeId);
      return;
    }
    
    console.log('✨ AI Enhance clicked for:', node.data.label);
    
    // Detect suggestions for this node
    console.log('🔍 Detecting suggestions...');
    const suggestion = suggestionDetector.detectForNode(
      node,
      nodes,
      edges,
      (command) => {
        // Execute the suggestion command through chat
        console.log('🎬 Suggestion accepted, executing command:', command);
        executeCommand(command);
        setActiveSuggestion(null);
      }
    );
    
    console.log('💡 Suggestion detected:', suggestion);
    
    if (suggestion) {
      // Position suggestion above the node
      // Get node position on screen
      const nodeElement = document.querySelector(`[data-id="${nodeId}"]`) as HTMLElement;
      if (nodeElement) {
        const rect = nodeElement.getBoundingClientRect();
        
        setSuggestionPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
      } else {
        // Fallback: center of screen
        setSuggestionPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 3,
        });
      }
      
      setActiveSuggestion(suggestion);
      console.log('💡 Showing suggestion:', suggestion.message);
    } else {
      // No suggestions available - show message
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        content: `💡 No suggestions available for "${node.data.label}" right now. This node looks good!` 
      }]);
      setShowChatPanel(true);
    }
  }, [nodes, edges]);

  // Handle suggestion dismissal
  const handleDismissSuggestion = useCallback((suggestionId: string) => {
    suggestionDetector.dismissSuggestion(suggestionId);
    setActiveSuggestion(null);
    console.log('🚫 Suggestion dismissed:', suggestionId);
  }, []);

  // Add new node (callbacks will be injected by useEffect)
  const addNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'mindNode',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 400 + 100 },
      data: { 
        label: 'New Idea',
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  // Add child to selected node (callbacks will be injected by useEffect)
  const addChildNode = useCallback((parentId: string) => {
    // Generate unique ID ONCE at the top level to share between node and edge
    const childId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // CRITICAL: Use functional updates to get CURRENT state, not stale closure values!
    setEdges((currentEdges) => {
      // Count existing children of this parent FROM CURRENT STATE
      const existingChildren = currentEdges.filter(e => e.source === parentId).length;
      const childNumber = existingChildren + 1;
      
      console.log(`🔍 CURRENT EDGES: ${currentEdges.length}, CHILDREN OF ${parentId}: ${existingChildren}`);
      
      // Spread children in a radial/grid pattern (8 directions)
      const angle = (existingChildren * 45); // 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°
      
      console.log(`🔍 ANGLE: child #${childNumber} → ${existingChildren} × 45° = ${angle}°`);

      // For top-down tree: always use bottom → top
      const sourceHandle = 'bottom'; // Parent connects from bottom
      const targetHandle = 'top';     // Child receives from top

      // Get edge style based on user selection
      const strokeDasharray = edgeStyle === 'dashed' ? '5,5' : edgeStyle === 'dotted' ? '2,2' : undefined;

      const newEdge: Edge = {
        id: `edge-${parentId}-${childId}`,
        source: parentId,
        target: childId,
        sourceHandle,
        targetHandle,
        type: getReactFlowEdgeType(edgeType),
        animated: false,
        markerEnd: {
          type: 'arrowclosed' as const,
          color: '#64748b',
        },
        style: {
          stroke: '#64748b',
          strokeWidth: 2,
          strokeDasharray,
        },
      };

      console.log(`🔗 EDGE: ${sourceHandle}→${targetHandle}, target=${childId}`);

      // Also update nodes
      setNodes((currentNodes) => {
        const parent = currentNodes.find(n => n.id === parentId);
        if (!parent) return currentNodes;

        const distance = 220;
        const offsetX = Math.cos((angle * Math.PI) / 180) * distance;
        const offsetY = Math.sin((angle * Math.PI) / 180) * distance;

        const newNode: Node = {
          id: childId, // Same ID as edge target!
          type: 'mindNode',
          position: { 
            x: parent.position.x + offsetX, 
            y: parent.position.y + offsetY 
          },
          data: { 
            label: `New Child ${childNumber}`,
          },
        };

        console.log(`🎯 NODE: id=${childId}, position=(${Math.round(newNode.position.x)}, ${Math.round(newNode.position.y)})`);

        return [...currentNodes, newNode];
      });

      return [...currentEdges, newEdge];
    });
  }, [setNodes, setEdges, edgeType, edgeStyle]);

  // Delete node
  const deleteNode = useCallback((nodeId: string) => {
    if (!confirm('Delete this node?')) return;
    
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  // Handle label change
  const handleLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      )
    );
  }, [setNodes]);

  // AI Enhancement
  const handleAIEnhance = useCallback(async (nodeId: string) => {
    console.log('🎯 handleAIEnhance called for:', nodeId);
    
    // Trigger proactive suggestion instead of direct enhancement
    // Pass handleChatCommand as a parameter to avoid circular dependency
    handleAIEnhanceClick(nodeId, (command) => {
      console.log('📤 Executing command from suggestion:', command);
      // Will be defined later, so we need to access it dynamically
      // Use a small delay to ensure handleChatCommand is available
      setTimeout(() => {
        const chatCommand = (window as any)._handleChatCommand;
        if (chatCommand) {
          console.log('✅ Calling handleChatCommand via window');
          chatCommand(command);
        } else {
          console.error('❌ handleChatCommand not found on window!');
        }
      }, 0);
    });
  }, [handleAIEnhanceClick]);
  
  // Old direct enhancement function (kept for reference, not used anymore)
  const handleAIEnhanceOld = useCallback(async (nodeId: string) => {
    setAILoading(true);
    try {
      const context: MindmapContext = {
        title,
        nodes: nodes.map(n => ({
          id: n.id,
          label: n.data.label || '',
          description: n.data.description,
        })),
        edges: edges.map(e => ({
          source: e.source,
          target: e.target,
        })),
      };

      const enhanced = await mindmapAIService.enhanceNode(nodeId, context, 'both');

      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  label: enhanced.label || node.data.label,
                  description: enhanced.description || node.data.description,
                },
              }
            : node
        )
      );

      console.log(`✨ AI enhanced node: ${nodeId}`);
    } catch (error) {
      console.error('❌ AI enhancement failed:', error);
      alert('AI enhancement failed. Please try again.');
    } finally {
      setAILoading(false);
    }
  }, [title, nodes, edges, setNodes]);

  // Apply layout
  const applyLayout = useCallback(async (layoutType: string) => {
    if (layoutType === 'manual') return;

    const algorithmMap: Record<string, 'layered' | 'force' | 'radial' | 'tree'> = {
      tree: 'tree',
      radial: 'radial',
      force: 'force',
    };

    const algorithm = algorithmMap[layoutType] || 'layered';
    const { nodes: layoutedNodes } = await getLayoutedElements(nodes, edges, algorithm, {
      direction: 'DOWN',
      spacing: 150,
    });

    setNodes(layoutedNodes);
  }, [nodes, edges, setNodes]);

  // Watch layout changes
  useEffect(() => {
    applyLayout(currentLayout);
  }, [currentLayout]);

  // Update all edges when edge type or style changes
  useEffect(() => {
    setEdges((currentEdges) => 
      currentEdges.map((edge) => ({
        ...edge,
        type: getReactFlowEdgeType(edgeType),
        markerEnd: {
          type: 'arrowclosed' as const,
          color: '#64748b',
        },
        style: {
          ...edge.style,
          stroke: '#64748b',
          strokeWidth: 2,
          strokeDasharray: edgeStyle === 'dashed' ? '5,5' : edgeStyle === 'dotted' ? '2,2' : undefined,
        },
      }))
    );
  }, [edgeType, edgeStyle, setEdges]);

  // Track selected nodes for grouping
  const onSelectionChange = useCallback((params: { nodes: Node[], edges: Edge[] }) => {
    const ids = params.nodes.map(n => n.id);
    console.log('🔵 SELECTION CHANGED:', {
      selectedCount: ids.length,
      selectedIds: ids,
      selectedTypes: params.nodes.map(n => n.type),
    });
    setSelectedNodeIds(ids);
  }, []);

  // Create milestone from selected nodes
  const createMilestone = useCallback(() => {
    console.log('🟢 CREATE MILESTONE CALLED:', {
      selectedNodeIds,
      selectedCount: selectedNodeIds.length,
    });

    if (selectedNodeIds.length < 2) {
      alert('Please select at least 2 nodes to create a milestone');
      return;
    }

    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    
    console.log('🟢 SELECTED NODES:', selectedNodes.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      hasParent: !!n.parentNode,
    })));
    
    // Calculate bounding box
    const minX = Math.min(...selectedNodes.map(n => n.position.x)) - 30;
    const minY = Math.min(...selectedNodes.map(n => n.position.y)) - 30;
    const maxX = Math.max(...selectedNodes.map(n => n.position.x + 150)) + 30;
    const maxY = Math.max(...selectedNodes.map(n => n.position.y + 50)) + 30;

    console.log('🟢 BOUNDING BOX:', { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY });

    const milestoneId = `milestone-${Date.now()}`;

    // Create milestone node
    const milestoneNode: Node = {
      id: milestoneId,
      type: 'milestone',
      position: { x: minX, y: minY },
      draggable: true, // Milestone is draggable
      zIndex: -1, // CRITICAL: Milestone must be BEHIND children
      style: {
        width: maxX - minX,
        height: maxY - minY,
      },
      data: {
        label: `Milestone ${nodes.filter(n => n.type === 'milestone').length + 1}`,
        groupedNodeIds: selectedNodeIds,
        // Callbacks will be injected by useEffect
      },
    };

    console.log('🟢 MILESTONE NODE CREATED:', {
      id: milestoneId,
      position: milestoneNode.position,
      size: milestoneNode.style,
      groupedNodeIds: selectedNodeIds,
    });

    // Set selected nodes as children of milestone (React Flow parent feature!)
    const updatedNodes = nodes.map(node => {
      if (selectedNodeIds.includes(node.id)) {
        const newPosition = {
          x: node.position.x - minX,
          y: node.position.y - minY,
        };
        console.log(`🟢 CONVERTING NODE ${node.id}:`, {
          oldAbsolutePosition: node.position,
          newRelativePosition: newPosition,
          milestonePosition: { x: minX, y: minY },
          calculation: `(${node.position.x} - ${minX}, ${node.position.y} - ${minY})`,
          parentId: milestoneId, // FIXED: parentId not parentNode
          extent: 'parent',
        });
        return {
          ...node,
          parentId: milestoneId, // CRITICAL: React Flow uses 'parentId' not 'parentNode'!
          extent: 'parent' as const,
          position: newPosition,
          expandParent: true, // Ensure parent expands to fit children
          draggable: true, // Child is draggable within parent
        };
      }
      return node;
    });

    console.log('🟢 FINAL NODES:', {
      totalNodes: updatedNodes.length + 1,
      milestoneChildren: updatedNodes.filter(n => n.parentNode === milestoneId).length,
      milestone: milestoneNode,
    });

    // CRITICAL: Add milestone FIRST, then children!
    // React Flow needs parent to exist before rendering children
    const finalNodesArray = [milestoneNode, ...updatedNodes];
    
    console.log('🟢 FINAL NODES ARRAY ORDER:');
    finalNodesArray.forEach((n, idx) => {
      console.log(`  [${idx}] ${n.type} "${n.data.label || n.id}"`, {
        id: n.id,
        position: n.position,
        parentId: (n as any).parentId || 'none',
        extent: n.extent || 'none',
        size: n.style || 'none',
        zIndex: n.zIndex || 0,
      });
    });
    
    // CRITICAL: Set nodes in React Flow
    // The milestone must be rendered BEFORE children can reference it as parent
    setNodes(finalNodesArray);
    setSelectedNodeIds([]);
    console.log(`✅ Milestone created! Nodes: ${finalNodesArray.length}, Children: ${updatedNodes.filter(n => n.parentNode === milestoneId).length}`);
  }, [selectedNodeIds, nodes, setNodes]);

  // Ungroup milestone
  const ungroupMilestone = useCallback((milestoneId: string) => {
    const milestone = nodes.find(n => n.id === milestoneId);
    if (!milestone) return;

    // Free child nodes
    const updatedNodes = nodes
      .filter(n => n.id !== milestoneId)
      .map(node => {
        if ((node as any).parentId === milestoneId) {
          return {
            ...node,
            parentId: undefined,
            extent: undefined,
            position: {
              x: node.position.x + milestone.position.x,
              y: node.position.y + milestone.position.y,
            },
          };
        }
        return node;
      });

    setNodes(updatedNodes);
    console.log(`✅ Ungrouped milestone: ${milestoneId}`);
  }, [nodes, setNodes]);

  // Delete milestone
  const deleteMilestone = useCallback((milestoneId: string) => {
    if (!confirm('Delete this milestone and all grouped nodes?')) return;

    // Remove milestone and all child nodes
    const updatedNodes = nodes.filter(n => n.id !== milestoneId && n.parentNode !== milestoneId);
    const updatedEdges = edges.filter(e => {
      const sourceNode = nodes.find(n => n.id === e.source);
      const targetNode = nodes.find(n => n.id === e.target);
      return sourceNode?.parentNode !== milestoneId && targetNode?.parentNode !== milestoneId;
    });

    setNodes(updatedNodes);
    setEdges(updatedEdges);
    console.log(`🗑️ Deleted milestone: ${milestoneId}`);
  }, [nodes, edges, setNodes, setEdges]);

  // Open sidebar for node
  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSidebarNode(node);
  }, []);

  // Update node data from sidebar
  const handleSidebarUpdate = useCallback((nodeId: string, data: Partial<any>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    );
    console.log(`✅ Updated node: ${nodeId}`, data);
  }, [setNodes]);

  // Back to Editor handler
  const handleBackToEditor = useCallback(() => {
    const session = sessionService.getSession();
    if (!session) {
      console.warn('No session found, navigating to editor anyway');
      window.location.href = '/dashboard/editor';
      return;
    }
    
    console.log('⬅️ Returning to Editor with updates');
    
    // Export current state to Mermaid
    const mindmapData = {
      title: title,
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.data.label,
        description: n.data.description,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
      })),
    };
    const mermaidCode = mindmapExporter.export(mindmapData, 'mermaid-mindmap');
    
    // Extract PM data from nodes
    const pmData: Record<string, any> = {};
    nodes.forEach((node) => {
      if (node.data.description || node.data.startDate || node.data.status) {
        pmData[node.id] = {
          description: node.data.description,
          startDate: node.data.startDate,
          endDate: node.data.endDate,
          status: node.data.status,
          priority: node.data.priority,
          assignee: node.data.assignee,
          estimate: node.data.estimate,
          progress: node.data.progress,
          tags: node.data.tags,
        };
      }
    });
    
    // Save updates to session
    sessionService.saveStudioUpdate({
      sessionId: session.sessionId,
      updatedDiagram: mermaidCode,
      nodes,
      edges,
      pmData,
      layout: currentLayout,
      timestamp: Date.now(),
    });
    
    // Navigate back
    window.location.href = session.returnUrl;
  }, [nodes, edges, currentLayout]);
  
  // Build mindmap context for AI
  const buildMindmapContext = useCallback((): MindmapContext => {
    return {
      title,
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.data.label,
        description: n.data.description,
        level: 0, // Could calculate from edges
      })),
      edges: edges.map(e => ({
        source: e.source,
        target: e.target,
      })),
    };
  }, [title, nodes, edges]);

  // Smart Expand All - AI expands every node
  const handleSmartExpandAll = useCallback(async () => {
    const context = buildMindmapContext();
    const newNodesAndEdges: { nodes: Node[]; edges: Edge[] } = { nodes: [], edges: [] };
    
    let successCount = 0;
    let failCount = 0;
    
    for (const node of nodes) {
      // Skip if node already has 3+ children
      const childCount = edges.filter(e => e.source === node.id).length;
      if (childCount >= 3) {
        console.log(`⏭️ Skipping "${node.data.label}" (already has ${childCount} children)`);
        continue;
      }
      
      try {
        console.log(`🧠 Expanding "${node.data.label}"...`);
        
        // Generate children with AI
        const children = await mindmapAIService.generateChildNodes(
          node.id,
          context,
          { count: 3 - childCount, style: 'concise' }
        );
        
        // Create nodes for each child
        const childNodes: Node[] = children.map((child, idx) => {
          const childId = `node-${Date.now()}-${node.id}-${idx}`;
          return {
            id: childId,
            type: 'mindNode',
            position: { 
              x: node.position.x + (idx - 1) * 250, 
              y: node.position.y + 150 
            },
            data: { 
              label: child.label,
              description: child.description,
            },
          };
        });
        
        // Create edges
        const childEdges: Edge[] = childNodes.map(childNode => ({
          id: `edge-${node.id}-${childNode.id}`,
          source: node.id,
          target: childNode.id,
          type: getReactFlowEdgeType(edgeType),
          markerEnd: { type: 'arrowclosed', color: '#64748b' },
          style: { stroke: '#64748b', strokeWidth: 2 },
        }));
        
        newNodesAndEdges.nodes.push(...childNodes);
        newNodesAndEdges.edges.push(...childEdges);
        
        successCount++;
        console.log(`✅ Expanded "${node.data.label}" with ${children.length} children`);
      } catch (error) {
        console.error(`❌ Failed to expand "${node.data.label}":`, error);
        failCount++;
      }
    }
    
    // Add all new nodes and edges at once
    if (newNodesAndEdges.nodes.length > 0) {
      setNodes(nds => [...nds, ...newNodesAndEdges.nodes]);
      setEdges(eds => [...eds, ...newNodesAndEdges.edges]);
      
      alert(`🎉 Smart Expand Complete!\n\n✅ ${successCount} nodes expanded\n🆕 ${newNodesAndEdges.nodes.length} new nodes created${failCount > 0 ? `\n❌ ${failCount} failed` : ''}`);
    } else {
      alert('All nodes already have sufficient children! 🎯');
    }
  }, [nodes, edges, title, edgeType, setNodes, setEdges, buildMindmapContext, getReactFlowEdgeType]);

  // Auto-Connect - AI finds hidden relationships
  const handleAutoConnect = useCallback(async () => {
    if (nodes.length < 3) {
      alert('❌ Need at least 3 nodes to suggest connections!');
      return;
    }

    const context = buildMindmapContext();
    
    try {
      console.log('🔗 Finding smart connections...');
      
      // Get AI suggestions
      const suggestions = await mindmapAIService.suggestConnections(context, 5);
      
      if (suggestions.length === 0) {
        alert('✅ Your mindmap is already well-connected! No new connections needed.');
        return;
      }
      
      // Create preview message
      const previewText = suggestions.map((s, idx) => {
        const sourceNode = nodes.find(n => n.id === s.source);
        const targetNode = nodes.find(n => n.id === s.target);
        return `${idx + 1}. "${sourceNode?.data.label}" → "${targetNode?.data.label}"\n   💡 ${s.reason}`;
      }).join('\n\n');
      
      const confirmed = confirm(`🔗 AI found ${suggestions.length} smart connections:\n\n${previewText}\n\nAdd these connections?`);
      
      if (!confirmed) {
        console.log('❌ User cancelled auto-connect');
        return;
      }
      
      // Create new edges
      const newEdges: Edge[] = suggestions.map(s => ({
        id: `edge-${s.source}-${s.target}-${Date.now()}`,
        source: s.source,
        target: s.target,
        type: 'default', // Use bezier for cross-connections
        label: s.reason.split(' ').slice(0, 3).join(' '), // Short label
        labelStyle: { fill: '#3b82f6', fontSize: 10, fontWeight: 600 },
        style: { 
          stroke: '#3b82f6', 
          strokeWidth: 2,
          strokeDasharray: '5,5', // Dashed to distinguish from hierarchy
        },
        markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
        animated: true, // Animated to show they're AI-suggested
        data: { aiGenerated: true, reason: s.reason },
      }));
      
      setEdges(eds => [...eds, ...newEdges]);
      alert(`✨ Added ${newEdges.length} smart connections!`);
      
    } catch (error) {
      console.error('❌ Auto-connect failed:', error);
      alert('❌ Failed to find connections. Please try again.');
    }
  }, [nodes, edges, buildMindmapContext, setEdges]);

  // Quality Audit - AI analyzes mindmap
  const handleQualityAudit = useCallback(async () => {
    if (nodes.length === 0) {
      alert('❌ No nodes to analyze!');
      return;
    }

    const context = buildMindmapContext();
    
    try {
      console.log('📊 Running quality audit...');
      
      // Rule-based checks
      const orphanedNodes = nodes.filter(n => 
        !edges.some(e => e.target === n.id) && !edges.some(e => e.source === n.id)
      );
      const overloadedNodes = nodes.filter(n => 
        edges.filter(e => e.source === n.id).length > 10
      );
      const leafNodes = nodes.filter(n => 
        !edges.some(e => e.source === n.id) && edges.some(e => e.target === n.id)
      );
      const rootNodes = nodes.filter(n => !edges.some(e => e.target === n.id));
      
      // AI Analysis
      const aiPrompt = `Analyze this mindmap and provide a quality assessment:

Title: "${title}"
Nodes: ${nodes.length}
Connections: ${edges.length}

Structure:
${context.nodes.map(n => `- ${n.label}${n.description ? ` (${n.description})` : ''}`).join('\n')}

Provide a JSON response:
{
  "score": 0-100,
  "summary": "Brief overall assessment",
  "strengths": ["strength 1", "strength 2"],
  "issues": [
    { "type": "structure|content|balance", "severity": "low|medium|high", "description": "..." }
  ],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

      const aiResponse = await aiService.generateContent(aiPrompt, { temperature: 0.3 });
      const analysis = JSON.parse(aiResponse.match(/\{[\s\S]*\}/)?.[0] || '{}');
      
      // Build report
      const report = `
📊 QUALITY AUDIT REPORT
${'='.repeat(50)}

SCORE: ${analysis.score || 'N/A'}/100

SUMMARY:
${analysis.summary || 'No summary available'}

${rootNodes.length > 0 ? `ROOT NODES: ${rootNodes.length}` : ''}
${leafNodes.length > 0 ? `LEAF NODES: ${leafNodes.length}` : ''}
${orphanedNodes.length > 0 ? `⚠️ ORPHANED NODES: ${orphanedNodes.length}` : ''}
${overloadedNodes.length > 0 ? `⚠️ OVERLOADED NODES: ${overloadedNodes.length} (10+ children)` : ''}

✅ STRENGTHS:
${analysis.strengths?.map((s: string) => `  • ${s}`).join('\n') || '  • Well-structured'}

⚠️ ISSUES:
${analysis.issues?.map((i: any) => `  • [${i.severity.toUpperCase()}] ${i.description}`).join('\n') || '  • None detected'}

💡 SUGGESTIONS:
${analysis.suggestions?.map((s: string) => `  • ${s}`).join('\n') || '  • Keep up the good work!'}
`;
      
      alert(report);
      console.log('✅ Quality audit complete');
      
    } catch (error) {
      console.error('❌ Quality audit failed:', error);
      alert('❌ Failed to analyze mindmap. Please try again.');
    }
  }, [nodes, edges, title, buildMindmapContext]);

  // Goal-Oriented Generation - Generate complete mindmap from prompt
  const handleGoalGeneration = useCallback(async (goal: string) => {
    if (!goal || goal.trim().length < 10) {
      alert('❌ Please provide a more detailed goal description!');
      return;
    }

    try {
      console.log('🎯 Generating mindmap from goal:', goal);
      
      // Generate mindmap with AI
      const generatedMindmap = await mindmapAIService.generateMindmapFromPrompt(
        goal,
        undefined,
        { depth: 3, style: 'detailed' }
      );
      
      // Convert to React Flow format
      const rfNodes: Node[] = generatedMindmap.nodes.map(n => ({
        id: n.id || `node-${Date.now()}-${Math.random()}`,
        type: 'mindNode',
        position: { x: 0, y: 0 }, // Will be layouted
        data: { 
          label: n.label,
          description: n.description,
        },
      }));
      
      const rfEdges: Edge[] = generatedMindmap.edges.map(e => ({
        id: `edge-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        type: getReactFlowEdgeType(edgeType),
        markerEnd: { type: 'arrowclosed', color: '#64748b' },
        style: { stroke: '#64748b', strokeWidth: 2 },
      }));
      
      if (rfNodes.length === 0) {
        alert('❌ Failed to generate mindmap. Please try a different goal.');
        return;
      }
      
      // Confirm replacement
      const confirmed = confirm(
        `🎯 AI generated a mindmap with ${rfNodes.length} nodes!\n\n` +
        `Title: "${generatedMindmap.title}"\n\n` +
        `This will REPLACE your current mindmap. Continue?`
      );
      
      if (!confirmed) {
        console.log('❌ User cancelled goal generation');
        return;
      }
      
      // Apply tree layout
      console.log('🎨 Applying tree layout...');
      const { nodes: layoutedNodes, edges: layoutedEdges } = 
        await getLayoutedElements(rfNodes, rfEdges, 'tree');
      
      // Replace nodes and edges
      setTitle(generatedMindmap.title);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setCurrentLayout('tree');
      
      alert(`✨ Generated ${layoutedNodes.length} nodes with hierarchical layout!`);
      console.log('✅ Goal generation complete');
      
    } catch (error) {
      console.error('❌ Goal generation failed:', error);
      alert('❌ Failed to generate mindmap. Please try again with a different prompt.');
    }
  }, [edgeType, setTitle, setNodes, setEdges, setCurrentLayout, getReactFlowEdgeType]);

  // AI Reorganize - Optimize structure and grouping
  const handleReorganize = useCallback(async () => {
    if (nodes.length < 5) {
      alert('❌ Need at least 5 nodes to reorganize!');
      return;
    }

    const context = buildMindmapContext();
    
    try {
      console.log('✨ Analyzing structure for reorganization...');
      
      // Analyze current structure
      const orphanedNodes = nodes.filter(n => 
        !edges.some(e => e.target === n.id) && !edges.some(e => e.source === n.id)
      );
      const overloadedNodes = nodes.filter(n => 
        edges.filter(e => e.source === n.id).length > 10
      );
      const singleChildChains = nodes.filter(n => {
        const children = edges.filter(e => e.source === n.id);
        return children.length === 1 && edges.filter(e => e.target === n.id).length === 1;
      });
      
      // Build AI prompt
      const aiPrompt = `Analyze this mindmap structure and suggest improvements:

Title: "${title}"
Nodes: ${nodes.length}
Connections: ${edges.length}

Issues found:
- ${orphanedNodes.length} orphaned nodes (disconnected)
- ${overloadedNodes.length} overloaded nodes (10+ children)
- ${singleChildChains.length} single-child chains (could be merged)

Current structure:
${context.nodes.map(n => `- ${n.label}`).join('\n')}

Suggest reorganization improvements:
1. Which nodes should be grouped into milestones?
2. Which nodes should be merged?
3. Which nodes should be moved to different parents?
4. What new intermediate nodes should be added for clarity?

Respond with JSON:
{
  "summary": "Brief description of suggested changes",
  "groupings": [
    { "milestone": "Milestone Name", "nodeIds": ["id1", "id2"] }
  ],
  "merges": [
    { "nodeIds": ["id1", "id2"], "newLabel": "Merged Name" }
  ],
  "moves": [
    { "nodeId": "id1", "newParentId": "id2", "reason": "..." }
  ],
  "score": 0-100
}`;

      const aiResponse = await aiService.generateContent(aiPrompt, { temperature: 0.4 });
      const suggestions = JSON.parse(aiResponse.match(/\{[\s\S]*\}/)?.[0] || '{}');
      
      // Show suggestions
      const report = `
✨ REORGANIZATION SUGGESTIONS
${'='.repeat(50)}

IMPROVEMENT SCORE: ${suggestions.score || 'N/A'}/100

SUMMARY:
${suggestions.summary || 'No major issues found'}

📊 GROUPINGS (${suggestions.groupings?.length || 0}):
${suggestions.groupings?.map((g: any) => 
  `  • "${g.milestone}" - ${g.nodeIds?.length || 0} nodes`
).join('\n') || '  None suggested'}

🔗 MERGES (${suggestions.merges?.length || 0}):
${suggestions.merges?.map((m: any) => 
  `  • Merge ${m.nodeIds?.length || 0} nodes → "${m.newLabel}"`
).join('\n') || '  None suggested'}

↔️ MOVES (${suggestions.moves?.length || 0}):
${suggestions.moves?.map((m: any) => 
  `  • Move node to different parent - ${m.reason}`
).join('\n') || '  None suggested'}

Note: Auto-apply coming soon! For now, use these suggestions manually.
`;
      
      alert(report);
      console.log('✅ Reorganization analysis complete');
      
    } catch (error) {
      console.error('❌ Reorganize failed:', error);
      alert('❌ Failed to analyze structure. Please try again.');
    }
  }, [nodes, edges, title, buildMindmapContext]);

  // Helper: Record action in history with proper state capture
  const recordInHistory = useCallback((
    action: 'add' | 'modify' | 'delete' | 'reorganize' | 'connect',
    description: string,
    beforeNodes: Node[],
    beforeEdges: Edge[],
    afterNodes: Node[],
    afterEdges: Edge[],
    affectedNodeIds: string[]
  ) => {
    actionHistoryManager.recordAction(
      action,
      description,
      { nodes: beforeNodes, edges: beforeEdges },
      { nodes: afterNodes, edges: afterEdges },
      affectedNodeIds
    );
  }, []);

  // Undo last AI action
  const handleUndo = useCallback(() => {
    const result = actionHistoryManager.undo();
    
    if (!result) {
      setChatMessages(prev => [...prev, { role: 'ai', content: '⚠️ Nothing to undo!' }]);
      return;
    }
    
    console.log('↩️ Undoing:', result.description);
    
    // Restore previous state
    setNodes(result.nodes);
    setEdges(result.edges);
    
    // Show feedback in chat
    setChatMessages(prev => [...prev, { 
      role: 'ai', 
      content: `↩️ Undone: ${result.description}` 
    }]);
  }, [setNodes, setEdges]);

  // Redo last undone action
  const handleRedo = useCallback(() => {
    const result = actionHistoryManager.redo();
    
    if (!result) {
      setChatMessages(prev => [...prev, { role: 'ai', content: '⚠️ Nothing to redo!' }]);
      return;
    }
    
    console.log('↪️ Redoing:', result.description);
    
    // Restore next state
    setNodes(result.nodes);
    setEdges(result.edges);
    
    // Show feedback in chat
    setChatMessages(prev => [...prev, { 
      role: 'ai', 
      content: `↪️ Redone: ${result.description}` 
    }]);
  }, [setNodes, setEdges]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z or Cmd+Shift+Z for redo
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl+Y or Cmd+Y for redo (alternative)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Utility: Find nodes by pattern for multi-node operations
  const findNodesByPattern = useCallback((pattern: string, targetString: string): Node[] => {
    console.log(`🔍 Finding nodes by pattern: "${pattern}" from target: "${targetString}"`);
    
    // Handle special cases
    if (targetString === 'all') {
      console.log(`✅ Found ALL nodes: ${nodes.length}`);
      return nodes;
    }
    
    // Extract pattern from "pattern:keyword" format
    const keyword = targetString.startsWith('pattern:') 
      ? targetString.replace('pattern:', '') 
      : pattern || targetString;
    
    if (!keyword) {
      console.warn('⚠️ No keyword provided for pattern matching');
      return [];
    }
    
    // Find nodes whose labels include the keyword (case-insensitive)
    const matchedNodes = nodes.filter(node => 
      node.data.label.toLowerCase().includes(keyword.toLowerCase())
    );
    
    console.log(`✅ Found ${matchedNodes.length} nodes matching "${keyword}":`, matchedNodes.map(n => n.data.label));
    return matchedNodes;
  }, [nodes]);

  // Chat with Mindmap - Natural language commands
  const handleChatCommand = useCallback(async (prompt: string) => {
    if (!prompt || prompt.trim().length < 5) {
      setChatMessages(prev => [...prev, { role: 'ai', content: '❌ Please provide a command!' }]);
      return;
    }

    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setChatLoading(true);

    const context = buildMindmapContext();
    
    // BRAINSTORM MODE: Conversational AI like ChatGPT
    if (chatMode === 'brainstorm') {
      try {
        console.log('💭 Brainstorm mode - having conversation...');
        
        // Check if user wants to commit ideas to mindmap
        const commitPhrases = [
          'add them',
          'add these',
          'add it',
          'create nodes',
          'make the mindmap',
          'let\'s do it',
          'sounds good',
          'yes add',
          'add to mindmap',
          'create it',
        ];
        
        const isReadyToCommit = commitPhrases.some(phrase => 
          prompt.toLowerCase().includes(phrase)
        );
        
        if (isReadyToCommit) {
          console.log('✅ User ready to commit! Extracting ideas and creating nodes...');
          console.log('🎯 Discussion target node:', discussionTargetNode);
          
          // Switch to command mode temporarily to execute
          const extractPrompt = `Based on our conversation, extract the key ideas that should be added to the mindmap.

Conversation so far:
${conversationContext.slice(-5).join('\n')}

Latest user message: "${prompt}"

${discussionTargetNode ? `🎯 IMPORTANT: We were discussing the "${discussionTargetNode}" node. Add ideas UNDER this node!` : ''}

Extract the main topics/ideas that should become mindmap nodes. Respond with JSON:
{
  "action": "add",
  "target": "${discussionTargetNode || 'root'}",
  "details": {
    "count": number,
    "topics": ["topic 1", "topic 2", ...],
    "topic": "overall theme"
  },
  "response": "Brief confirmation"
}`;

          const extractResponse = await aiService.generateContent(extractPrompt, { temperature: 0.3 });
          let jsonStr = extractResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            
            // Find target node - prioritize discussion target!
            let targetNode: Node | undefined;
            
            if (discussionTargetNode) {
              // Find the node we were discussing
              targetNode = nodes.find(n => 
                n.data.label.toLowerCase() === discussionTargetNode.toLowerCase()
              );
              console.log(`🎯 Found discussion target: "${targetNode?.data.label}"`);
            }
            
            // Fallback to root if no discussion target
            if (!targetNode) {
              targetNode = nodes.find(n => !edges.some(e => e.target === n.id)) || nodes[0];
              console.log(`📍 Using fallback target: "${targetNode?.data.label}"`);
            }
            
            // Generate nodes from topics
            const topics = parsed.details.topics || [];
            const newNodes: Node[] = topics.map((topic: string, idx: number) => ({
              id: `node-${Date.now()}-${idx}`,
              type: 'mindNode',
              position: { 
                x: (targetNode?.position.x || 400) + (idx - Math.floor(topics.length / 2)) * 250, 
                y: (targetNode?.position.y || 300) + 150 
              },
              data: { label: topic },
            }));
            
            const newEdges: Edge[] = newNodes.map(n => ({
              id: `edge-${targetNode?.id || nodes[0].id}-${n.id}`,
              source: targetNode?.id || nodes[0].id,
              target: n.id,
              type: getReactFlowEdgeType(edgeType),
              markerEnd: { type: 'arrowclosed', color: '#64748b' },
              style: { stroke: '#64748b', strokeWidth: 2 },
            }));
            
            setNodes(nds => [...nds, ...newNodes]);
            setEdges(eds => [...eds, ...newEdges]);
            
            const targetName = targetNode?.data.label || 'root';
            setChatMessages(prev => [...prev, { 
              role: 'ai', 
              content: `✅ Great! I've added ${newNodes.length} nodes under "${targetName}":\n\n${topics.map((t: string) => `• ${t}`).join('\n')}\n\nWhat would you like to explore next?`
            }]);
            
            // Clear conversation context AND discussion target after committing
            setConversationContext([]);
            setDiscussionTargetNode(null);
            console.log('🧹 Cleared discussion target and context');
          }
        } else {
          // Continue brainstorming conversation
          console.log('💬 Continuing brainstorm conversation...');
          
          // Detect if user mentioned a specific node (track discussion target)
          const nodeList = nodes.map(n => n.data.label);
          const mentionedNode = nodeList.find(label => 
            prompt.toLowerCase().includes(label.toLowerCase())
          );
          
          if (mentionedNode) {
            console.log(`🎯 User mentioned node: "${mentionedNode}" - setting as discussion target`);
            setDiscussionTargetNode(mentionedNode);
          }
          
          const brainstormPrompt = `You are a brainstorming partner for mindmap creation. Have a natural conversation like ChatGPT.

Current Mindmap: "${title}" with ${nodes.length} nodes
Existing nodes: ${nodeList.join(', ')}

${discussionTargetNode ? `🎯 Currently discussing: "${discussionTargetNode}"` : ''}

Conversation so far:
${conversationContext.slice(-5).join('\n')}

User: "${prompt}"

YOUR ROLE:
1. Ask clarifying questions to understand their goal
2. Suggest 5-7 specific, actionable ideas
3. Discuss and refine ideas based on feedback
4. Be conversational and helpful like ChatGPT
5. DO NOT add nodes yet - just brainstorm
6. If user mentions a specific node name, remember it for later targeting

When suggesting ideas:
- Be specific and actionable
- Group related ideas
- Ask which ones resonate
- Offer to explore deeper

Keep responses concise (3-5 sentences) unless providing a list of ideas.

IMPORTANT: Do NOT include JSON or commands. Just have a natural conversation.`;

          const response = await aiService.generateContent(brainstormPrompt, { 
            systemPrompt: brainstormPrompt,
            temperature: 0.7 
          });
          
          setChatMessages(prev => [...prev, { role: 'ai', content: response }]);
          
          // Track conversation context
          setConversationContext(prev => [...prev, `User: ${prompt}`, `AI: ${response}`]);
        }
      } catch (error) {
        console.error('❌ Brainstorm error:', error);
        setChatMessages(prev => [...prev, { 
          role: 'ai', 
          content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]);
      } finally {
        setChatLoading(false);
      }
      return; // Exit early - brainstorm mode handled
    }
    
    // COMMAND MODE: Direct execution (original behavior)
    try {
      console.log('⚡ Command mode - executing directly...');
      
      // Parse command with AI
      const nodeList = nodes.map(n => n.data.label).join(', ');
      
      // Get conversation context
      const contextSummary = chatContextManager.getContextSummary(
        nodes.map(n => ({ id: n.id, label: n.data.label }))
      );
      
      // Check if command contains pronouns
      const hasPronoun = chatContextManager.containsPronoun(prompt);
      
        const parsePrompt = `Parse this mindmap command and determine the action. BE ACTION-ORIENTED! Support MULTI-NODE operations and CONTEXT-AWARE pronouns.

User Command: "${prompt}"

Current Mindmap Context:
- Title: "${title}"
- ${nodes.length} nodes
- ${edges.length} connections

EXISTING NODE LABELS:
${nodeList}

CONVERSATION CONTEXT:
${contextSummary}

${hasPronoun ? '⚠️ PRONOUN DETECTED: User is referring to previous nodes. Use conversation context to resolve "them", "it", "these".' : ''}

Respond with JSON:
{
  "action": "add" | "modify" | "analyze" | "organize" | "query",
  "target": "exact node label" | "root" | "none" | "all" | "pattern:keyword" | "context",
  "isMultiNode": boolean (true if operating on multiple nodes),
  "useContext": boolean (true if using pronouns to reference context),
  "details": {
    "count": number (if adding/modifying nodes),
    "topic": "what to add/modify",
    "newLabel": "new label if renaming",
    "changes": "what changes to make",
    "pattern": "keyword to match nodes (for multi-node ops)",
    "reason": "explanation"
  },
  "response": "Brief confirmation of what you're doing"
}

CRITICAL RULES:
1. Use EXACT node labels from the list above
2. "enhance/improve/enrich/make better" → action: "modify"
3. "add/create/insert" → action: "add"
4. "analyze/question" → action: "analyze" or "query"
5. Keep response SHORT and action-focused
6. If no specific node mentioned, use "root"

MULTI-NODE DETECTION:
7. "all X nodes" → {"target": "pattern:X", "isMultiNode": true}
8. "each X" → {"target": "pattern:X", "isMultiNode": true}
9. "every X" → {"target": "pattern:X", "isMultiNode": true}
10. "all nodes" → {"target": "all", "isMultiNode": true}

CONTEXT-AWARE (PRONOUNS):
11. "them/these/those" → {"target": "context", "useContext": true, "isMultiNode": true}
12. "it/this/that" → {"target": "context", "useContext": true, "isMultiNode": false}
13. Use CONVERSATION CONTEXT above to understand what user is referring to

Examples:
- "Add 3 marketing strategies to Marketing Phase" → {"action": "add", "target": "Marketing Phase", "isMultiNode": false, "useContext": false, "details": {"count": 3, "topic": "marketing strategies"}, "response": "Adding 3 marketing strategies..."}
- "Make Post-Launch more creative" → {"action": "modify", "target": "Post-Launch", "isMultiNode": false, "useContext": false, "details": {"changes": "enhance creativity"}, "response": "Enhancing Post-Launch node..."}
- "Enhance all marketing nodes" → {"action": "modify", "target": "pattern:marketing", "isMultiNode": true, "useContext": false, "details": {"changes": "enhance content", "pattern": "marketing"}, "response": "Enhancing all marketing nodes..."}
- "Enhance them" (after previous action) → {"action": "modify", "target": "context", "isMultiNode": true, "useContext": true, "details": {"changes": "enhance"}, "response": "Enhancing those nodes..."}
- "Make it more detailed" → {"action": "modify", "target": "context", "isMultiNode": false, "useContext": true, "details": {"changes": "add detail"}, "response": "Adding more detail..."}
- "What's missing?" → {"action": "analyze", "target": "none", "isMultiNode": false, "useContext": false, "response": "Analyzing mindmap..."}`;

      const parseResponse = await aiService.generateContent(parsePrompt, { temperature: 0.3 });
      
      console.log('📥 Raw AI Response:', parseResponse);
      
      // Extract JSON from response (handles markdown code blocks)
      let jsonStr = parseResponse;
      
      // Remove markdown code blocks if present
      if (jsonStr.includes('```')) {
        console.log('🔧 Removing markdown code blocks...');
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      console.log('🔍 Cleaned JSON string:', jsonStr);
      
      // Extract JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON found in response!');
        throw new Error('No JSON found in AI response');
      }
      
      console.log('✂️ Extracted JSON:', jsonMatch[0]);
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      console.log('✅ Parsed command:', parsed);
      console.log('📍 Target node:', parsed.target);
      
      // Execute based on action type
      switch (parsed.action) {
        case 'add': {
          // Extract exact node name from quotes if present (from slash command)
          const quotedMatch = prompt.match(/"([^"]+)"/);
          let exactNodeName = quotedMatch ? quotedMatch[1] : null;
          
          // Find target node - be smart about it!
          let targetNode = exactNodeName
            ? nodes.find(n => n.data.label === exactNodeName) // Exact match from slash command
            : nodes.find(n => n.data.label.toLowerCase().includes(parsed.target.toLowerCase())); // Fuzzy match
          
          // If no specific target, use root or first node
          if (!targetNode && (parsed.target === 'all' || parsed.target === 'none' || parsed.target === 'root' || !parsed.target)) {
            // Find root node (no incoming edges)
            targetNode = nodes.find(n => !edges.some(e => e.target === n.id)) || nodes[0];
            console.log(`✅ Using root node: "${targetNode?.data.label}"`);
          }
          
          if (!targetNode) {
            const errorMsg = `❌ Couldn't find node "${parsed.target || exactNodeName}". Try using / to select a node precisely.`;
            setChatMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
            console.error(errorMsg);
            return;
          }
          
          console.log(`✅ Found target node: "${targetNode.data.label}"`);
          
          // Generate new nodes
          const count = parsed.details.count || 3;
          const children = await mindmapAIService.generateChildNodes(
            targetNode?.id || nodes[0].id,
            context,
            { count, focus: parsed.details.topic }
          );
          
          // Add to canvas
          const newNodes: Node[] = children.map((child, idx) => ({
            id: `node-${Date.now()}-${idx}`,
            type: 'mindNode',
            position: { 
              x: (targetNode?.position.x || 400) + (idx - 1) * 250, 
              y: (targetNode?.position.y || 300) + 150 
            },
            data: { label: child.label, description: child.description },
          }));
          
          const newEdges: Edge[] = newNodes.map(n => ({
            id: `edge-${targetNode?.id || nodes[0].id}-${n.id}`,
            source: targetNode?.id || nodes[0].id,
            target: n.id,
            type: getReactFlowEdgeType(edgeType),
            markerEnd: { type: 'arrowclosed', color: '#64748b' },
            style: { stroke: '#64748b', strokeWidth: 2 },
          }));
          
          // Record in history (BEFORE state)
          const beforeState = { nodes: [...nodes], edges: [...edges] };
          
          setNodes(nds => [...nds, ...newNodes]);
          setEdges(eds => [...eds, ...newEdges]);
          
          // Record in history (AFTER state)
          const afterState = { nodes: [...nodes, ...newNodes], edges: [...edges, ...newEdges] };
          actionHistoryManager.recordAction(
            'add',
            `Added ${newNodes.length} nodes to "${targetNode?.data.label || 'root'}"`,
            beforeState,
            afterState,
            newNodes.map(n => n.id)
          );
          
          // Record in context
          chatContextManager.recordAction('add', newNodes.map(n => n.id), `Added ${newNodes.length} nodes to "${targetNode?.data.label || 'root'}"`);
          
          // Add AI response to chat
          const aiResponse = `✅ ${parsed.response}\n\nAdded ${newNodes.length} new nodes!`;
          setChatMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
          break;
        }
        
        case 'modify': {
          // Check if using context (pronouns)
          if (parsed.useContext) {
            console.log('🧠 Context-aware command detected');
            
            // Resolve nodes from context
            const contextNodeIds = chatContextManager.resolvePronoun(prompt);
            
            if (!contextNodeIds || contextNodeIds.length === 0) {
              const errorMsg = `❌ I don't have any recent context to work with. Try being more specific or adding/modifying nodes first.`;
              setChatMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
              return;
            }
            
            // Find the actual nodes
            const targetNodes = nodes.filter(n => contextNodeIds.includes(n.id));
            
            if (targetNodes.length === 0) {
              const errorMsg = `❌ The nodes I was working with seem to have been deleted.`;
              setChatMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
              return;
            }
            
            console.log(`✅ Resolved context to ${targetNodes.length} nodes:`, targetNodes.map(n => n.data.label));
            
            // Show action feedback
            const nodeNames = targetNodes.slice(0, 3).map(n => n.data.label).join(', ') + (targetNodes.length > 3 ? '...' : '');
            setChatMessages(prev => [...prev, { role: 'ai', content: `🔄 ${parsed.response}\n\nWorking on: ${nodeNames}` }]);
            
            // Enhance all nodes in parallel
            const enhancementPromises = targetNodes.map(async (node) => {
              try {
                const enhanced = await mindmapAIService.enhanceNode(
                  node.id,
                  context,
                  { 
                    type: parsed.details.changes?.includes('creative') || parsed.details.changes?.includes('creativity') 
                      ? 'description' 
                      : 'both',
                    style: 'creative'
                  }
                );
                return { nodeId: node.id, enhanced, success: true };
              } catch (error) {
                console.error(`❌ Failed to enhance node ${node.data.label}:`, error);
                return { nodeId: node.id, enhanced: null, success: false };
              }
            });
            
            const results = await Promise.all(enhancementPromises);
            const successCount = results.filter(r => r.success).length;
            
            // Capture before state
            const beforeNodesState = [...nodes];
            const beforeEdgesState = [...edges];
            
            // Update all nodes at once
            const updatedNodes = nodes.map(n => {
              const result = results.find(r => r.nodeId === n.id && r.success);
              return result ? { ...n, data: { ...n.data, ...result.enhanced } } : n;
            });
            
            setNodes(updatedNodes);
            
            // Record in history
            recordInHistory(
              'modify',
              `Enhanced ${targetNodes.length} nodes (context)`,
              beforeNodesState,
              beforeEdgesState,
              updatedNodes,
              edges,
              contextNodeIds
            );
            
            // Record in context
            chatContextManager.recordAction('modify', contextNodeIds, `Enhanced ${targetNodes.length} nodes`);
            
            // Show success message
            const successMsg = `✅ Enhanced ${successCount}/${targetNodes.length} nodes!`;
            setChatMessages(prev => [...prev, { role: 'ai', content: successMsg }]);
            break;
          }
          
          // Check if multi-node operation
          if (parsed.isMultiNode) {
            console.log('🔄 Multi-node modification detected');
            
            // Find all matching nodes
            const targetNodes = findNodesByPattern(parsed.details?.pattern || '', parsed.target);
            
            if (targetNodes.length === 0) {
              const errorMsg = `❌ No nodes found matching "${parsed.details?.pattern || parsed.target}".`;
              setChatMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
              return;
            }
            
            console.log(`✅ Found ${targetNodes.length} nodes for modification`);
            
            // Show action feedback
            setChatMessages(prev => [...prev, { role: 'ai', content: `🔄 ${parsed.response}\n\nEnhancing ${targetNodes.length} nodes...` }]);
            
            // Enhance all nodes in parallel
            const enhancementPromises = targetNodes.map(async (node) => {
              try {
                const enhanced = await mindmapAIService.enhanceNode(
                  node.id,
                  context,
                  { 
                    type: parsed.details.changes?.includes('creative') || parsed.details.changes?.includes('creativity') 
                      ? 'description' 
                      : 'both',
                    style: 'creative'
                  }
                );
                return { nodeId: node.id, enhanced, success: true };
              } catch (error) {
                console.error(`❌ Failed to enhance node ${node.data.label}:`, error);
                return { nodeId: node.id, enhanced: null, success: false };
              }
            });
            
            const results = await Promise.all(enhancementPromises);
            const successCount = results.filter(r => r.success).length;
            
            // Capture before state
            const beforeNodesState = [...nodes];
            const beforeEdgesState = [...edges];
            
            // Update all nodes at once
            const updatedNodes = nodes.map(n => {
              const result = results.find(r => r.nodeId === n.id && r.success);
              return result ? { ...n, data: { ...n.data, ...result.enhanced } } : n;
            });
            
            setNodes(updatedNodes);
            
            // Record in history
            recordInHistory(
              'modify',
              `Enhanced ${targetNodes.length} nodes (multi)`,
              beforeNodesState,
              beforeEdgesState,
              updatedNodes,
              edges,
              targetNodes.map(n => n.id)
            );
            
            // Record in context
            chatContextManager.recordAction('modify', targetNodes.map(n => n.id), `Enhanced ${targetNodes.length} nodes`);
            
            // Show success message
            const successMsg = `✅ Enhanced ${successCount}/${targetNodes.length} nodes!\n\n📊 Updated: ${targetNodes.slice(0, 3).map(n => n.data.label).join(', ')}${targetNodes.length > 3 ? '...' : ''}`;
            setChatMessages(prev => [...prev, { role: 'ai', content: successMsg }]);
            break;
          }
          
          // Single-node modification (original logic)
          const quotedMatch = prompt.match(/"([^"]+)"/);
          let exactNodeName = quotedMatch ? quotedMatch[1] : null;
          
          // Find target node
          let targetNode = exactNodeName
            ? nodes.find(n => n.data.label === exactNodeName)
            : nodes.find(n => n.data.label.toLowerCase().includes(parsed.target.toLowerCase()));
          
          if (!targetNode) {
            const errorMsg = `❌ Couldn't find node "${parsed.target || exactNodeName}". Try using / to select a node precisely.`;
            setChatMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
            console.error(errorMsg);
            return;
          }
          
          console.log(`✅ Found target node for modification: "${targetNode.data.label}"`);
          
          // Show action feedback
          setChatMessages(prev => [...prev, { role: 'ai', content: `🔄 ${parsed.response}` }]);
          
          // Capture before state
          const beforeNodesState = [...nodes];
          const beforeEdgesState = [...edges];
          
          // Use AI to enhance the node
          const enhanced = await mindmapAIService.enhanceNode(
            targetNode.id,
            context,
            { 
              type: parsed.details.changes?.includes('creative') || parsed.details.changes?.includes('creativity') 
                ? 'description' 
                : 'both',
              style: 'creative'
            }
          );
          
          // Update the node with enhanced content
          const updatedNodes = nodes.map(n => 
            n.id === targetNode.id 
              ? { ...n, data: { ...n.data, ...enhanced } }
              : n
          );
          
          setNodes(updatedNodes);
          
          // Record in history
          recordInHistory(
            'modify',
            `Enhanced "${targetNode.data.label}"`,
            beforeNodesState,
            beforeEdgesState,
            updatedNodes,
            edges,
            [targetNode.id]
          );
          
          // Record in context
          chatContextManager.recordAction('modify', [targetNode.id], `Enhanced "${targetNode.data.label}"`);
          
          // Show success message
          const successMsg = `✅ Enhanced "${targetNode.data.label}"!\n\n📝 ${enhanced.description || 'Updated with richer content.'}`;
          setChatMessages(prev => [...prev, { role: 'ai', content: successMsg }]);
          break;
        }
        
        case 'analyze': {
          // Add AI response to chat
          setChatMessages(prev => [...prev, { role: 'ai', content: '📊 Running quality audit...' }]);
          // Run quality audit
          await handleQualityAudit();
          break;
        }
        
        case 'organize': {
          // Add AI response to chat
          setChatMessages(prev => [...prev, { role: 'ai', content: '✨ Analyzing structure for reorganization...' }]);
          // Run reorganize
          await handleReorganize();
          break;
        }
        
        case 'query': {
          // Add AI response to chat
          setChatMessages(prev => [...prev, { role: 'ai', content: parsed.response }]);
          break;
        }
        
        default: {
          // Add AI response to chat
          setChatMessages(prev => [...prev, { role: 'ai', content: parsed.response || 'Command received, but not yet implemented!' }]);
        }
      }
      
      console.log('✅ Chat command executed');
      
    } catch (error) {
      console.error('❌ Chat command failed:', error);
      console.error('Error details:', error);
      
      // Show detailed error in chat for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        content: `❌ Failed to understand command.\n\nError: ${errorMessage}\n\nPlease try:\n• Using / to select a node\n• Being more specific\n• Check console for details` 
      }]);
    } finally {
      setChatLoading(false);
    }
  }, [nodes, edges, title, edgeType, buildMindmapContext, setNodes, setEdges, getReactFlowEdgeType, handleQualityAudit, handleReorganize]);

  // Expose handleChatCommand to window for proactive suggestions
  useEffect(() => {
    (window as any)._handleChatCommand = handleChatCommand;
    return () => {
      delete (window as any)._handleChatCommand;
    };
  }, [handleChatCommand]);

  // Handle chat input changes - detect "/" for node selector
  const handleChatInputChange = useCallback((value: string) => {
    setChatInput(value);
    
    // Check if "/" is present and show node dropdown
    const lastSlashIndex = value.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      const searchTerm = value.slice(lastSlashIndex + 1).toLowerCase();
      const filtered = nodes.filter(n => 
        n.data.label.toLowerCase().includes(searchTerm)
      );
      setFilteredNodes(filtered);
      setShowNodeDropdown(true);
      setSelectedNodeIndex(0);
    } else {
      setShowNodeDropdown(false);
    }
  }, [nodes]);

  // Select node from dropdown
  const handleNodeSelect = useCallback((nodeLabel: string) => {
    const lastSlashIndex = chatInput.lastIndexOf('/');
    const newInput = chatInput.slice(0, lastSlashIndex) + `"${nodeLabel}"`;
    setChatInput(newInput);
    setShowNodeDropdown(false);
  }, [chatInput]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Load template
  // Handle AI Tools actions
  const handleAIAction = useCallback(async (action: AIAction) => {
    console.log('🤖 AI ACTION:', action.type, action.data);
    setAILoading(true);
    
    try {
      switch (action.type) {
        case 'expand-all':
          await handleSmartExpandAll();
          break;
        case 'auto-connect':
          await handleAutoConnect();
          break;
        case 'reorganize':
          await handleReorganize();
          break;
        case 'goal-generate':
          await handleGoalGeneration(action.data.goal);
          break;
        case 'quality-audit':
          await handleQualityAudit();
          break;
      }
    } catch (error) {
      console.error('AI Action failed:', error);
      alert('AI action failed. Please try again.');
    } finally {
      setAILoading(false);
    }
  }, []);

  const handleLoadTemplate = useCallback((template: MindmapTemplate) => {
    setTitle(template.name);

    const templateNodes: Node[] = template.nodes.map(n => ({
      id: n.id,
      type: 'mindNode',
      position: { x: n.x || 0, y: n.y || 0 },
      data: {
        label: n.label,
        description: n.description,
        // Callbacks will be injected by useEffect
      },
    }));

    const templateEdges: Edge[] = template.links.map(link => ({
      id: `edge-${link.source}-${link.target}`,
      source: link.source,
      target: link.target,
      type: 'smoothstep',
      animated: false,
    }));

    setNodes(templateNodes);
    setEdges(templateEdges);
    console.log(`✅ Loaded template: ${template.name}`);
  }, [setNodes, setEdges]);
  
  // Load session from Editor on mount
  useEffect(() => {
    const session = sessionService.getSession();
    if (session) {
      console.log('📖 Loading session from Editor:', session.sessionId);
      setHasEditorSession(true);
      setTitle(session.documentTitle);
      
      // Parse Mermaid diagram to nodes/edges
      try {
        const generator = new MindmapGenerator();
        const mindmapData = generator.fromMermaid(session.diagramCode);
        
        // Convert to React Flow format
        const rfNodes: Node[] = mindmapData.nodes.map((n) => ({
          id: n.id,
          type: 'mindNode',
          position: { x: 0, y: 0 }, // Temporary position, will be layouted
          data: { label: n.text },
        }));
        
        const rfEdges: Edge[] = mindmapData.connections.map((c) => ({
          id: `e-${c.from}-${c.to}`,
          source: c.from,
          target: c.to,
          type: 'smoothstep',
        }));
        
        if (rfNodes.length > 0) {
          // Apply ELK tree layout for hierarchical presentation
          console.log('🎨 Applying hierarchical tree layout...');
          getLayoutedElements(rfNodes, rfEdges, 'tree').then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
            // Update edges to use default (bezier) type
            const bezierEdges = layoutedEdges.map(edge => ({
              ...edge,
              type: 'default', // Bezier curves
            }));
            
            setNodes(layoutedNodes);
            setEdges(bezierEdges);
            setCurrentLayout('tree');
            console.log('✅ Loaded', layoutedNodes.length, 'nodes with hierarchical tree layout + bezier edges');
          }).catch((err) => {
            console.error('Layout failed, using default positions:', err);
            setNodes(rfNodes);
            setEdges(rfEdges);
          });
        }
      } catch (error) {
        console.error('Failed to parse Mermaid from session:', error);
      }
    }
  }, []); // Run once on mount

  // Inject callbacks into ALL nodes whenever they change
  useEffect(() => {
    const nodesNeedingCallbacks = nodes.filter(n => 
      (n.type === 'milestone' && !n.data.onDelete) || 
      (n.type !== 'milestone' && !n.data.onAddChild)
    );

    // Only inject if there are nodes that need callbacks
    if (nodesNeedingCallbacks.length === 0) {
      console.log('🔶 NO CALLBACK INJECTION NEEDED');
      return;
    }

    console.log('🔶 INJECTING CALLBACKS:', {
      nodesCount: nodes.length,
      nodesNeedingCallbacks: nodesNeedingCallbacks.length,
    });
    
    setNodes((nds) =>
      nds.map((node) => {
        // Inject callbacks based on node type
        if (node.type === 'milestone') {
          // Milestone callbacks
          if (!node.data.onDelete) {
            console.log(`🔶 INJECTING MILESTONE CALLBACKS into ${node.id}`);
            return {
              ...node,
              data: {
                ...node.data,
                onUngroup: ungroupMilestone,
                onDelete: deleteMilestone,
              },
            };
          }
        } else {
          // Regular node callbacks
          if (!node.data.onAddChild || !node.data.onAIEnhance) {
            console.log(`🔶 INJECTING NODE CALLBACKS into ${node.id}`, {
              hasParent: !!(node as any).parentId,
              parentId: (node as any).parentId,
              position: node.position,
              extent: node.extent,
            });
            return {
              ...node,
              // CRITICAL: Preserve parentId and extent when injecting callbacks!
              parentId: (node as any).parentId,
              extent: node.extent,
              position: node.position, // Preserve position too!
              data: {
                ...node.data,
                onAddChild: addChildNode,
                onDelete: deleteNode,
                onAIEnhance: handleAIEnhance,
                onLabelChange: handleLabelChange,
              },
            };
          }
        }
        return node;
      })
    );
  }, [nodes.length, addChildNode, deleteNode, handleAIEnhance, handleLabelChange]); // Re-run when nodes are added/removed OR callbacks change

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back to Editor Button (only show if from Editor) */}
          {hasEditorSession && (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleBackToEditor}
                className="text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2"/>Back to Editor
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
            </>
          )}
          
          <input
            className="bg-transparent border-none outline-none text-lg font-semibold"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button size="sm" variant="outline" onClick={() => setShowTemplateModal(true)}>
            <FileText className="h-4 w-4 mr-2"/>Templates
          </Button>
          <Button size="sm" variant="outline">
            <Upload className="h-4 w-4 mr-2"/>Import
          </Button>
          <Button size="sm" className="gradient-primary text-white" onClick={addNode}>
            <Plus className="h-4 w-4 mr-2"/>New Node
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={createMilestone}
            disabled={selectedNodeIds.length < 2}
          >
            <Folder className="h-4 w-4 mr-2"/>
            Group ({selectedNodeIds.length})
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <div className="flex items-center gap-2">
            <LayoutIcon className="h-4 w-4 text-muted-foreground" />
            <Select value={currentLayout} onValueChange={setCurrentLayout}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="Layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="tree">🌳 Tree</SelectItem>
                <SelectItem value="radial">🎯 Radial</SelectItem>
                <SelectItem value="force">⚛️ Force</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Edge Type:</span>
            <Select value={edgeType} onValueChange={(v: any) => setEdgeType(v)}>
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smoothstep">Smooth Step</SelectItem>
                <SelectItem value="bezier">Bezier</SelectItem>
                <SelectItem value="straight">Straight</SelectItem>
                <SelectItem value="step">Step</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Style:</span>
            <Select value={edgeStyle} onValueChange={(v: any) => setEdgeStyle(v)}>
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowExportModal(true)}>
            📤 Export
          </Button>
          <Button 
            size="sm" 
            className="gradient-primary text-white" 
            onClick={() => setShowAIToolsModal(true)}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2"/>AI Tools
              </>
            )}
          </Button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 min-h-0" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          multiSelectionKeyCode="Shift"
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: getReactFlowEdgeType(edgeType),
            animated: false,
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
        >
          {/* Background Grid */}
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1} 
            color="hsl(var(--muted-foreground))"
            className="opacity-30"
          />

          {/* Built-in Controls */}
          <Controls 
            showZoom={true}
            showFitView={true}
            showInteractive={true}
            className="bg-card border border-border rounded-lg shadow-lg"
          />

          {/* Built-in Minimap - Positioned bottom-left to avoid AI button */}
          <MiniMap 
            position="bottom-left"
            nodeColor={(node) => {
              return '#6366f1';
            }}
            className="!bg-card border border-border rounded-lg shadow-lg"
            maskColor="rgba(0, 0, 0, 0.1)"
            style={{
              backgroundColor: 'hsl(var(--card))',
            }}
          />

          {/* Top-left Panel for Stats */}
          <Panel position="top-left" className="bg-card/95 border border-border rounded-lg px-4 py-2 shadow-lg">
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold">{nodes.length}</span> nodes · 
              <span className="font-semibold ml-1">{edges.length}</span> connections
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* PM Fields Sidebar */}
      <Studio2Sidebar
        selectedNode={sidebarNode}
        onClose={() => setSidebarNode(null)}
        onUpdate={handleSidebarUpdate}
      />

      {/* Export Modal */}
      <Studio2ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={title}
        nodes={nodes}
        edges={edges}
      />

      {/* Template Modal */}
      <Studio2TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onLoadTemplate={handleLoadTemplate}
      />

      {/* AI Tools Modal */}
      <Studio2AIToolsModal
        isOpen={showAIToolsModal}
        onClose={() => setShowAIToolsModal(false)}
        nodes={nodes}
        edges={edges}
        onApplyAI={handleAIAction}
      />

      {/* Floating AI Chat Button - Conversational Assistant */}
      <Button
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl 
                   bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-700 
                   hover:scale-110 hover:shadow-purple-500/50 transition-all duration-300 z-50"
        onClick={() => setShowChatPanel(!showChatPanel)}
        title="AI Chat Assistant - Talk to your mindmap"
      >
        <Sparkles className="h-7 w-7 text-white" />
      </Button>

      {/* Proactive AI Suggestions */}
      {activeSuggestion && (
        <ProactiveSuggestion
          suggestion={activeSuggestion}
          position={suggestionPosition}
          onDismiss={handleDismissSuggestion}
          onAccept={() => {
            console.log('✅ Suggestion accepted:', activeSuggestion.message);
            setActiveSuggestion(null);
          }}
        />
      )}

      {/* AI Chat Panel - Floating conversational interface */}
      {showChatPanel && (
        <div className="fixed bottom-28 right-6 w-96 bg-card border-2 border-purple-500 rounded-lg shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <h3 className="font-semibold">AI Chat Assistant</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Undo/Redo Buttons */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-white hover:bg-white/20 text-xs"
                  onClick={handleUndo}
                  disabled={!actionHistoryManager.canUndo()}
                  title="Undo (Ctrl+Z)"
                >
                  ↩️ Undo
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-white hover:bg-white/20 text-xs"
                  onClick={handleRedo}
                  disabled={!actionHistoryManager.canRedo()}
                  title="Redo (Ctrl+Shift+Z)"
                >
                  ↪️ Redo
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  onClick={() => setShowChatPanel(false)}
                >
                  ✕
                </Button>
              </div>
            </div>
            <p className="text-xs text-purple-100 mt-1">
              {chatMode === 'brainstorm' 
                ? '💭 Having a conversation with you - like ChatGPT' 
                : '⚡ Direct command mode - instant execution'}
            </p>
            
            {/* Mode Toggle */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setChatMode('brainstorm')}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  chatMode === 'brainstorm'
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                💬 Brainstorm
              </button>
              <button
                onClick={() => setChatMode('command')}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  chatMode === 'command'
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                ⚡ Command
              </button>
            </div>
            
            {/* Active Context Indicator */}
            {(() => {
              // Show discussion target in brainstorm mode
              if (chatMode === 'brainstorm' && discussionTargetNode) {
                return (
                  <div className="mt-2 px-2 py-1 bg-white/10 rounded text-xs flex items-center justify-between">
                    <span>🎯 Discussing: <strong>{discussionTargetNode}</strong></span>
                    <button 
                      onClick={() => setDiscussionTargetNode(null)}
                      className="text-white/60 hover:text-white ml-2"
                      title="Clear discussion target"
                    >
                      ✕
                    </button>
                  </div>
                );
              }
              
              // Show context in command mode
              if (chatMode === 'command') {
                const contextData = chatContextManager.getContext();
                const hasContext = contextData.lastAddedNodes.length > 0 || contextData.lastModifiedNodes.length > 0;
                
                if (hasContext) {
                  const contextNodes = [...contextData.lastAddedNodes, ...contextData.lastModifiedNodes]
                    .map(id => nodes.find(n => n.id === id)?.data.label)
                    .filter(Boolean)
                    .slice(0, 2);
                  
                  return (
                    <div className="mt-2 px-2 py-1 bg-white/10 rounded text-xs">
                      💡 Context: Working on {contextNodes.join(', ')}
                      {contextData.lastAddedNodes.length + contextData.lastModifiedNodes.length > 2 && ` (+${contextData.lastAddedNodes.length + contextData.lastModifiedNodes.length - 2} more)`}
                    </div>
                  );
                }
              }
              
              return null;
            })()}
          </div>

        {/* Chat Messages Area */}
        <div ref={chatMessagesRef} className="p-4 h-80 overflow-y-auto bg-muted/30">
          <div className="space-y-3">
              {/* Welcome Message */}
              {chatMessages.length === 0 && (
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm max-w-[280px]">
                    {chatMode === 'brainstorm' ? (
                      <>
                        <p className="text-sm">
                          👋 Hi! I'm your brainstorming partner, just like ChatGPT.
                        </p>
                        <p className="text-xs mt-2 text-muted-foreground">
                          Describe what you want to create, and I'll ask questions, suggest ideas, and help you refine your thoughts. 
                          When you're ready, just say <strong>"add it"</strong> and I'll create the mindmap!
                        </p>
                        <p className="text-xs mt-2 text-purple-600 font-medium">
                          💡 Try: "I want to plan a marketing campaign"
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm">
                          👋 Hi! I'm your AI assistant in Command Mode.
                        </p>
                        <ul className="text-xs mt-2 space-y-1 text-muted-foreground">
                          <li>• Add nodes ("Add 3 marketing ideas")</li>
                          <li>• Enhance nodes ("Make Marketing more creative")</li>
                          <li>• Analyze structure ("What's missing?")</li>
                          <li>• Multi-node ops ("Enhance all phase nodes")</li>
                        </ul>
                        <p className="text-xs mt-2 text-purple-600 font-medium">
                          💡 Want to brainstorm first? Switch to Brainstorm mode!
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'ai' && (
                    <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={`rounded-lg p-3 shadow-sm max-w-[280px] ${
                    msg.role === 'user' 
                      ? 'bg-indigo-500 text-white ml-auto' 
                      : 'bg-white'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">
                      {msg.role === 'ai' ? (
                        <StreamingText 
                          text={msg.content} 
                          speed={3}
                        />
                      ) : (
                        msg.content
                      )}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-xs">You</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator */}
              {chatLoading && (
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-white animate-pulse" />
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-background relative">
            {/* Node Dropdown */}
            {showNodeDropdown && filteredNodes.length > 0 && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border-2 border-purple-500 rounded-lg shadow-xl max-h-48 overflow-y-auto z-10">
                <div className="p-2">
                  <div className="text-xs font-semibold text-purple-600 mb-2 px-2">
                    📍 Select a node:
                  </div>
                  {filteredNodes.map((node, idx) => (
                    <div
                      key={node.id}
                      className={`px-3 py-2 text-sm rounded cursor-pointer transition-colors ${
                        idx === selectedNodeIndex
                          ? 'bg-purple-100 text-purple-900 font-medium'
                          : 'hover:bg-purple-50'
                      }`}
                      onClick={() => handleNodeSelect(node.data.label)}
                    >
                      {node.data.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={chatInputRef}
                type="text"
                placeholder={chatMode === 'brainstorm' 
                  ? 'Tell me what you want to create...' 
                  : 'Type your command (use / to select nodes)...'}
                value={chatInput}
                onChange={(e) => handleChatInputChange(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyDown={async (e) => {
                  if (e.key === 'ArrowDown' && showNodeDropdown) {
                    e.preventDefault();
                    setSelectedNodeIndex(prev => Math.min(prev + 1, filteredNodes.length - 1));
                  } else if (e.key === 'ArrowUp' && showNodeDropdown) {
                    e.preventDefault();
                    setSelectedNodeIndex(prev => Math.max(prev - 1, 0));
                  } else if (e.key === 'Enter' && showNodeDropdown) {
                    e.preventDefault();
                    handleNodeSelect(filteredNodes[selectedNodeIndex]?.data.label);
                  } else if (e.key === 'Enter' && chatInput.trim()) {
                    const command = chatInput;
                    setChatInput('');
                    setShowNodeDropdown(false);
                    
                    // Keep input enabled, just execute command
                    await handleChatCommand(command);
                    
                    // Re-focus after command completes
                    setTimeout(() => chatInputRef.current?.focus(), 100);
                  } else if (e.key === 'Escape') {
                    setShowNodeDropdown(false);
                  }
                }}
              />
              <Button
                size="sm"
                className="bg-purple-500 hover:bg-purple-600"
                onClick={async () => {
                  if (chatInput.trim()) {
                    const command = chatInput;
                    setChatInput('');
                    setShowNodeDropdown(false);
                    
                    await handleChatCommand(command);
                    
                    // Re-focus input after command
                    setTimeout(() => chatInputRef.current?.focus(), 100);
                  }
                }}
              >
                Send
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Type <span className="font-mono bg-muted px-1 rounded">/</span> to select a node precisely • Press Enter to send
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
