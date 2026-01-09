/**
 * AI Autocomplete Extension - GitHub Copilot Style
 * Provides inline AI suggestions as you type
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface AIAutocompleteOptions {
  enabled: boolean;
  onSuggestion: (context: string) => Promise<string>;
  debounceMs: number;
  minChars: number;
}

export const AIAutocompleteExtension = Extension.create<AIAutocompleteOptions>({
  name: 'aiAutocomplete',

  addOptions() {
    return {
      enabled: true,
      debounceMs: 1000,
      minChars: 20,
      onSuggestion: async () => '',
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    let debounceTimer: NodeJS.Timeout | null = null;
    let currentSuggestion = '';
    let suggestionPos = -1;
    let lastAcceptedTime = 0;
    let lastSuggestionText = '';

    return [
      new Plugin({
        key: new PluginKey('aiAutocomplete'),

        state: {
          init() {
            return DecorationSet.empty;
          },

          apply(tr, decorationSet, oldState, newState) {
            // Clear decorations if disabled
            if (!options.enabled) {
              currentSuggestion = '';
              suggestionPos = -1;
              return DecorationSet.empty;
            }

            // Map decorations through transaction
            decorationSet = decorationSet.map(tr.mapping, tr.doc);

            // If user accepted suggestion (pressed Tab), clear it
            if (tr.getMeta('acceptSuggestion')) {
              currentSuggestion = '';
              suggestionPos = -1;
              return DecorationSet.empty;
            }

            // If user rejected suggestion (pressed Esc), clear it
            if (tr.getMeta('rejectSuggestion')) {
              currentSuggestion = '';
              suggestionPos = -1;
              return DecorationSet.empty;
            }

            // If there's a current suggestion, show it
            if (currentSuggestion && suggestionPos >= 0) {
              const decoration = Decoration.widget(
                suggestionPos,
                () => {
                  const span = document.createElement('span');
                  span.className = 'ai-autocomplete-suggestion';
                  span.textContent = currentSuggestion;
                  span.style.opacity = '0.4';
                  span.style.color = 'var(--primary)';
                  span.style.fontStyle = 'italic';
                  return span;
                },
                { side: 1 }
              );
              return DecorationSet.create(tr.doc, [decoration]);
            }

            return decorationSet;
          },
        },

        props: {
          handleKeyDown(view, event) {
            // Accept suggestion with Tab or Right Arrow
            if (currentSuggestion && (event.key === 'Tab' || event.key === 'ArrowRight')) {
              event.preventDefault();
              
              const tr = view.state.tr;
              tr.insertText(currentSuggestion, suggestionPos);
              tr.setMeta('acceptSuggestion', true);
              view.dispatch(tr);
              
              // Record acceptance to prevent immediate re-trigger
              lastAcceptedTime = Date.now();
              lastSuggestionText = currentSuggestion;
              
              currentSuggestion = '';
              suggestionPos = -1;
              return true;
            }

            // Reject suggestion with Escape
            if (currentSuggestion && event.key === 'Escape') {
              event.preventDefault();
              
              const tr = view.state.tr;
              tr.setMeta('rejectSuggestion', true);
              view.dispatch(tr);
              
              currentSuggestion = '';
              suggestionPos = -1;
              return true;
            }

            // Clear suggestion on any other key
            if (currentSuggestion && !['Tab', 'ArrowRight', 'Escape'].includes(event.key)) {
              currentSuggestion = '';
              suggestionPos = -1;
              
              const tr = view.state.tr;
              tr.setMeta('rejectSuggestion', true);
              view.dispatch(tr);
            }

            return false;
          },

          decorations(state) {
            return this.getState(state);
          },
        },

        view(editorView) {
          const handleInput = () => {
            if (!options.enabled) return;

            // Cooldown period after accepting a suggestion (3 seconds)
            const timeSinceAccept = Date.now() - lastAcceptedTime;
            if (timeSinceAccept < 3000) {
              return;
            }

            // Clear existing timer
            if (debounceTimer) {
              clearTimeout(debounceTimer);
            }

            // Get current content
            const { state } = editorView;
            const { selection } = state;
            const text = state.doc.textBetween(0, selection.from, '\n');

            // Only trigger if we have enough content
            if (text.length < options.minChars) {
              return;
            }

            // Get context (last 200 chars before cursor)
            const contextStart = Math.max(0, text.length - 200);
            const context = text.slice(contextStart);

            // Debounce AI call
            debounceTimer = setTimeout(async () => {
              try {
                const suggestion = await options.onSuggestion(context);

                // Avoid suggesting the same text again
                if (suggestion && suggestion.trim() && suggestion !== lastSuggestionText) {
                  currentSuggestion = suggestion;
                  suggestionPos = selection.from;

                  // Trigger view update
                  const tr = editorView.state.tr;
                  tr.setMeta('updateSuggestion', true);
                  editorView.dispatch(tr);

                } else if (suggestion === lastSuggestionText) {
                }
              } catch (error) {
                console.error('❌ AI Autocomplete error:', error);
              }
            }, options.debounceMs);
          };

          // Listen to input events
          editorView.dom.addEventListener('input', handleInput);

          return {
            destroy() {
              if (debounceTimer) {
                clearTimeout(debounceTimer);
              }
              editorView.dom.removeEventListener('input', handleInput);
            },
          };
        },
      }),
    ];
  },
});

