import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Plus, FileText, Upload } from "lucide-react";
import MindmapCanvas from "@/components/mindmap/MindmapCanvas";
import { ReactFlowProvider } from "@xyflow/react";
import { useEffect, useMemo } from "react";
import MindmapGenerator from "@/services/MindmapGenerator";

export default function MindmapStudio() {
  const [title, setTitle] = useState("Mindmap Studio");
  const draftEntities = useMemo(() => {
    try {
      const raw = localStorage.getItem('mindmapDraftEntities');
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  }, []);
  const draftMermaid = useMemo(() => {
    try {
      const raw = localStorage.getItem('mindmapDraftMermaid');
      return raw || undefined;
    } catch { return undefined; }
  }, []);
  useEffect(() => {
    if (draftEntities) {
      // one-time consume
      localStorage.removeItem('mindmapDraftEntities');
    }
    if (draftMermaid) {
      localStorage.removeItem('mindmapDraftMermaid');
    }
  }, [draftEntities]);

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
          <Button size="sm" variant="outline"><FileText className="h-4 w-4 mr-2"/>From headings</Button>
          <Button size="sm" variant="outline"><Upload className="h-4 w-4 mr-2"/>Import</Button>
          <Button size="sm" className="gradient-primary text-white"><Plus className="h-4 w-4 mr-2"/>New node</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">Export</Button>
          <Button size="sm" className="gradient-primary text-white"><Sparkles className="h-4 w-4 mr-2"/>AI Tools</Button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ReactFlowProvider>
        {(() => {
          if (draftEntities && Array.isArray(draftEntities)) {
            return <MindmapCanvas initialEntities={draftEntities} />;
          }
          if (draftMermaid) {
            // Convert Mermaid to entities and render
            const gen = new MindmapGenerator();
            const data = gen.fromMermaid(draftMermaid);
            const parentByChild: Record<string, string | null> = {};
            data.connections.forEach((c) => { parentByChild[c.to] = c.from; });
            const entities = data.nodes.map((n) => ({ id: n.id, label: n.text, parentId: parentByChild[n.id] || null }));
            return <MindmapCanvas initialEntities={entities} />;
          }
          return <MindmapCanvas />;
        })()}
        </ReactFlowProvider>
      </div>
    </div>
  );
}


