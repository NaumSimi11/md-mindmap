/**
 * NewDocumentModal - Pro Template Picker
 * 
 * Clean, focused design with:
 * - Minimal header with inline filters
 * - Single scrollable template grid
 * - Full-height preview panel
 * - Quick blank document options
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Brain,
  Presentation,
  Search,
  Sparkles,
  Plus,
  X,
  Folder,
  ChevronDown,
  ArrowRight,
  Check,
  Clock,
  Zap,
} from 'lucide-react';
import { documentTemplates_service, type DocumentTemplate } from '@/services/workspace-legacy/DocumentTemplates';
import { syncModeService } from '@/services/sync/SyncModeService';
import { authService } from '@/services/api';
import { toast } from 'sonner';
import MarkdownIt from 'markdown-it';

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentCreated: (documentId: string, document?: any) => void;
  defaultType?: 'markdown' | 'mindmap' | 'presentation';
  folderId?: string | null;
  folderName?: string | null;
  createDocument?: (type: 'markdown' | 'mindmap' | 'presentation', title: string, content: string, folderId?: string | null) => Promise<any>;
}

export function NewDocumentModal({
  isOpen,
  onClose,
  onDocumentCreated,
  defaultType,
  folderId = null,
  folderName = null,
  createDocument,
}: NewDocumentModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'markdown' | 'mindmap' | 'presentation'>(defaultType || 'all');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const collectionDropdownRef = useRef<HTMLDivElement>(null);
  
  // Markdown renderer
  const md = useMemo(() => new MarkdownIt({ html: false, breaks: true, linkify: true }), []);

  // Data
  const collections = useMemo(() => documentTemplates_service.getCollections(), []);
  const recentlyUsed = useMemo(() => documentTemplates_service.getRecentlyUsed(3), []);
  const templateCount = useMemo(() => documentTemplates_service.getCount(), []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false);
      }
      if (collectionDropdownRef.current && !collectionDropdownRef.current.contains(e.target as Node)) {
        setShowCollectionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedType(defaultType || 'all');
      setSelectedCollection('all');
      setPreviewTemplate(null);
      setCustomTitle('');
    }
  }, [isOpen, defaultType]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let templates = documentTemplates_service.getAll();
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }
    
    if (selectedType !== 'all') {
      templates = templates.filter(t => t.type === selectedType);
    }
    
    if (selectedCollection !== 'all') {
      templates = templates.filter(t => t.collection === selectedCollection);
    }
    
    return templates;
  }, [searchQuery, selectedType, selectedCollection]);

  const handleCreateBlank = async (type: 'markdown' | 'mindmap' | 'presentation') => {
    try {
      const title = customTitle.trim() || 'Untitled Document';
      const content = getBlankContent(type, title);
      
      const doc = createDocument 
        ? await createDocument(type, title, content, folderId)
        : { id: `doc-${Date.now()}` };
      
      if (authService.isAuthenticated() && doc.id) {
        setTimeout(async () => {
          try {
            const result = await syncModeService.enableCloudSync(doc.id);
            if (result.success) toast.success('Document saved to cloud');
          } catch (e) {
            console.warn('Auto-sync failed:', e);
          }
        }, 500);
      }
      
      onDocumentCreated(doc.id, doc);
      onClose();
    } catch (error: any) {
      console.error('Failed to create document:', error);
      toast.error(error.message || 'Failed to create document');
    }
  };

  const handleCreateFromTemplate = async (template: DocumentTemplate) => {
    try {
      const title = customTitle.trim() || template.name;
      documentTemplates_service.trackUsage(template.id);
      
      const doc = createDocument
        ? await createDocument(template.type, title, template.content, folderId)
        : { id: `doc-${Date.now()}` };
      
      if (authService.isAuthenticated() && doc.id) {
        setTimeout(async () => {
          try {
            const result = await syncModeService.enableCloudSync(doc.id);
            if (result.success) toast.success('Document saved to cloud');
          } catch (e) {
            console.warn('Auto-sync failed:', e);
          }
        }, 500);
      }
      
      onDocumentCreated(doc.id, doc);
      onClose();
    } catch (error: any) {
      console.error('Failed to create from template:', error);
      toast.error(error.message || 'Failed to create document');
    }
  };

  const getBlankContent = (type: 'markdown' | 'mindmap' | 'presentation', title: string): string => {
    switch (type) {
      case 'markdown':
        return `# ${title}\n\n`;
      case 'mindmap':
        return JSON.stringify({ nodes: [{ id: '1', type: 'mindNode', data: { label: title }, position: { x: 500, y: 300 } }], edges: [] });
      case 'presentation':
        return JSON.stringify({ title, slides: [{ layout: 'title', content: { title, subtitle: '' }, order: 0 }] });
      default:
        return '';
    }
  };

  const typeOptions = [
    { value: 'all', label: 'All Types', icon: Sparkles, color: 'text-violet-400' },
    { value: 'markdown', label: 'Documents', icon: FileText, color: 'text-blue-400' },
    { value: 'mindmap', label: 'Mindmaps', icon: Brain, color: 'text-purple-400' },
    { value: 'presentation', label: 'Slides', icon: Presentation, color: 'text-pink-400' },
  ];

  const selectedTypeOption = typeOptions.find(t => t.value === selectedType) || typeOptions[0];
  const selectedCollectionData = selectedCollection === 'all' 
    ? { name: 'All Collections', icon: '📚' }
    : collections.find(c => c.id === selectedCollection) || { name: 'All', icon: '📚' };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 overflow-hidden border border-border bg-background shadow-2xl">
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* HEADER - Compact & Clean */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-border bg-gradient-to-r from-primary/[0.03] via-transparent to-primary/[0.03]">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30">
              <Plus className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">New Document</h2>
              <p className="text-xs text-muted-foreground">{templateCount} templates available</p>
            </div>
          </div>

          {/* Folder Indicator */}
          {folderId && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Folder className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-amber-600 dark:text-amber-300">{folderName || 'folder'}</span>
            </div>
          )}

          {/* Document Name Input - Always visible for E2E tests */}
          <div className="flex-1 max-w-xs">
            <Input
              data-testid="document-title-input"
              placeholder="Document name..."
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="h-9 bg-muted/50 border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary/50"
            />
          </div>

          {/* Quick Create Buttons */}
          <div className="flex items-center gap-2">
            <button
              data-testid="create-blank-markdown"
              onClick={() => handleCreateBlank('markdown')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-blue-500/10 border border-border hover:border-blue-500/30 transition-all group"
            >
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="hidden sm:inline text-xs text-muted-foreground group-hover:text-foreground">Blank Doc</span>
            </button>
            <button
              data-testid="create-blank-mindmap"
              onClick={() => handleCreateBlank('mindmap')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-purple-500/10 border border-border hover:border-purple-500/30 transition-all group"
            >
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="hidden sm:inline text-xs text-muted-foreground group-hover:text-foreground">Mindmap</span>
            </button>
            <button
              data-testid="create-blank-presentation"
              onClick={() => handleCreateBlank('presentation')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-pink-500/10 border border-border hover:border-pink-500/30 transition-all group"
            >
              <Presentation className="h-4 w-4 text-pink-500" />
              <span className="hidden sm:inline text-xs text-muted-foreground group-hover:text-foreground">Slides</span>
            </button>
          </div>

          {/* Close */}
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MAIN CONTENT - Two Panel Layout */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* ─────────────────────────────────────────────────────────────── */}
          {/* LEFT PANEL - Template Browser */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className="w-[420px] flex flex-col border-r border-border">
            
            {/* Filter Bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50"
                />
              </div>

              {/* Type Dropdown */}
              <div className="relative" ref={typeDropdownRef}>
                <button
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="flex items-center gap-2 px-3 py-2 h-9 rounded-lg bg-muted/50 border border-border hover:border-border/80 transition-colors"
                >
                  <selectedTypeOption.icon className={`h-4 w-4 ${selectedTypeOption.color}`} />
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {showTypeDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-40 py-1 rounded-lg bg-popover border border-border shadow-xl z-50">
                    {typeOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSelectedType(opt.value as any); setShowTypeDropdown(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted transition-colors ${selectedType === opt.value ? 'bg-muted/50' : ''}`}
                      >
                        <opt.icon className={`h-4 w-4 ${opt.color}`} />
                        <span className="text-sm text-foreground/80">{opt.label}</span>
                        {selectedType === opt.value && <Check className="h-3 w-3 text-primary ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Collection Dropdown */}
              <div className="relative" ref={collectionDropdownRef}>
                <button
                  onClick={() => setShowCollectionDropdown(!showCollectionDropdown)}
                  className="flex items-center gap-2 px-3 py-2 h-9 rounded-lg bg-muted/50 border border-border hover:border-border/80 transition-colors"
                >
                  <span className="text-sm">{selectedCollectionData.icon}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {showCollectionDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-48 py-1 rounded-lg bg-popover border border-border shadow-xl z-50 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedCollection('all'); setShowCollectionDropdown(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted transition-colors ${selectedCollection === 'all' ? 'bg-muted/50' : ''}`}
                    >
                      <span>📚</span>
                      <span className="text-sm text-foreground/80">All Collections</span>
                      {selectedCollection === 'all' && <Check className="h-3 w-3 text-primary ml-auto" />}
                    </button>
                    {collections.map(col => (
                      <button
                        key={col.id}
                        onClick={() => { setSelectedCollection(col.id); setShowCollectionDropdown(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted transition-colors ${selectedCollection === col.id ? 'bg-muted/50' : ''}`}
                      >
                        <span>{col.icon}</span>
                        <span className="text-sm text-foreground/80">{col.name}</span>
                        {selectedCollection === col.id && <Check className="h-3 w-3 text-primary ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Template List */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                
                {/* Recently Used */}
                {recentlyUsed.length > 0 && !searchQuery && selectedCollection === 'all' && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 px-2 mb-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Recent</span>
                    </div>
                    <div className="space-y-1">
                      {recentlyUsed.map(template => (
                        <button
                          key={template.id}
                          onClick={() => setPreviewTemplate(template)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                            previewTemplate?.id === template.id
                              ? 'bg-primary/10 border border-primary/30'
                              : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
                          }`}
                        >
                          <span className="text-lg">{template.icon}</span>
                          <span className="text-sm text-foreground/80 truncate">{template.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Templates */}
                <div>
                  <div className="flex items-center justify-between px-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Templates</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground/60">{filteredTemplates.length}</span>
                  </div>
                  
                  {filteredTemplates.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-sm text-muted-foreground">No templates found</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Try a different search or filter</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredTemplates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => setPreviewTemplate(template)}
                          className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-all ${
                            previewTemplate?.id === template.id
                              ? 'bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 shadow-lg shadow-primary/10'
                              : 'bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border'
                          }`}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-xl shrink-0">
                            {template.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground truncate">{template.name}</span>
                              {template.featured && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/20 text-amber-600 dark:text-amber-300">★</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{template.description}</p>
                          </div>
                          <ArrowRight className={`h-4 w-4 shrink-0 mt-1 transition-opacity ${previewTemplate?.id === template.id ? 'text-primary opacity-100' : 'text-muted-foreground/40 opacity-0 group-hover:opacity-100'}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* RIGHT PANEL - Preview & Create */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-h-0 bg-muted/30">
            {previewTemplate ? (
              <>
                {/* Preview Header - Compact */}
                <div className="shrink-0 px-5 py-3 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-xl border border-primary/20">
                      {previewTemplate.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-foreground truncate">{previewTemplate.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                          previewTemplate.type === 'markdown' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300' :
                          previewTemplate.type === 'mindmap' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300' :
                          'bg-pink-500/20 text-pink-600 dark:text-pink-300'
                        }`}>
                          {previewTemplate.type === 'markdown' ? 'Doc' : previewTemplate.type === 'mindmap' ? 'Map' : 'Slides'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-muted text-muted-foreground">
                          {previewTemplate.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Name Input - Compact */}
                <div className="shrink-0 px-5 py-2.5 border-b border-border/50">
                  <Input
                    data-testid="template-document-title"
                    placeholder={`Name: ${previewTemplate.name}`}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateFromTemplate(previewTemplate);
                      }
                    }}
                    className="h-9 bg-background border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary/50"
                  />
                </div>

                {/* Preview Content - Scrollable */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <div className="p-5">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Preview</div>
                    <div className="rounded-lg bg-background border border-border p-4">
                      {previewTemplate.type === 'markdown' ? (
                        <div 
                          className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-headings:text-sm prose-p:text-foreground/70 prose-p:text-xs prose-li:text-foreground/70 prose-li:text-xs prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:text-[10px] prose-pre:bg-muted"
                          dangerouslySetInnerHTML={{ 
                            __html: md.render(previewTemplate.content.slice(0, 1200) + (previewTemplate.content.length > 1200 ? '\n\n...' : ''))
                          }}
                        />
                      ) : (
                        <div className="text-center py-6">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl mb-2">
                            {previewTemplate.icon}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {previewTemplate.type === 'mindmap' ? 'Mindmap ready' : 'Presentation ready'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Create Button - Fixed at bottom */}
                <div className="shrink-0 px-5 py-3 border-t border-border bg-background">
                  <Button
                    onClick={() => handleCreateFromTemplate(previewTemplate)}
                    className="w-full h-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground text-sm font-medium shadow-lg shadow-primary/25"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Create from Template
                  </Button>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-xs">
                  <div className="relative mx-auto mb-4">
                    <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 blur-2xl mx-auto" />
                    <div className="relative w-16 h-16 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-primary/50" />
                    </div>
                  </div>
                  <h3 className="text-base font-medium text-foreground/80 mb-1">Select a Template</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {templateCount}+ premium templates available
                  </p>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { count: documentTemplates_service.getCountByType().markdown, label: 'Docs', color: 'text-blue-500' },
                      { count: documentTemplates_service.getCountByType().mindmap, label: 'Maps', color: 'text-purple-500' },
                      { count: documentTemplates_service.getCountByType().presentation, label: 'Slides', color: 'text-pink-500' },
                    ].map((stat, i) => (
                      <div key={i} className="p-2 rounded-lg bg-muted/50 border border-border">
                        <div className={`text-xl font-bold ${stat.color}`}>{stat.count}</div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

