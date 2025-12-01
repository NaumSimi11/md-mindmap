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
import { getDocumentContext } from '@/utils/documentContext';
import { useAIChat } from '@/hooks/useAIChat';

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
        updatePreferences
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

    const handleSend = async () => {
        if (!input.trim()) return;
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

                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
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

                                        {/* Function Call Display */}
                                        {message.functionCall && (
                                            <div className="mb-3 bg-background/50 rounded p-2 border border-border/50">
                                                <div className="flex items-center gap-2 text-xs font-mono mb-1">
                                                    <Terminal className="h-3 w-3" />
                                                    <span className="font-semibold">{message.functionCall.name}</span>
                                                    {message.functionCall.status === 'pending' && <Loader2 className="h-3 w-3 animate-spin" />}
                                                    {message.functionCall.status === 'success' && <Check className="h-3 w-3 text-green-500" />}
                                                    {message.functionCall.status === 'error' && <XCircle className="h-3 w-3 text-red-500" />}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    <div className="font-semibold mt-1">Action:</div>
                                                    <div className="pl-2">{message.functionCall.args.action || 'N/A'}</div>
                                                    <div className="font-semibold mt-1">Target:</div>
                                                    <div className="pl-2 truncate">{message.functionCall.args.target || message.functionCall.args.title || 'N/A'}</div>
                                                    {message.functionCall.args.reason && (
                                                        <>
                                                            <div className="font-semibold mt-1">Reason:</div>
                                                            <div className="pl-2">{message.functionCall.args.reason}</div>
                                                        </>
                                                    )}
                                                </div>
                                                {message.functionCall.result && (
                                                    <div className="mt-2 pt-2 border-t border-border/50 text-xs">
                                                        <span className={message.functionCall.result.success ? 'text-green-600' : 'text-red-600'}>
                                                            {message.functionCall.result.message}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Only show content if no function call, or if it's not JSON */}
                                        {!message.functionCall && message.content && (
                                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        )}

                                        {/* Show non-JSON content even with function call */}
                                        {message.functionCall && message.content && !message.content.includes('"function"') && (
                                            <p className="text-sm whitespace-pre-wrap text-muted-foreground italic">
                                                {message.content}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-4 border-t border-border">
                        <div className="flex gap-2">
                            <Textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask me to edit your document..."
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
