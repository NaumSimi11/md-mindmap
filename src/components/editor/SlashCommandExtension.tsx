/**
 * TipTap Slash Command Extension
 * Shows command menu when user types "/"
 */

import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Code,
  Quote,
  Table,
  Library,
  Sparkles,
  Image as ImageIcon,
  Minus,
} from 'lucide-react';

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (props: any) => void;
  category: 'basic' | 'ai' | 'advanced';
}

interface SlashCommandsListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

const SlashCommandsList = forwardRef<any, SlashCommandsListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="slash-commands bg-popover border border-border rounded-lg shadow-lg w-72 max-h-[400px] flex flex-col">
      <div className="overflow-y-auto p-2">
        {props.items.map((item, index) => (
          <button
            key={index}
            onClick={() => selectItem(index)}
            className={`flex items-start gap-3 w-full p-2 rounded-md text-left transition-colors ${
              index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
          >
            <div className="mt-0.5 text-muted-foreground">{item.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{item.title}</div>
              <div className="text-xs text-muted-foreground truncate">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

SlashCommandsList.displayName = 'SlashCommandsList';

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const createSlashCommands = (
  onInsertDiagram: () => void,
  onAIAction: (action: string) => void
): SlashCommandItem[] => {
  return [
    // BASIC FORMATTING
    {
      title: 'Heading 1',
      description: 'Large section heading',
      icon: <Heading1 className="w-4 h-4" />,
      category: 'basic',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: <Heading2 className="w-4 h-4" />,
      category: 'basic',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      title: 'Heading 3',
      description: 'Small section heading',
      icon: <Heading3 className="w-4 h-4" />,
      category: 'basic',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
      },
    },
    {
      title: 'Bullet List',
      description: 'Create a bullet list',
      icon: <List className="w-4 h-4" />,
      category: 'basic',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Numbered List',
      description: 'Create a numbered list',
      icon: <ListOrdered className="w-4 h-4" />,
      category: 'basic',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: 'Task List',
      description: 'Create a checklist',
      icon: <ListTodo className="w-4 h-4" />,
      category: 'basic',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: 'Code Block',
      description: 'Insert a code block',
      icon: <Code className="w-4 h-4" />,
      category: 'basic',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setCodeBlock().run();
      },
    },
    {
      title: 'Quote',
      description: 'Insert a blockquote',
      icon: <Quote className="w-4 h-4" />,
      category: 'basic',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: 'Divider',
      description: 'Insert a horizontal line',
      icon: <Minus className="w-4 h-4" />,
      category: 'basic',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },

    // ADVANCED
    {
      title: 'Table',
      description: 'Insert a table',
      icon: <Table className="w-4 h-4" />,
      category: 'advanced',
      command: ({ editor, range }: any) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
      },
    },
    {
      title: 'Diagram',
      description: 'Insert a Mermaid diagram',
      icon: <Library className="w-4 h-4" />,
      category: 'advanced',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).run();
        onInsertDiagram();
      },
    },
    {
      title: 'Image',
      description: 'Insert an image',
      icon: <ImageIcon className="w-4 h-4" />,
      category: 'advanced',
      command: ({ editor, range }: any) => {
        const url = prompt('Enter image URL:');
        if (url) {
          editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
        } else {
          editor.chain().focus().deleteRange(range).run();
        }
      },
    },

    // AI ACTIONS
    {
      title: 'Continue Writing',
      description: 'AI continues your text',
      icon: <Sparkles className="w-4 h-4 text-purple-500" />,
      category: 'ai',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).run();
        onAIAction('continue');
      },
    },
    {
      title: 'Improve Writing',
      description: 'AI improves your text',
      icon: <Sparkles className="w-4 h-4 text-blue-500" />,
      category: 'ai',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).run();
        onAIAction('improve');
      },
    },
    {
      title: 'Summarize',
      description: 'AI creates a summary',
      icon: <Sparkles className="w-4 h-4 text-green-500" />,
      category: 'ai',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).run();
        onAIAction('summarize');
      },
    },
  ];
};

export const slashCommandSuggestion = (
  onInsertDiagram: () => void,
  onAIAction: (action: string) => void
) => {
  return {
    items: ({ query }: { query: string }) => {
      const commands = createSlashCommands(onInsertDiagram, onAIAction);
      return commands.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      );
    },

    render: () => {
      let component: ReactRenderer<any>;
      let popup: TippyInstance[];

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(SlashCommandsList, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          });
        },

        onUpdate(props: any) {
          component.updateProps(props);

          if (!props.clientRect) {
            return;
          }

          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          });
        },

        onKeyDown(props: any) {
          if (props.event.key === 'Escape') {
            popup[0].hide();
            return true;
          }

          return component.ref?.onKeyDown(props);
        },

        onExit() {
          popup[0].destroy();
          component.destroy();
        },
      };
    },
  };
};
