import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import TOCNodeView from './TOCNodeView';

export const TOCNode = Node.create({
  name: 'toc',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      placeholder: {
        default: true,
        parseHTML: element => element.getAttribute('data-toc-placeholder') === 'true',
        renderHTML: attributes => {
          return {
            'data-toc-placeholder': attributes.placeholder,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-toc]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // 🔧 FIX: Remove the '0' (content hole) since this is an atom node with no children
    return ['div', mergeAttributes(HTMLAttributes, { 'data-toc': '', class: 'toc-placeholder' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TOCNodeView);
  },

  addCommands() {
    return {
      insertTOC: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { placeholder: true },
        });
      },
    };
  },
});

