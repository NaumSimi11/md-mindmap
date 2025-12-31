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
  MessageSquare,
  List,
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
    prompt: 'Brainstorm creative ideas and angles based on this context:\n\n',
    description: 'Get fresh perspectives',
  },
  {
    id: 'counter-arguments',
    label: 'Counter-arguments',
    icon: <MessageSquare className="w-4 h-4" />,
    prompt: 'Analyze the text and provide strong counter-arguments or alternative viewpoints:\n\n',
    description: 'Challenge the ideas',
  },
  {
    id: 'examples',
    label: 'Give Examples',
    icon: <List className="w-4 h-4" />,
    prompt: 'Provide concrete examples and analogies to illustrate the concepts in this text:\n\n',
    description: 'Make it concrete',
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
  const [isRenderingDiagram, setIsRenderingDiagram] = useState(false);

  // Regenerate functionality
  const [lastPrompt, setLastPrompt] = useState('');
  const [lastResult, setLastResult] = useState('');
  const [lastAction, setLastAction] = useState<'text' | 'diagram' | null>(null);

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

  // Handle text quick action - NOW AUTO-GENERATES!
  const handleTextAction = async (action: typeof TEXT_ACTIONS[0]) => {
    let fullPrompt = action.prompt;
    if (selectedText) {
      fullPrompt += selectedText;
    }
    setPrompt(fullPrompt);
    setLastPrompt(fullPrompt);
    setLastAction('text');

    // AUTO-GENERATE immediately!
    await handleGenerateText(fullPrompt);
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
  const handleGenerateText = async (customPrompt?: string) => {
    const promptToUse = customPrompt || prompt;

    if (!promptToUse.trim()) {
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
        ? `${contextText}\n\n---\n\nUser Request:\n${promptToUse}`
        : promptToUse;

      // Call AI
      const result = await aiService.generateContent(fullPrompt, {
        temperature: 0.7,
        maxTokens: 1000,
      });

      // Decrement guest credits
      decrementGuestCredits();

      // Save for regeneration
      setLastPrompt(promptToUse);
      setLastResult(result);
      setLastAction('text');

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
    setIsRenderingDiagram(true);
    try {
      // Use setTimeout to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 100));

      const id = `mermaid-preview-${Date.now()}`;
      const { svg } = await mermaid.render(id, code);
      setDiagramPreview(svg);
      setDiagramError('');
    } catch (error: any) {
      console.error('Mermaid render error:', error);
      setDiagramError(error.message || 'Invalid diagram syntax');
      setDiagramPreview('');
    } finally {
      setIsRenderingDiagram(false);
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

  // Regenerate last action
  const handleRegenerate = async () => {
    if (lastAction === 'text') {
      await handleGenerateText(lastPrompt);
    } else if (lastAction === 'diagram') {
      await handleGenerateDiagram();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-3xl max-h-[85vh] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl rounded-2xl overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 p-4 pb-3 border-b border-slate-200/50 dark:border-slate-700/50">
          <DialogTitle className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-white">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            AI Assistant
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {selectedText
              ? `Working with ${wordCount} selected words`
              : `Based on your document (${wordCount} words)`}
            {contextFiles.length > 0 && ` • ${contextFiles.length} context files available`}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'text' | 'diagrams')} className="flex-1 flex flex-col min-h-0 px-4 pt-3 overflow-hidden">
          {/* Tabs container with connected background */}
          <div className="flex-shrink-0 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-1 mb-3">
            <TabsList className="grid w-full grid-cols-2 bg-transparent">
              <TabsTrigger 
                value="text" 
                className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:dark:bg-slate-900 data-[state=active]:shadow-md data-[state=active]:text-violet-600 data-[state=active]:dark:text-violet-400 data-[state=inactive]:text-slate-500 data-[state=inactive]:dark:text-slate-400 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:dark:hover:text-slate-300"
              >
                <PenLine className="w-4 h-4" />
                Text
              </TabsTrigger>
              <TabsTrigger 
                value="diagrams" 
                className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:dark:bg-slate-900 data-[state=active]:shadow-md data-[state=active]:text-cyan-600 data-[state=active]:dark:text-cyan-400 data-[state=inactive]:text-slate-500 data-[state=inactive]:dark:text-slate-400 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:dark:hover:text-slate-300"
              >
                <Workflow className="w-4 h-4" />
                Diagrams
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TEXT TAB */}
          <TabsContent value="text" className="flex-1 flex flex-col min-h-0 overflow-hidden m-0">
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-4 pr-3">
                {/* AI Warning */}
                {!aiService.isConfigured() && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/60 dark:border-amber-700/40 rounded-xl p-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        AI service not configured
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
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

                {/* Quick Actions - Horizontal scroll */}
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Quick Actions</Label>
                  <div className="overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1">
                    <div className="flex gap-3">
                      {TEXT_ACTIONS.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleTextAction(action)}
                          className="flex-shrink-0 w-24 flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:shadow-md transition-all group"
                          title={action.description}
                        >
                          <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                            {action.icon}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Prompt Input */}
                <div className="relative">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                    Your prompt {contextFiles.length > 0 && '(use @ to mention files)'}
                  </Label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleAtMention}
                    placeholder={selectedText ? "What would you like to do with the selected text?" : "What would you like AI to write?"}
                    className="w-full min-h-[80px] resize-none border border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-400 rounded-xl text-sm bg-white dark:bg-slate-800/50 p-3 focus:outline-none"
                  />

                  {/* File Picker Dropdown */}
                  {showFilePicker && contextFiles.length > 0 && (
                    <div
                      className="absolute z-50 bg-popover border rounded-lg shadow-lg p-2 max-h-48 overflow-auto top-full left-0 mt-1"
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

            {/* Actions - Fixed at bottom */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-t border-slate-200/60 dark:border-slate-700/60 mt-3 bg-white/80 dark:bg-slate-900/80">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {getGuestCredits().remaining} credits
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleGenerateText()}
                  disabled={isGenerating || !prompt.trim()}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25 border-0"
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
          <TabsContent value="diagrams" className="flex-1 flex flex-col min-h-0 overflow-hidden m-0">
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-4 pr-3">
                {/* AI Warning */}
                {!aiService.isConfigured() && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/60 dark:border-amber-700/40 rounded-xl p-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        AI service not configured
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
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

                {/* Diagram Type Selector - Horizontal scroll */}
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Diagram Type</Label>
                  <div className="overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1">
                    <div className="flex gap-3">
                      {DIAGRAM_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            onClick={() => setSelectedDiagramType(type.id)}
                            className={`flex-shrink-0 w-24 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${selectedDiagramType === type.id
                              ? 'border-cyan-400 dark:border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 shadow-md'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-cyan-400 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/30'
                              }`}
                            title={type.description}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedDiagramType === type.id ? 'bg-cyan-100 dark:bg-cyan-900/50' : 'bg-slate-100 dark:bg-slate-700/50'}`}>
                              <Icon className={`w-5 h-5 ${selectedDiagramType === type.id ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`} />
                            </div>
                            <span className={`text-[11px] font-semibold text-center leading-tight ${selectedDiagramType === type.id ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-300'}`}>{type.title}</span>
                          </button>
                        );
                      })}
                    </div>
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
                <div className="relative">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                    Describe your diagram {contextFiles.length > 0 && '(use @ to mention files)'}
                  </Label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleAtMention}
                    placeholder={enhanceMode ? "How would you like to improve this diagram?" : getAutoDiagramPrompt() || "Describe the diagram you want to create..."}
                    className="w-full min-h-[70px] resize-none border border-slate-200 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 rounded-xl text-sm bg-white dark:bg-slate-800/50 p-3 focus:outline-none"
                  />

                  {/* File Picker Dropdown */}
                  {showFilePicker && contextFiles.length > 0 && (
                    <div
                      className="absolute z-50 bg-popover border rounded-lg shadow-lg p-2 max-h-48 overflow-auto top-full left-0 mt-1"
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
                    ) : isRenderingDiagram ? (
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center min-h-[200px]">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Rendering diagram...</p>
                        </div>
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

            {/* Actions - Fixed at bottom */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-t border-slate-200/60 dark:border-slate-700/60 mt-3 bg-white/80 dark:bg-slate-900/80">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {getGuestCredits().remaining} credits
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  Cancel
                </Button>
                {generatedDiagramCode ? (
                  <Button
                    size="sm"
                    onClick={handleInsertDiagram}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 border-0"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Insert
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleGenerateDiagram}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 border-0"
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
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

