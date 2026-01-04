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
import IconPickerModal from '@/components/mindmap/IconPickerModal';

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
    nodeStyling: true, // Default expanded
    status: true, // Default expanded
    priority: false,
    pmFields: false, // Owner, dates, etc.
    textFormatting: false,
    shapeProperties: false,
    advancedStyling: false,
    layoutOptions: false,
  });
  
  // Icon picker modal state
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Form data for node editor (must be declared even if not used for edges)
  const [formData, setFormData] = useState({
    label: selectedNode?.data?.label || '',
    title: selectedNode?.data?.title || '', // For icon/aws nodes
    description: selectedNode?.data?.description || '',
    status: selectedNode?.data?.status || 'todo',
    priority: selectedNode?.data?.priority || 'medium',
    owner: selectedNode?.data?.owner || '',
    startDate: selectedNode?.data?.startDate || '',
    endDate: selectedNode?.data?.endDate || '',
    estimate: selectedNode?.data?.estimate || '',
    progress: selectedNode?.data?.progress || 0,
    tags: selectedNode?.data?.tags || '',
    color: selectedNode?.data?.color || 'indigo', // Node color
    shape: selectedNode?.data?.shape || 'rounded-full', // Node shape
    statusIcon: selectedNode?.data?.statusIcon || '', // Status icon (Iconify ID)
    showStatusIcon: selectedNode?.data?.showStatusIcon !== false, // Show status icon (default true)
    icon: (selectedNode?.data as any)?.icon || '', // Milestone icon (Iconify ID)
    // Advanced formatting fields
    fontSize: selectedNode?.data?.fontSize || 14,
    fontWeight: selectedNode?.data?.fontWeight || 'normal',
    textColor: selectedNode?.data?.textColor || '#000000',
    textAlign: selectedNode?.data?.textAlign || 'center',
    width: selectedNode?.data?.width || 140,
    height: selectedNode?.data?.height || 48,
    rotation: selectedNode?.data?.rotation || 0,
    opacity: selectedNode?.data?.opacity || 100,
    shadow: selectedNode?.data?.shadow || 'none',
    borderStyle: selectedNode?.data?.borderStyle || 'solid',
    borderWidth: selectedNode?.data?.borderWidth || 1,
    glassmorphism: selectedNode?.data?.glassmorphism || false,
    gradient: selectedNode?.data?.gradient || false,
  });
  
  // Sync edge label when selectedEdge changes
  useEffect(() => {
    if (selectedEdge) {
      setEdgeLabelInput(selectedEdge.label || '');
    }
  }, [selectedEdge?.id, selectedEdge?.label]);
  
  // Sync form data when selectedNode changes
  useEffect(() => {
    if (selectedNode && selectedNode.data) {
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
        statusIcon: selectedNode.data.statusIcon || '',
        showStatusIcon: selectedNode.data.showStatusIcon !== false,
        icon: (selectedNode.data as any)?.icon || '', // Milestone icon
        // Advanced formatting fields
        fontSize: selectedNode.data.fontSize || 14,
        fontWeight: selectedNode.data.fontWeight || 'normal',
        textColor: selectedNode.data.textColor || '#000000',
        textAlign: selectedNode.data.textAlign || 'center',
        width: selectedNode.data.width || 140,
        height: selectedNode.data.height || 48,
        rotation: selectedNode.data.rotation || 0,
        opacity: selectedNode.data.opacity || 100,
        shadow: selectedNode.data.shadow || 'none',
        borderStyle: selectedNode.data.borderStyle || 'solid',
        borderWidth: selectedNode.data.borderWidth || 1,
        glassmorphism: selectedNode.data.glassmorphism || false,
        gradient: selectedNode.data.gradient || false,
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

  return (
    <>
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
        {/* Label / Title */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Tag className="h-3 w-3" />
            {isMilestone ? 'Milestone Name' : isIconNode ? 'Icon Title' : 'Node Label'}
          </Label>
          <Input
            value={isIconNode ? formData.title : formData.label}
            onChange={(e) => {
              handleChange(isIconNode ? 'title' : 'label', e.target.value);
              onUpdate(selectedNode.id, { ...formData, [isIconNode ? 'title' : 'label']: e.target.value });
            }}
            placeholder={isMilestone ? 'Enter milestone name' : isIconNode ? 'Enter icon title' : 'Enter node label'}
          />
        </div>

        {/* Milestone Icon Selection */}
        {isMilestone && (
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Tag className="h-3 w-3" />
              Milestone Icon
            </Label>
            <div className="space-y-2">
              {/* Current icon preview */}
              {formData.icon && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                    <Icon icon={formData.icon} width={14} height={14} color="white" />
                  </div>
                  <span className="text-xs text-muted-foreground flex-1">
                    {formData.icon}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      handleChange('icon', '');
                      onUpdate(selectedNode.id, { ...formData, icon: '' });
                    }}
                    title="Clear Icon"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {/* Browse All Icons Button */}
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setShowIconPicker(true)}
              >
                <Icon icon="tabler:search" className="h-4 w-4 mr-2" />
                {formData.icon ? 'Change Icon' : 'Select Icon'}
              </Button>
            </div>
          </div>
        )}

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

        {/* Node Styling (only for mindNode type) - Collapsible */}
        {!isMilestone && !isIconNode && (
          <>
            <Separator />
            <div>
              <button
                onClick={() => toggleSection('nodeStyling')}
                className="w-full flex items-center justify-between mb-2 hover:bg-muted p-2 rounded transition-colors"
              >
                <Label className="cursor-pointer font-bold text-base flex items-center gap-2">
                  🎨 Node Styling
                </Label>
                <span className="text-sm text-muted-foreground">
                  {expandedSections.nodeStyling ? '▼' : '▶'}
                </span>
              </button>
              {expandedSections.nodeStyling && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              
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
              )}
            </div>

            {/* Text Formatting - Collapsible */}
            <div>
              <button
                onClick={() => toggleSection('textFormatting')}
                className="w-full flex items-center justify-between mb-2 hover:bg-muted p-2 rounded transition-colors"
              >
                <Label className="cursor-pointer font-bold text-base flex items-center gap-2">
                  <Icon icon="tabler:type" className="h-4 w-4" />
                  Text Formatting
                </Label>
                <span className="text-sm text-muted-foreground">
                  {expandedSections.textFormatting ? '▼' : '▶'}
                </span>
              </button>
              {expandedSections.textFormatting && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800 space-y-4">

                  {/* Font Size */}
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                      Font Size: <span className="text-primary font-bold">{formData.fontSize || 14}px</span>
                    </Label>
                    <input
                      type="range"
                      min="8"
                      max="32"
                      step="1"
                      value={formData.fontSize || 14}
                      onChange={(e) => {
                        const fontSize = Number(e.target.value);
                        handleChange('fontSize', fontSize);
                        onUpdate(selectedNode.id, { ...formData, fontSize });
                      }}
                      className="w-full cursor-pointer accent-primary h-2 rounded-lg"
                    />
                    <div className="flex justify-between text-xs font-medium text-muted-foreground mt-2">
                      <span>Small</span>
                      <span>Large</span>
                    </div>
                  </div>

                  {/* Font Weight */}
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Font Weight</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'normal', label: 'Normal', icon: 'N' },
                        { value: 'bold', label: 'Bold', icon: 'B' },
                        { value: '600', label: 'Semi-Bold', icon: 'SB' },
                        { value: '300', label: 'Light', icon: 'L' },
                      ].map((item) => (
                        <Button
                          key={item.value}
                          size="sm"
                          variant={(formData.fontWeight || 'normal') === item.value ? 'default' : 'outline'}
                          onClick={() => {
                            handleChange('fontWeight', item.value);
                            onUpdate(selectedNode.id, { ...formData, fontWeight: item.value });
                          }}
                          className="text-xs font-semibold hover:scale-105 transition-transform"
                        >
                          <span className="mr-1 text-base">{item.icon}</span>
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Text Color</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        '#000000', '#374151', '#6b7280', '#9ca3af',
                        '#1f2937', '#3b82f6', '#ef4444', '#10b981',
                        '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'
                      ].map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-md border-2 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md ${
                            (formData.textColor || '#000000') === color
                              ? 'border-primary ring-2 ring-primary/30 scale-105'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => {
                            handleChange('textColor', color);
                            onUpdate(selectedNode.id, { ...formData, textColor: color });
                          }}
                          title={color}
                        >
                          <div
                            className="w-full h-full rounded-sm shadow-inner"
                            style={{ backgroundColor: color }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Alignment */}
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Text Alignment</Label>
                    <div className="flex gap-1">
                      {[
                        { value: 'left', icon: 'tabler:align-left', label: 'Left' },
                        { value: 'center', icon: 'tabler:align-center', label: 'Center' },
                        { value: 'right', icon: 'tabler:align-right', label: 'Right' },
                      ].map((item) => (
                        <Button
                          key={item.value}
                          size="sm"
                          variant={(formData.textAlign || 'center') === item.value ? 'default' : 'outline'}
                          onClick={() => {
                            handleChange('textAlign', item.value);
                            onUpdate(selectedNode.id, { ...formData, textAlign: item.value });
                          }}
                          className="flex-1 text-xs"
                          title={item.label}
                        >
                          <Icon icon={item.icon} className="h-4 w-4" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shape Properties - Collapsible */}
            <div>
              <button
                onClick={() => toggleSection('shapeProperties')}
                className="w-full flex items-center justify-between mb-2 hover:bg-muted p-2 rounded transition-colors"
              >
                <Label className="cursor-pointer font-bold text-base flex items-center gap-2">
                  <Icon icon="tabler:dimensions" className="h-4 w-4" />
                  Shape Properties
                </Label>
                <span className="text-sm text-muted-foreground">
                  {expandedSections.shapeProperties ? '▼' : '▶'}
                </span>
              </button>
              {expandedSections.shapeProperties && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800 space-y-4">

                  {/* Size Controls */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                        Width: <span className="text-primary font-bold">{formData.width || 140}px</span>
                      </Label>
                      <input
                        type="range"
                        min="80"
                        max="400"
                        step="10"
                        value={formData.width || 140}
                        onChange={(e) => {
                          const width = Number(e.target.value);
                          handleChange('width', width);
                          onUpdate(selectedNode.id, { ...formData, width });
                        }}
                        className="w-full cursor-pointer accent-primary h-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                        Height: <span className="text-primary font-bold">{formData.height || 48}px</span>
                      </Label>
                      <input
                        type="range"
                        min="32"
                        max="200"
                        step="4"
                        value={formData.height || 48}
                        onChange={(e) => {
                          const height = Number(e.target.value);
                          handleChange('height', height);
                          onUpdate(selectedNode.id, { ...formData, height });
                        }}
                        className="w-full cursor-pointer accent-primary h-2 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Position Controls */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">X Position</Label>
                      <Input
                        type="number"
                        value={Math.round((selectedNode?.position?.x || 0))}
                        onChange={(e) => {
                          const x = Number(e.target.value);
                          // Update node position
                          if (rf && selectedNode) {
                            rf.setNodes(nodes => nodes.map(n =>
                              n.id === selectedNode.id
                                ? { ...n, position: { ...n.position, x } }
                                : n
                            ));
                          }
                        }}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Y Position</Label>
                      <Input
                        type="number"
                        value={Math.round((selectedNode?.position?.y || 0))}
                        onChange={(e) => {
                          const y = Number(e.target.value);
                          // Update node position
                          if (rf && selectedNode) {
                            rf.setNodes(nodes => nodes.map(n =>
                              n.id === selectedNode.id
                                ? { ...n, position: { ...n.position, y } }
                                : n
                            ));
                          }
                        }}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Rotation */}
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                      Rotation: <span className="text-primary font-bold">{formData.rotation || 0}°</span>
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="15"
                      value={formData.rotation || 0}
                      onChange={(e) => {
                        const rotation = Number(e.target.value);
                        handleChange('rotation', rotation);
                        onUpdate(selectedNode.id, { ...formData, rotation });
                      }}
                      className="w-full cursor-pointer accent-primary h-2 rounded-lg"
                    />
                    <div className="flex justify-between text-xs font-medium text-muted-foreground mt-2">
                      <span>0°</span>
                      <span>180°</span>
                      <span>360°</span>
                    </div>
                  </div>

                  {/* Opacity */}
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                      Opacity: <span className="text-primary font-bold">{formData.opacity || 100}%</span>
                    </Label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={formData.opacity || 100}
                      onChange={(e) => {
                        const opacity = Number(e.target.value);
                        handleChange('opacity', opacity);
                        onUpdate(selectedNode.id, { ...formData, opacity });
                      }}
                      className="w-full cursor-pointer accent-primary h-2 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Styling - Collapsible */}
            <div>
              <button
                onClick={() => toggleSection('advancedStyling')}
                className="w-full flex items-center justify-between mb-2 hover:bg-muted p-2 rounded transition-colors"
              >
                <Label className="cursor-pointer font-bold text-base flex items-center gap-2">
                  <Icon icon="tabler:sparkles" className="h-4 w-4" />
                  Advanced Styling
                </Label>
                <span className="text-sm text-muted-foreground">
                  {expandedSections.advancedStyling ? '▼' : '▶'}
                </span>
              </button>
              {expandedSections.advancedStyling && (
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 space-y-4">

                  {/* Shadow Effects */}
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Shadow Effect</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'none', label: 'No Shadow' },
                        { value: 'sm', label: 'Small' },
                        { value: 'md', label: 'Medium' },
                        { value: 'lg', label: 'Large' },
                        { value: 'xl', label: 'Extra Large' },
                        { value: 'glow', label: 'Glow' },
                      ].map((item) => (
                        <Button
                          key={item.value}
                          size="sm"
                          variant={(formData.shadow || 'none') === item.value ? 'default' : 'outline'}
                          onClick={() => {
                            handleChange('shadow', item.value);
                            onUpdate(selectedNode.id, { ...formData, shadow: item.value });
                          }}
                          className="text-xs font-semibold hover:scale-105 transition-transform"
                        >
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Border Style */}
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Border Style</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'solid', label: 'Solid' },
                        { value: 'dashed', label: 'Dashed' },
                        { value: 'dotted', label: 'Dotted' },
                        { value: 'double', label: 'Double' },
                      ].map((item) => (
                        <Button
                          key={item.value}
                          size="sm"
                          variant={(formData.borderStyle || 'solid') === item.value ? 'default' : 'outline'}
                          onClick={() => {
                            handleChange('borderStyle', item.value);
                            onUpdate(selectedNode.id, { ...formData, borderStyle: item.value });
                          }}
                          className="text-xs font-semibold hover:scale-105 transition-transform"
                        >
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Border Width */}
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                      Border Width: <span className="text-primary font-bold">{formData.borderWidth || 1}px</span>
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={formData.borderWidth || 1}
                      onChange={(e) => {
                        const borderWidth = Number(e.target.value);
                        handleChange('borderWidth', borderWidth);
                        onUpdate(selectedNode.id, { ...formData, borderWidth });
                      }}
                      className="w-full cursor-pointer accent-primary h-2 rounded-lg"
                    />
                  </div>

                  {/* Effects */}
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Special Effects</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.glassmorphism || false}
                          onChange={(e) => {
                            handleChange('glassmorphism', e.target.checked);
                            onUpdate(selectedNode.id, { ...formData, glassmorphism: e.target.checked });
                          }}
                          className="w-4 h-4 cursor-pointer accent-primary"
                        />
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">
                          🪟 Glassmorphism Effect
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.gradient || false}
                          onChange={(e) => {
                            handleChange('gradient', e.target.checked);
                            onUpdate(selectedNode.id, { ...formData, gradient: e.target.checked });
                          }}
                          className="w-4 h-4 cursor-pointer accent-primary"
                        />
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">
                          🌈 Gradient Background
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />
          </>
        )}

        <Separator />

        {/* Status - Collapsible (only for non-milestone nodes) */}
        {!isMilestone && (
          <div>
            <button
              onClick={() => toggleSection('status')}
              className="w-full flex items-center justify-between mb-2 hover:bg-muted p-2 rounded transition-colors"
            >
              <Label className="cursor-pointer flex items-center gap-2">
                <Flag className="h-3 w-3" />
                Status
              </Label>
              <span className="text-sm text-muted-foreground">
                {expandedSections.status ? '▼' : '▶'}
              </span>
            </button>
            {expandedSections.status && (
              <div>
          <Select value={formData.status} onValueChange={(v) => {
            handleChange('status', v);
            // Auto-set default icon based on status if no icon set
            if (!formData.statusIcon) {
              const defaultIcons: Record<string, string> = {
                'todo': 'tabler:circle',
                'in-progress': 'tabler:clock',
                'review': 'tabler:eye',
                'done': 'tabler:check',
                'blocked': 'tabler:ban',
              };
              if (defaultIcons[v]) {
                handleChange('statusIcon', defaultIcons[v]);
                onUpdate(selectedNode.id, { ...formData, status: v, statusIcon: defaultIcons[v] });
              } else {
                onUpdate(selectedNode.id, { ...formData, status: v });
              }
            } else {
              onUpdate(selectedNode.id, { ...formData, status: v });
            }
          }}>
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
          
          {/* Status Icon Configuration */}
          {formData.status && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Status Icon</Label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showStatusIcon}
                    onChange={(e) => {
                      handleChange('showStatusIcon', e.target.checked);
                      onUpdate(selectedNode.id, { ...formData, showStatusIcon: e.target.checked });
                    }}
                    className="w-4 h-4 cursor-pointer accent-primary"
                  />
                  <span className="text-xs">Show Icon</span>
                </label>
              </div>
              
              {formData.showStatusIcon && (
                <div className="space-y-2">
                  {/* Current icon preview */}
                  {formData.statusIcon && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                        <Icon icon={formData.statusIcon} width={14} height={14} color="white" />
                      </div>
                      <span className="text-xs text-muted-foreground flex-1">
                        {formData.statusIcon}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          handleChange('statusIcon', '');
                          onUpdate(selectedNode.id, { ...formData, statusIcon: '' });
                        }}
                        title="Clear Icon"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Browse All Icons Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowIconPicker(true)}
                  >
                    <Icon icon="tabler:search" className="h-4 w-4 mr-2" />
                    Browse All Icons
                  </Button>
                </div>
              )}
            </div>
          )}
            </div>
          )}
          </div>
        )}

        {/* Priority - Collapsible */}
        <div>
          <button
            onClick={() => toggleSection('priority')}
            className="w-full flex items-center justify-between mb-2 hover:bg-muted p-2 rounded transition-colors"
          >
            <Label className="cursor-pointer flex items-center gap-2">
              <Flag className="h-3 w-3" />
              Priority
            </Label>
            <span className="text-sm text-muted-foreground">
              {expandedSections.priority ? '▼' : '▶'}
            </span>
          </button>
          {expandedSections.priority && (
            <div>
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
          )}
        </div>

        <Separator />

        {/* PM Fields - Collapsible */}
        <div>
          <button
            onClick={() => toggleSection('pmFields')}
            className="w-full flex items-center justify-between mb-2 hover:bg-muted p-2 rounded transition-colors"
          >
            <Label className="cursor-pointer flex items-center gap-2">
              <User className="h-3 w-3" />
              Project Management Fields
            </Label>
            <span className="text-sm text-muted-foreground">
              {expandedSections.pmFields ? '▼' : '▶'}
            </span>
          </button>
          {expandedSections.pmFields && (
            <div className="space-y-4">
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
          )}
        </div>
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
    
    {/* Icon Picker Modal */}
    <IconPickerModal
      isOpen={showIconPicker}
      onClose={() => setShowIconPicker(false)}
      onSelectIcon={(title, icon, color) => {
        // Check if this is for milestone icon or status icon
        if (isMilestone) {
          // Update milestone icon
          handleChange('icon', icon);
          onUpdate(selectedNode.id, { ...formData, icon });
        } else {
          // Update status icon
          handleChange('statusIcon', icon);
          onUpdate(selectedNode.id, { ...formData, statusIcon: icon });
        }
        setShowIconPicker(false);
      }}
    />
    </>
  );
}
