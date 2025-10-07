/**
 * SlashCommandMenu - Modern slash command menu for quick insertions
 * Type '/' to trigger this menu
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Image,
  Link,
  Table,
  Quote,
  Minus,
  CheckSquare,
  Sparkles,
  Brain,
  FileImage,
  Calendar,
  AlertCircle,
  FileText,
  Presentation,
  BookOpen,
  Rocket,
  Users
} from 'lucide-react';
import { templateService, type Template } from '@/services/TemplateService';
import { templateShortcuts } from '@/data/templates';

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'basic' | 'advanced' | 'ai' | 'templates';
  action: () => void;
  keywords: string[];
}

interface SlashCommandMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  searchQuery: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  commands: SlashCommand[];
}

interface SlashCommandMenuComponentProps {
  isOpen: boolean;
  position: { x: number; y: number };
  searchQuery: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  commands: SlashCommand[];
}

export default function SlashCommandMenu({
  isOpen,
  position,
  searchQuery,
  onSelect,
  onClose,
  commands,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([]);

  // Filter commands based on search query
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = commands.filter((cmd) =>
      cmd.label.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query) ||
      cmd.keywords.some((kw) => kw.toLowerCase().includes(query))
    );
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [searchQuery, commands]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onSelect, onClose]);

  if (!isOpen || filteredCommands.length === 0) return null;

  // Group commands by category
  const basicCommands = filteredCommands.filter((c) => c.category === 'basic');
  const advancedCommands = filteredCommands.filter((c) => c.category === 'advanced');
  const aiCommands = filteredCommands.filter((c) => c.category === 'ai');
  const templateCommands = filteredCommands.filter((c) => c.category === 'templates');

  const renderCommandGroup = (title: string, cmds: SlashCommand[], startIdx: number) => {
    if (cmds.length === 0) return null;
    
    return (
      <div className="slash-command-group">
        <div className="slash-command-group-title">{title}</div>
        {cmds.map((cmd, idx) => {
          const globalIdx = startIdx + idx;
          return (
            <button
              key={cmd.id}
              className={`slash-command-item ${selectedIndex === globalIdx ? 'selected' : ''}`}
              onClick={() => onSelect(cmd)}
              onMouseEnter={() => setSelectedIndex(globalIdx)}
            >
              <div className="slash-command-icon">{cmd.icon}</div>
              <div className="slash-command-content">
                <div className="slash-command-label">{cmd.label}</div>
                <div className="slash-command-description">{cmd.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  let currentIdx = 0;
  
  return (
    <div 
      className="slash-command-menu"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
      }}
    >
      <div className="slash-command-menu-content">
        {renderCommandGroup('Basic Blocks', basicCommands, currentIdx)}
        {(() => { currentIdx += basicCommands.length; return null; })()}
        
        {renderCommandGroup('Advanced', advancedCommands, currentIdx)}
        {(() => { currentIdx += advancedCommands.length; return null; })()}
        
        {renderCommandGroup('AI-Powered', aiCommands, currentIdx)}
        {(() => { currentIdx += aiCommands.length; return null; })()}

        {renderCommandGroup('Templates', templateCommands, currentIdx)}

        {filteredCommands.length === 0 && (
          <div className="slash-command-empty">
            <AlertCircle className="w-4 h-4 text-gray-400" />
            <span>No commands found</span>
          </div>
        )}
      </div>

      <style>{`
        .slash-command-menu {
          position: fixed;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
        }

        .slash-command-menu-content {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          min-width: 320px;
          max-width: 400px;
          max-height: 400px;
          overflow-y: auto;
        }

        .slash-command-group {
          border-bottom: 1px solid #f3f4f6;
        }

        .slash-command-group:last-child {
          border-bottom: none;
        }

        .slash-command-group-title {
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #6b7280;
          background: #f9fafb;
          letter-spacing: 0.5px;
        }

        .slash-command-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          width: 100%;
          border: none;
          background: white;
          cursor: pointer;
          transition: background-color 0.15s;
          text-align: left;
        }

        .slash-command-item:hover,
        .slash-command-item.selected {
          background: #f3f4f6;
        }

        .slash-command-item.selected {
          background: linear-gradient(to right, #ede9fe, #f3f4f6);
        }

        .slash-command-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          border-radius: 8px;
          color: white;
          flex-shrink: 0;
        }

        .slash-command-icon svg {
          width: 18px;
          height: 18px;
        }

        .slash-command-content {
          flex: 1;
          min-width: 0;
        }

        .slash-command-label {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
          margin-bottom: 2px;
        }

        .slash-command-description {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .slash-command-empty {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 24px;
          justify-content: center;
          color: #9ca3af;
          font-size: 14px;
        }

        /* Scrollbar styling */
        .slash-command-menu-content::-webkit-scrollbar {
          width: 6px;
        }

        .slash-command-menu-content::-webkit-scrollbar-track {
          background: #f9fafb;
        }

        .slash-command-menu-content::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }

        .slash-command-menu-content::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}

/**
 * Create default slash commands
 */
