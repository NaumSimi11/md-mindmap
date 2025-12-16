/**
 * UnifiedDiagramModal - Combines the best of both worlds
 * 
 * Features:
 * - Quick Insert: Generate and insert diagram without leaving editor
 * - AI Generate: Create diagrams from natural language descriptions
 * - Open Studio: Full mindmap editing power in Studio2
 * 
 * Supports 5 diagram formats:
 * - Mindmap, Flowchart, Graph, Sequence, Class Diagram
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import MindmapGenerator from "@/services/MindmapGenerator";
import { aiService } from "@/services/ai/AIService";
import { sessionService } from "@/services/EditorStudioSession";
import { isDesktop } from "@/utils/platform";
import { workspaceService } from "@/services/workspace-legacy/WorkspaceService";
import mermaid from "mermaid";
import { 
  Sparkles, 
  FileText, 
  Zap, 
  Rocket,
  Info
} from "lucide-react";
import type { Editor } from '@tiptap/react';

type DiagramFormat = 'mindmap' | 'flowchart' | 'graph' | 'sequence' | 'class';
type TabValue = 'quick' | 'ai' | 'studio';

interface UnifiedDiagramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor | null;
  documentContent: string; // Full markdown content
  documentId?: string;
  documentTitle?: string;
  selectedText?: string; // If user has text selected
}

export default function UnifiedDiagramModal({
  open,
  onOpenChange,
  editor,
  documentContent,
  documentId,
  documentTitle = 'Untitled Document',
  selectedText,
}: UnifiedDiagramModalProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabValue>('quick');
  
  // Format selection
  const [selectedFormat, setSelectedFormat] = useState<DiagramFormat>('mindmap');
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewCode, setPreviewCode] = useState<string>('');
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  
  // AI generation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Studio state
  const [studioMode, setStudioMode] = useState<'clean' | 'generate'>('generate');
  
  // Platform detection
  const isDesktopMode = isDesktop();
  const workspacePath = isDesktopMode ? workspaceService.getDesktopWorkspacePath() : null;
  const needsWorkspace = isDesktopMode && !workspacePath;
  
  // Navigation
  const navigate = useNavigate();
  
  // Mermaid generator
  const generator = useMemo(() => new MindmapGenerator(), []);
  
  // Mermaid preview ref
  const mermaidPreviewRef = useRef<HTMLDivElement>(null);
  
  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: false, 
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);
  
  // Determine content source (selected text vs full document)
  const contentToUse = useMemo(() => {
    return selectedText && selectedText.trim().length > 0 ? selectedText : documentContent;
  }, [selectedText, documentContent]);
  
  // Generate mindmap data from content
  const mindmapData = useMemo(() => {
    if (!contentToUse) return null;
    try {
      return generator.generateFromHeadings(contentToUse);
    } catch (error) {
      console.error('Failed to generate mindmap data:', error);
      return null;
    }
  }, [contentToUse, generator]);
  
  // Generate Mermaid code for Quick Insert
  const generateDiagramCode = useCallback((format: DiagramFormat): string => {
    if (!mindmapData) return '';
    try {
      return generator.exportMindmap(mindmapData, format);
    } catch (error) {
      console.error('Failed to export diagram:', error);
      return '';
    }
  }, [mindmapData, generator]);
  
  // Handle format selection (for Quick Insert)
  const handleFormatSelect = (format: DiagramFormat) => {
    setSelectedFormat(format);
    
    if (activeTab === 'quick') {
      // Auto-generate preview for Quick Insert
      const code = generateDiagramCode(format);
      setPreviewCode(code);
      setShowPreview(true);
      setMermaidError(null);
    }
  };
  
  // Render Mermaid diagram
  useEffect(() => {
    if (!mermaidPreviewRef.current || !previewCode || !showPreview) return;

    const renderDiagram = async () => {
      try {
        setMermaidError(null);
        const uniqueId = `mermaid-unified-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, previewCode);
        if (mermaidPreviewRef.current) {
          mermaidPreviewRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error("Mermaid render error:", err);
        setMermaidError(err instanceof Error ? err.message : "Failed to render diagram");
      }
    };

    renderDiagram();
  }, [previewCode, showPreview]);
  
  // Handle AI generation
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

For flowchart format, use this syntax:
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]

Ensure all node names are simple and avoid special characters.`;

      const response = await aiService.generateContent(
        aiPrompt,
        systemPrompt,
        { temperature: 0.7, maxTokens: 1000 }
      );

      // Clean up the response
      let cleanCode = response.trim();
      cleanCode = cleanCode.replace(/^```mermaid\n?/i, '').replace(/^```\n?/, '').replace(/\n?```$/g, '');
      
      setPreviewCode(cleanCode);
      setShowPreview(true);
    } catch (error) {
      console.error('AI generation error:', error);
      setMermaidError(error instanceof Error ? error.message : 'Failed to generate diagram');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle Quick Insert
  const handleQuickInsert = () => {
    if (!editor || !previewCode) return;
    
    try {
      // Insert as custom MermaidNode in WYSIWYG editor
      editor.commands.insertContent({
        type: 'mermaidDiagram',
        attrs: {
          code: previewCode,
        },
      });
      
      // Success - close modal
      handleClose();
    } catch (error) {
      console.error('Failed to insert diagram:', error);
      setMermaidError('Failed to insert diagram into editor');
    }
  };
  
  // Handle Open Studio
  const handleOpenStudio = () => {
    if (!documentId) {
      alert('Document must be saved before opening in Studio');
      return;
    }
    
    if (studioMode === 'generate') {
      // Generate mindmap and navigate
      navigate(`/workspace/doc/${documentId}/mindmap?mode=generate&type=mindmap`);
    } else {
      // Clean board
      navigate(`/workspace/doc/${documentId}/mindmap?mode=clean`);
    }
    
    handleClose();
  };
  
  // Handle close
  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setActiveTab('quick');
      setShowPreview(false);
      setPreviewCode('');
      setAiPrompt('');
      setMermaidError(null);
      setSelectedFormat('mindmap');
      setStudioMode('generate');
    }, 300);
  };
  
  // Auto-generate preview when switching to Quick Insert tab
  useEffect(() => {
    if (open && activeTab === 'quick' && !showPreview) {
      const code = generateDiagramCode(selectedFormat);
      if (code) {
        setPreviewCode(code);
        setShowPreview(true);
      }
    }
  }, [open, activeTab, selectedFormat, showPreview, generateDiagramCode]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            Diagrams & Mindmaps
            {isDesktopMode && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-normal">
                Desktop
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="quick" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Quick Insert
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="studio" className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              Open Studio
            </TabsTrigger>
          </TabsList>

          {/* Quick Insert Tab */}
          <TabsContent value="quick" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <strong>Quick workflow:</strong> Generate diagram from your content and insert directly into the editor.
                {selectedText && (
                  <div className="mt-1 text-xs text-blue-700">
                    📝 Using selected text ({selectedText.length} characters)
                  </div>
                )}
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Choose diagram format:</Label>
              <div className="flex flex-wrap gap-2">
                {(['mindmap', 'flowchart', 'graph', 'sequence', 'class'] as DiagramFormat[]).map((format) => (
                  <Button
                    key={format}
                    size="sm"
                    variant={selectedFormat === format ? 'default' : 'outline'}
                    onClick={() => handleFormatSelect(format)}
                  >
                    {format.charAt(0).toUpperCase() + format.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-green-600 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Preview:
                </div>
                
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

                {/* Code View */}
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
                    <span className="transition-transform group-open:rotate-90">▶</span>
                    View Mermaid Code
                  </summary>
                  <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
                    <pre className="max-h-48 overflow-auto text-xs whitespace-pre-wrap">
                      {previewCode}
                    </pre>
                  </div>
                </details>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleQuickInsert}
                disabled={!showPreview || !!mermaidError}
                className="bg-green-600 hover:bg-green-700"
              >
                Insert into Editor
              </Button>
            </div>
          </TabsContent>

          {/* AI Generate Tab */}
          <TabsContent value="ai" className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-purple-900">
                <strong>AI-powered:</strong> Describe what you want and AI will generate the diagram for you.
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Choose diagram type:</Label>
              <div className="flex flex-wrap gap-2">
                {(['mindmap', 'flowchart', 'graph', 'sequence', 'class'] as DiagramFormat[]).map((format) => (
                  <Button
                    key={format}
                    size="sm"
                    variant={selectedFormat === format ? 'default' : 'outline'}
                    onClick={() => setSelectedFormat(format)}
                  >
                    {format.charAt(0).toUpperCase() + format.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* AI Prompt */}
            {!showPreview && (
              <div className="space-y-3">
                <Label htmlFor="ai-prompt" className="text-sm font-medium">
                  Describe your diagram:
                </Label>
                <Textarea
                  id="ai-prompt"
                  placeholder="e.g., Create a software development lifecycle diagram with phases for planning, design, development, testing, and deployment..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="min-h-[120px]"
                />
                
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
              </div>
            )}

            {/* Preview */}
            {showPreview && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-green-600 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  AI Generated Preview:
                </div>
                
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

                {/* Code View */}
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
                    <span className="transition-transform group-open:rotate-90">▶</span>
                    View Mermaid Code
                  </summary>
                  <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
                    <pre className="max-h-48 overflow-auto text-xs whitespace-pre-wrap">
                      {previewCode}
                    </pre>
                  </div>
                </details>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              {showPreview && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewCode('');
                    setMermaidError(null);
                  }}
                >
                  ← Back to Edit
                </Button>
              )}
              <div className="flex items-center gap-3 ml-auto">
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                {showPreview && (
                  <Button 
                    variant="default" 
                    onClick={handleQuickInsert}
                    disabled={!!mermaidError}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Insert into Editor
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Open Studio Tab */}
          <TabsContent value="studio" className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-start gap-2">
              <Rocket className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-indigo-900">
                <strong>Full power:</strong> Open the Mindmap Studio for advanced editing with drag & drop, connections, and styling.
              </div>
            </div>

            {/* Studio Mode Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">How do you want to start?</Label>
              <RadioGroup value={studioMode} onValueChange={(v) => setStudioMode(v as 'clean' | 'generate')}>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="generate" id="generate" />
                  <Label htmlFor="generate" className="cursor-pointer flex-1">
                    <div className="font-medium">Generate from Content</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Auto-generate mindmap from your document's structure
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="clean" id="clean" />
                  <Label htmlFor="clean" className="cursor-pointer flex-1">
                    <div className="font-medium">Clean Board</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Start with a blank canvas and build from scratch
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Studio Features Preview */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="text-sm font-medium mb-3">Studio Features:</div>
              <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  Drag & drop nodes
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  Auto-layout
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  Custom connections
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  Node styling
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  Smart merge back
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  Export options
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleOpenStudio}
                disabled={!documentId || needsWorkspace}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Open Studio
              </Button>
            </div>
            
            {/* Warnings */}
            {needsWorkspace && (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg">💾</span>
                  <div>
                    <strong>Desktop Mode:</strong> Please select a workspace folder first.
                    <div className="mt-1 text-xs">
                      Go to the workspace sidebar and click "Select Folder" to enable file persistence and Studio access.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {!needsWorkspace && !documentId && (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                ⚠️ Please save your document before opening in Studio
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

