import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Download, Move, Square, Circle, Diamond, Hexagon, Info, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MindmapNode {
  id: string;
  x: number;
  y: number;
  name: string;
  description: string;
  type: 'root' | 'heading' | 'concept' | 'note' | 'task';
  color: string;
  shape: 'circle' | 'square' | 'diamond' | 'hexagon';
  status: 'planned' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  children: string[];
  parent?: string;
}

interface Connection {
  id: string;
  from: string;
  to: string;
}

type Layout = 'radial' | 'tree' | 'concentric' | 'force';
type Shape = 'circle' | 'square' | 'diamond' | 'hexagon';

const nodeColors = {
  root: '#667eea',
  heading: '#4CAF50',
  concept: '#FF9800',
  note: '#9C27B0',
  task: '#E91E63'
};

export function MindmapEditor() {
  const [nodes, setNodes] = useState<MindmapNode[]>([
    {
      id: 'root',
      x: 400,
      y: 300,
      name: 'Main Idea',
      description: 'Central concept of the mindmap',
      type: 'root',
      color: '#667eea',
      shape: 'circle',
      status: 'planned',
      priority: 'high',
      children: [],
    }
  ]);
  
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [currentLayout, setCurrentLayout] = useState<Layout>('radial');
  const [currentShape, setCurrentShape] = useState<Shape>('circle');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Apply layout algorithms
  const applyLayout = useCallback(() => {
    if (nodes.length === 0) return;

    const updatedNodes = [...nodes];
    const containerWidth = 800;
    const containerHeight = 600;

    switch (currentLayout) {
      case 'radial':
        applyRadialLayout(updatedNodes, containerWidth, containerHeight);
        break;
      case 'tree':
        applyTreeLayout(updatedNodes, containerWidth, containerHeight);
        break;
      case 'concentric':
        applyConcentricLayout(updatedNodes, containerWidth, containerHeight);
        break;
      case 'force':
        applyForceLayout(updatedNodes, containerWidth, containerHeight);
        break;
    }

    setNodes(updatedNodes);
  }, [nodes, currentLayout]);

  const applyRadialLayout = (nodeList: MindmapNode[], width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    const rootNode = nodeList.find(n => n.type === 'root') || nodeList[0];
    if (rootNode) {
      rootNode.x = centerX;
      rootNode.y = centerY;
    }

    const otherNodes = nodeList.filter(n => n !== rootNode);
    const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);
    const radius = Math.min(width, height) * 0.3;

    otherNodes.forEach((node, index) => {
      const angle = index * angleStep;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
    });
  };

  const applyTreeLayout = (nodeList: MindmapNode[], width: number, height: number) => {
    const levels: { [key: number]: MindmapNode[] } = {};
    
    nodeList.forEach((node, index) => {
      const level = node.type === 'root' ? 0 : Math.floor(index / 3) + 1;
      if (!levels[level]) levels[level] = [];
      levels[level].push(node);
    });

    Object.keys(levels).forEach((levelStr, levelIndex) => {
      const level = parseInt(levelStr);
      const levelNodes = levels[level];
      const y = 50 + levelIndex * 120;
      const spacing = width / (levelNodes.length + 1);

      levelNodes.forEach((node, index) => {
        node.x = spacing * (index + 1);
        node.y = y;
      });
    });
  };

  const applyConcentricLayout = (nodeList: MindmapNode[], width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    const rootNode = nodeList.find(n => n.type === 'root') || nodeList[0];
    if (rootNode) {
      rootNode.x = centerX;
      rootNode.y = centerY;
    }

    const otherNodes = nodeList.filter(n => n !== rootNode);
    const circles = Math.ceil(Math.sqrt(otherNodes.length));
    let nodeIndex = 0;

    for (let circle = 1; circle <= circles; circle++) {
      const radius = circle * 80;
      const nodesInCircle = Math.ceil(otherNodes.length / circles);
      const angleStep = (2 * Math.PI) / nodesInCircle;

      for (let i = 0; i < nodesInCircle && nodeIndex < otherNodes.length; i++) {
        const angle = i * angleStep;
        otherNodes[nodeIndex].x = centerX + Math.cos(angle) * radius;
        otherNodes[nodeIndex].y = centerY + Math.sin(angle) * radius;
        nodeIndex++;
      }
    }
  };

  const applyForceLayout = (nodeList: MindmapNode[], width: number, height: number) => {
    const cols = Math.ceil(Math.sqrt(nodeList.length));
    const spacing = Math.min(width, height) / 4;

    nodeList.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const offsetX = (width - (cols - 1) * spacing) / 2;
      const offsetY = height * 0.2;
      
      node.x = offsetX + col * spacing + (Math.random() - 0.5) * 50;
      node.y = offsetY + row * spacing + (Math.random() - 0.5) * 50;
    });
  };

  // Node creation
  const addNode = () => {
    const newNode: MindmapNode = {
      id: `node_${Date.now()}`,
      x: 200 + Math.random() * 400,
      y: 150 + Math.random() * 300,
      name: 'New Node',
      description: '',
      type: 'concept',
      color: nodeColors.concept,
      shape: currentShape,
      status: 'planned',
      priority: 'medium',
      children: [],
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode.id);
  };

  const addChildNode = () => {
    if (!selectedNode) return;

    const parentNode = nodes.find(n => n.id === selectedNode);
    if (!parentNode) return;

    const newNode: MindmapNode = {
      id: `node_${Date.now()}`,
      x: parentNode.x + 100,
      y: parentNode.y + 50,
      name: 'Child Node',
      description: '',
      type: 'concept',
      color: nodeColors.concept,
      shape: currentShape,
      status: 'planned',
      priority: 'medium',
      children: [],
      parent: selectedNode,
    };

    const newConnection: Connection = {
      id: `conn_${Date.now()}`,
      from: selectedNode,
      to: newNode.id,
    };

    setNodes(prev => [...prev, newNode]);
    setConnections(prev => [...prev, newConnection]);
    
    // Update parent's children
    setNodes(prev => prev.map(node => 
      node.id === selectedNode 
        ? { ...node, children: [...node.children, newNode.id] }
        : node
    ));
  };

  const deleteNode = () => {
    if (!selectedNode || selectedNode === 'root') return;

    setNodes(prev => prev.filter(n => n.id !== selectedNode));
    setConnections(prev => prev.filter(c => c.from !== selectedNode && c.to !== selectedNode));
    setSelectedNode(null);
  };

  const updateNode = (id: string, updates: Partial<MindmapNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === id ? { ...node, ...updates } : node
    ));
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setSelectedNode(nodeId);
    setIsDragging(true);
    
    const node = nodes.find(n => n.id === nodeId);
    if (node && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - node.x,
        y: e.clientY - rect.top - node.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedNode || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    updateNode(selectedNode, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Render node shapes
  const renderNodeShape = (node: MindmapNode) => {
    const commonProps = {
      fill: node.color,
      stroke: selectedNode === node.id ? '#fff' : 'rgba(255,255,255,0.5)',
      strokeWidth: selectedNode === node.id ? 4 : 2,
      filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.2))',
      style: { cursor: 'pointer' }
    };

    switch (node.shape) {
      case 'circle':
        return <circle cx={0} cy={0} r={30} {...commonProps} />;
      case 'square':
        return <rect x={-25} y={-25} width={50} height={50} rx={8} {...commonProps} />;
      case 'diamond':
        return <polygon points="0,-30 30,0 0,30 -30,0" {...commonProps} />;
      case 'hexagon':
        return <polygon points="26,0 13,22 -13,22 -26,0 -13,-22 13,-22" {...commonProps} />;
      default:
        return <circle cx={0} cy={0} r={30} {...commonProps} />;
    }
  };

  const renderConnection = (conn: Connection) => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    
    if (!fromNode || !toNode) return null;

    return (
      <line
        key={conn.id}
        x1={fromNode.x}
        y1={fromNode.y}
        x2={toNode.x}
        y2={toNode.y}
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }}
      />
    );
  };

  const exportMindmap = () => {
    const data = {
      nodes,
      connections,
      layout: currentLayout,
      shape: currentShape,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null;

  return (
    <div className="mindmap-editor h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="mindmap-header bg-gradient-to-r from-purple-600 to-purple-700 text-white p-5 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">🧠 Mindmap Creator</h1>
            <p className="text-purple-200 text-sm">Interactive visual mindmap editor</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={addNode}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
            >
              <Plus size={16} />
              Add Node
            </Button>
            
            <Button
              onClick={addChildNode}
              disabled={!selectedNode}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 disabled:opacity-50"
            >
              <Move size={16} />
              Add Child
            </Button>
            
            <select
              value={currentLayout}
              onChange={(e) => setCurrentLayout(e.target.value as Layout)}
              className="px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 backdrop-blur-sm"
            >
              <option value="radial">Radial Layout</option>
              <option value="tree">Tree Layout</option>
              <option value="concentric">Concentric Layout</option>
              <option value="force">Force Layout</option>
            </select>
            
            <select
              value={currentShape}
              onChange={(e) => setCurrentShape(e.target.value as Shape)}
              className="px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 backdrop-blur-sm"
            >
              <option value="circle">Circle Nodes</option>
              <option value="square">Square Nodes</option>
              <option value="diamond">Diamond Nodes</option>
              <option value="hexagon">Hexagon Nodes</option>
            </select>
            
            <Button onClick={applyLayout} className="bg-white/20 hover:bg-white/30 text-white border border-white/30">
              Apply Layout
            </Button>
            
            <Button
              onClick={exportMindmap}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
            >
              <Download size={16} />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid Background */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Connections */}
          {connections.map(renderConnection)}
          
          {/* Nodes */}
          {nodes.map((node) => (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              className="mindmap-node"
            >
              {renderNodeShape(node)}
              <text
                textAnchor="middle"
                dy="6"
                fontSize="12"
                fontWeight="600"
                fill="white"
                pointerEvents="none"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {node.name.length > 10 ? node.name.substring(0, 10) + '...' : node.name}
              </text>
            </g>
          ))}
        </svg>

        {/* Node Inspector */}
        {selectedNodeData && (
          <div className="absolute top-5 right-5 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-10">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Info size={18} />
                  <h3 className="font-semibold">Node Properties</h3>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={selectedNodeData.name}
                  onChange={(e) => updateNode(selectedNodeData.id, { name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Description
                </label>
                <textarea
                  value={selectedNodeData.description}
                  onChange={(e) => updateNode(selectedNodeData.id, { description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Type
                </label>
                <select
                  value={selectedNodeData.type}
                  onChange={(e) => updateNode(selectedNodeData.id, { 
                    type: e.target.value as MindmapNode['type'],
                    color: nodeColors[e.target.value as keyof typeof nodeColors]
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="concept">Concept</option>
                  <option value="heading">Heading</option>
                  <option value="note">Note</option>
                  <option value="task">Task</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Status
                </label>
                <select
                  value={selectedNodeData.status}
                  onChange={(e) => updateNode(selectedNodeData.id, { status: e.target.value as MindmapNode['status'] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="planned">Planned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Priority
                </label>
                <select
                  value={selectedNodeData.priority}
                  onChange={(e) => updateNode(selectedNodeData.id, { priority: e.target.value as MindmapNode['priority'] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={addChildNode}
                  className="flex-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
                >
                  <Plus size={14} />
                  Add Child
                </Button>
                <Button
                  onClick={deleteNode}
                  disabled={selectedNodeData.id === 'root'}
                  className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}