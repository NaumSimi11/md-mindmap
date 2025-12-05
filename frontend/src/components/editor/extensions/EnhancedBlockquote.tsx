import { Node, mergeAttributes } from '@tiptap/core';

export interface BlockquoteOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    enhancedBlockquote: {
      /**
       * Set a blockquote node
       */
      setBlockquote: () => ReturnType;
      /**
       * Toggle a blockquote node
       */
      toggleBlockquote: () => ReturnType;
      /**
       * Unset a blockquote node
       */
      unsetBlockquote: () => ReturnType;
      /**
       * Set blockquote type
       */
      setBlockquoteType: (type: string) => ReturnType;
    };
  }
}

export const EnhancedBlockquote = Node.create<BlockquoteOptions>({
  name: 'blockquote',
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  content: 'block+',

  group: 'block',

  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'default',
        parseHTML: element => element.getAttribute('data-blockquote-type') || 'default',
        renderHTML: attributes => {
          if (attributes.type === 'default') {
            return {};
          }
          return {
            'data-blockquote-type': attributes.type,
            class: `blockquote-${attributes.type}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      { 
        tag: 'blockquote',
        getAttrs: node => {
          const elem = node as HTMLElement;
          const type = elem.getAttribute('data-blockquote-type') || 'default';
          return { type };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['blockquote', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setBlockquote:
        () =>
        ({ commands }) => {
          return commands.wrapIn(this.name);
        },
      toggleBlockquote:
        () =>
        ({ commands }) => {
          return commands.toggleWrap(this.name);
        },
      unsetBlockquote:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
      setBlockquoteType:
        (type: string) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { type });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-b': () => this.editor.commands.toggleBlockquote(),
    };
  },
});

