import { useState, useCallback } from 'react';
import { aiService } from '@/services/ai/AIService';
import { DocumentEditTools } from '@/services/ai/DocumentEditTools';
import { useToast } from '@/components/ui/use-toast';
import { Editor } from '@tiptap/react';
import { getDocumentContext } from '@/utils/documentContext';
import { AIPreferences, DEFAULT_PREFERENCES } from '@/components/editor/AIPreferencesPanel';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    confidence?: 'high' | 'medium' | 'low';
    isStreaming?: boolean;
    functionCall?: {
        name: string;
        args: any;
        result?: any;
        status: 'pending' | 'success' | 'error';
    };
}

interface UseAIChatProps {
    editor: Editor | null;
    documentContent: string;
    documentTitle?: string;
}

export const useAIChat = ({ editor, documentContent, documentTitle = 'Document' }: UseAIChatProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [preferences, setPreferences] = useState<AIPreferences>(() => {
        const saved = localStorage.getItem('ai-preferences');
        return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    });

    const { toast } = useToast();

    // Save preferences to localStorage
    const updatePreferences = useCallback((newPreferences: AIPreferences) => {
        setPreferences(newPreferences);
        localStorage.setItem('ai-preferences', JSON.stringify(newPreferences));
    }, []);

    const sendMessage = useCallback(async (input: string, model: string = 'gemini-flash') => {
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
            const executeCommands = ['yes', 'yep', 'yeah', 'do it', 'start', 'go', 'ok', 'okay', 'sure', 'proceed'];
            const isExecuteCommand = executeCommands.some(cmd =>
                input.toLowerCase().trim() === cmd || input.toLowerCase().trim().startsWith(cmd + ' ')
            );

            // Detect frustration signals
            const frustrationSignals = ['fucking', 'fking', 'just', 'already', 'stop asking'];
            const isFrustrated = frustrationSignals.some(signal => input.toLowerCase().includes(signal));

            const editTools = new DocumentEditTools(editor);
            const functionSchemas = DocumentEditTools.getFunctionSchemas();
            const context = getDocumentContext(editor, documentContent);

            const contextPrompt = `
You are a SENIOR ENGINEER AI assistant with Antigravity-level editing power.

DOCUMENT: "${documentTitle}"
CONTENT:
${documentContent.substring(0, 8000)}${documentContent.length > 8000 ? '\n\n[... continues ...]' : ''}

${context.selectedText ? `SELECTED: "${context.selectedText}"` : ''}
${context.currentSection ? `CURRENT SECTION: ${context.currentSection}` : ''}

USER REQUEST: "${input}"

${isExecuteCommand ? `\n🚨🚨🚨 USER SAID "${input}" - EXECUTE IMMEDIATELY!\n- Stop asking questions and ACT NOW!\n- Make changes immediately!\n` : ''}
${isFrustrated ? `\n🚨 USER IS FRUSTRATED - STOP ASKING QUESTIONS!\n- Act decisively and fast!\n` : ''}

USER PREFERENCES:
- Writing Style: ${preferences.writingStyle}
- Context Level: ${preferences.contextLevel}
- Confidence: ${preferences.confidenceLevel} ${preferences.confidenceLevel === 'confident' ? '(BE DECISIVE - make decisions fast!)' : ''}
- Suggestions: ${preferences.suggestionFrequency} ${preferences.suggestionFrequency === 'always-suggest' ? '(ALWAYS suggest changes!)' : ''}
- Tone: ${preferences.tone}

AVAILABLE FUNCTIONS:
${JSON.stringify(functionSchemas, null, 2)}

CRITICAL RULES FOR A SENIOR ENGINEER:
1. **WRITE REAL CONTENT** - NO placeholders like "instructions..." or "content here..."
2. **BE COMPREHENSIVE** - Write 3-5 paragraphs minimum for new sections
3. **BE SPECIFIC** - Include actual commands, code examples, step-by-step instructions
4. **BE PROFESSIONAL** - Use proper markdown formatting, emojis, structure
5. **ASK IF UNCLEAR** - If you need more info, ask the user first (return text, not a function)

WHEN TO USE FUNCTIONS:
- User says "add", "create", "insert" → use edit_document or create_section
- User says "change", "update", "rewrite" → use edit_document with action: replace
- User asks a question or needs clarification → return text response (no function)

CONTENT QUALITY STANDARDS:
- Deployment section? Write actual deployment steps (Docker, CI/CD, hosting)
- API docs? Write actual endpoints, request/response examples
- Installation? Write actual commands (npm install, setup steps)
- Architecture? Describe actual components, data flow, tech stack

NOW RESPOND TO THE USER'S REQUEST:
Be decisive, comprehensive, and write REAL content. If you need clarification, just ask (no function call).
`;

            const assistantMessageId = (Date.now() + 1).toString();
            const assistantMessage: ChatMessage = {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                isStreaming: true,
            };

            setMessages((prev) => [...prev, assistantMessage]);

            let fullResponse = '';

            await aiService.generateContentStream(contextPrompt, (chunk) => {
                fullResponse += chunk;
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: fullResponse }
                            : msg
                    )
                );
            }, {
                temperature: 0.7,
                maxTokens: 2000,
                model: model // Pass the model if AIService supports it, otherwise it defaults
            });

            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMessageId
                        ? { ...msg, isStreaming: false }
                        : msg
                )
            );

            // Parse function call
            const jsonMatch = fullResponse.match(/\{[\s\S]*"function"[\s\S]*\}/);

            if (jsonMatch) {
                try {
                    const functionCall = JSON.parse(jsonMatch[0]);
                    const { function: funcName, arguments: funcArgs } = functionCall;

                    console.log('🔧 Function call:', funcName, funcArgs);

                    // Update message to show function call
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantMessageId
                                ? {
                                    ...msg,
                                    functionCall: { name: funcName, args: funcArgs, status: 'pending' },
                                }
                                : msg
                        )
                    );

                    // Execute function
                    let result;
                    switch (funcName) {
                        case 'edit_document':
                            result = await editTools.editDocument(funcArgs);
                            break;
                        case 'create_section':
                            result = await editTools.createSection(funcArgs);
                            break;
                        case 'multi_edit':
                            result = await editTools.multiEdit(funcArgs);
                            break;
                        default:
                            result = { success: false, message: `Unknown function: ${funcName}` };
                    }

                    // Update message with result
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantMessageId
                                ? {
                                    ...msg,
                                    functionCall: {
                                        name: funcName,
                                        args: funcArgs,
                                        result,
                                        status: result.success ? 'success' : 'error',
                                    },
                                }
                                : msg
                        )
                    );

                    toast({
                        title: result.success ? 'Edit Applied' : 'Edit Failed',
                        description: result.message,
                        variant: result.success ? 'default' : 'destructive',
                    });

                } catch (error) {
                    console.error('Function call parsing failed:', error);
                    toast({
                        title: 'Error',
                        description: 'Failed to parse AI response',
                        variant: 'destructive',
                    });
                }
            }

        } catch (error) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            toast({
                title: 'Error',
                description: 'Failed to generate response',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    }, [editor, documentContent, documentTitle, preferences, toast]);

    return {
        messages,
        isGenerating,
        sendMessage,
        preferences,
        updatePreferences
    };
};
