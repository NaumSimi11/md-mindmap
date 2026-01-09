/**
 * AI Sidebar Chat - Antigravity-Powered Edition
 * 
 * Features:
 * - Function calling (like Antigravity)
 * - Structured edits (edit_document, create_section, multi_edit)
 * - Streaming responses
 * - Context-aware
 */

import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Sparkles,
    Send,
    X,
    Minimize2,
    Maximize2,
    Settings,
    FileText,
    MousePointer,
    Loader2,
    Terminal,
    Check,
    XCircle,
} from 'lucide-react';
import { ModelPicker } from './ModelPicker';
import { AISettingsPanel } from './AISettingsPanel';
import { AIPreferencesPanel } from './AIPreferencesPanel';
import { AIThinkingAnimation } from './AIThinkingAnimation';
import { getDocumentContext } from '@/utils/documentContext';
import { useAIChat } from '@/hooks/useAIChat';
import { AIContentPreview } from './AIContentPreview';

interface AISidebarChatProps {
    editor: Editor | null;
    documentContent: string;
    documentTitle?: string;
    isOpen: boolean;
    onToggle: () => void;
}

export const AISidebarChat: React.FC<AISidebarChatProps> = ({
    editor,
    documentContent,
    documentTitle = 'Document',
    isOpen,
    onToggle,
}) => {
    const {
        messages,
        isGenerating,
        sendMessage,
        preferences,
        updatePreferences,
        // 🎯 Staging actions
        acceptStaged,
        modifyStaged,
        rejectStaged,
        currentStaged,
        isPreviewExpanded,
        setPreviewExpanded,
    } = useAIChat({ editor, documentContent, documentTitle });

    const [input, setInput] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [currentModel, setCurrentModel] = useState<string>('gemini-flash');
    const [autoSwitch, setAutoSwitch] = useState(true);
    const [smartMode, setSmartMode] = useState(false);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const context = getDocumentContext(editor, documentContent);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    /**
     * 🎯 Smart Input Handler - Context-Aware Command Processing
     * 
     * If content is staged:
     * - "yes"/"do it" → Accept staged content
     * - "cancel"/"no" → Reject staged content
     * - Anything else → Modify staged content
     * 
     * If no staged content:
     * - Generate new content
     */
    const handleSend = async () => {
        if (!input.trim()) return;
        
        const normalizedInput = input.toLowerCase().trim();
        
        // 🎯 If there's staged content, check for special commands
        if (currentStaged) {
            // Accept commands
            const acceptCommands = [
                'yes', 'yep', 'yeah', 'yup',
                'do it', 'apply', 'accept',
                'ok', 'okay', 'sure',
                'go ahead', 'proceed',
                'looks good', 'perfect',
                'apply it', 'apply changes',
                'that works', 'sounds good',
                'good', 'great', 'nice'
            ];
            
            // Cancel commands
            const cancelCommands = [
                'no', 'nope', 'cancel',
                'stop', 'abort', 'discard',
                'never mind', 'nevermind',
                'forget it', 'no thanks'
            ];
            
            // Check if user wants to accept
            if (acceptCommands.some(cmd => normalizedInput === cmd || normalizedInput.startsWith(cmd))) {
                await acceptStaged();
                setInput('');
                return;
            }
            
            // Check if user wants to cancel
            if (cancelCommands.some(cmd => normalizedInput === cmd || normalizedInput.startsWith(cmd))) {
                rejectStaged();
                setInput('');
                return;
            }
            
            // Otherwise, treat as modification request
            await modifyStaged(input);
            setInput('');
            return;
        }
        
        // No staged content - generate new
        await sendMessage(input, currentModel);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`
        fixed top-0 right-0 h-full z-50
        bg-card border-l border-border
        shadow-2xl
        flex flex-col
        transition-all duration-300
        ${isMinimized ? 'w-16' : 'w-96'}
      `}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {!isMinimized && (
                        <div>
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                AI Assistant
                                <Badge variant="outline" className="text-xs">Antigravity</Badge>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {documentContent.split(/\s+/).length} words
                            </p>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowPreferences(!showPreferences)}
                        title="AI Preferences"
                    >
                        <Sparkles className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowSettings(!showSettings)}
                        title="AI Settings"
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        {isMinimized ? (
                            <Maximize2 className="h-4 w-4" />
                        ) : (
                            <Minimize2 className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onToggle}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Preferences Panel */}
            {showPreferences && !isMinimized && (
                <AIPreferencesPanel
                    preferences={preferences}
                    onPreferencesChange={updatePreferences}
                    onClose={() => setShowPreferences(false)}
                />
            )}

            {/* Settings Panel */}
            {showSettings && !isMinimized && (
                <AISettingsPanel
                    smartMode={smartMode}
                    onSmartModeChange={setSmartMode}
                    autoSwitch={autoSwitch}
                    onAutoSwitchChange={setAutoSwitch}
                    onClose={() => setShowSettings(false)}
                />
            )}

            {!isMinimized && (
                <>
                    {/* Context Info */}
                    <div className="p-3 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span>{documentTitle}</span>
                        </div>
                        {context.currentSection && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <MousePointer className="h-3 w-3" />
                                <span>Section: {context.currentSection}</span>
                            </div>
                        )}
                        {/* Preferences Indicator */}
                        <div className="flex items-center gap-2 text-xs mt-2 pt-2 border-t border-border/50">
                            <Sparkles className="h-3 w-3 text-primary" />
                            <span className="text-muted-foreground">
                                {preferences.confidenceLevel === 'confident' && preferences.suggestionFrequency === 'always-suggest'
                                    ? '⚡ Confident Mode - Acting Fast'
                                    : preferences.confidenceLevel === 'confident'
                                        ? '✅ Confident Mode'
                                        : '⚠️ Conservative Mode'}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground capitalize">{preferences.writingStyle}</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-sm text-muted-foreground py-8">
                                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="font-semibold">Antigravity-Powered Editor</p>
                                    <p className="text-xs mt-1">
                                        Try: "Add a deployment section after contributing"
                                    </p>
                                </div>
                            )}

                            {/* 🎯 Show Preview if content is staged */}
                            {currentStaged && (
                                <div className="mb-4">
                                    <AIContentPreview
                                        stagedContent={currentStaged}
                                        onAccept={acceptStaged}
                                        onModify={modifyStaged}
                                        onCancel={rejectStaged}
                                        isExpanded={isPreviewExpanded}
                                        onToggleExpand={() => setPreviewExpanded(!isPreviewExpanded)}
                                    />
                                </div>
                            )}

                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {/* Show thinking animation */}
                                    {message.isThinking && message.role === 'assistant' ? (
                                        <div className="max-w-[85%]">
                                            <AIThinkingAnimation phase={message.thinkingPhase} />
                                        </div>
                                    ) : (
                                        <div
                                            className={`
                      max-w-[85%] rounded-lg p-3
                      ${message.role === 'user'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                                }
                    `}
                                        >
                                        {message.confidence && message.role === 'assistant' && (
                                            <Badge
                                                variant={
                                                    message.confidence === 'high'
                                                        ? 'default'
                                                        : message.confidence === 'medium'
                                                            ? 'secondary'
                                                            : 'outline'
                                                }
                                                className="mb-2 text-xs"
                                            >
                                                {message.confidence === 'high' && 'High Confidence'}
                                                {message.confidence === 'medium' && 'Medium Confidence'}
                                                {message.confidence === 'low' && 'Low Confidence'}
                                            </Badge>
                                        )}

                                        {/* Message Content (hide JSON) */}
                                        {message.content && !message.content.includes('"function"') && (
                                            <p className="text-sm whitespace-pre-wrap">
                                                {message.content}
                                            </p>
                                        )}

                                        {/* Function Call Status */}
                                        {message.functionCall && (
                                            <div className="mt-3 pt-3 border-t border-border/30">
                                                {message.functionCall.status === 'pending' && !message.functionCall.requiresConfirmation && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                        <span>{message.functionCall.friendlyDescription || 'Applying changes...'}</span>
                                                    </div>
                                                )}
                                                {message.functionCall.status === 'success' && (
                                                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                                        <Check className="h-3 w-3" />
                                                        <span>{message.functionCall.friendlyDescription || message.functionCall.result?.message}</span>
                                                    </div>
                                                )}
                                                {message.functionCall.status === 'error' && (
                                                    <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                                                        <XCircle className="h-3 w-3" />
                                                        <span>{message.functionCall.result?.message || 'Failed to apply changes'}</span>
                                                    </div>
                                                )}
                                                {message.functionCall.requiresConfirmation && (
                                                    <div className="mt-2 text-xs text-muted-foreground italic">
                                                        💡 Say "yes" or "do it" to apply these changes
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Quick Action Buttons (when content is staged) */}
                    {currentStaged && (
                        <div className="px-4 py-2 bg-purple-50 dark:bg-purple-950/20 border-t border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 mb-2">
                                <Sparkles className="h-3 w-3" />
                                <span className="font-semibold">Content is staged - Choose an action:</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={async () => {
                                        await acceptStaged();
                                    }}
                                    size="sm"
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Check className="h-3 w-3 mr-1" />
                                    Apply
                                </Button>
                                <Button
                                    onClick={() => {
                                        rejectStaged();
                                    }}
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-border">
                        <div className="flex gap-2">
                            <Textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={
                                    currentStaged
                                        ? "Say 'yes' to apply, 'cancel' to discard, or request changes..."
                                        : "Ask me to edit your document..."
                                }
                                className="min-h-[60px] resize-none"
                                disabled={isGenerating}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isGenerating}
                                size="icon"
                                className="h-[60px] w-[60px]"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Model Picker */}
                    <ModelPicker
                        currentModel={currentModel}
                        onModelChange={setCurrentModel}
                        autoSwitch={autoSwitch}
                        taskType="writing"
                    />
                </>
            )}
        </div>
    );
};
