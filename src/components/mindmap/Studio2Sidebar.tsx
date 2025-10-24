/**
 * Studio2Sidebar - Project Management Fields Panel
 * Displays and edits detailed PM data for selected nodes/milestones
 */

import { useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { X, Calendar, User, Flag, Clock, TrendingUp, Tag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@iconify/react';

interface Studio2SidebarProps {
  selectedNode: Node | null;
  selectedEdge?: Edge | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: Partial<any>) => void;
  onUpdateEdge?: (edgeId: string, data: Partial<Edge>) => void;
  onAddIconNode?: (title: string, icon: string, color?: string) => void;
}

export default function Studio2Sidebar({ selectedNode, selectedEdge, onClose, onUpdate, onUpdateEdge, onAddIconNode }: Studio2SidebarProps) {
  // ⚠️ CRITICAL: ALL HOOKS MUST BE AT THE TOP, BEFORE ANY CONDITIONAL RETURNS!
  // React requires hooks to be called in the same order on every render.
  
  // Local state for edge label to avoid stale prop issues
  const [edgeLabelInput, setEdgeLabelInput] = useState('');
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    icons: false,
    conditional: false,
    relationships: false,
    timeCost: false,
  });
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Form data for node editor (must be declared even if not used for edges)
  const [formData, setFormData] = useState({
    label: selectedNode?.data.label || '',
    title: selectedNode?.data.title || '', // For icon/aws nodes
    description: selectedNode?.data.description || '',
    status: selectedNode?.data.status || 'todo',
    priority: selectedNode?.data.priority || 'medium',
    owner: selectedNode?.data.owner || '',
    startDate: selectedNode?.data.startDate || '',
    endDate: selectedNode?.data.endDate || '',
    estimate: selectedNode?.data.estimate || '',
    progress: selectedNode?.data.progress || 0,
    tags: selectedNode?.data.tags || '',
    color: selectedNode?.data.color || 'indigo', // Node color
    shape: selectedNode?.data.shape || 'rounded-full', // Node shape
  });
  
  // Sync edge label when selectedEdge changes
  useEffect(() => {
    if (selectedEdge) {
      setEdgeLabelInput(selectedEdge.label || '');
    }
  }, [selectedEdge?.id, selectedEdge?.label]);
  
  // Sync form data when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      setFormData({
        label: selectedNode.data.label || '',
        title: selectedNode.data.title || '',
        description: selectedNode.data.description || '',
        status: selectedNode.data.status || 'todo',
        priority: selectedNode.data.priority || 'medium',
        owner: selectedNode.data.owner || '',
        startDate: selectedNode.data.startDate || '',
        endDate: selectedNode.data.endDate || '',
        estimate: selectedNode.data.estimate || '',
        progress: selectedNode.data.progress || 0,
        tags: selectedNode.data.tags || '',
        color: selectedNode.data.color || 'indigo',
        shape: selectedNode.data.shape || 'rounded-full',
      });
    }
  }, [selectedNode?.id]);
  
  // If edge is selected, show edge editor
  if (selectedEdge && onUpdateEdge) {
    const handleEdgeLabelChange = (newLabel: string) => {
      setEdgeLabelInput(newLabel);
      onUpdateEdge(selectedEdge.id, { label: newLabel });
    };
    
    return (
      <div className="fixed right-0 top-0 h-screen w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col">
        <div className="p-4 border-b border-border bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">🔗 Connection Details</h2>
              <p className="text-xs text-blue-100 mt-1">ID: {selectedEdge.id}</p>
            </div>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Tag className="h-3 w-3" />
              Connection Label
            </Label>
            <Input
              value={edgeLabelInput}
              onChange={(e) => handleEdgeLabelChange(e.target.value)}
              placeholder="e.g., YES, depends on, 2 weeks"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Add a label to describe this connection
            </p>
          </div>
          
          <Separator />
          
          {/* Connection Icons - Collapsible */}
          <div>
            <button
              onClick={() => toggleSection('icons')}
              className="w-full flex items-center justify-between mb-2 hover:bg-muted p-2 rounded transition-colors"
            >
              <Label className="cursor-pointer">Connection Icons</Label>
              <span className="text-sm text-muted-foreground">
                {expandedSections.icons ? '▼' : '▶'}
              </span>
            </button>
            {expandedSections.icons && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[
                  { icon: 'tabler:arrow-right', label: '→' },
                  { icon: 'tabler:arrows-right-left', label: '⇄' },
                  { icon: 'tabler:arrow-big-right', label: '⇒' },
                  { icon: 'tabler:corner-down-right', label: '↳' },
                  { icon: 'tabler:arrow-fork', label: '⑂' },
                  { icon: 'tabler:arrow-merge', label: '⑃' },
                  { icon: 'tabler:refresh', label: '🔄' },
                  { icon: 'tabler:repeat', label: '🔁' },
                  { icon: 'tabler:plus', label: '+' },
                  { icon: 'tabler:minus', label: '−' },
                  { icon: 'tabler:x', label: '✕' },
                  { icon: 'tabler:check', label: '✓' },
                  { icon: 'tabler:bolt', label: '⚡' },
                  { icon: 'tabler:link', label: '🔗' },
                  { icon: 'tabler:unlink', label: '⛓️‍💥' },
                  { icon: 'tabler:question-mark', label: '?' },
                  { icon: 'tabler:alert-circle', label: '!' },
                  { icon: 'tabler:clock', label: '⏱️' },
                  { icon: 'tabler:calendar', label: '📅' },
                  { icon: 'tabler:currency-dollar', label: '💰' },
                ].map((item) => (
                  <button
                    key={item.icon}
                    className="flex flex-col items-center gap-1 p-2 rounded hover:bg-muted cursor-pointer border border-border"
                    onClick={() => handleEdgeLabelChange(item.label)}
                    title={item.label}
                  >
                    <Icon icon={item.icon} width={18} height={18} />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Conditional/Decision Labels - Collapsible */}
          <div>
            <button
              onClick={() => toggleSection('conditional')}
              className="w-full flex items-center justify-between mb-2 hover:bg-muted p-2 rounded transition-colors"
            >
              <Label className="cursor-pointer">Conditional / Decision</Label>
              <span className="text-sm text-muted-foreground">
                {expandedSections.conditional ? '▼' : '▶'}
              </span>
            </button>
            {expandedSections.conditional && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[
                  '✅ YES',
                  '❌ NO',
                  '✓ TRUE',
                  '✗ FALSE',
                  '↗️ IF',
                  '↘️ ELSE',
                  '1️⃣ Option 1',
                  '2️⃣ Option 2',
                ].map((label) => (
                  <Button
                    key={label}
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdgeLabelChange(label)}
                    className="text-xs"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Relationship Labels - Collapsible */}
          <div>
            <button
              onClick={() => toggleSection('relationships')}
              className="w-full flex items-center justify-between mb-2 hover:bg-muted p-2 rounded transition-colors"
            >
              <Label className="cursor-pointer">Relationships</Label>
              <span className="text-sm text-muted-foreground">
                {expandedSections.relationships ? '▼' : '▶'}
              </span>
            </button>
            {expandedSections.relationships && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[
                  '➡️ Leads to',
                  '🔄 Depends on',
                  '⚡ Triggers',
                  '🎯 Influences',
                  '📤 Sends to',
                  '📥 Receives from',
                  '🔗 Related to',
                  '✨ Requires',
                  '🚀 Results in',
                  '🤝 Supports',
                  '⚔️ Conflicts with',
                  '🔀 Branches to',
                ].map((label) => (
                  <Button
                    key={label}
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdgeLabelChange(label)}
                    className="text-xs"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Time/Cost/Priority Labels - Collapsible */}
          <div>
            <button
              onClick={() => toggleSection('timeCost')}
              className="w-full flex items-center justify-between mb-2 hover:bg-muted p-2 rounded transition-colors"
            >
              <Label className="cursor-pointer">Time / Cost / Priority</Label>
              <span className="text-sm text-muted-foreground">
                {expandedSections.timeCost ? '▼' : '▶'}
              </span>
            </button>
            {expandedSections.timeCost && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[
                  '📅 2 weeks',
                  '⏱️ 3 days',
                  '⏰ 1 hour',
                  '💰 $5,000',
                  '💵 $500',
                  '📊 High',
                  '📈 Medium',
                  '📉 Low',
                  '🔥 Urgent',
                  '❄️ Low Priority',
                  '👤 John',
                  '👥 Team A',
                ].map((label) => (
                  <Button
                    key={label}
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdgeLabelChange(label)}
                    className="text-xs"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Edge Styling Controls */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <Label className="mb-3 block font-bold text-base flex items-center gap-2">
              🎨 Edge Styling
            </Label>
            
            {/* Color Picker */}
            <div className="mb-4">
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Color</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { color: '#64748b', name: 'Gray', desc: 'Default' },
                  { color: '#3b82f6', name: 'Blue', desc: 'AI' },
                  { color: '#ef4444', name: 'Red', desc: 'Critical' },
                  { color: '#10b981', name: 'Green', desc: 'Success' },
                  { color: '#f59e0b', name: 'Orange', desc: 'Warning' },
                  { color: '#8b5cf6', name: 'Purple', desc: 'Info' },
                ].map((item) => (
                  <button
                    key={item.color}
                    className={`p-2 rounded-lg border-2 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md ${
                      selectedEdge.style?.stroke === item.color 
                        ? 'border-primary ring-2 ring-primary/30 scale-105' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      onUpdateEdge(selectedEdge.id, {
                        style: { ...selectedEdge.style, stroke: item.color },
                        markerEnd: { ...selectedEdge.markerEnd, color: item.color },
                      });
                    }}
                    title={`${item.name} (${item.desc})`}
                  >
                    <div 
                      className="h-7 rounded-md shadow-inner" 
                      style={{ backgroundColor: item.color }}
                    />
                    <p className="text-[10px] text-center mt-1.5 font-medium text-muted-foreground">{item.name}</p>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Line Style */}
            <div className="mb-4">
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Line Style</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: undefined, label: 'Solid', pattern: '────' },
                  { value: '5,5', label: 'Dashed', pattern: '- - -' },
                  { value: '2,2', label: 'Dotted', pattern: '· · ·' },
                  { value: '10,5', label: 'Long Dash', pattern: '─ ─' },
                ].map((item) => (
                  <Button
                    key={item.label}
                    size="sm"
                    variant={selectedEdge.style?.strokeDasharray === item.value ? 'default' : 'outline'}
                    onClick={() => {
                      onUpdateEdge(selectedEdge.id, {
                        style: { ...selectedEdge.style, strokeDasharray: item.value },
                      });
                    }}
                    className="text-xs font-mono font-bold hover:scale-105 transition-transform"
                  >
                    {item.pattern}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Thickness */}
            <div className="mb-4">
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                Thickness: <span className="text-primary font-bold">{selectedEdge.style?.strokeWidth || 2}px</span>
              </Label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={Number(selectedEdge.style?.strokeWidth) || 2}
                onChange={(e) => {
                  const newWidth = Number(e.target.value);
                  onUpdateEdge(selectedEdge.id, {
                    style: { ...selectedEdge.style, strokeWidth: newWidth },
                  });
                }}
                className="w-full cursor-pointer accent-primary h-2 rounded-lg"
              />
              <div className="flex justify-between text-xs font-medium text-muted-foreground mt-2">
                <span>Thin</span>
                <span>Thick</span>
              </div>
            </div>
            
            {/* Animation */}
            <div className="mb-4 bg-white/50 dark:bg-black/20 rounded-lg p-3 border border-border">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedEdge.animated || false}
                  onChange={(e) => {
                    onUpdateEdge(selectedEdge.id, {
                      animated: e.target.checked,
                    });
                  }}
                  className="w-5 h-5 cursor-pointer accent-primary"
                />
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  ⚡ Animated (flowing dots)
                </span>
              </label>
            </div>
            
            {/* Quick Presets */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onUpdateEdge(selectedEdge.id, {
                      style: { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5,5' },
                      markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
                      animated: true,
                    });
                  }}
                  className="text-xs font-semibold hover:scale-105 transition-transform hover:shadow-md"
                >
                  🤖 AI
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onUpdateEdge(selectedEdge.id, {
                      style: { stroke: '#ef4444', strokeWidth: 3, strokeDasharray: undefined },
                      markerEnd: { type: 'arrowclosed', color: '#ef4444' },
                      animated: true,
                    });
                  }}
                  className="text-xs font-semibold hover:scale-105 transition-transform hover:shadow-md"
                >
                  🔥 Critical
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onUpdateEdge(selectedEdge.id, {
                      style: { stroke: '#10b981', strokeWidth: 2, strokeDasharray: undefined },
                      markerEnd: { type: 'arrowclosed', color: '#10b981' },
                      animated: false,
                    });
                  }}
                  className="text-xs font-semibold hover:scale-105 transition-transform hover:shadow-md"
                >
                  ✅ Success
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onUpdateEdge(selectedEdge.id, {
                      style: { stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '2,2' },
                      markerEnd: { type: 'arrow', color: '#9ca3af' },
                      animated: false,
                    });
                  }}
                  className="text-xs font-semibold hover:scale-105 transition-transform hover:shadow-md"
                >
                  ⚪ Optional
                </Button>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label className="mb-2 block">Clear Label</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdgeLabelChange('')}
              className="w-full"
            >
              Remove Label
            </Button>
          </div>
        </div>
        
        <div className="p-4 border-t border-border bg-muted/30">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    );
  }
  
  // Early return if no node selected (hooks already called above)
  if (!selectedNode) return null;

  // Handler for form changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate(selectedNode.id, formData);
    onClose();
  };

  const isMilestone = selectedNode.type === 'milestone';
  const isIconNode = selectedNode.type === 'icon' || selectedNode.type === 'aws';

  // Quick icon insert palette
  const quickIcons = [
    { title: 'Docker', icon: 'simple-icons:docker', color: '#2496ed' },
    { title: 'Kubernetes', icon: 'simple-icons:kubernetes', color: '#326ce5' },
    { title: 'GitHub', icon: 'simple-icons:github' },
    { title: 'GitLab', icon: 'simple-icons:gitlab', color: '#fc6d26' },
    { title: 'Nginx', icon: 'simple-icons:nginx', color: '#009639' },
    { title: 'Redis', icon: 'simple-icons:redis', color: '#D82C20' },
    { title: 'Postgres', icon: 'simple-icons:postgresql', color: '#4169e1' },
    { title: 'Server', icon: 'tabler:server' },
    { title: 'Database', icon: 'tabler:database' },
    { title: 'Shield', icon: 'tabler:shield' },
    { title: 'Globe', icon: 'tabler:world' },
    { title: 'Queue', icon: 'tabler:arrows-shuffle' },
  ];

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {isMilestone ? '📁 Milestone Details' : isIconNode ? '🎨 Icon Node Details' : '💡 Node Details'}
            </h2>
            <p className="text-xs text-indigo-100 mt-1">ID: {selectedNode.id}</p>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick: Add Icon Nodes */}
        {onAddIconNode && !isIconNode && (
          <div className="rounded-lg border border-border p-3">
            <div className="text-xs font-semibold mb-2">Quick Add Icons</div>
            <div className="grid grid-cols-4 gap-2">
              {quickIcons.map((item) => (
                <button
                  key={item.icon}
                  className="flex flex-col items-center gap-1 p-2 rounded hover:bg-muted cursor-pointer"
                  onClick={() => onAddIconNode(item.title, item.icon, item.color)}
                  title={item.title}
                >
                  <Icon icon={item.icon} width={20} height={20} color={item.color || 'currentColor'} />
                  <span className="text-[9px] text-center leading-tight line-clamp-1">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Label / Title */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Tag className="h-3 w-3" />
            {isMilestone ? 'Milestone Name' : isIconNode ? 'Icon Title' : 'Node Label'}
          </Label>
          <Input
            value={isIconNode ? formData.title : formData.label}
            onChange={(e) => handleChange(isIconNode ? 'title' : 'label', e.target.value)}
            placeholder={isMilestone ? 'Enter milestone name' : isIconNode ? 'Enter icon title' : 'Enter node label'}
          />
        </div>

        {/* Description */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3 w-3" />
            Description
          </Label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Add detailed description..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Node Styling (only for mindNode type) */}
        {!isMilestone && !isIconNode && (
          <>
            <Separator />
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <Label className="mb-3 block font-bold text-base flex items-center gap-2">
                🎨 Node Styling
              </Label>
              
              {/* Node Color */}
              <div className="mb-4">
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Node Color</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { color: 'from-indigo-500 to-indigo-600', name: 'Indigo', value: 'indigo' },
                    { color: 'from-blue-500 to-blue-600', name: 'Blue', value: 'blue' },
                    { color: 'from-purple-500 to-purple-600', name: 'Purple', value: 'purple' },
                    { color: 'from-pink-500 to-pink-600', name: 'Pink', value: 'pink' },
                    { color: 'from-red-500 to-red-600', name: 'Red', value: 'red' },
                    { color: 'from-orange-500 to-orange-600', name: 'Orange', value: 'orange' },
                    { color: 'from-yellow-500 to-yellow-600', name: 'Yellow', value: 'yellow' },
                    { color: 'from-green-500 to-green-600', name: 'Green', value: 'green' },
                    { color: 'from-teal-500 to-teal-600', name: 'Teal', value: 'teal' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      className={`p-2 rounded-lg border-2 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md ${
                        formData.color === item.value 
                          ? 'border-primary ring-2 ring-primary/30 scale-105' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        handleChange('color', item.value);
                        onUpdate(selectedNode.id, { ...formData, color: item.value });
                      }}
                      title={item.name}
                    >
                      <div 
                        className={`h-7 rounded-md bg-gradient-to-br ${item.color} shadow-inner`}
                      />
                      <p className="text-[10px] text-center mt-1.5 font-medium text-muted-foreground">{item.name}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Node Shape */}
              <div className="mb-3">
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Node Shape</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { shape: 'rounded-full', name: 'Circle', icon: '●', desc: 'Round' },
                    { shape: 'rounded-2xl', name: 'Rounded', icon: '▢', desc: 'Soft corners' },
                    { shape: 'rounded', name: 'Square', icon: '■', desc: 'Small corners' },
                    { shape: 'rounded-none', name: 'Sharp', icon: '▭', desc: 'No corners' },
                    { shape: 'diamond', name: 'Diamond', icon: '◆', desc: 'Decision node' },
                    { shape: 'hexagon', name: 'Hexagon', icon: '⬡', desc: 'Process node' },
                  ].map((item) => (
                    <Button
                      key={item.shape}
                      size="sm"
                      variant={formData.shape === item.shape ? 'default' : 'outline'}
                      onClick={() => {
                        handleChange('shape', item.shape);
                        onUpdate(selectedNode.id, { ...formData, shape: item.shape });
                      }}
                      className="text-xs font-semibold hover:scale-105 transition-transform hover:shadow-md"
                      title={item.desc}
                    >
                      <span className="mr-1 text-base">{item.icon}</span>
                      {item.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        <Separator />

        {/* Status */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Flag className="h-3 w-3" />
            Status
          </Label>
          <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">📋 To Do</SelectItem>
              <SelectItem value="in-progress">🔄 In Progress</SelectItem>
              <SelectItem value="review">👀 Review</SelectItem>
              <SelectItem value="done">✅ Done</SelectItem>
              <SelectItem value="blocked">🚫 Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Flag className="h-3 w-3" />
            Priority
          </Label>
          <Select value={formData.priority} onValueChange={(v) => handleChange('priority', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">🟢 Low</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="high">🟠 High</SelectItem>
              <SelectItem value="critical">🔴 Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Owner */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <User className="h-3 w-3" />
            Owner / Assignee
          </Label>
          <Input
            value={formData.owner}
            onChange={(e) => handleChange('owner', e.target.value)}
            placeholder="Enter owner name"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Calendar className="h-3 w-3" />
              Start Date
            </Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Calendar className="h-3 w-3" />
              End Date
            </Label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />
          </div>
        </div>

        {/* Estimate */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Clock className="h-3 w-3" />
            Estimate (hours)
          </Label>
          <Input
            type="number"
            value={formData.estimate}
            onChange={(e) => handleChange('estimate', e.target.value)}
            placeholder="0"
          />
        </div>

        {/* Progress */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3 w-3" />
            Progress: {formData.progress}%
          </Label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={formData.progress}
            onChange={(e) => handleChange('progress', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Tag className="h-3 w-3" />
            Tags (comma-separated)
          </Label>
          <Input
            value={formData.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            placeholder="feature, backend, urgent"
          />
        </div>

        {/* Milestone-specific: Grouped Nodes */}
        {isMilestone && selectedNode.data.groupedNodeIds && (
          <>
            <Separator />
            <div>
              <Label className="mb-2 block">📦 Grouped Nodes ({selectedNode.data.groupedNodeIds.length})</Label>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                {selectedNode.data.groupedNodeIds.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No nodes in this milestone</p>
                ) : (
                  selectedNode.data.groupedNodeIds.map((nodeId: string) => (
                    <div key={nodeId} className="text-xs bg-background px-2 py-1 rounded flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="font-mono">{nodeId}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30 flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1 gradient-primary text-white">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
