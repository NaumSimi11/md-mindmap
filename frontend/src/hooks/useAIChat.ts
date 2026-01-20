import { useState, useCallback } from 'react';
import { aiService } from '@/services/ai/AIService';
import { DocumentEditTools } from '@/services/ai/DocumentEditTools';
import { useToast } from '@/components/ui/use-toast';
import { Editor } from '@tiptap/react';
import { getDocumentContext } from '@/utils/documentContext';
import { AIPreferences, DEFAULT_PREFERENCES } from '@/components/editor/AIPreferencesPanel';
import { PromptTemplates, PromptContext } from '@/services/ai/PromptTemplates';
import { ResponseProcessor } from '@/services/ai/ResponseProcessor';
import { DocumentAnalyzer } from '@/services/ai/DocumentAnalyzer';
import { SmartFormatDetector } from '@/services/ai/SmartFormatDetector';
import { createStreamingParser, getFunctionDescription } from '@/services/ai/StreamingParser';
import { formatErrorForChat, formatErrorForToast } from '@/services/ai/AIErrorHandler';
import { useAIStagingStore, StagedSection } from '@/stores/aiStagingStore';
import { 
    showInlinePreview, 
    hideInlinePreview, 
    calculateInsertionPosition, 
    getAvailablePositions 
} from '@/extensions/InlinePreviewExtension';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    confidence?: 'high' | 'medium' | 'low';
    isStreaming?: boolean;
    isThinking?: boolean;
    thinkingPhase?: 'analyzing' | 'planning' | 'writing' | 'finalizing';
    functionCall?: {
        name: string;
        args: any;
        result?: any;
        status: 'pending' | 'success' | 'error';
        requiresConfirmation?: boolean;
        friendlyDescription?: string; // "Adding 3 sections with detailed content"
    };
}

interface UseAIChatProps {
    editor: Editor | null;
    documentContent: string;
    documentTitle?: string;
}

/**
 * 🔍 Helper Functions
 */
function formatPositionLabel(position: 'start' | 'end' | { after: string } | { before: string }): string {
    if (position === 'start') return 'Start of document';
    if (position === 'end') return 'End of document';
    if (typeof position === 'object') {
        if ('after' in position) return `After "${position.after}"`;
        if ('before' in position) return `Before "${position.before}"`;
    }
    return 'End of document';
}

/**
 * 🔍 Context Detection Helpers
 */
function detectDocumentType(title: string, content: string): 'technical' | 'creative' | 'business' | 'educational' {
    const techKeywords = ['API', 'install', 'configuration', 'deployment', 'architecture', 'authentication'];
    const eduKeywords = ['tutorial', 'guide', 'how to', 'learn', 'lesson', 'course'];
    const bizKeywords = ['business', 'strategy', 'proposal', 'report', 'analysis', 'market'];
    
    const text = (title + ' ' + content).toLowerCase();
    
    if (techKeywords.some(kw => text.includes(kw.toLowerCase()))) return 'technical';
    if (eduKeywords.some(kw => text.includes(kw.toLowerCase()))) return 'educational';
    if (bizKeywords.some(kw => text.includes(kw.toLowerCase()))) return 'business';
    
    return 'technical'; // default
}

function detectSectionType(input: string, currentSection?: string): 'list' | 'tutorial' | 'reference' | 'explanation' | 'comparison' {
    const text = (input + ' ' + (currentSection || '')).toLowerCase();
    
    if (text.includes('list') || text.includes('features') || text.includes('methods') || text.includes('options')) {
        return 'list';
    }
    if (text.includes('how') || text.includes('tutorial') || text.includes('setup') || text.includes('install')) {
        return 'tutorial';
    }
    if (text.includes('api') || text.includes('reference') || text.includes('command')) {
        return 'reference';
    }
    if (text.includes('compare') || text.includes('vs') || text.includes('difference')) {
        return 'comparison';
    }
    
    return 'explanation'; // default
}

function detectUserIntent(input: string): 'fill' | 'improve' | 'expand' | 'summarize' | 'format' {
    const text = input.toLowerCase();
    
    if (text.includes('fill') || text.includes('complete') || text.includes('add content')) {
        return 'fill';
    }
    if (text.includes('improve') || text.includes('enhance') || text.includes('better')) {
        return 'improve';
    }
    if (text.includes('expand') || text.includes('more detail') || text.includes('elaborate')) {
        return 'expand';
    }
    if (text.includes('summarize') || text.includes('shorten') || text.includes('brief')) {
        return 'summarize';
    }
    if (text.includes('format') || text.includes('structure') || text.includes('organize')) {
        return 'format';
    }
    
    return 'improve'; // default
}

