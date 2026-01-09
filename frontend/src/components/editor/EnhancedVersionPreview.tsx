/**
 * EnhancedVersionPreview - Premium 2025 Version Preview Modal
 * 
 * Features:
 * - Rendered markdown preview (not raw text)
 * - Side-by-side comparison with current version
 * - Diff highlighting (additions/deletions)
 * - Two restore options: Create New | Replace Current
 * - Beautiful glassmorphism design
 * - Smooth animations
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  RotateCcw, 
  FileText, 
  GitCompare, 
  Plus, 
  Minus, 
  AlertTriangle,
  Sparkles,
  Copy,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import MarkdownIt from 'markdown-it';
import { diffLines, Change } from 'diff';

// Initialize markdown-it with safe defaults
const md = new MarkdownIt({
  html: false, // Disable HTML for security
  linkify: true,
  typographer: true,
  breaks: true,
});

/**
 * Helper function to strip HTML tags and get plain text
 * Handles TipTap/ProseMirror internal tags like <paragraph>, <hardBreak>, etc.
 * 
 * CRITICAL: Must match the output format of TipTap's editor.getText()
 * which uses double newlines (\n\n) between block elements
 */
function htmlToPlainText(html: string): string {
  if (!html) return '';
  
  // Create a temporary DOM element
  const div = document.createElement('div');
  
  // Convert TipTap/ProseMirror internal tags to standard HTML
  // Also handles cases where standard HTML is already used
  let normalizedHtml = html
    // Convert TipTap paragraph tags (keep standard <p> tags as is)
    .replace(/<paragraph>/gi, '<p>')
    .replace(/<\/paragraph>/gi, '</p>')
    // Convert hardBreak to single newline
    .replace(/<hardBreak\s*\/?>/gi, '\n')
    // Handle <br> tags
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert taskList, taskItem, etc.
    .replace(/<taskList>/gi, '<ul>')
    .replace(/<\/taskList>/gi, '</ul>')
    .replace(/<taskItem[^>]*>/gi, '<li>')
    .replace(/<\/taskItem>/gi, '</li>')
    // Convert codeBlock
    .replace(/<codeBlock[^>]*>/gi, '<pre>')
    .replace(/<\/codeBlock>/gi, '</pre>')
    // Convert bulletList, orderedList
    .replace(/<bulletList>/gi, '<ul>')
    .replace(/<\/bulletList>/gi, '</ul>')
    .replace(/<orderedList>/gi, '<ol>')
    .replace(/<\/orderedList>/gi, '</ol>')
    .replace(/<listItem>/gi, '<li>')
    .replace(/<\/listItem>/gi, '</li>')
    // Convert heading
    .replace(/<heading\s+level="(\d)">/gi, '<h$1>')
    .replace(/<\/heading>/gi, '</h1>'); // Will be replaced anyway
  
  div.innerHTML = normalizedHtml;
  
  // Collect text from each block element
  const blocks: string[] = [];
  
  const processNode = (node: Node, isTopLevel: boolean = false): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      
      // Handle <br> tags as single newline
      if (tagName === 'br') {
        return '\n';
      }
      
      // For block elements, collect their text content as a separate block
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'pre', 'blockquote'].includes(tagName)) {
        let blockText = '';
        for (const child of Array.from(node.childNodes)) {
          blockText += processNode(child, false);
        }
        // Trim leading/trailing whitespace but preserve internal structure
        blockText = blockText.replace(/^\s+|\s+$/g, '');
        if (blockText) {
          blocks.push(blockText);
        }
        return ''; // Block content is collected separately
      }
      
      // For inline elements and containers, just concatenate children
      let result = '';
      for (const child of Array.from(node.childNodes)) {
        result += processNode(child, false);
      }
      return result;
    }
    return '';
  };
  
  // Process all top-level children
  for (const child of Array.from(div.childNodes)) {
    processNode(child, true);
  }
  
  // Join blocks with double newline to match TipTap's editor.getText() output
  // This is critical for diff comparison to work correctly
  return blocks.join('\n\n');
}

/**
 * Helper function to convert TipTap/ProseMirror HTML to standard HTML for rendering
 */
function normalizeHtmlForRendering(html: string): string {
  if (!html) return '<p>No content available</p>';
  
  return html
    // Convert paragraph tags
    .replace(/<paragraph>/gi, '<p>')
    .replace(/<\/paragraph>/gi, '</p>')
    // Convert hardBreak to <br>
    .replace(/<hardBreak\s*\/?>/gi, '<br>')
    // Convert taskList, taskItem
    .replace(/<taskList>/gi, '<ul class="task-list">')
    .replace(/<\/taskList>/gi, '</ul>')
    .replace(/<taskItem[^>]*checked="true"[^>]*>/gi, '<li>✅ ')
    .replace(/<taskItem[^>]*>/gi, '<li>☐ ')
    .replace(/<\/taskItem>/gi, '</li>')
    // Convert codeBlock
    .replace(/<codeBlock[^>]*>/gi, '<pre><code>')
    .replace(/<\/codeBlock>/gi, '</code></pre>')
    // Convert bulletList, orderedList
    .replace(/<bulletList>/gi, '<ul>')
    .replace(/<\/bulletList>/gi, '</ul>')
    .replace(/<orderedList>/gi, '<ol>')
    .replace(/<\/orderedList>/gi, '</ol>')
    .replace(/<listItem>/gi, '<li>')
    .replace(/<\/listItem>/gi, '</li>')
    // Convert heading
    .replace(/<heading\s+level="1">/gi, '<h1>')
    .replace(/<heading\s+level="2">/gi, '<h2>')
    .replace(/<heading\s+level="3">/gi, '<h3>')
    .replace(/<heading\s+level="4">/gi, '<h4>')
    .replace(/<heading\s+level="5">/gi, '<h5>')
    .replace(/<heading\s+level="6">/gi, '<h6>')
    .replace(/<\/heading>/gi, '</h1>'); // Generic close - will work for all headings
}

