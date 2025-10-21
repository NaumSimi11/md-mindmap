import { Node, mergeAttributes } from '@tiptap/core';

export interface VimeoOptions {
  width: number;
  height: number;
}

export const VimeoNode = Node.create<VimeoOptions>({
  name: 'vimeo',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      width: 640,
      height: 360,
    };
  },

  addAttributes() {
    return {
      videoId: {
        default: null,
        parseHTML: element => element.getAttribute('data-video-id'),
        renderHTML: attributes => {
          return {
            'data-video-id': attributes.videoId,
          };
        },
      },
      width: {
        default: this.options.width,
        parseHTML: element => element.getAttribute('width'),
      },
      height: {
        default: this.options.height,
        parseHTML: element => element.getAttribute('height'),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-vimeo-video]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const videoId = HTMLAttributes['data-video-id'];
    const width = HTMLAttributes.width;
    
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-vimeo-video': '',
        class: 'vimeo-embed',
        style: width ? `max-width: ${width}px; width: 100%;` : '',
      }),
      [
        'iframe',
        {
          src: `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`,
          frameborder: '0',
          allow: 'autoplay; fullscreen; picture-in-picture',
          allowfullscreen: 'true',
        },
      ],
    ];
  },

  addCommands() {
    return {
      setVimeoVideo: (videoId: string) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { videoId },
        });
      },
    };
  },
});

