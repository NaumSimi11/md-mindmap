/**
 * AI Sidebar Chat - With Autonomous Agent Support
 * 
 * Features:
 * - Compact header (minimal space usage)
 * - Natural markdown rendering
 * - Inline preview in message flow
 * - Keyboard shortcuts (Enter to apply, Esc to cancel)
 * - Autonomous agent mode for creating folders/documents
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Settings,
  Key,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  XCircle,
  Zap,
  Bot,
  FolderPlus,
  Play,
  Square,
} from 'lucide-react';
import { ModelPicker } from './ModelPicker';
import { AISettingsPanel } from './AISettingsPanel';
import { AIPreferencesPanel } from './AIPreferencesPanel';
import { APIKeyManager } from './APIKeyManager';
import { AIThinkingAnimation } from './AIThinkingAnimation';
import { ChatMarkdownRenderer, TypingIndicator } from './ChatMarkdownRenderer';
import { useAIChat, ChatMessage } from '@/hooks/useAIChat';
import { useAgentChat } from '@/hooks/useAgentChat';
import { cn } from '@/lib/utils';
import { Plan } from '@/services/ai/AgentTools';
import { AgentProgress } from '@/services/ai/AgentService';

interface AISidebarChatProps {
  editor: Editor | null;
  documentContent: string;
  documentTitle?: string;
  workspaceId: string;
  isOpen: boolean;
  onToggle: () => void;
  onDocumentCreated?: () => void; // Callback when agent creates documents
}

/**
 * Agent Progress Panel - Shows autonomous operation status
 */