interface EnhancedVersionPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  version: {
    version_number: number;
    title: string;
    content: string;
    created_at: string;
    change_summary: string | null;
    word_count: number;
    created_by_id: string | null;
  };
  currentContent: string;
  currentVersion: number;
  onRestoreAsNew: () => void;
  onReplaceCurrentVersion: () => void;
  isAuthenticated: boolean;
}

export function EnhancedVersionPreview({
  isOpen,
  onClose,
  version,
  currentContent,
  currentVersion,
  onRestoreAsNew,
  onReplaceCurrentVersion,
  isAuthenticated,
}: EnhancedVersionPreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'comparison' | 'diff'>('preview');
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extract plain text from version content (which is HTML from snapshot)
  const versionPlainText = useMemo(() => {
    return htmlToPlainText(version.content || '');
  }, [version.content]);

  // Render version HTML (convert TipTap format to standard HTML)
  const renderedVersion = useMemo(() => {
    try {
      // Check if content looks like HTML (has tags)
      if (version.content && version.content.includes('<')) {
        return normalizeHtmlForRendering(version.content);
      }
      // Otherwise treat as markdown
      return md.render(version.content || '');
    } catch (error) {
      console.error('Failed to render version content:', error);
      return '<p class="text-red-500">Failed to render content</p>';
    }
  }, [version.content]);

  // Render current content (it's already plain text from editor.getText())
  const renderedCurrent = useMemo(() => {
    try {
      // Convert plain text to simple HTML paragraphs for display
      if (currentContent) {
        const paragraphs = currentContent.split('\n\n').filter(p => p.trim());
        if (paragraphs.length > 0) {
          return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
        }
      }
      return '<p class="text-muted-foreground italic">No current content</p>';
    } catch (error) {
      console.error('Failed to render current content:', error);
      return '<p class="text-red-500">Failed to render content</p>';
    }
  }, [currentContent]);

  // Calculate diff using PLAIN TEXT for both sides (apples to apples comparison)
  // IMPORTANT: Order matters! diffLines(old, new) shows changes from old → new
  // - versionPlainText = old snapshot (what it WAS)
  // - currentContent = current document (what it IS NOW)
  // This way:
  // - "removed" (red) = content in snapshot that was DELETED since then
  // - "added" (green) = content that was ADDED since the snapshot
  const diff = useMemo(() => {
    // currentContent is already plain text from editor.getText()
    // versionPlainText is extracted from the HTML preview
    return diffLines(versionPlainText || '', currentContent || '');
  }, [currentContent, versionPlainText]);

  // Stats comparison - using plain text for accurate counting
  const stats = useMemo(() => {
    const currentWords = currentContent?.split(/\s+/).filter(w => w.length > 0).length || 0;
    const currentChars = currentContent?.length || 0;
    // Use extracted plain text for accurate word/char count
    const versionWords = versionPlainText?.split(/\s+/).filter(w => w.length > 0).length || 0;
    const versionChars = versionPlainText?.length || 0;

    return {
      current: { words: currentWords, chars: currentChars },
      version: { words: versionWords, chars: versionChars },
      diff: {
        words: versionWords - currentWords,
        chars: versionChars - currentChars,
      },
    };
  }, [currentContent, versionPlainText]);

  // Format time
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  // Copy to clipboard - copy plain text, not HTML
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(versionPlainText);
      setCopied(true);
      toast.success('Content copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy content');
    }
  };

  // Handle replace with confirmation
  const handleReplace = () => {
    if (!showReplaceWarning) {
      setShowReplaceWarning(true);
      return;
    }
    onReplaceCurrentVersion();
    setShowReplaceWarning(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 gap-0 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20 border-2 border-slate-200/50 dark:border-slate-800/50 shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                Version {version.version_number}
                {version.version_number === currentVersion && (
                  <span className="ml-3 text-sm font-medium px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-lg">
                    Current
                  </span>
                )}
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {formatTimeAgo(new Date(version.created_at))}
                </span>
                {version.created_by_id && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    User {version.created_by_id.substring(0, 8)}
                  </span>
                )}
              </div>
              {version.change_summary && (
                <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-lg">
                  <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                    "{version.change_summary}"
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-4 p-4 bg-gradient-to-r from-slate-100/50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Words</p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {stats.version.words.toLocaleString()}
                  {stats.diff.words !== 0 && (
                    <span className={`ml-2 text-sm font-medium ${stats.diff.words > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {stats.diff.words > 0 ? '+' : ''}{stats.diff.words}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Characters</p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {stats.version.chars.toLocaleString()}
                  {stats.diff.chars !== 0 && (
                    <span className={`ml-2 text-sm font-medium ${stats.diff.chars > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {stats.diff.chars > 0 ? '+' : ''}{stats.diff.chars}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <div className="px-6 pt-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <TabsTrigger 
                value="preview" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger 
                value="comparison"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Compare
              </TabsTrigger>
              <TabsTrigger 
                value="diff"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md rounded-lg transition-all"
              >
                <FileText className="h-4 w-4 mr-2" />
                Diff
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Preview Tab */}
          <TabsContent value="preview" className="flex-1 m-0 p-6">
            <ScrollArea className="h-[50vh] rounded-xl border-2 border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-inner">
              <div 
                className="prose prose-slate dark:prose-invert max-w-none p-6"
                dangerouslySetInnerHTML={{ __html: renderedVersion }}
              />
            </ScrollArea>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="flex-1 m-0 p-6">
            <div className="grid grid-cols-2 gap-4 h-[50vh]">
              {/* Current Version */}
              <div className="flex flex-col rounded-xl border-2 border-slate-200/50 dark:border-slate-800/50 overflow-hidden bg-white dark:bg-slate-900 shadow-lg">
                <div className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Current Version ({currentVersion})
                </div>
                <ScrollArea className="flex-1">
                  <div 
                    className="prose prose-slate dark:prose-invert max-w-none p-6"
                    dangerouslySetInnerHTML={{ __html: renderedCurrent }}
                  />
                </ScrollArea>
              </div>

              {/* Selected Version */}
              <div className="flex flex-col rounded-xl border-2 border-slate-200/50 dark:border-slate-800/50 overflow-hidden bg-white dark:bg-slate-900 shadow-lg">
                <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Version {version.version_number}
                </div>
                <ScrollArea className="flex-1">
                  <div 
                    className="prose prose-slate dark:prose-invert max-w-none p-6"
                    dangerouslySetInnerHTML={{ __html: renderedVersion }}
                  />
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* Diff Tab */}
          <TabsContent value="diff" className="flex-1 m-0 p-6">
            <ScrollArea className="h-[50vh] rounded-xl border-2 border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-inner">
              <div className="p-6 font-mono text-sm">
                {/* Legend */}
                <div className="flex gap-4 mb-4 text-xs border-b border-slate-200 dark:border-slate-700 pb-3">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
                    <span className="text-slate-600 dark:text-slate-400">Added since snapshot</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-500 rounded-sm"></span>
                    <span className="text-slate-600 dark:text-slate-400">Removed since snapshot</span>
                  </span>
                </div>
                
                {diff.map((part: Change, index: number) => {
                  // Skip empty parts
                  if (!part.value.trim()) {
                    return null;
                  }
                  
                  if (part.added) {
                    // Content in CURRENT but not in SNAPSHOT = was ADDED since snapshot
                    return (
                      <div key={index} className="bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 px-4 py-2 my-1">
                        <div className="flex items-start gap-2">
                          <Plus className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <pre className="whitespace-pre-wrap text-emerald-900 dark:text-emerald-100 flex-1">
                            {part.value}
                          </pre>
                        </div>
                      </div>
                    );
                  }
                  if (part.removed) {
                    // Content in SNAPSHOT but not in CURRENT = was DELETED since snapshot
                    return (
                      <div key={index} className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 px-4 py-2 my-1">
                        <div className="flex items-start gap-2">
                          <Minus className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <pre className="whitespace-pre-wrap text-red-900 dark:text-red-100 flex-1 line-through opacity-75">
                            {part.value}
                          </pre>
                        </div>
                      </div>
                    );
                  }
                  // Unchanged content
                  return (
                    <div key={index} className="px-4 py-2 text-slate-600 dark:text-slate-400">
                      <pre className="whitespace-pre-wrap">{part.value}</pre>
                    </div>
                  );
                })}
                
                {/* Empty state */}
                {diff.length === 1 && !diff[0].added && !diff[0].removed && (
                  <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                    No differences found. The snapshot matches the current document.
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <DialogFooter className="px-6 py-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          {showReplaceWarning ? (
            <div className="flex items-center gap-4 w-full">
              <div className="flex items-start gap-3 flex-1 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-500/50 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Are you absolutely sure?
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                    This will permanently replace your current version. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReplaceWarning(false)}
                  className="hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReplace}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Yes, Replace Current
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <Button
                variant="outline"
                onClick={onClose}
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </Button>
              <div className="flex-1" />
              {version.version_number !== currentVersion && (
                <>
                  <Button
                    onClick={onRestoreAsNew}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Document
                  </Button>
                  <Button
                    onClick={handleReplace}
                    variant="outline"
                    className="border-2 border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Replace Current Version
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


