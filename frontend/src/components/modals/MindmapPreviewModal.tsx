import { useMemo, useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import HeadingsMindmapPreview from "@/components/mindmap/HeadingsMindmapPreview";
import MindmapGenerator from "@/services/MindmapGenerator";
import mermaid from "mermaid";
import { aiService } from "@/services/ai/AIService";
import { sessionService } from "@/services/EditorStudioSession";
import { Sparkles, FileText } from "lucide-react";

type PreviewMode = 'headings' | 'selection';
type DiagramFormat = 'flowchart' | 'mindmap' | 'graph' | 'sequence' | 'class';
type GenerationMode = 'document' | 'ai';

interface MindmapPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  markdown: string;
  onInsertMermaid: (code: string) => void;
  mode?: PreviewMode;
  documentTitle?: string;
  cursorPosition?: number;
}

export default function MindmapPreviewModal({ 
  open, 
  onOpenChange, 
  markdown, 
  onInsertMermaid, 
  mode = 'headings',
  documentTitle = 'Untitled Document',
  cursorPosition = 0
}: MindmapPreviewModalProps) {
  const generator = useMemo(() => new MindmapGenerator(), []);
  
  // Generation mode state
  const [generationMode, setGenerationMode] = useState<GenerationMode>('document');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedCode, setAiGeneratedCode] = useState<string | null>(null);
  
  // Auto-generate preview for "From Document" mode on open
  useEffect(() => {
    if (open && generationMode === 'document') {
      setShowPreviewCode(true); // Immediately show preview
    }
  }, [open, generationMode]);
  
  // Generate data ONCE and cache it
  const mindmapData = useMemo(() => {
    return mode === 'selection'
      ? generator.generateFromSelection(markdown || "")
      : generator.generateFromHeadings(markdown || "");
  }, [markdown, mode, generator]);

  // Track which format user wants to preview/insert
  const [selectedFormat, setSelectedFormat] = useState<DiagramFormat>('mindmap');
  const [showPreviewCode, setShowPreviewCode] = useState(false); // Start false - user must select format or generate

  // Generate the Mermaid code for the selected format
  const generatedCode = useMemo(() => {
    // If in AI mode and we have AI-generated code, use that
    if (generationMode === 'ai' && aiGeneratedCode) {
      return aiGeneratedCode;
    }
    // Otherwise, use document-based generation
    return generator.exportMindmap(mindmapData, selectedFormat);
  }, [mindmapData, selectedFormat, generator, generationMode, aiGeneratedCode]);

  // Mermaid diagram preview
  const mermaidPreviewRef = useRef<HTMLDivElement>(null);
  const [mermaidError, setMermaidError] = useState<string | null>(null);

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: false, 
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  // Render Mermaid diagram when code changes OR when modal opens
  useEffect(() => {
    if (!mermaidPreviewRef.current || !generatedCode || !showPreviewCode) return;

    const renderDiagram = async () => {
      try {
        setMermaidError(null);
        const uniqueId = `mermaid-preview-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, generatedCode);
        if (mermaidPreviewRef.current) {
          mermaidPreviewRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error("Mermaid render error:", err);
        setMermaidError(err instanceof Error ? err.message : "Failed to render diagram");
      }
    };

    renderDiagram();
  }, [generatedCode, open, selectedFormat, showPreviewCode]); // Trigger when showPreviewCode changes

  const handleFormatSelect = (format: DiagramFormat) => {
    setSelectedFormat(format);
    // Only auto-show preview in document mode
    if (generationMode === 'document') {
      setShowPreviewCode(true);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    setMermaidError(null);
    
    try {
      const systemPrompt = `You are an expert in creating Mermaid diagrams. Generate ONLY valid Mermaid ${selectedFormat} diagram code based on the user's description. Return ONLY the Mermaid code, no explanations, no markdown fences, no additional text.

For mindmap format, use this syntax:
mindmap
  root((Central Topic))
    Topic 1
      Subtopic 1.1
      Subtopic 1.2
    Topic 2
      Subtopic 2.1

Ensure all node names are simple and avoid special characters.`;

      const response = await aiService.generateContent(
        aiPrompt,
        { systemPrompt, temperature: 0.7, maxTokens: 1000 }
      );

      // Clean up the response (remove markdown fences if present)
      let cleanCode = response.trim();
      cleanCode = cleanCode.replace(/^```mermaid\n?/i, '').replace(/^```\n?/, '').replace(/\n?```$/g, '');
      
      setAiGeneratedCode(cleanCode);
      setShowPreviewCode(true);
    } catch (error) {
      console.error('AI generation error:', error);
      setMermaidError(error instanceof Error ? error.message : 'Failed to generate diagram');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = () => {
    onInsertMermaid(generatedCode);
    onOpenChange(false);
    setShowPreviewCode(false);
    setSelectedFormat('mindmap');
    setAiPrompt('');
    setAiGeneratedCode(null);
    setGenerationMode('document');
  };

  const openInStudio = () => {
    // IMPORTANT: Always use flowchart format for Studio2 (it can parse it)
    // Convert current format to flowchart if needed
    const flowchartCode = selectedFormat === 'flowchart' 
      ? generatedCode 
      : generator.exportMindmap(mindmapData, 'flowchart');
    
    // Create session with full context
    const sessionId = sessionService.createSession({
      documentTitle,
      documentContent: markdown,
      diagramCode: flowchartCode, // Use flowchart format
      diagramFormat: 'flowchart', // Force flowchart
      cursorPosition,
      cursorLine: getCursorLine(markdown, cursorPosition),
      returnUrl: '/workspace',
      generationMode,
    });
    
    
    // Navigate to Studio2
    window.location.href = '/workspace';
  };
  
  // Helper to get current line number from cursor position
  const getCursorLine = (content: string, position: number): number => {
    const textBeforeCursor = content.substring(0, position);
    return textBeforeCursor.split('\n').length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mindmap Generator</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4">
          {/* Generation Mode Selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Choose Generation Mode:</Label>
            <RadioGroup value={generationMode} onValueChange={(value) => {
              setGenerationMode(value as GenerationMode);
              setShowPreviewCode(false);
              setAiGeneratedCode(null);
            }}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="document" id="document" />
                <Label htmlFor="document" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileText className="w-4 h-4" />
                  <div>
                    <div className="font-medium">From Document</div>
                    <div className="text-xs text-muted-foreground">Extract structure from your current text</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="ai" id="ai" />
                <Label htmlFor="ai" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="font-medium">AI-Powered Generation 🤖</div>
                    <div className="text-xs text-muted-foreground">Describe what you want to create</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* AI Prompt Section (only shown in AI mode) */}
          {generationMode === 'ai' && (
            <div className="space-y-3">
              <Label htmlFor="ai-prompt" className="text-sm font-medium">
                Describe your diagram:
              </Label>
              <Textarea
                id="ai-prompt"
                placeholder="e.g., Create a project plan for launching a mobile app with phases for research, design, development, testing, and deployment..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          {/* Format Selection Buttons */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">
              Choose diagram format:
              <span className="text-xs block mt-1 text-muted-foreground">
                {generationMode === 'ai' 
                  ? 'Select the type of diagram you want to generate' 
                  : 'Select a format to see a preview of what will be inserted'
                }
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant={selectedFormat === 'mindmap' ? 'default' : 'outline'}
                onClick={() => handleFormatSelect('mindmap')}
              >
                Mindmap
              </Button>
              <Button 
                size="sm" 
                variant={selectedFormat === 'flowchart' ? 'default' : 'outline'}
                onClick={() => handleFormatSelect('flowchart')}
              >
                Flowchart
              </Button>
              <Button 
                size="sm" 
                variant={selectedFormat === 'graph' ? 'default' : 'outline'}
                onClick={() => handleFormatSelect('graph')}
              >
                Graph
              </Button>
              <Button 
                size="sm" 
                variant={selectedFormat === 'sequence' ? 'default' : 'outline'}
                onClick={() => handleFormatSelect('sequence')}
              >
                Sequence
              </Button>
              <Button 
                size="sm" 
                variant={selectedFormat === 'class' ? 'default' : 'outline'}
                onClick={() => handleFormatSelect('class')}
              >
                Class Diagram
              </Button>
            </div>
          </div>

          {/* AI Generate Button (only in AI mode) */}
          {generationMode === 'ai' && !showPreviewCode && (
            <div className="flex justify-center">
              <Button
                onClick={handleAIGenerate}
                disabled={!aiPrompt.trim() || isGenerating}
                className="bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Mermaid Preview (shows when format is selected) */}
          {showPreviewCode && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-green-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {selectedFormat.charAt(0).toUpperCase() + selectedFormat.slice(1)} Diagram Preview:
              </div>
              
              {/* Visual Mermaid Diagram */}
              <div className="rounded-lg border border-green-200 bg-white p-4 min-h-[200px] max-h-[500px] overflow-auto flex items-center justify-center">
                {mermaidError ? (
                  <div className="text-sm text-red-500">
                    <div className="font-medium mb-1">⚠️ Diagram Render Error</div>
                    <div className="text-xs">{mermaidError}</div>
                  </div>
                ) : (
                  <div 
                    ref={mermaidPreviewRef} 
                    className="mermaid-preview w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
                  />
                )}
              </div>

              {/* Code Section (collapsible) */}
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <span className="transition-transform group-open:rotate-90">▶</span>
                  View Mermaid Code
                </summary>
                <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
                  <pre className="max-h-48 overflow-auto text-xs whitespace-pre-wrap">
                    {generatedCode}
                  </pre>
                </div>
              </details>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openInStudio}
              disabled={!showPreviewCode}
            >
              Open in Studio
            </Button>
            
            <div className="flex items-center gap-3">
              {/* Regenerate button for AI mode */}
              {generationMode === 'ai' && showPreviewCode && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowPreviewCode(false);
                    setAiGeneratedCode(null);
                  }}
                >
                  ← Back to Edit
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  onOpenChange(false);
                  setShowPreviewCode(false);
                  setSelectedFormat('mindmap');
                  setAiPrompt('');
                  setAiGeneratedCode(null);
                  setGenerationMode('document');
                }}
              >
                Cancel
              </Button>
              
              {showPreviewCode && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleInsert}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {`Insert ${selectedFormat.charAt(0).toUpperCase() + selectedFormat.slice(1)} Diagram`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


