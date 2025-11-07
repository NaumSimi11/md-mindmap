/**
 * WYSIWYG Editor using TipTap
 * Replaces the split markdown editor with a unified editing experience
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './wysiwyg-editor.css';
import 'tippy.js/dist/tippy.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import MarkdownIt from 'markdown-it';
import TurndownService from 'turndown';
// 🔥 Syntax highlighting imports - IMPORTANT: Load Prism core first!
import Prism from 'prismjs';
// Load theme and plugins after core
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.js';
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
import { FontSize } from './extensions/FontSizeExtension';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { Superscript } from '@tiptap/extension-superscript';
import { Subscript } from '@tiptap/extension-subscript';
import { MermaidNode } from './extensions/MermaidNode';
import { CalloutNode } from './extensions/CalloutNode';
import { YouTubeNode } from './extensions/YouTubeNode';
import { VimeoNode } from './extensions/VimeoNode';
import { PDFNode } from './extensions/PDFNode';
import { GistNode } from './extensions/GistNode';
import { EnhancedBlockquote } from './extensions/EnhancedBlockquote';
import { FootnoteReference, FootnoteDefinition, FootnotesSection } from './extensions/FootnoteExtension';
import { TOCNode } from './extensions/TOCNode';
import { ResizableImageNodeView } from './extensions/ResizableImageNodeView';
import { FloatingToolbar } from './FloatingToolbar';
import { FloatingSideToolbar } from './FloatingSideToolbar';
import { LinkHoverToolbar } from './LinkHoverToolbar';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import { EditorContextMenu } from './EditorContextMenu';
import { DiagramInsertMenu } from './DiagramInsertMenu';
import { SlashCommandExtension, slashCommandSuggestion } from './SlashCommandExtension';
import { FormatDropdown } from './FormatDropdown';
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
import { usePlatform } from '@/contexts/PlatformContext';
import { storageService } from '@/services/storage/StorageService';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { UnifiedAIModal } from '@/components/modals/UnifiedAIModal';
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
  Upload,
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
  Keyboard,
  FolderOpen,
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

// 🔥 Helper to load Prism language dynamically
const loadPrismLanguage = async (lang: string) => {
  // Map of common languages to their Prism components
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rs': 'rust',
    'sh': 'bash',
    'shell': 'bash',
    'bash': 'bash',
  };
  
  const normalizedLang = languageMap[lang] || lang;
  
  // Check if language is already loaded
  if (Prism.languages[normalizedLang]) {
    return normalizedLang;
  }
  
  // Try to load the language component
  try {
    await import(/* @vite-ignore */ `prismjs/components/prism-${normalizedLang}.js`);
    return normalizedLang;
  } catch (e) {
    // Silently fall back to 'markup' for unsupported languages
    return 'markup'; // Default fallback language
  }
};

// 🎉 Simple emoji shortcode map
const emojiMap: Record<string, string> = {
  'smile': '😀', 'grin': '😁', 'joy': '😂', 'heart': '❤️', 'fire': '🔥',
  'rocket': '🚀', 'star': '⭐', 'thumbsup': '👍', 'thumbsdown': '👎',
  'tada': '🎉', 'sparkles': '✨', 'zap': '⚡', 'boom': '💥', 'bulb': '💡',
  'warning': '⚠️', 'x': '❌', 'check': '✅', 'white_check_mark': '✅',
  'heavy_check_mark': '✔️', 'construction': '🚧', 'lock': '🔒',
  'key': '🔑', 'bell': '🔔', 'bookmark': '🔖', 'link': '🔗',
  'mag': '🔍', 'gear': '⚙️', 'tools': '🛠️', 'hammer': '🔨',
  'pencil': '✏️', 'memo': '📝', 'books': '📚', 'book': '📖',
  'newspaper': '📰', 'calendar': '📅', 'chart': '📊', 'bar_chart': '📊',
  'computer': '💻', 'phone': '📱', 'email': '📧', 'inbox': '📥',
  'package': '📦', 'folder': '📁', 'file': '📄', 'camera': '📷',
  'movie': '🎬', 'art': '🎨', 'game': '🎮', 'trophy': '🏆',
  'medal': '🏅', 'flag': '🚩', 'wave': '👋', 'clap': '👏',
  'pray': '🙏', 'muscle': '💪', 'eyes': '👀', 'brain': '🧠',
  'bug': '🐛', 'sunny': '☀️', 'cloud': '☁️', 'umbrella': '☂️',
  'coffee': '☕', 'pizza': '🍕', 'beer': '🍺', 'cake': '🎂',
};

