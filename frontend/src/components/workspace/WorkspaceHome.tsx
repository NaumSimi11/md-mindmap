/**
 * WorkspaceHome - Clean, Modern Workspace View
 * 
 * Features:
 * - Visual document cards (with previews)
 * - Minimal quick actions
 * - Clean spacing (no rigid borders)
 * - Modern, fluid design
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus,
  FileText,
  Brain,
  Presentation,
  ArrowRight,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Document } from '@/services/workspace-legacy/BackendWorkspaceService';
import { QuickSwitcher } from './QuickSwitcher';
import { documentTemplates_service, type DocumentTemplate } from '@/services/workspace-legacy/DocumentTemplates';

interface WorkspaceHomeProps {
  onDocumentSelect: (documentId: string) => void;
  onNewDocument: () => void;
  onLoadDemo?: () => void;
  documents?: Document[]; // 🔥 Now passed from parent
  createDocument?: (type: 'markdown' | 'mindmap' | 'presentation', title: string, content: string) => Promise<any>;
}

export function WorkspaceHome({
  onDocumentSelect,
  onNewDocument,
  onLoadDemo,
  documents = [],
  createDocument,
}: WorkspaceHomeProps) {
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);

  const hasAnyDocs = documents.length > 0;

  // Get recent and starred from passed documents.
  // Fallback: if lastOpenedAt is missing (common today), use updatedAt.
  const recentDocs = hasAnyDocs
    ? [...documents]
        .sort((a, b) => {
          const aTime =
            a.lastOpenedAt?.getTime?.() ??
            (a.updatedAt ? new Date(a.updatedAt as any).getTime() : 0);
          const bTime =
            b.lastOpenedAt?.getTime?.() ??
            (b.updatedAt ? new Date(b.updatedAt as any).getTime() : 0);
          return bTime - aTime;
        })
        .slice(0, 8)
    : [];
  
  const starredDocs = documents.filter(d => d.starred).slice(0, 4);

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'markdown':
        return <FileText className="h-5 w-5 text-blue-400" />;
      case 'mindmap':
        return <Brain className="h-5 w-5 text-sky-400" />;
      case 'presentation':
        return <Presentation className="h-5 w-5 text-blue-400" />;
    }
  };

  const getDocumentTypeLabel = (type: Document['type']) => {
    switch (type) {
      case 'markdown':
        return 'Document';
      case 'mindmap':
        return 'Mindmap';
      case 'presentation':
        return 'Presentation';
    }
  };

  const allTemplates = documentTemplates_service.getAll();
  const featuredTemplates: DocumentTemplate[] = allTemplates.slice(0, 10);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const featured = featuredTemplates[featuredIndex] || allTemplates[0];
  const galleryTemplates: DocumentTemplate[] = allTemplates.slice(0, 18);

  const handlePrev = () => {
    if (featuredTemplates.length === 0) return;
    setFeaturedIndex((i) => (i - 1 + featuredTemplates.length) % featuredTemplates.length);
  };

  const handleNext = () => {
    if (featuredTemplates.length === 0) return;
    setFeaturedIndex((i) => (i + 1) % featuredTemplates.length);
  };

  const formatType = (type: DocumentTemplate['type']) => {
    switch (type) {
      case 'markdown':
        return 'Document';
      case 'mindmap':
        return 'Mindmap';
      case 'presentation':
        return 'Presentation';
      default:
        return 'Template';
    }
  };

  const getPreviewSnippet = (template: DocumentTemplate) => {
    if (template.type !== 'markdown') {
      return `Type: ${formatType(template.type)}\nCategory: ${template.category}\nTags: ${template.tags.join(', ')}`;
    }
    const cleaned = template.content.replace(/\r/g, '').trim();
    return cleaned.length > 420 ? `${cleaned.slice(0, 420)}…` : cleaned;
  };

  const handleCreateFromFeatured = async () => {
    if (!featured) return;
    if (!createDocument) {
      // fallback to modal
      onNewDocument();
      return;
    }
    try {
      const title = featured.name;
      const doc = await createDocument(featured.type, title, featured.content);
      if (doc?.id) onDocumentSelect(doc.id);
    } catch (e) {
      // Keep it simple: fall back to modal if creation fails
      console.error('Failed to create from template:', e);
      onNewDocument();
    }
  };

  const TemplateThumb = ({ template, active, onClick }: { template: DocumentTemplate; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={[
        "group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left min-w-[220px]",
        active
          ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]"
          : "border-border/40 bg-card/30 hover:bg-card/50 hover:border-blue-500/30",
      ].join(' ')}
      title={template.name}
    >
      <div className="text-lg">{template.icon}</div>
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">
          {template.name}
        </div>
        <div className="text-[11px] text-muted-foreground truncate">
          {formatType(template.type)} • {template.category}
        </div>
      </div>
    </button>
  );

  const TemplateMini = ({
    template,
    active,
    onClick,
  }: {
    template: DocumentTemplate;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={[
        "group flex items-start gap-3 p-3 rounded-2xl border text-left transition-all",
        active
          ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]"
          : "border-border/35 bg-card/25 hover:bg-card/45 hover:border-blue-500/25",
      ].join(" ")}
      title={template.name}
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-border/40 flex items-center justify-center text-lg shrink-0">
        {template.icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">
          {template.name}
        </div>
        <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
          {template.description}
        </div>
      </div>
    </button>
  );

  return (
    <div className="flex-1 relative overflow-auto">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Recent Documents - Visual Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground opacity-70" />
              <h2 className="text-lg font-semibold">Recent</h2>
            </div>
            {recentDocs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickSwitcher(true)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View all
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>

          {hasAnyDocs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onDocumentSelect(doc.id)}
                  className="group relative p-3 rounded-xl border border-border/40 bg-card/50 hover:border-blue-500/40 hover:bg-card/70 transition-all text-left overflow-hidden backdrop-blur-sm"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-sky-500/0 group-hover:from-blue-500/10 group-hover:to-sky-500/10 transition-all" />
                  
                  <div className="relative z-10">
                    {/* Compact header row: icon + title on one line */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                          {getDocumentIcon(doc.type)}
                        </div>
                        <h3 className="font-semibold truncate group-hover:text-blue-400 transition-colors">
                          {doc.title}
                        </h3>
                      </div>
                      {doc.starred && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {getDocumentTypeLabel(doc.type)}
                      {(doc.lastOpenedAt || doc.updatedAt) && (
                        <>
                          {' • '}
                          <span>
                            {new Date((doc.lastOpenedAt || doc.updatedAt) as any).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </p>
                    {/* Content preview */}
                    {doc.content && doc.type === 'markdown' && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.content.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-muted/10 backdrop-blur-sm border border-border/30 p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Use the templates below or create a blank document.
              </p>
              <Button
                onClick={onNewDocument}
                className="bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Document
              </Button>
            </div>
          )}
        </div>

        {/* WOW: Template Hero Carousel (always visible) */}
        {featured && (
          <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/30 backdrop-blur-sm">
            {/* Animated backdrop */}
            <div className="absolute inset-0">
              <div className="absolute -inset-24 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(14,165,233,0.14),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.12),transparent_45%)] motion-safe:animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-br from-background/0 via-background/10 to-background/30" />
            </div>

            <div className="relative p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-[260px]">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground mb-3">
                    <span className="px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                      Template Carousel
                    </span>
                    <span className="opacity-70">Use arrows or thumbnails</span>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-border/40 flex items-center justify-center text-2xl">
                      {featured.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-2xl font-semibold leading-tight">
                        {featured.name}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground max-w-xl">
                        {featured.description}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="px-2 py-1 rounded-full bg-muted/40 border border-border/40">
                          {formatType(featured.type)}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-muted/40 border border-border/40">
                          {featured.category}
                        </span>
                      </div>

                      <div className="mt-5 flex items-center gap-3">
                        <Button
                          onClick={handleCreateFromFeatured}
                          className="bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-[0_10px_30px_rgba(59,130,246,0.18)]"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create from Featured
                        </Button>
                        <button
                          onClick={onNewDocument}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Browse all templates →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview pane */}
                <div className="flex-1 min-w-[320px] max-w-[560px]">
                  <div className="rounded-2xl border border-border/40 bg-background/40 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                      <div className="text-xs font-semibold text-muted-foreground">Preview</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrev}
                          className="h-9 w-9 rounded-xl border border-border/40 bg-background/30 hover:bg-background/50 transition-colors flex items-center justify-center"
                          title="Previous"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleNext}
                          className="h-9 w-9 rounded-xl border border-border/40 bg-background/30 hover:bg-background/50 transition-colors flex items-center justify-center"
                          title="Next"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      {/* Fixed-height preview so large templates don't push the layout down */}
                      <div className="max-h-[240px] overflow-y-auto pr-2">
                        <pre className="text-xs whitespace-pre-wrap leading-relaxed text-muted-foreground">
                          {getPreviewSnippet(featured)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* More templates grid (keeps options visible while preview is on-screen) */}
              {galleryTemplates.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-muted-foreground">
                      More templates
                    </div>
                    <button
                      onClick={onNewDocument}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Open template gallery →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {galleryTemplates.map((t) => {
                      const idx = featuredTemplates.findIndex((ft) => ft.id === t.id);
                      const isActive = idx === featuredIndex;
                      return (
                        <TemplateMini
                          key={t.id}
                          template={t}
                          active={isActive}
                          onClick={() => {
                            // if this template is in the featured set, select it; otherwise fall back to opening modal
                            if (idx >= 0) setFeaturedIndex(idx);
                            else onNewDocument();
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Switcher */}
      <QuickSwitcher
        isOpen={showQuickSwitcher}
        onDocumentSelect={onDocumentSelect}
        onClose={() => setShowQuickSwitcher(false)}
      />
    </div>
  );
}

