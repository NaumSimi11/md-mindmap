import { useState, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import aiService from "@/services/ai/AIService";
import mermaid from "mermaid";
import { decrementGuestCredits, getGuestCredits } from "@/lib/guestCredits";
import {
  GitBranch,
  Workflow,
  Clock,
  Users,
  Route,
  Network,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface AIAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentContent: string;
  // New: enhance mode opens from right-click on a diagram
  enhanceMode?: boolean;
  initialDiagramCode?: string;
  onInsert?: (code: string) => void;
  // Optional: seed the template prompt (e.g., with a validation error hint)
  initialTemplatePrompt?: string;
}

const diagramOptions = [
  {
    id: 'flowchart',
    title: 'Flowchart',
    description: 'Visualize processes and decision flows',
    useCase: 'Perfect for workflows and procedures',
    icon: Workflow,
  },
  {
    id: 'sequence',
    title: 'Sequence',
    description: 'Show interactions over time',
    useCase: 'Ideal for system communications',
    icon: Clock,
  },
  {
    id: 'class',
    title: 'Class Diagram',
    description: 'Display system structure and relationships',
    useCase: 'Software architecture visualization',
    icon: Network,
  },
  {
    id: 'mindmap',
    title: 'Mindmap',
    description: 'Connect ideas and concepts visually',
    useCase: 'Brainstorming and knowledge mapping',
    icon: Network,
  },
  {
    id: 'journey',
    title: 'User Journey',
    description: 'Map user experience and touchpoints',
    useCase: 'UX design and customer experience',
    icon: Route,
  },
  {
    id: 'git',
    title: 'Git Graph',
    description: 'Visualize code branches and commits',
    useCase: 'Development workflow tracking',
    icon: GitBranch,
  },
];

export function AIAssistantModal({ open, onOpenChange, documentContent, enhanceMode = false, initialDiagramCode = '', onInsert, initialTemplatePrompt }: AIAssistantModalProps) {
  // Auto-generate smart prompt based on document content
  const getAutoPrompt = () => {
    if (!documentContent.trim()) return '';

    // Extract key sentences and headings from document
    const sentences = documentContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const headings = documentContent.match(/^#{1,6}\s+.*/gm) || [];

    // Analyze document type and content
    const lowerContent = documentContent.toLowerCase();
    const isTechnical = /api|database|server|client|function|class|method|variable/.test(lowerContent);
    const isBusiness = /customer|product|service|market|sales|revenue|profit|strategy/.test(lowerContent);
    const isProcess = /process|workflow|step|stage|phase|milestone|procedure/.test(lowerContent);

    let prompt = '';

    if (isTechnical) {
      prompt = `Create a technical diagram that visualizes the key components and relationships in this ${headings.length > 0 ? 'structured' : 'content'}. `;
      if (headings.length > 0) {
        prompt += `Use these main sections as the primary nodes: ${headings.slice(0, 3).map(h => h.replace(/^#{1,6}\s+/, '')).join(', ')}.`;
      } else if (sentences.length > 0) {
        prompt += `Focus on: "${sentences[0].trim()}".`;
      }
    } else if (isBusiness) {
      prompt = `Create a business process diagram showing the workflow described in this content. `;
      if (sentences.length > 0) {
        prompt += `Key process: "${sentences[0].trim()}".`;
      }
    } else if (isProcess) {
      prompt = `Create a flowchart that maps out the process steps mentioned in this document. `;
      if (sentences.length > 0) {
        prompt += `Start with: "${sentences[0].trim()}".`;
      }
    } else {
      // General case - use first meaningful sentence
      if (sentences.length > 0) {
        prompt = `Create a diagram that visualizes: "${sentences[0].trim()}".`;
      } else {
        prompt = 'Create a diagram based on the content of this document.';
      }
    }

    return prompt;
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>(null);
  const [preselectedDiagram, setPreselectedDiagram] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultDiagramType, setResultDiagramType] = useState<string>('');
  const [diagramCardsCollapsed, setDiagramCardsCollapsed] = useState(false);
  const autoPrompt = getAutoPrompt();
  const [includeDocContext, setIncludeDocContext] = useState(!enhanceMode);
  const wordCount = documentContent.split(/\s+/).filter(word => word.length > 0).length;
  const diagramLines = initialDiagramCode ? initialDiagramCode.split('\n').length : 0;
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Smart generation - auto-select best diagram type based on content
  const handleSmartGenerate = useCallback(() => {
    // Analyze document to pick best diagram type
    const lowerContent = documentContent.toLowerCase();
    let bestDiagramType = 'flowchart'; // Default

    if (/mindmap|concept|idea|brainstorm|knowledge/.test(lowerContent)) {
      bestDiagramType = 'mindmap';
    } else if (/process|workflow|step|stage|procedure|algorithm|flow|procedure/.test(lowerContent)) {
      bestDiagramType = 'flowchart';
    } else if (/relationship|connection|link|network|system|component|entity/.test(lowerContent)) {
      bestDiagramType = 'graph';
    } else if (/sequence|interaction|communication|timeline|order|step|phase/.test(lowerContent)) {
      bestDiagramType = 'sequence';
    } else if (/class|object|structure|architecture|inheritance|attribute|method/.test(lowerContent)) {
      bestDiagramType = 'class';
    }

    // Pre-select the diagram type and start generation
    setPreselectedDiagram(bestDiagramType);
    handleDiagramSelect(bestDiagramType);
  }, [documentContent]);

  // Seed template when provided (e.g., from validation error flow)
  useEffect(() => {
    if (open && initialTemplatePrompt) {
      setCustomPrompt(initialTemplatePrompt);
    }
  }, [open, initialTemplatePrompt]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey && autoPrompt) {
        e.preventDefault();
        setCustomPrompt(autoPrompt);
        setSelectedTemplate('Smart Generate');
        handleSmartGenerate();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, autoPrompt, handleSmartGenerate]);

  const handleDiagramSelect = async (diagramId: string) => {
    setSelectedDiagram(diagramId);
    setIsGenerating(true);
    setError(null);
    
    try {
      // Compose advanced, constrained prompts
      const userParts: string[] = [];
      if (customPrompt) userParts.push(customPrompt);
      const userPrompt = userParts.join('\n');

      const docContext = includeDocContext ? documentContent.slice(0, 2000) : '';

      const systemPrompt = [
        'You are an expert in Mermaid diagrams. Return ONLY valid Mermaid code.',
        'Do not include triple backticks or any explanations.',
        'Preserve the existing structure unless changes are explicitly requested.',
        'For mindmaps, use proper Mermaid mindmap syntax with valid node IDs.',
        'Node IDs should be simple alphanumeric strings without spaces or special characters.',
        'Prefer readable node IDs and keep layout readable.',
        'Ensure all generated code follows Mermaid syntax exactly.',
      ].join(' ');

      const contextBlock = enhanceMode
        ? `CURRENT DIAGRAM (Mermaid):\n\n${initialDiagramCode}\n\n`
        : '';

      const fullPrompt = [
        contextBlock,
        includeDocContext ? `DOCUMENT CONTEXT (trimmed):\n\n${docContext}\n\n` : '',
        'REQUEST:',
        userPrompt || `Please generate a ${diagramId} Mermaid diagram representing the described changes.`,
        '\n\nCONSTRAINTS:',
        '- Return Mermaid code only (no fences).',
        `- Diagram type: ${diagramId}.`,
      ].join('');

      const mermaidCode = await aiService.generateContent(fullPrompt, {
        systemPrompt,
        temperature: 0.3,
        maxTokens: 1200,
      });

      // Clean fences if any
      let cleanCode = mermaidCode.trim().replace(/^```mermaid\n?/i, '').replace(/```\s*$/i, '').trim();
      if (!cleanCode.toLowerCase().startsWith('flowchart') && !cleanCode.toLowerCase().startsWith('graph') &&
          !cleanCode.toLowerCase().startsWith('sequence') && !cleanCode.toLowerCase().startsWith('class') &&
          !cleanCode.toLowerCase().startsWith('mindmap') && !cleanCode.toLowerCase().startsWith('journey')) {
        // If model wrapped with text, try to extract the first mermaid-looking block
        const match = cleanCode.match(/(flowchart|graph|sequenceDiagram|classDiagram|mindmap|journey)[\s\S]*/i);
        if (match) cleanCode = match[0].trim();
      }

      // Validate with mermaid
      try {
        const id = `validate-${Date.now()}`;
        await mermaid.render(id, cleanCode);
      } catch (e: any) {
        const errorMessage = e?.message || 'Invalid Mermaid code.';
        console.error('Mermaid validation failed:', errorMessage);

        // Provide helpful error message based on diagram type
        let helpfulMessage = errorMessage;
        if (diagramId === 'mindmap' && errorMessage.includes('MINDMAP')) {
          helpfulMessage = 'Mindmap generation failed. The AI may have included invalid node names. Try regenerating or use a different diagram type.';
        } else if (errorMessage.includes('Parse error')) {
          helpfulMessage = `Mermaid syntax error: ${errorMessage}. The generated code may not follow proper Mermaid syntax.`;
        }

        setError(helpfulMessage);
        setIsGenerating(false);
        setPreselectedDiagram(null);
        return;
      }

      // Success → show result instead of closing
      setGeneratedResult(cleanCode);
      setResultDiagramType(diagramId);
      setShowResult(true);
      setIsGenerating(false);
      setSelectedDiagram(null);
      setPreselectedDiagram(null);
    } catch (e: any) {
      setError(e?.message || 'AI request failed.');
    } finally {
      setIsGenerating(false);
      setSelectedDiagram(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-foreground">
                AI Assistant
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Transform your content into visual diagrams
              </DialogDescription>
            </div>
          </div>
          
          <div className="px-3 py-2 bg-muted/50 rounded-lg border border-border space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {enhanceMode ? (
                  <>Based on selected diagram ({diagramLines} lines){includeDocContext ? ' + document context' : ''}</>
                ) : (
                  <>Based on your current document content ({wordCount} words)</>
                )}
              </p>
              {enhanceMode && (
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={includeDocContext} onChange={(e) => setIncludeDocContext(e.target.checked)} />
                  Include document context
                </label>
              )}
            </div>

            {autoPrompt && !enhanceMode && (
              <div className="p-2 bg-primary/5 border border-primary/20 rounded text-xs text-primary">
                <div className="font-medium mb-1">🤖 Smart suggestion ready:</div>
                <div className="italic">"{autoPrompt}"</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Press Ctrl+Enter or click "Smart Generate"
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-foreground">Generating Diagram...</p>
              <p className="text-sm text-muted-foreground">
                Analyzing content and creating your {selectedDiagram} diagram
              </p>
            </div>
          </div>
        ) : showResult && generatedResult ? (
          <div className="space-y-6">
            {/* Result Preview */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-green-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Diagram Generated Successfully!
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
                <div className="text-xs text-muted-foreground mb-2">Generated Diagram Code:</div>
                <pre className="max-h-64 overflow-auto text-xs bg-white p-3 rounded border whitespace-pre-wrap">
                  {generatedResult}
                </pre>
              </div>

              {/* Validation Warning */}
              {resultDiagramType === 'mindmap' && generatedResult.includes('Live Preview') && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                  <div className="text-xs text-amber-800 mb-1">⚠️ Note:</div>
                  <div className="text-xs text-amber-700">
                    The generated mindmap may contain node names that need adjustment for proper Mermaid syntax.
                    Consider using a different diagram type or regenerating with a simpler prompt.
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    if (onInsert && generatedResult) {
                      onInsert(generatedResult);
                    }
                    onOpenChange(false);
                    // Reset state for next use
                    setTimeout(() => {
                      setGeneratedResult(null);
                      setShowResult(false);
                      setCustomPrompt('');
                      setSelectedTemplate(null);
                      setPreselectedDiagram(null);
                    }, 100);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Insert Diagram
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowResult(false);
                    setCustomPrompt(`Enhance this diagram: ${generatedResult}`);
                    setSelectedTemplate('Enhance Generated');
                    // Keep the generated result for reference
                    setGeneratedResult(generatedResult);
                  }}
                >
                  Enhance This
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowResult(false);
                    setGeneratedResult(null);
                    handleSmartGenerate();
                  }}
                >
                  Regenerate
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowResult(false);
                  setGeneratedResult(null);
                  setPreselectedDiagram(null);
                }}
              >
                Back to Edit
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {enhanceMode && (
              <div className="rounded-md border border-border p-3 bg-muted/30">
                <div className="text-xs text-muted-foreground mb-2">Current Diagram (readonly)</div>
                <pre className="max-h-40 overflow-auto text-xs whitespace-pre-wrap">{initialDiagramCode}</pre>
              </div>
            )}
            <div className="space-y-2">
              <div className="text-sm font-medium">Templates</div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Add a node named "Retry" under Validation Engine',
                  'Connect API Gateway to Version Manager with dashed arrow',
                  'Rename "User Interface" to "UI"',
                  'Group nodes into subgraph "Security"',
                ].map((t, i) => (
                  <button key={i} onClick={() => setCustomPrompt(t)} className="px-2 py-1 rounded-md border text-xs hover:bg-accent">
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Custom prompt</div>
              <Textarea
                placeholder="e.g., Add a ‘Retry’ path from Validation Engine back to UI using a dashed arrow; keep original layout"
                value={customPrompt}
                onChange={(e) => {
                  setCustomPrompt(e.target.value);
                  setSelectedTemplate(null); // Clear selection when user types
                }}
                className="h-28"
              />
            </div>

            {/* Diagram Type Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Diagram Types</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDiagramCardsCollapsed(!diagramCardsCollapsed)}
                  className="h-8 px-2 text-xs"
                >
                  {diagramCardsCollapsed ? (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show All
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Collapse
                    </>
                  )}
                </Button>
              </div>

              {diagramCardsCollapsed ? (
                /* Collapsed view - just summary */
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-2">Available diagram types:</div>
                  <div className="flex flex-wrap gap-1">
                    {diagramOptions.map((option) => (
                      <span key={option.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                        <option.icon className="h-3 w-3" />
                        {option.title}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setDiagramCardsCollapsed(false)}
                  >
                    Show Diagram Selection
                  </Button>
                </div>
              ) : (
                /* Expanded view - full grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 py-2">
              {diagramOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedDiagram === option.id || preselectedDiagram === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedDiagram(option.id);
                      setPreselectedDiagram(null); // Clear preselection when user manually selects
                      handleDiagramSelect(option.id);
                    }}
                    className={`group relative p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-lg'
                        : 'border-border bg-card hover:bg-card/80 hover:border-primary/50 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-8 w-8 text-primary group-hover:text-primary transition-colors" />
                      </div>
                      <div className="text-center space-y-1">
                        <h3 className={`font-semibold transition-colors ${
                          isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                        }`}>
                          {option.title}
                          {isSelected && (
                            <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              Selected
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{option.description}</p>
                      </div>
                    </div>
                    <div className={`absolute inset-0 rounded-xl border-2 transition-colors pointer-events-none ${
                      isSelected ? 'border-primary/30' : 'border-transparent group-hover:border-primary/20'
                    }`} />
                  </button>
                );
              })}
                </div>
              )}
            </div>
          </div>
        )}

        {!showResult && (
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              {autoPrompt && !enhanceMode && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setCustomPrompt(autoPrompt);
                    setSelectedTemplate('Smart Generate');
                    // Auto-select the most appropriate diagram type and start generation
                    handleSmartGenerate();
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Smart Generate
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (autoPrompt) {
                    setCustomPrompt(autoPrompt);
                    setSelectedTemplate('Auto-filled');
                  }
                }}
                disabled={!autoPrompt}
              >
                Use Auto-Prompt
              </Button>
            </div>

            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}