// Initialize markdown parser
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true, // Convert \n to <br>
  highlight: (str, lang) => {
    // 🔥 Enable syntax highlighting in markdown-it
    // Return pre-formatted code that will be highlighted by Prism in useEffect
    if (lang) {
      return `<pre class="line-numbers language-${lang}"><code class="language-${lang}">${md.utils.escapeHtml(str)}</code></pre>`;
    }
    // Fallback for unknown languages
    return `<pre class="line-numbers"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  },
});

// 🔥 TABLE ALIGNMENT SUPPORT - Override table rendering to preserve alignment
// Store the default table renderer
const defaultTableRender = md.renderer.rules.table_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

const defaultTdRender = md.renderer.rules.td_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

const defaultThRender = md.renderer.rules.th_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

// Custom renderer for table cells to add alignment data
md.renderer.rules.td_open = function(tokens, idx, options, env, self) {
  const token = tokens[idx];
  // markdown-it stores alignment info in token.attrGet('style')
  const align = token.attrGet('style')?.match(/text-align:(left|center|right)/)?.[1];
  if (align) {
    token.attrSet('data-align', align);
  }
  return defaultTdRender(tokens, idx, options, env, self);
};

md.renderer.rules.th_open = function(tokens, idx, options, env, self) {
  const token = tokens[idx];
  const align = token.attrGet('style')?.match(/text-align:(left|center|right)/)?.[1];
  if (align) {
    token.attrSet('data-align', align);
  }
  return defaultThRender(tokens, idx, options, env, self);
};

// 🎉 Add simple emoji replacement rule
md.core.ruler.after('inline', 'emoji', (state) => {
  for (let i = 0; i < state.tokens.length; i++) {
    if (state.tokens[i].type === 'inline' && state.tokens[i].children) {
      const children = state.tokens[i].children || [];
      for (let j = 0; j < children.length; j++) {
        if (children[j].type === 'text') {
          const text = children[j].content;
          // Replace :emoji_name: with actual emoji
          const replaced = text.replace(/:([a-z_]+):/g, (match, name) => {
            return emojiMap[name] || match;
          });
          if (replaced !== text) {
            children[j].content = replaced;
          }
        }
      }
    }
  }
  return true;
});

// 🎨 Add highlighting support - Parse ==text== to <mark> tags
md.core.ruler.after('inline', 'highlight', (state) => {
  for (let i = 0; i < state.tokens.length; i++) {
    if (state.tokens[i].type === 'inline' && state.tokens[i].children) {
      const children = state.tokens[i].children || [];
      const newChildren: any[] = [];
      
      for (let j = 0; j < children.length; j++) {
        if (children[j].type === 'text') {
          const text = children[j].content;
          // Split by ==highlighted text== pattern
          const parts = text.split(/(==.+?==)/g);
          
          parts.forEach(part => {
            if (!part) return;
            
            if (part.startsWith('==') && part.endsWith('==')) {
              // This is highlighted text
              const highlightedText = part.slice(2, -2); // Remove == markers
              
              // Create opening <mark> token
              const markOpen = new state.Token('html_inline', '', 0);
              markOpen.content = '<mark class="highlighted-text">';
              newChildren.push(markOpen);
              
              // Create text token
              const textToken = new state.Token('text', '', 0);
              textToken.content = highlightedText;
              newChildren.push(textToken);
              
              // Create closing </mark> token
              const markClose = new state.Token('html_inline', '', 0);
              markClose.content = '</mark>';
              newChildren.push(markClose);
            } else {
              // Regular text
              const textToken = new state.Token('text', '', 0);
              textToken.content = part;
              newChildren.push(textToken);
            }
          });
        } else {
          // Keep non-text tokens as-is
          newChildren.push(children[j]);
        }
      }
      
      // Replace children with new tokens
      if (newChildren.length > 0) {
        state.tokens[i].children = newChildren;
      }
    }
  }
  return true;
});

// 🎨 Add superscript support - Parse ^text^ to <sup> tags
md.core.ruler.after('inline', 'superscript', (state) => {
  for (let i = 0; i < state.tokens.length; i++) {
    if (state.tokens[i].type === 'inline' && state.tokens[i].children) {
      const children = state.tokens[i].children || [];
      const newChildren: any[] = [];
      
      for (let j = 0; j < children.length; j++) {
        if (children[j].type === 'text') {
          const text = children[j].content;
          // Split by ^text^ pattern
          const parts = text.split(/(\^.+?\^)/g);
          
          parts.forEach(part => {
            if (!part) return;
            
            if (part.startsWith('^') && part.endsWith('^') && part.length > 2) {
              // This is superscript text
              const supText = part.slice(1, -1); // Remove ^ markers
              
              // Create <sup> tag
              const supOpen = new state.Token('html_inline', '', 0);
              supOpen.content = '<sup>';
              newChildren.push(supOpen);
              
              const textToken = new state.Token('text', '', 0);
              textToken.content = supText;
              newChildren.push(textToken);
              
              const supClose = new state.Token('html_inline', '', 0);
              supClose.content = '</sup>';
              newChildren.push(supClose);
            } else {
              // Regular text
              const textToken = new state.Token('text', '', 0);
              textToken.content = part;
              newChildren.push(textToken);
            }
          });
        } else {
          newChildren.push(children[j]);
        }
      }
      
      state.tokens[i].children = newChildren;
    }
  }
  return true;
});

// 🎨 Add subscript support - Parse ~text~ to <sub> tags
md.core.ruler.after('superscript', 'subscript', (state) => {
  for (let i = 0; i < state.tokens.length; i++) {
    if (state.tokens[i].type === 'inline' && state.tokens[i].children) {
      const children = state.tokens[i].children || [];
      const newChildren: any[] = [];
      
      for (let j = 0; j < children.length; j++) {
        if (children[j].type === 'text') {
          const text = children[j].content;
          // Split by ~text~ pattern (but avoid ~~strikethrough~~)
          const parts = text.split(/([~][^~]+?[~](?!~))/g);
          
          parts.forEach(part => {
            if (!part) return;
            
            if (part.startsWith('~') && part.endsWith('~') && part.length > 2 && !part.includes('~~')) {
              // This is subscript text
              const subText = part.slice(1, -1); // Remove ~ markers
              
              // Create <sub> tag
              const subOpen = new state.Token('html_inline', '', 0);
              subOpen.content = '<sub>';
              newChildren.push(subOpen);
              
              const textToken = new state.Token('text', '', 0);
              textToken.content = subText;
              newChildren.push(textToken);
              
              const subClose = new state.Token('html_inline', '', 0);
              subClose.content = '</sub>';
              newChildren.push(subClose);
            } else {
              // Regular text
              const textToken = new state.Token('text', '', 0);
              textToken.content = part;
              newChildren.push(textToken);
            }
          });
        } else {
          newChildren.push(children[j]);
        }
      }
      
      state.tokens[i].children = newChildren;
    }
  }
  return true;
});

// 💬 Enhanced Blockquotes - Parse GitHub-style callouts like > [!note]
// This modifies blockquote_open tokens to add data-blockquote-type attribute
md.core.ruler.after('block', 'enhanced_blockquote', (state) => {
  for (let i = 0; i < state.tokens.length; i++) {
    const token = state.tokens[i];
    
    if (token.type === 'blockquote_open') {
      // Look ahead for the first paragraph content
      for (let j = i + 1; j < state.tokens.length && j < i + 10; j++) {
        const nextToken = state.tokens[j];
        
        if (nextToken.type === 'inline' && nextToken.content) {
          // Check for [!type] at the start
          const match = nextToken.content.match(/^\[!(note|tip|important|warning|caution)\]\s*/i);
          if (match) {
            const type = match[1].toLowerCase();
            // Add the type attribute to the blockquote_open token
            token.attrSet('data-blockquote-type', type);
            token.attrJoin('class', `blockquote-${type}`);
            // Remove the [!type] marker from the content
            nextToken.content = nextToken.content.substring(match[0].length);
            break;
          }
        }
        
        // Stop at blockquote_close
        if (nextToken.type === 'blockquote_close') break;
      }
    }
  }
  return true;
});

// 📢 Add callout/alert support - Parse :::type to <div> callout boxes
md.block.ruler.after('fence', 'callout', (state, startLine, endLine, silent) => {
  // Safety check
  if (!state.bCount || !state.tShift || !state.eMarks) return false;
  if (startLine >= endLine) return false;
  
  let pos = state.bCount[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];
  
  // Check for ::: at start of line
  if (pos + 3 > max) return false;
  
  const marker = state.src.slice(pos, pos + 3);
  if (marker !== ':::') return false;
  
  pos += 3;
  
  // Get callout type
  let type = state.src.slice(pos, max).trim();
  if (!type) type = 'info';
  
  // Valid types
  const validTypes = ['info', 'warning', 'danger', 'success'];
  if (!validTypes.includes(type)) type = 'info';
  
  if (silent) return true;
  
  let nextLine = startLine;
  let autoClose = false;
  
  // Search for closing :::
  for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
    if (!state.bCount[nextLine] || !state.tShift[nextLine] || !state.eMarks[nextLine]) break;
    
    pos = state.bCount[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];
    
    if (pos < max && state.sCount && state.sCount[nextLine] < state.blkIndent) {
      // Non-empty line with negative indent should stop the list
      break;
    }
    
    if (state.src.slice(pos, max).trim() === ':::') {
      autoClose = true;
      break;
    }
  }
  
  const oldParent = state.parentType;
  const oldLineMax = state.lineMax;
  state.parentType = 'callout';
  
  let token = state.push('callout_open', 'div', 1);
  token.markup = ':::';
  token.block = true;
  token.info = type;
  token.map = [startLine, nextLine];
  
  state.md.block.tokenize(state, startLine + 1, autoClose ? nextLine : nextLine + 1);
  
  token = state.push('callout_close', 'div', -1);
  token.markup = ':::';
  token.block = true;
  
  state.parentType = oldParent;
  state.lineMax = oldLineMax;
  state.line = autoClose ? nextLine + 1 : nextLine;
  
  return true;
});

// Renderer for callout_open
md.renderer.rules.callout_open = (tokens, idx) => {
  const type = tokens[idx].info || 'info';
  return `<div data-callout-type="${type}" class="callout callout-${type}">`;
};

// Renderer for callout_close
md.renderer.rules.callout_close = () => {
  return '</div>';
};

// 🎬 YouTube embed support - Parse [youtube:VIDEO_ID] and direct URLs
// IMPORTANT: Run BEFORE link parser to intercept YouTube URLs
md.inline.ruler.before('link', 'youtube', (state, silent) => {
  const start = state.pos;
  const max = state.posMax;
  
  // Check for [youtube:VIDEO_ID] syntax
  if (state.src.charCodeAt(start) === 0x5B /* [ */) {
    const match = state.src.slice(start).match(/^\[youtube:([a-zA-Z0-9_-]{11})\]/);
    if (match) {
      if (!silent) {
        const token = state.push('youtube', '', 0);
        token.content = match[1];
      }
      state.pos += match[0].length;
      return true;
    }
  }
  
  // Check for direct YouTube URLs - must run before autolink!
  if (state.src.slice(start, start + 8) === 'https://' || state.src.slice(start, start + 7) === 'http://') {
    const urlMatch = state.src.slice(start).match(/^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?][\w=&-]*)?/);
    if (urlMatch) {
      if (!silent) {
        const token = state.push('youtube', '', 0);
        token.content = urlMatch[1];
      }
      state.pos += urlMatch[0].length;
      return true;
    }
  }
  
  return false;
});

// Renderer for YouTube embeds
md.renderer.rules.youtube = (tokens, idx) => {
  const videoId = tokens[idx].content;
  return `<div data-youtube-video data-video-id="${videoId}" class="youtube-embed"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen width="640" height="360"></iframe></div>`;
};

// 📹 Vimeo embed support - Parse [vimeo:VIDEO_ID]
md.inline.ruler.before('link', 'vimeo', (state, silent) => {
  const start = state.pos;
  const max = state.posMax;
  
  // Check for [vimeo:VIDEO_ID] syntax
  if (state.src.charCodeAt(start) === 0x5B /* [ */) {
    const match = state.src.slice(start).match(/^\[vimeo:(\d{8,})\]/);
    if (match) {
      if (!silent) {
        const token = state.push('vimeo', '', 0);
        token.content = match[1];
      }
      state.pos += match[0].length;
      return true;
    }
  }
  
  return false;
});

// Renderer for Vimeo embeds
md.renderer.rules.vimeo = (tokens, idx) => {
  const videoId = tokens[idx].content;
  return `<div data-vimeo-video data-video-id="${videoId}" class="vimeo-embed"><iframe src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen width="640" height="360"></iframe></div>`;
};

// 💻 Gist embed support - Parse [gist:USERNAME/GIST_ID] or [gist:GIST_URL]
md.inline.ruler.before('link', 'gist', (state, silent) => {
  const start = state.pos;
  const max = state.posMax;
  
  // Check for [gist:...] syntax
  if (state.src.charCodeAt(start) === 0x5B /* [ */) {
    // Match [gist:username/gistid] or [gist:gistid]
    const match = state.src.slice(start).match(/^\[gist:([\w-]+(?:\/[\w-]+)?)\]/);
    if (match) {
      if (!silent) {
        const token = state.push('gist', '', 0);
        token.content = match[1]; // username/gistid or just gistid
      }
      state.pos += match[0].length;
      return true;
    }
  }
  
  return false;
});

// Renderer for Gist embeds
md.renderer.rules.gist = (tokens, idx) => {
  const gistId = tokens[idx].content;
  return `<div data-gist-embed data-gist-id="${gistId}" class="gist-embed"><script src="https://gist.github.com/${gistId}.js"></script></div>`;
};

// 📑 TOC support - Parse [TOC] or [[TOC]] placeholder
md.inline.ruler.after('link', 'toc_placeholder', (state, silent) => {
  const start = state.pos;
  const max = state.posMax;
  
  // Check for [TOC] or [[TOC]]
  if (start + 5 > max) return false;
  if (state.src.charCodeAt(start) !== 0x5B /* [ */) return false;
  
  // Check for [TOC]
  if (state.src.slice(start, start + 5) === '[TOC]') {
    if (!silent) {
      const token = state.push('toc_placeholder', '', 0);
      token.markup = '[TOC]';
    }
    state.pos = start + 5;
    return true;
  }
  
  // Check for [[TOC]]
  if (state.src.slice(start, start + 7) === '[[TOC]]') {
    if (!silent) {
      const token = state.push('toc_placeholder', '', 0);
      token.markup = '[[TOC]]';
    }
    state.pos = start + 7;
    return true;
  }
  
  return false;
});

// Render TOC placeholder as div
md.renderer.rules.toc_placeholder = () => {
  return '<div data-toc="true" data-toc-placeholder="true"></div>';
};

// FontAwesome icons removed - causing issues with mode switching

// 📝 Footnote support - Parse [^1] references and [^1]: definitions
// Parse footnote references [^1]
md.inline.ruler.after('link', 'footnote_ref', (state, silent) => {
  const start = state.pos;
  const max = state.posMax;
  
  // Check for [^
  if (start + 3 > max) return false;
  if (state.src.charCodeAt(start) !== 0x5B /* [ */) return false;
  if (state.src.charCodeAt(start + 1) !== 0x5E /* ^ */) return false;
  
  // Find the closing ]
  let labelEnd = start + 2;
  while (labelEnd < max && state.src.charCodeAt(labelEnd) !== 0x5D /* ] */) {
    labelEnd++;
  }
  
  if (labelEnd >= max) return false;
  
  const label = state.src.slice(start + 2, labelEnd);
  if (!label) return false;
  
  if (!silent) {
    const token = state.push('footnote_ref', '', 0);
    token.meta = { id: label, label };
  }
  
  state.pos = labelEnd + 1;
  return true;
});

// Renderer for footnote references
md.renderer.rules.footnote_ref = (tokens, idx) => {
  const meta = tokens[idx].meta;
  return `<sup data-footnote-id="${meta.id}" data-footnote-label="${meta.label}" class="footnote-ref"><a href="#fn-${meta.id}" id="fnref-${meta.id}" class="footnote-ref-link">[${meta.label}]</a></sup>`;
};

// Parse footnote definitions [^1]: content
md.block.ruler.after('reference', 'footnote_def', (state, startLine, endLine, silent) => {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  
  // Check for [^
  if (start + 3 > max) return false;
  if (state.src.charCodeAt(start) !== 0x5B /* [ */) return false;
  if (state.src.charCodeAt(start + 1) !== 0x5E /* ^ */) return false;
  
  // Find the closing ]:
  let labelEnd = start + 2;
  while (labelEnd < max && state.src.charCodeAt(labelEnd) !== 0x5D /* ] */) {
    labelEnd++;
  }
  
  if (labelEnd >= max) return false;
  if (state.src.charCodeAt(labelEnd + 1) !== 0x3A /* : */) return false;
  
  const label = state.src.slice(start + 2, labelEnd);
  if (!label) return false;
  
  const content = state.src.slice(labelEnd + 2, max).trim();
  
  if (!silent) {
    const token = state.push('footnote_def_open', 'div', 1);
    token.meta = { id: label, label };
    
    const inline = state.push('inline', '', 0);
    inline.content = content;
    inline.children = [];
    
    state.push('footnote_def_close', 'div', -1);
  }
  
  state.line = startLine + 1;
  return true;
});

// Renderer for footnote definitions
md.renderer.rules.footnote_def_open = (tokens, idx) => {
  const meta = tokens[idx].meta;
  return `<div data-footnote-id="${meta.id}" data-footnote-label="${meta.label}" id="fn-${meta.id}" class="footnote-def"><a href="#fnref-${meta.id}" class="footnote-backref">[${meta.label}]</a> <div class="footnote-content">`;
};

md.renderer.rules.footnote_def_close = () => {
  return '</div></div>';
};

// 📄 PDF embed support - Parse [pdf:URL]
md.inline.ruler.after('youtube', 'pdf', (state, silent) => {
  const start = state.pos;
  const max = state.posMax;
  
  // Check for [pdf:URL] syntax
  if (state.src.charCodeAt(start) === 0x5B /* [ */) {
    const match = state.src.slice(start).match(/^\[pdf:([^\]]+)\]/);
    if (match) {
      if (!silent) {
        const token = state.push('pdf', '', 0);
        token.content = match[1];
      }
      state.pos += match[0].length;
      return true;
    }
  }
  
  return false;
});

// Renderer for PDF embeds
md.renderer.rules.pdf = (tokens, idx) => {
  const src = tokens[idx].content;
  console.log('📄 PDF Renderer - Raw src:', src);
  // Clean up any bracket artifacts that might have been included
  const cleanSrc = src.replace(/^\[+/, '').replace(/\]+$/, '');
  console.log('📄 PDF Renderer - Clean src:', cleanSrc);
  // Use Google Docs viewer for better compatibility
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(cleanSrc)}&embedded=true`;
  return `<div data-pdf-embed data-pdf-src="${cleanSrc}" class="pdf-embed"><iframe src="${viewerUrl}" width="100%" height="600px"></iframe></div>`;
};

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

