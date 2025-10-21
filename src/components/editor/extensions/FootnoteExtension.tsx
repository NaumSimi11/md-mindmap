/**
 * Footnote Extension for TipTap
 * Supports [^1] reference syntax and hover previews
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';

// Footnote Reference Node (appears inline like [1])
export const FootnoteReference = Node.create({
  name: 'footnoteReference',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-footnote-id'),
        renderHTML: attributes => ({
          'data-footnote-id': attributes.id,
          class: 'footnote-ref',
        }),
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-footnote-label'),
        renderHTML: attributes => ({
          'data-footnote-label': attributes.label,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'sup[data-footnote-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const label = HTMLAttributes['data-footnote-label'] || '?';
    return [
      'sup',
      mergeAttributes(HTMLAttributes, {
        class: 'footnote-ref',
      }),
      [
        'a',
        {
          href: `#fn-${HTMLAttributes['data-footnote-id']}`,
          id: `fnref-${HTMLAttributes['data-footnote-id']}`,
          class: 'footnote-ref-link',
        },
        `[${label}]`,
      ],
    ];
  },

  addCommands() {
    return {
      setFootnoteReference:
        (id: string, label: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { id, label },
          });
        },
    };
  },
});

// Footnote Definition Node (appears at bottom of document)
export const FootnoteDefinition = Node.create({
  name: 'footnoteDefinition',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-footnote-id'),
        renderHTML: attributes => ({
          'data-footnote-id': attributes.id,
          id: `fn-${attributes.id}`,
          class: 'footnote-def',
        }),
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-footnote-label'),
        renderHTML: attributes => ({
          'data-footnote-label': attributes.label,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-footnote-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const label = HTMLAttributes['data-footnote-label'] || '?';
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'footnote-def',
      }),
      [
        'a',
        {
          href: `#fnref-${HTMLAttributes['data-footnote-id']}`,
          class: 'footnote-backref',
        },
        `[${label}]`,
      ],
      ' ',
      ['div', { class: 'footnote-content' }, 0],
    ];
  },

  addCommands() {
    return {
      setFootnoteDefinition:
        (id: string, label: string, content: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { id, label },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: content }],
              },
            ],
          });
        },
    };
  },
});

// Footnotes Container (wraps all footnote definitions)
export const FootnotesSection = Node.create({
  name: 'footnotesSection',
  group: 'block',
  content: 'footnoteDefinition+',
  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div.footnotes-section',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'footnotes-section',
      }),
      ['hr', { class: 'footnotes-separator' }],
      0,
    ];
  },
});

