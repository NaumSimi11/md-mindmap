/**
 * AIInlineSuggestions - Ghost text that appears as you type (like GitHub Copilot)
 * Press Tab to accept, Esc to reject
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { aiService } from '@/services/ai/AIService';
import { Sparkles } from 'lucide-react';

interface AIInlineSuggestionsProps {
  content: string;
  cursorPosition: number;
  isEnabled: boolean;
  onAccept: (suggestion: string) => void;
  onReject: () => void;
}

export default function AIInlineSuggestions({
  content,
  cursorPosition,
  isEnabled,
  onAccept,
  onReject,
}: AIInlineSuggestionsProps) {
  const [suggestion, setSuggestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestRef = useRef<string>('');

  // Debounced AI suggestion generator
  const generateSuggestion = useCallback(async (text: string, cursor: number) => {
    if (!isEnabled || text.length < 10) {
      setSuggestion('');
      return;
    }

    // Get context before cursor
    const textBeforeCursor = text.slice(0, cursor);
    const textAfterCursor = text.slice(cursor);

    // Only suggest if cursor is at the end of a word or sentence
    const lastChar = textBeforeCursor.slice(-1);
    const shouldSuggest = lastChar === ' ' || lastChar === '\n' || lastChar === '.' || lastChar === ',';

    if (!shouldSuggest) {
      setSuggestion('');
      return;
    }

    // Don't re-generate if we just requested the same context
    const contextKey = textBeforeCursor.slice(-100); // Last 100 chars
    if (contextKey === lastRequestRef.current) {
      return;
    }
    lastRequestRef.current = contextKey;

    setIsLoading(true);

    try {
      // Get last paragraph for context
      const paragraphs = textBeforeCursor.split('\n\n');
      const currentParagraph = paragraphs[paragraphs.length - 1] || '';
      
      // Get last 2-3 sentences for immediate context
      const sentences = currentParagraph.split(/[.!?]\s+/);
      const recentContext = sentences.slice(-3).join('. ');

      // Build prompt for AI
      const prompt = `You are a writing assistant. Given the user's text, suggest the next 1-2 sentences that naturally continue their writing.

CONTEXT (full paragraph):
${currentParagraph}

RECENT TEXT (what they just wrote):
${recentContext}

REQUIREMENTS:
- Suggest ONLY the next 1-2 sentences
- Match the user's writing style and tone
- Be helpful but not overly verbose
- Stay on topic
- Don't repeat what they already wrote
- If they're making a list, continue the list
- If they're explaining something, continue the explanation

Provide ONLY the suggestion, no explanations or meta-commentary:`;

      const response = await aiService.generateContent(prompt, {
        maxTokens: 100,
        temperature: 0.7,
        systemPrompt: 'You are a helpful writing assistant. Continue the user\'s text naturally, matching their style and tone. Provide only the continuation, no explanations.',
      });

      const cleanSuggestion = response.trim();
      
      // Only show suggestion if it's reasonable
      if (cleanSuggestion.length > 0 && cleanSuggestion.length < 200) {
        setSuggestion(cleanSuggestion);
        setShowHint(true);
        
        // Hide hint after 3 seconds
        setTimeout(() => setShowHint(false), 3000);
      } else {
        setSuggestion('');
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      setSuggestion('');
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);

  // Debounce typing to avoid too many AI calls
  useEffect(() => {
    if (!isEnabled) {
      setSuggestion('');
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer - wait 1.5 seconds after user stops typing
    debounceTimerRef.current = setTimeout(() => {
      generateSuggestion(content, cursorPosition);
    }, 1500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [content, cursorPosition, isEnabled, generateSuggestion]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!suggestion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && suggestion) {
        e.preventDefault();
        onAccept(suggestion);
        setSuggestion('');
        setShowHint(false);
      } else if (e.key === 'Escape' && suggestion) {
        e.preventDefault();
        onReject();
        setSuggestion('');
        setShowHint(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [suggestion, onAccept, onReject]);

  // Don't render anything if no suggestion
  if (!suggestion && !isLoading) return null;

  return (
    <>
      {/* Hint badge */}
      {showHint && suggestion && (
        <div className="ai-suggestion-hint">
          <Sparkles className="w-3 h-3" />
          <span>AI suggestion ready</span>
          <kbd>Tab</kbd>
          <span className="text-muted-foreground">to accept</span>
          <kbd>Esc</kbd>
          <span className="text-muted-foreground">to reject</span>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="ai-suggestion-loading">
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>AI thinking...</span>
        </div>
      )}

      <style>{`
        .ai-suggestion-hint {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
          z-index: 1000;
          animation: slideInUp 0.3s ease-out;
        }

        .ai-suggestion-hint kbd {
          display: inline-block;
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          font-family: monospace;
        }

        .ai-suggestion-loading {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 12px;
          color: #6b7280;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          z-index: 1000;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .ai-suggestion-loading {
            background: #1f2937;
            border-color: #374151;
            color: #d1d5db;
          }
        }
      `}</style>
    </>
  );
}

/**
 * Hook to manage AI inline suggestions
 */
export function useAIInlineSuggestions(
  content: string,
  cursorPosition: number,
  enabled: boolean
) {
  const [ghostText, setGhostText] = useState<string>('');

  const handleAccept = useCallback((suggestion: string) => {
    setGhostText(suggestion);
  }, []);

  const handleReject = useCallback(() => {
    setGhostText('');
  }, []);

  // Clear ghost text when content changes (user is typing)
  useEffect(() => {
    setGhostText('');
  }, [content]);

  return {
    ghostText,
    handleAccept,
    handleReject,
    clearGhostText: () => setGhostText(''),
  };
}