// 🎨 Add custom rule for highlighted text
turndownService.addRule('highlight', {
  filter: (node) => {
    return node.nodeName === 'MARK';
  },
  replacement: (content) => {
    return '==' + content + '==';
  }
});

// 💬 Add custom rule for enhanced blockquotes
turndownService.addRule('enhancedBlockquote', {
  filter: 'blockquote',
  replacement: (content, node: any) => {
    const type = node.getAttribute('data-blockquote-type');
    
    if (type && type !== 'default') {
      // GitHub-style callout format: > [!type]\n> content
      return '\n> [!' + type + ']\n> ' + content.trim().replace(/\n/g, '\n> ') + '\n\n';
    }
    
    // Regular blockquote
    return '\n> ' + content.trim().replace(/\n/g, '\n> ') + '\n\n';
  }
});

// 📢 Add custom rule for callout boxes
turndownService.addRule('callout', {
  filter: (node) => {
    return node.nodeName === 'DIV' && node.getAttribute('data-callout-type');
  },
  replacement: (content, node: any) => {
    const type = node.getAttribute('data-callout-type') || 'info';
    return '\n:::' + type + '\n' + content.trim() + '\n:::\n\n';
  }
});

// 🎬 Add custom rule for YouTube embeds
turndownService.addRule('youtube', {
  filter: (node) => {
    return node.nodeName === 'DIV' && node.getAttribute('data-youtube-video');
  },
  replacement: (content, node: any) => {
    const videoId = node.getAttribute('data-video-id');
    if (!videoId) return '';
    return `\n[youtube:${videoId}]\n\n`;
  }
});

