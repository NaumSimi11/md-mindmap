/**
 * Studio2ExportModal - Export mindmap in various formats
 */

import { useState } from 'react';
import { Node, Edge } from '@xyflow/react';
import { FileDown, FileText, FileJson, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { mindmapExporter } from '@/services/mindmap/MindmapExporter';

interface Studio2ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  nodes: Node[];
  edges: Edge[];
}

export default function Studio2ExportModal({ isOpen, onClose, title, nodes, edges }: Studio2ExportModalProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      // Convert React Flow data to generic format
      const mindmapData = {
        title,
        nodes: nodes.map(n => ({
          id: n.id,
          label: n.data.label || '',
          description: n.data.description,
          x: n.position.x,
          y: n.position.y,
        })),
        links: edges.map(e => ({
          source: e.source,
          target: e.target,
        })),
      };

      const content = mindmapExporter.export(mindmapData, format as any);
      
      const extension = format.includes('mermaid') ? 'mmd' : 
                        format === 'markdown' ? 'md' : 'json';
      
      mindmapExporter.download(content, `${title.replace(/\s+/g, '_')}.${extension}`);
      
      console.log(`✅ Exported as ${format}`);
      setTimeout(onClose, 500);
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportOptions = [
    {
      id: 'mermaid-mindmap',
      label: 'Mermaid Mindmap',
      description: 'Export as Mermaid mindmap diagram',
      icon: <FileText className="h-5 w-5" />,
      color: 'text-purple-600',
    },
    {
      id: 'mermaid-flowchart',
      label: 'Mermaid Flowchart',
      description: 'Export as Mermaid flowchart',
      icon: <FileText className="h-5 w-5" />,
      color: 'text-blue-600',
    },
    {
      id: 'mermaid-graph',
      label: 'Mermaid Graph',
      description: 'Export as Mermaid graph',
      icon: <FileText className="h-5 w-5" />,
      color: 'text-green-600',
    },
    {
      id: 'markdown',
      label: 'Markdown',
      description: 'Export as hierarchical Markdown',
      icon: <FileDown className="h-5 w-5" />,
      color: 'text-gray-600',
    },
    {
      id: 'json',
      label: 'JSON',
      description: 'Export as structured JSON',
      icon: <FileJson className="h-5 w-5" />,
      color: 'text-orange-600',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export Mindmap
          </DialogTitle>
          <DialogDescription>
            Choose a format to export your mindmap
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 mt-4">
          {exportOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleExport(option.id)}
              disabled={exporting}
              className="
                flex items-center gap-4 p-4 rounded-lg border-2 border-border
                hover:border-indigo-500 hover:bg-indigo-50/50
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                group
              "
            >
              <div className={`${option.color} group-hover:scale-110 transition-transform`}>
                {option.icon}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-sm">{option.label}</h3>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
              <FileDown className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600" />
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Use Mermaid formats to import into other tools. 
            Use JSON to backup your entire mindmap structure.
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
