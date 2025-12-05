import { Node, mergeAttributes } from '@tiptap/core';

export const GistNode = Node.create({
  name: 'gist',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      gistId: {
        default: null,
        parseHTML: element => element.getAttribute('data-gist-id'),
        renderHTML: attributes => {
          return {
            'data-gist-id': attributes.gistId,
          };
        },
      },
      file: {
        default: null,
        parseHTML: element => element.getAttribute('data-gist-file'),
        renderHTML: attributes => {
          if (!attributes.file) return {};
          return {
            'data-gist-file': attributes.file,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-gist-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const gistId = HTMLAttributes['data-gist-id'];
    const file = HTMLAttributes['data-gist-file'];
    
    // Build Gist embed URL
    let gistUrl = `https://gist.github.com/${gistId}.js`;
    if (file) {
      gistUrl += `?file=${file}`;
    }
    
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-gist-embed': '',
        'data-gist-id': gistId,
        class: 'gist-embed',
      }),
      [
        'script',
        {
          src: gistUrl,
        },
      ],
      // Fallback link if script doesn't load
      [
        'noscript',
        {},
        [
          'a',
          {
            href: `https://gist.github.com/${gistId}`,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
          `View Gist: ${gistId}`,
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setGist: (gistId: string, file?: string) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { gistId, file },
        });
      },
    };
  },
});

