import { Node, mergeAttributes } from '@tiptap/core';

export const FontAwesomeIcon = Node.create({
  name: 'fontawesomeIcon',
  group: 'inline',
  inline: true,
  atom: true, // Cannot be split or have cursor inside
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      icon: {
        default: null,
        parseHTML: element => element.getAttribute('data-fa-icon'),
        renderHTML: attributes => {
          if (!attributes.icon) {
            return {};
          }
          return {
            'data-fa-icon': attributes.icon,
          };
        },
      },
      style: {
        default: 'solid', // solid, regular, brands
        parseHTML: element => element.getAttribute('data-fa-style'),
        renderHTML: attributes => {
          return {
            'data-fa-style': attributes.style || 'solid',
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'i[data-fa-icon]',
        getAttrs: element => ({
          icon: (element as HTMLElement).getAttribute('data-fa-icon'),
          style: (element as HTMLElement).getAttribute('data-fa-style') || 'solid',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const icon = HTMLAttributes['data-fa-icon'];
    const style = HTMLAttributes['data-fa-style'] || 'solid';
    
    // Map style to FontAwesome prefix
    const prefix = style === 'brands' ? 'fab' : style === 'regular' ? 'far' : 'fas';
    
    return [
      'i',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: `${prefix} fa-${icon}`,
        'data-fa-icon': icon,
        'data-fa-style': style,
        'aria-hidden': 'true',
      }),
    ];
  },

  addCommands() {
    return {
      insertFontAwesomeIcon: (icon: string, style: string = 'solid') => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { icon, style },
        });
      },
    };
  },
});