const AgentProgressPanel: React.FC<{
  progress: AgentProgress;
  plan: Plan | null;
  onExecute: () => void;
  onCancel: () => void;
  isExecuting: boolean;
}> = ({ progress, plan, onExecute, onCancel, isExecuting }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="border-b border-border bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-medium">
            {progress.agent === 'planner' ? 'Planning' : 
             progress.agent === 'organizer' ? 'Creating' : 'Working'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {progress.progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
        <div 
          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
          style={{ width: `${progress.progress}%` }}
        />
      </div>

      {/* Status Message */}
      <p className="text-xs text-muted-foreground mb-2">
        {progress.message || 'Processing...'}
      </p>

      {/* Steps */}
      {progress.steps.length > 0 && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
        >
          {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {progress.steps.filter(s => s.status === 'done').length}/{progress.steps.length} steps
        </button>
      )}

      {showDetails && (
        <div className="space-y-1 mb-2">
          {progress.steps.map((step) => (
            <div key={step.id} className="flex items-center gap-2 text-xs">
              {step.status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-violet-500" />}
              {step.status === 'done' && <Check className="w-3 h-3 text-green-500" />}
              {step.status === 'failed' && <XCircle className="w-3 h-3 text-red-500" />}
              {step.status === 'pending' && <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />}
              <span className={cn(
                step.status === 'done' && 'text-muted-foreground line-through',
                step.status === 'failed' && 'text-red-500',
              )}>
                {step.description}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Plan Preview (when plan is ready) */}
      {plan && progress.status === 'complete' && progress.agent === 'planner' && (
        <div className="mt-3 p-2 bg-background/50 rounded border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Plan Ready: {plan.title}</span>
            <span className="text-[10px] text-muted-foreground">
              {plan.items.length} items
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-violet-600 hover:bg-violet-700"
              onClick={onExecute}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Play className="w-3 h-3 mr-1" />
              )}
              Execute
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Error State */}
      {progress.status === 'error' && (
        <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/30 text-xs text-red-500">
          {progress.error || 'An error occurred'}
        </div>
      )}
    </div>
  );
};

/**
 * Inline Preview Component (for message flow)
 */
const InlinePreview: React.FC<{
  content: string;
  description: string;
  sectionCount: number;
  wordCount: number;
  onAccept: () => void;
  onReject: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ content, description, sectionCount, wordCount, onAccept, onReject, isExpanded, onToggleExpand }) => {
  return (
    <div className="rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between p-2.5 bg-primary/10 hover:bg-primary/15 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Preview</span>
          <span className="text-[10px] text-muted-foreground">
            {description}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{wordCount} words</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          <div className="max-h-60 overflow-y-auto rounded bg-background/50 p-3 border border-border/50">
            <ChatMarkdownRenderer content={content} />
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={onAccept}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Apply
            </Button>
            <Button
              onClick={onReject}
              size="sm"
              variant="destructive"
              className="flex-1"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Single Message Component
 */
const MessageBubble: React.FC<{
  message: ChatMessage;
  onAccept?: () => void;
  onReject?: () => void;
  isPreviewExpanded: boolean;
  onTogglePreview: () => void;
  stagedContent?: any;
}> = ({ message, onAccept, onReject, isPreviewExpanded, onTogglePreview, stagedContent }) => {
  const isUser = message.role === 'user';
  const isThinking = message.isThinking;
  const isStreaming = message.isStreaming;

  // Show thinking animation
  if (isThinking) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%]">
          <AIThinkingAnimation phase={message.thinkingPhase} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        {/* User message - plain text */}
        {isUser && (
          <p className="text-sm">{message.content}</p>
        )}

        {/* Assistant message - markdown rendered */}
        {!isUser && message.content && (
          <ChatMarkdownRenderer 
            content={message.content} 
            isStreaming={isStreaming}
          />
        )}

        {/* Streaming indicator */}
        {isStreaming && !message.content && (
          <TypingIndicator />
        )}

        {/* Function call status */}
        {message.functionCall && (
          <div className="mt-2 pt-2 border-t border-border/30">
            {message.functionCall.status === 'pending' && !message.functionCall.requiresConfirmation && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{message.functionCall.friendlyDescription || 'Applying changes...'}</span>
              </div>
            )}
            {message.functionCall.status === 'success' && (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                <Check className="h-3 w-3" />
                <span>{message.functionCall.friendlyDescription || 'Changes applied!'}</span>
              </div>
            )}
            {message.functionCall.status === 'error' && (
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <XCircle className="h-3 w-3" />
                <span>{message.functionCall.result?.message || 'Failed to apply changes'}</span>
              </div>
            )}
          </div>
        )}

        {/* Inline Preview for staged content */}
        {message.functionCall?.requiresConfirmation && stagedContent && (
          <div className="mt-3">
            <InlinePreview
              content={stagedContent.generatedContent}
              description={stagedContent.description}
              sectionCount={stagedContent.sectionCount || 0}
              wordCount={stagedContent.wordCount || 0}
              onAccept={onAccept!}
              onReject={onReject!}
              isExpanded={isPreviewExpanded}
              onToggleExpand={onTogglePreview}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export const AISidebarChat: React.FC<AISidebarChatProps> = ({
  editor,
  documentContent,
  documentTitle = 'Document',
  workspaceId,
  isOpen,
  onToggle,
  onDocumentCreated,
}) => {
  // Regular chat hook
  const {
    messages,
    isGenerating,
    sendMessage,
    preferences,
    updatePreferences,
    acceptStaged,
    modifyStaged,
    rejectStaged,
    currentStaged,
    isPreviewExpanded,
    setPreviewExpanded,
    addMessage,
  } = useAIChat({ editor, documentContent, documentTitle });

  // Agent hook with refresh callback
  const {
    progress: agentProgress,
    isRunning: isAgentRunning,
    currentPlan,
    workspaceContext,
    runPlanner,
    confirmPlan,
    rejectPlan,
    isAgentRequest,
    getAgentType,
    cancel: cancelAgent,
  } = useAgentChat({ 
    workspaceId,
    onRefresh: onDocumentCreated,
  });

  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showAPIKeys, setShowAPIKeys] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('gemini-1.5-flash');
  const [isExecutingPlan, setIsExecutingPlan] = useState(false);
  
  // @ Mentions state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionedDocs, setMentionedDocs] = useState<Array<{ id: string; title: string }>>([]);
  const [mentionIndex, setMentionIndex] = useState(0);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, agentProgress]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to cancel staged content
      if (e.key === 'Escape' && currentStaged) {
        rejectStaged();
      }
      // Enter (without Shift) to accept staged content when input is empty
      if (e.key === 'Enter' && !e.shiftKey && currentStaged && !input.trim()) {
        e.preventDefault();
        acceptStaged();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStaged, input, acceptStaged, rejectStaged]);

  // Filter available documents for @ mentions
  const availableDocs = useMemo(() => {
    if (!workspaceContext?.documents) return [];
    const search = mentionSearch.toLowerCase();
    return workspaceContext.documents
      .filter(d => !mentionedDocs.some(m => m.id === d.id)) // Exclude already mentioned
      .filter(d => d.title.toLowerCase().includes(search))
      .slice(0, 8); // Limit results
  }, [workspaceContext?.documents, mentionSearch, mentionedDocs]);

  // Handle input change with @ detection
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Detect @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1);
      // Check if we're in the middle of typing a mention (no space after @)
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setShowMentions(true);
        setMentionSearch(afterAt);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
    setMentionSearch('');
  }, []);

  // Add a mentioned document
  const addMention = useCallback((doc: { id: string; title: string }) => {
    // Remove the @search part from input
    const lastAtIndex = input.lastIndexOf('@');
    const newInput = lastAtIndex !== -1 
      ? input.slice(0, lastAtIndex) 
      : input;
    
    setInput(newInput);
    setMentionedDocs(prev => [...prev, doc]);
    setShowMentions(false);
    setMentionSearch('');
    inputRef.current?.focus();
  }, [input]);

  // Remove a mentioned document
  const removeMention = useCallback((docId: string) => {
    setMentionedDocs(prev => prev.filter(d => d.id !== docId));
  }, []);

  // Handle mention keyboard navigation
  const handleMentionKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showMentions || availableDocs.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex(prev => (prev + 1) % availableDocs.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex(prev => (prev - 1 + availableDocs.length) % availableDocs.length);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addMention(availableDocs[mentionIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowMentions(false);
    }
  }, [showMentions, availableDocs, mentionIndex, addMention]);

  /**
   * Handle executing the plan
   */
  const handleExecutePlan = useCallback(async () => {
    if (!currentPlan) return;
    
    // Validate workspace ID
    if (!workspaceId || workspaceId === 'default') {
      addMessage({
        role: 'assistant',
        content: `❌ **Cannot execute plan**\n\nYou need to be logged in with a valid workspace to create folders and documents.\n\nPlease log in and select a workspace, then try again.`,
      });
      return;
    }
    
    setIsExecutingPlan(true);
    
    // Add message to chat
    addMessage({
      role: 'user',
      content: `Execute the plan: ${currentPlan.title}`,
    });

    try {
      const result = await confirmPlan(true, currentModel);
      
      if (result.success) {
        const folderCount = currentPlan.items.filter(i => i.type === 'folder').length;
        const docCount = currentPlan.items.filter(i => i.type === 'document').length;
        
        addMessage({
          role: 'assistant',
          content: `✅ **Plan executed successfully!**\n\nI've created:\n- ${folderCount} folder${folderCount !== 1 ? 's' : ''}\n- ${docCount} document${docCount !== 1 ? 's' : ''}\n\nRefreshing sidebar...`,
        });
        
        // AGGRESSIVE REFRESH: Multiple attempts with increasing delays
        console.log('🔄 [AISidebarChat] Starting aggressive refresh sequence...');
        
        // Immediate refresh
        onDocumentCreated?.();
        
        // Delayed refreshes
        setTimeout(() => {
          console.log('🔄 [AISidebarChat] Refresh attempt #2 (500ms)');
          onDocumentCreated?.();
        }, 500);
        
        setTimeout(() => {
          console.log('🔄 [AISidebarChat] Refresh attempt #3 (1500ms)');
          onDocumentCreated?.();
        }, 1500);
        
        setTimeout(() => {
          console.log('🔄 [AISidebarChat] Refresh attempt #4 (3000ms)');
          onDocumentCreated?.();
        }, 3000);
      } else {
        addMessage({
          role: 'assistant',
          content: `❌ **Execution failed**\n\n${result.error || 'Unknown error occurred'}`,
        });
      }
    } catch (error: any) {
      addMessage({
        role: 'assistant',
        content: `❌ **Error**: ${error.message}`,
      });
    } finally {
      setIsExecutingPlan(false);
    }
  }, [currentPlan, confirmPlan, currentModel, addMessage, onDocumentCreated, workspaceId]);

  /**
   * Handle rejecting the plan
   */
  const handleRejectPlan = useCallback(() => {
    rejectPlan();
    addMessage({
      role: 'assistant',
      content: 'Plan cancelled. Let me know if you want to try a different approach.',
    });
  }, [rejectPlan, addMessage]);

  /**
   * Smart Input Handler - Routes to agent or regular chat
   */
  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    const normalizedInput = input.toLowerCase().trim();

    // If there's staged content, check for special commands
    if (currentStaged) {
      const acceptCommands = ['yes', 'yep', 'yeah', 'do it', 'apply', 'accept', 'ok', 'okay', 'sure', 'go', 'good', 'great'];
      const cancelCommands = ['no', 'nope', 'cancel', 'stop', 'abort', 'discard', 'never mind'];

      if (acceptCommands.some(cmd => normalizedInput === cmd || normalizedInput.startsWith(cmd + ' '))) {
        await acceptStaged();
        setInput('');
        return;
      }

      if (cancelCommands.some(cmd => normalizedInput === cmd || normalizedInput.startsWith(cmd + ' '))) {
        rejectStaged();
        setInput('');
        return;
      }

      // Modification request
      await modifyStaged(input);
      setInput('');
      return;
    }

    // Check if there's a pending plan and user wants to execute
    if (currentPlan && (
      normalizedInput === 'yes' ||
      normalizedInput === 'execute' ||
      normalizedInput === 'do it' ||
      normalizedInput === 'go' ||
      normalizedInput === 'proceed'
    )) {
      setInput('');
      await handleExecutePlan();
      return;
    }

    // Check if this is an agent request
    if (isAgentRequest(input)) {
      const agentType = getAgentType(input);
      
      // Add user message
      addMessage({
        role: 'user',
        content: input,
      });
      setInput('');

      // Add thinking message
      addMessage({
        role: 'assistant',
        content: `🤖 I'll help you ${agentType === 'planner' ? 'create a plan' : 'organize your content'}...`,
      });

      try {
        const result = await runPlanner(input, currentModel);
        
        if (result.success && result.plan) {
          // Show the plan in markdown
          addMessage({
            role: 'assistant',
            content: `📋 **Plan Created: ${result.plan.title}**\n\n${result.content || ''}\n\n---\n\n*Ready to execute? Say "yes" or "execute" to create all folders and documents.*`,
          });
        } else if (result.success && result.content) {
          addMessage({
            role: 'assistant',
            content: result.content,
          });
        } else {
          addMessage({
            role: 'assistant',
            content: `❌ Planning failed: ${result.error || 'Unknown error'}`,
          });
        }
      } catch (error: any) {
        addMessage({
          role: 'assistant',
          content: `❌ Error: ${error.message}`,
        });
      }
      return;
    }

    // No staged content and not an agent request - send regular message
    // Fetch content for mentioned documents
    let mentionedDocsWithContent: Array<{ id: string; title: string; content?: string }> = [];
    if (mentionedDocs.length > 0) {
      try {
        const { documentService } = await import('@/services/api/DocumentService');
        mentionedDocsWithContent = await Promise.all(
          mentionedDocs.map(async (doc) => {
            try {
              const fullDoc = await documentService.getDocument(doc.id);
              return { id: doc.id, title: doc.title, content: fullDoc?.content || '' };
            } catch {
              return { id: doc.id, title: doc.title, content: '' };
            }
          })
        );
      } catch (err) {
        console.error('Failed to fetch mentioned docs:', err);
      }
    }
    
    await sendMessage(input, currentModel, mentionedDocsWithContent.length > 0 ? mentionedDocsWithContent : undefined);
    setInput('');
    setMentionedDocs([]); // Clear mentions after sending
  }, [
    input,
    currentStaged,
    currentPlan,
    acceptStaged,
    rejectStaged,
    modifyStaged,
    sendMessage,
    currentModel,
    isAgentRequest,
    getAgentType,
    runPlanner,
    addMessage,
    handleExecutePlan,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const isProcessing = isGenerating || isAgentRunning;

  return (
    <div
      className={cn(
        'fixed top-0 right-0 h-full z-50',
        'bg-card border-l border-border shadow-2xl',
        'flex flex-col transition-all duration-300',
        isMinimized ? 'w-14' : 'w-96'
      )}
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          {!isMinimized && (
            <span className="font-medium text-sm">AI Chat</span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {!isMinimized && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowPreferences(!showPreferences)}
                title="Preferences"
              >
                <Zap className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowAPIKeys(!showAPIKeys)}
                title="API Keys"
              >
                <Key className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggle}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Panels */}
      {showPreferences && !isMinimized && (
        <AIPreferencesPanel
          preferences={preferences}
          onPreferencesChange={updatePreferences}
          onClose={() => setShowPreferences(false)}
        />
      )}

      {showAPIKeys && !isMinimized && (
        <div className="border-b border-border p-3 bg-muted/50 max-h-80 overflow-y-auto">
          <APIKeyManager />
        </div>
      )}

      {showSettings && !isMinimized && (
        <AISettingsPanel
          smartMode={false}
          onSmartModeChange={() => {}}
          autoSwitch={false}
          onAutoSwitchChange={() => {}}
          onClose={() => setShowSettings(false)}
        />
      )}

      {!isMinimized && (
        <>
          {/* Agent Progress Panel */}
          {agentProgress && agentProgress.status !== 'idle' && (
            <AgentProgressPanel
              progress={agentProgress}
              plan={currentPlan}
              onExecute={handleExecutePlan}
              onCancel={handleRejectPlan}
              isExecuting={isExecutingPlan}
            />
          )}

          {/* Context Info - Minimal */}
          <div className="px-3 py-1.5 border-b border-border flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="w-3 h-3 shrink-0" />
            <span className="truncate">{documentTitle}</span>
            <span className="text-border">•</span>
            <span>{documentContent.split(/\s+/).length} words</span>
            {currentPlan && (
              <>
                <span className="text-border">•</span>
                <span className="text-violet-500 flex items-center gap-1">
                  <FolderPlus className="w-3 h-3" />
                  Plan ready
                </span>
              </>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">AI-Powered Editor</p>
                  <p className="text-xs mt-1">
                    Edit documents or create new ones with AI
                  </p>
                  
                  {/* Workspace Context Summary */}
                  {workspaceContext && (workspaceContext.folders.length > 0 || workspaceContext.documents.length > 0) && (
                    <div className="mt-3 text-left text-xs bg-violet-500/10 border border-violet-500/20 rounded-lg p-2">
                      <p className="font-medium text-violet-400 flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        Context-Aware Mode
                      </p>
                      <p className="text-muted-foreground mt-1">
                        📁 {workspaceContext.folders.length} folders • 📄 {workspaceContext.documents.length} docs
                      </p>
                      <p className="text-violet-400/70 mt-1 text-[10px]">
                        Agent knows your existing content and avoids duplicates
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4 text-left text-xs space-y-2 bg-muted/50 rounded-lg p-3">
                    <p className="font-medium text-foreground">Try:</p>
                    <p className="text-muted-foreground">• "Improve this section"</p>
                    <p className="text-muted-foreground">• "Add a table of contents"</p>
                    <p className="text-violet-500">• "Create project documentation" <Bot className="inline w-3 h-3" /></p>
                    <p className="text-violet-500">• "Build me a docs structure" <Bot className="inline w-3 h-3" /></p>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onAccept={acceptStaged}
                  onReject={rejectStaged}
                  isPreviewExpanded={isPreviewExpanded}
                  onTogglePreview={() => setPreviewExpanded(!isPreviewExpanded)}
                  stagedContent={message.functionCall?.requiresConfirmation ? currentStaged : undefined}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-3 border-t border-border">
            {/* Quick hint when staged */}
            {currentStaged && (
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> to apply, <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> to cancel</span>
              </div>
            )}

            {/* Workspace warning */}
            {(!workspaceId || workspaceId === 'default') && (
              <div className="mb-2 flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 rounded px-2 py-1">
                <span>⚠️ No workspace selected. Agent features require a logged-in workspace.</span>
              </div>
            )}

            {/* Plan hint */}
            {currentPlan && !currentStaged && workspaceId && workspaceId !== 'default' && (
              <div className="mb-2 flex items-center gap-2 text-xs text-violet-500">
                <Bot className="w-3 h-3" />
                <span>Type <kbd className="px-1 py-0.5 bg-violet-500/20 rounded text-[10px]">yes</kbd> or <kbd className="px-1 py-0.5 bg-violet-500/20 rounded text-[10px]">execute</kbd> to create folders/docs</span>
              </div>
            )}

            {/* Mentioned Documents */}
            {mentionedDocs.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {mentionedDocs.map(doc => (
                  <span
                    key={doc.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs"
                  >
                    <FileText className="w-3 h-3" />
                    {doc.title}
                    <button
                      onClick={() => removeMention(doc.id)}
                      className="hover:text-red-400 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2 relative">
              {/* @ Mentions Dropdown */}
              {showMentions && availableDocs.length > 0 && (
                <div className="absolute bottom-full left-0 right-12 mb-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
                  <div className="p-1 text-[10px] text-muted-foreground border-b border-border px-2">
                    Documents (type to filter, ↑↓ to navigate, Enter to select)
                  </div>
                  <div className="max-h-[150px] overflow-y-auto">
                    {availableDocs.map((doc, idx) => (
                      <button
                        key={doc.id}
                        onClick={() => addMention(doc)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors",
                          idx === mentionIndex && "bg-muted"
                        )}
                      >
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="truncate">{doc.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {showMentions && availableDocs.length === 0 && (
                <div className="absolute bottom-full left-0 right-12 mb-1 bg-popover border border-border rounded-lg shadow-lg p-3 text-sm text-muted-foreground z-50">
                  {!workspaceId || workspaceId === 'default' ? (
                    <span className="text-amber-500">⚠️ Log in to reference documents with @</span>
                  ) : !workspaceContext?.documents?.length ? (
                    <span>No documents in this workspace yet</span>
                  ) : mentionSearch ? (
                    <span>No documents matching "{mentionSearch}"</span>
                  ) : (
                    <span>Type to search documents...</span>
                  )}
                </div>
              )}

              <Textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  handleMentionKeyDown(e);
                  if (!showMentions) handleKeyDown(e);
                }}
                placeholder={
                  currentPlan
                    ? "Type 'yes' to execute plan..."
                    : currentStaged
                    ? "Type changes or press Enter to apply..."
                    : workspaceId && workspaceId !== 'default'
                    ? "Ask me anything... (@ to mention docs)"
                    : "Ask me anything..."
                }
                className="min-h-[50px] max-h-[120px] resize-none text-sm"
                disabled={isProcessing && !currentPlan}
              />
              <div className="flex flex-col gap-1">
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || (isProcessing && !currentPlan)}
                  size="icon"
                  className="h-[24px] w-[50px] shrink-0"
                >
                  {isProcessing && !currentPlan ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                {isAgentRunning && (
                  <Button
                    onClick={cancelAgent}
                    size="icon"
                    variant="destructive"
                    className="h-[24px] w-[50px] shrink-0"
                    title="Cancel"
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Model Picker */}
          <ModelPicker
            currentModel={currentModel}
            onModelChange={setCurrentModel}
          />
        </>
      )}
    </div>
  );
};