// 📹 Add custom rule for Vimeo
turndownService.addRule('vimeo', {
  filter: (node) => {
    return node.nodeName === 'DIV' && node.getAttribute('data-vimeo-video');
  },
  replacement: (content, node: any) => {
    const videoId = node.getAttribute('data-video-id');
    if (!videoId) return '';
    return `\n[vimeo:${videoId}]\n\n`;
  }
});

// 💻 Add custom rule for Gist
turndownService.addRule('gist', {
  filter: (node) => {
    return node.nodeName === 'DIV' && node.getAttribute('data-gist-embed');
  },
  replacement: (content, node: any) => {
    const gistId = node.getAttribute('data-gist-id');
    if (!gistId) return '';
    return `\n[gist:${gistId}]\n\n`;
  }
});

// 📄 Add custom rule for PDF embeds
turndownService.addRule('pdf', {
  filter: (node) => {
    return node.nodeName === 'DIV' && node.getAttribute('data-pdf-embed');
  },
  replacement: (content, node: any) => {
    const src = node.getAttribute('data-pdf-src');
    if (!src) return '';
    return `\n[pdf:${src}]\n\n`;
  }
});

// 📑 Add custom rule for TOC
turndownService.addRule('toc', {
  filter: (node) => {
    return node.nodeName === 'DIV' && node.getAttribute('data-toc') === 'true';
  },
  replacement: () => {
    return '\n\n[TOC]\n\n';
  }
});

// FontAwesome icons removed - causing issues with mode switching

// 📝 Add custom rules for footnotes
turndownService.addRule('footnoteReference', {
  filter: (node) => {
    return node.nodeName === 'SUP' && node.getAttribute('data-footnote-id');
  },
  replacement: (content, node: any) => {
    const id = node.getAttribute('data-footnote-id');
    return `[^${id}]`;
  }
});

