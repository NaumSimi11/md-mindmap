/**
 * YouTube Embed Node Extension for TipTap
 * Supports both [youtube:ID] and direct URL syntax
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface YouTubeOptions {
  width: number;
  height: number;
  allowFullscreen: boolean;
}

export const YouTubeNode = Node.create<YouTubeOptions>({
  name: 'youtube',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      width: 640,
      height: 360,
      allowFullscreen: true,
    };
  },

  addAttributes() {
    return {
      videoId: {
        default: null,
        parseHTML: element => element.getAttribute('data-video-id'),
        renderHTML: attributes => ({
          'data-video-id': attributes.videoId,
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
        tag: 'div[data-youtube-video]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const videoId = HTMLAttributes['data-video-id'];
    const width = HTMLAttributes.width || this.options.width;
    
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-youtube-video': '',
        class: 'youtube-embed',
        style: width ? `max-width: ${width}px; width: 100%;` : '',
      }),
      [
        'iframe',
        {
          src: `https://www.youtube.com/embed/${videoId}`,
          frameborder: '0',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: this.options.allowFullscreen ? 'true' : 'false',
        },
      ],
    ];
  },

  addCommands() {
    return {
      setYouTubeVideo:
        (videoId: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              videoId,
            },
          });
        },
    };
  },
});

