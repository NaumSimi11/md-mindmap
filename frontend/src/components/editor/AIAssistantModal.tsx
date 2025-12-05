/**
 * AI Assistant Modal for Diagram Generation
 * Helps users create and refine diagrams with AI
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, Info, Zap, AlertCircle } from 'lucide-react';
import { aiService } from '@/services/ai/AIService';

interface AIContext {
  selectedText?: string;
  currentCode?: string;
  diagramType: string;
  hasExistingCode: boolean;
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: AIContext;
  onGenerate: (code: string) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  context,
  onGenerate,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick action templates based on diagram type
  const getQuickActions = () => {
    if (context.selectedText) {
      return [
        { label: `Generate ${context.diagramType} from selected text`, value: 'from-text' },
        { label: 'Extract process steps as diagram', value: 'extract-steps' },
        { label: 'Convert to visual workflow', value: 'visual-workflow' },
        { label: 'Create structure diagram', value: 'structure' },
      ];
    }

    if (context.hasExistingCode) {
      const isMindmap = context.diagramType.toLowerCase().includes('mindmap');
      return [
        { label: 'Improve this diagram', value: 'improve' },
        { label: 'Add more detail', value: 'add-detail' },
        { label: isMindmap ? 'Simplify (reduce nodes)' : 'Simplify structure', value: 'simplify' },
        { label: 'Fix syntax errors', value: 'fix-errors' },
        { label: isMindmap ? 'Make more concise' : 'Change diagram layout', value: 'change-layout' },
      ];
    }

    // Default quick starts by diagram type
    const quickStartsByType: Record<string, Array<{ label: string; value: string }>> = {
      'flowchart': [
        { label: 'Simple login flow', value: 'qs-login' },
        { label: 'User registration process', value: 'qs-registration' },
        { label: 'Decision making flow', value: 'qs-decision' },
        { label: 'Error handling workflow', value: 'qs-error' },
      ],
      'sequence': [
        { label: 'Login authentication', value: 'qs-auth' },
        { label: 'API request/response', value: 'qs-api' },
        { label: 'Payment processing', value: 'qs-payment' },
        { label: 'Data synchronization', value: 'qs-sync' },
      ],
      'class': [
        { label: 'Simple inheritance', value: 'qs-inheritance' },
        { label: 'Interface implementation', value: 'qs-interface' },
        { label: 'Composition pattern', value: 'qs-composition' },
        { label: 'MVC structure', value: 'qs-mvc' },
      ],
      'er': [
        { label: 'User & Orders', value: 'qs-user-orders' },
        { label: 'Blog system', value: 'qs-blog' },
        { label: 'E-commerce database', value: 'qs-ecommerce' },
        { label: 'Social network', value: 'qs-social' },
      ],
      'state': [
        { label: 'Order lifecycle', value: 'qs-order-state' },
        { label: 'User session states', value: 'qs-session' },
        { label: 'Document workflow', value: 'qs-document' },
        { label: 'Connection states', value: 'qs-connection' },
      ],
    };

    return quickStartsByType[context.diagramType.toLowerCase()] || [
      { label: 'Simple example', value: 'qs-simple' },
      { label: 'Detailed example', value: 'qs-detailed' },
    ];
  };

  const quickActions = getQuickActions();

  const handleQuickAction = async (actionValue: string) => {
    setIsGenerating(true);

    // Build prompt based on action
    let generatedPrompt = '';
    const isMindmap = context.diagramType.toLowerCase().includes('mindmap');

    if (actionValue === 'from-text') {
      generatedPrompt = `Create a ${context.diagramType} diagram from this text:\n\n${context.selectedText}`;
      if (isMindmap) {
        generatedPrompt += `\n\nKeep it concise - focus on main topics only (3-4 levels deep, max 5 branches per node).`;
      }
    } else if (actionValue === 'improve') {
      generatedPrompt = `Improve this ${context.diagramType} diagram by making it clearer and more detailed:\n\n${context.currentCode}`;
    } else if (actionValue === 'simplify') {
      if (isMindmap) {
        generatedPrompt = `Simplify this mindmap - reduce to ONLY the most important nodes (max 3 levels deep, 3-5 branches per node). Focus on main concepts:\n\n${context.currentCode}`;
      } else {
        generatedPrompt = `Simplify this ${context.diagramType} diagram - reduce complexity while keeping key information:\n\n${context.currentCode}`;
      }
    } else if (actionValue === 'change-layout') {
      if (isMindmap) {
        generatedPrompt = `Make this mindmap more concise - consolidate similar nodes and reduce total count:\n\n${context.currentCode}`;
      } else {
        generatedPrompt = `Reorganize this ${context.diagramType} diagram with a different layout:\n\n${context.currentCode}`;
      }
    } else if (actionValue.startsWith('qs-')) {
      // Quick start templates
      const action = quickActions.find(a => a.value === actionValue);
      generatedPrompt = `Create a ${context.diagramType} diagram for: ${action?.label}`;
    } else {
      generatedPrompt = prompt || `Create a ${context.diagramType} diagram`;
    }

    await generateDiagram(generatedPrompt);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    let fullPrompt = prompt;
    const isMindmap = context.diagramType.toLowerCase().includes('mindmap');

    if (context.selectedText) {
      fullPrompt = `${prompt}\n\nBased on this text:\n${context.selectedText}`;
      if (isMindmap) {
        fullPrompt += `\n\nIMPORTANT: Keep the mindmap concise - max 3-4 levels deep, 3-5 branches per node. Focus on main concepts only.`;
      }
    }

    if (context.hasExistingCode) {
      fullPrompt = `${prompt}\n\nModify this existing diagram:\n${context.currentCode}`;
    }

    await generateDiagram(fullPrompt);
  };

  const generateDiagram = async (userPrompt: string) => {
    setError(null);
    
    try {
      // Build system prompt for diagram generation
      const diagramType = context.diagramType.toLowerCase();
      const isMindmap = diagramType.includes('mindmap');
      
      const systemPrompt = `You are a Mermaid diagram expert. Generate ONLY valid Mermaid ${context.diagramType} diagram code.
${context.selectedText ? `\nBased on this text:\n${context.selectedText}\n` : ''}
${context.hasExistingCode ? `\nModify this existing diagram:\n${context.currentCode}\n` : ''}

Rules:
- Return ONLY Mermaid code, no explanations or markdown fences
- Ensure proper ${context.diagramType} syntax
- Make it clear and well-structured
- Use meaningful labels
${isMindmap ? `- IMPORTANT: For mindmaps, limit to 3-4 levels deep and 3-5 branches per node maximum
- Keep it concise and readable - quality over quantity
- Focus on main concepts, not every detail` : ''}`;

      // Call real AI service
      const result = await aiService.generateContent(userPrompt, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 500,
      });

      // Extract mermaid code (remove markdown fences if present)
      let cleanCode = result.trim();
      if (cleanCode.startsWith('```')) {
        cleanCode = cleanCode.replace(/^```(?:mermaid)?\n?/, '').replace(/\n?```$/, '').trim();
      }

      onGenerate(cleanCode);
      onClose();
    } catch (error: any) {
      console.error('AI generation error:', error);
      
      // Handle specific error types
      if (error.message?.includes('Rate limit')) {
        setError('Rate limit exceeded. Please wait a moment and try again.');
      } else if (error.message?.includes('API key')) {
        setError('AI service not configured. Please check your API key.');
      } else if (error.message?.includes('timeout')) {
        setError('Request timed out. Please try again.');
      } else {
        setError(error.message || 'Failed to generate diagram. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <DialogTitle>AI Diagram Assistant</DialogTitle>
          </div>
          {context.hasExistingCode ? (
            <p className="text-sm text-muted-foreground mt-1">
              Refine your {context.diagramType} diagram
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              Create a {context.diagramType} diagram with AI
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[calc(80vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Error Display */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    Generation Failed
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Selected Text Notice */}
            {context.selectedText && (
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Using selected text as context
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    "{context.selectedText.slice(0, 100)}{context.selectedText.length > 100 ? '...' : ''}"
                  </p>
                  {context.diagramType.toLowerCase().includes('mindmap') && context.selectedText.length > 500 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Long text detected - AI will focus on main concepts only
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-yellow-500" />
                <h3 className="font-semibold text-sm">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.value}
                    onClick={() => handleQuickAction(action.value)}
                    disabled={isGenerating}
                    variant="outline"
                    className="justify-start h-auto py-3 px-4 text-left"
                  >
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            <div>
              <label className="block text-sm font-medium mb-2">
                ✍️ Or describe what you want
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  context.hasExistingCode
                    ? "Example: Add 3 validation steps between login and dashboard"
                    : "Example: Create a user authentication flow with error handling"
                }
                className="min-h-[100px] resize-none"
                disabled={isGenerating}
              />
            </div>

            {/* Example prompts */}
            {!context.hasExistingCode && (
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">💡 Tip: Be specific for better results</p>
                <p>"User logs in → System verifies → Send token → Access dashboard"</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <Button onClick={onClose} variant="ghost" disabled={isGenerating}>
            Cancel
          </Button>

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="min-w-[140px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {context.hasExistingCode ? 'Apply Changes' : 'Generate Diagram'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