export function createSlashCommands(
  onInsert: (text: string, moveCursorBy?: number) => void,
  onAIAction: (action: string) => void,
  onTemplateAction: (templateId: string) => void
): SlashCommand[] {
  return [
    // BASIC BLOCKS
    {
      id: 'h1',
      label: 'Heading 1',
      description: 'Big section heading',
      icon: <Heading1 />,
      category: 'basic',
      keywords: ['heading', 'h1', 'title', 'large'],
      action: () => onInsert('# ', 0),
    },
    {
      id: 'h2',
      label: 'Heading 2',
      description: 'Medium section heading',
      icon: <Heading2 />,
      category: 'basic',
      keywords: ['heading', 'h2', 'subtitle'],
      action: () => onInsert('## ', 0),
    },
    {
      id: 'h3',
      label: 'Heading 3',
      description: 'Small section heading',
      icon: <Heading3 />,
      category: 'basic',
      keywords: ['heading', 'h3', 'subheading'],
      action: () => onInsert('### ', 0),
    },
    {
      id: 'bullet',
      label: 'Bullet List',
      description: 'Unordered list',
      icon: <List />,
      category: 'basic',
      keywords: ['list', 'bullet', 'ul', 'unordered'],
      action: () => onInsert('- ', 0),
    },
    {
      id: 'numbered',
      label: 'Numbered List',
      description: 'Ordered list',
      icon: <ListOrdered />,
      category: 'basic',
      keywords: ['list', 'numbered', 'ol', 'ordered'],
      action: () => onInsert('1. ', 0),
    },
    {
      id: 'todo',
      label: 'To-Do List',
      description: 'Task list with checkboxes',
      icon: <CheckSquare />,
      category: 'basic',
      keywords: ['todo', 'task', 'checkbox', 'checklist'],
      action: () => onInsert('- [ ] ', 0),
    },
    {
      id: 'quote',
      label: 'Quote',
      description: 'Blockquote',
      icon: <Quote />,
      category: 'basic',
      keywords: ['quote', 'blockquote', 'citation'],
      action: () => onInsert('> ', 0),
    },
    {
      id: 'divider',
      label: 'Divider',
      description: 'Horizontal line',
      icon: <Minus />,
      category: 'basic',
      keywords: ['divider', 'hr', 'line', 'separator'],
      action: () => onInsert('---\n\n', 0),
    },

    // ADVANCED
    {
      id: 'code',
      label: 'Code Block',
      description: 'Code snippet with syntax highlighting',
      icon: <Code />,
      category: 'advanced',
      keywords: ['code', 'snippet', 'programming'],
      action: () => onInsert('```\n\n```', -4),
    },
    {
      id: 'table',
      label: 'Table',
      description: 'Insert a table',
      icon: <Table />,
      category: 'advanced',
      keywords: ['table', 'grid', 'data'],
      action: () => onInsert('| Column 1 | Column 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n\n', 0),
    },
    {
      id: 'link',
      label: 'Link',
      description: 'Insert a hyperlink',
      icon: <Link />,
      category: 'advanced',
      keywords: ['link', 'url', 'hyperlink'],
      action: () => onInsert('[Link text](URL)', -5),
    },
    {
      id: 'image',
      label: 'Image',
      description: 'Insert an image',
      icon: <Image />,
      category: 'advanced',
      keywords: ['image', 'picture', 'photo', 'img'],
      action: () => onInsert('![Alt text](image-url)', -11),
    },
    {
      id: 'diagram',
      label: 'Mermaid Diagram',
      description: 'Create a flowchart or diagram',
      icon: <FileImage />,
      category: 'advanced',
      keywords: ['mermaid', 'diagram', 'flowchart', 'chart'],
      action: () => onInsert('```mermaid\ngraph TD\n    A[Start] --> B[End]\n```\n\n', 0),
    },

    // AI-POWERED
    {
      id: 'ai-write',
      label: 'AI Continue Writing',
      description: 'Let AI continue from where you left off',
      icon: <Sparkles />,
      category: 'ai',
      keywords: ['ai', 'write', 'continue', 'generate'],
      action: () => onAIAction('continue'),
    },
    {
      id: 'ai-improve',
      label: 'AI Improve Text',
      description: 'Enhance clarity and grammar',
      icon: <Sparkles />,
      category: 'ai',
      keywords: ['ai', 'improve', 'enhance', 'better'],
      action: () => onAIAction('improve'),
    },
    {
      id: 'ai-mindmap',
      label: 'Generate Mindmap',
      description: 'Create a mindmap from your text',
      icon: <Brain />,
      category: 'ai',
      keywords: ['mindmap', 'visual', 'diagram', 'map'],
      action: () => onAIAction('mindmap'),
    },
    {
      id: 'ai-summarize',
      label: 'AI Summarize',
      description: 'Create a concise summary',
      icon: <Sparkles />,
      category: 'ai',
      keywords: ['ai', 'summarize', 'summary', 'tldr'],
      action: () => onAIAction('summarize'),
    },

    // TEMPLATES
    {
      id: 'template-meeting',
      label: 'Meeting Notes',
      description: 'Professional meeting notes structure',
      icon: <Calendar />,
      category: 'templates',
      keywords: ['meeting', 'notes', 'agenda', 'business'],
      action: () => onTemplateAction('meeting-notes'),
    },
    {
      id: 'template-blog',
      label: 'Blog Post',
      description: 'Complete blog post with sections',
      icon: <FileText />,
      category: 'templates',
      keywords: ['blog', 'post', 'article', 'writing'],
      action: () => onTemplateAction('blog-post'),
    },
    {
      id: 'template-docs',
      label: 'Documentation',
      description: 'Technical documentation structure',
      icon: <BookOpen />,
      category: 'templates',
      keywords: ['docs', 'documentation', 'technical', 'api'],
      action: () => onTemplateAction('documentation'),
    },
    {
      id: 'template-project',
      label: 'Project Plan',
      description: 'Complete project planning template',
      icon: <Rocket />,
      category: 'templates',
      keywords: ['project', 'plan', 'planning', 'management'],
      action: () => onTemplateAction('project-plan'),
    },
    {
      id: 'template-presentation',
      label: 'Presentation',
      description: 'Slides structure for presentations',
      icon: <Presentation />,
      category: 'templates',
      keywords: ['presentation', 'slides', 'talk', 'speech'],
      action: () => onTemplateAction('presentation'),
    },
  ];
}
