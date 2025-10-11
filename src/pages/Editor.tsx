import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { AIAssistantModal } from "@/components/modals/AIAssistantModal";
import { HamburgerMenu } from "@/components/layout/HamburgerMenu";
import { sessionService } from "@/services/EditorStudioSession";
import { workspaceService } from "@/services/workspace/WorkspaceService";

import { 
  Save, 
  Share, 
  Download, 
  Bold, 
  Italic, 
  Heading1, 
  Heading2,
  List,
  ListOrdered,
  Link,
  Image,
  Sparkles,
  Eye,
  EyeOff,
  Settings,
  Edit,
  Menu,
  Brain,
  Presentation as PresentationIcon,
  Library,
  FileImage,
  CreditCard,
  X,
  Home,
  FileText,
  Code,
  Info,
  MoreHorizontal,
  Upload,
  Heart,
  Search,
  Copy
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import MarkdownIt from "markdown-it";
import mermaid from "mermaid";
import { useToast } from "@/components/ui/use-toast";
import MindmapPreviewModal from "@/components/modals/MindmapPreviewModal";
import SlashCommandMenu, { createSlashCommands, type SlashCommand } from "@/components/editor/SlashCommandMenu";
import BubbleMenu, { type BubbleMenuAction } from "@/components/editor/BubbleMenu";
import AIInlineSuggestions, { useAIInlineSuggestions } from "@/components/editor/AIInlineSuggestions";
import { templateService } from "@/services/TemplateService";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface EditorProps {
  onContentChange?: (content: string) => void;
}

export default function Editor({ onContentChange }: EditorProps = {}) {
  const location = useLocation();
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [markdownContent, setMarkdownContent] = useState(() => {
    // Priority 1: Check if we have a document ID from navigation (AI generation)
    const navState = location.state as { documentId?: string } | null;
    if (navState?.documentId) {
      console.log('📄 Loading document from workspace:', navState.documentId);
      const doc = workspaceService.getDocument(navState.documentId);
      if (doc) {
        setTimeout(() => {
          setDocumentTitle(doc.title);
        }, 0);
        return doc.content;
      }
    }
    
    // Priority 2: Check if we have template content from localStorage
    const templateContent = localStorage.getItem('templateContent');
    const templateTitle = localStorage.getItem('templateTitle');
    
    if (templateContent) {
      // Clear the localStorage after using it
      localStorage.removeItem('templateContent');
      if (templateTitle) {
        localStorage.removeItem('templateTitle');
        setTimeout(() => {
          setDocumentTitle(templateTitle);
        }, 0);
      }
      return templateContent;
    }
    
    // Priority 3: Default welcome content
    return `# Welcome to MD Creator

Start writing your ideas here. MD Creator will help you transform your thoughts into beautiful documents and visual mindmaps.

## Features

- **AI-Powered Writing**: Get intelligent suggestions as you write
- **Live Preview**: See your formatted document in real-time  
- **Mindmap Generation**: Convert your text into visual mindmaps
- **Beautiful Templates**: Start with professional document templates

## Getting Started

1. Write your content using Markdown syntax
2. Use the AI Assistant for writing help
3. Generate mindmaps from your content
4. Export in multiple formats

Happy writing! ✨`;
  });
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState("editor");
  const [showAIModal, setShowAIModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobilePreviewMode, setIsMobilePreviewMode] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiEnhanceCode, setAiEnhanceCode] = useState<string | null>(null);
  const [aiTemplatePrompt, setAiTemplatePrompt] = useState<string | undefined>(undefined);
  const [showMindmapModal, setShowMindmapModal] = useState(false);
  const [mindmapModalMode, setMindmapModalMode] = useState<'headings' | 'selection'>('headings');
  const [mindmapSourceText, setMindmapSourceText] = useState<string>("");
  const [editorMenu, setEditorMenu] = useState<{ visible: boolean; x: number; y: number; insideMermaid: boolean; selection: string }>(
    { visible: false, x: 0, y: 0, insideMermaid: false, selection: '' }
  );
  const { toast } = useToast();
  
  // Mobile bottom bar modals
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showRecentFiles, setShowRecentFiles] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // Slash command menu state
  const [slashMenu, setSlashMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    searchQuery: string;
    cursorPosition: number;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    searchQuery: '',
    cursorPosition: 0,
  });

  // Bubble menu state
  const [bubbleMenu, setBubbleMenu] = useState<{
    isVisible: boolean;
    position: { x: number; y: number };
    selectedText: string;
    selectionStart: number;
    selectionEnd: number;
  }>({
    isVisible: false,
    position: { x: 0, y: 0 },
    selectedText: '',
    selectionStart: 0,
    selectionEnd: 0,
  });

  // AI inline suggestions state
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const { ghostText, handleAccept, handleReject, clearGhostText } = useAIInlineSuggestions(
    markdownContent,
    cursorPosition,
    aiSuggestionsEnabled
  );
  
  const isMobile = useIsMobile();

  // Initialize templates on mount
  useEffect(() => {
    import('@/data/templates').then(({ registerBuiltInTemplates }) => {
      registerBuiltInTemplates();
    });
  }, []);

  // Notify parent (Workspace) whenever content changes - for live outline sync
  useEffect(() => {
    if (onContentChange) {
      onContentChange(markdownContent);
    }
  }, [markdownContent, onContentChange]);
  
  // Check for Studio2 returning updates
  useEffect(() => {
    if (sessionService.hasUpdates()) {
      const updates = sessionService.getUpdates();
      if (updates) {
        console.log('✅ Studio2 updates received!', updates);
        
        // Insert diagram at cursor position
        const textarea = desktopEditorRef.current || document.getElementById('mobileCleanTextarea') as HTMLTextAreaElement;
        const cursorPos = textarea?.selectionStart || markdownContent.length;
        
        // Format diagram with mermaid fences
        const diagramText = `\n\n\`\`\`mermaid\n${updates.updatedDiagram}\n\`\`\`\n\n`;
        
        // Insert at cursor
        const newContent = 
          markdownContent.slice(0, cursorPos) +
          diagramText +
          markdownContent.slice(cursorPos);
        
        setMarkdownContent(newContent);
        
        // Show success toast
        toast({
          title: "✅ Mindmap Updated!",
          description: "Your changes from Studio2 have been applied.",
          duration: 3000,
        });
        
        // Clean up session
        sessionService.clearSession();
        sessionService.clearDraft();
      }
    }
  }, []); // Run once on mount

  const toggleMobilePreview = () => {
    setIsMobilePreviewMode(!isMobilePreviewMode);
  };

  // Calculate document stats
  const getDocumentStats = () => {
    const words = markdownContent.split(/\s+/).filter(word => word.length > 0).length;
    const characters = markdownContent.length;
    const charactersNoSpaces = markdownContent.replace(/\s/g, '').length;
    const lines = markdownContent.split('\n').length;
    const paragraphs = markdownContent.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    const imageMatches = markdownContent.match(/!\[.*?\]\(.*?\)/g);
    const mediaCount = imageMatches ? imageMatches.length : 0;
    
    return {
      words,
      characters,
      charactersNoSpaces,
      lines,
      paragraphs,
      mediaCount,
      attachments: 0 // For future implementation
    };
  };

  // Recent files functionality (mock data for now)
  const getRecentFiles = () => {
    return [
      { title: "Project Notes", date: "Today", content: "# Project Overview..." },
      { title: "Meeting Minutes", date: "Yesterday", content: "## Team Meeting..." },
      { title: "Ideas Draft", date: "2 days ago", content: "# Random Ideas..." },
    ];
  };

  // Export functionality
  const copyAsHTML = () => {
    // Simple markdown to HTML conversion for demo
    const html = markdownContent
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>');
    
    navigator.clipboard.writeText(html);
    console.log('HTML copied to clipboard');
  };

  const copyContent = () => {
    navigator.clipboard.writeText(markdownContent);
    console.log('Content copied to clipboard');
  };

  const exportAsMarkdown = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Image upload functionality
  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // For demo - in real app you'd upload to server
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          const imageMarkdown = `![${file.name}](${imageUrl})`;
          insertFormat(imageMarkdown, '');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };


  // Mobile formatting functions for clean editor
  const insertFormat = (startTag: string, endTag: string) => {
    const textarea = document.getElementById('mobileCleanTextarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    
    const newText = before + startTag + selectedText + endTag + after;
    setMarkdownContent(newText);
    
    setTimeout(() => {
      const newCursorPos = start + startTag.length + selectedText.length + endTag.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertHeading = (headingTag: string) => {
    const textarea = document.getElementById('mobileCleanTextarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(start);
    
    const lineStart = before.lastIndexOf('\n') + 1;
    const beforeLine = before.substring(0, lineStart);
    const currentLine = before.substring(lineStart);
    
    const newText = beforeLine + headingTag + currentLine + after;
    setMarkdownContent(newText);
    
    setTimeout(() => {
      const newCursorPos = start + headingTag.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertList = (listTag: string) => {
    const textarea = document.getElementById('mobileCleanTextarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(start);
    
    const lineStart = before.lastIndexOf('\n') + 1;
    const beforeLine = before.substring(0, lineStart);
    const currentLine = before.substring(lineStart);
    
    const newText = beforeLine + listTag + currentLine + after;
    setMarkdownContent(newText);
    
    setTimeout(() => {
      const newCursorPos = start + listTag.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertLink = () => {
    const textarea = document.getElementById('mobileCleanTextarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    const linkText = selectedText || 'Link Text';
    const linkFormat = `[${linkText}](URL)`;
    
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    
    const newText = before + linkFormat + after;
    setMarkdownContent(newText);
    
    setTimeout(() => {
      const urlStart = start + linkText.length + 3;
      const urlEnd = urlStart + 3;
      textarea.focus();
      textarea.setSelectionRange(urlStart, urlEnd);
    }, 0);
  };

  const insertCode = () => {
    const textarea = document.getElementById('mobileTextarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (selectedText.includes('\n')) {
      insertFormat('```\n', '\n```');
    } else {
      insertFormat('`', '`');
    }
  };

  const insertImage = () => {
    const textarea = document.getElementById('mobileTextarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    const altText = selectedText || 'Alt text';
    const imageFormat = `![${altText}](image-url)`;
    
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    
    const newText = before + imageFormat + after;
    setMarkdownContent(newText);
    
    setTimeout(() => {
      const urlStart = start + altText.length + 4;
      const urlEnd = urlStart + 9;
      textarea.focus();
      textarea.setSelectionRange(urlStart, urlEnd);
    }, 0);
  };

  // Mobile file operations (desktop parity)
  const handleMobileSave = () => {
    // Implement save logic
    console.log('Saving document:', documentTitle);
    // You can implement actual save logic here
  };

  const handleMobileShare = () => {
    // Implement native sharing
    if (navigator.share) {
      navigator.share({
        title: documentTitle,
        text: markdownContent,
      }).catch(console.error);
    } else {
      // Fallback for browsers without native sharing
      navigator.clipboard.writeText(markdownContent);
      console.log('Content copied to clipboard');
    }
  };

  const handleMobileExport = () => {
    // Implement export functionality
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Desktop formatting functions (target desktop textarea)
  const getDesktopTextarea = () => {
    return document.querySelector('.desktop-editor-textarea') as HTMLTextAreaElement;
  };

  const insertDesktopFormat = (startTag: string, endTag: string) => {
    const textarea = getDesktopTextarea();
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    
    const newText = before + startTag + selectedText + endTag + after;
    setMarkdownContent(newText);
    
    setTimeout(() => {
      const newCursorPos = start + startTag.length + selectedText.length + endTag.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertDesktopHeading = (headingTag: string) => {
    const textarea = getDesktopTextarea();
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(start);
    
    const lineStart = before.lastIndexOf('\n') + 1;
    const beforeLine = before.substring(0, lineStart);
    const currentLine = before.substring(lineStart);
    
    const newText = beforeLine + headingTag + currentLine + after;
    setMarkdownContent(newText);
    
    setTimeout(() => {
      const newCursorPos = start + headingTag.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertDesktopList = (listTag: string) => {
    const textarea = getDesktopTextarea();
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(start);
    
    const lineStart = before.lastIndexOf('\n') + 1;
    const beforeLine = before.substring(0, lineStart);
    const currentLine = before.substring(lineStart);
    
    const newText = beforeLine + listTag + currentLine + after;
    setMarkdownContent(newText);
    
    setTimeout(() => {
      const newCursorPos = start + listTag.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertDesktopLink = () => {
    const textarea = getDesktopTextarea();
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    const linkText = selectedText || 'Link Text';
    const linkFormat = `[${linkText}](URL)`;
    
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    
    const newText = before + linkFormat + after;
    setMarkdownContent(newText);
    
    setTimeout(() => {
      const urlStart = start + linkText.length + 3;
      const urlEnd = urlStart + 3;
      textarea.focus();
      textarea.setSelectionRange(urlStart, urlEnd);
    }, 0);
  };

  const insertDesktopImage = () => {
    const textarea = getDesktopTextarea();
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    const altText = selectedText || 'Alt text';
    const imageFormat = `![${altText}](image-url)`;
    
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    
    const newText = before + imageFormat + after;
    setMarkdownContent(newText);
    
    setTimeout(() => {
      const urlStart = start + altText.length + 4;
      const urlEnd = urlStart + 9;
      textarea.focus();
      textarea.setSelectionRange(urlStart, urlEnd);
    }, 0);
  };

  // Markdown-It + Mermaid preview
  const previewRef = useRef<HTMLDivElement | null>(null);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const desktopEditorRef = useRef<HTMLTextAreaElement | null>(null);

  // Configure mermaid once
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'default', logLevel: 'error' });
  }, []);

  const md = new MarkdownIt({ html: true, linkify: true, typographer: true, breaks: true, highlight: (str, lang) => str });

  // Context menu for rendered mermaid diagrams
  const [mmdMenu, setMmdMenu] = useState<{ visible: boolean; x: number; y: number; code: string }>({
    visible: false,
    x: 0,
    y: 0,
    code: '',
  });

  const preprocessMermaid = (content: string) => {
    const trimmed = content?.trim() ?? '';
    if (!trimmed) return content;
    const keywords = ['flowchart', 'graph', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'gitgraph', 'mindmap'];
    const lines = trimmed.split('\n');
    const processed: string[] = [];
    let inFence = false;
    lines.forEach((line) => {
      if (line.startsWith('```')) inFence = !inFence;
      if (!inFence) {
        const starts = keywords.some((k) => line.startsWith(k));
        if (starts) {
          processed.push('```mermaid');
          processed.push(line);
          processed.push('```');
          return;
        }
      }
      processed.push(line);
    });
    return processed.join('\n');
  };

  const renderPreview = (content: string) => {
    if (!previewRef.current) return;
    const wrapped = preprocessMermaid(content);
    previewRef.current.innerHTML = md.render(wrapped);
    // Post-process mermaid code blocks
    const codeBlocks = previewRef.current.querySelectorAll('pre code.language-mermaid');
    let idx = 0;
    codeBlocks.forEach(async (block) => {
      const code = block.textContent || '';
      const parent = block.parentElement as HTMLElement;
      if (!parent) return;
      try {
        const { svg } = await mermaid.render(`mmd-${Date.now()}-${idx++}`, code);
        const container = document.createElement('div');
        container.innerHTML = svg;
        container.style.position = 'relative';
        container.setAttribute('data-mermaid', 'true');
        container.addEventListener('contextmenu', (ev) => {
          ev.preventDefault();
          const rect = previewScrollRef.current?.getBoundingClientRect();
          const left = (rect ? ev.clientX - rect.left : ev.clientX) + (previewScrollRef.current?.scrollLeft || 0);
          const top = (rect ? ev.clientY - rect.top : ev.clientY) + (previewScrollRef.current?.scrollTop || 0);
          setMmdMenu({ visible: true, x: left, y: top, code });
        });
        parent.replaceWith(container);
      } catch (e: any) {
        // Replace diagram with a compact, friendly error card and optional details
        const message = e?.message ? String(e.message) : 'Invalid Mermaid code';
        const lineMatch = message.match(/line\s+(\d+)/i);
        const errorLine = lineMatch ? parseInt(lineMatch[1], 10) : null;

        const card = document.createElement('div');
        card.className = 'rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground';

        const title = document.createElement('div');
        title.className = 'font-medium text-foreground mb-1';
        title.textContent = 'Diagram failed to render';

        const subtitle = document.createElement('div');
        subtitle.className = 'text-destructive mb-3';
        subtitle.textContent = `Syntax error${errorLine ? ` on line ${errorLine}` : ''}: ${message}`;

        const actions = document.createElement('div');
        actions.className = 'flex items-center gap-2';

        const primary = document.createElement('button');
        primary.className = 'inline-flex items-center px-2.5 py-1.5 rounded-md bg-destructive text-destructive-foreground hover:opacity-90';
        primary.textContent = 'Fix with AI';
        primary.addEventListener('click', () => {
          setAiEnhanceCode(code);
          setAiTemplatePrompt(`Fix validation error: ${message}. Keep layout and IDs stable; minimal changes.`);
          setAiOpen(true);
        });

        const retry = document.createElement('button');
        retry.className = 'inline-flex items-center px-2.5 py-1.5 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10';
        retry.textContent = 'Retry';
        retry.addEventListener('click', () => validateMermaid(code));

        const detailsToggle = document.createElement('button');
        detailsToggle.className = 'inline-flex items-center px-2.5 py-1.5 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10';
        detailsToggle.textContent = 'Show details';

        const docs = document.createElement('a');
        docs.className = 'inline-flex items-center px-2.5 py-1.5 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10';
        docs.textContent = 'Docs';
        docs.href = 'https://mermaid.js.org/syntax/flowchart.html';
        docs.target = '_blank';

        const copyErr = document.createElement('button');
        copyErr.className = 'inline-flex items-center px-2.5 py-1.5 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10';
        copyErr.textContent = 'Copy error';
        copyErr.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(message); } catch {}
        });

        actions.appendChild(primary);
        actions.appendChild(retry);
        actions.appendChild(detailsToggle);
        actions.appendChild(docs);
        actions.appendChild(copyErr);

        const details = document.createElement('div');
        details.style.display = 'none';
        details.className = 'mt-3 rounded-md border border-destructive/20 bg-background';

        const controls = document.createElement('div');
        controls.className = 'flex items-center justify-between px-3 py-2 text-xs text-muted-foreground border-b border-destructive/20';
        controls.textContent = 'Raw code';
        const copyCode = document.createElement('button');
        copyCode.className = 'px-2 py-1 rounded-md border hover:bg-accent';
        copyCode.textContent = 'Copy code';
        copyCode.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(code); } catch {}
        });
        controls.appendChild(copyCode);

        const pre = document.createElement('pre');
        pre.className = 'max-h-64 overflow-auto text-xs p-3';
        const codeEl = document.createElement('code');
        const escapeHtml = (s: string) => s
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const lines = escapeHtml(code).split('\n');
        codeEl.innerHTML = lines.map((ln, i) => {
          const isErr = errorLine != null && i === errorLine - 1;
          const style = isErr
            ? 'background: rgba(220,38,38,.10); border-left: 3px solid rgb(220,38,38);'
            : '';
          return `<div style="display:flex; gap:.75rem; align-items:baseline; ${style}">`+
            `<span style="user-select:none; opacity:.6; width:2.5rem; text-align:right;">${i+1}</span>`+
            `<span>${ln || '&nbsp;'}</span>`+
          `</div>`;
        }).join('');
        pre.appendChild(codeEl);
        details.appendChild(controls);
        details.appendChild(pre);

        detailsToggle.addEventListener('click', () => {
          const open = details.style.display !== 'none';
          details.style.display = open ? 'none' : 'block';
          detailsToggle.textContent = open ? 'Show details' : 'Hide details';
          if (!open && errorLine != null) {
            const child = codeEl.children[errorLine - 1] as HTMLElement | undefined;
            if (child) pre.scrollTop = Math.max(0, child.offsetTop - 40);
          }
        });

        card.appendChild(title);
        card.appendChild(subtitle);
        card.appendChild(actions);
        card.appendChild(details);
        parent.replaceWith(card);
      }
    });
  };

  // Validate a mermaid snippet and optionally open AI Fix flow
  const validateMermaid = async (code: string) => {
    try {
      const id = `validate-${Date.now()}`;
      await mermaid.render(id, code);
      toast({ title: 'Diagram is valid', description: 'Mermaid diagram parsed successfully.' });
      return true;
    } catch (err: any) {
      const message = err?.message || 'Invalid Mermaid code';
      toast({ title: 'Validation failed', description: message, variant: 'destructive' as any });
      // Offer AI fix: seed modal with an instruction
      setAiEnhanceCode(code);
      setAiTemplatePrompt(`Fix validation error: ${message}. Keep layout similar, minimal changes.`);
      setAiOpen(true);
      return false;
    }
  };

  // ============ SLASH COMMANDS ============
  
  // Insert text at cursor position (slash command handler)
  const insertAtCursor = (text: string, moveCursorBy: number = 0) => {
    const textarea = desktopEditorRef.current;
    if (!textarea) return;

    const start = slashMenu.cursorPosition;
    const end = textarea.selectionStart;
    const before = markdownContent.slice(0, start);
    const after = markdownContent.slice(end);

    const newContent = before + text + after;
    setMarkdownContent(newContent);

    // Close slash menu
    setSlashMenu(prev => ({ ...prev, isOpen: false }));

    // Move cursor
    setTimeout(() => {
      if (!textarea) return;
      const newCursorPos = start + text.length + moveCursorBy;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle AI actions from slash commands
  const handleSlashAIAction = (action: string) => {
    setSlashMenu(prev => ({ ...prev, isOpen: false }));

    switch (action) {
      case 'continue':
        setAiTemplatePrompt('Continue writing from where I left off, maintaining the same tone and style.');
        setAiOpen(true);
        break;
      case 'improve':
        setAiTemplatePrompt('Improve this text for clarity, grammar, and readability.');
        setAiOpen(true);
        break;
      case 'mindmap':
        setShowMindmapModal(true);
        setMindmapModalMode('headings');
        break;
      case 'summarize':
        setAiTemplatePrompt('Create a concise summary of this content.');
        setAiOpen(true);
        break;
    }
  };

  // Handle template actions from slash commands
  const handleTemplateAction = (templateId: string) => {
    setSlashMenu(prev => ({ ...prev, isOpen: false }));

    try {
      // Import templates (this should be done at module level, but doing it here for now)
      import('@/data/templates').then(({ registerBuiltInTemplates }) => {
        registerBuiltInTemplates();

        // Render the template
        const renderedContent = templateService.renderTemplate(templateId, {
          includeDate: true,
        });

        // Insert at cursor
        insertAtCursor(renderedContent + '\n\n', 0);
      });
    } catch (error) {
      console.error('Template insertion failed:', error);
      // Fallback: just insert a basic template
      insertAtCursor(`# ${templateId.replace('-', ' ').toUpperCase()}\n\n[Template content would go here]\n\n`, 0);
    }
  };

  // Create slash commands
  const slashCommands = createSlashCommands(insertAtCursor, handleSlashAIAction, handleTemplateAction);

  // Handle slash command selection
  const handleSlashCommandSelect = (command: SlashCommand) => {
    command.action();
  };

  // ============ BUBBLE MENU ============

  // Show bubble menu on text selection
  const handleTextSelection = () => {
    const textarea = desktopEditorRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = markdownContent.slice(selectionStart, selectionEnd);

    // Only show if there's actual text selected
    if (selectedText.trim().length > 0) {
      const rect = textarea.getBoundingClientRect();
      
      // Calculate position above the selection
      // This is approximate - in production you'd calculate exact line position
      const lineHeight = 24;
      const textBeforeSelection = markdownContent.slice(0, selectionStart);
      const lines = textBeforeSelection.split('\n').length;
      
      setBubbleMenu({
        isVisible: true,
        position: {
          x: rect.left + rect.width / 2 - 200, // Center approximately
          y: rect.top + (lines * lineHeight) - 60, // Position above selection
        },
        selectedText,
        selectionStart,
        selectionEnd,
      });
    } else {
      setBubbleMenu(prev => ({ ...prev, isVisible: false }));
    }
  };

  // Handle bubble menu actions
  const handleBubbleMenuAction = (action: BubbleMenuAction) => {
    const textarea = desktopEditorRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = bubbleMenu;
    const selectedText = bubbleMenu.selectedText;
    const before = markdownContent.slice(0, selectionStart);
    const after = markdownContent.slice(selectionEnd);

    let newText = '';
    let newCursorPos = selectionEnd;

    if (action.type === 'format') {
      // Format the selected text
      switch (action.action) {
        case 'bold':
          newText = `**${selectedText}**`;
          newCursorPos = selectionStart + newText.length;
          break;
        case 'italic':
          newText = `*${selectedText}*`;
          newCursorPos = selectionStart + newText.length;
          break;
        case 'code':
          newText = `\`${selectedText}\``;
          newCursorPos = selectionStart + newText.length;
          break;
        case 'strikethrough':
          newText = `~~${selectedText}~~`;
          newCursorPos = selectionStart + newText.length;
          break;
        case 'link':
          newText = `[${selectedText}](URL)`;
          newCursorPos = selectionStart + newText.length - 1; // Position before )
          break;
        default:
          newText = selectedText;
      }

      setMarkdownContent(before + newText + after);
      setBubbleMenu(prev => ({ ...prev, isVisible: false }));

      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);

    } else if (action.type === 'ai') {
      // AI actions - open AI modal with context
      setBubbleMenu(prev => ({ ...prev, isVisible: false }));
      
      switch (action.action) {
        case 'improve':
          setAiTemplatePrompt(`Improve this text for clarity and grammar:\n\n"${selectedText}"\n\nProvide only the improved version, no explanations.`);
          setAiOpen(true);
          break;
        case 'summarize':
          setAiTemplatePrompt(`Summarize this text concisely:\n\n"${selectedText}"\n\nProvide only the summary, no explanations.`);
          setAiOpen(true);
          break;
        case 'expand':
          setAiTemplatePrompt(`Expand this text with more detail:\n\n"${selectedText}"\n\nProvide only the expanded version, no explanations.`);
          setAiOpen(true);
          break;
        case 'translate':
          setAiTemplatePrompt(`Translate this text to Spanish:\n\n"${selectedText}"\n\nProvide only the translation.`);
          setAiOpen(true);
          break;
        case 'tone':
          setAiTemplatePrompt(`Rewrite this text in a professional tone:\n\n"${selectedText}"\n\nProvide only the rewritten version.`);
          setAiOpen(true);
          break;
      }

    } else if (action.type === 'convert') {
      // Convert selected text to different format
      const lines = selectedText.split('\n');
      
      switch (action.action) {
        case 'h1':
          newText = `# ${selectedText}`;
          break;
        case 'h2':
          newText = `## ${selectedText}`;
          break;
        case 'h3':
          newText = `### ${selectedText}`;
          break;
        case 'bullet':
          newText = lines.map(line => line.trim() ? `- ${line.trim()}` : '').join('\n');
          break;
        case 'quote':
          newText = lines.map(line => line.trim() ? `> ${line.trim()}` : '').join('\n');
          break;
        case 'code':
          newText = `\`\`\`\n${selectedText}\n\`\`\``;
          break;
        default:
          newText = selectedText;
      }

      setMarkdownContent(before + newText + after);
      setBubbleMenu(prev => ({ ...prev, isVisible: false }));

      setTimeout(() => {
        textarea.focus();
        const newPos = selectionStart + newText.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  // ============ AI INLINE SUGGESTIONS ============

  // Accept AI suggestion (when user presses Tab)
  const handleAcceptSuggestion = (suggestion: string) => {
    const textarea = desktopEditorRef.current;
    if (!textarea) return;

    // Insert suggestion at cursor position
    const before = markdownContent.slice(0, cursorPosition);
    const after = markdownContent.slice(cursorPosition);
    const newContent = before + suggestion + after;
    
    setMarkdownContent(newContent);
    clearGhostText();

    // Move cursor to end of inserted suggestion
    setTimeout(() => {
      if (!textarea) return;
      const newCursorPos = cursorPosition + suggestion.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      setCursorPosition(newCursorPos);
    }, 0);
  };

  // Update cursor position on change
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMarkdownContent(value);
    setCursorPosition(e.target.selectionStart);
    
    // Detect slash command
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastLine = textBeforeCursor.split('\n').pop() || '';
    
    // Check if we just typed '/' at the start of a line or after whitespace
    const slashMatch = lastLine.match(/(?:^|\s)(\/\w*)$/);
    
    if (slashMatch) {
      const searchQuery = slashMatch[1].slice(1); // Remove the '/'
      const textarea = e.target;
      const rect = textarea.getBoundingClientRect();
      
      // Calculate approximate menu position
      const lineHeight = 24;
      const lines = textBeforeCursor.split('\n').length;
      
      setSlashMenu({
        isOpen: true,
        position: {
          x: rect.left + 40,
          y: rect.top + (lines * lineHeight) + 20,
        },
        searchQuery,
        cursorPosition: cursorPos - slashMatch[1].length,
      });
    } else if (slashMenu.isOpen) {
      setSlashMenu(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Sync preview scroll with editor scroll (split view)
  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (!previewScrollRef.current) return;
    const src = e.currentTarget;
    const srcScrollable = src.scrollHeight - src.clientHeight;
    const ratio = srcScrollable > 0 ? src.scrollTop / srcScrollable : 0;
    const dst = previewScrollRef.current;
    const dstScrollable = dst.scrollHeight - dst.clientHeight;
    dst.scrollTop = ratio * dstScrollable;
  };

  // Also sync when user scrolls the preview (mirror to editor) to prevent drift
  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const editor = document.querySelector('.desktop-editor-textarea') as HTMLTextAreaElement | null;
    if (!editor) return;
    const src = e.currentTarget;
    const srcScrollable = src.scrollHeight - src.clientHeight;
    const ratio = srcScrollable > 0 ? src.scrollTop / srcScrollable : 0;
    const dstScrollable = editor.scrollHeight - editor.clientHeight;
    editor.scrollTop = ratio * dstScrollable;
  };

  // Render preview when content changes
  useEffect(() => {
    // Slight defer to ensure previewRef exists after layout changes
    const t = setTimeout(() => renderPreview(markdownContent), 0);
    return () => clearTimeout(t);
  }, [markdownContent]);

  // Re-render when toggling preview modes (mobile) or mounting preview container
  useEffect(() => {
    const t = setTimeout(() => renderPreview(markdownContent), 0);
    return () => clearTimeout(t);
  }, [isMobilePreviewMode]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Desktop Header - ONLY DESKTOP */}
      <div className="desktop-header hidden md:flex border-b border-border bg-card px-6 py-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {/* Text Formatting */}
            <Button size="sm" variant="ghost" onClick={() => insertDesktopFormat('**', '**')} title="Bold">
              <Bold className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertDesktopFormat('*', '*')} title="Italic">
              <Italic className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertDesktopHeading('# ')} title="Header 1">
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertDesktopHeading('## ')} title="Header 2">
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertDesktopList('- ')} title="Bullet List">
              <List className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertDesktopList('1. ')} title="Numbered List">
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertDesktopLink()} title="Link">
              <Link className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertDesktopImage()} title="Image">
              <Image className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-2" />

            {/* AI Assistant */}
            <Button 
              size="sm" 
              className="gradient-primary border-0 text-white hover:scale-105 transition-transform"
              onClick={() => setShowAIModal(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>

            {/* Prepare Presentation */}
            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:scale-105 transition-transform"
              onClick={() => {
                // Save content to session
                const sessionKey = `pres-session-${Date.now()}`;
                localStorage.setItem('presentation-session', sessionKey);
                localStorage.setItem(`editor-${sessionKey}`, markdownContent);
                
                // Navigate to presentation editor
                const presentationId = `pres-${Date.now()}`;
                window.location.href = `/presentation/${presentationId}/edit`;
              }}
            >
              <PresentationIcon className="h-4 w-4 mr-2" />
              📊 Prepare Presentation
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              // If user has selection in desktop editor, prefer selection mode
              const ta = document.querySelector('.desktop-editor-textarea') as HTMLTextAreaElement | null;
              if (ta) {
                const sel = ta.value.substring(ta.selectionStart, ta.selectionEnd);
                if (sel && sel.trim().length > 0) {
                  setMindmapModalMode('selection');
                  setMindmapSourceText(sel);
                  setShowMindmapModal(true);
                  return;
                }
              }
              setMindmapModalMode('headings');
              setMindmapSourceText(markdownContent);
              setShowMindmapModal(true);
            }} title="Generate mindmap from headings or selection">
              <Library className="h-4 w-4 mr-2" />
              Mindmap
            </Button>

            {/* AI Suggestions Toggle */}
            <div className="flex items-center gap-2 px-3 py-1 border rounded-md bg-white">
              <Switch
                id="ai-suggestions"
                checked={aiSuggestionsEnabled}
                onCheckedChange={setAiSuggestionsEnabled}
              />
              <Label htmlFor="ai-suggestions" className="text-sm cursor-pointer flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Document Title */}
            <Input 
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-48 text-center font-medium"
            />
            
            <Separator orientation="vertical" className="h-6 mx-2" />
            
            {/* File Actions */}
            <Button size="sm" variant="default">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button size="sm" variant="outline">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            {/* Settings */}
            <Button size="sm" variant="ghost">
              <Settings className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistantModal
        open={showAIModal}
        onOpenChange={setShowAIModal}
        documentContent={markdownContent}
        onInsert={(code) => {
          // Insert at cursor position - handle both desktop and mobile editors
          const desktopTextarea = document.querySelector('.desktop-editor-textarea') as HTMLTextAreaElement;
          const mobileTextarea = document.getElementById('mobileCleanTextarea') as HTMLTextAreaElement;

          if (desktopTextarea) {
            const start = desktopTextarea.selectionStart;
            const before = markdownContent.slice(0, start);
            const after = markdownContent.slice(start);
            const newContent = before + '\n\n```mermaid\n' + code + '\n```\n\n' + after;
            setMarkdownContent(newContent);

            // Move cursor to after the inserted diagram
            setTimeout(() => {
              const newCursorPos = start + '\n\n```mermaid\n' + code + '\n```\n\n'.length;
              desktopTextarea.focus();
              desktopTextarea.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
          } else if (mobileTextarea) {
            const start = mobileTextarea.selectionStart;
            const before = markdownContent.slice(0, start);
            const after = markdownContent.slice(start);
            const newContent = before + '\n\n```mermaid\n' + code + '\n```\n\n' + after;
            setMarkdownContent(newContent);

            // Move cursor to after the inserted diagram
            setTimeout(() => {
              const newCursorPos = start + '\n\n```mermaid\n' + code + '\n```\n\n'.length;
              mobileTextarea.focus();
              mobileTextarea.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
          }
        }}
      />
      {/* Enhance with AI (context menu) */}
      <AIAssistantModal
        open={aiOpen}
        onOpenChange={setAiOpen}
        documentContent={markdownContent}
        enhanceMode={true}
        initialDiagramCode={aiEnhanceCode || ''}
        initialTemplatePrompt={aiTemplatePrompt}
        onInsert={(code) => {
          // Insert: if enhancing, replace the last fenced mermaid block
          const blockRegex = /```mermaid\n([\s\S]*?)\n```/g;
          let replaced = false;
          const newContent = markdownContent.replace(blockRegex, (match) => {
            if (!replaced && aiEnhanceCode && match.includes(aiEnhanceCode)) {
              replaced = true;
              return '```mermaid\n' + code + '\n```';
            }
            return match;
          });
          if (!replaced) {
            // Fallback: append
            setMarkdownContent((prev) => prev + '\n\n```mermaid\n' + code + '\n```');
          } else {
            setMarkdownContent(newContent);
          }
          // Reset template prompt after insert
          setAiTemplatePrompt(undefined);
        }}
      />

      {/* Mindmap Preview Modal */}
      <MindmapPreviewModal
        open={showMindmapModal}
        onOpenChange={setShowMindmapModal}
        markdown={mindmapModalMode === 'selection' ? mindmapSourceText : markdownContent}
        mode={mindmapModalMode}
        documentTitle={documentTitle}
        cursorPosition={cursorPosition}
        onInsertMermaid={(code) => {
          // Insert at caret if possible; otherwise append
          const ta = document.querySelector('.desktop-editor-textarea') as HTMLTextAreaElement | null;
          if (ta) {
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const before = markdownContent.substring(0, start);
            const after = markdownContent.substring(end);
            const block = '\n```mermaid\n' + code + '\n```\n';
            setMarkdownContent(before + block + after);
            return;
          }
          setMarkdownContent((prev) => prev + '\n\n```mermaid\n' + code + '\n```');
        }}
      />

      {/* Editor Area */}
      <div className="flex-1 relative min-h-0">
      {/* Mobile: Clean Editor - Maximum Writing Space */}
      {isMobile ? (
        <div className="mobile-editor-clean">
          <div className="pure-writing-space">
            {!isMobilePreviewMode ? (
              <textarea
                id="mobileCleanTextarea"
                className="clean-textarea"
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                placeholder="Start writing your thoughts..."
                style={{ fontSize: '17px' }}
                autoCapitalize="sentences"
                autoCorrect="on"
                spellCheck="true"
              />
            ) : (
              <div className="clean-preview">
                <div ref={previewRef} className="prose prose-lg max-w-none" />
              </div>
            )}
          </div>
          
          {/* Bottom Icon Bar - Clean Purple Icons */}
          <div className="bottom-icon-bar">
            <div className="icon-group">
              {/* Info Icon */}
              <button className="bottom-icon" onClick={() => setShowInfoModal(true)} title="Document Info">
                <Info className="w-4 h-4" />
              </button>
              
              {/* Recent Files Icon */}
              <button className="bottom-icon" onClick={() => setShowRecentFiles(true)} title="Recent Files">
                <FileText className="w-4 h-4" />
              </button>
              
              {/* Preview Icon */}
              <button 
                className={`bottom-icon ${isMobilePreviewMode ? 'preview-active' : ''}`}
                onClick={() => setIsMobilePreviewMode(!isMobilePreviewMode)}
                title="Preview"
              >
                {isMobilePreviewMode ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              
              {/* More Options (Three Dots) */}
              <button className="bottom-icon" onClick={() => setShowMoreOptions(true)} title="More Options">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              {/* Export Icon */}
              <button className="bottom-icon" onClick={() => setShowExportOptions(true)} title="Export Options">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Info Modal */}
          {showInfoModal && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
              <div className="w-full bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Document Info</h3>
                  <button onClick={() => setShowInfoModal(false)} className="text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Words:</span>
                    <span className="font-medium text-gray-900">{getDocumentStats().words}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Characters:</span>
                    <span className="font-medium text-gray-900">{getDocumentStats().characters}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Characters (no spaces):</span>
                    <span className="font-medium text-gray-900">{getDocumentStats().charactersNoSpaces}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lines:</span>
                    <span className="font-medium text-gray-900">{getDocumentStats().lines}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paragraphs:</span>
                    <span className="font-medium text-gray-900">{getDocumentStats().paragraphs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Media:</span>
                    <span className="font-medium text-gray-900">{getDocumentStats().mediaCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Attachments:</span>
                    <span className="font-medium text-gray-900">{getDocumentStats().attachments}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Files Modal */}
          {showRecentFiles && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
              <div className="w-full bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Files</h3>
                  <button onClick={() => setShowRecentFiles(false)} className="text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {getRecentFiles().map((file, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{file.title}</h4>
                        <span className="text-sm text-gray-500">{file.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{file.content}</p>
                      <button 
                        className="mt-2 text-sm text-purple-600 font-medium"
                        onClick={() => {
                          setMarkdownContent(file.content);
                          setDocumentTitle(file.title);
                          setShowRecentFiles(false);
                        }}
                      >
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* More Options Modal */}
          {showMoreOptions && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
              <div className="w-full bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">More Options</h3>
                  <button onClick={() => setShowMoreOptions(false)} className="text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <button 
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                    onClick={() => {
                      handleImageUpload();
                      setShowMoreOptions(false);
                    }}
                  >
                    <Upload className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-900">Upload Image</span>
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                    onClick={() => {
                      console.log('Add to favorites');
                      setShowMoreOptions(false);
                    }}
                  >
                    <Heart className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-900">Add to Favorites</span>
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                    onClick={() => {
                      console.log('Find and replace');
                      setShowMoreOptions(false);
                    }}
                  >
                    <Search className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-900">Find & Replace</span>
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                    onClick={() => {
                      copyContent();
                      setShowMoreOptions(false);
                    }}
                  >
                    <Copy className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-900">Copy Link</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Export Options Modal */}
          {showExportOptions && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
              <div className="w-full bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
                  <button onClick={() => setShowExportOptions(false)} className="text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <button 
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                    onClick={() => {
                      copyAsHTML();
                      setShowExportOptions(false);
                    }}
                  >
                    <Code className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-900">Copy HTML</span>
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                    onClick={() => {
                      copyContent();
                      setShowExportOptions(false);
                    }}
                  >
                    <Copy className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-900">Copy Text</span>
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                    onClick={() => {
                      exportAsMarkdown();
                      setShowExportOptions(false);
                    }}
                  >
                    <Download className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-900">Export as Markdown</span>
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                    onClick={() => {
                      console.log('Save document');
                      setShowExportOptions(false);
                    }}
                  >
                    <Save className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-900">Save Document</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Assistant Modal */}
          <AIAssistantModal
            open={showAIModal}
            onOpenChange={setShowAIModal}
            documentContent={markdownContent}
          />
        {/* Enhance with AI (context menu) */}
        <AIAssistantModal
          open={aiOpen}
          onOpenChange={setAiOpen}
          documentContent={markdownContent}
          enhanceMode={true}
          initialDiagramCode={aiEnhanceCode || ''}
          initialTemplatePrompt={aiTemplatePrompt}
          onInsert={(code) => {
            const blockRegex = /```mermaid\n([\s\S]*?)\n```/g;
            let replaced = false;
            const newContent = markdownContent.replace(blockRegex, (match) => {
              if (!replaced && aiEnhanceCode && match.includes(aiEnhanceCode)) {
                replaced = true;
                return '```mermaid\n' + code + '\n```';
              }
              return match;
            });
            if (!replaced) {
              setMarkdownContent((prev) => prev + '\n\n```mermaid\n' + code + '\n```');
            } else {
              setMarkdownContent(newContent);
            }
            setAiTemplatePrompt(undefined);
          }}
        />
        </div>
      ) : (
          /* Desktop: Resizable Split View */
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={30}>
              <div ref={editorContainerRef} className="h-full min-h-0 p-6 relative" onClick={() => editorMenu.visible && setEditorMenu((s)=>({...s,visible:false}))}>
                <Textarea
                  ref={desktopEditorRef}
                  className="desktop-editor-textarea h-full resize-none border-0 shadow-none text-base leading-relaxed font-mono"
                  value={markdownContent}
                  onChange={handleEditorChange}
                  onScroll={handleEditorScroll}
                  onMouseUp={handleTextSelection}
                  onKeyUp={(e) => {
                    handleTextSelection();
                    setCursorPosition((e.target as HTMLTextAreaElement).selectionStart);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const textarea = e.currentTarget as HTMLTextAreaElement;
                    const { selectionStart, selectionEnd } = textarea;
                    const selection = textarea.value.substring(selectionStart, selectionEnd);
                    // Determine if caret is inside a mermaid fenced block
                    const before = textarea.value.substring(0, selectionStart);
                    const fenceStart = before.lastIndexOf('```mermaid');
                    const fenceEnd = before.lastIndexOf('```');
                    const insideMermaid = fenceStart !== -1 && fenceStart > fenceEnd;
                    const container = editorContainerRef.current;
                    const rect = container?.getBoundingClientRect();
                    const x = rect ? e.clientX - rect.left + (container?.scrollLeft || 0) : e.clientX;
                    const y = rect ? e.clientY - rect.top + (container?.scrollTop || 0) : e.clientY;
                    setEditorMenu({ visible: true, x, y, insideMermaid, selection });
                  }}
                  placeholder="Start writing your markdown here..."
                />
                {editorMenu.visible && (
                  <div
                    className="absolute z-50 bg-popover border border-border rounded-md shadow-lg text-sm"
                    style={{ left: Math.max(8, Math.min(editorMenu.x, (editorContainerRef.current?.clientWidth || 0) - 180)), top: Math.max(8, Math.min(editorMenu.y, (editorContainerRef.current?.clientHeight || 0) - 200)) }}
                    onMouseLeave={() => setEditorMenu((s) => ({ ...s, visible: false }))}
                  >
                    <button className="block w-full text-left px-3 py-2 hover:bg-accent" onClick={() => document.execCommand('copy')}>Copy</button>
                    <button className="block w-full text-left px-3 py-2 hover:bg-accent" onClick={() => document.execCommand('cut')}>Cut</button>
                    <button className="block w-full text-left px-3 py-2 hover:bg-accent" onClick={() => document.execCommand('paste')}>Paste</button>
                    <div className="h-px bg-border my-1" />
                    {editorMenu.selection && (
                      <>
                        <button className="block w-full text-left px-3 py-2 hover:bg-accent" onClick={() => insertDesktopFormat('**','**')}>Bold</button>
                        <button className="block w-full text-left px-3 py-2 hover:bg-accent" onClick={() => insertDesktopFormat('*','*')}>Italic</button>
                        <button className="block w-full text-left px-3 py-2 hover:bg-accent" onClick={() => insertDesktopFormat('`','`')}>Inline code</button>
                        <button className="block w-full text-left px-3 py-2 hover:bg-accent" onClick={() => insertDesktopFormat('[','](url)')}>Wrap in link</button>
                        <div className="h-px bg-border my-1" />
                      </>
                    )}
                    <button className="block w-full text-left px-3 py-2 hover:bg-accent" onClick={() => insertDesktopFormat('```\n','\n```')}>Insert code block</button>
                    <button className="block w-full text-left px-3 py-2 hover:bg-accent" onClick={() => insertDesktopFormat('```mermaid\n','\n```')}>Insert mermaid block</button>
                    {editorMenu.insideMermaid && (
                      <>
                        <div className="h-px bg-border my-1" />
                        <button className="block w-full text-left px-3 py-2 hover:bg-accent" onClick={() => {
                          // Grab current fenced mermaid code around caret
                          const textarea = getDesktopTextarea();
                          if (!textarea) return;
                          const pos = textarea.selectionStart;
                          const value = textarea.value;
                          const start = value.lastIndexOf('```mermaid', pos);
                          const end = value.indexOf('```', start + 3);
                          if (start !== -1 && end !== -1) {
                            const code = value.substring(start + '```mermaid'.length + 1, end); // +1 for newline
                            setAiEnhanceCode(code);
                            setAiOpen(true);
                          }
                          setEditorMenu((s) => ({ ...s, visible: false }));
                        }}>Enhance with AI</button>
                        <button className="block w-full text-left px-3 py-2 hover:bg-accent" onClick={() => {
                          const textarea = getDesktopTextarea();
                          if (!textarea) return;
                          const pos = textarea.selectionStart;
                          const value = textarea.value;
                          const start = value.lastIndexOf('```mermaid', pos);
                          const end = value.indexOf('```', start + 3);
                          if (start !== -1 && end !== -1) {
                            const code = value.substring(start + '```mermaid'.length + 1, end);
                            validateMermaid(code);
                          }
                          setEditorMenu((s) => ({ ...s, visible: false }));
                        }}>Validate diagram</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <div
                ref={previewScrollRef}
                onScroll={handlePreviewScroll}
                onClick={() => mmdMenu.visible && setMmdMenu((s) => ({ ...s, visible: false }))}
                className="h-full min-h-0 p-6 overflow-y-auto bg-card relative"
              >
                <div ref={previewRef} className="prose max-w-none" />
                {mmdMenu.visible && (
                  <div
                    className="absolute z-50 bg-popover border border-border rounded-md shadow-lg text-sm"
                    style={{ left: mmdMenu.x, top: mmdMenu.y }}
                    onMouseLeave={() => setMmdMenu((s) => ({ ...s, visible: false }))}
                  >
                    <button
                      className="block w-full text-left px-3 py-2 hover:bg-accent"
                      onClick={() => {
                        setAiEnhanceCode(mmdMenu.code);
                        setAiOpen(true);
                        setMmdMenu((s) => ({ ...s, visible: false }));
                      }}
                    >
                      🤖 Enhance with AI
                    </button>
                    <button
                      className="block w-full text-left px-3 py-2 hover:bg-accent"
                      onClick={() => {
                        validateMermaid(mmdMenu.code);
                        setMmdMenu((s) => ({ ...s, visible: false }));
                      }}
                    >
                      ✅ Validate diagram
                    </button>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* Status Bar - DESKTOP ONLY */}
      <div className="hidden md:block border-t border-border bg-muted px-6 py-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Words: {markdownContent.split(/\s+/).filter(word => word.length > 0).length}</span>
            <span>Characters: {markdownContent.length}</span>
            <span>Lines: {markdownContent.split('\n').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span>Auto-saved</span>
          </div>
        </div>
      </div>

      {/* Slash Command Menu */}
      <SlashCommandMenu
        isOpen={slashMenu.isOpen}
        position={slashMenu.position}
        searchQuery={slashMenu.searchQuery}
        onSelect={handleSlashCommandSelect}
        onClose={() => setSlashMenu(prev => ({ ...prev, isOpen: false }))}
        commands={slashCommands}
      />

      {/* Bubble Menu */}
      <BubbleMenu
        isVisible={bubbleMenu.isVisible}
        position={bubbleMenu.position}
        selectedText={bubbleMenu.selectedText}
        onAction={handleBubbleMenuAction}
        onClose={() => setBubbleMenu(prev => ({ ...prev, isVisible: false }))}
      />

      {/* AI Inline Suggestions */}
      <AIInlineSuggestions
        content={markdownContent}
        cursorPosition={cursorPosition}
        isEnabled={aiSuggestionsEnabled}
        onAccept={handleAcceptSuggestion}
        onReject={handleReject}
      />
    </div>
  );
}