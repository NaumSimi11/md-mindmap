/**
 * Studio2TemplateModal - Quick-start templates
 */

import { FileText, Briefcase, Target, Users, Lightbulb, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { mindmapTemplateService, type MindmapTemplate } from '@/services/mindmap/MindmapTemplates';

interface Studio2TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (template: MindmapTemplate) => void;
}

export default function Studio2TemplateModal({ isOpen, onClose, onLoadTemplate }: Studio2TemplateModalProps) {
  const templates = mindmapTemplateService.getAllTemplates();

  const iconMap: Record<string, any> = {
    'project-planning': <Briefcase className="h-6 w-6" />,
    'brainstorming': <Lightbulb className="h-6 w-6" />,
    'swot-analysis': <Target className="h-6 w-6" />,
    'team-structure': <Users className="h-6 w-6" />,
    'product-roadmap': <GitBranch className="h-6 w-6" />,
  };

  const handleSelect = (template: MindmapTemplate) => {
    onLoadTemplate(template);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mindmap Templates
          </DialogTitle>
          <DialogDescription>
            Start with a pre-built template to save time
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelect(template)}
              className="
                flex flex-col gap-3 p-5 rounded-xl border-2 border-border
                hover:border-indigo-500 hover:shadow-lg
                transition-all duration-200
                text-left group
              "
            >
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white group-hover:scale-110 transition-transform">
                  {iconMap[template.id] || <FileText className="h-6 w-6" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base mb-1">{template.name}</h3>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </div>
              </div>

              {/* Preview Stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 pt-3 border-t border-border">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  {template.nodes.length} nodes
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  {template.links.length} connections
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Templates are a great starting point. 
            You can customize them to fit your specific needs.
          </p>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
