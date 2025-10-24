/**
 * Unified AI Modal - Combines text operations and diagram generation
 * 
 * Features:
 * - Text Tab: Improve, summarize, brainstorm, etc.
 * - Diagrams Tab: Generate Mermaid diagrams
 * - Context Files: Works in both tabs
 * - @ Mentions: Reference context files
 * - Smart Prompts: Auto-generated suggestions
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import aiService from '@/services/ai/AIService';
import mermaid from 'mermaid';
import { decrementGuestCredits, getGuestCredits } from '@/lib/guestCredits';
import {
  Sparkles,
  PenLine,
  FileText,
  ListChecks,
  Lightbulb,
  Wand2,
  GitBranch,
  Workflow,
  Clock,
  Users,
  Route,
  Network,
  Loader2,
  AlertCircle,
  AtSign,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

interface UnifiedAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentContent?: string;
  selectedText?: string;
  contextFiles?: Array<{ id: string; name: string; content?: string }>;
  onInsertText?: (text: string) => void;
  onInsertDiagram?: (code: string) => void;
  // Diagram enhance mode
  enhanceMode?: boolean;
  initialDiagramCode?: string;
  initialTemplatePrompt?: string;
  // Default tab
  defaultTab?: 'text' | 'diagrams';
}

// Text Quick Actions
const TEXT_ACTIONS = [
  {
    id: 'write',
    label: 'Write for me',
    icon: <PenLine className="w-4 h-4" />,
    prompt: 'Write a well-structured paragraph about: ',
    description: 'Generate new content from scratch',
  },
  {
    id: 'improve',
    label: 'Improve text',
    icon: <Sparkles className="w-4 h-4" />,
    prompt: 'Improve and polish this text, making it more professional and clear:\n\n',
    description: 'Enhance grammar, clarity, and style',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    icon: <FileText className="w-4 h-4" />,
    prompt: 'Summarize the following text in a concise way:\n\n',
    description: 'Create a short summary',
  },
  {
    id: 'action-items',
    label: 'Extract tasks',
    icon: <ListChecks className="w-4 h-4" />,
    prompt: 'Extract action items and tasks from:\n\n',
    description: 'Find todos and next steps',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm',
    icon: <Lightbulb className="w-4 h-4" />,
    prompt: 'Generate creative ideas and suggestions for: ',
    description: 'Get fresh perspectives',
  },
  {
    id: 'format',
    label: 'Auto-format',
    icon: <Wand2 className="w-4 h-4" />,
    prompt: 'Format this text with proper markdown structure (headings, lists, bold):\n\n',
    description: 'Add markdown formatting',
  },
];

// Diagram Types
const DIAGRAM_TYPES = [
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

export function UnifiedAIModal({
  open,
  onOpenChange,
  documentContent = '',
  selectedText = '',
  contextFiles = [],
  onInsertText,
  onInsertDiagram,
  enhanceMode = false,
  initialDiagramCode = '',
  initialTemplatePrompt = '',
  defaultTab = 'text',
}: UnifiedAIModalProps) {
  // Active tab
  const [activeTab, setActiveTab] = useState<'text' | 'diagrams'>(defaultTab);
  
  // Common state
  const [prompt, setPrompt] = useState('');
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [filePickerPosition, setFilePickerPosition] = useState({ top: 0, left: 0 });
  
  // Diagram-specific state
  const [selectedDiagramType, setSelectedDiagramType] = useState('flowchart');
  const [includeDocContext, setIncludeDocContext] = useState(true);
  const [generatedDiagramCode, setGeneratedDiagramCode] = useState('');
  const [diagramPreview, setDiagramPreview] = useState('');
  const [diagramError, setDiagramError] = useState('');
  const [showDiagramCode, setShowDiagramCode] = useState(false);

  // Word count
  const wordCount = selectedText 
    ? selectedText.split(/\s+/).filter(Boolean).length 
    : documentContent.split(/\s+/).filter(Boolean).length;

  // Initialize diagram enhance mode
  useEffect(() => {
    if (open && enhanceMode && initialDiagramCode) {
      setActiveTab('diagrams');
      setGeneratedDiagramCode(initialDiagramCode);
      if (initialTemplatePrompt) {
        setPrompt(initialTemplatePrompt);
      }
      renderDiagram(initialDiagramCode);
    }
  }, [open, enhanceMode, initialDiagramCode, initialTemplatePrompt]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setPrompt('');
      setGeneratedDiagramCode('');
      setDiagramPreview('');
      setDiagramError('');
      setShowDiagramCode(false);
      setIsGenerating(false);
    }
  }, [open]);

  // Auto-generate diagram prompt based on document content
  const getAutoDiagramPrompt = () => {
    if (!documentContent.trim()) return '';

    const lowerContent = documentContent.toLowerCase();
    const isTechnical = /api|database|server|client|function|class|method|variable/.test(lowerContent);
    const isBusiness = /customer|product|service|market|sales|revenue|profit|strategy/.test(lowerContent);
    const isProcess = /process|workflow|step|stage|phase|milestone|procedure/.test(lowerContent);

    if (selectedDiagramType === 'flowchart' && isProcess) {
      return 'Create a flowchart showing the workflow described in the document';
    } else if (selectedDiagramType === 'sequence' && isTechnical) {
      return 'Create a sequence diagram showing the system interactions';
    } else if (selectedDiagramType === 'class' && isTechnical) {
      return 'Create a class diagram showing the system architecture';
    } else if (selectedDiagramType === 'mindmap') {
      return 'Create a mindmap organizing the key concepts';
    } else if (selectedDiagramType === 'journey' && isBusiness) {
      return 'Create a user journey map based on the document';
    }

    return `Create a ${selectedDiagramType} diagram based on the document content`;
  };

  // Handle text quick action
  const handleTextAction = (action: typeof TEXT_ACTIONS[0]) => {
    let fullPrompt = action.prompt;
    if (selectedText) {
      fullPrompt += selectedText;
    }
    setPrompt(fullPrompt);
  };

  // Handle @ mention file picker
  const handleAtMention = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '@') {
      const textarea = e.currentTarget;
      const rect = textarea.getBoundingClientRect();
      const cursorPos = textarea.selectionStart;
      
      // Estimate position (rough approximation)
      const lineHeight = 20;
      const lines = textarea.value.substring(0, cursorPos).split('\n').length;
      
      setFilePickerPosition({
        top: rect.top + (lines * lineHeight),
        left: rect.left + 10,
      });
      setShowFilePicker(true);
    } else if (e.key === 'Escape' && showFilePicker) {
      setShowFilePicker(false);
    }
  };

  // Insert file reference
  const insertFileReference = (file: typeof contextFiles[0]) => {
    const fileRef = `@${file.name}`;
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const before = prompt.substring(0, cursorPos);
      const after = prompt.substring(cursorPos);
      setPrompt(before + fileRef + ' ' + after);
      
      // Auto-select this file
      if (!selectedContextIds.includes(file.id)) {
        setSelectedContextIds([...selectedContextIds, file.id]);
      }
    }
    setShowFilePicker(false);
  };

  // Build context string from selected files
  const buildContextString = () => {
    if (selectedContextIds.length === 0) return '';
    
    const selectedFiles = contextFiles.filter(f => selectedContextIds.includes(f.id));
    return selectedFiles
      .map(file => {
        if (file.content) {
          return `\n\n--- Content from ${file.name} ---\n${file.content}\n--- End of ${file.name} ---`;
        }
        return `\n\n[File: ${file.name} - content not available]`;
      })
      .join('\n');
  };

  // Generate text
  const handleGenerateText = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (!aiService.isConfigured()) {
      toast.error('AI service not configured', {
        description: 'Please add your OpenAI API key in settings',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Build context
      const contextText = buildContextString();
      
      // Build full prompt
      const fullPrompt = contextText 
        ? `${contextText}\n\n---\n\nUser Request:\n${prompt}`
        : prompt;

      // Call AI
      const result = await aiService.generateContent(fullPrompt, {
        temperature: 0.7,
        maxTokens: 1000,
      });

      // Decrement guest credits
      decrementGuestCredits();

      // Insert result
      if (onInsertText) {
        onInsertText(result);
      }

      toast.success('Content generated!', {
        description: 'AI has generated your content',
      });

      // Close modal
      onOpenChange(false);
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error('Generation failed', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate diagram
  const handleGenerateDiagram = async () => {
    if (!prompt.trim() && !enhanceMode) {
      toast.error('Please enter a prompt or select a quick action');
      return;
    }

    if (!aiService.isConfigured()) {
      toast.error('AI service not configured', {
        description: 'Please add your OpenAI API key in settings',
      });
      return;
    }

    setIsGenerating(true);
    setDiagramError('');

    try {
      // Build context
      let contextBlock = '';
      if (enhanceMode && initialDiagramCode) {
        contextBlock = `Current diagram code:\n\`\`\`mermaid\n${initialDiagramCode}\n\`\`\`\n\n`;
      }

      let docContext = '';
      if (includeDocContext && documentContent) {
        const contextText = buildContextString();
        docContext = contextText || documentContent.substring(0, 2000);
        docContext = `Document context:\n${docContext}\n\n`;
      }

      // Build full prompt
      const fullPrompt = `${contextBlock}${docContext}REQUEST: ${prompt || getAutoDiagramPrompt()}

CONSTRAINTS:
- Generate ONLY valid Mermaid ${selectedDiagramType} syntax
- No markdown code fences
- No explanations
- Start directly with the diagram code
- Use clear, descriptive labels
- Keep it concise and readable`;

      // Call AI
      const result = await aiService.generateContent(fullPrompt, {
        temperature: 0.7,
        maxTokens: 1500,
      });

      // Clean up result
      let cleanCode = result.trim();
      cleanCode = cleanCode.replace(/```mermaid\n?/g, '');
      cleanCode = cleanCode.replace(/```\n?/g, '');
      cleanCode = cleanCode.trim();

      setGeneratedDiagramCode(cleanCode);

      // Render diagram
      await renderDiagram(cleanCode);

      // Decrement guest credits
      decrementGuestCredits();

      toast.success('Diagram generated!', {
        description: 'Review and insert into your document',
      });
    } catch (error: any) {
      console.error('Diagram generation error:', error);
      setDiagramError(error.message || 'Failed to generate diagram');
      toast.error('Generation failed', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Render Mermaid diagram
  const renderDiagram = async (code: string) => {
    try {
      const id = `mermaid-preview-${Date.now()}`;
      const { svg } = await mermaid.render(id, code);
      setDiagramPreview(svg);
      setDiagramError('');
    } catch (error: any) {
      console.error('Mermaid render error:', error);
      setDiagramError(error.message || 'Invalid diagram syntax');
      setDiagramPreview('');
    }
  };

  // Insert diagram
  const handleInsertDiagram = () => {
    if (!generatedDiagramCode) {
      toast.error('No diagram to insert');
      return;
    }

    if (onInsertDiagram) {
      onInsertDiagram(generatedDiagramCode);
    }

    toast.success('Diagram inserted!');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            {selectedText 
              ? `Working with ${wordCount} selected words`
              : `Based on your document (${wordCount} words)`}
            {contextFiles.length > 0 && ` • ${contextFiles.length} context files available`}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'text' | 'diagrams')} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="diagrams" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Diagrams
            </TabsTrigger>
          </TabsList>

          {/* TEXT TAB */}
          <TabsContent value="text" className="flex-1 flex flex-col mt-4">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {/* AI Warning */}
                {!aiService.isConfigured() && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-yellow-900 dark:text-yellow-100">
                        AI service not configured
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
                        Add your OpenAI API key in the .env file to use AI features.
                      </p>
                    </div>
                  </div>
                )}

                {/* Context Files */}
                {contextFiles.length > 0 && (
                  <div className="border rounded-lg p-3 space-y-2">
                    <button
                      onClick={() => setContextExpanded(!contextExpanded)}
                      className="flex items-center justify-between w-full text-sm font-medium hover:text-primary transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Context Files ({selectedContextIds.length}/{contextFiles.length} selected)
                      </span>
                      {contextExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {contextExpanded && (
                      <div className="space-y-1 pt-2">
                        {contextFiles.map((file) => (
                          <div key={file.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`context-${file.id}`}
                              checked={selectedContextIds.includes(file.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedContextIds([...selectedContextIds, file.id]);
                                } else {
                                  setSelectedContextIds(selectedContextIds.filter(id => id !== file.id));
                                }
                              }}
                            />
                            <label
                              htmlFor={`context-${file.id}`}
                              className="text-xs cursor-pointer hover:text-primary transition-colors"
                            >
                              {file.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Actions */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Quick Actions</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {TEXT_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleTextAction(action)}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all group"
                        title={action.description}
                      >
                        <div className="text-primary group-hover:scale-110 transition-transform">
                          {action.icon}
                        </div>
                        <span className="text-xs font-medium">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Input */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Your prompt {contextFiles.length > 0 && '(use @ to mention files)'}
                  </Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleAtMention}
                    placeholder={selectedText ? "What would you like to do with the selected text?" : "What would you like AI to write?"}
                    className="min-h-[120px] resize-none"
                  />

                  {/* File Picker Dropdown */}
                  {showFilePicker && contextFiles.length > 0 && (
                    <div 
                      className="absolute z-50 bg-popover border rounded-lg shadow-lg p-2 max-h-48 overflow-auto"
                      style={{ top: filePickerPosition.top, left: filePickerPosition.left }}
                    >
                      {contextFiles.map((file) => (
                        <button
                          key={file.id}
                          onClick={() => insertFileReference(file)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors text-left"
                        >
                          <AtSign className="w-3 h-3" />
                          {file.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <div className="text-xs text-muted-foreground">
                {getGuestCredits().remaining} AI credits remaining
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerateText}
                  disabled={isGenerating || !prompt.trim()}
                  className="gradient-primary text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* DIAGRAMS TAB */}
          <TabsContent value="diagrams" className="flex-1 flex flex-col mt-4">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {/* AI Warning */}
                {!aiService.isConfigured() && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-yellow-900 dark:text-yellow-100">
                        AI service not configured
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
                        Add your OpenAI API key in the .env file to use AI features.
                      </p>
                    </div>
                  </div>
                )}

                {/* Context Files */}
                {contextFiles.length > 0 && (
                  <div className="border rounded-lg p-3 space-y-2">
                    <button
                      onClick={() => setContextExpanded(!contextExpanded)}
                      className="flex items-center justify-between w-full text-sm font-medium hover:text-primary transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Context Files ({selectedContextIds.length}/{contextFiles.length} selected)
                      </span>
                      {contextExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {contextExpanded && (
                      <div className="space-y-1 pt-2">
                        {contextFiles.map((file) => (
                          <div key={file.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`diagram-context-${file.id}`}
                              checked={selectedContextIds.includes(file.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedContextIds([...selectedContextIds, file.id]);
                                } else {
                                  setSelectedContextIds(selectedContextIds.filter(id => id !== file.id));
                                }
                              }}
                            />
                            <label
                              htmlFor={`diagram-context-${file.id}`}
                              className="text-xs cursor-pointer hover:text-primary transition-colors"
                            >
                              {file.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Diagram Type Selector */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Diagram Type</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {DIAGRAM_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setSelectedDiagramType(type.id)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                            selectedDiagramType === type.id
                              ? 'border-primary bg-primary/10'
                              : 'hover:border-primary hover:bg-primary/5'
                          }`}
                          title={type.description}
                        >
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="text-xs font-medium">{type.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Include Document Context */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-doc-context"
                    checked={includeDocContext}
                    onCheckedChange={(checked) => setIncludeDocContext(!!checked)}
                  />
                  <label htmlFor="include-doc-context" className="text-sm cursor-pointer">
                    Include document context in generation
                  </label>
                </div>

                {/* Prompt Input */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Describe your diagram {contextFiles.length > 0 && '(use @ to mention files)'}
                  </Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleAtMention}
                    placeholder={enhanceMode ? "How would you like to improve this diagram?" : getAutoDiagramPrompt() || "Describe the diagram you want to create..."}
                    className="min-h-[100px] resize-none"
                  />

                  {/* File Picker Dropdown */}
                  {showFilePicker && contextFiles.length > 0 && (
                    <div 
                      className="absolute z-50 bg-popover border rounded-lg shadow-lg p-2 max-h-48 overflow-auto"
                      style={{ top: filePickerPosition.top, left: filePickerPosition.left }}
                    >
                      {contextFiles.map((file) => (
                        <button
                          key={file.id}
                          onClick={() => insertFileReference(file)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors text-left"
                        >
                          <AtSign className="w-3 h-3" />
                          {file.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Diagram Preview */}
                {generatedDiagramCode && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Preview</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowDiagramCode(!showDiagramCode)}
                      >
                        {showDiagramCode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {showDiagramCode ? 'Hide' : 'Show'} Code
                      </Button>
                    </div>

                    {diagramError ? (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-xs text-red-600 dark:text-red-400">{diagramError}</p>
                      </div>
                    ) : diagramPreview ? (
                      <div 
                        className="bg-white dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-64"
                        dangerouslySetInnerHTML={{ __html: diagramPreview }}
                      />
                    ) : null}

                    {showDiagramCode && (
                      <pre className="bg-muted rounded-lg p-3 text-xs overflow-auto max-h-48">
                        <code>{generatedDiagramCode}</code>
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <div className="text-xs text-muted-foreground">
                {getGuestCredits().remaining} AI credits remaining
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                {generatedDiagramCode ? (
                  <Button 
                    onClick={handleInsertDiagram}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Insert Diagram
                  </Button>
                ) : (
                  <Button 
                    onClick={handleGenerateDiagram}
                    disabled={isGenerating}
                    className="gradient-primary text-white"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Diagram
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