export const useAIChat = ({ editor, documentContent, documentTitle = 'Document' }: UseAIChatProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [preferences, setPreferences] = useState<AIPreferences>(() => {
        const saved = localStorage.getItem('ai-preferences');
        return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    });

    const { toast } = useToast();
    
    // 🎯 Staging store - holds generated content in memory before applying
    const stagingStore = useAIStagingStore();

    // Save preferences to localStorage
    const updatePreferences = useCallback((newPreferences: AIPreferences) => {
        setPreferences(newPreferences);
        localStorage.setItem('ai-preferences', JSON.stringify(newPreferences));
    }, []);

    const sendMessage = useCallback(async (
        input: string, 
        model: string = 'gemini-flash',
        mentionedDocuments?: Array<{ id: string; title: string; content?: string }>
    ) => {
        if (!input.trim() || !editor || isGenerating) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsGenerating(true);

        try {
            // Detect execute commands
            const executeCommands = [
                'yes', 'yep', 'yeah', 'do it', 'start', 'go', 'ok', 'okay', 'sure', 'proceed',
                'directly', 'just do', 'make it', 'write it', 'fill it', 'add it', 'create it',
                'can you do that', 'please do', 'go ahead'
            ];
            const isExecuteCommand = executeCommands.some(cmd =>
                input.toLowerCase().includes(cmd)
            );

            // Detect frustration signals
            const frustrationSignals = ['fucking', 'fking', 'just', 'already', 'stop asking'];
            const isFrustrated = frustrationSignals.some(signal => input.toLowerCase().includes(signal));

            const editTools = new DocumentEditTools(editor);
            const functionSchemas = DocumentEditTools.getFunctionSchemas();
            const context = getDocumentContext(editor, documentContent);
            
            // Build additional context from mentioned documents
            let mentionedContext = '';
            if (mentionedDocuments && mentionedDocuments.length > 0) {
                mentionedContext = '\n\n# 📎 REFERENCED DOCUMENTS:\n\n';
                for (const doc of mentionedDocuments) {
                    mentionedContext += `## @${doc.title}\n`;
                    if (doc.content) {
                        mentionedContext += `${doc.content.substring(0, 2000)}${doc.content.length > 2000 ? '...(truncated)' : ''}\n\n`;
                    } else {
                        mentionedContext += `(Content not available)\n\n`;
                    }
                }
                mentionedContext += 'Consider the above referenced documents when responding to the user.\n';
            }

            // 🧠 DEEP DOCUMENT ANALYSIS
            const docAnalysis = DocumentAnalyzer.analyzeDocument(documentContent, documentTitle);
            const sectionAnalysis = context.currentSection 
                ? DocumentAnalyzer.analyzeCurrentSection(context.currentSection, documentContent)
                : {};
            const userIntent = DocumentAnalyzer.detectUserIntent(input, docAnalysis);

            // 🎯 SMART FORMAT DETECTION
            const formatDecision = SmartFormatDetector.detectOptimalFormat(
                userIntent,
                { ...docAnalysis, ...sectionAnalysis },
                input
            );

          

            // 🎯 Build comprehensive context for prompt
            const promptContext: PromptContext = {
                documentType: docAnalysis.documentType,
                sectionType: sectionAnalysis.currentSectionType,
                userIntent: userIntent.action,
                hasSelection: !!context.selectedText,
                currentSection: context.currentSection,
            };

            // 🚀 Build sophisticated prompt using templates
            const contextPrompt = PromptTemplates.buildPrompt(
                input,
                documentContent,
                documentTitle,
                promptContext,
                preferences,
                isExecuteCommand,
                isFrustrated
            );

            // Add AI intelligence hints to prompt
            const enhancedPrompt = `${contextPrompt}

# 🧠 AI INTELLIGENCE ANALYSIS:

Based on my analysis:
- Document Type: ${docAnalysis.documentType}
- Section Type: ${sectionAnalysis.currentSectionType || 'general'}
- User Intent: ${userIntent.action}
- Recommended Format: ${formatDecision.format}
- Confidence: ${formatDecision.confidence}
- Format Reason: ${formatDecision.reason}

${formatDecision.format.includes('checkbox') ? `
⚠️ CHECKBOX DETECTED - Remember:
- Use "- [ ]" for unchecked (things user needs to do)
- Use "- [x]" for checked (things already done)
- Follow the checkbox intelligence rules above!
` : ''}

Use this intelligence to make the PERFECT decision about formatting!
`;

            // Add function schemas for AI function calling
            // Include mentioned documents context if any
            const fullPrompt = `${enhancedPrompt}${mentionedContext}\n\nAVAILABLE FUNCTIONS:\n${JSON.stringify(functionSchemas, null, 2)}`;

            const assistantMessageId = (Date.now() + 1).toString();
            
            // Show "thinking" state first
            const thinkingMessage: ChatMessage = {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                isThinking: true,
                thinkingPhase: 'analyzing',
            };

            setMessages((prev) => [...prev, thinkingMessage]);

            // Simulate thinking phases for better UX
            await new Promise(resolve => setTimeout(resolve, 300));
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMessageId
                        ? { ...msg, thinkingPhase: 'planning' as const }
                        : msg
                )
            );

            // 🎯 Use StreamingParser for natural response handling
            const streamParser = createStreamingParser();
            let friendlyContent = '';

            await aiService.generateContentStream(fullPrompt, (chunk) => {
                const parsed = streamParser.processChunk(chunk);
                
                // Post-process for better formatting
                const processed = ResponseProcessor.process(parsed.displayContent);
                friendlyContent = processed.content;

                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantMessageId
                            ? { 
                                ...msg, 
                                content: friendlyContent,
                                isThinking: false,
                                isStreaming: true 
                            }
                            : msg
                    )
                );
            }, {
                temperature: 0.7,
                maxTokens: 2000,
                model: model
            });

            // Finalize parsing
            const finalParsed = streamParser.finalize();
            const fullResponse = streamParser.getRawBuffer();

            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMessageId
                        ? { ...msg, isStreaming: false }
                        : msg
                )
            );

            // Check for function call from parser
            if (finalParsed.functionCall) {
                const { name: funcName, arguments: funcArgs } = finalParsed.functionCall;
                const friendlyMessage = finalParsed.displayContent;
                
                // Generate friendly description
                const actionDescription = getFunctionDescription(funcName, funcArgs);

                // 🎯 STAGING WORKFLOW
                // Generate preview content (markdown representation)
                let previewContent = '';
                const sections: StagedSection[] = [];
                
                if (funcName === 'create_section') {
                    previewContent = `## ${funcArgs.title}\n\n${funcArgs.content}`;
                    sections.push({
                        title: funcArgs.title,
                        content: funcArgs.content,
                        position: funcArgs.position,
                    });
                } else if (funcName === 'multi_edit') {
                    // Build preview from all edits
                    const edits = funcArgs.edits || [];
                    previewContent = edits.map((edit: any) => {
                        if (edit.action === 'insert_after' || edit.action === 'insert_before') {
                            return edit.newContent;
                        }
                        return `### ${edit.target}\n\n${edit.newContent || ''}`;
                    }).join('\n\n');
                    
                    // Extract sections
                    edits.forEach((edit: any) => {
                        if (edit.newContent) {
                            const titleMatch = edit.newContent.match(/^##\s+(.+)/m);
                            sections.push({
                                title: titleMatch ? titleMatch[1] : edit.target,
                                content: edit.newContent,
                            });
                        }
                    });
                } else if (funcName === 'edit_document') {
                    previewContent = `### ${funcArgs.target}\n\n${funcArgs.newContent || ''}`;
                    sections.push({
                        title: funcArgs.target,
                        content: funcArgs.newContent || '',
                    });
                }

                // 🎯 STAGE CONTENT (don't apply yet!)
                const stagedContentInput = {
                    type: funcName as any,
                    originalRequest: input,
                    generatedContent: previewContent,
                    sections,
                    functionCall: {
                        name: funcName,
                        arguments: funcArgs,
                    },
                    description: actionDescription,
                };
                
                stagingStore.stageContent(stagedContentInput);
                
                // Get the full staged content from the store
                const fullStagedContent = stagingStore.currentStaged;

                // 🎨 SHOW INLINE PREVIEW IN DOCUMENT!
                if (editor && fullStagedContent) {
                    const position = calculateInsertionPosition(editor, funcArgs.position || 'end');
                    const availablePositions = getAvailablePositions(editor);
                    const currentPositionLabel = formatPositionLabel(funcArgs.position || 'end');
                    
                    showInlinePreview(editor, {
                        stagedContent: fullStagedContent,
                        position,
                        currentPosition: currentPositionLabel,
                        availablePositions,
                        onAccept: () => {
                            acceptStaged();
                        },
                        onReject: () => {
                            rejectStaged();
                        },
                        onChangePosition: () => {
                            // Position change handled elsewhere
                        },
                    });
                }

                // Show preview in message with pending confirmation
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantMessageId
                            ? {
                                ...msg,
                                content: friendlyMessage || 'I can help improve your document.',
                                isThinking: false,
                                functionCall: { 
                                    name: funcName, 
                                    args: funcArgs, 
                                    status: 'pending',
                                    requiresConfirmation: true,
                                    friendlyDescription: actionDescription
                                },
                            }
                            : msg
                    )
                );
            }

        } catch (error) {
            // 🎨 Use friendly error handler
            const friendlyError = formatErrorForChat(error);
            const toastError = formatErrorForToast(error);
            
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: friendlyError,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            toast({
                title: toastError.title,
                description: toastError.description,
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    }, [editor, documentContent, documentTitle, preferences, toast]);

    /**
     * 🎯 Accept staged content and apply to document
     */
    const acceptStaged = useCallback(async () => {
        const staged = stagingStore.acceptStaged();
        if (!staged || !editor) return;

        // 🎨 Hide inline preview first
        hideInlinePreview(editor);

        const editTools = new DocumentEditTools(editor);
        
        try {
            let result;
            const funcCall = staged.functionCall;
            if (!funcCall) return;

            // Execute the function call
            switch (funcCall.name) {
                case 'edit_document':
                    result = await editTools.editDocument(funcCall.arguments);
                    break;
                case 'create_section':
                    result = await editTools.createSection(funcCall.arguments);
                    break;
                case 'multi_edit':
                    result = await editTools.multiEdit(funcCall.arguments);
                    break;
                default:
                    throw new Error(`Unknown function: ${funcCall.name}`);
            }

            if (result.success) {
                toast({
                    title: '✅ Changes applied!',
                    description: staged.description,
                });

                // Add success message to chat
                const successMsg: ChatMessage = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `✅ Successfully applied changes to your document!`,
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, successMsg]);
            } else {
                throw new Error(result.message || 'Failed to apply changes');
            }
        } catch (error: any) {
            toast({
                title: '❌ Failed to apply changes',
                description: error.message,
                variant: 'destructive',
            });
            
            // Add error message to chat
            const errorMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `❌ Sorry, there was an error applying the changes: ${error.message}`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        }
    }, [editor, stagingStore, toast]);

    /**
     * 🎯 Modify staged content based on user request
     */
    const modifyStaged = useCallback(async (modificationRequest: string) => {
        const currentStaged = stagingStore.currentStaged;
        if (!currentStaged) return;

        // Mark as modifying
        stagingStore.modifyStaged(modificationRequest);

        // Send modification request to AI
        await sendMessage(modificationRequest);
    }, [stagingStore, sendMessage]);

    /**
     * 🎯 Reject/cancel staged content
     */
    const rejectStaged = useCallback(() => {
        // 🎨 Hide inline preview first
        if (editor) {
            hideInlinePreview(editor);
        }
        
        stagingStore.rejectStaged();
        
        toast({
            title: '❌ Changes cancelled',
            description: 'No changes were made to your document.',
        });

        // Add cancellation message to chat
        const cancelMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: '❌ Changes cancelled. No modifications were made to your document.',
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, cancelMsg]);
    }, [editor, stagingStore, toast]);

    /**
     * Add a message to the chat (for external use like agents)
     */
    const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const message: ChatMessage = {
            ...msg,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, message]);
    }, []);

    return {
        messages,
        isGenerating,
        sendMessage,
        preferences,
        updatePreferences,
        
        // 🎯 Staging actions
        acceptStaged,
        modifyStaged,
        rejectStaged,
        currentStaged: stagingStore.currentStaged,
        isPreviewExpanded: stagingStore.isPreviewExpanded,
        setPreviewExpanded: stagingStore.setPreviewExpanded,
        
        // 🤖 For agent integration
        addMessage,
    };
};
