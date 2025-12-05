/**
 * PDF Embed Node Extension for TipTap
 * Supports [pdf:URL] syntax
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface PDFOptions {
  width: string;
  height: string;
}

export const PDFNode = Node.create<PDFOptions>({
  name: 'pdf',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      width: '100%',
      height: '600px',
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('data-pdf-src'),
        renderHTML: attributes => ({
          'data-pdf-src': attributes.src,
        }),
      },
      width: {
        default: this.options.width,
      },
      height: {
        default: this.options.height,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-pdf-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes['data-pdf-src'];
    // Clean up any bracket artifacts
    const cleanSrc = src ? src.replace(/^\[+/, '').replace(/\]+$/, '') : '';
    // Use Google Docs viewer for better browser compatibility
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(cleanSrc)}&embedded=true`;
    
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-pdf-embed': '',
        'data-pdf-src': cleanSrc,
        class: 'pdf-embed',
      }),
      [
        'iframe',
        {
          src: viewerUrl,
          width: HTMLAttributes.width || this.options.width,
          height: HTMLAttributes.height || this.options.height,
        },
      ],
    ];
  },

  addCommands() {
    return {
      setPDF:
        (src: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src,
            },
          });
        },
    };
  },
});