turndownService.addRule('footnoteDefinition', {
  filter: (node) => {
    return node.nodeName === 'DIV' && node.getAttribute('data-footnote-id') && node.classList.contains('footnote-def');
  },
  replacement: (content, node: any) => {
    const id = node.getAttribute('data-footnote-id');
    // Get text content from the footnote-content div
    const contentDiv = node.querySelector('.footnote-content');
    const text = contentDiv ? contentDiv.textContent?.trim() : content.trim();
    return `\n[^${id}]: ${text}\n`;
  }
});

// 🔥 FIX: Ensure all table cells contain at least a paragraph tag
// ProseMirror requires table cells to have block content (not just text)
const fixEmptyTableCells = (html: string): string => {
  if (!html.includes('<table')) return html;
  
  // Use DOMParser to properly handle HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Find all table cells (th and td)
  const cells = doc.querySelectorAll('td, th');
  
  cells.forEach(cell => {
    // 🔥 Preserve alignment data attribute for ProseMirror
    const align = cell.getAttribute('data-align') || cell.style.textAlign;
    
    // If cell is empty or only has text nodes (no block elements)
    const hasBlockElements = Array.from(cell.childNodes).some(node => 
      node.nodeType === 1 && ['P', 'DIV', 'UL', 'OL', 'PRE', 'BLOCKQUOTE'].includes(node.nodeName)
    );
    
    if (!hasBlockElements) {
      // Get current content (text or inline elements)
      const currentContent = cell.innerHTML.trim();
      
      // Wrap in paragraph tag
      if (currentContent === '' || currentContent === '&nbsp;') {
        // Empty cell - add empty paragraph
        cell.innerHTML = '<p></p>';
      } else {
        // Has content but no block elements - wrap in paragraph
        cell.innerHTML = `<p>${currentContent}</p>`;
      }
    }
    
    // 🔥 Reapply alignment as data attribute (will be picked up by TipTap)
    if (align) {
      cell.setAttribute('data-align', align);
    }
  });
  
  return doc.body.innerHTML;
};

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
  
  // 🔥 FIX: Ensure table cells have proper structure for ProseMirror
  html = fixEmptyTableCells(html);
  
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

