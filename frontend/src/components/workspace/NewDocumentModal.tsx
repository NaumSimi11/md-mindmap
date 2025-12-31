/**
 * NewDocumentModal - Beautiful template picker for creating new documents
 * 
 * Features:
 * - Template categories (Work, Personal, Education)
 * - Template search & filtering
 * - Live preview of template content
 * - "Blank document" quick option
 * - Beautiful card-based UI
 * - Instant creation & navigation
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Brain,
  Presentation,
  Search,
  Sparkles,
  Plus,
  X,
} from 'lucide-react';
import { documentTemplates_service, type DocumentTemplate } from '@/services/workspace-legacy/DocumentTemplates';
import { syncModeService } from '@/services/sync/SyncModeService';
import { authService } from '@/services/api';
import { toast } from 'sonner';

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentCreated: (documentId: string, document?: any) => void; // 🔥 FIX: Add optional document param
  defaultType?: 'markdown' | 'mindmap' | 'presentation';
  folderId?: string | null;
  createDocument?: (type: 'markdown' | 'mindmap' | 'presentation', title: string, content: string) => Promise<any>;
}

export function NewDocumentModal({
  isOpen,
  onClose,
  onDocumentCreated,
  defaultType,
  folderId = null,
  createDocument,
}: NewDocumentModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'markdown' | 'mindmap' | 'presentation'>(
    defaultType || 'all'
  );
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);
  const [customTitle, setCustomTitle] = useState('');

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedCategory('all');
      setSelectedType(defaultType || 'all');
      setPreviewTemplate(null);
      setCustomTitle('');
    }
  }, [isOpen, defaultType]);

  // Get filtered templates
  const getFilteredTemplates = (): DocumentTemplate[] => {
    let templates = documentTemplates_service.getAll();

    // Filter by type
    if (selectedType !== 'all') {
      templates = templates.filter(t => t.type === selectedType);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      templates = templates.filter(t => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      templates = documentTemplates_service.search(searchQuery);
    }

    return templates;
  };

  const handleCreateBlank = async (type: 'markdown' | 'mindmap' | 'presentation') => {
    try {
      const title = customTitle.trim() || 'Untitled Document';
      const content = getBlankContent(type, title);
      
      const doc = createDocument 
        ? await createDocument(type, title, content)
        : { id: `doc-${Date.now()}` };
      
      // Show success message
      console.log(`✅ Created ${type}: ${title} (ID: ${doc.id})`);
      
      // 🔥 AUTO-SYNC: If user is authenticated, auto-enable cloud sync
      if (authService.isAuthenticated() && doc.id) {
        // Delay slightly to ensure document is saved locally first
        setTimeout(async () => {
          try {
            const result = await syncModeService.enableCloudSync(doc.id);
            if (result.success) {
              console.log(`☁️ Auto-synced new document to cloud: ${doc.id}`);
              toast.success('Document saved to cloud');
            }
          } catch (e) {
            console.warn('Auto-sync failed, document saved locally:', e);
          }
        }, 500);
      }
      
      // Pass full document object, not just ID
      onDocumentCreated(doc.id, doc);
      onClose();
    } catch (error: any) {
      console.error('❌ Failed to create document:', error);
      alert(error.message || 'Failed to create document. Please try again.');
    }
  };

  const handleCreateFromTemplate = async (template: DocumentTemplate) => {
    try {
      const title = customTitle.trim() || template.name;
      
      const doc = createDocument
        ? await createDocument(template.type, title, template.content)
        : { id: `doc-${Date.now()}` };
      
      // Show success message
      console.log(`✅ Created from template "${template.name}": ${title} (ID: ${doc.id})`);
      
      // 🔥 AUTO-SYNC: If user is authenticated, auto-enable cloud sync
      if (authService.isAuthenticated() && doc.id) {
        setTimeout(async () => {
          try {
            const result = await syncModeService.enableCloudSync(doc.id);
            if (result.success) {
              console.log(`☁️ Auto-synced new document to cloud: ${doc.id}`);
              toast.success('Document saved to cloud');
            }
          } catch (e) {
            console.warn('Auto-sync failed, document saved locally:', e);
          }
        }, 500);
      }
      
      // Pass full document object, not just ID
      onDocumentCreated(doc.id, doc);
      onClose();
    } catch (error: any) {
      console.error('❌ Failed to create document from template:', error);
      alert(error.message || 'Failed to create document. Please try again.');
    }
  };

  const getBlankContent = (type: 'markdown' | 'mindmap' | 'presentation', title: string): string => {
    switch (type) {
      case 'markdown':
        return `# ${title}\n\n`;
      case 'mindmap':
        return JSON.stringify({
          nodes: [
            { 
              id: '1', 
              type: 'mindNode',
              data: { label: title }, 
              position: { x: 500, y: 300 } 
            },
          ],
          edges: [],
        });
      case 'presentation':
        return JSON.stringify({
          title: title,
          slides: [
            { 
              layout: 'title', 
              content: { title: title, subtitle: '' },
              order: 0,
            },
          ],
        });
      default:
        return '';
    }
  };

  const getTypeIcon = (type: DocumentTemplate['type']) => {
    switch (type) {
      case 'markdown':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'mindmap':
        return <Brain className="h-5 w-5 text-purple-500" />;
      case 'presentation':
        return <Presentation className="h-5 w-5 text-pink-500" />;
    }
  };

  const getTypeLabel = (type: DocumentTemplate['type']) => {
    switch (type) {
      case 'markdown':
        return 'Document';
      case 'mindmap':
        return 'Mindmap';
      case 'presentation':
        return 'Presentation';
    }
  };

  const categories = [
    { value: 'all', label: 'All', icon: '📚' },
    { value: 'work', label: 'Work', icon: '💼' },
    { value: 'personal', label: 'Personal', icon: '👤' },
    { value: 'education', label: 'Education', icon: '🎓' },
    { value: 'other', label: 'Other', icon: '📁' },
  ];

  const types = [
    { value: 'all', label: 'All Types', icon: FileText },
    { value: 'markdown', label: 'Documents', icon: FileText },
    { value: 'mindmap', label: 'Mindmaps', icon: Brain },
    { value: 'presentation', label: 'Presentations', icon: Presentation },
  ];

  const filteredTemplates = getFilteredTemplates();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl h-[80vh] p-0 gap-0 overflow-hidden border border-border/60 bg-gradient-to-br from-background via-background/95 to-background/80 shadow-2xl backdrop-blur-xl"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/60 bg-gradient-to-r from-background/80 via-background/60 to-background/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-sky-500 shadow-[0_0_24px_rgba(129,140,248,0.55)]">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Create New Document
                </span>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a premium starter, customize the structure, and start writing instantly.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Document Title Input - Always Visible */}
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">
              Document Name (optional)
            </label>
            <Input
              data-testid="document-title-input"
              placeholder="Enter document name..."
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to use default or template name
            </p>
          </div>

          {/* Primary Type Selector - High level choice */}
          <div className="mt-4 flex flex-wrap gap-2">
            {types.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value as any)}
                  className={`
                    inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-all border
                    ${
                      selectedType === type.value
                        ? 'border-primary/80 bg-gradient-to-r from-primary/90 via-primary to-sky-500 text-primary-foreground shadow-md shadow-primary/40'
                        : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Template Selection */}
          <div className="flex-1 flex flex-col border-r border-border/60 bg-gradient-to-b from-background/80 via-background/60 to-background/40">
            {/* Filters */}
            <div className="p-4 border-b border-border/60 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/60 border-border/60"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs transition-all border
                      ${
                        selectedCategory === cat.value
                          ? 'border-primary/70 bg-white/5 text-foreground shadow-sm shadow-black/30'
                          : 'border-border/40 bg-muted/20 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      }
                    `}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Grid */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                {/* Blank Document Options */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold mb-3 tracking-wide text-muted-foreground/90 uppercase">
                    Start from blank
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      data-testid="create-blank-markdown"
                      onClick={() => handleCreateBlank('markdown')}
                      className="relative overflow-hidden p-4 rounded-2xl border border-border/60 bg-gradient-to-br from-background/80 via-background/70 to-background/60 hover:border-blue-400/70 hover:shadow-[0_0_32px_rgba(59,130,246,0.45)] transition-all group"
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.6),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(109,40,217,0.6),transparent_60%)]" />
                      <div className="relative flex flex-col items-center text-center">
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 backdrop-blur">
                          <FileText className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Blank Document</p>
                        <p className="text-xs text-muted-foreground mt-1">Clean markdown canvas</p>
                      </div>
                    </button>
                    <button
                      data-testid="create-blank-mindmap"
                      onClick={() => handleCreateBlank('mindmap')}
                      className="relative overflow-hidden p-4 rounded-2xl border border-border/60 bg-gradient-to-br from-background/80 via-background/70 to-background/60 hover:border-purple-400/70 hover:shadow-[0_0_32px_rgba(168,85,247,0.45)] transition-all group"
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.6),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.6),transparent_60%)]" />
                      <div className="relative flex flex-col items-center text-center">
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 backdrop-blur">
                          <Brain className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Blank Mindmap</p>
                        <p className="text-xs text-muted-foreground mt-1">Visual brainstorming</p>
                      </div>
                    </button>
                    <button
                      data-testid="create-blank-presentation"
                      onClick={() => handleCreateBlank('presentation')}
                      className="relative overflow-hidden p-4 rounded-2xl border border-border/60 bg-gradient-to-br from-background/80 via-background/70 to-background/60 hover:border-pink-400/70 hover:shadow-[0_0_32px_rgba(236,72,153,0.45)] transition-all group"
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.6),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.6),transparent_60%)]" />
                      <div className="relative flex flex-col items-center text-center">
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-500/20 text-pink-400 backdrop-blur">
                          <Presentation className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Blank Presentation</p>
                        <p className="text-xs text-muted-foreground mt-1">Cinematic slide deck</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Templates */}
                <div>
                  <h3 className="text-xs font-semibold mb-3 text-muted-foreground flex items-center gap-2 tracking-wide uppercase">
                    <Sparkles className="h-4 w-4" />
                    Templates ({filteredTemplates.length})
                  </h3>
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No templates found</p>
                      <p className="text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {filteredTemplates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => setPreviewTemplate(template)}
                          className={`
                            relative overflow-hidden p-4 rounded-2xl text-left transition-all border backdrop-blur-md
                            ${
                              previewTemplate?.id === template.id
                                ? 'border-primary/70 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 shadow-[0_0_30px_rgba(129,140,248,0.55)]'
                                : 'border-border/60 bg-background/40 hover:border-primary/50 hover:bg-background/70 hover:shadow-lg'
                            }
                          `}
                        >
                          <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.4),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.4),transparent_60%)]" />
                          <div className="relative flex items-start gap-3 mb-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black/30 text-lg">
                              <span>{template.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate text-foreground">
                                {template.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {getTypeLabel(template.type)} • {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                              </p>
                            </div>
                          </div>
                          <p className="relative text-xs text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                          {template.tags?.length > 0 && (
                            <div className="relative mt-2 flex flex-wrap gap-1">
                              {template.tags.slice(0, 3).map(tag => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel: Preview */}
          <div className="w-96 flex flex-col bg-gradient-to-b from-background/90 via-background/80 to-background/70">
            {previewTemplate ? (
              <>
                {/* Preview Header */}
                <div className="p-4 border-b border-border/60">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-primary/50 via-sky-400/40 to-fuchsia-500/40 blur-xl opacity-60" />
                      <div className="relative flex h-11 w-11 items-center justify-center rounded-3xl bg-black/60 text-2xl">
                        {previewTemplate.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-foreground">
                        {previewTemplate.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {previewTemplate.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {getTypeIcon(previewTemplate.type)}
                        <span className="text-xs text-muted-foreground">
                          {getTypeLabel(previewTemplate.type)}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 text-muted-foreground">
                          {previewTemplate.category.charAt(0).toUpperCase() + previewTemplate.category.slice(1)}
                        </span>
                      </div>
                      {previewTemplate.tags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {previewTemplate.tags.slice(0, 4).map(tag => (
                            <span
                              key={tag}
                              className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-sky-500 text-primary-foreground shadow-[0_10px_30px_rgba(59,130,246,0.55)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.7)] transition-all"
                    onClick={() => handleCreateFromTemplate(previewTemplate)}
                  >
                    <span className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_10%_0,rgba(255,255,255,0.4),transparent_55%),radial-gradient(circle_at_90%_100%,rgba(59,130,246,0.5),transparent_55%)]" />
                    <span className="relative flex items-center justify-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Create from Template
                    </span>
                  </Button>
                </div>

                {/* Preview Content */}
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <h4 className="text-[10px] font-semibold text-muted-foreground mb-2 tracking-[0.18em] uppercase">
                      Live structure preview
                    </h4>
                    <div className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-inner">
                      {previewTemplate.type === 'markdown' ? (
                        <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                          {previewTemplate.content.substring(0, 500)}
                          {previewTemplate.content.length > 500 && '...'}
                        </pre>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          <p className="mb-2">
                            <strong>Type:</strong> {getTypeLabel(previewTemplate.type)}
                          </p>
                          <p className="mb-2">
                            <strong>Category:</strong> {previewTemplate.category}
                          </p>
                          <p>
                            <strong>Tags:</strong> {previewTemplate.tags.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-6">
                <div>
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">Select a Template</p>
                  <p className="text-xs text-muted-foreground">
                    Choose a template from the left to see a preview
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <DialogFooter className="px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-muted-foreground">
              {previewTemplate 
                ? `Click "Create from Template" or choose a blank option` 
                : 'Select a template or click a blank document option'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {!previewTemplate && (
                <Button onClick={() => handleCreateBlank('markdown')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Blank Document
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

