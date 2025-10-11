/**
 * WYSIWYG Editor using TipTap
 * Replaces the split markdown editor with a unified editing experience
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './wysiwyg-editor.css';
import 'tippy.js/dist/tippy.css';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import MarkdownIt from 'markdown-it';
import TurndownService from 'turndown';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { MermaidNode } from './extensions/MermaidNode';
import { EditorContextMenu } from './EditorContextMenu';
import { DiagramInsertMenu } from './DiagramInsertMenu';
import { SlashCommandExtension, slashCommandSuggestion } from './SlashCommandExtension';
import { FormatDropdown } from './FormatDropdown';
import { FontFamilyDropdown } from './FontFamilyDropdown';
import { AISettingsDropdown } from './AISettingsDropdown';
import { InlineDocumentTitle } from './InlineDocumentTitle';
import { GhostTextExtension } from './extensions/GhostTextExtension';
import { AIAutocompleteExtension } from './extensions/AIAutocompleteExtension';
import { autoFormatText, generateAIFormatPrompt, needsFormatting } from '@/utils/autoFormat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AIAssistantModal } from '@/components/modals/AIAssistantModal';
import { SmartAIModal } from '@/components/modals/SmartAIModal';
import UnifiedDiagramModal from '@/components/modals/UnifiedDiagramModal';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Sparkles,
  Wand2,
  Save,
  Share,
  Download,
  Undo,
  Redo,
  Library,
  Presentation as PresentationIcon,
  MoreVertical,
  Zap,
  Network,
  FileText,
  Workflow,
  GitBranch,
  BarChart,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface WYSIWYGEditorProps {
  documentId?: string;
  documentTitle?: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onTitleChange?: (title: string) => void;
  onEditorReady?: (editor: any) => void;
  contextFolders?: Array<{
    id: string;
    name: string;
    icon: string;
    files: Array<{
      id: string;
      name: string;
      type: 'pdf' | 'docx' | 'md' | 'xlsx' | 'txt' | 'other';
      size?: string;
      addedAt: Date;
      content?: string;
      path?: string;
    }>;
  }>;
}

// Initialize markdown parser
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true, // Convert \n to <br>
});

// Initialize HTML to markdown converter
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

// Add custom rule for Mermaid diagrams
turndownService.addRule('mermaidDiagram', {
  filter: (node) => {
    return node.nodeName === 'DIV' && 
           node.getAttribute('data-type') === 'mermaid';
  },
  replacement: (content, node: any) => {
    // The mermaid code is stored in the data-code attribute or we need to extract it
    // Since TipTap stores it as an attribute, we need to get it from the node
    const code = node.getAttribute('data-code') || node.textContent || '';
    if (!code) return '';
    return '\n\n```mermaid\n' + code.trim() + '\n```\n\n';
  }
});

// Helper function to convert markdown to HTML
const markdownToHtml = (markdown: string): string => {
  if (!markdown || markdown.trim() === '') {
    return '';
  }
  
  // Check if content is already HTML (starts with <)
  if (markdown.trim().startsWith('<')) {
    return markdown;
  }
  
  // CRITICAL FIX: Handle mermaid blocks BEFORE markdown-it conversion
  // Split by mermaid blocks and convert them to proper HTML divs
  const mermaidRegex = /(\s*```\s*mermaid[\s\S]*?```)/g;
  const parts = markdown.split(mermaidRegex);
  
  let html = '';
  parts.forEach((part) => {
    if (!part.trim()) return;
    
    const trimmed = part.trimStart();
    if (/^```\s*mermaid/.test(trimmed)) {
      // Extract mermaid code (tolerant to spaces)
      const m = trimmed.match(/```\s*mermaid\s*[\r\n]+([\s\S]*?)```/);
      const code = m ? m[1].trim() : '';
      
      if (code) {
        // Create proper HTML div for MermaidNode to parse
        html += `<div data-type="mermaid" data-code="${code.replace(/"/g, '&quot;').replace(/\n/g, '&#10;')}"></div>`;
      }
    } else {
      // Regular markdown - convert with markdown-it
      html += md.render(part);
    }
  });
  
  return html;
};

// Helper function to convert HTML to markdown
// Also handles TipTap editor directly to extract mermaid diagrams properly
const htmlToMarkdown = (html: string, editor?: any): string => {
  try {
    // If we have the editor, use its JSON representation for better mermaid handling
    if (editor) {
      const json = editor.getJSON();
      return jsonToMarkdown(json);
    }
    
    // Fallback to HTML conversion
    if (!html || html.trim() === '') {
      return '';
    }
    
    return turndownService.turndown(html);
  } catch (error) {
    console.error('Error converting HTML to markdown:', error);
    return html || '';
  }
};

// Convert TipTap JSON to Markdown (preserves mermaid diagrams)
const jsonToMarkdown = (json: any): string => {
  if (!json || !json.content) {
    return '';
  }
  
  let markdown = '';
  
  const processNode = (node: any): string => {
    switch (node.type) {
      case 'heading':
        const level = '#'.repeat(node.attrs?.level || 1);
        const text = node.content?.map((n: any) => n.text || '').join('') || '';
        return `${level} ${text}\n\n`;
      
      case 'paragraph':
        const paraText = node.content?.map(processNode).join('') || '';
        return `${paraText}\n\n`;
      
      case 'text':
        let text2 = node.text || '';
        if (node.marks) {
          node.marks.forEach((mark: any) => {
            if (mark.type === 'bold') text2 = `**${text2}**`;
            if (mark.type === 'italic') text2 = `*${text2}*`;
            if (mark.type === 'code') text2 = `\`${text2}\``;
            if (mark.type === 'strike') text2 = `~~${text2}~~`;
          });
        }
        return text2;
      
      case 'mermaid':
        const code = node.attrs?.code || '';
        return `\n\`\`\`mermaid\n${code}\n\`\`\`\n\n`;
      
      case 'codeBlock':
        const codeContent = node.content?.map((n: any) => n.text || '').join('') || '';
        const lang = node.attrs?.language || '';
        return `\n\`\`\`${lang}\n${codeContent}\n\`\`\`\n\n`;
      
      case 'bulletList':
        return node.content?.map((item: any) => {
          const itemText = item.content?.[0]?.content?.map(processNode).join('') || '';
          return `- ${itemText}\n`;
        }).join('') || '';
      
      case 'orderedList':
        return node.content?.map((item: any, idx: number) => {
          const itemText = item.content?.[0]?.content?.map(processNode).join('') || '';
          return `${idx + 1}. ${itemText}\n`;
        }).join('') || '';
      
      case 'blockquote':
        const quoteText = node.content?.map(processNode).join('') || '';
        return `> ${quoteText}\n\n`;
      
      case 'hardBreak':
        return '\n';
      
      default:
        // Fallback: try to process content if it exists
        if (node.content) {
          return node.content.map(processNode).join('');
        }
        return '';
    }
  };
  
  json.content.forEach((node: any) => {
    markdown += processNode(node);
  });
  
  return markdown.trim();
};

export const WYSIWYGEditor: React.FC<WYSIWYGEditorProps> = ({
  documentId,
  documentTitle = 'Untitled Document',
  initialContent = '',
  onContentChange,
  onTitleChange,
  onEditorReady,
  contextFolders = [],
}) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState(documentTitle);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDiagramMenu, setShowDiagramMenu] = useState(false);
  const [showMindmapChoiceModal, setShowMindmapChoiceModal] = useState(false);
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(false);
  const [aiAutocompleteEnabled, setAiAutocompleteEnabled] = useState(true); // Enabled by default!
  
  // Editor mode toggle: WYSIWYG or Markdown
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg');
  const [markdownContent, setMarkdownContent] = useState('');
  const markdownTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Mutable ref for AI hints that the extension can access
  const aiHintsEnabledRef = useRef({ enabled: false });
  
  // Flag to prevent onUpdate during programmatic changes (mode switching)
  const isProgrammaticUpdate = useRef(false);
  
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    selectedText: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    selectedText: '',
  });
  
  // Flatten context folders for AI modal
  const flattenedContextFiles = useMemo(() => {
    return contextFolders.flatMap(folder => 
      folder.files.map(file => ({
        id: file.id,
        name: `${folder.icon} ${folder.name} / ${file.name}`,
        content: file.content,
      }))
    );
  }, [contextFolders]);

  // AI Autocomplete Suggestion Generator (Smarter than inline hints!)
  const getAIAutocompleteSuggestion = async (context: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const text = context.trim().toLowerCase();
    
    // Smart pattern matching for autocomplete
    
    // Heading detection
    if (text.endsWith('## ') || text.endsWith('# ')) {
      const headingStarters = [
        'Introduction',
        'Overview',
        'Getting Started',
        'Installation',
        'Configuration',
        'Usage',
        'Examples',
        'API Reference',
        'Troubleshooting',
        'FAQ',
        'Contributing',
        'License',
      ];
      return headingStarters[Math.floor(Math.random() * headingStarters.length)];
    }

    // List item detection
    if (text.endsWith('- ') || text.endsWith('* ')) {
      const listItems = [
        'Easy to set up and configure',
        'Works with all major platforms',
        'Includes comprehensive documentation',
        'Supports multiple file formats',
        'Provides real-time updates',
        'Built with performance in mind',
      ];
      return listItems[Math.floor(Math.random() * listItems.length)];
    }

    // Sentence continuation
    const sentences = text.split(/[.!?]\s+/);
    const lastSentence = sentences[sentences.length - 1] || '';
    const words = lastSentence.split(/\s+/);
    const lastWords = words.slice(-3).join(' ').toLowerCase();

    // Context-aware continuations
    if (lastWords.includes('install')) {
      return ' by running npm install in your terminal';
    }
    if (lastWords.includes('configure') || lastWords.includes('config')) {
      return ' the settings in the configuration file';
    }
    if (lastWords.includes('feature') || lastWords.includes('function')) {
      return ' provides a seamless user experience';
    }
    if (lastWords.includes('user') || lastWords.includes('users')) {
      return ' can easily access all functionality';
    }
    if (lastWords.includes('api') || lastWords.includes('endpoint')) {
      return ' endpoint accepts JSON requests and returns structured data';
    }
    if (lastWords.includes('documen') || lastWords.includes('doc')) {
      return ' includes examples and best practices';
    }

    // Generic smart continuations
    const smartContinuations = [
      ' which ensures optimal performance',
      ' and provides excellent developer experience',
      ' to streamline your workflow',
      ' with built-in error handling',
      ' following industry best practices',
      ' that integrates seamlessly',
    ];

    return smartContinuations[Math.floor(Math.random() * smartContinuations.length)];
  };

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your document... Type "/" for commands',
      }),
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline cursor-pointer' },
      }),
      MermaidNode,
      SlashCommandExtension.configure({
        suggestion: slashCommandSuggestion(
          () => setShowDiagramMenu(true),
          (action) => {
            setShowAIModal(true);
            // TODO: Set AI prompt based on action
          }
        ),
      }),
      GhostTextExtension.configure({
        isEnabled: () => aiHintsEnabledRef.current.enabled,
        debounceMs: 800,
        onTrigger: async (context: string) => {
          // Mock AI suggestion for now
          // TODO: Replace with real OpenAI API call
          return await getMockAISuggestion(context);
        },
      }),
      AIAutocompleteExtension.configure({
        enabled: aiAutocompleteEnabled,
        debounceMs: 1000,
        minChars: 30,
        onSuggestion: getAIAutocompleteSuggestion,
      }),
    ],
    // Render initial content, preserving mermaid blocks
    content: markdownToHtml(initialContent) || '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[calc(100vh-200px)] px-8 py-6',
      },
      handleDOMEvents: {
        contextmenu: (view, event) => {
          event.preventDefault();
          const { from, to } = view.state.selection;
          const selectedText = view.state.doc.textBetween(from, to, ' ');
          
          setContextMenu({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            selectedText,
          });
          
          return true;
        },
      },
      handlePaste: (view, event) => {
        try {
          const text = event.clipboardData?.getData('text/plain') || '';
          if (!text) return false;
          const mdLike = /(^#\s)|(^-{3,}$)|(^\*\s)|(^\d+\.\s)|(```[\s\S]*?```)/m.test(text);
          if (!mdLike) return false;
          event.preventDefault();

          const regex = /(\s*```\s*mermaid[\s\S]*?```)/g;
          const parts = text.split(regex);
          // Prevent onUpdate from firing during programmatic multi-step insert
          isProgrammaticUpdate.current = true;
          
          // Process parts sequentially (not chained, to avoid issues)
          parts.forEach((part: string) => {
            if (!part.trim()) return;
            const trimmed = part.trimStart();
            if (/^```\s*mermaid/.test(trimmed)) {
              const m = trimmed.match(/```\s*mermaid\s*[\r\n]+([\s\S]*?)```/);
              const code = m ? m[1].trim() : '';
              if (code) {
                // Insert mermaid node using a single insertContent call with all nodes
                (editor as any).commands.insertContent([
                  { type: 'paragraph' },
                  {
                    type: 'mermaid',
                    attrs: { code, scale: 1, width: '780px' }
                  },
                  { type: 'paragraph' }
                ]);
              }
            } else {
              (editor as any).commands.insertContent(markdownToHtml(part));
            }
          });
          // Ensure NodeViews mount and render, then trigger content update
          // Increased timeout to allow mermaid nodes to fully mount
          setTimeout(() => {
            try { (editor as any).commands.focus(); } catch {}
            isProgrammaticUpdate.current = false;
            
            // CRITICAL: Manually trigger content update for outline sync
            const markdown = htmlToMarkdown('', editor);
            onContentChange?.(markdown);
          }, 200);
          return true;
        } catch (e) {
          console.error('Paste handler error:', e);
          return false;
        }
      }
    },
    onUpdate: ({ editor }) => {
      // Skip if this is a programmatic update (mode switching, etc.)
      if (isProgrammaticUpdate.current) {
        return;
      }
      
      // CRITICAL: Convert to markdown for storage
      // This preserves formatting when saving and enables mindmap generation
      // Use JSON conversion to properly handle mermaid diagrams
      const markdown = htmlToMarkdown('', editor);
      console.log('📝 Editor onUpdate - markdown length:', markdown.length);
      console.log('📝 First 200 chars:', markdown.substring(0, 200));
      onContentChange?.(markdown);
    },
  });

  // Update the mutable ref when toggle changes
  useEffect(() => {
    aiHintsEnabledRef.current.enabled = aiSuggestionsEnabled;
  }, [aiSuggestionsEnabled]);
  
  // Pass editor instance to parent when ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Update title - FIXED: removed onTitleChange from deps to prevent loop
  useEffect(() => {
    onTitleChange?.(title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // Update ghost text when toggle changes
  useEffect(() => {
    if (editor) {
      editor.extensionManager.extensions.forEach((ext) => {
        if (ext.name === 'ghostText') {
          // @ts-ignore
          ext.options.enabled = aiSuggestionsEnabled;
        }
      });
    }
  }, [aiSuggestionsEnabled, editor]);

  // Keyboard shortcut: Ctrl+M to toggle editor mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        toggleEditorMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorMode, markdownContent]); // Dependencies needed for toggle function

  // Mock AI suggestion generator (simulates natural continuation)
  const getMockAISuggestion = async (context: string): Promise<string | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const text = context.trim();
    const words = text.split(/\s+/);
    const lastWord = words[words.length - 1]?.toLowerCase() || '';
    
    // Natural continuations based on last word
    const continuations: Record<string, string[]> = {
      'the': ['best way to', 'main goal is', 'important thing is', 'key point is'],
      'a': ['great opportunity', 'better approach', 'simple solution', 'good idea'],
      'to': ['make this work', 'ensure success', 'achieve our goals', 'improve quality'],
      'is': ['working well', 'very important', 'quite interesting', 'really useful'],
      'will': ['help us', 'make it better', 'improve things', 'work perfectly'],
      'can': ['do this by', 'make it work', 'improve this', 'achieve that'],
      'should': ['focus on', 'work on', 'consider this', 'try this'],
      'would': ['be great', 'work well', 'make sense', 'help us'],
      'and': ['then we can', 'also make', 'improve the', 'create a'],
      'this': ['will help', 'makes sense', 'is important', 'works well'],
      'it': ['will work', 'makes sense', 'looks good', 'works well'],
    };

    // Check if last word has a continuation
    if (continuations[lastWord]) {
      const options = continuations[lastWord];
      return options[Math.floor(Math.random() * options.length)];
    }

    // Generic useful continuations
    const generic = [
      'and make it better',
      'to improve the quality',
      'which will help us',
      'that makes sense here',
      'and ensure it works',
      'to achieve the goal',
    ];
    
    return generic[Math.floor(Math.random() * generic.length)];
  };

  if (!editor) {
    return <div className="flex items-center justify-center h-screen">Loading editor...</div>;
  }

  // Toggle between WYSIWYG and Markdown modes
  const toggleEditorMode = () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔀 TOGGLE MODE CALLED');
    console.log('  Current mode:', editorMode);
    
    if (editorMode === 'wysiwyg') {
      // Switching to Markdown - use JSON conversion for better mermaid handling
      console.log('  ➡️  WYSIWYG → Markdown');
      const markdown = htmlToMarkdown('', editor);
      console.log('  📝 Converted to markdown, length:', markdown.length);
      console.log('  📝 Preview:', markdown.substring(0, 200));
      setMarkdownContent(markdown);
      setEditorMode('markdown');
    } else {
      // Switching to WYSIWYG - parse markdown and insert content with mermaid support
      console.log('  ➡️  Markdown → WYSIWYG');
      console.log('  📝 markdownContent length:', markdownContent.length);
      console.log('  📝 markdownContent preview:', markdownContent.substring(0, 200));
      console.log('  🔍 Contains mermaid?', markdownContent.includes('```mermaid'));
      
      parseAndInsertMarkdown(markdownContent);
      // Ensure nodeviews mount before allowing further updates
      setTimeout(() => editor?.commands.focus(), 50);
      setEditorMode('wysiwyg');
      // DON'T call onContentChange here - content hasn't changed, just the view mode
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  };
  
  // Parse markdown and insert into editor (handles mermaid blocks specially)
  const parseAndInsertMarkdown = (markdown: string) => {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  PARSE AND INSERT MARKDOWN            ║');
    console.log('╚════════════════════════════════════════╝');
    
    if (!editor) {
      console.log('❌ ERROR: No editor instance!');
      return;
    }
    
    console.log('📥 INPUT:');
    console.log('  Length:', markdown.length);
    console.log('  Full content:', markdown);
    
    // CRITICAL FIX: Strip outer markdown code fence if present
    if (markdown.startsWith('```markdown\n')) {
      console.log('  ⚠️  Content wrapped in ```markdown fence, stripping...');
      markdown = markdown
        .replace(/^```markdown\n/, '')  // Remove opening
        .replace(/\n```$/, '');           // Remove closing
      console.log('  ✅ After stripping, length:', markdown.length);
      console.log('  ✅ After stripping:', markdown);
    }
    
    console.log('  Contains ```mermaid?', markdown.includes('```mermaid'));
    
    // Set flag to prevent onUpdate from firing
    isProgrammaticUpdate.current = true;
    console.log('🚫 isProgrammaticUpdate set to TRUE');
    
    // Split content by mermaid blocks (capture group keeps the delimiter)
    // More flexible regex to handle different newline styles
    const regex = /(\s*```\s*mermaid[\s\S]*?```)/g;
    console.log('\n📦 SPLITTING by regex:', regex);
    const parts = markdown.split(regex);
    console.log('  Split into', parts.length, 'parts');
    
    parts.forEach((part, index) => {
      console.log(`\n  ━━━ Part ${index} ━━━`);
      console.log('  Length:', part.length);
      console.log('  Content:', part);
      console.log('  Starts with ```mermaid?', part.startsWith('```mermaid'));
    });
    
    // Clear editor FIRST before building content
    console.log('\n🗑️  CLEARING EDITOR FIRST');
    editor.commands.clearContent();
    console.log('✅ Editor cleared\n');
    
    // Now insert each part directly (NO intermediate building)
    console.log('🔄 INSERTING PARTS DIRECTLY:');
    parts.forEach((part, index) => {
      console.log(`\n━━━ Part ${index} ━━━`);
      
      if (!part.trim()) {
        console.log('⏭️  Empty, skipping');
        return;
      }
      
      const trimmed = part.trimStart();
      if (/^```\s*mermaid/.test(trimmed)) {
        const m = trimmed.match(/```\s*mermaid\s*[\r\n]+([\s\S]*?)```/);
        const code = m ? m[1].trim() : '';

        if (code) {
          console.log('🎨 MERMAID:', code.substring(0, 50) + '...');
          console.log('📍 Cursor before:', editor.state.selection.from);

          // Insert as array in a single call (chaining doesn't work for mermaid nodes)
          const success = editor.commands.insertContent([
            { type: 'paragraph' },
            { type: 'mermaid', attrs: { code, scale: 1, width: '780px' } },
            { type: 'paragraph' }
          ]);

          console.log('📍 Cursor after:', editor.state.selection.from);
          console.log('🔍 Insert success?', success);
        }
      } else {
        console.log('📄 MARKDOWN:', part.substring(0, 40) + '...');
        const html = markdownToHtml(part);
        editor.chain().insertContent(html).run();
      }
    });
    
    console.log('\n🔍 FINAL CHECK:');
    console.log('  Editor HTML length:', editor.getHTML().length);
    console.log('  Editor HTML:', editor.getHTML().substring(0, 300));
    console.log('  Editor JSON:', JSON.stringify(editor.getJSON(), null, 2).substring(0, 500));
    
      // Force a re-render to ensure mermaid diagrams display
      requestAnimationFrame(() => {
        setTimeout(() => {
          editor.commands.focus();
          isProgrammaticUpdate.current = false;
          console.log('✅ hydration + focus complete');
        }, 30);
      });
  };
  
  // Handle markdown textarea changes
  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = e.target.value;
    setMarkdownContent(newMarkdown);
    // Notify parent of content change
    if (onContentChange) {
      onContentChange(newMarkdown);
    }
  };

  // Toolbar actions
  const insertMermaidDiagram = (code?: string) => {
    const diagramCode = code || 'flowchart TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[End]\n  B -->|No| A';
    
    // Insert AFTER selection by collapsing to selection end
    const { state } = editor;
    const to = state.selection.to;
    
    // Move cursor to end of selection (to avoid deleting selected text)
    editor.chain().focus().setTextSelection({ from: to, to }).run();
    
    // Insert diagram using array-based approach (not chained)
    editor.commands.insertContent([
      { type: 'paragraph' },
      { type: 'mermaid', attrs: { code: diagramCode, scale: 1, width: '780px' } },
      { type: 'paragraph' }
    ]);
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const insertImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const insertLink = () => {
    const url = window.prompt('Enter link URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  // Auto-format handlers
  const handleAutoFormat = () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (!hasSelection) {
      alert('Please select text to format');
      return;
    }

    const selectedText = editor.state.doc.textBetween(from, to, '\n');
    const formatted = autoFormatText(selectedText);

    editor.chain().focus().deleteRange({ from, to }).insertContent(formatted).run();
  };

  const handleAutoFormatAll = () => {
    if (!editor) return;

    const allText = editor.getText();
    
    if (!needsFormatting(allText)) {
      alert('Document appears to already be formatted!');
      return;
    }

    const formatted = autoFormatText(allText);
    
    // Replace entire content
    editor.chain().focus().setContent(formatted).run();
  };

  const handleAIFormat = async () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    const text = hasSelection ? editor.state.doc.textBetween(from, to, '\n') : editor.getText();

    const prompt = generateAIFormatPrompt(text);
    
    // Open AI modal with the formatting prompt
    setShowAIModal(true);
    // TODO: Pre-fill the prompt in the AI modal
    console.log('AI Format prompt:', prompt);
  };

  const exportAsMarkdown = () => {
    // TODO: Implement proper HTML to Markdown conversion
    const html = editor.getHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Context menu handlers
  const handleContextFormat = (format: string) => {
    if (!editor) return;

    switch (format) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'strikethrough':
        editor.chain().focus().toggleStrike().run();
        break;
      case 'code':
        editor.chain().focus().toggleCode().run();
        break;
      case 'link':
        const url = window.prompt('Enter URL:');
        if (url) editor.chain().focus().setLink({ href: url }).run();
        break;
      case 'heading1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'heading2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'heading3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
    }
  };

  const handleContextAIAction = (action: string) => {
    // Open AI modal with appropriate prompt
    setShowAIModal(true);
    // TODO: Set initial prompt based on action
  };

  const handleContextInsert = (type: string) => {
    if (!editor) return;

    switch (type) {
      case 'table':
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case 'diagram':
        // Open diagram dialog instead of auto-inserting
        setShowDiagramMenu(true);
        break;
    }
  };

  const handleContextBasicAction = (action: string) => {
    if (!editor) return;

    switch (action) {
      case 'copy':
        document.execCommand('copy');
        break;
      case 'cut':
        document.execCommand('cut');
        break;
      case 'paste':
        document.execCommand('paste');
        break;
      case 'delete':
        editor.chain().focus().deleteSelection().run();
        break;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b border-border bg-card px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          {/* Left: Compact Toolbar */}
          <div className="flex items-center gap-2">
            {/* Unified Format Dropdown */}
            <FormatDropdown
              editor={editor}
              onInsertTable={insertTable}
              onInsertLink={insertLink}
              onInsertImage={insertImage}
              onAutoFormat={handleAutoFormat}
              onAutoFormatAll={handleAutoFormatAll}
              onAIFormat={handleAIFormat}
            />

            {/* Font Family Dropdown */}
            <FontFamilyDropdown editor={editor} />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Diagrams */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDiagramMenu(true)}
              title="Insert Diagram"
              className="gap-1"
            >
              <Library className="h-4 w-4" />
              <span className="text-xs">Diagram</span>
            </Button>

            {/* AI Assistant */}
            <Button
              size="sm"
              className="gradient-primary border-0 text-white hover:scale-105 transition-transform"
              onClick={() => setShowAIModal(true)}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI
            </Button>

            {/* Mindmap Studio */}
            <Button
              size="sm"
              variant="outline"
              className="border-primary/50 hover:bg-primary/10"
              onClick={() => {
                // Save current content first (as markdown)
                if (editor && onContentChange) {
                  const markdown = htmlToMarkdown('', editor);
                  onContentChange(markdown);
                }
                // Show choice modal
                setShowMindmapChoiceModal(true);
              }}
              title="Open Mindmap Studio"
            >
              <Network className="h-4 w-4 mr-1" />
              Mindmap
            </Button>

            {/* AI Settings */}
            <AISettingsDropdown
              aiAutocompleteEnabled={aiAutocompleteEnabled}
              onAIAutocompleteChange={setAiAutocompleteEnabled}
              aiHintsEnabled={aiSuggestionsEnabled}
              onAIHintsChange={(checked) => {
                setAiSuggestionsEnabled(checked);
              }}
            />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* WYSIWYG / Markdown Toggle */}
            <Button
              size="sm"
              variant={editorMode === 'markdown' ? 'default' : 'outline'}
              onClick={toggleEditorMode}
              title={editorMode === 'wysiwyg' ? 'Switch to Markdown (Ctrl+M)' : 'Switch to WYSIWYG (Ctrl+M)'}
              className="gap-1"
            >
              <FileText className="h-4 w-4" />
              <span className="text-xs">{editorMode === 'wysiwyg' ? 'Markdown' : 'WYSIWYG'}</span>
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Undo/Redo */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: Document Actions */}
          <div className="flex items-center gap-3">

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                  <span className="ml-auto text-xs text-muted-foreground">Ctrl+S</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportAsMarkdown}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Editor Content - Conditional based on mode */}
      <div className="flex-1 overflow-y-auto bg-background">
        {editorMode === 'wysiwyg' ? (
          <EditorContent editor={editor} />
        ) : (
          <textarea
            ref={markdownTextareaRef}
            value={markdownContent}
            onChange={handleMarkdownChange}
            className="w-full h-full p-6 resize-none border-0 focus:outline-none font-mono text-sm leading-relaxed bg-background"
            placeholder="# Start writing in Markdown..."
            spellCheck="true"
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-border bg-muted px-6 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              Words: {editor.storage.characterCount?.words() || editor.getText().split(/\s+/).filter(w => w.length > 0).length}
            </span>
            <span>Characters: {editor.storage.characterCount?.characters() || editor.getText().length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span>Ready</span>
          </div>
        </div>
      </div>

      {/* Smart AI Modal with @ mentions and context files */}
      <SmartAIModal
        open={showAIModal}
        onOpenChange={setShowAIModal}
        documentContent={editor ? htmlToMarkdown('', editor) : ''}
        selectedText={contextMenu.selectedText}
        contextFiles={flattenedContextFiles}
        onGenerate={(result: string) => {
          if (editor) {
            editor.chain().focus().insertContent(`\n\n${result}\n\n`).run();
          }
        }}
      />

      {/* Unified Diagram Modal - combines Quick Insert, AI Generate, and Open Studio */}
      <UnifiedDiagramModal
        open={showMindmapChoiceModal}
        onOpenChange={setShowMindmapChoiceModal}
        editor={editor}
        documentContent={editor ? htmlToMarkdown('', editor) : ''}
        documentId={documentId}
        documentTitle={title}
        selectedText={editor?.state.selection.empty ? undefined : editor?.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to,
          ' '
        )}
      />

      {/* Diagram Insert Menu */}
      <DiagramInsertMenu
        isOpen={showDiagramMenu}
        onClose={() => setShowDiagramMenu(false)}
        onInsert={(code) => insertMermaidDiagram(code)}
        selectedText={editor?.state.selection.empty ? '' : editor?.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to,
          ' '
        ) || ''}
      />

      {/* Context Menu */}
      {contextMenu.visible && (
        <EditorContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          selectedText={contextMenu.selectedText}
          onClose={() => setContextMenu({ ...contextMenu, visible: false })}
          onFormat={handleContextFormat}
          onAIAction={handleContextAIAction}
          onInsert={handleContextInsert}
          onBasicAction={handleContextBasicAction}
        />
      )}
    </div>
  );
};