// 🔥 Helper function to convert table node to markdown
const convertTableToMarkdown = (tableNode: any): string => {
  if (!tableNode.content || tableNode.content.length === 0) {
    return '';
  }
  
  let markdown = '\n';
  
  // 🔥 Track column alignments from header row
  const columnAlignments: (string | null)[] = [];
  
  // Process each row
  tableNode.content.forEach((row: any, rowIndex: number) => {
    if (!row.content) return;
    
    // Start row with pipe
    markdown += '| ';
    
    // Process each cell in the row
    row.content.forEach((cell: any, cellIndex: number) => {
      // 🔥 Capture alignment from cell attributes (first row = header)
      if (rowIndex === 0) {
        columnAlignments[cellIndex] = cell.attrs?.textAlign || null;
      }
      
      // Extract text from cell (handles paragraphs and formatted text)
      let cellText = '';
      if (cell.content) {
        cellText = cell.content.map((n: any) => {
          if (n.type === 'paragraph') {
            return n.content?.map((c: any) => {
              let text = c.text || '';
              // Handle formatting marks (bold, italic, code, highlight, underline, super/subscript)
              if (c.marks) {
                c.marks.forEach((mark: any) => {
                  if (mark.type === 'bold') text = `**${text}**`;
                  if (mark.type === 'italic') text = `*${text}*`;
                  if (mark.type === 'underline') text = `<u>${text}</u>`;
                  if (mark.type === 'code') text = `\`${text}\``;
                  if (mark.type === 'highlight') text = `==${text}==`;
                  if (mark.type === 'superscript') text = `^${text}^`;
                  if (mark.type === 'subscript') text = `~${text}~`;
                });
              }
              return text;
            }).join('') || '';
          }
          return n.text || '';
        }).join('');
      }
      
      markdown += cellText + ' | ';
    });
    
    markdown += '\n';
    
    // 🔥 Add separator row with alignment after header (first row)
    if (rowIndex === 0) {
      markdown += '| ';
      columnAlignments.forEach((align) => {
        // Convert alignment to markdown syntax
        let separator = '---';
        if (align === 'center') {
          separator = ':---:';
        } else if (align === 'right') {
          separator = '---:';
        } else if (align === 'left') {
          separator = ':---';
        }
        markdown += separator + ' | ';
      });
      markdown += '\n';
    }
  });
  
  markdown += '\n';
  return markdown;
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
          // Process marks - order matters! Links should wrap other formatting
          const hasLink = node.marks.find((m: any) => m.type === 'link');
          
          // Apply inline formatting first
          node.marks.forEach((mark: any) => {
            if (mark.type === 'bold') text2 = `**${text2}**`;
            if (mark.type === 'italic') text2 = `*${text2}*`;
            if (mark.type === 'underline') text2 = `<u>${text2}</u>`;
            if (mark.type === 'code') text2 = `\`${text2}\``;
            if (mark.type === 'strike') text2 = `~~${text2}~~`;
            if (mark.type === 'highlight') text2 = `==${text2}==`;
            if (mark.type === 'superscript') text2 = `^${text2}^`;
            if (mark.type === 'subscript') text2 = `~${text2}~`;
          });
          
          // Then wrap in link if present
          if (hasLink) {
            const href = hasLink.attrs?.href || '';
            const title = hasLink.attrs?.title || '';
            text2 = title ? `[${text2}](${href} "${title}")` : `[${text2}](${href})`;
          }
        }
        return text2;
      
      case 'mermaid':
        const code = node.attrs?.code || '';
        return `\n\`\`\`mermaid\n${code}\n\`\`\`\n\n`;
      
      // 📢 Callout/Alert boxes
      case 'callout':
        const calloutType = node.attrs?.type || 'info';
        const calloutContent = node.content?.map(processNode).join('') || '';
        return `\n:::${calloutType}\n${calloutContent.trim()}\n:::\n\n`;
      
      // 🎬 YouTube embeds
      case 'youtube':
        const videoId = node.attrs?.videoId || '';
        return `\n[youtube:${videoId}]\n\n`;
      
      // 📄 PDF embeds
      case 'pdf':
        const pdfSrc = node.attrs?.src || '';
        return `\n[pdf:${pdfSrc}]\n\n`;
      
      // 📝 Footnotes
      case 'footnoteReference':
        const refId = node.attrs?.id || node.attrs?.label || '?';
        return `[^${refId}]`;
      
      case 'footnoteDefinition':
        const defId = node.attrs?.id || node.attrs?.label || '?';
        const defContent = node.content?.map(processNode).join('').trim() || '';
        return `\n[^${defId}]: ${defContent}\n`;
      
      case 'footnotesSection':
        // Container for all footnote definitions
        return '\n' + (node.content?.map(processNode).join('') || '') + '\n';
      
      case 'toc':
        // Table of Contents placeholder
        return '\n\n[TOC]\n\n';
      
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
        const quoteType = node.attrs?.type;
        
        if (quoteType && quoteType !== 'default') {
          // GitHub-style callout format
          return `> [!${quoteType}]\n> ${quoteText.trim().replace(/\n/g, '\n> ')}\n\n`;
        }
        
        // Regular blockquote
        return `> ${quoteText.trim().replace(/\n/g, '\n> ')}\n\n`;
      
      case 'hardBreak':
        return '\n';
      
      // 🔥 FIX: Add table support (prevents tables from disappearing!)
      case 'table':
        return convertTableToMarkdown(node);
      
      case 'tableRow':
        // Handled by convertTableToMarkdown
        return '';
      
      case 'tableHeader':
      case 'tableCell':
        // Extract text from cell content
        const cellText = node.content?.map((n: any) => {
          if (n.type === 'paragraph') {
            return n.content?.map(processNode).join('') || '';
          }
          return processNode(n);
        }).join('') || '';
        return cellText;
      
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
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(false);
  const [aiAutocompleteEnabled, setAiAutocompleteEnabled] = useState(true); // Enabled by default!
  const { toast } = useToast();
  // File open/insert helpers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openReplaceNextRef = useRef<boolean>(false);
  
  // Editor mode toggle: WYSIWYG or Markdown
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg');
  const [markdownContent, setMarkdownContent] = useState('');
  const markdownTextareaRef = useRef<HTMLTextAreaElement>(null);
  // Store cursor position when switching modes
  // Store text content before cursor for better position mapping
  const savedCursorTextRef = useRef<string | null>(null);
  
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
        blockquote: false, // Use our EnhancedBlockquote instead
      }),
      Placeholder.configure({
        placeholder: 'Start writing your document... Type "/" for commands',
      }),
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize.configure({
        types: ['textStyle'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      // 🔥 Configure TableCell to support text alignment
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            textAlign: {
              default: null,
              parseHTML: element => element.getAttribute('data-align') || element.style.textAlign || null,
              renderHTML: attributes => {
                if (!attributes.textAlign) {
                  return {};
                }
                return {
                  'data-align': attributes.textAlign,
                  style: `text-align: ${attributes.textAlign}`,
                };
              },
            },
          };
        },
      }),
      // 🔥 Configure TableHeader to support text alignment
      TableHeader.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            textAlign: {
              default: null,
              parseHTML: element => element.getAttribute('data-align') || element.style.textAlign || null,
              renderHTML: attributes => {
                if (!attributes.textAlign) {
                  return {};
                }
                return {
                  'data-align': attributes.textAlign,
                  style: `text-align: ${attributes.textAlign}`,
                };
              },
            },
          };
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      // 🖼️ Enhanced Images - drag/drop, paste, captions, alignment, RESIZE
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              parseHTML: element => element.getAttribute('width'),
              renderHTML: attributes => {
                if (!attributes.width) return {};
                return { width: attributes.width };
              },
            },
            height: {
              default: null,
              parseHTML: element => element.getAttribute('height'),
              renderHTML: attributes => {
                if (!attributes.height) return {};
                return { height: attributes.height };
              },
            },
            caption: {
              default: null,
              parseHTML: element => element.getAttribute('data-caption'),
              renderHTML: attributes => {
                if (!attributes.caption) return {};
                return { 'data-caption': attributes.caption };
              },
            },
            align: {
              default: 'center',
              parseHTML: element => element.getAttribute('data-align') || 'center',
              renderHTML: attributes => {
                return { 'data-align': attributes.align || 'center' };
              },
            },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(ResizableImageNodeView);
        },
        addProseMirrorPlugins() {
          return [
            ...(this.parent?.() || []),
          ];
        },
      }).configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Link.configure({
        openOnClick: false, // Will open with Cmd/Ctrl+Click instead
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer hover:text-primary/80 transition-colors',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
        validate: (href) => /^https?:\/\//.test(href), // Only http(s) links
      }),
      // 🎨 Text Highlighting - Yellow marker effect!
      Highlight.configure({
        multicolor: false, // Single color for now (yellow)
        HTMLAttributes: {
          class: 'highlighted-text',
        },
      }),
      // 🎨 More text formatting
      Underline,
      Superscript,
      Subscript,
      // 📢 Callout/Alert Boxes
      CalloutNode,
      // 🎬 YouTube Embeds
      YouTubeNode,
      // 📹 Vimeo Embeds
      VimeoNode,
      // 📄 PDF Embeds
      PDFNode,
      // 💻 Gist Embeds
      GistNode,
      // 💬 Enhanced Blockquotes
      EnhancedBlockquote,
      // 📝 Footnotes
      FootnoteReference,
      FootnoteDefinition,
      FootnotesSection,
      // 📑 Table of Contents
      TOCNode,
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
        // Handle Cmd/Ctrl+Click to open links
        click: (view, event) => {
          const target = event.target as HTMLElement;
          
          // Check if clicked on a link
          if (target.tagName === 'A' || target.closest('a')) {
            const link = (target.tagName === 'A' ? target : target.closest('a')) as HTMLAnchorElement;
            const href = link.getAttribute('href');
            
            // Open link if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
            if ((event.metaKey || event.ctrlKey) && href) {
              event.preventDefault();
              window.open(href, '_blank', 'noopener,noreferrer');
              return true;
            }
          }
          
          return false;
        },
        // Handle YouTube URL pastes - convert to embeds automatically
        paste: (view, event) => {
          const text = event.clipboardData?.getData('text/plain');
          if (text) {
            const youtubeMatch = text.match(/^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?][\w=&-]*)?$/);
            if (youtubeMatch) {
              event.preventDefault();
              const videoId = youtubeMatch[1];
              const { state, dispatch } = view;
              const node = state.schema.nodes.youtube.create({ videoId });
              const tr = state.tr.replaceSelectionWith(node);
              dispatch(tr);
              return true;
            }
          }
          return false;
        },
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
  
  // 🔥 Apply Prism syntax highlighting to code blocks
  useEffect(() => {
    // Safety check: ensure editor and view are ready
    if (!editor || !editor.view || !editor.view.dom) {
      return;
    }
    
    const highlightCodeBlocks = async () => {
      try {
        const editorElement = editor.view.dom;
        const codeBlocks = editorElement.querySelectorAll('pre code[class*="language-"]');
        
        for (const block of Array.from(codeBlocks)) {
          // Extract language from class
          const className = block.className;
          const match = className.match(/language-(\w+)/);
          
          if (match && match[1]) {
            const lang = match[1];
            
            // Load language if not already loaded
            await loadPrismLanguage(lang);
            
            // Highlight the block
            if (Prism.languages[lang]) {
              try {
                Prism.highlightElement(block as HTMLElement);
              } catch (e) {
                console.warn('Prism highlight failed:', e);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Code highlighting error:', error);
      }
    };
    
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      highlightCodeBlocks();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [editor, editor?.state.doc]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+M: Toggle editor mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'm' && !e.shiftKey) {
        e.preventDefault();
        toggleEditorMode();
      }
      
      // Ctrl+Shift+A: Open AI Assistant
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAIModal(true);
      }
      
      // Ctrl+Shift+D: Open Diagram Menu
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDiagramMenu(true);
      }
      
      // Ctrl+Shift+M: Open Mindmap Studio
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setShowMindmapChoiceModal(true);
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
      // Switching to Markdown - save text before cursor and convert content
      console.log('  ➡️  WYSIWYG → Markdown');
      
      // Save text content before cursor for better position mapping
      const cursorPos = editor.state.selection.from;
      const textBeforeCursor = editor.state.doc.textBetween(0, cursorPos);
      savedCursorTextRef.current = textBeforeCursor;
      console.log('  📍 Saved text before cursor:', textBeforeCursor.substring(Math.max(0, textBeforeCursor.length - 50)));
      
      const markdown = htmlToMarkdown('', editor);
      console.log('  📝 Converted to markdown, length:', markdown.length);
      console.log('  📝 Preview:', markdown.substring(0, 200));
      setMarkdownContent(markdown);
      setEditorMode('markdown');
      
      // Set cursor position in markdown textarea after a short delay
      setTimeout(() => {
        if (markdownTextareaRef.current && savedCursorTextRef.current !== null) {
          // Find the text in markdown and set cursor there
          const markdownText = markdownTextareaRef.current.value;
          const searchText = savedCursorTextRef.current;
          // Try to find the text, or use approximate position
          let markdownPos = markdownText.indexOf(searchText);
          if (markdownPos === -1) {
            // Fallback: use approximate position based on text length
            markdownPos = Math.min(cursorPos, markdownText.length);
          } else {
            markdownPos += searchText.length;
          }
          markdownTextareaRef.current.setSelectionRange(markdownPos, markdownPos);
          markdownTextareaRef.current.focus();
          console.log('  📍 Set markdown cursor position:', markdownPos);
        }
      }, 50);
    } else {
      // Switching to WYSIWYG - save text before cursor in markdown and restore in WYSIWYG
      console.log('  ➡️  Markdown → WYSIWYG');
      
      // Save text content before cursor in markdown mode
      if (markdownTextareaRef.current) {
        const cursorPos = markdownTextareaRef.current.selectionStart;
        savedCursorTextRef.current = markdownContent.substring(0, cursorPos);
        console.log('  📍 Saved markdown text before cursor:', savedCursorTextRef.current.substring(Math.max(0, savedCursorTextRef.current.length - 50)));
      }
      
      console.log('  📝 markdownContent length:', markdownContent.length);
      console.log('  📝 markdownContent preview:', markdownContent.substring(0, 200));
      console.log('  🔍 Contains mermaid?', markdownContent.includes('```mermaid'));
      
      parseAndInsertMarkdown(markdownContent);
      setEditorMode('wysiwyg');
      // DON'T call onContentChange here - content hasn't changed, just the view mode
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  };
  

  // Parse markdown and insert into editor (handles mermaid blocks and FontAwesome icons specially)
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
        // Insert HTML content - TipTap will parse it
        editor.chain().insertContent(html).run();
      }
    });
    
    console.log('\n🔍 FINAL CHECK:');
    console.log('  Editor HTML length:', editor.getHTML().length);
    console.log('  Editor HTML:', editor.getHTML().substring(0, 300));
    console.log('  Editor JSON:', JSON.stringify(editor.getJSON(), null, 2).substring(0, 500));
    
    // Restore cursor position after content is inserted
    if (savedCursorTextRef.current !== null) {
      const searchText = savedCursorTextRef.current;
      // Wait for content to be fully inserted and rendered
      setTimeout(() => {
        // Find the text in the editor and set cursor there
        const docText = editor.state.doc.textContent;
        let foundPos = docText.indexOf(searchText);
        
        if (foundPos === -1) {
          // If exact match not found, try to find a substring
          // Use the last part of the saved text
          const searchLength = Math.min(50, searchText.length);
          const searchSubstring = searchText.substring(searchText.length - searchLength);
          foundPos = docText.indexOf(searchSubstring);
          if (foundPos !== -1) {
            foundPos += searchSubstring.length;
          }
        } else {
          foundPos += searchText.length;
        }
        
        if (foundPos === -1) {
          // Fallback: set cursor at the beginning
          foundPos = 0;
          console.log('📍 Could not find saved text, setting cursor at start');
        } else {
          // Ensure position is within document bounds
          const docSize = editor.state.doc.content.size;
          foundPos = Math.min(foundPos, Math.max(0, docSize - 1));
          console.log('📍 Restored cursor position:', foundPos, '(searched for:', searchText.substring(Math.max(0, searchText.length - 30)), ')');
        }
        
        // Set cursor position - don't force scroll, let browser handle it naturally
        editor.commands.setTextSelection(foundPos);
        editor.commands.focus();
        savedCursorTextRef.current = null;
      }, 200);
    }
    
    // Force a re-render to ensure mermaid diagrams display
    requestAnimationFrame(() => {
      setTimeout(() => {
        isProgrammaticUpdate.current = false;
        console.log('✅ hydration complete');
        // Don't auto-focus here - let cursor restoration handle it
      }, 50);
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

  // Detect extension
  const getFileExtension = (name: string): string => {
    const i = name.lastIndexOf('.')
    return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
  };

  // Convert raw file text to HTML suitable for editor
  const fileTextToHtml = (text: string, ext: string): string => {
    if (!text) return '';
    if (ext === 'html' || ext === 'htm') {
      return text;
    }
    // Treat everything else as markdown
    return markdownToHtml(text);
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input value so selecting same file again still triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    try {
      // Validate file type
      const ext = getFileExtension(file.name);
      const validExtensions = ['.md', '.markdown', '.txt', '.html', '.htm'];
      if (!validExtensions.some(validExt => file.name.toLowerCase().endsWith(validExt))) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a .md, .txt, or .html file.',
          variant: 'destructive',
        });
        return;
      }

      const text = await file.text();
      
      if (!text || text.trim().length === 0) {
        toast({
          title: 'Empty file',
          description: 'The selected file is empty.',
          variant: 'destructive',
        });
        return;
      }

      const html = fileTextToHtml(text, ext);
      if (!html) {
        toast({
          title: 'Failed to parse file',
          description: 'Could not read the file content.',
          variant: 'destructive',
        });
        return;
      }

      if (openReplaceNextRef.current) {
        // Replace entire document
        isProgrammaticUpdate.current = true;
        editor.commands.clearContent();
        editor.commands.setContent(html);
        requestAnimationFrame(() => {
          isProgrammaticUpdate.current = false;
          try { editor.commands.focus(); } catch {}
          // Notify parent of new content (convert via editor JSON)
          const md = htmlToMarkdown('', editor);
          onContentChange?.(md);
        });
        toast({
          title: 'File imported',
          description: `Replaced document with "${file.name}"`,
        });
      } else {
        // Insert at cursor
        editor.chain().focus().insertContent(html).run();
        toast({
          title: 'File inserted',
          description: `Inserted content from "${file.name}"`,
        });
      }
    } catch (err) {
      console.error('Failed to open file:', err);
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Failed to open file. Please try another file.',
        variant: 'destructive',
      });
    }
  };

  const triggerOpenFile = (replaceDocument: boolean) => {
    openReplaceNextRef.current = replaceDocument;
    fileInputRef.current?.click();
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
    try {
      // Convert editor content to markdown
      const markdown = htmlToMarkdown('', editor);
      
      if (!markdown || markdown.trim().length === 0) {
        toast({
          title: 'Nothing to export',
          description: 'The document is empty.',
          variant: 'destructive',
        });
        return;
      }

      // Create blob and download
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sanitizedTitle = title.trim() || 'Untitled Document';
      a.download = `${sanitizedTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: `Downloaded "${sanitizedTitle}.md"`,
      });
    } catch (err) {
      console.error('Failed to export markdown:', err);
      toast({
        title: 'Export failed',
        description: err instanceof Error ? err.message : 'Failed to export document.',
        variant: 'destructive',
      });
    }
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
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'strikethrough':
        editor.chain().focus().toggleStrike().run();
        break;
      case 'highlight':
        editor.chain().focus().toggleHighlight().run();
        break;
      case 'code':
        editor.chain().focus().toggleCode().run();
        break;
      case 'superscript':
        editor.chain().focus().toggleSuperscript().run();
        break;
      case 'subscript':
        editor.chain().focus().toggleSubscript().run();
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
    <div className="h-screen flex flex-col bg-background relative">
      {/* Floating Side Toolbar - NEW */}
      <FloatingSideToolbar
        editor={editor}
        onInsertTable={insertTable}
        onInsertLink={insertLink}
        onInsertImage={insertImage}
        onAutoFormat={handleAutoFormat}
        onAutoFormatAll={handleAutoFormatAll}
        onAIFormat={handleAIFormat}
        onShowDiagramMenu={() => setShowDiagramMenu(true)}
        onShowAIModal={() => setShowAIModal(true)}
        onShowMindmapChoice={() => {
          if (editor && onContentChange) {
            const markdown = htmlToMarkdown('', editor);
            onContentChange(markdown);
          }
          setShowMindmapChoiceModal(true);
        }}
        onShowKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
        onToggleEditorMode={toggleEditorMode}
        editorMode={editorMode}
        aiAutocompleteEnabled={aiAutocompleteEnabled}
        onAIAutocompleteChange={setAiAutocompleteEnabled}
        aiHintsEnabled={aiSuggestionsEnabled}
        onAIHintsChange={(checked) => setAiSuggestionsEnabled(checked)}
        onImportFile={triggerOpenFile}
        onExportMarkdown={exportAsMarkdown}
        onSave={() => {
          // Save functionality - can be implemented later
          if (onContentChange && editor) {
            const markdown = htmlToMarkdown('', editor);
            onContentChange(markdown);
          }
        }}
        onShare={() => {
          // Share functionality - can be implemented later
          console.log('Share clicked');
        }}
      />

      {/* Toolbar - OLD (keeping for comparison) */}
      <div className="bg-card/40 backdrop-blur-sm px-6 py-3 flex-shrink-0 mb-2">
        <div className="flex items-center justify-between w-full">
          {/* Left: Compact Toolbar */}
          <div className="flex items-center gap-2">
            {/* Unified Format Dropdown (includes Font Family & Size) */}
            <FormatDropdown
              editor={editor}
              onInsertTable={insertTable}
              onInsertLink={insertLink}
              onInsertImage={insertImage}
              onAutoFormat={handleAutoFormat}
              onAutoFormatAll={handleAutoFormatAll}
              onAIFormat={handleAIFormat}
            />

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

            {/* AI Assistant - Unified Modal */}
            <Button
              size="sm"
              className="gradient-primary border-0 text-white hover:scale-105 transition-transform"
              onClick={() => setShowAIModal(true)}
              title="AI Assistant - Text & Diagrams"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI Assistant
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

            {/* Keyboard Shortcuts */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowKeyboardShortcuts(true)}
              title="Keyboard Shortcuts (?)"
              className="gap-1"
            >
              <Keyboard className="h-4 w-4" />
            </Button>

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
              <DropdownMenuContent align="end" className="w-64">
                {/* Import Section */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Import Document
                </div>
                <DropdownMenuItem onClick={() => triggerOpenFile(false)}>
                  <Upload className="h-4 w-4 mr-2" />
                  <div className="flex flex-col">
                    <span>Insert from file</span>
                    <span className="text-xs text-muted-foreground">Add content after current document</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => triggerOpenFile(true)}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  <div className="flex flex-col">
                    <span>Replace document</span>
                    <span className="text-xs text-muted-foreground">Open file and replace all content</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                {/* Export Section */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Export Document
                </div>
                <DropdownMenuItem onClick={exportAsMarkdown}>
                  <Download className="h-4 w-4 mr-2" />
                  <div className="flex flex-col">
                    <span>Export as Markdown</span>
                    <span className="text-xs text-muted-foreground">Download as .md file</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                {/* Other Actions */}
                <DropdownMenuItem>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                  <span className="ml-auto text-xs text-muted-foreground">Ctrl+S</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Editor Content - Conditional based on mode */}
      <div className="flex-1 overflow-y-auto bg-background">
        {editorMode === 'wysiwyg' ? (
          <>
          <EditorContent editor={editor} />
            {editor && <FloatingToolbar editor={editor} />}
            {editor && <LinkHoverToolbar editor={editor} />}
          </>
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
      <div className="bg-muted/50 backdrop-blur-sm px-6 py-2 flex-shrink-0 mt-2">
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

      {/* Unified AI Modal - Text & Diagrams with context files */}
      <UnifiedAIModal
        open={showAIModal}
        onOpenChange={setShowAIModal}
        documentContent={editor ? htmlToMarkdown('', editor) : ''}
        selectedText={contextMenu.selectedText}
        contextFiles={flattenedContextFiles}
        onInsertText={(result: string) => {
          if (editor) {
            editor.chain().focus().insertContent(`\n\n${result}\n\n`).run();
          }
        }}
        onInsertDiagram={(code: string) => {
          if (editor) {
            const mermaidBlock = `\n\`\`\`mermaid\n${code}\n\`\`\`\n`;
            editor.chain().focus().insertContent(mermaidBlock).run();
          }
        }}
        defaultTab="text"
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

      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcutsPanel
        open={showKeyboardShortcuts}
        onOpenChange={setShowKeyboardShortcuts}
      />
      

      {/* Hidden file input for Open/Insert */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,.html,.htm,text/markdown,text/plain,text/html"
        className="hidden"
        onChange={handleFileChosen}
      />
    </div>
  );
};
