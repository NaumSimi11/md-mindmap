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
      <DialogContent className="max-w-6xl h-[80vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-500" />
                Create New Document
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a template or start from scratch
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
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Template Selection */}
          <div className="flex-1 flex flex-col border-r border-border">
            {/* Filters */}
            <div className="p-4 border-b border-border space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Type Filter */}
              <div className="flex gap-2">
                {types.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value as any)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all
                        ${
                          selectedType === type.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Category Filter */}
              <div className="flex gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm transition-all
                      ${
                        selectedCategory === cat.value
                          ? 'bg-secondary text-secondary-foreground'
                          : 'hover:bg-muted'
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
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Start from Blank</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      data-testid="create-blank-markdown"
                      onClick={() => handleCreateBlank('markdown')}
                      className="p-4 border-2 border-dashed border-border rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                    >
                      <FileText className="h-8 w-8 text-blue-500 mb-2 mx-auto" />
                      <p className="text-sm font-medium">Blank Document</p>
                      <p className="text-xs text-muted-foreground mt-1">Markdown editor</p>
                    </button>
                    <button
                      data-testid="create-blank-mindmap"
                      onClick={() => handleCreateBlank('mindmap')}
                      className="p-4 border-2 border-dashed border-border rounded-lg hover:border-purple-500 hover:bg-purple-50/50 transition-all group"
                    >
                      <Brain className="h-8 w-8 text-purple-500 mb-2 mx-auto" />
                      <p className="text-sm font-medium">Blank Mindmap</p>
                      <p className="text-xs text-muted-foreground mt-1">Visual brainstorming</p>
                    </button>
                    <button
                      data-testid="create-blank-presentation"
                      onClick={() => handleCreateBlank('presentation')}
                      className="p-4 border-2 border-dashed border-border rounded-lg hover:border-pink-500 hover:bg-pink-50/50 transition-all group"
                    >
                      <Presentation className="h-8 w-8 text-pink-500 mb-2 mx-auto" />
                      <p className="text-sm font-medium">Blank Presentation</p>
                      <p className="text-xs text-muted-foreground mt-1">Slide deck</p>
                    </button>
                  </div>
                </div>

                {/* Templates */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
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
                            p-4 border rounded-lg text-left transition-all hover:shadow-md
                            ${
                              previewTemplate?.id === template.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <div className="text-2xl">{template.icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{template.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {getTypeLabel(template.type)}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel: Preview */}
          <div className="w-96 flex flex-col bg-muted/30">
            {previewTemplate ? (
              <>
                {/* Preview Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-3xl">{previewTemplate.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{previewTemplate.name}</h3>
                      <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {getTypeIcon(previewTemplate.type)}
                        <span className="text-xs text-muted-foreground">
                          {getTypeLabel(previewTemplate.type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleCreateFromTemplate(previewTemplate)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create from Template
                  </Button>
                </div>

                {/* Preview Content */}
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">PREVIEW</h4>
                    <div className="bg-white rounded-lg border border-border p-4">
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

