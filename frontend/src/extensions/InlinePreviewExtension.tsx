/**
 * TipTap Extension for Inline Preview
 * 
 * Renders AI-generated content previews directly in the document
 * using ProseMirror decorations.
 */

import React from 'react';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { createRoot, Root } from 'react-dom/client';
import { InlinePreviewWidget } from '@/components/editor/InlinePreviewWidget';
import { StagedContent } from '@/stores/aiStagingStore';

export interface InlinePreviewData {
  stagedContent: StagedContent;
  position: number;
  currentPosition: string;
  availablePositions: string[];
  onAccept: () => void;
  onReject: () => void;
  onChangePosition: (position: string) => void;
}

export const InlinePreviewExtension = Extension.create({
  name: 'inlinePreview',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('inlinePreview'),
        
        state: {
          init() {
            return {
              decorationSet: DecorationSet.empty,
              previewData: null as InlinePreviewData | null,
              reactRoot: null as Root | null,
            };
          },
          
          apply(tr, pluginState, oldState, newState) {
            // Check for preview commands
            const showPreview = tr.getMeta('showInlinePreview') as InlinePreviewData | undefined;
            const hidePreview = tr.getMeta('hideInlinePreview');
            
            if (hidePreview) {
              // Clean up React root if it exists
              if (pluginState.reactRoot) {
                pluginState.reactRoot.unmount();
              }
              
              return {
                decorationSet: DecorationSet.empty,
                previewData: null,
                reactRoot: null,
              };
            }
            
            if (showPreview) {
              // Clean up old root if exists
              if (pluginState.reactRoot) {
                pluginState.reactRoot.unmount();
              }
              
              // Create decoration widget
              const decoration = Decoration.widget(
                showPreview.position,
                (view) => {
                  const container = document.createElement('div');
                  container.className = 'inline-preview-container';
                  
                  // Create React root and render
                  const root = createRoot(container);
                  root.render(
                    <InlinePreviewWidget
                      stagedContent={showPreview.stagedContent}
                      currentPosition={showPreview.currentPosition}
                      availablePositions={showPreview.availablePositions}
                      onAccept={() => {
                        showPreview.onAccept();
                        // Hide preview after accept
                        view.dispatch(
                          view.state.tr.setMeta('hideInlinePreview', true)
                        );
                      }}
                      onReject={() => {
                        showPreview.onReject();
                        // Hide preview after reject
                        view.dispatch(
                          view.state.tr.setMeta('hideInlinePreview', true)
                        );
                      }}
                      onChangePosition={(newPosition) => {
                        showPreview.onChangePosition(newPosition);
                        // Preview will be re-rendered with new position
                      }}
                    />
                  );
                  
                  return container;
                },
                {
                  side: 1,
                  stopEvent: () => true, // Prevent editor from handling events inside widget
                }
              );
              
              const decorationSet = DecorationSet.create(newState.doc, [decoration]);
              
              return {
                decorationSet,
                previewData: showPreview,
                reactRoot: null, // Root is managed inside widget creation
              };
            }
            
            // Map decorations through document changes
            if (pluginState.decorationSet) {
              return {
                ...pluginState,
                decorationSet: pluginState.decorationSet.map(tr.mapping, tr.doc),
              };
            }
            
            return pluginState;
          },
        },
        
        props: {
          decorations(state) {
            const pluginState = this.getState(state);
            return pluginState?.decorationSet || DecorationSet.empty;
          },
        },
      }),
    ];
  },
});

/**
 * Helper function to show inline preview in editor
 */
export function showInlinePreview(
  editor: any,
  data: InlinePreviewData
) {
  editor.view.dispatch(
    editor.state.tr.setMeta('showInlinePreview', data)
  );
}

/**
 * Helper function to hide inline preview
 */
export function hideInlinePreview(editor: any) {
  editor.view.dispatch(
    editor.state.tr.setMeta('hideInlinePreview', true)
  );
}

/**
 * Calculate position in document for insertion
 */
export function calculateInsertionPosition(
  editor: any,
  positionSpec: 'start' | 'end' | { after: string } | { before: string }
): number {
  const doc = editor.state.doc;
  
  if (positionSpec === 'start') {
    return 0;
  }
  
  if (positionSpec === 'end') {
    return doc.content.size;
  }
  
  // Find section by name
  if ('after' in positionSpec || 'before' in positionSpec) {
    const targetSection = 'after' in positionSpec ? positionSpec.after : positionSpec.before;
    const searchLower = targetSection.toLowerCase();
    
    let foundPosition = -1;
    
    doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const headingText = node.textContent.toLowerCase();
        if (headingText.includes(searchLower) || searchLower.includes(headingText)) {
          if ('after' in positionSpec) {
            // Position after this heading and its content
            foundPosition = pos + node.nodeSize;
          } else {
            // Position before this heading
            foundPosition = pos;
          }
          return false; // Stop searching
        }
      }
    });
    
    if (foundPosition !== -1) {
      return foundPosition;
    }
  }
  
  // Default to end if section not found
  return doc.content.size;
}

/**
 * Get available positions for insertion
 */
export function getAvailablePositions(editor: any): string[] {
  const positions: string[] = ['Start of document', 'End of document'];
  
  // Extract all headings
  editor.state.doc.descendants((node: any) => {
    if (node.type.name === 'heading') {
      const headingText = node.textContent;
      positions.push(`After "${headingText}"`);
      positions.push(`Before "${headingText}"`);
    }
  });
  
  return positions;
}

