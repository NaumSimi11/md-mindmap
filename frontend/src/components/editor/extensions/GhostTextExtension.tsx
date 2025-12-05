/**
 * Ghost Text Extension for AI Inline Hints
 * Shows AI suggestions as you type
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface GhostTextOptions {
  isEnabled: () => boolean;
  onTrigger: (context: string) => Promise<string | null>;
  debounceMs: number;
}

let triggerTimeout: NodeJS.Timeout | null = null;
let currentSuggestion: string | null = null;

export const GhostTextExtension = Extension.create<GhostTextOptions>({
  name: 'ghostText',

  addOptions() {
    return {
      isEnabled: () => false,
      onTrigger: async () => null,
      debounceMs: 800,
    };
  },

  onCreate() {
    console.log('🎯 GhostTextExtension CREATED! Enabled:', this.options.isEnabled());
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: new PluginKey('ghostText'),

        state: {
          init() {
            console.log('🔌 GhostText Plugin STATE initialized');
            return DecorationSet.empty;
          },

          apply(tr, decorationSet) {
            // Map decorations
            decorationSet = decorationSet.map(tr.mapping, tr.doc);

            // Clear on user typing
            if (tr.docChanged && !tr.getMeta('ghostText')) {
              const enabled = extension.options.isEnabled();
              console.log('⌨️ User typed! Enabled:', enabled);
              
              currentSuggestion = null;
              if (triggerTimeout) clearTimeout(triggerTimeout);
              
              // Trigger new suggestion after delay
              triggerTimeout = setTimeout(() => {
                const enabledNow = extension.options.isEnabled();
                console.log('⏱️ Timeout fired! Enabled:', enabledNow);
                
                if (!enabledNow) {
                  console.log('❌ Extension is DISABLED, skipping...');
                  return;
                }
                
                const text = tr.doc.textContent;
                console.log('📝 Text length:', text.length, 'Last char:', text[text.length - 1]);
                
                if (text.length < 15) {
                  console.log('❌ Text too short, skipping...');
                  return;
                }
                
                if (text[text.length - 1] !== ' ') {
                  console.log('❌ Does not end with space, skipping...');
                  return;
                }
                
                const context = text.slice(Math.max(0, text.length - 500));
                console.log('🤖 Triggering AI with context:', context.slice(-50));
                
                extension.options.onTrigger(context).then(suggestion => {
                  if (suggestion) {
                    console.log('✅ Got suggestion:', suggestion);
                    const view = (extension.editor as any).view;
                    if (view) {
                      const tr = view.state.tr;
                      tr.setMeta('ghostText', { show: true, suggestion: ' ' + suggestion });
                      view.dispatch(tr);
                    }
                  } else {
                    console.log('❌ No suggestion returned');
                  }
                });
              }, extension.options.debounceMs);
              
              return DecorationSet.empty;
            }

            // Show ghost text
            const meta = tr.getMeta('ghostText');
            if (meta?.show && meta.suggestion) {
              console.log('👻 Showing ghost text:', meta.suggestion);
              currentSuggestion = meta.suggestion;
              const pos = tr.selection.$anchor.pos;

              const decoration = Decoration.widget(pos, () => {
                const span = document.createElement('span');
                span.className = 'ghost-text';
                span.textContent = meta.suggestion;
                span.style.color = '#888';
                span.style.opacity = '0.6';
                span.style.fontStyle = 'italic';
                return span;
              });

              return DecorationSet.create(tr.doc, [decoration]);
            }

            if (meta?.clear) {
              currentSuggestion = null;
              return DecorationSet.empty;
            }

            return decorationSet;
          },
        },

        props: {
          decorations(state) {
            return this.getState(state);
          },

          handleKeyDown(view, event) {
            if (!currentSuggestion) return false;

            // Tab - Accept
            if (event.key === 'Tab' && !event.shiftKey) {
              event.preventDefault();
              console.log('✅ Accepting suggestion:', currentSuggestion);
              const tr = view.state.tr;
              tr.insertText(currentSuggestion);
              tr.setMeta('ghostText', { clear: true });
              view.dispatch(tr);
              currentSuggestion = null;
              return true;
            }

            // Esc - Reject
            if (event.key === 'Escape') {
              event.preventDefault();
              console.log('❌ Rejecting suggestion');
              const tr = view.state.tr;
              tr.setMeta('ghostText', { clear: true });
              view.dispatch(tr);
              currentSuggestion = null;
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});
