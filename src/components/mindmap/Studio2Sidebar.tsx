/**
 * Studio2Sidebar - Project Management Fields Panel
 * Displays and edits detailed PM data for selected nodes/milestones
 */

import { useState } from 'react';
import { Node } from '@xyflow/react';
import { X, Calendar, User, Flag, Clock, TrendingUp, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface Studio2SidebarProps {
  selectedNode: Node | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: Partial<any>) => void;
}

export default function Studio2Sidebar({ selectedNode, onClose, onUpdate }: Studio2SidebarProps) {
  if (!selectedNode) return null;

  const [formData, setFormData] = useState({
    label: selectedNode.data.label || '',
    description: selectedNode.data.description || '',
    status: selectedNode.data.status || 'todo',
    priority: selectedNode.data.priority || 'medium',
    owner: selectedNode.data.owner || '',
    startDate: selectedNode.data.startDate || '',
    endDate: selectedNode.data.endDate || '',
    estimate: selectedNode.data.estimate || '',
    progress: selectedNode.data.progress || 0,
    tags: selectedNode.data.tags || '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate(selectedNode.id, formData);
    onClose();
  };

  const isMilestone = selectedNode.type === 'milestone';

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {isMilestone ? '📁 Milestone Details' : '💡 Node Details'}
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
        {/* Label */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Tag className="h-3 w-3" />
            {isMilestone ? 'Milestone Name' : 'Node Label'}
          </Label>
          <Input
            value={formData.label}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder={isMilestone ? 'Enter milestone name' : 'Enter node label'}
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
