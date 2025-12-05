/**
 * Smart AI Modal - General-purpose AI assistant
 * Replaces the diagram-focused AIAssistantModal with a more versatile interface
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { aiService } from '@/services/ai/AIService';
import { 
  Sparkles, 
  PenLine, 
  FileText, 
  ListChecks, 
  Lightbulb,
  Wand2,
  FileCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  AtSign,
} from 'lucide-react';

interface SmartAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentContent?: string;
  selectedText?: string;
  contextFiles?: Array<{ id: string; name: string; content?: string }>;
  onGenerate?: (result: string) => void;
}

type QuickAction = {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  description: string;
};

const QUICK_ACTIONS: QuickAction[] = [
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

export function SmartAIModal({
  open,
  onOpenChange,
  documentContent = '',
  selectedText = '',
  contextFiles = [],
  onGenerate,
}: SmartAIModalProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [filePickerPosition, setFilePickerPosition] = useState({ top: 0, left: 0 });

  const wordCount = selectedText ? selectedText.split(/\s+/).filter(Boolean).length : 
                    documentContent.split(/\s+/).filter(Boolean).length;

  const handleQuickAction = (action: QuickAction) => {
    let fullPrompt = action.prompt;
    
    // If there's selected text, append it
    if (selectedText) {
      fullPrompt += selectedText;
    }
    
    setPrompt(fullPrompt);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    // Check if AI is configured
    if (!aiService.isConfigured()) {
      toast.error('AI service not configured', {
        description: 'Please add your OpenAI API key in settings',
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Build context from selected files
      let contextText = '';
      if (selectedContextIds.length > 0) {
        const selectedFiles = contextFiles.filter(f => selectedContextIds.includes(f.id));
        contextText = selectedFiles
          .map(file => {
            if (file.content) {
              return `\n\n--- Content from ${file.name} ---\n${file.content}\n--- End of ${file.name} ---`;
            }
            return `\n\n[File: ${file.name} - content not available]`;
          })
          .join('\n');
      }
      
      // Build full prompt with context
      const fullPrompt = contextText 
        ? `${prompt}\n\n**Reference Materials:**${contextText}`
        : prompt;
      
      // Generate with AI
      const result = await aiService.generateContent(fullPrompt, {
        temperature: 0.7,
        maxTokens: 2000,
      });
      
      // Call the callback with result
      if (onGenerate) {
        onGenerate(result);
      }
      
      toast.success('Content generated!', {
        description: 'AI response is ready',
      });
      
      // Close modal
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate', {
        description: error.message || 'Unknown error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleContextFile = (fileId: string) => {
    setSelectedContextIds(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPrompt(value);

    // Check for @ mention
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex >= 0 && (lastAtIndex === 0 || /\s/.test(value[lastAtIndex - 1]))) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ') && contextFiles.length > 0) {
        setShowFilePicker(true);
        // Position picker near cursor (simplified)
        const rect = e.target.getBoundingClientRect();
        setFilePickerPosition({ top: rect.top - 200, left: rect.left + 20 });
      } else {
        setShowFilePicker(false);
      }
    } else {
      setShowFilePicker(false);
    }
  };

  const insertFileReference = (file: { id: string; name: string }) => {
    // Find last @ and replace with file reference
    const lastAtIndex = prompt.lastIndexOf('@');
    if (lastAtIndex >= 0) {
      const before = prompt.substring(0, lastAtIndex);
      const after = prompt.substring(lastAtIndex + 1).replace(/^\S*/, '');
      setPrompt(`${before}@${file.name}${after}`);
      
      // Auto-select the file in context
      if (!selectedContextIds.includes(file.id)) {
        toggleContextFile(file.id);
      }
    }
    setShowFilePicker(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            {selectedText 
              ? `Working with ${wordCount} selected words`
              : `Based on your document (${wordCount} words)`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-4 pr-4">
            {/* Warning if AI not configured */}
            {!aiService.isConfigured() && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-yellow-900 dark:text-yellow-100">
                    AI service not configured
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
                    Add your OpenAI API key in the .env file to use AI features. Check AI_SETUP.md for instructions.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <label className="text-sm font-medium mb-2 block">Quick Actions</label>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map(action => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-2 px-3"
                    onClick={() => handleQuickAction(action)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      {action.icon}
                      <div className="flex-1 text-left">
                        <div className="font-medium text-xs">{action.label}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="relative">
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                Your Prompt
                {contextFiles.length > 0 && (
                  <span className="text-xs text-muted-foreground font-normal flex items-center gap-1">
                    <AtSign className="w-3 h-3" />
                    Type @ to reference files
                  </span>
                )}
              </label>
              <Textarea
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="What would you like me to do? Be specific for better results..."
                className="min-h-[120px] resize-none"
              />
              
              {/* @ Mention File Picker */}
              {showFilePicker && (
                <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
                  <div className="p-2 space-y-1">
                    {contextFiles.map(file => (
                      <button
                        key={file.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded flex items-center gap-2"
                        onClick={() => insertFileReference(file)}
                      >
                        <FileCheck className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate flex-1">{file.name}</span>
                        {file.content && (
                          <span className="text-xs text-muted-foreground">
                            {Math.round(file.content.length / 100) / 10}KB
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Context Files (Collapsible) */}
            {contextFiles.length > 0 && (
              <div className="border border-border rounded-lg">
                <button
                  onClick={() => setContextExpanded(!contextExpanded)}
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg"
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Context Files ({selectedContextIds.length} of {contextFiles.length} selected)
                    </span>
                  </div>
                  {contextExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                {contextExpanded && (
                  <div className="border-t border-border p-3">
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {contextFiles.map(file => (
                        <div key={file.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                          <Checkbox
                            checked={selectedContextIds.includes(file.id)}
                            onCheckedChange={() => toggleContextFile(file.id)}
                          />
                          <span className="text-sm truncate flex-1">{file.name}</span>
                          {file.content && (
                            <span className="text-xs text-muted-foreground">
                              {Math.round(file.content.length / 100) / 10}KB
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Selected files will be used as reference for AI generation
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Smart Suggestion */}
            {!prompt && selectedText && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                  💡 Smart suggestion:
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  "Improve and polish this text, making it more professional and clear."
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-7 text-xs"
                  onClick={() => handleQuickAction(QUICK_ACTIONS[1])}
                >
                  Use suggestion
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            {isGenerating ? 'Generating...' : 'Press Ctrl+Enter to generate'}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
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
      </DialogContent>
    </Dialog>
  );
}
